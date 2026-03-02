import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  ClipboardList, PlusCircle, Search, Play, Clock, FileQuestion,
  X, RefreshCw, Calendar, Eye, Trash2, SlidersHorizontal, ChevronDown,
  ChevronUp, BarChart3, BookOpen, Layers, Zap, Target, Award,
  BookMarked, GraduationCap, FileText, PenTool, Sparkles, Trophy,
  ChevronRight, ArrowLeft, Grid3X3, List, Filter, Hash, TrendingUp,
  CheckCircle, XCircle, ArrowRight, Home, FolderOpen, BookCopy
} from 'lucide-react';
import testService from '../services/testService';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../utils/constants';

// ═══════════════════════════════════════════════════════
//         TYPE THEMES — Unique colors per test type
// ═══════════════════════════════════════════════════════
const TYPE_THEMES = {
  dpp: {
    gradient: 'from-blue-500 to-cyan-500',
    lightBg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-600 text-white',
    badgeLight: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: Zap,
    iconBg: 'bg-blue-500',
    accent: 'text-blue-600 dark:text-blue-400',
    strip: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    hoverShadow: 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30',
  },
  topic_test: {
    gradient: 'from-emerald-500 to-green-500',
    lightBg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-600 text-white',
    badgeLight: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    icon: Target,
    iconBg: 'bg-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    strip: 'bg-gradient-to-r from-emerald-500 to-green-500',
    hoverShadow: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
  },
  chapter_test: {
    gradient: 'from-purple-500 to-violet-500',
    lightBg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-600 text-white',
    badgeLight: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    icon: BookMarked,
    iconBg: 'bg-purple-500',
    accent: 'text-purple-600 dark:text-purple-400',
    strip: 'bg-gradient-to-r from-purple-500 to-violet-500',
    hoverShadow: 'hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30',
  },
  unit_test: {
    gradient: 'from-orange-500 to-amber-500',
    lightBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-600 text-white',
    badgeLight: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    icon: Layers,
    iconBg: 'bg-orange-500',
    accent: 'text-orange-600 dark:text-orange-400',
    strip: 'bg-gradient-to-r from-orange-500 to-amber-500',
    hoverShadow: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
  },
  pyq_year: {
    gradient: 'from-red-500 to-rose-500',
    lightBg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-600 text-white',
    badgeLight: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: FileText,
    iconBg: 'bg-red-500',
    accent: 'text-red-600 dark:text-red-400',
    strip: 'bg-gradient-to-r from-red-500 to-rose-500',
    hoverShadow: 'hover:shadow-red-200/50 dark:hover:shadow-red-900/30',
  },
  practice: {
    gradient: 'from-teal-500 to-cyan-500',
    lightBg: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-600 text-white',
    badgeLight: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    icon: PenTool,
    iconBg: 'bg-teal-500',
    accent: 'text-teal-600 dark:text-teal-400',
    strip: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    hoverShadow: 'hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30',
  },
  full_mock_p1: {
    gradient: 'from-indigo-500 to-blue-600',
    lightBg: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30',
    border: 'border-indigo-200 dark:border-indigo-800',
    badge: 'bg-indigo-600 text-white',
    badgeLight: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    icon: GraduationCap,
    iconBg: 'bg-indigo-500',
    accent: 'text-indigo-600 dark:text-indigo-400',
    strip: 'bg-gradient-to-r from-indigo-500 to-blue-600',
    hoverShadow: 'hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30',
  },
  full_mock_p2: {
    gradient: 'from-pink-500 to-rose-500',
    lightBg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
    border: 'border-pink-200 dark:border-pink-800',
    badge: 'bg-pink-600 text-white',
    badgeLight: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    icon: Award,
    iconBg: 'bg-pink-500',
    accent: 'text-pink-600 dark:text-pink-400',
    strip: 'bg-gradient-to-r from-pink-500 to-rose-500',
    hoverShadow: 'hover:shadow-pink-200/50 dark:hover:shadow-pink-900/30',
  },
  full_mock_combined: {
    gradient: 'from-gray-600 to-slate-700',
    lightBg: 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950/30 dark:to-slate-950/30',
    border: 'border-gray-300 dark:border-gray-700',
    badge: 'bg-gray-700 text-white',
    badgeLight: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    icon: Trophy,
    iconBg: 'bg-gray-600',
    accent: 'text-gray-700 dark:text-gray-300',
    strip: 'bg-gradient-to-r from-gray-600 to-slate-700',
    hoverShadow: 'hover:shadow-gray-200/50 dark:hover:shadow-gray-900/30',
  },
};

const DEFAULT_THEME = TYPE_THEMES.dpp;

// ═══════════════════════════════════════════════════════
//         PAPER CARD CONFIGS
// ═══════════════════════════════════════════════════════
const PAPER_CONFIGS = {
  paper1: {
    title: { en: 'Paper 1', hi: 'पेपर 1' },
    subtitle: { en: 'General Paper on Teaching & Research Aptitude', hi: 'शिक्षण और शोध अभिवृत्ति' },
    gradient: 'from-sky-500 to-blue-600',
    lightBg: 'from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40',
    border: 'border-sky-300 dark:border-sky-700',
    icon: GraduationCap,
    color: 'sky',
  },
  paper2: {
    title: { en: 'Paper 2', hi: 'पेपर 2' },
    subtitle: { en: 'History (Code 06)', hi: 'इतिहास (कोड 06)' },
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
    border: 'border-amber-300 dark:border-amber-700',
    icon: BookOpen,
    color: 'amber',
  },
  combined: {
    title: { en: 'Combined', hi: 'संयुक्त' },
    subtitle: { en: 'Paper 1 + Paper 2 Combined Mocks', hi: 'पेपर 1 + पेपर 2 संयुक्त मॉक' },
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    border: 'border-violet-300 dark:border-violet-700',
    icon: Trophy,
    color: 'violet',
  },
};

// ═══════════════════════════════════════════════════════
//               MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const TestListPage = ({ language: globalLanguage = 'en', setLanguage: setGlobalLanguage }) => {
  const navigate = useNavigate();
  const language = globalLanguage || 'en';

  // Navigation state: 'home' → 'paper' → 'unit' → 'tests'
  const [view, setView] = useState('home');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');

  // Data
  const [tests, setTests] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load filter options
  useEffect(() => {
    (async () => {
      try {
        const res = await testService.getFilterOptions({
          paper: selectedPaper || undefined,
          unit: selectedUnit || undefined,
        });
        setFilterOptions(res.data);
      } catch (e) { console.error(e); }
    })();
  }, [selectedPaper, selectedUnit]);

  // Load all tests for current view
  const loadTests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 50, status: 'active', sortBy: 'createdAt', sortOrder: 'desc' };
      if (selectedPaper) params.paper = selectedPaper;
      if (selectedUnit) params.unit = selectedUnit;
      if (selectedChapter) params.chapter = selectedChapter;
      if (testTypeFilter) params.testType = testTypeFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const result = await testService.getTests(params);
      setTests(result.data || []);
      setAllTests(result.data || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedPaper, selectedUnit, selectedChapter, testTypeFilter, debouncedSearch]);

  useEffect(() => { loadTests(); }, [loadTests]);

  // Navigation functions
  const goHome = () => {
    setView('home');
    setSelectedPaper('');
    setSelectedUnit('');
    setSelectedChapter('');
    setTestTypeFilter('');
    setSearchQuery('');
  };

  const selectPaper = (paper) => {
    setSelectedPaper(paper);
    setSelectedUnit('');
    setSelectedChapter('');
    setView('paper');
  };

  const selectUnit = (unit) => {
    setSelectedUnit(unit);
    setSelectedChapter('');
    setView('unit');
  };

  const selectChapter = (chapter) => {
    setSelectedChapter(chapter);
    setView('tests');
  };

  const goBack = () => {
    if (view === 'tests') {
      setSelectedChapter('');
      setView('unit');
    } else if (view === 'unit') {
      setSelectedUnit('');
      setView('paper');
    } else if (view === 'paper') {
      setSelectedPaper('');
      setView('home');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Archive this test?')) return;
    try { await testService.deleteTest(id); loadTests(); } catch {}
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Counts
  const countsByPaper = filterOptions?.countsByPaper || {};
  const countsByType = filterOptions?.countsByType || {};
  const countsByUnit = filterOptions?.countsByUnit || [];

  // Grouped data
  const unitsForPaper = useMemo(() => {
    if (!selectedPaper) return [];
    return countsByUnit
      .filter(i => i.paper === selectedPaper)
      .sort((a, b) => a.unit.localeCompare(b.unit));
  }, [countsByUnit, selectedPaper]);

  const chaptersForUnit = useMemo(() => {
    return filterOptions?.chapters || [];
  }, [filterOptions]);

  // Group tests by chapter
  const testsByChapter = useMemo(() => {
    const grouped = {};
    tests.forEach(t => {
      const ch = t.chapter || 'General';
      if (!grouped[ch]) grouped[ch] = [];
      grouped[ch].push(t);
    });
    return grouped;
  }, [tests]);

  // Group tests by type
  const testsByType = useMemo(() => {
    const grouped = {};
    tests.forEach(t => {
      const type = t.testType || 'practice';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(t);
    });
    return grouped;
  }, [tests]);

  const totalActive = Object.values(countsByPaper).reduce((s, c) => s + c, 0);

  const txt = {
    title: { en: 'Test Library', hi: 'टेस्ट लाइब्रेरी' },
    subtitle: { en: 'Browse and take tests organized by paper, unit & chapter', hi: 'पेपर, इकाई और अध्याय के अनुसार परीक्षाएं देखें' },
    create: { en: 'Create Test', hi: 'टेस्ट बनाएं' },
    search: { en: 'Search tests...', hi: 'खोजें...' },
    start: { en: 'Start', hi: 'शुरू' },
    noTests: { en: 'No tests found', hi: 'कोई परीक्षा नहीं' },
    back: { en: 'Back', hi: 'वापस' },
    allTests: { en: 'All Tests', hi: 'सभी परीक्षाएं' },
    selectPaper: { en: 'Select Paper', hi: 'पेपर चुनें' },
    units: { en: 'Units', hi: 'इकाइयां' },
    chapters: { en: 'Chapters & Tests', hi: 'अध्याय और परीक्षाएं' },
    testsAvailable: { en: 'tests available', hi: 'परीक्षाएं उपलब्ध' },
    viewAll: { en: 'View All Tests', hi: 'सभी देखें' },
    browseBy: { en: 'Browse by Paper', hi: 'पेपर से ब्राउज़ करें' },
    quickAccess: { en: 'Quick Access - All Tests', hi: 'त्वरित पहुंच - सभी परीक्षाएं' },
    fullMocks: { en: 'Full Mock Tests', hi: 'फुल मॉक परीक्षाएं' },
  };

  // ─── Breadcrumb ───
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <button onClick={goHome} className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors">
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{txt.title[language]}</span>
      </button>
      {selectedPaper && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <button
            onClick={() => { setSelectedUnit(''); setSelectedChapter(''); setView('paper'); }}
            className={`font-medium transition-colors ${!selectedUnit ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-primary-600'}`}
          >
            {PAPER_CONFIGS[selectedPaper]?.title[language] || selectedPaper}
          </button>
        </>
      )}
      {selectedUnit && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <button
            onClick={() => { setSelectedChapter(''); setView('unit'); }}
            className={`font-medium transition-colors truncate max-w-[200px] ${!selectedChapter ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-primary-600'}`}
          >
            {selectedUnit}
          </button>
        </>
      )}
      {selectedChapter && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{selectedChapter}</span>
        </>
      )}
    </div>
  );

  return (
    <Layout language={language} setLanguage={setGlobalLanguage}>
      {() => (
        <div className="space-y-6">

          {/* ═══════ HEADER ═══════ */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              {view !== 'home' && <Breadcrumb />}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mt-2">
                {view !== 'home' && (
                  <button onClick={goBack} className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                {view === 'home' && <ClipboardList className="w-7 h-7 text-primary-600" />}
                {view === 'home' && txt.title[language]}
                {view === 'paper' && (PAPER_CONFIGS[selectedPaper]?.title[language] || selectedPaper)}
                {view === 'unit' && selectedUnit}
                {view === 'tests' && selectedChapter}
              </h1>
              {view === 'home' && (
                <p className="text-gray-500 dark:text-secondary-400 mt-1 text-sm">{txt.subtitle[language]}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => loadTests()} className="btn-secondary px-3 py-2.5"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => navigate('/tests/create')} className="btn-primary px-5 py-2.5 text-sm">
                <PlusCircle className="w-4 h-4" /> {txt.create[language]}
              </button>
            </div>
          </div>

          {/* ═══════ HOME VIEW — Paper Selection ═══════ */}
          {view === 'home' && (
            <div className="space-y-8 animate-fade-in">

              {/* ─── Search Bar ─── */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setView('search'); }}
                  placeholder={language === 'hi' ? '🔍 परीक्षा का नाम, अध्याय या विषय खोजें...' : '🔍 Search by test name, chapter or topic...'}
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 dark:border-secondary-600 rounded-2xl bg-white dark:bg-secondary-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                />
              </div>

              {/* ─── Paper Cards ─── */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-primary-600" />
                  {txt.browseBy[language]}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PAPER_CONFIGS).map(([paperKey, config]) => {
                    const count = countsByPaper[paperKey] || 0;
                    const Icon = config.icon;
                    return (
                      <button
                        key={paperKey}
                        onClick={() => selectPaper(paperKey)}
                        className={`
                          relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300
                          bg-gradient-to-br ${config.lightBg} ${config.border}
                          hover:shadow-xl hover:-translate-y-1 hover:border-${config.color}-400 dark:hover:border-${config.color}-600
                          group
                        `}
                      >
                        {/* Background decoration */}
                        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl`} />

                        {/* Icon */}
                        <div className={`w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                          {config.title[language]}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-secondary-400 mb-4 line-clamp-2">
                          {config.subtitle[language]}
                        </p>

                        {/* Count + Arrow */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-3xl font-black text-${config.color}-600 dark:text-${config.color}-400`}>
                              {count}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-secondary-400">
                              {txt.testsAvailable[language]}
                            </span>
                          </div>
                          <div className={`w-10 h-10 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900/30 flex items-center justify-center group-hover:bg-${config.color}-200 dark:group-hover:bg-${config.color}-800/50 transition-colors`}>
                            <ArrowRight className={`w-5 h-5 text-${config.color}-600 dark:text-${config.color}-400 group-hover:translate-x-0.5 transition-transform`} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Test Type Quick Stats ─── */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  {language === 'hi' ? 'प्रकार-वार परीक्षाएं' : 'Tests by Type'}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
                  {Object.entries(countsByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const th = TYPE_THEMES[type] || DEFAULT_THEME;
                      const c = TEST_TYPE_CONFIG[type] || {};
                      const Icon = th.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => { setTestTypeFilter(type); setView('search'); }}
                          className={`
                            p-3 rounded-xl border-2 text-center transition-all hover:shadow-lg hover:-translate-y-0.5
                            ${th.border} bg-white dark:bg-secondary-800 hover:${th.lightBg}
                          `}
                        >
                          <div className={`w-10 h-10 ${th.iconBg} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-xl font-black text-gray-900 dark:text-white">{count}</div>
                          <div className="text-2xs text-gray-500 dark:text-secondary-400 font-semibold mt-0.5">{c.shortCode}</div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* ─── Quick Access: View All ─── */}
              <button
                onClick={() => setView('search')}
                className="w-full card p-5 flex items-center justify-between hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <List className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">{txt.quickAccess[language]}</h3>
                    <p className="text-sm text-gray-500 dark:text-secondary-400">{totalActive} {txt.testsAvailable[language]}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {/* ═══════ PAPER VIEW — Unit Cards ═══════ */}
          {view === 'paper' && (
            <div className="space-y-6 animate-fade-in">
              {/* Paper header card */}
              {selectedPaper && PAPER_CONFIGS[selectedPaper] && (
                <div className={`p-6 rounded-2xl bg-gradient-to-br ${PAPER_CONFIGS[selectedPaper].lightBg} border-2 ${PAPER_CONFIGS[selectedPaper].border}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${PAPER_CONFIGS[selectedPaper].gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      {React.createElement(PAPER_CONFIGS[selectedPaper].icon, { className: 'w-7 h-7 text-white' })}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {PAPER_CONFIGS[selectedPaper].title[language]}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-secondary-400">
                        {PAPER_CONFIGS[selectedPaper].subtitle[language]} — {countsByPaper[selectedPaper] || 0} tests
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* View all tests for paper */}
              <button
                onClick={() => { setSelectedUnit(''); setSelectedChapter(''); setView('search'); }}
                className="w-full card p-4 flex items-center justify-between hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-secondary-700 rounded-xl flex items-center justify-center">
                    <List className="w-5 h-5 text-gray-600 dark:text-secondary-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900 dark:text-white">{txt.viewAll[language]}</h4>
                    <p className="text-xs text-gray-500">{countsByPaper[selectedPaper] || 0} tests</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Unit cards */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-600" />
                {txt.units[language]}
              </h3>

              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
              ) : unitsForPaper.length === 0 ? (
                <div className="card p-8 text-center text-gray-500">
                  {language === 'hi' ? 'कोई इकाई नहीं मिली' : 'No units found'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitsForPaper.map((item, idx) => {
                    const colorIdx = idx % 8;
                    const colors = [
                      { bg: 'from-blue-500 to-cyan-500', light: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600' },
                      { bg: 'from-emerald-500 to-green-500', light: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600' },
                      { bg: 'from-purple-500 to-violet-500', light: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600' },
                      { bg: 'from-orange-500 to-amber-500', light: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600' },
                      { bg: 'from-pink-500 to-rose-500', light: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600' },
                      { bg: 'from-teal-500 to-cyan-500', light: 'from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600' },
                      { bg: 'from-indigo-500 to-blue-500', light: 'from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-600' },
                      { bg: 'from-red-500 to-rose-500', light: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-600' },
                    ];
                    const cl = colors[colorIdx];

                    return (
                      <button
                        key={idx}
                        onClick={() => selectUnit(item.unit)}
                        className={`
                          relative overflow-hidden p-5 rounded-2xl border-2 text-left transition-all duration-300
                          bg-gradient-to-br ${cl.light} ${cl.border}
                          hover:shadow-xl hover:-translate-y-1 group
                        `}
                      >
                        <div className={`absolute -top-3 -right-3 w-20 h-20 rounded-full bg-gradient-to-br ${cl.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Unit number */}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${cl.bg} text-white text-xs font-bold mb-3 shadow-sm`}>
                              <Hash className="w-3 h-3" />
                              {item.unit.replace(/UNIT\s*/i, '').trim() || item.unit}
                            </div>

                            {/* Unit title */}
                            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2">
                              {item.unit}
                            </h4>

                            {/* Test count */}
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`font-black text-lg ${cl.text}`}>{item.count}</span>
                              <span className="text-gray-500 dark:text-secondary-400 text-xs">{language === 'hi' ? 'परीक्षाएं' : 'tests'}</span>
                            </div>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-secondary-700/60 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-secondary-600 transition-colors flex-shrink-0">
                            <ChevronRight className={`w-5 h-5 ${cl.text} group-hover:translate-x-0.5 transition-transform`} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════ UNIT VIEW — Chapter list + Tests ═══════ */}
          {view === 'unit' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search within unit */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'इस इकाई में खोजें...' : 'Search within this unit...'}
                  className="input pl-10" />
              </div>

              {/* Chapter cards */}
              {chaptersForUnit.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookCopy className="w-4 h-4" />
                    {txt.chapters[language]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {chaptersForUnit.map((ch, idx) => {
                      const chTests = tests.filter(t => t.chapter === ch);
                      return (
                        <button
                          key={idx}
                          onClick={() => selectChapter(ch)}
                          className="card p-4 text-left hover:shadow-lg transition-all group hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1">{ch}</h4>
                              <p className="text-xs text-gray-500 dark:text-secondary-400">{chTests.length} tests</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tests grouped by type */}
              <TestGroupedList
                testsByType={testsByType}
                language={language}
                navigate={navigate}
                handleDelete={handleDelete}
                formatDate={formatDate}
                loading={loading}
                txt={txt}
              />
            </div>
          )}

          {/* ═══════ TESTS VIEW — Tests for chapter ═══════ */}
          {view === 'tests' && (
            <div className="space-y-4 animate-fade-in">
              <TestGroupedList
                testsByType={testsByType}
                language={language}
                navigate={navigate}
                handleDelete={handleDelete}
                formatDate={formatDate}
                loading={loading}
                txt={txt}
              />
            </div>
          )}

          {/* ═══════ SEARCH VIEW — All tests flat ═══════ */}
          {view === 'search' && (
            <div className="space-y-4 animate-fade-in">
              {/* Search bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={txt.search[language]} className="input pl-10" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <select value={testTypeFilter} onChange={(e) => setTestTypeFilter(e.target.value)} className="input w-full sm:w-48">
                  <option value="">{language === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
                  {Object.entries(TEST_TYPE_CONFIG).map(([k, c]) => (
                    <option key={k} value={k}>{c.shortCode} - {language === 'hi' ? c.nameHi : c.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-secondary-700 rounded-lg p-1">
                  <button onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-secondary-600 shadow-sm' : 'hover:bg-gray-200'}`}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-secondary-600 shadow-sm' : 'hover:bg-gray-200'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results count */}
              <div className="text-sm text-gray-500 dark:text-secondary-400">
                {pagination.total} {language === 'hi' ? 'परीक्षाएं मिलीं' : 'tests found'}
              </div>

              {/* Tests */}
              {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
              ) : tests.length === 0 ? (
                <div className="card p-12 text-center">
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{txt.noTests[language]}</h3>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tests.map((test) => (
                    <TestCardCompact key={test._id} test={test} language={language} navigate={navigate}
                      handleDelete={handleDelete} formatDate={formatDate} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <TestCardRow key={test._id} test={test} language={language} navigate={navigate}
                      handleDelete={handleDelete} formatDate={formatDate} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button onClick={() => loadTests(pagination.page - 1)} disabled={pagination.page <= 1}
                    className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                    ← {language === 'hi' ? 'पिछला' : 'Prev'}
                  </button>
                  <span className="text-sm text-gray-500">{pagination.page} / {pagination.pages}</span>
                  <button onClick={() => loadTests(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                    className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                    {language === 'hi' ? 'अगला' : 'Next'} →
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </Layout>
  );
};

// ═══════════════════════════════════════════════════════
//       TESTS GROUPED BY TYPE — Section view
// ═══════════════════════════════════════════════════════
const TestGroupedList = ({ testsByType, language, navigate, handleDelete, formatDate, loading, txt }) => {
  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  }

  const typeEntries = Object.entries(testsByType).sort((a, b) => {
    const order = ['dpp', 'topic_test', 'chapter_test', 'unit_test', 'pyq_year', 'practice', 'full_mock_p1', 'full_mock_p2', 'full_mock_combined'];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  if (typeEntries.length === 0) {
    return (
      <div className="card p-12 text-center">
        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{txt.noTests[language]}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {typeEntries.map(([type, typeTests]) => {
        const th = TYPE_THEMES[type] || DEFAULT_THEME;
        const c = TEST_TYPE_CONFIG[type] || {};
        const Icon = th.icon;

        return (
          <div key={type}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 ${th.iconBg} rounded-lg flex items-center justify-center shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {language === 'hi' ? c.nameHi : c.name}
                </h3>
                <p className="text-xs text-gray-500">{typeTests.length} tests</p>
              </div>
            </div>

            {/* Test cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {typeTests.map((test) => (
                <TestCardCompact key={test._id} test={test} language={language} navigate={navigate}
                  handleDelete={handleDelete} formatDate={formatDate} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//       TEST CARD — Grid/Compact mode
// ═══════════════════════════════════════════════════════
const TestCardCompact = ({ test, language, navigate, handleDelete, formatDate }) => {
  const th = TYPE_THEMES[test.testType] || DEFAULT_THEME;
  const c = TEST_TYPE_CONFIG[test.testType] || {};
  const Icon = th.icon;
  const bestPercent = test.totalMarks > 0 && test.highestScore > 0
    ? Math.round((test.highestScore / test.totalMarks) * 100) : null;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border-2 transition-all duration-300 group
      ${th.lightBg} ${th.border} hover:shadow-xl hover:-translate-y-0.5
    `}>
      {/* Top strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${th.strip}`} />

      <div className="p-4">
        <div className="flex gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 ${th.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1 mb-1.5">
              <span className={`px-2 py-0.5 text-2xs font-black rounded ${th.badge}`}>{c.shortCode}</span>
              {test.unit && <span className={`px-1.5 py-0.5 text-2xs font-semibold rounded ${th.badgeLight} truncate max-w-[100px]`}>{test.unit}</span>}
              {bestPercent !== null && (
                <span className={`px-1.5 py-0.5 text-2xs font-bold rounded ${
                  bestPercent >= 80 ? 'bg-green-100 text-green-700' :
                  bestPercent >= 60 ? 'bg-blue-100 text-blue-700' :
                  bestPercent >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Best: {bestPercent}%
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-2">{test.title}</h4>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-secondary-400">
              <span className="flex items-center gap-1">
                <FileQuestion className="w-3 h-3" /> {test.totalQuestions} Qs
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {test.duration}m
              </span>
              {test.totalAttempts > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> {test.totalAttempts}x
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50 dark:border-secondary-700/50">
          <span className="text-2xs text-gray-400">{formatDate(test.createdAt)}</span>
          <div className="flex items-center gap-2">
            <button onClick={(e) => handleDelete(test._id, e)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
            </button>
            <button onClick={() => navigate(`/tests/edit/${test._id}`)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button onClick={() => navigate(`/test/${test._id}`)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow-md transition-all bg-gradient-to-r ${th.gradient}`}>
              <Play className="w-3.5 h-3.5" />
              {language === 'hi' ? 'शुरू' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom progress */}
      {bestPercent !== null && (
        <div className="h-1 bg-gray-200/30">
          <div className={`h-full ${th.strip}`} style={{ width: `${bestPercent}%` }} />
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//       TEST CARD — Row/List mode
// ═══════════════════════════════════════════════════════
const TestCardRow = ({ test, language, navigate, handleDelete, formatDate }) => {
  const th = TYPE_THEMES[test.testType] || DEFAULT_THEME;
  const c = TEST_TYPE_CONFIG[test.testType] || {};
  const Icon = th.icon;
  const bestPercent = test.totalMarks > 0 && test.highestScore > 0
    ? Math.round((test.highestScore / test.totalMarks) * 100) : null;

  return (
    <div className={`
      relative overflow-hidden rounded-xl border-2 transition-all duration-200 group
      bg-white dark:bg-secondary-800 ${th.border} hover:shadow-lg
    `}>
      {/* Left strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${th.strip}`} />

      <div className="p-4 pl-5 flex items-center gap-4">
        {/* Icon */}
        <div className={`hidden sm:flex w-10 h-10 ${th.iconBg} rounded-xl items-center justify-center flex-shrink-0 shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`px-2 py-0.5 text-2xs font-black rounded ${th.badge}`}>{c.shortCode}</span>
            {test.unit && <span className={`px-1.5 py-0.5 text-2xs font-semibold rounded ${th.badgeLight}`}>{test.unit}</span>}
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{test.title}</h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{test.totalQuestions} Qs</span>
            <span>{test.duration}m</span>
            <span>{formatDate(test.createdAt)}</span>
            {test.totalAttempts > 0 && <span>{test.totalAttempts}x attempted</span>}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {bestPercent !== null && (
            <div className={`text-sm font-bold ${
              bestPercent >= 80 ? 'text-green-600' : bestPercent >= 60 ? 'text-blue-600' : bestPercent >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {bestPercent}%
            </div>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => handleDelete(test._id, e)}
              className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
            <button onClick={() => navigate(`/tests/edit/${test._id}`)}
              className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye className="w-3.5 h-3.5 text-gray-400" /></button>
          </div>
          <button onClick={() => navigate(`/test/${test._id}`)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm bg-gradient-to-r ${th.gradient}`}>
            <Play className="w-3.5 h-3.5" /> {language === 'hi' ? 'शुरू' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestListPage;