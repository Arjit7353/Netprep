import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Eye,
  TrendingUp,
  Target,
  Award,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import attemptService from '../services/attemptService';

const Results = ({ language = 'en', setLanguage }) => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | completed | recent

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attemptsData, statsData] = await Promise.all([
        attemptService.getAttempts({ 
          status: filter === 'completed' ? 'completed' : undefined,
          limit: filter === 'recent' ? 10 : 50
        }),
        attemptService.getStats()
      ]);

      setAttempts(attemptsData.data || []);
      setStats(statsData.data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

  const getScoreBg = (percentage) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const text = {
    title: { en: 'Test Results', hi: 'परीक्षा परिणाम' },
    subtitle: { en: 'View all your test attempts and performance', hi: 'अपने सभी परीक्षा प्रयास और प्रदर्शन देखें' },
    stats: { en: 'Overall Statistics', hi: 'समग्र आंकड़े' },
    totalAttempts: { en: 'Total Attempts', hi: 'कुल प्रयास' },
    avgScore: { en: 'Average Score', hi: 'औसत स्कोर' },
    avgAccuracy: { en: 'Average Accuracy', hi: 'औसत सटीकता' },
    bestPerformance: { en: 'Best Performance', hi: 'सर्वश्रेष्ठ प्रदर्शन' },
    recentAttempts: { en: 'Recent Attempts', hi: 'हाल के प्रयास' },
    viewDetails: { en: 'View Details', hi: 'विवरण देखें' },
    reattempt: { en: 'Reattempt', hi: 'पुनः प्रयास' },
    score: { en: 'Score', hi: 'अंक' },
    accuracy: { en: 'Accuracy', hi: 'सटीकता' },
    timeTaken: { en: 'Time Taken', hi: 'लिया गया समय' },
    correct: { en: 'Correct', hi: 'सही' },
    wrong: { en: 'Wrong', hi: 'गलत' },
    skipped: { en: 'Skipped', hi: 'छोड़े गए' },
    noAttempts: { en: 'No test attempts yet', hi: 'अभी तक कोई परीक्षा प्रयास नहीं' },
    startTest: { en: 'Start a Test', hi: 'परीक्षा शुरू करें' }
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

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              {text.title[language]}
            </h1>
            <p className="text-gray-600 dark:text-secondary-400 mt-1">
              {text.subtitle[language]}
            </p>
          </div>
          <button
            onClick={loadData}
            className="btn-secondary px-4 py-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Attempts */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAttempts}
              </h3>
              <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">
                {text.totalAttempts[language]}
              </p>
            </div>

            {/* Average Score */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.averageScore)}%
              </h3>
              <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">
                {text.avgScore[language]}
              </p>
            </div>

            {/* Average Accuracy */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.averageAccuracy)}%
              </h3>
              <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1">
                {text.avgAccuracy[language]}
              </p>
            </div>

            {/* Best Performance */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.bestAttempt?.percentage || 0}%
              </h3>
              <p className="text-sm text-gray-600 dark:text-secondary-400 mt-1 truncate">
                {stats.bestAttempt?.testTitle || text.bestPerformance[language]}
              </p>
            </div>
          </div>
        )}

        {/* Attempts List */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {text.recentAttempts[language]}
            </h2>
            
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input text-sm w-auto"
            >
              <option value="all">All Attempts</option>
              <option value="completed">Completed Only</option>
              <option value="recent">Recent (10)</option>
            </select>
          </div>

          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-secondary-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {text.noAttempts[language]}
              </h3>
              <button
                onClick={() => navigate('/tests')}
                className="btn-primary px-6 py-2 mt-4"
              >
                {text.startTest[language]}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div
                  key={attempt._id}
                  className={`
                    border-2 rounded-lg p-4 transition-all
                    ${getScoreBg(attempt.percentage)} dark:bg-secondary-700 dark:border-secondary-600
                    hover:shadow-md dark:hover:shadow-lg
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Test Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        {attempt.testId?.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-secondary-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(attempt.completedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(attempt.totalTimeTaken)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Score */}
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(attempt.percentage)}`}>
                        {attempt.percentage}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-secondary-400">
                        {attempt.score}/{attempt.totalMarks}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-secondary-600">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-bold">{attempt.correctCount}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-secondary-400">{text.correct[language]}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 mb-1">
                        <XCircle className="w-4 h-4" />
                        <span className="font-bold">{attempt.wrongCount}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-secondary-400">{text.wrong[language]}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600 dark:text-secondary-400 mb-1">
                        <MinusCircle className="w-4 h-4" />
                        <span className="font-bold">{attempt.skippedCount}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-secondary-400">{text.skipped[language]}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => navigate(`/results/${attempt._id}`)}
                      className="btn-primary flex-1 px-4 py-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{text.viewDetails[language]}</span>
                    </button>
                    <button
                      onClick={() => navigate(`/test/${attempt.testId._id}`)}
                      className="btn-secondary flex-1 px-4 py-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{text.reattempt[language]}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Results;