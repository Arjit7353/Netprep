import { useState, useCallback } from 'react';
import questionService from '../services/questionService';

export const useQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch questions with filters
  const fetchQuestions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionService.getQuestions(filters);
      setQuestions(response.data || []);
      setPagination(response.pagination || null);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch questions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch question stats
  const fetchStats = useCallback(async (paper = null) => {
    try {
      const response = await questionService.getStats(paper);
      setStats(response.data || null);
      return response;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      throw err;
    }
  }, []);

  // Get single question
  const getQuestion = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await questionService.getQuestionById(id);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch question');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create question
  const createQuestion = useCallback(async (questionData) => {
    setLoading(true);
    try {
      const response = await questionService.createQuestion(questionData);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to create question');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update question
  const updateQuestion = useCallback(async (id, questionData) => {
    setLoading(true);
    try {
      const response = await questionService.updateQuestion(id, questionData);
      // Update local state
      setQuestions(prev => 
        prev.map(q => q._id === id ? response.data : q)
      );
      return response;
    } catch (err) {
      setError(err.message || 'Failed to update question');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete question
  const deleteQuestion = useCallback(async (id) => {
    setLoading(true);
    try {
      await questionService.deleteQuestion(id);
      // Remove from local state
      setQuestions(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete question');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk delete questions
  const bulkDeleteQuestions = useCallback(async (ids) => {
    setLoading(true);
    try {
      await questionService.bulkDeleteQuestions(ids);
      // Remove from local state
      setQuestions(prev => prev.filter(q => !ids.includes(q._id)));
    } catch (err) {
      setError(err.message || 'Failed to delete questions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Import questions
  const importQuestions = useCallback(async (jsonData) => {
    setLoading(true);
    try {
      const response = await questionService.importQuestions(jsonData);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to import questions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate import
  const validateImport = useCallback(async (jsonData) => {
    try {
      const response = await questionService.validateImport(jsonData);
      return response;
    } catch (err) {
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    questions,
    loading,
    error,
    pagination,
    stats,
    fetchQuestions,
    fetchStats,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    bulkDeleteQuestions,
    importQuestions,
    validateImport,
    clearError
  };
};

export default useQuestions;