import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  CheckCircle, Circle, BookOpen, AlertCircle, Table2,
  BarChart3, PieChart as PieChartIcon, TrendingUp, FileText,
  ArrowRight
} from 'lucide-react';
import {
  getBilingualText, getBilingualArray, getOptionLabel,
  getRomanNumeral, getChartLabels, getDatasetLabel
} from '../../utils/helpers';
import { QUESTION_TYPE_LABELS, CHART_COLORS } from '../../utils/constants';

/* ─── Enhanced Custom Tooltip for Charts ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-800 dark:text-white">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Pie Chart Custom Label ─── */
const renderPieLabel = ({ name, percent, x, y, midAngle }) => {
  if (percent < 0.04) return null;
  return (
    <text x={x} y={y} fill="#475569" textAnchor={midAngle > 180 ? 'end' : 'start'}
      dominantBaseline="central" className="text-[11px] font-medium">
      {name}: {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* ─── Option Button Component ─── */
const OptionButton = ({ index, text, isSelected, disabled, onClick }) => {
  const optLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const label = optLabels[index] || `${index + 1}`;

  return (
    <button
      onClick={() => !disabled && onClick?.(index)}
      disabled={disabled}
      className={`
        group w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left
        transition-all duration-200 active:scale-[0.99]
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md shadow-blue-500/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
    >
      {/* Option Circle */}
      <div className={`
        w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
        text-sm font-bold transition-all duration-200
        ${isSelected
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'}
      `}>
        {isSelected ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          label
        )}
      </div>

      {/* Option Text */}
      <div className={`flex-1 pt-1.5 text-[15px] leading-relaxed transition-colors ${
        isSelected ? 'text-blue-900 dark:text-blue-100 font-medium' : 'text-slate-700 dark:text-slate-300'
      }`}>
        {text}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="flex-shrink-0 mt-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
      )}
    </button>
  );
};

/* ═══════════════ MAIN QuestionDisplay ═══════════════ */
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
  const questionText = getBilingualText(question.question, language);

  /* ─── Render Options (shared by all types) ─── */
  const renderOptions = (options) => (
    <div className="space-y-2.5 mt-5">
      {options.map((option, index) => (
        <OptionButton
          key={index}
          index={index}
          text={option}
          isSelected={selectedAnswer === index}
          disabled={disabled}
          onClick={onAnswerSelect}
        />
      ))}
    </div>
  );

  /* ─── MCQ ─── */
  const renderMCQ = () => {
    const options = getBilingualArray(question.options, language);
    return (
      <div className="space-y-4">
        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">
          {questionText}
        </div>
        {renderOptions(options)}
      </div>
    );
  };

  /* ─── Assertion-Reason ─── */
  const renderAssertionReason = () => {
    const assertion = getBilingualText(question.assertionReasonData?.assertion, language);
    const reason = getBilingualText(question.assertionReasonData?.reason, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        <div className="text-slate-700 dark:text-slate-300 font-medium">
          {questionText || (language === 'hi'
            ? 'निम्नलिखित दो कथनों को पढ़ें और सही विकल्प चुनें:'
            : 'Read the following two statements and choose the correct option:')}
        </div>

        {/* Assertion Card */}
        <div className="rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-800">
          <div className="px-4 py-2 bg-blue-600 text-white text-sm font-bold flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">A</div>
            {language === 'hi' ? 'अभिकथन (A)' : 'Assertion (A)'}
          </div>
          <div className="px-5 py-4 bg-blue-50 dark:bg-blue-900/20 text-slate-800 dark:text-slate-200 leading-relaxed">
            {assertion}
          </div>
        </div>

        {/* Reason Card */}
        <div className="rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
          <div className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">R</div>
            {language === 'hi' ? 'कारण (R)' : 'Reason (R)'}
          </div>
          <div className="px-5 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-slate-800 dark:text-slate-200 leading-relaxed">
            {reason}
          </div>
        </div>

        {renderOptions(options)}
      </div>
    );
  };

  /* ─── Match Following (TABLE) ─── */
  const renderMatchFollowing = () => {
    const listA = getBilingualArray(question.matchData?.listA, language);
    const listB = getBilingualArray(question.matchData?.listB, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">
          {questionText || (language === 'hi'
            ? 'सूची-I को सूची-II से सुमेलित कीजिए:'
            : 'Match List-I with List-II:')}
        </div>

        {/* Premium Match Table */}
        <div className="overflow-x-auto rounded-2xl border-2 border-slate-300 dark:border-slate-600 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-700 to-slate-800">
                <th className="px-5 py-3 text-left text-white font-bold text-sm w-1/2 border-r border-slate-600">
                  {language === 'hi' ? 'सूची-I' : 'List-I'}
                </th>
                <th className="px-5 py-3 text-left text-white font-bold text-sm w-1/2">
                  {language === 'hi' ? 'सूची-II' : 'List-II'}
                </th>
              </tr>
            </thead>
            <tbody>
              {listA.map((itemA, idx) => (
                <tr key={idx} className={`
                  ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}
                  border-t border-slate-200 dark:border-slate-700
                  hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors
                `}>
                  <td className="px-5 py-3.5 border-r border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-black flex-shrink-0">
                        {getOptionLabel(idx)}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{itemA}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex-shrink-0 px-1.5">
                        {getRomanNumeral(idx)}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 leading-relaxed">{listB[idx] || ''}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {language === 'hi' ? 'सही विकल्प चुनिए:' : 'Choose the correct option:'}
        </p>

        {renderOptions(options)}
      </div>
    );
  };

  /* ─── Sequence Order ─── */
  const renderSequenceOrder = () => {
    const items = getBilingualArray(question.sequenceData?.items, language);
    const options = getBilingualArray(question.options, language);
    const romanLabels = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

    return (
      <div className="space-y-4">
        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">
          {questionText || (language === 'hi'
            ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:'
            : 'Arrange the following in correct order:')}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          {items.map((item, idx) => (
            <div key={idx}
              className="flex items-start gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                {romanLabels[idx] || idx + 1}
              </span>
              <span className="text-slate-800 dark:text-slate-200 flex-1 leading-relaxed pt-0.5">{item}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {language === 'hi' ? 'सही क्रम चुनिए:' : 'Choose the correct sequence:'}
        </p>

        {renderOptions(options)}
      </div>
    );
  };

  /* ─── Statement Based ─── */
  const renderStatementBased = () => {
    const statements = getBilingualArray(question.statementData?.statements, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">
          {questionText || (language === 'hi'
            ? 'निम्नलिखित कथनों पर विचार कीजिए:'
            : 'Consider the following statements:')}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 space-y-2.5">
          {statements.map((st, idx) => (
            <div key={idx}
              className="flex items-start gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                {idx + 1}
              </span>
              <span className="text-slate-800 dark:text-slate-200 flex-1 leading-relaxed pt-0.5">{st}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {language === 'hi'
            ? 'उपर्युक्त में से कौन सा/से कथन सही है/हैं?'
            : 'Which of the above statement(s) is/are correct?'}
        </p>

        {renderOptions(options)}
      </div>
    );
  };

  /* ─── Passage Based ─── */
  const renderPassageBased = () => {
    const passage = question.passageId;
    const passageContent = getBilingualText(passage?.content, language);
    const passageTitle = passage?.title || '';
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {passageContent && (
          <div className="rounded-2xl overflow-hidden border border-teal-200 dark:border-teal-800">
            <div className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {passageTitle || (language === 'hi' ? 'गद्यांश' : 'Passage')}
            </div>
            <div className="px-5 py-4 bg-teal-50 dark:bg-teal-900/10 text-slate-800 dark:text-slate-200 leading-[1.8] text-[15px] max-h-[300px] overflow-y-auto scrollbar-thin">
              {passageContent.split('\n').map((p, i) => (
                <p key={i} className="mb-2 last:mb-0">{p}</p>
              ))}
            </div>
          </div>
        )}

        {question?.passageOrder && (
          <span className="inline-block px-3 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold">
            {language === 'hi'
              ? `प्रश्न ${question.passageOrder} (गद्यांश आधारित)`
              : `Question ${question.passageOrder} (Passage Based)`}
          </span>
        )}

        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">
          {questionText}
        </div>

        {renderOptions(options)}
      </div>
    );
  };

  /* ─── DI Table ─── */
  const renderDITable = () => {
    const di = question.diDataId;
    const title = getBilingualText(di?.title, language);
    const instruction = getBilingualText(di?.instruction, language);
    const headers = getBilingualArray(di?.tableData?.headers, language);
    const rows = di?.tableData?.rows || [];
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {di && (
          <div className="rounded-2xl overflow-hidden border border-indigo-200 dark:border-indigo-800">
            <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              {title || (language === 'hi' ? 'तालिका' : 'Table')}
            </div>
            {instruction && (
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 text-sm text-indigo-700 dark:text-indigo-300 italic border-b border-indigo-200 dark:border-indigo-800">
                {instruction}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {headers.length > 0 && (
                  <thead>
                    <tr className="bg-indigo-50 dark:bg-indigo-900/20">
                      {headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 text-center font-bold text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className={`${ri % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors`}>
                      {Array.isArray(row) && row.map((cell, ci) => (
                        <td key={ci} className={`px-4 py-2.5 border border-indigo-200 dark:border-indigo-800 ${ci === 0 ? 'text-left font-semibold text-slate-800 dark:text-slate-200' : 'text-center text-slate-700 dark:text-slate-300'} whitespace-nowrap`}>
                          {cell !== null && cell !== undefined ? (typeof cell === 'number' ? cell.toLocaleString() : cell) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {question?.diOrder && (
          <span className="inline-block px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            {language === 'hi' ? `प्रश्न ${question.diOrder} (DI)` : `Q.${question.diOrder} (DI)`}
          </span>
        )}

        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">
          {questionText}
        </div>

        {renderOptions(options)}
      </div>
    );
  };

  /* ─── DI Bar Chart ─── */
  const renderDIBarChart = () => {
    const di = question.diDataId;
    const title = getBilingualText(di?.title, language);
    const instruction = getBilingualText(di?.instruction, language);
    const labels = getChartLabels(di?.chartData?.labels, language);
    const datasets = di?.chartData?.datasets || [];
    const xLabel = getBilingualText(di?.chartData?.xAxisLabel, language);
    const yLabel = getBilingualText(di?.chartData?.yAxisLabel, language);
    const options = getBilingualArray(question.options, language);

    const data = labels.map((l, i) => {
      const p = { name: l };
      datasets.forEach((ds, di) => {
        p[getDatasetLabel(ds.label, language, `S${di + 1}`)] = ds.data?.[i] ?? 0;
      });
      return p;
    });

    return (
      <div className="space-y-4">
        {di && (
          <div className="rounded-2xl overflow-hidden border border-sky-200 dark:border-sky-800">
            <div className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 text-white text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {title || (language === 'hi' ? 'बार चार्ट' : 'Bar Chart')}
            </div>
            {instruction && (
              <div className="px-4 py-2 bg-sky-50 dark:bg-sky-900/10 text-sm text-sky-700 dark:text-sky-300 italic border-b border-sky-200 dark:border-sky-800">
                {instruction}
              </div>
            )}
            {labels.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-800">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }}
                      label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -15, fontSize: 11 } : undefined} />
                    <YAxis tick={{ fontSize: 11 }}
                      label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {datasets.map((ds, i) => (
                      <Bar key={i}
                        dataKey={getDatasetLabel(ds.label, language, `S${i + 1}`)}
                        fill={ds.color || CHART_COLORS[i % CHART_COLORS.length]}
                        radius={[6, 6, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  /* ─── DI Pie Chart ─── */
  const renderDIPieChart = () => {
    const di = question.diDataId;
    const title = getBilingualText(di?.title, language);
    const instruction = getBilingualText(di?.instruction, language);
    const labels = getChartLabels(di?.chartData?.labels, language);
    const ds = di?.chartData?.datasets?.[0] || {};
    const values = ds.data || [];
    const colors = ds.colors || CHART_COLORS;
    const options = getBilingualArray(question.options, language);

    const data = labels.map((l, i) => ({ name: l, value: values[i] || 0 }));

    return (
      <div className="space-y-4">
        {di && (
          <div className="rounded-2xl overflow-hidden border border-rose-200 dark:border-rose-800">
            <div className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              {title || (language === 'hi' ? 'पाई चार्ट' : 'Pie Chart')}
            </div>
            {instruction && (
              <div className="px-4 py-2 bg-rose-50 dark:bg-rose-900/10 text-sm text-rose-700 dark:text-rose-300 italic border-b border-rose-200 dark:border-rose-800">
                {instruction}
              </div>
            )}
            {labels.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-800">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={100} innerRadius={40}
                      labelLine label={renderPieLabel} dataKey="value" strokeWidth={2} stroke="#fff">
                      {data.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  /* ─── DI Line Graph ─── */
  const renderDILineGraph = () => {
    const di = question.diDataId;
    const title = getBilingualText(di?.title, language);
    const instruction = getBilingualText(di?.instruction, language);
    const labels = getChartLabels(di?.chartData?.labels, language);
    const datasets = di?.chartData?.datasets || [];
    const xLabel = getBilingualText(di?.chartData?.xAxisLabel, language);
    const yLabel = getBilingualText(di?.chartData?.yAxisLabel, language);
    const options = getBilingualArray(question.options, language);

    const data = labels.map((l, i) => {
      const p = { name: l };
      datasets.forEach((ds, di) => {
        p[getDatasetLabel(ds.label, language, `S${di + 1}`)] = ds.data?.[i] ?? 0;
      });
      return p;
    });

    return (
      <div className="space-y-4">
        {di && (
          <div className="rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
            <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {title || (language === 'hi' ? 'लाइन ग्राफ' : 'Line Graph')}
            </div>
            {instruction && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-sm text-emerald-700 dark:text-emerald-300 italic border-b border-emerald-200 dark:border-emerald-800">
                {instruction}
              </div>
            )}
            {labels.length > 0 && (
              <div className="p-4 bg-white dark:bg-slate-800">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }}
                      label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -15, fontSize: 11 } : undefined} />
                    <YAxis tick={{ fontSize: 11 }}
                      label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    {datasets.map((ds, i) => (
                      <Line key={i} type="monotone"
                        dataKey={getDatasetLabel(ds.label, language, `S${i + 1}`)}
                        stroke={ds.color || CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2.5} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 7 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  /* ─── DI Caselet ─── */
  const renderDICaselet = () => {
    const di = question.diDataId;
    const title = getBilingualText(di?.title, language);
    const caseletText = getBilingualText(di?.caseletText, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div className="space-y-4">
        {di && caseletText && (
          <div className="rounded-2xl overflow-hidden border border-violet-200 dark:border-violet-800">
            <div className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {title || (language === 'hi' ? 'केसलेट डेटा' : 'Caselet Data')}
            </div>
            <div className="px-5 py-4 bg-violet-50 dark:bg-violet-900/10 text-slate-800 dark:text-slate-200 leading-[1.8] text-[15px] max-h-[300px] overflow-y-auto scrollbar-thin">
              {caseletText.split('\n').map((p, i) => (
                <p key={i} className="mb-2 last:mb-0">{p}</p>
              ))}
            </div>
          </div>
        )}

        <div className="text-slate-800 dark:text-slate-200 text-[17px] leading-[1.7] font-medium">{questionText}</div>
        {renderOptions(options)}
      </div>
    );
  };

  /* ─── Render by Type ─── */
  const renderContent = () => {
    switch (questionType) {
      case 'assertion_reason': return renderAssertionReason();
      case 'match_following': return renderMatchFollowing();
      case 'sequence_order': return renderSequenceOrder();
      case 'statement_based': return renderStatementBased();
      case 'passage_based': return renderPassageBased();
      case 'di_table': return renderDITable();
      case 'di_bar_chart': return renderDIBarChart();
      case 'di_pie_chart': return renderDIPieChart();
      case 'di_line_graph': return renderDILineGraph();
      case 'di_caselet': return renderDICaselet();
      case 'di_mixed': return renderDIBarChart(); // fallback
      default: return renderMCQ();
    }
  };

  return (
    <div className="question-display">
      {showQuestionNumber && (
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/20">
            {questionNumber}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            {QUESTION_TYPE_LABELS[questionType]?.[language] || questionType}
          </span>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default QuestionDisplay;