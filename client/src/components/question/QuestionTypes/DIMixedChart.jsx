import React from 'react';
import {
  ComposedChart, Bar, Line, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Layers, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import {
  getBilingualText,
  getBilingualArray,
  getChartLabels,
  getDatasetLabel,
  getOptionLabel
} from '../../../utils/helpers';
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
  const data = diData || question?.diDataId || null;

  const title       = getBilingualText(data?.title, language);
  const instruction = getBilingualText(data?.instruction, language);
  // ✅ FIXED
  const labels      = getChartLabels(data?.chartData?.labels, language);
  const datasets    = data?.chartData?.datasets || [];
  const xAxisLabel  = getBilingualText(data?.chartData?.xAxisLabel, language);
  const yAxisLabel  = getBilingualText(data?.chartData?.yAxisLabel, language);

  const questionText = getBilingualText(question?.question, language);
  const options      = getBilingualArray(question?.options, language);
  const explanation  = getBilingualText(question?.explanation, language);

  const chartData = labels.map((label, index) => {
    const point = { name: label };
    datasets.forEach((ds, dsIndex) => {
      const dsLabel = getDatasetLabel(ds.label, language, `Series ${dsIndex + 1}`);
      point[dsLabel] = Array.isArray(ds.data) ? (ds.data[index] ?? 0) : 0;
    });
    return point;
  });

  const hasChartData = labels.length > 0 && datasets.length > 0;

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

  const renderElement = (ds, index) => {
    const dsLabel = getDatasetLabel(ds.label, language, `Series ${index + 1}`);
    const color = ds.color || CHART_COLORS[index % CHART_COLORS.length];
    switch (ds.type) {
      case 'line':
        return (
          <Line
            key={index} type="monotone" dataKey={dsLabel}
            stroke={color} strokeWidth={2.5}
            dot={{ r: 4 }} activeDot={{ r: 6 }}
          />
        );
      case 'area':
        return (
          <Area
            key={index} type="monotone" dataKey={dsLabel}
            fill={color} fillOpacity={0.3} stroke={color}
          />
        );
      default:
        return (
          <Bar key={index} dataKey={dsLabel} fill={color} radius={[4, 4, 0, 0]} />
        );
    }
  };

  return (
    <div className="space-y-4">
      {showDIData && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <h4 className="font-semibold text-gray-800">
              {title || (language === 'hi' ? 'मिश्रित चार्ट' : 'Mixed Chart')}
            </h4>
          </div>

          {instruction && (
            <p className="text-sm text-gray-600 mb-4 italic">{instruction}</p>
          )}

          {hasChartData ? (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name" tick={{ fontSize: 12 }}
                    label={
                      xAxisLabel
                        ? { value: xAxisLabel, position: 'insideBottom', offset: -15, fontSize: 12 }
                        : undefined
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={
                      yAxisLabel
                        ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 12 }
                        : undefined
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {datasets.map((ds, index) => renderElement(ds, index))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">
                {language === 'hi' ? 'चार्ट डेटा उपलब्ध नहीं' : 'Chart data not available'}
              </span>
            </div>
          )}
        </div>
      )}

      {question?.diOrder && (
        <div className="text-xs font-medium text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full inline-block">
          {language === 'hi'
            ? `प्रश्न ${question.diOrder} (डेटा व्याख्या)`
            : `Question ${question.diOrder} (Data Interpretation)`}
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

export default DIMixedChart;