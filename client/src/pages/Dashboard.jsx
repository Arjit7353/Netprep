// client/src/pages/Dashboard.jsx
// ⭐ ADVANCED DASHBOARD v2.0
// Features: Animated stats, Charts, Progress rings, Activity feed, Quick actions, Motivational quotes

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileQuestion, ClipboardList, BarChart3, TrendingUp, Upload,
  PlusCircle, Clock, Target, BookOpen, Award, ArrowRight,
  Calendar, Zap, Trophy, Flame, Star, ChevronRight, Play,
  BookMarked, GraduationCap, Brain, Sparkles, Timer, CheckCircle,
  XCircle, SkipForward, Percent, Activity, TrendingDown,
  RefreshCw, ExternalLink, Layers, Hash, ArrowUpRight,
  BarChart2, PieChart, FileText, History, Bookmark
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useQuestions } from '../hooks/useQuestions';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

// ═══════════════════════════════════════════════════════
//                 ANIMATED COUNTER
// ═══════════════════════════════════════════════════════
const AnimatedCounter = ({ end, duration = 1500, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{prefix}{count.toLocaleString()}{suffix}</>;
};

// ═══════════════════════════════════════════════════════
//              CIRCULAR PROGRESS RING
// ═══════════════════════════════════════════════════════
const ProgressRing = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = '#3b82f6',
  bgColor = '#e5e7eb',
  children 
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercentage(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          className="dark:stroke-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              MINI PROGRESS BAR
// ═══════════════════════════════════════════════════════
const MiniProgressBar = ({ value, max, color = 'blue', showLabel = true }) => {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-violet-500',
    orange: 'from-orange-500 to-amber-500',
    pink: 'from-pink-500 to-rose-500',
    indigo: 'from-indigo-500 to-blue-500',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">{value} / {max}</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  trend, 
  trendLabel,
  gradient,
  iconBg,
  onClick,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden bg-white dark:bg-gray-800 
        rounded-2xl border border-gray-100 dark:border-gray-700 
        p-5 transition-all duration-500 
        hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-600
        ${onClick ? 'cursor-pointer' : ''}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Background decoration */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] blur-2xl`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">
            <AnimatedCounter end={value} />
          </p>
          {subValue && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{subValue}</p>
          )}
          {trend !== undefined && (
            <div className={`mt-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend >= 0 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
            </div>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              QUICK ACTION CARD
// ═══════════════════════════════════════════════════════
const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  to, 
  gradient, 
  badge,
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Link
      to={to}
      className={`
        group relative overflow-hidden bg-white dark:bg-gray-800 
        rounded-2xl border-2 border-gray-100 dark:border-gray-700 
        p-5 transition-all duration-500 
        hover:shadow-2xl hover:-translate-y-2 hover:border-transparent
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {badge && (
            <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
              {badge}
            </span>
          )}
        </div>
        
        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white transition-colors mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-white/80 transition-colors">
          {description}
        </p>
        
        <div className="mt-4 flex items-center text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

// ═══════════════════════════════════════════════════════
//              RECENT TEST CARD
// ═══════════════════════════════════════════════════════
const RecentTestCard = ({ attempt, language }) => {
  const navigate = useNavigate();
  const percentage = attempt.totalMarks > 0 
    ? Math.round((attempt.score / attempt.totalMarks) * 100) 
    : 0;
  
  const getGradeColor = (pct) => {
    if (pct >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (pct >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (pct >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const getGrade = (pct) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return language === 'hi' ? 'अभी' : 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  return (
    <div 
      onClick={() => navigate(`/results/${attempt._id}`)}
      className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all cursor-pointer hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        {/* Grade Badge */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl ${getGradeColor(percentage)}`}>
          {getGrade(percentage)}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {attempt.testId?.title || 'Test'}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              {attempt.correctCount}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" />
              {attempt.wrongCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(attempt.completedAt)}
            </span>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-right">
          <p className="text-2xl font-black text-gray-900 dark:text-white">{percentage}%</p>
          <p className="text-xs text-gray-500">{attempt.score}/{attempt.totalMarks}</p>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              MOTIVATIONAL QUOTE
// ═══════════════════════════════════════════════════════
const quotes = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
];

const MotivationalQuote = () => {
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      
      <div className="relative">
        <Sparkles className="w-8 h-8 mb-4 text-yellow-300" />
        <p className="text-lg font-medium leading-relaxed mb-4 italic">
          "{quote.text}"
        </p>
        <p className="text-sm text-white/70">— {quote.author}</p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              STUDY STREAK
// ═══════════════════════════════════════════════════════
const StudyStreak = ({ streak = 0, language }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  
  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-yellow-300" />
          <span className="font-bold">{language === 'hi' ? 'स्टडी स्ट्रीक' : 'Study Streak'}</span>
        </div>
        <div className="text-3xl font-black">{streak}</div>
      </div>
      
      <div className="flex justify-between">
        {days.map((day, i) => (
          <div 
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i <= today && streak > 0
                ? 'bg-white text-orange-600'
                : 'bg-white/20 text-white/60'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              UNIT PROGRESS CARD
// ═══════════════════════════════════════════════════════
const UnitProgressCard = ({ unitData, totalQuestions, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const percentage = totalQuestions > 0 ? Math.round((unitData.count / totalQuestions) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    purple: 'from-purple-500 to-violet-500 bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    green: 'from-green-500 to-emerald-500 bg-green-100 dark:bg-green-900/30 text-green-600',
    orange: 'from-orange-500 to-amber-500 bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    pink: 'from-pink-500 to-rose-500 bg-pink-100 dark:bg-pink-900/30 text-pink-600',
  };

  return (
    <div className={`
      p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 
      hover:bg-white dark:hover:bg-gray-700 
      border border-transparent hover:border-gray-200 dark:hover:border-gray-600
      transition-all duration-300 hover:shadow-md
      ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
    `}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color].split(' ').slice(1).join(' ')} flex items-center justify-center font-bold text-sm`}>
          {unitData.count}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {unitData._id?.unit || 'Unknown'}
          </p>
          <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colorClasses[color].split(' ').slice(0, 2).join(' ')} rounded-full transition-all duration-1000`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{percentage}%</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//                    MAIN DASHBOARD
// ═══════════════════════════════════════════════════════
const Dashboard = ({ language: propLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const { stats, fetchStats, loading } = useQuestions();
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [testStats, setTestStats] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(true);

  // Fetch data
  useEffect(() => {
    fetchStats();
    loadRecentAttempts();
    loadTestStats();
  }, [fetchStats]);

  const loadRecentAttempts = async () => {
    try {
      const response = await attemptService.getRecentAttempts(5);
      setRecentAttempts(response.data || []);
    } catch (err) {
      console.error('Failed to load recent attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const loadTestStats = async () => {
    try {
      const response = await testService.getStats();
      setTestStats(response.data);
    } catch (err) {
      console.error('Failed to load test stats:', err);
    }
  };

  // Calculate derived stats
  const paper1Count = useMemo(() => {
    return stats?.byUnit?.filter(u => u._id?.paper === 'paper1').reduce((sum, u) => sum + u.count, 0) || 0;
  }, [stats]);

  const paper2Count = useMemo(() => {
    return stats?.byUnit?.filter(u => u._id?.paper === 'paper2').reduce((sum, u) => sum + u.count, 0) || 0;
  }, [stats]);

  const overallAccuracy = useMemo(() => {
    if (!recentAttempts.length) return 0;
    const totalCorrect = recentAttempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
    const totalQuestions = recentAttempts.reduce((sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }, [recentAttempts]);

  // Greeting based on time
  const getGreeting = (lang) => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === 'hi' ? 'सुप्रभात!' : 'Good Morning!';
    if (hour < 17) return lang === 'hi' ? 'नमस्ते!' : 'Good Afternoon!';
    return lang === 'hi' ? 'शुभ संध्या!' : 'Good Evening!';
  };

  return (
    <Layout language={propLanguage} setLanguage={setLanguage}>
      {({ language }) => (
        <div className="space-y-6 pb-8">
          
          {/* ═══════════════════════════════════════════════════════
                            HERO SECTION
              ═══════════════════════════════════════════════════════ */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 text-white">
            {/* Animated background shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-400/10 rounded-full blur-xl" />
            
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">👋</span>
                  <h1 className="text-2xl md:text-3xl font-black">
                    {getGreeting(language)}
                  </h1>
                </div>
                <p className="text-blue-100 text-lg mb-6 max-w-xl">
                  {language === 'hi' 
                    ? 'आज अपनी UGC NET की तैयारी जारी रखें। हर दिन थोड़ा अभ्यास सफलता की कुंजी है।'
                    : 'Continue your UGC NET preparation today. A little practice every day is the key to success.'
                  }
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/tests/create')}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-blue-50 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Play className="w-5 h-5" />
                    {language === 'hi' ? 'टेस्ट शुरू करें' : 'Start a Test'}
                  </button>
                  <button
                    onClick={() => navigate('/import')}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 font-semibold rounded-xl hover:bg-white/20 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    {language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}
                  </button>
                </div>
              </div>
              
              {/* Accuracy Ring */}
              <div className="flex-shrink-0">
                <ProgressRing 
                  percentage={overallAccuracy} 
                  size={160} 
                  strokeWidth={12}
                  color="#22c55e"
                  bgColor="rgba(255,255,255,0.2)"
                >
                  <div className="text-center">
                    <p className="text-4xl font-black">{overallAccuracy}%</p>
                    <p className="text-xs text-blue-200 uppercase tracking-wider">
                      {language === 'hi' ? 'सटीकता' : 'Accuracy'}
                    </p>
                  </div>
                </ProgressRing>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
                            STATS GRID
              ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FileQuestion}
              label={language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
              value={stats?.total || 0}
              subValue={language === 'hi' ? 'प्रश्न बैंक में' : 'in question bank'}
              trend={12}
              trendLabel={language === 'hi' ? 'इस सप्ताह' : 'this week'}
              gradient="from-blue-500 to-cyan-500"
              iconBg="from-blue-500 to-cyan-600"
              onClick={() => navigate('/questions')}
              delay={0}
            />
            
            <StatCard
              icon={BookOpen}
              label={language === 'hi' ? 'पेपर 1' : 'Paper 1'}
              value={paper1Count}
              subValue={language === 'hi' ? 'सामान्य पेपर' : 'General Paper'}
              gradient="from-green-500 to-emerald-500"
              iconBg="from-green-500 to-emerald-600"
              onClick={() => navigate('/questions?paper=paper1')}
              delay={100}
            />
            
            <StatCard
              icon={Target}
              label={language === 'hi' ? 'पेपर 2' : 'Paper 2'}
              value={paper2Count}
              subValue={language === 'hi' ? 'इतिहास' : 'History'}
              gradient="from-purple-500 to-violet-500"
              iconBg="from-purple-500 to-violet-600"
              onClick={() => navigate('/questions?paper=paper2')}
              delay={200}
            />
            
            <StatCard
              icon={ClipboardList}
              label={language === 'hi' ? 'कुल टेस्ट' : 'Total Tests'}
              value={testStats?.totalTests || 0}
              subValue={`${testStats?.totalAttempts || 0} ${language === 'hi' ? 'प्रयास' : 'attempts'}`}
              gradient="from-orange-500 to-amber-500"
              iconBg="from-orange-500 to-amber-600"
              onClick={() => navigate('/tests')}
              delay={300}
            />
          </div>

          {/* ═══════════════════════════════════════════════════════
                      QUICK ACTIONS + RECENT ACTIVITY
              ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                {language === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickActionCard
                  icon={PlusCircle}
                  title={language === 'hi' ? 'नया टेस्ट बनाएं' : 'Create New Test'}
                  description={language === 'hi' ? 'कस्टम मॉक टेस्ट बनाएं' : 'Build a custom mock test'}
                  to="/tests/create"
                  gradient="from-blue-600 to-indigo-600"
                  delay={0}
                />
                
                <QuickActionCard
                  icon={Upload}
                  title={language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}
                  description={language === 'hi' ? 'JSON से प्रश्न जोड़ें' : 'Add questions from JSON'}
                  to="/import"
                  gradient="from-green-600 to-emerald-600"
                  badge="JSON"
                  delay={100}
                />
                
                <QuickActionCard
                  icon={FileQuestion}
                  title={language === 'hi' ? 'प्रश्न बैंक' : 'Question Bank'}
                  description={language === 'hi' ? 'सभी प्रश्न देखें और प्रबंधित करें' : 'View & manage all questions'}
                  to="/questions"
                  gradient="from-purple-600 to-violet-600"
                  delay={200}
                />
                
                <QuickActionCard
                  icon={BarChart3}
                  title={language === 'hi' ? 'परिणाम देखें' : 'View Results'}
                  description={language === 'hi' ? 'अपनी प्रगति ट्रैक करें' : 'Track your progress'}
                  to="/results"
                  gradient="from-orange-600 to-red-600"
                  delay={300}
                />
              </div>
            </div>

            {/* Study Streak + Quote */}
            <div className="space-y-4">
              <StudyStreak streak={recentAttempts.length} language={language} />
              <MotivationalQuote />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
                      RECENT ACTIVITY + QUESTION DISTRIBUTION
              ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tests */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  {language === 'hi' ? 'हाल के टेस्ट' : 'Recent Tests'}
                </h3>
                <Link 
                  to="/results" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {language === 'hi' ? 'सभी देखें' : 'View All'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              {loadingAttempts ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {recentAttempts.map((attempt, index) => (
                    <RecentTestCard key={attempt._id || index} attempt={attempt} language={language} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-200 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {language === 'hi' ? 'अभी तक कोई टेस्ट नहीं दिया' : 'No tests taken yet'}
                  </p>
                  <button
                    onClick={() => navigate('/tests')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {language === 'hi' ? 'पहला टेस्ट दें' : 'Take First Test'}
                  </button>
                </div>
              )}
            </div>

            {/* Question Type Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-500" />
                {language === 'hi' ? 'प्रश्न प्रकार वितरण' : 'Question Types'}
              </h3>
              
              {stats?.byType && Object.keys(stats.byType).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.byType).slice(0, 6).map(([type, count], index) => {
                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo'];
                    
                    return (
                      <div key={type} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {count} <span className="text-gray-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <MiniProgressBar value={count} max={stats.total} color={colors[index % colors.length]} showLabel={false} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileQuestion className="w-16 h-16 mx-auto mb-4 text-gray-200 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions yet'}
                  </p>
                  <button
                    onClick={() => navigate('/import')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
                              UNIT-WISE PROGRESS
              ═══════════════════════════════════════════════════════ */}
          {stats?.byUnit && stats.byUnit.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                <Layers className="w-5 h-5 text-indigo-500" />
                {language === 'hi' ? 'इकाई-वार प्रगति' : 'Unit-wise Progress'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Paper 1 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {language === 'hi' ? 'पेपर 1' : 'Paper 1'}
                      </h4>
                      <p className="text-xs text-gray-500">{paper1Count} {language === 'hi' ? 'प्रश्न' : 'questions'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stats.byUnit
                      .filter(u => u._id?.paper === 'paper1')
                      .slice(0, 5)
                      .map((unit, index) => (
                        <UnitProgressCard 
                          key={index} 
                          unitData={unit} 
                          totalQuestions={paper1Count}
                          color="blue"
                          delay={index * 50}
                        />
                      ))
                    }
                  </div>
                </div>
                
                {/* Paper 2 */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {language === 'hi' ? 'पेपर 2 (इतिहास)' : 'Paper 2 (History)'}
                      </h4>
                      <p className="text-xs text-gray-500">{paper2Count} {language === 'hi' ? 'प्रश्न' : 'questions'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stats.byUnit
                      .filter(u => u._id?.paper === 'paper2')
                      .slice(0, 5)
                      .map((unit, index) => (
                        <UnitProgressCard 
                          key={index} 
                          unitData={unit} 
                          totalQuestions={paper2Count}
                          color="purple"
                          delay={index * 50}
                        />
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
                              FOOTER CTA
              ═══════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">
                    {language === 'hi' ? 'तैयार हैं UGC NET क्रैक करने के लिए?' : 'Ready to crack UGC NET?'}
                  </h3>
                  <p className="text-gray-400">
                    {language === 'hi' 
                      ? 'अभी अभ्यास शुरू करें और अपने लक्ष्य को प्राप्त करें!'
                      : 'Start practicing now and achieve your goal!'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/tests')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Play className="w-5 h-5" />
                  {language === 'hi' ? 'टेस्ट देखें' : 'Browse Tests'}
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