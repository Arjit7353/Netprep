// server/utils/pyqTranslateHelper.js
// ═══════════════════════════════════════════════════════════════
//  PYQ Translation Helper v5.0 — PRODUCTION GRADE
//  - Pre-translation text cleaning (stuck words separation)
//  - Post-translation keyword fixing (NOT→नहीं in Hindi)
//  - Post-translation spacing normalization
//  - Mixed language detection & flagging
//  - Fast field swap (single pass)
//  - Parallel translation with higher concurrency
// ═══════════════════════════════════════════════════════════════

const translateHelper = require('./translateHelper');

const HINDI_RE = /[\u0900-\u097F]/;

class PYQTranslateHelper {
  constructor() {
    this.stats = { 
      totalFields: 0, translated: 0, skipped: 0, failed: 0, 
      direction: '', fieldsSwapped: 0, timeMs: 0, 
      preCleaned: 0, spacingFixed: 0, keywordsFixed: 0 
    };
  }

  resetStats() {
    this.stats = { 
      totalFields: 0, translated: 0, skipped: 0, failed: 0, 
      direction: '', fieldsSwapped: 0, timeMs: 0, 
      preCleaned: 0, spacingFixed: 0, keywordsFixed: 0 
    };
  }

  // ═══════════════════════════════════════════════════
  //  PRE-CLEAN all text fields before translation
  // ═══════════════════════════════════════════════════
  _preCleanAllFields(qtm) {
    let cleaned = 0;

    const cleanText = (obj, field) => {
      if (obj[field] && typeof obj[field] === 'string' && obj[field].trim()) {
        const before = obj[field];
        obj[field] = translateHelper.preCleanText(obj[field]);
        if (obj[field] !== before) cleaned++;
      }
    };

    const cleanArray = (obj, field) => {
      if (Array.isArray(obj[field])) {
        for (let i = 0; i < obj[field].length; i++) {
          if (obj[field][i] && typeof obj[field][i] === 'string') {
            const before = obj[field][i];
            obj[field][i] = translateHelper.preCleanText(obj[field][i]);
            if (obj[field][i] !== before) cleaned++;
          }
        }
      }
    };

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

    const arrayFields = [
      'options', 'optionsHi', 'optionsEn',
      'statements', 'statementsHi', 'statementsEn',
      'listA', 'listAHi', 'listAEn',
      'listB', 'listBHi', 'listBEn',
      'items', 'itemsHi', 'itemsEn'
    ];

    for (let i = 0; i < qtm.length; i++) {
      const q = qtm[i];
      for (const f of textFields) cleanText(q, f);
      for (const f of arrayFields) cleanArray(q, f);

      if (q.subQuestions) {
        for (let k = 0; k < q.subQuestions.length; k++) {
          const sq = q.subQuestions[k];
          cleanText(sq, 'questionText');
          cleanText(sq, 'questionTextHi');
          cleanText(sq, 'questionTextEn');
          cleanText(sq, 'explanation');
          cleanText(sq, 'explanationHi');
          cleanText(sq, 'explanationEn');
          cleanArray(sq, 'options');
          cleanArray(sq, 'optionsHi');
          cleanArray(sq, 'optionsEn');
        }
      }
    }

    return cleaned;
  }

  // ═══════════════════════════════════════════════════
  //  POST-PROCESS: Normalize spacing + fix keywords
  // ═══════════════════════════════════════════════════
  _postProcessAllFields(qtm) {
    let spacingFixed = 0;
    let keywordsFixed = 0;

    const processText = (obj, field) => {
      if (obj[field] && typeof obj[field] === 'string' && obj[field].trim()) {
        let text = obj[field];
        const beforeSpacing = text;

        // Spacing normalization
        text = translateHelper.normalizeSpacing(text);
        if (text !== beforeSpacing) spacingFixed++;

        // ★ Keyword translation for Hindi fields
        if (field.endsWith('Hi') || (field === 'questionText' && HINDI_RE.test(text))) {
          const beforeKeyword = text;
          text = translateHelper.translateKeywordsInText(text, 'hi');
          if (text !== beforeKeyword) keywordsFixed++;
        }

        obj[field] = text;
      }
    };

    const processArray = (obj, field) => {
      if (Array.isArray(obj[field])) {
        const isHindiField = field.endsWith('Hi');
        for (let i = 0; i < obj[field].length; i++) {
          if (obj[field][i] && typeof obj[field][i] === 'string') {
            let text = obj[field][i];
            const beforeSpacing = text;

            text = translateHelper.normalizeSpacing(text);
            if (text !== beforeSpacing) spacingFixed++;

            if (isHindiField) {
              const beforeKeyword = text;
              text = translateHelper.translateKeywordsInText(text, 'hi');
              if (text !== beforeKeyword) keywordsFixed++;
            }

            obj[field][i] = text;
          }
        }
      }
    };

    const textFields = [
      'questionTextHi', 'questionTextEn',
      'explanationHi', 'explanationEn',
      'assertionHi', 'assertionEn',
      'reasonHi', 'reasonEn',
      'passageHi', 'passageEn',
      'caseletTextHi', 'caseletTextEn',
      'diTitleHi', 'diTitleEn'
    ];

    const arrayFields = [
      'optionsHi', 'optionsEn',
      'statementsHi', 'statementsEn',
      'listAHi', 'listAEn',
      'listBHi', 'listBEn',
      'itemsHi', 'itemsEn'
    ];

    for (let i = 0; i < qtm.length; i++) {
      const q = qtm[i];
      for (const f of textFields) processText(q, f);
      for (const f of arrayFields) processArray(q, f);

      if (q.subQuestions) {
        for (let k = 0; k < q.subQuestions.length; k++) {
          const sq = q.subQuestions[k];
          processText(sq, 'questionTextHi');
          processText(sq, 'questionTextEn');
          processText(sq, 'explanationHi');
          processText(sq, 'explanationEn');
          processArray(sq, 'optionsHi');
          processArray(sq, 'optionsEn');
        }
      }
    }

    return { spacingFixed, keywordsFixed };
  }

  // ═══════════════════════════════════════════════════
  //  FAST field swap — single pass
  // ═══════════════════════════════════════════════════
  _swapText(obj, hi, en) {
    const hv = obj[hi], ev = obj[en];
    const hOk = hv && typeof hv === 'string' && hv.trim();
    const eOk = ev && typeof ev === 'string' && ev.trim();
    if (hOk && !HINDI_RE.test(hv) && !eOk) { obj[en] = hv; obj[hi] = ''; return 1; }
    if (eOk && HINDI_RE.test(ev) && !hOk) { obj[hi] = ev; obj[en] = ''; return 1; }
    return 0;
  }

  _swapArr(obj, hi, en) {
    const ha = obj[hi], ea = obj[en];
    const hOk = Array.isArray(ha) && ha.length > 0 && ha.some(s => s && String(s).trim());
    const eOk = Array.isArray(ea) && ea.length > 0 && ea.some(s => s && String(s).trim());
    if (hOk && !eOk && !ha.some(s => typeof s === 'string' && HINDI_RE.test(s))) {
      obj[en] = ha; obj[hi] = []; return 1;
    }
    if (eOk && !hOk && ea.some(s => typeof s === 'string' && HINDI_RE.test(s))) {
      obj[hi] = ea; obj[en] = []; return 1;
    }
    return 0;
  }

  _fixFields(qtm) {
    let swaps = 0;
    const TP = [
      ['questionTextHi','questionTextEn'], ['explanationHi','explanationEn'],
      ['assertionHi','assertionEn'], ['reasonHi','reasonEn'],
      ['passageHi','passageEn'], ['caseletTextHi','caseletTextEn'],
      ['diTitleHi','diTitleEn'], ['instructionHi','instructionEn']
    ];
    const AP = [
      ['optionsHi','optionsEn'], ['statementsHi','statementsEn'],
      ['listAHi','listAEn'], ['listBHi','listBEn'], ['itemsHi','itemsEn']
    ];

    for (let i = 0; i < qtm.length; i++) {
      const q = qtm[i];
      for (let j = 0; j < TP.length; j++) swaps += this._swapText(q, TP[j][0], TP[j][1]);
      for (let j = 0; j < AP.length; j++) swaps += this._swapArr(q, AP[j][0], AP[j][1]);
      if (q.subQuestions) {
        for (let k = 0; k < q.subQuestions.length; k++) {
          const sq = q.subQuestions[k];
          swaps += this._swapText(sq, 'questionTextHi', 'questionTextEn');
          swaps += this._swapText(sq, 'explanationHi', 'explanationEn');
          swaps += this._swapArr(sq, 'optionsHi', 'optionsEn');
        }
      }
    }
    return swaps;
  }

  // ═══════════════════════════════════════════════════
  //  FAST direction detection
  // ═══════════════════════════════════════════════════
  _detectDirection(qtm) {
    let hi = 0, en = 0;
    const limit = Math.min(qtm.length, 10);
    for (let i = 0; i < limit; i++) {
      const q = qtm[i];
      if ((q.questionTextHi && q.questionTextHi.trim()) || (q.assertionHi && q.assertionHi.trim()) ||
          (q.passageHi && q.passageHi.trim()) || (q.caseletTextHi && q.caseletTextHi.trim()) ||
          (Array.isArray(q.optionsHi) && q.optionsHi.length > 0 && q.optionsHi[0])) hi++;
      if ((q.questionTextEn && q.questionTextEn.trim()) || (q.assertionEn && q.assertionEn.trim()) ||
          (q.passageEn && q.passageEn.trim()) || (q.caseletTextEn && q.caseletTextEn.trim()) ||
          (Array.isArray(q.optionsEn) && q.optionsEn.length > 0 && q.optionsEn[0])) en++;
    }
    if (hi > en) return { src: 'hi', tgt: 'en' };
    if (en > hi) return { src: 'en', tgt: 'hi' };
    if (hi > 0) return { src: 'hi', tgt: 'en' };
    return { src: 'en', tgt: 'hi' };
  }

  // ═══════════════════════════════════════════════════
  //  FAST text collector
  // ═══════════════════════════════════════════════════
  _collect(q, src) {
    const texts = [], meta = [];
    const isHi = src === 'hi';
    const TP = isHi ? [
      ['questionTextHi','questionTextEn'], ['explanationHi','explanationEn'],
      ['assertionHi','assertionEn'], ['reasonHi','reasonEn'],
      ['passageHi','passageEn'], ['caseletTextHi','caseletTextEn'],
      ['diTitleHi','diTitleEn']
    ] : [
      ['questionTextEn','questionTextHi'], ['explanationEn','explanationHi'],
      ['assertionEn','assertionHi'], ['reasonEn','reasonHi'],
      ['passageEn','passageHi'], ['caseletTextEn','caseletTextHi'],
      ['diTitleEn','diTitleHi']
    ];
    const AP = isHi ? [
      ['optionsHi','optionsEn'], ['statementsHi','statementsEn'],
      ['listAHi','listAEn'], ['listBHi','listBEn'], ['itemsHi','itemsEn']
    ] : [
      ['optionsEn','optionsHi'], ['statementsEn','statementsHi'],
      ['listAEn','listAHi'], ['listBEn','listBHi'], ['itemsEn','itemsHi']
    ];

    for (const [s, t] of TP) {
      const sv = q[s], tv = q[t];
      if (sv && String(sv).trim() && (!tv || !String(tv).trim())) {
        texts.push(String(sv));
        meta.push({ f: t, t: 'text' });
      }
    }
    for (const [s, t] of AP) {
      const sa = q[s], ta = q[t];
      if (Array.isArray(sa) && sa.length > 0 &&
          (!Array.isArray(ta) || ta.length === 0 || ta.every(x => !x || !String(x).trim()))) {
        for (let i = 0; i < sa.length; i++) {
          if (sa[i] && String(sa[i]).trim()) {
            texts.push(String(sa[i]));
            meta.push({ f: t, t: 'arr', i, n: sa.length });
          }
        }
      }
    }
    if (q.subQuestions) {
      for (let si = 0; si < q.subQuestions.length; si++) {
        const sq = q.subQuestions[si];
        const STP = isHi ? [['questionTextHi','questionTextEn'],['explanationHi','explanationEn']]
                         : [['questionTextEn','questionTextHi'],['explanationEn','explanationHi']];
        for (const [s, t] of STP) {
          if (sq[s] && String(sq[s]).trim() && (!sq[t] || !String(sq[t]).trim())) {
            texts.push(String(sq[s]));
            meta.push({ f: `s.${si}.${t}`, t: 'text' });
          }
        }
        const soS = isHi ? 'optionsHi' : 'optionsEn';
        const soT = isHi ? 'optionsEn' : 'optionsHi';
        const soSa = sq[soS], soTa = sq[soT];
        if (Array.isArray(soSa) && soSa.length > 0 &&
            (!Array.isArray(soTa) || soTa.length === 0 || soTa.every(x => !x))) {
          for (let oi = 0; oi < soSa.length; oi++) {
            if (soSa[oi] && String(soSa[oi]).trim()) {
              texts.push(String(soSa[oi]));
              meta.push({ f: `s.${si}.${soT}`, t: 'arr', i: oi, n: soSa.length });
            }
          }
        }
      }
    }
    return { texts, meta };
  }

  // ═══════════════════════════════════════════════════
  //  FAST apply
  // ═══════════════════════════════════════════════════
  _apply(q, translated, metaArr) {
    const arrBuf = {};
    for (let i = 0; i < translated.length; i++) {
      const tr = translated[i], m = metaArr[i];
      if (!tr || !m) continue;
      if (m.f.startsWith('s.')) {
        const p = m.f.split('.');
        const si = parseInt(p[1]), sf = p[2];
        if (!q.subQuestions || !q.subQuestions[si]) continue;
        if (m.t === 'text') { q.subQuestions[si][sf] = tr; }
        else { const k = m.f; if (!arrBuf[k]) arrBuf[k] = new Array(m.n).fill(''); arrBuf[k][m.i] = tr; }
      } else {
        if (m.t === 'text') { q[m.f] = tr; }
        else { if (!arrBuf[m.f]) arrBuf[m.f] = new Array(m.n).fill(''); arrBuf[m.f][m.i] = tr; }
      }
    }
    for (const [f, arr] of Object.entries(arrBuf)) {
      if (f.startsWith('s.')) {
        const p = f.split('.'); const si = parseInt(p[1]), sf = p[2];
        if (q.subQuestions && q.subQuestions[si]) q.subQuestions[si][sf] = arr;
      } else { q[f] = arr; }
    }
  }

  // ═══════════════════════════════════════════════════
  //  MAIN — Optimized pipeline
  // ═══════════════════════════════════════════════════
  async translatePYQData(normalizedData) {
    this.resetStats();
    const t0 = Date.now();

    const qtm = normalizedData.questionTopicMap || [];
    if (qtm.length === 0) {
      return { data: normalizedData, stats: { ...this.stats, message: 'No questions' } };
    }

    // Step 0: PRE-CLEAN
    const preCleaned = this._preCleanAllFields(qtm);
    this.stats.preCleaned = preCleaned;
    if (preCleaned > 0) console.log(`[PYQTranslate] Pre-cleaned ${preCleaned} stuck word issues`);

    // Step 1: Fix mismatched fields
    const swaps = this._fixFields(qtm);
    this.stats.fieldsSwapped = swaps;

    // Step 2: Detect direction
    const dir = this._detectDirection(qtm);
    this.stats.direction = `${dir.src}→${dir.tgt}`;
    console.log(`[PYQTranslate] Direction: ${dir.src}→${dir.tgt}`);

    // Step 3: Collect all texts
    const allTexts = [], allMeta = [];
    for (let qi = 0; qi < qtm.length; qi++) {
      const { texts, meta } = this._collect(qtm[qi], dir.src);
      if (texts.length > 0) {
        allMeta.push({ qi, start: allTexts.length, count: texts.length, meta });
        allTexts.push(...texts);
      }
    }
    this.stats.totalFields = allTexts.length;

    if (allTexts.length === 0) {
      const { spacingFixed, keywordsFixed } = this._postProcessAllFields(qtm);
      this.stats.spacingFixed = spacingFixed;
      this.stats.keywordsFixed = keywordsFixed;
      normalizedData.questionTopicMap = qtm;
      this.stats.timeMs = Date.now() - t0;
      return { data: normalizedData, stats: { ...this.stats, message: 'Already bilingual' } };
    }

    console.log(`[PYQTranslate] ${allTexts.length} texts from ${allMeta.length} questions`);

    // Step 4: Translate
    let results;
    try {
      results = await translateHelper.translateBatch(allTexts, dir.src, dir.tgt);
      this.stats.translated = results.filter(t => t && t.trim()).length;
    } catch (err) {
      console.error('[PYQTranslate] Translation failed:', err.message);
      results = allTexts.map(() => '');
      this.stats.failed = allTexts.length;
    }

    // Step 5: Apply
    for (const qm of allMeta) {
      this._apply(qtm[qm.qi], results.slice(qm.start, qm.start + qm.count), qm.meta);
    }

    // ★ Step 6: POST-PROCESS (spacing + keyword translation)
    const { spacingFixed, keywordsFixed } = this._postProcessAllFields(qtm);
    this.stats.spacingFixed = spacingFixed;
    this.stats.keywordsFixed = keywordsFixed;
    if (keywordsFixed > 0) console.log(`[PYQTranslate] Fixed ${keywordsFixed} keyword translation issues`);

    normalizedData.questionTopicMap = qtm;

    // Step 7: Translate topTopics
    if (Array.isArray(normalizedData.topTopics) && normalizedData.topTopics.length > 0) {
      const tt = [], tm = [];
      for (let i = 0; i < normalizedData.topTopics.length; i++) {
        const t = normalizedData.topTopics[i];
        if (dir.src === 'hi' && t.topic && HINDI_RE.test(t.topic) && !t.topicEn) {
          tt.push(t.topic); tm.push({ i, f: 'topicEn' });
        } else if (dir.src === 'en' && t.topic && !HINDI_RE.test(t.topic) && !t.topicHi) {
          tt.push(t.topic); tm.push({ i, f: 'topicHi' });
        }
      }
      if (tt.length > 0) {
        try {
          const r = await translateHelper.translateBatch(tt, dir.src, dir.tgt);
          r.forEach((v, j) => { if (v && tm[j]) normalizedData.topTopics[tm[j].i][tm[j].f] = v; });
        } catch (e) { /* ignore */ }
      }
    }

    this.stats.timeMs = Date.now() - t0;
    console.log(`[PYQTranslate] Done: ${this.stats.translated}/${this.stats.totalFields} translated, ${this.stats.failed} failed, ${swaps} swapped, ${preCleaned} pre-cleaned, ${spacingFixed} spacing-fixed, ${keywordsFixed} keywords-fixed, ${(this.stats.timeMs / 1000).toFixed(1)}s`);

    return { data: normalizedData, stats: { ...this.stats } };
  }
}

module.exports = new PYQTranslateHelper();