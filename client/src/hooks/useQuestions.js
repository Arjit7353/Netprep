import { useState, useCallback } from 'react';
import questionService from '../services/questionService';

export const useQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);

  // ★ NEW: Staged/preview questions state
  const [stagedQuestions, setStagedQuestions] = useState([]);
  const [stagingStatus, setStagingStatus] = useState('idle'); // idle | parsing | ready | saving | done

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

  // ★ NEW: Stage questions for preview (client-side parse without saving)
  const stageQuestionsForPreview = useCallback((parsedQuestions) => {
    setStagedQuestions(parsedQuestions);
    setStagingStatus('ready');
  }, []);

  // ★ NEW: Update a single staged question
  const updateStagedQuestion = useCallback((index, updatedData) => {
    setStagedQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updatedData, _modified: true };
      return updated;
    });
  }, []);

  // ★ NEW: Remove a staged question
  const removeStagedQuestion = useCallback((index) => {
    setStagedQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ★ NEW: Reorder staged questions
  const reorderStagedQuestions = useCallback((fromIndex, toIndex) => {
    setStagedQuestions(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  // ★ NEW: Mark staged question for skip
  const toggleStagedSkip = useCallback((index) => {
    setStagedQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], _skip: !updated[index]._skip };
      return updated;
    });
  }, []);

  // ★ NEW: Clear staging
  const clearStaging = useCallback(() => {
    setStagedQuestions([]);
    setStagingStatus('idle');
  }, []);

  // ★ NEW: Save staged questions (import only non-skipped ones)
  const saveStagedQuestions = useCallback(async (jsonDataShell) => {
    const toSave = stagedQuestions.filter(q => !q._skip);
    if (toSave.length === 0) return { data: { questions: 0, errors: 0 } };

    setStagingStatus('saving');
    setLoading(true);
    try {
      // Clean internal flags before saving
      const cleanedQuestions = toSave.map(q => {
        const cleaned = { ...q };
        delete cleaned._skip;
        delete cleaned._modified;
        delete cleaned._previewId;
        delete cleaned._quality;
        delete cleaned._qualityIssues;
        delete cleaned._translationStatus;
        return cleaned;
      });

      const importData = {
        ...jsonDataShell,
        questions: cleanedQuestions
      };

      const response = await questionService.importQuestions(importData);
      setStagingStatus('done');
      return response;
    } catch (err) {
      setError(err.message || 'Failed to save staged questions');
      setStagingStatus('ready');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [stagedQuestions]);

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
    clearError,
    // ★ NEW: Staging/Preview exports
    stagedQuestions,
    stagingStatus,
    stageQuestionsForPreview,
    updateStagedQuestion,
    removeStagedQuestion,
    reorderStagedQuestions,
    toggleStagedSkip,
    clearStaging,
    saveStagedQuestions
  };
};

export default useQuestions;