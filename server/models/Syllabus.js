const mongoose = require('mongoose');

// Subtopic Schema
const subtopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHi: { type: String, default: '' }
}, { _id: false });

// Topic Schema
const topicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  nameHi: { type: String, default: '' },
  subtopics: [subtopicSchema],
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
syllabusSchema.index({ 'units.id': 1 });
syllabusSchema.index({ 'units.chapters.id': 1 });
syllabusSchema.index({ 'units.chapters.topics.id': 1 });
syllabusSchema.index({ isActive: 1 });

// Pre-save hook to update version
syllabusSchema.pre('save', function(next) {
  if (this.isModified('units')) {
    this.version += 1;
  }
  next();
});

// Static method to get syllabus with fallback
syllabusSchema.statics.getWithFallback = async function(paper, fallbackData) {
  let syllabus = await this.findOne({ paper, isActive: true });
  if (!syllabus && fallbackData) {
    // Return fallback data structure
    return fallbackData;
  }
  return syllabus;
};

// Instance method to add unit
syllabusSchema.methods.addUnit = function(unitData) {
  const maxOrder = this.units.length > 0 
    ? Math.max(...this.units.map(u => u.order || 0)) 
    : 0;
  
  this.units.push({
    ...unitData,
    order: unitData.order || maxOrder + 1,
    chapters: unitData.chapters || []
  });
  return this;
};

// Instance method to find unit
syllabusSchema.methods.findUnit = function(unitId) {
  return this.units.find(u => u.id === unitId);
};

// Instance method to find chapter
syllabusSchema.methods.findChapter = function(unitId, chapterId) {
  const unit = this.findUnit(unitId);
  if (!unit) return null;
  return unit.chapters.find(c => c.id === chapterId);
};

// Instance method to find topic
syllabusSchema.methods.findTopic = function(unitId, chapterId, topicId) {
  const chapter = this.findChapter(unitId, chapterId);
  if (!chapter) return null;
  return chapter.topics.find(t => t.id === topicId);
};

module.exports = mongoose.model('Syllabus', syllabusSchema);