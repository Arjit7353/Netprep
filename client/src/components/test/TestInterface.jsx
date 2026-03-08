import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Flag, RotateCcw, Send, Menu, X,
  Globe, AlertTriangle, Calculator, FileText, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Keyboard, Wifi, WifiOff, Clock,
  LayoutGrid, Eye, Check, Settings, Monitor, BookOpen, Save,
  Trophy, Target, Zap, Shield, Crown, Star, Flame, Play,
  ChevronDown, Hash, CircleDot, PanelRightClose, PanelRightOpen,
  GraduationCap, Timer, Bookmark, StickyNote, CheckCircle,
  SkipForward, ArrowRight, Sparkles, Volume2, VolumeX
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

/* ═══════════════════════════════════════════════════
   KEYBOARD SHORTCUTS MODAL
   ═══════════════════════════════════════════════════ */
const ShortcutsModal = ({ onClose, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  const groups = [
    {
      title: t('नेविगेशन', 'Navigation'),
      items: [
        { keys: ['←'], label: t('पिछला प्रश्न', 'Previous Question') },
        { keys: ['→'], label: t('अगला प्रश्न', 'Next Question') },
        { keys: ['S'], label: t('सेव और अगला', 'Save & Next') },
      ],
    },
    {
      title: t('उत्तर', 'Answering'),
      items: [
        { keys: ['1', '2', '3', '4'], label: t('विकल्प चुनें', 'Select Option') },
        { keys: ['C'], label: t('उत्तर हटाएं', 'Clear Response') },
        { keys: ['M'], label: t('समीक्षा चिह्नित', 'Mark for Review') },
      ],
    },
    {
      title: t('उपकरण', 'Tools'),
      items: [
        { keys: ['F'], label: t('फुलस्क्रीन', 'Fullscreen') },
        { keys: ['Ctrl', '+'], label: t('ज़ूम इन', 'Zoom In') },
        { keys: ['Ctrl', '−'], label: t('ज़ूम आउट', 'Zoom Out') },
        { keys: ['?'], label: t('शॉर्टकट', 'Shortcuts') },
        { keys: ['Esc'], label: t('बंद करें', 'Close Panel') },
      ],
    },
  ];

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-modalIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('कीबोर्ड शॉर्टकट', 'Keyboard Shortcuts')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-2.5 px-1">
                {group.title}
              </p>
              <div className="space-y-1.5">
                {group.items.map((item, ii) => (
                  <div
                    key={ii}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, ki) => (
                        <React.Fragment key={ki}>
                          {ki > 0 && <span className="text-slate-300 dark:text-slate-600 text-[10px]">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            {t('Esc दबाकर बंद करें', 'Press Esc to close')}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   HEADER TOOL BUTTON
   ═══════════════════════════════════════════════════ */
const HeaderTool = ({ icon: Icon, active, onClick, title, badge }) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative p-2 rounded-lg transition-all duration-150 ${
      active
        ? 'bg-white/15 text-white'
        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
    }`}
  >
    <Icon className="w-[18px] h-[18px]" />
    {badge && (
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
    )}
  </button>
);

/* ═══════════════════════════════════════════════════
   MOBILE TOOLS DROPDOWN
   ═══════════════════════════════════════════════════ */
const MobileToolsDropdown = ({ onClose, items }) => (
  <>
    <div className="fixed inset-0 z-[70]" onClick={onClose} />
    <div className="absolute right-0 top-full mt-2 z-[80] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1 min-w-[180px] animate-dropIn">
      {items.map(({ icon: Ic, label, fn, active }, i) => (
        <button
          key={i}
          onClick={fn}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
            active
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Ic className="w-4 h-4" />
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  </>
);

/* ═══════════════════════════════════════════════════
   OFFLINE BANNER
   ═══════════════════════════════════════════════════ */
const OfflineBanner = ({ language }) => (
  <div className="flex-shrink-0 bg-red-600 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-bold z-30">
    <WifiOff className="w-3.5 h-3.5 animate-pulse" />
    {language === 'hi'
      ? 'इंटरनेट कनेक्शन नहीं है। आपके उत्तर स्थानीय रूप से सहेजे जा रहे हैं।'
      : 'No internet connection. Your answers are being saved locally.'}
  </div>
);

/* ═══════════════════════════════════════════════════
           MAIN TEST INTERFACE COMPONENT
   ═══════════════════════════════════════════════════ */
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

  // ── Local State ──
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
  const [showMobileTools, setShowMobileTools] = useState(false);

  const qStartRef = useRef(Date.now());
  const questionAreaRef = useRef(null);

  const t = useCallback((hi, en) => language === 'hi' ? hi : en, [language]);

  // ── Per-question stopwatch ──
  useEffect(() => {
    qStartRef.current = Date.now();
    setQElapsed(0);
    const iv = setInterval(() => {
      setQElapsed(Math.floor((Date.now() - qStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [currentIndex]);

  // ── Online / Offline ──
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
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

  // ── Font Size ──
  const zoomIn = useCallback(() => setFontSize(p => Math.min(p + 2, 24)), []);
  const zoomOut = useCallback(() => setFontSize(p => Math.max(p - 2, 12)), []);
  const resetZoom = useCallback(() => setFontSize(16), []);

  // ── Auto-save indicator ──
  useEffect(() => {
    if (currentAnswer?.selectedAnswer !== undefined && currentAnswer.selectedAnswer !== -1) {
      setLastSaved(new Date());
    }
  }, [currentAnswer?.selectedAnswer]);

  // ── Scroll top on question change ──
  useEffect(() => {
    questionAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  // ── Keyboard Shortcuts ──
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
          setShowCalc(false);
          setShowNotepad(false);
          setShowShortcuts(false);
          setMobilePalette(false);
          setShowMobileTools(false);
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
    setTimeout(() => handleSubmitFn(), 3000);
  }, [openSubmitModal]);

  const handleTimerTick = useCallback((s) => updateRemainingTime(s), [updateRemainingTime]);

  // ── Submit ──
  const handleSubmitFn = async () => {
    setSubmitError(null);
    if (!attempt?._id) {
      setSubmitError('No attempt found');
      return;
    }
    try {
      const result = await submitTest();
      if (result?.success) {
        sessionStorage.removeItem('currentTest');
        navigate(`/results/${result.attemptId || attempt._id}`, {
          replace: true,
          state: { fromTest: true, justSubmitted: true },
        });
      } else {
        setSubmitError(result?.error || 'Submit failed');
      }
    } catch (err) {
      setSubmitError(err.message || 'Submit error');
    }
  };

  // ── Derived Data ──
  const typeConfig = test?.testType ? (TEST_TYPE_CONFIG[test.testType] || {}) : {};
  const paperLabel = test?.paper ? (PAPER_LABELS[test.paper] || {}) : {};
  const qTypeLabel = currentQuestion?.questionType
    ? (QUESTION_TYPE_LABELS[currentQuestion.questionType] || {})
    : {};

  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0
    ? Math.round(((currentIndex + 1) / totalQuestions) * 100)
    : 0;

  const answeredCount = useMemo(
    () => answers.filter(a => a?.selectedAnswer !== -1 && a?.selectedAnswer !== undefined).length,
    [answers]
  );

  const reviewCount = useMemo(
    () => answers.filter(a => a?.markedForReview).length,
    [answers]
  );

  const formatQTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const isAnswered = currentAnswer?.selectedAnswer !== undefined && currentAnswer?.selectedAnswer !== -1;
  const isReviewed = currentAnswer?.markedForReview;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;

  // ── Mobile tool items ──
  const mobileToolItems = [
    {
      icon: Calculator,
      label: t('कैलकुलेटर', 'Calculator'),
      active: showCalc,
      fn: () => { setShowCalc(p => !p); setShowNotepad(false); setShowMobileTools(false); },
    },
    {
      icon: StickyNote,
      label: t('नोटपैड', 'Notepad'),
      active: showNotepad,
      fn: () => { setShowNotepad(p => !p); setShowCalc(false); setShowMobileTools(false); },
    },
    {
      icon: ZoomIn,
      label: t('ज़ूम इन', 'Zoom In'),
      fn: () => { zoomIn(); setShowMobileTools(false); },
    },
    {
      icon: ZoomOut,
      label: t('ज़ूम आउट', 'Zoom Out'),
      fn: () => { zoomOut(); setShowMobileTools(false); },
    },
    {
      icon: isFullscreen ? Minimize2 : Maximize2,
      label: t('फुलस्क्रीन', 'Fullscreen'),
      active: isFullscreen,
      fn: () => { toggleFullscreen(); setShowMobileTools(false); },
    },
    {
      icon: Keyboard,
      label: t('शॉर्टकट', 'Shortcuts'),
      fn: () => { setShowShortcuts(true); setShowMobileTools(false); },
    },
  ];

  // ── Loading State ──
  if (status === 'loading' || !test || !questions?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {t('परीक्षा लोड हो रही है...', 'Loading exam...')}
          </p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {t('कुछ गलत हुआ', 'Something went wrong')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {t('परीक्षा लोड करने में त्रुटि हुई।', 'Failed to load the exam.')}
          </p>
          <button
            onClick={() => navigate('/tests')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            {t('वापस जाएं', 'Go Back')}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
                    RENDER EXAM UI
     ═══════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">

      {/* ── OFFLINE BANNER ── */}
      {!isOnline && <OfflineBanner language={language} />}

      {/* ══════════════════════════════════════════════
                        EXAM HEADER
         ══════════════════════════════════════════════ */}
      <header className="flex-shrink-0 z-30 select-none">
        <div className="bg-slate-900 dark:bg-[#0a0e1a]">
          <div className="flex items-center justify-between h-[52px] px-3 lg:px-5">

            {/* ── Left: Logo + Test Name ── */}
            <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider leading-none mb-0.5">
                  {typeConfig.shortCode || 'EXAM'}
                  {' · '}
                  {t(paperLabel.hi, paperLabel.en)}
                </p>
                <h1 className="text-xs font-semibold text-white/80 truncate max-w-[180px] lg:max-w-[280px] leading-tight">
                  {test.title}
                </h1>
              </div>
            </div>

            {/* ── Center: Timer ── */}
            <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-1.5 border border-white/[0.06]">
              <Timer className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <TestTimer
                initialSeconds={remainingTime || test.duration * 60}
                onTimeUp={handleTimeUp}
                onTick={handleTimerTick}
                autoStart
                language={language}
                compact
              />
            </div>

            {/* ── Right: Controls ── */}
            <div className="flex items-center gap-1 flex-shrink-0">

              {/* Save indicator */}
              {lastSaved && (
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 mr-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400">
                    {t('सहेजा', 'Saved')}
                  </span>
                </div>
              )}

              {/* Connection (desktop) */}
              {isOnline && (
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] mr-1">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold text-white/30">LIVE</span>
                </div>
              )}

              {/* Language toggle */}
              <div className="hidden md:flex items-center bg-white/[0.06] rounded-lg p-0.5 border border-white/[0.06]">
                {['hi', 'en'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-150 ${
                      language === lang
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-white/35 hover:text-white/60'
                    }`}
                  >
                    {lang === 'hi' ? 'हिंदी' : 'ENG'}
                  </button>
                ))}
              </div>

              {/* Mobile language */}
              <button
                onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
                className="md:hidden p-2 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/[0.06]"
              >
                <Globe className="w-[18px] h-[18px]" />
              </button>

              {/* Separator */}
              <div className="hidden lg:block w-px h-6 bg-white/[0.08] mx-1" />

              {/* Desktop Tools */}
              <div className="hidden lg:flex items-center gap-0.5">
                <HeaderTool
                  icon={Calculator}
                  active={showCalc}
                  title={t('कैलकुलेटर', 'Calculator')}
                  onClick={() => { setShowCalc(p => !p); setShowNotepad(false); }}
                />
                <HeaderTool
                  icon={StickyNote}
                  active={showNotepad}
                  title={t('नोटपैड', 'Notepad')}
                  onClick={() => { setShowNotepad(p => !p); setShowCalc(false); }}
                />
                <HeaderTool icon={ZoomIn} title={t('ज़ूम इन', 'Zoom In')} onClick={zoomIn} />
                <HeaderTool icon={ZoomOut} title={t('ज़ूम आउट', 'Zoom Out')} onClick={zoomOut} />
                <HeaderTool
                  icon={isFullscreen ? Minimize2 : Maximize2}
                  active={isFullscreen}
                  title={t('फुलस्क्रीन', 'Fullscreen')}
                  onClick={toggleFullscreen}
                />
                <HeaderTool
                  icon={Keyboard}
                  title={t('शॉर्टकट', 'Shortcuts')}
                  onClick={() => setShowShortcuts(p => !p)}
                />
              </div>

              {/* Mobile Tools */}
              <div className="relative lg:hidden">
                <button
                  onClick={() => setShowMobileTools(p => !p)}
                  className="p-2 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/[0.06]"
                >
                  <Settings className="w-[18px] h-[18px]" />
                </button>
                {showMobileTools && (
                  <MobileToolsDropdown
                    onClose={() => setShowMobileTools(false)}
                    items={mobileToolItems}
                  />
                )}
              </div>

              {/* Separator */}
              <div className="hidden lg:block w-px h-6 bg-white/[0.08] mx-1" />

              {/* Desktop Palette Toggle */}
              <HeaderTool
                icon={showPalette ? PanelRightClose : PanelRightOpen}
                active={showPalette}
                title={showPalette ? t('पैलेट छुपाएं', 'Hide Palette') : t('पैलेट दिखाएं', 'Show Palette')}
                onClick={() => setShowPalette(p => !p)}
              />

              {/* Mobile Palette */}
              <button
                onClick={() => setMobilePalette(true)}
                className="lg:hidden p-2 rounded-lg text-white/35 hover:text-white/60 hover:bg-white/[0.06]"
              >
                <LayoutGrid className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Progress Strip ── */}
        <div className="h-7 bg-slate-800 dark:bg-[#080c16] border-t border-white/[0.04] flex items-center px-3 lg:px-5">
          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-3 max-w-lg">
            <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-white/25 tabular-nums flex-shrink-0">
              {currentIndex + 1}/{totalQuestions}
            </span>
          </div>

          {/* Stats chips */}
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400/60">
              <CheckCircle className="w-3 h-3" />
              {answeredCount}
            </span>
            {reviewCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-400/60">
                <Flag className="w-3 h-3" />
                {reviewCount}
              </span>
            )}
          </div>

          {/* Font size reset */}
          {fontSize !== 16 && (
            <button
              onClick={resetZoom}
              className="ml-3 inline-flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 font-mono"
            >
              {fontSize}px
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Mobile timer (compact) */}
          <div className="flex md:hidden items-center gap-1.5 ml-auto text-[11px] font-mono font-bold text-white/40">
            <Clock className="w-3 h-3 text-emerald-400/60" />
            <TestTimer
              initialSeconds={remainingTime || test.duration * 60}
              onTimeUp={handleTimeUp}
              onTick={handleTimerTick}
              autoStart
              language={language}
              compact
              minimal
            />
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
                     MAIN CONTENT AREA
         ══════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Question Area ── */}
        <main
          ref={questionAreaRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">

            {/* ── Question Card ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">

              {/* Question Meta Bar */}
              <div className="flex items-center justify-between px-5 sm:px-7 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Q Number */}
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white text-sm font-black flex items-center justify-center shadow-sm">
                      {currentIndex + 1}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mb-0.5">
                        {t('प्रश्न', 'Question')} {currentIndex + 1} / {totalQuestions}
                      </p>
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {t(qTypeLabel.hi, qTypeLabel.en) || 'MCQ'}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  {isReviewed && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-bold border border-violet-200/60 dark:border-violet-800/50">
                      <Flag className="w-3 h-3" />
                      {t('समीक्षा', 'Review')}
                    </span>
                  )}
                  {isAnswered && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/50">
                      <CheckCircle className="w-3 h-3" />
                      {t('हल', 'Done')}
                    </span>
                  )}
                </div>

                {/* Per-Q Timer */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <Clock className={`w-3.5 h-3.5 ${qElapsed > 120 ? 'text-red-500' : qElapsed > 60 ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className={`text-xs font-mono font-bold tabular-nums ${qElapsed > 120 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {formatQTime(qElapsed)}
                  </span>
                </div>
              </div>

              {/* Question Body */}
              <div
                className="p-5 sm:p-7 lg:p-9"
                style={{ fontSize: `${fontSize}px` }}
              >
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
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Loader size="lg" />
                    <p className="mt-4 text-sm">{t('लोड हो रहा है...', 'Loading...')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div className="mt-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

                {/* Left: Review + Clear */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMarkForReview}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-[0.97] ${
                      isReviewed
                        ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('समीक्षा', 'Review')}</span>
                  </button>

                  <button
                    onClick={clearResponse}
                    disabled={!isAnswered}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('हटाएं', 'Clear')}</span>
                  </button>
                </div>

                {/* Right: Nav + Save/Submit */}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={previousQuestion}
                    disabled={isFirstQuestion}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden xs:inline">{t('पिछला', 'Prev')}</span>
                  </button>

                  {!isLastQuestion ? (
                    <button
                      onClick={saveAndNext}
                      className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-sm transition-all duration-150 active:scale-[0.97]"
                    >
                      {t('सेव & अगला', 'Save & Next')}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      onClick={openSubmitModal}
                      className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold shadow-sm transition-all duration-150 active:scale-[0.97]"
                    >
                      <Send className="w-4 h-4" />
                      {t('जमा करें', 'Submit')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Keyboard Hints ── */}
            <div className="hidden md:flex items-center justify-center mt-4">
              <div className="inline-flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-600">
                {[
                  { keys: '← →', label: t('नेविगेट', 'Navigate') },
                  { keys: '1-4', label: t('विकल्प', 'Options') },
                  { keys: 'M', label: t('समीक्षा', 'Review') },
                  { keys: '?', label: t('शॉर्टकट', 'Keys') },
                ].map((h, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full" />}
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold">
                        {h.keys}
                      </kbd>
                      {h.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ── Desktop Palette Sidebar ── */}
        {showPalette && (
          <aside className="hidden lg:flex flex-col w-[300px] flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
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
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() => setMobilePalette(false)}
            />
            <aside className="fixed right-0 top-0 bottom-0 w-[300px] max-w-[85vw] z-[70] lg:hidden bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-500" />
                  {t('प्रश्न पैलेट', 'Question Palette')}
                </h3>
                <button
                  onClick={() => setMobilePalette(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TestPalette
                  answers={answers}
                  questions={questions}
                  currentIndex={currentIndex}
                  onQuestionClick={(i) => { goToQuestion(i); setMobilePalette(false); }}
                  onSubmit={() => { setMobilePalette(false); openSubmitModal(); }}
                  isSubmitting={isSubmitting}
                  language={language}
                />
              </div>
            </aside>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
                     FLOATING TOOLS
         ══════════════════════════════════════════════ */}
      {showCalc && (
        <ExamCalculator
          onClose={() => setShowCalc(false)}
          language={language}
        />
      )}
      {showNotepad && (
        <ExamNotepad
          onClose={() => setShowNotepad(false)}
          testId={test?._id}
          language={language}
        />
      )}

      {/* ══════════════════════════════════════════════
                        MODALS
         ══════════════════════════════════════════════ */}
      {showShortcuts && (
        <ShortcutsModal
          onClose={() => setShowShortcuts(false)}
          language={language}
        />
      )}

      <TestSubmitModal
        isOpen={showSubmitModal}
        onClose={closeSubmitModal}
        onSubmit={handleSubmitFn}
        summary={getStatusSummary()}
        remainingTime={remainingTime}
        isSubmitting={isSubmitting}
        language={language}
        error={submitError}
      />

      {/* ── Global Animations ── */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modalIn { animation: modalIn 0.2s ease-out; }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-dropIn { animation: dropIn 0.15s ease-out; }

        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideLeft { animation: slideLeft 0.25s ease-out; }

        /* Custom scrollbar */
        main::-webkit-scrollbar { width: 6px; }
        main::-webkit-scrollbar-track { background: transparent; }
        main::-webkit-scrollbar-thumb { 
          background: rgba(0,0,0,0.1); 
          border-radius: 999px; 
        }
        .dark main::-webkit-scrollbar-thumb { 
          background: rgba(255,255,255,0.06); 
        }
        main::-webkit-scrollbar-thumb:hover { 
          background: rgba(0,0,0,0.2); 
        }
        .dark main::-webkit-scrollbar-thumb:hover { 
          background: rgba(255,255,255,0.12); 
        }
      `}</style>
    </div>
  );
};

export default TestInterface;