import React, { useState, useMemo } from 'react';
import {
  X, Save, Trash2, Edit2, CheckCircle, AlertTriangle, Search,
  Eye, ChevronDown, ChevronUp, Check, Globe, Download, Loader2,
  AlertCircle, CheckSquare, Square, FileText, BookOpen, Table2,
  BarChart3, PieChart as PieChartIcon, TrendingUp
} from 'lucide-react';
import Button from '../common/Button';
import QuestionForm from './QuestionForm';
import { useToast } from '../common/Toast';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, OPTION_LABELS, ROMAN_NUMERALS } from '../../utils/constants';
import { getBilingualText, getBilingualArray, getQuestionTypeColor, downloadJSON } from '../../utils/helpers';
import questionService from '../../services/questionService';
import syllabusPaper1 from '../../data/syllabusPaper1';
import syllabusPaper2History from '../../data/syllabusPaper2History';

const ImportPreview = ({
  isOpen,
  onClose,
  questions: initialQuestions = [],
  onSave,
  loading = false,
  language = 'hi',
}) => {
  const { success, error: showError } = useToast();

  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewLang, setViewLang] = useState('both');
  const [editingQ, setEditingQ] = useState(null);
  const [editIndex, setEditIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [translatingIdx, setTranslatingIdx] = useState(-1);

  // Init
  React.useEffect(() => {
    if (initialQuestions.length > 0 && isOpen) {
      const qs = initialQuestions.map((q, i) => ({
        ...q,
        _previewId: q._previewId || `pv_${i}`,
        _status: getQualityStatus(q),
        _warnings: getQualityWarnings(q),
      }));
      setQuestions(qs);
      setSelected(new Set());
      setSearchText('');
      setFilterType('');
      setFilterStatus('');
      setExpandedCards(new Set());
    }
  }, [initialQuestions, isOpen]);

  // ── Quality ──
  function getQualityStatus(q) {
    const ws = getQualityWarnings(q);
    if (ws.some(w => w.level === 'error')) return 'error';
    if (ws.length > 0) return 'warning';
    return 'ok';
  }

  function getQualityWarnings(q) {
    const ws = [];
    const qText = q.question?.hi || q.question?.en || '';
    const opts = q.options?.hi || q.options?.en || [];
    const type = q.questionType;

    if (!qText && type !== 'assertion_reason' && !q._isPassageSub && !q._isDISub) {
      ws.push({ level: 'warning', msg: 'No question text' });
    }
    if (opts.length < 2 && type !== 'match_following') {
      ws.push({ level: 'error', msg: 'Less than 2 options' });
    }
    if (opts.length > 0 && opts.length < 4) {
      ws.push({ level: 'warning', msg: `Only ${opts.length} options` });
    }
    if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= Math.max(opts.length, 1)) {
      ws.push({ level: 'warning', msg: 'Invalid correct answer index' });
    }
    const exp = q.explanation?.hi || q.explanation?.en || '';
    if (!exp) ws.push({ level: 'info', msg: 'No explanation' });
    if (!q.question?.en && q.question?.hi) ws.push({ level: 'info', msg: 'English not translated' });
    if (!q.question?.hi && q.question?.en) ws.push({ level: 'info', msg: 'Hindi not translated' });

    // Type-specific
    if (type === 'assertion_reason') {
      const a = q.assertionReasonData?.assertion?.hi || q.assertionReasonData?.assertion?.en || '';
      const r = q.assertionReasonData?.reason?.hi || q.assertionReasonData?.reason?.en || '';
      if (!a) ws.push({ level: 'error', msg: 'No assertion text' });
      if (!r) ws.push({ level: 'error', msg: 'No reason text' });
    }
    if (type === 'match_following') {
      const la = q.matchData?.listA?.hi || q.matchData?.listA?.en || [];
      const lb = q.matchData?.listB?.hi || q.matchData?.listB?.en || [];
      if (la.length < 2) ws.push({ level: 'error', msg: 'List-I has < 2 items' });
      if (lb.length < 2) ws.push({ level: 'error', msg: 'List-II has < 2 items' });
    }
    if (type === 'statement_based') {
      const stmts = q.statementData?.statements?.hi || q.statementData?.statements?.en || [];
      if (stmts.length < 2) ws.push({ level: 'error', msg: 'Less than 2 statements' });
    }
    if (type === 'sequence_order') {
      const items = q.sequenceData?.items?.hi || q.sequenceData?.items?.en || [];
      if (items.length < 2) ws.push({ level: 'error', msg: 'Less than 2 sequence items' });
    }

    return ws;
  }

  // ── Filter ──
  const filtered = useMemo(() => {
    let result = questions;
    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      result = result.filter(q => {
        const t = (q.question?.hi || '') + ' ' + (q.question?.en || '') +
          (q.assertionReasonData?.assertion?.hi || '') + ' ' + (q.assertionReasonData?.assertion?.en || '') +
          (q._passageTitle || '') + (q._diTitle || '');
        return t.toLowerCase().includes(s);
      });
    }
    if (filterType) result = result.filter(q => q.questionType === filterType);
    if (filterStatus) result = result.filter(q => q._status === filterStatus);
    return result;
  }, [questions, searchText, filterType, filterStatus]);

  // ── Stats ──
  const stats = useMemo(() => {
    const byType = {};
    let ok = 0, warn = 0, err = 0;
    questions.forEach(q => {
      byType[q.questionType] = (byType[q.questionType] || 0) + 1;
      if (q._status === 'ok') ok++; else if (q._status === 'warning') warn++; else err++;
    });
    return { total: questions.length, byType, ok, warn, err };
  }, [questions]);

  const types = useMemo(() => Object.keys(stats.byType), [stats.byType]);

  // ── Actions ──
  const toggleSelect = (id) => setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAll = () => { if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set()); else setSelected(new Set(filtered.map(q => q._previewId))); };
  const deleteSelected = () => { setQuestions(p => p.filter(q => !selected.has(q._previewId))); setSelected(new Set()); success('Deleted'); };
  const deleteOne = (id) => { setQuestions(p => p.filter(q => q._previewId !== id)); setSelected(p => { const n = new Set(p); n.delete(id); return n; }); };
  const editQuestion = (q, idx) => { setEditingQ({ ...q }); setEditIndex(idx); };
  const handleEditSave = (data) => {
    setQuestions(p => p.map((q, i) => {
      if (i === editIndex) { const m = { ...q, ...data }; m._status = getQualityStatus(m); m._warnings = getQualityWarnings(m); return m; }
      return q;
    }));
    setEditingQ(null); setEditIndex(-1); success('Updated');
  };
  const toggleExpand = (id) => setExpandedCards(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // ── Translate ──
  const retranslateOne = async (idx) => {
    setTranslatingIdx(idx);
    try {
      const q = questions[idx];
      const src = q.question?.hi ? 'hi' : 'en';
      const tgt = src === 'hi' ? 'en' : 'hi';
      const texts = [];
      if (q.question?.[src]) texts.push(q.question[src]);
      const opts = q.options?.[src] || [];
      texts.push(...opts);
      if (q.explanation?.[src]) texts.push(q.explanation[src]);
      if (q.assertionReasonData?.assertion?.[src]) texts.push(q.assertionReasonData.assertion[src]);
      if (q.assertionReasonData?.reason?.[src]) texts.push(q.assertionReasonData.reason[src]);

      if (texts.length === 0) { showError('No text'); return; }
      const res = await questionService.translateBatch(texts, src, tgt);
      const tr = res?.data?.translated || texts;

      let ti = 0;
      const u = { ...q };
      if (q.question?.[src]) { u.question = { ...q.question, [tgt]: tr[ti] || '' }; ti++; }
      if (opts.length > 0) { u.options = { ...q.options, [tgt]: tr.slice(ti, ti + opts.length) }; ti += opts.length; }
      if (q.explanation?.[src]) { u.explanation = { ...q.explanation, [tgt]: tr[ti] || '' }; ti++; }
      if (q.assertionReasonData?.assertion?.[src]) {
        u.assertionReasonData = { ...q.assertionReasonData, assertion: { ...q.assertionReasonData.assertion, [tgt]: tr[ti] || '' } }; ti++;
      }
      if (q.assertionReasonData?.reason?.[src]) {
        u.assertionReasonData = { ...(u.assertionReasonData || q.assertionReasonData), reason: { ...(q.assertionReasonData?.reason || {}), [tgt]: tr[ti] || '' } };
      }

      u._status = getQualityStatus(u); u._warnings = getQualityWarnings(u);
      setQuestions(p => p.map((qq, i) => i === idx ? u : qq));
      success('Translated');
    } catch (e) { showError(e.message || 'Failed'); }
    finally { setTranslatingIdx(-1); }
  };

  // ── Save ──
  const handleSaveAll = async () => {
    setSaving(true); setSaveProgress({ current: 0, total: questions.length });
    try {
      const result = await onSave({ questions, skipDuplicates: true });
      setSaveProgress({ current: questions.length, total: questions.length, done: true });
      success(`${result?.data?.questions || 0} saved`);
      setTimeout(() => onClose(), 1500);
    } catch (e) { showError(e.message || 'Failed'); }
    finally { setSaving(false); }
  };
  const handleSaveSelected = async () => {
    if (selected.size === 0) return showError('Nothing selected');
    setSaving(true);
    try {
      const result = await onSave({ questions: questions.filter(q => selected.has(q._previewId)), skipDuplicates: true });
      success(`${result?.data?.questions || 0} saved`);
      setTimeout(() => onClose(), 1500);
    } catch (e) { showError(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (!isOpen || questions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-secondary-900 flex flex-col animate-fadeIn">
      {/* TOP BAR */}
      <div className="bg-white dark:bg-secondary-800 border-b border-gray-200 dark:border-secondary-700 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-primary-600" />
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{language === 'hi' ? 'आयात पूर्वावलोकन' : 'Import Preview'}</h2>
            <p className="text-xs text-gray-500">{stats.total} • <span className="text-green-600">{stats.ok} ok</span> • <span className="text-yellow-600">{stats.warn} warn</span> • <span className="text-red-600">{stats.err} err</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-secondary-700 rounded-lg p-0.5">
            {['hi', 'en', 'both'].map(v => (
              <button key={v} onClick={() => setViewLang(v)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${viewLang === v ? 'bg-white dark:bg-secondary-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                {v === 'both' ? 'Both' : v === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="xs" icon={Download} onClick={() => { downloadJSON({ questions }, 'preview.json'); success('Exported'); }}>Export</Button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white dark:bg-secondary-800 border-b border-gray-200 dark:border-secondary-700 px-4 py-2 flex items-center gap-3 flex-shrink-0 flex-wrap">
        <button onClick={selectAll} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900">
          {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
          {selected.size > 0 ? `${selected.size}` : 'All'}
        </button>
        {selected.size > 0 && <Button variant="danger" size="xs" icon={Trash2} onClick={deleteSelected}>Del ({selected.size})</Button>}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 dark:text-secondary-200 w-48" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border border-gray-200 dark:border-secondary-600 rounded-lg px-2 py-1.5 bg-white dark:bg-secondary-700 dark:text-secondary-200">
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]?.[language] || t} ({stats.byType[t]})</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs border border-gray-200 dark:border-secondary-600 rounded-lg px-2 py-1.5 bg-white dark:bg-secondary-700 dark:text-secondary-200">
          <option value="">All</option>
          <option value="ok">OK ({stats.ok})</option>
          <option value="warning">Warn ({stats.warn})</option>
          <option value="error">Error ({stats.err})</option>
        </select>
      </div>

      {/* QUESTIONS */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No questions</p></div>
          ) : filtered.map((q) => {
            const gi = questions.indexOf(q);
            return <PreviewCard key={q._previewId} q={q} index={gi} isSelected={selected.has(q._previewId)} isExpanded={expandedCards.has(q._previewId)} viewLang={viewLang} language={language} isTranslating={translatingIdx === gi} onToggleSelect={() => toggleSelect(q._previewId)} onToggleExpand={() => toggleExpand(q._previewId)} onEdit={() => editQuestion(q, gi)} onDelete={() => deleteOne(q._previewId)} onRetranslate={() => retranslateOne(gi)} />;
          })}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="bg-white dark:bg-secondary-800 border-t border-gray-200 dark:border-secondary-700 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
        <p className="text-sm text-gray-500">{filtered.length}/{stats.total}</p>
        {saveProgress && <div className="flex items-center gap-2 text-sm">{saveProgress.done ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Loader2 className="w-4 h-4 animate-spin text-primary-600" />}<span className={saveProgress.done ? 'text-green-600' : 'text-primary-600'}>{saveProgress.done ? 'Saved!' : `${saveProgress.current}/${saveProgress.total}`}</span></div>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          {selected.size > 0 && <Button variant="outlinePrimary" icon={Save} onClick={handleSaveSelected} loading={saving}>Selected ({selected.size})</Button>}
          <Button variant="primary" icon={Save} onClick={handleSaveAll} loading={saving} disabled={saving || stats.total === 0}>Save All ({stats.total})</Button>
        </div>
      </div>

      {editingQ && <QuestionForm isOpen={!!editingQ} onClose={() => { setEditingQ(null); setEditIndex(-1); }} onSubmit={handleEditSave} initialData={editingQ} syllabus={{ paper1: syllabusPaper1, paper2: syllabusPaper2History }} loading={false} language={language} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PREVIEW CARD — renders each question type properly
// ═══════════════════════════════════════════════════════════
const PreviewCard = ({ q, index, isSelected, isExpanded, viewLang, language, isTranslating, onToggleSelect, onToggleExpand, onEdit, onDelete, onRetranslate }) => {
  const typeColor = getQuestionTypeColor(q.questionType);
  const typeLabel = QUESTION_TYPE_LABELS[q.questionType]?.[language] || q.questionType;
  const statusIcon = q._status === 'ok' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : q._status === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  const showL = (l) => viewLang === 'both' || viewLang === l;
  const getOpts = (l) => getBilingualArray(q.options, l);
  const getOptLabel = (i) => OPTION_LABELS?.[i] || String.fromCharCode(65 + i);
  const getRoman = (i) => ROMAN_NUMERALS?.[i] || `(${i + 1})`;

  // ── Render options shared ──
  const renderOpts = (lang) => {
    const opts = getOpts(lang);
    if (opts.length === 0) return <p className="text-xs text-gray-400 italic">No options ({lang})</p>;
    return (
      <div className="space-y-1">
        {opts.map((opt, oi) => (
          <div key={oi} className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-xs ${oi === q.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 font-medium border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300'}`}>
            <span className="font-bold flex-shrink-0 w-5">{getOptLabel(oi)})</span>
            <span className="flex-1">{opt || '—'}</span>
            {oi === q.correctAnswer && <Check className="w-3 h-3 ml-auto flex-shrink-0 text-green-600" />}
          </div>
        ))}
      </div>
    );
  };

  // ── Type-specific context badges ──
  const renderContextBadge = () => {
    if (q._isPassageSub) return <span className="px-2 py-0.5 text-[10px] rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 flex items-center gap-1"><BookOpen className="w-3 h-3" />{q._passageTitle || 'Passage'}</span>;
    if (q._isDISub) {
      const Icon = q._diType === 'di_table' ? Table2 : q._diType === 'di_bar_chart' ? BarChart3 : q._diType === 'di_pie_chart' ? PieChartIcon : q._diType === 'di_line_graph' ? TrendingUp : FileText;
      return <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center gap-1"><Icon className="w-3 h-3" />{q._diTitle || 'DI'}</span>;
    }
    return null;
  };

  // ════════════════════════════════════════════
  // TYPE-SPECIFIC CONTENT RENDERERS
  // ════════════════════════════════════════════

  const renderAssertionReason = (lang) => {
    const a = q.assertionReasonData?.assertion?.[lang] || '';
    const r = q.assertionReasonData?.reason?.[lang] || '';
    return (
      <div className="space-y-2">
        {/* Assertion */}
        <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800">
          <div className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[9px] font-black">A</div>
            {lang === 'hi' ? 'अभिकथन (A)' : 'Assertion (A)'}
          </div>
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
            {a || <span className="italic text-gray-400">—</span>}
          </div>
        </div>
        {/* Reason */}
        <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
          <div className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[9px] font-black">R</div>
            {lang === 'hi' ? 'कारण (R)' : 'Reason (R)'}
          </div>
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
            {r || <span className="italic text-gray-400">—</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderMatchFollowing = (lang) => {
    const listA = getBilingualArray(q.matchData?.listA, lang);
    const listB = getBilingualArray(q.matchData?.listB, lang);
    if (listA.length === 0 && listB.length === 0) return null;
    const maxLen = Math.max(listA.length, listB.length);
    return (
      <div className="overflow-x-auto rounded-xl border-2 border-gray-300 dark:border-gray-600">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700 to-gray-800">
              <th className="px-3 py-2 text-left text-white font-bold border-r border-gray-600 w-1/2">{lang === 'hi' ? 'सूची-I' : 'List-I'}</th>
              <th className="px-3 py-2 text-left text-white font-bold w-1/2">{lang === 'hi' ? 'सूची-II' : 'List-II'}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxLen }).map((_, idx) => (
              <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white dark:bg-secondary-800' : 'bg-gray-50 dark:bg-secondary-800/50'} border-t border-gray-200 dark:border-secondary-700`}>
                <td className="px-3 py-2 border-r border-gray-200 dark:border-secondary-700">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black flex-shrink-0">{getOptLabel(idx)}</span>
                    <span className="text-gray-800 dark:text-gray-200">{listA[idx] || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex-shrink-0 px-1">{getRoman(idx)}</span>
                    <span className="text-gray-800 dark:text-gray-200">{listB[idx] || '—'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStatements = (lang) => {
    const stmts = getBilingualArray(q.statementData?.statements, lang);
    if (stmts.length === 0) return null;
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-2.5 space-y-1.5">
        {stmts.map((st, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-secondary-800 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <span className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">{idx + 1}</span>
            <span className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{st}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSequenceItems = (lang) => {
    const items = getBilingualArray(q.sequenceData?.items, lang);
    if (items.length === 0) return null;
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    return (
      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 p-2.5 space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2 bg-white dark:bg-secondary-800 rounded-lg border border-orange-200 dark:border-orange-800/50">
            <span className="w-5 h-5 rounded bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">{roman[idx] || idx + 1}</span>
            <span className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    );
  };

  // ════════════════════════════════════════════
  // MAIN CONTENT RENDERER PER LANGUAGE
  // ════════════════════════════════════════════
  const renderTypeContent = (lang) => {
    const qText = q.question?.[lang] || '';
    const type = q.questionType;

    switch (type) {
      case 'assertion_reason':
        return (
          <div className="space-y-2">
            {qText && <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{qText}</p>}
            {renderAssertionReason(lang)}
          </div>
        );

      case 'match_following':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{qText || (lang === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:')}</p>
            {renderMatchFollowing(lang)}
          </div>
        );

      case 'statement_based':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{qText || (lang === 'hi' ? 'कथनों पर विचार कीजिए:' : 'Consider the following:')}</p>
            {renderStatements(lang)}
          </div>
        );

      case 'sequence_order':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{qText || (lang === 'hi' ? 'सही क्रम में व्यवस्थित कीजिए:' : 'Arrange in correct order:')}</p>
            {renderSequenceItems(lang)}
          </div>
        );

      default:
        return <p className="text-sm text-gray-800 dark:text-gray-200">{qText || <span className="italic text-gray-400">—</span>}</p>;
    }
  };

  // ════════════════════════════════════════════
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl border-2 transition-all ${isSelected ? 'border-primary-400 shadow-md' : 'border-gray-200 dark:border-secondary-700'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-secondary-700">
        <button onClick={onToggleSelect} className="flex-shrink-0">{isSelected ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4 text-gray-300" />}</button>
        <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
        {statusIcon}
        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${typeColor.bg} ${typeColor.text}`}>{typeLabel}</span>
        {q.difficulty && <span className={`px-2 py-0.5 text-[10px] rounded-full ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{DIFFICULTY_LABELS[q.difficulty]?.[language] || q.difficulty}</span>}
        {q._confidence != null && <span className={`text-[10px] font-medium ${q._confidence >= 80 ? 'text-green-600' : q._confidence >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{q._confidence}%</span>}
        {renderContextBadge()}
        <div className="flex-1" />
        <button onClick={onRetranslate} disabled={isTranslating} className="p-1 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded text-gray-400 hover:text-primary-600 disabled:opacity-50">{isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}</button>
        <button onClick={onEdit} className="p-1 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded text-gray-400 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        <button onClick={onToggleExpand} className="p-1 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded">{isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}</button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {/* Type-specific content */}
        <div className={viewLang === 'both' ? 'grid grid-cols-2 gap-4' : ''}>
          {showL('hi') && renderTypeContent('hi')}
          {showL('en') && renderTypeContent('en')}
        </div>

        {/* Options (for all types) */}
        <div className={`mt-3 ${viewLang === 'both' ? 'grid grid-cols-2 gap-4' : ''}`}>
          {showL('hi') && renderOpts('hi')}
          {showL('en') && renderOpts('en')}
        </div>

        {/* Expanded: Explanation + Warnings + Meta */}
        {isExpanded && (
          <div className="mt-3 space-y-2">
            {(q.explanation?.hi || q.explanation?.en) && (
              <div className={`p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs ${viewLang === 'both' ? 'grid grid-cols-2 gap-3' : ''}`}>
                {showL('hi') && q.explanation?.hi && <p className="text-blue-800 dark:text-blue-300"><span className="font-semibold">व्याख्या:</span> {q.explanation.hi}</p>}
                {showL('en') && q.explanation?.en && <p className="text-blue-700 dark:text-blue-400"><span className="font-semibold">Explanation:</span> {q.explanation.en}</p>}
              </div>
            )}
            {q._warnings?.length > 0 && (
              <div className="flex flex-wrap gap-1">{q._warnings.map((w, wi) => (
                <span key={wi} className={`px-2 py-0.5 text-[10px] rounded-full ${w.level === 'error' ? 'bg-red-100 text-red-700' : w.level === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{w.msg}</span>
              ))}</div>
            )}
            <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
              {q.paper && <span className="bg-gray-100 dark:bg-secondary-700 px-1.5 py-0.5 rounded">{q.paper}</span>}
              {q.unit && <span>Unit: {q.unit}</span>}
              {q.chapter && <span>Ch: {q.chapter}</span>}
              {q.topic && <span>Topic: {q.topic}</span>}
              {q.source && <span>Src: {q.source}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPreview;