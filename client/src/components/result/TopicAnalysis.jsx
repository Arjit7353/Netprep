import React from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Circle
} from 'lucide-react';

const TopicAnalysis = ({ topicAnalysis, language = 'en' }) => {
  const text = {
    topicWise: { en: 'Topic-wise Performance', hi: 'विषयवार प्रदर्शन' },
    topic: { en: 'Topic', hi: 'विषय' },
    total: { en: 'Total', hi: 'कुल' },
    correct: { en: 'Correct', hi: 'सही' },
    wrong: { en: 'Wrong', hi: 'गलत' },
    skipped: { en: 'Skipped', hi: 'छोड़े गए' },
    accuracy: { en: 'Accuracy', hi: 'सटीकता' },
    noData: { en: 'No topic analysis available', hi: 'कोई विषय विश्लेषण उपलब्ध नहीं' },
    excellent: { en: 'Excellent', hi: 'उत्कृष्ट' },
    good: { en: 'Good', hi: 'अच्छा' },
    needsWork: { en: 'Needs Work', hi: 'सुधार की आवश्यकता' },
    weak: { en: 'Weak', hi: 'कमजोर' }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-blue-600';
    if (accuracy >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyBg = (accuracy) => {
    if (accuracy >= 80) return 'bg-green-100';
    if (accuracy >= 60) return 'bg-blue-100';
    if (accuracy >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getAccuracyLabel = (accuracy) => {
    if (accuracy >= 80) return text.excellent[language];
    if (accuracy >= 60) return text.good[language];
    if (accuracy >= 40) return text.needsWork[language];
    return text.weak[language];
  };

  const getAccuracyIcon = (accuracy) => {
    if (accuracy >= 60) return <TrendingUp className="w-4 h-4" />;
    if (accuracy >= 40) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  if (!topicAnalysis || topicAnalysis.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{text.noData[language]}</p>
      </div>
    );
  }

  // Sort by accuracy (lowest first to show weak areas)
  const sortedTopics = [...topicAnalysis].sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">
          {text.topicWise[language]}
        </h3>
        <div className="text-sm text-gray-600">
          {topicAnalysis.length} topics analyzed
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">
                {text.topic[language]}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {text.total[language]}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {text.correct[language]}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {text.wrong[language]}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {text.skipped[language]}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {text.accuracy[language]}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.map((topic, index) => (
              <tr 
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{topic.unit}</div>
                  {topic.topic && (
                    <div className="text-sm text-gray-500 mt-0.5">{topic.topic}</div>
                  )}
                </td>
                <td className="text-center py-4 px-4">
                  <span className="font-bold text-gray-900">{topic.total}</span>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-bold">{topic.correct}</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="font-bold">{topic.wrong}</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Circle className="w-4 h-4" />
                    <span className="font-bold">{topic.skipped}</span>
                  </div>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`
                      px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5
                      ${getAccuracyBg(topic.accuracy)} ${getAccuracyColor(topic.accuracy)}
                    `}>
                      {getAccuracyIcon(topic.accuracy)}
                      {topic.accuracy}%
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {sortedTopics.map((topic, index) => (
          <div 
            key={index}
            className="card p-4 space-y-3"
          >
            {/* Topic Name */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{topic.unit}</h4>
                {topic.topic && (
                  <p className="text-sm text-gray-500 mt-0.5">{topic.topic}</p>
                )}
              </div>
              <div className={`
                px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 flex-shrink-0
                ${getAccuracyBg(topic.accuracy)} ${getAccuracyColor(topic.accuracy)}
              `}>
                {getAccuracyIcon(topic.accuracy)}
                {topic.accuracy}%
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">{text.total[language]}</div>
                <div className="font-bold text-gray-900">{topic.total}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">{text.correct[language]}</div>
                <div className="font-bold text-green-600">{topic.correct}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">{text.wrong[language]}</div>
                <div className="font-bold text-red-600">{topic.wrong}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">{text.skipped[language]}</div>
                <div className="font-bold text-gray-600">{topic.skipped}</div>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="pt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    topic.accuracy >= 80 ? 'bg-green-500' :
                    topic.accuracy >= 60 ? 'bg-blue-500' :
                    topic.accuracy >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${topic.accuracy}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="card p-6 bg-gradient-to-br from-primary-50 to-purple-50">
        <h4 className="font-bold text-gray-900 mb-4">Performance Summary</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Strong Topics</div>
            <div className="text-2xl font-bold text-green-600">
              {sortedTopics.filter(t => t.accuracy >= 80).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Good Topics</div>
            <div className="text-2xl font-bold text-blue-600">
              {sortedTopics.filter(t => t.accuracy >= 60 && t.accuracy < 80).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Need Practice</div>
            <div className="text-2xl font-bold text-yellow-600">
              {sortedTopics.filter(t => t.accuracy >= 40 && t.accuracy < 60).length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Weak Topics</div>
            <div className="text-2xl font-bold text-red-600">
              {sortedTopics.filter(t => t.accuracy < 40).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicAnalysis;