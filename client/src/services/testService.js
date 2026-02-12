import api, { apiHelper } from './api';

const testService = {
  /**
   * Get all tests with filters
   */
  async getTests(params = {}) {
    return apiHelper.get('/tests', params);
  },

  /**
   * Get test statistics
   */
  async getStats() {
    return apiHelper.get('/tests/stats');
  },

  /**
   * Get test type configurations
   */
  async getTestTypes() {
    return apiHelper.get('/tests/types');
  },

  /**
   * Get single test by ID
   */
  async getTestById(id) {
    return apiHelper.get(`/tests/${id}`);
  },

  /**
   * Get test with all questions populated
   */
  async getTestWithQuestions(id) {
    return apiHelper.get(`/tests/${id}/questions`);
  },

  /**
   * Create new test
   */
  async createTest(testData) {
    return apiHelper.post('/tests', testData);
  },

  /**
   * Generate random test (for full mocks)
   */
  async generateRandomTest(config) {
    return apiHelper.post('/tests/generate', config);
  },

  /**
   * Update test
   */
  async updateTest(id, testData) {
    return apiHelper.put(`/tests/${id}`, testData);
  },

  /**
   * Update test status
   */
  async updateTestStatus(id, status) {
    return apiHelper.patch(`/tests/${id}/status`, { status });
  },

  /**
   * Delete/Archive test
   */
  async deleteTest(id) {
    return apiHelper.delete(`/tests/${id}`);
  },

  /**
   * Add questions to test
   */
  async addQuestions(id, questionIds) {
    return apiHelper.post(`/tests/${id}/add-questions`, { questionIds });
  },

  /**
   * Remove questions from test
   */
  async removeQuestions(id, questionIds) {
    return apiHelper.post(`/tests/${id}/remove-questions`, { questionIds });
  },

  /**
   * Get all attempts for a test
   */
  async getTestAttempts(id) {
    return apiHelper.get(`/tests/${id}/attempts`);
  }
};

export default testService;