import React from 'react';
import { Check, Sparkles, FileText, Clock, ArrowUpRight } from 'lucide-react';

const GRADIENT_MAP = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  teal: 'from-teal-500 to-teal-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
  gray: 'from-gray-600 to-gray-700'
};

const TestTypeCard = ({ config, typeKey, isSelected, onClick, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const gradient = GRADIENT_MAP[config.color] || GRADIENT_MAP.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group
        ${isSelected
          ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-xl shadow-primary-500/20 scale-[1.02]'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg bg-white dark:bg-gray-800'
        }
      `}
      aria-pressed={isSelected}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20" />
      )}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg z-10">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`
          relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white
          bg-gradient-to-r ${gradient} shadow-lg mb-3
          group-hover:scale-105 transition-transform
        `}
      >
        <Sparkles className="w-3 h-3" />
        {config.shortCode}
      </div>
      <h4
        className={`text-sm font-bold leading-tight mb-2 ${
          isSelected
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-gray-800 dark:text-gray-200'
        }`}
      >
        {t(config.nameHi, config.name)}
      </h4>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {config.defaultQuestions}Q
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {config.defaultDuration}m
        </span>
      </div>
      <div
        className={`
          absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center
          bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500
          opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0
          ${isSelected ? 'opacity-100 translate-x-0 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : ''}
        `}
      >
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </button>
  );
};

export default TestTypeCard;