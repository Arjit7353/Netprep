const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to get next sequence value
counterSchema.statics.getNextSequence = async function(name) {
  const counter = await this.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
};

// Static method to get current value without incrementing
counterSchema.statics.getCurrentValue = async function(name) {
  const counter = await this.findOne({ name });
  return counter ? counter.value : 0;
};

// Static method to reset counter
counterSchema.statics.resetCounter = async function(name, value = 0) {
  await this.findOneAndUpdate(
    { name },
    { value },
    { upsert: true }
  );
};

// Counter names constants
counterSchema.statics.COUNTERS = {
  QUESTION: 'questionNumber',
  PASSAGE: 'passageNumber',
  DI_DATA: 'diNumber',
  TEST: 'testNumber',
  TEST_ATTEMPT: 'attemptNumber'
};

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;