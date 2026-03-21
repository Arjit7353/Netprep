import React from 'react';

const FloatingActionButton = ({
  onClick,
  icon: Icon,
  label,
  variant = 'primary',
  position = 'bottom-right',
  size = 'md',
  pulse = false
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-24 right-6',
    'bottom-left': 'bottom-24 left-6',
    'top-right': 'top-24 right-6'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-primary-500/40',
    success: 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/40',
    danger: 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/40',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/40'
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  const iconSizes = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-7 h-7' };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-40
        ${sizeClasses[size]} rounded-2xl text-white
        ${variantClasses[variant]}
        shadow-xl hover:shadow-2xl
        transform hover:scale-105 active:scale-95
        transition-all duration-300 group
      `}
      title={label}
      aria-label={label}
    >
      {pulse && (
        <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-white" />
      )}
      <Icon className={iconSizes[size]} />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
        {label}
      </span>
    </button>
  );
};

export default FloatingActionButton;