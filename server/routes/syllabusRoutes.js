const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');

// ═══════════════════════════════════════════════════════════════
// READ ROUTES
// ═══════════════════════════════════════════════════════════════

// @route   GET /api/syllabus
// @desc    Get all syllabus data
router.get('/', syllabusController.getAllSyllabus);

// @route   GET /api/syllabus/paper1
// @desc    Get Paper 1 syllabus
router.get('/paper1', syllabusController.getPaper1Syllabus);

// @route   GET /api/syllabus/paper2
// @desc    Get Paper 2 (History) syllabus
router.get('/paper2', syllabusController.getPaper2Syllabus);

// @route   GET /api/syllabus/units
// @desc    Get units list for a paper
router.get('/units', syllabusController.getUnits);

// @route   GET /api/syllabus/chapters
// @desc    Get chapters for a unit
router.get('/chapters', syllabusController.getChapters);

// @route   GET /api/syllabus/topics
// @desc    Get topics for a chapter
router.get('/topics', syllabusController.getTopics);

// @route   GET /api/syllabus/search
// @desc    Search syllabus
router.get('/search', syllabusController.searchSyllabus);

// @route   GET /api/syllabus/tree
// @desc    Get syllabus as tree structure
router.get('/tree', syllabusController.getSyllabusTree);

// @route   GET /api/syllabus/stats
// @desc    Get syllabus statistics
router.get('/stats', syllabusController.getSyllabusStats);

// ═══════════════════════════════════════════════════════════════
// WRITE ROUTES - SYLLABUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// @route   POST /api/syllabus/initialize
// @desc    Initialize syllabus from static data
router.post('/initialize', syllabusController.initializeSyllabus);

// @route   POST/PUT /api/syllabus/manage
// @desc    Add/Update entire syllabus for a paper
router.post('/manage', syllabusController.manageSyllabus);
router.put('/manage', syllabusController.manageSyllabus);

// ─── Unit Management ─────────────────────────────────────────
// @route   POST /api/syllabus/unit
// @desc    Add a new unit
router.post('/unit', syllabusController.addUnit);

// @route   PUT /api/syllabus/unit/:unitId
// @desc    Update a unit
router.put('/unit/:unitId', syllabusController.updateUnit);

// @route   DELETE /api/syllabus/unit/:unitId
// @desc    Delete a unit
router.delete('/unit/:unitId', syllabusController.deleteUnit);

// ─── Chapter Management ──────────────────────────────────────
// @route   POST /api/syllabus/chapter
// @desc    Add a new chapter
router.post('/chapter', syllabusController.addChapter);

// @route   PUT /api/syllabus/chapter/:chapterId
// @desc    Update a chapter
router.put('/chapter/:chapterId', syllabusController.updateChapter);

// @route   DELETE /api/syllabus/chapter/:chapterId
// @desc    Delete a chapter
router.delete('/chapter/:chapterId', syllabusController.deleteChapter);

// ─── Topic Management ────────────────────────────────────────
// @route   POST /api/syllabus/topic
// @desc    Add a new topic
router.post('/topic', syllabusController.addTopic);

// @route   PUT /api/syllabus/topic/:topicId
// @desc    Update a topic
router.put('/topic/:topicId', syllabusController.updateTopic);

// @route   DELETE /api/syllabus/topic/:topicId
// @desc    Delete a topic
router.delete('/topic/:topicId', syllabusController.deleteTopic);

// ─── Subtopic Management ─────────────────────────────────────
// @route   POST /api/syllabus/subtopic
// @desc    Add subtopic to a topic
router.post('/subtopic', syllabusController.addSubtopic);

// @route   DELETE /api/syllabus/subtopic
// @desc    Delete subtopic from a topic
router.delete('/subtopic', syllabusController.deleteSubtopic);

// ─── Reorder ─────────────────────────────────────────────────
// @route   PUT /api/syllabus/reorder/units
// @desc    Reorder units
router.put('/reorder/units', syllabusController.reorderUnits);

module.exports = router;