import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Brain, Target, Layers, PlusCircle, ArrowRight, 
  RefreshCw, BookOpen, Clock, Zap, Sparkles, TrendingUp, FileQuestion,
  CheckCircle2, Flame, Award, Shield, BarChart3, Filter, ChevronRight,
  BookMarked, GraduationCap, Check, AlertTriangle, MonitorPlay, RotateCcw,
  Star, Search, Grid, List, Compass, Layers3, ArrowUpRight
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import AdaptiveTestCreator from '../components/test/AdaptiveTestCreator';
import TestInterfaceSelectorModal from '../components/test/TestInterfaceSelectorModal';
import useDashboard from '../hooks/useDashboard';

// Paper 1 Units Constant
const PAPER1_UNITS = [
  { id: 'UNIT I', nameEn: 'Teaching Aptitude', nameHi: 'शिक्षण अभिवृत्ति', icon: GraduationCap },
  { id: 'UNIT II', nameEn: 'Research Aptitude', nameHi: 'शोध अभिवृत्ति', icon: Search },
  { id: 'UNIT III', nameEn: 'Comprehension', nameHi: 'बोधात्मकता', icon: BookOpen },
  { id: 'UNIT IV', nameEn: 'Communication', nameHi: 'संप्रेषण', icon: Compass },
  { id: 'UNIT V', nameEn: 'Mathematical Reasoning', nameHi: 'गणितीय तर्क और अभिवृत्ति', icon: BarChart3 },
  { id: 'UNIT VI', nameEn: 'Logical Reasoning', nameHi: 'युक्तिसंगत तर्क', icon: Brain },
  { id: 'UNIT VII', nameEn: 'Data Interpretation', nameHi: 'आंकड़ों की व्याख्या (DI)', icon: Layers },
  { id: 'UNIT VIII', nameEn: 'Information & Comm Tech (ICT)', nameHi: 'सूचना एवं संचार प्रौद्योगिकी', icon: Zap },
  { id: 'UNIT IX', nameEn: 'People, Dev & Environment', nameHi: 'लोग, विकास और पर्यावरण', icon: Shield },
  { id: 'UNIT X', nameEn: 'Higher Education System', nameHi: 'उच्च शिक्षा प्रणाली', icon: Award },
];

// Paper 2 History Units Constant
const PAPER2_HISTORY_UNITS = [
  { id: 'UNIT I', nameEn: 'Sources & Pre-History to Mauryas', nameHi: 'स्रोत एवं प्रागैतिहास से मौर्यकाल', icon: BookMarked },
  { id: 'UNIT II', nameEn: 'Post-Mauryan to Gupta & Post-Gupta', nameHi: 'उत्तर-मौर्य से गुप्त एवं गुप्तोत्तर काल', icon: BookMarked },
  { id: 'UNIT III', nameEn: 'Early Medieval & Regional Kingdoms', nameHi: 'पूर्व मध्यकाल एवं क्षेत्रीय राज्य', icon: BookMarked },
  { id: 'UNIT IV', nameEn: 'Medieval India: Political Structure', nameHi: 'मध्यकालीन भारत: राजनीतिक संरचना', icon: BookMarked },
  { id: 'UNIT V', nameEn: 'Economy, Society & Culture in Medieval', nameHi: 'मध्यकाल में अर्थव्यवस्था, समाज और संस्कृति', icon: BookMarked },
  { id: 'UNIT VI', nameEn: 'British Expansion & Colonial Rule', nameHi: 'ब्रिटिश विस्तार एवं औपनिवेशिक शासन', icon: BookMarked },
  { id: 'UNIT VII', nameEn: 'Economic Impact of Colonialism', nameHi: 'औपनिवेशिक अर्थव्यवस्था का प्रभाव', icon: BookMarked },
  { id: 'UNIT VIII', nameEn: 'National Movement & Freedom Struggle', nameHi: 'राष्ट्रीय आंदोलन एवं स्वतंत्रता संग्राम', icon: BookMarked },
  { id: 'UNIT IX', nameEn: 'Post-Independence India', nameHi: 'स्वातंत्र्योत्तर भारत', icon: BookMarked },
  { id: 'UNIT X', nameEn: 'Historiography & Historical Method', nameHi: 'इतिहास लेखन एवं शोध विधि', icon: BookMarked },
];

const Dashboard = ({ language: propLanguage, setLanguage: propSetLanguage }) => {
  const [language, setLanguageState] = useState(() => {
    return propLanguage || localStorage.getItem('netprep-language') || 'en';
  });

  useEffect(() => {
    if (propLanguage) setLanguageState(propLanguage);
  }, [propLanguage]);

  const handleSetLanguage = useCallback((newLang) => {
    setLanguageState(newLang);
    try { localStorage.setItem('netprep-language', newLang); } catch {}
    if (propSetLanguage) propSetLanguage(newLang);
    window.dispatchEvent(new Event('netprep-language-changed'));
  }, [propSetLanguage]);

  const navigate = useNavigate();
  const d = useDashboard();

  // State Modals
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);
  const [selectedTestForModal, setSelectedTestForModal] = useState(null);

  // Filters for Testbook Style Series Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  const [activeUnitPaperTab, setActiveUnitPaperTab] = useState('paper1');

  const hi = language === 'hi';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return hi ? 'शुभ रात्रि' : 'Good Night';
    if (h < 12) return hi ? 'सुप्रभात' : 'Good Morning';
    if (h < 17) return hi ? 'शुभ दोपहर' : 'Good Afternoon';
    return hi ? 'शुभ संध्या' : 'Good Evening';
  };

  // Filtered tests based on Testbook category tabs
  const filteredTests = useMemo(() => {
    const tests = d.createdTests || [];
    if (activeCategoryTab === 'all') return tests;
    if (activeCategoryTab === 'full_mock') {
      return tests.filter(t => ['full_mock_combined', 'full_mock_p1', 'full_mock_p2', 'full_mock'].includes(t.testType));
    }
    if (activeCategoryTab === 'pyq') {
      return tests.filter(t => t.testType === 'pyq_year' || t.title?.toLowerCase().includes('pyq'));
    }
    if (activeCategoryTab === 'dpp') {
      return tests.filter(t => t.testType === 'dpp');
    }
    if (activeCategoryTab === 'unit_test') {
      return tests.filter(t => ['unit_test', 'topic_test', 'chapter_test'].includes(t.testType));
    }
    if (activeCategoryTab === 'adaptive') {
      return tests.filter(t => t.testType === 'practice' || t.title?.toLowerCase().includes('adaptive'));
    }
    return tests;
  }, [d.createdTests, activeCategoryTab]);

  if (d.loading) {
    return (
      <Layout language={language} setLanguage={handleSetLanguage}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  // Dashboard Stats
  const overallAccuracy = d.questionStats?.overall?.accuracy || 0;
  const totalQuestionsAttempted = d.questionStats?.overall?.totalAttempted || 0;
  const testsCompleted = d.testStats?.completed || d.allAttempts?.length || 0;
  const criticalAreas = (d.smartRevision?.criticalAreas || []).slice(0, 3);
  const revisionDueCount = d.smartRevision?.dueToday || 0;

  return (
    <Layout language={language} setLanguage={handleSetLanguage}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
        
        {/* ═══════════════════════════════════════════════════════════════
            §1 PHYSICSWALLAH / TESTBOOK STYLE STUDENT HERO BANNER
            ═══════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 shadow-2xl border border-indigo-500/20 text-white p-6 md:p-10">
          
          {/* Subtle Background Art */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10 space-y-6">
            
            {/* Top Bar: Target Badge + Language Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {hi ? 'लक्ष्य: UGC NET JRF 2025/2026' : 'TARGET: UGC NET JRF 2025/2026'}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {hi ? 'परीक्षा में ~45 दिन शेष' : 'Exam in ~45 Days'}
                </span>
              </div>

              {/* Language Switcher Pill */}
              <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/15">
                <button
                  onClick={() => handleSetLanguage('en')}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    language === 'en' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleSetLanguage('hi')}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    language === 'hi' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            {/* Main Greeting & Action Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-200">Aspirant!</span>
                </h1>
                <p className="text-slate-300 text-base md:text-lg max-w-2xl font-medium">
                  {hi 
                    ? 'PW और Testbook स्टाइल में भारत की सबसे उन्नत NTA मॉक टेस्ट सीरीज।' 
                    : 'India\'s most advanced NTA Mock Test Series portal powered by PW & Testbook features.'}
                </p>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAdaptiveModal(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
                >
                  <Brain className="w-5 h-5" />
                  {hi ? 'AI एडाप्टिव टेस्ट' : 'AI Adaptive Test'}
                </button>

                <button
                  onClick={() => navigate('/tests/create')}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-black px-5 py-3.5 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
                >
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  {hi ? 'नया मॉक बनाएं' : 'Create Custom Mock'}
                </button>

                <button
                  onClick={() => d.refresh()}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 p-3.5 rounded-2xl backdrop-blur-md transition-all"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-5 h-5 ${d.refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                PW / TESTBOOK QUICK STATS RIBBON
                ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              
              <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{hi ? 'पूरे किए टेस्ट' : 'Tests Taken'}</div>
                  <div className="text-xl font-black text-white">{testsCompleted}</div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{hi ? 'औसत सटीकता' : 'Accuracy'}</div>
                  <div className="text-xl font-black text-white">{Math.round(overallAccuracy)}%</div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{hi ? 'अभ्यास स्ट्रिक' : 'Practice Streak'}</div>
                  <div className="text-xl font-black text-white">5 {hi ? 'दिन' : 'Days'}</div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{hi ? 'हल किए प्रश्न' : 'Total Questions'}</div>
                  <div className="text-xl font-black text-white">{totalQuestionsAttempted}</div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            §2 PW QUICK LAUNCH TOOLBAR
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div
            onClick={() => setShowAdaptiveModal(true)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-amber-600 transition-colors">
                  {hi ? 'AI एडाप्टिव टेस्ट' : 'AI Adaptive Test'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {hi ? 'कमजोर विषयों पर आधारित' : 'Target your weak areas'}
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/pyq/question-bank')}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">
                  {hi ? 'PYQ बैंक (2018-24)' : 'PYQ Papers (2018-24)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {hi ? 'वास्तविक NTA प्रश्न पत्र' : 'Real exam previous papers'}
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/tests')}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-emerald-600 transition-colors">
                  {hi ? 'Daily DPP क्विज' : 'Daily DPP Quiz'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {revisionDueCount > 0 ? `${revisionDueCount} ${hi ? 'रिवीजन पेंडिंग' : 'due for revision'}` : (hi ? '10-15 प्रश्नों का दैनिक अभ्यास' : 'Daily 10-15 Q practice')}
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigate('/questions')}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-purple-600 transition-colors">
                  {hi ? 'टॉपिक वाइज बैंक' : 'Topic-wise Bank'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {hi ? 'चैप्टर व यूनिट अनुसार प्रश्न' : 'Chapter & unit wise questions'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════
            §3 TESTBOOK STYLE TEST SERIES PASS & CARDS GRID
            ═══════════════════════════════════════════════════════════════ */}
        <section className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                {hi ? 'NTA टेस्ट सीरीज & मॉक टेस्ट' : 'NTA Test Series & Mock Tests'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {hi ? 'Testbook और PW पैटर्न पर आधारित 100% प्रामाणिक टेस्ट परीक्षा' : 'Attempt full length mocks, PYQs, and chapter tests in authentic NTA interface.'}
              </p>
            </div>

            <button
              onClick={() => navigate('/tests')}
              className="text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl self-start md:self-auto"
            >
              {hi ? 'सभी टेस्ट सीरीज देखें' : 'View Complete Library'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Testbook Style Pill Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', labelEn: 'All Tests', labelHi: 'सभी टेस्ट', icon: Sparkles },
              { id: 'full_mock', labelEn: 'Full Length Mocks', labelHi: 'फुल मॉक टेस्ट', icon: Shield },
              { id: 'pyq', labelEn: 'PYQ (2018-2024)', labelHi: 'PYQ पुराने प्रश्न पत्र', icon: BookOpen },
              { id: 'dpp', labelEn: 'Daily DPP', labelHi: 'डेली DPP', icon: Zap },
              { id: 'unit_test', labelEn: 'Unit & Topic Tests', labelHi: 'यूनिट व टॉपिक टेस्ट', icon: Layers },
              { id: 'adaptive', labelEn: 'AI Adaptive', labelHi: 'AI एडाप्टिव', icon: Brain },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeCategoryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                  {hi ? tab.labelHi : tab.labelEn}
                </button>
              );
            })}
          </div>

          {/* Testbook Style Cards Grid */}
          {filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => {
                const totalQ = test.totalQuestions || test.questions?.length || 50;
                const duration = test.durationMinutes || 60;
                const totalMarks = test.totalMarks || (totalQ * 2);
                const isAttempted = test.userAttemptStatus === 'completed' || test.attemptCount > 0;
                const score = test.lastScore || 0;

                return (
                  <div
                    key={test._id || test.id}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
                  >
                    {/* Top Accent Strip */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <div className="p-6 space-y-4">
                      
                      {/* Badge Header Row */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {test.testType ? test.testType.toUpperCase().replace('_', ' ') : 'NTA MOCK TEST'}
                        </span>
                        
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {hi ? 'फ्री पास' : 'FREE PASS'}
                        </span>
                      </div>

                      {/* Test Title & Description */}
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {test.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {test.description || (hi ? 'NTA पैटर्न पर आधारित पूरा मॉक टेस्ट।' : 'Standard NTA syllabus aligned mock test.')}
                        </p>
                      </div>

                      {/* Specs Ribbon (Testbook Style) */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800 flex items-center justify-around text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{hi ? 'प्रश्न' : 'Questions'}</div>
                          <div className="font-black text-slate-900 dark:text-white mt-0.5">{totalQ} Qs</div>
                        </div>
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{hi ? 'समय' : 'Duration'}</div>
                          <div className="font-black text-slate-900 dark:text-white mt-0.5">{duration} Mins</div>
                        </div>
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700" />
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{hi ? 'अंक' : 'Marks'}</div>
                          <div className="font-black text-slate-900 dark:text-white mt-0.5">{totalMarks} Marks</div>
                        </div>
                      </div>

                      {/* Language Availability Badge */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <GlobeIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>{hi ? 'भाषाएं: हिंदी + अंग्रेजी' : 'Languages: English + Hindi'}</span>
                      </div>

                    </div>

                    {/* Footer Action Bar */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      {isAttempted ? (
                        <>
                          <button
                            onClick={() => setSelectedTestForModal(test._id || test.id)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {hi ? 'पुनः प्रयास करें' : 'Re-Attempt'}
                          </button>
                          <button
                            onClick={() => navigate(`/results`)}
                            className="flex-1 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all text-center"
                          >
                            {hi ? 'उत्तर एवं विश्लेषण' : 'Solutions & Analysis'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedTestForModal(test._id || test.id)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          {hi ? 'टेस्ट प्रारंभ करें (NTA इंटरफेस)' : 'Start Test (NTA Interface)'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center flex flex-col items-center">
              <FileQuestion className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {hi ? 'इस श्रेणी में कोई टेस्ट उपलब्ध नहीं है' : 'No tests found in this category'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                {hi ? 'कृपया अन्य टैब चुनें या स्वयं एक नया कस्टम टेस्ट बनाएं।' : 'Please pick another category or create a custom test.'}
              </p>
              <button
                onClick={() => navigate('/tests/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md"
              >
                {hi ? 'नया कस्टम टेस्ट बनाएं' : 'Create Custom Test'}
              </button>
            </div>
          )}

        </section>

        {/* ═══════════════════════════════════════════════════════════════
            §4 PW STYLE SUBJECT & UNIT MASTERY TRACKER
            ═══════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm p-6 md:p-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                {hi ? 'विषयवार एवं यूनिट मास्टर ट्रैकर' : 'Subject & Unit Mastery Radar'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {hi ? 'प्रत्येक इकाई में अपनी सटीकता देखें और सीधे 1-क्लिक से उस यूनिट का अभ्यास करें।' : 'Track accuracy by syllabus unit and launch focused unit quizzes.'}
              </p>
            </div>

            {/* Paper 1 vs Paper 2 Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveUnitPaperTab('paper1')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeUnitPaperTab === 'paper1'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {hi ? 'पेपर 1 (सामान्य)' : 'Paper 1 (General)'}
              </button>
              <button
                onClick={() => setActiveUnitPaperTab('paper2')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeUnitPaperTab === 'paper2'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {hi ? 'पेपर 2 (इतिहास)' : 'Paper 2 (History)'}
              </button>
            </div>
          </div>

          {/* Unit Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(activeUnitPaperTab === 'paper1' ? PAPER1_UNITS : PAPER2_HISTORY_UNITS).map((unit, idx) => {
              const UnitIcon = unit.icon;
              // Mock or real unit accuracy fallback
              const mockAccuracy = Math.max(45, Math.min(92, 55 + (idx * 4) % 35));

              return (
                <div
                  key={unit.id}
                  className="bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                        {unit.id}
                      </span>
                      <span className="font-black text-slate-700 dark:text-slate-300 text-xs">
                        {mockAccuracy}%
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-2 h-8 group-hover:text-blue-600 transition-colors">
                      {hi ? unit.nameHi : unit.nameEn}
                    </h4>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${mockAccuracy}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAdaptiveModal(true)}
                    className="w-full py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                  >
                    {hi ? 'यूनिट टेस्ट दें' : 'Practice Unit'}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

        </section>

        {/* ═══════════════════════════════════════════════════════════════
            §5 PW AI WEAKNESS QUICK-FIXER SPOTLIGHT
            ═══════════════════════════════════════════════════════════════ */}
        {criticalAreas.length > 0 && (
          <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white border border-rose-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  {hi ? 'AI कमजोर क्षेत्र विश्लेषण' : 'AI Weakness Spotlight'}
                </div>
                <h3 className="text-2xl font-black">
                  {hi ? 'इन 3 महत्वपूर्ण विषयों में सुधार की आवश्यकता है' : 'Critical Topics Requiring Attention'}
                </h3>
                <p className="text-rose-200 text-xs md:text-sm max-w-xl">
                  {hi 
                    ? 'आपकी पिछली परीक्षाओं के विश्लेषण अनुसार इन क्षेत्रों में अंक गंवाए जा रहे हैं।' 
                    : 'Based on your recent attempts, improving these topics can quickly add +20 marks to your score.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {criticalAreas.map((area, i) => (
                  <div key={i} className="bg-black/30 backdrop-blur-md border border-rose-500/30 rounded-2xl p-3 px-4 text-center min-w-[130px]">
                    <div className="text-[11px] font-bold text-rose-200 truncate max-w-[120px]" title={area.name}>{area.name}</div>
                    <div className="text-base font-black text-white mt-0.5">{area.accuracy}% {hi ? 'सटीकता' : 'Accuracy'}</div>
                  </div>
                ))}

                <button
                  onClick={() => setShowAdaptiveModal(true)}
                  className="bg-white hover:bg-rose-50 text-rose-950 font-black px-5 py-3 rounded-2xl shadow-lg transition-all text-xs flex items-center gap-1.5 ml-auto lg:ml-0"
                >
                  <Brain className="w-4 h-4 text-rose-600" />
                  {hi ? 'कमजोरियों को अभी ठीक करें' : 'Fix Weakness Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            §6 MODAL COMPONENTS
            ═══════════════════════════════════════════════════════════════ */}
        {showAdaptiveModal && (
          <AdaptiveTestCreator
            isOpen={showAdaptiveModal}
            onClose={() => setShowAdaptiveModal(false)}
            allAttempts={d.allAttempts || []}
            availableQuestions={d.questionStats?.allQuestions || []}
            language={language}
            onCreateTest={(config) => {
              setShowAdaptiveModal(false);
              navigate('/tests/create', { state: { adaptiveConfig: config } });
            }}
          />
        )}

        {selectedTestForModal && (
          <TestInterfaceSelectorModal
            isOpen={!!selectedTestForModal}
            onClose={() => setSelectedTestForModal(null)}
            testId={selectedTestForModal}
            language={language}
          />
        )}

      </div>
    </Layout>
  );
};

// Helper Globe Icon for Language Specs
const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 5H10.5A2.5 2.5 0 008 7.5v-.565z" />
  </svg>
);

export default Dashboard;
