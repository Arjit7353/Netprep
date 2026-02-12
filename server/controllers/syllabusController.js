const path = require('path');
const fs = require('fs');

// Load syllabus data
let syllabusPaper1 = null;
let syllabusPaper2 = null;

const loadSyllabusData = () => {
  try {
    const paper1Path = path.join(__dirname, '../data/syllabusPaper1.json');
    const paper2Path = path.join(__dirname, '../data/syllabusPaper2History.json');

    if (fs.existsSync(paper1Path)) {
      syllabusPaper1 = JSON.parse(fs.readFileSync(paper1Path, 'utf-8'));
    }
    if (fs.existsSync(paper2Path)) {
      syllabusPaper2 = JSON.parse(fs.readFileSync(paper2Path, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading syllabus data:', error.message);
  }
};

// Load on startup
loadSyllabusData();

// @desc    Get all syllabus data
// @route   GET /api/syllabus
const getAllSyllabus = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        paper1: syllabusPaper1,
        paper2: syllabusPaper2
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Paper 1 syllabus
// @route   GET /api/syllabus/paper1
const getPaper1Syllabus = async (req, res, next) => {
  try {
    if (!syllabusPaper1) {
      return res.status(404).json({
        success: false,
        message: 'Paper 1 syllabus not found'
      });
    }

    res.json({
      success: true,
      data: syllabusPaper1
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Paper 2 (History) syllabus
// @route   GET /api/syllabus/paper2
const getPaper2Syllabus = async (req, res, next) => {
  try {
    if (!syllabusPaper2) {
      return res.status(404).json({
        success: false,
        message: 'Paper 2 syllabus not found'
      });
    }

    res.json({
      success: true,
      data: syllabusPaper2
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get units list for a paper
// @route   GET /api/syllabus/units
const getUnits = async (req, res, next) => {
  try {
    const { paper } = req.query;

    let syllabus = paper === 'paper2' ? syllabusPaper2 : syllabusPaper1;

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const units = syllabus.units.map(unit => ({
      id: unit.id,
      name: unit.name,
      nameHi: unit.nameHi,
      part: unit.part || null,
      chapterCount: unit.chapters?.length || 0
    }));

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chapters for a unit
// @route   GET /api/syllabus/chapters
const getChapters = async (req, res, next) => {
  try {
    const { paper, unit } = req.query;

    let syllabus = paper === 'paper2' ? syllabusPaper2 : syllabusPaper1;

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unitData = syllabus.units.find(u => u.id === unit || u.name === unit);

    if (!unitData) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapters = unitData.chapters.map(chapter => ({
      id: chapter.id,
      name: chapter.name,
      nameHi: chapter.nameHi,
      topicCount: chapter.topics?.length || 0
    }));

    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get topics for a chapter
// @route   GET /api/syllabus/topics
const getTopics = async (req, res, next) => {
  try {
    const { paper, unit, chapter } = req.query;

    let syllabus = paper === 'paper2' ? syllabusPaper2 : syllabusPaper1;

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unitData = syllabus.units.find(u => u.id === unit || u.name === unit);

    if (!unitData) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapterData = unitData.chapters.find(c => c.id === chapter || c.name === chapter);

    if (!chapterData) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const topics = chapterData.topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      nameHi: topic.nameHi,
      subtopics: topic.subtopics || []
    }));

    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search syllabus
// @route   GET /api/syllabus/search
const searchSyllabus = async (req, res, next) => {
  try {
    const { query, paper } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchIn = paper === 'paper2' ? [syllabusPaper2] : 
                     paper === 'paper1' ? [syllabusPaper1] : 
                     [syllabusPaper1, syllabusPaper2];

    const results = [];
    const searchLower = query.toLowerCase();

    for (const syllabus of searchIn) {
      if (!syllabus) continue;

      for (const unit of syllabus.units) {
        // Search in unit name
        if (unit.name.toLowerCase().includes(searchLower) ||
            unit.nameHi?.includes(query)) {
          results.push({
            type: 'unit',
            paper: syllabus.paper,
            unit: unit.name,
            unitHi: unit.nameHi,
            match: 'unit'
          });
        }

        for (const chapter of unit.chapters || []) {
          // Search in chapter name
          if (chapter.name.toLowerCase().includes(searchLower) ||
              chapter.nameHi?.includes(query)) {
            results.push({
              type: 'chapter',
              paper: syllabus.paper,
              unit: unit.name,
              chapter: chapter.name,
              chapterHi: chapter.nameHi,
              match: 'chapter'
            });
          }

          for (const topic of chapter.topics || []) {
            // Search in topic name
            if (topic.name.toLowerCase().includes(searchLower) ||
                topic.nameHi?.includes(query)) {
              results.push({
                type: 'topic',
                paper: syllabus.paper,
                unit: unit.name,
                chapter: chapter.name,
                topic: topic.name,
                topicHi: topic.nameHi,
                match: 'topic'
              });
            }

            // Search in subtopics
            for (const subtopic of topic.subtopics || []) {
              if (subtopic.toLowerCase().includes(searchLower)) {
                results.push({
                  type: 'subtopic',
                  paper: syllabus.paper,
                  unit: unit.name,
                  chapter: chapter.name,
                  topic: topic.name,
                  subtopic,
                  match: 'subtopic'
                });
              }
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        query,
        count: results.length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get syllabus as tree structure
// @route   GET /api/syllabus/tree
const getSyllabusTree = async (req, res, next) => {
  try {
    const { paper } = req.query;

    let syllabus = paper === 'paper2' ? syllabusPaper2 : syllabusPaper1;

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    // Build tree structure
    const tree = {
      paper: syllabus.paper,
      name: syllabus.name,
      nameHi: syllabus.nameHi,
      code: syllabus.code,
      children: syllabus.units.map(unit => ({
        id: unit.id,
        name: unit.name,
        nameHi: unit.nameHi,
        type: 'unit',
        children: (unit.chapters || []).map(chapter => ({
          id: chapter.id,
          name: chapter.name,
          nameHi: chapter.nameHi,
          type: 'chapter',
          children: (chapter.topics || []).map(topic => ({
            id: topic.id,
            name: topic.name,
            nameHi: topic.nameHi,
            type: 'topic',
            children: (topic.subtopics || []).map((subtopic, idx) => ({
              id: `${topic.id}-st${idx}`,
              name: subtopic,
              type: 'subtopic'
            }))
          }))
        }))
      }))
    };

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSyllabus,
  getPaper1Syllabus,
  getPaper2Syllabus,
  getUnits,
  getChapters,
  getTopics,
  searchSyllabus,
  getSyllabusTree
};