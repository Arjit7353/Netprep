// server/routes/pyqRoutes.js
const express = require('express');
const router = express.Router();
const pyqController = require('../controllers/pyqController');

// ── Middleware to extend timeout for import routes ──
const extendTimeout = (req, res, next) => {
  // Set 5 minute timeout for import operations
  req.setTimeout(300000);
  res.setTimeout(300000);
  
  // ═══ NEW: Keep connection alive during long translation ═══
  const keepAlive = setInterval(() => {
    if (!res.headersSent && !res.writableEnded) {
      try { res.write(' '); } catch(e) { /* ignore */ }
    }
  }, 25000); // Ping every 25 seconds to prevent proxy/browser timeout
  
  res.on('finish', () => clearInterval(keepAlive));
  res.on('close', () => clearInterval(keepAlive));
  
  next();
};

// ── Import (with extended timeout) ──
router.post('/import', extendTimeout, pyqController.importPYQData);
router.post('/import/validate', pyqController.validatePYQImport);

// ── NEW: Questions for Create Test ──
router.get('/questions-for-test', pyqController.getPYQQuestionsForTest);
router.post('/import-to-bank', pyqController.importPYQToQuestionBank);
router.get('/filters', pyqController.getPYQFilters);

// ── Analysis endpoints (BEFORE /:id) ──
router.get('/years', pyqController.getAvailableYears);
router.get('/stats', pyqController.getOverallStats);
router.get('/analysis/multi-year', pyqController.getMultiYearAnalysis);
router.get('/analysis/topic-frequency', pyqController.getTopicFrequency);
router.get('/analysis/gaps', pyqController.getPreparationGaps);
router.get('/analysis/predictions', pyqController.getPredictions);
router.get('/analysis/unit-comparison', pyqController.getUnitComparison);
router.get('/analysis/question-type-evolution', pyqController.getQuestionTypeEvolution);

// ── CRUD ──
router.get('/', pyqController.getAllPYQData);
router.get('/:id', pyqController.getPYQDataById);
router.put('/:id', pyqController.updatePYQData);
router.delete('/:id', pyqController.deletePYQData);

module.exports = router;