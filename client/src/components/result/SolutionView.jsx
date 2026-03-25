import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Circle,
  Clock, BookOpen, Tag, Menu, X, Filter, ArrowLeft, Languages,
  Hash, AlertTriangle, Bookmark, BookmarkCheck, Type, Minus, Plus,
  Keyboard, SkipForward, SkipBack
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Helpers ───
const bText = (o, l) => { if (!o) return ''; return o[l] || o['en'] || o['hi'] || (typeof o === 'string' ? o : ''); };
const bArr = (o, l) => { if (!o) return []; return o[l] || o['en'] || o['hi'] || (Array.isArray(o) ? o : []); };
const optLabel = (i) => String.fromCharCode(65 + i);
const roman = (i) => ['(i)','(ii)','(iii)','(iv)','(v)','(vi)','(vii)','(viii)'][i] || `(${i+1})`;
const COLORS = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316'];
const isSkipped = (s) => s === -1 || s === null || s === undefined;

const TYPE_LABELS = {
  mcq:{en:'MCQ',hi:'MCQ'}, assertion_reason:{en:'Assertion-Reason',hi:'अभिकथन-कारण'},
  match_following:{en:'Match',hi:'सुमेलन'}, sequence_order:{en:'Sequence',hi:'क्रम'},
  statement_based:{en:'Statement',hi:'कथन'}, passage_based:{en:'Passage',hi:'गद्यांश'},
  di_table:{en:'DI-Table',hi:'DI-तालिका'}, di_bar_chart:{en:'DI-Bar',hi:'DI-बार'},
  di_pie_chart:{en:'DI-Pie',hi:'DI-पाई'}, di_line_graph:{en:'DI-Line',hi:'DI-लाइन'},
  di_caselet:{en:'DI-Case',hi:'DI-केस'}, di_mixed:{en:'DI-Mix',hi:'DI-मिश्र'}
};
const DIFF_LABELS = { easy:{en:'Easy',hi:'सरल'}, medium:{en:'Medium',hi:'मध्यम'}, hard:{en:'Hard',hi:'कठिन'} };

/* ═══════════ CUSTOM SWIPE HOOK ═══════════ */
const useSwipe = (onLeft, onRight, threshold = 60) => {
  const startX = useRef(null);
  const startY = useRef(null);
  const moving = useRef(false);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    moving.current = true;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!moving.current || startX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = startX.current - endX;
    const dy = Math.abs(startY.current - endY);
    // Only horizontal swipes (not scrolling)
    if (Math.abs(dx) > threshold && dy < Math.abs(dx) * 0.7) {
      if (dx > 0) onLeft();
      else onRight();
    }
    startX.current = null;
    moving.current = false;
  }, [onLeft, onRight, threshold]);

  return { onTouchStart, onTouchEnd };
};

/* ═══════════ BOOKMARKS HOOK ═══════════ */
const useBookmarks = (testId) => {
  const key = `netprep_bookmarks_${testId || 'default'}`;
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });

  const toggle = useCallback((qNum) => {
    setBookmarks(prev => {
      const next = prev.includes(qNum) ? prev.filter(b => b !== qNum) : [...prev, qNum];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  const isBookmarked = useCallback((qNum) => bookmarks.includes(qNum), [bookmarks]);
  return { bookmarks, toggle, isBookmarked };
};

/* ═══════════ ANIMATION STYLES ═══════════ */
const SolStyles = () => (
  <style>{`
    @keyframes sol-slide-in-r{0%{transform:translateX(40px);opacity:0}100%{transform:translateX(0);opacity:1}}
    @keyframes sol-slide-in-l{0%{transform:translateX(-40px);opacity:0}100%{transform:translateX(0);opacity:1}}
    @keyframes sol-fade{0%{opacity:0}100%{opacity:1}}
    @keyframes sol-drawer{0%{transform:translateX(100%)}100%{transform:translateX(0)}}
    .sol-slide-r{animation:sol-slide-in-r 0.25s ease-out both}
    .sol-slide-l{animation:sol-slide-in-l 0.25s ease-out both}
    .sol-fade{animation:sol-fade 0.3s ease-out both}
    .sol-drawer{animation:sol-drawer 0.3s ease-out both}
  `}</style>
);

/* ═══════════════════════════════════════════
   MAIN SOLUTION VIEW
   ═══════════════════════════════════════════ */
const SolutionView = ({
  answers = [], questions = [], language: initialLang = 'en',
  test, onClose, onLanguageChange, initialIndex = 0
}) => {
  const [language, setLanguage] = useState(initialLang);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showPalette, setShowPalette] = useState(false);
  const [slideDir, setSlideDir] = useState('r');
  const [fontSize, setFontSize] = useState(16);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [showJump, setShowJump] = useState(false);
  const scrollRef = useRef(null);

  const { bookmarks, toggle: toggleBookmark, isBookmarked } = useBookmarks(test?._id);

  useEffect(() => { setLanguage(initialLang); }, [initialLang]);

  const handleLangToggle = () => {
    const n = language === 'hi' ? 'en' : 'hi';
    setLanguage(n);
    if (onLanguageChange) onLanguageChange(n);
    try { localStorage.setItem('netprep_lang', n); } catch {}
  };

  // Build combined list
  const allQ = useMemo(() =>
    questions.map((q, i) => ({ question: q, ...(answers[i] || {}), questionNumber: i + 1 })),
    [questions, answers]
  );

  useEffect(() => {
    if (initialIndex > 0 && initialIndex < allQ.length) setCurrentIdx(initialIndex);
  }, []); // eslint-disable-line

  const filteredQ = useMemo(() => {
    if (filter === 'correct') return allQ.filter(q => q.isCorrect);
    if (filter === 'wrong') return allQ.filter(q => !q.isCorrect && !isSkipped(q.selectedAnswer));
    if (filter === 'skipped') return allQ.filter(q => isSkipped(q.selectedAnswer));
    if (filter === 'bookmarked') return allQ.filter(q => isBookmarked(q.questionNumber));
    return allQ;
  }, [allQ, filter, bookmarks]); // eslint-disable-line

  const currentQ = filteredQ[currentIdx] || null;

  const counts = useMemo(() => ({
    all: allQ.length,
    correct: allQ.filter(q => q.isCorrect).length,
    wrong: allQ.filter(q => !q.isCorrect && !isSkipped(q.selectedAnswer)).length,
    skipped: allQ.filter(q => isSkipped(q.selectedAnswer)).length,
    bookmarked: bookmarks.length,
  }), [allQ, bookmarks]);

  const goTo = useCallback((i, dir = 'r') => {
    if (i >= 0 && i < filteredQ.length) {
      setSlideDir(dir);
      setCurrentIdx(i);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filteredQ.length]);

  const goNext = useCallback(() => goTo(currentIdx + 1, 'r'), [currentIdx, goTo]);
  const goPrev = useCallback(() => goTo(currentIdx - 1, 'l'), [currentIdx, goTo]);

  const goToByOriginal = useCallback((origIdx) => {
    const q = allQ[origIdx];
    if (!q) return;
    const idx = filteredQ.findIndex(fq => fq.questionNumber === q.questionNumber);
    if (idx !== -1) goTo(idx);
    else { setFilter('all'); setTimeout(() => goTo(origIdx), 50); }
    setShowPalette(false);
  }, [allQ, filteredQ, goTo]);

  // Jump to question
  const handleJump = useCallback(() => {
    const n = parseInt(jumpInput);
    if (n >= 1 && n <= allQ.length) {
      goToByOriginal(n - 1);
      setShowJump(false);
      setJumpInput('');
    }
  }, [jumpInput, allQ.length, goToByOriginal]);

  // Swipe
  const swipeHandlers = useSwipe(goNext, goPrev);

  // Keyboard
  useEffect(() => {
    const handle = (e) => {
      if (showJump && e.key === 'Enter') { handleJump(); return; }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') { if (showPalette) setShowPalette(false); else if (showJump) setShowJump(false); else if (onClose) onClose(); }
      if (e.key === 'b' && !e.ctrlKey && !e.metaKey && currentQ) toggleBookmark(currentQ.questionNumber);
      if (e.key === 'g') setShowJump(p => !p);
      if (e.key === '?') setShowShortcuts(p => !p);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [currentIdx, goNext, goPrev, onClose, showPalette, showJump, handleJump, currentQ, toggleBookmark]);

  useEffect(() => { setCurrentIdx(0); }, [filter]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const filterTabs = [
    { id: 'all', label: language === 'hi' ? 'सभी' : 'All', count: counts.all, activeClass: 'bg-primary-600 text-white', icon: Hash },
    { id: 'correct', label: language === 'hi' ? 'सही' : 'Correct', count: counts.correct, activeClass: 'bg-emerald-600 text-white', icon: CheckCircle },
    { id: 'wrong', label: language === 'hi' ? 'गलत' : 'Wrong', count: counts.wrong, activeClass: 'bg-red-600 text-white', icon: XCircle },
    { id: 'skipped', label: language === 'hi' ? 'छोड़े' : 'Skipped', count: counts.skipped, activeClass: 'bg-gray-600 text-white', icon: Circle },
    ...(counts.bookmarked > 0 ? [{ id: 'bookmarked', label: language === 'hi' ? 'बुकमार्क' : 'Saved', count: counts.bookmarked, activeClass: 'bg-amber-600 text-white', icon: Bookmark }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-50 dark:bg-secondary-900">
      <SolStyles />

      {/* ═════ HEADER ═════ */}
      <header className="flex-shrink-0 bg-white dark:bg-secondary-800 border-b dark:border-secondary-700 shadow-sm">
        <div className="flex items-center gap-2 px-3 sm:px-5 py-3">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 dark:text-secondary-300 hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">{language === 'hi' ? 'वापस' : 'Back'}</span>
          </button>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">{test?.title || (language === 'hi' ? 'समाधान' : 'Solutions')}</h1>
          </div>

          {/* Desktop stats */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg"><CheckCircle className="w-3.5 h-3.5" />{counts.correct}</span>
            <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg"><XCircle className="w-3.5 h-3.5" />{counts.wrong}</span>
            <span className="flex items-center gap-1 text-gray-500 font-bold bg-gray-100 dark:bg-secondary-700 px-2 py-1 rounded-lg"><Circle className="w-3.5 h-3.5" />{counts.skipped}</span>
          </div>

          {/* Font size */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-secondary-700 rounded-lg p-0.5">
            <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="p-1.5 hover:bg-white dark:hover:bg-secondary-600 rounded transition-colors"><Minus className="w-3 h-3" /></button>
            <span className="text-xs font-medium px-1 min-w-[24px] text-center">{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(22, s + 2))} className="p-1.5 hover:bg-white dark:hover:bg-secondary-600 rounded transition-colors"><Plus className="w-3 h-3" /></button>
          </div>

          {/* Jump */}
          <button onClick={() => setShowJump(p => !p)} className="hidden sm:flex p-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 text-gray-600 dark:text-secondary-300 transition-colors" title="Jump to Q (G)">
            <SkipForward className="w-4 h-4" />
          </button>

          <button onClick={handleLangToggle} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 text-gray-700 dark:text-secondary-300 transition-colors text-sm font-medium">
            <Languages className="w-4 h-4" /><span className="font-bold text-xs">{language === 'hi' ? 'EN' : 'हि'}</span>
          </button>

          <button onClick={() => setShowPalette(true)} className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-secondary-700 hover:bg-gray-200 dark:hover:bg-secondary-600 text-gray-600 dark:text-secondary-300 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Jump input bar */}
        {showJump && (
          <div className="px-3 sm:px-5 pb-2 sol-fade">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-secondary-700 rounded-xl p-2">
              <span className="text-sm text-gray-500 ml-2">{language === 'hi' ? 'प्रश्न #' : 'Jump to Q#'}</span>
              <input type="number" min={1} max={allQ.length} value={jumpInput} onChange={e => setJumpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJump()}
                className="flex-1 bg-white dark:bg-secondary-800 rounded-lg px-3 py-1.5 text-sm border border-gray-200 dark:border-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`1-${allQ.length}`} autoFocus />
              <button onClick={handleJump} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Go</button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-3 sm:px-5 pb-3 overflow-x-auto scrollbar-hide">
          {filterTabs.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id ? tab.activeClass + ' shadow-sm' : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 hover:bg-gray-200 dark:hover:bg-secondary-600'
              }`}>
              <tab.icon className="w-3 h-3" />{tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab.id ? 'bg-white/25' : 'bg-gray-200 dark:bg-secondary-600'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-secondary-700">
          <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${filteredQ.length > 0 ? ((currentIdx + 1) / filteredQ.length) * 100 : 0}%` }} />
        </div>
      </header>

      {/* ═════ MAIN CONTENT ═════ */}
      <div className="flex-1 flex overflow-hidden relative" {...swipeHandlers}>
        <main ref={scrollRef} className="flex-1 overflow-y-auto">
          {filteredQ.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Filter className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions found'}</p>
              <button onClick={() => setFilter('all')} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium mt-2">{language === 'hi' ? 'सभी दिखाएं' : 'Show All'}</button>
            </div>
          ) : currentQ ? (
            <div key={`${currentIdx}-${filter}`} className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-8 ${slideDir === 'r' ? 'sol-slide-r' : 'sol-slide-l'}`}
              style={{ fontSize: `${fontSize}px` }}>
              <QuestionSolutionCard question={currentQ} language={language} index={currentIdx} total={filteredQ.length}
                isBookmarked={isBookmarked(currentQ.questionNumber)} onToggleBookmark={() => toggleBookmark(currentQ.questionNumber)} />
            </div>
          ) : null}
        </main>

        {/* Desktop Palette */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-secondary-800 border-l dark:border-secondary-700 flex-shrink-0">
          <div className="p-4 border-b dark:border-secondary-700 bg-gray-50 dark:bg-secondary-750">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary-500" />{language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter}
              onJump={goToByOriginal} counts={counts} language={language} isBookmarked={isBookmarked} />
          </div>
        </aside>

        {/* Mobile Drawer */}
        {showPalette && (
          <div className="absolute inset-0 z-50 lg:hidden flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
            <aside className="relative w-80 max-w-[85vw] bg-white dark:bg-secondary-800 h-full flex flex-col shadow-2xl sol-drawer">
              <div className="flex items-center justify-between p-4 border-b dark:border-secondary-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Hash className="w-4 h-4 text-primary-500" />{language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}</h3>
                <button onClick={() => setShowPalette(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PaletteContent allQ={allQ} filteredQ={filteredQ} currentIdx={currentIdx} filter={filter}
                  onJump={goToByOriginal} counts={counts} language={language} isBookmarked={isBookmarked} />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* ═════ FOOTER ═════ */}
      <footer className="flex-shrink-0 bg-white dark:bg-secondary-800 border-t dark:border-secondary-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-4xl mx-auto">
          <button onClick={goPrev} disabled={currentIdx <= 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-secondary-600 text-gray-700 dark:text-secondary-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">{language === 'hi' ? 'पिछला' : 'Prev'}</span>
          </button>

          <div className="flex items-center gap-3">
            {currentQ && (
              <button onClick={() => toggleBookmark(currentQ.questionNumber)}
                className={`p-2 rounded-xl transition-all ${isBookmarked(currentQ.questionNumber) ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-gray-100 dark:bg-secondary-700 text-gray-400 hover:text-amber-500'}`}
                title="Bookmark (B)">
                {isBookmarked(currentQ.questionNumber) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}
            <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-secondary-700 px-4 py-2 rounded-xl">
              <span className="text-primary-600 dark:text-primary-400">{currentIdx + 1}</span>
              <span className="text-gray-400 mx-1">/</span>
              <span>{filteredQ.length}</span>
            </span>
          </div>

          <button onClick={goNext} disabled={currentIdx >= filteredQ.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20">
            <span className="hidden sm:inline">{language === 'hi' ? 'अगला' : 'Next'}</span><ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* Keyboard hints */}
        <div className="hidden sm:flex items-center justify-center gap-4 pb-2 text-[10px] text-gray-400">
          <span>← → Navigate</span><span>B Bookmark</span><span>G Jump</span><span>ESC Close</span>
        </div>
      </footer>

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Keyboard className="w-5 h-5" /> Shortcuts</h3>
            <div className="space-y-2 text-sm">
              {[['← →','Navigate'],['B','Bookmark'],['G','Jump to Q'],['ESC','Close/Back'],['?','This help']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                  <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-secondary-600 rounded font-mono text-xs">{k}</kbd>
                  <span className="text-gray-600 dark:text-secondary-400">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   PALETTE CONTENT
   ═══════════════════════════════════════════ */
const PaletteContent = ({ allQ, filteredQ, currentIdx, filter, onJump, counts, language, isBookmarked }) => {
  const currentQNum = filteredQ[currentIdx]?.questionNumber;
  return (
    <div className="p-4 space-y-5">
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />{language==='hi'?'सही':'Correct'}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" />{language==='hi'?'गलत':'Wrong'}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400" />{language==='hi'?'छोड़ा':'Skip'}</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {allQ.map((q, i) => {
          const isCurrent = q.questionNumber === currentQNum;
          const inFilter = filteredQ.some(fq => fq.questionNumber === q.questionNumber);
          const disabled = !inFilter && filter !== 'all';
          const bm = isBookmarked(q.questionNumber);
          let colorClass = 'bg-gray-200 dark:bg-secondary-600 text-gray-600 dark:text-secondary-400';
          if (q.isCorrect) colorClass = 'bg-emerald-500 text-white';
          else if (!isSkipped(q.selectedAnswer)) colorClass = 'bg-red-500 text-white';
          return (
            <button key={i} onClick={() => onJump(i)} disabled={disabled}
              className={`relative aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200
                ${colorClass} ${isCurrent ? 'ring-3 ring-primary-500 ring-offset-2 dark:ring-offset-secondary-800 scale-110 z-10 shadow-lg' : ''}
                ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-95'}`}>
              {q.questionNumber}
              {bm && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-600 space-y-2.5">
        <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider mb-3">{language==='hi'?'सारांश':'Summary'}</h4>
        {[
          { l: language==='hi'?'कुल':'Total', v: counts.all, c: 'text-gray-900 dark:text-white' },
          { l: language==='hi'?'सही':'Correct', v: counts.correct, c: 'text-emerald-600' },
          { l: language==='hi'?'गलत':'Wrong', v: counts.wrong, c: 'text-red-600' },
          { l: language==='hi'?'छोड़ा':'Skipped', v: counts.skipped, c: 'text-gray-500' },
          ...(counts.bookmarked > 0 ? [{ l: language==='hi'?'बुकमार्क':'Bookmarked', v: counts.bookmarked, c: 'text-amber-600' }] : []),
        ].map((r, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className={`${r.c} font-medium`}>{r.l}</span>
            <span className={`font-bold ${r.c}`}>{r.v}</span>
          </div>
        ))}
        {counts.all > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-secondary-600">
            <div className="flex justify-between items-center"><span className="text-primary-600 font-medium text-sm">{language==='hi'?'सटीकता':'Accuracy'}</span>
              <span className="font-black text-primary-600 text-base">{Math.round((counts.correct/counts.all)*100)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   QUESTION SOLUTION CARD
   ═══════════════════════════════════════════ */
const QuestionSolutionCard = ({ question: q, language, index, total, isBookmarked, onToggleBookmark }) => {
  const qData = q.question;
  if (!qData) return null;
  const qType = qData.questionType;
  const difficulty = qData.difficulty || 'medium';
  const typeLbl = TYPE_LABELS[qType]?.[language] || qType;
  const diffLbl = DIFF_LABELS[difficulty]?.[language] || difficulty;

  const resultCfg = q.isCorrect
    ? { icon: CheckCircle, label: language==='hi'?'सही':'Correct', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' }
    : !isSkipped(q.selectedAnswer)
    ? { icon: XCircle, label: language==='hi'?'गलत':'Wrong', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' }
    : { icon: Circle, label: language==='hi'?'छोड़ा':'Skipped', cls: 'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 border-gray-200 dark:border-secondary-600' };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-sm border border-gray-200 dark:border-secondary-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-secondary-700 bg-gray-50/80 dark:bg-secondary-750/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white dark:bg-secondary-700 shadow-sm border border-gray-200 dark:border-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-black text-gray-900 dark:text-white">{q.questionNumber}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-bold rounded uppercase">{typeLbl}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{diffLbl}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {q.timeTaken > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-white dark:bg-secondary-700 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-secondary-600">
                <Clock className="w-3 h-3" />{q.timeTaken}s
              </span>
            )}
            <button onClick={onToggleBookmark}
              className={`p-1.5 rounded-lg transition-all ${isBookmarked ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'hover:bg-gray-100 dark:hover:bg-secondary-700 text-gray-400'}`}>
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${resultCfg.cls}`}>
              <resultCfg.icon className="w-4 h-4" />{resultCfg.label}
            </span>
          </div>
        </div>
        {(qData.unit || qData.chapter || qData.topic) && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-secondary-600 flex items-center gap-1.5 text-xs text-gray-500 dark:text-secondary-400 overflow-x-auto">
            <Tag className="w-3 h-3 flex-shrink-0" />{[qData.unit, qData.chapter, qData.topic].filter(Boolean).join(' › ')}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 lg:p-8 space-y-6">
        <QuestionContent qData={qData} language={language} />
        <OptionsDisplay qData={qData} language={language} selectedAnswer={q.selectedAnswer} correctAnswer={q.correctAnswer} />

        {/* Answer bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-600">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{language==='hi'?'आपका:':'Yours:'}</span>
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${
              isSkipped(q.selectedAnswer) ? 'bg-gray-200 text-gray-600 dark:bg-secondary-600 dark:text-secondary-300'
              : q.isCorrect ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {isSkipped(q.selectedAnswer) ? (language==='hi'?'—':'—') : `(${optLabel(q.selectedAnswer)})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{language==='hi'?'सही:':'Correct:'}</span>
            <span className="text-sm font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg">({optLabel(q.correctAnswer)})</span>
          </div>
        </div>

        {/* Explanation */}
        {qData.explanation && (bText(qData.explanation, language) || bText(qData.explanation, language==='hi'?'en':'hi')) && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl"><BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
              <span className="font-bold text-gray-900 dark:text-white">{language==='hi'?'व्याख्या':'Explanation'}</span>
            </div>
            <div className="p-5 bg-blue-50/70 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl">
              <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">
                {bText(qData.explanation, language) || bText(qData.explanation, language==='hi'?'en':'hi')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   QUESTION CONTENT (all types)
   ═══════════════════════════════════════════ */
const QuestionContent = ({ qData, language }) => {
  const qType = qData.questionType;
  const questionText = bText(qData.question, language);

  if (qType === 'passage_based' && qData.passageId) {
    const passageContent = bText(qData.passageId.content, language);
    return (
      <div className="space-y-4">
        {passageContent && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-xl max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider"><BookOpen className="w-3.5 h-3.5" />{language==='hi'?'गद्यांश':'PASSAGE'}</div>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{passageContent}</p>
          </div>
        )}
        <p className="text-gray-900 dark:text-white font-medium leading-relaxed">{questionText}</p>
      </div>
    );
  }

  if (qType === 'assertion_reason') {
    return (
      <div className="space-y-4">
        {questionText && <p className="text-gray-700 dark:text-secondary-300 font-medium text-sm">{questionText}</p>}
        <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">A</span>
          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase">{language==='hi'?'अभिकथन':'Assertion (A)'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200">{bText(qData.assertionReasonData?.assertion, language)}</p>
          </div>
        </div>
        <div className="flex gap-3 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">R</span>
          <div>
            <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1 uppercase">{language==='hi'?'कारण':'Reason (R)'}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200">{bText(qData.assertionReasonData?.reason, language)}</p>
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
        <p className="text-gray-900 dark:text-white font-medium">{questionText || (language==='hi'?'सूची-I को सूची-II से सुमेलित कीजिए:':'Match List-I with List-II:')}</p>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-secondary-600">
          <div className="grid grid-cols-2 bg-gray-100 dark:bg-secondary-700 border-b border-gray-200 dark:border-secondary-600">
            <div className="px-4 py-2.5 font-bold text-sm border-r border-gray-200 dark:border-secondary-600">{language==='hi'?'सूची-I':'List-I'}</div>
            <div className="px-4 py-2.5 font-bold text-sm">{language==='hi'?'सूची-II':'List-II'}</div>
          </div>
          {listA.map((a, i) => (
            <div key={i} className="grid grid-cols-2 border-b border-gray-100 dark:border-secondary-700 last:border-0">
              <div className="px-4 py-3 text-sm border-r border-gray-100 dark:border-secondary-700"><span className="font-bold text-primary-600 mr-1">({optLabel(i)})</span>{a}</div>
              <div className="px-4 py-3 text-sm"><span className="font-bold text-primary-600 mr-1">{roman(i)}</span>{listB[i] || ''}</div>
            </div>
          ))}
        </div>
        {qData.matchData?.correctMatch && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-emerald-800 dark:text-emerald-300">{language==='hi'?'सही मिलान:':'Correct:'}</span>
            <span className="text-emerald-700 dark:text-emerald-400">{qData.matchData.correctMatch.map((m,i)=>`${optLabel(i)}-${roman(m)}`).join(', ')}</span>
          </div>
        )}
      </div>
    );
  }

  if (qType === 'statement_based') {
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium">{questionText || (language==='hi'?'निम्नलिखित कथनों पर विचार कीजिए:':'Consider the following statements:')}</p>
        <div className="space-y-2">
          {bArr(qData.statementData?.statements, language).map((s, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-secondary-700/50 rounded-xl border border-gray-100 dark:border-secondary-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white dark:bg-secondary-600 flex items-center justify-center text-xs font-bold shadow-sm">{i+1}</span>
              <span className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed pt-0.5">{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (qType === 'sequence_order') {
    return (
      <div className="space-y-4">
        <p className="text-gray-900 dark:text-white font-medium">{questionText || (language==='hi'?'सही क्रम में व्यवस्थित कीजिए:':'Arrange in correct order:')}</p>
        <div className="space-y-2">
          {bArr(qData.sequenceData?.items, language).map((item, i) => (
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
  if (['di_table','di_bar_chart','di_pie_chart','di_line_graph','di_caselet','di_mixed'].includes(qType) && qData.diDataId) {
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
                  <tr key={ri} className={ri%2?'bg-gray-50 dark:bg-secondary-750':''}>
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
                  <BarChart data={bArr(di.chartData?.labels,language).map((l,i)=>{const item={name:l};(di.chartData?.datasets||[]).forEach((ds,d)=>{item[bText(ds.label,language)||`S${d+1}`]=ds.data[i]||0;});return item;})}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend/>
                    {(di.chartData?.datasets||[]).map((ds,i)=><Bar key={i} dataKey={bText(ds.label,language)||`S${i+1}`} fill={ds.color||COLORS[i%COLORS.length]} radius={[4,4,0,0]}/>)}
                  </BarChart>
                ) : qType === 'di_line_graph' ? (
                  <LineChart data={bArr(di.chartData?.labels,language).map((l,i)=>{const item={name:l};(di.chartData?.datasets||[]).forEach((ds,d)=>{item[bText(ds.label,language)||`S${d+1}`]=ds.data[i]||0;});return item;})}>
                    <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Legend/>
                    {(di.chartData?.datasets||[]).map((ds,i)=><Line key={i} type="monotone" dataKey={bText(ds.label,language)||`S${i+1}`} stroke={ds.color||COLORS[i%COLORS.length]} strokeWidth={2}/>)}
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie data={bArr(di.chartData?.labels,language).map((l,i)=>({name:l,value:di.chartData?.datasets?.[0]?.data?.[i]||0}))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {bArr(di.chartData?.labels,language).map((_,i)=><Cell key={i} fill={(di.chartData?.datasets?.[0]?.colors||COLORS)[i%COLORS.length]}/>)}
                    </Pie><Tooltip/><Legend/>
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
          {qType === 'di_caselet' && bText(di.caseletText,language) && (
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-line">{bText(di.caseletText,language)}</p>
          )}
        </div>
        <p className="text-gray-900 dark:text-white font-medium leading-relaxed mt-4">{questionText}</p>
      </div>
    );
  }

  return <p className="text-gray-900 dark:text-white font-medium leading-relaxed">{questionText}</p>;
};

/* ═══════════════════════════════════════════
   OPTIONS DISPLAY
   ═══════════════════════════════════════════ */
const OptionsDisplay = ({ qData, language, selectedAnswer, correctAnswer }) => {
  const options = bArr(qData.options, language);
  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const isCorrect = i === correctAnswer;
        const isSelected = i === selectedAnswer;
        const isWrong = isSelected && !isCorrect;
        let cls = 'border-gray-200 dark:border-secondary-600 bg-white dark:bg-secondary-800';
        let icon = <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-secondary-500" />;
        let textCls = 'text-gray-700 dark:text-secondary-300';
        if (isCorrect) { cls = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-400/50'; icon = <CheckCircle className="w-6 h-6 text-emerald-600" />; textCls = 'text-emerald-800 dark:text-emerald-200 font-medium'; }
        else if (isWrong) { cls = 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-400/50'; icon = <XCircle className="w-6 h-6 text-red-600" />; textCls = 'text-red-800 dark:text-red-200 font-medium'; }
        return (
          <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${cls}`}>
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm opacity-60">({optLabel(i)})</span>
                {isCorrect && <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{language==='hi'?'सही उत्तर':'Correct'}</span>}
                {isWrong && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">{language==='hi'?'आपका उत्तर':'Your Answer'}</span>}
              </div>
              <p className={`text-sm sm:text-base leading-relaxed ${textCls}`}>{opt}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SolutionView;