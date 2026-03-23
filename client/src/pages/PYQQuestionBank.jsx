import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, Filter, RefreshCw, Edit2, Save, X, ChevronLeft,
  ChevronRight, Eye, CheckCircle, AlertTriangle, Library,
  ArrowUpDown, Loader, Info, ClipboardList, RotateCcw,
  Download, SlidersHorizontal, Columns, ChevronDown,
  BookOpen, Tag, Hash, Zap, FileText, List, Grid3X3,
  ArrowUp, ArrowDown, Copy, Star, CheckSquare, Square,
  Minus, AlertCircle, Sparkles, BookMarked, GraduationCap,
  BarChart3, TrendingUp, Filter as FilterIcon, Eye as EyeIcon,
  Plus, Trash2, Layers, ArrowRight, Move, GitBranch,
  MessageSquare, Link2, ArrowDownUp, Type, AlignLeft
} from 'lucide-react';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import questionService from '../services/questionService';

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const TYPE_LABELS = {
  mcq:              { en: 'MCQ',       hi: 'बहुविकल्पीय',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     dot: 'bg-blue-500',    icon: Type },
  simple_mcq:       { en: 'MCQ',       hi: 'बहुविकल्पीय',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     dot: 'bg-blue-500',    icon: Type },
  assertion_reason: { en: 'A-R',       hi: 'अभिकथन-कारण',    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', dot: 'bg-purple-500', icon: GitBranch },
  match_following:  { en: 'Match',     hi: 'सुमेलन',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   dot: 'bg-green-500',  icon: Link2 },
  matching:         { en: 'Match',     hi: 'सुमेलन',          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   dot: 'bg-green-500',  icon: Link2 },
  sequence_order:   { en: 'Sequence',  hi: 'क्रम',            color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500', icon: ArrowDownUp },
  chronology:       { en: 'Sequence',  hi: 'क्रम',            color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500', icon: ArrowDownUp },
  statement_based:  { en: 'Statement', hi: 'कथन',             color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',       dot: 'bg-pink-500',   icon: MessageSquare },
  multi_statement:  { en: 'Statement', hi: 'कथन',             color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',       dot: 'bg-pink-500',   icon: MessageSquare },
  passage:          { en: 'Passage',   hi: 'गद्यांश',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   dot: 'bg-amber-500',  icon: AlignLeft },
  passage_based:    { en: 'Passage',   hi: 'गद्यांश',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   dot: 'bg-amber-500',  icon: AlignLeft },
  comprehension:    { en: 'Passage',   hi: 'गद्यांश',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   dot: 'bg-amber-500',  icon: AlignLeft },
  di_table:         { en: 'DI Table',  hi: 'DI तालिका',       color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',       dot: 'bg-cyan-500',   icon: BarChart3 },
  di_bar_chart:     { en: 'Bar Chart', hi: 'बार चार्ट',       color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', dot: 'bg-indigo-500', icon: BarChart3 },
  di_pie_chart:     { en: 'Pie Chart', hi: 'पाई चार्ट',       color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', dot: 'bg-violet-500', icon: BarChart3 },
  di_caselet:       { en: 'Caselet',   hi: 'केसलेट',          color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300', dot: 'bg-fuchsia-500', icon: FileText },
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

const normalizeType = (t) => {
  if (!t) return 'mcq';
  const map = {
    simple_mcq: 'mcq', multiple_choice: 'mcq',
    matching: 'match_following', match: 'match_following',
    chronology: 'sequence_order', sequence: 'sequence_order',
    multi_statement: 'statement_based', statements: 'statement_based',
    comprehension: 'passage_based', passage: 'passage_based',
    ar: 'assertion_reason',
  };
  return map[t] || t;
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
  const info = TYPE_LABELS[type] || TYPE_LABELS[normalizeType(type)] || { en: type, hi: type, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' };
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
              <Star className="w-3 h-3" /> {q.importance}/5
            </span>
          )}
          {(q.keyTerms || []).slice(0, 3).map((kt, i) => (
            <span key={i} className="text-[10px] bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-2 py-0.5 rounded-lg text-primary-600 dark:text-primary-400">#{kt}</span>
          ))}
        </div>
      </div>
    </td>
  </tr>
);

// ═══════════════════════════════════════════════════════
// TYPE-SPECIFIC PREVIEW COMPONENTS
// ═══════════════════════════════════════════════════════

const PreviewAssertionReason = ({ q, language }) => {
  const aHi = q.assertionHi || q.assertion || '';
  const aEn = q.assertionEn || '';
  const rHi = q.reasonHi || q.reason || '';
  const rEn = q.reasonEn || '';
  if (!aHi && !aEn && !rHi && !rEn) return null;
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5" />
        {language === 'hi' ? 'अभिकथन और कारण' : 'Assertion & Reason'}
      </p>
      <div className="grid grid-cols-1 gap-3">
        {(aHi || aEn) && (
          <div className="p-3.5 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[9px] font-black bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-md uppercase">A</span>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">{language === 'hi' ? 'अभिकथन' : 'Assertion'}</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pl-1">{language === 'hi' ? (aHi || aEn) : (aEn || aHi)}</p>
          </div>
        )}
        {(rHi || rEn) && (
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-md uppercase">R</span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{language === 'hi' ? 'कारण' : 'Reason'}</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pl-1">{language === 'hi' ? (rHi || rEn) : (rEn || rHi)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PreviewStatements = ({ q, language }) => {
  const sHi = q.statementsHi || q.statements || [];
  const sEn = q.statementsEn || [];
  const correct = q.correctStatements || [];
  if (sHi.length === 0 && sEn.length === 0) return null;
  const stmts = language === 'hi' ? (sHi.length > 0 ? sHi : sEn) : (sEn.length > 0 ? sEn : sHi);
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        {language === 'hi' ? 'कथन' : 'Statements'}
        <span className="text-gray-400 font-normal">({stmts.length})</span>
      </p>
      <div className="space-y-1.5">
        {stmts.map((s, i) => {
          const isCorrect = correct.includes(i) || correct.includes(i + 1);
          return (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl text-sm transition-colors ${
              isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-gray-50 dark:bg-secondary-800/50 border border-gray-200 dark:border-secondary-700'
            }`}>
              <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black flex-shrink-0 ${
                isCorrect ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-200 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400'
              }`}>{i + 1}</span>
              <span className="text-gray-800 dark:text-secondary-200 flex-1 leading-relaxed">{s}</span>
              {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
            </div>
          );
        })}
      </div>
      {correct.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {language === 'hi' ? 'सही:' : 'Correct:'} {correct.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

const PreviewMatchLists = ({ q, language }) => {
  const aHi = q.listAHi || q.listA || [];
  const aEn = q.listAEn || [];
  const bHi = q.listBHi || q.listB || [];
  const bEn = q.listBEn || [];
  const listA = language === 'hi' ? (aHi.length > 0 ? aHi : aEn) : (aEn.length > 0 ? aEn : aHi);
  const listB = language === 'hi' ? (bHi.length > 0 ? bHi : bEn) : (bEn.length > 0 ? bEn : bHi);
  if (listA.length === 0 && listB.length === 0) return null;
  const match = q.correctMatch || [];
  const matchStr = match.length > 0 ? match.map((m, i) => `${String.fromCharCode(65 + i)}→${m}`).join(',  ') : '';

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" />
        {language === 'hi' ? 'सुमेलन सूची' : 'Match the Following'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 text-[9px] font-black bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-md uppercase">
              {language === 'hi' ? 'सूची-I' : 'List-I'}
            </span>
          </div>
          <div className="space-y-1">
            {listA.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-black bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 flex-shrink-0 mt-0.5">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-gray-800 dark:text-secondary-200 flex-1">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="px-2 py-0.5 text-[9px] font-black bg-teal-200 dark:bg-teal-800 text-teal-700 dark:text-teal-300 rounded-md uppercase">
              {language === 'hi' ? 'सूची-II' : 'List-II'}
            </span>
          </div>
          <div className="space-y-1">
            {listB.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-teal-50 dark:bg-teal-900/10 rounded-lg border border-teal-100 dark:border-teal-900/30 text-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-black bg-teal-200 dark:bg-teal-800 text-teal-700 dark:text-teal-300 flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-800 dark:text-secondary-200 flex-1">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {matchStr && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {language === 'hi' ? 'सही मिलान:' : 'Correct:'} {matchStr}
          </span>
        </div>
      )}
    </div>
  );
};

const PreviewSequenceItems = ({ q, language }) => {
  const iHi = q.itemsHi || q.items || [];
  const iEn = q.itemsEn || [];
  const items = language === 'hi' ? (iHi.length > 0 ? iHi : iEn) : (iEn.length > 0 ? iEn : iHi);
  if (items.length === 0) return null;
  const order = q.correctOrder || [];
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
        <ArrowDownUp className="w-3.5 h-3.5" />
        {language === 'hi' ? 'क्रम में व्यवस्थित करें' : 'Arrange in Order'}
        <span className="text-gray-400 font-normal">({items.length})</span>
      </p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 text-sm">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-black bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 flex-shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-gray-800 dark:text-secondary-200 flex-1 leading-relaxed pt-1">{item}</span>
          </div>
        ))}
      </div>
      {order.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            {language === 'hi' ? 'सही क्रम:' : 'Correct:'} {order.join(' → ')}
          </span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// EDITABLE LIST COMPONENT (with reorder)
// ═══════════════════════════════════════════════════════

const EditableListField = ({ label, icon: Icon, items, onChange, placeholder, language }) => {
  const addItem = () => onChange([...items, '']);
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateItem = (idx, val) => onChange(items.map((it, i) => i === idx ? val : it));
  const moveItem = (idx, dir) => {
    if ((dir === -1 && idx === 0) || (dir === 1 && idx >= items.length - 1)) return;
    const n = [...items];
    [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]];
    onChange(n);
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
        <span className="text-gray-400 dark:text-secondary-600 font-normal ml-0.5">({items.length})</span>
      </label>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 group/item">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 flex-shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <input type="text" value={item} onChange={e => updateItem(i, e.target.value)}
              placeholder={placeholder || `Item ${i + 1}`} title={item}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors min-w-0" />
            <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"><ArrowUp className="w-3 h-3" /></button>
              <button onClick={() => moveItem(i, 1)} disabled={i >= items.length - 1} className="p-1 text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors"><ArrowDown className="w-3 h-3" /></button>
              <button onClick={() => removeItem(i)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem}
        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors">
        <Plus className="w-3 h-3" />{language === 'hi' ? 'आइटम जोड़ें' : 'Add Item'}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// EXPORT UTILS
// ═══════════════════════════════════════════════════════

const exportToCSV = (questions, language) => {
  const headers = ['Q#', 'Year', 'Session', 'Shift', 'Type', 'Question Preview', 'Unit ID', 'Unit Name', 'Chapter', 'Topic', 'Difficulty', 'Importance', 'Has Content', 'Tests Used'];
  const rows = questions.map(q => [
    q.qNo, q.year, q.session, q.shift || '',
    (TYPE_LABELS[q.type] || {})[language === 'hi' ? 'hi' : 'en'] || q.type,
    `"${(q.questionPreview || '').replace(/"/g, '""')}"`,
    q.unitId || '', `"${(q.unitName || '').replace(/"/g, '""')}"`,
    `"${(q.chapter || '').replace(/"/g, '""')}"`, `"${(q.topic || '').replace(/"/g, '""')}"`,
    q.difficulty || '', q.importance || '', q.hasContent ? 'Yes' : 'No', q.usedInTestCount || 0,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `pyq_questions_${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const PYQQuestionBank = ({ language = 'en' }) => {
  const { success, error: showError, info } = useToast();
  const searchRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [availableFilters, setAvailableFilters] = useState({});
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editLinkedTests, setEditLinkedTests] = useState([]);
  const [editTab, setEditTab] = useState('content');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Edit type detection
  const editType = useMemo(() => normalizeType(editForm.type), [editForm.type]);
  const editHasAssertion = editType === 'assertion_reason' || !!(editForm.assertionHi || editForm.assertionEn);
  const editHasStatements = editType === 'statement_based' || (editForm.statementsHi?.length > 0) || (editForm.statementsEn?.length > 0);
  const editHasMatch = editType === 'match_following' || (editForm.listAHi?.length > 0) || (editForm.listAEn?.length > 0);
  const editHasSequence = editType === 'sequence_order' || (editForm.itemsHi?.length > 0) || (editForm.itemsEn?.length > 0);
  const editHasPassage = editType === 'passage_based' || !!(editForm.passageHi || editForm.passageEn);
  const editHasTypeData = editHasAssertion || editHasStatements || editHasMatch || editHasSequence;

  const editTabs = useMemo(() => {
    const tabs = [{ id: 'content', label: language === 'hi' ? 'सामग्री' : 'Content', icon: FileText }];
    if (editHasTypeData) {
      let tl = language === 'hi' ? 'प्रकार डेटा' : 'Type Data';
      let ti = Layers;
      if (editHasAssertion) { tl = language === 'hi' ? 'अभिकथन-कारण' : 'A-R'; ti = GitBranch; }
      else if (editHasMatch) { tl = language === 'hi' ? 'सुमेलन' : 'Match'; ti = Link2; }
      else if (editHasSequence) { tl = language === 'hi' ? 'क्रम' : 'Sequence'; ti = ArrowDownUp; }
      else if (editHasStatements) { tl = language === 'hi' ? 'कथन' : 'Statements'; ti = MessageSquare; }
      tabs.push({ id: 'type_data', label: tl, icon: ti });
    }
    tabs.push({ id: 'options', label: language === 'hi' ? 'विकल्प' : 'Options', icon: CheckCircle });
    tabs.push({ id: 'meta', label: language === 'hi' ? 'मेटाडेटा' : 'Metadata', icon: Tag });
    return tabs;
  }, [editHasTypeData, editHasAssertion, editHasMatch, editHasSequence, editHasStatements, language]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '/' || (e.ctrlKey && e.key === 'f')) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setEditModalOpen(false); setPreviewOpen(false); setShowColumnPicker(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    } catch (err) { showError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchQuestions(); }, [filters.page, filters.sortBy, filters.sortOrder]);

  const handleSearch = useCallback(() => { const nf = { ...pendingFilters, page: 1 }; setFilters(nf); fetchQuestions(nf); }, [pendingFilters]);
  const handlePendingChange = useCallback((key, value) => setPendingFilters(p => ({ ...p, [key]: value, page: 1 })), []);
  const handleApplyFilters = useCallback(() => { const nf = { ...pendingFilters, page: 1 }; setFilters(nf); fetchQuestions(nf); }, [pendingFilters]);
  const handleResetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setPendingFilters(DEFAULT_FILTERS); fetchQuestions(DEFAULT_FILTERS); }, []);
  const handleSort = useCallback((field) => setFilters(p => ({ ...p, sortBy: field, sortOrder: p.sortBy === field && p.sortOrder === 'asc' ? 'desc' : 'asc' })), []);

  const toggleSelect = useCallback((pyqId) => setSelectedIds(p => p.includes(pyqId) ? p.filter(id => id !== pyqId) : [...p, pyqId]), []);
  const toggleSelectAll = useCallback(() => setSelectedIds(selectionState === 'all' ? [] : questions.map(q => q.pyqId)), [selectionState, questions]);
  const toggleExpand = useCallback((pyqId) => { setExpandedRows(p => { const n = new Set(p); n.has(pyqId) ? n.delete(pyqId) : n.add(pyqId); return n; }); }, []);

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'export') { exportToCSV(questions.filter(q => selectedIds.includes(q.pyqId)), language); info(`Exported ${selectedIds.length}`); return; }
    if (bulkAction === 'export_all') { exportToCSV(questions, language); info(`Exported ${questions.length}`); return; }
    if (bulkAction.startsWith('diff_')) {
      try { await questionService.bulkUpdatePYQQuestions(selectedIds, { difficulty: bulkAction.replace('diff_', '') }); success(`Updated`); setSelectedIds([]); fetchQuestions(); }
      catch (err) { showError(err.message); }
    }
  };

  const openEdit = useCallback(async (q) => {
    setPreviewLoading(true);
    try {
      const res = await questionService.getPYQQuestionById(q.pyqId);
      if (res.success) {
        const fq = res.data.question;
        setEditingQuestion({ ...q, ...res.data });
        setEditLinkedTests(res.data.linkedTests || []);
        setEditForm({
          questionTextHi: fq.questionTextHi || '', questionTextEn: fq.questionTextEn || '',
          optionsHi: fq.optionsHi || [], optionsEn: fq.optionsEn || [],
          correctAnswer: fq.correctAnswer ?? null,
          explanationHi: fq.explanationHi || '', explanationEn: fq.explanationEn || '',
          assertionHi: fq.assertionHi || '', assertionEn: fq.assertionEn || '',
          reasonHi: fq.reasonHi || '', reasonEn: fq.reasonEn || '',
          statementsHi: fq.statementsHi || [], statementsEn: fq.statementsEn || [],
          correctStatements: fq.correctStatements || [],
          listAHi: fq.listAHi || [], listAEn: fq.listAEn || [],
          listBHi: fq.listBHi || [], listBEn: fq.listBEn || [],
          correctMatch: fq.correctMatch || [],
          itemsHi: fq.itemsHi || [], itemsEn: fq.itemsEn || [],
          correctOrder: fq.correctOrder || [],
          passageHi: fq.passageHi || '', passageEn: fq.passageEn || '',
          difficulty: fq.difficulty || 'medium', importance: fq.importance || 3,
          chapter: fq.chapter || '', topic: fq.topic || '', subtopic: fq.subtopic || '',
          type: fq.type || 'mcq', keyTerms: fq.keyTerms || [],
        });
        setEditTab('content'); setEditModalOpen(true);
      }
    } catch { showError('Failed to load question'); }
    finally { setPreviewLoading(false); }
  }, []);

  const handleEditFormChange = useCallback((f, v) => setEditForm(p => ({ ...p, [f]: v })), []);
  const handleOptionChange = useCallback((lang, idx, val) => {
    const field = lang === 'hi' ? 'optionsHi' : 'optionsEn';
    setEditForm(p => ({ ...p, [field]: p[field].map((o, i) => i === idx ? val : o) }));
  }, []);

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setEditLoading(true);
    try {
      const res = await questionService.updatePYQQuestion(editingQuestion.pyqId, editForm);
      if (res.success) {
        const n = res.data?.linkedTestsUpdated || 0;
        success(`Q#${editingQuestion.qNo} updated` + (n > 0 ? ` · ${n} test(s) synced` : ''));
        setEditModalOpen(false); setEditingQuestion(null); fetchQuestions();
      }
    } catch (err) { showError(err.message || 'Failed'); }
    finally { setEditLoading(false); }
  };

  const openPreview = useCallback(async (q) => {
    setPreviewLoading(true); setPreviewOpen(true); setPreviewQuestion(null);
    try { const res = await questionService.getPYQQuestionById(q.pyqId); if (res.success) setPreviewQuestion(res.data); }
    catch { showError('Failed to load preview'); }
    finally { setPreviewLoading(false); }
  }, []);

  const getUnitDisplayName = useCallback((q) => {
    if (language === 'hi' && q.unitNameHi && q.unitNameHi !== q.unitId) return q.unitNameHi;
    if (q.unitName && q.unitName !== q.unitId) return q.unitName;
    return q.unitId || '—';
  }, [language]);
  const getChapterDisplay = useCallback((q) => language === 'hi' && q.chapterHi ? q.chapterHi : q.chapter || '', [language]);

  const filteredChapters = useMemo(() => (availableFilters.chapters || []).filter(c => !pendingFilters.unitId || c.unitId === pendingFilters.unitId).slice(0, 50), [availableFilters.chapters, pendingFilters.unitId]);

  const selectCls = "px-3 py-2 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-full transition-colors";
  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-colors";
  const textareaCls = `${inputCls} resize-y`;
  const thCls = "px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-secondary-400 whitespace-nowrap select-none";

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-violet-600 rounded-2xl blur-xl opacity-30" />
            <div className="relative p-3 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl shadow-lg"><Library className="w-6 h-6 text-white" /></div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{language === 'hi' ? 'PYQ प्रश्न बैंक' : 'PYQ Question Bank'}</h2>
            <p className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
              {language === 'hi' ? 'खोजें, संपादित करें — ऑटो-सिंक' : 'Search, edit · auto-syncs to linked tests'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 bg-gray-100 dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 font-mono">/ search</kbd>
          <Button variant="outline" size="sm" icon={Download} onClick={() => exportToCSV(questions, language)} disabled={questions.length === 0}>
            <span className="hidden sm:inline">{language === 'hi' ? 'निर्यात' : 'Export'}</span>
          </Button>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => fetchQuestions()} disabled={loading}>
            <span className="hidden sm:inline">{language === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={language === 'hi' ? 'कुल प्रश्न' : 'Total'} value={stats.totalQuestions?.toLocaleString()} color="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/40 text-blue-700 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/10 dark:text-blue-300" icon={Hash} />
          <StatCard label={language === 'hi' ? 'सामग्री सहित' : 'With Content'} value={stats.withContent?.toLocaleString()} subtitle={stats.totalQuestions ? `${Math.round((stats.withContent / stats.totalQuestions) * 100)}%` : ''} color="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/40 text-emerald-700 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-emerald-800/10 dark:text-emerald-300" icon={CheckCircle} />
          <StatCard label={language === 'hi' ? 'रहित' : 'Empty'} value={stats.withoutContent?.toLocaleString()} color="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 text-amber-700 dark:border-amber-800 dark:from-amber-900/20 dark:to-amber-800/10 dark:text-amber-300" icon={AlertTriangle} />
          <StatCard label={language === 'hi' ? 'PYQ पेपर' : 'Papers'} value={stats.pyqPapers?.toLocaleString()} color="border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/40 text-violet-700 dark:border-violet-800 dark:from-violet-900/20 dark:to-violet-800/10 dark:text-violet-300" icon={FileText} />
        </div>
      )}

      {/* SEARCH + TOOLBAR */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input ref={searchRef} type="text" value={pendingFilters.search} onChange={e => handlePendingChange('search', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={language === 'hi' ? 'प्रश्न, विषय खोजें...' : 'Search questions, topics...'}
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 dark:border-secondary-600 rounded-xl bg-gray-50 dark:bg-secondary-900 focus:bg-white dark:focus:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-gray-900 dark:text-white transition-all placeholder:text-gray-400" />
            {pendingFilters.search && <button onClick={() => handlePendingChange('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
          </div>
          <Button variant="primary" size="sm" onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /></Button>
          <div className="h-6 w-px bg-gray-200 dark:bg-secondary-700 hidden sm:block" />
          <button onClick={() => setShowFilters(!showFilters)} className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${showFilters ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-secondary-800 text-gray-700 dark:text-secondary-300 border-gray-200 dark:border-secondary-600 hover:border-primary-300'}`}>
            <SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">{language === 'hi' ? 'फिल्टर' : 'Filters'}</span>
            {activeFilterCount > 0 && <span className={`flex items-center justify-center w-4 h-4 text-[9px] font-black rounded-full ${showFilters ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}`}>{activeFilterCount}</span>}
          </button>
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowColumnPicker(!showColumnPicker)} className="flex items-center px-3 py-2.5 rounded-xl border border-gray-200 dark:border-secondary-600 text-gray-700 dark:text-secondary-300 bg-white dark:bg-secondary-800"><Columns className="w-4 h-4" /></button>
            {showColumnPicker && (<><div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} /><div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-2xl shadow-xl z-50 p-2">
              {Object.entries(columns).map(([k, v]) => (<label key={k} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer"><input type="checkbox" checked={v} onChange={() => setColumns(p => ({ ...p, [k]: !p[k] }))} className="w-3.5 h-3.5 text-primary-600 rounded" /><span className="text-xs font-medium text-gray-700 dark:text-secondary-300 capitalize">{k === 'qNo' ? 'Q#' : k}</span></label>))}
            </div></>)}
          </div>
          <div className="flex items-center border border-gray-200 dark:border-secondary-600 rounded-xl overflow-hidden flex-shrink-0">
            <button onClick={() => setViewMode('table')} className={`p-2.5 transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-secondary-800 text-gray-500'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('compact')} className={`p-2.5 transition-colors ${viewMode === 'compact' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-secondary-800 text-gray-500'}`}><Grid3X3 className="w-4 h-4" /></button>
          </div>
        </div>

        {showFilters && (
          <div className="border-t border-gray-100 dark:border-secondary-700 bg-gray-50/60 dark:bg-secondary-900/40 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'वर्ष' : 'Year'}</label><select value={pendingFilters.year} onChange={e => handlePendingChange('year', e.target.value)} className={selectCls}><option value="">All</option>{(availableFilters.years || []).map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'सत्र' : 'Session'}</label><select value={pendingFilters.session} onChange={e => handlePendingChange('session', e.target.value)} className={selectCls}><option value="">All</option>{(availableFilters.sessions || []).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
              <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'इकाई' : 'Unit'}</label><select value={pendingFilters.unitId} onChange={e => { handlePendingChange('unitId', e.target.value); handlePendingChange('chapter', ''); }} className={selectCls}><option value="">All</option>{(availableFilters.units || []).map(u => <option key={u.id} value={u.id}>{u.name || u.id} ({u.count})</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'प्रकार' : 'Type'}</label><select value={pendingFilters.type} onChange={e => handlePendingChange('type', e.target.value)} className={selectCls}><option value="">All</option>{(availableFilters.types || []).map(t => <option key={t.type} value={t.type}>{(TYPE_LABELS[t.type] || {}).en || t.type} ({t.count})</option>)}</select></div>
              <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'कठिनाई' : 'Difficulty'}</label>
                <div className="grid grid-cols-4 gap-1.5">{[{ val: '', label: 'All' }, { val: 'easy', label: 'Easy' }, { val: 'medium', label: 'Med' }, { val: 'hard', label: 'Hard' }].map(d => (<button key={d.val} onClick={() => handlePendingChange('difficulty', d.val)} className={`py-1.5 text-[10px] font-bold rounded-lg border-2 transition-all ${pendingFilters.difficulty === d.val ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 border-primary-300 scale-105' : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-500'}`}>{d.label}</button>))}</div>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="primary" size="sm" onClick={handleApplyFilters} className="flex-1"><FilterIcon className="w-3.5 h-3.5 mr-1" />{language === 'hi' ? 'लागू' : 'Apply'}</Button>
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleResetFilters}>{language === 'hi' ? 'रीसेट' : 'Reset'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BULK */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-2xl">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300 flex items-center gap-2"><CheckSquare className="w-4 h-4" />{selectedIds.length} selected</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="px-3 py-1.5 text-sm border border-primary-200 dark:border-primary-700 rounded-xl bg-white dark:bg-secondary-800"><option value="">Action...</option><option value="export">Export CSV</option><option value="diff_easy">→ Easy</option><option value="diff_medium">→ Medium</option><option value="diff_hard">→ Hard</option></select>
          <Button variant="primary" size="sm" onClick={handleBulkAction} disabled={!bulkAction}>Apply</Button>
          <button onClick={() => { setSelectedIds([]); setBulkAction(''); }} className="ml-auto p-1.5 rounded-lg hover:bg-primary-100 text-primary-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        {!loading && questions.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 dark:bg-secondary-900/40 border-b border-gray-100 dark:border-secondary-700">
            <span className="text-xs text-gray-500 dark:text-secondary-400 font-medium">{pagination ? `${((pagination.page - 1) * pagination.limit) + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total?.toLocaleString()}` : `${questions.length}`}</span>
            <select value={filters.limit} onChange={e => { const nf = { ...filters, limit: parseInt(e.target.value), page: 1 }; setFilters(nf); fetchQuestions(nf); }} className="text-xs border border-gray-200 dark:border-secondary-600 rounded-lg px-2 py-1 bg-white dark:bg-secondary-800">{[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/pg</option>)}</select>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative"><div className="w-14 h-14 border-4 border-primary-200 dark:border-primary-900 rounded-full animate-spin border-t-primary-600" /><Sparkles className="w-6 h-6 text-primary-600 absolute inset-0 m-auto" /></div>
            <p className="text-sm font-semibold text-gray-700 dark:text-secondary-200">{language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-24">
            <Library className="w-16 h-16 text-gray-300 dark:text-secondary-600 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700 dark:text-secondary-200">{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions found'}</p>
            {activeFilterCount > 0 && <button onClick={handleResetFilters} className="mt-3 text-sm text-primary-600 font-bold hover:underline">Clear filters</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-secondary-900/60 border-b border-gray-200 dark:border-secondary-700">
                <tr>
                  <th className="w-10 px-3 py-3"><button onClick={toggleSelectAll} className="w-4 h-4 text-gray-400 hover:text-primary-600">{selectionState === 'all' ? <CheckSquare className="w-4 h-4 text-primary-600" /> : selectionState === 'some' ? <Minus className="w-4 h-4 text-primary-400" /> : <Square className="w-4 h-4" />}</button></th>
                  {columns.qNo && <th className={`${thCls} text-left cursor-pointer`} onClick={() => handleSort('qNo')}><div className="flex items-center gap-1">Q# <SortIcon field="qNo" sortBy={filters.sortBy} sortOrder={filters.sortOrder} /></div></th>}
                  {columns.year && <th className={`${thCls} text-left cursor-pointer`} onClick={() => handleSort('year')}><div className="flex items-center gap-1">Year <SortIcon field="year" sortBy={filters.sortBy} sortOrder={filters.sortOrder} /></div></th>}
                  {columns.type && <th className={`${thCls} text-left`}>Type</th>}
                  {columns.preview && <th className={`${thCls} text-left`}>Preview</th>}
                  {columns.unit && <th className={`${thCls} text-left`}>Unit</th>}
                  {columns.difficulty && <th className={`${thCls} text-center`}>Diff</th>}
                  {columns.content && <th className={`${thCls} text-center`}>Content</th>}
                  {columns.tests && <th className={`${thCls} text-center`}>Tests</th>}
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-secondary-700/50">
                {questions.map(q => {
                  const isSel = selectedIds.includes(q.pyqId);
                  const isExp = expandedRows.has(q.pyqId);
                  return (
                    <React.Fragment key={q.pyqId}>
                      <tr className={`group transition-colors ${isSel ? 'bg-primary-50/70 dark:bg-primary-950/25' : isExp ? 'bg-violet-50/30 dark:bg-violet-950/10' : 'hover:bg-gray-50/70 dark:hover:bg-secondary-700/20'}`}>
                        <td className="px-3 py-3"><button onClick={() => toggleSelect(q.pyqId)} className="w-4 h-4 text-gray-300 hover:text-primary-600">{isSel ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}</button></td>
                        {columns.qNo && <td className="px-3 py-3"><button onClick={() => toggleExpand(q.pyqId)} className="flex items-center gap-1 font-mono text-xs font-bold text-gray-700 dark:text-secondary-300 hover:text-primary-600"><ChevronDown className={`w-3 h-3 transition-transform ${isExp ? 'rotate-180' : ''}`} />{q.qNo}</button></td>}
                        {columns.year && <td className="px-3 py-3"><div className="text-xs"><div className="font-bold text-gray-800 dark:text-white">{q.year}</div><div className="text-gray-400 capitalize text-[10px]">{q.session}</div></div></td>}
                        {columns.type && <td className="px-3 py-3"><TypeBadge type={q.type} language={language} /></td>}
                        {columns.preview && <td className="px-3 py-3 max-w-[260px]"><p className={`text-xs text-gray-700 dark:text-secondary-200 ${viewMode === 'compact' ? 'line-clamp-1' : 'line-clamp-2'}`}>{q.questionPreview || <span className="text-gray-300 italic text-[10px]">—</span>}</p></td>}
                        {columns.unit && <td className="px-3 py-3"><div className="text-[11px] max-w-[160px]"><div className="font-semibold text-gray-700 dark:text-secondary-300 truncate">{getUnitDisplayName(q)}</div>{getChapterDisplay(q) && <div className="text-gray-500 truncate">{getChapterDisplay(q)}</div>}</div></td>}
                        {columns.difficulty && <td className="px-3 py-3 text-center"><DiffBadge difficulty={q.difficulty} language={language} /></td>}
                        {columns.content && <td className="px-3 py-3 text-center">{q.hasContent ? <div className="flex flex-col items-center"><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-[9px] text-emerald-600 font-bold">Ready</span></div> : <div className="flex flex-col items-center"><AlertCircle className="w-4 h-4 text-amber-400" /><span className="text-[9px] text-amber-600 font-bold">Empty</span></div>}</td>}
                        {columns.tests && <td className="px-3 py-3 text-center">{q.usedInTestCount > 0 ? <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{q.usedInTestCount}</span> : <span className="text-gray-300 text-xs">—</span>}</td>}
                        <td className="px-3 py-3"><div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openPreview(q)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { navigator.clipboard.writeText(q.questionPreview || '').then(() => info('Copied!')); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-400 hover:text-gray-600"><Copy className="w-3.5 h-3.5" /></button>
                        </div></td>
                      </tr>
                      {isExp && <ExpandedRow q={q} language={language} colSpan={visibleColCount} />}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.pages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-900/20">
            <span className="text-xs text-gray-500 font-medium">Page {pagination.page}/{pagination.pages}</span>
            <div className="flex items-center gap-1">
              <PagBtn onClick={() => setFilters(p => ({ ...p, page: 1 }))} disabled={pagination.page <= 1} label="«" />
              <PagBtn onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} icon={<ChevronLeft className="w-4 h-4" />} />
              {Array.from({ length: Math.min(7, pagination.pages) }, (_, i) => {
                let pn; if (pagination.pages <= 7) pn = i + 1; else if (pagination.page <= 4) pn = i + 1; else if (pagination.page >= pagination.pages - 3) pn = pagination.pages - 6 + i; else pn = pagination.page - 3 + i;
                return <button key={pn} onClick={() => setFilters(p => ({ ...p, page: pn }))} className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${pagination.page === pn ? 'bg-primary-600 text-white shadow-md scale-105' : 'hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-700 dark:text-secondary-300'}`}>{pn}</button>;
              })}
              <PagBtn onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.pages} icon={<ChevronRight className="w-4 h-4" />} />
              <PagBtn onClick={() => setFilters(p => ({ ...p, page: pagination.pages }))} disabled={pagination.page >= pagination.pages} label="»" />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          EDIT MODAL
          ═══════════════════════════════════════════ */}
      {editModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && setEditModalOpen(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-200 dark:border-secondary-700 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-secondary-700 bg-gradient-to-r from-primary-50/60 to-violet-50/30 dark:from-primary-950/20 dark:to-violet-950/10 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex-shrink-0"><Edit2 className="w-4 h-4 text-white" /></div>
                <div className="min-w-0">
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white truncate">
                    {language === 'hi' ? 'PYQ प्रश्न संपादित करें' : 'Edit PYQ Question'}
                    <span className="ml-2 text-sm font-normal text-gray-500">Q#{editingQuestion.qNo} · {editingQuestion.pyqLabel}</span>
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TypeBadge type={editForm.type} language={language} />
                    {editLinkedTests.length > 0 && <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" />{editLinkedTests.length} auto-sync</p>}
                  </div>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-500 ml-2"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-2.5 border-b border-gray-200 dark:border-secondary-700 flex-shrink-0 overflow-x-auto">
              {editTabs.map(tab => (
                <button key={tab.id} onClick={() => setEditTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${editTab === tab.id ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-700'}`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* CONTENT */}
              {editTab === 'content' && (
                <div className="space-y-4">
                  {editHasPassage && (
                    <div className="p-4 bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                      <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 mb-2 uppercase flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{language === 'hi' ? 'गद्यांश' : 'Passage'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">हिंदी</label><textarea value={editForm.passageHi || ''} onChange={e => handleEditFormChange('passageHi', e.target.value)} rows={4} className={textareaCls} /></div>
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">English</label><textarea value={editForm.passageEn || ''} onChange={e => handleEditFormChange('passageEn', e.target.value)} rows={4} className={textareaCls} /></div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'प्रश्न (हिंदी)' : 'Question (Hindi)'}</label><textarea value={editForm.questionTextHi || ''} onChange={e => handleEditFormChange('questionTextHi', e.target.value)} rows={5} className={textareaCls} /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'प्रश्न (English)' : 'Question (English)'}</label><textarea value={editForm.questionTextEn || ''} onChange={e => handleEditFormChange('questionTextEn', e.target.value)} rows={5} className={textareaCls} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'व्याख्या (हिंदी)' : 'Explanation (Hindi)'}</label><textarea value={editForm.explanationHi || ''} onChange={e => handleEditFormChange('explanationHi', e.target.value)} rows={3} className={textareaCls} /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'व्याख्या (English)' : 'Explanation (English)'}</label><textarea value={editForm.explanationEn || ''} onChange={e => handleEditFormChange('explanationEn', e.target.value)} rows={3} className={textareaCls} /></div>
                  </div>
                </div>
              )}

              {/* TYPE DATA */}
              {editTab === 'type_data' && (
                <div className="space-y-5">
                  {editHasAssertion && (
                    <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" />{language === 'hi' ? 'अभिकथन और कारण' : 'Assertion & Reason'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Assertion (हिंदी)</label><textarea value={editForm.assertionHi || ''} onChange={e => handleEditFormChange('assertionHi', e.target.value)} rows={3} className={textareaCls} /></div>
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Assertion (English)</label><textarea value={editForm.assertionEn || ''} onChange={e => handleEditFormChange('assertionEn', e.target.value)} rows={3} className={textareaCls} /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Reason (हिंदी)</label><textarea value={editForm.reasonHi || ''} onChange={e => handleEditFormChange('reasonHi', e.target.value)} rows={3} className={textareaCls} /></div>
                        <div><label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Reason (English)</label><textarea value={editForm.reasonEn || ''} onChange={e => handleEditFormChange('reasonEn', e.target.value)} rows={3} className={textareaCls} /></div>
                      </div>
                    </div>
                  )}
                  {editHasStatements && (
                    <div className="p-4 bg-pink-50/50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800/50 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-pink-600 dark:text-pink-400 uppercase flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" />{language === 'hi' ? 'कथन' : 'Statements'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditableListField label={language === 'hi' ? 'कथन (हिंदी)' : 'Statements (Hindi)'} icon={MessageSquare} items={editForm.statementsHi || []} onChange={v => handleEditFormChange('statementsHi', v)} placeholder={language === 'hi' ? 'कथन...' : 'Statement...'} language={language} />
                        <EditableListField label={language === 'hi' ? 'कथन (English)' : 'Statements (English)'} icon={MessageSquare} items={editForm.statementsEn || []} onChange={v => handleEditFormChange('statementsEn', v)} placeholder="Statement..." language={language} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'सही कथन (अल्पविराम से)' : 'Correct Indices'}</label>
                        <input type="text" value={(editForm.correctStatements || []).join(', ')} onChange={e => handleEditFormChange('correctStatements', e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))} className={inputCls} placeholder="1, 2, 4" />
                      </div>
                    </div>
                  )}
                  {editHasMatch && (
                    <div className="p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />{language === 'hi' ? 'सुमेलन' : 'Match Lists'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditableListField label={language === 'hi' ? 'सूची-I (हिंदी)' : 'List-I (Hindi)'} icon={Layers} items={editForm.listAHi || []} onChange={v => handleEditFormChange('listAHi', v)} placeholder="A..." language={language} />
                        <EditableListField label={language === 'hi' ? 'सूची-II (हिंदी)' : 'List-II (Hindi)'} icon={Layers} items={editForm.listBHi || []} onChange={v => handleEditFormChange('listBHi', v)} placeholder="1..." language={language} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditableListField label="List-I (English)" icon={Layers} items={editForm.listAEn || []} onChange={v => handleEditFormChange('listAEn', v)} placeholder="A..." language={language} />
                        <EditableListField label="List-II (English)" icon={Layers} items={editForm.listBEn || []} onChange={v => handleEditFormChange('listBEn', v)} placeholder="1..." language={language} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'सही मिलान' : 'Correct Match'} <span className="font-normal text-gray-400">(A→?, B→?)</span></label>
                        <input type="text" value={(editForm.correctMatch || []).join(', ')} onChange={e => handleEditFormChange('correctMatch', e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))} className={inputCls} placeholder="3, 1, 4, 2" />
                        {(editForm.correctMatch || []).length > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {editForm.correctMatch.map((m, i) => `${String.fromCharCode(65 + i)}→${m}`).join(',  ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {editHasSequence && (
                    <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase flex items-center gap-1.5"><ArrowDownUp className="w-3.5 h-3.5" />{language === 'hi' ? 'क्रम' : 'Sequence'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <EditableListField label={language === 'hi' ? 'आइटम (हिंदी)' : 'Items (Hindi)'} icon={ArrowDownUp} items={editForm.itemsHi || []} onChange={v => handleEditFormChange('itemsHi', v)} placeholder={language === 'hi' ? 'घटना...' : 'Event...'} language={language} />
                        <EditableListField label="Items (English)" icon={ArrowDownUp} items={editForm.itemsEn || []} onChange={v => handleEditFormChange('itemsEn', v)} placeholder="Event..." language={language} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase mb-1.5">{language === 'hi' ? 'सही क्रम' : 'Correct Order'}</label>
                        <input type="text" value={(editForm.correctOrder || []).join(', ')} onChange={e => handleEditFormChange('correctOrder', e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))} className={inputCls} placeholder="3, 1, 4, 2, 5" />
                        {(editForm.correctOrder || []).length > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />{editForm.correctOrder.join(' → ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {!editHasTypeData && (
                    <div className="text-center py-10 text-gray-400 dark:text-secondary-500">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">{language === 'hi' ? 'मानक MCQ' : 'Standard MCQ — no extra data'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* OPTIONS */}
              {editTab === 'options' && (
                <div className="space-y-4">
                  {editForm.correctAnswer !== null && editForm.correctAnswer !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Correct: ({String.fromCharCode(65 + editForm.correctAnswer)})</span>
                    </div>
                  )}
                  {(editForm.optionsHi?.length > 0 || editForm.optionsEn?.length > 0) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[{ l: 'hi', f: 'optionsHi', lb: 'Options (हिंदी)', r: true }, { l: 'en', f: 'optionsEn', lb: 'Options (English)', r: false }].map(({ l, f, lb, r }) => (
                        editForm[f]?.length > 0 && (
                          <div key={l}><label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">{lb}</label>
                            <div className="space-y-2">{editForm[f].map((opt, idx) => (
                              <div key={idx} className={`flex items-center gap-2 p-2.5 rounded-xl border ${editForm.correctAnswer === idx ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-gray-50 dark:bg-secondary-900/50 border-gray-200 dark:border-secondary-600'}`}>
                                {r && <input type="radio" name="correctAnswer" checked={editForm.correctAnswer === idx} onChange={() => handleEditFormChange('correctAnswer', idx)} className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                                <span className={`text-xs font-black w-5 flex-shrink-0 ${editForm.correctAnswer === idx ? 'text-emerald-600' : 'text-gray-400'}`}>{String.fromCharCode(65 + idx)}</span>
                                <input type="text" value={opt} onChange={e => handleOptionChange(l, idx, e.target.value)} className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none min-w-0" />
                                {editForm.correctAnswer === idx && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                              </div>
                            ))}</div>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400"><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No options</p></div>
                  )}
                </div>
              )}

              {/* META */}
              {editTab === 'meta' && (
                <div className="space-y-5">
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">{language === 'hi' ? 'कठिनाई' : 'Difficulty'}</label>
                    <div className="grid grid-cols-3 gap-2">{[{ v: 'easy', l: 'Easy', c: 'bg-emerald-500 border-emerald-500' }, { v: 'medium', l: 'Medium', c: 'bg-amber-500 border-amber-500' }, { v: 'hard', l: 'Hard', c: 'bg-red-500 border-red-500' }].map(d => (
                      <button key={d.v} onClick={() => handleEditFormChange('difficulty', d.v)} className={`py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${editForm.difficulty === d.v ? `${d.c} text-white shadow-lg scale-105` : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-600'}`}>{d.l}</button>
                    ))}</div>
                  </div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">{language === 'hi' ? 'महत्व' : 'Importance'}</label>
                    <div className="flex items-center gap-2">{[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => handleEditFormChange('importance', v)} className={`w-10 h-10 rounded-xl border-2 transition-all ${editForm.importance >= v ? 'bg-amber-400 border-amber-400 text-white shadow-md' : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-600 text-gray-300'}`}><Star className="w-4 h-4 mx-auto" /></button>
                    ))}<span className="text-sm font-bold text-gray-700 dark:text-secondary-300 ml-2">{editForm.importance}/5</span></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Chapter</label><input type="text" value={editForm.chapter || ''} onChange={e => handleEditFormChange('chapter', e.target.value)} className={inputCls} /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Topic</label><input type="text" value={editForm.topic || ''} onChange={e => handleEditFormChange('topic', e.target.value)} className={inputCls} /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Subtopic</label><input type="text" value={editForm.subtopic || ''} onChange={e => handleEditFormChange('subtopic', e.target.value)} className={inputCls} /></div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" />Key Terms</label>
                    <div className="flex flex-wrap gap-1.5 p-3 border border-gray-200 dark:border-secondary-600 rounded-xl min-h-[48px] bg-gray-50 dark:bg-secondary-900/50">
                      {(editForm.keyTerms || []).map((t, i) => (<span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold">{t}<button onClick={() => handleEditFormChange('keyTerms', editForm.keyTerms.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button></span>))}
                      <input type="text" placeholder="+ Enter" className="flex-1 min-w-[80px] bg-transparent text-xs focus:outline-none" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { handleEditFormChange('keyTerms', [...(editForm.keyTerms || []), e.target.value.trim()]); e.target.value = ''; } }} />
                    </div>
                  </div>
                  {editLinkedTests.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1"><Info className="w-3.5 h-3.5" />Auto-update tests:</p>
                      <div className="flex flex-wrap gap-1.5">{editLinkedTests.map(t => <span key={t._id} className="px-2 py-1 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl flex items-center gap-1"><ClipboardList className="w-2.5 h-2.5" />{t.title}</span>)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-secondary-700 bg-gray-50/60 dark:bg-secondary-900/30 flex-shrink-0">
              <p className="text-xs text-gray-400 hidden sm:block">{language === 'hi' ? 'बदलाव टेस्ट में ऑटो-सिंक' : 'Auto-syncs to tests'}</p>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={editLoading}>{language === 'hi' ? 'रद्द' : 'Cancel'}</Button>
                <Button variant="primary" icon={Save} onClick={handleSaveEdit} loading={editLoading}>{language === 'hi' ? 'सहेजें' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PREVIEW MODAL
          ═══════════════════════════════════════════ */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && setPreviewOpen(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-200 dark:border-secondary-700 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-secondary-700 bg-gradient-to-r from-blue-50/60 to-violet-50/30 dark:from-blue-950/20 dark:to-violet-950/10 flex-shrink-0">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" />{language === 'hi' ? 'प्रश्न पूर्वावलोकन' : 'Question Preview'}</h2>
              <div className="flex items-center gap-2">
                {previewQuestion && !previewLoading && (
                  <button onClick={() => { openEdit({ pyqId: previewQuestion.pyqId, qNo: previewQuestion.qNo, pyqLabel: previewQuestion.pyqLabel }); setPreviewOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary-600 text-white rounded-xl hover:bg-primary-700"><Edit2 className="w-3 h-3" />{language === 'hi' ? 'संपादित' : 'Edit'}</button>
                )}
                <button onClick={() => { setPreviewOpen(false); setPreviewQuestion(null); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-500"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-10 h-10 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : previewQuestion ? (() => {
                const pq = previewQuestion.question;
                const qType = normalizeType(pq?.type);

                // Detect if type-specific data exists
                const hasTypeData = !!(
                  (qType === 'assertion_reason' && (pq?.assertionHi || pq?.assertionEn || pq?.assertion)) ||
                  (qType === 'statement_based' && (pq?.statementsHi?.length > 0 || pq?.statements?.length > 0)) ||
                  (qType === 'match_following' && (pq?.listAHi?.length > 0 || pq?.listA?.length > 0)) ||
                  (qType === 'sequence_order' && (pq?.itemsHi?.length > 0 || pq?.items?.length > 0))
                );

                const qTextHi = pq?.questionTextHi || pq?.questionText || '';
                const qTextEn = pq?.questionTextEn || '';

                // Check if question text is just a generic instruction
                const isGenericInstruction = hasTypeData && (
                  qTextHi.length < 60 ||
                  /^(match|arrange|consider|निम्न|सुमेल|क्रम|कथन|list|select|which of)/i.test(qTextHi.trim()) ||
                  /^(match|arrange|consider|which|select|identify)/i.test(qTextEn.trim())
                );

                return (
                  <div className="space-y-4">
                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-gray-800 dark:text-white">Q#{previewQuestion.qNo}</span>
                      <span className="text-gray-300 dark:text-secondary-600">·</span>
                      <span className="text-sm text-gray-500 dark:text-secondary-400">{previewQuestion.pyqLabel}</span>
                      <TypeBadge type={pq?.type} language={language} />
                      {pq?.difficulty && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${DIFF_CONFIG[pq.difficulty]?.color || ''}`}>{DIFF_CONFIG[pq.difficulty]?.[language === 'hi' ? 'hi' : 'label'] || pq.difficulty}</span>}
                      {pq?.importance && <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600"><Star className="w-3 h-3" />{pq.importance}/5</span>}
                    </div>

                    {/* Passage */}
                    {(pq?.passageHi || pq?.passageEn || pq?.passage) && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 mb-2 uppercase flex items-center gap-1"><BookOpen className="w-3 h-3" />{language === 'hi' ? 'गद्यांश' : 'Passage'}</p>
                        <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{language === 'hi' ? (pq.passageHi || pq.passageEn || pq.passage) : (pq.passageEn || pq.passageHi || pq.passage)}</p>
                      </div>
                    )}

                    {/* Question text — ONLY if NOT generic instruction when type data exists */}
                    {(qTextHi || qTextEn) && !isGenericInstruction && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {qTextHi && (
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 mb-2 uppercase">हिंदी</p>
                            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{qTextHi}</p>
                          </div>
                        )}
                        {qTextEn && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-2 uppercase">English</p>
                            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{qTextEn}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Generic instruction as small note */}
                    {isGenericInstruction && (qTextHi || qTextEn) && (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-secondary-900/50 rounded-xl border border-gray-200 dark:border-secondary-700">
                        <p className="text-xs text-gray-500 dark:text-secondary-400 italic">{language === 'hi' ? qTextHi : (qTextEn || qTextHi)}</p>
                      </div>
                    )}

                    {/* TYPE-SPECIFIC */}
                    {(qType === 'assertion_reason' || pq?.assertionHi || pq?.assertionEn || pq?.assertion) && <PreviewAssertionReason q={pq} language={language} />}
                    {(qType === 'statement_based' || pq?.statementsHi?.length > 0 || pq?.statements?.length > 0) && <PreviewStatements q={pq} language={language} />}
                    {(qType === 'match_following' || pq?.listAHi?.length > 0 || pq?.listA?.length > 0) && <PreviewMatchLists q={pq} language={language} />}
                    {(qType === 'sequence_order' || pq?.itemsHi?.length > 0 || pq?.items?.length > 0) && <PreviewSequenceItems q={pq} language={language} />}

                    {/* Options */}
                    {(pq?.optionsHi?.length > 0 || pq?.optionsEn?.length > 0 || pq?.options?.length > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[{ f: 'optionsHi', fb: 'options', lb: language === 'hi' ? 'विकल्प (हिंदी)' : 'Options (हिंदी)' }, { f: 'optionsEn', fb: null, lb: language === 'hi' ? 'विकल्प (English)' : 'Options (English)' }].map(({ f, fb, lb }) => {
                          const opts = pq?.[f] || (fb ? pq?.[fb] : null) || [];
                          if (opts.length === 0) return null;
                          return (
                            <div key={f}><p className="text-[10px] font-black text-gray-500 uppercase mb-2">{lb}</p>
                              <div className="space-y-1.5">{opts.map((o, i) => {
                                const correct = pq.correctAnswer === i;
                                return (<div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-gray-50 dark:bg-secondary-900/50 border-gray-200 dark:border-secondary-600'}`}>
                                  <span className={`text-xs font-black mt-0.5 w-4 ${correct ? 'text-emerald-600' : 'text-gray-400'}`}>{String.fromCharCode(65 + i)}</span>
                                  <span className={`text-sm flex-1 ${correct ? 'font-semibold text-emerald-800 dark:text-emerald-300' : 'text-gray-700 dark:text-secondary-300'}`}>{o}</span>
                                  {correct && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                                </div>);
                              })}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {(pq?.explanationHi || pq?.explanationEn || pq?.explanation) && (
                      <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-200 dark:border-violet-800/50">
                        <p className="text-[10px] font-black text-violet-600 dark:text-violet-400 mb-2 uppercase flex items-center gap-1"><Sparkles className="w-3 h-3" />{language === 'hi' ? 'व्याख्या' : 'Explanation'}</p>
                        <p className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-wrap">{language === 'hi' ? (pq.explanationHi || pq.explanationEn || pq.explanation) : (pq.explanationEn || pq.explanationHi || pq.explanation)}</p>
                      </div>
                    )}

                    {/* Meta */}
                    {(pq?.unitName || pq?.chapter || pq?.topic) && (
                      <div className="flex flex-wrap gap-2">
                        {pq.unitName && pq.unitName !== pq.unitId && <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 px-2 py-1 rounded-lg"><GraduationCap className="w-3 h-3" />{pq.unitName}</span>}
                        {pq.chapter && <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 px-2 py-1 rounded-lg"><BookOpen className="w-3 h-3" />{pq.chapter}</span>}
                        {pq.topic && <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 px-2 py-1 rounded-lg"><Tag className="w-3 h-3" />{pq.topic}</span>}
                      </div>
                    )}
                    {pq?.keyTerms?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">{pq.keyTerms.map((t, i) => <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300 rounded-lg">#{t}</span>)}</div>
                    )}
                    {previewQuestion.linkedTests?.length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50">
                        <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase mb-2 flex items-center gap-1"><ClipboardList className="w-3 h-3" />{language === 'hi' ? 'टेस्ट:' : 'Used in:'}</p>
                        <div className="flex flex-wrap gap-1.5">{previewQuestion.linkedTests.map(t => <span key={t._id} className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl">{t.title}</span>)}</div>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="text-center py-12"><AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No data</p></div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-secondary-700 flex-shrink-0">
              <Button variant="outline" onClick={() => { setPreviewOpen(false); setPreviewQuestion(null); }}>{language === 'hi' ? 'बंद' : 'Close'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterChip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full border border-primary-200 dark:border-primary-700">
    {label}<button onClick={onRemove} className="hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
  </span>
);

const PagBtn = ({ onClick, disabled, label, icon }) => (
  <button onClick={onClick} disabled={disabled} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-secondary-300 font-bold text-xs px-2">{label || icon}</button>
);

export default PYQQuestionBank;