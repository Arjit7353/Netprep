const mongoose = require('mongoose');
const Counter = require('./Counter');

const passageSchema = new mongoose.Schema({
  // Auto-generated unique passage number
  passageNumber: {
    type: Number,
    unique: true
  },

  // Bilingual Passage Content
  content: {
    hi: {
      type: String,
      trim: true
    },
    en: {
      type: String,
      trim: true
    }
  },

  // Title of the passage
  title: {
    type: String,
    trim: true
  },

  // Categorization
  paper: {
    type: String,
    enum: ['paper1', 'paper2'],
    required: [true, 'Paper is required']
  },

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

  // Source information
  source: {
    type: String,
    trim: true
  },

  // Number of questions associated with this passage
  questionCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  // Word count (auto-calculated)
  wordCount: {
    hi: { type: Number, default: 0 },
    en: { type: Number, default: 0 }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// Pre-save middleware to auto-generate passageNumber and calculate word count
passageSchema.pre('save', async function(next) {
  // Auto-generate passage number
  if (this.isNew && !this.passageNumber) {
    try {
      this.passageNumber = await Counter.getNextSequence(Counter.COUNTERS.PASSAGE);
    } catch (error) {
      return next(error);
    }
  }

  // Calculate word count
  if (this.content.hi) {
    this.wordCount.hi = this.content.hi.split(/\s+/).filter(word => word.length > 0).length;
  }
  if (this.content.en) {
    this.wordCount.en = this.content.en.split(/\s+/).filter(word => word.length > 0).length;
  }

  next();
});

// Indexes
passageSchema.index({ paper: 1 });
passageSchema.index({ unit: 1 });
passageSchema.index({ createdAt: -1 });

// Virtual to get associated questions
passageSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'passageId'
});

// Method to update question count
passageSchema.methods.updateQuestionCount = async function() {
  const Question = mongoose.model('Question');
  const count = await Question.countDocuments({ passageId: this._id });
  this.questionCount = count;
  return this.save();
};

// Static method to get passage with questions
passageSchema.statics.getWithQuestions = async function(passageId) {
  return this.findById(passageId).populate({
    path: 'questions',
    options: { sort: { passageOrder: 1 } }
  });
};

// Ensure virtuals are included
passageSchema.set('toJSON', { virtuals: true });
passageSchema.set('toObject', { virtuals: true });

const Passage = mongoose.model('Passage', passageSchema);

module.exports = Passage;