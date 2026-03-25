import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle, Circle,
  Clock, BookOpen, Tag, Menu, X, Filter, AlertTriangle, Languages,
  Hash, Zap, Eye, Share2, ChevronDown, ChevronUp, Lightbulb,
  SkipForward, Bookmark, ThumbsUp, ThumbsDown
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

// Touch/Swipe support
const useSwipe = (onLeft, onRight) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipe = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const dist = touchStart - touchEnd;
    if (Math.abs(dist) > minSwipe) {
      if (dist > 0) onLeft();
      else onRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const SolutionPage = ({ language: propLang = 'en' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showPalette, setShowPalette] = useState(false);
  const [language, setLanguage] = useState(propLang);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [showExplanation, setShowExplanation] = useState(true);
  const [animDir, setAnimDir] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await attemptService.getAttemptReview(id);
        setReviewData(r.data);
      } catch (e) { console.error('Failed to load review:', e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const toggleLang = () => {
    const next = language === 'hi' ? 'en' : 'hi';
    setLanguage(next);
    try { localStorage.setItem('netprep_lang', next); } catch {}
  };

  const allQ = reviewData?.questions || [];
  const filteredQ = useMemo(() => {
    if (filter === 'correct') return allQ.filter(q => q.isCorrect);
    if (filter === 'wrong') return allQ.filter(q => !q.isCorrect && q.selectedAnswer !== -1);
    if (filter === 'skipped') return allQ.filter(q => q.selectedAnswer === -1);
    if (filter === 'bookmarked') return allQ.filter(q => bookmarked.has(q.questionNumber));
    return allQ;
  }, [allQ, filter, bookmarked]);

  const currentQ = filteredQ[currentIdx] || null;

  const counts = useMemo(() => ({
    all: allQ.length,
    correct: allQ.filter(q => q.isCorrect).length,
    wrong: allQ.filter(q => !q.isCorrect && q.selectedAnswer !== -1).length,
    skipped: allQ.filter(q => q.selectedAnswer === -1).length,
    bookmarked: bookmarked.size,
  }), [allQ, bookmarked]);

  const goTo = useCallback((i, dir) => {
    if (i >= 0 && i < filteredQ.length) {
      setAnimDir(dir || (i > currentIdx ? 'right' : 'left'));
      setCurrentIdx(i);
      document.getElementById('solution-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filteredQ.length, currentIdx]);

  const goNext = () => goTo(currentIdx + 1, 'right');
  const goPrev = () => goTo(currentIdx - 1, 'left');

  // Swipe
  const swipeHandlers = useSwipe(goNext, goPrev);

  const goToByOriginalIndex = useCallback((origIdx) => {
    const q = allQ[origIdx];
    if (!q) return;
    const filtIdx = filteredQ.findIndex(fq => fq.questionNumber === q.questionNumber);
    if (filtIdx !== -1) goTo(filtIdx);
    else { setFilter('all'); setTimeout(() => goTo(origIdx), 50); }
    setShowPalette(false);
  }, [allQ, filteredQ, goTo]);

  const toggleBookmark = (qNum) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(qNum)) next.delete(qNum);
      else next.add(qNum);
      return next;
    });
  };

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'b' || e.key === 'B') {
        if (currentQ) toggleBookmark(currentQ.questionNumber);
      }
      if (e.key === 'e' || e.key === 'E') setShowExplanation(p => !p);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, currentQ]);

  useEffect(() => { setCurrentIdx(0); }, [filter]);

  // Clear animation
  useEffect(() => {
    const t = setTimeout(() => setAnimDir(''), 300);
    return () => clearTimeout(t);
  }, [currentIdx]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-primary-500 animate-pulse" />
          </div>
          <p className="text-gray-500 font-medium">{language === 'hi' ? 'समाधान लोड हो रहे हैं...' : 'Loading solutions...'}</p>
        </div>
      </div>
    );
  }

  if (!reviewData || allQ.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-secondary-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium mb-2">{language === 'hi' ? 'समाधान उपलब्ध नहीं' : 'Solutions not available'}</p>
          <p className="text-gray-400 text-sm mb-6">{language === 'hi' ? 'कृपया पुनः प्रयास करें' : 'Please try again'}</p>
          <button onClick={() => navigate(-1)} className="btn-primary px-6 py-2.5 rounded-xl">
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const a = reviewData.attempt;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex flex-col">

      {/* ═══════ HEADER ═══════ */}
      <header className="bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-3 sm:px-5 py-3">
          <button onClick={() => navigate(`/results/${id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              {reviewData.test.title}
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-secondary-500 hidden sm:block">
              {language === 'hi' ? 'विस्तृत समाधान' : 'Detailed Solutions'}
            </p>
          </div>

          {/* Desktop Score Summary */}
          <div className="hidden md:flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg text-sm">
              <CheckCircle className="w-3.5 h-3.5" /> {counts.correct}
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-lg text-sm">
              <XCircle className="w-3.5 h-3.5" /> {counts.wrong}
            </span>
            <span className="flex items-center gap-1 text-gray-500 font-bold bg-gray-100 dark:bg-secondary-700 px-2.5 py-1 rounded-lg text-sm">
              <Circle className="w-3.5 h-3.5" /> {counts.skipped}
            </span>
            <span className={`font-black text-lg ml-1 ${a.percentage >= 60 ? 'text-emerald-600' : a.percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
              {a.percentage}%
            </span>
          </div>

          {/* Language Toggle */}
          <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 text-gray-700 dark:text-secondary-300 transition-colors text-sm font-medium">
            <Languages className="w-4 h-4" />
            <span className="font-bold text-xs">{language === 'hi' ? 'EN' : 'हि'}</span>
          </button>

          {/* Mobile Palette Toggle */}
          <button onClick={() => setShowPalette(true)} className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 transition-colors">
            <Menu className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 px-3 sm:px-5 pb-2.5 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: language === 'hi' ? 'सभी' : 'All', count: counts.all, icon: Hash, activeClass: 'bg-primary-600 text-white' },
            { id: 'correct', label: language === 'hi' ? 'सही' : 'Correct', count: counts.correct, icon: CheckCircle, activeClass: 'bg-emerald-600 text-white' },
            { id: 'wrong', label: language === 'hi' ? 'गलत' : 'Wrong', count: counts.wrong, icon: XCircle, activeClass: 'bg-red-600 text-white' },
            { id: 'skipped', label: language === 'hi' ? 'छोड़े' : 'Skipped', count: counts.skipped, icon: Circle, activeClass: 'bg-gray-600 text-white' },
            ...(bookmarked.size > 0 ? [{ id: 'bookmarked', label: language === 'hi' ? 'बुकमार्क' : 'Saved', count: counts.bookmarked, icon: Bookmark, activeClass: 'bg-amber-600 text-white' }] : []),
          ].map(tab => (
            <button
              key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id ? tab.activeClass + ' shadow-sm' : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.id ? 'bg-white/25' : 'bg-gray-200 dark:bg-secondary-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-secondary-700">
          <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${filteredQ.length > 0 ? ((currentIdx + 1) / filteredQ.length) * 100 : 0}%` }} />
        </div>
      </header>

      {/* ═══════ MAIN ═══════ */}
      <div className="flex-1 flex overflow-hidden" {...swipeHandlers}>
        <main id="solution-scroll" className="flex-1 lg:mr-72 overflow-y-auto">
          {filteredQ.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Filter className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions found'}</p>
              <button onClick={() => setFilter('all')} className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
                {language === 'hi' ? 'सभी दिखाएं' : 'Show All'}
              </button>
            </div>
          ) : currentQ ? (
            <div className={`max-w-4xl mx-auto p-4 sm:p-6 pb-8 ${
              animDir === 'right' ? 'animate-slide-left' : animDir === 'left' ? 'animate-slide-right' : 'animate-fade-in'
            }`}>
              <QuestionSolutionCard
                question={currentQ}
                language={language}
                index={currentIdx}
                total={filteredQ.length}
                isBookmarked={bookmarked.has(currentQ.questionNumber)}
                onToggleBookmark={() => toggleBookmark(currentQ.questionNumber)}
                showExplanation={showExplanation}
                onToggleExplanation={() => setShowExplanation(p => !p)}
              />

              {/* Keyboard shortcuts hint */}
              <div className="hidden lg:flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
                <span>← → {language === 'hi' ? 'नेविगेट' : 'Navigate'}</span>
                <span>B = {language === 'hi' ? 'बुकमार्क' : 'Bookmark'}</span>
                <span>E = {language === 'hi' ? 'व्याख्या' : 'Explanation'}</span>
              </div>
            </div>
          ) : null}
        </main>

        {/* Desktop Sidebar Palette */}
        <aside className="hidden lg:flex flex-col fixed right-0 top-[106px] bottom-[60px] w-72 bg-white dark:bg-secondary-800 border-l dark:border-secondary-700">
          <div className="p-4 border-b dark:border-secondary-700 bg-gray-50 dark:bg-secondary-750/50">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary-500" />
              {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter}
              onJump={goToByOriginalIndex} counts={counts} language={language} bookmarked={bookmarked} />
          </div>
        </aside>

        {/* Mobile Palette Drawer */}
        {showPalette && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
            <aside className="relative w-80 max-w-[85vw] bg-white dark:bg-secondary-800 h-full flex flex-col shadow-2xl animate-slide-left">
              <div className="flex items-center justify-between p-4 border-b dark:border-secondary-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-primary-500" />
                  {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
                </h3>
                <button onClick={() => setShowPalette(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter}
                  onJump={goToByOriginalIndex} counts={counts} language={language} bookmarked={bookmarked} />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-white dark:bg-secondary-800 border-t dark:border-secondary-700 sticky bottom-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={goPrev} disabled={currentIdx <= 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-secondary-600 text-gray-700 dark:text-secondary-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'hi' ? 'पिछला' : 'Previous'}</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Jump to input */}
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-100 dark:bg-secondary-700 rounded-xl px-3 py-1.5">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{currentIdx + 1}</span>
              <span className="text-gray-400">/</span>
              <span className="text-sm text-gray-600 dark:text-secondary-400">{filteredQ.length}</span>
            </div>

            {/* Quick actions */}
            {currentQ && (
              <button
                onClick={() => toggleBookmark(currentQ.questionNumber)}
                className={`p-2 rounded-xl transition-all ${
                  bookmarked.has(currentQ.questionNumber)
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    : 'bg-gray-100 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'
                }`}
                title={language === 'hi' ? 'बुकमार्क (B)' : 'Bookmark (B)'}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked.has(currentQ.questionNumber) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          <button onClick={goNext} disabled={currentIdx >= filteredQ.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 active:scale-95">
            <span className="hidden sm:inline">{language === 'hi' ? 'अगला' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//                  PALETTE CONTENT
// ═══════════════════════════════════════════════════════
const PaletteContent = ({ allQ, filteredQ, currentIdx, filter, onJump, counts, language, bookmarked }) => {
  const currentQNum = filteredQ[currentIdx]?.questionNumber;
  return (
    <div className="p-4 space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" /> {language === 'hi' ? 'सही' : 'Correct'}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" /> {language === 'hi' ? 'गलत' : 'Wrong'}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400 shadow-sm" /> {language === 'hi' ? 'छोड़ा' : 'Skipped'}</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {allQ.map((q, i) => {
          const isCurrent = q.questionNumber === currentQNum;
          const inFilter = filteredQ.some(fq => fq.questionNumber === q.questionNumber);
          const disabled = !inFilter && filter !== 'all';
          const isBM = bookmarked.has(q.questionNumber);

          let colorClass = 'bg-gray-200 dark:bg-secondary-600 text-gray-600 dark:text-secondary-400';
          if (q.isCorrect) colorClass = 'bg-emerald-500 text-white';
          else if (q.selectedAnswer !== -1) colorClass = 'bg-red-500 text-white';

          return (
            <button key={i} onClick={() => onJump(i)} disabled={disabled}
              className={`relative aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200
                ${colorClass}
                ${isCurrent ? 'ring-3 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-800 scale-110 z-10 shadow-lg' : ''}
                ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-95'}
              `}>
              {q.questionNumber}
              {isBM && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white dark:border-secondary-800" />}
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
          { label: language === 'hi' ? 'कुल' : 'Total', val: counts.all, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-200 dark:bg-secondary-600' },
          { label: language === 'hi' ? 'सही' : 'Correct', val: counts.correct, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: language === 'hi' ? 'गलत' : 'Wrong', val: counts.wrong, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
          { label: language === 'hi' ? 'छोड़ा' : 'Skipped', val: counts.skipped, color: 'text-gray-500', bg: 'bg-gray-200 dark:bg-secondary-600' },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className={`${row.color} font-medium`}>{row.label}</span>
            <span className={`font-bold ${row.color} ${row.bg} px-2.5 py-0.5 rounded-md text-xs`}>{row.val}</span>
          </div>
        ))}
        {counts.all > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-secondary-600">
            <div className="flex justify-between items-center text-sm">
              <span className="text-primary-600 dark:text-primary-400 font-medium">{language === 'hi' ? 'सटीकता' : 'Accuracy'}</span>
              <span className="font-black text-primary-600 dark:text-primary-400 text-base">
                {Math.round((counts.correct / counts.all) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//              QUESTION SOLUTION CARD
// ═══════════════════════════════════════════════════════
const QuestionSolutionCard = ({ question: q, language, index, total, isBookmarked, onToggleBookmark, showExplanation, onToggleExplanation }) => {
  const qData = q.question;
  if (!qData) return null;

  const qType = qData.questionType;
  const difficulty = qData.difficulty || 'medium';
  const typeLbl = QUESTION_TYPE_LABELS[qType]?.[language] || qType;
  const diffLbl = DIFFICULTY_LABELS[difficulty]?.[language] || difficulty;

  const resultConfig = q.isCorrect
    ? { icon: CheckCircle, label: language === 'hi' ? 'सही' : 'Correct', class: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', headerBg: 'from-emerald-500/5 to-green-500/5' }
    : q.selectedAnswer !== -1
    ? { icon: XCircle, label: language === 'hi' ? 'गलत' : 'Wrong', class: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', headerBg: 'from-red-500/5 to-rose-500/5' }
    : { icon: Circle, label: language === 'hi' ? 'छोड़ा' : 'Skipped', class: 'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 border-gray-200 dark:border-secondary-600', headerBg: 'from-gray-500/5 to-slate-500/5' };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
      {/* Card Header */}
      <div className={`px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-secondary-700 bg-gradient-to-r ${resultConfig.headerBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-secondary-700 shadow-sm border border-gray-200 dark:border-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-black text-gray-900 dark:text-white">{q.questionNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold rounded uppercase">{typeLbl}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>{diffLbl}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {q.timeTaken > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-white dark:bg-secondary-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-secondary-600">
                <Clock className="w-3 h-3" /> {q.timeTaken}s
              </span>
            )}
            <button onClick={onToggleBookmark}
              className={`p-1.5 rounded-lg transition-all ${isBookmarked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-100 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'}`}>
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${resultConfig.class}`}>
              <resultConfig.icon className="w-4 h-4" /> {resultConfig.label}
            </span>
          </div>
        </div>

        {(qData.unit || qData.chapter || qData.topic) && (
          <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-secondary-600/50 flex items-center gap-1.5 text-xs text-gray-500 dark:text-secondary-400 overflow-x-auto">
            <Tag className="w-3 h-3 flex-shrink-0" />
            {[qData.unit, qData.chapter, qData.topic].filter(Boolean).join(' › ')}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 lg:p-8 space-y-6">
        <QuestionContent qData={qData} language={language} />
        <OptionsDisplay qData={qData} language={language} selectedAnswer={q.selectedAnswer} correctAnswer={q.correctAnswer} />

        {/* Answer Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-600">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{language === 'hi' ? 'आपका उत्तर:' : 'Your Answer:'}</span>
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${
              q.selectedAnswer === -1 ? 'bg-gray-200 text-gray-600 dark:bg-secondary-600 dark:text-secondary-300'
                : q.isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {q.selectedAnswer === -1 ? (language === 'hi' ? 'नहीं दिया' : 'Not Answered') : `(${optLabel(q.selectedAnswer)})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{language === 'hi' ? 'सही उत्तर:' : 'Correct:'}</span>
            <span className="text-sm font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg">
              ({optLabel(q.correctAnswer)})
            </span>
          </div>
        </div>

        {/* Explanation Toggle */}
        {qData.explanation && (bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')) && (
          <div>
            <button onClick={onToggleExplanation}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors mb-3">
              <Lightbulb className="w-4 h-4" />
              {language === 'hi' ? 'व्याख्या' : 'Explanation'}
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-xs text-gray-400 font-normal ml-1">(E)</span>
            </button>
            {showExplanation && (
              <div className="p-5 bg-blue-50/70 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-blue-900 dark:text-blue-300">{language === 'hi' ? 'समाधान' : 'Solution'}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">
                  {bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//     QUESTION CONTENT (all types)
// ═══════════════════════════════════════════════════════
const QuestionContent = ({ qData, language }) => {
  const qType = qData.questionType;
  const questionText = bText(qData.question, language);

  if (qType === 'passage_based' && qData.passageId) {
    const passageContent = bText(qData.passageId.content, language);
    return (
      <div className="space-y-4">
        {passageContent && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-xl max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" /> {language === 'hi' ? 'गद्यांश' : 'PASSAGE'}
            </div>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{passageContent}</p>
          </div>
        )}
        <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">{questionText}</p>
      </div>
    );
  }

  if (qType === 'assertion_reason') {
    const assertion = bText(qData.assertionReasonData?.assertion, language);
    const reason = bText(qData.assertionReasonData?.reason, language);
    return (
      <div className="space-y-4">
        {questionText && <p className="text-gray-700 dark:text-secondary-300 font-medium text-sm">{questionText}</p>}
        <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</span>
          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase">{language === 'hi' ? 'अभिकथन' : 'Assertion (A)'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200">{assertion}</p>
          </div>
        </div>
        <div className="flex gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">R</span>
          <div>
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1 uppercase">{language === 'hi' ? 'कारण' : 'Reason (R)'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200">{reason}</p>
          </div>
        </div>
      </div>
    );
  }

  if (qType === 'match_following') {
    const listA = bArr(qData.matchData?.listA, language);
    const listB = bArr(qData.matchData?.listB, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium text-base">{questionText || (language === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:')}</p>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-secondary-600">
          <div className="grid grid-cols-2 bg-gray-100 dark:bg-secondary-700 border-b border-gray-200 dark:border-secondary-600">
            <div className="px-4 py-2.5 font-bold text-sm border-r border-gray-200 dark:border-secondary-600">{language === 'hi' ? 'सूची-I' : 'List-I'}</div>
            <div className="px-4 py-2.5 font-bold text-sm">{language === 'hi' ? 'सूची-II' : 'List-II'}</div>
          </div>
          {listA.map((a, i) => (
            <div key={i} className="grid grid-cols-2 border-b border-gray-100 dark:border-secondary-700 last:border-0">
              <div className="px-4 py-3 text-sm border-r border-gray-100 dark:border-secondary-700"><span className="font-bold text-primary-600 mr-1">({optLabel(i)})</span> {a}</div>
              <div className="px-4 py-3 text-sm"><span className="font-bold text-primary-600 mr-1">{roman(i)}</span> {listB[i] || ''}</div>
            </div>
          ))}
        </div>
        {qData.matchData?.correctMatch && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-800 dark:text-emerald-300">{language === 'hi' ? 'सही मिलान:' : 'Correct:'}</span>
            <span className="text-emerald-700 dark:text-emerald-400">{qData.matchData.correctMatch.map((m, i) => `${optLabel(i)}-${roman(m)}`).join(', ')}</span>
          </div>
        )}
      </div>
    );
  }

  if (qType === 'statement_based') {
    const stmts = bArr(qData.statementData?.statements, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium text-base">{questionText || (language === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:')}</p>
        <div className="space-y-2">
          {stmts.map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-secondary-600 flex items-center justify-center text-xs font-bold shadow-sm">{i + 1}</span>
              <span className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pt-0.5">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (qType === 'sequence_order') {
    const items = bArr(qData.sequenceData?.items, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium text-base">{questionText || (language === 'hi' ? 'सही क्रम में व्यवस्थित कीजिए:' : 'Arrange in correct order:')}</p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700">{optLabel(i)}</span>
              <span className="text-sm text-gray-800 dark:text-secondary-200">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // DI types
  if (['di_table', 'di_bar_chart', 'di_pie_chart', 'di_line_graph', 'di_caselet', 'di_mixed'].includes(qType) && qData.diDataId) {
    const di = qData.diDataId;
    return (
      <div className="space-y-4">
        {bText(di.title, language) && <h4 className="font-bold text-gray-900 dark:text-white text-center">{bText(di.title, language)}</h4>}
        {bText(di.instruction, language) && <p className="text-sm text-gray-600 dark:text-secondary-400 italic">{bText(di.instruction, language)}</p>}

        <div className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl p-4 overflow-x-auto">
          {qType === 'di_table' && (
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-100 dark:bg-secondary-700">
                {bArr(di.tableData?.headers, language).map((h, i) => <th key={i} className="border border-gray-300 dark:border-secondary-600 px-3 py-2 font-bold text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {(di.tableData?.rows || []).map((row, ri) => (
                  <tr key={ri} className={ri % 2 ? 'bg-gray-50 dark:bg-secondary-750' : ''}>
                    {row.map((cell, ci) => <td key={ci} className="border border-gray-300 dark:border-secondary-600 px-3 py-2">{cell ?? '-'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(qType === 'di_bar_chart' || qType === 'di_line_graph' || qType === 'di_pie_chart') && (
            <div className="h-64 w-full min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {qType === 'di_bar_chart' ? (
                  <BarChart data={bArr(di.chartData?.labels, language).map((l, i) => {
                    const item = { name: l };
                    (di.chartData?.datasets || []).forEach((ds, d) => { item[bText(ds.label, language) || `S${d+1}`] = ds.data[i] || 0; });
                    return item;
                  })}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                    {(di.chartData?.datasets || []).map((ds, i) => <Bar key={i} dataKey={bText(ds.label, language) || `S${i+1}`} fill={ds.color || COLORS[i % COLORS.length]} radius={[4,4,0,0]} />)}
                  </BarChart>
                ) : qType === 'di_line_graph' ? (
                  <LineChart data={bArr(di.chartData?.labels, language).map((l, i) => {
                    const item = { name: l };
                    (di.chartData?.datasets || []).forEach((ds, d) => { item[bText(ds.label, language) || `S${d+1}`] = ds.data[i] || 0; });
                    return item;
                  })}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                    {(di.chartData?.datasets || []).map((ds, i) => <Line key={i} type="monotone" dataKey={bText(ds.label, language) || `S${i+1}`} stroke={ds.color || COLORS[i % COLORS.length]} strokeWidth={2} />)}
                  </LineChart>
                ) : (
                  <PieChart><Pie data={bArr(di.chartData?.labels, language).map((l, i) => ({ name: l, value: di.chartData?.datasets?.[0]?.data?.[i] || 0 }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {bArr(di.chartData?.labels, language).map((_, i) => <Cell key={i} fill={(di.chartData?.datasets?.[0]?.colors || COLORS)[i % COLORS.length]} />)}
                  </Pie><Tooltip /><Legend /></PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {qType === 'di_caselet' && bText(di.caseletText, language) && (
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{bText(di.caseletText, language)}</p>
          )}
        </div>
        <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed mt-4">{questionText}</p>
      </div>
    );
  }

  return <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">{questionText}</p>;
};

// ═══════════════════════════════════════════════════════
//     OPTIONS DISPLAY
// ═══════════════════════════════════════════════════════
const OptionsDisplay = ({ qData, language, selectedAnswer, correctAnswer }) => {
  const options = bArr(qData.options, language);

  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const isCorrect = i === correctAnswer;
        const isSelected = i === selectedAnswer;
        const isWrong = isSelected && !isCorrect;

        let containerClass = 'border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-800';
        let icon = <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-secondary-500" />;
        let textClass = 'text-gray-700 dark:text-secondary-300';

        if (isCorrect) {
          containerClass = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-400/50';
          icon = <CheckCircle className="w-6 h-6 text-emerald-600" />;
          textClass = 'text-emerald-800 dark:text-emerald-200 font-medium';
        } else if (isWrong) {
          containerClass = 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400/50';
          icon = <XCircle className="w-6 h-6 text-red-600" />;
          textClass = 'text-red-800 dark:text-red-200 font-medium';
        }

        return (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${containerClass}`}>
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm opacity-60">({optLabel(i)})</span>
                {isCorrect && (
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {language === 'hi' ? 'सही उत्तर' : 'Correct'}
                  </span>
                )}
                {isWrong && (
                  <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {language === 'hi' ? 'आपका उत्तर' : 'Your Answer'}
                  </span>
                )}
              </div>
              <p className={`text-sm sm:text-base leading-relaxed ${textClass}`}>{opt}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SolutionPage;