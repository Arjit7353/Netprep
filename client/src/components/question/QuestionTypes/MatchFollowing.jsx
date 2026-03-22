import React from 'react';
import { CheckCircle, Circle, XCircle } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel, getRomanNumeral } from '../../../utils/helpers';

const MatchFollowing = ({
  question,
  language = 'hi',
  showAnswer = false,
  selectedAnswer = null,
  onAnswerSelect,
  isPreview = false,
  disabled = false
}) => {
  const questionText = getBilingualText(question.question, language);
  const listA = getBilingualArray(question.matchData?.listA, language);
  const listB = getBilingualArray(question.matchData?.listB, language);
  const options = getBilingualArray(question.options, language);
  const explanation = getBilingualText(question.explanation, language);

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
      <div className="text-gray-700 dark:text-secondary-200 font-medium">
        {questionText || (language === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:')}
      </div>

      {/* Match Table */}
      <div className="overflow-x-auto rounded-xl border-2 border-gray-300 dark:border-secondary-600">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-secondary-700">
              <th className="border-b-2 border-r border-gray-300 dark:border-secondary-600 px-4 py-3 text-center font-bold text-gray-800 dark:text-secondary-100 w-1/2">
                {language === 'hi' ? 'सूची-I' : 'List-I'}
              </th>
              <th className="border-b-2 border-gray-300 dark:border-secondary-600 px-4 py-3 text-center font-bold text-gray-800 dark:text-secondary-100 w-1/2">
                {language === 'hi' ? 'सूची-II' : 'List-II'}
              </th>
            </tr>
          </thead>
          <tbody>
            {listA.map((itemA, index) => (
              <tr
                key={index}
                className={index % 2 === 0
                  ? 'bg-white dark:bg-secondary-800'
                  : 'bg-gray-50 dark:bg-secondary-750'}
              >
                <td className="border-b border-r border-gray-200 dark:border-secondary-600 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-primary-700 dark:text-primary-400 flex-shrink-0">
                      ({getOptionLabel(index)})
                    </span>
                    <span className="text-gray-800 dark:text-secondary-200">{itemA}</span>
                  </div>
                </td>
                <td className="border-b border-gray-200 dark:border-secondary-600 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-primary-700 dark:text-primary-400 flex-shrink-0">
                      {getRomanNumeral(index)}
                    </span>
                    <span className="text-gray-800 dark:text-secondary-200">{listB[index]}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Correct Match Info */}
      {showAnswer && question.matchData?.correctMatch && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {language === 'hi' ? 'सही मिलान:' : 'Correct Match:'}{' '}
            {question.matchData.correctMatch.map((matchIndex, i) => (
              <span key={i}>
                {getOptionLabel(i)}-{getRomanNumeral(matchIndex)}
                {i < question.matchData.correctMatch.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Option instruction */}
      <div className="text-sm text-gray-600 dark:text-secondary-400">
        {language === 'hi'
          ? 'नीचे दिए गए विकल्पों में से सही उत्तर चुनिए:'
          : 'Choose the correct answer from the options given below:'}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled || isPreview}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${getOptionStyle(index)} ${!disabled && !isPreview ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex-shrink-0">
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
              <span className="text-[10px] font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
                {language === 'hi' ? 'सही' : 'Correct'}
              </span>
            )}
            {showAnswer && selectedAnswer === index && index !== question.correctAnswer && (
              <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
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
            {language === 'hi' ? 'व्याख्या:' : 'Explanation:'}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-200">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default MatchFollowing;