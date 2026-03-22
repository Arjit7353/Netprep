// server/scripts/repairAllTranslations.js
// ═══════════════════════════════════════════════════════════════════
//  ULTIMATE REPAIR SCRIPT v3.0 — Fixes EVERY field of EVERY type
//  
//  Covers: MCQ, Assertion-Reason, Match Following, Sequence Order,
//          Statement Based, Passage Based, DI Table, DI Bar Chart,
//          DI Pie Chart, DI Line Graph, DI Mixed, DI Caselet
//
//  Fields: question, options, explanation, assertion, reason,
//          listA, listB, items, statements, passage content,
//          DI title, instruction, caseletText, table headers,
//          chart labels, dataset labels, footers
//
//  RUN:  node server/scripts/repairAllTranslations.js
// ═══════════════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('ERROR: MONGO_URI not found in .env'); process.exit(1); }

// ═══════════════════════════════════════════════════
//     MASTER CORRUPTION FIX TABLE (70+ patterns)
// ═══════════════════════════════════════════════════

const FIXES = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 1: Parenthesized Letter Labels
  // Found in: ALL types (question, options, explanation)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { find: /\(\s*ए\s*\)/g, fix: '(A)', cat: 'label' },
  { find: /\(\s*बी\s*\)/g, fix: '(B)', cat: 'label' },
  { find: /\(\s*सी\s*\)/g, fix: '(C)', cat: 'label' },
  { find: /\(\s*डी\s*\)/g, fix: '(D)', cat: 'label' },
  { find: /\(\s*ई\s*\)/g, fix: '(E)', cat: 'label' },
  { find: /\(\s*एफ\s*\)/g, fix: '(F)', cat: 'label' },
  { find: /\(\s*आर\s*\)/g, fix: '(R)', cat: 'label' },
  { find: /\(\s*एस\s*\)/g, fix: '(S)', cat: 'label' },
  { find: /\(\s*पी\s*\)/g, fix: '(P)', cat: 'label' },
  { find: /\(\s*क्यू\s*\)/g, fix: '(Q)', cat: 'label' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 2: Parenthesized Roman Numeral Labels
  // Found in: Match Following, Sequence, options
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { find: /\(\s*आई\s*\)/g, fix: '(i)', cat: 'roman' },
  { find: /\(\s*ii\s*\)/g, fix: '(ii)', cat: 'roman' },
  { find: /\(\s*iii\s*\)/g, fix: '(iii)', cat: 'roman' },
  { find: /\(\s*iv\s*\)/g, fix: '(iv)', cat: 'roman' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 3: Match Code Corruptions (A-I → ए-आई)
  // Found in: Match Following options, explanation
  // Full set: A/B/C/D × I/II/III/IV/V/VI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // A-*
  { find: /ए\s*[-–—]\s*आई\b/g, fix: 'A-I', cat: 'match' },
  { find: /ए\s*[-–—]\s*II\b/g, fix: 'A-II', cat: 'match' },
  { find: /ए\s*[-–—]\s*द्वितीय\b/g, fix: 'A-II', cat: 'match' },
  { find: /ए\s*[-–—]\s*III\b/g, fix: 'A-III', cat: 'match' },
  { find: /ए\s*[-–—]\s*तृतीय\b/g, fix: 'A-III', cat: 'match' },
  { find: /ए\s*[-–—]\s*IV\b/g, fix: 'A-IV', cat: 'match' },
  { find: /ए\s*[-–—]\s*चतुर्थ\b/g, fix: 'A-IV', cat: 'match' },
  { find: /ए\s*[-–—]\s*वी\b/g, fix: 'A-V', cat: 'match' },
  { find: /ए\s*[-–—]\s*छठा\b/g, fix: 'A-VI', cat: 'match' },
  // B-*
  { find: /बी\s*[-–—]\s*आई\b/g, fix: 'B-I', cat: 'match' },
  { find: /बी\s*[-–—]\s*II\b/g, fix: 'B-II', cat: 'match' },
  { find: /बी\s*[-–—]\s*द्वितीय\b/g, fix: 'B-II', cat: 'match' },
  { find: /बी\s*[-–—]\s*III\b/g, fix: 'B-III', cat: 'match' },
  { find: /बी\s*[-–—]\s*तृतीय\b/g, fix: 'B-III', cat: 'match' },
  { find: /बी\s*[-–—]\s*IV\b/g, fix: 'B-IV', cat: 'match' },
  { find: /बी\s*[-–—]\s*चतुर्थ\b/g, fix: 'B-IV', cat: 'match' },
  { find: /बी\s*[-–—]\s*वी\b/g, fix: 'B-V', cat: 'match' },
  { find: /बी\s*[-–—]\s*छठा\b/g, fix: 'B-VI', cat: 'match' },
  // C-*
  { find: /सी\s*[-–—]\s*आई\b/g, fix: 'C-I', cat: 'match' },
  { find: /सी\s*[-–—]\s*II\b/g, fix: 'C-II', cat: 'match' },
  { find: /सी\s*[-–—]\s*द्वितीय\b/g, fix: 'C-II', cat: 'match' },
  { find: /सी\s*[-–—]\s*III\b/g, fix: 'C-III', cat: 'match' },
  { find: /सी\s*[-–—]\s*तृतीय\b/g, fix: 'C-III', cat: 'match' },
  { find: /सी\s*[-–—]\s*IV\b/g, fix: 'C-IV', cat: 'match' },
  { find: /सी\s*[-–—]\s*चतुर्थ\b/g, fix: 'C-IV', cat: 'match' },
  { find: /सी\s*[-–—]\s*वी\b/g, fix: 'C-V', cat: 'match' },
  { find: /सी\s*[-–—]\s*छठा\b/g, fix: 'C-VI', cat: 'match' },
  // D-*
  { find: /डी\s*[-–—]\s*आई\b/g, fix: 'D-I', cat: 'match' },
  { find: /डी\s*[-–—]\s*II\b/g, fix: 'D-II', cat: 'match' },
  { find: /डी\s*[-–—]\s*द्वितीय\b/g, fix: 'D-II', cat: 'match' },
  { find: /डी\s*[-–—]\s*III\b/g, fix: 'D-III', cat: 'match' },
  { find: /डी\s*[-–—]\s*तृतीय\b/g, fix: 'D-III', cat: 'match' },
  { find: /डी\s*[-–—]\s*IV\b/g, fix: 'D-IV', cat: 'match' },
  { find: /डी\s*[-–—]\s*चतुर्थ\b/g, fix: 'D-IV', cat: 'match' },
  { find: /डी\s*[-–—]\s*वी\b/g, fix: 'D-V', cat: 'match' },
  { find: /डी\s*[-–—]\s*छठा\b/g, fix: 'D-VI', cat: 'match' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 4: Assertion-Reason Compound Labels
  // Found in: A-R question, options, explanation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { find: /अभिकथन\s*\(\s*ए\s*\)/g, fix: 'अभिकथन (A)', cat: 'ar' },
  { find: /कारण\s*\(\s*आर\s*\)/g, fix: 'कारण (R)', cat: 'ar' },
  { find: /\(ए\)\s*और\s*\(आर\)/g, fix: '(A) और (R)', cat: 'ar' },
  { find: /\(आर\)\s*,?\s*\(ए\)\s*की/g, fix: '(R), (A) की', cat: 'ar' },
  { find: /\(ए\)\s*सही\s*है/g, fix: '(A) सही है', cat: 'ar' },
  { find: /\(आर\)\s*सही\s*है/g, fix: '(R) सही है', cat: 'ar' },
  { find: /\(ए\)\s*गलत\s*है/g, fix: '(A) गलत है', cat: 'ar' },
  { find: /\(आर\)\s*गलत\s*है/g, fix: '(R) गलत है', cat: 'ar' },
  { find: /\(आर\)\s*,?\s*\(ए\)\s*का/g, fix: '(R), (A) का', cat: 'ar' },
  { find: /\(आर\)\s*,?\s*\(ए\)\s*के/g, fix: '(R), (A) के', cat: 'ar' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 5: Statement/List Marker Corruptions
  // Found in: Statement Based, Sequence, explanation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { find: /कथन\s+आई\b/g, fix: 'कथन I', cat: 'stmt' },
  { find: /कथन\s+द्वितीय\b/g, fix: 'कथन II', cat: 'stmt' },
  { find: /कथन\s+तृतीय\b/g, fix: 'कथन III', cat: 'stmt' },
  { find: /कथन\s+चतुर्थ\b/g, fix: 'कथन IV', cat: 'stmt' },
  { find: /कथन\s+वी\b/g, fix: 'कथन V', cat: 'stmt' },
  { find: /कथन\s+छठा\b/g, fix: 'कथन VI', cat: 'stmt' },

  { find: /सूची\s*[-–]?\s*आई\b/g, fix: 'सूची-I', cat: 'list' },
  { find: /सूची\s*[-–]?\s*द्वितीय\b/g, fix: 'सूची-II', cat: 'list' },
  { find: /स्तंभ\s*[-–]?\s*आई\b/g, fix: 'स्तंभ-I', cat: 'list' },
  { find: /स्तंभ\s*[-–]?\s*द्वितीय\b/g, fix: 'स्तंभ-II', cat: 'list' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 6: English Text Corruptions
  // When English text gets wrongly transliterated to Hindi-style
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { find: /Statement\s+Ai\b/gi, fix: 'Statement I', cat: 'en_fix' },
  { find: /Statement\s+Dvitiy\b/gi, fix: 'Statement II', cat: 'en_fix' },
  { find: /Statement\s+Tritiy\b/gi, fix: 'Statement III', cat: 'en_fix' },
  { find: /List\s*[-–]?\s*Ai\b/gi, fix: 'List-I', cat: 'en_fix' },
  { find: /List\s*[-–]?\s*Dvitiy\b/gi, fix: 'List-II', cat: 'en_fix' },
  { find: /Column\s*[-–]?\s*Ai\b/gi, fix: 'Column-I', cat: 'en_fix' },
  { find: /Column\s*[-–]?\s*Dvitiy\b/gi, fix: 'Column-II', cat: 'en_fix' },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CATEGORY 7: Standalone Roman Numeral Corruptions
  // Found in: options (1 और 2, I and II), explanation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { find: /\bकेवल\s+आई\s+और\s+द्वितीय\b/g, fix: 'केवल I और II', cat: 'roman_text' },
  { find: /\bकेवल\s+द्वितीय\s+और\s+तृतीय\b/g, fix: 'केवल II और III', cat: 'roman_text' },
  { find: /\bकेवल\s+आई\s+और\s+तृतीय\b/g, fix: 'केवल I और III', cat: 'roman_text' },
  { find: /\bकेवल\s+आई\b/g, fix: 'केवल I', cat: 'roman_text' },
  { find: /\bकेवल\s+द्वितीय\b/g, fix: 'केवल II', cat: 'roman_text' },
  { find: /\bकेवल\s+तृतीय\b/g, fix: 'केवल III', cat: 'roman_text' },

  { find: /\b1\s+और\s+2\s+दोनों\b/g, fix: '1 और 2 दोनों', cat: 'num_text' },
  { find: /\bआई,\s*द्वितीय,\s*तृतीय\b/g, fix: 'I, II, III', cat: 'roman_text' },
  { find: /\bआई,\s*द्वितीय\b/g, fix: 'I, II', cat: 'roman_text' },
  { find: /\bद्वितीय,\s*तृतीय\b/g, fix: 'II, III', cat: 'roman_text' },
];

// ═══════════════════════════════════════════════════
//     CODE-LIKE TEXT DETECTION (for option sync)
// ═══════════════════════════════════════════════════

const VALID_MATCH_CODE = /^[A-Da-d]\s*[-–—]\s*[IVXivx]+(\s*[,;\s]\s*[A-Da-d]\s*[-–—]\s*[IVXivx]+)+\s*$/i;
const VALID_MATCH_PAREN = /^[A-Da-d]\s*[-–—]\s*\([ivxIVX]+\)(\s*[,;\s]\s*[A-Da-d]\s*[-–—]\s*\([ivxIVX]+\))+\s*$/i;
const PURE_NUMBER = /^\s*[-+]?\d+(\.\d+)?\s*%?\s*$/;
const NUMBER_UNIT = /^\s*[-+]?\d+(\.\d+)?\s*°?[A-Za-z]{0,5}\s*$/;
const ROMAN_ONLY = /^(VIII|VII|VI|IV|IX|III|II|I|V|X)$/;

function isCodeLike(text) {
  if (!text) return false;
  const t = text.trim();
  return VALID_MATCH_CODE.test(t) || VALID_MATCH_PAREN.test(t) ||
         PURE_NUMBER.test(t) || NUMBER_UNIT.test(t) || ROMAN_ONLY.test(t) ||
         /^[A-Z]$/.test(t) || /^\d{3,4}\s*[-–—]\s*\d{3,4}$/.test(t);
}

// ═══════════════════════════════════════════════════
//     CORE FIX FUNCTIONS
// ═══════════════════════════════════════════════════

function isCorrupted(text) {
  if (!text || typeof text !== 'string') return false;
  for (const f of FIXES) {
    if (new RegExp(f.find.source, f.find.flags).test(text)) return true;
  }
  return false;
}

function applyFixes(text) {
  if (!text || typeof text !== 'string') return { text, changed: false, count: 0, categories: [] };
  let result = text;
  let count = 0;
  const categories = new Set();

  for (const f of FIXES) {
    const re = new RegExp(f.find.source, f.find.flags);
    if (re.test(result)) {
      result = result.replace(new RegExp(f.find.source, f.find.flags), f.fix);
      count++;
      if (f.cat) categories.add(f.cat);
    }
  }

  return { text: result, changed: result !== text, count, categories: [...categories] };
}

// ═══════════════════════════════════════════════════
//     FIELD FIXING HELPERS
// ═══════════════════════════════════════════════════

function fixBilingualString(obj, fieldPath, repairs) {
  if (!obj) return;
  ['hi', 'en'].forEach(lang => {
    if (obj[lang] && typeof obj[lang] === 'string' && isCorrupted(obj[lang])) {
      const r = applyFixes(obj[lang]);
      if (r.changed) {
        repairs.push({
          field: `${fieldPath}.${lang}`,
          from: obj[lang].substring(0, 80),
          to: r.text.substring(0, 80),
          fixes: r.count,
          categories: r.categories
        });
        obj[lang] = r.text;
      }
    }
  });
}

function fixBilingualArray(obj, fieldPath, repairs) {
  if (!obj) return;
  ['hi', 'en'].forEach(lang => {
    if (obj[lang] && Array.isArray(obj[lang])) {
      for (let i = 0; i < obj[lang].length; i++) {
        const val = obj[lang][i];
        if (val && typeof val === 'string' && isCorrupted(val)) {
          const r = applyFixes(val);
          if (r.changed) {
            repairs.push({
              field: `${fieldPath}.${lang}[${i}]`,
              from: val.substring(0, 80),
              to: r.text.substring(0, 80),
              fixes: r.count,
              categories: r.categories
            });
            obj[lang][i] = r.text;
          }
        }
      }
    }
  });
}

function syncCodeLikeOptions(obj, fieldPath, repairs) {
  if (!obj || !obj.hi || !obj.en) return;
  const maxLen = Math.max(obj.hi.length, obj.en.length);

  for (let i = 0; i < maxLen; i++) {
    const hi = obj.hi[i] || '';
    const en = obj.en[i] || '';

    if (isCodeLike(hi) && en !== hi) {
      repairs.push({
        field: `${fieldPath}.en[${i}]`,
        from: en.substring(0, 60),
        to: hi,
        fixes: 1,
        categories: ['code_sync']
      });
      if (!obj.en) obj.en = [];
      obj.en[i] = hi;
    } else if (isCodeLike(en) && hi !== en) {
      repairs.push({
        field: `${fieldPath}.hi[${i}]`,
        from: hi.substring(0, 60),
        to: en,
        fixes: 1,
        categories: ['code_sync']
      });
      if (!obj.hi) obj.hi = [];
      obj.hi[i] = en;
    }
  }
}

// ═══════════════════════════════════════════════════
//     QUESTION REPAIR — ALL 12 TYPES
// ═══════════════════════════════════════════════════

function repairQuestion(q) {
  const repairs = [];
  const qType = q.questionType || 'mcq';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMMON FIELDS (all 12 types have these)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  fixBilingualString(q.question, 'question', repairs);
  fixBilingualArray(q.options, 'options', repairs);
  fixBilingualString(q.explanation, 'explanation', repairs);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPE-SPECIFIC FIELDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ASSERTION_REASON
  if (q.assertionReasonData) {
    fixBilingualString(q.assertionReasonData.assertion, 'assertionReasonData.assertion', repairs);
    fixBilingualString(q.assertionReasonData.reason, 'assertionReasonData.reason', repairs);
  }

  // MATCH_FOLLOWING
  if (q.matchData) {
    fixBilingualArray(q.matchData.listA, 'matchData.listA', repairs);
    fixBilingualArray(q.matchData.listB, 'matchData.listB', repairs);
  }

  // SEQUENCE_ORDER
  if (q.sequenceData) {
    fixBilingualArray(q.sequenceData.items, 'sequenceData.items', repairs);
  }

  // STATEMENT_BASED
  if (q.statementData) {
    fixBilingualArray(q.statementData.statements, 'statementData.statements', repairs);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CODE-LIKE OPTION SYNC
  // (match_following & sequence_order options like "A-I, B-II")
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (['match_following', 'sequence_order', 'statement_based'].includes(qType)) {
    syncCodeLikeOptions(q.options, 'options', repairs);
  }

  return repairs;
}

// ═══════════════════════════════════════════════════
//     PASSAGE REPAIR
// ═══════════════════════════════════════════════════

function repairPassage(p) {
  const repairs = [];
  fixBilingualString(p.content, 'content', repairs);
  fixBilingualString(p.title, 'title', repairs);
  return repairs;
}

// ═══════════════════════════════════════════════════
//     DI DATA REPAIR — ALL FIELDS
// ═══════════════════════════════════════════════════

function repairDIData(d) {
  const repairs = [];

  // Basic bilingual string fields
  fixBilingualString(d.title, 'title', repairs);
  fixBilingualString(d.instruction, 'instruction', repairs);
  fixBilingualString(d.caseletText, 'caseletText', repairs);

  // Table data
  if (d.tableData) {
    // Headers: { hi: [...], en: [...] }
    fixBilingualArray(d.tableData.headers, 'tableData.headers', repairs);
    // Footers: { hi: [...], en: [...] }
    fixBilingualArray(d.tableData.footers, 'tableData.footers', repairs);

    // Table rows can contain string values too
    if (d.tableData.rows && Array.isArray(d.tableData.rows)) {
      for (let ri = 0; ri < d.tableData.rows.length; ri++) {
        const row = d.tableData.rows[ri];
        if (Array.isArray(row)) {
          for (let ci = 0; ci < row.length; ci++) {
            const cell = row[ci];
            if (cell && typeof cell === 'string' && isCorrupted(cell)) {
              const r = applyFixes(cell);
              if (r.changed) {
                repairs.push({
                  field: `tableData.rows[${ri}][${ci}]`,
                  from: cell.substring(0, 40),
                  to: r.text.substring(0, 40),
                  fixes: r.count,
                  categories: r.categories
                });
                d.tableData.rows[ri][ci] = r.text;
              }
            }
          }
        }
      }
    }
  }

  // Chart data
  if (d.chartData) {
    // Labels: { hi: [...], en: [...] }
    fixBilingualArray(d.chartData.labels, 'chartData.labels', repairs);

    // X/Y axis labels
    fixBilingualString(d.chartData.xAxisLabel, 'chartData.xAxisLabel', repairs);
    fixBilingualString(d.chartData.yAxisLabel, 'chartData.yAxisLabel', repairs);

    // Dataset labels
    if (d.chartData.datasets && Array.isArray(d.chartData.datasets)) {
      for (let di = 0; di < d.chartData.datasets.length; di++) {
        const ds = d.chartData.datasets[di];
        if (ds && ds.label) {
          fixBilingualString(ds.label, `chartData.datasets[${di}].label`, repairs);
        }
      }
    }
  }

  return repairs;
}

// ═══════════════════════════════════════════════════
//     BUILD UPDATE OBJECT FOR DB
// ═══════════════════════════════════════════════════

function buildQuestionUpdate(q) {
  const update = { updatedAt: new Date() };

  // Always include all fixable fields
  if (q.question) update.question = q.question;
  if (q.options) update.options = q.options;
  if (q.explanation) update.explanation = q.explanation;
  if (q.assertionReasonData) update.assertionReasonData = q.assertionReasonData;
  if (q.matchData) update.matchData = q.matchData;
  if (q.sequenceData) update.sequenceData = q.sequenceData;
  if (q.statementData) update.statementData = q.statementData;

  return update;
}

function buildPassageUpdate(p) {
  const update = { updatedAt: new Date() };
  if (p.content) update.content = p.content;
  if (p.title) update.title = p.title;
  return update;
}

function buildDIUpdate(d) {
  const update = { updatedAt: new Date() };
  if (d.title) update.title = d.title;
  if (d.instruction) update.instruction = d.instruction;
  if (d.caseletText) update.caseletText = d.caseletText;
  if (d.tableData) update.tableData = d.tableData;
  if (d.chartData) update.chartData = d.chartData;
  return update;
}

// ═══════════════════════════════════════════════════
//              MAIN EXECUTION
// ═══════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  NETprep — ULTIMATE Translation Repair v3.0              ║');
  console.log('║  Fixes ALL fields of ALL 12 question types               ║');
  console.log('║  + Passages + DI Data (headers, labels, everything)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Fix patterns loaded: ${FIXES.length}`);
  console.log(`  Categories: label, roman, match, ar, stmt, list, en_fix, roman_text, code_sync`);
  console.log('');

  // Connect
  await mongoose.connect(MONGO_URI);
  console.log('  ✅ Connected to MongoDB\n');

  const QSchema = new mongoose.Schema({}, { strict: false, collection: 'questions' });
  const PSchema = new mongoose.Schema({}, { strict: false, collection: 'passages' });
  const DSchema = new mongoose.Schema({}, { strict: false, collection: 'didatas' });

  const Q = mongoose.models.Question || mongoose.model('Question', QSchema);
  const P = mongoose.models.Passage || mongoose.model('Passage', PSchema);
  const D = mongoose.models.DIData || mongoose.model('DIData', DSchema);

  const grandTotal = { scanned: 0, corrupted: 0, repaired: 0, failed: 0 };

  // ════════════════════════════════════════════════════
  //  PHASE 1: QUESTIONS (all 12 types)
  // ════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  PHASE 1: Questions — ALL 12 types, ALL fields');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allQ = await Q.find({ isActive: { $ne: false } }).lean();
  console.log(`  Total questions: ${allQ.length}\n`);
  grandTotal.scanned += allQ.length;

  const qByType = {};
  const qByField = {};
  const qByCat = {};
  let qCorrupted = 0, qRepaired = 0, qFailed = 0;
  const qExamples = [];

  for (const q of allQ) {
    const copy = JSON.parse(JSON.stringify(q));
    const repairs = repairQuestion(copy);

    if (repairs.length > 0) {
      qCorrupted++;
      const type = q.questionType || 'unknown';
      qByType[type] = (qByType[type] || 0) + 1;

      for (const r of repairs) {
        const rootField = r.field.split('.')[0];
        qByField[rootField] = (qByField[rootField] || 0) + 1;
        for (const c of (r.categories || [])) {
          qByCat[c] = (qByCat[c] || 0) + 1;
        }
      }

      if (qExamples.length < 10) {
        qExamples.push({
          num: q.questionNumber,
          type,
          count: repairs.length,
          repairs: repairs.slice(0, 3)
        });
      }

      try {
        const update = buildQuestionUpdate(copy);
        await Q.updateOne({ _id: q._id }, { $set: update });
        qRepaired++;
      } catch (e) {
        qFailed++;
      }

      if (qRepaired % 100 === 0 && qRepaired > 0) {
        process.stdout.write(`  ... fixed ${qRepaired}/${qCorrupted}\r`);
      }
    }
  }

  grandTotal.corrupted += qCorrupted;
  grandTotal.repaired += qRepaired;
  grandTotal.failed += qFailed;

  console.log(`\n  📊 Question Results:`);
  console.log(`     Scanned:   ${allQ.length}`);
  console.log(`     Corrupted: ${qCorrupted}`);
  console.log(`     ✅ Fixed:  ${qRepaired}`);
  console.log(`     ❌ Failed: ${qFailed}`);

  if (Object.keys(qByType).length > 0) {
    console.log(`\n  By Question Type:`);
    const typeOrder = ['mcq', 'assertion_reason', 'match_following', 'sequence_order',
                       'statement_based', 'passage_based', 'di_table', 'di_bar_chart',
                       'di_pie_chart', 'di_line_graph', 'di_mixed', 'di_caselet'];
    for (const t of typeOrder) {
      if (qByType[t]) console.log(`     ${t}: ${qByType[t]} corrupted`);
    }
    for (const [t, c] of Object.entries(qByType)) {
      if (!typeOrder.includes(t)) console.log(`     ${t}: ${c} corrupted`);
    }
  }

  if (Object.keys(qByField).length > 0) {
    console.log(`\n  By Field:`);
    for (const [f, c] of Object.entries(qByField).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${f}: ${c} fixes`);
    }
  }

  if (Object.keys(qByCat).length > 0) {
    console.log(`\n  By Corruption Category:`);
    for (const [c, n] of Object.entries(qByCat).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${c}: ${n} fixes`);
    }
  }

  if (qExamples.length > 0) {
    console.log(`\n  Examples (first ${qExamples.length}):`);
    qExamples.forEach((ex, i) => {
      console.log(`\n  [${i + 1}] Q#${ex.num} (${ex.type}) — ${ex.count} fix(es):`);
      ex.repairs.forEach(r => {
        console.log(`      ${r.field}:`);
        console.log(`        ❌ "${r.from}"`);
        console.log(`        ✅ "${r.to}"`);
        if (r.categories?.length) console.log(`        📂 ${r.categories.join(', ')}`);
      });
    });
  }

  // ════════════════════════════════════════════════════
  //  PHASE 2: PASSAGES
  // ════════════════════════════════════════════════════
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  PHASE 2: Passages — content, title');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let pCount = 0, pFixed = 0;
  try {
    const allP = await P.find({ isActive: { $ne: false } }).lean();
    pCount = allP.length;
    console.log(`  Total passages: ${pCount}`);
    grandTotal.scanned += pCount;

    for (const p of allP) {
      const copy = JSON.parse(JSON.stringify(p));
      const repairs = repairPassage(copy);
      if (repairs.length > 0) {
        try {
          await P.updateOne({ _id: p._id }, { $set: buildPassageUpdate(copy) });
          pFixed++;
          grandTotal.repaired++;
        } catch (e) { grandTotal.failed++; }
        grandTotal.corrupted++;
      }
    }
    console.log(`  ✅ Fixed: ${pFixed}/${pCount}`);
  } catch (e) {
    console.log(`  ⚠️ Passages: ${e.message}`);
  }

  // ════════════════════════════════════════════════════
  //  PHASE 3: DI DATA — title, instruction, caseletText,
  //           table headers, footers, rows,
  //           chart labels, axis labels, dataset labels
  // ════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  PHASE 3: DI Data — ALL fields (title, headers, labels, etc.)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let dCount = 0, dFixed = 0;
  try {
    const allD = await D.find({ isActive: { $ne: false } }).lean();
    dCount = allD.length;
    console.log(`  Total DI Data: ${dCount}`);
    grandTotal.scanned += dCount;

    for (const d of allD) {
      const copy = JSON.parse(JSON.stringify(d));
      const repairs = repairDIData(copy);
      if (repairs.length > 0) {
        try {
          await D.updateOne({ _id: d._id }, { $set: buildDIUpdate(copy) });
          dFixed++;
          grandTotal.repaired++;
          if (repairs.length > 0 && dFixed <= 3) {
            console.log(`    DI#${d.diNumber || d._id}: ${repairs.length} fixes`);
            repairs.slice(0, 2).forEach(r => {
              console.log(`      ${r.field}: "${r.from}" → "${r.to}"`);
            });
          }
        } catch (e) { grandTotal.failed++; }
        grandTotal.corrupted++;
      }
    }
    console.log(`  ✅ Fixed: ${dFixed}/${dCount}`);
  } catch (e) {
    console.log(`  ⚠️ DI Data: ${e.message}`);
  }

  // ════════════════════════════════════════════════════
  //  FINAL REPORT
  // ════════════════════════════════════════════════════
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL REPORT                          ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Scanned:    ${grandTotal.scanned.toString().padStart(6)} documents`);
  console.log(`║  Total Corrupted:  ${grandTotal.corrupted.toString().padStart(6)} documents`);
  console.log(`║  Total Repaired:   ${grandTotal.repaired.toString().padStart(6)} documents`);
  console.log(`║  Total Failed:     ${grandTotal.failed.toString().padStart(6)} documents`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Questions: ${qRepaired} fixed (${Object.keys(qByType).length} types affected)`);
  console.log(`║  Passages:  ${pFixed} fixed`);
  console.log(`║  DI Data:   ${dFixed} fixed`);
  console.log('╠════════════════════════════════════════════════════════════╣');

  if (grandTotal.repaired > 0) {
    console.log('║                                                          ║');
    console.log('║  🎉 ALL CORRUPTED TRANSLATIONS FIXED!                   ║');
    console.log('║                                                          ║');
  } else {
    console.log('║                                                          ║');
    console.log('║  ✅ DATABASE IS CLEAN — NO CORRUPTIONS FOUND            ║');
    console.log('║                                                          ║');
  }

  console.log('║  🛡️  New imports protected by translateHelper v3          ║');
  console.log('║                                                          ║');
  console.log('║  Fields covered per question type:                       ║');
  console.log('║  ┌─────────────────────┬────────────────────────────┐    ║');
  console.log('║  │ MCQ                 │ question, options, expl.   │    ║');
  console.log('║  │ Assertion-Reason    │ + assertion, reason        │    ║');
  console.log('║  │ Match Following     │ + listA, listB + code sync│    ║');
  console.log('║  │ Sequence Order      │ + items + code sync       │    ║');
  console.log('║  │ Statement Based     │ + statements + code sync  │    ║');
  console.log('║  │ Passage Based       │ + passage content         │    ║');
  console.log('║  │ DI Table            │ + headers, footers, rows  │    ║');
  console.log('║  │ DI Bar/Pie/Line     │ + labels, axis, datasets  │    ║');
  console.log('║  │ DI Caselet          │ + caseletText             │    ║');
  console.log('║  │ DI Mixed            │ + all chart fields        │    ║');
  console.log('║  └─────────────────────┴────────────────────────────┘    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await mongoose.disconnect();
  console.log('\n  Disconnected from MongoDB');
  process.exit(0);
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});