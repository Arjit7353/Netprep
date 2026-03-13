import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import testService from '../services/testService';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '';
  return url.replace(/\/api\/?$/, '');
};

export const useTestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 60 });
  const [filterOptions, setFilterOptions] = useState(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState({
    paper: '',
    unit: '',
    chapter: '',
    topic: '',
    testType: '',
    search: '',
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [selectedTests, setSelectedTests] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [questionsCache, setQuestionsCache] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});

  const abortRef = useRef(null);
  const testsCacheRef = useRef({});
  const filtersCacheRef = useRef({});

  // ── Load Tests ──
  const loadTests = useCallback(async (page = 1, force = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const cacheKey = JSON.stringify({ ...filters, page });
    if (!force && testsCacheRef.current[cacheKey]) {
      const c = testsCacheRef.current[cacheKey];
      if (Date.now() - c.ts < 25000) {
        setTests(c.data);
        setPagination(c.pagination);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pagination.limit,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.paper) params.paper = filters.paper;
      if (filters.unit) params.unit = filters.unit;
      if (filters.chapter) params.chapter = filters.chapter;
      if (filters.topic) params.topic = filters.topic;
      if (filters.testType) params.testType = filters.testType;
      if (filters.search) params.search = filters.search;

      const result = await testService.getTests(params);
      const data = result.data || [];
      const pg = result.pagination || { page: 1, pages: 1, total: 0 };

      testsCacheRef.current[cacheKey] = { data, pagination: pg, ts: Date.now() };
      setTests(data);
      setPagination(pg);

      data.slice(0, 4).forEach((t) => {
        if (!questionsCache[t._id]) fetchQuestionsForTest(t._id, false);
      });
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // ── Load Filter Options ──
  const loadFilterOptions = useCallback(async () => {
    const cacheKey = `${filters.paper}|${filters.unit}`;
    if (filtersCacheRef.current[cacheKey] && Date.now() - filtersCacheRef.current[cacheKey].ts < 20000) {
      setFilterOptions(filtersCacheRef.current[cacheKey].data);
      return;
    }

    setFilterOptionsLoading(true);
    try {
      const res = await testService.getFilterOptions({
        paper: filters.paper || undefined,
        unit: filters.unit || undefined,
      });
      filtersCacheRef.current[cacheKey] = { data: res.data, ts: Date.now() };
      setFilterOptions(res.data);
    } catch (err) {
      console.error('Filter options error:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, [filters.paper, filters.unit]);

  // ── Load Stats ──
  const loadStats = useCallback(async () => {
    try {
      const res = await testService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  // ── Fetch Questions for PDF ──
  const fetchQuestionsForTest = useCallback(async (testId, showLoader = true) => {
    if (questionsCache[testId]?.length > 0) return questionsCache[testId];
    if (loadingQuestions[testId]) return [];
    if (showLoader) setLoadingQuestions((p) => ({ ...p, [testId]: true }));

    const BASE = getBaseUrl();
    try {
      const res = await fetch(`${BASE}/api/tests/${testId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const td = data.data || data;

      if (td.questions?.length > 0) {
        const first = td.questions[0];
        if (typeof first === 'object' && first !== null && (first.question || first.options)) {
          setQuestionsCache((p) => ({ ...p, [testId]: td.questions }));
          return td.questions;
        }

        const ids = td.questions.map((q) => (typeof q === 'string' ? q : q._id || String(q)));
        if (ids.length > 0) {
          const bulkRes = await fetch(`${BASE}/api/questions/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          });
          if (bulkRes.ok) {
            const bd = await bulkRes.json();
            const qs = bd.data || bd.questions || [];
            setQuestionsCache((p) => ({ ...p, [testId]: qs }));
            return qs;
          }
        }
      }
      return [];
    } catch {
      return [];
    } finally {
      setLoadingQuestions((p) => ({ ...p, [testId]: false }));
    }
  }, [questionsCache, loadingQuestions]);

  // ── Filter Helpers ──
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'paper') {
        next.unit = '';
        next.chapter = '';
        next.topic = '';
      } else if (key === 'unit') {
        next.chapter = '';
        next.topic = '';
      } else if (key === 'chapter') {
        next.topic = '';
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      paper: '',
      unit: '',
      chapter: '',
      topic: '',
      testType: '',
      search: '',
      status: 'active',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }, []);

  const hasActiveFilters = useMemo(
    () => !!(filters.paper || filters.unit || filters.chapter || filters.topic || filters.testType || filters.search),
    [filters]
  );

  // ── Bulk Operations ──
  const toggleSelection = useCallback((id) => {
    setSelectedTests((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedTests((prev) => (prev.size === tests.length ? new Set() : new Set(tests.map((t) => t._id))));
  }, [tests]);

  const clearSelection = useCallback(() => {
    setSelectedTests(new Set());
    setSelectionMode(false);
  }, []);

  const bulkDelete = useCallback(async () => {
    if (selectedTests.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedTests).map((id) => testService.deleteTest(id)));
      clearSelection();
      loadTests(pagination.page, true);
    } catch (err) {
      throw err;
    } finally {
      setBulkLoading(false);
    }
  }, [selectedTests, clearSelection, loadTests, pagination.page]);

  // ── Computed ──
  const unitsForPaper = useMemo(() => {
    if (!filterOptions?.countsByUnit) return [];
    return filterOptions.countsByUnit
      .filter((i) => {
        if (!filters.paper) return true;
        return i.paper === filters.paper;
      })
      .filter((i) => i.unit && i.unit.trim() !== '')
      .sort((a, b) => {
        const numA = parseInt((a.unit.match(/\d+/) || ['999'])[0]);
        const numB = parseInt((b.unit.match(/\d+/) || ['999'])[0]);
        return numA - numB;
      });
  }, [filterOptions, filters.paper]);

  const testsByType = useMemo(() => {
    const g = {};
    tests.forEach((t) => {
      const k = t.testType || 'practice';
      if (!g[k]) g[k] = [];
      g[k].push(t);
    });
    return g;
  }, [tests]);

  // ── Effects ──
  useEffect(() => {
    loadTests(1);
  }, [filters]);

  useEffect(() => {
    loadFilterOptions();
  }, [filters.paper, filters.unit]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    tests,
    loading,
    error,
    pagination,
    filterOptions,
    filterOptionsLoading,
    stats,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    loadTests,
    refresh: () => {
      filtersCacheRef.current = {};
      testsCacheRef.current = {};
      loadFilterOptions();
      loadTests(pagination.page, true);
    },
    selectedTests,
    selectionMode,
    setSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkDelete,
    bulkLoading,
    questionsCache,
    loadingQuestions,
    fetchQuestionsForTest,
    unitsForPaper,
    testsByType,
  };
};

export default useTestList;