import React from 'react';
import { CheckCircle, Circle, ArrowDown } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';

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

  // Convert numeric to roman
  const toRoman = (num) => {
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romanNumerals[num] || (num + 1).toString();
  };

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <div className="text-gray-700 font-medium">
        {questionText || (language === 'hi' 
          ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:'
          : 'Arrange the following in correct order:'
        )}
      </div>

      {/* Items List */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                {toRoman(index)}
              </span>
              <span className="text-gray-800 flex-1">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Correct Order (when showing answer) */}
      {showAnswer && correctOrder.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800 mb-2">
            {language === 'hi' ? 'सही क्रम:' : 'Correct Order:'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {correctOrder.map((itemIndex, i) => (
              <React.Fragment key={i}>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {toRoman(itemIndex)}
                </span>
                {i < correctOrder.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-green-600 rotate-[-90deg]" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Option instruction */}
      <div className="text-sm text-gray-600">
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

export default SequenceOrder;