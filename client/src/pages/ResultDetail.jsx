import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import SolutionView from '../components/result/SolutionView';
import TopicAnalysis from '../components/result/TopicAnalysis';
import ResultComparison from '../components/result/ResultComparison';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  TrendingUp,
  BookOpen,
  Download,
  Share2,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import attemptService from '../services/attemptService';

const ResultDetail = ({ language = 'en', setLanguage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview | solutions | topics | comparison
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttemptDetails();
  }, [id]);

  const loadAttemptDetails = async () => {
    setLoading(true);
    try {
      const [attemptData, review] = await Promise.all([
        attemptService.getAttemptById(id),
        attemptService.getAttemptReview(id)
      ]);
      
      setAttempt(attemptData.data);
      setReviewData(review.data);
    } catch (error) {
      console.error('Failed to load attempt details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const text = {
    back: { en: 'Back to Results', hi: 'परिणाम पर वापस' },
    testResult: { en: 'Test Result', hi: 'परीक्षा परिणाम' },
    score: { en: 'Score', hi: 'स्कोर' },
    accuracy: { en: 'Accuracy', hi: 'सटीकता' },
    timeTaken: { en: 'Time Taken', hi: 'लिया गया समय' },
    avgTime: { en: 'Avg per Question', hi: 'प्रति प्रश्न औसत' },
    correct: { en: 'Correct', hi: 'सही' },
    wrong: { en: 'Wrong', hi: 'गलत' },
    skipped: { en: 'Skipped', hi: 'छोड़े गए' },
    markedReview: { en: 'Marked for Review', hi: 'समीक्षा के लिए चिह्नित' },
    overview: { en: 'Overview', hi: 'अवलोकन' },
    solutions: { en: 'Solutions', hi: 'समाधान' },
    topicWise: { en: 'Topic Analysis', hi: 'विषयवार विश्लेषण' },
    comparison: { en: 'Comparison', hi: 'तुलना' },
    reattempt: { en: 'Reattempt Test', hi: 'पुनः प्रयास' },
    downloadReport: { en: 'Download Report', hi: 'रिपोर्ट डाउनलोड करें' },
    share: { en: 'Share', hi: 'साझा करें' },
    performance: { en: 'Performance Summary', hi: 'प्रदर्शन सारांश' }
  };

  if (loading) {
    return (
      <Layout language={language} setLanguage={setLanguage}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!attempt || !reviewData) {
    return (
      <Layout language={language} setLanguage={setLanguage}>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-secondary-400">Result not found</p>
          <button onClick={() => navigate('/results')} className="btn-primary mt-4 px-6 py-2">
            {text.back[language]}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/results')}
            className="btn-secondary px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {reviewData.test.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">
              {formatDate(attempt.completedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary px-4 py-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{text.downloadReport[language]}</span>
            </button>
            <button className="btn-secondary px-4 py-2">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{text.share[language]}</span>
            </button>
          </div>
        </div>

        {/* Score Card */}
        <div className="card p-8 text-center bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-purple-50 dark:to-purple-900/20 border-2 border-primary-200 dark:border-primary-800">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(attempt.percentage)}`} />
          <div className={`text-5xl font-bold mb-2 ${getScoreColor(attempt.percentage)}`}>
            {attempt.percentage}%
          </div>
          <div className="text-gray-600 dark:text-secondary-400 mb-1">
            {text.score[language]}: {attempt.score}/{attempt.totalMarks}
          </div>
          <div className="text-sm text-gray-500 dark:text-secondary-500">
            {text.accuracy[language]}: {attempt.accuracy}%
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Correct */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{attempt.correctCount}</div>
            <div className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{text.correct[language]}</div>
          </div>

          {/* Wrong */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{attempt.wrongCount}</div>
            <div className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{text.wrong[language]}</div>
          </div>

          {/* Skipped */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <MinusCircle className="w-6 h-6 text-gray-600 dark:text-secondary-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{attempt.skippedCount}</div>
            <div className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{text.skipped[language]}</div>
          </div>

          {/* Time */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(attempt.totalTimeTaken)}
            </div>
            <div className="text-sm text-gray-600 dark:text-secondary-400 mt-1">{text.timeTaken[language]}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200 dark:border-secondary-700">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: text.overview[language], icon: TrendingUp },
                { id: 'solutions', label: text.solutions[language], icon: BookOpen },
                { id: 'topics', label: text.topicWise[language], icon: Target },
                { id: 'comparison', label: text.comparison[language], icon: ChevronRight }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-secondary-400 hover:text-gray-900 dark:hover:text-secondary-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {text.performance[language]}
                </h3>
                
                {/* Performance Bars */}
                <div className="space-y-4">
                  {/* Accuracy Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-secondary-300">{text.accuracy[language]}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{attempt.accuracy}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: `${attempt.accuracy}%` }}
                      />
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-secondary-300">{text.score[language]}</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {attempt.score}/{attempt.totalMarks}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{ width: `${attempt.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reattempt Button */}
                <button
                  onClick={() => navigate(`/test/${reviewData.test._id}`)}
                  className="btn-primary w-full px-6 py-3 mt-6"
                >
                  {text.reattempt[language]}
                </button>
              </div>
            )}

            {activeTab === 'solutions' && (
              <SolutionView 
                questions={reviewData.questions}
                language={language}
              />
            )}

            {activeTab === 'topics' && (
              <TopicAnalysis 
                topicAnalysis={attempt.topicAnalysis}
                language={language}
              />
            )}

            {activeTab === 'comparison' && (
              <ResultComparison 
                testId={reviewData.test._id}
                currentAttemptId={attempt._id}
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