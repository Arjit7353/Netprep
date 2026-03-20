import { apiHelper } from './api';

const syllabusService = {
  // ═══════════════════════════════════════════════════════════════
  // READ OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  // Get all syllabus data
  getAllSyllabus: async () => {
    return apiHelper.get('/syllabus');
  },

  // Get Paper 1 syllabus
  getPaper1Syllabus: async () => {
    return apiHelper.get('/syllabus/paper1');
  },

  // Get Paper 2 (History) syllabus
  getPaper2Syllabus: async () => {
    return apiHelper.get('/syllabus/paper2');
  },

  // Get syllabus by paper
  getSyllabus: async (paper) => {
    return apiHelper.get(`/syllabus/${paper}`);
  },

  // Get units for a paper
  getUnits: async (paper) => {
    try {
      const response = await apiHelper.get('/syllabus/units', { paper });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching units:', error);
      return [];
    }
  },

  // Get chapters for a unit
  getChapters: async (paper, unitId) => {
    try {
      const response = await apiHelper.get('/syllabus/chapters', { paper, unit: unitId });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  },

  // Get topics for a chapter
  getTopics: async (paper, unitId, chapterId) => {
    try {
      const response = await apiHelper.get('/syllabus/topics', { 
        paper, 
        unit: unitId, 
        chapter: chapterId 
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
  },

  // Search syllabus
  searchSyllabus: async (query, paper = null) => {
    const params = { query };
    if (paper) params.paper = paper;
    return apiHelper.get('/syllabus/search', params);
  },

  // Get syllabus tree structure
  getSyllabusTree: async (paper) => {
    return apiHelper.get('/syllabus/tree', { paper });
  },

  // Get syllabus statistics
  getSyllabusStats: async (paper) => {
    return apiHelper.get('/syllabus/stats', { paper });
  },

  // ═══════════════════════════════════════════════════════════════
  // WRITE OPERATIONS - SYLLABUS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  // Initialize syllabus from static data
  initializeSyllabus: async (paper) => {
    return apiHelper.post('/syllabus/initialize', { paper });
  },

  // Manage entire syllabus
  manageSyllabus: async (data) => {
    return apiHelper.post('/syllabus/manage', data);
  },

  // ─── Unit Operations ───────────────────────────────────────────

  // Add a new unit
  addUnit: async (data) => {
    return apiHelper.post('/syllabus/unit', data);
  },

  // Update a unit
  updateUnit: async (unitId, data) => {
    return apiHelper.put(`/syllabus/unit/${unitId}`, data);
  },

  // Delete a unit
  deleteUnit: async (unitId, paper) => {
    return apiHelper.delete(`/syllabus/unit/${unitId}?paper=${paper}`);
  },

  // ─── Chapter Operations ────────────────────────────────────────

  // Add a new chapter
  addChapter: async (data) => {
    return apiHelper.post('/syllabus/chapter', data);
  },

  // Update a chapter
  updateChapter: async (chapterId, data) => {
    return apiHelper.put(`/syllabus/chapter/${chapterId}`, data);
  },

  // Delete a chapter
  deleteChapter: async (chapterId, paper, unitId) => {
    return apiHelper.delete(`/syllabus/chapter/${chapterId}?paper=${paper}&unitId=${unitId}`);
  },

  // ─── Topic Operations ──────────────────────────────────────────

  // Add a new topic
  addTopic: async (data) => {
    return apiHelper.post('/syllabus/topic', data);
  },

  // Update a topic
  updateTopic: async (topicId, data) => {
    return apiHelper.put(`/syllabus/topic/${topicId}`, data);
  },

  // Delete a topic
  deleteTopic: async (topicId, paper, unitId, chapterId) => {
    return apiHelper.delete(`/syllabus/topic/${topicId}?paper=${paper}&unitId=${unitId}&chapterId=${chapterId}`);
  },

  // ─── Subtopic Operations ───────────────────────────────────────

  // Add a subtopic
  addSubtopic: async (data) => {
    return apiHelper.post('/syllabus/subtopic', data);
  },

  // Delete a subtopic
  deleteSubtopic: async (paper, unitId, chapterId, topicId, subtopicIndex) => {
    return apiHelper.delete(`/syllabus/subtopic?paper=${paper}&unitId=${unitId}&chapterId=${chapterId}&topicId=${topicId}&subtopicIndex=${subtopicIndex}`);
  },

  // ─── Reorder Operations ────────────────────────────────────────

  // Reorder units
  reorderUnits: async (paper, unitIds) => {
    return apiHelper.put('/syllabus/reorder/units', { paper, unitIds });
  }
};

export default syllabusService;