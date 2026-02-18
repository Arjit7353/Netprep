import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, BookOpen, BarChart2, Layers } from 'lucide-react';
import Layout from '../components/layout/Layout';
import QuestionList from '../components/question/QuestionList';
import QuestionFilter from '../components/question/QuestionFilter';
import QuestionForm from '../components/question/QuestionForm';
import PassageGroupCard from '../components/question/PassageGroupCard';
import DIGroupCard from '../components/question/DIGroupCard';
import Button from '../components/common/Button';
import { useQuestions } from '../hooks/useQuestions';
import { useSyllabus } from '../hooks/useSyllabus';
import { useToast } from '../components/common/Toast';
import questionService from '../services/questionService';

const TAB_ALL = 'all';
const TAB_PASSAGE = 'passage';
const TAB_DI = 'di';

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
  const [activeTab, setActiveTab] = useState(TAB_ALL);

  // Passage and DI state
  const [passages, setPassages] = useState([]);
  const [passagesLoading, setPassagesLoading] = useState(false);
  const [passagesPagination, setPassagesPagination] = useState(null);

  const [diDataList, setDiDataList] = useState([]);
  const [diLoading, setDiLoading] = useState(false);
  const [diPagination, setDiPagination] = useState(null);

  const [stats, setStats] = useState(null);

  // Fetch questions
  useEffect(() => {
    if (activeTab === TAB_ALL) {
      fetchQuestions(filters);
    }
  }, [filters, activeTab]);

  // Fetch passages
  useEffect(() => {
    if (activeTab === TAB_PASSAGE) {
      fetchPassages();
    }
  }, [activeTab]);

  // Fetch DI data
  useEffect(() => {
    if (activeTab === TAB_DI) {
      fetchDIData();
    }
  }, [activeTab]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await questionService.getStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Stats fetch failed:', err);
    }
  };

  const fetchPassages = async (page = 1) => {
    setPassagesLoading(true);
    try {
      const res = await questionService.getPassages({
        page,
        limit: 10,
        ...(filters.paper && { paper: filters.paper }),
        ...(filters.unit && { unit: filters.unit })
      });
      if (res.success) {
        setPassages(res.data);
        setPassagesPagination(res.pagination);
      }
    } catch (err) {
      showError('Failed to load passages');
    } finally {
      setPassagesLoading(false);
    }
  };

  const fetchDIData = async (page = 1) => {
    setDiLoading(true);
    try {
      const res = await questionService.getDIDataList({
        page,
        limit: 10,
        ...(filters.paper && { paper: filters.paper })
      });
      if (res.success) {
        setDiDataList(res.data);
        setDiPagination(res.pagination);
      }
    } catch (err) {
      showError('Failed to load DI data');
    } finally {
      setDiLoading(false);
    }
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    setSelectedIds([]);
  }, []);

  const handleFilterReset = useCallback(() => {
    setFilters({});
    setSelectedIds([]);
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedIds([]);
  }, []);

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
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to save question');
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteQuestion(id);
      success('Question deleted');
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to delete');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await bulkDeleteQuestions(ids);
      success(`${ids.length} questions deleted`);
      setSelectedIds([]);
      fetchStats();
    } catch (err) {
      showError(err.message || 'Failed to delete');
      throw err;
    }
  };

  const handleRefresh = () => {
    if (activeTab === TAB_ALL) fetchQuestions(filters);
    else if (activeTab === TAB_PASSAGE) fetchPassages();
    else if (activeTab === TAB_DI) fetchDIData();
    fetchStats();
  };

  const tabs = [
    {
      id: TAB_ALL,
      label: { hi: 'सभी प्रश्न', en: 'All Questions' },
      icon: Layers,
      count: stats?.total
    },
    {
      id: TAB_PASSAGE,
      label: { hi: 'गद्यांश', en: 'Passages' },
      icon: BookOpen,
      count: stats?.passageCount
    },
    {
      id: TAB_DI,
      label: { hi: 'डेटा व्याख्या', en: 'Data Interpretation' },
      icon: BarChart2,
      count: stats?.diCount
    }
  ];

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
              <Button variant="outline" icon={RefreshCw} onClick={handleRefresh} disabled={loading}>
                {language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => { setEditingQuestion(null); setShowForm(true); }}
              >
                {language === 'hi' ? 'प्रश्न जोड़ें' : 'Add Question'}
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: language === 'hi' ? 'कुल प्रश्न' : 'Total Questions',
                  value: stats.total || 0,
                  color: 'bg-blue-50 text-blue-700 border-blue-200'
                },
                {
                  label: language === 'hi' ? 'गद्यांश सेट' : 'Passage Sets',
                  value: stats.passageCount || 0,
                  color: 'bg-amber-50 text-amber-700 border-amber-200'
                },
                {
                  label: language === 'hi' ? 'DI सेट' : 'DI Sets',
                  value: stats.diCount || 0,
                  color: 'bg-purple-50 text-purple-700 border-purple-200'
                },
                {
                  label: language === 'hi' ? 'इस सप्ताह' : 'This Week',
                  value: stats.recentAdditions || 0,
                  color: 'bg-green-50 text-green-700 border-green-200'
                }
              ].map((s, i) => (
                <div key={i} className={`rounded-lg border p-3 ${s.color}`}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1 opacity-80">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-secondary-700">
            <div className="flex gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-secondary-400 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {language === 'hi' ? tab.label.hi : tab.label.en}
                    {tab.count !== undefined && (
                      <span className={`
                        px-1.5 py-0.5 text-xs rounded-full
                        ${activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-secondary-300'
                        }
                      `}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
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

          {/* Content based on active tab */}
          {activeTab === TAB_ALL && (
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
          )}

          {activeTab === TAB_PASSAGE && (
            <PassageGroupCard
              passages={passages}
              loading={passagesLoading}
              language={language}
              pagination={passagesPagination}
              onPageChange={fetchPassages}
            />
          )}

          {activeTab === TAB_DI && (
            <DIGroupCard
              diDataList={diDataList}
              loading={diLoading}
              language={language}
              pagination={diPagination}
              onPageChange={fetchDIData}
            />
          )}

          {/* Question Form Modal */}
          <QuestionForm
            isOpen={showForm}
            onClose={() => { setShowForm(false); setEditingQuestion(null); }}
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