import { useState, useCallback } from 'react';
import translateService from '../services/translateService';

export const useTranslate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Translate text
  const translate = useCallback(async (text, from, to) => {
    if (!text || text.trim() === '') return text;
    
    setLoading(true);
    setError(null);
    try {
      const response = await translateService.translate(text, from, to);
      return response.data?.translatedText || text;
    } catch (err) {
      setError(err.message || 'Translation failed');
      return text;
    } finally {
      setLoading(false);
    }
  }, []);

  // Translate Hindi to English
  const translateHiToEn = useCallback(async (text) => {
    return translate(text, 'hi', 'en');
  }, [translate]);

  // Translate English to Hindi
  const translateEnToHi = useCallback(async (text) => {
    return translate(text, 'en', 'hi');
  }, [translate]);

  // Translate array of texts
  const translateArray = useCallback(async (texts, from, to) => {
    if (!texts || texts.length === 0) return texts;
    
    setLoading(true);
    setError(null);
    try {
      const response = await translateService.translateArray(texts, from, to);
      return response.data?.translatedTexts || texts;
    } catch (err) {
      setError(err.message || 'Translation failed');
      return texts;
    } finally {
      setLoading(false);
    }
  }, []);

  // Detect language
  const detectLanguage = useCallback(async (text) => {
    if (!text || text.trim() === '') return null;
    
    try {
      const response = await translateService.detectLanguage(text);
      return response.data?.language || null;
    } catch (err) {
      console.error('Language detection failed:', err);
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    translate,
    translateHiToEn,
    translateEnToHi,
    translateArray,
    detectLanguage,
    clearError
  };
};

export default useTranslate;