// client/src/utils/aiDoubtResolver.js
// ═══════════════════════════════════════════════════════════════════════════════
// AI DOUBT RESOLVER ENGINE v1.0
// Pure client-side explanation engine — zero API calls, instant results.
// Generates structured, bilingual explanations for every question type.
// ═══════════════════════════════════════════════════════════════════════════════

const HINDI_RE = /[\u0900-\u097F]/;

const bText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const primary = obj[lang] || '';
  const fallback = obj[lang === 'hi' ? 'en' : 'hi'] || '';
  return primary.trim() || fallback.trim() || '';
};

const bArr = (obj, lang) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  const primary = Array.isArray(obj[lang]) ? obj[lang] : [];
  const fallback = Array.isArray(obj[lang === 'hi' ? 'en' : 'hi']) ? obj[lang === 'hi' ? 'en' : 'hi'] : [];
  return primary.length > 0 ? primary : fallback;
};

const optLabel = (i) => String.fromCharCode(65 + i);

// ═══════════════════════════════════════════════════════════════
// QUESTION TYPE SPECIFIC ANALYZERS
// ═══════════════════════════════════════════════════════════════

function analyzeMCQ(question, correctAnswer, selectedAnswer, lang) {
  const options = bArr(question.options, lang);
  const correctOpt = options[correctAnswer] || `Option ${optLabel(correctAnswer)}`;
  const explanation = bText(question.explanation, lang);

  const whyCorrect = explanation
    ? explanation
    : lang === 'hi'
      ? `सही उत्तर विकल्प ${optLabel(correctAnswer)} है: "${correctOpt}". यह प्रश्न में दी गई जानकारी के अनुसार सबसे सटीक उत्तर है।`
      : `The correct answer is Option ${optLabel(correctAnswer)}: "${correctOpt}". This is the most accurate answer based on the information given in the question.`;

  const whyOthersWrong = options.map((opt, i) => {
    if (i === correctAnswer) return null;
    return {
      option: optLabel(i),
      text: opt,
      reason: lang === 'hi'
        ? `विकल्प ${optLabel(i)} गलत है क्योंकि यह प्रश्न की शर्तों को पूरा नहीं करता।`
        : `Option ${optLabel(i)} is incorrect as it does not satisfy the conditions of the question.`,
    };
  }).filter(Boolean);

  return { whyCorrect, whyOthersWrong };
}

function analyzeAssertionReason(question, correctAnswer, selectedAnswer, lang) {
  const arData = question.assertionReasonData || {};
  const assertion = bText(arData.assertion, lang) || (lang === 'hi' ? 'अभिकथन' : 'Assertion');
  const reason = bText(arData.reason, lang) || (lang === 'hi' ? 'कारण' : 'Reason');
  const explanation = bText(question.explanation, lang);

  const arLabels = [
    { en: 'Both (A) and (R) are true, and (R) is the correct explanation of (A)', hi: '(A) और (R) दोनों सही हैं, और (R), (A) की सही व्याख्या है' },
    { en: 'Both (A) and (R) are true, but (R) is NOT the correct explanation of (A)', hi: '(A) और (R) दोनों सही हैं, परंतु (R), (A) की सही व्याख्या नहीं है' },
    { en: '(A) is true, but (R) is false', hi: '(A) सही है, परंतु (R) गलत है' },
    { en: '(A) is false, but (R) is true', hi: '(A) गलत है, परंतु (R) सही है' },
  ];

  const correctLabel = arLabels[correctAnswer]?.[lang] || '';
  const assertionAnalysis = analyzeAssertionTruth(correctAnswer, lang);
  const reasonAnalysis = analyzeReasonTruth(correctAnswer, lang);

  const whyCorrect = explanation || (lang === 'hi'
    ? `सही उत्तर: "${correctLabel}"।\n\n📌 अभिकथन (A) विश्लेषण: ${assertionAnalysis}\n📌 कारण (R) विश्लेषण: ${reasonAnalysis}`
    : `Correct Answer: "${correctLabel}".\n\n📌 Assertion (A) Analysis: ${assertionAnalysis}\n📌 Reason (R) Analysis: ${reasonAnalysis}`);

  const whyOthersWrong = arLabels.map((label, i) => {
    if (i === correctAnswer) return null;
    return {
      option: optLabel(i),
      text: label[lang],
      reason: lang === 'hi'
        ? `यह गलत है क्योंकि अभिकथन और कारण का यह संबंध प्रश्न के अनुसार सही नहीं है।`
        : `This is incorrect because the relationship between assertion and reason described here doesn't match the facts.`,
    };
  }).filter(Boolean);

  return { whyCorrect, whyOthersWrong };
}

function analyzeAssertionTruth(correctAnswer, lang) {
  const truthMap = {
    0: { en: 'Assertion is TRUE', hi: 'अभिकथन सत्य है' },
    1: { en: 'Assertion is TRUE', hi: 'अभिकथन सत्य है' },
    2: { en: 'Assertion is TRUE', hi: 'अभिकथन सत्य है' },
    3: { en: 'Assertion is FALSE', hi: 'अभिकथन असत्य है' },
  };
  return truthMap[correctAnswer]?.[lang] || '';
}

function analyzeReasonTruth(correctAnswer, lang) {
  const truthMap = {
    0: { en: 'Reason is TRUE and correctly explains Assertion', hi: 'कारण सत्य है और अभिकथन की सही व्याख्या करता है' },
    1: { en: 'Reason is TRUE but does NOT explain Assertion', hi: 'कारण सत्य है परंतु अभिकथन की सही व्याख्या नहीं करता' },
    2: { en: 'Reason is FALSE', hi: 'कारण असत्य है' },
    3: { en: 'Reason is TRUE', hi: 'कारण सत्य है' },
  };
  return truthMap[correctAnswer]?.[lang] || '';
}

function analyzeMatchFollowing(question, correctAnswer, selectedAnswer, lang) {
  const matchData = question.matchData || {};
  const listA = bArr(matchData.listA, lang);
  const listB = bArr(matchData.listB, lang);
  const correctMatch = matchData.correctMatch || [];
  const explanation = bText(question.explanation, lang);

  let matchPairs = '';
  listA.forEach((a, i) => {
    const bIdx = correctMatch[i];
    const bItem = listB[bIdx] || listB[i] || '?';
    matchPairs += `  ${String.fromCharCode(65 + i)}. ${a} → ${bIdx !== undefined ? (bIdx + 1) : '?'}. ${bItem}\n`;
  });

  const whyCorrect = explanation || (lang === 'hi'
    ? `सही सुमेलन:\n${matchPairs}\nये जोड़ियां ऐतिहासिक तथ्यों और पाठ्यक्रम सामग्री के अनुसार सही हैं।`
    : `Correct Matching:\n${matchPairs}\nThese pairs are correct according to historical facts and syllabus content.`);

  return { whyCorrect, whyOthersWrong: [] };
}

function analyzeSequenceOrder(question, correctAnswer, selectedAnswer, lang) {
  const seqData = question.sequenceData || {};
  const items = bArr(seqData.items, lang);
  const correctOrder = seqData.correctOrder || [];
  const explanation = bText(question.explanation, lang);

  let orderStr = '';
  correctOrder.forEach((idx, pos) => {
    const item = items[idx] || `Item ${idx + 1}`;
    orderStr += `  ${pos + 1}. ${item}\n`;
  });

  const whyCorrect = explanation || (lang === 'hi'
    ? `सही कालानुक्रम:\n${orderStr}\nयह क्रम ऐतिहासिक तिथियों और घटनाओं के कालानुक्रमिक क्रम पर आधारित है।`
    : `Correct Chronological Order:\n${orderStr}\nThis sequence is based on the chronological order of historical dates and events.`);

  return { whyCorrect, whyOthersWrong: [] };
}

function analyzeStatementBased(question, correctAnswer, selectedAnswer, lang) {
  const stData = question.statementData || {};
  const statements = bArr(stData.statements, lang);
  const correctStatements = stData.correctStatements || [];
  const explanation = bText(question.explanation, lang);

  let analysis = '';
  statements.forEach((stmt, i) => {
    const isCorrect = correctStatements.includes(i);
    analysis += `  ${i + 1}. ${stmt} — ${isCorrect ? (lang === 'hi' ? '✅ सही' : '✅ Correct') : (lang === 'hi' ? '❌ गलत' : '❌ Incorrect')}\n`;
  });

  const whyCorrect = explanation || (lang === 'hi'
    ? `कथन विश्लेषण:\n${analysis}`
    : `Statement Analysis:\n${analysis}`);

  return { whyCorrect, whyOthersWrong: [] };
}

// ═══════════════════════════════════════════════════════════════
// CONCEPT SUMMARY GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateConceptSummary(question, lang) {
  const topic = question.topic || question.chapter || question.unit || '';
  const explanation = bText(question.explanation, lang);

  if (explanation && explanation.length > 30) {
    const sentences = explanation.split(/[।.!?]/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 3).join('. ').trim();
    if (summary) return summary + '.';
  }

  return lang === 'hi'
    ? `यह प्रश्न "${topic}" विषय से संबंधित है। इस टॉपिक को NCERT और UGC NET सिलेबस के अनुसार अच्छे से पढ़ें। पिछले वर्षों के प्रश्नपत्रों में इस टॉपिक से बार-बार प्रश्न पूछे गए हैं।`
    : `This question relates to "${topic}". Study this topic thoroughly from NCERT and UGC NET syllabus. Questions from this topic appear frequently in previous year papers.`;
}

// ═══════════════════════════════════════════════════════════════
// EXAM STRATEGY TIP GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateExamTip(question, lang) {
  const type = question.questionType || 'mcq';
  const tips = {
    mcq: {
      en: 'For MCQs, always eliminate 2 obviously wrong options first. This improves your probability from 25% to 50% even when guessing.',
      hi: 'MCQ के लिए, पहले 2 स्पष्ट रूप से गलत विकल्पों को हटाएं। अनुमान लगाते समय भी यह आपकी संभावना 25% से 50% तक बढ़ा देता है।'
    },
    assertion_reason: {
      en: 'For Assertion-Reason: First evaluate Assertion independently, then Reason independently. Only then check if Reason explains Assertion. This prevents confusion.',
      hi: 'अभिकथन-कारण के लिए: पहले अभिकथन का स्वतंत्र रूप से मूल्यांकन करें, फिर कारण का। तभी जांचें कि कारण अभिकथन की व्याख्या करता है या नहीं।'
    },
    match_following: {
      en: 'For Match Following: Start with the pair you are 100% sure about, then eliminate from remaining options. This narrows down uncertain matches.',
      hi: 'सुमेलन के लिए: उस जोड़ी से शुरू करें जिसके बारे में आप 100% आश्वस्त हैं, फिर शेष विकल्पों से हटाएं।'
    },
    sequence_order: {
      en: 'For Chronology/Sequence: Focus on the first and last events — they are easiest to identify. The middle ones are where mistakes happen.',
      hi: 'कालानुक्रम के लिए: पहली और आखिरी घटना पर ध्यान दें — ये पहचानना सबसे आसान है। बीच वाली घटनाओं में गलतियां होती हैं।'
    },
    statement_based: {
      en: 'For Statement-Based: Check each statement independently as TRUE/FALSE before looking at options. Mark your own assessment first, then match with options.',
      hi: 'कथन-आधारित के लिए: विकल्प देखने से पहले प्रत्येक कथन का स्वतंत्र रूप से सत्य/असत्य मूल्यांकन करें।'
    },
    passage_based: {
      en: 'For Passage-Based: Read the question FIRST, then the passage. This helps you focus on relevant parts and saves time.',
      hi: 'गद्यांश-आधारित के लिए: पहले प्रश्न पढ़ें, फिर गद्यांश। इससे आप प्रासंगिक भागों पर ध्यान केंद्रित कर सकते हैं।'
    },
  };

  const diTip = {
    en: 'For Data Interpretation: Read all column headers and units carefully. Calculate one value to verify your understanding of the data before attempting all questions.',
    hi: 'डेटा इंटरप्रिटेशन के लिए: सभी कॉलम हेडर और इकाइयों को ध्यान से पढ़ें। सभी प्रश्नों का प्रयास करने से पहले एक मान की गणना करके डेटा की समझ सत्यापित करें।'
  };

  return tips[type]?.[lang] || (type.startsWith('di_') ? diTip[lang] : tips.mcq[lang]);
}

// ═══════════════════════════════════════════════════════════════
// COMMON MISTAKE GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateCommonMistake(question, selectedAnswer, correctAnswer, lang) {
  const type = question.questionType || 'mcq';

  if (selectedAnswer === -1) {
    return lang === 'hi'
      ? 'इस प्रश्न को छोड़ा गया। UGC NET में कोई नकारात्मक अंकन नहीं है (Paper 1 & 2), इसलिए हर प्रश्न का प्रयास करें।'
      : 'This question was skipped. There is no negative marking in UGC NET (Paper 1 & 2), so always attempt every question.';
  }

  const mistakes = {
    mcq: {
      en: 'Common mistake: Selecting an option that seems partially correct without reading all options. Always read ALL 4 options before selecting.',
      hi: 'सामान्य गलती: सभी विकल्प पढ़े बिना आंशिक रूप से सही लगने वाला विकल्प चुनना। चुनने से पहले हमेशा सभी 4 विकल्प पढ़ें।'
    },
    assertion_reason: {
      en: 'Common mistake: Assuming that if both A and R are true, R must explain A. They can be independently true without a causal relationship.',
      hi: 'सामान्य गलती: यह मानना कि अगर A और R दोनों सही हैं, तो R, A की व्याख्या करता ही है। वे बिना कारणात्मक संबंध के स्वतंत्र रूप से सत्य हो सकते हैं।'
    },
    match_following: {
      en: 'Common mistake: Matching by proximity or intuition. Always verify each pair with specific knowledge rather than gut feeling.',
      hi: 'सामान्य गलती: अंतर्ज्ञान से मिलान करना। हमेशा विशिष्ट ज्ञान से प्रत्येक जोड़ी को सत्यापित करें।'
    },
    sequence_order: {
      en: 'Common mistake: Confusing events that are close in time (e.g., battles within the same decade). Focus on exact years, not approximate periods.',
      hi: 'सामान्य गलती: समय में निकट की घटनाओं को भ्रमित करना। अनुमानित अवधियों की बजाय सटीक वर्षों पर ध्यान दें।'
    },
    statement_based: {
      en: 'Common mistake: Getting confused between "correct statements" and "incorrect statements" — read the question stem carefully to know what is being asked.',
      hi: 'सामान्य गलती: "सही कथन" और "गलत कथन" के बीच भ्रम — प्रश्न को ध्यान से पढ़ें कि क्या पूछा जा रहा है।'
    },
  };

  return mistakes[type]?.[lang] || mistakes.mcq[lang];
}

// ═══════════════════════════════════════════════════════════════
// RELATED TOPICS GENERATOR
// ═══════════════════════════════════════════════════════════════
function getRelatedTopics(question) {
  const topics = [];
  if (question.unit) topics.push(question.unit);
  if (question.chapter) topics.push(question.chapter);
  if (question.topic) topics.push(question.topic);
  if (question.subtopic) topics.push(question.subtopic);
  if (question.tags?.length) topics.push(...question.tags.slice(0, 3));
  return [...new Set(topics)].slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT: GENERATE DOUBT RESOLUTION
// ═══════════════════════════════════════════════════════════════
export function generateDoubtResolution(question, selectedAnswer, correctAnswer, language = 'hi') {
  if (!question) return null;

  const type = question.questionType || 'mcq';
  let analysis;

  switch (type) {
    case 'assertion_reason':
      analysis = analyzeAssertionReason(question, correctAnswer, selectedAnswer, language);
      break;
    case 'match_following':
      analysis = analyzeMatchFollowing(question, correctAnswer, selectedAnswer, language);
      break;
    case 'sequence_order':
      analysis = analyzeSequenceOrder(question, correctAnswer, selectedAnswer, language);
      break;
    case 'statement_based':
      analysis = analyzeStatementBased(question, correctAnswer, selectedAnswer, language);
      break;
    default:
      analysis = analyzeMCQ(question, correctAnswer, selectedAnswer, language);
  }

  return {
    whyCorrect: analysis.whyCorrect,
    whyOthersWrong: analysis.whyOthersWrong,
    conceptSummary: generateConceptSummary(question, language),
    examTip: generateExamTip(question, language),
    commonMistake: generateCommonMistake(question, selectedAnswer, correctAnswer, language),
    relatedTopics: getRelatedTopics(question),
    difficulty: question.difficulty || 'medium',
    questionType: type,
  };
}
