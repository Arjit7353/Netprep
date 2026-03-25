import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  RotateCcw,
  ChevronDown,
  Search
} from 'lucide-react';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import { 
  QUESTION_TYPE_LABELS, 
  DIFFICULTY_LABELS, 
  PAPER_LABELS 
} from '../../utils/constants';

const QuestionFilter = forwardRef(({
  filters,
  onFilterChange,
  onReset,
  syllabus,
  language = 'hi',
  showAdvanced = false
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(showAdvanced);
  const [localFilters, setLocalFilters] = useState(filters || {});

  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    
    if (key === 'paper') {
      newFilters.unit = '';
      newFilters.chapter = '';
      newFilters.topic = '';
    } else if (key === 'unit') {
      newFilters.chapter = '';
      newFilters.topic = '';
    } else if (key === 'chapter') {
      newFilters.topic = '';
    }
    
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getUnits = () => {
    if (!syllabus || !localFilters.paper) return [];
    const paperSyllabus = syllabus[localFilters.paper];
    if (!paperSyllabus?.units) return [];
    return paperSyllabus.units.map(unit => ({
      value: unit.name,
      label: unit.name,
      labelHi: unit.nameHi
    }));
  };

  const getChapters = () => {
    if (!syllabus || !localFilters.paper || !localFilters.unit) return [];
    const paperSyllabus = syllabus[localFilters.paper];
    const unit = paperSyllabus?.units?.find(u => u.name === localFilters.unit);
    if (!unit?.chapters) return [];
    return unit.chapters.map(ch => ({
      value: ch.name,
      label: ch.name,
      labelHi: ch.nameHi
    }));
  };

  const getTopics = () => {
    if (!syllabus || !localFilters.paper || !localFilters.unit || !localFilters.chapter) return [];
    const paperSyllabus = syllabus[localFilters.paper];
    const unit = paperSyllabus?.units?.find(u => u.name === localFilters.unit);
    const chapter = unit?.chapters?.find(c => c.name === localFilters.chapter);
    if (!chapter?.topics) return [];
    return chapter.topics.map(t => ({
      value: t.name,
      label: t.name,
      labelHi: t.nameHi
    }));
  };

  const questionTypeOptions = Object.entries(QUESTION_TYPE_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelHi: labels.hi
  }));

  const difficultyOptions = Object.entries(DIFFICULTY_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelHi: labels.hi
  }));

  const paperOptions = Object.entries(PAPER_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelHi: labels.hi
  }));

  const activeFilterCount = Object.values(localFilters).filter(v => v && v !== '').length;

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
          </h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleReset}
            >
              {language === 'hi' ? 'रीसेट' : 'Reset'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={ChevronDown}
            iconPosition="right"
            onClick={() => setIsExpanded(!isExpanded)}
            className={isExpanded ? 'rotate-180-icon' : ''}
          >
            {isExpanded 
              ? (language === 'hi' ? 'कम' : 'Less')
              : (language === 'hi' ? 'अधिक' : 'More')
            }
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-secondary-500" />
        <input
          ref={ref}
          type="text"
          value={localFilters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder={language === 'hi' ? 'प्रश्न खोजें...' : 'Search questions...'}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg 
                     bg-white dark:bg-secondary-900 text-gray-900 dark:text-white 
                     placeholder-gray-400 dark:placeholder-secondary-500
                     focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 
                     dark:focus:border-primary-400 dark:focus:ring-primary-400 transition-colors"
        />
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Dropdown
          label={language === 'hi' ? 'पेपर' : 'Paper'}
          value={localFilters.paper || ''}
          options={paperOptions}
          onChange={(value) => handleChange('paper', value)}
          placeholder="All Papers"
          placeholderHi="सभी पेपर"
          language={language}
        />

        <Dropdown
          label={language === 'hi' ? 'प्रश्न प्रकार' : 'Question Type'}
          value={localFilters.questionType || ''}
          options={questionTypeOptions}
          onChange={(value) => handleChange('questionType', value)}
          placeholder="All Types"
          placeholderHi="सभी प्रकार"
          language={language}
          searchable
        />

        <Dropdown
          label={language === 'hi' ? 'कठिनाई' : 'Difficulty'}
          value={localFilters.difficulty || ''}
          options={difficultyOptions}
          onChange={(value) => handleChange('difficulty', value)}
          placeholder="All Levels"
          placeholderHi="सभी स्तर"
          language={language}
        />

        <Dropdown
          label={language === 'hi' ? 'इकाई' : 'Unit'}
          value={localFilters.unit || ''}
          options={getUnits()}
          onChange={(value) => handleChange('unit', value)}
          placeholder="All Units"
          placeholderHi="सभी इकाइयां"
          language={language}
          searchable
          disabled={!localFilters.paper}
        />
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-secondary-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Dropdown
              label={language === 'hi' ? 'अध्याय' : 'Chapter'}
              value={localFilters.chapter || ''}
              options={getChapters()}
              onChange={(value) => handleChange('chapter', value)}
              placeholder="All Chapters"
              placeholderHi="सभी अध्याय"
              language={language}
              searchable
              disabled={!localFilters.unit}
            />

            <Dropdown
              label={language === 'hi' ? 'विषय' : 'Topic'}
              value={localFilters.topic || ''}
              options={getTopics()}
              onChange={(value) => handleChange('topic', value)}
              placeholder="All Topics"
              placeholderHi="सभी विषय"
              language={language}
              searchable
              disabled={!localFilters.chapter}
            />

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'से तारीख' : 'From Date'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-secondary-500" />
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg 
                             bg-white dark:bg-secondary-900 text-gray-900 dark:text-white 
                             focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'तक तारीख' : 'To Date'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-secondary-500" />
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg 
                             bg-white dark:bg-secondary-900 text-gray-900 dark:text-white 
                             focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Source & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'स्रोत' : 'Source'}
              </label>
              <input
                type="text"
                value={localFilters.source || ''}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: PYQ-2023' : 'e.g., PYQ-2023'}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg 
                           bg-white dark:bg-secondary-900 text-gray-900 dark:text-white 
                           placeholder-gray-400 dark:placeholder-secondary-500
                           focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'वर्ष' : 'Year'}
              </label>
              <input
                type="text"
                value={localFilters.year || ''}
                onChange={(e) => handleChange('year', e.target.value)}
                placeholder={language === 'hi' ? 'जैसे: 2023' : 'e.g., 2023'}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg 
                           bg-white dark:bg-secondary-900 text-gray-900 dark:text-white 
                           placeholder-gray-400 dark:placeholder-secondary-500
                           focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

QuestionFilter.displayName = 'QuestionFilter';

export default QuestionFilter;