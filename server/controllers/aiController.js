// server/controllers/aiController.js
// ═══════════════════════════════════════════════════════════════════
// REAL AI EXPLANATION CONTROLLER — Gemini API with Smart Engine Fallback
// ═══════════════════════════════════════════════════════════════════

const axios = require('axios');

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
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

    // If Gemini key is available, attempt real AI generation
    if (geminiKey) {
      try {
        const aiResponse = await callGeminiAI(question, selectedAnswer, correctAnswer, lang, geminiKey);
        if (aiResponse) {
          return res.json({
            success: true,
            source: 'gemini-ai',
            data: aiResponse
          });
        }
      } catch (aiErr) {
        console.warn('[AI Explanation] Gemini call failed, using fallback engine:', aiErr.message);
      }
    }

    // Fallback to structured engine logic
    const fallbackResponse = generateStructuredFallback(question, selectedAnswer, correctAnswer, lang);
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
// GEMINI API INTEGRATION
// ═══════════════════════════════════════════════════════════════════
async function callGeminiAI(question, selectedAnswer, correctAnswer, lang, apiKey) {
  const qText = bText(question.question, lang) || bText(question.question, 'en');
  const options = bArr(question.options, lang);
  const correctOptText = options[correctAnswer] || `Option ${correctAnswer + 1}`;
  const selectedOptText = selectedAnswer >= 0 ? (options[selectedAnswer] || `Option ${selectedAnswer + 1}`) : 'Not Attempted';
  const rawExp = bText(question.explanation, lang);

  const prompt = `You are an expert professor preparing students for UGC NET History Exam.
Analyze the following question and provide a structured JSON response in ${lang === 'hi' ? 'Hindi' : 'English'}.

Question: ${qText}
Options: ${options.map((opt, i) => `${i + 1}. ${opt}`).join(' | ')}
Correct Answer: Option ${correctAnswer + 1} (${correctOptText})
Student Selected: ${selectedAnswer >= 0 ? `Option ${selectedAnswer + 1} (${selectedOptText})` : 'Skipped'}
Existing Context: ${rawExp || 'N/A'}

Respond strictly in valid raw JSON with NO markdown formatting, NO backticks, and NO emojis.
Return an object with the following exact keys:
{
  "whyCorrect": "Detailed explanation of why the correct option is right",
  "whyOthersWrong": [
    { "option": 1, "text": "Option text", "reason": "Why this option is incorrect" }
  ],
  "conceptSummary": "A concise 2-3 sentence revision note on the core topic",
  "examTip": "A tactical tip for answering such questions in UGC NET",
  "commonMistake": "The common trap students fall into for this type of question",
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    },
    { timeout: 8000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  return parsed;
}

// ═══════════════════════════════════════════════════════════════════
// STRUCTURED FALLBACK ENGINE
// ═══════════════════════════════════════════════════════════════════
function generateStructuredFallback(q, selectedIdx, correctIdx, lang) {
  const options = bArr(q.options, lang);
  const correctText = options[correctIdx] || (lang === 'hi' ? `विकल्प ${correctIdx + 1}` : `Option ${correctIdx + 1}`);
  const rawExp = bText(q.explanation, lang);

  const whyCorrect = rawExp || (lang === 'hi'
    ? `विकल्प (${correctIdx + 1}) - "${correctText}" इस प्रश्न का सही उत्तर है क्योंकि यह यूजीसी नेट इतिहास के आधिकारिक उत्तर और ऐतिहासिक प्रमाणों से मेल खाता है।`
    : `Option (${correctIdx + 1}) - "${correctText}" is the correct answer based on official UGC NET answer keys and historical evidence.`);

  const whyOthersWrong = options.map((optText, i) => {
    if (i === correctIdx) return null;
    return {
      option: i + 1,
      text: optText,
      reason: lang === 'hi'
        ? `विकल्प (${i + 1}) गलत है क्योंकि इसका संबंध दिए गए ऐतिहासिक संदर्भ या कालक्रम से नहीं है।`
        : `Option (${i + 1}) is incorrect as it does not align with the historical context of the question.`
    };
  }).filter(Boolean);

  const conceptSummary = lang === 'hi'
    ? `यह प्रश्न ${q.unit || 'इतिहास'} के अंतर्गत आता है। यूजीसी नेट परीक्षा में इस विषय से सीधे और कथन-कारण आधारित प्रश्न पूछे जाते हैं।`
    : `This question falls under ${q.unit || 'History'}. Core concepts from this topic are frequently tested in UGC NET.`;

  const examTip = lang === 'hi'
    ? 'प्रश्न के मुख्य शब्दों और दिए गए विकल्पों का ध्यानपूर्वक विश्लेषण करें। विलोपन विधि (Elimination Method) का प्रयोग करें।'
    : 'Analyze key terminology carefully. Use the elimination method to rule out clearly incorrect statements.';

  const commonMistake = lang === 'hi'
    ? 'जल्दबाजी में मिलते-जुलते नाम या तिथियों में भ्रमित होना।'
    : 'Confusing similar names, dynasties, or chronologies under exam pressure.';

  const relatedTopics = [
    q.unit || (lang === 'hi' ? 'भारतीय इतिहास' : 'Indian History'),
    q.chapter || (lang === 'hi' ? 'महत्वपूर्ण कालक्रम' : 'Key Chronology'),
    q.topic || (lang === 'hi' ? 'इतिहास अवधारणाएं' : 'History Concepts')
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
