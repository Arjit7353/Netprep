import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import attemptService from '../../services/attemptService';

const ResultComparison = ({ testId, currentAttemptId, language = 'en' }) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttemptHistory();
  }, [testId]);

  const loadAttemptHistory = async () => {
    setLoading(true);
    try {
      const response = await attemptService.getAttempts({ testId, status: 'completed' });
      setAttempts(response.data || []);
    } catch (error) {
      console.error('Failed to load attempt history:', error);
    } finally {
      setLoading(false);
    }
  };

  const text = {
    comparison: { en: 'Attempt Comparison', hi: 'प्रयास तुलना' },
    attemptNumber: { en: 'Attempt', hi: 'प्रयास' },
    score: { en: 'Score', hi: 'स्कोर' },
    accuracy: { en: 'Accuracy', hi: 'सटीकता' },
    timeTaken: { en: 'Time Taken', hi: 'लिया गया समय' },
    improvement: { en: 'Improvement', hi: 'सुधार' },
    decline: { en: 'Decline', hi: 'गिरावट' },
    noChange: { en: 'No Change', hi: 'कोई परिवर्तन नहीं' },
    progressChart: { en: 'Progress Chart', hi: 'प्रगति चार्ट' },
    noHistory: { en: 'No previous attempts to compare', hi: 'तुलना के लिए कोई पिछला प्रयास नहीं' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (attempts.length <= 1) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{text.noHistory[language]}</p>
      </div>
    );
  }

  // Sort attempts by date
  const sortedAttempts = [...attempts].sort((a, b) => 
    new Date(a.completedAt) - new Date(b.completedAt)
  );

  // Current attempt
  const currentAttempt = sortedAttempts.find(a => a._id === currentAttemptId);
  const currentIndex = sortedAttempts.findIndex(a => a._id === currentAttemptId);
  const previousAttempt = currentIndex > 0 ? sortedAttempts[currentIndex - 1] : null;

  // Calculate improvement
  const calculateImprovement = (current, previous, field) => {
    if (!previous) return null;
    const diff = current[field] - previous[field];
    return {
      value: diff,
      percentage: previous[field] !== 0 ? ((diff / previous[field]) * 100).toFixed(1) : 0,
      isPositive: diff > 0,
      isNegative: diff < 0
    };
  };

  const scoreImprovement = calculateImprovement(currentAttempt, previousAttempt, 'percentage');
  const accuracyImprovement = calculateImprovement(currentAttempt, previousAttempt, 'accuracy');

  // Chart data
  const chartData = sortedAttempts.map((attempt, index) => ({
    name: `${text.attemptNumber[language]} ${index + 1}`,
    score: attempt.percentage,
    accuracy: attempt.accuracy,
    date: new Date(attempt.completedAt).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short' 
    })
  }));

  return (
    <div className="space-y-6">
      {/* Comparison with Previous Attempt */}
      {previousAttempt && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {text.improvement[language]}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Comparison */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">{text.score[language]}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currentAttempt.percentage}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Previous: {previousAttempt.percentage}%
                  </div>
                </div>
                {scoreImprovement && (
                  <div className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-full font-bold
                    ${scoreImprovement.isPositive ? 'bg-green-100 text-green-700' : 
                      scoreImprovement.isNegative ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'}
                  `}>
                    {scoreImprovement.isPositive && <TrendingUp className="w-4 h-4" />}
                    {scoreImprovement.isNegative && <TrendingDown className="w-4 h-4" />}
                    {!scoreImprovement.isPositive && !scoreImprovement.isNegative && <Minus className="w-4 h-4" />}
                    <span>{scoreImprovement.value > 0 ? '+' : ''}{scoreImprovement.value.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Accuracy Comparison */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">{text.accuracy[language]}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currentAttempt.accuracy}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Previous: {previousAttempt.accuracy}%
                  </div>
                </div>
                {accuracyImprovement && (
                  <div className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-full font-bold
                    ${accuracyImprovement.isPositive ? 'bg-green-100 text-green-700' : 
                      accuracyImprovement.isNegative ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'}
                  `}>
                    {accuracyImprovement.isPositive && <TrendingUp className="w-4 h-4" />}
                    {accuracyImprovement.isNegative && <TrendingDown className="w-4 h-4" />}
                    {!accuracyImprovement.isPositive && !accuracyImprovement.isNegative && <Minus className="w-4 h-4" />}
                    <span>{accuracyImprovement.value > 0 ? '+' : ''}{accuracyImprovement.value.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">
          {text.progressChart[language]}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name={text.score[language] + ' (%)'}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#10b981" 
              strokeWidth={2}
              name={text.accuracy[language] + ' (%)'}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All Attempts Table */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          All Attempts History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{text.score[language]}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">{text.accuracy[language]}</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedAttempts.map((attempt, index) => (
                <tr 
                  key={attempt._id}
                  className={`
                    border-b border-gray-100
                    ${attempt._id === currentAttemptId ? 'bg-primary-50' : 'hover:bg-gray-50'}
                  `}
                >
                  <td className="py-3 px-4 font-medium">
                    {index + 1}
                    {attempt._id === currentAttemptId && (
                      <span className="ml-2 text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold">{attempt.percentage}%</td>
                  <td className="py-3 px-4">{attempt.accuracy}%</td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(attempt.completedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultComparison;