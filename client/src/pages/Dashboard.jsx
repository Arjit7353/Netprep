// client/src/pages/Dashboard.jsx
// ═══════════════════════════════════════════════════════════════
//  NETPREP ULTIMATE DASHBOARD V3 - PART 1 (Components & Utilities)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend, ComposedChart,
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
  Flag, CircleDot, Brain, Percent, MapPin,
  Milestone, CalendarDays, CalendarClock, Workflow,
  Grid3X3, Dumbbell, HeartPulse,
  ArrowUp, ArrowDown, Minus, Settings, X,
  BookMarked, Repeat, RotateCcw, Newspaper,
  SquareStack, ChevronLeft, Download, Share2,
  Inbox, AlarmClock, Footprints, CircleCheck,
  ListChecks, NotebookPen, Waypoints, ScanEye,
  Route, Compass, Focus, Telescope, Mountain,
  TrendingUp as TrendUp, ArrowRightCircle, FastForward,
  Rewind, RotateCw, Gem, Sword, ShieldCheck,
  PartyPopper, Gift, Glasses, Pencil, PenTool,
  Save, Check, Edit3, XOctagon, ThumbsUp,
  ThumbsDown, HelpCircle, MessageCircle, Bell,
  Volume2, VolumeX, Eye as EyeIcon, EyeOff,
  Maximize2, Minimize2, ExternalLink, Copy,
  Printer, Mail, Phone, MapPinned, Navigation,
  Home, User, Users, Heart, Bookmark,
  Tag, Filter, Search, SortAsc, SortDesc,
  Grid, List, Table, MoreHorizontal, MoreVertical, Quote,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';

// ════════════════════════════════════════════════════════════
//  CONSTANTS & CONFIGURATION
// ════════════════════════════════════════════════════════════
const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#94a3b8',
};

const GRADIENTS = {
  blue: 'from-blue-500 to-cyan-500',
  purple: 'from-purple-500 to-violet-500',
  green: 'from-emerald-500 to-green-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-red-500 to-rose-500',
  indigo: 'from-indigo-500 to-purple-500',
  pink: 'from-pink-500 to-rose-500',
  teal: 'from-teal-500 to-cyan-500',
};

const GRADE_COLORS = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

// ════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { Icon: Moon, en: 'Late Night Study', hi: 'देर रात अध्ययन', gradient: 'from-indigo-600 to-purple-700', emoji: '🌙' };
  if (h < 12) return { Icon: Sun, en: 'Good Morning', hi: 'सुप्रभात', gradient: 'from-amber-500 to-orange-600', emoji: '☀️' };
  if (h < 17) return { Icon: Coffee, en: 'Good Afternoon', hi: 'नमस्ते', gradient: 'from-blue-600 to-indigo-600', emoji: '☕' };
  if (h < 21) return { Icon: Sunset, en: 'Good Evening', hi: 'शुभ संध्या', gradient: 'from-orange-600 to-rose-600', emoji: '🌅' };
  return { Icon: Moon, en: 'Good Night', hi: 'शुभ रात्रि', gradient: 'from-indigo-600 to-purple-700', emoji: '🌙' };
};

const timeAgo = (date, lang = 'en') => {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return lang === 'hi' ? 'अभी' : 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
  return new Date(date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short' });
};

const getGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', color: 'emerald', emoji: '🏆' };
  if (percentage >= 80) return { grade: 'A', color: 'emerald', emoji: '⭐' };
  if (percentage >= 70) return { grade: 'B+', color: 'blue', emoji: '👍' };
  if (percentage >= 60) return { grade: 'B', color: 'blue', emoji: '👌' };
  if (percentage >= 50) return { grade: 'C', color: 'amber', emoji: '📚' };
  if (percentage >= 40) return { grade: 'D', color: 'orange', emoji: '💪' };
  return { grade: 'F', color: 'red', emoji: '🔥' };
};

const formatTime = (seconds) => {
  if (!seconds) return '0m';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// ════════════════════════════════════════════════════════════
//  MICRO COMPONENTS
// ════════════════════════════════════════════════════════════

// Animated Counter
const AnimatedCounter = React.memo(({ end, suffix = '', decimals = 0, duration = 1200 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  
  useEffect(() => {
    if (end === undefined || end === null) {
      setCount(0);
      return;
    }
    
    const target = typeof end === 'number' ? end : parseFloat(end) || 0;
    let startTime = null;
    let animationFrame;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const current = decimals > 0 
        ? parseFloat((easeOut * target).toFixed(decimals))
        : Math.floor(easeOut * target);
      setCount(current);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, decimals, duration]);
  
  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
});

// Circular Progress Ring
const ProgressRing = React.memo(({ 
  percentage, 
  size = 100, 
  strokeWidth = 7, 
  color = '#3b82f6', 
  bgColor,
  showPercentage = false,
  children 
}) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(Math.min(percentage || 0, 100)), 200);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || '#e5e7eb'}
          strokeWidth={strokeWidth}
          className="dark:stroke-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - animatedPct / 100)}
          className="transition-all duration-[1.5s] ease-out"
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {showPercentage ? (
          <span className="text-sm font-bold">{Math.round(animatedPct)}%</span>
        ) : children}
      </div>
    </div>
  );
});

// Skeleton Loader
const Skeleton = ({ className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-200 dark:bg-gray-700',
    shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer',
  };
  
  return (
    <div className={`animate-pulse rounded-lg ${variants[variant]} ${className}`} />
  );
};

// Live Clock Component (Isolated to prevent re-renders)
const LiveClock = React.memo(() => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
      <Clock className="w-3 h-3 text-indigo-300" />
      <span className="text-xs font-mono font-bold text-white tabular-nums">
        {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </span>
    </div>
  );
});

// Session Timer (Isolated)
const SessionTimer = React.memo(() => {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  
  const pad = (n) => String(n).padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
      <Timer className="w-3 h-3 text-emerald-400 animate-pulse" />
      <span className="text-xs font-mono font-bold text-white tabular-nums">
        {pad(hours)}:{pad(mins)}:{pad(secs)}
      </span>
    </div>
  );
});

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 text-xs backdrop-blur-sm">
      {label && <p className="font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400">{entry.name || entry.dataKey}:</span>
          <span className="font-bold">
            {typeof entry.value === 'number' ? entry.value.toFixed(entry.value % 1 === 0 ? 0 : 1) : entry.value}
            {entry.unit || ''}
          </span>
        </p>
      ))}
    </div>
  );
};

// Trend Badge
const TrendBadge = ({ direction, size = 'sm', showLabel = true }) => {
  const sizes = {
    xs: 'text-[7px] px-1 py-0.5',
    sm: 'text-[8px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-1',
  };
  
  const configs = {
    up: { 
      icon: ArrowUp, 
      label: 'Up', 
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
    },
    down: { 
      icon: ArrowDown, 
      label: 'Down', 
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
    },
    improving: { 
      icon: TrendingUp, 
      label: 'Improving', 
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
    },
    declining: { 
      icon: TrendingDown, 
      label: 'Declining', 
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
    },
    stable: { 
      icon: Minus, 
      label: 'Stable', 
      className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
    },
    neutral: { 
      icon: Minus, 
      label: 'Neutral', 
      className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' 
    },
  };
  
  const config = configs[direction] || configs.neutral;
  const Icon = config.icon;
  
  return (
    <span className={`${sizes[size]} rounded-full font-bold flex items-center gap-0.5 ${config.className}`}>
      <Icon className="w-2.5 h-2.5" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

// Mini Sparkline Chart
const Sparkline = React.memo(({ data, color = '#3b82f6', height = 24 }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-t-sm transition-all duration-300"
          style={{
            height: `${Math.max(((value - min) / range) * 100, 8)}%`,
            backgroundColor: color,
            opacity: 0.3 + (index / data.length) * 0.7,
          }}
        />
      ))}
    </div>
  );
});

// ════════════════════════════════════════════════════════════
//  STAT CARD COMPONENT
// ════════════════════════════════════════════════════════════
const StatCard = React.memo(({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  gradient, 
  iconGradient,
  onClick, 
  delay = 0, 
  sparkData, 
  trend,
  change,
  loading = false,
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (loading) {
    return <Skeleton className="h-28 rounded-2xl" variant="shimmer" />;
  }
  
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl 
        border border-gray-100 dark:border-gray-700 p-4
        transition-all duration-500 hover:shadow-xl hover:-translate-y-1
        ${onClick ? 'cursor-pointer group' : ''}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Background Gradient Glow */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-2xl group-hover:opacity-[0.12] transition-opacity`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            {trend && <TrendBadge direction={trend} size="xs" />}
          </div>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              <AnimatedCounter end={value} />
            </p>
            {subtitle && (
              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                {change !== undefined && (
                  <span className={`font-bold ${change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                )}
                {subtitle}
              </p>
            )}
          </div>
          
          {sparkData && sparkData.length > 0 && (
            <div className="w-16">
              <Sparkline data={sparkData} color={iconGradient?.includes('blue') ? '#3b82f6' : iconGradient?.includes('emerald') ? '#22c55e' : iconGradient?.includes('purple') ? '#8b5cf6' : '#f59e0b'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ════════════════════════════════════════════════════════════
//  🆕 PROGRESS TRACKER (Low to High Scores)
// ════════════════════════════════════════════════════════════
const ProgressTrackerCard = ({ data, language: l, navigate }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('score'); // score, date, improvement
  
  if (!data || data.stats.totalTests === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center">
        <Route className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
          {l === 'hi' ? 'प्रगति ट्रैकर' : 'Progress Tracker'}
        </h3>
        <p className="text-sm text-gray-500">
          {l === 'hi' ? 'टेस्ट दें और अपनी प्रगति देखें' : 'Take tests to track your progress'}
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: l === 'hi' ? 'सभी' : 'All', count: data.stats.totalTests, color: 'indigo' },
    { id: 'critical', label: l === 'hi' ? 'गंभीर' : 'Critical', count: data.stats.criticalCount, color: 'red' },
    { id: 'weak', label: l === 'hi' ? 'कमजोर' : 'Weak', count: data.stats.weakCount, color: 'orange' },
    { id: 'good', label: l === 'hi' ? 'अच्छा' : 'Good', count: data.stats.goodCount, color: 'green' },
  ];

  const getTests = () => {
    let tests;
    switch (activeTab) {
      case 'critical': tests = data.scoreRanges[0].tests; break;
      case 'weak': tests = [...data.scoreRanges[1].tests, ...data.scoreRanges[2].tests]; break;
      case 'good': tests = [...data.scoreRanges[3].tests, ...data.scoreRanges[4].tests, ...data.scoreRanges[5].tests]; break;
      default: tests = data.testsWithScores;
    }
    
    // Sort
    if (sortBy === 'score') {
      return [...tests].sort((a, b) => a.bestScore - b.bestScore);
    } else if (sortBy === 'date') {
      return [...tests].sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    } else if (sortBy === 'improvement') {
      return [...tests].sort((a, b) => b.improvement - a.improvement);
    }
    return tests;
  };

  const displayTests = getTests();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {l === 'hi' ? 'प्रगति ट्रैकर' : 'Progress Tracker'}
              </h3>
              <p className="text-[9px] text-gray-500">
                {l === 'hi' ? 'कम से अधिक स्कोर' : 'Low to High Scores'}
              </p>
            </div>
          </div>
          
          {/* Sort Dropdown */}
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 border-0 font-bold text-gray-600 dark:text-gray-300"
          >
            <option value="score">{l === 'hi' ? 'स्कोर' : 'Score'}</option>
            <option value="date">{l === 'hi' ? 'तारीख' : 'Date'}</option>
            <option value="improvement">{l === 'hi' ? 'सुधार' : 'Improvement'}</option>
          </select>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-2 flex-wrap text-[9px]">
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold">
            {data.stats.avgScore}% {l === 'hi' ? 'औसत' : 'avg'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">
            +{data.stats.avgImprovement}% {l === 'hi' ? 'सुधार' : 'imp'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">
            {data.stats.above70}/{data.stats.totalTests} ≥70%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2 text-[10px] font-bold transition-all ${
              activeTab === tab.id 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-gray-800' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`ml-1 px-1.5 rounded-full text-[8px] ${
              activeTab === tab.id 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Score Range Visualization */}
      <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1">
          {data.scoreRanges.map((range, i) => (
            <div 
              key={i}
              className="flex-1 relative group"
              title={`${range.label}: ${range.tests.length} tests`}
            >
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  backgroundColor: range.color,
                  opacity: range.tests.length > 0 ? 1 : 0.2,
                }}
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {range.tests.length}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[7px] text-gray-400 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Tests List */}
      <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
        {displayTests.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-200" />
            <p className="text-xs text-gray-400">
              {l === 'hi' ? 'इस श्रेणी में कोई टेस्ट नहीं' : 'No tests in this category'}
            </p>
          </div>
        ) : (
          displayTests.slice(0, 15).map((test, index) => {
            const { grade, color, emoji } = getGrade(test.bestScore);
            const isImproving = test.improvement > 0;
            const isDeclining = test.improvement < 0;
            
            return (
              <div
                key={test.testId || index}
                onClick={() => navigate?.(`/results/${test.lastAttempt?._id}`)}
                className={`
                  group flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer
                  transition-all hover:shadow-lg
                  ${test.bestScore < 40 
                    ? 'bg-red-50/50 border-red-200 dark:bg-red-900/5 dark:border-red-800/30' 
                    : test.bestScore < 60 
                      ? 'bg-orange-50/30 border-orange-200 dark:bg-orange-900/5 dark:border-orange-800/30'
                      : test.bestScore < 80
                        ? 'bg-blue-50/30 border-blue-200 dark:bg-blue-900/5 dark:border-blue-800/30'
                        : 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-900/5 dark:border-emerald-800/30'
                  }
                `}
              >
                {/* Rank */}
                <div className="w-6 text-center flex-shrink-0">
                  <span className={`text-sm font-black ${
                    test.bestScore < 40 ? 'text-red-500' :
                    test.bestScore < 60 ? 'text-orange-500' :
                    test.bestScore < 80 ? 'text-blue-500' :
                    'text-emerald-500'
                  }`}>
                    {index + 1}
                  </span>
                </div>

                {/* Score Circle */}
                <ProgressRing 
                  percentage={test.bestScore} 
                  size={36} 
                  strokeWidth={3}
                  color={test.bestScore >= 70 ? '#22c55e' : test.bestScore >= 50 ? '#f59e0b' : '#ef4444'}
                >
                  <span className="text-[8px] font-bold">{test.bestScore}</span>
                </ProgressRing>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
                      {test.title}
                    </h4>
                    {test.paper && (
                      <span className={`px-1 rounded text-[7px] font-bold ${
                        test.paper === 'paper1' 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' 
                          : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                      }`}>
                        {test.paper === 'paper1' ? 'P1' : 'P2'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[8px] text-gray-500">
                    <span>{test.totalAttempts} att</span>
                    <span>•</span>
                    <span>{test.daysSinceLastAttempt}d ago</span>
                    {test.improvement !== 0 && (
                      <>
                        <span>•</span>
                        <span className={`font-bold flex items-center gap-0.5 ${
                          isImproving ? 'text-emerald-600' : isDeclining ? 'text-red-600' : ''
                        }`}>
                          {isImproving ? <ArrowUp className="w-2.5 h-2.5" /> : isDeclining ? <ArrowDown className="w-2.5 h-2.5" /> : null}
                          {isImproving ? '+' : ''}{test.improvement}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Mini score history */}
                  {test.attempts && test.attempts.length > 1 && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {test.attempts.slice(-6).map((attempt, i) => (
                        <div
                          key={i}
                          className="h-1 rounded-full transition-all"
                          style={{
                            width: `${Math.max(attempt.score / 4, 4)}px`,
                            backgroundColor: attempt.score >= 70 ? '#22c55e' : attempt.score >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                          title={`${attempt.score}%`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Grade Badge */}
                <div className={`flex flex-col items-center flex-shrink-0 p-1.5 rounded-lg border ${GRADE_COLORS[color]}`}>
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[9px] font-black">{grade}</span>
                </div>

                {/* Retry Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate?.(`/test/${test.testId}`);
                  }}
                  className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                    test.bestScore < 60 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30' 
                      : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30'
                  }`}
                  title={l === 'hi' ? 'दोबारा दें' : 'Retry'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}

        {/* Show More Button */}
        {displayTests.length > 15 && (
          <button
            onClick={() => navigate?.('/results')}
            className="w-full py-2 text-center text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
          >
            {l === 'hi' ? `और ${displayTests.length - 15} देखें` : `View ${displayTests.length - 15} more`}
            <ArrowRight className="w-3 h-3 inline ml-1" />
          </button>
        )}
      </div>

      {/* Footer - Quick Actions */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-500">
            {l === 'hi' ? 'अगला रिट्राई' : 'Next retry'}:
            {data.retryQueue[0] && (
              <span className="font-bold text-red-600 ml-1">{data.retryQueue[0].title}</span>
            )}
          </span>
          
          {data.retryQueue[0] && (
            <button
              onClick={() => navigate?.(`/test/${data.retryQueue[0].testId}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-bold rounded-lg hover:shadow-lg transition-all"
            >
              <Play className="w-3 h-3" />
              {l === 'hi' ? 'शुरू करें' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  EXAM COMMAND CENTER (Enhanced with Date Persistence)
// ════════════════════════════════════════════════════════════
const ExamCommandCenter = ({ data, examDate, setExamDate, language: l, navigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState(examDate || '');
  const [activeView, setActiveView] = useState('countdown');
  const inputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempDate) {
      setExamDate(tempDate);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempDate(examDate || '');
    setIsEditing(false);
  };

  // Not set - Show setup UI
  if (!data?.countdown?.isSet) {
    return (
      <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative">
          <div className="text-center mb-4">
            <CalendarClock className="w-12 h-12 mx-auto mb-3 text-pink-200" />
            <h3 className="font-bold text-lg mb-1">
              {l === 'hi' ? 'परीक्षा तिथि सेट करें' : 'Set Your Exam Date'}
            </h3>
            <p className="text-[11px] text-pink-200/70 mb-4">
              {l === 'hi' ? 'एक बार सेट करें, यह सेव हो जाएगा' : 'Set once, it will be saved automatically'}
            </p>
          </div>

          <div className="space-y-3">
            <input
              ref={inputRef}
              type="date"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50"
              style={{ colorScheme: 'dark' }}
            />
            
            <button
              onClick={handleSave}
              disabled={!tempDate}
              className="w-full px-4 py-3 bg-white text-pink-600 font-bold text-sm rounded-xl hover:bg-pink-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {l === 'hi' ? 'सेव करें' : 'Save Date'}
            </button>
          </div>

          <p className="text-[9px] text-center text-pink-200/50 mt-3">
            💾 {l === 'hi' ? 'आपकी तारीख ऑटो-सेव होगी' : 'Your date will be auto-saved'}
          </p>
        </div>
      </div>
    );
  }

  const { countdown, phase, milestones, pace, readiness, todayMission, riskAlerts } = data;
  
  // Urgency-based styling
  const urgency = countdown.days <= 7 ? 'critical' 
    : countdown.days <= 30 ? 'urgent' 
    : countdown.days <= 90 ? 'moderate' 
    : 'relaxed';
  
  const gradients = {
    critical: 'from-red-600 via-rose-700 to-red-800',
    urgent: 'from-orange-500 via-amber-600 to-orange-700',
    moderate: 'from-blue-600 via-indigo-700 to-blue-800',
    relaxed: 'from-emerald-600 via-green-700 to-emerald-800',
  };

  const phaseIcons = {
    Foundation: BookOpen,
    Practice: Dumbbell,
    Revision: RotateCcw,
    'Mock Tests': FileText,
    'Final Review': ScanEye,
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[urgency]} rounded-2xl text-white relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

      {/* Header */}
      <div className="relative px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span className="font-bold text-xs">
            UGC NET {l === 'hi' ? 'कमांड सेंटर' : 'Command Center'}
          </span>
          {/* Saved indicator */}
          <span className="flex items-center gap-0.5 text-[8px] text-white/50">
            <CheckCircle className="w-2.5 h-2.5" />
            {l === 'hi' ? 'सेव्ड' : 'Saved'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {['countdown', 'phases', 'mission'].map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                activeView === v ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {v === 'countdown' ? '⏱️' : v === 'phases' ? '📊' : '🎯'}
            </button>
          ))}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 rounded bg-white/10 hover:bg-white/20 transition-all"
            title={l === 'hi' ? 'तारीख बदलें' : 'Change date'}
          >
            <Edit3 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="px-4 py-3 bg-black/20 border-b border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="date"
              value={tempDate || examDate}
              onChange={(e) => setTempDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 px-3 py-2 rounded-lg bg-white/20 border border-white/20 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!tempDate}
              className="flex-1 px-3 py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" />
              {l === 'hi' ? 'सेव' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-white/10 text-xs rounded-lg hover:bg-white/20 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {l === 'hi' ? 'रद्द' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="relative p-4">
        {/* Countdown View */}
        {activeView === 'countdown' && (
          <>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                {[
                  { value: countdown.days, label: l === 'hi' ? 'दिन' : 'DAYS' },
                  { value: countdown.hours, label: l === 'hi' ? 'घंटे' : 'HRS' },
                  { value: countdown.minutes, label: l === 'hi' ? 'मिनट' : 'MIN' },
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-16 h-16 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center ${
                      urgency === 'critical' ? 'animate-pulse' : ''
                    }`}>
                      <span className="text-2xl font-black">{item.value}</span>
                    </div>
                    <span className="text-[7px] text-white/50 uppercase mt-1 block">{item.label}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-[10px] text-white/60">
                📅 {new Date(examDate).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Journey Progress */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-white/50">{l === 'hi' ? 'यात्रा प्रगति' : 'Journey Progress'}</span>
                <span className="text-[9px] font-bold">{phase.overallProgress}%</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white/40 to-white/80 transition-all duration-1000"
                  style={{ width: `${phase.overallProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[7px] text-white/40">
                <span>{l === 'hi' ? 'शुरू' : 'Start'}</span>
                <span className="font-bold text-white/70">{phase.current?.name || 'N/A'}</span>
                <span>{l === 'hi' ? 'परीक्षा' : 'Exam'}</span>
              </div>
            </div>

            {/* Readiness + Pace Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Readiness */}
              <div className="bg-white/10 rounded-xl p-3 border border-white/5 text-center">
                <ProgressRing
                  percentage={readiness.overall}
                  size={56}
                  strokeWidth={4}
                  color={readiness.overall >= 70 ? '#22c55e' : readiness.overall >= 50 ? '#f59e0b' : '#ef4444'}
                  bgColor="rgba(255,255,255,0.1)"
                >
                  <span className="text-[10px] font-black">{readiness.overall}%</span>
                </ProgressRing>
                <p className="text-[9px] text-white/50 mt-1">{l === 'hi' ? 'तैयारी' : 'Readiness'}</p>
              </div>

              {/* Pace */}
              <div className="bg-white/10 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Footprints className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-[10px] font-bold">{l === 'hi' ? 'रफ्तार' : 'Pace'}</span>
                </div>
                <p className="text-xl font-black">
                  {pace.current}
                  <span className="text-[9px] text-white/50">/day</span>
                </p>
                <p className={`text-[9px] ${
                  pace.status === 'on_track' ? 'text-emerald-300' 
                  : pace.status === 'slightly_behind' ? 'text-amber-300' 
                  : 'text-red-300'
                }`}>
                  {l === 'hi' ? `चाहिए: ${pace.required}/दिन` : `Need: ${pace.required}/day`}
                </p>
                <p className="text-[7px] text-white/40">
                  {pace.remaining} {l === 'hi' ? 'बाकी' : 'remaining'}
                </p>
              </div>
            </div>

            {/* Risk Alerts */}
            {riskAlerts.length > 0 && (
              <div className="space-y-1.5">
                {riskAlerts.slice(0, 3).map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] ${
                      alert.level === 'critical'
                        ? 'bg-red-500/20 border border-red-400/30'
                        : alert.level === 'warning'
                        ? 'bg-amber-500/20 border border-amber-400/30'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${
                      alert.level === 'critical' ? 'text-red-300 animate-pulse' : 'text-amber-300'
                    }`} />
                    <span>{l === 'hi' ? alert.textHi : alert.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Phases View */}
        {activeView === 'phases' && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white/60 uppercase mb-3">
              {l === 'hi' ? 'तैयारी चरण' : 'Preparation Phases'}
            </p>
            
            {phase.all.map((p, index) => {
              const PhaseIcon = phaseIcons[p.name] || BookOpen;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    p.status === 'current'
                      ? 'bg-white/15 border-white/20 ring-1 ring-white/10'
                      : p.status === 'completed'
                      ? 'bg-white/5 border-white/5'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.status === 'completed' ? 'bg-emerald-500/30' 
                    : p.status === 'current' ? 'bg-white/20' 
                    : 'bg-white/5'
                  }`}>
                    {p.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <PhaseIcon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold">{l === 'hi' ? p.nameHi : p.name}</p>
                    <p className="text-[8px] text-white/40">{l === 'hi' ? p.descHi : p.description}</p>
                    {p.status === 'current' && (
                      <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-white/60 rounded-full transition-all"
                          style={{ width: `${Math.max(p.progress, 5)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <span className={`text-[9px] font-bold ${
                    p.status === 'completed' ? 'text-emerald-300' 
                    : p.status === 'current' ? 'text-white' 
                    : 'text-white/30'
                  }`}>
                    {p.status === 'completed' ? '✓' : p.status === 'current' ? `${p.progress}%` : '—'}
                  </span>
                </div>
              );
            })}

            {/* Readiness Factors */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-[9px] font-bold text-white/50 uppercase mb-2">
                {l === 'hi' ? 'तैयारी कारक' : 'Readiness Factors'}
              </p>
              {readiness.factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] text-white/50 w-20 truncate">
                    {l === 'hi' ? factor.nameHi : factor.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${factor.score}%`,
                        backgroundColor: factor.score >= 70 ? '#22c55e' : factor.score >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-bold w-8 text-right">{factor.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission View */}
        {activeView === 'mission' && (
          <div>
            <p className="text-[10px] font-bold text-white/60 uppercase mb-3">
              {l === 'hi' ? 'आज का मिशन' : "Today's Mission"}
            </p>
            
            {todayMission.length > 0 ? (
              <div className="space-y-2">
                {todayMission.map((mission, index) => {
                  const MissionIcon = {
                    ClipboardList,
                    RefreshCw,
                    AlertTriangle,
                    Target,
                  }[mission.icon] || Target;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        mission.priority === 'critical'
                          ? 'bg-red-500/15 border-red-400/20'
                          : mission.priority === 'high'
                          ? 'bg-amber-500/10 border-amber-400/20'
                          : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <MissionIcon className={`w-5 h-5 flex-shrink-0 ${
                        mission.priority === 'critical' ? 'text-red-300' : 'text-white/60'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold">{l === 'hi' ? mission.taskHi : mission.task}</p>
                        <p className="text-[9px] text-white/40">{mission.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <PartyPopper className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                <p className="text-sm font-bold">{l === 'hi' ? 'सब पूरा!' : 'All done!'}</p>
                <p className="text-[10px] text-white/50">{l === 'hi' ? 'शानदार!' : 'Fantastic work!'}</p>
              </div>
            )}

            {/* Milestones */}
            {milestones && milestones.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[9px] font-bold text-white/50 uppercase mb-2">
                  {l === 'hi' ? 'माइलस्टोन' : 'Milestones'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {milestones.slice(0, 6).map((milestone, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        milestone.completed
                          ? 'bg-emerald-500/10 border border-emerald-400/20'
                          : 'bg-white/5 border border-white/5'
                      }`}
                    >
                      {milestone.completed ? (
                        <CircleCheck className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                      ) : (
                        <CircleDot className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-[9px] font-bold truncate ${
                          milestone.completed ? 'text-emerald-300 line-through' : ''
                        }`}>
                          {l === 'hi' ? milestone.titleHi : milestone.title}
                        </p>
                        {!milestone.completed && (
                          <p className="text-[7px] text-white/30">{milestone.progress}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════════
//  DASHBOARD.JSX - PART 2 (Continue from Part 1)
//  Paste directly after Part 1 in the SAME file
// ═══════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
//  JRF PROBABILITY METER (Enhanced)
// ════════════════════════════════════════════════════════════
const JRFProbabilityMeter = ({ data, language: l }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!data || (data.confidence === 'low' && data.dataPoints < 3)) {
    return (
      <div className="bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
            <Brain className="w-8 h-8 text-indigo-400 opacity-50" />
          </div>
          <h3 className="font-bold text-lg mb-2">
            {l === 'hi' ? 'JRF संभावना मीटर' : 'JRF Probability Meter'}
          </h3>
          <p className="text-sm text-indigo-300/60 mb-4 max-w-xs mx-auto">
            {l === 'hi' 
              ? 'कम से कम 3 टेस्ट दें ताकि AI आपकी संभावना का अनुमान लगा सके' 
              : 'Take at least 3 tests to unlock AI-powered probability prediction'}
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold text-indigo-300">
                {data?.dataPoints || 0}/3 {l === 'hi' ? 'टेस्ट' : 'tests'}
              </span>
            </div>
          </div>
          
          {/* Progress to unlock */}
          <div className="mt-4 max-w-[200px] mx-auto">
            <div className="h-2 bg-indigo-900/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((data?.dataPoints || 0) / 3) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const riskColors = {
    safe: { text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30', glow: 'shadow-emerald-500/20' },
    moderate: { text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30', glow: 'shadow-blue-500/20' },
    risky: { text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30', glow: 'shadow-amber-500/20' },
    critical: { text: 'text-red-400', badge: 'bg-red-500/20 border-red-500/30', glow: 'shadow-red-500/20' },
  };

  const riskLabels = {
    safe: { en: 'Safe Zone', hi: 'सुरक्षित' },
    moderate: { en: 'Moderate', hi: 'मध्यम' },
    risky: { en: 'Risky', hi: 'जोखिम' },
    critical: { en: 'Critical', hi: 'गंभीर' },
  };

  const rc = riskColors[data.riskLevel] || riskColors.moderate;

  return (
    <div className="bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 rounded-2xl text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      
      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                {l === 'hi' ? 'JRF संभावना' : 'JRF Probability'}
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              </h3>
              <p className="text-[9px] text-indigo-300/50">
                {l === 'hi' ? 'AI भविष्यवाणी' : 'AI Prediction Engine'}
              </p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-xl border ${rc.badge} flex items-center gap-1.5`}>
            <div className={`w-2 h-2 rounded-full ${rc.text.replace('text-', 'bg-')} animate-pulse`} />
            <span className={`text-[10px] font-bold ${rc.text}`}>
              {riskLabels[data.riskLevel]?.[l] || data.riskLevel}
            </span>
          </div>
        </div>

        {/* Main Probability Rings */}
        <div className="grid grid-cols-2 gap-6 mb-5">
          {[
            { label: 'NET', value: data.netProbability, cutoff: data.netCutoff, emoji: '📚' },
            { label: 'JRF', value: data.jrfProbability, cutoff: data.jrfCutoff, emoji: '🏆' },
          ].map((meter, index) => (
            <div key={index} className="text-center">
              <ProgressRing
                percentage={meter.value}
                size={100}
                strokeWidth={8}
                color={meter.value >= 60 ? '#22c55e' : meter.value >= 40 ? '#f59e0b' : '#ef4444'}
                bgColor="rgba(255,255,255,0.08)"
              >
                <div className="text-center">
                  <span className="text-xl font-black">{meter.value}%</span>
                  <span className="block text-[8px] text-indigo-300/50">{meter.label}</span>
                </div>
              </ProgressRing>
              <div className="mt-2">
                <span className="text-lg">{meter.emoji}</span>
                <p className="text-[9px] text-indigo-400/50 mt-0.5">
                  {l === 'hi' ? 'कटऑफ' : 'Cutoff'}: {meter.cutoff}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Predicted Scores */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'P1', value: `${data.predictedP1}%`, trend: data.p1Trend },
            { label: 'P2', value: `${data.predictedP2}%`, trend: data.p2Trend },
            { label: l === 'hi' ? 'कुल' : 'Total', value: `${data.predictedTotal}%` },
          ].map((stat, index) => (
            <div key={index} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <p className="text-lg font-black">{stat.value}</p>
              <p className="text-[8px] text-indigo-300/40">{stat.label}</p>
              {stat.trend && <TrendBadge direction={stat.trend} size="xs" showLabel={false} />}
            </div>
          ))}
        </div>

        {/* Consistency Bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] text-indigo-300/50 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {l === 'hi' ? 'स्थिरता स्कोर' : 'Consistency Score'}
            </span>
            <span className="text-[11px] font-bold">{data.consistencyScore}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${data.consistencyScore}%`,
                background: data.consistencyScore >= 60 
                  ? 'linear-gradient(90deg, #22c55e, #10b981)' 
                  : data.consistencyScore >= 40 
                    ? 'linear-gradient(90deg, #f59e0b, #eab308)' 
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
              }}
            />
          </div>
        </div>

        {/* Factors */}
        {data.factors.length > 0 && (
          <div className="mb-4">
            <div className="space-y-1.5">
              {data.factors.slice(0, showDetails ? undefined : 4).map((factor, index) => (
                <div key={index} className="flex items-center gap-2 text-[10px]">
                  {factor.type === 'positive' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  )}
                  <span className={factor.type === 'positive' ? 'text-emerald-300/80' : 'text-red-300/80'}>
                    {factor.text}
                  </span>
                </div>
              ))}
            </div>
            
            {data.factors.length > 4 && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-2 text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {showDetails ? 'Show less' : `+${data.factors.length - 4} more`}
                <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Suggestions */}
        {data.suggestions.length > 0 && (
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-indigo-300/40 flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              {l === 'hi' ? 'सुधार के लिए' : 'To Improve'}
            </p>
            <div className="space-y-1.5">
              {data.suggestions.slice(0, 3).map((suggestion, index) => (
                <p key={index} className="text-[10px] text-indigo-200/60 flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 mt-0.5 text-indigo-400 flex-shrink-0" />
                  {suggestion}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] text-indigo-400/30">
          <span>
            {l === 'hi' ? 'विश्वसनीयता' : 'Confidence'}: {data.confidence} ({data.dataPoints} pts)
          </span>
          <span>
            {l === 'hi' ? 'तैयारी' : 'Readiness'}: {data.readinessScore}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  GOAL TRACKER (Enhanced)
// ════════════════════════════════════════════════════════════
const GoalTracker = ({
  goals,
  completionPct,
  todayDetailed,
  yesterdayActivity,
  customTargets,
  updateCustomTargets,
  dayProgress,
  goalStreak,
  goalsCompleted,
  totalGoals,
  pressureMessage,
  todayXP,
  streak,
  language: l,
  navigate,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [localTargets, setLocalTargets] = useState(customTargets);
  
  const celebrating = completionPct === 100 && (todayDetailed?.count || 0) > 0;

  const iconMap = {
    ClipboardList, Target, TrendingUp, Clock, RefreshCw, 
    Flame, Timer, BarChart2, Hash, Zap, Play, CheckCircle,
  };

  const colorClasses = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', bar: 'bg-cyan-500' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
  };

  const urgencyDot = {
    critical: 'bg-red-500 animate-pulse',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    normal: 'bg-gray-300 dark:bg-gray-600',
  };

  const pressureStyles = {
    celebration: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400', Icon: PartyPopper, border: 'border-l-emerald-500' },
    critical: { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-400', Icon: AlertTriangle, border: 'border-l-red-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-700 dark:text-amber-400', Icon: AlertCircle, border: 'border-l-amber-500' },
    positive: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-400', Icon: Sparkles, border: 'border-l-blue-500' },
    info: { bg: 'bg-gray-50 dark:bg-gray-700/30', text: 'text-gray-600 dark:text-gray-400', Icon: Info, border: 'border-l-gray-400' },
  };

  const dp = dayProgress || { pct: 0, remainingHours: 0, remainingMins: 0 };
  const pm = pressureMessage || { type: 'info', en: '', hi: '' };
  const pmStyle = pressureStyles[pm.type] || pressureStyles.info;
  const PressureIcon = pmStyle.Icon;

  const handleSaveSettings = () => {
    updateCustomTargets(localTargets);
    setShowSettings(false);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all ${
      celebrating ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20' : ''
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ${
              celebrating ? 'animate-bounce' : ''
            }`}>
              <Crosshair className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                {l === 'hi' ? 'आज के लक्ष्य' : "Today's Goals"}
                {celebrating && <PartyPopper className="w-4 h-4 text-yellow-500" />}
              </h3>
              <p className="text-[9px] text-gray-500">
                {goalsCompleted}/{totalGoals} {l === 'hi' ? 'पूरे' : 'completed'}
                {goalStreak > 0 && (
                  <span className="ml-1.5 text-amber-600 font-bold">
                    🔥 {goalStreak}d streak
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* XP Badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <Zap className="w-3 h-3 text-amber-600" />
              <span className="text-[9px] font-black text-amber-700 dark:text-amber-400">
                {todayXP} XP
              </span>
            </div>
            
            {/* Completion Ring */}
            <ProgressRing
              percentage={completionPct}
              size={38}
              strokeWidth={3}
              color={completionPct === 100 ? '#22c55e' : completionPct >= 50 ? '#f59e0b' : '#ef4444'}
            >
              <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300">
                {completionPct}%
              </span>
            </ProgressRing>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className={`w-4 h-4 text-gray-400 transition-transform ${showSettings ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Day Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {l === 'hi' ? 'दिन की प्रगति' : 'Day Progress'}
            </span>
            <span className={`text-[9px] font-bold ${
              dp.pct > 80 ? 'text-red-600 animate-pulse' : dp.pct > 50 ? 'text-amber-600' : 'text-gray-500'
            }`}>
              {dp.remainingHours}h {dp.remainingMins}m {l === 'hi' ? 'बाकी' : 'left'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${dp.pct}%`,
                background: dp.pct > 80 ? '#ef4444' : dp.pct > 50 ? '#f59e0b' : '#3b82f6',
              }}
            />
          </div>
        </div>

        {/* Today's Stats */}
        <div className="flex items-center gap-2 flex-wrap text-[9px]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
            <ClipboardList className="w-3 h-3" />
            {todayDetailed?.count || 0} {l === 'hi' ? 'टेस्ट' : 'tests'}
          </span>
          {(todayDetailed?.count || 0) > 0 && (
            <>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                <Target className="w-3 h-3" />
                {todayDetailed?.accuracy || 0}%
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold">
                <BarChart3 className="w-3 h-3" />
                {todayDetailed?.avgScore || 0}%
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold">
                <Clock className="w-3 h-3" />
                {formatTime(todayDetailed?.timeSpent || 0)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Pressure Message */}
      <div className={`px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 ${pmStyle.bg} border-l-4 ${pmStyle.border}`}>
        <div className="flex items-center gap-2">
          <PressureIcon className={`w-4 h-4 ${pmStyle.text} ${pm.type === 'critical' ? 'animate-pulse' : ''}`} />
          <p className={`text-[11px] font-semibold ${pmStyle.text}`}>
            {l === 'hi' ? pm.hi : pm.en}
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-3">
            {l === 'hi' ? 'लक्ष्य सेटिंग्स' : 'Goal Settings'}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { key: 'dailyTests', label: l === 'hi' ? 'दैनिक टेस्ट' : 'Tests/Day', min: 1, max: 20 },
              { key: 'dailyAccuracy', label: l === 'hi' ? 'सटीकता %' : 'Accuracy %', min: 30, max: 100 },
              { key: 'targetScore', label: l === 'hi' ? 'लक्ष्य %' : 'Target %', min: 40, max: 100 },
            ].map(setting => (
              <div key={setting.key}>
                <label className="text-[9px] text-gray-500 mb-1 block">{setting.label}</label>
                <input
                  type="number"
                  value={localTargets[setting.key]}
                  min={setting.min}
                  max={setting.max}
                  onChange={(e) => setLocalTargets({
                    ...localTargets,
                    [setting.key]: parseInt(e.target.value) || setting.min,
                  })}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1"
            >
              <Save className="w-3 h-3" />
              {l === 'hi' ? 'सेव' : 'Save'}
            </button>
            <button
              onClick={() => {
                setLocalTargets(customTargets);
                setShowSettings(false);
              }}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-[10px] font-bold rounded-lg hover:bg-gray-300"
            >
              {l === 'hi' ? 'रद्द' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
        {goals.map((goal, index) => {
          const Icon = iconMap[goal.icon] || Target;
          const colors = colorClasses[goal.color] || colorClasses.blue;
          const pct = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
          const isComplete = goal.current >= goal.target;

          return (
            <div
              key={goal.id || index}
              className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all ${
                isComplete
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30'
                  : goal.urgency === 'critical'
                  ? 'bg-red-50/30 border-red-200 dark:bg-red-900/5 dark:border-red-900/30'
                  : 'bg-gray-50/50 border-gray-100 dark:bg-gray-700/20 dark:border-gray-700/50'
              }`}
            >
              {/* Urgency Dot */}
              {!isComplete && goal.urgency !== 'normal' && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${urgencyDot[goal.urgency]}`} />
              )}

              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isComplete ? 'bg-emerald-100 dark:bg-emerald-900/30' : colors.bg
              }`}>
                {isComplete ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-[11px] font-semibold truncate pr-4 ${
                    isComplete 
                      ? 'text-emerald-700 dark:text-emerald-400 line-through' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {l === 'hi' ? goal.titleHi : goal.title}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-black ${isComplete ? 'text-emerald-600' : colors.text}`}>
                      {goal.current}{goal.type === 'percentage' ? '%' : ''}/{goal.target}{goal.type === 'percentage' ? '%' : ''}
                    </span>
                    {isComplete && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        +{goal.xp}XP
                      </span>
                    )}
                  </div>
                </div>
                
                <p className={`text-[9px] mb-1.5 ${isComplete ? 'text-emerald-600/60' : 'text-gray-500'}`}>
                  {l === 'hi' ? goal.descriptionHi : goal.description}
                </p>
                
                {/* Progress Bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : colors.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
        <span className="text-[9px] text-gray-400">
          {l === 'hi' ? 'गोल स्ट्रीक' : 'Goal Streak'}: 
          <span className="font-bold text-amber-600 ml-1">{goalStreak}d</span>
          <span className="mx-1.5">|</span>
          {l === 'hi' ? 'आज' : 'Today'}: 
          <span className="font-bold text-indigo-600 ml-1">{todayXP} XP</span>
        </span>
        
        {(todayDetailed?.count || 0) === 0 && (
          <button
            onClick={() => navigate?.('/tests')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold rounded-lg hover:shadow-lg transition-all"
          >
            <Play className="w-3 h-3" />
            {l === 'hi' ? 'शुरू करें!' : 'Start Now!'}
          </button>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  SMART REVISION HUB (Enhanced)
// ════════════════════════════════════════════════════════════
const SmartRevisionHub = ({ data, language: l, navigate }) => {
  const [activeTab, setActiveTab] = useState('due');

  if (!data || data.stats.totalTests === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center">
        <RotateCcw className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
          {l === 'hi' ? 'स्मार्ट रिवीज़न' : 'Smart Revision Hub'}
        </h3>
        <p className="text-sm text-gray-500">
          {l === 'hi' ? 'टेस्ट दें और SRS सिस्टम अनलॉक करें' : 'Take tests to unlock the SRS system'}
        </p>
      </div>
    );
  }

  const categoryStyles = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertTriangle,
      badge: 'bg-red-500',
    },
    weak: {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      icon: TrendingDown,
      badge: 'bg-orange-500',
    },
    improving: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: TrendingUp,
      badge: 'bg-blue-500',
    },
    learning: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      icon: BookOpen,
      badge: 'bg-amber-500',
    },
    mastered: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: CheckCircle,
      badge: 'bg-emerald-500',
    },
  };

  const tabs = [
    { id: 'due', label: l === 'hi' ? 'आज बाकी' : 'Due Today', count: data.todayDue.length, color: 'red' },
    { id: 'critical', label: l === 'hi' ? 'गंभीर' : 'Critical', count: data.critical.length, color: 'red' },
    { id: 'weak', label: l === 'hi' ? 'कमजोर' : 'Weak', count: data.weak.length, color: 'orange' },
    { id: 'good', label: l === 'hi' ? 'अच्छा' : 'Good', count: data.improving.length + data.mastered.length, color: 'green' },
  ];

  const getTabData = () => {
    switch (activeTab) {
      case 'due': return data.todayDue;
      case 'critical': return data.critical;
      case 'weak': return data.weak;
      case 'good': return [...data.improving, ...data.mastered];
      default: return data.all;
    }
  };

  const tabData = getTabData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
              <RotateCcw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {l === 'hi' ? 'स्मार्ट रिवीज़न' : 'Smart Revision Hub'}
              </h3>
              <p className="text-[9px] text-gray-500">
                {l === 'hi' ? 'स्पेस्ड रिपिटिशन सिस्टम' : 'Spaced Repetition System'}
              </p>
            </div>
          </div>
          
          {data.marathonQueue.length > 0 && (
            <button
              onClick={() => navigate?.(`/test/${data.marathonQueue[0].testId}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-bold rounded-lg hover:shadow-lg transition-all"
            >
              <Rocket className="w-3.5 h-3.5" />
              {l === 'hi' ? 'मैराथन' : 'Marathon'}
            </button>
          )}
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-2 flex-wrap text-[9px]">
          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">
            {data.stats.critical} {l === 'hi' ? 'गंभीर' : 'critical'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold">
            {data.stats.weak} {l === 'hi' ? 'कमजोर' : 'weak'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">
            {data.stats.overdue} {l === 'hi' ? 'देरी' : 'overdue'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">
            {data.stats.mastered} ✓
          </span>
          {data.stats.avgImprovement > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold">
              +{data.stats.avgImprovement}% {l === 'hi' ? 'औसत सुधार' : 'avg improvement'}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-2.5 text-[10px] font-bold transition-all ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[8px] ${
              activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
        {tabData.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-200 dark:text-emerald-800" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {l === 'hi' ? 'कोई नहीं!' : 'None!'}
            </p>
            <p className="text-[10px] text-gray-400">
              {l === 'hi' ? 'इस श्रेणी में कोई टेस्ट नहीं' : 'No tests in this category'}
            </p>
          </div>
        ) : (
          tabData.slice(0, 15).map((item, index) => {
            const style = categoryStyles[item.category] || categoryStyles.learning;
            const CategoryIcon = style.icon;
            const TrendIcon = item.trend === 'improving' ? TrendingUp : item.trend === 'declining' ? TrendingDown : Minus;

            return (
              <div
                key={index}
                className={`group flex items-center gap-3 p-3 rounded-xl border ${style.border} ${style.bg} hover:shadow-lg cursor-pointer transition-all`}
                onClick={() => navigate?.(`/results/${item.lastAttempt?._id}`)}
              >
                {/* Priority Indicator */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    item.isOverdue ? 'bg-red-500 animate-pulse' : style.badge
                  }`} />
                  <span className="text-[8px] text-gray-400 font-bold">{item.bestScore}%</span>
                </div>

                {/* Score Ring */}
                <ProgressRing
                  percentage={item.bestScore}
                  size={38}
                  strokeWidth={3}
                  color={item.bestScore >= 70 ? '#22c55e' : item.bestScore >= 50 ? '#f59e0b' : '#ef4444'}
                >
                  <span className="text-[8px] font-black">{item.bestScore}</span>
                </ProgressRing>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    {item.paper && (
                      <span className={`px-1 rounded text-[7px] font-bold ${
                        item.paper === 'paper1'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                          : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'
                      }`}>
                        {item.paper === 'paper1' ? 'P1' : 'P2'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[9px] text-gray-500">
                    <span>{item.daysSinceLastAttempt}d ago</span>
                    <span>•</span>
                    <span>{item.totalAttempts} att</span>
                    <span>•</span>
                    <span className={`font-bold ${style.text}`}>{item.srsLabel}</span>
                    {item.isOverdue && (
                      <>
                        <span>•</span>
                        <span className="text-red-500 font-bold animate-pulse">
                          {item.overdueBy}d overdue!
                        </span>
                      </>
                    )}
                    {item.improvement !== 0 && (
                      <>
                        <span>•</span>
                        <span className={`flex items-center gap-0.5 font-bold ${
                          item.improvement > 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          <TrendIcon className="w-3 h-3" />
                          {item.improvement > 0 ? '+' : ''}{item.improvement}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Score History Mini Chart */}
                  {item.attempts && item.attempts.length > 1 && (
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {item.attempts.slice(-6).map((attempt, i) => (
                        <div
                          key={i}
                          className="h-1 rounded-full transition-all"
                          style={{
                            width: `${Math.max(attempt.score / 5, 4)}px`,
                            backgroundColor: attempt.score >= 70 ? '#22c55e' : attempt.score >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                          title={`${attempt.score}%`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Retry Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate?.(`/test/${item.testId}`);
                  }}
                  className="p-2 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-200 transition-all flex-shrink-0 group-hover:scale-110"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* SRS Schedule Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-[9px] text-gray-500">
          <span>
            {l === 'hi' ? 'आज' : 'Today'}: <span className="font-bold text-red-600">{data.stats.dueToday}</span>
            <span className="mx-1.5">|</span>
            {l === 'hi' ? 'इस हफ्ते' : 'This Week'}: <span className="font-bold text-amber-600">{data.stats.dueThisWeek}</span>
          </span>
          <span>
            {l === 'hi' ? 'कुल रिवीज़न' : 'Total Revisions'}: {data.stats.totalRevisions}
          </span>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  DAILY REPORT CARD (Enhanced)
// ════════════════════════════════════════════════════════════
const DailyReportCard = ({ data, language: l }) => {
  if (!data) return null;

  const gradeGradients = {
    emerald: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
  };

  const gradeEmojis = {
    'A+': '🏆', 'A': '⭐', 'B+': '👍', 'B': '👌', 'C': '📚', 'F': '💪',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header with Grade */}
      <div className={`bg-gradient-to-r ${gradeGradients[data.gradeColor] || gradeGradients.blue} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/60 uppercase font-bold">
              {l === 'hi' ? 'आज का रिपोर्ट कार्ड' : "Today's Report Card"}
            </p>
            <p className="text-[9px] text-white/40">
              {new Date().toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{gradeEmojis[data.grade] || '📊'}</span>
              <span className="text-4xl font-black">{data.grade}</span>
            </div>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i <= data.rating
                      ? 'text-yellow-300 fill-yellow-300'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: l === 'hi' ? 'टेस्ट' : 'Tests', value: data.stats.tests, icon: ClipboardList, color: 'text-blue-500' },
            { label: l === 'hi' ? 'सटीकता' : 'Accuracy', value: `${data.stats.accuracy}%`, icon: Target, color: 'text-emerald-500' },
            { label: l === 'hi' ? 'औसत' : 'Average', value: `${data.stats.avgScore}%`, icon: BarChart3, color: 'text-purple-500' },
            { label: l === 'hi' ? 'समय' : 'Time', value: formatTime(data.stats.time), icon: Clock, color: 'text-amber-500' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-2 rounded-xl bg-gray-50 dark:bg-gray-700/30">
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <p className="text-sm font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-[7px] text-gray-400 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CQS Breakdown */}
        <div className="flex items-center gap-2 mb-4 text-[10px]">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold">
            <CheckCircle className="w-3 h-3" />
            {data.stats.correct} {l === 'hi' ? 'सही' : 'correct'}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">
            <XCircle className="w-3 h-3" />
            {data.stats.wrong} {l === 'hi' ? 'गलत' : 'wrong'}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 font-bold">
            <SkipForward className="w-3 h-3" />
            {data.stats.skipped} {l === 'hi' ? 'छोड़े' : 'skipped'}
          </span>
          
          {data.comparison.direction !== 'stable' && (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full font-bold ${
              data.comparison.direction === 'up'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30'
            }`}>
              {data.comparison.direction === 'up' ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              vs {l === 'hi' ? 'कल' : 'yesterday'}
            </span>
          )}
        </div>

        {/* Highlights */}
        {data.highlights.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {data.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2 text-[10px]">
                {highlight.type === 'achievement' ? (
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                ) : highlight.type === 'improvement' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  {l === 'hi' ? highlight.textHi : highlight.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tomorrow's Focus */}
        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-200/50 dark:border-indigo-800/30">
          <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
            <Crosshair className="w-3.5 h-3.5" />
            {l === 'hi' ? 'कल का फोकस' : "Tomorrow's Focus"}
          </p>
          <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
            {data.tomorrowFocus.unit}
          </p>
          <p className="text-[9px] text-indigo-500">
            {l === 'hi' ? data.tomorrowFocus.reasonHi : data.tomorrowFocus.reason}
          </p>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  STREAK CARD (Enhanced)
// ════════════════════════════════════════════════════════════
const StreakCard = ({ streak, longestStreak, language: l }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  
  const isOnFire = streak >= 7;

  return (
    <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white relative overflow-hidden ${
      isOnFire ? 'animate-pulse-slow' : ''
    }`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-300/20 rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 text-yellow-300 ${isOnFire ? 'animate-bounce' : ''}`} />
            <span className="font-bold text-sm">{l === 'hi' ? 'स्ट्रीक' : 'Streak'}</span>
            {isOnFire && <span className="text-xs">🔥</span>}
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{streak}d</span>
            {longestStreak > 0 && longestStreak > streak && (
              <p className="text-[9px] text-white/50">
                {l === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'}: {longestStreak}d
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-1">
          {days.map((day, index) => {
            const isPast = index < today || (index === today && streak > 0);
            const isToday = index === today;
            
            return (
              <div
                key={index}
                className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                  isPast && streak > 0
                    ? 'bg-white text-orange-600 shadow-sm'
                    : isToday
                    ? 'bg-white/30 text-white border-2 border-white/50'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                {day}
                {isPast && streak > 0 && <span className="ml-0.5">✓</span>}
              </div>
            );
          })}
        </div>

        {streak === 0 && (
          <p className="text-[10px] text-white/70 text-center mt-2">
            {l === 'hi' ? 'आज टेस्ट दें और स्ट्रीक शुरू करें!' : 'Take a test today to start your streak!'}
          </p>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  QUICK ACTION CARD
// ════════════════════════════════════════════════════════════
const QuickActionCard = ({ icon: Icon, title, description, to, gradient, badge, delay = 0 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Link
      to={to}
      className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {badge && (
            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full">
              {badge}
            </span>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white text-sm transition-colors">
          {title}
        </h3>
        <p className="text-[10px] text-gray-500 group-hover:text-white/70 mt-0.5 transition-colors">
          {description}
        </p>
      </div>
    </Link>
  );
};

// ════════════════════════════════════════════════════════════
//  🆕 ADDITIONAL COMPONENTS (All Required)
// ════════════════════════════════════════════════════════════

const WeeklyChapterMatrix = ({ data, language: l }) => {
  if (!data?.currentWeek) return null;
  const cw = data.currentWeek;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'साप्ताहिक परिणाम' : 'Week Matrix'}</h3>
        <span className="text-[9px] text-gray-400">{cw.dateRange}</span>
      </div>
      <div className="space-y-1.5">
        {cw.chapters.slice(0, 8).map((ch, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <div className="w-20 truncate text-gray-600 dark:text-gray-400 font-semibold">{ch.name}</div>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${ch.avgScore}%`, backgroundColor: ch.avgScore >= 70 ? '#22c55e' : ch.avgScore >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
            <div className="w-8 text-right font-bold">{ch.avgScore}%</div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-[9px] text-gray-500">
        {data.insights.slice(0, 2).map((ins, i) => (
          <p key={i} className="text-[8px]">{ins.type === 'warning' ? '⚠️' : '✓'} {l === 'hi' ? ins.textHi : ins.text}</p>
        ))}
      </div>
    </div>
  );
};

const SyllabusCoverageMap = ({ data, language: l }) => {
  if (!data) return null;
  const p1 = data.paper1Summary, p2 = data.paper2Summary;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'पाठ्यक्रम कवरेज' : 'Syllabus'}</h3>
      </div>
      <div className="space-y-3">
        {[{ title: 'Paper 1', summary: p1, icon: BookOpen }, { title: 'Paper 2', summary: p2, icon: Target }].map((p, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{p.title}</span>
              <span className="text-[10px] font-bold text-gray-900 dark:text-white">{p.summary.overallPct}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${p.summary.overallPct}%` }} />
            </div>
            <div className="flex justify-between text-[8px] text-gray-500 mt-1">
              <span>{p.summary.mastered}/{p.summary.total}  mastered</span>
              <span>{p.summary.inProgress} in progress</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpeedAnalyticsCard = ({ data, language: l }) => {
  if (!data) return null;
  const chartData = data.speedTrend || [];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गति विश्लेषण' : 'Speed'}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2">
          <p className="text-[8px] text-gray-500">{l === 'hi' ? 'औसत समय' : 'Avg Time'}</p>
          <p className="text-lg font-bold text-blue-600">{data.avgTimePerQ}s</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2">
          <p className="text-[8px] text-gray-500">{l === 'hi' ? 'प्रति प्रश्न' : 'Per Q'}</p>
          <p className="text-lg font-bold text-emerald-600">{Math.round(60 / (data.avgTimePerQ || 1))} Q/m</p>
        </div>
      </div>
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <Line type="monotone" dataKey="speed" stroke="#f59e0b" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="accuracy" stroke="#22c55e" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const StudyRecommendations = ({ data, language: l, navigate }) => {
  const data_items = data || [];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'सुझाव' : 'Tips'}</h3>
      </div>
      <div className="space-y-2">
        {data_items.slice(0, 6).map((rec, i) => (
          <button key={i} onClick={() => navigate?.('/results')} className="w-full text-left p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
            <div className="flex items-center gap-2">
              {rec.priority === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              {rec.priority === 'high' && <AlertCircle className="w-3.5 h-3.5 text-orange-500" />}
              {rec.priority === 'medium' && <Info className="w-3.5 h-3.5 text-blue-500" />}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-900 dark:text-white line-clamp-1">{l === 'hi' ? rec.titleHi : rec.title}</p>
                <p className="text-[8px] text-gray-500">{rec.detail}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const ScoreDistributionCard = ({ data, language: l }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'स्कोर वितरण' : 'Scores'}</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="range" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const PersonalRecords = ({ data, language: l }) => {
  if (!data?.highestScore) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Medal className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'रिकॉर्ड' : 'Records'}</h3>
      </div>
      {[
        { label: l === 'hi' ? 'उच्चतम' : 'Highest', value: `${data.highestScore.pct}%`, icon: Trophy },
        { label: l === 'hi' ? 'सटीकता' : 'Best Acc', value: `${data.bestAccuracy.accuracy}%`, icon: Target },
        { label: l === 'hi' ? 'स्ट्रीक' : 'Streak', value: `${data.currentStreak}d`, icon: Flame },
        { label: l === 'hi' ? 'कुल टेस्ट' : 'Total', value: `${data.totalTestsTaken}`, icon: Award },
      ].map((rec, i) => {
        const RecIcon = rec.icon;
        return (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <RecIcon className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{rec.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{rec.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const TimeOfDayCard = ({ data, language: l }) => {
  if (!data?.periodData) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'समय विश्लेषण' : 'Best Time'}</h3>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={data.periodData}><PolarGrid /><PolarAngleAxis dataKey="name" tick={{ fontSize: 8 }} /><PolarRadiusAxis /><Radar name="Avg Score" dataKey="avgScore" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} /></RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ActivityHeatmap = ({ data, language: l }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Grid3X3 className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'गतिविधि' : 'Activity'}</h3>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {data.slice(-35).map((day, i) => (
          <div key={i} className={`w-4 h-4 rounded-sm transition-all cursor-pointer ${
            day.value === 0 ? 'bg-gray-100 dark:bg-gray-700' :
            day.value === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30' :
            day.value === 2 ? 'bg-emerald-300 dark:bg-emerald-700/50' :
            day.value === 3 ? 'bg-emerald-500' :
            day.value === 4 ? 'bg-emerald-600' :
            'bg-emerald-800'
          }`} title={day.label} />
        ))}
      </div>
    </div>
  );
};

const WeeklyComparison = ({ data, language: l }) => {
  if (!data?.thisWeek) return null;
  const tw = data.thisWeek, lw = data.lastWeek;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpDown className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'साप्ताहिक तुलना' : 'This vs Last'}</h3>
      </div>
      <div className="space-y-2">
        {[{ label: 'Tests', thisWeek: tw.tests, lastWeek: lw.tests }, { label: 'Avg Score', thisWeek: tw.avgScore, lastWeek: lw.avgScore }, { label: 'Accuracy', thisWeek: tw.avgAccuracy, lastWeek: lw.avgAccuracy }].map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{item.thisWeek}</span>
              <span className={`text-[10px] font-bold ${item.thisWeek > item.lastWeek ? 'text-emerald-500' : item.thisWeek < item.lastWeek ? 'text-red-500' : 'text-gray-500'}`}>
                {item.thisWeek > item.lastWeek ? '+' : item.thisWeek < item.lastWeek ? '-' : ''}{Math.abs(item.thisWeek - item.lastWeek)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaperTrendCard = ({ paper1Trend, paper2Trend, language: l }) => {
  const buildChartData = (trend) => trend.slice(-15).map((t, i) => ({ name: t.dateFormatted || `T${i}`, score: t.score, accuracy: t.accuracy }));
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendUp className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'प्रवृत्ति' : 'Trends'}</h3>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={buildChartData(paper1Trend.length >= paper2Trend.length ? paper1Trend : paper2Trend)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 8 }} />
          <YAxis tick={{ fontSize: 8 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="P1" />
          <Line type="monotone" dataKey="accuracy" stroke="#22c55e" name="Acc" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const ErrorAnalysisCard = ({ data, language: l }) => {
  if (!data?.weakUnits) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'त्रुटि विश्लेषण' : 'Errors'}</h3>
      </div>
      <div className="space-y-2">
        {data.weakUnits.slice(0, 4).map((unit, i) => (
          <div key={i} className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400">{unit.name}</span>
              <span className="text-[10px] font-bold text-red-600">{unit.errorRate}%</span>
            </div>
            <p className="text-[8px] text-red-600 dark:text-red-400">{unit.commonErrors}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopicMasteryRadar = ({ data, language: l }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'विषय दक्षता' : 'Topics'}</h3>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data.slice(0, 8)}>
          <PolarGrid />
          <PolarAngleAxis dataKey="unit" tick={{ fontSize: 8 }} />
          <PolarRadiusAxis tick={{ fontSize: 8 }} />
          <Radar name="Accuracy" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const NeedsAttentionCard = ({ data, language: l, navigate }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'ध्यान दें' : 'Attention'}</h3>
      </div>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {data.slice(0, 8).map((test, i) => (
          <button key={i} onClick={() => navigate?.(`/results/${test.lastAttempt?._id}`)} className="w-full text-left p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all border border-orange-200 dark:border-orange-800">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-900 dark:text-white truncate">{test.title}</p>
                <p className="text-[8px] text-orange-600 dark:text-orange-400">{test.bestScore < 40 ? `Critical: ${test.bestScore}%` : `Weak: ${test.bestScore}%`}</p>
              </div>
              <RotateCcw className="w-3 h-3 text-orange-500 flex-shrink-0 ml-2" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PendingTimeline = ({ data, language: l, navigate }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'बाकी टेस्ट' : 'Pending'}</h3>
      </div>
      <div className="space-y-1.5">
        {data.slice(0, 6).map((test, i) => (
          <button key={i} onClick={() => navigate?.(`/test/${test.testId}`)} className="w-full text-left p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-900 dark:text-white truncate">{test.title}</p>
                <p className="text-[8px] text-gray-500">{new Date(test.createdDate).toLocaleDateString()}</p>
              </div>
              <Play className="w-3 h-3 text-indigo-500 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const AchievementCard = ({ data, language: l }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Medal className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'उपलब्धियां' : 'Achievements'}</h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {data.slice(0, 8).map((ach, i) => (
          <div key={i} className={`p-3 rounded-lg text-center transition-all  ${ach.unlocked ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-gray-100 dark:bg-gray-700 opacity-50'}`}>
            <div className="text-xl mb-1">{ach.icon === 'medal' ? '🏅' : ach.icon === 'flame' ? '🔥' : ach.icon === 'target' ? '🎯' : ach.icon === 'bolt' ? '⚡' : '⭐'}</div>
            <p className="text-[8px] font-bold text-gray-900 dark:text-white line-clamp-2">{ach.label}</p>
            {!ach.unlocked && ach.progress && <p className="text-[7px] text-gray-500 mt-0.5">{Math.round(ach.progress * 100)}%</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

const QuoteCard = ({ quotes, language: l }) => {
  const quote = quotes?.[Math.floor(Math.random() * quotes.length)] || { en: 'Keep pushing!', hi: 'आगे बढ़ो!' };
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white text-center">
      <Quote className="w-6 h-6 mx-auto mb-2 opacity-50" />
      <p className="text-sm font-semibold italic mb-3">{l === 'hi' ? quote.hi : quote.en}</p>
      <p className="text-[10px] opacity-60">{l === 'hi' ? '💪 तुम कर सकते हो!' : '💪 You got this!'}</p>
    </div>
  );
};

const MistakeJournal = ({ data, language: l }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <NotebookPen className="w-4 h-4 text-rose-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{l === 'hi' ? 'सामान्य त्रुटियां' : 'Mistakes'}</h3>
      </div>
      <div className="space-y-2">
        {data.slice(0, 5).map((mistake, i) => (
          <div key={i} className="p-2 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-200 dark:border-rose-800">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400">{mistake.topic}</p>
                <p className="text-[8px] text-rose-600 dark:text-rose-400">{mistake.errorType}</p>
              </div>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">{mistake.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════════
const Dashboard = ({ language: propLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const d = useDashboard();
  const greeting = getGreeting();
  const GreetingIcon = greeting.Icon;

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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
              
              {/* Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-[0.02]" 
                style={{ 
                  backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', 
                  backgroundSize: '28px 28px' 
                }} 
              />

              <div className="relative">
                {/* Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <LiveClock />
                    <SessionTimer />
                    {d.daysUntilExam !== null && d.daysUntilExam > 0 && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                        d.daysUntilExam <= 7 
                          ? 'bg-red-500/20 border-red-500/30 animate-pulse' 
                          : d.daysUntilExam <= 30 
                            ? 'bg-amber-500/20 border-amber-500/30' 
                            : 'bg-white/10 border-white/10'
                      }`}>
                        <CalendarDays className={`w-3.5 h-3.5 ${d.daysUntilExam <= 7 ? 'text-red-400' : 'text-rose-400'}`} />
                        <span className="text-xs font-mono font-bold tabular-nums">
                          {d.daysUntilExam}d {l === 'hi' ? 'बाकी' : 'left'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={d.refresh}
                      disabled={d.refreshing}
                      className={`p-2 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all ${
                        d.refreshing ? 'animate-spin' : ''
                      }`}
                      title={l === 'hi' ? 'रिफ्रेश' : 'Refresh'}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] text-indigo-300/40">
                      {d.lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Main Hero Content */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    {/* Greeting */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${greeting.gradient} flex items-center justify-center shadow-lg`}>
                        <GreetingIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
                          {l === 'hi' ? greeting.hi : greeting.en}
                          <span className="text-2xl">{greeting.emoji}</span>
                        </h1>
                        <p className="text-[10px] text-indigo-300/50">
                          {new Date().toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <p className="text-indigo-200/60 text-sm mb-4 max-w-lg">
                      {l === 'hi'
                        ? 'नियमित अभ्यास सफलता की कुंजी है। आज का लक्ष्य पूरा करें!'
                        : 'Consistent practice is the key to success. Complete your daily goals!'}
                    </p>

                    {/* Quick Stats Badges */}
                    {d.jrfProbability.dataPoints >= 3 && (
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                          d.jrfProbability.riskLevel === 'safe'
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : d.jrfProbability.riskLevel === 'moderate'
                            ? 'bg-blue-500/10 border-blue-500/20'
                            : d.jrfProbability.riskLevel === 'risky'
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-red-500/10 border-red-500/20'
                        }`}>
                          <Brain className="w-4 h-4 text-indigo-300" />
                          <span className="text-[11px] font-bold">
                            JRF: {d.jrfProbability.jrfProbability}%
                          </span>
                          <span className="text-[10px] text-indigo-300/50">|</span>
                          <span className="text-[11px] font-bold">
                            NET: {d.jrfProbability.netProbability}%
                          </span>
                        </div>

                        {d.todayActivity.count > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-bold text-emerald-300">
                              {l === 'hi' ? `आज ${d.todayActivity.count} टेस्ट` : `${d.todayActivity.count} today`}
                            </span>
                          </div>
                        )}

                        {d.examCommandCenter?.readiness && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <Gauge className="w-3.5 h-3.5 text-indigo-300" />
                            <span className="text-[11px] font-bold text-indigo-300">
                              {l === 'hi' ? 'तैयारी' : 'Ready'}: {d.examCommandCenter.readiness.overall}%
                            </span>
                          </div>
                        )}

                        {d.smartRevision?.stats?.dueToday > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
                            <span className="text-[11px] font-bold text-rose-300">
                              {d.smartRevision.stats.dueToday} {l === 'hi' ? 'रिवीज़न बाकी' : 'due'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate('/tests/create')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <Play className="w-4 h-4" />
                        {l === 'hi' ? 'टेस्ट शुरू करें' : 'Start Test'}
                      </button>
                      
                      <button
                        onClick={() => navigate('/import')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 font-semibold text-sm rounded-xl hover:bg-white/20 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        {l === 'hi' ? 'आयात करें' : 'Import'}
                      </button>

                      {d.smartRevision?.marathonQueue?.length > 0 && (
                        <button
                          onClick={() => navigate(`/test/${d.smartRevision.marathonQueue[0].testId}`)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-sm rounded-xl hover:shadow-xl transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {l === 'hi' ? 'रिवीज़न करें' : 'Revise Now'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Accuracy Ring & Stats */}
                  <div className="flex items-center gap-5">
                    <div className="hidden md:flex flex-col gap-2">
                      {[
                        { label: 'P1', value: d.paper1Count, icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', acc: d.paper1Accuracy },
                        { label: 'P2', value: d.paper2Count, icon: Target, gradient: 'from-purple-500 to-violet-500', acc: d.paper2Accuracy },
                        { label: l === 'hi' ? 'टेस्ट' : 'Tests', value: d.testStats?.totalTests || 0, icon: ClipboardList, gradient: 'from-amber-500 to-orange-500' },
                      ].map((stat, index) => (
                        <div key={index} className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                            <stat.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <p className="text-[9px] text-indigo-300/40">
                              {stat.label}{stat.acc !== undefined ? ` (${stat.acc}%)` : ''}
                            </p>
                            <p className="text-sm font-bold">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <ProgressRing
                      percentage={d.overallAccuracy}
                      size={130}
                      strokeWidth={10}
                      color="#22c55e"
                      bgColor="rgba(255,255,255,0.08)"
                    >
                      <div className="text-center">
                        <p className="text-3xl font-black">{d.overallAccuracy}%</p>
                        <p className="text-[9px] text-indigo-300/50 uppercase">
                          {l === 'hi' ? 'सटीकता' : 'Accuracy'}
                        </p>
                      </div>
                    </ProgressRing>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 STAT CARDS
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={FileQuestion}
                label={l === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
                value={d.totalQuestions}
                subtitle={l === 'hi' ? 'बैंक में' : 'in bank'}
                gradient={GRADIENTS.blue}
                iconGradient="from-blue-500 to-cyan-600"
                onClick={() => navigate('/questions')}
                delay={0}
                sparkData={[3, 7, 5, 12, 8, 15, 10]}
                loading={d.loading}
              />
              <StatCard
                icon={BookOpen}
                label="Paper 1"
                value={d.paper1Count}
                subtitle={`${d.paper1Accuracy}% ${l === 'hi' ? 'सटीकता' : 'accuracy'}`}
                gradient={GRADIENTS.green}
                iconGradient="from-emerald-500 to-green-600"
                onClick={() => navigate('/questions?paper=paper1')}
                delay={100}
                sparkData={[2, 5, 3, 8, 6, 10, 7]}
                trend={d.paper1TrendDir}
                loading={d.loading}
              />
              <StatCard
                icon={Target}
                label="Paper 2"
                value={d.paper2Count}
                subtitle={`${d.paper2Accuracy}% ${l === 'hi' ? 'सटीकता' : 'accuracy'}`}
                gradient={GRADIENTS.purple}
                iconGradient="from-purple-500 to-violet-600"
                onClick={() => navigate('/questions?paper=paper2')}
                delay={200}
                sparkData={[4, 6, 9, 5, 11, 8, 13]}
                trend={d.paper2TrendDir}
                loading={d.loading}
              />
              <StatCard
                icon={ClipboardList}
                label={l === 'hi' ? 'कुल टेस्ट' : 'Total Tests'}
                value={d.testStats?.totalTests || 0}
                subtitle={`${d.allCompletedAttempts.length} ${l === 'hi' ? 'दिए' : 'taken'}`}
                gradient={GRADIENTS.amber}
                iconGradient="from-amber-500 to-orange-600"
                onClick={() => navigate('/tests')}
                delay={300}
                sparkData={[1, 3, 2, 5, 4, 7, 6]}
                loading={d.loading}
              />
            </div>

            {/* ═══════════════════════════════════════════════
                 MAIN WIDGETS GRID
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

              {/* Column 3: Exam Command + Daily Report + Streak */}
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
                 🆕 PROGRESS TRACKER + SMART REVISION
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Route className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'प्रगति और रिवीज़न' : 'Progress & Revision'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ProgressTrackerCard 
                  data={d.improvementJourney} 
                  language={l} 
                  navigate={navigate} 
                />
                <SmartRevisionHub 
                  data={d.smartRevision} 
                  language={l} 
                  navigate={navigate} 
                />
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
                <QuickActionCard
                  icon={PlusCircle}
                  title={l === 'hi' ? 'नया टेस्ट' : 'New Test'}
                  description={l === 'hi' ? 'मॉक टेस्ट बनाएं' : 'Create mock test'}
                  to="/tests/create"
                  gradient={GRADIENTS.blue}
                  delay={0}
                />
                <QuickActionCard
                  icon={Upload}
                  title={l === 'hi' ? 'आयात करें' : 'Import'}
                  description="JSON/Excel"
                  to="/import"
                  gradient={GRADIENTS.green}
                  badge="JSON"
                  delay={100}
                />
                <QuickActionCard
                  icon={FileQuestion}
                  title={l === 'hi' ? 'प्रश्न बैंक' : 'Questions'}
                  description={l === 'hi' ? 'सभी प्रश्न देखें' : 'View all questions'}
                  to="/questions"
                  gradient={GRADIENTS.purple}
                  delay={200}
                />
                <QuickActionCard
                  icon={BarChart3}
                  title={l === 'hi' ? 'परिणाम' : 'Results'}
                  description={l === 'hi' ? 'प्रगति देखें' : 'View progress'}
                  to="/results"
                  gradient={GRADIENTS.amber}
                  delay={300}
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 COMPREHENSIVE ANALYTICS SECTION
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'विस्तृत विश्लेषण' : 'Analytics'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <WeeklyChapterMatrix data={d.weeklyChapterMatrix} language={l} />
                <SyllabusCoverageMap data={d.syllabusCoverage} language={l} />
                <SpeedAnalyticsCard data={d.speedAnalytics} language={l} />
                <StudyRecommendations data={d.studyRecommendations} language={l} navigate={navigate} />
                <ScoreDistributionCard data={d.scoreDistributionData} language={l} />
                <PersonalRecords data={d.personalRecords} language={l} />
                <TimeOfDayCard data={d.timeOfDayAnalysis} language={l} />
                <ActivityHeatmap data={d.activityHeatmapData} language={l} />
                <WeeklyComparison data={d.weeklyComparison} language={l} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 ADVANCED INSIGHTS SECTION
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'उन्नत अंतर्दृष्टि' : 'Insights'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PaperTrendCard paper1Trend={d.paper1Trend} paper2Trend={d.paper2Trend} language={l} />
                <ErrorAnalysisCard data={d.errorAnalysis} language={l} />
                <TopicMasteryRadar data={d.topicPerformance} language={l} />
                <NeedsAttentionCard data={d.needsAttentionTests} language={l} navigate={navigate} />
                <PendingTimeline data={d.pendingTests} language={l} navigate={navigate} />
                <AchievementCard data={d.achievements} language={l} />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 MOTIVATION & MISC SECTION
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {l === 'hi' ? 'प्रेरणा' : 'Motivation'}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuoteCard quotes={d.motivationalQuotes} language={l} />
                <MistakeJournal data={d.mistakeJournal} language={l} />
                {/* Additional space cards can be added here */}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                 FOOTER CTA
            ═══════════════════════════════════════════════ */}
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 text-white">
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">
                      {l === 'hi' ? 'UGC NET क्रैक करें!' : 'Crack UGC NET!'}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {d.jrfProbability.dataPoints >= 3 ? (
                        <>
                          JRF: {d.jrfProbability.jrfProbability}% | NET: {d.jrfProbability.netProbability}%
                          {d.examCommandCenter?.readiness && (
                            <> | {l === 'hi' ? 'तैयारी' : 'Ready'}: {d.examCommandCenter.readiness.overall}%</>
                          )}
                        </>
                      ) : (
                        l === 'hi' ? 'अभी शुरू करें और अपना लक्ष्य पाएं!' : 'Start now and achieve your goal!'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {d.smartRevision?.stats?.dueToday > 0 && d.smartRevision.marathonQueue[0] && (
                    <button
                      onClick={() => navigate(`/test/${d.smartRevision.marathonQueue[0].testId}`)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-sm rounded-xl hover:shadow-xl transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {d.smartRevision.stats.dueToday} {l === 'hi' ? 'रिवीज़न' : 'Revisions'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/tests')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-sm rounded-xl hover:shadow-xl transition-all"
                  >
                    <Play className="w-4 h-4" />
                    {l === 'hi' ? 'टेस्ट देखें' : 'View Tests'}
                  </button>
                  
                  <button
                    onClick={() => navigate('/results')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 font-semibold text-sm rounded-xl hover:bg-white/20 transition-all"
                  >
                    <BarChart3 className="w-4 h-4" />
                    {l === 'hi' ? 'परिणाम' : 'Results'}
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
