const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');

// @route   GET /api/attempts
// @desc    Get all attempts (with filters)
router.get('/', attemptController.getAttempts);

// @route   GET /api/attempts/recent
// @desc    Get recent attempts
router.get('/recent', attemptController.getRecentAttempts);

// @route   GET /api/attempts/stats
// @desc    Get overall statistics
router.get('/stats', attemptController.getAttemptStats);

// @route   GET /api/attempts/:id
// @desc    Get single attempt by ID
router.get('/:id', attemptController.getAttemptById);

// @route   GET /api/attempts/:id/review
// @desc    Get attempt with full solution review
router.get('/:id/review', attemptController.getAttemptReview);

// @route   POST /api/attempts/start
// @desc    Start new test attempt
router.post('/start', attemptController.startAttempt);

// @route   PUT /api/attempts/:id/answer
// @desc    Save answer for a question
router.put('/:id/answer', attemptController.saveAnswer);

// @route   PUT /api/attempts/:id/mark-review
// @desc    Toggle mark for review
router.put('/:id/mark-review', attemptController.toggleMarkForReview);

// @route   PUT /api/attempts/:id/visit
// @desc    Mark question as visited
router.put('/:id/visit', attemptController.markVisited);

// @route   POST /api/attempts/:id/submit
// @desc    Submit test attempt
router.post('/:id/submit', attemptController.submitAttempt);

// @route   PUT /api/attempts/:id/pause
// @desc    Pause attempt (save current state)
router.put('/:id/pause', attemptController.pauseAttempt);

// @route   PUT /api/attempts/:id/resume
// @desc    Resume paused attempt
router.put('/:id/resume', attemptController.resumeAttempt);

// @route   PUT /api/attempts/:id/abandon
// @desc    Abandon attempt
router.put('/:id/abandon', attemptController.abandonAttempt);

// @route   GET /api/attempts/:id/status
// @desc    Get attempt status summary
router.get('/:id/status', attemptController.getAttemptStatus);

// @route   DELETE /api/attempts/:id
// @desc    Delete attempt
router.delete('/:id', attemptController.deleteAttempt);

module.exports = router;