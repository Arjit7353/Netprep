// server/controllers/questionController.js

const Question = require('../models/Question');
const Passage = require('../models/Passage');
const DIData = require('../models/DIData');
const smartParser = require('../utils/smartParser');
const translateHelper = require('../utils/translateHelper');

// ================================================================
// HELPER: Safely extract value from string, array, or CSV
// ================================================================
const toFilterValue = (val) => {
  if (val === null || val === undefined || val === '') return null;

  // If already an array (Express parsed paper[]=paper1)
  if (Array.isArray(val)) {
    const cleaned = val
      .map(v => (typeof v === 'string' ? v.trim() : v))
      .filter(v => v !== null && v !== undefined && v !== '');
    if (cleaned.length === 0) return null;
    if (cleaned.length === 1) return cleaned[0];
    return { $in: cleaned };
  }

  // If string
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Handle comma-separated: "paper1,paper2"
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length === 0) return null;
      if (parts.length === 1) return parts[0];
      return { $in: parts };
    }

    return trimmed;
  }

  return val;
};

// ================================================================
// DUPLICATE CHECK HELPERS
// ================================================================

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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
        if (!searchText) {
          searchText = extractQuestionText(questionData);
        }
        break;

      case 'match_following':
        if (questionData.matchData?.listA) {
          const listA = questionData.matchData.listA;
          const items = typeof listA === 'object' && !Array.isArray(listA)
            ? (listA.hi || listA.en || [])
            : (Array.isArray(listA) ? listA : []);
          searchText = items[0] || extractQuestionText(questionData);
        }
        if (!searchText) {
          searchText = extractQuestionText(questionData);
        }
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
    console.warn(`[DuplicateCheck] Error for type ${questionData.questionType}:`, err.message);
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
        const existingText =
          existing.question?.hi ||
          existing.question?.en ||
          existing.assertionReasonData?.assertion?.hi ||
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

    return {
      found: duplicates.length,
      checkedCount,
      list: duplicates.slice(0, 10)
    };

  } catch (err) {
    console.warn('[DuplicatesPreview] Failed:', err.message);
    return { found: 0, checkedCount: 0, list: [] };
  }
};

// ================================================================
// QUESTION CONTROLLERS
// ================================================================

// @desc    Get all questions with filters
// @route   GET /api/questions
const getQuestions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      paper,
      unit,
      chapter,
      topic,
      questionType,
      difficulty,
      source,
      year,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isPYQ
    } = req.query;

    const filter = { isActive: { $ne: false } };

    // ✅ FIX: Handle both Array and String values safely
    const paperVal = toFilterValue(paper);
    if (paperVal) filter.paper = paperVal;

    const unitVal = toFilterValue(unit);
    if (unitVal) filter.unit = unitVal;

    const chapterVal = toFilterValue(chapter);
    if (chapterVal) filter.chapter = chapterVal;

    const topicVal = toFilterValue(topic);
    if (topicVal) filter.topic = topicVal;

    const typeVal = toFilterValue(questionType);
    if (typeVal) filter.questionType = typeVal;

    const diffVal = toFilterValue(difficulty);
    if (diffVal) filter.difficulty = diffVal;

    if (source) filter.source = { $regex: source, $options: 'i' };

    const yearVal = toFilterValue(year);
    if (yearVal) filter.year = yearVal;

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
      filter.$or = [
        { 'question.hi': { $regex: search, $options: 'i' } },
        { 'question.en': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Debug log - remove after testing
    console.log('[getQuestions] Final filter:', JSON.stringify(filter, null, 2));

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

    // ✅ FIX: Stats filter safe
    const paperVal = toFilterValue(paper);
    if (paperVal) matchFilter.paper = paperVal;

    const [
      total,
      typeCount,
      difficultyCount,
      unitCount,
      recentCount,
      passageCount,
      diCount
    ] = await Promise.all([
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
        {
          $group: {
            _id: { paper: '$paper', unit: '$unit' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.paper': 1, '_id.unit': 1 } }
      ]),
      Question.countDocuments({
        ...matchFilter,
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }),
      Passage.countDocuments({ isActive: { $ne: false } }),
      DIData.countDocuments({ isActive: { $ne: false } })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType: typeCount.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byDifficulty: difficultyCount.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
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
      .populate('passageId')
      .populate('diDataId');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new question
// @route   POST /api/questions
const createQuestion = async (req, res, next) => {
  try {
    const questionData = req.body;
    const sourceLanguage = questionData.language || 'hi';

    try {
      await translateHelper.translateQuestion(questionData, sourceLanguage);
    } catch (transErr) {
      console.warn('Translation failed for single question:', transErr.message);
    }

    const question = await Question.create(questionData);

    if (question.passageId) {
      await Passage.findByIdAndUpdate(
        question.passageId,
        { $inc: { questionCount: 1 } }
      );
    }
    if (question.diDataId) {
      await DIData.findByIdAndUpdate(
        question.diDataId,
        { $inc: { questionCount: 1 } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate JSON before import (with duplicate preview)
// @route   POST /api/questions/import/validate
const validateImport = async (req, res, next) => {
  try {
    const jsonData = req.body;

    if (!jsonData || typeof jsonData !== 'object') {
      return res.status(400).json({
        success: false,
        validation: {
          isValid: false,
          errors: ['Invalid JSON data'],
          warnings: []
        }
      });
    }

    const validation = smartParser.validateJSONStructure(jsonData);

    let preview = null;

    if (validation.isValid) {
      try {
        const questions = jsonData.questions || [];
        const typePreview = {};
        let passageCount = 0;
        let diCount = 0;
        let totalQuestions = 0;

        questions.forEach((q, idx) => {
          if (!q || typeof q !== 'object') return;

          const type = smartParser.detectQuestionType(q);

          console.log(`[Validate] Q${idx + 1}: detected type = ${type}`);

          if (type === 'passage_based') {
            passageCount++;

            let pQuestions = [];

            if (typeof q.passage === 'string' && Array.isArray(q.questions)) {
              pQuestions = q.questions;
            } else if (q.passage && typeof q.passage === 'object') {
              pQuestions = q.questions || q.passage.questions || [];
            } else if (q.passageContent && Array.isArray(q.questions)) {
              pQuestions = q.questions;
            } else if (q.type === 'passage_based' || q.questionType === 'passage_based') {
              pQuestions = q.questions || [];
            }

            const qCount = Array.isArray(pQuestions) ? pQuestions.length : 0;
            typePreview['passage_based'] = (typePreview['passage_based'] || 0) + qCount;
            totalQuestions += qCount;

            console.log(`[Validate] Passage found with ${qCount} sub-questions`);

          } else if (type.startsWith('di_')) {
            diCount++;

            const diRaw = q.diData || q;
            const dQuestions = Array.isArray(diRaw.questions) ? diRaw.questions : [];
            const qCount = dQuestions.length;
            typePreview[type] = (typePreview[type] || 0) + qCount;
            totalQuestions += qCount;

            console.log(`[Validate] DI (${type}) found with ${qCount} sub-questions`);

          } else {
            typePreview[type] = (typePreview[type] || 0) + 1;
            totalQuestions += 1;
          }
        });

        const duplicateInfo = await checkDuplicatesForPreview(jsonData);

        preview = {
          totalItems: questions.length,
          totalQuestions,
          byType: typePreview,
          passages: passageCount,
          diData: diCount,
          duplicates: duplicateInfo
        };

        console.log(`[Validate] Preview: ${totalQuestions} Q, ${passageCount} P, ${diCount} DI`);

      } catch (err) {
        console.warn('[Validate] Preview generation failed:', err.message);
      }
    }

    res.json({
      success: true,
      validation,
      preview
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Import questions from JSON
// @route   POST /api/questions/import
const importQuestions = async (req, res, next) => {
  try {
    const jsonData = req.body;

    const skipDuplicates =
      req.query.skipDuplicates === 'true' ||
      jsonData._skipDuplicates === true;

    if ('_skipDuplicates' in jsonData) {
      delete jsonData._skipDuplicates;
    }

    console.log('[Import] Starting import...');
    console.log('[Import] Skip duplicates:', skipDuplicates);
    console.log('[Import] Questions count:', jsonData.questions?.length || 0);

    const validation = smartParser.validateJSONStructure(jsonData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON structure',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    let parseResult;
    try {
      parseResult = await smartParser.parseJSONImport(jsonData);
    } catch (parseErr) {
      console.error('[Import] Parse error:', parseErr);
      return res.status(400).json({
        success: false,
        message: 'Failed to parse questions: ' + parseErr.message,
        errors: [parseErr.message]
      });
    }

    console.log('[Import] Parse complete:', {
      questions: parseResult.questions.length,
      passages: parseResult.passages.length,
      diDataItems: parseResult.diDataItems.length,
      parseErrors: parseResult.errors.length
    });

    const savedQuestions = [];
    const savedPassages = [];
    const savedDIData = [];
    const saveErrors = [];
    const skippedQuestions = [];

    const groupIdToPassageId = {};
    const groupIdToDIId = {};

    // ----------------------------------------------------------
    // STEP 1: Save passages
    // ----------------------------------------------------------
    for (const passageData of parseResult.passages) {
      try {
        const groupId = passageData._groupId;
        delete passageData._groupId;

        if (!passageData.content) {
          passageData.content = { hi: '', en: '' };
        }

        const passage = await Passage.create(passageData);
        savedPassages.push(passage);

        if (groupId) {
          groupIdToPassageId[groupId] = passage._id;
        }

        console.log(`[Import] Saved passage: ${passage._id} (group: ${groupId})`);
      } catch (err) {
        console.error('[Import] Passage save error:', err.message);
        saveErrors.push({
          type: 'passage',
          error: err.message,
          title: passageData.title || 'Unknown'
        });
      }
    }

    // ----------------------------------------------------------
    // STEP 2: Save DI data
    // ----------------------------------------------------------
    for (const diData of parseResult.diDataItems) {
      try {
        const groupId = diData._groupId;
        delete diData._groupId;

        if (!diData.title) {
          diData.title = { hi: 'DI', en: 'DI' };
        }

        const di = await DIData.create(diData);
        savedDIData.push(di);

        if (groupId) {
          groupIdToDIId[groupId] = di._id;
        }

        console.log(`[Import] Saved DI: ${di._id} (group: ${groupId}, type: ${di.diType})`);
      } catch (err) {
        console.error('[Import] DI save error:', err.message);
        saveErrors.push({
          type: 'diData',
          error: err.message,
          title: typeof diData.title === 'object'
            ? (diData.title.hi || diData.title.en)
            : (diData.title || 'Unknown')
        });
      }
    }

    // ----------------------------------------------------------
    // STEP 3: Save questions with duplicate check + linking
    // ----------------------------------------------------------
    for (const questionData of parseResult.questions) {
      try {
        // Link to passage
        if (questionData._passageGroupId) {
          const passageId = groupIdToPassageId[questionData._passageGroupId];
          if (passageId) {
            questionData.passageId = passageId;
          } else {
            console.warn(
              `[Import] Passage group ID ${questionData._passageGroupId} not found`
            );
          }
          delete questionData._passageGroupId;
        }

        // Link to DI data
        if (questionData._diGroupId) {
          const diId = groupIdToDIId[questionData._diGroupId];
          if (diId) {
            questionData.diDataId = diId;
          } else {
            console.warn(
              `[Import] DI group ID ${questionData._diGroupId} not found`
            );
          }
          delete questionData._diGroupId;
        }

        const isPassageSubQ = !!questionData.passageId;
        const isDISubQ = !!questionData.diDataId;

        if (skipDuplicates && !isPassageSubQ && !isDISubQ) {
          const isDuplicate = await isDuplicateQuestion(questionData);
          if (isDuplicate) {
            const qText = extractQuestionText(questionData);
            skippedQuestions.push({
              type: questionData.questionType,
              reason: 'duplicate',
              question: qText.substring(0, 100)
            });
            console.log(
              `[Import] Skipped duplicate (${questionData.questionType}): ` +
              qText.substring(0, 50)
            );
            continue;
          }
        }

        // Ensure required fields
        if (!questionData.question) {
          questionData.question = { hi: '', en: '' };
        }
        if (!questionData.options) {
          questionData.options = { hi: [], en: [] };
        }
        if (questionData.correctAnswer === undefined) {
          questionData.correctAnswer = 0;
        }
        if (!questionData.paper) {
          questionData.paper = 'paper1';
        }

        // Clean internal tracking fields
        delete questionData._idx;
        delete questionData._src;

        const question = await Question.create(questionData);
        savedQuestions.push(question);

      } catch (err) {
        console.error('[Import] Question save error:', err.message);
        const qText = extractQuestionText(questionData);
        saveErrors.push({
          type: 'question',
          error: err.message,
          question: qText.substring(0, 100)
        });
      }
    }

    // ----------------------------------------------------------
    // STEP 4: Update passage/DI question counts
    // ----------------------------------------------------------
    for (const passage of savedPassages) {
      try {
        const count = await Question.countDocuments({
          passageId: passage._id,
          isActive: { $ne: false }
        });
        await Passage.findByIdAndUpdate(passage._id, { questionCount: count });
      } catch (err) {
        console.warn('[Import] Failed to update passage count:', err.message);
      }
    }

    for (const di of savedDIData) {
      try {
        const count = await Question.countDocuments({
          diDataId: di._id,
          isActive: { $ne: false }
        });
        await DIData.findByIdAndUpdate(di._id, { questionCount: count });
      } catch (err) {
        console.warn('[Import] Failed to update DI count:', err.message);
      }
    }

    const totalErrors = [...parseResult.errors, ...saveErrors];

    console.log(
      `[Import] Complete: ${savedQuestions.length} saved, ` +
      `${skippedQuestions.length} skipped, ` +
      `${savedPassages.length} passages, ` +
      `${savedDIData.length} DI sets, ` +
      `${totalErrors.length} errors`
    );

    res.status(201).json({
      success: true,
      message:
        `Import completed: ${savedQuestions.length} questions saved` +
        (skippedQuestions.length > 0
          ? `, ${skippedQuestions.length} duplicates skipped`
          : ''),
      data: {
        questions: savedQuestions.length,
        passages: savedPassages.length,
        diData: savedDIData.length,
        skipped: skippedQuestions.length,
        errors: totalErrors.length,
        stats: parseResult.stats
      },
      skipped: skippedQuestions.length > 0 ? skippedQuestions : undefined,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined
    });

  } catch (error) {
    console.error('[Import] Fatal error:', error);
    next(error);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const updates = req.body;

    if (updates.language) {
      try {
        await translateHelper.translateQuestion(updates, updates.language);
      } catch (transErr) {
        console.warn('Translation failed for update:', transErr.message);
      }
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({ success: true, message: 'Question updated', data: question });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question (soft delete)
// @route   DELETE /api/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    question.isActive = false;
    await question.save();

    if (question.passageId) {
      const count = await Question.countDocuments({
        passageId: question.passageId,
        isActive: { $ne: false }
      });
      await Passage.findByIdAndUpdate(question.passageId, { questionCount: count });
    }
    if (question.diDataId) {
      const count = await Question.countDocuments({
        diDataId: question.diDataId,
        isActive: { $ne: false }
      });
      await DIData.findByIdAndUpdate(question.diDataId, { questionCount: count });
    }

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete questions
// @route   DELETE /api/questions/bulk
const bulkDeleteQuestions = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide question IDs array'
      });
    }

    const result = await Question.updateMany(
      { _id: { $in: ids } },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} questions deleted`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions by passage
// @route   GET /api/questions/passage/:passageId
const getQuestionsByPassage = async (req, res, next) => {
  try {
    const questions = await Question.find({
      passageId: req.params.passageId,
      isActive: { $ne: false }
    }).sort({ passageOrder: 1 });

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions by DI data
// @route   GET /api/questions/di/:diDataId
const getQuestionsByDI = async (req, res, next) => {
  try {
    const questions = await Question.find({
      diDataId: req.params.diDataId,
      isActive: { $ne: false }
    }).sort({ diOrder: 1 });

    res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all passages
// @route   GET /api/questions/passages/list
const getPassages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, paper, unit } = req.query;
    const filter = { isActive: { $ne: false } };

    // ✅ FIX: Passages filter safe
    const paperVal = toFilterValue(paper);
    if (paperVal) filter.paper = paperVal;

    const unitVal = toFilterValue(unit);
    if (unitVal) filter.unit = unitVal;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [passages, total] = await Promise.all([
      Passage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Passage.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: passages,
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

// @desc    Create passage manually
// @route   POST /api/questions/passages
const createPassage = async (req, res, next) => {
  try {
    const passageData = req.body;
    const sourceLanguage = passageData.language || 'hi';

    if (passageData.content && typeof passageData.content === 'string') {
      try {
        const translated = await translateHelper.translateText(
          passageData.content, sourceLanguage
        );
        passageData.content = {
          [sourceLanguage]: passageData.content,
          [sourceLanguage === 'hi' ? 'en' : 'hi']: translated
        };
      } catch (err) {
        passageData.content = {
          [sourceLanguage]: passageData.content,
          [sourceLanguage === 'hi' ? 'en' : 'hi']: passageData.content
        };
      }
    }

    const passage = await Passage.create(passageData);
    res.status(201).json({
      success: true,
      message: 'Passage created',
      data: passage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get passage with questions
// @route   GET /api/questions/passages/:id
const getPassageById = async (req, res, next) => {
  try {
    const passage = await Passage.findById(req.params.id);
    if (!passage) {
      return res.status(404).json({
        success: false,
        message: 'Passage not found'
      });
    }

    const questions = await Question.find({
      passageId: passage._id,
      isActive: { $ne: false }
    }).sort({ passageOrder: 1 });

    res.json({
      success: true,
      data: { ...passage.toObject(), questions }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all DI data
// @route   GET /api/questions/di-data/list
const getDIDataList = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, paper, diType } = req.query;
    const filter = { isActive: { $ne: false } };

    // ✅ FIX: DI filter safe
    const paperVal = toFilterValue(paper);
    if (paperVal) filter.paper = paperVal;

    const diTypeVal = toFilterValue(diType);
    if (diTypeVal) filter.diType = diTypeVal;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [diDataList, total] = await Promise.all([
      DIData.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DIData.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: diDataList,
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

// @desc    Create DI data manually
// @route   POST /api/questions/di-data
const createDIData = async (req, res, next) => {
  try {
    const diData = req.body;
    const sourceLanguage = diData.language || 'hi';

    try {
      await translateHelper.translateDIData(diData, sourceLanguage);
    } catch (err) {
      console.warn('DI translation failed:', err.message);
    }

    const di = await DIData.create(diData);
    res.status(201).json({
      success: true,
      message: 'DI Data created',
      data: di
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get DI data with questions
// @route   GET /api/questions/di-data/:id
const getDIDataById = async (req, res, next) => {
  try {
    const diData = await DIData.findById(req.params.id);
    if (!diData) {
      return res.status(404).json({
        success: false,
        message: 'DI Data not found'
      });
    }

    const questions = await Question.find({
      diDataId: diData._id,
      isActive: { $ne: false }
    }).sort({ diOrder: 1 });

    res.json({
      success: true,
      data: { ...diData.toObject(), questions }
    });
  } catch (error) {
    next(error);
  }
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