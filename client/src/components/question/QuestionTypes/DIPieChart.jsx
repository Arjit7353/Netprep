import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { PieChart as PieChartIcon, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import {
  getBilingualText,
  getBilingualArray,
  getChartLabels,
  getDatasetLabel,
  getPieColors,
  getOptionLabel
} from '../../../utils/helpers';
import { CHART_COLORS } from '../../../utils/constants';

// Custom label renderer
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null; // hide tiny slices
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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
  // ✅ FIXED: Safely resolve DI data
  const data = diData || question?.diDataId || null;

  const title       = getBilingualText(data?.title, language);
  const instruction = getBilingualText(data?.instruction, language);

  // ✅ FIXED: Use getChartLabels for bilingual arrays
  const labels   = getChartLabels(data?.chartData?.labels, language);
  const datasets = data?.chartData?.datasets || [];

  // ✅ FIXED: Extract colors from dataset.colors (not chartData.colors)
  const firstDataset = datasets[0] || null;
  const pieColors = getPieColors(firstDataset, CHART_COLORS);

  // Build recharts pie data
  const chartData = labels.map((label, index) => ({
    name: label,
    value: Array.isArray(firstDataset?.data) ? (firstDataset.data[index] ?? 0) : 0
  }));

  const hasChartData = chartData.length > 0 && chartData.some(d => d.value > 0);

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
      {/* DI Data Block */}
      {showDIData && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h4 className="font-semibold text-gray-800">
              {title || (language === 'hi' ? 'पाई चार्ट' : 'Pie Chart')}
            </h4>
          </div>

          {instruction && (
            <p className="text-sm text-gray-600 mb-4 italic">{instruction}</p>
          )}

          {hasChartData ? (
            <>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={110}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Summary Cards */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {chartData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 shadow-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-gray-900">{item.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
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

      {/* DI Order Label */}
      {question?.diOrder && (
        <div className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full inline-block">
          {language === 'hi'
            ? `प्रश्न ${question.diOrder} (डेटा व्याख्या)`
            : `Question ${question.diOrder} (Data Interpretation)`}
        </div>
      )}

      {/* Question Text */}
      {questionText && (
        <div className="text-gray-800 font-medium leading-relaxed">
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
              <div className="flex-1 text-sm">
                <span className="font-semibold mr-1">({getOptionLabel(index)})</span>
                {option}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Explanation */}
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

export default DIPieChart;