// client/src/components/test/QuestionLibraryModal.jsx
// ════════════════════════════════════════════════════════════════
// EXTREME ADVANCED v4.0 — Test usage, Analytics, Inline edit,
// Smart suggestions, Export, Quality scores, Full type rendering
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Search, Check, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  FileText, Eye, Calendar, RefreshCw, Trash2, LayoutGrid, List,
  Languages, Sliders, BookOpen, Target, Layers, Star,
  CheckCheck, ArrowUpDown, RotateCcw, Sparkles, Tag,
  Flame, Gauge, CircleDot, BarChart3, PanelLeftClose, PanelLeft,
  Maximize2, Minimize2, ChevronFirst, ChevronLast, Plus, Minus,
  Zap, ChevronDown, ChevronUp, SlidersHorizontal, Hash,
  Clock, Award, Activity, Copy, Download, Edit2,
  ClipboardList, AlertTriangle, Shield, Info, ExternalLink,
  GripVertical, ArrowRight, Filter as FilterIcon
} from 'lucide-react';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, PAPER_LABELS } from '../../utils/constants';
import { getBilingualText, getBilingualArray, formatDate, getRelativeTime } from '../../utils/helpers';
import { FilterChip, DateRangePicker, MiniMultiSelect, QuestionPreviewModal } from './library';
import questionService from '../../services/questionService';
import { useToast } from '../common/Toast';

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
const getQText = (q, lang) => {
  if (!q?.question) {
    if (q?.assertionReasonData?.assertion) {
      const a = q.assertionReasonData.assertion;
      return a[lang] || a.hi || a.en || '';
    }
    if (q?.statementData?.statements) {
      const s = q.statementData.statements;
      const arr = s[lang] || s.hi || s.en || [];
      return Array.isArray(arr) ? arr.slice(0, 2).join(' | ') : '';
    }
    return q?.topic || q?.chapter || '';
  }
  if (typeof q.question === 'string') return q.question;
  return q.question[lang] || q.question.hi || q.question.en || '';
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const DIFF = {
  easy: { label: { hi: 'आसान', en: 'Easy' }, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', pill: 'bg-emerald-600 text-white border-emerald-600', pillOff: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  medium: { label: { hi: 'मध्यम', en: 'Medium' }, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', pill: 'bg-amber-600 text-white border-amber-600', pillOff: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  hard: { label: { hi: 'कठिन', en: 'Hard' }, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', pill: 'bg-red-600 text-white border-red-600', pillOff: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' }
};

// ═══ Quality Calculator ═══
const calcQuality = (q) => {
  if (!q) return { score: 0, issues: [] };
  let s = 0;
  const issues = [];
  const hasHi = !!(q.question?.hi || q.assertionReasonData?.assertion?.hi);
  const hasEn = !!(q.question?.en || q.assertionReasonData?.assertion?.en);
  if (hasHi) s += 15; else issues.push('No Hindi');
  if (hasEn) s += 15; else issues.push('No English');
  const optH = q.options?.hi?.filter(o => o?.trim())?.length || 0;
  const optE = q.options?.en?.filter(o => o?.trim())?.length || 0;
  if (optH >= 4 || optE >= 4) s += 20; else if (optH >= 2 || optE >= 2) { s += 10; issues.push(`Only ${Math.max(optH, optE)} options`); } else issues.push('Missing options');
  if (q.correctAnswer !== null && q.correctAnswer !== undefined) s += 10; else issues.push('No answer');
  if (q.explanation?.hi || q.explanation?.en) s += 15; else issues.push('No explanation');
  if (q.chapter) s += 5; else issues.push('No chapter');
  if (q.topic) s += 5;
  if (q.difficulty) s += 5;
  if (q.tags?.length > 0) s += 2;
  if (q.source) s += 3;
  s += 5; // base
  return { score: Math.min(100, s), issues };
};

// ═══ Quality Badge ═══
const QualityBadge = ({ score }) => {
  const c = score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 60 ? 'text-blue-600 bg-blue-50' : score >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black ${c}`} title={`Quality: ${score}%`}>
      <svg className="w-3 h-3 -rotate-90" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
        <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray={`${score * 0.44} 999`} strokeLinecap="round" />
      </svg>
      {score}%
    </span>
  );
};

// ═══ Test Usage Mini Badge ═══
const TestUsageMini = ({ count, onClick }) => {
  if (!count || count === 0) return null;
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onClick?.(); }}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
      title={`Used in ${count} test(s)`}>
      <ClipboardList className="w-2.5 h-2.5" />{count}
    </button>
  );
};

// ════════════════════════════════════════
// ★ QUESTION CARD (Extreme Enhanced)
// ════════════════════════════════════════
const QuestionCard = React.memo(({
  q, idx, globalIdx, isSelected, displayLang, language,
  onToggle, onPreview, viewMode,
  testUsage = [], onShowTestUsage
}) => {
  const [expanded, setExpanded] = useState(false);
  const t = (h, e) => language === 'hi' ? h : e;

  const text = getQText(q, displayLang);
  const plain = stripHtml(text);
  const isLong = plain.length > 200;
  const isHtml = text !== plain && text.includes('<');
  const dc = DIFF[q.difficulty] || DIFF.medium;
  const quality = useMemo(() => calcQuality(q), [q]);

  const hasHi = !!(q.question?.hi || q.assertionReasonData?.assertion?.hi);
  const hasEn = !!(q.question?.en || q.assertionReasonData?.assertion?.en);
  const hasExpl = !!(q.explanation?.hi || q.explanation?.en);

  // Get options
  const getOpts = () => {
    if (!q.options) return [];
    if (Array.isArray(q.options)) return q.options;
    const arr = q.options[displayLang] || q.options.hi || q.options.en;
    return Array.isArray(arr) ? arr : [];
  };
  const opts = getOpts();
  const correctIdx = q.correctAnswer;

  // Type-specific preview
  const getTypePreview = () => {
    if (plain) return null;
    if (q.questionType === 'assertion_reason') {
      const a = q.assertionReasonData?.assertion;
      const aText = a?.[displayLang] || a?.hi || a?.en || '';
      return aText ? (
        <span className="text-[12px] text-gray-700">
          <span className="text-[10px] font-bold text-blue-600 mr-1">A:</span>
          {aText.substring(0, 80)}{aText.length > 80 ? '…' : ''}
        </span>
      ) : null;
    }
    if (q.questionType === 'statement_based') {
      const s = q.statementData?.statements;
      const arr = s?.[displayLang] || s?.hi || s?.en || [];
      return arr.length > 0 ? (
        <div className="text-[12px] text-gray-700 space-y-0.5">
          {arr.slice(0, 2).map((st, si) => (
            <span key={si} className="block">
              <span className="text-[10px] font-bold text-amber-600 mr-1">{si + 1}.</span>
              {(typeof st === 'string' ? st : '').substring(0, 55)}{st?.length > 55 ? '…' : ''}
            </span>
          ))}
        </div>
      ) : null;
    }
    if (q.questionType === 'match_following') {
      const listA = q.matchData?.listA;
      const arr = listA?.[displayLang] || listA?.hi || listA?.en || [];
      return arr.length > 0 ? (
        <span className="text-[12px] text-gray-700">
          <span className="text-[10px] font-bold text-green-600 mr-1">{t('सुमेलन:', 'Match:')}</span>
          {arr.slice(0, 2).join(' | ').substring(0, 70)}…
        </span>
      ) : null;
    }
    return null;
  };

  const typePreview = getTypePreview();

  // ═══ GRID VIEW ═══
  if (viewMode === 'grid') {
    return (
      <div onClick={e => { e.stopPropagation(); onToggle(q); }}
        className={`relative p-3 rounded-2xl border-2 cursor-pointer group transition-all duration-200
          ${isSelected ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 shadow-lg' : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-lg'}`}>
        <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all
          ${isSelected ? 'bg-primary-600 shadow-lg ring-2 ring-primary-300/50' : 'bg-gray-100 group-hover:bg-primary-100'}`}>
          {isSelected ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <span className="text-[9px] font-bold text-gray-400">{globalIdx}</span>}
        </div>
        <div className="flex flex-wrap gap-1 mb-2 pr-8">
          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded-md font-bold">{q.paper === 'paper1' ? 'P1' : 'P2'}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${dc.bg} ${dc.text}`}>{(q.difficulty || 'M')[0].toUpperCase()}</span>
          {q.isPYQ && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md font-bold">PYQ</span>}
          <QualityBadge score={quality.score} />
          <TestUsageMini count={testUsage.length} onClick={() => onShowTestUsage?.(q, testUsage)} />
        </div>
        <p className="text-[11px] text-gray-700 leading-relaxed break-words mb-2 min-h-[40px]">
          {plain.substring(0, 130)}{plain.length > 130 ? '…' : ''}
        </p>
        {opts.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {opts.slice(0, 4).map((opt, oi) => {
              const oText = stripHtml(typeof opt === 'string' ? opt : '');
              const correct = correctIdx === oi;
              return (
                <span key={oi} className={`text-[8px] px-1.5 py-0.5 rounded border truncate max-w-[80px]
                  ${correct ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {correct ? '✓' : String.fromCharCode(65 + oi)}: {oText.substring(0, 18)}
                </span>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
          <span className="text-[9px] text-gray-400 truncate max-w-[80px]">{q.chapter || q.unit || ''}</span>
          <div className="flex items-center gap-1">
            {hasExpl && <span className="text-[8px]" title="Has explanation">💡</span>}
            <button type="button" onClick={e => { e.stopPropagation(); onPreview(q); }}
              className="p-1 hover:bg-primary-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-3 h-3 text-gray-400 group-hover:text-primary-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ LIST VIEW ═══
  return (
    <div onClick={e => { e.stopPropagation(); onToggle(q); }}
      className={`p-3 rounded-2xl border-2 cursor-pointer group relative transition-all duration-200
        ${isSelected
          ? 'border-primary-500 bg-gradient-to-r from-primary-50/80 to-blue-50/40 shadow-lg ring-1 ring-primary-500/20'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-lg'}`}>
      <div className="flex gap-3">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all
          ${isSelected ? 'bg-primary-600 border-primary-600 shadow-md' : 'border-gray-300 group-hover:border-primary-400'}`}>
          {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Tags Row */}
          <div className="flex flex-wrap gap-1 mb-1.5 items-center">
            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold tabular-nums">#{q.questionNumber || globalIdx}</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold">{q.paper === 'paper1' ? 'P1' : 'P2'}</span>
            {q.unit && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold truncate max-w-[140px]" title={q.unit}>{q.unit}</span>}
            {q.chapter && <span className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md font-semibold truncate max-w-[120px]" title={q.chapter}>{q.chapter}</span>}
            {q.topic && <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-md font-semibold truncate max-w-[100px]" title={q.topic}>{q.topic}</span>}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${dc.bg} ${dc.text}`}>{dc.label[displayLang]}</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold">
              {QUESTION_TYPE_LABELS[q.questionType]?.[displayLang] || q.questionType}
            </span>
            {q.isPYQ && <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />PYQ {q.year || ''}</span>}
            {/* Language + Explanation indicators */}
            <div className="flex gap-0.5 items-center">
              <span className={`w-5 h-3.5 text-[7px] font-black rounded flex items-center justify-center ${hasHi ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>हि</span>
              <span className={`w-5 h-3.5 text-[7px] font-black rounded flex items-center justify-center ${hasEn ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>En</span>
              {hasExpl && <span className="w-4 h-3.5 text-[7px] rounded bg-green-100 flex items-center justify-center" title="Explanation">💡</span>}
            </div>
            {/* Quality Score */}
            <QualityBadge score={quality.score} />
            {/* Test Usage */}
            <TestUsageMini count={testUsage.length} onClick={() => onShowTestUsage?.(q, testUsage)} />
          </div>

          {/* Question Text / Type Preview */}
          <div className="mb-1.5">
            {typePreview && !plain && typePreview}
            {(plain || !typePreview) && (
              isHtml ? (
                <div className="text-[13px] text-gray-800 leading-relaxed break-words question-html-content"
                  dangerouslySetInnerHTML={{ __html: expanded || !isLong ? text : text.substring(0, 250) + '…' }} />
              ) : (
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {expanded || !isLong ? plain : plain.substring(0, 200) + '…'}
                </p>
              )
            )}
            {isLong && (
              <button type="button" onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
                className="mt-0.5 text-[11px] font-bold text-primary-600 flex items-center gap-0.5">
                {expanded ? <><ChevronUp className="w-3 h-3" />{t('कम', 'Less')}</> : <><ChevronDown className="w-3 h-3" />{t('और', 'More')}</>}
              </button>
            )}
          </div>

          {/* ═══ OPTIONS PREVIEW ═══ */}
          {opts.length > 0 && (
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              {opts.slice(0, 4).map((opt, oi) => {
                const oText = stripHtml(typeof opt === 'string' ? opt : (opt?.[displayLang] || opt?.hi || opt?.en || ''));
                const correct = correctIdx === oi;
                return (
                  <div key={oi} className={`text-[10px] px-2 py-1.5 rounded-lg border flex items-start gap-1.5
                    ${correct ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <span className={`font-black w-4 h-4 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5
                      ${correct ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {correct ? '✓' : String.fromCharCode(65 + oi)}
                    </span>
                    <span className={`truncate ${correct ? 'font-semibold' : ''}`}>
                      {oText ? oText.substring(0, 50) : <span className="italic text-gray-400">—</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ TEST USAGE INLINE (when expanded) ═══ */}
          {expanded && testUsage.length > 0 && (
            <div className="mt-2 p-2 bg-violet-50 rounded-xl border border-violet-200">
              <p className="text-[10px] font-bold text-violet-700 mb-1 flex items-center gap-1">
                <ClipboardList className="w-3 h-3" />
                {t(`${testUsage.length} टेस्ट में उपयोग`, `Used in ${testUsage.length} test(s)`)}
              </p>
              <div className="flex flex-wrap gap-1">
                {testUsage.slice(0, 4).map((test, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded font-semibold truncate max-w-[120px]">
                    {test.title?.substring(0, 20)}{test.title?.length > 20 ? '…' : ''}
                  </span>
                ))}
                {testUsage.length > 4 && <span className="text-[9px] px-2 py-0.5 bg-violet-200 text-violet-800 rounded font-bold">+{testUsage.length - 4}</span>}
              </div>
            </div>
          )}

          {/* Quality warnings (when expanded) */}
          {expanded && quality.issues.length > 0 && (
            <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{t('सुझाव', 'Suggestions')}
              </p>
              <div className="flex flex-wrap gap-1">
                {quality.issues.map((issue, i) => (
                  <span key={i} className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">{issue}</span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2 text-[9px] text-gray-400">
              <span className="flex items-center gap-0.5 tabular-nums">
                <Calendar className="w-2.5 h-2.5" />
                {q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : ''}
              </span>
              {q.source && <span className="truncate max-w-[60px]">{q.source}</span>}
              {q.timesAttempted > 0 && (
                <span className="flex items-center gap-0.5">
                  <Activity className="w-2.5 h-2.5" />{q.timesAttempted}
                </span>
              )}
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); onPreview(q); }}
              className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-[10px] font-bold text-primary-600 hover:bg-primary-50 rounded-lg flex items-center gap-1 transition-all">
              <Eye className="w-3 h-3" />{t('देखें', 'Preview')}
            </button>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2.5 right-2.5">
          <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-primary-300/50">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        </div>
      )}
    </div>
  );
});

// ════════════════════════════════════════
// SIDEBAR (Enhanced with test info)
// ════════════════════════════════════════
const Sidebar = React.memo(({ selectedQuestions, language, marksPerQuestion, onClear, onClose, testUsageMap }) => {
  const t = (h, e) => language === 'hi' ? h : e;
  const total = selectedQuestions.length;

  const summary = useMemo(() => {
    const d = { easy: 0, medium: 0, hard: 0 }, ty = {}, un = {};
    let pyq = 0, withTests = 0, totalTestLinks = 0;
    selectedQuestions.forEach(q => {
      d[q.difficulty || 'medium']++;
      ty[q.questionType || 'mcq'] = (ty[q.questionType || 'mcq'] || 0) + 1;
      if (q.unit) un[q.unit] = (un[q.unit] || 0) + 1;
      if (q.isPYQ) pyq++;
      const usage = testUsageMap?.[q._id] || [];
      if (usage.length > 0) { withTests++; totalTestLinks += usage.length; }
    });
    return { d, ty, un, pyq, withTests, totalTestLinks };
  }, [selectedQuestions, testUsageMap]);

  return (
    <div className="w-72 border-l border-gray-200 bg-gray-50/80 flex flex-col h-full backdrop-blur-sm">
      <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-white/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md"><BarChart3 className="w-4 h-4 text-white" /></div>
          <div><h4 className="text-sm font-bold text-gray-900">{t('विश्लेषण', 'Analysis')}</h4><p className="text-[10px] text-gray-500">{total} {t('चुने', 'sel')}</p></div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
        {total === 0 ? (
          <div className="text-center py-12"><CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t('कोई प्रश्न नहीं', 'No questions')}</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-200 text-center">
                <p className="text-2xl font-black text-primary-600 tabular-nums">{total}</p><p className="text-[9px] text-gray-500 uppercase font-bold">{t('प्रश्न', 'Q')}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 text-center">
                <p className="text-2xl font-black text-green-600 tabular-nums">{total * marksPerQuestion}</p><p className="text-[9px] text-gray-500 uppercase font-bold">{t('अंक', 'Marks')}</p>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-2">{t('कठिनाई', 'Difficulty')}</h5>
              {Object.entries(DIFF).map(([key, cfg]) => (
                <div key={key} className={`flex items-center justify-between p-2 rounded-lg ${cfg.bg} mb-1`}>
                  <div className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${cfg.dot}`} /><span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label[language]}</span></div>
                  <span className="text-xs font-black tabular-nums">{summary.d[key]} <span className="text-gray-400 font-normal text-[10px]">({total ? Math.round((summary.d[key] / total) * 100) : 0}%)</span></span>
                </div>
              ))}
              <div className="mt-1.5 h-1.5 rounded-full bg-gray-200 overflow-hidden flex">
                {Object.entries(DIFF).map(([k, c]) => { const p = total ? (summary.d[k] / total) * 100 : 0; return p > 0 ? <div key={k} className={c.dot} style={{ width: `${p}%` }} /> : null; })}
              </div>
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

            {/* PYQ */}
            {summary.pyq > 0 && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Star className="w-3 h-3 fill-current" />PYQ</span>
                <span className="text-sm font-black text-amber-600 tabular-nums">{summary.pyq}</span>
              </div>
            )}

            {/* ═══ TEST USAGE SUMMARY ═══ */}
            {summary.withTests > 0 && (
              <div className="p-2.5 bg-violet-50 rounded-xl border border-violet-200">
                <h5 className="text-[10px] font-bold text-violet-700 uppercase mb-1.5 flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />{t('टेस्ट उपयोग', 'Test Usage')}
                </h5>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-violet-600">{t('टेस्ट में उपयोग', 'Used in tests')}</span>
                  <span className="font-black text-violet-700">{summary.withTests}/{total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-violet-600">{t('कुल लिंक', 'Total links')}</span>
                  <span className="font-black text-violet-700">{summary.totalTestLinks}</span>
                </div>
              </div>
            )}

            {/* Units */}
            {Object.keys(summary.un).length > 0 && (
              <div>
                <h5 className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">{t('इकाइयां', 'Units')}</h5>
                {Object.entries(summary.un).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([un, cnt]) => (
                  <div key={un} className="flex justify-between py-1 text-xs"><span className="text-gray-600 truncate max-w-[140px]">{un}</span><span className="font-bold tabular-nums">{cnt}</span></div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {total > 0 && (
        <div className="p-3 border-t bg-white/80">
          <div className="text-center text-[10px] text-gray-500 mb-2">
            {t('अंक:', 'Marks:')} <b className="text-green-600">{total * marksPerQuestion}</b> •
            {t(' समय:', ' Time:')} <b className="text-blue-600">~{Math.round(total * 1.2)}m</b> •
            {t(' गुण:', ' Avg Q:')} <b className="text-purple-600">{total > 0 ? Math.round(selectedQuestions.reduce((s, q) => s + calcQuality(q).score, 0) / total) : 0}%</b>
          </div>
          <button onClick={onClear} className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" />{t('सभी हटाएं', 'Clear All')}</button>
        </div>
      )}
    </div>
  );
});

// ═══ Test Usage Detail Modal ═══
const TestUsageModal = ({ question, tests, isOpen, onClose, language }) => {
  if (!isOpen || !question) return null;
  const t = (h, e) => language === 'hi' ? h : e;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-gray-200 bg-violet-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">{t('टेस्ट उपयोग', 'Test Usage')}</h3>
              <p className="text-[10px] text-gray-500">Q.{question.questionNumber || '?'} — {tests.length} {t('टेस्ट', 'tests')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">{t('किसी टेस्ट में उपयोग नहीं', 'Not used in any test')}</p>
            </div>
          ) : (
            tests.map((test, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-violet-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{test.title}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-200 rounded text-[9px] font-bold uppercase">{test.testType}</span>
                      {test.paper && <span>{test.paper}</span>}
                      {test.totalQuestions && <span>{test.totalQuestions}Q</span>}
                      {test.createdAt && <span>{formatDate(test.createdAt)}</span>}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${test.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {test.status || 'active'}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm">{t('बंद करें', 'Close')}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ══════════════════════════════════════════
// ★★★ MAIN MODAL ★★★
// ══════════════════════════════════════════
const QuestionLibraryModal = ({
  isOpen, onClose, questions = [], questionsLoading,
  selectedQuestions, onToggleQuestion, onSelectAll, onSelectAllFiltered,
  onClearAll, onApplyFilters, language = 'hi', marksPerQuestion = 2,
  getUnitOptions, getChapterOptions, getTopicOptions, getTypeOptions, mainFilters
}) => {
  const t = useCallback((h, e) => language === 'hi' ? h : e, [language]);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [displayLang, setDisplayLang] = useState(language);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('all');
  const [fullscreen, setFullscreen] = useState(false);
  const [batchMsg, setBatchMsg] = useState(null);
  const searchRef = useRef(null);

  // ═══ NEW STATE: Test usage tracking ═══
  const [testUsageMap, setTestUsageMap] = useState({});
  const [testUsageLoading, setTestUsageLoading] = useState(false);
  const [testUsageQuestion, setTestUsageQuestion] = useState(null);
  const [testUsageTests, setTestUsageTests] = useState([]);

  const [filters, setFilters] = useState({
    papers: [], units: [], chapters: [], topics: [],
    types: [], difficulties: [], startDate: '', endDate: '', isPYQ: null
  });

  const selectedIds = useMemo(() => new Set(selectedQuestions.map(q => q._id)), [selectedQuestions]);

  // ═══ LOAD TEST USAGE ═══
  useEffect(() => {
    if (isOpen && questions.length > 0) {
      loadTestUsage(questions.map(q => q._id));
    }
  }, [isOpen, questions]);

  const loadTestUsage = async (ids) => {
    if (!ids || ids.length === 0) return;
    setTestUsageLoading(true);
    try {
      const res = await questionService.getTestUsage(ids.slice(0, 200));
      if (res.success) {
        setTestUsageMap(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Test usage load failed:', err);
    } finally {
      setTestUsageLoading(false);
    }
  };

  const handleShowTestUsage = (question, tests) => {
    setTestUsageQuestion(question);
    setTestUsageTests(tests);
  };

  // ═══ EXPORT SELECTED ═══
  const handleExportSelected = useCallback(() => {
    const data = selectedQuestions.length > 0 ? selectedQuestions : [];
    if (data.length === 0) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} ${t('प्रश्न निर्यात', 'questions exported')}`);
  }, [selectedQuestions, toast, t]);

  useEffect(() => {
    if (isOpen) {
      setFilters({
        papers: [...(mainFilters?.papers || [])], units: [...(mainFilters?.units || [])],
        chapters: [...(mainFilters?.chapters || [])], topics: [...(mainFilters?.topics || [])],
        types: [...(mainFilters?.types || [])], difficulties: [], startDate: '', endDate: '', isPYQ: null
      });
      setPage(1); setSearchQuery(''); setTab('all'); setBatchMsg(null); setShowFilters(false);
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [isOpen, mainFilters]);

  useEffect(() => { setDisplayLang(language); }, [language]);

  // ═══ FILTERED + SORTED ═══
  const filtered = useMemo(() => {
    let r = [...questions];
    if (filters.papers.length) r = r.filter(q => filters.papers.includes(q.paper));
    if (filters.units.length && getUnitOptions) {
      const opts = getUnitOptions(filters.papers.length ? filters.papers : mainFilters?.papers) || [];
      const names = filters.units.map(k => (opts.find(x => x.value === k)?.label || k));
      r = r.filter(q => q.unit && names.some(n => { const c = n.replace(/^P[12]:\s*/i, '').trim(); return q.unit.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(q.unit.toLowerCase()); }));
    }
    if (filters.chapters.length && getChapterOptions) {
      const opts = getChapterOptions(filters.units.length ? filters.units : mainFilters?.units || [], filters.papers.length ? filters.papers : mainFilters?.papers || []) || [];
      const names = filters.chapters.map(k => { const o = opts.find(x => x.value === k); return o ? (o.shortName || o.label) : k; });
      r = r.filter(q => q.chapter && names.some(n => q.chapter.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(q.chapter.toLowerCase())));
    }
    if (filters.topics.length) r = r.filter(q => q.topic && filters.topics.some(v => q.topic.toLowerCase().includes(v.toLowerCase())));
    if (filters.types.length) r = r.filter(q => filters.types.includes(q.questionType));
    if (filters.difficulties.length) r = r.filter(q => filters.difficulties.includes(q.difficulty));
    if (filters.isPYQ === true) r = r.filter(q => q.isPYQ);
    else if (filters.isPYQ === false) r = r.filter(q => !q.isPYQ);
    if (filters.startDate) { const sd = new Date(filters.startDate); sd.setHours(0, 0, 0, 0); r = r.filter(q => q.createdAt && new Date(q.createdAt) >= sd); }
    if (filters.endDate) { const ed = new Date(filters.endDate); ed.setHours(23, 59, 59, 999); r = r.filter(q => q.createdAt && new Date(q.createdAt) <= ed); }
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase();
      r = r.filter(q => (getQText(q, 'hi') + ' ' + getQText(q, 'en')).toLowerCase().includes(sq) || (q.unit || '').toLowerCase().includes(sq) || (q.chapter || '').toLowerCase().includes(sq) || (q.topic || '').toLowerCase().includes(sq) || String(q.questionNumber || '').includes(sq));
    }
    const ord = { easy: 1, medium: 2, hard: 3 };
    switch (sortBy) {
      case 'newest': r.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
      case 'oldest': r.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); break;
      case 'difficulty_asc': r.sort((a, b) => (ord[a.difficulty] || 2) - (ord[b.difficulty] || 2)); break;
      case 'difficulty_desc': r.sort((a, b) => (ord[b.difficulty] || 2) - (ord[a.difficulty] || 2)); break;
      case 'type': r.sort((a, b) => (a.questionType || '').localeCompare(b.questionType || '')); break;
      case 'number': r.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0)); break;
      case 'quality': r.sort((a, b) => calcQuality(b).score - calcQuality(a).score); break;
      case 'most_used': r.sort((a, b) => (testUsageMap[b._id]?.length || 0) - (testUsageMap[a._id]?.length || 0)); break;
      case 'unused': r.sort((a, b) => (testUsageMap[a._id]?.length || 0) - (testUsageMap[b._id]?.length || 0)); break;
      default: break;
    }
    return r;
  }, [questions, filters, searchQuery, sortBy, getUnitOptions, getChapterOptions, mainFilters, testUsageMap]);

  const display = useMemo(() => tab === 'selected' ? selectedQuestions : filtered, [tab, selectedQuestions, filtered]);
  const totalPages = Math.max(1, Math.ceil(display.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(Math.max(1, totalPages)); }, [totalPages, page]);
  const paginated = useMemo(() => display.slice((page - 1) * perPage, page * perPage), [display, page, perPage]);

  const filterCount = useMemo(() => {
    let c = 0;
    ['papers', 'units', 'chapters', 'topics', 'types', 'difficulties'].forEach(k => { if (filters[k].length) c++; });
    if (filters.startDate || filters.endDate) c++;
    if (filters.isPYQ !== null) c++;
    return c;
  }, [filters]);

  const quickCounts = useMemo(() => {
    const c = { easy: 0, medium: 0, hard: 0, pyq: 0, unused: 0 }, tc = {};
    questions.forEach(q => {
      if (q.difficulty) c[q.difficulty]++;
      if (q.isPYQ) c.pyq++;
      if (q.questionType) tc[q.questionType] = (tc[q.questionType] || 0) + 1;
      if (!(testUsageMap[q._id]?.length)) c.unused++;
    });
    return { ...c, types: tc };
  }, [questions, testUsageMap]);

  const selOnPage = useMemo(() => paginated.filter(q => selectedIds.has(q._id)).length, [paginated, selectedIds]);
  const allPageSel = paginated.length > 0 && selOnPage === paginated.length;
  const unselCount = useMemo(() => filtered.filter(q => !selectedIds.has(q._id)).length, [filtered, selectedIds]);

  // ═══ KEYBOARD ═══
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => {
      if (e.key === 'Escape') { if (testUsageQuestion) { setTestUsageQuestion(null); return; } preview ? setPreview(null) : onClose(); return; }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, preview, totalPages, testUsageQuestion]);

  // ═══ SELECTION HANDLERS ═══
  const flash = useCallback(msg => { setBatchMsg(msg); setTimeout(() => setBatchMsg(null), 2500); }, []);

  const handleBatchSelect = useCallback((count) => {
    const unsel = filtered.filter(q => !selectedIds.has(q._id));
    const toAdd = unsel.slice(0, Math.min(count, unsel.length));
    if (toAdd.length === 0) { flash(t('सभी चुने हुए', 'All selected')); return; }
    onSelectAllFiltered(toAdd);
    flash(`✓ +${toAdd.length} ${t('चुने', 'selected')}!`);
  }, [filtered, selectedIds, onSelectAllFiltered, flash, t]);

  const handleSelectPage = useCallback(() => {
    const toAdd = paginated.filter(q => !selectedIds.has(q._id));
    if (toAdd.length === 0) return;
    onSelectAllFiltered(toAdd);
  }, [paginated, selectedIds, onSelectAllFiltered]);

  const handleDeselectPage = useCallback(() => {
    paginated.forEach(q => { if (selectedIds.has(q._id)) onToggleQuestion(q); });
  }, [paginated, selectedIds, onToggleQuestion]);

  const handleSelectAllFiltered = useCallback(() => {
    const toAdd = filtered.filter(q => !selectedIds.has(q._id));
    if (toAdd.length === 0) return;
    onSelectAllFiltered(toAdd);
  }, [filtered, selectedIds, onSelectAllFiltered]);

  const handleInvert = useCallback(() => {
    filtered.forEach(q => onToggleQuestion(q));
  }, [filtered, onToggleQuestion]);

  const handleToggle = useCallback((q) => { onToggleQuestion(q); }, [onToggleQuestion]);

  // ═══ FILTER HANDLERS ═══
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => {
      const n = { ...prev, [key]: value };
      if (key === 'papers') { n.units = []; n.chapters = []; n.topics = []; }
      else if (key === 'units') { n.chapters = []; n.topics = []; }
      else if (key === 'chapters') { n.topics = []; }
      return n;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ papers: [], units: [], chapters: [], topics: [], types: [], difficulties: [], startDate: '', endDate: '', isPYQ: null });
    setSearchQuery(''); setPage(1);
  }, []);

  const applyFilters = useCallback(() => {
    const f = {};
    if (filters.papers.length) f.paper = filters.papers;
    if (filters.types.length) f.questionType = filters.types;
    if (filters.difficulties.length) f.difficulty = filters.difficulties;
    if (searchQuery.trim()) f.search = searchQuery.trim();
    if (filters.startDate) f.startDate = filters.startDate;
    if (filters.endDate) f.endDate = filters.endDate;
    onApplyFilters(f); setPage(1);
  }, [filters, searchQuery, onApplyFilters]);

  const toggleDiff = useCallback(d => { setFilters(p => ({ ...p, difficulties: p.difficulties.includes(d) ? p.difficulties.filter(x => x !== d) : [...p.difficulties, d] })); setPage(1); }, []);
  const togglePYQ = useCallback(() => { setFilters(p => ({ ...p, isPYQ: p.isPYQ === true ? null : true })); setPage(1); }, []);
  const toggleType = useCallback(ty => { setFilters(p => ({ ...p, types: p.types.includes(ty) ? p.types.filter(x => x !== ty) : [...p.types, ty] })); setPage(1); }, []);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-1.5 sm:p-3">
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full flex overflow-hidden border border-gray-200 transition-all ${fullscreen ? 'max-w-full h-full rounded-none' : 'max-w-7xl h-[97vh]'}`}>
        <div className="flex-1 flex flex-col min-w-0">

          {/* ═══ HEADER ═══ */}
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0"><BookOpen className="w-5 h-5 text-white" /></div>
                <div className="min-w-0">
                  <h3 className="font-black text-lg text-gray-900 leading-tight">{t('प्रश्न लाइब्रेरी', 'Question Library')}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="tabular-nums font-medium">{filtered.length}/{questions.length} {t('प्रश्न', 'Q')}</span>
                    {testUsageLoading && <span className="text-violet-500 flex items-center gap-0.5"><Activity className="w-3 h-3 animate-pulse" />{t('टेस्ट लोड...', 'Loading tests...')}</span>}
                    {selectedQuestions.length > 0 && (
                      <span className="text-primary-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />{selectedQuestions.length} {t('चुने', 'sel')}
                        <span className="text-green-600 ml-0.5">({selectedQuestions.length * marksPerQuestion}M)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Language toggle */}
                <div className="hidden sm:flex bg-gray-100 rounded-xl p-0.5">
                  {[{ k: 'hi', l: 'हि' }, { k: 'en', l: 'En' }].map(l => (
                    <button key={l.k} type="button" onClick={() => setDisplayLang(l.k)}
                      className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${displayLang === l.k ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>{l.l}</button>
                  ))}
                </div>
                {selectedQuestions.length > 0 && (
                  <>
                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-primary-50 border border-primary-200 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
                      <span className="text-xs font-black text-primary-700 tabular-nums">{selectedQuestions.length}</span>
                    </div>
                    <button type="button" onClick={handleExportSelected} title={t('निर्यात', 'Export')} className="hidden sm:flex p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => setShowSidebar(!showSidebar)} className={`hidden lg:flex p-2 rounded-xl border transition-all ${showSidebar ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-500'}`}>
                  {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                </button>
                <button type="button" onClick={() => setFullscreen(!fullscreen)} className="hidden sm:flex p-2 hover:bg-gray-100 rounded-xl">
                  {fullscreen ? <Minimize2 className="w-4 h-4 text-gray-500" /> : <Maximize2 className="w-4 h-4 text-gray-500" />}
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
          </div>

          {/* ═══ SEARCH + CONTROLS ═══ */}
          <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input ref={searchRef} type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder={t('खोजें… ( / )', 'Search… ( / )')}
                  className="w-full pl-9 pr-9 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white text-sm text-gray-900" />
                {searchQuery && <button type="button" onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>
              <button type="button" onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap
                  ${showFilters ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md' : 'border-gray-200 text-gray-600'}`}>
                <SlidersHorizontal className="w-4 h-4" />
                {filterCount > 0 && <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">{filterCount}</span>}
              </button>
              {/* Batch select */}
              <div className="hidden md:flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200">
                {[5, 10, 25, 50].map(n => (
                  <button key={n} type="button" onClick={() => handleBatchSelect(Math.min(n, unselCount))} disabled={unselCount === 0}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${unselCount > 0 ? 'text-primary-700 hover:bg-primary-100 active:scale-95' : 'text-gray-400 cursor-not-allowed'}`}>
                    <Plus className="w-3 h-3 inline" />{n}
                  </button>
                ))}
              </div>
              {/* Sort - with NEW options */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="hidden sm:block px-2 py-2.5 border-2 border-gray-200 rounded-xl text-xs bg-white cursor-pointer">
                <option value="newest">{t('नवीनतम', 'Newest')}</option>
                <option value="oldest">{t('पुराने', 'Oldest')}</option>
                <option value="difficulty_asc">Diff ↑</option>
                <option value="difficulty_desc">Diff ↓</option>
                <option value="number">#</option>
                <option value="quality">{t('गुणवत्ता', 'Quality')}</option>
                <option value="most_used">{t('ज़्यादा उपयोग', 'Most Used')}</option>
                <option value="unused">{t('अप्रयुक्त', 'Unused')}</option>
              </select>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="hidden sm:block px-2 py-2.5 border-2 border-gray-200 rounded-xl text-xs bg-white w-14 cursor-pointer">
                {[5, 10, 15, 20, 30, 50].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <div className="flex bg-gray-100 rounded-xl p-0.5">
                {[{ k: 'list', i: List }, { k: 'grid', i: LayoutGrid }].map(v => (
                  <button key={v.k} type="button" onClick={() => setViewMode(v.k)} className={`p-2 rounded-lg ${viewMode === v.k ? 'bg-white shadow-sm' : ''}`}>
                    <v.i className={`w-4 h-4 ${viewMode === v.k ? 'text-primary-600' : 'text-gray-400'}`} />
                  </button>
                ))}
              </div>
              <button type="button" onClick={applyFilters} disabled={questionsLoading}
                className="px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg text-sm flex-shrink-0">
                <RefreshCw className={`w-4 h-4 ${questionsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {batchMsg && <div className="mt-2 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-4 h-4" />{batchMsg}</div>}
          </div>

          {/* ═══ FILTERS PANEL ═══ */}
          {showFilters && (
            <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50/80 flex-shrink-0 space-y-2 max-h-[35vh] overflow-y-auto">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t('त्वरित:', 'Quick:')}</span>
                {Object.entries(DIFF).map(([k, c]) => {
                  const on = filters.difficulties.includes(k);
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
                <button type="button" onClick={togglePYQ}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${filters.isPYQ === true ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
                  <Star className="w-3 h-3" />PYQ{quickCounts.pyq > 0 && <span className={`px-1.5 rounded-full text-[9px] font-black ${filters.isPYQ ? 'bg-white/25' : 'bg-black/5'}`}>{quickCounts.pyq}</span>}
                </button>
                {/* ═══ NEW: Unused filter ═══ */}
                <button type="button" onClick={() => setSortBy(sortBy === 'unused' ? 'newest' : 'unused')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${sortBy === 'unused' ? 'bg-violet-600 text-white border-violet-600 shadow-md' : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'}`}>
                  <Shield className="w-3 h-3" />{t('अप्रयुक्त', 'Unused')}
                  {quickCounts.unused > 0 && <span className={`px-1.5 rounded-full text-[9px] font-black ${sortBy === 'unused' ? 'bg-white/25' : 'bg-black/5'}`}>{quickCounts.unused}</span>}
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-full sm:w-auto sm:min-w-[130px]"><MiniMultiSelect options={Object.entries(PAPER_LABELS).map(([k, v]) => ({ value: k, label: t(v.hi, v.en), shortName: k === 'paper1' ? 'P1' : 'P2' }))} selected={filters.papers} onChange={v => updateFilter('papers', v)} placeholder={t('पेपर', 'Paper')} language={language} icon={BookOpen} /></div>
                <div className="w-full sm:w-auto sm:min-w-[160px]"><MiniMultiSelect options={getUnitOptions ? getUnitOptions(filters.papers.length ? filters.papers : mainFilters?.papers).map(u => ({ ...u, shortName: (u.shortName || '').substring(0, 18) })) : []} selected={filters.units} onChange={v => updateFilter('units', v)} placeholder={t('इकाई', 'Unit')} language={language} icon={Target} /></div>
                <div className="w-[calc(50%-4px)] sm:w-auto sm:min-w-[120px]"><MiniMultiSelect options={getTypeOptions ? getTypeOptions() : []} selected={filters.types} onChange={v => updateFilter('types', v)} placeholder={t('प्रकार', 'Type')} language={language} icon={Layers} /></div>
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`px-2.5 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1 ${showAdvanced ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-200 text-gray-600'}`}><Sliders className="w-3.5 h-3.5" />{t('अधिक', 'More')}</button>
                {filterCount > 0 && <button type="button" onClick={clearFilters} className="px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />{t('रीसेट', 'Reset')}</button>}
              </div>
              {showAdvanced && (
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><label className="text-[10px] font-bold text-gray-600 mb-1 block">{t('अध्याय', 'Chapter')}</label><MiniMultiSelect options={getChapterOptions ? getChapterOptions(filters.units.length ? filters.units : mainFilters?.units || [], filters.papers.length ? filters.papers : mainFilters?.papers || []) : []} selected={filters.chapters} onChange={v => updateFilter('chapters', v)} placeholder={t('अध्याय', 'Chapter')} language={language} /></div>
                    <div><label className="text-[10px] font-bold text-gray-600 mb-1 block">{t('विषय', 'Topic')}</label><MiniMultiSelect options={getTopicOptions ? getTopicOptions(filters.chapters.length ? filters.chapters : mainFilters?.chapters || [], filters.units.length ? filters.units : mainFilters?.units || [], filters.papers.length ? filters.papers : mainFilters?.papers || []) : []} selected={filters.topics} onChange={v => updateFilter('topics', v)} placeholder={t('विषय', 'Topic')} language={language} /></div>
                    <div><label className="text-[10px] font-bold text-gray-600 mb-1 block">PYQ</label><div className="flex gap-1.5">{[{ v: true, l: 'PYQ' }, { v: false, l: 'Non-PYQ' }].map(o => (<button key={String(o.v)} type="button" onClick={() => updateFilter('isPYQ', filters.isPYQ === o.v ? null : o.v)} className={`flex-1 px-2 py-2 text-[10px] font-bold rounded-lg border-2 ${filters.isPYQ === o.v ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-gray-200 text-gray-600 bg-white'}`}>{o.l}</button>))}</div></div>
                  </div>
                  <div className="mt-2"><label className="text-[10px] font-bold text-gray-600 mb-1 block">{t('तिथि', 'Date')}</label><DateRangePicker startDate={filters.startDate} endDate={filters.endDate} onStartChange={v => updateFilter('startDate', v)} onEndChange={v => updateFilter('endDate', v)} language={language} /></div>
                </div>
              )}
              {filterCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.papers.map(p => <FilterChip key={`p-${p}`} label={p === 'paper1' ? 'P1' : 'P2'} onRemove={() => updateFilter('papers', filters.papers.filter(x => x !== p))} color="gray" />)}
                  {filters.difficulties.map(d => <FilterChip key={`d-${d}`} label={DIFFICULTY_LABELS[d]?.[language] || d} onRemove={() => updateFilter('difficulties', filters.difficulties.filter(x => x !== d))} color={d === 'easy' ? 'green' : d === 'hard' ? 'red' : 'amber'} />)}
                  {filters.types.slice(0, 2).map(ty => <FilterChip key={`t-${ty}`} label={QUESTION_TYPE_LABELS[ty]?.[language] || ty} onRemove={() => updateFilter('types', filters.types.filter(x => x !== ty))} color="purple" />)}
                  {filters.isPYQ === true && <FilterChip label="PYQ" onRemove={() => updateFilter('isPYQ', null)} color="amber" />}
                </div>
              )}
            </div>
          )}

          {/* ═══ TABS ═══ */}
          <div className="flex items-center border-b border-gray-200 bg-white flex-shrink-0 px-1">
            {[
              { key: 'all', label: t('सभी', 'All'), icon: FileText, count: filtered.length },
              { key: 'selected', label: t('चुने', 'Selected'), icon: CheckCircle2, count: selectedQuestions.length, hl: selectedQuestions.length > 0 }
            ].map(tb => (
              <button key={tb.key} type="button" onClick={() => { setTab(tb.key); setPage(1); }}
                className={`flex-1 px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-b-[3px]
                  ${tab === tb.key ? 'text-primary-600 border-primary-600 bg-primary-50/50' : 'text-gray-500 hover:bg-gray-50 border-transparent'}`}>
                <tb.icon className="w-4 h-4" />{tb.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums ${tb.hl ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>{tb.count}</span>
              </button>
            ))}
            <div className="w-px h-7 bg-gray-200 mx-1" />
            {tab === 'all' && paginated.length > 0 && (
              <div className="flex items-center gap-1.5 px-2">
                <button type="button" onClick={allPageSel ? handleDeselectPage : handleSelectPage}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${allPageSel ? 'bg-primary-600 border-primary-600' : selOnPage > 0 ? 'bg-primary-100 border-primary-400' : 'border-gray-300 hover:border-primary-400'}`}>
                  {allPageSel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  {selOnPage > 0 && !allPageSel && <Minus className="w-3 h-3 text-primary-600" />}
                </button>
                <span className="text-[10px] text-gray-500 font-medium hidden sm:inline">{t('पेज', 'Page')}</span>
              </div>
            )}
            {selectedQuestions.length > 0 && (
              <div className="flex items-center gap-0.5 px-1">
                <button type="button" onClick={handleSelectAllFiltered} title={`Select all ${filtered.length}`} className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600"><CheckCheck className="w-4 h-4" /></button>
                <button type="button" onClick={handleInvert} title="Invert" className="p-1.5 hover:bg-primary-50 rounded-lg text-primary-600"><ArrowUpDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={onClearAll} title="Clear" className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><XCircle className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* ═══ QUESTIONS ═══ */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50/80 overscroll-contain scroll-smooth">
            {questionsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="mt-4 text-gray-500 text-sm">{t('लोड हो रहा है…', 'Loading…')}</p>
              </div>
            ) : paginated.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-inner">
                  {tab === 'selected' ? <CheckCircle2 className="w-10 h-10 text-gray-300" /> : <FileText className="w-10 h-10 text-gray-300" />}
                </div>
                <h3 className="font-bold text-lg text-gray-700">{tab === 'selected' ? t('कोई प्रश्न नहीं चुना', 'No questions selected') : t('कोई प्रश्न नहीं', 'No questions found')}</h3>
                <p className="text-sm text-gray-500 mt-2">{tab === 'all' ? t('फ़िल्टर बदलें या लोड करें', 'Change filters or Load') : t('"सभी" से चुनें', 'Select from All')}</p>
                {tab === 'all' && (
                  <div className="mt-4 flex justify-center gap-3">
                    {filterCount > 0 && <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-xl">{t('रीसेट', 'Reset')}</button>}
                    <button type="button" onClick={applyFilters} className="px-4 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl">{t('लोड', 'Load')}</button>
                  </div>
                )}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-2.5">
                {paginated.map((q, idx) => (
                  <QuestionCard key={q._id} q={q} idx={idx} globalIdx={(page - 1) * perPage + idx + 1}
                    isSelected={selectedIds.has(q._id)} displayLang={displayLang} language={language}
                    onToggle={handleToggle} onPreview={setPreview} viewMode="list"
                    testUsage={testUsageMap[q._id] || []}
                    onShowTestUsage={handleShowTestUsage} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {paginated.map((q, idx) => (
                  <QuestionCard key={q._id} q={q} idx={idx} globalIdx={(page - 1) * perPage + idx + 1}
                    isSelected={selectedIds.has(q._id)} displayLang={displayLang} language={language}
                    onToggle={handleToggle} onPreview={setPreview} viewMode="grid"
                    testUsage={testUsageMap[q._id] || []}
                    onShowTestUsage={handleShowTestUsage} />
                ))}
              </div>
            )}
          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="px-4 py-2.5 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                  <div className="leading-tight">
                    <span className="text-lg font-black text-primary-600 tabular-nums">{selectedQuestions.length}</span>
                    {selectedQuestions.length > 0 && <span className="text-[10px] text-green-600 font-bold ml-1">({selectedQuestions.length * marksPerQuestion}M)</span>}
                  </div>
                </div>
                {selectedQuestions.length > 0 && (
                  <>
                    <button type="button" onClick={handleExportSelected} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Export"><Download className="w-4 h-4" /></button>
                    <button type="button" onClick={onClearAll} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
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
                        className={`w-8 h-8 rounded-lg text-xs font-bold tabular-nums ${page === p ? 'bg-primary-600 text-white shadow-lg' : 'hover:bg-gray-100 text-gray-600'}`}>{p}</button>
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
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                  <CheckCheck className="w-5 h-5" />{t('पूर्ण', 'Done')}
                  {selectedQuestions.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums">{selectedQuestions.length}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showSidebar && <Sidebar selectedQuestions={selectedQuestions} language={language} marksPerQuestion={marksPerQuestion} onClear={onClearAll} onClose={() => setShowSidebar(false)} testUsageMap={testUsageMap} />}
        {preview && <QuestionPreviewModal question={preview} isOpen={!!preview} onClose={() => setPreview(null)} language={displayLang} />}
        {testUsageQuestion && <TestUsageModal question={testUsageQuestion} tests={testUsageTests} isOpen={!!testUsageQuestion} onClose={() => setTestUsageQuestion(null)} language={language} />}
      </div>

      <style>{`
        .question-html-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 6px 0; }
        .question-html-content p { margin-bottom: 4px; }
        .question-html-content table { border-collapse: collapse; width: 100%; font-size: 12px; }
        .question-html-content td, .question-html-content th { border: 1px solid #e5e7eb; padding: 4px 8px; }
      `}</style>
    </div>,
    document.body
  );
};

export default QuestionLibraryModal;