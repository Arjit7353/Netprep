// client/src/pages/Dashboard.jsx
// ═══════════════════════════════════════════════════════════════
//  NETPREP ULTIMATE DASHBOARD - PART 2 & 3 INTEGRATED
//  All sections saved in ONE file: client/src/pages/Dashboard.jsx
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
  Sun, Moon, Coffee, Sunset, Gauge, Medal, Lock,
  Lightbulb, AlertTriangle, Info, Rocket, Crosshair,
  Swords, FileText, LayoutGrid, AlertCircle, Shield,
  ArrowUpDown, Hourglass, ListOrdered,
  Flag, CircleDot, Brain, Percent, MapPin, Radar as RadarIcon,
  Milestone, CalendarDays, CalendarClock, Workflow,
  TreePine, Grid3X3, Cpu, Dumbbell, HeartPulse,
  ArrowUp, ArrowDown, Minus, Settings, X,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';

// ════════════════════════════════════════════════════════════
//                    UTILITIES
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

const fmtTime = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ════════════════════════════════════════════════════════════
//                    MICRO COMPONENTS
// ════════════════════════════════════════════════════════════
const Cnt = ({ end, sfx = '', decimals = 0 }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!end && end !== 0) { setC(0); return; }
    let s, f;
    const target = typeof end === 'number' ? end : parseFloat(end) || 0;
    const r = t => {
      if (!s) s = t;
      const p = Math.min((t - s) / 1200, 1);
      const val = (1 - Math.pow(1 - p, 4)) * target;
      setC(decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.floor(val));
      if (p < 1) f = requestAnimationFrame(r);
    };
    f = requestAnimationFrame(r);
    return () => cancelAnimationFrame(f);
  }, [end, decimals]);
  return <>{typeof c === 'number' ? c.toLocaleString() : c}{sfx}</>;
};

const Ring = ({ pct, size = 100, sw = 7, color = '#3b82f6', bg, children }) => {
  const [a, setA] = useState(0);
  const r = (size - sw) / 2, C = 2 * Math.PI * r;
  useEffect(() => {
    const t = setTimeout(() => setA(Math.min(pct || 0, 100)), 200);
    return () => clearTimeout(t);
  }, [pct]);
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
};

const Sk = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />
);

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

const SessionTimer = ({ language: l }) => {
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
//                    STAT CARD (Enhanced)
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
                background: iconBg.includes('blue') ? '#3b82f6' : iconBg.includes('emerald') || iconBg.includes('green') ? '#22c55e' : iconBg.includes('purple') ? '#8b5cf6' : '#f59e0b',
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
//   🆕 JRF PROBABILITY METER
// ════════════════════════════════════════════════════════════
const JRFProbabilityMeter = ({ data, language }) => {
  const l = language;
  if (!data || data.confidence === 'low' && data.dataPoints < 3) {
    return (
      <div className="bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative text-center py-6">
          <Brain className="w-12 h-12 mx-auto mb-3 text-indigo-400 opacity-50" />
          <h3 className="font-bold text-lg mb-1">{l === 'hi' ? 'JRF संभावना मीटर' : 'JRF Probability Meter'}</h3>
          <p className="text-sm text-indigo-300/60 mb-4">{l === 'hi' ? 'कम से कम 3 टेस्ट दें' : 'Take at least 3 tests to unlock'}</p>
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-indigo-400">{data?.dataPoints || 0}/6 {l === 'hi' ? 'डेटा पॉइंट' : 'data points'}</span>
          </div>
        </div>
      </div>
    );
  }

  const riskColors = {
    safe: { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' },
    moderate: { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30' },
    risky: { bg: 'from-amber-500 to-orange-600', text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' },
    critical: { bg: 'from-red-500 to-rose-600', text: 'text-red-400', badge: 'bg-red-500/20 border-red-500/30' },
  };
  const rc = riskColors[data.riskLevel] || riskColors.moderate;

  const riskLabels = {
    safe: { en: 'Safe Zone', hi: 'सुरक्षित' },
    moderate: { en: 'Moderate', hi: 'मध्यम' },
    risky: { en: 'Risky', hi: 'जोखिम' },
    critical: { en: 'Critical', hi: 'गंभीर' },
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Brain className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{l === 'hi' ? 'JRF संभावना मीटर' : 'JRF Probability Meter'}</h3>
            <p className="text-[9px] text-indigo-300/50">{l === 'hi' ? 'AI आधारित भविष्यवाणी' : 'AI-Powered Prediction'}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-lg border ${rc.badge} flex items-center gap-1`}>
          <CircleDot className={`w-2.5 h-2.5 ${rc.text}`} />
          <span className={`text-[9px] font-bold ${rc.text}`}>{riskLabels[data.riskLevel]?.[l] || data.riskLevel}</span>
        </div>
      </div>

      {/* Main Meters */}
      <div className="relative grid grid-cols-2 gap-4 mb-4">
        {/* NET Probability */}
        <div className="text-center">
          <Ring pct={data.netProbability} size={100} sw={7}
            color={data.netProbability >= 60 ? '#22c55e' : data.netProbability >= 40 ? '#f59e0b' : '#ef4444'}
            bg="rgba(255,255,255,0.08)">
            <div>
              <p className="text-xl font-black">{data.netProbability}%</p>
              <p className="text-[7px] text-indigo-300/50 uppercase">NET</p>
            </div>
          </Ring>
          <p className="text-[10px] font-semibold mt-1.5 text-indigo-200">NET {l === 'hi' ? 'संभावना' : 'Probability'}</p>
          <p className="text-[8px] text-indigo-400/50">{l === 'hi' ? 'कटऑफ' : 'Cutoff'}: {data.netCutoff}%</p>
        </div>

        {/* JRF Probability */}
        <div className="text-center">
          <Ring pct={data.jrfProbability} size={100} sw={7}
            color={data.jrfProbability >= 60 ? '#22c55e' : data.jrfProbability >= 35 ? '#f59e0b' : '#ef4444'}
            bg="rgba(255,255,255,0.08)">
            <div>
              <p className="text-xl font-black">{data.jrfProbability}%</p>
              <p className="text-[7px] text-indigo-300/50 uppercase">JRF</p>
            </div>
          </Ring>
          <p className="text-[10px] font-semibold mt-1.5 text-indigo-200">JRF {l === 'hi' ? 'संभावना' : 'Probability'}</p>
          <p className="text-[8px] text-indigo-400/50">{l === 'hi' ? 'कटऑफ' : 'Cutoff'}: {data.jrfCutoff}%</p>
        </div>
      </div>

      {/* Predicted Scores Strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { l: 'Paper 1', v: `${data.predictedP1}%`, icon: BookOpen, t: data.p1Trend },
          { l: 'Paper 2', v: `${data.predictedP2}%`, icon: Target, t: data.p2Trend },
          { l: l === 'hi' ? 'कुल' : 'Overall', v: `${data.predictedTotal}%`, icon: Trophy, t: null },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
            <s.icon className="w-3 h-3 mx-auto mb-0.5 text-indigo-300/50" />
            <p className="text-sm font-black">{s.v}</p>
            <p className="text-[7px] text-indigo-300/40 uppercase">{s.l}</p>
            {s.t && <TrendBadge direction={s.t} />}
          </div>
        ))}
      </div>

      {/* Consistency Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-indigo-300/50">{l === 'hi' ? 'स्थिरता स्कोर' : 'Consistency Score'}</span>
          <span className="text-[10px] font-bold">{data.consistencyScore}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${data.consistencyScore}%`,
              background: data.consistencyScore >= 60 ? 'linear-gradient(90deg, #22c55e, #10b981)'
                : data.consistencyScore >= 40 ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                : 'linear-gradient(90deg, #ef4444, #f97316)'
            }} />
        </div>
      </div>

      {/* Factors */}
      {data.factors.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-indigo-300/40 uppercase tracking-wider mb-1.5">{l === 'hi' ? 'प्रभावी कारक' : 'Key Factors'}</p>
          <div className="space-y-1">
            {data.factors.slice(0, 4).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[9px]">
                {f.type === 'positive'
                  ? <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                <span className={f.type === 'positive' ? 'text-emerald-300/80' : 'text-red-300/80'}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
          <p className="text-[9px] text-indigo-300/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-yellow-400" />
            {l === 'hi' ? 'सुझाव' : 'Suggestions'}
          </p>
          <div className="space-y-1">
            {data.suggestions.slice(0, 3).map((s, i) => (
              <p key={i} className="text-[9px] text-indigo-200/60 flex items-start gap-1">
                <ArrowRight className="w-2.5 h-2.5 mt-0.5 text-indigo-400 flex-shrink-0" />
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[8px] text-indigo-400/30">
          {l === 'hi' ? 'विश्वसनीयता' : 'Confidence'}: {data.confidence}
          ({data.dataPoints} {l === 'hi' ? 'डेटा' : 'data pts'})
        </span>
        <span className="text-[8px] text-indigo-400/30">{l === 'hi' ? 'अनुमानित' : 'Predicted'}</span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 ADVANCED EXAM COUNTDOWN (Replaces old ExamCountdown)
// ════════════════════════════════════════════════════════════
const AdvancedExamCountdown = ({ examDate, setExamDate, countdown, language }) => {
  const [editing, setEditing] = useState(false);
  const [tempDate, setTempDate] = useState(examDate);
  const l = language;

  const handleSave = () => { setExamDate(tempDate); setEditing(false); };

  if (!examDate) {
    return (
      <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="relative text-center">
          <CalendarClock className="w-10 h-10 mx-auto mb-3 text-pink-200" />
          <h3 className="font-bold text-base mb-1">{l === 'hi' ? 'परीक्षा तिथि सेट करें' : 'Set Exam Date'}</h3>
          <p className="text-[10px] text-pink-200/60 mb-3">{l === 'hi' ? 'एक बार सेट करें, रोज नहीं' : 'Set once, auto-saved forever'}</p>
          <input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/20 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30 mb-2"
            min={new Date().toISOString().split('T')[0]} />
          <button onClick={handleSave} disabled={!tempDate}
            className="w-full px-4 py-2 bg-white text-pink-600 font-bold text-sm rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-50">
            {l === 'hi' ? '✅ सेट करें (बस एक बार)' : '✅ Set Date (One Time Only)'}
          </button>
        </div>
      </div>
    );
  }

  if (!countdown) return null;

  const phaseGradients = {
    emerald: 'from-emerald-600 via-green-600 to-emerald-700',
    blue: 'from-blue-600 via-indigo-600 to-blue-700',
    amber: 'from-amber-500 via-yellow-600 to-amber-600',
    orange: 'from-orange-500 via-amber-600 to-orange-700',
    red: 'from-red-600 via-rose-600 to-red-700',
  };

  return (
    <div className={`bg-gradient-to-br ${phaseGradients[countdown.phaseColor] || phaseGradients.blue} rounded-2xl text-white relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-3xl" />
      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <div>
              <span className="font-bold text-xs">UGC NET</span>
              <span className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
                {l === 'hi' ? countdown.phaseHi : countdown.phase}
              </span>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
            <Settings className="w-3 h-3" />
          </button>
        </div>

        {editing ? (
          <div className="space-y-2 mb-3">
            <input type="date" value={tempDate || examDate} onChange={e => setTempDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/20 border border-white/20 text-white text-xs" />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 px-3 py-1.5 bg-white text-indigo-600 font-bold text-xs rounded-lg">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-white/10 text-xs rounded-lg">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {/* Main countdown */}
            <div className="text-center mb-3">
              <p className={`text-5xl font-black ${countdown.totalDays <= 7 ? 'animate-pulse' : ''}`}>
                {countdown.totalDays}
              </p>
              <p className="text-xs text-white/70">{l === 'hi' ? 'दिन शेष' : 'Days Left'}</p>
              <p className="text-[8px] text-white/40 mt-0.5">
                {countdown.months > 0 && `${countdown.months}m `}{countdown.weeks}w {countdown.remDays}d
                {' | '}{new Date(examDate).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-lg font-black">{countdown.pending}</p>
                <p className="text-[7px] text-white/50">{l === 'hi' ? 'बाकी टेस्ट' : 'Pending'}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-lg font-black">{countdown.testsPerDay}</p>
                <p className="text-[7px] text-white/50">{l === 'hi' ? 'टेस्ट/दिन' : 'Tests/Day'}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-lg font-black">{countdown.uncovered}</p>
                <p className="text-[7px] text-white/50">{l === 'hi' ? 'बाकी यूनिट' : 'Units Left'}</p>
              </div>
            </div>

            {/* Readiness meter */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-white/60">{l === 'hi' ? 'तैयारी स्कोर' : 'Readiness'}</span>
                <span className="text-[10px] font-bold">{countdown.readiness}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${countdown.readiness}%`,
                    background: countdown.readiness >= 70 ? '#22c55e' : countdown.readiness >= 40 ? '#f59e0b' : '#ef4444'
                  }} />
              </div>
            </div>

            {/* Daily plan */}
            {countdown.dailyPlan.length > 0 && (
              <div className="bg-white/10 rounded-lg p-2.5">
                <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lightbulb className="w-2.5 h-2.5" />{l === 'hi' ? 'आज का प्लान' : "Today's Plan"}
                </p>
                {countdown.dailyPlan.map((p, i) => (
                  <p key={i} className="text-[9px] text-white/70 flex items-start gap-1">
                    <ArrowRight className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                    {l === 'hi' ? p.hi : p.en}
                  </p>
                ))}
              </div>
            )}

            {/* Milestone progress */}
            <div className="flex items-center gap-1 mt-2">
              {countdown.milestones.slice(0, 5).map((m, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className={`w-full h-1 rounded-full mb-0.5 ${m.done ? 'bg-white/60' : 'bg-white/15'}`} />
                  <span className="text-[6px] text-white/40">{m.days}d</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 REVISION QUEUE CARD (Lowest % tests for revision)
// ════════════════════════════════════════════════════════════
const RevisionQueueCard = ({ queue, language, navigate }) => {
  const l = language;
  if (!queue || queue.length === 0) return null;

  const needsRevision = queue.filter(t => t.needsRevision);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-orange-200/50 dark:border-orange-800/30 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 px-4 py-3 border-b border-orange-200/50 dark:border-orange-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {l === 'hi' ? '🔄 रिवीजन कतार' : '🔄 Revision Queue'}
              </h3>
              <p className="text-[9px] text-gray-500">
                {l === 'hi' ? 'सबसे कम स्कोर वाले टेस्ट' : 'Lowest score tests - revise now'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            {needsRevision.length} {l === 'hi' ? 'बाकी' : 'due'}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-1.5 max-h-[350px] overflow-y-auto">
        {queue.slice(0, 10).map((t, i) => {
          const urgColors = {
            critical: 'border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/5',
            high: 'border-orange-200 bg-orange-50/30 dark:border-orange-900/20 dark:bg-orange-900/5',
            medium: 'border-amber-200 bg-amber-50/20 dark:border-amber-900/20 dark:bg-amber-900/5',
            low: 'border-gray-100 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-700/20',
          };

          return (
            <div key={t.testId || i}
              className={`group flex items-center gap-2.5 p-2.5 rounded-xl border hover:shadow-lg transition-all cursor-pointer
                ${urgColors[t.urgency] || urgColors.medium}`}
              onClick={() => navigate(`/test/${t.testId}`)}>
              {/* Rank */}
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0
                ${t.bestScore < 30 ? 'bg-red-500 text-white' : t.bestScore < 50 ? 'bg-orange-500 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
                  {t.test?.title || 'Test'}
                </h4>
                <div className="flex items-center gap-2 text-[8px] text-gray-500 mt-0.5">
                  <span>{t.attempts} {l === 'hi' ? 'बार' : 'att'}</span>
                  <span>{t.daysSince}d {l === 'hi' ? 'पहले' : 'ago'}</span>
                  {t.test?.paper && <span className={`px-1 rounded font-bold ${t.test.paper === 'paper1' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{t.test.paper === 'paper1' ? 'P1' : 'P2'}</span>}
                </div>
                {/* Memory retention bar */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[7px] text-gray-400">{l === 'hi' ? 'याद' : 'Memory'}:</span>
                  <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${t.retention}%`,
                      background: t.retention > 60 ? '#22c55e' : t.retention > 30 ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <span className="text-[7px] font-bold text-gray-500">{t.retention}%</span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-black ${t.bestScore < 30 ? 'text-red-600' : t.bestScore < 50 ? 'text-orange-600' : 'text-amber-600'}`}>
                  {t.bestScore}%
                </p>
                <p className="text-[7px] text-gray-400">{l === 'hi' ? 'सर्वश्रेष्ठ' : 'best'}</p>
              </div>

              {/* Retry button */}
              <button onClick={(e) => { e.stopPropagation(); navigate(`/test/${t.testId}`); }}
                className="p-1.5 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 transition-colors flex-shrink-0">
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {queue.length > 10 && (
        <div className="px-4 py-2 border-t border-orange-100 dark:border-orange-900/20 text-center">
          <span className="text-[9px] text-orange-600 dark:text-orange-400 font-semibold">
            +{queue.length - 10} {l === 'hi' ? 'और टेस्ट' : 'more tests'}
          </span>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 WEAK CHAPTERS CARD
// ════════════════════════════════════════════════════════════
const WeakChaptersCard = ({ chapters, language, navigate }) => {
  const l = language;
  if (!chapters || chapters.length === 0) return null;

  const weak = chapters.filter(c => c.status === 'critical' || c.status === 'weak');

  const statusConfig = {
    critical: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', bar: '#ef4444', label: l === 'hi' ? 'गंभीर' : 'Critical', dot: 'bg-red-500 animate-pulse' },
    weak: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', bar: '#f97316', label: l === 'hi' ? 'कमजोर' : 'Weak', dot: 'bg-orange-500' },
    average: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', bar: '#f59e0b', label: l === 'hi' ? 'ठीक-ठाक' : 'Average', dot: 'bg-amber-500' },
    strong: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', bar: '#22c55e', label: l === 'hi' ? 'मजबूत' : 'Strong', dot: 'bg-emerald-500' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200/50 dark:border-red-800/30 overflow-hidden">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 px-4 py-3 border-b border-red-200/50 dark:border-red-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {l === 'hi' ? '📊 कमजोर अध्याय' : '📊 Weak Chapters'}
              </h3>
              <p className="text-[9px] text-gray-500">
                {l === 'hi' ? 'प्रतिशत के हिसाब से' : 'Sorted by lowest percentage'}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {weak.length} {l === 'hi' ? 'कमजोर' : 'weak'}
          </span>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-2 mt-2">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const count = chapters.filter(c => c.status === key).length;
            if (count === 0) return null;
            return (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-[8px] text-gray-500">{cfg.label}: {count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
        {chapters.slice(0, 12).map((ch, i) => {
          const cfg = statusConfig[ch.status] || statusConfig.average;
          return (
            <div key={i} className={`p-2.5 rounded-xl border transition-all hover:shadow-md
              ${ch.status === 'critical' ? 'border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/5' :
              ch.status === 'weak' ? 'border-orange-200 bg-orange-50/20 dark:border-orange-900/20 dark:bg-orange-900/5' :
              'border-gray-100 bg-gray-50/30 dark:border-gray-700 dark:bg-gray-700/20'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{ch.unit}</span>
                  <span className={`px-1 rounded text-[7px] font-bold flex-shrink-0
                    ${ch.paper === 'paper1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                    {ch.paper === 'paper1' ? 'P1' : 'P2'}
                  </span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Score bar */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${ch.avgScore}%`, backgroundColor: cfg.bar }} />
                </div>
                <span className={`text-xs font-black w-10 text-right ${cfg.text}`}>{ch.avgScore}%</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-2 text-[8px] text-gray-500">
                <span>{l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'}: {ch.bestScore}%</span>
                <span>{l === 'hi' ? 'सटीकता' : 'Acc'}: {ch.accuracy}%</span>
                <span>{ch.attempts} {l === 'hi' ? 'बार' : 'att'}</span>
                <span>{ch.daysSince < 999 ? `${ch.daysSince}d ${l === 'hi' ? 'पहले' : 'ago'}` : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 FORGETTING CURVE CARD
// ════════════════════════════════════════════════════════════
const ForgettingCurveCard = ({ data, language, navigate }) => {
  const l = language;
  if (!data || data.totalTopics === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {l === 'hi' ? '🧠 भूलने की रेखा' : '🧠 Forgetting Curve'}
              </h3>
              <p className="text-[9px] text-gray-500">{l === 'hi' ? 'स्पेस्ड रिपीटिशन' : 'Spaced Repetition Tracker'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-gray-900 dark:text-white">{data.avgRetention}%</p>
            <p className="text-[7px] text-gray-400">{l === 'hi' ? 'औसत याद' : 'Avg Memory'}</p>
          </div>
        </div>
      </div>

      {/* Overdue section */}
      {data.dueForRevision.length > 0 && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/5 border-b border-red-100 dark:border-red-900/20">
          <p className="text-[9px] font-bold text-red-700 dark:text-red-400 flex items-center gap-1 mb-1.5">
            <AlertTriangle className="w-3 h-3" />
            {data.overdueCount} {l === 'hi' ? 'टॉपिक भूल रहे हो!' : 'topics fading from memory!'}
          </p>
          <div className="space-y-1">
            {data.dueForRevision.slice(0, 4).map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${t.urgency === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                  <span className="text-[9px] text-gray-700 dark:text-gray-300 truncate">{t.unit}</span>
                  <span className="text-[7px] text-gray-400">{t.daysSince}d</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${t.retention}%`,
                      background: t.retention > 50 ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                  <span className="text-[7px] font-bold text-red-600">{t.retention}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {data.upcoming.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
            {l === 'hi' ? 'जल्दी रिवीजन करो' : 'Revise Soon'}
          </p>
          {data.upcoming.slice(0, 3).map((t, i) => (
            <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
              <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{t.unit}</span>
              <span className="text-amber-600 font-bold flex-shrink-0">{t.daysUntilDue}d {l === 'hi' ? 'में' : 'left'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Safe topics count */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {data.safe.length} {l === 'hi' ? 'सुरक्षित' : 'topics safe'}
          </span>
          <span className="text-gray-400">{data.totalTopics} {l === 'hi' ? 'कुल' : 'total'}</span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 DAILY CHALLENGE CARD
// ════════════════════════════════════════════════════════════
const DailyChallengeCard = ({ challenge, language }) => {
  const l = language;
  if (!challenge) return null;

  const iconMap2 = { Star, Zap, Target, Flame, Shield, RefreshCw, BarChart2, Timer };
  const Icon = iconMap2[challenge.icon] || Star;

  const colorMap2 = {
    amber: 'from-amber-500 to-yellow-600', cyan: 'from-cyan-500 to-blue-600',
    emerald: 'from-emerald-500 to-green-600', orange: 'from-orange-500 to-red-600',
    blue: 'from-blue-500 to-indigo-600', red: 'from-red-500 to-rose-600',
    indigo: 'from-indigo-500 to-purple-600', purple: 'from-purple-500 to-violet-600',
  };
  const grad = colorMap2[challenge.color] || colorMap2.amber;

  return (
    <div className={`bg-gradient-to-br ${grad} rounded-2xl p-4 text-white relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              {l === 'hi' ? 'आज की चुनौती' : "Today's Challenge"}
            </span>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20">+{challenge.xp} XP</span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center ${challenge.completed ? 'ring-2 ring-yellow-300' : ''}`}>
            {challenge.completed ? <Trophy className="w-5 h-5 text-yellow-300" /> : <Icon className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{l === 'hi' ? challenge.titleHi : challenge.title}</p>
            <p className="text-[9px] text-white/60">
              {challenge.current}/{challenge.target}{challenge.type === 'pct' ? '%' : ''}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 bg-white/15 rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full transition-all duration-1000 ${challenge.completed ? 'bg-yellow-300' : 'bg-white/60'}`}
            style={{ width: `${challenge.pct}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-white/40">{challenge.pct}%</span>
          {challenge.completed && (
            <span className="text-[9px] font-bold text-yellow-300 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />{l === 'hi' ? 'पूरा!' : 'Complete!'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 PLAYER LEVEL CARD
// ════════════════════════════════════════════════════════════
const PlayerLevelCard = ({ level, language }) => {
  const l = language;
  if (!level) return null;

  const colorBgs = {
    gray: 'from-gray-500 to-slate-600', blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-green-600', purple: 'from-purple-500 to-violet-600',
    indigo: 'from-indigo-500 to-blue-700', amber: 'from-amber-500 to-yellow-600',
    orange: 'from-orange-500 to-red-600', red: 'from-red-500 to-rose-700',
  };

  return (
    <div className={`bg-gradient-to-br ${colorBgs[level.current.color] || colorBgs.blue} rounded-2xl p-4 text-white relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg border border-white/20">
              <Crown className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Level {level.current.level}</p>
              <p className="text-base font-black">{l === 'hi' ? level.current.nameHi : level.current.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black">{level.totalXP}</p>
            <p className="text-[8px] text-white/50">Total XP</p>
          </div>
        </div>

        {/* Progress to next level */}
        {level.next && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-white/50">
                {l === 'hi' ? 'अगला' : 'Next'}: {l === 'hi' ? level.next.nameHi : level.next.name}
              </span>
              <span className="text-[9px] font-bold">{level.inLevel}/{level.forNext} XP</span>
            </div>
            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-300 rounded-full transition-all duration-1000"
                style={{ width: `${level.pct}%` }} />
            </div>
            <p className="text-[7px] text-white/40 mt-0.5 text-right">
              {level.forNext - level.inLevel} XP {l === 'hi' ? 'और चाहिए' : 'to go'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 FATIGUE ANALYSIS CARD
// ════════════════════════════════════════════════════════════
const FatigueCard = ({ data, language }) => {
  const l = language;
  if (!data || data.chart.length < 2) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? '😴 थकान विश्लेषण' : '😴 Fatigue Analysis'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'सत्र में प्रदर्शन गिरावट' : 'Performance drop in sessions'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-black ${data.dropPct > 15 ? 'text-red-600' : 'text-emerald-600'}`}>
            {data.dropPct > 0 ? `-${data.dropPct}%` : 'Stable'}
          </p>
          <p className="text-[7px] text-gray-400">{l === 'hi' ? 'गिरावट' : 'drop'}</p>
        </div>
      </div>

      <div className="p-4">
        {/* Chart */}
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chart} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <defs>
                <linearGradient id="fatigue_grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <Tooltip content={<CTooltip />} />
              <Area type="monotone" dataKey="avgScore" stroke="#f43f5e" strokeWidth={2.5} fill="url(#fatigue_grad)" dot={{ r: 3, fill: '#f43f5e' }} name={l === 'hi' ? 'स्कोर%' : 'Score%'} />
              <Area type="monotone" dataKey="avgAccuracy" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} dot={false} name={l === 'hi' ? 'सटीकता%' : 'Accuracy%'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendation */}
        <div className={`mt-3 p-2.5 rounded-xl border
          ${data.dropPct > 15 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30' :
          data.dropPct > 5 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30' :
          'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30'}`}>
          <div className="flex items-center gap-2">
            <Lightbulb className={`w-4 h-4 flex-shrink-0
              ${data.dropPct > 15 ? 'text-red-500' : data.dropPct > 5 ? 'text-amber-500' : 'text-emerald-500'}`} />
            <div>
              <p className="text-[10px] font-semibold text-gray-900 dark:text-white">
                {l === 'hi' ? `बेस्ट: ${data.optimalTests} टेस्ट/सत्र` : `Optimal: ${data.optimalTests} tests/session`}
              </p>
              <p className="text-[8px] text-gray-500">{l === 'hi' ? data.recHi : data.rec}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-bold text-gray-900 dark:text-white">{data.sessions}</p>
            <p className="text-[7px] text-gray-400">{l === 'hi' ? 'सत्र' : 'Sessions'}</p>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-bold text-gray-900 dark:text-white">{data.avgSessionLen}</p>
            <p className="text-[7px] text-gray-400">{l === 'hi' ? 'औसत/सत्र' : 'Avg/Session'}</p>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-bold text-gray-900 dark:text-white">{data.optimalTests}</p>
            <p className="text-[7px] text-gray-400">{l === 'hi' ? 'बेस्ट काउंट' : 'Best Count'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 WEEKLY REPORT CARD
// ════════════════════════════════════════════════════════════
const WeeklyReportCard = ({ data, language }) => {
  const l = language;
  if (!data || data.totalTests === 0) return null;

  const maxTests = Math.max(...data.daily.map(d => d.tests), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? '📋 साप्ताहिक रिपोर्ट' : '📋 Weekly Report'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'इस हफ्ते का सारांश' : "This week's summary"}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Daily bar chart */}
        <div className="flex items-end gap-1.5 mb-4" style={{ height: 60 }}>
          {data.daily.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-[7px] font-bold text-gray-500 mb-0.5">{d.tests > 0 ? d.tests : ''}</span>
              <div className={`w-full rounded-t-md transition-all duration-700 ${d.isToday ? 'bg-indigo-500' : d.tests > 0 ? 'bg-blue-400' : 'bg-gray-100 dark:bg-gray-700'}`}
                style={{ height: `${Math.max((d.tests / maxTests) * 100, d.tests > 0 ? 15 : 5)}%` }} />
              <span className={`text-[8px] mt-0.5 font-medium ${d.isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>{d.day}</span>
              {d.tests > 0 && <span className="text-[6px] text-gray-400">{d.avgScore}%</span>}
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: l === 'hi' ? 'टेस्ट' : 'Tests', v: data.totalTests, c: 'text-blue-600', i: ClipboardList },
            { l: l === 'hi' ? 'औसत' : 'Avg', v: `${data.avgScore}%`, c: 'text-emerald-600', i: Gauge },
            { l: l === 'hi' ? 'सटीकता' : 'Acc', v: `${data.accuracy}%`, c: 'text-purple-600', i: Target },
            { l: l === 'hi' ? 'सक्रिय दिन' : 'Active', v: `${data.activeDays}/7`, c: 'text-amber-600', i: Flame },
          ].map((s, i) => (
            <div key={i} className="text-center p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30">
              <s.i className={`w-3 h-3 mx-auto mb-0.5 ${s.c}`} />
              <p className={`text-sm font-black ${s.c}`}>{s.v}</p>
              <p className="text-[7px] text-gray-400 uppercase">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Time studied */}
        <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500 px-1">
          <span>{l === 'hi' ? 'कुल समय' : 'Total time'}: <b className="text-gray-700 dark:text-gray-300">{fmtTime(data.totalTime)}</b></span>
          <span>{l === 'hi' ? 'सबसे अच्छा' : 'Best'}: <b className="text-emerald-600">{data.bestScore}%</b></span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 NEGATIVE MARKING IMPACT CARD
// ════════════════════════════════════════════════════════════
const NegativeMarkingCard = ({ data, language }) => {
  const l = language;
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow">
          <Minus className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? '➖ नेगेटिव मार्किंग' : '➖ Negative Marking'}</h3>
          <p className="text-[9px] text-gray-500">{l === 'hi' ? 'प्रभाव विश्लेषण' : 'Impact Analysis'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
          <p className="text-lg font-black text-red-600 dark:text-red-400">-{data.totalNeg}</p>
          <p className="text-[7px] text-red-500/60 uppercase">{l === 'hi' ? 'कुल कटे' : 'Total Lost'}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/30">
          <p className="text-lg font-black text-orange-600 dark:text-orange-400">-{data.avgPer}</p>
          <p className="text-[7px] text-orange-500/60 uppercase">{l === 'hi' ? 'औसत/टेस्ट' : 'Avg/Test'}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">+{data.potential}</p>
          <p className="text-[7px] text-emerald-500/60 uppercase">{l === 'hi' ? 'बचा सकते थे' : 'Could Save'}</p>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border ${data.avgPer > 2 ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30'}`}>
        <div className="flex items-center gap-1.5">
          <Lightbulb className={`w-3.5 h-3.5 ${data.avgPer > 2 ? 'text-red-500' : 'text-emerald-500'}`} />
          <p className={`text-[9px] font-semibold ${data.avgPer > 2 ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {l === 'hi' ? data.recHi : data.rec}
          </p>
        </div>
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════════════════
//   ADVANCED GOAL TRACKER (Fully Working + Pressure)
// ════════════════════════════════════════════════════════════
const GoalTracker = ({
  goals, completionPct, todayActivity, todayDetailed, yesterdayActivity,
  customTargets, updateCustomTargets, dayProgress, goalStreak,
  goalsCompleted, totalGoals, pressureMessage, todayXP, streak,
  language, navigate
}) => {
  const l = language;
  const [showSettings, setShowSettings] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Celebration effect when all goals done
  useEffect(() => {
    if (completionPct === 100 && todayDetailed?.count > 0 && !celebrating) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 5000);
      return () => clearTimeout(t);
    }
  }, [completionPct, todayDetailed]);

  const iconMap = {
    ClipboardList, Target, TrendingUp, Clock, RefreshCw, Flame,
    Timer, BarChart2, Hash, Zap,
  };

  const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500', ring: '#3b82f6', glow: 'shadow-blue-500/20' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', ring: '#22c55e', glow: 'shadow-emerald-500/20' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500', ring: '#8b5cf6', glow: 'shadow-purple-500/20' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', ring: '#f59e0b', glow: 'shadow-amber-500/20' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', ring: '#ef4444', glow: 'shadow-red-500/20' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500', ring: '#f97316', glow: 'shadow-orange-500/20' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500', ring: '#06b6d4', glow: 'shadow-cyan-500/20' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500', ring: '#6366f1', glow: 'shadow-indigo-500/20' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500', ring: '#14b8a6', glow: 'shadow-teal-500/20' },
  };

  const urgencyColors = {
    critical: 'bg-red-500 animate-pulse',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    normal: 'bg-gray-300 dark:bg-gray-600',
  };

  const pressureColors = {
    celebration: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', icon: Trophy },
    critical: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-300 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: AlertTriangle },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
    positive: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', icon: Sparkles },
    info: { bg: 'bg-gray-50 dark:bg-gray-700/30', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400', icon: Info },
  };

  const dp = dayProgress || { pct: 0, remainingHours: 0, remainingMins: 0, isAlmostOver: false, isPastHalf: false };
  const pm = pressureMessage || { type: 'info', en: '', hi: '' };
  const pmStyle = pressureColors[pm.type] || pressureColors.info;
  const PMIcon = pmStyle.icon;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden ${celebrating ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20' : ''}`}>

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow ${celebrating ? 'animate-bounce' : ''}`}>
              <Crosshair className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                {l === 'hi' ? 'आज के लक्ष्य' : "Today's Goals"}
                {celebrating && <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-spin" />}
              </h3>
              <p className="text-[9px] text-gray-500">
                {goalsCompleted}/{totalGoals} {l === 'hi' ? 'पूरे' : 'done'}
                {goalStreak > 0 && <span className="ml-1 text-amber-600 dark:text-amber-400 font-bold"> | {goalStreak}d {l === 'hi' ? 'गोल स्ट्रीक' : 'goal streak'}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* XP Badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[9px] font-black text-amber-700 dark:text-amber-400">{todayXP} XP</span>
            </div>
            <Ring pct={completionPct} size={36} sw={3}
              color={completionPct === 100 ? '#22c55e' : completionPct >= 50 ? '#f59e0b' : '#ef4444'}>
              <span className="text-[7px] font-bold text-gray-600 dark:text-gray-300">{completionPct}%</span>
            </Ring>
            <button onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ── DAY PROGRESS BAR ── */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] text-gray-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {l === 'hi' ? 'दिन की प्रगति' : 'Day Progress'}
            </span>
            <span className={`text-[8px] font-bold ${dp.isAlmostOver ? 'text-red-600 dark:text-red-400 animate-pulse' : dp.isPastHalf ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
              {dp.remainingHours}h {dp.remainingMins}m {l === 'hi' ? 'बाकी' : 'left'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${dp.pct}%`,
                background: dp.isAlmostOver ? 'linear-gradient(90deg, #ef4444, #f97316)' : dp.isPastHalf ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #3b82f6, #6366f1)',
              }} />
            {/* Goal completion overlay */}
            <div className="absolute top-0 h-full rounded-full bg-emerald-500/30"
              style={{ width: `${completionPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[7px] text-gray-400">{dp.pct}% {l === 'hi' ? 'बीत चुका' : 'elapsed'}</span>
            <span className="text-[7px] text-gray-400">{completionPct}% {l === 'hi' ? 'लक्ष्य' : 'goals'}</span>
          </div>
        </div>

        {/* ── TODAY'S STATS STRIP ── */}
        <div className="flex items-center gap-2 text-[8px] flex-wrap">
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
            <ClipboardList className="w-2.5 h-2.5" />{todayDetailed?.count || 0} {l === 'hi' ? 'टेस्ट' : 'tests'}
          </span>
          {(todayDetailed?.count || 0) > 0 && (
            <>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                <Target className="w-2.5 h-2.5" />{todayDetailed?.accuracy || 0}%
              </span>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold">
                <BarChart3 className="w-2.5 h-2.5" />{todayDetailed?.avgScore || 0}% avg
              </span>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-bold">
                <Timer className="w-2.5 h-2.5" />{Math.round((todayDetailed?.timeSpent || 0) / 60)}m
              </span>
            </>
          )}
          {/* Yesterday comparison */}
          {(yesterdayActivity?.count || 0) > 0 && (
            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold
              ${(todayDetailed?.count || 0) > yesterdayActivity.count
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : (todayDetailed?.count || 0) < yesterdayActivity.count
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
              {(todayDetailed?.count || 0) >= yesterdayActivity.count
                ? <ArrowUp className="w-2.5 h-2.5" />
                : <ArrowDown className="w-2.5 h-2.5" />}
              vs {l === 'hi' ? 'कल' : 'yday'}: {yesterdayActivity.count}
            </span>
          )}
        </div>
      </div>

      {/* ── PRESSURE MESSAGE ── */}
      <div className={`px-4 py-2 border-b border-gray-100 dark:border-gray-700 ${pmStyle.bg} border-l-4 ${pmStyle.border}`}>
        <div className="flex items-center gap-2">
          <PMIcon className={`w-3.5 h-3.5 flex-shrink-0 ${pmStyle.text} ${pm.type === 'critical' ? 'animate-pulse' : ''}`} />
          <p className={`text-[10px] font-semibold ${pmStyle.text}`}>
            {l === 'hi' ? pm.hi : pm.en}
          </p>
        </div>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 mb-2">{l === 'hi' ? 'लक्ष्य सेटिंग्स' : 'Goal Settings'}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'dailyTests', label: l === 'hi' ? 'दैनिक टेस्ट' : 'Daily Tests', min: 1, max: 20 },
              { key: 'dailyAccuracy', label: l === 'hi' ? 'सटीकता %' : 'Accuracy %', min: 30, max: 100 },
              { key: 'targetScore', label: l === 'hi' ? 'लक्ष्य स्कोर %' : 'Target Score %', min: 40, max: 100 },
            ].map(s => (
              <div key={s.key}>
                <label className="text-[9px] text-gray-500">{s.label}</label>
                <input type="number" value={customTargets[s.key]} min={s.min} max={s.max}
                  onChange={e => updateCustomTargets({ ...customTargets, [s.key]: parseInt(e.target.value) || s.min })}
                  className="w-full px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GOALS LIST ── */}
      <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
        {goals.map((goal, i) => {
          const Icon = iconMap[goal.icon] || Target;
          const cc = colorMap[goal.color] || colorMap.blue;
          const pct = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
          const done = goal.current >= goal.target;
          const isOverAchieved = goal.current > goal.target;
          const urgDot = urgencyColors[goal.urgency] || urgencyColors.normal;

          return (
            <div key={goal.id || i}
              className={`relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-all
                ${done
                  ? `bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30 ${isOverAchieved ? 'ring-1 ring-emerald-300 dark:ring-emerald-700' : ''}`
                  : goal.urgency === 'critical'
                  ? 'bg-red-50/30 border-red-200 dark:bg-red-900/5 dark:border-red-900/30'
                  : goal.urgency === 'high'
                  ? 'bg-orange-50/30 border-orange-200 dark:bg-orange-900/5 dark:border-orange-900/30'
                  : 'bg-gray-50/50 border-gray-100 dark:bg-gray-700/20 dark:border-gray-700/50'
                }`}>

              {/* Urgency dot */}
              {!done && goal.urgency !== 'normal' && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${urgDot}`} />
              )}

              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                ${done ? 'bg-emerald-100 dark:bg-emerald-900/30 shadow-sm' : cc.bg}`}>
                {done
                  ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  : <Icon className={`w-4 h-4 ${cc.text}`} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-[11px] font-semibold truncate pr-4
                    ${done ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {l === 'hi' ? goal.titleHi : goal.title}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[9px] font-black
                      ${done ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? cc.text : 'text-gray-500'}`}>
                      {goal.current}{goal.type === 'percentage' ? '%' : ''}/{goal.target}{goal.type === 'percentage' ? '%' : ''}
                    </span>
                    {/* XP badge */}
                    {done && (
                      <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        +{goal.xp}XP
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className={`text-[8px] mb-1 ${done ? 'text-emerald-600/60 dark:text-emerald-400/60' : 'text-gray-500'}`}>
                  {l === 'hi' ? goal.descriptionHi : goal.description}
                </p>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${done ? 'bg-emerald-500' : cc.bar}`}
                    style={{ width: `${pct}%` }} />
                </div>

                {/* Priority badge */}
                {!done && (
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[7px] font-bold uppercase tracking-wider
                      ${goal.priority === 'critical' ? 'text-red-500' :
                      goal.priority === 'high' ? 'text-orange-500' :
                      goal.priority === 'medium' ? 'text-blue-500' : 'text-gray-400'}`}>
                      {goal.priority}
                    </span>
                    <span className="text-[7px] text-gray-400">{pct}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400">
              {l === 'hi' ? 'गोल स्ट्रीक' : 'Goal Streak'}: <b className="text-amber-600 dark:text-amber-400">{goalStreak}d</b>
            </span>
            <span className="text-[8px] text-gray-400">|</span>
            <span className="text-[8px] text-gray-400">
              XP: <b className="text-indigo-600 dark:text-indigo-400">{todayXP}</b>
            </span>
          </div>
          {(todayDetailed?.count || 0) === 0 && (
            <button onClick={() => navigate && navigate('/tests')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[9px] font-bold rounded-lg hover:shadow-lg transition-all">
              <Play className="w-3 h-3" />{l === 'hi' ? 'शुरू करो!' : 'Start Now!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   SYLLABUS COVERAGE HEATMAP (FIXED)
// ════════════════════════════════════════════════════════════
const SyllabusCoverageMap = ({ coverage, language }) => {
  const l = language;
  const [activeTab, setActiveTab] = useState('paper1');

  const data = activeTab === 'paper1' ? coverage.paper1 : coverage.paper2;
  const summary = activeTab === 'paper1' ? coverage.paper1Summary : coverage.paper2Summary;

  const levelLabels = {
    mastered: { en: 'Mastered', hi: 'माहिर', color: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10' },
    learning: { en: 'Learning', hi: 'सीख रहे', color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10' },
    in_progress: { en: 'In Progress', hi: 'प्रगति में', color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10' },
    weak: { en: 'Weak', hi: 'कमजोर', color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400', border: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10' },
    not_started: { en: 'Not Started', hi: 'शुरू नहीं', color: 'bg-gray-400 dark:bg-gray-500', textColor: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/20' },
    no_tests: { en: 'No Tests', hi: 'कोई टेस्ट नहीं', color: 'bg-gray-300 dark:bg-gray-600', textColor: 'text-gray-400 dark:text-gray-500', border: 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30' },
  };

  // Map summary keys to levelLabels keys
  const summaryKeyMap = {
    mastered: 'mastered',
    learning: 'learning',
    in_progress: 'inProgress',
    weak: 'weak',
    not_started: 'notStarted',
    no_tests: 'noTests',
  };

  // Test type display labels
  const testTypeLabels = {
    dpp: 'DPP', topic_test: 'Topic', chapter_test: 'Chapter',
    unit_test: 'Unit', practice: 'Practice', pyq_year: 'PYQ',
    full_mock_p1: 'Mock P1', full_mock_p2: 'Mock P2', full_mock_combined: 'Mock',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow">
              <Grid3X3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {l === 'hi' ? 'सिलेबस कवरेज' : 'Syllabus Coverage'}
              </h3>
              <p className="text-[9px] text-gray-500">
                {l === 'hi' ? 'टेस्ट आधारित प्रगति' : 'Test-based progress'}
              </p>
            </div>
          </div>
          <Ring pct={coverage.overallPct} size={40} sw={3.5} color="#14b8a6">
            <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300">{coverage.overallPct}%</span>
          </Ring>
        </div>

        {/* Paper tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {['paper1', 'paper2'].map(tab => {
            const tabSummary = tab === 'paper1' ? coverage.paper1Summary : coverage.paper2Summary;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all
                  ${activeTab === tab ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'paper1' ? 'Paper 1' : 'Paper 2'}
                <span className={`ml-1 text-[8px] px-1 rounded-full ${activeTab === tab ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  {tabSummary.overallPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary strip */}
      <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-700/20 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(levelLabels).map(([key, val]) => {
            const summaryField = summaryKeyMap[key];
            const count = summaryField ? (summary[summaryField] || 0) : 0;
            return (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-sm ${val.color}`} />
                <span className="text-[8px] text-gray-500">{val[l] || val.en}: {count}</span>
              </div>
            );
          })}
        </div>
        {/* Test counts */}
        <div className="flex items-center gap-3 mt-1 text-[8px] text-gray-400">
          <span>{l === 'hi' ? 'बनाए' : 'Created'}: {summary.totalTestsCreated || 0}</span>
          <span>{l === 'hi' ? 'दिए' : 'Attempted'}: {summary.totalTestsAttempted || 0}</span>
          <span>{l === 'hi' ? 'बाकी' : 'Pending'}: {summary.totalTestsPending || 0}</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {data.map((unit, i) => {
            const ll = levelLabels[unit.level] || levelLabels.not_started;
            const borderClass = ll.border || 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/20';

            return (
              <div key={i} className="relative group">
                <div className={`p-2.5 rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer ${borderClass}`}>
                  {/* Unit header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase">{unit.unit}</span>
                    <div className="flex items-center gap-1">
                      {unit.accuracy > 0 && (
                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded-full ${ll.color} text-white`}>
                          {unit.accuracy}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Unit name */}
                  <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate mb-1.5">
                    {unit.name}
                  </p>

                  {/* Test stats */}
                  <div className="flex items-center gap-1.5 text-[8px] text-gray-500 mb-1">
                    <span className="flex items-center gap-0.5">
                      <ClipboardList className="w-2.5 h-2.5" />
                      {unit.attemptedCount}/{unit.totalTests}
                    </span>
                    {unit.questionsAttempted > 0 && (
                      <span className="flex items-center gap-0.5">
                        <FileQuestion className="w-2.5 h-2.5" />
                        {unit.questionsAttempted}Q
                      </span>
                    )}
                    {unit.bestScore > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Trophy className="w-2.5 h-2.5 text-amber-500" />
                        {unit.bestScore}%
                      </span>
                    )}
                  </div>

                  {/* Test type badges */}
                  {unit.testTypeBreakdown && Object.keys(unit.testTypeBreakdown).length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mb-1.5">
                      {Object.entries(unit.testTypeBreakdown).map(([type, td]) => (
                        <span key={type} className={`text-[6px] font-bold px-1 py-0.5 rounded
                          ${td.attempted >= td.total
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : td.attempted > 0
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                          {testTypeLabels[type] || type}: {td.attempted}/{td.total}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Coverage progress bar */}
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${unit.totalTests > 0 ? Math.round((unit.attemptedCount / unit.totalTests) * 100) : 0}%`,
                        backgroundColor: unit.color || '#d1d5db'
                      }} />
                  </div>

                  {/* Level label */}
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[7px] font-bold ${ll.textColor}`}>
                      {ll[l] || ll.en}
                    </span>
                    {unit.totalTests > 0 && (
                      <span className="text-[7px] text-gray-400">
                        {Math.round((unit.attemptedCount / unit.totalTests) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No data message */}
        {data.length === 0 && (
          <div className="text-center py-8">
            <Grid3X3 className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-xs text-gray-400">{l === 'hi' ? 'कोई डेटा नहीं' : 'No data available'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   SPEED ANALYTICS CARD
// ════════════════════════════════════════════════════════════
const SpeedAnalyticsCard = ({ data, language }) => {
  const l = language;
  if (!data || data.speedTrend.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गति विश्लेषण' : 'Speed Analytics'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'प्रति प्रश्न समय' : 'Time per question'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-gray-900 dark:text-white">{data.avgTimePerQ}s</p>
          <p className="text-[8px] text-gray-400">{l === 'hi' ? 'औसत' : 'avg'}/Q</p>
        </div>
      </div>

      <div className="p-4">
        {/* Speed vs Accuracy Chart */}
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.speedTrend} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
              <Tooltip content={<CTooltip />} />
              <Line type="monotone" dataKey="speed" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} name={l === 'hi' ? 'गति(s)' : 'Speed(s)'} />
              <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} name={l === 'hi' ? 'सटीकता%' : 'Accuracy%'} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <Zap className="w-3 h-3 mx-auto mb-0.5 text-emerald-500" />
            <p className="text-xs font-bold text-gray-900 dark:text-white">{data.fastestTest?.avgTime || 0}s</p>
            <p className="text-[7px] text-gray-400 uppercase">{l === 'hi' ? 'सबसे तेज' : 'Fastest'}</p>
          </div>
          <div className="text-center">
            <Timer className="w-3 h-3 mx-auto mb-0.5 text-blue-500" />
            <p className="text-xs font-bold text-gray-900 dark:text-white">{data.avgTimePerQ}s</p>
            <p className="text-[7px] text-gray-400 uppercase">{l === 'hi' ? 'औसत' : 'Average'}</p>
          </div>
          <div className="text-center">
            <Hourglass className="w-3 h-3 mx-auto mb-0.5 text-amber-500" />
            <p className="text-xs font-bold text-gray-900 dark:text-white">{data.slowestTest?.avgTime || 0}s</p>
            <p className="text-[7px] text-gray-400 uppercase">{l === 'hi' ? 'सबसे धीमा' : 'Slowest'}</p>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[9px] font-bold text-gray-500 mb-2 uppercase">{l === 'hi' ? 'समय वितरण' : 'Time Distribution'}</p>
          <div className="flex items-end gap-1" style={{ height: 40 }}>
            {data.timeDistribution.map((b, i) => {
              const maxVal = Math.max(...data.timeDistribution.map(d => d.value), 1);
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full rounded-t-sm bg-gradient-to-t from-cyan-500 to-blue-400 transition-all duration-700"
                    style={{ height: `${Math.max((b.value / maxVal) * 100, 5)}%` }} />
                  <span className="text-[6px] text-gray-400 mt-0.5">{b.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   STUDY RECOMMENDATIONS
// ════════════════════════════════════════════════════════════
const StudyRecommendations = ({ recommendations, language, navigate }) => {
  const l = language;
  if (!recommendations || recommendations.length === 0) return null;

  const iconMap = {
    AlertTriangle, BookOpen, Target, TrendingDown, Clock, Flame, BarChart2, Zap, Lightbulb,
  };

  const priorityColors = {
    critical: 'border-red-300 bg-red-50/50 dark:border-red-800/30 dark:bg-red-900/5',
    high: 'border-orange-300 bg-orange-50/50 dark:border-orange-800/30 dark:bg-orange-900/5',
    medium: 'border-blue-300 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-900/5',
    low: 'border-gray-200 bg-gray-50/50 dark:border-gray-700/30 dark:bg-gray-700/10',
  };

  const colorBg = {
    red: 'from-red-500 to-rose-600', orange: 'from-orange-500 to-amber-600',
    blue: 'from-blue-500 to-indigo-600', purple: 'from-purple-500 to-violet-600',
    amber: 'from-amber-500 to-yellow-600', cyan: 'from-cyan-500 to-teal-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {l === 'hi' ? 'स्मार्ट सुझाव' : 'Smart Recommendations'}
          </h3>
          <p className="text-[9px] text-gray-500">{l === 'hi' ? 'आपके डेटा पर आधारित' : 'Based on your data'}</p>
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {recommendations.map((rec, i) => {
          const Icon = iconMap[rec.icon] || Lightbulb;
          const bgGrad = colorBg[rec.color] || colorBg.blue;
          return (
            <div key={rec.id || i}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all hover:shadow-md ${priorityColors[rec.priority] || priorityColors.medium}`}>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${bgGrad} flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-900 dark:text-white">
                  {l === 'hi' ? rec.titleHi : rec.title}
                </p>
                <p className="text-[9px] text-gray-500 mt-0.5">
                  {l === 'hi' ? rec.detailHi : rec.detail}
                </p>
              </div>
              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                ${rec.priority === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                rec.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                rec.priority === 'medium' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {rec.priority}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   SCORE DISTRIBUTION CHART
// ════════════════════════════════════════════════════════════
const ScoreDistributionCard = ({ data, language }) => {
  const l = language;
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow">
          <BarChart2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'स्कोर वितरण' : 'Score Distribution'}</h3>
          <p className="text-[9px] text-gray-500">{l === 'hi' ? 'सभी टेस्ट' : 'All tests'}</p>
        </div>
      </div>

      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300 mb-1">{d.count}</span>
            <div className="w-full rounded-t-lg transition-all duration-1000 relative group" style={{
              height: `${Math.max((d.count / maxCount) * 100, 5)}%`,
              backgroundColor: d.color,
            }}>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap">
                {d.pct}%
              </div>
            </div>
            <span className="text-[8px] text-gray-400 mt-1 font-medium">{d.range}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   PERSONAL RECORDS BOARD
// ════════════════════════════════════════════════════════════
const PersonalRecords = ({ records, language }) => {
  const l = language;
  if (!records || !records.highestScore) return null;

  const items = [
    { icon: Trophy, label: l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best Score', value: `${records.highestScore?.pct || 0}%`, sub: records.highestScore?.title, color: 'from-amber-500 to-yellow-600' },
    { icon: Target, label: l === 'hi' ? 'सटीकता' : 'Best Accuracy', value: `${records.bestAccuracy?.accuracy || 0}%`, sub: records.bestAccuracy?.title, color: 'from-emerald-500 to-green-600' },
    { icon: Flame, label: l === 'hi' ? 'स्ट्रीक' : 'Best Streak', value: `${records.longestStreak || 0}d`, sub: `Current: ${records.currentStreak}d`, color: 'from-orange-500 to-red-600' },
    { icon: Calendar, label: l === 'hi' ? 'सर्वश्रेष्ठ दिन' : 'Best Day', value: records.bestDay?.count || 0, sub: records.bestDay?.date ? new Date(records.bestDay.date).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short' }) : '-', color: 'from-blue-500 to-indigo-600' },
    { icon: Clock, label: l === 'hi' ? 'कुल समय' : 'Study Time', value: fmtTime(records.totalStudyTime || 0), sub: `${records.totalTestsTaken} tests`, color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
          <Crown className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'व्यक्तिगत रिकॉर्ड' : 'Personal Records'}</h3>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {items.map((item, i) => (
          <div key={i} className="text-center p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm mx-auto mb-1.5`}>
              <item.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-black text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-[8px] text-gray-400 uppercase">{item.label}</p>
            {item.sub && <p className="text-[7px] text-gray-400 truncate mt-0.5">{item.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   TIME OF DAY ANALYSIS
// ════════════════════════════════════════════════════════════
const TimeOfDayCard = ({ data, language }) => {
  const l = language;
  if (!data || !data.bestPeriod) return null;

  const periodIcons = { Sun, Coffee, Sunset, Moon };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'समय विश्लेषण' : 'Best Study Time'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'सबसे अच्छा प्रदर्शन समय' : 'When you perform best'}</p>
          </div>
        </div>
      </div>

      {/* Period cards */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {data.periodData.map((p, i) => {
          const PIcon = periodIcons[p.icon] || Sun;
          const isBest = p.name === data.bestPeriod?.name;
          return (
            <div key={i} className={`text-center p-2 rounded-xl border transition-all
              ${isBest ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20'}`}>
              <PIcon className={`w-4 h-4 mx-auto mb-1 ${isBest ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
              <p className={`text-xs font-bold ${isBest ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                {p.avgScore}%
              </p>
              <p className="text-[7px] text-gray-400">{l === 'hi' ? p.nameHi : p.name}</p>
              <p className="text-[7px] text-gray-400">{p.count} tests</p>
              {isBest && <span className="text-[6px] font-bold text-indigo-600 dark:text-indigo-400">BEST</span>}
            </div>
          );
        })}
      </div>

      {data.bestHour && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-2 border border-indigo-200/50 dark:border-indigo-800/30">
          <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold">
            {l === 'hi' ? `सबसे अच्छा समय: ${data.bestHour.label} (${data.bestHour.avgScore}% avg)` : `Peak time: ${data.bestHour.label} (${data.bestHour.avgScore}% avg)`}
          </p>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   ACTIVITY HEATMAP CALENDAR
// ════════════════════════════════════════════════════════════
const ActivityHeatmap = ({ activityMap, language }) => {
  const l = language;
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate last 90 days
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const data = activityMap[key];
      result.push({
        date: key,
        day: d.getDate(),
        month: d.getMonth(),
        dayOfWeek: d.getDay(),
        count: data?.count || 0,
        avgScore: data?.avgScore || 0,
        avgAccuracy: data?.avgAccuracy || 0,
      });
    }
    return result;
  }, [activityMap]);

  const maxCount = Math.max(...days.map(d => d.count), 1);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = count / maxCount;
    if (intensity > 0.75) return 'bg-emerald-600 dark:bg-emerald-500';
    if (intensity > 0.5) return 'bg-emerald-500 dark:bg-emerald-600';
    if (intensity > 0.25) return 'bg-emerald-400 dark:bg-emerald-700';
    return 'bg-emerald-200 dark:bg-emerald-800';
  };

  // Group by weeks
  const weeks = [];
  let currentWeek = [];
  days.forEach((d, i) => {
    currentWeek.push(d);
    if (d.dayOfWeek === 6 || i === days.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गतिविधि कैलेंडर' : 'Activity Calendar'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'पिछले 90 दिन' : 'Last 90 days'}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <span className="text-[7px] text-gray-400 mr-1">{l === 'hi' ? 'कम' : 'Less'}</span>
          {['bg-gray-100 dark:bg-gray-800', 'bg-emerald-200 dark:bg-emerald-800', 'bg-emerald-400 dark:bg-emerald-700', 'bg-emerald-500 dark:bg-emerald-600', 'bg-emerald-600 dark:bg-emerald-500'].map((c, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
          ))}
          <span className="text-[7px] text-gray-400 ml-1">{l === 'hi' ? 'ज्यादा' : 'More'}</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div key={di} className="relative"
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}>
                <div className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-all hover:ring-1 hover:ring-gray-400 cursor-pointer`} />
                {hoveredDay?.date === day.date && (
                  <div className="absolute z-50 bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-[8px] px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                    <p className="font-bold">{new Date(day.date).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short' })}</p>
                    <p>{day.count} {l === 'hi' ? 'टेस्ट' : 'tests'}</p>
                    {day.count > 0 && <p>{l === 'hi' ? 'स्कोर' : 'Score'}: {day.avgScore}%</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   WEEKLY COMPARISON CARD
// ════════════════════════════════════════════════════════════
const WeeklyComparison = ({ data, language }) => {
  const l = language;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'साप्ताहिक तुलना' : 'Weekly Comparison'}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* This week */}
        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-200/50 dark:border-indigo-800/30">
          <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">{l === 'hi' ? 'इस हफ्ते' : 'This Week'}</p>
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-200">{data.thisWeek.tests}</p>
          <p className="text-[9px] text-indigo-500">{l === 'hi' ? 'टेस्ट' : 'tests'} | {data.thisWeek.avgScore}% avg</p>
        </div>
        {/* Last week */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{l === 'hi' ? 'पिछला हफ्ता' : 'Last Week'}</p>
          <p className="text-2xl font-black text-gray-700 dark:text-gray-300">{data.lastWeek.tests}</p>
          <p className="text-[9px] text-gray-400">{l === 'hi' ? 'टेस्ट' : 'tests'} | {data.lastWeek.avgScore}% avg</p>
        </div>
      </div>

      {/* Change indicator */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold
          ${data.change > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          data.change < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          {data.change > 0 ? <ArrowUp className="w-3 h-3" /> : data.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(data.change)} {l === 'hi' ? 'टेस्ट' : 'tests'}
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold
          ${data.scoreChange > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          data.scoreChange < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          {data.scoreChange > 0 ? '+' : ''}{data.scoreChange}% score
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  PAPER-WISE SCORE TREND (Enhanced)
// ════════════════════════════════════════════════════════════
const PaperTrendCard = ({ title, icon: Icon, color, data, trend, predicted, avgScore, accuracy, language }) => {
  const cMap = {
    blue: { stroke: '#3b82f6', grad: 'from-blue-600 to-cyan-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/30', light: 'bg-blue-50 dark:bg-blue-900/10' },
    purple: { stroke: '#8b5cf6', grad: 'from-purple-600 to-violet-600', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-800/30', light: 'bg-purple-50 dark:bg-purple-900/10' },
  };
  const c = cMap[color];
  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;
  const best = data.length > 0 ? Math.max(...data.map(d => d.score)) : 0;
  const worst = data.length > 0 ? Math.min(...data.map(d => d.score)) : 0;
  const l = language;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.border} overflow-hidden`}>
      <div className={`${c.light} px-4 py-3 border-b ${c.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.grad} flex items-center justify-center shadow`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-[9px] text-gray-500">{data.length} {l === 'hi' ? 'टेस्ट दिए' : 'tests taken'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {predicted !== null && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>
              {l === 'hi' ? 'अनुमानित' : 'Pred'}: {predicted}%
            </span>
          )}
          <TrendBadge direction={trend} />
        </div>
      </div>
      <div className="p-4">
        {data.length > 0 ? (
          <>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <defs>
                    <linearGradient id={`grad_${color}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.stroke} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip content={<CTooltip />} />
                  <Area type="monotone" dataKey="score" stroke={c.stroke} strokeWidth={2.5} fill={`url(#grad_${color})`} dot={{ r: 3, fill: c.stroke }} />
                  <Area type="monotone" dataKey="accuracy" stroke={c.stroke} strokeWidth={1} strokeDasharray="4 4" fillOpacity={0} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              {[
                { l: l === 'hi' ? 'औसत' : 'Avg', v: `${avg}%`, i: Gauge, cl: 'text-blue-500' },
                { l: l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', v: `${best}%`, i: TrendingUp, cl: 'text-emerald-500' },
                { l: l === 'hi' ? 'न्यूनतम' : 'Low', v: `${worst}%`, i: TrendingDown, cl: 'text-amber-500' },
                { l: l === 'hi' ? 'सटीकता' : 'Acc', v: `${accuracy}%`, i: Target, cl: 'text-violet-500' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <m.i className={`w-3 h-3 mx-auto mb-0.5 ${m.cl}`} />
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{m.v}</p>
                  <p className="text-[7px] text-gray-400 uppercase">{m.l}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-[10px] text-gray-400">{l === 'hi' ? 'कोई डेटा नहीं' : 'No data yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   ERROR ANALYSIS CARD
// ════════════════════════════════════════════════════════════
const ErrorAnalysisCard = ({ data, language, navigate }) => {
  const l = language;
  if (!data || data.unitPerformance?.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गलती विश्लेषण' : 'Error Analysis'}</h3>
            <p className="text-[9px] text-gray-500">{l === 'hi' ? 'कमजोर क्षेत्र पहचानें' : 'Identify weak areas'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {l === 'hi' ? 'त्रुटि दर' : 'Error Rate'}: {data.errorRate}%
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Weak vs Strong summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-2.5 border border-red-200/50 dark:border-red-800/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-red-500" />
              <span className="text-[9px] font-bold text-red-700 dark:text-red-400">
                {l === 'hi' ? 'कमजोर' : 'Weak Areas'} ({data.weakUnits.length})
              </span>
            </div>
            {data.weakUnits.slice(0, 3).map((u, i) => (
              <p key={i} className="text-[8px] text-red-600/70 dark:text-red-400/70 truncate">
                {u.unit}: {u.accuracy}%
              </p>
            ))}
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-2.5 border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                {l === 'hi' ? 'मजबूत' : 'Strong Areas'} ({data.strongUnits.length})
              </span>
            </div>
            {data.strongUnits.slice(0, 3).map((u, i) => (
              <p key={i} className="text-[8px] text-emerald-600/70 dark:text-emerald-400/70 truncate">
                {u.unit}: {u.accuracy}%
              </p>
            ))}
          </div>
        </div>

        {/* Unit performance bars */}
        <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">{l === 'hi' ? 'इकाई प्रदर्शन' : 'Unit Performance'}</p>
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {(data.unitPerformance || []).slice(0, 10).map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 w-28 truncate flex-shrink-0">{u.unit}</span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${u.accuracy}%`,
                    background: u.accuracy >= 70 ? '#22c55e' : u.accuracy >= 50 ? '#3b82f6' : u.accuracy >= 30 ? '#f59e0b' : '#ef4444'
                  }} />
              </div>
              <span className={`text-[9px] font-bold w-8 text-right flex-shrink-0
                ${u.accuracy >= 70 ? 'text-emerald-600' : u.accuracy >= 50 ? 'text-blue-600' : u.accuracy >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
                {u.accuracy}%
              </span>
            </div>
          ))}
        </div>

        {/* Improvement suggestions */}
        {data.improvementAreas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[9px] font-bold text-gray-500 uppercase mb-1.5">{l === 'hi' ? 'सुधार क्षेत्र' : 'Improvement Areas'}</p>
            {data.improvementAreas.slice(0, 3).map((area, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-semibold text-gray-700 dark:text-gray-300">{area.unit} ({area.accuracy}%)</p>
                  <p className="text-[8px] text-gray-400">{area.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   TOPIC MASTERY RADAR
// ════════════════════════════════════════════════════════════
const TopicMasteryRadar = ({ data, language }) => {
  const l = language;
  if (!data || data.length === 0) return null;

  // Shorten unit names for radar
  const radarData = data.slice(0, 8).map(d => ({
    ...d,
    subject: d.unit?.replace(/UNIT\s*/i, 'U').substring(0, 12) || 'Other',
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow">
          <Crosshair className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'विषय दक्षता' : 'Topic Mastery'}</h3>
          <p className="text-[9px] text-gray-500">{l === 'hi' ? 'रडार चार्ट' : 'Radar chart'}</p>
        </div>
      </div>

      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" className="dark:stroke-gray-700" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#94a3b8' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 7 }} axisLine={false} />
            <Radar name={l === 'hi' ? 'सटीकता' : 'Accuracy'} dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1 mt-2">
        {radarData.map((d, i) => (
          <div key={i} className="flex items-center gap-1 text-[8px]">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${d.accuracy >= 70 ? 'bg-emerald-500' : d.accuracy >= 50 ? 'bg-blue-500' : d.accuracy >= 30 ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className="text-gray-500 truncate">{d.unit}</span>
            <span className="font-bold text-gray-700 dark:text-gray-300 ml-auto flex-shrink-0">{d.accuracy}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   NEEDS ATTENTION (low scores)
// ════════════════════════════════════════════════════════════
const NeedsAttentionCard = ({ tests, language, navigate }) => {
  const l = language;
  if (!tests || tests.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200/50 dark:border-red-800/30 overflow-hidden">
      <div className="bg-red-50 dark:bg-red-900/10 px-4 py-3 border-b border-red-200/50 dark:border-red-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">{l === 'hi' ? 'ध्यान दें - कम स्कोर' : 'Needs Attention'}</h3>
            <p className="text-[9px] text-red-600/60">{l === 'hi' ? '50% से कम स्कोर' : 'Score below 50%'}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{tests.length}</span>
      </div>
      <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
        {tests.slice(0, 5).map((t, i) => {
          const { g, c } = grd(t.bestScore);
          return (
            <div key={i} onClick={() => navigate(`/results/${t.lastAttempt?._id}`)}
              className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg cursor-pointer transition-all">
              <div className="relative flex-shrink-0"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /></div>
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-black text-sm flex-shrink-0 ${GC[c]}`}>{g}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-red-600 transition-colors">{t.test?.title || 'Test'}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                  <span>Best: {t.bestScore}%</span>
                  <span>{t.attempts} att</span>
                </div>
              </div>
              <p className="text-lg font-black text-red-600 dark:text-red-400 flex-shrink-0">{t.bestScore}%</p>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/test/${t.testId}`); }}
                className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   PENDING TESTS TIMELINE (Simplified but complete)
// ════════════════════════════════════════════════════════════
const PendingTimeline = ({ notAttemptedTests, paper1NotAttempted, paper2NotAttempted, language, navigate }) => {
  const [activeTab, setActiveTab] = useState('all');
  const l = language;

  const sorted = useMemo(() => {
    const base = activeTab === 'paper1' ? paper1NotAttempted : activeTab === 'paper2' ? paper2NotAttempted : notAttemptedTests;
    return [...base].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [notAttemptedTests, paper1NotAttempted, paper2NotAttempted, activeTab]);

  if (notAttemptedTests.length === 0) return null;

  const getDaysOld = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  const criticalCount = sorted.filter(t => getDaysOld(t.createdAt) >= 14).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'बाकी टेस्ट' : 'Pending Tests'}</h3>
              <p className="text-[9px] text-gray-500">{sorted.length} {l === 'hi' ? 'बाकी' : 'pending'}</p>
            </div>
          </div>
          {criticalCount > 0 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {criticalCount} {l === 'hi' ? 'जरूरी' : 'urgent'}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {[
            { id: 'all', label: l === 'hi' ? 'सभी' : 'All', count: notAttemptedTests.length },
            { id: 'paper1', label: 'P1', count: paper1NotAttempted.length },
            { id: 'paper2', label: 'P2', count: paper2NotAttempted.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all
                ${activeTab === tab.id ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
              <span className={`text-[8px] px-1 rounded-full ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Marathon button */}
        {sorted[0] && (
          <button onClick={() => navigate(`/test/${sorted[0]._id}`)}
            className="w-full mt-2 p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center gap-2 hover:shadow-xl transition-all">
            <Rocket className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">{l === 'hi' ? 'मैराथन शुरू करें' : 'Start Marathon'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="p-3 max-h-[400px] overflow-y-auto space-y-1.5">
        {sorted.slice(0, 15).map((test, idx) => {
          const days = getDaysOld(test.createdAt);
          const urgClass = days >= 14 ? 'border-red-200 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/5'
            : days >= 7 ? 'border-orange-200 bg-orange-50/20 dark:border-orange-900/20 dark:bg-orange-900/5'
            : 'border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/20';

          return (
            <div key={test._id || idx} className={`group flex items-center gap-2.5 p-2.5 rounded-xl border hover:shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all ${urgClass}`}>
              <div className="flex-shrink-0 text-center w-8">
                <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{new Date(test.createdAt).getDate()}</p>
                <p className="text-[7px] text-gray-400 uppercase">{new Date(test.createdAt).toLocaleDateString('en', { month: 'short' })}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{test.title || 'Untitled'}</h4>
                  {test.paper && (
                    <span className={`px-1 rounded text-[7px] font-bold flex-shrink-0 ${test.paper === 'paper1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {test.paper === 'paper1' ? 'P1' : 'P2'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[8px] text-gray-500 mt-0.5">
                  <span><Hash className="w-2.5 h-2.5 inline" />{test.totalQuestions || 0}</span>
                  <span><Clock className="w-2.5 h-2.5 inline" />{test.duration || 0}m</span>
                  <span className={`font-bold ${days >= 14 ? 'text-red-500' : days >= 7 ? 'text-orange-500' : 'text-gray-400'}`}>{days}d ago</span>
                </div>
              </div>
              <button onClick={() => navigate(`/test/${test._id}`)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg transition-all">
                <Play className="w-3 h-3" />{l === 'hi' ? 'दें' : 'Take'}
              </button>
            </div>
          );
        })}
      </div>

      {sorted.length > 15 && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-center">
          <button onClick={() => navigate('/tests')} className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1 mx-auto">
            {l === 'hi' ? `सभी ${sorted.length} टेस्ट देखें` : `View all ${sorted.length} tests`} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   PAPER TABBED ACTIVITY
// ════════════════════════════════════════════════════════════
const PaperTabbedActivity = ({ allAttempts, paper1Attempts, paper2Attempts, allTests, paper1Tests, paper2Tests, notAttemptedTests, paper1NotAttempted, paper2NotAttempted, language, loading: la }) => {
  const [mainTab, setMainTab] = useState('attempted');
  const [paperFilter, setPaperFilter] = useState('all');
  const navigate = useNavigate();
  const l = language;
  const fA = paperFilter === 'paper1' ? paper1Attempts : paperFilter === 'paper2' ? paper2Attempts : allAttempts;
  const fT = paperFilter === 'paper1' ? paper1Tests : paperFilter === 'paper2' ? paper2Tests : allTests;
  const fN = paperFilter === 'paper1' ? paper1NotAttempted : paperFilter === 'paper2' ? paper2NotAttempted : notAttemptedTests;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" />{l === 'hi' ? 'गतिविधि' : 'Activity'}
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {[{ id: 'all', l: l === 'hi' ? 'सभी' : 'All' }, { id: 'paper1', l: 'P1' }, { id: 'paper2', l: 'P2' }].map(pt => (
            <button key={pt.id} onClick={() => setPaperFilter(pt.id)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${paperFilter === pt.id ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              {pt.l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex border-b border-gray-100 dark:border-gray-700 px-1">
        {[
          { id: 'attempted', label: l === 'hi' ? 'दिए गए' : 'Attempted', Icon: CheckCircle, count: fA.length },
          { id: 'created', label: l === 'hi' ? 'बनाए' : 'Created', Icon: PlusCircle, count: fT.length },
          { id: 'pending', label: l === 'hi' ? 'बाकी' : 'Pending', Icon: Clock, count: fN.length },
        ].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-all
              ${mainTab === t.id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.Icon className="w-3 h-3" />{t.label}
            <span className={`text-[8px] font-bold px-1 rounded-full ${mainTab === t.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>
      <div className="p-3 max-h-[400px] overflow-y-auto">
        {mainTab === 'attempted' && (la
          ? <div className="space-y-2">{[1, 2, 3].map(i => <Sk key={i} className="h-14 w-full" />)}</div>
          : fA.length > 0 ? (
            <div className="space-y-1.5">
              {fA.slice(0, 10).map((a, i) => {
                const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
                const { g, c } = grd(pct);
                const isLow = pct < 50;
                return (
                  <div key={a._id || i} onClick={() => navigate(`/results/${a._id}`)}
                    className={`group flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all hover:shadow-lg
                      ${isLow ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/5' : 'border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30'} hover:bg-white dark:hover:bg-gray-700`}>
                    <span className="text-[8px] font-bold text-gray-400 w-3 text-center">#{i + 1}</span>
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-black text-sm flex-shrink-0 ${GC[c]}`}>{g}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{a.testId?.title || 'Test'}</h4>
                        {isLow && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                        {a.testId?.paper && <span className={`px-1 rounded text-[7px] font-bold flex-shrink-0 ${a.testId.paper === 'paper1' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{a.testId.paper === 'paper1' ? 'P1' : 'P2'}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                        <span><CheckCircle className="w-2.5 h-2.5 text-emerald-500 inline" />{a.correctCount || 0}</span>
                        <span><XCircle className="w-2.5 h-2.5 text-red-400 inline" />{a.wrongCount || 0}</span>
                        <span><Clock className="w-2.5 h-2.5 inline" />{tAgo(a.completedAt, l)}</span>
                      </div>
                    </div>
                    <p className={`text-base font-black flex-shrink-0 ${isLow ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{pct}<span className="text-[9px] text-gray-400">%</span></p>
                    <Ring pct={pct} size={26} sw={2.5} color={pct >= 70 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#ef4444'}>
                      <span className="text-[6px] font-bold text-gray-500">{pct}</span>
                    </Ring>
                    <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
              <Link to="/results" className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
                <History className="w-3 h-3" />{l === 'hi' ? 'सभी देखें' : 'View All'}<ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              <p className="text-xs text-gray-400 mb-3">{l === 'hi' ? 'कोई टेस्ट नहीं' : 'No tests taken'}</p>
              <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg">
                <Play className="w-3 h-3" />Take Test
              </button>
            </div>
          )
        )}

        {mainTab === 'created' && (fT.length > 0 ? (
          <div className="space-y-1.5">
            {fT.slice(0, 10).map((t, i) => (
              <div key={t._id || i} className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow flex-shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{t.title || 'Untitled'}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                    <span><Hash className="w-2.5 h-2.5 inline" />{t.totalQuestions || 0}</span>
                    <span><Clock className="w-2.5 h-2.5 inline" />{t.duration || 0}m</span>
                    <span>{tAgo(t.createdAt, l)}</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/test/${t._id}`)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 transition-colors flex-shrink-0"><Play className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <PlusCircle className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-xs text-gray-400 mb-3">No tests created</p>
            <button onClick={() => navigate('/tests/create')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg"><PlusCircle className="w-3 h-3" />Create</button>
          </div>
        ))}

        {mainTab === 'pending' && (fN.length > 0 ? (
          <div className="space-y-1.5">
            {fN.slice(0, 10).map((t, i) => (
              <div key={t._id || i} className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/30 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center border border-amber-200 dark:border-amber-800 flex-shrink-0"><Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{t.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                    <span><Hash className="w-2.5 h-2.5 inline" />{t.totalQuestions || 0}</span>
                    <span><Clock className="w-2.5 h-2.5 inline" />{t.duration || 0}m</span>
                  </div>
                </div>
                <button onClick={() => navigate(`/test/${t._id}`)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-lg hover:shadow-lg transition-all flex-shrink-0"><Play className="w-3 h-3" />{l === 'hi' ? 'दें' : 'Take'}</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8"><CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-200 dark:text-emerald-900" /><p className="text-xs text-gray-400">All attempted!</p></div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   PAPER SECTION (Unit breakdown)
// ════════════════════════════════════════════════════════════
const PaperSection = ({ paper, title, subtitle, Icon, color, units, total, language, navigate }) => {
  const [open, setOpen] = useState(true);
  const sorted = [...units].sort((a, b) => b.count - a.count);
  const l = language;
  const c = color === 'blue'
    ? { grad: 'from-blue-600 to-cyan-600', gradL: 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10', bdr: 'border-blue-200/50 dark:border-blue-800/30', txt: 'text-blue-600 dark:text-blue-400', bar: 'from-blue-500 to-cyan-400', iconBg: 'from-blue-500 to-cyan-500', ring: '#3b82f6', hover: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10' }
    : { grad: 'from-purple-600 to-violet-600', gradL: 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10', bdr: 'border-purple-200/50 dark:border-purple-800/30', txt: 'text-purple-600 dark:text-purple-400', bar: 'from-purple-500 to-violet-400', iconBg: 'from-purple-500 to-violet-500', ring: '#8b5cf6', hover: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10' };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.bdr} overflow-hidden`}>
      <div className={`bg-gradient-to-r ${c.gradL} p-4 border-b ${c.bdr}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center shadow-lg`}><Icon className="w-5 h-5 text-white" /></div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">{title}<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-gray-700/80 ${c.txt}`}>{total} Qs</span></h3>
              <p className="text-[10px] text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700">
            {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="p-3">
          {sorted.length > 0 ? (
            <div className="space-y-1">
              {sorted.map((u, idx) => {
                const pct = total > 0 ? Math.round((u.count / total) * 100) : 0;
                return (
                  <div key={idx} onClick={() => navigate(`/questions?paper=${paper}&unit=${encodeURIComponent(u._id?.unit || '')}`)}
                    className={`group flex items-center gap-2 p-2 rounded-lg ${c.hover} border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-all`}>
                    <div className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${idx === 0 ? `bg-gradient-to-br ${c.grad} text-white shadow` : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">{u._id?.unit || 'Unknown'}</p>
                        {idx === 0 && <Crown className={`w-2.5 h-2.5 ${c.txt} flex-shrink-0`} />}
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white">{u.count}</p>
                      <p className="text-[8px] text-gray-400">{pct}%</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
              <button onClick={() => navigate(`/questions?paper=${paper}`)}
                className={`w-full mt-2 p-2 rounded-lg border border-dashed ${c.bdr} ${c.txt} text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                <Eye className="w-3 h-3" />{l === 'hi' ? 'सभी देखें' : 'View All'}<ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <FileQuestion className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              <p className="text-[10px] text-gray-400 mb-2">No questions</p>
              <button onClick={() => navigate('/import')} className={`inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r ${c.grad} text-white text-[10px] font-semibold rounded-lg`}><Upload className="w-3 h-3" />Import</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//   ACHIEVEMENTS + STREAK + QUOTE + QUICK ACTIONS
// ════════════════════════════════════════════════════════════
const iconMap = { Layers, Crown, Play, Flame, Medal, Star, Target, PlusCircle };

const AchievementCard = ({ achievements, language: l }) => {
  const un = achievements.filter(a => a.unlocked).length;
  const cM = {
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', t: 'text-amber-600 dark:text-amber-400', b: 'border-amber-200 dark:border-amber-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', t: 'text-purple-600 dark:text-purple-400', b: 'border-purple-200 dark:border-purple-800' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', t: 'text-blue-600 dark:text-blue-400', b: 'border-blue-200 dark:border-blue-800' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', t: 'text-orange-600 dark:text-orange-400', b: 'border-orange-200 dark:border-orange-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', t: 'text-emerald-600 dark:text-emerald-400', b: 'border-emerald-200 dark:border-emerald-800' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', t: 'text-indigo-600 dark:text-indigo-400', b: 'border-indigo-200 dark:border-indigo-800' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', t: 'text-gray-400 dark:text-gray-600', b: 'border-gray-200 dark:border-gray-700' }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm"><Award className="w-5 h-5 text-amber-500" />{l === 'hi' ? 'उपलब्धियाँ' : 'Achievements'}</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{un}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {achievements.map((a, i) => {
          const c = cM[a.color] || cM.gray;
          const Ic = iconMap[a.icon] || Star;
          return (
            <div key={i} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a.unlocked ? `${c.bg} ${c.b}` : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'}`} title={a.desc}>
              {a.unlocked
                ? <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-white" /></div>
                : <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center"><Lock className="w-2 h-2 text-white" /></div>}
              <Ic className={`w-4 h-4 ${a.unlocked ? c.t : 'text-gray-400'}`} />
              <span className={`text-[8px] font-bold text-center leading-tight ${a.unlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>{a.label}</span>
              {!a.unlocked && a.progress !== undefined && (
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(a.progress * 100, 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StreakCard = ({ streak, longestStreak, language: l }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-yellow-300" /><span className="font-bold text-xs">{l === 'hi' ? 'स्ट्रीक' : 'Streak'}</span></div>
        <div className="text-right">
          <span className="text-xl font-black">{streak}<span className="text-[9px] font-normal text-white/60 ml-0.5">d</span></span>
          {longestStreak > 0 && <p className="text-[8px] text-white/40">{l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'}: {longestStreak}d</p>}
        </div>
      </div>
      <div className="flex justify-between gap-1">
        {days.map((d, i) => (
          <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold
            ${i <= today && streak > 0 ? 'bg-white text-orange-600 shadow-sm' : 'bg-white/15 text-white/50'}`}>{d}</div>
        ))}
      </div>
    </div>
  );
};

const quotes = [
  { t: "Success is not final, failure is not fatal.", a: "Churchill" },
  { t: "The only way to do great work is to love what you do.", a: "Jobs" },
  { t: "Education is the most powerful weapon.", a: "Mandela" },
  { t: "It does not matter how slowly you go.", a: "Confucius" },
  { t: "Believe you can and you're halfway there.", a: "Roosevelt" },
  { t: "The expert in anything was once a beginner.", a: "Hayes" },
  { t: "Hard work beats talent when talent doesn't work hard.", a: "Notah" },
];

const QuoteCard = () => {
  const [q] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-4 text-white">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
      <Sparkles className="w-4 h-4 mb-2 text-yellow-300" />
      <p className="text-xs font-medium leading-relaxed mb-2 italic opacity-95">"{q.t}"</p>
      <p className="text-[9px] text-white/50">- {q.a}</p>
    </div>
  );
};

const QAction = ({ icon: Icon, title, desc, to, gradient, badge, delay = 0 }) => {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <Link to={to} className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:border-transparent ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}><Icon className="w-4 h-4 text-white" /></div>
          {badge && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{badge}</span>}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white text-xs">{title}</h3>
        <p className="text-[9px] text-gray-500 group-hover:text-white/70 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
};

// ════════════════════════════════════════════════════════════
//             MAIN DASHBOARD COMPONENT
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
            {/* ═══ HERO SECTION ═══ */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl" />
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <LiveClock />
                    <SessionTimer language={l} />
                    {d.advancedCountdown && (
                      <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border border-white/10
                        ${d.advancedCountdown.totalDays <= 7 ? 'bg-red-500/20 animate-pulse' : 'bg-white/10'}`}>
                        <CalendarDays className="w-3 h-3 text-rose-400" />
                        <span className="text-xs font-mono font-bold text-white tabular-nums">{d.advancedCountdown.totalDays}d</span>
                        <span className="text-[7px] text-white/40">{l === 'hi' ? d.advancedCountdown.phaseHi : d.advancedCountdown.phase}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Player Level Badge */}
                    {d.playerLevel && (
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1 border border-white/10">
                        <Crown className="w-3 h-3 text-yellow-400" />
                        <span className="text-[9px] font-bold">Lv.{d.playerLevel.current.level}</span>
                        <span className="text-[7px] text-white/40">{d.playerLevel.totalXP}XP</span>
                      </div>
                    )}
                    <button onClick={d.refresh} className={`p-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 ${d.refreshing ? 'animate-spin' : ''}`}>
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
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
                    <p className="text-indigo-200/60 text-xs mb-4 max-w-md">{l === 'hi' ? 'नियमित अभ्यास सफलता की कुंजी है।' : 'Consistent practice is the key to success.'}</p>
                    {d.jrfProbability.dataPoints >= 3 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${d.jrfProbability.riskLevel === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20' : d.jrfProbability.riskLevel === 'moderate' ? 'bg-blue-500/10 border-blue-500/20' : d.jrfProbability.riskLevel === 'risky' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                          <Brain className="w-3.5 h-3.5 text-indigo-300" />
                          <span className="text-[10px] font-bold">JRF: {d.jrfProbability.jrfProbability}%</span>
                          <span className="text-[8px] text-indigo-300/50">|</span>
                          <span className="text-[10px] font-bold">NET: {d.jrfProbability.netProbability}%</span>
                        </div>
                        {d.todayActivity.count > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-bold text-emerald-300">{d.todayActivity.count} {l === 'hi' ? 'टेस्ट आज' : 'today'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate('/tests/create')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:shadow-xl transition-all">
                        <Play className="w-3.5 h-3.5" />{l === 'hi' ? 'टेस्ट शुरू' : 'Start Test'}
                      </button>
                      <button onClick={() => navigate('/import')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all">
                        <Upload className="w-3.5 h-3.5" />{l === 'hi' ? 'आयात' : 'Import'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col gap-1.5">
                      {[
                        { l: 'P1', v: d.paper1Count, i: BookOpen, c: 'from-blue-500 to-cyan-500', acc: d.paper1Accuracy },
                        { l: 'P2', v: d.paper2Count, i: Target, c: 'from-purple-500 to-violet-500', acc: d.paper2Accuracy },
                        { l: l === 'hi' ? 'टेस्ट' : 'Tests', v: d.testStats?.totalTests || 0, i: ClipboardList, c: 'from-amber-500 to-orange-500' },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                          <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${p.c} flex items-center justify-center`}><p.i className="w-3 h-3 text-white" /></div>
                          <div><p className="text-[8px] text-indigo-300/40">{p.l}{p.acc !== undefined ? ` (${p.acc}%)` : ''}</p><p className="text-sm font-bold">{p.v}</p></div>
                        </div>
                      ))}
                    </div>
                    <Ring pct={d.overallAccuracy} size={120} sw={8} color="#22c55e" bg="rgba(255,255,255,0.08)">
                      <div className="text-center"><p className="text-2xl font-black">{d.overallAccuracy}%</p><p className="text-[8px] text-indigo-300/50 uppercase">{l === 'hi' ? 'सटीकता' : 'Accuracy'}</p></div>
                    </Ring>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ STAT CARDS ═══ */}
            {d.loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Sk key={i} className="h-28 rounded-2xl" />)}</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={FileQuestion} label={l === 'hi' ? 'कुल प्रश्न' : 'Questions'} value={d.totalQuestions} sub={l === 'hi' ? 'बैंक में' : 'in bank'} gradient="from-blue-500 to-cyan-500" iconBg="from-blue-500 to-cyan-600" onClick={() => navigate('/questions')} delay={0} spark={[3, 7, 5, 12, 8, 15, 10]} />
                <StatCard icon={BookOpen} label="Paper 1" value={d.paper1Count} sub={`${d.paper1Accuracy}% acc`} gradient="from-emerald-500 to-green-500" iconBg="from-emerald-500 to-green-600" onClick={() => navigate('/questions?paper=paper1')} delay={80} trend={d.paper1TrendDir} />
                <StatCard icon={Target} label="Paper 2" value={d.paper2Count} sub={`${d.paper2Accuracy}% acc`} gradient="from-purple-500 to-violet-500" iconBg="from-purple-500 to-violet-600" onClick={() => navigate('/questions?paper=paper2')} delay={160} trend={d.paper2TrendDir} />
                <StatCard icon={ClipboardList} label={l === 'hi' ? 'टेस्ट' : 'Tests'} value={d.testStats?.totalTests || 0} sub={`${d.allCompletedAttempts.length} ${l === 'hi' ? 'दिए' : 'taken'}`} gradient="from-amber-500 to-orange-500" iconBg="from-amber-500 to-orange-600" onClick={() => navigate('/tests')} delay={240} />
              </div>
            )}

            {/* ═══ 🆕 LEVEL + DAILY CHALLENGE + PLAYER ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlayerLevelCard level={d.playerLevel} language={l} />
              <DailyChallengeCard challenge={d.dailyChallenge} language={l} />
              <StreakCard streak={d.streak} longestStreak={d.longestStreak} language={l} />
            </div>

            {/* ═══ JRF + GOALS + ADVANCED COUNTDOWN ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <JRFProbabilityMeter data={d.jrfProbability} language={l} />
              <GoalTracker
                goals={d.autoGeneratedGoals} completionPct={d.goalCompletionPct}
                todayActivity={d.todayActivity} todayDetailed={d.todayDetailed}
                yesterdayActivity={d.yesterdayActivity} customTargets={d.customTargets}
                updateCustomTargets={d.updateCustomTargets} dayProgress={d.dayProgress}
                goalStreak={d.goalStreak} goalsCompleted={d.goalsCompleted}
                totalGoals={d.totalGoals} pressureMessage={d.pressureMessage}
                todayXP={d.todayXP} streak={d.streak} language={l} navigate={navigate}
              />
              <AdvancedExamCountdown
                examDate={d.examDate} setExamDate={d.setExamDate}
                countdown={d.advancedCountdown} language={l}
              />
            </div>

            {/* ═══ 🆕 REVISION QUEUE + WEAK CHAPTERS ═══ */}
            {d.allCompletedAttempts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RevisionQueueCard queue={d.revisionQueue} language={l} navigate={navigate} />
                <WeakChaptersCard chapters={d.weakChaptersList} language={l} navigate={navigate} />
              </div>
            )}

            {/* ═══ 🆕 FORGETTING CURVE + WEEKLY REPORT + NEGATIVE MARKING ═══ */}
            {d.allCompletedAttempts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ForgettingCurveCard data={d.forgettingCurveData} language={l} navigate={navigate} />
                <WeeklyReportCard data={d.weeklyReportData} language={l} />
                <NegativeMarkingCard data={d.negativeMarkingImpact} language={l} />
              </div>
            )}

            {/* ═══ PERSONAL RECORDS ═══ */}
            {d.allCompletedAttempts.length > 0 && (
              <PersonalRecords records={d.personalRecords} language={l} />
            )}

            {/* ═══ PAPER TRENDS ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'पेपर-वार स्कोर ट्रेंड' : 'Paper-wise Score Trends'}</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PaperTrendCard title={l === 'hi' ? 'पेपर 1 ट्रेंड' : 'Paper 1 Trend'} icon={BookOpen} color="blue" data={d.paper1Trend} trend={d.paper1TrendDir} predicted={d.paper1Predicted} avgScore={d.paper1AvgScore} accuracy={d.paper1Accuracy} language={l} />
                <PaperTrendCard title={l === 'hi' ? 'पेपर 2 ट्रेंड' : 'Paper 2 Trend'} icon={Target} color="purple" data={d.paper2Trend} trend={d.paper2TrendDir} predicted={d.paper2Predicted} avgScore={d.paper2AvgScore} accuracy={d.paper2Accuracy} language={l} />
              </div>
            </div>

            {/* ═══ SYLLABUS + RECOMMENDATIONS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><SyllabusCoverageMap coverage={d.syllabusCoverage} language={l} /></div>
              <StudyRecommendations recommendations={d.studyRecommendations} language={l} navigate={navigate} />
            </div>

            {/* ═══ 🆕 FATIGUE + ERROR + TOPIC MASTERY ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <FatigueCard data={d.fatigueAnalysis} language={l} />
              <ErrorAnalysisCard data={d.errorPatterns} language={l} navigate={navigate} />
              <TopicMasteryRadar data={d.topicPerformance} language={l} />
            </div>

            {/* ═══ SPEED + ACTIVITY + WEEKLY ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SpeedAnalyticsCard data={d.speedAnalytics} language={l} />
              <div className="lg:col-span-2"><ActivityHeatmap activityMap={d.activityMap} language={l} /></div>
            </div>

            {/* ═══ WEEKLY COMPARISON + SCORE DIST + TIME OF DAY ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <WeeklyComparison data={d.weeklyComparison} language={l} />
              <ScoreDistributionCard data={d.scoreDistribution} language={l} />
              {d.timeOfDayAnalysis.bestPeriod && <TimeOfDayCard data={d.timeOfDayAnalysis} language={l} />}
            </div>

            {/* ═══ PAPER ANALYSIS ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'पेपर विश्लेषण' : 'Paper Analysis'}</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PaperSection paper="paper1" title={l === 'hi' ? 'पेपर 1' : 'Paper 1'} subtitle={l === 'hi' ? 'शिक्षण अभिवृत्ति' : 'Teaching Aptitude'} Icon={BookOpen} color="blue" units={d.paper1Units} total={d.paper1Count} language={l} navigate={navigate} />
                <PaperSection paper="paper2" title={l === 'hi' ? 'पेपर 2' : 'Paper 2'} subtitle={l === 'hi' ? 'इतिहास' : 'History'} Icon={Target} color="purple" units={d.paper2Units} total={d.paper2Count} language={l} navigate={navigate} />
              </div>
            </div>

            {/* ═══ PENDING + NEEDS ATTENTION ═══ */}
            {d.notAttemptedTests.length > 0 && (
              <PendingTimeline notAttemptedTests={d.notAttemptedTests} paper1NotAttempted={d.paper1NotAttempted} paper2NotAttempted={d.paper2NotAttempted} language={l} navigate={navigate} />
            )}
            {d.needsAttentionTests.length > 0 && (
              <NeedsAttentionCard tests={d.needsAttentionTests} language={l} navigate={navigate} />
            )}

            {/* ═══ ACTIVITY + ACHIEVEMENTS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <PaperTabbedActivity allAttempts={d.allCompletedAttempts} paper1Attempts={d.paper1Attempts} paper2Attempts={d.paper2Attempts} allTests={d.createdTests} paper1Tests={d.paper1Tests} paper2Tests={d.paper2Tests} notAttemptedTests={d.notAttemptedTests} paper1NotAttempted={d.paper1NotAttempted} paper2NotAttempted={d.paper2NotAttempted} language={l} loading={d.loading} />
              </div>
              <div className="space-y-4">
                <AchievementCard achievements={d.achievements} language={l} />
                <QuoteCard />
              </div>
            </div>

            {/* ═══ QUICK ACTIONS ═══ */}
            <div>
              <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}</h2></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QAction icon={PlusCircle} title={l === 'hi' ? 'नया टेस्ट' : 'New Test'} desc={l === 'hi' ? 'मॉक बनाएं' : 'Create mock'} to="/tests/create" gradient="from-blue-600 to-indigo-600" delay={0} />
                <QAction icon={Upload} title={l === 'hi' ? 'आयात' : 'Import'} desc="JSON" to="/import" gradient="from-emerald-600 to-green-600" badge="JSON" delay={80} />
                <QAction icon={FileQuestion} title={l === 'hi' ? 'प्रश्न' : 'Questions'} desc={l === 'hi' ? 'बैंक' : 'Bank'} to="/questions" gradient="from-purple-600 to-violet-600" delay={160} />
                <QAction icon={BarChart3} title={l === 'hi' ? 'परिणाम' : 'Results'} desc={l === 'hi' ? 'प्रगति' : 'Progress'} to="/results" gradient="from-orange-600 to-red-600" delay={240} />
              </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl"><Trophy className="w-5 h-5 text-white" /></div>
                  <div>
                    <h3 className="text-sm font-bold">{l === 'hi' ? 'UGC NET क्रैक करें' : 'Crack UGC NET'}</h3>
                    <p className="text-[10px] text-gray-400">
                      {d.playerLevel ? `${l === 'hi' ? d.playerLevel.current.nameHi : d.playerLevel.current.name} | ${d.playerLevel.totalXP} XP` : l === 'hi' ? 'अभी शुरू करें!' : 'Start now!'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs rounded-xl hover:shadow-xl transition-all"><Play className="w-3.5 h-3.5" />{l === 'hi' ? 'टेस्ट' : 'Tests'}</button>
                  <button onClick={() => navigate('/results')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all"><BarChart3 className="w-3.5 h-3.5" />{l === 'hi' ? 'परिणाम' : 'Results'}</button>
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