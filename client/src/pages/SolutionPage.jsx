import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle, Circle,
  Clock, BookOpen, Tag, Menu, X, Filter, AlertTriangle, Languages,
  Hash, Zap, Bookmark, Lightbulb, ChevronDown, ChevronUp,
  SkipForward, Maximize2, Minimize2, List,
  Eye, Copy, Check, Target, Flag
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import attemptService from '../services/attemptService';
import ReportIssueModal from '../components/test/ReportIssueModal';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../utils/constants';

const bText = (obj, lang) => {
  if (!obj) return '';
  return obj[lang] || obj['en'] || obj['hi'] || (typeof obj === 'string' ? obj : '');
};
const bArr = (obj, lang) => {
  if (!obj) return [];
  return obj[lang] || obj['en'] || obj['hi'] || (Array.isArray(obj) ? obj : []);
};
const optLabel = (i) => String.fromCharCode(65 + i);
const roman = (i) => ['(i)','(ii)','(iii)','(iv)','(v)','(vi)','(vii)','(viii)'][i] || `(${i+1})`;
const COLORS = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316'];

const useSwipe = (onLeft, onRight, threshold = 60) => {
  const startX = useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > threshold) { if (diff > 0) onLeft(); else onRight(); }
    startX.current = null;
  };
  return { onTouchStart, onTouchEnd };
};

const ProgressDots = ({ current, total, max = 20 }) => {
  if (total <= max) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === current ? 'w-6 h-2 bg-primary-500' : i < current ? 'w-2 h-2 bg-primary-300 dark:bg-primary-700' : 'w-2 h-2 bg-gray-200 dark:bg-secondary-700'
          }`} />
        ))}
      </div>
    );
  }
  return null;
};

const MiniConfetti = ({ show }) => {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${30 + Math.random() * 40}%`, top: `${20 + Math.random() * 30}%`,
            backgroundColor: ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899'][i % 6],
            animation: `confetti-pop ${0.6 + Math.random() * 0.4}s ease-out forwards`,
            animationDelay: `${i * 30}ms`,
          }} />
      ))}
      <style>{`@keyframes confetti-pop{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(${Math.random()>0.5?'':'-'}${20+Math.random()*40}px,-${30+Math.random()*50}px) scale(0);opacity:0}}`}</style>
    </div>
  );
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [copiedQ, setCopiedQ] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await attemptService.getAttemptReview(id); setReviewData(r.data); }
      catch (e) { console.error('Failed:', e); }
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
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      const q = filteredQ[i];
      if (q?.isCorrect) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 800); }
    }
  }, [filteredQ.length, currentIdx, filteredQ]);

  const goNext = useCallback(() => goTo(currentIdx + 1, 'right'), [goTo, currentIdx]);
  const goPrev = useCallback(() => goTo(currentIdx - 1, 'left'), [goTo, currentIdx]);
  const swipeHandlers = useSwipe(goNext, goPrev);

  const goToByOriginalIndex = useCallback((origIdx) => {
    const q = allQ[origIdx]; if (!q) return;
    const filtIdx = filteredQ.findIndex(fq => fq.questionNumber === q.questionNumber);
    if (filtIdx !== -1) goTo(filtIdx);
    else { setFilter('all'); setTimeout(() => goTo(origIdx), 50); }
    setShowPalette(false);
  }, [allQ, filteredQ, goTo]);

  const toggleBookmark = useCallback((qNum) => {
    setBookmarked(prev => { const n = new Set(prev); if (n.has(qNum)) n.delete(qNum); else n.add(qNum); return n; });
  }, []);

  const copyQuestion = useCallback(() => {
    if (!currentQ?.question) return;
    const text = bText(currentQ.question.question, language);
    navigator.clipboard?.writeText(text);
    setCopiedQ(true); setTimeout(() => setCopiedQ(false), 2000);
  }, [currentQ, language]);

  useEffect(() => {
    const h = (e) => {
      if (showReportModal) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'b' || e.key === 'B') { if (currentQ) toggleBookmark(currentQ.questionNumber); }
      if (e.key === 'e' || e.key === 'E') setShowExplanation(p => !p);
      if (e.key === 'c' || e.key === 'C') setCompactMode(p => !p);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [goPrev, goNext, currentQ, toggleBookmark, showReportModal]);

  useEffect(() => { setCurrentIdx(0); }, [filter]);
  useEffect(() => { const t = setTimeout(() => setAnimDir(''), 350); return () => clearTimeout(t); }, [currentIdx]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <BookOpen className="absolute inset-0 m-auto w-7 h-7 text-primary-500 animate-pulse" />
        </div>
        <p className="text-gray-500 font-semibold">{language === 'hi' ? 'समाधान लोड हो रहे हैं...' : 'Loading solutions...'}</p>
      </div>
    </div>
  );

  if (!reviewData || allQ.length === 0) return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center p-4">
      <div className="text-center bg-white dark:bg-secondary-800 p-12 rounded-3xl border shadow-xl max-w-md">
        <div className="w-20 h-20 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-700 dark:text-secondary-300 text-lg font-bold mb-2">{language === 'hi' ? 'समाधान उपलब्ध नहीं' : 'Solutions unavailable'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
          {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
        </button>
      </div>
    </div>
  );

  const a = reviewData.attempt;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex flex-col">
      {/* HEADER */}
      <header className="bg-white/95 dark:bg-secondary-800/95 backdrop-blur-xl border-b dark:border-secondary-700 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5 px-3 sm:px-5 py-3">
          <button onClick={() => navigate(`/results/${id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl transition-colors group">
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 dark:text-secondary-400 dark:group-hover:text-white transition-colors" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">{reviewData.test.title}</h1>
            <p className="text-[10px] text-gray-400 hidden sm:block font-medium">{language === 'hi' ? 'विस्तृत समाधान' : 'Detailed Solutions'}</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {[
              { icon: CheckCircle, count: counts.correct, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
              { icon: XCircle, count: counts.wrong, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/30' },
              { icon: Circle, count: counts.skipped, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-secondary-700' },
            ].map((s, i) => (
              <span key={i} className={`flex items-center gap-1 ${s.color} font-bold ${s.bg} px-2.5 py-1 rounded-lg text-sm`}><s.icon className="w-3.5 h-3.5" /> {s.count}</span>
            ))}
            <span className={`font-black text-lg ml-1 ${a.percentage >= 60 ? 'text-emerald-600' : a.percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{a.percentage}%</span>
          </div>
          <button onClick={() => setCompactMode(!compactMode)} className="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 transition-colors" title="Compact (C)">
            {compactMode ? <Maximize2 className="w-4 h-4 text-gray-500" /> : <Minimize2 className="w-4 h-4 text-gray-500" />}
          </button>
          <button onClick={toggleLang} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 transition-all text-sm font-bold text-gray-700 dark:text-secondary-300 active:scale-95">
            <Languages className="w-4 h-4" /><span className="text-xs">{language === 'hi' ? 'EN' : 'हि'}</span>
          </button>
          <button onClick={() => setShowPalette(true)} className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 transition-colors active:scale-95">
            <Menu className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
        </div>

        <div className="flex gap-1.5 px-3 sm:px-5 pb-2.5 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: language === 'hi' ? 'सभी' : 'All', count: counts.all, icon: Hash, active: 'bg-primary-600 text-white shadow-md shadow-primary-500/20' },
            { id: 'correct', label: language === 'hi' ? 'सही' : 'Correct', count: counts.correct, icon: CheckCircle, active: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' },
            { id: 'wrong', label: language === 'hi' ? 'गलत' : 'Wrong', count: counts.wrong, icon: XCircle, active: 'bg-red-600 text-white shadow-md shadow-red-500/20' },
            { id: 'skipped', label: language === 'hi' ? 'छोड़े' : 'Skipped', count: counts.skipped, icon: Circle, active: 'bg-gray-600 text-white' },
            ...(bookmarked.size > 0 ? [{ id: 'bookmarked', label: language === 'hi' ? 'सेव्ड' : 'Saved', count: counts.bookmarked, icon: Bookmark, active: 'bg-amber-600 text-white shadow-md shadow-amber-500/20' }] : []),
          ].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 active:scale-95 ${filter === tab.id ? tab.active : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 hover:bg-gray-200'}`}>
              <tab.icon className="w-3 h-3" />{tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === tab.id ? 'bg-white/25' : 'bg-gray-200 dark:bg-secondary-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="h-1 bg-gray-100 dark:bg-secondary-700 relative overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-violet-500 transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${filteredQ.length > 0 ? ((currentIdx + 1) / filteredQ.length) * 100 : 0}%` }} />
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden" {...swipeHandlers}>
        <main ref={scrollRef} className="flex-1 lg:mr-72 overflow-y-auto scroll-smooth">
          {filteredQ.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-bold mb-2">{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions found'}</p>
              <button onClick={() => setFilter('all')} className="mt-3 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-500/20">
                {language === 'hi' ? 'सभी दिखाएं' : 'Show All'}
              </button>
            </div>
          ) : currentQ ? (
            <div className={`max-w-4xl mx-auto p-4 sm:p-6 pb-8 ${animDir === 'right' ? 'animate-slide-left' : animDir === 'left' ? 'animate-slide-right' : 'animate-fade-in'}`}>
              <div className="relative">
                <MiniConfetti show={showConfetti} />
                <QuestionSolutionCard
                  question={currentQ} language={language} index={currentIdx} total={filteredQ.length}
                  isBookmarked={bookmarked.has(currentQ.questionNumber)}
                  onToggleBookmark={() => toggleBookmark(currentQ.questionNumber)}
                  showExplanation={showExplanation}
                  onToggleExplanation={() => setShowExplanation(p => !p)}
                  compact={compactMode}
                  onCopy={copyQuestion} copied={copiedQ}
                  onReport={() => setShowReportModal(true)}
                />
              </div>
              <div className="flex justify-center mt-6"><ProgressDots current={currentIdx} total={filteredQ.length} /></div>
              <div className="hidden lg:flex items-center justify-center gap-4 mt-4 text-[11px] text-gray-400">
                {[
                  { keys: '← →', label: language === 'hi' ? 'नेविगेट' : 'Navigate' },
                  { keys: 'B', label: language === 'hi' ? 'बुकमार्क' : 'Bookmark' },
                  { keys: 'E', label: language === 'hi' ? 'व्याख्या' : 'Explanation' },
                ].map((h, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-secondary-700 rounded text-[10px] font-mono font-bold text-gray-500 border border-gray-200 dark:border-secondary-600">{h.keys}</kbd>{h.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </main>

        {/* Desktop Palette */}
        <aside className="hidden lg:flex flex-col fixed right-0 top-[106px] bottom-[60px] w-72 bg-white/95 dark:bg-secondary-800/95 backdrop-blur-xl border-l dark:border-secondary-700">
          <div className="p-4 border-b dark:border-secondary-700 bg-gray-50/80 dark:bg-secondary-750/50">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2"><Hash className="w-4 h-4 text-primary-500" />{language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}</h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter} onJump={goToByOriginalIndex} counts={counts} language={language} bookmarked={bookmarked} />
          </div>
        </aside>

        {/* Mobile Drawer */}
        {showPalette && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
            <aside className="relative w-80 max-w-[85vw] bg-white dark:bg-secondary-800 h-full flex flex-col shadow-2xl animate-slide-left">
              <div className="flex items-center justify-between p-4 border-b dark:border-secondary-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Hash className="w-4 h-4 text-primary-500" />{language === 'hi' ? 'पैलेट' : 'Palette'}</h3>
                <button onClick={() => setShowPalette(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl active:scale-95"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter} onJump={goToByOriginalIndex} counts={counts} language={language} bookmarked={bookmarked} />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-white/95 dark:bg-secondary-800/95 backdrop-blur-xl border-t dark:border-secondary-700 sticky bottom-0 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={goPrev} disabled={currentIdx <= 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-secondary-600 text-gray-700 dark:text-secondary-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">{language === 'hi' ? 'पिछला' : 'Prev'}</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-gray-100 dark:bg-secondary-700 rounded-xl px-4 py-2 text-sm font-bold">
              <span className="text-primary-600 dark:text-primary-400">{currentIdx + 1}</span>
              <span className="text-gray-300 dark:text-secondary-500 mx-1.5">/</span>
              <span className="text-gray-600 dark:text-secondary-400">{filteredQ.length}</span>
            </div>
            {currentQ && (
              <>
                <button onClick={() => toggleBookmark(currentQ.questionNumber)}
                  className={`p-2.5 rounded-xl transition-all active:scale-90 ${bookmarked.has(currentQ.questionNumber) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 shadow-inner' : 'bg-gray-100 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'}`} title="Bookmark (B)">
                  <Bookmark className={`w-4 h-4 ${bookmarked.has(currentQ.questionNumber) ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => setShowExplanation(p => !p)}
                  className={`hidden sm:flex p-2.5 rounded-xl transition-all active:scale-90 ${showExplanation ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-100 dark:bg-secondary-700 text-gray-400'}`} title="Explanation (E)">
                  <Lightbulb className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <button onClick={goNext} disabled={currentIdx >= filteredQ.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-sm hover:from-primary-700 hover:to-indigo-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/20 active:scale-95">
            <span className="hidden sm:inline">{language === 'hi' ? 'अगला' : 'Next'}</span><ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* REPORT MODAL */}
      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        questionId={currentQ?.question?._id || ''}
        questionSource={String(currentQ?.question?._id || '').startsWith('pyq_') ? 'pyq' : 'bank'}
        testId={reviewData?.test?._id}
        attemptId={id}
        questionIndex={currentQ ? allQ.findIndex(q => q.questionNumber === currentQ.questionNumber) : 0}
        language={language}
      />
    </div>
  );
};

/* ═══ PALETTE ═══ */
const PaletteContent = ({ allQ, filteredQ, currentIdx, filter, onJump, counts, language, bookmarked }) => {
  const currentQNum = filteredQ[currentIdx]?.questionNumber;
  const accuracy = counts.all > 0 ? Math.round((counts.correct / counts.all) * 100) : 0;
  return (
    <div className="p-4 space-y-5">
      <div className="flex flex-wrap gap-3 text-[11px] font-semibold">
        {[
          { color: 'bg-emerald-500', label: language === 'hi' ? 'सही' : 'Correct' },
          { color: 'bg-red-500', label: language === 'hi' ? 'गलत' : 'Wrong' },
          { color: 'bg-gray-300 dark:bg-secondary-600', label: language === 'hi' ? 'छोड़ा' : 'Skipped' },
        ].map((l, i) => (
          <span key={i} className="flex items-center gap-1.5 text-gray-500"><span className={`w-3 h-3 rounded-md ${l.color} shadow-sm`} />{l.label}</span>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {allQ.map((q, i) => {
          const isCurrent = q.questionNumber === currentQNum;
          const inFilter = filteredQ.some(fq => fq.questionNumber === q.questionNumber);
          const disabled = !inFilter && filter !== 'all';
          const isBM = bookmarked.has(q.questionNumber);
          let cc = 'bg-gray-200 dark:bg-secondary-600 text-gray-500 dark:text-secondary-400';
          if (q.isCorrect) cc = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20';
          else if (q.selectedAnswer !== -1) cc = 'bg-red-500 text-white shadow-sm shadow-red-500/20';
          return (
            <button key={i} onClick={() => onJump(i)} disabled={disabled}
              className={`relative aspect-square rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 ${cc} ${isCurrent ? 'ring-[3px] ring-primary-500 ring-offset-2 dark:ring-offset-secondary-800 scale-[1.15] z-10 shadow-xl' : ''} ${disabled ? 'opacity-15 cursor-not-allowed' : 'cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95'}`}>
              {q.questionNumber}
              {isBM && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-secondary-800 shadow-sm" />}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-secondary-700/50 dark:to-secondary-700/30 rounded-xl border border-gray-100 dark:border-secondary-600 space-y-3">
        <h4 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5"><List className="w-3.5 h-3.5 text-primary-500" />{language === 'hi' ? 'सारांश' : 'Summary'}</h4>
        {[
          { label: language === 'hi' ? 'कुल' : 'Total', val: counts.all, color: 'text-gray-900 dark:text-white', icon: Hash },
          { label: language === 'hi' ? 'सही' : 'Correct', val: counts.correct, color: 'text-emerald-600', icon: CheckCircle },
          { label: language === 'hi' ? 'गलत' : 'Wrong', val: counts.wrong, color: 'text-red-600', icon: XCircle },
          { label: language === 'hi' ? 'छोड़ा' : 'Skipped', val: counts.skipped, color: 'text-gray-500', icon: SkipForward },
        ].map((r, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-secondary-400 font-medium"><r.icon className="w-3.5 h-3.5" />{r.label}</span>
            <span className={`font-black ${r.color} text-base`}>{r.val}</span>
          </div>
        ))}
        {counts.all > 0 && (
          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-secondary-600">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 font-bold text-sm"><Target className="w-3.5 h-3.5" />{language === 'hi' ? 'सटीकता' : 'Accuracy'}</span>
              <span className={`font-black text-xl ${accuracy >= 70 ? 'text-emerald-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{accuracy}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-secondary-600 rounded-full overflow-hidden mt-2">
              <div className={`h-full rounded-full transition-all duration-1000 ${accuracy >= 70 ? 'bg-emerald-500' : accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${accuracy}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══ QUESTION CARD ═══ */
const QuestionSolutionCard = ({ question: q, language, index, total, isBookmarked, onToggleBookmark, showExplanation, onToggleExplanation, compact, onCopy, copied, onReport }) => {
  const qData = q.question;
  if (!qData) return null;
  const qType = qData.questionType;
  const difficulty = qData.difficulty || 'medium';
  const typeLbl = QUESTION_TYPE_LABELS[qType]?.[language] || qType;
  const diffLbl = DIFFICULTY_LABELS[difficulty]?.[language] || difficulty;

  const rc = q.isCorrect
    ? { icon: CheckCircle, label: language === 'hi' ? 'सही' : 'Correct', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', hdr: 'from-emerald-500/[0.04] to-green-500/[0.04]', strip: 'bg-emerald-500' }
    : q.selectedAnswer !== -1
    ? { icon: XCircle, label: language === 'hi' ? 'गलत' : 'Wrong', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', hdr: 'from-red-500/[0.04] to-rose-500/[0.04]', strip: 'bg-red-500' }
    : { icon: Circle, label: language === 'hi' ? 'छोड़ा' : 'Skipped', cls: 'bg-gray-50 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 border-gray-200 dark:border-secondary-600', hdr: 'from-gray-500/[0.03] to-slate-500/[0.03]', strip: 'bg-gray-400' };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-secondary-700 overflow-hidden hover:shadow-xl transition-shadow duration-500">
      <div className={`h-1 ${rc.strip}`} />
      <div className={`px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-secondary-700/50 bg-gradient-to-r ${rc.hdr}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-secondary-700 shadow-md border border-gray-200 dark:border-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-black text-gray-900 dark:text-white">{q.questionNumber}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold rounded-md uppercase tracking-wide">{typeLbl}</span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{diffLbl}</span>
              {qData.isPYQ && qData.year && (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-md tracking-wide">
                  PYQ {qData.year}
                  {qData.pyqSession ? ` - ${qData.pyqSession.charAt(0).toUpperCase() + qData.pyqSession.slice(1)}` : ''}
                  {qData.pyqShift && qData.pyqShift !== 'none' ? ` (${qData.pyqShift.charAt(0).toUpperCase() + qData.pyqShift.slice(1)})` : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {q.timeTaken > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-white dark:bg-secondary-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-secondary-600"><Clock className="w-3 h-3" /> {q.timeTaken}s</span>
            )}
            <button onClick={onReport}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-90" title={language === 'hi' ? 'रिपोर्ट' : 'Report'}>
              <Flag className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCopy} className="p-1.5 rounded-lg bg-gray-50 dark:bg-secondary-700 text-gray-400 hover:text-gray-600 transition-colors active:scale-90" title="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={onToggleBookmark}
              className={`p-1.5 rounded-lg transition-all active:scale-90 ${isBookmarked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-50 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'}`}>
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${rc.cls}`}><rc.icon className="w-4 h-4" /> {rc.label}</span>
          </div>
        </div>
        {(qData.unit || qData.chapter || qData.topic) && (
          <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-secondary-600/50 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-secondary-400 overflow-x-auto font-medium">
            <Tag className="w-3 h-3 flex-shrink-0 text-primary-400" />
            {[qData.unit, qData.chapter, qData.topic].filter(Boolean).map((p, i, arr) => (
              <React.Fragment key={i}><span>{p}</span>{i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}</React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className={`p-5 sm:p-6 lg:p-8 space-y-6 ${compact ? 'text-sm' : ''}`}>
        <QuestionContent qData={qData} language={language} />
        <OptionsDisplay qData={qData} language={language} selectedAnswer={q.selectedAnswer} correctAnswer={q.correctAnswer} compact={compact} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50/80 dark:bg-secondary-700/30 rounded-xl border border-gray-100 dark:border-secondary-600/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">{language === 'hi' ? 'आपका:' : 'Yours:'}</span>
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${q.selectedAnswer === -1 ? 'bg-gray-200 text-gray-600 dark:bg-secondary-600 dark:text-secondary-300' : q.isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {q.selectedAnswer === -1 ? 'N/A' : `(${optLabel(q.selectedAnswer)})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">{language === 'hi' ? 'सही:' : 'Correct:'}</span>
            <span className="text-sm font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg">({optLabel(q.correctAnswer)})</span>
          </div>
        </div>

        {qData.explanation && (bText(qData.explanation, language) || bText(qData.explanation, language === 'hi' ? 'en' : 'hi')) && (
          <div>
            <button onClick={onToggleExplanation} className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors mb-3 group">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 transition-colors"><Lightbulb className="w-3.5 h-3.5" /></div>
              {language === 'hi' ? 'व्याख्या' : 'Explanation'}
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showExplanation && (
              <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-xl animate-fade-in backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-xl"><BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                  <span className="font-black text-blue-900 dark:text-blue-300">{language === 'hi' ? 'समाधान' : 'Solution'}</span>
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

/* ═══ QUESTION CONTENT ═══ */
const QuestionContent = ({ qData, language }) => {
  const qType = qData.questionType;
  const qt = bText(qData.question, language);

  if (qType === 'passage_based' && qData.passageId) {
    const pc = bText(qData.passageId.content, language);
    return (
      <div className="space-y-4">
        {pc && (
          <div className="p-4 bg-amber-50/80 dark:bg-amber-900/15 border-l-4 border-amber-400 rounded-r-xl max-h-60 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider"><BookOpen className="w-3.5 h-3.5" />{language === 'hi' ? 'गद्यांश' : 'PASSAGE'}</div>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{pc}</p>
          </div>
        )}
        <p className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg leading-relaxed">{qt}</p>
      </div>
    );
  }
  if (qType === 'assertion_reason') {
    const assertion = bText(qData.assertionReasonData?.assertion, language);
    const reason = bText(qData.assertionReasonData?.reason, language);
    return (
      <div className="space-y-4">
        {qt && <p className="text-gray-700 dark:text-secondary-300 font-medium text-sm">{qt}</p>}
        <div className="flex gap-3 p-4 bg-blue-50/80 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/20">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">A</span>
          <div><p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase">{language === 'hi' ? 'अभिकथन' : 'Assertion'}</p><p className="text-sm text-gray-800 dark:text-secondary-200">{assertion}</p></div>
        </div>
        <div className="flex gap-3 p-4 bg-purple-50/80 dark:bg-purple-900/10 rounded-xl border border-purple-100/50 dark:border-purple-800/20">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-md">R</span>
          <div><p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1 uppercase">{language === 'hi' ? 'कारण' : 'Reason'}</p><p className="text-sm text-gray-800 dark:text-secondary-200">{reason}</p></div>
        </div>
      </div>
    );
  }
  if (qType === 'match_following') {
    const la = bArr(qData.matchData?.listA, language);
    const lb = bArr(qData.matchData?.listB, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-semibold text-base">{qt || (language === 'hi' ? 'सुमेलित कीजिए:' : 'Match:')}</p>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-secondary-600 shadow-sm">
          <div className="grid grid-cols-2 bg-gray-100 dark:bg-secondary-700 border-b border-gray-200 dark:border-secondary-600">
            <div className="px-4 py-2.5 font-bold text-sm border-r border-gray-200 dark:border-secondary-600 text-gray-900 dark:text-gray-100">{language === 'hi' ? 'सूची-I' : 'List-I'}</div>
            <div className="px-4 py-2.5 font-bold text-sm text-gray-900 dark:text-gray-100">{language === 'hi' ? 'सूची-II' : 'List-II'}</div>
          </div>
          {la.map((a, i) => (
            <div key={i} className={`grid grid-cols-2 border-b border-gray-200 dark:border-secondary-600 last:border-0 ${i % 2 ? 'bg-gray-50/50 dark:bg-secondary-750/30' : 'bg-white dark:bg-secondary-800'}`}>
              <div className="px-4 py-3 text-sm border-r border-gray-200 dark:border-secondary-600 text-gray-800 dark:text-gray-200">
                <span className="font-bold text-primary-600 dark:text-primary-400 mr-1.5">({optLabel(i)})</span>{a}
              </div>
              <div className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                <span className="font-bold text-primary-600 dark:text-primary-400 mr-1.5">{roman(i)}</span>{lb[i] || ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (qType === 'statement_based') {
    const stmts = bArr(qData.statementData?.statements, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-semibold text-base">{qt || (language === 'hi' ? 'कथनों पर विचार:' : 'Consider:')}</p>
        <div className="space-y-2">
          {stmts.map((s, i) => (<div key={i} className="flex items-start gap-3 p-3 bg-gray-50/80 dark:bg-secondary-700/40 rounded-xl border border-gray-100 dark:border-secondary-700/50"><span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-secondary-600 flex items-center justify-center text-xs font-bold shadow-sm border border-gray-200 dark:border-secondary-500">{i + 1}</span><span className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pt-0.5">{s}</span></div>))}
        </div>
      </div>
    );
  }
  if (qType === 'sequence_order') {
    const items = bArr(qData.sequenceData?.items, language);
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-semibold text-base">{qt || (language === 'hi' ? 'क्रम व्यवस्थित:' : 'Arrange:')}</p>
        <div className="space-y-2">
          {items.map((it, i) => (<div key={i} className="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-secondary-700/40 rounded-xl border border-gray-100 dark:border-secondary-700/50"><span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-400">{optLabel(i)}</span><span className="text-sm text-gray-800 dark:text-secondary-200">{it}</span></div>))}
        </div>
      </div>
    );
  }
  if (['di_table','di_bar_chart','di_pie_chart','di_line_graph','di_caselet','di_mixed'].includes(qType) && qData.diDataId) {
    const di = qData.diDataId;
    return (
      <div className="space-y-4">
        {bText(di.title, language) && <h4 className="font-bold text-gray-900 dark:text-white text-center">{bText(di.title, language)}</h4>}
        {bText(di.instruction, language) && <p className="text-sm text-gray-600 dark:text-secondary-400 italic text-center">{bText(di.instruction, language)}</p>}
        <div className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl p-4 overflow-x-auto shadow-inner">
          {qType === 'di_table' && (
            <table className="w-full border-collapse text-sm text-gray-800 dark:text-gray-200">
              <thead><tr className="bg-gray-100 dark:bg-secondary-700">{bArr(di.tableData?.headers, language).map((h, i) => <th key={i} className="border border-gray-200 dark:border-secondary-600 px-3 py-2 font-bold text-left text-gray-900 dark:text-gray-100">{h}</th>)}</tr></thead>
              <tbody>{(di.tableData?.rows || []).map((row, ri) => <tr key={ri} className={ri % 2 ? 'bg-gray-50/70 dark:bg-secondary-750/30' : 'bg-white dark:bg-secondary-800'}>{row.map((c, ci) => <td key={ci} className="border border-gray-200 dark:border-secondary-600 px-3 py-2">{c ?? '-'}</td>)}</tr>)}</tbody>
            </table>
          )}
          {['di_bar_chart','di_line_graph','di_pie_chart'].includes(qType) && (
            <div className="h-64 w-full min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {qType === 'di_bar_chart' ? (
                  <BarChart data={bArr(di.chartData?.labels, language).map((l, i) => { const it = { name: l }; (di.chartData?.datasets || []).forEach((ds, d) => { it[bText(ds.label, language) || `S${d+1}`] = ds.data[i] || 0; }); return it; })}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                    {(di.chartData?.datasets || []).map((ds, i) => <Bar key={i} dataKey={bText(ds.label, language) || `S${i+1}`} fill={ds.color || COLORS[i % COLORS.length]} radius={[4,4,0,0]} />)}
                  </BarChart>
                ) : qType === 'di_line_graph' ? (
                  <LineChart data={bArr(di.chartData?.labels, language).map((l, i) => { const it = { name: l }; (di.chartData?.datasets || []).forEach((ds, d) => { it[bText(ds.label, language) || `S${d+1}`] = ds.data[i] || 0; }); return it; })}>
                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                    {(di.chartData?.datasets || []).map((ds, i) => <Line key={i} type="monotone" dataKey={bText(ds.label, language) || `S${i+1}`} stroke={ds.color || COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />)}
                  </LineChart>
                ) : (
                  <PieChart><Pie data={bArr(di.chartData?.labels, language).map((l, i) => ({ name: l, value: di.chartData?.datasets?.[0]?.data?.[i] || 0 }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>{bArr(di.chartData?.labels, language).map((_, i) => <Cell key={i} fill={(di.chartData?.datasets?.[0]?.colors || COLORS)[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          {qType === 'di_caselet' && bText(di.caseletText, language) && <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{bText(di.caseletText, language)}</p>}
        </div>
        <p className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg leading-relaxed mt-4">{qt}</p>
      </div>
    );
  }
  return <p className="text-gray-900 dark:text-white font-semibold text-base sm:text-lg leading-relaxed">{qt}</p>;
};

/* ═══ OPTIONS DISPLAY ═══ */
const OptionsDisplay = ({ qData, language, selectedAnswer, correctAnswer, compact }) => {
  const options = bArr(qData.options, language);
  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {options.map((opt, i) => {
        const isC = i === correctAnswer, isSel = i === selectedAnswer, isW = isSel && !isC;
        let cc = 'border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-750';
        let ic = <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-secondary-500 flex items-center justify-center"><span className="text-[10px] font-bold text-gray-400">{optLabel(i)}</span></div>;
        let tc = 'text-gray-700 dark:text-secondary-300';
        if (isC) { cc = 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-900/20 ring-1 ring-emerald-300/50 shadow-sm shadow-emerald-500/10'; ic = <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30"><CheckCircle className="w-4 h-4 text-white" /></div>; tc = 'text-emerald-800 dark:text-emerald-200 font-medium'; }
        else if (isW) { cc = 'border-red-300 dark:border-red-700 bg-red-50/80 dark:bg-red-900/20 ring-1 ring-red-300/50 shadow-sm shadow-red-500/10'; ic = <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-md shadow-red-500/30"><XCircle className="w-4 h-4 text-white" /></div>; tc = 'text-red-800 dark:text-red-200 font-medium'; }
        return (
          <div key={i} className={`flex items-start gap-3 ${compact ? 'p-3' : 'p-4'} rounded-xl border-2 transition-all duration-300 ${cc}`}>
            <div className="flex-shrink-0 mt-0.5">{ic}</div>
            <div className="flex-1 min-w-0">
              {!compact && (
                <div className="flex items-center gap-2 mb-1">
                  {isC && <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">{language === 'hi' ? 'सही उत्तर' : 'Correct'}</span>}
                  {isW && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">{language === 'hi' ? 'आपका उत्तर' : 'Your Answer'}</span>}
                </div>
              )}
              <p className={`${compact ? 'text-sm' : 'text-sm sm:text-base'} leading-relaxed ${tc}`}>{opt}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SolutionPage;