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
  MoreVertical
} from 'lucide-react';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';
import { formatDate, formatDuration } from '../../utils/helpers';

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

  const getStatusBadge = () => {
    switch (test.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            {language === 'hi' ? 'सक्रिय' : 'Active'}
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <AlertCircle className="w-3 h-3" />
            {language === 'hi' ? 'ड्राफ्ट' : 'Draft'}
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {language === 'hi' ? 'संग्रहीत' : 'Archived'}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeColor = () => {
    const colors = {
      dpp: 'bg-blue-500',
      topic_test: 'bg-green-500',
      chapter_test: 'bg-purple-500',
      unit_test: 'bg-orange-500',
      pyq_year: 'bg-red-500',
      practice: 'bg-teal-500',
      full_mock_p1: 'bg-indigo-500',
      full_mock_p2: 'bg-pink-500',
      full_mock_combined: 'bg-gray-700'
    };
    return colors[test.testType] || 'bg-gray-500';
  };

  const handleStart = () => {
    if (onStart) {
      onStart(test);
    } else {
      navigate(`/test/${test._id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header with type indicator */}
      <div className={`h-2 ${getTypeColor()}`} />
      
      <div className="p-4">
        {/* Top Row - Type & Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getTypeColor()}`}>
            {typeConfig.shortCode || test.testType}
          </span>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {showActions && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[120px]">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit?.(test);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        {language === 'hi' ? 'संपादित करें' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete?.(test);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
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

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {test.title}
        </h3>

        {/* Paper Badge */}
        <div className="mb-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {language === 'hi' ? paperLabel.hi : paperLabel.en}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4 text-gray-400" />
            <span>{test.totalQuestions} {language === 'hi' ? 'प्रश्न' : 'Questions'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatDuration(test.duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span>{test.totalMarks} {language === 'hi' ? 'अंक' : 'Marks'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(test.createdAt)}</span>
          </div>
        </div>

        {/* Attempt Stats (if any) */}
        {test.totalAttempts > 0 && (
          <div className="mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {language === 'hi' ? 'प्रयास:' : 'Attempts:'} {test.totalAttempts}
              </span>
              <span className="text-gray-600">
                {language === 'hi' ? 'औसत:' : 'Avg:'} {Math.round(test.averageScore)}%
              </span>
              <span className="text-green-600 font-medium">
                {language === 'hi' ? 'सर्वश्रेष्ठ:' : 'Best:'} {test.highestScore}%
              </span>
            </div>
          </div>
        )}

        {/* Negative Marking Indicator */}
        {test.negativeMarking && (
          <div className="mb-4">
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {language === 'hi' 
                ? `नकारात्मक अंकन: -${test.negativeMarks}` 
                : `Negative Marking: -${test.negativeMarks}`}
            </span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleStart}
          disabled={test.status !== 'active'}
          className={`
            w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2
            transition-colors duration-200
            ${test.status === 'active'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Play className="w-4 h-4" />
          {test.totalAttempts > 0 
            ? (language === 'hi' ? 'पुनः प्रयास करें' : 'Reattempt')
            : (language === 'hi' ? 'परीक्षा शुरू करें' : 'Start Test')
          }
        </button>
      </div>
    </div>
  );
};

export default TestCard;