// server/scripts/verifyMatchFollowingConsistency.js
// ═══════════════════════════════════════════════════════════════
//  VERIFY COMPLETE QUESTION-OPTIONS CONSISTENCY
//  RUN: node server/scripts/verifyMatchFollowingConsistency.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MATCH_FOLLOWING CONSISTENCY VERIFICATION');
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
    console.log('🔍 Scanning all match_following questions...');
    const questions = await Question.find({ questionType: 'match_following' });
    
    console.log(`📊 Total questions: ${questions.length}\n`);
    
    const stats = {
      total: questions.length,
      listA_clean: 0,
      listB_clean: 0,
      options_numeric: 0,
      fully_consistent: 0,
      issues: {
        listA_with_prefix: [],
        listB_with_roman: [],
        options_with_roman: [],
      }
    };
    
    // ═══════════════════════════════════════════════════════════════
    //  VERIFICATION PATTERNS
    // ═══════════════════════════════════════════════════════════════
    
    const LISTITEM_PATTERN = /^[A-Z0-9\(\)ivxlc\.]+[\.\)\s]+/i;  // A., (A), 1., (i), etc.
    const ROMAN_NUMERAL_PATTERN = /([A-Za-z0-9\(\)])-([IVX]+)/i; // A-I, B-II, etc.
    
    // ═══════════════════════════════════════════════════════════════
    //  SCAN EACH QUESTION
    // ═══════════════════════════════════════════════════════════════
    
    for (const question of questions) {
      let has_listA_issues = false;
      let has_listB_issues = false;
      let has_options_issues = false;
      
      // Check listA
      if (question.matchData?.listA?.hi?.length > 0) {
        const listA_items = [...question.matchData.listA.hi, ...(question.matchData.listA.en || [])];
        
        const issues = listA_items.filter(item => 
          item && LISTITEM_PATTERN.test(item.trim())
        );
        
        if (issues.length === 0) {
          stats.listA_clean++;
        } else {
          has_listA_issues = true;
          stats.issues.listA_with_prefix.push({
            qid: question._id,
            qnum: question.questionNumber,
            items: issues
          });
        }
      }
      
      // Check listB
      if (question.matchData?.listB?.hi?.length > 0) {
        const listB_items = [...question.matchData.listB.hi, ...(question.matchData.listB.en || [])];
        
        const roman_issues = listB_items.filter(item =>
          item && /^\([ivx]+\)[.\s]/i.test(item.trim())
        );
        
        if (roman_issues.length === 0) {
          stats.listB_clean++;
        } else {
          has_listB_issues = true;
          stats.issues.listB_with_roman.push({
            qid: question._id,
            qnum: question.questionNumber,
            items: roman_issues
          });
        }
      }
      
      // Check options
      if (question.options?.hi?.length > 0 || question.options?.en?.length > 0) {
        const option_items = [...(question.options?.hi || []), ...(question.options?.en || [])];
        
        const roman_issues = option_items.filter(opt =>
          opt && ROMAN_NUMERAL_PATTERN.test(opt)
        );
        
        if (roman_issues.length === 0) {
          stats.options_numeric++;
        } else {
          has_options_issues = true;
          stats.issues.options_with_roman.push({
            qid: question._id,
            qnum: question.questionNumber,
            items: roman_issues
          });
        }
      }
      
      // Full consistency check
      if (!has_listA_issues && !has_listB_issues && !has_options_issues) {
        stats.fully_consistent++;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    //  REPORT
    // ═══════════════════════════════════════════════════════════════
    
    console.log('═'.repeat(70));
    console.log('  CONSISTENCY VERIFICATION RESULTS');
    console.log('═'.repeat(70));
    
    console.log(`\n✅ CLEAN SECTIONS:`);
    console.log(`   listA items (clean): ${stats.listA_clean}/${stats.total}`);
    console.log(`   listB items (clean): ${stats.listB_clean}/${stats.total}`);
    console.log(`   options (numeric):   ${stats.options_numeric}/${stats.total}`);
    
    console.log(`\n✨ FULLY CONSISTENT QUESTIONS: ${stats.fully_consistent}/${stats.total} (${(stats.fully_consistent/stats.total*100).toFixed(1)}%)`);
    
    const total_issues = 
      stats.issues.listA_with_prefix.length + 
      stats.issues.listB_with_roman.length + 
      stats.issues.options_with_roman.length;
    
    console.log(`\n⚠️  REMAINING ISSUES:`);
    console.log(`   listA with prefixes: ${stats.issues.listA_with_prefix.length}`);
    console.log(`   listB with Roman:    ${stats.issues.listB_with_roman.length}`);
    console.log(`   options with Roman:  ${stats.issues.options_with_roman.length}`);
    console.log(`   Total Issues Found:  ${total_issues}`);
    
    // Show first 5 issues of each type
    if (stats.issues.listA_with_prefix.length > 0) {
      console.log(`\n❌ Sample listA Issues (first 5):`);
      stats.issues.listA_with_prefix.slice(0, 5).forEach(issue => {
        console.log(`   Q#${issue.qnum}: ${issue.items.join(', ')}`);
      });
    }
    
    if (stats.issues.listB_with_roman.length > 0) {
      console.log(`\n❌ Sample listB Issues (first 5):`);
      stats.issues.listB_with_roman.slice(0, 5).forEach(issue => {
        console.log(`   Q#${issue.qnum}: ${issue.items.join(', ')}`);
      });
    }
    
    if (stats.issues.options_with_roman.length > 0) {
      console.log(`\n❌ Sample Options Issues (first 5):`);
      stats.issues.options_with_roman.slice(0, 5).forEach(issue => {
        console.log(`   Q#${issue.qnum}: ${issue.items.join(', ')}`);
      });
    }
    
    console.log('\n' + '═'.repeat(70));
    
    if (total_issues === 0) {
      console.log('✅ PERFECT: All match_following questions are fully consistent!');
      console.log('   - listA items are clean');
      console.log('   - listB items are clean');
      console.log('   - options use numeric digits only');
      console.log('   - question-side and option-side numbering match');
    } else {
      console.log(`⚠️  Found ${total_issues} inconsistencies that need manual review`);
    }
    
    console.log('═'.repeat(70));
    
    // Close database connection
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
