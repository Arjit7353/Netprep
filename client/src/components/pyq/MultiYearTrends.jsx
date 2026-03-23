import React, { useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, TrendingUp, Layers, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';

const COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

const MultiYearTrends = ({ language }) => {
  const { multiYear, typeEvolution, unitComparison, loading, error, fetchMultiYear, fetchTypeEvolution, fetchUnitComparison } = usePYQAnalysis();
  const L = (en, hi) => language === 'hi' ? hi : en;

  useEffect(() => {
    fetchMultiYear('paper2').catch(() => {});
    fetchTypeEvolution('paper2').catch(() => {});
    fetchUnitComparison('paper2').catch(() => {});
  }, []);

  const unitLineData = useMemo(() => {
    if (!multiYear?.unitTrends || !multiYear?.years) return [];
    const yearKeys = multiYear.years.map(y => `${y.year}_${y.session}${y.shift !== 'none' ? '_'+y.shift : ''}`);
    return yearKeys.map((yk, yi) => {
      const point = { name: multiYear.years[yi]?.label?.replace(/ - Paper.*$/,'').substring(0,15) || yk };
      multiYear.unitTrends.forEach(ut => {
        point[ut.unitName?.replace(/^UNIT\s+\w+:\s*/i,'').substring(0,15) || ut.unitId] = ut.yearData[yk]?.questionCount || 0;
      });
      return point;
    });
  }, [multiYear]);

  const unitNames = useMemo(() => (multiYear?.unitTrends || []).map(u => u.unitName?.replace(/^UNIT\s+\w+:\s*/i,'').substring(0,15) || u.unitId), [multiYear]);

  const typeBarData = useMemo(() => {
    if (!typeEvolution?.types || !typeEvolution?.yearLabels) return [];
    return typeEvolution.yearLabels.map((label, yi) => {
      const point = { name: label.replace(/ - Paper.*$/,'').substring(0,15) };
      typeEvolution.types.forEach(t => { point[t.label || t.type] = t.yearCounts[yi] || 0; });
      return point;
    });
  }, [typeEvolution]);

  const typeNames = useMemo(() => (typeEvolution?.types || []).map(t => t.label || t.type), [typeEvolution]);

  if (loading && !multiYear) {
    return <div className="flex justify-center py-24"><div className="relative w-14 h-14"><div className="absolute inset-0 rounded-full border-[3px] border-violet-200 dark:border-violet-800" /><div className="absolute inset-0 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" /></div></div>;
  }

  if (!multiYear || multiYear.totalPapers === 0) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-secondary-700 p-14 text-center">
        <TrendingUp className="w-10 h-10 text-gray-300 dark:text-secondary-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-secondary-400 font-medium">{L('Import at least 2 years for trends','रुझान के लिए कम से कम 2 वर्ष आयात करें')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Unit Trend Lines */}
      {unitLineData.length > 0 && (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />{L('Unit Weightage Across Years','वर्षों में इकाई भार')}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-secondary-400 mb-4">{L('Questions per unit in each exam','प्रत्येक परीक्षा में प्रति इकाई प्रश्न')}</p>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={unitLineData} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,30,0.95)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: 11, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {unitNames.map((n, i) => <Line key={n} type="monotone" dataKey={n} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 7 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Type Evolution Stacked */}
      {typeBarData.length > 0 && (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />{L('Question Type Evolution','प्रश्न प्रकार विकास')}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-secondary-400 mb-4">{L('How formats changed over years','वर्षों में प्रारूप कैसे बदले')}</p>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBarData} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,30,0.95)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {typeNames.map((n, i) => <Bar key={n} dataKey={n} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === typeNames.length-1 ? [4,4,0,0] : [0,0,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Unit Comparison Table */}
      {unitComparison?.units?.length > 0 && (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-secondary-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-500" />{L('Unit Average Comparison','इकाई औसत तुलना')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-secondary-700/40">
                  <th className="text-left px-4 py-2.5 font-bold text-gray-500 dark:text-secondary-400">{L('Unit','इकाई')}</th>
                  <th className="text-center px-3 py-2.5 font-bold text-gray-500 dark:text-secondary-400">{L('Avg Q/Yr','औसत Q/वर्ष')}</th>
                  <th className="text-center px-3 py-2.5 font-bold text-gray-500 dark:text-secondary-400">{L('Avg %','औसत %')}</th>
                  <th className="text-left px-3 py-2.5 font-bold text-gray-500 dark:text-secondary-400">{L('Year-wise','वर्ष-वार')}</th>
                </tr>
              </thead>
              <tbody>
                {unitComparison.units.map((u, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-secondary-700/30 hover:bg-violet-50/30 dark:hover:bg-violet-900/5">
                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-secondary-200 text-[11px]">{u.unitName}</td>
                    <td className="text-center px-3 py-2.5 font-black text-gray-900 dark:text-white">{u.avgQuestions}</td>
                    <td className="text-center px-3 py-2.5">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-10 h-1.5 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, u.avgPercentage * 3)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 dark:text-secondary-400 tabular-nums">{u.avgPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {u.yearData?.map((yd, yi) => (
                          <div key={yi} className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-[10px] font-black text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800/50" title={yd.label}>{yd.questionCount}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MultiYearTrends;