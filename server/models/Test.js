// server/models/Test.js
// ═══════════════════════════════════════════════════════
// UPGRADED: PYQ metadata, source tracking, smart detection
// ═══════════════════════════════════════════════════════

const mongoose = require('mongoose');
const Counter = require('./Counter');

const testSchema = new mongoose.Schema({
  testNumber: {
    type: Number
  },

  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true
  },

  testType: {
    type: String,
    enum: [
      'dpp', 'topic_test', 'chapter_test', 'unit_test',
      'pyq_year', 'practice',
      'full_mock_p1', 'full_mock_p2', 'full_mock_combined'
    ],
    required: [true, 'Test type is required']
  },

  paper: {
    type: String,
    enum: ['paper1', 'paper2', 'combined'],
    required: [true, 'Paper is required']
  },

  unit: { type: String, trim: true },
  chapter: { type: String, trim: true },
  topic: { type: String, trim: true },

  // ═══ PYQ METADATA — tracks PYQ info regardless of testType ═══
  year: { type: String, trim: true },
  session: { type: String, trim: true },

  // NEW: PYQ source tracking
  hasPYQ: { type: Boolean, default: false },
  pyqCount: { type: Number, default: 0 },
  bankCount: { type: Number, default: 0 },
  pyqYears: [{ type: String }],
  pyqSessions: [{ type: String }],
  pyqUnits: [{ type: String }],
  pyqChapters: [{ type: String }],
  pyqTopics: [{ type: String }],
  sourceType: {
    type: String,
    enum: ['bank', 'pyq', 'mixed'],
    default: 'bank'
  },

  // ═══ Mixed array — ObjectId for bank Q, String for PYQ refs ═══
  questions: [{
    type: mongoose.Schema.Types.Mixed
  }],

  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: 1
  },

  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 1
  },

  marksPerQuestion: { type: Number, default: 2 },
  negativeMarking: { type: Boolean, default: false },
  negativeMarks: { type: Number, default: 0 },
  totalMarks: { type: Number },

  randomConfig: {
    enabled: { type: Boolean, default: false },
    questionsPerUnit: { type: Map, of: Number },
    priority: {
      type: String,
      enum: ['unattempted', 'low_accuracy', 'random'],
      default: 'unattempted'
    }
  },

  instructions: {
    hi: [{ type: String, trim: true }],
    en: [{ type: String, trim: true }]
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },

  totalAttempts: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  highestScore: { type: Number, default: 0 },

  tags: [{ type: String, trim: true }]
}, {
  timestamps: true
});

// Pre-save middleware
testSchema.pre('save', async function (next) {
  if (this.isNew && !this.testNumber) {
    try {
      this.testNumber = await Counter.getNextSequence(Counter.COUNTERS.TEST);
    } catch (error) {
      return next(error);
    }
  }

  if (this.totalQuestions && this.marksPerQuestion) {
    this.totalMarks = this.totalQuestions * this.marksPerQuestion;
  }

  // ═══ AUTO-DETECT PYQ metadata from questions array ═══
  if (this.questions && Array.isArray(this.questions)) {
    let pyqC = 0;
    let bankC = 0;
    this.questions.forEach(qId => {
      const idStr = typeof qId === 'string' ? qId : String(qId);
      if (/^pyq_/i.test(idStr)) {
        pyqC++;
      } else {
        bankC++;
      }
    });
    this.pyqCount = pyqC;
    this.bankCount = bankC;
    this.hasPYQ = pyqC > 0;

    if (pyqC > 0 && bankC === 0) this.sourceType = 'pyq';
    else if (pyqC > 0 && bankC > 0) this.sourceType = 'mixed';
    else this.sourceType = 'bank';
  }

  next();
});

// Indexes
testSchema.index({ testType: 1 });
testSchema.index({ paper: 1 });
testSchema.index({ status: 1 });
testSchema.index({ createdAt: -1 });
testSchema.index({ title: 'text' });
testSchema.index({ hasPYQ: 1 });
testSchema.index({ sourceType: 1 });
testSchema.index({ 'pyqYears': 1 });

// Virtual to get attempts
testSchema.virtual('attempts', {
  ref: 'TestAttempt',
  localField: '_id',
  foreignField: 'testId'
});

// Method to update stats after an attempt
testSchema.methods.updateStats = async function (score) {
  this.totalAttempts += 1;
  const newTotal = (this.averageScore * (this.totalAttempts - 1)) + score;
  this.averageScore = Math.round(newTotal / this.totalAttempts * 100) / 100;
  if (score > this.highestScore) {
    this.highestScore = score;
  }
  return this.save();
};

// Static method to get tests with filters
testSchema.statics.getByFilter = async function (filter, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, populate = false } = options;
  const skip = (page - 1) * limit;

  let query = this.find(filter).sort(sort).skip(skip).limit(limit);

  if (populate) {
    query = query.populate('questions');
  }

  const tests = await query;
  const total = await this.countDocuments(filter);

  return {
    tests,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

testSchema.statics.getWithDetails = async function (testId) {
  return this.findById(testId);
};

testSchema.statics.getCountByType = async function () {
  return this.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$testType', count: { $sum: 1 } } }
  ]);
};

testSchema.set('toJSON', { virtuals: true });
testSchema.set('toObject', { virtuals: true });

const Test = mongoose.model('Test', testSchema);

module.exports = Test;