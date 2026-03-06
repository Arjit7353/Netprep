// client/src/components/test/TestList.jsx
// ⭐ FIXED: PDF button always visible, better question fetching, batch export

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Grid, List, RefreshCw,
  ChevronDown, FileText, AlertCircle, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TestCard from './TestCard';
import PDFExportButton from '../common/PDFExportButton';
import { useTest } from '../../hooks/useTest';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';
import Loader from '../common/Loader';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '';
  return url.replace(/\/api\/?$/, '');
};

const TestList = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const { tests, loading, error, pagination, fetchTests, deleteTest } = useTest();

  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ testType: '', paper: '', status: 'active', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [testQuestions, setTestQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});

  useEffect(() => { loadTests(); }, [filters]);

  useEffect(() => {
    if (tests?.length > 0) fetchAllQuestions();
  }, [tests]);

  const loadTests = async () => {
    try {
      await fetchTests({ ...filters, page: 1, limit: 20 });
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  };

  // ============ FETCH ALL QUESTIONS (Background) ============
  const fetchAllQuestions = async () => {
    const BASE = getBaseUrl();
    const toFetch = tests.filter(t => !testQuestions[t._id]?.length);
    if (!toFetch.length) return;

    const loadMap = {};
    toFetch.forEach(t => { loadMap[t._id] = true; });
    setLoadingQuestions(prev => ({ ...prev, ...loadMap }));

    const results = {};

    await Promise.all(toFetch.map(async (test) => {
      try {
        let fullQ = [];

        // Check if questions already populated
        if (test.questions?.length) {
          const first = test.questions[0];
          if (typeof first === 'object' && first !== null && (first.question || first.options)) {
            fullQ = test.questions;
          } else {
            // Fetch populated test
            try {
              const res = await fetch(`${BASE}/api/tests/${test._id}`, {
                headers: { 'Content-Type': 'application/json' }
              });
              if (res.ok) {
                const data = await res.json();
                const td = data.data || data;
                if (td.questions?.[0]?.question || td.questions?.[0]?.options) {
                  fullQ = td.questions;
                }
              }
            } catch { /* fallback below */ }

            // Bulk fetch fallback
            if (!fullQ.length) {
              const ids = test.questions.map(q => typeof q === 'string' ? q : (q._id || String(q)));
              try {
                const res = await fetch(`${BASE}/api/questions/bulk`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ids })
                });
                if (res.ok) {
                  const data = await res.json();
                  fullQ = data.data || data.questions || [];
                }
              } catch { /* skip */ }
            }
          }
        }

        results[test._id] = fullQ;
      } catch {
        results[test._id] = [];
      }
    }));

    setTestQuestions(prev => ({ ...prev, ...results }));
    const doneMap = {};
    toFetch.forEach(t => { doneMap[t._id] = false; });
    setLoadingQuestions(prev => ({ ...prev, ...doneMap }));
  };

  // Fetch single test questions on demand
  const fetchQuestionsForTest = useCallback(async (testId) => {
    if (testQuestions[testId]?.length) return testQuestions[testId];
    const BASE = getBaseUrl();
    setLoadingQuestions(prev => ({ ...prev, [testId]: true }));

    try {
      const res = await fetch(`${BASE}/api/tests/${testId}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        const td = data.data || data;
        if (td.questions?.[0]?.question || td.questions?.[0]?.options) {
          setTestQuestions(prev => ({ ...prev, [testId]: td.questions }));
          return td.questions;
        }

        // Bulk fetch
        const ids = (td.questions || []).map(q => typeof q === 'string' ? q : q._id);
        if (ids.length) {
          const bulkRes = await fetch(`${BASE}/api/questions/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          if (bulkRes.ok) {
            const bulkData = await bulkRes.json();
            const qs = bulkData.data || bulkData.questions || [];
            setTestQuestions(prev => ({ ...prev, [testId]: qs }));
            return qs;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoadingQuestions(prev => ({ ...prev, [testId]: false }));
    }
    return [];
  }, [testQuestions]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleSearch = (e) => setFilters(prev => ({ ...prev, search: e.target.value }));
  const handleStartTest = (test) => navigate(`/test/${test._id}`);
  const handleEditTest = (test) => navigate(`/tests/edit/${test._id}`);
  const handleDeleteTest = async (test) => {
    const msg = language === 'hi' ? 'क्या आप इस परीक्षा को हटाना चाहते हैं?' : 'Delete this test?';
    if (window.confirm(msg)) {
      try { await deleteTest(test._id); } catch { }
    }
  };
  const clearFilters = () => setFilters({ testType: '', paper: '', status: 'active', search: '' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'परीक्षाएं' : 'Tests'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'hi' ? 'सभी उपलब्ध परीक्षाएं देखें और अभ्यास करें' : 'View and practice all available tests'}
          </p>
        </div>
        <button
          onClick={() => navigate('/tests/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {language === 'hi' ? 'नई परीक्षा बनाएं' : 'Create New Test'}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'परीक्षा खोजें...' : 'Search tests...'}
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${showFilters ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 text-primary-700 dark:text-primary-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <Filter className="w-4 h-4" />
              {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                <Grid className="w-5 h-5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                <List className="w-5 h-5" />
              </button>
            </div>
            <button onClick={loadTests} disabled={loading} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === 'hi' ? 'परीक्षा प्रकार' : 'Test Type'}
              </label>
              <select value={filters.testType} onChange={(e) => handleFilterChange('testType', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">{language === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
                {Object.entries(TEST_TYPE_CONFIG || {}).map(([key, config]) => (
                  <option key={key} value={key}>{language === 'hi' ? config.nameHi : config.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === 'hi' ? 'पेपर' : 'Paper'}
              </label>
              <select value={filters.paper} onChange={(e) => handleFilterChange('paper', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">{language === 'hi' ? 'सभी पेपर' : 'All Papers'}</option>
                {Object.entries(PAPER_LABELS || {}).map(([key, label]) => (
                  <option key={key} value={key}>{language === 'hi' ? label.hi : label.en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {language === 'hi' ? 'स्थिति' : 'Status'}
              </label>
              <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">{language === 'hi' ? 'सभी' : 'All'}</option>
                <option value="active">{language === 'hi' ? 'सक्रिय' : 'Active'}</option>
                <option value="draft">{language === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                <option value="archived">{language === 'hi' ? 'संग्रहीत' : 'Archived'}</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end pt-2">
              <button onClick={clearFilters} className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium hover:underline">
                {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Clear Filters'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {language === 'hi' ? 'परीक्षाएं लोड हो रही हैं...' : 'Loading tests...'}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button onClick={loadTests} className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium">
            {language === 'hi' ? 'पुनः प्रयास' : 'Retry'}
          </button>
        </div>
      )}

      {/* Tests */}
      {!loading && !error && (
        <>
          {tests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {language === 'hi' ? 'कोई परीक्षा नहीं मिली' : 'No tests found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {language === 'hi' ? 'नई परीक्षा बनाने के लिए ऊपर बटन दबाएं' : 'Click the button above to create a new test'}
              </p>
              <button onClick={() => navigate('/tests/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                <Plus className="w-5 h-5" />
                {language === 'hi' ? 'नई परीक्षा बनाएं' : 'Create New Test'}
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {tests.map((test) => (
                <div key={test._id} className="relative">
                  <TestCard
                    test={test}
                    language={language}
                    onStart={handleStartTest}
                    onEdit={handleEditTest}
                    onDelete={handleDeleteTest}
                  />

                  {/* ⭐ PDF BUTTON — ALWAYS VISIBLE (bottom-right of card) */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <PDFExportButton
                      type="test"
                      test={test}
                      questions={testQuestions[test._id] || []}
                      language={language}
                      variant="card"
                      onExportStart={() => {
                        if (!testQuestions[test._id]?.length) {
                          fetchQuestionsForTest(test._id);
                        }
                      }}
                    />
                  </div>

                  {/* Question loading indicator */}
                  {loadingQuestions[test._id] && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <RefreshCw className="w-3 h-3 text-primary-600 animate-spin" />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                          {language === 'hi' ? 'लोड हो रहा...' : 'Loading...'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => fetchTests({ ...filters, page })}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${page === pagination.page ? 'bg-primary-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {page}
                </button>
              ))}
            </div>
          )}

          {tests.length > 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              {language === 'hi' ? `${tests.length} परीक्षाएं मिलीं` : `Found ${tests.length} tests`}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestList;