// client/src/components/question/QuestionList.jsx
// ════════════════════════════════════════════════════════
// ENHANCED v3.1 — Test usage, Quality, Compact view, Bulk Translate
// ════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  Grid3X3, List, Trash2, Download, CheckSquare, Square,
  ChevronLeft, ChevronRight, LayoutList, Edit2, Tag, Languages
} from 'lucide-react';
import QuestionCard from './QuestionCard';
import Button from '../common/Button';
import { ListSkeleton } from '../common/Loader';
import { ConfirmModal } from '../common/Modal';
import questionService from '../../services/questionService';

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
  // NEW PROPS
  testUsageMap = {},
  showTestUsage = true,
  showQuality = true,
  onBulkTranslateSuccess
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [translateLoading, setTranslateLoading] = useState(false);
  const t = (h, e) => language === 'hi' ? h : e;

  const handleSelectAll = () => {
    if (selectedIds.length === questions.length) onSelectionChange([]);
    else onSelectionChange(questions.map(q => q._id));
  };

  const handleSelect = (id) => {
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(i => i !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const handleBulkDelete = async () => {
    setDeleteLoading(true);
    try { await onBulkDelete(selectedIds); onSelectionChange([]); }
    finally { setDeleteLoading(false); setShowDeleteConfirm(false); }
  };

  const handleBulkTranslate = async () => {
    setTranslateLoading(true);
    try {
      const res = await questionService.bulkTranslateQuestions_NEW(selectedIds);
      if (res.success) {
        // Callback to parent for toast / refresh
        onBulkTranslateSuccess?.(res);
      }
    } catch (e) {
      console.error('Bulk translate error:', e);
    } finally {
      setTranslateLoading(false);
    }
  };

  if (loading) return <ListSkeleton count={5} />;

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <List className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {t('कोई प्रश्न नहीं मिला', 'No questions found')}
        </h3>
        <p className="text-gray-500">
          {t('फ़िल्टर बदलें या नए प्रश्न जोड़ें', 'Try changing filters or add new questions')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center justify-between bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-3">
        <div className="flex items-center gap-4">
          {selectable && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-secondary-400 dark:hover:text-white font-medium"
            >
              {selectedIds.length === questions.length
                ? <CheckSquare className="w-4 h-4 text-primary-600" />
                : <Square className="w-4 h-4" />}
              {t('सभी चुनें', 'Select All')}
            </button>
          )}

          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-primary-600 font-bold">
                {selectedIds.length} {t('चयनित', 'selected')}
              </span>

              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t('हटाएं', 'Delete')}
              </Button>

              {/* ★ NEW: Bulk Translate Button */}
              <Button
                variant="outline"
                size="sm"
                icon={Languages}
                loading={translateLoading}
                onClick={handleBulkTranslate}
              >
                {t('अनुवाद', 'Translate')}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-gray-300 dark:border-secondary-600 overflow-hidden">
            {[
              { mode: 'list', icon: List },
              { mode: 'grid', icon: Grid3X3 }
            ].map(v => (
              <button
                key={v.mode}
                onClick={() => onViewModeChange?.(v.mode)}
                className={`p-2 ${viewMode === v.mode
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-secondary-700'
                }`}
              >
                <v.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          {pagination && (
            <span className="text-sm text-gray-500 font-medium tabular-nums">
              {pagination.total} {t('प्रश्न', 'questions')}
            </span>
          )}
        </div>
      </div>

      {/* ═══ QUESTIONS ═══ */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
        {questions.map((question) => (
          <QuestionCard
            key={question._id}
            question={question}
            language={language}
            onEdit={onEdit}
            onDelete={onDelete}
            selectable={selectable}
            isSelected={selectedIds.includes(question._id)}
            onSelect={handleSelect}
            testUsage={testUsageMap[question._id] || []}
            showTestUsage={showTestUsage}
            showQuality={showQuality}
          />
        ))}
      </div>

      {/* ═══ PAGINATION ═══ */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-4">
          <div className="text-sm text-gray-500 tabular-nums">
            {t(
              `पृष्ठ ${pagination.page} / ${pagination.pages}`,
              `Page ${pagination.page} of ${pagination.pages}`
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              {t('पिछला', 'Prev')}
            </Button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum;
                if (pagination.pages <= 5) pageNum = i + 1;
                else if (pagination.page <= 3) pageNum = i + 1;
                else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                else pageNum = pagination.page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold tabular-nums transition-colors
                      ${pagination.page === pageNum
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
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
              {t('अगला', 'Next')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={t('प्रश्न हटाएं', 'Delete Questions')}
        message={t(
          `क्या आप ${selectedIds.length} प्रश्न हटाना चाहते हैं?`,
          `Delete ${selectedIds.length} questions?`
        )}
        confirmText={t('हटाएं', 'Delete')}
        loading={deleteLoading}
      />
    </div>
  );
};

export default QuestionList;