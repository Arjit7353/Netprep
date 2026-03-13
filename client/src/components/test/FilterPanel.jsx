import React, { useState, useEffect } from 'react';
import {
  Search, X, ChevronDown, RotateCcw, BookOpen, Layers,
  Target, Hash, LayoutGrid, AlignJustify
} from 'lucide-react';
import { TEST_TYPE_CONFIG } from '../../utils/constants';

const FilterPanel = ({
  filters, updateFilter, clearFilters, hasActiveFilters,
  filterOptions, language = 'en', viewMode, setViewMode,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== filters.search) updateFilter('search', localSearch);
    }, 400);
    return () => clearTimeout(t);
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

  const SelectField = ({ value, onChange, options, placeholder, className = '' }) => (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer hover:border-gray-300 dark:hover:border-gray-500 transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) =>
          typeof opt === 'string' ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
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
          placeholder={language === 'hi' ? 'नाम, अध्याय, विषय से खोजें...' : 'Search tests by name, chapter, topic...'}
          className="w-full pl-12 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-sm"
        />
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch('');
              updateFilter('search', '');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          value={filters.paper}
          onChange={(v) => updateFilter('paper', v)}
          placeholder={language === 'hi' ? 'सभी पेपर' : 'All Papers'}
          options={[
            { value: 'paper1', label: language === 'hi' ? 'पेपर 1' : 'Paper 1' },
            { value: 'paper2', label: language === 'hi' ? 'पेपर 2' : 'Paper 2' },
          ]}
          className="w-36"
        />

        {units.length > 0 && (
          <SelectField
            value={filters.unit}
            onChange={(v) => updateFilter('unit', v)}
            placeholder={language === 'hi' ? 'सभी इकाई' : 'All Units'}
            options={units}
            className="w-48 max-w-[220px]"
          />
        )}

        {filters.unit && chapters.length > 0 && (
          <SelectField
            value={filters.chapter}
            onChange={(v) => updateFilter('chapter', v)}
            placeholder={language === 'hi' ? 'सभी अध्याय' : 'All Chapters'}
            options={chapters}
            className="w-48 max-w-[220px]"
          />
        )}

        <SelectField
          value={filters.testType}
          onChange={(v) => updateFilter('testType', v)}
          placeholder={language === 'hi' ? 'सभी प्रकार' : 'All Types'}
          options={Object.entries(TEST_TYPE_CONFIG).map(([k, c]) => ({
            value: k,
            label: `${c.shortCode} - ${language === 'hi' ? c.nameHi : c.name}`,
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
            { value: 'createdAt-desc', label: language === 'hi' ? 'नवीनतम' : 'Newest' },
            { value: 'createdAt-asc', label: language === 'hi' ? 'पुराने' : 'Oldest' },
            { value: 'title-asc', label: 'A → Z' },
            { value: 'totalQuestions-desc', label: language === 'hi' ? 'अधिक प्रश्न' : 'Most Qs' },
            { value: 'totalAttempts-desc', label: language === 'hi' ? 'अधिक प्रयास' : 'Most Played' },
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

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {language === 'hi' ? 'साफ़ करें' : 'Clear'}
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
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