// server/controllers/translateController.js

const translateHelper = require('../utils/translateHelper');

// @desc    Translate text
// @route   POST /api/translate
const translateText = async (req, res, next) => {
  try {
    const { text, from, to } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const fromLang = from || 'hi';
    const toLang = to || (fromLang === 'hi' ? 'en' : 'hi');

    const translated = await translateHelper.translate(text, fromLang, toLang);

    res.json({
      success: true,
      data: {
        original: text,
        translated,
        from: fromLang,
        to: toLang
      }
    });
  } catch (error) {
    console.error('[Translate] Error:', error.message);
    next(error);
  }
};

// @desc    Batch translate texts
// @route   POST /api/translate/batch
const translateBatch = async (req, res, next) => {
  try {
    const { texts, from, to } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'texts array is required'
      });
    }

    // Limit batch size
    if (texts.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 200 texts per batch'
      });
    }

    const fromLang = from || 'hi';
    const toLang = to || (fromLang === 'hi' ? 'en' : 'hi');

    const translated = await translateHelper.translateBatch(texts, fromLang, toLang);

    res.json({
      success: true,
      data: {
        original: texts,
        translated,
        from: fromLang,
        to: toLang,
        count: translated.length
      }
    });
  } catch (error) {
    console.error('[TranslateBatch] Error:', error.message);
    next(error);
  }
};

// @desc    Test translation API connection
// @route   GET /api/translate/test
const testConnection = async (req, res, next) => {
  try {
    const result = await translateHelper.testConnection();
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get translation API status
// @route   GET /api/translate/status
const getStatus = async (req, res) => {
  const status = translateHelper.getStatus();
  res.json({
    success: true,
    data: status
  });
};

// @desc    Clear translation cache
// @route   POST /api/translate/clear-cache
const clearCache = async (req, res) => {
  translateHelper.clearCache();
  res.json({
    success: true,
    message: 'Translation cache cleared'
  });
};

module.exports = {
  translateText,
  translateBatch,
  testConnection,
  getStatus,
  clearCache
};