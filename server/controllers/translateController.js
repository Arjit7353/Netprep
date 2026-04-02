// server/controllers/translateController.js
const translateHelper = require('../utils/translateHelper');
const Question = require('../models/Question');

const translateText = async (req, res, next) => {
  try {
    const { text, from, to } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });
    const fromLang = from || 'hi';
    const toLang = to || (fromLang === 'hi' ? 'en' : 'hi');
    
    const cleaned = translateHelper.preCleanText(text);
    const translated = await translateHelper.translate(cleaned, fromLang, toLang);
    const normalized = translateHelper.normalizeSpacing(translated);
    
    // ★ Apply keyword translation for Hindi output
    const final = toLang === 'hi' 
      ? translateHelper.translateKeywordsInText(normalized, 'hi')
      : normalized;
    
    res.json({ success: true, data: { original: text, translated: final, from: fromLang, to: toLang } });
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
//   ★ ENHANCED REPAIR — with deep repair option
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
        items: needRepair.slice(0, 50),
        repairTypes: {
          spacing: needRepair.filter(r => r.repairs.some(rep => rep.includes('spacing'))).length,
          keywords: needRepair.filter(r => r.repairs.some(rep => rep.includes('keywords'))).length,
          corruption: needRepair.filter(r => r.repairs.some(rep => !rep.includes('spacing') && !rep.includes('keywords') && !rep.includes('mixed'))).length,
          mixedLang: needRepair.filter(r => r.repairs.some(rep => rep.includes('mixed_lang'))).length,
        }
      }
    });
  } catch (error) { next(error); }
};

const repairExecute = async (req, res, next) => {
  try {
    const { questionType, questionIds, limit = 200, deep = false } = req.body;
    const filter = { isActive: { $ne: false } };
    if (questionType) filter.questionType = questionType;
    if (questionIds && Array.isArray(questionIds)) filter._id = { $in: questionIds };

    const questions = await Question.find(filter).limit(parseInt(limit));

    let repairedCount = 0;
    const repairLog = [];

    for (const q of questions) {
      let result;
      
      if (deep) {
        // ★ Deep repair: includes re-translation of mixed language fields
        result = await translateHelper.deepRepairQuestion(q.toObject());
      } else {
        result = translateHelper.repairQuestion(q.toObject());
      }

      if (result.repairCount > 0) {
        const update = {};
        if (result.question.options) update.options = result.question.options;
        if (result.question.question) update.question = result.question.question;
        if (result.question.explanation) update.explanation = result.question.explanation;
        if (result.question.assertionReasonData) update.assertionReasonData = result.question.assertionReasonData;
        if (result.question.matchData) update.matchData = result.question.matchData;
        if (result.question.sequenceData) update.sequenceData = result.question.sequenceData;
        if (result.question.statementData) update.statementData = result.question.statementData;

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

    console.log(`[Repair] Fixed ${repairedCount} questions (deep=${deep})`);

    res.json({
      success: true,
      message: `Repaired ${repairedCount} questions${deep ? ' (deep mode)' : ''}`,
      data: {
        totalChecked: questions.length,
        totalRepaired: repairedCount,
        deepMode: !!deep,
        log: repairLog.slice(0, 50)
      }
    });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════
//   ★ NEW: PYQ REPAIR — Fix PYQ questions in PYQAnalysis docs
// ═══════════════════════════════════════════════════

const repairPYQPreview = async (req, res, next) => {
  try {
    const { paper, year, limit = 500 } = req.query;
    const PYQAnalysis = require('../models/PYQAnalysis');
    
    const filter = { isActive: true };
    if (paper) filter.paper = paper;
    if (year) filter.year = year;

    const pyqDocs = await PYQAnalysis.find(filter).lean();
    
    const needRepair = [];
    let totalChecked = 0;

    for (const doc of pyqDocs) {
      for (const q of (doc.questionTopicMap || [])) {
        totalChecked++;
        if (totalChecked > parseInt(limit)) break;

        const issues = [];

        // Check Hindi fields for English keywords
        const hiFields = ['questionTextHi', 'explanationHi', 'assertionHi', 'reasonHi'];
        for (const f of hiFields) {
          if (q[f] && typeof q[f] === 'string') {
            // Check for untranslated English keywords
            for (const keyword of Object.keys(translateHelper.KEYWORD_EN_TO_HI)) {
              const re = new RegExp(`(?<=[\\u0900-\\u097F\\s,;:।?]|^)${keyword}(?=[\\u0900-\\u097F\\s,;:।?]|$)`, 'g');
              if (re.test(q[f])) {
                issues.push(`${f}: has "${keyword}"`);
              }
            }

            // Check for mixed language
            const mixCheck = translateHelper.detectMixedLanguage(q[f], 'hi');
            if (mixCheck.isMixed) {
              issues.push(`${f}: mixed_lang_${Math.round(mixCheck.ratio * 100)}%`);
            }
          }
        }

        // Check Hindi arrays for English keywords
        const hiArrayFields = ['optionsHi', 'statementsHi', 'listAHi', 'listBHi', 'itemsHi'];
        for (const f of hiArrayFields) {
          if (Array.isArray(q[f])) {
            for (let i = 0; i < q[f].length; i++) {
              if (q[f][i] && typeof q[f][i] === 'string') {
                for (const keyword of ['NOT', 'INCORRECT', 'CORRECT', 'TRUE', 'FALSE']) {
                  if (new RegExp(`\\b${keyword}\\b`).test(q[f][i]) && HINDI_RE.test(q[f][i])) {
                    issues.push(`${f}[${i}]: has "${keyword}"`);
                    break;
                  }
                }
              }
            }
          }
        }

        if (issues.length > 0) {
          needRepair.push({
            docId: doc._id,
            pyqLabel: doc.displayLabel,
            qNo: q.qNo,
            pyqId: `pyq_${doc._id}_${q.qNo}`,
            issueCount: issues.length,
            issues: issues.slice(0, 10)
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalChecked,
        totalNeedRepair: needRepair.length,
        items: needRepair.slice(0, 100)
      }
    });
  } catch (error) { next(error); }
};

const repairPYQExecute = async (req, res, next) => {
  try {
    const { paper, year, pyqIds, limit = 500 } = req.body;
    const PYQAnalysis = require('../models/PYQAnalysis');

    const filter = { isActive: true };
    if (paper) filter.paper = paper;
    if (year) filter.year = year;

    const pyqDocs = await PYQAnalysis.find(filter);
    
    let repairedCount = 0;
    let totalChecked = 0;
    const repairLog = [];

    for (const doc of pyqDocs) {
      let docChanged = false;

      for (let qi = 0; qi < (doc.questionTopicMap || []).length; qi++) {
        totalChecked++;
        if (totalChecked > parseInt(limit)) break;

        const q = doc.questionTopicMap[qi];
        const pyqId = `pyq_${doc._id}_${q.qNo}`;

        // If specific pyqIds provided, skip others
        if (pyqIds && Array.isArray(pyqIds) && !pyqIds.includes(pyqId)) continue;

        let changed = false;

        // Fix Hindi text fields — translate English keywords to Hindi
        const hiFields = ['questionTextHi', 'explanationHi', 'assertionHi', 'reasonHi'];
        for (const f of hiFields) {
          if (q[f] && typeof q[f] === 'string') {
            const fixed = translateHelper.translateKeywordsInText(q[f], 'hi');
            const normalized = translateHelper.normalizeSpacing(fixed);
            if (normalized !== q[f]) {
              q[f] = normalized;
              changed = true;
            }
          }
        }

        // Fix Hindi array fields
        const hiArrayFields = ['optionsHi', 'statementsHi', 'listAHi', 'listBHi', 'itemsHi'];
        for (const f of hiArrayFields) {
          if (Array.isArray(q[f])) {
            for (let i = 0; i < q[f].length; i++) {
              if (q[f][i] && typeof q[f][i] === 'string') {
                const fixed = translateHelper.translateKeywordsInText(q[f][i], 'hi');
                const normalized = translateHelper.normalizeSpacing(fixed);
                if (normalized !== q[f][i]) {
                  q[f][i] = normalized;
                  changed = true;
                }
              }
            }
          }
        }

        // Apply corruption fixes
        for (const detector of translateHelper.CORRUPTION_DETECTORS) {
          const allFields = [...hiFields, 'questionTextEn', 'explanationEn'];
          for (const f of allFields) {
            if (q[f] && typeof q[f] === 'string') {
              const re = new RegExp(detector.pattern.source, detector.pattern.flags);
              if (re.test(q[f])) {
                const before = q[f];
                q[f] = q[f].replace(new RegExp(detector.pattern.source, detector.pattern.flags), detector.fix);
                if (q[f] !== before) changed = true;
              }
            }
          }
        }

        if (changed) {
          doc.questionTopicMap[qi] = q;
          docChanged = true;
          repairedCount++;
          repairLog.push({
            pyqId,
            qNo: q.qNo,
            pyqLabel: doc.displayLabel
          });
        }
      }

      if (docChanged) {
        doc.markModified('questionTopicMap');
        doc.updatedAt = new Date();
        await doc.save();
      }
    }

    console.log(`[PYQ Repair] Fixed ${repairedCount} PYQ questions`);

    res.json({
      success: true,
      message: `Repaired ${repairedCount} PYQ questions`,
      data: {
        totalChecked,
        totalRepaired: repairedCount,
        log: repairLog.slice(0, 50)
      }
    });
  } catch (error) { next(error); }
};
// ★ NEW: Detect language of text
const detectLanguage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'text required' });

    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const englishChars = (text.match(/[A-Za-z]/g) || []).length;
    const totalChars = hindiChars + englishChars;

    let language = 'unknown';
    let confidence = 0;

    if (totalChars === 0) {
      language = 'unknown';
    } else if (hindiChars > englishChars) {
      language = 'hi';
      confidence = Math.round((hindiChars / totalChars) * 100);
    } else {
      language = 'en';
      confidence = Math.round((englishChars / totalChars) * 100);
    }

    res.json({
      success: true,
      data: {
        language,
        confidence,
        hindiChars,
        englishChars,
        isMixed: hindiChars > 0 && englishChars > 0 && Math.min(hindiChars, englishChars) / Math.max(totalChars, 1) > 0.2
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
  repairExecute,
  repairPYQPreview,
   detectLanguage,
  repairPYQExecute
};