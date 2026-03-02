import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  ClipboardList, PlusCircle, Search, Play, Clock, FileQuestion,
  X, RefreshCw, Calendar, Eye, Trash2, ChevronDown, ChevronUp,
  BarChart3, BookOpen, Layers, Zap, Target, Award, BookMarked,
  GraduationCap, FileText, PenTool, Sparkles, Trophy, ChevronRight,
  ArrowLeft, Grid3X3, List, Hash, TrendingUp, ArrowRight, Home,
  FolderOpen, BookCopy, Filter, CheckCircle, XCircle, Timer,
  LayoutGrid, AlignJustify, Star, Flame, Medal, Activity,
  MoreHorizontal, Edit3, Copy, Archive, Percent
} from 'lucide-react';
import testService from '../services/testService';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../utils/constants';

// ═══════════════════════════════════════════════════════
//           TYPE THEMES
// ═══════════════════════════════════════════════════════
const TYPE_THEMES = {
  dpp: {
    gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30',
    border: 'border-blue-200/70 dark:border-blue-800/70', badge: 'bg-blue-600 text-white', badgeLight: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    icon: Zap, iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', accent: 'text-blue-600 dark:text-blue-400', strip: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    glowHover: 'hover:shadow-blue-500/20', ring: 'ring-blue-500/30',
  },
  topic_test: {
    gradient: 'from-emerald-500 to-green-500', lightBg: 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30',
    border: 'border-emerald-200/70 dark:border-emerald-800/70', badge: 'bg-emerald-600 text-white', badgeLight: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    icon: Target, iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', accent: 'text-emerald-600 dark:text-emerald-400', strip: 'bg-gradient-to-r from-emerald-500 to-green-500',
    glowHover: 'hover:shadow-emerald-500/20', ring: 'ring-emerald-500/30',
  },
  chapter_test: {
    gradient: 'from-purple-500 to-violet-500', lightBg: 'bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/30',
    border: 'border-purple-200/70 dark:border-purple-800/70', badge: 'bg-purple-600 text-white', badgeLight: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    icon: BookMarked, iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600', accent: 'text-purple-600 dark:text-purple-400', strip: 'bg-gradient-to-r from-purple-500 to-violet-500',
    glowHover: 'hover:shadow-purple-500/20', ring: 'ring-purple-500/30',
  },
  unit_test: {
    gradient: 'from-orange-500 to-amber-500', lightBg: 'bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30',
    border: 'border-orange-200/70 dark:border-orange-800/70', badge: 'bg-orange-600 text-white', badgeLight: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    icon: Layers, iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600', accent: 'text-orange-600 dark:text-orange-400', strip: 'bg-gradient-to-r from-orange-500 to-amber-500',
    glowHover: 'hover:shadow-orange-500/20', ring: 'ring-orange-500/30',
  },
  pyq_year: {
    gradient: 'from-red-500 to-rose-500', lightBg: 'bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-950/30 dark:to-rose-950/30',
    border: 'border-red-200/70 dark:border-red-800/70', badge: 'bg-red-600 text-white', badgeLight: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    icon: FileText, iconBg: 'bg-gradient-to-br from-red-500 to-rose-600', accent: 'text-red-600 dark:text-red-400', strip: 'bg-gradient-to-r from-red-500 to-rose-500',
    glowHover: 'hover:shadow-red-500/20', ring: 'ring-red-500/30',
  },
  practice: {
    gradient: 'from-teal-500 to-cyan-500', lightBg: 'bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-950/30 dark:to-cyan-950/30',
    border: 'border-teal-200/70 dark:border-teal-800/70', badge: 'bg-teal-600 text-white', badgeLight: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    icon: PenTool, iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600', accent: 'text-teal-600 dark:text-teal-400', strip: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    glowHover: 'hover:shadow-teal-500/20', ring: 'ring-teal-500/30',
  },
  full_mock_p1: {
    gradient: 'from-indigo-500 to-blue-600', lightBg: 'bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/30 dark:to-blue-950/30',
    border: 'border-indigo-200/70 dark:border-indigo-800/70', badge: 'bg-indigo-600 text-white', badgeLight: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    icon: GraduationCap, iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-700', accent: 'text-indigo-600 dark:text-indigo-400', strip: 'bg-gradient-to-r from-indigo-500 to-blue-600',
    glowHover: 'hover:shadow-indigo-500/20', ring: 'ring-indigo-500/30',
  },
  full_mock_p2: {
    gradient: 'from-pink-500 to-rose-500', lightBg: 'bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-950/30 dark:to-rose-950/30',
    border: 'border-pink-200/70 dark:border-pink-800/70', badge: 'bg-pink-600 text-white', badgeLight: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    icon: Award, iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600', accent: 'text-pink-600 dark:text-pink-400', strip: 'bg-gradient-to-r from-pink-500 to-rose-500',
    glowHover: 'hover:shadow-pink-500/20', ring: 'ring-pink-500/30',
  },
  full_mock_combined: {
    gradient: 'from-slate-600 to-gray-700', lightBg: 'bg-gradient-to-br from-gray-50/80 to-slate-100/80 dark:from-gray-950/30 dark:to-slate-950/30',
    border: 'border-gray-300/70 dark:border-gray-700/70', badge: 'bg-gray-700 text-white', badgeLight: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    icon: Trophy, iconBg: 'bg-gradient-to-br from-slate-600 to-gray-700', accent: 'text-gray-700 dark:text-gray-300', strip: 'bg-gradient-to-r from-slate-600 to-gray-700',
    glowHover: 'hover:shadow-gray-500/20', ring: 'ring-gray-500/30',
  },
};

const DEFAULT_THEME = TYPE_THEMES.dpp;

// Paper configs
const PAPER_CONFIGS = {
  paper1: {
    title: { en: 'Paper 1', hi: 'पेपर 1' },
    subtitle: { en: 'General Paper on Teaching & Research Aptitude', hi: 'शिक्षण और शोध अभिवृत्ति पर सामान्य पेपर' },
    description: { en: '10 Units • Teaching, Research, Communication, Reasoning, ICT, Environment', hi: '10 इकाइयां • शिक्षण, शोध, संप्रेषण, तर्क, ICT, पर्यावरण' },
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    lightBg: 'from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40',
    border: 'border-sky-300 dark:border-sky-700',
    icon: GraduationCap, color: 'sky', emoji: '📘',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(56,189,248,0.15) 0%, transparent 50%)',
  },
  paper2: {
    title: { en: 'Paper 2', hi: 'पेपर 2' },
    subtitle: { en: 'History (Subject Code: 06)', hi: 'इतिहास (विषय कोड: 06)' },
    description: { en: '10 Units • Ancient, Medieval, Modern India & Historiography', hi: '10 इकाइयां • प्राचीन, मध्यकालीन, आधुनिक भारत और इतिहास लेखन' },
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    lightBg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
    border: 'border-amber-300 dark:border-amber-700',
    icon: BookOpen, color: 'amber', emoji: '📙',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(251,191,36,0.15) 0%, transparent 50%)',
  },
  combined: {
    title: { en: 'Combined Mock', hi: 'संयुक्त मॉक' },
    subtitle: { en: 'Paper 1 + Paper 2 Combined Tests', hi: 'पेपर 1 + पेपर 2 संयुक्त परीक्षाएं' },
    description: { en: '150 Questions • 3 Hours • Full NTA Pattern', hi: '150 प्रश्न • 3 घंटे • पूर्ण NTA पैटर्न' },
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    lightBg: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    border: 'border-violet-300 dark:border-violet-700',
    icon: Trophy, color: 'violet', emoji: '🏆',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.15) 0%, transparent 50%)',
  },
};

// Unit colors cycling
const UNIT_COLORS = [
  { bg: 'from-blue-500 to-cyan-500', light: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-400/30' },
  { bg: 'from-emerald-500 to-green-500', light: 'from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-400/30' },
  { bg: 'from-purple-500 to-violet-500', light: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-400/30' },
  { bg: 'from-orange-500 to-amber-500', light: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-400/30' },
  { bg: 'from-pink-500 to-rose-500', light: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600 dark:text-pink-400', ring: 'ring-pink-400/30' },
  { bg: 'from-teal-500 to-cyan-500', light: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400', ring: 'ring-teal-400/30' },
  { bg: 'from-indigo-500 to-blue-500', light: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-400/30' },
  { bg: 'from-red-500 to-rose-500', light: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', ring: 'ring-red-400/30' },
  { bg: 'from-yellow-500 to-amber-500', light: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600 dark:text-yellow-400', ring: 'ring-yellow-400/30' },
  { bg: 'from-cyan-500 to-sky-500', light: 'from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-400/30' },
];

// ═══════════════════════════════════════════════════════
//            MAIN COMPONENT
// ═══════════════════════════════════════════════════════
const TestListPage = ({ language: globalLanguage = 'en', setLanguage: setGlobalLanguage }) => {
  const navigate = useNavigate();
  const language = globalLanguage || 'en';
  const searchRef = useRef(null);

  const [view, setView] = useState('home');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [expandedTypes, setExpandedTypes] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filter options
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

  // Load tests
  const loadTests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 60, status: 'active', sortBy, sortOrder };
      if (selectedPaper) params.paper = selectedPaper;
      if (selectedUnit) params.unit = selectedUnit;
      if (selectedChapter) params.chapter = selectedChapter;
      if (testTypeFilter) params.testType = testTypeFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await testService.getTests(params);
      setTests(result.data || []);
      setPagination(result.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedPaper, selectedUnit, selectedChapter, testTypeFilter, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => { loadTests(); }, [loadTests]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // Navigation
  const goHome = () => { setView('home'); setSelectedPaper(''); setSelectedUnit(''); setSelectedChapter(''); setTestTypeFilter(''); setSearchQuery(''); };
  const selectPaper = (p) => { setSelectedPaper(p); setSelectedUnit(''); setSelectedChapter(''); setView('paper'); };
  const selectUnit = (u) => { setSelectedUnit(u); setSelectedChapter(''); setView('unit'); };
  const selectChapter = (ch) => { setSelectedChapter(ch); setView('tests'); };
  const goBack = () => {
    if (view === 'tests') { setSelectedChapter(''); setView('unit'); }
    else if (view === 'unit') { setSelectedUnit(''); setView('paper'); }
    else if (view === 'paper' || view === 'search') { goHome(); }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Archive?')) return;
    try { await testService.deleteTest(id); loadTests(); } catch {}
    setContextMenu(null);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const tcfg = (t) => TEST_TYPE_CONFIG[t] || {};
  const th = (t) => TYPE_THEMES[t] || DEFAULT_THEME;

  const countsByPaper = filterOptions?.countsByPaper || {};
  const countsByType = filterOptions?.countsByType || {};
  const countsByUnit = filterOptions?.countsByUnit || [];
  const totalActive = Object.values(countsByPaper).reduce((s, c) => s + c, 0);

  const unitsForPaper = useMemo(() =>
    countsByUnit.filter(i => i.paper === selectedPaper).sort((a, b) => a.unit.localeCompare(b.unit)),
  [countsByUnit, selectedPaper]);

  const chaptersForUnit = useMemo(() => filterOptions?.chapters || [], [filterOptions]);

  const testsByType = useMemo(() => {
    const g = {};
    tests.forEach(t => { const k = t.testType || 'practice'; if (!g[k]) g[k] = []; g[k].push(t); });
    return g;
  }, [tests]);

  const toggleTypeExpand = (type) => setExpandedTypes(p => ({ ...p, [type]: !p[type] }));

  // Text
  const T = {
    title: { en: 'Test Library', hi: 'टेस्ट लाइब्रेरी' },
    subtitle: { en: 'Your complete test preparation hub', hi: 'आपका संपूर्ण परीक्षा तैयारी केंद्र' },
    create: { en: 'Create Test', hi: 'टेस्ट बनाएं' },
    search: { en: 'Search by name, chapter, topic...', hi: 'नाम, अध्याय, विषय से खोजें...' },
    start: { en: 'Start', hi: 'शुरू' },
    noTests: { en: 'No tests found', hi: 'कोई परीक्षा नहीं' },
    back: { en: 'Back', hi: 'वापस' },
    viewAll: { en: 'View All Tests', hi: 'सभी परीक्षाएं देखें' },
    browseBy: { en: 'Choose Paper', hi: 'पेपर चुनें' },
    byType: { en: 'Quick Access by Type', hi: 'प्रकार से त्वरित पहुंच' },
    units: { en: 'Select Unit', hi: 'इकाई चुनें' },
    chapters: { en: 'Chapters', hi: 'अध्याय' },
    tests: { en: 'tests', hi: 'परीक्षाएं' },
    found: { en: 'tests found', hi: 'परीक्षाएं मिलीं' },
    best: { en: 'Best', hi: 'सर्वश्रेष्ठ' },
    sort: { en: 'Sort', hi: 'क्रम' },
    allTypes: { en: 'All Types', hi: 'सभी प्रकार' },
    newest: { en: 'Newest', hi: 'नवीनतम' },
    oldest: { en: 'Oldest', hi: 'पुराने' },
    mostQs: { en: 'Most Qs', hi: 'अधिक प्रश्न' },
    mostAttempts: { en: 'Most Played', hi: 'सबसे अधिक खेले' },
    explore: { en: 'Explore', hi: 'एक्स्प्लोर' },
  };

  // ─── Breadcrumb ───
  const Breadcrumb = () => (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap mb-1">
      <button onClick={goHome} className="flex items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </button>
      {selectedPaper && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <button onClick={() => { setSelectedUnit(''); setSelectedChapter(''); setView('paper'); }}
            className={`font-medium transition-colors truncate max-w-[120px] ${!selectedUnit ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-primary-600'}`}>
            {PAPER_CONFIGS[selectedPaper]?.title[language]}
          </button>
        </>
      )}
      {selectedUnit && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <button onClick={() => { setSelectedChapter(''); setView('unit'); }}
            className={`font-medium transition-colors truncate max-w-[160px] ${!selectedChapter ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-primary-600'}`}>
            {selectedUnit}
          </button>
        </>
      )}
      {selectedChapter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{selectedChapter}</span>
        </>
      )}
    </nav>
  );

  return (
    <Layout language={language} setLanguage={setGlobalLanguage}>
      {() => (
        <div className="space-y-6">

          {/* ═══ HEADER ═══ */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              {view !== 'home' && <Breadcrumb />}
              <div className="flex items-center gap-3">
                {view !== 'home' && (
                  <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl transition-colors -ml-2">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-secondary-400" />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">
                    {view === 'home' && T.title[language]}
                    {view === 'paper' && (PAPER_CONFIGS[selectedPaper]?.title[language])}
                    {view === 'unit' && selectedUnit}
                    {view === 'tests' && selectedChapter}
                    {view === 'search' && (debouncedSearch || testTypeFilter ? `${pagination.total} ${T.found[language]}` : T.viewAll[language])}
                  </h1>
                  {view === 'home' && <p className="text-sm text-gray-500 dark:text-secondary-400 mt-0.5">{T.subtitle[language]}</p>}
                  {view === 'paper' && <p className="text-sm text-gray-500 dark:text-secondary-400 mt-0.5">{PAPER_CONFIGS[selectedPaper]?.subtitle[language]}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => loadTests()} className="btn-secondary px-3 py-2.5 rounded-xl"><RefreshCw className="w-4 h-4" /></button>
              <button onClick={() => navigate('/tests/create')} className="btn-primary px-5 py-2.5 text-sm rounded-xl shadow-lg shadow-primary-500/25">
                <PlusCircle className="w-4 h-4" /> {T.create[language]}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/*                HOME VIEW                   */}
          {/* ═══════════════════════════════════════════ */}
          {view === 'home' && (
            <div className="space-y-8 animate-fade-in">

              {/* ─── Hero Search ─── */}
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-2xl blur-xl -z-10" />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setView('search'); }}
                  onFocus={() => { if (searchQuery) setView('search'); }}
                  placeholder={T.search[language]}
                  className="w-full pl-14 pr-12 py-4 text-base border-2 border-gray-200 dark:border-secondary-600 rounded-2xl bg-white dark:bg-secondary-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-lg transition-all"
                />
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-secondary-700 rounded-md border border-gray-200 dark:border-secondary-600">
                  ⌘K
                </kbd>
              </div>

              {/* ─── Paper Selection ─── */}
              <div>
                <SectionHeader icon={FolderOpen} title={T.browseBy[language]} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                  {Object.entries(PAPER_CONFIGS).map(([paperKey, config]) => {
                    const count = countsByPaper[paperKey] || 0;
                    const Icon = config.icon;
                    return (
                      <button
                        key={paperKey}
                        onClick={() => selectPaper(paperKey)}
                        className="relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-500 bg-white dark:bg-secondary-800 border-gray-200 dark:border-secondary-700 hover:shadow-2xl hover:-translate-y-1.5 group"
                        style={{ backgroundImage: config.pattern }}
                      >
                        {/* Animated gradient border on hover */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                        <div className="absolute inset-[2px] rounded-[14px] bg-white dark:bg-secondary-800 -z-[5]" />

                        {/* Floating decoration */}
                        <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br ${config.gradient} opacity-[0.08] group-hover:opacity-[0.15] group-hover:scale-125 transition-all duration-500`} />
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl`} />

                        {/* Icon */}
                        <div className={`w-16 h-16 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                          {config.title[language]}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-secondary-400 mb-1">{config.subtitle[language]}</p>
                        <p className="text-xs text-gray-400 dark:text-secondary-500 mb-5">{config.description[language]}</p>

                        {/* Bottom */}
                        <div className="flex items-end justify-between">
                          <div>
                            <span className={`text-4xl font-black bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                              {count}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-secondary-400 ml-2">{T.tests[language]}</span>
                          </div>
                          <div className={`w-12 h-12 rounded-2xl bg-gray-100 dark:bg-secondary-700 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:${config.gradient} transition-all duration-300`}>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Type Quick Access ─── */}
              {Object.keys(countsByType).length > 0 && (
                <div>
                  <SectionHeader icon={Sparkles} title={T.byType[language]} />
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mt-4">
                    {Object.entries(countsByType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const t = th(type);
                        const c = tcfg(type);
                        const Icon = t.icon;
                        return (
                          <button key={type} onClick={() => { setTestTypeFilter(type); setView('search'); }}
                            className={`p-3 rounded-xl border-2 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${t.border} bg-white dark:bg-secondary-800 group`}>
                            <div className={`w-11 h-11 ${t.iconBg} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-xl font-black text-gray-900 dark:text-white">{count}</div>
                            <div className="text-2xs text-gray-500 font-bold mt-0.5">{c.shortCode}</div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ─── View All Button ─── */}
              <button onClick={() => setView('search')}
                className="w-full card p-5 flex items-center justify-between hover:shadow-xl transition-all group rounded-2xl border-2 border-dashed border-gray-300 dark:border-secondary-600 hover:border-primary-400 dark:hover:border-primary-600">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <List className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">{T.viewAll[language]}</h3>
                    <p className="text-sm text-gray-500">{totalActive} {T.tests[language]} • {language === 'hi' ? 'सर्च, फ़िल्टर, सॉर्ट' : 'Search, Filter, Sort'}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/*              PAPER VIEW                    */}
          {/* ═══════════════════════════════════════════ */}
          {view === 'paper' && selectedPaper && (
            <div className="space-y-6 animate-fade-in">
              {/* Paper header */}
              <PaperHeader config={PAPER_CONFIGS[selectedPaper]} count={countsByPaper[selectedPaper] || 0} language={language} />

              {/* View all for paper */}
              <button onClick={() => { setView('search'); }}
                className="w-full card p-4 flex items-center justify-between hover:shadow-lg transition-all group rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-secondary-700 rounded-xl flex items-center justify-center">
                    <List className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{T.viewAll[language]}</h4>
                    <p className="text-xs text-gray-500">{countsByPaper[selectedPaper] || 0} {T.tests[language]}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Units */}
              <SectionHeader icon={Layers} title={T.units[language]} count={unitsForPaper.length} />

              {loading ? <LoadingSpinner /> : unitsForPaper.length === 0 ? (
                <EmptyBox text={language === 'hi' ? 'कोई इकाई नहीं' : 'No units found'} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitsForPaper.map((item, idx) => {
                    const cl = UNIT_COLORS[idx % UNIT_COLORS.length];
                    const unitNum = item.unit.match(/\d+/)?.[0] || idx + 1;
                    return (
                      <button key={idx} onClick={() => selectUnit(item.unit)}
                        className={`relative overflow-hidden p-5 rounded-2xl border-2 text-left transition-all duration-300 bg-gradient-to-br ${cl.light} ${cl.border} hover:shadow-xl hover:-translate-y-1 group`}>
                        {/* Decoration */}
                        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${cl.bg} opacity-[0.08] group-hover:opacity-[0.15] group-hover:scale-150 transition-all duration-500`} />

                        <div className="flex items-start justify-between gap-3 relative">
                          <div className="flex-1 min-w-0">
                            {/* Unit number pill */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${cl.bg} text-white text-xs font-black mb-3 shadow-md`}>
                              <Hash className="w-3 h-3" /> UNIT {unitNum}
                            </div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-3">{item.unit}</h4>
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-black ${cl.text}`}>{item.count}</span>
                              <span className="text-xs text-gray-500">{T.tests[language]}</span>
                            </div>
                          </div>
                          <div className={`w-11 h-11 rounded-2xl bg-white/60 dark:bg-secondary-700/60 flex items-center justify-center group-hover:ring-4 ${cl.ring} transition-all flex-shrink-0`}>
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

          {/* ═══════════════════════════════════════════ */}
          {/*              UNIT VIEW                     */}
          {/* ═══════════════════════════════════════════ */}
          {view === 'unit' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'hi' ? 'इस इकाई में खोजें...' : 'Search in this unit...'} className="input pl-10 rounded-xl" />
              </div>

              {/* Chapters */}
              {chaptersForUnit.length > 0 && (
                <>
                  <SectionHeader icon={BookCopy} title={T.chapters[language]} count={chaptersForUnit.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chaptersForUnit.map((ch, idx) => {
                      const chTests = tests.filter(t => t.chapter === ch);
                      const cl = UNIT_COLORS[idx % UNIT_COLORS.length];
                      return (
                        <button key={idx} onClick={() => selectChapter(ch)}
                          className="card p-4 text-left hover:shadow-xl transition-all duration-300 group rounded-xl hover:-translate-y-0.5 border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 bg-gradient-to-br ${cl.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white text-xs font-black`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2">{ch}</h4>
                              <p className="text-xs text-gray-500">{chTests.length} {T.tests[language]}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Tests by type */}
              <TestSectionList testsByType={testsByType} language={language} navigate={navigate} handleDelete={handleDelete}
                formatDate={formatDate} loading={loading} T={T} expandedTypes={expandedTypes} toggleTypeExpand={toggleTypeExpand}
                contextMenu={contextMenu} setContextMenu={setContextMenu} />
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/*             TESTS VIEW (Chapter)           */}
          {/* ═══════════════════════════════════════════ */}
          {view === 'tests' && (
            <div className="space-y-4 animate-fade-in">
              <TestSectionList testsByType={testsByType} language={language} navigate={navigate} handleDelete={handleDelete}
                formatDate={formatDate} loading={loading} T={T} expandedTypes={expandedTypes} toggleTypeExpand={toggleTypeExpand}
                contextMenu={contextMenu} setContextMenu={setContextMenu} />
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/*             SEARCH / ALL VIEW              */}
          {/* ═══════════════════════════════════════════ */}
          {view === 'search' && (
            <div className="space-y-4 animate-fade-in">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={T.search[language]} className="input pl-10 rounded-xl" autoFocus />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
                </div>
                <select value={testTypeFilter} onChange={(e) => setTestTypeFilter(e.target.value)} className="input w-full sm:w-48 rounded-xl">
                  <option value="">{T.allTypes[language]}</option>
                  {Object.entries(TEST_TYPE_CONFIG).map(([k, c]) => (
                    <option key={k} value={k}>{c.shortCode} - {language === 'hi' ? c.nameHi : c.name}</option>
                  ))}
                </select>
                <select value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => { const [b, o] = e.target.value.split('-'); setSortBy(b); setSortOrder(o); }}
                  className="input w-full sm:w-40 rounded-xl">
                  <option value="createdAt-desc">{T.newest[language]}</option>
                  <option value="createdAt-asc">{T.oldest[language]}</option>
                  <option value="title-asc">A → Z</option>
                  <option value="totalQuestions-desc">{T.mostQs[language]}</option>
                  <option value="totalAttempts-desc">{T.mostAttempts[language]}</option>
                </select>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-secondary-700 rounded-xl p-1">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white dark:bg-secondary-600 shadow-sm' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-secondary-600 shadow-sm' : ''}`}><AlignJustify className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Results */}
              {loading ? <LoadingSpinner /> : tests.length === 0 ? (
                <EmptyBox text={T.noTests[language]} />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tests.map(t => <TestCardGrid key={t._id} test={t} language={language} navigate={navigate}
                    handleDelete={handleDelete} formatDate={formatDate} contextMenu={contextMenu} setContextMenu={setContextMenu} T={T} />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {tests.map(t => <TestCardRow key={t._id} test={t} language={language} navigate={navigate}
                    handleDelete={handleDelete} formatDate={formatDate} T={T} />)}
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && <Pagination pagination={pagination} loadTests={loadTests} language={language} />}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

// ═══════════════════════════════════════════════════════
//              SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

const SectionHeader = ({ icon: Icon, title, count }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h2 className="text-lg font-black text-gray-900 dark:text-white">{title}</h2>
    {count !== undefined && <span className="px-2 py-0.5 bg-gray-100 dark:bg-secondary-700 text-gray-500 text-xs font-bold rounded-full">{count}</span>}
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
);

const EmptyBox = ({ text }) => (
  <div className="card p-16 text-center rounded-2xl">
    <ClipboardList className="w-16 h-16 text-gray-200 dark:text-secondary-600 mx-auto mb-4" />
    <p className="text-gray-500 font-medium">{text}</p>
  </div>
);

const PaperHeader = ({ config, count, language }) => {
  const Icon = config.icon;
  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${config.lightBg} border-2 ${config.border}`}
      style={{ backgroundImage: config.pattern }}>
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-10`} />
      <div className="flex items-center gap-4 relative">
        <div className={`w-16 h-16 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">{config.title[language]}</h2>
          <p className="text-sm text-gray-600 dark:text-secondary-400">{config.subtitle[language]}</p>
          <p className="text-xs text-gray-400 mt-0.5">{count} tests • {config.description[language]}</p>
        </div>
      </div>
    </div>
  );
};

const Pagination = ({ pagination, loadTests, language }) => (
  <div className="flex items-center justify-center gap-2 pt-6 pb-4">
    <button onClick={() => loadTests(pagination.page - 1)} disabled={pagination.page <= 1}
      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      ← {language === 'hi' ? 'पिछला' : 'Prev'}
    </button>
    <div className="flex items-center gap-1">
      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
        .map((p, idx, arr) => (
          <React.Fragment key={p}>
            {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-gray-400 text-xs">...</span>}
            <button onClick={() => loadTests(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${p === pagination.page ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200'}`}>
              {p}
            </button>
          </React.Fragment>
        ))}
    </div>
    <button onClick={() => loadTests(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
      {language === 'hi' ? 'अगला' : 'Next'} →
    </button>
  </div>
);

// ─── Tests grouped by type with collapsible sections ───
const TestSectionList = ({ testsByType, language, navigate, handleDelete, formatDate, loading, T, expandedTypes, toggleTypeExpand, contextMenu, setContextMenu }) => {
  if (loading) return <LoadingSpinner />;
  const order = ['dpp', 'topic_test', 'chapter_test', 'unit_test', 'pyq_year', 'practice', 'full_mock_p1', 'full_mock_p2', 'full_mock_combined'];
  const entries = Object.entries(testsByType).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  if (entries.length === 0) return <EmptyBox text={T.noTests[language]} />;

  return (
    <div className="space-y-6">
      {entries.map(([type, typeTests]) => {
        const t = TYPE_THEMES[type] || DEFAULT_THEME;
        const c = TEST_TYPE_CONFIG[type] || {};
        const Icon = t.icon;
        const isExpanded = expandedTypes[type] !== false; // default expanded
        const showTests = isExpanded ? typeTests : typeTests.slice(0, 4);

        return (
          <div key={type} className="space-y-3">
            {/* Section header */}
            <button onClick={() => toggleTypeExpand(type)}
              className="w-full flex items-center gap-3 group">
              <div className={`w-9 h-9 ${t.iconBg} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{language === 'hi' ? c.nameHi : c.name}</h3>
                <p className="text-2xs text-gray-500">{typeTests.length} {T.tests[language]}</p>
              </div>
              <div className={`w-7 h-7 rounded-lg bg-gray-100 dark:bg-secondary-700 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </button>

            {/* Tests */}
            {isExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-down">
                {showTests.map(test => (
                  <TestCardGrid key={test._id} test={test} language={language} navigate={navigate}
                    handleDelete={handleDelete} formatDate={formatDate} contextMenu={contextMenu} setContextMenu={setContextMenu} T={T} />
                ))}
              </div>
            )}

            {isExpanded && typeTests.length > 4 && expandedTypes[type] === undefined && (
              <button onClick={() => toggleTypeExpand(type)}
                className={`text-sm font-semibold ${t.accent} hover:underline`}>
                {language === 'hi' ? `सभी ${typeTests.length} देखें` : `View all ${typeTests.length}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Grid Card ───
const TestCardGrid = ({ test, language, navigate, handleDelete, formatDate, contextMenu, setContextMenu, T }) => {
  const t = TYPE_THEMES[test.testType] || DEFAULT_THEME;
  const c = TEST_TYPE_CONFIG[test.testType] || {};
  const Icon = t.icon;
  const best = test.totalMarks > 0 && test.highestScore > 0 ? Math.round((test.highestScore / test.totalMarks) * 100) : null;
  const isMenuOpen = contextMenu === test._id;

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 group ${t.lightBg} ${t.border} hover:shadow-2xl ${t.glowHover} hover:-translate-y-1`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${t.strip}`} />
      {/* Glow decoration */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${t.gradient} opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500`} />

      <div className="p-4 relative">
        <div className="flex gap-3">
          <div className={`w-11 h-11 ${t.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1 mb-1.5">
              <span className={`px-2 py-0.5 text-2xs font-black rounded-md ${t.badge} shadow-sm`}>{c.shortCode}</span>
              {test.unit && <span className={`px-1.5 py-0.5 text-2xs font-semibold rounded-md ${t.badgeLight} truncate max-w-[90px]`}>{test.unit}</span>}
              {best !== null && (
                <span className={`px-1.5 py-0.5 text-2xs font-bold rounded-md flex items-center gap-0.5 ${
                  best >= 80 ? 'bg-green-100 text-green-700' : best >= 60 ? 'bg-blue-100 text-blue-700' : best >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                  <Percent className="w-2.5 h-2.5" /> {best}
                </span>
              )}
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2">{test.title}</h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-secondary-400">
              <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> {test.totalQuestions}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration}m</span>
              {test.totalAttempts > 0 && <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {test.totalAttempts}x</span>}
            </div>
            {(test.chapter || test.topic) && (
              <div className="mt-1.5 text-2xs text-gray-400 truncate flex items-center gap-1">
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                {[test.chapter, test.topic].filter(Boolean).join(' → ')}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-secondary-700/40">
          <span className="text-2xs text-gray-400">{formatDate(test.createdAt)}</span>
          <div className="flex items-center gap-1.5">
            {/* Context menu */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setContextMenu(isMenuOpen ? null : test._id); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-40 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border dark:border-secondary-700 py-1.5 z-50 animate-scale-in">
                  <button onClick={() => { navigate(`/tests/edit/${test._id}`); setContextMenu(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => { navigator.clipboard?.writeText(test._id); setContextMenu(null); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700">
                    <Copy className="w-3.5 h-3.5" /> Copy ID
                  </button>
                  <hr className="my-1 border-gray-100 dark:border-secondary-700" />
                  <button onClick={(e) => handleDelete(test._id, e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                </div>
              )}
            </div>
            {/* Start */}
            <button onClick={() => navigate(`/test/${test._id}`)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r ${t.gradient}`}>
              <Play className="w-3.5 h-3.5" /> {T.start[language]}
            </button>
          </div>
        </div>
      </div>

      {best !== null && (
        <div className="h-1 bg-gray-200/30"><div className={`h-full ${t.strip} transition-all`} style={{ width: `${best}%` }} /></div>
      )}
    </div>
  );
};

// ─── Row Card ───
const TestCardRow = ({ test, language, navigate, handleDelete, formatDate, T }) => {
  const t = TYPE_THEMES[test.testType] || DEFAULT_THEME;
  const c = TEST_TYPE_CONFIG[test.testType] || {};
  const Icon = t.icon;
  const best = test.totalMarks > 0 && test.highestScore > 0 ? Math.round((test.highestScore / test.totalMarks) * 100) : null;

  return (
    <div className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 group bg-white dark:bg-secondary-800 ${t.border} hover:shadow-lg`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.strip}`} />
      <div className="p-3.5 pl-5 flex items-center gap-3">
        <div className={`hidden sm:flex w-9 h-9 ${t.iconBg} rounded-xl items-center justify-center flex-shrink-0 shadow-md`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`px-1.5 py-0.5 text-2xs font-black rounded ${t.badge}`}>{c.shortCode}</span>
            {test.unit && <span className={`px-1.5 py-0.5 text-2xs font-semibold rounded ${t.badgeLight}`}>{test.unit}</span>}
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug truncate">{test.title}</h4>
          <div className="flex items-center gap-3 mt-0.5 text-2xs text-gray-500">{test.totalQuestions} Qs • {test.duration}m • {formatDate(test.createdAt)}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {best !== null && <span className={`text-sm font-black ${best >= 60 ? 'text-green-600' : best >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{best}%</span>}
          <button onClick={(e) => handleDelete(test._id, e)}
            className="p-1.5 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
          <button onClick={() => navigate(`/test/${test._id}`)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md bg-gradient-to-r ${t.gradient}`}>
            <Play className="w-3.5 h-3.5" /> {T.start[language]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestListPage;