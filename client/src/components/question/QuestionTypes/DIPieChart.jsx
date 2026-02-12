import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { PieChart as PieChartIcon, CheckCircle, Circle } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';
import { CHART_COLORS } from '../../../utils/constants';

const DIPieChart = ({
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
  const data = diData || question.diDataId;
  
  const title = getBilingualText(data?.title, language);
  const instruction = getBilingualText(data?.instruction, language);
  const labels = getBilingualArray(data?.chartData?.labels, language);
  const datasets = data?.chartData?.datasets || [];
  const colors = data?.chartData?.colors || CHART_COLORS;
  
  const questionText = getBilingualText(question.question, language);
  const options = getBilingualArray(question.options, language);
  const explanation = getBilingualText(question.explanation, language);

  // Prepare chart data
  const chartData = labels.map((label, index) => ({
    name: label,
    value: datasets[0]?.data?.[index] || 0
  }));

  // Custom label for pie chart
  const renderCustomLabel = ({ name, percent }) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

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
      {/* DI Data Display */}
      {showDIData && data && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Title & Instruction */}
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="w-5 h-5 text-primary-600" />
            <h4 className="font-medium text-gray-800">{title}</h4>
          </div>
          
          {instruction && (
            <p className="text-sm text-gray-600 mb-4">{instruction}</p>
          )}

          {/* Pie Chart */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length] || CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Data Summary */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {chartData.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] || CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-xs text-gray-700 truncate">{item.name}</span>
                <span className="text-xs font-medium text-gray-900 ml-auto">{item.value}%</span>
              </div>
            ))}
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

export default DIPieChart;