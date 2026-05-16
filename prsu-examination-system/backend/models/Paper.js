const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
  paperId: {
    type: String,
    required: true,
    unique: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  setNumber: {
    type: String, // e.g., 'A', 'B', 'C'
    required: true
  },
  encryptedQuestions: [{
    type: String // AES-256 encrypted question IDs or text
  }],
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  watermark: {
    type: String
  },
  honeypotQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  unlockTime: {
    type: Date,
    required: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: {
    type: Number,
    default: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('Paper', paperSchema);
