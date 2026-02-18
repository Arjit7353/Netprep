// server/utils/translateHelper.js

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class TranslateHelper {
  constructor() {
    // Azure Translator Config
    this.azureKey = process.env.MICROSOFT_TRANSLATOR_KEY || '';
    this.azureRegion = process.env.MICROSOFT_TRANSLATOR_REGION || 'centralindia';
    this.azureEndpoint = process.env.MICROSOFT_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    
    // Cache
    this.cache = new Map();
    this.cacheMaxSize = 5000;
    
    // Rate limiting
    this.requestDelay = 50;
    this.batchSize = 50; // Azure supports up to 100 texts per request
    
    // Status
    this.azureAvailable = !!this.azureKey;
    this.googleAvailable = true;
    this.lastError = null;
    this.translationCount = 0;
    this.failedCount = 0;
    
    // Google Translate (fallback)
    this.googleTranslate = null;
    try {
      this.googleTranslate = require('google-translate-api-x');
    } catch (e) {
      console.warn('[TranslateHelper] google-translate-api-x not available');
    }
    
    const primary = this.azureAvailable ? 'Azure Translator' : 'Google Translate (Free)';
    console.log(`[TranslateHelper] Initialized - Primary: ${primary}`);
    
    if (this.azureAvailable) {
      console.log(`[TranslateHelper] Azure Region: ${this.azureRegion}`);
    }
  }

  // ==================== CORE TRANSLATION ====================

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache key
   */
  getCacheKey(text, from, to) {
    return `${from}:${to}:${text.substring(0, 150)}`;
  }

  /**
   * Add to cache
   */
  addToCache(text, from, to, translation) {
    if (!text || !translation) return;
    const key = this.getCacheKey(text, from, to);
    if (this.cache.size >= this.cacheMaxSize) {
      const keys = Array.from(this.cache.keys()).slice(0, 500);
      keys.forEach(k => this.cache.delete(k));
    }
    this.cache.set(key, translation);
  }

  /**
   * Get from cache
   */
  getFromCache(text, from, to) {
    if (!text) return null;
    const key = this.getCacheKey(text, from, to);
    return this.cache.get(key) || null;
  }

  // ==================== AZURE TRANSLATOR ====================

  /**
   * Translate using Azure Translator API (PRIMARY)
   */
  async translateWithAzure(texts, from = 'hi', to = 'en') {
    if (!this.azureAvailable || !this.azureKey) {
      throw new Error('Azure Translator not configured');
    }

    if (!texts || texts.length === 0) return [];

    const url = `${this.azureEndpoint}/translate?api-version=3.0&from=${from}&to=${to}`;
    
    // Azure accepts array of { Text: "..." }
    const body = texts.map(text => ({ Text: text || '' }));

    try {
      const response = await axios({
        method: 'POST',
        url,
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureKey,
          'Ocp-Apim-Subscription-Region': this.azureRegion,
          'Content-Type': 'application/json',
          'X-ClientTraceId': uuidv4()
        },
        data: body,
        timeout: 30000
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.map(item => {
          if (item.translations && item.translations.length > 0) {
            return item.translations[0].text || '';
          }
          return '';
        });
      }

      return texts.map(t => t || '');
    } catch (error) {
      const status = error.response?.status;
      const msg = error.response?.data?.error?.message || error.message;
      
      console.error(`[TranslateHelper] Azure error (${status}): ${msg}`);
      
      if (status === 401 || status === 403) {
        console.error('[TranslateHelper] Azure key invalid or expired!');
        this.azureAvailable = false;
      }
      
      throw error;
    }
  }

  // ==================== GOOGLE TRANSLATE (FALLBACK) ====================

  /**
   * Translate using Google Translate free API (FALLBACK)
   */
  async translateWithGoogle(texts, from = 'hi', to = 'en') {
    if (!this.googleTranslate) {
      throw new Error('Google Translate not available');
    }

    try {
      if (texts.length === 1) {
        const result = await this.googleTranslate(texts[0], { from, to });
        return [result.text || texts[0]];
      }

      // Google supports array input
      const result = await this.googleTranslate(texts, { from, to });
      
      if (Array.isArray(result)) {
        return result.map((r, i) => r.text || texts[i] || '');
      }
      
      return [result.text || texts[0]];
    } catch (error) {
      console.error('[TranslateHelper] Google Translate error:', error.message);
      
      if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
        this.googleAvailable = false;
        setTimeout(() => { this.googleAvailable = true; }, 60000); // Retry after 1 min
      }
      
      throw error;
    }
  }

  // ==================== MAIN BATCH TRANSLATE ====================

  /**
   * MAIN: Batch translate with Azure (primary) + Google (fallback) + Original (last resort)
   */
  async translateBatch(texts, from = 'hi', to = 'en') {
    if (!texts || texts.length === 0) return [];

    const results = new Array(texts.length).fill('');
    const toTranslate = []; // { index, text }

    // Step 1: Check cache
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];

      if (!text || typeof text !== 'string' || text.trim() === '') {
        results[i] = text || '';
        continue;
      }

      const cached = this.getFromCache(text, from, to);
      if (cached) {
        results[i] = cached;
        continue;
      }

      toTranslate.push({ index: i, text: text.trim() });
    }

    if (toTranslate.length === 0) {
      return results;
    }

    console.log(`[TranslateHelper] Translating ${toTranslate.length} texts (${from} → ${to}), ${texts.length - toTranslate.length} cached`);

    // Step 2: Split into chunks
    const chunks = [];
    for (let i = 0; i < toTranslate.length; i += this.batchSize) {
      chunks.push(toTranslate.slice(i, i + this.batchSize));
    }

    // Step 3: Translate each chunk
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      const chunkTexts = chunk.map(item => item.text);
      
      let translated = null;

      // Try Azure first
      if (this.azureAvailable) {
        try {
          translated = await this.translateWithAzure(chunkTexts, from, to);
        } catch (azureErr) {
          console.warn(`[TranslateHelper] Azure failed for chunk ${chunkIndex + 1}/${chunks.length}:`, azureErr.message);
        }
      }

      // Fallback to Google
      if (!translated && this.googleAvailable && this.googleTranslate) {
        try {
          // Google handles smaller batches better
          const googleChunkSize = 5;
          translated = [];
          
          for (let g = 0; g < chunkTexts.length; g += googleChunkSize) {
            const gChunk = chunkTexts.slice(g, g + googleChunkSize);
            try {
              const gResult = await this.translateWithGoogle(gChunk, from, to);
              translated.push(...gResult);
            } catch (gErr) {
              // Fill with originals for this mini-chunk
              translated.push(...gChunk);
            }
            
            if (g + googleChunkSize < chunkTexts.length) {
              await this.sleep(200); // Delay between Google requests
            }
          }
        } catch (googleErr) {
          console.warn(`[TranslateHelper] Google also failed:`, googleErr.message);
          translated = null;
        }
      }

      // Last resort: use original texts
      if (!translated) {
        console.warn(`[TranslateHelper] All translation failed, using originals for chunk ${chunkIndex + 1}`);
        translated = chunkTexts;
        this.failedCount += chunkTexts.length;
      }

      // Map results back
      for (let i = 0; i < chunk.length; i++) {
        const originalIndex = chunk[i].index;
        const originalText = chunk[i].text;
        const translatedText = (translated[i] && translated[i].trim()) || originalText;

        results[originalIndex] = translatedText;
        this.addToCache(originalText, from, to, translatedText);
        this.translationCount++;
      }

      // Delay between chunks
      if (chunkIndex < chunks.length - 1) {
        await this.sleep(this.requestDelay);
      }
    }

    return results;
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Translate single text
   */
  async translate(text, from = 'hi', to = 'en') {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text || '';
    }

    const results = await this.translateBatch([text], from, to);
    return results[0] || text;
  }

  /**
   * Alias for translate
   */
  async translateText(text, sourceLanguage = 'hi') {
    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
    return this.translate(text, sourceLanguage, targetLanguage);
  }

  /**
   * Translate array of strings
   */
  async translateArray(arr, from = 'hi', to = 'en') {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return arr || [];
    }
    return this.translateBatch(arr, from, to);
  }

  /**
   * Translate bilingual object { hi, en }
   */
  async translateBilingual(obj, sourceLanguage = 'hi') {
    if (!obj) return { hi: '', en: '' };

    if (typeof obj === 'string') {
      const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
      const translated = await this.translate(obj, sourceLanguage, targetLanguage);
      return {
        [sourceLanguage]: obj,
        [targetLanguage]: translated
      };
    }

    if (obj.hi && obj.en) return obj;

    if (obj.hi && !obj.en) {
      obj.en = await this.translate(obj.hi, 'hi', 'en');
    } else if (obj.en && !obj.hi) {
      obj.hi = await this.translate(obj.en, 'en', 'hi');
    }

    return obj;
  }

  /**
   * Translate bilingual array { hi: [], en: [] }
   */
  async translateBilingualArray(obj, sourceLanguage = 'hi') {
    if (!obj) return { hi: [], en: [] };

    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';

    if (obj[sourceLanguage] && obj[sourceLanguage].length > 0 && 
        (!obj[targetLanguage] || obj[targetLanguage].length === 0)) {
      obj[targetLanguage] = await this.translateBatch(obj[sourceLanguage], sourceLanguage, targetLanguage);
    }

    return obj;
  }

  // ==================== QUESTION/DI TRANSLATION ====================

  /**
   * Translate a question object (called from controller)
   */
  async translateQuestion(questionData, sourceLanguage = 'hi') {
    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
    
    // Collect all texts to translate at once
    const textsToTranslate = [];
    const textMap = []; // Track where each text goes

    // Question text
    if (questionData.question) {
      if (typeof questionData.question === 'string') {
        textsToTranslate.push(questionData.question);
        textMap.push({ field: 'question', type: 'string' });
      } else if (questionData.question[sourceLanguage] && !questionData.question[targetLanguage]) {
        textsToTranslate.push(questionData.question[sourceLanguage]);
        textMap.push({ field: 'question', type: 'bilingual' });
      }
    }

    // Options
    if (questionData.options) {
      if (Array.isArray(questionData.options)) {
        questionData.options.forEach((opt, i) => {
          textsToTranslate.push(opt);
          textMap.push({ field: 'options', type: 'array', index: i });
        });
      } else if (questionData.options[sourceLanguage] && 
                 (!questionData.options[targetLanguage] || questionData.options[targetLanguage].length === 0)) {
        questionData.options[sourceLanguage].forEach((opt, i) => {
          textsToTranslate.push(opt);
          textMap.push({ field: 'options', type: 'bilingualArray', index: i });
        });
      }
    }

    // Explanation
    if (questionData.explanation) {
      if (typeof questionData.explanation === 'string') {
        textsToTranslate.push(questionData.explanation);
        textMap.push({ field: 'explanation', type: 'string' });
      } else if (questionData.explanation[sourceLanguage] && !questionData.explanation[targetLanguage]) {
        textsToTranslate.push(questionData.explanation[sourceLanguage]);
        textMap.push({ field: 'explanation', type: 'bilingual' });
      }
    }

    // Assertion-Reason
    if (questionData.assertion) {
      textsToTranslate.push(questionData.assertion);
      textMap.push({ field: 'assertion', type: 'string' });
    }
    if (questionData.reason) {
      textsToTranslate.push(questionData.reason);
      textMap.push({ field: 'reason', type: 'string' });
    }
    if (questionData.assertionReasonData) {
      if (questionData.assertionReasonData.assertion?.[sourceLanguage]) {
        textsToTranslate.push(questionData.assertionReasonData.assertion[sourceLanguage]);
        textMap.push({ field: 'assertionReasonData.assertion', type: 'bilingual' });
      }
      if (questionData.assertionReasonData.reason?.[sourceLanguage]) {
        textsToTranslate.push(questionData.assertionReasonData.reason[sourceLanguage]);
        textMap.push({ field: 'assertionReasonData.reason', type: 'bilingual' });
      }
    }

    // Match Data
    if (questionData.matchData) {
      if (questionData.matchData.listA?.[sourceLanguage]) {
        questionData.matchData.listA[sourceLanguage].forEach((item, i) => {
          textsToTranslate.push(item);
          textMap.push({ field: 'matchData.listA', type: 'bilingualArray', index: i });
        });
      }
      if (questionData.matchData.listB?.[sourceLanguage]) {
        questionData.matchData.listB[sourceLanguage].forEach((item, i) => {
          textsToTranslate.push(item);
          textMap.push({ field: 'matchData.listB', type: 'bilingualArray', index: i });
        });
      }
    }

    // Sequence Data
    if (questionData.sequenceData?.items?.[sourceLanguage]) {
      questionData.sequenceData.items[sourceLanguage].forEach((item, i) => {
        textsToTranslate.push(item);
        textMap.push({ field: 'sequenceData.items', type: 'bilingualArray', index: i });
      });
    }

    // Statement Data
    if (questionData.statementData?.statements?.[sourceLanguage]) {
      questionData.statementData.statements[sourceLanguage].forEach((item, i) => {
        textsToTranslate.push(item);
        textMap.push({ field: 'statementData.statements', type: 'bilingualArray', index: i });
      });
    }

    // Translate all at once
    if (textsToTranslate.length === 0) return questionData;

    try {
      const translations = await this.translateBatch(textsToTranslate, sourceLanguage, targetLanguage);

      // Apply translations back
      let tIdx = 0;
      for (const map of textMap) {
        const translated = translations[tIdx] || '';
        tIdx++;

        switch (map.field) {
          case 'question':
            if (map.type === 'string') {
              questionData.question = { [sourceLanguage]: questionData.question, [targetLanguage]: translated };
            } else {
              questionData.question[targetLanguage] = translated;
            }
            break;

          case 'options':
            if (map.type === 'array') {
              if (!questionData.options._converted) {
                const orig = questionData.options;
                questionData.options = { [sourceLanguage]: orig, [targetLanguage]: [] };
                questionData.options._converted = true;
              }
              questionData.options[targetLanguage].push(translated);
            } else {
              if (!questionData.options[targetLanguage]) questionData.options[targetLanguage] = [];
              questionData.options[targetLanguage].push(translated);
            }
            break;

          case 'explanation':
            if (map.type === 'string') {
              questionData.explanation = { [sourceLanguage]: questionData.explanation, [targetLanguage]: translated };
            } else {
              questionData.explanation[targetLanguage] = translated;
            }
            break;

          case 'assertion':
            if (!questionData.assertionReasonData) questionData.assertionReasonData = {};
            questionData.assertionReasonData.assertion = {
              [sourceLanguage]: questionData.assertion,
              [targetLanguage]: translated
            };
            delete questionData.assertion;
            break;

          case 'reason':
            if (!questionData.assertionReasonData) questionData.assertionReasonData = {};
            questionData.assertionReasonData.reason = {
              [sourceLanguage]: questionData.reason,
              [targetLanguage]: translated
            };
            delete questionData.reason;
            break;

          case 'assertionReasonData.assertion':
            questionData.assertionReasonData.assertion[targetLanguage] = translated;
            break;

          case 'assertionReasonData.reason':
            questionData.assertionReasonData.reason[targetLanguage] = translated;
            break;

          case 'matchData.listA':
            if (!questionData.matchData.listA[targetLanguage]) questionData.matchData.listA[targetLanguage] = [];
            questionData.matchData.listA[targetLanguage].push(translated);
            break;

          case 'matchData.listB':
            if (!questionData.matchData.listB[targetLanguage]) questionData.matchData.listB[targetLanguage] = [];
            questionData.matchData.listB[targetLanguage].push(translated);
            break;

          case 'sequenceData.items':
            if (!questionData.sequenceData.items[targetLanguage]) questionData.sequenceData.items[targetLanguage] = [];
            questionData.sequenceData.items[targetLanguage].push(translated);
            break;

          case 'statementData.statements':
            if (!questionData.statementData.statements[targetLanguage]) questionData.statementData.statements[targetLanguage] = [];
            questionData.statementData.statements[targetLanguage].push(translated);
            break;
        }
      }

      // Clean up
      if (questionData.options?._converted) {
        delete questionData.options._converted;
      }

    } catch (error) {
      console.warn('[TranslateHelper] translateQuestion failed:', error.message);
      // Ensure bilingual fields exist even if translation fails
      this.ensureBilingualFields(questionData, sourceLanguage);
    }

    return questionData;
  }

  /**
   * Translate DI Data object (called from controller)
   */
  async translateDIData(diData, sourceLanguage = 'hi') {
    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
    const textsToTranslate = [];
    const textMap = [];

    // Title
    if (diData.title) {
      if (typeof diData.title === 'string') {
        textsToTranslate.push(diData.title);
        textMap.push({ field: 'title', type: 'string' });
      } else if (diData.title[sourceLanguage] && !diData.title[targetLanguage]) {
        textsToTranslate.push(diData.title[sourceLanguage]);
        textMap.push({ field: 'title', type: 'bilingual' });
      }
    }

    // Instruction
    if (diData.instruction) {
      if (typeof diData.instruction === 'string') {
        textsToTranslate.push(diData.instruction);
        textMap.push({ field: 'instruction', type: 'string' });
      } else if (diData.instruction[sourceLanguage] && !diData.instruction[targetLanguage]) {
        textsToTranslate.push(diData.instruction[sourceLanguage]);
        textMap.push({ field: 'instruction', type: 'bilingual' });
      }
    }

    // Caselet text
    if (diData.caseletText) {
      if (typeof diData.caseletText === 'string') {
        textsToTranslate.push(diData.caseletText);
        textMap.push({ field: 'caseletText', type: 'string' });
      } else if (diData.caseletText[sourceLanguage] && !diData.caseletText[targetLanguage]) {
        textsToTranslate.push(diData.caseletText[sourceLanguage]);
        textMap.push({ field: 'caseletText', type: 'bilingual' });
      }
    }

    // Table headers
    if (diData.tableData?.headers) {
      if (Array.isArray(diData.tableData.headers)) {
        diData.tableData.headers.forEach((h, i) => {
          textsToTranslate.push(h);
          textMap.push({ field: 'tableData.headers', type: 'array', index: i });
        });
      } else if (diData.tableData.headers[sourceLanguage]) {
        diData.tableData.headers[sourceLanguage].forEach((h, i) => {
          textsToTranslate.push(h);
          textMap.push({ field: 'tableData.headers', type: 'bilingualArray', index: i });
        });
      }
    }

    // Chart labels
    if (diData.chartData?.labels) {
      if (Array.isArray(diData.chartData.labels)) {
        diData.chartData.labels.forEach((l, i) => {
          textsToTranslate.push(l);
          textMap.push({ field: 'chartData.labels', type: 'array', index: i });
        });
      } else if (diData.chartData.labels[sourceLanguage]) {
        diData.chartData.labels[sourceLanguage].forEach((l, i) => {
          textsToTranslate.push(l);
          textMap.push({ field: 'chartData.labels', type: 'bilingualArray', index: i });
        });
      }
    }

    if (textsToTranslate.length === 0) return diData;

    try {
      const translations = await this.translateBatch(textsToTranslate, sourceLanguage, targetLanguage);

      let tIdx = 0;
      for (const map of textMap) {
        const translated = translations[tIdx] || '';
        tIdx++;

        switch (map.field) {
          case 'title':
            if (map.type === 'string') {
              diData.title = { [sourceLanguage]: diData.title, [targetLanguage]: translated };
            } else {
              diData.title[targetLanguage] = translated;
            }
            break;

          case 'instruction':
            if (map.type === 'string') {
              diData.instruction = { [sourceLanguage]: diData.instruction, [targetLanguage]: translated };
            } else {
              diData.instruction[targetLanguage] = translated;
            }
            break;

          case 'caseletText':
            if (map.type === 'string') {
              diData.caseletText = { [sourceLanguage]: diData.caseletText, [targetLanguage]: translated };
            } else {
              diData.caseletText[targetLanguage] = translated;
            }
            break;

          case 'tableData.headers':
            if (map.type === 'array') {
              if (!diData.tableData.headers._converted) {
                const orig = diData.tableData.headers;
                diData.tableData.headers = { [sourceLanguage]: orig, [targetLanguage]: [] };
                diData.tableData.headers._converted = true;
              }
              diData.tableData.headers[targetLanguage].push(translated);
            } else {
              if (!diData.tableData.headers[targetLanguage]) diData.tableData.headers[targetLanguage] = [];
              diData.tableData.headers[targetLanguage].push(translated);
            }
            break;

          case 'chartData.labels':
            if (map.type === 'array') {
              if (!diData.chartData.labels._converted) {
                const orig = diData.chartData.labels;
                diData.chartData.labels = { [sourceLanguage]: orig, [targetLanguage]: [] };
                diData.chartData.labels._converted = true;
              }
              diData.chartData.labels[targetLanguage].push(translated);
            } else {
              if (!diData.chartData.labels[targetLanguage]) diData.chartData.labels[targetLanguage] = [];
              diData.chartData.labels[targetLanguage].push(translated);
            }
            break;
        }
      }

      // Clean up
      if (diData.tableData?.headers?._converted) delete diData.tableData.headers._converted;
      if (diData.chartData?.labels?._converted) delete diData.chartData.labels._converted;

    } catch (error) {
      console.warn('[TranslateHelper] translateDIData failed:', error.message);
    }

    return diData;
  }

  /**
   * Ensure bilingual fields exist (fallback)
   */
  ensureBilingualFields(data, sourceLanguage) {
    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';

    const ensureBilingual = (val) => {
      if (!val) return { hi: '', en: '' };
      if (typeof val === 'string') return { [sourceLanguage]: val, [targetLanguage]: val };
      if (!val[targetLanguage]) val[targetLanguage] = val[sourceLanguage] || '';
      return val;
    };

    const ensureBilingualArr = (val) => {
      if (!val) return { hi: [], en: [] };
      if (Array.isArray(val)) return { [sourceLanguage]: val, [targetLanguage]: val };
      if (!val[targetLanguage] || val[targetLanguage].length === 0) {
        val[targetLanguage] = val[sourceLanguage] || [];
      }
      return val;
    };

    if (data.question) data.question = ensureBilingual(data.question);
    if (data.options) data.options = ensureBilingualArr(data.options);
    if (data.explanation) data.explanation = ensureBilingual(data.explanation);
  }

  // ==================== TEST & STATUS ====================

  /**
   * Test translation connection
   */
  async testConnection() {
    const results = { azure: null, google: null };

    // Test Azure
    if (this.azureKey) {
      try {
        const azureResult = await this.translateWithAzure(['Hello, how are you?'], 'en', 'hi');
        results.azure = {
          success: true,
          service: 'Azure Translator',
          result: azureResult[0]
        };
        this.azureAvailable = true;
      } catch (error) {
        results.azure = {
          success: false,
          service: 'Azure Translator',
          error: error.message
        };
      }
    }

    // Test Google
    if (this.googleTranslate) {
      try {
        const googleResult = await this.translateWithGoogle(['Hello, how are you?'], 'en', 'hi');
        results.google = {
          success: true,
          service: 'Google Translate (Free)',
          result: googleResult[0]
        };
        this.googleAvailable = true;
      } catch (error) {
        results.google = {
          success: false,
          service: 'Google Translate (Free)',
          error: error.message
        };
      }
    }

    return {
      success: results.azure?.success || results.google?.success || false,
      primary: this.azureAvailable ? 'Azure' : (this.googleAvailable ? 'Google' : 'None'),
      details: results
    };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      primary: this.azureAvailable ? 'Azure Translator' : 'Google Translate (Free)',
      azure: {
        available: this.azureAvailable,
        configured: !!this.azureKey,
        region: this.azureRegion
      },
      google: {
        available: this.googleAvailable,
        installed: !!this.googleTranslate
      },
      stats: {
        cacheSize: this.cache.size,
        translationCount: this.translationCount,
        failedCount: this.failedCount,
        lastError: this.lastError
      }
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[TranslateHelper] Cache cleared');
  }
}

module.exports = new TranslateHelper();