// client/src/components/pages/QuestionReports.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Eye, Edit3, Trash2,
  Filter, Search, RefreshCw, ChevronDown,
  X, Zap, MessageSquare, BarChart3, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, FileText, Check, XCircle, ArrowLeft, Users, Layers,
  Flame, Bug, Calendar, User, MapPin, Info,
  RotateCcw, Wand2, Languages, CheckCheck, Target,
  Activity, BookOpen, Settings
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import reportService from '../services/reportService';
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
@keyframes rptFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes rptSlideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:5000px}}
@keyframes rptSlideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes rptShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes rptBounce{0%{transform:scale(.88);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
@keyframes rptPulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes rptModalIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

.rpt-shimmer{background:linear-gradient(90deg,rgba(203,213,225,.4) 25%,rgba(226,232,240,.8) 50%,rgba(203,213,225,.4) 75%);background-size:200% 100%;animation:rptShimmer 1.6s ease-in-out infinite}
.dark .rpt-shimmer{background:linear-gradient(90deg,rgba(30,41,59,.6) 25%,rgba(51,65,85,.9) 50%,rgba(30,41,59,.6) 75%);background-size:200% 100%}
.rpt-expand{animation:rptSlideDown .3s cubic-bezier(.4,0,.2,1);overflow:hidden}
.rpt-fade{animation:rptFadeUp .4s cubic-bezier(.4,0,.2,1) both}
.rpt-pulse{animation:rptPulse 2s ease-in-out infinite}
.rpt-modal{animation:rptModalIn .28s cubic-bezier(.4,0,.2,1)}
.rpt-scroll::-webkit-scrollbar{width:3px}
.rpt-scroll::-webkit-scrollbar-track{background:transparent}
.rpt-scroll::-webkit-scrollbar-thumb{background:rgba(148,163,184,.25);border-radius:10px}
`;

/* ═══ HELPERS ═══ */
const bText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.hi || obj.en || '';
};

const TYPE_LABELS = {
  mcq:'MCQ',assertion_reason:'Assertion-Reason',match:'Match Following',
  match_following:'Match Following',sequence:'Sequence',sequence_order:'Sequence Order',
  statement:'Statement Based',statement_based:'Statement Based',passage:'Passage',
  passage_based:'Passage Based',di_bar:'DI Bar Chart',di_bar_chart:'DI Bar Chart',
  di_pie:'DI Pie Chart',di_pie_chart:'DI Pie Chart',di_line:'DI Line Graph',
  di_line_graph:'DI Line Graph',di_caselet:'DI Caselet',di_table:'DI Table',di_mixed:'DI Mixed'
};
const getTypeLabel = (t) => TYPE_LABELS[t] || t || 'MCQ';

/* ═══ NORMALIZE ═══ */
const normalizePYQQuestion = (question) => {
  if (!question) return question;
  if (question.question && typeof question.question === 'object') return question;
  const n = { ...question };
  if (!n.question) {
    n.question = {
      hi: question.questionTextHi || question.questionText || '',
      en: question.questionTextEn || question.questionText || '',
    };
  }
  if (!n.options || (!n.options.hi && !n.options.en)) {
    n.options = {
      hi: question.optionsHi || question.options || [],
      en: question.optionsEn || question.options || [],
    };
  }
  if (!n.explanation) {
    n.explanation = {
      hi: question.explanationHi || question.explanation || '',
      en: question.explanationEn || question.explanation || '',
    };
  }
  return n;
};

/* ═══ TOAST ═══ */
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, [onClose]);
  const cfg = {
    success: { bg: 'bg-emerald-600 border-emerald-500', Icon: CheckCircle },
    error:   { bg: 'bg-red-600 border-red-500',         Icon: AlertCircle },
    info:    { bg: 'bg-blue-600 border-blue-500',        Icon: Info },
    warning: { bg: 'bg-amber-600 border-amber-500',      Icon: AlertTriangle },
  };
  const { bg, Icon } = cfg[type] || cfg.info;
  return (
    <div className="fixed top-5 right-5 z-[999]" style={{ animation: 'rptSlideIn .28s ease-out' }}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bg} border text-white shadow-2xl text-sm font-medium min-w-[260px] max-w-sm`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1 leading-snug">{message}</span>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
};

/* ═══ SKELETON ═══ */
const SkeletonRow = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
    <div className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 rpt-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded bg-slate-200 dark:bg-slate-700 w-3/4 rpt-shimmer" />
        <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 w-1/2 rpt-shimmer" />
      </div>
      <div className="flex gap-2">
        <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700 rpt-shimmer" />
        <div className="w-12 h-5 rounded-full bg-slate-200 dark:bg-slate-700 rpt-shimmer" />
      </div>
    </div>
  </div>
);

/* ═══ COUNTER ═══ */
const Counter = ({ value }) => {
  const [n, setN] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const target = parseInt(value) || 0;
    if (!target) { setN(0); return; }
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / 900, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{n.toLocaleString()}</>;
};

/* ═══ STAT CARD ═══ */
const StatCard = ({ label, value, icon: Icon, colorClass, gradientClass, active, onClick, badge }) => (
  <button onClick={onClick}
    className={`relative w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 overflow-hidden
      ${active
        ? `${gradientClass} border-transparent text-white shadow-xl scale-[1.02]`
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
      }`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className={`text-2xl font-black tracking-tight leading-none mb-1 ${active ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          <Counter value={value} />
        </p>
        <p className={`text-xs font-semibold uppercase tracking-wider ${active ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
        {badge && <p className={`text-[10px] mt-1 ${active ? 'text-white/50' : 'text-slate-400 dark:text-slate-500'}`}>{badge}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-white' : colorClass}`} />
      </div>
    </div>
  </button>
);

/* ═══ BADGE ═══ */
const Badge = ({ children, variant = 'default', size = 'sm' }) => {
  const v = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    danger:  'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    info:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    purple:  'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };
  const s = { xs: 'px-1.5 py-0.5 text-[9px]', sm: 'px-2 py-0.5 text-[10px]', md: 'px-2.5 py-1 text-xs' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-semibold ${v[variant] || v.default} ${s[size] || s.sm}`}>
      {children}
    </span>
  );
};

/* ═══ SCREENSHOTS ═══ */
const Screenshots = ({ items }) => {
  const [view, setView] = useState(null);
  if (!items?.length) return null;
  return (
    <>
      <div className="flex gap-2 flex-wrap mt-2">
        {items.map((s, i) => (
          <button key={i} onClick={() => setView(s.data)}
            className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all group">
            <img src={s.data} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          </button>
        ))}
      </div>
      {view && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setView(null)}>
          <img src={view} alt="" className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl" style={{ animation: 'rptBounce .28s ease-out' }} />
          <button onClick={() => setView(null)} className="absolute top-5 right-5 p-2.5 bg-white/10 rounded-xl text-white hover:bg-white/20 border border-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};

/* ═══ QUESTION PREVIEW (Read-only renderer) ═══ */
const QuestionPreview = ({ question, language }) => {
  const nq = normalizePYQQuestion(question);
  const qType = (nq?.questionType || 'mcq').toLowerCase().trim();
  const commonProps = {
    question: nq, language, showAnswer: true,
    selectedAnswer: null, onAnswerSelect: null,
    isPreview: true, disabled: true,
  };
  switch (qType) {
    case 'assertion_reason': case 'assertionreason': case 'ar':
      return <AssertionReason {...commonProps} />;
    case 'match': case 'match_following': case 'matchfollowing':
      return <MatchFollowing {...commonProps} />;
    case 'sequence': case 'sequence_order': case 'sequenceorder':
      return <SequenceOrder {...commonProps} />;
    case 'statement': case 'statement_based': case 'statementbased':
      return <StatementBased {...commonProps} />;
    case 'passage': case 'passage_based': case 'passagebased':
      return <PassageQuestion {...commonProps} passage={nq.passageId} showPassage />;
    case 'di_bar': case 'di_bar_chart':
      return <DIBarChart {...commonProps} diData={nq.diDataId} showDIData />;
    case 'di_pie': case 'di_pie_chart':
      return <DIPieChart {...commonProps} diData={nq.diDataId} showDIData />;
    case 'di_line': case 'di_line_graph':
      return <DILineGraph {...commonProps} diData={nq.diDataId} showDIData />;
    case 'di_caselet': case 'dicaselet':
      return <DICaselet {...commonProps} diData={nq.diDataId} showDIData />;
    default:
      return <MCQQuestion {...commonProps} />;
  }
};


/* ═══════════════════════════════════════════
   EDITOR MODAL - Portal based, multi-type support
═══════════════════════════════════════════ */
const EditorModal = ({ question, language, onSave, onClose, saving }) => {
  const nq = normalizePYQQuestion(question);
  const t  = (hi, en) => language === 'hi' ? hi : en;
  const qType = (nq.questionType || 'mcq').toLowerCase();

  // ── MCQ States ──
  const [eqH, setEqH] = useState(() => nq.question?.hi || '');
  const [eqE, setEqE] = useState(() => nq.question?.en || '');
  const [eoH, setEoH] = useState(() =>
    Array.isArray(nq.options?.hi) ? [...nq.options.hi] :
    Array.isArray(nq.options)     ? [...nq.options]    : ['','','','']
  );
  const [eoE, setEoE] = useState(() =>
    Array.isArray(nq.options?.en) ? [...nq.options.en] : ['','','','']
  );
  const [eca, setEca] = useState(() => nq.correctAnswer ?? 0);
  const [exH, setExH] = useState(() => nq.explanation?.hi || '');
  const [exE, setExE] = useState(() => nq.explanation?.en || '');

  // ── Match List States ──
  const [listAHi, setListAHi] = useState(() =>
    Array.isArray(nq.matchData?.listA?.hi) ? [...nq.matchData.listA.hi] :
    Array.isArray(nq.matchData?.listA)     ? [...nq.matchData.listA]    : ['','','','']
  );
  const [listAEn, setListAEn] = useState(() =>
    Array.isArray(nq.matchData?.listA?.en) ? [...nq.matchData.listA.en] : ['','','','']
  );
  const [listBHi, setListBHi] = useState(() =>
    Array.isArray(nq.matchData?.listB?.hi) ? [...nq.matchData.listB.hi] :
    Array.isArray(nq.matchData?.listB)     ? [...nq.matchData.listB]    : ['','','','']
  );
  const [listBEn, setListBEn] = useState(() =>
    Array.isArray(nq.matchData?.listB?.en) ? [...nq.matchData.listB.en] : ['','','','']
  );
  const [correctMatch, setCorrectMatch] = useState(() =>
    Array.isArray(nq.matchData?.correctMatch) ? [...nq.matchData.correctMatch] : [0,1,2,3]
  );

  // ── Statement States ──
  const [stmtsHi, setStmtsHi] = useState(() =>
    Array.isArray(nq.statementData?.statements?.hi) ? [...nq.statementData.statements.hi] :
    Array.isArray(nq.statementData?.statements)     ? [...nq.statementData.statements]    : ['','']
  );
  const [stmtsEn, setStmtsEn] = useState(() =>
    Array.isArray(nq.statementData?.statements?.en) ? [...nq.statementData.statements.en] : ['','']
  );
  const [correctStmts, setCorrectStmts] = useState(() =>
    Array.isArray(nq.statementData?.correctStatements) ? [...nq.statementData.correctStatements] : []
  );

  // ── Assertion States ──
  const [assertHi, setAssertHi] = useState(() => nq.assertionReasonData?.assertion?.hi || '');
  const [assertEn, setAssertEn] = useState(() => nq.assertionReasonData?.assertion?.en || '');
  const [reasonHi, setReasonHi] = useState(() => nq.assertionReasonData?.reason?.hi || '');
  const [reasonEn, setReasonEn] = useState(() => nq.assertionReasonData?.reason?.en || '');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleSave = () => {
    const base = {
      question:      { hi: eqH, en: eqE },
      options:       { hi: [...eoH], en: [...eoE] },
      correctAnswer: parseInt(eca),
      explanation:   { hi: exH, en: exE },
    };

    // Type-specific data
    const isMatch     = ['match','match_following','matchfollowing'].includes(qType);
    const isStatement = ['statement','statement_based','statementbased'].includes(qType);
    const isAR        = ['assertion_reason','assertionreason','ar'].includes(qType);

    if (isMatch) {
      base.matchData = {
        listA: { hi: [...listAHi], en: [...listAEn] },
        listB: { hi: [...listBHi], en: [...listBEn] },
        correctMatch: [...correctMatch],
      };
    }
    if (isStatement) {
      base.statementData = {
        statements: { hi: [...stmtsHi], en: [...stmtsEn] },
        correctStatements: [...correctStmts],
      };
    }
    if (isAR) {
      base.assertionReasonData = {
        assertion: { hi: assertHi, en: assertEn },
        reason:    { hi: reasonHi, en: reasonEn },
      };
    }

    onSave(base);
  };

  const OL  = (i) => String.fromCharCode(65 + i);
  const ROM = (i) => ['i','ii','iii','iv','v'][i] || String(i+1);

  const isMatch     = ['match','match_following','matchfollowing','match-following'].includes(qType);
  const isStatement = ['statement','statement_based','statementbased','statement-based'].includes(qType);
  const isAR        = ['assertion_reason','assertionreason','ar','assertion-reason'].includes(qType);
  const isSequence  = ['sequence','sequence_order','sequenceorder','sequence-order'].includes(qType);

  // ── Shared Styles ──
  const inputStyle = {
    pointerEvents: 'all', userSelect: 'text',
    WebkitUserSelect: 'text', cursor: 'text',
  };

  const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm
    text-slate-800 dark:text-slate-100
    bg-white dark:bg-slate-700
    border-2 border-slate-200 dark:border-slate-600
    outline-none transition-colors
    placeholder:text-slate-300 dark:placeholder:text-slate-600
    focus:border-blue-500 dark:focus:border-blue-400`;

  const smInputCls = `w-full px-2.5 py-2 rounded-lg text-sm
    text-slate-800 dark:text-slate-100
    bg-white dark:bg-slate-700
    border-2 border-slate-200 dark:border-slate-600
    outline-none transition-colors
    placeholder:text-slate-300 dark:placeholder:text-slate-600
    focus:border-blue-500 dark:focus:border-blue-400`;

  const SectionHead = ({ color, label, sub }) => (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1 h-4 ${color} rounded-full`} />
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{label}</span>
      {sub && <span className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</span>}
    </div>
  );


  return createPortal(
    <div
      style={{
        position:'fixed', inset:0, zIndex:99999,
        display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
        backgroundColor:'rgba(0,0,0,0.65)',
        backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)',
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          position:'relative', zIndex:100000,
          width:'100%', maxWidth:'860px', maxHeight:'92vh',
          display:'flex', flexDirection:'column',
          borderRadius:'20px',
          boxShadow:'0 25px 60px rgba(0,0,0,0.4)',
          animation:'rptModalIn .28s cubic-bezier(.4,0,.2,1)',
          pointerEvents:'all',
          overflow:'hidden',
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {t('प्रश्न संपादक', 'Question Editor')}
              <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {getTypeLabel(qType)}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {bText(nq.question, language) || '—'}
            </p>
          </div>
          <button type="button" onClick={onClose}
            style={{ pointerEvents:'all', cursor:'pointer' }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div
          style={{ flex:1, overflowY:'auto', padding:'20px 24px', pointerEvents:'all', display:'flex', flexDirection:'column', gap:'24px' }}
          className="dark:bg-slate-900"
        >

          {/* ── Question Text (All Types) ── */}
          <div>
            <SectionHead color="bg-blue-500" label={t('प्रश्न पाठ','Question Text')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  {t('हिंदी','Hindi')}
                </label>
                <textarea value={eqH} onChange={e=>setEqH(e.target.value)}
                  rows={3} placeholder="हिंदी प्रश्न..."
                  style={{...inputStyle, resize:'vertical'}} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  English
                </label>
                <textarea value={eqE} onChange={e=>setEqE(e.target.value)}
                  rows={3} placeholder="English question..."
                  style={{...inputStyle, resize:'vertical'}} className={inputCls} />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════
              MATCH FOLLOWING - List I & II Editor
          ════════════════════════════════ */}
          {isMatch && (
            <div>
              <SectionHead color="bg-indigo-500" label={t('सूची संपादक','List Editor')}
                sub={t('— List-I और List-II संपादित करें','— Edit List-I and List-II')} />

              {/* Table Style Editor */}
              <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                  <div className="px-4 py-2.5 border-r border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                      {t('सूची-I','List-I')} — {t('हिंदी / English','Hindi / English')}
                    </p>
                  </div>
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 text-center">
                      {t('सूची-II','List-II')} — {t('हिंदी / English','Hindi / English')}
                    </p>
                  </div>
                </div>

                {/* Rows */}
                {[0,1,2,3].map((i) => (
                  <div key={i}
                    className={`grid grid-cols-2 border-b border-slate-200 dark:border-slate-700 last:border-0
                      ${i%2===0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                    {/* List A */}
                    <div className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-700 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0 w-6">
                          ({OL(i)})
                        </span>
                        <input type="text" value={listAHi[i]||''}
                          onChange={e=>{const a=[...listAHi];a[i]=e.target.value;setListAHi(a);}}
                          placeholder={`${OL(i)} हिंदी...`}
                          style={inputStyle} className={smInputCls} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 flex-shrink-0" />
                        <input type="text" value={listAEn[i]||''}
                          onChange={e=>{const a=[...listAEn];a[i]=e.target.value;setListAEn(a);}}
                          placeholder={`${OL(i)} English...`}
                          style={inputStyle} className={smInputCls} />
                      </div>
                    </div>

                    {/* List B */}
                    <div className="px-3 py-2.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0 w-8">
                          ({ROM(i)})
                        </span>
                        <input type="text" value={listBHi[i]||''}
                          onChange={e=>{const a=[...listBHi];a[i]=e.target.value;setListBHi(a);}}
                          placeholder={`${ROM(i)} हिंदी...`}
                          style={inputStyle} className={smInputCls} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 flex-shrink-0" />
                        <input type="text" value={listBEn[i]||''}
                          onChange={e=>{const a=[...listBEn];a[i]=e.target.value;setListBEn(a);}}
                          placeholder={`${ROM(i)} English...`}
                          style={inputStyle} className={smInputCls} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Correct Match Mapping */}
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {t('सही मिलान (A→?, B→?, C→?, D→?)','Correct Match (A→?, B→?, C→?, D→?)')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-5 flex-shrink-0">
                        {OL(i)}→
                      </span>
                      <select
                        value={correctMatch[i] ?? i}
                        onChange={e=>{
                          const a=[...correctMatch];
                          a[i]=parseInt(e.target.value);
                          setCorrectMatch(a);
                        }}
                        style={{ pointerEvents:'all', cursor:'pointer' }}
                        className="flex-1 px-2 py-1.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-700
                          bg-white dark:bg-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-400
                          outline-none focus:border-emerald-500"
                      >
                        {[0,1,2,3].map(j => (
                          <option key={j} value={j}>({ROM(j)})</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════
              ASSERTION REASON Editor
          ════════════════════════════════ */}
          {isAR && (
            <div>
              <SectionHead color="bg-orange-500" label={t('अभिकथन और कारण','Assertion & Reason')} />
              <div className="space-y-3">
                {[
                  { label:t('अभिकथन (A)','Assertion (A)'), hi:assertHi, setHi:setAssertHi, en:assertEn, setEn:setAssertEn },
                  { label:t('कारण (R)','Reason (R)'),     hi:reasonHi, setHi:setReasonHi, en:reasonEn, setEn:setReasonEn },
                ].map((row,ri) => (
                  <div key={ri} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {row.label}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <textarea value={row.hi} onChange={e=>row.setHi(e.target.value)}
                        rows={2} placeholder="हिंदी..."
                        style={{...inputStyle,resize:'vertical'}} className={inputCls} />
                      <textarea value={row.en} onChange={e=>row.setEn(e.target.value)}
                        rows={2} placeholder="English..."
                        style={{...inputStyle,resize:'vertical'}} className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════
              STATEMENT BASED Editor
          ════════════════════════════════ */}
          {isStatement && (
            <div>
              <SectionHead color="bg-teal-500" label={t('कथन','Statements')} />
              <div className="space-y-2.5">
                {stmtsHi.map((_,i) => (
                  <div key={i}
                    className={`p-3 rounded-xl border-2 transition-all
                      ${correctStmts.includes(i)
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                      }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button"
                        onClick={()=>{
                          setCorrectStmts(prev =>
                            prev.includes(i) ? prev.filter(x=>x!==i) : [...prev,i]
                          );
                        }}
                        style={{pointerEvents:'all',cursor:'pointer'}}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-all flex-shrink-0
                          ${correctStmts.includes(i)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-500 hover:border-emerald-400'
                          }`}>
                        {correctStmts.includes(i) ? <Check className="w-3 h-3"/> : i+1}
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {t(`कथन ${i+1}`,`Statement ${i+1}`)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input type="text" value={stmtsHi[i]||''}
                        onChange={e=>{const a=[...stmtsHi];a[i]=e.target.value;setStmtsHi(a);}}
                        placeholder={`कथन ${i+1} हिंदी...`}
                        style={inputStyle} className={smInputCls} />
                      <input type="text" value={stmtsEn[i]||''}
                        onChange={e=>{const a=[...stmtsEn];a[i]=e.target.value;setStmtsEn(a);}}
                        placeholder={`Statement ${i+1} English...`}
                        style={inputStyle} className={smInputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════
              MCQ Options (non-match types)
          ════════════════════════════════ */}
          {!isStatement && (
            <div>
              <SectionHead color="bg-emerald-500" label={t('विकल्प','Options')}
                sub={t('— सही उत्तर चुनें','— Click to mark correct')} />
              <div className="space-y-2.5">
                {[0,1,2,3].map((i) => (
                  <div key={i}
                    style={{
                      display:'flex', alignItems:'center', gap:'10px',
                      padding:'10px 12px', borderRadius:'12px',
                      border:`2px solid ${eca===i?'#34d399':'#e2e8f0'}`,
                      backgroundColor: eca===i ? '#f0fdf4' : '#f8fafc',
                      transition:'all .15s', pointerEvents:'all',
                    }}
                    className={eca===i
                      ? 'dark:border-emerald-600 dark:bg-emerald-950/20'
                      : 'dark:border-slate-700 dark:bg-slate-800/50'}>
                    <button type="button" onClick={()=>setEca(i)}
                      style={{pointerEvents:'all',cursor:'pointer',flexShrink:0}}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border-2 transition-all
                        ${eca===i
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                          : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600'
                        }`}>
                      {eca===i ? <Check className="w-4 h-4"/> : OL(i)}
                    </button>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">HI</div>
                      <input type="text" value={eoH[i]||''}
                        onChange={e=>{const a=[...eoH];a[i]=e.target.value;setEoH(a);}}
                        placeholder={`विकल्प ${OL(i)}`}
                        style={inputStyle} className={smInputCls} />
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">EN</div>
                      <input type="text" value={eoE[i]||''}
                        onChange={e=>{const a=[...eoE];a[i]=e.target.value;setEoE(a);}}
                        placeholder={`Option ${OL(i)}`}
                        style={inputStyle} className={smInputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Explanation (All Types) ── */}
          <div>
            <SectionHead color="bg-purple-500" label={t('व्याख्या','Explanation')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  {t('हिंदी','Hindi')}
                </label>
                <textarea value={exH} onChange={e=>setExH(e.target.value)}
                  rows={5} placeholder="हिंदी व्याख्या..."
                  style={{...inputStyle,resize:'vertical'}} className={inputCls} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5">
                  English
                </label>
                <textarea value={exE} onChange={e=>setExE(e.target.value)}
                  rows={5} placeholder="English explanation..."
                  style={{...inputStyle,resize:'vertical'}} className={inputCls} />
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800/80">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <Languages className="w-3 h-3 text-blue-500" />
            {t('ऑटो-ट्रांसलेट सक्रिय','Auto-translate enabled')}
          </span>
          <div className="flex gap-2.5">
            <button type="button" onClick={onClose}
              style={{pointerEvents:'all',cursor:'pointer'}}
              className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              {t('रद्द करें','Cancel')}
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              style={{pointerEvents:'all',cursor:saving?'not-allowed':'pointer'}}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white text-sm font-bold transition-colors flex items-center gap-2 shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
              {saving ? t('सहेज रहे...','Saving...') : t('परिवर्तन सहेजें','Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body  // ✅ Portal - DOM tree se bahar render
  );
};


/* ═══════════════════════════════════════════
   QUESTION CARD - Portal modal, body mein render
═══════════════════════════════════════════ */
const QuestionCard = ({ question, index, isReported, language, isOpenDefault, onFixSave, saving }) => {
  const [open, setOpen]           = useState(isOpenDefault || false);
  const [showEditor, setShowEditor] = useState(false);

  const nq    = normalizePYQQuestion(question);
  const qText = nq.question ? bText(nq.question, language) : '';
  const qType = nq.questionType || 'mcq';
  const optLabel = (i) => String.fromCharCode(65 + i);
  const t = (hi, en) => language === 'hi' ? hi : en;

  const handleSave = useCallback((updates) => {
    onFixSave(updates);
    setShowEditor(false);
  }, [onFixSave]);

  return (
    <>
      {/* ✅ Portal modal - completely outside card DOM */}
      {showEditor && (
        <EditorModal
          question={nq}
          language={language}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
          saving={saving}
        />
      )}

      <div className={`rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${isReported
          ? 'border-red-300 dark:border-red-800/70 bg-red-50/20 dark:bg-red-950/10'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
        }`}>

        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
          onClick={() => setOpen(!open)}
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
            ${isReported ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
            {nq.questionNumber || index + 1}
          </span>
          <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate min-w-0">
            {qText || <span className="italic text-slate-400 dark:text-slate-500">No text</span>}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="purple" size="xs">{getTypeLabel(qType)}</Badge>
            {nq.correctAnswer >= 0 && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-1.5 py-0.5">
                {optLabel(nq.correctAnswer)}
              </span>
            )}
            {isReported && <Badge variant="danger" size="xs">REPORTED</Badge>}
            {/* Edit Button - opens modal */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}
              title={t('संपादित करें', 'Edit Question')}
              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30
                text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400
                transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Preview - only question renderer, no editor conflict */}
        {open && (
          <div className="border-t border-slate-100 dark:border-slate-700 rpt-expand">
            <div className="px-4 py-4 space-y-3">
              {/* Question Renderer */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 p-4">
                <QuestionPreview question={nq} language={language} />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {nq.unit && (
                  <Badge variant="info" size="xs">
                    <BookOpen className="w-2.5 h-2.5" />
                    {typeof nq.unit === 'object' ? bText(nq.unit, language) : nq.unit}
                  </Badge>
                )}
                {nq.topic && (
                  <Badge variant="default" size="xs">
                    <MapPin className="w-2.5 h-2.5" />
                    {typeof nq.topic === 'object' ? bText(nq.topic, language) : nq.topic}
                  </Badge>
                )}
                {nq.chapter && (
                  <Badge variant="default" size="xs">
                    <FileText className="w-2.5 h-2.5" />
                    {typeof nq.chapter === 'object' ? bText(nq.chapter, language) : nq.chapter}
                  </Badge>
                )}
                {nq.difficulty && (
                  <Badge variant={nq.difficulty==='hard'?'danger':nq.difficulty==='medium'?'warning':'success'} size="xs">
                    {nq.difficulty}
                  </Badge>
                )}
                {nq.paper && <Badge variant="info" size="xs">{nq.paper}</Badge>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/* ═══ SECTION LABEL ═══ */
const SectionLabel = ({ icon: Icon, label, count, iconColor = 'text-blue-500' }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{label}</h4>
    {count !== undefined && (
      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400">
        {count}
      </span>
    )}
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
  </div>
);

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
const QuestionReports = ({ language: propLang, setLanguage: propSetLanguage }) => {
  const navigate = useNavigate();
  const [reports, setReports]               = useState([]);
  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [statsLoading, setStatsLoading]     = useState(true);
  const [pagination, setPagination]         = useState({ page:1, limit:15, total:0, pages:0 });
  const [filters, setFilters]               = useState({ status:'', priority:'', reportType:'', search:'' });
  const [expandedId, setExpandedId]         = useState(null);
  const [expandedData, setExpandedData]     = useState(null);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [fixResult, setFixResult]           = useState(null);
  const [deleting, setDeleting]             = useState(null);
  const [toast, setToast]                   = useState(null);
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [bulkAction, setBulkAction]         = useState('');
  const [showFilters, setShowFilters]       = useState(false);

  const language  = propLang || 'hi';
  const t = useCallback((hi, en) => language === 'hi' ? hi : en, [language]);
  const showToast = useCallback((msg, type='success') => setToast({ msg, type, k: Date.now() }), []);

  const loadReports = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const p = { page, limit: pagination.limit };
      if (filters.status)     p.status     = filters.status;
      if (filters.priority)   p.priority   = filters.priority;
      if (filters.reportType) p.reportType = filters.reportType;
      if (filters.search)     p.search     = filters.search;
      const res = await reportService.getReports(p);
      setReports(res.data || []);
      setPagination(res.pagination || { page, limit:15, total:0, pages:0 });
    } catch { showToast(t('लोड विफल','Failed to load'), 'error'); }
    finally { setLoading(false); }
  }, [filters, pagination.limit, showToast, t]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { const r = await reportService.getStats(); setStats(r.data); } catch {}
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadReports(1); }, [filters]);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); setExpandedData(null); return; }
    setExpandedId(id); setLoadingDetail(true); setExpandedData(null); setFixResult(null);
    try { const r = await reportService.getReportById(id); setExpandedData(r.data); }
    catch { showToast(t('विवरण लोड विफल','Failed'), 'error'); }
    finally { setLoadingDetail(false); }
  };

  const handleFix = async (reportId, updates) => {
    setSaving(true); setFixResult(null);
    try {
      const r = await reportService.fixQuestion(reportId, {
        questionUpdates: updates,
        resolution: 'Fixed via admin panel',
        autoTranslate: true,
        enableTextMatch: true,
      });
      setFixResult({ ok:true, data:r.data });
      showToast(t('प्रश्न ठीक हो गया!','Fixed successfully!'), 'success');
      loadReports(pagination.page); loadStats();
      try { const r2 = await reportService.getReportById(reportId); setExpandedData(r2.data); } catch {}
    } catch(e) {
      setFixResult({ ok:false, err:e.message });
      showToast(e.message || t('विफल','Failed'), 'error');
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await reportService.updateReport(id, { status });
      showToast(t('स्टेटस बदला','Updated'), 'info');
      loadReports(pagination.page); loadStats();
      if (expandedId===id) try { const r = await reportService.getReportById(id); setExpandedData(r.data); } catch {}
    } catch { showToast(t('विफल','Failed'), 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('हटाना चाहते हैं?','Delete this report?'))) return;
    setDeleting(id);
    try {
      await reportService.deleteReport(id);
      showToast(t('हटा दिया','Deleted'), 'warning');
      loadReports(pagination.page); loadStats();
      if (expandedId===id) { setExpandedId(null); setExpandedData(null); }
    } catch { showToast(t('विफल','Failed'), 'error'); }
    finally { setDeleting(null); }
  };

  const handleBulk = async () => {
    if (!bulkAction || !selectedReports.size) return;
    try {
      await reportService.bulkUpdateReports(Array.from(selectedReports), { status: bulkAction });
      showToast(t(`${selectedReports.size} अपडेट`,`${selectedReports.size} updated`), 'success');
      setSelectedReports(new Set()); setBulkAction('');
      loadReports(pagination.page); loadStats();
    } catch { showToast(t('विफल','Bulk failed'), 'error'); }
  };

  const toggleSelect = (id) => setSelectedReports(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const selectAll = () => setSelectedReports(prev =>
    prev.size === reports.length ? new Set() : new Set(reports.map(r => r._id))
  );

  const activeFilters = [filters.status, filters.priority, filters.reportType, filters.search].filter(Boolean).length;

  const getSortedTestQuestions = (tqs, reportedQId) => {
    if (!tqs?.length) return [];
    const rep=[], rest=[];
    tqs.forEach(q => (String(q._id)===String(reportedQId) ? rep : rest).push(q));
    return [...rep, ...rest];
  };

  const priorityConfig = {
    critical: { dot:'bg-red-500',    badge:'danger',   label:t('गंभीर','Critical') },
    high:     { dot:'bg-orange-500', badge:'warning',  label:t('उच्च','High') },
    medium:   { dot:'bg-amber-500',  badge:'warning',  label:t('मध्यम','Medium') },
    low:      { dot:'bg-slate-400',  badge:'default',  label:t('निम्न','Low') },
  };
  const statusConfig = {
    pending:     { badge:'warning', Icon:Clock,       label:t('लंबित','Pending') },
    reviewing:   { badge:'info',    Icon:Eye,          label:t('समीक्षा','Reviewing') },
    in_progress: { badge:'purple',  Icon:Activity,     label:t('प्रगति में','In Progress') },
    fixed:       { badge:'success', Icon:CheckCircle,  label:t('ठीक','Fixed') },
    rejected:    { badge:'danger',  Icon:XCircle,      label:t('अस्वीकृत','Rejected') },
  };

  return (
    <Layout language={language} setLanguage={propSetLanguage}>
      {() => (
        <div className="max-w-5xl mx-auto space-y-5 pb-10">
          <style>{RPT_CSS}</style>
          {toast && <Toast key={toast.k} message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between gap-4 rpt-fade">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                    <Bug className="w-4 h-4 text-white" />
                  </div>
                  {t('प्रश्न रिपोर्ट्स','Question Reports')}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 ml-10">
                  {t('उपयोगकर्ता-रिपोर्टेड समस्याओं की समीक्षा एवं समाधान','Review and resolve user-reported issues')}
                </p>
              </div>
            </div>
            <button onClick={() => { loadReports(1); loadStats(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {t('रिफ्रेश','Refresh')}
            </button>
          </div>

          {/* ── STATS ── */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl rpt-shimmer" />)}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 rpt-fade">
              <StatCard label={t('लंबित','Pending')} value={stats.pending} icon={Clock}
                colorClass="text-amber-600" gradientClass="bg-gradient-to-br from-amber-500 to-orange-600"
                active={filters.status==='pending'}
                onClick={() => setFilters(f => ({...f, status:f.status==='pending'?'':'pending'}))} />
              <StatCard label={t('समीक्षाधीन','Reviewing')} value={stats.reviewing} icon={Eye}
                colorClass="text-blue-600" gradientClass="bg-gradient-to-br from-blue-500 to-indigo-600"
                active={filters.status==='reviewing'}
                onClick={() => setFilters(f => ({...f, status:f.status==='reviewing'?'':'reviewing'}))} />
              <StatCard label={t('समाधानित','Fixed')} value={stats.fixed} icon={CheckCircle}
                colorClass="text-emerald-600" gradientClass="bg-gradient-to-br from-emerald-500 to-teal-600"
                active={filters.status==='fixed'}
                onClick={() => setFilters(f => ({...f, status:f.status==='fixed'?'':'fixed'}))} />
              <StatCard label={t('कुल','Total')} value={stats.total} icon={BarChart3}
                colorClass="text-slate-600" gradientClass="bg-gradient-to-br from-slate-600 to-slate-800"
                active={!filters.status}
                badge={`${stats.recentWeek||0} ${t('इस सप्ताह','this week')}`}
                onClick={() => setFilters(f => ({...f, status:''}))} />
            </div>
          )}

          {/* ── FILTER BAR ── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden rpt-fade">
            <div className="flex items-center gap-2 p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <input value={filters.search} onChange={e => setFilters(f => ({...f, search:e.target.value}))}
                  placeholder={t('रिपोर्ट खोजें...','Search reports...')}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                  ${showFilters||activeFilters
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}>
                <Filter className="w-3.5 h-3.5" />
                {t('फ़िल्टर','Filters')}
                {activeFilters>0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters?'rotate-180':''}`} />
              </button>
              {activeFilters>0 && (
                <button onClick={() => setFilters({status:'',priority:'',reportType:'',search:''})}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 dark:border-red-800/60 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  {t('रीसेट','Reset')}
                </button>
              )}
            </div>

            {showFilters && (
              <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700 rpt-expand">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
                  {[
                    {
                      label: t('स्टेटस','Status'), value: filters.status,
                      onChange: v => setFilters(f=>({...f,status:v})),
                      options: [
                        {value:'',label:t('सभी स्टेटस','All Statuses')},
                        {value:'pending',label:t('लंबित','Pending')},
                        {value:'reviewing',label:t('समीक्षाधीन','Reviewing')},
                        {value:'in_progress',label:t('प्रगति में','In Progress')},
                        {value:'fixed',label:t('समाधानित','Fixed')},
                        {value:'rejected',label:t('अस्वीकृत','Rejected')},
                      ]
                    },
                    {
                      label: t('प्राथमिकता','Priority'), value: filters.priority,
                      onChange: v => setFilters(f=>({...f,priority:v})),
                      options: [
                        {value:'',label:t('सभी','All Priorities')},
                        {value:'critical',label:t('गंभीर','Critical')},
                        {value:'high',label:t('उच्च','High')},
                        {value:'medium',label:t('मध्यम','Medium')},
                        {value:'low',label:t('निम्न','Low')},
                      ]
                    },
                    {
                      label: t('प्रकार','Type'), value: filters.reportType,
                      onChange: v => setFilters(f=>({...f,reportType:v})),
                      options: [
                        {value:'',label:t('सभी प्रकार','All Types')},
                        {value:'wrong_answer',label:t('गलत उत्तर','Wrong Answer')},
                        {value:'wrong_question',label:t('गलत प्रश्न','Wrong Question')},
                        {value:'wrong_options',label:t('गलत विकल्प','Wrong Options')},
                        {value:'explanation_error',label:t('व्याख्या त्रुटि','Explanation Error')},
                        {value:'typo',label:t('टाइपो','Typo')},
                        {value:'other',label:t('अन्य','Other')},
                      ]
                    },
                  ].map((sel,si) => (
                    <div key={si}>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{sel.label}</label>
                      <select value={sel.value} onChange={e=>sel.onChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        {sel.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── BULK BAR ── */}
          {selectedReports.size>0 && (
            <div className="sticky top-3 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-xl p-3 flex items-center gap-3" style={{animation:'rptFadeUp .22s ease-out'}}>
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                {selectedReports.size}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('चयनित','selected')}</span>
              <div className="flex items-center gap-2 ml-auto">
                <select value={bulkAction} onChange={e=>setBulkAction(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none">
                  <option value="">{t('कार्रवाई','Action')}</option>
                  <option value="reviewing">{t('समीक्षा','Reviewing')}</option>
                  <option value="fixed">{t('समाधानित','Fixed')}</option>
                  <option value="rejected">{t('अस्वीकृत','Rejected')}</option>
                </select>
                <button onClick={handleBulk} disabled={!bulkAction}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-colors">
                  {t('लागू','Apply')}
                </button>
                <button onClick={() => setSelectedReports(new Set())} className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── LIST ── */}
          <div className="space-y-2.5">
            {!loading && reports.length>0 && (
              <div className="flex items-center justify-between px-1">
                <button onClick={selectAll} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                    ${selectedReports.size===reports.length&&reports.length>0
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                    }`}>
                    {selectedReports.size===reports.length&&reports.length>0&&<Check className="w-2.5 h-2.5"/>}
                  </div>
                  {t('सभी','All')}
                </button>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {pagination.total} {t('रिपोर्ट','reports')}
                </span>
              </div>
            )}

            {loading ? (
              <div className="space-y-2.5">{[1,2,3,4,5].map(i=><SkeletonRow key={i}/>)}</div>
            ) : reports.length===0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('कोई रिपोर्ट नहीं','No Reports')}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t('सभी समस्याएं समाधानित हैं','All clear!')}</p>
              </div>
            ) : reports.map((rpt, idx) => {
              const isExp = expandedId===rpt._id;
              const isSel = selectedReports.has(rpt._id);
              const pc    = priorityConfig[rpt.priority] || priorityConfig.low;
              const sc    = statusConfig[rpt.status]   || statusConfig.pending;
              const SI    = sc.Icon;

              return (
                <div key={rpt._id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border-2 overflow-hidden transition-all duration-200
                    ${isExp ? 'border-blue-400 dark:border-blue-600 shadow-xl' : isSel ? 'border-blue-200 dark:border-blue-800 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'}
                    ${rpt.priority==='critical' ? 'ring-2 ring-red-200 dark:ring-red-900/40' : ''}`}
                  style={{animation:`rptFadeUp .3s cubic-bezier(.4,0,.2,1) ${idx*.04}s both`}}>

                  {rpt.priority==='critical' && <div className="h-0.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />}

                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    onClick={() => toggleExpand(rpt._id)}>
                    <button type="button" onClick={e=>{e.stopPropagation();toggleSelect(rpt._id);}}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}>
                      {isSel&&<Check className="w-2.5 h-2.5"/>}
                    </button>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pc.dot} ${rpt.priority==='critical'?'rpt-pulse':''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={sc.badge} size="xs"><SI className="w-2.5 h-2.5"/>{sc.label}</Badge>
                        <Badge variant={pc.badge} size="xs">
                          {rpt.priority==='critical'&&<Flame className="w-2.5 h-2.5"/>}{pc.label}
                        </Badge>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {reportService.getReportTypeLabel(rpt.reportType, language)}
                        </span>
                        {rpt.reportCount>1&&<Badge variant="danger" size="xs"><Users className="w-2.5 h-2.5"/>{rpt.reportCount}x</Badge>}
                        {rpt.affectedTestCount>0&&<Badge variant="warning" size="xs"><Zap className="w-2.5 h-2.5"/>{rpt.affectedTestCount} {t('टेस्ट','tests')}</Badge>}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate font-medium">{rpt.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <User className="w-2.5 h-2.5"/>{rpt.reporterName||t('अज्ञात','Anonymous')}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                          <Calendar className="w-2.5 h-2.5"/>
                          {new Date(rpt.createdAt).toLocaleDateString(language==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {rpt.status==='pending'&&(
                        <button type="button" onClick={e=>{e.stopPropagation();updateStatus(rpt._id,'reviewing');}}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors border border-blue-100 dark:border-blue-900/40">
                          <Eye className="w-3.5 h-3.5"/>
                        </button>
                      )}
                      <button type="button" onClick={e=>{e.stopPropagation();handleDelete(rpt._id);}}
                        className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors">
                        {deleting===rpt._id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Trash2 className="w-3.5 h-3.5"/>}
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"/>
                      <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isExp?'rotate-180':''}`}/>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExp && (
                    <div className="border-t-2 border-slate-100 dark:border-slate-700 rpt-expand">
                      <div className="px-4 py-4 space-y-5 bg-slate-50/60 dark:bg-slate-900/50">
                        {loadingDetail ? (
                          <div className="flex flex-col items-center py-10 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500"/>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{t('लोड हो रहा है...','Loading...')}</p>
                          </div>
                        ) : expandedData ? (
                          <>
                            {/* Fix Result */}
                            {fixResult && (
                              <div className={`p-4 rounded-xl border ${fixResult.ok?'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800':'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}
                                style={{animation:'rptBounce .35s ease-out'}}>
                                {fixResult.ok ? (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
                                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t('ठीक हो गया!','Fixed!')}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-emerald-600/80 dark:text-emerald-500/80">
                                      {fixResult.data?.testsUpdated>0&&<span>{fixResult.data.testsUpdated} {t('टेस्ट','tests')}</span>}
                                      {fixResult.data?.attemptsReEvaluated>0&&<span>{fixResult.data.attemptsReEvaluated} {t('री-इवैल','re-eval')}</span>}
                                      {fixResult.data?.answersChanged>0&&<span>{fixResult.data.answersChanged} {t('बदले','changed')}</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400"/>
                                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">{fixResult.err}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Report Description */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                              <SectionLabel icon={MessageSquare} label={t('रिपोर्ट विवरण','Report Details')} iconColor="text-blue-500"/>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{expandedData.description}</p>
                              {expandedData.suggestedCorrection && (
                                <div className="mt-3 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Wand2 className="w-3 h-3 text-blue-600 dark:text-blue-400"/>
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('सुझाव','Suggestion')}</span>
                                  </div>
                                  <p className="text-xs text-blue-800 dark:text-blue-300">{expandedData.suggestedCorrection}</p>
                                </div>
                              )}
                              {expandedData.screenshots?.length>0&&<Screenshots items={expandedData.screenshots}/>}
                            </div>

                            {/* Questions */}
                            {(() => {
                              const sorted   = getSortedTestQuestions(expandedData.testQuestions, rpt.questionId);
                              const hasQ     = sorted.length>0;
                              const hasCurr  = !!expandedData.currentQuestion;

                              if (!hasQ && hasCurr) return (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                  <SectionLabel icon={Target} label={t('रिपोर्टेड प्रश्न','Reported Question')} iconColor="text-red-500"/>
                                  <QuestionCard
                                    question={expandedData.currentQuestion}
                                    index={expandedData.questionIndex||0}
                                    isReported language={language} isOpenDefault
                                    onFixSave={u=>handleFix(expandedData._id,u)} saving={saving}
                                  />
                                </div>
                              );

                              if (!hasQ) return null;

                              return (
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                  <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
                                    <SectionLabel icon={Layers} label={t('टेस्ट प्रश्न','Test Questions')} count={sorted.length} iconColor="text-indigo-500"/>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2">{t('रिपोर्टेड पहले','Reported first')}</p>
                                  </div>
                                  <div className="p-3 space-y-2 max-h-[640px] overflow-y-auto rpt-scroll">
                                    {sorted.map((tq,i) => {
                                      const isThis = String(tq._id)===String(rpt.questionId);
                                      return (
                                        <QuestionCard key={tq._id||i}
                                          question={tq} index={i} isReported={isThis}
                                          language={language} isOpenDefault={isThis}
                                          onFixSave={u=>handleFix(expandedData._id,u)} saving={saving}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Affected Tests */}
                            {expandedData.affectedTests?.length>0 && (
                              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                <SectionLabel icon={Zap} label={t('प्रभावित टेस्ट','Affected Tests')} count={expandedData.affectedTests.length} iconColor="text-amber-500"/>
                                <div className="space-y-1.5">
                                  {expandedData.affectedTests.map(ts => (
                                    <div key={ts._id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{ts.title}</span>
                                      <Badge variant="default" size="xs">{ts.testType}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            {['pending','reviewing','in_progress'].includes(expandedData.status) && (
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                {expandedData.status!=='reviewing'&&(
                                  <button type="button" onClick={()=>updateStatus(rpt._id,'reviewing')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm">
                                    <Eye className="w-3.5 h-3.5"/>{t('समीक्षा','Review')}
                                  </button>
                                )}
                                <button type="button" onClick={()=>updateStatus(rpt._id,'rejected')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                                  <XCircle className="w-3.5 h-3.5"/>{t('अस्वीकृत','Reject')}
                                </button>
                                <button type="button" onClick={()=>handleDelete(rpt._id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 hover:border-red-200 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5"/>{t('हटाएं','Delete')}
                                </button>
                              </div>
                            )}

                            {expandedData.status==='fixed' && (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                                  <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{t('समाधानित','Resolved')}</p>
                                  {expandedData.fixedAt&&<p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">{new Date(expandedData.fixedAt).toLocaleString(language==='hi'?'hi-IN':'en-IN')}</p>}
                                </div>
                              </div>
                            )}

                            {expandedData.status==='rejected' && (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400"/>
                                </div>
                                <p className="text-sm font-bold text-red-700 dark:text-red-400">{t('अस्वीकृत','Rejected')}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center py-10 gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400"/>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('लोड विफल','Load failed')}</p>
                            <button onClick={()=>toggleExpand(rpt._id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              {t('पुनः प्रयास','Retry')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── PAGINATION ── */}
          {pagination.pages>1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={pagination.page<=1} onClick={()=>loadReports(pagination.page-1)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400"/>
              </button>
              {Array.from({length:Math.min(pagination.pages,5)},(_,i) => {
                let pg;
                if(pagination.pages<=5) pg=i+1;
                else if(pagination.page<=3) pg=i+1;
                else if(pagination.page>=pagination.pages-2) pg=pagination.pages-4+i;
                else pg=pagination.page-2+i;
                return (
                  <button key={pg} onClick={()=>loadReports(pg)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all
                      ${pagination.page===pg ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    {pg}
                  </button>
                );
              })}
              <button disabled={pagination.page>=pagination.pages} onClick={()=>loadReports(pagination.page+1)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400"/>
              </button>
            </div>
          )}

          {!loading && pagination.total>0 && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-2 font-medium">
              {(pagination.page-1)*pagination.limit+1}–{Math.min(pagination.page*pagination.limit,pagination.total)} {t('में से','of')} {pagination.total} {t('रिपोर्ट','reports')}
            </p>
          )}
        </div>
      )}
    </Layout>
  );
};

export default QuestionReports;