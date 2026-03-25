import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopicAnalysis from '../components/result/TopicAnalysis';
import ResultComparison from '../components/result/ResultComparison';
import {
  Trophy, Target, Clock, CheckCircle, XCircle, MinusCircle,
  TrendingUp, BookOpen, ArrowLeft, ChevronRight, Eye,
  Sparkles, Share2, Printer, BarChart3, Brain, Timer,
  Hash, Award, Flame, Download
} from 'lucide-react';
import Button from '../components/common/Button';
import attemptService from '../services/attemptService';

// ─── Animated Counter ───
const Counter = ({ end, suffix = '' }) => {
  const [c, setC] = useState(0);
  useEffect(() => {
    let s = 0;
    const inc = Math.max(end / 50, 1);
    const iv = setInterval(() => {
      s += inc;
      if (s >= end) { setC(end); clearInterval(iv); } else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(iv);
  }, [end]);
  return <>{c}{suffix}</>;
};

// ─── Score Circle ───
const ScoreCircle = ({ percentage, size = 160 }) => {
  const [val, setVal] = useState(0);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const color = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#3B82F6' : percentage >= 40 ? '#F59E0B' : '#EF4444';

  useEffect(() => {
    const t = setTimeout(() => {
      let c = 0;
      const iv = setInterval(() => {
        c += 1.5;
        if (c >= percentage) { setVal(percentage); clearInterval(iv); } else setVal(Math.floor(c));
      }, 12);
      return () => clearInterval(iv);
    }, 300);
    return () => clearTimeout(t);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="currentColor" className="text-gray-200 dark:text-secondary-700" strokeWidth={10} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="url(#scoreGrad)" strokeWidth={10} fill="none" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-gray-900 dark:text-white">{val}<span className="text-xl">%</span></span>
      </div>
    </div>
  );
};

// ─── Grade Badge ───
const GradeBadge = ({ percentage, language }) => {
  const cfg = percentage >= 90
    ? { grade: 'A+', text: language === 'hi' ? 'उत्कृष्ट!' : 'Outstanding!', gradient: 'from-emerald-500 to-green-600' }
    : percentage >= 80 ? { grade: 'A', text: language === 'hi' ? 'बहुत अच्छा!' : 'Excellent!', gradient: 'from-green-500 to-emerald-600' }
    : percentage >= 70 ? { grade: 'B+', text: language === 'hi' ? 'अच्छा' : 'Good', gradient: 'from-blue-500 to-cyan-600' }
    : percentage >= 60 ? { grade: 'B', text: language === 'hi' ? 'ठीक है' : 'Above Average', gradient: 'from-cyan-500 to-blue-600' }
    : percentage >= 40 ? { grade: 'C', text: language === 'hi' ? 'सुधार करें' : 'Improve', gradient: 'from-amber-500 to-orange-600' }
    : { grade: 'F', text: language === 'hi' ? 'अभ्यास करें' : 'Practice More', gradient: 'from-red-500 to-rose-600' };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${cfg.gradient} text-white shadow-lg animate-bounce-in`}>
      <span className="text-xl font-black">{cfg.grade}</span>
      <div className="h-5 w-px bg-white/30" />
      <span className="text-sm font-semibold">{cfg.text}</span>
    </div>
  );
};

const ResultDetail = ({ language = 'en', setLanguage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  useEffect(() => { loadAttemptDetails(); }, [id]);

  const loadAttemptDetails = async () => {
    setLoading(true);
    try {
      const [attemptData, review] = await Promise.all([
        attemptService.getAttemptById(id),
        attemptService.getAttemptReview(id),
      ]);
      setAttempt(attemptData.data);
      setReviewData(review.data);

      // Load previous attempts for comparison
      const testId = review.data?.test?._id;
      if (testId) {
        try {
          const prevRes = await attemptService.getAttempts({ testId, limit: 20 });
          setPreviousAttempts(prevRes.data || []);
        } catch { setPreviousAttempts([]); }
      }
    } catch (error) {
      console.error('Failed to load attempt details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatTime = (s) => {
    if (!s) return '0m 0s';
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const t = {
    back: { en: 'Back to Results', hi: 'वापस' },
    overview: { en: 'Overview', hi: 'अवलोकन' },
    topicWise: { en: 'Topic Analysis', hi: 'विषय विश्लेषण' },
    comparison: { en: 'Comparison', hi: 'तुलना' },
    reattempt: { en: 'Reattempt Test', hi: 'पुनः प्रयास' },
    viewSolutions: { en: 'View Detailed Solutions', hi: 'विस्तृत समाधान देखें' },
    performance: { en: 'Performance Summary', hi: 'प्रदर्शन सारांश' },
    insights: { en: 'Smart Insights', hi: 'स्मार्ट विश्लेषण' },
  };

  if (loading) {
    return (
      <Layout language={language} setLanguage={setLanguage}>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
          </div>
          <p className="text-gray-500 dark:text-secondary-400 font-semibold">
            {language === 'hi' ? 'विश्लेषण लोड हो रहा है...' : 'Loading analysis...'}
          </p>
        </div>
      </Layout>
    );
  }

  if (!attempt || !reviewData) {
    return (
      <Layout language={language} setLanguage={setLanguage}>
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-600 dark:text-secondary-400 text-lg font-medium mb-1">
            {language === 'hi' ? 'परिणाम नहीं मिला' : 'Result not found'}
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {language === 'hi' ? 'यह परिणाम उपलब्ध नहीं है' : 'This result is no longer available'}
          </p>
          <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/results')}>
            {t.back[language]}
          </Button>
        </div>
      </Layout>
    );
  }

  const pct = attempt.percentage || 0;
  const acc = attempt.accuracy || 0;

  // Smart Insights
  const insights = [];
  if (acc >= 80) insights.push({ type: 'success', icon: Award, msg: language === 'hi' ? `शानदार! ${acc}% सटीकता - आप बहुत अच्छा कर रहे हैं!` : `Brilliant! ${acc}% accuracy - you're doing great!` });
  else if (acc >= 50) insights.push({ type: 'info', icon: TrendingUp, msg: language === 'hi' ? `अच्छा प्रयास! ${acc}% सटीकता। और सुधार संभव है।` : `Good effort! ${acc}% accuracy. Room to improve.` });
  else insights.push({ type: 'warn', icon: Brain, msg: language === 'hi' ? `${acc}% सटीकता। मूल अवधारणाओं पर ध्यान दें।` : `${acc}% accuracy. Focus on fundamentals.` });

  if (attempt.skippedCount > attempt.correctCount) {
    insights.push({ type: 'warn', icon: MinusCircle, msg: language === 'hi' ? `${attempt.skippedCount} प्रश्न छोड़े गए। सभी attempt करने का प्रयास करें।` : `${attempt.skippedCount} questions skipped. Try attempting all.` });
  }
  if (attempt.wrongCount > attempt.correctCount && attempt.wrongCount > 0) {
    insights.push({ type: 'error', icon: XCircle, msg: language === 'hi' ? `गलत (${attempt.wrongCount}) > सही (${attempt.correctCount})। Negative marking का ध्यान रखें।` : `Wrong (${attempt.wrongCount}) > Correct (${attempt.correctCount}). Watch negative marking.` });
  }

  const insightStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    warn: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  };

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <div className="space-y-6">

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700 rounded-3xl">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative p-6 sm:p-8">
            {/* Top Row */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/results')} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">{t.back[language]}</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all" title="Print">
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Score Circle */}
              <div className="flex-shrink-0">
                <ScoreCircle percentage={pct} size={170} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center lg:text-left text-white">
                <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">
                  {reviewData.test.title}
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm text-white/60 mb-5">
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" />{formatDate(attempt.completedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                    <Timer className="w-3.5 h-3.5" />{formatTime(attempt.totalTimeTaken)}
                  </span>
                  {attempt.attemptNumber > 1 && (
                    <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-white/80 font-medium">
                      <RotateCcw className="w-3.5 h-3.5" />#{attempt.attemptNumber}
                    </span>
                  )}
                </div>
                <GradeBadge percentage={pct} language={language} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {[
                  { val: attempt.correctCount, label: language === 'hi' ? 'सही' : 'Correct', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
                  { val: attempt.wrongCount, label: language === 'hi' ? 'गलत' : 'Wrong', color: 'text-red-300', bg: 'bg-red-500/20' },
                  { val: attempt.skippedCount, label: language === 'hi' ? 'छोड़ा' : 'Skipped', color: 'text-yellow-300', bg: 'bg-yellow-500/20' },
                  { val: `${acc}%`, label: language === 'hi' ? 'सटीकता' : 'Accuracy', color: 'text-blue-300', bg: 'bg-blue-500/20' },
                ].map((m, i) => (
                  <div key={i} className={`${m.bg} backdrop-blur-sm rounded-2xl p-4 text-center min-w-[100px] border border-white/5`}>
                    <p className={`text-2xl font-black ${m.color}`}>
                      {typeof m.val === 'number' ? <Counter end={m.val} /> : m.val}
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider font-semibold">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ ACTION BAR ═══════ */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-secondary-800 rounded-2xl shadow-lg border border-gray-100 dark:border-secondary-700 p-4">
          <Button variant="gradient" icon={BookOpen} onClick={() => navigate(`/results/${id}/solutions`)} className="shadow-lg shadow-primary-500/20">
            {t.viewSolutions[language]}
          </Button>
          <Button variant="outline" icon={RotateCcw} onClick={() => navigate(`/test/${reviewData.test._id}`)}>
            {t.reattempt[language]}
          </Button>
          <Button variant="ghost" icon={Eye} onClick={() => navigate('/tests')}>
            {language === 'hi' ? 'अन्य परीक्षा' : 'Other Tests'}
          </Button>
        </div>

        {/* ═══════ SMART INSIGHTS ═══════ */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-500" />
              {t.insights[language]}
            </h3>
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${insightStyles[ins.type]} animate-fade-in`} style={{ animationDelay: `${i * 100}ms` }}>
                <ins.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">{ins.msg}</p>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TABS ═══════ */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-secondary-700 p-1.5 bg-gray-50 dark:bg-secondary-900/50 scrollbar-hide">
            {[
              { id: 'overview', label: t.overview[language], icon: BarChart3 },
              { id: 'topics', label: t.topicWise[language], icon: Target },
              ...(previousAttempts.length > 1 ? [{ id: 'comparison', label: t.comparison[language], icon: TrendingUp }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-gray-500 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" />
                  {t.performance[language]}
                </h3>

                {/* Performance Bars */}
                <div className="space-y-5">
                  {[
                    { label: language === 'hi' ? 'सटीकता' : 'Accuracy', val: acc, color: 'emerald', extra: `${attempt.correctCount}/${(attempt.correctCount||0)+(attempt.wrongCount||0)}` },
                    { label: language === 'hi' ? 'स्कोर' : 'Score', val: pct, color: 'blue', extra: `${attempt.score}/${attempt.totalMarks}` },
                    { label: language === 'hi' ? 'प्रयास दर' : 'Attempt Rate', val: Math.round(((attempt.correctCount||0) + (attempt.wrongCount||0)) / ((attempt.correctCount||0) + (attempt.wrongCount||0) + (attempt.skippedCount||0)) * 100) || 0, color: 'purple', extra: '' },
                  ].map((bar, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700 dark:text-secondary-300 font-medium">{bar.label}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {bar.val}% {bar.extra && <span className="text-gray-400 text-xs ml-1">({bar.extra})</span>}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-${bar.color}-500 to-${bar.color}-600 rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${bar.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  {[
                    { icon: CheckCircle, value: attempt.correctCount, label: language === 'hi' ? 'सही उत्तर' : 'Correct', gradient: 'from-emerald-500 to-green-600' },
                    { icon: XCircle, value: attempt.wrongCount, label: language === 'hi' ? 'गलत उत्तर' : 'Wrong', gradient: 'from-red-500 to-rose-600' },
                    { icon: MinusCircle, value: attempt.skippedCount, label: language === 'hi' ? 'छोड़ा गया' : 'Skipped', gradient: 'from-amber-500 to-orange-600' },
                    { icon: Clock, value: formatTime(attempt.totalTimeTaken), label: language === 'hi' ? 'कुल समय' : 'Total Time', gradient: 'from-blue-500 to-indigo-600' },
                  ].map((item, i) => (
                    <div key={i} className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 text-center group hover:shadow-lg transition-all">
                      <div className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-black text-gray-900 dark:text-white">
                        {typeof item.value === 'number' ? <Counter end={item.value} /> : item.value}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-secondary-400 mt-1 font-medium">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'topics' && (
              <TopicAnalysis
                topicAnalysis={attempt.topicAnalysis}
                answers={attempt.answers}
                questions={reviewData.questions?.map(q => q.question) || []}
                language={language}
              />
            )}

            {activeTab === 'comparison' && (
              <ResultComparison
                attempts={previousAttempts}
                currentAttempt={attempt}
                testId={reviewData.test._id}
                language={language}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResultDetail;