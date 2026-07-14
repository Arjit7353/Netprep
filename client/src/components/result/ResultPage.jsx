import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Target, Clock, CheckCircle, XCircle, MinusCircle,
  BarChart3, PieChart as PieChartIcon, Timer, Eye, RotateCcw,
  ChevronLeft, Printer, TrendingUp, TrendingDown,
  Award, Zap, Brain, AlertTriangle, BookOpen, Filter,
  Activity, Star, Hash, Layers, FileText, Languages,
  ArrowRight, Flame, Medal, Sparkles, ChevronDown,
  ChevronUp, Lightbulb, SkipForward, CircleDot, Archive,
  Percent, Share2, Download, Search, Bell, Moon, Sun, User, Menu,
  Home, LayoutDashboard, Bookmark, Settings, LogOut, Book,
  PenTool, Flag, CheckSquare, ZapOff, BookCopy, LineChart, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import Button from '../common/Button';
import SolutionView from './SolutionView';
import TopicAnalysis from './TopicAnalysis';
import ResultComparison from './ResultComparison';

/* ═══════════ CONFETTI PARTICLES ═══════════ */
const Confetti = ({ active }) => {
  const [particles, setParticles] = useState([]);
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  useEffect(() => {
    if (!active) return;
    const newP = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      type: Math.random() > 0.5 ? 'circle' : 'rect',
    }));
    setParticles(newP);
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute"
          style={{
            left: `${p.x}%`, top: '-20px',
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}>
          {p.type === 'circle' ? (
            <div style={{ width: p.size, height: p.size, borderRadius: '50%', backgroundColor: p.color, transform: `rotate(${p.rotation}deg)` }} />
          ) : (
            <div style={{ width: p.size, height: p.size * 0.6, backgroundColor: p.color, transform: `rotate(${p.rotation}deg)`, borderRadius: 2 }} />
          )}
        </div>
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* ═══════════ CELEBRATION OVERLAY ═══════════ */
const CelebrationOverlay = ({ percentage, language, onDismiss }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setShow(false); if (onDismiss) onDismiss(); }, 4000);
    return () => clearTimeout(t);
  }, []);

  if (!show || percentage < 90) return null;

  const isPerfect = percentage === 100;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={() => { setShow(false); if (onDismiss) onDismiss(); }}>
      <div className="text-center animate-bounce-in bg-white/10 p-10 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-pulse">
            {isPerfect ? <Medal className="w-16 h-16 text-white" /> : <Trophy className="w-16 h-16 text-white" />}
          </div>
        </div>
        <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
          {isPerfect
            ? (language === 'hi' ? 'परफेक्ट स्कोर!' : 'Perfect Score!')
            : (language === 'hi' ? 'शानदार!' : 'Outstanding!')}
        </h2>
        <p className="text-2xl text-amber-300 font-black mb-2">{percentage}%</p>
        <p className="text-white/60 text-sm mt-4">
          {language === 'hi' ? 'बंद करने के लिए कहीं भी क्लिक करें' : 'Click anywhere to dismiss'}
        </p>
      </div>
    </div>
  );
};

/* ═══════════ ANIMATED CIRCULAR PROGRESS ═══════════ */
const CircularProgress = ({ percentage, size = 180, strokeWidth = 14, color, label, sublabel }) => {
  const [val, setVal] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const id = `cg-${(color || '#3B82F6').replace('#', '')}-${size}-${Math.random().toString(36).substr(2, 5)}`;

  useEffect(() => {
    const t = setTimeout(() => {
      let c = 0;
      const iv = setInterval(() => {
        c += 1.5;
        if (c >= percentage) { setVal(percentage); clearInterval(iv); }
        else setVal(Math.floor(c));
      }, 12);
      return () => clearInterval(iv);
    }, 400);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-transform duration-500">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor"
          className="text-gray-100 dark:text-gray-800" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#${id})`}
          strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          filter={`url(#glow-${id})`}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
          {val}<span className="text-2xl text-gray-400">%</span>
        </span>
        {label && <span className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-1">{label}</span>}
        {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
    </div>
  );
};

/* ═══════════ ANIMATED COUNTER ═══════════ */
const Counter = ({ end, suffix = '', prefix = '' }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    let s = 0;
    const n = typeof end === 'number' ? end : parseInt(end) || 0;
    const inc = Math.max(n / 50, 1);
    const iv = setInterval(() => {
      s += inc;
      if (s >= n) { setC(n); clearInterval(iv); }
      else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(iv);
  }, [end]);
  return <>{prefix}{c}{suffix}</>;
};

/* ═══════════ STAT CARD (PREMIUM) ═══════════ */
const PremiumStatCard = ({ icon: Icon, label, value, subValue, color, gradient, trend }) => (
  <div className="relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 group hover:shadow-2xl hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-500 hover:-translate-y-1">
    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 blur-2xl`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <p className={`text-4xl font-black ${color}`}>
            {typeof value === 'number' ? <Counter end={value} /> : value}
          </p>
          {subValue && <span className="text-sm font-semibold text-gray-400 mb-1">{subValue}</span>}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
            {Math.abs(trend)}% vs avg
          </div>
        )}
      </div>
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);




/* ═══════════ AI RECOMMENDATION CARD ═══════════ */
const AIRecommendationCard = ({ accuracy, language, onGeneratePlan }) => {
  const isGood = accuracy >= 70;
  return (
    <div className="relative rounded-[2rem] p-6 lg:p-8 overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, #3B1E8A 0%, #2A1358 100%)', boxShadow: '0 20px 40px -15px rgba(59, 30, 138, 0.4)' }}>
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md shadow-inner transition-transform group-hover:rotate-12 duration-500">
            <Sparkles className="w-6 h-6 text-indigo-200" />
          </div>
          <h3 className="text-2xl font-black text-white tracking-wide">
            AI Strategy Engine
          </h3>
        </div>
        
        <p className="text-indigo-100/90 text-[15px] leading-relaxed mb-8 font-medium">
          {isGood 
            ? (language === 'hi' ? 'आपका प्रदर्शन शानदार है। अपनी गति बनाए रखने के लिए कठिन प्रश्नों पर ध्यान दें।' : 'Your performance is stellar. Focus on high-difficulty questions to maintain your edge.') 
            : (language === 'hi' ? 'नींव को मजबूत करने की आवश्यकता है। कमजोर अध्यायों के सिद्धांत को दोहराएं।' : 'Foundational reinforcement needed. Review theory for your weakest chapters before next attempt.')}
        </p>
        
        <div className="mt-auto">
          <button onClick={onGeneratePlan} className="w-full bg-white text-[#3B1E8A] hover:bg-gray-50 font-bold text-[15px] py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group/btn relative overflow-hidden">
            <span className="relative z-10">{language === 'hi' ? 'AI अभ्यास योजना बनाएं' : 'Generate AI Practice Plan'}</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/40 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
        </div>
      </div>
    </div>
  );
};


/* ════════════════════════════════════════════════════════════
                     MAIN RESULT PAGE
   ════════════════════════════════════════════════════════════ */
const ResultPage = ({
  attempt, test, questions = [], language: propLanguage = 'hi',
  onLanguageChange, onReattempt, onGoBack,
  previousAttempts = [], testDeleted = false
}) => {
  const [language, setLanguage] = useState(() => {
    try { const saved = localStorage.getItem('netprep_lang'); if (saved === 'hi' || saved === 'en') return saved; } catch {} return propLanguage;
  });
  

  const [activeView, setActiveView] = useState('dashboard'); // dashboard or solutions
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const celebrationShown = useRef(false);
  const navigate = useNavigate();

  useEffect(() => { if (propLanguage && propLanguage !== language) setLanguage(propLanguage); }, [propLanguage]);
  useEffect(() => {
    const handleLangChange = (e) => { const newLang = e.detail; if (newLang === 'hi' || newLang === 'en') setLanguage(newLang); };
    window.addEventListener('netprep-lang-change', handleLangChange);
    return () => window.removeEventListener('netprep-lang-change', handleLangChange);
  }, []);

  const handleLanguageToggle = useCallback(() => {
    const newLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(newLang);
    try { localStorage.setItem('netprep_lang', newLang); } catch {}
    try { window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: newLang })); } catch {}
    if (typeof onLanguageChange === 'function') onLanguageChange(newLang);
  }, [language, onLanguageChange]);

  // Calculations
  const answers = attempt?.answers || [];
  const totalQ = answers.length || test?.totalQuestions || 0;
  const correct = attempt?.correctCount || 0;
  const wrong = attempt?.wrongCount || 0;
  const skipped = attempt?.skippedCount || 0;
  const score = attempt?.score || 0;
  const totalMarks = attempt?.totalMarks || (totalQ * (test?.marksPerQuestion || 2));
  const accuracy = totalQ > 0 ? Math.round((correct / (correct + wrong || 1)) * 100) : 0;
  const scorePct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const attemptRate = totalQ > 0 ? Math.round(((correct + wrong) / totalQ) * 100) : 0;
  const scoreColor = scorePct >= 80 ? '#10B981' : scorePct >= 60 ? '#3B82F6' : scorePct >= 40 ? '#F59E0B' : '#EF4444';
  const isDeletedTest = testDeleted || test?._isDeleted || test?._isSnapshot;
  
  // Derived Premium Metrics
  const mockRank = Math.max(1, Math.round((100 - scorePct) * 15.4));
  const mockPercentile = Math.min(99.9, Math.round((scorePct * 0.95 + 5) * 10) / 10);
  const negativeImpact = wrong * (test?.negativeMarks || 0.5);

  useEffect(() => {
    if (scorePct >= 90 && !celebrationShown.current) { celebrationShown.current = true; setShowCelebration(true); setShowConfetti(true); }
  }, [scorePct]);

  // Data preps
  const donutData = [
    { name: 'Correct', value: correct, fill: '#10B981' },
    { name: 'Wrong', value: wrong, fill: '#EF4444' },
    { name: 'Skipped', value: skipped, fill: '#9CA3AF' }
  ].filter(d => d.value > 0);

  const typeAnalysis = useMemo(() => {
    if (!answers || !questions || !answers.length || !questions.length) return [];
    
    const types = {};
    answers.forEach((ans, i) => {
      const q = questions[i];
      if (!q) return;
      const type = q.type || 'multiple_choice';
      if (!types[type]) types[type] = { total: 0, correct: 0 };
      types[type].total += 1;
      if (ans.isCorrect) types[type].correct += 1;
    });

    const labels = {
      'statement_based': 'Statement',
      'multiple_choice': 'MCQ',
      'match_following': 'Match',
      'assertion_reason': 'A-R',
      'sequence_order': 'Sequence'
    };

    const colors = {
      'Statement': 'bg-blue-500',
      'MCQ': 'bg-purple-500',
      'Match': 'bg-yellow-500',
      'A-R': 'bg-red-500',
      'Sequence': 'bg-green-500'
    };

    return Object.entries(types).map(([type, data]) => {
      const label = labels[type] || type;
      return {
        type: label,
        total: data.total,
        correct: data.correct,
        percentage: Math.round((data.correct / data.total) * 100),
        color: colors[label] || 'bg-gray-500'
      };
    }).sort((a, b) => b.total - a.total);
  }, [answers, questions]);

  const topicRadarData = useMemo(() => {
    if (!attempt?.topicAnalysis) return [];
    return Object.keys(attempt.topicAnalysis).slice(0, 5).map(key => {
      const t = attempt.topicAnalysis[key];
      return { subject: key.split(' ')[0], A: t.total > 0 ? Math.round((t.correct / t.total)*100) : 0, fullMark: 100 };
    });
  }, [attempt]);

  const timeTrendData = useMemo(() => {
    if (!answers.length) return [];
    let cumulative = 0;
    return answers.map((a, i) => { cumulative += a.timeTaken || 0; return { q: i+1, time: cumulative }; });
  }, [answers]);

  if (activeView === 'solutions' && !isDeletedTest) {
    return (
      <div className="w-full h-full bg-gray-50 dark:bg-gray-950 font-sans">
        <SolutionView answers={answers} questions={questions} language={language}
          test={test} initialIndex={solutionIndex}
          onClose={() => setActiveView('dashboard')} onLanguageChange={handleLanguageToggle} />
      </div>
    );
  }

  return (
    <div className="w-full h-full text-gray-900 dark:text-gray-100 relative overflow-hidden">
      <Confetti active={showConfetti} />
      {showCelebration && <CelebrationOverlay percentage={scorePct} language={language} onDismiss={() => setShowCelebration(false)} />}

      <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8">
          
          {/* HEADER / ACTIONS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {onGoBack && (
                  <button onClick={onGoBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {test?.title || (language === 'hi' ? 'परीक्षा परिणाम' : 'Test Result Analytics')}
                </h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 sm:ml-10">
                <Clock className="w-4 h-4" /> Completed on {new Date(attempt?.completedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onReattempt && !isDeletedTest && (
                <Button variant="outline" className="rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm" icon={RotateCcw} onClick={onReattempt}>
                  {language === 'hi' ? 'पुनः प्रयास' : 'Reattempt'}
                </Button>
              )}
              {!isDeletedTest && questions.length > 0 && (
                <Button variant="gradient" className="rounded-xl shadow-lg shadow-primary-500/20" icon={Eye} onClick={() => { setSolutionIndex(0); setActiveView('solutions'); }}>
                  {language === 'hi' ? 'समाधान देखें' : 'View Solutions'}
                </Button>
              )}
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN (SCORE & KPIs) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* HERO STATS PANEL */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex-shrink-0 relative">
                  <CircularProgress percentage={scorePct} size={220} strokeWidth={18} color={scoreColor} label={`${score}/${totalMarks}`} sublabel="Total Marks" />
                </div>
                
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">National Rank</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">#{mockRank}</p>
                    <p className="text-xs text-emerald-500 font-semibold mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Top {mockPercentile >= 90 ? '10%' : '50%'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Percentile</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{mockPercentile}%</p>
                    <p className="text-xs text-blue-500 font-semibold mt-2 flex items-center gap-1"><Activity className="w-3 h-3"/> Above average</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Accuracy</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{accuracy}%</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Attempt Rate</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{attemptRate}%</p>
                  </div>
                </div>
              </div>

              {/* METRICS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumStatCard icon={CheckCircle} label="Correct" value={correct} color="text-emerald-500" gradient="from-emerald-400 to-emerald-600" trend={5} />
                <PremiumStatCard icon={XCircle} label="Incorrect" value={wrong} subValue={`(-${negativeImpact} marks)`} color="text-red-500" gradient="from-red-400 to-red-600" trend={-12} />
                <PremiumStatCard icon={MinusCircle} label="Skipped" value={skipped} color="text-amber-500" gradient="from-amber-400 to-amber-600" />
              </div>

              {/* ADVANCED CHARTS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic Strength Radar */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Layers className="w-5 h-5 text-indigo-500" /> Topic Strength</h4>
                  <div className="h-[250px] w-full">
                    {topicRadarData.length > 2 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topicRadarData}>
                          <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                          <Radar name="Accuracy" dataKey="A" stroke="#6366f1" strokeWidth={2} fill="#818cf8" fillOpacity={0.4} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                       <div className="flex h-full items-center justify-center text-gray-400 text-sm">Not enough topic data</div>
                    )}
                  </div>
                </div>

                {/* Time Efficiency Area */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Timer className="w-5 h-5 text-indigo-500" /> Time Progression</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="q" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="time" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (INSIGHTS & SPEED) */}
            <div className="lg:col-span-4 space-y-6">
              {/* By Question Type */}
              {typeAnalysis.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                    <Layers className="w-5 h-5 text-indigo-500" /> By Question Type
                  </h4>
                  <div className="space-y-4">
                    {typeAnalysis.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{item.type}</span>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                            {item.correct}/{item.total} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AIRecommendationCard accuracy={accuracy} language={language} onGeneratePlan={() => navigate('/tests/create')} />

              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                 <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6"><PieChartIcon className="w-5 h-5 text-indigo-500" /> Answer Distribution</h4>
                 <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                          {donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                      <span className="text-3xl font-black">{totalQ}</span>
                      <span className="text-xs text-gray-500">Total Qs</span>
                    </div>
                 </div>
              </div>

              {/* Speed Meter Card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 p-6 text-white shadow-xl">
                 <h4 className="font-bold text-gray-100 flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-yellow-400" /> Speed Meter</h4>
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-sm text-gray-400">Average Time / Question</span>
                   <span className="font-black text-xl text-yellow-400">{Math.round((attempt?.totalTimeTaken || 0) / (totalQ || 1))}s</span>
                 </div>
                 <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-4">
                   <div className="h-full bg-yellow-400 rounded-full" style={{ width: '65%' }} />
                 </div>
                 <p className="text-xs text-gray-400 mt-3 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-400"/> Faster than 72% of students</p>
              </div>

            </div>
          </div>
          
          {/* TOPIC ANALYSIS ANCHOR */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
             <TopicAnalysis answers={answers} questions={questions} topicAnalysis={attempt?.topicAnalysis} language={language} testDeleted={isDeletedTest} />
          </div>

          {/* QUESTION MAP ANCHOR */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Hash className="w-6 h-6 text-indigo-500" /> Question Map & Review
            </h3>
            <div className="flex flex-wrap gap-2">
              {answers.map((a, i) => {
                const isSkipped = a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null;
                const bg = isSkipped ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200' : a.isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 dark:bg-red-900/40 text-red-700 hover:bg-red-200';
                return (
                  <button key={i} onClick={() => { if (!isDeletedTest && questions.length > 0) { setSolutionIndex(i); setActiveView('solutions'); } }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all hover:scale-110 active:scale-95 ${bg} ${a.markedForReview ? 'ring-2 ring-indigo-500' : ''}`}
                    title={`Q.${i + 1}`}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
            {!isDeletedTest && questions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                <Button variant="gradient" size="lg" icon={BookOpen} onClick={() => { setSolutionIndex(0); setActiveView('solutions'); }} className="px-10 py-4 text-lg rounded-2xl shadow-xl shadow-indigo-500/20">
                  {language === 'hi' ? 'विस्तृत समाधान देखें' : 'View Detailed Solutions'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default ResultPage;
