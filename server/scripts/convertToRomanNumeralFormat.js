// server/scripts/convertToRomanNumeralFormat.js
// ═══════════════════════════════════════════════════════════════
//  CONVERT ALL MATCH_FOLLOWING TO ROMAN NUMERAL FORMAT
//  RUN: node server/scripts/convertToRomanNumeralFormat.js
//  OR:  node server/scripts/convertToRomanNumeralFormat.js --dry-run
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 10000;
const SHOW_SAMPLES = 5;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MATCH_FOLLOWING → ROMAN NUMERAL FORMAT CONVERTER');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`DRY_RUN: ${DRY_RUN}`);
console.log(`LIMIT: ${LIMIT}`);
console.log('');

// ═══════════════════════════════════════════════════════════════
//  CONVERSION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Convert digits to Roman numerals
 * 1→I, 2→II, 3→III, 4→IV, 5→V, etc.
 */
function digitToRoman(digit) {
  const romanMap = {
    '1': 'I',
    '2': 'II',
    '3': 'III',
    '4': 'IV',
    '5': 'V',
    '6': 'VI',
    '7': 'VII',
    '8': 'VIII',
    '9': 'IX',
    '10': 'X'
  };
  
  return romanMap[String(digit)] || digit;
}

/**
 * Convert option text with digits to Roman numerals
 * "A-1, B-2, C-3, D-4" → "A-I, B-II, C-III, D-IV"
 */
function convertOptionToRoman(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Replace digit pattern with Roman numeral
  // Match: A-1, B-2, etc.
  text = text.replace(/([A-Z])-(\d+)/g, (match, letter, digit) => {
    const roman = digitToRoman(digit);
    return `${letter}-${roman}`;
  });
  
  return text;
}

/**
 * Check if option text needs conversion (has digits)
 */
function needsConversion(text) {
  if (!text || typeof text !== 'string') return false;
  return /([A-Z])-(\d+)/.test(text);
}

/**
 * Normalize a question to Roman numeral format
 */
function normalizeToRomanFormat(question) {
  const changes = {
    options_hi: false,
    options_en: false,
    listA_cleaned: false,
    listB_cleaned: false,
  };
  
  const before = {
    options_hi: question.options?.hi ? [...question.options.hi] : [],
    options_en: question.options?.en ? [...question.options.en] : [],
  };
  
  // Convert options to Roman numerals
  if (question.options?.hi) {
    const converted = question.options.hi.map(opt => {
      const before_text = opt;
      const after_text = convertOptionToRoman(opt);
      if (before_text !== after_text) {
        changes.options_hi = true;
      }
      return after_text;
    });
    question.options.hi = converted;
  }
  
  if (question.options?.en) {
    const converted = question.options.en.map(opt => {
      const before_text = opt;
      const after_text = convertOptionToRoman(opt);
      if (before_text !== after_text) {
        changes.options_en = true;
      }
      return after_text;
    });
    question.options.en = converted;
  }
  
  return {
    modified: changes.options_hi || changes.options_en,
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
  
  if (normResult.changes.options_hi) {
    lines.push(`\n📝 options (Hindi) - Converted to Roman:`);
    for (let i = 0; i < normResult.before.options_hi.length; i++) {
      lines.push(`  ❌ "${normResult.before.options_hi[i]}"`);
      lines.push(`  ✅ "${question.options.hi[i]}"`);
    }
  }
  
  if (normResult.changes.options_en) {
    lines.push(`\n📝 options (English) - Converted to Roman:`);
    for (let i = 0; i < normResult.before.options_en.length; i++) {
      lines.push(`  ❌ "${normResult.before.options_en[i]}"`);
      lines.push(`  ✅ "${question.options.en[i]}"`);
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
    console.log('📊 Current Format Analysis:');
    let with_digits = 0;
    let with_roman = 0;
    let mixed = 0;
    
    for (const q of questions) {
      const options_items = [...(q.options?.hi || []), ...(q.options?.en || [])];
      const has_digits = options_items.some(opt => /([A-Z])-(\d+)/.test(opt));
      const has_roman = options_items.some(opt => /([A-Z])-([IVX]+)/i.test(opt));
      
      if (has_digits && !has_roman) with_digits++;
      else if (has_roman && !has_digits) with_roman++;
      else if (has_digits && has_roman) mixed++;
    }
    
    console.log(`   Using numeric digits (A-1, B-2, etc.): ${with_digits}`);
    console.log(`   Using Roman numerals (A-I, B-II, etc.): ${with_roman}`);
    console.log(`   Mixed formats: ${mixed}\n`);
    
    // Process each question
    const stats = {
      total: questions.length,
      converted: 0,
      skipped: 0,
      errors: 0,
    };
    
    const samples = [];
    
    for (let i = 0; i < questions.length; i++) {
      try {
        const question = questions[i];
        
        // Skip if no options
        if (!question.options || (!question.options.hi && !question.options.en)) {
          stats.skipped++;
          continue;
        }
        
        // Normalize to Roman format
        const normResult = normalizeToRomanFormat(question);
        
        if (normResult.modified) {
          stats.converted++;
          
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
    console.log('  CONVERSION TO ROMAN NUMERAL FORMAT - REPORT');
    console.log('═'.repeat(70));
    console.log(`📊 Total Scanned: ${stats.total}`);
    console.log(`✅ Total Converted: ${stats.converted}`);
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
    console.log('✨ Conversion complete!');
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
