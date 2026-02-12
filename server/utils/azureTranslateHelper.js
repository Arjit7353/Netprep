// server/utils/azureTranslateHelper.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class AzureTranslateHelper {
  constructor() {
    this.endpoint = config.translator.endpoint;
    this.key = config.translator.key;
    this.region = config.translator.region;
    this.apiVersion = '3.0';
    this.googleFallback = null;
  }

  // Check if translator is configured
  isConfigured() {
    return !!(this.endpoint && this.key && this.region);
  }

  // Get Google fallback
  getGoogleFallback() {
    if (!this.googleFallback) {
      this.googleFallback = require('./googleTranslateHelper');
    }
    return this.googleFallback;
  }

  // Translate text from one language to another
  async translate(text, from, to) {
    if (!text || text.trim() === '') {
      return text;
    }

    if (!this.isConfigured()) {
      console.warn('Azure Translator not configured. Using Google Translate.');
      return this.getGoogleFallback().translate(text, from, to);
    }

    try {
      const response = await axios({
        method: 'post',
        url: `${this.endpoint}/translate?api-version=${this.apiVersion}&from=${from}&to=${to}`,
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-Type': 'application/json',
          'X-ClientTraceId': uuidv4()
        },
        data: [{ text }],
        responseType: 'json',
        timeout: 10000
      });

      if (response.data && response.data[0] && response.data[0].translations) {
        return response.data[0].translations[0].text;
      }

      return text;
    } catch (error) {
      console.error('Azure Translation error:', error.message);
      console.log('Falling back to Google Translate...');
      
      // Fallback to Google
      try {
        return await this.getGoogleFallback().translate(text, from, to);
      } catch (googleError) {
        console.error('Google Translate also failed:', googleError.message);
        return text;
      }
    }
  }

  // Translate Hindi to English
  async translateHiToEn(text) {
    return this.translate(text, 'hi', 'en');
  }

  // Translate English to Hindi
  async translateEnToHi(text) {
    return this.translate(text, 'en', 'hi');
  }

  // Translate array of texts
  async translateArray(texts, from, to) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return texts;
    }

    if (!this.isConfigured()) {
      console.warn('Azure Translator not configured. Using Google Translate.');
      return this.getGoogleFallback().translateArray(texts, from, to);
    }

    try {
      const response = await axios({
        method: 'post',
        url: `${this.endpoint}/translate?api-version=${this.apiVersion}&from=${from}&to=${to}`,
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-Type': 'application/json',
          'X-ClientTraceId': uuidv4()
        },
        data: texts.map(text => ({ text: text || '' })),
        responseType: 'json',
        timeout: 15000
      });

      if (response.data) {
        return response.data.map(item => 
          item.translations && item.translations[0] 
            ? item.translations[0].text 
            : ''
        );
      }

      return texts;
    } catch (error) {
      console.error('Azure Translation array error:', error.message);
      console.log('Falling back to Google Translate...');
      
      // Fallback to Google
      try {
        return await this.getGoogleFallback().translateArray(texts, from, to);
      } catch (googleError) {
        console.error('Google Translate also failed:', googleError.message);
        return texts;
      }
    }
  }

  // Translate bilingual object (reuse Google's implementation)
  async translateBilingual(obj, sourceLanguage = 'hi') {
    return this.getGoogleFallback().translateBilingual.call(this, obj, sourceLanguage);
  }

  // Translate question (reuse Google's implementation)
  async translateQuestion(question, sourceLanguage = 'hi') {
    return this.getGoogleFallback().translateQuestion.call(this, question, sourceLanguage);
  }

  // Translate passage (reuse Google's implementation)
  async translatePassage(passage, sourceLanguage = 'hi') {
    return this.getGoogleFallback().translatePassage.call(this, passage, sourceLanguage);
  }

  // Translate DI data (reuse Google's implementation)
  async translateDIData(diData, sourceLanguage = 'hi') {
    return this.getGoogleFallback().translateDIData.call(this, diData, sourceLanguage);
  }

  // Detect language of text
  async detectLanguage(text) {
    if (!text) {
      return null;
    }

    if (!this.isConfigured()) {
      return this.getGoogleFallback().detectLanguage(text);
    }

    try {
      const response = await axios({
        method: 'post',
        url: `${this.endpoint}/detect?api-version=${this.apiVersion}`,
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-Type': 'application/json',
          'X-ClientTraceId': uuidv4()
        },
        data: [{ text }],
        responseType: 'json',
        timeout: 5000
      });

      if (response.data && response.data[0]) {
        return response.data[0].language;
      }

      return null;
    } catch (error) {
      console.error('Azure Language detection error:', error.message);
      
      // Fallback to Google
      try {
        return await this.getGoogleFallback().detectLanguage(text);
      } catch (googleError) {
        return null;
      }
    }
  }
}

// Export singleton instance
module.exports = new AzureTranslateHelper();