// client/src/components/question/QuestionList.jsx

import React, { useState, useMemo } from 'react';
import {
  Grid3X3,
  List,
  Trash2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  BarChart3,
  Layers
} from 'lucide-react';
import QuestionCard from './QuestionCard';
import Button from '../common/Button';
import { ListSkeleton } from '../common/Loader';
import { ConfirmModal } from '../common/Modal';

const QuestionList = ({
  questions = [],
  loading = false,
  language = 'hi',
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onBulkDelete,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  viewMode = 'list',
  onViewModeChange,
  groupPassages = true
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Group questions by passage/DI for better display
  const groupedQuestions = useMemo(() => {
    if (!groupPassages) return questions.map(q => ({ type: 'single', question: q }));

    const groups = [];
    const processedIds = new Set();

    for (const q of questions) {
      if (processedIds.has(q._id)) continue;

      // Group passage-based questions
      if (q.questionType === 'passage_based' && q.passageId) {
        const passageId = typeof q.passageId === 'object' ? q.passageId._id : q.passageId;
        const passageQuestions = questions.filter(pq => {
          const pId = typeof pq.passageId === 'object' ? pq.passageId._id : pq.passageId;
          return pq.questionType === 'passage_based' && pId && pId.toString() === passageId.toString();
        });

        passageQuestions.forEach(pq => processedIds.add(pq._id));

        groups.push({
          type: 'passage_group',
          passageId,
          passage: typeof q.passageId === 'object' ? q.passageId : null,
          questions: passageQuestions.sort((a, b) => (a.passageOrder || 0) - (b.passageOrder || 0))
        });
        continue;
      }

      // Group DI questions
      if (q.questionType?.startsWith('di_') && q.diDataId) {
        const diId = typeof q.diDataId === 'object' ? q.diDataId._id : q.diDataId;
        const diQuestions = questions.filter(dq => {
          const dId = typeof dq.diDataId === 'object' ? dq.diDataId._id : dq.diDataId;
          return dq.questionType?.startsWith('di_') && dId && dId.toString() === diId.toString();
        });

        diQuestions.forEach(dq => processedIds.add(dq._id));

        groups.push({
          type: 'di_group',
          diDataId: diId,
          diData: typeof q.diDataId === 'object' ? q.diDataId : null,
          questions: diQuestions.sort((a, b) => (a.diOrder || 0) - (b.diOrder || 0))
        });
        continue;
      }

      // Single question
      processedIds.add(q._id);
      groups.push({ type: 'single', question: q });
    }

    return groups;
  }, [questions, groupPassages]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(questions.map(q => q._id));
    }
  };

  // Handle single selection
  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try {
      await onBulkDelete(selectedIds);
      onSelectionChange([]);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Get bilingual text
  const getText = (obj, fallback = '') => {
    if (!obj) return fallback;
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.hi || obj.en || fallback;
  };

  const getArr = (obj, fallback = []) => {
    if (!obj) return fallback;
    if (Array.isArray(obj)) return obj;
    return obj[language] || obj.hi || obj.en || fallback;
  };

  // Loading state
  if (loading) {
    return <ListSkeleton count={5} />;
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <List className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {language === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No questions found'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {language === 'hi'
            ? 'फ़िल्टर बदलें या नए प्रश्न जोड़ें'
            : 'Try changing filters or add new questions'}
        </p>
      </div>
    );
  }

  // Render a passage group
  const renderPassageGroup = (group) => {
    const passage = group.passage;
    const passageContent = passage ? getText(passage.content) : '';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm overflow-hidden">
        {/* Passage Header */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-indigo-800 dark:text-indigo-300">
              {passage?.title || (language === 'hi' ? 'गद्यांश' : 'Passage')}
              {passage?.passageNumber ? ` #${passage.passageNumber}` : ''}
            </span>
            <span className="text-xs bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
              {group.questions.length} {language === 'hi' ? 'प्रश्न' : 'Questions'}
            </span>
          </div>
        </div>

        {/* Passage Content */}
        {passageContent && (
          <div className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-900">
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-64 overflow-y-auto">
              {passageContent.split('\n').map((para, i) => (
                <p key={i} className="mb-2">{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {group.questions.map((q) => (
            <div key={q._id} className="p-0">
              <QuestionCard
                question={{ ...q, passageId: null }}
                language={language}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={selectable}
                isSelected={selectedIds.includes(q._id)}
                onSelect={handleSelect}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a DI group
  const renderDIGroup = (group) => {
    const diData = group.diData;
    const diTitle = diData ? getText(diData.title) : '';
    const diInstruction = diData ? getText(diData.instruction) : '';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 shadow-sm overflow-hidden">
        {/* DI Header */}
        <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-semibold text-red-800 dark:text-red-300">
              {diTitle || 'Data Interpretation'}
              {diData?.diNumber ? ` #${diData.diNumber}` : ''}
            </span>
            <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full capitalize">
              {diData?.diType?.replace('_', ' ') || 'Table'}
            </span>
            <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-0.5 rounded-full">
              {group.questions.length} Q
            </span>
          </div>
        </div>

        {/* DI Content */}
        <div className="px-4 py-3 border-b border-red-100 dark:border-red-900">
          {diInstruction && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">{diInstruction}</p>
          )}

          {/* Table */}
          {diData?.tableData && (() => {
            const headers = getArr(diData.tableData.headers);
            const rows = diData.tableData.rows || [];

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                  {headers.length > 0 && (
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        {headers.map((h, i) => (
                          <th key={i} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-750'}>
                        {(Array.isArray(row) ? row : [row]).map((cell, ci) => (
                          <td key={ci} className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                            {cell === null || cell === undefined ? '-' : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Caselet */}
          {diData?.caseletText && (
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {getText(diData.caseletText)}
            </div>
          )}

          {/* Chart summary */}
          {diData?.chartData && (() => {
            const labels = getArr(diData.chartData.labels);
            const datasets = diData.chartData.datasets || [];

            return (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {language === 'hi' ? 'चार्ट डेटा:' : 'Chart Data:'}
                </p>
                {labels.length > 0 && (
                  <p className="text-xs text-gray-600">{language === 'hi' ? 'लेबल:' : 'Labels:'} {labels.join(', ')}</p>
                )}
                {datasets.map((ds, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    {getText(ds.label) || `Set ${i + 1}`}: [{ds.data?.join(', ') || ''}]
                  </p>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Questions */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {group.questions.map((q) => (
            <div key={q._id} className="p-0">
              <QuestionCard
                question={{ ...q, diDataId: null }}
                language={language}
                onEdit={onEdit}
                onDelete={onDelete}
                selectable={selectable}
                isSelected={selectedIds.includes(q._id)}
                onSelect={handleSelect}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center gap-4">
          {selectable && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              {selectedIds.length === questions.length ? (
                <CheckSquare className="w-4 h-4 text-primary-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {language === 'hi' ? 'सभी चुनें' : 'Select All'}
            </button>
          )}

          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-500">
                {selectedIds.length} {language === 'hi' ? 'चयनित' : 'selected'}
              </span>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
              >
                {language === 'hi' ? 'हटाएं' : 'Delete'}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Group toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => onViewModeChange?.('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange?.('grid')}
              className={`p-2 border-l border-gray-300 dark:border-gray-600 ${viewMode === 'grid' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {pagination && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.total} {language === 'hi' ? 'प्रश्न' : 'questions'}
            </span>
          )}
        </div>
      </div>

      {/* Questions List/Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
        {groupedQuestions.map((group, idx) => {
          if (group.type === 'passage_group') {
            return <div key={`passage-${group.passageId}-${idx}`}>{renderPassageGroup(group)}</div>;
          }

          if (group.type === 'di_group') {
            return <div key={`di-${group.diDataId}-${idx}`}>{renderDIGroup(group)}</div>;
          }

          // Single question
          return (
            <QuestionCard
              key={group.question._id}
              question={group.question}
              language={language}
              onEdit={onEdit}
              onDelete={onDelete}
              selectable={selectable}
              isSelected={selectedIds.includes(group.question._id)}
              onSelect={handleSelect}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'hi'
              ? `पृष्ठ ${pagination.page} / ${pagination.pages}`
              : `Page ${pagination.page} of ${pagination.pages}`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              {language === 'hi' ? 'पिछला' : 'Prev'}
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              iconPosition="right"
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              {language === 'hi' ? 'अगला' : 'Next'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={language === 'hi' ? 'प्रश्न हटाएं' : 'Delete Questions'}
        message={
          language === 'hi'
            ? `क्या आप वाकई ${selectedIds.length} प्रश्न हटाना चाहते हैं?`
            : `Are you sure you want to delete ${selectedIds.length} questions?`
        }
        confirmText={language === 'hi' ? 'हटाएं' : 'Delete'}
        loading={deleteLoading}
      />
    </div>
  );
};

export default QuestionList;