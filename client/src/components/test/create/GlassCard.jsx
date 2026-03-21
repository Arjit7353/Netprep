import React from 'react';

const GlassCard = ({
  children,
  className = '',
  gradient = false,
  hover = true,
  onClick,
  glow = false,
  border = true,
  padding = 'p-6',
  animate = false,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-white/80 dark:bg-gray-900/80',
    elevated: 'bg-white/90 dark:bg-gray-900/90',
    subtle: 'bg-white/60 dark:bg-gray-900/60',
    solid: 'bg-white dark:bg-gray-900'
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        ${variants[variant]}
        backdrop-blur-xl
        ${border ? 'border border-gray-200/50 dark:border-gray-700/50' : ''}
        shadow-xl shadow-gray-200/30 dark:shadow-black/30
        ${hover ? 'hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 hover:-translate-y-0.5 transition-all duration-300' : 'transition-all duration-300'}
        ${glow ? 'ring-2 ring-primary-500/20 dark:ring-primary-400/30' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${animate ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''}
        ${padding}
        ${className}
      `}
    >
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 dark:from-primary-500/10 dark:to-purple-500/10 pointer-events-none" />
      )}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
};

export default GlassCard;