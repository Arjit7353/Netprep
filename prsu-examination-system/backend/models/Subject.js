const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    unique: true
  },
  subjectName: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  credits: {
    type: Number
  },
  totalMarks: {
    type: Number
  },
  duration: {
    type: Number // in hours
  },
  syllabus: {
    type: String // PDF path
  }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
