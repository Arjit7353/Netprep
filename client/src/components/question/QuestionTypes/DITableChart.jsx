import React from 'react';
import { Table, CheckCircle, Circle, AlertCircle } from 'lucide-react';
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
  // ✅ FIX: Get DI data from question's diDataId or passed diData prop
  const data = diData || question?.diDataId || null;
  
  // Extract data safely
  const title = data ? getBilingualText(data.title, language) : '';
  const instruction = data ? getBilingualText(data.instruction, language) : '';
  const headers = data?.tableData?.headers 
    ? getBilingualArray(data.tableData.headers, language) 
    : [];
  const rows = data?.tableData?.rows || [];
  const footers = data?.tableData?.footers 
    ? getBilingualArray(data.tableData.footers, language) 
    : [];
  
  const questionText = getBilingualText(question?.question, language);
  const options = getBilingualArray(question?.options, language);
  const explanation = getBilingualText(question?.explanation, language);

  const handleSelect = (index) => {
    if (!disabled && onAnswerSelect) {
      onAnswerSelect(index);
    }
  };

  const getOptionStyle = (index) => {
    if (showAnswer) {
      if (index === question?.correctAnswer) {
        return 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      }
      if (selectedAnswer === index && index !== question?.correctAnswer) {
        return 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      }
    }
    if (selectedAnswer === index) {
      return 'bg-primary-50 border-primary-500 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
    }
    return 'bg-white dark:bg-secondary-800 border-gray-300 dark:border-secondary-600 hover:border-gray-400';
  };

  // Format cell value
  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <div className="space-y-4">
      {/* ✅ DI Data Display with proper null check */}
      {showDIData && data && (
        <div className="bg-gray-50 dark:bg-secondary-900/50 border border-gray-200 dark:border-secondary-700 rounded-lg p-4">
          {/* Title & Instruction */}
          {(title || instruction) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Table className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h4 className="font-medium text-gray-800 dark:text-secondary-200">
                  {title || (language === 'hi' ? 'तालिका डेटा' : 'Table Data')}
                </h4>
              </div>
              
              {instruction && (
                <p className="text-sm text-gray-600 dark:text-secondary-400 mb-3">
                  {instruction}
                </p>
              )}
            </div>
          )}

          {/* Table */}
          {headers.length > 0 || rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-400 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-sm">
                {/* Headers */}
                {headers.length > 0 && (
                  <thead>
                    <tr className="bg-primary-50 dark:bg-primary-900/30">
                      {headers.map((header, index) => (
                        <th 
                          key={index}
                          className="border-2 border-gray-400 dark:border-secondary-600 px-3 py-2 text-center font-bold text-gray-800 dark:text-secondary-200"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                
                {/* Body */}
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? 'bg-white dark:bg-secondary-800' : 'bg-gray-50 dark:bg-secondary-700/50'}
                    >
                      {Array.isArray(row) && row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex}
                          className={`
                            border-2 border-gray-400 dark:border-secondary-600 px-3 py-2
                            ${cellIndex === 0 ? 'text-left font-medium' : 'text-center'}
                            text-gray-700 dark:text-secondary-300
                          `}
                        >
                          {formatCellValue(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>

                {/* Footers */}
                {footers.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 dark:bg-secondary-700 font-medium">
                      {footers.map((footer, index) => (
                        <td 
                          key={index}
                          className="border-2 border-gray-400 dark:border-secondary-600 px-3 py-2 text-center text-gray-700 dark:text-secondary-300"
                        >
                          {footer}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-gray-500 dark:text-secondary-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              {language === 'hi' ? 'तालिका डेटा उपलब्ध नहीं है' : 'Table data not available'}
            </div>
          )}
        </div>
      )}

      {/* Show message if no DI data */}
      {showDIData && !data && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              {language === 'hi' 
                ? 'DI डेटा लोड नहीं हुआ। कृपया प्रश्न को expand करें।' 
                : 'DI data not loaded. Please expand the question.'}
            </span>
          </div>
        </div>
      )}

      {/* Question Number in Set */}
      {question?.diOrder && (
        <div className="text-sm text-gray-500 dark:text-secondary-400">
          {language === 'hi' 
            ? `प्रश्न ${question.diOrder} (डेटा व्याख्या)`
            : `Question ${question.diOrder} (Data Interpretation)`
          }
        </div>
      )}

      {/* Question Text */}
      {questionText && (
        <div className="text-gray-800 dark:text-secondary-200 font-medium leading-relaxed">
          {questionText}
        </div>
      )}

      {/* Options */}
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

              <div className="flex-1">
                <span className="font-medium mr-2">({getOptionLabel(index)})</span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      )}

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

export default DITableChart;