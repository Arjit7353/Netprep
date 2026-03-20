const mongoose = require('mongoose');

// Subtopic Schema - Allow both string and object
const subtopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHi: { type: String, default: '' }
}, { _id: false });

// Topic Schema
const topicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  nameHi: { type: String, default: '' },
  subtopics: { type: mongoose.Schema.Types.Mixed, default: [] }, // Changed to Mixed to handle both strings and objects
  order: { type: Number, default: 0 }
}, { _id: false });

// Chapter Schema
const chapterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  nameHi: { type: String, default: '' },
  topics: [topicSchema],
  order: { type: Number, default: 0 }
}, { _id: false });

// Unit Schema
const unitSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  nameHi: { type: String, default: '' },
  part: { type: String, default: '' },
  chapters: [chapterSchema],
  order: { type: Number, default: 0 }
}, { _id: false });

// Main Syllabus Schema
const syllabusSchema = new mongoose.Schema({
  paper: {
    type: String,
    enum: ['paper1', 'paper2'],
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  nameHi: { type: String, default: '' },
  code: { type: String, required: true },
  units: [unitSchema],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Indexes for faster queries
syllabusSchema.index({ paper: 1 });
syllabusSchema.index({ isActive: 1 });

// Pre-save hook to normalize subtopics and update version
syllabusSchema.pre('save', function(next) {
  if (this.isModified('units')) {
    this.version += 1;
    
    // Normalize subtopics - convert strings to objects
    this.units.forEach(unit => {
      (unit.chapters || []).forEach(chapter => {
        (chapter.topics || []).forEach(topic => {
          if (Array.isArray(topic.subtopics)) {
            topic.subtopics = topic.subtopics.map(st => {
              if (typeof st === 'string') {
                return { name: st, nameHi: '' };
              }
              return st;
            });
          }
        });
      });
    });
  }
  next();
});

// Static method to get syllabus with fallback
syllabusSchema.statics.getWithFallback = async function(paper, fallbackData) {
  let syllabus = await this.findOne({ paper, isActive: true });
  if (!syllabus && fallbackData) {
    return fallbackData;
  }
  return syllabus;
};

// Static method to normalize subtopics in data
syllabusSchema.statics.normalizeSubtopics = function(data) {
  if (!data || !data.units) return data;
  
  data.units.forEach(unit => {
    (unit.chapters || []).forEach(chapter => {
      (chapter.topics || []).forEach(topic => {
        if (Array.isArray(topic.subtopics)) {
          topic.subtopics = topic.subtopics.map(st => {
            if (typeof st === 'string') {
              return { name: st, nameHi: '' };
            }
            return st;
          });
        }
      });
    });
  });
  
  return data;
};

module.exports = mongoose.model('Syllabus', syllabusSchema);