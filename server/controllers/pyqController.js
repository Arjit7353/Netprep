// server/controllers/pyqController.js
// ═══════════════════════════════════════════════════════════════
// PYQ Controller — FIXED: Removed double translation call
// ═══════════════════════════════════════════════════════════════

const PYQAnalysis = require('../models/PYQAnalysis');
const Question = require('../models/Question');
const pyqAnalyzer = require('../utils/pyqAnalyzer');

// Lazy load translate helper
let pyqTranslateHelper = null;
function getTranslateHelper() {
  if (!pyqTranslateHelper) {
    try {
      pyqTranslateHelper = require('../utils/pyqTranslateHelper');
    } catch (e) {
      console.warn('[PYQ] pyqTranslateHelper not available:', e.message);
    }
  }
  return pyqTranslateHelper;
}

// TYPE MAP
const TYPE_MAP = {
  'simple_mcq': 'mcq', 'mcq': 'mcq', 'multiple_choice': 'mcq',
  'assertion_reason': 'assertion_reason', 'ar': 'assertion_reason',
  'matching': 'match_following', 'match_following': 'match_following', 'match': 'match_following',
  'chronology': 'sequence_order', 'sequence_order': 'sequence_order', 'sequence': 'sequence_order',
  'multi_statement': 'statement_based', 'statement_based': 'statement_based', 'statements': 'statement_based',
  'comprehension': 'passage_based', 'passage': 'passage_based', 'passage_based': 'passage_based',
  'di_table': 'di_table', 'di_bar_chart': 'di_bar_chart', 'di_pie_chart': 'di_pie_chart',
  'di_line_graph': 'di_line_graph', 'di_caselet': 'di_caselet', 'di_mixed': 'di_mixed'
};
function mapType(pyqType) {
  return TYPE_MAP[(pyqType || '').toLowerCase()] || 'mcq';
}

// ═══════════════════════════════════════════════════════════════
// SHIFT & SESSION NORMALIZERS — handles all input formats
// ═══════════════════════════════════════════════════════════════

/**
 * Normalize shift value from any format to enum: 'shift1' | 'shift2' | 'none'
 * Handles: "1st_shift", "2nd_shift", "shift_1", "Shift 1", "morning", "evening", "1", "s1", etc.
 */
function normalizeShift(shift) {
  if (!shift) return 'none';
  const s = shift.toString().toLowerCase().trim();

  // Already valid
  if (s === 'shift1' || s === 'shift2' || s === 'none') return s;

  // Common patterns for Shift 1
  if (
    s === '1st_shift' || s === '1st shift' || s === '1stshift' ||
    s === 'shift_1' || s === 'shift 1' || s === 'shift-1' ||
    s === 'first' || s === 'first_shift' || s === 'first shift' ||
    s === 'morning' || s === 'morning_shift' ||
    s === 's1' || s === '1'
  ) {
    return 'shift1';
  }

  // Common patterns for Shift 2
  if (
    s === '2nd_shift' || s === '2nd shift' || s === '2ndshift' ||
    s === 'shift_2' || s === 'shift 2' || s === 'shift-2' ||
    s === 'second' || s === 'second_shift' || s === 'second shift' ||
    s === 'evening' || s === 'evening_shift' || s === 'afternoon' ||
    s === 's2' || s === '2'
  ) {
    return 'shift2';
  }

  // None patterns
  if (
    s === 'na' || s === 'n/a' || s === 'single' || s === 'only' ||
    s === 'no' || s === '-' || s === ''
  ) {
    return 'none';
  }

  // Try to extract digit
  const digitMatch = s.match(/(\d)/);
  if (digitMatch) {
    if (digitMatch[1] === '1') return 'shift1';
    if (digitMatch[1] === '2') return 'shift2';
  }

  console.warn(`[PYQ] Unknown shift value: "${shift}" → defaulting to "none"`);
  return 'none';
}

/**
 * Normalize session value from any format to enum
 * Handles: "June", "JUNE", "jun", "Dec", "december", etc.
 */
function normalizeSession(session) {
  if (!session) return 'june';
  const s = session.toString().toLowerCase().trim();

  // Already valid
  const validSessions = ['june', 'december', 'november', 'september', 'march', 'other'];
  if (validSessions.includes(s)) return s;

  // Partial matches
  if (s.includes('jun')) return 'june';
  if (s.includes('dec')) return 'december';
  if (s.includes('nov')) return 'november';
  if (s.includes('sep')) return 'september';
  if (s.includes('mar')) return 'march';

  // Month numbers
  if (s === '6' || s === '06') return 'june';
  if (s === '12') return 'december';
  if (s === '11') return 'november';
  if (s === '9' || s === '09') return 'september';
  if (s === '3' || s === '03') return 'march';

  console.warn(`[PYQ] Unknown session value: "${session}" → defaulting to "other"`);
  return 'other';
}

/**
 * Normalize year value — ensure it's a clean 4-digit string
 */
function normalizeYear(year) {
  if (!year) return new Date().getFullYear().toString();
  const s = year.toString().trim();
  const match = s.match(/(\d{4})/);
  return match ? match[1] : s;
}

// ════════════════════════════════════════════════════════════════
// 1. VALIDATE PYQ IMPORT
// ════════════════════════════════════════════════════════════════
const validatePYQImport = async (req, res, next) => {
  try {
    const data = req.body;
    const result = pyqAnalyzer.validateImportData(data);
    const detectedLang = pyqAnalyzer.detectLanguage(data);

    const questions = data.questions || data.questionTopicMap || [];
    let translatableCount = 0;
    questions.forEach(q => {
      const hasContent = !!(
        q.question || q.questionText || q.questionTextHi || q.questionTextEn ||
        q.assertion || q.assertionHi ||
        q.passage || q.passageHi ||
        q.caseletText || q.caseletTextHi ||
        q.options?.length || q.optionsHi?.length ||
        q.statements?.length || q.statementsHi?.length ||
        q.listA?.length || q.listAHi?.length ||
        q.items?.length || q.itemsHi?.length ||
        q.questions?.length
      );
      if (hasContent) translatableCount++;
    });

    if (!result.summary) result.summary = {};
    result.summary.detectedLanguage = detectedLang;
    result.summary.translatableQuestions = translatableCount;
    result.summary.willTranslateTo = detectedLang === 'hi' ? 'en' : detectedLang === 'en' ? 'hi' : 'none';

    // ═══ Show normalized values in validation response ═══
    result.summary.normalizedShift = normalizeShift(data.shift);
    result.summary.normalizedSession = normalizeSession(data.session);
    result.summary.normalizedYear = normalizeYear(data.year);

    res.json({ success: true, validation: result });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 2. IMPORT PYQ DATA — FIXED: Single translation pass only
// ════════════════════════════════════════════════════════════════
const importPYQData = async (req, res, next) => {
  try {
    const { translateEnabled = true, ...data } = req.body;

    // ═══ CRITICAL FIX: Normalize shift, session, year BEFORE anything ═══
    const rawShift = data.shift;
    const rawSession = data.session;
    data.shift = normalizeShift(data.shift);
    data.session = normalizeSession(data.session);
    data.year = normalizeYear(data.year);

    console.log(`[PYQ Import] Starting import: ${data.year} ${data.session} shift=${data.shift}`);
    console.log(`[PYQ Import] Raw values: shift="${rawShift}" → "${data.shift}", session="${rawSession}" → "${data.session}"`);
    console.log(`[PYQ Import] Questions in input: ${(data.questions || data.questionTopicMap || []).length}`);

    // Validate
    const validation = pyqAnalyzer.validateImportData(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Normalize
    let normalized = pyqAnalyzer.normalizeImportData(data);

    // ═══ CRITICAL: Re-apply normalization after pyqAnalyzer (it might reset values) ═══
    normalized.shift = normalizeShift(normalized.shift || data.shift);
    normalized.session = normalizeSession(normalized.session || data.session);
    normalized.year = normalizeYear(normalized.year || data.year);

    console.log(`[PYQ Import] After normalize: ${normalized.questionTopicMap?.length} questions, shift=${normalized.shift}`);

    // Debug: check content of first few questions
    const withContent = normalized.questionTopicMap?.filter(q => q.hasContent).length || 0;
    console.log(`[PYQ Import] Questions with content: ${withContent}`);

    // ═══════════════════════════════════════════════════════
    // AUTO-TRANSLATE — SINGLE PASS ONLY (was running twice before)
    // ═══════════════════════════════════════════════════════
    let translationStats = null;
    if (translateEnabled) {
      const translator = getTranslateHelper();
      if (translator) {
        try {
          translator.resetStats();
          const translateResult = await translator.translatePYQData(normalized);
          normalized = translateResult.data;
          translationStats = translateResult.stats;

          // ═══ Re-apply normalization after translation (safety) ═══
          normalized.shift = normalizeShift(normalized.shift || data.shift);
          normalized.session = normalizeSession(normalized.session || data.session);
          normalized.year = normalizeYear(normalized.year || data.year);

          console.log(`[PYQ Import] Translation: ${translationStats.translated} fields, direction: ${translationStats.direction}`);
        } catch (translateErr) {
          console.error('[PYQ Import] Translation error:', translateErr.message);
          translationStats = { error: translateErr.message, translated: 0, failed: 0, direction: 'error' };
        }
      } else {
        console.log('[PYQ Import] Translation skipped — helper not available');
        translationStats = { message: 'Translation service not configured', translated: 0 };
      }
    }
    // ═══ END TRANSLATION — No second pass ═══

    // Debug: verify data after translation
    const sampleQ = normalized.questionTopicMap?.[0];
    if (sampleQ) {
      console.log(`[PYQ Import] Sample Q1 after translate:`, {
        qNo: sampleQ.qNo,
        type: sampleQ.type,
        hasQuestionHi: !!sampleQ.questionTextHi,
        hasQuestionEn: !!sampleQ.questionTextEn,
        hasOptionsHi: sampleQ.optionsHi?.length || 0,
        hasOptionsEn: sampleQ.optionsEn?.length || 0,
        hasContent: sampleQ.hasContent
      });
    }

    // ═══════════════════════════════════════════════════════
    // SAVE — Use delete + create for reliability
    // ═══════════════════════════════════════════════════════
    const filter = {
      year: normalized.year,
      session: normalized.session,
      shift: normalized.shift,
      paper: normalized.paper
    };

    console.log(`[PYQ Import] Looking for existing with filter:`, JSON.stringify(filter));

    const existing = await PYQAnalysis.findOne(filter);
    let doc;
    let isUpdate = false;

    if (existing) {
      // DELETE old document and CREATE fresh
      console.log(`[PYQ Import] Existing doc found (${existing._id}), replacing...`);
      console.log(`[PYQ Import] Existing: year=${existing.year}, session=${existing.session}, shift=${existing.shift}`);
      await PYQAnalysis.deleteOne({ _id: existing._id });
      doc = await PYQAnalysis.create(normalized);
      isUpdate = true;
    } else {
      console.log(`[PYQ Import] No existing doc found, creating new...`);
      doc = await PYQAnalysis.create(normalized);
    }

    // Verify save
    const saved = await PYQAnalysis.findById(doc._id).lean();
    const savedQCount = saved?.questionTopicMap?.length || 0;
    const savedWithContent = saved?.questionTopicMap?.filter(q => q.hasContent)?.length || 0;

    console.log(`[PYQ Import] ✅ Saved: ${savedQCount} questions, ${savedWithContent} with content, ID: ${doc._id}`);
    console.log(`[PYQ Import] ✅ Label: ${doc.displayLabel}, shift: ${doc.shift}`);

    // Verify a sample question was saved correctly
    if (saved?.questionTopicMap?.[0]) {
      const sq = saved.questionTopicMap[0];
      console.log(`[PYQ Import] Verify Q1 in DB:`, {
        qNo: sq.qNo,
        type: sq.type,
        questionTextHi: sq.questionTextHi?.substring(0, 50) || '(empty)',
        questionTextEn: sq.questionTextEn?.substring(0, 50) || '(empty)',
        optionsHi: sq.optionsHi?.length || 0,
        optionsEn: sq.optionsEn?.length || 0,
        hasContent: sq.hasContent
      });
    }

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? `Updated: ${doc.displayLabel}` : `Imported: ${doc.displayLabel}`,
      data: {
        id: doc._id,
        displayLabel: doc.displayLabel,
        totalQuestions: savedQCount,
        questionsWithContent: savedWithContent,
        topicsMapped: savedQCount,
        topTopics: doc.topTopics?.length || 0,
        concepts: doc.conceptsTracked?.length || 0,
        isUpdate,
        normalized: {
          shift: normalized.shift,
          session: normalized.session,
          year: normalized.year,
          rawShift: rawShift,
          rawSession: rawSession
        },
        translation: translationStats
      }
    });
  } catch (error) {
    console.error('[PYQ Import] ERROR:', error.message);
    console.error('[PYQ Import] Stack:', error.stack?.substring(0, 500));
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This year/session/shift already exists. Import again to update.'
      });
    }
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 3. GET ALL PYQ DATA
// ════════════════════════════════════════════════════════════════
const getAllPYQData = async (req, res, next) => {
  try {
    const { paper, year } = req.query;
    const filter = { isActive: true };
    if (paper) filter.paper = paper;
    if (year) filter.year = year;

    const data = await PYQAnalysis.find(filter)
      .sort({ year: -1, session: 1, shift: 1 })
      .select('-questionTopicMap')
      .lean();

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 4. GET PYQ DATA BY ID
// ════════════════════════════════════════════════════════════════
const getPYQDataById = async (req, res, next) => {
  try {
    const doc = await PYQAnalysis.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 5. UPDATE PYQ DATA
// ════════════════════════════════════════════════════════════════
const updatePYQData = async (req, res, next) => {
  try {
    const updateData = { ...req.body, updatedAt: new Date() };

    // Normalize if shift/session provided
    if (updateData.shift) updateData.shift = normalizeShift(updateData.shift);
    if (updateData.session) updateData.session = normalizeSession(updateData.session);

    const doc = await PYQAnalysis.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Updated', data: doc });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 6. DELETE PYQ DATA
// ════════════════════════════════════════════════════════════════
const deletePYQData = async (req, res, next) => {
  try {
    const doc = await PYQAnalysis.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: `Deleted: ${doc.displayLabel}` });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 7. GET AVAILABLE YEARS
// ════════════════════════════════════════════════════════════════
const getAvailableYears = async (req, res, next) => {
  try {
    const { paper } = req.query;
    const years = await PYQAnalysis.getAvailableYears(paper || null);
    res.json({ success: true, data: years });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 8. OVERALL STATS
// ════════════════════════════════════════════════════════════════
const getOverallStats = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allData = await PYQAnalysis.find({ paper, isActive: true }).lean();

    if (allData.length === 0) {
      return res.json({
        success: true,
        data: {
          totalPapers: 0, totalQuestionsMapped: 0,
          yearsCovered: [], uniqueTopics: 0, totalConcepts: 0, papers: []
        }
      });
    }

    const yearSet = new Set();
    let totalQ = 0, totalConcepts = 0;
    const uniqueTopics = new Set();

    allData.forEach(d => {
      yearSet.add(d.year);
      totalQ += d.questionTopicMap?.length || 0;
      totalConcepts += d.conceptsTracked?.length || 0;
      (d.questionTopicMap || []).forEach(q => {
        uniqueTopics.add(`${q.unitId}|${q.chapter}|${q.topic}`);
      });
    });

    res.json({
      success: true,
      data: {
        totalPapers: allData.length,
        totalQuestionsMapped: totalQ,
        yearsCovered: Array.from(yearSet).sort(),
        uniqueTopics: uniqueTopics.size,
        totalConcepts,
        papers: allData.map(d => ({
          id: d._id,
          label: d.displayLabel,
          year: d.year,
          session: d.session,
          shift: d.shift,
          totalQuestions: d.overview?.totalQuestions || 0,
          topicsMapped: d.questionTopicMap?.length || 0
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 9. MULTI-YEAR ANALYSIS
// ════════════════════════════════════════════════════════════════
const getMultiYearAnalysis = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allData = await PYQAnalysis.getAllForPaper(paper);

    if (allData.length === 0) {
      return res.json({ success: true, data: { years: [], unitTrends: [], typeTrends: [] } });
    }

    const years = allData.map(d => ({
      year: d.year, session: d.session, shift: d.shift, label: d.displayLabel
    }));

    const unitTrends = {};
    const typeTrends = {};

    allData.forEach(d => {
      const yk = `${d.year}_${d.session}${d.shift !== 'none' ? '_' + d.shift : ''}`;

      (d.unitWeightage || []).forEach(u => {
        if (!unitTrends[u.unitId]) {
          unitTrends[u.unitId] = { unitId: u.unitId, unitName: u.unitName, yearData: {} };
        }
        unitTrends[u.unitId].yearData[yk] = {
          questionCount: u.questionCount, percentage: u.percentage,
          priority: u.priority, marks: u.marks
        };
      });

      (d.questionTypeBreakdown || []).forEach(t => {
        if (!typeTrends[t.type]) {
          typeTrends[t.type] = { type: t.type, label: t.label, yearData: {} };
        }
        typeTrends[t.type].yearData[`${d.year}_${d.session}`] = {
          count: t.count, percentage: t.percentage
        };
      });
    });

    res.json({
      success: true,
      data: {
        years,
        unitTrends: Object.values(unitTrends),
        typeTrends: Object.values(typeTrends),
        totalPapers: allData.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 10. TOPIC FREQUENCY
// ════════════════════════════════════════════════════════════════
const getTopicFrequency = async (req, res, next) => {
  try {
    const { paper = 'paper2', level = 'chapter' } = req.query;
    const allData = await PYQAnalysis.getAllForPaper(paper);

    if (allData.length === 0) {
      return res.json({ success: true, data: { topics: [], years: [] } });
    }

    const yearLabels = allData.map(d => d.displayLabel);
    const topicMap = {};

    allData.forEach((d, dIdx) => {
      (d.questionTopicMap || []).forEach(q => {
        const key = level === 'topic'
          ? `${q.unitId}|${q.chapter}|${q.topic}`
          : `${q.unitId}|${q.chapter}`;

        if (!topicMap[key]) {
          topicMap[key] = {
            unitId: q.unitId, unitName: q.unitName || '', chapter: q.chapter || '',
            topic: level === 'topic' ? (q.topic || '') : '',
            yearCounts: new Array(allData.length).fill(0),
            totalCount: 0, yearsAppeared: new Set(),
            types: new Set(), difficulties: []
          };
        }

        topicMap[key].yearCounts[dIdx]++;
        topicMap[key].totalCount++;
        topicMap[key].yearsAppeared.add(d.year);
        if (q.type) topicMap[key].types.add(q.type);
        if (q.difficulty) topicMap[key].difficulties.push(q.difficulty);
      });
    });

    const topics = Object.values(topicMap).map(t => ({
      unitId: t.unitId, unitName: t.unitName, chapter: t.chapter, topic: t.topic,
      yearCounts: t.yearCounts, totalCount: t.totalCount,
      yearsAppeared: t.yearsAppeared.size, totalYears: allData.length,
      trend: pyqAnalyzer.calculateTrend(t.yearCounts),
      types: Array.from(t.types),
      avgDifficulty: pyqAnalyzer.avgDifficulty(t.difficulties),
      importanceScore: pyqAnalyzer.calcImportanceScore(t.totalCount, t.yearsAppeared.size, allData.length)
    }));

    topics.sort((a, b) => b.importanceScore - a.importanceScore);

    res.json({
      success: true,
      data: { topics, years: yearLabels, totalPapers: allData.length, level }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 11. PREPARATION GAPS
// ════════════════════════════════════════════════════════════════
const getPreparationGaps = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allPYQ = await PYQAnalysis.getAllForPaper(paper);

    if (allPYQ.length === 0) {
      return res.json({
        success: true,
        data: {
          gaps: [],
          summary: { critical: 0, weak: 0, good: 0, mastered: 0, notStarted: 0 }
        }
      });
    }

    const pyqTopics = {};
    allPYQ.forEach(d => {
      (d.questionTopicMap || []).forEach(q => {
        const key = `${q.unitId}|${q.chapter}`;
        if (!pyqTopics[key]) {
          pyqTopics[key] = {
            unitId: q.unitId, unitName: q.unitName || '', chapter: q.chapter || '',
            totalAsked: 0, yearsSet: new Set(), topics: new Set(), importanceSum: 0
          };
        }
        pyqTopics[key].totalAsked++;
        pyqTopics[key].yearsSet.add(d.year);
        if (q.topic) pyqTopics[key].topics.add(q.topic);
        pyqTopics[key].importanceSum += (q.importance || 3);
      });
    });

    const userPerf = await pyqAnalyzer.getUserPerformanceByUnit(paper);

    const gaps = [];
    for (const [, pyq] of Object.entries(pyqTopics)) {
      const importanceScore = pyqAnalyzer.calcImportanceScore(
        pyq.totalAsked, pyq.yearsSet.size, allPYQ.length
      );
      const userMatch = pyqAnalyzer.findUserPerformanceMatch(pyq.unitId, pyq.chapter, userPerf);
      const yourAccuracy = userMatch ? userMatch.accuracy : 0;
      const yourAttempted = userMatch ? userMatch.total : 0;
      const yourCorrect = userMatch ? userMatch.correct : 0;
      const gapScore = Math.max(0, importanceScore - yourAccuracy);

      let status;
      if (yourAttempted === 0) status = 'not_started';
      else if (yourAccuracy >= 80 && importanceScore <= 60) status = 'mastered';
      else if (yourAccuracy >= 70) status = 'good';
      else if (importanceScore >= 60 && yourAccuracy < 50) status = 'critical';
      else if (yourAccuracy < 60) status = 'weak';
      else status = 'good';

      gaps.push({
        unitId: pyq.unitId, unitName: pyq.unitName, chapter: pyq.chapter,
        topics: Array.from(pyq.topics),
        pyqImportance: Math.round(importanceScore),
        pyqAppearances: pyq.totalAsked,
        yearsAppeared: Array.from(pyq.yearsSet).sort(),
        avgImportance: Math.round(pyq.importanceSum / pyq.totalAsked),
        yourAccuracy: Math.round(yourAccuracy), yourAttempted, yourCorrect,
        gapScore: Math.round(gapScore), status,
        recommendation: pyqAnalyzer.getRecommendation(status)
      });
    }

    const statusOrder = { critical: 0, weak: 1, not_started: 2, good: 3, mastered: 4 };
    gaps.sort((a, b) => {
      const so = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
      return so !== 0 ? so : b.gapScore - a.gapScore;
    });

    const summary = { critical: 0, weak: 0, good: 0, mastered: 0, notStarted: 0 };
    gaps.forEach(g => {
      if (g.status === 'critical') summary.critical++;
      else if (g.status === 'weak') summary.weak++;
      else if (g.status === 'good') summary.good++;
      else if (g.status === 'mastered') summary.mastered++;
      else if (g.status === 'not_started') summary.notStarted++;
    });

    res.json({
      success: true,
      data: {
        gaps, summary, totalTopics: gaps.length,
        overallReadiness: pyqAnalyzer.calcOverallReadiness(gaps)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 12. PREDICTIONS
// ════════════════════════════════════════════════════════════════
const getPredictions = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allPYQ = await PYQAnalysis.getAllForPaper(paper);

    if (allPYQ.length < 2) {
      return res.json({
        success: true,
        data: { message: 'Need at least 2 years of data for predictions', predictions: [] }
      });
    }

    const topicMap = {};
    allPYQ.forEach((d, dIdx) => {
      (d.questionTopicMap || []).forEach(q => {
        const key = `${q.unitId}|${q.chapter}`;
        if (!topicMap[key]) {
          topicMap[key] = {
            unitId: q.unitId, unitName: q.unitName, chapter: q.chapter,
            topics: new Set(),
            yearCounts: new Array(allPYQ.length).fill(0),
            totalCount: 0
          };
        }
        topicMap[key].yearCounts[dIdx]++;
        topicMap[key].totalCount++;
        if (q.topic) topicMap[key].topics.add(q.topic);
      });
    });

    const predictions = Object.values(topicMap).map(t => {
      const trend = pyqAnalyzer.calculateTrend(t.yearCounts);
      const importanceScore = pyqAnalyzer.calcImportanceScore(
        t.totalCount, t.yearCounts.filter(c => c > 0).length, allPYQ.length
      );

      let likelihood;
      if (trend === 'increasing' && importanceScore >= 70) likelihood = 'very_likely';
      else if (importanceScore >= 60 || trend === 'increasing') likelihood = 'likely';
      else if (importanceScore >= 30) likelihood = 'possible';
      else likelihood = 'unlikely';

      return {
        unitId: t.unitId, unitName: t.unitName, chapter: t.chapter,
        topics: Array.from(t.topics),
        importanceScore: Math.round(importanceScore),
        trend, likelihood,
        yearCounts: t.yearCounts,
        avgQPerYear: Math.round((t.totalCount / allPYQ.length) * 10) / 10
      };
    });

    const likelihoodOrder = { very_likely: 0, likely: 1, possible: 2, unlikely: 3 };
    predictions.sort((a, b) => {
      const lo = (likelihoodOrder[a.likelihood] || 4) - (likelihoodOrder[b.likelihood] || 4);
      return lo !== 0 ? lo : b.importanceScore - a.importanceScore;
    });

    res.json({
      success: true,
      data: {
        predictions,
        basedOnYears: allPYQ.map(d => d.displayLabel),
        totalYears: allPYQ.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 13. UNIT COMPARISON
// ════════════════════════════════════════════════════════════════
const getUnitComparison = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allPYQ = await PYQAnalysis.getAllForPaper(paper);

    const unitMap = {};
    allPYQ.forEach(d => {
      (d.unitWeightage || []).forEach(u => {
        if (!unitMap[u.unitId]) {
          unitMap[u.unitId] = {
            unitId: u.unitId, unitName: u.unitName,
            unitNameHi: u.unitNameHi, yearData: []
          };
        }
        unitMap[u.unitId].yearData.push({
          year: d.year, session: d.session, shift: d.shift,
          label: d.displayLabel,
          questionCount: u.questionCount, marks: u.marks,
          percentage: u.percentage, priority: u.priority,
          roiScore: u.roiScore
        });
      });
    });

    const units = Object.values(unitMap).map(u => {
      const avgQ = u.yearData.reduce((s, d) => s + d.questionCount, 0) / u.yearData.length;
      const avgPct = u.yearData.reduce((s, d) => s + (d.percentage || 0), 0) / u.yearData.length;
      return {
        ...u,
        avgQuestions: Math.round(avgQ * 10) / 10,
        avgPercentage: Math.round(avgPct * 10) / 10
      };
    });

    units.sort((a, b) => b.avgPercentage - a.avgPercentage);

    res.json({ success: true, data: { units, totalPapers: allPYQ.length } });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 14. QUESTION TYPE EVOLUTION
// ════════════════════════════════════════════════════════════════
const getQuestionTypeEvolution = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allPYQ = await PYQAnalysis.getAllForPaper(paper);

    const typeMap = {};
    const yearLabels = allPYQ.map(d => d.displayLabel);

    allPYQ.forEach((d, dIdx) => {
      (d.questionTypeBreakdown || []).forEach(t => {
        if (!typeMap[t.type]) {
          typeMap[t.type] = {
            type: t.type, label: t.label || t.type,
            yearCounts: new Array(allPYQ.length).fill(0),
            yearPercentages: new Array(allPYQ.length).fill(0)
          };
        }
        typeMap[t.type].yearCounts[dIdx] = t.count;
        typeMap[t.type].yearPercentages[dIdx] = t.percentage;
      });
    });

    res.json({
      success: true,
      data: { types: Object.values(typeMap), yearLabels, totalPapers: allPYQ.length }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 15. GET PYQ QUESTIONS FOR CREATE TEST
// ════════════════════════════════════════════════════════════════
const getPYQQuestionsForTest = async (req, res, next) => {
  try {
    const {
      year, session, paper = 'paper2',
      unitId, chapter, topic, type, hasContent, shift
    } = req.query;

    const filter = { isActive: true };
    if (paper) filter.paper = paper;
    if (year) filter.year = year;
    if (session) filter.session = normalizeSession(session);
    if (shift) filter.shift = normalizeShift(shift);

    const pyqDocs = await PYQAnalysis.find(filter).lean();

    if (pyqDocs.length === 0) {
      return res.json({ success: true, data: [], count: 0 });
    }

    const allQuestions = [];

    for (const doc of pyqDocs) {
      const qtm = doc.questionTopicMap || [];

      for (const q of qtm) {
        if (unitId && q.unitId !== unitId) continue;
        if (chapter && q.chapter && !q.chapter.toLowerCase().includes(chapter.toLowerCase())) continue;
        if (topic && q.topic && !q.topic.toLowerCase().includes(topic.toLowerCase())) continue;
        if (type && q.type !== type) continue;
        if (hasContent === 'true' && !q.hasContent) continue;

        const qType = mapType(q.type);

        // ═══ FIX: For passage type, extract from subQuestions ═══
        let questionHi = q.questionTextHi || q.questionText || '';
        let questionEn = q.questionTextEn || q.questionText || '';
        let optionsHi = q.optionsHi || q.options || [];
        let optionsEn = q.optionsEn || q.options || [];
        let correctAns = q.correctAnswer ?? q.correct ?? -1;
        let explHi = q.explanationHi || q.explanation || '';
        let explEn = q.explanationEn || q.explanation || '';

        if ((qType === 'passage_based' || q.type === 'passage') && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
          const sq = q.subQuestions[0];
          if (!questionHi && !questionEn) {
            questionHi = sq.questionTextHi || sq.questionText || questionHi;
            questionEn = sq.questionTextEn || sq.questionText || questionEn;
          }
          if (optionsHi.length === 0) {
            optionsHi = sq.optionsHi || sq.options || [];
          }
          if (optionsEn.length === 0) {
            optionsEn = sq.optionsEn || sq.options || [];
          }
          if (correctAns === -1 || correctAns === null || correctAns === undefined) {
            correctAns = sq.correctAnswer ?? sq.correct ?? -1;
          }
          if (!explHi) explHi = sq.explanationHi || sq.explanation || '';
          if (!explEn) explEn = sq.explanationEn || sq.explanation || '';
        }

        allQuestions.push({
          _id: `pyq_${doc._id}_${q.qNo}`,
          questionNumber: q.qNo,
          questionType: qType,
          question: { hi: questionHi, en: questionEn },
          options: { hi: optionsHi, en: optionsEn },
          correctAnswer: correctAns,
          explanation: { hi: explHi, en: explEn },
          passageContent: (qType === 'passage_based' || q.type === 'passage') ? {
            hi: q.passageHi || q.passage || '',
            en: q.passageEn || q.passage || ''
          } : undefined,
          passageTitle: q.passageTitle || '',
          hasPassage: !!(q.passageHi || q.passage || q.passageEn),
          subQuestions: q.subQuestions || [],
          paper: doc.paper,
          unit: q.unitName || q.unitId || '',
          chapter: q.chapter || '',
          topic: q.topic || '',
          subtopic: q.subtopic || '',
          difficulty: q.difficulty || 'medium',
          isPYQ: true,
          year: doc.year,
          pyqSession: doc.session,
          pyqShift: doc.shift,
          pyqQuestionNumber: q.qNo,
          source: `PYQ ${doc.year} ${doc.session}${doc.shift !== 'none' ? ' ' + doc.shift : ''}`,
          hasContent: q.hasContent,
          importance: q.importance || 3,
          keyTerms: q.keyTerms || [],
          _pyqDocId: doc._id,
          _pyqLabel: doc.displayLabel,
          createdAt: doc.importedAt || doc.createdAt
        });
      }
    }

    allQuestions.sort((a, b) => {
      if (a.year !== b.year) return (b.year || '').localeCompare(a.year || '');
      return (a.questionNumber || 0) - (b.questionNumber || 0);
    });

    res.json({
      success: true,
      data: allQuestions,
      count: allQuestions.length,
      sources: pyqDocs.map(d => ({
        id: d._id, label: d.displayLabel,
        year: d.year, session: d.session, shift: d.shift,
        totalQuestions: d.questionTopicMap?.length || 0
      }))
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 16. GET PYQ FILTERS
// ════════════════════════════════════════════════════════════════
const getPYQFilters = async (req, res, next) => {
  try {
    const { paper = 'paper2' } = req.query;
    const allData = await PYQAnalysis.find({ paper, isActive: true }).lean();

    const years = new Set();
    const sessions = new Set();
    const shifts = new Set();
    const units = {};
    const chapters = {};
    const topics = {};
    const types = {};

    allData.forEach(d => {
      years.add(d.year);
      sessions.add(d.session);
      if (d.shift && d.shift !== 'none') shifts.add(d.shift);

      const unitNameMap = {};
      (d.unitWeightage || []).forEach(uw => {
        if (uw.unitId && uw.unitName) {
          unitNameMap[uw.unitId] = uw.unitName;
        }
      });

      (d.questionTopicMap || []).forEach(q => {
        if (q.unitId) {
          if (!units[q.unitId]) {
            const bestName = q.unitName || unitNameMap[q.unitId] || q.unitId;
            units[q.unitId] = {
              id: q.unitId, name: bestName,
              nameHi: q.unitNameHi || bestName,
              count: 0, chapters: new Set(), topics: new Set()
            };
          } else {
            const currentName = units[q.unitId].name;
            const newName = q.unitName || unitNameMap[q.unitId];
            if (newName && newName.length > currentName.length) {
              units[q.unitId].name = newName;
            }
          }
          units[q.unitId].count++;
          if (q.chapter) units[q.unitId].chapters.add(q.chapter);
          if (q.topic) units[q.unitId].topics.add(q.topic);
        }

        if (q.chapter) {
          const ck = `${q.unitId || 'unknown'}|${q.chapter}`;
          if (!chapters[ck]) {
            chapters[ck] = {
              unitId: q.unitId || '', chapter: q.chapter,
              chapterHi: q.chapterHi || q.chapter,
              count: 0, topics: new Set()
            };
          }
          chapters[ck].count++;
          if (q.topic) chapters[ck].topics.add(q.topic);
        }

        if (q.topic) {
          const tk = `${q.unitId || ''}|${q.chapter || ''}|${q.topic}`;
          if (!topics[tk]) {
            topics[tk] = {
              unitId: q.unitId || '', chapter: q.chapter || '',
              topic: q.topic, topicHi: q.topicHi || q.topic,
              count: 0
            };
          }
          topics[tk].count++;
        }

        if (q.type) {
          if (!types[q.type]) types[q.type] = { type: q.type, count: 0 };
          types[q.type].count++;
        }
      });
    });

    const unitsList = Object.values(units).map(u => ({
      id: u.id, name: u.name, nameHi: u.nameHi,
      count: u.count, chapterCount: u.chapters.size,
      topicCount: u.topics.size
    })).sort((a, b) => {
      const numA = parseInt((a.id.match(/\d+/) || ['999'])[0]);
      const numB = parseInt((b.id.match(/\d+/) || ['999'])[0]);
      return numA - numB;
    });

    const chaptersList = Object.values(chapters).map(c => ({
      unitId: c.unitId, chapter: c.chapter, chapterHi: c.chapterHi,
      count: c.count, topicCount: c.topics.size
    })).sort((a, b) => b.count - a.count);

    const topicsList = Object.values(topics).map(t => ({
      unitId: t.unitId, chapter: t.chapter, topic: t.topic,
      topicHi: t.topicHi, count: t.count
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        years: Array.from(years).sort().reverse(),
        sessions: Array.from(sessions),
        shifts: Array.from(shifts),
        units: unitsList,
        chapters: chaptersList,
        topics: topicsList,
        types: Object.values(types).sort((a, b) => b.count - a.count),
        totalPapers: allData.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// 17. IMPORT PYQ QUESTIONS TO QUESTION BANK
// ════════════════════════════════════════════════════════════════
const importPYQToQuestionBank = async (req, res, next) => {
  try {
    const { pyqDocId, questionNumbers, all = false } = req.body;

    if (!pyqDocId) {
      return res.status(400).json({ success: false, message: 'pyqDocId required' });
    }

    const pyqDoc = await PYQAnalysis.findById(pyqDocId).lean();
    if (!pyqDoc) {
      return res.status(404).json({ success: false, message: 'PYQ data not found' });
    }

    let questionsToImport = (pyqDoc.questionTopicMap || []).filter(q => q.hasContent);

    if (!all && Array.isArray(questionNumbers) && questionNumbers.length > 0) {
      questionsToImport = questionsToImport.filter(q => questionNumbers.includes(q.qNo));
    }

    if (questionsToImport.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions with content to import' });
    }

    const Passage = require('../models/Passage');
    let imported = 0, skipped = 0;
    const errors = [];
    const passageCache = new Map();

    // Normalize shift/session for question bank entries
    const safeSession = normalizeSession(pyqDoc.session);
    const safeShift = normalizeShift(pyqDoc.shift);

    for (const pq of questionsToImport) {
      try {
        const existing = await Question.findOne({
          isPYQ: true,
          year: pyqDoc.year,
          pyqSession: safeSession,
          pyqQuestionNumber: pq.qNo,
          paper: pyqDoc.paper
        });

        if (existing) {
          skipped++;
          continue;
        }

        const qType = mapType(pq.type);

        let questionHi, questionEn, optHi, optEn, correctAns, explHi, explEn;

        if ((qType === 'passage_based' || pq.type === 'passage') && Array.isArray(pq.subQuestions) && pq.subQuestions.length > 0) {
          const sq = pq.subQuestions[0];
          questionHi = sq.questionTextHi || sq.questionText || pq.questionTextHi || '';
          questionEn = sq.questionTextEn || sq.questionText || pq.questionTextEn || '';
          optHi = sq.optionsHi || sq.options || pq.optionsHi || [];
          optEn = sq.optionsEn || sq.options || pq.optionsEn || [];
          correctAns = sq.correctAnswer ?? sq.correct ?? pq.correctAnswer ?? 0;
          explHi = sq.explanationHi || sq.explanation || pq.explanationHi || '';
          explEn = sq.explanationEn || sq.explanation || pq.explanationEn || '';
        } else {
          questionHi = pq.questionTextHi || pq.questionText || '';
          questionEn = pq.questionTextEn || pq.questionText || '';
          optHi = pq.optionsHi || pq.options || [];
          optEn = pq.optionsEn || pq.options || [];
          correctAns = pq.correctAnswer ?? pq.correct ?? 0;
          explHi = pq.explanationHi || pq.explanation || '';
          explEn = pq.explanationEn || pq.explanation || '';
        }

        let passageId = null;
        if (qType === 'passage_based' || pq.type === 'passage') {
          const passageHi = pq.passageHi || pq.passage || '';
          const passageEn = pq.passageEn || pq.passage || '';
          const passageKey = (passageHi || passageEn).substring(0, 200);

          if (passageKey.length > 10) {
            if (passageCache.has(passageKey)) {
              passageId = passageCache.get(passageKey);
            } else {
              const searchField = passageHi ? 'content.hi' : 'content.en';
              const searchValue = passageHi || passageEn;
              const existingP = await Passage.findOne({
                [searchField]: searchValue,
                paper: pyqDoc.paper
              }).select('_id').lean();

              if (existingP) {
                passageId = existingP._id;
              } else {
                const newP = await Passage.create({
                  content: { hi: passageHi, en: passageEn },
                  title: pq.passageTitle || `PYQ ${pyqDoc.year} Passage`,
                  paper: pyqDoc.paper,
                  unit: pq.unitName || pq.unitId || '',
                  chapter: pq.chapter || '',
                  topic: pq.topic || '',
                  source: `PYQ ${pyqDoc.year} ${safeSession}`
                });
                passageId = newP._id;
              }
              passageCache.set(passageKey, passageId);
            }
          }
        }

        const questionData = {
          questionType: qType,
          question: { hi: questionHi, en: questionEn },
          options: { hi: optHi, en: optEn },
          correctAnswer: correctAns,
          explanation: { hi: explHi, en: explEn },
          paper: pyqDoc.paper,
          unit: pq.unitName || pq.unitId || '',
          chapter: pq.chapter || '',
          topic: pq.topic || '',
          subtopic: pq.subtopic || '',
          difficulty: pq.difficulty || 'medium',
          source: `PYQ ${pyqDoc.year} ${safeSession}${safeShift !== 'none' ? ' ' + safeShift : ''}`,
          year: pyqDoc.year,
          isPYQ: true,
          pyqSession: safeSession,
          pyqShift: safeShift,
          pyqQuestionNumber: pq.qNo,
          tags: ['pyq', pyqDoc.year, safeSession, safeShift !== 'none' ? safeShift : null].filter(Boolean)
        };

        if (passageId) questionData.passageId = passageId;

        if (pq.assertionHi || pq.assertion) {
          questionData.assertionReasonData = {
            assertion: { hi: pq.assertionHi || pq.assertion || '', en: pq.assertionEn || '' },
            reason: { hi: pq.reasonHi || pq.reason || '', en: pq.reasonEn || '' }
          };
        }

        if (pq.statementsHi?.length || pq.statements?.length) {
          questionData.statementData = {
            statements: { hi: pq.statementsHi || pq.statements || [], en: pq.statementsEn || [] },
            correctStatements: pq.correctStatements || []
          };
        }

        if (pq.listAHi?.length || pq.listA?.length) {
          questionData.matchData = {
            listA: { hi: pq.listAHi || pq.listA || [], en: pq.listAEn || [] },
            listB: { hi: pq.listBHi || pq.listB || [], en: pq.listBEn || [] },
            correctMatch: pq.correctMatch || []
          };
        }

        if (pq.itemsHi?.length || pq.items?.length) {
          questionData.sequenceData = {
            items: { hi: pq.itemsHi || pq.items || [], en: pq.itemsEn || [] },
            correctOrder: pq.correctOrder || []
          };
        }

        await Question.create(questionData);
        imported++;
      } catch (err) {
        errors.push({ qNo: pq.qNo, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${imported} questions, skipped ${skipped} duplicates`,
      data: { imported, skipped, errors: errors.length, errorDetails: errors.slice(0, 10) }
    });
  } catch (error) {
    next(error);
  }
};

// ════════════════════════════════════════════════════════════════
// DEBUG ENDPOINT
// ════════════════════════════════════════════════════════════════
const debugPYQData = async (req, res, next) => {
  try {
    const docs = await PYQAnalysis.find({ isActive: true })
      .select('year session shift paper displayLabel overview contentStats')
      .lean();

    const details = [];
    for (const doc of docs) {
      const full = await PYQAnalysis.findById(doc._id).lean();
      const qtm = full.questionTopicMap || [];
      const sample = qtm[0] || {};

      details.push({
        id: doc._id,
        label: doc.displayLabel,
        shift: doc.shift,
        session: doc.session,
        overview: doc.overview,
        contentStats: doc.contentStats,
        questionTopicMapLength: qtm.length,
        questionsWithContent: qtm.filter(q => q.hasContent).length,
        sampleQuestion: {
          qNo: sample.qNo, type: sample.type,
          questionTextHi: sample.questionTextHi?.substring(0, 80),
          questionTextEn: sample.questionTextEn?.substring(0, 80),
          optionsHi: sample.optionsHi?.slice(0, 2),
          optionsEn: sample.optionsEn?.slice(0, 2),
          hasContent: sample.hasContent, correctAnswer: sample.correctAnswer
        }
      });
    }

    res.json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validatePYQImport,
  importPYQData,
  getAllPYQData,
  getPYQDataById,
  updatePYQData,
  deletePYQData,
  getAvailableYears,
  getOverallStats,
  getMultiYearAnalysis,
  getTopicFrequency,
  getPreparationGaps,
  getPredictions,
  getUnitComparison,
  getQuestionTypeEvolution,
  getPYQQuestionsForTest,
  getPYQFilters,
  importPYQToQuestionBank,
  debugPYQData
};