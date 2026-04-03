import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Eye, Edit3, Trash2,
  Filter, Search, RefreshCw, ChevronDown,
  X, Zap, MessageSquare, Image,
  BarChart3, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, FileText, Sparkles, Check, XCircle,
  ArrowLeft, Tag, Users, TrendingUp, Layers,
  Copy, Flame, Bug, Wrench,
  Calendar, User, MapPin, Info,
  RotateCcw, Wand2, Languages, CheckCheck,
  Activity, Target, Pin
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import reportService from '../services/reportService';

// ═══ Import ALL question type renderers ═══
import MCQQuestion from '../components/question/QuestionTypes/MCQQuestion';
import AssertionReason from '../components/question/QuestionTypes/AssertionReason';
import MatchFollowing from '../components/question/QuestionTypes/MatchFollowing';
import SequenceOrder from '../components/question/QuestionTypes/SequenceOrder';
import StatementBased from '../components/question/QuestionTypes/StatementBased';
import PassageQuestion from '../components/question/QuestionTypes/PassageQuestion';
import DIBarChart from '../components/question/QuestionTypes/DIBarChart';
import DIPieChart from '../components/question/QuestionTypes/DIPieChart';
import DILineGraph from '../components/question/QuestionTypes/DILineGraph';
import DICaselet from '../components/question/QuestionTypes/DICaselet';

/* ═══ CSS ═══ */
const RPT_CSS = `
@keyframes rptFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes rptSlideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:5000px}}
@keyframes rptSlideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes rptShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes rptBounce{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
@keyframes rptDot{0%,100%{box-shadow:0 0 0 0 currentColor}50%{box-shadow:0 0 0 4px transparent}}
.rpt-shimmer{background:linear-gradient(90deg,transparent 25%,rgba(255,255,255,.3) 50%,transparent 75%);background-size:200% 100%;animation:rptShimmer 1.5s infinite}
.dark .rpt-shimmer{background:linear-gradient(90deg,transparent 25%,rgba(255,255,255,.04) 50%,transparent 75%);background-size:200% 100%}
.rpt-expand{animation:rptSlideDown .35s ease-out;overflow:hidden}
.rpt-scroll::-webkit-scrollbar{width:4px}
.rpt-scroll::-webkit-scrollbar-track{background:transparent}
.rpt-scroll::-webkit-scrollbar-thumb{background:rgba(148,163,184,.2);border-radius:10px}
`;

/* ═══ HELPERS ═══ */
const bText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.hi || obj.en || '';
};

// Map ALL possible questionType values to labels
const TYPE_LABELS = {
  mcq: 'MCQ',
  assertion_reason: 'Assertion-Reason',
  match: 'Match Following',
  match_following: 'Match Following',
  sequence: 'Sequence',
  sequence_order: 'Sequence Order',
  statement: 'Statement Based',
  statement_based: 'Statement Based',
  passage: 'Passage',
  passage_based: 'Passage Based',
  di_bar: 'DI Bar Chart',
  di_bar_chart: 'DI Bar Chart',
  di_pie: 'DI Pie Chart',
  di_pie_chart: 'DI Pie Chart',
  di_line: 'DI Line Graph',
  di_line_graph: 'DI Line Graph',
  di_caselet: 'DI Caselet',
  di_table: 'DI Table',
  di_mixed: 'DI Mixed'
};

const getTypeLabel = (type) => TYPE_LABELS[type] || type || 'MCQ';

/* ═══ TOAST ═══ */
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const cfg = {
    success: 'from-emerald-500 to-teal-600',
    error: 'from-red-500 to-rose-600',
    info: 'from-blue-500 to-indigo-600',
    warning: 'from-amber-500 to-orange-600'
  };
  const icons = { success: CheckCircle, error: AlertCircle, info: Info, warning: AlertTriangle };
  const IC = icons[type] || Info;
  return (
    <div className="fixed top-4 right-4 z-[500]" style={{ animation: 'rptSlideIn .3s ease-out' }}>
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${cfg[type]} text-white shadow-xl text-sm font-medium min-w-[220px]`}>
        <IC className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="p-0.5 hover:bg-white/20 rounded">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ═══ SKELETON ═══ */
const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3.5 space-y-2.5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded bg-gray-200 dark:bg-slate-700 rpt-shimmer" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 rounded bg-gray-200 dark:bg-slate-700 w-3/4 rpt-shimmer" />
        <div className="h-3 rounded bg-gray-200 dark:bg-slate-700 w-1/2 rpt-shimmer" />
      </div>
    </div>
  </div>
);

/* ═══ COUNTER ═══ */
const Counter = ({ value }) => {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const target = parseInt(value) || 0;
    if (!target) { setN(0); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / 800, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <>{n}</>;
};

/* ═══ STAT ═══ */
const Stat = ({ label, value, icon: IC, grad, active, onClick, sub }) => (
  <button onClick={onClick}
    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 text-left w-full transition-all duration-200
      ${active
        ? `${grad} text-white border-transparent shadow-lg scale-[1.02]`
        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 hover:shadow-md'
      }`}>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'}`}>
      <IC className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xl font-black leading-none"><Counter value={value} /></p>
      <p className={`text-[10px] font-medium mt-0.5 ${active ? 'text-white/70' : 'text-gray-500 dark:text-slate-400'}`}>{label}</p>
      {sub && <p className={`text-[9px] ${active ? 'text-white/50' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  </button>
);

/* ═══ SCREENSHOT GALLERY ═══ */
const Screenshots = ({ items }) => {
  const [view, setView] = useState(null);
  if (!items?.length) return null;
  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {items.map((s, i) => (
          <button key={i} onClick={() => setView(s.data)}
            className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:border-blue-400 transition-colors group">
            <img src={s.data} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
          </button>
        ))}
      </div>
      {view && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setView(null)}>
          <img src={view} alt="" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" style={{ animation: 'rptBounce .3s ease-out' }} />
          <button onClick={() => setView(null)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/* ══ QUESTION TYPE RENDERER — handles ALL type name variants ══ */
/* ══════════════════════════════════════════════════════════════ */
const QuestionTypeRenderer = ({ question, language }) => {
  const qType = (question.questionType || 'mcq').toLowerCase().trim();

  const commonProps = {
    question,
    language,
    showAnswer: true,
    selectedAnswer: null,
    onAnswerSelect: null,
    isPreview: true,
    disabled: true
  };

  // Normalize type and render correct component
  switch (qType) {
    // ── Assertion Reason ──
    case 'assertion_reason':
    case 'assertionreason':
    case 'assertion-reason':
    case 'ar':
      return <AssertionReason {...commonProps} />;

    // ── Match Following ──
    case 'match':
    case 'match_following':
    case 'matchfollowing':
    case 'match-following':
      return <MatchFollowing {...commonProps} />;

    // ── Sequence Order ──
    case 'sequence':
    case 'sequence_order':
    case 'sequenceorder':
    case 'sequence-order':
      return <SequenceOrder {...commonProps} />;

    // ── Statement Based ──
    case 'statement':
    case 'statement_based':
    case 'statementbased':
    case 'statement-based':
      return <StatementBased {...commonProps} />;

    // ── Passage Based ──
    case 'passage':
    case 'passage_based':
    case 'passagebased':
    case 'passage-based':
      return (
        <PassageQuestion
          {...commonProps}
          passage={question.passageId}
          showPassage={true}
        />
      );

    // ── DI Bar Chart ──
    case 'di_bar':
    case 'di_bar_chart':
    case 'di-bar':
    case 'di-bar-chart':
      return (
        <DIBarChart
          {...commonProps}
          diData={question.diDataId}
          showDIData={true}
        />
      );

    // ── DI Pie Chart ──
    case 'di_pie':
    case 'di_pie_chart':
    case 'di-pie':
    case 'di-pie-chart':
      return (
        <DIPieChart
          {...commonProps}
          diData={question.diDataId}
          showDIData={true}
        />
      );

    // ── DI Line Graph ──
    case 'di_line':
    case 'di_line_graph':
    case 'di-line':
    case 'di-line-graph':
      return (
        <DILineGraph
          {...commonProps}
          diData={question.diDataId}
          showDIData={true}
        />
      );

    // ── DI Caselet ──
    case 'di_caselet':
    case 'di-caselet':
    case 'dicaselet':
      return (
        <DICaselet
          {...commonProps}
          diData={question.diDataId}
          showDIData={true}
        />
      );

    // ── DI Table / DI Mixed — fallback to bar chart renderer ──
    case 'di_table':
    case 'di_mixed':
    case 'di-table':
    case 'di-mixed':
      return (
        <DIBarChart
          {...commonProps}
          diData={question.diDataId}
          showDIData={true}
        />
      );

    // ── MCQ (default) ──
    case 'mcq':
    default:
      return <MCQQuestion {...commonProps} />;
  }
};

/* ══════════════════════════════════════════════ */
/* ══ COLLAPSIBLE QUESTION CARD ════════════════ */
/* ══════════════════════════════════════════════ */
const QuestionCard = ({
  question, questionSource, index, isReported,
  language, isOpenDefault, onFixSave, saving
}) => {
  const [open, setOpen] = useState(isOpenDefault || false);
  const [editing, setEditing] = useState(false);
  const t = (hi, en) => language === 'hi' ? hi : en;
  const optLabel = (i) => String.fromCharCode(65 + i);

  // Editor state
  const [eqH, setEqH] = useState('');
  const [eqE, setEqE] = useState('');
  const [eoH, setEoH] = useState(['', '', '', '']);
  const [eoE, setEoE] = useState(['', '', '', '']);
  const [eca, setEca] = useState(0);
  const [exH, setExH] = useState('');
  const [exE, setExE] = useState('');

  const startEdit = () => {
    if (questionSource === 'pyq') {
      setEqH(question.questionTextHi || question.questionText || '');
      setEqE(question.questionTextEn || '');
      setEoH(question.optionsHi || question.options || ['', '', '', '']);
      setEoE(question.optionsEn || ['', '', '', '']);
      setEca(question.correctAnswer ?? 0);
      setExH(question.explanationHi || question.explanation || '');
      setExE(question.explanationEn || '');
    } else {
      setEqH(question.question?.hi || '');
      setEqE(question.question?.en || '');
      setEoH(question.options?.hi || ['', '', '', '']);
      setEoE(question.options?.en || ['', '', '', '']);
      setEca(question.correctAnswer ?? 0);
      setExH(question.explanation?.hi || '');
      setExE(question.explanation?.en || '');
    }
    setEditing(true);
    setOpen(true);
  };

  const handleSave = () => {
    onFixSave({
      question: { hi: eqH, en: eqE },
      options: { hi: [...eoH], en: [...eoE] },
      correctAnswer: parseInt(eca),
      explanation: { hi: exH, en: exE }
    });
    setEditing(false);
  };

  const qText = question.question
    ? bText(question.question, language)
    : (question.questionTextHi || question.questionTextEn || question.questionText || '');

  const qType = question.questionType || 'mcq';

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isReported
        ? 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10'
        : editing
          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-950/10'
          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    }`}>
      {/* Collapsed Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-750/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {isReported && (
          <Pin className="w-3 h-3 text-red-500 flex-shrink-0 -rotate-45" />
        )}
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          isReported
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-500'
        }`}>
          {question.questionNumber || index + 1}
        </span>
        <p className="flex-1 text-xs text-gray-700 dark:text-slate-300 truncate min-w-0">
          {qText || '-'}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[8px] px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold uppercase">
            {getTypeLabel(qType)}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">
            {question.correctAnswer >= 0 ? optLabel(question.correctAnswer) : '-'}
          </span>
          {isReported && (
            <span className="text-[8px] px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 font-bold">
              {t('RPT', 'RPT')}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); startEdit(); }}
            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
            title={t('संपादित करें', 'Edit')}
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      {open && (
        <div className="border-t border-gray-100 dark:border-slate-700 px-3 py-3 space-y-3 rpt-expand">

          {/* ★★★ Render using ACTUAL question type component ★★★ */}
          <QuestionTypeRenderer question={question} language={language} />

          {/* Meta tags */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-gray-100 dark:border-slate-700">
            {question.unit && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 font-medium">
                {typeof question.unit === 'object' ? bText(question.unit, language) : question.unit}
              </span>
            )}
            {question.topic && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 flex items-center gap-0.5">
                <MapPin className="w-2 h-2" />
                {typeof question.topic === 'object' ? bText(question.topic, language) : question.topic}
              </span>
            )}
            {question.chapter && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 flex items-center gap-0.5">
                <FileText className="w-2 h-2" />
                {typeof question.chapter === 'object' ? bText(question.chapter, language) : question.chapter}
              </span>
            )}
            {question.difficulty && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold ${
                question.difficulty === 'hard' ? 'bg-red-100 text-red-600' :
                question.difficulty === 'medium' ? 'bg-amber-100 text-amber-600' :
                'bg-green-100 text-green-600'
              }`}>
                {question.difficulty}
              </span>
            )}
            {question.paper && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-500 font-medium">
                {question.paper}
              </span>
            )}
          </div>

          {/* Inline Editor */}
          {editing && (
            <div className="border-t-2 border-blue-200 dark:border-blue-800 pt-3 space-y-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-bold text-gray-700 dark:text-white uppercase tracking-wider">
                  {t('संपादक', 'Editor')}
                </span>
              </div>

              {/* Question text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 mb-0.5 block uppercase">
                    {t('प्रश्न (हिंदी)', 'Question (HI)')}
                  </label>
                  <textarea value={eqH} onChange={e => setEqH(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 mb-0.5 block uppercase">
                    {t('प्रश्न (EN)', 'Question (EN)')}
                  </label>
                  <textarea value={eqE} onChange={e => setEqE(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200" />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-1.5">
                {['A', 'B', 'C', 'D'].map((lb, i) => (
                  <div key={i} className={`flex items-center gap-1.5 p-1 rounded-lg ${
                    eca === i ? 'bg-emerald-50 dark:bg-emerald-950/15 ring-1 ring-emerald-200 dark:ring-emerald-800' : ''
                  }`}>
                    <button onClick={() => setEca(i)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                        eca === i
                          ? 'bg-emerald-500 text-white scale-105'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-emerald-100'
                      }`}>
                      {eca === i ? <Check className="w-3 h-3" /> : lb}
                    </button>
                    <input value={eoH[i] || ''} onChange={e => { const n = [...eoH]; n[i] = e.target.value; setEoH(n); }}
                      placeholder={`${lb} (HI)`}
                      className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200" />
                    <input value={eoE[i] || ''} onChange={e => { const n = [...eoE]; n[i] = e.target.value; setEoE(n); }}
                      placeholder={`${lb} (EN)`}
                      className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200" />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-gray-400 mb-0.5 block uppercase">{t('व्याख्या (HI)', 'Expl (HI)')}</label>
                  <textarea value={exH} onChange={e => setExH(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-gray-400 mb-0.5 block uppercase">{t('व्याख्या (EN)', 'Expl (EN)')}</label>
                  <textarea value={exE} onChange={e => setExE(e.target.value)} rows={2}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs resize-none focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200" />
                </div>
              </div>

              {/* Save bar */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[9px] text-gray-400 flex items-center gap-1">
                  <Languages className="w-2.5 h-2.5 text-indigo-500" />
                  {t('ऑटो-ट्रांसलेट + सिंक', 'Auto-translate + Sync')}
                </span>
                <div className="flex gap-1.5">
                  <button onClick={() => setEditing(false)}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600 text-[10px] font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700">
                    {t('रद्द', 'Cancel')}
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white text-[10px] font-bold transition-colors flex items-center gap-1">
                    {saving ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Zap className="w-2.5 h-2.5" />}
                    {saving ? t('सेव...', 'Save...') : t('ठीक करें', 'Fix')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════ */
/* ══ MAIN PAGE ════════════════════════ */
/* ══════════════════════════════════════ */
const QuestionReports = ({ language: propLang, setLanguage }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '', priority: '', reportType: '', search: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [language] = useState(() => propLang || localStorage.getItem('netprep-language') || 'hi');
  const t = useCallback((hi, en) => language === 'hi' ? hi : en, [language]);
  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type, k: Date.now() }), []);

  // ═══ DATA LOADING ═══
  const loadReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const p = { page, limit: pagination.limit };
      if (filters.status) p.status = filters.status;
      if (filters.priority) p.priority = filters.priority;
      if (filters.reportType) p.reportType = filters.reportType;
      if (filters.search) p.search = filters.search;
      const res = await reportService.getReports(p);
      setReports(res.data || []);
      setPagination(res.pagination || { page, limit: 15, total: 0, pages: 0 });
    } catch { showToast(t('लोड विफल', 'Failed to load'), 'error'); }
    finally { setLoading(false); }
  }, [filters, pagination.limit, showToast, t]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { const r = await reportService.getStats(); setStats(r.data); } catch {}
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadReports(1); }, [filters]);

  // ═══ ACTIONS ═══
  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); setExpandedData(null); return; }
    setExpandedId(id); setLoadingDetail(true); setExpandedData(null); setFixResult(null);
    try { const r = await reportService.getReportById(id); setExpandedData(r.data); }
    catch { showToast(t('विवरण लोड विफल', 'Failed'), 'error'); }
    finally { setLoadingDetail(false); }
  };

  const handleFix = async (reportId, updates) => {
    setSaving(true); setFixResult(null);
    try {
      const r = await reportService.fixQuestion(reportId, {
        questionUpdates: updates,
        resolution: 'Fixed via admin',
        autoTranslate: true,
        enableTextMatch: true
      });
      setFixResult({ ok: true, data: r.data });
      showToast(t('प्रश्न ठीक हो गया!', 'Fixed!'), 'success');
      loadReports(pagination.page); loadStats();
      try { const r2 = await reportService.getReportById(reportId); setExpandedData(r2.data); } catch {}
    } catch (e) {
      setFixResult({ ok: false, err: e.message });
      showToast(e.message || t('विफल', 'Failed'), 'error');
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await reportService.updateReport(id, { status });
      showToast(t('स्टेटस बदला', 'Updated'), 'info');
      loadReports(pagination.page); loadStats();
      if (expandedId === id)
        try { const r = await reportService.getReportById(id); setExpandedData(r.data); } catch {}
    } catch { showToast(t('विफल', 'Failed'), 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('हटाना चाहते हैं?', 'Delete?'))) return;
    setDeleting(id);
    try {
      await reportService.deleteReport(id);
      showToast(t('हटा दिया', 'Deleted'), 'warning');
      loadReports(pagination.page); loadStats();
      if (expandedId === id) { setExpandedId(null); setExpandedData(null); }
    } catch { showToast(t('विफल', 'Failed'), 'error'); }
    finally { setDeleting(null); }
  };

  const handleBulk = async () => {
    if (!bulkAction || !selectedReports.size) return;
    try {
      await reportService.bulkUpdateReports(Array.from(selectedReports), { status: bulkAction });
      showToast(t(`${selectedReports.size} अपडेट`, `${selectedReports.size} updated`), 'success');
      setSelectedReports(new Set()); setBulkAction('');
      loadReports(pagination.page); loadStats();
    } catch { showToast(t('विफल', 'Failed'), 'error'); }
  };

  const toggleSelect = (id) => {
    setSelectedReports(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    setSelectedReports(prev =>
      prev.size === reports.length ? new Set() : new Set(reports.map(r => r._id))
    );
  };

  const activeFilters = [filters.status, filters.priority, filters.reportType, filters.search].filter(Boolean).length;

  // Sort: reported question first
  const getSortedTestQuestions = (tqs, reportedQId) => {
    if (!tqs?.length) return [];
    const reported = [], rest = [];
    tqs.forEach(q => String(q._id) === String(reportedQId) ? reported.push(q) : rest.push(q));
    return [...reported, ...rest];
  };

  // ═══ RENDER ═══
  const content = (
    <div className="space-y-4">
      <style>{RPT_CSS}</style>
      {toast && <Toast key={toast.k} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3" style={{ animation: 'rptFadeUp .4s ease-out' }}>
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h1 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
              <Bug className="w-3.5 h-3.5 text-white" />
            </div>
            {t('प्रश्न रिपोर्ट्स', 'Question Reports')}
          </h1>
        </div>
        <button onClick={() => { loadReports(1); loadStats(); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {t('रिफ्रेश', 'Refresh')}
        </button>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-slate-700 rpt-shimmer" />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Stat label={t('लंबित','Pending')} value={stats.pending} icon={Clock} grad="bg-gradient-to-br from-amber-500 to-orange-600" active={filters.status==='pending'} onClick={()=>setFilters(f=>({...f,status:f.status==='pending'?'':'pending'}))} />
          <Stat label={t('समीक्षा','Reviewing')} value={stats.reviewing} icon={Eye} grad="bg-gradient-to-br from-blue-500 to-indigo-600" active={filters.status==='reviewing'} onClick={()=>setFilters(f=>({...f,status:f.status==='reviewing'?'':'reviewing'}))} />
          <Stat label={t('ठीक','Fixed')} value={stats.fixed} icon={CheckCircle} grad="bg-gradient-to-br from-emerald-500 to-teal-600" active={filters.status==='fixed'} onClick={()=>setFilters(f=>({...f,status:f.status==='fixed'?'':'fixed'}))} />
          <Stat label={t('कुल','Total')} value={stats.total} icon={BarChart3} grad="bg-gradient-to-br from-slate-500 to-slate-700" active={!filters.status} sub={`${stats.recentWeek||0} ${t('इस सप्ताह','this week')}`} onClick={()=>setFilters(f=>({...f,status:''}))} />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2 p-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder={t('खोजें...', 'Search...')}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-gray-800 dark:text-slate-200 placeholder:text-gray-400" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
              showFilters || activeFilters
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 text-blue-600'
                : 'border-gray-200 dark:border-slate-600 text-gray-500'
            }`}>
            <Filter className="w-3 h-3" />
            {t('फ़िल्टर','Filter')}
            {activeFilters > 0 && <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
          {activeFilters > 0 && (
            <button onClick={() => setFilters({ status: '', priority: '', reportType: '', search: '' })}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
        {showFilters && (
          <div className="px-2.5 pb-2.5 pt-1 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-2 rpt-expand">
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[10px] outline-none">
              <option value="">{t('सभी स्टेटस','All Status')}</option>
              <option value="pending">{t('लंबित','Pending')}</option>
              <option value="reviewing">{t('समीक्षा','Reviewing')}</option>
              <option value="in_progress">{t('प्रगति में','In Progress')}</option>
              <option value="fixed">{t('ठीक','Fixed')}</option>
              <option value="rejected">{t('अस्वीकृत','Rejected')}</option>
            </select>
            <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[10px] outline-none">
              <option value="">{t('सभी','All Priority')}</option>
              <option value="critical">{t('गंभीर','Critical')}</option>
              <option value="high">{t('उच्च','High')}</option>
              <option value="medium">{t('मध्यम','Medium')}</option>
              <option value="low">{t('निम्न','Low')}</option>
            </select>
            <select value={filters.reportType} onChange={e => setFilters(f => ({ ...f, reportType: e.target.value }))}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-[10px] outline-none">
              <option value="">{t('सभी प्रकार','All Types')}</option>
              <option value="wrong_answer">{t('गलत उत्तर','Wrong Answer')}</option>
              <option value="wrong_question">{t('गलत प्रश्न','Wrong Q')}</option>
              <option value="wrong_options">{t('गलत विकल्प','Wrong Opt')}</option>
              <option value="explanation_error">{t('व्याख्या त्रुटि','Expl Error')}</option>
              <option value="typo">{t('टाइपो','Typo')}</option>
              <option value="other">{t('अन्य','Other')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Bulk Bar */}
      {selectedReports.size > 0 && (
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl border border-blue-200 dark:border-blue-800 shadow-lg p-2.5 flex items-center gap-2" style={{animation:'rptFadeUp .2s ease-out'}}>
          <span className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{selectedReports.size}</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            className="px-2 py-1 rounded border border-gray-200 dark:border-slate-600 text-[10px]">
            <option value="">{t('कार्रवाई','Action')}</option>
            <option value="reviewing">{t('समीक्षा','Review')}</option>
            <option value="fixed">{t('ठीक','Fixed')}</option>
            <option value="rejected">{t('अस्वीकृत','Reject')}</option>
          </select>
          <button onClick={handleBulk} disabled={!bulkAction} className="px-2.5 py-1 rounded bg-blue-500 text-white text-[10px] font-bold disabled:opacity-40">{t('लागू','Apply')}</button>
          <button onClick={() => setSelectedReports(new Set())} className="ml-auto p-1 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-2">
        {!loading && reports.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <button onClick={selectAll} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-500">
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedReports.size === reports.length ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}`}>
                {selectedReports.size === reports.length && <Check className="w-2 h-2" />}
              </div>
              {t('सभी', 'All')}
            </button>
            <span className="text-[10px] text-gray-400">{pagination.total} {t('रिपोर्ट','reports')}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-10 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-bold text-gray-500">{t('कोई रिपोर्ट नहीं','No Reports')}</p>
          </div>
        ) : reports.map((rpt, idx) => {
          const isExp = expandedId === rpt._id;
          const isSel = selectedReports.has(rpt._id);
          const pc = reportService.getPriorityColor(rpt.priority);
          const sc = reportService.getStatusColor(rpt.status);

          return (
            <div key={rpt._id}
              className={`bg-white dark:bg-slate-800 rounded-xl border-2 overflow-hidden transition-all duration-200
                ${isExp ? 'border-blue-300 dark:border-blue-700 shadow-lg' : isSel ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 hover:shadow-sm'}
                ${rpt.priority === 'critical' ? 'ring-1 ring-red-200 dark:ring-red-900/30' : ''}`}
              style={{ animation: `rptFadeUp .3s ease-out ${idx * 0.03}s both` }}>

              {/* Row */}
              <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-750/20 transition-colors"
                onClick={() => toggleExpand(rpt._id)}>
                <button onClick={e => { e.stopPropagation(); toggleSelect(rpt._id); }}
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 hover:border-blue-400'}`}>
                  {isSel && <Check className="w-2 h-2" />}
                </button>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pc.dot}`} style={rpt.priority === 'critical' ? { animation: 'rptDot 2s infinite' } : {}} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap mb-0.5">
                    <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold ${sc.bg} ${sc.text}`}>
                      {rpt.status === 'fixed' ? <Check className="w-2 h-2"/> : rpt.status === 'pending' ? <Clock className="w-2 h-2"/> : <Eye className="w-2 h-2"/>}
                      {reportService.getStatusLabel(rpt.status, language)}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${pc.bg} ${pc.text}`}>
                      {rpt.priority === 'critical' && <Flame className="w-2 h-2 inline mr-0.5"/>}
                      {rpt.priority?.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-gray-500">{reportService.getReportTypeLabel(rpt.reportType, language)}</span>
                    {rpt.reportCount > 1 && <span className="px-1 py-0.5 rounded bg-red-100 text-red-600 text-[8px] font-bold"><Users className="w-2 h-2 inline mr-0.5"/>x{rpt.reportCount}</span>}
                  </div>
                  <p className="text-xs text-gray-700 dark:text-slate-300 truncate">{rpt.description}</p>
                  <div className="flex items-center gap-2.5 mt-0.5 text-[9px] text-gray-400">
                    <span className="flex items-center gap-0.5"><User className="w-2 h-2"/>{rpt.reporterName || 'Anon'}</span>
                    <span><Calendar className="w-2 h-2 inline mr-0.5"/>{new Date(rpt.createdAt).toLocaleDateString()}</span>
                    {rpt.affectedTestCount > 0 && <span className="text-amber-500 font-semibold"><Zap className="w-2 h-2 inline mr-0.5"/>{rpt.affectedTestCount}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {rpt.status === 'pending' && (
                    <button onClick={e => { e.stopPropagation(); updateStatus(rpt._id, 'reviewing'); }}
                      className="p-1 rounded bg-blue-50 text-blue-500 hover:bg-blue-100"><Eye className="w-3 h-3"/></button>
                  )}
                  <button onClick={e => { e.stopPropagation(); handleDelete(rpt._id); }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                    {deleting === rpt._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isExp ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* ═══ EXPANDED ═══ */}
              {isExp && (
                <div className="border-t border-gray-100 dark:border-slate-700 rpt-expand">
                  <div className="px-3 py-3.5 space-y-3.5 bg-gray-50/50 dark:bg-slate-800/50">
                    {loadingDetail ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                    ) : expandedData ? (
                      <>
                        {/* Fix Result */}
                        {fixResult && (
                          <div className={`p-3 rounded-xl border text-xs ${fixResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                            style={{animation:'rptBounce .4s ease-out'}}>
                            {fixResult.ok ? (
                              <div>
                                <div className="flex items-center gap-1 font-bold"><CheckCheck className="w-3.5 h-3.5"/>{t('ठीक हो गया!','Fixed!')}</div>
                                <div className="flex gap-3 mt-1 text-[10px] opacity-80">
                                  {fixResult.data?.testsUpdated > 0 && <span>{fixResult.data.testsUpdated} {t('टेस्ट','tests')}</span>}
                                  {fixResult.data?.attemptsReEvaluated > 0 && <span>{fixResult.data.attemptsReEvaluated} {t('री-इवैल','re-eval')}</span>}
                                  {fixResult.data?.answersChanged > 0 && <span>{fixResult.data.answersChanged} {t('बदले','changed')}</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{fixResult.err}</div>
                            )}
                          </div>
                        )}

                        {/* Report Info */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
                          <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-500"/>{t('रिपोर्ट विवरण','Report Details')}
                          </h4>
                          <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{expandedData.description}</p>
                          {expandedData.suggestedCorrection && (
                            <div className="mt-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/20">
                              <p className="text-[9px] font-bold text-blue-600 mb-0.5 flex items-center gap-0.5"><Wand2 className="w-2.5 h-2.5"/>{t('सुझाव','Suggestion')}</p>
                              <p className="text-xs text-blue-800 dark:text-blue-300">{expandedData.suggestedCorrection}</p>
                            </div>
                          )}
                          {expandedData.screenshots?.length > 0 && <div className="mt-2"><Screenshots items={expandedData.screenshots}/></div>}
                        </div>

                        {/* ★★★ ALL TEST QUESTIONS — reported first, proper renderers ★★★ */}
                        {(() => {
                          const sorted = getSortedTestQuestions(expandedData.testQuestions, rpt.questionId);
                          const hasQ = sorted.length > 0;
                          const hasCurrent = !!expandedData.currentQuestion;

                          // No test questions but have current question
                          if (!hasQ && hasCurrent) {
                            return (
                              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Search className="w-3 h-3 text-blue-500"/>{t('रिपोर्टेड प्रश्न','Reported Question')}
                                </h4>
                                <QuestionCard
                                  question={expandedData.currentQuestion}
                                  questionSource={expandedData.questionSource}
                                  index={expandedData.questionIndex || 0}
                                  isReported={true}
                                  language={language}
                                  isOpenDefault={true}
                                  onFixSave={u => handleFix(expandedData._id, u)}
                                  saving={saving}
                                />
                              </div>
                            );
                          }

                          if (!hasQ) return null;

                          return (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 dark:bg-slate-750/50 border-b border-gray-100 dark:border-slate-700">
                                <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-indigo-500"/>
                                  {t('टेस्ट के सभी प्रश्न','All Test Questions')} ({sorted.length})
                                  <span className="text-[8px] font-normal ml-1 text-gray-400">{t('(रिपोर्टेड पहले)','(reported first)')}</span>
                                </h4>
                              </div>
                              <div className="p-2.5 space-y-2 max-h-[600px] overflow-y-auto rpt-scroll">
                                {sorted.map((tq, i) => {
                                  const isThis = String(tq._id) === String(rpt.questionId);
                                  return (
                                    <QuestionCard
                                      key={tq._id || i}
                                      question={tq}
                                      questionSource="bank"
                                      index={i}
                                      isReported={isThis}
                                      language={language}
                                      isOpenDefault={isThis}
                                      onFixSave={u => handleFix(expandedData._id, u)}
                                      saving={saving}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Affected Tests */}
                        {expandedData.affectedTests?.length > 0 && (
                          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-500"/>{t('प्रभावित टेस्ट','Affected Tests')} ({expandedData.affectedTests.length})
                            </h4>
                            <div className="space-y-1">
                              {expandedData.affectedTests.map(ts => (
                                <div key={ts._id} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 dark:bg-slate-750/50 text-[10px]">
                                  <span className="font-medium text-gray-700 dark:text-slate-300 truncate">{ts.title}</span>
                                  <span className="px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-600 text-gray-500 text-[8px] font-semibold flex-shrink-0">{ts.testType}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        {['pending','reviewing','in_progress'].includes(expandedData.status) && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {expandedData.status !== 'reviewing' && (
                              <button onClick={() => updateStatus(rpt._id, 'reviewing')}
                                className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold hover:bg-blue-200 flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5"/>{t('समीक्षा','Review')}
                              </button>
                            )}
                            <button onClick={() => updateStatus(rpt._id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[10px] font-semibold hover:bg-red-200 flex items-center gap-0.5">
                              <XCircle className="w-2.5 h-2.5"/>{t('अस्वीकृत','Reject')}
                            </button>
                            <button onClick={() => handleDelete(rpt._id)}
                              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 text-[10px] font-semibold hover:bg-red-50 hover:text-red-500 flex items-center gap-0.5">
                              <Trash2 className="w-2.5 h-2.5"/>{t('हटाएं','Delete')}
                            </button>
                          </div>
                        )}

                        {expandedData.status === 'fixed' && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                            <CheckCheck className="w-4 h-4 text-emerald-500"/>
                            <div>
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{t('ठीक किया गया','Fixed')}</p>
                              {expandedData.fixedAt && <p className="text-[9px] text-emerald-600/70">{new Date(expandedData.fixedAt).toLocaleString()}</p>}
                            </div>
                          </div>
                        )}

                        {expandedData.status === 'rejected' && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                            <XCircle className="w-4 h-4 text-red-500"/>
                            <p className="text-xs font-bold text-red-700 dark:text-red-400">{t('अस्वीकृत','Rejected')}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-400"/>
                        <p className="text-[10px] text-red-500">{t('लोड विफल','Failed')}</p>
                        <button onClick={() => toggleExpand(rpt._id)} className="text-[9px] text-blue-500 mt-1 hover:underline">{t('पुनः प्रयास','Retry')}</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button disabled={pagination.page <= 1} onClick={() => loadReports(pagination.page - 1)}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 bg-white dark:bg-slate-800">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
            let pg;
            if (pagination.pages <= 5) pg = i + 1;
            else if (pagination.page <= 3) pg = i + 1;
            else if (pagination.page >= pagination.pages - 2) pg = pagination.pages - 4 + i;
            else pg = pagination.page - 2 + i;
            return (
              <button key={pg} onClick={() => loadReports(pg)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold ${
                  pagination.page === pg
                    ? 'bg-blue-500 text-white shadow'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-50'
                }`}>
                {pg}
              </button>
            );
          })}
          <button disabled={pagination.page >= pagination.pages} onClick={() => loadReports(pagination.page + 1)}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-30 hover:bg-gray-100 bg-white dark:bg-slate-800">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <p className="text-center text-[10px] text-gray-400 pb-2">
          {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
        </p>
      )}
    </div>
  );

  return <Layout language={language} setLanguage={setLanguage}>{content}</Layout>;
};

export default QuestionReports;