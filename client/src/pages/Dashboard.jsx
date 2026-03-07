// client/src/pages/Dashboard.jsx
// ULTIMATE PROFESSIONAL DASHBOARD v4.0
// Features: Live Clock, Session Timer, Heat Map Calendar, Score Trend Chart,
// Achievement Badges, Smart Recommendations, Tabbed Recent Activity,
// Paper Comparison, Difficulty Analysis, Animated Everything

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileQuestion, ClipboardList, BarChart3, TrendingUp, Upload,
  PlusCircle, Clock, Target, BookOpen, Award, ArrowRight,
  Calendar, Zap, Trophy, Flame, Star, ChevronRight, Play,
  Brain, Timer, CheckCircle, XCircle, SkipForward,
  Activity, TrendingDown, RefreshCw, Layers, ArrowUpRight,
  PieChart, History, Sparkles, GraduationCap, Eye,
  ChevronUp, ChevronDown, Hash, Crown, BarChart2,
  Sun, Moon, Coffee, Sunset, Gauge, Medal,
  Lightbulb, Shield, CircleDot, AlertTriangle,
  Percent, Signal, Crosshair, Swords, BookMarked,
  FileText, LayoutGrid, List, Filter, MoreHorizontal,
  Minus, ArrowDown, ArrowUp, Radio, Wifi,
  Lock, Unlock, ThumbsUp, AlertCircle, Info,
  Hourglass, MapPin, Compass, Navigation, Rocket,
  Hexagon, Triangle, Square, Circle, Maximize2
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useQuestions } from '../hooks/useQuestions';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

// ================================================================
//                     UTILITY FUNCTIONS
// ================================================================

const getGreetingData = () => {
  const h = new Date().getHours();
  if (h < 6) return { icon: Moon, text: 'Late Night Study', textHi: 'देर रात की पढ़ाई', color: 'from-indigo-600 to-purple-700', emoji: 'moon' };
  if (h < 12) return { icon: Sun, text: 'Good Morning', textHi: 'सुप्रभात', color: 'from-amber-500 to-orange-600', emoji: 'sun' };
  if (h < 17) return { icon: Coffee, text: 'Good Afternoon', textHi: 'नमस्ते', color: 'from-blue-600 to-indigo-600', emoji: 'coffee' };
  if (h < 21) return { icon: Sunset, text: 'Good Evening', textHi: 'शुभ संध्या', color: 'from-orange-600 to-rose-600', emoji: 'sunset' };
  return { icon: Moon, text: 'Good Night', textHi: 'शुभ रात्रि', color: 'from-indigo-600 to-purple-700', emoji: 'moon' };
};

const formatTimeAgo = (date, lang) => {
  const now = new Date();
  const past = new Date(date);
  const diff = now - past;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return lang === 'hi' ? 'अभी' : 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return past.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' });
};

const formatDuration = (seconds) => {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 60) return `${Math.floor(m/60)}h ${m%60}m`;
  return `${m}m ${s}s`;
};

const getGrade = (pct) => {
  if (pct >= 90) return { grade: 'A+', color: 'emerald', label: 'Excellent' };
  if (pct >= 80) return { grade: 'A', color: 'emerald', label: 'Great' };
  if (pct >= 70) return { grade: 'B+', color: 'blue', label: 'Good' };
  if (pct >= 60) return { grade: 'B', color: 'blue', label: 'Above Avg' };
  if (pct >= 50) return { grade: 'C', color: 'amber', label: 'Average' };
  if (pct >= 40) return { grade: 'D', color: 'orange', label: 'Below Avg' };
  return { grade: 'F', color: 'red', label: 'Needs Work' };
};

const gradeColorClasses = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

// ================================================================
//                   ANIMATED COUNTER
// ================================================================

const AnimatedCounter = ({ end, duration = 1200, suffix = '', prefix = '', decimals = 0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    let start, frame;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCount(parseFloat((ease * end).toFixed(decimals)));
      if (p < 1) frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, decimals]);
  return <>{prefix}{decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}{suffix}</>;
};

// ================================================================
//                    PROGRESS RING
// ================================================================

const ProgressRing = ({ percentage, size = 120, strokeWidth = 8, color = '#3b82f6', bgColor, children, className = '' }) => {
  const [anim, setAnim] = useState(0);
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - anim / 100);
  useEffect(() => {
    const t = setTimeout(() => setAnim(Math.min(percentage, 100)), 200);
    return () => clearTimeout(t);
  }, [percentage]);
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bgColor || '#e5e7eb'} strokeWidth={strokeWidth} className="dark:stroke-gray-700" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset} className="transition-all duration-[1.5s] ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}50)` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

// ================================================================
//                    SPARKLINE BARS
// ================================================================

const SparklineBars = ({ data = [], color = '#3b82f6', height = 28 }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all duration-700"
          style={{ height: `${Math.max((v/max)*100, 6)}%`, background: color, opacity: 0.25 + (i/data.length)*0.75 }} />
      ))}
    </div>
  );
};

// ================================================================
//                    LIVE CLOCK
// ================================================================

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
      <Clock className="w-3.5 h-3.5 text-indigo-300" />
      <span className="text-sm font-mono font-bold text-white tabular-nums">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </span>
    </div>
  );
};

// ================================================================
//                  SESSION TIMER
// ================================================================

const SessionTimer = ({ language }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
      <Timer className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
      <div>
        <span className="text-[9px] text-emerald-300/60 uppercase tracking-wider block leading-none mb-0.5">
          {language === 'hi' ? 'सत्र' : 'Session'}
        </span>
        <span className="text-xs font-mono font-bold text-white tabular-nums">
          {pad(hrs)}:{pad(mins)}:{pad(secs)}
        </span>
      </div>
    </div>
  );
};

// ================================================================
//                    SKELETON
// ================================================================

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />
);

// ================================================================
//                  HEAT MAP CALENDAR
// ================================================================

const HeatMapCalendar = ({ attempts = [], language }) => {
  const weeks = 16;
  const today = new Date();

  const activityMap = useMemo(() => {
    const map = {};
    attempts.forEach(a => {
      const d = new Date(a.completedAt || a.createdAt);
      const key = d.toISOString().split('T')[0];
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [attempts]);

  const cells = useMemo(() => {
    const result = [];
    for (let i = weeks * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const count = activityMap[key] || 0;
      result.push({ date: d, key, count, isToday: i === 0 });
    }
    return result;
  }, [activityMap, today]);

  const maxCount = Math.max(...Object.values(activityMap), 1);
  const totalDays = Object.keys(activityMap).length;
  const totalActivity = Object.values(activityMap).reduce((s, v) => s + v, 0);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40';
    if (intensity <= 0.5) return 'bg-emerald-400 dark:bg-emerald-700/60';
    if (intensity <= 0.75) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-500';
  };

  const dayLabels = ['', 'M', '', 'W', '', 'F', ''];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-500" />
          {language === 'hi' ? 'गतिविधि कैलेंडर' : 'Activity Calendar'}
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span>{totalDays} {language === 'hi' ? 'सक्रिय दिन' : 'active days'}</span>
          <span>{totalActivity} {language === 'hi' ? 'कुल' : 'total'}</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1 pt-0">
          {dayLabels.map((l, i) => (
            <div key={i} className="h-[13px] w-4 flex items-center">
              <span className="text-[9px] text-gray-400">{l}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="grid gap-[3px]" style={{
            gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
            gridAutoFlow: 'column',
          }}>
            {cells.map((cell, i) => (
              <div key={i}
                className={`h-[13px] rounded-sm transition-colors ${getColor(cell.count)} ${
                  cell.isToday ? 'ring-1 ring-indigo-400 ring-offset-1 dark:ring-offset-gray-800' : ''
                }`}
                title={`${cell.date.toLocaleDateString()}: ${cell.count} ${cell.count === 1 ? 'test' : 'tests'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px] text-gray-400">{language === 'hi' ? 'कम' : 'Less'}</span>
        {['bg-gray-100 dark:bg-gray-800', 'bg-emerald-200 dark:bg-emerald-900/40', 'bg-emerald-400 dark:bg-emerald-700/60',
          'bg-emerald-500 dark:bg-emerald-600', 'bg-emerald-600 dark:bg-emerald-500'].map((c, i) => (
          <div key={i} className={`w-[10px] h-[10px] rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-gray-400">{language === 'hi' ? 'अधिक' : 'More'}</span>
      </div>
    </div>
  );
};

// ================================================================
//                  SCORE TREND CHART
// ================================================================

const ScoreTrendChart = ({ attempts = [], language }) => {
  const chartData = useMemo(() => {
    return [...attempts].reverse().slice(-8).map((a, i) => ({
      score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
      label: a.testId?.title?.substring(0, 12) || `Test ${i + 1}`,
      date: formatTimeAgo(a.completedAt, language),
    }));
  }, [attempts, language]);

  if (chartData.length === 0) return null;

  const maxScore = 100;
  const avg = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.score, 0) / chartData.length) : 0;

  // Determine trend
  const recentHalf = chartData.slice(Math.floor(chartData.length / 2));
  const olderHalf = chartData.slice(0, Math.floor(chartData.length / 2));
  const recentAvg = recentHalf.length > 0 ? recentHalf.reduce((s, d) => s + d.score, 0) / recentHalf.length : 0;
  const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((s, d) => s + d.score, 0) / olderHalf.length : 0;
  const trendUp = recentAvg >= olderAvg;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          {language === 'hi' ? 'स्कोर ट्रेंड' : 'Score Trend'}
        </h3>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendUp ? 'Improving' : 'Declining'}
          </div>
        </div>
      </div>

      {/* Average line label */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <Minus className="w-3 h-3 text-amber-400" />
          <span>{language === 'hi' ? 'औसत' : 'Avg'}: {avg}%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Average line */}
        <div className="absolute left-0 right-0 border-t border-dashed border-amber-300/40 dark:border-amber-600/30"
          style={{ top: `${100 - avg}%` }} />

        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {chartData.map((d, i) => {
            const h = Math.max((d.score / maxScore) * 100, 3);
            const { color } = getGrade(d.score);
            const barColors = {
              emerald: 'from-emerald-500 to-emerald-400',
              blue: 'from-blue-500 to-blue-400',
              amber: 'from-amber-500 to-amber-400',
              orange: 'from-orange-500 to-orange-400',
              red: 'from-red-500 to-red-400',
            };
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Score label on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-700 dark:text-gray-300">
                  {d.score}%
                </div>
                {/* Bar */}
                <div className="w-full relative" style={{ height: '100%' }}>
                  <div
                    className={`absolute bottom-0 left-0.5 right-0.5 bg-gradient-to-t ${barColors[color]} rounded-t-md
                      transition-all duration-700 ease-out group-hover:opacity-90`}
                    style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }} />
                </div>
                {/* Label */}
                <span className="text-[8px] text-gray-400 truncate w-full text-center mt-0.5">
                  {d.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        {[
          { label: language === 'hi' ? 'औसत' : 'Average', value: `${avg}%`, icon: Gauge, cls: 'text-blue-500' },
          { label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', value: `${Math.max(...chartData.map(d => d.score))}%`, icon: TrendingUp, cls: 'text-emerald-500' },
          { label: language === 'hi' ? 'न्यूनतम' : 'Lowest', value: `${Math.min(...chartData.map(d => d.score))}%`, icon: TrendingDown, cls: 'text-amber-500' },
        ].map((m, i) => (
          <div key={i} className="text-center">
            <m.icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${m.cls}`} />
            <p className="text-sm font-bold text-gray-900 dark:text-white">{m.value}</p>
            <p className="text-[9px] text-gray-400 uppercase">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
//                 ACHIEVEMENT BADGES
// ================================================================

const AchievementBadges = ({ stats, attempts, testCount, language }) => {
  const achievements = useMemo(() => {
    const list = [];
    const totalQ = stats?.total || 0;
    const totalAttempts = attempts?.length || 0;
    const bestScore = attempts?.length > 0
      ? Math.max(...attempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0))
      : 0;
    const avgAccuracy = attempts?.length > 0
      ? Math.round(attempts.reduce((s, a) => {
          const t = (a.correctCount || 0) + (a.wrongCount || 0);
          return s + (t > 0 ? (a.correctCount / t) * 100 : 0);
        }, 0) / attempts.length)
      : 0;

    // Question milestones
    if (totalQ >= 10) list.push({ icon: FileQuestion, label: language === 'hi' ? 'पहले 10' : 'First 10', desc: '10+ questions', color: 'blue', unlocked: true });
    if (totalQ >= 50) list.push({ icon: BookOpen, label: language === 'hi' ? 'संग्रहकर्ता' : 'Collector', desc: '50+ questions', color: 'purple', unlocked: true });
    if (totalQ >= 100) list.push({ icon: Layers, label: language === 'hi' ? 'शताब्दी' : 'Century', desc: '100+ questions', color: 'amber', unlocked: true });
    if (totalQ >= 500) list.push({ icon: Crown, label: language === 'hi' ? 'विशाल बैंक' : 'Massive Bank', desc: '500+ questions', color: 'emerald', unlocked: true });
    if (totalQ < 500) list.push({ icon: Crown, label: language === 'hi' ? 'विशाल बैंक' : 'Massive Bank', desc: `${totalQ}/500 questions`, color: 'gray', unlocked: false });

    // Test milestones
    if (totalAttempts >= 1) list.push({ icon: Play, label: language === 'hi' ? 'पहला कदम' : 'First Step', desc: '1st test taken', color: 'blue', unlocked: true });
    if (totalAttempts >= 5) list.push({ icon: Flame, label: language === 'hi' ? 'नियमित' : 'Regular', desc: '5+ tests', color: 'orange', unlocked: true });
    if (totalAttempts >= 10) list.push({ icon: Trophy, label: language === 'hi' ? 'समर्पित' : 'Dedicated', desc: '10+ tests', color: 'amber', unlocked: true });
    if (totalAttempts < 10) list.push({ icon: Trophy, label: language === 'hi' ? 'समर्पित' : 'Dedicated', desc: `${totalAttempts}/10 tests`, color: 'gray', unlocked: false });

    // Score milestones
    if (bestScore >= 80) list.push({ icon: Star, label: language === 'hi' ? 'उत्कृष्ट' : 'Brilliant', desc: '80%+ score', color: 'emerald', unlocked: true });
    if (bestScore >= 90) list.push({ icon: Medal, label: language === 'hi' ? 'विशेषज्ञ' : 'Expert', desc: '90%+ score', color: 'amber', unlocked: true });
    if (bestScore >= 95) list.push({ icon: Award, label: language === 'hi' ? 'मास्टर' : 'Master', desc: '95%+ score', color: 'purple', unlocked: true });
    if (bestScore < 80) list.push({ icon: Star, label: language === 'hi' ? 'उत्कृष्ट' : 'Brilliant', desc: `Best: ${bestScore}%/80%`, color: 'gray', unlocked: false });

    // Accuracy
    if (avgAccuracy >= 70) list.push({ icon: Target, label: language === 'hi' ? 'सटीक निशानेबाज' : 'Sharpshooter', desc: '70%+ accuracy', color: 'emerald', unlocked: true });
    if (avgAccuracy < 70 && totalAttempts > 0) list.push({ icon: Target, label: language === 'hi' ? 'सटीक निशानेबाज' : 'Sharpshooter', desc: `${avgAccuracy}%/70% accuracy`, color: 'gray', unlocked: false });

    // Test creation
    if (testCount >= 3) list.push({ icon: PlusCircle, label: language === 'hi' ? 'रचनाकार' : 'Creator', desc: '3+ tests created', color: 'indigo', unlocked: true });

    return list.slice(0, 8);
  }, [stats, attempts, testCount, language]);

  const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-400 dark:text-gray-600', border: 'border-gray-200 dark:border-gray-700' },
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          {language === 'hi' ? 'उपलब्धियाँ' : 'Achievements'}
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {achievements.map((a, i) => {
          const c = colorMap[a.color];
          return (
            <div key={i}
              className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all
                ${a.unlocked
                  ? `${c.bg} ${c.border} hover:shadow-md cursor-default`
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                }`}
              title={a.desc}
            >
              {a.unlocked && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {!a.unlocked && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <Lock className="w-2 h-2 text-white" />
                </div>
              )}
              <a.icon className={`w-5 h-5 ${a.unlocked ? c.text : 'text-gray-400 dark:text-gray-600'}`} />
              <span className={`text-[9px] font-bold text-center leading-tight ${a.unlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                {a.label}
              </span>
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

const SmartRecommendations = ({ stats, attempts, paper1Units, paper2Units, paper1Count, paper2Count, language, navigate }) => {
  const recommendations = useMemo(() => {
    const recs = [];

    // Weak units analysis
    const allUnits = [...(paper1Units || []), ...(paper2Units || [])];
    if (allUnits.length > 0) {
      const sorted = [...allUnits].sort((a, b) => a.count - b.count);
      const weakest = sorted[0];
      if (weakest && weakest.count < 10) {
        recs.push({
          type: 'warning',
          icon: AlertTriangle,
          title: language === 'hi' ? 'कमजोर इकाई' : 'Weak Unit',
          desc: `"${weakest._id?.unit || 'Unknown'}" ${language === 'hi' ? 'में केवल' : 'has only'} ${weakest.count} ${language === 'hi' ? 'प्रश्न हैं। अधिक प्रश्न जोड़ें।' : 'questions. Add more.'}`,
          action: () => navigate('/import'),
          actionLabel: language === 'hi' ? 'आयात करें' : 'Import',
          color: 'amber',
        });
      }
    }

    // Paper balance
    if (paper1Count > 0 && paper2Count > 0) {
      const ratio = Math.min(paper1Count, paper2Count) / Math.max(paper1Count, paper2Count);
      if (ratio < 0.4) {
        const weaker = paper1Count < paper2Count ? 'Paper 1' : 'Paper 2';
        recs.push({
          type: 'info',
          icon: Layers,
          title: language === 'hi' ? 'असंतुलित तैयारी' : 'Imbalanced Prep',
          desc: `${weaker} ${language === 'hi' ? 'में बहुत कम प्रश्न हैं।' : 'has significantly fewer questions.'}`,
          action: () => navigate('/import'),
          actionLabel: language === 'hi' ? 'संतुलित करें' : 'Balance',
          color: 'blue',
        });
      }
    }

    // No tests taken
    if (!attempts || attempts.length === 0) {
      recs.push({
        type: 'suggestion',
        icon: Play,
        title: language === 'hi' ? 'पहला टेस्ट दें' : 'Take Your First Test',
        desc: language === 'hi' ? 'अभ्यास शुरू करने के लिए एक टेस्ट बनाएं और दें।' : 'Create and attempt a test to start practicing.',
        action: () => navigate('/tests/create'),
        actionLabel: language === 'hi' ? 'टेस्ट बनाएं' : 'Create Test',
        color: 'emerald',
      });
    }

    // Low accuracy
    if (attempts && attempts.length > 0) {
      const avgAcc = attempts.reduce((s, a) => {
        const t = (a.correctCount || 0) + (a.wrongCount || 0);
        return s + (t > 0 ? (a.correctCount / t) * 100 : 0);
      }, 0) / attempts.length;
      if (avgAcc < 50) {
        recs.push({
          type: 'warning',
          icon: Target,
          title: language === 'hi' ? 'सटीकता बढ़ाएं' : 'Improve Accuracy',
          desc: `${language === 'hi' ? 'आपकी औसत सटीकता' : 'Your average accuracy is'} ${Math.round(avgAcc)}%. ${language === 'hi' ? 'और अभ्यास करें।' : 'Practice more.'}`,
          action: () => navigate('/questions'),
          actionLabel: language === 'hi' ? 'अभ्यास करें' : 'Practice',
          color: 'red',
        });
      }
    }

    // No questions
    if (stats?.total === 0) {
      recs.push({
        type: 'suggestion',
        icon: Upload,
        title: language === 'hi' ? 'प्रश्न जोड़ें' : 'Add Questions',
        desc: language === 'hi' ? 'अभी कोई प्रश्न नहीं है। JSON से प्रश्न आयात करें।' : 'No questions yet. Import from JSON.',
        action: () => navigate('/import'),
        actionLabel: language === 'hi' ? 'आयात करें' : 'Import',
        color: 'purple',
      });
    }

    // More tests suggestion
    if (attempts && attempts.length > 0 && attempts.length < 5) {
      recs.push({
        type: 'suggestion',
        icon: Rocket,
        title: language === 'hi' ? 'अधिक अभ्यास करें' : 'Practice More',
        desc: `${language === 'hi' ? 'आपने केवल' : 'You have taken only'} ${attempts.length} ${language === 'hi' ? 'टेस्ट दिए हैं। लक्ष्य: 5+' : 'tests. Goal: 5+'}`,
        action: () => navigate('/tests'),
        actionLabel: language === 'hi' ? 'टेस्ट दें' : 'Take Test',
        color: 'indigo',
      });
    }

    return recs.slice(0, 4);
  }, [stats, attempts, paper1Units, paper2Units, paper1Count, paper2Count, language, navigate]);

  if (recommendations.length === 0) return null;

  const colorMap = {
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/30', icon: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800/30', icon: 'text-blue-500', btn: 'bg-blue-500 hover:bg-blue-600' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-200 dark:border-emerald-800/30', icon: 'text-emerald-500', btn: 'bg-emerald-500 hover:bg-emerald-600' },
    red: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800/30', icon: 'text-red-500', btn: 'bg-red-500 hover:bg-red-600' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-200 dark:border-purple-800/30', icon: 'text-purple-500', btn: 'bg-purple-500 hover:bg-purple-600' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-200 dark:border-indigo-800/30', icon: 'text-indigo-500', btn: 'bg-indigo-500 hover:bg-indigo-600' },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        {language === 'hi' ? 'स्मार्ट सुझाव' : 'Smart Recommendations'}
      </h3>
      <div className="space-y-2.5">
        {recommendations.map((rec, i) => {
          const c = colorMap[rec.color];
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
              <rec.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.icon}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.desc}</p>
              </div>
              <button onClick={rec.action}
                className={`${c.btn} text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-colors`}>
                {rec.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ================================================================
//              STAT CARD
// ================================================================

const StatCard = ({ icon: Icon, label, value, subValue, gradient, iconBg, onClick, delay = 0, sparkData }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4
        transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-600
        ${onClick ? 'cursor-pointer group' : ''} ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-2xl`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 dark:text-white mb-0.5"><AnimatedCounter end={value} /></p>
        {subValue && <p className="text-[10px] text-gray-400 dark:text-gray-500">{subValue}</p>}
        {sparkData && sparkData.length > 0 && (
          <div className="mt-2">
            <SparklineBars data={sparkData} height={20}
              color={iconBg.includes('blue') ? '#3b82f6' : iconBg.includes('green') || iconBg.includes('emerald') ? '#22c55e' : iconBg.includes('purple') ? '#8b5cf6' : '#f59e0b'} />
          </div>
        )}
      </div>
    </div>
  );
};

// ================================================================
//              PAPER DETAIL SECTION
// ================================================================

const PaperDetailSection = ({ paper, title, subtitle, icon: Icon, color, unitData, totalQuestions, language, navigate }) => {
  const [expanded, setExpanded] = useState(true);
  const cMap = {
    blue: {
      gradient: 'from-blue-600 to-cyan-600', gradientLight: 'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10',
      border: 'border-blue-200/50 dark:border-blue-800/30', text: 'text-blue-600 dark:text-blue-400',
      bar: 'from-blue-500 to-cyan-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10', iconBg: 'from-blue-500 to-cyan-500', ring: '#3b82f6',
    },
    purple: {
      gradient: 'from-purple-600 to-violet-600', gradientLight: 'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10',
      border: 'border-purple-200/50 dark:border-purple-800/30', text: 'text-purple-600 dark:text-purple-400',
      bar: 'from-purple-500 to-violet-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      hoverBg: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10', iconBg: 'from-purple-500 to-violet-500', ring: '#8b5cf6',
    },
  };
  const c = cMap[color];
  const sorted = [...unitData].sort((a, b) => b.count - a.count);
  const topUnit = sorted[0];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.border} transition-all duration-300 overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${c.gradientLight} p-4 border-b ${c.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {title}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                  {totalQuestions} Qs
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProgressRing percentage={Math.min(unitData.length * 10, 100)} size={44} strokeWidth={3.5} color={c.ring}>
              <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">{unitData.length}</span>
            </ProgressRing>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: language === 'hi' ? 'कुल' : 'Total', value: totalQuestions, icon: Hash },
            { label: language === 'hi' ? 'इकाइयाँ' : 'Units', value: unitData.length, icon: Layers },
            { label: language === 'hi' ? 'सबसे बड़ी' : 'Largest', value: topUnit?.count || 0, icon: Crown },
            { label: language === 'hi' ? 'औसत' : 'Avg', value: unitData.length > 0 ? Math.round(totalQuestions / unitData.length) : 0, icon: BarChart2 },
          ].map((s, i) => (
            <div key={i} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 text-center backdrop-blur-sm">
              <s.icon className={`w-3 h-3 mx-auto mb-0.5 ${c.text} opacity-50`} />
              <p className="text-sm font-bold text-gray-900 dark:text-white"><AnimatedCounter end={s.value} /></p>
              <p className="text-[8px] text-gray-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Unit List */}
      {expanded && (
        <div className="p-4">
          {sorted.length > 0 ? (
            <>
              <div className="space-y-1.5">
                {sorted.map((unit, idx) => {
                  const pct = totalQuestions > 0 ? Math.round((unit.count / totalQuestions) * 100) : 0;
                  const isTop = idx === 0;
                  return (
                    <div key={idx}
                      className={`group flex items-center gap-2.5 p-2.5 rounded-lg ${c.hoverBg} border border-transparent
                        hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer`}
                      onClick={() => navigate(`/questions?paper=${paper}&unit=${encodeURIComponent(unit._id?.unit || '')}`)}>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold
                        ${isTop ? `bg-gradient-to-br ${c.gradient} text-white shadow` : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{unit._id?.unit || 'Unknown'}</p>
                          {isTop && <Crown className={`w-3 h-3 ${c.text} flex-shrink-0`} />}
                        </div>
                        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-1000`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{unit.count}</p>
                        <p className="text-[9px] text-gray-400">{pct}%</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
              <button onClick={() => navigate(`/questions?paper=${paper}`)}
                className={`w-full mt-3 p-2 rounded-lg border border-dashed ${c.border} ${c.text}
                  text-[10px] font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                <Eye className="w-3 h-3" /> {language === 'hi' ? 'सभी देखें' : 'View All'} <ArrowRight className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="text-center py-6">
              <FileQuestion className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              <p className="text-xs text-gray-400 mb-3">{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions yet'}</p>
              <button onClick={() => navigate('/import')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r ${c.gradient} text-white text-[10px] font-semibold rounded-lg`}>
                <Upload className="w-3 h-3" /> {language === 'hi' ? 'आयात करें' : 'Import'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ================================================================
//          TABBED RECENT ACTIVITY (Attempted + Created)
// ================================================================

const TabbedRecentActivity = ({ attempts, createdTests, language, loadingAttempts, loadingCreated }) => {
  const [activeTab, setActiveTab] = useState('attempted');
  const navigate = useNavigate();

  const tabs = [
    { id: 'attempted', label: language === 'hi' ? 'दिए गए टेस्ट' : 'Attempted Tests', icon: ClipboardList, count: attempts.length },
    { id: 'created', label: language === 'hi' ? 'बनाए गए टेस्ट' : 'Created Tests', icon: PlusCircle, count: createdTests.length },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* ATTEMPTED TESTS TAB */}
        {activeTab === 'attempted' && (
          <>
            {loadingAttempts ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : attempts.length > 0 ? (
              <div className="space-y-2">
                {attempts.map((attempt, i) => {
                  const pct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                  const { grade, color } = getGrade(pct);
                  return (
                    <div key={attempt._id || i} onClick={() => navigate(`/results/${attempt._id}`)}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50
                        bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700
                        hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all cursor-pointer">
                      {/* Rank */}
                      <div className="w-6 text-center">
                        <span className="text-[10px] font-bold text-gray-400">#{i + 1}</span>
                      </div>
                      {/* Grade */}
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-base flex-shrink-0 ${gradeColorClasses[color]}`}>
                        {grade}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {attempt.testId?.title || 'Test'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-emerald-500" />{attempt.correctCount || 0}</span>
                          <span className="flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5 text-red-400" />{attempt.wrongCount || 0}</span>
                          <span className="flex items-center gap-0.5"><SkipForward className="w-2.5 h-2.5 text-gray-400" />{attempt.skippedCount || 0}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{formatTimeAgo(attempt.completedAt, language)}</span>
                        </div>
                      </div>
                      {/* Score */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-gray-900 dark:text-white">{pct}<span className="text-[10px] text-gray-400">%</span></p>
                        <p className="text-[9px] text-gray-400">{attempt.score}/{attempt.totalMarks}</p>
                      </div>
                      {/* Mini ring */}
                      <ProgressRing percentage={pct} size={32} strokeWidth={2.5}
                        color={pct >= 70 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#ef4444'}>
                        <span className="text-[7px] font-bold text-gray-500">{pct}</span>
                      </ProgressRing>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  );
                })}

                <Link to="/results"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700
                    text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <History className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'सभी परिणाम देखें' : 'View All Results'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-10">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{language === 'hi' ? 'अभी तक कोई टेस्ट नहीं दिया' : 'No tests attempted yet'}</p>
                <p className="text-xs text-gray-400 mb-4">{language === 'hi' ? 'अपना पहला मॉक टेस्ट दें' : 'Take your first mock test'}</p>
                <button onClick={() => navigate('/tests')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  <Play className="w-3.5 h-3.5" /> {language === 'hi' ? 'टेस्ट दें' : 'Take Test'}
                </button>
              </div>
            )}
          </>
        )}

        {/* CREATED TESTS TAB */}
        {activeTab === 'created' && (
          <>
            {loadingCreated ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : createdTests.length > 0 ? (
              <div className="space-y-2">
                {createdTests.map((test, i) => (
                  <div key={test._id || i}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50
                      bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700
                      hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{test.title || 'Untitled Test'}</h4>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{test.questionCount || test.questions?.length || 0} Qs</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{test.duration || 0} min</span>
                        <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatTimeAgo(test.createdAt, language)}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/test/${test._id}`); }}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400
                          hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        title={language === 'hi' ? 'टेस्ट दें' : 'Take Test'}>
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/tests/edit/${test._id}`); }}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400
                          hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        title={language === 'hi' ? 'संपादित करें' : 'Edit'}>
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <Link to="/tests"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700
                    text-xs font-semibold text-gray-500 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {language === 'hi' ? 'सभी टेस्ट देखें' : 'View All Tests'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-10">
                <PlusCircle className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{language === 'hi' ? 'अभी कोई टेस्ट नहीं बनाया' : 'No tests created yet'}</p>
                <p className="text-xs text-gray-400 mb-4">{language === 'hi' ? 'अपना पहला मॉक टेस्ट बनाएं' : 'Create your first mock test'}</p>
                <button onClick={() => navigate('/tests/create')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  <PlusCircle className="w-3.5 h-3.5" /> {language === 'hi' ? 'टेस्ट बनाएं' : 'Create Test'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ================================================================
//          PERFORMANCE SUMMARY COMPACT
// ================================================================

const PerformanceSummary = ({ attempts, language }) => {
  const data = useMemo(() => {
    if (!attempts || attempts.length === 0) return null;
    const tc = attempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tw = attempts.reduce((s, a) => s + (a.wrongCount || 0), 0);
    const ts = attempts.reduce((s, a) => s + (a.skippedCount || 0), 0);
    const tq = tc + tw + ts;
    const avgScore = Math.round(attempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length);
    const best = Math.max(...attempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0));
    return { tc, tw, ts, tq, avgScore, best, tests: attempts.length };
  }, [attempts]);

  if (!data) return null;

  const segments = [
    { label: language === 'hi' ? 'सही' : 'Correct', value: data.tc, color: '#22c55e', icon: CheckCircle },
    { label: language === 'hi' ? 'गलत' : 'Wrong', value: data.tw, color: '#ef4444', icon: XCircle },
    { label: language === 'hi' ? 'छोड़े' : 'Skipped', value: data.ts, color: '#94a3b8', icon: SkipForward },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-500" />
        {language === 'hi' ? 'प्रदर्शन सारांश' : 'Performance Summary'}
      </h3>

      {/* Accuracy Ring + Stats */}
      <div className="flex items-center gap-5 mb-4">
        <ProgressRing percentage={data.avgScore} size={80} strokeWidth={6}
          color={data.avgScore >= 70 ? '#22c55e' : data.avgScore >= 50 ? '#3b82f6' : '#ef4444'}>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">{data.avgScore}%</p>
            <p className="text-[7px] text-gray-400 uppercase">{language === 'hi' ? 'औसत' : 'AVG'}</p>
          </div>
        </ProgressRing>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {[
            { label: language === 'hi' ? 'टेस्ट' : 'Tests', value: data.tests, icon: ClipboardList, cls: 'text-indigo-500' },
            { label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', value: `${data.best}%`, icon: Trophy, cls: 'text-amber-500' },
            { label: language === 'hi' ? 'कुल प्रश्न' : 'Total Qs', value: data.tq, icon: Hash, cls: 'text-blue-500' },
            { label: language === 'hi' ? 'सही दर' : 'Hit Rate', value: `${data.tq > 0 ? Math.round((data.tc/data.tq)*100) : 0}%`, icon: Target, cls: 'text-emerald-500' },
          ].map((m, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
              <m.icon className={`w-3 h-3 mx-auto mb-0.5 ${m.cls}`} />
              <p className="text-sm font-bold text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-[8px] text-gray-400 uppercase">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2">
        {segments.map((seg, i) => (
          <div key={i} style={{ width: `${data.tq > 0 ? (seg.value/data.tq)*100 : 0}%`, background: seg.color }}
            className="transition-all duration-1000 first:rounded-l-full last:rounded-r-full" />
        ))}
      </div>
      <div className="flex justify-between">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-[10px] text-gray-500">{seg.label}: <b>{seg.value}</b></span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
//                  QUESTION TYPE CHART
// ================================================================

const QuestionTypeChart = ({ stats, language, navigate }) => {
  const types = stats?.byType ? Object.entries(stats.byType).sort((a, b) => b[1] - a[1]) : [];
  const colors = [
    { bar: 'from-blue-500 to-cyan-400', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { bar: 'from-emerald-500 to-green-400', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
    { bar: 'from-purple-500 to-violet-400', dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { bar: 'from-amber-500 to-yellow-400', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
    { bar: 'from-pink-500 to-rose-400', dot: 'bg-pink-500', badge: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400' },
    { bar: 'from-indigo-500 to-blue-400', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-500" />
          {language === 'hi' ? 'प्रश्न प्रकार' : 'Question Types'}
        </h3>
        <span className="text-[10px] text-gray-400">{types.length} types</span>
      </div>
      {types.length > 0 ? (
        <div className="space-y-2.5">
          {types.slice(0, 6).map(([type, count], i) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const c = colors[i % colors.length];
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{type.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{count}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${c.badge}`}>{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <FileQuestion className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
          <p className="text-xs text-gray-400 mb-3">{language === 'hi' ? 'कोई डेटा नहीं' : 'No data yet'}</p>
          <button onClick={() => navigate('/import')}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-[10px] font-semibold rounded-lg">
            <Upload className="w-3 h-3" /> Import
          </button>
        </div>
      )}
    </div>
  );
};

// ================================================================
//              QUICK ACTION CARD
// ================================================================

const QuickActionCard = ({ icon: Icon, title, description, to, gradient, badge, delay = 0 }) => {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <Link to={to}
      className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100
        dark:border-gray-700 p-4 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5
        hover:border-transparent ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{badge}</span>}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white transition-colors text-sm">{title}</h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-white/70 transition-colors mt-0.5">{description}</p>
        <div className="mt-2 flex items-center text-[10px] font-semibold text-gray-400 group-hover:text-white/90 transition-colors">
          Open <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

// ================================================================
//              MOTIVATIONAL QUOTE
// ================================================================

const quotes = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
];

const MotivationalQuote = () => {
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 text-white">
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
      <div className="relative">
        <Sparkles className="w-5 h-5 mb-2 text-yellow-300" />
        <p className="text-sm font-medium leading-relaxed mb-2 italic opacity-95">"{quote.text}"</p>
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 bg-white/40 rounded" />
          <p className="text-[10px] text-white/60">{quote.author}</p>
        </div>
      </div>
    </div>
  );
};

// ================================================================
//              STUDY STREAK
// ================================================================

const StudyStreak = ({ streak = 0, language }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-yellow-300" />
          <span className="font-bold text-sm">{language === 'hi' ? 'स्ट्रीक' : 'Streak'}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black">{streak}</span>
          <span className="text-[10px] text-white/60">{language === 'hi' ? 'दिन' : 'days'}</span>
        </div>
      </div>
      <div className="flex justify-between gap-1">
        {days.map((d, i) => (
          <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
            i <= today && streak > 0 ? 'bg-white text-orange-600 shadow-sm' : 'bg-white/15 text-white/50'}`}>{d}</div>
        ))}
      </div>
    </div>
  );
};

// ================================================================
//                     MAIN DASHBOARD
// ================================================================

const Dashboard = ({ language: propLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const { stats, fetchStats, loading } = useQuestions();
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [createdTests, setCreatedTests] = useState([]);
  const [testStats, setTestStats] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [loadingCreated, setLoadingCreated] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    loadRecentAttempts();
    loadCreatedTests();
    loadTestStats();
  }, [fetchStats]);

  const loadRecentAttempts = async () => {
    try {
      const r = await attemptService.getRecentAttempts(8);
      setRecentAttempts(r.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingAttempts(false); }
  };

  const loadCreatedTests = async () => {
    try {
      const r = await testService.getAll ? await testService.getAll() : await testService.getTests?.();
      const tests = r?.data?.tests || r?.data || r?.tests || [];
      setCreatedTests(Array.isArray(tests) ? tests.slice(0, 8) : []);
    } catch (e) { console.error(e); }
    finally { setLoadingCreated(false); }
  };

  const loadTestStats = async () => {
    try {
      const r = await testService.getStats();
      setTestStats(r.data);
    } catch (e) { console.error(e); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), loadRecentAttempts(), loadCreatedTests(), loadTestStats()]);
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  // Derived
  const paper1Units = useMemo(() => stats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], [stats]);
  const paper2Units = useMemo(() => stats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], [stats]);
  const paper1Count = useMemo(() => paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() => paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);

  const overallAccuracy = useMemo(() => {
    if (!recentAttempts.length) return 0;
    const tc = recentAttempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tq = recentAttempts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return tq > 0 ? Math.round((tc / tq) * 100) : 0;
  }, [recentAttempts]);

  const greeting = getGreetingData();
  const GreetIcon = greeting.icon;

  return (
    <Layout language={propLanguage} setLanguage={setLanguage}>
      {({ language }) => (
        <div className="space-y-6 pb-8">

          {/* ══════════════ HERO SECTION ══════════════ */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-7 text-white">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl" />
            <div className="absolute inset-0 opacity-[0.025]"
              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative">
              {/* Top bar: Clock + Session + Refresh */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2">
                  <LiveClock />
                  <SessionTimer language={language} />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleRefresh}
                    className={`p-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all ${refreshing ? 'animate-spin' : ''}`}
                    title="Refresh">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-[9px] text-indigo-300/40">
                    {language === 'hi' ? 'अपडेटेड' : 'Updated'}: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Main hero content */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${greeting.color} flex items-center justify-center shadow-lg`}>
                      <GreetIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-black">{language === 'hi' ? greeting.textHi : greeting.text}</h1>
                      <p className="text-[10px] text-indigo-300/50">
                        {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-indigo-200/70 text-sm mb-5 max-w-md leading-relaxed">
                    {language === 'hi'
                      ? 'अपनी UGC NET की तैयारी जारी रखें। नियमित अभ्यास सफलता की कुंजी है।'
                      : 'Continue your UGC NET preparation. Consistent practice is the key to success.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate('/tests/create')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-all hover:shadow-xl hover:-translate-y-0.5">
                      <Play className="w-4 h-4" /> {language === 'hi' ? 'टेस्ट शुरू करें' : 'Start Test'}
                    </button>
                    <button onClick={() => navigate('/import')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 font-semibold text-sm rounded-xl hover:bg-white/20 transition-all">
                      <Upload className="w-4 h-4" /> {language === 'hi' ? 'आयात करें' : 'Import'}
                    </button>
                    <button onClick={() => navigate('/questions')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 font-medium text-sm rounded-xl hover:bg-white/15 transition-all">
                      <BookOpen className="w-4 h-4" /> {language === 'hi' ? 'प्रश्न बैंक' : 'Questions'}
                    </button>
                  </div>
                </div>

                {/* Right: Paper stats + Accuracy ring */}
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col gap-2">
                    {[
                      { label: 'Paper 1', count: paper1Count, icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
                      { label: 'Paper 2', count: paper2Count, icon: Target, color: 'from-purple-500 to-violet-500' },
                      { label: language === 'hi' ? 'टेस्ट' : 'Tests', count: testStats?.totalTests || 0, icon: ClipboardList, color: 'from-amber-500 to-orange-500' },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                        <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                          <p.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] text-indigo-300/50">{p.label}</p>
                          <p className="text-sm font-bold">{p.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ProgressRing percentage={overallAccuracy} size={130} strokeWidth={9} color="#22c55e" bgColor="rgba(255,255,255,0.08)">
                    <div className="text-center">
                      <p className="text-2xl font-black">{overallAccuracy}%</p>
                      <p className="text-[9px] text-indigo-300/50 uppercase tracking-wider">{language === 'hi' ? 'सटीकता' : 'Accuracy'}</p>
                    </div>
                  </ProgressRing>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ STATS GRID ══════════════ */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={FileQuestion} label={language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'} value={stats?.total || 0}
                subValue={language === 'hi' ? 'प्रश्न बैंक' : 'in bank'} gradient="from-blue-500 to-cyan-500" iconBg="from-blue-500 to-cyan-600"
                onClick={() => navigate('/questions')} delay={0} sparkData={[3,7,5,12,8,15,10]} />
              <StatCard icon={BookOpen} label={language === 'hi' ? 'पेपर 1' : 'Paper 1'} value={paper1Count}
                subValue={language === 'hi' ? 'सामान्य' : 'General'} gradient="from-emerald-500 to-green-500" iconBg="from-emerald-500 to-green-600"
                onClick={() => navigate('/questions?paper=paper1')} delay={80} sparkData={[2,5,3,8,6,10,7]} />
              <StatCard icon={Target} label={language === 'hi' ? 'पेपर 2' : 'Paper 2'} value={paper2Count}
                subValue={language === 'hi' ? 'विषय' : 'Subject'} gradient="from-purple-500 to-violet-500" iconBg="from-purple-500 to-violet-600"
                onClick={() => navigate('/questions?paper=paper2')} delay={160} sparkData={[4,6,9,5,11,8,13]} />
              <StatCard icon={ClipboardList} label={language === 'hi' ? 'कुल टेस्ट' : 'Total Tests'} value={testStats?.totalTests || 0}
                subValue={`${testStats?.totalAttempts || 0} ${language === 'hi' ? 'प्रयास' : 'attempts'}`} gradient="from-amber-500 to-orange-500" iconBg="from-amber-500 to-orange-600"
                onClick={() => navigate('/tests')} delay={240} sparkData={[1,3,2,5,4,7,6]} />
            </div>
          )}

          {/* ══════════════ PAPER ANALYSIS ══════════════ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{language === 'hi' ? 'पेपर-वार विश्लेषण' : 'Paper-wise Analysis'}</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PaperDetailSection paper="paper1" title={language === 'hi' ? 'पेपर 1' : 'Paper 1'}
                subtitle={language === 'hi' ? 'सामान्य - शिक्षण अभिवृत्ति' : 'General - Teaching Aptitude'}
                icon={BookOpen} color="blue" unitData={paper1Units} totalQuestions={paper1Count} language={language} navigate={navigate} />
              <PaperDetailSection paper="paper2" title={language === 'hi' ? 'पेपर 2' : 'Paper 2'}
                subtitle={language === 'hi' ? 'विषय - इतिहास' : 'Subject - History'}
                icon={Target} color="purple" unitData={paper2Units} totalQuestions={paper2Count} language={language} navigate={navigate} />
            </div>
          </div>

          {/* ══════════════ SCORE TREND + HEAT MAP ══════════════ */}
          {recentAttempts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ScoreTrendChart attempts={recentAttempts} language={language} />
              <HeatMapCalendar attempts={recentAttempts} language={language} />
            </div>
          )}

          {/* ══════════════ ACTIVITY + PERFORMANCE + ACHIEVEMENTS ══════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Tabbed Recent Activity - 2 cols */}
            <div className="lg:col-span-2">
              <TabbedRecentActivity
                attempts={recentAttempts} createdTests={createdTests}
                language={language} loadingAttempts={loadingAttempts} loadingCreated={loadingCreated} />
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {recentAttempts.length > 0 && <PerformanceSummary attempts={recentAttempts} language={language} />}
              <AchievementBadges stats={stats} attempts={recentAttempts} testCount={testStats?.totalTests || 0} language={language} />
            </div>
          </div>

          {/* ══════════════ SMART RECOMMENDATIONS ══════════════ */}
          <SmartRecommendations stats={stats} attempts={recentAttempts}
            paper1Units={paper1Units} paper2Units={paper2Units}
            paper1Count={paper1Count} paper2Count={paper2Count}
            language={language} navigate={navigate} />

          {/* ══════════════ QUICK ACTIONS + STREAK + QUOTE ══════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{language === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}</h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickActionCard icon={PlusCircle} title={language === 'hi' ? 'नया टेस्ट' : 'New Test'}
                  description={language === 'hi' ? 'मॉक टेस्ट बनाएं' : 'Create mock test'} to="/tests/create" gradient="from-blue-600 to-indigo-600" delay={0} />
                <QuickActionCard icon={Upload} title={language === 'hi' ? 'आयात' : 'Import'}
                  description={language === 'hi' ? 'JSON से' : 'From JSON'} to="/import" gradient="from-emerald-600 to-green-600" badge="JSON" delay={80} />
                <QuickActionCard icon={FileQuestion} title={language === 'hi' ? 'प्रश्न' : 'Questions'}
                  description={language === 'hi' ? 'प्रश्न बैंक' : 'Question bank'} to="/questions" gradient="from-purple-600 to-violet-600" delay={160} />
                <QuickActionCard icon={BarChart3} title={language === 'hi' ? 'परिणाम' : 'Results'}
                  description={language === 'hi' ? 'प्रगति देखें' : 'View progress'} to="/results" gradient="from-orange-600 to-red-600" delay={240} />
              </div>
            </div>
            <div className="space-y-4">
              <StudyStreak streak={recentAttempts.length} language={language} />
              <MotivationalQuote />
            </div>
          </div>

          {/* ══════════════ QUESTION TYPES ══════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <QuestionTypeChart stats={stats} language={language} navigate={navigate} />

            {/* Paper Comparison Visual */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Swords className="w-5 h-5 text-indigo-500" />
                {language === 'hi' ? 'पेपर तुलना' : 'Paper Comparison'}
              </h3>
              <div className="space-y-4">
                {/* Visual comparison bars */}
                {[
                  { label: language === 'hi' ? 'प्रश्न' : 'Questions', p1: paper1Count, p2: paper2Count },
                  { label: language === 'hi' ? 'इकाइयाँ' : 'Units', p1: paper1Units.length, p2: paper2Units.length },
                ].map((item, i) => {
                  const total = item.p1 + item.p2 || 1;
                  const p1Pct = Math.round((item.p1 / total) * 100);
                  const p2Pct = 100 - p1Pct;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-500">{item.label}</span>
                      </div>
                      <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center transition-all duration-1000"
                          style={{ width: `${p1Pct}%` }}>
                          <span className="text-[10px] font-bold text-white">{item.p1}</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-violet-400 flex items-center justify-center transition-all duration-1000"
                          style={{ width: `${p2Pct}%` }}>
                          <span className="text-[10px] font-bold text-white">{item.p2}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] font-semibold text-blue-500">P1: {p1Pct}%</span>
                        <span className="text-[9px] font-semibold text-purple-500">P2: {p2Pct}%</span>
                      </div>
                    </div>
                  );
                })}

                {/* Donut comparison */}
                <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <ProgressRing percentage={stats?.total > 0 ? Math.round((paper1Count / stats.total) * 100) : 0}
                      size={64} strokeWidth={5} color="#3b82f6">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {stats?.total > 0 ? Math.round((paper1Count / stats.total) * 100) : 0}%
                      </span>
                    </ProgressRing>
                    <p className="text-[10px] font-semibold text-gray-500 mt-1">Paper 1</p>
                  </div>
                  <div className="text-center text-gray-300 dark:text-gray-600">
                    <Swords className="w-5 h-5 mx-auto" />
                    <p className="text-[9px] mt-1">VS</p>
                  </div>
                  <div className="text-center">
                    <ProgressRing percentage={stats?.total > 0 ? Math.round((paper2Count / stats.total) * 100) : 0}
                      size={64} strokeWidth={5} color="#8b5cf6">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {stats?.total > 0 ? Math.round((paper2Count / stats.total) * 100) : 0}%
                      </span>
                    </ProgressRing>
                    <p className="text-[10px] font-semibold text-gray-500 mt-1">Paper 2</p>
                  </div>
                </div>

                {/* Balance indicator */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  {(() => {
                    const total = paper1Count + paper2Count;
                    if (total === 0) return (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Info className="w-4 h-4" />
                        <span>{language === 'hi' ? 'प्रश्न जोड़ें तुलना के लिए' : 'Add questions to see comparison'}</span>
                      </div>
                    );
                    const ratio = Math.min(paper1Count, paper2Count) / Math.max(paper1Count, paper2Count);
                    const balanced = ratio > 0.7;
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          balanced ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                          {balanced ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${balanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {balanced
                              ? (language === 'hi' ? 'संतुलित तैयारी' : 'Well Balanced')
                              : (language === 'hi' ? 'असंतुलित - ध्यान दें' : 'Imbalanced - Needs Attention')}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {language === 'hi' ? `अनुपात: ${Math.round(ratio * 100)}%` : `Balance ratio: ${Math.round(ratio * 100)}%`}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════ FOOTER CTA ══════════════ */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 text-white">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">{language === 'hi' ? 'UGC NET क्रैक करने के लिए तैयार?' : 'Ready to crack UGC NET?'}</h3>
                  <p className="text-xs text-gray-400">{language === 'hi' ? 'अभी अभ्यास शुरू करें!' : 'Start practicing now!'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/tests')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <Play className="w-4 h-4" /> {language === 'hi' ? 'टेस्ट देखें' : 'Browse Tests'}
                </button>
                <button onClick={() => navigate('/results')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 font-semibold text-sm rounded-xl hover:bg-white/20 transition-all">
                  <BarChart3 className="w-4 h-4" /> {language === 'hi' ? 'परिणाम' : 'Results'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </Layout>
  );
};

export default Dashboard;