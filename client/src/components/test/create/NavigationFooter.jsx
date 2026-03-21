import React from 'react';
import { ChevronLeft, ChevronRight, FileText, Clock, Award, Rocket } from 'lucide-react';
import Loader from '../../common/Loader';

const NavigationFooter = ({
  currentStep, totalSteps, onPrev, onNext, onSubmit,
  canProceed, language, loading,
  questionCount, duration, totalMarks
}) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const isLastContent = currentStep === totalSteps - 2;
  const isComplete = currentStep === totalSteps - 1;

  if (isComplete) return null;

  return (
    <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 py-4 px-6 -mx-4 rounded-t-2xl shadow-2xl z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button type="button" onClick={onPrev} disabled={currentStep === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            currentStep === 0 ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}>
          <ChevronLeft className="w-5 h-5" />
          {t('पिछला', 'Previous')}
        </button>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <strong className="text-gray-700 dark:text-gray-200">{questionCount}</strong> {t('प्रश्न', 'Q')}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <strong className="text-gray-700 dark:text-gray-200">{duration}</strong>m
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <strong className="text-gray-700 dark:text-gray-200">{totalMarks}</strong> {t('अंक', 'marks')}
          </span>
        </div>

        {!isLastContent ? (
          <button type="button" onClick={onNext} disabled={!canProceed}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              canProceed
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:shadow-primary-500/30'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}>
            {t('अगला', 'Next')}
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button type="submit" disabled={loading} onClick={onSubmit}
            className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black hover:shadow-2xl hover:shadow-green-500/30 transition-all disabled:opacity-50 text-lg">
            {loading ? (
              <><Loader className="w-5 h-5 animate-spin" />{t('बना रहा है...', 'Creating...')}</>
            ) : (
              <><Rocket className="w-5 h-5" />{t('परीक्षा बनाएं', 'Create Test')}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default NavigationFooter;