import React from 'react';
import { Table, CheckCircle, Circle } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';

const DITableChart = ({
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
  // Get DI data from question's diDataId or passed diData prop
  const data = diData || question.diDataId;
  
  const title = getBilingualText(data?.title, language);
  const instruction = getBilingualText(data?.instruction, language);
  const headers = getBilingualArray(data?.tableData?.headers, language);
  const rows = data?.tableData?.rows || [];
  const footers = getBilingualArray(data?.tableData?.footers, language);
  
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

  // Format cell value
  const formatCellValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="space-y-4">
      {/* DI Data Display */}
      {showDIData && data && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Title & Instruction */}
          <div className="flex items-center gap-2 mb-3">
            <Table className="w-5 h-5 text-primary-600" />
            <h4 className="font-medium text-gray-800">{title}</h4>
          </div>
          
          {instruction && (
            <p className="text-sm text-gray-600 mb-4">{instruction}</p>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-400 bg-white text-sm">
              {/* Headers */}
              <thead>
                <tr className="bg-primary-50">
                  {headers.map((header, index) => (
                    <th 
                      key={index}
                      className="border-2 border-gray-400 px-3 py-2 text-center font-bold text-gray-800"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Body */}
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className={`
                          border-2 border-gray-400 px-3 py-2
                          ${cellIndex === 0 ? 'text-left font-medium' : 'text-center'}
                        `}
                      >
                        {formatCellValue(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* Footers */}
              {footers && footers.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-medium">
                    {footers.map((footer, index) => (
                      <td 
                        key={index}
                        className="border-2 border-gray-400 px-3 py-2 text-center"
                      >
                        {footer}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Question Number in Set */}
      {question.diOrder && (
        <div className="text-sm text-gray-500">
          {language === 'hi' 
            ? `प्रश्न ${question.diOrder} (डेटा व्याख्या)`
            : `Question ${question.diOrder} (Data Interpretation)`
          }
        </div>
      )}

      {/* Question Text */}
      <div className="text-gray-800 font-medium leading-relaxed">
        {questionText}
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

export default DITableChart;