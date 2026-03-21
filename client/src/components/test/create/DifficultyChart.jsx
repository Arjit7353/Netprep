import React, { useMemo } from 'react';
import { BarChart3, Sparkles, Gauge, Flame, Layers } from 'lucide-react';
import GlassCard from './GlassCard';

const DifficultyChart = ({ questions, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  const distribution = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      if (counts.hasOwnProperty(q.difficulty)) counts[q.difficulty]++;
      else counts.medium++;
    });
    return counts;
  }, [questions]);

  const typeDistribution = useMemo(() => {
    const counts = {};
    questions.forEach(q => {
      const t = q.questionType || 'mcq';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const total = questions.length || 1;

  const bars = [
    { key: 'easy', label: t('आसान', 'Easy'), color: 'from-green-400 to-emerald-500', bg: 'bg-green-500', count: distribution.easy, icon: Sparkles },
    { key: 'medium', label: t('मध्यम', 'Medium'), color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500', count: distribution.medium, icon: Gauge },
    { key: 'hard', label: t('कठिन', 'Hard'), color: 'from-red-400 to-rose-500', bg: 'bg-red-500', count: distribution.hard, icon: Flame }
  ];

  return (
    <GlassCard gradient>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          {t('कठिनाई वितरण', 'Difficulty Distribution')}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {total} {t('प्रश्न', 'Q')}
        </span>
      </div>

      {/* Stacked Bar */}
      <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex shadow-inner">
        {bars.map(bar => (
          <div
            key={bar.key}
            className={`bg-gradient-to-r ${bar.color} transition-all duration-700 ease-out relative group`}
            style={{ width: `${(bar.count / total) * 100}%` }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {bar.label}: {bar.count}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-between mt-4">
        {bars.map(bar => (
          <div key={bar.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${bar.bg}`} />
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">{bar.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                ({Math.round((bar.count / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Type Distribution */}
      {Object.keys(typeDistribution).length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5" />
            {t('प्रश्न प्रकार', 'Question Types')}
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeDistribution).map(([type, count]) => (
              <span key={type} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-bold">
                {type.replace(/_/g, ' ').toUpperCase()}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default DifficultyChart;