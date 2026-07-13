// server/scripts/validateMatchFollowingNormalization.js
// ═══════════════════════════════════════════════════════════════
//  VALIDATE MATCH_FOLLOWING QUESTION NORMALIZATION
//  RUN: node server/scripts/validateMatchFollowingNormalization.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MATCH_FOLLOWING NORMALIZATION VALIDATOR');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// ═══════════════════════════════════════════════════════════════
//  VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════

const ISSUES = {
  listA_with_prefix: 0,
  listB_with_prefix: 0,
  options_with_roman: 0,
  valid_questions: 0,
  total_checked: 0,
};

const PREFIXES = [
  /^[A-Z]\.\s+/,
  /^[(][A-Z][)]\s*/,
  /^[A-Z][)]\s*/,
  /^[0-9]+\.\s+/,
  /^[(][0-9]+[)]\s*/,
  /^[(][ivxlc]+[)]\s*/i,
  /^[IVX]+\.\s+/,
];

const ROMAN_PATTERN = /([A-Za-z0-9\(\)])-([IVX]+)/i;

function hasPrefix(text) {
  if (!text || typeof text !== 'string') return false;
  return PREFIXES.some(p => p.test(text.trimStart()));
}

function hasRoman(text) {
  if (!text || typeof text !== 'string') return false;
  return ROMAN_PATTERN.test(text);
}

function validateQuestion(question) {
  const issues = [];
  
  // Check listA
  if (question.matchData?.listA?.hi) {
    for (const item of question.matchData.listA.hi) {
      if (hasPrefix(item)) {
        ISSUES.listA_with_prefix++;
        issues.push(`listA.hi has prefix: "${item}"`);
      }
    }
  }
  
  if (question.matchData?.listA?.en) {
    for (const item of question.matchData.listA.en) {
      if (hasPrefix(item)) {
        ISSUES.listA_with_prefix++;
        issues.push(`listA.en has prefix: "${item}"`);
      }
    }
  }
  
  // Check listB
  if (question.matchData?.listB?.hi) {
    for (const item of question.matchData.listB.hi) {
      if (hasPrefix(item)) {
        ISSUES.listB_with_prefix++;
        issues.push(`listB.hi has prefix: "${item}"`);
      }
    }
  }
  
  if (question.matchData?.listB?.en) {
    for (const item of question.matchData.listB.en) {
      if (hasPrefix(item)) {
        ISSUES.listB_with_prefix++;
        issues.push(`listB.en has prefix: "${item}"`);
      }
    }
  }
  
  // Check options
  if (question.options?.hi) {
    for (const opt of question.options.hi) {
      if (hasRoman(opt)) {
        ISSUES.options_with_roman++;
        issues.push(`options.hi has Roman numerals: "${opt}"`);
      }
    }
  }
  
  if (question.options?.en) {
    for (const opt of question.options.en) {
      if (hasRoman(opt)) {
        ISSUES.options_with_roman++;
        issues.push(`options.en has Roman numerals: "${opt}"`);
      }
    }
  }
  
  return issues;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PROCESS
// ═══════════════════════════════════════════════════════════════

async function main() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Find all match_following questions
    console.log('🔍 Validating all match_following questions...');
    const questions = await Question.find({ questionType: 'match_following' });
    
    console.log(`📊 Total questions to validate: ${questions.length}\n`);
    
    const problemQuestions = [];
    
    for (let i = 0; i < questions.length; i++) {
      ISSUES.total_checked++;
      
      const issues = validateQuestion(questions[i]);
      
      if (issues.length === 0) {
        ISSUES.valid_questions++;
      } else {
        problemQuestions.push({
          id: questions[i]._id,
          questionNumber: questions[i].questionNumber,
          issues
        });
      }
      
      if ((i + 1) % 100 === 0) {
        console.log(`⏳ Validated: ${i + 1}/${questions.length}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    //  REPORT
    // ═══════════════════════════════════════════════════════════════
    
    console.log('\n' + '═'.repeat(60));
    console.log('  VALIDATION REPORT');
    console.log('═'.repeat(60));
    console.log(`✅ Valid Questions: ${ISSUES.valid_questions}/${ISSUES.total_checked}`);
    console.log(`❌ Questions with Issues: ${problemQuestions.length}`);
    console.log(`\n📊 Issues Found:`);
    console.log(`  - listA items with prefixes: ${ISSUES.listA_with_prefix}`);
    console.log(`  - listB items with prefixes: ${ISSUES.listB_with_prefix}`);
    console.log(`  - options with Roman numerals: ${ISSUES.options_with_roman}`);
    
    if (problemQuestions.length > 0) {
      console.log('\n⚠️  Problem Questions:');
      problemQuestions.slice(0, 10).forEach((pq) => {
        console.log(`\n  Question ID: ${pq.id} (#${pq.questionNumber})`);
        pq.issues.forEach(issue => console.log(`    - ${issue}`));
      });
      
      if (problemQuestions.length > 10) {
        console.log(`\n  ... and ${problemQuestions.length - 10} more`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    if (problemQuestions.length === 0) {
      console.log('✨ All match_following questions are properly normalized!');
    } else {
      console.log(`⚠️  Found ${problemQuestions.length} questions with normalization issues.`);
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
