import React from 'react';
import { CheckCheck } from 'lucide-react';

const StepIndicator = ({ steps, currentStep, onStepClick, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  return (
    <div className="relative px-4">
      <div className="absolute top-6 left-16 right-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div
        className="absolute top-6 left-16 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary-500/30"
        style={{
          width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 4rem)`,
          maxWidth: 'calc(100% - 8rem)'
        }}
      />
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = index <= currentStep;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`flex flex-col items-center group transition-all duration-300 ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              aria-label={`${t('चरण', 'Step')} ${index + 1}: ${t(step.labelHi, step.label)}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className={`
                  relative w-12 h-12 rounded-2xl flex items-center justify-center
                  transition-all duration-500 transform
                  ${isActive
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 shadow-xl shadow-primary-500/40 dark:shadow-primary-500/50'
                    : isCompleted
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }
                  ${isClickable && !isActive ? 'group-hover:scale-105 group-hover:shadow-lg' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-primary-500 animate-ping opacity-20" />
                )}
                {isCompleted ? (
                  <CheckCheck className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {t(step.labelHi, step.label)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {t('चरण', 'Step')} {index + 1}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;