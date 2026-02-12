import { apiHelper } from './api';

const syllabusService = {
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
    const response = await apiHelper.get(`/syllabus/${paper}`);
    return response.data?.units || [];
  },

  // Get chapters for a unit
  getChapters: async (paper, unitId) => {
    const response = await apiHelper.get(`/syllabus/${paper}`);
    const unit = response.data?.units?.find(u => u.id === unitId);
    return unit?.chapters || [];
  },

  // Get topics for a chapter
  getTopics: async (paper, unitId, chapterId) => {
    const response = await apiHelper.get(`/syllabus/${paper}`);
    const unit = response.data?.units?.find(u => u.id === unitId);
    const chapter = unit?.chapters?.find(c => c.id === chapterId);
    return chapter?.topics || [];
  }
};

export default syllabusService;