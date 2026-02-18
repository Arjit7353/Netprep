// server/models/Counter.js

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

// Get next sequence value (atomic operation)
counterSchema.statics.getNextSequence = async function(name) {
  try {
    const counter = await this.findOneAndUpdate(
      { name },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return counter.value;
  } catch (error) {
    // Handle duplicate key error on concurrent requests
    if (error.code === 11000) {
      const counter = await this.findOneAndUpdate(
        { name },
        { $inc: { value: 1 } },
        { new: true }
      );
      return counter ? counter.value : Date.now();
    }
    console.error(`[Counter] getNextSequence error for "${name}":`, error.message);
    // Fallback: use timestamp-based number
    return Date.now() % 1000000;
  }
};

// Get current value without incrementing
counterSchema.statics.getCurrentValue = async function(name) {
  try {
    const counter = await this.findOne({ name });
    return counter ? counter.value : 0;
  } catch (error) {
    console.error(`[Counter] getCurrentValue error:`, error.message);
    return 0;
  }
};

// Reset counter
counterSchema.statics.resetCounter = async function(name, value = 0) {
  try {
    await this.findOneAndUpdate(
      { name },
      { value },
      { upsert: true }
    );
    console.log(`[Counter] Reset "${name}" to ${value}`);
  } catch (error) {
    console.error(`[Counter] resetCounter error:`, error.message);
  }
};

// Get multiple counters at once
counterSchema.statics.getAllCounters = async function() {
  try {
    const counters = await this.find({}).lean();
    return counters.reduce((acc, c) => {
      acc[c.name] = c.value;
      return acc;
    }, {});
  } catch (error) {
    console.error(`[Counter] getAllCounters error:`, error.message);
    return {};
  }
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