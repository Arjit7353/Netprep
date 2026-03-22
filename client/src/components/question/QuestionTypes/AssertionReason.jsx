import React from 'react';
import { CheckCircle, Circle, XCircle } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';
import { AR_OPTIONS_HI, AR_OPTIONS_EN } from '../../../utils/constants';

const AssertionReason = ({
  question,
  language = 'hi',
  showAnswer = false,
  selectedAnswer = null,
  onAnswerSelect,
  isPreview = false,
  disabled = false
}) => {
  const questionText = getBilingualText(question.question, language);
  const assertion = getBilingualText(question.assertionReasonData?.assertion, language);
  const reason = getBilingualText(question.assertionReasonData?.reason, language);
  const explanation = getBilingualText(question.explanation, language);

  let options = getBilingualArray(question.options, language);
  if (!options || options.length === 0) {
    options = language === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN;
  }

  const handleSelect = (index) => {
    if (!disabled && onAnswerSelect) onAnswerSelect(index);
  };

  const getOptionStyle = (index) => {
    if (showAnswer) {
      if (index === question.correctAnswer) {
        return 'bg-green-50 dark:bg-green-900/25 border-green-500 dark:border-green-600 text-green-800 dark:text-green-200';
      }
      if (selectedAnswer === index && index !== question.correctAnswer) {
        return 'bg-red-50 dark:bg-red-900/25 border-red-500 dark:border-red-600 text-red-800 dark:text-red-200';
      }
      return 'bg-white dark:bg-secondary-800 border-gray-200 dark:border-secondary-600 text-gray-700 dark:text-secondary-300';
    }
    if (selectedAnswer === index) {
      return 'bg-primary-50 dark:bg-primary-900/25 border-primary-500 dark:border-primary-600 text-primary-800 dark:text-primary-200';
    }
    return 'bg-white dark:bg-secondary-800 border-gray-300 dark:border-secondary-600 text-gray-700 dark:text-secondary-300 hover:border-gray-400 dark:hover:border-secondary-500';
  };

  return (
    <div className="space-y-4">
      {/* Instruction */}
      {questionText && (
        <div className="text-gray-700 dark:text-secondary-200 font-medium">{questionText}</div>
      )}

      {/* Assertion-Reason Box */}
      <div className="bg-gray-50 dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-600 overflow-hidden">
        {/* Assertion */}
        <div className="p-4 border-b border-gray-200 dark:border-secondary-600">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-sm font-bold">A</span>
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 uppercase">
                {language === 'hi' ? 'अभिकथन (A)' : 'Assertion (A)'}
              </p>
              <p className="text-gray-800 dark:text-secondary-200">{assertion}</p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-700 text-white flex items-center justify-center text-sm font-bold">R</span>
            <div>
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-1 uppercase">
                {language === 'hi' ? 'कारण (R)' : 'Reason (R)'}
              </p>
              <p className="text-gray-800 dark:text-secondary-200">{reason}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled || isPreview}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${getOptionStyle(index)} ${!disabled && !isPreview ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {showAnswer && index === question.correctAnswer ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : showAnswer && selectedAnswer === index && index !== question.correctAnswer ? (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : selectedAnswer === index ? (
                <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-gray-400 dark:text-secondary-500" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-medium mr-2">({getOptionLabel(index)})</span>
              <span className="text-sm">{option}</span>
            </div>
            {showAnswer && index === question.correctAnswer && (
              <span className="flex-shrink-0 text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                {language === 'hi' ? 'सही' : 'Correct'}
              </span>
            )}
            {showAnswer && selectedAnswer === index && index !== question.correctAnswer && (
              <span className="flex-shrink-0 text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                {language === 'hi' ? 'आपका' : 'Yours'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showAnswer && explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            {language === 'hi' ? 'व्याख्य��:' : 'Explanation:'}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-200">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default AssertionReason;