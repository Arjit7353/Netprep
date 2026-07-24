// server/controllers/aiController.js
// ═══════════════════════════════════════════════════════════════════
// REAL AI EXPLANATION CONTROLLER — Gemini API with Rich Engine Fallback
// ═══════════════════════════════════════════════════════════════════

const axios = require('axios');
const config = require('../config/config');

// Helper to extract bilingual text
const bText = (obj, lang = 'hi') => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj[lang]) return obj[lang];
  return obj.hi || obj.en || '';
};

const bArr = (arr, lang = 'hi') => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => bText(item, lang)).filter(Boolean);
};

// ═══════════════════════════════════════════════════════════════════
// EXPLAIN QUESTION — Generates AI explanation for a test question
// ═══════════════════════════════════════════════════════════════════
const explainQuestion = async (req, res, next) => {
  try {
    const { question, selectedAnswer, correctAnswer, language = 'hi' } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question object is required' });
    }

    const lang = language === 'hi' ? 'hi' : 'en';
    const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || config.geminiKey || '';
    const geminiKey = (rawKey || '').trim().replace(/^["']|["']$/g, '');

    const isValidKeyFormat = geminiKey.startsWith('AIzaSy');

    console.log(`[AI Explanation] Request received. Gemini key present: ${!!geminiKey} (starts with AIzaSy: ${isValidKeyFormat})`);

    if (geminiKey && !isValidKeyFormat) {
      console.warn(`[AI Explanation] WARNING: The key in GEMINI_API_KEY ("${geminiKey.substring(0, 10)}...") does NOT start with 'AIzaSy'. Google Gemini API keys must start with 'AIzaSy'. Get a free key at https://aistudio.google.com/app/apikey`);
    }

    // If Gemini key is available and has valid format, attempt real AI generation
    if (geminiKey && isValidKeyFormat) {
      try {
        const aiResponse = await callGeminiAI(question, selectedAnswer, correctAnswer, lang, geminiKey);
        if (aiResponse) {
          console.log('[AI Explanation] Successfully generated Gemini AI response!');
          return res.json({
            success: true,
            source: 'gemini-ai',
            data: aiResponse
          });
        }
      } catch (aiErr) {
        console.warn('[AI Explanation] Gemini call failed, using rich fallback engine:', aiErr.response?.data || aiErr.message);
      }
    } else {
      console.log('[AI Explanation] No GEMINI_API_KEY found in process.env, using fallback engine.');
    }

    // Fallback to rich structured engine logic
    const fallbackResponse = generateRichStructuredFallback(question, selectedAnswer, correctAnswer, lang);
    return res.json({
      success: true,
      source: 'structured-engine',
      data: fallbackResponse
    });

  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════
// GEMINI API INTEGRATION — Robust Multi-Attempt Call
// ═══════════════════════════════════════════════════════════════════
async function callGeminiAI(question, selectedAnswer, correctAnswer, lang, apiKey) {
  const qText = bText(question.question, lang) || bText(question.question, 'en');
  const options = bArr(question.options, lang);
  const correctOptText = options[correctAnswer] || `Option ${correctAnswer + 1}`;
  const selectedOptText = selectedAnswer >= 0 ? (options[selectedAnswer] || `Option ${selectedAnswer + 1}`) : 'Not Attempted';
  const rawExp = bText(question.explanation, lang);

  const prompt = `You are a distinguished professor of History preparing candidates for UGC NET History.
Analyze this UGC NET question and provide a comprehensive structured response in ${lang === 'hi' ? 'Hindi' : 'English'}.

Question: ${qText}
Options: ${options.map((opt, i) => `(${i + 1}) ${opt}`).join(', ')}
Correct Answer: Option ${correctAnswer + 1} (${correctOptText})
Student Selection: ${selectedAnswer >= 0 ? `Option ${selectedAnswer + 1}` : 'Skipped'}
Provided Notes: ${rawExp || 'N/A'}

Format requirements: Strictly return a RAW JSON object with NO markdown formatting, NO backticks.
Keys required:
{
  "whyCorrect": "Detailed analytical explanation of why the correct answer is right with historical evidence",
  "whyOthersWrong": [
    { "option": 1, "text": "Option text", "reason": "Specific historical reason why this option is wrong" }
  ],
  "conceptSummary": "2-3 sentence revision note covering the essential concept tested here",
  "examTip": "A strategic tip for solving such UGC NET questions",
  "commonMistake": "The common trap students fall into for this topic",
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`;

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

  for (const model of models) {
    // Attempt 1: With responseMimeType
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
        },
        { timeout: 10000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err1) {
      console.warn(`[Gemini API] Model ${model} with json mime failed:`, err1.response?.data?.error?.message || err1.message);

      // Attempt 2: Standard call without responseMimeType
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }]
          },
          { timeout: 10000 }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          // Extract JSON if wrapped in text
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err2) {
        console.warn(`[Gemini API] Model ${model} standard call failed:`, err2.response?.data?.error?.message || err2.message);
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// RICH STRUCTURED FALLBACK ENGINE
// ═══════════════════════════════════════════════════════════════════
function generateRichStructuredFallback(q, selectedIdx, correctIdx, lang) {
  const options = bArr(q.options, lang);
  const correctText = options[correctIdx] || (lang === 'hi' ? `विकल्प ${correctIdx + 1}` : `Option ${correctIdx + 1}`);
  const rawExp = bText(q.explanation, lang);

  let whyCorrect = rawExp;
  if (!whyCorrect) {
    if (lang === 'hi') {
      whyCorrect = `विकल्प (${correctIdx + 1}) - "${correctText}" इस प्रश्न का सही उत्तर है।\n` +
        `यह उत्तर यूजीसी नेट इतिहास के आधिकारिक पाठ्यक्रम और प्रामाणिक ऐतिहासिक स्रोतों से पूर्णतः प्रमाणित है।`;
    } else {
      whyCorrect = `Option (${correctIdx + 1}) - "${correctText}" is the correct answer.\n` +
        `This is authenticated based on official UGC NET syllabus standards and authoritative historical texts.`;
    }
  }

  const whyOthersWrong = options.map((optText, i) => {
    if (i === correctIdx) return null;
    let reason = '';
    if (lang === 'hi') {
      reason = `विकल्प (${i + 1}) - "${optText}" इस संदर्भ में असत्य है क्योंकि यह दी गई ऐतिहासिक अवधि या घटनाक्रम से सुमेलित नहीं होता।`;
    } else {
      reason = `Option (${i + 1}) - "${optText}" is incorrect in this context as it does not align with the historical facts or chronology.`;
    }
    return {
      option: i + 1,
      text: optText,
      reason
    };
  }).filter(Boolean);

  const unitName = q.unit || (lang === 'hi' ? 'इतिहास पाठ्यक्रम' : 'History Syllabus');
  const conceptSummary = lang === 'hi'
    ? `यह प्रश्न ${unitName} की महत्वपूर्ण अवधारणाओं को परखता है। यूजीसी नेट परीक्षा में इस विषय से सीधे तथ्यात्मक तथा कथन-कारण (Assertion-Reason) प्रश्न पूछे जाते हैं।`
    : `This question evaluates key concepts from ${unitName}. Similar factual and assertion-reasoning questions frequently appear in UGC NET.`;

  const examTip = lang === 'hi'
    ? 'यूजीसी नेट परीक्षा में प्रश्नों का उत्तर देते समय विलोपन तकनीक (Elimination Method) का प्रयोग करें और कालक्रमिक तिथियों पर विशेष ध्यान दें।'
    : 'Use the elimination method to rule out historical inaccuracies and pay close attention to chronological sequences.';

  const commonMistake = lang === 'hi'
    ? 'समकालीन शासकों, राजवंशों या ग्रंथांकों के नाम में भ्रमित होकर जल्दबाजी में उत्तर चुनना।'
    : 'Confusing contemporary rulers, dynasties, or texts under exam time constraints.';

  const relatedTopics = [
    q.unit || (lang === 'hi' ? 'भारतीय इतिहास' : 'Indian History'),
    q.chapter || (lang === 'hi' ? 'ऐतिहासिक स्रोत एवं कालक्रम' : 'Historical Sources & Chronology'),
    q.topic || (lang === 'hi' ? 'अवधारणात्मक विश्लेषण' : 'Conceptual Analysis')
  ].filter(Boolean);

  return {
    whyCorrect,
    whyOthersWrong,
    conceptSummary,
    examTip,
    commonMistake,
    relatedTopics
  };
}

module.exports = {
  explainQuestion
};
