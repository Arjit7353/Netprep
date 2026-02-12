import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import QuestionList from '../components/question/QuestionList';
import QuestionFilter from '../components/question/QuestionFilter';
import QuestionForm from '../components/question/QuestionForm';
import Button from '../components/common/Button';
import { useQuestions } from '../hooks/useQuestions';
import { useSyllabus } from '../hooks/useSyllabus';
import { useToast } from '../components/common/Toast';

const QuestionBank = () => {
  const { success, error: showError } = useToast();
  const { syllabus } = useSyllabus();
  const {
    questions,
    loading,
    pagination,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    bulkDeleteQuestions
  } = useQuestions();

  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch questions on mount and filter change
  useEffect(() => {
    fetchQuestions(filters);
  }, [filters, fetchQuestions]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setSelectedIds([]);
  }, []);

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    setFilters({});
    setSelectedIds([]);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedIds([]);
  }, []);

  // Handle create/edit question
  const handleSubmitQuestion = async (questionData) => {
    setFormLoading(true);
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion._id, questionData);
        success('Question updated successfully');
      } else {
        await createQuestion(questionData);
        success('Question created successfully');
      }
      setShowForm(false);
      setEditingQuestion(null);
      fetchQuestions(filters);
    } catch (err) {
      showError(err.message || 'Failed to save question');
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await deleteQuestion(id);
      success('Question deleted successfully');
    } catch (err) {
      showError(err.message || 'Failed to delete question');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (ids) => {
    try {
      await bulkDeleteQuestions(ids);
      success(`${ids.length} questions deleted successfully`);
      setSelectedIds([]);
    } catch (err) {
      showError(err.message || 'Failed to delete questions');
      throw err;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchQuestions(filters);
    setSelectedIds([]);
  };

  return (
    <Layout>
      {({ language }) => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {language === 'hi' ? 'प्रश्न बैंक' : 'Question Bank'}
              </h1>
              <p className="text-gray-500 dark:text-secondary-400 mt-1">
                {language === 'hi' 
                  ? 'सभी प्रश्नों को देखें, खोजें और प्रबंधित करें'
                  : 'View, search and manage all questions'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                icon={RefreshCw}
                onClick={handleRefresh}
                disabled={loading}
              >
                {language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => {
                  setEditingQuestion(null);
                  setShowForm(true);
                }}
              >
                {language === 'hi' ? 'प्रश्न जोड़ें' : 'Add Question'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <QuestionFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            syllabus={syllabus}
            language={language}
          />

          {/* Question List */}
          <QuestionList
            questions={questions}
            loading={loading}
            language={language}
            pagination={pagination}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            selectable={true}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Question Form Modal */}
          <QuestionForm
            isOpen={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingQuestion(null);
            }}
            onSubmit={handleSubmitQuestion}
            initialData={editingQuestion}
            syllabus={syllabus}
            loading={formLoading}
            language={language}
          />
        </div>
      )}
    </Layout>
  );
};

export default QuestionBank;