const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const PYQAnalysis = require('../models/PYQAnalysis');

// ═══════════════════════════════════════════════════════
//   PYQ RESOLUTION HELPERS
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

/**
 * Resolve a PYQ synthetic ID into a virtual Question-like object
 */
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
    _isVirtualPYQ: true,
    timesAttempted: 0,
    timesCorrect: 0,
    createdAt: pyqDoc.importedAt || pyqDoc.createdAt
  };

  // Add passage data
  if (qType === 'passage_based' || pq.type === 'passage' || pq.type === 'comprehension') {
    virtualQuestion.passageId = {
      _id: `passage_${docId}_${qNo}`,
      content: { hi: pq.passageHi || pq.passage || '', en: pq.passageEn || pq.passage || '' },
      title: pq.passageTitle || `PYQ ${pyqDoc.year} Passage`
    };
    virtualQuestion.subQuestions = pq.subQuestions || [];
  }

  // Add type-specific data
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

/**
 * ═══ KEY FIX: Resolve ALL questions from a test (bank + PYQ) ═══
 * Returns array of question objects in original order
 */
async function resolveTestQuestions(test) {
  const testObj = test.toObject ? test.toObject() : test;
  const questionIds = testObj.questions || [];

  if (questionIds.length === 0) return [];

  const realIds = [];
  const pyqSyntheticIds = [];

  questionIds.forEach(qId => {
    const idStr = typeof qId === 'string' ? qId : String(qId);
    if (isPYQSyntheticId(idStr)) {
      pyqSyntheticIds.push(idStr);
    } else {
      realIds.push(qId);
    }
  });

  // Fetch bank questions
  let realQuestions = [];
  if (realIds.length > 0) {
    realQuestions = await Question.find({ _id: { $in: realIds } })
      .populate('passageId')
      .populate('diDataId')
      .lean();
  }

  // Resolve PYQ questions
  let pyqQuestions = [];
  if (pyqSyntheticIds.length > 0) {
    const pyqDocCache = {};
    const resolved = await Promise.all(
      pyqSyntheticIds.map(id => resolvePYQQuestion(id, pyqDocCache))
    );
    pyqQuestions = resolved.filter(Boolean);
  }

  // Build lookup map
  const questionMap = new Map();
  realQuestions.forEach(q => questionMap.set(q._id.toString(), q));
  pyqQuestions.forEach(q => questionMap.set(String(q._id), q));

  // Return in original order, skip any unresolved
  return questionIds
    .map(qId => {
      const idStr = typeof qId === 'string' ? qId : String(qId);
      return questionMap.get(idStr) || null;
    })
    .filter(Boolean);
}

// ═══════════════════════════════════════════════════════
//   CONTROLLERS
// ═══════════════════════════════════════════════════════

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

    const bestAttempt = await TestAttempt.findOne({ status: 'completed' })
      .sort({ percentage: -1 })
      .populate('testId', 'title');

    const worstAttempt = await TestAttempt.findOne({ status: 'completed' })
      .sort({ percentage: 1 })
      .populate('testId', 'title');

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
// ═══ FIX: Resolves PYQ questions instead of relying on populate ═══
const getAttemptReview = async (req, res, next) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    const test = await Test.findById(attempt.testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found for this attempt'
      });
    }

    // ═══ FIX: Use resolveTestQuestions instead of populate ═══
    const resolvedQuestions = await resolveTestQuestions(test);

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
        _id: test._id,
        title: test.title,
        testType: test.testType,
        paper: test.paper
      },
      questions: resolvedQuestions.map((question, index) => {
        const answer = attempt.answers.find(
          a => a.questionId && String(a.questionId) === String(question._id)
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
// ═══ FIX: Resolves PYQ questions properly before initializing answers ═══
const startAttempt = async (req, res, next) => {
  try {
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: 'Test ID is required'
      });
    }

    // ═══ FIX: Get test WITHOUT populating questions ═══
    const test = await Test.findById(testId);

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

    // ═══ FIX: Resolve ALL questions (bank + PYQ) ═══
    const resolvedQuestions = await resolveTestQuestions(test);

    if (resolvedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions could be resolved for this test'
      });
    }

    if (existingAttempt) {
      // Build test-like response with resolved questions
      const testResponse = test.toObject();
      testResponse.questions = resolvedQuestions;

      return res.json({
        success: true,
        message: 'Resuming existing attempt',
        data: {
          attempt: existingAttempt,
          test: testResponse
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
      remainingTime: test.duration * 60,
      status: 'in_progress',
      startedAt: new Date()
    });

    // ═══ FIX: Initialize answers with resolved questions ═══
    attempt.initializeAnswers(resolvedQuestions);
    await attempt.save();

    console.log(`[startAttempt] Created attempt ${attempt._id} with ${attempt.answers.length} answers (${resolvedQuestions.filter(q => q._isVirtualPYQ).length} PYQ)`);

    // Build test response with resolved questions
    const testResponse = test.toObject();
    testResponse.questions = resolvedQuestions;

    res.status(201).json({
      success: true,
      message: 'Test attempt started',
      data: {
        attempt,
        test: testResponse
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

    // ═══ FIX: Use string comparison for both ObjectId and PYQ IDs ═══
    const answerIndex = attempt.answers.findIndex(
      a => a.questionId && String(a.questionId) === String(questionId)
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
// ═══ FIX: Resolves PYQ questions for scoring, guards stats update ═══
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

    // ═══ FIX: Get test and resolve questions (bank + PYQ) ═══
    const test = await Test.findById(attempt.testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    const resolvedQuestions = await resolveTestQuestions(test);

    // Calculate total time taken
    const totalDuration = test.duration * 60;
    attempt.totalTimeTaken = Math.max(0, totalDuration - remainingTime);

    // ═══ FIX: Pass resolved questions (includes PYQ) to calculateResults ═══
    await attempt.calculateResults(resolvedQuestions, test);
    await attempt.save();

    console.log('Attempt saved with results:', {
      attemptId: attempt._id,
      score: attempt.score,
      percentage: attempt.percentage,
      totalQuestions: resolvedQuestions.length,
      pyqCount: resolvedQuestions.filter(q => q._isVirtualPYQ).length
    });

    // Update test stats
    try {
      await test.updateStats(attempt.score);
    } catch (err) {
      console.error('Failed to update test stats:', err);
    }

    // ═══ FIX: Only update question stats for BANK questions, skip PYQ ═══
    for (const answer of attempt.answers) {
      try {
        if (answer.questionId) {
          const qIdStr = String(answer.questionId);
          // Skip PYQ questions — they don't exist in the Question collection
          if (isPYQSyntheticId(qIdStr)) continue;

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
// ═══ FIX: Resolves PYQ questions instead of relying on populate ═══
const resumeAttempt = async (req, res, next) => {
  try {
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
        message: 'Cannot resume non-active attempt'
      });
    }

    // ═══ FIX: Resolve questions properly ═══
    const test = await Test.findById(attempt.testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    const resolvedQuestions = await resolveTestQuestions(test);
    const testResponse = test.toObject();
    testResponse.questions = resolvedQuestions;

    res.json({
      success: true,
      message: 'Attempt resumed',
      data: {
        attempt,
        test: testResponse
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