const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// @route   GET /api/tests
// @desc    Get all tests with filters
router.get('/', testController.getTests);

// @route   GET /api/tests/stats
// @desc    Get test statistics
router.get('/stats', testController.getTestStats);

// @route   GET /api/tests/types
// @desc    Get test type configurations
router.get('/types', testController.getTestTypes);

// @route   GET /api/tests/:id
// @desc    Get single test by ID
router.get('/:id', testController.getTestById);

// @route   GET /api/tests/:id/questions
// @desc    Get test with all questions populated
router.get('/:id/questions', testController.getTestWithQuestions);

// @route   POST /api/tests
// @desc    Create new test
router.post('/', testController.createTest);

// @route   POST /api/tests/generate
// @desc    Generate random test (for full mocks)
router.post('/generate', testController.generateRandomTest);

// @route   PUT /api/tests/:id
// @desc    Update test
router.put('/:id', testController.updateTest);

// @route   PATCH /api/tests/:id/status
// @desc    Update test status
router.patch('/:id/status', testController.updateTestStatus);

// @route   DELETE /api/tests/:id
// @desc    Delete test
router.delete('/:id', testController.deleteTest);

// @route   POST /api/tests/:id/add-questions
// @desc    Add questions to existing test
router.post('/:id/add-questions', testController.addQuestionsToTest);

// @route   POST /api/tests/:id/remove-questions
// @desc    Remove questions from test
router.post('/:id/remove-questions', testController.removeQuestionsFromTest);

// @route   GET /api/tests/:id/attempts
// @desc    Get all attempts for a test
router.get('/:id/attempts', testController.getTestAttempts);

module.exports = router;