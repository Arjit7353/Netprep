import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Check, ChevronDown, CheckCircle2, X, Filter } from 'lucide-react';

const MiniMultiSelect = ({ options = [], selected = [], onChange, placeholder, language, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);
  const t = (hi, en) => language === 'hi' ? hi : en;

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Auto-focus search when opened
  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleOption = useCallback((v) => {
    const next = selected.includes(v)
      ? selected.filter(x => x !== v)
      : [...selected, v];
    onChange(next);
  }, [selected, onChange]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const s = searchTerm.toLowerCase();
    return options.filter(o =>
      o.label?.toLowerCase().includes(s) ||
      o.shortName?.toLowerCase().includes(s) ||
      o.value?.toLowerCase().includes(s)
    );
  }, [options, searchTerm]);

  const selectedLabels = useMemo(() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const opt = options.find(o => o.value === selected[0]);
      return opt?.shortName || opt?.label || selected[0];
    }
    return `${selected.length} ${t('चुने', 'selected')}`;
  }, [selected, options, placeholder, t]);

  const handleSelectAll = useCallback(() => {
    onChange(filtered.map(o => o.value));
  }, [filtered, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
    setSearchTerm('');
  }, [onChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm
          border-2 rounded-xl transition-all duration-200
          ${selected.length > 0
            ? 'border-primary-400 dark:border-primary-500 bg-primary-50/80 dark:bg-primary-900/20 ring-2 ring-primary-500/10'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
          }
          ${isOpen ? 'ring-4 ring-primary-500/20 border-primary-500' : ''}
          text-gray-700 dark:text-gray-200`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${selected.length > 0 ? 'text-primary-500' : 'text-gray-400'}`} />}
          <span className="truncate text-left">{selectedLabels}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {selected.length > 0 && (
            <>
              <span className="bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums min-w-[20px] text-center">
                {selected.length}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[280px] bg-white dark:bg-gray-800
          border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[100] overflow-hidden"
          style={{ maxHeight: '360px' }}
        >
          {/* Search */}
          {options.length > 4 && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t('खोजें...', 'Search...')}
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 dark:border-gray-600
                    rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  onClick={e => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto overscroll-contain p-1.5 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500">{t('कोई परिणाम नहीं', 'No results')}</p>
              </div>
            ) : (
              filtered.map(option => {
                const isSel = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={(e) => { e.stopPropagation(); toggleOption(option.value); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer
                      text-sm transition-all duration-150
                      ${isSel
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center
                      flex-shrink-0 transition-all duration-150
                      ${isSel
                        ? 'bg-primary-600 border-primary-600 shadow-sm shadow-primary-500/30'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}>
                      {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block" title={option.label}>
                        {option.label}
                      </span>
                      {option.shortName && option.shortName !== option.label && (
                        <span className="text-[10px] text-gray-400 truncate block">
                          {option.shortName}
                        </span>
                      )}
                    </div>
                    {isSel && <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {filtered.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex items-center
              justify-between bg-gray-50 dark:bg-gray-800/80">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSelectAll(); }}
                className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline
                  px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                {t('सभी चुनें', 'Select All')} ({filtered.length})
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
                  className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline
                    px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {t('साफ़ करें', 'Clear All')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniMultiSelect;