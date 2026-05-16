const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  collegeCode: {
    type: String,
    required: true,
    unique: true
  },
  collegeName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  principalName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  coursesOffered: {
    type: [String]
  },
  affiliatedDate: {
    type: Date
  },
  logo: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);
