import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Award, Hash, Flame, Target, Clock, Zap } from 'lucide-react';

const ResultComparison = ({ attempts = [], currentAttempt, language = 'hi' }) => {
  const chartData = useMemo(() => {
    if (!attempts?.length) return [];
    return attempts
      .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt))
      .map((att, i) => ({
        name: `#${att.attemptNumber || i + 1}`,
        score: att.score || 0, accuracy: att.accuracy || 0,
        correct: att.correctCount || 0, wrong: att.wrongCount || 0, skipped: att.skippedCount || 0,
        time: att.totalTimeTaken ? Math.round(att.totalTimeTaken / 60) : 0,
        isCurrent: att._id === currentAttempt?._id,
        date: att.completedAt ? new Date(att.completedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }) : '',
      }));
  }, [attempts, currentAttempt, language]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1], prev = chartData[chartData.length - 2];
    const sd = last.score - prev.score, ad = last.accuracy - prev.accuracy;
    const ic = (d) => d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
    const cl = (d) => d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : 'text-gray-500';
    const bg = (d) => d > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : d < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-secondary-700';
    return {
      score: { diff: sd, icon: ic(sd), color: cl(sd), bg: bg(sd) },
      accuracy: { diff: ad, icon: ic(ad), color: cl(ad), bg: bg(ad) },
    };
  }, [chartData]);

  const bestScore = useMemo(() => chartData.length ? Math.max(...chartData.map(d => d.score)) : 0, [chartData]);
  const bestAcc = useMemo(() => chartData.length ? Math.max(...chartData.map(d => d.accuracy)) : 0, [chartData]);
  const avgTime = useMemo(() => chartData.length ? Math.round(chartData.reduce((s, d) => s + d.time, 0) / chartData.length) : 0, [chartData]);

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

      {/* Trend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ...(trend ? [
            { label: language === 'hi' ? 'अंक रुझान' : 'Score Trend', ...trend.score, val: `${trend.score.diff > 0 ? '+' : ''}${trend.score.diff}`, gradient: trend.score.diff >= 0 ? 'from-emerald-500 to-green-600' : 'from-red-500 to-rose-600' },
            { label: language === 'hi' ? 'सटीकता' : 'Accuracy', ...trend.accuracy, val: `${trend.accuracy.diff > 0 ? '+' : ''}${trend.accuracy.diff}%`, gradient: trend.accuracy.diff >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600' },
          ] : []),
          { label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best Score', icon: Award, color: 'text-amber-600', val: `${bestScore}`, gradient: 'from-amber-500 to-orange-600' },
          { label: language === 'hi' ? 'प्रयास' : 'Attempts', icon: Hash, color: 'text-primary-600', val: `${chartData.length}`, gradient: 'from-primary-500 to-indigo-600' },
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 group hover:shadow-lg transition-all">
            <div className={`absolute -top-3 -right-3 w-14 h-14 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
              {s.icon && <s.icon className={`w-4 h-4 ${s.color}`} />}
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Improvement Insight */}
      {trend && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
          trend.score.diff > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
          trend.score.diff < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-gray-50 dark:bg-secondary-700 border-gray-200 dark:border-secondary-600'
        }`}>
          {trend.score.diff > 0 ? <Flame className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /> :
           trend.score.diff < 0 ? <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> :
           <Minus className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />}
          <p className={`text-sm font-medium ${
            trend.score.diff > 0 ? 'text-emerald-800 dark:text-emerald-300' :
            trend.score.diff < 0 ? 'text-red-800 dark:text-red-300' : 'text-gray-600'
          }`}>
            {trend.score.diff > 0
              ? (language === 'hi' ? `📈 पिछले प्रयास से ${trend.score.diff} अंक बढ़े! बढ़िया सुधार!` : `📈 Improved by ${trend.score.diff} points! Great progress!`)
              : trend.score.diff < 0
                ? (language === 'hi' ? `📉 पिछले प्रयास से ${Math.abs(trend.score.diff)} अंक कम। अभ्यास जारी रखें।` : `📉 Decreased by ${Math.abs(trend.score.diff)} points. Keep practicing.`)
                : (language === 'hi' ? '➡️ पिछले प्रयास जैसा ही स्कोर।' : '➡️ Same score as last attempt.')}
          </p>
        </div>
      )}

      {/* Performance Trend Line */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          {language === 'hi' ? 'प्रदर्शन रुझान' : 'Performance Trend'}
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3}
              name={language === 'hi' ? 'अंक' : 'Score'} dot={{ r: 5, fill: '#3B82F6' }} activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3}
              name={language === 'hi' ? 'सटीकता %' : 'Accuracy %'} dot={{ r: 5, fill: '#10B981' }} activeDot={{ r: 8 }} />
          </LineChart>
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
            {chartData.map((r, i) => (
              <tr key={i} className={`border-b border-gray-50 dark:border-secondary-700/50 transition-colors ${r.isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-secondary-700/30'}`}>
                <td className="py-3 px-3 font-bold text-gray-800 dark:text-secondary-200">
                  {r.name}
                  {r.isCurrent && <span className="ml-1 text-[10px] text-primary-600 font-semibold bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                    {language === 'hi' ? 'वर्तमान' : 'Current'}
                  </span>}
                </td>
                <td className="py-3 px-3 text-center text-gray-500 text-xs">{r.date}</td>
                <td className="py-3 px-3 text-center font-bold text-gray-800 dark:text-secondary-200">
                  {r.score}
                  {r.score === bestScore && <span className="ml-1 text-amber-500">⭐</span>}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultComparison;