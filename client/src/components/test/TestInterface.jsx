import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Flag, RotateCcw, Send, Menu, X,
  Globe, AlertTriangle, Calculator, FileText, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Keyboard, Wifi, WifiOff, Clock,
  LayoutGrid, Eye, Bookmark, Check, Info, ChevronDown,
  Save, Star, HelpCircle, Settings, Hash, Monitor
} from 'lucide-react';
import { useTestContext } from '../../context/TestContext';
import TestTimer from './TestTimer';
import TestPalette from './TestPalette';
import TestSubmitModal from './TestSubmitModal';
import QuestionDisplay from './QuestionDisplay';
import ExamCalculator from './ExamCalculator';
import ExamNotepad from './ExamNotepad';
import Loader from '../common/Loader';
import { TEST_TYPE_CONFIG, PAPER_LABELS, QUESTION_TYPE_LABELS } from '../../utils/constants';

/* ─── Keyboard Shortcuts Overlay ─── */
const ShortcutsOverlay = ({ onClose, language }) => {
  const shortcuts = [
    { keys: ['←'], label: { hi: 'पिछला प्रश्न', en: 'Previous Question' } },
    { keys: ['→'], label: { hi: 'अगला प्रश्न', en: 'Next Question' } },
    { keys: ['1', '2', '3', '4'], label: { hi: 'विकल्प चुनें', en: 'Select Option' } },
    { keys: ['M'], label: { hi: 'समीक्षा हेतु चिह्नित', en: 'Mark for Review' } },
    { keys: ['C'], label: { hi: 'उत्तर हटाएं', en: 'Clear Response' } },
    { keys: ['F'], label: { hi: 'फुलस्क्रीन', en: 'Toggle Fullscreen' } },
    { keys: ['Ctrl', '+'], label: { hi: 'ज़ूम इन', en: 'Zoom In' } },
    { keys: ['Ctrl', '−'], label: { hi: 'ज़ूम आउट', en: 'Zoom Out' } },
    { keys: ['?'], label: { hi: 'शॉर्टकट दिखाएं/छुपाएं', en: 'Toggle Shortcuts' } },
    { keys: ['Esc'], label: { hi: 'पैनल बंद करें', en: 'Close Panels' } },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {language === 'hi' ? 'कीबोर्ड शॉर्टकट' : 'Keyboard Shortcuts'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {language === 'hi' ? s.label.hi : s.label.en}
              </span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <span className="text-slate-400 text-xs">+</span>}
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md text-xs font-mono font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm min-w-[28px] text-center">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Toolbar Button ─── */
const ToolBtn = ({ icon: Icon, label, active, onClick, badge, className = '' }) => (
  <button
    onClick={onClick}
    title={label}
    className={`
      relative p-2 rounded-xl transition-all duration-150
      ${active
        ? 'bg-white/20 text-white shadow-inner'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'}
      ${className}
    `}
  >
    <Icon className="w-[18px] h-[18px]" />
    {badge && (
      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full flex items-center justify-center text-[7px] font-bold text-slate-900">
        {badge}
      </span>
    )}
  </button>
);

/* ─── Main TestInterface ─── */
const TestInterface = () => {
  const navigate = useNavigate();
  const {
    test, attempt, questions, answers,
    currentIndex, currentQuestion, currentAnswer,
    remainingTime, language, status, isSubmitting, showSubmitModal,
    goToQuestion, selectAnswer, toggleMarkForReview, clearResponse,
    saveAndNext, previousQuestion, openSubmitModal, closeSubmitModal,
    submitTest, setLanguage, updateRemainingTime, getStatusSummary,
  } = useTestContext();

  // ── UI State ──
  const [showPalette, setShowPalette] = useState(true);
  const [mobilePalette, setMobilePalette] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [qElapsed, setQElapsed] = useState(0);
  const [showTools, setShowTools] = useState(false);

  const qStartRef = useRef(Date.now());
  const questionAreaRef = useRef(null);

  // ── Per-question timer ──
  useEffect(() => {
    qStartRef.current = Date.now();
    setQElapsed(0);
    const iv = setInterval(() => {
      setQElapsed(Math.floor((Date.now() - qStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [currentIndex]);

  // ── Online/Offline ──
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Zoom ──
  const zoomIn = useCallback(() => setFontSize(p => Math.min(p + 2, 24)), []);
  const zoomOut = useCallback(() => setFontSize(p => Math.max(p - 2, 12)), []);

  // ── Auto-save indicator ──
  useEffect(() => {
    if (currentAnswer?.selectedAnswer !== undefined && currentAnswer.selectedAnswer !== -1) {
      setLastSaved(new Date());
    }
  }, [currentAnswer?.selectedAnswer]);

  // ── Scroll to top on question change ──
  useEffect(() => {
    questionAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handle = (e) => {
      if (showSubmitModal || isSubmitting) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); previousQuestion(); break;
        case 'ArrowRight': e.preventDefault(); saveAndNext(); break;
        case '1': case '2': case '3': case '4':
          e.preventDefault(); selectAnswer(parseInt(e.key) - 1); break;
        case 'm': case 'M': e.preventDefault(); toggleMarkForReview(); break;
        case 'c': case 'C': e.preventDefault(); clearResponse(); break;
        case 'f': case 'F':
          if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); toggleFullscreen(); }
          break;
        case '=': case '+':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomIn(); }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomOut(); }
          break;
        case '?': e.preventDefault(); setShowShortcuts(p => !p); break;
        case 'Escape':
          setShowCalc(false); setShowNotepad(false); setShowShortcuts(false);
          setMobilePalette(false); setShowTools(false);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [showSubmitModal, isSubmitting, previousQuestion, saveAndNext, selectAnswer,
      toggleMarkForReview, clearResponse, toggleFullscreen, zoomIn, zoomOut]);

  // ── Time up ──
  const handleTimeUp = useCallback(() => {
    openSubmitModal();
    setTimeout(() => handleSubmit(), 3000);
  }, [openSubmitModal]);

  const handleTimerTick = useCallback((s) => updateRemainingTime(s), [updateRemainingTime]);

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitError(null);
    if (!attempt?._id) { setSubmitError('No attempt found'); return; }
    try {
      const result = await submitTest();
      if (result?.success) {
        sessionStorage.removeItem('currentTest');
        navigate(`/results/${result.attemptId || attempt._id}`, {
          replace: true, state: { fromTest: true, justSubmitted: true },
        });
      } else {
        setSubmitError(result?.error || 'Submit failed');
      }
    } catch (err) {
      setSubmitError(err.message || 'Submit error');
    }
  };

  // ── Derived ──
  const typeConfig = test?.testType ? (TEST_TYPE_CONFIG[test.testType] || {}) : {};
  const paperLabel = test?.paper ? (PAPER_LABELS[test.paper] || {}) : {};
  const qTypeLabel = currentQuestion?.questionType
    ? (QUESTION_TYPE_LABELS[currentQuestion.questionType] || {})
    : {};
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const formatQTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `0:${String(sec).padStart(2, '0')}`;
  };

  // ── Loading ──
  if (status === 'loading' || !test || !questions?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Loader size="lg" text={language === 'hi' ? 'परीक्षा लोड हो रही है...' : 'Loading test...'} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{language === 'hi' ? 'त्रुटि' : 'Error'}</h2>
          <p className="text-slate-500 mb-6">{language === 'hi' ? 'कुछ गलत हो गया' : 'Something went wrong'}</p>
          <button onClick={() => navigate('/tests')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden select-none">

      {/* ════════════ HEADER ════════════ */}
      <header className="flex-shrink-0 bg-gradient-to-r from-slate-900 via-[#0f1a2e] to-slate-900 text-white shadow-xl z-30">
        {/* Row 1: Main bar */}
        <div className="flex items-center justify-between h-14 px-3 lg:px-5">
          {/* Left: Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 flex-shrink-0">
              <span className="text-[10px] font-bold tracking-wider text-blue-300">
                {typeConfig.shortCode || 'TEST'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{test.title}</h1>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                {language === 'hi' ? paperLabel.hi : paperLabel.en}
              </p>
            </div>
          </div>

          {/* Center: Timer */}
          <div className="flex-shrink-0 mx-4">
            <TestTimer
              initialSeconds={remainingTime || test.duration * 60}
              onTimeUp={handleTimeUp}
              onTick={handleTimerTick}
              autoStart language={language}
            />
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Connection indicator */}
            <div className="hidden sm:flex items-center mr-2" title={isOnline ? 'Online' : 'Offline'}>
              {isOnline
                ? <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                : <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              }
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                <Check className="w-3 h-3" />
                <span className="text-[9px] font-medium">
                  {language === 'hi' ? 'सहेजा' : 'Saved'}
                </span>
              </div>
            )}

            {/* Language Toggle */}
            <div className="hidden md:flex items-center bg-white/10 rounded-xl p-0.5 gap-0.5">
              <button onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${language === 'hi' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}>
                हिंदी
              </button>
              <button onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${language === 'en' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}>
                Eng
              </button>
            </div>

            {/* Mobile language */}
            <button onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:bg-white/10">
              <Globe className="w-[18px] h-[18px]" />
            </button>

            {/* Tools (desktop) */}
            <div className="hidden lg:flex items-center gap-0.5 ml-1 pl-2 border-l border-white/10">
              <ToolBtn icon={Calculator} label="Calculator" active={showCalc}
                onClick={() => { setShowCalc(p => !p); setShowNotepad(false); }} />
              <ToolBtn icon={FileText} label="Notepad" active={showNotepad}
                onClick={() => { setShowNotepad(p => !p); setShowCalc(false); }} />
              <ToolBtn icon={ZoomIn} label="Zoom In" onClick={zoomIn} />
              <ToolBtn icon={ZoomOut} label="Zoom Out" onClick={zoomOut} />
              <ToolBtn icon={isFullscreen ? Minimize2 : Maximize2}
                label="Fullscreen" active={isFullscreen} onClick={toggleFullscreen} />
              <ToolBtn icon={Keyboard} label="Shortcuts" onClick={() => setShowShortcuts(p => !p)} />
            </div>

            {/* Tools (mobile) */}
            <div className="relative lg:hidden">
              <button onClick={() => setShowTools(p => !p)}
                className="p-2 rounded-xl text-slate-300 hover:bg-white/10">
                <Settings className="w-[18px] h-[18px]" />
              </button>
              {showTools && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTools(false)} />
                  <div className="absolute right-0 top-12 z-50 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 min-w-[180px] animate-scale-in">
                    {[
                      { icon: Calculator, label: language === 'hi' ? 'कैलकुलेटर' : 'Calculator', fn: () => { setShowCalc(p => !p); setShowNotepad(false); setShowTools(false); }},
                      { icon: FileText, label: language === 'hi' ? 'नोटपैड' : 'Notepad', fn: () => { setShowNotepad(p => !p); setShowCalc(false); setShowTools(false); }},
                      { icon: ZoomIn, label: language === 'hi' ? 'ज़ूम इन' : 'Zoom In', fn: () => { zoomIn(); setShowTools(false); }},
                      { icon: ZoomOut, label: language === 'hi' ? 'ज़ूम आउट' : 'Zoom Out', fn: () => { zoomOut(); setShowTools(false); }},
                      { icon: isFullscreen ? Minimize2 : Maximize2, label: language === 'hi' ? 'फुलस्क्रीन' : 'Fullscreen', fn: () => { toggleFullscreen(); setShowTools(false); }},
                      { icon: Keyboard, label: language === 'hi' ? 'शॉर्टकट' : 'Shortcuts', fn: () => { setShowShortcuts(true); setShowTools(false); }},
                    ].map(({ icon: Ic, label, fn }, i) => (
                      <button key={i} onClick={fn}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                        <Ic className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Palette toggle (desktop) */}
            <button onClick={() => setShowPalette(p => !p)}
              className="hidden lg:flex p-2 rounded-xl text-slate-300 hover:bg-white/10 ml-1">
              {showPalette ? <X className="w-[18px] h-[18px]" /> : <LayoutGrid className="w-[18px] h-[18px]" />}
            </button>

            {/* Mobile palette */}
            <button onClick={() => setMobilePalette(true)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-white/10">
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Row 2: Progress */}
        <div className="h-8 px-3 lg:px-5 flex items-center gap-4 bg-black/20 border-t border-white/5">
          <div className="flex-1 flex items-center gap-3">
            {/* Progress bar */}
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden max-w-sm">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[11px] text-slate-400 font-medium tabular-nums flex-shrink-0">
              {language === 'hi' ? 'प्रश्न' : 'Q'} {currentIndex + 1} / {questions.length}
              <span className="hidden sm:inline text-slate-500 ml-1">({progressPercent}%)</span>
            </span>
          </div>
          {/* Font size indicator */}
          {fontSize !== 16 && (
            <button onClick={() => setFontSize(16)} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <span className="tabular-nums">{fontSize}px</span>
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </header>

      {/* ════════════ MAIN CONTENT ════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Question Area ── */}
        <main
          ref={questionAreaRef}
          className={`flex-1 overflow-y-auto transition-all duration-300 ${showPalette ? 'lg:mr-0' : ''}`}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">

            {/* Question Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">

              {/* Question Header Bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm">
                    {currentIndex + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                    {language === 'hi' ? qTypeLabel.hi : qTypeLabel.en || 'MCQ'}
                  </span>
                  {currentAnswer?.markedForReview && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[11px] font-semibold">
                      <Flag className="w-3 h-3" />
                      {language === 'hi' ? 'समीक्षा' : 'Review'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono tabular-nums">
                    {formatQTime(qElapsed)}
                  </span>
                </div>
              </div>

              {/* Question Body */}
              <div className="p-5 sm:p-7" style={{ fontSize: `${fontSize}px` }}>
                {currentQuestion ? (
                  <QuestionDisplay
                    question={currentQuestion}
                    language={language}
                    selectedAnswer={currentAnswer?.selectedAnswer ?? -1}
                    onAnswerSelect={selectAnswer}
                    showQuestionNumber={false}
                    questionNumber={currentIndex + 1}
                  />
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Loader size="md" />
                    <p className="mt-4 text-sm">
                      {language === 'hi' ? 'प्रश्न लोड हो रहा है...' : 'Loading...'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Left actions */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMarkForReview}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95
                    ${currentAnswer?.markedForReview
                      ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'hi' ? 'समीक्षा' : 'Review'}
                  </span>
                </button>
                <button onClick={clearResponse}
                  disabled={currentAnswer?.selectedAnswer === -1}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95">
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'hi' ? 'हटाएं' : 'Clear'}
                  </span>
                </button>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 justify-end">
                <button onClick={previousQuestion} disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'hi' ? 'पिछला' : 'Prev'}
                  </span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button onClick={saveAndNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                    <span>{language === 'hi' ? 'सेव और अगला' : 'Save & Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={openSubmitModal}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                    <Send className="w-4 h-4" />
                    <span>{language === 'hi' ? 'जमा करें' : 'Submit'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Keyboard hint (desktop) */}
            <div className="mt-4 text-center hidden lg:block">
              <p className="text-[11px] text-slate-400 dark:text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">←</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">→</kbd>
                  {language === 'hi' ? ' नेविगेट' : ' Navigate'}
                </span>
                <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">1-4</kbd>
                  {language === 'hi' ? ' विकल्प' : ' Options'}
                </span>
                <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">M</kbd>
                  {language === 'hi' ? ' समीक्षा' : ' Review'}
                </span>
                <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">?</kbd>
                  {language === 'hi' ? ' सभी शॉर्टकट' : ' All Shortcuts'}
                </span>
              </p>
            </div>
          </div>
        </main>

        {/* ── Desktop Palette ── */}
        {showPalette && (
          <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <TestPalette
              answers={answers}
              questions={questions}
              currentIndex={currentIndex}
              onQuestionClick={goToQuestion}
              onSubmit={openSubmitModal}
              isSubmitting={isSubmitting}
              language={language}
            />
          </aside>
        )}

        {/* ── Mobile Palette Drawer ── */}
        {mobilePalette && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobilePalette(false)} />
            <aside className="fixed right-0 top-0 bottom-0 w-[300px] z-50 lg:hidden shadow-2xl animate-slide-left flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
                </h3>
                <button onClick={() => setMobilePalette(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <TestPalette
                answers={answers}
                questions={questions}
                currentIndex={currentIndex}
                onQuestionClick={(i) => { goToQuestion(i); setMobilePalette(false); }}
                onSubmit={() => { setMobilePalette(false); openSubmitModal(); }}
                isSubmitting={isSubmitting}
                language={language}
              />
            </aside>
          </>
        )}
      </div>

      {/* ════════════ FLOATING PANELS ════════════ */}
      {showCalc && (
        <ExamCalculator onClose={() => setShowCalc(false)} language={language} />
      )}
      {showNotepad && (
        <ExamNotepad onClose={() => setShowNotepad(false)} testId={test?._id} language={language} />
      )}

      {/* ════════════ OVERLAYS ════════════ */}
      {showShortcuts && (
        <ShortcutsOverlay onClose={() => setShowShortcuts(false)} language={language} />
      )}

      <TestSubmitModal
        isOpen={showSubmitModal}
        onClose={closeSubmitModal}
        onSubmit={handleSubmit}
        summary={getStatusSummary()}
        remainingTime={remainingTime}
        isSubmitting={isSubmitting}
        language={language}
        error={submitError}
      />
    </div>
  );
};

export default TestInterface;