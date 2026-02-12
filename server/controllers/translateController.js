const translateHelper = require('../utils/translateHelper');

// @desc    Translate text
// @route   POST /api/translate
const translateText = async (req, res, next) => {
  try {
    const { text, from = 'hi', to = 'en' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const startTime = Date.now();
    const translated = await translateHelper.translate(text, from, to);
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        original: text,
        translated,
        from,
        to,
        durationMs: duration
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch translate texts
// @route   POST /api/translate/batch
const translateBatch = async (req, res, next) => {
  try {
    const { texts, from = 'hi', to = 'en' } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        message: 'Texts array is required'
      });
    }

    const startTime = Date.now();
    const translated = await translateHelper.translateBatch(texts, from, to);
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        original: texts,
        translated,
        from,
        to,
        count: texts.length,
        durationMs: duration,
        avgPerText: Math.round(duration / texts.length)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test translation API connection
// @route   GET /api/translate/test
const testConnection = async (req, res, next) => {
  try {
    const result = await translateHelper.testConnection();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get translation API status
// @route   GET /api/translate/status
const getStatus = async (req, res, next) => {
  try {
    const status = translateHelper.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear translation cache
// @route   POST /api/translate/clear-cache
const clearCache = async (req, res, next) => {
  try {
    translateHelper.clearCache();
    res.json({
      success: true,
      message: 'Translation cache cleared'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  translateText,
  translateBatch,
  testConnection,
  getStatus,
  clearCache
};