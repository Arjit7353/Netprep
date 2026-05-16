const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'controller', 'college', 'teacher'],
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  fullName: {
    type: String,
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
