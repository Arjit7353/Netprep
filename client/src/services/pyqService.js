import { apiHelper } from './api';

const pyqService = {
  // ── Import ──
  importPYQData: async (jsonData, translateEnabled = true) => {
    return apiHelper.post('/pyq/import', { ...jsonData, translateEnabled });
  },

  validatePYQImport: async (jsonData) => {
    return apiHelper.post('/pyq/import/validate', jsonData);
  },

  // ── CRUD ──
  getAllPYQData: async (params = {}) => {
    return apiHelper.get('/pyq', params);
  },

  getPYQDataById: async (id) => {
    return apiHelper.get(`/pyq/${id}`);
  },

  updatePYQData: async (id, data) => {
    return apiHelper.put(`/pyq/${id}`, data);
  },

  deletePYQData: async (id) => {
    return apiHelper.delete(`/pyq/${id}`);
  },

  getAvailableYears: async (paper = null) => {
    const params = paper ? { paper } : {};
    return apiHelper.get('/pyq/years', params);
  },

  // ── NEW: Questions for Create Test ──
  getPYQQuestionsForTest: async (params = {}) => {
    return apiHelper.get('/pyq/questions-for-test', params);
  },

  importPYQToQuestionBank: async (pyqDocId, questionNumbers = [], all = false) => {
    return apiHelper.post('/pyq/import-to-bank', { pyqDocId, questionNumbers, all });
  },

  getPYQFilters: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/filters', { paper });
  },

  // ── Analysis ──
  getOverallStats: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/stats', { paper });
  },

  getMultiYearAnalysis: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/analysis/multi-year', { paper });
  },

  getTopicFrequency: async (paper = 'paper2', level = 'chapter') => {
    return apiHelper.get('/pyq/analysis/topic-frequency', { paper, level });
  },

  getPreparationGaps: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/analysis/gaps', { paper });
  },

  getPredictions: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/analysis/predictions', { paper });
  },

  getUnitComparison: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/analysis/unit-comparison', { paper });
  },

  getQuestionTypeEvolution: async (paper = 'paper2') => {
    return apiHelper.get('/pyq/analysis/question-type-evolution', { paper });
  },

  // ── Helpers ──
  getZoneColor: (zone) => {
    const map = {
      GREEN: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700' },
      RED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
      YELLOW: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700' },
      BLUE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' }
    };
    return map[zone] || map.YELLOW;
  },

  getStatusStyle: (status) => {
    const map = {
      critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', badge: 'bg-red-500', label: 'Critical', labelHi: 'गंभीर' },
      weak: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-500', label: 'Weak', labelHi: 'कमज़ोर' },
      good: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', badge: 'bg-blue-500', label: 'Good', labelHi: 'अच्छा' },
      mastered: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-500', label: 'Mastered', labelHi: 'माहिर' },
      not_started: { color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-700', badge: 'bg-gray-400', label: 'Not Started', labelHi: 'शुरू नहीं' }
    };
    return map[status] || map.not_started;
  },

  getTrendIcon: (trend) => {
    const map = {
      increasing: { icon: 'TrendingUp', color: 'text-red-500' },
      decreasing: { icon: 'TrendingDown', color: 'text-green-500' },
      stable: { icon: 'Minus', color: 'text-gray-400' },
      emerged: { icon: 'Sparkles', color: 'text-purple-500' },
      new: { icon: 'Plus', color: 'text-blue-500' }
    };
    return map[trend] || map.stable;
  },

  getLikelihoodStyle: (likelihood) => {
    const map = {
      very_likely: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Very Likely', labelHi: 'बहुत संभावित' },
      likely: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Likely', labelHi: 'संभावित' },
      possible: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Possible', labelHi: 'संभव' },
      unlikely: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-500 dark:text-gray-400', label: 'Unlikely', labelHi: 'कम संभावना' }
    };
    return map[likelihood] || map.possible;
  }
};

export default pyqService;