import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Activity, Award, Hash, Star,
  Clock, Target, Zap, ArrowUp, ArrowDown, Medal, Flame
} from 'lucide-react';

// ─── Mini Sparkline ───
const Sparkline = ({ data, width = 80, height = 24, color }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const c = color || (data[data.length - 1] >= data[0] ? '#10B981' : '#EF4444');
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polygon points={fillPoints} fill={c} fillOpacity="0.1" />
      <polyline points={points} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={c} stroke="white" strokeWidth="1.5" />
    </svg>
  );
};

// ─── Delta Badge ───
const DeltaBadge = ({ value, suffix = '' }) => {
  if (value === 0 || value === undefined || value === null) return (
    <span className="flex items-center gap-0.5 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-secondary-700 px-2 py-0.5 rounded-lg">
      <Minus className="w-3 h-3" />0{suffix}
    </span>
  );
  const positive = value > 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-lg ${
      positive ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {positive ? '+' : ''}{value}{suffix}
    </span>
  );
};

const ResultComparison = ({ attempts = [], currentAttempt, language = 'hi' }) => {
  const chartData = useMemo(() => {
    if (!attempts?.length) return [];
    return attempts
      .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt))
      .map((att, i) => ({
        name: `#${att.attemptNumber || i + 1}`,
        score: att.score || 0,
        accuracy: att.accuracy || 0,
        percentage: att.percentage || 0,
        correct: att.correctCount || 0,
        wrong: att.wrongCount || 0,
        skipped: att.skippedCount || 0,
        time: att.totalTimeTaken ? Math.round(att.totalTimeTaken / 60) : 0,
        isCurrent: att._id === currentAttempt?._id,
        date: att.completedAt ? new Date(att.completedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }) : '',
      }));
  }, [attempts, currentAttempt, language]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1], prev = chartData[chartData.length - 2];
    return {
      score: last.score - prev.score,
      accuracy: last.accuracy - prev.accuracy,
      percentage: last.percentage - prev.percentage,
      time: last.time - prev.time,
    };
  }, [chartData]);

  const bestScore = useMemo(() => chartData.length ? Math.max(...chartData.map(d => d.score)) : 0, [chartData]);
  const bestAcc = useMemo(() => chartData.length ? Math.max(...chartData.map(d => d.accuracy)) : 0, [chartData]);
  const bestPct = useMemo(() => chartData.length ? Math.max(...chartData.map(d => d.percentage)) : 0, [chartData]);
  const isPersonalBest = currentAttempt && (currentAttempt.score === bestScore || currentAttempt.percentage === bestPct);

  if (chartData.length < 2) return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-16 text-center">
      <Activity className="w-14 h-14 text-gray-300 dark:text-secondary-600 mx-auto mb-4" />
      <p className="text-gray-600 dark:text-secondary-400 text-lg font-medium">
        {language === 'hi' ? 'तुलना के लिए कम से कम 2 प्रयास आवश्यक' : 'Need at least 2 attempts to compare'}
      </p>
      <p className="text-gray-400 text-sm mt-1">
        {language === 'hi' ? 'इस परीक्षा को दोबारा दें' : 'Take this test again to see comparison'}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Personal Best Banner */}
      {isPersonalBest && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl animate-bounce-in">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
            <Medal className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-400">
              {language === 'hi' ? 'नया व्यक्तिगत सर्वश्रेष्ठ!' : 'New Personal Best!'}
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {language === 'hi' ? 'यह आपका अब तक का सबसे अच्छा प्रयास है' : 'This is your best attempt so far'}
            </p>
          </div>
          <Star className="w-6 h-6 text-amber-500 fill-amber-500 ml-auto" />
        </div>
      )}

      {/* Trend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: language === 'hi' ? 'स्कोर रुझान' : 'Score Trend',
            value: trend ? `${trend.score > 0 ? '+' : ''}${trend.score}` : '-',
            delta: trend?.score,
            sparkData: chartData.map(d => d.score),
            gradient: (trend?.score || 0) >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600',
            icon: (trend?.score || 0) >= 0 ? TrendingUp : TrendingDown
          },
          {
            label: language === 'hi' ? 'सटीकता' : 'Accuracy',
            value: trend ? `${trend.accuracy > 0 ? '+' : ''}${trend.accuracy}%` : '-',
            delta: trend?.accuracy,
            sparkData: chartData.map(d => d.accuracy),
            gradient: (trend?.accuracy || 0) >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600',
            icon: (trend?.accuracy || 0) >= 0 ? TrendingUp : TrendingDown
          },
          {
            label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best Score',
            value: `${bestScore}`,
            icon: Award,
            gradient: 'from-amber-500 to-orange-600'
          },
          {
            label: language === 'hi' ? 'प्रयास' : 'Attempts',
            value: `${chartData.length}`,
            icon: Hash,
            gradient: 'from-primary-500 to-indigo-600'
          },
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 group hover:shadow-lg transition-all">
            <div className={`absolute -top-3 -right-3 w-14 h-14 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
              {s.delta !== undefined && <DeltaBadge value={s.delta} suffix={s.label.includes('Accuracy') || s.label.includes('सटीकता') ? '%' : ''} />}
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
              {s.sparkData && <Sparkline data={s.sparkData} width={60} height={24} />}
            </div>
          </div>
        ))}
      </div>

      {/* Improvement Insight */}
      {trend && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
          trend.score > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
          trend.score < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-gray-50 dark:bg-secondary-700 border-gray-200 dark:border-secondary-600'
        }`}>
          {trend.score > 0 ? <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /> :
           trend.score < 0 ? <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> :
           <Minus className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />}
          <p className={`text-sm font-medium ${
            trend.score > 0 ? 'text-emerald-800 dark:text-emerald-300' :
            trend.score < 0 ? 'text-red-800 dark:text-red-300' : 'text-gray-600'
          }`}>
            {trend.score > 0
              ? (language === 'hi' ? `पिछले प्रयास से ${trend.score} अंक बढ़े! बढ़िया सुधार!` : `Improved by ${trend.score} points! Great progress!`)
              : trend.score < 0
                ? (language === 'hi' ? `पिछले प्रयास से ${Math.abs(trend.score)} अंक कम। अभ्यास जारी रखें।` : `Decreased by ${Math.abs(trend.score)} points. Keep practicing.`)
                : (language === 'hi' ? 'पिछले प्रयास जैसा ही स्कोर।' : 'Same score as last attempt.')}
          </p>
        </div>
      )}

      {/* Performance Trend Area Chart */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          {language === 'hi' ? 'प्रदर्शन रुझान' : 'Performance Trend'}
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} fill="url(#scoreGrad)"
              name={language === 'hi' ? 'अंक' : 'Score'} dot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
            <Area yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} fill="url(#accGrad)"
              name={language === 'hi' ? 'सटीकता %' : 'Accuracy %'} dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stacked Bar */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">
          {language === 'hi' ? 'प्रयास-वार विवरण' : 'Attempt Breakdown'}
        </h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '16px' }} />
            <Legend />
            <Bar dataKey="correct" stackId="a" fill="#10B981" name={language === 'hi' ? 'सही' : 'Correct'} />
            <Bar dataKey="wrong" stackId="a" fill="#EF4444" name={language === 'hi' ? 'गलत' : 'Wrong'} />
            <Bar dataKey="skipped" stackId="a" fill="#9CA3AF" name={language === 'hi' ? 'छोड़ा' : 'Skipped'} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm overflow-x-auto">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">
          {language === 'hi' ? 'तुलना तालिका' : 'Comparison Table'}
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 dark:border-secondary-700">
              {[language === 'hi' ? 'प्रयास' : '#', language === 'hi' ? 'तिथि' : 'Date', language === 'hi' ? 'अंक' : 'Score', language === 'hi' ? 'सही' : 'Right', language === 'hi' ? 'गलत' : 'Wrong', language === 'hi' ? 'सटीकता' : 'Acc', language === 'hi' ? 'समय' : 'Time'].map((h, i) => (
                <th key={i} className={`py-3 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((r, i) => {
              const prevRow = i > 0 ? chartData[i - 1] : null;
              return (
                <tr key={i} className={`border-b border-gray-50 dark:border-secondary-700/50 transition-colors ${r.isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-secondary-700/30'}`}>
                  <td className="py-3 px-3 font-bold text-gray-800 dark:text-secondary-200">
                    <div className="flex items-center gap-2">
                      {r.name}
                      {r.isCurrent && <span className="text-[10px] text-primary-600 font-semibold bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                        {language === 'hi' ? 'वर्तमान' : 'Current'}
                      </span>}
                      {r.score === bestScore && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-500 text-xs">{r.date}</td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-bold text-gray-800 dark:text-secondary-200">{r.score}</span>
                      {prevRow && <DeltaBadge value={r.score - prevRow.score} />}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-600 font-bold">{r.correct}</td>
                  <td className="py-3 px-3 text-center text-red-500 font-bold">{r.wrong}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      r.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      r.accuracy >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{r.accuracy}%</span>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-500">{r.time}m</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultComparison;