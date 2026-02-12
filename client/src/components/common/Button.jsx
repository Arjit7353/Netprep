import React from 'react';
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
  ...props
}) => {
  // Variant styles
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent focus:ring-primary-500 dark:focus:ring-primary-400',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 focus:ring-gray-500 dark:bg-secondary-700 dark:hover:bg-secondary-600 dark:text-secondary-200 dark:border-secondary-600 dark:focus:ring-secondary-500',
    success: 'bg-green-600 hover:bg-green-700 text-white border-transparent focus:ring-green-500 dark:focus:ring-green-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500 dark:focus:ring-red-400',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent focus:ring-yellow-500 dark:focus:ring-yellow-400',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-primary-500 dark:hover:bg-secondary-800 dark:text-secondary-200 dark:border-secondary-600 dark:focus:ring-primary-400',
    outlinePrimary: 'bg-transparent hover:bg-primary-50 text-primary-600 border-primary-600 focus:ring-primary-500 dark:hover:bg-primary-950 dark:text-primary-400 dark:border-primary-500 dark:focus:ring-primary-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-gray-500 dark:hover:bg-secondary-700 dark:text-secondary-200 dark:focus:ring-secondary-500',
    link: 'bg-transparent hover:underline text-primary-600 border-transparent p-0 dark:text-primary-400'
  };

  // Size styles
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-lg'
  };

  // Icon sizes
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-secondary-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 className={`${iconSizes[size]} animate-spin ${children ? 'mr-2' : ''}`} />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={`${iconSizes[size]} ${children ? 'mr-2' : ''}`} />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`${iconSizes[size]} ${children ? 'ml-2' : ''}`} />
      )}
    </button>
  );
};

export default Button;