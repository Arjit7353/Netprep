// server/controllers/questionController.js

const Question = require('../models/Question');
const Passage = require('../models/Passage');
const DIData = require('../models/DIData');
const smartParser = require('../utils/smartParser');
const translateHelper = require('../utils/translateHelper');

// ================================================================
// HELPERS
// ================================================================

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const toFilterValue = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (Array.isArray(val)) {
    const cleaned = val
      .map(v => (typeof v === 'string' ? v.trim() : v))
      .filter(v => v !== null && v !== undefined && v !== '');
    if (cleaned.length === 0) return null;
    if (cleaned.length === 1) return cleaned[0];
    return cleaned;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    return trimmed;
  }
  return val;
};

// ================================================================
// NORMALIZATION HELPERS
// ================================================================

const VALID_PAPERS = ['paper1', 'paper2'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const normalizePaperValue = (value) => {
  if (!value) return 'paper1';
  if (VALID_PAPERS.includes(value)) return value;
  const v = String(value).toLowerCase().trim();
  if (v === 'paper1' || v === 'p1' || v === '1') return 'paper1';
  if (v === 'paper2' || v === 'p2' || v === '2') return 'paper2';
  if (v.includes('history') || v.includes('इतिहास')) return 'paper2';
  if (v.includes('general') || v.includes('teaching')) return 'paper1';
  return 'paper1';
};

const normalizeDifficultyValue = (value) => {
  if (!value) return 'medium';
  if (VALID_DIFFICULTIES.includes(value)) return value;
  const v = String(value).toLowerCase().trim();
  if (v === 'easy' || v === 'सरल' || v === 'simple') return 'easy';
  if (v === 'hard' || v === 'कठिन' || v === 'difficult' || v === 'tough') return 'hard';
  if (v === 'medium' || v === 'मध्यम' || v === 'moderate') return 'medium';
  if (v.includes('hard')) return 'hard';
  if (v.includes('easy')) return 'easy';
  return 'medium';
};

const normalizeBeforeSave = (qd) => {
  qd.paper = normalizePaperValue(qd.paper);
  qd.difficulty = normalizeDifficultyValue(qd.difficulty);
  if (qd.correctAnswer === undefined || qd.correctAnswer === null) {
    qd.correctAnswer = 0;
  }
  qd.correctAnswer = parseInt(qd.correctAnswer, 10) || 0;
  if (!qd.question) qd.question = { hi: '', en: '' };
  if (!qd.options) qd.options = { hi: [], en: [] };
  if (!qd.unit) qd.unit = qd.chapter || qd.topic || 'General';
  return qd;
};

// ================================================================
// SMART FLEXIBLE FILTER BUILDER
// ================================================================

const buildSmartFilter = (fieldName, value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    return buildSingleSmartFilter(fieldName, value);
  }
  if (Array.isArray(value)) {
    if (value.length === 1) {
      return buildSingleSmartFilter(fieldName, value[0]);
    }
    const conditions = value.map(v => {
      const f = buildSingleSmartFilter(fieldName, v);
      if (f && f[fieldName]) {
        return { [fieldName]: f[fieldName] };
      }
      return null;
    }).filter(Boolean);
    if (conditions.length === 0) return null;
    if (conditions.length === 1) return conditions[0];
    return { $or: conditions };
  }
  return null;
};

const buildSingleSmartFilter = (fieldName, value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const basePart = trimmed.split(':')[0].trim();
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'has', 'have', 'its', 'unit', 'chapter'];
  const allWords = trimmed
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.includes(w.toLowerCase()));
  const regexParts = [];
  regexParts.push(escapeRegex(trimmed));
  if (basePart !== trimmed) {
    regexParts.push('^' + escapeRegex(basePart) + '(\\b|$|:)');
  }
  const sortedWords = [...allWords].sort((a, b) => b.length - a.length).slice(0, 2);
  sortedWords.forEach(word => {
    if (word.length >= 4) {
      regexParts.push(escapeRegex(word));
    }
  });
  if (regexParts.length === 0) {
    return { [fieldName]: trimmed };
  }
  const combinedRegex = regexParts.join('|');
  return {
    [fieldName]: {
      $regex: combinedRegex,
      $options: 'i'
    }
  };
};

const buildExactFilter = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    if (value.length === 1) return value[0];
    return { $in: value };
  }
  return value;
};

// ================================================================
// DUPLICATE CHECK HELPERS
// ================================================================

const extractQuestionText = (questionData) => {
  if (!questionData.question) return '';
  if (typeof questionData.question === 'string') return questionData.question;
  if (typeof questionData.question === 'object') {
    return questionData.question.hi || questionData.question.en || '';
  }
  return '';
};

const extractUniqueText = (questionData) => {
  const type = questionData.questionType;
  switch (type) {
    case 'assertion_reason': {
      if (questionData.assertionReasonData?.assertion) {
        const a = questionData.assertionReasonData.assertion;
        const text = typeof a === 'object' ? (a.hi || a.en || '') : a;
        if (text && text.length >= 15) return text;
      }
      break;
    }
    case 'match_following': {
      if (questionData.matchData?.listA) {
        const listA = questionData.matchData.listA;
        const items = typeof listA === 'object' && !Array.isArray(listA)
          ? (listA.hi || listA.en || [])
          : (Array.isArray(listA) ? listA : []);
        if (items.length >= 2) {
          const text = items.slice(0, 3).join(' | ');
          if (text.length >= 15) return text;
        }
      }
      break;
    }
    case 'sequence_order': {
      if (questionData.sequenceData?.items) {
        const items = questionData.sequenceData.items;
        const hiItems = typeof items === 'object' && !Array.isArray(items)
          ? (items.hi || items.en || [])
          : (Array.isArray(items) ? items : []);
        if (hiItems.length >= 2) {
          const text = hiItems.slice(0, 3).join(' | ');
          if (text.length >= 15) return text;
        }
      }
      break;
    }
    case 'statement_based': {
      if (questionData.statementData?.statements) {
        const stmts = questionData.statementData.statements;
        const hiStmts = typeof stmts === 'object' && !Array.isArray(stmts)
          ? (stmts.hi || stmts.en || [])
          : (Array.isArray(stmts) ? stmts : []);
        if (hiStmts.length >= 1) {
          const text = hiStmts.slice(0, 2).join(' | ');
          if (text.length >= 15) return text;
        }
      }
      break;
    }
    default:
      break;
  }
  return extractQuestionText(questionData);
};

const isDuplicateQuestion = async (questionData) => {
  try {
    const searchText = extractUniqueText(questionData);
    if (!searchText || searchText.length < 15) return false;
    const searchSnippet = searchText.substring(0, 80);
    const escapedSnippet = escapeRegex(searchSnippet);
    const searchConditions = [
      { 'question.hi': { $regex: escapedSnippet, $options: 'i' } },
      { 'question.en': { $regex: escapedSnippet, $options: 'i' } }
    ];
    const type = questionData.questionType;
    if (type === 'assertion_reason') {
      searchConditions.push(
        { 'assertionReasonData.assertion.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'assertionReasonData.assertion.en': { $regex: escapedSnippet, $options: 'i' } }
      );
    } else if (type === 'sequence_order') {
      searchConditions.push(
        { 'sequenceData.items.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'sequenceData.items.en': { $regex: escapedSnippet, $options: 'i' } }
      );
    } else if (type === 'match_following') {
      searchConditions.push(
        { 'matchData.listA.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'matchData.listA.en': { $regex: escapedSnippet, $options: 'i' } }
      );
    } else if (type === 'statement_based') {
      searchConditions.push(
        { 'statementData.statements.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'statementData.statements.en': { $regex: escapedSnippet, $options: 'i' } }
      );
    }
    const existing = await Question.findOne({
      isActive: { $ne: false },
      $or: searchConditions
    }).select('_id questionNumber').lean();
    return !!existing;
  } catch (err) {
    console.warn('[DuplicateCheck] Error:', err.message);
    return false;
  }
};

const extractRawUniqueText = (q, type) => {
  switch (type) {
    case 'assertion_reason':
      if (q.assertion && q.assertion.length >= 15) return q.assertion;
      break;
    case 'match_following':
      if (q.listA && Array.isArray(q.listA) && q.listA.length >= 2) {
        const text = q.listA.slice(0, 3).join(' | ');
        if (text.length >= 15) return text;
      }
      break;
    case 'sequence_order':
      if (q.items && Array.isArray(q.items) && q.items.length >= 2) {
        const text = q.items.slice(0, 3).join(' | ');
        if (text.length >= 15) return text;
      }
      break;
    case 'statement_based':
      if (q.statements && Array.isArray(q.statements) && q.statements.length >= 1) {
        const text = q.statements.slice(0, 2).join(' | ');
        if (text.length >= 15) return text;
      }
      break;
    default:
      break;
  }
  return q.question || q.questionText || '';
};

const checkDuplicatesForPreview = async (jsonData) => {
  try {
    const questions = jsonData.questions || [];
    const duplicates = [];
    let checkedCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || typeof q !== 'object') continue;
      const type = smartParser.detectQuestionType(q);
      if (type === 'passage_based' || type.startsWith('di_')) continue;
      const searchText = extractRawUniqueText(q, type);
      if (!searchText || searchText.length < 15) continue;
      const searchSnippet = searchText.substring(0, 80);
      const escapedSnippet = escapeRegex(searchSnippet);
      const searchConditions = [
        { 'question.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'question.en': { $regex: escapedSnippet, $options: 'i' } }
      ];
      if (type === 'assertion_reason') {
        searchConditions.push(
          { 'assertionReasonData.assertion.hi': { $regex: escapedSnippet, $options: 'i' } },
          { 'assertionReasonData.assertion.en': { $regex: escapedSnippet, $options: 'i' } }
        );
      } else if (type === 'sequence_order') {
        searchConditions.push(
          { 'sequenceData.items.hi': { $regex: escapedSnippet, $options: 'i' } },
          { 'sequenceData.items.en': { $regex: escapedSnippet, $options: 'i' } }
        );
      } else if (type === 'match_following') {
        searchConditions.push(
          { 'matchData.listA.hi': { $regex: escapedSnippet, $options: 'i' } },
          { 'matchData.listA.en': { $regex: escapedSnippet, $options: 'i' } }
        );
      } else if (type === 'statement_based') {
        searchConditions.push(
          { 'statementData.statements.hi': { $regex: escapedSnippet, $options: 'i' } },
          { 'statementData.statements.en': { $regex: escapedSnippet, $options: 'i' } }
        );
      }
      const existing = await Question.findOne({
        isActive: { $ne: false },
        $or: searchConditions
      }).select('questionNumber question assertionReasonData sequenceData matchData statementData').lean();
      if (existing) {
        const existingText = existing.question?.hi || existing.question?.en ||
          existing.assertionReasonData?.assertion?.hi ||
          (existing.sequenceData?.items?.hi || []).slice(0, 2).join(', ') ||
          (existing.matchData?.listA?.hi || []).slice(0, 2).join(', ') ||
          (existing.statementData?.statements?.hi || []).slice(0, 1).join(', ') ||
          '';
        duplicates.push({
          inputIndex: i + 1,
          inputQuestion: searchText.substring(0, 100),
          existingNumber: existing.questionNumber,
          existingText: existingText.substring(0, 100)
        });
      }
      checkedCount++;
      if (checkedCount >= 50) break;
    }
    return { found: duplicates.length, checkedCount, list: duplicates.slice(0, 10) };
  } catch (err) {
    console.warn('[DuplicatesPreview] Failed:', err.message);
    return { found: 0, checkedCount: 0, list: [] };
  }
};

// ================================================================
// CONTROLLERS
// ================================================================

// @desc    Get all questions with filters
// @route   GET /api/questions
const getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, paper, unit, chapter, topic,
      questionType, difficulty, source, year, search,
      startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', isPYQ
    } = req.query;

    const filter = { isActive: { $ne: false } };
    const andConditions = [];

    const paperVal = toFilterValue(paper);
    if (paperVal) {
      const v = buildExactFilter(paperVal);
      if (v) filter.paper = v;
    }

    const unitVal = toFilterValue(unit);
    if (unitVal) {
      const f = buildSmartFilter('unit', unitVal);
      if (f) {
        if (f.$or) andConditions.push(f);
        else Object.assign(filter, f);
      }
    }

    const chapterVal = toFilterValue(chapter);
    if (chapterVal) {
      const f = buildSmartFilter('chapter', chapterVal);
      if (f) {
        if (f.$or) andConditions.push(f);
        else Object.assign(filter, f);
      }
    }

    const topicVal = toFilterValue(topic);
    if (topicVal) {
      const f = buildSmartFilter('topic', topicVal);
      if (f) {
        if (f.$or) andConditions.push(f);
        else Object.assign(filter, f);
      }
    }

    const typeVal = toFilterValue(questionType);
    if (typeVal) {
      const v = buildExactFilter(typeVal);
      if (v) filter.questionType = v;
    }

    const diffVal = toFilterValue(difficulty);
    if (diffVal) {
      const v = buildExactFilter(diffVal);
      if (v) filter.difficulty = v;
    }

    if (source) filter.source = { $regex: source, $options: 'i' };

    const yearVal = toFilterValue(year);
    if (yearVal) {
      const v = buildExactFilter(yearVal);
      if (v) filter.year = v;
    }

    if (isPYQ === 'true') filter.isPYQ = true;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      andConditions.push({
        $or: [
          { 'question.hi': { $regex: search, $options: 'i' } },
          { 'question.en': { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    console.log('[getQuestions] Filter:', JSON.stringify(filter, null, 2));

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('passageId')
        .populate('diDataId')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Question.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get question statistics
// @route   GET /api/questions/stats
const getQuestionStats = async (req, res, next) => {
  try {
    const { paper } = req.query;
    const matchFilter = { isActive: { $ne: false } };

    const paperVal = toFilterValue(paper);
    if (paperVal) {
      const v = buildExactFilter(paperVal);
      if (v) matchFilter.paper = v;
    }

    const [total, typeCount, difficultyCount, unitCount, recentCount, passageCount, diCount] =
      await Promise.all([
        Question.countDocuments(matchFilter),
        Question.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$questionType', count: { $sum: 1 } } }
        ]),
        Question.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ]),
        Question.aggregate([
          { $match: matchFilter },
          { $group: { _id: { paper: '$paper', unit: '$unit' }, count: { $sum: 1 } } },
          { $sort: { '_id.paper': 1, '_id.unit': 1 } }
        ]),
        Question.countDocuments({
          ...matchFilter,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        Passage.countDocuments({ isActive: { $ne: false } }),
        DIData.countDocuments({ isActive: { $ne: false } })
      ]);

    res.json({
      success: true,
      data: {
        total,
        byType: typeCount.reduce((a, i) => { a[i._id] = i.count; return a; }, {}),
        byDifficulty: difficultyCount.reduce((a, i) => { a[i._id] = i.count; return a; }, {}),
        byUnit: unitCount,
        recentAdditions: recentCount,
        passageCount,
        diCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single question by ID
// @route   GET /api/questions/:id
const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('passageId').populate('diDataId');
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: question });
  } catch (error) { next(error); }
};

// @desc    Create new question
// @route   POST /api/questions
const createQuestion = async (req, res, next) => {
  try {
    const questionData = req.body;
    normalizeBeforeSave(questionData);
    const srcLang = questionData.language || 'hi';
    try { await translateHelper.translateQuestion(questionData, srcLang); }
    catch (e) { console.warn('Translation failed:', e.message); }
    const question = await Question.create(questionData);
    if (question.passageId) await Passage.findByIdAndUpdate(question.passageId, { $inc: { questionCount: 1 } });
    if (question.diDataId) await DIData.findByIdAndUpdate(question.diDataId, { $inc: { questionCount: 1 } });
    res.status(201).json({ success: true, message: 'Question created', data: question });
  } catch (error) { next(error); }
};

// @desc    Validate JSON before import
// @route   POST /api/questions/import/validate
const validateImport = async (req, res, next) => {
  try {
    const jsonData = req.body;
    if (!jsonData || typeof jsonData !== 'object') {
      return res.status(400).json({
        success: false,
        validation: { isValid: false, errors: ['Invalid JSON data'], warnings: [] }
      });
    }

    const validation = smartParser.validateJSONStructure(jsonData);
    let preview = null;

    if (validation.isValid) {
      try {
        const questions = jsonData.questions || [];
        const typePreview = {};
        let passageCount = 0, diCount = 0, totalQuestions = 0;

        questions.forEach((q, idx) => {
          if (!q || typeof q !== 'object') return;
          const type = smartParser.detectQuestionType(q);

          if (type === 'passage_based') {
            passageCount++;
            let pQ = [];
            if (typeof q.passage === 'string' && Array.isArray(q.questions)) pQ = q.questions;
            else if (q.passage && typeof q.passage === 'object') pQ = q.questions || q.passage.questions || [];
            else if (q.passageContent && Array.isArray(q.questions)) pQ = q.questions;
            else if (q.type === 'passage_based' || q.questionType === 'passage_based') pQ = q.questions || [];
            const c = Array.isArray(pQ) ? pQ.length : 0;
            typePreview['passage_based'] = (typePreview['passage_based'] || 0) + c;
            totalQuestions += c;
          } else if (type.startsWith('di_')) {
            diCount++;
            const diRaw = q.diData || q;
            const dQ = Array.isArray(diRaw.questions) ? diRaw.questions : [];
            typePreview[type] = (typePreview[type] || 0) + dQ.length;
            totalQuestions += dQ.length;
          } else {
            typePreview[type] = (typePreview[type] || 0) + 1;
            totalQuestions += 1;
          }
        });

        const duplicateInfo = await checkDuplicatesForPreview(jsonData);
        preview = { totalItems: questions.length, totalQuestions, byType: typePreview, passages: passageCount, diData: diCount, duplicates: duplicateInfo };
      } catch (err) { console.warn('[Validate] Preview failed:', err.message); }
    }

    res.json({ success: true, validation, preview });
  } catch (error) { next(error); }
};

// @desc    Import questions from JSON
// @route   POST /api/questions/import
const importQuestions = async (req, res, next) => {
  try {
    const jsonData = req.body;
    const skipDuplicates = req.query.skipDuplicates === 'true' || jsonData._skipDuplicates === true;
    if ('_skipDuplicates' in jsonData) delete jsonData._skipDuplicates;

    console.log('[Import] Start:', { skipDuplicates, count: jsonData.questions?.length || 0 });

    const validation = smartParser.validateJSONStructure(jsonData);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: 'Invalid JSON', errors: validation.errors, warnings: validation.warnings });
    }

    let parseResult;
    try { parseResult = await smartParser.parseJSONImport(jsonData); }
    catch (e) { return res.status(400).json({ success: false, message: 'Parse failed: ' + e.message, errors: [e.message] }); }

    const savedQuestions = [], savedPassages = [], savedDIData = [], saveErrors = [], skippedQuestions = [];
    const gPassage = {}, gDI = {};

    // Passages
    for (const pd of parseResult.passages) {
      try {
        const gid = pd._groupId; delete pd._groupId;
        if (!pd.content) pd.content = { hi: '', en: '' };
        pd.paper = normalizePaperValue(pd.paper);
        const p = await Passage.create(pd);
        savedPassages.push(p);
        if (gid) gPassage[gid] = p._id;
      } catch (e) { saveErrors.push({ type: 'passage', error: e.message }); }
    }

    // DI Data
    for (const dd of parseResult.diDataItems) {
      try {
        const gid = dd._groupId; delete dd._groupId;
        if (!dd.title) dd.title = { hi: 'DI', en: 'DI' };
        dd.paper = normalizePaperValue(dd.paper);
        const d = await DIData.create(dd);
        savedDIData.push(d);
        if (gid) gDI[gid] = d._id;
      } catch (e) { saveErrors.push({ type: 'diData', error: e.message }); }
    }

    // Questions
    for (const qd of parseResult.questions) {
      try {
        if (qd._passageGroupId) { const pid = gPassage[qd._passageGroupId]; if (pid) qd.passageId = pid; delete qd._passageGroupId; }
        if (qd._diGroupId) { const did = gDI[qd._diGroupId]; if (did) qd.diDataId = did; delete qd._diGroupId; }

        const isSubQ = !!qd.passageId || !!qd.diDataId;
        if (skipDuplicates && !isSubQ) {
          if (await isDuplicateQuestion(qd)) {
            const dupText = extractUniqueText(qd);
            skippedQuestions.push({ type: qd.questionType, reason: 'duplicate', question: dupText.substring(0, 100) });
            continue;
          }
        }

        normalizeBeforeSave(qd);
        delete qd._idx;
        delete qd._src;

        savedQuestions.push(await Question.create(qd));
      } catch (e) {
        console.error('[Import] Save error:', e.message, '| Type:', qd.questionType, '| Paper:', qd.paper, '| Difficulty:', qd.difficulty);
        saveErrors.push({
          type: 'question',
          questionType: qd.questionType,
          error: e.message,
          question: extractQuestionText(qd).substring(0, 100)
        });
      }
    }

    // Update counts
    for (const p of savedPassages) { try { const c = await Question.countDocuments({ passageId: p._id, isActive: { $ne: false } }); await Passage.findByIdAndUpdate(p._id, { questionCount: c }); } catch (e) {} }
    for (const d of savedDIData) { try { const c = await Question.countDocuments({ diDataId: d._id, isActive: { $ne: false } }); await DIData.findByIdAndUpdate(d._id, { questionCount: c }); } catch (e) {} }

    const totalErrors = [...parseResult.errors, ...saveErrors];
    console.log(`[Import] Done: ${savedQuestions.length} saved, ${skippedQuestions.length} skipped, ${totalErrors.length} errors`);

    if (totalErrors.length > 0) {
      console.log('[Import] Error details:', totalErrors.slice(0, 5));
    }

    res.status(201).json({
      success: true,
      message: `Import: ${savedQuestions.length} saved` + (skippedQuestions.length > 0 ? `, ${skippedQuestions.length} skipped` : '') + (totalErrors.length > 0 ? `, ${totalErrors.length} errors` : ''),
      data: { questions: savedQuestions.length, passages: savedPassages.length, diData: savedDIData.length, skipped: skippedQuestions.length, errors: totalErrors.length, stats: parseResult.stats },
      skipped: skippedQuestions.length > 0 ? skippedQuestions : undefined,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined
    });
  } catch (error) { console.error('[Import] Fatal:', error); next(error); }
};

// @desc    Update question
// @route   PUT /api/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const updates = req.body;
    if (updates.language) { try { await translateHelper.translateQuestion(updates, updates.language); } catch (e) {} }
    if (updates.paper) updates.paper = normalizePaperValue(updates.paper);
    if (updates.difficulty) updates.difficulty = normalizeDifficultyValue(updates.difficulty);
    const question = await Question.findByIdAndUpdate(req.params.id, { ...updates, updatedAt: new Date() }, { new: true, runValidators: true });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question updated', data: question });
  } catch (error) { next(error); }
};

// @desc    Delete question (soft)
// @route   DELETE /api/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    question.isActive = false;
    await question.save();
    if (question.passageId) { const c = await Question.countDocuments({ passageId: question.passageId, isActive: { $ne: false } }); await Passage.findByIdAndUpdate(question.passageId, { questionCount: c }); }
    if (question.diDataId) { const c = await Question.countDocuments({ diDataId: question.diDataId, isActive: { $ne: false } }); await DIData.findByIdAndUpdate(question.diDataId, { questionCount: c }); }
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) { next(error); }
};

// @desc    Bulk delete
// @route   DELETE /api/questions/bulk
const bulkDeleteQuestions = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'Provide IDs' });
    const result = await Question.updateMany({ _id: { $in: ids } }, { isActive: false });
    res.json({ success: true, message: `${result.modifiedCount} deleted` });
  } catch (error) { next(error); }
};

// @desc    Get questions by passage
// @route   GET /api/questions/passage/:passageId
const getQuestionsByPassage = async (req, res, next) => {
  try {
    const questions = await Question.find({ passageId: req.params.passageId, isActive: { $ne: false } }).sort({ passageOrder: 1 });
    res.json({ success: true, data: questions });
  } catch (error) { next(error); }
};

// @desc    Get questions by DI
// @route   GET /api/questions/di/:diDataId
const getQuestionsByDI = async (req, res, next) => {
  try {
    const questions = await Question.find({ diDataId: req.params.diDataId, isActive: { $ne: false } }).sort({ diOrder: 1 });
    res.json({ success: true, data: questions });
  } catch (error) { next(error); }
};

// @desc    Get passages list
// @route   GET /api/questions/passages/list
const getPassages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, paper, unit } = req.query;
    const filter = { isActive: { $ne: false } };

    const pv = toFilterValue(paper);
    if (pv) { const v = buildExactFilter(pv); if (v) filter.paper = v; }

    const uv = toFilterValue(unit);
    if (uv) {
      const f = buildSmartFilter('unit', uv);
      if (f && !f.$or) Object.assign(filter, f);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [passages, total] = await Promise.all([
      Passage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Passage.countDocuments(filter)
    ]);

    res.json({ success: true, data: passages, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

// @desc    Create passage
// @route   POST /api/questions/passages
const createPassage = async (req, res, next) => {
  try {
    const pd = req.body;
    const lang = pd.language || 'hi';
    if (pd.content && typeof pd.content === 'string') {
      try {
        const translated = await translateHelper.translateText(pd.content, lang);
        pd.content = { [lang]: pd.content, [lang === 'hi' ? 'en' : 'hi']: translated };
      } catch (e) {
        pd.content = { [lang]: pd.content, [lang === 'hi' ? 'en' : 'hi']: pd.content };
      }
    }
    const passage = await Passage.create(pd);
    res.status(201).json({ success: true, message: 'Passage created', data: passage });
  } catch (error) { next(error); }
};

// @desc    Get passage by ID with questions
// @route   GET /api/questions/passages/:id
const getPassageById = async (req, res, next) => {
  try {
    const passage = await Passage.findById(req.params.id);
    if (!passage) return res.status(404).json({ success: false, message: 'Passage not found' });
    const questions = await Question.find({ passageId: passage._id, isActive: { $ne: false } }).sort({ passageOrder: 1 });
    res.json({ success: true, data: { ...passage.toObject(), questions } });
  } catch (error) { next(error); }
};

// @desc    Get DI data list
// @route   GET /api/questions/di-data/list
const getDIDataList = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, paper, diType } = req.query;
    const filter = { isActive: { $ne: false } };

    const pv = toFilterValue(paper);
    if (pv) { const v = buildExactFilter(pv); if (v) filter.paper = v; }

    const dv = toFilterValue(diType);
    if (dv) { const v = buildExactFilter(dv); if (v) filter.diType = v; }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [diDataList, total] = await Promise.all([
      DIData.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      DIData.countDocuments(filter)
    ]);

    res.json({ success: true, data: diDataList, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

// @desc    Create DI data
// @route   POST /api/questions/di-data
const createDIData = async (req, res, next) => {
  try {
    const dd = req.body;
    const lang = dd.language || 'hi';
    try { await translateHelper.translateDIData(dd, lang); } catch (e) {}
    const di = await DIData.create(dd);
    res.status(201).json({ success: true, message: 'DI Data created', data: di });
  } catch (error) { next(error); }
};

// @desc    Get DI data by ID with questions
// @route   GET /api/questions/di-data/:id
const getDIDataById = async (req, res, next) => {
  try {
    const diData = await DIData.findById(req.params.id);
    if (!diData) return res.status(404).json({ success: false, message: 'DI Data not found' });
    const questions = await Question.find({ diDataId: diData._id, isActive: { $ne: false } }).sort({ diOrder: 1 });
    res.json({ success: true, data: { ...diData.toObject(), questions } });
  } catch (error) { next(error); }
};

// ================================================================
// PYQ QUESTION BANK
// ================================================================

// @desc    Get single PYQ question by pyqId
// @route   GET /api/questions/pyq-question/:pyqId
const getPYQQuestionById = async (req, res, next) => {
  try {
    const { pyqId } = req.params;

    if (!pyqId || !pyqId.startsWith('pyq_')) {
      return res.status(400).json({ success: false, message: 'Invalid PYQ ID format' });
    }

    const match = pyqId.match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid PYQ ID format. Expected: pyq_{docId}_{qNo}' });
    }

    const [, docId, qNoStr] = match;
    const qNo = parseInt(qNoStr, 10);

    const PYQAnalysis = require('../models/PYQAnalysis');
    const pyqDoc = await PYQAnalysis.findById(docId).lean();

    if (!pyqDoc) {
      return res.status(404).json({ success: false, message: 'PYQ document not found' });
    }

    const questionEntry = (pyqDoc.questionTopicMap || []).find(q => q.qNo === qNo);
    if (!questionEntry) {
      return res.status(404).json({ success: false, message: `Question #${qNo} not found in PYQ ${pyqDoc.displayLabel}` });
    }

    const Test = require('../models/Test');
    const testsUsingThis = await Test.find({
      questions: pyqId,
      status: { $ne: 'archived' }
    }).select('_id title testType').lean();

    res.json({
      success: true,
      data: {
        pyqId,
        docId,
        qNo,
        pyqLabel: pyqDoc.displayLabel,
        year: pyqDoc.year,
        session: pyqDoc.session,
        shift: pyqDoc.shift,
        paper: pyqDoc.paper,
        question: questionEntry,
        linkedTests: testsUsingThis.map(t => ({
          _id: t._id,
          title: t.title,
          testType: t.testType
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a PYQ question with review/verification support
// @route   PUT /api/questions/pyq-question/:pyqId
const updatePYQQuestion = async (req, res, next) => {
  try {
    const { pyqId } = req.params;
    const updates = req.body;

    if (!pyqId || !pyqId.startsWith('pyq_')) {
      return res.status(400).json({ success: false, message: 'Invalid PYQ ID format' });
    }

    const match = pyqId.match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid PYQ ID format' });
    }

    const [, docId, qNoStr] = match;
    const qNo = parseInt(qNoStr, 10);

    const PYQAnalysis = require('../models/PYQAnalysis');
    const pyqDoc = await PYQAnalysis.findById(docId);

    if (!pyqDoc) {
      return res.status(404).json({ success: false, message: 'PYQ document not found' });
    }

    const qIndex = (pyqDoc.questionTopicMap || []).findIndex(q => q.qNo === qNo);
    if (qIndex === -1) {
      return res.status(404).json({ success: false, message: `Question #${qNo} not found` });
    }

    const existingQ = pyqDoc.questionTopicMap[qIndex];

    // ═══ Content editable fields ═══
    const editableFields = [
      'questionText', 'questionTextHi', 'questionTextEn',
      'options', 'optionsHi', 'optionsEn',
      'correctAnswer',
      'explanation', 'explanationHi', 'explanationEn',
      'assertion', 'assertionHi', 'assertionEn',
      'reason', 'reasonHi', 'reasonEn',
      'statements', 'statementsHi', 'statementsEn', 'correctStatements',
      'listA', 'listAHi', 'listAEn',
      'listB', 'listBHi', 'listBEn', 'correctMatch',
      'items', 'itemsHi', 'itemsEn', 'correctOrder',
      'passage', 'passageHi', 'passageEn', 'passageTitle',
      'caseletText', 'caseletTextHi', 'caseletTextEn',
      'instruction', 'instructionHi',
      'type', 'difficulty', 'importance',
      'unitId', 'unitName', 'chapter', 'chapterHi',
      'topic', 'topicHi', 'subtopic', 'concept',
      'keyTerms', 'source'
    ];

    // ═══ Review/verification fields ═══
    const reviewFields = [
      'verificationStatus', 'correctnessStatus',
      'reviewNotes', 'reviewedBy',
      'isFlagged', 'flagReason'
    ];

    let changedFields = [];
    let previousValues = {};
    const actionType = updates._actionType || 'edit';
    const actionNote = updates._actionNote || '';
    const actionBy = updates._actionBy || 'admin';

    // Clean internal action fields
    delete updates._actionType;
    delete updates._actionNote;
    delete updates._actionBy;

    // ═══ Apply content updates ═══
    for (const field of editableFields) {
      if (updates[field] !== undefined) {
        const oldVal = JSON.stringify(existingQ[field]);
        const newVal = JSON.stringify(updates[field]);
        if (oldVal !== newVal) {
          previousValues[field] = existingQ[field];
          existingQ[field] = updates[field];
          changedFields.push(field);
        }
      }
    }

    // ═══ Apply review/verification updates ═══
    for (const field of reviewFields) {
      if (updates[field] !== undefined) {
        const oldVal = JSON.stringify(existingQ[field]);
        const newVal = JSON.stringify(updates[field]);
        if (oldVal !== newVal) {
          previousValues[field] = existingQ[field];
          existingQ[field] = updates[field];
          changedFields.push(field);
        }
      }
    }

    // Handle sub-questions update
    if (updates.subQuestions !== undefined) {
      previousValues.subQuestions = existingQ.subQuestions;
      existingQ.subQuestions = updates.subQuestions;
      changedFields.push('subQuestions');
    }

    // ═══ Handle verification status changes ═══
    if (updates.verificationStatus) {
      existingQ.verificationStatus = updates.verificationStatus;
      if (updates.verificationStatus === 'approved' || updates.verificationStatus === 'verified') {
        existingQ.reviewedAt = new Date();
        existingQ.reviewedBy = actionBy;
      }
    }

    if (updates.correctnessStatus) {
      existingQ.correctnessStatus = updates.correctnessStatus;
    }

    if (updates.reviewNotes !== undefined) {
      existingQ.reviewNotes = updates.reviewNotes;
    }

    // ═══ Handle flagging ═══
    if (updates.isFlagged !== undefined) {
      existingQ.isFlagged = updates.isFlagged;
      if (updates.isFlagged) {
        existingQ.flaggedAt = new Date();
        existingQ.flagReason = updates.flagReason || '';
      } else {
        existingQ.flagReason = '';
        existingQ.flaggedAt = null;
      }
    }

    // ═══ Recalculate hasContent ═══
    const hasContent = !!(
      existingQ.questionTextHi || existingQ.questionTextEn || existingQ.questionText ||
      existingQ.assertionHi || existingQ.assertion ||
      existingQ.passageHi || existingQ.passage ||
      existingQ.caseletTextHi || existingQ.caseletText ||
      (existingQ.optionsHi && existingQ.optionsHi.length > 0) ||
      (existingQ.optionsEn && existingQ.optionsEn.length > 0) ||
      (existingQ.options && existingQ.options.length > 0) ||
      (existingQ.statementsHi && existingQ.statementsHi.length > 0) ||
      (existingQ.listAHi && existingQ.listAHi.length > 0) ||
      (existingQ.itemsHi && existingQ.itemsHi.length > 0) ||
      (existingQ.subQuestions && existingQ.subQuestions.length > 0)
    );
    existingQ.hasContent = hasContent;

    // ═══ Calculate quality score ═══
    let qualityScore = 0;
    const qType = existingQ.type || 'mcq';

    // Base: Question text (30 points)
    if (existingQ.questionTextHi && existingQ.questionTextHi.length > 10) qualityScore += 15;
    if (existingQ.questionTextEn && existingQ.questionTextEn.length > 10) qualityScore += 15;

    // Options (20 points)
    if (existingQ.optionsHi && existingQ.optionsHi.length >= 4) qualityScore += 10;
    if (existingQ.optionsEn && existingQ.optionsEn.length >= 4) qualityScore += 10;

    // Correct answer (10 points)
    if (existingQ.correctAnswer !== null && existingQ.correctAnswer !== undefined) qualityScore += 10;

    // Explanation (15 points)
    if (existingQ.explanationHi && existingQ.explanationHi.length > 10) qualityScore += 8;
    if (existingQ.explanationEn && existingQ.explanationEn.length > 10) qualityScore += 7;

    // Metadata (15 points)
    if (existingQ.chapter) qualityScore += 5;
    if (existingQ.topic) qualityScore += 5;
    if (existingQ.difficulty) qualityScore += 3;
    if (existingQ.keyTerms && existingQ.keyTerms.length > 0) qualityScore += 2;

    // Type-specific bonus (10 points)
    if (qType === 'assertion_reason') {
      if (existingQ.assertionHi || existingQ.assertionEn) qualityScore += 5;
      if (existingQ.reasonHi || existingQ.reasonEn) qualityScore += 5;
    } else if (qType === 'match_following' || qType === 'matching') {
      if ((existingQ.listAHi || []).length >= 2) qualityScore += 5;
      if ((existingQ.listBHi || []).length >= 2) qualityScore += 5;
    } else if (qType === 'statement_based' || qType === 'multi_statement') {
      if ((existingQ.statementsHi || []).length >= 2) qualityScore += 10;
    } else if (qType === 'sequence_order' || qType === 'chronology') {
      if ((existingQ.itemsHi || []).length >= 2) qualityScore += 10;
    } else {
      qualityScore += 10;
    }

    existingQ.qualityScore = Math.min(100, qualityScore);

    if (changedFields.length === 0) {
      return res.json({
        success: true,
        message: 'No changes detected',
        data: { pyqId, changedFields: [], linkedTestsUpdated: 0 }
      });
    }

    // ═══ Record edit history ═══
    if (!existingQ.editHistory) existingQ.editHistory = [];
    existingQ.editHistory.unshift({
      timestamp: new Date(),
      action: actionType,
      changedFields: changedFields,
      previousValues: Object.keys(previousValues).length > 0 ? previousValues : undefined,
      editedBy: actionBy,
      note: actionNote || `${actionType}: ${changedFields.join(', ')}`
    });
    if (existingQ.editHistory.length > 20) {
      existingQ.editHistory = existingQ.editHistory.slice(0, 20);
    }

    // Update edit metadata
    existingQ.lastEditedAt = new Date();
    existingQ.lastEditedBy = actionBy;
    existingQ.editCount = (existingQ.editCount || 0) + 1;

    // Save
    pyqDoc.questionTopicMap[qIndex] = existingQ;
    pyqDoc.markModified('questionTopicMap');
    pyqDoc.updatedAt = new Date();
    await pyqDoc.save();

    // Auto-update tests
    const Test = require('../models/Test');
    const testUpdateResult = await Test.updateMany(
      { questions: pyqId, status: { $ne: 'archived' } },
      { $set: { updatedAt: new Date() } }
    );

    console.log(`[PYQ Edit] ${actionType} Q${qNo} in ${pyqDoc.displayLabel}. Fields: ${changedFields.join(', ')}. Tests: ${testUpdateResult.modifiedCount}`);

    res.json({
      success: true,
      message: `PYQ Question #${qNo} ${actionType === 'edit' ? 'updated' : actionType} successfully`,
      data: {
        pyqId, qNo,
        pyqLabel: pyqDoc.displayLabel,
        changedFields,
        actionType,
        linkedTestsUpdated: testUpdateResult.modifiedCount,
        qualityScore: existingQ.qualityScore,
        verificationStatus: existingQ.verificationStatus,
        correctnessStatus: existingQ.correctnessStatus,
        editCount: existingQ.editCount,
        updatedQuestion: existingQ
      }
    });
  } catch (error) {
    console.error('[PYQ Edit] Error:', error.message);
    next(error);
  }
};

// @desc    Get all PYQ questions for Question Bank view (paginated, filtered)
// @route   GET /api/questions/pyq-bank
const getPYQQuestionBank = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      paper, year, session, shift,
      unitId, chapter, topic, type,
      difficulty, hasContent,
      search, sortBy = 'qNo', sortOrder = 'asc',
      // ═══ NEW: Review filters ═══
      verificationStatus: verStatus,
      correctnessStatus: corStatus,
      isFlagged: flaggedParam,
      isEdited: editedParam
    } = req.query;

    const PYQAnalysis = require('../models/PYQAnalysis');

    // Build filter for PYQ documents
    const docFilter = { isActive: true };
    if (paper) docFilter.paper = paper;
    if (year) docFilter.year = year;
    if (session) docFilter.session = session.toLowerCase();
    if (shift && shift !== 'none') docFilter.shift = shift;

    const pyqDocs = await PYQAnalysis.find(docFilter)
      .sort({ year: -1, session: 1, shift: 1 })
      .lean();

    if (pyqDocs.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: parseInt(limit), total: 0, pages: 0 },
        filters: { years: [], sessions: [], units: [], types: [] }
      });
    }

    // ═══ Build unitName map from unitWeightage across ALL docs ═══
    const globalUnitNameMap = {};
    const globalUnitNameHiMap = {};
    const globalChaptersMap = {};
    const globalTopicsMap = {};

    for (const doc of pyqDocs) {
      for (const uw of (doc.unitWeightage || [])) {
        if (!uw.unitId) continue;
        if (uw.unitName && uw.unitName.length > 2) {
          if (!globalUnitNameMap[uw.unitId] ||
              uw.unitName.length > globalUnitNameMap[uw.unitId].length) {
            globalUnitNameMap[uw.unitId] = uw.unitName;
          }
        }
        if (uw.unitNameHi && uw.unitNameHi.length > 2) {
          if (!globalUnitNameHiMap[uw.unitId] ||
              uw.unitNameHi.length > globalUnitNameHiMap[uw.unitId].length) {
            globalUnitNameHiMap[uw.unitId] = uw.unitNameHi;
          }
        }
      }

      for (const q of (doc.questionTopicMap || [])) {
        if (!q.unitId) continue;
        if (q.unitName && q.unitName.length > 2 && q.unitName !== q.unitId) {
          if (!globalUnitNameMap[q.unitId] ||
              q.unitName.length > globalUnitNameMap[q.unitId].length) {
            globalUnitNameMap[q.unitId] = q.unitName;
          }
        }
        if (q.unitNameHi && q.unitNameHi.length > 2) {
          if (!globalUnitNameHiMap[q.unitId] ||
              q.unitNameHi.length > globalUnitNameHiMap[q.unitId].length) {
            globalUnitNameHiMap[q.unitId] = q.unitNameHi;
          }
        }
        if (q.chapter) {
          if (!globalChaptersMap[q.unitId]) globalChaptersMap[q.unitId] = new Set();
          globalChaptersMap[q.unitId].add(q.chapter);
        }
        if (q.chapter && q.topic) {
          const key = `${q.unitId}|${q.chapter}`;
          if (!globalTopicsMap[key]) globalTopicsMap[key] = new Set();
          globalTopicsMap[key].add(q.topic);
        }
      }
    }

    // ═══ Collect all questions from matching PYQ docs ═══
    let allQuestions = [];
    const Test = require('../models/Test');

    for (const doc of pyqDocs) {
      const qtm = doc.questionTopicMap || [];

      for (const q of qtm) {
        // Apply question-level filters
        if (unitId && q.unitId !== unitId) continue;
        if (chapter && q.chapter && !q.chapter.toLowerCase().includes(chapter.toLowerCase())) continue;
        if (topic && q.topic && !q.topic.toLowerCase().includes(topic.toLowerCase())) continue;
        if (type && q.type !== type) continue;
        if (difficulty && q.difficulty !== difficulty) continue;
        if (hasContent === 'true' && !q.hasContent) continue;
        if (hasContent === 'false' && q.hasContent) continue;

        // ═══ NEW: Verification & review filters ═══
        if (verStatus && (q.verificationStatus || 'unchecked') !== verStatus) continue;
        if (corStatus && (q.correctnessStatus || 'unknown') !== corStatus) continue;
        if (flaggedParam === 'true' && !q.isFlagged) continue;
        if (flaggedParam === 'false' && q.isFlagged) continue;
        if (editedParam === 'true' && !(q.editCount > 0)) continue;
        if (editedParam === 'false' && (q.editCount > 0)) continue;

        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const searchableText = [
            q.questionTextHi, q.questionTextEn, q.questionText,
            q.topic, q.topicHi, q.chapter, q.chapterHi,
            q.assertionHi, q.assertionEn,
            q.passageHi, q.passageEn,
            globalUnitNameMap[q.unitId],
            globalUnitNameHiMap[q.unitId],
            ...(q.optionsHi || []),
            ...(q.optionsEn || []),
            ...(q.statementsHi || []),
            ...(q.keyTerms || [])
          ].filter(Boolean).join(' ').toLowerCase();

          if (!searchableText.includes(searchLower)) continue;
        }

        const pyqId = `pyq_${doc._id}_${q.qNo}`;

        const resolvedUnitName =
          globalUnitNameMap[q.unitId] ||
          q.unitName ||
          q.unitId ||
          '';

        const resolvedUnitNameHi =
          globalUnitNameHiMap[q.unitId] ||
          q.unitNameHi ||
          resolvedUnitName ||
          '';

        allQuestions.push({
          pyqId,
          docId: doc._id.toString(),
          qNo: q.qNo,
          pyqLabel: doc.displayLabel,
          year: doc.year,
          session: doc.session,
          shift: doc.shift,
          paper: doc.paper,
          type: q.type || 'mcq',
          unitId: q.unitId || '',
          unitName: resolvedUnitName,
          unitNameHi: resolvedUnitNameHi,
          chapter: q.chapter || '',
          chapterHi: q.chapterHi || '',
          topic: q.topic || '',
          topicHi: q.topicHi || '',
          subtopic: q.subtopic || '',
          difficulty: q.difficulty || 'medium',
          importance: q.importance || 3,
          hasContent: q.hasContent || false,
          hasSubQuestions: q.hasSubQuestions || false,
          questionPreview: (
            q.questionTextHi || q.questionTextEn || q.questionText ||
            q.assertionHi || q.assertion ||
            q.topic || `Q${q.qNo}`
          ).substring(0, 120),
          questionPreviewHi: (q.questionTextHi || q.assertionHi || '').substring(0, 200),
          questionPreviewEn: (q.questionTextEn || q.assertionEn || '').substring(0, 200),
          optionCount: (q.optionsHi || q.optionsEn || q.options || []).length,
          correctAnswer: q.correctAnswer,
          keyTerms: q.keyTerms || [],
          source: q.source || `PYQ ${doc.year} ${doc.session}`,
          // ═══ NEW: Review & Verification fields ═══
          verificationStatus: q.verificationStatus || 'unchecked',
          correctnessStatus: q.correctnessStatus || 'unknown',
          qualityScore: q.qualityScore || 0,
          editCount: q.editCount || 0,
          lastEditedAt: q.lastEditedAt || null,
          lastEditedBy: q.lastEditedBy || null,
          reviewedAt: q.reviewedAt || null,
          reviewedBy: q.reviewedBy || null,
          reviewNotes: q.reviewNotes || '',
          isFlagged: q.isFlagged || false,
          flagReason: q.flagReason || '',
        });
      }
    }

    // Sort
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    allQuestions.sort((a, b) => {
      switch (sortBy) {
        case 'year':
          if (a.year !== b.year) return (a.year > b.year ? -1 : 1) * sortMultiplier;
          return (a.qNo - b.qNo) * sortMultiplier;
        case 'type':
          if (a.type !== b.type) return a.type.localeCompare(b.type) * sortMultiplier;
          return a.qNo - b.qNo;
        case 'difficulty': {
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return ((diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2)) * sortMultiplier;
        }
        case 'unit':
          if (a.unitId !== b.unitId) return a.unitId.localeCompare(b.unitId) * sortMultiplier;
          return a.qNo - b.qNo;
        case 'importance':
          return ((b.importance || 3) - (a.importance || 3)) * sortMultiplier;
        case 'qualityScore':
          return ((b.qualityScore || 0) - (a.qualityScore || 0)) * sortMultiplier;
        case 'editCount':
          return ((b.editCount || 0) - (a.editCount || 0)) * sortMultiplier;
        case 'qNo':
        default:
          if (a.year !== b.year) return (b.year || '').localeCompare(a.year || '');
          return (a.qNo - b.qNo) * sortMultiplier;
      }
    });

    // Paginate
    const total = allQuestions.length;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedQuestions = allQuestions.slice(startIdx, startIdx + limitNum);

    // ═══ Build filters with proper unit names ═══
    const filterYears = [...new Set(allQuestions.map(q => q.year))].sort().reverse();
    const filterSessions = [...new Set(allQuestions.map(q => q.session))];
    const filterUnits = {};
    const filterTypes = {};
    const filterDifficulties = {};

    allQuestions.forEach(q => {
      if (q.unitId) {
        if (!filterUnits[q.unitId]) {
          filterUnits[q.unitId] = {
            id: q.unitId,
            name: q.unitName,
            nameHi: q.unitNameHi,
            count: 0,
            chapters: new Set(),
            topics: new Set()
          };
        }
        if (q.unitName && q.unitName !== q.unitId &&
            q.unitName.length > filterUnits[q.unitId].name.length) {
          filterUnits[q.unitId].name = q.unitName;
        }
        filterUnits[q.unitId].count++;
        if (q.chapter) filterUnits[q.unitId].chapters.add(q.chapter);
        if (q.topic) filterUnits[q.unitId].topics.add(q.topic);
      }
      if (q.type) {
        if (!filterTypes[q.type]) filterTypes[q.type] = { type: q.type, count: 0 };
        filterTypes[q.type].count++;
      }
      if (q.difficulty) {
        if (!filterDifficulties[q.difficulty]) filterDifficulties[q.difficulty] = { difficulty: q.difficulty, count: 0 };
        filterDifficulties[q.difficulty].count++;
      }
    });

    // Build chapters list per unit
    const filterChapters = [];
    Object.entries(globalChaptersMap).forEach(([uid, chapSet]) => {
      chapSet.forEach(chap => {
        filterChapters.push({
          unitId: uid,
          unitName: globalUnitNameMap[uid] || uid,
          chapter: chap,
          count: allQuestions.filter(q => q.unitId === uid && q.chapter === chap).length
        });
      });
    });
    filterChapters.sort((a, b) => b.count - a.count);

    // Build topics list
    const filterTopics = [];
    Object.entries(globalTopicsMap).forEach(([key, topicSet]) => {
      const [uid, chap] = key.split('|');
      topicSet.forEach(t => {
        filterTopics.push({
          unitId: uid,
          chapter: chap,
          topic: t,
          count: allQuestions.filter(q => q.unitId === uid && q.chapter === chap && q.topic === t).length
        });
      });
    });
    filterTopics.sort((a, b) => b.count - a.count);

    // Check test usage
    const allPyqIds = paginatedQuestions.map(q => q.pyqId);
    let testUsageMap = {};
    if (allPyqIds.length > 0) {
      try {
        const testsWithPYQ = await Test.find({
          questions: { $in: allPyqIds },
          status: { $ne: 'archived' }
        }).select('questions title').lean();

        testsWithPYQ.forEach(test => {
          (test.questions || []).forEach(qId => {
            const idStr = typeof qId === 'string' ? qId : String(qId);
            if (allPyqIds.includes(idStr)) {
              if (!testUsageMap[idStr]) testUsageMap[idStr] = [];
              testUsageMap[idStr].push({ _id: test._id, title: test.title });
            }
          });
        });
      } catch (e) {
        console.warn('[PYQ Bank] Test usage check failed:', e.message);
      }
    }

    // Enrich with test usage
    const enrichedQuestions = paginatedQuestions.map(q => ({
      ...q,
      usedInTests: testUsageMap[q.pyqId] || [],
      usedInTestCount: (testUsageMap[q.pyqId] || []).length
    }));

    // ═══ NEW: Review stats ═══
    const reviewStats = {
      unchecked: allQuestions.filter(q => q.verificationStatus === 'unchecked').length,
      checked: allQuestions.filter(q => q.verificationStatus === 'checked').length,
      verified: allQuestions.filter(q => q.verificationStatus === 'verified').length,
      approved: allQuestions.filter(q => q.verificationStatus === 'approved').length,
      rejected: allQuestions.filter(q => q.verificationStatus === 'rejected').length,
      correct: allQuestions.filter(q => q.correctnessStatus === 'correct').length,
      incorrect: allQuestions.filter(q => q.correctnessStatus === 'incorrect').length,
      flagged: allQuestions.filter(q => q.isFlagged).length,
      edited: allQuestions.filter(q => q.editCount > 0).length,
      avgQuality: allQuestions.length > 0
        ? Math.round(allQuestions.reduce((s, q) => s + (q.qualityScore || 0), 0) / allQuestions.length)
        : 0,
    };

    // Stats
    const stats = {
      totalQuestions: total,
      withContent: allQuestions.filter(q => q.hasContent).length,
      withoutContent: allQuestions.filter(q => !q.hasContent).length,
      byDifficulty: Object.values(filterDifficulties),
      pyqPapers: pyqDocs.length,
      review: reviewStats,
    };

    // Serialize Sets before sending
    const serializedUnits = Object.values(filterUnits)
      .map(u => ({
        id: u.id,
        name: u.name,
        nameHi: u.nameHi,
        count: u.count,
        chapterCount: u.chapters.size,
        topicCount: u.topics.size
      }))
      .sort((a, b) => {
        const numA = parseInt((a.id.match(/\d+/) || ['999'])[0]);
        const numB = parseInt((b.id.match(/\d+/) || ['999'])[0]);
        return numA - numB;
      });

    res.json({
      success: true,
      data: enrichedQuestions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      filters: {
        years: filterYears,
        sessions: filterSessions,
        units: serializedUnits,
        chapters: filterChapters,
        topics: filterTopics.slice(0, 100),
        types: Object.values(filterTypes).sort((a, b) => b.count - a.count),
        difficulties: Object.values(filterDifficulties)
      },
      stats
    });
  } catch (error) {
    console.error('[PYQ Bank] Error:', error.message);
    next(error);
  }
};

// @desc    Bulk update PYQ questions with review support
// @route   PUT /api/questions/pyq-bank/bulk-update
const bulkUpdatePYQQuestions = async (req, res, next) => {
  try {
    const { pyqIds, updates } = req.body;

    if (!pyqIds || !Array.isArray(pyqIds) || pyqIds.length === 0) {
      return res.status(400).json({ success: false, message: 'pyqIds array required' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'updates object required' });
    }

    const PYQAnalysis = require('../models/PYQAnalysis');
    const Test = require('../models/Test');

    const actionType = updates._actionType || 'bulk_edit';
    const actionBy = updates._actionBy || 'admin';
    const actionNote = updates._actionNote || '';
    delete updates._actionType;
    delete updates._actionBy;
    delete updates._actionNote;

    // Group by docId
    const docGroups = {};
    for (const pyqId of pyqIds) {
      const match = pyqId.match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
      if (!match) continue;
      const [, docId, qNoStr] = match;
      if (!docGroups[docId]) docGroups[docId] = [];
      docGroups[docId].push({ qNo: parseInt(qNoStr), pyqId });
    }

    let updatedCount = 0;
    let testUpdateCount = 0;
    const errors = [];

    // Allowed bulk-editable fields
    const bulkEditableFields = [
      'difficulty', 'importance', 'unitId', 'unitName',
      'chapter', 'chapterHi', 'topic', 'topicHi',
      'subtopic', 'concept', 'keyTerms', 'type',
      // ═══ NEW: Review fields ═══
      'verificationStatus', 'correctnessStatus',
      'reviewNotes', 'isFlagged', 'flagReason'
    ];

    for (const [docId, questions] of Object.entries(docGroups)) {
      try {
        const pyqDoc = await PYQAnalysis.findById(docId);
        if (!pyqDoc) {
          errors.push({ docId, error: 'Document not found' });
          continue;
        }

        let docChanged = false;

        for (const { qNo, pyqId } of questions) {
          const qIndex = (pyqDoc.questionTopicMap || []).findIndex(q => q.qNo === qNo);
          if (qIndex === -1) {
            errors.push({ pyqId, error: `Q${qNo} not found` });
            continue;
          }

          const q = pyqDoc.questionTopicMap[qIndex];
          const changedFields = [];

          for (const field of bulkEditableFields) {
            if (updates[field] !== undefined) {
              q[field] = updates[field];
              changedFields.push(field);
              docChanged = true;
            }
          }

          // Handle verification status side effects
          if (updates.verificationStatus === 'approved' || updates.verificationStatus === 'verified') {
            q.reviewedAt = new Date();
            q.reviewedBy = actionBy;
          }
          if (updates.isFlagged === true) {
            q.flaggedAt = new Date();
          }
          if (updates.isFlagged === false) {
            q.flagReason = '';
            q.flaggedAt = null;
          }

          // Record in edit history
          if (!q.editHistory) q.editHistory = [];
          q.editHistory.unshift({
            timestamp: new Date(),
            action: actionType,
            changedFields,
            editedBy: actionBy,
            note: actionNote || `Bulk ${actionType}: ${changedFields.join(', ')}`
          });
          if (q.editHistory.length > 20) q.editHistory = q.editHistory.slice(0, 20);

          q.lastEditedAt = new Date();
          q.lastEditedBy = actionBy;
          q.editCount = (q.editCount || 0) + 1;

          updatedCount++;
        }

        if (docChanged) {
          pyqDoc.markModified('questionTopicMap');
          pyqDoc.updatedAt = new Date();
          await pyqDoc.save();

          const pyqIdsForDoc = questions.map(q => q.pyqId);
          const testResult = await Test.updateMany(
            { questions: { $in: pyqIdsForDoc }, status: { $ne: 'archived' } },
            { $set: { updatedAt: new Date() } }
          );
          testUpdateCount += testResult.modifiedCount;
        }
      } catch (err) {
        errors.push({ docId, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `${actionType}: ${updatedCount} questions across ${Object.keys(docGroups).length} PYQ papers`,
      data: {
        updated: updatedCount,
        testsRefreshed: testUpdateCount,
        errors: errors.length,
        errorDetails: errors.slice(0, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};
// ════════════════════════════════════════════════════════
// NEW: Get test usage for multiple questions
// POST /api/questions/test-usage
// ════════════════════════════════════════════════════════
const getTestUsage = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    const Test = require('../models/Test');
    const limitedIds = ids.slice(0, 200);

    // Convert ObjectId strings for proper matching
    const mongoose = require('mongoose');
    const objectIds = [];
    const stringIds = [];

    limitedIds.forEach(id => {
      if (typeof id === 'string' && id.startsWith('pyq_')) {
        stringIds.push(id);
      } else {
        try {
          objectIds.push(new mongoose.Types.ObjectId(id));
          stringIds.push(id); // also search as string
        } catch {
          stringIds.push(id);
        }
      }
    });

    const searchIds = [...objectIds, ...stringIds];

    const tests = await Test.find({
      questions: { $in: searchIds },
      status: { $ne: 'archived' }
    }).select('_id title testType paper status totalQuestions createdAt questions hasPYQ sourceType').lean();

    // Build map
    const usageMap = {};
    limitedIds.forEach(id => { usageMap[id] = []; });

    tests.forEach(test => {
      const testInfo = {
        _id: test._id,
        title: test.title,
        testType: test.testType,
        paper: test.paper,
        status: test.status,
        totalQuestions: test.totalQuestions,
        createdAt: test.createdAt
      };

      (test.questions || []).forEach(qId => {
        const idStr = String(qId);
        if (usageMap[idStr] !== undefined) {
          usageMap[idStr].push(testInfo);
        }
        // Also check ObjectId match
        limitedIds.forEach(lid => {
          if (String(lid) === idStr && usageMap[lid] !== undefined) {
            if (!usageMap[lid].some(t => String(t._id) === String(test._id))) {
              usageMap[lid].push(testInfo);
            }
          }
        });
      });
    });

    res.json({ success: true, data: usageMap });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════
// NEW: Get question detail with full metadata + test usage
// GET /api/questions/detail/:id
// ════════════════════════════════════════════════════════
const getQuestionDetail = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('passageId')
      .populate('diDataId')
      .lean();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const Test = require('../models/Test');
    const mongoose = require('mongoose');
    let oid;
    try { oid = new mongoose.Types.ObjectId(req.params.id); } catch { oid = null; }

    const searchIds = oid ? [oid, req.params.id] : [req.params.id];

    const tests = await Test.find({
      questions: { $in: searchIds },
      status: { $ne: 'archived' }
    }).select('_id title testType paper status totalQuestions createdAt').lean();

    // Calculate quality score
    let qualityScore = 0;
    if (question.question?.hi) qualityScore += 15;
    if (question.question?.en) qualityScore += 15;
    if (question.options?.hi?.length >= 4) qualityScore += 10;
    if (question.options?.en?.length >= 4) qualityScore += 10;
    if (question.correctAnswer !== null && question.correctAnswer !== undefined) qualityScore += 10;
    if (question.explanation?.hi) qualityScore += 10;
    if (question.explanation?.en) qualityScore += 10;
    if (question.chapter) qualityScore += 5;
    if (question.topic) qualityScore += 5;
    if (question.tags?.length > 0) qualityScore += 5;
    if (question.source) qualityScore += 5;
    qualityScore = Math.min(100, qualityScore);

    // Related questions (same chapter/topic)
    const relatedFilter = {
      _id: { $ne: question._id },
      isActive: { $ne: false },
      paper: question.paper
    };
    if (question.chapter) relatedFilter.chapter = question.chapter;
    else if (question.unit) relatedFilter.unit = question.unit;

    const relatedQuestions = await Question.find(relatedFilter)
      .select('_id questionNumber question questionType difficulty')
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        ...question,
        usedInTests: tests,
        usedInTestCount: tests.length,
        qualityScore,
        relatedQuestions,
        hasHindi: !!(question.question?.hi),
        hasEnglish: !!(question.question?.en),
        hasExplanation: !!(question.explanation?.hi || question.explanation?.en),
        optionCount: Math.max(
          question.options?.hi?.length || 0,
          question.options?.en?.length || 0
        )
      }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════
// NEW: Bulk update questions
// PUT /api/questions/bulk-update
// ════════════════════════════════════════════════════════
const bulkUpdateQuestions = async (req, res, next) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'updates object required' });
    }

    const allowedFields = ['difficulty', 'tags', 'unit', 'chapter', 'topic', 'source', 'year', 'isPYQ'];
    const cleanUpdates = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'difficulty') cleanUpdates.difficulty = normalizeDifficultyValue(updates[field]);
        else if (field === 'tags' && Array.isArray(updates[field])) {
          // Append tags
          cleanUpdates.$addToSet = { tags: { $each: updates[field] } };
        } else {
          cleanUpdates[field] = updates[field];
        }
      }
    }

    const result = await Question.updateMany(
      { _id: { $in: ids }, isActive: { $ne: false } },
      cleanUpdates
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} questions updated`,
      data: { modified: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════
// NEW: Question analytics
// GET /api/questions/analytics/:id
// ════════════════════════════════════════════════════════
const getQuestionAnalytics = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .select('timesAttempted timesCorrect difficulty questionType paper unit chapter createdAt updatedAt')
      .lean();

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const accuracy = question.timesAttempted > 0
      ? Math.round((question.timesCorrect / question.timesAttempted) * 100)
      : null;

    const Test = require('../models/Test');
    const mongoose = require('mongoose');
    let oid;
    try { oid = new mongoose.Types.ObjectId(req.params.id); } catch { oid = null; }
    const searchIds = oid ? [oid, req.params.id] : [req.params.id];

    const testCount = await Test.countDocuments({
      questions: { $in: searchIds },
      status: { $ne: 'archived' }
    });

    // Similar questions count
    const similarCount = await Question.countDocuments({
      _id: { $ne: question._id },
      isActive: { $ne: false },
      paper: question.paper,
      chapter: question.chapter,
      questionType: question.questionType
    });

    res.json({
      success: true,
      data: {
        timesAttempted: question.timesAttempted || 0,
        timesCorrect: question.timesCorrect || 0,
        accuracy,
        testCount,
        similarCount,
        age: Math.floor((Date.now() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        lastUpdated: question.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
// ════════════════════════════════════════════════════════
// ★★★ NEW: AUTO-TRANSLATE + TEST SYNC on Question Update
// REPLACE the existing updateQuestion with this enhanced version
// ════════════════════════════════════════════════════════

const HINDI_DETECT_RE = /[\u0900-\u097F]/;

/**
 * Detect which language the user edited
 */
const detectSourceLanguageFromChanges = (updates, existing) => {
  // Explicit language flag
  if (updates.language) return updates.language;

  const checkField = (upd, ext, field) => {
    if (!upd || !ext) return null;
    if (typeof upd === 'object') {
      if (upd.hi && upd.hi !== ext?.hi && HINDI_DETECT_RE.test(upd.hi)) return 'hi';
      if (upd.en && upd.en !== ext?.en && !HINDI_DETECT_RE.test(upd.en)) return 'en';
    }
    if (typeof upd === 'string') {
      return HINDI_DETECT_RE.test(upd) ? 'hi' : 'en';
    }
    return null;
  };

  const checkArr = (upd, ext) => {
    if (!upd || !ext) return null;
    if (typeof upd === 'object' && !Array.isArray(upd)) {
      if (upd.hi && JSON.stringify(upd.hi) !== JSON.stringify(ext?.hi)) return 'hi';
      if (upd.en && JSON.stringify(upd.en) !== JSON.stringify(ext?.en)) return 'en';
    }
    return null;
  };

  let detected = checkField(updates.question, existing?.question);
  if (detected) return detected;

  detected = checkField(updates.explanation, existing?.explanation);
  if (detected) return detected;

  detected = checkArr(updates.options, existing?.options);
  if (detected) return detected;

  if (updates.assertionReasonData) {
    detected = checkField(updates.assertionReasonData?.assertion, existing?.assertionReasonData?.assertion);
    if (detected) return detected;
    detected = checkField(updates.assertionReasonData?.reason, existing?.assertionReasonData?.reason);
    if (detected) return detected;
  }

  if (updates.matchData) {
    detected = checkArr(updates.matchData?.listA, existing?.matchData?.listA);
    if (detected) return detected;
  }

  if (updates.statementData) {
    detected = checkArr(updates.statementData?.statements, existing?.statementData?.statements);
    if (detected) return detected;
  }

  if (updates.sequenceData) {
    detected = checkArr(updates.sequenceData?.items, existing?.sequenceData?.items);
    if (detected) return detected;
  }

  return null;
};

/**
 * Sync question changes to all tests that use this question
 */
const syncQuestionToTests = async (questionId) => {
  const Test = require('../models/Test');
  const mongoose = require('mongoose');
  let oid;
  try { oid = new mongoose.Types.ObjectId(questionId); } catch { oid = null; }
  const searchIds = oid ? [oid, questionId, String(questionId)] : [questionId, String(questionId)];

  const result = await Test.updateMany(
    { questions: { $in: searchIds }, status: { $ne: 'archived' } },
    { $set: { updatedAt: new Date() } }
  );
  return result.modifiedCount || 0;
};

// ═══ REPLACE existing updateQuestion with this ═══
const updateQuestion_ENHANCED = async (req, res, next) => {
  try {
    const updates = req.body;
    const questionId = req.params.id;

    // 1. Get existing question for change detection
    const existing = await Question.findById(questionId).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Question not found' });

    // 2. Auto-detect source language from changes
    const detectedLang = detectSourceLanguageFromChanges(updates, existing);
    let autoTranslated = false;

    // 3. Auto-translate if language detected
    if (detectedLang) {
      try {
        // Merge updates with existing data for complete translation
        const mergedData = { ...existing, ...updates };
        await translateHelper.translateQuestion(mergedData, detectedLang);

        // Copy translated fields back to updates
        if (mergedData.question) updates.question = mergedData.question;
        if (mergedData.options) updates.options = mergedData.options;
        if (mergedData.explanation) updates.explanation = mergedData.explanation;
        if (mergedData.assertionReasonData) updates.assertionReasonData = mergedData.assertionReasonData;
        if (mergedData.matchData) updates.matchData = mergedData.matchData;
        if (mergedData.sequenceData) updates.sequenceData = mergedData.sequenceData;
        if (mergedData.statementData) updates.statementData = mergedData.statementData;
        autoTranslated = true;
      } catch (e) {
        console.warn('[updateQuestion] Auto-translate failed:', e.message);
      }
    }

    // 4. Normalize values
    if (updates.paper) updates.paper = normalizePaperValue(updates.paper);
    if (updates.difficulty) updates.difficulty = normalizeDifficultyValue(updates.difficulty);
    delete updates.language; // Don't save the language flag

    // 5. Save question
    const question = await Question.findByIdAndUpdate(
      questionId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    // 6. ★ Sync to all tests using this question
    const testsUpdated = await syncQuestionToTests(questionId);

    console.log(`[updateQuestion] Q#${question.questionNumber} updated | AutoTranslate: ${autoTranslated} (${detectedLang || 'none'}) | Tests synced: ${testsUpdated}`);

    res.json({
      success: true,
      message: 'Question updated',
      data: question,
      sync: {
        testsUpdated,
        autoTranslated,
        sourceLanguage: detectedLang,
        targetLanguage: detectedLang ? (detectedLang === 'hi' ? 'en' : 'hi') : null
      }
    });
  } catch (error) { next(error); }
};

// ════════════════════════════════════════════════════════
// ★ NEW: Translate a single question by ID
// POST /api/questions/:id/translate
// ════════════════════════════════════════════════════════
const translateSingleQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sourceLanguage, forceRetranslate = false } = req.body;

    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    // Auto-detect source language
    let srcLang = sourceLanguage;
    if (!srcLang) {
      const hasHi = !!(
        question.question?.hi?.trim() ||
        question.assertionReasonData?.assertion?.hi?.trim() ||
        (question.options?.hi || []).some(o => o?.trim())
      );
      const hasEn = !!(
        question.question?.en?.trim() ||
        question.assertionReasonData?.assertion?.en?.trim() ||
        (question.options?.en || []).some(o => o?.trim())
      );

      if (hasHi && !hasEn) srcLang = 'hi';
      else if (hasEn && !hasHi) srcLang = 'en';
      else if (hasHi && hasEn) {
        const hiLen = (question.question?.hi || '').length + (question.explanation?.hi || '').length;
        const enLen = (question.question?.en || '').length + (question.explanation?.en || '').length;
        srcLang = hiLen >= enLen ? 'hi' : 'en';
      }
      else srcLang = 'hi';
    }

    const tgtLang = srcLang === 'hi' ? 'en' : 'hi';
    const data = question.toObject();

    // If force retranslate, clear target language fields
    if (forceRetranslate) {
      if (data.question) data.question[tgtLang] = '';
      if (data.options && data.options[tgtLang]) data.options[tgtLang] = [];
      if (data.explanation) data.explanation[tgtLang] = '';
      if (data.assertionReasonData?.assertion) data.assertionReasonData.assertion[tgtLang] = '';
      if (data.assertionReasonData?.reason) data.assertionReasonData.reason[tgtLang] = '';
      if (data.matchData?.listA) data.matchData.listA[tgtLang] = [];
      if (data.matchData?.listB) data.matchData.listB[tgtLang] = [];
      if (data.sequenceData?.items) data.sequenceData.items[tgtLang] = [];
      if (data.statementData?.statements) data.statementData.statements[tgtLang] = [];
    }

    // Translate
    await translateHelper.translateQuestion(data, srcLang);

    // Build update
    const updateFields = { updatedAt: new Date() };
    if (data.question) updateFields.question = data.question;
    if (data.options) {
      delete data.options._c;
      updateFields.options = data.options;
    }
    if (data.explanation) updateFields.explanation = data.explanation;
    if (data.assertionReasonData) updateFields.assertionReasonData = data.assertionReasonData;
    if (data.matchData) updateFields.matchData = data.matchData;
    if (data.sequenceData) updateFields.sequenceData = data.sequenceData;
    if (data.statementData) updateFields.statementData = data.statementData;

    const updated = await Question.findByIdAndUpdate(id, updateFields, { new: true });

    // Sync tests
    const testsUpdated = await syncQuestionToTests(id);

    res.json({
      success: true,
      message: `Translated ${srcLang}→${tgtLang}`,
      data: updated,
      translation: {
        sourceLanguage: srcLang,
        targetLanguage: tgtLang,
        testsUpdated,
        forceRetranslate
      }
    });
  } catch (error) { next(error); }
};

// ════════════════════════════════════════════════════════
// ★ NEW: Bulk translate multiple questions
// POST /api/questions/bulk-translate
// ════════════════════════════════════════════════════════
const bulkTranslateQuestions = async (req, res, next) => {
  try {
    const { ids, sourceLanguage, forceRetranslate = false } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    const limitedIds = ids.slice(0, 50);
    const questions = await Question.find({ _id: { $in: limitedIds }, isActive: { $ne: false } });

    let translatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const question of questions) {
      try {
        let srcLang = sourceLanguage;
        if (!srcLang) {
          const hasHi = !!(question.question?.hi?.trim());
          const hasEn = !!(question.question?.en?.trim());
          if (hasHi && !hasEn) srcLang = 'hi';
          else if (hasEn && !hasHi) srcLang = 'en';
          else if (hasHi && hasEn && !forceRetranslate) { skippedCount++; continue; }
          else srcLang = 'hi';
        }

        const tgtLang = srcLang === 'hi' ? 'en' : 'hi';
        const data = question.toObject();

        if (forceRetranslate) {
          if (data.question) data.question[tgtLang] = '';
          if (data.options) data.options[tgtLang] = [];
          if (data.explanation) data.explanation[tgtLang] = '';
        }

        await translateHelper.translateQuestion(data, srcLang);

        const upd = { updatedAt: new Date() };
        if (data.question) upd.question = data.question;
        if (data.options) { delete data.options._c; upd.options = data.options; }
        if (data.explanation) upd.explanation = data.explanation;
        if (data.assertionReasonData) upd.assertionReasonData = data.assertionReasonData;
        if (data.matchData) upd.matchData = data.matchData;
        if (data.sequenceData) upd.sequenceData = data.sequenceData;
        if (data.statementData) upd.statementData = data.statementData;

        await Question.findByIdAndUpdate(question._id, upd);
        translatedCount++;
      } catch (e) {
        failedCount++;
        errors.push({ id: String(question._id), questionNumber: question.questionNumber, error: e.message });
      }
    }

    // Sync all affected tests
    const Test = require('../models/Test');
    const mongoose = require('mongoose');
    const allSearchIds = [];
    limitedIds.forEach(id => {
      try { allSearchIds.push(new mongoose.Types.ObjectId(id)); } catch {}
      allSearchIds.push(String(id));
    });

    const testSync = await Test.updateMany(
      { questions: { $in: allSearchIds }, status: { $ne: 'archived' } },
      { $set: { updatedAt: new Date() } }
    );

    console.log(`[bulkTranslate] ${translatedCount} translated, ${skippedCount} skipped, ${failedCount} failed, ${testSync.modifiedCount} tests synced`);

    res.json({
      success: true,
      message: `${translatedCount} translated, ${skippedCount} skipped, ${failedCount} failed`,
      data: {
        translated: translatedCount,
        skipped: skippedCount,
        failed: failedCount,
        testsUpdated: testSync.modifiedCount,
        errors: errors.slice(0, 10)
      }
    });
  } catch (error) { next(error); }
};

// ════════════════════════════════════════════════════════
// ★ NEW: Get impact analysis for a question edit
// GET /api/questions/:id/impact
// ════════════════════════════════════════════════════════
const getImpactAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Test = require('../models/Test');
    const mongoose = require('mongoose');

    let oid;
    try { oid = new mongoose.Types.ObjectId(id); } catch { oid = null; }
    const searchIds = oid ? [oid, id, String(id)] : [id, String(id)];

    const tests = await Test.find({
      questions: { $in: searchIds },
      status: { $ne: 'archived' }
    }).select('_id title testType paper status totalQuestions createdAt').lean();

    // Get question translation status
    const question = await Question.findById(id)
      .select('question options explanation assertionReasonData questionType questionNumber')
      .lean();

    let translationStatus = null;
    if (question) {
      const hasHi = !!(question.question?.hi?.trim());
      const hasEn = !!(question.question?.en?.trim());
      const hiOpts = (question.options?.hi || []).filter(o => o?.trim()).length;
      const enOpts = (question.options?.en || []).filter(o => o?.trim()).length;

      translationStatus = {
        hasHindi: hasHi,
        hasEnglish: hasEn,
        hindiOptions: hiOpts,
        englishOptions: enOpts,
        hasExplanationHi: !!(question.explanation?.hi?.trim()),
        hasExplanationEn: !!(question.explanation?.en?.trim()),
        needsTranslation: !hasHi || !hasEn || hiOpts < 4 || enOpts < 4
      };
    }

    res.json({
      success: true,
      data: {
        questionNumber: question?.questionNumber,
        testsAffected: tests.length,
        tests: tests.map(t => ({
          _id: t._id, title: t.title, testType: t.testType,
          paper: t.paper, status: t.status, totalQuestions: t.totalQuestions
        })),
        translationStatus
      }
    });
  } catch (error) { next(error); }
};

// ════════════════════════════════════════════════════════
// ★ NEW: Get translation status for multiple questions
// POST /api/questions/translation-status
// ════════════════════════════════════════════════════════
const getTranslationStatus = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    const questions = await Question.find({ _id: { $in: ids.slice(0, 200) } })
      .select('_id question options explanation assertionReasonData matchData sequenceData statementData questionType')
      .lean();

    const statusMap = {};

    for (const q of questions) {
      const hasHi = !!(q.question?.hi?.trim());
      const hasEn = !!(q.question?.en?.trim());
      const hiOpts = (q.options?.hi || []).filter(o => o?.trim()).length;
      const enOpts = (q.options?.en || []).filter(o => o?.trim()).length;
      const hasExplHi = !!(q.explanation?.hi?.trim());
      const hasExplEn = !!(q.explanation?.en?.trim());

      // Calculate completeness
      let score = 0, total = 6;
      if (hasHi) score++;
      if (hasEn) score++;
      if (hiOpts >= 4) score++;
      if (enOpts >= 4) score++;
      if (hasExplHi) score++;
      if (hasExplEn) score++;

      const pct = Math.round((score / total) * 100);

      statusMap[q._id] = {
        hasHindi: hasHi,
        hasEnglish: hasEn,
        hindiOptions: hiOpts,
        englishOptions: enOpts,
        hasExplanationHi: hasExplHi,
        hasExplanationEn: hasExplEn,
        completeness: pct,
        status: pct >= 90 ? 'complete' : pct >= 50 ? 'partial' : 'missing',
        needsTranslation: pct < 80
      };
    }

    res.json({ success: true, data: statusMap });
  } catch (error) { next(error); }
};
module.exports = {
  getQuestions,
  getQuestionStats,
  getQuestionById,
  createQuestion,
  importQuestions,
  validateImport,
  updateQuestion: updateQuestion_ENHANCED,  // ★ USE ENHANCED VERSION
  deleteQuestion,
  bulkDeleteQuestions,
  getQuestionsByPassage,
  getQuestionsByDI,
  getPassages,
  createPassage,
  getPassageById,
  getDIDataList,
  createDIData,
  getDIDataById,
  getPYQQuestionById,
  updatePYQQuestion,
  getPYQQuestionBank,
  bulkUpdatePYQQuestions,
  getTestUsage,
  getQuestionDetail,
  bulkUpdateQuestions,
  getQuestionAnalytics,
  // ★ NEW EXPORTS
  translateSingleQuestion,
  bulkTranslateQuestions,
  getImpactAnalysis,
  getTranslationStatus,
};