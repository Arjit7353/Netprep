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
  Percent, Share2, Download
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={() => { setShow(false); if (onDismiss) onDismiss(); }}>
      <div className="text-center animate-bounce-in" onClick={e => e.stopPropagation()}>
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-pulse">
            {isPerfect ? <Medal className="w-16 h-16 text-white" /> : <Trophy className="w-16 h-16 text-white" />}
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
            <Star className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">
          {isPerfect
            ? (language === 'hi' ? 'परफेक्ट स्कोर!' : 'Perfect Score!')
            : (language === 'hi' ? 'शानदार!' : 'Outstanding!')}
        </h2>
        <p className="text-xl text-white/80 font-semibold mb-2">{percentage}%</p>
        <p className="text-white/60 text-sm">
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
        c += 1.2;
        if (c >= percentage) { setVal(percentage); clearInterval(iv); }
        else setVal(Math.floor(c));
      }, 12);
      return () => clearInterval(iv);
    }, 400);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor"
          className="text-gray-200 dark:text-secondary-700" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#${id})`}
          strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          filter={`url(#glow-${id})`}
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          {val}<span className="text-2xl">%</span>
        </span>
        {label && <span className="text-sm font-semibold text-gray-500 dark:text-secondary-400 mt-0.5">{label}</span>}
        {sublabel && <span className="text-xs text-gray-400 dark:text-secondary-500">{sublabel}</span>}
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

/* ═══════════ GRADE BADGE ═══════════ */
const GradeBadge = ({ percentage, language }) => {
  const cfg = percentage >= 90
    ? { grade: 'A+', color: 'from-emerald-500 to-green-600', text: language === 'hi' ? 'उत्कृष्ट!' : 'Outstanding!', icon: Trophy }
    : percentage >= 80
      ? { grade: 'A', color: 'from-green-500 to-emerald-600', text: language === 'hi' ? 'बहुत अच्छा!' : 'Excellent!', icon: Award }
      : percentage >= 70
        ? { grade: 'B+', color: 'from-blue-500 to-cyan-600', text: language === 'hi' ? 'अच्छा!' : 'Good!', icon: TrendingUp }
        : percentage >= 60
          ? { grade: 'B', color: 'from-cyan-500 to-blue-600', text: language === 'hi' ? 'औसत से ऊपर' : 'Above Average', icon: Target }
          : percentage >= 50
            ? { grade: 'C', color: 'from-yellow-500 to-amber-600', text: language === 'hi' ? 'औसत' : 'Average', icon: Activity }
            : percentage >= 35
              ? { grade: 'D', color: 'from-orange-500 to-red-500', text: language === 'hi' ? 'सुधार करें' : 'Needs Work', icon: AlertTriangle }
              : { grade: 'F', color: 'from-red-500 to-rose-600', text: language === 'hi' ? 'अभ्यास करें' : 'Practice More', icon: Flame };

  const IconComp = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${cfg.color} text-white shadow-lg animate-bounce-in`}>
      <IconComp className="w-5 h-5" />
      <span className="text-2xl font-black">{cfg.grade}</span>
      <div className="h-6 w-px bg-white/30" />
      <span className="text-sm font-semibold">{cfg.text}</span>
    </div>
  );
};

/* ═══════════ STAT CARD ═══════════ */
const StatCard = ({ icon: Icon, label, value, color, gradient, delay = 0 }) => (
  <div className="relative overflow-hidden bg-white/80 dark:bg-secondary-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}>
    <div className={`absolute -top-3 -right-3 w-16 h-16 bg-gradient-to-br ${gradient} rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500`} />
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] text-gray-500 dark:text-secondary-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-black ${color}`}>
          {typeof value === 'number' ? <Counter end={value} /> : value}
        </p>
      </div>
    </div>
  </div>
);

/* ═══════════ INSIGHTS ═══════════ */
const Insights = ({ attempt, answers, questions, language }) => {
  const insights = useMemo(() => {
    if (!answers?.length) return [];
    const list = [];
    const acc = attempt?.accuracy || 0;
    const correct = attempt?.correctCount || 0;
    const wrong = attempt?.wrongCount || 0;
    const skipped = attempt?.skippedCount || 0;
    const total = answers.length;

    if (acc >= 80) list.push({ t: 'success', i: Star, m: language === 'hi' ? `शानदार! ${acc}% सटीकता। उत्कृष्ट प्रदर्शन!` : `Brilliant! ${acc}% accuracy. Outstanding!` });
    else if (acc >= 50) list.push({ t: 'info', i: TrendingUp, m: language === 'hi' ? `अच्छा प्रयास! ${acc}% सटीकता। सुधार की गुंजाइश है।` : `Good effort! ${acc}% accuracy. Room to improve.` });
    else list.push({ t: 'warn', i: TrendingDown, m: language === 'hi' ? `${acc}% सटीकता। मूल अवधारणाओं पर ध्यान दें।` : `${acc}% accuracy. Focus on basics.` });

    if (skipped > total * 0.3) list.push({ t: 'warn', i: SkipForward, m: language === 'hi' ? `${skipped} प्रश्न छोड़ दिए (${Math.round(skipped / total * 100)}%)। सभी attempt करें।` : `${skipped} skipped (${Math.round(skipped / total * 100)}%). Try all questions.` });
    if (wrong > correct && wrong > 0) list.push({ t: 'error', i: AlertTriangle, m: language === 'hi' ? `गलत (${wrong}) > सही (${correct})। Negative marking से सावधान।` : `Wrong (${wrong}) > Correct (${correct}). Watch negative marking.` });

    const avgT = answers.reduce((s, a) => s + (a.timeTaken || 0), 0) / total;
    if (avgT > 0 && avgT < 30) list.push({ t: 'info', i: Zap, m: language === 'hi' ? `औसत ${Math.round(avgT)}s/प्रश्न - बहुत तेज! ध्यान से पढ़ें।` : `Avg ${Math.round(avgT)}s/Q - Very fast! Read carefully.` });
    else if (avgT > 120) list.push({ t: 'warn', i: Timer, m: language === 'hi' ? `औसत ${Math.round(avgT)}s/प्रश्न - गति बढ़ाएं।` : `Avg ${Math.round(avgT)}s/Q - Improve speed.` });

    if (correct === total && total > 0) list.push({ t: 'success', i: Medal, m: language === 'hi' ? `परफेक्ट स्कोर! सभी ${total} प्रश्न सही!` : `Perfect! All ${total} questions correct!` });

    return list;
  }, [attempt, answers, language]);

  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warn: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  };

  if (!insights.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary-500" />
        {language === 'hi' ? 'स्मार्ट विश्लेषण' : 'Smart Insights'}
      </h4>
      {insights.map((ins, i) => (
        <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${styles[ins.t]} animate-fade-in`}
          style={{ animationDelay: `${i * 100}ms` }}>
          <ins.i className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{ins.m}</p>
        </div>
      ))}
    </div>
  );
};

/* ═══════════ QUESTION GRID ═══════════ */
const QuestionGrid = ({ answers, onQuestionClick, language }) => {
  const getStyle = (a) => {
    if (a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null)
      return 'bg-gray-100 dark:bg-secondary-700 text-gray-500 border-gray-200 dark:border-secondary-600 hover:bg-gray-200 dark:hover:bg-secondary-600';
    if (a.isCorrect) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200';
    return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-200';
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-5 p-3 bg-gray-50 dark:bg-secondary-900 rounded-xl">
        {[
          { color: 'bg-emerald-500', label: language === 'hi' ? 'सही' : 'Correct' },
          { color: 'bg-red-500', label: language === 'hi' ? 'गलत' : 'Wrong' },
          { color: 'bg-gray-400', label: language === 'hi' ? 'छोड़ा' : 'Skipped' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-md ${l.color} shadow-sm`} />
            <span className="text-xs text-gray-600 dark:text-secondary-400 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
        {answers.map((a, i) => (
          <button key={i} onClick={() => onQuestionClick(i)}
            className={`w-full aspect-square rounded-xl border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95 ${getStyle(a)} ${
              a.markedForReview ? 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-secondary-800' : ''
            }`}
            title={`Q.${i + 1}`}>
            {i + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { count: answers.filter(a => a.isCorrect).length, label: language === 'hi' ? 'सही' : 'Correct', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { count: answers.filter(a => !a.isCorrect && a.selectedAnswer !== -1 && a.selectedAnswer !== undefined && a.selectedAnswer !== null).length, label: language === 'hi' ? 'गलत' : 'Wrong', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { count: answers.filter(a => a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null).length, label: language === 'hi' ? 'छोड़ा' : 'Skipped', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-secondary-700' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════ TIME ANALYSIS ═══════════ */
const TimeAnalysis = ({ answers, language }) => {
  const data = useMemo(() => {
    if (!answers?.length) return null;
    const times = answers.map((a, i) => ({
      q: `Q${i + 1}`, time: a.timeTaken || 0,
      status: (a.selectedAnswer === -1 || a.selectedAnswer === undefined || a.selectedAnswer === null) ? 'skipped' : a.isCorrect ? 'correct' : 'wrong'
    }));
    const total = times.reduce((s, t) => s + t.time, 0);
    const avg = times.length > 0 ? total / times.length : 0;
    const correctT = times.filter(t => t.status === 'correct').map(t => t.time);
    const wrongT = times.filter(t => t.status === 'wrong').map(t => t.time);
    const avgC = correctT.length ? correctT.reduce((a, b) => a + b, 0) / correctT.length : 0;
    const avgW = wrongT.length ? wrongT.reduce((a, b) => a + b, 0) / wrongT.length : 0;
    const validTimes = times.filter(t => t.time > 0);
    const fastest = validTimes.length ? [...validTimes].sort((a, b) => a.time - b.time)[0] : null;
    const slowest = validTimes.length ? [...validTimes].sort((a, b) => b.time - a.time)[0] : null;
    return { times, total, avg, avgC, avgW, fastest, slowest };
  }, [answers]);

  if (!data) return null;
  const COLORS_MAP = { correct: '#10B981', wrong: '#EF4444', skipped: '#9CA3AF' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Clock, value: `${Math.round(data.avg)}s`, label: language === 'hi' ? 'औसत/प्रश्न' : 'Avg/Question', gradient: 'from-blue-500 to-indigo-600' },
          { icon: Zap, value: `${Math.round(data.avgC)}s`, label: language === 'hi' ? 'सही का औसत' : 'Avg Correct', gradient: 'from-emerald-500 to-green-600' },
          { icon: AlertTriangle, value: `${Math.round(data.avgW)}s`, label: language === 'hi' ? 'गलत का औसत' : 'Avg Wrong', gradient: 'from-red-500 to-rose-600' },
          { icon: Timer, value: `${Math.floor(data.total / 60)}m ${data.total % 60}s`, label: language === 'hi' ? 'कुल समय' : 'Total Time', gradient: 'from-purple-500 to-violet-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 text-center hover:shadow-lg transition-all">
            <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-[11px] text-gray-500 dark:text-secondary-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          {language === 'hi' ? 'प्रति प्रश्न समय' : 'Time Per Question'}
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.times} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
            <XAxis dataKey="q" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              formatter={(v) => [`${v}s`, language === 'hi' ? 'समय' : 'Time']} />
            <Bar dataKey="time" radius={[6, 6, 0, 0]}>
              {data.times.map((e, i) => <Cell key={i} fill={COLORS_MAP[e.status]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {data.fastest && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg"><Zap className="w-4 h-4 text-emerald-600" /></div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{language === 'hi' ? 'सबसे तेज़' : 'Fastest'}</span>
            </div>
            <p className="text-3xl font-black text-emerald-800 dark:text-emerald-300">{data.fastest.q}</p>
            <p className="text-sm text-emerald-600 font-semibold mt-1">{data.fastest.time}s</p>
          </div>
        )}
        {data.slowest && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg"><Timer className="w-4 h-4 text-red-600" /></div>
              <span className="text-sm font-bold text-red-700 dark:text-red-400">{language === 'hi' ? 'सबसे धीमा' : 'Slowest'}</span>
            </div>
            <p className="text-3xl font-black text-red-800 dark:text-red-300">{data.slowest.q}</p>
            <p className="text-sm text-red-600 font-semibold mt-1">{data.slowest.time}s</p>
          </div>
        )}
      </div>

      {data.avgW > data.avgC * 1.5 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
            {language === 'hi'
              ? `आप गलत उत्तरों पर औसतन ${Math.round(data.avgW)}s खर्च कर रहे हैं (सही: ${Math.round(data.avgC)}s)। यदि अनिश्चित हों तो आगे बढ़ें।`
              : `You spend avg ${Math.round(data.avgW)}s on wrong answers (correct: ${Math.round(data.avgC)}s). Consider skipping if unsure.`}
          </p>
        </div>
      )}
    </div>
  );
};

/* ═══════════ QUESTION TYPE DISTRIBUTION ═══════════ */
const QuestionTypeChart = ({ answers, questions, language }) => {
  const data = useMemo(() => {
    if (!questions?.length) return [];
    const typeMap = {};
    questions.forEach((q, i) => {
      const type = q?.questionType || 'mcq';
      if (!typeMap[type]) typeMap[type] = { total: 0, correct: 0 };
      typeMap[type].total++;
      if (answers[i]?.isCorrect) typeMap[type].correct++;
    });
    const TYPE_LABELS = {
      mcq: 'MCQ', assertion_reason: 'A-R', match_following: 'Match',
      sequence_order: 'Sequence', statement_based: 'Statement', passage_based: 'Passage',
      di_table: 'DI-Table', di_bar_chart: 'DI-Bar', di_pie_chart: 'DI-Pie',
      di_line_graph: 'DI-Line', di_caselet: 'DI-Case', di_mixed: 'DI-Mix'
    };
    return Object.entries(typeMap).map(([type, d]) => ({
      name: TYPE_LABELS[type] || type,
      total: d.total,
      correct: d.correct,
      accuracy: d.total > 0 ? Math.round(d.correct / d.total * 100) : 0
    }));
  }, [answers, questions]);

  if (data.length <= 1) return null;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary-500" />
        {language === 'hi' ? 'प्रश्न प्रकार अनुसार' : 'By Question Type'}
      </h4>
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-secondary-300">{d.name}</span>
                <span className="text-xs font-bold text-gray-500">{d.correct}/{d.total} ({d.accuracy}%)</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${d.accuracy}%`, backgroundColor: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          </div>
        ))}
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
    try {
      const saved = localStorage.getItem('netprep_lang');
      if (saved === 'hi' || saved === 'en') return saved;
    } catch {}
    return propLanguage;
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const celebrationShown = useRef(false);
  const navigate = useNavigate();

  // Sync language
  useEffect(() => {
    if (propLanguage && propLanguage !== language) setLanguage(propLanguage);
  }, [propLanguage]);

  useEffect(() => {
    const handleLangChange = (e) => {
      const newLang = e.detail;
      if (newLang === 'hi' || newLang === 'en') setLanguage(newLang);
    };
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

  // Score calculations
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

  // Celebration trigger
  useEffect(() => {
    if (scorePct >= 90 && !celebrationShown.current) {
      celebrationShown.current = true;
      setShowCelebration(true);
      setShowConfetti(true);
    }
  }, [scorePct]);

  const formatTime = (s) => s ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` : '0:00';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  const tabs = useMemo(() => {
    const t = [
      { id: 'overview', label: language === 'hi' ? 'अवलोकन' : 'Overview', icon: BarChart3 },
      { id: 'questions', label: language === 'hi' ? 'प्रश्न मैप' : 'Q-Map', icon: Hash },
    ];
    if (!isDeletedTest && questions.length > 0) {
      t.push({ id: 'solutions', label: language === 'hi' ? 'समाधान' : 'Solutions', icon: Eye });
    }
    t.push({ id: 'time', label: language === 'hi' ? 'समय' : 'Time', icon: Timer });
    t.push({ id: 'topic', label: language === 'hi' ? 'विषय' : 'Topic', icon: BookOpen });
    if (previousAttempts.length > 1) {
      t.push({ id: 'compare', label: language === 'hi' ? 'तुलना' : 'Compare', icon: Activity });
    }
    return t;
  }, [language, previousAttempts.length, isDeletedTest, questions.length]);

  const pieData = useMemo(() => [
    { name: language === 'hi' ? 'सही' : 'Correct', value: correct, fill: '#10B981' },
    { name: language === 'hi' ? 'गलत' : 'Wrong', value: wrong, fill: '#EF4444' },
    { name: language === 'hi' ? 'छोड़ा' : 'Skipped', value: skipped, fill: '#9CA3AF' },
  ].filter(d => d.value > 0), [language, correct, wrong, skipped]);

  // Solution View
  if (activeTab === 'solutions' && !isDeletedTest) {
    return (
      <SolutionView answers={answers} questions={questions} language={language}
        test={test} initialIndex={solutionIndex}
        onClose={() => setActiveTab('overview')} onLanguageChange={handleLanguageToggle} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 print:bg-white">

      {/* Celebration */}
      <Confetti active={showConfetti} />
      {showCelebration && (
        <CelebrationOverlay percentage={scorePct} language={language}
          onDismiss={() => setShowCelebration(false)} />
      )}

      {/* ═════════ HERO HEADER ═════════ */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${isDeletedTest
          ? 'bg-gradient-to-br from-gray-600 via-slate-700 to-gray-800'
          : 'bg-gradient-to-br from-primary-600 via-indigo-700 to-violet-800 dark:from-primary-800 dark:via-indigo-900 dark:to-violet-950'
        }`} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative max-w-7xl mx-auto px-4 py-6 sm:py-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => onGoBack ? onGoBack() : navigate(-1)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors active:scale-95">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">{language === 'hi' ? 'वापस' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-2 print:hidden">
              {isDeletedTest && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-200 rounded-xl text-xs font-bold border border-amber-400/30">
                  <Archive className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'टेस्ट हटाया गया' : 'Test Deleted'}
                </span>
              )}
              <button onClick={handleLanguageToggle}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all text-white text-sm font-bold active:scale-95">
                <Languages className="w-4 h-4" />
                <span>{language === 'hi' ? 'EN' : 'हि'}</span>
              </button>
              <button onClick={() => window.print()}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95">
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main hero */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-125" />
              <CircularProgress percentage={scorePct} size={190} strokeWidth={14} color={scoreColor}
                label={`${score}/${totalMarks}`} sublabel={language === 'hi' ? 'अंक' : 'Marks'} />
            </div>

            <div className="flex-1 text-center lg:text-left text-white">
              <div className="flex items-center gap-3 justify-center lg:justify-start mb-3">
                <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                  {test?.title || (language === 'hi' ? 'परीक्षा परिणाम' : 'Test Result')}
                </h1>
                {isDeletedTest && (
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-xs font-bold text-white/60 border border-white/10">
                    <Archive className="w-3 h-3 inline mr-1" />
                    {language === 'hi' ? 'हटाया गया' : 'Archived'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm text-white/60 mb-5">
                {[
                  { icon: Clock, text: formatDate(attempt?.completedAt) },
                  { icon: Timer, text: formatTime(attempt?.totalTimeTaken) },
                  { icon: FileText, text: `${totalQ} ${language === 'hi' ? 'प्रश्न' : 'Q'}` },
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

            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              {[
                { val: correct, label: language === 'hi' ? 'सही' : 'Correct', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
                { val: wrong, label: language === 'hi' ? 'गलत' : 'Wrong', color: 'text-red-300', bg: 'bg-red-500/20' },
                { val: skipped, label: language === 'hi' ? 'छोड़ा' : 'Skipped', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
                { val: `${accuracy}%`, label: language === 'hi' ? 'सटीकता' : 'Accuracy', color: 'text-blue-300', bg: 'bg-blue-500/20' },
              ].map((m, i) => (
                <div key={i} className={`${m.bg} backdrop-blur-sm rounded-2xl p-4 text-center min-w-[110px] border border-white/5`}>
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

      {/* ═════════ ACTION BAR ═════════ */}
      <div className="max-w-7xl mx-auto px-4 -mt-5 relative z-10 print:hidden">
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-secondary-800 rounded-2xl shadow-xl border border-gray-100 dark:border-secondary-700 p-3 sm:p-4">
          {onReattempt && !isDeletedTest && (
            <Button variant="gradient" icon={RotateCcw} onClick={onReattempt}>
              {language === 'hi' ? 'पुनः प्रयास' : 'Reattempt'}
            </Button>
          )}
          {!isDeletedTest && questions.length > 0 && (
            <Button variant="outline" icon={Eye} onClick={() => { setSolutionIndex(0); setActiveTab('solutions'); }}>
              {language === 'hi' ? 'समाधान देखें' : 'View Solutions'}
            </Button>
          )}
          {isDeletedTest && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <Archive className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                {language === 'hi' ? 'मूल टेस्ट हटा दिया गया है। समाधान उपलब्ध नहीं हैं।' : 'Original test was deleted. Solutions are unavailable.'}
              </span>
            </div>
          )}
          <Button variant="ghost" icon={BookOpen} onClick={() => navigate('/tests')}>
            {language === 'hi' ? 'अन्य परीक्षा' : 'Other Tests'}
          </Button>
        </div>
      </div>

      {/* ═════════ TABS ═════════ */}
      <div className="max-w-7xl mx-auto px-4 mt-6 print:hidden">
        <div className="flex overflow-x-auto gap-1 bg-white dark:bg-secondary-800 rounded-2xl p-1.5 border border-gray-100 dark:border-secondary-700 shadow-sm scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => { if (tab.id === 'solutions') setSolutionIndex(0); setActiveTab(tab.id); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20'
                  : 'text-gray-500 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700 hover:text-gray-700'
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═════════ TAB CONTENT ═════════ */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle} label={language === 'hi' ? 'सही उत्तर' : 'Correct'} value={correct} color="text-emerald-600" gradient="from-emerald-500 to-green-600" delay={0} />
              <StatCard icon={XCircle} label={language === 'hi' ? 'गलत उत्तर' : 'Wrong'} value={wrong} color="text-red-600" gradient="from-red-500 to-rose-600" delay={100} />
              <StatCard icon={MinusCircle} label={language === 'hi' ? 'छोड़ा गया' : 'Skipped'} value={skipped} color="text-amber-600" gradient="from-amber-500 to-orange-600" delay={200} />
              <StatCard icon={Target} label={language === 'hi' ? 'सटीकता' : 'Accuracy'} value={`${accuracy}%`} color="text-blue-600" gradient="from-blue-500 to-indigo-600" delay={300} />
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
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={4} dataKey="value" strokeWidth={0}
                      animationBegin={500} animationDuration={1000}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Difficulty */}
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-500" />
                  {language === 'hi' ? 'कठिनाई अनुसार' : 'By Difficulty'}
                </h4>
                {(() => {
                  const bd = { easy: { t: 0, c: 0 }, medium: { t: 0, c: 0 }, hard: { t: 0, c: 0 } };
                  answers.forEach((a, i) => {
                    const d = questions[i]?.difficulty || 'medium';
                    if (bd[d]) { bd[d].t++; if (a.isCorrect) bd[d].c++; }
                  });
                  const diffData = Object.entries(bd).filter(([, v]) => v.t > 0).map(([k, v]) => ({
                    name: k === 'easy' ? (language === 'hi' ? 'सरल' : 'Easy') : k === 'hard' ? (language === 'hi' ? 'कठिन' : 'Hard') : (language === 'hi' ? 'मध्यम' : 'Medium'),
                    correct: v.c, total: v.t, acc: v.t > 0 ? Math.round(v.c / v.t * 100) : 0,
                    color: k === 'easy' ? '#10B981' : k === 'hard' ? '#EF4444' : '#F59E0B',
                    bg: k === 'easy' ? 'bg-emerald-50 dark:bg-emerald-900/20' : k === 'hard' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
                  }));

                  if (diffData.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Layers className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">{language === 'hi' ? 'कठिनाई डेटा उपलब्ध नहीं' : 'No difficulty data available'}</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {diffData.map((d, i) => (
                        <div key={i} className={`p-4 rounded-xl ${d.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm" style={{ color: d.color }}>{d.name}</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white">{d.correct}/{d.total}</span>
                          </div>
                          <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${d.acc}%`, backgroundColor: d.color }} />
                          </div>
                          <p className="text-xs mt-1 font-semibold" style={{ color: d.color }}>{d.acc}%</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Question Type Distribution */}
            <QuestionTypeChart answers={answers} questions={questions} language={language} />

            {/* Performance Bars */}
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                {language === 'hi' ? 'प्रदर्शन मीटर' : 'Performance Meters'}
              </h4>
              <div className="space-y-5">
                {[
                  { label: language === 'hi' ? 'स्कोर' : 'Score', val: scorePct, color: 'from-blue-500 to-indigo-600', extra: `${score}/${totalMarks}` },
                  { label: language === 'hi' ? 'सटीकता' : 'Accuracy', val: accuracy, color: 'from-emerald-500 to-green-600', extra: `${correct}/${correct + wrong}` },
                  { label: language === 'hi' ? 'प्रयास दर' : 'Attempt Rate', val: attemptRate, color: 'from-purple-500 to-violet-600', extra: `${correct + wrong}/${totalQ}` },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-secondary-300 font-medium">{bar.label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {bar.val}% <span className="text-gray-400 text-xs ml-1">({bar.extra})</span>
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${bar.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${bar.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Insights attempt={attempt} answers={answers} questions={questions} language={language} />

            {/* Solutions CTA */}
            {!isDeletedTest && questions.length > 0 && (
              <Button variant="gradient" fullWidth icon={BookOpen} size="lg" onClick={() => { setSolutionIndex(0); setActiveTab('solutions'); }} className="mt-2">
                {language === 'hi' ? 'विस्तृत समाधान देखें' : 'View Detailed Solutions'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}

        {/* QUESTION MAP */}
        {activeTab === 'questions' && (
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary-500" />
              {language === 'hi' ? 'प्रश्न मानचित्र' : 'Question Map'}
              {!isDeletedTest && questions.length > 0 && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({language === 'hi' ? 'प्रश्न पर क्लिक करके समाधान देखें' : 'Click any question to view solution'})
                </span>
              )}
            </h3>
            <QuestionGrid answers={answers}
              onQuestionClick={(i) => {
                if (!isDeletedTest && questions.length > 0) {
                  setSolutionIndex(i); setActiveTab('solutions');
                }
              }}
              language={language} />
          </div>
        )}

        {/* TIME ANALYSIS */}
        {activeTab === 'time' && <TimeAnalysis answers={answers} language={language} />}

        {/* TOPIC ANALYSIS */}
        {activeTab === 'topic' && (
          <TopicAnalysis answers={answers} questions={questions} language={language}
            topicAnalysis={attempt?.topicAnalysis} testDeleted={isDeletedTest} />
        )}

        {/* COMPARISON */}
        {activeTab === 'compare' && previousAttempts.length > 1 && (
          <ResultComparison attempts={previousAttempts} currentAttempt={attempt} language={language} />
        )}
      </div>
    </div>
  );
};

export default ResultPage;