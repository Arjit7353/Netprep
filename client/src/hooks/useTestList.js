// client/src/hooks/useTestList.js
// ⭐ FIX: Always fresh filter options, no stale cache
// ⭐ FIX: Proper handling of multi-unit tests (comma-separated)

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import testService from '../services/testService';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '';
  return url.replace(/\/api\/?$/, '');
};

// ⭐ FIX: Helper to parse comma-separated units
const parseUnits = (unitStr) => {
  if (!unitStr) return [];
  return unitStr.split(',').map(u => u.trim()).filter(u => u.length > 0);
};

// ⭐ FIX: Extract unique units from both raw and split values
const extractAllUnits = (countsByUnit = []) => {
  const unitSet = new Set();
  countsByUnit.forEach(item => {
    if (item.unit) unitSet.add(item.unit);
  });
  return Array.from(unitSet);
};

export const useTestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 60 });
  const [filterOptions, setFilterOptions] = useState(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState({
    paper: '', unit: '', chapter: '', topic: '',
    testType: '', search: '', status: 'active',
    sortBy: 'createdAt', sortOrder: 'desc',
  });

  const [selectedTests, setSelectedTests] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [questionsCache, setQuestionsCache] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});

  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  // ── Load Filter Options (NEVER cached) ──
  const loadFilterOptions = useCallback(async () => {
    if (!mountedRef.current) return;
    setFilterOptionsLoading(true);
    try {
      const res = await testService.getFilterOptions({
        paper: filters.paper || undefined,
        unit: filters.unit || undefined,
      });
      if (mountedRef.current) setFilterOptions(res.data);
    } catch (err) {
      console.error('Filter options error:', err);
    } finally {
      if (mountedRef.current) setFilterOptionsLoading(false);
    }
  }, [filters.paper, filters.unit]);

  // ── Load Tests ──
  const loadTests = useCallback(async (page = 1, force = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const params = {
        page, limit: pagination.limit,
        status: filters.status, sortBy: filters.sortBy, sortOrder: filters.sortOrder,
      };
      if (filters.paper) params.paper = filters.paper;
      if (filters.unit) params.unit = filters.unit;
      if (filters.chapter) params.chapter = filters.chapter;
      if (filters.topic) params.topic = filters.topic;
      if (filters.testType) params.testType = filters.testType;
      if (filters.search) params.search = filters.search;

      const result = await testService.getTests(params);
      if (mountedRef.current) {
        setTests(result.data || []);
        setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
      }

      // Pre-fetch PDF questions
      (result.data || []).slice(0, 4).forEach((t) => {
        if (!questionsCache[t._id]) fetchQuestionsForTest(t._id, false);
      });
    } catch (err) {
      if (err.name !== 'AbortError' && mountedRef.current) setError(err.message || 'Failed');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filters, pagination.limit]);

  // ── Load Stats ──
  const loadStats = useCallback(async () => {
    try {
      const res = await testService.getStats();
      if (mountedRef.current) setStats(res.data);
    } catch {}
  }, []);

  // ── Fetch Questions ──
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
          const br = await fetch(`${BASE}/api/questions/bulk`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          });
          if (br.ok) {
            const bd = await br.json();
            const qs = bd.data || bd.questions || [];
            setQuestionsCache((p) => ({ ...p, [testId]: qs }));
            return qs;
          }
        }
      }
      return [];
    } catch { return []; }
    finally { setLoadingQuestions((p) => ({ ...p, [testId]: false })); }
  }, [questionsCache, loadingQuestions]);

  // ── Filter Helpers ──
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'paper') { next.unit = ''; next.chapter = ''; next.topic = ''; }
      else if (key === 'unit') { next.chapter = ''; next.topic = ''; }
      else if (key === 'chapter') { next.topic = ''; }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ paper: '', unit: '', chapter: '', topic: '', testType: '', search: '', status: 'active', sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const hasActiveFilters = useMemo(
    () => !!(filters.paper || filters.unit || filters.chapter || filters.topic || filters.testType || filters.search),
    [filters]
  );

  // ── Bulk ──
  const toggleSelection = useCallback((id) => {
    setSelectedTests((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }, []);
  const selectAll = useCallback(() => {
    setSelectedTests((prev) => (prev.size === tests.length ? new Set() : new Set(tests.map((t) => t._id))));
  }, [tests]);
  const clearSelection = useCallback(() => { setSelectedTests(new Set()); setSelectionMode(false); }, []);
  const bulkDelete = useCallback(async () => {
    if (selectedTests.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selectedTests).map((id) => testService.deleteTest(id)));
      clearSelection();
      setRefreshKey(k => k + 1);
    } catch (err) { throw err; }
    finally { setBulkLoading(false); }
  }, [selectedTests, clearSelection]);

  // ── Computed ──
  const unitsForPaper = useMemo(() => {
    if (!filterOptions?.countsByUnit) return [];
    // ⭐ FIX: Deduplicate units using Set, then sort
    const uniqueUnits = new Set();
    filterOptions.countsByUnit
      .filter((i) => (!filters.paper || i.paper === filters.paper) && i.unit?.trim())
      .forEach((i) => uniqueUnits.add(i.unit));
    
    return Array.from(uniqueUnits)
      .sort((a, b) => {
        const nA = parseInt((a.match(/\d+/) || ['999'])[0]);
        const nB = parseInt((b.match(/\d+/) || ['999'])[0]);
        return nA - nB;
      })
      .map(unit => {
        // Find the corresponding count entry
        const countEntry = filterOptions.countsByUnit.find(
          i => (!filters.paper || i.paper === filters.paper) && i.unit === unit
        );
        return countEntry || { unit, count: 0, paper: filters.paper };
      });
  }, [filterOptions, filters.paper]);

  const testsByType = useMemo(() => {
    const g = {};
    tests.forEach((t) => { const k = t.testType || 'practice'; if (!g[k]) g[k] = []; g[k].push(t); });
    return g;
  }, [tests]);

  // ── Effects ──
  useEffect(() => {
    mountedRef.current = true;
    loadStats();
    loadFilterOptions();
    return () => { mountedRef.current = false; if (abortRef.current) abortRef.current.abort(); };
  }, []);

  // Reload tests when filters or refreshKey change
  useEffect(() => { loadTests(1); }, [filters, refreshKey]);

  // Reload filter options when paper/unit changes or after refresh
  useEffect(() => { loadFilterOptions(); }, [filters.paper, filters.unit, refreshKey]);

  // Also fetch global filter options (no paper/unit filter) for home view counts
  useEffect(() => {
    if (!filters.paper && !filters.unit) {
      loadFilterOptions();
    }
  }, [filters.paper, filters.unit]);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    loadStats();
  }, [loadStats]);

  return {
    tests, loading, error, pagination, filterOptions, filterOptionsLoading, stats,
    filters, updateFilter, clearFilters, hasActiveFilters,
    loadTests, refresh,
    selectedTests, selectionMode, setSelectionMode,
    toggleSelection, selectAll, clearSelection, bulkDelete, bulkLoading,
    questionsCache, loadingQuestions, fetchQuestionsForTest,
    unitsForPaper, testsByType,
  };
};

export default useTestList;