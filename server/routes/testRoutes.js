const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/', testController.getTests);
router.get('/stats', testController.getTestStats);
router.get('/types', testController.getTestTypes);
router.get('/filter-options', testController.getFilterOptions);

// ★ Re-translate route (BEFORE /:id)
router.post('/:id/retranslate', testController.reTranslateTest);

router.get('/:id', testController.getTestById);
router.get('/:id/questions', testController.getTestWithQuestions);
router.post('/', testController.createTest);
router.post('/generate', testController.generateRandomTest);
router.put('/:id', testController.updateTest);
router.patch('/:id/status', testController.updateTestStatus);
router.delete('/:id', testController.deleteTest);
router.post('/:id/add-questions', testController.addQuestionsToTest);
router.post('/:id/remove-questions', testController.removeQuestionsFromTest);
router.get('/:id/attempts', testController.getTestAttempts);

module.exports = router;