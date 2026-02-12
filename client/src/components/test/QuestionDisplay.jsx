import React from 'react';
import { getBilingualText, getBilingualArray, getOptionLabel, getRomanNumeral } from '../../utils/helpers';
import { QUESTION_TYPE_LABELS } from '../../utils/constants';

// Import chart components for DI
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CHART_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

/**
 * QuestionDisplay - Renders question based on type
 */
const QuestionDisplay = ({
  question,
  language = 'hi',
  selectedAnswer = -1,
  onAnswerSelect,
  disabled = false,
  showQuestionNumber = true,
  questionNumber = 1
}) => {
  const questionType = question.questionType;

  // Get question text
  const questionText = getBilingualText(question.question, language);

  // Render different question types
  const renderQuestionContent = () => {
    switch (questionType) {
      case 'assertion_reason':
        return renderAssertionReason();
      case 'match_following':
        return renderMatchFollowing();
      case 'sequence_order':
        return renderSequenceOrder();
      case 'statement_based':
        return renderStatementBased();
      case 'passage_based':
        return renderPassageBased();
      case 'di_table':
        return renderDITable();
      case 'di_bar_chart':
        return renderDIBarChart();
      case 'di_pie_chart':
        return renderDIPieChart();
      case 'di_line_graph':
        return renderDILineGraph();
      case 'di_caselet':
        return renderDICaselet();
      default:
        return renderMCQ();
    }
  };

  // Standard MCQ
  const renderMCQ = () => {
    const options = getBilingualArray(question.options, language);
    return (
      <div className="space-y-4">
        <div className="text-gray-800 text-lg leading-relaxed">
          {questionText}
        </div>
        {renderOptions(options)}
      </div>
    );
  };

  // Assertion-Reason
  const renderAssertionReason = () => {
    const assertion = getBilingualText(question.assertionReasonData?.assertion, language);
    const reason = getBilingualText(question.assertionReasonData?.reason, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {/* Instruction */}
        <div className="text-gray-700 font-medium">
          {language === 'hi' 
            ? 'निम्नलिखित दो कथनों को पढ़ें और सही विकल्प चुनें:'
            : 'Read the following two statements and choose the correct option:'
          }
        </div>

        {/* Assertion */}
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <p className="font-medium text-blue-800 mb-1">
            {language === 'hi' ? 'अभिकथन (A):' : 'Assertion (A):'}
          </p>
          <p className="text-blue-900">{assertion}</p>
        </div>

        {/* Reason */}
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <p className="font-medium text-green-800 mb-1">
            {language === 'hi' ? 'कारण (R):' : 'Reason (R):'}
          </p>
          <p className="text-green-900">{reason}</p>
        </div>

        {/* Options */}
        {renderOptions(options)}
      </div>
    );
  };

  // Match Following (TABLE FORMAT)
  const renderMatchFollowing = () => {
    const listA = getBilingualArray(question.matchData?.listA, language);
    const listB = getBilingualArray(question.matchData?.listB, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {/* Instruction */}
        <div className="text-gray-800 text-lg leading-relaxed">
          {questionText || (language === 'hi' 
            ? 'सूची-I को सूची-II से सुमेलित कीजिए और नीचे दिए गए कूट से सही उत्तर चुनिए:'
            : 'Match List-I with List-II and select the correct answer from the codes given below:'
          )}
        </div>

        {/* Match Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-300 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800 w-1/2">
                  {language === 'hi' ? 'सूची-I' : 'List-I'}
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800 w-1/2">
                  {language === 'hi' ? 'सूची-II' : 'List-II'}
                </th>
              </tr>
            </thead>
            <tbody>
              {listA.map((itemA, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className="font-medium text-gray-700">({getOptionLabel(index)})</span>
                    <span className="ml-2">{itemA}</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className="font-medium text-gray-700">{getRomanNumeral(index)}</span>
                    <span className="ml-2">{listB[index] || ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Code Label */}
        <div className="text-gray-700 font-medium">
          {language === 'hi' ? 'कूट:' : 'Codes:'}
        </div>

        {/* Options */}
        {renderOptions(options)}
      </div>
    );
  };

  // Sequence/Chronological Order
  const renderSequenceOrder = () => {
    const items = getBilingualArray(question.sequenceData?.items, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {/* Instruction */}
        <div className="text-gray-800 text-lg leading-relaxed">
          {questionText || (language === 'hi' 
            ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:'
            : 'Arrange the following in correct order:'
          )}
        </div>

        {/* Items List */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="font-medium text-gray-600 bg-white px-2 py-1 rounded">
                {index + 1}.
              </span>
              <span className="text-gray-800">{item}</span>
            </div>
          ))}
        </div>

        {/* Options */}
        {renderOptions(options)}
      </div>
    );
  };

  // Statement Based
  const renderStatementBased = () => {
    const statements = getBilingualArray(question.statementData?.statements, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {/* Instruction */}
        <div className="text-gray-800 text-lg leading-relaxed">
          {questionText || (language === 'hi' 
            ? 'निम्नलिखित कथनों पर विचार कीजिए:'
            : 'Consider the following statements:'
          )}
        </div>

        {/* Statements */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          {statements.map((statement, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="font-medium text-gray-600 bg-white px-2 py-1 rounded min-w-[28px] text-center">
                {index + 1}.
              </span>
              <span className="text-gray-800">{statement}</span>
            </div>
          ))}
        </div>

        {/* Question */}
        <div className="text-gray-700 font-medium">
          {language === 'hi' 
            ? 'उपर्युक्त में से कौन सा/से कथन सही है/हैं?'
            : 'Which of the above statement(s) is/are correct?'
          }
        </div>

        {/* Options */}
        {renderOptions(options)}
      </div>
    );
  };

  // Passage Based
  const renderPassageBased = () => {
    const passage = question.passageId;
    const passageContent = getBilingualText(passage?.content, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {/* Passage */}
        {passageContent && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-800 mb-2">
              {language === 'hi' ? 'गद्यांश:' : 'Passage:'}
            </p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {passageContent}
            </p>
          </div>
        )}

        {/* Question */}
        <div className="text-gray-800 text-lg leading-relaxed">
          {questionText}
        </div>

        {/* Options */}
        {renderOptions(options)}
      </div>
    );
  };

  // DI - Table
  const renderDITable = () => {
    const diData = question.diDataId;
    const title = getBilingualText(diData?.title, language);
    const instruction = getBilingualText(diData?.instruction, language);
    const tableData = diData?.tableData;
    const headers = getBilingualArray(tableData?.headers, language);
    const rows = tableData?.rows || [];
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {/* Title & Instruction */}
        {title && (
          <div className="font-semibold text-gray-900 text-lg">{title}</div>
        )}
        {instruction && (
          <div className="text-gray-700">{instruction}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-300 text-sm">
            <thead>
              <tr className="bg-primary-100">
                {headers.map((header, index) => (
                  <th key={index} className="border border-gray-300 px-3 py-2 font-semibold text-gray-800">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-center">
                      {cell !== null && cell !== undefined ? cell : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Question */}
        <div className="text-gray-800 text-lg leading-relaxed">
          {questionText}
        </div>

        {/* Options */}
        {renderOptions(options)}
      </div>
    );
  };

  // DI - Bar Chart
  const renderDIBarChart = () => {
    const diData = question.diDataId;
    const title = getBilingualText(diData?.title, language);
    const instruction = getBilingualText(diData?.instruction, language);
    const chartData = diData?.chartData;
    const labels = getBilingualArray(chartData?.labels, language);
    const datasets = chartData?.datasets || [];
    const options = getBilingualArray(question.options, language);

    // Prepare data for Recharts
    const data = labels.map((label, index) => {
      const item = { name: label };
      datasets.forEach((dataset, dsIndex) => {
        const datasetLabel = getBilingualText(dataset.label, language) || `Series ${dsIndex + 1}`;
        item[datasetLabel] = dataset.data[index] || 0;
      });
      return item;
    });

    return (
      <div className="space-y-4">
        {title && <div className="font-semibold text-gray-900 text-lg">{title}</div>}
        {instruction && <div className="text-gray-700">{instruction}</div>}

        {/* Bar Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {datasets.map((dataset, index) => {
                const datasetLabel = getBilingualText(dataset.label, language) || `Series ${index + 1}`;
                return (
                  <Bar
                    key={index}
                    dataKey={datasetLabel}
                    fill={dataset.color || CHART_COLORS[index % CHART_COLORS.length]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-gray-800 text-lg leading-relaxed">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  // DI - Pie Chart
  const renderDIPieChart = () => {
    const diData = question.diDataId;
    const title = getBilingualText(diData?.title, language);
    const instruction = getBilingualText(diData?.instruction, language);
    const chartData = diData?.chartData;
    const labels = getBilingualArray(chartData?.labels, language);
    const dataset = chartData?.datasets?.[0] || {};
    const dataValues = dataset.data || [];
    const colors = dataset.colors || CHART_COLORS;
    const questionOptions = getBilingualArray(question.options, language);

    // Prepare data for Recharts
    const data = labels.map((label, index) => ({
      name: label,
      value: dataValues[index] || 0
    }));

    return (
      <div className="space-y-4">
        {title && <div className="font-semibold text-gray-900 text-lg">{title}</div>}
        {instruction && <div className="text-gray-700">{instruction}</div>}

        {/* Pie Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="text-gray-800 text-lg leading-relaxed">{questionText}</div>
        {renderOptions(questionOptions)}
      </div>
    );
  };

  // DI - Line Graph
  const renderDILineGraph = () => {
    const diData = question.diDataId;
    const title = getBilingualText(diData?.title, language);
    const instruction = getBilingualText(diData?.instruction, language);
    const chartData = diData?.chartData;
    const labels = getBilingualArray(chartData?.labels, language);
    const datasets = chartData?.datasets || [];
    const options = getBilingualArray(question.options, language);

    // Prepare data for Recharts
    const data = labels.map((label, index) => {
      const item = { name: label };
      datasets.forEach((dataset, dsIndex) => {
        const datasetLabel = getBilingualText(dataset.label, language) || `Series ${dsIndex + 1}`;
        item[datasetLabel] = dataset.data[index] || 0;
      });
      return item;
    });

    return (
      <div className="space-y-4">
        {title && <div className="font-semibold text-gray-900 text-lg">{title}</div>}
        {instruction && <div className="text-gray-700">{instruction}</div>}

        {/* Line Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {datasets.map((dataset, index) => {
                const datasetLabel = getBilingualText(dataset.label, language) || `Series ${index + 1}`;
                return (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={datasetLabel}
                    stroke={dataset.color || CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-gray-800 text-lg leading-relaxed">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  // DI - Caselet
  const renderDICaselet = () => {
    const diData = question.diDataId;
    const title = getBilingualText(diData?.title, language);
    const caseletText = getBilingualText(diData?.caseletText, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {title && <div className="font-semibold text-gray-900 text-lg">{title}</div>}

        {/* Caselet Text */}
        {caseletText && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-medium text-blue-800 mb-2">
              {language === 'hi' ? 'डेटा:' : 'Data:'}
            </p>
            <p className="text-gray-800 leading-relaxed whitespace-pre-line">
              {caseletText}
            </p>
          </div>
        )}

        <div className="text-gray-800 text-lg leading-relaxed">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  // Render Options (Common for all types)
  const renderOptions = (options) => {
    return (
      <div className="space-y-2 mt-4">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === index;

          return (
            <button
              key={index}
              onClick={() => !disabled && onAnswerSelect?.(index)}
              disabled={disabled}
              className={`
                w-full flex items-start gap-3 p-4 rounded-lg border-2 text-left
                transition-all duration-200
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${disabled ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              {/* Option Circle */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5
                flex items-center justify-center transition-colors
                ${isSelected 
                  ? 'border-primary-600 bg-primary-600' 
                  : 'border-gray-400'
                }
              `}>
                {isSelected && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>

              {/* Option Text */}
              <div className="flex-1">
                <span className="font-medium text-gray-700">({getOptionLabel(index)})</span>
                <span className="ml-2 text-gray-800">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="question-display">
      {/* Question Number & Type Badge */}
      {showQuestionNumber && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg font-bold text-gray-700">
            {language === 'hi' ? 'प्रश्न' : 'Q.'} {questionNumber}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            {QUESTION_TYPE_LABELS[questionType]?.[language] || questionType}
          </span>
        </div>
      )}

      {/* Question Content */}
      {renderQuestionContent()}
    </div>
  );
};

export default QuestionDisplay;