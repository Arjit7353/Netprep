// server/scripts/normalizeMatchFollowing.js
// ═══════════════════════════════════════════════════════════════
//  BULK NORMALIZATION OF MATCH_FOLLOWING QUESTIONS
//  RUN: node server/scripts/normalizeMatchFollowing.js
//  OR:  node server/scripts/normalizeMatchFollowing.js --dry-run
//  OR:  node server/scripts/normalizeMatchFollowing.js --limit=100
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');

// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DRY_RUN = process.argv.includes('--dry-run');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 10000;
const SHOW_SAMPLES = 5; // Number of before/after samples to show

console.log('═══════════════════════════════════════════════════════════════');
console.log('  MATCH_FOLLOWING QUESTION NORMALIZER');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`DRY_RUN: ${DRY_RUN}`);
console.log(`LIMIT: ${LIMIT}`);
console.log('');

// ═══════════════════════════════════════════════════════════════
//  NORMALIZATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Remove numbering prefixes from list items (intelligently)
 * Examples:
 * - "A. नेय्यल" → "नेय्यल" (Hindi after prefix)
 * - "(i) वन" → "वन" (Roman in Hindi)
 * - "1. सूखा क्षेत्र" → "सूखा क्षेत्र" (Number prefix)
 * 
 * BUT preserve names:
 * - "A. Bailey" → "A. Bailey" (Not cleaned - proper noun)
 * - "J. Marshall" → "J. Marshall" (Not cleaned - proper noun)
 * - "R. K. Pringle" → "R. K. Pringle" (Not cleaned - proper noun)
 */
function cleanListItem(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Remove leading whitespace
  text = text.trimStart();
  
  // Smart patterns - only match if followed by non-Latin or specific markers
  
  // Pattern 1: Letter/Number followed by period, then lowercase/Hindi/diacritic
  // "A. नेय्यल" → "नेय्यल"
  // "1. सूखा" → "सूखा"
  const pattern1 = /^([A-Z0-9])\.\s+([^\s])/;
  if (pattern1.test(text)) {
    const match = text.match(pattern1);
    const nextChar = match[2];
    // Check if next char is NOT uppercase Latin (indicates it's not a name)
    if (!/^[A-Z]/.test(nextChar) || /[\u0900-\u097F]/.test(nextChar)) {
      text = text.replace(/^[A-Z0-9]\.\s+/, '');
      return text;
    }
  }
  
  // Pattern 2: Parenthesized single letter/number (definitely list numbering)
  // "(A) text" → "text"
  // "(1) text" → "text"
  const pattern2 = /^[(][A-Z0-9][)]\s*/;
  if (pattern2.test(text)) {
    text = text.replace(pattern2, '');
    return text;
  }
  
  // Pattern 3: Letter followed by closing paren (definitely list numbering)
  // "A) text" → "text"
  const pattern3 = /^[A-Z][)]\s*/;
  if (pattern3.test(text)) {
    text = text.replace(pattern3, '');
    return text;
  }
  
  // Pattern 4: Roman numerals in parens (definitely list numbering)
  // "(i) text" → "text"
  // "(iv) text" → "text"
  const pattern4 = /^[(][ivxlc]+[)]\s*/i;
  if (pattern4.test(text)) {
    text = text.replace(pattern4, '');
    return text;
  }
  
  // Pattern 5: Roman numerals with period (definitely list numbering)
  // "I. text" → "text"
  // "IV. text" → "text"
  const pattern5 = /^[IVX]+\.\s+/;
  if (pattern5.test(text)) {
    text = text.replace(pattern5, '');
    return text;
  }
  
  return text;
}

/**
 * Convert Roman numerals to decimal digits
 * Maps: I→1, II→2, III→3, IV→4, V→5, VI→6, VII→7, VIII→8, IX→9, X→10
 */
function convertRomanToDigit(roman) {
  const romanMap = {
    'I': '1',
    'II': '2',
    'III': '3',
    'IV': '4',
    'V': '5',
    'VI': '6',
    'VII': '7',
    'VIII': '8',
    'IX': '9',
    'X': '10'
  };
  
  return romanMap[roman.toUpperCase()] || roman;
}

/**
 * Normalize Roman numerals in option text
 * Examples:
 * - "A-I, B-II, C-III, D-IV" → "A-1, B-2, C-3, D-4"
 * - "A-I" → "A-1"
 * - "1-I" → "1-1"
 */
function normalizeOptionText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Match patterns like "X-I", "A-IV", "1-III", etc.
  // where X can be letter, number, or parenthesized
  // followed by hyphen and Roman numeral
  
  text = text.replace(/([A-Za-z0-9\(\)])-([IVX]+)(?=[\s,;:\-]|$)/gi, (match, prefix, roman) => {
    const digit = convertRomanToDigit(roman);
    return `${prefix}-${digit}`;
  });
  
  return text;
}

/**
 * Check if list item needs cleaning
 */
function needsListCleaning(text) {
  if (!text || typeof text !== 'string') return false;
  
  const patterns = [
    /^[A-Z]\.\s+/,
    /^[(][A-Z][)]\s*/,
    /^[A-Z][)]\s*/,
    /^[0-9]+\.\s+/,
    /^[(][0-9]+[)]\s*/,
    /^[(][ivxlc]+[)]\s*/i,
    /^[IVX]+\.\s+/,
  ];
  
  return patterns.some(p => p.test(text.trimStart()));
}

/**
 * Check if option text needs Roman numeral normalization
 */
function needsOptionNormalization(text) {
  if (!text || typeof text !== 'string') return false;
  return /([A-Za-z0-9\(\)])-([IVX]+)/i.test(text);
}

/**
 * Normalize a single match_following question
 */
function normalizeQuestion(question) {
  const changes = {
    listA: false,
    listB: false,
    options: false,
  };
  
  const before = {
    listA_hi: question.matchData?.listA?.hi ? [...question.matchData.listA.hi] : [],
    listA_en: question.matchData?.listA?.en ? [...question.matchData.listA.en] : [],
    listB_hi: question.matchData?.listB?.hi ? [...question.matchData.listB.hi] : [],
    listB_en: question.matchData?.listB?.en ? [...question.matchData.listB.en] : [],
    options_hi: question.options?.hi ? [...question.options.hi] : [],
    options_en: question.options?.en ? [...question.options.en] : [],
  };
  
  // Clean listA
  if (question.matchData?.listA?.hi) {
    const cleaned = question.matchData.listA.hi.map(item => {
      const itemBefore = item;
      const itemAfter = cleanListItem(item);
      if (itemBefore !== itemAfter) {
        changes.listA = true;
      }
      return itemAfter;
    });
    question.matchData.listA.hi = cleaned;
  }
  
  if (question.matchData?.listA?.en) {
    const cleaned = question.matchData.listA.en.map(item => {
      const itemBefore = item;
      const itemAfter = cleanListItem(item);
      if (itemBefore !== itemAfter) {
        changes.listA = true;
      }
      return itemAfter;
    });
    question.matchData.listA.en = cleaned;
  }
  
  // Clean listB
  if (question.matchData?.listB?.hi) {
    const cleaned = question.matchData.listB.hi.map(item => {
      const itemBefore = item;
      const itemAfter = cleanListItem(item);
      if (itemBefore !== itemAfter) {
        changes.listB = true;
      }
      return itemAfter;
    });
    question.matchData.listB.hi = cleaned;
  }
  
  if (question.matchData?.listB?.en) {
    const cleaned = question.matchData.listB.en.map(item => {
      const itemBefore = item;
      const itemAfter = cleanListItem(item);
      if (itemBefore !== itemAfter) {
        changes.listB = true;
      }
      return itemAfter;
    });
    question.matchData.listB.en = cleaned;
  }
  
  // Normalize options
  if (question.options?.hi) {
    const normalized = question.options.hi.map(opt => {
      const optBefore = opt;
      const optAfter = normalizeOptionText(opt);
      if (optBefore !== optAfter) {
        changes.options = true;
      }
      return optAfter;
    });
    question.options.hi = normalized;
  }
  
  if (question.options?.en) {
    const normalized = question.options.en.map(opt => {
      const optBefore = opt;
      const optAfter = normalizeOptionText(opt);
      if (optBefore !== optAfter) {
        changes.options = true;
      }
      return optAfter;
    });
    question.options.en = normalized;
  }
  
  return {
    modified: changes.listA || changes.listB || changes.options,
    changes,
    before
  };
}

/**
 * Format before/after sample
 */
function formatSample(question, normResult) {
  const lines = [];
  lines.push(`\n📋 Question ID: ${question._id}`);
  
  if (normResult.changes.listA) {
    lines.push(`\n📝 listA (Hindi):`);
    for (let i = 0; i < normResult.before.listA_hi.length; i++) {
      lines.push(`  ❌ "${normResult.before.listA_hi[i]}"`);
      lines.push(`  ✅ "${question.matchData.listA.hi[i]}"`);
    }
  }
  
  if (normResult.changes.listB) {
    lines.push(`\n📝 listB (Hindi):`);
    for (let i = 0; i < normResult.before.listB_hi.length; i++) {
      lines.push(`  ❌ "${normResult.before.listB_hi[i]}"`);
      lines.push(`  ✅ "${question.matchData.listB.hi[i]}"`);
    }
  }
  
  if (normResult.changes.options) {
    lines.push(`\n📝 options (Hindi):`);
    for (let i = 0; i < normResult.before.options_hi.length; i++) {
      lines.push(`  ❌ "${normResult.before.options_hi[i]}"`);
      lines.push(`  ✅ "${question.options.hi[i]}"`);
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
      console.log('✨ No match_following questions found. Nothing to normalize.');
      await mongoose.connection.close();
      return;
    }
    
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
        
        // Normalize question
        const normResult = normalizeQuestion(question);
        
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
    
    console.log('\n' + '═'.repeat(60));
    console.log('  NORMALIZATION REPORT');
    console.log('═'.repeat(60));
    console.log(`📊 Total Scanned: ${stats.total}`);
    console.log(`✅ Total Fixed: ${stats.fixed}`);
    console.log(`⏭️  Total Skipped: ${stats.skipped}`);
    console.log(`❌ Total Errors: ${stats.errors}`);
    console.log(`\n📝 Mode: ${DRY_RUN ? 'DRY-RUN (no changes saved)' : 'LIVE (changes saved)'}`);
    
    if (samples.length > 0) {
      console.log('\n' + '═'.repeat(60));
      console.log('  SAMPLE BEFORE/AFTER');
      console.log('═'.repeat(60));
      console.log(samples.join('\n'));
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Normalization complete!');
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
