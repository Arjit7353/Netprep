// server/scripts/verifyRomanNumeralConversion.js
// ═══════════════════════════════════════════════════════════════
//  VERIFY ALL ROMAN NUMERALS IN OPTIONS HAVE BEEN CONVERTED
//  RUN: node server/scripts/verifyRomanNumeralConversion.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  ROMAN NUMERAL CONVERSION VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

async function main() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Find all match_following questions
    console.log('🔍 Searching for match_following questions...');
    const questions = await Question.find({ questionType: 'match_following' });
    
    console.log(`📊 Total questions: ${questions.length}\n`);
    
    const stats = {
      totalQuestions: questions.length,
      questionsWithOptions: 0,
      questionsWithRoman: 0,
      totalOptionsScanned: 0,
      totalOptionsWithRoman: 0,
      romanExamples: []
    };
    
    const ROMAN_PATTERN = /([A-Za-z0-9\(\)])-([IVX]+)(?=[\s,;:\-]|$)/i;
    
    for (const question of questions) {
      // Check options
      if (question.options?.hi?.length > 0 || question.options?.en?.length > 0) {
        stats.questionsWithOptions++;
        
        const allOptions = [...(question.options?.hi || []), ...(question.options?.en || [])];
        stats.totalOptionsScanned += allOptions.length;
        
        for (const opt of allOptions) {
          if (ROMAN_PATTERN.test(opt)) {
            stats.questionsWithRoman++;
            stats.totalOptionsWithRoman++;
            
            if (stats.romanExamples.length < 10) {
              stats.romanExamples.push({
                questionId: question._id,
                questionNumber: question.questionNumber,
                option: opt
              });
            }
          }
        }
      }
    }
    
    console.log('═'.repeat(60));
    console.log('  RESULTS');
    console.log('═'.repeat(60));
    console.log(`✅ Total match_following questions: ${stats.totalQuestions}`);
    console.log(`✅ Questions with options: ${stats.questionsWithOptions}`);
    console.log(`✅ Total options scanned: ${stats.totalOptionsScanned}`);
    console.log(`\n🔍 Roman Numerals in Options:`);
    console.log(`   Questions with Roman numerals: ${stats.questionsWithRoman}`);
    console.log(`   Total option strings with Roman: ${stats.totalOptionsWithRoman}`);
    
    if (stats.romanExamples.length > 0) {
      console.log(`\n⚠️  Examples of unconverted Roman numerals:`);
      stats.romanExamples.forEach(ex => {
        console.log(`   Q#${ex.questionNumber} (ID: ${ex.questionId}): "${ex.option}"`);
      });
    } else {
      console.log(`\n✨ No unconverted Roman numerals found!`);
    }
    
    console.log('\n' + '═'.repeat(60));
    if (stats.totalOptionsWithRoman === 0) {
      console.log('✅ SUCCESS: All Roman numerals have been converted to digits!');
    } else {
      console.log(`❌ WARNING: Found ${stats.totalOptionsWithRoman} option(s) with Roman numerals`);
    }
    console.log('═'.repeat(60));
    
    // Close database connection
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
