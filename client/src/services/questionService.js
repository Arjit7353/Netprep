import { apiHelper } from './api';

const questionService = {
  // ============================================================
  // QUESTION APIs
  // ============================================================

  // Get all questions with filters
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

  // Get question statistics
  getStats: async (paper = null) => {
    const params = paper ? { paper } : {};
    return apiHelper.get('/questions/stats', params);
  },

  // Get single question by ID
  getQuestionById: async (id) => {
    return apiHelper.get(`/questions/${id}`);
  },

  // Create new question
  createQuestion: async (questionData) => {
    return apiHelper.post('/questions', questionData);
  },

  // Update question
  updateQuestion: async (id, questionData) => {
    return apiHelper.put(`/questions/${id}`, questionData);
  },

  // Delete question (soft delete)
  deleteQuestion: async (id) => {
    return apiHelper.delete(`/questions/${id}`);
  },

  // Bulk delete questions
  bulkDeleteQuestions: async (ids) => {
    // ✅ FIX: Use POST with _method override or proper bulk endpoint
    return apiHelper.post('/questions/bulk-delete', { ids });
  },

  // ============================================================
  // IMPORT APIs - ✅ FIXED
  // ============================================================

  // Import questions from JSON (Smart Parser)
  // ✅ Properly handles skipDuplicates flag
  importQuestions: async (jsonData, options = {}) => {
    const { skipDuplicates = true } = options;
    
    // Extract skipDuplicates from jsonData if passed there
    const shouldSkip = jsonData._skipDuplicates ?? skipDuplicates;
    
    // Clean jsonData - remove internal flag
    const cleanData = { ...jsonData };
    delete cleanData._skipDuplicates;
    
    // Pass skipDuplicates as query parameter
    const url = shouldSkip 
      ? '/questions/import?skipDuplicates=true'
      : '/questions/import';
    
    return apiHelper.post(url, cleanData);
  },

  // Validate JSON before import
  validateImport: async (jsonData) => {
    return apiHelper.post('/questions/import/validate', jsonData);
  },

  // ============================================================
  // PASSAGE APIs
  // ============================================================

  // Get all passages with filters
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

  // Create passage manually
  createPassage: async (passageData) => {
    return apiHelper.post('/questions/passages', passageData);
  },

  // Get passage by ID with all linked questions
  getPassageById: async (id) => {
    return apiHelper.get(`/questions/passages/${id}`);
  },

  // Get questions by passage ID
  getQuestionsByPassage: async (passageId) => {
    return apiHelper.get(`/questions/passage/${passageId}`);
  },

  // Update passage
  updatePassage: async (id, passageData) => {
    return apiHelper.put(`/questions/passages/${id}`, passageData);
  },

  // Delete passage
  deletePassage: async (id) => {
    return apiHelper.delete(`/questions/passages/${id}`);
  },

  // ============================================================
  // DI DATA APIs
  // ============================================================

  // Get all DI data with filters
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

  // Create DI data manually
  createDIData: async (diData) => {
    return apiHelper.post('/questions/di-data', diData);
  },

  // Get DI data by ID with all linked questions
  getDIDataById: async (id) => {
    return apiHelper.get(`/questions/di-data/${id}`);
  },

  // Get questions by DI data ID
  getQuestionsByDI: async (diDataId) => {
    return apiHelper.get(`/questions/di/${diDataId}`);
  },

  // Update DI data
  updateDIData: async (id, diData) => {
    return apiHelper.put(`/questions/di-data/${id}`, diData);
  },

  // Delete DI data
  deleteDIData: async (id) => {
    return apiHelper.delete(`/questions/di-data/${id}`);
  },

  // ============================================================
  // TEST GENERATION APIs
  // ============================================================

  // Get random questions for test generation
  getRandomQuestions: async (config) => {
    return apiHelper.post('/questions/random', config);
  },

  // Get questions for full mock (random per unit)
  getFullMockQuestions: async (paper, questionsPerUnit = 5) => {
    return apiHelper.get('/questions/full-mock', { paper, questionsPerUnit });
  },

  // ============================================================
  // ANALYTICS APIs
  // ============================================================

  // Update question accuracy after attempt
  updateAccuracy: async (id, isCorrect) => {
    return apiHelper.patch(`/questions/${id}/accuracy`, { isCorrect });
  },

  // Get questions by difficulty
  getByDifficulty: async (difficulty, paper = null) => {
    const params = { difficulty, ...(paper && { paper }) };
    return apiHelper.get('/questions', params);
  },

  // Get questions by unit
  getByUnit: async (unit, paper) => {
    const params = { unit, ...(paper && { paper }) };
    return apiHelper.get('/questions', params);
  },

  // Get PYQ questions
  getPYQQuestions: async (year, paper = null, session = null) => {
    const params = {
      isPYQ: true,
      ...(year && { year }),
      ...(paper && { paper }),
      ...(session && { pyqSession: session })
    };
    return apiHelper.get('/questions', params);
  },

  // Search questions
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

  // Get question type label
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

  // Get difficulty label
  getDifficultyLabel: (difficulty, language = 'hi') => {
    const labels = {
      easy: { hi: 'सरल', en: 'Easy' },
      medium: { hi: 'मध्यम', en: 'Medium' },
      hard: { hi: 'कठिन', en: 'Hard' }
    };
    return labels[difficulty]?.[language] || difficulty;
  },

  // Check if question type is DI
  isDIType: (type) => {
    return type?.startsWith('di_');
  },

  // Check if question type needs passage
  isPassageType: (type) => {
    return type === 'passage_based';
  },

  // Get all question types
  getAllQuestionTypes: () => {
    return [
      'mcq',
      'assertion_reason',
      'match_following',
      'sequence_order',
      'statement_based',
      'passage_based',
      'di_table',
      'di_bar_chart',
      'di_pie_chart',
      'di_line_graph',
      'di_mixed',
      'di_caselet'
    ];
  },

  // Get DI types only
  getDITypes: () => {
    return [
      'di_table',
      'di_bar_chart',
      'di_pie_chart',
      'di_line_graph',
      'di_mixed',
      'di_caselet'
    ];
  },

  // Format question for display
  formatQuestionPreview: (question, language = 'hi') => {
    if (!question) return '';

    const getText = (field) => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      return field[language] || field.hi || field.en || '';
    };

    switch (question.questionType) {
      case 'assertion_reason':
        return getText(question.assertionReasonData?.assertion) || 
               getText(question.question) ||
               'Assertion-Reason Question';
      
      case 'match_following':
        const listA = question.matchData?.listA;
        if (listA) {
          const items = typeof listA === 'object' && !Array.isArray(listA)
            ? (listA[language] || listA.hi || listA.en || [])
            : (Array.isArray(listA) ? listA : []);
          if (items.length > 0) {
            return getText(question.question) || `Match: ${items[0]}...`;
          }
        }
        return getText(question.question) || 'Match Following Question';
      
      case 'sequence_order':
        return getText(question.question) || 'Sequence Order Question';
      
      case 'statement_based':
        return getText(question.question) || 'Statement Based Question';
      
      case 'passage_based':
        return getText(question.question) || 'Passage-based Question';
      
      default:
        if (question.questionType?.startsWith('di_')) {
          return getText(question.question) || 'Data Interpretation Question';
        }
        return getText(question.question);
    }
  },

  // Get question type color for UI
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

  // Get difficulty color for UI
  getDifficultyColor: (difficulty) => {
    const colors = {
      easy: { bg: 'bg-green-100', text: 'text-green-700' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      hard: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    return colors[difficulty] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
};

export default questionService;