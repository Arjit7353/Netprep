// server/routes/translateRoutes.js
const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');

router.post('/', translateController.translateText);
router.post('/batch', translateController.translateBatch);
router.get('/test', translateController.testConnection);
router.get('/status', translateController.getStatus);
router.post('/clear-cache', translateController.clearCache);

// Standard repair routes (Question model)
router.get('/repair/preview', translateController.repairPreview);
router.post('/repair/execute', translateController.repairExecute);

// ★ NEW: PYQ repair routes (PYQAnalysis model)
router.get('/repair/pyq/preview', translateController.repairPYQPreview);
router.post('/repair/pyq/execute', translateController.repairPYQExecute);

module.exports = router;