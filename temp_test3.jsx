// client/src/pages/TestListPage.jsx
// ═══════════════════════════════════════════════════════
// UPGRADED: PYQ tests detected by hasPYQ flag (not just testType)
// Tests with PYQ questions show in PYQ section regardless of type
// Smart unit matching uses pyqUnits field
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//                    CONFIGURATIONS
// ═══════════════════════════════════════════════════════

const PAPER_CONFIGS = {
  paper1: {
    title: { en: 'Paper 1', hi: 'पेपर 1' },
    subtitle: { en: 'General Paper on Teaching & Research Aptitude', hi: 'शिक्षण और शोध अभिवृत्ति पर सामान्य पेपर' },
    description: { en: '10 Units | Teaching, Research, Communication, ICT, Reasoning, Environment', hi: '10 इकाइयां | शिक्षण, शोध, संप्रेषण, ICT, तर्क, पर्यावरण' },
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    lightBg: 'from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40',
    icon: GraduationCap,
    pattern: 'radial-gradient(circle at 80% 20%, rgba(56,189,248,0.12) 0%, transparent 50%)',
  },
  paper2: {
    title: { en: 'Paper 2', hi: 'पेपर 2' },
    subtitle: { en: 'History (Subject Code: 06)', hi: 'इतिहास (विषय कोड: 06)' },
    description: { en: '10 Units | Ancient, Medieval, Modern India & Historiography', hi: '10 इकाइयां | प्राचीन, मध्यकालीन, आधुनिक भारत और इतिहास लेखन' },
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    lightBg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
    icon: BookOpen,
    pattern: 'radial-gradient(circle at 80% 20%, rgba(251,191,36,0.12) 0%, transparent 50%)',
  },
  combined: {
    title: { en: 'Combined Mock', hi: 'संयुक्त मॉक' },
    subtitle: { en: 'Paper 1 + Paper 2 Combined Tests', hi: 'पेपर 1 + पेपर 2 संयुक्त परीक्षाएं' },
    description: { en: '150 Questions | 3 Hours | Full NTA Pattern', hi: '150 प्रश्न | 3 घंटे | पूर्ण NTA पैटर्न' },
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
  bank: { en: 'Bank', hi: 'बैंक' },
  pyq: { en: 'PYQ Only', hi: 'केवल PYQ' },
  mixed: { en: 'Mixed', hi: 'मिश्रित' }
};

const extractUnitNumber = (unitStr) => {
  if (!unitStr) return null;
  const m = unitStr.match(/(?:UNIT|इकाई)\s*([IVXLCDM]+|\d+)/i);
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

  // ═══ NEW: Check pyqUnits array ═══
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

// ═══════════════════════════════════════════════════════
//                    MAIN COMPONENT
// ═══════════════════════════════════════════════════════

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

  // ═══ PYQ CATEGORY STATE ═══
  const [pyqFilterData, setPyqFilterData] = useState(null);
  const [pyqLoading, setPyqLoading] = useState(false);
  const [pyqSelectedUnit, setPyqSelectedUnit] = useState(null);
  const [pyqSelectedChapter, setPyqSelectedChapter] = useState(null);

  // ═══ PYQ Tests — ALL tests containing PYQ questions (hasPYQ=true) ═══
  const [allPyqTests, setAllPyqTests] = useState([]);
  const [pyqTestsLoading, setPyqTestsLoading] = useState(false);

  const countsByPaper = filterOptions?.countsByPaper || {};
  const countsByType = filterOptions?.countsByType || {};
  const totalActive = Object.values(countsByPaper).reduce((s, c) => s + c, 0);

  // ═══ TOTAL PYQ-containing tests (any type) ═══
  const totalPyqTests = useMemo(() => {
    return allPyqTests.length || pyqTestsCount || (countsByType['pyq_year'] || 0);
  }, [allPyqTests, pyqTestsCount, countsByType]);

  const chaptersForUnit = useMemo(() => {
    if (!filterOptions?.chapters) return [];
    return filterOptions.chapters.filter(Boolean).sort();
  }, [filterOptions]);

  const T = {
    title: { en: 'Test Library', hi: 'टेस्ट लाइब्रेरी' },
    subtitle: { en: 'Your complete test preparation hub', hi: 'आपका संपूर्ण परीक्षा तैयारी केंद्र' },
    create: { en: 'Create Test', hi: 'टेस्ट बनाएं' },
    viewAll: { en: 'View All Tests', hi: 'सभी परीक्षाएं देखें' },
    browseBy: { en: 'Browse by Paper', hi: 'पेपर के अनुसार ब्राउज़ करें' },
    byType: { en: 'Quick Access by Type', hi: 'प्रकार से त्वरित पहुंच' },
    units: { en: 'Units', hi: 'इकाइयां' },
    chapters: { en: 'Chapters', hi: 'अध्याय' },
    tests: { en: 'tests', hi: 'परीक्षाएं' },
    found: { en: 'tests found', hi: 'परीक्षाएं मिलीं' },
    noTests: { en: 'No tests found', hi: 'कोई परीक्षा नहीं' },
    noUnits: { en: 'No units found', hi: 'कोई इकाई नहीं' },
    select: { en: 'Select', hi: 'चुनें' },
    search: { en: 'Search tests by name, chapter, topic, PYQ year...', hi: 'नाम, अध्याय, विषय, PYQ वर्ष से खोजें...' },
    showing: { en: 'Showing', hi: 'दिखाए गए' },
    of: { en: 'of', hi: 'में से' },
    allTests: { en: 'All Tests', hi: 'सभी परीक्षाएं' },
    pyqTests: { en: 'PYQ Tests', hi: 'PYQ परीक्षाएं' },
    pyqDesc: { en: 'All tests containing PYQ questions — any test type (DPP, Practice, etc.)', hi: 'PYQ प्रश्नों वाली सभी परीक्षाएं — कोई भी प्रकार (DPP, Practice, आदि)' },
    createPyqTest: { en: 'Create PYQ Test', hi: 'PYQ टेस्ट बनाएं' },
    topics: { en: 'Topics', hi: 'विषय' },
    allPyqTests: { en: 'All PYQ Tests', hi: 'सभी PYQ परीक्षाएं' },
    testsInUnit: { en: 'Tests in this unit', hi: 'इस इकाई की परीक्षाएं' },
    testsInChapter: { en: 'Tests in this chapter', hi: 'इस अध्याय की परीक्षाएं' },
    noPyqTests: { en: 'No PYQ tests created yet. Create one from the PYQ question bank!', hi: 'अभी तक कोई PYQ परीक्षा नहीं बनाई गई। PYQ प्रश्न बैंक से बनाएं!' },
    pyqOnly: { en: 'PYQ Only', hi: 'केवल PYQ' },
    mixed: { en: 'Mixed (Bank + PYQ)', hi: 'मिश्रित (बैंक + PYQ)' },
    bankOnly: { en: 'Bank Only', hi: 'केवल बैंक' },
  };

  // ═══ LOAD PYQ FILTER DATA ═══
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

  // ═══ LOAD ALL PYQ TESTS — hasPYQ=true (ANY test type) ═══
  const loadAllPyqTests = useCallback(async () => {
    setPyqTestsLoading(true);
    try {
      const testSvc = (await import('../services/testService')).default;
      const res = await testSvc.getTests({
        hasPYQ: 'true',  // ═══ KEY CHANGE: filter by hasPYQ, NOT testType ═══
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

  // ═══ PYQ COMPUTED ═══
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

  // ═══ FILTER PYQ TESTS — uses both unit AND pyqUnits ═══
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

  // ═══ KEYBOARD ═══
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape' && selectionMode) clearSelection();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectionMode]);

  // ═══ NAVIGATION ═══
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
    if (!window.confirm(language === 'hi' ? 'क्या आप इस परीक्षा को संग्रहीत करना चाहते हैं?' : 'Archive this test?')) return;
    try {
      const svc = (await import('../services/testService')).default;
      await svc.deleteTest(id);
      refresh();
      if (view.startsWith('pyq')) loadAllPyqTests();
    } catch { }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(language === 'hi' ? `${selectedTests.size} परीक्षाएं संग्रहीत करें?` : `Archive ${selectedTests.size} tests?`)) return;
    try { await bulkDelete(); } catch { }
  };

  const handleBulkExport = () => { if (selectedTests.size > 0) setShowBatchExport(true); };
  const selectedTestObjects = useMemo(() => tests.filter(t => selectedTests.has(t._id)), [tests, selectedTests]);
  const handleHeroSearch = (e) => { e.preventDefault(); if (heroSearch.trim()) goToSearch(heroSearch.trim()); };

  // ═══ SUB COMPONENTS ═══
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

  // ═══ SOURCE TYPE BADGE for test cards ═══
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

  // ═══ RENDER TEST CARDS ═══
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

  // ═══ RENDER PYQ TEST CARDS ═══
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
            {/* Source badge overlay */}
            <div className="absolute top-2 left-2 z-10">
              <SourceBadge test={test} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════
  //                    MAIN RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <Layout language={language} setLanguage={setGlobalLanguage}>
      {() => (
        <div className="space-y-6" ref={listRef}>

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {view !== 'home' && <Breadcrumb />}
              <div className="flex items-center gap-3">
                {view !== 'home' && (
                  <button onClick={goBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors -ml-2 flex-shrink-0">
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white truncate">
                    {view === 'home' && T.title[language]}
                    {view === 'paper' && PAPER_CONFIGS[filters.paper]?.title[language]}
                    {view === 'unit' && (filters.unit || '')}
                    {view === 'search' && `${pagination.total} ${T.found[language]}`}
                    {view === 'pyq' && T.pyqTests[language]}
                    {view === 'pyq_unit' && (pyqUnits.find(u => u.id === pyqSelectedUnit)?.name || pyqSelectedUnit)}
                    {view === 'pyq_chapter' && pyqSelectedChapter}
                  </h1>
                  {view === 'home' && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{T.subtitle[language]}</p>}
                  {view === 'pyq' && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{T.pyqDesc[language]}</p>}
                  {view === 'paper' && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{PAPER_CONFIGS[filters.paper]?.subtitle[language]}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {tests.length > 0 && (view === 'search' || view === 'unit') && (
                <button onClick={() => { if (selectionMode) clearSelection(); setSelectionMode(!selectionMode); }}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                    ${selectionMode ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-300 dark:ring-primary-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  <span className="hidden sm:inline">{T.select[language]}</span>
                </button>
              )}
              <button onClick={() => { refresh(); if (view.startsWith('pyq')) loadAllPyqTests(); }} disabled={loading}
                className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors disabled:opacity-50">
                <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => navigate('/tests/create')}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> {T.create[language]}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectionMode && selectedTests.size > 0 && (
            <BulkActions selectedCount={selectedTests.size} totalCount={tests.length}
              onSelectAll={selectAll} onClearSelection={clearSelection}
              onBulkDelete={handleBulkDelete} onBulkExport={handleBulkExport}
              loading={bulkLoading} language={language} />
          )}

          {/* ═══════════ HOME VIEW ═══════════ */}
          {view === 'home' && (
            <div className="space-y-8 animate-fade-in">
              {showStats && <QuickStats stats={stats} language={language} onClose={() => setShowStats(false)}
                collapsed={statsCollapsed} onToggle={() => setStatsCollapsed(!statsCollapsed)} />}

              {/* Hero Search */}
              <form onSubmit={handleHeroSearch} className="relative max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/15 to-purple-500/15 rounded-2xl blur-xl -z-10" />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input ref={searchRef} type="text" value={heroSearch} onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={T.search[language]}
                  className="w-full pl-14 pr-12 py-4 text-base border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 shadow-lg transition-all" />
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 font-mono">Ctrl+K</kbd>
              </form>

              {/* Paper Selection */}
              <div>
                <SectionHeader icon={FolderOpen} title={T.browseBy[language]} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
                  {Object.entries(PAPER_CONFIGS).map(([key, cfg]) => {
                    const count = countsByPaper[key] || 0;
                    const Icon = cfg.icon;
                    return (
                      <button key={key} onClick={() => selectPaper(key)}
                        className="relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1.5 group">
                        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundImage: cfg.pattern }} />
                        <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br ${cfg.gradient} opacity-[0.07] group-hover:opacity-[0.15] group-hover:scale-125 transition-all duration-500`} />
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cfg.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl`} />
                        <div className={`w-16 h-16 bg-gradient-to-br ${cfg.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{cfg.title[language]}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{cfg.subtitle[language]}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">{cfg.description[language]}</p>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className={`text-4xl font-black bg-gradient-to-r ${cfg.gradient} bg-clip-text text-transparent`}>{count}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{T.tests[language]}</span>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ═══ PYQ TESTS CARD — shows count of ALL tests with PYQ ═══ */}
              <div>
                <SectionHeader icon={Star} title={T.pyqTests[language]} />
                <button onClick={goToPYQ}
                  className="w-full mt-4 relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-500 bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800 hover:shadow-2xl hover:-translate-y-1 group">
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(251,191,36,0.12) 0%, transparent 50%)' }} />
                  <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-[0.07] group-hover:opacity-[0.15] group-hover:scale-125 transition-all duration-500" />
                  <div className="flex items-center gap-6 relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all flex-shrink-0">
                      <Star className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{T.pyqTests[language]}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{T.pyqDesc[language]}</p>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                          <ClipboardList className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{totalPyqTests} {T.tests[language]}</span>
                        </div>
                        {/* Source breakdown */}
                        {(countsBySource.pyq || 0) > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600">{countsBySource.pyq} {T.pyqOnly[language]}</span>
                          </div>
                        )}
                        {(countsBySource.mixed || 0) > 0 && (
                          <div className="flex items-center gap-1.5 bg-purple-50/50 px-2.5 py-1 rounded-lg border border-purple-100">
                            <GitMerge className="w-3 h-3 text-purple-500" />
                            <span className="text-xs font-bold text-purple-600">{countsBySource.mixed} {T.mixed[language]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:ring-4 ring-amber-200/50 transition-all flex-shrink-0">
                      <ArrowRight className="w-6 h-6 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Type Quick Access */}
              {Object.keys(countsByType).length > 0 && (
                <div>
                  <SectionHeader icon={Sparkles} title={T.byType[language]} />
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mt-4">
                    {Object.entries(countsByType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                      const cfg = TEST_TYPE_CONFIG[type] || {};
                      const Icon = TYPE_ICONS[type] || ClipboardList;
                      const grad = TYPE_GRADIENTS[type] || 'from-gray-500 to-gray-600';
                      return (
                        <button key={type} onClick={() => { updateFilter('testType', type); goToSearch(); }}
                          className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-800 group">
                          <div className={`w-10 h-10 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                            <Icon className="w-4.5 h-4.5 text-white" />
                          </div>
                          <div className="text-xl font-black text-gray-900 dark:text-white">{count}</div>
                          <div className="text-[10px] text-gray-500 font-bold mt-0.5">{cfg.shortCode || type}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View All */}
              <button onClick={() => goToSearch()}
                className="w-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-600 rounded-2xl p-5 flex items-center justify-between hover:shadow-xl transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><List className="w-6 h-6 text-white" /></div>
                  <div className="text-left"><h3 className="font-bold text-gray-900 dark:text-white">{T.viewAll[language]}</h3><p className="text-sm text-gray-500">{totalActive} {T.tests[language]}</p></div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          )}

          {/* ═══════════ PYQ MAIN VIEW ═══════════ */}
          {view === 'pyq' && (
            <div className="space-y-6 animate-fade-in">
              {/* PYQ Header Banner */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl" />
                <div className="relative p-6 sm:p-8">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                      <Star className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-black text-white mb-1">{T.pyqTests[language]}</h2>
                      <p className="text-white/80 text-sm">{T.pyqDesc[language]}</p>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
                          <ClipboardList className="w-4 h-4 text-white/90" />
                          <span className="text-white font-bold text-sm">{allPyqTests.length}</span>
                          <span className="text-white/70 text-xs">{T.tests[language]}</span>
                        </div>
                        {/* Source breakdown in banner */}
                        {(() => {
                          const pyqOnly = allPyqTests.filter(t => t.sourceType === 'pyq').length;
                          const mixed = allPyqTests.filter(t => t.sourceType === 'mixed').length;
                          return (
                            <>
                              {pyqOnly > 0 && (
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                                  <Star className="w-3.5 h-3.5 text-white/80" />
                                  <span className="text-white/90 text-xs font-bold">{pyqOnly} PYQ-only</span>
                                </div>
                              )}
                              {mixed > 0 && (
                                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
                                  <GitMerge className="w-3.5 h-3.5 text-white/80" />
                                  <span className="text-white/90 text-xs font-bold">{mixed} Mixed</span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <button onClick={() => navigate('/tests/create')}
                      className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-sm rounded-xl border border-white/20 shadow-lg transition-all">
                      <PlusCircle className="w-4 h-4" /> {T.createPyqTest[language]}
                    </button>
                  </div>
                </div>
              </div>

              {pyqLoading || pyqTestsLoading ? <TestListSkeleton count={4} /> : (
                <>
                  {/* Browse by Unit */}
                  {pyqUnits.length > 0 && (
                    <div>
                      <SectionHeader icon={Layers} title={T.units[language]} count={pyqUnits.length} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {pyqUnits.map((unit, idx) => {
                          const cl = UNIT_COLORS[idx % UNIT_COLORS.length];
                          const unitNum = unit.id?.match(/\d+/)?.[0] || idx + 1;
                          const testCount = pyqTestCountByUnit[unit.id] || 0;
                          return (
                            <button key={unit.id} onClick={() => selectPYQUnit(unit.id)}
                              className={`relative overflow-hidden p-5 rounded-2xl border-2 text-left transition-all duration-300 bg-gradient-to-br ${cl.light} ${cl.border} hover:shadow-xl hover:-translate-y-1 group`}>
                              <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${cl.grad} opacity-[0.08] group-hover:opacity-[0.18] group-hover:scale-150 transition-all duration-500`} />
                              <div className="flex items-start justify-between gap-3 relative">
                                <div className="flex-1 min-w-0">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${cl.grad} text-white text-xs font-black mb-3 shadow-md`}>
                                    <Hash className="w-3 h-3" /> UNIT {unitNum}
                                  </div>
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2">{unit.name}</h4>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                      <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                                      <span className={`text-lg font-black ${cl.text}`}>{testCount}</span>
                                      <span className="text-xs text-gray-500">{T.tests[language]}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-xs text-gray-400">{unit.count} Q</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-white/60 dark:bg-gray-800/60 flex items-center justify-center group-hover:ring-4 ring-gray-200/50 dark:ring-gray-700/50 transition-all flex-shrink-0">
                                  <ChevronRight className={`w-5 h-5 ${cl.text} group-hover:translate-x-0.5 transition-transform`} />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All PYQ Tests */}
                  <div>
                    <SectionHeader icon={ClipboardList} title={`${T.allPyqTests[language]} (${allPyqTests.length})`}
                      extra={
                        <button onClick={() => navigate('/tests/create')} className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1">
                          <PlusCircle className="w-3.5 h-3.5" /> {T.createPyqTest[language]}
                        </button>
                      } />
                    <div className="mt-4">
                      {renderPyqTests(allPyqTests)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════ PYQ UNIT VIEW ═══════════ */}
          {view === 'pyq_unit' && (
            <div className="space-y-6 animate-fade-in">
              {pyqChaptersForUnit.length > 0 && (
                <div>
                  <SectionHeader icon={BookCopy} title={T.chapters[language]} count={pyqChaptersForUnit.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {pyqChaptersForUnit.map((ch, idx) => {
                      const cl = UNIT_COLORS[idx % UNIT_COLORS.length];
                      const testCount = pyqTestCountByChapter[ch.chapter] || 0;
                      return (
                        <button key={ch.chapter} onClick={() => selectPYQChapter(ch.chapter)}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-xl transition-all duration-300 group hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-800">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 bg-gradient-to-br ${cl.grad} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white text-xs font-black`}>{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2">{ch.chapter}</h4>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-amber-600 font-bold">{testCount} {T.tests[language]}</span>
                                <span className="text-xs text-gray-400">{ch.count} Q</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <SectionHeader icon={ClipboardList} title={`${T.testsInUnit[language]} (${filteredPyqTests.length})`}
                  extra={
                    <button onClick={() => navigate('/tests/create')} className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5" /> {T.createPyqTest[language]}
                    </button>
                  } />
                <div className="mt-4">
                  {renderPyqTests(filteredPyqTests)}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PYQ CHAPTER VIEW ═══════════ */}
          {view === 'pyq_chapter' && (
            <div className="space-y-6 animate-fade-in">
              {pyqTopicsForChapter.length > 0 && (
                <div>
                  <SectionHeader icon={Tag} title={T.topics[language]} count={pyqTopicsForChapter.length} />
                  <div className="flex flex-wrap gap-3 mt-4">
                    {pyqTopicsForChapter.map(tp => (
                      <span key={tp.topic} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl text-sm font-medium text-purple-700 dark:text-purple-400 shadow-sm">
                        <Tag className="w-3.5 h-3.5" /> {tp.topic} <span className="text-xs text-gray-400">({tp.count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <SectionHeader icon={ClipboardList} title={`${T.testsInChapter[language]} (${filteredPyqTests.length})`}
                  extra={
                    <button onClick={() => navigate('/tests/create')} className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1">
                      <PlusCircle className="w-3.5 h-3.5" /> {T.createPyqTest[language]}
                    </button>
                  } />
                <div className="mt-4">
                  {renderPyqTests(filteredPyqTests)}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PAPER VIEW ═══════════ */}
          {view === 'paper' && filters.paper && (
            <div className="space-y-6 animate-fade-in">
              {(() => {
                const cfg = PAPER_CONFIGS[filters.paper];
                const Icon = cfg.icon;
                const paperCount = countsByPaper[filters.paper] || 0;
                return (
                  <div className={`relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-r ${cfg.gradient}`}>
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: cfg.pattern }} />
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0 border border-white/10">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-3xl font-black text-white mb-1">{cfg.title[language]}</h2>
                          <p className="text-white/90 text-sm font-medium">{cfg.subtitle[language]}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-4">
                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
                              <ClipboardList className="w-4 h-4 text-white/90" />
                              <span className="text-white font-bold text-sm">{paperCount}</span>
                              <span className="text-white/70 text-xs">{T.tests[language]}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3.5 py-2 border border-white/10">
                              <Layers className="w-4 h-4 text-white/90" />
                              <span className="text-white font-bold text-sm">{unitsForPaper.length}</span>
                              <span className="text-white/70 text-xs">{T.units[language]}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); navigate('/tests/create'); }}
                          className="hidden sm:flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all">
                          <PlusCircle className="w-4 h-4" /> {T.create[language]}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button onClick={() => goToSearch()}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between hover:shadow-lg transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center"><List className="w-5 h-5 text-gray-500" /></div>
                  <div className="text-left"><h4 className="font-bold text-gray-900 dark:text-white text-sm">{T.viewAll[language]}</h4><p className="text-xs text-gray-500">{countsByPaper[filters.paper] || 0} {T.tests[language]}</p></div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </button>

              <SectionHeader icon={Layers} title={T.units[language]} count={unitsForPaper.length} />
              {loading ? <TestListSkeleton count={4} /> : unitsForPaper.length === 0 ? <EmptyBox text={T.noUnits[language]} /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitsForPaper.map((item, idx) => {
                    const cl = UNIT_COLORS[idx % UNIT_COLORS.length];
                    const unitNum = item.unit?.match(/\d+/)?.[0] || idx + 1;
                    const testTypeIcons = (item.testTypes || []).slice(0, 4);
                    return (
                      <button key={item.unit} onClick={() => selectUnit(item.unit)}
                        className={`relative overflow-hidden p-5 rounded-2xl border-2 text-left transition-all duration-300 bg-gradient-to-br ${cl.light} ${cl.border} hover:shadow-xl hover:-translate-y-1 group`}>
                        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${cl.grad} opacity-[0.08] group-hover:opacity-[0.18] group-hover:scale-150 transition-all duration-500`} />
                        <div className="flex items-start justify-between gap-3 relative">
                          <div className="flex-1 min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${cl.grad} text-white text-xs font-black mb-3 shadow-md`}>
                              <Hash className="w-3 h-3" /> UNIT {unitNum}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-3 line-clamp-2">{item.unit}</h4>
                            {testTypeIcons.length > 0 && (
                              <div className="flex items-center gap-1.5 mb-3">
                                {testTypeIcons.map((type) => {
                                  const TIcon = TYPE_ICONS[type] || ClipboardList;
                                  const tGrad = TYPE_GRADIENTS[type] || 'from-gray-400 to-gray-500';
                                  return (
                                    <div key={type} className={`w-6 h-6 bg-gradient-to-br ${tGrad} rounded-md flex items-center justify-center shadow-sm`} title={TEST_TYPE_CONFIG[type]?.shortCode}>
                                      <TIcon className="w-3 h-3 text-white" />
                                    </div>
                                  );
                                })}
                                {(item.testTypes || []).length > 4 && <span className="text-[10px] text-gray-400 font-medium">+{item.testTypes.length - 4}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl font-black ${cl.text}`}>{item.count}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{T.tests[language]}</span>
                            </div>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-white/60 dark:bg-gray-800/60 flex items-center justify-center group-hover:ring-4 ring-gray-200/50 dark:ring-gray-700/50 transition-all flex-shrink-0">
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

          {/* ═══════════ UNIT VIEW ═══════════ */}
          {view === 'unit' && (
            <div className="space-y-6 animate-fade-in">
              {chaptersForUnit.length > 0 && (
                <>
                  <SectionHeader icon={BookCopy} title={T.chapters[language]} count={chaptersForUnit.length} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chaptersForUnit.map((ch, idx) => {
                      const cl = UNIT_COLORS[idx % UNIT_COLORS.length];
                      const chTests = tests.filter(t => t.chapter === ch);
                      return (
                        <button key={ch} onClick={() => selectChapter(ch)}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-left hover:shadow-xl transition-all duration-300 group hover:-translate-y-0.5 hover:border-primary-200 dark:hover:border-primary-800">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 bg-gradient-to-br ${cl.grad} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md text-white text-xs font-black`}>{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2">{ch}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{chTests.length} {T.tests[language]}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              <SectionHeader icon={ClipboardList} title={`${T.allTests[language]} (${pagination.total})`}
                extra={<button onClick={() => goToSearch()} className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">{language === 'hi' ? 'फ़िल्टर करें' : 'Filter'} <ArrowUpRight className="w-3.5 h-3.5" /></button>} />
              {renderTests()}
              <PaginationBar />
            </div>
          )}

          {/* ═══════════ SEARCH VIEW ═══════════ */}
          {view === 'search' && (
            <div className="space-y-4 animate-fade-in">
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
      )}
    </Layout>
  );
};

export default TestListPage;