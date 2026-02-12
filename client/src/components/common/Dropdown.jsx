import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Dropdown = ({
  label,
  labelHi,
  value,
  options = [],
  onChange,
  placeholder = 'Select option',
  placeholderHi = 'विकल्प चुनें',
  searchable = false,
  disabled = false,
  error,
  required = false,
  className = '',
  language = 'en'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Get display label for selected value
  const getSelectedLabel = () => {
    const selected = options.find(opt => opt.value === value);
    if (!selected) return language === 'hi' ? placeholderHi : placeholder;
    return language === 'hi' && selected.labelHi ? selected.labelHi : selected.label;
  };

  // Filter options by search term
  const filteredOptions = options.filter(opt => {
    if (!searchTerm) return true;
    const label = (opt.label || '').toLowerCase();
    const labelHi = (opt.labelHi || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return label.includes(search) || labelHi.includes(search);
  });

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {(label || labelHi) && (
        <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
          {language === 'hi' && labelHi ? labelHi : label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-lg border
          text-left text-sm
          transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 dark:bg-secondary-700 text-gray-400 dark:text-secondary-500 cursor-not-allowed' 
            : 'bg-white dark:bg-secondary-800 hover:border-primary-400 dark:hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800'
          }
          ${error 
            ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900' 
            : 'border-gray-300 dark:border-secondary-600'
          }
          ${value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-secondary-400'}
        `}
      >
        <span className="truncate">{getSelectedLabel()}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 dark:text-secondary-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg shadow-lg dark:shadow-2xl max-h-60 overflow-hidden animate-fadeIn">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-secondary-700">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-secondary-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-secondary-400 text-center">
                {language === 'hi' ? 'कोई विकल्प नहीं' : 'No options found'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full flex items-center justify-between
                    px-4 py-2.5 text-sm text-left
                    hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors
                    ${value === option.value ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-secondary-200'}
                  `}
                >
                  <span>
                    {language === 'hi' && option.labelHi ? option.labelHi : option.label}
                  </span>
                  {value === option.value && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;