// server/scripts/fixCorruptedTranslations.js
// ═══════════════════════════════════════════════════════════════
// FINAL FIX SCRIPT — Correctly fixes ALL Hindi letter code corruptions
// FIXED: \b word boundary does NOT work with Devanagari in JS
//        Using lookahead/lookbehind with Unicode-aware patterns instead
//
// Usage:
//   node scripts/fixCorruptedTranslations.js --dry-run
//   node scripts/fixCorruptedTranslations.js
//   node scripts/fixCorruptedTranslations.js --verbose
// ═══════════════════════════════════════════════════════════════

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE  = args.includes('--verbose');

// ═══════════════════════════════════════════════════
//  HELPER: Devanagari-safe word boundary simulation
//  JS \b doesn't work with Unicode/Devanagari chars
//  So we use: (?<![^\s,।()।-]) before and (?![^\s,।()।-]) after
// ═══════════════════════════════════════════════════

// Characters that can surround a "word" (delimiters)
// Before a Hindi word: start of string, space, comma, (, -, –
// After a Hindi word:  end of string, space, comma, ), -, –, ।, और, एवं, तथा

const B  = '(?:^|(?<=[\\s,।()\\[\\]\\-–—]))';   // before boundary (lookbehind)
const E  = '(?=$|[\\s,।()\\[\\]\\-–—])';          // after boundary (lookahead)

/**
 * Core fix function — replaces Hindi letter codes with English
 * Uses proper Unicode-aware boundaries instead of \b
 */
function fixHindiLetterCodes(text) {
  if (!text || typeof text !== 'string') return { text: text || '', fixed: false };

  const original = text;
  let r = text;

  // ══════════════════════════════════════════════════
  // PASS 1: Match-code options with Roman numerals
  //   "ए-III" → "A-III"   "ए-आई" → "A-I"
  // ══════════════════════════════════════════════════

  // With original Roman numerals (ए-III, बी-I etc.)
  r = r.replace(/(?:^|(?<=[\s,।(]))ए(?=\s*[-–—]\s*(?:VIII|VII|VI|IV|IX|III|II|I|V|X))/g, 'A');
  r = r.replace(/(?:^|(?<=[\s,।(]))बी(?=\s*[-–—]\s*(?:VIII|VII|VI|IV|IX|III|II|I|V|X))/g, 'B');
  r = r.replace(/(?:^|(?<=[\s,।(]))सी(?=\s*[-–—]\s*(?:VIII|VII|VI|IV|IX|III|II|I|V|X))/g, 'C');
  r = r.replace(/(?:^|(?<=[\s,।(]))डी(?=\s*[-–—]\s*(?:VIII|VII|VI|IV|IX|III|II|I|V|X))/g, 'D');
  r = r.replace(/(?:^|(?<=[\s,।(]))ई(?=\s*[-–—]\s*(?:VIII|VII|VI|IV|IX|III|II|I|V|X))/g, 'E');

  // With translated Roman numerals (ए-आई → A-I, ए-द्वितीय → A-II etc.)
  const romanHi = { 'आई': 'I', 'द्वितीय': 'II', 'तृतीय': 'III', 'चतुर्थ': 'IV', 'वी': 'V', 'षष्ठ': 'VI', 'सप्तम': 'VII', 'अष्टम': 'VIII' };
  for (const [hi, en] of Object.entries(romanHi)) {
    r = r.replace(new RegExp(`ए\\s*[-–]\\s*${hi}`, 'g'), `A-${en}`);
    r = r.replace(new RegExp(`बी\\s*[-–]\\s*${hi}`, 'g'), `B-${en}`);
    r = r.replace(new RegExp(`सी\\s*[-–]\\s*${hi}`, 'g'), `C-${en}`);
    r = r.replace(new RegExp(`डी\\s*[-–]\\s*${hi}`, 'g'), `D-${en}`);
    r = r.replace(new RegExp(`ई\\s*[-–]\\s*${hi}`, 'g'), `E-${en}`);
  }

  // ══════════════════════════════════════════════════
  // PASS 2: Parenthesized labels — (ए) → (A) etc.
  //   These are unambiguous — always safe to replace
  // ══════════════════════════════════════════════════

  r = r.replace(/\(\s*ए\s*\)/g, '(A)');
  r = r.replace(/\(\s*बी\s*\)/g, '(B)');
  r = r.replace(/\(\s*सी\s*\)/g, '(C)');
  r = r.replace(/\(\s*डी\s*\)/g, '(D)');
  r = r.replace(/\(\s*ई\s*\)/g, '(E)');
  r = r.replace(/\(\s*आर\s*\)/g, '(R)');
  r = r.replace(/\(\s*आई\s*\)/g, '(i)');

  // ══════════════════════════════════════════════════
  // PASS 3: Statement/List labels
  //   "कथन आई" → "कथन I"
  //   "सूची-आई" → "सूची-I"
  // ══════════════════════════════════════════════════

  r = r.replace(/कथन\s+आई(?=\s|$|[,।])/g, 'कथन I');
  r = r.replace(/कथन\s+द्वितीय(?=\s|$|[,।])/g, 'कथन II');
  r = r.replace(/कथन\s+तृतीय(?=\s|$|[,।])/g, 'कथन III');
  r = r.replace(/कथन\s+चतुर्थ(?=\s|$|[,।])/g, 'कथन IV');
  r = r.replace(/स्टेटमेंट\s+आई(?=\s|$|[,।])/g, 'Statement I');
  r = r.replace(/स्टेटमेंट\s+द्वितीय(?=\s|$|[,।])/g, 'Statement II');
  r = r.replace(/अभिकथन\s*\(\s*ए\s*\)/g, 'अभिकथन (A)');
  r = r.replace(/कारण\s*\(\s*आर\s*\)/g, 'कारण (R)');
  r = r.replace(/सूची\s*[-–]?\s*आई(?=\s|$|[,।])/g, 'सूची-I');
  r = r.replace(/सूची\s*[-–]?\s*द्वितीय(?=\s|$|[,।])/g, 'सूची-II');
  r = r.replace(/सूची\s*[-–]?\s*तृतीय(?=\s|$|[,।])/g, 'सूची-III');
  r = r.replace(/स्तंभ\s*[-–]?\s*आई(?=\s|$|[,।])/g, 'स्तंभ-I');
  r = r.replace(/स्तंभ\s*[-–]?\s*द्वितीय(?=\s|$|[,।])/g, 'स्तंभ-II');

  // ══════════════════════════════════════════════════
  // PASS 4: THE MAIN FIX — Inline letter code replacement
  //
  // KEY INSIGHT: Use split-rejoin approach instead of regex \b
  // Split by delimiters, check each token, replace if it's a letter code
  // ══════════════════════════════════════════════════

  r = replaceInlineLetterCodes(r);

  // Cleanup double spaces
  r = r.replace(/  +/g, ' ').trim();

  return { text: r, fixed: r !== original };
}

/**
 * Split-and-replace approach for inline letter codes.
 * This correctly handles Devanagari without \b issues.
 *
 * Splits the string into tokens and non-tokens (delimiters),
 * checks each token against the letter map, replaces if match.
 */
function replaceInlineLetterCodes(text) {
  if (!text) return text;

  // Letter map: Hindi → English
  const LETTER_MAP = {
    'ए': 'A',
    'बी': 'B',
    'सी': 'C',
    'डी': 'D',
    'ई': 'E',
  };

  // Delimiter pattern: space, comma, (, ), [, ], -, –, —, ।, newline
  // We split on these, keeping the delimiters
  const DELIM_RE = /([\s,।()\[\]\-–—\n])/;

  const parts = text.split(DELIM_RE);
  let changed = false;
  let inCodeContext = false;

  // We scan through parts. A "code context" is determined by:
  // 1. A prefix word (केवल, सभी, etc.) just seen
  // 2. Or we're in a comma-separated list where the previous token was a letter code
  // 3. Or the previous non-delimiter token was already a letter code (A/B/C/D/E)

  const PREFIX_WORDS = new Set([
    'केवल','सभी','उपरोक्त','उपर्युक्त','निम्नलिखित','दोनों',
    'इनमें','कथन','statement'
  ]);

  // First pass: identify which positions are letter codes
  // A token is a "code" if:
  // - It's one of the Hindi letters AND
  // - It appears after a prefix word, or in a comma-separated list of other codes

  // Strategy: Do multiple passes
  // Pass A: Replace बी, सी, डी everywhere (they're NEVER real Hindi words)
  const safeReplaceResult = replaceSafeLetters(parts, changed);
  const newParts = safeReplaceResult.parts;
  changed = safeReplaceResult.changed;

  // Pass B: Replace ए and ई in code context
  replaceContextualLetters(newParts);

  return newParts.join('');

  function replaceSafeLetters(parts, changed) {
    const result = [...parts];
    for (let i = 0; i < result.length; i++) {
      const token = result[i];
      if (token === 'बी') { result[i] = 'B'; changed = true; }
      else if (token === 'सी') { result[i] = 'C'; changed = true; }
      else if (token === 'डी') { result[i] = 'D'; changed = true; }
    }
    return { parts: result, changed };
  }

  function replaceContextualLetters(parts) {
    // Now parts may have a mix of B/C/D (replaced) and ए/ई (not yet replaced)
    // We need to determine if ए and ई are in "code context"

    // Find positions of actual content tokens (not delimiters)
    // A delimiter is a single space, comma, (, ), etc.
    const isDelim = (s) => /^[\s,।()\[\]\-–—\n]+$/.test(s);

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== 'ए' && parts[i] !== 'ई') continue;

      // Check context: look at surrounding non-delimiter tokens
      const prev = getPrevToken(parts, i);
      const next = getNextToken(parts, i);

      let isCode = false;

      // Rule 1: Previous token is a prefix word
      if (prev && PREFIX_WORDS.has(prev.toLowerCase())) {
        isCode = true;
      }

      // Rule 2: Previous token is already a letter code (A/B/C/D/E)
      if (prev && /^[ABCDE]$/.test(prev)) {
        isCode = true;
      }

      // Rule 3: Next token is a letter code or letter (A/B/C/D/E or ए/बी/सी/डी/ई converted)
      if (next && (/^[ABCDE]$/.test(next) || Object.keys(LETTER_MAP).includes(next))) {
        isCode = true;
      }

      // Rule 4: Surrounded by commas (is in a list)
      const prevDelim = parts[i - 1];
      const nextDelim = parts[i + 1];
      if (prevDelim && /,/.test(prevDelim) && nextDelim && (/,/.test(nextDelim) || /^\s*(और|एवं|तथा)/.test(nextDelim) || nextDelim.trim() === '')) {
        isCode = true;
      }
      if (prevDelim && /,/.test(prevDelim)) {
        isCode = true;
      }

      // Rule 5: Nothing before (start of string) and next is a letter code
      if (!prev && next && /^[ABCDE]$/.test(next)) {
        isCode = true;
      }

      // Rule 6: Previous is "और/एवं/तथा" and we're in a list
      if (prev && /^(और|एवं|तथा)$/.test(prev)) {
        // Look further back — if there was a letter code before और, it's a list
        const prevPrev = getPrevToken(parts, parts.indexOf(prev, 0));
        if (prevPrev && /^[ABCDE]$/.test(prevPrev)) {
          isCode = true;
        }
      }

      if (isCode) {
        parts[i] = parts[i] === 'ए' ? 'A' : 'E';
        changed = true;
      }
    }
  }

  function getPrevToken(parts, idx) {
    for (let i = idx - 1; i >= 0; i--) {
      const p = parts[i].trim();
      if (p && !/^[\s,।()\[\]\-–—]+$/.test(p)) return p;
    }
    return null;
  }

  function getNextToken(parts, idx) {
    for (let i = idx + 1; i < parts.length; i++) {
      const p = parts[i].trim();
      if (p && !/^[\s,।()\[\]\-–—]+$/.test(p)) return p;
    }
    return null;
  }
}

/**
 * Check if an English option is a letter-code (should be mirrored to Hindi as-is)
 */
function isLetterCodeOption(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  return /^[A-Ea-e](\s*,\s*[A-Ea-e]){1,}\s*$/.test(t) ||
         /^(Only|All|Both|केवल|सभी)\s+[A-E]/.test(t) ||
         /^[A-Da-d]\s*[-–—]\s*(VIII|VII|VI|IV|IX|III|II|I|V|X)/.test(t);
}

// ═══════════════════════════════════════════════════
//  SELF-TEST
// ═══════════════════════════════════════════════════

function runSelfTest() {
  const tests = [
    ['केवल ए, बी, सी, डी',        'केवल A, B, C, D'],
    ['केवल बी, सी, डी',            'केवल B, C, D'],
    ['केवल ए, सी, ई',              'केवल A, C, E'],
    ['केवल बी, डी और ई',           'केवल B, D और E'],
    ['केवल A, C और D',             'केवल A, C और D'],   // already correct
    ['केवल A, B और C',             'केवल A, B और C'],   // already correct
    ['ए, बी, सी, डी, ई',           'A, B, C, D, E'],
    ['ए-III, बी-I, सी-II, डी-IV', 'A-III, B-I, C-II, D-IV'],
    ['(ए)',                         '(A)'],
    ['(बी)',                         '(B)'],
    ['(आर)',                         '(R)'],
    ['कथन आई',                      'कथन I'],
    ['सूची-आई',                      'सूची-I'],
    ['अभिकथन (ए)',                   'अभिकथन (A)'],
    ['कथन A, C, D सही हैं',         'कथन A, C, D सही हैं'], // already correct
    ['कथन ए, बी, सी सही हैं',       'कथन A, B, C सही हैं'],
    ['केवल बी, ई',                   'केवल B, E'],
    ['सभी ए, बी, सी, डी',           'सभी A, B, C, D'],
    ['ए, बी, सी, डी',               'A, B, C, D'],
    ['केवल ए और बी',                'केवल A और B'],
    ['केवल बी और डी',               'केवल B और D'],
    ['केवल ए, बी और सी',            'केवल A, B और C'],
    ['बी, सी, डी, ए',               'B, C, D, A'],
    ['ए-द्वितीय',                    'A-II'],
    ['बी-तृतीय',                      'B-III'],
    ['सी-चतुर्थ',                     'C-IV'],
    ['केवल ए, बी, सी, डी, ई',      'केवल A, B, C, D, E'],
    // Real Hindi sentences — should NOT be changed
    ['यह एक अच्छा काम है',          'यह एक अच्छा काम है'],   // no letter codes
    ['नीति आयोग की स्थापना',        'नीति आयोग की स्थापना'], // no codes
  ];

  let passed = 0, failed = 0;
  console.log('\n  Running self-tests...\n');

  for (const [input, expected] of tests) {
    const { text: result } = fixHindiLetterCodes(input);
    const ok = result === expected;
    if (ok) {
      passed++;
      if (VERBOSE) console.log(`    ✅ "${input}" → "${result}"`);
    } else {
      failed++;
      console.log(`    ❌ "${input}"`);
      console.log(`       Expected : "${expected}"`);
      console.log(`       Got      : "${result}"`);
    }
  }

  console.log(`\n  Self-test: ${passed}/${tests.length} passed${failed > 0 ? `, ${failed} FAILED` : ' ✅'}\n`);
  return failed === 0;
}

// ═══════════════════════════════════════════════════
//  PROCESS: PYQ Question fields
// ═══════════════════════════════════════════════════

function fixPYQQuestion(q) {
  let count = 0;

  const textFields = [
    'questionText','questionTextHi',
    'explanation','explanationHi',
    'assertion','assertionHi',
    'reason','reasonHi',
    'passage','passageHi',
    'caseletText','caseletTextHi',
    'diTitle','diTitleHi',
    'instruction','instructionHi',
  ];

  for (const f of textFields) {
    if (q[f] && typeof q[f] === 'string') {
      const { text, fixed } = fixHindiLetterCodes(q[f]);
      if (fixed) { q[f] = text; count++; }
    }
  }

  // optionsHi
  if (Array.isArray(q.optionsHi)) {
    for (let i = 0; i < q.optionsHi.length; i++) {
      if (!q.optionsHi[i]) continue;
      // Priority 1: mirror English if it's a code
      const en = Array.isArray(q.optionsEn) ? q.optionsEn[i] : null;
      if (en && isLetterCodeOption(en) && q.optionsHi[i] !== en) {
        if (VERBOSE) console.log(`      optHi[${i}]: "${q.optionsHi[i]}" → "${en}" (mirror)`);
        q.optionsHi[i] = en; count++; continue;
      }
      // Priority 2: inline fix
      const { text, fixed } = fixHindiLetterCodes(q.optionsHi[i]);
      if (fixed) {
        if (VERBOSE) console.log(`      optHi[${i}]: "${q.optionsHi[i]}" → "${text}"`);
        q.optionsHi[i] = text; count++;
      }
    }
  }

  // options (flat array)
  if (Array.isArray(q.options)) {
    for (let i = 0; i < q.options.length; i++) {
      if (!q.options[i] || typeof q.options[i] !== 'string') continue;
      const { text, fixed } = fixHindiLetterCodes(q.options[i]);
      if (fixed) { q.options[i] = text; count++; }
    }
  }

  // Array fields
  for (const f of ['statementsHi','listAHi','listBHi','itemsHi']) {
    if (Array.isArray(q[f])) {
      for (let i = 0; i < q[f].length; i++) {
        const { text, fixed } = fixHindiLetterCodes(q[f][i]);
        if (fixed) { q[f][i] = text; count++; }
      }
    }
  }

  // Sub-questions
  if (Array.isArray(q.subQuestions)) {
    for (const sq of q.subQuestions) count += fixPYQQuestion(sq);
  }

  return count;
}

// ═══════════════════════════════════════════════════
//  PROCESS: Question Bank document → $set update
// ═══════════════════════════════════════════════════

function buildQuestionUpdate(q) {
  const update = {};
  let fixCount = 0;

  // options.hi
  if (Array.isArray(q.options?.hi)) {
    const arr = [...q.options.hi];
    let changed = false;
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]) continue;
      const en = q.options?.en?.[i];
      if (en && isLetterCodeOption(en) && arr[i] !== en) {
        arr[i] = en; changed = true; fixCount++; continue;
      }
      const { text, fixed } = fixHindiLetterCodes(arr[i]);
      if (fixed) { arr[i] = text; changed = true; fixCount++; }
    }
    if (changed) update['options.hi'] = arr;
  }

  // question.hi
  if (q.question?.hi) {
    const { text, fixed } = fixHindiLetterCodes(q.question.hi);
    if (fixed) { update['question.hi'] = text; fixCount++; }
  }

  // explanation.hi
  if (q.explanation?.hi) {
    const { text, fixed } = fixHindiLetterCodes(q.explanation.hi);
    if (fixed) { update['explanation.hi'] = text; fixCount++; }
  }

  // assertionReasonData
  if (q.assertionReasonData?.assertion?.hi) {
    const { text, fixed } = fixHindiLetterCodes(q.assertionReasonData.assertion.hi);
    if (fixed) { update['assertionReasonData.assertion.hi'] = text; fixCount++; }
  }
  if (q.assertionReasonData?.reason?.hi) {
    const { text, fixed } = fixHindiLetterCodes(q.assertionReasonData.reason.hi);
    if (fixed) { update['assertionReasonData.reason.hi'] = text; fixCount++; }
  }

  // matchData
  if (Array.isArray(q.matchData?.listA?.hi)) {
    let changed = false;
    const arr = q.matchData.listA.hi.map(item => {
      const { text, fixed } = fixHindiLetterCodes(item);
      if (fixed) changed = true, fixCount++;
      return fixed ? text : item;
    });
    if (changed) update['matchData.listA.hi'] = arr;
  }
  if (Array.isArray(q.matchData?.listB?.hi)) {
    let changed = false;
    const arr = q.matchData.listB.hi.map(item => {
      const { text, fixed } = fixHindiLetterCodes(item);
      if (fixed) changed = true, fixCount++;
      return fixed ? text : item;
    });
    if (changed) update['matchData.listB.hi'] = arr;
  }

  // sequenceData
  if (Array.isArray(q.sequenceData?.items?.hi)) {
    let changed = false;
    const arr = q.sequenceData.items.hi.map(item => {
      const { text, fixed } = fixHindiLetterCodes(item);
      if (fixed) changed = true, fixCount++;
      return fixed ? text : item;
    });
    if (changed) update['sequenceData.items.hi'] = arr;
  }

  // statementData
  if (Array.isArray(q.statementData?.statements?.hi)) {
    let changed = false;
    const arr = q.statementData.statements.hi.map(item => {
      const { text, fixed } = fixHindiLetterCodes(item);
      if (fixed) changed = true, fixCount++;
      return fixed ? text : item;
    });
    if (changed) update['statementData.statements.hi'] = arr;
  }

  return { update, fixCount };
}

// ═══════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(' CORRUPTED TRANSLATION FIX SCRIPT — FINAL VERSION');
  console.log(DRY_RUN ? ' MODE: DRY RUN (no DB changes)' : ' MODE: LIVE (saving to DB)');
  console.log('═══════════════════════════════════════════════════════');

  const selfTestOk = runSelfTest();
  if (!selfTestOk) {
    console.error('Self-test failed. Aborting.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('ERROR: MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB\n');

  const stats = { pyqDocs: 0, pyqFixed: 0, pyqFields: 0, qDocs: 0, qFixed: 0, qFields: 0 };

  // ── PART 1: PYQAnalysis ────────────────────────────
  console.log('━━━ PART 1: PYQAnalysis ━━━\n');
  const PYQAnalysis = require('../models/PYQAnalysis');
  const pyqDocs = await PYQAnalysis.find({ isActive: true }).lean();
  stats.pyqDocs = pyqDocs.length;
  console.log(`  Found ${pyqDocs.length} PYQ documents\n`);

  for (const doc of pyqDocs) {
    const qtm = doc.questionTopicMap || [];
    let docFix = 0;
    for (let qi = 0; qi < qtm.length; qi++) {
      const fc = fixPYQQuestion(qtm[qi]);
      if (fc > 0) { docFix += fc; if (VERBOSE) console.log(`    Q${qtm[qi].qNo}: ${fc} fixes`); }
    }
    if (docFix > 0) {
      stats.pyqFixed++; stats.pyqFields += docFix;
      if (!DRY_RUN) {
        await PYQAnalysis.updateOne({ _id: doc._id }, { $set: { questionTopicMap: qtm, updatedAt: new Date() } });
      }
      console.log(`  ${DRY_RUN ? '🔍' : '✅'} ${doc.displayLabel}: ${docFix} fields fixed`);
    } else {
      console.log(`  ⬜ ${doc.displayLabel}: clean`);
    }
  }

  console.log(`\n  PYQ: ${stats.pyqFixed}/${stats.pyqDocs} docs, ${stats.pyqFields} fields\n`);

  // ── PART 2: Question Bank ──────────────────────────
  console.log('━━━ PART 2: Question Bank ━━━\n');
  const Question = require('../models/Question');
  const questions = await Question.find({ isActive: { $ne: false } }).lean();
  stats.qDocs = questions.length;
  console.log(`  Found ${questions.length} questions\n`);

  let shown = 0;
  for (const q of questions) {
    const { update, fixCount } = buildQuestionUpdate(q);
    if (fixCount > 0) {
      stats.qFixed++; stats.qFields += fixCount;
      if (!DRY_RUN) { update.updatedAt = new Date(); await Question.updateOne({ _id: q._id }, { $set: update }); }
      if (shown < 30 || VERBOSE) {
        console.log(`  ${DRY_RUN ? '🔍' : '✅'} Q#${q.questionNumber} (${q.questionType}): ${fixCount} fixes`);
        shown++;
      } else if (shown === 30) {
        console.log(`  ... use --verbose to see all`); shown++;
      }
    }
  }

  console.log(`\n  Questions: ${stats.qFixed}/${stats.qDocs} docs, ${stats.qFields} fields\n`);

  // ── SUMMARY ────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(' SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  PYQ Documents : ${stats.pyqFixed}/${stats.pyqDocs} (${stats.pyqFields} fields)`);
  console.log(`  Questions     : ${stats.qFixed}/${stats.qDocs} (${stats.qFields} fields)`);
  console.log(`  TOTAL FIXED   : ${stats.pyqFields + stats.qFields} fields`);
  if (DRY_RUN) { console.log('\n  ⚠️  DRY RUN — nothing saved. Remove --dry-run to apply.'); }
  else { console.log('\n  ✅ All changes saved to database'); }
  console.log('═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ FATAL:', err.message, '\n', err.stack);
  process.exit(1);
});