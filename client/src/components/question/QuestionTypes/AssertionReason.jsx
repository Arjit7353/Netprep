import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
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
  
  // Get options - use default A-R options if not provided
  let options = getBilingualArray(question.options, language);
  if (!options || options.length === 0) {
    options = language === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN;
  }

  const handleSelect = (index) => {
    if (!disabled && onAnswerSelect) {
      onAnswerSelect(index);
    }
  };

  const getOptionStyle = (index) => {
    if (showAnswer) {
      if (index === question.correctAnswer) {
        return 'bg-green-50 border-green-500 text-green-800';
      }
      if (selectedAnswer === index && index !== question.correctAnswer) {
        return 'bg-red-50 border-red-500 text-red-800';
      }
    }
    if (selectedAnswer === index) {
      return 'bg-primary-50 border-primary-500 text-primary-800';
    }
    return 'bg-white border-gray-300 hover:border-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Instruction */}
      {questionText && (
        <div className="text-gray-700 font-medium">
          {questionText}
        </div>
      )}

      {/* Assertion-Reason Box */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        {/* Assertion */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-20 text-sm font-bold text-primary-700">
              {language === 'hi' ? 'अभिकथन (A):' : 'Assertion (A):'}
            </span>
            <p className="text-gray-800 flex-1">{assertion}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-20 text-sm font-bold text-primary-700">
              {language === 'hi' ? 'कारण (R):' : 'Reason (R):'}
            </span>
            <p className="text-gray-800 flex-1">{reason}</p>
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
            className={`
              w-full flex items-start gap-3 p-3 rounded-lg border-2 
              transition-all duration-200 text-left
              ${getOptionStyle(index)}
              ${!disabled && !isPreview ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {showAnswer && index === question.correctAnswer ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : selectedAnswer === index ? (
                <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>

            <div className="flex-1">
              <span className="font-medium mr-2">({getOptionLabel(index)})</span>
              <span className="text-sm">{option}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showAnswer && explanation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-1">
            {language === 'hi' ? 'व्याख्या:' : 'Explanation:'}
          </p>
          <p className="text-sm text-blue-700">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default AssertionReason;