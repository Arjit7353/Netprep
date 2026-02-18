import React, { useState } from 'react';
import { BarChart2, Table, PieChart, TrendingUp, FileText, ChevronDown, ChevronUp, Hash, Calendar, Tag } from 'lucide-react';
import { getBilingualText, formatDate } from '../../utils/helpers';
import { ListSkeleton } from '../common/Loader';
import DITableChart from './QuestionTypes/DITableChart';
import DIBarChart from './QuestionTypes/DIBarChart';
import DIPieChart from './QuestionTypes/DIPieChart';
import DILineGraph from './QuestionTypes/DILineGraph';
import DICaselet from './QuestionTypes/DICaselet';
import questionService from '../../services/questionService';

const DI_TYPE_CONFIG = {
  table: {
    icon: Table,
    label: { hi: 'टेबल चार्ट', en: 'Table Chart' },
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10'
  },
  bar_chart: {
    icon: BarChart2,
    label: { hi: 'बार चार्ट', en: 'Bar Chart' },
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/10'
  },
  pie_chart: {
    icon: PieChart,
    label: { hi: 'पाई चार्ट', en: 'Pie Chart' },
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10'
  },
  line_graph: {
    icon: TrendingUp,
    label: { hi: 'लाइन ग्राफ', en: 'Line Graph' },
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/10'
  },
  caselet: {
    icon: FileText,
    label: { hi: 'केसलेट', en: 'Caselet' },
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/10'
  },
  mixed: {
    icon: BarChart2,
    label: { hi: 'मिश्रित', en: 'Mixed' },
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/10'
  }
};

const DIGroupCard = ({
  diDataList = [],
  loading = false,
  language = 'hi',
  pagination,
  onPageChange
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [diQuestions, setDiQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});

  const handleExpand = async (diId) => {
    if (expandedId === diId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(diId);

    if (!diQuestions[diId]) {
      setLoadingQuestions(prev => ({ ...prev, [diId]: true }));
      try {
        const res = await questionService.getDIDataById(diId);
        if (res.success) {
          setDiQuestions(prev => ({
            ...prev,
            [diId]: res.data.questions || []
          }));
        }
      } catch (err) {
        console.error('Failed to load DI questions:', err);
      } finally {
        setLoadingQuestions(prev => ({ ...prev, [diId]: false }));
      }
    }
  };

  // Render DI question by type
  const renderDIQuestion = (question, diData) => {
    const props = {
      question,
      diData,
      language,
      showAnswer: true,
      showDIData: false,
      isPreview: true
    };

    switch (diData.diType) {
      case 'table': return <DITableChart {...props} />;
      case 'bar_chart': return <DIBarChart {...props} />;
      case 'pie_chart': return <DIPieChart {...props} />;
      case 'line_graph': return <DILineGraph {...props} />;
      case 'caselet': return <DICaselet {...props} />;
      default: return <DITableChart {...props} />;
    }
  };

  // Render the DI data visualization
  const renderDIVisualization = (diData) => {
    const fakeQuestion = { question: { hi: '', en: '' }, options: { hi: [], en: [] }, correctAnswer: 0 };

    switch (diData.diType) {
      case 'table':
        return <DITableChart question={fakeQuestion} diData={diData} language={language} showDIData={true} isPreview={true} showAnswer={false} />;
      case 'bar_chart':
        return <DIBarChart question={fakeQuestion} diData={diData} language={language} showDIData={true} isPreview={true} showAnswer={false} />;
      case 'pie_chart':
        return <DIPieChart question={fakeQuestion} diData={diData} language={language} showDIData={true} isPreview={true} showAnswer={false} />;
      case 'line_graph':
        return <DILineGraph question={fakeQuestion} diData={diData} language={language} showDIData={true} isPreview={true} showAnswer={false} />;
      case 'caselet':
        return <DICaselet question={fakeQuestion} diData={diData} language={language} showDIData={true} isPreview={true} showAnswer={false} />;
      default:
        return null;
    }
  };

  if (loading) return <ListSkeleton count={3} />;

  if (diDataList.length === 0) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-12 text-center">
        <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {language === 'hi' ? 'कोई DI डेटा नहीं मिला' : 'No DI data found'}
        </h3>
        <p className="text-gray-500 dark:text-secondary-400">
          {language === 'hi'
            ? 'JSON import के माध्यम से DI प्रश्न जोड़ें'
            : 'Add DI questions via JSON import'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {diDataList.map((diData) => {
        const isExpanded = expandedId === diData._id;
        const questions = diQuestions[diData._id] || [];
        const isLoadingQ = loadingQuestions[diData._id];
        const typeConfig = DI_TYPE_CONFIG[diData.diType] || DI_TYPE_CONFIG.table;
        const TypeIcon = typeConfig.icon;
        const title = getBilingualText(diData.title, language);
        const instruction = getBilingualText(diData.instruction, language);

        return (
          <div
            key={diData._id}
            className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 overflow-hidden"
          >
            {/* DI Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                    <TypeIcon className={`w-5 h-5 ${typeConfig.color.split(' ')[1]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {title || (language === 'hi' ? 'डेटा व्याख्या सेट' : 'Data Interpretation Set')}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${typeConfig.color}`}>
                        {language === 'hi' ? typeConfig.label.hi : typeConfig.label.en}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        {diData.questionCount || 0} {language === 'hi' ? 'प्रश्न' : 'Q'}
                      </span>
                    </div>

                    {instruction && (
                      <p className="text-sm text-gray-600 dark:text-secondary-400 line-clamp-1">
                        {instruction}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {diData.unit && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400">
                          <Tag className="w-3 h-3" />
                          {diData.unit}
                        </span>
                      )}
                      {diData.chapter && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400">
                          <Hash className="w-3 h-3" />
                          {diData.chapter}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(diData.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => handleExpand(diData._id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <><ChevronUp className="w-4 h-4" />{language === 'hi' ? 'बंद करें' : 'Collapse'}</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" />{language === 'hi' ? 'देखें' : 'Expand'}</>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-secondary-700">
                {/* DI Visualization */}
                <div className={`p-4 ${typeConfig.bgColor}`}>
                  {renderDIVisualization(diData)}
                </div>

                {/* Questions */}
                <div className="p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-secondary-300">
                    {language === 'hi' ? 'संबंधित प्रश्न:' : 'Related Questions:'}
                  </h4>

                  {isLoadingQ ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : questions.length > 0 ? (
                    questions.map((q, idx) => (
                      <div
                        key={q._id}
                        className="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-4 border border-gray-200 dark:border-secondary-600"
                      >
                        <div className="text-xs text-gray-500 dark:text-secondary-400 mb-2">
                          {language === 'hi' ? `प्रश्न ${idx + 1}` : `Question ${idx + 1}`}
                          {q.questionNumber && ` (Q.${q.questionNumber})`}
                        </div>
                        {renderDIQuestion(q, diData)}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-secondary-400 text-center py-4">
                      {language === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No questions found'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:border-secondary-600 dark:hover:bg-secondary-700 dark:text-secondary-300"
          >
            {language === 'hi' ? 'पिछला' : 'Previous'}
          </button>
          <span className="text-sm text-gray-500 dark:text-secondary-400">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:border-secondary-600 dark:hover:bg-secondary-700 dark:text-secondary-300"
          >
            {language === 'hi' ? 'अगला' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DIGroupCard;