import { apiHelper } from './api';

const translateService = {
  // Translate text from one language to another
  translate: async (text, from, to) => {
    return apiHelper.post('/translate', { text, from, to });
  },

  // Translate Hindi to English
  translateHiToEn: async (text) => {
    return apiHelper.post('/translate', { text, from: 'hi', to: 'en' });
  },

  // Translate English to Hindi
  translateEnToHi: async (text) => {
    return apiHelper.post('/translate', { text, from: 'en', to: 'hi' });
  },

  // Translate array of texts
  translateArray: async (texts, from, to) => {
    return apiHelper.post('/translate/array', { texts, from, to });
  },

  // Detect language of text
  detectLanguage: async (text) => {
    return apiHelper.post('/translate/detect', { text });
  },

  // Translate question content
  translateQuestion: async (questionData, sourceLanguage) => {
    return apiHelper.post('/translate/question', { 
      question: questionData, 
      sourceLanguage 
    });
  }
};

export default translateService;