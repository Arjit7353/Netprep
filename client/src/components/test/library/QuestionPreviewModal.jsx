// client/src/components/test/library/QuestionPreviewModal.jsx
// ════════════════════════════════════════════════════════
// EXTREME v3.0 — Full question rendering in preview
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
  // Type-specific
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
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
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
    easy: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Sparkles, label: { hi: 'आसान', en: 'Easy' } },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Activity, label: { hi: 'मध्यम', en: 'Medium' } },
    hard: { bg: 'bg-red-100', text: 'text-red-700', icon: Zap, label: { hi: 'कठिन', en: 'Hard' } }
  }[difficulty] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: Activity, label: { hi: difficulty, en: difficulty } };
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
    mcq: 'bg-blue-100 text-blue-700',
    assertion_reason: 'bg-purple-100 text-purple-700',
    match_following: 'bg-green-100 text-green-700',
    sequence_order: 'bg-orange-100 text-orange-700',
    statement_based: 'bg-pink-100 text-pink-700',
    passage_based: 'bg-teal-100 text-teal-700',
    di_table: 'bg-indigo-100 text-indigo-700',
    di_bar_chart: 'bg-cyan-100 text-cyan-700',
    di_pie_chart: 'bg-rose-100 text-rose-700',
    di_line_graph: 'bg-emerald-100 text-emerald-700',
    di_caselet: 'bg-violet-100 text-violet-700'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
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
            <p className="text-sm text-gray-600 font-medium">
              {t('निम्नलिखित दो कथनों पर विचार करें:', 'Consider the following two statements:')}
            </p>
            <div className="rounded-xl overflow-hidden border border-blue-200">
              <div className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">A</span>
                {t('अभिकथन (A)', 'Assertion (A)')}
              </div>
              <div className="px-4 py-3 bg-blue-50 text-sm text-gray-800 leading-relaxed">
                {assertion || <span className="text-gray-400 italic">{t('अभिकथन उपलब्ध नहीं', 'Assertion not available')}</span>}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-emerald-200">
              <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">R</span>
                {t('कारण (R)', 'Reason (R)')}
              </div>
              <div className="px-4 py-3 bg-emerald-50 text-sm text-gray-800 leading-relaxed">
                {reason || <span className="text-gray-400 italic">{t('कारण उपलब्ध नहीं', 'Reason not available')}</span>}
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
            {qText && <p className="text-sm text-gray-800 leading-relaxed font-medium">{qText}</p>}
            <div className="overflow-x-auto rounded-xl border-2 border-gray-300">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="px-4 py-2 text-left font-bold border-r border-gray-700 w-1/2">{t('सूची-I', 'List-I')}</th>
                    <th className="px-4 py-2 text-left font-bold w-1/2">{t('सूची-II', 'List-II')}</th>
                  </tr>
                </thead>
                <tbody>
                  {listA.map((a, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t border-gray-200`}>
                      <td className="px-4 py-2.5 border-r border-gray-200">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                            {getOptionLabel(i)}
                          </span>
                          <span>{a}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {getRomanNumeral(i)}
                          </span>
                          <span>{listB[i] || ''}</span>
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
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              {qText || t('निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:', 'Arrange in correct order:')}
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    {roman[i] || i + 1}
                  </span>
                  <span className="text-sm text-gray-800 leading-relaxed pt-0.5">{item}</span>
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
            <p className="text-sm text-gray-800 font-medium leading-relaxed">
              {qText || t('निम्नलिखित कथनों पर विचार कीजिए:', 'Consider the following statements:')}
            </p>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 space-y-2">
              {stmts.map((st, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-amber-200 shadow-sm">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-800 leading-relaxed pt-0.5">{st}</span>
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
              <div className="rounded-xl overflow-hidden border border-teal-200">
                <div className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {passageTitle || t('गद्यांश', 'Passage')}
                </div>
                <div className="px-4 py-3 bg-teal-50 text-sm text-gray-800 leading-[1.7] max-h-48 overflow-y-auto scrollbar-thin">
                  {passage}
                </div>
              </div>
            )}
            {!passage && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t('गद्यांश लोड नहीं हुआ', 'Passage not loaded')}
              </div>
            )}
            {qText && <p className="text-sm text-gray-800 font-medium leading-relaxed">{qText}</p>}
          </div>
        );
      }

      default:
        return qText ? (
          <p className="text-sm text-gray-800 leading-relaxed font-medium">{qText}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">{t('प्रश्न टेक्स्ट उपलब्ध नहीं', 'Question text not available')}</p>
        );
    }
  };

  // ═══ Render Options with Correct Answer ═══
  const renderOptions = () => {
    if (!options || options.length === 0) {
      return (
        <div className="p-3 bg-gray-50 rounded-xl text-center text-sm text-gray-400">
          {t('विकल्प उपलब्ध नहीं', 'No options available')}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
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
                  ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-500/10'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black transition-all
                  ${showAnswer && isCorrect
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                  {showAnswer && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1 pt-1">
                  <span className={`text-sm leading-relaxed ${showAnswer && isCorrect ? 'text-emerald-800 font-semibold' : 'text-gray-700'}`}>
                    {optText || <span className="text-gray-400 italic">{t('खाली विकल्प', 'Empty option')}</span>}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={e => e.stopPropagation()}>

        {/* ═══ HEADER ═══ */}
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 leading-tight">{t('प्रश्न पूर्वावलोकन', 'Question Preview')}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-bold">
                    #{q.questionNumber || '?'}
                  </span>
                  {paperLabel && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">{paperLabel}</span>
                  )}
                  <DiffBadge difficulty={q.difficulty} language={showLang} />
                  <TypeBadge type={qType} language={showLang} />
                  {q.isPYQ && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />PYQ {q.year || ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <QualityRing score={quality.score} size={40} />
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ TOOLBAR ═══ */}
        <div className="px-5 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Syllabus path */}
            {(q.paper || q.unit || q.chapter) && (
              <div className="flex items-center gap-1.5 text-[10px]">
                {q.paper && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold flex items-center gap-1"><BookOpen className="w-3 h-3" />{q.paper === 'paper1' ? 'P1' : 'P2'}</span>}
                {q.unit && <><ArrowRight className="w-3 h-3 text-gray-400" /><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold truncate max-w-[120px]">{q.unit}</span></>}
                {q.chapter && <><ArrowRight className="w-3 h-3 text-gray-400" /><span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg font-semibold truncate max-w-[100px]">{q.chapter}</span></>}
                {q.topic && <><ArrowRight className="w-3 h-3 text-gray-400" /><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg font-semibold truncate max-w-[80px]">{q.topic}</span></>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <div className="flex bg-gray-200 rounded-lg p-0.5">
              {[{ k: 'hi', l: 'हि' }, { k: 'en', l: 'En' }].map(l => (
                <button key={l.k} type="button" onClick={() => setShowLang(l.k)}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${showLang === l.k ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}>
                  {l.l}
                </button>
              ))}
            </div>
            {/* Show/hide answer */}
            <button type="button" onClick={() => setShowAnswer(!showAnswer)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1
                ${showAnswer ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-600'}`}>
              {showAnswer ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {t('उत्तर', 'Answer')}
            </button>
            {/* Meta toggle */}
            <button type="button" onClick={() => setShowMeta(!showMeta)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1
                ${showMeta ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600'}`}>
              <Info className="w-3 h-3" />{t('विवरण', 'Meta')}
            </button>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Question Section */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {t('प्रश्न', 'QUESTION')}
            </h4>
            <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
              {renderQuestionBody()}
            </div>
          </div>

          {/* Options Section */}
          {renderOptions()}

          {/* Explanation */}
          {showAnswer && (explanation || q.explanationHi || q.explanationEn) && (
            <div>
              <button type="button" onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-2">
                {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {t('व्याख्या', 'EXPLANATION')}
              </button>
              {showExplanation && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {explanation || getBilingualText({ hi: q.explanationHi, en: q.explanationEn }, showLang) || t('व्याख्या उपलब्ध नहीं', 'No explanation available')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quality Issues */}
          {quality.issues.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-[10px] font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {t('गुणवत्ता सुझाव', 'Quality Suggestions')} ({quality.score}%)
              </p>
              <div className="flex flex-wrap gap-1">
                {quality.issues.map((issue, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-semibold">{issue}</span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Panel */}
          {showMeta && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
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
                  <div key={i} className="flex justify-between py-1.5 px-2 bg-white rounded-lg">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-bold text-gray-800 truncate max-w-[120px]" title={String(item.value)}>{item.value}</span>
                  </div>
                ))}
              </div>
              {q.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {q.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[10px] font-semibold">{tag}</span>
                  ))}
                </div>
              )}

              {/* Language availability */}
              <div className="flex items-center gap-3 pt-1">
                <Languages className="w-4 h-4 text-gray-400" />
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${q.question?.hi ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {q.question?.hi ? '✓' : '✗'} हिंदी
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${q.question?.en ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {q.question?.en ? '✓' : '✗'} English
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
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
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow-lg transition-all">
            {t('बंद करें', 'Close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuestionPreviewModal;