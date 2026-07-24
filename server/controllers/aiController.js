// server/controllers/aiController.js
// ═══════════════════════════════════════════════════════════════════
// REAL AI EXPLANATION CONTROLLER — Dynamic Gemini API Engine
// Uses Official Google GenAI ListModels & Dynamic Model Execution
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

// Error categorization helpers
const isQuotaError = (err) => {
  const status = err.response?.status;
  const message = (err.response?.data?.error?.message || err.message || '').toLowerCase();
  const statusText = (err.response?.data?.error?.status || '').toUpperCase();

  if (status === 429) return true;
  if (statusText === 'RESOURCE_EXHAUSTED' || statusText === 'QUOTA_EXCEEDED') return true;
  if (
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('limit: 0') ||
    message.includes('suspended') ||
    message.includes('permission denied') ||
    message.includes('free_tier_requests')
  ) {
    return true;
  }
  return false;
};

const isNotFoundError = (err) => {
  const status = err.response?.status;
  const message = (err.response?.data?.error?.message || err.message || '').toLowerCase();
  const statusText = (err.response?.data?.error?.status || '').toUpperCase();

  if (status === 404) return true;
  if (statusText === 'NOT_FOUND') return true;
  if (message.includes('not found') || message.includes('is not found')) return true;
  return false;
};

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC MODEL DISCOVERY via official ListModels API
// ═══════════════════════════════════════════════════════════════════
const fetchSupportedModels = async (apiKey) => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url, { timeout: 8000 });
    const rawModels = response.data?.models || [];

    const supportedModels = rawModels
      .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name); // e.g. "models/gemini-2.0-flash", "models/gemini-1.5-flash-latest"

    if (supportedModels.length > 0) {
      console.log(`[Gemini ListModels] Dynamically discovered ${supportedModels.length} supported models:`, supportedModels);
      return supportedModels;
    }
  } catch (err) {
    if (isQuotaError(err)) {
      console.error('[Gemini ListModels Error]:', 'Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.');
      const quotaErr = new Error('Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.');
      quotaErr.isQuotaExhausted = true;
      throw quotaErr;
    }
    console.warn('[Gemini ListModels Warning]: Could not fetch models dynamically via ListModels:', err.response?.data?.error?.message || err.message);
  }

  return [];
};

// ═══════════════════════════════════════════════════════════════════
// STARTUP DIAGNOSTIC FUNCTION
// ═══════════════════════════════════════════════════════════════════
const runGeminiDiagnostics = async () => {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || config.geminiKey || '';
  const apiKey = (rawKey || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    console.log('[Gemini Diagnostic] No GEMINI_API_KEY set in process.env. Rich fallback engine active.');
    return;
  }

  console.log('[Gemini Diagnostic] Running Google GenAI ListModels diagnostic...');
  try {
    const models = await fetchSupportedModels(apiKey);
    if (models.length > 0) {
      console.log('[Gemini Diagnostic] Diagnostic successful! Supported models for generateContent:', models.join(', '));
    } else {
      console.log('[Gemini Diagnostic] ListModels completed but returned no generateContent models.');
    }
  } catch (err) {
    console.error('[Gemini Diagnostic Error]:', err.message);
  }
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

    console.log(`[AI Explanation] Request received. Gemini key present: ${!!geminiKey} (length: ${geminiKey.length})`);

    if (geminiKey) {
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
        if (aiErr.isQuotaExhausted || isQuotaError(aiErr)) {
          const quotaMessage = "Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.";
          console.error('[AI Explanation] Quota Exhausted:', quotaMessage);

          const fallbackResponse = generateRichStructuredFallback(question, selectedAnswer, correctAnswer, lang);
          return res.json({
            success: true,
            source: 'structured-engine-quota-exhausted',
            error: quotaMessage,
            message: quotaMessage,
            data: fallbackResponse
          });
        }

        console.warn('[AI Explanation] Gemini call failed, using rich fallback engine:', aiErr.response?.data?.error?.message || aiErr.message);
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
// GEMINI API INTEGRATION — Dynamic & Quota-Aware Model Caller
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

  // Dynamically discover supported models via ListModels endpoint
  let modelsToTry = await fetchSupportedModels(apiKey);

  if (!modelsToTry || modelsToTry.length === 0) {
    console.warn('[Gemini API] Dynamic ListModels returned 0 models or failed. Relying on fallback engine.');
    return null;
  }

  for (const modelPath of modelsToTry) {
    // modelPath can be "models/gemini-2.0-flash" or "models/gemini-1.5-flash-latest"
    const cleanModelPath = modelPath.startsWith('models/') ? modelPath : `models/${modelPath}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModelPath}:generateContent?key=${apiKey}`;

    try {
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
    } catch (err) {
      if (isQuotaError(err)) {
        console.error(`[Gemini API] Quota or resource limit exceeded for ${cleanModelPath}:`, 'Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.');
        const quotaErr = new Error('Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.');
        quotaErr.isQuotaExhausted = true;
        throw quotaErr;
      }

      if (isNotFoundError(err)) {
        console.warn(`[Gemini API] Model ${cleanModelPath} NOT_FOUND (404). Trying next supported model...`);
        continue;
      }

      // Secondary attempt without responseMimeType
      try {
        const response2 = await axios.post(
          url,
          { contents: [{ parts: [{ text: prompt }] }] },
          { timeout: 10000 }
        );

        const text2 = response2.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text2) {
          const cleaned2 = text2.replace(/```json/gi, '').replace(/```/g, '').trim();
          const jsonMatch = cleaned2.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        }
      } catch (err2) {
        if (isQuotaError(err2)) {
          console.error(`[Gemini API] Quota or resource limit exceeded for ${cleanModelPath}:`, 'Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.');
          const quotaErr = new Error('Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.');
          quotaErr.isQuotaExhausted = true;
          throw quotaErr;
        }

        if (isNotFoundError(err2)) {
          console.warn(`[Gemini API] Model ${cleanModelPath} NOT_FOUND (404) on standard attempt. Trying next supported model...`);
          continue;
        }

        console.warn(`[Gemini API] Model ${cleanModelPath} failed:`, err2.response?.data?.error?.message || err2.message);
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
  explainQuestion,
  runGeminiDiagnostics
};
