// client/src/components/result/ResultComparison.jsx
import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Award, Hash } from 'lucide-react';

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
        date: att.completedAt ? new Date(att.completedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }) : ''
      }));
  }, [attempts, currentAttempt, language]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return null;
    const last = chartData[chartData.length - 1], prev = chartData[chartData.length - 2];
    const sd = last.score - prev.score, ad = last.accuracy - prev.accuracy;
    const ic = (d) => d > 0 ? TrendingUp : d < 0 ? TrendingDown : Minus;
    const cl = (d) => d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-600' : 'text-gray-500';
    return { score: { diff: sd, icon: ic(sd), color: cl(sd) }, accuracy: { diff: ad, icon: ic(ad), color: cl(ad) } };
  }, [chartData]);

  if (chartData.length < 2) return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-12 text-center">
      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">{language === 'hi' ? 'कम से कम 2 प्रयास आवश्यक' : 'Need 2+ attempts to compare'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {trend && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: language === 'hi' ? 'अंक रुझान' : 'Score Trend', ...trend.score, val: `${trend.score.diff > 0 ? '+' : ''}${trend.score.diff}` },
            { label: language === 'hi' ? 'सटीकता' : 'Accuracy', ...trend.accuracy, val: `${trend.accuracy.diff > 0 ? '+' : ''}${trend.accuracy.diff}%` },
            { label: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', icon: Award, color: 'text-amber-600', val: `${Math.max(...chartData.map(d => d.score))}` },
            { label: language === 'hi' ? 'प्रयास' : 'Attempts', icon: Hash, color: 'text-primary-600', val: `${chartData.length}` }
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
                {s.icon && <s.icon className={`w-4 h-4 ${s.color}`} />}
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

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
            <Line yAxisId="left" type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={3} name={language === 'hi' ? 'अंक' : 'Score'} dot={{ r: 5, fill: '#3B82F6' }} activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={3} name={language === 'hi' ? 'सटीकता %' : 'Accuracy %'} dot={{ r: 5, fill: '#10B981' }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">{language === 'hi' ? 'प्रयास-वार विवरण' : 'Attempt Breakdown'}</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '16px' }} />
            <Legend />
            <Bar dataKey="correct" stackId="a" fill="#10B981" name={language === 'hi' ? 'सही' : 'Correct'} />
            <Bar dataKey="wrong" stackId="a" fill="#EF4444" name={language === 'hi' ? 'गलत' : 'Wrong'} />
            <Bar dataKey="skipped" stackId="a" fill="#9CA3AF" name={language === 'hi' ? 'छोड़ा' : 'Skipped'} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm overflow-x-auto">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">{language === 'hi' ? 'तुलना तालिका' : 'Comparison Table'}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 dark:border-secondary-700">
              {[language === 'hi' ? 'प्रयास' : 'Attempt', language === 'hi' ? 'तिथि' : 'Date', language === 'hi' ? 'अंक' : 'Score', language === 'hi' ? 'सही' : 'Right', language === 'hi' ? 'गलत' : 'Wrong', language === 'hi' ? 'सटीकता' : 'Accuracy', language === 'hi' ? 'समय' : 'Time'].map((h, i) => (
                <th key={i} className={`py-3 px-2 text-gray-500 font-semibold text-xs uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.map((r, i) => (
              <tr key={i} className={`border-b border-gray-50 dark:border-secondary-700/50 ${r.isCurrent ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                <td className="py-3 px-2 font-bold text-gray-800 dark:text-secondary-200">
                  {r.name}{r.isCurrent && <span className="ml-1 text-[10px] text-primary-600 font-semibold">({language === 'hi' ? 'वर्तमान' : 'Current'})</span>}
                </td>
                <td className="py-3 px-2 text-center text-gray-500 text-xs">{r.date}</td>
                <td className="py-3 px-2 text-center font-bold text-gray-800 dark:text-secondary-200">{r.score}</td>
                <td className="py-3 px-2 text-center text-emerald-600 font-bold">{r.correct}</td>
                <td className="py-3 px-2 text-center text-red-500 font-bold">{r.wrong}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${r.accuracy >= 70 ? 'bg-emerald-100 text-emerald-700' : r.accuracy >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.accuracy}%</span>
                </td>
                <td className="py-3 px-2 text-center text-gray-500">{r.time}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultComparison;