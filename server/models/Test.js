const mongoose = require('mongoose');
const Counter = require('./Counter');

const testSchema = new mongoose.Schema({
  // Auto-generated test number
  testNumber: {
    type: Number
  },

  // Title (auto-generated or custom)
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true
  },

  // Test Type
  testType: {
    type: String,
    enum: [
      'dpp',
      'topic_test',
      'chapter_test',
      'unit_test',
      'pyq_year',
      'practice',
      'full_mock_p1',
      'full_mock_p2',
      'full_mock_combined'
    ],
    required: [true, 'Test type is required']
  },

  // Paper
  paper: {
    type: String,
    enum: ['paper1', 'paper2', 'combined'],
    required: [true, 'Paper is required']
  },

  // Categorization (for topic/chapter/unit tests)
  unit: {
    type: String,
    trim: true
  },

  chapter: {
    type: String,
    trim: true
  },

  topic: {
    type: String,
    trim: true
  },

  // For PYQ tests
  year: {
    type: String,
    trim: true
  },

  session: {
    type: String,
    trim: true
  },

  // Questions array
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],

  // Total number of questions
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: 1
  },

  // Duration in minutes
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 1
  },

  // Marking scheme
  marksPerQuestion: {
    type: Number,
    default: 2
  },

  negativeMarking: {
    type: Boolean,
    default: false
  },

  negativeMarks: {
    type: Number,
    default: 0
  },

  // Total marks
  totalMarks: {
    type: Number
  },

  // Random generation config (for full mocks)
  randomConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    questionsPerUnit: {
      type: Map,
      of: Number
    },
    // Priority for question selection
    priority: {
      type: String,
      enum: ['unattempted', 'low_accuracy', 'random'],
      default: 'unattempted'
    }
  },

  // Instructions
  instructions: {
    hi: [{
      type: String,
      trim: true
    }],
    en: [{
      type: String,
      trim: true
    }]
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },

  // Attempt tracking
  totalAttempts: {
    type: Number,
    default: 0
  },

  averageScore: {
    type: Number,
    default: 0
  },

  highestScore: {
    type: Number,
    default: 0
  },

  // Tags
  tags: [{
    type: String,
    trim: true
  }]

}, {
  timestamps: true
});

// Pre-save middleware
testSchema.pre('save', async function(next) {
  // Auto-generate test number
  if (this.isNew && !this.testNumber) {
    try {
      this.testNumber = await Counter.getNextSequence(Counter.COUNTERS.TEST);
    } catch (error) {
      return next(error);
    }
  }

  // Calculate total marks
  if (this.totalQuestions && this.marksPerQuestion) {
    this.totalMarks = this.totalQuestions * this.marksPerQuestion;
  }

  next();
});

// Indexes
testSchema.index({ testType: 1 });
testSchema.index({ paper: 1 });
testSchema.index({ status: 1 });
testSchema.index({ createdAt: -1 });
testSchema.index({ title: 'text' });

// Virtual to get attempts
testSchema.virtual('attempts', {
  ref: 'TestAttempt',
  localField: '_id',
  foreignField: 'testId'
});

// Method to update stats after an attempt
testSchema.methods.updateStats = async function(score) {
  this.totalAttempts += 1;
  
  // Update average score
  const newTotal = (this.averageScore * (this.totalAttempts - 1)) + score;
  this.averageScore = Math.round(newTotal / this.totalAttempts * 100) / 100;
  
  // Update highest score
  if (score > this.highestScore) {
    this.highestScore = score;
  }
  
  return this.save();
};

// Static method to get tests with filters
testSchema.statics.getByFilter = async function(filter, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    populate = false
  } = options;

  const skip = (page - 1) * limit;

  let query = this.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (populate) {
    query = query.populate('questions');
  }

  const tests = await query;
  const total = await this.countDocuments(filter);

  return {
    tests,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get test with full details
testSchema.statics.getWithDetails = async function(testId) {
  return this.findById(testId)
    .populate({
      path: 'questions',
      populate: [
        { path: 'passageId' },
        { path: 'diDataId' }
      ]
    });
};

// Static method to count tests by type
testSchema.statics.getCountByType = async function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$testType',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Ensure virtuals are included
testSchema.set('toJSON', { virtuals: true });
testSchema.set('toObject', { virtuals: true });

const Test = mongoose.model('Test', testSchema);

module.exports = Test;