const path = require('path');
const fs = require('fs');
const Syllabus = require('../models/Syllabus');

// Load static syllabus data as fallback
let syllabusPaper1Static = null;
let syllabusPaper2Static = null;

const loadStaticSyllabusData = () => {
  try {
    const paper1Path = path.join(__dirname, '../data/syllabusPaper1.json');
    const paper2Path = path.join(__dirname, '../data/syllabusPaper2History.json');

    if (fs.existsSync(paper1Path)) {
      syllabusPaper1Static = JSON.parse(fs.readFileSync(paper1Path, 'utf-8'));
    }
    if (fs.existsSync(paper2Path)) {
      syllabusPaper2Static = JSON.parse(fs.readFileSync(paper2Path, 'utf-8'));
    }
    console.log('[Syllabus] Static data loaded successfully');
  } catch (error) {
    console.error('[Syllabus] Error loading static data:', error.message);
  }
};

// Load on startup
loadStaticSyllabusData();

// Helper: Get syllabus (DB first, then static fallback)
const getSyllabusData = async (paper) => {
  try {
    // Try database first
    let syllabus = await Syllabus.findOne({ paper, isActive: true });
    
    if (syllabus) {
      return syllabus.toObject();
    }
    
    // Fallback to static data
    if (paper === 'paper1' && syllabusPaper1Static) {
      return syllabusPaper1Static;
    }
    if (paper === 'paper2' && syllabusPaper2Static) {
      return syllabusPaper2Static;
    }
    
    return null;
  } catch (error) {
    console.error('[Syllabus] getSyllabusData error:', error);
    // On error, try static fallback
    if (paper === 'paper1') return syllabusPaper1Static;
    if (paper === 'paper2') return syllabusPaper2Static;
    return null;
  }
};

// Helper: Ensure syllabus exists in DB (initialize from static if needed)
const ensureSyllabusInDB = async (paper) => {
  let syllabus = await Syllabus.findOne({ paper });
  
  if (!syllabus) {
    // Initialize from static data
    const staticData = paper === 'paper1' ? syllabusPaper1Static : syllabusPaper2Static;
    
    if (staticData) {
      syllabus = await Syllabus.create({
        paper: staticData.paper,
        name: staticData.name,
        nameHi: staticData.nameHi || '',
        code: staticData.code,
        units: staticData.units || []
      });
      console.log(`[Syllabus] Initialized ${paper} from static data`);
    } else {
      // Create empty syllabus
      syllabus = await Syllabus.create({
        paper,
        name: paper === 'paper1' ? 'General Paper on Teaching & Research Aptitude' : 'History',
        nameHi: paper === 'paper1' ? 'शिक्षण और शोध अभिवृत्ति पर सामान्य पेपर' : 'इतिहास',
        code: paper === 'paper1' ? '00' : '06',
        units: []
      });
      console.log(`[Syllabus] Created empty ${paper}`);
    }
  }
  
  return syllabus;
};

// ═══════════════════════════════════════════════════════════════
// READ OPERATIONS
// ═══════════════════════════════════════════════════════════════

// @desc    Get all syllabus data
// @route   GET /api/syllabus
const getAllSyllabus = async (req, res, next) => {
  try {
    const paper1 = await getSyllabusData('paper1');
    const paper2 = await getSyllabusData('paper2');

    res.json({
      success: true,
      data: {
        paper1,
        paper2
      },
      source: 'combined'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Paper 1 syllabus
// @route   GET /api/syllabus/paper1
const getPaper1Syllabus = async (req, res, next) => {
  try {
    const syllabus = await getSyllabusData('paper1');

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Paper 1 syllabus not found'
      });
    }

    res.json({
      success: true,
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Paper 2 (History) syllabus
// @route   GET /api/syllabus/paper2
const getPaper2Syllabus = async (req, res, next) => {
  try {
    const syllabus = await getSyllabusData('paper2');

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Paper 2 syllabus not found'
      });
    }

    res.json({
      success: true,
      data: syllabus
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
    const syllabus = await getSyllabusData(paper || 'paper1');

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const units = (syllabus.units || []).map((unit, index) => ({
      id: unit.id,
      name: unit.name,
      nameHi: unit.nameHi,
      part: unit.part || null,
      chapterCount: unit.chapters?.length || 0,
      order: unit.order || index
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
    const syllabus = await getSyllabusData(paper || 'paper1');

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

    const chapters = (unitData.chapters || []).map((chapter, index) => ({
      id: chapter.id,
      name: chapter.name,
      nameHi: chapter.nameHi,
      topicCount: chapter.topics?.length || 0,
      order: chapter.order || index
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
    const syllabus = await getSyllabusData(paper || 'paper1');

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

    const topics = (chapterData.topics || []).map((topic, index) => ({
      id: topic.id,
      name: topic.name,
      nameHi: topic.nameHi,
      subtopics: topic.subtopics || [],
      order: topic.order || index
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

    const paper1Data = await getSyllabusData('paper1');
    const paper2Data = await getSyllabusData('paper2');

    const searchIn = paper === 'paper2' ? [paper2Data] : 
                     paper === 'paper1' ? [paper1Data] : 
                     [paper1Data, paper2Data].filter(Boolean);

    const results = [];
    const searchLower = query.toLowerCase();

    for (const syllabus of searchIn) {
      if (!syllabus) continue;

      for (const unit of syllabus.units || []) {
        // Search in unit name
        if (unit.name?.toLowerCase().includes(searchLower) ||
            unit.nameHi?.includes(query)) {
          results.push({
            type: 'unit',
            paper: syllabus.paper,
            unit: unit.name,
            unitHi: unit.nameHi,
            unitId: unit.id,
            match: 'unit'
          });
        }

        for (const chapter of unit.chapters || []) {
          // Search in chapter name
          if (chapter.name?.toLowerCase().includes(searchLower) ||
              chapter.nameHi?.includes(query)) {
            results.push({
              type: 'chapter',
              paper: syllabus.paper,
              unit: unit.name,
              unitId: unit.id,
              chapter: chapter.name,
              chapterId: chapter.id,
              chapterHi: chapter.nameHi,
              match: 'chapter'
            });
          }

          for (const topic of chapter.topics || []) {
            // Search in topic name
            if (topic.name?.toLowerCase().includes(searchLower) ||
                topic.nameHi?.includes(query)) {
              results.push({
                type: 'topic',
                paper: syllabus.paper,
                unit: unit.name,
                unitId: unit.id,
                chapter: chapter.name,
                chapterId: chapter.id,
                topic: topic.name,
                topicId: topic.id,
                topicHi: topic.nameHi,
                match: 'topic'
              });
            }

            // Search in subtopics
            for (const subtopic of topic.subtopics || []) {
              const subtopicName = typeof subtopic === 'string' ? subtopic : subtopic.name;
              if (subtopicName?.toLowerCase().includes(searchLower)) {
                results.push({
                  type: 'subtopic',
                  paper: syllabus.paper,
                  unit: unit.name,
                  chapter: chapter.name,
                  topic: topic.name,
                  subtopic: subtopicName,
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
    const syllabus = await getSyllabusData(paper || 'paper1');

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
      children: (syllabus.units || []).map(unit => ({
        id: unit.id,
        name: unit.name,
        nameHi: unit.nameHi,
        type: 'unit',
        part: unit.part,
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
              name: typeof subtopic === 'string' ? subtopic : subtopic.name,
              nameHi: typeof subtopic === 'object' ? subtopic.nameHi : '',
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

// ═══════════════════════════════════════════════════════════════
// WRITE OPERATIONS - SYLLABUS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// @desc    Initialize syllabus from static data
// @route   POST /api/syllabus/initialize
const initializeSyllabus = async (req, res, next) => {
  try {
    const { paper } = req.body;

    if (!paper || !['paper1', 'paper2'].includes(paper)) {
      return res.status(400).json({
        success: false,
        message: 'Valid paper (paper1 or paper2) is required'
      });
    }

    // Check if already exists
    let existing = await Syllabus.findOne({ paper });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Syllabus for ${paper} already exists. Use update instead.`
      });
    }

    const syllabus = await ensureSyllabusInDB(paper);

    res.status(201).json({
      success: true,
      message: `Syllabus for ${paper} initialized successfully`,
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/Update entire syllabus for a paper
// @route   POST/PUT /api/syllabus/manage
const manageSyllabus = async (req, res, next) => {
  try {
    const { paper, name, nameHi, code, units } = req.body;

    if (!paper || !['paper1', 'paper2'].includes(paper)) {
      return res.status(400).json({
        success: false,
        message: 'Valid paper (paper1 or paper2) is required'
      });
    }

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (syllabus) {
      // Update existing
      syllabus.name = name;
      syllabus.nameHi = nameHi || syllabus.nameHi;
      syllabus.code = code;
      if (units !== undefined) {
        syllabus.units = units;
      }
      await syllabus.save();
    } else {
      // Create new
      syllabus = await Syllabus.create({
        paper,
        name,
        nameHi: nameHi || '',
        code,
        units: units || []
      });
    }

    res.json({
      success: true,
      message: 'Syllabus saved successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new unit
// @route   POST /api/syllabus/unit
const addUnit = async (req, res, next) => {
  try {
    const { paper, id, name, nameHi, part } = req.body;

    if (!paper || !id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Paper, id, and name are required'
      });
    }

    let syllabus = await ensureSyllabusInDB(paper);

    // Check if unit already exists
    const existingUnit = syllabus.units.find(u => u.id === id);
    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this ID already exists'
      });
    }

    // Calculate order
    const maxOrder = syllabus.units.length > 0 
      ? Math.max(...syllabus.units.map(u => u.order || 0)) 
      : 0;

    syllabus.units.push({
      id,
      name,
      nameHi: nameHi || '',
      part: part || '',
      chapters: [],
      order: maxOrder + 1
    });

    await syllabus.save();

    res.status(201).json({
      success: true,
      message: 'Unit added successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a unit
// @route   PUT /api/syllabus/unit/:unitId
const updateUnit = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const { paper, name, nameHi, part, order } = req.body;

    if (!paper) {
      return res.status(400).json({
        success: false,
        message: 'Paper is required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    if (name) unit.name = name;
    if (nameHi !== undefined) unit.nameHi = nameHi;
    if (part !== undefined) unit.part = part;
    if (order !== undefined) unit.order = order;

    await syllabus.save();

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a unit
// @route   DELETE /api/syllabus/unit/:unitId
const deleteUnit = async (req, res, next) => {
  try {
    const { unitId } = req.params;
    const { paper } = req.query;

    if (!paper) {
      return res.status(400).json({
        success: false,
        message: 'Paper is required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unitIndex = syllabus.units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    syllabus.units.splice(unitIndex, 1);
    await syllabus.save();

    res.json({
      success: true,
      message: 'Unit deleted successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new chapter
// @route   POST /api/syllabus/chapter
const addChapter = async (req, res, next) => {
  try {
    const { paper, unitId, id, name, nameHi } = req.body;

    if (!paper || !unitId || !id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Paper, unitId, id, and name are required'
      });
    }

    let syllabus = await ensureSyllabusInDB(paper);

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Check if chapter already exists
    const existingChapter = unit.chapters.find(c => c.id === id);
    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: 'Chapter with this ID already exists in this unit'
      });
    }

    // Calculate order
    const maxOrder = unit.chapters.length > 0 
      ? Math.max(...unit.chapters.map(c => c.order || 0)) 
      : 0;

    unit.chapters.push({
      id,
      name,
      nameHi: nameHi || '',
      topics: [],
      order: maxOrder + 1
    });

    await syllabus.save();

    res.status(201).json({
      success: true,
      message: 'Chapter added successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a chapter
// @route   PUT /api/syllabus/chapter/:chapterId
const updateChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { paper, unitId, name, nameHi, order } = req.body;

    if (!paper || !unitId) {
      return res.status(400).json({
        success: false,
        message: 'Paper and unitId are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapter = unit.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    if (name) chapter.name = name;
    if (nameHi !== undefined) chapter.nameHi = nameHi;
    if (order !== undefined) chapter.order = order;

    await syllabus.save();

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a chapter
// @route   DELETE /api/syllabus/chapter/:chapterId
const deleteChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { paper, unitId } = req.query;

    if (!paper || !unitId) {
      return res.status(400).json({
        success: false,
        message: 'Paper and unitId are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapterIndex = unit.chapters.findIndex(c => c.id === chapterId);
    if (chapterIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    unit.chapters.splice(chapterIndex, 1);
    await syllabus.save();

    res.json({
      success: true,
      message: 'Chapter deleted successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new topic
// @route   POST /api/syllabus/topic
const addTopic = async (req, res, next) => {
  try {
    const { paper, unitId, chapterId, id, name, nameHi, subtopics } = req.body;

    if (!paper || !unitId || !chapterId || !id || !name) {
      return res.status(400).json({
        success: false,
        message: 'Paper, unitId, chapterId, id, and name are required'
      });
    }

    let syllabus = await ensureSyllabusInDB(paper);

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapter = unit.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Check if topic already exists
    const existingTopic = chapter.topics.find(t => t.id === id);
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: 'Topic with this ID already exists in this chapter'
      });
    }

    // Calculate order
    const maxOrder = chapter.topics.length > 0 
      ? Math.max(...chapter.topics.map(t => t.order || 0)) 
      : 0;

    // Process subtopics
    const processedSubtopics = (subtopics || []).map(st => {
      if (typeof st === 'string') {
        return { name: st, nameHi: '' };
      }
      return { name: st.name, nameHi: st.nameHi || '' };
    });

    chapter.topics.push({
      id,
      name,
      nameHi: nameHi || '',
      subtopics: processedSubtopics,
      order: maxOrder + 1
    });

    await syllabus.save();

    res.status(201).json({
      success: true,
      message: 'Topic added successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a topic
// @route   PUT /api/syllabus/topic/:topicId
const updateTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { paper, unitId, chapterId, name, nameHi, subtopics, order } = req.body;

    if (!paper || !unitId || !chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Paper, unitId, and chapterId are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapter = unit.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const topic = chapter.topics.find(t => t.id === topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    if (name) topic.name = name;
    if (nameHi !== undefined) topic.nameHi = nameHi;
    if (order !== undefined) topic.order = order;
    
    if (subtopics !== undefined) {
      topic.subtopics = subtopics.map(st => {
        if (typeof st === 'string') {
          return { name: st, nameHi: '' };
        }
        return { name: st.name, nameHi: st.nameHi || '' };
      });
    }

    await syllabus.save();

    res.json({
      success: true,
      message: 'Topic updated successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a topic
// @route   DELETE /api/syllabus/topic/:topicId
const deleteTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { paper, unitId, chapterId } = req.query;

    if (!paper || !unitId || !chapterId) {
      return res.status(400).json({
        success: false,
        message: 'Paper, unitId, and chapterId are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapter = unit.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const topicIndex = chapter.topics.findIndex(t => t.id === topicId);
    if (topicIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    chapter.topics.splice(topicIndex, 1);
    await syllabus.save();

    res.json({
      success: true,
      message: 'Topic deleted successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add subtopic to a topic
// @route   POST /api/syllabus/subtopic
const addSubtopic = async (req, res, next) => {
  try {
    const { paper, unitId, chapterId, topicId, name, nameHi } = req.body;

    if (!paper || !unitId || !chapterId || !topicId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Paper, unitId, chapterId, topicId, and name are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapter = unit.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const topic = chapter.topics.find(t => t.id === topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    topic.subtopics.push({
      name,
      nameHi: nameHi || ''
    });

    await syllabus.save();

    res.status(201).json({
      success: true,
      message: 'Subtopic added successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subtopic from a topic
// @route   DELETE /api/syllabus/subtopic
const deleteSubtopic = async (req, res, next) => {
  try {
    const { paper, unitId, chapterId, topicId, subtopicIndex } = req.query;

    if (!paper || !unitId || !chapterId || !topicId || subtopicIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Paper, unitId, chapterId, topicId, and subtopicIndex are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    const unit = syllabus.units.find(u => u.id === unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const chapter = unit.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const topic = chapter.topics.find(t => t.id === topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    const index = parseInt(subtopicIndex);
    if (index < 0 || index >= topic.subtopics.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subtopic index'
      });
    }

    topic.subtopics.splice(index, 1);
    await syllabus.save();

    res.json({
      success: true,
      message: 'Subtopic deleted successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder units
// @route   PUT /api/syllabus/reorder/units
const reorderUnits = async (req, res, next) => {
  try {
    const { paper, unitIds } = req.body;

    if (!paper || !Array.isArray(unitIds)) {
      return res.status(400).json({
        success: false,
        message: 'Paper and unitIds array are required'
      });
    }

    let syllabus = await Syllabus.findOne({ paper });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    // Reorder units based on unitIds order
    unitIds.forEach((id, index) => {
      const unit = syllabus.units.find(u => u.id === id);
      if (unit) {
        unit.order = index;
      }
    });

    // Sort units by order
    syllabus.units.sort((a, b) => (a.order || 0) - (b.order || 0));

    await syllabus.save();

    res.json({
      success: true,
      message: 'Units reordered successfully',
      data: syllabus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get syllabus statistics
// @route   GET /api/syllabus/stats
const getSyllabusStats = async (req, res, next) => {
  try {
    const { paper } = req.query;
    const syllabus = await getSyllabusData(paper || 'paper1');

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    let totalChapters = 0;
    let totalTopics = 0;
    let totalSubtopics = 0;

    (syllabus.units || []).forEach(unit => {
      totalChapters += unit.chapters?.length || 0;
      (unit.chapters || []).forEach(chapter => {
        totalTopics += chapter.topics?.length || 0;
        (chapter.topics || []).forEach(topic => {
          totalSubtopics += topic.subtopics?.length || 0;
        });
      });
    });

    res.json({
      success: true,
      data: {
        paper: syllabus.paper,
        name: syllabus.name,
        totalUnits: syllabus.units?.length || 0,
        totalChapters,
        totalTopics,
        totalSubtopics,
        version: syllabus.version || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Read operations
  getAllSyllabus,
  getPaper1Syllabus,
  getPaper2Syllabus,
  getUnits,
  getChapters,
  getTopics,
  searchSyllabus,
  getSyllabusTree,
  getSyllabusStats,
  
  // Write operations
  initializeSyllabus,
  manageSyllabus,
  addUnit,
  updateUnit,
  deleteUnit,
  addChapter,
  updateChapter,
  deleteChapter,
  addTopic,
  updateTopic,
  deleteTopic,
  addSubtopic,
  deleteSubtopic,
  reorderUnits
};