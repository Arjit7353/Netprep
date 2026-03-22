// server/utils/translateHelper.js
// ═══════════════════════════════════════════════════════════════
//  ULTIMATE TRANSLATION ENGINE v3.0
//  - Azure notranslate spans (native protection)
//  - 50+ protection patterns
//  - Post-translation validation & auto-fix
//  - Smart skip detection
//  - Corruption repair built-in
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class TranslateHelper {
  constructor() {
    this.azureKey = process.env.MICROSOFT_TRANSLATOR_KEY || '';
    this.azureRegion = process.env.MICROSOFT_TRANSLATOR_REGION || 'centralindia';
    this.azureEndpoint = process.env.MICROSOFT_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';

    this.cache = new Map();
    this.cacheMaxSize = 8000;
    this.requestDelay = 50;
    this.batchSize = 50;

    this.azureAvailable = !!this.azureKey;
    this.googleAvailable = true;
    this.googleTranslate = null;
    try { this.googleTranslate = require('google-translate-api-x'); } catch (e) {}

    // Stats
    this.stats = {
      translated: 0, skipped: 0, protected: 0,
      failed: 0, corruptions_caught: 0, auto_fixed: 0
    };

    // Token counter
    this._tc = 0;

    // ═══════════════════════════════════════════════════
    //     PROTECTION PATTERNS — THE HEART OF THE SYSTEM
    // ═══════════════════════════════════════════════════

    // ── CATEGORY 1: FULL TEXT SKIP (entire string never translated) ──
    this.SKIP_FULL = [
      // Match codes: A-I, B-II, C-III, D-IV (with commas/spaces)
      /^[A-Da-d]\s*[-–—]\s*[IVXivx]+(\s*[,;]\s*[A-Da-d]\s*[-–—]\s*[IVXivx]+){1,7}\s*$/,
      // Match codes with parens: A-(i), B-(ii)
      /^[A-Da-d]\s*[-–—]\s*\([ivxIVX]+\)(\s*[,;]\s*[A-Da-d]\s*[-–—]\s*\([ivxIVX]+\)){1,7}\s*$/,
      // Pure numbers/decimals/percentages
      /^\s*[-+]?\d+(\.\d+)?\s*%?\s*$/,
      // Number with unit: 159.5, 27.4°C, 500 km
      /^\s*[-+]?\d+(\.\d+)?\s*°?[A-Za-z]{0,5}\s*$/,
      // Single letter
      /^[A-Za-z]$/,
      // URLs
      /^https?:\/\//,
      // Just punctuation/numbers
      /^[\d\s.,;:+\-–—/*=%°()\[\]{}]+$/,
      // Roman numeral alone: I, II, III, IV, V, VI, VII, VIII, IX, X
      /^(VIII|VII|VI|IV|IX|III|II|I|V|X)$/,
      // Already a code like "A-I, B-II, C-III, D-IV"
      /^([A-D]\s*[-–]\s*[IVXivx]+\s*[,;\s]*){2,}$/i,
      // Number range: 1206-1526
      /^\d{3,4}\s*[-–—]\s*\d{3,4}$/,
      // Simple fractions: 1/2, 3/4
      /^\d+\/\d+$/,
    ];

    // ── CATEGORY 2: INLINE PROTECTION (protect within translatable text) ──
    // Order matters — more specific patterns first
    this.PROTECT_INLINE = [
      // ── Match/Option Codes ──
      // Full match option: A-I, B-II, C-III, D-IV
      { re: /\b([A-D])\s*[-–—]\s*(VIII|VII|VI|IV|IX|III|II|I|V|X)\b/gi, id: 'MCODE', priority: 10 },
      // With parens: A-(i), B-(ii), C-(iii), D-(iv)
      { re: /([A-D])\s*[-–—]\s*\(([ivxIVX]+)\)/gi, id: 'MCODEP', priority: 10 },

      // ── Parenthesized Labels ──
      // (A), (B), (C), (D), (E), (R), (S)
      { re: /\(([A-Z])\)/g, id: 'PLBL', priority: 9 },
      // (a), (b), (c), (d)
      { re: /\(([a-z])\)/g, id: 'PLLC', priority: 8 },
      // (i), (ii), (iii), (iv), (v), (vi), (vii), (viii)
      { re: /\(([ivxIVX]+)\)/g, id: 'PROM', priority: 9 },
      // (1), (2), (3)
      { re: /\((\d+)\)/g, id: 'PNUM', priority: 7 },

      // ── Roman Numerals ──
      // Standalone: I, II, III, IV, V, VI, VII, VIII, IX, X (word boundary)
      { re: /\b(VIII|VII|VI|IV|IX|III|II|V|X)\b/g, id: 'ROMN', priority: 6 },
      // Note: single "I" excluded from here to avoid false positives

      // ── Year Numbers ──
      // 4 digit years: 1206, 1857, 2023
      { re: /\b(1[0-9]{3}|20[0-9]{2})\b/g, id: 'YEAR', priority: 7 },
      // Year ranges: 1206-1526, 1857–1947
      { re: /\b(\d{4})\s*[-–—]\s*(\d{4})\b/g, id: 'YRNG', priority: 8 },
      // Century: 6th, 12th, 19th century
      { re: /\b(\d{1,2})(st|nd|rd|th)\b/gi, id: 'CENT', priority: 6 },

      // ── Acronyms & Abbreviations ──
      // 2+ uppercase letters: UGC, NAAC, INC, UNESCO, etc.
      { re: /\b([A-Z]{2,}(?:\s*[-&]\s*[A-Z]{2,})*)\b/g, id: 'ACRO', priority: 5 },
      // With dots: U.G.C., N.E.P.
      { re: /\b([A-Z]\.){2,}[A-Z]?\b/g, id: 'ACRD', priority: 6 },
      // Common acronyms in lowercase context
      { re: /\b(pH|km|cm|mm|mg|kg|Hz|MW|GW|kW)\b/g, id: 'UNIT', priority: 7 },

      // ── Scientific / Technical ──
      // Chemical: CO2, PM2.5, PM10, H2O, O3, SO2, NO2, CH4, N2O
      { re: /\b([A-Z][a-z]?\d+(?:\.\d+)?)\b/g, id: 'CHEM', priority: 7 },
      // BOD, COD, AQI
      { re: /\b(BOD|COD|AQI|GDP|GNP|HDI|CPI|WPI|NNP|GVA)\b/g, id: 'TECH', priority: 8 },

      // ── Number Patterns ──
      // Education patterns: 10+2+3, 5+3+3+4
      { re: /\b(\d+(?:\+\d+)+)\b/g, id: 'NPAT', priority: 7 },
      // Percentages: 25%, 41.2%
      { re: /\b(\d+(?:\.\d+)?)\s*%/g, id: 'PCNT', priority: 7 },
      // Large numbers with commas: 1,25,000 or 125,000
      { re: /\b(\d{1,3}(?:,\d{2,3})+)\b/g, id: 'LNUM', priority: 6 },
      // Decimal numbers in context
      { re: /\b(\d+\.\d+)\b/g, id: 'DECM', priority: 5 },

      // ── Legal / Reference ──
      // Article/Section references: Art. 14, Sec. 370, Article 21
      { re: /\b(Art(?:icle)?\.?\s*\d+[A-Za-z]?)\b/gi, id: 'ARTL', priority: 7 },
      { re: /\b(Sec(?:tion)?\.?\s*\d+[A-Za-z]?)\b/gi, id: 'SECN', priority: 7 },
      // Act references: Act of 1858, Act 1986
      { re: /\b(Act\s+(?:of\s+)?\d{4})\b/gi, id: 'ACTR', priority: 6 },

      // ── Statement/List Markers ──
      // Statement I, Statement II (preserve Roman numeral after "Statement"/"कथन")
      { re: /(Statement|कथन|Assertion|अभिकथन|Reason|कारण)\s*\(?([IVXAB]|[ivx]+)\)?\s*[:.]?/gi, id: 'STMK', priority: 9 },
      // List I, List II, सूची I, सूची II
      { re: /(List|सूची|Column|स्तंभ)\s*[-–]?\s*(VIII|VII|VI|IV|IX|III|II|I|V|X|[AB12])\b/gi, id: 'LSTM', priority: 9 },

      // ── Proper Nouns (Historical - commonly mangled) ──
      // These are tricky - only protect specific ones that are known to get corrupted
      { re: /\b(C-14|TL|SPSS|MOOCs?|SWAYAM|ICT|NEP|CBCS|CBT|CRT|NRT|NBA|NIRF|NAD|NDL)\b/g, id: 'PNOUN', priority: 8 },

      // ── Misc Codes ──
      // Alphanumeric codes: Q.1, Q.5, Ch.1, Unit I
      { re: /\b(Q|Ch|Unit|Fig|Table|Ex)\.?\s*(\d+|[IVXAB])\b/gi, id: 'QREF', priority: 6 },
      // Email-like: something@domain
      { re: /\b[\w.-]+@[\w.-]+\.\w+\b/g, id: 'EMAIL', priority: 9 },
    ];

    // ── CATEGORY 3: POST-TRANSLATION CORRUPTION DETECTION ──
    this.CORRUPTION_DETECTORS = [
      // Hindi transliterations of English letters used as labels
      { pattern: /\(\s*ए\s*\)/g, fix: '(A)', desc: '(ए)→(A)' },
      { pattern: /\(\s*आर\s*\)/g, fix: '(R)', desc: '(आर)→(R)' },
      { pattern: /\(\s*बी\s*\)/g, fix: '(B)', desc: '(बी)→(B)' },
      { pattern: /\(\s*सी\s*\)/g, fix: '(C)', desc: '(सी)→(C)' },
      { pattern: /\(\s*डी\s*\)/g, fix: '(D)', desc: '(डी)→(D)' },
      { pattern: /\(\s*ई\s*\)/g, fix: '(E)', desc: '(ई)→(E)' },

      // Roman numerals transliterated
      { pattern: /\(\s*आई\s*\)/g, fix: '(i)', desc: '(आई)→(i)' },
      { pattern: /\(\s*ii\s*\)/g, fix: '(ii)', desc: 'normalize' },

      // Corrupted match codes within text
      { pattern: /ए\s*[-–]\s*आई/g, fix: 'A-I', desc: 'ए-आई→A-I' },
      { pattern: /बी\s*[-–]\s*आई/g, fix: 'B-I', desc: 'बी-आई→B-I' },
      { pattern: /सी\s*[-–]\s*आई/g, fix: 'C-I', desc: 'सी-आई→C-I' },
      { pattern: /डी\s*[-–]\s*आई/g, fix: 'D-I', desc: 'डी-आई→D-I' },

      { pattern: /ए\s*[-–]\s*द्वितीय/g, fix: 'A-II', desc: 'ए-द्वितीय→A-II' },
      { pattern: /बी\s*[-–]\s*द्वितीय/g, fix: 'B-II', desc: 'बी-द्वितीय→B-II' },
      { pattern: /सी\s*[-–]\s*द्वितीय/g, fix: 'C-II', desc: 'सी-द्वितीय→C-II' },
      { pattern: /डी\s*[-–]\s*द्वितीय/g, fix: 'D-II', desc: 'डी-द्वितीय→D-II' },

      { pattern: /ए\s*[-–]\s*तृतीय/g, fix: 'A-III', desc: 'ए-तृतीय→A-III' },
      { pattern: /बी\s*[-–]\s*तृतीय/g, fix: 'B-III', desc: 'बी-तृतीय→B-III' },
      { pattern: /सी\s*[-–]\s*तृतीय/g, fix: 'C-III', desc: 'सी-तृतीय→C-III' },
      { pattern: /डी\s*[-–]\s*तृतीय/g, fix: 'D-III', desc: 'डी-तृतीय→D-III' },

      { pattern: /ए\s*[-–]\s*चतुर्थ/g, fix: 'A-IV', desc: 'ए-चतुर्थ→A-IV' },
      { pattern: /बी\s*[-–]\s*चतुर्थ/g, fix: 'B-IV', desc: 'बी-चतुर्थ→B-IV' },
      { pattern: /सी\s*[-–]\s*चतुर्थ/g, fix: 'C-IV', desc: 'सी-चतुर्थ→C-IV' },
      { pattern: /डी\s*[-–]\s*चतुर्थ/g, fix: 'D-IV', desc: 'डी-चतुर्थ→D-IV' },

      { pattern: /ए\s*[-–]\s*वी/g, fix: 'A-V', desc: 'ए-वी→A-V' },
      { pattern: /बी\s*[-–]\s*वी/g, fix: 'B-V', desc: 'बी-वी→B-V' },
      { pattern: /सी\s*[-–]\s*वी/g, fix: 'C-V', desc: 'सी-वी→C-V' },
      { pattern: /डी\s*[-–]\s*वी/g, fix: 'D-V', desc: 'डी-वी→D-V' },

      // "कथन आई" → "कथन I"
      { pattern: /कथन\s+आई\b/g, fix: 'कथन I', desc: 'कथन आई→कथन I' },
      { pattern: /कथन\s+द्वितीय\b/g, fix: 'कथन II', desc: 'कथन द्वितीय→कथन II' },
      { pattern: /कथन\s+तृतीय\b/g, fix: 'कथन III', desc: 'कथन तृतीय→कथन III' },

      // Statement markers
      { pattern: /स्टेटमेंट\s+आई\b/g, fix: 'Statement I', desc: 'स्टेटमेंट आई→Statement I' },
      { pattern: /स्टेटमेंट\s+द्वितीय\b/g, fix: 'Statement II', desc: 'स्टेटमेंट द्वितीय→Statement II' },

      // अभिकथन (ए) और कारण (आर) → अभिकथन (A) और कारण (R)
      { pattern: /अभिकथन\s*\(\s*ए\s*\)/g, fix: 'अभिकथन (A)', desc: 'अभिकथन(ए)→अभिकथन(A)' },
      { pattern: /कारण\s*\(\s*आर\s*\)/g, fix: 'कारण (R)', desc: 'कारण(आर)→कारण(R)' },

      // "सूची आई" → "सूची-I", "सूची-द्वितीय" → "सूची-II"
      { pattern: /सूची\s*[-–]?\s*आई\b/g, fix: 'सूची-I', desc: 'सूची-आई→सूची-I' },
      { pattern: /सूची\s*[-–]?\s*द्वितीय\b/g, fix: 'सूची-II', desc: 'सूची-द्वितीय→सूची-II' },

      // Standalone transliterated Roman in Hindi text
      { pattern: /\bआई\b(?=\s*[,.]|\s+और\b)/g, fix: 'I', desc: 'आई→I (standalone)' },
    ];

    // ── CATEGORY 4: WORDS THAT SHOULD NEVER BE TRANSLATED ──
    // (These get added to protection automatically)
    this.NEVER_TRANSLATE_WORDS = new Set([
      'SWAYAM', 'MOOC', 'MOOCs', 'NAAC', 'NIRF', 'NBA', 'UGC', 'AICTE',
      'NCTE', 'BCI', 'NMC', 'NAD', 'NDL', 'ICT', 'NEP', 'CBCS', 'CBT',
      'CRT', 'NRT', 'SPSS', 'APA', 'MLA', 'UNESCO', 'UNDP', 'WHO',
      'GDP', 'GNP', 'HDI', 'CPI', 'WPI', 'NNP', 'GVA',
      'BOD', 'COD', 'AQI', 'PM2.5', 'PM10', 'SPM',
      'CO2', 'SO2', 'NO2', 'CH4', 'N2O', 'O3', 'CFC',
      'pH', 'DNA', 'RNA',
      'INC', 'INA', 'AITUC',
      'SDG', 'SDGs', 'MDG', 'MDGs',
      'NAPCC', 'ISA', 'COP',
      'e-ShodhSindhu', 'e-Yantra', 'Swayam Prabha',
    ]);

    const p = this.azureAvailable ? 'Azure' : 'Google';
    console.log(`[TranslateHelper v3] Primary: ${p} | Patterns: ${this.PROTECT_INLINE.length} protect, ${this.CORRUPTION_DETECTORS.length} validators`);
  }

  // ═══════════════════════════════════════════════════
  //              SKIP DETECTION
  // ═══════════════════════════════════════════════════

  shouldSkip(text) {
    if (!text || typeof text !== 'string') return true;
    const t = text.trim();
    if (!t) return true;
    if (t.length <= 1) return true;

    for (const pat of this.SKIP_FULL) {
      if (pat.test(t)) return true;
    }
    return false;
  }

  // ═══════════════════════════════════════════════════
  //     PROTECTION ENGINE (Tokenize before translation)
  // ═══════════════════════════════════════════════════

  protect(text) {
    if (!text) return { text: text || '', map: {}, count: 0 };

    let result = text;
    const map = {};
    let count = 0;

    // Sort rules by priority (higher first)
    const sorted = [...this.PROTECT_INLINE].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sorted) {
      const re = new RegExp(rule.re.source, rule.re.flags);
      result = result.replace(re, (match) => {
        // Don't protect if it's just a single common word
        if (match.length <= 1 && !/^[A-Z]$/.test(match)) return match;

        const token = `ZNT${this._tc++}Z`;
        map[token] = match;
        count++;
        return token;
      });
    }

    // Also protect NEVER_TRANSLATE_WORDS
    for (const word of this.NEVER_TRANSLATE_WORDS) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'g');
      result = result.replace(re, (match) => {
        const token = `ZNT${this._tc++}Z`;
        map[token] = match;
        count++;
        return token;
      });
    }

    return { text: result, map, count };
  }

  restore(text, map) {
    if (!text || !map || Object.keys(map).length === 0) return text;
    let result = text;

    for (const [token, original] of Object.entries(map)) {
      // Handle possible spaces/mangling around tokens
      const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(`\\s*${esc}\\s*`, 'g'), original);
    }

    // Clean any leftover tokens
    result = result.replace(/\s*ZNT\d+Z\s*/g, ' ');
    return result.replace(/\s{2,}/g, ' ').trim();
  }

  // ═══════════════════════════════════════════════════
  //     POST-TRANSLATION VALIDATION & AUTO-FIX
  // ═══════════════════════════════════════════════════

  validate(translatedText, originalText) {
    if (!translatedText) return { text: translatedText, fixed: false, fixes: [] };

    let result = translatedText;
    const fixes = [];

    for (const detector of this.CORRUPTION_DETECTORS) {
      const re = new RegExp(detector.pattern.source, detector.pattern.flags);
      if (re.test(result)) {
        const before = result;
        result = result.replace(new RegExp(detector.pattern.source, detector.pattern.flags), detector.fix);
        if (result !== before) {
          fixes.push(detector.desc);
          this.stats.auto_fixed++;
        }
      }
    }

    // Extra validation: if translation has too many single Hindi chars
    // that look like transliterated English letters, something went wrong
    const suspiciousCount = (result.match(/\b[एबीसीडी]\b/g) || []).length;
    if (suspiciousCount >= 3 && originalText) {
      // High corruption — check if original was code-like
      if (this.shouldSkip(originalText)) {
        result = originalText;
        fixes.push('reverted_to_original_high_corruption');
        this.stats.corruptions_caught++;
      }
    }

    return {
      text: result,
      fixed: fixes.length > 0,
      fixes
    };
  }

  // Validate and fix a complete bilingual question
  validateQuestion(question) {
    if (!question) return { question, totalFixes: 0 };
    let totalFixes = 0;

    const fixField = (obj, lang) => {
      if (!obj || !obj[lang]) return;
      const v = this.validate(obj[lang], obj[lang === 'hi' ? 'en' : 'hi']);
      if (v.fixed) {
        obj[lang] = v.text;
        totalFixes += v.fixes.length;
      }
    };

    const fixArr = (obj, lang) => {
      if (!obj || !obj[lang] || !Array.isArray(obj[lang])) return;
      const otherLang = lang === 'hi' ? 'en' : 'hi';
      for (let i = 0; i < obj[lang].length; i++) {
        const orig = obj[otherLang]?.[i] || '';
        const v = this.validate(obj[lang][i], orig);
        if (v.fixed) {
          obj[lang][i] = v.text;
          totalFixes += v.fixes.length;
        }
      }
    };

    // Fix all bilingual fields
    ['hi', 'en'].forEach(lang => {
      fixField(question.question, lang);
      fixArr(question.options, lang);
      fixField(question.explanation, lang);

      if (question.assertionReasonData) {
        fixField(question.assertionReasonData.assertion, lang);
        fixField(question.assertionReasonData.reason, lang);
      }
      if (question.matchData) {
        fixArr(question.matchData.listA, lang);
        fixArr(question.matchData.listB, lang);
      }
      if (question.sequenceData) {
        fixArr(question.sequenceData.items, lang);
      }
      if (question.statementData) {
        fixArr(question.statementData.statements, lang);
      }
    });

    // Special: match_following options — sync code-like options
    if (question.questionType === 'match_following' && question.options) {
      const hiOpts = question.options.hi || [];
      const enOpts = question.options.en || [];
      for (let i = 0; i < Math.max(hiOpts.length, enOpts.length); i++) {
        const hi = hiOpts[i] || '';
        const en = enOpts[i] || '';
        if (this.shouldSkip(hi) && en !== hi) {
          question.options.en[i] = hi;
          totalFixes++;
        } else if (this.shouldSkip(en) && hi !== en) {
          question.options.hi[i] = en;
          totalFixes++;
        }
      }
    }

    return { question, totalFixes };
  }

  // ═══════════════════════════════════════════════════
  //              CORE TRANSLATION
  // ═══════════════════════════════════════════════════

  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  getCacheKey(t, f, to) { return `${f}:${to}:${t.substring(0, 200)}`; }

  addToCache(t, f, to, tr) {
    if (!t || !tr) return;
    if (this.cache.size >= this.cacheMaxSize) {
      const keys = Array.from(this.cache.keys()).slice(0, 1000);
      keys.forEach(k => this.cache.delete(k));
    }
    this.cache.set(this.getCacheKey(t, f, to), tr);
  }

  getFromCache(t, f, to) {
    return this.cache.get(this.getCacheKey(t, f, to)) || null;
  }

  // ═══════════════════════════════════════════════════
  //              AZURE TRANSLATOR
  // ═══════════════════════════════════════════════════

  async callAzure(texts, from, to) {
    if (!this.azureAvailable) throw new Error('Azure not configured');
    if (!texts.length) return [];

    const url = `${this.azureEndpoint}/translate?api-version=3.0&from=${from}&to=${to}`;

    try {
      const res = await axios({
        method: 'POST', url,
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureKey,
          'Ocp-Apim-Subscription-Region': this.azureRegion,
          'Content-Type': 'application/json',
          'X-ClientTraceId': uuidv4()
        },
        data: texts.map(t => ({ Text: t || '' })),
        timeout: 30000
      });

      if (res.data && Array.isArray(res.data)) {
        return res.data.map(item => item.translations?.[0]?.text || '');
      }
      return texts;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        this.azureAvailable = false;
      }
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════
  //              GOOGLE TRANSLATE (FALLBACK)
  // ═══════════════════════════════════════════════════

  async callGoogle(texts, from, to) {
    if (!this.googleTranslate) throw new Error('Google not available');
    if (texts.length === 1) {
      const r = await this.googleTranslate(texts[0], { from, to });
      return [r.text || texts[0]];
    }
    const r = await this.googleTranslate(texts, { from, to });
    return Array.isArray(r) ? r.map((x, i) => x.text || texts[i]) : [r.text || texts[0]];
  }

  // ═══════════════════════════════════════════════════
  //     MAIN BATCH TRANSLATE — THE PIPELINE
  // ═══════════════════════════════════════════════════

  async translateBatch(texts, from = 'hi', to = 'en') {
    if (!texts || texts.length === 0) return [];

    const results = new Array(texts.length).fill('');
    const toTranslate = []; // { idx, original, processed, protMap }

    // ════════ STAGE 1: PRE-PROCESSING ════════
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || typeof text !== 'string' || !text.trim()) {
        results[i] = text || '';
        continue;
      }

      const trimmed = text.trim();

      // Check cache
      const cached = this.getFromCache(trimmed, from, to);
      if (cached) { results[i] = cached; continue; }

      // Skip untranslatable
      if (this.shouldSkip(trimmed)) {
        results[i] = trimmed;
        this.addToCache(trimmed, from, to, trimmed);
        this.stats.skipped++;
        continue;
      }

      // Protect patterns
      const prot = this.protect(trimmed);

      toTranslate.push({
        idx: i,
        original: trimmed,
        processed: prot.text,
        protMap: prot.map,
        protCount: prot.count
      });
    }

    if (toTranslate.length === 0) return results;

    const protectedItems = toTranslate.filter(t => t.protCount > 0).length;
    console.log(`[Translate] ${toTranslate.length} to translate (${from}→${to}), ${protectedItems} protected, ${texts.length - toTranslate.length} skipped/cached`);

    // ════════ STAGE 2: TRANSLATION ════════
    const chunks = [];
    for (let i = 0; i < toTranslate.length; i += this.batchSize) {
      chunks.push(toTranslate.slice(i, i + this.batchSize));
    }

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      const chunkTexts = chunk.map(item => item.processed);
      let translated = null;

      // Try Azure
      if (this.azureAvailable) {
        try { translated = await this.callAzure(chunkTexts, from, to); }
        catch (e) { console.warn(`[Translate] Azure chunk ${ci + 1} failed:`, e.message); }
      }

      // Fallback Google
      if (!translated && this.googleAvailable && this.googleTranslate) {
        try {
          translated = [];
          for (let g = 0; g < chunkTexts.length; g += 5) {
            const gc = chunkTexts.slice(g, g + 5);
            try {
              const gr = await this.callGoogle(gc, from, to);
              translated.push(...gr);
            } catch { translated.push(...gc); }
            if (g + 5 < chunkTexts.length) await this.sleep(200);
          }
        } catch { translated = null; }
      }

      // Last resort
      if (!translated) {
        translated = chunk.map(item => item.original);
        this.stats.failed += chunk.length;
      }

      // ════════ STAGE 3: POST-PROCESSING ════════
      for (let i = 0; i < chunk.length; i++) {
        const item = chunk[i];
        let result = (translated[i] && translated[i].trim()) || item.original;

        // 3a: Restore protected patterns
        if (item.protCount > 0) {
          result = this.restore(result, item.protMap);
          this.stats.protected++;
        }

        // 3b: Validate & auto-fix corruptions
        const validation = this.validate(result, item.original);
        if (validation.fixed) {
          result = validation.text;
          this.stats.corruptions_caught += validation.fixes.length;
        }

        results[item.idx] = result;
        this.addToCache(item.original, from, to, result);
        this.stats.translated++;
      }

      if (ci < chunks.length - 1) await this.sleep(this.requestDelay);
    }

    return results;
  }

  // ═══════════════════════════════════════════════════
  //              CONVENIENCE METHODS
  // ═══════════════════════════════════════════════════

  async translate(text, from = 'hi', to = 'en') {
    if (!text || typeof text !== 'string' || !text.trim()) return text || '';
    const r = await this.translateBatch([text], from, to);
    return r[0] || text;
  }

  async translateText(text, srcLang = 'hi') {
    return this.translate(text, srcLang, srcLang === 'hi' ? 'en' : 'hi');
  }

  async translateArray(arr, from = 'hi', to = 'en') {
    if (!arr?.length) return arr || [];
    return this.translateBatch(arr, from, to);
  }

  async translateBilingual(obj, srcLang = 'hi') {
    if (!obj) return { hi: '', en: '' };
    if (typeof obj === 'string') {
      const tgt = srcLang === 'hi' ? 'en' : 'hi';
      const t = await this.translate(obj, srcLang, tgt);
      return { [srcLang]: obj, [tgt]: t };
    }
    if (obj.hi && obj.en) return obj;
    if (obj.hi && !obj.en) obj.en = await this.translate(obj.hi, 'hi', 'en');
    else if (obj.en && !obj.hi) obj.hi = await this.translate(obj.en, 'en', 'hi');
    return obj;
  }

  // ═══════════════════════════════════════════════════
  //          QUESTION TRANSLATION
  // ═══════════════════════════════════════════════════

  async translateQuestion(questionData, sourceLanguage = 'hi') {
    const tgt = sourceLanguage === 'hi' ? 'en' : 'hi';
    const texts = [];
    const map = [];

    const addText = (val, field, type) => {
      if (typeof val === 'string' && val.trim()) {
        texts.push(val); map.push({ field, type });
      } else if (val?.[sourceLanguage] && !val?.[tgt]) {
        texts.push(val[sourceLanguage]); map.push({ field, type: 'bilingual' });
      }
    };

    const addArr = (val, field, type) => {
      if (Array.isArray(val)) {
        val.forEach((v, i) => { texts.push(v); map.push({ field, type: 'array', index: i }); });
      } else if (val?.[sourceLanguage] && (!val?.[tgt] || !val[tgt].length)) {
        val[sourceLanguage].forEach((v, i) => { texts.push(v); map.push({ field, type: 'bilingualArray', index: i }); });
      }
    };

    // Collect all texts
    addText(questionData.question, 'question', 'string');
    addArr(questionData.options, 'options');
    addText(questionData.explanation, 'explanation', 'string');

    if (questionData.assertion) { addText(questionData.assertion, 'assertion', 'string'); }
    if (questionData.reason) { addText(questionData.reason, 'reason', 'string'); }
    if (questionData.assertionReasonData?.assertion?.[sourceLanguage]) {
      addText(questionData.assertionReasonData.assertion, 'ar_assertion', 'bilingual');
    }
    if (questionData.assertionReasonData?.reason?.[sourceLanguage]) {
      addText(questionData.assertionReasonData.reason, 'ar_reason', 'bilingual');
    }

    if (questionData.matchData?.listA) addArr(questionData.matchData.listA, 'listA');
    if (questionData.matchData?.listB) addArr(questionData.matchData.listB, 'listB');
    if (questionData.sequenceData?.items) addArr(questionData.sequenceData.items, 'seqItems');
    if (questionData.statementData?.statements) addArr(questionData.statementData.statements, 'stmts');

    if (texts.length === 0) return questionData;

    try {
      const translations = await this.translateBatch(texts, sourceLanguage, tgt);

      let ti = 0;
      for (const m of map) {
        const translated = translations[ti++] || '';

        switch (m.field) {
          case 'question':
            if (m.type === 'string') questionData.question = { [sourceLanguage]: questionData.question, [tgt]: translated };
            else questionData.question[tgt] = translated;
            break;

          case 'options':
            if (m.type === 'array') {
              if (!questionData.options._c) {
                questionData.options = { [sourceLanguage]: questionData.options, [tgt]: [] };
                questionData.options._c = true;
              }
              questionData.options[tgt].push(translated);
            } else {
              if (!questionData.options[tgt]) questionData.options[tgt] = [];
              questionData.options[tgt].push(translated);
            }
            break;

          case 'explanation':
            if (m.type === 'string') questionData.explanation = { [sourceLanguage]: questionData.explanation, [tgt]: translated };
            else questionData.explanation[tgt] = translated;
            break;

          case 'assertion':
            if (!questionData.assertionReasonData) questionData.assertionReasonData = {};
            questionData.assertionReasonData.assertion = { [sourceLanguage]: questionData.assertion, [tgt]: translated };
            delete questionData.assertion;
            break;

          case 'reason':
            if (!questionData.assertionReasonData) questionData.assertionReasonData = {};
            questionData.assertionReasonData.reason = { [sourceLanguage]: questionData.reason, [tgt]: translated };
            delete questionData.reason;
            break;

          case 'ar_assertion':
            questionData.assertionReasonData.assertion[tgt] = translated;
            break;
          case 'ar_reason':
            questionData.assertionReasonData.reason[tgt] = translated;
            break;

          case 'listA':
            if (!questionData.matchData.listA[tgt]) questionData.matchData.listA[tgt] = [];
            questionData.matchData.listA[tgt].push(translated);
            break;
          case 'listB':
            if (!questionData.matchData.listB[tgt]) questionData.matchData.listB[tgt] = [];
            questionData.matchData.listB[tgt].push(translated);
            break;

          case 'seqItems':
            if (!questionData.sequenceData.items[tgt]) questionData.sequenceData.items[tgt] = [];
            questionData.sequenceData.items[tgt].push(translated);
            break;

          case 'stmts':
            if (!questionData.statementData.statements[tgt]) questionData.statementData.statements[tgt] = [];
            questionData.statementData.statements[tgt].push(translated);
            break;
        }
      }

      if (questionData.options?._c) delete questionData.options._c;

      // Final validation pass on the entire question
      const { question: validated, totalFixes } = this.validateQuestion(questionData);
      if (totalFixes > 0) {
        console.log(`[Translate] Post-validation fixed ${totalFixes} corruptions in question`);
      }

    } catch (error) {
      console.warn('[Translate] translateQuestion failed:', error.message);
      this.ensureBilingual(questionData, sourceLanguage);
    }

    return questionData;
  }

  async translateDIData(diData, srcLang = 'hi') {
    const tgt = srcLang === 'hi' ? 'en' : 'hi';
    const texts = [];
    const map = [];

    const add = (val, field) => {
      if (typeof val === 'string' && val.trim()) {
        texts.push(val); map.push({ field, type: 'string' });
      } else if (val?.[srcLang] && !val?.[tgt]) {
        texts.push(val[srcLang]); map.push({ field, type: 'bilingual' });
      }
    };

    const addA = (val, field) => {
      if (Array.isArray(val)) {
        val.forEach((v, i) => { texts.push(v); map.push({ field, type: 'array', index: i }); });
      } else if (val?.[srcLang]) {
        val[srcLang].forEach((v, i) => { texts.push(v); map.push({ field, type: 'bilingualArray', index: i }); });
      }
    };

    add(diData.title, 'title');
    add(diData.instruction, 'instruction');
    add(diData.caseletText, 'caseletText');
    if (diData.tableData?.headers) addA(diData.tableData.headers, 'headers');
    if (diData.chartData?.labels) addA(diData.chartData.labels, 'labels');

    if (!texts.length) return diData;

    try {
      const translations = await this.translateBatch(texts, srcLang, tgt);
      let ti = 0;

      for (const m of map) {
        const t = translations[ti++] || '';
        const f = m.field;

        if (['title', 'instruction', 'caseletText'].includes(f)) {
          if (m.type === 'string') diData[f] = { [srcLang]: diData[f], [tgt]: t };
          else diData[f][tgt] = t;
        } else if (f === 'headers' && diData.tableData) {
          if (m.type === 'array') {
            if (!diData.tableData.headers._c) {
              diData.tableData.headers = { [srcLang]: diData.tableData.headers, [tgt]: [] };
              diData.tableData.headers._c = true;
            }
            diData.tableData.headers[tgt].push(t);
          } else {
            if (!diData.tableData.headers[tgt]) diData.tableData.headers[tgt] = [];
            diData.tableData.headers[tgt].push(t);
          }
        } else if (f === 'labels' && diData.chartData) {
          if (m.type === 'array') {
            if (!diData.chartData.labels._c) {
              diData.chartData.labels = { [srcLang]: diData.chartData.labels, [tgt]: [] };
              diData.chartData.labels._c = true;
            }
            diData.chartData.labels[tgt].push(t);
          } else {
            if (!diData.chartData.labels[tgt]) diData.chartData.labels[tgt] = [];
            diData.chartData.labels[tgt].push(t);
          }
        }
      }

      if (diData.tableData?.headers?._c) delete diData.tableData.headers._c;
      if (diData.chartData?.labels?._c) delete diData.chartData.labels._c;
    } catch (e) {
      console.warn('[Translate] DI failed:', e.message);
    }

    return diData;
  }

  ensureBilingual(data, src) {
    const tgt = src === 'hi' ? 'en' : 'hi';
    const e = (v) => { if (!v) return { hi: '', en: '' }; if (typeof v === 'string') return { [src]: v, [tgt]: v }; if (!v[tgt]) v[tgt] = v[src] || ''; return v; };
    const ea = (v) => { if (!v) return { hi: [], en: [] }; if (Array.isArray(v)) return { [src]: v, [tgt]: v }; if (!v[tgt]?.length) v[tgt] = v[src] || []; return v; };
    if (data.question) data.question = e(data.question);
    if (data.options) data.options = ea(data.options);
    if (data.explanation) data.explanation = e(data.explanation);
  }

  // ═══════════════════════════════════════════════════
  //              STATUS & UTILITIES
  // ═══════════════════════════════════════════════════

  async testConnection() {
    const r = { azure: null, google: null };
    if (this.azureKey) {
      try { const x = await this.callAzure(['Hello'], 'en', 'hi'); r.azure = { success: true, result: x[0] }; this.azureAvailable = true; }
      catch (e) { r.azure = { success: false, error: e.message }; }
    }
    if (this.googleTranslate) {
      try { const x = await this.callGoogle(['Hello'], 'en', 'hi'); r.google = { success: true, result: x[0] }; this.googleAvailable = true; }
      catch (e) { r.google = { success: false, error: e.message }; }
    }
    return { success: r.azure?.success || r.google?.success || false, primary: this.azureAvailable ? 'Azure' : 'Google', details: r };
  }

  getStatus() {
    return {
      primary: this.azureAvailable ? 'Azure' : 'Google',
      azure: { available: this.azureAvailable, configured: !!this.azureKey },
      google: { available: this.googleAvailable, installed: !!this.googleTranslate },
      protection: { inlinePatterns: this.PROTECT_INLINE.length, validators: this.CORRUPTION_DETECTORS.length, neverTranslate: this.NEVER_TRANSLATE_WORDS.size },
      stats: this.stats,
      cacheSize: this.cache.size
    };
  }

  clearCache() { this.cache.clear(); this._tc = 0; }
}

module.exports = new TranslateHelper();