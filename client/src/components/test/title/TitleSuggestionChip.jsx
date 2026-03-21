import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const COLORS = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-red-500'
];

const TitleSuggestionChip = ({ suggestion, onSelect, isSelected, index }) => (
  <button
    type="button"
    onClick={() => onSelect(suggestion)}
    className={`group relative px-4 py-3 rounded-xl border-2 text-left transition-all duration-300
      ${isSelected
        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
      }`}
  >
    <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white bg-gradient-to-br ${COLORS[index % COLORS.length]} shadow-lg group-hover:scale-110 transition-transform`}>
      {index + 1}
    </div>
    <p className={`text-sm font-medium pr-6 leading-relaxed ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
      {suggestion}
    </p>
    <div className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100'}`}>
      {isSelected ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
    </div>
  </button>
);

export default TitleSuggestionChip;