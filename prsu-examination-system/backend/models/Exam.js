const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  examId: {
    type: String,
    required: true,
    unique: true
  },
  examName: {
    type: String,
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
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
  examDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number,
    required: true
  },
  numberOfSets: {
    type: Number,
    enum: [3, 5, 10],
    default: 3
  },
  questionDistribution: {
    type: Map,
    of: Object // e.g., { count: 5, marksEach: 2 }
  },
  difficultyDistribution: {
    type: Map,
    of: Number // e.g., { easy: 40, medium: 40, hard: 20 }
  },
  instructions: {
    type: String
  },
  allowedColleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }],
  status: {
    type: String,
    enum: ['scheduled', 'paper-generated', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
