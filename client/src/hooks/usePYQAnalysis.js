// client/src/hooks/usePYQAnalysis.js
// FIXED: Anti-duplicate logic was too aggressive
import { useState, useCallback, useRef } from 'react';
import pyqService from '../services/pyqService';

export const usePYQAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [years, setYears] = useState([]);
  const [yearData, setYearData] = useState(null);
  const [multiYear, setMultiYear] = useState(null);
  const [topicFrequency, setTopicFrequency] = useState(null);
  const [gaps, setGaps] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [unitComparison, setUnitComparison] = useState(null);
  const [typeEvolution, setTypeEvolution] = useState(null);
  const [pyqQuestions, setPyqQuestions] = useState([]);
  const [pyqFilters, setPyqFilters] = useState(null);

  // Anti-duplicate: only for import, not for fetches
  const importingRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const withLoading = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err?.message || err?.data?.message || 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getOverallStats(paper);
      setStats(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchYears = useCallback(async (paper = null) => {
    return withLoading(async () => {
      const res = await pyqService.getAvailableYears(paper);
      setYears(res.data || []);
      return res.data;
    });
  }, [withLoading]);

  const fetchYearData = useCallback(async (id) => {
    return withLoading(async () => {
      const res = await pyqService.getPYQDataById(id);
      setYearData(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchMultiYear = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getMultiYearAnalysis(paper);
      setMultiYear(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchTopicFrequency = useCallback(async (paper = 'paper2', level = 'chapter') => {
    return withLoading(async () => {
      const res = await pyqService.getTopicFrequency(paper, level);
      setTopicFrequency(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchGaps = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getPreparationGaps(paper);
      setGaps(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchPredictions = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getPredictions(paper);
      setPredictions(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchUnitComparison = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getUnitComparison(paper);
      setUnitComparison(res.data);
      return res.data;
    });
  }, [withLoading]);

  const fetchTypeEvolution = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getQuestionTypeEvolution(paper);
      setTypeEvolution(res.data);
      return res.data;
    });
  }, [withLoading]);

  // IMPORT — with anti-duplicate protection
  const importData = useCallback(async (jsonData, translateEnabled = true) => {
    if (importingRef.current) {
      console.log('[usePYQ] Import already in progress, returning existing promise');
      return;
    }
    importingRef.current = true;
    
    try {
      const res = await withLoading(async () => {
        return await pyqService.importPYQData(jsonData, translateEnabled);
      });
      return res;
    } finally {
      importingRef.current = false;
    }
  }, [withLoading]);

  const validateImport = useCallback(async (jsonData) => {
    return withLoading(async () => {
      const res = await pyqService.validatePYQImport(jsonData);
      return res;
    });
  }, [withLoading]);

  const deleteData = useCallback(async (id) => {
    return withLoading(async () => {
      const res = await pyqService.deletePYQData(id);
      setYears(prev => prev.filter(y => y.id !== id));
      return res;
    });
  }, [withLoading]);

  const fetchPYQQuestions = useCallback(async (params = {}) => {
    return withLoading(async () => {
      const res = await pyqService.getPYQQuestionsForTest(params);
      setPyqQuestions(res.data || []);
      return res;
    });
  }, [withLoading]);

  const fetchPYQFilters = useCallback(async (paper = 'paper2') => {
    return withLoading(async () => {
      const res = await pyqService.getPYQFilters(paper);
      setPyqFilters(res.data || null);
      return res.data;
    });
  }, [withLoading]);

  const importPYQToBank = useCallback(async (pyqDocId, questionNumbers = [], all = false) => {
    return withLoading(async () => {
      const res = await pyqService.importPYQToQuestionBank(pyqDocId, questionNumbers, all);
      return res;
    });
  }, [withLoading]);

  return {
    loading, error, stats, years, yearData,
    multiYear, topicFrequency, gaps, predictions,
    unitComparison, typeEvolution,
    pyqQuestions, pyqFilters,
    fetchStats, fetchYears, fetchYearData,
    fetchMultiYear, fetchTopicFrequency,
    fetchGaps, fetchPredictions,
    fetchUnitComparison, fetchTypeEvolution,
    importData, validateImport, deleteData,
    clearError,
    fetchPYQQuestions, fetchPYQFilters, importPYQToBank
  };
};

export default usePYQAnalysis;