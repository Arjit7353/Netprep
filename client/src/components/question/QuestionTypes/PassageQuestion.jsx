import React from 'react';
import { BookOpen, CheckCircle, Circle } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';

const PassageQuestion = ({
  question,
  passage,
  language = 'hi',
  showAnswer = false,
  selectedAnswer = null,
  onAnswerSelect,
  isPreview = false,
  disabled = false,
  showPassage = true
}) => {
  // Get passage content from question's passageId or passed passage prop
  const passageContent = passage 
    ? getBilingualText(passage.content, language)
    : getBilingualText(question.passageId?.content, language);
  
  const passageTitle = passage?.title || question.passageId?.title || '';
  
  const questionText = getBilingualText(question.question, language);
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

  return (
    <div className="space-y-4">
      {/* Passage Content */}
      {showPassage && passageContent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <h4 className="font-medium text-amber-800">
              {passageTitle || (language === 'hi' ? 'गद्यांश' : 'Passage')}
            </h4>
          </div>
          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
            {passageContent.split('\n').map((para, index) => (
              <p key={index} className="mb-2">{para}</p>
            ))}
          </div>
        </div>
      )}

      {/* Question Number in Set */}
      {question.passageOrder && (
        <div className="text-sm text-gray-500">
          {language === 'hi' 
            ? `प्रश्न ${question.passageOrder} (गद्यांश आधारित)`
            : `Question ${question.passageOrder} (Passage Based)`
          }
        </div>
      )}

      {/* Question Text */}
      <div className="text-gray-800 font-medium leading-relaxed">
        {questionText}
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
              <span>{option}</span>
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

export default PassageQuestion;