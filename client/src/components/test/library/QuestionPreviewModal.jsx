// client/src/components/test/library/QuestionPreviewModal.jsx
// ════════════════════════════════════════════════════════
// EXTREME v3.0 — Full question rendering + DARK MODE
// ════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Eye, CheckCircle2, XCircle, BookOpen, Target, Tag,
  Hash, Calendar, Star, Languages, Copy, ChevronDown, ChevronUp,
  BarChart2, Table2, PieChart as PieChartIcon, TrendingUp,
  FileText, AlertCircle, Sparkles, Award, Clock, Layers,
  ArrowRight, Shield, Activity, Info, Zap
} from 'lucide-react';
import {
  getBilingualText, getBilingualArray, getOptionLabel,
  getRomanNumeral, formatDate, getRelativeTime
} from '../../../utils/helpers';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, CHART_COLORS } from '../../../utils/constants';

// ═══ Quality Score Calculator ═══
const calcQuality = (q) => {
  if (!q) return { score: 0, issues: [] };
  let s = 0;
  const issues = [];
  const qText = q.question;
  const hasHi = !!(qText?.hi || q.assertionReasonData?.assertion?.hi || q.questionTextHi);
  const hasEn = !!(qText?.en || q.assertionReasonData?.assertion?.en || q.questionTextEn);
  if (hasHi) s += 15; else issues.push('No Hindi');
  if (hasEn) s += 15; else issues.push('No English');
  const opts = q.options;
  const optHi = Array.isArray(opts?.hi) ? opts.hi.filter(o => o?.trim()).length : Array.isArray(opts) ? opts.filter(o => o?.trim()).length : 0;
  const optEn = Array.isArray(opts?.en) ? opts.en.filter(o => o?.trim()).length : 0;
  if (optHi >= 4 || optEn >= 4) s += 20; else if (optHi >= 2 || optEn >= 2) s += 10; else issues.push('Missing options');
  if (q.correctAnswer !== null && q.correctAnswer !== undefined) s += 10; else issues.push('No answer');
  if (q.explanation?.hi || q.explanation?.en || q.explanationHi || q.explanationEn) s += 15; else issues.push('No explanation');
  if (q.chapter || q.chapterHi) s += 5;
  if (q.topic || q.topicHi) s += 5;
  if (q.difficulty) s += 5;
  if (q.source) s += 3;
  if (q.tags?.length) s += 2;
  const t = q.questionType;
  if (t === 'assertion_reason') {
    if (q.assertionReasonData?.assertion?.hi || q.assertionReasonData?.assertion?.en) s += 5;
    if (q.assertionReasonData?.reason?.hi || q.assertionReasonData?.reason?.en) s += 5;
  } else if (t === 'match_following') {
    if ((q.matchData?.listA?.hi?.length || 0) >= 2) s += 5;
    if ((q.matchData?.listB?.hi?.length || 0) >= 2) s += 5;
  } else if (t === 'statement_based') {
    if ((q.statementData?.statements?.hi?.length || 0) >= 2) s += 10;
  } else if (t === 'sequence_order') {
    if ((q.sequenceData?.items?.hi?.length || 0) >= 2) s += 10;
  } else { s += 5; }
  return { score: Math.min(100, s), issues };
};

// ═══ Quality Ring ═══
const QualityRing = ({ score, size = 48 }) => {
  const r = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          className="text-gray-200 dark:text-secondary-700" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

// ═══ Difficulty Badge ═══
const DiffBadge = ({ difficulty, language }) => {
  const cfg = {
    easy: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: Sparkles,
      label: { hi: 'आसान', en: 'Easy' }
    },
    medium: {
      bg: 'bg-amber-100 dark:bg-amber-900/40',
      text: 'text-amber-700 dark:text-amber-300',
      icon: Activity,
      label: { hi: 'मध्यम', en: 'Medium' }
    },
    hard: {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-700 dark:text-red-300',
      icon: Zap,
      label: { hi: 'कठिन', en: 'Hard' }
    }
  }[difficulty] || {
    bg: 'bg-gray-100 dark:bg-secondary-700',
    text: 'text-gray-600 dark:text-secondary-300',
    icon: Activity,
    label: { hi: difficulty, en: difficulty }
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />{language === 'hi' ? cfg.label.hi : cfg.label.en}
    </span>
  );
};

// ═══ Type Badge ═══
const TypeBadge = ({ type, language }) => {
  const colors = {
    mcq: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    assertion_reason: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    match_following: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    sequence_order: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    statement_based: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    passage_based: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    di_table: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    di_bar_chart: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    di_pie_chart: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    di_line_graph: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    di_caselet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${colors[type] || 'bg-gray-100 text-gray-700 dark:bg-secondary-700 dark:text-secondary-300'}`}>
      {QUESTION_TYPE_LABELS[type]?.[language] || type}
    </span>
  );
};

// ════════════════════════════════════════
// ★ MAIN PREVIEW MODAL ★
// ════════════════════════════════════════
const QuestionPreviewModal = ({ question, isOpen, onClose, language = 'hi' }) => {
  const [showLang, setShowLang] = useState(language);
  const [showAnswer, setShowAnswer] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  const t = (h, e) => showLang === 'hi' ? h : e;

  const quality = useMemo(() => calcQuality(question), [question]);

  if (!isOpen || !question) return null;

  const q = question;
  const qType = q.questionType || 'mcq';
  const qText = getBilingualText(q.question, showLang);
  const correctAnswer = q.correctAnswer;
  const explanation = getBilingualText(q.explanation, showLang);

  // ═══ Get options based on type ═══
  const getOptions = () => {
    const opts = q.options;
    if (!opts) return [];
    if (Array.isArray(opts)) return opts;
    if (typeof opts === 'object') {
      const langOpts = opts[showLang] || opts.hi || opts.en || [];
      return Array.isArray(langOpts) ? langOpts : [];
    }
    return [];
  };

  const options = getOptions();

  // ═══ Render Question Content by Type ═══
  const renderQuestionBody = () => {
    switch (qType) {
      case 'assertion_reason': {
        const assertion = getBilingualText(q.assertionReasonData?.assertion, showLang);
        const reason = getBilingualText(q.assertionReasonData?.reason, showLang);
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-secondary-400 font-medium">
              {t('निम्नलिखित दो कथनों पर विचार करें:', 'Consider the following two statements:')}
            </p>
            <div className="rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800">
              <div className="px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">A</span>
                {t('अभिकथन (A)', 'Assertion (A)')}
              </div>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 text-sm text-gray-800 dark:text-blue-100 leading-relaxed">
                {assertion || <span className="text-gray-400 dark:text-secondary-500 italic">{t('अभिकथन उपलब्ध नहीं', 'Assertion not available')}</span>}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
              <div className="px-3 py-1.5 bg-emerald-600 dark:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">R</span>
                {t('कारण (R)', 'Reason (R)')}
              </div>
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 text-sm text-gray-800 dark:text-emerald-100 leading-relaxed">
                {reason || <span className="text-gray-400 dark:text-secondary-500 italic">{t('कारण उपलब्ध नहीं', 'Reason not available')}</span>}
              </div>
            </div>
          </div>
        );
      }

      case 'match_following': {
        const listA = getBilingualArray(q.matchData?.listA, showLang);
        const listB = getBilingualArray(q.matchData?.listB, showLang);
        return (
          <div className="space-y-3">
            {qText && <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed font-medium">{qText}</p>}
            <div className="overflow-x-auto rounded-xl border-2 border-gray-300 dark:border-secondary-600">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 dark:bg-secondary-900 text-white">
                    <th className="px-4 py-2 text-left font-bold border-r border-gray-700 dark:border-secondary-700 w-1/2">
                      {t('सूची-I', 'List-I')}
                    </th>
                    <th className="px-4 py-2 text-left font-bold w-1/2">
                      {t('सूची-II', 'List-II')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listA.map((a, i) => (
                    <tr key={i} className={`${i % 2 === 0
                      ? 'bg-white dark:bg-secondary-800'
                      : 'bg-gray-50 dark:bg-secondary-800/50'
                      } border-t border-gray-200 dark:border-secondary-700`}>
                      <td className="px-4 py-2.5 border-r border-gray-200 dark:border-secondary-700">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                            {getOptionLabel(i)}
                          </span>
                          <span className="text-gray-800 dark:text-secondary-200">{a}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {getRomanNumeral(i)}
                          </span>
                          <span className="text-gray-800 dark:text-secondary-200">{listB[i] || ''}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'sequence_order': {
        const items = getBilingualArray(q.sequenceData?.items, showLang);
        const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-800 dark:text-secondary-200 font-medium leading-relaxed">
              {qText || t('निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:', 'Arrange in correct order:')}
            </p>
            <div className="bg-gray-50 dark:bg-secondary-800/50 rounded-xl border border-gray-200 dark:border-secondary-700 p-3 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-700 shadow-sm">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    {roman[i] || i + 1}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pt-0.5">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'statement_based': {
        const stmts = getBilingualArray(q.statementData?.statements, showLang);
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-800 dark:text-secondary-200 font-medium leading-relaxed">
              {qText || t('निम्नलिखित कथनों पर विचार कीजिए:', 'Consider the following statements:')}
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 space-y-2">
              {stmts.map((st, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-secondary-800 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow-sm">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pt-0.5">{st}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'passage_based': {
        const passage = getBilingualText(q.passageId?.content, showLang);
        const passageTitle = q.passageId?.title || '';
        return (
          <div className="space-y-3">
            {passage && (
              <div className="rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800">
                <div className="px-3 py-1.5 bg-teal-600 dark:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {passageTitle || t('गद्यांश', 'Passage')}
                </div>
                <div className="px-4 py-3 bg-teal-50 dark:bg-teal-950/30 text-sm text-gray-800 dark:text-teal-100 leading-[1.7] max-h-48 overflow-y-auto scrollbar-thin">
                  {passage}
                </div>
              </div>
            )}
            {!passage && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t('गद्यांश लोड नहीं हुआ', 'Passage not loaded')}
              </div>
            )}
            {qText && <p className="text-sm text-gray-800 dark:text-secondary-200 font-medium leading-relaxed">{qText}</p>}
          </div>
        );
      }

      default:
        return qText ? (
          <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed font-medium">{qText}</p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-secondary-500 italic">
            {t('प्रश्न टेक्स्ट उपलब्ध नहीं', 'Question text not available')}
          </p>
        );
    }
  };

  // ═══ Render Options with Correct Answer ═══
  const renderOptions = () => {
    if (!options || options.length === 0) {
      return (
        <div className="p-3 bg-gray-50 dark:bg-secondary-800 rounded-xl text-center text-sm text-gray-400 dark:text-secondary-500">
          {t('विकल्प उपलब्ध नहीं', 'No options available')}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          {t('विकल्प', 'OPTIONS')}
        </h4>
        <div className="space-y-1.5">
          {options.map((opt, i) => {
            const isCorrect = correctAnswer === i;
            const optText = typeof opt === 'string' ? opt : '';
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all
                ${showAnswer && isCorrect
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                  : 'border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:border-gray-300 dark:hover:border-secondary-600'
                }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black transition-all
                  ${showAnswer && isCorrect
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400'
                  }`}>
                  {showAnswer && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 pt-1">
                  <span className={`text-sm leading-relaxed ${showAnswer && isCorrect
                    ? 'text-emerald-800 dark:text-emerald-200 font-semibold'
                    : 'text-gray-700 dark:text-secondary-300'
                    }`}>
                    {optText || <span className="text-gray-400 dark:text-secondary-500 italic">{t('खाली विकल्प', 'Empty option')}</span>}
                  </span>
                </div>
                {showAnswer && isCorrect && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex-shrink-0 mt-1">
                    ✓ {t('सही', 'Correct')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Paper info
  const paperLabel = q.paper === 'paper1' ? 'Paper 1' : q.paper === 'paper2' ? 'Paper 2' : q.paper || '';

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-secondary-700"
        onClick={e => e.stopPropagation()}
      >
        {/* ═══ HEADER ═══ */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-secondary-700 bg-gradient-to-r from-slate-50 via-white to-blue-50 dark:from-secondary-800 dark:via-secondary-900 dark:to-secondary-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 dark:text-white leading-tight">
                  {t('प्रश्न पूर्वावलोकन', 'Question Preview')}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300 rounded font-bold">
                    #{q.questionNumber || '?'}
                  </span>
                  {paperLabel && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-bold">
                      {paperLabel}
                    </span>
                  )}
                  <DiffBadge difficulty={q.difficulty} language={showLang} />
                  <TypeBadge type={qType} language={showLang} />
                  {q.isPYQ && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />PYQ {q.year || ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <QualityRing score={quality.score} size={40} />
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ TOOLBAR ═══ */}
        <div className="px-5 py-2 border-b border-gray-100 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-800/50 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Syllabus path */}
            {(q.paper || q.unit || q.chapter) && (
              <div className="flex items-center gap-1.5 text-[10px]">
                {q.paper && (
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-bold flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {q.paper === 'paper1' ? 'P1' : 'P2'}
                  </span>
                )}
                {q.unit && (
                  <>
                    <ArrowRight className="w-3 h-3 text-gray-400 dark:text-secondary-600" />
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold truncate max-w-[120px]">
                      {q.unit}
                    </span>
                  </>
                )}
                {q.chapter && (
                  <>
                    <ArrowRight className="w-3 h-3 text-gray-400 dark:text-secondary-600" />
                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-semibold truncate max-w-[100px]">
                      {q.chapter}
                    </span>
                  </>
                )}
                {q.topic && (
                  <>
                    <ArrowRight className="w-3 h-3 text-gray-400 dark:text-secondary-600" />
                    <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-semibold truncate max-w-[80px]">
                      {q.topic}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <div className="flex bg-gray-200 dark:bg-secondary-700 rounded-lg p-0.5">
              {[{ k: 'hi', l: 'हि' }, { k: 'en', l: 'En' }].map(l => (
                <button
                  key={l.k}
                  type="button"
                  onClick={() => setShowLang(l.k)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all
                    ${showLang === l.k
                      ? 'bg-white dark:bg-secondary-600 shadow-sm text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-secondary-400 hover:text-gray-700 dark:hover:text-secondary-300'
                    }`}
                >
                  {l.l}
                </button>
              ))}
            </div>
            {/* Show/hide answer */}
            <button
              type="button"
              onClick={() => setShowAnswer(!showAnswer)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1
                ${showAnswer
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-300 dark:border-secondary-600 text-gray-600 dark:text-secondary-400 hover:bg-gray-50 dark:hover:bg-secondary-700'
                }`}
            >
              {showAnswer ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {t('उत्तर', 'Answer')}
            </button>
            {/* Meta toggle */}
            <button
              type="button"
              onClick={() => setShowMeta(!showMeta)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1
                ${showMeta
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-secondary-600 text-gray-600 dark:text-secondary-400 hover:bg-gray-50 dark:hover:bg-secondary-700'
                }`}
            >
              <Info className="w-3 h-3" />{t('विवरण', 'Meta')}
            </button>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white dark:bg-secondary-900">
          {/* Question Section */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t('प्रश्न', 'QUESTION')}
            </h4>
            <div className="p-4 bg-white dark:bg-secondary-800 border-2 border-gray-200 dark:border-secondary-700 rounded-2xl">
              {renderQuestionBody()}
            </div>
          </div>

          {/* Options Section */}
          {renderOptions()}

          {/* Explanation */}
          {showAnswer && (explanation || q.explanationHi || q.explanationEn) && (
            <div>
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 mb-2"
              >
                {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {t('व्याख्या', 'EXPLANATION')}
              </button>
              {showExplanation && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {explanation || getBilingualText({ hi: q.explanationHi, en: q.explanationEn }, showLang) || t('व्याख्या उपलब्ध नहीं', 'No explanation available')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quality Issues */}
          {quality.issues.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('गुणवत्ता सुझाव', 'Quality Suggestions')} ({quality.score}%)
              </p>
              <div className="flex flex-wrap gap-1">
                {quality.issues.map((issue, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 rounded-full font-semibold">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Panel */}
          {showMeta && (
            <div className="p-4 bg-gray-50 dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />{t('मेटाडेटा', 'METADATA')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'ID', value: q._id?.slice(-12) || '—' },
                  { label: t('Q#', 'Q#'), value: q.questionNumber || '—' },
                  { label: t('पेपर', 'Paper'), value: paperLabel || '—' },
                  { label: t('प्रकार', 'Type'), value: QUESTION_TYPE_LABELS[qType]?.[showLang] || qType },
                  { label: t('कठिनाई', 'Difficulty'), value: DIFFICULTY_LABELS[q.difficulty]?.[showLang] || q.difficulty || '—' },
                  { label: t('इकाई', 'Unit'), value: q.unit || '—' },
                  { label: t('अध्याय', 'Chapter'), value: q.chapter || '—' },
                  { label: t('विषय', 'Topic'), value: q.topic || '—' },
                  { label: t('स्रोत', 'Source'), value: q.source || '—' },
                  { label: t('वर्ष', 'Year'), value: q.year || '—' },
                  { label: t('बनाया', 'Created'), value: q.createdAt ? formatDate(q.createdAt) : '—' },
                  { label: t('प्रयास', 'Attempts'), value: q.timesAttempted || 0 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5 px-2 bg-white dark:bg-secondary-900 rounded-lg">
                    <span className="text-gray-500 dark:text-secondary-500">{item.label}</span>
                    <span className="font-bold text-gray-800 dark:text-secondary-200 truncate max-w-[120px]" title={String(item.value)}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              {q.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {q.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-200 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300 rounded-full text-[10px] font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Language availability */}
              <div className="flex items-center gap-3 pt-1">
                <Languages className="w-4 h-4 text-gray-400 dark:text-secondary-500" />
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${q.question?.hi
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}>
                  {q.question?.hi ? '✓' : '✗'} हिंदी
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${q.question?.en
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}>
                  {q.question?.en ? '✓' : '✗'} English
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-secondary-700 bg-gray-50 dark:bg-secondary-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-secondary-500">
            {q.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{getRelativeTime(q.createdAt)}
              </span>
            )}
            {q.timesAttempted > 0 && (
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />{q.timesAttempted} {t('प्रयास', 'attempts')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 dark:bg-primary-600 hover:bg-gray-800 dark:hover:bg-primary-500 text-white rounded-xl font-bold text-sm shadow-lg transition-all"
          >
            {t('बंद करें', 'Close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuestionPreviewModal;