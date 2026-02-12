const translate = require('google-translate-api-x');

class TranslateHelper {
  constructor() {
    // Cache to avoid re-translating same text
    this.cache = new Map();
    this.cacheMaxSize = 2000;
    
    // Rate limiting settings
    this.requestDelay = 100; // ms between requests to avoid rate limiting
    this.maxConcurrent = 5; // Max concurrent translations
    this.batchSize = 10; // Texts per batch
    
    // Track status
    this.apiAvailable = true;
    this.lastError = null;
    this.translationCount = 0;
    
    console.log('TranslateHelper initialized with Google Translate (Free)');
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache key
   */
  getCacheKey(text, from, to) {
    return `${from}:${to}:${text.substring(0, 100)}`;
  }

  /**
   * Add to cache
   */
  addToCache(text, from, to, translation) {
    const key = this.getCacheKey(text, from, to);
    if (this.cache.size >= this.cacheMaxSize) {
      // Remove oldest 200 entries
      const keys = Array.from(this.cache.keys()).slice(0, 200);
      keys.forEach(k => this.cache.delete(k));
    }
    this.cache.set(key, translation);
  }

  /**
   * Get from cache
   */
  getFromCache(text, from, to) {
    const key = this.getCacheKey(text, from, to);
    return this.cache.get(key);
  }

  /**
   * Translate single text using Google Translate
   */
  async translateSingle(text, from = 'hi', to = 'en') {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text || '';
    }

    // Check cache
    const cached = this.getFromCache(text, from, to);
    if (cached) {
      return cached;
    }

    try {
      const result = await translate(text, { from, to });
      const translated = result.text;
      
      // Cache the result
      this.addToCache(text, from, to, translated);
      this.translationCount++;
      
      return translated;
    } catch (error) {
      console.error('[TranslateHelper] Single translation error:', error.message);
      this.lastError = error.message;
      return text; // Return original on error
    }
  }

  /**
   * Translate using Google's batch capability (faster)
   */
  async translateBatchGoogle(texts, from = 'hi', to = 'en') {
    if (!texts || texts.length === 0) return [];
    
    try {
      // Google translate-api-x supports array input
      const result = await translate(texts, { from, to });
      
      // Result is array when input is array
      if (Array.isArray(result)) {
        return result.map(r => r.text);
      }
      
      // Single result
      return [result.text];
    } catch (error) {
      console.error('[TranslateHelper] Batch translation error:', error.message);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Batch translate with caching and chunking
   */
  async translateBatch(texts, from = 'hi', to = 'en') {
    if (!texts || texts.length === 0) return [];
    
    const results = new Array(texts.length).fill('');
    const toTranslate = []; // { index, text }
    
    // Step 1: Check cache and identify texts needing translation
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      if (!text || typeof text !== 'string' || text.trim() === '') {
        results[i] = text || '';
        continue;
      }
      
      // Check cache
      const cached = this.getFromCache(text, from, to);
      if (cached) {
        results[i] = cached;
        continue;
      }
      
      toTranslate.push({ index: i, text });
    }
    
    // If all cached, return early
    if (toTranslate.length === 0) {
      return results;
    }

    // Step 2: Process in batches
    const batches = [];
    for (let i = 0; i < toTranslate.length; i += this.batchSize) {
      batches.push(toTranslate.slice(i, i + this.batchSize));
    }

    // Step 3: Translate each batch
    for (const batch of batches) {
      try {
        const textsToTranslate = batch.map(item => item.text);
        
        // Use Google's batch capability
        const translated = await this.translateBatchGoogle(textsToTranslate, from, to);
        
        // Map results back
        for (let i = 0; i < batch.length; i++) {
          const originalIndex = batch[i].index;
          const originalText = batch[i].text;
          const translatedText = translated[i] || originalText;
          
          results[originalIndex] = translatedText;
          this.addToCache(originalText, from, to, translatedText);
          this.translationCount++;
        }
        
        // Small delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.sleep(this.requestDelay);
        }
        
      } catch (error) {
        console.error('[TranslateHelper] Batch error, falling back to individual:', error.message);
        
        // Fallback: Translate individually
        for (const item of batch) {
          try {
            const translated = await this.translateSingle(item.text, from, to);
            results[item.index] = translated;
            await this.sleep(50); // Small delay
          } catch (e) {
            results[item.index] = item.text; // Use original on error
          }
        }
      }
    }
    
    this.apiAvailable = true;
    return results;
  }

  /**
   * Translate single text (convenience method)
   */
  async translate(text, from = 'hi', to = 'en') {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return text || '';
    }
    
    const results = await this.translateBatch([text], from, to);
    return results[0];
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
   * Translate bilingual object
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
    
    if (obj.hi && obj.en) {
      return obj;
    }
    
    if (obj.hi && !obj.en) {
      obj.en = await this.translate(obj.hi, 'hi', 'en');
    } else if (obj.en && !obj.hi) {
      obj.hi = await this.translate(obj.en, 'en', 'hi');
    }
    
    return obj;
  }

  /**
   * Test the translation
   */
  async testConnection() {
    try {
      const testText = 'Hello, how are you?';
      const result = await translate(testText, { from: 'en', to: 'hi' });
      
      this.apiAvailable = true;
      
      return {
        success: true,
        message: 'Google Translate is working',
        testResult: {
          input: testText,
          output: result.text,
          detectedLanguage: result.from?.language?.iso
        }
      };
    } catch (error) {
      this.apiAvailable = false;
      this.lastError = error.message;
      
      return {
        success: false,
        error: error.message,
        details: 'Google Translate free API may be rate limited. Try again later.'
      };
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      service: 'Google Translate (Free)',
      available: this.apiAvailable,
      lastError: this.lastError,
      cacheSize: this.cache.size,
      translationCount: this.translationCount,
      config: {
        batchSize: this.batchSize,
        requestDelay: this.requestDelay,
        maxConcurrent: this.maxConcurrent
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