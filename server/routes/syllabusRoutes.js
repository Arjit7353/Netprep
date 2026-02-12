const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');

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

module.exports = router;