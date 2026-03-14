// client/src/utils/textParser.js
// ═══════════════════════════════════════════════════════════
// SMART TEXT-TO-JSON PARSER v4 — Handles ALL question types
// MCQ, Assertion-Reason, Match Following, Statement Based,
// Sequence Order — Hindi + English + Mixed
// ═══════════════════════════════════════════════════════════

const IDX = { A:0,B:1,C:2,D:3,E:4, a:0,b:1,c:2,d:3,e:4, '1':0,'2':1,'3':2,'4':3,'5':4, 'अ':0,'आ':1,'इ':2,'ई':3,'उ':4 };

// ── Regexes (NO global flag for .test() — prevents stateful bugs) ──
const R_QSTART     = /^(?:Q\.?\s*|प्र(?:श्न)?\.?\s*)\d{1,3}\s*[\.\):\-\|]/i;
const R_STRIP_QNUM = /^(?:Q\.?\s*|प्र(?:श्न)?\.?\s*)?\d{1,3}\s*[\.\):\-\|]\s*/i;
const R_ANSWER     = /^(?:Ans(?:wer)?|उत्तर|correct\s*(?:answer)?|सही\s*(?:उत्तर)?)\s*[:\-=\s]\s*\(?([A-Ea-e1-5])\)?/i;
const R_EXPL       = /^(?:Exp(?:lanation)?|व्याख्या|Hint|Solution|हल|स्पष्टीकरण|Note|Soln?)\s*[:\-=]\s*/i;
const R_ASSERT     = /^(?:अभिकथन|Assertion)\s*\(?\s*A\s*\)?\s*[:\-=]\s*/i;
const R_REASON     = /^(?:कारण|Reason)\s*\(?\s*R\s*\)?\s*[:\-=]\s*/i;
const R_SEP        = /^[\s\-=_*─━]{3,}$/;

// For correct-answer markers: use separate regexes for test vs replace
const R_MARK_TEST  = /[\*✓✅√✔⭐]|\(correct\)|\(सही\)/i;          // NO g flag
const R_MARK_STRIP = /[\*✓✅√✔⭐]|\(correct\)|\(सही\)|\(right\)/gi; // g flag for replace

// Type detection keywords
const KW_MATCH = /(?:सूची|list|सुमेलित|match\s*(?:the\s*)?following|match\s*list)/i;
const KW_STMT  = /(?:कथन(?:ों)?|statement|निम्नलिखित कथनों|consider the following|following statements|इन कथनों)/i;
const KW_SEQ   = /(?:कालक्रम|chronolog|arrange.*order|व्यवस्थित|correct order|सही क्रम|ascending|descending)/i;

// Match-following item pattern: "(A) text  (i) text" or "(A) text - (i) text"
const R_MATCH_DUAL = /^\s*\(?([A-Da-d])\)?\s*[.\):]?\s*(.+?)\s{2,}[-–—]?\s*\(?([ivx]{1,4}|[1-4])\)?\s*[.\):]?\s*(.+)/i;
const R_MATCH_DASH = /^\s*\(?([A-Da-d])\)?\s*[.\):]?\s*(.+?)\s*[-–—]\s*\(?([ivx]{1,4}|[1-4])\)?\s*[.\):]?\s*(.+)/i;

// Roman numeral for list-II
const R_ROMAN_ITEM = /^\s*\(?([ivx]{1,4})\)?\s*[.\):]?\s*(.+)/i;

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════
export function parseText(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return empty();
  }

  const { defaultType = 'mcq', language: forceLang = 'auto', paper = '', unit = '', chapter = '', topic = '', difficulty = 'medium', source = '' } = options;
  const lang = forceLang === 'auto' ? detectLang(rawText) : forceLang;
  const other = lang === 'hi' ? 'en' : 'hi';

  // 1. Tokenize lines
  const tokens = tokenize(rawText);

  // 2. Group into question blocks
  const blocks = groupBlocks(tokens);

  // 3. Parse each block
  const questions = [];
  for (let i = 0; i < blocks.length; i++) {
    const parsed = parseBlock(blocks[i], lang, other, defaultType);
    if (!parsed) continue;

    // Validate: skip junk blocks
    const opts = parsed.options?.[lang] || parsed.options?.hi || [];
    if (opts.length < 2 && parsed.questionType === 'mcq') continue;

    parsed._previewId = `txt_${questions.length}`;
    parsed.paper = paper; parsed.unit = unit; parsed.chapter = chapter;
    parsed.topic = topic; parsed.difficulty = difficulty; parsed.source = source;
    questions.push(parsed);
  }

  return { questions, stats: calcStats(questions, lang), issues: findIssues(questions, lang), language: lang };
}

export function toImportJSON(questions, meta = {}) {
  const lang = meta.language || 'hi';
  return {
    language: lang, paper: meta.paper || 'paper1', unit: meta.unit || '',
    chapter: meta.chapter || '', topic: meta.topic || '',
    difficulty: meta.difficulty || 'medium', source: meta.source || 'Text Import',
    questions: questions.map(q => {
      const b = { type: q.questionType, question: q.question?.[lang] || '', options: q.options?.[lang] || [], correct: q.correctAnswer ?? 0, explanation: q.explanation?.[lang] || '' };
      if (q.questionType === 'assertion_reason' && q.assertionReasonData) { b.assertion = q.assertionReasonData.assertion?.[lang] || ''; b.reason = q.assertionReasonData.reason?.[lang] || ''; }
      if (q.questionType === 'match_following' && q.matchData) { b.listA = q.matchData.listA?.[lang] || []; b.listB = q.matchData.listB?.[lang] || []; b.correctMatch = q.matchData.correctMatch || []; b.question = q.question?.[lang] || ''; }
      if (q.questionType === 'statement_based' && q.statementData) { b.statements = q.statementData.statements?.[lang] || []; b.correctStatements = q.statementData.correctStatements || []; }
      if (q.questionType === 'sequence_order' && q.sequenceData) { b.items = q.sequenceData.items?.[lang] || []; b.correctOrder = q.sequenceData.correctOrder || []; }
      return b;
    }),
  };
}

function empty() { return { questions: [], stats: { total: 0, byType: {}, avgConfidence: 0, withAnswer: 0, withExplanation: 0 }, issues: [], language: 'hi' }; }

// ═══════════════════════════════════════════════════════════
// LANGUAGE DETECTION
// ═══════════════════════════════════════════════════════════
function detectLang(text) {
  const s = text.substring(0, 3000);
  const hi = (s.match(/[\u0900-\u097F]/g) || []).length;
  const en = (s.match(/[a-zA-Z]/g) || []).length;
  return hi > en * 0.15 ? 'hi' : 'en';
}

// ═══════════════════════════════════════════════════════════
// TOKENIZE — classify each line
// ═══════════════════════════════════════════════════════════
const T = { Q: 'q', OPT: 'opt', ANS: 'ans', EXP: 'exp', ASSERT: 'assert', REASON: 'reason', MATCH_HDR: 'match_hdr', MATCH_ITEM: 'match_item', NUMBERED: 'numbered', TEXT: 'text', BLANK: 'blank' };

function tokenize(rawText) {
  return rawText.split('\n').map((raw, lineNo) => {
    const t = raw.trim();
    if (!t) return { type: T.BLANK, text: '', raw, lineNo };
    if (R_SEP.test(t)) return { type: T.BLANK, text: '', raw, lineNo };

    // Q-prefix start
    if (R_QSTART.test(t)) return { type: T.Q, text: t.replace(R_STRIP_QNUM, '').trim(), raw: t, lineNo };

    // Assertion
    if (R_ASSERT.test(t)) return { type: T.ASSERT, text: t.replace(R_ASSERT, '').trim(), raw: t, lineNo };

    // Reason
    if (R_REASON.test(t)) return { type: T.REASON, text: t.replace(R_REASON, '').trim(), raw: t, lineNo };

    // Answer
    const am = t.match(R_ANSWER);
    if (am) return { type: T.ANS, text: am[1].toUpperCase(), raw: t, lineNo };

    // Explanation
    if (R_EXPL.test(t)) return { type: T.EXP, text: t.replace(R_EXPL, '').trim(), raw: t, lineNo };

    // Match dual-item line: "(A) text  (i) text"
    const mdm = t.match(R_MATCH_DUAL) || t.match(R_MATCH_DASH);
    if (mdm) {
      return { type: T.MATCH_ITEM, listALabel: mdm[1].toUpperCase(), listAText: mdm[2].trim(), listBLabel: mdm[3].toLowerCase(), listBText: mdm[4].trim(), raw: t, lineNo };
    }

    // Option: (A) text, A) text, a. text, (1) text, (अ) text
    const opt = matchOption(t);
    if (opt) return { type: T.OPT, ...opt, raw: t, lineNo };

    // Match header: सूची-I, List-I, सूची-II, List-II
    if (/^(?:सूची|List)\s*[-–]?\s*(?:I{1,2}|[12AB])\s*$/i.test(t)) {
      return { type: T.MATCH_HDR, text: t, raw: t, lineNo };
    }

    // Numbered text: 1. text, I. text, (1) text — for statements/sequence items
    const nm = t.match(/^\s*(?:कथन\s*)?(\d+|[IVXivx]+)\s*[\.\):\-]\s*(.+)/);
    if (nm && nm[2].length > 3) {
      return { type: T.NUMBERED, number: nm[1], text: nm[2].trim(), raw: t, lineNo };
    }

    // Plain text
    return { type: T.TEXT, text: t, raw: t, lineNo };
  });
}

// ═══════════════════════════════════════════════════════════
// OPTION MATCHING — handles all formats
// ═══════════════════════════════════════════════════════════
function matchOption(line) {
  const t = line.trim();
  let m;

  // (A) text / (a) text
  m = t.match(/^\s*\(([A-Ea-e])\)\s*(.+)/);
  if (m) return mkOpt(m[1], m[2]);

  // A) text / a) text
  m = t.match(/^\s*([A-Ea-e])\)\s*(.+)/);
  if (m) return mkOpt(m[1], m[2]);

  // A. text / a. text (but NOT "A. Something" where A could be assertion label)
  m = t.match(/^\s*([A-Ea-e])\.\s+(.+)/);
  if (m && m[2].length > 0) return mkOpt(m[1], m[2]);

  // (1) text / 1) text (number options)
  m = t.match(/^\s*\(?([1-5])\)\s*(.+)/);
  if (m) return mkOpt(m[1], m[2]);

  // Hindi: (अ) text / अ) text
  m = t.match(/^\s*\(?([अआइईउऊ])\)?\s*[\.\):]?\s*(.+)/);
  if (m && m[2].length > 0) return mkOpt(m[1], m[2]);

  return null;
}

function mkOpt(label, text) {
  const hasMark = R_MARK_TEST.test(text);
  const clean = text.replace(R_MARK_STRIP, '').trim();
  return { label: label.toUpperCase ? label.toUpperCase() : label, text: clean, index: IDX[label] ?? IDX[label?.toUpperCase?.()] ?? -1, hasMarker: hasMark };
}

// ═══════════════════════════════════════════════════════════
// GROUPING — split tokens into question blocks
// ═══════════════════════════════════════════════════════════
function groupBlocks(tokens) {
  const blocks = [];
  let cur = [];
  let hasOptions = false;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    // Skip blanks at the start
    if (tok.type === T.BLANK && cur.length === 0) continue;

    // New question detected?
    const isNewQ = tok.type === T.Q;

    // Also detect numbered lines as new questions IF we already have options
    // (meaning the previous question is complete)
    const isNumberedNewQ = tok.type === T.NUMBERED && hasOptions && /^\d+$/.test(tok.number) && parseInt(tok.number) > 1;

    if ((isNewQ || isNumberedNewQ) && cur.length > 0) {
      blocks.push(cur);
      cur = [];
      hasOptions = false;
    }

    // Blank line after a complete question (has options) → could be separator
    if (tok.type === T.BLANK && cur.length > 0 && hasOptions) {
      // Check if next non-blank is a new question
      const next = peekNonBlank(tokens, i + 1);
      if (!next || next.type === T.Q || (next.type === T.NUMBERED && /^\d+$/.test(next.number))) {
        blocks.push(cur);
        cur = [];
        hasOptions = false;
        continue;
      }
    }

    if (tok.type === T.BLANK) continue; // skip other blanks

    if (tok.type === T.OPT) hasOptions = true;
    cur.push(tok);
  }

  if (cur.length > 0) blocks.push(cur);
  return blocks;
}

function peekNonBlank(tokens, start) {
  for (let i = start; i < tokens.length && i < start + 5; i++) {
    if (tokens[i].type !== T.BLANK) return tokens[i];
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// PARSE BLOCK — detect type and parse
// ═══════════════════════════════════════════════════════════
function parseBlock(tokens, lang, other, defType) {
  if (!tokens || tokens.length === 0) return null;

  const type = detectType(tokens, defType);

  switch (type) {
    case 'assertion_reason': return parseAR(tokens, lang, other);
    case 'match_following': return parseMatch(tokens, lang, other);
    case 'statement_based': return parseStmt(tokens, lang, other);
    case 'sequence_order': return parseSeq(tokens, lang, other);
    default: return parseMCQ(tokens, lang, other);
  }
}

function detectType(tokens, defType) {
  // Check for assertion/reason tokens
  if (tokens.some(t => t.type === T.ASSERT || t.type === T.REASON)) return 'assertion_reason';

  // Check text content for keywords
  const allText = tokens.map(t => t.text || t.raw || '').join(' ');

  // Check for match items or match keywords
  if (tokens.some(t => t.type === T.MATCH_ITEM || t.type === T.MATCH_HDR) || KW_MATCH.test(allText)) return 'match_following';

  // Check sequence keywords (before statement — "arrange" is more specific)
  if (KW_SEQ.test(allText)) return 'sequence_order';

  // Check statement keywords + numbered items before options
  if (KW_STMT.test(allText)) {
    const firstOpt = tokens.findIndex(t => t.type === T.OPT);
    const numberedBeforeOpt = tokens.filter((t, i) => t.type === T.NUMBERED && (firstOpt < 0 || i < firstOpt)).length;
    if (numberedBeforeOpt >= 2) return 'statement_based';
  }

  // Check if there are 2+ numbered items before options (could be statement-based without keyword)
  const firstOptIdx = tokens.findIndex(t => t.type === T.OPT);
  if (firstOptIdx > 0) {
    const numberedBefore = tokens.slice(0, firstOptIdx).filter(t => t.type === T.NUMBERED).length;
    // If 3+ numbered items before options, likely statement-based
    if (numberedBefore >= 3) return 'statement_based';
  }

  return defType || 'mcq';
}

// ═══════════════════════════════════════════════════════════
// MCQ PARSER
// ═══════════════════════════════════════════════════════════
function parseMCQ(tokens, lang, other) {
  let qText = '';
  const opts = [];
  let correct = -1;
  let exp = '';
  let inExp = false;

  for (const tok of tokens) {
    if (inExp) { exp += ' ' + (tok.text || tok.raw); continue; }
    if (tok.type === T.EXP) { exp = tok.text; inExp = true; continue; }
    if (tok.type === T.ANS) { correct = IDX[tok.text] ?? -1; continue; }
    if (tok.type === T.OPT) {
      if (tok.hasMarker) correct = opts.length;
      opts.push(tok.text);
      continue;
    }
    // Question text (Q_START text, TEXT, NUMBERED that isn't an option)
    if (tok.type === T.Q || tok.type === T.TEXT || tok.type === T.NUMBERED) {
      const t = tok.type === T.Q ? tok.text : (tok.type === T.NUMBERED ? tok.raw.replace(/^\s*(?:Q\.?\s*|प्र(?:श्न)?\.?\s*)?\d{1,3}\s*[\.\):\-\|]\s*/i, '').trim() : tok.text);
      if (t) qText += (qText ? ' ' : '') + t;
    }
  }

  if (!qText && opts.length === 0) return null;
  if (opts.length < 2) return null;

  return mkResult('mcq', qText, opts, correct, exp, lang, other, {});
}

// ═══════════════════════════════════════════════════════════
// ASSERTION-REASON PARSER
// ═══════════════════════════════════════════════════════════
function parseAR(tokens, lang, other) {
  let qText = '', assertion = '', reason = '';
  const opts = [];
  let correct = -1;
  let exp = '';
  let mode = 'pre'; // pre, assert, reason, opts, exp

  for (const tok of tokens) {
    if (tok.type === T.EXP) { exp = tok.text; mode = 'exp'; continue; }
    if (mode === 'exp') { exp += ' ' + (tok.text || tok.raw); continue; }
    if (tok.type === T.ANS) { correct = IDX[tok.text] ?? -1; continue; }
    if (tok.type === T.ASSERT) { assertion = tok.text; mode = 'assert'; continue; }
    if (tok.type === T.REASON) { reason = tok.text; mode = 'reason'; continue; }
    if (tok.type === T.OPT) {
      if (tok.hasMarker) correct = opts.length;
      opts.push(tok.text);
      mode = 'opts';
      continue;
    }
    // Continuation text
    if (mode === 'assert') assertion += ' ' + (tok.text || tok.raw);
    else if (mode === 'reason') reason += ' ' + (tok.text || tok.raw);
    else if (mode === 'pre' || mode === 'opts') {
      const t = tok.type === T.Q ? tok.text : (tok.text || '');
      if (t && mode === 'pre') qText += (qText ? ' ' : '') + t;
    }
  }

  if (!assertion && !reason) return parseMCQ(tokens, lang, other);

  return mkResult('assertion_reason', qText, opts, correct, exp, lang, other, {
    assertionReasonData: { assertion: { [lang]: assertion.trim(), [other]: '' }, reason: { [lang]: reason.trim(), [other]: '' } }
  });
}

// ═══════════════════════════════════════════════════════════
// MATCH FOLLOWING PARSER
// ═══════════════════════════════════════════════════════════
function parseMatch(tokens, lang, other) {
  let qText = '';
  const listA = [], listB = [];
  const opts = [];
  let correct = -1;
  let exp = '';
  let inExp = false;
  let collectingMatchItems = false;
  let matchItemsDone = false;

  for (const tok of tokens) {
    if (inExp) { exp += ' ' + (tok.text || tok.raw); continue; }
    if (tok.type === T.EXP) { exp = tok.text; inExp = true; continue; }
    if (tok.type === T.ANS) { correct = IDX[tok.text] ?? -1; continue; }

    // Match data items
    if (tok.type === T.MATCH_ITEM) {
      listA.push(tok.listAText);
      listB.push(tok.listBText);
      collectingMatchItems = true;
      continue;
    }

    // Match header line (सूची-I, List-II) — skip, used for detection only
    if (tok.type === T.MATCH_HDR) { collectingMatchItems = true; continue; }

    // Options (come after match items)
    if (tok.type === T.OPT) {
      if (collectingMatchItems) matchItemsDone = true;
      if (tok.hasMarker) correct = opts.length;
      opts.push(tok.text);
      continue;
    }

    // If we haven't started collecting match items yet, this is question text
    if (!collectingMatchItems && !matchItemsDone) {
      const t = tok.type === T.Q ? tok.text : (tok.text || '');
      if (t) qText += (qText ? ' ' : '') + t;
    }

    // Try to parse lines after header as match items
    // Pattern: "(A) item" on one line → listA item
    // Then "(i) item" → listB item
    if (collectingMatchItems && !matchItemsDone && tok.type === T.TEXT) {
      // Try to split "(A) text (i) text" from raw
      const dm = tok.raw?.match(R_MATCH_DUAL) || tok.raw?.match(R_MATCH_DASH);
      if (dm) {
        listA.push(dm[2].trim());
        listB.push(dm[4].trim());
        continue;
      }

      // Try single-sided: just an (A)/(B) item for listA
      const optLike = matchOption(tok.raw);
      if (optLike && /^[A-D]$/i.test(optLike.label) && !matchItemsDone) {
        listA.push(optLike.text);
        continue;
      }

      // Try roman numeral item for listB
      const rm = tok.raw?.match(R_ROMAN_ITEM);
      if (rm) {
        listB.push(rm[2].trim());
        continue;
      }
    }
  }

  // Default question text
  if (!qText) qText = lang === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:';

  // Build match data
  const matchData = (listA.length > 0 || listB.length > 0) ? {
    listA: { [lang]: listA, [other]: [] },
    listB: { [lang]: listB, [other]: [] },
    correctMatch: listA.map((_, i) => i),
  } : undefined;

  return mkResult('match_following', qText, opts, correct, exp, lang, other, { matchData });
}

// ═══════════════════════════════════════════════════════════
// STATEMENT BASED PARSER
// ═══════════════════════════════════════════════════════════
function parseStmt(tokens, lang, other) {
  let qText = '';
  const stmts = [];
  const opts = [];
  let correct = -1;
  let exp = '';
  let inExp = false;
  let stmtStarted = false;

  for (const tok of tokens) {
    if (inExp) { exp += ' ' + (tok.text || tok.raw); continue; }
    if (tok.type === T.EXP) { exp = tok.text; inExp = true; continue; }
    if (tok.type === T.ANS) { correct = IDX[tok.text] ?? -1; continue; }

    // Options (come after statements)
    if (tok.type === T.OPT && stmtStarted) {
      if (tok.hasMarker) correct = opts.length;
      opts.push(tok.text);
      continue;
    }

    // Numbered items → statements
    if (tok.type === T.NUMBERED) {
      stmts.push(tok.text);
      stmtStarted = true;
      continue;
    }

    // Before statements → question text
    if (!stmtStarted) {
      const t = tok.type === T.Q ? tok.text : (tok.text || '');
      if (t) {
        qText += (qText ? ' ' : '') + t;
        // Check if this line has statement keyword → next numbered items are statements
        if (KW_STMT.test(t)) stmtStarted = true;
      }
    }
  }

  if (stmts.length < 2) return parseMCQ(tokens, lang, other);

  if (!qText) qText = lang === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:';

  return mkResult('statement_based', qText, opts, correct, exp, lang, other, {
    statementData: { statements: { [lang]: stmts, [other]: [] }, correctStatements: [] }
  });
}

// ═══════════════════════════════════════════════════════════
// SEQUENCE ORDER PARSER (reuses statement logic)
// ═══════════════════════════════════════════════════════════
function parseSeq(tokens, lang, other) {
  const r = parseStmt(tokens, lang, other);
  if (r && r.statementData) {
    r.questionType = 'sequence_order';
    const items = r.statementData.statements;
    const len = items[lang]?.length || 0;
    r.sequenceData = { items, correctOrder: Array.from({ length: len }, (_, i) => i) };
    delete r.statementData;
  } else if (r) {
    r.questionType = 'sequence_order';
  }
  return r;
}

// ═══════════════════════════════════════════════════════════
// RESULT BUILDER
// ═══════════════════════════════════════════════════════════
function mkResult(type, qText, opts, correct, exp, lang, other, extra) {
  const c = correct >= 0 ? correct : 0;
  const conf = calcConf(qText, opts, correct, exp);
  return {
    questionType: type,
    question: { [lang]: qText.trim(), [other]: '' },
    options: { [lang]: opts, [other]: [] },
    correctAnswer: c,
    explanation: { [lang]: exp.trim(), [other]: '' },
    _confidence: conf,
    _correctDetected: correct >= 0,
    _warnings: correct < 0 ? ['Correct answer not detected'] : [],
    ...extra,
  };
}

function calcConf(q, opts, correct, exp) {
  let s = 10;
  if (q && q.length > 10) s += 25; else if (q) s += 15;
  if (opts.length >= 4) s += 25; else if (opts.length >= 2) s += 15;
  if (correct >= 0 && correct < opts.length) s += 25; else if (correct >= 0) s += 15;
  if (exp && exp.length > 5) s += 10;
  if (opts.length === 4 && correct >= 0 && correct < 4) s += 5;
  return Math.min(s, 100);
}

// ═══════════════════════════════════════════════════════════
// STATS & ISSUES
// ═══════════════════════════════════════════════════════════
function calcStats(qs, lang) {
  const bt = {};
  let tc = 0, wa = 0, we = 0;
  qs.forEach(q => { bt[q.questionType] = (bt[q.questionType] || 0) + 1; tc += q._confidence || 0; if (q._correctDetected) wa++; if ((q.explanation?.[lang] || '').length > 3) we++; });
  return { total: qs.length, byType: bt, avgConfidence: qs.length ? Math.round(tc / qs.length) : 0, withAnswer: wa, withExplanation: we };
}

function findIssues(qs, lang) {
  const is = [];
  qs.forEach((q, i) => {
    if (!q._correctDetected) is.push({ index: i, type: 'warning', msg: `Q${i + 1}: Correct answer not detected` });
    const opts = q.options?.[lang] || [];
    if (opts.length < 2 && q.questionType !== 'match_following') is.push({ index: i, type: 'error', msg: `Q${i + 1}: Less than 2 options` });
    else if (opts.length < 4 && opts.length >= 2) is.push({ index: i, type: 'warning', msg: `Q${i + 1}: Only ${opts.length} options` });
    const t = q.question?.[lang] || '';
    if (t.length < 3 && q.questionType !== 'assertion_reason') is.push({ index: i, type: 'warning', msg: `Q${i + 1}: Short question text` });
    if (q.questionType === 'match_following') {
      const la = q.matchData?.listA?.[lang] || [];
      if (la.length === 0) is.push({ index: i, type: 'info', msg: `Q${i + 1}: Match data not extracted (edit manually)` });
    }
  });
  return is;
}

export default { parseText, toImportJSON };