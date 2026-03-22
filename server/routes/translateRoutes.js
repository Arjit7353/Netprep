// server/routes/translateRoutes.js
const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translateController');

router.post('/', translateController.translateText);
router.post('/batch', translateController.translateBatch);
router.get('/test', translateController.testConnection);
router.get('/status', translateController.getStatus);
router.post('/clear-cache', translateController.clearCache);

// Repair routes
router.get('/repair/preview', translateController.repairPreview);
router.post('/repair/execute', translateController.repairExecute);

module.exports = router;