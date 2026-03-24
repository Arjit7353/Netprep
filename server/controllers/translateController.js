// server/controllers/translateController.js
const translateHelper = require('../utils/translateHelper');
const Question = require('../models/Question');

const translateText = async (req, res, next) => {
  try {
    const { text, from, to } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
    const fromLang = from || 'hi';
    const toLang = to || (fromLang === 'hi' ? 'en' : 'hi');
    
    // ★ Pre-clean the text before translation
    const cleaned = translateHelper.preCleanText(text);
    const translated = await translateHelper.translate(cleaned, fromLang, toLang);
    // ★ Normalize spacing after translation
    const normalized = translateHelper.normalizeSpacing(translated);
    
    res.json({ success: true, data: { original: text, translated: normalized, from: fromLang, to: toLang } });
  } catch (error) { next(error); }
};

const translateBatch = async (req, res, next) => {
  try {
    const { texts, from, to } = req.body;
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ success: false, message: 'texts array is required' });
    }
    if (texts.length > 200) {
      return res.status(400).json({ success: false, message: 'Max 200 texts per batch' });
    }
    const fromLang = from || 'hi';
    const toLang = to || (fromLang === 'hi' ? 'en' : 'hi');
    const translated = await translateHelper.translateBatch(texts, fromLang, toLang);
    res.json({ success: true, data: { original: texts, translated, from: fromLang, to: toLang, count: translated.length } });
  } catch (error) { next(error); }
};

const testConnection = async (req, res, next) => {
  try {
    const result = await translateHelper.testConnection();
    res.json({ success: result.success, data: result });
  } catch (error) { next(error); }
};

const getStatus = async (req, res) => {
  res.json({ success: true, data: translateHelper.getStatus() });
};

const clearCache = async (req, res) => {
  translateHelper.clearCache();
  res.json({ success: true, message: 'Translation cache cleared' });
};

// ═══════════════════════════════════════════════════
//   REPAIR CORRUPTED TRANSLATIONS + SPACING
// ═══════════════════════════════════════════════════

const repairPreview = async (req, res, next) => {
  try {
    const { questionType, limit = 200 } = req.query;
    const filter = { isActive: { $ne: false } };
    if (questionType) filter.questionType = questionType;

    const questions = await Question.find(filter).limit(parseInt(limit)).lean();

    const needRepair = [];
    for (const q of questions) {
      const result = translateHelper.repairQuestion(q);
      if (result.repairCount > 0) {
        needRepair.push({
          _id: q._id,
          questionNumber: q.questionNumber,
          questionType: q.questionType,
          repairCount: result.repairCount,
          repairs: result.repairs
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalChecked: questions.length,
        totalNeedRepair: needRepair.length,
        items: needRepair.slice(0, 50)
      }
    });
  } catch (error) { next(error); }
};

const repairExecute = async (req, res, next) => {
  try {
    const { questionType, questionIds, limit = 200 } = req.body;
    const filter = { isActive: { $ne: false } };
    if (questionType) filter.questionType = questionType;
    if (questionIds && Array.isArray(questionIds)) filter._id = { $in: questionIds };

    const questions = await Question.find(filter).limit(parseInt(limit));

    let repairedCount = 0;
    const repairLog = [];

    for (const q of questions) {
      const result = translateHelper.repairQuestion(q.toObject());
      if (result.repairCount > 0) {
        const update = {};
        if (result.question.options) update.options = result.question.options;
        if (result.question.question) update.question = result.question.question;
        if (result.question.explanation) update.explanation = result.question.explanation;
        if (result.question.assertionReasonData) update.assertionReasonData = result.question.assertionReasonData;

        if (Object.keys(update).length > 0) {
          update.updatedAt = new Date();
          await Question.findByIdAndUpdate(q._id, update);
          repairedCount++;
          repairLog.push({
            questionNumber: q.questionNumber,
            repairCount: result.repairCount,
            repairs: result.repairs
          });
        }
      }
    }

    console.log(`[Repair] Fixed ${repairedCount} questions`);

    res.json({
      success: true,
      message: `Repaired ${repairedCount} questions`,
      data: {
        totalChecked: questions.length,
        totalRepaired: repairedCount,
        log: repairLog.slice(0, 50)
      }
    });
  } catch (error) { next(error); }
};

module.exports = {
  translateText,
  translateBatch,
  testConnection,
  getStatus,
  clearCache,
  repairPreview,
  repairExecute
};