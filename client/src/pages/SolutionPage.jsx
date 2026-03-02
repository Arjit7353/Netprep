import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle, Circle,
  Clock, BookOpen, Tag, Menu, X, Filter, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import attemptService from '../services/attemptService';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../utils/constants';

// ─── Helpers ───
const bText = (obj, lang) => {
  if (!obj) return '';
  return obj[lang] || obj['en'] || obj['hi'] || (typeof obj === 'string' ? obj : '');
};
const bArr = (obj, lang) => {
  if (!obj) return [];
  return obj[lang] || obj['en'] || obj['hi'] || (Array.isArray(obj) ? obj : []);
};
const optLabel = (i) => String.fromCharCode(65 + i);
const roman = (i) => ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)'][i] || `(${i + 1})`;
const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const SolutionPage = ({ language: propLang = 'en' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showPalette, setShowPalette] = useState(false);
  const [language, setLanguage] = useState(propLang);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await attemptService.getAttemptReview(id);
        setReviewData(r.data);
      } catch (e) {
        console.error('Failed to load review:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Filtered questions list
  const allQ = reviewData?.questions || [];
  const filteredQ = useMemo(() => {
    if (filter === 'correct') return allQ.filter((q) => q.isCorrect);
    if (filter === 'wrong') return allQ.filter((q) => !q.isCorrect && q.selectedAnswer !== -1);
    if (filter === 'skipped') return allQ.filter((q) => q.selectedAnswer === -1);
    return allQ;
  }, [allQ, filter]);

  const currentQ = filteredQ[currentIdx] || null;

  // Counts
  const counts = useMemo(() => ({
    all: allQ.length,
    correct: allQ.filter((q) => q.isCorrect).length,
    wrong: allQ.filter((q) => !q.isCorrect && q.selectedAnswer !== -1).length,
    skipped: allQ.filter((q) => q.selectedAnswer === -1).length,
  }), [allQ]);

  const goTo = useCallback((i) => {
    if (i >= 0 && i < filteredQ.length) setCurrentIdx(i);
  }, [filteredQ.length]);

  const goToByOriginalIndex = useCallback((origIdx) => {
    const q = allQ[origIdx];
    if (!q) return;
    const filtIdx = filteredQ.findIndex((fq) => fq.questionNumber === q.questionNumber);
    if (filtIdx !== -1) {
      setCurrentIdx(filtIdx);
    } else {
      setFilter('all');
      setTimeout(() => setCurrentIdx(origIdx), 0);
    }
    setShowPalette(false);
  }, [allQ, filteredQ]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') goTo(currentIdx - 1);
      if (e.key === 'ArrowRight') goTo(currentIdx + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, goTo]);

  // Reset index when filter changes
  useEffect(() => { setCurrentIdx(0); }, [filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-secondary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!reviewData || allQ.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-secondary-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Solution data not found</p>
          <button onClick={() => navigate(-1)} className="btn-primary px-6 py-2">Go Back</button>
        </div>
      </div>
    );
  }

  const a = reviewData.attempt;

  // ─── Get status color for palette dot ───
  const dotColor = (q) => {
    if (q.isCorrect) return 'bg-green-500';
    if (q.selectedAnswer !== -1) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-secondary-900 flex flex-col">
      {/* ═══════ STICKY HEADER ═══════ */}
      <header className="bg-white dark:bg-secondary-800 border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(`/results/${id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              {reviewData.test.title} — Solutions
            </h1>
          </div>
          {/* Score badge */}
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-600 font-bold">
              <CheckCircle className="w-4 h-4" /> {counts.correct}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold">
              <XCircle className="w-4 h-4" /> {counts.wrong}
            </span>
            <span className="flex items-center gap-1 text-gray-500 font-bold">
              <Circle className="w-4 h-4" /> {counts.skipped}
            </span>
            <span className={`font-bold text-lg ${a.percentage >= 60 ? 'text-green-600' : a.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {a.percentage}%
            </span>
          </div>

          {/* Language toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-secondary-700 rounded-lg p-0.5">
            {['hi', 'en'].map((l) => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  language === l ? 'bg-white dark:bg-secondary-600 text-primary-700 dark:text-primary-300 shadow-sm' : 'text-gray-500'
                }`}>
                {l === 'hi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>

          {/* Mobile palette toggle */}
          <button onClick={() => setShowPalette(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg">
            <Menu className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
        </div>

        {/* ─── Filter tabs ─── */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: language === 'hi' ? 'सभी' : 'All', count: counts.all, color: 'primary' },
            { id: 'correct', label: language === 'hi' ? 'सही' : 'Correct', count: counts.correct, color: 'green' },
            { id: 'wrong', label: language === 'hi' ? 'गलत' : 'Wrong', count: counts.wrong, color: 'red' },
            { id: 'skipped', label: language === 'hi' ? 'छोड़े' : 'Skipped', count: counts.skipped, color: 'gray' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? `bg-${tab.color}-600 text-white`
                  : `bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300 hover:bg-gray-200`
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-2xs ${
                filter === tab.id ? 'bg-white/25' : 'bg-gray-200 dark:bg-secondary-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-200 dark:bg-secondary-700">
          <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${((currentIdx + 1) / filteredQ.length) * 100}%` }} />
        </div>
      </header>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 flex">
        {/* Question area */}
        <main className="flex-1 lg:mr-72 overflow-y-auto">
          {filteredQ.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              {language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions in this filter'}
            </div>
          ) : currentQ ? (
            <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-28">
              <QuestionSolutionCard question={currentQ} language={language} index={currentIdx} total={filteredQ.length} />
            </div>
          ) : null}
        </main>

        {/* ─── Desktop Palette ─── */}
        <aside className="hidden lg:block fixed right-0 top-[106px] bottom-0 w-72 bg-white dark:bg-secondary-800 border-l dark:border-secondary-700 overflow-y-auto">
          <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter}
            onJump={goToByOriginalIndex} dotColor={dotColor} counts={counts} language={language} />
        </aside>

        {/* ─── Mobile Palette Drawer ─── */}
        {showPalette && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowPalette(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-secondary-800 z-50 lg:hidden overflow-y-auto shadow-xl animate-slide-left">
              <div className="sticky top-0 bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}</h3>
                <button onClick={() => setShowPalette(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter}
                onJump={goToByOriginalIndex} dotColor={dotColor} counts={counts} language={language} />
            </aside>
          </>
        )}
      </div>

      {/* ═══════ STICKY FOOTER NAV ═══════ */}
      <footer className="bg-white dark:bg-secondary-800 border-t dark:border-secondary-700 sticky bottom-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx <= 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700 dark:text-secondary-300"
          >
            <ChevronLeft className="w-4 h-4" /> {language === 'hi' ? 'पिछला' : 'Previous'}
          </button>

          <span className="text-sm text-gray-500 dark:text-secondary-400 font-medium">
            {currentIdx + 1} / {filteredQ.length}
          </span>

          <button
            onClick={() => goTo(currentIdx + 1)}
            disabled={currentIdx >= filteredQ.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {language === 'hi' ? 'अगला' : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//                PALETTE CONTENT
// ═══════════════════════════════════════════════════════
const PaletteContent = ({ allQ, filteredQ, currentIdx, filter, onJump, dotColor, counts, language }) => {
  const currentQNum = filteredQ[currentIdx]?.questionNumber;
  return (
    <div className="p-4 space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> {language === 'hi' ? 'सही' : 'Correct'} ({counts.correct})</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> {language === 'hi' ? 'गलत' : 'Wrong'} ({counts.wrong})</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400" /> {language === 'hi' ? 'छोड़ा' : 'Skipped'} ({counts.skipped})</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 gap-2">
        {allQ.map((q, i) => {
          const isCurrent = q.questionNumber === currentQNum;
          const inFilter = filteredQ.some((fq) => fq.questionNumber === q.questionNumber);
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              disabled={!inFilter && filter !== 'all'}
              className={`
                w-full aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all
                ${isCurrent ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-800 scale-110' : ''}
                ${!inFilter && filter !== 'all' ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                ${q.isCorrect ? 'bg-green-500 text-white' : q.selectedAnswer !== -1 ? 'bg-red-500 text-white' : 'bg-gray-300 dark:bg-secondary-600 text-gray-700 dark:text-secondary-300'}
              `}
            >
              {q.questionNumber}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-600 dark:text-secondary-400">{language === 'hi' ? 'कुल प्रश्न' : 'Total'}</span><span className="font-bold">{counts.all}</span></div>
        <div className="flex justify-between"><span className="text-green-600">{language === 'hi' ? 'सही' : 'Correct'}</span><span className="font-bold text-green-600">{counts.correct}</span></div>
        <div className="flex justify-between"><span className="text-red-600">{language === 'hi' ? 'गलत' : 'Wrong'}</span><span className="font-bold text-red-600">{counts.wrong}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">{language === 'hi' ? 'छोड़ा' : 'Skipped'}</span><span className="font-bold text-gray-500">{counts.skipped}</span></div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//         QUESTION SOLUTION CARD (renders one question)
// ═══════════════════════════════════════════════════════
const QuestionSolutionCard = ({ question: q, language, index, total }) => {
  const qData = q.question;
  if (!qData) return null;

  const qType = qData.questionType;
  const difficulty = qData.difficulty || 'medium';
  const diffCfg = DIFFICULTY_LABELS[difficulty] || {};
  const typeLbl = QUESTION_TYPE_LABELS[qType]?.[language] || qType;

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border dark:border-secondary-700 overflow-hidden animate-fade-in">
      {/* ─── Card Header ─── */}
      <div className="p-4 sm:p-5 border-b dark:border-secondary-700 bg-gray-50 dark:bg-secondary-750">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            Q.{q.questionNumber}
            <span className="text-gray-400 font-normal ml-1">/ {total}</span>
          </span>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">{typeLbl}</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
            difficulty === 'easy' ? 'bg-green-100 text-green-700' : difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {diffCfg[language] || difficulty}
          </span>
          {q.timeTaken > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" />{q.timeTaken}s</span>
          )}
          {/* Result badge */}
          {q.isCorrect ? (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle className="w-4 h-4" /> {language === 'hi' ? 'सही' : 'Correct'}</span>
          ) : q.selectedAnswer !== -1 ? (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-red-600"><XCircle className="w-4 h-4" /> {language === 'hi' ? 'गलत' : 'Wrong'}</span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-gray-500"><Circle className="w-4 h-4" /> {language === 'hi' ? 'छोड़ा' : 'Skipped'}</span>
          )}
        </div>
        {/* Topic breadcrumb */}
        {(qData.unit || qData.chapter || qData.topic) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-secondary-400 overflow-x-auto">
            <Tag className="w-3 h-3 flex-shrink-0" />
            {[qData.unit, qData.chapter, qData.topic].filter(Boolean).join(' > ')}
          </div>
        )}
      </div>

      {/* ─── Card Body ─── */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Render question content by type */}
        <QuestionContent qData={qData} language={language} />

        {/* ─── Options with color coding ─── */}
        <OptionsDisplay qData={qData} language={language} selectedAnswer={q.selectedAnswer} correctAnswer={q.correctAnswer} />

        {/* ─── Answer summary bar ─── */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg text-sm">
          <div>
            <span className="text-gray-500 dark:text-secondary-400">{language === 'hi' ? 'आपका उत्तर: ' : 'Your Answer: '}</span>
            <span className={`font-bold ${q.selectedAnswer === -1 ? 'text-gray-500' : q.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {q.selectedAnswer === -1 ? (language === 'hi' ? 'नहीं दिया' : 'Not Answered') : `(${optLabel(q.selectedAnswer)})`}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-secondary-400">{language === 'hi' ? 'सही उत्तर: ' : 'Correct: '}</span>
            <span className="font-bold text-green-600">({optLabel(q.correctAnswer)})</span>
          </div>
        </div>

        {/* ─── Explanation ─── */}
        {qData.explanation && (bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-900 dark:text-blue-300 text-sm">{language === 'hi' ? 'व्याख्या' : 'Explanation'}</span>
            </div>
            <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed whitespace-pre-line">
              {bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//     QUESTION CONTENT (renders question-specific stuff)
// ═══════════════════════════════════════════════════════
const QuestionContent = ({ qData, language }) => {
  const qType = qData.questionType;
  const questionText = bText(qData.question, language);

  // ── Passage ──
  if (qType === 'passage_based' && qData.passageId) {
    const passageContent = bText(qData.passageId.content, language);
    return (
      <div className="space-y-4">
        {passageContent && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg max-h-64 overflow-y-auto">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-xs mb-2">{language === 'hi' ? 'गद्यांश:' : 'Passage:'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{passageContent}</p>
          </div>
        )}
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>
      </div>
    );
  }

  // ── Assertion-Reason ──
  if (qType === 'assertion_reason') {
    const assertion = bText(qData.assertionReasonData?.assertion, language);
    const reason = bText(qData.assertionReasonData?.reason, language);
    return (
      <div className="space-y-3">
        {questionText && <p className="text-gray-700 dark:text-secondary-300 font-medium text-sm">{questionText}</p>}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
          <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs mb-1">{language === 'hi' ? 'अभिकथन (A):' : 'Assertion (A):'}</p>
          <p className="text-sm text-gray-800 dark:text-secondary-200">{assertion}</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
          <p className="font-semibold text-green-800 dark:text-green-300 text-xs mb-1">{language === 'hi' ? 'कारण (R):' : 'Reason (R):'}</p>
          <p className="text-sm text-gray-800 dark:text-secondary-200">{reason}</p>
        </div>
      </div>
    );
  }

  // ── Match Following ──
  if (qType === 'match_following') {
    const listA = bArr(qData.matchData?.listA, language);
    const listB = bArr(qData.matchData?.listB, language);
    return (
      <div className="space-y-3">
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText || (language === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:')}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-300 dark:border-secondary-600 text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-secondary-700">
                <th className="border border-gray-300 dark:border-secondary-600 px-3 py-2 font-bold text-left">{language === 'hi' ? 'सूची-I' : 'List-I'}</th>
                <th className="border border-gray-300 dark:border-secondary-600 px-3 py-2 font-bold text-left">{language === 'hi' ? 'सूची-II' : 'List-II'}</th>
              </tr>
            </thead>
            <tbody>
              {listA.map((a, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-secondary-800' : 'bg-gray-50 dark:bg-secondary-750'}>
                  <td className="border border-gray-300 dark:border-secondary-600 px-3 py-2"><span className="font-bold text-primary-700 dark:text-primary-400">({optLabel(i)})</span> {a}</td>
                  <td className="border border-gray-300 dark:border-secondary-600 px-3 py-2"><span className="font-bold text-primary-700 dark:text-primary-400">{roman(i)}</span> {listB[i] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Show correct match */}
        {qData.matchData?.correctMatch && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-800 dark:text-green-300 font-medium">
            {language === 'hi' ? 'सही मिलान: ' : 'Correct Match: '}
            {qData.matchData.correctMatch.map((m, i) => `${optLabel(i)}-${roman(m)}`).join(', ')}
          </div>
        )}
      </div>
    );
  }

  // ── Statement Based ──
  if (qType === 'statement_based') {
    const stmts = bArr(qData.statementData?.statements, language);
    return (
      <div className="space-y-3">
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText || (language === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:')}</p>
        <div className="p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg space-y-2">
          {stmts.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-gray-600 dark:text-secondary-400 bg-white dark:bg-secondary-800 px-1.5 py-0.5 rounded">{i + 1}.</span>
              <span className="text-gray-800 dark:text-secondary-200">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Sequence Order ──
  if (qType === 'sequence_order') {
    const items = bArr(qData.sequenceData?.items, language);
    return (
      <div className="space-y-3">
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText || (language === 'hi' ? 'सही क्रम में व्यवस्थित कीजिए:' : 'Arrange in correct order:')}</p>
        <div className="p-3 bg-gray-50 dark:bg-secondary-700 rounded-lg space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-gray-600 dark:text-secondary-400 bg-white dark:bg-secondary-800 px-1.5 py-0.5 rounded">{i + 1}.</span>
              <span className="text-gray-800 dark:text-secondary-200">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── DI Table ──
  if (qType === 'di_table' && qData.diDataId) {
    const di = qData.diDataId;
    const headers = bArr(di.tableData?.headers, language);
    const rows = di.tableData?.rows || [];
    return (
      <div className="space-y-3">
        {bText(di.title, language) && <p className="font-semibold text-gray-900 dark:text-white">{bText(di.title, language)}</p>}
        {bText(di.instruction, language) && <p className="text-sm text-gray-700 dark:text-secondary-300">{bText(di.instruction, language)}</p>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-300 dark:border-secondary-600 text-xs">
            <thead><tr className="bg-primary-50 dark:bg-primary-900/30">
              {headers.map((h, i) => <th key={i} className="border border-gray-300 dark:border-secondary-600 px-2 py-2 font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-gray-50 dark:bg-secondary-750'}>
                  {row.map((cell, ci) => <td key={ci} className="border border-gray-300 dark:border-secondary-600 px-2 py-1.5 text-center">{cell ?? '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>
      </div>
    );
  }

  // ── DI Bar Chart ──
  if (qType === 'di_bar_chart' && qData.diDataId) {
    const di = qData.diDataId;
    const labels = bArr(di.chartData?.labels, language);
    const datasets = di.chartData?.datasets || [];
    const data = labels.map((l, i) => {
      const item = { name: l };
      datasets.forEach((ds, di2) => { item[bText(ds.label, language) || `S${di2 + 1}`] = ds.data[i] || 0; });
      return item;
    });
    return (
      <div className="space-y-3">
        {bText(di.title, language) && <p className="font-semibold text-gray-900 dark:text-white">{bText(di.title, language)}</p>}
        <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border dark:border-secondary-700">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
              {datasets.map((ds, i) => <Bar key={i} dataKey={bText(ds.label, language) || `S${i + 1}`} fill={ds.color || COLORS[i % COLORS.length]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>
      </div>
    );
  }

  // ── DI Pie Chart ──
  if (qType === 'di_pie_chart' && qData.diDataId) {
    const di = qData.diDataId;
    const labels = bArr(di.chartData?.labels, language);
    const ds = di.chartData?.datasets?.[0] || {};
    const colors = ds.colors || COLORS;
    const pieData = labels.map((l, i) => ({ name: l, value: ds.data?.[i] || 0 }));
    return (
      <div className="space-y-3">
        {bText(di.title, language) && <p className="font-semibold text-gray-900 dark:text-white">{bText(di.title, language)}</p>}
        <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border dark:border-secondary-700">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
              {pieData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>
      </div>
    );
  }

  // ── DI Line Graph ──
  if (qType === 'di_line_graph' && qData.diDataId) {
    const di = qData.diDataId;
    const labels = bArr(di.chartData?.labels, language);
    const datasets = di.chartData?.datasets || [];
    const data = labels.map((l, i) => {
      const item = { name: l };
      datasets.forEach((ds, di2) => { item[bText(ds.label, language) || `S${di2 + 1}`] = ds.data[i] || 0; });
      return item;
    });
    return (
      <div className="space-y-3">
        {bText(di.title, language) && <p className="font-semibold text-gray-900 dark:text-white">{bText(di.title, language)}</p>}
        <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg border dark:border-secondary-700">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
              {datasets.map((ds, i) => <Line key={i} type="monotone" dataKey={bText(ds.label, language) || `S${i + 1}`} stroke={ds.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>
      </div>
    );
  }

  // ── DI Caselet ──
  if (qType === 'di_caselet' && qData.diDataId) {
    const di = qData.diDataId;
    const caselet = bText(di.caseletText, language);
    return (
      <div className="space-y-3">
        {bText(di.title, language) && <p className="font-semibold text-gray-900 dark:text-white">{bText(di.title, language)}</p>}
        {caselet && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs mb-1">{language === 'hi' ? 'डेटा:' : 'Data:'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{caselet}</p>
          </div>
        )}
        <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>
      </div>
    );
  }

  // ── Default MCQ ──
  return <p className="text-gray-800 dark:text-secondary-200 leading-relaxed">{questionText}</p>;
};

// ═══════════════════════════════════════════════════════
//     OPTIONS DISPLAY with color-coded answers
// ═══════════════════════════════════════════════════════
const OptionsDisplay = ({ qData, language, selectedAnswer, correctAnswer }) => {
  const options = bArr(qData.options, language);

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const isCorrect = i === correctAnswer;
        const isSelected = i === selectedAnswer;
        const isWrong = isSelected && !isCorrect;

        let classes = 'border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-800';
        let icon = <Circle className="w-5 h-5 text-gray-400" />;

        if (isCorrect) {
          classes = 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-700';
          icon = <CheckCircle className="w-5 h-5 text-green-600" />;
        } else if (isWrong) {
          classes = 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700';
          icon = <XCircle className="w-5 h-5 text-red-600" />;
        }

        return (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 transition-all ${classes}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-gray-700 dark:text-secondary-300 mr-2">({optLabel(i)})</span>
              <span className={`text-sm ${isCorrect ? 'text-green-800 dark:text-green-200 font-medium' : isWrong ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-secondary-300'}`}>
                {opt}
              </span>
            </div>
            {/* Badge */}
            {isCorrect && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-green-600 text-white text-2xs font-bold rounded">
                {language === 'hi' ? 'सही' : 'CORRECT'}
              </span>
            )}
            {isWrong && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-red-600 text-white text-2xs font-bold rounded">
                {language === 'hi' ? 'आपका' : 'YOURS'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SolutionPage;