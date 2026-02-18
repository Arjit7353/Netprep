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

// Extract filter value from string, array, or CSV
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
// SMART FLEXIBLE FILTER BUILDER
// ================================================================
// Handles ALL these mismatches:
//   Syllabus: "UNIT VII: Data Interpretation"  →  DB: "UNIT VII"
//   Syllabus: "Graphical Representation"       →  DB: "Data Interpretation"
//   Syllabus: "Types of Charts"                →  DB: "Table Chart"
//
// Strategy: Try multiple approaches in order:
//   1. Exact match
//   2. Starts-with match (base before colon)
//   3. Contains any significant word (3+ chars)
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

    // Multiple values → $or
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

  // Extract base part (before colon)
  // "UNIT VII: Data Interpretation" → "UNIT VII"
  const basePart = trimmed.split(':')[0].trim();

  // Extract significant words (3+ chars, not common words)
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'has', 'have', 'its', 'unit', 'chapter'];
  const allWords = trimmed
    .replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.includes(w.toLowerCase()));

  // Build regex that matches:
  // - Exact value OR
  // - Starts with base part OR
  // - Contains any significant word
  const regexParts = [];

  // 1. Exact match
  regexParts.push(escapeRegex(trimmed));

  // 2. Starts with base (for "UNIT VII: ..." → "UNIT VII")
  if (basePart !== trimmed) {
    regexParts.push('^' + escapeRegex(basePart) + '(\\b|$|:)');
  }

  // 3. Contains significant words (pick top 2 longest words)
  const sortedWords = [...allWords].sort((a, b) => b.length - a.length).slice(0, 2);
  sortedWords.forEach(word => {
    if (word.length >= 4) {
      regexParts.push(escapeRegex(word));
    }
  });

  if (regexParts.length === 0) {
    return { [fieldName]: trimmed };
  }

  // Combine: match any of these patterns
  const combinedRegex = regexParts.join('|');

  return {
    [fieldName]: {
      $regex: combinedRegex,
      $options: 'i'
    }
  };
};

// Build exact match filter (for paper, questionType, etc.)
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

const isDuplicateQuestion = async (questionData) => {
  try {
    let searchText = '';

    switch (questionData.questionType) {
      case 'mcq':
      case 'statement_based':
      case 'sequence_order':
      case 'passage_based':
        searchText = extractQuestionText(questionData);
        break;

      case 'assertion_reason':
        if (questionData.assertionReasonData?.assertion) {
          const a = questionData.assertionReasonData.assertion;
          searchText = typeof a === 'object' ? (a.hi || a.en || '') : a;
        }
        if (!searchText) searchText = extractQuestionText(questionData);
        break;

      case 'match_following':
        if (questionData.matchData?.listA) {
          const listA = questionData.matchData.listA;
          const items = typeof listA === 'object' && !Array.isArray(listA)
            ? (listA.hi || listA.en || [])
            : (Array.isArray(listA) ? listA : []);
          searchText = items[0] || extractQuestionText(questionData);
        }
        if (!searchText) searchText = extractQuestionText(questionData);
        break;

      default:
        searchText = extractQuestionText(questionData);
        break;
    }

    if (!searchText || searchText.length < 15) return false;

    const searchSnippet = searchText.substring(0, 60);
    const escapedSnippet = escapeRegex(searchSnippet);

    const existing = await Question.findOne({
      isActive: { $ne: false },
      $or: [
        { 'question.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'question.en': { $regex: escapedSnippet, $options: 'i' } },
        { 'assertionReasonData.assertion.hi': { $regex: escapedSnippet, $options: 'i' } },
        { 'assertionReasonData.assertion.en': { $regex: escapedSnippet, $options: 'i' } }
      ]
    }).select('_id questionNumber').lean();

    return !!existing;
  } catch (err) {
    console.warn('[DuplicateCheck] Error:', err.message);
    return false;
  }
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

      let searchText = '';
      switch (type) {
        case 'assertion_reason':
          searchText = q.assertion || q.question || '';
          break;
        case 'match_following':
          searchText = (q.listA && q.listA[0]) || q.question || '';
          break;
        default:
          searchText = q.question || q.questionText || '';
          break;
      }

      if (!searchText || searchText.length < 15) continue;

      const searchSnippet = searchText.substring(0, 60);
      const escapedSnippet = escapeRegex(searchSnippet);

      const existing = await Question.findOne({
        isActive: { $ne: false },
        $or: [
          { 'question.hi': { $regex: escapedSnippet, $options: 'i' } },
          { 'question.en': { $regex: escapedSnippet, $options: 'i' } },
          { 'assertionReasonData.assertion.hi': { $regex: escapedSnippet, $options: 'i' } },
          { 'assertionReasonData.assertion.en': { $regex: escapedSnippet, $options: 'i' } }
        ]
      }).select('questionNumber question assertionReasonData').lean();

      if (existing) {
        const existingText = existing.question?.hi || existing.question?.en ||
          existing.assertionReasonData?.assertion?.hi || '';
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

    // Paper - exact match
    const paperVal = toFilterValue(paper);
    if (paperVal) {
      const v = buildExactFilter(paperVal);
      if (v) filter.paper = v;
    }

    // Unit - smart flexible match
    const unitVal = toFilterValue(unit);
    if (unitVal) {
      const f = buildSmartFilter('unit', unitVal);
      if (f) {
        if (f.$or) andConditions.push(f);
        else Object.assign(filter, f);
      }
    }

    // Chapter - smart flexible match
    const chapterVal = toFilterValue(chapter);
    if (chapterVal) {
      const f = buildSmartFilter('chapter', chapterVal);
      if (f) {
        if (f.$or) andConditions.push(f);
        else Object.assign(filter, f);
      }
    }

    // Topic - smart flexible match
    const topicVal = toFilterValue(topic);
    if (topicVal) {
      const f = buildSmartFilter('topic', topicVal);
      if (f) {
        if (f.$or) andConditions.push(f);
        else Object.assign(filter, f);
      }
    }

    // QuestionType - exact
    const typeVal = toFilterValue(questionType);
    if (typeVal) {
      const v = buildExactFilter(typeVal);
      if (v) filter.questionType = v;
    }

    // Difficulty - exact
    const diffVal = toFilterValue(difficulty);
    if (diffVal) {
      const v = buildExactFilter(diffVal);
      if (v) filter.difficulty = v;
    }

    // Source - regex
    if (source) filter.source = { $regex: source, $options: 'i' };

    // Year - exact
    const yearVal = toFilterValue(year);
    if (yearVal) {
      const v = buildExactFilter(yearVal);
      if (v) filter.year = v;
    }

    // PYQ flag
    if (isPYQ === 'true') filter.isPYQ = true;

    // Date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Search
    if (search) {
      andConditions.push({
        $or: [
          { 'question.hi': { $regex: search, $options: 'i' } },
          { 'question.en': { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    // Combine $and
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
            skippedQuestions.push({ type: qd.questionType, reason: 'duplicate', question: extractQuestionText(qd).substring(0, 100) });
            continue;
          }
        }

        if (!qd.question) qd.question = { hi: '', en: '' };
        if (!qd.options) qd.options = { hi: [], en: [] };
        if (qd.correctAnswer === undefined) qd.correctAnswer = 0;
        if (!qd.paper) qd.paper = 'paper1';
        delete qd._idx; delete qd._src;

        savedQuestions.push(await Question.create(qd));
      } catch (e) { saveErrors.push({ type: 'question', error: e.message, question: extractQuestionText(qd).substring(0, 100) }); }
    }

    // Update counts
    for (const p of savedPassages) { try { const c = await Question.countDocuments({ passageId: p._id, isActive: { $ne: false } }); await Passage.findByIdAndUpdate(p._id, { questionCount: c }); } catch (e) {} }
    for (const d of savedDIData) { try { const c = await Question.countDocuments({ diDataId: d._id, isActive: { $ne: false } }); await DIData.findByIdAndUpdate(d._id, { questionCount: c }); } catch (e) {} }

    const totalErrors = [...parseResult.errors, ...saveErrors];
    console.log(`[Import] Done: ${savedQuestions.length} saved, ${skippedQuestions.length} skipped`);

    res.status(201).json({
      success: true,
      message: `Import: ${savedQuestions.length} saved` + (skippedQuestions.length > 0 ? `, ${skippedQuestions.length} skipped` : ''),
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

module.exports = {
  getQuestions,
  getQuestionStats,
  getQuestionById,
  createQuestion,
  importQuestions,
  validateImport,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
  getQuestionsByPassage,
  getQuestionsByDI,
  getPassages,
  createPassage,
  getPassageById,
  getDIDataList,
  createDIData,
  getDIDataById
};