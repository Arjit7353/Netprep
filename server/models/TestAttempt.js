const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  questionNumber: {
    type: Number
  },
  selectedAnswer: {
    type: Number,
    default: -1  // -1 means not answered
  },
  correctAnswer: {
    type: Number
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  timeTaken: {
    type: Number,  // Time spent on this question in seconds
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
  // Reference to the test
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test ID is required']
  },

  // Attempt number for this test
  attemptNumber: {
    type: Number,
    default: 1
  },

  // Answers array
  answers: [answerSchema],

  // Score calculation
  score: {
    type: Number,
    default: 0
  },

  totalMarks: {
    type: Number
  },

  // Question counts
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

  // Accuracy percentage
  accuracy: {
    type: Number,
    default: 0
  },

  // Percentage score
  percentage: {
    type: Number,
    default: 0
  },

  // Time tracking
  totalTimeTaken: {
    type: Number,  // In seconds
    default: 0
  },

  averageTimePerQuestion: {
    type: Number,  // In seconds
    default: 0
  },

  startedAt: {
    type: Date
  },

  completedAt: {
    type: Date
  },

  // Current question index (for resuming)
  currentQuestionIndex: {
    type: Number,
    default: 0
  },

  // Remaining time (for resuming)
  remainingTime: {
    type: Number  // In seconds
  },

  // Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'paused'],
    default: 'in_progress'
  },

  // Topic Analysis
  topicAnalysis: [topicAnalysisSchema]

}, {
  timestamps: true
});

// ==================== INSTANCE METHODS ====================

/**
 * Initialize answers array from questions
 */
testAttemptSchema.methods.initializeAnswers = function(questions) {
  this.answers = questions.map((question, index) => ({
    questionId: question._id,
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
 * Update answer for a question
 */
testAttemptSchema.methods.updateAnswer = function(questionId, selectedAnswer, timeTaken = 0) {
  const answerIndex = this.answers.findIndex(
    a => a.questionId.toString() === questionId.toString()
  );

  if (answerIndex !== -1) {
    this.answers[answerIndex].selectedAnswer = selectedAnswer;
    this.answers[answerIndex].timeTaken += timeTaken;
    this.answers[answerIndex].answeredAt = new Date();
    this.answers[answerIndex].visited = true;
    
    // Check if correct
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
    a => a.questionId.toString() === questionId.toString()
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
    a => a.questionId.toString() === questionId.toString()
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
 */
testAttemptSchema.methods.calculateResults = async function(questions, test) {
  const Question = mongoose.model('Question');
  
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  // Topic-wise analysis map
  const topicMap = new Map();

  for (const answer of this.answers) {
    const question = questions.find(q => q._id.toString() === answer.questionId.toString());
    
    if (!question) continue;

    // Check answer
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

    // Update topic analysis
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

  // Calculate score
  const marksPerQuestion = test.marksPerQuestion || 2;
  const negativeMarks = test.negativeMarking ? (test.negativeMarks || 0) : 0;
  
  this.score = (correctCount * marksPerQuestion) - (wrongCount * negativeMarks);
  this.score = Math.max(0, this.score);

  // Update counts
  this.correctCount = correctCount;
  this.wrongCount = wrongCount;
  this.skippedCount = skippedCount;
  this.markedForReviewCount = this.answers.filter(a => a.markedForReview).length;

  // Calculate accuracy and percentage
  const attempted = correctCount + wrongCount;
  this.accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
  this.percentage = this.totalMarks > 0 ? Math.round((this.score / this.totalMarks) * 100) : 0;

  // Calculate average time per question
  const totalTime = this.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
  this.averageTimePerQuestion = this.answers.length > 0 
    ? Math.round(totalTime / this.answers.length) 
    : 0;

  // Set topic analysis
  this.topicAnalysis = Array.from(topicMap.values()).map(stats => ({
    ...stats,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  }));

  // Update status
  this.status = 'completed';
  this.completedAt = new Date();

  return this;
};

// ==================== STATIC METHODS ====================

/**
 * Get recent attempts
 */
testAttemptSchema.statics.getRecentAttempts = async function(limit = 10) {
  return this.find({ status: 'completed' })
    .sort({ completedAt: -1 })
    .limit(limit)
    .populate('testId', 'title testType paper');
};

/**
 * Get attempt history for a test
 */
testAttemptSchema.statics.getAttemptHistory = async function(testId) {
  return this.find({ testId, status: 'completed' })
    .sort({ completedAt: -1 })
    .select('score percentage accuracy correctCount wrongCount skippedCount totalTimeTaken completedAt attemptNumber');
};

/**
 * Get in-progress attempt for a test
 */
testAttemptSchema.statics.getInProgress = async function(testId) {
  return this.findOne({ testId, status: 'in_progress' });
};

/**
 * Get best attempt for a test
 */
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

// Ensure virtuals are included
testAttemptSchema.set('toJSON', { virtuals: true });
testAttemptSchema.set('toObject', { virtuals: true });

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

module.exports = TestAttempt;