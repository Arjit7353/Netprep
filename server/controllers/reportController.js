const QuestionReport = require('../models/QuestionReport');
const Question = require('../models/Question');
const Test = require('../models/Test');
const mongoose = require('mongoose');

const buildSearchIds = (id) => {
  const ids = [id, String(id)];
  try { ids.push(new mongoose.Types.ObjectId(id)); } catch {}
  return ids;
};

const getAffectedTests = async (questionId) => {
  const searchIds = buildSearchIds(questionId);
  return Test.find({
    questions: { $in: searchIds },
    status: { $ne: 'archived' }
  }).select('_id title testType paper totalQuestions').lean();
};

const buildQuestionSnapshot = (question) => {
  if (!question) return {};
  return {
    questionText: question.question || { hi: '', en: '' },
    options: question.options || { hi: [], en: [] },
    correctAnswer: question.correctAnswer,
    questionType: question.questionType,
    paper: question.paper,
    unit: question.unit,
    chapter: question.chapter,
    topic: question.topic
  };
};

// ═══ CREATE REPORT ═══
const createReport = async (req, res, next) => {
  try {
    const {
      questionId, questionSource, testId, attemptId, questionIndex,
      reportType, description, screenshots, suggestedCorrection, reporterName
    } = req.body;

    if (!questionId || !reportType || !description) {
      return res.status(400).json({
        success: false,
        message: 'questionId, reportType, and description are required'
      });
    }

    const existingReport = await QuestionReport.findOne({
      questionId: String(questionId),
      status: { $in: ['pending', 'reviewing', 'in_progress'] }
    });

    if (existingReport) {
      existingReport.subReports.push({
        description,
        screenshots: (screenshots || []).slice(0, 3),
        reporterName: reporterName || 'Anonymous',
        reportType,
        createdAt: new Date()
      });
      existingReport.reportCount += 1;
      if (existingReport.subReports.length > 20) {
        existingReport.subReports = existingReport.subReports.slice(-20);
      }
      await existingReport.save();

      return res.status(200).json({
        success: true,
        message: 'Report added to existing issue',
        data: { reportId: existingReport._id, merged: true, totalReports: existingReport.reportCount }
      });
    }

    let questionSnapshot = {};
    const qSource = questionSource || (String(questionId).startsWith('pyq_') ? 'pyq' : 'bank');

    if (qSource === 'bank') {
      try {
        const q = await Question.findById(questionId).lean();
        if (q) questionSnapshot = buildQuestionSnapshot(q);
      } catch {}
    } else {
      try {
        const match = String(questionId).match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
        if (match) {
          const PYQAnalysis = require('../models/PYQAnalysis');
          const doc = await PYQAnalysis.findById(match[1]).lean();
          if (doc) {
            const qEntry = (doc.questionTopicMap || []).find(q => q.qNo === parseInt(match[2]));
            if (qEntry) {
              questionSnapshot = {
                questionText: { hi: qEntry.questionTextHi || '', en: qEntry.questionTextEn || '' },
                options: { hi: qEntry.optionsHi || [], en: qEntry.optionsEn || [] },
                correctAnswer: qEntry.correctAnswer,
                questionType: qEntry.type || 'mcq',
                paper: doc.paper,
                unit: qEntry.unitName || qEntry.unitId || '',
                chapter: qEntry.chapter || '',
                topic: qEntry.topic || ''
              };
            }
          }
        }
      } catch {}
    }

    const affectedTests = await getAffectedTests(questionId);

    const report = await QuestionReport.create({
      questionId: String(questionId),
      questionSource: qSource,
      testId: testId || null,
      attemptId: attemptId || null,
      questionIndex: questionIndex || null,
      reportType,
      description,
      screenshots: (screenshots || []).slice(0, 5),
      suggestedCorrection: suggestedCorrection || '',
      reporterName: reporterName || 'Anonymous',
      questionSnapshot,
      affectedTests: affectedTests.map(t => t._id),
      affectedTestCount: affectedTests.length
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: { reportId: report._id, priority: report.priority, affectedTests: affectedTests.length }
    });
  } catch (error) {
    next(error);
  }
};

// ═══ GET ALL REPORTS ═══
const getReports = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, status, priority, reportType,
      search, sortBy = 'createdAt', sortOrder = 'desc',
      startDate, endDate
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (reportType) filter.reportType = reportType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { suggestedCorrection: { $regex: search, $options: 'i' } },
        { adminNotes: { $regex: search, $options: 'i' } },
        { reporterName: { $regex: search, $options: 'i' } },
        { 'questionSnapshot.questionText.hi': { $regex: search, $options: 'i' } },
        { 'questionSnapshot.questionText.en': { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      QuestionReport.find(filter)
        .populate('testId', 'title testType paper')
        .populate('duplicateOf', '_id status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      QuestionReport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// ═══ REPORT STATS ═══
const getReportStats = async (req, res, next) => {
  try {
    const [statusCounts, priorityCounts, typeCounts, recentCount] = await Promise.all([
      QuestionReport.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      QuestionReport.aggregate([
        { $match: { status: { $in: ['pending', 'reviewing', 'in_progress'] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      QuestionReport.aggregate([{ $group: { _id: '$reportType', count: { $sum: 1 } } }]),
      QuestionReport.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);

    const topReported = await QuestionReport.aggregate([
      { $match: { status: { $in: ['pending', 'reviewing', 'in_progress'] } } },
      { $group: {
        _id: '$questionId',
        totalReports: { $sum: '$reportCount' },
        latestReport: { $max: '$createdAt' },
        reportTypes: { $addToSet: '$reportType' },
        source: { $first: '$questionSource' }
      }},
      { $sort: { totalReports: -1 } },
      { $limit: 10 }
    ]);

    const byStatus = {};
    statusCounts.forEach(s => { byStatus[s._id] = s.count; });
    const byPriority = {};
    priorityCounts.forEach(p => { byPriority[p._id] = p.count; });
    const byType = {};
    typeCounts.forEach(t => { byType[t._id] = t.count; });

    res.json({
      success: true,
      data: {
        byStatus, byPriority, byType,
        total: Object.values(byStatus).reduce((s, v) => s + v, 0),
        pending: byStatus.pending || 0,
        reviewing: (byStatus.reviewing || 0) + (byStatus.in_progress || 0),
        fixed: byStatus.fixed || 0,
        rejected: byStatus.rejected || 0,
        recentWeek: recentCount,
        topReported
      }
    });
  } catch (error) {
    next(error);
  }
};

// ═══ GET SINGLE REPORT WITH FULL QUESTION + ALL TEST QUESTIONS ═══
const getReportById = async (req, res, next) => {
  try {
    const report = await QuestionReport.findById(req.params.id)
      .populate('testId', 'title testType paper totalQuestions questions')
      .populate('duplicateOf')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // ═══ HELPER: PYQ question को normalize करो ═══
    const normalizePYQEntry = (qEntry, doc, pyqIdStr) => {
      if (!qEntry) return null;

      // question type normalize
      const TYPE_MAP = {
        'simple_mcq': 'mcq', 'mcq': 'mcq', 'multiple_choice': 'mcq',
        'assertion_reason': 'assertion_reason', 'ar': 'assertion_reason',
        'matching': 'match_following', 'match_following': 'match_following',
        'chronology': 'sequence_order', 'sequence_order': 'sequence_order',
        'multi_statement': 'statement_based', 'statement_based': 'statement_based',
        'comprehension': 'passage_based', 'passage_based': 'passage_based',
        'passage': 'passage_based',
      };
      const qType = TYPE_MAP[(qEntry.type || '').toLowerCase()] || 'mcq';

      return {
        _id: pyqIdStr,
        questionNumber: qEntry.qNo,
        questionType: qType,
        // ✅ Standard format — getBilingualText समझेगा
        question: {
          hi: qEntry.questionTextHi || qEntry.questionText || '',
          en: qEntry.questionTextEn || qEntry.questionText || ''
        },
        options: {
          hi: qEntry.optionsHi || qEntry.options || [],
          en: qEntry.optionsEn || qEntry.options || []
        },
        correctAnswer: qEntry.correctAnswer ?? 0,
        explanation: {
          hi: qEntry.explanationHi || qEntry.explanation || '',
          en: qEntry.explanationEn || qEntry.explanation || ''
        },
        // ✅ Type-specific data
        assertionReasonData: (qEntry.assertionHi || qEntry.assertion) ? {
          assertion: {
            hi: qEntry.assertionHi || qEntry.assertion || '',
            en: qEntry.assertionEn || ''
          },
          reason: {
            hi: qEntry.reasonHi || qEntry.reason || '',
            en: qEntry.reasonEn || ''
          }
        } : undefined,
        matchData: (qEntry.listAHi?.length || qEntry.listA?.length) ? {
          listA: {
            hi: qEntry.listAHi || qEntry.listA || [],
            en: qEntry.listAEn || []
          },
          listB: {
            hi: qEntry.listBHi || qEntry.listB || [],
            en: qEntry.listBEn || []
          },
          correctMatch: qEntry.correctMatch || []
        } : undefined,
        statementData: (qEntry.statementsHi?.length || qEntry.statements?.length) ? {
          statements: {
            hi: qEntry.statementsHi || qEntry.statements || [],
            en: qEntry.statementsEn || []
          },
          correctStatements: qEntry.correctStatements || []
        } : undefined,
        sequenceData: (qEntry.itemsHi?.length || qEntry.items?.length) ? {
          items: {
            hi: qEntry.itemsHi || qEntry.items || [],
            en: qEntry.itemsEn || []
          },
          correctOrder: qEntry.correctOrder || []
        } : undefined,
        // Meta
        paper: doc.paper,
        unit: qEntry.unitName || qEntry.unitId || '',
        chapter: qEntry.chapter || '',
        topic: qEntry.topic || '',
        subtopic: qEntry.subtopic || '',
        difficulty: qEntry.difficulty || 'medium',
        source: `PYQ ${doc.year} ${doc.session || ''}`.trim(),
        year: doc.year,
        isPYQ: true,
        pyqSession: doc.session || '',
        pyqLabel: doc.displayLabel,
        _isVirtualPYQ: true
      };
    };

    // ═══ CURRENT QUESTION ═══
    let currentQuestion = null;

    if (report.questionSource === 'bank') {
      try {
        currentQuestion = await Question.findById(report.questionId)
          .populate('passageId')
          .populate('diDataId')
          .lean();
      } catch {}
    } else {
      // PYQ question
      try {
        const match = String(report.questionId).match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
        if (match) {
          const PYQAnalysis = require('../models/PYQAnalysis');
          const doc = await PYQAnalysis.findById(match[1]).lean();
          if (doc) {
            const qEntry = (doc.questionTopicMap || [])
              .find(q => q.qNo === parseInt(match[2]));
            if (qEntry) {
              // ✅ Normalize करो — raw spread नहीं
              currentQuestion = normalizePYQEntry(qEntry, doc, report.questionId);
            }
          }
        }
      } catch (e) {
        console.warn('[Report Detail] PYQ currentQuestion failed:', e.message);
      }
    }

    // ═══ ALL TEST QUESTIONS — Bank + PYQ दोनों ═══
    let testQuestions = [];

    if (report.testId && report.testId.questions) {
      const allQIds = report.testId.questions;

      // Separate bank and PYQ IDs
      const bankIds = [];
      const pyqIds = [];

      allQIds.forEach(q => {
        const idStr = typeof q === 'string' ? q : String(q);
        if (idStr.startsWith('pyq_')) {
          pyqIds.push(idStr); // ✅ PYQ IDs collect करो
        } else {
          try {
            bankIds.push(new mongoose.Types.ObjectId(idStr));
          } catch {}
        }
      });

      // ✅ Bank questions fetch
      let bankQuestions = [];
      if (bankIds.length > 0) {
        try {
          bankQuestions = await Question.find({ _id: { $in: bankIds } })
            .populate('passageId')
            .populate('diDataId')
            .lean();
        } catch (e) {
          console.warn('[Report Detail] Bank questions failed:', e.message);
        }
      }

      // ✅ PYQ questions fetch और normalize
      let pyqQuestions = [];
      if (pyqIds.length > 0) {
        try {
          const PYQAnalysis = require('../models/PYQAnalysis');
          const pyqDocCache = {};

          for (const pyqIdStr of pyqIds) {
            const match = pyqIdStr.match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
            if (!match) continue;

            const docId = match[1];
            const qNo = parseInt(match[2]);

            // Cache से fetch
            if (!pyqDocCache[docId]) {
              pyqDocCache[docId] = await PYQAnalysis.findById(docId).lean();
            }
            const doc = pyqDocCache[docId];
            if (!doc) continue;

            const qEntry = (doc.questionTopicMap || []).find(q => q.qNo === qNo);
            if (!qEntry) continue;

            // ✅ Normalize करो
            const normalized = normalizePYQEntry(qEntry, doc, pyqIdStr);
            if (normalized) pyqQuestions.push(normalized);
          }
        } catch (e) {
          console.warn('[Report Detail] PYQ questions failed:', e.message);
        }
      }

      // ✅ Original order maintain करो
      const bankMap = new Map(bankQuestions.map(q => [q._id.toString(), q]));
      const pyqMap = new Map(pyqQuestions.map(q => [q._id, q]));

      testQuestions = allQIds.map(q => {
        const idStr = typeof q === 'string' ? q : String(q);
        if (idStr.startsWith('pyq_')) {
          return pyqMap.get(idStr) || null;
        } else {
          return bankMap.get(idStr) || null;
        }
      }).filter(Boolean);
    }

    const affectedTests = await getAffectedTests(report.questionId);

    const relatedReports = await QuestionReport.find({
      questionId: report.questionId,
      _id: { $ne: report._id }
    }).select('_id status reportType reportCount createdAt').lean();

    res.json({
      success: true,
      data: {
        ...report,
        currentQuestion,
        affectedTests,
        relatedReports,
        testQuestions
      }
    });
  } catch (error) {
    next(error);
  }
};

// ═══ UPDATE REPORT ═══
const updateReport = async (req, res, next) => {
  try {
    const { status, priority, adminNotes, resolution } = req.body;
    const update = { updatedAt: new Date() };

    if (status) {
      update.status = status;
      if (status === 'fixed') { update.fixedAt = new Date(); update.fixedBy = req.body.fixedBy || 'admin'; }
    }
    if (priority) update.priority = priority;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (resolution !== undefined) update.resolution = resolution;

    const report = await QuestionReport.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, message: 'Report updated', data: report });
  } catch (error) {
    next(error);
  }
};

// ═══ DELETE REPORT ═══
const deleteReport = async (req, res, next) => {
  try {
    const report = await QuestionReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ═══ FIX QUESTION + RE-EVALUATE ATTEMPTS ═══
const fixQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionUpdates, adminNotes, resolution, autoTranslate = true, enableTextMatch = true } = req.body;

    const report = await QuestionReport.findById(id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (!questionUpdates || typeof questionUpdates !== 'object') {
      return res.status(400).json({ success: false, message: 'questionUpdates required' });
    }

    let updatedQuestion = null;
    let testsUpdated = 0;
    let attemptsReEvaluated = 0;
    let answersChanged = 0;

    if (report.questionSource === 'bank') {
      const translateHelper = require('../utils/translateHelper');
      const oldQuestion = await Question.findById(report.questionId).lean();
      if (!oldQuestion) return res.status(404).json({ success: false, message: 'Question not found' });

      if (autoTranslate) {
        try {
          const HINDI_RE = /[\u0900-\u097F]/;
          let srcLang = null;
          if (questionUpdates.question) {
            if (questionUpdates.question.hi && HINDI_RE.test(questionUpdates.question.hi)) srcLang = 'hi';
            else if (questionUpdates.question.en) srcLang = 'en';
          }
          if (srcLang) {
            const merged = { ...oldQuestion, ...questionUpdates };
            await translateHelper.translateQuestion(merged, srcLang);
            if (merged.question) questionUpdates.question = merged.question;
            if (merged.options) { delete merged.options._c; questionUpdates.options = merged.options; }
            if (merged.explanation) questionUpdates.explanation = merged.explanation;
            if (merged.assertionReasonData) questionUpdates.assertionReasonData = merged.assertionReasonData;
            if (merged.matchData) questionUpdates.matchData = merged.matchData;
            if (merged.sequenceData) questionUpdates.sequenceData = merged.sequenceData;
            if (merged.statementData) questionUpdates.statementData = merged.statementData;
          }
        } catch (e) { console.warn('[Fix] Translate failed:', e.message); }
      }

      questionUpdates.updatedAt = new Date();
      updatedQuestion = await Question.findByIdAndUpdate(report.questionId, questionUpdates, { new: true, runValidators: true });

      const searchIds = buildSearchIds(report.questionId);
      const syncResult = await Test.updateMany(
        { questions: { $in: searchIds }, status: { $ne: 'archived' } },
        { $set: { updatedAt: new Date() } }
      );
      testsUpdated = syncResult.modifiedCount;

      // Re-evaluate attempts
      const correctAnswerChanged = questionUpdates.correctAnswer !== undefined && questionUpdates.correctAnswer !== oldQuestion.correctAnswer;
      const optionsChanged = questionUpdates.options !== undefined;

      if (correctAnswerChanged || optionsChanged) {
        const TestAttempt = require('../models/TestAttempt');
        const qIdStr = String(report.questionId);
        const attempts = await TestAttempt.find({ status: 'completed', 'answers.questionId': { $in: searchIds } });

        for (const attempt of attempts) {
          let changed = false;
          for (const answer of attempt.answers) {
            if (String(answer.questionId) !== qIdStr) continue;
            const oldIsCorrect = answer.isCorrect;
            const newCorrectAnswer = questionUpdates.correctAnswer !== undefined ? questionUpdates.correctAnswer : answer.correctAnswer;
            answer.correctAnswer = newCorrectAnswer;

            if (answer.selectedAnswer === -1) {
              answer.isCorrect = false;
            } else {
              answer.isCorrect = answer.selectedAnswer === newCorrectAnswer;
            }

            if (enableTextMatch && !answer.isCorrect && answer.selectedAnswer !== -1 && optionsChanged) {
              const oldOpts = oldQuestion.options || {};
              const newOpts = questionUpdates.options || oldQuestion.options || {};
              const studentHi = (oldOpts.hi || [])[answer.selectedAnswer] || '';
              const studentEn = (oldOpts.en || [])[answer.selectedAnswer] || '';
              const correctHi = (newOpts.hi || [])[newCorrectAnswer] || '';
              const correctEn = (newOpts.en || [])[newCorrectAnswer] || '';
              const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

              if ((studentHi && correctHi && norm(studentHi) === norm(correctHi)) ||
                  (studentEn && correctEn && norm(studentEn) === norm(correctEn))) {
                answer.isCorrect = true;
              }
            }

            if (oldIsCorrect !== answer.isCorrect) { changed = true; answersChanged++; }
          }

          if (changed) {
            let cc = 0, wc = 0, sc = 0;
            for (const a of attempt.answers) {
              if (a.selectedAnswer === -1) sc++;
              else if (a.isCorrect) cc++;
              else wc++;
            }
            const mpq = attempt.testSnapshot?.marksPerQuestion || 2;
            const nm = attempt.testSnapshot?.negativeMarking ? (attempt.testSnapshot?.negativeMarks || 0) : 0;
            attempt.correctCount = cc;
            attempt.wrongCount = wc;
            attempt.skippedCount = sc;
            attempt.score = Math.max(0, (cc * mpq) - (wc * nm));
            const att = cc + wc;
            attempt.accuracy = att > 0 ? Math.round((cc / att) * 100) : 0;
            const tm = attempt.totalMarks || (attempt.answers.length * mpq);
            attempt.percentage = tm > 0 ? Math.round((attempt.score / tm) * 100) : 0;
            await attempt.save();
            attemptsReEvaluated++;
          }
        }
      }
    } else if (report.questionSource === 'pyq') {
      try {
        const match = String(report.questionId).match(/^pyq_([a-f0-9]{24})_(\d+)$/i);
        if (match) {
          const PYQAnalysis = require('../models/PYQAnalysis');
          const pyqDoc = await PYQAnalysis.findById(match[1]);
          if (pyqDoc) {
            const qIndex = (pyqDoc.questionTopicMap || []).findIndex(q => q.qNo === parseInt(match[2]));
            if (qIndex !== -1) {
              const q = pyqDoc.questionTopicMap[qIndex];
              if (questionUpdates.question?.hi) q.questionTextHi = questionUpdates.question.hi;
              if (questionUpdates.question?.en) q.questionTextEn = questionUpdates.question.en;
              if (questionUpdates.correctAnswer !== undefined) q.correctAnswer = questionUpdates.correctAnswer;
              if (questionUpdates.explanation?.hi) q.explanationHi = questionUpdates.explanation.hi;
              if (questionUpdates.explanation?.en) q.explanationEn = questionUpdates.explanation.en;
              if (questionUpdates.options?.hi) q.optionsHi = questionUpdates.options.hi;
              if (questionUpdates.options?.en) q.optionsEn = questionUpdates.options.en;
              q.lastEditedAt = new Date();
              q.lastEditedBy = 'admin';
              q.editCount = (q.editCount || 0) + 1;
              if (!q.editHistory) q.editHistory = [];
              q.editHistory.unshift({ timestamp: new Date(), action: 'fix_from_report', changedFields: Object.keys(questionUpdates), editedBy: 'admin', note: `Fixed via report #${id}` });
              pyqDoc.questionTopicMap[qIndex] = q;
              pyqDoc.markModified('questionTopicMap');
              await pyqDoc.save();
              updatedQuestion = q;

              const testSync = await Test.updateMany({ questions: report.questionId, status: { $ne: 'archived' } }, { $set: { updatedAt: new Date() } });
              testsUpdated = testSync.modifiedCount;
            }
          }
        }
      } catch (e) { console.warn('[Fix] PYQ error:', e.message); }
    }

    // Get updated full question for response
    let fullQuestion = null;
    if (report.questionSource === 'bank') {
      fullQuestion = await Question.findById(report.questionId).populate('passageId').populate('diDataId').lean();
    }

    report.status = 'fixed';
    report.fixedAt = new Date();
    report.fixedBy = 'admin';
    if (adminNotes) report.adminNotes = adminNotes;
    if (resolution) report.resolution = resolution;
    await report.save();

    const relatedClosed = await QuestionReport.updateMany(
      { questionId: report.questionId, _id: { $ne: report._id }, status: { $in: ['pending', 'reviewing', 'in_progress'] } },
      { $set: { status: 'fixed', fixedAt: new Date(), resolution: `Auto-closed: Fixed via report #${id}`, duplicateOf: report._id } }
    );

    res.json({
      success: true,
      message: 'Question fixed and all attempts re-evaluated',
      data: {
        reportId: id, questionUpdated: !!updatedQuestion, testsUpdated,
        attemptsReEvaluated, answersChanged,
        relatedReportsClosed: relatedClosed.modifiedCount,
        autoTranslated: autoTranslate, textMatchEnabled: enableTextMatch,
        fullQuestion
      }
    });
  } catch (error) {
    console.error('[Fix] Error:', error.message);
    next(error);
  }
};

// ═══ REPORTS FOR QUESTION ═══
const getReportsForQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const reports = await QuestionReport.find({ questionId: String(questionId) })
      .populate('testId', 'title testType')
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: reports, total: reports.length });
  } catch (error) { next(error); }
};

// ═══ BULK UPDATE ═══
const bulkUpdateReports = async (req, res, next) => {
  try {
    const { ids, status, priority, adminNotes } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }
    const update = { updatedAt: new Date() };
    if (status) { update.status = status; if (status === 'fixed') { update.fixedAt = new Date(); update.fixedBy = 'admin'; } }
    if (priority) update.priority = priority;
    if (adminNotes) update.adminNotes = adminNotes;

    const result = await QuestionReport.updateMany({ _id: { $in: ids } }, { $set: update });
    res.json({ success: true, message: `${result.modifiedCount} reports updated`, data: { modified: result.modifiedCount } });
  } catch (error) { next(error); }
};

module.exports = {
  createReport, getReports, getReportStats, getReportById,
  updateReport, deleteReport, fixQuestion, getReportsForQuestion, bulkUpdateReports
};