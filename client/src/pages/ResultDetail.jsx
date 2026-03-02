import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TopicAnalysis from '../components/result/TopicAnalysis';
import ResultComparison from '../components/result/ResultComparison';
import {
  Trophy, Target, Clock, CheckCircle, XCircle, MinusCircle,
  TrendingUp, BookOpen, ArrowLeft, ChevronRight, Eye,
} from 'lucide-react';
import attemptService from '../services/attemptService';

const ResultDetail = ({ language = 'en', setLanguage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Failed to load attempt details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const getScoreColor = (p) => (p >= 80 ? 'text-green-600' : p >= 60 ? 'text-blue-600' : p >= 40 ? 'text-yellow-600' : 'text-red-600');

  const t = {
    back: { en: 'Back to Results', hi: 'वापस' },
    score: { en: 'Score', hi: 'स्कोर' },
    accuracy: { en: 'Accuracy', hi: 'सटीकता' },
    timeTaken: { en: 'Time Taken', hi: 'समय' },
    correct: { en: 'Correct', hi: 'सही' },
    wrong: { en: 'Wrong', hi: 'गलत' },
    skipped: { en: 'Skipped', hi: 'छोड़े गए' },
    overview: { en: 'Overview', hi: 'अवलोकन' },
    solutions: { en: 'Solutions', hi: 'समाधान' },
    topicWise: { en: 'Topic Analysis', hi: 'विषय विश्लेषण' },
    comparison: { en: 'Comparison', hi: 'तुलना' },
    reattempt: { en: 'Reattempt Test', hi: 'पुनः प्रयास' },
    viewSolutions: { en: 'View Detailed Solutions', hi: 'विस्तृत समाधान देखें' },
    performance: { en: 'Performance Summary', hi: 'प्रदर्शन सारांश' },
  };

  if (loading) {
    return (
      <Layout language={language} setLanguage={setLanguage}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!attempt || !reviewData) {
    return (
      <Layout language={language} setLanguage={setLanguage}>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-secondary-400">Result not found</p>
          <button onClick={() => navigate('/results')} className="btn-primary mt-4 px-6 py-2">{t.back[language]}</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/results')} className="btn-secondary px-3 py-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{reviewData.test.title}</h1>
            <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{formatDate(attempt.completedAt)}</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="card p-8 text-center bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-purple-50 dark:to-purple-900/20 border-2 border-primary-200 dark:border-primary-800">
          <Trophy className={`w-14 h-14 mx-auto mb-3 ${getScoreColor(attempt.percentage)}`} />
          <div className={`text-5xl font-bold mb-2 ${getScoreColor(attempt.percentage)}`}>{attempt.percentage}%</div>
          <div className="text-gray-600 dark:text-secondary-400">{t.score[language]}: {attempt.score}/{attempt.totalMarks}</div>
          <div className="text-sm text-gray-500 dark:text-secondary-500">{t.accuracy[language]}: {attempt.accuracy}%</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CheckCircle, value: attempt.correctCount, label: t.correct[language], color: 'green' },
            { icon: XCircle, value: attempt.wrongCount, label: t.wrong[language], color: 'red' },
            { icon: MinusCircle, value: attempt.skippedCount, label: t.skipped[language], color: 'gray' },
            { icon: Clock, value: formatTime(attempt.totalTimeTaken), label: t.timeTaken[language], color: 'blue' },
          ].map((item, i) => (
            <div key={i} className="card p-5 text-center">
              <div className={`w-11 h-11 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-full flex items-center justify-center mx-auto mb-2`}>
                <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</div>
              <div className="text-xs text-gray-600 dark:text-secondary-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* ★ View Solutions Button — PRIMARY ACTION ★ */}
        <button
          onClick={() => navigate(`/results/${id}/solutions`)}
          className="w-full btn-primary px-6 py-4 text-base font-semibold justify-center gap-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <BookOpen className="w-5 h-5" />
          {t.viewSolutions[language]}
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200 dark:border-secondary-700">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: t.overview[language], icon: TrendingUp },
                { id: 'topics', label: t.topicWise[language], icon: Target },
                { id: 'comparison', label: t.comparison[language], icon: ChevronRight },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-secondary-400 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.performance[language]}</h3>
                <div className="space-y-4">
                  {[
                    { label: t.accuracy[language], val: attempt.accuracy, color: 'green' },
                    { label: t.score[language], val: attempt.percentage, color: 'blue', extra: `${attempt.score}/${attempt.totalMarks}` },
                  ].map((bar, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700 dark:text-secondary-300">{bar.label}</span>
                        <span className="font-bold text-gray-900 dark:text-white">{bar.extra || `${bar.val}%`}</span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r from-${bar.color}-500 to-${bar.color}-600 rounded-full`} style={{ width: `${bar.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate(`/test/${reviewData.test._id}`)} className="btn-primary w-full px-6 py-3 mt-4">
                  {t.reattempt[language]}
                </button>
              </div>
            )}
            {activeTab === 'topics' && <TopicAnalysis topicAnalysis={attempt.topicAnalysis} language={language} />}
            {activeTab === 'comparison' && <ResultComparison testId={reviewData.test._id} currentAttemptId={attempt._id} language={language} />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResultDetail;