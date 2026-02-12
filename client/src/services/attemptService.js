import api, { apiHelper } from './api';

const attemptService = {
  // Get all attempts with filters
  getAttempts: async (params = {}) => {
    try {
      const response = await apiHelper.get('/attempts', params);
      return response;
    } catch (error) {
      console.error('Failed to get attempts:', error);
      throw error;
    }
  },

  // Get recent attempts
  getRecentAttempts: async (limit = 10) => {
    try {
      const response = await apiHelper.get('/attempts/recent', { limit });
      return response;
    } catch (error) {
      console.error('Failed to get recent attempts:', error);
      throw error;
    }
  },

  // Get overall statistics
  getStats: async () => {
    try {
      const response = await apiHelper.get('/attempts/stats');
      return response;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },

  // Get single attempt by ID
  getAttemptById: async (attemptId) => {
    try {
      const response = await apiHelper.get(`/attempts/${attemptId}`);
      return response;
    } catch (error) {
      console.error('Failed to get attempt:', error);
      throw error;
    }
  },

  // Get attempt with full solution review
  getAttemptReview: async (attemptId) => {
    try {
      const response = await apiHelper.get(`/attempts/${attemptId}/review`);
      return response;
    } catch (error) {
      console.error('Failed to get attempt review:', error);
      throw error;
    }
  },

  // Start new test attempt
  startAttempt: async (testId) => {
    try {
      const response = await apiHelper.post('/attempts/start', { testId });
      return response;
    } catch (error) {
      console.error('Failed to start attempt:', error);
      throw error;
    }
  },

  // Save answer for a question
  saveAnswer: async (attemptId, questionId, selectedAnswer, timeTaken = 0) => {
    try {
      const response = await apiHelper.put(`/attempts/${attemptId}/answer`, {
        questionId,
        selectedAnswer,
        timeTaken
      });
      return response;
    } catch (error) {
      console.error('Failed to save answer:', error);
      throw error;
    }
  },

  // Toggle mark for review
  toggleMarkForReview: async (attemptId, questionId) => {
    try {
      const response = await apiHelper.put(`/attempts/${attemptId}/mark-review`, {
        questionId
      });
      return response;
    } catch (error) {
      console.error('Failed to toggle mark for review:', error);
      throw error;
    }
  },

  // Mark question as visited
  markVisited: async (attemptId, questionId) => {
    try {
      const response = await apiHelper.put(`/attempts/${attemptId}/visit`, {
        questionId
      });
      return response;
    } catch (error) {
      console.error('Failed to mark visited:', error);
      throw error;
    }
  },

  // Submit test attempt
  submitAttempt: async (attemptId, remainingTime = 0) => {
    try {
      const response = await apiHelper.post(`/attempts/${attemptId}/submit`, {
        remainingTime
      });
      return response;
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      throw error;
    }
  },

  // Pause attempt
  pauseAttempt: async (attemptId, remainingTime, currentQuestionIndex) => {
    try {
      const response = await apiHelper.put(`/attempts/${attemptId}/pause`, {
        remainingTime,
        currentQuestionIndex
      });
      return response;
    } catch (error) {
      console.error('Failed to pause attempt:', error);
      throw error;
    }
  },

  // Resume paused attempt
  resumeAttempt: async (attemptId) => {
    try {
      const response = await apiHelper.put(`/attempts/${attemptId}/resume`);
      return response;
    } catch (error) {
      console.error('Failed to resume attempt:', error);
      throw error;
    }
  },

  // Abandon attempt
  abandonAttempt: async (attemptId) => {
    try {
      const response = await apiHelper.put(`/attempts/${attemptId}/abandon`);
      return response;
    } catch (error) {
      console.error('Failed to abandon attempt:', error);
      throw error;
    }
  },

  // Get attempt status summary
  getAttemptStatus: async (attemptId) => {
    try {
      const response = await apiHelper.get(`/attempts/${attemptId}/status`);
      return response;
    } catch (error) {
      console.error('Failed to get attempt status:', error);
      throw error;
    }
  },

  // Delete attempt
  deleteAttempt: async (attemptId) => {
    try {
      const response = await apiHelper.delete(`/attempts/${attemptId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete attempt:', error);
      throw error;
    }
  },

  // Get attempt history for a specific test
  getTestAttemptHistory: async (testId) => {
    try {
      const response = await apiHelper.get('/attempts', { 
        testId, 
        status: 'completed' 
      });
      return response;
    } catch (error) {
      console.error('Failed to get test attempt history:', error);
      throw error;
    }
  }
};

export default attemptService;