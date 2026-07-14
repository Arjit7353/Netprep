import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, X, Loader as LoaderIcon,
  Globe, AlertTriangle, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Keyboard, Wifi, WifiOff,
  Check, Send, RotateCcw, AlertCircle, BookOpen
} from 'lucide-react';
import { useTestContext } from '../../context/TestContext';
import QuestionDisplay from './QuestionDisplay';
import TestSubmitModal from './TestSubmitModal';
import ReportIssueModal from './ReportIssueModal';
import TestPalette from './TestPalette';
import { TEST_TYPE_CONFIG, PAPER_LABELS, QUESTION_TYPE_LABELS } from '../../utils/constants';
import Loader from '../common/Loader';

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
    goToQuestion, selectAnswer, clearResponse,
    saveAndNext, previousQuestion, openSubmitModal, closeSubmitModal,
    submitTest, setLanguage, updateRemainingTime, getStatusSummary,
  } = useTestContext();

  // ── Local State ──
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submitError, setSubmitError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false); // For mobile toggle

  const questionAreaRef = useRef(null);

  const t = useCallback((hi, en) => language === 'hi' ? hi : en, [language]);

  // ── Reset checking state on question change ──
  useEffect(() => {
    setHasCheckedAnswer(false);
    questionAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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

  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0
    ? Math.round(((currentIndex + 1) / totalQuestions) * 100)
    : 0;

  const isAnswered = currentAnswer?.selectedAnswer !== undefined && currentAnswer?.selectedAnswer !== -1;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // ── Loading State ──
  if (status === 'loading' || !test || !questions?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
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
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {!isOnline && <OfflineBanner language={language} />}

      {/* ══════════════════════════════════════════════
                        MINIMAL HEADER
         ══════════════════════════════════════════════ */}
      <header className="flex-shrink-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => openSubmitModal()}
              title={t('बाहर निकलें', 'Exit')}
              className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Mobile Palette Toggle */}
            <button
              onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Question Palette"
            >
              <BookOpen className="w-5 h-5" />
            </button>

            <div className="flex-1 max-w-sm hidden sm:block">
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500 tabular-nums">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReportModal(true)}
              title={t('रिपोर्ट', 'Report Issue')}
              className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>

            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {language === 'hi' ? 'ENG' : 'हिंदी'}
            </button>
          </div>
        </div>
        <div className="sm:hidden h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ══════════════════════════════════════════════
                     MAIN TWO-COLUMN LAYOUT
         ══════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column (Question + Bottom Bar) */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto">
            <main
              ref={questionAreaRef}
              className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
            >
              {currentQuestion ? (
                <QuestionDisplay
                  question={currentQuestion}
                  language={language}
                  selectedAnswer={currentAnswer?.selectedAnswer ?? -1}
                  onAnswerSelect={selectAnswer}
                  showQuestionNumber={true}
                  questionNumber={currentIndex + 1}
                  showFeedback={hasCheckedAnswer}
                  correctAnswer={currentQuestion.correctAnswer}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <LoaderIcon className="w-8 h-8 animate-spin" />
                  <p className="mt-4 text-sm">{t('लोड हो रहा है...', 'Loading...')}</p>
                </div>
              )}
            </main>
          </div>

          {/* DYNAMIC BOTTOM BAR */}
          <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  if (!hasCheckedAnswer) clearResponse();
                  saveAndNext();
                }}
                disabled={hasCheckedAnswer}
                className="px-6 py-3.5 rounded-2xl text-[15px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
              >
                {t('छोड़ें', 'Skip')}
              </button>

              {!hasCheckedAnswer ? (
                <button
                  onClick={() => setHasCheckedAnswer(true)}
                  disabled={!isAnswered}
                  className="flex-1 max-w-sm flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white text-[15px] font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-95"
                >
                  {t('चेक करें', 'Check')}
                </button>
              ) : (
                <button
                  onClick={isLastQuestion ? openSubmitModal : saveAndNext}
                  className="flex-1 max-w-sm flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95"
                >
                  {isLastQuestion ? t('पूरा करें', 'Finish') : t('जारी रखें', 'Continue')}
                  {isLastQuestion ? <Send className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Question Palette) */}
        {/* Mobile Backdrop */}
        {isPaletteOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsPaletteOpen(false)}
          />
        )}
        
        {/* Palette Container */}
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-50 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isPaletteOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="lg:hidden p-4 flex justify-end border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
            <button
              onClick={() => setIsPaletteOpen(false)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <TestPalette 
              language={language}
              answers={answers}
              questions={questions}
              currentIndex={currentIndex}
              onQuestionClick={goToQuestion}
              onSubmit={openSubmitModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════════
                        MODALS
         ══════════════════════════════════════════════ */}
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

      <ReportIssueModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        questionId={currentQuestion?._id || ''}
        questionSource={String(currentQuestion?._id || '').startsWith('pyq_') ? 'pyq' : 'bank'}
        testId={test?._id}
        attemptId={attempt?._id}
        questionIndex={currentIndex}
        language={language}
      />

      <style>{`
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