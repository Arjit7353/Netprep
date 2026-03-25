// client/src/pages/QuestionBank.jsx
// ════════════════════════════════════════════════════════
// EXTREME ADVANCED v3.0
// — Test usage tracking, Edit flow, PYQ tab
// — Keyboard shortcuts, Bulk operations, Analytics
// — Quality dashboard, Export, Advanced filters
// ════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, RefreshCw, BookOpen, BarChart2, Layers, Download, Upload,
  Keyboard, Star, Sparkles, Activity, TrendingUp, Zap, Copy,
  CheckCircle2, AlertTriangle, ClipboardList, Hash, Eye,
  ChevronDown, Tag, Edit2, Trash2, Filter as FilterIcon
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import QuestionList from '../components/question/QuestionList';
import QuestionFilter from '../components/question/QuestionFilter';
import QuestionForm from '../components/question/QuestionForm';
import PassageGroupCard from '../components/question/PassageGroupCard';
import DIGroupCard from '../components/question/DIGroupCard';
import Button from '../components/common/Button';
import Modal, { ConfirmModal } from '../components/common/Modal';
import { useQuestions } from '../hooks/useQuestions';
import { useSyllabus } from '../hooks/useSyllabus';
import { useToast } from '../components/common/Toast';
import questionService from '../services/questionService';

const TAB_ALL = 'all';
const TAB_PYQ = 'pyq';
const TAB_PASSAGE = 'passage';
const TAB_DI = 'di';

const QuestionBank = () => {
  const { success, error: showError, info: showInfo } = useToast();
  const { syllabus } = useSyllabus();
  const {
    questions, loading, pagination,
    fetchQuestions, createQuestion, updateQuestion,
    deleteQuestion, bulkDeleteQuestions
  } = useQuestions();

  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_ALL);

  // Test usage tracking
  const [testUsageMap, setTestUsageMap] = useState({});
  const [testUsageLoading, setTestUsageLoading] = useState(false);

  // Bulk operations
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ difficulty: '', tags: '' });
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  // Passage / DI state
  const [passages, setPassages] = useState([]);
  const [passagesLoading, setPassagesLoading] = useState(false);
  const [passagesPagination, setPassagesPagination] = useState(null);
  const [diDataList, setDiDataList] = useState([]);
  const [diLoading, setDiLoading] = useState(false);
  const [diPagination, setDiPagination] = useState(null);

  // PYQ state
  const [pyqQuestions, setPyqQuestions] = useState([]);
  const [pyqLoading, setPyqLoading] = useState(false);
  const [pyqPagination, setPyqPagination] = useState(null);
  const [pyqStats, setPyqStats] = useState(null);

  const [stats, setStats] = useState(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const searchRef = useRef(null);

  const t = useCallback((hi, en) => {
    // We'll get language from Layout render prop, so store it
    return hi; // default, overridden in render
  }, []);

  // ═══ DATA FETCHING ═══
  useEffect(() => {
    if (activeTab === TAB_ALL) fetchQuestions(filters);
  }, [filters, activeTab]);

  useEffect(() => {
    if (activeTab === TAB_PYQ) fetchPYQQuestions();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === TAB_PASSAGE) fetchPassages();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === TAB_DI) fetchDIData();
  }, [activeTab]);

  useEffect(() => { fetchStats(); }, []);

  // ═══ LOAD TEST USAGE for visible questions ═══
  useEffect(() => {
    if (questions.length > 0 && activeTab === TAB_ALL) {
      loadTestUsage(questions.map(q => q._id));
    }
  }, [questions, activeTab]);

  const loadTestUsage = async (ids) => {
    if (!ids || ids.length === 0) return;
    setTestUsageLoading(true);
    try {
      const res = await questionService.getTestUsage(ids);
      if (res.success) {
        setTestUsageMap(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Test usage load failed:', err);
    } finally {
      setTestUsageLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await questionService.getStats();
      if (res.success) setStats(res.data);
    } catch (err) { console.error('Stats fetch failed:', err); }
  };

  const fetchPassages = async (page = 1) => {
    setPassagesLoading(true);
    try {
      const res = await questionService.getPassages({ page, limit: 10, ...(filters.paper && { paper: filters.paper }), ...(filters.unit && { unit: filters.unit }) });
      if (res.success) { setPassages(res.data); setPassagesPagination(res.pagination); }
    } catch (err) { showError('Failed to load passages'); }
    finally { setPassagesLoading(false); }
  };

  const fetchDIData = async (page = 1) => {
    setDiLoading(true);
    try {
      const res = await questionService.getDIDataList({ page, limit: 10, ...(filters.paper && { paper: filters.paper }) });
      if (res.success) { setDiDataList(res.data); setDiPagination(res.pagination); }
    } catch (err) { showError('Failed to load DI data'); }
    finally { setDiLoading(false); }
  };

  const fetchPYQQuestions = async (page = 1) => {
    setPyqLoading(true);
    try {
      const res = await questionService.getQuestions({ page, limit: 20, isPYQ: true, ...(filters.paper && { paper: filters.paper }) });
      if (res.success) {
        setPyqQuestions(res.data || []);
        setPyqPagination(res.pagination);
        // Load test usage for PYQ
        if (res.data?.length > 0) {
          loadTestUsage(res.data.map(q => q._id));
        }
      }
    } catch (err) { showError('Failed to load PYQ questions'); }
    finally { setPyqLoading(false); }
  };

  // ═══ HANDLERS ═══
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
    } catch (err) { showError(err.message || 'Failed to delete'); }
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

  // ═══ BULK EDIT ═══
  const handleBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    setBulkEditLoading(true);
    try {
      const updates = {};
      if (bulkEditData.difficulty) updates.difficulty = bulkEditData.difficulty;
      if (bulkEditData.tags) updates.tags = bulkEditData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await questionService.bulkUpdateQuestions(selectedIds, updates);
      if (res.success) {
        success(`${res.data?.modified || selectedIds.length} questions updated`);
        setShowBulkEditModal(false);
        setBulkEditData({ difficulty: '', tags: '' });
        setSelectedIds([]);
        fetchQuestions(filters);
      }
    } catch (err) {
      showError(err.message || 'Bulk update failed');
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === TAB_ALL) fetchQuestions(filters);
    else if (activeTab === TAB_PYQ) fetchPYQQuestions();
    else if (activeTab === TAB_PASSAGE) fetchPassages();
    else if (activeTab === TAB_DI) fetchDIData();
    fetchStats();
  };

  // ═══ EXPORT ═══
  const handleExport = () => {
    const data = activeTab === TAB_PYQ ? pyqQuestions : questions;
    if (data.length === 0) return;
    const exportData = selectedIds.length > 0 ? data.filter(q => selectedIds.includes(q._id)) : data;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success(`${exportData.length} questions exported`);
  };

  // ═══ KEYBOARD SHORTCUTS ═══
  useEffect(() => {
    const handler = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      if (e.key === '/' && !isInput) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'n' && !isInput && !showForm) { e.preventDefault(); setEditingQuestion(null); setShowForm(true); }
      if (e.key === 'r' && !isInput && !showForm) { e.preventDefault(); handleRefresh(); }
      if (e.key === '?' && !isInput) { e.preventDefault(); setShowKeyboardHelp(true); }
      if (e.key === 'Escape') {
        if (showForm) setShowForm(false);
        if (showBulkEditModal) setShowBulkEditModal(false);
        if (showKeyboardHelp) setShowKeyboardHelp(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showForm, showBulkEditModal, showKeyboardHelp]);

  const tabs = [
    { id: TAB_ALL, label: { hi: 'सभी प्रश्न', en: 'All Questions' }, icon: Layers, count: stats?.total },
    { id: TAB_PYQ, label: { hi: 'PYQ प्रश्न', en: 'PYQ Questions' }, icon: Star, count: null, highlight: true },
    { id: TAB_PASSAGE, label: { hi: 'गद्यांश', en: 'Passages' }, icon: BookOpen, count: stats?.passageCount },
    { id: TAB_DI, label: { hi: 'डेटा व्याख्या', en: 'Data Interpretation' }, icon: BarChart2, count: stats?.diCount }
  ];

  return (
    <Layout>
      {({ language }) => {
        const tl = (h, e) => language === 'hi' ? h : e;

        return (
          <div className="space-y-6">
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                  {tl('प्रश्न बैंक', 'Question Bank')}
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-[10px] rounded-full font-bold shadow-lg">
                    ADVANCED
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-secondary-400 mt-1 text-sm">
                  {tl('प्रश्नों को देखें, खोजें, संपादित करें और प्रबंधित करें', 'View, search, edit and manage all questions')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowKeyboardHelp(true)}
                  className="p-2.5 bg-gray-100 dark:bg-secondary-700 rounded-xl hover:bg-gray-200 transition-colors" title="Keyboard shortcuts (?)">
                  <Keyboard className="w-4 h-4 text-gray-500" />
                </button>
                <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
                  {tl('निर्यात', 'Export')}
                </Button>
                <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleRefresh} disabled={loading}>
                  {tl('रीफ्रेश', 'Refresh')}
                </Button>
                <Button variant="primary" icon={Plus} onClick={() => { setEditingQuestion(null); setShowForm(true); }}>
                  {tl('प्रश्न जोड़ें', 'Add Question')}
                </Button>
              </div>
            </div>

            {/* ═══ STATS BAR ═══ */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: tl('कुल प्रश्न', 'Total Questions'), value: stats.total || 0, icon: Layers, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 border-blue-200' },
                  { label: tl('गद्यांश सेट', 'Passage Sets'), value: stats.passageCount || 0, icon: BookOpen, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 border-amber-200' },
                  { label: tl('DI सेट', 'DI Sets'), value: stats.diCount || 0, icon: BarChart2, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 border-purple-200' },
                  { label: tl('इस सप्ताह', 'This Week'), value: stats.recentAdditions || 0, icon: Zap, gradient: 'from-green-500 to-green-600', bg: 'bg-green-50 border-green-200' },
                  { label: tl('MCQ', 'MCQ'), value: stats.byType?.mcq || 0, icon: CheckCircle2, gradient: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
                  { label: tl('PYQ', 'PYQ'), value: stats.byType?.pyq || '—', icon: Star, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 border-orange-200' }
                ].map((s, i) => (
                  <div key={i} className={`rounded-2xl border p-3 ${s.bg} dark:bg-secondary-800 dark:border-secondary-700 transition-all hover:shadow-md`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md`}>
                        <s.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{s.value}</div>
                        <div className="text-[10px] text-gray-500 font-semibold uppercase">{s.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ TABS ═══ */}
            <div className="border-b border-gray-200 dark:border-secondary-700">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap
                        ${isActive
                          ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-secondary-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-800'
                        }`}>
                      <Icon className={`w-4 h-4 ${tab.highlight && isActive ? 'fill-current' : ''}`} />
                      {language === 'hi' ? tab.label.hi : tab.label.en}
                      {tab.count !== undefined && tab.count !== null && (
                        <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full tabular-nums
                          ${isActive ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-secondary-300'}`}>
                          {tab.count}
                        </span>
                      )}
                      {tab.highlight && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-amber-100 text-amber-700">PYQ</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ BULK ACTIONS BAR ═══ */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-bold text-primary-700">
                  {selectedIds.length} {tl('चयनित', 'selected')}
                </span>
                <div className="flex-1" />
                <Button variant="outline" size="sm" icon={Edit2} onClick={() => setShowBulkEditModal(true)}>
                  {tl('बल्क संपादन', 'Bulk Edit')}
                </Button>
                <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
                  {tl('निर्यात', 'Export')}
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleBulkDelete(selectedIds)}>
                  {tl('हटाएं', 'Delete')}
                </Button>
              </div>
            )}

            {/* ═══ FILTERS ═══ */}
            <QuestionFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleFilterReset}
              syllabus={syllabus}
              language={language}
              ref={searchRef}
            />

            {/* ═══ TAB CONTENT ═══ */}
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
                testUsageMap={testUsageMap}
                showTestUsage={true}
                showQuality={true}
              />
            )}

            {activeTab === TAB_PYQ && (
              <QuestionList
                questions={pyqQuestions}
                loading={pyqLoading}
                language={language}
                pagination={pyqPagination}
                onPageChange={(page) => fetchPYQQuestions(page)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                selectable={true}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                testUsageMap={testUsageMap}
                showTestUsage={true}
                showQuality={true}
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

            {/* ═══ QUESTION FORM MODAL ═══ */}
            <QuestionForm
              isOpen={showForm}
              onClose={() => { setShowForm(false); setEditingQuestion(null); }}
              onSubmit={handleSubmitQuestion}
              initialData={editingQuestion}
              syllabus={syllabus}
              loading={formLoading}
              language={language}
            />

            {/* ═══ BULK EDIT MODAL ═══ */}
            <Modal
              isOpen={showBulkEditModal}
              onClose={() => setShowBulkEditModal(false)}
              title={tl('बल्क संपादन', 'Bulk Edit')}
              titleHi={`${selectedIds.length} ${tl('प्रश्न', 'questions')}`}
              size="md"
              footer={
                <>
                  <Button variant="secondary" onClick={() => setShowBulkEditModal(false)}>{tl('रद्द', 'Cancel')}</Button>
                  <Button variant="primary" onClick={handleBulkEdit} loading={bulkEditLoading}>{tl('अपडेट करें', 'Update')}</Button>
                </>
              }
            >
              <div className="space-y-4">
                <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-sm font-bold text-primary-700">
                    {selectedIds.length} {tl('प्रश्नों को अपडेट किया जाएगा', 'questions will be updated')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">{tl('कठिनाई', 'Difficulty')}</label>
                  <select value={bulkEditData.difficulty} onChange={e => setBulkEditData(p => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm">
                    <option value="">{tl('बदलें नहीं', 'No change')}</option>
                    <option value="easy">{tl('आसान', 'Easy')}</option>
                    <option value="medium">{tl('मध्यम', 'Medium')}</option>
                    <option value="hard">{tl('कठिन', 'Hard')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">{tl('टैग जोड़ें (कॉमा)', 'Add Tags (comma)')}</label>
                  <input type="text" value={bulkEditData.tags} onChange={e => setBulkEditData(p => ({ ...p, tags: e.target.value }))}
                    placeholder={tl('टैग1, टैग2', 'tag1, tag2')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm" />
                </div>
              </div>
            </Modal>

            {/* ═══ KEYBOARD SHORTCUTS MODAL ═══ */}
            <Modal isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)}
              title={tl('कीबोर्ड शॉर्टकट', 'Keyboard Shortcuts')} size="sm">
              <div className="space-y-2">
                {[
                  { key: '/', desc: tl('खोज फोकस', 'Focus search') },
                  { key: 'N', desc: tl('नया प्रश्न', 'New question') },
                  { key: 'R', desc: tl('रीफ्रेश', 'Refresh') },
                  { key: '?', desc: tl('शॉर्टकट दिखाएं', 'Show shortcuts') },
                  { key: 'Esc', desc: tl('मोडल बंद', 'Close modal') },
                ].map((sc, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{sc.desc}</span>
                    <kbd className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-700">{sc.key}</kbd>
                  </div>
                ))}
              </div>
            </Modal>
          </div>
        );
      }}
    </Layout>
  );
};

export default QuestionBank;