const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');

// @route   GET /api/attempts
router.get('/', attemptController.getAttempts);

// @route   GET /api/attempts/recent
router.get('/recent', attemptController.getRecentAttempts);

// @route   GET /api/attempts/stats
router.get('/stats', attemptController.getAttemptStats);

// @route   POST /api/attempts/backfill-snapshots
router.post('/backfill-snapshots', attemptController.backfillSnapshots);

// @route   GET /api/attempts/:id
router.get('/:id', attemptController.getAttemptById);

// @route   GET /api/attempts/:id/review
router.get('/:id/review', attemptController.getAttemptReview);

// @route   POST /api/attempts/start
router.post('/start', attemptController.startAttempt);

// @route   PUT /api/attempts/:id/answer
router.put('/:id/answer', attemptController.saveAnswer);

// @route   PUT /api/attempts/:id/mark-review
router.put('/:id/mark-review', attemptController.toggleMarkForReview);

// @route   PUT /api/attempts/:id/visit
router.put('/:id/visit', attemptController.markVisited);

// @route   POST /api/attempts/:id/submit
router.post('/:id/submit', attemptController.submitAttempt);

// @route   PUT /api/attempts/:id/pause
router.put('/:id/pause', attemptController.pauseAttempt);

// @route   PUT /api/attempts/:id/resume
router.put('/:id/resume', attemptController.resumeAttempt);

// @route   PUT /api/attempts/:id/abandon
router.put('/:id/abandon', attemptController.abandonAttempt);

// @route   GET /api/attempts/:id/status
router.get('/:id/status', attemptController.getAttemptStatus);

// @route   DELETE /api/attempts/:id
router.delete('/:id', attemptController.deleteAttempt);

module.exports = router;