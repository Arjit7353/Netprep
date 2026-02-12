const translate = require('@vitalets/google-translate-api');

class GoogleTranslateHelper {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 10000;
  }

  isConfigured() {
    return true;
  }

  getCacheKey(text, from, to) {
    return `${from}:${to}:${text.substring(0, 100)}`;
  }

  // Single text translation
  async translate(text, from = 'hi', to = 'en') {
    if (!text || (typeof text === 'string' && text.trim() === '')) {
      return text || '';
    }

    const textStr = String(text);
    const cacheKey = this.getCacheKey(textStr, from, to);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = await translate(textStr, { from: from, to: to });
      const translated = result.text || textStr;
      
      // Cache management
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, translated);
      
      return translated;
    } catch (error) {
      console.error('Google Translate single error:', error.message);
      return textStr;
    }
  }

  // BATCH TRANSLATION - Main optimized function
  async translateBatch(texts, from = 'hi', to = 'en') {
    if (!Array.isArray(texts) || texts.length === 0) {
      return texts || [];
    }

    // Prepare results array
    const results = new Array(texts.length).fill('');
    const toTranslate = [];
    const indexMap = [];

    // Check cache first
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      
      if (!text || (typeof text === 'string' && text.trim() === '')) {
        results[i] = text || '';
        continue;
      }

      const textStr = String(text);
      const cacheKey = this.getCacheKey(textStr, from, to);
      
      if (this.cache.has(cacheKey)) {
        results[i] = this.cache.get(cacheKey);
      } else {
        toTranslate.push(textStr);
        indexMap.push(i);
      }
    }

    // If all cached, return immediately
    if (toTranslate.length === 0) {
      return results;
    }

    console.log(`[GoogleTranslate] Translating ${toTranslate.length} uncached texts...`);

    try {
      // Use separator to combine texts
      const separator = ' |@|@| ';
      const combinedText = toTranslate.join(separator);
      
      // Single API call
      const result = await translate(combinedText, { from: from, to: to });
      const translatedCombined = result.text || combinedText;
      
      // Split back using regex to handle variations
      const translatedParts = translatedCombined.split(/\s*\|@\|@\|\s*/);
      
      // Map translations back
      for (let i = 0; i < indexMap.length; i++) {
        const originalIndex = indexMap[i];
        const originalText = toTranslate[i];
        const translatedText = (translatedParts[i] || originalText).trim();
        
        results[originalIndex] = translatedText;
        
        // Cache the result
        const cacheKey = this.getCacheKey(originalText, from, to);
        if (this.cache.size >= this.maxCacheSize) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, translatedText);
      }

      console.log(`[GoogleTranslate] Batch translation successful`);
      return results;

    } catch (error) {
      console.error('Batch translation error:', error.message);
      console.log('[GoogleTranslate] Falling back to individual translations...');
      
      // Fallback: translate one by one
      for (let i = 0; i < indexMap.length; i++) {
        try {
          const originalIndex = indexMap[i];
          const originalText = toTranslate[i];
          
          const result = await translate(originalText, { from: from, to: to });
          const translatedText = result.text || originalText;
          
          results[originalIndex] = translatedText;
          
          // Cache
          const cacheKey = this.getCacheKey(originalText, from, to);
          this.cache.set(cacheKey, translatedText);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          results[indexMap[i]] = toTranslate[i]; // Use original on error
        }
      }
      
      return results;
    }
  }

  // Alias for batch
  async translateArray(texts, from = 'hi', to = 'en') {
    return this.translateBatch(texts, from, to);
  }

  // Translate bilingual object
  async translateBilingual(obj, sourceLanguage = 'hi') {
    if (!obj) {
      return { hi: '', en: '' };
    }

    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';

    // Ensure object structure
    if (typeof obj === 'string') {
      obj = { [sourceLanguage]: obj, [targetLanguage]: '' };
    }

    if (obj[targetLanguage] && obj[targetLanguage].trim && obj[targetLanguage].trim() !== '') {
      return obj;
    }

    if (!obj[sourceLanguage] || (obj[sourceLanguage].trim && obj[sourceLanguage].trim() === '')) {
      return { ...obj, [targetLanguage]: '' };
    }

    const translated = await this.translate(
      obj[sourceLanguage],
      sourceLanguage,
      targetLanguage
    );

    return {
      ...obj,
      [targetLanguage]: translated
    };
  }

  // Translate single question
  async translateQuestion(question, sourceLanguage = 'hi') {
    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
    
    const textsToTranslate = [];
    const textMap = [];

    // Helper to add text
    const addText = (text, path) => {
      if (text && typeof text === 'string' && text.trim()) {
        textsToTranslate.push(text);
        textMap.push(path);
      }
    };

    // Collect question text
    if (question.question && question.question[sourceLanguage] && !question.question[targetLanguage]) {
      addText(question.question[sourceLanguage], 'question');
    }

    // Collect options
    if (question.options && question.options[sourceLanguage] && Array.isArray(question.options[sourceLanguage])) {
      if (!question.options[targetLanguage] || question.options[targetLanguage].length === 0) {
        question.options[sourceLanguage].forEach((opt, i) => {
          addText(opt, `options.${i}`);
        });
      }
    }

    // Collect explanation
    if (question.explanation && question.explanation[sourceLanguage] && !question.explanation[targetLanguage]) {
      addText(question.explanation[sourceLanguage], 'explanation');
    }

    // Collect assertion-reason
    if (question.assertionReasonData) {
      if (question.assertionReasonData.assertion && 
          question.assertionReasonData.assertion[sourceLanguage] && 
          !question.assertionReasonData.assertion[targetLanguage]) {
        addText(question.assertionReasonData.assertion[sourceLanguage], 'assertion');
      }
      if (question.assertionReasonData.reason && 
          question.assertionReasonData.reason[sourceLanguage] && 
          !question.assertionReasonData.reason[targetLanguage]) {
        addText(question.assertionReasonData.reason[sourceLanguage], 'reason');
      }
    }

    // Collect match data
    if (question.matchData) {
      if (question.matchData.listA && question.matchData.listA[sourceLanguage] && Array.isArray(question.matchData.listA[sourceLanguage])) {
        if (!question.matchData.listA[targetLanguage] || question.matchData.listA[targetLanguage].length === 0) {
          question.matchData.listA[sourceLanguage].forEach((item, i) => {
            addText(item, `listA.${i}`);
          });
        }
      }
      if (question.matchData.listB && question.matchData.listB[sourceLanguage] && Array.isArray(question.matchData.listB[sourceLanguage])) {
        if (!question.matchData.listB[targetLanguage] || question.matchData.listB[targetLanguage].length === 0) {
          question.matchData.listB[sourceLanguage].forEach((item, i) => {
            addText(item, `listB.${i}`);
          });
        }
      }
    }

    // Collect sequence data
    if (question.sequenceData && question.sequenceData.items && 
        question.sequenceData.items[sourceLanguage] && Array.isArray(question.sequenceData.items[sourceLanguage])) {
      if (!question.sequenceData.items[targetLanguage] || question.sequenceData.items[targetLanguage].length === 0) {
        question.sequenceData.items[sourceLanguage].forEach((item, i) => {
          addText(item, `sequence.${i}`);
        });
      }
    }

    // Collect statement data
    if (question.statementData && question.statementData.statements && 
        question.statementData.statements[sourceLanguage] && Array.isArray(question.statementData.statements[sourceLanguage])) {
      if (!question.statementData.statements[targetLanguage] || question.statementData.statements[targetLanguage].length === 0) {
        question.statementData.statements[sourceLanguage].forEach((item, i) => {
          addText(item, `statement.${i}`);
        });
      }
    }

    // If nothing to translate, return
    if (textsToTranslate.length === 0) {
      return question;
    }

    // Batch translate
    const translations = await this.translateBatch(textsToTranslate, sourceLanguage, targetLanguage);

    // Apply translations
    for (let i = 0; i < translations.length; i++) {
      const translated = translations[i];
      const path = textMap[i];
      
      if (path === 'question') {
        if (!question.question) question.question = { hi: '', en: '' };
        question.question[targetLanguage] = translated;
      } 
      else if (path === 'explanation') {
        if (!question.explanation) question.explanation = { hi: '', en: '' };
        question.explanation[targetLanguage] = translated;
      }
      else if (path === 'assertion') {
        if (!question.assertionReasonData) question.assertionReasonData = {};
        if (!question.assertionReasonData.assertion) question.assertionReasonData.assertion = { hi: '', en: '' };
        question.assertionReasonData.assertion[targetLanguage] = translated;
      }
      else if (path === 'reason') {
        if (!question.assertionReasonData) question.assertionReasonData = {};
        if (!question.assertionReasonData.reason) question.assertionReasonData.reason = { hi: '', en: '' };
        question.assertionReasonData.reason[targetLanguage] = translated;
      }
      else if (path.startsWith('options.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.options) question.options = { hi: [], en: [] };
        if (!question.options[targetLanguage]) question.options[targetLanguage] = [];
        question.options[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('listA.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.matchData) question.matchData = {};
        if (!question.matchData.listA) question.matchData.listA = { hi: [], en: [] };
        if (!question.matchData.listA[targetLanguage]) question.matchData.listA[targetLanguage] = [];
        question.matchData.listA[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('listB.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.matchData) question.matchData = {};
        if (!question.matchData.listB) question.matchData.listB = { hi: [], en: [] };
        if (!question.matchData.listB[targetLanguage]) question.matchData.listB[targetLanguage] = [];
        question.matchData.listB[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('sequence.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.sequenceData) question.sequenceData = {};
        if (!question.sequenceData.items) question.sequenceData.items = { hi: [], en: [] };
        if (!question.sequenceData.items[targetLanguage]) question.sequenceData.items[targetLanguage] = [];
        question.sequenceData.items[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('statement.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.statementData) question.statementData = {};
        if (!question.statementData.statements) question.statementData.statements = { hi: [], en: [] };
        if (!question.statementData.statements[targetLanguage]) question.statementData.statements[targetLanguage] = [];
        question.statementData.statements[targetLanguage][idx] = translated;
      }
    }

    return question;
  }

  // Translate multiple questions - FAST batch
  async translateQuestions(questions, sourceLanguage = 'hi') {
    if (!Array.isArray(questions) || questions.length === 0) {
      return questions || [];
    }

    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
    
    const allTexts = [];
    const allMaps = [];

    // Collect ALL texts from ALL questions
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const question = questions[qIndex];

      const addText = (text, path) => {
        if (text && typeof text === 'string' && text.trim()) {
          allTexts.push(text);
          allMaps.push({ qIndex: qIndex, path: path });
        }
      };

      // Question text
      if (question.question && question.question[sourceLanguage] && !question.question[targetLanguage]) {
        addText(question.question[sourceLanguage], 'question');
      }

      // Options
      if (question.options && question.options[sourceLanguage] && Array.isArray(question.options[sourceLanguage])) {
        if (!question.options[targetLanguage] || question.options[targetLanguage].length === 0) {
          question.options[sourceLanguage].forEach((opt, i) => {
            addText(opt, `options.${i}`);
          });
        }
      }

      // Explanation
      if (question.explanation && question.explanation[sourceLanguage] && !question.explanation[targetLanguage]) {
        addText(question.explanation[sourceLanguage], 'explanation');
      }

      // Assertion-Reason
      if (question.assertionReasonData) {
        if (question.assertionReasonData.assertion && 
            question.assertionReasonData.assertion[sourceLanguage] && 
            !question.assertionReasonData.assertion[targetLanguage]) {
          addText(question.assertionReasonData.assertion[sourceLanguage], 'assertion');
        }
        if (question.assertionReasonData.reason && 
            question.assertionReasonData.reason[sourceLanguage] && 
            !question.assertionReasonData.reason[targetLanguage]) {
          addText(question.assertionReasonData.reason[sourceLanguage], 'reason');
        }
      }

      // Match data
      if (question.matchData) {
        if (question.matchData.listA && question.matchData.listA[sourceLanguage] && Array.isArray(question.matchData.listA[sourceLanguage])) {
          if (!question.matchData.listA[targetLanguage] || question.matchData.listA[targetLanguage].length === 0) {
            question.matchData.listA[sourceLanguage].forEach((item, i) => {
              addText(item, `listA.${i}`);
            });
          }
        }
        if (question.matchData.listB && question.matchData.listB[sourceLanguage] && Array.isArray(question.matchData.listB[sourceLanguage])) {
          if (!question.matchData.listB[targetLanguage] || question.matchData.listB[targetLanguage].length === 0) {
            question.matchData.listB[sourceLanguage].forEach((item, i) => {
              addText(item, `listB.${i}`);
            });
          }
        }
      }

      // Sequence data
      if (question.sequenceData && question.sequenceData.items && 
          question.sequenceData.items[sourceLanguage] && Array.isArray(question.sequenceData.items[sourceLanguage])) {
        if (!question.sequenceData.items[targetLanguage] || question.sequenceData.items[targetLanguage].length === 0) {
          question.sequenceData.items[sourceLanguage].forEach((item, i) => {
            addText(item, `sequence.${i}`);
          });
        }
      }

      // Statement data
      if (question.statementData && question.statementData.statements && 
          question.statementData.statements[sourceLanguage] && Array.isArray(question.statementData.statements[sourceLanguage])) {
        if (!question.statementData.statements[targetLanguage] || question.statementData.statements[targetLanguage].length === 0) {
          question.statementData.statements[sourceLanguage].forEach((item, i) => {
            addText(item, `statement.${i}`);
          });
        }
      }
    }

    // If nothing to translate
    if (allTexts.length === 0) {
      return questions;
    }

    console.log(`[GoogleTranslate] Batch translating ${allTexts.length} texts for ${questions.length} questions...`);
    const startTime = Date.now();

    // SINGLE BATCH CALL
    const translations = await this.translateBatch(allTexts, sourceLanguage, targetLanguage);

    console.log(`[GoogleTranslate] Translation completed in ${Date.now() - startTime}ms`);

    // Apply translations back
    for (let i = 0; i < translations.length; i++) {
      const translated = translations[i];
      const { qIndex, path } = allMaps[i];
      const question = questions[qIndex];

      if (path === 'question') {
        if (!question.question) question.question = { hi: '', en: '' };
        question.question[targetLanguage] = translated;
      }
      else if (path === 'explanation') {
        if (!question.explanation) question.explanation = { hi: '', en: '' };
        question.explanation[targetLanguage] = translated;
      }
      else if (path === 'assertion') {
        if (!question.assertionReasonData) question.assertionReasonData = {};
        if (!question.assertionReasonData.assertion) question.assertionReasonData.assertion = { hi: '', en: '' };
        question.assertionReasonData.assertion[targetLanguage] = translated;
      }
      else if (path === 'reason') {
        if (!question.assertionReasonData) question.assertionReasonData = {};
        if (!question.assertionReasonData.reason) question.assertionReasonData.reason = { hi: '', en: '' };
        question.assertionReasonData.reason[targetLanguage] = translated;
      }
      else if (path.startsWith('options.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.options) question.options = { hi: [], en: [] };
        if (!question.options[targetLanguage]) question.options[targetLanguage] = [];
        question.options[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('listA.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.matchData) question.matchData = {};
        if (!question.matchData.listA) question.matchData.listA = { hi: [], en: [] };
        if (!question.matchData.listA[targetLanguage]) question.matchData.listA[targetLanguage] = [];
        question.matchData.listA[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('listB.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.matchData) question.matchData = {};
        if (!question.matchData.listB) question.matchData.listB = { hi: [], en: [] };
        if (!question.matchData.listB[targetLanguage]) question.matchData.listB[targetLanguage] = [];
        question.matchData.listB[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('sequence.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.sequenceData) question.sequenceData = {};
        if (!question.sequenceData.items) question.sequenceData.items = { hi: [], en: [] };
        if (!question.sequenceData.items[targetLanguage]) question.sequenceData.items[targetLanguage] = [];
        question.sequenceData.items[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('statement.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!question.statementData) question.statementData = {};
        if (!question.statementData.statements) question.statementData.statements = { hi: [], en: [] };
        if (!question.statementData.statements[targetLanguage]) question.statementData.statements[targetLanguage] = [];
        question.statementData.statements[targetLanguage][idx] = translated;
      }
    }

    return questions;
  }

  // Translate passage
  async translatePassage(passage, sourceLanguage = 'hi') {
    if (!passage) {
      return passage;
    }

    if (passage.content) {
      passage.content = await this.translateBilingual(passage.content, sourceLanguage);
    }
    if (passage.title && typeof passage.title === 'object') {
      passage.title = await this.translateBilingual(passage.title, sourceLanguage);
    }
    return passage;
  }

  // Translate DI data
  async translateDIData(diData, sourceLanguage = 'hi') {
    if (!diData) {
      return diData;
    }

    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';
    const textsToTranslate = [];
    const textMap = [];

    const addText = (text, path) => {
      if (text && typeof text === 'string' && text.trim()) {
        textsToTranslate.push(text);
        textMap.push(path);
      }
    };

    // Collect texts
    if (diData.title && diData.title[sourceLanguage] && !diData.title[targetLanguage]) {
      addText(diData.title[sourceLanguage], 'title');
    }
    if (diData.instruction && diData.instruction[sourceLanguage] && !diData.instruction[targetLanguage]) {
      addText(diData.instruction[sourceLanguage], 'instruction');
    }
    if (diData.caseletText && diData.caseletText[sourceLanguage] && !diData.caseletText[targetLanguage]) {
      addText(diData.caseletText[sourceLanguage], 'caseletText');
    }

    if (diData.tableData && diData.tableData.headers && diData.tableData.headers[sourceLanguage] && Array.isArray(diData.tableData.headers[sourceLanguage])) {
      if (!diData.tableData.headers[targetLanguage] || diData.tableData.headers[targetLanguage].length === 0) {
        diData.tableData.headers[sourceLanguage].forEach((h, i) => {
          addText(h, `header.${i}`);
        });
      }
    }

    if (diData.chartData && diData.chartData.labels && diData.chartData.labels[sourceLanguage] && Array.isArray(diData.chartData.labels[sourceLanguage])) {
      if (!diData.chartData.labels[targetLanguage] || diData.chartData.labels[targetLanguage].length === 0) {
        diData.chartData.labels[sourceLanguage].forEach((l, i) => {
          addText(l, `label.${i}`);
        });
      }
    }

    if (textsToTranslate.length === 0) {
      return diData;
    }

    const translations = await this.translateBatch(textsToTranslate, sourceLanguage, targetLanguage);

    for (let i = 0; i < translations.length; i++) {
      const translated = translations[i];
      const path = textMap[i];

      if (path === 'title') {
        if (!diData.title) diData.title = { hi: '', en: '' };
        diData.title[targetLanguage] = translated;
      }
      else if (path === 'instruction') {
        if (!diData.instruction) diData.instruction = { hi: '', en: '' };
        diData.instruction[targetLanguage] = translated;
      }
      else if (path === 'caseletText') {
        if (!diData.caseletText) diData.caseletText = { hi: '', en: '' };
        diData.caseletText[targetLanguage] = translated;
      }
      else if (path.startsWith('header.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!diData.tableData.headers[targetLanguage]) diData.tableData.headers[targetLanguage] = [];
        diData.tableData.headers[targetLanguage][idx] = translated;
      }
      else if (path.startsWith('label.')) {
        const idx = parseInt(path.split('.')[1]);
        if (!diData.chartData.labels[targetLanguage]) diData.chartData.labels[targetLanguage] = [];
        diData.chartData.labels[targetLanguage][idx] = translated;
      }
    }

    return diData;
  }

  // Detect language
  async detectLanguage(text) {
    if (!text) {
      return 'en';
    }
    const hindiRegex = /[\u0900-\u097F]/;
    if (hindiRegex.test(text)) {
      return 'hi';
    }
    return 'en';
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = new GoogleTranslateHelper();