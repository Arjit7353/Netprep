// server/scripts/fixMatchFollowingListBRoman.js
// ═══════════════════════════════════════════════════════════════
//  FIX LISTB ROMAN NUMERALS & ENSURE QUESTION-OPTIONS CONSISTENCY
//  RUN: node server/scripts/fixMatchFollowingListBRoman.js
//  OR:  node server/scripts/fixMatchFollowingListBRoman.js --dry-run
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 10000;
const SHOW_SAMPLES = 5;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  LISTB ROMAN NUMERAL & CONSISTENCY FIX');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`DRY_RUN: ${DRY_RUN}`);
console.log(`LIMIT: ${LIMIT}`);
console.log('');

// ═══════════════════════════════════════════════════════════════
//  DETECTION & CLEANUP UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Detect if text has Roman numeral prefix like (i), (ii), (iii), etc.
 */
function hasRomanPrefix(text) {
  if (!text || typeof text !== 'string') return false;
  const patterns = [
    /^\(i+v?\)[\s\.]*/i,        // (i), (ii), (iii), (iv), (v), etc.
    /^[IVX]+[\.\)]\s*/,         // I., II., III., I), II), etc.
  ];
  return patterns.some(p => p.test(text.trim()));
}

/**
 * Remove Roman numeral prefixes from list items
 */
function removeRomanPrefix(text) {
  if (!text || typeof text !== 'string') return text;
  
  text = text.trim();
  
  // Remove (i), (ii), (iii), (iv), (v), (vi), (vii), (viii), (ix), (x)
  text = text.replace(/^\([ivx]+\)[\s\.]*/i, '');
  
  // Remove I., II., III., etc.
  text = text.replace(/^[IVX]+[\.\)]\s*/i, '');
  
  return text.trim();
}

/**
 * Check if listB needs Roman prefix cleanup
 */
function needsListBCleanup(listB) {
  if (!listB || !Array.isArray(listB)) return false;
  return listB.some(item => hasRomanPrefix(item));
}

/**
 * Check if options have Roman numerals (already checked, but verify)
 */
function hasRomanInOptions(options) {
  if (!options || !Array.isArray(options)) return false;
  const ROMAN_PATTERN = /([A-Za-z0-9\(\)])-([IVX]+)/i;
  return options.some(opt => ROMAN_PATTERN.test(opt));
}

/**
 * Normalize a match_following question for full consistency
 */
function normalizeForConsistency(question) {
  const changes = {
    listB_hi: false,
    listB_en: false,
    options_hi: false,
    options_en: false,
  };
  
  const before = {
    listB_hi: question.matchData?.listB?.hi ? [...question.matchData.listB.hi] : [],
    listB_en: question.matchData?.listB?.en ? [...question.matchData.listB.en] : [],
    options_hi: question.options?.hi ? [...question.options.hi] : [],
    options_en: question.options?.en ? [...question.options.en] : [],
  };
  
  // Clean listB Hindi - remove Roman prefixes
  if (question.matchData?.listB?.hi) {
    const cleaned = question.matchData.listB.hi.map(item => {
      const before_text = item;
      const after_text = removeRomanPrefix(item);
      if (before_text !== after_text) {
        changes.listB_hi = true;
      }
      return after_text;
    });
    question.matchData.listB.hi = cleaned;
  }
  
  // Clean listB English - remove Roman prefixes
  if (question.matchData?.listB?.en) {
    const cleaned = question.matchData.listB.en.map(item => {
      const before_text = item;
      const after_text = removeRomanPrefix(item);
      if (before_text !== after_text) {
        changes.listB_en = true;
      }
      return after_text;
    });
    question.matchData.listB.en = cleaned;
  }
  
  return {
    modified: changes.listB_hi || changes.listB_en || changes.options_hi || changes.options_en,
    changes,
    before
  };
}

/**
 * Format before/after sample
 */
function formatSample(question, normResult) {
  const lines = [];
  lines.push(`\n📋 Question ID: ${question._id} (#${question.questionNumber || 'N/A'})`);
  
  if (normResult.changes.listB_hi) {
    lines.push(`\n📝 listB (Hindi) - Removed Roman Prefixes:`);
    for (let i = 0; i < normResult.before.listB_hi.length; i++) {
      lines.push(`  ❌ "${normResult.before.listB_hi[i]}"`);
      lines.push(`  ✅ "${question.matchData.listB.hi[i]}"`);
    }
  }
  
  if (normResult.changes.listB_en) {
    lines.push(`\n📝 listB (English) - Removed Roman Prefixes:`);
    for (let i = 0; i < normResult.before.listB_en.length; i++) {
      lines.push(`  ❌ "${normResult.before.listB_en[i]}"`);
      lines.push(`  ✅ "${question.matchData.listB.en[i]}"`);
    }
  }
  
  return lines.join('\n');
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
    console.log(`🔍 Searching for match_following questions (limit: ${LIMIT})...`);
    const questions = await Question.find(
      { questionType: 'match_following' },
      null,
      { limit: LIMIT }
    );
    
    console.log(`📊 Found: ${questions.length} match_following questions\n`);
    
    if (questions.length === 0) {
      console.log('✨ No match_following questions found.');
      await mongoose.connection.close();
      return;
    }
    
    // Analyze current state
    console.log('📊 Current State Analysis:');
    let listB_with_roman = 0;
    let options_with_roman = 0;
    
    for (const q of questions) {
      const listB_items = [...(q.matchData?.listB?.hi || []), ...(q.matchData?.listB?.en || [])];
      const options_items = [...(q.options?.hi || []), ...(q.options?.en || [])];
      
      if (listB_items.some(item => hasRomanPrefix(item))) {
        listB_with_roman++;
      }
      
      const ROMAN_PATTERN = /([A-Za-z0-9\(\)])-([IVX]+)/i;
      if (options_items.some(opt => ROMAN_PATTERN.test(opt))) {
        options_with_roman++;
      }
    }
    
    console.log(`   Questions with Roman prefixes in listB: ${listB_with_roman}`);
    console.log(`   Questions with Roman numerals in options: ${options_with_roman}\n`);
    
    // Process each question
    const stats = {
      total: questions.length,
      fixed: 0,
      skipped: 0,
      errors: 0,
    };
    
    const samples = [];
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i];
        
        // Skip if no matchData
        if (!question.matchData) {
          stats.skipped++;
          continue;
        }
        
        // Normalize for consistency
        const normResult = normalizeForConsistency(question);
        
        if (normResult.modified) {
          stats.fixed++;
          
          // Collect sample
          if (samples.length < SHOW_SAMPLES) {
            samples.push(formatSample(question, normResult));
          }
          
          // Update database unless dry-run
          if (!DRY_RUN) {
            await question.save();
          }
        }
        
        // Progress indicator
        if ((i + 1) % 100 === 0) {
          console.log(`⏳ Processed: ${i + 1}/${questions.length}`);
        }
        
      } catch (err) {
        stats.errors++;
        console.error(`❌ Error processing question ${i}:`, err.message);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    //  REPORT
    // ═══════════════════════════════════════════════════════════════
    
    console.log('\n' + '═'.repeat(70));
    console.log('  LISTB ROMAN NUMERAL FIX REPORT');
    console.log('═'.repeat(70));
    console.log(`📊 Total Scanned: ${stats.total}`);
    console.log(`✅ Total Fixed: ${stats.fixed}`);
    console.log(`⏭️  Total Skipped: ${stats.skipped}`);
    console.log(`❌ Total Errors: ${stats.errors}`);
    console.log(`\n📝 Mode: ${DRY_RUN ? 'DRY-RUN (no changes saved)' : 'LIVE (changes saved)'}`);
    
    if (samples.length > 0) {
      console.log('\n' + '═'.repeat(70));
      console.log('  SAMPLE BEFORE/AFTER');
      console.log('═'.repeat(70));
      console.log(samples.join('\n'));
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('✨ Fix complete!');
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
