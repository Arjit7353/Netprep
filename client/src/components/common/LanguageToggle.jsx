import React from 'react';
import { Languages } from 'lucide-react';

const LanguageToggle = ({
  language,
  onChange,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
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

  const toggleLanguage = () => {
    onChange(language === 'hi' ? 'en' : 'hi');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <Languages className={`${iconSizes[size]} text-gray-500`} />
      )}
      
      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        <button
          type="button"
          onClick={() => onChange('hi')}
          className={`
            ${sizes[size]} font-medium transition-colors
            ${language === 'hi' 
              ? 'bg-primary-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          हिंदी
        </button>
        <button
          type="button"
          onClick={() => onChange('en')}
          className={`
            ${sizes[size]} font-medium transition-colors border-l border-gray-300
            ${language === 'en' 
              ? 'bg-primary-600 text-white' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          English
        </button>
      </div>
    </div>
  );
};

// Compact Toggle (single button)
export const LanguageToggleCompact = ({
  language,
  onChange,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={() => onChange(language === 'hi' ? 'en' : 'hi')}
      className={`
        flex items-center gap-2 px-3 py-2 
        bg-white border border-gray-300 rounded-lg
        hover:bg-gray-50 transition-colors
        ${className}
      `}
    >
      <Languages className="w-4 h-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-700">
        {language === 'hi' ? 'हिंदी' : 'English'}
      </span>
    </button>
  );
};

export default LanguageToggle;