import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Hash, Calendar, Tag } from 'lucide-react';
import { getBilingualText, formatDate } from '../../utils/helpers';
import { ListSkeleton } from '../common/Loader';
import PassageQuestion from './QuestionTypes/PassageQuestion';
import questionService from '../../services/questionService';

const PassageGroupCard = ({
  passages = [],
  loading = false,
  language = 'hi',
  pagination,
  onPageChange
}) => {
  const [expandedId, setExpandedId] = useState(null);
  const [passageQuestions, setPassageQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});

  const handleExpand = async (passageId) => {
    if (expandedId === passageId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(passageId);

    // Load questions if not already loaded
    if (!passageQuestions[passageId]) {
      setLoadingQuestions(prev => ({ ...prev, [passageId]: true }));
      try {
        const res = await questionService.getPassageById(passageId);
        if (res.success) {
          setPassageQuestions(prev => ({
            ...prev,
            [passageId]: res.data.questions || []
          }));
        }
      } catch (err) {
        console.error('Failed to load passage questions:', err);
      } finally {
        setLoadingQuestions(prev => ({ ...prev, [passageId]: false }));
      }
    }
  };

  if (loading) return <ListSkeleton count={3} />;

  if (passages.length === 0) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {language === 'hi' ? 'कोई गद्यांश नहीं मिला' : 'No passages found'}
        </h3>
        <p className="text-gray-500 dark:text-secondary-400">
          {language === 'hi'
            ? 'JSON import के माध्यम से passage-based प्रश्न जोड़ें'
            : 'Add passage-based questions via JSON import'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {passages.map((passage) => {
        const isExpanded = expandedId === passage._id;
        const questions = passageQuestions[passage._id] || [];
        const isLoadingQ = loadingQuestions[passage._id];
        const content = getBilingualText(passage.content, language);
        const title = passage.title || (language === 'hi' ? 'गद्यांश' : 'Passage');

        return (
          <div
            key={passage._id}
            className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 overflow-hidden"
          >
            {/* Passage Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {title}
                      </h3>
                      <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                        {language === 'hi' ? 'गद्यांश' : 'Passage'}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        {passage.questionCount || 0} {language === 'hi' ? 'प्रश्न' : 'Questions'}
                      </span>
                    </div>

                    {/* Passage Preview */}
                    <p className="text-sm text-gray-600 dark:text-secondary-400 line-clamp-2 leading-relaxed">
                      {content ? content.substring(0, 200) + '...' : (language === 'hi' ? 'सामग्री उपलब्ध नहीं' : 'No content')}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {passage.unit && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400">
                          <Tag className="w-3 h-3" />
                          {passage.unit}
                        </span>
                      )}
                      {passage.chapter && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400">
                          <Hash className="w-3 h-3" />
                          {passage.chapter}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(passage.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => handleExpand(passage._id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {language === 'hi' ? 'बंद करें' : 'Collapse'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {language === 'hi' ? 'देखें' : 'Expand'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-secondary-700">
                {/* Full Passage */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {language === 'hi' ? 'गद्यांश' : 'Passage Text'}
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-wrap">
                    {content || (language === 'hi' ? 'सामग्री उपलब्ध नहीं' : 'No content available')}
                  </div>
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
                        <PassageQuestion
                          question={q}
                          passage={passage}
                          language={language}
                          showAnswer={true}
                          showPassage={false}
                          isPreview={true}
                        />
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

export default PassageGroupCard;