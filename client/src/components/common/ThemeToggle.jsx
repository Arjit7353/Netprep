import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const { isDark, toggleTheme } = useTheme();

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        ${sizes[size]}
        flex items-center gap-2 font-medium 
        border border-gray-300 dark:border-secondary-600
        rounded-lg 
        bg-white dark:bg-secondary-800
        hover:bg-gray-50 dark:hover:bg-secondary-700
        transition-all duration-200
        text-gray-700 dark:text-secondary-200
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {isDark ? (
        <>
          <Sun className={`${iconSizes[size]} text-yellow-400`} />
          {showLabel && <span className="hidden sm:inline">Light</span>}
        </>
      ) : (
        <>
          <Moon className={`${iconSizes[size]} text-blue-500`} />
          {showLabel && <span className="hidden sm:inline">Dark</span>}
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
