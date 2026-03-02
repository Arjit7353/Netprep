import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  ClipboardList, PlusCircle, Search, Play, Clock, FileQuestion,
  X, RefreshCw, Calendar, Eye, Trash2, SlidersHorizontal, ChevronDown,
  ChevronUp, BarChart3, BookOpen, Layers, Hash, Zap, Target, Award,
  BookMarked, GraduationCap, FileText, PenTool, Sparkles, Trophy
} from 'lucide-react';
import testService from '../services/testService';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../utils/constants';

// ═══════════════════════════════════════════════════════
//         TEST TYPE CARD THEMES
// ═══════════════════════════════════════════════════════
const TYPE_THEMES = {
  dpp: {
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
    badge: 'bg-blue-600 text-white',
    badgeLight: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: Zap,
    iconBg: 'bg-blue-500',
    accent: 'text-blue-600 dark:text-blue-400',
    stripColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
  topic_test: {
    gradient: 'from-emerald-500 to-green-500',
    lightBg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
    badge: 'bg-emerald-600 text-white',
    badgeLight: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    icon: Target,
    iconBg: 'bg-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    stripColor: 'bg-gradient-to-r from-emerald-500 to-green-500',
  },
  chapter_test: {
    gradient: 'from-purple-500 to-violet-500',
    lightBg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-600',
    badge: 'bg-purple-600 text-white',
    badgeLight: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    icon: BookMarked,
    iconBg: 'bg-purple-500',
    accent: 'text-purple-600 dark:text-purple-400',
    stripColor: 'bg-gradient-to-r from-purple-500 to-violet-500',
  },
  unit_test: {
    gradient: 'from-orange-500 to-amber-500',
    lightBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    hoverBorder: 'hover:border-orange-400 dark:hover:border-orange-600',
    badge: 'bg-orange-600 text-white',
    badgeLight: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    icon: Layers,
    iconBg: 'bg-orange-500',
    accent: 'text-orange-600 dark:text-orange-400',
    stripColor: 'bg-gradient-to-r from-orange-500 to-amber-500',
  },
  pyq_year: {
    gradient: 'from-red-500 to-rose-500',
    lightBg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40',
    border: 'border-red-200 dark:border-red-800',
    hoverBorder: 'hover:border-red-400 dark:hover:border-red-600',
    badge: 'bg-red-600 text-white',
    badgeLight: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: FileText,
    iconBg: 'bg-red-500',
    accent: 'text-red-600 dark:text-red-400',
    stripColor: 'bg-gradient-to-r from-red-500 to-rose-500',
  },
  practice: {
    gradient: 'from-teal-500 to-cyan-500',
    lightBg: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-600',
    badge: 'bg-teal-600 text-white',
    badgeLight: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    icon: PenTool,
    iconBg: 'bg-teal-500',
    accent: 'text-teal-600 dark:text-teal-400',
    stripColor: 'bg-gradient-to-r from-teal-500 to-cyan-500',
  },
  full_mock_p1: {
    gradient: 'from-indigo-500 to-blue-600',
    lightBg: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-600',
    badge: 'bg-indigo-600 text-white',
    badgeLight: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    icon: GraduationCap,
    iconBg: 'bg-indigo-500',
    accent: 'text-indigo-600 dark:text-indigo-400',
    stripColor: 'bg-gradient-to-r from-indigo-500 to-blue-600',
  },
  full_mock_p2: {
    gradient: 'from-pink-500 to-rose-500',
    lightBg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40',
    border: 'border-pink-200 dark:border-pink-800',
    hoverBorder: 'hover:border-pink-400 dark:hover:border-pink-600',
    badge: 'bg-pink-600 text-white',
    badgeLight: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    icon: Award,
    iconBg: 'bg-pink-500',
    accent: 'text-pink-600 dark:text-pink-400',
    stripColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
  },
  full_mock_combined: {
    gradient: 'from-gray-600 to-slate-700',
    lightBg: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950/40 dark:to-slate-950/40',
    border: 'border-gray-300 dark:border-gray-700',
    hoverBorder: 'hover:border-gray-400 dark:hover:border-gray-500',
    badge: 'bg-gray-700 text-white',
    badgeLight: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    icon: Trophy,
    iconBg: 'bg-gray-600',
    accent: 'text-gray-700 dark:text-gray-300',
    stripColor: 'bg-gradient-to-r from-gray-600 to-slate-700',
  },
};

const DEFAULT_THEME = TYPE_THEMES.dpp;

const PAPER_BADGES = {
  paper1: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
  paper2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  combined: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
};

const TestListPage = ({ language: globalLanguage = 'en', setLanguage: setGlobalLanguage }) => {
  const navigate = useNavigate();
  const language = globalLanguage || 'en';

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterOptions, setFilterOptions] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const [filters, setFilters] = useState({
    search: '', paper: '', testType: '', unit: '', chapter: '', topic: '',
    status: 'active', sortBy: 'createdAt', sortOrder: 'desc',
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const res = await testService.getFilterOptions({
        paper: filters.paper || undefined,
        testType: filters.testType || undefined,
        unit: filters.unit || undefined,
      });
      setFilterOptions(res.data);
    } catch (e) {
      console.error('Filter options error:', e);
    }
  }, [filters.paper, filters.testType, filters.unit]);

  useEffect(() => { loadFilterOptions(); }, [loadFilterOptions]);

  // Load tests
  const loadTests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 30, sortBy: filters.sortBy, sortOrder: filters.sortOrder };
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
      console.error('Load tests error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.paper, filters.testType, filters.status, filters.unit, filters.chapter, filters.topic, filters.sortBy, filters.sortOrder, debouncedSearch]);

  useEffect(() => { loadTests(); }, [loadTests]);

  const updateFilter = (key, value) => {
    setFilters((p) => {
      const u = { ...p, [key]: value };
      if (key === 'paper') { u.unit = ''; u.chapter = ''; u.topic = ''; }
      if (key === 'unit') { u.chapter = ''; u.topic = ''; }
      if (key === 'chapter') { u.topic = ''; }
      return u;
    });
  };

  const clearFilters = () =>
    setFilters({ search: '', paper: '', testType: '', unit: '', chapter: '', topic: '', status: 'active', sortBy: 'createdAt', sortOrder: 'desc' });

  const activeFilterCount = [filters.paper, filters.testType, filters.unit, filters.chapter, filters.topic, filters.status !== 'active' ? filters.status : ''].filter(Boolean).length;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const tcfg = (t) => TEST_TYPE_CONFIG[t] || {};
  const theme = (t) => TYPE_THEMES[t] || DEFAULT_THEME;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(language === 'hi' ? 'Archive करें?' : 'Archive this test?')) return;
    try { await testService.deleteTest(id); loadTests(); } catch {}
  };

  const countsByType = filterOptions?.countsByType || {};
  const countsByPaper = filterOptions?.countsByPaper || {};
  const countsByUnit = filterOptions?.countsByUnit || [];
  const totalActive = Object.values(countsByPaper).reduce((s, c) => s + c, 0);

  const txt = {
    title: { en: 'All Tests', hi: 'सभी परीक्षाएं' },
    search: { en: 'Search tests by name, unit, chapter...', hi: 'नाम, इकाई, अध्याय से खोजें...' },
    create: { en: 'Create Test', hi: 'टेस्ट बनाएं' },
    noTests: { en: 'No tests found', hi: 'कोई परीक्षा नहीं मिली' },
    allPapers: { en: 'All Papers', hi: 'सभी पेपर' },
    allTypes: { en: 'All Types', hi: 'सभी प्रकार' },
    allUnits: { en: 'All Units', hi: 'सभी इकाइयां' },
    allChapters: { en: 'All Chapters', hi: 'सभी अध्याय' },
    allTopics: { en: 'All Topics', hi: 'सभी विषय' },
    filters: { en: 'Advanced Filters', hi: 'एडवांस फ़िल्टर' },
    clear: { en: 'Clear All', hi: 'सब हटाएं' },
    start: { en: 'Start Test', hi: 'शुरू करें' },
    questions: { en: 'Qs', hi: 'प्रश्न' },
    min: { en: 'min', hi: 'मिनट' },
    attempts: { en: 'attempts', hi: 'प्रयास' },
    found: { en: 'tests found', hi: 'परीक्षाएं' },
    stats: { en: 'Quick Overview', hi: 'त्वरित अवलोकन' },
    bestScore: { en: 'Best', hi: 'सर्वश्रेष्ठ' },
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
                {txt.title[language]}
              </h1>
              <p className="text-gray-500 dark:text-secondary-400 mt-1 text-sm">
                {pagination.total} {txt.found[language]}
                {activeFilterCount > 0 && (
                  <span className="ml-2 text-primary-600">({activeFilterCount} {language === 'hi' ? 'फ़िल्टर' : 'filters'})</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadTests()} className="btn-secondary px-3 py-2.5"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => navigate('/tests/create')} className="btn-primary px-5 py-2.5 text-sm">
                <PlusCircle className="w-4 h-4" /> {txt.create[language]}
              </button>
            </div>
          </div>

          {/* ═══ QUICK STATS ═══ */}
          <div>
            <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-secondary-400 mb-3 hover:text-primary-600 transition-colors">
              <Sparkles className="w-4 h-4" /> {txt.stats[language]}
              {showStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showStats && filterOptions && (
              <div className="space-y-4 animate-slide-down">
                {/* Type-wise stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Total card */}
                  <button
                    onClick={() => { updateFilter('testType', ''); updateFilter('paper', ''); }}
                    className={`relative overflow-hidden p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                      !filters.testType && !filters.paper
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-950/40 dark:to-blue-950/40 dark:border-primary-600 shadow-md'
                        : 'border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/10 rounded-bl-full" />
                    <ClipboardList className="w-5 h-5 text-primary-500 mb-2" />
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{totalActive}</div>
                    <div className="text-xs text-gray-500 dark:text-secondary-400 font-medium mt-0.5">
                      {language === 'hi' ? 'कुल परीक्षाएं' : 'Total Tests'}
                    </div>
                  </button>

                  {/* Per type cards */}
                  {Object.entries(countsByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const th = theme(type);
                      const c = tcfg(type);
                      const Icon = th.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => updateFilter('testType', filters.testType === type ? '' : type)}
                          className={`relative overflow-hidden p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                            filters.testType === type
                              ? `${th.border} ${th.lightBg} shadow-md`
                              : `border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 ${th.hoverBorder}`
                          }`}
                        >
                          <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 ${th.stripColor}`} />
                          <Icon className={`w-5 h-5 ${th.accent} mb-2`} />
                          <div className="text-2xl font-black text-gray-900 dark:text-white">{count}</div>
                          <div className="text-xs text-gray-500 dark:text-secondary-400 font-medium mt-0.5 truncate">
                            {c.shortCode} - {language === 'hi' ? c.nameHi : c.name}
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Unit-wise pills */}
                {countsByUnit.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" /> {language === 'hi' ? 'इकाई-वार' : 'By Unit'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {countsByUnit.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => { updateFilter('paper', item.paper); setTimeout(() => updateFilter('unit', item.unit), 50); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            filters.unit === item.unit && filters.paper === item.paper
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-2xs font-bold ${
                            item.paper === 'paper1' ? 'bg-sky-200 text-sky-700' : 'bg-amber-200 text-amber-700'
                          }`}>
                            {item.paper === 'paper1' ? '1' : '2'}
                          </span>
                          <span className="truncate max-w-[140px]">{item.unit}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-2xs font-bold">{item.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ FILTER BAR ═══ */}
          <div className="card p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder={txt.search[language]} className="input pl-10" />
                {filters.search && (
                  <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Paper */}
              <select value={filters.paper} onChange={(e) => updateFilter('paper', e.target.value)} className="input w-full lg:w-44">
                <option value="">{txt.allPapers[language]}</option>
                <option value="paper1">Paper 1 {countsByPaper.paper1 ? `(${countsByPaper.paper1})` : ''}</option>
                <option value="paper2">Paper 2 {countsByPaper.paper2 ? `(${countsByPaper.paper2})` : ''}</option>
                <option value="combined">Combined {countsByPaper.combined ? `(${countsByPaper.combined})` : ''}</option>
              </select>

              {/* Type */}
              <select value={filters.testType} onChange={(e) => updateFilter('testType', e.target.value)} className="input w-full lg:w-52">
                <option value="">{txt.allTypes[language]}</option>
                {Object.entries(TEST_TYPE_CONFIG).map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.shortCode} - {language === 'hi' ? c.nameHi : c.name}
                    {countsByType[key] ? ` (${countsByType[key]})` : ''}
                  </option>
                ))}
              </select>

              {/* Advanced toggle */}
              <button onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary px-4 py-2.5 text-sm whitespace-nowrap gap-2 ${
                  showFilters || activeFilterCount > 0 ? 'bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-300' : ''
                }`}>
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">{txt.filters[language]}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-primary-600 text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Advanced filters row */}
            {showFilters && (
              <div className="flex flex-col lg:flex-row gap-3 pt-3 border-t border-gray-200 dark:border-secondary-700 animate-slide-down">
                <select value={filters.unit} onChange={(e) => updateFilter('unit', e.target.value)} className="input flex-1">
                  <option value="">{txt.allUnits[language]}</option>
                  {(filterOptions?.units || []).map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <select value={filters.chapter} onChange={(e) => updateFilter('chapter', e.target.value)} className="input flex-1"
                  disabled={(filterOptions?.chapters || []).length === 0}>
                  <option value="">{txt.allChapters[language]}</option>
                  {(filterOptions?.chapters || []).map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                </select>
                <select value={filters.topic} onChange={(e) => updateFilter('topic', e.target.value)} className="input flex-1"
                  disabled={(filterOptions?.topics || []).length === 0}>
                  <option value="">{txt.allTopics[language]}</option>
                  {(filterOptions?.topics || []).map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="input w-full lg:w-32">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                  <option value="">All</option>
                </select>
                <select value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => { const [by, o] = e.target.value.split('-'); setFilters((p) => ({ ...p, sortBy: by, sortOrder: o })); }}
                  className="input w-full lg:w-44">
                  <option value="createdAt-desc">{language === 'hi' ? 'नवीनतम' : 'Newest'}</option>
                  <option value="createdAt-asc">{language === 'hi' ? 'पुराने' : 'Oldest'}</option>
                  <option value="title-asc">A → Z</option>
                  <option value="title-desc">Z → A</option>
                  <option value="totalQuestions-desc">{language === 'hi' ? 'अधिक प्रश्न' : 'Most Qs'}</option>
                  <option value="totalAttempts-desc">{language === 'hi' ? 'अधिक प्रयास' : 'Most Attempts'}</option>
                </select>
                <button onClick={clearFilters} className="btn-secondary px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-1">
                  <X className="w-4 h-4" /> {txt.clear[language]}
                </button>
              </div>
            )}

            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs text-gray-400">{language === 'hi' ? 'सक्रिय:' : 'Active:'}</span>
                {filters.paper && (
                  <FilterPill label={PAPER_LABELS[filters.paper]?.[language] || filters.paper} color="sky" onRemove={() => updateFilter('paper', '')} />
                )}
                {filters.testType && (
                  <FilterPill label={`${tcfg(filters.testType).shortCode} - ${language === 'hi' ? tcfg(filters.testType).nameHi : tcfg(filters.testType).name}`} color="purple" onRemove={() => updateFilter('testType', '')} />
                )}
                {filters.unit && <FilterPill label={filters.unit} color="blue" onRemove={() => updateFilter('unit', '')} />}
                {filters.chapter && <FilterPill label={filters.chapter} color="green" onRemove={() => updateFilter('chapter', '')} />}
                {filters.topic && <FilterPill label={filters.topic} color="orange" onRemove={() => updateFilter('topic', '')} />}
                {filters.status !== 'active' && filters.status && (
                  <FilterPill label={filters.status} color="gray" onRemove={() => updateFilter('status', 'active')} />
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
            <EmptyState language={language} hasFilters={activeFilterCount > 0} onClear={clearFilters} onCreate={() => navigate('/tests/create')} txt={txt} />
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <TestCard
                  key={test._id}
                  test={test}
                  language={language}
                  txt={txt}
                  onStart={() => navigate(`/test/${test._id}`)}
                  onEdit={() => navigate(`/tests/edit/${test._id}`)}
                  onDelete={(e) => handleDelete(test._id, e)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* ═══ PAGINATION ═══ */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-8">
              <button onClick={() => loadTests(pagination.page - 1)} disabled={pagination.page <= 1}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                {language === 'hi' ? '← पिछला' : '← Prev'}
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 2)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-gray-400">...</span>}
                    <button onClick={() => loadTests(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === pagination.page ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200'
                      }`}>{p}</button>
                  </React.Fragment>
                ))}
              <button onClick={() => loadTests(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                {language === 'hi' ? 'अगला →' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

// ═══════════════════════════════════════════════════════
//            TEST CARD COMPONENT — Unique colors
// ═══════════════════════════════════════════════════════
const TestCard = ({ test, language, txt, onStart, onEdit, onDelete, formatDate }) => {
  const th = TYPE_THEMES[test.testType] || DEFAULT_THEME;
  const c = TEST_TYPE_CONFIG[test.testType] || {};
  const Icon = th.icon;

  const bestPercent = test.totalMarks > 0 && test.highestScore > 0
    ? Math.round((test.highestScore / test.totalMarks) * 100)
    : null;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border-2 transition-all duration-300 group
      ${th.lightBg} ${th.border} ${th.hoverBorder}
      hover:shadow-lg dark:hover:shadow-xl hover:-translate-y-0.5
    `}>
      {/* Top color strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${th.stripColor}`} />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* ─── Left: Icon circle + Info ─── */}
          <div className="flex gap-4 flex-1 min-w-0">
            {/* Type icon */}
            <div className={`hidden sm:flex w-12 h-12 ${th.iconBg} rounded-xl items-center justify-center flex-shrink-0 shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {/* Type badge */}
                <span className={`px-2.5 py-0.5 text-2xs font-black rounded-md ${th.badge} shadow-sm`}>
                  {c.shortCode || test.testType}
                </span>
                {/* Paper badge */}
                <span className={`px-2 py-0.5 text-2xs font-bold rounded-md ${PAPER_BADGES[test.paper] || 'bg-gray-100 text-gray-600'}`}>
                  {test.paper === 'paper1' ? 'Paper 1' : test.paper === 'paper2' ? 'Paper 2' : 'Combined'}
                </span>
                {/* Unit badge */}
                {test.unit && (
                  <span className={`px-2 py-0.5 text-2xs font-semibold rounded-md ${th.badgeLight}`}>
                    {test.unit}
                  </span>
                )}
                {/* Negative marking */}
                {test.negativeMarking && (
                  <span className="px-2 py-0.5 text-2xs font-bold rounded-md bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    -{test.negativeMarks}
                  </span>
                )}
                {/* Best score */}
                {bestPercent !== null && (
                  <span className={`px-2 py-0.5 text-2xs font-bold rounded-md ${
                    bestPercent >= 80 ? 'bg-green-100 text-green-700' :
                    bestPercent >= 60 ? 'bg-blue-100 text-blue-700' :
                    bestPercent >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {txt.bestScore[language]}: {bestPercent}%
                  </span>
                )}
              </div>

              {/* Full title */}
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2">
                {test.title}
              </h3>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                <span className={`flex items-center gap-1.5 font-semibold ${th.accent}`}>
                  <FileQuestion className="w-3.5 h-3.5" />
                  {test.totalQuestions} {txt.questions[language]}
                </span>
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-secondary-400">
                  <Clock className="w-3.5 h-3.5" />
                  {test.duration} {txt.min[language]}
                </span>
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-secondary-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(test.createdAt)}
                </span>
                {test.totalAttempts > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-500 dark:text-secondary-400">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {test.totalAttempts} {txt.attempts[language]}
                  </span>
                )}
              </div>

              {/* Chapter > Topic breadcrumb */}
              {(test.chapter || test.topic) && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 dark:text-secondary-500">
                  <BookOpen className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{[test.chapter, test.topic].filter(Boolean).join(' > ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right: Actions ─── */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
            <button onClick={onStart}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-r ${th.gradient}`}>
              <Play className="w-4 h-4" />
              {txt.start[language]}
            </button>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit}
                className="p-2 hover:bg-white/60 dark:hover:bg-secondary-700 rounded-lg transition-colors" title="Edit">
                <Eye className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={onDelete}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Archive">
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom progress bar - if attempted */}
      {bestPercent !== null && (
        <div className="h-1 bg-gray-200/50 dark:bg-secondary-700/50">
          <div className={`h-full transition-all duration-500 ${th.stripColor}`}
            style={{ width: `${bestPercent}%` }} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              FILTER PILL
// ═══════════════════════════════════════════════════════
const FilterPill = ({ label, color, onRemove }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 text-xs font-semibold rounded-full max-w-[200px]`}>
    <span className="truncate">{label}</span>
    <button onClick={onRemove} className="flex-shrink-0 hover:opacity-70"><X className="w-3 h-3" /></button>
  </span>
);

// ═══════════════════════════════════════════════════════
//              EMPTY STATE
// ═══════════════════════════════════════════════════════
const EmptyState = ({ language, hasFilters, onClear, onCreate, txt }) => (
  <div className="card p-12 text-center">
    <div className="w-20 h-20 bg-gray-100 dark:bg-secondary-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
      <ClipboardList className="w-10 h-10 text-gray-400 dark:text-secondary-500" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{txt.noTests[language]}</h3>
    <p className="text-gray-500 dark:text-secondary-400 mb-6 text-sm max-w-md mx-auto">
      {hasFilters
        ? language === 'hi' ? 'फ़िल्टर बदलकर देखें या सब हटाएं' : 'Try changing filters or clear all'
        : language === 'hi' ? 'अभी अपना पहला टेस्ट बनाएं' : 'Create your first test to get started'}
    </p>
    <div className="flex justify-center gap-3">
      {hasFilters && (
        <button onClick={onClear} className="btn-secondary px-5 py-2.5 text-sm">
          <X className="w-4 h-4" /> {txt.clear[language]}
        </button>
      )}
      <button onClick={onCreate} className="btn-primary px-6 py-2.5 text-sm">
        <PlusCircle className="w-4 h-4" /> {txt.create[language]}
      </button>
    </div>
  </div>
);

export default TestListPage;