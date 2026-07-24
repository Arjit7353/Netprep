import React from 'react';
import { CheckCircle, Circle, ArrowDown } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel, getSequenceItemLabel } from '../../../utils/helpers';

const SequenceOrder = ({
  question,
  language = 'hi',
  showAnswer = false,
  selectedAnswer = null,
  onAnswerSelect,
  isPreview = false,
  disabled = false
}) => {
  const questionText = getBilingualText(question.question, language);
  const items = getBilingualArray(question.sequenceData?.items, language);
  const correctOrder = question.sequenceData?.correctOrder || [];
  const options = getBilingualArray(question.options, language);
  const explanation = getBilingualText(question.explanation, language);

  const handleSelect = (index) => {
    if (!disabled && onAnswerSelect) {
      onAnswerSelect(index);
    }
  };

  const getOptionStyle = (index) => {
    if (showAnswer) {
      if (index === question.correctAnswer) {
        return 'bg-green-50 dark:bg-green-900/25 border-green-500 dark:border-green-600 text-green-800 dark:text-green-200';
      }
      if (selectedAnswer === index && index !== question.correctAnswer) {
        return 'bg-red-50 dark:bg-red-900/25 border-red-500 dark:border-red-600 text-red-800 dark:text-red-200';
      }
    }
    if (selectedAnswer === index) {
      return 'bg-primary-50 dark:bg-primary-900/25 border-primary-500 dark:border-primary-600 text-primary-800 dark:text-primary-200';
    }
    return 'bg-white dark:bg-secondary-800 border-gray-300 dark:border-secondary-600 hover:border-gray-400 dark:hover:border-secondary-500';
  };

  const toRoman = (num) => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num] || (num + 1).toString();
  };

  const formatOption = (optStr) => {
    if (typeof optStr !== 'string') return optStr;
    // Replace standalone digits [1-9] with their corresponding Roman numeral
    return optStr.replace(/\b([1-9])\b/g, (match, p1) => {
      const numIndex = parseInt(p1, 10) - 1;
      return toRoman(numIndex);
    });
  };

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <div className="text-gray-700 dark:text-secondary-200 font-medium">
        {questionText || (language === 'hi' 
          ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:'
          : 'Arrange the following in correct order:'
        )}
      </div>

      {/* Items List */}
      <div className="bg-gray-50 dark:bg-secondary-900/50 rounded-lg border border-gray-200 dark:border-secondary-700 p-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 bg-white dark:bg-secondary-800 rounded-lg border border-gray-200 dark:border-secondary-600"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center text-sm">
                {getSequenceItemLabel(index, options)}
              </span>
              <span className="text-gray-800 dark:text-secondary-200 flex-1">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Correct Order (when showing answer) */}
      {showAnswer && correctOrder.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
            {language === 'hi' ? 'सही क्रम:' : 'Correct Order:'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {correctOrder.map((itemIndex, i) => (
              <React.Fragment key={i}>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                  {toRoman(itemIndex)}
                </span>
                {i < correctOrder.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-green-600 dark:text-green-400 rotate-[-90deg]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Option instruction */}
      <div className="text-sm text-gray-600 dark:text-secondary-400">
        {language === 'hi' 
          ? 'नीचे दिए गए विकल्पों में से सही क्रम चुनिए:'
          : 'Choose the correct sequence from the options given below:'
        }
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled || isPreview}
            className={`
              flex items-center gap-3 p-3 rounded-lg border-2 
              transition-all duration-200 text-left
              ${getOptionStyle(index)}
              ${!disabled && !isPreview ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <div className="flex-shrink-0">
              {showAnswer && index === question.correctAnswer ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
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
              <span className="text-sm tracking-wide font-medium">{formatOption(option)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showAnswer && explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            {language === 'hi' ? 'व्याख्या:' : 'Explanation:'}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-400">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default SequenceOrder;