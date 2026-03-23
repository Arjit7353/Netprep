// client/src/pages/PYQQuestionBank.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, Filter, RefreshCw, Edit2, Save, X, ChevronLeft,
  ChevronRight, Eye, CheckCircle, AlertTriangle, Library,
  ArrowUpDown, Loader, Info, ClipboardList, RotateCcw,
  Download, SlidersHorizontal, Columns, ChevronDown,
  BookOpen, Tag, Hash, Zap, FileText, List, Grid3X3,
  ArrowUp, ArrowDown, Copy, Star, CheckSquare, Square,
  Minus, AlertCircle, Sparkles, BookMarked, GraduationCap,
  BarChart3, TrendingUp, Filter as FilterIcon, Eye as EyeIcon
} from 'lucide-react';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import questionService from '../services/questionService';

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const TYPE_LABELS = {
  mcq:              { en: 'MCQ',       hi: 'बहुविकल्पीय',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     dot: 'bg-blue-500' },
  assertion_reason: { en: 'A-R',       hi: 'अभिकथन-कारण',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', dot: 'bg-purple-500' },
  match_following:  { en: 'Match',     hi: 'सुमेलन',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   dot: 'bg-green-500' },
  sequence_order:   { en: 'Sequence',  hi: 'क्रम',            color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500' },
  statement_based:  { en: 'Statement', hi: 'कथन',             color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',       dot: 'bg-pink-500' },
  passage:          { en: 'Passage',   hi: 'गद्यांश',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   dot: 'bg-amber-500' },
  passage_based:    { en: 'Passage',   hi: 'गद्यांश',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   dot: 'bg-amber-500' },
  di_table:         { en: 'DI Table',  hi: 'DI तालिका',       color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',       dot: 'bg-cyan-500' },
  di_bar_chart:     { en: 'Bar Chart', hi: 'बार चार्ट',       color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', dot: 'bg-indigo-500' },
  di_pie_chart:     { en: 'Pie Chart', hi: 'पाई चार्ट',       color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', dot: 'bg-violet-500' },
  di_caselet:       { en: 'Caselet',   hi: 'केसलेट',          color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' },
};

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   hi: 'आसान',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'bg-emerald-500', pct: 33 },
  medium: { label: 'Medium', hi: 'मध्यम', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',       bar: 'bg-amber-500',   pct: 66 },
  hard:   { label: 'Hard',   hi: 'कठिन',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',               bar: 'bg-red-500',     pct: 100 },
};

const DEFAULT_FILTERS = {
  page: 1, limit: 20, paper: 'paper2',
  year: '', session: '', shift: '',
  unitId: '', chapter: '', topic: '', type: '',
  difficulty: '', hasContent: '', search: '',
  sortBy: 'qNo', sortOrder: 'asc',
};

const DEFAULT_COLUMNS = {
  qNo: true, year: true, type: true, preview: true,
  unit: true, difficulty: true, content: true, tests: true,
};

// ═══════════════════════════════════════════════════════
// MINI COMPONENTS
// ═══════════════════════════════════════════════════════

const StatCard = ({ label, value, color, icon: Icon, subtitle }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-default ${color}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-3xl font-black tracking-tight tabular-nums">{value ?? '—'}</div>
        <div className="text-[11px] font-semibold opacity-75 mt-1 truncate">{label}</div>
        {subtitle && <div className="text-[10px] opacity-50 mt-0.5">{subtitle}</div>}
      </div>
      {Icon && <div className="opacity-15 flex-shrink-0 ml-2"><Icon className="w-10 h-10" /></div>}
    </div>
  </div>
);

const TypeBadge = ({ type, language }) => {
  const info = TYPE_LABELS[type] || { en: type, hi: type, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${info.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${info.dot}`} />
      {language === 'hi' ? info.hi : info.en}
    </span>
  );
};

const DiffBadge = ({ difficulty, language }) => {
  const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG.medium;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.color}`}>
        {language === 'hi' ? cfg.hi : cfg.label}
      </span>
      <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-secondary-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${cfg.pct}%` }} />
      </div>
    </div>
  );
};

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  return sortOrder === 'asc'
    ? <ArrowUp className="w-3 h-3 text-primary-600 dark:text-primary-400" />
    : <ArrowDown className="w-3 h-3 text-primary-600 dark:text-primary-400" />;
};

const ExpandedRow = ({ q, language, colSpan }) => (
  <tr className="bg-gradient-to-r from-primary-50/40 via-violet-50/20 to-transparent dark:from-primary-950/20 dark:via-violet-950/10 dark:to-transparent">
    <td colSpan={colSpan} className="px-5 py-3">
      <div className="space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {q.questionPreviewHi && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
              <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 mb-1.5 uppercase tracking-wider">हिंदी</p>
              <p className="text-xs text-gray-800 dark:text-secondary-200 leading-relaxed line-clamp-3">{q.questionPreviewHi}</p>
            </div>
          )}
          {q.questionPreviewEn && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-wider">English</p>
              <p className="text-xs text-gray-800 dark:text-secondary-200 leading-relaxed line-clamp-3">{q.questionPreviewEn}</p>
            </div>
          )}
          {!q.questionPreviewHi && !q.questionPreviewEn && q.questionPreview && (
            <div className="p-3 bg-gray-50 dark:bg-secondary-900/50 rounded-xl border border-gray-200 dark:border-secondary-700 col-span-2">
              <p className="text-xs text-gray-700 dark:text-secondary-300 leading-relaxed">{q.questionPreview}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {q.unitName && q.unitName !== q.unitId && (
            <span className="flex items-center gap-1 text-[10px] bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 px-2 py-1 rounded-lg text-gray-600 dark:text-secondary-400">
              <GraduationCap className="w-3 h-3 text-primary-500" />
              {language === 'hi' && q.unitNameHi ? q.unitNameHi : q.unitName}
            </span>
          )}
          {q.chapter && (
            <span className="flex items-center gap-1 text-[10px] bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 px-2 py-1 rounded-lg text-gray-600 dark:text-secondary-400">
              <BookOpen className="w-3 h-3 text-violet-500" />
              {language === 'hi' && q.chapterHi ? q.chapterHi : q.chapter}
            </span>
          )}
          {q.topic && (
            <span className="flex items-center gap-1 text-[10px] bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 px-2 py-1 rounded-lg text-gray-600 dark:text-secondary-400">
              <Tag className="w-3 h-3 text-green-500" />
              {language === 'hi' && q.topicHi ? q.topicHi : q.topic}
            </span>
          )}
          {q.importance && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400">
              <Star className="w-3 h-3" />
              Importance: {q.importance}/5
            </span>
          )}
          {q.optionCount > 0 && (
            <span className="text-[10px] bg-gray-50 dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 px-2 py-1 rounded-lg text-gray-500 dark:text-secondary-400">
              {q.optionCount} options
            </span>
          )}
          {(q.keyTerms || []).slice(0, 3).map((kt, i) => (
            <span key={i} className="text-[10px] bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-2 py-0.5 rounded-lg text-primary-600 dark:text-primary-400">
              #{kt}
            </span>
          ))}
        </div>
      </div>
    </td>
  </tr>
);

// ═══════════════════════════════════════════════════════
// EXPORT UTILS
// ═══════════════════════════════════════════════════════

const exportToCSV = (questions, language) => {
  const headers = ['Q#', 'Year', 'Session', 'Shift', 'Type', 'Question Preview', 'Unit ID', 'Unit Name', 'Chapter', 'Topic', 'Difficulty', 'Importance', 'Has Content', 'Tests Used'];
  const rows = questions.map(q => [
    q.qNo, q.year, q.session, q.shift || '',
    (TYPE_LABELS[q.type] || {})[language === 'hi' ? 'hi' : 'en'] || q.type,
    `"${(q.questionPreview || '').replace(/"/g, '""')}"`,
    q.unitId || '',
    `"${(q.unitName || '').replace(/"/g, '""')}"`,
    `"${(q.chapter || '').replace(/"/g, '""')}"`,
    `"${(q.topic || '').replace(/"/g, '""')}"`,
    q.difficulty || '', q.importance || '',
    q.hasContent ? 'Yes' : 'No',
    q.usedInTestCount || 0,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pyq_questions_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const PYQQuestionBank = ({ language = 'en' }) => {
  const { success, error: showError, info } = useToast();
  const searchRef = useRef(null);

  // ── Data ──
  const [questions, setQuestions]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [pagination, setPagination]         = useState(null);
  const [availableFilters, setAvailableFilters] = useState({});
  const [stats, setStats]                   = useState(null);

  // ── UI ──
  const [filters, setFilters]               = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters]       = useState(false);
  const [viewMode, setViewMode]             = useState('table');
  const [columns, setColumns]               = useState(DEFAULT_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [expandedRows, setExpandedRows]     = useState(new Set());
  const [selectedIds, setSelectedIds]       = useState([]);
  const [bulkAction, setBulkAction]         = useState('');

  // ── Edit ──
  const [editModalOpen, setEditModalOpen]   = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [editLoading, setEditLoading]       = useState(false);
  const [editLinkedTests, setEditLinkedTests] = useState([]);
  const [editTab, setEditTab]               = useState('content');

  // ── Preview ──
  const [previewOpen, setPreviewOpen]       = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // ── Derived ──
  const activeFilterCount = useMemo(() => [
    filters.year, filters.session, filters.unitId, filters.type,
    filters.difficulty, filters.hasContent, filters.chapter, filters.topic,
  ].filter(Boolean).length, [filters]);

  const visibleColCount = Object.values(columns).filter(Boolean).length + 2;

  const selectionState = useMemo(() => {
    if (selectedIds.length === 0) return 'none';
    if (selectedIds.length === questions.length) return 'all';
    return 'some';
  }, [selectedIds.length, questions.length]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '/' || (e.ctrlKey && e.key === 'f')) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setEditModalOpen(false); setPreviewOpen(false); setShowColumnPicker(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ═══════════════════════════════════════════════════
  // FETCH
  // ═══════════════════════════════════════════════════
  const fetchQuestions = useCallback(async (overrideFilters = null) => {
    setLoading(true);
    try {
      const f = overrideFilters || filters;
      const res = await questionService.getPYQQuestionBank(f);
      if (res.success) {
        setQuestions(res.data || []);
        setPagination(res.pagination || null);
        if (res.filters) setAvailableFilters(res.filters);
        if (res.stats) setStats(res.stats);
        setExpandedRows(new Set());
      }
    } catch (err) {
      showError(err.message || 'Failed to load PYQ questions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchQuestions(); }, [filters.page, filters.sortBy, filters.sortOrder]);

  // ── Handlers ──
  const handleSearch = useCallback(() => {
    const newF = { ...pendingFilters, page: 1 };
    setFilters(newF);
    fetchQuestions(newF);
  }, [pendingFilters]);

  const handlePendingChange = useCallback((key, value) => {
    setPendingFilters(p => ({ ...p, [key]: value, page: 1 }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    const newF = { ...pendingFilters, page: 1 };
    setFilters(newF);
    fetchQuestions(newF);
  }, [pendingFilters]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPendingFilters(DEFAULT_FILTERS);
    fetchQuestions(DEFAULT_FILTERS);
  }, []);

  const handleSort = useCallback((field) => {
    setFilters(p => ({
      ...p, sortBy: field,
      sortOrder: p.sortBy === field && p.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // ── Selection ──
  const toggleSelect = useCallback((pyqId) =>
    setSelectedIds(p => p.includes(pyqId) ? p.filter(id => id !== pyqId) : [...p, pyqId]), []);

  const toggleSelectAll = useCallback(() =>
    setSelectedIds(selectionState === 'all' ? [] : questions.map(q => q.pyqId)), [selectionState, questions]);

  // ── Expand ──
  const toggleExpand = useCallback((pyqId) => {
    setExpandedRows(p => { const n = new Set(p); n.has(pyqId) ? n.delete(pyqId) : n.add(pyqId); return n; });
  }, []);

  // ── Bulk ──
  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'export') {
      exportToCSV(questions.filter(q => selectedIds.includes(q.pyqId)), language);
      info(`Exported ${selectedIds.length} questions`); return;
    }
    if (bulkAction === 'export_all') {
      exportToCSV(questions, language);
      info(`Exported ${questions.length} questions`); return;
    }
    if (bulkAction.startsWith('diff_')) {
      const diff = bulkAction.replace('diff_', '');
      try {
        await questionService.bulkUpdatePYQQuestions(selectedIds, { difficulty: diff });
        success(`Updated ${selectedIds.length} questions → ${diff}`);
        setSelectedIds([]); fetchQuestions();
      } catch (err) { showError(err.message); }
    }
  };

  // ── Edit ──
  const openEdit = useCallback(async (q) => {
    setPreviewLoading(true);
    try {
      const res = await questionService.getPYQQuestionById(q.pyqId);
      if (res.success) {
        const fullQ = res.data.question;
        setEditingQuestion({ ...q, ...res.data });
        setEditLinkedTests(res.data.linkedTests || []);
        setEditForm({
          questionTextHi: fullQ.questionTextHi || '',
          questionTextEn: fullQ.questionTextEn || '',
          optionsHi: fullQ.optionsHi || [],
          optionsEn: fullQ.optionsEn || [],
          correctAnswer: fullQ.correctAnswer ?? null,
          explanationHi: fullQ.explanationHi || '',
          explanationEn: fullQ.explanationEn || '',
          assertionHi: fullQ.assertionHi || '',
          assertionEn: fullQ.assertionEn || '',
          reasonHi: fullQ.reasonHi || '',
          reasonEn: fullQ.reasonEn || '',
          statementsHi: fullQ.statementsHi || [],
          statementsEn: fullQ.statementsEn || [],
          correctStatements: fullQ.correctStatements || [],
          listAHi: fullQ.listAHi || [],
          listAEn: fullQ.listAEn || [],
          listBHi: fullQ.listBHi || [],
          listBEn: fullQ.listBEn || [],
          correctMatch: fullQ.correctMatch || [],
          itemsHi: fullQ.itemsHi || [],
          itemsEn: fullQ.itemsEn || [],
          correctOrder: fullQ.correctOrder || [],
          passageHi: fullQ.passageHi || '',
          passageEn: fullQ.passageEn || '',
          difficulty: fullQ.difficulty || 'medium',
          importance: fullQ.importance || 3,
          chapter: fullQ.chapter || '',
          topic: fullQ.topic || '',
          subtopic: fullQ.subtopic || '',
          type: fullQ.type || 'mcq',
          keyTerms: fullQ.keyTerms || [],
        });
        setEditTab('content');
        setEditModalOpen(true);
      }
    } catch { showError('Failed to load question details'); }
    finally { setPreviewLoading(false); }
  }, []);

  const handleEditFormChange = useCallback((field, value) =>
    setEditForm(p => ({ ...p, [field]: value })), []);

  const handleOptionChange = useCallback((lang, index, value) => {
    const field = lang === 'hi' ? 'optionsHi' : 'optionsEn';
    setEditForm(p => ({ ...p, [field]: p[field].map((o, i) => i === index ? value : o) }));
  }, []);

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setEditLoading(true);
    try {
      const res = await questionService.updatePYQQuestion(editingQuestion.pyqId, editForm);
      if (res.success) {
        const n = res.data?.linkedTestsUpdated || 0;
        success(`Q#${editingQuestion.qNo} updated` + (n > 0 ? ` · ${n} test(s) auto-synced` : ''));
        setEditModalOpen(false); setEditingQuestion(null); fetchQuestions();
      }
    } catch (err) { showError(err.message || 'Failed to save'); }
    finally { setEditLoading(false); }
  };

  // ── Preview ──
  const openPreview = useCallback(async (q) => {
    setPreviewLoading(true); setPreviewOpen(true); setPreviewQuestion(null);
    try {
      const res = await questionService.getPYQQuestionById(q.pyqId);
      if (res.success) setPreviewQuestion(res.data);
    } catch { showError('Failed to load preview'); }
    finally { setPreviewLoading(false); }
  }, []);

  // ── Helpers ──
  const getUnitDisplayName = useCallback((q) => {
    if (language === 'hi' && q.unitNameHi && q.unitNameHi !== q.unitId) return q.unitNameHi;
    if (q.unitName && q.unitName !== q.unitId) return q.unitName;
    return q.unitId || '—';
  }, [language]);

  const getChapterDisplay = useCallback((q) => {
    if (language === 'hi' && q.chapterHi) return q.chapterHi;
    return q.chapter || '';
  }, [language]);

  const getTopicDisplay = useCallback((q) => {
    if (language === 'hi' && q.topicHi) return q.topicHi;
    return q.topic || '';
  }, [language]);

  // Dependent filter options
  const filteredChapters = useMemo(() =>
    (availableFilters.chapters || [])
      .filter(c => !pendingFilters.unitId || c.unitId === pendingFilters.unitId)
      .slice(0, 50),
    [availableFilters.chapters, pendingFilters.unitId]);

  const filteredTopics = useMemo(() =>
    (availableFilters.topics || [])
      .filter(t =>
        (!pendingFilters.unitId || t.unitId === pendingFilters.unitId) &&
        (!pendingFilters.chapter || t.chapter === pendingFilters.chapter)
      )
      .slice(0, 80),
    [availableFilters.topics, pendingFilters.unitId, pendingFilters.chapter]);

  // ── Styles ──
  const selectCls = "px-3 py-2 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 w-full transition-colors";
  const inputCls  = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-colors";
  const textareaCls = `${inputCls} resize-y`;
  const thCls = "px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-secondary-400 whitespace-nowrap select-none";

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ══ HEADER ══ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-violet-600 rounded-2xl blur-xl opacity-30" />
            <div className="relative p-3 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl shadow-lg">
              <Library className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {language === 'hi' ? 'PYQ प्रश्न बैंक' : 'PYQ Question Bank'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
              {language === 'hi'
                ? 'खोजें, संपादित करें — लिंक्ड टेस्ट में ऑटो-सिंक'
                : 'Search, filter, edit · auto-syncs to linked tests'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 dark:text-secondary-500 bg-gray-100 dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 font-mono">
            / search
          </kbd>
          <Button variant="outline" size="sm" icon={Download}
            onClick={() => exportToCSV(questions, language)} disabled={questions.length === 0}>
            <span className="hidden sm:inline">{language === 'hi' ? 'निर्यात' : 'Export'}</span>
          </Button>
          <Button variant="outline" size="sm" icon={RefreshCw}
            onClick={() => fetchQuestions()} disabled={loading}>
            <span className={`hidden sm:inline ${loading ? 'opacity-0' : ''}`}>
              {language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
            </span>
          </Button>
        </div>
      </div>

      {/* ══ STATS ══ */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label={language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
            value={stats.totalQuestions?.toLocaleString()}
            color="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/40 text-blue-700 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10 dark:text-blue-300"
            icon={Hash}
          />
          <StatCard
            label={language === 'hi' ? 'सामग्री सहित' : 'With Content'}
            value={stats.withContent?.toLocaleString()}
            subtitle={stats.totalQuestions ? `${Math.round((stats.withContent / stats.totalQuestions) * 100)}% complete` : ''}
            color="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/40 text-emerald-700 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-emerald-800/10 dark:text-emerald-300"
            icon={CheckCircle}
          />
          <StatCard
            label={language === 'hi' ? 'सामग्री रहित' : 'No Content'}
            value={stats.withoutContent?.toLocaleString()}
            color="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 text-amber-700 dark:border-amber-800 dark:from-amber-900/20 dark:to-amber-800/10 dark:text-amber-300"
            icon={AlertTriangle}
          />
          <StatCard
            label={language === 'hi' ? 'PYQ पेपर' : 'PYQ Papers'}
            value={stats.pyqPapers?.toLocaleString()}
            color="border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/40 text-violet-700 dark:border-violet-800 dark:from-violet-900/20 dark:to-violet-800/10 dark:text-violet-300"
            icon={FileText}
          />
        </div>
      )}

      {/* ══ SEARCH + TOOLBAR ══ */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        {/* Search row */}
        <div className="flex items-center gap-2 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={pendingFilters.search}
              onChange={e => handlePendingChange('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={language === 'hi' ? 'प्रश्न, विषय, कीवर्ड खोजें... (/ to focus)' : 'Search questions, topics, keywords... (/ to focus)'}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-gray-50 dark:bg-secondary-900 focus:bg-white dark:focus:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-secondary-500"
            />
            {pendingFilters.search && (
              <button onClick={() => { handlePendingChange('search', ''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">{language === 'hi' ? 'खोजें' : 'Search'}</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-secondary-700 hidden sm:block" />
          {/* Filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
              showFilters
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white dark:bg-secondary-800 text-gray-700 dark:text-secondary-300 border-gray-200 dark:border-secondary-600 hover:border-primary-300 hover:text-primary-600'
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'hi' ? 'फिल्टर' : 'Filters'}</span>
            {activeFilterCount > 0 && (
              <span className={`flex items-center justify-center w-4 h-4 text-[9px] font-black rounded-full flex-shrink-0 ${showFilters ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {/* Column picker */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-secondary-600 text-sm font-medium text-gray-700 dark:text-secondary-300 hover:border-primary-300 hover:text-primary-600 bg-white dark:bg-secondary-800 transition-all">
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'कॉलम' : 'Cols'}</span>
            </button>
            {showColumnPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl shadow-xl z-50 p-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">Show / Hide</p>
                  {Object.entries(columns).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer">
                      <input type="checkbox" checked={val}
                        onChange={() => setColumns(p => ({ ...p, [key]: !p[key] }))}
                        className="w-3.5 h-3.5 text-primary-600 rounded border-gray-300 dark:border-secondary-600" />
                      <span className="text-xs font-medium text-gray-700 dark:text-secondary-300 capitalize">{key === 'qNo' ? 'Q Number' : key}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* View mode */}
          <div className="flex items-center border border-gray-200 dark:border-secondary-600 rounded-xl overflow-hidden flex-shrink-0">
            <button onClick={() => setViewMode('table')}
              className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-secondary-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-secondary-700'}`}
              title="Normal">
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('compact')}
              className={`p-2.5 transition-colors ${viewMode === 'compact' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-secondary-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-secondary-700'}`}
              title="Compact">
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══ FILTER PANEL ══ */}
        {showFilters && (
          <div className="border-t border-gray-100 dark:border-secondary-700 bg-gray-50/60 dark:bg-secondary-900/40 p-4 space-y-4">
            {/* Row 1: Year, Session, Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                  {language === 'hi' ? 'वर्ष' : 'Year'}
                </label>
                <select value={pendingFilters.year} onChange={e => handlePendingChange('year', e.target.value)} className={selectCls}>
                  <option value="">{language === 'hi' ? 'सभी वर्ष' : 'All Years'}</option>
                  {(availableFilters.years || []).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                  {language === 'hi' ? 'सत्र' : 'Session'}
                </label>
                <select value={pendingFilters.session} onChange={e => handlePendingChange('session', e.target.value)} className={selectCls}>
                  <option value="">{language === 'hi' ? 'सभी सत्र' : 'All Sessions'}</option>
                  {(availableFilters.sessions || []).map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {language === 'hi' ? 'इकाई (Unit)' : 'Unit'}
                </label>
                <select
                  value={pendingFilters.unitId}
                  onChange={e => {
                    handlePendingChange('unitId', e.target.value);
                    handlePendingChange('chapter', '');
                    handlePendingChange('topic', '');
                  }}
                  className={selectCls}
                >
                  <option value="">{language === 'hi' ? 'सभी इकाई' : 'All Units'}</option>
                  {(availableFilters.units || []).map(u => {
                    const displayName = language === 'hi' && u.nameHi && u.nameHi !== u.id
                      ? u.nameHi
                      : u.name && u.name !== u.id
                      ? u.name
                      : u.id;
                    return (
                      <option key={u.id} value={u.id}>
                        {displayName} ({u.count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Row 2: Chapter, Topic, Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {language === 'hi' ? 'अध्याय (Chapter)' : 'Chapter'}
                  {pendingFilters.unitId && (
                    <span className="text-primary-500 text-[9px]">
                      ({filteredChapters.length})
                    </span>
                  )}
                </label>
                <select
                  value={pendingFilters.chapter}
                  onChange={e => {
                    handlePendingChange('chapter', e.target.value);
                    handlePendingChange('topic', '');
                  }}
                  className={selectCls}
                  disabled={filteredChapters.length === 0 && !pendingFilters.unitId}
                >
                  <option value="">{language === 'hi' ? 'सभी अध्याय' : 'All Chapters'}</option>
                  {filteredChapters.map((c, i) => (
                    <option key={i} value={c.chapter}>
                      {c.chapter.length > 40 ? c.chapter.substring(0, 40) + '…' : c.chapter} ({c.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {language === 'hi' ? 'विषय (Topic)' : 'Topic'}
                  {filteredTopics.length > 0 && (
                    <span className="text-primary-500 text-[9px]">({filteredTopics.length})</span>
                  )}
                </label>
                <select
                  value={pendingFilters.topic}
                  onChange={e => handlePendingChange('topic', e.target.value)}
                  className={selectCls}
                  disabled={filteredTopics.length === 0}
                >
                  <option value="">{language === 'hi' ? 'सभी विषय' : 'All Topics'}</option>
                  {filteredTopics.map((t, i) => (
                    <option key={i} value={t.topic}>
                      {t.topic.length > 40 ? t.topic.substring(0, 40) + '…' : t.topic} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                  {language === 'hi' ? 'प्रकार' : 'Question Type'}
                </label>
                <select value={pendingFilters.type} onChange={e => handlePendingChange('type', e.target.value)} className={selectCls}>
                  <option value="">{language === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
                  {(availableFilters.types || []).map(t => (
                    <option key={t.type} value={t.type}>
                      {(TYPE_LABELS[t.type] || {})[language === 'hi' ? 'hi' : 'en'] || t.type} ({t.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Difficulty, Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                  {language === 'hi' ? 'कठिनाई' : 'Difficulty'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { val: '', label: language === 'hi' ? 'सभी' : 'All', cls: 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300' },
                    { val: 'easy', label: language === 'hi' ? 'आसान' : 'Easy', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
                    { val: 'medium', label: language === 'hi' ? 'मध्यम' : 'Med', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
                    { val: 'hard', label: language === 'hi' ? 'कठिन' : 'Hard', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
                  ].map(d => (
                    <button key={d.val} onClick={() => handlePendingChange('difficulty', d.val)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border-2 transition-all ${
                        pendingFilters.difficulty === d.val
                          ? `${d.cls} border-current scale-105 shadow-sm`
                          : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-500 hover:border-gray-300'
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                  {language === 'hi' ? 'सामग्री स्थिति' : 'Content Status'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: '', label: language === 'hi' ? 'सभी' : 'All' },
                    { val: 'true', label: language === 'hi' ? 'सहित' : 'Ready' },
                    { val: 'false', label: language === 'hi' ? 'रहित' : 'Empty' },
                  ].map(c => (
                    <button key={c.val} onClick={() => handlePendingChange('hasContent', c.val)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border-2 transition-all ${
                        pendingFilters.hasContent === c.val
                          ? c.val === 'true'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 scale-105'
                            : c.val === 'false'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 scale-105'
                            : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 border-gray-300 scale-105'
                          : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-500 hover:border-gray-300'
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="primary" size="sm" onClick={handleApplyFilters} className="flex-1">
                  <FilterIcon className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'hi' ? 'लागू करें' : 'Apply'}
                </Button>
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleResetFilters}>
                  {language === 'hi' ? 'रीसेट' : 'Reset'}
                </Button>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-200 dark:border-secondary-700">
                {filters.year && <FilterChip label={`Year: ${filters.year}`} onRemove={() => { handlePendingChange('year',''); setFilters(p=>({...p,year:'',page:1})); fetchQuestions({...filters,year:'',page:1}); }} />}
                {filters.session && <FilterChip label={`Session: ${filters.session}`} onRemove={() => { handlePendingChange('session',''); setFilters(p=>({...p,session:'',page:1})); fetchQuestions({...filters,session:'',page:1}); }} />}
                {filters.unitId && (
                  <FilterChip
                    label={`Unit: ${(availableFilters.units||[]).find(u=>u.id===filters.unitId)?.name || filters.unitId}`}
                    onRemove={() => { handlePendingChange('unitId',''); handlePendingChange('chapter',''); handlePendingChange('topic',''); setFilters(p=>({...p,unitId:'',chapter:'',topic:'',page:1})); fetchQuestions({...filters,unitId:'',chapter:'',topic:'',page:1}); }}
                  />
                )}
                {filters.chapter && <FilterChip label={`Chapter: ${filters.chapter.substring(0,20)}…`} onRemove={() => { handlePendingChange('chapter',''); handlePendingChange('topic',''); setFilters(p=>({...p,chapter:'',topic:'',page:1})); fetchQuestions({...filters,chapter:'',topic:'',page:1}); }} />}
                {filters.topic && <FilterChip label={`Topic: ${filters.topic.substring(0,20)}…`} onRemove={() => { handlePendingChange('topic',''); setFilters(p=>({...p,topic:'',page:1})); fetchQuestions({...filters,topic:'',page:1}); }} />}
                {filters.type && <FilterChip label={`Type: ${(TYPE_LABELS[filters.type]||{}).en||filters.type}`} onRemove={() => { handlePendingChange('type',''); setFilters(p=>({...p,type:'',page:1})); fetchQuestions({...filters,type:'',page:1}); }} />}
                {filters.difficulty && <FilterChip label={`Diff: ${filters.difficulty}`} onRemove={() => { handlePendingChange('difficulty',''); setFilters(p=>({...p,difficulty:'',page:1})); fetchQuestions({...filters,difficulty:'',page:1}); }} />}
                {filters.hasContent && <FilterChip label={`Content: ${filters.hasContent==='true'?'Ready':'Empty'}`} onRemove={() => { handlePendingChange('hasContent',''); setFilters(p=>({...p,hasContent:'',page:1})); fetchQuestions({...filters,hasContent:'',page:1}); }} />}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ BULK ACTION BAR ══ */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-2xl">
          <div className="flex items-center gap-2 flex-shrink-0">
            <CheckSquare className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
              {selectedIds.length} {language === 'hi' ? 'चयनित' : 'selected'}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
              className="px-3 py-1.5 text-sm border border-primary-200 dark:border-primary-700 rounded-xl bg-white dark:bg-secondary-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40">
              <option value="">{language === 'hi' ? 'कार्य चुनें...' : 'Choose action...'}</option>
              <option value="export">{language === 'hi' ? 'चयनित CSV निर्यात' : 'Export Selected CSV'}</option>
              <option value="export_all">{language === 'hi' ? 'सभी CSV निर्यात' : 'Export All CSV'}</option>
              <option value="diff_easy">{language === 'hi' ? 'कठिनाई → आसान' : 'Set → Easy'}</option>
              <option value="diff_medium">{language === 'hi' ? 'कठिनाई → मध्यम' : 'Set → Medium'}</option>
              <option value="diff_hard">{language === 'hi' ? 'कठिनाई → कठिन' : 'Set → Hard'}</option>
            </select>
            <Button variant="primary" size="sm" onClick={handleBulkAction} disabled={!bulkAction}>
              {language === 'hi' ? 'लागू करें' : 'Apply'}
            </Button>
          </div>
          <button onClick={() => { setSelectedIds([]); setBulkAction(''); }}
            className="p-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ══ TABLE ══ */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        {/* Info bar */}
        {!loading && questions.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 dark:bg-secondary-900/40 border-b border-gray-100 dark:border-secondary-700">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-secondary-400 font-medium">
                {pagination
                  ? `${((pagination.page - 1) * pagination.limit) + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} ${language === 'hi' ? 'में से' : 'of'} ${pagination.total?.toLocaleString()}`
                  : `${questions.length} ${language === 'hi' ? 'प्रश्न' : 'questions'}`}
              </span>
              {activeFilterCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 px-2 py-0.5 rounded-full">
                  <FilterIcon className="w-2.5 h-2.5" />
                  {language === 'hi' ? 'फिल्टर्ड' : 'Filtered'}
                </span>
              )}
            </div>
            <select
              value={filters.limit}
              onChange={e => {
                const newF = { ...filters, limit: parseInt(e.target.value), page: 1 };
                setFilters(newF); fetchQuestions(newF);
              }}
              className="text-xs border border-gray-200 dark:border-secondary-600 rounded-lg px-2 py-1 bg-white dark:bg-secondary-800 text-gray-700 dark:text-secondary-300 focus:outline-none">
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-14 h-14 border-4 border-primary-200 dark:border-primary-900 rounded-full animate-spin border-t-primary-600" />
              <Sparkles className="w-6 h-6 text-primary-600 absolute inset-0 m-auto" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-secondary-200">
                {language === 'hi' ? 'प्रश्न लोड हो रहे हैं...' : 'Loading questions...'}
              </p>
              <p className="text-xs text-gray-400 dark:text-secondary-500 mt-1">
                {language === 'hi' ? 'कृपया प्रतीक्षा करें' : 'Please wait'}
              </p>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 bg-gray-200 dark:bg-secondary-700 rounded-full blur-2xl opacity-60" />
              <Library className="relative w-16 h-16 text-gray-300 dark:text-secondary-600" />
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-secondary-200">
              {language === 'hi' ? 'कोई प्रश्न नहीं मिला' : 'No questions found'}
            </p>
            <p className="text-sm text-gray-400 dark:text-secondary-500 mt-1 max-w-sm mx-auto">
              {language === 'hi' ? 'फिल्टर बदलें या PYQ डेटा आयात करें' : 'Try adjusting filters or import PYQ data'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={handleResetFilters}
                className="mt-4 text-sm text-primary-600 dark:text-primary-400 font-bold hover:underline">
                {language === 'hi' ? 'सभी फिल्टर हटाएं' : 'Clear all filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-secondary-900/60 border-b border-gray-200 dark:border-secondary-700">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <button onClick={toggleSelectAll} className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-primary-600 transition-colors">
                      {selectionState === 'all' ? <CheckSquare className="w-4 h-4 text-primary-600" />
                        : selectionState === 'some' ? <Minus className="w-4 h-4 text-primary-400" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  {columns.qNo && (
                    <th className={`${thCls} text-left cursor-pointer hover:text-primary-600`} onClick={() => handleSort('qNo')}>
                      <div className="flex items-center gap-1">Q# <SortIcon field="qNo" sortBy={filters.sortBy} sortOrder={filters.sortOrder} /></div>
                    </th>
                  )}
                  {columns.year && (
                    <th className={`${thCls} text-left cursor-pointer hover:text-primary-600`} onClick={() => handleSort('year')}>
                      <div className="flex items-center gap-1">{language === 'hi' ? 'वर्ष' : 'Year'} <SortIcon field="year" sortBy={filters.sortBy} sortOrder={filters.sortOrder} /></div>
                    </th>
                  )}
                  {columns.type && <th className={`${thCls} text-left`}>{language === 'hi' ? 'प्रकार' : 'Type'}</th>}
                  {columns.preview && <th className={`${thCls} text-left`}>{language === 'hi' ? 'प्रश्न' : 'Question Preview'}</th>}
                  {columns.unit && (
                    <th className={`${thCls} text-left cursor-pointer hover:text-primary-600`} onClick={() => handleSort('unit')}>
                      <div className="flex items-center gap-1">
                        {language === 'hi' ? 'इकाई / अध्याय' : 'Unit / Chapter'}
                        <SortIcon field="unit" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                      </div>
                    </th>
                  )}
                  {columns.difficulty && (
                    <th className={`${thCls} text-center cursor-pointer hover:text-primary-600`} onClick={() => handleSort('difficulty')}>
                      <div className="flex items-center justify-center gap-1">
                        {language === 'hi' ? 'कठिनाई' : 'Diff'}
                        <SortIcon field="difficulty" sortBy={filters.sortBy} sortOrder={filters.sortOrder} />
                      </div>
                    </th>
                  )}
                  {columns.content && <th className={`${thCls} text-center`}>{language === 'hi' ? 'सामग्री' : 'Content'}</th>}
                  {columns.tests && <th className={`${thCls} text-center`}>{language === 'hi' ? 'टेस्ट' : 'Tests'}</th>}
                  <th className={`${thCls} text-right`}>{language === 'hi' ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-secondary-700/50">
                {questions.map((q) => {
                  const isSelected  = selectedIds.includes(q.pyqId);
                  const isExpanded  = expandedRows.has(q.pyqId);
                  const unitDisplay = getUnitDisplayName(q);
                  const chapDisplay = getChapterDisplay(q);
                  const topicDisplay = getTopicDisplay(q);

                  return (
                    <React.Fragment key={q.pyqId}>
                      <tr className={`group transition-colors duration-100 ${
                        isSelected ? 'bg-primary-50/70 dark:bg-primary-950/25'
                        : isExpanded ? 'bg-violet-50/30 dark:bg-violet-950/10'
                        : 'hover:bg-gray-50/70 dark:hover:bg-secondary-700/20'}`}>

                        {/* Checkbox */}
                        <td className="px-3 py-3">
                          <button onClick={() => toggleSelect(q.pyqId)}
                            className="flex items-center justify-center w-4 h-4 text-gray-300 hover:text-primary-600 transition-colors">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* Q# + expand */}
                        {columns.qNo && (
                          <td className="px-3 py-3">
                            <button onClick={() => toggleExpand(q.pyqId)}
                              className="flex items-center gap-1 font-mono text-xs font-bold text-gray-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand'}>
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              {q.qNo}
                            </button>
                          </td>
                        )}

                        {/* Year */}
                        {columns.year && (
                          <td className="px-3 py-3">
                            <div className="text-xs">
                              <div className="font-bold text-gray-800 dark:text-white">{q.year}</div>
                              <div className="text-gray-400 dark:text-secondary-500 capitalize text-[10px]">{q.session}</div>
                              {q.shift && q.shift !== 'none' && (
                                <div className="text-[9px] text-gray-300 dark:text-secondary-600 capitalize">{q.shift}</div>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Type */}
                        {columns.type && (
                          <td className="px-3 py-3">
                            <TypeBadge type={q.type} language={language} />
                          </td>
                        )}

                        {/* Preview */}
                        {columns.preview && (
                          <td className="px-3 py-3 max-w-[260px] xl:max-w-xs">
                            <p className={`text-xs text-gray-700 dark:text-secondary-200 leading-relaxed ${viewMode === 'compact' ? 'line-clamp-1' : 'line-clamp-2'}`}>
                              {q.questionPreview || (
                                <span className="text-gray-300 dark:text-secondary-600 italic text-[10px]">
                                  {language === 'hi' ? 'पूर्वावलोकन उपलब्ध नहीं' : 'No preview'}
                                </span>
                              )}
                            </p>
                          </td>
                        )}

                        {/* Unit / Chapter / Topic */}
                        {columns.unit && (
                          <td className="px-3 py-3">
                            <div className="text-[11px] space-y-0.5 max-w-[160px]">
                              <div className="font-semibold text-gray-700 dark:text-secondary-300 truncate" title={unitDisplay}>
                                {unitDisplay.length > 22 ? unitDisplay.substring(0, 22) + '…' : unitDisplay}
                              </div>
                              {chapDisplay && (
                                <div className="text-gray-500 dark:text-secondary-400 truncate" title={chapDisplay}>
                                  {chapDisplay.length > 22 ? chapDisplay.substring(0, 22) + '…' : chapDisplay}
                                </div>
                              )}
                              {topicDisplay && (
                                <div className="text-[10px] text-gray-400 dark:text-secondary-500 truncate" title={topicDisplay}>
                                  {topicDisplay.length > 22 ? topicDisplay.substring(0, 22) + '…' : topicDisplay}
                                </div>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Difficulty */}
                        {columns.difficulty && (
                          <td className="px-3 py-3 text-center">
                            <DiffBadge difficulty={q.difficulty} language={language} />
                          </td>
                        )}

                        {/* Content */}
                        {columns.content && (
                          <td className="px-3 py-3 text-center">
                            {q.hasContent ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Ready</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Empty</span>
                              </div>
                            )}
                          </td>
                        )}

                        {/* Tests */}
                        {columns.tests && (
                          <td className="px-3 py-3 text-center">
                            {q.usedInTestCount > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  title={(q.usedInTests || []).map(t => t.title).join(', ')}>
                                  {q.usedInTestCount}
                                </span>
                                <span className="text-[9px] text-gray-400 dark:text-secondary-500">used</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 dark:text-secondary-600 text-xs">—</span>
                            )}
                          </td>
                        )}

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openPreview(q)} title="Preview"
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openEdit(q)} title="Edit"
                              disabled={previewLoading}
                              className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all disabled:opacity-50">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const text = q.questionPreview || '';
                                navigator.clipboard.writeText(text).then(() => info('Copied!'));
                              }}
                              title="Copy"
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-400 hover:text-gray-600 transition-all">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && <ExpandedRow q={q} language={language} colSpan={visibleColCount} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.pages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-900/20">
            <span className="text-xs text-gray-500 dark:text-secondary-400 font-medium">
              {language === 'hi' ? 'पृष्ठ' : 'Page'} {pagination.page} / {pagination.pages}
            </span>
            <div className="flex items-center gap-1">
              <PagBtn onClick={() => setFilters(p=>({...p,page:1}))} disabled={pagination.page<=1} label="«" />
              <PagBtn onClick={() => setFilters(p=>({...p,page:p.page-1}))} disabled={pagination.page<=1} icon={<ChevronLeft className="w-4 h-4"/>} />
              {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
                let pn;
                if (pagination.pages <= 7) pn = i + 1;
                else if (pagination.page <= 4) pn = i + 1;
                else if (pagination.page >= pagination.pages - 3) pn = pagination.pages - 6 + i;
                else pn = pagination.page - 3 + i;
                return (
                  <button key={pn} onClick={() => setFilters(p=>({...p,page:pn}))}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      pagination.page === pn
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30 scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-700 dark:text-secondary-300'
                    }`}>
                    {pn}
                  </button>
                );
              })}
              <PagBtn onClick={() => setFilters(p=>({...p,page:p.page+1}))} disabled={pagination.page>=pagination.pages} icon={<ChevronRight className="w-4 h-4"/>} />
              <PagBtn onClick={() => setFilters(p=>({...p,page:pagination.pages}))} disabled={pagination.page>=pagination.pages} label="»" />
            </div>
          </div>
        )}
      </div>

      {/* ══ EDIT MODAL ══ */}
      {editModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setEditModalOpen(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-200 dark:border-secondary-700 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-secondary-700 bg-gradient-to-r from-primary-50/60 to-violet-50/30 dark:from-primary-950/20 dark:to-violet-950/10 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex-shrink-0">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                    {language === 'hi' ? 'PYQ प्रश्न संपादित करें' : 'Edit PYQ Question'}
                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-secondary-400">
                      Q#{editingQuestion.qNo} · {editingQuestion.pyqLabel}
                    </span>
                  </h2>
                  {editLinkedTests.length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1 truncate">
                      <Zap className="w-3 h-3 flex-shrink-0" />
                      {language === 'hi'
                        ? `${editLinkedTests.length} टेस्ट ऑटो-सिंक होंगे`
                        : `${editLinkedTests.length} test(s) will auto-sync`}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-500 transition-colors flex-shrink-0 ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-2.5 border-b border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 flex-shrink-0">
              {[
                { id: 'content', label: language === 'hi' ? 'प्रश्न सामग्री' : 'Content', icon: FileText },
                { id: 'options', label: language === 'hi' ? 'विकल्प' : 'Options & Answer', icon: CheckCircle },
                { id: 'meta',    label: language === 'hi' ? 'मेटाडेटा' : 'Metadata', icon: Tag },
              ].map(tab => (
                <button key={tab.id} onClick={() => setEditTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    editTab === tab.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-500 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Content Tab */}
              {editTab === 'content' && (
                <div className="space-y-4">
                  {(editForm.passageHi || editForm.passageEn || editForm.type === 'passage' || editForm.type === 'passage_based') && (
                    <div className="p-4 bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                      <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />{language === 'hi' ? 'गद्यांश' : 'Passage Text'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">हिंदी</label>
                          <textarea value={editForm.passageHi || ''} onChange={e => handleEditFormChange('passageHi', e.target.value)} rows={4} className={textareaCls} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">English</label>
                          <textarea value={editForm.passageEn || ''} onChange={e => handleEditFormChange('passageEn', e.target.value)} rows={4} className={textareaCls} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'प्रश्न (हिंदी)' : 'Question (Hindi)'}
                      </label>
                      <textarea value={editForm.questionTextHi || ''} onChange={e => handleEditFormChange('questionTextHi', e.target.value)} rows={5} className={textareaCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'प्रश्न (अंग्रेज़ी)' : 'Question (English)'}
                      </label>
                      <textarea value={editForm.questionTextEn || ''} onChange={e => handleEditFormChange('questionTextEn', e.target.value)} rows={5} className={textareaCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'व्याख्या (हिंदी)' : 'Explanation (Hindi)'}
                      </label>
                      <textarea value={editForm.explanationHi || ''} onChange={e => handleEditFormChange('explanationHi', e.target.value)} rows={3} className={textareaCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'व्याख्या (अंग्रेज़ी)' : 'Explanation (English)'}
                      </label>
                      <textarea value={editForm.explanationEn || ''} onChange={e => handleEditFormChange('explanationEn', e.target.value)} rows={3} className={textareaCls} />
                    </div>
                  </div>
                </div>
              )}

              {/* Options Tab */}
              {editTab === 'options' && (
                <div className="space-y-4">
                  {editForm.correctAnswer !== null && editForm.correctAnswer !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        {language === 'hi' ? 'सही उत्तर:' : 'Correct Answer:'} Option ({String.fromCharCode(65 + editForm.correctAnswer)})
                      </span>
                      <span className="text-xs text-emerald-500 dark:text-emerald-400 ml-auto hidden sm:block">
                        {language === 'hi' ? 'रेडियो से बदलें' : 'Change via radio'}
                      </span>
                    </div>
                  )}
                  {(editForm.optionsHi?.length > 0 || editForm.optionsEn?.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { lang: 'hi', field: 'optionsHi', label: 'Options (हिंदी)', hasRadio: true },
                        { lang: 'en', field: 'optionsEn', label: 'Options (English)', hasRadio: false },
                      ].map(({ lang, field, label, hasRadio }) => (
                        editForm[field]?.length > 0 && (
                          <div key={lang}>
                            <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-2">{label}</label>
                            <div className="space-y-2">
                              {editForm[field].map((opt, idx) => (
                                <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${
                                  editForm.correctAnswer === idx
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                                    : 'bg-gray-50 dark:bg-secondary-900/50 border-gray-200 dark:border-secondary-600'}`}>
                                  {hasRadio && (
                                    <input type="radio" name="correctAnswer" checked={editForm.correctAnswer === idx}
                                      onChange={() => handleEditFormChange('correctAnswer', idx)}
                                      className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  )}
                                  <span className={`text-xs font-black w-5 flex-shrink-0 ${editForm.correctAnswer === idx ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <input type="text" value={opt} onChange={e => handleOptionChange(lang, idx, e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none min-w-0" />
                                  {editForm.correctAnswer === idx && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 dark:text-secondary-600">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">{language === 'hi' ? 'इस प्रकार के लिए विकल्प नहीं' : 'No options for this question type'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Meta Tab */}
              {editTab === 'meta' && (
                <div className="space-y-5">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                      {language === 'hi' ? 'कठिनाई स्तर' : 'Difficulty Level'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'easy',   label: language === 'hi' ? 'आसान'  : 'Easy',   cls: 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200 dark:shadow-emerald-900' },
                        { val: 'medium', label: language === 'hi' ? 'मध्यम' : 'Medium', cls: 'bg-amber-500 text-white border-amber-500 shadow-amber-200 dark:shadow-amber-900' },
                        { val: 'hard',   label: language === 'hi' ? 'कठिन'  : 'Hard',   cls: 'bg-red-500 text-white border-red-500 shadow-red-200 dark:shadow-red-900' },
                      ].map(d => (
                        <button key={d.val} onClick={() => handleEditFormChange('difficulty', d.val)}
                          className={`py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${
                            editForm.difficulty === d.val
                              ? `${d.cls} shadow-lg scale-105`
                              : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-600 dark:text-secondary-400 hover:border-gray-300'
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Importance */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-2">
                      {language === 'hi' ? 'महत्व स्तर' : 'Importance Level'}
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} onClick={() => handleEditFormChange('importance', v)}
                          className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all ${
                            editForm.importance >= v
                              ? 'bg-amber-400 border-amber-400 text-white shadow-md'
                              : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-300'
                          }`}>
                          <Star className="w-4 h-4" />
                        </button>
                      ))}
                      <span className="text-sm font-bold text-gray-700 dark:text-secondary-300 ml-2">
                        {editForm.importance}/5
                      </span>
                    </div>
                  </div>

                  {/* Chapter, Topic, Subtopic */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'अध्याय' : 'Chapter'}
                      </label>
                      <input type="text" value={editForm.chapter || ''} onChange={e => handleEditFormChange('chapter', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'विषय' : 'Topic'}
                      </label>
                      <input type="text" value={editForm.topic || ''} onChange={e => handleEditFormChange('topic', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
                        {language === 'hi' ? 'उप-विषय' : 'Subtopic'}
                      </label>
                      <input type="text" value={editForm.subtopic || ''} onChange={e => handleEditFormChange('subtopic', e.target.value)} className={inputCls} />
                    </div>
                  </div>

                  {/* Key Terms */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {language === 'hi' ? 'मुख्य शब्द (Key Terms)' : 'Key Terms'}
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 border border-gray-200 dark:border-secondary-600 rounded-xl min-h-[48px] bg-gray-50 dark:bg-secondary-900/50">
                      {(editForm.keyTerms || []).map((term, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold">
                          {term}
                          <button onClick={() => handleEditFormChange('keyTerms', editForm.keyTerms.filter((_, j) => j !== i))}
                            className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input type="text" placeholder={language === 'hi' ? 'शब्द + Enter' : 'Add term + Enter'}
                        className="flex-1 min-w-[100px] bg-transparent text-xs text-gray-700 dark:text-secondary-300 focus:outline-none placeholder:text-gray-400"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleEditFormChange('keyTerms', [...(editForm.keyTerms || []), e.target.value.trim()]);
                            e.target.value = '';
                          }
                        }} />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-secondary-500 mt-1">
                      {language === 'hi' ? 'Enter दबाकर जोड़ें' : 'Press Enter to add each term'}
                    </p>
                  </div>

                  {/* Linked tests */}
                  {editLinkedTests.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        {language === 'hi' ? 'सहेजने पर ये टेस्ट अपडेट होंगे:' : 'Tests that will auto-update:'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {editLinkedTests.map(t => (
                          <span key={t._id} className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl">
                            <ClipboardList className="w-2.5 h-2.5 flex-shrink-0" />{t.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-secondary-700 bg-gray-50/60 dark:bg-secondary-900/30 flex-shrink-0 rounded-b-3xl">
              <p className="text-xs text-gray-400 dark:text-secondary-500 hidden sm:block">
                {language === 'hi' ? 'बदलाव टेस्ट में ऑटो-सिंक होंगे' : 'Changes auto-sync to linked tests'}
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={editLoading}>
                  {language === 'hi' ? 'रद्द' : 'Cancel'}
                </Button>
                <Button variant="primary" icon={Save} onClick={handleSaveEdit} loading={editLoading}>
                  {language === 'hi' ? 'सहेजें' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PREVIEW MODAL ══ */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && setPreviewOpen(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-200 dark:border-secondary-700 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-secondary-700 bg-gradient-to-r from-blue-50/60 to-violet-50/30 dark:from-blue-950/20 dark:to-violet-950/10 flex-shrink-0">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                {language === 'hi' ? 'प्रश्न पूर्वावलोकन' : 'Question Preview'}
              </h2>
              <div className="flex items-center gap-2">
                {previewQuestion && !previewLoading && (
                  <button
                    onClick={() => {
                      openEdit({ pyqId: previewQuestion.pyqId, qNo: previewQuestion.qNo, pyqLabel: previewQuestion.pyqLabel });
                      setPreviewOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
                    <Edit2 className="w-3 h-3" />
                    {language === 'hi' ? 'संपादित करें' : 'Edit'}
                  </button>
                )}
                <button onClick={() => { setPreviewOpen(false); setPreviewQuestion(null); }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 border-4 border-primary-200 dark:border-primary-900 rounded-full animate-spin border-t-primary-600" />
                  <p className="text-sm text-gray-500">{language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</p>
                </div>
              ) : previewQuestion ? (
                <div className="space-y-4">
                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-gray-800 dark:text-white">Q#{previewQuestion.qNo}</span>
                    <span className="text-gray-300 dark:text-secondary-600">·</span>
                    <span className="text-sm text-gray-500 dark:text-secondary-400">{previewQuestion.pyqLabel}</span>
                    <TypeBadge type={previewQuestion.question?.type} language={language} />
                    {previewQuestion.question?.difficulty && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${DIFF_CONFIG[previewQuestion.question.difficulty]?.color || ''}`}>
                        {DIFF_CONFIG[previewQuestion.question.difficulty]?.[language === 'hi' ? 'hi' : 'label'] || previewQuestion.question.difficulty}
                      </span>
                    )}
                    {previewQuestion.question?.importance && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        <Star className="w-3 h-3" />{previewQuestion.question.importance}/5
                      </span>
                    )}
                  </div>

                  {/* Passage */}
                  {(previewQuestion.question?.passageHi || previewQuestion.question?.passageEn) && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                      <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />Passage
                      </p>
                      <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed">
                        {language === 'hi' ? (previewQuestion.question.passageHi || previewQuestion.question.passageEn) : (previewQuestion.question.passageEn || previewQuestion.question.passageHi)}
                      </p>
                    </div>
                  )}

                  {/* Question text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewQuestion.question?.questionTextHi && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                        <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wider">हिंदी</p>
                        <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{previewQuestion.question.questionTextHi}</p>
                      </div>
                    )}
                    {previewQuestion.question?.questionTextEn && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">English</p>
                        <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{previewQuestion.question.questionTextEn}</p>
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  {(previewQuestion.question?.optionsHi?.length > 0 || previewQuestion.question?.optionsEn?.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { field: 'optionsHi', label: 'Options (हिंदी)' },
                        { field: 'optionsEn', label: 'Options (English)' },
                      ].map(({ field, label }) =>
                        previewQuestion.question?.[field]?.length > 0 && (
                          <div key={field}>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                            <div className="space-y-1.5">
                              {previewQuestion.question[field].map((o, i) => {
                                const correct = previewQuestion.question.correctAnswer === i;
                                return (
                                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                                    correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                                    : 'bg-gray-50 dark:bg-secondary-900/50 border-gray-200 dark:border-secondary-600'}`}>
                                    <span className={`text-xs font-black mt-0.5 flex-shrink-0 w-4 ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className={`text-sm flex-1 ${correct ? 'font-semibold text-emerald-800 dark:text-emerald-300' : 'text-gray-700 dark:text-secondary-300'}`}>{o}</span>
                                    {correct && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  {(previewQuestion.question?.explanationHi || previewQuestion.question?.explanationEn) && (
                    <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-200 dark:border-violet-800/50">
                      <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />{language === 'hi' ? 'व्याख्या' : 'Explanation'}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-wrap">
                        {language === 'hi'
                          ? (previewQuestion.question.explanationHi || previewQuestion.question.explanationEn)
                          : (previewQuestion.question.explanationEn || previewQuestion.question.explanationHi)}
                      </p>
                    </div>
                  )}

                  {/* Unit / Chapter / Topic info */}
                  {(previewQuestion.question?.unitName || previewQuestion.question?.chapter || previewQuestion.question?.topic) && (
                    <div className="flex flex-wrap gap-2">
                      {previewQuestion.question.unitName && previewQuestion.question.unitName !== previewQuestion.question.unitId && (
                        <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 px-2 py-1 rounded-lg">
                          <GraduationCap className="w-3 h-3" />{previewQuestion.question.unitName}
                        </span>
                      )}
                      {previewQuestion.question.chapter && (
                        <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 px-2 py-1 rounded-lg">
                          <BookOpen className="w-3 h-3" />{previewQuestion.question.chapter}
                        </span>
                      )}
                      {previewQuestion.question.topic && (
                        <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 px-2 py-1 rounded-lg">
                          <Tag className="w-3 h-3" />{previewQuestion.question.topic}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Key terms */}
                  {previewQuestion.question?.keyTerms?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {previewQuestion.question.keyTerms.map((term, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300 rounded-lg">
                          #{term}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Linked tests */}
                  {previewQuestion.linkedTests?.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50">
                      <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        {language === 'hi' ? 'इन टेस्ट में उपयोग:' : 'Used in tests:'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewQuestion.linkedTests.map(t => (
                          <span key={t._id} className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl">
                            {t.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-secondary-400">
                    {language === 'hi' ? 'डेटा नहीं मिला' : 'No data found'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-secondary-700 flex-shrink-0">
              <Button variant="outline" onClick={() => { setPreviewOpen(false); setPreviewQuestion(null); }}>
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helper sub-components ──
const FilterChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full border border-primary-200 dark:border-primary-700">
    {label}
    <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
      <X className="w-3 h-3" />
    </button>
  </span>
);

const PagBtn = ({ onClick, disabled, label, icon }) => (
  <button onClick={onClick} disabled={disabled}
    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-secondary-300 font-bold text-xs px-2">
    {label || icon}
  </button>
);

export default PYQQuestionBank;