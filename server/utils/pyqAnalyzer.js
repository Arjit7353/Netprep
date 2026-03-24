// server/utils/pyqAnalyzer.js
// ═══════════════════════════════════════════════════════════════
// PYQ Analyzer v3.1 — Enhanced with pre-cleaning stuck words
// + Content-aware language detection
// + Field verification to ensure content matches field names
// ═══════════════════════════════════════════════════════════════

const mongoose = require('mongoose');

// ═══ GLOBAL CONSTANT ═══
const HINDI_PATTERN = /[\u0900-\u097F]/;

const ROMAN_MAP = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
const ROMAN_REVERSE = {};
Object.entries(ROMAN_MAP).forEach(([k, v]) => { ROMAN_REVERSE[v.toLowerCase()] = parseInt(k); });

function extractUnitNumberFromName(n) {
  if (!n) return null;
  const rm = n.match(/(?:unit|इकाई)\s*(i{1,3}|iv|v(?:i{0,3})|ix|x)/i);
  if (rm) return ROMAN_REVERSE[rm[1].toLowerCase()] || null;
  const nm = n.match(/(?:unit|इकाई)\s*(\d+)/i);
  return nm ? parseInt(nm[1]) : (n.match(/\d+/) ? parseInt(n.match(/\d+/)[0]) : null);
}
function unitNumberToId(n) { return `unit${n}`; }
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ═══════════════════════════════════════════════════
// UNIFIED TYPE DETECTION — from question object
// ═══════════════════════════════════════════════════
function detectQuestionType(q) {
  if (q.type) {
    const typeMap = {
      'mcq': 'mcq', 'simple_mcq': 'mcq', 'multiple_choice': 'mcq',
      'assertion_reason': 'assertion_reason', 'ar': 'assertion_reason', 'a-r': 'assertion_reason',
      'match_following': 'match_following', 'matching': 'match_following', 'match': 'match_following',
      'sequence_order': 'sequence_order', 'chronology': 'sequence_order', 'sequence': 'sequence_order',
      'statement_based': 'statement_based', 'multi_statement': 'statement_based', 'statements': 'statement_based',
      'passage': 'passage', 'passage_based': 'passage', 'comprehension': 'passage',
      'di_table': 'di_table', 'table': 'di_table',
      'di_bar_chart': 'di_bar_chart', 'bar_chart': 'di_bar_chart', 'bar': 'di_bar_chart',
      'di_pie_chart': 'di_pie_chart', 'pie_chart': 'di_pie_chart', 'pie': 'di_pie_chart',
      'di_line_graph': 'di_line_graph', 'line_graph': 'di_line_graph', 'line': 'di_line_graph',
      'di_caselet': 'di_caselet', 'caselet': 'di_caselet',
      'di_mixed': 'di_mixed', 'mixed': 'di_mixed'
    };
    return typeMap[q.type.toLowerCase()] || q.type;
  }

  if (q.assertion || q.assertionHi) return 'assertion_reason';
  if ((q.listA?.length > 0 || q.listAHi?.length > 0) && (q.listB?.length > 0 || q.listBHi?.length > 0)) return 'match_following';
  if ((q.items?.length > 0 || q.itemsHi?.length > 0) && q.correctOrder) return 'sequence_order';
  if ((q.statements?.length > 0 || q.statementsHi?.length > 0) && q.correctStatements) return 'statement_based';
  if (q.passage || q.passageHi) return 'passage';
  if (q.tableData?.headers?.length > 0 || q.tableData?.rows?.length > 0) return 'di_table';
  if (q.chartData?.datasets?.length > 0) {
    const ct = q.chartData.chartType || q.chartData.type;
    if (ct === 'pie' || ct === 'pie_chart') return 'di_pie_chart';
    if (ct === 'line' || ct === 'line_graph') return 'di_line_graph';
    return 'di_bar_chart';
  }
  if (q.caseletText || q.caseletTextHi) return 'di_caselet';
  if (q.questions?.length > 0 && (q.passage || q.passageHi || q.passageTitle)) return 'passage';
  if (q.questions?.length > 0 && (q.diTitle || q.tableData || q.chartData || q.caseletText)) return 'di_table';

  return 'mcq';
}

// ═══════════════════════════════════════════════════
// DETECT LANGUAGE — Analyzes CONTENT, not field names
// ═══════════════════════════════════════════════════
function detectLanguage(data) {
  const samples = [];
  const questions = data.questions || data.questionTopicMap || [];

  for (const q of questions.slice(0, 20)) {
    const textFields = [
      q.question, q.questionText, q.questionTextHi, q.questionTextEn,
      q.assertion, q.assertionHi, q.assertionEn,
      q.reason, q.reasonHi, q.reasonEn,
      q.passage, q.passageHi, q.passageEn,
      q.explanation, q.explanationHi, q.explanationEn,
      q.caseletText, q.caseletTextHi, q.caseletTextEn
    ];

    for (const f of textFields) {
      if (typeof f === 'string' && f.trim().length > 10) {
        samples.push(f);
      }
    }

    const arrayFields = [
      q.options, q.optionsHi, q.optionsEn,
      q.statements, q.statementsHi, q.statementsEn,
      q.listA, q.listAHi, q.items, q.itemsHi
    ];
    for (const arr of arrayFields) {
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (typeof item === 'string' && item.trim().length > 5) {
            samples.push(item);
          }
        }
      }
    }

    if (Array.isArray(q.questions)) {
      for (const sq of q.questions.slice(0, 3)) {
        const sqFields = [sq.question, sq.questionText, sq.questionTextHi, sq.questionTextEn];
        for (const f of sqFields) {
          if (typeof f === 'string' && f.trim().length > 10) {
            samples.push(f);
          }
        }
        if (Array.isArray(sq.options)) {
          for (const o of sq.options) {
            if (typeof o === 'string' && o.trim().length > 5) {
              samples.push(o);
            }
          }
        }
      }
    }

    if (samples.length >= 30) break;
  }

  if (samples.length === 0) {
    if (data.language === 'en') return 'en';
    return 'hi';
  }

  let hindiCount = 0;
  for (const s of samples) {
    if (HINDI_PATTERN.test(s)) hindiCount++;
  }

  const hindiRatio = hindiCount / samples.length;
  const detectedLang = hindiRatio > 0.3 ? 'hi' : 'en';

  if (data.language && data.language !== detectedLang) {
    console.log(`[detectLanguage] Metadata says "${data.language}" but content analysis says "${detectedLang}" (${hindiCount}/${samples.length} Hindi). Using CONTENT result.`);
  }

  return detectedLang;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT FIELD VERIFICATION — Enhanced with Pre-Cleaning
// 1. Pre-cleans stuck Hindi+English words in ALL text fields
// 2. Swaps content to correct Hi/En field based on actual content
// ═══════════════════════════════════════════════════════════════
function verifyContentFields(base) {
  // ★ Pre-clean stuck words in ALL fields before verification
  const preCleanField = (obj, field) => {
    if (obj[field] && typeof obj[field] === 'string' && obj[field].trim()) {
      let text = obj[field];

      // Fix Hindi+ENGLISH+Hindi stuck patterns
      text = text.replace(/([\u0900-\u097F])([A-Z]{2,})([\u0900-\u097F])/g, '$1 $2 $3');
      text = text.replace(/([A-Z]{2,})([\u0900-\u097F])/g, '$1 $2');
      text = text.replace(/([\u0900-\u097F])([A-Z]{2,})/g, '$1 $2');

      // Fix word(number)word stuck patterns
      text = text.replace(/([\u0900-\u097F\w])\((\d+)\)([\u0900-\u097F\w])/g, '$1 ($2) $3');
      text = text.replace(/([\u0900-\u097F])\((\d+)\)/g, '$1 ($2)');
      text = text.replace(/\((\d+)\)([\u0900-\u097F])/g, '($1) $2');

      // Fix Hindi punctuation+English stuck
      text = text.replace(/([\u0964\u0965])([A-Za-z])/g, '$1 $2');

      // Fix number+Hindi stuck
      text = text.replace(/(\d)([\u0900-\u097F])/g, '$1 $2');
      text = text.replace(/([\u0900-\u097F])(\d)/g, '$1 $2');

      // Normalize spaces
      text = text.replace(/\s{2,}/g, ' ').trim();

      obj[field] = text;
    }
  };

  const preCleanArray = (obj, field) => {
    if (Array.isArray(obj[field])) {
      for (let i = 0; i < obj[field].length; i++) {
        if (obj[field][i] && typeof obj[field][i] === 'string') {
          const item = { val: obj[field][i] };
          preCleanField(item, 'val');
          obj[field][i] = item.val;
        }
      }
    }
  };

  // Pre-clean all text fields
  const allTextFields = [
    'questionText', 'questionTextHi', 'questionTextEn',
    'explanation', 'explanationHi', 'explanationEn',
    'assertion', 'assertionHi', 'assertionEn',
    'reason', 'reasonHi', 'reasonEn',
    'passage', 'passageHi', 'passageEn',
    'caseletText', 'caseletTextHi', 'caseletTextEn',
    'diTitle', 'diTitleHi', 'diTitleEn',
    'instruction', 'instructionHi'
  ];

  for (const f of allTextFields) {
    preCleanField(base, f);
  }

  // Pre-clean all array fields
  const allArrayFields = [
    'options', 'optionsHi', 'optionsEn',
    'statements', 'statementsHi', 'statementsEn',
    'listA', 'listAHi', 'listAEn',
    'listB', 'listBHi', 'listBEn',
    'items', 'itemsHi', 'itemsEn'
  ];

  for (const f of allArrayFields) {
    preCleanArray(base, f);
  }

  // ═══ Swap logic: ensure content is in correct Hi/En field ═══
  const textPairs = [
    ['questionTextHi', 'questionTextEn'],
    ['explanationHi', 'explanationEn'],
    ['assertionHi', 'assertionEn'],
    ['reasonHi', 'reasonEn'],
    ['passageHi', 'passageEn'],
    ['caseletTextHi', 'caseletTextEn'],
    ['diTitleHi', 'diTitleEn'],
    ['instructionHi', 'instructionEn'],
  ];

  for (const [hiField, enField] of textPairs) {
    const hiVal = base[hiField];
    const enVal = base[enField];

    // Hi field has non-Hindi content AND En is empty → swap
    if (hiVal && typeof hiVal === 'string' && hiVal.trim() &&
      !HINDI_PATTERN.test(hiVal) &&
      (!enVal || !String(enVal).trim())) {
      base[enField] = hiVal;
      base[hiField] = '';
    }
    // En field has Hindi content AND Hi is empty → swap
    else if (enVal && typeof enVal === 'string' && enVal.trim() &&
      HINDI_PATTERN.test(enVal) &&
      (!hiVal || !String(hiVal).trim())) {
      base[hiField] = enVal;
      base[enField] = '';
    }
  }

  // Array field pairs
  const arrayPairs = [
    ['optionsHi', 'optionsEn'],
    ['statementsHi', 'statementsEn'],
    ['listAHi', 'listAEn'],
    ['listBHi', 'listBEn'],
    ['itemsHi', 'itemsEn'],
  ];

  for (const [hiField, enField] of arrayPairs) {
    const hiArr = base[hiField];
    const enArr = base[enField];

    if (Array.isArray(hiArr) && hiArr.length > 0 &&
      (!Array.isArray(enArr) || enArr.length === 0)) {
      const hasHindi = hiArr.some(item => typeof item === 'string' && HINDI_PATTERN.test(item));
      if (!hasHindi) {
        base[enField] = [...hiArr];
        base[hiField] = [];
      }
    }
    else if (Array.isArray(enArr) && enArr.length > 0 &&
      (!Array.isArray(hiArr) || hiArr.length === 0)) {
      const hasHindi = enArr.some(item => typeof item === 'string' && HINDI_PATTERN.test(item));
      if (hasHindi) {
        base[hiField] = [...enArr];
        base[enField] = [];
      }
    }
  }

  // Sub-questions: pre-clean + swap
  if (Array.isArray(base.subQuestions)) {
    for (const sq of base.subQuestions) {
      // Pre-clean sub-question fields
      preCleanField(sq, 'questionText');
      preCleanField(sq, 'questionTextHi');
      preCleanField(sq, 'questionTextEn');
      preCleanField(sq, 'explanation');
      preCleanField(sq, 'explanationHi');
      preCleanField(sq, 'explanationEn');
      preCleanArray(sq, 'options');
      preCleanArray(sq, 'optionsHi');
      preCleanArray(sq, 'optionsEn');

      // Swap text fields
      for (const [hiField, enField] of [['questionTextHi', 'questionTextEn'], ['explanationHi', 'explanationEn']]) {
        const hiVal = sq[hiField];
        const enVal = sq[enField];
        if (hiVal && typeof hiVal === 'string' && hiVal.trim() &&
          !HINDI_PATTERN.test(hiVal) &&
          (!enVal || !String(enVal).trim())) {
          sq[enField] = hiVal;
          sq[hiField] = '';
        } else if (enVal && typeof enVal === 'string' && enVal.trim() &&
          HINDI_PATTERN.test(enVal) &&
          (!hiVal || !String(hiVal).trim())) {
          sq[hiField] = enVal;
          sq[enField] = '';
        }
      }

      // Swap options
      const sqOptHi = sq.optionsHi;
      const sqOptEn = sq.optionsEn;
      if (Array.isArray(sqOptHi) && sqOptHi.length > 0 &&
        (!Array.isArray(sqOptEn) || sqOptEn.length === 0)) {
        const hasHindi = sqOptHi.some(item => typeof item === 'string' && HINDI_PATTERN.test(item));
        if (!hasHindi) {
          sq.optionsEn = [...sqOptHi];
          sq.optionsHi = [];
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════
// VALIDATION — unified format
// ═══════════════════════════════════════════════════
function validateImportData(data) {
  const errors = [], warnings = [];
  if (!data || typeof data !== 'object')
    return { isValid: false, errors: ['Invalid: must be JSON object'], warnings: [] };

  if (!data.year || !/^\d{4}$/.test(String(data.year))) errors.push('year required (4-digit)');
  const vs = ['june', 'december', 'november', 'september', 'march', 'other'];
  if (!data.session || !vs.includes(data.session.toLowerCase())) errors.push(`session required: ${vs.join(', ')}`);
  if (!data.paper || !['paper1', 'paper2'].includes(data.paper)) errors.push('paper: "paper1" or "paper2"');

  const questions = data.questions || data.questionTopicMap || [];
  if (!Array.isArray(questions) || questions.length === 0) {
    warnings.push('No questions found (use "questions" array)');
  }

  if (!data.overview?.totalQuestions) warnings.push('overview.totalQuestions missing');

  let withContent = 0;
  const typeCount = {};
  questions.forEach((q, idx) => {
    const t = detectQuestionType(q);
    typeCount[t] = (typeCount[t] || 0) + 1;

    if (q.question || q.questionText || q.questionTextHi || q.options?.length ||
      q.assertion || q.assertionHi || q.passage || q.passageHi ||
      q.tableData || q.chartData || q.caseletText || q.caseletTextHi ||
      q.statements?.length || q.listA?.length || q.items?.length ||
      q.questions?.length) {
      withContent++;
    }

    if (t === 'mcq' || t === 'assertion_reason' || t === 'match_following' ||
      t === 'sequence_order' || t === 'statement_based') {
      if (q.correct === undefined && q.correctAnswer === undefined) {
        warnings.push(`Q${q.qNo || idx + 1}: missing correct answer`);
      }
    }
  });

  const detectedLang = detectLanguage(data);

  return {
    isValid: errors.length === 0, errors, warnings,
    summary: {
      hasOverview: !!data.overview,
      questionCount: questions.length,
      questionsWithContent: withContent,
      typeBreakdown: typeCount,
      hasUnitWeightage: Array.isArray(data.unitWeightage) && data.unitWeightage.length > 0,
      hasTopTopics: Array.isArray(data.topTopics) && data.topTopics.length > 0,
      hasConcepts: Array.isArray(data.conceptsTracked) && data.conceptsTracked.length > 0,
      hasTrends: Array.isArray(data.trends) && data.trends.length > 0,
      hasDifficultyMatrix: Array.isArray(data.difficultyMatrix) && data.difficultyMatrix.length > 0,
      detectedLanguage: detectedLang
    }
  };
}

// ═══════════════════════════════════════════════════
// NORMALIZE QUESTION — with pre-clean + content verification
// ═══════════════════════════════════════════════════
function normalizeQuestion(q, defaultLang) {
  const type = detectQuestionType(q);
  const isHindi = defaultLang === 'hi';

  // Base structure with ALL bilingual fields initialized
  const base = {
    qNo: q.qNo || 0,
    originalQNo: q.originalQNo || (q.qNo ? `Q${q.qNo}` : ''),
    type: type,
    unitId: q.unitId || '',
    unitName: q.unitName || '',
    chapter: q.chapter || '',
    chapterHi: q.chapterHi || '',
    topic: q.topic || '',
    topicHi: q.topicHi || '',
    subtopic: q.subtopic || '',
    concept: q.concept || '',
    difficulty: (q.difficulty || 'medium').toLowerCase(),
    importance: Math.min(5, Math.max(1, q.importance || 3)),
    keyTerms: q.keyTerms || [],
    source: q.source || '',
    hasContent: false,
    hasSubQuestions: false,

    // Initialize ALL bilingual fields as empty
    questionText: '',
    questionTextHi: '',
    questionTextEn: '',
    options: [],
    optionsHi: [],
    optionsEn: [],
    correctAnswer: null,
    explanation: '',
    explanationHi: '',
    explanationEn: ''
  };

  // Helper to extract source text
  const getSrc = (val, valHi, valEn) => {
    if (isHindi) {
      return val || valHi || valEn || '';
    } else {
      return val || valEn || valHi || '';
    }
  };

  const getSrcArray = (val, valHi, valEn) => {
    if (isHindi) {
      return val || valHi || valEn || [];
    } else {
      return val || valEn || valHi || [];
    }
  };

  // ── MCQ ──
  if (type === 'mcq') {
    const qText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
    const opts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
    const expl = getSrc(q.explanation, q.explanationHi, q.explanationEn);

    base.questionText = qText;
    base.questionTextHi = isHindi ? qText : (q.questionTextHi || '');
    base.questionTextEn = !isHindi ? qText : (q.questionTextEn || '');
    base.options = opts;
    base.optionsHi = isHindi ? opts : (q.optionsHi || []);
    base.optionsEn = !isHindi ? opts : (q.optionsEn || []);
    base.correctAnswer = q.correct ?? q.correctAnswer ?? null;
    base.explanation = expl;
    base.explanationHi = isHindi ? expl : (q.explanationHi || '');
    base.explanationEn = !isHindi ? expl : (q.explanationEn || '');
    base.hasContent = !!qText;
  }

  // ── ASSERTION-REASON ──
  else if (type === 'assertion_reason') {
    const aText = getSrc(q.assertion, q.assertionHi, q.assertionEn);
    const rText = getSrc(q.reason, q.reasonHi, q.reasonEn);
    const opts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
    const expl = getSrc(q.explanation, q.explanationHi, q.explanationEn);

    base.assertion = aText;
    base.assertionHi = isHindi ? aText : (q.assertionHi || '');
    base.assertionEn = !isHindi ? aText : (q.assertionEn || '');
    base.reason = rText;
    base.reasonHi = isHindi ? rText : (q.reasonHi || '');
    base.reasonEn = !isHindi ? rText : (q.reasonEn || '');
    base.options = opts;
    base.optionsHi = isHindi ? opts : (q.optionsHi || []);
    base.optionsEn = !isHindi ? opts : (q.optionsEn || []);
    base.correctAnswer = q.correct ?? q.correctAnswer ?? null;
    base.explanation = expl;
    base.explanationHi = isHindi ? expl : (q.explanationHi || '');
    base.explanationEn = !isHindi ? expl : (q.explanationEn || '');
    base.hasContent = !!(aText || rText);

    if (aText) {
      const instrHi = 'निम्नलिखित दो कथनों पर विचार करें:';
      const instrEn = 'Consider the following two statements:';
      base.questionText = isHindi ? instrHi : instrEn;
      base.questionTextHi = instrHi;
      base.questionTextEn = instrEn;
      base.instruction = isHindi ? instrHi : instrEn;
      base.instructionHi = instrHi;
    }
  }

  // ── MATCH FOLLOWING ──
  else if (type === 'match_following') {
    const qText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
    const la = getSrcArray(q.listA, q.listAHi, q.listAEn);
    const lb = getSrcArray(q.listB, q.listBHi, q.listBEn);
    const opts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
    const expl = getSrc(q.explanation, q.explanationHi, q.explanationEn);

    base.questionText = qText;
    base.questionTextHi = isHindi ? qText : (q.questionTextHi || '');
    base.questionTextEn = !isHindi ? qText : (q.questionTextEn || '');
    base.listA = la;
    base.listAHi = isHindi ? la : (q.listAHi || []);
    base.listAEn = !isHindi ? la : (q.listAEn || []);
    base.listB = lb;
    base.listBHi = isHindi ? lb : (q.listBHi || []);
    base.listBEn = !isHindi ? lb : (q.listBEn || []);
    base.correctMatch = q.correctMatch || [];
    base.options = opts;
    base.optionsHi = isHindi ? opts : (q.optionsHi || []);
    base.optionsEn = !isHindi ? opts : (q.optionsEn || []);
    base.correctAnswer = q.correct ?? q.correctAnswer ?? null;
    base.explanation = expl;
    base.explanationHi = isHindi ? expl : (q.explanationHi || '');
    base.explanationEn = !isHindi ? expl : (q.explanationEn || '');
    base.hasContent = !!(la.length || lb.length);
  }

  // ── SEQUENCE ORDER ──
  else if (type === 'sequence_order') {
    const qText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
    const items = getSrcArray(q.items, q.itemsHi, q.itemsEn);
    const opts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
    const expl = getSrc(q.explanation, q.explanationHi, q.explanationEn);

    base.questionText = qText;
    base.questionTextHi = isHindi ? qText : (q.questionTextHi || '');
    base.questionTextEn = !isHindi ? qText : (q.questionTextEn || '');
    base.items = items;
    base.itemsHi = isHindi ? items : (q.itemsHi || []);
    base.itemsEn = !isHindi ? items : (q.itemsEn || []);
    base.correctOrder = q.correctOrder || [];
    base.options = opts;
    base.optionsHi = isHindi ? opts : (q.optionsHi || []);
    base.optionsEn = !isHindi ? opts : (q.optionsEn || []);
    base.correctAnswer = q.correct ?? q.correctAnswer ?? null;
    base.explanation = expl;
    base.explanationHi = isHindi ? expl : (q.explanationHi || '');
    base.explanationEn = !isHindi ? expl : (q.explanationEn || '');
    base.hasContent = !!items.length;
  }

  // ── STATEMENT BASED ──
  else if (type === 'statement_based') {
    const qText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
    const stmts = getSrcArray(q.statements, q.statementsHi, q.statementsEn);
    const opts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
    const expl = getSrc(q.explanation, q.explanationHi, q.explanationEn);

    base.questionText = qText;
    base.questionTextHi = isHindi ? qText : (q.questionTextHi || '');
    base.questionTextEn = !isHindi ? qText : (q.questionTextEn || '');
    base.statements = stmts;
    base.statementsHi = isHindi ? stmts : (q.statementsHi || []);
    base.statementsEn = !isHindi ? stmts : (q.statementsEn || []);
    base.correctStatements = q.correctStatements || [];
    base.options = opts;
    base.optionsHi = isHindi ? opts : (q.optionsHi || []);
    base.optionsEn = !isHindi ? opts : (q.optionsEn || []);
    base.correctAnswer = q.correct ?? q.correctAnswer ?? null;
    base.explanation = expl;
    base.explanationHi = isHindi ? expl : (q.explanationHi || '');
    base.explanationEn = !isHindi ? expl : (q.explanationEn || '');
    base.hasContent = !!stmts.length;
  }

  // ── PASSAGE ──
  else if (type === 'passage') {
    const pText = getSrc(q.passage, q.passageHi, q.passageEn);

    const subQuestions = (q.questions || []).map((sq, idx) => {
      const sqText = getSrc(sq.question || sq.questionText, sq.questionTextHi, sq.questionTextEn);
      const sqOpts = getSrcArray(sq.options, sq.optionsHi, sq.optionsEn);
      const sqExpl = getSrc(sq.explanation, sq.explanationHi, sq.explanationEn);
      return {
        qNo: sq.qNo || idx + 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (sq.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (sq.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (sq.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (sq.optionsEn || []),
        correctAnswer: sq.correct ?? sq.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (sq.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (sq.explanationEn || '')
      };
    });

    // If no sub-questions but has question+options at top level
    if (subQuestions.length === 0 && (q.question || q.questionText || q.options?.length)) {
      const sqText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
      const sqOpts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
      const sqExpl = getSrc(q.explanation, q.explanationHi, q.explanationEn);
      subQuestions.push({
        qNo: q.qNo || 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (q.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (q.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (sq.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (sq.optionsEn || []),
        correctAnswer: q.correct ?? q.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (q.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (q.explanationEn || '')
      });
    }

    base.passage = pText;
    base.passageHi = isHindi ? pText : (q.passageHi || '');
    base.passageEn = !isHindi ? pText : (q.passageEn || '');
    base.passageTitle = q.passageTitle || q.title || '';
    base.subQuestions = subQuestions;
    base.hasSubQuestions = subQuestions.length > 0;

    if (subQuestions.length > 0) {
      const firstSQ = subQuestions[0];
      base.questionText = firstSQ.questionText || '';
      base.questionTextHi = firstSQ.questionTextHi || '';
      base.questionTextEn = firstSQ.questionTextEn || '';
      base.options = [...(firstSQ.options || [])];
      base.optionsHi = [...(firstSQ.optionsHi || [])];
      base.optionsEn = [...(firstSQ.optionsEn || [])];
      base.correctAnswer = firstSQ.correctAnswer;
      base.explanation = firstSQ.explanation || '';
      base.explanationHi = firstSQ.explanationHi || '';
      base.explanationEn = firstSQ.explanationEn || '';
    }

    base.hasContent = !!(pText || (subQuestions.length > 0 && subQuestions[0].questionText));
  }

  // ── DI TABLE ──
  else if (type === 'di_table') {
    const titleText = getSrc(q.diTitle || q.title, q.diTitleHi, q.diTitleEn);
    const instrText = getSrc(q.diInstruction || q.instruction, q.diInstructionHi, q.diInstructionEn);

    const td = q.tableData || {};
    const headers = getSrcArray(td.headers, td.headersHi, td.headersEn);

    base.tableData = {
      headers: headers,
      headersHi: isHindi ? headers : (td.headersHi || []),
      headersEn: !isHindi ? headers : (td.headersEn || []),
      rows: td.rows || [],
      footers: td.footers || [],
      footersHi: td.footersHi || []
    };

    const subQuestions = (q.questions || []).map((sq, idx) => {
      const sqText = getSrc(sq.question || sq.questionText, sq.questionTextHi, sq.questionTextEn);
      const sqOpts = getSrcArray(sq.options, sq.optionsHi, sq.optionsEn);
      const sqExpl = getSrc(sq.explanation, sq.explanationHi, sq.explanationEn);
      return {
        qNo: sq.qNo || idx + 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (sq.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (sq.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (sq.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (sq.optionsEn || []),
        correctAnswer: sq.correct ?? sq.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (sq.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (sq.explanationEn || '')
      };
    });

    // Single question at top level
    if (subQuestions.length === 0 && (q.question || q.questionText)) {
      const sqText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
      const sqOpts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
      const sqExpl = getSrc(q.explanation, q.explanationHi, q.explanationEn);
      subQuestions.push({
        qNo: q.qNo || 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (q.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (q.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (sq.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (sq.optionsEn || []),
        correctAnswer: q.correct ?? q.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (sq.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (sq.explanationEn || '')
      });
    }

    base.diTitle = titleText;
    base.diTitleHi = isHindi ? titleText : (q.diTitleHi || '');
    base.diTitleEn = !isHindi ? titleText : (q.diTitleEn || '');
    base.diInstruction = instrText;
    base.subQuestions = subQuestions;
    base.hasContent = !!(base.tableData.headers.length || base.tableData.rows.length);
    base.hasSubQuestions = subQuestions.length > 0;
  }

  // ── DI BAR/PIE/LINE CHART ──
  else if (type === 'di_bar_chart' || type === 'di_pie_chart' || type === 'di_line_graph') {
    const titleText = getSrc(q.diTitle || q.title, q.diTitleHi, q.diTitleEn);

    const cd = q.chartData || {};
    const labels = getSrcArray(cd.labels, cd.labelsHi, cd.labelsEn);

    base.chartData = {
      labels: labels,
      labelsHi: isHindi ? labels : (cd.labelsHi || []),
      labelsEn: !isHindi ? labels : (cd.labelsEn || []),
      datasets: (cd.datasets || []).map(ds => ({
        label: ds.label || '', labelHi: ds.labelHi || '', labelEn: ds.labelEn || '',
        data: ds.data || [], color: ds.color || '', colors: ds.colors || []
      })),
      xAxisLabel: cd.xAxisLabel || '', yAxisLabel: cd.yAxisLabel || '',
      chartType: cd.chartType || cd.type || type.replace('di_', '').replace('_chart', '').replace('_graph', '')
    };

    const subQuestions = (q.questions || []).map((sq, idx) => {
      const sqText = getSrc(sq.question || sq.questionText, sq.questionTextHi, sq.questionTextEn);
      const sqOpts = getSrcArray(sq.options, sq.optionsHi, sq.optionsEn);
      const sqExpl = getSrc(sq.explanation, sq.explanationHi, sq.explanationEn);
      return {
        qNo: sq.qNo || idx + 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (sq.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (sq.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (sq.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (sq.optionsEn || []),
        correctAnswer: sq.correct ?? sq.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (sq.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (sq.explanationEn || '')
      };
    });

    if (subQuestions.length === 0 && (q.question || q.questionText)) {
      const sqText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
      const sqOpts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
      const sqExpl = getSrc(q.explanation, q.explanationHi, q.explanationEn);
      subQuestions.push({
        qNo: q.qNo || 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (q.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (q.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (q.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (q.optionsEn || []),
        correctAnswer: q.correct ?? q.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (q.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (q.explanationEn || '')
      });
    }

    base.diTitle = titleText;
    base.diTitleHi = isHindi ? titleText : (q.diTitleHi || '');
    base.diTitleEn = !isHindi ? titleText : (q.diTitleEn || '');
    base.subQuestions = subQuestions;
    base.hasContent = !!(base.chartData.labels.length || base.chartData.datasets.length);
    base.hasSubQuestions = subQuestions.length > 0;
  }

  // ── DI CASELET ──
  else if (type === 'di_caselet') {
    const titleText = getSrc(q.diTitle || q.title, q.diTitleHi, q.diTitleEn);
    const cText = getSrc(q.caseletText, q.caseletTextHi, q.caseletTextEn);

    const subQuestions = (q.questions || []).map((sq, idx) => {
      const sqText = getSrc(sq.question || sq.questionText, sq.questionTextHi, sq.questionTextEn);
      const sqOpts = getSrcArray(sq.options, sq.optionsHi, sq.optionsEn);
      const sqExpl = getSrc(sq.explanation, sq.explanationHi, sq.explanationEn);
      return {
        qNo: sq.qNo || idx + 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (sq.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (sq.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (sq.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (sq.optionsEn || []),
        correctAnswer: sq.correct ?? sq.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (sq.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (sq.explanationEn || '')
      };
    });

    if (subQuestions.length === 0 && (q.question || q.questionText)) {
      const sqText = getSrc(q.question || q.questionText, q.questionTextHi, q.questionTextEn);
      const sqOpts = getSrcArray(q.options, q.optionsHi, q.optionsEn);
      const sqExpl = getSrc(q.explanation, q.explanationHi, q.explanationEn);
      subQuestions.push({
        qNo: q.qNo || 1,
        questionText: sqText,
        questionTextHi: isHindi ? sqText : (q.questionTextHi || ''),
        questionTextEn: !isHindi ? sqText : (q.questionTextEn || ''),
        options: sqOpts,
        optionsHi: isHindi ? sqOpts : (q.optionsHi || []),
        optionsEn: !isHindi ? sqOpts : (q.optionsEn || []),
        correctAnswer: q.correct ?? q.correctAnswer ?? null,
        explanation: sqExpl,
        explanationHi: isHindi ? sqExpl : (q.explanationHi || ''),
        explanationEn: !isHindi ? sqExpl : (q.explanationEn || '')
      });
    }

    base.diTitle = titleText;
    base.diTitleHi = isHindi ? titleText : (q.diTitleHi || '');
    base.diTitleEn = !isHindi ? titleText : (q.diTitleEn || '');
    base.caseletText = cText;
    base.caseletTextHi = isHindi ? cText : (q.caseletTextHi || '');
    base.caseletTextEn = !isHindi ? cText : (q.caseletTextEn || '');
    base.subQuestions = subQuestions;
    base.hasContent = !!cText;
    base.hasSubQuestions = subQuestions.length > 0;
  }

  // ═══════════════════════════════════════════════════
  // CONTENT VERIFICATION + PRE-CLEANING
  // Pre-cleans stuck words, then ensures fields match actual content language
  // ═══════════════════════════════════════════════════
  verifyContentFields(base);

  return base;
}

// ═══════════════════════════════════════════════════
// NORMALIZE FULL IMPORT DATA
// ═══════════════════════════════════════════════════
function normalizeImportData(data) {
  const detectedLang = detectLanguage(data);

  console.log(`[pyqAnalyzer] Detected content language: ${detectedLang} (metadata language: ${data.language || 'not set'})`);

  const rawQuestions = data.questions || data.questionTopicMap || [];

  const normalizedQuestions = rawQuestions.map(q => normalizeQuestion(q, detectedLang));

  return {
    year: String(data.year).trim(),
    session: data.session.toLowerCase().trim(),
    shift: (['shift1', 'shift2', 'none'].includes((data.shift || 'none').toLowerCase().trim()))
      ? (data.shift || 'none').toLowerCase().trim() : 'none',
    paper: data.paper,
    subject: data.subject || (data.paper === 'paper2' ? 'History' : 'General'),
    language: detectedLang,
    overview: {
      totalQuestions: data.overview?.totalQuestions || rawQuestions.length || 0,
      totalMarks: data.overview?.totalMarks || (data.overview?.totalQuestions || rawQuestions.length || 0) * 2,
      marksPerQuestion: data.overview?.marksPerQuestion || 2,
      negativeMarking: data.overview?.negativeMarking || false,
      questionRange: data.overview?.questionRange || {}
    },
    questionTypeBreakdown: (data.questionTypeBreakdown || []).map(t => ({
      type: t.type || 'unknown', label: t.label || t.type, count: t.count || 0,
      percentage: t.percentage || 0, qRange: t.qRange || '', difficulty: t.difficulty || '',
      targetScore: t.targetScore || '', strategy: t.strategy || ''
    })),
    unitWeightage: (data.unitWeightage || []).map(u => ({
      unitId: u.unitId || '', unitName: u.unitName || '', unitNameHi: u.unitNameHi || '',
      questionCount: u.questionCount || 0, marks: u.marks || (u.questionCount || 0) * 2,
      percentage: u.percentage || 0, priority: u.priority || '',
      difficulty: u.difficulty || 'Medium', roiScore: Math.min(5, Math.max(1, u.roiScore || 3))
    })),
    questionTopicMap: normalizedQuestions,
    topTopics: (data.topTopics || []).map(t => ({
      rank: t.rank || 0, topic: t.topic || '', topicHi: t.topicHi || '',
      unitId: t.unitId || '', unitName: t.unitName || '', chapter: t.chapter || '',
      questionCount: t.questionCount || 0, questionNumbers: t.questionNumbers || [],
      mustScore: t.mustScore || false
    })),
    conceptsTracked: (data.conceptsTracked || []).map(c => ({
      concept: c.concept || '', conceptHi: c.conceptHi || '',
      unitId: c.unitId || '', chapter: c.chapter || '',
      qNo: c.qNo || '', type: c.type || '',
      timesAskedThisYear: c.timesAskedThisYear || 1
    })),
    trends: (data.trends || []).map(t => ({
      trend: t.trend || '', direction: t.direction || 'stable',
      evidence: t.evidence || '', tip: t.tip || '', icon: t.icon || ''
    })),
    difficultyMatrix: (data.difficultyMatrix || []).map(d => ({
      zone: d.zone || 'YELLOW', qRange: d.qRange || '',
      type: d.type || '', difficulty: d.difficulty || '',
      targetScore: d.targetScore || ''
    })),
    matchingDetails: data.matchingDetails || [],
    chronologyDetails: data.chronologyDetails || [],
    notes: data.notes || ''
  };
}

// ═══════════════════════════════════════════════════
// ANALYSIS HELPERS
// ═══════════════════════════════════════════════════
function calculateTrend(yc) {
  if (!yc || yc.length < 2) return 'stable';
  const nz = yc.filter(c => c > 0);
  if (!nz.length) return 'stable';
  if (nz.length === 1) return 'emerged';
  const m = Math.floor(yc.length / 2);
  const f = yc.slice(0, m).reduce((s, c) => s + c, 0);
  const se = yc.slice(m).reduce((s, c) => s + c, 0);
  if (se > f * 1.3) return 'increasing';
  if (se < f * 0.7) return 'decreasing';
  return 'stable';
}

function avgDifficulty(d) {
  if (!d?.length) return 'medium';
  const sc = { easy: 1, medium: 2, hard: 3 };
  const a = d.reduce((s, x) => s + (sc[x] || 2), 0) / d.length;
  return a <= 1.5 ? 'easy' : a >= 2.5 ? 'hard' : 'medium';
}

function calcImportanceScore(t, y, ty) {
  if (!ty) return 0;
  return Math.round(Math.min(100, (t / (ty * 5)) * 100) * 0.6 + ((y / ty) * 100) * 0.4);
}

async function getUserPerformanceByUnit(paper) {
  try {
    const TA = mongoose.model('TestAttempt'), Q = mongoose.model('Question');
    const atts = await TA.find({ status: 'completed' }).select('answers').lean();
    if (!atts.length) return [];
    const am = {};
    atts.forEach(a => (a.answers || []).forEach(an => {
      const id = an.questionId?.toString();
      if (!id) return;
      if (!am[id]) am[id] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      am[id].total++;
      if (an.selectedAnswer === -1) am[id].skipped++;
      else if (an.isCorrect) am[id].correct++;
      else am[id].wrong++;
    }));
    const ids = Object.keys(am);
    if (!ids.length) return [];
    const pf = {};
    if (paper) pf.paper = paper;
    const qs = await Q.find({ _id: { $in: ids }, isActive: { $ne: false }, ...pf }).select('unit chapter topic').lean();
    const pm = {};
    qs.forEach(q => {
      const un = extractUnitNumberFromName(q.unit);
      const uid = un ? unitNumberToId(un) : (q.unit || 'unknown');
      const k = `${uid}|${q.chapter || ''}`;
      if (!pm[k]) pm[k] = { unitId: uid, unitName: q.unit || '', chapter: q.chapter || '', topics: new Set(), total: 0, correct: 0, wrong: 0, skipped: 0 };
      if (q.topic) pm[k].topics.add(q.topic);
      const s = am[q._id.toString()];
      if (s) { pm[k].total += s.total; pm[k].correct += s.correct; pm[k].wrong += s.wrong; pm[k].skipped += s.skipped; }
    });
    return Object.values(pm).map(p => ({ ...p, topics: Array.from(p.topics), accuracy: p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0 }));
  } catch (e) { console.error('[pyqAnalyzer]', e.message); return []; }
}

function findUserPerformanceMatch(uid, ch, arr) {
  if (!arr?.length) return null;
  const dm = arr.find(u => u.unitId === uid && u.chapter && ch &&
    (u.chapter.toLowerCase().includes(ch.toLowerCase().substring(0, 15)) ||
      ch.toLowerCase().includes(u.chapter.toLowerCase().substring(0, 15))));
  if (dm) return dm;
  const um = arr.filter(u => u.unitId === uid);
  if (um.length) {
    const a = { total: 0, correct: 0, wrong: 0, skipped: 0 };
    um.forEach(m => { a.total += m.total; a.correct += m.correct; a.wrong += m.wrong; a.skipped += m.skipped; });
    return { ...a, accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0 };
  }
  return null;
}

function getRecommendation(st) {
  const r = {
    critical: 'Immediate intensive study — High PYQ + Low accuracy',
    weak: 'Focused revision needed — practice more',
    not_started: 'Not practiced yet — start now',
    good: 'Good progress — maintain',
    mastered: 'Well prepared — quick revision only'
  };
  return r[st] || r.good;
}

function calcOverallReadiness(g) {
  if (!g.length) return 0;
  let ws = 0, tw = 0;
  g.forEach(x => { const w = x.pyqImportance / 100; ws += x.yourAccuracy * w; tw += w; });
  return tw > 0 ? Math.round(ws / tw) : 0;
}

module.exports = {
  extractUnitNumberFromName, unitNumberToId, escapeRegex,
  detectQuestionType, detectLanguage, verifyContentFields,
  validateImportData, normalizeImportData, normalizeQuestion,
  calculateTrend, avgDifficulty, calcImportanceScore,
  getUserPerformanceByUnit, findUserPerformanceMatch,
  getRecommendation, calcOverallReadiness,
  ROMAN_MAP, ROMAN_REVERSE, HINDI_PATTERN
};