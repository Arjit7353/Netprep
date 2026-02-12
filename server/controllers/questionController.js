const Question = require('../models/Question');
const Passage = require('../models/Passage');
const DIData = require('../models/DIData');
const smartParser = require('../utils/smartParser');
const translateHelper = require('../utils/translateHelper');

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
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (paper) filter.paper = paper;
    if (unit) filter.unit = unit;
    if (chapter) filter.chapter = chapter;
    if (topic) filter.topic = topic;
    if (questionType) filter.questionType = questionType;
    if (difficulty) filter.difficulty = difficulty;
    if (source) filter.source = source;
    if (year) filter.year = year;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Search in question text
    if (search) {
      filter.$or = [
        { 'question.hi': { $regex: search, $options: 'i' } },
        { 'question.en': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const result = await Question.getByFilter(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    });

    res.json({
      success: true,
      data: result.questions,
      pagination: result.pagination
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
    const matchFilter = { isActive: true };
    if (paper) matchFilter.paper = paper;

    const stats = await Question.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: {
            $push: '$questionType'
          },
          byDifficulty: {
            $push: '$difficulty'
          },
          byPaper: {
            $push: '$paper'
          }
        }
      }
    ]);

    // Count by type
    const typeCount = await Question.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$questionType', count: { $sum: 1 } } }
    ]);

    // Count by difficulty
    const difficultyCount = await Question.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    // Count by unit
    const unitCount = await Question.aggregate([
      { $match: matchFilter },
      { $group: { _id: { paper: '$paper', unit: '$unit' }, count: { $sum: 1 } } },
      { $sort: { '_id.paper': 1, '_id.unit': 1 } }
    ]);

    // Recent additions (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = await Question.countDocuments({
      ...matchFilter,
      createdAt: { $gte: weekAgo }
    });

    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        byType: typeCount.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byDifficulty: difficultyCount.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byUnit: unitCount,
        recentAdditions: recentCount
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

    res.json({
      success: true,
      data: question
    });
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

    // Translate if needed
    if (sourceLanguage) {
      await translateHelper.translateQuestion(questionData, sourceLanguage);
    }

    const question = await Question.create(questionData);

    // Update passage/DI question count if applicable
    if (question.passageId) {
      await Passage.findByIdAndUpdate(question.passageId, {
        $inc: { questionCount: 1 }
      });
    }
    if (question.diDataId) {
      await DIData.findByIdAndUpdate(question.diDataId, {
        $inc: { questionCount: 1 }
      });
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

// @desc    Import questions from JSON (Smart Parser)
// @route   POST /api/questions/import
const importQuestions = async (req, res, next) => {
  try {
    const jsonData = req.body;

    // Validate JSON structure
    const validation = smartParser.validateJSONStructure(jsonData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON structure',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Parse questions using smart parser
    const parseResult = await smartParser.parseJSONImport(jsonData);

    // Save to database
    const savedQuestions = [];
    const savedPassages = [];
    const savedDIData = [];
    const errors = [];

    // Save passages first
    for (const passageData of parseResult.passages) {
      try {
        const passage = await Passage.create(passageData);
        savedPassages.push(passage);

        // Link questions to passage
        const passageQuestions = parseResult.questions.filter(
          q => q.questionType === 'passage_based' && !q.passageId
        );
        
        for (let i = 0; i < passageQuestions.length && i < 5; i++) {
          passageQuestions[i].passageId = passage._id;
        }
      } catch (err) {
        errors.push({ type: 'passage', error: err.message, data: passageData });
      }
    }

    // Save DI data
    for (const diData of parseResult.diDataItems) {
      try {
        const di = await DIData.create(diData);
        savedDIData.push(di);

        // Link questions to DI
        const diQuestions = parseResult.questions.filter(
          q => q.questionType.startsWith('di_') && !q.diDataId
        );
        
        for (let i = 0; i < diQuestions.length && i < 5; i++) {
          diQuestions[i].diDataId = di._id;
        }
      } catch (err) {
        errors.push({ type: 'diData', error: err.message, data: diData });
      }
    }

    // Save questions
    for (const questionData of parseResult.questions) {
      try {
        const question = await Question.create(questionData);
        savedQuestions.push(question);
      } catch (err) {
        errors.push({ type: 'question', error: err.message, data: questionData });
      }
    }

    // Update counts
    for (const passage of savedPassages) {
      await passage.updateQuestionCount();
    }
    for (const di of savedDIData) {
      await di.updateQuestionCount();
    }

    res.status(201).json({
      success: true,
      message: `Import completed: ${savedQuestions.length} questions, ${savedPassages.length} passages, ${savedDIData.length} DI sets`,
      data: {
        questions: savedQuestions.length,
        passages: savedPassages.length,
        diData: savedDIData.length,
        errors: errors.length,
        stats: parseResult.stats
      },
      errors: errors.length > 0 ? errors : undefined,
      warnings: validation.warnings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate JSON before import
// @route   POST /api/questions/import/validate
const validateImport = async (req, res, next) => {
  try {
    const jsonData = req.body;
    const validation = smartParser.validateJSONStructure(jsonData);

    // Also do a dry-run parse to detect question types
    let preview = null;
    if (validation.isValid) {
      try {
        preview = await smartParser.parseJSONImport(jsonData);
      } catch (err) {
        validation.errors.push(`Parse error: ${err.message}`);
        validation.isValid = false;
      }
    }

    res.json({
      success: true,
      validation,
      preview: preview ? {
        totalQuestions: preview.stats.total,
        byType: preview.stats.byType,
        passages: preview.passages.length,
        diData: preview.diDataItems.length
      } : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const updates = req.body;

    // Translate if language specified
    if (updates.language) {
      await translateHelper.translateQuestion(updates, updates.language);
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

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question
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

    // Soft delete
    question.isActive = false;
    await question.save();

    // Update passage/DI count
    if (question.passageId) {
      const passage = await Passage.findById(question.passageId);
      if (passage) await passage.updateQuestionCount();
    }
    if (question.diDataId) {
      const di = await DIData.findById(question.diDataId);
      if (di) await di.updateQuestionCount();
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete questions
// @route   DELETE /api/questions
const bulkDeleteQuestions = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide question IDs to delete'
      });
    }

    const result = await Question.updateMany(
      { _id: { $in: ids } },
      { isActive: false }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} questions deleted successfully`
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
      isActive: true
    }).sort({ passageOrder: 1 });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions by DI
// @route   GET /api/questions/di/:diDataId
const getQuestionsByDI = async (req, res, next) => {
  try {
    const questions = await Question.find({
      diDataId: req.params.diDataId,
      isActive: true
    }).sort({ diOrder: 1 });

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all passages
// @route   GET /api/questions/passages/list
const getPassages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, paper, unit } = req.query;
    const filter = { isActive: true };
    
    if (paper) filter.paper = paper;
    if (unit) filter.unit = unit;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const passages = await Passage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Passage.countDocuments(filter);

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

// @desc    Create new passage
// @route   POST /api/questions/passages
const createPassage = async (req, res, next) => {
  try {
    const passageData = req.body;
    const sourceLanguage = passageData.language || 'hi';

    // Translate content
    if (passageData.content) {
      passageData.content = await translateHelper.translateBilingual(
        passageData.content,
        sourceLanguage
      );
    }

    const passage = await Passage.create(passageData);

    res.status(201).json({
      success: true,
      message: 'Passage created successfully',
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
    const passage = await Passage.getWithQuestions(req.params.id);

    if (!passage) {
      return res.status(404).json({
        success: false,
        message: 'Passage not found'
      });
    }

    res.json({
      success: true,
      data: passage
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
    const filter = { isActive: true };
    
    if (paper) filter.paper = paper;
    if (diType) filter.diType = diType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const diDataList = await DIData.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DIData.countDocuments(filter);

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

// @desc    Create new DI data
// @route   POST /api/questions/di-data
const createDIData = async (req, res, next) => {
  try {
    const diData = req.body;
    const sourceLanguage = diData.language || 'hi';

    // Translate DI data
    await translateHelper.translateDIData(diData, sourceLanguage);

    const di = await DIData.create(diData);

    res.status(201).json({
      success: true,
      message: 'DI Data created successfully',
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
    const diData = await DIData.getWithQuestions(req.params.id);

    if (!diData) {
      return res.status(404).json({
        success: false,
        message: 'DI Data not found'
      });
    }

    res.json({
      success: true,
      data: diData
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