// client/src/components/test/TestCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  FileText, 
  Play, 
  BarChart3, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  MoreVertical,
  BookOpen,
  Layers,
  Tag
} from 'lucide-react';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

// Helper functions
const parseUnitString = (unitStr) => {
  if (!unitStr || typeof unitStr !== 'string') return [];
  return unitStr.split(',').map(u => u.trim()).filter(u => u.length > 0);
};

const parseChapterString = (chapterStr) => {
  if (!chapterStr || typeof chapterStr !== 'string') return [];
  return chapterStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
};

const parseTopicString = (topicStr) => {
  if (!topicStr || typeof topicStr !== 'string') return [];
  return topicStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
};

const getUnitShortName = (unitName) => {
  if (!unitName) return '';
  return unitName.replace(/^(UNIT|इकाई)\s*[IVXLCDM\d]+:\s*/i, '').trim();
};

const extractFromTitle = (title) => {
  if (!title) return { units: [], chapters: [], topics: [] };
  
  const result = { units: [], chapters: [], topics: [] };
  const parts = title.split('|').map(p => p.trim()).filter(p => p.length > 0);
  
  parts.forEach(part => {
    if (/^P[12]$|^Paper/i.test(part)) return;
    
    if (/^U[IVX]+:|^UNIT/i.test(part)) {
      result.units.push(part);
    } else if (part.includes('>')) {
      const [chapter, topic] = part.split('>').map(s => s.trim());
      if (chapter) result.chapters.push(chapter);
      if (topic) result.topics.push(topic);
    } else if (!part.includes('-') && !part.includes('#')) {
      result.chapters.push(part);
    }
  });
  
  return result;
};

const TestCard = ({ 
  test, 
  onStart, 
  onEdit, 
  onDelete,
  showActions = true,
  language = 'hi'
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const typeConfig = TEST_TYPE_CONFIG[test.testType] || {};
  const paperLabel = PAPER_LABELS[test.paper] || {};

  // Parse unit/chapter/topic
  let units = parseUnitString(test.unit);
  let chapters = parseChapterString(test.chapter);
  let topics = parseTopicString(test.topic);

  // Fallback: extract from title if fields are empty
  if (units.length === 0 && chapters.length === 0 && topics.length === 0) {
    const extracted = extractFromTitle(test.title);
    units = extracted.units;
    chapters = extracted.chapters;
    topics = extracted.topics;
  }

  const getStatusBadge = () => {
    switch (test.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            {language === 'hi' ? 'सक्रिय' : 'Active'}
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-3 h-3" />
            {language === 'hi' ? 'ड्राफ्ट' : 'Draft'}
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {language === 'hi' ? 'संग्रहीत' : 'Archived'}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeGradient = () => {
    const gradients = {
      dpp: 'from-blue-500 to-blue-600',
      topic_test: 'from-emerald-500 to-emerald-600',
      chapter_test: 'from-purple-500 to-purple-600',
      unit_test: 'from-orange-500 to-orange-600',
      pyq_year: 'from-red-500 to-red-600',
      practice: 'from-teal-500 to-teal-600',
      full_mock_p1: 'from-indigo-500 to-indigo-600',
      full_mock_p2: 'from-pink-500 to-pink-600',
      full_mock_combined: 'from-gray-600 to-gray-700'
    };
    return gradients[test.testType] || 'from-gray-500 to-gray-600';
  };

  const handleStart = () => {
    if (onStart) {
      onStart(test);
    } else {
      navigate(`/test/${test._id}`);
    }
  };

  const truncate = (str, maxLen = 16) => {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
  };

  const hasCategories = units.length > 0 || chapters.length > 0 || topics.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Header stripe */}
      <div className={`h-1.5 bg-gradient-to-r ${getTypeGradient()}`} />
      
      <div className="p-4">
        {/* Type & Paper & Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getTypeGradient()} shadow-sm`}>
              {typeConfig.shortCode || test.testType?.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700">
              {test.paper === 'paper1' ? 'P1' : test.paper === 'paper2' ? 'P2' : 'P1+P2'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {showActions && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-20 py-1.5 min-w-[140px]">
                      <button
                        onClick={() => { setShowMenu(false); onEdit?.(test); }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 text-gray-700 dark:text-gray-200"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                        {language === 'hi' ? 'संपादित करें' : 'Edit'}
                      </button>
                      <button
                        onClick={() => { setShowMenu(false); onDelete?.(test); }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        {language === 'hi' ? 'हटाएं' : 'Delete'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Tags */}
        {hasCategories && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {/* Units - Blue */}
            {units.slice(0, 2).map((unit, i) => (
              <span 
                key={`u-${i}`} 
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-semibold"
                title={unit}
              >
                <Layers className="w-3 h-3" />
                {truncate(getUnitShortName(unit), 14)}
              </span>
            ))}
            {units.length > 2 && (
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-lg font-bold">
                +{units.length - 2}
              </span>
            )}

            {/* Chapters - Green */}
            {chapters.slice(0, 1).map((ch, i) => (
              <span 
                key={`c-${i}`} 
                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg font-semibold"
                title={ch}
              >
                <BookOpen className="w-3 h-3" />
                {truncate(ch, 12)}
              </span>
            ))}
            {chapters.length > 1 && (
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg font-bold">
                +{chapters.length - 1}
              </span>
            )}

            {/* Topics - Purple */}
            {topics.slice(0, 1).map((topic, i) => (
              <span 
                key={`t-${i}`} 
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs rounded-lg font-semibold"
                title={topic}
              >
                <Tag className="w-3 h-3" />
                {truncate(topic, 12)}
              </span>
            ))}
            {topics.length > 1 && (
              <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded-lg font-bold">
                +{topics.length - 1}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-snug">
          {test.title}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <strong className="text-gray-700 dark:text-gray-200">{test.totalQuestions}</strong>Q
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <strong className="text-gray-700 dark:text-gray-200">{test.duration}</strong>m
          </span>
          {test.totalAttempts > 0 && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <BarChart3 className="w-3.5 h-3.5" />
              <strong>{test.totalAttempts}x</strong>
            </span>
          )}
        </div>

        {/* Attempt Stats */}
        {test.totalAttempts > 0 && (
          <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {language === 'hi' ? 'औसत:' : 'Avg:'} 
                <strong className="ml-1 text-gray-800 dark:text-gray-200">{Math.round(test.averageScore || 0)}%</strong>
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold">
                {language === 'hi' ? 'सर्वश्रेष्ठ:' : 'Best:'} {test.highestScore || 0}%
              </span>
            </div>
          </div>
        )}

        {/* Negative Marking */}
        {test.negativeMarking && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg font-medium">
              <AlertCircle className="w-3 h-3" />
              -{test.negativeMarks}
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-3">
          <Calendar className="w-3 h-3" />
          {formatDate ? formatDate(test.createdAt) : new Date(test.createdAt).toLocaleDateString()}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={test.status !== 'active'}
          className={`
            w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm
            transition-all duration-200
            ${test.status === 'active'
              ? `bg-gradient-to-r ${getTypeGradient()} text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95`
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Play className="w-4 h-4" />
          {test.totalAttempts > 0 
            ? (language === 'hi' ? 'पुनः प्रयास' : 'Reattempt')
            : (language === 'hi' ? 'शुरू करें' : 'Start')
          }
        </button>
      </div>
    </div>
  );
};

export default TestCard;