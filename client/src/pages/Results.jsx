import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trophy, Clock, Target, Eye, RotateCcw, Calendar, Search,
  FileText, TrendingUp, AlertCircle, Hash, ArrowUpRight,
  Flame, Zap, Filter, X, SortDesc, SortAsc, Star, Sparkles,
  CheckCircle, XCircle, ArrowDown, ArrowUp, BarChart3, ChevronDown,
  Layers, Award, Activity, BookOpen
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ResultPage from '../components/result/ResultPage';
import { apiHelper } from '../services/api';

const getStoredLang = () => { try { return localStorage.getItem('netprep_lang') || 'en'; } catch { return 'en'; } };
const setStoredLang = (l) => { try { localStorage.setItem('netprep_lang', l); } catch {} };

// ─── Animated Number ───
const AnimNum = ({ value, suffix = '', duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const end = typeof value === 'number' ? value : parseInt(value) || 0;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <>{display}{suffix}</>;
};

// ─── Score Ring with Glow ───
const ScoreRing = ({ percentage, size = 60 }) => {
  const [val, setVal] = useState(0);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const color = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#3B82F6' : percentage >= 40 ? '#F59E0B' : '#EF4444';

  useEffect(() => {
    const t = setTimeout(() => setVal(percentage), 200);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`sr-${percentage}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <filter id={`glow-sr-${percentage}`}>
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor"
          className="text-gray-100 dark:text-secondary-700" strokeWidth={5} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#sr-${percentage}-${size})`}
          strokeWidth={5} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          filter={`url(#glow-sr-${percentage})`}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black" style={{ color }}>{percentage}%</span>
      </div>
    </div>
  );
};

// ─── Streak Badge ───
const StreakBadge = ({ attempts, language }) => {
  let streak = 0;
  const sorted = [...attempts].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  for (const a of sorted) { if ((a.accuracy || 0) >= 60) streak++; else break; }
  if (streak < 2) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/25 animate-bounce-in">
      <Flame className="w-3.5 h-3.5 animate-pulse" />
      {streak} {language === 'hi' ? 'लगातार पास!' : 'Win Streak!'}
      <Sparkles className="w-3 h-3" />
    </div>
  );
};

// ─── Floating Particles Background ───
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="absolute w-1 h-1 rounded-full bg-white/20"
        style={{
          top: `${15 + i * 15}%`, left: `${10 + i * 16}%`,
          animation: `float-particle ${4 + i * 1.2}s ease-in-out infinite`,
          animationDelay: `${i * 0.7}s`,
        }} />
    ))}
    <style>{`@keyframes float-particle{0%,100%{transform:translateY(0) scale(1);opacity:.15}50%{transform:translateY(-20px) scale(1.5);opacity:.4}}`}</style>
  </div>
);

const Results = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [language, setLanguage] = useState(getStoredLang);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterAccuracy, setFilterAccuracy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleLangChange = useCallback((lang) => {
    setLanguage(lang); setStoredLang(lang);
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
      const r = await apiHelper.get('/attempts', { limit: 200, sortBy: 'completedAt', sortOrder: 'desc' });
      setAttempts(r.data || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);
  useEffect(() => { if (attemptId) loadDetail(attemptId); }, [attemptId]);

  const loadDetail = async (id) => {
    try {
      setDetailLoading(true);
      const r = await apiHelper.get(`/attempts/${id}`);
      const data = r.data;
      setSelectedAttempt(data);
      setSelectedTest(data.testId || data.test);
      if (data.answers?.length > 0) {
        const qIds = data.answers.map(a => a.questionId?._id || a.questionId).filter(Boolean);
        if (qIds.length > 0) {
          try {
            const qRes = await apiHelper.post('/questions/bulk', { ids: qIds });
            const qMap = {}; (qRes.data || []).forEach(q => { qMap[q._id] = q; });
            setSelectedQuestions(data.answers.map(a => { const qId = a.questionId?._id || a.questionId; return qMap[qId] || a.questionId || {}; }));
          } catch { setSelectedQuestions(data.answers.map(a => a.questionId || {})); }
        }
      }
      const testId = data.testId?._id || data.testId;
      if (testId) { try { const prev = await apiHelper.get('/attempts', { testId, limit: 20 }); setPreviousAttempts(prev.data || []); } catch { setPreviousAttempts([]); } }
    } catch (err) { setError(err.message); }
    finally { setDetailLoading(false); }
  };

  const stats = useMemo(() => {
    if (!attempts.length) return null;
    const accs = attempts.map(a => a.accuracy || 0);
    return {
      total: attempts.length,
      avgAccuracy: Math.round(accs.reduce((s, v) => s + v, 0) / accs.length),
      bestScore: Math.max(...accs),
      passed: attempts.filter(a => (a.accuracy || 0) >= 60).length,
    };
  }, [attempts]);

  const processed = useMemo(() => {
    let list = [...attempts];
    if (searchTerm) { const t = searchTerm.toLowerCase(); list = list.filter(a => (a.testId?.title || '').toLowerCase().includes(t)); }
    if (filterAccuracy === 'excellent') list = list.filter(a => (a.accuracy || 0) >= 80);
    else if (filterAccuracy === 'good') list = list.filter(a => { const acc = a.accuracy || 0; return acc >= 60 && acc < 80; });
    else if (filterAccuracy === 'average') list = list.filter(a => { const acc = a.accuracy || 0; return acc >= 40 && acc < 60; });
    else if (filterAccuracy === 'weak') list = list.filter(a => (a.accuracy || 0) < 40);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.completedAt || 0) - new Date(b.completedAt || 0);
      else if (sortBy === 'accuracy') cmp = (a.accuracy || 0) - (b.accuracy || 0);
      else if (sortBy === 'score') cmp = (a.score || 0) - (b.score || 0);
      else if (sortBy === 'title') cmp = (a.testId?.title || '').localeCompare(b.testId?.title || '');
      return sortOrder === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [attempts, searchTerm, sortBy, sortOrder, filterAccuracy]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtTime = (s) => { if (!s) return '0m'; const m = Math.floor(s / 60), sec = s % 60; return m > 0 ? `${m}m ${sec}s` : `${sec}s`; };

  // ===== DETAIL VIEW =====
  if (selectedAttempt || attemptId) {
    if (detailLoading) return (
      <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center"><div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <Trophy className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
        </div>
        <p className="text-gray-600 dark:text-secondary-400 font-semibold text-lg animate-pulse">{language === 'hi' ? 'परिणाम लोड हो रहा है...' : 'Loading Results...'}</p>
        </div>
      </div>
    );
    if (selectedAttempt) return (
      <ResultPage attempt={selectedAttempt} test={selectedTest} questions={selectedQuestions} language={language}
        onLanguageChange={handleLangChange} previousAttempts={previousAttempts}
        onGoBack={() => { setSelectedAttempt(null); setSelectedTest(null); setSelectedQuestions([]); setPreviousAttempts([]); navigate('/results'); }}
        onReattempt={() => { const tid = selectedTest?._id || selectedAttempt?.testId?._id || selectedAttempt?.testId; if (tid) navigate(`/test/${tid}`); }} />
    );
  }

  // ===== LIST VIEW =====
  return (
    <Layout language={language} onLanguageChange={handleLangChange}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ═══════ PREMIUM HERO ═══════ */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
          <FloatingParticles />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg" />
                  <div className="relative p-3 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/25 shadow-xl">
                    <Trophy className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {language === 'hi' ? 'परीक्षा परिणाम' : 'Test Results'}
                  </h1>
                  <p className="text-white/50 text-sm mt-0.5 font-medium">
                    {language === 'hi' ? `${attempts.length} प्रयास पूर्ण` : `${attempts.length} attempts completed`}
                  </p>
                </div>
              </div>
              <StreakBadge attempts={attempts} language={language} />
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Hash, value: stats.total, label: language === 'hi' ? 'कुल प्रयास' : 'Total Tests', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/15', suffix: '' },
              { icon: Target, value: stats.avgAccuracy, label: language === 'hi' ? 'औसत सटीकता' : 'Avg Accuracy', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/15', suffix: '%' },
              { icon: Flame, value: stats.bestScore, label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best Score', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/15', suffix: '%' },
              { icon: Zap, value: stats.passed, label: language === 'hi' ? 'पास (60%+)' : 'Passed (60%+)', gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/15', suffix: '' },
            ].map((s, i) => (
              <div key={i} className="group relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${i * 80}ms` }}>
                {/* Background gradient blob */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${s.gradient} rounded-full opacity-[0.07] group-hover:opacity-[0.15] group-hover:scale-150 transition-all duration-700`} />
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                <div className={`w-11 h-11 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${s.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  <AnimNum value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-gray-500 dark:text-secondary-400 mt-1 font-semibold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ SEARCH + FILTERS ═══════ */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {/* Search with animation */}
            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity -m-0.5 p-0.5" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'hi' ? 'परीक्षा खोजें...' : 'Search tests...'}
                className="relative w-full pl-12 pr-10 py-3.5 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all shadow-sm focus:shadow-lg focus:shadow-primary-500/5" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-full transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filter */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl border font-medium text-sm transition-all duration-300 ${
                showFilters
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20 scale-105'
                  : 'bg-white dark:bg-secondary-800 border-gray-200 dark:border-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-50 hover:border-gray-300'
              }`}>
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'फ़िल्टर' : 'Filters'}</span>
              {filterAccuracy !== 'all' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full ring-2 ring-white dark:ring-secondary-800 animate-pulse" />}
            </button>

            {/* Sort */}
            <div className="relative">
              <button onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border bg-white dark:bg-secondary-800 border-gray-200 dark:border-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-50 transition-all text-sm font-medium">
                {sortOrder === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                <span className="hidden sm:inline">{language === 'hi' ? 'क्रम' : 'Sort'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl shadow-2xl z-20 overflow-hidden animate-scale-in">
                    {[
                      { id: 'date', label: language === 'hi' ? 'तिथि' : 'Date', icon: Calendar },
                      { id: 'accuracy', label: language === 'hi' ? 'सटीकता' : 'Accuracy', icon: Target },
                      { id: 'score', label: language === 'hi' ? 'अंक' : 'Score', icon: Award },
                      { id: 'title', label: language === 'hi' ? 'नाम' : 'Name', icon: FileText },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => {
                        if (sortBy === opt.id) setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
                        else { setSortBy(opt.id); setSortOrder('desc'); }
                        setShowSortMenu(false);
                      }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors ${
                          sortBy === opt.id ? 'text-primary-600 font-semibold bg-primary-50/50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-secondary-300'
                        }`}>
                        <div className="flex items-center gap-2.5">
                          <opt.icon className="w-4 h-4 opacity-60" />
                          {opt.label}
                        </div>
                        {sortBy === opt.id && (sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filter Chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-lg shadow-gray-200/50 dark:shadow-none animate-slide-down">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider self-center mr-2">
                {language === 'hi' ? 'सटीकता:' : 'Accuracy:'}
              </span>
              {[
                { id: 'all', label: language === 'hi' ? 'सभी' : 'All', color: 'primary' },
                { id: 'excellent', label: '80%+', color: 'emerald', emoji: '🏆' },
                { id: 'good', label: '60-80%', color: 'blue', emoji: '👍' },
                { id: 'average', label: '40-60%', color: 'amber', emoji: '📊' },
                { id: 'weak', label: '<40%', color: 'red', emoji: '📈' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilterAccuracy(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    filterAccuracy === f.id
                      ? `bg-${f.color}-600 text-white shadow-md shadow-${f.color}-500/25 scale-105`
                      : 'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 hover:bg-gray-200 hover:scale-105'
                  }`}>
                  {f.emoji && <span className="mr-1">{f.emoji}</span>}
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-400 px-1 font-medium">
            {processed.length} {language === 'hi' ? 'परिणाम' : 'results'}
            {searchTerm && ` · "${searchTerm}"`}
          </p>
        </div>

        {/* ═══════ LOADING ═══════ */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-secondary-700" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-secondary-700/50 rounded w-1/2" />
                  </div>
                  <div className="hidden sm:flex gap-6">
                    <div className="w-12 h-10 bg-gray-100 dark:bg-secondary-700 rounded-xl" />
                    <div className="w-12 h-10 bg-gray-100 dark:bg-secondary-700 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ ERROR ═══════ */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-start gap-4 animate-slide-up">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl flex-shrink-0"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div className="flex-1">
              <p className="font-bold text-red-800 dark:text-red-400">{language === 'hi' ? 'त्रुटि' : 'Error'}</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            </div>
            <Button variant="danger" size="sm" onClick={fetchAttempts}>{language === 'hi' ? 'पुनः' : 'Retry'}</Button>
          </div>
        )}

        {/* ═══════ EMPTY STATE ═══════ */}
        {!loading && attempts.length === 0 && (
          <div className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-3xl border border-gray-100 dark:border-secondary-700 p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-indigo-50/50 dark:from-primary-900/10 dark:to-indigo-900/10" />
            <div className="relative">
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-full opacity-10 animate-pulse" />
                <div className="absolute inset-3 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-full opacity-5 animate-ping" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="w-14 h-14 text-gray-300 dark:text-secondary-600" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-700 dark:text-secondary-300 mb-3">
                {language === 'hi' ? 'कोई परिणाम नहीं' : 'No Results Yet'}
              </h3>
              <p className="text-gray-500 dark:text-secondary-400 mb-8 max-w-md mx-auto leading-relaxed">
                {language === 'hi' ? 'परीक्षा देने के बाद आपके परिणाम यहाँ दिखेंगे। अभी एक परीक्षा दें!' : 'Your results will appear here after taking a test. Start one now!'}
              </p>
              <Button variant="gradient" size="lg" icon={Sparkles} onClick={() => navigate('/tests')}>
                {language === 'hi' ? 'परीक्षा दें' : 'Take a Test'}
              </Button>
            </div>
          </div>
        )}

        {/* ═══════ RESULTS LIST ═══════ */}
        {!loading && processed.length > 0 && (
          <div className="space-y-3">
            {processed.map((att, idx) => {
              const acc = att.accuracy || 0;
              const title = att.testId?.title || (language === 'hi' ? 'परीक्षा' : 'Test');

              return (
                <div key={att._id}
                  onClick={() => { navigate(`/results/${att._id}`); loadDetail(att._id); }}
                  className="group relative bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700/80 p-4 sm:p-5 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-400 cursor-pointer hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-50/0 via-primary-50/0 to-indigo-50/0 group-hover:from-primary-50/40 group-hover:via-primary-50/20 group-hover:to-indigo-50/40 dark:group-hover:from-primary-900/10 dark:group-hover:via-primary-900/5 dark:group-hover:to-indigo-900/10 transition-all duration-500" />

                  <div className="relative flex items-center gap-4">
                    {/* Score Ring */}
                    <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <ScoreRing percentage={acc} size={64} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate text-[15px]">
                          {title}
                        </h3>
                        {acc >= 90 && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0 animate-pulse" />}
                        {att.attemptNumber > 1 && (
                          <span className="flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0">
                            <RotateCcw className="w-2.5 h-2.5" />#{att.attemptNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-secondary-400">
                        <span className="flex items-center gap-1 bg-gray-50 dark:bg-secondary-700/50 px-2 py-0.5 rounded-lg">
                          <Calendar className="w-3 h-3" />{fmt(att.completedAt)}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 dark:bg-secondary-700/50 px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3" />{fmtTime(att.totalTimeTaken)}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-50 dark:bg-secondary-700/50 px-2 py-0.5 rounded-lg">
                          <FileText className="w-3 h-3" />{att.answers?.length || 0}Q
                        </span>
                      </div>
                    </div>

                    {/* Desktop stats */}
                    <div className="hidden sm:flex items-center gap-5">
                      {[
                        { val: att.correctCount || 0, label: language === 'hi' ? 'सही' : 'Right', color: 'text-emerald-600' },
                        { val: att.wrongCount || 0, label: language === 'hi' ? 'गलत' : 'Wrong', color: 'text-red-500' },
                        { val: att.score || 0, label: language === 'hi' ? 'अंक' : 'Score', color: 'text-gray-800 dark:text-secondary-200' },
                      ].map((s, i) => (
                        <div key={i} className="text-center min-w-[40px]">
                          <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Arrow */}
                    <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-secondary-700 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-all flex-shrink-0 group-hover:scale-110 group-hover:rotate-12">
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="relative flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-secondary-700">
                    <div className="flex items-center gap-1.5 text-xs"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /><span className="font-bold text-emerald-600">{att.correctCount || 0}</span></div>
                    <div className="flex items-center gap-1.5 text-xs"><XCircle className="w-3.5 h-3.5 text-red-500" /><span className="font-bold text-red-500">{att.wrongCount || 0}</span></div>
                    <div className="flex-1" />
                    <span className="text-sm font-black text-gray-800 dark:text-secondary-200">{att.score || 0} <span className="text-xs font-normal text-gray-400">{language === 'hi' ? 'अंक' : 'pts'}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No filter match */}
        {!loading && attempts.length > 0 && processed.length === 0 && (
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 p-12 text-center">
            <Search className="w-12 h-12 text-gray-200 dark:text-secondary-600 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold mb-4">{language === 'hi' ? 'कोई मिलान नहीं' : 'No matching results'}</p>
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