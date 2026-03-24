// client/src/services/questionService.js

import { apiHelper } from './api';

const questionService = {
  // ============================================================
  // QUESTION APIs
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
  // PYQ QUESTION BANK APIs
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

  // ═══ Review & Verification APIs ═══

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
  // IMPORT APIs
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

  translateText: async (text, from = 'hi', to = 'en') => {
    return apiHelper.post('/translate', { text, from, to });
  },

  translateBatch: async (texts, from = 'hi', to = 'en') => {
    return apiHelper.post('/translate/batch', { texts, from, to });
  },

  // ============================================================
  // PASSAGE APIs
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
  // DI DATA APIs
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
  // TEST GENERATION APIs
  // ============================================================

  getRandomQuestions: async (config) => {
    return apiHelper.post('/questions/random', config);
  },

  getFullMockQuestions: async (paper, questionsPerUnit = 5) => {
    return apiHelper.get('/questions/full-mock', { paper, questionsPerUnit });
  },

  // ============================================================
  // ANALYTICS APIs
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
  // HELPER METHODS (Client-side utilities)
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
          const items = typeof listA === 'object' && !Array.isArray(listA) ? (listA[language] || listA.hi || listA.en || []) : (Array.isArray(listA) ? listA : []);
          if (items.length > 0) return getText(question.question) || `Match: ${items[0]}...`;
        }
        return getText(question.question) || 'Match Following Question';
      }
      case 'sequence_order': return getText(question.question) || 'Sequence Order Question';
      case 'statement_based': return getText(question.question) || 'Statement Based Question';
      case 'passage_based': return getText(question.question) || 'Passage-based Question';
      default:
        if (question.questionType?.startsWith('di_')) return getText(question.question) || 'Data Interpretation Question';
        return getText(question.question);
    }
  },

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

  // ═══ NEW: Verification status helpers ═══

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
};

export default questionService;