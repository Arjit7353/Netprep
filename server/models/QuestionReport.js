const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
  data: { type: String, required: true },
  mimeType: { type: String, default: 'image/jpeg' },
  fileName: { type: String, default: 'screenshot.jpg' },
  size: { type: Number, default: 0 }
}, { _id: false });

const subReportSchema = new mongoose.Schema({
  description: { type: String },
  screenshots: [screenshotSchema],
  reporterName: { type: String, default: 'Anonymous' },
  reportType: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const questionReportSchema = new mongoose.Schema({
  // ── Question Reference ──
  questionId: { type: mongoose.Schema.Types.Mixed, required: true },
  questionSource: {
    type: String,
    enum: ['bank', 'pyq'],
    default: 'bank'
  },

  // ── Context ──
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestAttempt' },
  questionIndex: { type: Number },

  // ── Report Details ──
  reportType: {
    type: String,
    enum: [
      'wrong_answer',
      'wrong_question',
      'wrong_options',
      'missing_translation',
      'explanation_error',
      'typo',
      'image_issue',
      'duplicate_question',
      'formatting',
      'other'
    ],
    required: true
  },
  description: { type: String, required: true, maxlength: 2000 },
  screenshots: {
    type: [screenshotSchema],
    validate: [arr => arr.length <= 5, 'Max 5 screenshots']
  },
  suggestedCorrection: { type: String, maxlength: 2000 },
  reporterName: { type: String, default: 'Anonymous', maxlength: 100 },

  // ── Status ──
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'in_progress', 'fixed', 'rejected', 'duplicate'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },

  // ── Admin ──
  adminNotes: { type: String, maxlength: 2000 },
  resolution: { type: String, maxlength: 2000 },
  fixedAt: { type: Date },
  fixedBy: { type: String },

  // ── Deduplication ──
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionReport' },
  reportCount: { type: Number, default: 1 },
  subReports: [subReportSchema],

  // ── Snapshot (question state when reported) ──
  questionSnapshot: {
    questionText: { hi: String, en: String },
    options: { hi: [String], en: [String] },
    correctAnswer: Number,
    questionType: String,
    paper: String,
    unit: String,
    chapter: String,
    topic: String
  },

  // ── Impact ──
  affectedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  affectedTestCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// ── Indexes ──
questionReportSchema.index({ questionId: 1, status: 1 });
questionReportSchema.index({ status: 1, priority: 1, createdAt: -1 });
questionReportSchema.index({ testId: 1 });
questionReportSchema.index({ reportType: 1 });
questionReportSchema.index({ createdAt: -1 });

// ── Auto-calculate priority ──
questionReportSchema.pre('save', function (next) {
  if (this.isModified('reportCount') || this.isNew) {
    if (this.reportCount >= 10) this.priority = 'critical';
    else if (this.reportCount >= 5) this.priority = 'high';
    else if (this.reportCount >= 2) this.priority = 'medium';
    else this.priority = 'low';

    // wrong_answer is always at least medium
    if (this.reportType === 'wrong_answer' && this.priority === 'low') {
      this.priority = 'medium';
    }
  }
  next();
});

const QuestionReport = mongoose.model('QuestionReport', questionReportSchema);
module.exports = QuestionReport;