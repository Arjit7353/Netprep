// client/src/pages/Dashboard.jsx
// ═══════════════════════════════════════════════════════════════
//  NETPREP ULTIMATE DASHBOARD V3 (AI JRF Predictor & Locked Exam)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import {
  FileQuestion, ClipboardList, BarChart3, TrendingUp, Upload,
  PlusCircle, Clock, Target, BookOpen, Award, ArrowRight,
  Calendar, Zap, Trophy, Flame, Star, ChevronRight, Play,
  Timer, CheckCircle, XCircle, SkipForward,
  Activity, TrendingDown, RefreshCw, Layers, Eye,
  PieChart as PieChartIcon, History, Sparkles, GraduationCap,
  ChevronUp, ChevronDown, Hash, Crown, BarChart2,
  Sun, Moon, Coffee, Sunset, Gauge, Medal, Lock, Unlock,
  Lightbulb, AlertTriangle, Info, Rocket, Crosshair,
  Swords, FileText, LayoutGrid, AlertCircle, Shield,
  ArrowUpDown, Hourglass, ListOrdered,
  Flag, CircleDot, Brain, Percent, MapPin,
  Milestone, CalendarDays, CalendarClock, Workflow,
  Grid3X3, Dumbbell, HeartPulse,
  ArrowUp, ArrowDown, Minus, Settings, X,
  BookMarked, Repeat, RotateCcw, Newspaper,
  SquareStack, ChevronLeft, Download, Share2,
  Inbox, AlarmClock, Footprints, ListChecks, NotebookPen, Waypoints, ScanEye,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';

// ════════════════════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════════════════════
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { I: Moon, en: 'Late Night Study', hi: 'देर रात अध्ययन', g: 'from-indigo-600 to-purple-700' };
  if (h < 12) return { I: Sun, en: 'Good Morning', hi: 'सुप्रभात', g: 'from-amber-500 to-orange-600' };
  if (h < 17) return { I: Coffee, en: 'Good Afternoon', hi: 'नमस्ते', g: 'from-blue-600 to-indigo-600' };
  if (h < 21) return { I: Sunset, en: 'Good Evening', hi: 'शुभ संध्या', g: 'from-orange-600 to-rose-600' };
  return { I: Moon, en: 'Good Night', hi: 'शुभ रात्रि', g: 'from-indigo-600 to-purple-700' };
};
const tAgo = (d, l) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return l === 'hi' ? 'अभी' : 'Now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  if (m < 10080) return `${Math.floor(m / 1440)}d`;
  return new Date(d).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short' });
};
const grd = (p) => {
  if (p >= 90) return { g: 'A+', c: 'emerald' };
  if (p >= 80) return { g: 'A', c: 'emerald' };
  if (p >= 70) return { g: 'B+', c: 'blue' };
  if (p >= 60) return { g: 'B', c: 'blue' };
  if (p >= 50) return { g: 'C', c: 'amber' };
  if (p >= 40) return { g: 'D', c: 'orange' };
  return { g: 'F', c: 'red' };
};
const GC = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};
const fmtTime = (s) => { if (!s) return '0m'; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

// ════════════════════════════════════════════════════════════
//  MICRO COMPONENTS
// ════════════════════════════════════════════════════════════
const Cnt = React.memo(({ end, sfx = '', decimals = 0 }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!end && end !== 0) { setC(0); return; }
    let s, f;
    const target = typeof end === 'number' ? end : parseFloat(end) || 0;
    const r = t => {
      if (!s) s = t;
      const p = Math.min((t - s) / 1200, 1);
      setC(decimals > 0 ? parseFloat(((1 - Math.pow(1 - p, 4)) * target).toFixed(decimals)) : Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) f = requestAnimationFrame(r);
    };
    f = requestAnimationFrame(r);
    return () => cancelAnimationFrame(f);
  }, [end, decimals]);
  return <>{typeof c === 'number' ? c.toLocaleString() : c}{sfx}</>;
});

const Ring = React.memo(({ pct, size = 100, sw = 7, color = '#3b82f6', bg, children }) => {
  const [a, setA] = useState(0);
  const r = (size - sw) / 2, C = 2 * Math.PI * r;
  useEffect(() => { const t = setTimeout(() => setA(Math.min(pct || 0, 100)), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg || '#e5e7eb'} strokeWidth={sw} className="dark:stroke-gray-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - a / 100)} className="transition-all duration-[1.5s] ease-out" style={{ filter: `drop-shadow(0 0 4px ${color}40)` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
});

const Sk = ({ className = '' }) => <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />;

const LiveClock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10">
      <Clock className="w-3 h-3 text-indigo-300" />
      <span className="text-xs font-mono font-bold text-white tabular-nums">
        {t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </span>
    </div>
  );
};

const SessionTimer = () => {
  const [s, setS] = useState(0);
  useEffect(() => { const i = setInterval(() => setS(p => p + 1), 1000); return () => clearInterval(i); }, []);
  const pad = n => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10">
      <Timer className="w-3 h-3 text-emerald-400 animate-pulse" />
      <span className="text-xs font-mono font-bold text-white tabular-nums">
        {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
      </span>
    </div>
  );
};

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 text-xs">
      {label && <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.dataKey}: <b>{typeof p.value === 'number' ? p.value.toFixed(p.value % 1 === 0 ? 0 : 1) : p.value}{p.unit || ''}</b>
        </p>
      ))}
    </div>
  );
};

const TrendBadge = ({ direction, size = 'sm' }) => {
  const cls = size === 'sm' ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1';
  if (direction === 'up') return <span className={`${cls} rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold flex items-center gap-0.5`}><ArrowUp className="w-2.5 h-2.5" />Up</span>;
  if (direction === 'down') return <span className={`${cls} rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold flex items-center gap-0.5`}><ArrowDown className="w-2.5 h-2.5" />Down</span>;
  return <span className={`${cls} rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 font-bold flex items-center gap-0.5`}><Minus className="w-2.5 h-2.5" />Stable</span>;
};

// ════════════════════════════════════════════════════════════
//  STAT CARD
// ════════════════════════════════════════════════════════════
const StatCard = ({ icon: Icon, label, value, sub, gradient, iconBg, onClick, delay = 0, spark, trend }) => {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  const mx = spark ? Math.max(...spark, 1) : 1;
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4
        transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${onClick ? 'cursor-pointer group' : ''}
        ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-2xl`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
            {trend && <TrendBadge direction={trend} />}
          </div>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white"><Cnt end={value} /></p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        {spark && spark.length > 0 && (
          <div className="flex items-end gap-px mt-2" style={{ height: 20 }}>
            {spark.map((sv, i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-all duration-700" style={{
                height: `${Math.max((sv / mx) * 100, 8)}%`,
                background: iconBg?.includes('blue') ? '#3b82f6' : iconBg?.includes('emerald') || iconBg?.includes('green') ? '#22c55e' : iconBg?.includes('purple') ? '#8b5cf6' : '#f59e0b',
                opacity: 0.25 + (i / spark.length) * 0.75,
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🚀 ADVANCED JRF PROBABILITY METER (V3)
// ════════════════════════════════════════════════════════════
const JRFProbabilityMeter = ({ data, language: l }) => {
  if (!data || (data.confidence === 'low' && data.dataPoints < 3)) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden h-full flex flex-col justify-center border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative text-center py-6">
          <Brain className="w-12 h-12 mx-auto mb-3 text-indigo-400 opacity-50" />
          <h3 className="font-bold text-lg mb-1">{l === 'hi' ? 'AI JRF संभावना इंजन' : 'AI JRF Probability Engine'}</h3>
          <p className="text-sm text-indigo-300/60 mb-4">{l === 'hi' ? 'कैलिब्रेट करने के लिए 3+ टेस्ट दें' : 'Take 3+ tests to calibrate model'}</p>
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-indigo-400">{data?.dataPoints || 0}/3 {l === 'hi' ? 'डेटा' : 'data pts'}</span>
          </div>
        </div>
      </div>
    );
  }

  const rc = { 
    safe: { text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' }, 
    moderate: { text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30' }, 
    risky: { text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' }, 
    critical: { text: 'text-red-400', badge: 'bg-red-500/20 border-red-500/30' } 
  }[data.riskLevel] || { text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30' };
  
  const rl = { safe: { en: 'Safe Zone', hi: 'सुरक्षित ज़ोन' }, moderate: { en: 'Moderate', hi: 'मध्यम' }, risky: { en: 'Risky', hi: 'जोखिम' }, critical: { en: 'Critical', hi: 'गंभीर' } };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden border border-indigo-500/20 shadow-2xl">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide uppercase">{l === 'hi' ? 'AI प्रेडिक्शन मॉडल v3' : 'AI Prediction Model v3'}</h3>
              <p className="text-[9px] text-indigo-300/70 font-mono">CONFIDENCE: {data.confScore}% ({data.confidence.toUpperCase()})</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg border ${rc.badge} flex items-center gap-1.5 shadow-inner`}>
            <CircleDot className={`w-2.5 h-2.5 ${rc.text} animate-pulse`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${rc.text}`}>{rl[data.riskLevel]?.[l] || data.riskLevel}</span>
          </div>
        </div>

        {/* Main Probability Meters */}
        <div className="flex justify-center gap-6 mb-5">
          {[{ label: 'NET', value: data.netProbability, cutoff: data.netCutoff, color: data.netProbability >= 60 ? '#22c55e' : '#3b82f6' }, 
            { label: 'JRF', value: data.jrfProbability, cutoff: data.jrfCutoff, color: data.jrfProbability >= 60 ? '#8b5cf6' : data.jrfProbability >= 40 ? '#f59e0b' : '#ef4444' }].map((m, i) => (
            <div key={i} className="relative text-center group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-xl group-hover:bg-white/10 transition" />
              <Ring pct={m.value} size={110} sw={7} color={m.color} bg="rgba(255,255,255,0.05)">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black drop-shadow-lg" style={{ color: m.color }}>{m.value}<span className="text-lg">%</span></span>
                  <span className="text-[10px] font-bold text-white/70 tracking-widest">{m.label}</span>
                </div>
              </Ring>
              <div className="mt-2 text-[9px] font-mono text-white/40 bg-white/5 rounded px-2 py-0.5 inline-block border border-white/5">
                Target: {m.cutoff}%
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/10 rounded-bl-full" />
            <p className="text-[9px] text-indigo-300/60 uppercase font-bold mb-0.5">{l === 'hi' ? 'स्थिरता' : 'Consistency'}</p>
            <p className="text-lg font-black font-mono tracking-tight">{data.consistencyScore}<span className="text-[10px] text-white/50">%</span></p>
            <p className="text-[7px] text-white/40 uppercase mt-0.5">Vol: {data.volatility}</p>
          </div>
          
          <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 rounded-bl-full" />
             <p className="text-[9px] text-indigo-300/60 uppercase font-bold mb-0.5">{l === 'hi' ? 'प्रोजेक्टेड स्कोर' : 'Proj. Score'}</p>
             <p className="text-lg font-black font-mono tracking-tight text-white">{data.predictedTotal}<span className="text-[10px] text-white/50">%</span></p>
             <p className="text-[7px] text-white/40 uppercase mt-0.5">EMA Based</p>
          </div>

          <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 backdrop-blur-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full" />
             <p className="text-[9px] text-indigo-300/60 uppercase font-bold mb-0.5">{l === 'hi' ? 'मोमेंटम' : 'Momentum'}</p>
             <p className={`text-lg font-black font-mono tracking-tight ${data.momentum > 0 ? 'text-emerald-400' : data.momentum < 0 ? 'text-red-400' : 'text-gray-400'}`}>
               {data.momentum > 0 ? '+' : ''}{data.momentum}<span className="text-[10px] opacity-50">%</span>
             </p>
             <p className="text-[7px] text-white/40 uppercase mt-0.5">Rate of Change</p>
          </div>
        </div>

        {/* Paper Splits */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl mb-4 text-[10px] font-mono">
           <div className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-blue-400"/> P1: <b className="text-white text-xs">{data.predictedP1}%</b> <TrendBadge direction={data.p1Trend} /></div>
           <div className="w-px h-4 bg-white/20"></div>
           <div className="flex items-center gap-1.5"><Target className="w-3 h-3 text-purple-400"/> P2: <b className="text-white text-xs">{data.predictedP2}%</b> <TrendBadge direction={data.p2Trend} /></div>
        </div>

        {/* AI Factors */}
        {data.factors.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[8px] text-indigo-300/50 uppercase tracking-wider font-bold mb-1">{l === 'hi' ? 'मॉडल विश्लेषण' : 'Model Output Analysis'}</p>
            {data.factors.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[9px] bg-white/5 px-2 py-1.5 rounded border border-white/5">
                {f.type === 'positive' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-red-400" />}
                <span className={f.type === 'positive' ? 'text-emerald-100/90' : 'text-red-100/90'}>{f.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🚀 EXAM COMMAND CENTER (Fixed Lock Feature)
// ════════════════════════════════════════════════════════════
const ExamCommandCenter = ({ data, examDate, setExamDate, language: l, navigate }) => {
  const [editing, setEditing] = useState(!data?.countdown?.isSet);
  const [tempDate, setTempDate] = useState(examDate || '');
  const [activeView, setActiveView] = useState('countdown');

  useEffect(() => {
    if (examDate) {
      setTempDate(examDate);
      setEditing(false);
    }
  }, [examDate]);

  const handleSave = () => { 
    if(tempDate) {
      setExamDate(tempDate); 
      setEditing(false); 
    }
  };

  if (editing || !data?.countdown?.isSet) {
    return (
      <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg h-full flex flex-col justify-center border border-pink-400/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-900/30 rounded-full blur-3xl" />
        <div className="relative text-center z-10">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-black text-lg tracking-wide uppercase mb-1">{l === 'hi' ? 'लक्ष्य लॉक करें' : 'Lock Target Date'}</h3>
          <p className="text-[11px] text-pink-100/80 mb-4 px-4 font-medium">
            {l === 'hi' ? 'अपनी परीक्षा की तारीख सेट करें। यह स्थायी रूप से लॉक हो जाएगा।' : 'Set your official exam date. It will be permanently locked into your dashboard.'}
          </p>
          
          <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 max-w-xs mx-auto">
            <label className="block text-[9px] text-left text-pink-200 uppercase font-bold mb-1.5 ml-1">Select Date</label>
            <input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 mb-3 font-mono"
              min={new Date().toISOString().split('T')[0]} />
            
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!tempDate}
                className="flex-1 px-4 py-2.5 bg-white text-pink-700 font-black text-xs uppercase tracking-wider rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" /> {l === 'hi' ? 'लॉक करें' : 'Confirm & Lock'}
              </button>
              {data?.countdown?.isSet && (
                <button onClick={() => setEditing(false)} className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { countdown, phase, milestones, pace, readiness, todayMission, riskAlerts } = data;
  const urgency = countdown.days <= 7 ? 'critical' : countdown.days <= 30 ? 'urgent' : countdown.days <= 90 ? 'moderate' : 'relaxed';
  const gradients = { critical: 'from-red-600 via-rose-700 to-red-800', urgent: 'from-orange-500 via-amber-600 to-orange-700', moderate: 'from-blue-600 via-indigo-700 to-blue-800', relaxed: 'from-emerald-600 via-green-700 to-emerald-800' };

  const phaseIcons = { Foundation: BookOpen, Practice: Dumbbell, Revision: RotateCcw, 'Mock Tests': FileText, 'Final Review': ScanEye };

  return (
    <div className={`bg-gradient-to-br ${gradients[urgency]} rounded-2xl text-white relative overflow-hidden border border-white/10 shadow-lg`}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4.5 h-4.5" />
          <span className="font-black text-xs tracking-wider uppercase">UGC NET {l === 'hi' ? 'कमांड सेंटर' : 'Command'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {['countdown', 'phases', 'mission'].map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all uppercase tracking-wide ${activeView === v ? 'bg-white text-gray-900 shadow-sm' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}>
              {v === 'countdown' ? 'Timer' : v === 'phases' ? 'Phases' : 'Mission'}
            </button>
          ))}
          <button onClick={() => setEditing(true)} className="p-1.5 rounded bg-white/10 hover:bg-red-500/50 hover:text-white text-white/50 transition-colors ml-1" title="Unlock Date">
            <Unlock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative p-4">
        {/* Countdown View */}
        {activeView === 'countdown' && (
          <>
            <div className="text-center mb-5 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
              <div className="flex items-center justify-center gap-4 relative z-10">
                {[{ v: countdown.days, l: l === 'hi' ? 'दिन' : 'DAYS' }, { v: countdown.hours, l: l === 'hi' ? 'घंटे' : 'HRS' }, { v: countdown.minutes, l: l === 'hi' ? 'मिनट' : 'MIN' }].map((t, i) => (
                  <div key={i} className="text-center bg-black/20 backdrop-blur-md rounded-2xl p-2 border border-white/10 min-w-[70px] shadow-xl">
                    <span className="text-3xl font-black font-mono tracking-tighter text-white drop-shadow-md">{t.v}</span>
                    <span className="text-[8px] text-white/60 uppercase mt-0.5 block font-bold tracking-widest">{t.l}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                 <Lock className="w-3 h-3 text-emerald-300" />
                 <p className="text-[10px] font-bold text-emerald-200 tracking-wide uppercase border-b border-emerald-300/30 pb-0.5">
                   {new Date(examDate).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                 </p>
              </div>
            </div>

            {/* Journey Progress */}
            <div className="mb-4 bg-black/10 rounded-xl p-3 border border-white/5">
              <div className="flex justify-between mb-1.5 items-end">
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">{l === 'hi' ? 'यात्रा प्रगति' : 'Journey Progress'}</span>
                <span className="text-[11px] font-black font-mono">{phase.overallProgress}%</span>
              </div>
              <div className="h-2.5 bg-black/30 rounded-full overflow-hidden shadow-inner p-0.5">
                <div className="h-full rounded-full bg-gradient-to-r from-white/30 via-white to-white transition-all duration-1000 relative" style={{ width: `${phase.overallProgress}%` }}>
                   <div className="absolute top-0 right-0 bottom-0 w-4 bg-white blur-sm opacity-50 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between mt-1.5 text-[8px] font-semibold text-white/40 uppercase">
                <span>Start</span>
                <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{phase.current?.name || 'N/A'}</span>
                <span>Exam</span>
              </div>
            </div>

            {/* Readiness + Pace */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center gap-3 backdrop-blur-sm">
                <Ring pct={readiness.overall} size={46} sw={5} color={readiness.overall >= 70 ? '#4ade80' : readiness.overall >= 50 ? '#fbbf24' : '#f87171'} bg="rgba(0,0,0,0.3)">
                  <span className="text-[10px] font-black">{readiness.overall}%</span>
                </Ring>
                <div>
                   <p className="text-[9px] font-bold text-white/60 uppercase tracking-wide mb-0.5">{l === 'hi' ? 'तैयारी' : 'Readiness'}</p>
                   <p className="text-[8px] text-white/40">AI Assessed</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10 backdrop-blur-sm relative overflow-hidden">
                <Footprints className="absolute -right-2 -bottom-2 w-12 h-12 text-white/5" />
                <div className="flex items-center gap-1.5 mb-1 relative z-10">
                  <Gauge className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">{l === 'hi' ? 'रफ्तार' : 'Pace'}</span>
                </div>
                <div className="relative z-10">
                   <p className="text-xl font-black tracking-tight">{pace.current}<span className="text-[9px] text-white/50 font-normal">/day</span></p>
                   <p className={`text-[8px] font-bold mt-0.5 ${pace.status === 'on_track' ? 'text-emerald-300' : pace.status === 'slightly_behind' ? 'text-amber-300' : 'text-red-300'}`}>
                     {l === 'hi' ? `लक्ष्य: ${pace.required}/दिन` : `Target: ${pace.required}/day`}
                   </p>
                </div>
              </div>
            </div>

            {/* Risk Alerts */}
            {riskAlerts.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {riskAlerts.slice(0, 2).map((r, i) => (
                  <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[9px] font-bold shadow-sm ${r.level === 'critical' ? 'bg-red-500/80 border border-red-400 text-white' : r.level === 'warning' ? 'bg-amber-500/80 border border-amber-400 text-white' : 'bg-black/20 border border-white/10 text-white'}`}>
                    <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${r.level === 'critical' ? 'animate-pulse text-white' : ''}`} />
                    <span>{l === 'hi' ? r.textHi : r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Phases View */}
        {activeView === 'phases' && (
          <div className="space-y-2.5">
            {phase.all.map((p, i) => {
              const PhIcon = phaseIcons[p.name] || BookOpen;
              return (
                <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${p.status === 'current' ? 'bg-black/20 border-white/30 ring-1 ring-white/20 shadow-lg' : p.status === 'completed' ? 'bg-black/10 border-white/5' : 'bg-transparent border-white/5 opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.status === 'completed' ? 'bg-emerald-500/40 text-emerald-200' : p.status === 'current' ? 'bg-white text-gray-900' : 'bg-white/10 text-white/50'}`}>
                    {p.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <PhIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black tracking-wide uppercase">{l === 'hi' ? p.nameHi : p.name}</p>
                    <p className="text-[8px] text-white/50">{l === 'hi' ? p.descHi : p.description}</p>
                    {p.status === 'current' && (
                      <div className="h-1.5 bg-black/40 rounded-full mt-1.5 overflow-hidden border border-white/10">
                        <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.max(p.progress, 5)}%` }} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] font-black shrink-0 ${p.status === 'completed' ? 'text-emerald-300' : p.status === 'current' ? 'text-white' : 'text-white/30'}`}>
                    {p.status === 'completed' ? 'DONE' : p.status === 'current' ? `${p.progress}%` : '---'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Mission View */}
        {activeView === 'mission' && (
          <div>
            <div className="bg-black/20 rounded-xl p-3 border border-white/10 mb-4">
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">{l === 'hi' ? 'आज का मिशन' : "Today's Mission"}</p>
              {todayMission.length > 0 ? (
                <div className="space-y-2">
                  {todayMission.map((m, i) => {
                    const MIcon = { ClipboardList, RefreshCw, AlertTriangle, Target }[m.icon] || Target;
                    return (
                      <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg border bg-black/30 backdrop-blur-sm ${m.priority === 'critical' ? 'border-red-400/50' : m.priority === 'high' ? 'border-amber-400/50' : 'border-white/10'}`}>
                        <MIcon className={`w-4 h-4 shrink-0 mt-0.5 ${m.priority === 'critical' ? 'text-red-400' : m.priority === 'high' ? 'text-amber-400' : 'text-white/60'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold leading-tight">{l === 'hi' ? m.taskHi : m.task}</p>
                          <p className="text-[8px] text-white/50 mt-0.5">{m.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" /><p className="text-xs font-bold">{l === 'hi' ? 'सब पूरा!' : 'All Clear!'}</p></div>
              )}
            </div>

            {/* Milestones */}
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-2 px-1">{l === 'hi' ? 'माइलस्टोन' : 'Milestones'}</p>
            <div className="grid grid-cols-2 gap-2">
              {data.milestones.slice(0, 6).map((m, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${m.completed ? 'bg-emerald-500/20 border border-emerald-400/30' : 'bg-black/20 border border-white/10'}`}>
                  {m.completed ? <CircleCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <CircleDot className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[8px] font-bold truncate uppercase ${m.completed ? 'text-emerald-100' : 'text-white/60'}`}>{l === 'hi' ? m.titleHi : m.title}</p>
                    {!m.completed && <div className="h-0.5 bg-white/10 w-full mt-1"><div className="h-full bg-white/40" style={{width: `${m.progress}%`}}></div></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  GOAL TRACKER 
// ════════════════════════════════════════════════════════════
const GoalTracker = ({ goals, completionPct, todayDetailed, yesterdayActivity, customTargets, updateCustomTargets, dayProgress, goalStreak, goalsCompleted, totalGoals, pressureMessage, todayXP, streak, language: l, navigate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const celebrating = completionPct === 100 && (todayDetailed?.count || 0) > 0;
  const iconMap = { ClipboardList, Target, TrendingUp, Clock, RefreshCw, Flame, Timer, BarChart2, Hash, Zap };
  const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
  };
  const urgC = { critical: 'bg-red-500 animate-pulse', high: 'bg-orange-500', medium: 'bg-amber-400', normal: 'bg-gray-300 dark:bg-gray-600' };
  const pmC = { celebration: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400', I: Trophy }, critical: { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-400', I: AlertTriangle }, warning: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-700 dark:text-amber-400', I: AlertCircle }, positive: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-400', I: Sparkles }, info: { bg: 'bg-gray-50 dark:bg-gray-700/30', text: 'text-gray-600 dark:text-gray-400', I: Info } };
  const dp = dayProgress || { pct: 0, remainingHours: 0, remainingMins: 0 };
  const pm = pressureMessage || { type: 'info', en: '', hi: '' };
  const pmS = pmC[pm.type] || pmC.info;
  const PMIcon = pmS.I;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden ${celebrating ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20' : ''}`}>
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow ${celebrating ? 'animate-bounce' : ''}`}>
              <Crosshair className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                {l === 'hi' ? 'आज के लक्ष्य' : "Today's Goals"}
                {celebrating && <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin" />}
              </h3>
              <p className="text-[9px] text-gray-500">{goalsCompleted}/{totalGoals} {l === 'hi' ? 'पूरे' : 'done'}
                {goalStreak > 0 && <span className="ml-1 text-amber-600 font-bold">| {goalStreak}d streak</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <Zap className="w-3 h-3 text-amber-600" /><span className="text-[9px] font-black text-amber-700 dark:text-amber-400">{todayXP} XP</span>
            </div>
            <Ring pct={completionPct} size={36} sw={3} color={completionPct === 100 ? '#22c55e' : completionPct >= 50 ? '#f59e0b' : '#ef4444'}>
              <span className="text-[7px] font-bold text-gray-600 dark:text-gray-300">{completionPct}%</span>
            </Ring>
            <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Settings className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
        {/* Day progress */}
        <div className="mb-2">
          <div className="flex justify-between mb-0.5">
            <span className="text-[8px] text-gray-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{l === 'hi' ? 'दिन' : 'Day'}</span>
            <span className={`text-[8px] font-bold ${dp.pct > 80 ? 'text-red-600 animate-pulse' : dp.pct > 50 ? 'text-amber-600' : 'text-gray-500'}`}>
              {dp.remainingHours}h {dp.remainingMins}m {l === 'hi' ? 'बाकी' : 'left'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${dp.pct}%`, background: dp.pct > 80 ? '#ef4444' : dp.pct > 50 ? '#f59e0b' : '#3b82f6' }} />
          </div>
        </div>
        {/* Today stats */}
        <div className="flex items-center gap-2 text-[8px] flex-wrap">
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
            <ClipboardList className="w-2.5 h-2.5" />{todayDetailed?.count || 0} {l === 'hi' ? 'टेस्ट' : 'tests'}
          </span>
          {(todayDetailed?.count || 0) > 0 && (<>
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 font-bold"><Target className="w-2.5 h-2.5" />{todayDetailed?.accuracy || 0}%</span>
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 font-bold"><BarChart3 className="w-2.5 h-2.5" />{todayDetailed?.avgScore || 0}%</span>
          </>)}
        </div>
      </div>
      {/* Pressure */}
      <div className={`px-4 py-2 border-b border-gray-100 dark:border-gray-700 ${pmS.bg} border-l-4 ${pm.type === 'critical' ? 'border-l-red-500' : pm.type === 'warning' ? 'border-l-amber-500' : pm.type === 'celebration' ? 'border-l-emerald-500' : 'border-l-blue-500'}`}>
        <div className="flex items-center gap-2">
          <PMIcon className={`w-3.5 h-3.5 ${pmS.text} ${pm.type === 'critical' ? 'animate-pulse' : ''}`} />
          <p className={`text-[10px] font-semibold ${pmS.text}`}>{l === 'hi' ? pm.hi : pm.en}</p>
        </div>
      </div>
      {/* Settings */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2">
          {[{ key: 'dailyTests', label: l === 'hi' ? 'दैनिक टेस्ट' : 'Tests/Day', min: 1, max: 20 }, { key: 'dailyAccuracy', label: l === 'hi' ? 'सटीकता' : 'Accuracy %', min: 30, max: 100 }, { key: 'targetScore', label: l === 'hi' ? 'लक्ष्य' : 'Target %', min: 40, max: 100 }].map(s => (
            <div key={s.key}>
              <label className="text-[9px] text-gray-500">{s.label}</label>
              <input type="number" value={customTargets[s.key]} min={s.min} max={s.max}
                onChange={e => updateCustomTargets({ ...customTargets, [s.key]: parseInt(e.target.value) || s.min })}
                className="w-full px-2 py-1 text-xs border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white" />
            </div>
          ))}
        </div>
      )}
      {/* Goals */}
      <div className="p-3 space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar">
        {goals.map((goal, i) => {
          const Icon = iconMap[goal.icon] || Target;
          const cc = colorMap[goal.color] || colorMap.blue;
          const pct = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
          const done = goal.current >= goal.target;
          return (
            <div key={goal.id || i} className={`relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${done ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30' : goal.urgency === 'critical' ? 'bg-red-50/30 border-red-200 dark:bg-red-900/5 dark:border-red-900/30' : 'bg-gray-50/50 border-gray-100 dark:bg-gray-700/20 dark:border-gray-700/50'}`}>
              {!done && goal.urgency !== 'normal' && <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${urgC[goal.urgency]}`} />}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-100 dark:bg-emerald-900/30' : cc.bg}`}>
                {done ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Icon className={`w-4 h-4 ${cc.text}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-[11px] font-semibold pr-4 leading-snug ${done ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-gray-900 dark:text-white'}`}>{l === 'hi' ? goal.titleHi : goal.title}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[9px] font-black ${done ? 'text-emerald-600' : cc.text}`}>{goal.current}{goal.type === 'percentage' ? '%' : ''}/{goal.target}{goal.type === 'percentage' ? '%' : ''}</span>
                    {done && <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">+{goal.xp}XP</span>}
                  </div>
                </div>
                <p className={`text-[8px] mb-1 ${done ? 'text-emerald-600/60' : 'text-gray-500'}`}>{l === 'hi' ? goal.descriptionHi : goal.description}</p>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${done ? 'bg-emerald-500' : cc.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between shrink-0">
        <span className="text-[8px] text-gray-400">{l === 'hi' ? 'गोल स्ट्रीक' : 'Goal Streak'}: <b className="text-amber-600">{goalStreak}d</b> | XP: <b className="text-indigo-600">{todayXP}</b></span>
        {(todayDetailed?.count || 0) === 0 && (
          <button onClick={() => navigate?.('/tests')} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-bold rounded-lg">
            <Play className="w-3 h-3" />{l === 'hi' ? 'शुरू करो!' : 'Start!'}
          </button>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  SMART REVISION HUB
// ════════════════════════════════════════════════════════════
const SmartRevisionHub = ({ data, language: l, navigate }) => {
  const [tab, setTab] = useState('due');
  if (!data || data.stats.totalTests === 0) return null;

  const catColors = { critical: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle, badge: 'bg-red-500' }, weak: { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', icon: TrendingDown, badge: 'bg-orange-500' }, improving: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', icon: TrendingUp, badge: 'bg-blue-500' }, learning: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', icon: BookOpen, badge: 'bg-amber-500' }, mastered: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle, badge: 'bg-emerald-500' } };

  const tabData = tab === 'due' ? data.todayDue : tab === 'critical' ? data.critical : tab === 'weak' ? data.weak : tab === 'improving' ? [...data.improving, ...data.mastered] : data.all;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow">
              <RotateCcw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'स्मार्ट रिवीज़न' : 'Smart Revision Hub'}</h3>
              <p className="text-[9px] text-gray-500">{l === 'hi' ? 'स्पेस्ड रिपिटिशन' : 'Spaced Repetition System'}</p>
            </div>
          </div>
          {data.marathonQueue.length > 0 && (
            <button onClick={() => navigate?.(`/test/${data.marathonQueue[0].testId}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[9px] font-bold rounded-lg hover:shadow-lg">
              <Rocket className="w-3 h-3" />{l === 'hi' ? 'मैराथन' : 'Marathon'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[8px]">
          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">{data.stats.critical} {l === 'hi' ? 'गंभीर' : 'critical'}</span>
          <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold">{data.stats.weak} {l === 'hi' ? 'कमजोर' : 'weak'}</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">{data.stats.overdue} {l === 'hi' ? 'देरी' : 'overdue'}</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">{data.stats.mastered} ✓</span>
          {data.stats.avgImprovement > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">+{data.stats.avgImprovement}% avg imp</span>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0">
        {[{ id: 'due', label: l === 'hi' ? 'आज' : 'Due', count: data.todayDue.length, color: 'text-red-600' }, { id: 'critical', label: l === 'hi' ? 'गंभीर' : 'Critical', count: data.critical.length }, { id: 'weak', label: l === 'hi' ? 'कमजोर' : 'Weak', count: data.weak.length }, { id: 'improving', label: l === 'hi' ? 'सुधार' : 'Good', count: data.improving.length + data.mastered.length }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 px-2 py-2 text-[10px] font-bold transition-all ${tab === t.id ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-gray-500'}`}>
            {t.label} <span className="text-[8px] ml-0.5 px-1 rounded-full bg-gray-100 dark:bg-gray-700">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="p-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar max-h-[500px]">
        {tabData.length === 0 ? (
          <div className="text-center py-6"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-200 dark:text-emerald-800" /><p className="text-xs text-gray-400">{l === 'hi' ? 'कोई नहीं!' : 'None!'}</p></div>
        ) : tabData.slice(0, 15).map((item, i) => {
          const cc = catColors[item.category] || catColors.learning;
          const CIcon = cc.icon;
          const trendIcon = item.trend === 'up' ? TrendingUp : item.trend === 'down' ? TrendingDown : Minus;
          return (
            <div key={i} className={`group flex items-center gap-3 p-2.5 rounded-xl border ${cc.border} ${cc.bg} hover:shadow-md cursor-pointer transition-all`}
              onClick={() => navigate?.(`/results/${item.lastAttempt?._id}`)}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-2 h-2 rounded-full ${item.isOverdue ? 'bg-red-500 animate-pulse' : cc.badge}`} />
                <span className="text-[7px] text-gray-500 font-semibold">{item.bestScore}%</span>
              </div>
              <div className="shrink-0">
                <Ring pct={item.bestScore} size={38} sw={4} color={item.bestScore >= 70 ? '#22c55e' : item.bestScore >= 50 ? '#f59e0b' : '#ef4444'}>
                  <span className="text-[8px] font-bold text-gray-700 dark:text-gray-300">{item.bestScore}</span>
                </Ring>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5 mb-1">
                  <h4 className="text-[11px] font-bold text-gray-900 dark:text-white leading-snug">{item.title}</h4>
                  {item.paper && <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[7px] font-black ${item.paper === 'paper1' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>{item.paper === 'paper1' ? 'P1' : 'P2'}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[8px] text-gray-500">
                  <span className="font-medium">{item.daysSinceLastAttempt}d ago</span>
                  <span>•</span>
                  <span>{item.attempts} att</span>
                  <span>•</span>
                  <span className={`font-bold ${cc.text}`}>{item.srsLabel}</span>
                  {item.isOverdue && (
                    <>
                      <span>•</span>
                      <span className="text-red-500 font-bold">{item.overdueBy}d overdue!</span>
                    </>
                  )}
                  {item.improvement !== 0 && (
                    <>
                      <span>•</span>
                      <span className={`flex items-center gap-0.5 font-bold ${item.improvement > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {React.createElement(trendIcon, { className: 'w-2.5 h-2.5' })}
                        {item.improvement > 0 ? '+' : ''}{item.improvement}%
                      </span>
                    </>
                  )}
                </div>
                {item.allScores.length > 1 && (
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {item.allScores.slice(-5).map((s, si) => (
                      <div key={si} className={`h-1.5 rounded-full ${s.score >= 70 ? 'bg-emerald-400' : s.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${Math.max(s.score / 5, 4)}px` }} />
                    ))}
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate?.(`/test/${item.testId}`); }}
                className="shrink-0 p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 transition hover:scale-105">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
        <div className="flex items-center justify-between text-[9px] text-gray-500">
          <span>{l === 'hi' ? 'आज' : 'Today'}: <b className="text-red-600 dark:text-red-400">{data.stats.dueToday}</b> | {l === 'hi' ? 'इस हफ्ते' : 'Week'}: <b className="text-amber-600 dark:text-amber-400">{data.stats.dueThisWeek}</b></span>
          <span className="font-semibold">{l === 'hi' ? 'कुल रिवीज़न' : 'Total Revisions'}: {data.stats.totalRevisions}</span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  WEEKLY CHAPTER MATRIX
// ════════════════════════════════════════════════════════════
const WeeklyChapterMatrix = ({ data, language: l }) => {
  const [weekIdx, setWeekIdx] = useState(0);
  if (!data || !data.currentWeek) return null;

  const weeks = [data.currentWeek, ...(data.weeks || []).filter(w => w.weekKey !== data.currentWeek.weekKey)].slice(0, 6);
  const week = weeks[weekIdx] || data.currentWeek;
  const comp = weekIdx === 0 ? data.comparison : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
              <Waypoints className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'साप्ताहिक अध्याय मैट्रिक्स' : 'Weekly Chapter Matrix'}</h3>
              <p className="text-[9px] text-gray-500">{week.dateRange}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekIdx(Math.min(weeks.length - 1, weekIdx + 1))} disabled={weekIdx >= weeks.length - 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronLeft className="w-3.5 h-3.5 text-gray-500" /></button>
            <button onClick={() => setWeekIdx(0)} className={`px-2 py-0.5 rounded text-[9px] font-bold ${weekIdx === 0 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {l === 'hi' ? 'इस हफ्ते' : 'This Week'}
            </button>
            <button onClick={() => setWeekIdx(Math.max(0, weekIdx - 1))} disabled={weekIdx <= 0}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[9px] flex-wrap">
          <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold">{week.stats.totalTests} {l === 'hi' ? 'टेस्ट' : 'tests'}</span>
          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold">{week.stats.chaptersCovered}/{week.stats.totalChapters} {l === 'hi' ? 'अध्याय' : 'chapters'}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">{week.stats.avgScore}% avg</span>
          {comp && (
            <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-0.5 ${comp.scoreChange > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : comp.scoreChange < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
              {comp.scoreChange > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : comp.scoreChange < 0 ? <ArrowDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
              {comp.scoreChange > 0 ? '+' : ''}{comp.scoreChange}% vs {l === 'hi' ? 'पिछला' : 'last'}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar max-h-[450px]">
        {week.chapters.length > 0 ? (
          <>
            {week.chapters.map((ch, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
              const change = ch.changeVsLastWeek;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 hover:shadow-md transition-all">
                  <span className="text-sm w-6 text-center shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 mb-1">
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-snug">{ch.name}</p>
                      <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[7px] font-black ${ch.paper === 'paper1' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>{ch.paper === 'paper1' ? 'P1' : 'P2'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ch.avgScore}%`, background: ch.avgScore >= 70 ? '#22c55e' : ch.avgScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] text-gray-500">
                      <span className="font-medium">{ch.testsCount} tests</span>
                      <span>•</span>
                      <span>✓{ch.correct} ✗{ch.wrong}</span>
                      {change !== null && change !== undefined && (
                        <>
                          <span>•</span>
                          <span className={`font-bold flex items-center gap-0.5 ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {change > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : change < 0 ? <ArrowDown className="w-2.5 h-2.5" /> : null}
                            {change > 0 ? '+' : ''}{change}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base font-black ${ch.avgScore >= 70 ? 'text-emerald-600' : ch.avgScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{ch.avgScore}%</p>
                    <p className="text-[7px] text-gray-400 font-semibold">{l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'}: {ch.bestScore}%</p>
                  </div>
                </div>
              );
            })}

            {week.uncovered.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[9px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" />{l === 'hi' ? 'इस हफ्ते नहीं' : 'Not Covered'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {week.uncovered.slice(0, 8).map((u, i) => (
                    <span key={i} className={`text-[8px] px-2 py-1 rounded-md border ${u.daysSince !== null && u.daysSince > 14 ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400' : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700/30 dark:border-gray-700 dark:text-gray-400'}`}>
                      {u.name} {u.daysSince !== null ? `(${u.daysSince}d)` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8"><Inbox className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" /><p className="text-xs text-gray-400">{l === 'hi' ? 'इस हफ्ते कोई टेस्ट नहीं' : 'No tests this week'}</p></div>
        )}
      </div>

      {data.insights.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-1.5 shrink-0">
          {data.insights.slice(0, 3).map((ins, i) => (
            <p key={i} className={`text-[9px] flex items-start gap-1.5 ${ins.type === 'critical' ? 'text-red-600 font-bold' : ins.type === 'warning' ? 'text-amber-600' : ins.type === 'positive' ? 'text-emerald-600' : 'text-gray-500'}`}>
              <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="leading-snug">{l === 'hi' ? ins.textHi : ins.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  DAILY REPORT CARD
// ════════════════════════════════════════════════════════════
const DailyReportCard = ({ data, language: l }) => {
  if (!data) return null;
  const gc = { emerald: 'from-emerald-500 to-green-600', blue: 'from-blue-500 to-indigo-600', amber: 'from-amber-500 to-orange-600', red: 'from-red-500 to-rose-600' };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className={`bg-gradient-to-r ${gc[data.gradeColor] || gc.blue} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/60 uppercase">{l === 'hi' ? 'आज का रिपोर्ट कार्ड' : "Today's Report Card"}</p>
            <p className="text-[10px] text-white/40">{new Date().toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black">{data.grade}</p>
            <div className="flex gap-0.5 mt-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-2.5 h-2.5 ${i <= data.rating ? 'text-yellow-300 fill-yellow-300' : 'text-white/20'}`} />)}</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { l: l === 'hi' ? 'टेस्ट' : 'Tests', v: data.stats.tests, i: ClipboardList, c: 'text-blue-500' },
            { l: l === 'hi' ? 'सटीकता' : 'Accuracy', v: `${data.stats.accuracy}%`, i: Target, c: 'text-emerald-500' },
            { l: l === 'hi' ? 'औसत' : 'Avg', v: `${data.stats.avgScore}%`, i: BarChart3, c: 'text-purple-500' },
            { l: l === 'hi' ? 'समय' : 'Time', v: fmtTime(data.stats.time), i: Clock, c: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <s.i className={`w-3 h-3 mx-auto mb-0.5 ${s.c}`} />
              <p className="text-xs font-black text-gray-900 dark:text-white">{s.v}</p>
              <p className="text-[7px] text-gray-400 uppercase">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3 text-[9px]">
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold"><CheckCircle className="w-2.5 h-2.5" />{data.stats.correct}</span>
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold"><XCircle className="w-2.5 h-2.5" />{data.stats.wrong}</span>
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold"><SkipForward className="w-2.5 h-2.5" />{data.stats.skipped}</span>
          {data.comparison.direction !== 'stable' && (
            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold ${data.comparison.direction === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {data.comparison.direction === 'up' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              vs {l === 'hi' ? 'कल' : 'yday'}
            </span>
          )}
        </div>

        {data.highlights.length > 0 && (
          <div className="space-y-1 mb-3">
            {data.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px]">
                {h.type === 'achievement' ? <Star className="w-3 h-3 text-amber-500" /> : h.type === 'improvement' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <Sparkles className="w-3 h-3 text-blue-500" />}
                <span className="text-gray-700 dark:text-gray-300">{l === 'hi' ? h.textHi : h.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-2.5 border border-indigo-200/50 dark:border-indigo-800/30">
          <p className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
            <Crosshair className="w-3 h-3" />{l === 'hi' ? 'कल का फोकस' : "Tomorrow's Focus"}
          </p>
          <p className="text-[10px] font-semibold text-indigo-900 dark:text-indigo-200 mt-0.5 leading-snug">{data.tomorrowFocus.unit}</p>
          <p className="text-[8px] text-indigo-500">{l === 'hi' ? data.tomorrowFocus.reasonHi : data.tomorrowFocus.reason}</p>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  MISTAKE JOURNAL
// ════════════════════════════════════════════════════════════
const MistakeJournal = ({ data, language: l }) => {
  if (!data || data.totalMistakes === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow">
            <NotebookPen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गलती जर्नल' : 'Mistake Journal'}</h3>
            <p className="text-[9px] text-gray-500">{data.totalMistakes} {l === 'hi' ? 'गलतियां' : 'mistakes'} | {data.overallErrorRate}% {l === 'hi' ? 'त्रुटि दर' : 'error rate'}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {data.trend.length > 2 && (
          <div className="mb-4">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">{l === 'hi' ? 'साप्ताहिक त्रुटि ट्रेंड' : 'Weekly Error Trend'}</p>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <defs><linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 8 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 8 }} stroke="#94a3b8" />
                  <Tooltip content={<CTooltip />} />
                  <Area type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} fill="url(#errGrad)" dot={{ r: 2, fill: '#ef4444' }} name="Error %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {data.mostRepeated.length > 0 && (
          <div className="mb-3">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
              <Repeat className="w-3 h-3 text-red-500" />{l === 'hi' ? 'बार-बार गलतियां' : 'Repeated Mistakes'}
            </p>
            <div className="space-y-1">
              {data.mostRepeated.slice(0, 5).map((m, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20">
                  <span className="text-[9px] font-bold text-red-600 w-5 text-center shrink-0">{m.wrong}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-900 dark:text-white leading-snug">{m.unit}</p>
                    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${m.errorRate}%` }} />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-red-600 shrink-0">{m.errorRate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.suggestions.length > 0 && (
          <div className="space-y-1">
            {data.suggestions.map((s, i) => (
              <div key={i} className={`flex items-start gap-1.5 text-[9px] p-1.5 rounded-lg ${s.priority === 'critical' ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400' : s.priority === 'high' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
                <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="leading-snug">{l === 'hi' ? s.textHi : s.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  SYLLABUS COVERAGE MAP
// ═══════════════════════════════════════════════════════════
const SyllabusCoverageMap = ({ coverage, language: l }) => {
  const [tab, setTab] = useState('paper1');
  const data = tab === 'paper1' ? coverage.paper1 : coverage.paper2;
  const summary = tab === 'paper1' ? coverage.paper1Summary : coverage.paper2Summary;
  const lvl = { mastered: { en: 'Mastered', hi: 'माहिर', color: 'bg-emerald-500', border: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10' }, learning: { en: 'Learning', hi: 'सीख रहे', color: 'bg-blue-500', border: 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10' }, in_progress: { en: 'Progress', hi: 'प्रगति', color: 'bg-amber-500', border: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10' }, weak: { en: 'Weak', hi: 'कमजोर', color: 'bg-red-500', border: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10' }, not_started: { en: 'Not Started', hi: 'शुरू नहीं', color: 'bg-gray-400', border: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/20' }, no_tests: { en: 'No Tests', hi: 'टेस्ट नहीं', color: 'bg-gray-300', border: 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30' } };
  const smk = { mastered: 'mastered', learning: 'learning', in_progress: 'inProgress', weak: 'weak', not_started: 'notStarted', no_tests: 'noTests' };
  const ttl = { dpp: 'DPP', topic_test: 'Topic', chapter_test: 'Chapter', unit_test: 'Unit', practice: 'Practice', pyq_year: 'PYQ', full_mock_p1: 'Mock', full_mock_p2: 'Mock', full_mock_combined: 'Mock' };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow"><Grid3X3 className="w-4 h-4 text-white" /></div>
            <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'सिलेबस कवरेज' : 'Syllabus Coverage'}</h3><p className="text-[9px] text-gray-500">{l === 'hi' ? 'टेस्ट प्रगति' : 'Test progress'}</p></div>
          </div>
          <Ring pct={coverage.overallPct} size={40} sw={3.5} color="#14b8a6"><span className="text-[8px] font-bold">{coverage.overallPct}%</span></Ring>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {['paper1', 'paper2'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${tab === t ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              {t === 'paper1' ? 'Paper 1' : 'Paper 2'} <span className={`ml-1 text-[8px] px-1 rounded-full ${tab === t ? 'bg-teal-100 text-teal-700' : 'bg-gray-200'}`}>{(tab === t ? summary : (t === 'paper1' ? coverage.paper1Summary : coverage.paper2Summary)).overallPct}%</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-1.5 bg-gray-50/50 dark:bg-gray-700/20 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
        {Object.entries(lvl).map(([k, v]) => (<div key={k} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-sm ${v.color}`} /><span className="text-[8px] text-gray-500">{v[l] || v.en}: {summary[smk[k]] || 0}</span></div>))}
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {data.map((u, i) => {
          const ll = lvl[u.level] || lvl.not_started;
          return (
            <div key={i} className={`p-2.5 rounded-xl border-2 transition-all hover:shadow-lg ${ll.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-bold text-gray-500 uppercase">{u.unit}</span>
                {u.accuracy > 0 && <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full ${ll.color} text-white`}>{u.accuracy}%</span>}
              </div>
              <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 leading-snug mb-1">{u.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-[8px] text-gray-500 mb-1">
                <span><ClipboardList className="w-2.5 h-2.5 inline" />{u.attemptedCount}/{u.totalTests}</span>
                <span>{u.totalAttempts || 0} {l === 'hi' ? 'प्रयास' : 'attempts'}</span>
                {u.bestScore > 0 && <span><Trophy className="w-2.5 h-2.5 inline text-amber-500" />{u.bestScore}%</span>}
              </div>
              {u.testTypeBreakdown && Object.keys(u.testTypeBreakdown).length > 0 && (
                <div className="flex flex-wrap gap-0.5 mb-1">
                  {Object.entries(u.testTypeBreakdown).map(([ty, td]) => (
                    <span key={ty} className={`text-[6px] font-bold px-1 py-0.5 rounded ${td.attempted >= td.total ? 'bg-emerald-100 text-emerald-700' : td.attempted > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{ttl[ty] || ty}: {td.attempted}/{td.total}</span>
                  ))}
                </div>
              )}
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5">
                <div className="h-full rounded-full transition-all" style={{ width: `${u.totalTests > 0 ? Math.round((u.attemptedCount / u.totalTests) * 100) : 0}%`, backgroundColor: u.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  SPEED, RECOMMENDATIONS, SCORES, RECORDS, TIME, HEATMAP,
//  WEEKLY, TRENDS, ERROR, RADAR, ATTENTION, PENDING,
//  ACTIVITY, PAPER, ACHIEVEMENTS, STREAK, QUOTE, ACTIONS
// ════════════════════════════════════════════════════════════
const SpeedAnalyticsCard = ({ data, language: l }) => {
  if (!data || data.speedTrend.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow"><Zap className="w-4 h-4 text-white" /></div><div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गति विश्लेषण' : 'Speed Analytics'}</h3></div></div>
        <div className="text-right"><p className="text-lg font-black text-gray-900 dark:text-white">{data.avgTimePerQ}s</p><p className="text-[8px] text-gray-400">avg/Q</p></div>
      </div>
      <div className="p-4">
        <div style={{ height: 140 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.speedTrend} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" /><Tooltip content={<CTooltip />} /><Line type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} name="Speed(s)" /><Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="Acc%" /></LineChart></ResponsiveContainer></div>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {[{ l: l === 'hi' ? 'तेज' : 'Fast', v: `${data.fastestTest?.avgTime || 0}s`, c: 'text-emerald-500' }, { l: 'Avg', v: `${data.avgTimePerQ}s`, c: 'text-blue-500' }, { l: l === 'hi' ? 'धीमा' : 'Slow', v: `${data.slowestTest?.avgTime || 0}s`, c: 'text-amber-500' }].map((m, i) => (
            <div key={i} className="text-center"><p className={`text-xs font-bold ${m.c}`}>{m.v}</p><p className="text-[7px] text-gray-400 uppercase">{m.l}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StudyRecommendations = ({ recommendations, language: l }) => {
  if (!recommendations?.length) return null;
  const iconMap = { AlertTriangle, BookOpen, Target, TrendingDown, Clock, Flame, BarChart2, Zap, Lightbulb };
  const colorBg = { red: 'from-red-500 to-rose-600', orange: 'from-orange-500 to-amber-600', blue: 'from-blue-500 to-indigo-600', purple: 'from-purple-500 to-violet-600', amber: 'from-amber-500 to-yellow-600', cyan: 'from-cyan-500 to-teal-600' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow"><Lightbulb className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'सुझाव' : 'Recommendations'}</h3></div>
      <div className="p-3 space-y-1.5">
        {recommendations.map((r, i) => { const I = iconMap[r.icon] || Lightbulb; return (
          <div key={i} className="flex items-start gap-2 p-2 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colorBg[r.color] || colorBg.blue} flex items-center justify-center shadow-sm shrink-0 mt-0.5`}><I className="w-3.5 h-3.5 text-white" /></div>
            <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug">{l === 'hi' ? r.titleHi : r.title}</p><p className="text-[9px] text-gray-500 mt-0.5">{l === 'hi' ? r.detailHi : r.detail}</p></div>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${r.priority === 'critical' ? 'bg-red-100 text-red-600' : r.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{r.priority}</span>
          </div>
        ); })}
      </div>
    </div>
  );
};

const TestScoreRankingCard = ({ ranking, language: l, navigate }) => {
  if (!ranking || ranking.length === 0) return null;

  const catColors = { 
    'Critical': { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-500' }, 
    'Weak': { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-500' }, 
    'Good': { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-500' }, 
    'Mastered': { bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-500' },
    'Not Attempted': { bg: 'bg-gray-50 dark:bg-gray-800/50', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-500 dark:text-gray-400', badge: 'bg-gray-400' }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[400px] max-h-[650px]">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center shadow">
            <ListOrdered className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'स्मार्ट टेस्ट रैंकिंग' : 'Smart Test Ranking'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'कमजोर से मजबूत (सभी टेस्ट)' : 'Weakest to Strongest (All Tests)'}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {ranking.length} {l === 'hi' ? 'टेस्ट' : 'Tests'}
        </span>
      </div>
      
      <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
        {ranking.map((t, i) => {
          const cc = catColors[t.category] || catColors['Not Attempted'];
          const scoreColor = t.bestScore >= 80 ? '#22c55e' : t.bestScore >= 60 ? '#3b82f6' : t.bestScore >= 40 ? '#f59e0b' : t.attempts > 0 ? '#ef4444' : '#9ca3af';

          return (
            <div key={t.testId || i} className={`group flex items-center gap-3 p-2.5 rounded-xl border ${cc.border} ${cc.bg} hover:shadow-md transition-all`}>
              
              {/* Left: Score Ring */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                 <Ring pct={t.attempts > 0 ? t.bestScore : 0} size={38} sw={4} color={scoreColor}>
                    <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300">
                        {t.attempts > 0 ? `${t.bestScore}%` : '--'}
                    </span>
                 </Ring>
                 <span className="text-[7px] text-gray-500 font-semibold">#{i + 1} Rank</span>
              </div>

              {/* Middle: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5 mb-1">
                  <h4 className="text-[11px] font-bold text-gray-900 dark:text-white leading-snug">{t.title}</h4>
                  {t.paper && (
                      <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[7px] font-black ${t.paper === 'paper1' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                          {t.paper === 'paper1' ? 'P1' : 'P2'}
                      </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] text-gray-500 mb-1.5">
                    {t.unit && <span className="font-medium text-gray-600 dark:text-gray-400 break-words">{t.unit}</span>}
                    {t.unit && <span>•</span>}
                    <span className="shrink-0">{t.totalQuestions} Qs</span>
                    <span>•</span>
                    <span className="shrink-0">{t.attempts} {l === 'hi' ? 'प्रयास' : 'att'}</span>
                    {t.attempts > 0 && (
                        <>
                            <span>•</span>
                            <span className="font-semibold shrink-0">Avg: {t.avgScore}%</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-md ${cc.bg} ${cc.text} border ${cc.border}`}>
                        {l === 'hi' ? (t.category === 'Critical' ? 'गंभीर' : t.category === 'Weak' ? 'कमजोर' : t.category === 'Good' ? 'अच्छा' : t.category === 'Mastered' ? 'माहिर' : 'शुरू नहीं किया') : t.category}
                    </span>
                </div>
              </div>

              {/* Right: Action Button */}
              <button
                onClick={() => t.testId && navigate?.(`/test/${t.testId}`)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold text-white shadow-sm transition-all hover:scale-105 disabled:opacity-40 ${
                    t.attempts === 0 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                        : t.bestScore < 60 
                            ? 'bg-gradient-to-r from-orange-500 to-red-600'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                }`}
                disabled={!t.testId}
              >
                {t.attempts === 0 ? (l === 'hi' ? 'शुरू करें' : 'Start') : (l === 'hi' ? 'दोबारा दें' : 'Retry')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScoreDistributionCard = ({ data, language: l }) => {
  if (!data?.length) return null;
  const mx = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow"><BarChart2 className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'स्कोर वितरण' : 'Score Distribution'}</h3></div>
      <div className="flex items-end gap-2" style={{ height: 80 }}>
        {data.map((d, i) => (<div key={i} className="flex-1 flex flex-col items-center"><span className="text-[8px] font-bold text-gray-600 dark:text-gray-300 mb-1">{d.count}</span><div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max((d.count / mx) * 100, 5)}%`, backgroundColor: d.color }} /><span className="text-[8px] text-gray-400 mt-1">{d.range}%</span></div>))}
      </div>
    </div>
  );
};

const PersonalRecords = ({ records, language: l }) => {
  if (!records?.highestScore) return null;
  const items = [
    { icon: Trophy, label: l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', value: `${records.highestScore?.pct || 0}%`, sub: records.highestScore?.title, color: 'from-amber-500 to-yellow-600' },
    { icon: Target, label: l === 'hi' ? 'सटीकता' : 'Accuracy', value: `${records.bestAccuracy?.accuracy || 0}%`, color: 'from-emerald-500 to-green-600' },
    { icon: Flame, label: l === 'hi' ? 'स्ट्रीक' : 'Streak', value: `${records.longestStreak || 0}d`, sub: `Now: ${records.currentStreak}d`, color: 'from-orange-500 to-red-600' },
    { icon: Calendar, label: l === 'hi' ? 'दिन' : 'Best Day', value: records.bestDay?.count || 0, color: 'from-blue-500 to-indigo-600' },
    { icon: Clock, label: l === 'hi' ? 'समय' : 'Time', value: fmtTime(records.totalStudyTime || 0), color: 'from-purple-500 to-violet-600' },
  ];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow"><Crown className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'रिकॉर्ड' : 'Records'}</h3></div>
      <div className="grid grid-cols-5 gap-2">
        {items.map((it, i) => (<div key={i} className="text-center p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700"><div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${it.color} flex items-center justify-center mx-auto mb-1`}><it.icon className="w-3 h-3 text-white" /></div><p className="text-xs font-black text-gray-900 dark:text-white">{it.value}</p><p className="text-[7px] text-gray-400">{it.label}</p></div>))}
      </div>
    </div>
  );
};

const TimeOfDayCard = ({ data, language: l }) => {
  if (!data?.bestPeriod) return null;
  const pI = { Sun, Coffee, Sunset, Moon };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow"><Clock className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'समय विश्लेषण' : 'Best Study Time'}</h3></div>
      <div className="grid grid-cols-4 gap-1.5">
        {data.periodData.map((p, i) => { const PI = pI[p.icon] || Sun; const iB = p.name === data.bestPeriod?.name; return (
          <div key={i} className={`text-center p-2 rounded-xl border ${iB ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20 ring-1 ring-indigo-200' : 'border-gray-100 dark:border-gray-700'}`}>
            <PI className={`w-4 h-4 mx-auto mb-1 ${iB ? 'text-indigo-600' : 'text-gray-400'}`} /><p className={`text-xs font-bold ${iB ? 'text-indigo-700' : 'text-gray-700 dark:text-gray-300'}`}>{p.avgScore}%</p><p className="text-[7px] text-gray-400">{l === 'hi' ? p.nameHi : p.name}</p>{iB && <span className="text-[6px] font-bold text-indigo-600">BEST</span>}
          </div>
        ); })}
      </div>
    </div>
  );
};

const ActivityHeatmap = ({ activityMap: am, language: l }) => {
  const [hov, setHov] = useState(null);
  const days = useMemo(() => { const r = []; const t = new Date(); for (let i = 89; i >= 0; i--) { const d = new Date(t); d.setDate(d.getDate() - i); const k = d.toISOString().split('T')[0]; const data = am[k]; r.push({ date: k, day: d.getDate(), dayOfWeek: d.getDay(), count: data?.count || 0, avgScore: data?.avgScore || 0 }); } return r; }, [am]);
  const mx = Math.max(...days.map(d => d.count), 1);
  const gc = (c) => c === 0 ? 'bg-gray-100 dark:bg-gray-800' : c / mx > 0.75 ? 'bg-emerald-600' : c / mx > 0.5 ? 'bg-emerald-500' : c / mx > 0.25 ? 'bg-emerald-400' : 'bg-emerald-200 dark:bg-emerald-800';
  const weeks = []; let cw = [];
  days.forEach((d, i) => { cw.push(d); if (d.dayOfWeek === 6 || i === days.length - 1) { weeks.push([...cw]); cw = []; } });
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow"><Calendar className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गतिविधि' : 'Activity'}</h3></div><div className="flex items-center gap-0.5"><span className="text-[7px] text-gray-400 mr-1">Less</span>{['bg-gray-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600'].map((c, i) => <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />)}<span className="text-[7px] text-gray-400 ml-1">More</span></div></div>
      <div className="flex gap-0.5 overflow-x-auto pb-1">{weeks.map((w, wi) => (<div key={wi} className="flex flex-col gap-0.5">{w.map((d, di) => (<div key={di} className="relative" onMouseEnter={() => setHov(d)} onMouseLeave={() => setHov(null)}><div className={`w-3 h-3 rounded-sm ${gc(d.count)} hover:ring-1 hover:ring-gray-400 cursor-pointer`} />{hov?.date === d.date && <div className="absolute z-50 bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-2 py-1 rounded-lg shadow-xl whitespace-nowrap"><p className="font-bold">{new Date(d.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p><p>{d.count} tests {d.count > 0 ? `| ${d.avgScore}%` : ''}</p></div>}</div>))}</div>))}</div>
    </div>
  );
};

const WeeklyComparison = ({ data, language: l }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
    <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow"><Activity className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'साप्ताहिक' : 'Weekly'}</h3></div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-200/50"><p className="text-[9px] font-bold text-indigo-600 uppercase mb-1">{l === 'hi' ? 'इस हफ्ते' : 'This Week'}</p><p className="text-2xl font-black text-indigo-900 dark:text-indigo-200">{data.thisWeek.tests}</p><p className="text-[9px] text-indigo-500">{data.thisWeek.avgScore}% avg</p></div>
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{l === 'hi' ? 'पिछला' : 'Last Week'}</p><p className="text-2xl font-black text-gray-700 dark:text-gray-300">{data.lastWeek.tests}</p><p className="text-[9px] text-gray-400">{data.lastWeek.avgScore}% avg</p></div>
    </div>
    <div className="mt-2 flex items-center justify-center gap-2">
      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${data.change > 0 ? 'bg-emerald-100 text-emerald-700' : data.change < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{data.change > 0 ? <ArrowUp className="w-3 h-3" /> : data.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}{Math.abs(data.change)} tests</span>
      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${data.scoreChange > 0 ? 'bg-emerald-100 text-emerald-700' : data.scoreChange < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>{data.scoreChange > 0 ? '+' : ''}{data.scoreChange}%</span>
    </div>
  </div>
);

const PaperTrendCard = ({ title, icon: Icon, color, data, trend, predicted, avgScore, accuracy, language: l }) => {
  const cM = { blue: { stroke: '#3b82f6', grad: 'from-blue-600 to-cyan-600', border: 'border-blue-200/50 dark:border-blue-800/30', light: 'bg-blue-50 dark:bg-blue-900/10' }, purple: { stroke: '#8b5cf6', grad: 'from-purple-600 to-violet-600', border: 'border-purple-200/50 dark:border-purple-800/30', light: 'bg-purple-50 dark:bg-purple-900/10' } };
  const c = cM[color] || cM.blue;
  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;
  const best = data.length > 0 ? Math.max(...data.map(d => d.score)) : 0;
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.border} overflow-hidden`}>
      <div className={`${c.light} px-4 py-3 border-b ${c.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.grad} flex items-center justify-center shadow`}><Icon className="w-4 h-4 text-white" /></div><div><h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4><p className="text-[9px] text-gray-500">{data.length} tests</p></div></div>
        <div className="flex items-center gap-1.5">{predicted !== null && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30">Pred: {predicted}%</span>}<TrendBadge direction={trend} /></div>
      </div>
      <div className="p-4">
        {data.length > 0 ? (<><div style={{ height: 140 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}><defs><linearGradient id={`g_${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={c.stroke} stopOpacity={0.3} /><stop offset="95%" stopColor={c.stroke} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" /><YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" /><Tooltip content={<CTooltip />} /><Area type="monotone" dataKey="score" stroke={c.stroke} strokeWidth={2.5} fill={`url(#g_${color})`} dot={{ r: 3, fill: c.stroke }} /></AreaChart></ResponsiveContainer></div>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {[{ l: 'Avg', v: `${avg}%`, c: 'text-blue-500' }, { l: 'Best', v: `${best}%`, c: 'text-emerald-500' }, { l: 'Acc', v: `${accuracy}%`, c: 'text-violet-500' }, { l: 'Tests', v: data.length, c: 'text-amber-500' }].map((m, i) => (<div key={i} className="text-center"><p className={`text-xs font-bold ${m.c}`}>{m.v}</p><p className="text-[7px] text-gray-400 uppercase">{m.l}</p></div>))}
          </div></>
        ) : <div className="text-center py-8"><BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-200" /><p className="text-[10px] text-gray-400">No data</p></div>}
      </div>
    </div>
  );
};

const ErrorAnalysisCard = ({ data, language: l }) => {
  if (!data?.unitPerformance?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow"><AlertTriangle className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गलती विश्लेषण' : 'Error Analysis'}</h3></div><span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{data.errorRate}%</span></div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2.5 border border-red-200/50"><p className="text-[9px] font-bold text-red-700 mb-1">{l === 'hi' ? 'कमजोर' : 'Weak'} ({data.weakUnits.length})</p>{data.weakUnits.slice(0, 3).map((u, i) => <p key={i} className="text-[8px] text-red-600/70 leading-snug">{u.unit}: {u.accuracy}%</p>)}</div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2.5 border border-emerald-200/50"><p className="text-[9px] font-bold text-emerald-700 mb-1">{l === 'hi' ? 'मजबूत' : 'Strong'} ({data.strongUnits.length})</p>{data.strongUnits.slice(0, 3).map((u, i) => <p key={i} className="text-[8px] text-emerald-600/70 leading-snug">{u.unit}: {u.accuracy}%</p>)}</div>
        </div>
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
          {data.unitPerformance.slice(0, 10).map((u, i) => (<div key={i} className="flex items-center gap-2"><span className="text-[9px] text-gray-600 w-24 leading-snug shrink-0">{u.unit}</span><div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${u.accuracy}%`, background: u.accuracy >= 70 ? '#22c55e' : u.accuracy >= 50 ? '#3b82f6' : u.accuracy >= 30 ? '#f59e0b' : '#ef4444' }} /></div><span className="text-[9px] font-bold w-8 text-right">{u.accuracy}%</span></div>))}
        </div>
      </div>
    </div>
  );
};

const TopicMasteryRadar = ({ data, language: l }) => {
  if (!data?.length) return null;
  const rd = data.slice(0, 8).map(d => ({ ...d, subject: d.unit?.replace(/UNIT\s*/i, 'U').substring(0, 12) || 'Other' }));
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow"><Crosshair className="w-4 h-4 text-white" /></div><h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'विषय दक्षता' : 'Topic Mastery'}</h3></div>
      <div style={{ height: 200 }}><ResponsiveContainer width="100%" height="100%"><RadarChart data={rd}><PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#94a3b8' }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 7 }} axisLine={false} /><Radar name="Accuracy" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} /></RadarChart></ResponsiveContainer></div>
    </div>
  );
};

const NeedsAttentionCard = ({ tests, language: l, navigate }) => {
  if (!tests?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200/50 dark:border-red-800/30 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="bg-red-50 dark:bg-red-900/10 px-4 py-3 border-b border-red-200/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-300">{l === 'hi' ? 'ध्यान दें' : 'Needs Attention'}</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{tests.length}</span>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar max-h-[450px]">
        {tests.map((t, i) => { const { g, c } = grd(t.bestScore); return (
          <div key={i} onClick={() => navigate?.(`/results/${t.lastAttempt?._id}`)} className="group flex items-center gap-3 p-2.5 rounded-xl bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 hover:bg-white hover:shadow-md cursor-pointer transition-all">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-base ${GC[c]} shrink-0`}>{g}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug mb-1">{t.test?.title || 'Test'}</h4>
              <p className="text-[9px] text-gray-500">Best: {t.bestScore}% | {t.attempts} att</p>
            </div>
            <p className="text-lg font-black text-red-600 shrink-0">{t.bestScore}%</p>
            <button onClick={e => { e.stopPropagation(); navigate?.(`/test/${t.testId}`); }} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 shrink-0 transition hover:scale-105"><RefreshCw className="w-4 h-4" /></button>
          </div>
        ); })}
      </div>
    </div>
  );
};

const PendingTimeline = ({ notAttemptedTests, paper1NotAttempted, paper2NotAttempted, language: l, navigate }) => {
  const [tab, setTab] = useState('all');
  const sorted = useMemo(() => {
    const base = tab === 'paper1' ? paper1NotAttempted : tab === 'paper2' ? paper2NotAttempted : notAttemptedTests;
    return [...base].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [notAttemptedTests, paper1NotAttempted, paper2NotAttempted, tab]);
  if (notAttemptedTests.length === 0) return null;
  const getDO = d => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'बाकी टेस्ट' : 'Pending'}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {[{ id: 'all', l: l === 'hi' ? 'सभी' : 'All', c: notAttemptedTests.length }, { id: 'paper1', l: 'P1', c: paper1NotAttempted.length }, { id: 'paper2', l: 'P2', c: paper2NotAttempted.length }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${tab === t.id ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              {t.l} <span className="text-[8px] ml-0.5 px-1 rounded-full bg-gray-200 dark:bg-gray-600">{t.c}</span>
            </button>
          ))}
        </div>
        {sorted[0] && <button onClick={() => navigate?.(`/test/${sorted[0]._id}`)} className="w-full mt-2 p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center gap-2 hover:shadow-md transition-all"><Rocket className="w-3.5 h-3.5" /><span className="text-[10px] font-bold">{l === 'hi' ? 'मैराथन' : 'Marathon'}</span></button>}
      </div>
      <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar max-h-[450px]">
        {sorted.map((t, i) => { const d = getDO(t.createdAt); return (
          <div key={t._id || i} className={`flex items-center gap-3 p-2.5 rounded-xl border hover:shadow-md transition-all ${d >= 14 ? 'border-red-200 bg-red-50/30' : d >= 7 ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100 bg-gray-50/30'}`}>
            <div className="text-center w-8 shrink-0">
              <p className="text-sm font-black text-gray-900 dark:text-white">{new Date(t.createdAt).getDate()}</p>
              <p className="text-[7px] text-gray-400 uppercase">{new Date(t.createdAt).toLocaleDateString('en', { month: 'short' })}</p>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug mb-1">{t.title || 'Untitled'}</h4>
              <div className="flex flex-wrap items-center gap-2 text-[8px] text-gray-500">
                <span className="font-medium">{t.totalQuestions || 0}Q</span>
                <span>•</span>
                <span>{t.duration || 0}m</span>
                <span>•</span>
                <span className={d >= 14 ? 'text-red-500 font-bold' : ''}>{d}d ago</span>
              </div>
            </div>
            <button onClick={() => navigate?.(`/test/${t._id}`)} className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-md transition hover:scale-105">
              <Play className="w-3 h-3 inline mr-0.5" />{l === 'hi' ? 'दें' : 'Take'}
            </button>
          </div>
        ); })}
      </div>
    </div>
  );
};

const PaperTabbedActivity = ({ allAttempts, paper1Attempts, paper2Attempts, allTests, paper1Tests, paper2Tests, notAttemptedTests, paper1NotAttempted, paper2NotAttempted, language: l, loading: la }) => {
  const [mT, setMT] = useState('attempted');
  const [pF, setPF] = useState('all');
  const navigate = useNavigate();
  const fA = pF === 'paper1' ? paper1Attempts : pF === 'paper2' ? paper2Attempts : allAttempts;
  const fT = pF === 'paper1' ? paper1Tests : pF === 'paper2' ? paper2Tests : allTests;
  const fN = pF === 'paper1' ? paper1NotAttempted : pF === 'paper2' ? paper2NotAttempted : notAttemptedTests;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" />{l === 'hi' ? 'गतिविधि' : 'Activity'}
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {[{ id: 'all', l: 'All' }, { id: 'paper1', l: 'P1' }, { id: 'paper2', l: 'P2' }].map(p => (
            <button key={p.id} onClick={() => setPF(p.id)} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${pF === p.id ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              {p.l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex border-b border-gray-100 dark:border-gray-700 px-1 shrink-0">
        {[{ id: 'attempted', l: l === 'hi' ? 'दिए' : 'Taken', I: CheckCircle, c: fA.length }, { id: 'created', l: l === 'hi' ? 'बनाए' : 'Created', I: PlusCircle, c: fT.length }, { id: 'pending', l: l === 'hi' ? 'बाकी' : 'Pending', I: Clock, c: fN.length }].map(t => (
          <button key={t.id} onClick={() => setMT(t.id)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-all ${mT === t.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <t.I className="w-3 h-3" />{t.l}<span className="text-[8px] px-1 rounded-full bg-gray-100 dark:bg-gray-700">{t.c}</span>
          </button>
        ))}
      </div>
      <div className="p-3 space-y-2 overflow-y-auto flex-1 custom-scrollbar max-h-[500px]">
        {mT === 'attempted' && (la ? <div className="space-y-2">{[1, 2, 3].map(i => <Sk key={i} className="h-16 w-full" />)}</div>
          : fA.length > 0 ? <div className="space-y-2">{fA.map((a, i) => { const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0; const { g, c } = grd(pct); return (
            <div key={a._id || i} onClick={() => navigate(`/results/${a._id}`)} className="group flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md cursor-pointer transition-all">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-black text-base ${GC[c]} shrink-0`}>{g}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug mb-1">{a.testId?.title || 'Test'}</h4>
                <div className="flex flex-wrap items-center gap-2 text-[9px] text-gray-500">
                  <span className="font-medium text-emerald-600">✓{a.correctCount || 0}</span>
                  <span className="font-medium text-red-600">✗{a.wrongCount || 0}</span>
                  <span>•</span>
                  <span>{tAgo(a.completedAt, l)}</span>
                </div>
              </div>
              <p className="text-lg font-black text-gray-900 dark:text-white shrink-0">{pct}%</p>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-indigo-500 transition-colors" />
            </div>
          ); })}</div>
          : <div className="text-center py-10"><ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p className="text-xs text-gray-400">No tests taken</p></div>
        )}
        {mT === 'created' && (fT.length > 0 ? <div className="space-y-2">{fT.map((t, i) => (
          <div key={t._id || i} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow shrink-0"><FileText className="w-5 h-5 text-white" /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug mb-1">{t.title || 'Untitled'}</h4>
              <p className="text-[9px] text-gray-500 font-medium">{t.totalQuestions || 0}Q • {tAgo(t.createdAt, l)}</p>
            </div>
            <button onClick={() => navigate(`/test/${t._id}`)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shrink-0 transition hover:scale-105"><Play className="w-4 h-4" /></button>
          </div>
        ))}</div> : <div className="text-center py-10"><PlusCircle className="w-10 h-10 mx-auto mb-2 text-gray-200" /><p className="text-xs text-gray-400">None</p></div>)}
        {mT === 'pending' && (fN.length > 0 ? <div className="space-y-2">{fN.map((t, i) => (
          <div key={t._id || i} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/30 border border-amber-100 dark:border-amber-900/20 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug mb-1">{t.title}</h4>
              <p className="text-[9px] text-gray-500 font-medium">{t.totalQuestions || 0}Q</p>
            </div>
            <button onClick={() => navigate(`/test/${t._id}`)} className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-lg shrink-0 transition hover:scale-105"><Play className="w-3 h-3 inline mr-0.5" />{l === 'hi' ? 'दें' : 'Take'}</button>
          </div>
        ))}</div> : <div className="text-center py-10"><CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-200" /><p className="text-xs text-gray-400">All done!</p></div>)}
      </div>
    </div>
  );
};

const PaperSection = ({ paper, title, subtitle, Icon, color, units, total, language: l, navigate }) => {
  const [open, setOpen] = useState(true);
  const sorted = [...units].sort((a, b) => b.count - a.count);
  const c = color === 'blue' ? { grad: 'from-blue-600 to-cyan-600', gradL: 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10', bdr: 'border-blue-200/50 dark:border-blue-800/30', txt: 'text-blue-600 dark:text-blue-400', bar: 'from-blue-500 to-cyan-400', iconBg: 'from-blue-500 to-cyan-500' } : { grad: 'from-purple-600 to-violet-600', gradL: 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10', bdr: 'border-purple-200/50 dark:border-purple-800/30', txt: 'text-purple-600 dark:text-purple-400', bar: 'from-purple-500 to-violet-400', iconBg: 'from-purple-500 to-violet-500' };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.bdr} overflow-hidden`}>
      <div className={`bg-gradient-to-r ${c.gradL} p-4 border-b ${c.bdr}`}><div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center shadow-lg`}><Icon className="w-5 h-5 text-white" /></div><div><h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">{title}<span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-gray-700/80 ${c.txt}`}>{total} Qs</span></h3><p className="text-[10px] text-gray-500">{subtitle}</p></div></div><button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:bg-white/60">{open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</button></div></div>
      {open && <div className="p-3">{sorted.length > 0 ? <div className="space-y-1">{sorted.map((u, i) => { const pct = total > 0 ? Math.round((u.count / total) * 100) : 0; return (<div key={i} onClick={() => navigate?.(`/questions?paper=${paper}&unit=${encodeURIComponent(u._id?.unit || '')}`)} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"><div className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${i === 0 ? `bg-gradient-to-br ${c.grad} text-white shadow` : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{i + 1}</div><div className="flex-1 min-w-0"><p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 leading-snug">{u._id?.unit || '?'}</p><div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-1"><div className={`h-full bg-gradient-to-r ${c.bar} rounded-full`} style={{ width: `${pct}%` }} /></div></div><div className="text-right flex-shrink-0"><p className="text-[11px] font-bold text-gray-900 dark:text-white">{u.count}</p><p className="text-[8px] text-gray-400">{pct}%</p></div><ChevronRight className="w-3 h-3 text-gray-300" /></div>); })}</div> : <div className="text-center py-6"><FileQuestion className="w-8 h-8 mx-auto mb-2 text-gray-200" /><p className="text-[10px] text-gray-400">No questions</p></div>}</div>}
    </div>
  );
};

const iconMapA = { Layers, Crown, Play, Flame, Medal, Star, Target, PlusCircle };
const AchievementCard = ({ achievements, language: l }) => {
  const un = achievements.filter(a => a.unlocked).length;
  const cm = { amber: 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400', purple: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30', blue: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30', orange: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30', emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30', gray: 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm"><Award className="w-5 h-5 text-amber-500" />{l === 'hi' ? 'उपलब्धियाँ' : 'Achievements'}</h3><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{un}/{achievements.length}</span></div>
      <div className="grid grid-cols-4 gap-2">{achievements.map((a, i) => { const c = cm[a.color] || cm.gray; const Ic = iconMapA[a.icon] || Star; return (<div key={i} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border ${a.unlocked ? c : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 opacity-50'}`} title={a.desc}>{a.unlocked ? <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-white" /></div> : <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-400 rounded-full flex items-center justify-center"><Lock className="w-2 h-2 text-white" /></div>}<Ic className="w-4 h-4" /><span className="text-[8px] font-bold text-center leading-tight">{a.label}</span>{!a.unlocked && a.progress !== undefined && <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(a.progress * 100, 100)}%` }} /></div>}</div>); })}</div>
    </div>
  );
};

const StreakCard = ({ streak, longestStreak, language: l }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], today = new Date().getDay();
  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-yellow-300" /><span className="font-bold text-xs">{l === 'hi' ? 'स्ट्रीक' : 'Streak'}</span></div><div className="text-right"><span className="text-xl font-black">{streak}d</span>{longestStreak > 0 && <p className="text-[8px] text-white/40">Best: {longestStreak}d</p>}</div></div>
      <div className="flex justify-between gap-1">{days.map((d, i) => (<div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${i <= today && streak > 0 ? 'bg-white text-orange-600 shadow-sm' : 'bg-white/15 text-white/50'}`}>{d}</div>))}</div>
    </div>
  );
};

const quotes = [{ t: "Success is not final, failure is not fatal.", a: "Churchill" }, { t: "The only way to do great work is to love what you do.", a: "Jobs" }, { t: "Education is the most powerful weapon.", a: "Mandela" }, { t: "Believe you can and you're halfway there.", a: "Roosevelt" }, { t: "The expert in anything was once a beginner.", a: "Hayes" }];
const QuoteCard = () => { const [q] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]); return (<div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-4 text-white"><Sparkles className="w-4 h-4 mb-2 text-yellow-300" /><p className="text-xs font-medium italic opacity-95">"{q.t}"</p><p className="text-[9px] text-white/50 mt-1">- {q.a}</p></div>); };

const QAction = ({ icon: Icon, title, desc, to, gradient, badge, delay = 0 }) => {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (<Link to={to} className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}><div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} /><div className="relative z-10"><div className="flex items-start justify-between mb-1.5"><div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}><Icon className="w-4 h-4 text-white" /></div>{badge && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded-full">{badge}</span>}</div><h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white text-xs">{title}</h3><p className="text-[9px] text-gray-500 group-hover:text-white/70 mt-0.5">{desc}</p></div></Link>);
};

// ════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════════
const Dashboard = ({ language: propLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const d = useDashboard();
  const greeting = getGreeting();
  const GI = greeting.I;

  return (
    <Layout language={propLanguage} setLanguage={setLanguage}>
      {({ language }) => {
        const l = language;
        return (
          <div className="space-y-5 pb-8">

            {/* ═══════════════════════════════════════════════
                 HERO SECTION
            ═══════════════════════════════════════════════ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl" />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

              <div className="relative">
                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <LiveClock />
                    <SessionTimer />
                    {d.daysUntilExam !== null && d.daysUntilExam > 0 && (
                      <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10">
                        <CalendarDays className="w-3 h-3 text-rose-400" />
                        <span className="text-xs font-mono font-bold text-white tabular-nums">{d.daysUntilExam}d</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={d.refresh}
                      className={`p-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all ${d.refreshing ? 'animate-spin' : ''}`}>
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <span className="text-[8px] text-indigo-300/40">
                      {d.lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Main hero */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${greeting.g} flex items-center justify-center shadow-lg`}>
                        <GI className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h1 className="text-xl md:text-2xl font-black">{l === 'hi' ? greeting.hi : greeting.en}</h1>
                        <p className="text-[9px] text-indigo-300/50">
                          {new Date().toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <p className="text-indigo-200/60 text-xs mb-4 max-w-md">
                      {l === 'hi' ? 'नियमित अभ्यास सफलता की कुंजी है। आज का लक्ष्य पूरा करें!' : 'Consistent practice is the key. Complete today\'s goals!'}
                    </p>

                    {/* JRF quick badge */}
                    {d.jrfProbability.dataPoints >= 3 && (
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                          d.jrfProbability.riskLevel === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20' :
                          d.jrfProbability.riskLevel === 'moderate' ? 'bg-blue-500/10 border-blue-500/20' :
                          d.jrfProbability.riskLevel === 'risky' ? 'bg-amber-500/10 border-amber-500/20' :
                          'bg-red-500/10 border-red-500/20'}`}>
                          <Brain className="w-3.5 h-3.5 text-indigo-300" />
                          <span className="text-[10px] font-bold">JRF: {d.jrfProbability.jrfProbability}%</span>
                          <span className="text-[8px] text-indigo-300/50">|</span>
                          <span className="text-[10px] font-bold">NET: {d.jrfProbability.netProbability}%</span>
                        </div>
                        {d.todayActivity.count > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-bold text-emerald-300">
                              {l === 'hi' ? `आज ${d.todayActivity.count} टेस्ट` : `${d.todayActivity.count} today`}
                            </span>
                          </div>
                        )}
                        {/* Readiness badge */}
                        {d.examCommandCenter?.readiness && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <Gauge className="w-3 h-3 text-indigo-300" />
                            <span className="text-[9px] font-bold text-indigo-300">
                              {l === 'hi' ? 'तैयारी' : 'Ready'}: {d.examCommandCenter.readiness.overall}%
                            </span>
                          </div>
                        )}
                        {/* Revision due badge */}
                        {d.smartRevision?.stats?.dueToday > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                            <RotateCcw className="w-3 h-3 text-rose-300" />
                            <span className="text-[9px] font-bold text-rose-300">
                              {d.smartRevision.stats.dueToday} {l === 'hi' ? 'रिवीज़न बाकी' : 'revision due'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate('/tests/create')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        <Play className="w-3.5 h-3.5" />{l === 'hi' ? 'टेस्ट शुरू' : 'Start Test'}
                      </button>
                      <button onClick={() => navigate('/import')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all">
                        <Upload className="w-3.5 h-3.5" />{l === 'hi' ? 'आयात' : 'Import'}
                      </button>
                      {d.smartRevision?.marathonQueue?.length > 0 && (
                        <button onClick={() => navigate(`/test/${d.smartRevision.marathonQueue[0].testId}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-xs rounded-xl hover:shadow-xl transition-all">
                          <RotateCcw className="w-3.5 h-3.5" />{l === 'hi' ? 'रिवीज़न' : 'Revise'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right side stats */}
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col gap-1.5">
                      {[
                        { l: 'P1', v: d.paper1Count, i: BookOpen, c: 'from-blue-500 to-cyan-500', acc: d.paper1Accuracy },
                        { l: 'P2', v: d.paper2Count, i: Target, c: 'from-purple-500 to-violet-500', acc: d.paper2Accuracy },
                        { l: l === 'hi' ? 'टेस्ट' : 'Tests', v: d.testStats?.totalTests || 0, i: ClipboardList, c: 'from-amber-500 to-orange-500' },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${p.c} flex items-center justify-center`}>
                            <p.i className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <p className="text-[8px] text-indigo-300/40">{p.l}{p.acc !== undefined ? ` (${p.acc}%)` : ''}</p>
                            <p className="text-sm font-bold">{p.v}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Ring pct={d.overallAccuracy} size={120} sw={8} color="#22c55e" bg="rgba(255,255,255,0.08)">
                      <div className="text-center">
                        <p className="text-2xl font-black">{d.overallAccuracy}%</p>
                        <p className="text-[8px] text-indigo-300/50 uppercase">{l === 'hi' ? 'सटीकता' : 'Accuracy'}</p>
                      </div>
                    </Ring>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 STAT CARDS
            ═══════════════════════════════════════════════ */}
            {d.loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <Sk key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={FileQuestion} label={l === 'hi' ? 'कुल प्रश्न' : 'Questions'} value={d.totalQuestions}
                  sub={l === 'hi' ? 'बैंक में' : 'in bank'} gradient="from-blue-500 to-cyan-500" iconBg="from-blue-500 to-cyan-600"
                  onClick={() => navigate('/questions')} delay={0} spark={[3, 7, 5, 12, 8, 15, 10]} />
                <StatCard icon={BookOpen} label="Paper 1" value={d.paper1Count}
                  sub={`${d.paper1Accuracy}% acc`} gradient="from-emerald-500 to-green-500" iconBg="from-emerald-500 to-green-600"
                  onClick={() => navigate('/questions?paper=paper1')} delay={80} spark={[2, 5, 3, 8, 6, 10, 7]} trend={d.paper1TrendDir} />
                <StatCard icon={Target} label="Paper 2" value={d.paper2Count}
                  sub={`${d.paper2Accuracy}% acc`} gradient="from-purple-500 to-violet-500" iconBg="from-purple-500 to-violet-600"
                  onClick={() => navigate('/questions?paper=paper2')} delay={160} spark={[4, 6, 9, 5, 11, 8, 13]} trend={d.paper2TrendDir} />
                <StatCard icon={ClipboardList} label={l === 'hi' ? 'टेस्ट' : 'Tests'} value={d.testStats?.totalTests || 0}
                  sub={`${d.allCompletedAttempts.length} ${l === 'hi' ? 'दिए' : 'taken'}`} gradient="from-amber-500 to-orange-500" iconBg="from-amber-500 to-orange-600"
                  onClick={() => navigate('/tests')} delay={240} spark={[1, 3, 2, 5, 4, 7, 6]} />
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                 🆕 DAILY REPORT + JRF + GOALS
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Column 1: JRF Probability */}
              <JRFProbabilityMeter data={d.jrfProbability} language={l} />

              {/* Column 2: Goals */}
              <GoalTracker
                goals={d.autoGeneratedGoals}
                completionPct={d.goalCompletionPct}
                todayDetailed={d.todayDetailed}
                yesterdayActivity={d.yesterdayActivity}
                customTargets={d.customTargets}
                updateCustomTargets={d.updateCustomTargets}
                dayProgress={d.dayProgress}
                goalStreak={d.goalStreak}
                goalsCompleted={d.goalsCompleted}
                totalGoals={d.totalGoals}
                pressureMessage={d.pressureMessage}
                todayXP={d.todayXP}
                streak={d.streak}
                language={l}
                navigate={navigate}
              />

              {/* Column 3: Exam Countdown + Daily Report + Streak */}
              <div className="space-y-4">
                <ExamCommandCenter
                  data={d.examCommandCenter}
                  examDate={d.examDate}
                  setExamDate={d.setExamDate}
                  language={l}
                  navigate={navigate}
                />
                <DailyReportCard data={d.dailyReport} language={l} />
                <StreakCard streak={d.streak} longestStreak={d.longestStreak} language={l} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 🆕 SMART REVISION + WEEKLY CHAPTER MATRIX
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RotateCcw className="w-5 h-5 text-rose-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'रिवीज़न और साप्ताहिक विश्लेषण' : 'Revision & Weekly Analysis'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SmartRevisionHub data={d.smartRevision} language={l} navigate={navigate} />
                <WeeklyChapterMatrix data={d.weeklyChapterMatrix} language={l} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 PERSONAL RECORDS
            ═══════════════════════════════════════════════ */}
            {d.allCompletedAttempts.length > 0 && (
              <PersonalRecords records={d.personalRecords} language={l} />
            )}

            {/* ═══════════════════════════════════════════════
                 PAPER TRENDS
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'पेपर-वार ट्रेंड' : 'Paper-wise Trends'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PaperTrendCard title={l === 'hi' ? 'पेपर 1' : 'Paper 1'} icon={BookOpen} color="blue"
                  data={d.paper1Trend} trend={d.paper1TrendDir} predicted={d.paper1Predicted}
                  avgScore={d.paper1AvgScore} accuracy={d.paper1Accuracy} language={l} />
                <PaperTrendCard title={l === 'hi' ? 'पेपर 2' : 'Paper 2'} icon={Target} color="purple"
                  data={d.paper2Trend} trend={d.paper2TrendDir} predicted={d.paper2Predicted}
                  avgScore={d.paper2AvgScore} accuracy={d.paper2Accuracy} language={l} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 SYLLABUS + RECOMMENDATIONS
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <SyllabusCoverageMap coverage={d.syllabusCoverage} language={l} />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <StudyRecommendations recommendations={d.studyRecommendations} language={l} />
                <TestScoreRankingCard ranking={d.testScoreRanking} language={l} navigate={navigate} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 🆕 MISTAKE JOURNAL + ERROR + TOPIC + SPEED
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <NotebookPen className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'गलती और विश्लेषण' : 'Mistakes & Analytics'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <MistakeJournal data={d.mistakeJournal} language={l} />
                <ErrorAnalysisCard data={d.errorPatterns} language={l} />
                <div className="space-y-4">
                  <TopicMasteryRadar data={d.topicPerformance} language={l} />
                  <SpeedAnalyticsCard data={d.speedAnalytics} language={l} />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 ACTIVITY HEATMAP + WEEKLY + SCORES
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ActivityHeatmap activityMap={d.activityMap} language={l} />
              </div>
              <div className="space-y-4">
                <WeeklyComparison data={d.weeklyComparison} language={l} />
                <ScoreDistributionCard data={d.scoreDistribution} language={l} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 TIME OF DAY
            ═══════════════════════════════════════════════ */}
            {d.timeOfDayAnalysis?.bestPeriod && (
              <TimeOfDayCard data={d.timeOfDayAnalysis} language={l} />
            )}

            {/* ═══════════════════════════════════════════════
                 PAPER ANALYSIS (Unit breakdown)
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'पेपर विश्लेषण' : 'Paper Analysis'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PaperSection paper="paper1" title={l === 'hi' ? 'पेपर 1' : 'Paper 1'}
                  subtitle={l === 'hi' ? 'शिक्षण अभिवृत्ति' : 'Teaching Aptitude'} Icon={BookOpen} color="blue"
                  units={d.paper1Units} total={d.paper1Count} language={l} navigate={navigate} />
                <PaperSection paper="paper2" title={l === 'hi' ? 'पेपर 2' : 'Paper 2'}
                  subtitle={l === 'hi' ? 'इतिहास' : 'History'} Icon={Target} color="purple"
                  units={d.paper2Units} total={d.paper2Count} language={l} navigate={navigate} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 PENDING + NEEDS ATTENTION
            ═══════════════════════════════════════════════ */}
            {(d.notAttemptedTests.length > 0 || d.needsAttentionTests.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    {l === 'hi' ? 'बाकी और ध्यान दें' : 'Pending & Attention'}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {d.notAttemptedTests.length > 0 && (
                    <PendingTimeline
                      notAttemptedTests={d.notAttemptedTests}
                      paper1NotAttempted={d.paper1NotAttempted}
                      paper2NotAttempted={d.paper2NotAttempted}
                      language={l} navigate={navigate}
                    />
                  )}
                  {d.needsAttentionTests.length > 0 && (
                    <NeedsAttentionCard tests={d.needsAttentionTests} language={l} navigate={navigate} />
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
                 ACTIVITY + ACHIEVEMENTS
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <PaperTabbedActivity
                  allAttempts={d.allCompletedAttempts}
                  paper1Attempts={d.paper1Attempts}
                  paper2Attempts={d.paper2Attempts}
                  allTests={d.createdTests}
                  paper1Tests={d.paper1Tests}
                  paper2Tests={d.paper2Tests}
                  notAttemptedTests={d.notAttemptedTests}
                  paper1NotAttempted={d.paper1NotAttempted}
                  paper2NotAttempted={d.paper2NotAttempted}
                  language={l} loading={d.loading}
                />
              </div>
              <div className="space-y-4">
                <AchievementCard achievements={d.achievements} language={l} />
                <QuoteCard />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 QUICK ACTIONS
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QAction icon={PlusCircle} title={l === 'hi' ? 'नया टेस्ट' : 'New Test'}
                  desc={l === 'hi' ? 'मॉक बनाएं' : 'Create mock'} to="/tests/create"
                  gradient="from-blue-600 to-indigo-600" delay={0} />
                <QAction icon={Upload} title={l === 'hi' ? 'आयात' : 'Import'}
                  desc="JSON" to="/import" gradient="from-emerald-600 to-green-600"
                  badge="JSON" delay={80} />
                <QAction icon={FileQuestion} title={l === 'hi' ? 'प्रश्न' : 'Questions'}
                  desc={l === 'hi' ? 'बैंक' : 'Bank'} to="/questions"
                  gradient="from-purple-600 to-violet-600" delay={160} />
                <QAction icon={BarChart3} title={l === 'hi' ? 'परिणाम' : 'Results'}
                  desc={l === 'hi' ? 'प्रगति' : 'Progress'} to="/results"
                  gradient="from-orange-600 to-red-600" delay={240} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 FOOTER CTA
            ═══════════════════════════════════════════════ */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 text-white">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{l === 'hi' ? 'UGC NET क्रैक करें' : 'Crack UGC NET'}</h3>
                    <p className="text-[10px] text-gray-400">
                      {d.jrfProbability.dataPoints >= 3
                        ? `JRF: ${d.jrfProbability.jrfProbability}% | NET: ${d.jrfProbability.netProbability}%`
                        + (d.examCommandCenter?.readiness ? ` | ${l === 'hi' ? 'तैयारी' : 'Ready'}: ${d.examCommandCenter.readiness.overall}%` : '')
                        : (l === 'hi' ? 'अभी शुरू करें!' : 'Start now!')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {d.smartRevision?.stats?.dueToday > 0 && (
                    <button onClick={() => d.smartRevision.marathonQueue[0] && navigate(`/test/${d.smartRevision.marathonQueue[0].testId}`)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-xs rounded-xl hover:shadow-xl transition-all">
                      <RotateCcw className="w-3.5 h-3.5" />{d.smartRevision.stats.dueToday} {l === 'hi' ? 'रिवीज़न' : 'Revisions'}
                    </button>
                  )}
                  <button onClick={() => navigate('/tests')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs rounded-xl hover:shadow-xl transition-all">
                    <Play className="w-3.5 h-3.5" />{l === 'hi' ? 'टेस्ट' : 'Tests'}
                  </button>
                  <button onClick={() => navigate('/results')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all">
                    <BarChart3 className="w-3.5 h-3.5" />{l === 'hi' ? 'परिणाम' : 'Results'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      }}
    </Layout>
  );
};

export default Dashboard;