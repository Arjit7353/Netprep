import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ripple = true,
  tooltip,
  badge,
  badgeColor = 'red',
  pulse = false,
  glow = false,
  rounded = false,
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white border-transparent focus:ring-primary-500 dark:focus:ring-primary-400 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 border-gray-300 focus:ring-gray-500 dark:bg-secondary-700 dark:hover:bg-secondary-600 dark:active:bg-secondary-500 dark:text-secondary-200 dark:border-secondary-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border-transparent focus:ring-emerald-500 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-transparent focus:ring-red-500 shadow-sm hover:shadow-md',
    warning: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white border-transparent focus:ring-amber-500',
    outline: 'bg-transparent hover:bg-gray-50 active:bg-gray-100 text-gray-700 border-gray-300 focus:ring-primary-500 dark:hover:bg-secondary-800 dark:active:bg-secondary-700 dark:text-secondary-200 dark:border-secondary-600',
    outlinePrimary: 'bg-transparent hover:bg-primary-50 active:bg-primary-100 text-primary-600 border-primary-600 focus:ring-primary-500 dark:hover:bg-primary-950 dark:text-primary-400 dark:border-primary-500',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 border-transparent focus:ring-gray-500 dark:hover:bg-secondary-700 dark:active:bg-secondary-600 dark:text-secondary-200',
    link: 'bg-transparent hover:underline text-primary-600 border-transparent p-0 dark:text-primary-400',
    gradient: 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white border-transparent shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30',
    glass: 'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/20 shadow-lg',
    neon: 'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-400 dark:hover:text-secondary-900 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]',
  };

  const sizes = {
    '2xs': 'px-1.5 py-0.5 text-[10px] gap-1',
    xs: 'px-2.5 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
    xl: 'px-6 py-3 text-lg gap-2.5',
    '2xl': 'px-8 py-4 text-xl gap-3',
  };

  const iconSizes = {
    '2xs': 'w-2.5 h-2.5',
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6',
  };

  const badgeColors = {
    red: 'bg-red-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    yellow: 'bg-amber-500',
    purple: 'bg-purple-500',
  };

  // Ripple effect
  const handleClick = (e) => {
    if (disabled || loading) return;
    if (ripple && btnRef.current && variant !== 'link') {
      const rect = btnRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    }
    if (onClick) onClick(e);
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      title={tooltip}
      className={`
        relative inline-flex items-center justify-center
        font-medium border transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-secondary-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        active:scale-[0.97] overflow-hidden
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${glow ? 'animate-pulse-slow' : ''}
        ${pulse ? 'animate-bounce-in' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
          style={{
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            animation: 'ripple 0.6s ease-out forwards',
          }}
        />
      ))}

      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin flex-shrink-0`} />
      )}

      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={`${iconSizes[size]} flex-shrink-0`} />
      )}

      {children && <span className="truncate">{children}</span>}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`${iconSizes[size]} flex-shrink-0`} />
      )}

      {/* Badge */}
      {badge !== undefined && (
        <span className={`absolute -top-1.5 -right-1.5 ${badgeColors[badgeColor]} text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm ring-2 ring-white dark:ring-secondary-800`}>
          {badge}
        </span>
      )}

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(20); opacity: 0; }
        }
      `}</style>
    </button>
  );
};

export default Button;