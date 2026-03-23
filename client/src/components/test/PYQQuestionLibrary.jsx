// client/src/components/pyq/PYQQuestionLibrary.jsx
// ═══════════════════════════════════════════════════════════════
// ADVANCED PYQ Question Library v2.0
// — Matches QuestionLibraryModal quality
// — Year/Session/Shift/Unit/Type/Difficulty filters
// — Batch select, Grid/List, Sidebar, Pagination, Preview
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Search, Check, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  FileText, Eye, Calendar, RefreshCw, Trash2, LayoutGrid, List,
  Languages, BookOpen, Target, Layers, Star,
  CheckCheck, ArrowUpDown, RotateCcw, Sparkles,
  Zap, ChevronDown, ChevronUp, SlidersHorizontal,
  Hash, Plus, Minus, Filter, ChevronFirst, ChevronLast,
  Loader2, ScrollText, BarChart3, PanelLeftClose, PanelLeft,
  Maximize2, Minimize2, Flame, Gauge, CircleDot, Award
} from 'lucide-react';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import { FilterChip, MiniMultiSelect, QuestionPreviewModal } from '../test/library';

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
const DIFF = {
  easy: { label: { hi: 'आसान', en: 'Easy' }, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', pill: 'bg-emerald-600 text-white border-emerald-600', pillOff: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  medium: { label: { hi: 'मध्यम', en: 'Medium' }, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', pill: 'bg-amber-600 text-white border-amber-600', pillOff: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  hard: { label: { hi: 'कठिन', en: 'Hard' }, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', pill: 'bg-red-600 text-white border-red-600', pillOff: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' }
};

const getQText = (q, lang) => {
  if (!q?.question) return q?.topic || q?.chapter || `Q${q?.questionNumber || '?'}`;
  return q.question[lang] || q.question.hi || q.question.en || '';
};

// ════════════════════════════════════════
// QUESTION CARD
// ════════════════════════════════════════
const PYQCard = React.memo(({ q, globalIdx, isSelected, language, onToggle, onPreview, viewMode }) => {
  const [expanded, setExpanded] = useState(false);
  const t = (h, e) => language === 'hi' ? h : e;
  const text = getQText(q, language);
  const isLong = text.length > 220;
  const dc = DIFF[q.difficulty] || DIFF.medium;

  if (viewMode === 'grid') {
    return (
      <div onClick={() => onToggle(q)}
        className={`relative p-3 rounded-2xl border-2 cursor-pointer group transition-all duration-200
          ${isSelected ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 hover:shadow-lg'}`}>
        <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 shadow-lg' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {isSelected ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <span className="text-[9px] font-bold text-gray-400">{globalIdx}</span>}
        </div>
        <div className="flex flex-wrap gap-1 mb-2 pr-8">
          <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />PYQ {q.year}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${dc.bg} ${dc.text}`}>{(q.difficulty || 'M')[0].toUpperCase()}</span>
          {!q.hasContent && <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold">{t('विषय', 'Topic')}</span>}
        </div>
        <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed break-words mb-2 min-h-[48px]">
          {text.substring(0, 160)}{text.length > 160 ? '…' : ''}
        </p>
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700/50">
          <span className="text-[9px] text-gray-400 truncate max-w-[120px]">{q.chapter || q.unit || ''}</span>
          <button type="button" onClick={e => { e.stopPropagation(); onPreview(q); }} className="p-1 hover:bg-amber-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onToggle(q)}
      className={`p-3 rounded-2xl border-2 cursor-pointer group relative transition-all duration-200
        ${isSelected ? 'border-amber-500 dark:border-amber-400 bg-gradient-to-r from-amber-50/80 to-orange-50/40 dark:from-amber-900/20 dark:to-orange-900/10 shadow-lg ring-1 ring-amber-500/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 hover:shadow-lg'}`}>
      <div className="flex gap-3">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${isSelected ? 'bg-amber-500 border-amber-500 shadow-md' : 'border-gray-300 dark:border-gray-600 group-hover:border-amber-400'}`}>
          {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-md font-bold">Q{q.questionNumber || globalIdx}</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded-md font-bold flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />PYQ {q.year}</span>
            {q.pyqSession && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-bold capitalize">{q.pyqSession}</span>}
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 rounded-md font-semibold">{QUESTION_TYPE_LABELS[q.questionType]?.[language] || q.questionType}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${dc.bg} ${dc.text}`}>{dc.label[language]}</span>
            {!q.hasContent && <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold">{t('विषय मात्र', 'Topic only')}</span>}
            {q.unit && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 rounded-md font-semibold truncate max-w-[140px]">{q.unit}</span>}
            {q.chapter && <span className="text-[9px] px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-md font-semibold truncate max-w-[120px]">{q.chapter}</span>}
            {q.topic && <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 rounded-md font-semibold truncate max-w-[100px]">{q.topic}</span>}
          </div>
          <div className="mb-1.5">
            <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              {expanded || !isLong ? text : text.substring(0, 220) + '…'}
            </p>
            {isLong && (
              <button type="button" onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
                className="mt-0.5 text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5">
                {expanded ? <><ChevronUp className="w-3 h-3" />{t('कम', 'Less')}</> : <><ChevronDown className="w-3 h-3" />{t('और', 'More')}</>}
              </button>
            )}
          </div>
          {q.questionType === 'mcq' && q.options && (
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {(q.options[language] || q.options.hi || q.options.en || []).slice(0, 4).map((opt, oi) => {
                const correct = q.correctAnswer === oi;
                return (
                  <div key={oi} className={`text-[10px] px-1.5 py-1 rounded-lg border flex items-start gap-1 ${correct ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <span className={`font-black w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5 ${correct ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{String.fromCharCode(65 + oi)}</span>
                    <span className="truncate">{(typeof opt === 'string' ? opt : '').substring(0, 50)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-gray-400 flex items-center gap-1"><Award className="w-2.5 h-2.5" />{t('महत्व:', 'Imp:')} {q.importance || 3}/5</span>
            <button type="button" onClick={e => { e.stopPropagation(); onPreview(q); }}
              className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 hover:bg-amber-50 rounded flex items-center gap-0.5 transition-all">
              <Eye className="w-3 h-3" />{t('देखें', 'View')}
            </button>
          </div>
        </div>
      </div>
      {isSelected && <div className="absolute top-2.5 right-2.5"><div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md"><Check className="w-3 h-3 text-white" strokeWidth={3} /></div></div>}
    </div>
  );
});

// ════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════
const PYQSidebar = React.memo(({ selectedQuestions, language, marksPerQuestion, onClear, onClose }) => {
  const t = (h, e) => language === 'hi' ? h : e;
  const total = selectedQuestions.length;
  const pyqCount = selectedQuestions.filter(q => q._id?.startsWith('pyq_') || q.isPYQ).length;

  const summary = useMemo(() => {
    const d = { easy: 0, medium: 0, hard: 0 }, ty = {}, years = {}, units = {};
    selectedQuestions.forEach(q => {
      d[q.difficulty || 'medium']++;
      ty[q.questionType || 'mcq'] = (ty[q.questionType || 'mcq'] || 0) + 1;
      if (q.year) years[q.year] = (years[q.year] || 0) + 1;
      if (q.unit) units[q.unit] = (units[q.unit] || 0) + 1;
    });
    return { d, ty, years, units };
  }, [selectedQuestions]);

  return (
    <div className="w-72 border-l border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 flex flex-col h-full">
      <div className="p-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white/80 dark:bg-gray-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md"><BarChart3 className="w-4 h-4 text-white" /></div>
          <div><h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('PYQ विश्लेषण', 'PYQ Analysis')}</h4><p className="text-[10px] text-gray-500">{total} {t('चुने', 'sel')}</p></div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
        {total === 0 ? (
          <div className="text-center py-12"><ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('कोई प्रश्न नहीं', 'No questions')}</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-xl border border-amber-200 text-center">
                <p className="text-2xl font-black text-amber-600 tabular-nums">{total}</p><p className="text-[9px] text-gray-500 uppercase font-bold">{t('प्रश्न', 'Q')}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl border border-green-200 text-center">
                <p className="text-2xl font-black text-green-600 tabular-nums">{total * marksPerQuestion}</p><p className="text-[9px] text-gray-500 uppercase font-bold">{t('अंक', 'Marks')}</p>
              </div>
            </div>

            {/* Years */}
            {Object.keys(summary.years).length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">{t('वर्ष', 'Years')}</h5>
                {Object.entries(summary.years).sort((a, b) => b[0].localeCompare(a[0])).map(([yr, cnt]) => (
                  <div key={yr} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="text-gray-600 flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{yr}</span>
                    <span className="font-bold tabular-nums">{cnt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Difficulty */}
            <div>
              <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">{t('कठिनाई', 'Difficulty')}</h5>
              {Object.entries(DIFF).map(([key, cfg]) => (
                <div key={key} className={`flex items-center justify-between p-2 rounded-lg ${cfg.bg} mb-1`}>
                  <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${cfg.dot}`} /><span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label[language]}</span></div>
                  <span className="text-xs font-black tabular-nums">{summary.d[key]} <span className="text-gray-400 font-normal text-[10px]">({total ? Math.round((summary.d[key] / total) * 100) : 0}%)</span></span>
                </div>
              ))}
            </div>

            {/* Types */}
            {Object.keys(summary.ty).length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{t('प्रकार', 'Types')}</h5>
                {Object.entries(summary.ty).sort((a, b) => b[1] - a[1]).map(([ty, cnt]) => (
                  <div key={ty} className="flex justify-between py-1 text-xs"><span className="text-gray-600 truncate max-w-[140px]">{QUESTION_TYPE_LABELS[ty]?.[language] || ty}</span><span className="font-bold tabular-nums">{cnt}</span></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {total > 0 && (
        <div className="p-3 border-t bg-white/80 dark:bg-gray-800/80">
          <button onClick={onClear} className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" />{t('सभी हटाएं', 'Clear All')}</button>
        </div>
      )}
    </div>
  );
});

// ══════════════════════════════════════════
// ★ MAIN COMPONENT ★
// ══════════════════════════════════════════
const PYQQuestionLibrary = ({
  isOpen, onClose, language = 'hi',
  selectedQuestions = [], onToggleQuestion,
  onSelectAll, onClearAll, marksPerQuestion = 2
}) => {
  const { pyqQuestions, pyqFilters, loading, fetchPYQQuestions, fetchPYQFilters } = usePYQAnalysis();
  const t = useCallback((h, e) => language === 'hi' ? h : e, [language]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('qno');
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('all');
  const [fullscreen, setFullscreen] = useState(false);
  const [batchMsg, setBatchMsg] = useState(null);
  const searchRef = useRef(null);

  const [filters, setFilters] = useState({
    paper: 'paper2', year: '', session: '',
    unitId: '', type: '', difficulty: '',
    hasContent: true
  });

  const selectedIds = useMemo(() => new Set(selectedQuestions.map(q => q._id)), [selectedQuestions]);
  const pyqSelectedCount = useMemo(() => selectedQuestions.filter(q => q._id?.startsWith('pyq_') || q.isPYQ).length, [selectedQuestions]);

  // Load filters on open
  useEffect(() => {
    if (isOpen) {
      fetchPYQFilters(filters.paper).catch(() => {});
      loadQuestions();
      setPage(1);
      setSearchQuery('');
      setTab('all');
      setBatchMsg(null);
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const loadQuestions = useCallback(async () => {
    const params = { paper: filters.paper };
    if (filters.year) params.year = filters.year;
    if (filters.session) params.session = filters.session;
    if (filters.unitId) params.unitId = filters.unitId;
    if (filters.type) params.type = filters.type;
    if (filters.hasContent) params.hasContent = 'true';
    await fetchPYQQuestions(params).catch(() => {});
  }, [filters, fetchPYQQuestions]);

  // Reload when key filters change
  useEffect(() => {
    if (isOpen) loadQuestions();
  }, [filters.paper, filters.year, filters.session, filters.unitId, filters.type, filters.hasContent]);

  const updateFilter = useCallback((key, value) => {
    setFilters(p => {
      const n = { ...p, [key]: value };
      if (key === 'paper') { n.unitId = ''; }
      return n;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ paper: 'paper2', year: '', session: '', unitId: '', type: '', difficulty: '', hasContent: true });
    setSearchQuery('');
    setPage(1);
  }, []);

  // ═══ FILTERED + SORTED ═══
  const filtered = useMemo(() => {
    let r = Array.isArray(pyqQuestions) ? [...pyqQuestions] : [];

    // Client-side difficulty filter
    if (filters.difficulty) r = r.filter(q => q.difficulty === filters.difficulty);

    // Search
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      r = r.filter(q => {
        const txt = (q.question?.hi || '') + ' ' + (q.question?.en || '') + ' ' + (q.topic || '') + ' ' + (q.chapter || '') + ' ' + (q.unit || '') + ' Q' + (q.questionNumber || '');
        return txt.toLowerCase().includes(s);
      });
    }

    // Sort
    switch (sortBy) {
      case 'qno': r.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0)); break;
      case 'year_desc': r.sort((a, b) => (b.year || '').localeCompare(a.year || '')); break;
      case 'difficulty_asc': { const o = { easy: 1, medium: 2, hard: 3 }; r.sort((a, b) => (o[a.difficulty] || 2) - (o[b.difficulty] || 2)); } break;
      case 'difficulty_desc': { const o = { easy: 1, medium: 2, hard: 3 }; r.sort((a, b) => (o[b.difficulty] || 2) - (o[a.difficulty] || 2)); } break;
      case 'importance': r.sort((a, b) => (b.importance || 3) - (a.importance || 3)); break;
      default: break;
    }

    return r;
  }, [pyqQuestions, filters.difficulty, searchQuery, sortBy]);

  const display = useMemo(() => tab === 'selected' ? selectedQuestions.filter(q => q.isPYQ || q._id?.startsWith('pyq_')) : filtered, [tab, selectedQuestions, filtered]);
  const totalPages = Math.max(1, Math.ceil(display.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(Math.max(1, totalPages)); }, [totalPages, page]);
  const paginated = useMemo(() => display.slice((page - 1) * perPage, page * perPage), [display, page, perPage]);

  const filterCount = useMemo(() => {
    let c = 0;
    if (filters.year) c++;
    if (filters.session) c++;
    if (filters.unitId) c++;
    if (filters.type) c++;
    if (filters.difficulty) c++;
    return c;
  }, [filters]);

  const quickCounts = useMemo(() => {
    const c = { easy: 0, medium: 0, hard: 0, withContent: 0 };
    (Array.isArray(pyqQuestions) ? pyqQuestions : []).forEach(q => {
      if (q.difficulty) c[q.difficulty]++;
      if (q.hasContent) c.withContent++;
    });
    return c;
  }, [pyqQuestions]);

  const unselCount = useMemo(() => filtered.filter(q => !selectedIds.has(q._id)).length, [filtered, selectedIds]);

  const selOnPage = useMemo(() => paginated.filter(q => selectedIds.has(q._id)).length, [paginated, selectedIds]);
  const allPageSel = paginated.length > 0 && selOnPage === paginated.length;

  // ═══ BATCH HANDLERS ═══
  const flash = useCallback(msg => { setBatchMsg(msg); setTimeout(() => setBatchMsg(null), 2500); }, []);

  const handleBatchSelect = useCallback((count) => {
    const unsel = filtered.filter(q => !selectedIds.has(q._id));
    const toAdd = unsel.slice(0, Math.min(count, unsel.length));
    if (toAdd.length === 0) { flash(t('सभी चुने हुए', 'All selected')); return; }
    if (onSelectAll) onSelectAll(toAdd);
    flash(`✓ +${toAdd.length} ${t('चुने', 'selected')}!`);
  }, [filtered, selectedIds, onSelectAll, flash, t]);

  const handleSelectPage = useCallback(() => {
    const toAdd = paginated.filter(q => !selectedIds.has(q._id));
    if (toAdd.length === 0) return;
    if (onSelectAll) onSelectAll(toAdd);
  }, [paginated, selectedIds, onSelectAll]);

  const handleDeselectPage = useCallback(() => {
    paginated.forEach(q => { if (selectedIds.has(q._id)) onToggleQuestion(q); });
  }, [paginated, selectedIds, onToggleQuestion]);

  const handleSelectAllFiltered = useCallback(() => {
    const toAdd = filtered.filter(q => !selectedIds.has(q._id));
    if (toAdd.length > 0 && onSelectAll) onSelectAll(toAdd);
  }, [filtered, selectedIds, onSelectAll]);

  const toggleDiff = useCallback(d => {
    setFilters(p => ({ ...p, difficulty: p.difficulty === d ? '' : d }));
    setPage(1);
  }, []);

  // ═══ KEYBOARD ═══
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => {
      if (e.key === 'Escape') { preview ? setPreview(null) : onClose(); }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, preview, totalPages]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-1.5 sm:p-3">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full flex overflow-hidden border border-gray-200/80 dark:border-gray-700 transition-all ${fullscreen ? 'max-w-full h-full rounded-none' : 'max-w-7xl h-[97vh]'}`}>
        <div className="flex-1 flex flex-col min-w-0">

          {/* ═══ HEADER ═══ */}
          <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 via-white to-orange-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ScrollText className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight">{t('PYQ प्रश्न लाइब्रेरी', 'PYQ Question Library')}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="tabular-nums font-medium">{filtered.length} {t('प्रश्न', 'Q')}</span>
                    {pyqSelectedCount > 0 && (
                      <span className="text-amber-600 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3" />{pyqSelectedCount} {t('चुने', 'sel')}
                        <span className="text-green-600 ml-0.5">({pyqSelectedCount * marksPerQuestion}M)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {pyqSelectedCount > 0 && (
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="text-xs font-black text-amber-700 tabular-nums">{pyqSelectedCount}</span>
                  </div>
                )}
                <button type="button" onClick={() => setShowSidebar(!showSidebar)} className={`hidden lg:flex p-2 rounded-xl border transition-all ${showSidebar ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-500'}`}>
                  {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => setFullscreen(!fullscreen)} className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">
                  {fullscreen ? <Maximize2 className="w-4 h-4 text-gray-500" /> : <Minimize2 className="w-4 h-4 text-gray-500" />}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
          </div>

          {/* ═══ SEARCH + CONTROLS ═══ */}
          <div className="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input ref={searchRef} type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder={t('प्रश्न, विषय, अध्याय खोजें… ( / )', 'Search question, topic, chapter… ( / )')}
                  className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white" />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <button type="button" onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${showFilters ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-md' : 'border-gray-200 text-gray-600'}`}>
                <SlidersHorizontal className="w-4 h-4" />
                {filterCount > 0 && <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{filterCount}</span>}
              </button>
              <div className="hidden md:flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                {[5, 10, 25, 50].map(n => (
                  <button key={n} type="button" onClick={() => handleBatchSelect(Math.min(n, unselCount))} disabled={unselCount === 0}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${unselCount > 0 ? 'text-amber-700 hover:bg-amber-100 active:scale-95' : 'text-gray-400 cursor-not-allowed'}`}>
                    <Plus className="w-3 h-3 inline" />{n}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="hidden sm:block px-2 py-2.5 border-2 border-gray-200 rounded-xl text-xs bg-white dark:bg-gray-700 cursor-pointer">
                {[{ v: 'qno', l: 'Q#' }, { v: 'year_desc', l: t('वर्ष↓', 'Year↓') }, { v: 'difficulty_asc', l: 'Diff↑' }, { v: 'difficulty_desc', l: 'Diff↓' }, { v: 'importance', l: t('महत्व', 'Imp') }].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="hidden sm:block px-2 py-2.5 border-2 border-gray-200 rounded-xl text-xs bg-white dark:bg-gray-700 w-14 cursor-pointer">
                {[5, 10, 15, 20, 30].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
                {[{ k: 'list', i: List }, { k: 'grid', i: LayoutGrid }].map(v => (
                  <button key={v.k} type="button" onClick={() => setViewMode(v.k)} className={`p-2 rounded-lg ${viewMode === v.k ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}>
                    <v.i className={`w-4 h-4 ${viewMode === v.k ? 'text-amber-600' : 'text-gray-400'}`} />
                  </button>
                ))}
              </div>
              <button type="button" onClick={loadQuestions} disabled={loading}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg text-sm flex-shrink-0">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {batchMsg && <div className="mt-2 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-4 h-4" />{batchMsg}</div>}
          </div>

          {/* ═══ FILTERS PANEL ═══ */}
          {showFilters && (
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 flex-shrink-0 space-y-2">
              {/* Quick difficulty + content */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t('त्वरित:', 'Quick:')}</span>
                {Object.entries(DIFF).map(([k, c]) => {
                  const on = filters.difficulty === k;
                  return (
                    <button key={k} type="button" onClick={() => toggleDiff(k)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${on ? `${c.pill} shadow-md` : c.pillOff}`}>
                      {k === 'easy' ? <Sparkles className="w-3 h-3" /> : k === 'hard' ? <Flame className="w-3 h-3" /> : <Gauge className="w-3 h-3" />}
                      {c.label[language]}
                      {quickCounts[k] > 0 && <span className={`px-1.5 rounded-full text-[9px] font-black ${on ? 'bg-white/25' : 'bg-black/5'}`}>{quickCounts[k]}</span>}
                    </button>
                  );
                })}
                <div className="w-px h-5 bg-gray-300" />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={filters.hasContent} onChange={e => updateFilter('hasContent', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                  <span className="text-[11px] text-gray-600 font-bold">{t('सामग्री वाले', 'With content')} ({quickCounts.withContent})</span>
                </label>
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <select value={filters.year} onChange={e => updateFilter('year', e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium">
                  <option value="">{t('सभी वर्ष', 'All Years')}</option>
                  {(pyqFilters?.years || []).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={filters.session} onChange={e => updateFilter('session', e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium">
                  <option value="">{t('सभी सत्र', 'All Sessions')}</option>
                  {(pyqFilters?.sessions || []).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select value={filters.unitId} onChange={e => updateFilter('unitId', e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium">
                  <option value="">{t('सभी इकाई', 'All Units')}</option>
                  {(pyqFilters?.units || []).map(u => <option key={u.id} value={u.id}>{u.name} ({u.count})</option>)}
                </select>
                <select value={filters.type} onChange={e => updateFilter('type', e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium">
                  <option value="">{t('सभी प्रकार', 'All Types')}</option>
                  {(pyqFilters?.types || []).map(tp => <option key={tp.type} value={tp.type}>{QUESTION_TYPE_LABELS[tp.type]?.[language] || tp.type} ({tp.count})</option>)}
                </select>
                {filterCount > 0 && (
                  <button type="button" onClick={clearFilters} className="px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center justify-center gap-1 border-2 border-red-200"><RotateCcw className="w-3.5 h-3.5" />{t('रीसेट', 'Reset')}</button>
                )}
              </div>

              {/* Active filter chips */}
              {filterCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.year && <FilterChip label={`Year: ${filters.year}`} onRemove={() => updateFilter('year', '')} color="amber" />}
                  {filters.session && <FilterChip label={`Session: ${filters.session}`} onRemove={() => updateFilter('session', '')} color="blue" />}
                  {filters.unitId && <FilterChip label={`Unit: ${filters.unitId}`} onRemove={() => updateFilter('unitId', '')} color="green" />}
                  {filters.type && <FilterChip label={QUESTION_TYPE_LABELS[filters.type]?.[language] || filters.type} onRemove={() => updateFilter('type', '')} color="purple" />}
                  {filters.difficulty && <FilterChip label={DIFF[filters.difficulty]?.label[language] || filters.difficulty} onRemove={() => updateFilter('difficulty', '')} color={filters.difficulty === 'easy' ? 'green' : filters.difficulty === 'hard' ? 'red' : 'amber'} />}
                </div>
              )}
            </div>
          )}

          {/* ═══ TABS + PAGE SELECT ═══ */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 px-1">
            {[
              { key: 'all', label: t('सभी PYQ', 'All PYQ'), icon: ScrollText, count: filtered.length },
              { key: 'selected', label: t('चुने', 'Selected'), icon: CheckCircle2, count: pyqSelectedCount, hl: pyqSelectedCount > 0 }
            ].map(tb => (
              <button key={tb.key} type="button" onClick={() => { setTab(tb.key); setPage(1); }}
                className={`flex-1 px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-[3px] ${tab === tb.key ? 'text-amber-600 border-amber-600 bg-amber-50/50' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}>
                <tb.icon className="w-4 h-4" />{tb.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${tb.hl ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{tb.count}</span>
              </button>
            ))}
            <div className="w-px h-7 bg-gray-200 dark:bg-gray-700 mx-1" />
            {tab === 'all' && paginated.length > 0 && (
              <div className="flex items-center gap-1.5 px-2">
                <button type="button" onClick={allPageSel ? handleDeselectPage : handleSelectPage}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${allPageSel ? 'bg-amber-500 border-amber-500' : selOnPage > 0 ? 'bg-amber-100 border-amber-400' : 'border-gray-300 hover:border-amber-400'}`}>
                  {allPageSel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  {selOnPage > 0 && !allPageSel && <Minus className="w-3 h-3 text-amber-600" />}
                </button>
                <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">{t('पेज', 'Page')}</span>
              </div>
            )}
            {pyqSelectedCount > 0 && (
              <div className="flex items-center gap-0.5 px-1">
                <button type="button" onClick={handleSelectAllFiltered} title={`Select all ${filtered.length}`} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600"><CheckCheck className="w-4 h-4" /></button>
                <button type="button" onClick={onClearAll} title="Clear" className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><XCircle className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* ═══ QUESTIONS ═══ */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50/80 dark:bg-gray-800/30 overscroll-contain scroll-smooth">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                <p className="mt-4 text-gray-500 text-sm">{t('PYQ प्रश्न लोड हो रहे हैं…', 'Loading PYQ questions…')}</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-16">
                <ScrollText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="font-bold text-lg text-gray-700">{tab === 'selected' ? t('कोई PYQ प्रश्न नहीं चुना', 'No PYQ questions selected') : t('कोई PYQ प्रश्न नहीं मिला', 'No PYQ questions found')}</h3>
                <p className="text-sm text-gray-500 mt-2">{tab === 'all' ? t('फ़िल्टर बदलें या PYQ डेटा आयात करें', 'Change filters or import PYQ data') : t('"सभी PYQ" से चुनें', 'Select from All PYQ')}</p>
                {tab === 'all' && filterCount > 0 && <button type="button" onClick={clearFilters} className="mt-4 px-4 py-2 text-sm font-bold text-amber-600 hover:bg-amber-50 rounded-xl">{t('फ़िल्टर रीसेट', 'Reset Filters')}</button>}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2.5">
                {paginated.map((q, idx) => (
                  <PYQCard key={q._id} q={q} globalIdx={(page - 1) * perPage + idx + 1}
                    isSelected={selectedIds.has(q._id)} language={language}
                    onToggle={onToggleQuestion} onPreview={setPreview} viewMode="list" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginated.map((q, idx) => (
                  <PYQCard key={q._id} q={q} globalIdx={(page - 1) * perPage + idx + 1}
                    isSelected={selectedIds.has(q._id)} language={language}
                    onToggle={onToggleQuestion} onPreview={setPreview} viewMode="grid" />
                ))}
              </div>
            )}
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md"><Star className="w-4 h-4 text-white" /></div>
                  <div className="leading-tight">
                    <span className="text-lg font-black text-amber-600 tabular-nums">{pyqSelectedCount}</span>
                    {pyqSelectedCount > 0 && <span className="text-[10px] text-green-600 font-bold ml-1">({pyqSelectedCount * marksPerQuestion}M)</span>}
                  </div>
                </div>
                {pyqSelectedCount > 0 && <button type="button" onClick={onClearAll} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
              </div>

              {/* Pagination */}
              {display.length > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] text-gray-500 mr-1.5 tabular-nums hidden sm:inline">{(page - 1) * perPage + 1}-{Math.min(page * perPage, display.length)}/{display.length}</span>
                  <button type="button" onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronFirst className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  {(() => {
                    let s = Math.max(1, Math.min(page - 2, totalPages - 4));
                    let e = Math.min(s + 4, totalPages); s = Math.max(1, e - 4);
                    const pages = [];
                    for (let p = s; p <= e; p++) pages.push(
                      <button key={p} type="button" onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold tabular-nums ${page === p ? 'bg-amber-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
                    );
                    return pages;
                  })()}
                  <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLast className="w-4 h-4" /></button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-100">{t('रद्द', 'Cancel')}</button>
                <button type="button" onClick={onClose}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                  <CheckCheck className="w-5 h-5" />{t('पूर्ण', 'Done')}
                  {pyqSelectedCount > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums">{pyqSelectedCount}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showSidebar && <PYQSidebar selectedQuestions={selectedQuestions} language={language} marksPerQuestion={marksPerQuestion} onClear={onClearAll} onClose={() => setShowSidebar(false)} />}
        {preview && <QuestionPreviewModal question={preview} isOpen={!!preview} onClose={() => setPreview(null)} language={language} />}
      </div>
    </div>,
    document.body
  );
};

export default PYQQuestionLibrary;