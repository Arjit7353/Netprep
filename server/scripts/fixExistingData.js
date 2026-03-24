// server/scripts/fixExistingData.js
// ═══════════════════════════════════════════════════════════════
//  RUN: node server/scripts/fixExistingData.js
//  OR:  node server/scripts/fixExistingData.js --dry-run
//  OR:  node server/scripts/fixExistingData.js --questions-only
//  OR:  node server/scripts/fixExistingData.js --pyq-only
//  OR:  node server/scripts/fixExistingData.js --limit=500
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════
//  PARSE CLI ARGS
// ═══════════════════════════════════════════════════
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const QUESTIONS_ONLY = args.includes('--questions-only');
const PYQ_ONLY = args.includes('--pyq-only');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 5000;

const HINDI_RE = /[\u0900-\u097F]/;
const ENGLISH_RE = /[A-Za-z]/;

// ═══════════════════════════════════════════════════
//  ALL FIX PATTERNS
// ═══════════════════════════════════════════════════

const STUCK_PATTERNS = [
  // Hindi+UPPERCASE+Hindi: सेINCORRECTलेखक → से INCORRECT लेखक
  { re: /([\u0900-\u097F\u0964\u0965])([A-Z]{2,})([\u0900-\u097F])/g, fix: '$1 $2 $3' },
  // UPPERCASE+Hindi: NOTकौन → NOT कौन
  { re: /([A-Z]{2,})([\u0900-\u097F])/g, fix: '$1 $2' },
  // Hindi+UPPERCASE: कौनNOT → कौन NOT
  { re: /([\u0900-\u097F])([A-Z]{2,})/g, fix: '$1 $2' },
  // Hindi+lowercase(3+)+Hindi: सेtheलेखक → से the लेखक
  { re: /([\u0900-\u097F])([a-z]{3,})([\u0900-\u097F])/g, fix: '$1 $2 $3' },
  // word(number)word: खानवा(1527)की → खानवा (1527) की
  { re: /([\u0900-\u097F\w])\((\d+)\)([\u0900-\u097F\w])/g, fix: '$1 ($2) $3' },
  // Hindi(number): खानवा(1527) → खानवा (1527)
  { re: /([\u0900-\u097F])\((\d{3,})\)/g, fix: '$1 ($2)' },
  // (number)Hindi: (1527)की → (1527) की
  { re: /\((\d{3,})\)([\u0900-\u097F])/g, fix: '($1) $2' },
  // number+era: 1527ई. → 1527 ई.
  { re: /(\d)(ई\.?\s*पू\.?|ई\.?|ईसवी|ईस्वी)/g, fix: '$1 $2' },
  // era+number: ई.1527 → ई. 1527
  { re: /(ई\.?\s*पू\.?|ई\.?)(\d)/g, fix: '$1 $2' },
  // danda+English: है।The → है। The
  { re: /([\u0964\u0965])([A-Za-z])/g, fix: '$1 $2' },
  // English+danda: English।Hindi
  { re: /([A-Za-z])([\u0964\u0965])/g, fix: '$1 $2' },
];

// Common exam keywords that get stuck to Hindi
const KEYWORDS = [
  'NOT','INCORRECT','CORRECT','TRUE','FALSE','WRONG','RIGHT',
  'WHICH','FOLLOWING','GIVEN','BELOW','ABOVE','MOST','LEAST',
  'BEST','ONLY','ALL','NONE','BOTH','EITHER','NEITHER','EXCEPT',
  'OTHER','THAN','AND','OR','THE','OF','IN','BY','TO','FOR',
  'FROM','WITH','AT','ON','IS','ARE','WAS','WERE','HAS','HAVE',
  'HAD','THIS','THAT','THESE','THOSE','ALSO','BUT','VERY',
  'AD','BC','CE','BCE',
];

const KEYWORD_PATTERNS = [];
for (const kw of KEYWORDS) {
  KEYWORD_PATTERNS.push({
    re: new RegExp(`([\\u0900-\\u097F])(${kw})([\\u0900-\\u097F])`, 'gi'),
    fix: '$1 $2 $3'
  });
  KEYWORD_PATTERNS.push({
    re: new RegExp(`([\\u0900-\\u097F])(${kw})(?=\\s|$|[.,;:!?)])`, 'gi'),
    fix: '$1 $2'
  });
  KEYWORD_PATTERNS.push({
    re: new RegExp(`(?:^|(?<=\\s|[.,;:!?(]))(${kw})([\\u0900-\\u097F])`, 'gi'),
    fix: '$1 $2'
  });
}

const SPACING_PATTERNS = [
  // )word → ) word
  { re: /\)([A-Za-z\u0900-\u097F])/g, fix: ') $1' },
  // word( → word (  (but NOT for common Hindi like का(, से( etc)
  { re: /([A-Za-z\u0900-\u097F])\((?=\d)/g, fix: '$1 (' },
  // Hindi+Capital: हैThe → है The
  { re: /([\u0900-\u097F])([A-Z])/g, fix: '$1 $2' },
  // lowercase+Hindi: theहै → the है
  { re: /([a-z])([\u0900-\u097F])/g, fix: '$1 $2' },
  // Capital+Hindi: Aहै → A है
  { re: /([A-Z])([\u0900-\u097F])/g, fix: '$1 $2' },
  // number+Hindi: 1527में → 1527 में (but careful with short numbers)
  { re: /(\d{3,})([\u0900-\u097F])/g, fix: '$1 $2' },
  // Hindi+number(3+digits): में1527 → में 1527
  { re: /([\u0900-\u097F])(\d{3,})/g, fix: '$1 $2' },
  // sentence boundary: .Word or ।Word
  { re: /([।.!?])([A-Z\u0900-\u097F])/g, fix: '$1 $2' },
  // comma: ,word → , word (only if not number,number)
  { re: /,([A-Za-z\u0900-\u097F])/g, fix: ', $1' },
  // colon: :word → : word
  { re: /:([A-Za-z\u0900-\u097F])/g, fix: ': $1' },
  // semicolon
  { re: /;([A-Za-z\u0900-\u097F])/g, fix: '; $1' },
];

const CORRUPTION_PATTERNS = [
  { re: /\(\s*ए\s*\)/g, fix: '(A)' },
  { re: /\(\s*आर\s*\)/g, fix: '(R)' },
  { re: /\(\s*बी\s*\)/g, fix: '(B)' },
  { re: /\(\s*सी\s*\)/g, fix: '(C)' },
  { re: /\(\s*डी\s*\)/g, fix: '(D)' },
  { re: /\(\s*ई\s*\)/g, fix: '(E)' },
  { re: /\(\s*आई\s*\)/g, fix: '(i)' },
  { re: /ए\s*[-–]\s*आई\b/g, fix: 'A-I' },
  { re: /बी\s*[-–]\s*आई\b/g, fix: 'B-I' },
  { re: /सी\s*[-–]\s*आई\b/g, fix: 'C-I' },
  { re: /डी\s*[-–]\s*आई\b/g, fix: 'D-I' },
  { re: /ए\s*[-–]\s*द्वितीय/g, fix: 'A-II' },
  { re: /बी\s*[-–]\s*द्वितीय/g, fix: 'B-II' },
  { re: /सी\s*[-–]\s*द्वितीय/g, fix: 'C-II' },
  { re: /डी\s*[-–]\s*द्वितीय/g, fix: 'D-II' },
  { re: /ए\s*[-–]\s*तृतीय/g, fix: 'A-III' },
  { re: /बी\s*[-–]\s*तृतीय/g, fix: 'B-III' },
  { re: /सी\s*[-–]\s*तृतीय/g, fix: 'C-III' },
  { re: /डी\s*[-–]\s*तृतीय/g, fix: 'D-III' },
  { re: /ए\s*[-–]\s*चतुर्थ/g, fix: 'A-IV' },
  { re: /बी\s*[-–]\s*चतुर्थ/g, fix: 'B-IV' },
  { re: /सी\s*[-–]\s*चतुर्थ/g, fix: 'C-IV' },
  { re: /डी\s*[-–]\s*चतुर्थ/g, fix: 'D-IV' },
  { re: /कथन\s+आई\b/g, fix: 'कथन I' },
  { re: /कथन\s+द्वितीय\b/g, fix: 'कथन II' },
  { re: /कथन\s+तृतीय\b/g, fix: 'कथन III' },
  { re: /स्टेटमेंट\s+आई\b/g, fix: 'Statement I' },
  { re: /स्टेटमेंट\s+द्वितीय\b/g, fix: 'Statement II' },
  { re: /अभिकथन\s*\(\s*ए\s*\)/g, fix: 'अभिकथन (A)' },
  { re: /कारण\s*\(\s*आर\s*\)/g, fix: 'कारण (R)' },
  { re: /सूची\s*[-–]?\s*आई\b/g, fix: 'सूची-I' },
  { re: /सूची\s*[-–]?\s*द्वितीय\b/g, fix: 'सूची-II' },
  { re: /\bआई\b(?=\s*[,.]|\s+और\b)/g, fix: 'I' },
];

// ═══════════════════════════════════════════════════
//  CORE FIX FUNCTION
// ═══════════════════════════════════════════════════

function fixText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return { text: text || '', changed: false, count: 0 };
  }

  let result = text;
  let count = 0;

  // Phase 1: Stuck words
  for (const p of STUCK_PATTERNS) {
    const b = result;
    result = result.replace(p.re, p.fix);
    if (result !== b) count++;
  }

  // Phase 2: Keyword stuck
  for (const p of KEYWORD_PATTERNS) {
    const b = result;
    result = result.replace(p.re, p.fix);
    if (result !== b) count++;
  }

  // Phase 3: Corruptions
  for (const p of CORRUPTION_PATTERNS) {
    const b = result;
    result = result.replace(new RegExp(p.re.source, p.re.flags), p.fix);
    if (result !== b) count++;
  }

  // Phase 4: Spacing
  for (const p of SPACING_PATTERNS) {
    const b = result;
    result = result.replace(p.re, p.fix);
    if (result !== b) count++;
  }

  // Phase 5: Multi-space cleanup
  const b5 = result;
  result = result.replace(/\s{2,}/g, ' ').trim();
  if (result !== b5) count++;

  return { text: result, changed: result !== text, count };
}

// ═══════════════════════════════════════════════════
//  FIELD SWAP CHECK
// ═══════════════════════════════════════════════════

function checkFieldSwap(obj, hiField, enField) {
  const hiVal = obj[hiField];
  const enVal = obj[enField];

  if (hiVal && typeof hiVal === 'string' && hiVal.trim() &&
      !HINDI_RE.test(hiVal) && ENGLISH_RE.test(hiVal) &&
      (!enVal || !String(enVal).trim())) {
    obj[enField] = hiVal;
    obj[hiField] = '';
    return true;
  }
  if (enVal && typeof enVal === 'string' && enVal.trim() &&
      HINDI_RE.test(enVal) &&
      (!hiVal || !String(hiVal).trim())) {
    obj[hiField] = enVal;
    obj[enField] = '';
    return true;
  }
  return false;
}

function checkArraySwap(obj, hiField, enField) {
  const hiArr = obj[hiField];
  const enArr = obj[enField];

  if (Array.isArray(hiArr) && hiArr.length > 0 &&
      (!Array.isArray(enArr) || enArr.length === 0 || enArr.every(x => !x || !String(x).trim()))) {
    const hasHindi = hiArr.some(i => typeof i === 'string' && HINDI_RE.test(i));
    if (!hasHindi && hiArr.some(i => typeof i === 'string' && ENGLISH_RE.test(i))) {
      obj[enField] = [...hiArr];
      obj[hiField] = [];
      return true;
    }
  }
  if (Array.isArray(enArr) && enArr.length > 0 &&
      (!Array.isArray(hiArr) || hiArr.length === 0 || hiArr.every(x => !x || !String(x).trim()))) {
    const hasHindi = enArr.some(i => typeof i === 'string' && HINDI_RE.test(i));
    if (hasHindi) {
      obj[hiField] = [...enArr];
      obj[enField] = [];
      return true;
    }
  }
  return false;
}

// ═══════════════════════════════════════════════════
//  FIX QUESTION (Question model)
// ═══════════════════════════════════════════════════

function fixQuestion(q) {
  let fixCount = 0;
  const update = {};
  let needsUpdate = false;

  // Fix bilingual text field
  const fixBilingualText = (obj, fieldName) => {
    if (!obj) return;
    let fieldChanged = false;
    for (const lang of ['hi', 'en']) {
      if (obj[lang]) {
        const r = fixText(obj[lang]);
        if (r.changed) {
          obj[lang] = r.text;
          fixCount += r.count;
          fieldChanged = true;
        }
      }
    }
    if (checkFieldSwap(obj, 'hi', 'en')) {
      fixCount++;
      fieldChanged = true;
    }
    if (fieldChanged) {
      update[fieldName] = obj;
      needsUpdate = true;
    }
  };

  // Fix bilingual array field
  const fixBilingualArray = (obj, fieldName) => {
    if (!obj) return;
    let fieldChanged = false;
    for (const lang of ['hi', 'en']) {
      if (Array.isArray(obj[lang])) {
        for (let i = 0; i < obj[lang].length; i++) {
          if (obj[lang][i]) {
            const r = fixText(obj[lang][i]);
            if (r.changed) {
              obj[lang][i] = r.text;
              fixCount += r.count;
              fieldChanged = true;
            }
          }
        }
      }
    }
    if (checkArraySwap(obj, 'hi', 'en')) {
      fixCount++;
      fieldChanged = true;
    }
    if (fieldChanged) {
      update[fieldName] = obj;
      needsUpdate = true;
    }
  };

  // Process fields
  fixBilingualText(q.question, 'question');
  fixBilingualText(q.explanation, 'explanation');
  fixBilingualArray(q.options, 'options');

  if (q.assertionReasonData) {
    let arChanged = false;
    for (const f of ['assertion', 'reason']) {
      if (q.assertionReasonData[f]) {
        for (const lang of ['hi', 'en']) {
          if (q.assertionReasonData[f][lang]) {
            const r = fixText(q.assertionReasonData[f][lang]);
            if (r.changed) {
              q.assertionReasonData[f][lang] = r.text;
              fixCount += r.count;
              arChanged = true;
            }
          }
        }
        if (checkFieldSwap(q.assertionReasonData[f], 'hi', 'en')) {
          fixCount++;
          arChanged = true;
        }
      }
    }
    if (arChanged) {
      update.assertionReasonData = q.assertionReasonData;
      needsUpdate = true;
    }
  }

  if (q.matchData) {
    let mdChanged = false;
    for (const list of ['listA', 'listB']) {
      if (q.matchData[list]) {
        for (const lang of ['hi', 'en']) {
          if (Array.isArray(q.matchData[list][lang])) {
            for (let i = 0; i < q.matchData[list][lang].length; i++) {
              if (q.matchData[list][lang][i]) {
                const r = fixText(q.matchData[list][lang][i]);
                if (r.changed) {
                  q.matchData[list][lang][i] = r.text;
                  fixCount += r.count;
                  mdChanged = true;
                }
              }
            }
          }
        }
        if (checkArraySwap(q.matchData[list], 'hi', 'en')) {
          fixCount++;
          mdChanged = true;
        }
      }
    }
    if (mdChanged) {
      update.matchData = q.matchData;
      needsUpdate = true;
    }
  }

  if (q.sequenceData?.items) {
    let seqChanged = false;
    for (const lang of ['hi', 'en']) {
      if (Array.isArray(q.sequenceData.items[lang])) {
        for (let i = 0; i < q.sequenceData.items[lang].length; i++) {
          if (q.sequenceData.items[lang][i]) {
            const r = fixText(q.sequenceData.items[lang][i]);
            if (r.changed) {
              q.sequenceData.items[lang][i] = r.text;
              fixCount += r.count;
              seqChanged = true;
            }
          }
        }
      }
    }
    if (checkArraySwap(q.sequenceData.items, 'hi', 'en')) {
      fixCount++;
      seqChanged = true;
    }
    if (seqChanged) {
      update.sequenceData = q.sequenceData;
      needsUpdate = true;
    }
  }

  if (q.statementData?.statements) {
    let stmtChanged = false;
    for (const lang of ['hi', 'en']) {
      if (Array.isArray(q.statementData.statements[lang])) {
        for (let i = 0; i < q.statementData.statements[lang].length; i++) {
          if (q.statementData.statements[lang][i]) {
            const r = fixText(q.statementData.statements[lang][i]);
            if (r.changed) {
              q.statementData.statements[lang][i] = r.text;
              fixCount += r.count;
              stmtChanged = true;
            }
          }
        }
      }
    }
    if (checkArraySwap(q.statementData.statements, 'hi', 'en')) {
      fixCount++;
      stmtChanged = true;
    }
    if (stmtChanged) {
      update.statementData = q.statementData;
      needsUpdate = true;
    }
  }

  return { fixCount, update, needsUpdate };
}

// ═══════════════════════════════════════════════════
//  FIX PYQ QUESTION (questionTopicMap format)
// ═══════════════════════════════════════════════════

function fixPYQQuestion(q) {
  let fixCount = 0;

  const textFields = [
    'questionText', 'questionTextHi', 'questionTextEn',
    'explanation', 'explanationHi', 'explanationEn',
    'assertion', 'assertionHi', 'assertionEn',
    'reason', 'reasonHi', 'reasonEn',
    'passage', 'passageHi', 'passageEn',
    'caseletText', 'caseletTextHi', 'caseletTextEn',
    'diTitle', 'diTitleHi', 'diTitleEn',
    'instruction', 'instructionHi'
  ];

  for (const f of textFields) {
    if (q[f] && typeof q[f] === 'string' && q[f].trim()) {
      const r = fixText(q[f]);
      if (r.changed) { q[f] = r.text; fixCount += r.count; }
    }
  }

  const arrayFields = [
    'options', 'optionsHi', 'optionsEn',
    'statements', 'statementsHi', 'statementsEn',
    'listA', 'listAHi', 'listAEn',
    'listB', 'listBHi', 'listBEn',
    'items', 'itemsHi', 'itemsEn'
  ];

  for (const f of arrayFields) {
    if (Array.isArray(q[f])) {
      for (let i = 0; i < q[f].length; i++) {
        if (q[f][i] && typeof q[f][i] === 'string') {
          const r = fixText(q[f][i]);
          if (r.changed) { q[f][i] = r.text; fixCount += r.count; }
        }
      }
    }
  }

  const textPairs = [
    ['questionTextHi','questionTextEn'], ['explanationHi','explanationEn'],
    ['assertionHi','assertionEn'], ['reasonHi','reasonEn'],
    ['passageHi','passageEn'], ['caseletTextHi','caseletTextEn'],
    ['diTitleHi','diTitleEn']
  ];
  for (const [hi, en] of textPairs) {
    if (checkFieldSwap(q, hi, en)) fixCount++;
  }

  const arrayPairs = [
    ['optionsHi','optionsEn'], ['statementsHi','statementsEn'],
    ['listAHi','listAEn'], ['listBHi','listBEn'], ['itemsHi','itemsEn']
  ];
  for (const [hi, en] of arrayPairs) {
    if (checkArraySwap(q, hi, en)) fixCount++;
  }

  if (Array.isArray(q.subQuestions)) {
    for (const sq of q.subQuestions) {
      for (const f of ['questionText','questionTextHi','questionTextEn','explanation','explanationHi','explanationEn']) {
        if (sq[f] && typeof sq[f] === 'string') {
          const r = fixText(sq[f]);
          if (r.changed) { sq[f] = r.text; fixCount += r.count; }
        }
      }
      for (const f of ['options','optionsHi','optionsEn']) {
        if (Array.isArray(sq[f])) {
          for (let i = 0; i < sq[f].length; i++) {
            if (sq[f][i] && typeof sq[f][i] === 'string') {
              const r = fixText(sq[f][i]);
              if (r.changed) { sq[f][i] = r.text; fixCount += r.count; }
            }
          }
        }
      }
      checkFieldSwap(sq, 'questionTextHi', 'questionTextEn');
      checkFieldSwap(sq, 'explanationHi', 'explanationEn');
      checkArraySwap(sq, 'optionsHi', 'optionsEn');
    }
  }

  return fixCount;
}

// ═══════════════════════════════════════════════════
//  MAIN EXECUTION
// ═══════════════════════════════════════════════════

async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/netprep';

  console.log('\n' + '═'.repeat(65));
  console.log('  EXISTING DATA FIXER — Translation & Spacing Issues');
  console.log('  Mode: ' + (DRY_RUN ? '🔍 DRY RUN (no changes saved)' : '🔧 EXECUTE (will save changes)'));
  console.log('  Limit: ' + LIMIT);
  console.log('═'.repeat(65) + '\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Load models
  require('../models/Question');
  require('../models/PYQAnalysis');
  // Load Counter model if exists
  try { require('../models/Counter'); } catch (e) {}

  const Question = mongoose.model('Question');
  const PYQAnalysis = mongoose.model('PYQAnalysis');

  const totalStats = {
    questionsChecked: 0, questionsFixed: 0, questionFixCount: 0,
    pyqChecked: 0, pyqFixed: 0, pyqFixCount: 0,
    errors: 0
  };

  // ═══════════════════════════════════════════════════
  //  PHASE 1: Fix Question collection
  // ═══════════════════════════════════════════════════
  if (!PYQ_ONLY) {
    console.log('━'.repeat(50));
    console.log('📋 PHASE 1: Fixing Question collection...');
    console.log('━'.repeat(50));

    const questions = await Question.find({ isActive: { $ne: false } }).limit(LIMIT).lean();
    console.log(`   Found ${questions.length} questions to scan\n`);

    let batchCount = 0;
    const bulkOps = [];

    for (const q of questions) {
      totalStats.questionsChecked++;
      const qCopy = JSON.parse(JSON.stringify(q));
      const result = fixQuestion(qCopy);

      if (result.needsUpdate && result.fixCount > 0) {
        totalStats.questionsFixed++;
        totalStats.questionFixCount += result.fixCount;

        if (!DRY_RUN) {
          result.update.updatedAt = new Date();
          bulkOps.push({
            updateOne: {
              filter: { _id: q._id },
              update: { $set: result.update }
            }
          });
        }

        batchCount++;
        if (batchCount <= 20) {
          console.log(`   ✏️  Q${q.questionNumber} (${q.questionType}) — ${result.fixCount} fixes`);
        }
      }
    }

    if (batchCount > 20) {
      console.log(`   ... and ${batchCount - 20} more questions`);
    }

    // Execute bulk write
    if (!DRY_RUN && bulkOps.length > 0) {
      try {
        const bulkResult = await Question.bulkWrite(bulkOps, { ordered: false });
        console.log(`\n   💾 Saved: ${bulkResult.modifiedCount} questions updated`);
      } catch (err) {
        console.error('   ❌ Bulk write error:', err.message);
        totalStats.errors++;
      }
    }

    console.log(`\n   📊 Questions: ${totalStats.questionsFixed}/${totalStats.questionsChecked} fixed (${totalStats.questionFixCount} total fixes)\n`);
  }

  // ═══════════════════════════════════════════════════
  //  PHASE 2: Fix PYQAnalysis collection
  // ═══════════════════════════════════════════════════
  if (!QUESTIONS_ONLY) {
    console.log('━'.repeat(50));
    console.log('📋 PHASE 2: Fixing PYQAnalysis collection...');
    console.log('━'.repeat(50));

    const analyses = await PYQAnalysis.find({ isActive: true }).limit(Math.min(LIMIT, 200));
    console.log(`   Found ${analyses.length} PYQ analyses to scan\n`);

    for (const analysis of analyses) {
      totalStats.pyqChecked++;

      if (!Array.isArray(analysis.questionTopicMap) || analysis.questionTopicMap.length === 0) continue;

      let analysisFixCount = 0;

      for (let qi = 0; qi < analysis.questionTopicMap.length; qi++) {
        const q = analysis.questionTopicMap[qi];
        const qObj = q.toObject ? q.toObject() : JSON.parse(JSON.stringify(q));
        const fc = fixPYQQuestion(qObj);

        if (fc > 0) {
          analysisFixCount += fc;

          if (!DRY_RUN) {
            // Apply fixed values back
            for (const key of Object.keys(qObj)) {
              if (key !== '_id') {
                analysis.questionTopicMap[qi][key] = qObj[key];
              }
            }
          }
        }
      }

      if (analysisFixCount > 0) {
        totalStats.pyqFixed++;
        totalStats.pyqFixCount += analysisFixCount;
        console.log(`   ✏️  ${analysis.displayLabel} — ${analysisFixCount} fixes across ${analysis.questionTopicMap.length} questions`);

        if (!DRY_RUN) {
          try {
            analysis.markModified('questionTopicMap');
            await analysis.save();
            console.log(`      💾 Saved`);
          } catch (err) {
            console.error(`      ❌ Save error: ${err.message}`);
            totalStats.errors++;
          }
        }
      }
    }

    console.log(`\n   📊 PYQ Analyses: ${totalStats.pyqFixed}/${totalStats.pyqChecked} fixed (${totalStats.pyqFixCount} total fixes)\n`);
  }

  // ═══════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════
  console.log('═'.repeat(65));
  console.log('  FINAL SUMMARY');
  console.log('═'.repeat(65));
  console.log(`  Mode:             ${DRY_RUN ? '🔍 DRY RUN' : '🔧 EXECUTED'}`);
  console.log(`  Questions:        ${totalStats.questionsFixed}/${totalStats.questionsChecked} fixed (${totalStats.questionFixCount} changes)`);
  console.log(`  PYQ Analyses:     ${totalStats.pyqFixed}/${totalStats.pyqChecked} fixed (${totalStats.pyqFixCount} changes)`);
  console.log(`  Errors:           ${totalStats.errors}`);
  console.log(`  Total fixes:      ${totalStats.questionFixCount + totalStats.pyqFixCount}`);
  if (DRY_RUN) {
    console.log(`\n  💡 Run without --dry-run to apply changes:`);
    console.log(`     node server/scripts/fixExistingData.js`);
  }
  console.log('═'.repeat(65) + '\n');

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});