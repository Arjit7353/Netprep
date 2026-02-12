import React from 'react';
import { CheckCircle, Circle, Check, X } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';

const StatementBased = ({
  question,
  language = 'hi',
  showAnswer = false,
  selectedAnswer = null,
  onAnswerSelect,
  isPreview = false,
  disabled = false
}) => {
  const questionText = getBilingualText(question.question, language);
  const statements = getBilingualArray(question.statementData?.statements, language);
  const correctStatements = question.statementData?.correctStatements || [];
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

  const isStatementCorrect = (index) => correctStatements.includes(index);

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <div className="text-gray-700 font-medium">
        {questionText || (language === 'hi' 
          ? 'निम्नलिखित कथनों पर विचार कीजिए:'
          : 'Consider the following statements:'
        )}
      </div>

      {/* Statements List */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="space-y-3">
          {statements.map((statement, index) => (
            <div 
              key={index} 
              className={`
                flex items-start gap-3 p-3 rounded-lg border
                ${showAnswer 
                  ? isStatementCorrect(index)
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-200'
                }
              `}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm">
                {index + 1}
              </span>
              <span className="text-gray-800 flex-1">{statement}</span>
              
              {showAnswer && (
                <span className="flex-shrink-0">
                  {isStatementCorrect(index) ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-red-600" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Correct Statements Info (when showing answer) */}
      {showAnswer && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-800">
            {language === 'hi' ? 'सही कथन:' : 'Correct Statements:'}{' '}
            {correctStatements.length > 0 
              ? correctStatements.map(i => i + 1).join(', ')
              : (language === 'hi' ? 'कोई नहीं' : 'None')
            }
          </p>
        </div>
      )}

      {/* Question for options */}
      <div className="text-sm text-gray-600">
        {language === 'hi' 
          ? 'उपरोक्त में से कौन सा/से कथन सही है/हैं?'
          : 'Which of the above statement(s) is/are correct?'
        }
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled || isPreview}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg border-2 
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

export default StatementBased;