const Test = require('../models/Test');
const Question = require('../models/Question');
const TestAttempt = require('../models/TestAttempt');
const config = require('../config/config');
const randomSelector = require('../utils/randomSelector');
const autoGenerator = require('../utils/autoGenerator');

// @desc    Get all tests with filters
// @route   GET /api/tests
const getTests = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      testType,
      paper,
      status = 'active',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (testType) filter.testType = testType;
    if (paper) filter.paper = paper;
    if (status) filter.status = status;
    
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const result = await Test.getByFilter(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort
    });

    res.json({
      success: true,
      data: result.tests,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test statistics
// @route   GET /api/tests/stats
const getTestStats = async (req, res, next) => {
  try {
    const countByType = await Test.getCountByType();

    const totalTests = await Test.countDocuments({ status: 'active' });
    const totalAttempts = await TestAttempt.countDocuments({ status: 'completed' });

    // Get average scores
    const avgStats = await TestAttempt.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$percentage' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalTests,
        totalAttempts,
        byType: countByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageScore: avgStats[0]?.avgScore || 0,
        averageAccuracy: avgStats[0]?.avgAccuracy || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test type configurations
// @route   GET /api/tests/types
const getTestTypes = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: config.testTypes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single test by ID
// @route   GET /api/tests/:id
const getTestById = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get test with all questions populated
// @route   GET /api/tests/:id/questions
const getTestWithQuestions = async (req, res, next) => {
  try {
    const test = await Test.getWithDetails(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new test
// @route   POST /api/tests
const createTest = async (req, res, next) => {
  try {
    const testData = req.body;

    // Auto-generate title if not provided
    if (!testData.title) {
      testData.title = await autoGenerator.generateTestTitle(testData);
    }

    // Set default values based on test type
    const typeConfig = config.testTypes[testData.testType];
    if (typeConfig) {
      if (!testData.duration) testData.duration = typeConfig.defaultDuration;
      if (!testData.totalQuestions && testData.questions) {
        testData.totalQuestions = testData.questions.length;
      } else if (!testData.totalQuestions) {
        testData.totalQuestions = typeConfig.defaultQuestions;
      }
    }

    // Calculate total marks
    testData.totalMarks = testData.totalQuestions * (testData.marksPerQuestion || 2);

    // Add default instructions
    if (!testData.instructions || testData.instructions.en?.length === 0) {
      testData.instructions = autoGenerator.getDefaultInstructions(testData);
    }

    const test = await Test.create(testData);

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate random test (for full mocks)
// @route   POST /api/tests/generate
const generateRandomTest = async (req, res, next) => {
  try {
    const {
      testType,
      paper,
      title,
      questionsPerUnit,
      totalQuestions,
      duration,
      negativeMarking = false,
      negativeMarks = 0
    } = req.body;

    // Validate test type
    if (!['full_mock_p1', 'full_mock_p2', 'full_mock_combined'].includes(testType)) {
      return res.status(400).json({
        success: false,
        message: 'Random generation only available for full mock tests'
      });
    }

    // Get random questions
    const questions = await randomSelector.selectRandomQuestions({
      paper,
      questionsPerUnit,
      totalQuestions,
      priority: 'unattempted'
    });

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not enough questions available for generating test'
      });
    }

    // Generate title
    const generatedTitle = title || await autoGenerator.generateTestTitle({
      testType,
      paper
    });

    // Create test
    const typeConfig = config.testTypes[testType];
    const test = await Test.create({
      title: generatedTitle,
      testType,
      paper,
      questions: questions.map(q => q._id),
      totalQuestions: questions.length,
      duration: duration || typeConfig.defaultDuration,
      marksPerQuestion: 2,
      negativeMarking,
      negativeMarks,
      totalMarks: questions.length * 2,
      randomConfig: {
        enabled: true,
        questionsPerUnit: questionsPerUnit
      },
      instructions: autoGenerator.getDefaultInstructions({ testType, paper })
    });

    res.status(201).json({
      success: true,
      message: `Random test generated with ${questions.length} questions`,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
const updateTest = async (req, res, next) => {
  try {
    const updates = req.body;

    // Recalculate total marks if questions changed
    if (updates.questions) {
      updates.totalQuestions = updates.questions.length;
      updates.totalMarks = updates.totalQuestions * (updates.marksPerQuestion || 2);
    }

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.json({
      success: true,
      message: 'Test updated successfully',
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update test status
// @route   PATCH /api/tests/:id/status
const updateTestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.json({
      success: true,
      message: `Test status updated to ${status}`,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
const deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Soft delete - archive
    test.status = 'archived';
    await test.save();

    res.json({
      success: true,
      message: 'Test archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add questions to existing test
// @route   POST /api/tests/:id/add-questions
const addQuestionsToTest = async (req, res, next) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide question IDs'
      });
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Add new questions (avoid duplicates)
    const existingIds = test.questions.map(q => q.toString());
    const newIds = questionIds.filter(id => !existingIds.includes(id));

    test.questions.push(...newIds);
    test.totalQuestions = test.questions.length;
    test.totalMarks = test.totalQuestions * test.marksPerQuestion;
    await test.save();

    res.json({
      success: true,
      message: `${newIds.length} questions added to test`,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove questions from test
// @route   POST /api/tests/:id/remove-questions
const removeQuestionsFromTest = async (req, res, next) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide question IDs'
      });
    }

    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    test.questions = test.questions.filter(
      q => !questionIds.includes(q.toString())
    );
    test.totalQuestions = test.questions.length;
    test.totalMarks = test.totalQuestions * test.marksPerQuestion;
    await test.save();

    res.json({
      success: true,
      message: `${questionIds.length} questions removed from test`,
      data: test
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attempts for a test
// @route   GET /api/tests/:id/attempts
const getTestAttempts = async (req, res, next) => {
  try {
    const attempts = await TestAttempt.getAttemptHistory(req.params.id);

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTests,
  getTestStats,
  getTestTypes,
  getTestById,
  getTestWithQuestions,
  createTest,
  generateRandomTest,
  updateTest,
  updateTestStatus,
  deleteTest,
  addQuestionsToTest,
  removeQuestionsFromTest,
  getTestAttempts
};