#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  COMPLETE RE-TRANSLATION SCRIPT v3.0
//  
//  🎯 PURPOSE: Re-translate ALL questions from scratch
//     - Detects source language (Hindi/English) automatically
//     - Translates ALL fields to missing language
//     - Re-translates existing bad translations
//     - Uses Google Translate (free, no API key needed)
//     - Smart batching with rate-limit handling
//     - Resume support (skips already-good questions)
//
//  📋 USAGE:
//     node server/scripts/reTranslateAll.js [options]
//
//  OPTIONS:
//     --target questions    Regular questions only (Question model)
//     --target pyq          PYQ questions only (PYQAnalysis model)
//     --target both         Both (default)
//     --paper paper1|paper2 Filter by paper
//     --force               Re-translate even if both languages exist
//     --limit 1000          Max questions (default: all)
//     --dry-run             Preview only, don't save
//     --concurrency 3       Parallel translations (default: 3)
//     --delay 300           Delay between items in ms (default: 300)
//     --resume              Skip questions that already have both languages
//
//  EXAMPLES:
//     node server/scripts/reTranslateAll.js --target both --force
//     node server/scripts/reTranslateAll.js --target pyq --paper paper2
//     node server/scripts/reTranslateAll.js --target questions --dry-run
//     node server/scripts/reTranslateAll.js --target both --force --limit 500
// ═══════════════════════════════════════════════════════════════

const mongoose = require('mongoose');
const path = require('path');

// ═══════════════════════════════════════════════════
//  GLOBALS
// ═══════════════════════════════════════════════════
const HINDI_RE = /[\u0900-\u097F]/;
let googleTranslate = null;
let startTime = Date.now();

const STATS = {
  questionsProcessed: 0,
  questionsTranslated: 0,
  questionsSkipped: 0,
  questionsErrored: 0,
  fieldsTranslated: 0,
  apiCalls: 0,
  pyqDocsProcessed: 0,
  pyqQuestionsProcessed: 0,
  pyqQuestionsTranslated: 0,
};

// ═══════════════════════════════════════════════════
//  CLI ARGS
// ═══════════════════════════════════════════════════
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    target: 'both',     // 'questions' | 'pyq' | 'both'
    paper: null,
    force: false,        // re-translate even if both langs exist
    limit: 99999,
    dryRun: false,
    concurrency: 3,
    delay: 300,
    resume: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target': opts.target = args[++i] || 'both'; break;
      case '--paper': opts.paper = args[++i]; break;
      case '--force': opts.force = true; break;
      case '--limit': opts.limit = parseInt(args[++i]) || 99999; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--concurrency': opts.concurrency = parseInt(args[++i]) || 3; break;
      case '--delay': opts.delay = parseInt(args[++i]) || 300; break;
      case '--resume': opts.resume = true; break;
      case '--help':
        console.log(`
Usage: node server/scripts/reTranslateAll.js [options]

Options:
  --target questions|pyq|both   What to translate (default: both)
  --paper paper1|paper2         Filter by paper
  --force                       Re-translate ALL fields (even existing)
  --limit N                     Max questions to process
  --dry-run                     Preview only
  --concurrency N               Parallel translations (default: 3)
  --delay N                     Delay between items in ms (default: 300)
  --resume                      Skip already-complete questions
  --help                        Show this help
        `);
        process.exit(0);
    }
  }

  return opts;
}

// ═══════════════════════════════════════════════════
//  GOOGLE TRANSLATE — Smart wrapper
// ═══════════════════════════════════════════════════
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function initGoogle() {
  const packages = ['google-translate-api-x', '@vitalets/google-translate-api'];
  
  for (const pkg of packages) {
    try {
      googleTranslate = require(pkg);
      const test = await googleTranslate('test connection', { from: 'en', to: 'hi' });
      if (test && test.text) {
        log(`✅ Google Translate ready (${pkg}): "${test.text}"`);
        return true;
      }
    } catch (e) {
      log(`⚠️  ${pkg}: ${e.message}`);
    }
  }

  logError('❌ Google Translate not available!');
  logError('   Install: npm install google-translate-api-x');
  return false;
}

async function gTranslate(text, from, to, retries = 0) {
  if (!text || typeof text !== 'string' || !text.trim()) return '';
  
  const trimmed = text.trim();
  if (trimmed.length === 0) return '';
  
  // Skip pure numbers/codes
  if (/^[\d\s.,;:+\-–—/*=%°()\[\]{}]+$/.test(trimmed)) return trimmed;
  if (/^[A-D]\s*[-–]\s*[IVXivx]+(\s*,\s*[A-D]\s*[-–]\s*[IVXivx]+)*\s*$/i.test(trimmed)) return trimmed;
  if (/^(VIII|VII|VI|IV|IX|III|II|I|V|X)$/i.test(trimmed)) return trimmed;
  if (/^\d+(\.\d+)?%?$/.test(trimmed)) return trimmed;
  if (trimmed.length <= 1) return trimmed;
  
  try {
    STATS.apiCalls++;
    const result = await googleTranslate(trimmed, { from, to });
    return (result && result.text) ? result.text : trimmed;
  } catch (e) {
    if (retries < 3) {
      const wait = 1000 * (retries + 1) + Math.random() * 500;
      await sleep(wait);
      return gTranslate(text, from, to, retries + 1);
    }
    logError(`   Translation error (${retries} retries): ${e.message}`);
    return trimmed;
  }
}

// Batch translate with smart rate limiting
async function translateTexts(texts, from, to, delay = 100) {
  const results = [];
  
  for (let i = 0; i < texts.length; i++) {
    const result = await gTranslate(texts[i], from, to);
    results.push(result);
    
    // Smart delay — longer delay every 10 calls to avoid rate limit
    if (i < texts.length - 1) {
      const d = (i > 0 && i % 10 === 0) ? delay * 3 : delay;
      await sleep(d);
    }
  }
  
  return results;
}

// ═══════════════════════════════════════════════════
//  POST-PROCESSING — Fix known issues after translation
// ═══════════════════════════════════════════════════

const CORRUPTION_FIXES = [
  [/\(\s*ए\s*\)/g, '(A)'],
  [/\(\s*आर\s*\)/g, '(R)'],
  [/\(\s*बी\s*\)/g, '(B)'],
  [/\(\s*सी\s*\)/g, '(C)'],
  [/\(\s*डी\s*\)/g, '(D)'],
  [/\(\s*ई\s*\)/g, '(E)'],
  [/\(\s*आई\s*\)/g, '(i)'],
  [/ए\s*[-–]\s*आई/g, 'A-I'],
  [/बी\s*[-–]\s*आई/g, 'B-I'],
  [/सी\s*[-–]\s*आई/g, 'C-I'],
  [/डी\s*[-–]\s*आई/g, 'D-I'],
  [/ए\s*[-–]\s*द्वितीय/g, 'A-II'],
  [/बी\s*[-–]\s*द्वितीय/g, 'B-II'],
  [/सी\s*[-–]\s*द्वितीय/g, 'C-II'],
  [/डी\s*[-–]\s*द्वितीय/g, 'D-II'],
  [/ए\s*[-–]\s*तृतीय/g, 'A-III'],
  [/बी\s*[-–]\s*तृतीय/g, 'B-III'],
  [/सी\s*[-–]\s*तृतीय/g, 'C-III'],
  [/डी\s*[-–]\s*तृतीय/g, 'D-III'],
  [/ए\s*[-–]\s*चतुर्थ/g, 'A-IV'],
  [/बी\s*[-–]\s*चतुर्थ/g, 'B-IV'],
  [/सी\s*[-–]\s*चतुर्थ/g, 'C-IV'],
  [/डी\s*[-–]\s*चतुर्थ/g, 'D-IV'],
  [/कथन\s+आई\b/g, 'कथन I'],
  [/कथन\s+द्वितीय\b/g, 'कथन II'],
  [/कथन\s+तृतीय\b/g, 'कथन III'],
  [/सूची\s*[-–]?\s*आई\b/g, 'सूची-I'],
  [/सूची\s*[-–]?\s*द्वितीय\b/g, 'सूची-II'],
  [/अभिकथन\s*\(\s*ए\s*\)/g, 'अभिकथन (A)'],
  [/कारण\s*\(\s*आर\s*\)/g, 'कारण (R)'],
  [/स्टेटमेंट\s+आई\b/g, 'Statement I'],
  [/स्टेटमेंट\s+द्वितीय\b/g, 'Statement II'],
];

function postProcess(text, targetLang) {
  if (!text || typeof text !== 'string') return text || '';
  let result = text;

  // 1. Fix corrupted option codes (A→ए etc.)
  for (const [pattern, fix] of CORRUPTION_FIXES) {
    result = result.replace(pattern, fix);
  }

  // 2. Normalize spacing
  result = result.replace(/\)([A-Za-z\u0900-\u097F])/g, ') $1');
  result = result.replace(/([A-Za-z\u0900-\u097F])\(/g, '$1 (');
  result = result.replace(/([\u0900-\u097F])([A-Z])/g, '$1 $2');
  result = result.replace(/(\d)([\u0900-\u097F])/g, '$1 $2');
  result = result.replace(/([\u0900-\u097F])(\d)/g, '$1 $2');
  result = result.replace(/([।.!?])([A-Z\u0900-\u097F])/g, '$1 $2');
  result = result.replace(/,([A-Za-z\u0900-\u097F])/g, ', $1');
  result = result.replace(/\s{2,}/g, ' ').trim();

  return result;
}

// ═══════════════════════════════════════════════════
//  DETECT SOURCE LANGUAGE of a text
// ═══════════════════════════════════════════════════
function detectLang(text) {
  if (!text || typeof text !== 'string') return null;
  return HINDI_RE.test(text) ? 'hi' : 'en';
}

function detectQuestionLang(q) {
  // For regular Question model
  if (q.question) {
    if (q.question.hi && q.question.hi.trim()) return 'hi';
    if (q.question.en && q.question.en.trim()) return 'en';
  }
  return 'hi'; // default
}

// ═══════════════════════════════════════════════════
//  LOGGING
// ═══════════════════════════════════════════════════
function log(msg) {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  console.log(`[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}] ${msg}`);
}

function logError(msg) {
  console.error(`  ❌ ${msg}`);
}

function logProgress(current, total, extra = '') {
  const pct = Math.round((current / total) * 100);
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = current / elapsed;
  const remaining = rate > 0 ? Math.round((total - current) / rate) : 0;
  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;
  
  log(`[${pct}%] ${current}/${total} | API calls: ${STATS.apiCalls} | ETA: ${remMin}m${remSec}s ${extra}`);
}

// ═══════════════════════════════════════════════════
//  TRANSLATE REGULAR QUESTION (Question model)
// ═══════════════════════════════════════════════════
async function translateRegularQuestion(q, opts) {
  const srcLang = detectQuestionLang(q);
  const tgtLang = srcLang === 'hi' ? 'en' : 'hi';
  
  // Check if translation needed
  if (!opts.force) {
    const hasHi = q.question?.hi?.trim();
    const hasEn = q.question?.en?.trim();
    if (hasHi && hasEn && opts.resume) {
      return false; // Already has both
    }
  }

  const textsToTranslate = [];
  const meta = [];
  
  // ═══ Collect ALL translatable fields ═══
  
  // Helper: add text field for translation
  const addField = (obj, srcField, tgtField, label) => {
    if (!obj) return;
    const srcVal = obj[srcField];
    if (srcVal && typeof srcVal === 'string' && srcVal.trim()) {
      if (opts.force || !obj[tgtField] || !obj[tgtField].trim()) {
        textsToTranslate.push(srcVal);
        meta.push({ obj, tgtField, label, type: 'text' });
      }
    }
  };

  // Helper: add array field
  const addArrayField = (obj, srcField, tgtField, label) => {
    if (!obj) return;
    const srcArr = obj[srcField];
    if (!Array.isArray(srcArr) || srcArr.length === 0) return;
    if (!opts.force && Array.isArray(obj[tgtField]) && obj[tgtField].length > 0 && 
        obj[tgtField].some(x => x && x.trim())) return;
    
    for (let i = 0; i < srcArr.length; i++) {
      textsToTranslate.push(srcArr[i] || '');
      meta.push({ obj, tgtField, label: `${label}[${i}]`, type: 'array', index: i, totalLen: srcArr.length });
    }
  };

  // Question text
  addField(q.question, srcLang, tgtLang, 'question');
  
  // Options
  addArrayField(q.options, srcLang, tgtLang, 'options');
  
  // Explanation  
  addField(q.explanation, srcLang, tgtLang, 'explanation');
  
  // Assertion-Reason
  if (q.assertionReasonData) {
    addField(q.assertionReasonData.assertion, srcLang, tgtLang, 'assertion');
    addField(q.assertionReasonData.reason, srcLang, tgtLang, 'reason');
  }
  
  // Match data
  if (q.matchData) {
    addArrayField(q.matchData.listA, srcLang, tgtLang, 'listA');
    addArrayField(q.matchData.listB, srcLang, tgtLang, 'listB');
  }
  
  // Statement data
  if (q.statementData) {
    addArrayField(q.statementData.statements, srcLang, tgtLang, 'statements');
  }
  
  // Sequence data
  if (q.sequenceData) {
    addArrayField(q.sequenceData.items, srcLang, tgtLang, 'seqItems');
  }

  if (textsToTranslate.length === 0) return false;

  // ═══ Translate ═══
  if (opts.dryRun) {
    STATS.fieldsTranslated += textsToTranslate.length;
    return true;
  }

  const translated = await translateTexts(textsToTranslate, srcLang, tgtLang, opts.delay);

  // ═══ Apply translations ═══
  const arrayBuffers = {};
  
  for (let i = 0; i < meta.length; i++) {
    const m = meta[i];
    let tr = postProcess(translated[i] || '', tgtLang);
    
    if (m.type === 'text') {
      m.obj[m.tgtField] = tr;
    } else if (m.type === 'array') {
      const key = `${m.label.split('[')[0]}`;
      if (!arrayBuffers[key]) {
        arrayBuffers[key] = { obj: m.obj, field: m.tgtField, arr: new Array(m.totalLen).fill('') };
      }
      arrayBuffers[key].arr[m.index] = tr;
    }
    
    STATS.fieldsTranslated++;
  }

  // Apply array buffers
  for (const buf of Object.values(arrayBuffers)) {
    buf.obj[buf.field] = buf.arr;
  }

  return true;
}

// ═══════════════════════════════════════════════════
//  TRANSLATE PYQ QUESTION (PYQAnalysis questionTopicMap)
// ═══════════════════════════════════════════════════
async function translatePYQQuestion(q, opts) {
  // Detect source language
  let srcLang = 'hi';
  const hiFields = ['questionTextHi', 'assertionHi', 'passageHi', 'caseletTextHi'];
  const enFields = ['questionTextEn', 'assertionEn', 'passageEn', 'caseletTextEn'];
  
  let hiCount = 0, enCount = 0;
  for (const f of hiFields) { if (q[f] && q[f].trim()) hiCount++; }
  for (const f of enFields) { if (q[f] && q[f].trim()) enCount++; }
  
  // Also check options
  if (Array.isArray(q.optionsHi) && q.optionsHi.some(o => o && o.trim())) hiCount++;
  if (Array.isArray(q.optionsEn) && q.optionsEn.some(o => o && o.trim())) enCount++;
  
  srcLang = hiCount >= enCount ? 'hi' : 'en';
  const tgtLang = srcLang === 'hi' ? 'en' : 'hi';
  
  const srcSuffix = srcLang === 'hi' ? 'Hi' : 'En';
  const tgtSuffix = tgtLang === 'hi' ? 'Hi' : 'En';

  // Check if needs translation
  if (!opts.force && opts.resume) {
    const hasSrc = q[`questionText${srcSuffix}`]?.trim();
    const hasTgt = q[`questionText${tgtSuffix}`]?.trim();
    if (hasSrc && hasTgt) return false;
  }

  const textsToTranslate = [];
  const meta = [];

  // ═══ Text fields ═══
  const textFieldPairs = [
    ['questionText', 'questionText'],
    ['explanation', 'explanation'],
    ['assertion', 'assertion'],
    ['reason', 'reason'],
    ['passage', 'passage'],
    ['caseletText', 'caseletText'],
    ['diTitle', 'diTitle'],
  ];

  for (const [srcBase, tgtBase] of textFieldPairs) {
    const srcField = `${srcBase}${srcSuffix}`;
    const tgtField = `${tgtBase}${tgtSuffix}`;
    
    if (q[srcField] && typeof q[srcField] === 'string' && q[srcField].trim()) {
      if (opts.force || !q[tgtField] || !q[tgtField].trim()) {
        textsToTranslate.push(q[srcField]);
        meta.push({ field: tgtField, type: 'text' });
      }
    }
  }

  // ═══ Array fields ═══
  const arrayFieldPairs = [
    ['options', 'options'],
    ['statements', 'statements'],
    ['listA', 'listA'],
    ['listB', 'listB'],
    ['items', 'items'],
  ];

  for (const [srcBase, tgtBase] of arrayFieldPairs) {
    const srcField = `${srcBase}${srcSuffix}`;
    const tgtField = `${tgtBase}${tgtSuffix}`;
    
    const srcArr = q[srcField];
    if (!Array.isArray(srcArr) || srcArr.length === 0) continue;
    
    if (!opts.force && Array.isArray(q[tgtField]) && q[tgtField].length > 0 &&
        q[tgtField].some(x => x && String(x).trim())) continue;
    
    for (let i = 0; i < srcArr.length; i++) {
      textsToTranslate.push(srcArr[i] || '');
      meta.push({ field: tgtField, type: 'array', index: i, totalLen: srcArr.length });
    }
  }

  // ═══ Sub-questions ═══
  if (Array.isArray(q.subQuestions)) {
    for (let si = 0; si < q.subQuestions.length; si++) {
      const sq = q.subQuestions[si];
      
      // Sub-question text
      const sqSrcField = `questionText${srcSuffix}`;
      const sqTgtField = `questionText${tgtSuffix}`;
      if (sq[sqSrcField] && sq[sqSrcField].trim() && (opts.force || !sq[sqTgtField] || !sq[sqTgtField].trim())) {
        textsToTranslate.push(sq[sqSrcField]);
        meta.push({ field: `sub.${si}.${sqTgtField}`, type: 'text' });
      }

      // Sub-question explanation
      const sqExpSrc = `explanation${srcSuffix}`;
      const sqExpTgt = `explanation${tgtSuffix}`;
      if (sq[sqExpSrc] && sq[sqExpSrc].trim() && (opts.force || !sq[sqExpTgt] || !sq[sqExpTgt].trim())) {
        textsToTranslate.push(sq[sqExpSrc]);
        meta.push({ field: `sub.${si}.${sqExpTgt}`, type: 'text' });
      }

      // Sub-question options
      const sqOptSrc = `options${srcSuffix}`;
      const sqOptTgt = `options${tgtSuffix}`;
      if (Array.isArray(sq[sqOptSrc]) && sq[sqOptSrc].length > 0 &&
          (opts.force || !Array.isArray(sq[sqOptTgt]) || sq[sqOptTgt].length === 0)) {
        for (let oi = 0; oi < sq[sqOptSrc].length; oi++) {
          textsToTranslate.push(sq[sqOptSrc][oi] || '');
          meta.push({ field: `sub.${si}.${sqOptTgt}`, type: 'array', index: oi, totalLen: sq[sqOptSrc].length });
        }
      }
    }
  }

  if (textsToTranslate.length === 0) return false;

  if (opts.dryRun) {
    STATS.fieldsTranslated += textsToTranslate.length;
    return true;
  }

  // ═══ Translate ═══
  const translated = await translateTexts(textsToTranslate, srcLang, tgtLang, opts.delay);

  // ═══ Apply ═══
  const arrayBuffers = {};

  for (let i = 0; i < meta.length; i++) {
    const m = meta[i];
    let tr = postProcess(translated[i] || '', tgtLang);

    if (m.field.startsWith('sub.')) {
      const parts = m.field.split('.');
      const si = parseInt(parts[1]);
      const sf = parts[2];
      
      if (m.type === 'text') {
        if (q.subQuestions[si]) q.subQuestions[si][sf] = tr;
      } else {
        const bufKey = m.field;
        if (!arrayBuffers[bufKey]) {
          arrayBuffers[bufKey] = { si, sf, arr: new Array(m.totalLen).fill('') };
        }
        arrayBuffers[bufKey].arr[m.index] = tr;
      }
    } else if (m.type === 'text') {
      q[m.field] = tr;
    } else {
      const bufKey = m.field;
      if (!arrayBuffers[bufKey]) {
        arrayBuffers[bufKey] = { field: m.field, arr: new Array(m.totalLen).fill('') };
      }
      arrayBuffers[bufKey].arr[m.index] = tr;
    }

    STATS.fieldsTranslated++;
  }

  // Apply array buffers
  for (const buf of Object.values(arrayBuffers)) {
    if (buf.si !== undefined) {
      if (q.subQuestions[buf.si]) q.subQuestions[buf.si][buf.sf] = buf.arr;
    } else {
      q[buf.field] = buf.arr;
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════
//  PROCESS REGULAR QUESTIONS
// ═══════════════════════════════════════════════════
async function processRegularQuestions(opts) {
  const Question = require('../models/Question');
  
  const filter = { isActive: { $ne: false } };
  if (opts.paper) filter.paper = opts.paper;

  const totalCount = await Question.countDocuments(filter);
  const limit = Math.min(opts.limit, totalCount);
  
  log(`📋 Regular Questions: ${totalCount} found, processing ${limit}`);

  const questions = await Question.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    try {
      const wasTranslated = await translateRegularQuestion(q, opts);
      
      if (wasTranslated) {
        if (!opts.dryRun) {
          q.updatedAt = new Date();
          await q.save();
        }
        STATS.questionsTranslated++;
      } else {
        STATS.questionsSkipped++;
      }
    } catch (err) {
      logError(`Q#${q.questionNumber || i}: ${err.message}`);
      STATS.questionsErrored++;
    }

    STATS.questionsProcessed++;

    if ((i + 1) % 20 === 0 || i === questions.length - 1) {
      logProgress(i + 1, questions.length, `| Translated: ${STATS.questionsTranslated}`);
    }
  }
}

// ═══════════════════════════════════════════════════
//  PROCESS PYQ QUESTIONS
// ═══════════════════════════════════════════════════
async function processPYQQuestions(opts) {
  const PYQAnalysis = require('../models/PYQAnalysis');
  
  const filter = { isActive: true };
  if (opts.paper) filter.paper = opts.paper;

  const pyqDocs = await PYQAnalysis.find(filter).sort({ year: -1 });
  
  let totalPYQQuestions = 0;
  pyqDocs.forEach(d => { totalPYQQuestions += (d.questionTopicMap || []).length; });
  
  const limit = Math.min(opts.limit, totalPYQQuestions);
  log(`📄 PYQ Questions: ${pyqDocs.length} docs, ${totalPYQQuestions} questions, processing ${limit}`);

  let processed = 0;

  for (const doc of pyqDocs) {
    if (processed >= limit) break;

    const qtm = doc.questionTopicMap || [];
    if (qtm.length === 0) continue;

    log(`\n  📄 ${doc.displayLabel} — ${qtm.length} questions`);
    let docChanged = false;

    for (let qi = 0; qi < qtm.length; qi++) {
      if (processed >= limit) break;
      
      const q = qtm[qi];

      try {
        const wasTranslated = await translatePYQQuestion(q, opts);
        
        if (wasTranslated) {
          docChanged = true;
          STATS.pyqQuestionsTranslated++;
        }
      } catch (err) {
        logError(`PYQ Q${q.qNo}: ${err.message}`);
        STATS.questionsErrored++;
      }

      STATS.pyqQuestionsProcessed++;
      processed++;

      if (processed % 20 === 0) {
        logProgress(processed, limit, `| PYQ translated: ${STATS.pyqQuestionsTranslated}`);
      }
    }

    // Save document
    if (docChanged && !opts.dryRun) {
      doc.markModified('questionTopicMap');
      doc.updatedAt = new Date();
      await doc.save();
      log(`  💾 Saved: ${doc.displayLabel}`);
    }

    STATS.pyqDocsProcessed++;
  }
}

// ═══════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════
async function main() {
  const opts = parseArgs();
  startTime = Date.now();

  console.log('\n' + '═'.repeat(65));
  console.log('  🔄 COMPLETE RE-TRANSLATION SCRIPT v3.0');
  console.log('═'.repeat(65));
  console.log(`  Target:      ${opts.target}`);
  console.log(`  Paper:       ${opts.paper || 'All'}`);
  console.log(`  Force:       ${opts.force ? '✅ Re-translate ALL' : '❌ Only missing'}`);
  console.log(`  Mode:        ${opts.dryRun ? '🔍 DRY RUN' : '💾 LIVE'}`);
  console.log(`  Limit:       ${opts.limit}`);
  console.log(`  Delay:       ${opts.delay}ms`);
  console.log(`  Resume:      ${opts.resume ? '✅' : '❌'}`);
  console.log('═'.repeat(65) + '\n');

  // ═══ Connect MongoDB ═══
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
    
    let mongoURI;
    try {
      const config = require(path.join(__dirname, '..', 'config', 'config'));
      mongoURI = config.db?.uri || config.database?.uri;
    } catch (e) {}
    
    mongoURI = mongoURI || process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoURI) {
      logError('MongoDB URI not found! Set MONGODB_URI in .env');
      process.exit(1);
    }

    log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    log('✅ Connected to MongoDB');
  } catch (err) {
    logError(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  // Load models
  try { require('../models/Question'); } catch (e) {}
  try { require('../models/PYQAnalysis'); } catch (e) {}
  try { require('../models/Counter'); } catch (e) {}
  try { require('../models/Passage'); } catch (e) {}
  try { require('../models/DIData'); } catch (e) {}

  // ═══ Init Google Translate ═══
  log('🌐 Initializing Google Translate...');
  const gtOk = await initGoogle();
  
  if (!gtOk && !opts.dryRun) {
    logError('Cannot proceed without Google Translate');
    process.exit(1);
  }

  // ═══ Process ═══
  if (opts.target === 'questions' || opts.target === 'both') {
    log('\n' + '─'.repeat(50));
    log('📝 PROCESSING REGULAR QUESTIONS');
    log('─'.repeat(50));
    await processRegularQuestions(opts);
  }

  if (opts.target === 'pyq' || opts.target === 'both') {
    log('\n' + '─'.repeat(50));
    log('📄 PROCESSING PYQ QUESTIONS');
    log('─'.repeat(50));
    await processPYQQuestions(opts);
  }

  // ═══ Summary ═══
  const totalSec = Math.round((Date.now() - startTime) / 1000);
  const totalMin = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;

  console.log('\n' + '═'.repeat(65));
  console.log('  📊 FINAL RESULTS');
  console.log('═'.repeat(65));
  console.log(`  Regular Questions:`);
  console.log(`    Processed:     ${STATS.questionsProcessed}`);
  console.log(`    Translated:    ${STATS.questionsTranslated}`);
  console.log(`    Skipped:       ${STATS.questionsSkipped}`);
  console.log(`  PYQ Questions:`);
  console.log(`    Docs:          ${STATS.pyqDocsProcessed}`);
  console.log(`    Processed:     ${STATS.pyqQuestionsProcessed}`);
  console.log(`    Translated:    ${STATS.pyqQuestionsTranslated}`);
  console.log(`  Totals:`);
  console.log(`    Fields done:   ${STATS.fieldsTranslated}`);
  console.log(`    API calls:     ${STATS.apiCalls}`);
  console.log(`    Errors:        ${STATS.questionsErrored}`);
  console.log(`    Time:          ${totalMin}m ${remSec}s`);
  console.log(`    Mode:          ${opts.dryRun ? '🔍 DRY RUN' : '💾 SAVED'}`);
  console.log('═'.repeat(65) + '\n');

  await mongoose.disconnect();
  log('🔌 Disconnected. Done! ✅\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n💥 FATAL:', err);
  console.error(err.stack);
  process.exit(1);
});