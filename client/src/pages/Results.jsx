import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trophy, Clock, Target, Eye, RotateCcw, Calendar, ChevronRight,
  Search, FileText, TrendingUp, Award, Loader2, AlertCircle,
  Hash, ArrowUpRight, Flame, Zap, Filter, X, SortAsc, SortDesc,
  BarChart3, Star, Medal, Sparkles, ChevronDown, Download,
  Trash2, MoreVertical, CheckCircle, XCircle, ArrowDown, ArrowUp
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ResultPage from '../components/result/ResultPage';
import { apiHelper } from '../services/api';

const getStoredLanguage = () => {
  try { return localStorage.getItem('netprep_lang') || 'en'; }
  catch { return 'en'; }
};
const setStoredLanguage = (lang) => {
  try { localStorage.setItem('netprep_lang', lang); } catch {}
};

// ─── Animated Number ───
const AnimNum = ({ value, suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseInt(value) || 0;
    const inc = Math.max(end / 40, 1);
    const iv = setInterval(() => {
      start += inc;
      if (start >= end) { setDisplay(end); clearInterval(iv); }
      else setDisplay(Math.floor(start));
    }, 20);
    return () => clearInterval(iv);
  }, [value]);
  return <>{display}{suffix}</>;
};

// ─── Score Ring (mini) ───
const ScoreRing = ({ percentage, size = 56 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#3B82F6' : percentage >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" className="text-gray-200 dark:text-secondary-700" strokeWidth={5} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <span className="absolute text-sm font-black" style={{ color }}>{percentage}%</span>
    </div>
  );
};

// ─── Streak Badge ───
const StreakBadge = ({ attempts, language }) => {
  let streak = 0;
  const sorted = [...attempts].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  for (const a of sorted) {
    if ((a.accuracy || 0) >= 60) streak++; else break;
  }
  if (streak < 2) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/25 animate-bounce-in">
      <Flame className="w-3.5 h-3.5" />
      {streak} {language === 'hi' ? 'लगातार पास!' : 'Streak!'}
    </div>
  );
};

const Results = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [language, setLanguage] = useState(getStoredLanguage);

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterAccuracy, setFilterAccuracy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // cards | compact
  const [selectedAttempts, setSelectedAttempts] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    setStoredLanguage(lang);
    window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: lang }));
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.detail && e.detail !== language) setLanguage(e.detail); };
    window.addEventListener('netprep-lang-change', handler);
    return () => window.removeEventListener('netprep-lang-change', handler);
  }, [language]);

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get('/attempts', { limit: 200, sortBy: 'completedAt', sortOrder: 'desc' });
      setAttempts(response.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);
  useEffect(() => { if (attemptId) loadAttemptDetail(attemptId); }, [attemptId]);

  const loadAttemptDetail = async (id) => {
    try {
      setDetailLoading(true);
      const response = await apiHelper.get(`/attempts/${id}`);
      const data = response.data;
      setSelectedAttempt(data);
      setSelectedTest(data.testId || data.test);

      if (data.answers?.length > 0) {
        const qIds = data.answers.map(a => a.questionId?._id || a.questionId).filter(Boolean);
        if (qIds.length > 0) {
          try {
            const qRes = await apiHelper.post('/questions/bulk', { ids: qIds });
            const qMap = {};
            (qRes.data || []).forEach(q => { qMap[q._id] = q; });
            setSelectedQuestions(data.answers.map(a => {
              const qId = a.questionId?._id || a.questionId;
              return qMap[qId] || a.questionId || {};
            }));
          } catch { setSelectedQuestions(data.answers.map(a => a.questionId || {})); }
        }
      }

      const testId = data.testId?._id || data.testId;
      if (testId) {
        try {
          const prev = await apiHelper.get('/attempts', { testId, limit: 20 });
          setPreviousAttempts(prev.data || []);
        } catch { setPreviousAttempts([]); }
      }
    } catch (err) { setError(err.message); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await apiHelper.delete(`/attempts/${id}`);
      setAttempts(prev => prev.filter(a => a._id !== id));
      setShowDeleteConfirm(null);
    } catch (err) { console.error('Delete failed:', err); }
  };

  // Stats
  const stats = useMemo(() => {
    if (!attempts.length) return null;
    const accs = attempts.map(a => a.accuracy || 0);
    const scores = attempts.map(a => a.score || 0);
    const times = attempts.map(a => a.totalTimeTaken || 0);
    return {
      total: attempts.length,
      avgAccuracy: Math.round(accs.reduce((s, v) => s + v, 0) / accs.length),
      bestScore: Math.max(...accs),
      passed: attempts.filter(a => (a.accuracy || 0) >= 60).length,
      totalTime: times.reduce((s, v) => s + v, 0),
      avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
      improvementRate: accs.length >= 2 ? Math.round(accs[0] - accs[accs.length - 1]) : 0,
    };
  }, [attempts]);

  // Filter & Sort
  const processed = useMemo(() => {
    let list = [...attempts];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(a => (a.testId?.title || '').toLowerCase().includes(term));
    }

    // Accuracy filter
    if (filterAccuracy === 'excellent') list = list.filter(a => (a.accuracy || 0) >= 80);
    else if (filterAccuracy === 'good') list = list.filter(a => { const acc = a.accuracy || 0; return acc >= 60 && acc < 80; });
    else if (filterAccuracy === 'average') list = list.filter(a => { const acc = a.accuracy || 0; return acc >= 40 && acc < 60; });
    else if (filterAccuracy === 'weak') list = list.filter(a => (a.accuracy || 0) < 40);

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.completedAt || 0) - new Date(b.completedAt || 0);
      else if (sortBy === 'accuracy') cmp = (a.accuracy || 0) - (b.accuracy || 0);
      else if (sortBy === 'score') cmp = (a.score || 0) - (b.score || 0);
      else if (sortBy === 'time') cmp = (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
      else if (sortBy === 'title') cmp = (a.testId?.title || '').localeCompare(b.testId?.title || '');
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [attempts, searchTerm, sortBy, sortOrder, filterAccuracy]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtTime = (s) => s ? `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}` : '0:00';
  const fmtTimeWords = (s) => {
    if (!s) return '0m';
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const accStyle = (a) => {
    if (a >= 80) return { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-500/20', gradient: 'from-emerald-500 to-green-600' };
    if (a >= 60) return { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-500/20', gradient: 'from-blue-500 to-cyan-600' };
    if (a >= 40) return { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-500/20', gradient: 'from-amber-500 to-orange-600' };
    return { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30', ring: 'ring-red-500/20', gradient: 'from-red-500 to-rose-600' };
  };

  // ===== DETAIL VIEW =====
  if (selectedAttempt || attemptId) {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800 animate-ping opacity-20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
              <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
              <Trophy className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
            </div>
            <p className="text-gray-600 dark:text-secondary-400 font-semibold text-lg">
              {language === 'hi' ? 'परिणाम लोड हो रहा है...' : 'Loading Results...'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {language === 'hi' ? 'कृपया प्रतीक्षा करें' : 'Please wait'}
            </p>
          </div>
        </div>
      );
    }

    if (selectedAttempt) {
      return (
        <ResultPage
          attempt={selectedAttempt}
          test={selectedTest}
          questions={selectedQuestions}
          language={language}
          onLanguageChange={handleLanguageChange}
          previousAttempts={previousAttempts}
          onGoBack={() => {
            setSelectedAttempt(null);
            setSelectedTest(null);
            setSelectedQuestions([]);
            setPreviousAttempts([]);
            navigate('/results');
          }}
          onReattempt={() => {
            const tid = selectedTest?._id || selectedAttempt?.testId?._id || selectedAttempt?.testId;
            if (tid) navigate(`/test/${tid}`);
          }}
        />
      );
    }
  }

  // ===== LIST VIEW =====
  return (
    <Layout language={language} onLanguageChange={handleLanguageChange}>
      <div className="max-w-7xl mx-auto">

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="relative overflow-hidden mb-8 bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {language === 'hi' ? 'परीक्षा परिणाम' : 'Test Results'}
                </h1>
                <p className="text-white/60 text-sm mt-0.5">
                  {language === 'hi' ? `${attempts.length} प्रयास पूर्ण` : `${attempts.length} attempts completed`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StreakBadge attempts={attempts} language={language} />
            </div>
          </div>
        </div>

        {/* ═══════ STATS GRID ═══════ */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Hash, value: stats.total, label: language === 'hi' ? 'कुल प्रयास' : 'Total Tests', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20', suffix: '' },
              { icon: Target, value: stats.avgAccuracy, label: language === 'hi' ? 'औसत सटीकता' : 'Avg Accuracy', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20', suffix: '%' },
              { icon: Flame, value: stats.bestScore, label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best Score', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20', suffix: '%' },
              { icon: Zap, value: stats.passed, label: language === 'hi' ? 'पास (60%+)' : 'Passed (60%+)', gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20', suffix: '' },
            ].map((s, i) => (
              <div key={i} className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 group hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500`} />
                <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${s.shadow}`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                  <AnimNum value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ SEARCH + FILTERS ═══════ */}
        <div className="mb-5 space-y-3">
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'hi' ? 'परीक्षा खोजें...' : 'Search tests...'}
                className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-full">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all font-medium text-sm ${
                showFilters
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                  : 'bg-white dark:bg-secondary-800 border-gray-200 dark:border-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'फ़िल्टर' : 'Filters'}</span>
              {filterAccuracy !== 'all' && (
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </button>

            {/* Sort */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white dark:bg-secondary-800 border-gray-200 dark:border-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-all text-sm font-medium">
                {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                <span className="hidden sm:inline">{language === 'hi' ? 'क्रम' : 'Sort'}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl shadow-xl z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {[
                  { id: 'date', label: language === 'hi' ? 'तिथि' : 'Date' },
                  { id: 'accuracy', label: language === 'hi' ? 'सटीकता' : 'Accuracy' },
                  { id: 'score', label: language === 'hi' ? 'अंक' : 'Score' },
                  { id: 'title', label: language === 'hi' ? 'नाम' : 'Name' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (sortBy === opt.id) setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
                      else { setSortBy(opt.id); setSortOrder('desc'); }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      sortBy === opt.id ? 'text-primary-600 font-semibold bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-secondary-300'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.id && (sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Accuracy Filter Chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 animate-fade-in">
              <span className="text-xs font-semibold text-gray-500 dark:text-secondary-400 uppercase tracking-wider self-center mr-2">
                {language === 'hi' ? 'सटीकता:' : 'Accuracy:'}
              </span>
              {[
                { id: 'all', label: language === 'hi' ? 'सभी' : 'All', color: 'primary' },
                { id: 'excellent', label: language === 'hi' ? 'उत्कृष्ट (80%+)' : 'Excellent (80%+)', color: 'emerald' },
                { id: 'good', label: language === 'hi' ? 'अच्छा (60-80%)' : 'Good (60-80%)', color: 'blue' },
                { id: 'average', label: language === 'hi' ? 'औसत (40-60%)' : 'Average (40-60%)', color: 'amber' },
                { id: 'weak', label: language === 'hi' ? 'कमज़ोर (<40%)' : 'Weak (<40%)', color: 'red' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterAccuracy(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterAccuracy === f.id
                      ? `bg-${f.color}-600 text-white shadow-md shadow-${f.color}-500/20`
                      : `bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 hover:bg-gray-200`
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-secondary-400 px-1">
            <span>
              {processed.length} {language === 'hi' ? 'परिणाम' : 'results'}
              {searchTerm && ` "${searchTerm}" ${language === 'hi' ? 'के लिए' : 'for'}`}
            </span>
          </div>
        </div>

        {/* ═══════ LOADING ═══════ */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
              <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-secondary-400 font-medium">
              {language === 'hi' ? 'लोड हो रहा है...' : 'Loading results...'}
            </p>
          </div>
        )}

        {/* ═══════ ERROR ═══════ */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start gap-4 animate-fade-in">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800 dark:text-red-400">{language === 'hi' ? 'त्रुटि' : 'Error'}</p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
            </div>
            <Button variant="danger" size="sm" onClick={fetchAttempts}>{language === 'hi' ? 'पुनः प्रयास' : 'Retry'}</Button>
          </div>
        )}

        {/* ═══════ EMPTY STATE ═══════ */}
        {!loading && attempts.length === 0 && (
          <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-200 dark:border-secondary-700 p-16 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full opacity-10 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-gray-300 dark:text-secondary-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-secondary-300 mb-2">
              {language === 'hi' ? 'कोई परिणाम नहीं' : 'No Results Yet'}
            </h3>
            <p className="text-gray-500 dark:text-secondary-400 mb-8 max-w-md mx-auto">
              {language === 'hi' ? 'परीक्षा देने के बाद आपके परिणाम यहाँ दिखेंगे। अभी एक परीक्षा दें!' : 'Your results will appear here after you take a test. Start one now!'}
            </p>
            <Button variant="gradient" size="lg" icon={Sparkles} onClick={() => navigate('/tests')}>
              {language === 'hi' ? 'परीक्षा दें' : 'Take a Test'}
            </Button>
          </div>
        )}

        {/* ═══════ RESULTS LIST ═══════ */}
        {!loading && processed.length > 0 && (
          <div className="space-y-3">
            {processed.map((att, idx) => {
              const acc = att.accuracy || 0;
              const st = accStyle(acc);
              const title = att.testId?.title || (language === 'hi' ? 'परीक्षा' : 'Test');

              return (
                <div
                  key={att._id}
                  onClick={() => { navigate(`/results/${att._id}`); loadAttemptDetail(att._id); }}
                  className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 sm:p-5 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Score Ring */}
                    <div className="flex-shrink-0">
                      <ScoreRing percentage={acc} size={60} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate text-[15px]">
                          {title}
                        </h3>
                        {acc >= 90 && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                        {att.attemptNumber > 1 && (
                          <span className="flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0">
                            <RotateCcw className="w-2.5 h-2.5" />#{att.attemptNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-secondary-400">
                        <span className="flex items-center gap-1 bg-gray-50 dark:bg-secondary-700/50 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3" />{fmt(att.completedAt)}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 dark:bg-secondary-700/50 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />{fmtTimeWords(att.totalTimeTaken)}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 dark:bg-secondary-700/50 px-2 py-0.5 rounded-md">
                          <FileText className="w-3 h-3" />{att.answers?.length || 0}Q
                        </span>
                      </div>
                    </div>

                    {/* Right side stats (desktop) */}
                    <div className="hidden sm:flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-lg font-black text-emerald-600"><AnimNum value={att.correctCount || 0} /></p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'hi' ? 'सही' : 'Right'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-red-500"><AnimNum value={att.wrongCount || 0} /></p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'hi' ? 'गलत' : 'Wrong'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-gray-800 dark:text-secondary-200">{att.score || 0}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{language === 'hi' ? 'अंक' : 'Score'}</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-secondary-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-all flex-shrink-0 group-hover:scale-110">
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>

                  {/* Mobile stats bar */}
                  <div className="flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-secondary-700">
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold text-emerald-600">{att.correctCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="font-bold text-red-500">{att.wrongCount || 0}</span>
                    </div>
                    <div className="flex-1" />
                    <span className="text-sm font-black text-gray-800 dark:text-secondary-200">
                      {att.score || 0} <span className="text-xs font-normal text-gray-400">{language === 'hi' ? 'अंक' : 'pts'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No filter results */}
        {!loading && attempts.length > 0 && processed.length === 0 && (
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 p-12 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-secondary-400 font-medium mb-3">
              {language === 'hi' ? 'कोई मिलान नहीं मिला' : 'No matching results'}
            </p>
            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setFilterAccuracy('all'); }}>
              {language === 'hi' ? 'फ़िल्टर हटाएं' : 'Clear Filters'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Results;