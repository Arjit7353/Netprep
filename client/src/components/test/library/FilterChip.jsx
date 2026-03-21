import React from 'react';
import { X } from 'lucide-react';

const COLOR_MAP = {
  gray:   'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  blue:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  green:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  red:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  amber:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
};

const FilterChip = ({ label, onRemove, color = 'gray' }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border
    ${COLOR_MAP[color] || COLOR_MAP.gray} transition-all hover:shadow-sm`}>
    <span className="truncate max-w-[150px]">{label}</span>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors ml-0.5"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default FilterChip;