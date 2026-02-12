const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');

// @route   POST /api/translate
// @desc    Translate text
router.post('/', translateController.translateText);

// @route   POST /api/translate/batch
// @desc    Batch translate texts
router.post('/batch', translateController.translateBatch);

// @route   GET /api/translate/test
// @desc    Test translation API connection
router.get('/test', translateController.testConnection);

// @route   GET /api/translate/status
// @desc    Get translation API status
router.get('/status', translateController.getStatus);

// @route   POST /api/translate/clear-cache
// @desc    Clear translation cache
router.post('/clear-cache', translateController.clearCache);

module.exports = router;