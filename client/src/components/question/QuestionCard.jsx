import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Eye, 
  MoreVertical,
  CheckCircle,
  Clock,
  Tag,
  BookOpen
} from 'lucide-react';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import { getBilingualText, formatDate, getQuestionTypeColor, getDifficultyColor } from '../../utils/helpers';
import Button from '../common/Button';
import Modal from '../common/Modal';

// Import question type components
import MCQQuestion from './QuestionTypes/MCQQuestion';
import AssertionReason from './QuestionTypes/AssertionReason';
import MatchFollowing from './QuestionTypes/MatchFollowing';
import SequenceOrder from './QuestionTypes/SequenceOrder';
import StatementBased from './QuestionTypes/StatementBased';
import PassageQuestion from './QuestionTypes/PassageQuestion';
import DITableChart from './QuestionTypes/DITableChart';
import DIBarChart from './QuestionTypes/DIBarChart';
import DIPieChart from './QuestionTypes/DIPieChart';
import DILineGraph from './QuestionTypes/DILineGraph';
import DICaselet from './QuestionTypes/DICaselet';

const QuestionCard = ({
  question,
  language = 'hi',
  showActions = true,
  showAnswer = false,
  onEdit,
  onDelete,
  onView,
  isSelected = false,
  onSelect,
  selectable = false
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const typeColor = getQuestionTypeColor(question.questionType);
  const diffColor = getDifficultyColor(question.difficulty);
  const typeLabel = QUESTION_TYPE_LABELS[question.questionType] || { en: question.questionType, hi: question.questionType };
  const diffLabel = DIFFICULTY_LABELS[question.difficulty] || { en: question.difficulty, hi: question.difficulty };

  // Render question content based on type
  const renderQuestionContent = () => {
    const props = {
      question,
      language,
      showAnswer,
      isPreview: true
    };

    switch (question.questionType) {
      case 'mcq':
        return <MCQQuestion {...props} />;
      case 'assertion_reason':
        return <AssertionReason {...props} />;
      case 'match_following':
        return <MatchFollowing {...props} />;
      case 'sequence_order':
        return <SequenceOrder {...props} />;
      case 'statement_based':
        return <StatementBased {...props} />;
      case 'passage_based':
        return <PassageQuestion {...props} />;
      case 'di_table':
        return <DITableChart {...props} />;
      case 'di_bar_chart':
        return <DIBarChart {...props} />;
      case 'di_pie_chart':
        return <DIPieChart {...props} />;
      case 'di_line_graph':
        return <DILineGraph {...props} />;
      case 'di_caselet':
        return <DICaselet {...props} />;
      default:
        return <MCQQuestion {...props} />;
    }
  };

  // Get question preview text
  const getPreviewText = () => {
    const text = getBilingualText(question.question, language);
    if (!text) {
      if (question.questionType === 'assertion_reason') {
        return getBilingualText(question.assertionReasonData?.assertion, language);
      }
      return 'No question text';
    }
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <>
      <div 
        className={`
          bg-white dark:bg-secondary-800 rounded-xl border transition-all duration-200
          ${isSelected ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800' : 'border-gray-200 dark:border-secondary-700 hover:border-gray-300 dark:hover:border-secondary-600'}
          ${selectable ? 'cursor-pointer' : ''}
        `}
        onClick={() => selectable && onSelect && onSelect(question._id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100 dark:border-secondary-700">
          <div className="flex items-start gap-3">
            {selectable && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect && onSelect(question._id)}
                className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-gray-500 dark:text-secondary-400">
                  Q.{question.questionNumber}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColor.bg} ${typeColor.text} dark:opacity-90`}>
                  {language === 'hi' ? typeLabel.hi : typeLabel.en}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${diffColor.bg} ${diffColor.text} dark:opacity-90`}>
                  {language === 'hi' ? diffLabel.hi : diffLabel.en}
                </span>
              </div>
              
              {/* Question Preview */}
              <p className="text-gray-800 dark:text-secondary-200 text-sm leading-relaxed">
                {getPreviewText()}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    {language === 'hi' ? 'देखें' : 'View'}
                  </button>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(question);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      {language === 'hi' ? 'संपादित करें' : 'Edit'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(question._id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {language === 'hi' ? 'हटाएं' : 'Delete'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="p-4 bg-gray-50">
            {renderQuestionContent()}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-b-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {question.unit}
            </span>
            {question.chapter && (
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {question.chapter}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(question.createdAt)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            {expanded 
              ? (language === 'hi' ? 'कम देखें' : 'Show Less')
              : (language === 'hi' ? 'और देखें' : 'Show More')
            }
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Question #${question.questionNumber}`}
        size="lg"
      >
        <div className="space-y-4">
          {renderQuestionContent()}
          
          {/* Show Answer Toggle in Preview */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700">
                {language === 'hi' ? 'सही उत्तर:' : 'Correct Answer:'}
              </span>
              <span className="text-green-600 font-medium">
                Option {String.fromCharCode(65 + question.correctAnswer)}
              </span>
            </div>
            
            {question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  {language === 'hi' ? 'व्याख्या:' : 'Explanation:'}
                </p>
                <p className="text-sm text-blue-700">
                  {getBilingualText(question.explanation, language)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QuestionCard;