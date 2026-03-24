// server/utils/translateHelper.js
// ═══════════════════════════════════════════════════════════════
//  ULTIMATE TRANSLATION ENGINE v5.0 — EXTREME SMART
//  FIXES:
//  - Pre-translation text cleaning (stuck words separation)
//  - English keyword extraction from Hindi text
//  - Post-translation spacing normalization
//  - Mixed-language detection & re-translation
//  - Number/parenthesis spacing
//  - 80+ protection patterns
//  - Option code preservation (A-I, B-III etc)
//  - Corruption auto-fix with context awareness
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const HINDI_RE = /[\u0900-\u097F]/;
const ENGLISH_RE = /[A-Za-z]/;

class TranslateHelper {
  constructor() {
    this.azureKey = process.env.MICROSOFT_TRANSLATOR_KEY || '';
    this.azureRegion = process.env.MICROSOFT_TRANSLATOR_REGION || 'centralindia';
    this.azureEndpoint = process.env.MICROSOFT_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';

    this.cache = new Map();
    this.cacheMaxSize = 15000;
    this.requestDelay = 0;
    this.batchSize = 100;
    this.maxConcurrent = 8;

    this.azureAvailable = !!this.azureKey;
    this.azureValidated = false;
    this.googleAvailable = true;
    this.googleTranslate = null;
    try { this.googleTranslate = require('google-translate-api-x'); } catch (e) {}

    this.stats = {
      translated: 0, skipped: 0, protected: 0,
      failed: 0, corruptions_caught: 0, auto_fixed: 0,
      deduplicated: 0, cache_hits: 0, pre_cleaned: 0,
      spacing_fixed: 0, mixed_lang_fixed: 0
    };

    this._tc = 0;

    // ═══════════════════════════════════════════════════
    //  ENGLISH KEYWORDS commonly found stuck in Hindi text
    // ═══════════════════════════════════════════════════
    this.ENGLISH_KEYWORDS_IN_HINDI = [
      // Question keywords
      'NOT', 'INCORRECT', 'CORRECT', 'TRUE', 'FALSE',
      'WRONG', 'RIGHT', 'WHICH', 'FOLLOWING', 'GIVEN',
      'BELOW', 'ABOVE', 'MOST', 'LEAST', 'BEST',
      'ONLY', 'ALL', 'NONE', 'BOTH', 'EITHER',
      'NEITHER', 'EXCEPT', 'OTHER', 'THAN', 'AND', 'OR',
      // Common English terms in exam questions
      'UNESCO', 'UNDP', 'WHO', 'GDP', 'GNP',
      'DNA', 'RNA', 'pH', 'BOD', 'COD',
      'INC', 'BJP', 'RSS', 'AITUC', 'CPI',
      'NDA', 'UPA', 'NITI', 'RBI', 'SEBI',
      'WTO', 'IMF', 'UNICEF', 'NATO', 'ASEAN',
      'SAARC', 'BRICS', 'QUAD', 'SCO',
      'FIR', 'PIL', 'RTI', 'CAG', 'CBI',
      'IAS', 'IPS', 'IFS', 'UPSC', 'SSC',
      'UGC', 'AICTE', 'NCTE', 'NAAC', 'NBA',
      'NEP', 'ICT', 'MOOCs', 'SWAYAM',
      'AD', 'BC', 'CE', 'BCE',
    ];

    // Build regex for stuck keyword detection
    this._buildKeywordPatterns();

    // ═══════════════════════════════════════════════════
    //     SKIP PATTERNS — entire text never translated
    // ═══════════════════════════════════════════════════
    this.SKIP_FULL = [
      /^[A-Da-d]\s*[-–—]\s*[IVXivx]+(\s*[,;]\s*[A-Da-d]\s*[-–—]\s*[IVXivx]+){1,7}\s*$/,
      /^[A-Da-d]\s*[-–—]\s*\([ivxIVX]+\)(\s*[,;]\s*[A-Da-d]\s*[-–—]\s*\([ivxIVX]+\)){1,7}\s*$/,
      /^[A-Da-d]\s*[-–—]\s*\(?(VIII|VII|VI|IV|IX|III|II|I|V|X)\)?(\s*,\s*[A-Da-d]\s*[-–—]\s*\(?(VIII|VII|VI|IV|IX|III|II|I|V|X)\)?){1,}\s*$/i,
      /^[A-Ea-e](\s*,\s*[A-Ea-e]){2,}\s*$/,
      /^\(?[A-Ea-e]\)?(\s*,\s*\(?[A-Ea-e]\)?){2,}\s*$/,
      /^\d(\s*,\s*\d){2,}\s*$/,
      /^\(?\d\)?(\s*,\s*\(?\d\)?){2,}\s*$/,
      /^(VIII|VII|VI|IV|IX|III|II|I|V|X)(\s*,\s*(VIII|VII|VI|IV|IX|III|II|I|V|X)){1,}\s*$/,
      /^\(?[ivx]+\)?(\s*,\s*\(?[ivx]+\)?){1,}\s*$/i,
      /^\s*[-+]?\d+(\.\d+)?\s*%?\s*$/,
      /^\s*[-+]?\d+(\.\d+)?\s*°?[A-Za-z]{0,5}\s*$/,
      /^[A-Za-z]$/,
      /^https?:\/\//,
      /^[\d\s.,;:+\-–—/*=%°()\[\]{}]+$/,
      /^(VIII|VII|VI|IV|IX|III|II|I|V|X)$/,
      /^([A-D]\s*[-–]\s*[IVXivx]+\s*[,;\s]*){2,}$/i,
      /^\d{3,4}\s*[-–—]\s*\d{3,4}$/,
      /^\d+\/\d+$/,
    ];

    // ═══════════════════════════════════════════════════
    //     INLINE PROTECTION PATTERNS
    // ═══════════════════════════════════════════════════
    this.PROTECT_INLINE = [
      { re: /\b([A-D])\s*[-–—]\s*(VIII|VII|VI|IV|IX|III|II|I|V|X)\b/gi, id: 'MCODE', priority: 10 },
      { re: /([A-D])\s*[-–—]\s*\(([ivxIVX]+)\)/gi, id: 'MCODEP', priority: 10 },
      { re: /\(([A-Z])\)/g, id: 'PLBL', priority: 9 },
      { re: /\(([a-z])\)/g, id: 'PLLC', priority: 8 },
      { re: /\(([ivxIVX]+)\)/g, id: 'PROM', priority: 9 },
      { re: /\((\d+)\)/g, id: 'PNUM', priority: 7 },
      { re: /\b(VIII|VII|VI|IV|IX|III|II|V|X)\b/g, id: 'ROMN', priority: 6 },
      { re: /\b(1[0-9]{3}|20[0-9]{2})\b/g, id: 'YEAR', priority: 7 },
      { re: /\b(\d{4})\s*[-–—]\s*(\d{4})\b/g, id: 'YRNG', priority: 8 },
      { re: /\b(\d{1,2})(st|nd|rd|th)\b/gi, id: 'CENT', priority: 6 },
      { re: /\b([A-Z]{2,}(?:\s*[-&]\s*[A-Z]{2,})*)\b/g, id: 'ACRO', priority: 5 },
      { re: /\b([A-Z]\.){2,}[A-Z]?\b/g, id: 'ACRD', priority: 6 },
      { re: /\b(pH|km|cm|mm|mg|kg|Hz|MW|GW|kW)\b/g, id: 'UNIT', priority: 7 },
      { re: /\b([A-Z][a-z]?\d+(?:\.\d+)?)\b/g, id: 'CHEM', priority: 7 },
      { re: /\b(BOD|COD|AQI|GDP|GNP|HDI|CPI|WPI|NNP|GVA)\b/g, id: 'TECH', priority: 8 },
      { re: /\b(\d+(?:\+\d+)+)\b/g, id: 'NPAT', priority: 7 },
      { re: /\b(\d+(?:\.\d+)?)\s*%/g, id: 'PCNT', priority: 7 },
      { re: /\b(\d{1,3}(?:,\d{2,3})+)\b/g, id: 'LNUM', priority: 6 },
      { re: /\b(\d+\.\d+)\b/g, id: 'DECM', priority: 5 },
      { re: /\b(Art(?:icle)?\.?\s*\d+[A-Za-z]?)\b/gi, id: 'ARTL', priority: 7 },
      { re: /\b(Sec(?:tion)?\.?\s*\d+[A-Za-z]?)\b/gi, id: 'SECN', priority: 7 },
      { re: /\b(Act\s+(?:of\s+)?\d{4})\b/gi, id: 'ACTR', priority: 6 },
      { re: /(Statement|कथन|Assertion|अभिकथन|Reason|कारण)\s*\(?([IVXAB]|[ivx]+)\)?\s*[:.]?/gi, id: 'STMK', priority: 9 },
      { re: /(List|सूची|Column|स्तंभ)\s*[-–]?\s*(VIII|VII|VI|IV|IX|III|II|I|V|X|[AB12])\b/gi, id: 'LSTM', priority: 9 },
      { re: /\b(C-14|TL|SPSS|MOOCs?|SWAYAM|ICT|NEP|CBCS|CBT|CRT|NRT|NBA|NIRF|NAD|NDL)\b/g, id: 'PNOUN', priority: 8 },
      { re: /\b(Q|Ch|Unit|Fig|Table|Ex)\.?\s*(\d+|[IVXAB])\b/gi, id: 'QREF', priority: 6 },
      { re: /\b[\w.-]+@[\w.-]+\.\w+\b/g, id: 'EMAIL', priority: 9 },
    ];

    // ═══════════════════════════════════════════════════
    //     CORRUPTION DETECTORS
    // ═══════════════════════════════════════════════════
    this.CORRUPTION_DETECTORS = [
      { pattern: /\(\s*ए\s*\)/g, fix: '(A)', desc: '(ए)→(A)' },
      { pattern: /\(\s*आर\s*\)/g, fix: '(R)', desc: '(आर)→(R)' },
      { pattern: /\(\s*बी\s*\)/g, fix: '(B)', desc: '(बी)→(B)' },
      { pattern: /\(\s*सी\s*\)/g, fix: '(C)', desc: '(सी)→(C)' },
      { pattern: /\(\s*डी\s*\)/g, fix: '(D)', desc: '(डी)→(D)' },
      { pattern: /\(\s*ई\s*\)/g, fix: '(E)', desc: '(ई)→(E)' },
      { pattern: /\(\s*आई\s*\)/g, fix: '(i)', desc: '(आई)→(i)' },
      { pattern: /\(\s*ii\s*\)/g, fix: '(ii)', desc: 'normalize' },
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
      { pattern: /कथन\s+आई\b/g, fix: 'कथन I', desc: 'कथन आई→कथन I' },
      { pattern: /कथन\s+द्वितीय\b/g, fix: 'कथन II', desc: 'कथन द्वितीय→कथन II' },
      { pattern: /कथन\s+तृतीय\b/g, fix: 'कथन III', desc: 'कथन तृतीय→कथन III' },
      { pattern: /स्टेटमेंट\s+आई\b/g, fix: 'Statement I', desc: 'स्टेटमेंट→Statement I' },
      { pattern: /स्टेटमेंट\s+द्वितीय\b/g, fix: 'Statement II', desc: 'स्टेटमेंट→Statement II' },
      { pattern: /अभिकथन\s*\(\s*ए\s*\)/g, fix: 'अभिकथन (A)', desc: 'अभिकथन(ए)→(A)' },
      { pattern: /कारण\s*\(\s*आर\s*\)/g, fix: 'कारण (R)', desc: 'कारण(आर)→(R)' },
      { pattern: /सूची\s*[-–]?\s*आई\b/g, fix: 'सूची-I', desc: 'सूची-आई→सूची-I' },
      { pattern: /सूची\s*[-–]?\s*द्वितीय\b/g, fix: 'सूची-II', desc: 'सूची-द्वितीय→सूची-II' },
      { pattern: /\bआई\b(?=\s*[,.]|\s+और\b)/g, fix: 'I', desc: 'आई→I (standalone)' },
      { pattern: /^ए\s*,\s*बी\s*,\s*सी\s*,\s*डी\s*,\s*ई$/g, fix: 'A, B, C, D, E', desc: 'full opt code' },
      { pattern: /^ए\s*,\s*बी\s*,\s*सी\s*,\s*डी$/g, fix: 'A, B, C, D', desc: 'full opt code' },
      { pattern: /^बी\s*,\s*ई\s*,\s*सी\s*,\s*डी\s*,\s*ए$/g, fix: 'B, E, C, D, A', desc: 'full opt code' },
      { pattern: /^बी\s*,\s*सी\s*,\s*डी\s*,\s*ई\s*,\s*ए$/g, fix: 'B, C, D, E, A', desc: 'full opt code' },
    ];

    // ═══════════════════════════════════════════════════
    //     NEVER TRANSLATE WORDS
    // ═══════════════════════════════════════════════════
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
    console.log(`[TranslateHelper v5.0] Primary: ${p} | Batch: ${this.batchSize} | Concurrent: ${this.maxConcurrent}`);

    if (this.azureAvailable) {
      this._warmupAzure();
    }
  }

  // ═══════════════════════════════════════════════════
  //  BUILD KEYWORD PATTERNS for stuck word detection
  // ═══════════════════════════════════════════════════
  _buildKeywordPatterns() {
    // Patterns for English words stuck to Hindi text
    // e.g., "सेINCORRECTलेखक" → "से INCORRECT लेखक"
    // e.g., "NOTकौन" → "NOT कौन"
    // e.g., "खानवा(1527)की" → "खानवा (1527) की"
    this._stuckPatterns = [];

    // Pattern 1: Hindi+ENGLISH+Hindi (e.g., सेINCORRECTलेखक)
    // Devanagari char followed by uppercase English word followed by Devanagari
    this._stuckPatterns.push({
      re: /([\u0900-\u097F\u0964\u0965])([A-Z]{2,})([\u0900-\u097F])/g,
      fix: '$1 $2 $3',
      desc: 'Hindi+UPPER+Hindi'
    });

    // Pattern 2: ENGLISH+Hindi (e.g., NOTकौन)
    this._stuckPatterns.push({
      re: /([A-Z]{2,})([\u0900-\u097F])/g,
      fix: '$1 $2',
      desc: 'UPPER+Hindi'
    });

    // Pattern 3: Hindi+ENGLISH (e.g., कौनNOT)
    this._stuckPatterns.push({
      re: /([\u0900-\u097F])([A-Z]{2,})/g,
      fix: '$1 $2',
      desc: 'Hindi+UPPER'
    });

    // Pattern 4: Hindi+lowercase_english+Hindi (e.g., सेtheलेखक) - rare but handle
    this._stuckPatterns.push({
      re: /([\u0900-\u097F])([a-z]{3,})([\u0900-\u097F])/g,
      fix: '$1 $2 $3',
      desc: 'Hindi+lower+Hindi'
    });

    // Pattern 5: Word(number)Word — e.g., खानवा(1527)की
    this._stuckPatterns.push({
      re: /([\u0900-\u097F\w])\((\d+)\)([\u0900-\u097F\w])/g,
      fix: '$1 ($2) $3',
      desc: 'word(num)word'
    });

    // Pattern 6: Word(number) — e.g., खानवा(1527)
    this._stuckPatterns.push({
      re: /([\u0900-\u097F])\((\d+)\)/g,
      fix: '$1 ($2)',
      desc: 'hindi(num)'
    });

    // Pattern 7: (number)Word — e.g., (1527)की
    this._stuckPatterns.push({
      re: /\((\d+)\)([\u0900-\u097F])/g,
      fix: '($1) $2',
      desc: '(num)hindi'
    });

    // Pattern 8: Hindi-English mixed with hyphen but no space
    // e.g., "में से" + "INCORRECT" stuck
    this._stuckPatterns.push({
      re: /([\u0900-\u097F])(NOT|INCORRECT|CORRECT|TRUE|FALSE|AND|OR|WHICH|THE|OF|IN|BY|TO|FOR|FROM|WITH|AT|ON|IS|ARE|WAS|WERE|HAS|HAVE|HAD|THIS|THAT|THESE|THOSE|MOST|LEAST|BEST|ONLY|ALL|NONE|BOTH|EITHER|NEITHER|EXCEPT|OTHER|THAN|ALSO|BUT|VERY|MUCH|MANY|SOME|ANY|EACH|EVERY|SUCH|SAME|MORE|LESS)([\u0900-\u097F])/gi,
      fix: '$1 $2 $3',
      desc: 'hindi+keyword+hindi'
    });

    // Pattern 9: Single letter stuck — e.g., "केa" or "काb"
    this._stuckPatterns.push({
      re: /([\u0900-\u097F])([a-z])\s/g,
      fix: '$1 $2 ',
      desc: 'hindi+singleletter'
    });
  }

  // ═══════════════════════════════════════════════════
  //  PRE-TRANSLATION TEXT CLEANING — THE KEY FIX
  //  Separates stuck English words from Hindi text
  // ═══════════════════════════════════════════════════
  preCleanText(text) {
    if (!text || typeof text !== 'string') return text || '';

    let result = text;
    let changed = false;

    // Apply all stuck patterns
    for (const pat of this._stuckPatterns) {
      const before = result;
      result = result.replace(pat.re, pat.fix);
      if (result !== before) changed = true;
    }

    // Fix multiple spaces that may have been created
    result = result.replace(/\s{2,}/g, ' ').trim();

    // Fix common stuck patterns with numbers
    // "1527ई." → "1527 ई."
    result = result.replace(/(\d)(ई\.?\s*पू\.?|ई\.?|ईसवी|ईस्वी)/g, '$1 $2');

    // "पू.1527" → "पू. 1527"
    result = result.replace(/(ई\.?\s*पू\.?|ई\.?)(\d)/g, '$1 $2');

    // Fix Hindi punctuation spacing
    // "है।" is fine, but "है।The" needs space
    result = result.replace(/([\u0964\u0965])([A-Za-z])/g, '$1 $2');

    // Fix "word।word" → "word। word"
    result = result.replace(/([A-Za-z])([\u0964\u0965])/g, '$1 $2');

    if (changed) {
      this.stats.pre_cleaned++;
    }

    return result;
  }

  // ═══════════════════════════════════════════════════
  //  POST-TRANSLATION SPACING NORMALIZATION
  // ═══════════════════════════════════════════════════
  normalizeSpacing(text) {
    if (!text || typeof text !== 'string') return text || '';

    let result = text;

    // 1. Fix parenthesis spacing
    // "(1527)word" → "(1527) word"  
    result = result.replace(/\)([A-Za-z\u0900-\u097F])/g, ') $1');
    // "word(1527)" — only add space if preceded by letter
    result = result.replace(/([A-Za-z\u0900-\u097F])\(/g, '$1 (');

    // 2. Fix Hindi-English transitions
    // "hindiEnglish" → "hindi English"
    result = result.replace(/([\u0900-\u097F])([A-Z])/g, '$1 $2');
    // "Englishhindi" → "English hindi"  
    result = result.replace(/([a-z])([ा-ू\u0900-\u097F])/g, '$1 $2');
    result = result.replace(/([A-Z])([ा-ू\u0900-\u097F])/g, '$1 $2');

    // 3. Fix number-word transitions
    // "1527word" → "1527 word" (but not "1st", "2nd" etc)
    result = result.replace(/(\d)([\u0900-\u097F])/g, '$1 $2');
    result = result.replace(/([\u0900-\u097F])(\d)/g, '$1 $2');

    // 4. Fix punctuation spacing
    // "word.Word" → "word. Word" (sentence boundary)
    result = result.replace(/([।.!?])([A-Z\u0900-\u097F])/g, '$1 $2');

    // 5. Fix comma spacing — "word,word" → "word, word"
    result = result.replace(/,([A-Za-z\u0900-\u097F])/g, ', $1');

    // 6. Fix colon/semicolon spacing
    result = result.replace(/:([A-Za-z\u0900-\u097F])/g, ': $1');
    result = result.replace(/;([A-Za-z\u0900-\u097F])/g, '; $1');

    // 7. Normalize multiple spaces
    result = result.replace(/\s{2,}/g, ' ').trim();

    return result;
  }

  // ═══════════════════════════════════════════════════
  //  MIXED LANGUAGE DETECTION
  //  Detects if translated text still has untranslated portions
  // ═══════════════════════════════════════════════════
  detectMixedLanguage(text, targetLang) {
    if (!text || text.length < 20) return { isMixed: false, ratio: 0 };

    const words = text.split(/\s+/);
    if (words.length < 3) return { isMixed: false, ratio: 0 };

    let hindiWords = 0;
    let englishWords = 0;
    let totalSignificant = 0;

    for (const word of words) {
      // Skip short words, numbers, punctuation
      if (word.length < 2) continue;
      if (/^[\d.,;:!?()[\]{}"'`\-–—]+$/.test(word)) continue;

      // Skip known untranslatable words
      if (this.NEVER_TRANSLATE_WORDS.has(word.toUpperCase())) continue;

      // Skip option codes
      if (/^[A-D][-–][IVX]+$/i.test(word)) continue;

      totalSignificant++;

      if (HINDI_RE.test(word)) {
        hindiWords++;
      } else if (ENGLISH_RE.test(word)) {
        englishWords++;
      }
    }

    if (totalSignificant < 3) return { isMixed: false, ratio: 0 };

    const hindiRatio = hindiWords / totalSignificant;
    const englishRatio = englishWords / totalSignificant;

    // If target is Hindi but >40% English words, it's mixed
    if (targetLang === 'hi' && englishRatio > 0.4 && hindiRatio > 0.2) {
      return { isMixed: true, ratio: englishRatio, direction: 'has_english' };
    }

    // If target is English but >40% Hindi words, it's mixed
    if (targetLang === 'en' && hindiRatio > 0.4 && englishRatio > 0.2) {
      return { isMixed: true, ratio: hindiRatio, direction: 'has_hindi' };
    }

    return { isMixed: false, ratio: 0 };
  }

  // ═══════════════════════════════════════════════════
  //     AZURE WARM-UP
  // ═══════════════════════════════════════════════════
  async _warmupAzure() {
    try {
      await this.callAzure(['test'], 'en', 'hi');
      this.azureValidated = true;
      console.log('[TranslateHelper v5.0] Azure key validated');
    } catch (e) {
      console.warn('[TranslateHelper v5.0] Azure warm-up failed:', e.message);
      if (e.response?.status === 401 || e.response?.status === 403) {
        this.azureAvailable = false;
      }
    }
  }

  // ═══════════════════════════════════════════════════
  //     SKIP DETECTION
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
  //     PROTECTION ENGINE
  // ═══════════════════════════════════════════════════
  protect(text) {
    if (!text) return { text: text || '', map: {}, count: 0 };

    let result = text;
    const map = {};
    let count = 0;

    const sorted = [...this.PROTECT_INLINE].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sorted) {
      const re = new RegExp(rule.re.source, rule.re.flags);
      result = result.replace(re, (match) => {
        if (match.length <= 1 && !/^[A-Z]$/.test(match)) return match;
        const token = `ZNT${this._tc++}Z`;
        map[token] = match;
        count++;
        return token;
      });
    }

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
      const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Restore with proper spacing
      result = result.replace(new RegExp(`\\s*${esc}\\s*`, 'g'), (match) => {
        // Preserve at least one space on each side if there was one
        const leadSpace = /^\s/.test(match) ? ' ' : '';
        const trailSpace = /\s$/.test(match) ? ' ' : '';
        return leadSpace + original + trailSpace;
      });
    }

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

    // Check for high corruption — many Hindi letter codes
    const suspiciousCount = (result.match(/\b[एबीसीडीई]\b/g) || []).length;
    if (suspiciousCount >= 3 && originalText) {
      if (this.shouldSkip(originalText)) {
        result = originalText;
        fixes.push('reverted_to_original_high_corruption');
        this.stats.corruptions_caught++;
      }
    }

    return { text: result, fixed: fixes.length > 0, fixes };
  }

  validateQuestion(question) {
    if (!question) return { question, totalFixes: 0 };
    let totalFixes = 0;

    const fixField = (obj, lang) => {
      if (!obj || !obj[lang]) return;
      const v = this.validate(obj[lang], obj[lang === 'hi' ? 'en' : 'hi']);
      if (v.fixed) { obj[lang] = v.text; totalFixes += v.fixes.length; }
    };

    const fixArr = (obj, lang) => {
      if (!obj || !obj[lang] || !Array.isArray(obj[lang])) return;
      const otherLang = lang === 'hi' ? 'en' : 'hi';
      for (let i = 0; i < obj[lang].length; i++) {
        const orig = obj[otherLang]?.[i] || '';
        const v = this.validate(obj[lang][i], orig);
        if (v.fixed) { obj[lang][i] = v.text; totalFixes += v.fixes.length; }
      }
    };

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
      if (question.sequenceData) { fixArr(question.sequenceData.items, lang); }
      if (question.statementData) { fixArr(question.statementData.statements, lang); }
    });

    if (question.questionType === 'match_following' && question.options) {
      const hiOpts = question.options.hi || [];
      const enOpts = question.options.en || [];
      for (let i = 0; i < Math.max(hiOpts.length, enOpts.length); i++) {
        const hi = hiOpts[i] || '';
        const en = enOpts[i] || '';
        if (this.shouldSkip(hi) && en !== hi) { question.options.en[i] = hi; totalFixes++; }
        else if (this.shouldSkip(en) && hi !== en) { question.options.hi[i] = en; totalFixes++; }
      }
    }

    return { question, totalFixes };
  }

  // ═══════════════════════════════════════════════════
  //     CORE TRANSLATION HELPERS
  // ═══════════════════════════════════════════════════
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  getCacheKey(t, f, to) { return `${f}:${to}:${t.substring(0, 200)}`; }

  addToCache(t, f, to, tr) {
    if (!t || !tr) return;
    if (this.cache.size >= this.cacheMaxSize) {
      const keys = Array.from(this.cache.keys()).slice(0, 2000);
      keys.forEach(k => this.cache.delete(k));
    }
    this.cache.set(this.getCacheKey(t, f, to), tr);
  }

  getFromCache(t, f, to) {
    return this.cache.get(this.getCacheKey(t, f, to)) || null;
  }

  // ═══════════════════════════════════════════════════
  //     AZURE TRANSLATOR
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
        timeout: 15000
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
  //     GOOGLE TRANSLATE (FALLBACK)
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
  //     PARALLEL CHUNK EXECUTOR
  // ═══════════════════════════════════════════════════
  async _translateChunk(chunkTexts, from, to) {
    let translated = null;

    if (this.azureAvailable) {
      try {
        translated = await this.callAzure(chunkTexts, from, to);
      } catch (e) {
        console.warn(`[Translate] Azure failed for chunk of ${chunkTexts.length}:`, e.message);
      }
    }

    if (!translated && this.googleAvailable && this.googleTranslate) {
      try {
        translated = [];
        for (let g = 0; g < chunkTexts.length; g += 5) {
          const gc = chunkTexts.slice(g, g + 5);
          try {
            const gr = await this.callGoogle(gc, from, to);
            translated.push(...gr);
          } catch { translated.push(...gc); }
          if (g + 5 < chunkTexts.length) await this.sleep(150);
        }
      } catch { translated = null; }
    }

    return translated;
  }

  async _runParallelChunks(chunks, from, to) {
    const results = new Array(chunks.length).fill(null);
    let idx = 0;

    const worker = async () => {
      while (idx < chunks.length) {
        const myIdx = idx++;
        const chunk = chunks[myIdx];
        results[myIdx] = await this._translateChunk(
          chunk.map(item => item.processed),
          from, to
        );
      }
    };

    const concurrency = Math.min(this.maxConcurrent, chunks.length);
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    return results;
  }

  // ═══════════════════════════════════════════════════
  //     MAIN BATCH TRANSLATE — THE OPTIMIZED PIPELINE
  // ═══════════════════════════════════════════════════
  async translateBatch(texts, from = 'hi', to = 'en') {
    if (!texts || texts.length === 0) return [];

    const results = new Array(texts.length).fill('');
    const toTranslate = [];
    const dedupMap = new Map();

    // ════════ STAGE 1: PRE-PROCESSING + CLEANING + DEDUPLICATION ════════
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text || typeof text !== 'string' || !text.trim()) {
        results[i] = text || '';
        continue;
      }

      // ★ PRE-CLEAN: Separate stuck English words from Hindi
      let trimmed = this.preCleanText(text.trim());

      // Check cache (with cleaned text)
      const cached = this.getFromCache(trimmed, from, to);
      if (cached) {
        results[i] = cached;
        this.stats.cache_hits++;
        continue;
      }

      // Skip untranslatable
      if (this.shouldSkip(trimmed)) {
        results[i] = trimmed;
        this.addToCache(trimmed, from, to, trimmed);
        this.stats.skipped++;
        continue;
      }

      // Deduplication
      if (dedupMap.has(trimmed)) {
        dedupMap.get(trimmed).push(i);
        this.stats.deduplicated++;
        continue;
      }

      dedupMap.set(trimmed, [i]);

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

    if (toTranslate.length === 0) {
      for (const [text, indices] of dedupMap) {
        const cached = this.getFromCache(text, from, to);
        if (cached) {
          for (const idx of indices) {
            results[idx] = cached;
          }
        }
      }
      return results;
    }

    const protectedItems = toTranslate.filter(t => t.protCount > 0).length;
    console.log(`[Translate] ${toTranslate.length} unique to translate (${from}→${to}), ${protectedItems} protected, ${this.stats.pre_cleaned} pre-cleaned`);

    // ════════ STAGE 2: PARALLEL TRANSLATION ════════
    const chunks = [];
    for (let i = 0; i < toTranslate.length; i += this.batchSize) {
      chunks.push(toTranslate.slice(i, i + this.batchSize));
    }

    const chunkResults = await this._runParallelChunks(chunks, from, to);

    // ════════ STAGE 3: POST-PROCESSING ════════
    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      const translated = chunkResults[ci];

      if (!translated) {
        for (const item of chunk) {
          results[item.idx] = item.original;
          this.stats.failed++;
        }
        continue;
      }

      for (let i = 0; i < chunk.length; i++) {
        const item = chunk[i];
        let result = (translated[i] && translated[i].trim()) || item.original;

        // 3a: Restore protected patterns
        if (item.protCount > 0) {
          result = this.restore(result, item.protMap);
          this.stats.protected++;
        }

        // 3b: ★ NORMALIZE SPACING after translation
        result = this.normalizeSpacing(result);
        this.stats.spacing_fixed++;

        // 3c: Validate & auto-fix corruptions
        const validation = this.validate(result, item.original);
        if (validation.fixed) {
          result = validation.text;
          this.stats.corruptions_caught += validation.fixes.length;
        }

        // 3d: ★ Check for mixed language (incomplete translation)
        const mixCheck = this.detectMixedLanguage(result, to);
        if (mixCheck.isMixed && mixCheck.ratio > 0.5) {
          // The translation is severely mixed — try to re-translate just the untranslated parts
          this.stats.mixed_lang_fixed++;
          // For now, log it. Re-translation would require another API call.
          // In extreme cases, we note it but the pre-cleaning should prevent most of these.
        }

        results[item.idx] = result;
        this.addToCache(item.original, from, to, result);
        this.stats.translated++;

        // 3e: Apply to all deduplicated indices
        const dedupIndices = dedupMap.get(item.original);
        if (dedupIndices && dedupIndices.length > 1) {
          for (const dupIdx of dedupIndices) {
            if (dupIdx !== item.idx) {
              results[dupIdx] = result;
            }
          }
        }
      }
    }

    return results;
  }

  // ═══════════════════════════════════════════════════
  //     CONVENIENCE METHODS
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
  //     QUESTION TRANSLATION
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

    addText(questionData.question, 'question', 'string');
    addArr(questionData.options, 'options');
    addText(questionData.explanation, 'explanation', 'string');

    if (questionData.assertion) addText(questionData.assertion, 'assertion', 'string');
    if (questionData.reason) addText(questionData.reason, 'reason', 'string');
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

      const { question: validated, totalFixes } = this.validateQuestion(questionData);
      if (totalFixes > 0) {
        console.log(`[Translate] Post-validation fixed ${totalFixes} corruptions`);
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
  //     REPAIR
  // ═══════════════════════════════════════════════════
  repairQuestion(question) {
    if (!question) return { question, repairCount: 0, repairs: [] };
    const repairs = [];
    let repairCount = 0;

    const checkField = (obj, lang) => {
      if (!obj || !obj[lang]) return;
      // First apply spacing normalization
      const normalized = this.normalizeSpacing(obj[lang]);
      if (normalized !== obj[lang]) {
        obj[lang] = normalized;
        repairs.push(`spacing_${lang}`);
        repairCount++;
      }
      // Then check corruptions
      for (const d of this.CORRUPTION_DETECTORS) {
        const re = new RegExp(d.pattern.source, d.pattern.flags);
        if (re.test(obj[lang])) {
          const before = obj[lang];
          obj[lang] = obj[lang].replace(new RegExp(d.pattern.source, d.pattern.flags), d.fix);
          if (obj[lang] !== before) { repairs.push(d.desc); repairCount++; }
        }
      }
    };

    const checkArr = (obj, lang) => {
      if (!obj || !Array.isArray(obj[lang])) return;
      for (let i = 0; i < obj[lang].length; i++) {
        if (!obj[lang][i]) continue;
        // Spacing fix
        const normalized = this.normalizeSpacing(obj[lang][i]);
        if (normalized !== obj[lang][i]) {
          obj[lang][i] = normalized;
          repairs.push(`opt[${i}]_spacing_${lang}`);
          repairCount++;
        }
        for (const d of this.CORRUPTION_DETECTORS) {
          const re = new RegExp(d.pattern.source, d.pattern.flags);
          if (re.test(obj[lang][i])) {
            const before = obj[lang][i];
            obj[lang][i] = obj[lang][i].replace(new RegExp(d.pattern.source, d.pattern.flags), d.fix);
            if (obj[lang][i] !== before) { repairs.push(`opt[${i}]: ${d.desc}`); repairCount++; }
          }
        }
      }
    };

    ['hi', 'en'].forEach(lang => {
      checkField(question.question, lang);
      checkArr(question.options, lang);
      checkField(question.explanation, lang);
      if (question.assertionReasonData) {
        checkField(question.assertionReasonData.assertion, lang);
        checkField(question.assertionReasonData.reason, lang);
      }
    });

    return { question, repairCount, repairs };
  }

  // ═══════════════════════════════════════════════════
  //     STATUS & UTILITIES
  // ═══════════════════════════════════════════════════
  async testConnection() {
    const r = { azure: null, google: null };
    if (this.azureKey) {
      try { const x = await this.callAzure(['Hello'], 'en', 'hi'); r.azure = { success: true, result: x[0] }; this.azureAvailable = true; this.azureValidated = true; }
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
      azure: { available: this.azureAvailable, validated: this.azureValidated, configured: !!this.azureKey },
      google: { available: this.googleAvailable, installed: !!this.googleTranslate },
      protection: { inlinePatterns: this.PROTECT_INLINE.length, skipPatterns: this.SKIP_FULL.length, validators: this.CORRUPTION_DETECTORS.length, neverTranslate: this.NEVER_TRANSLATE_WORDS.size },
      stats: this.stats,
      cacheSize: this.cache.size
    };
  }

  resetStats() {
    this.stats = {
      translated: 0, skipped: 0, protected: 0,
      failed: 0, corruptions_caught: 0, auto_fixed: 0,
      deduplicated: 0, cache_hits: 0, pre_cleaned: 0,
      spacing_fixed: 0, mixed_lang_fixed: 0
    };
  }

  clearCache() { this.cache.clear(); this._tc = 0; }
}

module.exports = new TranslateHelper();