// client/src/pages/Dashboard.jsx
// ULTIMATE PROFESSIONAL DASHBOARD v5.0
// Recharts, Radar, Predictions, Heatmap, Achievements, Smart AI Recommendations

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  FileQuestion, ClipboardList, BarChart3, TrendingUp, Upload,
  PlusCircle, Clock, Target, BookOpen, Award, ArrowRight,
  Calendar, Zap, Trophy, Flame, Star, ChevronRight, Play,
  Brain, Timer, CheckCircle, XCircle, SkipForward,
  Activity, TrendingDown, RefreshCw, Layers, ArrowUpRight,
  PieChart as PieChartIcon, History, Sparkles, GraduationCap, Eye,
  ChevronUp, ChevronDown, Hash, Crown, BarChart2,
  Sun, Moon, Coffee, Sunset, Gauge, Medal,
  Lightbulb, AlertTriangle, Lock, Info, Rocket,
  Crosshair, Swords, FileText, LayoutGrid,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';

// ================================================================
//                       UTILITIES
// ================================================================
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { Icon: Moon, en: 'Late Night Study', hi: 'देर रात की पढ़ाई', grad: 'from-indigo-600 to-purple-700' };
  if (h < 12) return { Icon: Sun, en: 'Good Morning', hi: 'सुप्रभात', grad: 'from-amber-500 to-orange-600' };
  if (h < 17) return { Icon: Coffee, en: 'Good Afternoon', hi: 'नमस्ते', grad: 'from-blue-600 to-indigo-600' };
  if (h < 21) return { Icon: Sunset, en: 'Good Evening', hi: 'शुभ संध्या', grad: 'from-orange-600 to-rose-600' };
  return { Icon: Moon, en: 'Good Night', hi: 'शुभ रात्रि', grad: 'from-indigo-600 to-purple-700' };
};

const timeAgo = (date, lang) => {
  const d = Math.floor((Date.now() - new Date(date)) / 60000);
  if (d < 1) return lang === 'hi' ? 'अभी' : 'Now';
  if (d < 60) return `${d}m`;
  if (d < 1440) return `${Math.floor(d / 60)}h`;
  if (d < 10080) return `${Math.floor(d / 1440)}d`;
  return new Date(date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short' });
};

const getGrade = (p) => {
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

// ================================================================
//                   MICRO COMPONENTS
// ================================================================
const Counter = ({ end, dur = 1200, sfx = '' }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!end) { setC(0); return; }
    let s, f;
    const run = (t) => {
      if (!s) s = t;
      const p = Math.min((t - s) / dur, 1);
      setC(Math.floor((1 - Math.pow(1 - p, 4)) * end));
      if (p < 1) f = requestAnimationFrame(run);
    };
    f = requestAnimationFrame(run);
    return () => cancelAnimationFrame(f);
  }, [end, dur]);
  return <>{c.toLocaleString()}{sfx}</>;
};

const Ring = ({ pct, size = 100, sw = 7, color = '#3b82f6', bg, children }) => {
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
};

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

const SessionTimer = ({ language }) => {
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

// Custom recharts tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2.5 text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label || payload[0]?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.dataKey}: <b>{p.value}%</b>
        </p>
      ))}
    </div>
  );
};

// ================================================================
//                    STAT CARD
// ================================================================
const StatCard = ({ icon: Icon, label, value, sub, gradient, iconBg, onClick, delay = 0, spark }) => {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  const max = spark ? Math.max(...spark, 1) : 1;
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4
        transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${onClick ? 'cursor-pointer group' : ''}
        ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-2xl`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white"><Counter end={value} /></p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        {spark && spark.length > 0 && (
          <div className="flex items-end gap-px mt-2" style={{ height: 20 }}>
            {spark.map((sv, i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-all duration-700"
                style={{ height: `${Math.max((sv / max) * 100, 8)}%`, background: iconBg.includes('blue') ? '#3b82f6' : iconBg.includes('emerald') || iconBg.includes('green') ? '#22c55e' : iconBg.includes('purple') ? '#8b5cf6' : '#f59e0b', opacity: 0.25 + (i / spark.length) * 0.75 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ================================================================
//                 SCORE TREND CHART (Recharts)
// ================================================================
const ScoreTrendCard = ({ data, trend, predicted, language }) => {
  if (!data || data.length === 0) return null;
  const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          {language === 'hi' ? 'स्कोर ट्रेंड' : 'Score Trend'}
        </h3>
        <div className="flex items-center gap-2">
          {predicted !== null && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              {language === 'hi' ? 'अनुमानित' : 'Predicted'}: {predicted}%
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : trend === 'down' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={1.5} fill="url(#accGrad)" dot={false} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        {[
          { l: language === 'hi' ? 'औसत' : 'Avg', v: `${avg}%`, i: Gauge, c: 'text-blue-500' },
          { l: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', v: `${Math.max(...data.map(d => d.score))}%`, i: TrendingUp, c: 'text-emerald-500' },
          { l: language === 'hi' ? 'न्यूनतम' : 'Lowest', v: `${Math.min(...data.map(d => d.score))}%`, i: TrendingDown, c: 'text-amber-500' },
        ].map((m, i) => (
          <div key={i} className="text-center">
            <m.i className={`w-3.5 h-3.5 mx-auto mb-0.5 ${m.c}`} />
            <p className="text-sm font-bold text-gray-900 dark:text-white">{m.v}</p>
            <p className="text-[8px] text-gray-400 uppercase">{m.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
//            TOPIC RADAR CHART (Recharts)
// ================================================================
const TopicRadarCard = ({ data, language }) => {
  if (!data || data.length < 3) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
        <Crosshair className="w-5 h-5 text-violet-500" />
        {language === 'hi' ? 'विषय-वार ताकत' : 'Topic Strength Radar'}
      </h3>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.map(d => ({ ...d, unit: d.unit?.length > 15 ? d.unit.slice(0, 15) + '..' : d.unit }))}>
            <PolarGrid stroke="#e2e8f0" className="dark:stroke-gray-700" />
            <PolarAngleAxis dataKey="unit" tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <Radar name="Accuracy" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {data.slice(0, 4).map((d, i) => (
          <span key={i} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${d.accuracy >= 70 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : d.accuracy >= 40 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            {d.unit?.slice(0, 20)}: {d.accuracy}%
          </span>
        ))}
      </div>
    </div>
  );
};

// ================================================================
//           DIFFICULTY PIE CHART (Recharts)
// ================================================================
const DifficultyPieCard = ({ data, language }) => {
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
        <PieChartIcon className="w-5 h-5 text-amber-500" />
        {language === 'hi' ? 'कठिनाई वितरण' : 'Difficulty Spread'}
      </h3>
      <div className="flex items-center gap-4">
        <div style={{ width: 120, height: 120 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">{d.value}</span>
                <span className="text-[9px] text-gray-400">({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ================================================================
//         QUESTION TYPE HORIZONTAL BAR (Recharts)
// ================================================================
const QTypeBarCard = ({ data, language }) => {
  if (!data || data.length === 0) return null;
  const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <BarChart2 className="w-5 h-5 text-cyan-500" />
        {language === 'hi' ? 'प्रश्न प्रकार' : 'Question Types'}
      </h3>
      <div style={{ height: Math.max(data.length * 36, 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} stroke="#94a3b8" />
            <Tooltip content={({ active, payload }) => active && payload?.[0] ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 text-xs">
                <p className="font-bold">{payload[0].payload.name}</p>
                <p>{payload[0].value} questions ({payload[0].payload.pct}%)</p>
              </div>
            ) : null} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ================================================================
//                  HEAT MAP CALENDAR
// ================================================================
const HeatMapCard = ({ activityMap, language }) => {
  const weeks = 16;
  const today = new Date();
  const cells = useMemo(() => {
    const r = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      r.push({ date: d, key: k, count: activityMap[k] || 0, isToday: i === 0 });
    }
    return r;
  }, [activityMap, today]);
  const maxC = Math.max(...Object.values(activityMap), 1);
  const totalDays = Object.keys(activityMap).length;

  const gc = (c) => {
    if (c === 0) return 'bg-gray-100 dark:bg-gray-800';
    const i = c / maxC;
    if (i <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40';
    if (i <= 0.5) return 'bg-emerald-400 dark:bg-emerald-700/60';
    if (i <= 0.75) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          {language === 'hi' ? 'गतिविधि' : 'Activity'}
        </h3>
        <span className="text-[10px] text-gray-400">{totalDays} {language === 'hi' ? 'सक्रिय दिन' : 'active days'}</span>
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] mr-1">
          {['', 'M', '', 'W', '', 'F', ''].map((l, i) => (
            <div key={i} className="h-[12px] w-3 flex items-center"><span className="text-[8px] text-gray-400">{l}</span></div>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0,1fr))`, gridTemplateRows: 'repeat(7, minmax(0,1fr))', gridAutoFlow: 'column' }}>
            {cells.map((cell, i) => (
              <div key={i} className={`h-[12px] rounded-sm ${gc(cell.count)} ${cell.isToday ? 'ring-1 ring-indigo-400 ring-offset-1 dark:ring-offset-gray-800' : ''}`}
                title={`${cell.date.toLocaleDateString()}: ${cell.count} tests`} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[8px] text-gray-400">Less</span>
        {['bg-gray-100 dark:bg-gray-800', 'bg-emerald-200 dark:bg-emerald-900/40', 'bg-emerald-400 dark:bg-emerald-700/60', 'bg-emerald-500 dark:bg-emerald-600', 'bg-emerald-600 dark:bg-emerald-500'].map((c, i) => (
          <div key={i} className={`w-[9px] h-[9px] rounded-sm ${c}`} />
        ))}
        <span className="text-[8px] text-gray-400">More</span>
      </div>
    </div>
  );
};

// ================================================================
//             WEEKLY COMPARISON CARD
// ================================================================
const WeeklyCard = ({ data, language }) => {
  if (!data) return null;
  const { thisWeek, lastWeek, change, scoreChange } = data;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-500" />
        {language === 'hi' ? 'साप्ताहिक तुलना' : 'Weekly Comparison'}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: language === 'hi' ? 'इस सप्ताह' : 'This Week', tests: thisWeek.tests, score: thisWeek.avgScore, active: true },
          { label: language === 'hi' ? 'पिछला सप्ताह' : 'Last Week', tests: lastWeek.tests, score: lastWeek.avgScore, active: false },
        ].map((w, i) => (
          <div key={i} className={`p-3 rounded-xl ${w.active ? 'bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-gray-50 border border-gray-200 dark:bg-gray-700/50 dark:border-gray-700'}`}>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">{w.label}</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{w.tests} <span className="text-xs font-normal text-gray-400">{language === 'hi' ? 'टेस्ट' : 'tests'}</span></p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">{w.score}% {language === 'hi' ? 'औसत' : 'avg'}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className={`flex items-center gap-1 text-xs font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change >= 0 ? '+' : ''}{change} tests
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${scoreChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {scoreChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {scoreChange >= 0 ? '+' : ''}{scoreChange}% score
        </div>
      </div>
    </div>
  );
};

// ================================================================
//                 ACHIEVEMENT BADGES
// ================================================================
const iconMap = { Layers, Crown, Play, Flame, Medal, Star, Target, PlusCircle };
const AchievementCard = ({ achievements, language }) => {
  const unlocked = achievements.filter(a => a.unlocked).length;
  const cMap = {
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', t: 'text-amber-600 dark:text-amber-400', b: 'border-amber-200 dark:border-amber-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', t: 'text-purple-600 dark:text-purple-400', b: 'border-purple-200 dark:border-purple-800' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', t: 'text-blue-600 dark:text-blue-400', b: 'border-blue-200 dark:border-blue-800' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', t: 'text-orange-600 dark:text-orange-400', b: 'border-orange-200 dark:border-orange-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', t: 'text-emerald-600 dark:text-emerald-400', b: 'border-emerald-200 dark:border-emerald-800' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', t: 'text-indigo-600 dark:text-indigo-400', b: 'border-indigo-200 dark:border-indigo-800' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', t: 'text-gray-400 dark:text-gray-600', b: 'border-gray-200 dark:border-gray-700' },
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          {language === 'hi' ? 'उपलब्धियाँ' : 'Achievements'}
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{unlocked}/{achievements.length}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {achievements.map((a, i) => {
          const c = cMap[a.color] || cMap.gray;
          const Icon = iconMap[a.icon] || Star;
          return (
            <div key={i} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a.unlocked ? `${c.bg} ${c.b}` : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'}`} title={a.desc}>
              {a.unlocked ? (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </div>
              ) : (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <Lock className="w-2 h-2 text-white" />
                </div>
              )}
              <Icon className={`w-4 h-4 ${a.unlocked ? c.t : 'text-gray-400'}`} />
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

// ================================================================
//              SMART RECOMMENDATIONS
// ================================================================
const Recommendations = ({ questionStats, recentAttempts, paper1Units, paper2Units, paper1Count, paper2Count, overallAccuracy, language, navigate }) => {
  const recs = useMemo(() => {
    const r = [];
    const totalQ = questionStats?.total || 0;
    const allUnits = [...(paper1Units || []), ...(paper2Units || [])];

    if (totalQ === 0) r.push({ icon: Upload, title: language === 'hi' ? 'प्रश्न जोड़ें' : 'Add Questions', desc: language === 'hi' ? 'JSON से आयात करें' : 'Import from JSON', action: () => navigate('/import'), btn: language === 'hi' ? 'आयात' : 'Import', color: 'purple' });
    if (!recentAttempts.length && totalQ > 0) r.push({ icon: Play, title: language === 'hi' ? 'पहला टेस्ट दें' : 'Take First Test', desc: language === 'hi' ? 'अभ्यास शुरू करें' : 'Start practicing', action: () => navigate('/tests/create'), btn: language === 'hi' ? 'बनाएं' : 'Create', color: 'emerald' });
    if (overallAccuracy > 0 && overallAccuracy < 50) r.push({ icon: Target, title: language === 'hi' ? 'सटीकता बढ़ाएं' : 'Boost Accuracy', desc: `${language === 'hi' ? 'वर्तमान' : 'Current'}: ${overallAccuracy}%`, action: () => navigate('/questions'), btn: language === 'hi' ? 'अभ्यास' : 'Practice', color: 'red' });

    if (allUnits.length > 0) {
      const weak = [...allUnits].sort((a, b) => a.count - b.count)[0];
      if (weak && weak.count < 10) r.push({ icon: AlertTriangle, title: language === 'hi' ? 'कमजोर इकाई' : 'Weak Unit', desc: `"${weak._id?.unit?.slice(0, 25)}" - ${weak.count} Qs`, action: () => navigate('/import'), btn: language === 'hi' ? 'जोड़ें' : 'Add', color: 'amber' });
    }

    if (paper1Count > 0 && paper2Count > 0) {
      const ratio = Math.min(paper1Count, paper2Count) / Math.max(paper1Count, paper2Count);
      if (ratio < 0.4) r.push({ icon: Layers, title: language === 'hi' ? 'असंतुलित' : 'Imbalanced', desc: `P1:${paper1Count} vs P2:${paper2Count}`, action: () => navigate('/import'), btn: language === 'hi' ? 'संतुलित करें' : 'Balance', color: 'blue' });
    }

    if (recentAttempts.length > 0 && recentAttempts.length < 5) r.push({ icon: Rocket, title: language === 'hi' ? 'और अभ्यास करें' : 'More Practice', desc: `${recentAttempts.length}/5 ${language === 'hi' ? 'टेस्ट' : 'tests'}`, action: () => navigate('/tests'), btn: language === 'hi' ? 'टेस्ट' : 'Tests', color: 'indigo' });

    return r.slice(0, 4);
  }, [questionStats, recentAttempts, paper1Units, paper2Units, paper1Count, paper2Count, overallAccuracy, language, navigate]);

  if (recs.length === 0) return null;
  const cMap = {
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/10', b: 'border-purple-200 dark:border-purple-800/30', i: 'text-purple-500', btn: 'bg-purple-500 hover:bg-purple-600' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', b: 'border-emerald-200 dark:border-emerald-800/30', i: 'text-emerald-500', btn: 'bg-emerald-500 hover:bg-emerald-600' },
    red: { bg: 'bg-red-50 dark:bg-red-900/10', b: 'border-red-200 dark:border-red-800/30', i: 'text-red-500', btn: 'bg-red-500 hover:bg-red-600' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', b: 'border-amber-200 dark:border-amber-800/30', i: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', b: 'border-blue-200 dark:border-blue-800/30', i: 'text-blue-500', btn: 'bg-blue-500 hover:bg-blue-600' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', b: 'border-indigo-200 dark:border-indigo-800/30', i: 'text-indigo-500', btn: 'bg-indigo-500 hover:bg-indigo-600' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        {language === 'hi' ? 'स्मार्ट सुझाव' : 'Smart Recommendations'}
      </h3>
      <div className="space-y-2">
        {recs.map((rec, i) => {
          const c = cMap[rec.color];
          return (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.b}`}>
              <rec.icon className={`w-5 h-5 flex-shrink-0 ${c.i}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{rec.title}</p>
                <p className="text-[10px] text-gray-500">{rec.desc}</p>
              </div>
              <button onClick={rec.action} className={`${c.btn} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0`}>{rec.btn}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ================================================================
//              PAPER DETAIL SECTION
// ================================================================
const PaperSection = ({ paper, title, subtitle, Icon, color, units, total, language, navigate }) => {
  const [open, setOpen] = useState(true);
  const sorted = [...units].sort((a, b) => b.count - a.count);
  const c = color === 'blue'
    ? { grad: 'from-blue-600 to-cyan-600', gradL: 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10', bdr: 'border-blue-200/50 dark:border-blue-800/30', txt: 'text-blue-600 dark:text-blue-400', bar: 'from-blue-500 to-cyan-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', hover: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10', ring: '#3b82f6', iconBg: 'from-blue-500 to-cyan-500' }
    : { grad: 'from-purple-600 to-violet-600', gradL: 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10', bdr: 'border-purple-200/50 dark:border-purple-800/30', txt: 'text-purple-600 dark:text-purple-400', bar: 'from-purple-500 to-violet-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', hover: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10', ring: '#8b5cf6', iconBg: 'from-purple-500 to-violet-500' };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.bdr} overflow-hidden`}>
      <div className={`bg-gradient-to-r ${c.gradL} p-4 border-b ${c.bdr}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {title} <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>{total} Qs</span>
              </h3>
              <p className="text-[10px] text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ring pct={Math.min(units.length * 10, 100)} size={40} sw={3} color={c.ring}>
              <span className="text-[8px] font-bold text-gray-500">{units.length}</span>
            </Ring>
            <button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700">
              {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { l: 'Total', v: total, i: Hash },
            { l: 'Units', v: units.length, i: Layers },
            { l: 'Largest', v: sorted[0]?.count || 0, i: Crown },
            { l: 'Avg', v: units.length > 0 ? Math.round(total / units.length) : 0, i: BarChart2 },
          ].map((s, i) => (
            <div key={i} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-1.5 text-center backdrop-blur-sm">
              <s.i className={`w-3 h-3 mx-auto mb-0.5 ${c.txt} opacity-50`} />
              <p className="text-xs font-bold text-gray-900 dark:text-white"><Counter end={s.v} /></p>
              <p className="text-[7px] text-gray-500 uppercase">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="p-3">
          {sorted.length > 0 ? (
            <>
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
                      <ChevronRight className="w-3 h-3 text-gray-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
              <button onClick={() => navigate(`/questions?paper=${paper}`)}
                className={`w-full mt-2 p-2 rounded-lg border border-dashed ${c.bdr} ${c.txt} text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700/50`}>
                <Eye className="w-3 h-3" /> View All <ArrowRight className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="text-center py-6">
              <FileQuestion className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              <p className="text-[10px] text-gray-400 mb-2">{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions yet'}</p>
              <button onClick={() => navigate('/import')} className={`inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r ${c.grad} text-white text-[10px] font-semibold rounded-lg`}>
                <Upload className="w-3 h-3" /> Import
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ================================================================
//          TABBED RECENT ACTIVITY
// ================================================================
const TabbedActivity = ({ attempts, tests, language, loading: la, loadingT }) => {
  const [tab, setTab] = useState('attempted');
  const navigate = useNavigate();
  const tabs = [
    { id: 'attempted', label: language === 'hi' ? 'दिए गए' : 'Attempted', Icon: ClipboardList, count: attempts.length },
    { id: 'created', label: language === 'hi' ? 'बनाए गए' : 'Created', Icon: PlusCircle, count: tests.length },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold transition-all ${tab === t.id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>
      <div className="p-3 max-h-[420px] overflow-y-auto">
        {tab === 'attempted' && (
          la ? <div className="space-y-2">{[1, 2, 3].map(i => <Sk key={i} className="h-14 w-full" />)}</div>
            : attempts.length > 0 ? (
              <div className="space-y-1.5">
                {attempts.map((a, i) => {
                  const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
                  const { g, c } = getGrade(pct);
                  return (
                    <div key={a._id || i} onClick={() => navigate(`/results/${a._id}`)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg cursor-pointer transition-all">
                      <span className="text-[9px] font-bold text-gray-400 w-4 text-center">#{i + 1}</span>
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-black text-sm flex-shrink-0 ${GC[c]}`}>{g}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{a.testId?.title || 'Test'}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                          <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-emerald-500" />{a.correctCount || 0}</span>
                          <span className="flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5 text-red-400" />{a.wrongCount || 0}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo(a.completedAt, language)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-gray-900 dark:text-white">{pct}<span className="text-[9px] text-gray-400">%</span></p>
                      </div>
                      <Ring pct={pct} size={28} sw={2.5} color={pct >= 70 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#ef4444'}>
                        <span className="text-[6px] font-bold text-gray-500">{pct}</span>
                      </Ring>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  );
                })}
                <Link to="/results" className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
                  <History className="w-3 h-3" /> {language === 'hi' ? 'सभी देखें' : 'View All'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                <p className="text-xs text-gray-400 mb-3">{language === 'hi' ? 'कोई टेस्ट नहीं दिया' : 'No tests taken'}</p>
                <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg"><Play className="w-3 h-3" /> {language === 'hi' ? 'टेस्ट दें' : 'Take Test'}</button>
              </div>
            )
        )}
        {tab === 'created' && (
          loadingT ? <div className="space-y-2">{[1, 2, 3].map(i => <Sk key={i} className="h-14 w-full" />)}</div>
            : tests.length > 0 ? (
              <div className="space-y-1.5">
                {tests.map((t, i) => (
                  <div key={t._id || i} className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow flex-shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{t.title || 'Untitled'}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                        <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{t.totalQuestions || t.questions?.length || 0}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{t.duration || 0}m</span>
                        <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{timeAgo(t.createdAt, language)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/test/${t._id}`); }} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 transition-colors" title="Take"><Play className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/tests/edit/${t._id}`); }} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition-colors" title="Edit"><FileText className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
                <Link to="/tests" className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
                  <LayoutGrid className="w-3 h-3" /> {language === 'hi' ? 'सभी देखें' : 'View All'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <PlusCircle className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                <p className="text-xs text-gray-400 mb-3">{language === 'hi' ? 'कोई टेस्ट नहीं बनाया' : 'No tests created'}</p>
                <button onClick={() => navigate('/tests/create')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg"><PlusCircle className="w-3 h-3" /> Create</button>
              </div>
            )
        )}
      </div>
    </div>
  );
};

// ================================================================
//                    PAPER COMPARISON
// ================================================================
const PaperVS = ({ p1, p2, p1u, p2u, total, language }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
      <Swords className="w-5 h-5 text-indigo-500" />
      {language === 'hi' ? 'पेपर तुलना' : 'Paper Comparison'}
    </h3>
    <div className="flex items-center justify-center gap-5 mb-4">
      <div className="text-center">
        <Ring pct={total > 0 ? Math.round((p1 / total) * 100) : 0} size={56} sw={4} color="#3b82f6">
          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{total > 0 ? Math.round((p1 / total) * 100) : 0}%</span>
        </Ring>
        <p className="text-[10px] font-semibold text-gray-500 mt-1">P1</p>
        <p className="text-xs font-bold text-gray-900 dark:text-white">{p1}</p>
      </div>
      <div className="text-center text-gray-300 dark:text-gray-600">
        <Swords className="w-4 h-4 mx-auto" />
        <p className="text-[8px] mt-0.5">VS</p>
      </div>
      <div className="text-center">
        <Ring pct={total > 0 ? Math.round((p2 / total) * 100) : 0} size={56} sw={4} color="#8b5cf6">
          <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">{total > 0 ? Math.round((p2 / total) * 100) : 0}%</span>
        </Ring>
        <p className="text-[10px] font-semibold text-gray-500 mt-1">P2</p>
        <p className="text-xs font-bold text-gray-900 dark:text-white">{p2}</p>
      </div>
    </div>
    {/* Balance */}
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5">
      {(() => {
        if (p1 + p2 === 0) return <p className="text-[10px] text-gray-400 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Add questions for comparison</p>;
        const ratio = Math.min(p1, p2) / Math.max(p1, p2);
        const ok = ratio > 0.6;
        return (
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
              {ok ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
            </div>
            <p className={`text-[10px] font-semibold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {ok ? (language === 'hi' ? 'संतुलित' : 'Balanced') : (language === 'hi' ? 'असंतुलित' : 'Imbalanced')} ({Math.round(ratio * 100)}%)
            </p>
          </div>
        );
      })()}
    </div>
  </div>
);

// ================================================================
//              MOTIVATIONAL QUOTE + STREAK
// ================================================================
const quotes = [
  { t: "Success is not final, failure is not fatal.", a: "Churchill" },
  { t: "The only way to do great work is to love what you do.", a: "Jobs" },
  { t: "Education is the most powerful weapon.", a: "Mandela" },
  { t: "It does not matter how slowly you go.", a: "Confucius" },
  { t: "The secret of getting ahead is getting started.", a: "Twain" },
  { t: "Believe you can and you're halfway there.", a: "Roosevelt" },
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

const StreakCard = ({ streak, language }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-yellow-300" /><span className="font-bold text-xs">{language === 'hi' ? 'स्ट्रीक' : 'Streak'}</span></div>
        <span className="text-xl font-black">{streak}<span className="text-[9px] font-normal text-white/60 ml-0.5">{language === 'hi' ? 'दिन' : 'd'}</span></span>
      </div>
      <div className="flex justify-between gap-1">
        {days.map((d, i) => (
          <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${i <= today && streak > 0 ? 'bg-white text-orange-600 shadow-sm' : 'bg-white/15 text-white/50'}`}>{d}</div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
//                  QUICK ACTION
// ================================================================
const QAction = ({ icon: Icon, title, desc, to, gradient, badge, delay = 0 }) => {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <Link to={to} className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:border-transparent ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1.5">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {badge && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{badge}</span>}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white text-xs">{title}</h3>
        <p className="text-[9px] text-gray-500 group-hover:text-white/70 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
};

// ================================================================
//                     MAIN DASHBOARD
// ================================================================
const Dashboard = ({ language: propLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const {
    questionStats, testStats, recentAttempts, createdTests,
    loading, refreshing, lastRefresh, refresh,
    paper1Units, paper2Units, paper1Count, paper2Count, totalQuestions,
    overallAccuracy, scoreTrend, trendDirection, predictedScore,
    difficultyData, questionTypeData, topicPerformance,
    activityMap, streak, weeklyComparison, achievements,
  } = useDashboard();

  const [loadingCreated, setLoadingCreated] = useState(false);
  const greeting = getGreeting();
  const GI = greeting.Icon;

  return (
    <Layout language={propLanguage} setLanguage={setLanguage}>
      {({ language }) => (
        <div className="space-y-5 pb-8">

          {/* ═══════ HERO ═══════ */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl" />
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative">
              {/* Top bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <LiveClock />
                  <SessionTimer language={language} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={refresh} className={`p-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all ${refreshing ? 'animate-spin' : ''}`}><RefreshCw className="w-3 h-3" /></button>
                  <span className="text-[8px] text-indigo-300/40">{lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              {/* Content */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${greeting.grad} flex items-center justify-center shadow-lg`}><GI className="w-4 h-4 text-white" /></div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-black">{language === 'hi' ? greeting.hi : greeting.en}</h1>
                      <p className="text-[9px] text-indigo-300/50">{new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <p className="text-indigo-200/60 text-xs mb-4 max-w-md">{language === 'hi' ? 'अपनी UGC NET की तैयारी जारी रखें। नियमित अभ्यास सफलता की कुंजी है।' : 'Continue your UGC NET prep. Consistent practice is the key.'}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate('/tests/create')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all"><Play className="w-3.5 h-3.5" />{language === 'hi' ? 'टेस्ट शुरू' : 'Start Test'}</button>
                    <button onClick={() => navigate('/import')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all"><Upload className="w-3.5 h-3.5" />{language === 'hi' ? 'आयात' : 'Import'}</button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col gap-1.5">
                    {[
                      { l: 'P1', v: paper1Count, i: BookOpen, c: 'from-blue-500 to-cyan-500' },
                      { l: 'P2', v: paper2Count, i: Target, c: 'from-purple-500 to-violet-500' },
                      { l: language === 'hi' ? 'टेस्ट' : 'Tests', v: testStats?.totalTests || 0, i: ClipboardList, c: 'from-amber-500 to-orange-500' },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${p.c} flex items-center justify-center`}><p.i className="w-3 h-3 text-white" /></div>
                        <div><p className="text-[8px] text-indigo-300/40">{p.l}</p><p className="text-sm font-bold">{p.v}</p></div>
                      </div>
                    ))}
                  </div>
                  <Ring pct={overallAccuracy} size={120} sw={8} color="#22c55e" bg="rgba(255,255,255,0.08)">
                    <div className="text-center">
                      <p className="text-2xl font-black">{overallAccuracy}%</p>
                      <p className="text-[8px] text-indigo-300/50 uppercase">{language === 'hi' ? 'सटीकता' : 'Accuracy'}</p>
                    </div>
                  </Ring>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════ STATS ═══════ */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Sk key={i} className="h-24 rounded-2xl" />)}</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={FileQuestion} label={language === 'hi' ? 'कुल प्रश्न' : 'Questions'} value={totalQuestions} sub={language === 'hi' ? 'बैंक में' : 'in bank'} gradient="from-blue-500 to-cyan-500" iconBg="from-blue-500 to-cyan-600" onClick={() => navigate('/questions')} delay={0} spark={[3, 7, 5, 12, 8, 15, 10]} />
              <StatCard icon={BookOpen} label="Paper 1" value={paper1Count} sub={language === 'hi' ? 'सामान्य' : 'General'} gradient="from-emerald-500 to-green-500" iconBg="from-emerald-500 to-green-600" onClick={() => navigate('/questions?paper=paper1')} delay={80} spark={[2, 5, 3, 8, 6, 10, 7]} />
              <StatCard icon={Target} label="Paper 2" value={paper2Count} sub={language === 'hi' ? 'विषय' : 'Subject'} gradient="from-purple-500 to-violet-500" iconBg="from-purple-500 to-violet-600" onClick={() => navigate('/questions?paper=paper2')} delay={160} spark={[4, 6, 9, 5, 11, 8, 13]} />
              <StatCard icon={ClipboardList} label={language === 'hi' ? 'टेस्ट' : 'Tests'} value={testStats?.totalTests || 0} sub={`${testStats?.totalAttempts || 0} ${language === 'hi' ? 'प्रयास' : 'attempts'}`} gradient="from-amber-500 to-orange-500" iconBg="from-amber-500 to-orange-600" onClick={() => navigate('/tests')} delay={240} spark={[1, 3, 2, 5, 4, 7, 6]} />
            </div>
          )}

          {/* ═══════ PAPER ANALYSIS ═══════ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{language === 'hi' ? 'पेपर विश्लेषण' : 'Paper Analysis'}</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PaperSection paper="paper1" title={language === 'hi' ? 'पेपर 1' : 'Paper 1'} subtitle={language === 'hi' ? 'शिक्षण अभिवृत्ति' : 'Teaching Aptitude'} Icon={BookOpen} color="blue" units={paper1Units} total={paper1Count} language={language} navigate={navigate} />
              <PaperSection paper="paper2" title={language === 'hi' ? 'पेपर 2' : 'Paper 2'} subtitle={language === 'hi' ? 'इतिहास' : 'History'} Icon={Target} color="purple" units={paper2Units} total={paper2Count} language={language} navigate={navigate} />
            </div>
          </div>

          {/* ═══════ CHARTS ROW 1: Score Trend + Heat Map ═══════ */}
          {recentAttempts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ScoreTrendCard data={scoreTrend} trend={trendDirection} predicted={predictedScore} language={language} />
              <HeatMapCard activityMap={activityMap} language={language} />
            </div>
          )}

          {/* ═══════ CHARTS ROW 2: Radar + Difficulty + Types ═══════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topicPerformance.length >= 3 && <TopicRadarCard data={topicPerformance} language={language} />}
            {difficultyData.length > 0 && <DifficultyPieCard data={difficultyData} language={language} />}
            {questionTypeData.length > 0 && <QTypeBarCard data={questionTypeData} language={language} />}
          </div>

          {/* ═══════ ACTIVITY + WEEKLY + COMPARISON + ACHIEVEMENTS ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TabbedActivity attempts={recentAttempts} tests={createdTests} language={language} loading={loading} loadingT={loadingCreated} />
            </div>
            <div className="space-y-4">
              {recentAttempts.length > 0 && <WeeklyCard data={weeklyComparison} language={language} />}
              <AchievementCard achievements={achievements} language={language} />
            </div>
          </div>

          {/* ═══════ RECOMMENDATIONS + COMPARISON ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Recommendations questionStats={questionStats} recentAttempts={recentAttempts} paper1Units={paper1Units} paper2Units={paper2Units} paper1Count={paper1Count} paper2Count={paper2Count} overallAccuracy={overallAccuracy} language={language} navigate={navigate} />
            <PaperVS p1={paper1Count} p2={paper2Count} p1u={paper1Units.length} p2u={paper2Units.length} total={totalQuestions} language={language} />
          </div>

          {/* ═══════ QUICK ACTIONS + STREAK + QUOTE ═══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{language === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QAction icon={PlusCircle} title={language === 'hi' ? 'नया टेस्ट' : 'New Test'} desc={language === 'hi' ? 'मॉक बनाएं' : 'Create mock'} to="/tests/create" gradient="from-blue-600 to-indigo-600" delay={0} />
                <QAction icon={Upload} title={language === 'hi' ? 'आयात' : 'Import'} desc="JSON" to="/import" gradient="from-emerald-600 to-green-600" badge="JSON" delay={80} />
                <QAction icon={FileQuestion} title={language === 'hi' ? 'प्रश्न' : 'Questions'} desc={language === 'hi' ? 'बैंक' : 'Bank'} to="/questions" gradient="from-purple-600 to-violet-600" delay={160} />
                <QAction icon={BarChart3} title={language === 'hi' ? 'परिणाम' : 'Results'} desc={language === 'hi' ? 'प्रगति' : 'Progress'} to="/results" gradient="from-orange-600 to-red-600" delay={240} />
              </div>
            </div>
            <div className="space-y-3">
              <StreakCard streak={streak} language={language} />
              <QuoteCard />
            </div>
          </div>

          {/* ═══════ FOOTER CTA ═══════ */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 text-white">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0"><Trophy className="w-5 h-5 text-white" /></div>
                <div>
                  <h3 className="text-sm font-bold">{language === 'hi' ? 'UGC NET क्रैक करें' : 'Crack UGC NET'}</h3>
                  <p className="text-[10px] text-gray-400">{language === 'hi' ? 'अभी शुरू करें!' : 'Start now!'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs rounded-xl hover:shadow-xl transition-all"><Play className="w-3.5 h-3.5" />{language === 'hi' ? 'टेस्ट' : 'Tests'}</button>
                <button onClick={() => navigate('/results')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all"><BarChart3 className="w-3.5 h-3.5" />{language === 'hi' ? 'परिणाम' : 'Results'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;