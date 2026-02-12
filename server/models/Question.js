const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    unique: true,
    sparse: true
  },
  
  // Question Type
  questionType: {
    type: String,
    enum: [
      'mcq',
      'assertion_reason',
      'match_following',
      'sequence_order',
      'statement_based',
      'passage_based',
      'di_table',
      'di_bar_chart',
      'di_pie_chart',
      'di_line_graph',
      'di_mixed',
      'di_caselet'
    ],
    required: true,
    index: true
  },
  
  // Bilingual Content
  question: {
    hi: { type: String },
    en: { type: String }
  },
  
  // For Passage-based questions
  passageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passage'
  },
  passageOrder: { type: Number },
  
  // For DI questions
  diDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DIData'
  },
  diOrder: { type: Number },
  
  // Options (for MCQ, A-R, Statement-based, DI questions)
  options: {
    hi: [{ type: String }],
    en: [{ type: String }]
  },
  
  // For Match Following type
  matchData: {
    listA: { 
      hi: [{ type: String }], 
      en: [{ type: String }] 
    },
    listB: { 
      hi: [{ type: String }], 
      en: [{ type: String }] 
    },
    correctMatch: [{ type: Number }]
  },
  
  // For Sequence/Chronological type
  sequenceData: {
    items: { 
      hi: [{ type: String }], 
      en: [{ type: String }] 
    },
    correctOrder: [{ type: Number }]
  },
  
  // For Statement Based
  statementData: {
    statements: { 
      hi: [{ type: String }], 
      en: [{ type: String }] 
    },
    correctStatements: [{ type: Number }]
  },
  
  // For Assertion-Reason
  assertionReasonData: {
    assertion: { hi: String, en: String },
    reason: { hi: String, en: String }
  },
  
  correctAnswer: { 
    type: Number, 
    required: true 
  },
  
  explanation: {
    hi: { type: String },
    en: { type: String }
  },
  
  // Categorization
  paper: { 
    type: String, 
    enum: ['paper1', 'paper2'], 
    required: true,
    index: true
  },
  subject: { type: String },
  unit: { 
    type: String, 
    required: true,
    index: true
  },
  chapter: { 
    type: String,
    index: true
  },
  topic: { 
    type: String,
    index: true
  },
  subtopic: { type: String },
  
  // Metadata
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium',
    index: true
  },
  source: { type: String },
  year: { 
    type: String,
    index: true
  },
  
  // PYQ specific fields
  isPYQ: {
    type: Boolean,
    default: false,
    index: true
  },
  
  pyqSession: {
    type: String,
    enum: ['june', 'december', 'november', 'september', ''],
    default: ''
  },
  
  pyqShift: {
    type: String,
    enum: ['shift1', 'shift2', ''],
    default: ''
  },
  
  isMemoryBased: {
    type: Boolean,
    default: false
  },
  
  pyqQuestionNumber: {
    type: Number
  },
  
  // Tags
  tags: [{ type: String }],
  
  // Tracking
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  timesAttempted: { 
    type: Number, 
    default: 0 
  },
  timesCorrect: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
questionSchema.index({ paper: 1, unit: 1, chapter: 1 });
questionSchema.index({ isPYQ: 1, year: 1, pyqSession: 1 });
questionSchema.index({ questionType: 1, difficulty: 1 });
questionSchema.index({ createdAt: -1 });

// Auto-generate question number
questionSchema.pre('save', async function(next) {
  if (this.isNew && !this.questionNumber) {
    const Counter = mongoose.model('Counter');
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: 'questionNumber' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
      );
      this.questionNumber = counter.value;
    } catch (error) {
      console.error('Error generating question number:', error);
    }
  }
  next();
});

// Static method to get questions with filters
questionSchema.statics.getByFilter = async function(filter, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 }
  } = options;

  const skip = (page - 1) * limit;

  const questions = await this.find(filter)
    .populate('passageId', 'content title')
    .populate('diDataId', 'title diType')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.countDocuments(filter);

  return {
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Method to update accuracy
questionSchema.methods.updateAccuracy = function(isCorrect) {
  this.timesAttempted += 1;
  if (isCorrect) {
    this.timesCorrect += 1;
  }
  return this.save();
};

// Virtual for accuracy percentage
questionSchema.virtual('accuracy').get(function() {
  if (this.timesAttempted === 0) return 0;
  return Math.round((this.timesCorrect / this.timesAttempted) * 100);
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;