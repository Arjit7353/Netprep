import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopicAnalysis from '../components/result/TopicAnalysis';
import ResultComparison from '../components/result/ResultComparison';
import Button from '../components/common/Button';
import {
  Trophy, Target, Clock, CheckCircle, XCircle, MinusCircle,
  TrendingUp, BookOpen, ArrowLeft, ChevronRight, Eye,
  BarChart3, Brain, Timer, Award, RotateCcw,
  Printer, Zap, AlertTriangle, Flame, Languages
} from 'lucide-react';
import attemptService from '../services/attemptService';

const getStoredLang = () => { try { return localStorage.getItem('netprep_lang') || 'en'; } catch { return 'en'; } };

// Counter
const Counter = ({ end, suffix = '' }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    let s = 0;
    const n = typeof end === 'number' ? end : parseInt(end) || 0;
    const inc = Math.max(n / 50, 1);
    const iv = setInterval(() => {
      s += inc;
      if (s >= n) { setC(n); clearInterval(iv); } else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(iv);
  }, [end]);
  return <>{c}{suffix}</>;
};

// Score Circle
const ScoreCircle = ({ percentage, size = 170 }) => {
  const [val, setVal] = useState(0);
  const r = (size - 14) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const color = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#3B82F6' : percentage >= 40 ? '#F59E0B' : '#EF4444';
  useEffect(() => {
    const t = setTimeout(() => {
      let c = 0;
      const iv = setInterval(() => {
        c += 1.2;
        if (c >= percentage) { setVal(percentage); clearInterval(iv); } else setVal(Math.floor(c));
      }, 12);
      return () => clearInterval(iv);
    }, 400);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-xl">
        <defs>
          <linearGradient id="dtl-scoreG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <filter id="dtl-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-white/10" strokeWidth={12} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#dtl-scoreG)" strokeWidth={12} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          filter="url(#dtl-glow)" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{val}<span className="text-2xl">%</span></span>
      </div>
    </div>
  );
};

// Grade Badge — NO EMOJI, Lucide icons only
const GradeBadge = ({ percentage, language }) => {
  const cfg = percentage >= 90
    ? { grade: 'A+', text: language === 'hi' ? 'उत्कृष्ट!' : 'Outstanding!', gradient: 'from-emerald-400 to-green-500', icon: Trophy }
    : percentage >= 80
      ? { grade: 'A', text: language === 'hi' ? 'बहुत अच्छा!' : 'Excellent!', gradient: 'from-green-400 to-emerald-500', icon: Award }
      : percentage >= 70
        ? { grade: 'B+', text: language === 'hi' ? 'अच्छा' : 'Good', gradient: 'from-blue-400 to-cyan-500', icon: TrendingUp }
        : percentage >= 60
          ? { grade: 'B', text: language === 'hi' ? 'ठीक है' : 'Above Avg', gradient: 'from-cyan-400 to-blue-500', icon: Target }
          : percentage >= 40
            ? { grade: 'C', text: language === 'hi' ? 'सुधार करें' : 'Improve', gradient: 'from-amber-400 to-orange-500', icon: AlertTriangle }
            : { grade: 'F', text: language === 'hi' ? 'अभ्यास करें' : 'Practice', gradient: 'from-red-400 to-rose-500', icon: Flame };

  const IconComp = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${cfg.gradient} text-white shadow-lg backdrop-blur-sm border border-white/20 animate-bounce-in`}>
      <IconComp className="w-5 h-5" />
      <span className="text-2xl font-black">{cfg.grade}</span>
      <div className="h-5 w-px bg-white/30" />
      <span className="text-sm font-bold">{cfg.text}</span>
    </div>
  );
};

// Particles
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="absolute w-1 h-1 rounded-full bg-white/20"
        style={{ top: `${10 + i * 11}%`, left: `${5 + i * 12}%`, animation: `dtl-fp ${3.5 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />
    ))}
    <style>{`@keyframes dtl-fp{0%,100%{transform:translateY(0) scale(1);opacity:.1}50%{transform:translateY(-25px) scale(1.8);opacity:.35}}`}</style>
  </div>
);

const ResultDetail = ({ language: propLanguage = 'en', setLanguage: propSetLanguage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  // ═══ LANGUAGE STATE — works independently + syncs with parent ═══
  const [language, setLanguageState] = useState(() => propLanguage || getStoredLang());

  // Sync from parent prop
  useEffect(() => {
    if (propLanguage && propLanguage !== language) {
      setLanguageState(propLanguage);
    }
  }, [propLanguage]);

  // Listen for global language changes
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && (e.detail === 'hi' || e.detail === 'en') && e.detail !== language) {
        setLanguageState(e.detail);
      }
    };
    window.addEventListener('netprep-lang-change', handler);
    return () => window.removeEventListener('netprep-lang-change', handler);
  }, [language]);

  // Language change handler
  const handleLanguageChange = useCallback((newLang) => {
    if (newLang !== 'hi' && newLang !== 'en') return;
    setLanguageState(newLang);
    // Update parent if available
    if (propSetLanguage) propSetLanguage(newLang);
    // Persist
    try { localStorage.setItem('netprep_lang', newLang); } catch {}
    // Broadcast
    window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: newLang }));
  }, [propSetLanguage]);

  const toggleLanguage = useCallback(() => {
    handleLanguageChange(language === 'hi' ? 'en' : 'hi');
  }, [language, handleLanguageChange]);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aData, review] = await Promise.all([
        attemptService.getAttemptById(id),
        attemptService.getAttemptReview(id),
      ]);
      setAttempt(aData.data);
      setReviewData(review.data);
      const tid = review.data?.test?._id;
      if (tid) {
        try { const p = await attemptService.getAttempts({ testId: tid, limit: 20 }); setPreviousAttempts(p.data || []); }
        catch { setPreviousAttempts([]); }
      }
    } catch (e) { console.error('Load failed:', e); }
    finally { setLoading(false); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtTime = (s) => { if (!s) return '0m'; const m = Math.floor(s / 60), sec = s % 60; return `${m}m ${sec}s`; };
  const t = (en, hi) => language === 'hi' ? hi : en;

  if (loading) return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
        </div>
        <p className="text-gray-500 font-semibold animate-pulse">{t('Loading analysis...', 'विश्लेषण लोड हो रहा है...')}</p>
      </div>
    </Layout>
  );

  if (!attempt || !reviewData) return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-secondary-700 dark:to-secondary-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Trophy className="w-12 h-12 text-gray-300 dark:text-secondary-500" />
        </div>
        <p className="text-gray-600 dark:text-secondary-400 text-lg font-bold mb-1">{t('Result not found', 'परिणाम नहीं मिला')}</p>
        <p className="text-gray-400 text-sm mb-6">{t('This result is no longer available', 'यह परिणाम उपलब्ध नहीं है')}</p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/results')}>{t('Back', 'वापस')}</Button>
      </div>
    </Layout>
  );

  const pct = attempt.percentage || 0;
  const acc = attempt.accuracy || 0;

  // Insights — NO EMOJI, Lucide icons only
  const insights = [];
  if (acc >= 80) insights.push({ type: 'success', icon: Award, msg: t(`Brilliant! ${acc}% accuracy. Outstanding performance!`, `शानदार! ${acc}% सटीकता। उत्कृष्ट प्रदर्शन!`) });
  else if (acc >= 50) insights.push({ type: 'info', icon: TrendingUp, msg: t(`Good effort! ${acc}% accuracy. Room to improve.`, `अच्छा प्रयास! ${acc}% सटीकता। सुधार की गुंजाइश है।`) });
  else insights.push({ type: 'warn', icon: Brain, msg: t(`${acc}% accuracy. Focus on fundamentals.`, `${acc}% सटीकता। मूल अवधारणाओं पर ध्यान दें।`) });

  if (attempt.skippedCount > attempt.correctCount)
    insights.push({ type: 'warn', icon: MinusCircle, msg: t(`${attempt.skippedCount} skipped. Try all questions.`, `${attempt.skippedCount} छोड़े। सभी attempt करें।`) });

  if (attempt.wrongCount > attempt.correctCount && attempt.wrongCount > 0)
    insights.push({ type: 'error', icon: XCircle, msg: t(`Wrong (${attempt.wrongCount}) > Correct (${attempt.correctCount}). Watch negative marking.`, `गलत (${attempt.wrongCount}) > सही (${attempt.correctCount})। Negative marking का ध्यान रखें।`) });

  const iStyles = {
    success: 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    info: 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warn: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    error: 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  };

  return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <div className="space-y-6">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
          <Particles />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/results')} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium hidden sm:inline">{t('Back', 'वापस')}</span>
              </button>
              <div className="flex items-center gap-2">
                {/* LANGUAGE TOGGLE — FIXED */}
                <button onClick={toggleLanguage}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all text-white text-sm font-bold active:scale-95"
                  title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}>
                  <Languages className="w-4 h-4" />
                  <span>{language === 'hi' ? 'EN' : 'हि'}</span>
                </button>
                <button onClick={() => window.print()} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl scale-150" />
                <ScoreCircle percentage={pct} size={180} />
              </div>
              <div className="flex-1 text-center lg:text-left text-white">
                <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight tracking-tight">{reviewData.test.title}</h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-sm text-white/50 mb-5">
                  <span className="flex items-center gap-1.5 bg-white/8 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                    <Clock className="w-3.5 h-3.5" />{fmtDate(attempt.completedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/8 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                    <Timer className="w-3.5 h-3.5" />{fmtTime(attempt.totalTimeTaken)}
                  </span>
                  {attempt.attemptNumber > 1 && (
                    <span className="flex items-center gap-1.5 bg-white/12 px-3 py-1.5 rounded-full text-white/80 font-bold border border-white/10">
                      <RotateCcw className="w-3.5 h-3.5" />#{attempt.attemptNumber}
                    </span>
                  )}
                </div>
                <GradeBadge percentage={pct} language={language} />
              </div>

              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {[
                  { val: attempt.correctCount, label: t('Correct', 'सही'), color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/10' },
                  { val: attempt.wrongCount, label: t('Wrong', 'गलत'), color: 'text-red-300', bg: 'bg-red-500/15 border-red-500/10' },
                  { val: attempt.skippedCount, label: t('Skipped', 'छोड़ा'), color: 'text-yellow-300', bg: 'bg-yellow-500/15 border-yellow-500/10' },
                  { val: `${acc}%`, label: t('Accuracy', 'सटीकता'), color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/10' },
                ].map((m, i) => (
                  <div key={i} className={`${m.bg} backdrop-blur-md rounded-2xl p-4 text-center min-w-[105px] border`}>
                    <p className={`text-3xl font-black ${m.color}`}>
                      {typeof m.val === 'number' ? <Counter end={m.val} /> : m.val}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider font-bold">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-secondary-800 rounded-2xl shadow-xl shadow-gray-200/30 dark:shadow-none border border-gray-100 dark:border-secondary-700 p-4">
          <Button variant="gradient" icon={BookOpen} onClick={() => navigate(`/results/${id}/solutions`)}>
            {t('View Solutions', 'समाधान देखें')}
          </Button>
          <Button variant="outline" icon={RotateCcw} onClick={() => navigate(`/test/${reviewData.test._id}`)}>
            {t('Reattempt', 'पुनः प्रयास')}
          </Button>
          <Button variant="ghost" icon={Eye} onClick={() => navigate('/tests')}>
            {t('Other Tests', 'अन्य परीक्षा')}
          </Button>
        </div>

        {/* INSIGHTS */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-500" />{t('Smart Insights', 'स्मार्ट विश्लेषण')}
            </h3>
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-sm ${iStyles[ins.type]} animate-slide-up`}
                style={{ animationDelay: `${i * 100}ms` }}>
                <ins.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold leading-relaxed">{ins.msg}</p>
              </div>
            ))}
          </div>
        )}

        {/* TABS */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto p-1.5 bg-gray-50/80 dark:bg-secondary-900/50 border-b border-gray-100 dark:border-secondary-700 scrollbar-hide">
            {[
              { id: 'overview', label: t('Overview', 'अवलोकन'), icon: BarChart3 },
              { id: 'topics', label: t('Topic Analysis', 'विषय विश्लेषण'), icon: Target },
              ...(previousAttempts.length > 1 ? [{ id: 'comparison', label: t('Comparison', 'तुलना'), icon: TrendingUp }] : []),
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold whitespace-nowrap text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20 scale-[1.02]'
                    : 'text-gray-500 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700'
                }`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />{t('Performance Summary', 'प्रदर्शन सारांश')}
                </h3>
                <div className="space-y-5">
                  {[
                    { label: t('Accuracy', 'सटीकता'), val: acc, color: 'emerald', extra: `${attempt.correctCount}/${(attempt.correctCount || 0) + (attempt.wrongCount || 0)}` },
                    { label: t('Score', 'स्कोर'), val: pct, color: 'blue', extra: `${attempt.score}/${attempt.totalMarks}` },
                    { label: t('Attempt Rate', 'प्रयास दर'), val: Math.round(((attempt.correctCount || 0) + (attempt.wrongCount || 0)) / ((attempt.correctCount || 0) + (attempt.wrongCount || 0) + (attempt.skippedCount || 0)) * 100) || 0, color: 'purple', extra: '' },
                  ].map((bar, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700 dark:text-secondary-300 font-medium">{bar.label}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {bar.val}% {bar.extra && <span className="text-gray-400 text-xs ml-1">({bar.extra})</span>}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r from-${bar.color}-500 to-${bar.color}-600 rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${bar.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {[
                    { icon: CheckCircle, value: attempt.correctCount, label: t('Correct', 'सही'), gradient: 'from-emerald-500 to-green-600' },
                    { icon: XCircle, value: attempt.wrongCount, label: t('Wrong', 'गलत'), gradient: 'from-red-500 to-rose-600' },
                    { icon: MinusCircle, value: attempt.skippedCount, label: t('Skipped', 'छोड़ा'), gradient: 'from-amber-500 to-orange-600' },
                    { icon: Clock, value: fmtTime(attempt.totalTimeTaken), label: t('Time', 'समय'), gradient: 'from-blue-500 to-indigo-600' },
                  ].map((item, i) => (
                    <div key={i} className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 text-center group hover:shadow-xl transition-all hover:-translate-y-0.5">
                      <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-full opacity-[0.07] group-hover:opacity-[0.15] transition-opacity`} />
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-black text-gray-900 dark:text-white">
                        {typeof item.value === 'number' ? <Counter end={item.value} /> : item.value}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-wider">{item.label}</div>
                    </div>
                  ))}
                </div>

                <Button variant="gradient" fullWidth icon={BookOpen} size="lg" onClick={() => navigate(`/results/${id}/solutions`)} className="mt-4">
                  {t('View Detailed Solutions', 'विस्तृत समाधान देखें')}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            {activeTab === 'topics' && (
              <TopicAnalysis topicAnalysis={attempt.topicAnalysis} answers={attempt.answers}
                questions={reviewData.questions?.map(q => q.question) || []} language={language} />
            )}

            {activeTab === 'comparison' && (
              <ResultComparison attempts={previousAttempts} currentAttempt={attempt} language={language} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResultDetail;