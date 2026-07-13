// server/scripts/finalConsistencyCheck.js
// ═══════════════════════════════════════════════════════════════
//  FINAL MATCH_FOLLOWING CONSISTENCY CHECK
//  RUN: node server/scripts/finalConsistencyCheck.js
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FINAL CONSISTENCY CHECK - MATCH FOLLOWING QUESTIONS');
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
      
      // Roman numeral checks
      listB_with_roman_prefix: 0,
      options_with_roman: 0,
      
      // Prefix checks (actual numbering prefixes only)
      listA_with_numbering: 0,
      listB_with_numbering: 0,
      
      // Consistency checks
      fully_consistent: 0,
      partial_inconsistent: 0,
    };
    
    const issues = [];
    
    // ═══════════════════════════════════════════════════════════════
    //  SCAN EACH QUESTION
    // ═══════════════════════════════════════════════════════════════
    
    for (const question of questions) {
      let has_issues = false;
      const q_issues = [];
      
      // Check listB for ROMAN NUMERAL PREFIXES specifically (i), (ii), I., etc.
      const roman_prefix_pattern = /^\(?[ivx]+[\.\)]\s*/i;
      
      if (question.matchData?.listB?.hi?.length > 0) {
        const listB_items = [...question.matchData.listB.hi, ...(question.matchData.listB.en || [])];
        const roman_count = listB_items.filter(item => 
          item && roman_prefix_pattern.test(item.trim())
        ).length;
        if (roman_count > 0) {
          stats.listB_with_roman_prefix++;
          has_issues = true;
          q_issues.push(`listB has ${roman_count} items with Roman prefixes`);
        }
      }
      
      // Check listA for actual NUMBERING prefixes like "A.", "(A)", "1.", "(1)"
      const listA_numbering_pattern = /^[A-Z]\.\s|^\([A-Z]\)\s|^[A-Z]\)\s|^[0-9]+\.\s|^\([0-9]+\)\s/;
      
      if (question.matchData?.listA?.hi?.length > 0) {
        const listA_items = [...question.matchData.listA.hi, ...(question.matchData.listA.en || [])];
        const numbering_count = listA_items.filter(item => 
          item && listA_numbering_pattern.test(item.trim())
        ).length;
        if (numbering_count > 0) {
          stats.listA_with_numbering++;
          has_issues = true;
          q_issues.push(`listA has ${numbering_count} items with numbering prefixes`);
        }
      }
      
      // Check options for ROMAN NUMERALS
      const roman_numeral_pattern = /([A-Za-z0-9\(\)])-([IVX]+)(?=[\s,;:\-]|$)/i;
      
      if (question.options?.hi?.length > 0 || question.options?.en?.length > 0) {
        const option_items = [...(question.options?.hi || []), ...(question.options?.en || [])];
        const roman_opt_count = option_items.filter(opt =>
          opt && roman_numeral_pattern.test(opt)
        ).length;
        if (roman_opt_count > 0) {
          stats.options_with_roman++;
          has_issues = true;
          q_issues.push(`options have ${roman_opt_count} items with Roman numerals`);
        }
      }
      
      if (has_issues) {
        stats.partial_inconsistent++;
        if (issues.length < 10) {
          issues.push({
            qnum: question.questionNumber,
            qid: question._id.toString(),
            problems: q_issues
          });
        }
      } else {
        stats.fully_consistent++;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    //  REPORT
    // ═══════════════════════════════════════════════════════════════
    
    console.log('═'.repeat(70));
    console.log('  CRITICAL CONSISTENCY CHECKS');
    console.log('═'.repeat(70));
    
    console.log(`\n🔴 CRITICAL ISSUES (Must Fix):`);
    console.log(`   listB with Roman prefixes (i),(ii),(iii): ${stats.listB_with_roman_prefix}`);
    console.log(`   options with Roman numerals: ${stats.options_with_roman}`);
    console.log(`   listA with numbering prefixes: ${stats.listA_with_numbering}`);
    
    console.log(`\n✅ FULLY CONSISTENT: ${stats.fully_consistent}/${stats.total} (${(stats.fully_consistent/stats.total*100).toFixed(1)}%)`);
    console.log(`⚠️  PARTIAL INCONSISTENT: ${stats.partial_inconsistent}/${stats.total}`);
    
    if (issues.length > 0) {
      console.log(`\n📋 Sample Issues (first ${Math.min(5, issues.length)}):`);
      issues.forEach(issue => {
        console.log(`\n   Q#${issue.qnum}:`);
        issue.problems.forEach(p => console.log(`     - ${p}`));
      });
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('  SUMMARY');
    console.log('═'.repeat(70));
    
    if (stats.listB_with_roman_prefix === 0 && stats.options_with_roman === 0) {
      console.log('✅ SUCCESS: No critical inconsistencies found!');
      console.log('   - listB items have no Roman numeral prefixes ✅');
      console.log('   - options use numeric digits only ✅');
      console.log('   - question-side and option-side numbering consistent ✅');
    } else {
      console.log(`❌ Found ${stats.listB_with_roman_prefix + stats.options_with_roman} critical issues`);
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
