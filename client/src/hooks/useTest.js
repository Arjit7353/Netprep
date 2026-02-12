import { useState, useCallback } from 'react';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

export const useTest = () => {
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch all tests
  const fetchTests = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getTests(filters);
      setTests(response.data || []);
      setPagination(response.pagination || null);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch tests');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch test stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await testService.getStats();
      setStats(response.data || null);
      return response;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      throw err;
    }
  }, []);

  // Get single test
  const getTest = useCallback(async (id, withQuestions = false) => {
    setLoading(true);
    try {
      const response = withQuestions 
        ? await testService.getTestWithQuestions(id)
        : await testService.getTestById(id);
      setCurrentTest(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create test
  const createTest = useCallback(async (testData) => {
    setLoading(true);
    try {
      const response = await testService.createTest(testData);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to create test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate random test
  const generateRandomTest = useCallback(async (config) => {
    setLoading(true);
    try {
      const response = await testService.generateRandomTest(config);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to generate test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update test
  const updateTest = useCallback(async (id, testData) => {
    setLoading(true);
    try {
      const response = await testService.updateTest(id, testData);
      setTests(prev => prev.map(t => t._id === id ? response.data : t));
      return response;
    } catch (err) {
      setError(err.message || 'Failed to update test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete test
  const deleteTest = useCallback(async (id) => {
    setLoading(true);
    try {
      await testService.deleteTest(id);
      setTests(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Start test attempt
  const startTest = useCallback(async (testId) => {
    setLoading(true);
    try {
      const response = await attemptService.startAttempt(testId);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to start test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    tests,
    currentTest,
    loading,
    error,
    pagination,
    stats,
    fetchTests,
    fetchStats,
    getTest,
    createTest,
    generateRandomTest,
    updateTest,
    deleteTest,
    startTest,
    clearError,
    setCurrentTest
  };
};

export default useTest;