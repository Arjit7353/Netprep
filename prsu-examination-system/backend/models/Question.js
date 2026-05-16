const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  encryptedText: {
    type: String, // AES-256
    required: true
  },
  encryptedAnswer: {
    type: String
  },
  questionType: {
    type: String,
    enum: ['vsa', 'sa', 'la', 'mcq', 'numerical'], // very short, short, long, mcq, numerical
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  topic: {
    type: String
  },
  marks: {
    type: Number,
    required: true
  },
  hash: {
    type: String, // SHA-256
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
