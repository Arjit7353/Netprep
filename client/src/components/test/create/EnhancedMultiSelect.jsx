import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, X, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';

const COLOR_SCHEMES = {
  primary: {
    badge: 'bg-primary-600 dark:bg-primary-500',
    selected: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-500 dark:border-primary-400',
    checkbox: 'bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500',
    ring: 'ring-primary-500/30 dark:ring-primary-400/30',
    hover: 'hover:bg-primary-50 dark:hover:bg-primary-900/30'
  },
  blue: {
    badge: 'bg-blue-600 dark:bg-blue-500',
    selected: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500 dark:border-blue-400',
    checkbox: 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500',
    ring: 'ring-blue-500/30 dark:ring-blue-400/30',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30'
  },
  green: {
    badge: 'bg-emerald-600 dark:bg-emerald-500',
    selected: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-500 dark:border-emerald-400',
    checkbox: 'bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500',
    ring: 'ring-emerald-500/30 dark:ring-emerald-400/30',
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
  },
  purple: {
    badge: 'bg-purple-600 dark:bg-purple-500',
    selected: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-500 dark:border-purple-400',
    checkbox: 'bg-purple-600 dark:bg-purple-500 border-purple-600 dark:border-purple-500',
    ring: 'ring-purple-500/30 dark:ring-purple-400/30',
    hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/30'
  },
  orange: {
    badge: 'bg-orange-600 dark:bg-orange-500',
    selected: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-500 dark:border-orange-400',
    checkbox: 'bg-orange-600 dark:bg-orange-500 border-orange-600 dark:border-orange-500',
    ring: 'ring-orange-500/30 dark:ring-orange-400/30',
    hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/30'
  }
};

const EnhancedMultiSelect = ({
  label, labelHi, options, selected, onChange,
  disabled = false, placeholder, placeholderHi,
  showSearch = false, maxDisplay = 2,
  icon: Icon, language = 'hi', colorScheme = 'primary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const t = (hi, en) => language === 'hi' ? hi : en;
  const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.primary;

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 350;
    const openAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;
    setDropdownPosition({
      top: openAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 320),
      openAbove
    });
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updateDropdownPosition();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);

  const toggleOption = (value, e) => {
    e.stopPropagation();
    const newSelected = selected.includes(value) ? selected.filter(i => i !== value) : [...selected, value];
    onChange(newSelected);
  };
  const selectAll = (e) => { e.stopPropagation(); onChange(options.map(o => o.value)); };
  const clearAll = (e) => { e.stopPropagation(); onChange([]); };

  const filteredOptions = options.filter(o => (o.label || '').toLowerCase().includes((searchTerm || '').toLowerCase()));

  const getDisplayText = () => {
    if (selected.length === 0) return t(placeholderHi, placeholder) || t(labelHi, label);
    if (selected.length <= maxDisplay) {
      return selected.map(val => {
        const opt = options.find(o => o.value === val);
        return opt?.shortName || opt?.label?.split(':').pop()?.trim() || val;
      }).join(', ');
    }
    return `${selected.length} ${t('चुने गए', 'selected')}`;
  };

  const dropdownContent = isOpen && createPortal(
    <div ref={dropdownRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ top: dropdownPosition.top, left: dropdownPosition.left, width: dropdownPosition.width, zIndex: 99999, maxHeight: '340px' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="sticky top-0 p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 z-10">
        {showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('खोजें...', 'Search...')}
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 transition-all"
              onClick={e => e.stopPropagation()} autoFocus
            />
            {searchTerm && (
              <button type="button" onClick={e => { e.stopPropagation(); setSearchTerm(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        )}
        <div className="flex justify-between items-center">
          <button type="button" onClick={selectAll}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('सभी चुनें', 'Select All')} ({options.length})
          </button>
          <button type="button" onClick={clearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
            <XCircle className="w-3.5 h-3.5" /> {t('साफ़ करें', 'Clear')}
          </button>
        </div>
      </div>
      <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '240px' }}>
        <div className="p-2 space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {searchTerm ? t('कोई परिणाम नहीं', 'No results') : t('कोई विकल्प नहीं', 'No options')}
              </p>
            </div>
          ) : (
            filteredOptions.map(option => {
              const isSel = selected.includes(option.value);
              return (
                <div key={option.value} onClick={e => toggleOption(option.value, e)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150
                    ${isSel ? `${colors.hover} text-gray-900 dark:text-gray-100 bg-opacity-50` : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'}`}
                >
                  <div className={`w-5 h-5 border-2 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isSel ? colors.checkbox : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                    {isSel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate" title={option.label}>{option.label}</span>
                    {option.shortName && option.shortName !== option.label && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">{option.shortName}</span>
                    )}
                  </div>
                  {isSel && <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="sticky bottom-0 p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{selected.length}</span> / {options.length} {t('चुने गए', 'selected')}
            </span>
            <button type="button" onClick={e => { e.stopPropagation(); setIsOpen(false); }}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
              <Check className="w-3 h-3" /> {t('पूर्ण', 'Done')}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button ref={triggerRef} type="button" onClick={handleToggle} disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700' : 'hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 hover:shadow-md bg-white dark:bg-gray-800'}
          ${selected.length > 0 ? colors.selected : 'border-gray-200 dark:border-gray-700'}
          ${isOpen ? `ring-4 ${colors.ring} border-primary-500 dark:border-primary-400` : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <span className="truncate text-left font-medium">{getDisplayText()}</span>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {selected.length > 0 && (
            <span className={`${colors.badge} text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm`}>{selected.length}</span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {dropdownContent}
    </div>
  );
};

export default EnhancedMultiSelect;