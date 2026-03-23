const mongoose = require('mongoose');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Passage = require('../models/Passage');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuet-history';

async function cleanup() {
  await mongoose.connect(MONGO_URI);
  
  // Delete bad questions
  const result = await Question.deleteMany({
    questionType: 'passage_based',
    isPYQ: true,
    $or: [
      { $expr: { $eq: ['$question.hi', '$topic'] } },
      { $expr: { $eq: ['$question.en', '$topic'] } }
    ]
  });
  
  console.log(`✅ Deleted ${result.deletedCount} bad passage questions`);
  
  // Delete tests with bad questions
  const tests = await Test.find({}).populate('questions');
  let deletedTests = 0;
  
  for (const test of tests) {
    const validQuestions = test.questions.filter(q => q !== null);
    if (validQuestions.length === 0) {
      await Test.findByIdAndDelete(test._id);
      deletedTests++;
    }
  }
  
  console.log(`✅ Deleted ${deletedTests} empty tests`);
  
  await mongoose.disconnect();
  process.exit(0);
}

cleanup();