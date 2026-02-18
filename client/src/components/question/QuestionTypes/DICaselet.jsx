import React from 'react';
import { FileText, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import {
  getBilingualText,
  getBilingualArray,
  getOptionLabel
} from '../../../utils/helpers';

const DICaselet = ({
  question,
  diData,
  language = 'hi',
  showAnswer = false,
  selectedAnswer = null,
  onAnswerSelect,
  isPreview = false,
  disabled = false,
  showDIData = true
}) => {
  const data = diData || question?.diDataId || null;

  const title       = getBilingualText(data?.title, language);
  const instruction = getBilingualText(data?.instruction, language);
  // ✅ FIXED: caseletText is bilingual object
  const caseletText = getBilingualText(data?.caseletText, language);

  const questionText = getBilingualText(question?.question, language);
  const options      = getBilingualArray(question?.options, language);
  const explanation  = getBilingualText(question?.explanation, language);

  const handleSelect = (index) => {
    if (!disabled && !isPreview && onAnswerSelect) onAnswerSelect(index);
  };

  const getOptionStyle = (index) => {
    if (showAnswer) {
      if (index === question?.correctAnswer)
        return 'bg-green-50 border-green-500 text-green-800';
      if (selectedAnswer === index && index !== question?.correctAnswer)
        return 'bg-red-50 border-red-500 text-red-800';
    }
    if (selectedAnswer === index)
      return 'bg-primary-50 border-primary-500 text-primary-800';
    return 'bg-white border-gray-300 hover:border-gray-400';
  };

  return (
    <div className="space-y-4">
      {showDIData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <h4 className="font-semibold text-indigo-800">
              {title || (language === 'hi' ? 'केसलेट' : 'Caselet')}
            </h4>
          </div>

          {instruction && (
            <p className="text-sm text-indigo-700 mb-3 italic">{instruction}</p>
          )}

          {caseletText ? (
            <>
              <div className="bg-white rounded-lg p-4 border border-indigo-200 leading-relaxed text-gray-800 text-sm">
                {caseletText.split('\n').map((para, i) =>
                  para.trim() ? (
                    <p key={i} className="mb-2 last:mb-0">{para}</p>
                  ) : (
                    <br key={i} />
                  )
                )}
              </div>
              <div className="mt-3 p-2.5 bg-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-700 font-medium">
                  {language === 'hi'
                    ? 'ध्यान दें: उपरोक्त डेटा का ध्यानपूर्वक विश्लेषण करें।'
                    : 'Note: Carefully analyze the data given above.'}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8 text-indigo-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">
                {language === 'hi' ? 'डेटा उपलब्ध नहीं' : 'Data not available'}
              </span>
            </div>
          )}
        </div>
      )}

      {question?.diOrder && (
        <div className="text-xs font-medium text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full inline-block">
          {language === 'hi'
            ? `प्रश्न ${question.diOrder} (डेटा व्याख्या - केसलेट)`
            : `Question ${question.diOrder} (Data Interpretation - Caselet)`}
        </div>
      )}

      {questionText && (
        <div className="text-gray-800 font-medium leading-relaxed">{questionText}</div>
      )}

      {options.length > 0 && (
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
                {showAnswer && index === question?.correctAnswer ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : selectedAnswer === index ? (
                  <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 text-sm">
                <span className="font-semibold mr-1">({getOptionLabel(index)})</span>
                {option}
              </div>
            </button>
          ))}
        </div>
      )}

      {showAnswer && explanation && (
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-800 mb-1">
            {language === 'hi' ? 'व्याख्या:' : 'Explanation:'}
          </p>
          <p className="text-sm text-blue-700">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default DICaselet;