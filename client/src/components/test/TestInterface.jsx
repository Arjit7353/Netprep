import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Send,
  Menu,
  X,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { useTestContext } from '../../context/TestContext';
import TestTimer from './TestTimer';
import TestPalette from './TestPalette';
import TestSubmitModal from './TestSubmitModal';
import QuestionDisplay from './QuestionDisplay';
import Loader from '../common/Loader';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';

/**
 * TestInterface - Main NTA Pattern Test UI
 */
const TestInterface = () => {
  const navigate = useNavigate();
  const {
    test,
    attempt,
    questions,
    answers,
    currentIndex,
    currentQuestion,
    currentAnswer,
    remainingTime,
    language,
    status,
    isSubmitting,
    showSubmitModal,
    
    goToQuestion,
    selectAnswer,
    toggleMarkForReview,
    clearResponse,
    saveAndNext,
    previousQuestion,
    openSubmitModal,
    closeSubmitModal,
    submitTest,
    setLanguage,
    updateRemainingTime,
    getStatusSummary
  } = useTestContext();

  const [showPalette, setShowPalette] = useState(true);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Debug log
  useEffect(() => {
    console.log('TestInterface mounted/updated:', {
      testTitle: test?.title,
      attemptId: attempt?._id,
      questionsCount: questions?.length,
      answersCount: answers?.length,
      currentIndex,
      status
    });
  }, [test, attempt, questions, answers, currentIndex, status]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if modal is open, submitting, or in input field
      if (showSubmitModal || isSubmitting) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          previousQuestion();
          break;
        case 'ArrowRight':
          e.preventDefault();
          saveAndNext();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          e.preventDefault();
          const optionIndex = parseInt(e.key) - 1;
          selectAnswer(optionIndex);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMarkForReview();
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          clearResponse();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSubmitModal, isSubmitting, previousQuestion, saveAndNext, selectAnswer, toggleMarkForReview, clearResponse]);

  // Handle time up - auto submit
  const handleTimeUp = useCallback(() => {
    console.log('Time up! Auto-submitting...');
    openSubmitModal();
    // Auto submit after showing modal briefly
    setTimeout(() => {
      handleSubmit();
    }, 2000);
  }, [openSubmitModal]);

  // Handle timer tick
  const handleTimerTick = useCallback((seconds) => {
    updateRemainingTime(seconds);
  }, [updateRemainingTime]);

  // Handle submit - MAIN FUNCTION
  const handleSubmit = async () => {
    setSubmitError(null);
    
    console.log('=== SUBMIT PROCESS STARTED ===');
    console.log('Attempt ID:', attempt?._id);
    
    if (!attempt?._id) {
      setSubmitError('No attempt found. Please refresh and try again.');
      console.error('No attempt ID available');
      return;
    }

    try {
      const result = await submitTest();
      
      console.log('Submit result:', result);
      
      if (result && result.success) {
        const attemptId = result.attemptId || attempt._id;
        console.log('SUCCESS! Navigating to results:', attemptId);
        
        // Clear any cached test data
        sessionStorage.removeItem('currentTest');
        
        // Navigate to result page
        navigate(`/results/${attemptId}`, { 
          replace: true,
          state: { 
            fromTest: true,
            justSubmitted: true 
          }
        });
      } else {
        const errorMsg = result?.error || 'Failed to submit test';
        console.error('Submit failed:', errorMsg);
        setSubmitError(errorMsg);
      }
    } catch (error) {
      console.error('Submit exception:', error);
      setSubmitError(error.message || 'An error occurred while submitting');
    }
  };

  // Get type config
  const typeConfig = test?.testType ? (TEST_TYPE_CONFIG[test.testType] || {}) : {};
  const paperLabel = test?.paper ? (PAPER_LABELS[test.paper] || {}) : {};

  // Show loader while test data is being set up
  if (status === 'loading' || !test || !questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader 
          size="lg" 
          text={language === 'hi' ? 'परीक्षा लोड हो रही है...' : 'Loading test...'} 
        />
      </div>
    );
  }

  // Show error if status is error
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'hi' ? 'त्रुटि' : 'Error'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'hi' ? 'कुछ गलत हो गया' : 'Something went wrong'}
          </p>
          <button
            onClick={() => navigate('/tests')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left - Test Info */}
          <div className="flex items-center gap-3">
            {typeConfig.shortCode && (
              <span className="hidden sm:inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                {typeConfig.shortCode}
              </span>
            )}
            <div>
              <h1 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
                {test.title}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {language === 'hi' ? paperLabel.hi : paperLabel.en}
              </p>
            </div>
          </div>

          {/* Center - Timer */}
          <TestTimer
            initialSeconds={remainingTime || test.duration * 60}
            onTimeUp={handleTimeUp}
            onTick={handleTimerTick}
            autoStart={true}
            language={language}
          />

          {/* Right - Language & Palette Toggle */}
          <div className="flex items-center gap-2">
            {/* Language Toggle - Desktop */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'hi' 
                    ? 'bg-white text-primary-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === 'en' 
                    ? 'bg-white text-primary-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Mobile Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="sm:hidden p-2 hover:bg-gray-100 rounded-lg"
              title="Toggle Language"
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>

            {/* Mobile Palette Toggle */}
            <button
              onClick={() => setIsMobilePaletteOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Desktop Palette Toggle */}
            <button
              onClick={() => setShowPalette(!showPalette)}
              className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg"
              title={showPalette ? 'Hide Palette' : 'Show Palette'}
            >
              {showPalette ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Question Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Question Area */}
        <main className={`flex-1 transition-all duration-300 ${showPalette ? 'lg:mr-80' : ''}`}>
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <span className="text-sm text-gray-500">
                  {language === 'hi' ? 'प्रश्न' : 'Question'} {currentIndex + 1} / {questions.length}
                </span>
                {currentAnswer?.markedForReview && (
                  <span className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                    <Flag className="w-4 h-4" />
                    {language === 'hi' ? 'समीक्षा के लिए चिह्नित' : 'Marked for Review'}
                  </span>
                )}
              </div>

              {/* Question Display */}
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
                <div className="text-center py-8 text-gray-500">
                  <Loader size="md" />
                  <p className="mt-4">
                    {language === 'hi' ? 'प्रश्न लोड हो रहा है...' : 'Loading question...'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMarkForReview}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    currentAnswer?.markedForReview
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'hi' ? 'समीक्षा के लिए चिह्नित' : 'Mark for Review'}
                  </span>
                </button>

                <button
                  onClick={clearResponse}
                  disabled={currentAnswer?.selectedAnswer === -1}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'hi' ? 'उत्तर हटाएं' : 'Clear'}
                  </span>
                </button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={previousQuestion}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'hi' ? 'पिछला' : 'Previous'}
                  </span>
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={saveAndNext}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
                  >
                    <span>
                      {language === 'hi' ? 'सेव करें और अगला' : 'Save & Next'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={openSubmitModal}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {language === 'hi' ? 'जमा करें' : 'Submit'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Keyboard Shortcuts Hint - Desktop Only */}
            <div className="mt-6 text-center text-xs text-gray-400 hidden lg:block">
              {language === 'hi' 
                ? 'कीबोर्ड: ← पिछला | → अगला | 1-4 विकल्प | M समीक्षा | C हटाएं'
                : 'Keyboard: ← Previous | → Next | 1-4 Options | M Review | C Clear'
              }
            </div>
          </div>
        </main>

        {/* Desktop Question Palette */}
        {showPalette && (
          <aside className="hidden lg:block fixed right-0 top-[73px] bottom-0 w-80 bg-gray-50 border-l overflow-y-auto">
            <div className="p-4">
              <TestPalette
                answers={answers}
                currentIndex={currentIndex}
                onQuestionClick={goToQuestion}
                language={language}
              />

              {/* Submit Button in Palette */}
              <button
                onClick={openSubmitModal}
                disabled={isSubmitting}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Send className="w-5 h-5" />
                {language === 'hi' ? 'परीक्षा जमा करें' : 'Submit Test'}
              </button>
            </div>
          </aside>
        )}

        {/* Mobile Question Palette (Drawer) */}
        {isMobilePaletteOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobilePaletteOpen(false)}
            />
            <aside className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden overflow-y-auto shadow-xl animate-slide-left">
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
                </h3>
                <button
                  onClick={() => setIsMobilePaletteOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <TestPalette
                  answers={answers}
                  currentIndex={currentIndex}
                  onQuestionClick={(index) => {
                    goToQuestion(index);
                    setIsMobilePaletteOpen(false);
                  }}
                  language={language}
                />

                {/* Submit Button */}
                <button
                  onClick={() => {
                    setIsMobilePaletteOpen(false);
                    openSubmitModal();
                  }}
                  disabled={isSubmitting}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Send className="w-5 h-5" />
                  {language === 'hi' ? 'परीक्षा जमा करें' : 'Submit Test'}
                </button>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Submit Modal */}
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