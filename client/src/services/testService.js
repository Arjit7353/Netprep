// client/src/services/testService.js

import api, { apiHelper } from './api';

const testService = {
  async getTests(params = {}) {
    return apiHelper.get('/tests', params);
  },

  async getStats() {
    return apiHelper.get('/tests/stats');
  },

  async getTestTypes() {
    return apiHelper.get('/tests/types');
  },

  async getFilterOptions(params = {}) {
    return apiHelper.get('/tests/filter-options', params);
  },

  async getTestById(id) {
    return apiHelper.get(`/tests/${id}`);
  },

  async getTestWithQuestions(id) {
    return apiHelper.get(`/tests/${id}/questions`);
  },

  async createTest(testData) {
    return apiHelper.post('/tests', testData);
  },

  async generateRandomTest(config) {
    return apiHelper.post('/tests/generate', config);
  },

  async updateTest(id, testData) {
    return apiHelper.put(`/tests/${id}`, testData);
  },

  async updateTestStatus(id, status) {
    return apiHelper.patch(`/tests/${id}/status`, { status });
  },

  async deleteTest(id) {
    return apiHelper.delete(`/tests/${id}`);
  },

  async addQuestions(id, questionIds) {
    return apiHelper.post(`/tests/${id}/add-questions`, { questionIds });
  },

  async removeQuestions(id, questionIds) {
    return apiHelper.post(`/tests/${id}/remove-questions`, { questionIds });
  },

  async getTestAttempts(id) {
    return apiHelper.get(`/tests/${id}/attempts`);
  }
};

export default testService;