import React, { useState, useEffect } from 'react';
import {
  Search, X, ChevronDown, RotateCcw, BookOpen, Layers,
  Target, Hash, LayoutGrid, AlignJustify, Star, Calendar,
  ScrollText
} from 'lucide-react';
import { TEST_TYPE_CONFIG } from '../../utils/constants';

const FilterPanel = ({
  filters, updateFilter, clearFilters, hasActiveFilters,
  filterOptions, language = 'en', viewMode, setViewMode,
  pyqYears = [], pyqSessions = [],
}) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) updateFilter('search', localSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch]);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const units = (filterOptions?.countsByUnit || [])
    .filter((u) => !filters.paper || u.paper === filters.paper)
    .map((u) => u.unit)
    .filter((u) => u && u.trim())
    .sort((a, b) => {
      const nA = parseInt((a.match(/\d+/) || ['999'])[0]);
      const nB = parseInt((b.match(/\d+/) || ['999'])[0]);
      return nA - nB;
    });

  const chapters = (filterOptions?.chapters || []).filter(Boolean).sort();

  // Check if PYQ type is selected or PYQ filters are active
  const isPYQContext = filters.testType === 'pyq_year' || filters.pyqYear || filters.pyqSession;

  // Check if any PYQ filter is active
  const hasPYQFilters = !!(filters.pyqYear || filters.pyqSession);

  // Combined active filter check
  const hasAnyActive = hasActiveFilters || hasPYQFilters;

  const SelectField = ({ value, onChange, options, placeholder, className = '', icon: Icon = null }) => (
    <div className={`relative ${className}`}>
      {Icon && <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none z-10" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none w-full ${Icon ? 'pl-8' : 'pl-3'} pr-8 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-all`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>{opt}</option>
          ) : (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t('नाम, अध्याय, विषय, PYQ वर्ष से खोजें...', 'Search by name, chapter, topic, PYQ year...')}
          className="w-full pl-12 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
        />
        {localSearch && (
          <button
            onClick={() => { setLocalSearch(''); updateFilter('search', ''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          value={filters.paper}
          onChange={(v) => updateFilter('paper', v)}
          placeholder={t('सभी पेपर', 'All Papers')}
          icon={BookOpen}
          options={[
            { value: 'paper1', label: t('पेपर 1', 'Paper 1') },
            { value: 'paper2', label: t('पेपर 2', 'Paper 2') },
          ]}
          className="w-36"
        />

        {units.length > 0 && (
          <SelectField
            value={filters.unit}
            onChange={(v) => updateFilter('unit', v)}
            placeholder={t('सभी इकाई', 'All Units')}
            icon={Layers}
            options={units}
            className="w-48 max-w-[220px]"
          />
        )}

        {filters.unit && chapters.length > 0 && (
          <SelectField
            value={filters.chapter}
            onChange={(v) => updateFilter('chapter', v)}
            placeholder={t('सभी अध्याय', 'All Chapters')}
            icon={Hash}
            options={chapters}
            className="w-48 max-w-[220px]"
          />
        )}

        <SelectField
          value={filters.testType}
          onChange={(v) => updateFilter('testType', v)}
          placeholder={t('सभी प्रकार', 'All Types')}
          icon={Target}
          options={Object.entries(TEST_TYPE_CONFIG).map(([k, c]) => ({
            value: k,
            label: `${c.shortCode} - ${t(c.nameHi, c.name)}`,
          }))}
          className="w-52"
        />

        <SelectField
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(v) => {
            const [b, o] = v.split('-');
            updateFilter('sortBy', b);
            setTimeout(() => updateFilter('sortOrder', o), 0);
          }}
          placeholder="Sort"
          options={[
            { value: 'createdAt-desc', label: t('नवीनतम', 'Newest') },
            { value: 'createdAt-asc', label: t('पुराने', 'Oldest') },
            { value: 'title-asc', label: 'A → Z' },
            { value: 'totalQuestions-desc', label: t('अधिक प्रश्न', 'Most Qs') },
            { value: 'totalAttempts-desc', label: t('अधिक प्रयास', 'Most Played') },
          ]}
          className="w-36"
        />

        <div className="flex-1" />

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {hasAnyActive && (
          <button
            onClick={() => {
              clearFilters();
              if (updateFilter) {
                updateFilter('pyqYear', '');
                updateFilter('pyqSession', '');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('साफ़ करें', 'Clear')}
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          PYQ FILTER ROW — Always visible, highlighted when active
         ═══════════════════════════════════════════════════ */}
      {(pyqYears.length > 0 || pyqSessions.length > 0) && (
        <div className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl border transition-all ${
          hasPYQFilters
            ? 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
            : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700/50'
        }`}>
          {/* PYQ Label */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              hasPYQFilters
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <Star className={`w-3.5 h-3.5 ${hasPYQFilters ? 'text-white fill-current' : 'text-gray-500'}`} />
            </div>
            <span className={`text-xs font-bold ${
              hasPYQFilters ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500'
            }`}>
              PYQ
            </span>
          </div>

          {/* PYQ Year */}
          {pyqYears.length > 0 && (
            <SelectField
              value={filters.pyqYear || ''}
              onChange={(v) => updateFilter('pyqYear', v)}
              placeholder={t('सभी PYQ वर्ष', 'All PYQ Years')}
              icon={Calendar}
              options={pyqYears.map(y => ({
                value: typeof y === 'string' ? y : y.year || y,
                label: typeof y === 'string' ? y : y.displayLabel || y.year || y
              }))}
              className="w-44"
            />
          )}

          {/* PYQ Session */}
          {pyqSessions.length > 0 && (
            <SelectField
              value={filters.pyqSession || ''}
              onChange={(v) => updateFilter('pyqSession', v)}
              placeholder={t('सभी PYQ सत्र', 'All PYQ Sessions')}
              icon={ScrollText}
              options={pyqSessions.map(s => ({
                value: typeof s === 'string' ? s : s.session || s,
                label: typeof s === 'string'
                  ? s.charAt(0).toUpperCase() + s.slice(1)
                  : (s.session || s).toString().charAt(0).toUpperCase() + (s.session || s).toString().slice(1)
              }))}
              className="w-44"
            />
          )}

          {/* Quick PYQ-only filter */}
          <button
            type="button"
            onClick={() => {
              if (filters.testType === 'pyq_year') {
                updateFilter('testType', '');
              } else {
                updateFilter('testType', 'pyq_year');
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
              filters.testType === 'pyq_year'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.testType === 'pyq_year' ? 'fill-current' : ''}`} />
            {t('केवल PYQ', 'PYQ Only')}
          </button>

          {/* PYQ filter count */}
          {hasPYQFilters && (
            <button
              onClick={() => {
                updateFilter('pyqYear', '');
                updateFilter('pyqSession', '');
              }}
              className="ml-auto flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              {t('PYQ फ़िल्टर हटाएं', 'Clear PYQ')}
            </button>
          )}
        </div>
      )}

      {/* Active Filter Chips */}
      {hasAnyActive && (
        <div className="flex flex-wrap gap-2">
          {filters.paper && (
            <Chip icon={BookOpen} label={filters.paper === 'paper1' ? 'Paper 1' : 'Paper 2'} color="blue" onRemove={() => updateFilter('paper', '')} />
          )}
          {filters.unit && (
            <Chip icon={Layers} label={filters.unit.replace(/^UNIT\s*/i, 'Unit ')} color="purple" onRemove={() => updateFilter('unit', '')} />
          )}
          {filters.chapter && (
            <Chip icon={Hash} label={filters.chapter} color="green" onRemove={() => updateFilter('chapter', '')} />
          )}
          {filters.testType && (
            <Chip icon={Target} label={TEST_TYPE_CONFIG[filters.testType]?.shortCode || filters.testType} color="orange" onRemove={() => updateFilter('testType', '')} />
          )}
          {filters.search && (
            <Chip icon={Search} label={`"${filters.search}"`} color="gray" onRemove={() => { setLocalSearch(''); updateFilter('search', ''); }} />
          )}
          {/* PYQ Chips */}
          {filters.pyqYear && (
            <Chip icon={Star} label={`PYQ ${filters.pyqYear}`} color="amber" onRemove={() => updateFilter('pyqYear', '')} />
          )}
          {filters.pyqSession && (
            <Chip icon={Calendar} label={`${filters.pyqSession.charAt(0).toUpperCase() + filters.pyqSession.slice(1)}`} color="amber" onRemove={() => updateFilter('pyqSession', '')} />
          )}
        </div>
      )}
    </div>
  );
};

const CHIP_COLORS = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

const Chip = ({ icon: Icon, label, color, onRemove }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${CHIP_COLORS[color]}`}>
    <Icon className="w-3 h-3" />
    <span className="max-w-[140px] truncate">{label}</span>
    <button onClick={onRemove} className="ml-0.5 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full">
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default FilterPanel;