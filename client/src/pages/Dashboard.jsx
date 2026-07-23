import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Play, Target, BookOpen, Upload, BarChart3, Clock, CheckCircle, TrendingUp,
  TrendingDown, Zap, ArrowRight, ChevronDown, ChevronUp, ChevronRight,
  FileQuestion, ClipboardList, Flame, Star, Medal, Crown, AlertTriangle,
  RefreshCw, Calendar, Timer, Shield, Award, Brain, Lightbulb, Eye,
  Layers, Coffee, Sun, Moon, Sunset, Hash, Flag, Minus,
  ArrowUpRight, ArrowDownRight, Activity, BookMarked, GraduationCap,
  Sparkles, Compass, CheckSquare
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';
import AutoSyllabusPlanner from '../components/dashboard/AutoSyllabusPlanner';

// ═══════════════════════════════════════════════════════
//  ICON MAP (for dynamic icon rendering from hook data)
// ═══════════════════════════════════════════════════════
const ICON_MAP = {
  ClipboardList, Target, TrendingUp, TrendingDown, Clock, RefreshCw, Flame, Timer,
  BarChart2: BarChart3, AlertTriangle, BookOpen, Zap, Play, Star, Medal, Crown,
  Layers, Sun, Coffee, Moon, Sunset, CheckCircle, Flag,
};
const DynIcon = ({ name, ...props }) => {
  const I = ICON_MAP[name] || Zap;
  return <I {...props} />;
};

// ═══════════════════════════════════════════════════════
//  SECTION WRAPPER (collapsible)
// ═══════════════════════════════════════════════════════
const Section = ({ icon: Icon, title, titleHi, language, children, defaultOpen = true, badge, badgeColor = 'blue' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-${badgeColor}-500 to-${badgeColor}-600 flex items-center justify-center shadow-md`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? titleHi : title}
          </h2>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-${badgeColor}-100 text-${badgeColor}-700 dark:bg-${badgeColor}-900/30 dark:text-${badgeColor}-300`}>
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 animate-fade-in">{children}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  GAUGE COMPONENT (circular progress)
// ═══════════════════════════════════════════════════════
const CircularGauge = ({ value, max = 100, size = 100, strokeWidth = 8, color = '#3b82f6', label, sublabel, showPct = true }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xl font-black" style={{ color }}>{showPct ? `${Math.round(value)}%` : value}</span>
        {sublabel && <span className="text-[9px] text-gray-500 font-medium">{sublabel}</span>}
      </div>
      {label && <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-1">{label}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  MINI STAT CARD
// ═══════════════════════════════════════════════════════
const MiniStat = ({ icon: Icon, label, value, sub, color = 'blue', onClick }) => (
  <div onClick={onClick}
    className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
    <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 opacity-10 blur-2xl`} />
    <div className="relative flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center shadow-md flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
//  PROGRESS BAR
// ═══════════════════════════════════════════════════════
const ProgressBar = ({ value, max = 100, color = '#3b82f6', height = 6, showLabel = false, label }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
          <span className="font-bold" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(156,163,175,0.2)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  COVERAGE LEVEL BADGE
// ═══════════════════════════════════════════════════════
const LevelBadge = ({ level, language }) => {
  const map = {
    mastered:    { en: 'Mastered',    hi: 'माहिर',    bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    learning:    { en: 'Learning',    hi: 'सीख रहे',   bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400' },
    in_progress: { en: 'In Progress', hi: 'जारी',      bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400' },
    weak:        { en: 'Weak',        hi: 'कमजोर',    bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400' },
    not_started: { en: 'Not Started', hi: 'शुरू नहीं', bg: 'bg-gray-100 dark:bg-gray-700',          text: 'text-gray-500 dark:text-gray-400' },
    no_tests:    { en: 'No Tests',    hi: 'टेस्ट नहीं', bg: 'bg-gray-50 dark:bg-gray-800',           text: 'text-gray-400' },
  };
  const l = map[level] || map.not_started;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.bg} ${l.text}`}>{language === 'hi' ? l.hi : l.en}</span>;
};

// ═══════════════════════════════════════════════════════
//  TREND ARROW
// ═══════════════════════════════════════════════════════
const TrendArrow = ({ direction, size = 14 }) => {
  if (direction === 'up') return <ArrowUpRight className="text-emerald-500" style={{ width: size, height: size }} />;
  if (direction === 'down') return <ArrowDownRight className="text-red-500" style={{ width: size, height: size }} />;
  return <Minus className="text-gray-400" style={{ width: size, height: size }} />;
};

// ═══════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════
const Dashboard = ({ language: propLanguage, setLanguage: propSetLanguage }) => {
  // Sync language with state, localStorage, and props
  const [language, setLanguageState] = useState(() => {
    return propLanguage || localStorage.getItem('netprep-language') || 'en';
  });

  useEffect(() => {
    if (propLanguage) setLanguageState(propLanguage);
  }, [propLanguage]);

  useEffect(() => {
    const handleLangSync = () => {
      const stored = localStorage.getItem('netprep-language') || 'en';
      setLanguageState(stored);
    };
    window.addEventListener('storage', handleLangSync);
    window.addEventListener('netprep-language-changed', handleLangSync);
    return () => {
      window.removeEventListener('storage', handleLangSync);
      window.removeEventListener('netprep-language-changed', handleLangSync);
    };
  }, []);

  const handleSetLanguage = useCallback((newLang) => {
    setLanguageState(newLang);
    try { localStorage.setItem('netprep-language', newLang); } catch {}
    if (propSetLanguage) propSetLanguage(newLang);
    window.dispatchEvent(new Event('netprep-language-changed'));
  }, [propSetLanguage]);

  const d = useDashboard();
  const navigate = useNavigate();
  const [examDateInput, setExamDateInput] = useState(d.examDate || '');

  const hi = language === 'hi';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return hi ? 'शुभ रात्रि' : 'Good Night';
    if (h < 12) return hi ? 'सुप्रभात' : 'Good Morning';
    if (h < 17) return hi ? 'शुभ दोपहर' : 'Good Afternoon';
    return hi ? 'शुभ संध्या' : 'Good Evening';
  };

  const handleSetExamDate = () => {
    if (examDateInput) d.setExamDate(examDateInput);
  };

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  if (d.loading) {
    return (
      <Layout language={language} setLanguage={handleSetLanguage}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
          ))}
        </div>
      </Layout>
    );
  }

  const ecc = d.examCommandCenter;
  const jp = d.jrfProbability;
  const sc = d.syllabusCoverage;
  const sr = d.smartRevision;
  const dr = d.dailyReport;
  const mj = d.mistakeJournal;
  const sa = d.speedAnalytics;
  const wcm = d.weeklyChapterMatrix;
  const pr = d.personalRecords;
  const tod = d.timeOfDayAnalysis;

  return (
    <Layout language={language} setLanguage={handleSetLanguage}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">

        {/* ════════════════════════════════════════════
            §1  HERO: EXAM COMMAND CENTER
        ════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-6 md:p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          <div className="relative z-10">
            {/* Top row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-black mb-1">{getGreeting()}</h1>
                <p className="text-blue-100 text-sm max-w-lg">
                  {hi ? 'UGC NET की तैयारी का कमांड सेंटर - सब कुछ एक नज़र में' : 'Your UGC NET preparation command center - everything at a glance'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => navigate('/tests')}
                  className="bg-white text-blue-700 px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                  <Play className="w-4 h-4" /> {hi ? 'टेस्ट दें' : 'Take Test'}
                </button>
                <button onClick={() => d.refresh()}
                  className="bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/25 transition-all flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${d.refreshing ? 'animate-spin' : ''}`} /> {hi ? 'रिफ्रेश' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Countdown + Readiness */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              {/* Countdown */}
              <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                {ecc.countdown.isSet ? (
                  <div className="text-center">
                    <p className="text-blue-200 text-xs mb-2 font-medium">{hi ? 'परीक्षा तक' : 'Exam In'}</p>
                    <div className="flex items-center justify-center gap-3">
                      <div><p className="text-3xl font-black">{ecc.countdown.days}</p><p className="text-[10px] text-blue-200">{hi ? 'दिन' : 'Days'}</p></div>
                      <span className="text-2xl font-light opacity-50">:</span>
                      <div><p className="text-3xl font-black">{ecc.countdown.hours}</p><p className="text-[10px] text-blue-200">{hi ? 'घंटे' : 'Hrs'}</p></div>
                      <span className="text-2xl font-light opacity-50">:</span>
                      <div><p className="text-3xl font-black">{ecc.countdown.minutes}</p><p className="text-[10px] text-blue-200">{hi ? 'मिनट' : 'Min'}</p></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-blue-200 text-xs mb-2 font-medium">{hi ? 'परीक्षा तारीख सेट करें' : 'Set Exam Date'}</p>
                    <div className="flex gap-2">
                      <input type="date" value={examDateInput} onChange={e => setExamDateInput(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30" />
                      <button onClick={handleSetExamDate}
                        className="bg-white text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:scale-105 transition-all">
                        {hi ? 'सेट' : 'Set'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Readiness */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-blue-200 text-xs mb-1 font-medium">{hi ? 'तैयारी' : 'Readiness'}</p>
                <p className="text-3xl font-black">{ecc.readiness.overall}%</p>
                <ProgressBar value={ecc.readiness.overall} color="#fff" height={4} />
              </div>

              {/* Current Phase */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-blue-200 text-xs mb-1 font-medium">{hi ? 'चरण' : 'Phase'}</p>
                <p className="text-lg font-black">{hi ? ecc.phase.current?.nameHi : ecc.phase.current?.name}</p>
                <p className="text-[10px] text-blue-200 mt-1">{hi ? ecc.phase.current?.descHi : ecc.phase.current?.description}</p>
              </div>

              {/* Streak */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-blue-200 text-xs mb-1 font-medium">{hi ? 'स्ट्रीक' : 'Streak'}</p>
                <p className="text-3xl font-black flex items-center justify-center gap-1">
                  {d.streak} <Flame className="w-5 h-5 text-orange-400" />
                </p>
                <p className="text-[10px] text-blue-200">{hi ? `सर्वश्रेष्ठ: ${d.longestStreak}d` : `Best: ${d.longestStreak}d`}</p>
              </div>

              {/* XP */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-blue-200 text-xs mb-1 font-medium">{hi ? 'आज XP' : 'Today XP'}</p>
                <p className="text-3xl font-black flex items-center justify-center gap-1">
                  {d.todayXP} <Zap className="w-5 h-5 text-amber-400" />
                </p>
                <p className="text-[10px] text-blue-200">{hi ? `${d.todayDetailed.count} टेस्ट आज` : `${d.todayDetailed.count} tests today`}</p>
              </div>
            </div>

            {/* Risk Alerts */}
            {ecc.riskAlerts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ecc.riskAlerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    alert.level === 'critical' ? 'bg-red-500/20 text-red-200' :
                    alert.level === 'warning' ? 'bg-amber-500/20 text-amber-200' : 'bg-blue-500/20 text-blue-200'
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                    {hi ? alert.textHi : alert.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            AUTOMATED SYLLABUS TARGET PLANNER
        ════════════════════════════════════════════ */}
        <AutoSyllabusPlanner language={language} />

        {/* ════════════════════════════════════════════
            §2  JRF / NET PREDICTION + DAILY REPORT
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* JRF/NET Prediction */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                <GraduationCap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{hi ? 'AI भविष्यवाणी' : 'AI Prediction Engine'}</h2>
                <p className="text-[10px] text-gray-500">{hi ? `आत्मविश्वास: ${jp.confidence} | डेटा: ${jp.dataPoints}` : `Confidence: ${jp.confidence} | Data points: ${jp.dataPoints}`}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {/* NET Probability */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg width={90} height={90} className="-rotate-90">
                    <circle cx={45} cy={45} r={36} fill="none" stroke="currentColor" strokeWidth={7} className="text-gray-200 dark:text-gray-700" />
                    <circle cx={45} cy={45} r={36} fill="none" stroke={jp.netProbability >= 60 ? '#22c55e' : jp.netProbability >= 35 ? '#f59e0b' : '#ef4444'}
                      strokeWidth={7} strokeDasharray={226} strokeDashoffset={226 * (1 - jp.netProbability / 100)}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <span className="absolute text-lg font-black text-gray-900 dark:text-white">{jp.netProbability}%</span>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">NET</p>
              </div>

              {/* JRF Probability */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg width={90} height={90} className="-rotate-90">
                    <circle cx={45} cy={45} r={36} fill="none" stroke="currentColor" strokeWidth={7} className="text-gray-200 dark:text-gray-700" />
                    <circle cx={45} cy={45} r={36} fill="none" stroke={jp.jrfProbability >= 60 ? '#22c55e' : jp.jrfProbability >= 35 ? '#f59e0b' : '#ef4444'}
                      strokeWidth={7} strokeDasharray={226} strokeDashoffset={226 * (1 - jp.jrfProbability / 100)}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <span className="absolute text-lg font-black text-gray-900 dark:text-white">{jp.jrfProbability}%</span>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">JRF</p>
              </div>

              {/* PhD */}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg width={90} height={90} className="-rotate-90">
                    <circle cx={45} cy={45} r={36} fill="none" stroke="currentColor" strokeWidth={7} className="text-gray-200 dark:text-gray-700" />
                    <circle cx={45} cy={45} r={36} fill="none" stroke={jp.netProbability >= 50 ? '#22c55e' : '#ef4444'}
                      strokeWidth={7} strokeDasharray={226} strokeDashoffset={226 * (1 - jp.netProbability / 100)}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <span className="absolute text-sm font-bold text-gray-900 dark:text-white">{jp.netProbability >= 50 ? (hi ? 'योग्य' : 'Eligible') : (hi ? 'अयोग्य' : 'Ineligible')}</span>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">PhD</p>
              </div>

              {/* Projected Score */}
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">P1</p>
                    <p className="text-lg font-black text-blue-600">{jp.predictedP1}%</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">P2</p>
                    <p className="text-lg font-black text-purple-600">{jp.predictedP2}%</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center w-full">
                  <p className="text-[10px] text-gray-500">{hi ? 'अनुमानित कुल' : 'Projected'}</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{jp.predictedTotal}%</p>
                </div>
              </div>
            </div>

            {/* Factors & Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{hi ? 'कारक' : 'Factors'}</p>
                {jp.factors.map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
                    f.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    {f.type === 'positive' ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{f.text}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{hi ? 'सुझाव' : 'Suggestions'}</p>
                {jp.suggestions.length > 0 ? jp.suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                    <Lightbulb className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{s}</span>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 italic">{hi ? 'कोई सुझाव नहीं' : 'No suggestions'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Daily Report Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Star className="w-4.5 h-4.5 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{hi ? 'आज का रिपोर्ट कार्ड' : "Today's Report"}</h2>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${
                dr.gradeColor === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                dr.gradeColor === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                dr.gradeColor === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {dr.grade}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: hi ? 'टेस्ट' : 'Tests', value: dr.stats.tests, icon: ClipboardList, change: dr.comparison.testsChange },
                { label: hi ? 'सटीकता' : 'Accuracy', value: `${dr.stats.accuracy}%`, icon: Target, change: dr.comparison.accuracyChange },
                { label: hi ? 'सर्वश्रेष्ठ' : 'Best', value: `${dr.stats.bestScore}%`, icon: Star },
                { label: hi ? 'प्रश्न' : 'Questions', value: dr.stats.questionsTotal, icon: FileQuestion },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <s.icon className="w-3.5 h-3.5 text-gray-400" />
                    {s.change !== undefined && s.change !== 0 && (
                      <span className={`text-[10px] font-bold ${s.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {s.change > 0 ? '+' : ''}{typeof s.change === 'number' && s.label.includes('%') ? `${s.change}%` : s.change}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Highlights */}
            {dr.highlights.length > 0 && (
              <div className="space-y-1.5 mb-4">
                {dr.highlights.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg">
                    <Star className="w-3 h-3 flex-shrink-0" />
                    <span>{hi ? h.textHi : h.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tomorrow Focus */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/30">
              <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">{hi ? 'कल का फोकस' : 'Tomorrow Focus'}</p>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{dr.tomorrowFocus.unit}</p>
              <p className="text-[10px] text-indigo-500">{hi ? dr.tomorrowFocus.reasonHi : dr.tomorrowFocus.reason}</p>
            </div>

            {/* Pressure Message */}
            <div className={`mt-3 text-center py-2 px-3 rounded-xl text-xs font-bold ${
              d.pressureMessage.type === 'celebration' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
              d.pressureMessage.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 animate-pulse' :
              d.pressureMessage.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
              'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            }`}>
              {hi ? d.pressureMessage.hi : d.pressureMessage.en}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            §3  AUTO-GENERATED GOALS
        ════════════════════════════════════════════ */}
        <Section icon={Target} title="Daily Goals" titleHi="दैनिक लक्ष्य" language={language} badgeColor="emerald"
          badge={`${d.goalsCompleted}/${d.totalGoals}`}>
          <div className="flex items-center gap-3 mb-3">
            <ProgressBar value={d.goalCompletionPct} color={d.goalCompletionPct === 100 ? '#22c55e' : '#3b82f6'} height={8} />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{d.goalCompletionPct}%</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.autoGeneratedGoals.map((g, i) => {
              const done = g.current >= g.target;
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <div key={g.id} className={`p-3 rounded-xl border transition-all ${
                  done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
                  g.urgency === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 animate-pulse' :
                  'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DynIcon name={g.icon} className={`w-4 h-4 ${done ? 'text-emerald-600' : `text-${g.color}-500`}`} />
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex-1 truncate">
                      {hi ? g.titleHi : g.title}
                    </span>
                    {done && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    <span className="text-[10px] font-medium text-gray-500">+{g.xp}xp</span>
                  </div>
                  <ProgressBar value={g.current} max={g.target} color={done ? '#22c55e' : COLORS[i % COLORS.length]} height={5} />
                  <p className="text-[10px] text-gray-500 mt-1">{hi ? g.descriptionHi : g.description}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* ════════════════════════════════════════════
            §4  PERFORMANCE OVERVIEW + SCORE TREND
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-3">
            <MiniStat icon={ClipboardList} label={hi ? 'कुल टेस्ट' : 'Tests Done'} value={d.allCompletedAttempts?.length || 0}
              sub={hi ? `P1:${d.paper1Attempts.length} P2:${d.paper2Attempts.length}` : `P1:${d.paper1Attempts.length} P2:${d.paper2Attempts.length}`}
              color="blue" onClick={() => navigate('/results')} />
            <MiniStat icon={Target} label={hi ? 'सटीकता' : 'Accuracy'} value={`${d.overallAccuracy}%`}
              sub={<span className="flex items-center gap-1"><TrendArrow direction={d.trendDirection} size={10} /> {d.trendDirection}</span>}
              color="emerald" onClick={() => navigate('/results')} />
            <MiniStat icon={BookOpen} label="P1" value={`${d.paper1AvgScore}%`}
              sub={d.paper1Predicted ? `-> ${d.paper1Predicted}%` : ''} color="amber" />
            <MiniStat icon={FileQuestion} label="P2" value={`${d.paper2AvgScore}%`}
              sub={d.paper2Predicted ? `-> ${d.paper2Predicted}%` : ''} color="purple" />
            <MiniStat icon={Clock} label={hi ? 'गति' : 'Speed'} value={`${sa.avgTimePerQ}s`}
              sub={hi ? 'प्रति प्रश्न' : 'per question'} color="cyan" />
            <MiniStat icon={Activity} label={hi ? 'इस हफ्ते' : 'This Week'} value={d.weeklyComparison.thisWeek.tests}
              sub={<span className={d.weeklyComparison.change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {d.weeklyComparison.change >= 0 ? '+' : ''}{d.weeklyComparison.change} vs last
              </span>} color="indigo" />
          </div>

          {/* Score Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                {hi ? 'स्कोर ट्रेंड' : 'Score Trend'}
              </h3>
              <TrendArrow direction={d.trendDirection} />
            </div>
            {d.scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={d.scoreTrend}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="url(#scoreGrad)" dot={{ r: 3, fill: '#3b82f6' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                {hi ? 'अभी तक कोई डेटा नहीं - टेस्ट दें!' : 'No data yet - take some tests!'}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            §5  SYLLABUS COVERAGE HEATMAP
        ════════════════════════════════════════════ */}
        <Section icon={BookOpen} title="Syllabus Coverage" titleHi="सिलेबस कवरेज" language={language} badgeColor="blue"
          badge={`${sc.overallPct}%`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paper 1 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Paper 1</h4>
                <span className="text-xs font-bold text-blue-600">{sc.paper1Summary.overallPct}%</span>
              </div>
              <ProgressBar value={sc.paper1Summary.overallPct} color="#3b82f6" height={5} />
              <div className="space-y-2 mt-3">
                {sc.paper1.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ background: u.color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</span>
                        <LevelBadge level={u.level} language={language} />
                      </div>
                      <ProgressBar value={u.coveragePct} color={u.color} height={4} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{u.accuracy}%</p>
                      <p className="text-[9px] text-gray-400">{u.attemptedCount}/{u.totalTests}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Paper 2 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Paper 2</h4>
                <span className="text-xs font-bold text-purple-600">{sc.paper2Summary.overallPct}%</span>
              </div>
              <ProgressBar value={sc.paper2Summary.overallPct} color="#8b5cf6" height={5} />
              <div className="space-y-2 mt-3">
                {sc.paper2.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ background: u.color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</span>
                        <LevelBadge level={u.level} language={language} />
                      </div>
                      <ProgressBar value={u.coveragePct} color={u.color} height={4} />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{u.accuracy}%</p>
                      <p className="text-[9px] text-gray-400">{u.attemptedCount}/{u.totalTests}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Summary chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {[
              { label: hi ? 'माहिर' : 'Mastered', count: sc.paper1Summary.mastered + sc.paper2Summary.mastered, color: 'emerald' },
              { label: hi ? 'सीख रहे' : 'Learning', count: sc.paper1Summary.learning + sc.paper2Summary.learning, color: 'blue' },
              { label: hi ? 'जारी' : 'In Progress', count: sc.paper1Summary.inProgress + sc.paper2Summary.inProgress, color: 'amber' },
              { label: hi ? 'कमजोर' : 'Weak', count: sc.paper1Summary.weak + sc.paper2Summary.weak, color: 'red' },
              { label: hi ? 'शुरू नहीं' : 'Not Started', count: sc.paper1Summary.notStarted + sc.paper2Summary.notStarted, color: 'gray' },
            ].map((c, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-${c.color}-100 dark:bg-${c.color}-900/30 text-${c.color}-700 dark:text-${c.color}-400`}>
                {c.label}: {c.count}
              </span>
            ))}
          </div>
        </Section>

        {/* ════════════════════════════════════════════
            §6  SMART REVISION HUB (SRS)
        ════════════════════════════════════════════ */}
        <Section icon={RefreshCw} title="Smart Revision (SRS)" titleHi="स्मार्ट रिवीजन" language={language} badgeColor="orange"
          badge={sr.stats.dueToday > 0 ? `${sr.stats.dueToday} due` : 'Complete'}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {[
              { label: hi ? 'गंभीर' : 'Critical', count: sr.stats.critical, color: 'red' },
              { label: hi ? 'कमजोर' : 'Weak', count: sr.stats.weak, color: 'orange' },
              { label: hi ? 'सुधार' : 'Improving', count: sr.stats.improving, color: 'amber' },
              { label: hi ? 'माहिर' : 'Mastered', count: sr.stats.mastered, color: 'emerald' },
              { label: hi ? 'आज बाकी' : 'Due Today', count: sr.stats.dueToday, color: 'blue' },
            ].map((s, i) => (
              <div key={i} className={`text-center p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 border border-${s.color}-100 dark:border-${s.color}-800/30`}>
                <p className={`text-2xl font-black text-${s.color}-600 dark:text-${s.color}-400`}>{s.count}</p>
                <p className="text-[10px] font-medium text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Due today list */}
          {sr.todayDue.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">{hi ? 'आज करें' : 'Revise Today'}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sr.todayDue.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-8 rounded-full ${
                        item.category === 'critical' ? 'bg-red-500' :
                        item.category === 'weak' ? 'bg-orange-500' : 'bg-amber-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-gray-500">
                          {hi ? `स्कोर: ${item.bestScore}%` : `Score: ${item.bestScore}%`} * {item.daysSinceLastAttempt}d ago
                          {item.isOverdue && <span className="text-red-500 ml-1 font-bold">{hi ? 'बाकी!' : 'Overdue!'}</span>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => item.testId && navigate(`/test/${item.testId}`)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all flex items-center gap-1">
                      <Play className="w-3 h-3" /> {hi ? 'शुरू' : 'Start'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ════════════════════════════════════════════
            §7  WEEKLY STUDY PLAN
        ════════════════════════════════════════════ */}
        <Section icon={Calendar} title="Weekly Strategy" titleHi="साप्ताहिक रणनीति" language={language} badgeColor="indigo"
          defaultOpen={false}>
          {wcm.suggestedPlan && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {wcm.suggestedPlan.map((day, i) => (
                <div key={i} className={`p-3 rounded-xl border text-center ${
                  day.focus === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                  day.focus === 'revision' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
                  day.focus === 'new' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' :
                  day.focus === 'mock' ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800' :
                  'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{day.day}</p>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-1 truncate">{day.name}</p>
                  <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    day.focus === 'critical' ? 'bg-red-200 text-red-700' :
                    day.focus === 'revision' ? 'bg-amber-200 text-amber-700' :
                    day.focus === 'mock' ? 'bg-purple-200 text-purple-700' :
                    'bg-blue-200 text-blue-700'
                  }`}>{day.focus}</span>
                </div>
              ))}
            </div>
          )}

          {/* Weekly insights */}
          {wcm.insights && wcm.insights.length > 0 && (
            <div className="space-y-1.5 mt-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase">{hi ? 'अंतर्दृष्टि' : 'Insights'}</p>
              {wcm.insights.slice(0, 4).map((ins, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                  ins.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                  ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' :
                  ins.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' :
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                }`}>
                  {ins.type === 'positive' ? <TrendingUp className="w-3 h-3 flex-shrink-0" /> : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                  {hi ? ins.textHi : ins.text}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ════════════════════════════════════════════
            §8  MISTAKE JOURNAL + SPEED ANALYTICS
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mistake Journal */}
          <Section icon={AlertTriangle} title="Mistake Journal" titleHi="गलती जर्नल" language={language} badgeColor="red"
            badge={`${mj.overallErrorRate}% err`}>
            {mj.byUnit.length > 0 ? (
              <div className="space-y-2">
                {mj.byUnit.slice(0, 6).map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                      u.errorRate > 50 ? 'bg-red-500' : u.errorRate > 30 ? 'bg-orange-500' : 'bg-amber-500'
                    }`}>
                      {u.errorRate}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{u.unit}</p>
                      <p className="text-[10px] text-gray-500">
                        {hi ? `${u.wrong} गलत / ${u.total} कुल` : `${u.wrong} wrong / ${u.total} total`}
                        {u.isRepeated && <span className="text-red-500 ml-1 font-bold">Repeated</span>}
                      </p>
                    </div>
                    <ProgressBar value={u.correct} max={u.total} color={u.errorRate > 50 ? '#ef4444' : '#22c55e'} height={4} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">{hi ? 'कोई डेटा नहीं' : 'No data yet'}</p>
            )}
            {mj.suggestions.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {mj.suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2.5 py-1.5 rounded-lg">
                    <Lightbulb className="w-3 h-3 flex-shrink-0" />
                    {hi ? s.textHi : s.text}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Speed Analytics */}
          <Section icon={Zap} title="Speed Analytics" titleHi="गति विश्लेषण" language={language} badgeColor="cyan"
            badge={`${sa.avgTimePerQ}s/Q`}>
            {sa.speedTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={sa.speedTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} name={hi ? 'गति (s)' : 'Speed (s)'} />
                  <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name={hi ? 'सटीकता' : 'Accuracy'} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">{hi ? 'कोई डेटा नहीं' : 'No data yet'}</div>
            )}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{hi ? 'सबसे तेज' : 'Fastest'}</p>
                <p className="text-sm font-bold text-emerald-600">{sa.fastestTest?.avgTime || 0}s</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{hi ? 'औसत' : 'Average'}</p>
                <p className="text-sm font-bold text-blue-600">{sa.avgTimePerQ}s</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">{hi ? 'सबसे धीमा' : 'Slowest'}</p>
                <p className="text-sm font-bold text-red-600">{sa.slowestTest?.avgTime || 0}s</p>
              </div>
            </div>
          </Section>
        </div>

        {/* ════════════════════════════════════════════
            §9  ACHIEVEMENTS & RECORDS + STUDY RECOMMENDATIONS
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Section icon={Award} title="Achievements" titleHi="उपलब्धियां" language={language} badgeColor="amber" defaultOpen={false}>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {d.achievements.map((a, i) => (
                <div key={i} className={`text-center p-3 rounded-xl border transition-all ${
                  a.unlocked ? `bg-${a.color}-50 dark:bg-${a.color}-900/20 border-${a.color}-200 dark:border-${a.color}-800` :
                  'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-50'
                }`}>
                  <DynIcon name={a.icon} className={`w-6 h-6 mx-auto mb-1 ${a.unlocked ? `text-${a.color}-500` : 'text-gray-400'}`} />
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{a.label}</p>
                  <p className="text-[9px] text-gray-500">{a.desc}</p>
                  {!a.unlocked && a.progress !== undefined && (
                    <ProgressBar value={a.progress * 100} color="#9ca3af" height={3} />
                  )}
                </div>
              ))}
            </div>

            {/* Personal Records */}
            {pr.highestScore && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500">{hi ? 'सर्वोच्च' : 'Highest'}</p>
                  <p className="text-lg font-black text-amber-600">{pr.highestScore?.pct}%</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500">{hi ? 'कुल समय' : 'Total Time'}</p>
                  <p className="text-lg font-black text-blue-600">{Math.round((pr.totalStudyTime || 0) / 60)}m</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500">{hi ? 'सर्वश्रेष्ठ सटीकता' : 'Best Accuracy'}</p>
                  <p className="text-lg font-black text-emerald-600">{pr.bestAccuracy?.accuracy}%</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-500">{hi ? 'सबसे अच्छा दिन' : 'Best Day'}</p>
                  <p className="text-lg font-black text-purple-600">{pr.bestDay?.count || 0}</p>
                  <p className="text-[9px] text-gray-400">{hi ? 'टेस्ट' : 'tests'}</p>
                </div>
              </div>
            )}
          </Section>

          {/* Study Recommendations */}
          <Section icon={Brain} title="AI Recommendations" titleHi="AI सुझाव" language={language} badgeColor="violet" defaultOpen={false}>
            <div className="space-y-2">
              {d.studyRecommendations.length > 0 ? d.studyRecommendations.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  r.priority === 'critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                  r.priority === 'high' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' :
                  'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                }`}>
                  <DynIcon name={r.icon} className={`w-5 h-5 text-${r.color}-500 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{hi ? r.titleHi : r.title}</p>
                    <p className="text-[10px] text-gray-500">{hi ? r.detailHi : r.detail}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                    r.priority === 'critical' ? 'bg-red-200 text-red-700' :
                    r.priority === 'high' ? 'bg-amber-200 text-amber-700' :
                    'bg-gray-200 text-gray-700'
                  }`}>{r.priority}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-4">{hi ? 'सब अच्छा है!' : 'All good!'}</p>
              )}
            </div>

            {/* Best Study Time */}
            {tod.bestPeriod && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">{hi ? 'सबसे अच्छा समय' : 'Best Study Time'}</p>
                <div className="grid grid-cols-4 gap-2">
                  {tod.periodData.map((p, i) => (
                    <div key={i} className={`text-center p-2 rounded-lg ${
                      p.name === tod.bestPeriod?.name ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-400' : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}>
                      <DynIcon name={p.icon} className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{hi ? p.nameHi : p.name}</p>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{p.avgScore}%</p>
                      <p className="text-[9px] text-gray-400">{p.count} tests</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ════════════════════════════════════════════
            §10  QUICK ACTIONS (bottom)
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Play, title: hi ? 'मॉक टेस्ट' : 'Mock Tests', gradient: 'from-blue-500 to-indigo-500', path: '/tests' },
            { icon: FileQuestion, title: hi ? 'प्रश्न बैंक' : 'Question Bank', gradient: 'from-emerald-500 to-green-500', path: '/questions' },
            { icon: BarChart3, title: hi ? 'रिजल्ट्स' : 'Results', gradient: 'from-purple-500 to-violet-500', path: '/results' },
            { icon: Upload, title: hi ? 'इंपोर्ट' : 'Import', gradient: 'from-amber-500 to-orange-500', path: '/import' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{a.title}</span>
            </button>
          ))}
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;