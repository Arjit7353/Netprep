// client/src/services/questionService.js
// ════════════════════════════════════════════════════════════════
// EXTREME ADVANCED v4.0 — Full Translation, Sync, Impact Analysis
// All existing features preserved + New features added
// ════════════════════════════════════════════════════════════════

import { apiHelper } from './api';

const questionService = {
  // ============================================================
  // QUESTION APIs (EXISTING — UNCHANGED)
  // ============================================================

  getQuestions: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.paper && { paper: filters.paper }),
      ...(filters.unit && { unit: filters.unit }),
      ...(filters.chapter && { chapter: filters.chapter }),
      ...(filters.topic && { topic: filters.topic }),
      ...(filters.questionType && { questionType: filters.questionType }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.source && { source: filters.source }),
      ...(filters.year && { year: filters.year }),
      ...(filters.search && { search: filters.search }),
      ...(filters.startDate && { startDate: filters.startDate }),
      ...(filters.endDate && { endDate: filters.endDate }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      ...(filters.isPYQ !== undefined && { isPYQ: filters.isPYQ }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive })
    };
    return apiHelper.get('/questions', params);
  },

  getStats: async (paper = null) => {
    const params = paper ? { paper } : {};
    return apiHelper.get('/questions/stats', params);
  },

  getQuestionById: async (id) => {
    return apiHelper.get(`/questions/${id}`);
  },

  createQuestion: async (questionData) => {
    return apiHelper.post('/questions', questionData);
  },

  updateQuestion: async (id, questionData) => {
    return apiHelper.put(`/questions/${id}`, questionData);
  },

  deleteQuestion: async (id) => {
    return apiHelper.delete(`/questions/${id}`);
  },

  bulkDeleteQuestions: async (ids) => {
    return apiHelper.post('/questions/bulk-delete', { ids });
  },

  // ============================================================
  // PYQ QUESTION BANK APIs (EXISTING — UNCHANGED)
  // ============================================================

  getPYQQuestionBank: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.paper && { paper: filters.paper }),
      ...(filters.year && { year: filters.year }),
      ...(filters.session && { session: filters.session }),
      ...(filters.shift && { shift: filters.shift }),
      ...(filters.unitId && { unitId: filters.unitId }),
      ...(filters.chapter && { chapter: filters.chapter }),
      ...(filters.topic && { topic: filters.topic }),
      ...(filters.type && { type: filters.type }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.hasContent !== undefined && filters.hasContent !== '' && { hasContent: String(filters.hasContent) }),
      ...(filters.search && { search: filters.search }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      // ═══ Review filters ═══
      ...(filters.verificationStatus && { verificationStatus: filters.verificationStatus }),
      ...(filters.correctnessStatus && { correctnessStatus: filters.correctnessStatus }),
      ...(filters.isFlagged !== undefined && filters.isFlagged !== '' && { isFlagged: String(filters.isFlagged) }),
      ...(filters.isEdited !== undefined && filters.isEdited !== '' && { isEdited: String(filters.isEdited) }),
    };
    return apiHelper.get('/questions/pyq-bank', params);
  },

  getPYQQuestionById: async (pyqId) => {
    return apiHelper.get(`/questions/pyq-question/${pyqId}`);
  },

  updatePYQQuestion: async (pyqId, updates) => {
    return apiHelper.put(`/questions/pyq-question/${pyqId}`, updates);
  },

  bulkUpdatePYQQuestions: async (pyqIds, updates) => {
    return apiHelper.put('/questions/pyq-bank/bulk-update', { pyqIds, updates });
  },
 /** Alias for backward compatibility with QuestionList.jsx */
  bulkTranslateQuestions_NEW: async (ids, options = {}) => {
    return apiHelper.post('/questions/bulk-translate', {
      ids,
      sourceLanguage: options.sourceLanguage || null,
      forceRetranslate: options.forceRetranslate || false
    });
  },
  // ═══ Review & Verification APIs (EXISTING — UNCHANGED) ═══

  verifyPYQQuestion: async (pyqId, verificationStatus, notes = '', correctnessStatus = null) => {
    const updates = {
      verificationStatus,
      _actionType: verificationStatus === 'approved' ? 'approve' : verificationStatus === 'rejected' ? 'reject' : 'verify',
      _actionBy: 'admin',
      _actionNote: notes,
    };
    if (notes) updates.reviewNotes = notes;
    if (correctnessStatus) updates.correctnessStatus = correctnessStatus;
    return apiHelper.put(`/questions/pyq-question/${pyqId}`, updates);
  },

  flagPYQQuestion: async (pyqId, isFlagged, reason = '') => {
    return apiHelper.put(`/questions/pyq-question/${pyqId}`, {
      isFlagged,
      flagReason: reason,
      _actionType: isFlagged ? 'flag' : 'unflag',
      _actionBy: 'admin',
    });
  },

  bulkVerifyPYQQuestions: async (pyqIds, verificationStatus, notes = '') => {
    return apiHelper.put('/questions/pyq-bank/bulk-update', {
      pyqIds,
      updates: {
        verificationStatus,
        reviewNotes: notes,
        _actionType: `bulk_${verificationStatus}`,
        _actionBy: 'admin',
        _actionNote: notes,
      }
    });
  },

  bulkFlagPYQQuestions: async (pyqIds, isFlagged, reason = '') => {
    return apiHelper.put('/questions/pyq-bank/bulk-update', {
      pyqIds,
      updates: {
        isFlagged,
        flagReason: reason,
        _actionType: isFlagged ? 'bulk_flag' : 'bulk_unflag',
        _actionBy: 'admin',
      }
    });
  },

  // ============================================================
  // IMPORT APIs (EXISTING — UNCHANGED)
  // ============================================================

  importQuestions: async (jsonData, options = {}) => {
    const { skipDuplicates = true } = options;
    const shouldSkip = jsonData._skipDuplicates ?? skipDuplicates;
    const cleanData = { ...jsonData };
    delete cleanData._skipDuplicates;
    const url = shouldSkip
      ? '/questions/import?skipDuplicates=true'
      : '/questions/import';
    const apiModule = await import('./api');
    const api = apiModule.default;
    const response = await api.post(url, cleanData, { timeout: 180000 });
    return response.data;
  },

  validateImport: async (jsonData) => {
    return apiHelper.post('/questions/import/validate', jsonData);
  },

  // ============================================================
  // ★★★ TRANSLATION APIs — EXISTING + ENHANCED ★★★
  // ============================================================

  /** Translate arbitrary text (Azure) — EXISTING */
  translateText: async (text, from = 'hi', to = 'en') => {
    return apiHelper.post('/translate', { text, from, to });
  },

  /** Batch translate texts — EXISTING */
  translateBatch: async (texts, from = 'hi', to = 'en') => {
    return apiHelper.post('/translate/batch', { texts, from, to });
  },

  /**
   * ★ NEW: Translate a single question by ID
   * Auto-detects source language, translates via Azure, syncs to all tests
   * @param {string} id - Question ID
   * @param {object} options - { sourceLanguage?, forceRetranslate? }
   * @returns {Promise} - { success, data, translation: { sourceLanguage, targetLanguage, testsUpdated } }
   */
  translateSingleQuestion: async (id, options = {}) => {
    return apiHelper.post(`/questions/${id}/translate`, {
      sourceLanguage: options.sourceLanguage || null,
      forceRetranslate: options.forceRetranslate || false
    });
  },
// ★ ALIAS — so both names work
  translateQuestion: async (id, options = {}) => {
    return apiHelper.post(`/questions/${id}/translate`, {
      sourceLanguage: options.sourceLanguage || null,
      forceRetranslate: options.forceRetranslate || false
    });
  },
  /**
   * ★ NEW: Bulk translate multiple questions
   * Auto-detects language per question, translates missing language, syncs tests
   * @param {string[]} ids - Array of question IDs (max 50)
   * @param {object} options - { sourceLanguage?, forceRetranslate? }
   * @returns {Promise} - { success, data: { translated, skipped, failed, testsUpdated } }
   */
  bulkTranslateQuestions: async (ids, options = {}) => {
    return apiHelper.post('/questions/bulk-translate', {
      ids,
      sourceLanguage: options.sourceLanguage || null,
      forceRetranslate: options.forceRetranslate || false
    });
  },

  /**
   * ★ NEW: Detect language of text
   * Uses character analysis to determine Hindi/English/Mixed
   * @param {string} text - Text to detect
   * @returns {Promise} - { success, data: { language, confidence, isMixed } }
   */
  detectLanguage: async (text) => {
    return apiHelper.post('/translate/detect', { text });
  },

  /**
   * ★ NEW: Get translation service status
   * Shows Azure/Google availability, cache size, stats
   * @returns {Promise} - { success, data: { primary, azure, google, stats, cacheSize } }
   */
  getTranslationServiceStatus: async () => {
    return apiHelper.get('/translate/status');
  },

  /**
   * ★ NEW: Test translation connection
   * Verifies Azure API key is working
   * @returns {Promise} - { success, data: { azure, google } }
   */
  testTranslationConnection: async () => {
    return apiHelper.get('/translate/test');
  },

  /**
   * ★ NEW: Clear translation cache
   * Useful when translations seem stale
   * @returns {Promise} - { success, message }
   */
  clearTranslationCache: async () => {
    return apiHelper.post('/translate/clear-cache');
  },

  // ============================================================
  // ★★★ IMPACT ANALYSIS & SYNC APIs — ALL NEW ★★★
  // ============================================================

  /**
   * ★ NEW: Get impact analysis for a question
   * Shows which tests will be affected by editing this question
   * @param {string} id - Question ID
   * @returns {Promise} - { success, data: { testsAffected, tests[], translationStatus } }
   */
  getImpactAnalysis: async (id) => {
    return apiHelper.get(`/questions/${id}/impact`);
  },

  /**
   * ★ NEW: Get translation status for multiple questions
   * Shows completeness of Hindi/English for each question
   * @param {string[]} ids - Array of question IDs (max 200)
   * @returns {Promise} - { success, data: { [id]: { hasHindi, hasEnglish, completeness, status } } }
   */
  getTranslationStatus: async (ids) => {
    return apiHelper.post('/questions/translation-status', { ids });
  },

  // ============================================================
  // ★★★ REPAIR APIs — ALL NEW ★★★
  // ============================================================

  /**
   * ★ NEW: Preview which questions need repair
   * Checks for spacing issues, keyword translation, corruption
   * @param {object} params - { questionType?, limit? }
   * @returns {Promise} - { success, data: { totalChecked, totalNeedRepair, items[] } }
   */
  getRepairPreview: async (params = {}) => {
    return apiHelper.get('/translate/repair/preview', params);
  },

  /**
   * ★ NEW: Execute repair on questions
   * Fixes spacing, keywords, corruption in saved questions
   * @param {object} data - { questionType?, questionIds?, limit?, deep? }
   * @returns {Promise} - { success, data: { totalChecked, totalRepaired, log[] } }
   */
  executeRepair: async (data = {}) => {
    return apiHelper.post('/translate/repair/execute', data);
  },

  /**
   * ★ NEW: Preview PYQ questions needing repair
   */
  getPYQRepairPreview: async (params = {}) => {
    return apiHelper.get('/translate/repair/pyq/preview', params);
  },

  /**
   * ★ NEW: Execute repair on PYQ questions
   */
  executePYQRepair: async (data = {}) => {
    return apiHelper.post('/translate/repair/pyq/execute', data);
  },

  // ============================================================
  // PASSAGE APIs (EXISTING — UNCHANGED)
  // ============================================================

  getPassages: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.paper && { paper: filters.paper }),
      ...(filters.unit && { unit: filters.unit }),
      ...(filters.chapter && { chapter: filters.chapter })
    };
    return apiHelper.get('/questions/passages/list', params);
  },

  createPassage: async (passageData) => {
    return apiHelper.post('/questions/passages', passageData);
  },

  getPassageById: async (id) => {
    return apiHelper.get(`/questions/passages/${id}`);
  },

  getQuestionsByPassage: async (passageId) => {
    return apiHelper.get(`/questions/passage/${passageId}`);
  },

  updatePassage: async (id, passageData) => {
    return apiHelper.put(`/questions/passages/${id}`, passageData);
  },

  deletePassage: async (id) => {
    return apiHelper.delete(`/questions/passages/${id}`);
  },

  // ============================================================
  // DI DATA APIs (EXISTING — UNCHANGED)
  // ============================================================

  getDIDataList: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.paper && { paper: filters.paper }),
      ...(filters.unit && { unit: filters.unit }),
      ...(filters.diType && { diType: filters.diType })
    };
    return apiHelper.get('/questions/di-data/list', params);
  },

  createDIData: async (diData) => {
    return apiHelper.post('/questions/di-data', diData);
  },

  getDIDataById: async (id) => {
    return apiHelper.get(`/questions/di-data/${id}`);
  },

  getQuestionsByDI: async (diDataId) => {
    return apiHelper.get(`/questions/di/${diDataId}`);
  },

  updateDIData: async (id, diData) => {
    return apiHelper.put(`/questions/di-data/${id}`, diData);
  },

  deleteDIData: async (id) => {
    return apiHelper.delete(`/questions/di-data/${id}`);
  },

  // ============================================================
  // TEST GENERATION APIs (EXISTING — UNCHANGED)
  // ============================================================

  getRandomQuestions: async (config) => {
    return apiHelper.post('/questions/random', config);
  },

  getFullMockQuestions: async (paper, questionsPerUnit = 5) => {
    return apiHelper.get('/questions/full-mock', { paper, questionsPerUnit });
  },

  // ============================================================
  // ANALYTICS APIs (EXISTING — UNCHANGED)
  // ============================================================

  updateAccuracy: async (id, isCorrect) => {
    return apiHelper.patch(`/questions/${id}/accuracy`, { isCorrect });
  },

  getByDifficulty: async (difficulty, paper = null) => {
    const params = { difficulty, ...(paper && { paper }) };
    return apiHelper.get('/questions', params);
  },

  getByUnit: async (unit, paper) => {
    const params = { unit, ...(paper && { paper }) };
    return apiHelper.get('/questions', params);
  },

  getPYQQuestions: async (year, paper = null, session = null) => {
    const params = {
      isPYQ: true,
      ...(year && { year }),
      ...(paper && { paper }),
      ...(session && { pyqSession: session })
    };
    return apiHelper.get('/questions', params);
  },

  searchQuestions: async (searchText, paper = null) => {
    const params = {
      search: searchText,
      limit: 50,
      ...(paper && { paper })
    };
    return apiHelper.get('/questions', params);
  },

  // ============================================================
  // TEST USAGE & DETAIL APIs (EXISTING — UNCHANGED)
  // ============================================================

  /** Get test usage for multiple questions */
  getTestUsage: async (ids) => {
    return apiHelper.post('/questions/test-usage', { ids });
  },

  /** Question detail with full metadata + test usage */
  getQuestionDetail: async (id) => {
    return apiHelper.get(`/questions/detail/${id}`);
  },

  /** Bulk update questions (difficulty, tags, etc.) */
  bulkUpdateQuestions: async (ids, updates) => {
    return apiHelper.put('/questions/bulk-update', { ids, updates });
  },

  /** Question analytics (accuracy, attempts, etc.) */
  getQuestionAnalytics: async (id) => {
    return apiHelper.get(`/questions/analytics/${id}`);
  },

  // ============================================================
  // HELPER METHODS — Client-side utilities (EXISTING — UNCHANGED)
  // ============================================================

  getTypeLabel: (type, language = 'hi') => {
    const labels = {
      mcq: { hi: 'बहुविकल्पीय', en: 'MCQ' },
      assertion_reason: { hi: 'अभिकथन-कारण', en: 'Assertion-Reason' },
      match_following: { hi: 'सुमेलन', en: 'Match Following' },
      sequence_order: { hi: 'क्रम व्यवस्था', en: 'Sequence Order' },
      statement_based: { hi: 'कथन आधारित', en: 'Statement Based' },
      passage_based: { hi: 'गद्यांश आधारित', en: 'Passage Based' },
      di_table: { hi: 'टेबल चार्ट', en: 'Table Chart' },
      di_bar_chart: { hi: 'बार चार्ट', en: 'Bar Chart' },
      di_pie_chart: { hi: 'पाई चार्ट', en: 'Pie Chart' },
      di_line_graph: { hi: 'लाइन ग्राफ', en: 'Line Graph' },
      di_mixed: { hi: 'मिश्रित चार्ट', en: 'Mixed Chart' },
      di_caselet: { hi: 'केसलेट', en: 'Caselet' }
    };
    return labels[type]?.[language] || type;
  },

  getDifficultyLabel: (difficulty, language = 'hi') => {
    const labels = {
      easy: { hi: 'सरल', en: 'Easy' },
      medium: { hi: 'मध्यम', en: 'Medium' },
      hard: { hi: 'कठिन', en: 'Hard' }
    };
    return labels[difficulty]?.[language] || difficulty;
  },

  isDIType: (type) => type?.startsWith('di_'),

  isPassageType: (type) => type === 'passage_based',

  getAllQuestionTypes: () => [
    'mcq', 'assertion_reason', 'match_following', 'sequence_order',
    'statement_based', 'passage_based', 'di_table', 'di_bar_chart',
    'di_pie_chart', 'di_line_graph', 'di_mixed', 'di_caselet'
  ],

  getDITypes: () => [
    'di_table', 'di_bar_chart', 'di_pie_chart',
    'di_line_graph', 'di_mixed', 'di_caselet'
  ],

  formatQuestionPreview: (question, language = 'hi') => {
    if (!question) return '';
    const getText = (field) => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      return field[language] || field.hi || field.en || '';
    };
    switch (question.questionType) {
      case 'assertion_reason':
        return getText(question.assertionReasonData?.assertion) || getText(question.question) || 'Assertion-Reason Question';
      case 'match_following': {
        const listA = question.matchData?.listA;
        if (listA) {
          const items = typeof listA === 'object' && !Array.isArray(listA)
            ? (listA[language] || listA.hi || listA.en || [])
            : (Array.isArray(listA) ? listA : []);
          if (items.length > 0) return getText(question.question) || `Match: ${items[0]}...`;
        }
        return getText(question.question) || 'Match Following Question';
      }
      case 'sequence_order':
        return getText(question.question) || 'Sequence Order Question';
      case 'statement_based':
        return getText(question.question) || 'Statement Based Question';
      case 'passage_based':
        return getText(question.question) || 'Passage-based Question';
      default:
        if (question.questionType?.startsWith('di_'))
          return getText(question.question) || 'Data Interpretation Question';
        return getText(question.question);
    }
  },

  // ============================================================
  // COLOR & STYLE HELPERS (EXISTING — UNCHANGED)
  // ============================================================

  getTypeColor: (type) => {
    const colors = {
      mcq: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      assertion_reason: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      match_following: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      sequence_order: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      statement_based: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
      passage_based: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
      di_table: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
      di_bar_chart: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
      di_pie_chart: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
      di_line_graph: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
      di_mixed: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
      di_caselet: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' }
    };
    return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  },

  getDifficultyColor: (difficulty) => {
    const colors = {
      easy: { bg: 'bg-green-100', text: 'text-green-700' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      hard: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    return colors[difficulty] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  },

  // ============================================================
  // VERIFICATION STATUS HELPERS (EXISTING — UNCHANGED)
  // ============================================================

  getVerificationStatusLabel: (status, language = 'en') => {
    const labels = {
      unchecked: { hi: 'अनजांचा', en: 'Unchecked' },
      checked: { hi: 'जांचा गया', en: 'Checked' },
      verified: { hi: 'सत्यापित', en: 'Verified' },
      approved: { hi: 'स्वीकृत', en: 'Approved' },
      rejected: { hi: 'अस्वीकृत', en: 'Rejected' },
    };
    return labels[status]?.[language] || status || 'Unchecked';
  },

  getVerificationStatusColor: (status) => {
    const colors = {
      unchecked: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
      checked: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      verified: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    };
    return colors[status] || colors.unchecked;
  },

  getCorrectnessStatusLabel: (status, language = 'en') => {
    const labels = {
      unknown: { hi: 'अज्ञात', en: 'Unknown' },
      correct: { hi: 'सही', en: 'Correct' },
      incorrect: { hi: 'गलत', en: 'Incorrect' },
      disputed: { hi: 'विवादित', en: 'Disputed' },
    };
    return labels[status]?.[language] || status || 'Unknown';
  },

  getCorrectnessStatusColor: (status) => {
    const colors = {
      unknown: { bg: 'bg-gray-100', text: 'text-gray-600' },
      correct: { bg: 'bg-green-100', text: 'text-green-700' },
      incorrect: { bg: 'bg-red-100', text: 'text-red-700' },
      disputed: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    };
    return colors[status] || colors.unknown;
  },

  // ============================================================
  // ★★★ NEW: TRANSLATION STATUS HELPERS — Client-side ★★★
  // ============================================================

  /**
   * ★ NEW: Get translation completeness for a question object (client-side calc)
   * @param {object} question - Question object with bilingual fields
   * @returns {object} - { hasHindi, hasEnglish, completeness, status, needsTranslation }
   */
  getQuestionTranslationInfo: (question) => {
    if (!question) return { hasHindi: false, hasEnglish: false, completeness: 0, status: 'missing', needsTranslation: true };

    const hasHi = !!(question.question?.hi?.trim());
    const hasEn = !!(question.question?.en?.trim());
    const hiOpts = (question.options?.hi || []).filter(o => o?.trim()).length;
    const enOpts = (question.options?.en || []).filter(o => o?.trim()).length;
    const hasExplHi = !!(question.explanation?.hi?.trim());
    const hasExplEn = !!(question.explanation?.en?.trim());

    let score = 0;
    const total = 6;
    if (hasHi) score++;
    if (hasEn) score++;
    if (hiOpts >= 4) score++;
    if (enOpts >= 4) score++;
    if (hasExplHi) score++;
    if (hasExplEn) score++;

    const pct = Math.round((score / total) * 100);

    return {
      hasHindi: hasHi,
      hasEnglish: hasEn,
      hindiOptions: hiOpts,
      englishOptions: enOpts,
      hasExplanationHi: hasExplHi,
      hasExplanationEn: hasExplEn,
      completeness: pct,
      status: pct >= 90 ? 'complete' : pct >= 50 ? 'partial' : 'missing',
      needsTranslation: pct < 80
    };
  },

  /**
   * ★ NEW: Get translation status color for badges
   * @param {string} status - 'complete' | 'partial' | 'missing'
   * @returns {object} - { bg, text, icon }
   */
  getTranslationStatusColor: (status) => {
    const colors = {
      complete: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '🌐✓', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300' },
      partial: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🌐⚠', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
      missing: { bg: 'bg-red-100', text: 'text-red-700', icon: '🌐✗', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' },
    };
    return colors[status] || colors.missing;
  },

  /**
   * ★ NEW: Detect source language from question data (client-side)
   * @param {object} question - Question object
   * @returns {string|null} - 'hi' | 'en' | null
   */
  detectQuestionLanguage: (question) => {
    if (!question) return null;

    const hasHi = !!(question.question?.hi?.trim());
    const hasEn = !!(question.question?.en?.trim());

    if (hasHi && !hasEn) return 'hi';
    if (hasEn && !hasHi) return 'en';

    if (hasHi && hasEn) {
      const hiLen = (question.question?.hi || '').length + (question.explanation?.hi || '').length;
      const enLen = (question.question?.en || '').length + (question.explanation?.en || '').length;
      return hiLen >= enLen ? 'hi' : 'en';
    }

    return null;
  },

  /**
   * ★ NEW: Format sync info message after question update
   * @param {object} syncData - { testsUpdated, autoTranslated, sourceLanguage, targetLanguage }
   * @param {string} language - 'hi' | 'en'
   * @returns {string} - Formatted message
   */
  formatSyncMessage: (syncData, language = 'hi') => {
    if (!syncData) return '';

    const parts = [];

    if (syncData.autoTranslated) {
      const dir = syncData.sourceLanguage === 'hi' ? 'हिंदी→English' : 'English→हिंदी';
      parts.push(language === 'hi' ? `स्वचालित अनुवाद: ${dir}` : `Auto-translated: ${dir}`);
    }

    if (syncData.testsUpdated > 0) {
      parts.push(
        language === 'hi'
          ? `${syncData.testsUpdated} टेस्ट अपडेट हुए`
          : `${syncData.testsUpdated} test(s) synced`
      );
    }

    return parts.join(' | ');
  },
};

export default questionService;