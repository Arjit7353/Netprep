const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// @route   GET /api/questions
// @desc    Get all questions with filters
router.get('/', questionController.getQuestions);

// @route   GET /api/questions/stats
// @desc    Get question statistics
router.get('/stats', questionController.getQuestionStats);

// @route   GET /api/questions/:id
// @desc    Get single question by ID
router.get('/:id', questionController.getQuestionById);

// @route   POST /api/questions
// @desc    Create new question
router.post('/', questionController.createQuestion);

// @route   POST /api/questions/import
// @desc    Import questions from JSON (Smart Parser)
router.post('/import', questionController.importQuestions);

// @route   POST /api/questions/import/validate
// @desc    Validate JSON before import
router.post('/import/validate', questionController.validateImport);

// @route   PUT /api/questions/:id
// @desc    Update question
router.put('/:id', questionController.updateQuestion);

// @route   DELETE /api/questions/:id
// @desc    Delete question
router.delete('/:id', questionController.deleteQuestion);

// @route   DELETE /api/questions
// @desc    Bulk delete questions
router.delete('/', questionController.bulkDeleteQuestions);

// @route   GET /api/questions/passage/:passageId
// @desc    Get all questions for a passage
router.get('/passage/:passageId', questionController.getQuestionsByPassage);

// @route   GET /api/questions/di/:diDataId
// @desc    Get all questions for a DI set
router.get('/di/:diDataId', questionController.getQuestionsByDI);

// Passage routes
// @route   GET /api/questions/passages/list
// @desc    Get all passages
router.get('/passages/list', questionController.getPassages);

// @route   POST /api/questions/passages
// @desc    Create new passage
router.post('/passages', questionController.createPassage);

// @route   GET /api/questions/passages/:id
// @desc    Get passage with questions
router.get('/passages/:id', questionController.getPassageById);

// DI Data routes
// @route   GET /api/questions/di-data/list
// @desc    Get all DI data
router.get('/di-data/list', questionController.getDIDataList);

// @route   POST /api/questions/di-data
// @desc    Create new DI data
router.post('/di-data', questionController.createDIData);

// @route   GET /api/questions/di-data/:id
// @desc    Get DI data with questions
router.get('/di-data/:id', questionController.getDIDataById);

module.exports = router;