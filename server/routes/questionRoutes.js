const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// ⚠️ IMPORTANT: Specific routes BEFORE parameterized routes

// Stats route
router.get('/stats', questionController.getQuestionStats);

// Import routes
router.post('/import', questionController.importQuestions);
router.post('/import/validate', questionController.validateImport);

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

// Main CRUD routes
router.get('/', questionController.getQuestions);
router.post('/', questionController.createQuestion);
router.get('/:id', questionController.getQuestionById);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;