// client/src/components/question/QuestionCard.jsx
// ════════════════════════════════════════════════════════
// EXTREME ADVANCED v3.0
// — Edit button, Test usage tracking, Quality score
// — Inline actions, Copy ID, Verification, Analytics
// ════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Edit2, Trash2, Eye, MoreVertical, CheckCircle, Clock, Tag,
  BookOpen, BarChart2, Table, PieChart, TrendingUp, FileText,
  Loader, Copy, ExternalLink, Star, AlertTriangle, Shield,
  ChevronDown, ChevronUp, Hash, Activity, Zap, Award,
  ClipboardList, Info, Flag, CheckCircle2, XCircle,
  Languages, Layers, Target, Sparkles, BarChart3
} from 'lucide-react';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import { getBilingualText, formatDate, getQuestionTypeColor, getDifficultyColor, getRelativeTime } from '../../utils/helpers';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import questionService from '../../services/questionService';

import MCQQuestion from './QuestionTypes/MCQQuestion';
import AssertionReason from './QuestionTypes/AssertionReason';
import MatchFollowing from './QuestionTypes/MatchFollowing';
import SequenceOrder from './QuestionTypes/SequenceOrder';
import StatementBased from './QuestionTypes/StatementBased';
import PassageQuestion from './QuestionTypes/PassageQuestion';
import DITableChart from './QuestionTypes/DITableChart';
import DIBarChart from './QuestionTypes/DIBarChart';
import DIPieChart from './QuestionTypes/DIPieChart';
import DILineGraph from './QuestionTypes/DILineGraph';
import DICaselet from './QuestionTypes/DICaselet';

// ═══ Quality Score Calculator ═══
const calculateQuality = (q) => {
  let score = 0, issues = [];
  if (q.question?.hi) score += 15; else issues.push('No Hindi text');
  if (q.question?.en) score += 15; else issues.push('No English text');
  const optHi = q.options?.hi?.filter(o => o && o.trim())?.length || 0;
  const optEn = q.options?.en?.filter(o => o && o.trim())?.length || 0;
  if (optHi >= 4) score += 10; else if (q.questionType === 'mcq') issues.push(`Only ${optHi} Hindi options`);
  if (optEn >= 4) score += 10; else if (q.questionType === 'mcq') issues.push(`Only ${optEn} English options`);
  if (q.correctAnswer !== null && q.correctAnswer !== undefined) score += 10;
  else issues.push('No correct answer');
  if (q.explanation?.hi) score += 8; else issues.push('No Hindi explanation');
  if (q.explanation?.en) score += 7; else issues.push('No English explanation');
  if (q.chapter) score += 5; else issues.push('No chapter');
  if (q.topic) score += 5; else issues.push('No topic');
  if (q.difficulty) score += 3;
  if (q.tags?.length > 0) score += 2;
  if (q.source) score += 3;
  // Type-specific
  if (q.questionType === 'assertion_reason') {
    if (q.assertionReasonData?.assertion?.hi || q.assertionReasonData?.assertion?.en) score += 5;
    if (q.assertionReasonData?.reason?.hi || q.assertionReasonData?.reason?.en) score += 5;
  } else if (q.questionType === 'match_following') {
    if ((q.matchData?.listA?.hi?.length || 0) >= 2) score += 5;
    if ((q.matchData?.listB?.hi?.length || 0) >= 2) score += 5;
  } else if (q.questionType === 'statement_based') {
    if ((q.statementData?.statements?.hi?.length || 0) >= 2) score += 10;
  } else if (q.questionType === 'sequence_order') {
    if ((q.sequenceData?.items?.hi?.length || 0) >= 2) score += 10;
  } else {
    score += 7;
  }
  return { score: Math.min(100, score), issues };
};

// ═══ Quality Badge ═══
const QualityBadge = ({ score }) => {
  const cfg = score >= 80
    ? { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', label: 'A+', ring: 'ring-emerald-500' }
    : score >= 60
    ? { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'B', ring: 'ring-blue-500' }
    : score >= 40
    ? { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', label: 'C', ring: 'ring-amber-500' }
    : { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'D', ring: 'ring-red-500' };

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.bg} ${cfg.text}`} title={`Quality: ${score}%`}>
      <div className="w-3.5 h-3.5 relative">
        <svg className="w-3.5 h-3.5 -rotate-90" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${score * 0.5} 999`} strokeLinecap="round" />
        </svg>
      </div>
      {score}%
    </div>
  );
};

// ═══ Test Usage Badge ═══
const TestUsageBadge = ({ tests = [], language, onViewTests }) => {
  if (!tests || tests.length === 0) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onViewTests(); }}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 transition-colors"
      title={`Used in ${tests.length} test(s)`}
    >
      <ClipboardList className="w-3 h-3" />
      {tests.length} {language === 'hi' ? 'टेस्ट' : 'test'}
      {tests.length > 1 ? 's' : ''}
    </button>
  );
};

// ═══ MAIN CARD ═══
const QuestionCard = ({
  question,
  language = 'hi',
  showActions = true,
  showAnswer = false,
  onEdit,
  onDelete,
  onView,
  isSelected = false,
  onSelect,
  selectable = false,
  testUsage = null,        // NEW: array of tests using this question
  onLoadTestUsage,         // NEW: callback to load test usage
  showQuality = true,      // NEW: show quality indicator
  showTestUsage = true,    // NEW: show test usage badge
  compact = false          // NEW: compact mode
}) => {
  const { success: toastSuccess } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [fullPassageData, setFullPassageData] = useState(null);
  const [fullDIData, setFullDIData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [questionDetail, setQuestionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const typeColor = getQuestionTypeColor(question.questionType);
  const diffColor = getDifficultyColor(question.difficulty);
  const typeLabel = QUESTION_TYPE_LABELS[question.questionType] || { en: question.questionType, hi: question.questionType };
  const diffLabel = DIFFICULTY_LABELS[question.difficulty] || { en: question.difficulty, hi: question.difficulty };

  // Quality
  const quality = useMemo(() => calculateQuality(question), [question]);

  // Languages available
  const hasHi = !!(question.question?.hi || question.assertionReasonData?.assertion?.hi);
  const hasEn = !!(question.question?.en || question.assertionReasonData?.assertion?.en);
  const hasExplanation = !!(question.explanation?.hi || question.explanation?.en);

  // Load data on expand
  useEffect(() => {
    if (expanded) loadAdditionalData();
  }, [expanded]);

  const loadAdditionalData = async () => {
    if (question.questionType === 'passage_based' && question.passageId) {
      const passageId = typeof question.passageId === 'object' ? question.passageId._id : question.passageId;
      if (!question.passageId?.content) {
        setLoadingData(true);
        try {
          const res = await questionService.getPassageById(passageId);
          if (res.success) setFullPassageData(res.data);
        } catch (err) { console.error('Failed to load passage:', err); }
        finally { setLoadingData(false); }
      } else {
        setFullPassageData(question.passageId);
      }
    }
    if (question.questionType?.startsWith('di_') && question.diDataId) {
      const diId = typeof question.diDataId === 'object' ? question.diDataId._id : question.diDataId;
      if (!question.diDataId?.title) {
        setLoadingData(true);
        try {
          const res = await questionService.getDIDataById(diId);
          if (res.success) setFullDIData(res.data);
        } catch (err) { console.error('Failed to load DI:', err); }
        finally { setLoadingData(false); }
      } else {
        setFullDIData(question.diDataId);
      }
    }
  };

  // Load question detail
  const loadQuestionDetail = async () => {
    setDetailLoading(true);
    try {
      const res = await questionService.getQuestionDetail(question._id);
      if (res.success) setQuestionDetail(res.data);
    } catch (err) { console.error('Failed to load detail:', err); }
    finally { setDetailLoading(false); }
  };

  // Copy question ID
  const copyId = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(question._id);
      toastSuccess(language === 'hi' ? 'ID कॉपी हुई!' : 'ID Copied!');
    } catch { /* ignore */ }
  };

  // Render question content
  const renderQuestionContent = () => {
    const passageData = fullPassageData || question.passageId;
    const diData = fullDIData || question.diDataId;
    const props = { question, language, showAnswer: true, isPreview: true };

    switch (question.questionType) {
      case 'mcq': return <MCQQuestion {...props} />;
      case 'assertion_reason': return <AssertionReason {...props} />;
      case 'match_following': return <MatchFollowing {...props} />;
      case 'sequence_order': return <SequenceOrder {...props} />;
      case 'statement_based': return <StatementBased {...props} />;
      case 'passage_based': return <PassageQuestion {...props} passage={passageData} showPassage={true} />;
      case 'di_table': return <DITableChart {...props} diData={diData} showDIData={true} />;
      case 'di_bar_chart': return <DIBarChart {...props} diData={diData} showDIData={true} />;
      case 'di_pie_chart': return <DIPieChart {...props} diData={diData} showDIData={true} />;
      case 'di_line_graph': return <DILineGraph {...props} diData={diData} showDIData={true} />;
      case 'di_caselet': return <DICaselet {...props} diData={diData} showDIData={true} />;
      default: return <MCQQuestion {...props} />;
    }
  };

  // Preview text
  const getPreviewText = () => {
    const text = getBilingualText(question.question, language);
    if (!text) {
      if (question.questionType === 'assertion_reason')
        return getBilingualText(question.assertionReasonData?.assertion, language);
      if (question.questionType === 'passage_based')
        return language === 'hi' ? 'गद्यांश आधारित प्रश्न' : 'Passage-based Question';
      if (question.questionType?.startsWith('di_')) {
        const title = getBilingualText(question.diDataId?.title, language);
        return title || (language === 'hi' ? 'DI प्रश्न' : 'DI Question');
      }
      return 'No question text';
    }
    return text.length > 180 ? text.substring(0, 180) + '...' : text;
  };

  const tests = testUsage || [];
  const t = (h, e) => language === 'hi' ? h : e;

  return (
    <>
      <div
        className={`
          bg-white dark:bg-secondary-800 rounded-2xl border-2 transition-all duration-200 group
          ${isSelected
            ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800 shadow-lg shadow-primary-500/10'
            : 'border-gray-200 dark:border-secondary-700 hover:border-gray-300 dark:hover:border-secondary-600 hover:shadow-lg'
          }
          ${selectable ? 'cursor-pointer' : ''}
        `}
        onClick={() => selectable && onSelect && onSelect(question._id)}
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {selectable && (
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-secondary-600 group-hover:border-primary-400'}`}
                onClick={(e) => { e.stopPropagation(); onSelect?.(question._id); }}>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Badges Row */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 dark:text-secondary-500 tabular-nums">
                  Q.{question.questionNumber}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${typeColor.bg} ${typeColor.text}`}>
                  {language === 'hi' ? typeLabel.hi : typeLabel.en}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${diffColor.bg} ${diffColor.text}`}>
                  {language === 'hi' ? diffLabel.hi : diffLabel.en}
                </span>

                {/* Language indicators */}
                <div className="flex items-center gap-0.5">
                  <span className={`w-5 h-4 text-[8px] font-black rounded flex items-center justify-center ${hasHi ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>हि</span>
                  <span className={`w-5 h-4 text-[8px] font-black rounded flex items-center justify-center ${hasEn ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>En</span>
                </div>

                {/* PYQ badge */}
                {question.isPYQ && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" />PYQ {question.year || ''}
                  </span>
                )}

                {/* Explanation indicator */}
                {hasExplanation && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-100 text-green-600" title="Has explanation">
                    💡
                  </span>
                )}

                {/* Quality badge */}
                {showQuality && <QualityBadge score={quality.score} />}

                {/* Test usage badge */}
                {showTestUsage && tests.length > 0 && (
                  <TestUsageBadge tests={tests} language={language} onViewTests={() => setShowTestsModal(true)} />
                )}

                {/* Passage/DI indicator */}
                {question.questionType === 'passage_based' && question.passageId && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-600 flex items-center gap-0.5">
                    <BookOpen className="w-3 h-3" />
                    {(typeof question.passageId === 'object' ? question.passageId.title : 'Passage')?.substring(0, 15)}
                  </span>
                )}
                {question.questionType?.startsWith('di_') && question.diDataId && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-600 flex items-center gap-0.5">
                    <BarChart2 className="w-3 h-3" />DI
                  </span>
                )}
              </div>

              {/* Question Preview */}
              <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed break-words">
                {getPreviewText()}
              </p>

              {/* Passage/DI order */}
              {question.passageOrder && (
                <span className="mt-1 inline-block text-[10px] text-amber-600 font-semibold">
                  {t(`गद्यांश प्रश्न ${question.passageOrder}`, `Passage Q${question.passageOrder}`)}
                </span>
              )}
              {question.diOrder && (
                <span className="mt-1 inline-block text-[10px] text-purple-600 font-semibold">
                  {t(`DI प्रश्न ${question.diOrder}`, `DI Q${question.diOrder}`)}
                </span>
              )}
            </div>
          </div>

          {/* ═══ ACTION BUTTONS ═══ */}
          {showActions && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {/* Edit button - PROMINENT */}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(question); }}
                  className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all hover:shadow-md group/edit"
                  title={t('संपादित करें', 'Edit')}
                >
                  <Edit2 className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
                </button>
              )}

              {/* View button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-500 transition-colors"
                title={t('देखें', 'View')}
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* More menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-400 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div
                    className="absolute right-0 mt-1 w-48 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl shadow-xl py-1 z-20"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button onClick={(e) => { e.stopPropagation(); copyId(e); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700">
                      <Copy className="w-4 h-4" />{t('ID कॉपी करें', 'Copy ID')}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDetailModal(true); loadQuestionDetail(); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700">
                      <Info className="w-4 h-4" />{t('विवरण देखें', 'View Details')}
                    </button>
                    {tests.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); setShowTestsModal(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                        <ClipboardList className="w-4 h-4" />
                        {t(`${tests.length} टेस्ट में प्रयुक्त`, `Used in ${tests.length} test(s)`)}
                      </button>
                    )}
                    <div className="border-t border-gray-100 dark:border-secondary-700 my-1" />
                    {onDelete && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(question._id); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />{t('हटाएं', 'Delete')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ EXPANDED CONTENT ═══ */}
        {expanded && (
          <div className="px-4 pb-2">
            <div className="p-4 bg-gray-50 dark:bg-secondary-900/50 rounded-xl border border-gray-100 dark:border-secondary-700">
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 text-primary-600 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">{t('लोड हो रहा है...', 'Loading...')}</span>
                </div>
              ) : (
                renderQuestionContent()
              )}
            </div>

            {/* Quality Issues */}
            {quality.issues.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('गुणवत्ता सुझाव:', 'Quality Suggestions:')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {quality.issues.map((issue, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">{issue}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Test Usage Section (when expanded) */}
            {tests.length > 0 && (
              <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-200 dark:border-violet-800">
                <p className="text-xs font-bold text-violet-700 mb-2 flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {t(`${tests.length} टेस्ट में प्रयुक्त:`, `Used in ${tests.length} test(s):`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tests.slice(0, 5).map((test, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-violet-100 text-violet-700 rounded-lg font-semibold flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      {test.title?.substring(0, 25)}{test.title?.length > 25 ? '...' : ''}
                    </span>
                  ))}
                  {tests.length > 5 && (
                    <span className="text-[10px] px-2 py-1 bg-violet-200 text-violet-800 rounded-lg font-bold">
                      +{tests.length - 5} {t('और', 'more')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-secondary-700/50 bg-gray-50/50 dark:bg-secondary-900/20 rounded-b-2xl">
          <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-secondary-400 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <BookOpen className="w-3 h-3" />
              {question.paper === 'paper1' ? 'P1' : 'P2'}
            </span>
            {question.unit && (
              <span className="flex items-center gap-1 truncate max-w-[100px]" title={question.unit}>
                <Target className="w-3 h-3" />
                {question.unit.length > 12 ? question.unit.substring(0, 12) + '...' : question.unit}
              </span>
            )}
            {question.chapter && (
              <span className="flex items-center gap-1 truncate max-w-[100px]" title={question.chapter}>
                <Tag className="w-3 h-3" />
                {question.chapter.length > 12 ? question.chapter.substring(0, 12) + '...' : question.chapter}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(question.createdAt)}
            </span>
            {question.timesAttempted > 0 && (
              <span className="flex items-center gap-1" title={`${question.timesAttempted} attempts`}>
                <Activity className="w-3 h-3" />
                {question.timesAttempted}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* ID copy micro-button */}
            <button onClick={copyId} className="text-[9px] text-gray-400 hover:text-gray-600 font-mono tabular-nums" title="Copy ID">
              {question._id?.slice(-6)}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" />{t('कम', 'Less')}</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" />{t('विस्तार', 'Expand')}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ PREVIEW MODAL ═══ */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}
        title={`Question #${question.questionNumber}`} size="lg">
        <div className="space-y-4">
          {renderQuestionContent()}
          <div className="pt-4 border-t border-gray-200 dark:border-secondary-700">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium text-gray-700 dark:text-secondary-300">{t('सही उत्तर:', 'Correct Answer:')}</span>
              <span className="text-green-600 font-bold">Option {String.fromCharCode(65 + question.correctAnswer)}</span>
            </div>
            {question.explanation && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">{t('व्याख्या:', 'Explanation:')}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{getBilingualText(question.explanation, language)}</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ═══ TEST USAGE MODAL ═══ */}
      <Modal isOpen={showTestsModal} onClose={() => setShowTestsModal(false)}
        title={t('टेस्ट उपयोग', 'Test Usage')} size="md">
        <div className="space-y-3">
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p>{t('किसी टेस्ट में उपयोग नहीं हुआ', 'Not used in any test')}</p>
            </div>
          ) : (
            tests.map((test, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-200 dark:border-secondary-600">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{test.title}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[9px] font-bold uppercase">{test.testType}</span>
                      {test.paper && <span>{test.paper}</span>}
                      {test.totalQuestions && <span>{test.totalQuestions}Q</span>}
                      <span>{formatDate(test.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${test.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {test.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* ═══ DETAIL MODAL ═══ */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}
        title={t('प्रश्न विवरण', 'Question Details')} size="lg">
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : questionDetail ? (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: ClipboardList, label: t('टेस्ट', 'Tests'), value: questionDetail.usedInTestCount, color: 'violet' },
                { icon: Activity, label: t('प्रयास', 'Attempts'), value: questionDetail.timesAttempted || 0, color: 'blue' },
                { icon: Target, label: t('सटीकता', 'Accuracy'), value: questionDetail.timesAttempted > 0 ? Math.round((questionDetail.timesCorrect / questionDetail.timesAttempted) * 100) + '%' : 'N/A', color: 'green' },
                { icon: Sparkles, label: t('गुणवत्ता', 'Quality'), value: questionDetail.qualityScore + '%', color: 'amber' },
              ].map((stat, i) => (
                <div key={i} className={`p-3 bg-${stat.color}-50 dark:bg-${stat.color}-900/10 rounded-xl border border-${stat.color}-200 text-center`}>
                  <stat.icon className={`w-4 h-4 text-${stat.color}-600 mx-auto mb-1`} />
                  <p className={`text-lg font-black text-${stat.color}-700`}>{stat.value}</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Language Status */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-bold text-gray-600">{t('भाषा:', 'Languages:')}</span>
              </div>
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${questionDetail.hasHindi ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {questionDetail.hasHindi ? '✓ हिंदी' : '✗ हिंदी'}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${questionDetail.hasEnglish ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {questionDetail.hasEnglish ? '✓ English' : '✗ English'}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${questionDetail.hasExplanation ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {questionDetail.hasExplanation ? '✓ Explanation' : '⚠ No Explanation'}
              </span>
            </div>

            {/* Tests */}
            {questionDetail.usedInTests?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <ClipboardList className="w-4 h-4 text-violet-600" />
                  {t('इन टेस्ट में उपयोग:', 'Used in tests:')}
                </h4>
                <div className="space-y-1.5">
                  {questionDetail.usedInTests.map((test, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-violet-50 rounded-lg">
                      <span className="text-xs font-semibold text-violet-700">{test.title}</span>
                      <span className="text-[10px] text-gray-500">{test.testType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Questions */}
            {questionDetail.relatedQuestions?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <Layers className="w-4 h-4 text-blue-600" />
                  {t('संबंधित प्रश्न:', 'Related Questions:')}
                </h4>
                <div className="space-y-1">
                  {questionDetail.relatedQuestions.map((rq, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-xs">
                      <span className="font-bold text-blue-600">Q.{rq.questionNumber}</span>
                      <span className="text-blue-700 truncate">{getBilingualText(rq.question, language)?.substring(0, 60)}...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ID */}
            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
              <span className="text-xs text-gray-500">ID:</span>
              <code className="text-xs font-mono text-gray-700">{question._id}</code>
              <button onClick={copyId} className="text-xs text-primary-600 font-bold hover:underline">{t('कॉपी', 'Copy')}</button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">{t('डेटा लोड करने में विफल', 'Failed to load data')}</p>
        )}
      </Modal>
    </>
  );
};

export default QuestionCard;