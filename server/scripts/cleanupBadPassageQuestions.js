require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Test = require('../models/Test');
const Passage = require('../models/Passage');

// Get MongoDB URI from environment variables
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env file');
  console.log('\n💡 Make sure your .env file contains:');
  console.log('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
  process.exit(1);
}

async function cleanupBadPassageQuestions() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // ═══════════════════════════════════════════════════════
    // STEP 1: Find all bad passage questions
    // ═══════════════════════════════════════════════════════
    console.log('🔍 Finding bad passage questions...');
    
    const badQuestions = await Question.find({
      questionType: 'passage_based',
      isPYQ: true,
      $or: [
        { $expr: { $eq: ['$question.hi', '$topic'] } },
        { $expr: { $eq: ['$question.en', '$topic'] } },
        { $expr: { $eq: ['$question.hi', '$chapter'] } },
        { $expr: { $eq: ['$question.en', '$chapter'] } }
      ]
    }).lean();

    console.log(`📋 Found ${badQuestions.length} bad passage questions\n`);

    if (badQuestions.length === 0) {
      console.log('✨ No bad questions found. Database is clean!');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    // Show sample of bad questions
    console.log('Sample bad questions:');
    badQuestions.slice(0, 10).forEach(q => {
      console.log(`  - Q${q.questionNumber}: "${q.question?.hi || q.question?.en || 'NO TEXT'}" (topic: ${q.topic})`);
    });
    console.log('');

    // ═══════════════════════════════════════════════════════
    // STEP 2: Find tests using these questions
    // ═══════════════════════════════════════════════════════
    const badQuestionIds = badQuestions.map(q => q._id);
    
    console.log('🔍 Finding tests using bad questions...');
    const affectedTests = await Test.find({
      questions: { $in: badQuestionIds }
    }).lean();

    console.log(`📝 Found ${affectedTests.length} tests affected\n`);

    if (affectedTests.length > 0) {
      console.log('Affected tests:');
      affectedTests.forEach(t => {
        const badCount = t.questions.filter(qId => 
          badQuestionIds.some(badId => badId.toString() === qId.toString())
        ).length;
        console.log(`  - ${t.title} (${badCount}/${t.totalQuestions} bad questions)`);
      });
      console.log('');
    }

    // ═══════════════════════════════════════════════════════
    // STEP 3: Find orphaned passages
    // ═══════════════════════════════════════════════════════
    const passageIds = [...new Set(badQuestions.map(q => q.passageId).filter(Boolean))];
    
    console.log('🔍 Finding orphaned passages...');
    const orphanedPassages = [];
    
    for (const passageId of passageIds) {
      const linkedQuestions = await Question.countDocuments({ 
        passageId,
        _id: { $nin: badQuestionIds }
      });
      
      if (linkedQuestions === 0) {
        orphanedPassages.push(passageId);
      }
    }

    console.log(`📄 Found ${orphanedPassages.length} orphaned passages\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 4: Ask for confirmation
    // ═══════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════');
    console.log('🗑️  CLEANUP PLAN:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  1. Delete ${badQuestions.length} bad passage questions`);
    console.log(`  2. Update ${affectedTests.length} tests`);
    console.log(`  3. Delete ${orphanedPassages.length} orphaned passages`);
    console.log('═══════════════════════════════════════════════════\n');

    // For safety, require manual confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmed = await new Promise(resolve => {
      readline.question('❓ Proceed with cleanup? (yes/no): ', answer => {
        readline.close();
        resolve(answer.toLowerCase() === 'yes');
      });
    });

    if (!confirmed) {
      console.log('\n❌ Cleanup cancelled by user');
      await mongoose.disconnect();
      process.exit(0);
      return;
    }

    console.log('\n🚀 Starting cleanup...\n');

    // ═══════════════════════════════════════════════════════
    // STEP 5: Remove questions from tests
    // ═══════════════════════════════════════════════════════
    console.log('📝 Updating tests...');
    let deletedTests = 0;
    let updatedTests = 0;
    
    for (const test of affectedTests) {
      const cleanedQuestions = test.questions.filter(qId => 
        !badQuestionIds.some(badId => badId.toString() === qId.toString())
      );
      
      const removedCount = test.questions.length - cleanedQuestions.length;
      
      if (cleanedQuestions.length === 0) {
        // Delete test if no questions left
        await Test.findByIdAndDelete(test._id);
        console.log(`  ❌ Deleted test "${test.title}" (no questions left)`);
        deletedTests++;
      } else {
        // Update test with cleaned questions
        await Test.findByIdAndUpdate(test._id, {
          questions: cleanedQuestions,
          totalQuestions: cleanedQuestions.length,
          totalMarks: cleanedQuestions.length * (test.marksPerQuestion || 2)
        });
        console.log(`  ✅ Updated "${test.title}" (removed ${removedCount} questions, ${cleanedQuestions.length} remaining)`);
        updatedTests++;
      }
    }

    // ═══════════════════════════════════════════════════════
    // STEP 6: Delete bad questions
    // ═══════════════════════════════════════════════════════
    console.log('\n🗑️  Deleting bad questions...');
    
    const deleteResult = await Question.deleteMany({
      _id: { $in: badQuestionIds }
    });
    
    console.log(`  ✅ Deleted ${deleteResult.deletedCount} questions`);

    // ═══════════════════════════════════════════════════════
    // STEP 7: Delete orphaned passages
    // ═══════════════════════════════════════════════════════
    if (orphanedPassages.length > 0) {
      console.log('\n📄 Deleting orphaned passages...');
      
      const passageDeleteResult = await Passage.deleteMany({
        _id: { $in: orphanedPassages }
      });
      
      console.log(`  ✅ Deleted ${passageDeleteResult.deletedCount} passages`);
    }

    // ═══════════════════════════════════════════════════════
    // STEP 8: Summary
    // ═══════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✨ CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ ${deleteResult.deletedCount} bad questions deleted`);
    console.log(`  ✅ ${updatedTests} tests updated`);
    console.log(`  ✅ ${deletedTests} empty tests deleted`);
    console.log(`  ✅ ${orphanedPassages.length} orphaned passages deleted`);
    console.log('═══════════════════════════════════════════════════\n');

    console.log('💡 Next steps:');
    console.log('   1. Restart your server');
    console.log('   2. Create new tests from PYQ analysis');
    console.log('   3. New imports will use correct question text\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanupBadPassageQuestions();