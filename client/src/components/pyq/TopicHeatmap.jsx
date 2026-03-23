import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, Target, ArrowUpDown, Filter, ChevronDown } from 'lucide-react';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';

const TopicHeatmap = ({ language }) => {
  const { topicFrequency, loading, fetchTopicFrequency } = usePYQAnalysis();
  const [sortBy, setSortBy] = useState('importance');
  const [filterUnit, setFilterUnit] = useState('all');
  const [level, setLevel] = useState('chapter');

  const L = (en, hi) => language === 'hi' ? hi : en;

  useEffect(() => { fetchTopicFrequency('paper2', level).catch(() => {}); }, [level]);

  const topics = useMemo(() => {
    if (!topicFrequency?.topics) return [];
    let f = [...topicFrequency.topics];
    if (filterUnit !== 'all') f = f.filter(t => t.unitId === filterUnit);
    if (sortBy === 'importance') f.sort((a,b) => b.importanceScore - a.importanceScore);
    else if (sortBy === 'total') f.sort((a,b) => b.totalCount - a.totalCount);
    else if (sortBy === 'consistency') f.sort((a,b) => b.yearsAppeared - a.yearsAppeared);
    return f;
  }, [topicFrequency, sortBy, filterUnit]);

  const unitOptions = useMemo(() => {
    if (!topicFrequency?.topics) return [];
    return [...new Set(topicFrequency.topics.map(t => t.unitId).filter(Boolean))].sort();
  }, [topicFrequency]);

  const yearLabels = topicFrequency?.years || [];

  const cellStyle = (count) => {
    if (count === 0) return 'bg-gray-100/80 dark:bg-secondary-700/20 text-gray-400 dark:text-secondary-600';
    if (count === 1) return 'bg-violet-100 dark:bg-violet-900/25 text-violet-600 dark:text-violet-400';
    if (count <= 3) return 'bg-violet-300/80 dark:bg-violet-800/50 text-violet-800 dark:text-violet-200';
    if (count <= 5) return 'bg-violet-500 dark:bg-violet-700/80 text-white';
    return 'bg-violet-700 dark:bg-violet-600 text-white font-black';
  };

  const trendSymbol = (t) => {
    const m = { increasing: { s: '↑↑', c: 'text-red-500' }, decreasing: { s: '↓', c: 'text-green-500' }, stable: { s: '—', c: 'text-gray-400' }, emerged: { s: '★', c: 'text-purple-500' } };
    return m[t] || m.stable;
  };

  if (loading && !topicFrequency) {
    return <div className="flex justify-center py-24"><div className="relative w-14 h-14"><div className="absolute inset-0 rounded-full border-[3px] border-violet-200 dark:border-violet-800" /><div className="absolute inset-0 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" /></div></div>;
  }

  if (!topicFrequency || topics.length === 0) {
    return <div className="bg-white dark:bg-secondary-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-secondary-700 p-14 text-center"><Target className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{L('No data','कोई डेटा नहीं')}</p></div>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-3.5 shadow-sm">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-secondary-700/50 rounded-xl p-0.5">
          {['chapter','topic'].map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${level === l ? 'bg-white dark:bg-secondary-600 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-gray-500 dark:text-secondary-400'}`}>
              {l === 'chapter' ? L('Chapter','अध्याय') : L('Topic','विषय')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-[11px] bg-white dark:bg-secondary-700 border border-gray-200 dark:border-secondary-600 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-secondary-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer">
            <option value="importance">{L('Importance','महत्व')}</option>
            <option value="total">{L('Total','कुल')}</option>
            <option value="consistency">{L('Consistency','निरंतरता')}</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)}
            className="text-[11px] bg-white dark:bg-secondary-700 border border-gray-200 dark:border-secondary-600 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-secondary-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer">
            <option value="all">{L('All Units','सभी')}</option>
            {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] text-gray-400 font-medium">{L('Low','कम')}</span>
          {[0,1,2,4,6].map(v => <div key={v} className={`w-4 h-4 rounded-md ${cellStyle(v)}`} />)}
          <span className="text-[9px] text-gray-400 font-medium">{L('High','अधिक')}</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50/90 dark:bg-secondary-700/50 backdrop-blur-sm">
                <th className="text-left px-4 py-3 font-bold text-gray-500 dark:text-secondary-400 min-w-[200px] sticky left-0 bg-gray-50/90 dark:bg-secondary-700/50 z-20 backdrop-blur-sm">{L('Topic','विषय')}</th>
                {yearLabels.map((y, i) => (
                  <th key={i} className="text-center px-1.5 py-3 font-bold text-gray-500 dark:text-secondary-400 min-w-[52px]">
                    <span className="text-[9px] leading-tight block">{y.replace(/ - Paper.*$/,'').substring(0,14)}</span>
                  </th>
                ))}
                <th className="text-center px-3 py-3 font-bold text-gray-500 dark:text-secondary-400 min-w-[45px]">{L('Total','कुल')}</th>
                <th className="text-center px-3 py-3 font-bold text-gray-500 dark:text-secondary-400 min-w-[50px]">{L('Score','स्कोर')}</th>
                <th className="text-center px-2 py-3 font-bold text-gray-500 dark:text-secondary-400 min-w-[35px]"></th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t, ti) => {
                const trend = trendSymbol(t.trend);
                return (
                  <tr key={ti} className="border-b border-gray-50/80 dark:border-secondary-700/20 hover:bg-violet-50/20 dark:hover:bg-violet-900/5 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-white dark:bg-secondary-800 z-10 border-r border-gray-50 dark:border-secondary-700/30">
                      <p className="font-bold text-gray-800 dark:text-white truncate text-[11px] max-w-[200px]">{t.chapter}</p>
                      {t.topic && <p className="text-[9px] text-gray-400 dark:text-secondary-500 truncate max-w-[200px]">{t.topic}</p>}
                      <p className="text-[8px] text-violet-500/70 dark:text-violet-400/60 font-bold mt-0.5">{t.unitId}</p>
                    </td>
                    {t.yearCounts.map((c, yi) => (
                      <td key={yi} className="text-center px-1.5 py-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto text-[10px] font-bold transition-all hover:scale-110 ${cellStyle(c)}`}>
                          {c || '·'}
                        </div>
                      </td>
                    ))}
                    <td className="text-center px-3 py-2.5">
                      <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{t.totalCount}</span>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      <div className={`inline-flex items-center justify-center w-9 h-7 rounded-lg text-[10px] font-black ${
                        t.importanceScore >= 70 ? 'bg-red-100 dark:bg-red-900/25 text-red-600 dark:text-red-400'
                        : t.importanceScore >= 40 ? 'bg-amber-100 dark:bg-amber-900/25 text-amber-600 dark:text-amber-400'
                        : 'bg-gray-100 dark:bg-secondary-700/50 text-gray-500 dark:text-secondary-400'
                      }`}>{t.importanceScore}</div>
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <span className={`text-sm font-black ${trend.c}`}>{trend.s}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TopicHeatmap;