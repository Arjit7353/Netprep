// server/controllers/testController.js
// ═══════════════════════════════════════════════════════
// UPGRADED: Smart PYQ detection, enriched filter options,
// proper unit/chapter/topic extraction from PYQ refs
// ═══════════════════════════════════════════════════════

const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const PYQAnalysis = require('../models/PYQAnalysis');
const config = require('../config/config');
const randomSelector = require('../utils/randomSelector');
const autoGenerator = require('../utils/autoGenerator');

// ═══════════════════════════════════════════════════════
//   UNIT HELPERS
// ═══════════════════════════════════════════════════════

const romanToInt = (str) => {
  if (!str) return 0;
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  const s = str.toUpperCase();
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]] || 0;
    const nxt = map[s[i + 1]] || 0;
    result += cur < nxt ? -cur : cur;
  }
  return result;
};

const getUnitSortNum = (unitStr) => {
  if (!unitStr) return 999;
  const d = unitStr.match(/(?:UNIT|इकाई)\s*(\d+)/i);
  if (d) return parseInt(d[1]);
  const r = unitStr.match(/(?:UNIT|इकाई)\s*([IVXLCDM]+)/i);
  if (r) return romanToInt(r[1]);
  return 999;
};

const extractUnitId = (str) => {
  if (!str) return null;
  const m = str.trim().match(/(?:UNIT|इकाई)\s*([IVXLCDM]+|\d+)/i);
  if (m) return 'UNIT ' + m[1].toUpperCase();
  return str.trim();
};

const buildUnitFilter = (unitInput) => {
  if (!unitInput) return null;
  const m = unitInput.match(/(?:UNIT|इकाई)\s*([IVXLCDM]+|\d+)/i);
  if (m) {
    const num = m[1].toUpperCase();
    const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return { $regex: '(?:UNIT|इकाई)\\s*' + escaped + '\\b', $options: 'i' };
  }
  const escaped = unitInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: escaped, $options: 'i' };
};

// ═══════════════════════════════════════════════════════
//   PYQ ID PARSING
// ═══════════════════════════════════════════════════════

const isPYQSyntheticId = (idStr) => {
  if (!idStr || typeof idStr !== 'string') return false;
  return /^pyq_/i.test(idStr);
};

const parsePYQId = (idStr) => {
  if (!idStr || typeof idStr !== 'string') return null;
  const match = idStr.match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
  if (match) return { docId: match[1], qNo: parseInt(match[2], 10) };
  return null;
};

const TYPE_MAP = {
  'simple_mcq': 'mcq', 'mcq': 'mcq', 'multiple_choice': 'mcq',
  'assertion_reason': 'assertion_reason', 'ar': 'assertion_reason',
  'matching': 'match_following', 'match_following': 'match_following', 'match': 'match_following',
  'chronology': 'sequence_order', 'sequence_order': 'sequence_order', 'sequence': 'sequence_order',
  'multi_statement': 'statement_based', 'statement_based': 'statement_based', 'statements': 'statement_based',
  'comprehension': 'passage_based', 'passage': 'passage_based', 'passage_based': 'passage_based',
  'di_table': 'di_table', 'di_bar_chart': 'di_bar_chart', 'di_pie_chart': 'di_pie_chart',
  'di_line_graph': 'di_line_graph', 'di_caselet': 'di_caselet', 'di_mixed': 'di_mixed'
};

function mapType(pyqType) {
  return TYPE_MAP[(pyqType || '').toLowerCase()] || 'mcq';
}

// ═══════════════════════════════════════════════════════
//   RESOLVE PYQ QUESTION — virtual Question-like object
// ═══════════════════════════════════════════════════════

async function resolvePYQQuestion(pyqIdStr, pyqDocCache = {}) {
  const parsed = parsePYQId(pyqIdStr);
  if (!parsed) return null;

  const { docId, qNo } = parsed;

  if (!pyqDocCache[docId]) {
    pyqDocCache[docId] = await PYQAnalysis.findById(docId).lean();
  }
  const pyqDoc = pyqDocCache[docId];
  if (!pyqDoc) return null;

  const pq = (pyqDoc.questionTopicMap || []).find(q => q.qNo === qNo);
  if (!pq) return null;

  const qType = mapType(pq.type);

  let questionHi, questionEn, optHi, optEn, correctAns, explHi, explEn;

  if ((qType === 'passage_based' || pq.type === 'passage' || pq.type === 'comprehension') &&
    Array.isArray(pq.subQuestions) && pq.subQuestions.length > 0) {
    const sq = pq.subQuestions[0];
    questionHi = sq.questionTextHi || sq.questionText || '';
    questionEn = sq.questionTextEn || sq.questionText || '';
    if (!questionHi && !questionEn) {
      questionHi = `प्रश्न ${qNo} (गद्यांश आधारित)`;
      questionEn = `Question ${qNo} (Passage-based)`;
    }
    optHi = sq.optionsHi || sq.options || [];
    optEn = sq.optionsEn || sq.options || [];
    correctAns = sq.correctAnswer ?? pq.correctAnswer ?? 0;
    explHi = sq.explanationHi || sq.explanation || '';
    explEn = sq.explanationEn || sq.explanation || '';
  } else {
    questionHi = pq.questionTextHi || pq.questionText || '';
    questionEn = pq.questionTextEn || pq.questionText || '';
    if (!questionHi && !questionEn) {
      questionHi = pq.topic || `PYQ ${pyqDoc.year} Q${qNo}`;
      questionEn = pq.topic || `PYQ ${pyqDoc.year} Q${qNo}`;
    }
    optHi = pq.optionsHi || pq.options || [];
    optEn = pq.optionsEn || pq.options || [];
    correctAns = pq.correctAnswer ?? 0;
    explHi = pq.explanationHi || pq.explanation || '';
    explEn = pq.explanationEn || pq.explanation || '';
  }

  const virtualQuestion = {
    _id: pyqIdStr,
    questionNumber: qNo,
    questionType: qType,
    question: { hi: questionHi, en: questionEn },
    options: { hi: optHi, en: optEn },
    correctAnswer: correctAns,
    explanation: { hi: explHi, en: explEn },
    paper: pyqDoc.paper,
    unit: pq.unitName || pq.unitId || '',
    chapter: pq.chapter || '',
    topic: pq.topic || '',
    subtopic: pq.subtopic || '',
    difficulty: pq.difficulty || 'medium',
    source: `PYQ ${pyqDoc.year} ${pyqDoc.session || ''}`.trim(),
    year: pyqDoc.year,
    isPYQ: true,
    pyqSession: pyqDoc.session || '',
    pyqShift: pyqDoc.shift || '',
    pyqQuestionNumber: qNo,
    _pyqDocId: docId,
    _pyqLabel: pyqDoc.displayLabel,
    _isVirtualPYQ: true,
    timesAttempted: 0,
    timesCorrect: 0,
    createdAt: pyqDoc.importedAt || pyqDoc.createdAt
  };

  if (qType === 'passage_based' || pq.type === 'passage' || pq.type === 'comprehension') {
    virtualQuestion.passageId = {
      _id: `passage_${docId}_${qNo}`,
      content: { hi: pq.passageHi || pq.passage || '', en: pq.passageEn || pq.passage || '' },
      title: pq.passageTitle || `PYQ ${pyqDoc.year} Passage`
    };
    virtualQuestion.subQuestions = pq.subQuestions || [];
  }

  if (pq.assertionHi || pq.assertion) {
    virtualQuestion.assertionReasonData = {
      assertion: { hi: pq.assertionHi || pq.assertion || '', en: pq.assertionEn || '' },
      reason: { hi: pq.reasonHi || pq.reason || '', en: pq.reasonEn || '' }
    };
  }
  if (pq.statementsHi?.length || pq.statements?.length) {
    virtualQuestion.statementData = {
      statements: { hi: pq.statementsHi || pq.statements || [], en: pq.statementsEn || [] },
      correctStatements: pq.correctStatements || []
    };
  }
  if (pq.listAHi?.length || pq.listA?.length) {
    virtualQuestion.matchData = {
      listA: { hi: pq.listAHi || pq.listA || [], en: pq.listAEn || [] },
      listB: { hi: pq.listBHi || pq.listB || [], en: pq.listBEn || [] },
      correctMatch: pq.correctMatch || []
    };
  }
  if (pq.itemsHi?.length || pq.items?.length) {
    virtualQuestion.sequenceData = {
      items: { hi: pq.itemsHi || pq.items || [], en: pq.itemsEn || [] },
      correctOrder: pq.correctOrder || []
    };
  }

  return virtualQuestion;
}

// ═══════════════════════════════════════════════════════
//   EXTRACT PYQ METADATA from question IDs
//   Resolves PYQ doc data to populate test metadata
// ═══════════════════════════════════════════════════════

async function extractPYQMetadata(questionIds) {
  const pyqIds = (questionIds || []).filter(id => isPYQSyntheticId(typeof id === 'string' ? id : String(id)));
  if (pyqIds.length === 0) return null;

  const docIds = new Set();
  const qNos = [];
  pyqIds.forEach(id => {
    const parsed = parsePYQId(typeof id === 'string' ? id : String(id));
    if (parsed) {
      docIds.add(parsed.docId);
      qNos.push(parsed);
    }
  });

  const docs = await PYQAnalysis.find({ _id: { $in: Array.from(docIds) } })
    .select('year session shift paper questionTopicMap.qNo questionTopicMap.unitId questionTopicMap.unitName questionTopicMap.chapter questionTopicMap.topic')
    .lean();

  const years = new Set();
  const sessions = new Set();
  const units = new Set();
  const chapters = new Set();
  const topics = new Set();
  const papers = new Set();

  docs.forEach(doc => {
    years.add(doc.year);
    if (doc.session) sessions.add(doc.session);
    if (doc.paper) papers.add(doc.paper);

    // Only include metadata from questions actually selected
    const selectedQNos = qNos.filter(q => q.docId === doc._id.toString()).map(q => q.qNo);
    (doc.questionTopicMap || []).forEach(q => {
      if (selectedQNos.includes(q.qNo)) {
        if (q.unitName || q.unitId) units.add(q.unitName || q.unitId);
        if (q.chapter) chapters.add(q.chapter);
        if (q.topic) topics.add(q.topic);
      }
    });
  });

  return {
    pyqCount: pyqIds.length,
    years: Array.from(years).sort(),
    sessions: Array.from(sessions),
    units: Array.from(units),
    chapters: Array.from(chapters),
    topics: Array.from(topics),
    papers: Array.from(papers)
  };
}

// ═══════════════════════════════════════════════════════
//   CONTROLLERS
// ═══════════════════════════════════════════════════════

// GET /api/tests
const getTests = async (req, res, next) => {
  try {
    const {
      paper, testType, unit, status = 'active',
      page = 1, limit = 20, search,
      hasPYQ, sourceType, pyqYear,
      sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status && status !== 'all') query.status = status;
    if (paper) query.paper = paper;
    if (testType) query.testType = testType;
    if (unit) {
      const uf = buildUnitFilter(unit);
      if (uf) {
        // Search in both unit and pyqUnits
        query.$or = [
          { unit: uf },
          { pyqUnits: uf }
        ];
      }
    }
    if (search) {
      query.$or = query.$or || [];
      query.$or.push(
        { title: { $regex: search, $options: 'i' } },
        { chapter: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { pyqChapters: { $regex: search, $options: 'i' } },
        { pyqTopics: { $regex: search, $options: 'i' } },
        { pyqYears: { $regex: search, $options: 'i' } }
      );
    }
    // PYQ-specific filters
    if (hasPYQ === 'true') query.hasPYQ = true;
    if (hasPYQ === 'false') query.hasPYQ = { $ne: true };
    if (sourceType) query.sourceType = sourceType;
    if (pyqYear) query.pyqYears = pyqYear;

    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Test.countDocuments(query);
    const tests = await Test.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-questions');

    res.json({
      success: true,
      data: tests,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[getTests] Error:', error);
    next(error);
  }
};

// GET /api/tests/filter-options
const getFilterOptions = async (req, res, next) => {
  try {
    const { paper, testType, unit, status = 'active' } = req.query;

    const activeMatch = {};
    if (status) activeMatch.status = status;

    const paperMatch = { ...activeMatch };
    if (paper) paperMatch.paper = paper;

    const unitMatch = { ...paperMatch };
    if (unit) {
      const uf = buildUnitFilter(unit);
      if (uf) unitMatch.$or = [{ unit: uf }, { pyqUnits: uf }];
    }

    const [
      papers, testTypes, chapters, topics,
      countsByType, countsByPaper, rawUnitAgg,
      // NEW: PYQ-specific aggregations
      pyqAgg, sourceTypeAgg
    ] = await Promise.all([
      Test.distinct('paper', activeMatch),
      Test.distinct('testType', activeMatch),
      Test.distinct('chapter', unitMatch),
      Test.distinct('topic', unitMatch),
      Test.aggregate([
        { $match: activeMatch },
        { $group: { _id: '$testType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Test.aggregate([
        { $match: activeMatch },
        { $group: { _id: '$paper', count: { $sum: 1 } } }
      ]),
      Test.aggregate([
        { $match: { ...activeMatch, unit: { $exists: true, $ne: null, $ne: '' } } },
        { $addFields: { unitArray: { $cond: { if: { $regexMatch: { input: { $ifNull: ['$unit', ''] }, regex: /,/ } }, then: { $split: ['$unit', ','] }, else: [{ $ifNull: ['$unit', ''] }] } } } },
        { $unwind: '$unitArray' },
        { $addFields: { unitClean: { $trim: { input: '$unitArray' } } } },
        { $match: { unitClean: { $ne: '' } } },
        { $group: { _id: { paper: '$paper', unit: '$unitClean' }, count: { $sum: 1 }, testTypes: { $addToSet: '$testType' }, chapters: { $addToSet: '$chapter' }, latestTest: { $max: '$createdAt' } } },
        { $sort: { '_id.paper': 1, '_id.unit': 1 } }
      ]),
      // PYQ aggregation — count tests with PYQ questions
      Test.aggregate([
        { $match: { ...activeMatch, hasPYQ: true } },
        { $group: {
          _id: null,
          totalPyqTests: { $sum: 1 },
          pyqYears: { $push: '$pyqYears' },
          pyqUnits: { $push: '$pyqUnits' },
          sourceTypes: { $push: '$sourceType' }
        }}
      ]),
      // Source type breakdown
      Test.aggregate([
        { $match: activeMatch },
        { $group: { _id: '$sourceType', count: { $sum: 1 } } }
      ])
    ]);

    // ── PYQ data for filters ──
    let pyqYears = [];
    let pyqSessions = [];
    let pyqStats = { totalPapers: 0, totalQuestions: 0, testsWithPYQ: 0 };
    try {
      const pyqData = await PYQAnalysis.find({ isActive: true }).select('year session shift displayLabel overview questionTopicMap').lean();
      const yearSet = new Set();
      const sessionSet = new Set();
      let totalPYQQ = 0;
      pyqData.forEach(d => {
        yearSet.add(d.year);
        sessionSet.add(d.session);
        totalPYQQ += d.questionTopicMap?.length || d.overview?.totalQuestions || 0;
      });
      pyqYears = Array.from(yearSet).sort().reverse().map(y => {
        const docs = pyqData.filter(d => d.year === y);
        return { year: y, displayLabel: docs[0]?.displayLabel || y, count: docs.length };
      });
      pyqSessions = Array.from(sessionSet).map(s => ({
        session: s,
        label: s.charAt(0).toUpperCase() + s.slice(1)
      }));
      pyqStats = {
        totalPapers: pyqData.length,
        totalQuestions: totalPYQQ,
        testsWithPYQ: pyqAgg[0]?.totalPyqTests || 0
      };
    } catch (e) {
      console.warn('[getFilterOptions] PYQ data fetch failed:', e.message);
    }

    // ── Merge unit aggregation ──
    const mergeMap = {};
    rawUnitAgg.forEach(item => {
      if (!item._id?.paper || !item._id?.unit) return;
      const uid = extractUnitId(item._id.unit);
      const key = `${item._id.paper}||${uid}`;
      if (!mergeMap[key]) {
        mergeMap[key] = { paper: item._id.paper, unit: item._id.unit, unitId: uid, count: 0, typesSet: new Set(), chaptersSet: new Set(), latestTest: null };
      }
      const e = mergeMap[key];
      e.count += item.count;
      if (item._id.unit.length > e.unit.length) e.unit = item._id.unit;
      if (item.latestTest && (!e.latestTest || item.latestTest > e.latestTest)) e.latestTest = item.latestTest;
      (item.testTypes || []).forEach(t => { if (t) e.typesSet.add(t); });
      (item.chapters || []).forEach(c => { if (c) e.chaptersSet.add(c); });
    });

    // Also count PYQ-sourced units from pyqUnits field
    const pyqUnitTests = await Test.find({ ...activeMatch, hasPYQ: true, pyqUnits: { $exists: true, $ne: [] } })
      .select('paper pyqUnits testType chapter')
      .lean();

    pyqUnitTests.forEach(test => {
      (test.pyqUnits || []).forEach(pu => {
        const uid = extractUnitId(pu);
        const p = test.paper === 'combined' ? 'paper2' : test.paper;
        const key = `${p}||${uid}`;
        if (!mergeMap[key]) {
          mergeMap[key] = { paper: p, unit: pu, unitId: uid, count: 0, typesSet: new Set(), chaptersSet: new Set(), latestTest: null };
        }
        mergeMap[key].count++;
        if (test.testType) mergeMap[key].typesSet.add(test.testType);
        if (test.chapter) mergeMap[key].chaptersSet.add(test.chapter);
      });
    });

    const countsByUnit = Object.values(mergeMap)
      .map(e => ({ paper: e.paper, unit: e.unit, unitId: e.unitId, count: e.count, testTypes: [...e.typesSet], chapters: [...e.chaptersSet], latestTest: e.latestTest }))
      .sort((a, b) => { if (a.paper !== b.paper) return a.paper.localeCompare(b.paper); return getUnitSortNum(a.unitId) - getUnitSortNum(b.unitId); });

    const clean = (arr) => arr.filter(v => v != null && (typeof v !== 'string' || v.trim() !== ''));

    // Collect PYQ-specific chapters and topics
    const allPyqChapters = await Test.distinct('pyqChapters', activeMatch);
    const allPyqTopics = await Test.distinct('pyqTopics', activeMatch);
    const mergedChapters = [...new Set([...clean(chapters), ...clean(allPyqChapters)])].sort();
    const mergedTopics = [...new Set([...clean(topics), ...clean(allPyqTopics)])].sort();

    res.json({
      success: true,
      data: {
        papers: clean(papers),
        testTypes: clean(testTypes),
        units: countsByUnit.map(u => u.unit).filter(Boolean),
        chapters: mergedChapters,
        topics: mergedTopics,
        countsByType: countsByType.reduce((a, i) => { if (i._id) a[i._id] = i.count; return a; }, {}),
        countsByPaper: countsByPaper.reduce((a, i) => { if (i._id) a[i._id] = i.count; return a; }, {}),
        countsByUnit,
        countsBySource: sourceTypeAgg.reduce((a, i) => { if (i._id) a[i._id] = i.count; return a; }, {}),
        pyqYears,
        pyqSessions,
        pyqStats
      }
    });
  } catch (error) {
    console.error('[getFilterOptions] Error:', error);
    next(error);
  }
};

const getTestStats = async (req, res, next) => {
  try {
    const countByType = await Test.getCountByType();
    const totalTests = await Test.countDocuments({ status: 'active' });
    const totalAttempts = await TestAttempt.countDocuments({ status: 'completed' });
    const avgStats = await TestAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$percentage' }, avgAccuracy: { $avg: '$accuracy' } } }
    ]);
    const pyqTestCount = await Test.countDocuments({ status: 'active', hasPYQ: true });
    const sourceBreakdown = await Test.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$sourceType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalTests, totalAttempts,
        byType: countByType.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
        averageScore: avgStats[0]?.avgScore || 0,
        averageAccuracy: avgStats[0]?.avgAccuracy || 0,
        pyqTestCount,
        bySource: sourceBreakdown.reduce((acc, item) => { if (item._id) acc[item._id] = item.count; return acc; }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTestTypes = async (req, res, next) => {
  try {
    res.json({ success: true, data: config.testTypes });
  } catch (error) {
    next(error);
  }
};

const getTestById = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const testObj = test.toObject();

    const realIds = [];
    const pyqSyntheticIds = [];

    (testObj.questions || []).forEach(qId => {
      const idStr = typeof qId === 'string' ? qId : qId.toString();
      if (isPYQSyntheticId(idStr)) pyqSyntheticIds.push(idStr);
      else realIds.push(qId);
    });

    let realQuestions = [];
    if (realIds.length > 0) {
      realQuestions = await Question.find({ _id: { $in: realIds } }).lean();
    }

    let pyqQuestions = [];
    if (pyqSyntheticIds.length > 0) {
      const pyqDocCache = {};
      const resolved = await Promise.all(
        pyqSyntheticIds.map(id => resolvePYQQuestion(id, pyqDocCache))
      );
      pyqQuestions = resolved.filter(Boolean);
    }

    const questionMap = new Map();
    realQuestions.forEach(q => questionMap.set(q._id.toString(), q));
    pyqQuestions.forEach(q => questionMap.set(q._id, q));

    testObj.questions = (testObj.questions || []).map(qId => {
      const idStr = typeof qId === 'string' ? qId : qId.toString();
      return questionMap.get(idStr) || { _id: idStr, _missing: true };
    }).filter(q => !q._missing);

    res.json({ success: true, data: testObj });
  } catch (error) {
    next(error);
  }
};

const getTestWithQuestions = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const testObj = test.toObject();

    const realIds = [];
    const pyqSyntheticIds = [];

    (testObj.questions || []).forEach((qId) => {
      const idStr = typeof qId === 'string' ? qId : qId.toString();
      if (isPYQSyntheticId(idStr)) pyqSyntheticIds.push(idStr);
      else realIds.push(qId);
    });

    let realQuestions = [];
    if (realIds.length > 0) {
      realQuestions = await Question.find({ _id: { $in: realIds } })
        .populate('passageId')
        .populate('diDataId')
        .lean();
    }

    let pyqQuestions = [];
    if (pyqSyntheticIds.length > 0) {
      const pyqDocCache = {};
      const resolved = await Promise.all(
        pyqSyntheticIds.map(id => resolvePYQQuestion(id, pyqDocCache))
      );
      pyqQuestions = resolved.filter(Boolean);
    }

    const questionMap = new Map();
    realQuestions.forEach(q => questionMap.set(q._id.toString(), q));
    pyqQuestions.forEach(q => questionMap.set(q._id, q));

    testObj.questions = (testObj.questions || []).map(qId => {
      const idStr = typeof qId === 'string' ? qId : qId.toString();
      return questionMap.get(idStr) || null;
    }).filter(Boolean);

    res.json({ success: true, data: testObj });
  } catch (error) {
    console.error('[getTestWithQuestions] Error:', error);
    try {
      const test = await Test.findById(req.params.id).populate('questions');
      if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
      res.json({ success: true, data: test });
    } catch (err) {
      next(err);
    }
  }
};

// ═══════════════════════════════════════════════════════
//   CREATE TEST — with smart PYQ metadata extraction
// ═══════════════════════════════════════════════════════
const createTest = async (req, res, next) => {
  try {
    const testData = req.body;

    if (!testData.title) {
      testData.title = await autoGenerator.generateTestTitle(testData);
    }

    const typeConfig = config.testTypes[testData.testType];
    if (typeConfig) {
      if (!testData.duration) testData.duration = typeConfig.defaultDuration;
    }

    // ═══ HANDLE MIXED QUESTION IDS ═══
    if (testData.questions && Array.isArray(testData.questions)) {
      const cleanedIds = [];
      let pyqCount = 0;
      let bankCount = 0;

      for (const qId of testData.questions) {
        const idStr = typeof qId === 'string' ? qId : String(qId);
        if (isPYQSyntheticId(idStr)) {
          cleanedIds.push(idStr);
          pyqCount++;
        } else {
          cleanedIds.push(qId);
          bankCount++;
        }
      }

      testData.questions = cleanedIds;
      testData.pyqCount = pyqCount;
      testData.bankCount = bankCount;
      testData.hasPYQ = pyqCount > 0;

      if (pyqCount > 0 && bankCount === 0) testData.sourceType = 'pyq';
      else if (pyqCount > 0 && bankCount > 0) testData.sourceType = 'mixed';
      else testData.sourceType = 'bank';

      // ═══ EXTRACT PYQ METADATA — units, chapters, topics, years ═══
      if (pyqCount > 0) {
        const pyqMeta = await extractPYQMetadata(cleanedIds);
        if (pyqMeta) {
          testData.pyqYears = pyqMeta.years;
          testData.pyqSessions = pyqMeta.sessions;
          testData.pyqUnits = pyqMeta.units;
          testData.pyqChapters = pyqMeta.chapters;
          testData.pyqTopics = pyqMeta.topics;

          // Set year/session from PYQ if not already set
          if (!testData.year && pyqMeta.years.length > 0) {
            testData.year = pyqMeta.years.join(', ');
          }
          if (!testData.session && pyqMeta.sessions.length > 0) {
            testData.session = pyqMeta.sessions.join(', ');
          }

          // ═══ SMART: Merge PYQ unit/chapter/topic into main fields if empty ═══
          if (!testData.unit && pyqMeta.units.length > 0) {
            testData.unit = pyqMeta.units.join(', ');
          }
          if (!testData.chapter && pyqMeta.chapters.length > 0) {
            testData.chapter = pyqMeta.chapters.slice(0, 5).join(', ');
          }
          if (!testData.topic && pyqMeta.topics.length > 0) {
            testData.topic = pyqMeta.topics.slice(0, 5).join(', ');
          }

          // Auto-detect paper from PYQ if not set
          if (!testData.paper && pyqMeta.papers.length > 0) {
            testData.paper = pyqMeta.papers.length > 1 ? 'combined' : pyqMeta.papers[0];
          }

          console.log(`[createTest] PYQ metadata extracted: ${pyqCount} PYQ Q, years=${pyqMeta.years}, units=${pyqMeta.units.length}, chapters=${pyqMeta.chapters.length}`);
        }
      }
    }

    testData.totalQuestions = (testData.questions && testData.questions.length) || 0;

    if (testData.totalQuestions < 1) {
      return res.status(400).json({
        success: false,
        message: 'No questions provided for the test.'
      });
    }

    testData.totalMarks = testData.totalQuestions * (testData.marksPerQuestion || 2);

    if (!testData.instructions || testData.instructions.en?.length === 0) {
      testData.instructions = autoGenerator.getDefaultInstructions(testData);
    }

    // Add PYQ tags
    if (testData.hasPYQ) {
      testData.tags = [...new Set([
        ...(testData.tags || []),
        'pyq',
        ...(testData.pyqYears || []).map(y => `pyq_${y}`),
        testData.sourceType
      ])];
    }

    const test = await Test.create(testData);

    res.status(201).json({
      success: true,
      message: `Test created with ${test.totalQuestions} questions${test.hasPYQ ? ` (${test.pyqCount} PYQ)` : ''}`,
      data: test
    });
  } catch (error) {
    console.error('[createTest] Error:', error.message);
    next(error);
  }
};

const generateRandomTest = async (req, res, next) => {
  try {
    const { testType, paper, title, questionsPerUnit, totalQuestions, duration, negativeMarking = false, negativeMarks = 0 } = req.body;
    if (!['full_mock_p1', 'full_mock_p2', 'full_mock_combined'].includes(testType)) {
      return res.status(400).json({ success: false, message: 'Random generation only available for full mock tests' });
    }
    const questions = await randomSelector.selectRandomQuestions({ paper, questionsPerUnit, totalQuestions, priority: 'unattempted' });
    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Not enough questions available' });
    }
    const generatedTitle = title || await autoGenerator.generateTestTitle({ testType, paper });
    const typeConfig = config.testTypes[testType];
    const test = await Test.create({
      title: generatedTitle, testType, paper,
      questions: questions.map(q => q._id),
      totalQuestions: questions.length,
      duration: duration || typeConfig.defaultDuration,
      marksPerQuestion: 2, negativeMarking, negativeMarks,
      totalMarks: questions.length * 2,
      randomConfig: { enabled: true, questionsPerUnit },
      instructions: autoGenerator.getDefaultInstructions({ testType, paper }),
      sourceType: 'bank', hasPYQ: false, bankCount: questions.length
    });
    res.status(201).json({ success: true, message: `Random test generated with ${questions.length} questions`, data: test });
  } catch (error) {
    next(error);
  }
};

const updateTest = async (req, res, next) => {
  try {
    const updates = req.body;
    if (updates.questions) {
      updates.totalQuestions = updates.questions.length;
      updates.totalMarks = updates.totalQuestions * (updates.marksPerQuestion || 2);

      // Re-calculate PYQ metadata
      let pyqC = 0, bankC = 0;
      updates.questions.forEach(qId => {
        if (isPYQSyntheticId(typeof qId === 'string' ? qId : String(qId))) pyqC++;
        else bankC++;
      });
      updates.pyqCount = pyqC;
      updates.bankCount = bankC;
      updates.hasPYQ = pyqC > 0;
      updates.sourceType = pyqC > 0 && bankC === 0 ? 'pyq' : pyqC > 0 ? 'mixed' : 'bank';

      if (pyqC > 0) {
        const pyqMeta = await extractPYQMetadata(updates.questions);
        if (pyqMeta) {
          updates.pyqYears = pyqMeta.years;
          updates.pyqSessions = pyqMeta.sessions;
          updates.pyqUnits = pyqMeta.units;
          updates.pyqChapters = pyqMeta.chapters;
          updates.pyqTopics = pyqMeta.topics;
        }
      }
    }
    const test = await Test.findByIdAndUpdate(req.params.id, { ...updates, updatedAt: new Date() }, { new: true, runValidators: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: 'Test updated successfully', data: test });
  } catch (error) {
    next(error);
  }
};

const updateTestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const test = await Test.findByIdAndUpdate(req.params.id, { status, updatedAt: new Date() }, { new: true });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, message: `Test status updated to ${status}`, data: test });
  } catch (error) {
    next(error);
  }
};

const deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    test.status = 'archived';
    await test.save();
    res.json({ success: true, message: 'Test archived successfully' });
  } catch (error) {
    next(error);
  }
};

const addQuestionsToTest = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'Please provide question IDs' });
    }
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const existingIds = test.questions.map(q => (typeof q === 'string' ? q : q.toString()));
    const newIds = questionIds.filter(id => !existingIds.includes(typeof id === 'string' ? id : String(id)));
    test.questions.push(...newIds);
    test.totalQuestions = test.questions.length;
    test.totalMarks = test.totalQuestions * test.marksPerQuestion;

    // Recalc PYQ metadata
    const pyqMeta = await extractPYQMetadata(test.questions);
    if (pyqMeta && pyqMeta.pyqCount > 0) {
      test.hasPYQ = true;
      test.pyqCount = pyqMeta.pyqCount;
      test.pyqYears = pyqMeta.years;
      test.pyqUnits = pyqMeta.units;
      test.pyqChapters = pyqMeta.chapters;
      test.pyqTopics = pyqMeta.topics;
    }

    await test.save();
    res.json({ success: true, message: `${newIds.length} questions added to test`, data: test });
  } catch (error) {
    next(error);
  }
};

const removeQuestionsFromTest = async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'Please provide question IDs' });
    }
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const removeSet = new Set(questionIds.map(id => typeof id === 'string' ? id : String(id)));
    test.questions = test.questions.filter(q => !removeSet.has(typeof q === 'string' ? q : q.toString()));
    test.totalQuestions = test.questions.length;
    test.totalMarks = test.totalQuestions * test.marksPerQuestion;
    await test.save();
    res.json({ success: true, message: `${questionIds.length} questions removed from test`, data: test });
  } catch (error) {
    next(error);
  }
};

const getTestAttempts = async (req, res, next) => {
  try {
    const attempts = await TestAttempt.getAttemptHistory(req.params.id);
    res.json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTests, getFilterOptions, getTestStats, getTestTypes,
  getTestById, getTestWithQuestions,
  createTest, generateRandomTest,
  updateTest, updateTestStatus, deleteTest,
  addQuestionsToTest, removeQuestionsFromTest, getTestAttempts
};