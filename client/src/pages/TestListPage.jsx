// client/src/pages/TestListPage.jsx
// â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
// UPGRADED: PYQ tests detected by hasPYQ flag (not just testType)
// Tests with PYQ questions show in PYQ section regardless of type
// Smart unit matching uses pyqUnits field
// â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  PlusCircle, RefreshCw, ArrowLeft, Home, ChevronRight,
  FolderOpen, Layers, List, ArrowRight, Sparkles,
  Hash, GraduationCap, BookOpen, Trophy, CheckSquare, Square,
  ClipboardList, Search, ChevronLeft, ChevronsLeft, ChevronsRight,
  BookCopy, Zap, Target, BookMarked, FileText, PenTool,
  Award, BarChart3, Star, Calendar, ArrowUpRight, Tag,
  Blend, Database, GitMerge
} from 'lucide-react';

import QuickStats from '../components/test/QuickStats';
import FilterPanel from '../components/test/FilterPanel';
import BulkActions from '../components/test/BulkActions';
import BatchExportModal from '../components/test/BatchExportModal';
import TestCardPro from '../components/test/TestCardPro';
import TestListSkeleton from '../components/test/TestListSkeleton';
import useTestList from '../hooks/useTestList';
import { TEST_TYPE_CONFIG } from '../utils/constants';
import pyqService from '../services/pyqService';

// â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
//                    CONFIGURATIONS
// â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 

const PAPER_CONFIGS = {
  paper1: {
    title: { en: 'Paper 1', hi: 'à¤ªà¥‡à¤ªà¤° 1' },
    subtitle: { en: 'General Paper on Teaching & Research Aptitude', hi: 'à¤¶à¤¿à¤•à¥ à¤·à¤£ à¤”à¤° à¤¶à¥‹à¤§ à¤…à¤­à¤¿à¤µà¥ƒà¤¤à¥ à¤¤à¤¿ à¤ªà¤° à¤¸à¤¾à¤®à¤¾à¤¨à¥ à¤¯ à¤ªà¥‡à¤ªà¤°' },
    description: { en: '10 Units | Teaching, Research, Communication, ICT, Reasoning, Environment', hi: '10 à¤‡à¤•à¤¾à¤‡à¤¯à¤¾à¤‚ | à¤¶à¤¿à¤•à¥ à¤·à¤£, à¤¶à¥‹à¤§, à¤¸à¤‚à¤ªà¥ à¤°à¥‡à¤·à¤£, ICT, à¤¤à¤°à¥ à¤•, à¤ªà¤°à¥ à¤¯à¤¾à¤µà¤°à¤£' },
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    lightBg: 'from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40',
    icon: GraduationCap,
    pattern: 'radial-gradient(circle at 80% 20%, rgba(56,189,248,0.12) 0%, transparent 50%)',
  },
  paper2: {
    title: { en: 'Paper 2', hi: 'à¤ªà¥‡à¤ªà¤° 2' },
    subtitle: { en: 'History (Subject Code: 06)', hi: 'à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸ (à¤µà¤¿à¤·à¤¯ à¤•à¥‹à¤¡: 06)' },
    description: { en: '10 Units | Ancient, Medieval, Modern India & Historiography', hi: '10 à¤‡à¤•à¤¾à¤‡à¤¯à¤¾à¤‚ | à¤ªà¥ à¤°à¤¾à¤šà¥€à¤¨, à¤®à¤§à¥ à¤¯à¤•à¤¾à¤²à¥€à¤¨, à¤†à¤§à¥ à¤¨à¤¿à¤• à¤­à¤¾à¤°à¤¤ à¤”à¤° à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸ à¤²à¥‡à¤–à¤¨' },
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    lightBg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
    icon: BookOpen,
    pattern: 'radial-gradient(circle at 80% 20%, rgba(251,191,36,0.12) 0%, transparent 50%)',
  },
  combined: {
    title: { en: 'Combined Mock', hi: 'à¤¸à¤‚à¤¯à¥ à¤•à¥ à¤¤ à¤®à¥‰à¤•' },
    subtitle: { en: 'Paper 1 + Paper 2 Combined Tests', hi: 'à¤ªà¥‡à¤ªà¤° 1 + à¤ªà¥‡à¤ªà¤° 2 à¤¸à¤‚à¤¯à¥ à¤•à¥ à¤¤ à¤ªà¤°à¥€à¤•à¥ à¤·à¤¾à¤ à¤‚' },
    description: { en: '150 Questions | 3 Hours | Full NTA Pattern', hi: '150 à¤ªà¥ à¤°à¤¶à¥ à¤¨ | 3 à¤˜à¤‚à¤Ÿà¥‡ | à¤ªà¥‚à¤°à¥ à¤£ NTA à¤ªà¥ˆà¤Ÿà¤°à¥ à¤¨' },
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    lightBg: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    icon: Trophy,
    pattern: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.12) 0%, transparent 50%)',
  },
};

const UNIT_COLORS = [
  { grad: 'from-blue-500 to-cyan-500', text: 'text-blue-600 dark:text-blue-400', light: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20', border: 'border-blue-200 dark:border-blue-800' },
  { grad: 'from-emerald-500 to-green-500', text: 'text-emerald-600 dark:text-emerald-400', light: 'from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { grad: 'from-purple-500 to-violet-500', text: 'text-purple-600 dark:text-purple-400', light: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20', border: 'border-purple-200 dark:border-purple-800' },
  { grad: 'from-orange-500 to-amber-500', text: 'text-orange-600 dark:text-orange-400', light: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20', border: 'border-orange-200 dark:border-orange-800' },
  { grad: 'from-pink-500 to-rose-500', text: 'text-pink-600 dark:text-pink-400', light: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20', border: 'border-pink-200 dark:border-pink-800' },
  { grad: 'from-teal-500 to-cyan-500', text: 'text-teal-600 dark:text-teal-400', light: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20', border: 'border-teal-200 dark:border-teal-800' },
  { grad: 'from-indigo-500 to-blue-500', text: 'text-indigo-600 dark:text-indigo-400', light: 'from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20', border: 'border-indigo-200 dark:border-indigo-800' },
  { grad: 'from-red-500 to-rose-500', text: 'text-red-600 dark:text-red-400', light: 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20', border: 'border-red-200 dark:border-red-800' },
  { grad: 'from-yellow-500 to-amber-500', text: 'text-yellow-600 dark:text-yellow-400', light: 'from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20', border: 'border-yellow-200 dark:border-yellow-800' },
  { grad: 'from-cyan-500 to-sky-500', text: 'text-cyan-600 dark:text-cyan-400', light: 'from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20', border: 'border-cyan-200 dark:border-cyan-800' },
];

const TYPE_ICONS = {
  dpp: Zap, topic_test: Target, chapter_test: BookMarked, unit_test: Layers,
  pyq_year: FileText, practice: PenTool, full_mock_p1: GraduationCap,
  full_mock_p2: Award, full_mock_combined: Trophy,
};
const TYPE_GRADIENTS = {
  dpp: 'from-blue-500 to-cyan-500', topic_test: 'from-emerald-500 to-green-500',
  chapter_test: 'from-purple-500 to-violet-500', unit_test: 'from-orange-500 to-amber-500',
  pyq_year: 'from-red-500 to-rose-500', practice: 'from-teal-500 to-cyan-500',
  full_mock_p1: 'from-indigo-500 to-blue-600', full_mock_p2: 'from-pink-500 to-rose-500',
  full_mock_combined: 'from-slate-600 to-gray-700',
};

// SOURCE TYPE ICONS
const SOURCE_ICONS = { bank: Database, pyq: Star, mixed: GitMerge };
const SOURCE_LABELS = {
  bank: { en: 'Bank', hi: 'à¤¬à¥ˆà¤‚à¤•' },
  pyq: { en: 'PYQ Only', hi: 'à¤•à¥‡à¤µà¤² PYQ' },
  mixed: { en: 'Mixed', hi: 'à¤®à¤¿à¤¶à¥ à¤°à¤¿à¤¤' }
};

const extractUnitNumber = (unitStr) => {
  if (!unitStr) return null;
  const m = unitStr.match(/(?:UNIT|à¤‡à¤•à¤¾à¤ˆ)\s*([IVXLCDM]+|\d+)/i);
  return m ? m[1].toUpperCase() : null;
};

const unitMatchesId = (testUnit, pyqUnitId, testPyqUnits) => {
  if (!pyqUnitId) return false;

  // Check main unit field
  if (testUnit) {
    const testUnits = testUnit.split(',').map(u => u.trim()).filter(Boolean);
    for (const tu of testUnits) {
      const tuNum = extractUnitNumber(tu);
      const pyqNum = extractUnitNumber(pyqUnitId);
      if (tuNum && pyqNum && tuNum === pyqNum) return true;
      if (tu.toLowerCase().includes(pyqUnitId.toLowerCase())) return true;
      if (pyqUnitId.toLowerCase().includes(tu.toLowerCase())) return true;
    }
  }

  // â• â• â•  NEW: Check pyqUnits array â• â• â• 
  if (Array.isArray(testPyqUnits) && testPyqUnits.length > 0) {
    for (const pu of testPyqUnits) {
      const puNum = extractUnitNumber(pu);
      const pyqNum = extractUnitNumber(pyqUnitId);
      if (puNum && pyqNum && puNum === pyqNum) return true;
      if (pu.toLowerCase().includes(pyqUnitId.toLowerCase())) return true;
      if (pyqUnitId.toLowerCase().includes(pu.toLowerCase())) return true;
    }
  }

  return false;
};

const FolderCard = ({ title, subtitle, count, icon: Icon, color = 'blue', onClick }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/30',
    gray: 'from-gray-600 to-gray-700 shadow-gray-500/30'
  };
  
  const bg = colorMap[color] || colorMap.gray;
  
  return (
    <button 
      onClick={onClick} 
      className="group relative w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-transparent dark:hover:border-transparent overflow-hidden text-left backdrop-blur-sm"
    >
      {/* Subtle hover gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-r ${bg}`} />
      
      {/* Glowing Left Icon */}
      <div className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${bg} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        {Icon ? <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm relative z-10" /> : <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm relative z-10" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Count Badge */}
      {count !== undefined && (
        <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 transition-all group-hover:bg-white dark:group-hover:bg-gray-600 shadow-sm group-hover:shadow group-hover:scale-110">
          <span className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 leading-none">{count}</span>
        </div>
      )}
    </button>
  );
  
  return (
    <button onClick={onClick} className={`w-full relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left ${colorMap[color] || colorMap.gray}`}>
      <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0`}>
        {Icon ? <Icon className={`w-7 h-7 ${iconColorMap[color]}`} fill="currentColor" fillOpacity={0.2} /> : <FolderOpen className={`w-7 h-7 ${iconColorMap[color]}`} fill="currentColor" fillOpacity={0.2} />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{title}</h3>
        {subtitle && <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <div className="flex-shrink-0 flex items-center justify-center min-w-[2.5rem] h-7 px-2 rounded-full bg-white dark:bg-gray-800 text-[11px] font-black shadow-sm border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300">
          {count}
        </div>
      )}
    </button>
  );
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//                    MAIN COMPONENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const TestListPage = ({ language: globalLanguage = 'en', setLanguage: setGlobalLanguage }) => {
  const navigate = useNavigate();
  const language = globalLanguage || 'en';
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const {
    tests, loading, pagination, filterOptions, stats,
    filters, updateFilter, clearFilters, hasActiveFilters,
    loadTests, refresh,
    selectedTests, selectionMode, setSelectionMode,
    toggleSelection, selectAll, clearSelection, bulkDelete, bulkLoading,
    questionsCache, loadingQuestions, fetchQuestionsForTest,
    unitsForPaper, testsByType,
    pyqTestsCount, countsBySource,
  } = useTestList();

  const [view, setView] = useState('home');
  const [viewMode, setViewMode] = useState('grid');
  const [showStats, setShowStats] = useState(true);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');
  const [showBatchExport, setShowBatchExport] = useState(false);

  // â•â•â• PYQ CATEGORY STATE â•â•â•
  const [pyqFilterData, setPyqFilterData] = useState(null);
  const [pyqLoading, setPyqLoading] = useState(false);
  const [pyqSelectedUnit, setPyqSelectedUnit] = useState(null);
  const [pyqSelectedChapter, setPyqSelectedChapter] = useState(null);

  // â•â•â• PYQ Tests â€” ALL tests containing PYQ questions (hasPYQ=true) â•â•â•
  const [allPyqTests, setAllPyqTests] = useState([]);
  const [pyqTestsLoading, setPyqTestsLoading] = useState(false);

  const countsByPaper = filterOptions?.countsByPaper || {};
  const countsByType = filterOptions?.countsByType || {};
  const totalActive = Object.values(countsByPaper).reduce((s, c) => s + c, 0);

  // â•â•â• TOTAL PYQ-containing tests (any type) â•â•â•
  const totalPyqTests = useMemo(() => {
    return allPyqTests.length || pyqTestsCount || (countsByType['pyq_year'] || 0);
  }, [allPyqTests, pyqTestsCount, countsByType]);

  const chaptersForUnit = useMemo(() => {
    if (!filterOptions?.chapters) return [];
    return filterOptions.chapters.filter(Boolean).sort();
  }, [filterOptions]);

  const T = {
    title: { en: 'Test Library', hi: 'à¤Ÿà¥‡à¤¸à¥à¤Ÿ à¤²à¤¾à¤‡à¤¬à¥à¤°à¥‡à¤°à¥€' },
    subtitle: { en: 'Your complete test preparation hub', hi: 'à¤†à¤ªà¤•à¤¾ à¤¸à¤‚à¤ªà¥‚à¤°à¥à¤£ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾ à¤¤à¥ˆà¤¯à¤¾à¤°à¥€ à¤•à¥‡à¤‚à¤¦à¥à¤°' },
    create: { en: 'Create Test', hi: 'à¤Ÿà¥‡à¤¸à¥à¤Ÿ à¤¬à¤¨à¤¾à¤à¤‚' },
    viewAll: { en: 'View All Tests', hi: 'à¤¸à¤­à¥€ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚ à¤¦à¥‡à¤–à¥‡à¤‚' },
    browseBy: { en: 'Browse by Paper', hi: 'à¤ªà¥‡à¤ªà¤° à¤•à¥‡ à¤…à¤¨à¥à¤¸à¤¾à¤° à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼ à¤•à¤°à¥‡à¤‚' },
    byType: { en: 'Quick Access by Type', hi: 'à¤ªà¥à¤°à¤•à¤¾à¤° à¤¸à¥‡ à¤¤à¥à¤µà¤°à¤¿à¤¤ à¤ªà¤¹à¥à¤‚à¤š' },
    units: { en: 'Units', hi: 'à¤‡à¤•à¤¾à¤‡à¤¯à¤¾à¤‚' },
    chapters: { en: 'Chapters', hi: 'à¤…à¤§à¥à¤¯à¤¾à¤¯' },
    tests: { en: 'tests', hi: 'à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' },
    found: { en: 'tests found', hi: 'à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚ à¤®à¤¿à¤²à¥€à¤‚' },
    noTests: { en: 'No tests found', hi: 'à¤•à¥‹à¤ˆ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾ à¤¨à¤¹à¥€à¤‚' },
    noUnits: { en: 'No units found', hi: 'à¤•à¥‹à¤ˆ à¤‡à¤•à¤¾à¤ˆ à¤¨à¤¹à¥€à¤‚' },
    select: { en: 'Select', hi: 'à¤šà¥à¤¨à¥‡à¤‚' },
    search: { en: 'Search tests by name, chapter, topic, PYQ year...', hi: 'à¤¨à¤¾à¤®, à¤…à¤§à¥à¤¯à¤¾à¤¯, à¤µà¤¿à¤·à¤¯, PYQ à¤µà¤°à¥à¤· à¤¸à¥‡ à¤–à¥‹à¤œà¥‡à¤‚...' },
    showing: { en: 'Showing', hi: 'à¤¦à¤¿à¤–à¤¾à¤ à¤—à¤' },
    of: { en: 'of', hi: 'à¤®à¥‡à¤‚ à¤¸à¥‡' },
    allTests: { en: 'All Tests', hi: 'à¤¸à¤­à¥€ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' },
    pyqTests: { en: 'PYQ Tests', hi: 'PYQ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' },
    pyqDesc: { en: 'All tests containing PYQ questions â€” any test type (DPP, Practice, etc.)', hi: 'PYQ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤‚ à¤µà¤¾à¤²à¥€ à¤¸à¤­à¥€ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚ â€” à¤•à¥‹à¤ˆ à¤­à¥€ à¤ªà¥à¤°à¤•à¤¾à¤° (DPP, Practice, à¤†à¤¦à¤¿)' },
    createPyqTest: { en: 'Create PYQ Test', hi: 'PYQ à¤Ÿà¥‡à¤¸à¥à¤Ÿ à¤¬à¤¨à¤¾à¤à¤‚' },
    topics: { en: 'Topics', hi: 'à¤µà¤¿à¤·à¤¯' },
    allPyqTests: { en: 'All PYQ Tests', hi: 'à¤¸à¤­à¥€ PYQ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' },
    testsInUnit: { en: 'Tests in this unit', hi: 'à¤‡à¤¸ à¤‡à¤•à¤¾à¤ˆ à¤•à¥€ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' },
    testsInChapter: { en: 'Tests in this chapter', hi: 'à¤‡à¤¸ à¤…à¤§à¥à¤¯à¤¾à¤¯ à¤•à¥€ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' },
    noPyqTests: { en: 'No PYQ tests created yet. Create one from the PYQ question bank!', hi: 'à¤…à¤­à¥€ à¤¤à¤• à¤•à¥‹à¤ˆ PYQ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾ à¤¨à¤¹à¥€à¤‚ à¤¬à¤¨à¤¾à¤ˆ à¤—à¤ˆà¥¤ PYQ à¤ªà¥à¤°à¤¶à¥à¤¨ à¤¬à¥ˆà¤‚à¤• à¤¸à¥‡ à¤¬à¤¨à¤¾à¤à¤‚!' },
    pyqOnly: { en: 'PYQ Only', hi: 'à¤•à¥‡à¤µà¤² PYQ' },
    mixed: { en: 'Mixed (Bank + PYQ)', hi: 'à¤®à¤¿à¤¶à¥à¤°à¤¿à¤¤ (à¤¬à¥ˆà¤‚à¤• + PYQ)' },
    bankOnly: { en: 'Bank Only', hi: 'à¤•à¥‡à¤µà¤² à¤¬à¥ˆà¤‚à¤•' },
  };

  // â•â•â• LOAD PYQ FILTER DATA â•â•â•
  const loadPYQFilterData = useCallback(async () => {
    setPyqLoading(true);
    try {
      const res = await pyqService.getPYQFilters('paper2');
      setPyqFilterData(res.data);
    } catch (err) {
      console.error('Failed to load PYQ filter data:', err);
    } finally {
      setPyqLoading(false);
    }
  }, []);

  // â•â•â• LOAD ALL PYQ TESTS â€” hasPYQ=true (ANY test type) â•â•â•
  const loadAllPyqTests = useCallback(async () => {
    setPyqTestsLoading(true);
    try {
      const testSvc = (await import('../services/testService')).default;
      const res = await testSvc.getTests({
        hasPYQ: 'true',  // â•â•â• KEY CHANGE: filter by hasPYQ, NOT testType â•â•â•
        status: 'active',
        limit: 200,
      });
      setAllPyqTests(res.data || []);
    } catch (err) {
      console.error('Failed to load PYQ tests:', err);
      setAllPyqTests([]);
    } finally {
      setPyqTestsLoading(false);
    }
  }, []);

  // â•â•â• PYQ COMPUTED â•â•â•
  const pyqUnits = useMemo(() => {
    if (!pyqFilterData?.units) return [];
    return pyqFilterData.units;
  }, [pyqFilterData]);

  const pyqChaptersForUnit = useMemo(() => {
    if (!pyqFilterData?.chapters || !pyqSelectedUnit) return [];
    return pyqFilterData.chapters.filter(c => c.unitId === pyqSelectedUnit);
  }, [pyqFilterData, pyqSelectedUnit]);

  const pyqTopicsForChapter = useMemo(() => {
    if (!pyqFilterData?.topics || !pyqSelectedChapter) return [];
    return pyqFilterData.topics.filter(t => t.chapter === pyqSelectedChapter);
  }, [pyqFilterData, pyqSelectedChapter]);

  // â•â•â• FILTER PYQ TESTS â€” uses both unit AND pyqUnits â•â•â•
  const filteredPyqTests = useMemo(() => {
    let filtered = allPyqTests;

    if (pyqSelectedUnit) {
      const unitName = pyqUnits.find(u => u.id === pyqSelectedUnit)?.name || pyqSelectedUnit;
      filtered = filtered.filter(t => {
        // Check main unit field
        if (unitMatchesId(t.unit, pyqSelectedUnit, t.pyqUnits)) return true;
        // Check pyqUnits array
        if (Array.isArray(t.pyqUnits) && t.pyqUnits.some(pu => {
          const puNum = extractUnitNumber(pu);
          const targetNum = extractUnitNumber(pyqSelectedUnit);
          return puNum && targetNum && puNum === targetNum;
        })) return true;
        // Check title
        if (t.title && unitName && t.title.toLowerCase().includes(unitName.toLowerCase())) return true;
        return false;
      });
    }

    if (pyqSelectedChapter) {
      filtered = filtered.filter(t => {
        if (t.chapter && t.chapter.toLowerCase().includes(pyqSelectedChapter.toLowerCase())) return true;
        if (Array.isArray(t.pyqChapters) && t.pyqChapters.some(ch => ch.toLowerCase().includes(pyqSelectedChapter.toLowerCase()))) return true;
        if (t.title && t.title.toLowerCase().includes(pyqSelectedChapter.toLowerCase())) return true;
        return false;
      });
    }

    return filtered;
  }, [allPyqTests, pyqSelectedUnit, pyqSelectedChapter, pyqUnits]);

  // Count PYQ tests per unit
  const pyqTestCountByUnit = useMemo(() => {
    const map = {};
    pyqUnits.forEach(u => {
      map[u.id] = allPyqTests.filter(t =>
        unitMatchesId(t.unit, u.id, t.pyqUnits) ||
        (t.title && u.name && t.title.toLowerCase().includes(u.name.toLowerCase()))
      ).length;
    });
    return map;
  }, [allPyqTests, pyqUnits]);

  // Count PYQ tests per chapter
  const pyqTestCountByChapter = useMemo(() => {
    const map = {};
    pyqChaptersForUnit.forEach(ch => {
      map[ch.chapter] = allPyqTests.filter(t => {
        if (t.chapter && t.chapter.toLowerCase().includes(ch.chapter.toLowerCase())) return true;
        if (Array.isArray(t.pyqChapters) && t.pyqChapters.some(pc => pc.toLowerCase().includes(ch.chapter.toLowerCase()))) return true;
        if (t.title && t.title.toLowerCase().includes(ch.chapter.toLowerCase())) return true;
        return false;
      }).length;
    });
    return map;
  }, [allPyqTests, pyqChaptersForUnit]);

  // â•â•â• KEYBOARD â•â•â•
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape' && selectionMode) clearSelection();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectionMode]);

  // â•â•â• NAVIGATION â•â•â•
  const goHome = () => {
    setView('home'); clearFilters(); clearSelection(); setHeroSearch('');
    setPyqSelectedUnit(null); setPyqSelectedChapter(null);
  };

  const selectPaper = (paper) => { updateFilter('paper', paper); setView('paper'); };
  const selectUnit = (unit) => { updateFilter('unit', unit); setView('unit'); };
  const selectChapter = (chapter) => { updateFilter('chapter', chapter); setView('search'); };
  const goToSearch = (searchTerm) => { if (searchTerm) updateFilter('search', searchTerm); setView('search'); };

  const goToPYQ = () => {
    setView('pyq');
    setPyqSelectedUnit(null);
    setPyqSelectedChapter(null);
    if (!pyqFilterData) loadPYQFilterData();
    loadAllPyqTests();
  };

  const selectPYQUnit = (unitId) => {
    setPyqSelectedUnit(unitId);
    setPyqSelectedChapter(null);
    setView('pyq_unit');
  };

  const selectPYQChapter = (chapter) => {
    setPyqSelectedChapter(chapter);
    setView('pyq_chapter');
  };

  const goBack = () => {
    clearSelection();
    if (view === 'pyq_chapter') { setPyqSelectedChapter(null); setView('pyq_unit'); }
    else if (view === 'pyq_unit') { setPyqSelectedUnit(null); setView('pyq'); }
    else if (view === 'pyq') { goHome(); }
    else if (view === 'search') {
      if (filters.chapter) { updateFilter('chapter', ''); setView('unit'); }
      else if (filters.unit) { updateFilter('unit', ''); setView('paper'); }
      else if (filters.paper) { updateFilter('paper', ''); setView('paper'); }
      else goHome();
    }
    else if (view === 'unit') { updateFilter('unit', ''); setView('paper'); }
    else if (view === 'paper') { goHome(); }
    else goHome();
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm(language === 'hi' ? 'à¤•à¥à¤¯à¤¾ à¤†à¤ª à¤‡à¤¸ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾ à¤•à¥‹ à¤¸à¤‚à¤—à¥à¤°à¤¹à¥€à¤¤ à¤•à¤°à¤¨à¤¾ à¤šà¤¾à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚?' : 'Archive this test?')) return;
    try {
      const svc = (await import('../services/testService')).default;
      await svc.deleteTest(id);
      refresh();
      if (view.startsWith('pyq')) loadAllPyqTests();
    } catch { }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(language === 'hi' ? `${selectedTests.size} à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚ à¤¸à¤‚à¤—à¥à¤°à¤¹à¥€à¤¤ à¤•à¤°à¥‡à¤‚?` : `Archive ${selectedTests.size} tests?`)) return;
    try { await bulkDelete(); } catch { }
  };

  const handleBulkExport = () => { if (selectedTests.size > 0) setShowBatchExport(true); };
  const selectedTestObjects = useMemo(() => tests.filter(t => selectedTests.has(t._id)), [tests, selectedTests]);
  const handleHeroSearch = (e) => { e.preventDefault(); if (heroSearch.trim()) goToSearch(heroSearch.trim()); };

  // â•â•â• SUB COMPONENTS â•â•â•
  const Breadcrumb = () => (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap mb-1">
      <button onClick={goHome} className="flex items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </button>
      {view.startsWith('pyq') && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <button onClick={goToPYQ} className={`font-medium transition-colors ${view === 'pyq' ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-primary-600'}`}>
            PYQ Tests
          </button>
        </>
      )}
      {pyqSelectedUnit && view !== 'pyq' && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <button onClick={() => selectPYQUnit(pyqSelectedUnit)}
            className={`font-medium transition-colors truncate max-w-[160px] ${!pyqSelectedChapter ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-primary-600'}`}>
            {pyqUnits.find(u => u.id === pyqSelectedUnit)?.name || pyqSelectedUnit}
          </button>
        </>
      )}
      {pyqSelectedChapter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{pyqSelectedChapter}</span>
        </>
      )}
      {filters.paper && !view.startsWith('pyq') && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <button onClick={() => { updateFilter('unit', ''); updateFilter('chapter', ''); setView('paper'); }}
            className={`font-medium transition-colors ${!filters.unit ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-primary-600'}`}>
            {PAPER_CONFIGS[filters.paper]?.title[language]}
          </button>
        </>
      )}
      {filters.unit && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <button onClick={() => { updateFilter('chapter', ''); setView('unit'); }}
            className={`font-medium transition-colors truncate max-w-[160px] ${!filters.chapter ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-primary-600'}`}>
            {filters.unit.replace(/^UNIT\s*/i, 'Unit ')}
          </button>
        </>
      )}
      {filters.chapter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600" />
          <span className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">{filters.chapter}</span>
        </>
      )}
    </nav>
  );

  const SectionHeader = ({ icon: Icon, title, count, extra }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white">{title}</h2>
        {count !== undefined && (
          <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-full">{count}</span>
        )}
      </div>
      {extra}
    </div>
  );

  const EmptyBox = ({ text, action }) => (
    <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-16 text-center">
      <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
      <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{text}</p>
      {action}
    </div>
  );

  const PaginationBar = () => {
    if (pagination.pages <= 1) return null;
    const pages = Array.from({ length: pagination.pages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1);
    return (
      <div className="flex items-center justify-center gap-1.5 pt-6 pb-4">
        <button onClick={() => loadTests(1)} disabled={pagination.page <= 1} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"><ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
        <button onClick={() => loadTests(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx, arr) => (
            <React.Fragment key={p}>
              {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-gray-400 text-xs">...</span>}
              <button onClick={() => loadTests(p)} className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${p === pagination.page ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{p}</button>
            </React.Fragment>
          ))}
        </div>
        <button onClick={() => loadTests(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
        <button onClick={() => loadTests(pagination.pages)} disabled={pagination.page >= pagination.pages} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors"><ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
      </div>
    );
  };

  // â•â•â• SOURCE TYPE BADGE for test cards â•â•â•
  const SourceBadge = ({ test }) => {
    if (!test.hasPYQ) return null;
    const icon = test.sourceType === 'pyq' ? Star : test.sourceType === 'mixed' ? GitMerge : null;
    if (!icon) return null;
    const Icon = icon;
    const label = test.sourceType === 'pyq' ? 'PYQ' : 'Mixed';
    const colors = test.sourceType === 'pyq'
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-purple-100 text-purple-700 border-purple-200';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors}`}>
        <Icon className="w-3 h-3" />
        {label}
        {test.pyqCount > 0 && <span className="opacity-70">({test.pyqCount}Q)</span>}
      </span>
    );
  };

  // â•â•â• RENDER TEST CARDS â•â•â•
  const renderTests = () => {
    if (loading) return <TestListSkeleton count={6} viewMode={viewMode} />;
    if (tests.length === 0) return <EmptyBox text={T.noTests[language]} action={
      <button onClick={() => navigate('/tests/create')} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
        <PlusCircle className="w-4 h-4" /> {T.create[language]}
      </button>} />;

    return viewMode === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tests.map(test => (
          <TestCardPro key={test._id} test={test} language={language} variant="grid"
            selectionMode={selectionMode} isSelected={selectedTests.has(test._id)}
            onSelect={toggleSelection} onDelete={handleDelete}
            questions={questionsCache[test._id] || []} onFetchQuestions={() => fetchQuestionsForTest(test._id)} />
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {tests.map(test => (
          <TestCardPro key={test._id} test={test} language={language} variant="list"
            selectionMode={selectionMode} isSelected={selectedTests.has(test._id)}
            onSelect={toggleSelection} onDelete={handleDelete}
            questions={questionsCache[test._id] || []} onFetchQuestions={() => fetchQuestionsForTest(test._id)} />
        ))}
      </div>
    );
  };

  // â•â•â• RENDER PYQ TEST CARDS â•â•â•
  const renderPyqTests = (testList) => {
    if (pyqTestsLoading) return <TestListSkeleton count={4} viewMode="grid" />;
    if (testList.length === 0) return (
      <EmptyBox text={T.noPyqTests[language]} action={
        <button onClick={() => navigate('/tests/create')} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> {T.createPyqTest[language]}
        </button>} />
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {testList.map(test => (
          <div key={test._id} className="relative">
            <TestCardPro test={test} language={language} variant="grid"
              selectionMode={false} isSelected={false}
              onSelect={() => { }} onDelete={handleDelete}
              questions={questionsCache[test._id] || []} onFetchQuestions={() => fetchQuestionsForTest(test._id)} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout view={view} setView={setView}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {view !== 'home' && (
                <button 
                  onClick={goBack} 
                  className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all active:scale-95"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <button onClick={goHome} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Home</button>
                {view !== 'home' && <ChevronRight className="w-4 h-4" />}
                {view === 'paper' && <span className="text-gray-900 dark:text-gray-100">{PAPER_CONFIGS[filters.paper]?.title[language]}</span>}
                {view === 'unit' && <span className="text-gray-900 dark:text-gray-100">Explorer</span>}
                {view === 'pyq' && <span className="text-gray-900 dark:text-gray-100">{T.pyqTests[language]}</span>}
                {view === 'pyq_unit' && <span className="text-gray-900 dark:text-gray-100">PYQ Explorer</span>}
                {view === 'search' && <span className="text-gray-900 dark:text-gray-100">Search</span>}
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {T.title[language]}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {T.subtitle[language]}
            </p>
          </div>
        </div>
        <div className="mt-8">
          {/* ----------- HOME VIEW ----------- */}
          {view === 'home' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(PAPER_CONFIGS).map(([key, cfg]) => {
                  const count = countsByPaper[key] || 0;
                  const colorMap = {
                    paper1: 'blue',
                    paper2: 'amber',
                    combined: 'purple'
                  };
                  return (
                    <FolderCard 
                      key={key}
                      title={cfg.title[language]}
                      subtitle={cfg.subtitle[language]}
                      count={count}
                      icon={cfg.icon}
                      color={colorMap[key] || 'gray'}
                      onClick={() => selectPaper(key)}
                    />
                  );
                })}

                {/* PYQ Folder */}
                <FolderCard 
                  title={T.pyqTests[language]}
                  subtitle={T.pyqDesc[language]}
                  count={totalPyqTests}
                  icon={Star}
                  color="rose"
                  onClick={goToPYQ}
                />
              </div>
            </div>
          )}

          {/* ----------- PYQ MAIN VIEW ----------- */}
          {view === 'pyq' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle="All PYQ Tests"
                  count={allPyqTests.length}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Units */}
                {pyqUnits.map((unit, idx) => {
                  const unitNum = unit.id?.match(/d+/)?.[0] || idx + 1;
                  return (
                    <FolderCard 
                      key={unit.id}
                      title={`Unit ${unitNum}`}
                      subtitle={unit.name}
                      count={pyqTestCountByUnit[unit.id] || 0}
                      icon={Layers}
                      color="rose"
                      onClick={() => selectPYQUnit(unit.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------- EXPLORER VIEW (PYQ UNIT/CHAPTER) ----------- */}
          {view === 'pyq_unit' && (
            <div className="flex flex-col lg:flex-row gap-6 mt-2 animate-fade-in">
              {/* Left Pane: Sidebar */}
              <div className="w-full lg:w-[320px] flex-shrink-0">
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">ALL CHAPTERS (PYQ)</h3>
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 text-xs font-bold px-2 py-0.5 rounded-full">{pyqChaptersForUnit.length}</span>
                  </div>
                  <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {/* All Chapters Option */}
                    <button 
                      onClick={() => { updateFilter('chapter', ''); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${!filters.chapter ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'}`}
                    >
                      <span className="truncate pr-4">All Chapters</span>
                      {!filters.chapter && <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></div>}
                    </button>
                    
                    {pyqChaptersForUnit.map((ch, idx) => {
                      const isActive = filters.chapter === ch.chapter;
                      const numStr = String(idx + 1).padStart(2, '0');
                      return (
                        <button
                          key={ch.chapter}
                          onClick={() => { updateFilter('chapter', ch.chapter); }} 
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent group'}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${isActive ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700'}`}>
                              <span className="text-xs font-bold">CH {numStr}</span>
                            </div>
                            <span className={`truncate ${isActive ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>{ch.chapter}</span>
                          </div>
                          {isActive && <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Pane: Tests List */}
              <div className="w-full lg:flex-1 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
                {/* Header / Tabs */}
                <div className="px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    <button className="whitespace-nowrap py-4 text-sm font-medium border-b-2 border-rose-600 text-rose-600 dark:text-rose-400">All PYQ Tests</button>
                    <button className="whitespace-nowrap py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Shift 1</button>
                    <button className="whitespace-nowrap py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Shift 2</button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 bg-gray-50/30 dark:bg-gray-900/20 min-h-[500px]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {filters.chapter ? filters.chapter : (filters.unit || 'All PYQs')}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{filteredPyqTests.length} PYQs found</span>
                  </div>
                  
                  {/* Reuse renderTests but force list mode for premium look */}
                  <div className="space-y-4">
                    {(() => {
                       if (filteredPyqTests.length === 0) {
                         return <EmptyBox text={T.noTests[language]} action={<button onClick={() => navigate('/tests/create')} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"><PlusCircle className="w-4 h-4" /> {T.create[language]}</button>} />;
                       }
                       return (
                         <div className="flex flex-col gap-4">
                           {filteredPyqTests.map(test => (
                             <TestCardPro key={test._id} test={test} language={language} variant="list" 
                               onEdit={() => navigate('/tests/edit/' + test._id)}
                               onView={() => navigate('/tests/' + test._id)}
                               onDelete={() => {}}
                               selectionMode={selectionMode}
                               isSelected={selectedTests.has(test._id)}
                               onToggleSelection={(id) => {}}
                             />
                           ))}
                         </div>
                       );
                    })()}
                    <PaginationBar />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------- PYQ CHAPTER VIEW ----------- */}
          {view === 'pyq_chapter' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle="Chapter Tests"
                  count={filteredPyqTests.length}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Topics */}
                {pyqTopicsForChapter.map((tp, idx) => {
                  const tpTests = filteredPyqTests.filter(t => t.topic === tp.topic);
                  return (
                    <FolderCard 
                      key={tp.topic}
                      title={`Topic ${idx + 1}`}
                      subtitle={tp.topic}
                      count={tpTests.length}
                      icon={Tag}
                      color="purple"
                      onClick={() => {}}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------- PAPER VIEW ----------- */}
          {view === 'paper' && filters.paper && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle={`${PAPER_CONFIGS[filters.paper]?.title[language]} Tests`}
                  count={countsByPaper[filters.paper] || 0}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Units */}
                {unitsForPaper.map((item, idx) => {
                  const unitNum = item.unit?.match(/d+/)?.[0] || idx + 1;
                  return (
                    <FolderCard 
                      key={item.unit}
                      title={`Unit ${unitNum}`}
                      subtitle={item.unit}
                      count={item.count}
                      icon={Layers}
                      color="blue"
                      onClick={() => selectUnit(item.unit)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------- EXPLORER VIEW (UNIT/CHAPTER) ----------- */}
          {view === 'unit' && (
            <div className="flex flex-col lg:flex-row gap-6 mt-2 animate-fade-in">
              {/* Left Pane: Sidebar */}
              <div className="w-full lg:w-[320px] flex-shrink-0">
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">ALL CHAPTERS</h3>
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">{chaptersForUnit.length}</span>
                  </div>
                  <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {/* All Chapters Option */}
                    <button 
                      onClick={() => { updateFilter('chapter', ''); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${!filters.chapter ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'}`}
                    >
                      <span className="truncate pr-4">All Chapters</span>
                      {!filters.chapter && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>}
                    </button>
                    
                    {chaptersForUnit.map((ch, idx) => {
                      const isActive = filters.chapter === ch;
                      const numStr = String(idx + 1).padStart(2, '0');
                      return (
                        <button
                          key={ch}
                          onClick={() => { updateFilter('chapter', ch); }} 
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent group'}`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700'}`}>
                              <span className="text-xs font-bold">CH {numStr}</span>
                            </div>
                            <span className={`truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{ch}</span>
                          </div>
                          {isActive && <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Pane: Tests List */}
              <div className="w-full lg:flex-1 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
                {/* Header / Tabs */}
                <div className="px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    <button onClick={() => updateFilter('testType', '')} className={`whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${!filters.testType ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>All Tests</button>
                    <button onClick={() => updateFilter('testType', 'mock')} className={`whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${filters.testType === 'mock' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>Mock Tests</button>
                    <button onClick={() => updateFilter('testType', 'dpp')} className={`whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${filters.testType === 'dpp' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>DPPs</button>
                    <button onClick={() => updateFilter('testType', 'pyq')} className={`whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${filters.testType === 'pyq' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>PYQs</button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 bg-gray-50/30 dark:bg-gray-900/20 min-h-[500px]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {filters.chapter ? filters.chapter : (filters.unit || 'All Tests')}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{tests.length} tests found</span>
                  </div>
                  
                  {/* Reuse renderTests but force list mode for premium look */}
                  <div className="space-y-4">
                    {(() => {
                       if (tests.length === 0) {
                         return <EmptyBox text={T.noTests[language]} action={<button onClick={() => navigate('/tests/create')} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"><PlusCircle className="w-4 h-4" /> {T.create[language]}</button>} />;
                       }
                       return (
                         <div className="flex flex-col gap-4">
                           {tests.map(test => (
                             <TestCardPro key={test._id} test={test} language={language} variant="list" 
                               onEdit={() => navigate('/tests/edit/' + test._id)}
                               onView={() => navigate('/tests/' + test._id)}
                               onDelete={() => {}}
                               selectionMode={selectionMode}
                               isSelected={selectedTests.has(test._id)}
                               onToggleSelection={(id) => {}}
                             />
                           ))}
                         </div>
                       );
                    })()}
                    <PaginationBar />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------- SEARCH VIEW ----------- */}
          {view === 'search' && (
            <div className="space-y-4 animate-fade-in mt-2">
              <FilterPanel filters={filters} updateFilter={updateFilter} clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters} filterOptions={filterOptions}
                language={language} viewMode={viewMode} setViewMode={setViewMode} />
              {renderTests()}
              <PaginationBar />
              {tests.length > 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 pb-4">
                  {T.showing[language]} {tests.length} {T.of[language]} {pagination.total} {T.tests[language]}
                </div>
              )}
            </div>
          )}

          {/* Batch Export Modal */}
          <BatchExportModal isOpen={showBatchExport} onClose={() => setShowBatchExport(false)}
            tests={selectedTestObjects} questionsCache={questionsCache} language={language} />
        </div>
      </div>
    </Layout>
  );
};

export default TestListPage;
