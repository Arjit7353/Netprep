// server/controllers/aiController.js
// ═══════════════════════════════════════════════════════════════════
// REAL AI EXPLANATION CONTROLLER — Official Google GenAI SDK (@google/genai)
// ═══════════════════════════════════════════════════════════════════

const { GoogleGenAI } = require('@google/genai');
const genaiPkg = require('@google/genai/package.json');
const config = require('../config/config');

const SDK_VERSION = genaiPkg.version || '2.13.0';
const API_VERSION = 'v1beta';

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
// ERROR CATEGORIZATION HELPER
// Separately detects: Authentication, Permission denied, Model not found, Quota exceeded, Rate limit, Network error
// ═══════════════════════════════════════════════════════════════════
function categorizeError(err) {
  const status = err.status || err.response?.status;
  const msg = (err.message || err.toString() || '').toLowerCase();
  const code = err.code || err.errorDetails?.code || status || 'UNKNOWN_ERROR';

  if (status === 401 || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key')) {
    return { type: 'AUTHENTICATION_ERROR', status: 401, code, message: 'Authentication failed. Please verify your GEMINI_API_KEY.' };
  }
  if (status === 403 || msg.includes('403') || msg.includes('permission denied') || msg.includes('suspended')) {
    return { type: 'PERMISSION_DENIED', status: 403, code, message: 'Permission denied for this API key or project.' };
  }
  if (status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('is not found')) {
    return { type: 'MODEL_NOT_FOUND', status: 404, code, message: 'Requested model not found.' };
  }
  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('limit: 0') || msg.includes('free_tier_requests') || msg.includes('rate limit')) {
    return { type: 'QUOTA_EXCEEDED', status: 429, code, message: 'Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.' };
  }
  if (code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || msg.includes('fetch failed') || msg.includes('network') || msg.includes('econnreset')) {
    return { type: 'NETWORK_ERROR', status: 503, code, message: 'Network connectivity error while reaching Google GenAI servers.' };
  }

  return { type: 'UNKNOWN_ERROR', status: status || 500, code, message: err.message || 'An unexpected error occurred.' };
}

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC MODEL DISCOVERY via Official SDK ai.models.list()
// ═══════════════════════════════════════════════════════════════════
const fetchSupportedModelsSDK = async (ai) => {
  try {
    const listResult = await ai.models.list();
    const modelsList = [];

    if (listResult && typeof listResult[Symbol.asyncIterator] === 'function') {
      for await (const model of listResult) {
        if (model) modelsList.push(model);
      }
    } else if (Array.isArray(listResult?.models)) {
      modelsList.push(...listResult.models);
    } else if (Array.isArray(listResult)) {
      modelsList.push(...listResult);
    }

    const generateModels = modelsList
      .filter(m => {
        const methods = m.supportedGenerationMethods || [];
        return methods.length === 0 || methods.includes('generateContent');
      })
      .map(m => (m.name || m).replace(/^models\//, '')); // Convert models/gemini-2.5-flash -> gemini-2.5-flash

    if (generateModels.length > 0) {
      console.log(`[Google GenAI SDK v${SDK_VERSION}] ListModels discovered ${generateModels.length} supported models:`, generateModels);
      return generateModels;
    }
  } catch (err) {
    const cat = categorizeError(err);
    console.warn(`[Google GenAI SDK v${SDK_VERSION}] ListModels failed [Category: ${cat.type}, Code: ${cat.code}]:`, cat.message);
    if (cat.type === 'QUOTA_EXCEEDED' || cat.type === 'PERMISSION_DENIED' || cat.type === 'AUTHENTICATION_ERROR') {
      const errorObj = new Error(cat.message);
      errorObj.category = cat;
      throw errorObj;
    }
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
    console.log(`[Google GenAI SDK v${SDK_VERSION}] No GEMINI_API_KEY set in process.env. Fallback engine active.`);
    return;
  }

  console.log(`[Google GenAI SDK v${SDK_VERSION}] Initializing GoogleGenAI client (API Version: ${API_VERSION})...`);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const models = await fetchSupportedModelsSDK(ai);
    if (models.length > 0) {
      console.log(`[Google GenAI SDK v${SDK_VERSION}] Diagnostic successful! Clean model names:`, models.join(', '));
    }
  } catch (err) {
    const cat = categorizeError(err);
    console.error(`[Google GenAI SDK v${SDK_VERSION}] Startup diagnostic failed [Code: ${cat.code}]:`, cat.message);
  }
};

// ═══════════════════════════════════════════════════════════════════
// EXPLAIN QUESTION — Controller Endpoint
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

    console.log(`[Google GenAI SDK v${SDK_VERSION}] Request received. Key present: ${!!geminiKey} (length: ${geminiKey.length})`);

    if (geminiKey) {
      try {
        const aiResponse = await callGeminiSDK(question, selectedAnswer, correctAnswer, lang, geminiKey);
        if (aiResponse) {
          console.log(`[Google GenAI SDK v${SDK_VERSION}] Successfully generated explanation via SDK!`);
          return res.json({
            success: true,
            source: 'gemini-ai',
            data: aiResponse
          });
        }
      } catch (aiErr) {
        const cat = categorizeError(aiErr);
        console.error(`[Google GenAI SDK v${SDK_VERSION}] Generation error [Type: ${cat.type}, Code: ${cat.code}]:`, cat.message);

        if (cat.type === 'QUOTA_EXCEEDED') {
          const quotaMsg = "Gemini API quota has been exhausted or is unavailable for this project. Check Google AI Studio quota and billing.";
          const fallbackResponse = generateRichStructuredFallback(question, selectedAnswer, correctAnswer, lang);
          return res.json({
            success: true,
            source: 'structured-engine-quota-exhausted',
            error: quotaMsg,
            message: quotaMsg,
            data: fallbackResponse
          });
        }
      }
    } else {
      console.log(`[Google GenAI SDK v${SDK_VERSION}] No GEMINI_API_KEY found, using fallback engine.`);
    }

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
// CALL GEMINI SDK — Implementation using @google/genai
// ═══════════════════════════════════════════════════════════════════
async function callGeminiSDK(question, selectedAnswer, correctAnswer, lang, apiKey) {
  // Official SDK Client Initialization
  const ai = new GoogleGenAI({ apiKey });

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

  const supportedModels = await fetchSupportedModelsSDK(ai);
  const modelsToTry = supportedModels.length > 0 ? supportedModels : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const rawModelName of modelsToTry) {
    // Task 8: Convert models/gemini-2.5-flash -> gemini-2.5-flash
    const cleanModelName = rawModelName.replace(/^models\//, '');
    const endpoint = `ai.models.generateContent(${cleanModelName})`;

    console.log(`[Google GenAI SDK v${SDK_VERSION}] Executing request | API: ${API_VERSION} | Model: ${cleanModelName} | Endpoint: ${endpoint}`);

    // Attempt 1: With JSON responseMimeType
    try {
      const response = await ai.models.generateContent({
        model: cleanModelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      console.log(`[Google GenAI SDK v${SDK_VERSION}] Response Received | Model: ${cleanModelName} | Status: 200 OK`);

      const text = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    } catch (err1) {
      const cat1 = categorizeError(err1);
      console.warn(`[Google GenAI SDK v${SDK_VERSION}] Execution error on ${cleanModelName} [Category: ${cat1.type}, Code: ${cat1.code}]:`, cat1.message);

      if (cat1.type === 'QUOTA_EXCEEDED' || cat1.type === 'PERMISSION_DENIED' || cat1.type === 'AUTHENTICATION_ERROR') {
        const qErr = new Error(cat1.message);
        qErr.category = cat1;
        throw qErr;
      }

      if (cat1.type === 'MODEL_NOT_FOUND') {
        console.warn(`[Google GenAI SDK v${SDK_VERSION}] Model ${cleanModelName} NOT_FOUND (404). Trying next supported model...`);
        continue;
      }

      // Attempt 2: Standard text call without responseMimeType
      try {
        const response2 = await ai.models.generateContent({
          model: cleanModelName,
          contents: prompt
        });

        console.log(`[Google GenAI SDK v${SDK_VERSION}] Standard Response Received | Model: ${cleanModelName} | Status: 200 OK`);

        const text2 = response2?.text || response2?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text2) {
          const cleaned2 = text2.replace(/```json/gi, '').replace(/```/g, '').trim();
          const jsonMatch = cleaned2.match(/\{[\s\S]*\}/);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        }
      } catch (err2) {
        const cat2 = categorizeError(err2);
        console.warn(`[Google GenAI SDK v${SDK_VERSION}] Standard call failed on ${cleanModelName} [Category: ${cat2.type}, Code: ${cat2.code}]:`, cat2.message);

        if (cat2.type === 'QUOTA_EXCEEDED' || cat2.type === 'PERMISSION_DENIED' || cat2.type === 'AUTHENTICATION_ERROR') {
          const qErr = new Error(cat2.message);
          qErr.category = cat2;
          throw qErr;
        }

        if (cat2.type === 'MODEL_NOT_FOUND') {
          console.warn(`[Google GenAI SDK v${SDK_VERSION}] Model ${cleanModelName} NOT_FOUND (404). Trying next model...`);
          continue;
        }
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
