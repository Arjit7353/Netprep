import React from 'react';
import {
  ClipboardList, Play, TrendingUp, Target,
  BarChart3, X, ChevronUp, ChevronDown, Sparkles
} from 'lucide-react';

const QuickStats = ({ stats, language = 'en', onClose, collapsed, onToggle }) => {
  if (!stats) return null;

  const items = [
    {
      label: language === 'hi' ? 'कुल परीक्षाएं' : 'Total Tests',
      value: stats.totalTests || 0,
      icon: ClipboardList,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      border: 'border-blue-200/50 dark:border-blue-800/50',
    },
    {
      label: language === 'hi' ? 'कुल प्रयास' : 'Attempts',
      value: stats.totalAttempts || 0,
      icon: Play,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      border: 'border-green-200/50 dark:border-green-800/50',
    },
    {
      label: language === 'hi' ? 'औसत स्कोर' : 'Avg Score',
      value: `${Math.round(stats.averageScore || 0)}%`,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-violet-500',
      bg: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
      border: 'border-purple-200/50 dark:border-purple-800/50',
    },
    {
      label: language === 'hi' ? 'सटीकता' : 'Accuracy',
      value: `${Math.round(stats.averageAccuracy || 0)}%`,
      icon: Target,
      gradient: 'from-orange-500 to-amber-500',
      bg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
      border: 'border-orange-200/50 dark:border-orange-800/50',
    },
  ];

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex items-center justify-between hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            {language === 'hi' ? 'प्रदर्श��' : 'Performance'}
          </span>
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            {items.map((it, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="font-bold text-gray-700 dark:text-gray-300">{it.value}</span>
              </span>
            ))}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'प्रदर्शन डैशबोर्ड' : 'Performance Dashboard'}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronUp className="w-4 h-4 text-gray-400" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-xl p-3.5 bg-gradient-to-br ${item.bg} border ${item.border} group hover:shadow-md transition-all`}
            >
              <div className={`absolute -top-3 -right-3 w-14 h-14 rounded-full bg-gradient-to-br ${item.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative">
                <div className={`w-9 h-9 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center shadow-md mb-2.5`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                  {item.value}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickStats;