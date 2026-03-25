import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Target, Clock, CheckCircle, XCircle, MinusCircle,
  BarChart3, PieChart as PieChartIcon, Timer, Eye, RotateCcw,
  ChevronLeft, Printer, TrendingUp, TrendingDown,
  Award, Zap, Brain, AlertTriangle, BookOpen, Filter,
  Activity, Star, Hash, Layers, FileText, Languages,
  ArrowRight, Share2, Flame, CircleDot, Bookmark,
  Sparkles, ChevronRight, Minus, Keyboard, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Button from '../common/Button';
import SolutionView from './SolutionView';
import TopicAnalysis from './TopicAnalysis';
import ResultComparison from './ResultComparison';

/* ═══════════════════════════════════════
   CSS ANIMATIONS (injected once)
   ═══════════════════════════════════════ */
const AnimStyles = () => (
  <style>{`
    @keyframes rp-confetti{0%{transform:translateY(-10px) rotate(0deg) scale(1);opacity:1}
    70%{opacity:1}100%{transform:translateY(100vh) rotate(720deg) scale(0.3);opacity:0}}
    @keyframes rp-pop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    @keyframes rp-glow{0%,100%{filter:drop-shadow(0 0 6px rgba(99,102,241,.15))}50%{filter:drop-shadow(0 0 20px rgba(99,102,241,.4))}}
    @keyframes rp-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes rp-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes rp-pulse-ring{0%{transform:scale(0.95);opacity:0.7}50%{transform:scale(1.05);opacity:1}100%{transform:scale(0.95);opacity:0.7}}
    @keyframes rp-count-up{0%{transform:translateY(100%);opacity:0}100%{transform:translateY(0);opacity:1}}
    @keyframes rp-streak-grow{0%{width:0}100%{width:100%}}
    .rp-pop{animation:rp-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both}
    .rp-float{animation:rp-float 3s ease-in-out infinite}
    .rp-glow{animation:rp-glow 2.5s ease-in-out infinite}
    .rp-shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
    background-size:200%;animation:rp-shimmer 2s infinite}
    .rp-count{animation:rp-count-up 0.5s ease-out both}
    @media print{.no-print{display:none!important}.print-only{display:block!important}
    .print-break{page-break-before:always}}
  `}</style>
);

/* ═══════════════════════════════════════
   CONFETTI EFFECT
   ═══════════════════════════════════════ */
const Confetti = ({ show }) => {
  const pieces = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 2.5 + Math.random() * 3,
      color: ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E9','#10B981','#F59E0B'][i % 10],
      size: 4 + Math.random() * 7,
      rot: Math.random() * 360,
      type: i % 3 // 0=rect, 1=circle, 2=triangle
    }))
  , []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute', left: `${p.left}%`, top: '-12px',
            width: p.type === 1 ? `${p.size}px` : `${p.size}px`,
            height: p.type === 1 ? `${p.size}px` : `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: p.type === 1 ? '50%' : p.type === 2 ? '0' : '2px',
            animation: `rp-confetti ${p.duration}s ${p.delay}s ease-out both`,
            transform: `rotate(${p.rot}deg)`,
            clipPath: p.type === 2 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
          }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════
   ANIMATED CIRCULAR PROGRESS
   ═══════════════════════════════════════ */
const CircularProgress = ({ percentage, size = 180, strokeWidth = 14, color, label, sublabel }) => {
  const [val, setVal] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;

  useEffect(() => {
    const timer = setTimeout(() => {
      let c = 0;
      const iv = setInterval(() => {
        c += 1.2;
        if (c >= percentage) { setVal(percentage); clearInterval(iv); }
        else setVal(Math.floor(c));
      }, 14);
      return () => clearInterval(iv);
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center rp-glow">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`cpg-${color?.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor"
          className="text-gray-200 dark:text-secondary-700" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke={`url(#cpg-${color?.replace('#','')})`}
          strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight rp-count">
          {val}<span className="text-2xl">%</span>
        </span>
        {label && <span className="text-sm font-semibold text-gray-500 dark:text-secondary-400 mt-0.5">{label}</span>}
        {sublabel && <span className="text-xs text-gray-400 dark:text-secondary-500">{sublabel}</span>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════ */
const Counter = ({ end, suffix = '', prefix = '', duration = 1000 }) => {
  const [c, setC] = useState(0);
  const numEnd = typeof end === 'number' ? end : parseInt(end) || 0;
  useEffect(() => {
    if (numEnd === 0) { setC(0); return; }
    let s = 0;
    const inc = Math.max(numEnd / (duration / 16), 1);
    const iv = setInterval(() => {
      s += inc;
      if (s >= numEnd) { setC(numEnd); clearInterval(iv); }
      else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(iv);
  }, [numEnd, duration]);
  return <>{prefix}{c}{suffix}</>;
};

/* ═══════════════════════════════════════
   GRADE BADGE (with animation)
   ═══════════════════════════════════════ */
const GradeBadge = ({ percentage, language }) => {
  const config = percentage >= 90
    ? { grade: 'A+', color: 'from-emerald-400 to-green-600', emoji: '🏆', text: language === 'hi' ? 'उत्कृष्ट!' : 'Outstanding!' }
    : percentage >= 80
    ? { grade: 'A', color: 'from-green-400 to-emerald-600', emoji: '🌟', text: language === 'hi' ? 'बहुत अच्छा!' : 'Excellent!' }
    : percentage >= 70
    ? { grade: 'B+', color: 'from-blue-400 to-cyan-600', emoji: '💪', text: language === 'hi' ? 'अच्छा!' : 'Good!' }
    : percentage >= 60
    ? { grade: 'B', color: 'from-cyan-400 to-blue-600', emoji: '👍', text: language === 'hi' ? 'ठीक है' : 'Above Average' }
    : percentage >= 50
    ? { grade: 'C', color: 'from-yellow-400 to-amber-600', emoji: '📝', text: language === 'hi' ? 'औसत' : 'Average' }
    : percentage >= 35
    ? { grade: 'D', color: 'from-orange-400 to-red-500', emoji: '📖', text: language === 'hi' ? 'सुधार करें' : 'Needs Work' }
    : { grade: 'F', color: 'from-red-500 to-rose-600', emoji: '💡', text: language === 'hi' ? 'अभ्यास करें' : 'Keep Practicing' };

  return (
    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${config.color} text-white shadow-lg rp-pop`}
      style={{ animationDelay: '0.8s' }}>
      <span className="text-xl">{config.emoji}</span>
      <span className="text-2xl font-black">{config.grade}</span>
      <div className="h-6 w-px bg-white/30" />
      <span className="text-sm font-semibold">{config.text}</span>
    </div>
  );
};

/* ═══════════════════════════════════════
   STAT CARD (glassmorphism)
   ═══════════════════════════════════════ */
const StatCard = ({ icon: Icon, label, value, color, gradient, delay = 0 }) => (
  <div className="relative overflow-hidden bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rp-pop"
    style={{ animationDelay: `${delay}s` }}>
    <div className={`absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br ${gradient} rounded-full opacity-10 group-hover:opacity-25 group-hover:scale-110 transition-all duration-300`} />
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg shadow-current/10`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[11px] text-gray-500 dark:text-secondary-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-black ${color}`}>
          {typeof value === 'number' ? <Counter end={value} /> : value}
        </p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   LANGUAGE TOGGLE
   ═══════════════════════════════════════ */
const LanguageToggle = ({ language, onChange }) => (
  <button onClick={() => {
    const n = language === 'hi' ? 'en' : 'hi';
    onChange(n);
    try { localStorage.setItem('netprep_lang', n); window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: n })); } catch {}
  }}
    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all text-white text-sm font-medium no-print"
  >
    <Languages className="w-4 h-4" />
    <span className="font-bold text-xs">{language === 'hi' ? 'EN' : 'हि'}</span>
  </button>
);

/* ═══════════════════════════════════════
   QUESTION GRID (enhanced)
   ═══════════════════════════════════════ */
const QuestionGrid = ({ answers, onQuestionClick, language }) => {
  const getStyle = (a) => {
    if (a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null)
      return 'bg-gray-100 dark:bg-secondary-700 text-gray-500 border-gray-200 dark:border-secondary-600 hover:bg-gray-200';
    if (a.isCorrect) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200';
    return 'bg-red-100 dark:bg-red-900/40 text-red-700 border-red-300 dark:border-red-700 hover:bg-red-200';
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-secondary-900 rounded-xl">
        {[
          { color: 'bg-emerald-500', label: language === 'hi' ? 'सही' : 'Correct' },
          { color: 'bg-red-500', label: language === 'hi' ? 'गलत' : 'Wrong' },
          { color: 'bg-gray-400', label: language === 'hi' ? 'छोड़ा' : 'Skipped' }
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-md ${l.color}`} />
            <span className="text-xs text-gray-600 dark:text-secondary-400">{l.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
        {answers.map((a, i) => (
          <button key={i} onClick={() => onQuestionClick(i)}
            className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center text-xs font-bold
              cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95
              ${getStyle(a)} ${a.markedForReview ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
            title={`Q.${i + 1} • ${a.isCorrect ? '✓' : a.selectedAnswer === -1 ? '—' : '✗'} • ${a.timeTaken || 0}s`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   QUESTION TYPE BREAKDOWN (NEW!)
   ═══════════════════════════════════════ */
const TYPE_LABELS = {
  mcq:'MCQ', assertion_reason:'A-R', match_following:'Match',
  sequence_order:'Sequence', statement_based:'Statement', passage_based:'Passage',
  di_table:'DI-Table', di_bar_chart:'DI-Bar', di_pie_chart:'DI-Pie',
  di_line_graph:'DI-Line', di_caselet:'DI-Case', di_mixed:'DI-Mix'
};

const QuestionTypeBreakdown = ({ answers, questions, language }) => {
  const data = useMemo(() => {
    const map = {};
    answers.forEach((a, i) => {
      const t = questions[i]?.questionType || 'mcq';
      if (!map[t]) map[t] = { total: 0, correct: 0 };
      map[t].total++;
      if (a.isCorrect) map[t].correct++;
    });
    return Object.entries(map).map(([type, d]) => ({
      name: TYPE_LABELS[type] || type,
      correct: d.correct,
      wrong: d.total - d.correct,
      total: d.total,
      accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [answers, questions]);

  if (data.length <= 1) return null;

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary-500" />
        {language === 'hi' ? 'प्रश्न प्रकार विश्लेषण' : 'Question Type Analysis'}
      </h4>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700 dark:text-secondary-300">{d.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-bold">{d.correct}</span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-xs text-gray-600 dark:text-secondary-400 font-bold">{d.total}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                  d.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : d.accuracy >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>{d.accuracy}%</span>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
              <div className="h-full flex rounded-full overflow-hidden transition-all duration-700"
                style={{ width: '100%' }}>
                <div className="bg-emerald-500 transition-all duration-700 ease-out"
                  style={{ width: `${(d.correct / d.total) * 100}%` }} />
                <div className="bg-red-400 transition-all duration-700 ease-out"
                  style={{ width: `${((d.total - d.correct) / d.total) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   STREAK ANALYSIS (NEW!)
   ═══════════════════════════════════════ */
const StreakAnalysis = ({ answers, language }) => {
  const streaks = useMemo(() => {
    if (!answers?.length) return null;
    let maxC = 0, maxW = 0, curC = 0, curW = 0;
    const timeline = [];
    answers.forEach((a, i) => {
      const skip = a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null;
      if (skip) { curC = 0; curW = 0; timeline.push('S'); }
      else if (a.isCorrect) { curC++; curW = 0; maxC = Math.max(maxC, curC); timeline.push('C'); }
      else { curW++; curC = 0; maxW = Math.max(maxW, curW); timeline.push('W'); }
    });
    return { maxCorrect: maxC, maxWrong: maxW, timeline };
  }, [answers]);

  if (!streaks) return null;

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        {language === 'hi' ? 'स्ट्रीक विश्लेषण' : 'Streak Analysis'}
      </h4>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center border border-emerald-200 dark:border-emerald-800">
          <p className="text-3xl font-black text-emerald-600">🔥 {streaks.maxCorrect}</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            {language === 'hi' ? 'सबसे लंबी सही स्ट्रीक' : 'Best Correct Streak'}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-200 dark:border-red-800">
          <p className="text-3xl font-black text-red-600">💥 {streaks.maxWrong}</p>
          <p className="text-xs text-red-700 dark:text-red-400 mt-1 font-medium">
            {language === 'hi' ? 'सबसे लंबी गलत स्ट्रीक' : 'Worst Wrong Streak'}
          </p>
        </div>
      </div>
      {/* Timeline visualization */}
      <div className="flex gap-0.5 flex-wrap">
        {streaks.timeline.map((t, i) => (
          <div key={i} title={`Q${i + 1}: ${t === 'C' ? 'Correct' : t === 'W' ? 'Wrong' : 'Skipped'}`}
            className={`w-3 h-6 rounded-sm transition-all hover:scale-150 cursor-pointer ${
              t === 'C' ? 'bg-emerald-500' : t === 'W' ? 'bg-red-500' : 'bg-gray-300 dark:bg-secondary-600'
            }`} />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   TIME ANALYSIS (enhanced)
   ═══════════════════════════════════════ */
const TimeAnalysis = ({ answers, language }) => {
  const data = useMemo(() => {
    if (!answers?.length) return null;
    const times = answers.map((a, i) => ({
      q: `Q${i + 1}`, time: a.timeTaken || 0,
      status: (a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null)
        ? 'skipped' : a.isCorrect ? 'correct' : 'wrong'
    }));
    const validTimes = times.filter(t => t.time > 0);
    const total = times.reduce((s, t) => s + t.time, 0);
    const avg = validTimes.length ? total / validTimes.length : 0;
    const correctT = times.filter(t => t.status === 'correct').map(t => t.time);
    const wrongT = times.filter(t => t.status === 'wrong').map(t => t.time);
    const avgC = correctT.length ? correctT.reduce((a, b) => a + b, 0) / correctT.length : 0;
    const avgW = wrongT.length ? wrongT.reduce((a, b) => a + b, 0) / wrongT.length : 0;
    const fastest = validTimes.sort((a, b) => a.time - b.time)[0];
    const slowest = [...validTimes].sort((a, b) => b.time - a.time)[0];
    // Efficiency score: (correct_time / total_time) * accuracy
    const correctTime = correctT.reduce((a, b) => a + b, 0);
    const efficiency = total > 0 ? Math.round((correctTime / total) * 100) : 0;
    return { times, total, avg, avgC, avgW, fastest, slowest, efficiency };
  }, [answers]);

  if (!data) return null;
  const COLORS_MAP = { correct: '#10B981', wrong: '#EF4444', skipped: '#9CA3AF' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: Clock, value: `${Math.round(data.avg)}s`, label: language === 'hi' ? 'औसत/प्रश्न' : 'Avg/Q', gradient: 'from-blue-500 to-indigo-600' },
          { icon: Zap, value: `${Math.round(data.avgC)}s`, label: language === 'hi' ? 'सही का औसत' : 'Avg Correct', gradient: 'from-emerald-500 to-green-600' },
          { icon: AlertTriangle, value: `${Math.round(data.avgW)}s`, label: language === 'hi' ? 'गलत का औसत' : 'Avg Wrong', gradient: 'from-red-500 to-rose-600' },
          { icon: Timer, value: `${Math.floor(data.total/60)}m ${data.total%60}s`, label: language === 'hi' ? 'कुल समय' : 'Total', gradient: 'from-purple-500 to-violet-600' },
          { icon: Activity, value: `${data.efficiency}%`, label: language === 'hi' ? 'दक्षता' : 'Efficiency', gradient: 'from-amber-500 to-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 text-center">
            <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-secondary-400 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          {language === 'hi' ? 'प्रति प्रश्न समय' : 'Time Per Question'}
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.times} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="q" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              formatter={(v) => [`${v}s`]} />
            <Bar dataKey="time" radius={[6, 6, 0, 0]}>
              {data.times.map((e, i) => <Cell key={i} fill={COLORS_MAP[e.status]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {data.fastest && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-emerald-600" /><span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{language === 'hi' ? 'सबसे तेज़' : 'Fastest'}</span></div>
            <p className="text-3xl font-black text-emerald-800 dark:text-emerald-300">{data.fastest.q}</p>
            <p className="text-sm text-emerald-600">{data.fastest.time}s</p>
          </div>
        )}
        {data.slowest && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1"><Timer className="w-4 h-4 text-red-600" /><span className="text-sm font-bold text-red-700 dark:text-red-400">{language === 'hi' ? 'सबसे धीमा' : 'Slowest'}</span></div>
            <p className="text-3xl font-black text-red-800 dark:text-red-300">{data.slowest.q}</p>
            <p className="text-sm text-red-600">{data.slowest.time}s</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   SMART AI INSIGHTS (enhanced)
   ═══════════════════════════════════════ */
const SmartInsights = ({ attempt, answers, questions, language }) => {
  const insights = useMemo(() => {
    if (!answers?.length) return [];
    const list = [];
    const acc = attempt?.accuracy || 0;
    const correct = attempt?.correctCount || 0;
    const wrong = attempt?.wrongCount || 0;
    const skipped = attempt?.skippedCount || 0;
    const total = answers.length;
    const avgTime = answers.reduce((s, a) => s + (a.timeTaken || 0), 0) / total;

    // Score insight
    if (acc >= 80) list.push({ t: 'success', i: Star, m: language === 'hi' ? `🏆 शानदार! ${acc}% सटीकता — टॉप परफॉर्मर!` : `🏆 Brilliant! ${acc}% accuracy — Top performer!` });
    else if (acc >= 60) list.push({ t: 'info', i: TrendingUp, m: language === 'hi' ? `👍 अच्छा! ${acc}% सटीकता। थोड़ा और अभ्यास से उत्कृष्ट बनेंगे!` : `👍 Good! ${acc}% accuracy. A bit more practice for excellence!` });
    else if (acc >= 40) list.push({ t: 'warn', i: AlertTriangle, m: language === 'hi' ? `📝 ${acc}% सटीकता। कमज़ोर विषयों पर ध्यान दें।` : `📝 ${acc}% accuracy. Focus on weak topics.` });
    else list.push({ t: 'error', i: TrendingDown, m: language === 'hi' ? `⚠️ ${acc}% सटीकता। मूल अवधारणाओं को दोहराएं।` : `⚠️ ${acc}% accuracy. Revise fundamentals.` });

    // Skip insight
    if (skipped > total * 0.3) list.push({ t: 'warn', i: MinusCircle, m: language === 'hi' ? `${skipped} प्रश्न छोड़े (${Math.round(skipped/total*100)}%)। सभी attempt करें — negative marking से बेहतर!` : `${skipped} skipped (${Math.round(skipped/total*100)}%). Try all — better than leaving blank!` });

    // Negative marking warning
    if (wrong > correct && wrong > 0) list.push({ t: 'error', i: XCircle, m: language === 'hi' ? `गलत (${wrong}) > सही (${correct})! Negative marking भारी पड़ रही है।` : `Wrong (${wrong}) > Right (${correct})! Negative marking is costly.` });

    // Speed insight
    if (avgTime < 25) list.push({ t: 'info', i: Zap, m: language === 'hi' ? `⚡ औसत ${Math.round(avgTime)}s/प्रश्न — बहुत तेज़! प्रश्न ध्यान से पढ़ें।` : `⚡ Avg ${Math.round(avgTime)}s/Q — Very fast! Read questions carefully.` });
    else if (avgTime > 120) list.push({ t: 'warn', i: Timer, m: language === 'hi' ? `🐢 औसत ${Math.round(avgTime)}s/प्रश्न। गति बढ़ाने का अभ्यास करें।` : `🐢 Avg ${Math.round(avgTime)}s/Q. Practice speed solving.` });

    // Difficulty insight
    const diffStats = { easy: { t: 0, c: 0 }, medium: { t: 0, c: 0 }, hard: { t: 0, c: 0 } };
    answers.forEach((a, i) => {
      const d = questions[i]?.difficulty || 'medium';
      if (diffStats[d]) { diffStats[d].t++; if (a.isCorrect) diffStats[d].c++; }
    });
    if (diffStats.easy.t > 0 && diffStats.easy.c / diffStats.easy.t < 0.6) {
      list.push({ t: 'error', i: Brain, m: language === 'hi' ? `🎯 आसान प्रश्नों में भी ${Math.round(diffStats.easy.c/diffStats.easy.t*100)}% सटीकता — बुनियादी बातें मजबूत करें!` : `🎯 Only ${Math.round(diffStats.easy.c/diffStats.easy.t*100)}% on easy Qs — strengthen basics!` });
    }
    if (diffStats.hard.t > 0 && diffStats.hard.c / diffStats.hard.t >= 0.5) {
      list.push({ t: 'success', i: Award, m: language === 'hi' ? `💎 कठिन प्रश्नों में ${Math.round(diffStats.hard.c/diffStats.hard.t*100)}% सटीकता — बहुत बढ़िया!` : `💎 ${Math.round(diffStats.hard.c/diffStats.hard.t*100)}% on hard Qs — Impressive!` });
    }

    // Improvement tip
    if (acc < 70) list.push({ t: 'info', i: BookOpen, m: language === 'hi' ? '📚 सुझाव: गलत प्रश्नों का हल देखें और कमज़ोर विषय दोहराएं।' : '📚 Tip: Review wrong answers and revise weak topics.' });

    return list;
  }, [attempt, answers, questions, language]);

  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    info: 'bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
    warn: 'bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    error: 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
  };

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        {language === 'hi' ? 'AI विश्लेषण और सुझाव' : 'AI Insights & Recommendations'}
      </h4>
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${styles[ins.t]} rp-pop`}
          style={{ animationDelay: `${i * 0.1}s` }}>
          <ins.i className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{ins.m}</p>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════
   SHARE MODAL (NEW!)
   ═══════════════════════════════════════ */
const ShareModal = ({ show, onClose, attempt, test, language }) => {
  const [copied, setCopied] = useState(false);
  if (!show) return null;
  const text = `${test?.title || 'Test'} — Score: ${attempt?.score}/${attempt?.totalMarks} (${attempt?.percentage || Math.round((attempt?.score/attempt?.totalMarks)*100)}%) ✅${attempt?.correctCount} ❌${attempt?.wrongCount}`;
  const handleCopy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleShare = () => {
    if (navigator.share) navigator.share({ title: test?.title, text });
    else handleCopy();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-secondary-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl rp-pop" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">{language === 'hi' ? 'शेयर करें' : 'Share Result'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-secondary-700 rounded-xl text-sm text-gray-700 dark:text-secondary-300 mb-4">{text}</div>
        <div className="flex gap-3">
          <button onClick={handleCopy} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-secondary-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
            {copied ? '✅ Copied!' : language === 'hi' ? '📋 कॉपी' : '📋 Copy'}
          </button>
          <button onClick={handleShare} className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors">
            {language === 'hi' ? '📤 शेयर' : '📤 Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   ██████  MAIN RESULT PAGE  ██████
   ════════════════════════════════════════════════════ */
const ResultPage = ({
  attempt, test, questions = [], language = 'hi',
  onLanguageChange, onReattempt, onGoBack,
  previousAttempts = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const navigate = useNavigate();

  const handleLanguageChange = useCallback((n) => {
    if (onLanguageChange) onLanguageChange(n);
    try { localStorage.setItem('netprep_lang', n); window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: n })); } catch {}
  }, [onLanguageChange]);

  const answers = attempt?.answers || [];
  const totalQ = answers.length || test?.totalQuestions || 0;
  const correct = attempt?.correctCount || 0;
  const wrong = attempt?.wrongCount || 0;
  const skipped = attempt?.skippedCount || 0;
  const score = attempt?.score || 0;
  const totalMarks = attempt?.totalMarks || (totalQ * (test?.marksPerQuestion || 2));
  const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
  const scorePct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const scoreColor = scorePct >= 80 ? '#10B981' : scorePct >= 60 ? '#3B82F6' : scorePct >= 40 ? '#F59E0B' : '#EF4444';

  // Trigger confetti for good scores
  useEffect(() => {
    if (scorePct >= 70) {
      const t = setTimeout(() => setShowConfetti(true), 800);
      const t2 = setTimeout(() => setShowConfetti(false), 5000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [scorePct]);

  const formatTime = (s) => s ? `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` : '0:00';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  const tabs = useMemo(() => [
    { id: 'overview', label: language === 'hi' ? 'अवलोकन' : 'Overview', icon: BarChart3 },
    { id: 'questions', label: language === 'hi' ? 'प्रश्न मैप' : 'Q-Map', icon: Hash },
    { id: 'solutions', label: language === 'hi' ? 'समाधान' : 'Solutions', icon: Eye },
    { id: 'time', label: language === 'hi' ? 'समय' : 'Time', icon: Timer },
    { id: 'topic', label: language === 'hi' ? 'विषय' : 'Topic', icon: BookOpen },
    ...(previousAttempts.length > 1 ? [{ id: 'compare', label: language === 'hi' ? 'तुलना' : 'Compare', icon: Activity }] : [])
  ], [language, previousAttempts.length]);

  const pieData = useMemo(() => [
    { name: language === 'hi' ? 'सही' : 'Correct', value: correct, fill: '#10B981' },
    { name: language === 'hi' ? 'गलत' : 'Wrong', value: wrong, fill: '#EF4444' },
    { name: language === 'hi' ? 'छोड़ा' : 'Skipped', value: skipped, fill: '#9CA3AF' }
  ].filter(d => d.value > 0), [language, correct, wrong, skipped]);

  // ─── SOLUTIONS FULL SCREEN ───
  if (activeTab === 'solutions') {
    return (
      <SolutionView
        answers={answers} questions={questions} language={language}
        test={test} initialIndex={solutionIndex}
        onClose={() => setActiveTab('overview')} onLanguageChange={handleLanguageChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 print:bg-white">
      <AnimStyles />
      <Confetti show={showConfetti} />
      <ShareModal show={showShare} onClose={() => setShowShare(false)} attempt={attempt} test={test} language={language} />

      {/* ═════ HERO HEADER ═════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-indigo-700 to-violet-800 dark:from-primary-800 dark:via-indigo-900 dark:to-violet-950" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6 no-print">
            <button onClick={() => onGoBack ? onGoBack() : navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" /><span className="text-sm font-medium hidden sm:inline">{language === 'hi' ? 'वापस' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2">
              <LanguageToggle language={language} onChange={handleLanguageChange} />
              <button onClick={() => setShowShare(true)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all no-print" title="Share"><Share2 className="w-4 h-4" /></button>
              <button onClick={() => window.print()} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all no-print" title="Print"><Printer className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-shrink-0 relative rp-pop">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-125" />
              <CircularProgress percentage={scorePct} size={190} strokeWidth={14} color={scoreColor}
                label={`${score}/${totalMarks}`} sublabel={language === 'hi' ? 'अंक' : 'Marks'} />
            </div>

            <div className="flex-1 text-center lg:text-left text-white">
              <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight rp-pop" style={{ animationDelay: '0.2s' }}>
                {test?.title || (language === 'hi' ? 'परीक्षा परिणाम' : 'Test Result')}
              </h1>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm text-white/60 mb-5 rp-pop" style={{ animationDelay: '0.3s' }}>
                {[
                  { icon: Clock, text: formatDate(attempt?.completedAt) },
                  { icon: Timer, text: formatTime(attempt?.totalTimeTaken) },
                  { icon: FileText, text: `${totalQ} ${language === 'hi' ? 'प्रश्न' : 'Q'}` }
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full">
                    <item.icon className="w-3.5 h-3.5" />{item.text}
                  </span>
                ))}
                {attempt?.attemptNumber > 1 && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-white/80 font-medium">
                    <RotateCcw className="w-3.5 h-3.5" />#{attempt.attemptNumber}
                  </span>
                )}
              </div>
              <GradeBadge percentage={scorePct} language={language} />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              {[
                { val: correct, label: language === 'hi' ? 'सही' : 'Correct', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
                { val: wrong, label: language === 'hi' ? 'गलत' : 'Wrong', color: 'text-red-300', bg: 'bg-red-500/20' },
                { val: skipped, label: language === 'hi' ? 'छोड़ा' : 'Skipped', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
                { val: `${accuracy}%`, label: language === 'hi' ? 'सटीकता' : 'Accuracy', color: 'text-blue-300', bg: 'bg-blue-500/20' }
              ].map((m, i) => (
                <div key={i} className={`${m.bg} backdrop-blur-sm rounded-2xl p-4 text-center min-w-[110px] border border-white/5 rp-pop`}
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                  <p className={`text-3xl font-black ${m.color}`}>
                    {typeof m.val === 'number' ? <Counter end={m.val} /> : m.val}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═════ ACTION BAR ═════ */}
      <div className="max-w-7xl mx-auto px-4 -mt-5 relative z-10 no-print">
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-secondary-800 rounded-2xl shadow-xl border border-gray-100 dark:border-secondary-700 p-3 sm:p-4">
          {onReattempt && (
            <Button variant="primary" icon={RotateCcw} onClick={onReattempt} className="shadow-md shadow-primary-500/20">
              {language === 'hi' ? 'पुनः प्रयास' : 'Reattempt'}
            </Button>
          )}
          <Button variant="outline" icon={Eye} onClick={() => { setSolutionIndex(0); setActiveTab('solutions'); }}>
            {language === 'hi' ? 'समाधान देखें' : 'View Solutions'}
          </Button>
          <Button variant="outline" icon={BookOpen} onClick={() => navigate('/tests')}>
            {language === 'hi' ? 'अन्य परीक्षा' : 'Other Tests'}
          </Button>
          <Button variant="ghost" icon={Share2} onClick={() => setShowShare(true)} className="ml-auto">
            {language === 'hi' ? 'शेयर' : 'Share'}
          </Button>
        </div>
      </div>

      {/* ═════ TABS ═════ */}
      <div className="max-w-7xl mx-auto px-4 mt-6 no-print">
        <div className="flex overflow-x-auto gap-1 bg-white dark:bg-secondary-800 rounded-2xl p-1.5 border border-gray-100 dark:border-secondary-700 shadow-sm scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { if (tab.id === 'solutions') setSolutionIndex(0); setActiveTab(tab.id); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-gray-500 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═════ TAB CONTENT ═════ */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle} label={language === 'hi' ? 'सही उत्तर' : 'Correct'} value={correct} color="text-emerald-600" gradient="from-emerald-500 to-green-600" delay={0} />
              <StatCard icon={XCircle} label={language === 'hi' ? 'गलत उत्तर' : 'Wrong'} value={wrong} color="text-red-600" gradient="from-red-500 to-rose-600" delay={0.1} />
              <StatCard icon={MinusCircle} label={language === 'hi' ? 'छोड़ा गया' : 'Skipped'} value={skipped} color="text-amber-600" gradient="from-amber-500 to-orange-600" delay={0.2} />
              <StatCard icon={Target} label={language === 'hi' ? 'सटीकता' : 'Accuracy'} value={`${accuracy}%`} color="text-blue-600" gradient="from-blue-500 to-indigo-600" delay={0.3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie */}
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary-500" />
                  {language === 'hi' ? 'उत्तर वितरण' : 'Answer Distribution'}
                </h4>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Question Type Breakdown */}
              <QuestionTypeBreakdown answers={answers} questions={questions} language={language} />
            </div>

            {/* Streak Analysis */}
            <StreakAnalysis answers={answers} language={language} />

            {/* Smart Insights */}
            <SmartInsights attempt={attempt} answers={answers} questions={questions} language={language} />
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary-500" />
              {language === 'hi' ? 'प्रश्न मानचित्र' : 'Question Map'}
              <span className="text-sm font-normal text-gray-400 ml-2">{language === 'hi' ? '(क्लिक करें समाधान देखने के लिए)' : '(Click to view solution)'}</span>
            </h3>
            <QuestionGrid answers={answers} onQuestionClick={(i) => { setSolutionIndex(i); setActiveTab('solutions'); }} language={language} />
          </div>
        )}

        {activeTab === 'time' && <TimeAnalysis answers={answers} language={language} />}
        {activeTab === 'topic' && <TopicAnalysis answers={answers} questions={questions} language={language} />}
        {activeTab === 'compare' && previousAttempts.length > 1 && (
          <ResultComparison attempts={previousAttempts} currentAttempt={attempt} language={language} />
        )}
      </div>
    </div>
  );
};

export default ResultPage;