import React from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Layers, CheckCircle, Circle } from 'lucide-react';
import { getBilingualText, getBilingualArray, getOptionLabel } from '../../../utils/helpers';
import { CHART_COLORS } from '../../../utils/constants';

const DIMixedChart = ({
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
  const xAxisLabel = getBilingualText(data?.chartData?.xAxisLabel, language);
  const yAxisLabel = getBilingualText(data?.chartData?.yAxisLabel, language);
  
  const questionText = getBilingualText(question.question, language);
  const options = getBilingualArray(question.options, language);
  const explanation = getBilingualText(question.explanation, language);

  // Prepare chart data
  const chartData = labels.map((label, index) => {
    const dataPoint = { name: label };
    datasets.forEach((dataset, dsIndex) => {
      const dsLabel = getBilingualText(dataset.label, language) || `Series ${dsIndex + 1}`;
      dataPoint[dsLabel] = dataset.data[index] || 0;
    });
    return dataPoint;
  });

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

  // Render chart element based on type
  const renderChartElement = (dataset, index) => {
    const dsLabel = getBilingualText(dataset.label, language) || `Series ${index + 1}`;
    const color = dataset.color || CHART_COLORS[index % CHART_COLORS.length];
    const type = dataset.type || 'bar';

    switch (type) {
      case 'line':
        return (
          <Line 
            key={index}
            type="monotone"
            dataKey={dsLabel}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        );
      case 'area':
        return (
          <Area 
            key={index}
            type="monotone"
            dataKey={dsLabel}
            fill={color}
            fillOpacity={0.3}
            stroke={color}
          />
        );
      case 'bar':
      default:
        return (
          <Bar 
            key={index}
            dataKey={dsLabel}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* DI Data Display */}
      {showDIData && data && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Title & Instruction */}
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-primary-600" />
            <h4 className="font-medium text-gray-800">{title}</h4>
          </div>
          
          {instruction && (
            <p className="text-sm text-gray-600 mb-4">{instruction}</p>
          )}

          {/* Mixed Chart */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 0 } : undefined}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {datasets.map((dataset, index) => renderChartElement(dataset, index))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend for chart types */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
            {datasets.map((dataset, index) => {
              const dsLabel = getBilingualText(dataset.label, language) || `Series ${index + 1}`;
              const typeLabel = dataset.type === 'line' ? 'Line' : dataset.type === 'area' ? 'Area' : 'Bar';
              return (
                <span key={index} className="flex items-center gap-1">
                  <span 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: dataset.color || CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  {dsLabel} ({typeLabel})
                </span>
              );
            })}
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

export default DIMixedChart;