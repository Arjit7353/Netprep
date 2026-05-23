const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const Question = require('../models/Question');

// ⚠️ IMPORTANT: Specific routes BEFORE parameterized routes

// Stats route
router.get('/stats', questionController.getQuestionStats);

// Import routes
router.post('/import', questionController.importQuestions);
router.post('/smart-import', questionController.smartImport);
router.post('/import/validate', questionController.validateImport);

// PYQ routes
router.get('/pyq-bank', questionController.getPYQQuestionBank);
router.get('/pyq-question/:pyqId', questionController.getPYQQuestionById);
router.put('/pyq-question/:pyqId', questionController.updatePYQQuestion);
router.put('/pyq-bank/bulk-update', questionController.bulkUpdatePYQQuestions);

// ★★★ NEW: Translation & Sync routes
router.post('/bulk-translate', questionController.bulkTranslateQuestions);
router.post('/translation-status', questionController.getTranslationStatus);

// Bulk fetch
router.post('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    const questions = await Question.find({ _id: { $in: ids.slice(0, 100) } }).populate('passageId diDataId');
    res.json({ success: true, data: questions, count: questions.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Passage routes
router.get('/passages/list', questionController.getPassages);
router.post('/passages', questionController.createPassage);
router.get('/passages/:id', questionController.getPassageById);

// DI Data routes
router.get('/di-data/list', questionController.getDIDataList);
router.post('/di-data', questionController.createDIData);
router.get('/di-data/:id', questionController.getDIDataById);

// Passage/DI question routes
router.get('/passage/:passageId', questionController.getQuestionsByPassage);
router.get('/di/:diDataId', questionController.getQuestionsByDI);

// Bulk operations
router.delete('/bulk', questionController.bulkDeleteQuestions);
router.post('/bulk-delete', questionController.bulkDeleteQuestions);
router.post('/test-usage', questionController.getTestUsage);
router.put('/bulk-update', questionController.bulkUpdateQuestions);

// Main CRUD routes (/:id MUST be last)
router.get('/', questionController.getQuestions);
router.post('/', questionController.createQuestion);

// ★★★ NEW: Per-question translate & impact (before generic /:id)
router.post('/:id/translate', questionController.translateSingleQuestion);
router.get('/:id/impact', questionController.getImpactAnalysis);
router.get('/detail/:id', questionController.getQuestionDetail);
router.get('/analytics/:id', questionController.getQuestionAnalytics);

router.get('/:id', questionController.getQuestionById);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;