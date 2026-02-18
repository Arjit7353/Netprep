import React, { useState } from 'react';
import { 
  Grid3X3, 
  List, 
  Trash2, 
  Download,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
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
  onViewModeChange
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Loading state
  if (loading) {
    return <ListSkeleton count={5} />;
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <List className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {language === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No questions found'}
        </h3>
        <p className="text-gray-500">
          {language === 'hi' 
            ? 'फ़िल्टर बदलें या नए प्रश्न जोड़ें'
            : 'Try changing filters or add new questions'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-4">
          {/* Select All */}
          {selectable && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {selectedIds.length === questions.length ? (
                <CheckSquare className="w-4 h-4 text-primary-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {language === 'hi' ? 'सभी चुनें' : 'Select All'}
            </button>
          )}

          {/* Selection count */}
          {selectedIds.length > 0 && (
            <span className="text-sm text-gray-500">
              {selectedIds.length} {language === 'hi' ? 'चयनित' : 'selected'}
            </span>
          )}

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {language === 'hi' ? 'हटाएं' : 'Delete'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => onViewModeChange?.('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange?.('grid')}
              className={`p-2 border-l border-gray-300 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Results count */}
          {pagination && (
            <span className="text-sm text-gray-500">
              {pagination.total} {language === 'hi' ? 'प्रश्न' : 'questions'}
            </span>
          )}
        </div>
      </div>

      {/* Questions List/Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
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
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">
            {language === 'hi' 
              ? `पृष्ठ ${pagination.page} / ${pagination.pages}`
              : `Page ${pagination.page} of ${pagination.pages}`
            }
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              {language === 'hi' ? 'पिछला' : 'Previous'}
            </Button>

            {/* Page numbers */}
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
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${pagination.page === pageNum 
                        ? 'bg-primary-600 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
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

      {/* Delete Confirmation Modal */}
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