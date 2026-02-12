const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');

// @desc    Get all attempts
// @route   GET /api/attempts
const getAttempts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      testId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (testId) filter.testId = testId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const attempts = await TestAttempt.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('testId', 'title testType paper totalQuestions duration totalMarks');

    const total = await TestAttempt.countDocuments(filter);

    res.json({
      success: true,
      data: attempts,
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

// @desc    Get recent attempts
// @route   GET /api/attempts/recent
const getRecentAttempts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const attempts = await TestAttempt.find({ status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(parseInt(limit))
      .populate('testId', 'title testType paper');

    res.json({
      success: true,
      data: attempts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overall statistics
// @route   GET /api/attempts/stats
const getAttemptStats = async (req, res, next) => {
  try {
    const totalAttempts = await TestAttempt.countDocuments({ status: 'completed' });

    const stats = await TestAttempt.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$percentage' },
          avgAccuracy: { $avg: '$accuracy' },
          totalTime: { $sum: '$totalTimeTaken' },
          totalCorrect: { $sum: '$correctCount' },
          totalWrong: { $sum: '$wrongCount' },
          totalSkipped: { $sum: '$skippedCount' }
        }
      }
    ]);

    // Get best and worst performance
    const bestAttempt = await TestAttempt.findOne({ status: 'completed' })
      .sort({ percentage: -1 })
      .populate('testId', 'title');

    const worstAttempt = await TestAttempt.findOne({ status: 'completed' })
      .sort({ percentage: 1 })
      .populate('testId', 'title');

    // Topic-wise performance
    const topicPerformance = await TestAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: { path: '$topicAnalysis', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$topicAnalysis.unit',
          totalCorrect: { $sum: '$topicAnalysis.correct' },
          totalWrong: { $sum: '$topicAnalysis.wrong' },
          totalSkipped: { $sum: '$topicAnalysis.skipped' },
          totalQuestions: { $sum: '$topicAnalysis.total' }
        }
      },
      {
        $match: { _id: { $ne: null } }
      },
      {
        $project: {
          unit: '$_id',
          accuracy: {
            $cond: [
              { $gt: [{ $add: ['$totalCorrect', '$totalWrong'] }, 0] },
              {
                $multiply: [
                  { $divide: ['$totalCorrect', { $add: ['$totalCorrect', '$totalWrong'] }] },
                  100
                ]
              },
              0
            ]
          },
          totalQuestions: 1
        }
      },
      { $sort: { accuracy: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalAttempts,
        averageScore: Math.round((stats[0]?.avgScore || 0) * 100) / 100,
        averageAccuracy: Math.round((stats[0]?.avgAccuracy || 0) * 100) / 100,
        totalTimeSpent: stats[0]?.totalTime || 0,
        overallStats: {
          correct: stats[0]?.totalCorrect || 0,
          wrong: stats[0]?.totalWrong || 0,
          skipped: stats[0]?.totalSkipped || 0
        },
        bestAttempt: bestAttempt ? {
          testTitle: bestAttempt.testId?.title,
          percentage: bestAttempt.percentage,
          date: bestAttempt.completedAt
        } : null,
        worstAttempt: worstAttempt ? {
          testTitle: worstAttempt.testId?.title,
          percentage: worstAttempt.percentage,
          date: worstAttempt.completedAt
        } : null,
        topicPerformance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single attempt by ID
// @route   GET /api/attempts/:id
const getAttemptById = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate('testId', 'title testType paper totalQuestions duration totalMarks');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    res.json({
      success: true,
      data: attempt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attempt with full solution review
// @route   GET /api/attempts/:id/review
const getAttemptReview = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({
        path: 'testId',
        populate: {
          path: 'questions',
          populate: ['passageId', 'diDataId']
        }
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (!attempt.testId) {
      return res.status(404).json({
        success: false,
        message: 'Test not found for this attempt'
      });
    }

    // Build detailed review data
    const reviewData = {
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        totalTimeTaken: attempt.totalTimeTaken,
        completedAt: attempt.completedAt
      },
      test: {
        _id: attempt.testId._id,
        title: attempt.testId.title,
        testType: attempt.testId.testType,
        paper: attempt.testId.paper
      },
      questions: (attempt.testId.questions || []).map((question, index) => {
        const answer = attempt.answers.find(
          a => a.questionId && a.questionId.toString() === question._id.toString()
        );

        return {
          questionNumber: index + 1,
          question,
          selectedAnswer: answer?.selectedAnswer ?? -1,
          correctAnswer: question.correctAnswer,
          isCorrect: answer?.isCorrect ?? false,
          timeTaken: answer?.timeTaken ?? 0,
          markedForReview: answer?.markedForReview ?? false
        };
      }),
      topicAnalysis: attempt.topicAnalysis || []
    };

    res.json({
      success: true,
      data: reviewData
    });
  } catch (error) {
    console.error('Get attempt review error:', error);
    next(error);
  }
};

// @desc    Start new test attempt
// @route   POST /api/attempts/start
const startAttempt = async (req, res, next) => {
  try {
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: 'Test ID is required'
      });
    }

    // Get test with questions
    const test = await Test.findById(testId).populate({
      path: 'questions',
      populate: ['passageId', 'diDataId']
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    if (test.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Test is not active'
      });
    }

    // Check for existing in-progress attempt
    const existingAttempt = await TestAttempt.findOne({
      testId,
      status: 'in_progress'
    });

    if (existingAttempt) {
      return res.json({
        success: true,
        message: 'Resuming existing attempt',
        data: {
          attempt: existingAttempt,
          test
        }
      });
    }

    // Get attempt count for this test
    const attemptCount = await TestAttempt.countDocuments({ testId });

    // Create new attempt
    const attempt = new TestAttempt({
      testId,
      attemptNumber: attemptCount + 1,
      totalMarks: test.totalMarks || test.totalQuestions * (test.marksPerQuestion || 2),
      remainingTime: test.duration * 60, // Convert to seconds
      status: 'in_progress',
      startedAt: new Date()
    });

    // Initialize answers array
    attempt.initializeAnswers(test.questions);
    await attempt.save();

    res.status(201).json({
      success: true,
      message: 'Test attempt started',
      data: {
        attempt,
        test
      }
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    next(error);
  }
};

// @desc    Save answer for a question
// @route   PUT /api/attempts/:id/answer
const saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedAnswer, timeTaken = 0 } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed or abandoned attempt'
      });
    }

    attempt.updateAnswer(questionId, selectedAnswer, timeTaken);
    await attempt.save();

    res.json({
      success: true,
      message: 'Answer saved',
      data: attempt.getStatusSummary()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle mark for review
// @route   PUT /api/attempts/:id/mark-review
const toggleMarkForReview = async (req, res, next) => {
  try {
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed or abandoned attempt'
      });
    }

    const isMarked = attempt.toggleMarkForReview(questionId);
    await attempt.save();

    res.json({
      success: true,
      message: isMarked ? 'Marked for review' : 'Unmarked',
      data: { isMarked }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark question as visited
// @route   PUT /api/attempts/:id/visit
const markVisited = async (req, res, next) => {
  try {
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required'
      });
    }

    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    const answerIndex = attempt.answers.findIndex(
      a => a.questionId && a.questionId.toString() === questionId.toString()
    );

    if (answerIndex !== -1) {
      attempt.answers[answerIndex].visited = true;
      attempt.answers[answerIndex].visitedAt = new Date();
      await attempt.save();
    }

    res.json({
      success: true,
      message: 'Question marked as visited'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit test attempt
// @route   POST /api/attempts/:id/submit
const submitAttempt = async (req, res, next) => {
  try {
    const { remainingTime = 0 } = req.body;

    console.log('Submit attempt request:', req.params.id);

    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.status === 'completed') {
      // Already submitted - return the existing result
      return res.json({
        success: true,
        message: 'Attempt already submitted',
        data: {
          attemptId: attempt._id,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          percentage: attempt.percentage,
          accuracy: attempt.accuracy,
          correctCount: attempt.correctCount,
          wrongCount: attempt.wrongCount,
          skippedCount: attempt.skippedCount,
          totalTimeTaken: attempt.totalTimeTaken,
          topicAnalysis: attempt.topicAnalysis
        }
      });
    }

    // Get test and questions
    const test = await Test.findById(attempt.testId).populate({
      path: 'questions',
      populate: ['passageId', 'diDataId']
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Calculate total time taken
    const totalDuration = test.duration * 60; // in seconds
    attempt.totalTimeTaken = Math.max(0, totalDuration - remainingTime);

    // Calculate results
    await attempt.calculateResults(test.questions, test);
    await attempt.save();

    console.log('Attempt saved with results:', {
      attemptId: attempt._id,
      score: attempt.score,
      percentage: attempt.percentage
    });

    // Update test stats (don't let this fail the submission)
    try {
      await test.updateStats(attempt.score);
    } catch (err) {
      console.error('Failed to update test stats:', err);
    }

    // Update question attempt counts - FIXED: Using findByIdAndUpdate directly
    for (const answer of attempt.answers) {
      try {
        if (answer.questionId) {
          await Question.findByIdAndUpdate(
            answer.questionId,
            {
              $inc: {
                timesAttempted: 1,
                timesCorrect: answer.isCorrect ? 1 : 0
              }
            }
          );
        }
      } catch (err) {
        console.error('Failed to update question stats:', err);
        // Don't fail the whole submission for this
      }
    }

    res.json({
      success: true,
      message: 'Test submitted successfully',
      data: {
        attemptId: attempt._id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        totalTimeTaken: attempt.totalTimeTaken,
        topicAnalysis: attempt.topicAnalysis
      }
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    next(error);
  }
};

// @desc    Pause attempt
// @route   PUT /api/attempts/:id/pause
const pauseAttempt = async (req, res, next) => {
  try {
    const { remainingTime, currentQuestionIndex } = req.body;

    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot pause non-active attempt'
      });
    }

    attempt.remainingTime = remainingTime;
    attempt.currentQuestionIndex = currentQuestionIndex;
    await attempt.save();

    res.json({
      success: true,
      message: 'Attempt paused',
      data: {
        remainingTime,
        currentQuestionIndex
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume paused attempt
// @route   PUT /api/attempts/:id/resume
const resumeAttempt = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({
        path: 'testId',
        populate: {
          path: 'questions',
          populate: ['passageId', 'diDataId']
        }
      });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resume non-active attempt'
      });
    }

    res.json({
      success: true,
      message: 'Attempt resumed',
      data: {
        attempt,
        test: attempt.testId
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Abandon attempt
// @route   PUT /api/attempts/:id/abandon
const abandonAttempt = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    if (attempt.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot abandon completed attempt'
      });
    }

    attempt.status = 'abandoned';
    await attempt.save();

    res.json({
      success: true,
      message: 'Attempt abandoned'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attempt status summary
// @route   GET /api/attempts/:id/status
const getAttemptStatus = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: attempt.status,
        summary: attempt.getStatusSummary(),
        remainingTime: attempt.remainingTime,
        currentQuestionIndex: attempt.currentQuestionIndex
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete attempt
// @route   DELETE /api/attempts/:id
const deleteAttempt = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findByIdAndDelete(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    res.json({
      success: true,
      message: 'Attempt deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttempts,
  getRecentAttempts,
  getAttemptStats,
  getAttemptById,
  getAttemptReview,
  startAttempt,
  saveAnswer,
  toggleMarkForReview,
  markVisited,
  submitAttempt,
  pauseAttempt,
  resumeAttempt,
  abandonAttempt,
  getAttemptStatus,
  deleteAttempt
};