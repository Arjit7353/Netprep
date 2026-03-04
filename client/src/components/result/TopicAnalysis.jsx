// client/src/components/result/TopicAnalysis.jsx
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BookOpen, TrendingUp, TrendingDown, Target } from 'lucide-react';

const TopicAnalysis = ({ answers, questions, language = 'hi' }) => {
  const { unitData, chapterData, weakAreas, strongAreas } = useMemo(() => {
    if (!answers || !questions) return { unitData: [], chapterData: [], weakAreas: [], strongAreas: [] };
    const uMap = {}, cMap = {};
    answers.forEach((ans, i) => {
      const q = questions[i];
      if (!q) return;
      const u = q.unit || (language === 'hi' ? 'अन्य' : 'Other');
      const c = q.chapter || q.topic || u;
      const skip = ans.selectedAnswer === -1 || ans.selectedAnswer === undefined || ans.selectedAnswer === null;

      [{ map: uMap, key: u }, { map: cMap, key: c }].forEach(({ map, key }) => {
        if (!map[key]) map[key] = { t: 0, c: 0, w: 0, s: 0, time: 0 };
        map[key].t++;
        map[key].time += (ans.timeTaken || 0);
        if (skip) map[key].s++; else if (ans.isCorrect) map[key].c++; else map[key].w++;
      });
    });

    const toArr = (map) => Object.entries(map).map(([name, d]) => ({
      name: name.length > 22 ? name.substring(0, 22) + '...' : name,
      fullName: name, correct: d.c, wrong: d.w, skipped: d.s, total: d.t,
      accuracy: d.t > 0 ? Math.round(d.c / d.t * 100) : 0
    })).sort((a, b) => b.total - a.total);

    const uArr = toArr(uMap), cArr = toArr(cMap);
    return {
      unitData: uArr, chapterData: cArr,
      weakAreas: cArr.filter(c => c.accuracy < 50 && c.total >= 2).slice(0, 5),
      strongAreas: cArr.filter(c => c.accuracy >= 70 && c.total >= 2).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5)
    };
  }, [answers, questions, language]);

  if (unitData.length === 0) return (
    <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-12 text-center">
      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">{language === 'hi' ? 'विश्लेषण उपलब्ध नहीं' : 'No analysis available'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Unit Bar Chart */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-500" />
          {language === 'hi' ? 'इकाई अनुसार प्रदर्शन' : 'Performance by Unit'}
        </h4>
        <ResponsiveContainer width="100%" height={Math.max(250, unitData.length * 50)}>
          <BarChart data={unitData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={95} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
            <Legend />
            <Bar dataKey="correct" stackId="a" fill="#10B981" name={language === 'hi' ? 'सही' : 'Correct'} />
            <Bar dataKey="wrong" stackId="a" fill="#EF4444" name={language === 'hi' ? 'गलत' : 'Wrong'} />
            <Bar dataKey="skipped" stackId="a" fill="#9CA3AF" name={language === 'hi' ? 'छोड़ा' : 'Skipped'} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar */}
      {unitData.length >= 3 && (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            {language === 'hi' ? 'सटीकता रडार' : 'Accuracy Radar'}
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={unitData.slice(0, 8)}>
              <PolarGrid className="opacity-40" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name={language === 'hi' ? 'सटीकता %' : 'Accuracy %'} dataKey="accuracy" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm overflow-x-auto">
        <h4 className="font-bold text-gray-900 dark:text-white mb-4">{language === 'hi' ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 dark:border-secondary-700">
              {[language === 'hi' ? 'विषय' : 'Topic', language === 'hi' ? 'कुल' : 'Total', language === 'hi' ? 'सही' : 'Right', language === 'hi' ? 'गलत' : 'Wrong', language === 'hi' ? 'छोड़ा' : 'Skip', language === 'hi' ? 'सटीकता' : 'Accuracy'].map((h, i) => (
                <th key={i} className={`py-3 px-3 text-gray-500 dark:text-secondary-400 font-semibold text-xs uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chapterData.map((item, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-secondary-700/50 hover:bg-gray-50 dark:hover:bg-secondary-700/30 transition-colors">
                <td className="py-3 px-3 text-gray-800 dark:text-secondary-200 font-medium" title={item.fullName}>{item.name}</td>
                <td className="py-3 px-3 text-center font-bold text-gray-700 dark:text-secondary-300">{item.total}</td>
                <td className="py-3 px-3 text-center text-emerald-600 font-bold">{item.correct}</td>
                <td className="py-3 px-3 text-center text-red-500 font-bold">{item.wrong}</td>
                <td className="py-3 px-3 text-center text-gray-400">{item.skipped}</td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.accuracy >= 70 ? 'bg-emerald-500' : item.accuracy >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${item.accuracy}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${item.accuracy >= 70 ? 'text-emerald-600' : item.accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{item.accuracy}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strong & Weak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strongAreas.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-3"><TrendingUp className="w-5 h-5" />{language === 'hi' ? 'मजबूत क्षेत्र' : 'Strong Areas'}</h4>
            <div className="space-y-2">
              {strongAreas.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/80 dark:bg-secondary-800/80 rounded-xl">
                  <span className="text-sm text-gray-800 dark:text-secondary-200 font-medium">{a.name}</span>
                  <span className="text-sm font-black text-emerald-600">{a.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {weakAreas.length > 0 && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-5">
            <h4 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-3"><TrendingDown className="w-5 h-5" />{language === 'hi' ? 'कमजोर क्षेत्र' : 'Weak Areas'}</h4>
            <div className="space-y-2">
              {weakAreas.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/80 dark:bg-secondary-800/80 rounded-xl">
                  <span className="text-sm text-gray-800 dark:text-secondary-200 font-medium">{a.name}</span>
                  <span className="text-sm font-black text-red-600">{a.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicAnalysis;