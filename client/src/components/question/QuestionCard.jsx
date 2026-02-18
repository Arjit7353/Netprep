import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  Eye, 
  MoreVertical,
  CheckCircle,
  Clock,
  Tag,
  BookOpen,
  BarChart2,
  Table,
  PieChart,
  TrendingUp,
  FileText,
  Loader
} from 'lucide-react';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import { getBilingualText, formatDate, getQuestionTypeColor, getDifficultyColor } from '../../utils/helpers';
import Button from '../common/Button';
import Modal from '../common/Modal';
import questionService from '../../services/questionService';

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
  
  // ✅ NEW: State for loading full passage/DI data
  const [fullPassageData, setFullPassageData] = useState(null);
  const [fullDIData, setFullDIData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const typeColor = getQuestionTypeColor(question.questionType);
  const diffColor = getDifficultyColor(question.difficulty);
  const typeLabel = QUESTION_TYPE_LABELS[question.questionType] || { en: question.questionType, hi: question.questionType };
  const diffLabel = DIFFICULTY_LABELS[question.difficulty] || { en: question.difficulty, hi: question.difficulty };

  // ✅ Load full passage/DI data when expanded
  useEffect(() => {
    if (expanded) {
      loadAdditionalData();
    }
  }, [expanded]);

  const loadAdditionalData = async () => {
    // Load passage data if passage_based
    if (question.questionType === 'passage_based' && question.passageId) {
      const passageId = typeof question.passageId === 'object' 
        ? question.passageId._id 
        : question.passageId;
      
      // Only load if not already populated
      if (!question.passageId?.content) {
        setLoadingData(true);
        try {
          const res = await questionService.getPassageById(passageId);
          if (res.success) {
            setFullPassageData(res.data);
          }
        } catch (err) {
          console.error('Failed to load passage:', err);
        } finally {
          setLoadingData(false);
        }
      } else {
        setFullPassageData(question.passageId);
      }
    }

    // Load DI data if DI type
    if (question.questionType?.startsWith('di_') && question.diDataId) {
      const diId = typeof question.diDataId === 'object' 
        ? question.diDataId._id 
        : question.diDataId;
      
      // Only load if not already populated
      if (!question.diDataId?.title) {
        setLoadingData(true);
        try {
          const res = await questionService.getDIDataById(diId);
          if (res.success) {
            setFullDIData(res.data);
          }
        } catch (err) {
          console.error('Failed to load DI data:', err);
        } finally {
          setLoadingData(false);
        }
      } else {
        setFullDIData(question.diDataId);
      }
    }
  };

  // Get DI icon based on type
  const getDIIcon = (type) => {
    switch (type) {
      case 'di_table': return Table;
      case 'di_bar_chart': return BarChart2;
      case 'di_pie_chart': return PieChart;
      case 'di_line_graph': return TrendingUp;
      case 'di_caselet': return FileText;
      default: return BarChart2;
    }
  };

  // Render question content based on type
  const renderQuestionContent = () => {
    const passageData = fullPassageData || question.passageId;
    const diData = fullDIData || question.diDataId;

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
        return <PassageQuestion {...props} passage={passageData} showPassage={true} />;
      case 'di_table':
        return <DITableChart {...props} diData={diData} showDIData={true} />;
      case 'di_bar_chart':
        return <DIBarChart {...props} diData={diData} showDIData={true} />;
      case 'di_pie_chart':
        return <DIPieChart {...props} diData={diData} showDIData={true} />;
      case 'di_line_graph':
        return <DILineGraph {...props} diData={diData} showDIData={true} />;
      case 'di_caselet':
        return <DICaselet {...props} diData={diData} showDIData={true} />;
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
      if (question.questionType === 'passage_based') {
        return language === 'hi' ? 'गद्यांश आधारित प्रश्न' : 'Passage-based Question';
      }
      if (question.questionType?.startsWith('di_')) {
        const diData = question.diDataId;
        const title = getBilingualText(diData?.title, language);
        return title || (language === 'hi' ? 'डेटा व्याख्या प्रश्न' : 'Data Interpretation Question');
      }
      return 'No question text';
    }
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  // ✅ Get additional info for passage/DI questions
  const getAdditionalInfo = () => {
    if (question.questionType === 'passage_based') {
      const passage = question.passageId;
      if (passage?.title) {
        return {
          type: 'passage',
          label: passage.title || (language === 'hi' ? 'गद्यांश' : 'Passage'),
          icon: BookOpen,
          color: 'text-amber-600 bg-amber-50'
        };
      }
    }

    if (question.questionType?.startsWith('di_')) {
      const diData = question.diDataId;
      const title = getBilingualText(diData?.title, language);
      const DIIcon = getDIIcon(question.questionType);
      return {
        type: 'di',
        label: title || (language === 'hi' ? 'डेटा व्याख्या' : 'Data Interpretation'),
        icon: DIIcon,
        color: 'text-purple-600 bg-purple-50'
      };
    }

    return null;
  };

  const additionalInfo = getAdditionalInfo();

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
          <div className="flex items-start gap-3 flex-1">
            {selectable && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect && onSelect(question._id)}
                className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            <div className="flex-1">
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

                {/* ✅ Show passage/DI indicator */}
                {additionalInfo && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${additionalInfo.color}`}>
                    <additionalInfo.icon className="w-3 h-3" />
                    {additionalInfo.label.substring(0, 20)}
                    {additionalInfo.label.length > 20 ? '...' : ''}
                  </span>
                )}
              </div>
              
              {/* Question Preview */}
              <p className="text-gray-800 dark:text-secondary-200 text-sm leading-relaxed">
                {getPreviewText()}
              </p>

              {/* ✅ Show passage/DI order if applicable */}
              {question.passageOrder && (
                <span className="mt-1 inline-block text-xs text-amber-600 dark:text-amber-400">
                  {language === 'hi' ? `गद्यांश प्रश्न ${question.passageOrder}` : `Passage Q${question.passageOrder}`}
                </span>
              )}
              {question.diOrder && (
                <span className="mt-1 inline-block text-xs text-purple-600 dark:text-purple-400">
                  {language === 'hi' ? `DI प्रश्न ${question.diOrder}` : `DI Q${question.diOrder}`}
                </span>
              )}
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
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500 dark:text-secondary-400" />
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 mt-1 w-40 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg shadow-lg py-1 z-10"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="p-4 bg-gray-50 dark:bg-secondary-900/50">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-primary-600 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">
                  {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
                </span>
              </div>
            ) : (
              renderQuestionContent()
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-secondary-900/30 rounded-b-xl">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-secondary-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {question.unit}
            </span>
            {question.chapter && (
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {question.chapter.length > 15 ? question.chapter.substring(0, 15) + '...' : question.chapter}
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
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
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
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          ) : (
            renderQuestionContent()
          )}
          
          {/* Show Answer Toggle in Preview */}
          <div className="pt-4 border-t border-gray-200 dark:border-secondary-700">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700 dark:text-secondary-300">
                {language === 'hi' ? 'सही उत्तर:' : 'Correct Answer:'}
              </span>
              <span className="text-green-600 font-medium">
                Option {String.fromCharCode(65 + question.correctAnswer)}
              </span>
            </div>
            
            {question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                  {language === 'hi' ? 'व्याख्या:' : 'Explanation:'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
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