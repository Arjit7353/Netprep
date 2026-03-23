const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  // ═══ FIX: Changed from ObjectId to Mixed to support PYQ string IDs ═══
  questionId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  questionNumber: {
    type: Number
  },
  selectedAnswer: {
    type: Number,
    default: -1
  },
  correctAnswer: {
    type: Number
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  markedForReview: {
    type: Boolean,
    default: false
  },
  visited: {
    type: Boolean,
    default: false
  },
  visitedAt: {
    type: Date
  },
  answeredAt: {
    type: Date
  }
}, { _id: false });

const topicAnalysisSchema = new mongoose.Schema({
  unit: String,
  topic: String,
  total: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  skipped: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 }
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test ID is required']
  },

  attemptNumber: {
    type: Number,
    default: 1
  },

  answers: [answerSchema],

  score: {
    type: Number,
    default: 0
  },

  totalMarks: {
    type: Number
  },

  correctCount: {
    type: Number,
    default: 0
  },

  wrongCount: {
    type: Number,
    default: 0
  },

  skippedCount: {
    type: Number,
    default: 0
  },

  markedForReviewCount: {
    type: Number,
    default: 0
  },

  accuracy: {
    type: Number,
    default: 0
  },

  percentage: {
    type: Number,
    default: 0
  },

  totalTimeTaken: {
    type: Number,
    default: 0
  },

  averageTimePerQuestion: {
    type: Number,
    default: 0
  },

  startedAt: {
    type: Date
  },

  completedAt: {
    type: Date
  },

  currentQuestionIndex: {
    type: Number,
    default: 0
  },

  remainingTime: {
    type: Number
  },

  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'paused'],
    default: 'in_progress'
  },

  topicAnalysis: [topicAnalysisSchema]

}, {
  timestamps: true
});

// ==================== INSTANCE METHODS ====================

/**
 * Initialize answers array from questions
 * ═══ FIX: Filters out null/undefined questions, handles both ObjectId and string _id ═══
 */
testAttemptSchema.methods.initializeAnswers = function(questions) {
  this.answers = questions
    .filter(q => q && q._id) // Safety: skip null/missing questions
    .map((question, index) => ({
      questionId: question._id, // Works for both ObjectId and PYQ string
      questionNumber: index + 1,
      selectedAnswer: -1,
      correctAnswer: question.correctAnswer,
      isCorrect: false,
      timeTaken: 0,
      markedForReview: false,
      visited: false
    }));
  return this;
};

/**
 * ═══ FIX: Safe string comparison for both ObjectId and PYQ string IDs ═══
 */
const safeIdMatch = (a, b) => {
  if (!a || !b) return false;
  return String(a) === String(b);
};

/**
 * Update answer for a question
 */
testAttemptSchema.methods.updateAnswer = function(questionId, selectedAnswer, timeTaken = 0) {
  const answerIndex = this.answers.findIndex(
    a => safeIdMatch(a.questionId, questionId)
  );

  if (answerIndex !== -1) {
    this.answers[answerIndex].selectedAnswer = selectedAnswer;
    this.answers[answerIndex].timeTaken += timeTaken;
    this.answers[answerIndex].answeredAt = new Date();
    this.answers[answerIndex].visited = true;
    
    this.answers[answerIndex].isCorrect = 
      selectedAnswer === this.answers[answerIndex].correctAnswer;
  }

  return this;
};

/**
 * Toggle mark for review
 */
testAttemptSchema.methods.toggleMarkForReview = function(questionId) {
  const answerIndex = this.answers.findIndex(
    a => safeIdMatch(a.questionId, questionId)
  );

  if (answerIndex !== -1) {
    this.answers[answerIndex].markedForReview = !this.answers[answerIndex].markedForReview;
    return this.answers[answerIndex].markedForReview;
  }

  return false;
};

/**
 * Clear response for a question
 */
testAttemptSchema.methods.clearResponse = function(questionId) {
  const answerIndex = this.answers.findIndex(
    a => safeIdMatch(a.questionId, questionId)
  );

  if (answerIndex !== -1) {
    this.answers[answerIndex].selectedAnswer = -1;
    this.answers[answerIndex].isCorrect = false;
    this.answers[answerIndex].answeredAt = null;
  }

  return this;
};

/**
 * Get status summary for palette
 */
testAttemptSchema.methods.getStatusSummary = function() {
  const summary = {
    total: this.answers.length,
    answered: 0,
    notAnswered: 0,
    markedForReview: 0,
    answeredAndMarked: 0,
    notVisited: 0
  };

  this.answers.forEach(answer => {
    if (!answer.visited) {
      summary.notVisited++;
    } else if (answer.selectedAnswer === -1 && answer.markedForReview) {
      summary.markedForReview++;
    } else if (answer.selectedAnswer !== -1 && answer.markedForReview) {
      summary.answeredAndMarked++;
    } else if (answer.selectedAnswer !== -1) {
      summary.answered++;
    } else {
      summary.notAnswered++;
    }
  });

  return summary;
};

/**
 * Get answer status for palette
 */
testAttemptSchema.methods.getAnswerStatuses = function() {
  return this.answers.map(answer => {
    if (!answer.visited) {
      return 'not_visited';
    } else if (answer.selectedAnswer !== -1 && answer.markedForReview) {
      return 'answered_marked';
    } else if (answer.markedForReview) {
      return 'marked';
    } else if (answer.selectedAnswer !== -1) {
      return 'answered';
    } else {
      return 'not_answered';
    }
  });
};

/**
 * Calculate results after submission
 * ═══ FIX: Uses safeIdMatch for both ObjectId and PYQ string IDs ═══
 */
testAttemptSchema.methods.calculateResults = async function(questions, test) {
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  const topicMap = new Map();

  for (const answer of this.answers) {
    // ═══ FIX: Use safe string comparison ═══
    const question = questions.find(q => safeIdMatch(q._id, answer.questionId));
    
    if (!question) continue;

    if (answer.selectedAnswer === -1) {
      skippedCount++;
      answer.isCorrect = false;
    } else if (answer.selectedAnswer === question.correctAnswer) {
      correctCount++;
      answer.isCorrect = true;
    } else {
      wrongCount++;
      answer.isCorrect = false;
    }

    const topicKey = question.unit || 'General';
    if (!topicMap.has(topicKey)) {
      topicMap.set(topicKey, {
        unit: topicKey,
        topic: question.topic || '',
        total: 0,
        correct: 0,
        wrong: 0,
        skipped: 0
      });
    }

    const topicStats = topicMap.get(topicKey);
    topicStats.total++;
    if (answer.selectedAnswer === -1) {
      topicStats.skipped++;
    } else if (answer.isCorrect) {
      topicStats.correct++;
    } else {
      topicStats.wrong++;
    }
  }

  const marksPerQuestion = test.marksPerQuestion || 2;
  const negativeMarks = test.negativeMarking ? (test.negativeMarks || 0) : 0;
  
  this.score = (correctCount * marksPerQuestion) - (wrongCount * negativeMarks);
  this.score = Math.max(0, this.score);

  this.correctCount = correctCount;
  this.wrongCount = wrongCount;
  this.skippedCount = skippedCount;
  this.markedForReviewCount = this.answers.filter(a => a.markedForReview).length;

  const attempted = correctCount + wrongCount;
  this.accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  this.percentage = this.totalMarks > 0 ? Math.round((this.score / this.totalMarks) * 100) : 0;

  const totalTime = this.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
  this.averageTimePerQuestion = this.answers.length > 0 
    ? Math.round(totalTime / this.answers.length) 
    : 0;

  this.topicAnalysis = Array.from(topicMap.values()).map(stats => ({
    ...stats,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  }));

  this.status = 'completed';
  this.completedAt = new Date();

  return this;
};

// ==================== STATIC METHODS ====================

testAttemptSchema.statics.getRecentAttempts = async function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate('testId', 'title testType paper');
};

testAttemptSchema.statics.getAttemptHistory = async function(testId) {
  return this.find({ testId, status: 'completed' })
    .sort({ completedAt: -1 })
    .select('score percentage accuracy correctCount wrongCount skippedCount totalTimeTaken completedAt attemptNumber');
};

testAttemptSchema.statics.getInProgress = async function(testId) {
  return this.findOne({ testId, status: 'in_progress' });
};

testAttemptSchema.statics.getBestAttempt = async function(testId) {
  return this.findOne({ testId, status: 'completed' })
    .sort({ score: -1 })
    .limit(1);
};

// Indexes
testAttemptSchema.index({ testId: 1 });
testAttemptSchema.index({ status: 1 });
testAttemptSchema.index({ createdAt: -1 });
testAttemptSchema.index({ completedAt: -1 });

testAttemptSchema.set('toJSON', { virtuals: true });
testAttemptSchema.set('toObject', { virtuals: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

module.exports = TestAttempt;