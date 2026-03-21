import React from 'react';
import { Calendar, X, Clock } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  const quickRanges = [
    { label: t('आज', 'Today'), days: 0 },
    { label: t('कल', 'Yesterday'), days: 1 },
    { label: t('7 दिन', '7 Days'), days: 7 },
    { label: t('30 दिन', '30 Days'), days: 30 },
    { label: t('90 दिन', '90 Days'), days: 90 },
    { label: t('इस साल', 'This Year'), days: 365 },
  ];

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      start.setHours(0, 0, 0, 0);
    } else if (days === 1) {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
    } else {
      start.setDate(start.getDate() - days);
    }
    onStartChange(start.toISOString().split('T')[0]);
    onEndChange(end.toISOString().split('T')[0]);
  };

  const clearDates = () => { onStartChange(''); onEndChange(''); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {quickRanges.map(range => (
          <button
            key={range.days}
            type="button"
            onClick={() => applyQuickRange(range.days)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700
              text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-50
              dark:hover:bg-primary-900/20 hover:text-primary-700
              dark:hover:text-primary-300 transition-all border border-transparent
              hover:border-primary-200 dark:hover:border-primary-800"
          >
            <Clock className="w-3 h-3 inline mr-1" />
            {range.label}
          </button>
        ))}
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={clearDates}
            className="px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-900/20
              text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100
              transition-colors flex items-center gap-1 border border-red-200
              dark:border-red-800"
          >
            <X className="w-3 h-3" /> {t('साफ़', 'Clear')}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">
            {t('से', 'From')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={startDate || ''}
              onChange={e => onStartChange(e.target.value)}
              max={endDate || undefined}
              className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200
                dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700
                text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/20
                focus:border-primary-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-1 block">
            {t('तक', 'To')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={endDate || ''}
              onChange={e => onEndChange(e.target.value)}
              min={startDate || undefined}
              className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-200
                dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700
                text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/20
                focus:border-primary-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;