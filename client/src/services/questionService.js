import { apiHelper } from './api';

const questionService = {
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
      ...(filters.sortOrder && { sortOrder: filters.sortOrder })
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

  // Delete question
  deleteQuestion: async (id) => {
    return apiHelper.delete(`/questions/${id}`);
  },

  // Bulk delete questions
  bulkDeleteQuestions: async (ids) => {
    return apiHelper.delete('/questions', { ids });
  },

  // Import questions from JSON
  importQuestions: async (jsonData) => {
    return apiHelper.post('/questions/import', jsonData);
  },

  // Validate JSON before import
  validateImport: async (jsonData) => {
    return apiHelper.post('/questions/import/validate', jsonData);
  },

  // Get questions by passage
  getQuestionsByPassage: async (passageId) => {
    return apiHelper.get(`/questions/passage/${passageId}`);
  },

  // Get questions by DI data
  getQuestionsByDI: async (diDataId) => {
    return apiHelper.get(`/questions/di/${diDataId}`);
  },

  // === Passage APIs ===
  
  // Get all passages
  getPassages: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.paper && { paper: filters.paper }),
      ...(filters.unit && { unit: filters.unit })
    };
    return apiHelper.get('/questions/passages/list', params);
  },

  // Create passage
  createPassage: async (passageData) => {
    return apiHelper.post('/questions/passages', passageData);
  },

  // Get passage by ID with questions
  getPassageById: async (id) => {
    return apiHelper.get(`/questions/passages/${id}`);
  },

  // === DI Data APIs ===
  
  // Get all DI data
  getDIDataList: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 20,
      ...(filters.paper && { paper: filters.paper }),
      ...(filters.diType && { diType: filters.diType })
    };
    return apiHelper.get('/questions/di-data/list', params);
  },

  // Create DI data
  createDIData: async (diData) => {
    return apiHelper.post('/questions/di-data', diData);
  },

  // Get DI data by ID with questions
  getDIDataById: async (id) => {
    return apiHelper.get(`/questions/di-data/${id}`);
  }
};

export default questionService;