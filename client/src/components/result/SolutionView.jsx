// client/src/components/test/SolutionView.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Circle,
  Clock, BookOpen, Tag, Menu, X, Filter, ArrowLeft, Languages,
  Hash, AlertTriangle, Bookmark, Lightbulb, ChevronDown, ChevronUp,
  Zap, SkipForward, Flag
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ReportIssueModal from '../test/ReportIssueModal';
import { getSequenceItemLabel } from '../../utils/helpers';

// ─── Hindi Detection ───────────────────────────────────────────────────────────
const HINDI_RE = /[\u0900-\u097F]/;

// ─── AR Default Options ────────────────────────────────────────────────────────
const AR_OPTIONS_HI = [
  'अभिकथन (A) और कारण (R) दोनों सही हैं और (R), (A) की सही व्याख्या है',
  'अभिकथन (A) और कारण (R) दोनों सही हैं, परंतु (R), (A) की सही व्याख्या नहीं है',
  'अभिकथन (A) सही है, परंतु कारण (R) गलत है',
  'अभिकथन (A) गलत है, परंतु कारण (R) सही है',
];
const AR_OPTIONS_EN = [
  'Both Assertion (A) and Reason (R) are true, and (R) is the correct explanation of (A)',
  'Both Assertion (A) and Reason (R) are true, but (R) is NOT the correct explanation of (A)',
  'Assertion (A) is true, but Reason (R) is false',
  'Assertion (A) is false, but Reason (R) is true',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const bText = (obj, lang) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const other = lang === 'hi' ? 'en' : 'hi';
  const primary = obj[lang] || '';
  const fallback = obj[other] || '';
  if (!primary.trim()) return fallback;
  if (!fallback.trim()) return primary;
  if (primary.trim().length > 10) {
    const pHasHindi = HINDI_RE.test(primary);
    const fHasHindi = HINDI_RE.test(fallback);
    if (lang === 'hi' && !pHasHindi && fHasHindi) return fallback;
    if (lang === 'en' && pHasHindi && !fHasHindi) return fallback;
  }
  return primary;
};

const bArr = (obj, lang) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (typeof obj !== 'object') return [];
  const other = lang === 'hi' ? 'en' : 'hi';
  const primary = Array.isArray(obj[lang]) ? obj[lang] : [];
  const fallback = Array.isArray(obj[other]) ? obj[other] : [];
  const maxLen = Math.max(primary.length, fallback.length);
  if (maxLen === 0) return [];
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    const p = (primary[i] || '').trim();
    const f = (fallback[i] || '').trim();
    if (!p && !f) { result.push(''); continue; }
    if (!p) { result.push(f); continue; }
    if (!f) { result.push(p); continue; }
    const pHasHindi = HINDI_RE.test(p);
    const fHasHindi = HINDI_RE.test(f);
    if (lang === 'hi') {
      result.push(pHasHindi ? p : (fHasHindi ? f : p));
    } else {
      result.push(!pHasHindi ? p : (!fHasHindi ? f : p));
    }
  }
  return result;
};

const resolveOptions = (qData, lang) => {
  const raw = bArr(qData.options, lang);
  if (qData.questionType === 'assertion_reason') {
    const defaults = lang === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN;
    if (!raw || raw.length === 0) return defaults;
    const resolved = raw.map((opt, i) => {
      if (!opt || !opt.trim()) return defaults[i] || '';
      const hasHindi = HINDI_RE.test(opt.trim());
      if (lang === 'hi' && !hasHindi) return defaults[i] || opt;
      if (lang === 'en' && hasHindi) {
        const hCount = (opt.match(/[\u0900-\u097F]/g) || []).length;
        const eCount = (opt.match(/[A-Za-z]/g) || []).length;
        if (hCount > eCount) return defaults[i] || opt;
      }
      return opt;
    });
    const correctCount = resolved.filter(opt => {
      if (!opt || opt.trim().length < 5) return true;
      const hasHindi = HINDI_RE.test(opt);
      return lang === 'hi' ? hasHindi : !hasHindi;
    }).length;
    return correctCount < Math.ceil(resolved.length / 2) ? defaults : resolved;
  }
  return raw;
};

const optLabel = (i) => String.fromCharCode(65 + i);
const roman  = (i) =>
  ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)'][i] || `(${i + 1})`;
const CHART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

const TYPE_LABELS = {
  mcq:             { en: 'MCQ',       hi: 'बहुविकल्पीय' },
  assertion_reason:{ en: 'Assertion-Reason', hi: 'अभिकथन-कारण' },
  match_following: { en: 'Match',     hi: 'सुमेलन' },
  sequence_order:  { en: 'Sequence',  hi: 'क्रम' },
  statement_based: { en: 'Statement', hi: 'कथन' },
  passage_based:   { en: 'Passage',   hi: 'गद्यांश' },
  di_table:        { en: 'DI-Table',  hi: 'DI-तालिका' },
  di_bar_chart:    { en: 'DI-Bar',    hi: 'DI-बार' },
  di_pie_chart:    { en: 'DI-Pie',    hi: 'DI-पाई' },
  di_line_graph:   { en: 'DI-Line',   hi: 'DI-लाइन' },
  di_caselet:      { en: 'DI-Case',   hi: 'DI-केस' },
  di_mixed:        { en: 'DI-Mixed',  hi: 'DI-मिश्र' },
};
const DIFF_LABELS = {
  easy:   { en: 'Easy',   hi: 'सरल' },
  medium: { en: 'Medium', hi: 'मध्यम' },
  hard:   { en: 'Hard',   hi: 'कठिन' },
};

const isSkipped = (sel) => sel === -1 || sel === null || sel === undefined;

// ─── Swipe Hook ────────────────────────────────────────────────────────────────
const useSwipe = (onLeft, onRight) => {
  const [start, setStart] = useState(null);
  const [end,   setEnd]   = useState(null);
  const onTouchStart = (e) => { setEnd(null); setStart(e.targetTouches[0].clientX); };
  const onTouchMove  = (e) => setEnd(e.targetTouches[0].clientX);
  const onTouchEnd   = () => {
    if (!start || !end) return;
    const d = start - end;
    if (Math.abs(d) > 50) { if (d > 0) onLeft(); else onRight(); }
  };
  return { onTouchStart, onTouchMove, onTouchEnd };
};

// ══════════════════════════════════════════════════════════════════════════════
// SOLUTION VIEW (main component)
// ══════════════════════════════════════════════════════════════════════════════
const SolutionView = ({
  answers = [],
  questions = [],
  language: initialLang = 'en',
  test,
  onClose,
  onLanguageChange,
  initialIndex = 0,
}) => {
  const [language,        setLanguage]        = useState(initialLang);
  const [currentIdx,      setCurrentIdx]      = useState(0);
  const [filter,          setFilter]          = useState('all');
  const [showPalette,     setShowPalette]     = useState(false);
  const [bookmarked,      setBookmarked]      = useState(new Set());
  const [showExplanation, setShowExplanation] = useState(true);
  const [animDir,         setAnimDir]         = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  // Sync external lang prop
  useEffect(() => { setLanguage(initialLang); }, [initialLang]);

  const handleLangToggle = () => {
    const next = language === 'hi' ? 'en' : 'hi';
    setLanguage(next);
    if (onLanguageChange) onLanguageChange(next);
    try { localStorage.setItem('netprep_lang', next); } catch {}
  };

  // Build flat question list
  const allQ = useMemo(() =>
    questions.map((q, i) => ({
      question: q,
      ...(answers[i] || {}),
      questionNumber: i + 1,
    })),
    [questions, answers]
  );

  // Jump to initialIndex on mount
  useEffect(() => {
    if (initialIndex > 0 && initialIndex < allQ.length) setCurrentIdx(initialIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered list
  const filteredQ = useMemo(() => {
    if (filter === 'correct')    return allQ.filter(q => q.isCorrect);
    if (filter === 'wrong')      return allQ.filter(q => !q.isCorrect && !isSkipped(q.selectedAnswer));
    if (filter === 'skipped')    return allQ.filter(q => isSkipped(q.selectedAnswer));
    if (filter === 'bookmarked') return allQ.filter(q => bookmarked.has(q.questionNumber));
    return allQ;
  }, [allQ, filter, bookmarked]);

  const currentQ = filteredQ[currentIdx] || null;

  const counts = useMemo(() => ({
    all:        allQ.length,
    correct:    allQ.filter(q => q.isCorrect).length,
    wrong:      allQ.filter(q => !q.isCorrect && !isSkipped(q.selectedAnswer)).length,
    skipped:    allQ.filter(q => isSkipped(q.selectedAnswer)).length,
    bookmarked: bookmarked.size,
  }), [allQ, bookmarked]);

  // Navigation
  const goTo = useCallback((i, dir) => {
    if (i >= 0 && i < filteredQ.length) {
      setAnimDir(dir || (i > currentIdx ? 'right' : 'left'));
      setCurrentIdx(i);
      document.getElementById('sv-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filteredQ.length, currentIdx]);

  const goNext = useCallback(() => goTo(currentIdx + 1, 'right'), [goTo, currentIdx]);
  const goPrev = useCallback(() => goTo(currentIdx - 1, 'left'),  [goTo, currentIdx]);
  const swipeHandlers = useSwipe(goNext, goPrev);

  const goToByOriginal = useCallback((origIdx) => {
    const q = allQ[origIdx];
    if (!q) return;
    const idx = filteredQ.findIndex(fq => fq.questionNumber === q.questionNumber);
    if (idx !== -1) {
      goTo(idx);
    } else {
      setFilter('all');
      setTimeout(() => goTo(origIdx), 50);
    }
    setShowPalette(false);
  }, [allQ, filteredQ, goTo]);

  const toggleBookmark = useCallback((qNum) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(qNum)) next.delete(qNum); else next.add(qNum);
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e) => {
      if (showReportModal) return;
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape' && onClose) onClose();
      if ((e.key === 'b' || e.key === 'B') && currentQ) toggleBookmark(currentQ.questionNumber);
      if (e.key === 'e' || e.key === 'E') setShowExplanation(p => !p);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [currentIdx, currentQ, showReportModal, goNext, goPrev, onClose, toggleBookmark]);

  // Reset index when filter changes
  useEffect(() => { setCurrentIdx(0); }, [filter]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Clear animation direction
  useEffect(() => {
    const t = setTimeout(() => setAnimDir(''), 300);
    return () => clearTimeout(t);
  }, [currentIdx]);

  // Filter tabs config
  const filterTabs = [
    { id: 'all',        label: language === 'hi' ? 'सभी'  : 'All',     count: counts.all,        activeClass: 'bg-primary-600 text-white',  icon: Hash },
    { id: 'correct',    label: language === 'hi' ? 'सही'  : 'Correct', count: counts.correct,    activeClass: 'bg-emerald-600 text-white',  icon: CheckCircle },
    { id: 'wrong',      label: language === 'hi' ? 'गलत'  : 'Wrong',   count: counts.wrong,      activeClass: 'bg-red-600 text-white',      icon: XCircle },
    { id: 'skipped',    label: language === 'hi' ? 'छोड़े' : 'Skipped', count: counts.skipped,    activeClass: 'bg-gray-600 text-white',     icon: Circle },
    ...(bookmarked.size > 0
      ? [{ id: 'bookmarked', label: language === 'hi' ? 'सेव्ड' : 'Saved', count: counts.bookmarked, activeClass: 'bg-amber-600 text-white', icon: Bookmark }]
      : []
    ),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-secondary-900">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 shadow-sm">
        <div className="flex items-center gap-3 px-3 sm:px-5 py-3">

          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 dark:text-secondary-300
                       hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">
              {language === 'hi' ? 'वापस' : 'Back'}
            </span>
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              {test?.title || (language === 'hi' ? 'समाधान' : 'Solutions')}
            </h1>
          </div>

          {/* Score pills (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg text-sm">
              <CheckCircle className="w-3.5 h-3.5" /> {counts.correct}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-lg text-sm">
              <XCircle className="w-3.5 h-3.5" /> {counts.wrong}
            </span>
            <span className="flex items-center gap-1 text-gray-500 font-bold bg-gray-100 dark:bg-secondary-700 px-2.5 py-1 rounded-lg text-sm">
              <Circle className="w-3.5 h-3.5" /> {counts.skipped}
            </span>
          </div>

          {/* Language toggle */}
          <button
            onClick={handleLangToggle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-secondary-700
                       hover:bg-gray-200 dark:hover:bg-secondary-600 text-gray-700 dark:text-secondary-300
                       transition-colors text-sm font-medium"
          >
            <Languages className="w-4 h-4" />
            <span className="font-bold text-xs">{language === 'hi' ? 'EN' : 'हि'}</span>
          </button>

          {/* Palette toggle (mobile) */}
          <button
            onClick={() => setShowPalette(true)}
            className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-secondary-700
                       hover:bg-gray-200 dark:hover:bg-secondary-600 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-3 sm:px-5 pb-3 overflow-x-auto scrollbar-hide">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                          whitespace-nowrap transition-all ${
                filter === tab.id
                  ? tab.activeClass + ' shadow-sm'
                  : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab.id ? 'bg-white/25' : 'bg-gray-200 dark:bg-secondary-600'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-secondary-700">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${filteredQ.length > 0 ? ((currentIdx + 1) / filteredQ.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      {/* ── MAIN ── */}
      <div className="flex-1 flex overflow-hidden relative" {...swipeHandlers}>

        {/* Scrollable content */}
        <main id="sv-scroll" className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col">
          {filteredQ.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Filter className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">
                {language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions found'}
              </p>
              <button
                onClick={() => setFilter('all')}
                className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
              >
                {language === 'hi' ? 'सभी दिखाएं' : 'Show All'}
              </button>
            </div>
          ) : currentQ ? (
            <div className={`max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-6 pb-8 flex-1 flex flex-col min-h-0 ${
              animDir === 'right' ? 'animate-slide-left'
              : animDir === 'left' ? 'animate-slide-right'
              : 'animate-fade-in'
            }`}>
              <QCard
                question={currentQ}
                language={language}
                index={currentIdx}
                total={filteredQ.length}
                isBookmarked={bookmarked.has(currentQ.questionNumber)}
                onToggleBookmark={() => toggleBookmark(currentQ.questionNumber)}
                showExplanation={showExplanation}
                onToggleExplanation={() => setShowExplanation(p => !p)}
                onReport={() => setShowReportModal(true)}
              />
              {/* Keyboard hints (desktop) */}
              <div className="hidden lg:flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
                <span>← → {language === 'hi' ? 'नेविगेट' : 'Navigate'}</span>
                <span>B = {language === 'hi' ? 'बुकमार्क' : 'Bookmark'}</span>
                <span>E = {language === 'hi' ? 'व्याख्या' : 'Explanation'}</span>
                <span>Esc = {language === 'hi' ? 'बंद' : 'Close'}</span>
              </div>
            </div>
          ) : null}
        </main>

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-secondary-800 border-l dark:border-secondary-700 flex-shrink-0">
          <div className="p-4 border-b dark:border-secondary-700 bg-gray-50 dark:bg-secondary-750/50">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary-500" />
              {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PaletteContent
              allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx}
              filter={filter} onJump={goToByOriginal} counts={counts}
              language={language} bookmarked={bookmarked}
            />
          </div>
        </aside>

        {/* ── Mobile Drawer ── */}
        {showPalette && (
          <div className="absolute inset-0 z-50 lg:hidden flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPalette(false)}
            />
            <aside className="relative w-80 max-w-[85vw] bg-white dark:bg-secondary-800 h-full flex flex-col shadow-2xl animate-slide-left">
              <div className="flex items-center justify-between p-4 border-b dark:border-secondary-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary-500" />
                  {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
                </h3>
                <button
                  onClick={() => setShowPalette(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PaletteContent
                  allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx}
                  filter={filter} onJump={goToByOriginal} counts={counts}
                  language={language} bookmarked={bookmarked}
                />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="flex-shrink-0 bg-white dark:bg-secondary-800 border-t dark:border-secondary-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-4xl mx-auto">

          <button
            onClick={goPrev}
            disabled={currentIdx <= 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-secondary-600
                       text-gray-700 dark:text-secondary-300 font-semibold text-sm
                       hover:bg-gray-50 dark:hover:bg-secondary-700
                       disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'hi' ? 'पिछला' : 'Previous'}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-secondary-700 px-4 py-2 rounded-xl">
              <span className="text-primary-600 dark:text-primary-400">{currentIdx + 1}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span>{filteredQ.length}</span>
            </span>
            {currentQ && (
              <button
                onClick={() => toggleBookmark(currentQ.questionNumber)}
                className={`p-2 rounded-xl transition-all ${
                  bookmarked.has(currentQ.questionNumber)
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    : 'bg-gray-100 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked.has(currentQ.questionNumber) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          <button
            onClick={goNext}
            disabled={currentIdx >= filteredQ.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm
                       hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all
                       shadow-lg shadow-primary-600/20 active:scale-95"
          >
            <span className="hidden sm:inline">{language === 'hi' ? 'अगला' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ── REPORT MODAL ── */}
      {currentQ && (
        <ReportIssueModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          questionId={currentQ?.question?._id || ''}
          questionSource={
            String(currentQ?.question?._id || '').startsWith('pyq_') ? 'pyq' : 'bank'
          }
          testId={test?._id}
          questionIndex={currentQ ? currentQ.questionNumber - 1 : 0}
          language={language}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PALETTE CONTENT
// ══════════════════════════════════════════════════════════════════════════════
const PaletteContent = ({
  allQ, filteredQ, currentIdx, filter, onJump, counts, language, bookmarked,
}) => {
  const currentQNum = filteredQ[currentIdx]?.questionNumber;
  return (
    <div className="p-4 space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          {language === 'hi' ? 'सही' : 'Correct'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          {language === 'hi' ? 'गलत' : 'Wrong'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400" />
          {language === 'hi' ? 'छोड़ा' : 'Skipped'}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {allQ.map((q, i) => {
          const isCurrent  = q.questionNumber === currentQNum;
          const inFilter   = filteredQ.some(fq => fq.questionNumber === q.questionNumber);
          const disabled   = !inFilter && filter !== 'all';
          const isBM       = bookmarked.has(q.questionNumber);
          let cc = 'bg-gray-200 dark:bg-secondary-600 text-gray-600 dark:text-secondary-400';
          if (q.isCorrect)                          cc = 'bg-emerald-500 text-white';
          else if (!isSkipped(q.selectedAnswer))    cc = 'bg-red-500 text-white';
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              disabled={disabled}
              className={`relative aspect-square rounded-lg text-xs font-bold flex items-center justify-center
                          transition-all duration-200 ${cc}
                          ${isCurrent ? 'ring-3 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-800 scale-110 z-10 shadow-lg' : ''}
                          ${disabled  ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
            >
              {q.questionNumber}
              {isBM && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white dark:border-secondary-800" />
              )}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-600 space-y-2.5">
        <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider mb-3">
          {language === 'hi' ? 'सारांश' : 'Summary'}
        </h4>
        {[
          { label: language === 'hi' ? 'कुल'  : 'Total',   val: counts.all,     color: 'text-gray-900 dark:text-white' },
          { label: language === 'hi' ? 'सही'  : 'Correct', val: counts.correct, color: 'text-emerald-600' },
          { label: language === 'hi' ? 'गलत'  : 'Wrong',   val: counts.wrong,   color: 'text-red-600' },
          { label: language === 'hi' ? 'छोड़ा' : 'Skipped', val: counts.skipped, color: 'text-gray-500' },
        ].map((r, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className={`${r.color} font-medium`}>{r.label}</span>
            <span className={`font-bold ${r.color}`}>{r.val}</span>
          </div>
        ))}
        {counts.all > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-secondary-600 flex justify-between items-center text-sm">
            <span className="text-primary-600 font-medium">{language === 'hi' ? 'सटीकता' : 'Accuracy'}</span>
            <span className="font-black text-primary-600 text-base">
              {Math.round((counts.correct / counts.all) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// QUESTION CARD
// ══════════════════════════════════════════════════════════════════════════════
const QCard = ({
  question: q,
  language,
  index,
  total,
  isBookmarked,
  onToggleBookmark,
  showExplanation,
  onToggleExplanation,
  onReport,
}) => {
  const qData = q.question;
  if (!qData) return null;

  const qType      = qData.questionType;
  const difficulty = qData.difficulty || 'medium';
  const typeLbl    = TYPE_LABELS[qType]?.[language] || qType;
  const diffLbl    = DIFF_LABELS[difficulty]?.[language] || difficulty;

  const rc = q.isCorrect
    ? {
        icon:  CheckCircle,
        label: language === 'hi' ? 'सही' : 'Correct',
        cls:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        hdr:   'from-emerald-500/5 to-green-500/5',
      }
    : !isSkipped(q.selectedAnswer)
    ? {
        icon:  XCircle,
        label: language === 'hi' ? 'गलत' : 'Wrong',
        cls:   'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
        hdr:   'from-red-500/5 to-rose-500/5',
      }
    : {
        icon:  Circle,
        label: language === 'hi' ? 'छोड़ा' : 'Skipped',
        cls:   'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 border-gray-200 dark:border-secondary-600',
        hdr:   'from-gray-500/5 to-slate-500/5',
      };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden flex flex-col h-full">

      {/* Card header */}
      <div className={`px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-secondary-700 bg-gradient-to-r ${rc.hdr}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Left: number + badges */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-secondary-700 shadow-sm border border-gray-200 dark:border-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-black text-gray-900 dark:text-white">{q.questionNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold rounded uppercase">
                {typeLbl}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700'
                : difficulty === 'hard' ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
              }`}>{diffLbl}</span>
            </div>
          </div>

          {/* Right: time + report + bookmark + status */}
          <div className="flex items-center gap-2">
            {q.timeTaken > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-white dark:bg-secondary-700 px-2.5 py-1 rounded-lg border">
                <Clock className="w-3 h-3" /> {q.timeTaken}s
              </span>
            )}

            {/* Report button */}
            <button
              onClick={() => onReport?.()}
              title={language === 'hi' ? 'रिपोर्ट करें' : 'Report Issue'}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400
                         hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40
                         transition-colors active:scale-90"
            >
              <Flag className="w-4 h-4" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={onToggleBookmark}
              className={`p-1.5 rounded-lg transition-all ${
                isBookmarked
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                  : 'bg-gray-100 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Status pill */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${rc.cls}`}>
              <rc.icon className="w-4 h-4" /> {rc.label}
            </span>
          </div>
        </div>

        {/* Topic breadcrumb */}
        {(qData.unit || qData.chapter || qData.topic) && (
          <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-secondary-600/50 flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto">
            <Tag className="w-3 h-3 flex-shrink-0" />
            {[qData.unit, qData.chapter, qData.topic].filter(Boolean).join(' › ')}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x border-t dark:border-secondary-700 border-gray-100">
        
        {/* Left Side: Question and Options */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <QContent qData={qData} language={language} />
          <OptsDisplay
            qData={qData}
            language={language}
            selectedAnswer={q.selectedAnswer}
            correctAnswer={q.correctAnswer}
          />
        </div>

        {/* Right Side: Explanation */}
        <div className="lg:w-[40%] xl:w-[35%] p-5 sm:p-6 lg:p-8 space-y-6 overflow-y-auto bg-gray-50/50 dark:bg-secondary-900/20">
          
          {/* Your answer vs correct answer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{language === 'hi' ? 'आपका:' : 'Yours:'}</span>
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${
                isSkipped(q.selectedAnswer) ? 'bg-gray-200 text-gray-600'
                : q.isCorrect              ? 'bg-emerald-100 text-emerald-700'
                :                            'bg-red-100 text-red-700'
              }`}>
                {isSkipped(q.selectedAnswer)
                  ? (language === 'hi' ? 'नहीं दिया' : 'N/A')
                  : `(${q.selectedAnswer + 1})`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{language === 'hi' ? 'सही:' : 'Correct:'}</span>
              <span className="text-sm font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-lg">
                ({q.correctAnswer + 1})
              </span>
            </div>
          </div>

          {/* Explanation */}
          {qData.explanation &&
            (bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')) && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-secondary-700">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {language === 'hi' ? 'व्याख्या (Explanation)' : 'Explanation'}
                </span>
              </div>
              <div className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">
                {bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// QUESTION CONTENT (type-aware renderer)
// ══════════════════════════════════════════════════════════════════════════════
const QContent = ({ qData, language }) => {
  const qType = qData.questionType;
  const qt    = bText(qData.question, language);

  // ── Passage based ──────────────────────────────────────────────────────────
  if (qType === 'passage_based' && qData.passageId) {
    const pc = bText(qData.passageId.content, language);
    return (
      <div className="space-y-4">
        {pc && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-xl max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              {language === 'hi' ? 'गद्यांश' : 'PASSAGE'}
            </div>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{pc}</p>
          </div>
        )}
        <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">{qt}</p>
      </div>
    );
  }

  // ── Assertion-Reason ───────────────────────────────────────────────────────
  if (qType === 'assertion_reason') {
    const a = bText(qData.assertionReasonData?.assertion, language);
    const r = bText(qData.assertionReasonData?.reason,    language);
    return (
      <div className="space-y-4">
        {qt && <p className="text-gray-700 dark:text-secondary-300 font-medium text-sm">{qt}</p>}
        <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</span>
          <div>
            <p className="text-xs font-bold text-blue-700 mb-1 uppercase">{language === 'hi' ? 'अभिकथन' : 'Assertion (A)'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200">{a}</p>
          </div>
        </div>
        <div className="flex gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">R</span>
          <div>
            <p className="text-xs font-bold text-purple-700 mb-1 uppercase">{language === 'hi' ? 'कारण' : 'Reason (R)'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200">{r}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Match the following ────────────────────────────────────────────────────
  if (qType === 'match_following') {
    const la = bArr(qData.matchData?.listA, language);
    const lb = bArr(qData.matchData?.listB, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium text-base">
          {qt || (language === 'hi' ? 'सुमेलित कीजिए:' : 'Match:')}
        </p>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-secondary-600">
          <div className="grid grid-cols-2 bg-gray-100 dark:bg-secondary-700 border-b text-gray-800 dark:text-secondary-200">
            <div className="px-4 py-2.5 font-bold text-sm border-r">{language === 'hi' ? 'सूची-I' : 'List-I'}</div>
            <div className="px-4 py-2.5 font-bold text-sm">{language === 'hi' ? 'सूची-II' : 'List-II'}</div>
          </div>
          {la.map((a, i) => (
            <div key={i} className="grid grid-cols-2 border-b last:border-0 text-gray-800 dark:text-secondary-200">
              <div className="px-4 py-3 text-sm border-r">
                <span className="font-bold text-primary-600 mr-1">({optLabel(i)})</span>{a}
              </div>
              <div className="px-4 py-3 text-sm">
                <span className="font-bold text-primary-600 mr-1">{roman(i)}</span>{lb[i] || ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Statement based ────────────────────────────────────────────────────────
  if (qType === 'statement_based') {
    const stmts = bArr(qData.statementData?.statements, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium text-base">
          {qt || (language === 'hi' ? 'कथनों पर विचार:' : 'Consider statements:')}
        </p>
        <div className="space-y-2">
          {stmts.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-secondary-600 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-gray-800 dark:text-secondary-200 pt-0.5">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Sequence order ─────────────────────────────────────────────────────────
  if (qType === 'sequence_order') {
    const items = bArr(qData.sequenceData?.items, language);
    const opts = bArr(qData.options, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium text-base">
          {qt || (language === 'hi' ? 'क्रम व्यवस्थित करें:' : 'Arrange:')}
        </p>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700">
                {getSequenceItemLabel(i, opts)}
              </span>
              <span className="text-sm text-gray-800 dark:text-secondary-200">{it}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Data Interpretation ────────────────────────────────────────────────────
  const DI_TYPES = ['di_table', 'di_bar_chart', 'di_pie_chart', 'di_line_graph', 'di_caselet', 'di_mixed'];
  if (DI_TYPES.includes(qType) && qData.diDataId) {
    const di = qData.diDataId;
    const chartData = bArr(di.chartData?.labels, language).map((l, i) => {
      const it = { name: l };
      (di.chartData?.datasets || []).forEach((ds, d) => {
        it[bText(ds.label, language) || `S${d + 1}`] = ds.data[i] || 0;
      });
      return it;
    });

    return (
      <div className="space-y-4">
        {bText(di.title, language) && (
          <h4 className="font-bold text-gray-900 dark:text-white text-center">{bText(di.title, language)}</h4>
        )}
        {bText(di.instruction, language) && (
          <p className="text-sm text-gray-600 italic">{bText(di.instruction, language)}</p>
        )}
        <div className="bg-white dark:bg-secondary-800 border rounded-xl p-4 overflow-x-auto">
          {qType === 'di_table' && (
            <table className="w-full border-collapse text-sm text-gray-800 dark:text-secondary-200">
              <thead>
                <tr className="bg-gray-100 dark:bg-secondary-700">
                  {bArr(di.tableData?.headers, language).map((h, i) => (
                    <th key={i} className="border border-gray-200 dark:border-secondary-600 px-3 py-2 font-bold text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(di.tableData?.rows || []).map((row, ri) => (
                  <tr key={ri} className={ri % 2 ? 'bg-gray-50 dark:bg-secondary-750' : 'bg-white dark:bg-secondary-800'}>
                    {row.map((c, ci) => <td key={ci} className="border border-gray-200 dark:border-secondary-600 px-3 py-2">{c ?? '-'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {['di_bar_chart', 'di_line_graph', 'di_pie_chart'].includes(qType) && (
            <div className="h-64 w-full min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {qType === 'di_bar_chart' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip /><Legend />
                    {(di.chartData?.datasets || []).map((ds, i) => (
                      <Bar key={i} dataKey={bText(ds.label, language) || `S${i + 1}`}
                        fill={ds.color || CHART_COLORS[i % CHART_COLORS.length]}
                        radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                ) : qType === 'di_line_graph' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip /><Legend />
                    {(di.chartData?.datasets || []).map((ds, i) => (
                      <Line key={i} type="monotone"
                        dataKey={bText(ds.label, language) || `S${i + 1}`}
                        stroke={ds.color || CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2} />
                    ))}
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={bArr(di.chartData?.labels, language).map((l, i) => ({
                        name: l,
                        value: di.chartData?.datasets?.[0]?.data?.[i] || 0,
                      }))}
                      cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                    >
                      {bArr(di.chartData?.labels, language).map((_, i) => (
                        <Cell key={i}
                          fill={(di.chartData?.datasets?.[0]?.colors || CHART_COLORS)[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {qType === 'di_caselet' && bText(di.caseletText, language) && (
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">
              {bText(di.caseletText, language)}
            </p>
          )}
        </div>
        <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed mt-4">{qt}</p>
      </div>
    );
  }

  // ── Default (MCQ / plain) ──────────────────────────────────────────────────
  return (
    <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">{qt}</p>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// OPTIONS DISPLAY
// ══════════════════════════════════════════════════════════════════════════════
const OptsDisplay = ({ qData, language, selectedAnswer, correctAnswer }) => {
  const options = resolveOptions(qData, language);

  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const isC  = i === correctAnswer;
        const isSel = i === selectedAnswer;
        const isW  = isSel && !isC;

        let cc = 'border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-800';
        let ic = <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-secondary-500" />;
        let tc = 'text-gray-800 dark:text-secondary-300';

        if (isC) {
          cc = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-400/50';
          ic = <CheckCircle className="w-6 h-6 text-emerald-600" />;
          tc = 'text-emerald-800 dark:text-emerald-200 font-medium';
        } else if (isW) {
          cc = 'border-red-400 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400/50';
          ic = <XCircle className="w-6 h-6 text-red-600" />;
          tc = 'text-red-800 dark:text-red-200 font-medium';
        }

        return (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${cc}`}>
            <div className="flex-shrink-0 mt-0.5">{ic}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm opacity-60">({i + 1})</span>
                {isC && (
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                    {language === 'hi' ? 'सही' : 'Correct'}
                  </span>
                )}
                {isW && (
                  <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">
                    {language === 'hi' ? 'आपका' : 'Yours'}
                  </span>
                )}
              </div>
              <p className={`text-sm sm:text-base leading-relaxed ${tc}`}>{opt}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SolutionView;