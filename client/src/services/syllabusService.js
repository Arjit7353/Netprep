// client/src/services/syllabusService.js
import { apiHelper } from './api';

// Helper to clear syllabus cache
const clearSyllabusCache = () => {
  try {
    sessionStorage.removeItem('netprep-syllabus');
    sessionStorage.removeItem('netprep-syllabus-timestamp');
    console.log('[SyllabusService] Cache cleared');
  } catch (e) {
    // Ignore
  }
};

const syllabusService = {
  // ═══════════════════════════════════════════════════════════════
  // READ OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  getAllSyllabus: async () => {
    return apiHelper.get('/syllabus');
  },

  getPaper1Syllabus: async () => {
    return apiHelper.get('/syllabus/paper1');
  },

  getPaper2Syllabus: async () => {
    return apiHelper.get('/syllabus/paper2');
  },

  getSyllabus: async (paper) => {
    return apiHelper.get(`/syllabus/${paper}`);
  },

  getUnits: async (paper) => {
    try {
      const response = await apiHelper.get('/syllabus/units', { paper });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching units:', error);
      return [];
    }
  },

  getChapters: async (paper, unitId) => {
    try {
      const response = await apiHelper.get('/syllabus/chapters', { paper, unit: unitId });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  },

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

  searchSyllabus: async (query, paper = null) => {
    const params = { query };
    if (paper) params.paper = paper;
    return apiHelper.get('/syllabus/search', params);
  },

  getSyllabusTree: async (paper) => {
    return apiHelper.get('/syllabus/tree', { paper });
  },

  getSyllabusStats: async (paper) => {
    return apiHelper.get('/syllabus/stats', { paper });
  },

  // ═══════════════════════════════════════════════════════════════
  // WRITE OPERATIONS - WITH CACHE CLEARING
  // ═══════════════════════════════════════════════════════════════

  initializeSyllabus: async (paper) => {
    const result = await apiHelper.post('/syllabus/initialize', { paper });
    clearSyllabusCache();
    return result;
  },

  manageSyllabus: async (data) => {
    const result = await apiHelper.post('/syllabus/manage', data);
    clearSyllabusCache();
    return result;
  },

  // ─── Unit Operations ───────────────────────────────────────────

  addUnit: async (data) => {
    const result = await apiHelper.post('/syllabus/unit', data);
    clearSyllabusCache();
    return result;
  },

  updateUnit: async (unitId, data) => {
    const result = await apiHelper.put(`/syllabus/unit/${unitId}`, data);
    clearSyllabusCache();
    return result;
  },

  deleteUnit: async (unitId, paper) => {
    const result = await apiHelper.delete(`/syllabus/unit/${unitId}?paper=${paper}`);
    clearSyllabusCache();
    return result;
  },

  // ─── Chapter Operations ────────────────────────────────────────

  addChapter: async (data) => {
    const result = await apiHelper.post('/syllabus/chapter', data);
    clearSyllabusCache();
    return result;
  },

  updateChapter: async (chapterId, data) => {
    const result = await apiHelper.put(`/syllabus/chapter/${chapterId}`, data);
    clearSyllabusCache();
    return result;
  },

  deleteChapter: async (chapterId, paper, unitId) => {
    const result = await apiHelper.delete(`/syllabus/chapter/${chapterId}?paper=${paper}&unitId=${unitId}`);
    clearSyllabusCache();
    return result;
  },

  // ─── Topic Operations ──────────────────────────────────────────

  addTopic: async (data) => {
    const result = await apiHelper.post('/syllabus/topic', data);
    clearSyllabusCache();
    return result;
  },

  updateTopic: async (topicId, data) => {
    const result = await apiHelper.put(`/syllabus/topic/${topicId}`, data);
    clearSyllabusCache();
    return result;
  },

  deleteTopic: async (topicId, paper, unitId, chapterId) => {
    const result = await apiHelper.delete(`/syllabus/topic/${topicId}?paper=${paper}&unitId=${unitId}&chapterId=${chapterId}`);
    clearSyllabusCache();
    return result;
  },

  // ─── Subtopic Operations ───────────────────────────────────────

  addSubtopic: async (data) => {
    const result = await apiHelper.post('/syllabus/subtopic', data);
    clearSyllabusCache();
    return result;
  },

  deleteSubtopic: async (paper, unitId, chapterId, topicId, subtopicIndex) => {
    const result = await apiHelper.delete(`/syllabus/subtopic?paper=${paper}&unitId=${unitId}&chapterId=${chapterId}&topicId=${topicId}&subtopicIndex=${subtopicIndex}`);
    clearSyllabusCache();
    return result;
  },

  // ─── Reorder Operations ────────────────────────────────────────

  reorderUnits: async (paper, unitIds) => {
    const result = await apiHelper.put('/syllabus/reorder/units', { paper, unitIds });
    clearSyllabusCache();
    return result;
  },

  // ─── Utility ───────────────────────────────────────────────────
  
  clearCache: clearSyllabusCache
};

export default syllabusService;