import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  ClipboardList, PlusCircle, Search, Play, Clock, FileQuestion,
  X, RefreshCw, Calendar, Eye, Trash2, SlidersHorizontal, ChevronDown,
  ChevronUp, BarChart3, BookOpen, Layers, Hash, ArrowUpDown, Info
} from 'lucide-react';
import testService from '../services/testService';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../utils/constants';

// ─── Type badge colors ───
const TYPE_COLORS = {
  dpp: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  topic_test: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  chapter_test: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  unit_test: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  pyq_year: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  practice: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  full_mock_p1: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  full_mock_p2: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  full_mock_combined: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const PAPER_BADGES = {
  paper1: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  paper2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  combined: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

const TestListPage = ({ language: globalLanguage = 'en', setLanguage: setGlobalLanguage }) => {
  const navigate = useNavigate();
  const language = globalLanguage || 'en';

  // ─── State ───
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterOptions, setFilterOptions] = useState(null);
  const [filterLoading, setFilterLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    paper: '',
    testType: '',
    unit: '',
    chapter: '',
    topic: '',
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  // ─── Load filter options ───
  const loadFilterOptions = useCallback(async () => {
    setFilterLoading(true);
    try {
      const res = await testService.getFilterOptions({
        paper: filters.paper || undefined,
        testType: filters.testType || undefined,
        unit: filters.unit || undefined,
      });
      setFilterOptions(res.data);
    } catch (e) {
      console.error('Failed to load filter options:', e);
    } finally {
      setFilterLoading(false);
    }
  }, [filters.paper, filters.testType, filters.unit]);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  // ─── Load tests ───
  const loadTests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 30,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.paper) params.paper = filters.paper;
      if (filters.testType) params.testType = filters.testType;
      if (filters.status) params.status = filters.status;
      if (filters.unit) params.unit = filters.unit;
      if (filters.chapter) params.chapter = filters.chapter;
      if (filters.topic) params.topic = filters.topic;
      if (debouncedSearch) params.search = debouncedSearch;

      const result = await testService.getTests(params);
      setTests(result.data || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.paper, filters.testType, filters.status, filters.unit, filters.chapter, filters.topic, filters.sortBy, filters.sortOrder, debouncedSearch]);

  useEffect(() => { loadTests(); }, [loadTests]);

  // ─── Helpers ───
  const updateFilter = (key, value) => {
    setFilters((p) => {
      const updated = { ...p, [key]: value };
      // Cascading reset
      if (key === 'paper') { updated.unit = ''; updated.chapter = ''; updated.topic = ''; }
      if (key === 'unit') { updated.chapter = ''; updated.topic = ''; }
      if (key === 'chapter') { updated.topic = ''; }
      return updated;
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '', paper: '', testType: '', unit: '', chapter: '', topic: '',
      status: 'active', sortBy: 'createdAt', sortOrder: 'desc',
    });
  };

  const activeFilterCount = [
    filters.paper, filters.testType, filters.unit, filters.chapter, filters.topic,
    filters.status !== 'active' ? filters.status : '',
  ].filter(Boolean).length;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const cfg = (t) => TEST_TYPE_CONFIG[t] || {};

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(language === 'hi' ? 'क्या आप इसे archive करना चाहते हैं?' : 'Archive this test?')) return;
    try { await testService.deleteTest(id); loadTests(); } catch {}
  };

  // ─── Counts ───
  const countsByType = filterOptions?.countsByType || {};
  const countsByPaper = filterOptions?.countsByPaper || {};
  const countsByUnit = filterOptions?.countsByUnit || [];

  const totalActive = Object.values(countsByPaper).reduce((s, c) => s + c, 0);

  // ─── Text ───
  const t = {
    title: { en: 'All Tests', hi: 'सभी परीक्षाएं' },
    search: { en: 'Search tests...', hi: 'परीक्षा खोजें...' },
    create: { en: 'Create Test', hi: 'टेस्ट बनाएं' },
    noTests: { en: 'No tests found', hi: 'कोई परीक्षा नहीं मिली' },
    allPapers: { en: 'All Papers', hi: 'सभी पेपर' },
    allTypes: { en: 'All Types', hi: 'सभी प्रकार' },
    allUnits: { en: 'All Units', hi: 'सभी इकाइयां' },
    allChapters: { en: 'All Chapters', hi: 'सभी अध्याय' },
    allTopics: { en: 'All Topics', hi: 'सभी विषय' },
    filters: { en: 'Filters', hi: 'फ़िल्टर' },
    clear: { en: 'Clear All', hi: 'सब हटाएं' },
    start: { en: 'Start', hi: 'शुरू' },
    questions: { en: 'Questions', hi: 'प्रश्न' },
    min: { en: 'min', hi: 'मिनट' },
    attempts: { en: 'attempts', hi: 'प्रयास' },
    found: { en: 'tests found', hi: 'परीक्षाएं मिलीं' },
    stats: { en: 'Quick Stats', hi: 'त्वरित आंकड़े' },
    testsIn: { en: 'tests in', hi: 'टेस्ट' },
    sort: { en: 'Sort', hi: 'क्रम' },
  };

  return (
    <Layout language={language} setLanguage={setGlobalLanguage}>
      {() => (
        <div className="space-y-5">
          {/* ═══ HEADER ═══ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ClipboardList className="w-7 h-7 text-primary-600" />
                {t.title[language]}
              </h1>
              <p className="text-gray-500 dark:text-secondary-400 mt-1 text-sm">
                {pagination.total} {t.found[language]}
                {activeFilterCount > 0 && (
                  <span className="ml-2 text-primary-600 dark:text-primary-400">
                    ({activeFilterCount} {language === 'hi' ? 'फ़िल्टर लागू' : 'filters active'})
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadTests()} className="btn-secondary px-3 py-2.5">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/tests/create')} className="btn-primary px-5 py-2.5 text-sm">
                <PlusCircle className="w-4 h-4" />
                {t.create[language]}
              </button>
            </div>
          </div>

          {/* ═══ QUICK STATS CARDS ═══ */}
          <div>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-secondary-400 mb-3 hover:text-primary-600 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              {t.stats[language]}
              {showStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showStats && filterOptions && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-slide-down">
                {/* Paper counts */}
                {Object.entries(countsByPaper).map(([paper, count]) => (
                  <button
                    key={paper}
                    onClick={() => updateFilter('paper', filters.paper === paper ? '' : paper)}
                    className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      filters.paper === paper
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                        : 'border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                    }`}
                  >
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                    <div className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5">
                      {PAPER_LABELS[paper]?.[language] || paper}
                    </div>
                  </button>
                ))}

                {/* Total */}
                <button
                  onClick={() => updateFilter('paper', '')}
                  className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                    !filters.paper
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                      : 'border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                  }`}
                >
                  <div className="text-2xl font-bold text-primary-600">{totalActive}</div>
                  <div className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5">
                    {language === 'hi' ? 'कुल परीक्षाएं' : 'Total Tests'}
                  </div>
                </button>

                {/* Type-wise mini badges */}
                {Object.entries(countsByType)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => updateFilter('testType', filters.testType === type ? '' : type)}
                      className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                        filters.testType === type
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                          : 'border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-2xs font-bold rounded ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
                          {cfg(type).shortCode || type}
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{count}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-secondary-400 mt-1 truncate">
                        {language === 'hi' ? cfg(type).nameHi : cfg(type).name}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* ═══ UNIT-WISE SUMMARY (collapsible) ═══ */}
          {showStats && countsByUnit.length > 0 && (
            <div className="card p-4 animate-slide-down">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-secondary-300 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {language === 'hi' ? 'इकाई-वार परीक्षाएं' : 'Tests by Unit'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {countsByUnit.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      updateFilter('paper', item.paper);
                      setTimeout(() => updateFilter('unit', item.unit), 50);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.unit === item.unit && filters.paper === item.paper
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-2xs font-bold ${PAPER_BADGES[item.paper] || 'bg-gray-200 text-gray-600'}`}>
                      {item.paper === 'paper1' ? '1' : '2'}
                    </span>
                    <span className="truncate max-w-[120px]">{item.unit}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/30 dark:bg-black/20 text-2xs font-bold">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FILTER BAR ═══ */}
          <div className="card p-4 space-y-4">
            {/* Row 1: Search + main filters */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder={t.search[language]}
                  className="input pl-10"
                />
                {filters.search && (
                  <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Paper dropdown */}
              <select value={filters.paper} onChange={(e) => updateFilter('paper', e.target.value)} className="input w-full lg:w-44">
                <option value="">{t.allPapers[language]}</option>
                <option value="paper1">
                  {language === 'hi' ? 'पेपर 1 - सामान्य' : 'Paper 1 - General'}
                  {countsByPaper.paper1 ? ` (${countsByPaper.paper1})` : ''}
                </option>
                <option value="paper2">
                  {language === 'hi' ? 'पेपर 2 - इतिहास' : 'Paper 2 - History'}
                  {countsByPaper.paper2 ? ` (${countsByPaper.paper2})` : ''}
                </option>
                <option value="combined">
                  {language === 'hi' ? 'संयुक्त' : 'Combined'}
                  {countsByPaper.combined ? ` (${countsByPaper.combined})` : ''}
                </option>
              </select>

              {/* Type dropdown */}
              <select value={filters.testType} onChange={(e) => updateFilter('testType', e.target.value)} className="input w-full lg:w-52">
                <option value="">{t.allTypes[language]}</option>
                {Object.entries(TEST_TYPE_CONFIG).map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.shortCode} - {language === 'hi' ? c.nameHi : c.name}
                    {countsByType[key] ? ` (${countsByType[key]})` : ''}
                  </option>
                ))}
              </select>

              {/* Advanced filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary px-4 py-2.5 text-sm whitespace-nowrap gap-2 ${
                  showFilters || activeFilterCount > 0 ? 'bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700' : ''
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">{t.filters[language]}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Row 2: Advanced cascading dropdowns */}
            {showFilters && (
              <div className="flex flex-col lg:flex-row gap-3 pt-3 border-t border-gray-200 dark:border-secondary-700 animate-slide-down">
                {/* Unit dropdown */}
                <select value={filters.unit} onChange={(e) => updateFilter('unit', e.target.value)} className="input flex-1">
                  <option value="">{t.allUnits[language]}</option>
                  {(filterOptions?.units || []).map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>

                {/* Chapter dropdown */}
                <select
                  value={filters.chapter}
                  onChange={(e) => updateFilter('chapter', e.target.value)}
                  className="input flex-1"
                  disabled={!filters.unit && (filterOptions?.chapters || []).length === 0}
                >
                  <option value="">{t.allChapters[language]}</option>
                  {(filterOptions?.chapters || []).map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>

                {/* Topic dropdown */}
                <select
                  value={filters.topic}
                  onChange={(e) => updateFilter('topic', e.target.value)}
                  className="input flex-1"
                  disabled={(filterOptions?.topics || []).length === 0}
                >
                  <option value="">{t.allTopics[language]}</option>
                  {(filterOptions?.topics || []).map((tp) => (
                    <option key={tp} value={tp}>{tp}</option>
                  ))}
                </select>

                {/* Status */}
                <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="input w-full lg:w-32">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                  <option value="">All</option>
                </select>

                {/* Sort */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setFilters((p) => ({ ...p, sortBy: by, sortOrder: order }));
                  }}
                  className="input w-full lg:w-44"
                >
                  <option value="createdAt-desc">{language === 'hi' ? 'नवीनतम पहले' : 'Newest first'}</option>
                  <option value="createdAt-asc">{language === 'hi' ? 'पुराने पहले' : 'Oldest first'}</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="totalQuestions-desc">{language === 'hi' ? 'सबसे अधिक प्रश्न' : 'Most Questions'}</option>
                  <option value="totalAttempts-desc">{language === 'hi' ? 'सबसे अधिक प्रयास' : 'Most Attempts'}</option>
                </select>

                {/* Clear */}
                <button onClick={clearFilters} className="btn-secondary px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-1">
                  <X className="w-4 h-4" /> {t.clear[language]}
                </button>
              </div>
            )}

            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-gray-500">{language === 'hi' ? 'फ़िल्टर:' : 'Filters:'}</span>
                {filters.paper && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs rounded-full">
                    {PAPER_LABELS[filters.paper]?.[language] || filters.paper}
                    <button onClick={() => updateFilter('paper', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.testType && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    {cfg(filters.testType).shortCode} - {language === 'hi' ? cfg(filters.testType).nameHi : cfg(filters.testType).name}
                    <button onClick={() => updateFilter('testType', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.unit && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    {filters.unit}
                    <button onClick={() => updateFilter('unit', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.chapter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full truncate max-w-[200px]">
                    {filters.chapter}
                    <button onClick={() => updateFilter('chapter', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.topic && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full truncate max-w-[200px]">
                    {filters.topic}
                    <button onClick={() => updateFilter('topic', '')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.status && filters.status !== 'active' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-200 dark:bg-secondary-600 text-gray-700 dark:text-secondary-300 text-xs rounded-full">
                    {filters.status}
                    <button onClick={() => updateFilter('status', 'active')}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ═══ TEST LIST ═══ */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : tests.length === 0 ? (
            <div className="card p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-300 dark:text-secondary-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.noTests[language]}</h3>
              <p className="text-gray-500 dark:text-secondary-400 mb-6 text-sm">
                {activeFilterCount > 0
                  ? language === 'hi' ? 'फ़िल्टर बदलकर देखें' : 'Try changing your filters'
                  : language === 'hi' ? 'पहले एक नया टेस्ट बनाएं' : 'Create your first test'}
              </p>
              <div className="flex justify-center gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="btn-secondary px-5 py-2.5 text-sm">
                    <X className="w-4 h-4" /> {t.clear[language]}
                  </button>
                )}
                <button onClick={() => navigate('/tests/create')} className="btn-primary px-5 py-2.5 text-sm">
                  <PlusCircle className="w-4 h-4" /> {t.create[language]}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => {
                const tc = cfg(test.testType);
                return (
                  <div
                    key={test._id}
                    className="card hover:shadow-card-hover dark:hover:shadow-card-dark transition-all duration-200 group"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        {/* ─── Left: Info ─── */}
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <span className={`px-2 py-0.5 text-2xs font-bold rounded ${TYPE_COLORS[test.testType] || 'bg-gray-100 text-gray-600'}`}>
                              {tc.shortCode || test.testType}
                            </span>
                            <span className={`px-2 py-0.5 text-2xs font-bold rounded ${PAPER_BADGES[test.paper] || 'bg-gray-100 text-gray-600'}`}>
                              {test.paper === 'paper1' ? 'P1' : test.paper === 'paper2' ? 'P2' : 'P1+P2'}
                            </span>
                            {test.unit && (
                              <span className="px-2 py-0.5 text-2xs font-medium rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                {test.unit}
                              </span>
                            )}
                            {test.negativeMarking && (
                              <span className="px-2 py-0.5 text-2xs font-medium rounded bg-red-50 text-red-600 border border-red-100">
                                -{test.negativeMarks}
                              </span>
                            )}
                          </div>

                          {/* Full title — NO truncation */}
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2">
                            {test.title}
                          </h3>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-secondary-400">
                            <span className="flex items-center gap-1">
                              <FileQuestion className="w-3.5 h-3.5" />
                              {test.totalQuestions} {t.questions[language]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {test.duration} {t.min[language]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(test.createdAt)}
                            </span>
                            {test.totalAttempts > 0 && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-3.5 h-3.5" />
                                {test.totalAttempts} {t.attempts[language]}
                                {test.highestScore > 0 && (
                                  <span className="text-green-600 ml-1">({Math.round((test.highestScore / test.totalMarks) * 100) || 0}% best)</span>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Chapter + Topic breadcrumb */}
                          {(test.chapter || test.topic) && (
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 dark:text-secondary-500">
                              <BookOpen className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {[test.chapter, test.topic].filter(Boolean).join(' > ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* ─── Right: Actions ─── */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/test/${test._id}`)}
                            className="btn-primary px-5 py-2.5 text-sm shadow-sm"
                          >
                            <Play className="w-4 h-4" />
                            {t.start[language]}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/tests/edit/${test._id}`)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                              title="Edit"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(test._id, e)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                              title="Archive"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ PAGINATION ═══ */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-8">
              <button
                onClick={() => loadTests(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {language === 'hi' ? 'पिछला' : 'Prev'}
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, and pages around current
                  if (p === 1 || p === pagination.pages) return true;
                  if (Math.abs(p - pagination.page) <= 2) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  // Add ellipsis
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                      <button
                        onClick={() => loadTests(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          p === pagination.page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button
                onClick={() => loadTests(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {language === 'hi' ? 'अगला' : 'Next'}
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default TestListPage;