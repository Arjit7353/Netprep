// client/src/pages/Results.jsx
// FIXED: Language toggle works on list page + sidebar doesn't reset language

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trophy, Clock, Target, Eye, RotateCcw, Calendar, ChevronRight,
  Search, FileText, TrendingUp, Award, Loader2, AlertCircle,
  Hash, ArrowUpRight, Flame, Zap
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import ResultPage from '../components/result/ResultPage';
import { apiHelper } from '../services/api';

// FIXED: Get language from a shared source
const getStoredLanguage = () => {
  try {
    return localStorage.getItem('netprep_lang') || 'en';
  } catch { return 'en'; }
};

const setStoredLanguage = (lang) => {
  try {
    localStorage.setItem('netprep_lang', lang);
  } catch {}
};

const Results = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  // FIXED: Language state from localStorage, NOT defaulting to 'hi'
  const [language, setLanguage] = useState(getStoredLanguage);

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // FIXED: Language change handler that saves to localStorage
  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    setStoredLanguage(lang);
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: lang }));
  }, []);

  // FIXED: Listen for language changes from Layout/Sidebar
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail !== language) {
        setLanguage(e.detail);
      }
    };
    window.addEventListener('netprep-lang-change', handler);
    return () => window.removeEventListener('netprep-lang-change', handler);
  }, [language]);

  // FIXED: Sync language from localStorage on mount (in case sidebar changed it)
  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored !== language) {
      setLanguage(stored);
    }
  }, []);

  const fetchAttempts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiHelper.get('/attempts', {
        limit: 100, sortBy: 'completedAt', sortOrder: 'desc'
      });
      setAttempts(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  useEffect(() => {
    if (attemptId) loadAttemptDetail(attemptId);
  }, [attemptId]);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtTime = (s) => s ? `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` : '0:00';

  const accStyle = (a) => {
    if (a >= 80) return { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-500/20' };
    if (a >= 60) return { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', ring: 'ring-blue-500/20' };
    if (a >= 40) return { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', ring: 'ring-amber-500/20' };
    return { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30', ring: 'ring-red-500/20' };
  };

  const filtered = attempts.filter(a => !searchTerm || (a.testId?.title || '').toLowerCase().includes(searchTerm.toLowerCase()));

  // ===== DETAIL VIEW =====
  if (selectedAttempt || attemptId) {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
              <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-secondary-400 font-medium">
              {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
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
            if (tid) navigate(`/tests/${tid}/take`);
          }}
        />
      );
    }
  }

  // ===== LIST VIEW =====
  return (
    <Layout language={language} onLanguageChange={handleLanguageChange}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'hi' ? 'परीक्षा परिणाम' : 'Test Results'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-secondary-400">
                {language === 'hi' ? 'आपके सभी परीक्षा प्रयासों का इतिहास' : 'History of all your test attempts'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {attempts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Hash, value: attempts.length, label: language === 'hi' ? 'कुल प्रयास' : 'Total Attempts', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
              { icon: Target, value: `${Math.round(attempts.reduce((s, a) => s + (a.accuracy || 0), 0) / attempts.length)}%`, label: language === 'hi' ? 'औसत सटीकता' : 'Avg Accuracy', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
              { icon: Flame, value: `${Math.max(...attempts.map(a => a.accuracy || 0))}%`, label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best Score', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
              { icon: Zap, value: attempts.filter(a => (a.accuracy || 0) >= 60).length, label: language === 'hi' ? 'पास (60%+)' : 'Passed (60%+)', gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' }
            ].map((s, i) => (
              <div key={i} className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 group hover:shadow-xl transition-all duration-300">
                <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${s.shadow}`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="mb-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'hi' ? 'परीक्षा खोजें...' : 'Search tests...'}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
              <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && attempts.length === 0 && (
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-5">
              <Trophy className="w-10 h-10 text-gray-300 dark:text-secondary-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-secondary-300 mb-2">
              {language === 'hi' ? 'कोई परिणाम नहीं' : 'No Results Yet'}
            </h3>
            <p className="text-gray-500 dark:text-secondary-400 mb-6 max-w-sm mx-auto">
              {language === 'hi' ? 'परीक्षा देने के बाद परिणाम यहाँ दिखेंगे' : 'Results will appear here after you take a test'}
            </p>
            <Button variant="primary" onClick={() => navigate('/tests')}>
              {language === 'hi' ? 'परीक्षा दें' : 'Take a Test'}
            </Button>
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((att) => {
              const acc = att.accuracy || 0;
              const st = accStyle(acc);
              const title = att.testId?.title || (language === 'hi' ? 'परीक्षा' : 'Test');

              return (
                <div key={att._id} onClick={() => { navigate(`/results/${att._id}`); loadAttemptDetail(att._id); }}
                  className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 sm:p-5 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ring-4 ${st.ring} ${st.bg}`}>
                      <span className={`text-xl font-black ${st.color}`}>{acc}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate text-[15px]">{title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-secondary-400">
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-secondary-700/50 px-2 py-1 rounded-lg"><Calendar className="w-3.5 h-3.5" />{fmt(att.completedAt)}</span>
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-secondary-700/50 px-2 py-1 rounded-lg"><Clock className="w-3.5 h-3.5" />{fmtTime(att.totalTimeTaken)}</span>
                        <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-secondary-700/50 px-2 py-1 rounded-lg"><FileText className="w-3.5 h-3.5" />{att.answers?.length || 0} Q</span>
                        {att.attemptNumber > 1 && (
                          <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-lg font-medium"><RotateCcw className="w-3 h-3" />#{att.attemptNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-5">
                      <div className="text-center"><p className="text-lg font-black text-emerald-600">{att.correctCount || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">{language === 'hi' ? 'सही' : 'Right'}</p></div>
                      <div className="text-center"><p className="text-lg font-black text-red-500">{att.wrongCount || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">{language === 'hi' ? 'गलत' : 'Wrong'}</p></div>
                      <div className="text-center"><p className="text-lg font-black text-gray-800 dark:text-secondary-200">{att.score || 0}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider">{language === 'hi' ? 'अंक' : 'Score'}</p></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-secondary-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors flex-shrink-0">
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Results;