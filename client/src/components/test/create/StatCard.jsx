import React from 'react';
import GlassCard from './GlassCard';
import AnimatedCounter from './AnimatedCounter';
import { TrendingUp } from 'lucide-react';

const GRADIENT_MAP = {
  primary: 'from-primary-500 to-primary-600',
  green: 'from-green-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  orange: 'from-orange-500 to-amber-600',
  red: 'from-red-500 to-rose-600',
  teal: 'from-teal-500 to-cyan-600',
  amber: 'from-amber-500 to-yellow-600'
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color = 'primary',
  gradient,
  suffix = '',
  prefix = '',
  trend,
  compact = false
}) => {
  const grad = GRADIENT_MAP[gradient] || GRADIENT_MAP[color] || GRADIENT_MAP.primary;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-md`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-black text-gray-900 dark:text-white leading-none">
            {typeof value === 'number' ? (
              <AnimatedCounter value={value} color={color} suffix={suffix} prefix={prefix} />
            ) : (
              <span>{prefix}{value}{suffix}</span>
            )}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <GlassCard className="!p-0 overflow-hidden" hover={false}>
      <div className="p-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {typeof value === 'number' ? (
                <AnimatedCounter value={value} color={color} suffix={suffix} prefix={prefix} />
              ) : (
                <span>{prefix}{value}{suffix}</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">{label}</p>
          </div>
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${grad}`} />
    </GlassCard>
  );
};

export default StatCard;