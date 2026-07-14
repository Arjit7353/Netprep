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
  Home, LayoutDashboard, Bookmark, Settings, LogOut,
  PenTool, Flag, CheckSquare, ZapOff, BookCopy, LineChart, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  LineChart as RechartsLineChart, Line
} from 'recharts';
import Button from '../common/Button';
import SolutionView from './SolutionView';
import TopicAnalysis from './TopicAnalysis';
import ResultComparison from './ResultComparison';

/* ----------- CONFETTI PARTICLES ----------- */
const Confetti = ({ active }) => {
  const [particles, setParticles] = useState([]);
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  useEffect(() => {
    if (!active) return;
    const newP = Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 2, duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8, color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360, type: Math.random() > 0.5 ? 'circle' : 'rect',
    }));
    setParticles(newP);
    const timer = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timer);
  }, [active]);
  if (!particles.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute" style={{ left: ${p.x}%, top: '-20px', animation: confetti-fall s ease-in s forwards }}>
          {p.type === 'circle' ? (
            <div style={{ width: p.size, height: p.size, borderRadius: '50%', backgroundColor: p.color, transform: otate(deg) }} />
          ) : (
            <div style={{ width: p.size, height: p.size * 0.6, backgroundColor: p.color, transform: otate(deg), borderRadius: 2 }} />
          )}
        </div>
      ))}
      <style>{@keyframes confetti-fall { 0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; } 50% { opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; } }}</style>
    </div>
  );
};

/* ----------- CELEBRATION OVERLAY ----------- */
const CelebrationOverlay = ({ percentage, language, onDismiss }) => {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => { setShow(false); if (onDismiss) onDismiss(); }, 4000); return () => clearTimeout(t); }, []);
  if (!show || percentage < 90) return null;
  const isPerfect = percentage === 100;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => { setShow(false); if (onDismiss) onDismiss(); }}>
      <div className="text-center animate-bounce-in bg-white/10 p-10 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="relative mb-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-pulse">
            {isPerfect ? <Medal className="w-16 h-16 text-white" /> : <Trophy className="w-16 h-16 text-white" />}
          </div>
        </div>
        <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{isPerfect ? (language === 'hi' ? '??????? ?????!' : 'Perfect Score!') : (language === 'hi' ? '??????!' : 'Outstanding!')}</h2>
        <p className="text-2xl text-amber-300 font-black mb-2">{percentage}%</p>
        <p className="text-white/60 text-sm mt-4">{language === 'hi' ? '??? ???? ?? ??? ???? ?? ????? ????' : 'Click anywhere to dismiss'}</p>
      </div>
    </div>
  );
};

/* ----------- ANIMATED CIRCULAR PROGRESS ----------- */
const CircularProgress = ({ percentage, size = 180, strokeWidth = 14, color, label, sublabel }) => {
  const [val, setVal] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const id = cg---;
  useEffect(() => {
    const t = setTimeout(() => {
      let c = 0; const iv = setInterval(() => { c += 1.5; if (c >= percentage) { setVal(percentage); clearInterval(iv); } else setVal(Math.floor(c)); }, 12);
      return () => clearInterval(iv);
    }, 400); return () => clearTimeout(t);
  }, [percentage]);
  return (
    <div className="relative inline-flex items-center justify-center drop-shadow-2xl hover:scale-105 transition-transform duration-500">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <filter id={glow-}><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={url(#)} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} filter={url(#glow-)} className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{val}<span className="text-2xl text-gray-400">%</span></span>
        {label && <span className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-1">{label}</span>}
        {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
      </div>
    </div>
  );
};

/* ----------- ANIMATED COUNTER ----------- */
const Counter = ({ end, suffix = '', prefix = '' }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    let s = 0; const n = typeof end === 'number' ? end : parseInt(end) || 0;
    const inc = Math.max(n / 50, 1);
    const iv = setInterval(() => { s += inc; if (s >= n) { setC(n); clearInterval(iv); } else setC(Math.floor(s)); }, 16);
    return () => clearInterval(iv);
  }, [end]);
  return <>{prefix}{c}{suffix}</>;
};

/* ----------- STAT CARD (PREMIUM) ----------- */
const PremiumStatCard = ({ icon: Icon, label, value, subValue, color, gradient, trend }) => (
  <div className="relative overflow-hidden bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 group hover:shadow-2xl hover:border-gray-300/50 dark:hover:border-gray-600/50 transition-all duration-500 hover:-translate-y-1">
    <div className={bsolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br  rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-700 blur-2xl} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <p className={	ext-4xl font-black }>{typeof value === 'number' ? <Counter end={value} /> : value}</p>
          {subValue && <span className="text-sm font-semibold text-gray-400 mb-1">{subValue}</span>}
        </div>
        {trend && (
          <div className={lex items-center gap-1 mt-2 text-xs font-semibold }>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <MinusCircle className="w-3 h-3" />}
            {Math.abs(trend)}% vs avg
          </div>
        )}
      </div>
      <div className={w-14 h-14 bg-gradient-to-br  rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

