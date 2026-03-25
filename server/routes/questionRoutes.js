// server/routes/questionRoutes.js

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const Question = require('../models/Question');

// ⚠️ IMPORTANT: Specific routes BEFORE parameterized routes

// Stats route
router.get('/stats', questionController.getQuestionStats);

// Import routes
router.post('/import', questionController.importQuestions);
router.post('/import/validate', questionController.validateImport);

// ═══ NEW: PYQ Question Bank routes (MUST be before /:id) ═══
router.get('/pyq-bank', questionController.getPYQQuestionBank);
router.get('/pyq-question/:pyqId', questionController.getPYQQuestionById);
router.put('/pyq-question/:pyqId', questionController.updatePYQQuestion);
router.put('/pyq-bank/bulk-update', questionController.bulkUpdatePYQQuestions);

// Bulk fetch questions by IDs
router.post('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'ids array is required' 
      });
    }

    const limitedIds = ids.slice(0, 100);
    
    const questions = await Question.find({ 
      _id: { $in: limitedIds } 
    }).populate('passageId diDataId');

    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error('Bulk fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Passage routes (MUST be before /:id)
router.get('/passages/list', questionController.getPassages);
router.post('/passages', questionController.createPassage);
router.get('/passages/:id', questionController.getPassageById);

// DI Data routes (MUST be before /:id)
router.get('/di-data/list', questionController.getDIDataList);
router.post('/di-data', questionController.createDIData);
router.get('/di-data/:id', questionController.getDIDataById);

// Passage/DI question routes (MUST be before /:id)
router.get('/passage/:passageId', questionController.getQuestionsByPassage);
router.get('/di/:diDataId', questionController.getQuestionsByDI);

// Bulk delete
router.delete('/bulk', questionController.bulkDeleteQuestions);
router.post('/bulk-delete', questionController.bulkDeleteQuestions);

// Main CRUD routes
router.get('/', questionController.getQuestions);
router.post('/', questionController.createQuestion);
router.get('/:id', questionController.getQuestionById);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);
router.post('/test-usage', questionController.getTestUsage);
router.get('/detail/:id', questionController.getQuestionDetail);
router.put('/bulk-update', questionController.bulkUpdateQuestions);
router.get('/analytics/:id', questionController.getQuestionAnalytics);

module.exports = router;