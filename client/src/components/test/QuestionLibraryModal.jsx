// client/src/components/test/QuestionLibraryModal.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  Check,
  CheckCircle2,
  XCircle,
  Filter,
  SortDesc,
  SortAsc,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
  LayoutGrid,
  List,
  Globe,
  Languages,
  Sliders,
  Hash,
  BookOpen,
  Target,
  Layers,
  Zap,
  Star,
  AlertCircle,
  CheckCheck,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
  Tag,
  Flame,
  TrendingUp,
  Gauge,
  ChevronsUpDown
} from 'lucide-react';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, PAPER_LABELS } from '../../utils/constants';

// ============================================
// FILTER CHIP COMPONENT
// ============================================
const FilterChip = ({ label, onRemove, color = 'gray' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses[color]}`}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};

// ============================================
// DATE RANGE PICKER COMPONENT
// ============================================
const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  const quickRanges = [
    { label: t('आज', 'Today'), days: 0 },
    { label: t('कल', 'Yesterday'), days: 1 },
    { label: t('7 दिन', '7 Days'), days: 7 },
    { label: t('30 दिन', '30 Days'), days: 30 },
    { label: t('90 दिन', '90 Days'), days: 90 }
  ];

  const applyQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    if (days === 0) {
      start.setHours(0, 0, 0, 0);
    } else if (days === 1) {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(start.getDate() - days);
    }
    onStartChange(start.toISOString().split('T')[0]);
    onEndChange(end.toISOString().split('T')[0]);
  };

  const clearDates = () => {
    onStartChange('');
    onEndChange('');
  };

  return (
    <div className="space-y-3">
      {/* Quick Range Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickRanges.map((range) => (
          <button
            key={range.days}
            type="button"
            onClick={() => applyQuickRange(range.days)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {range.label}
          </button>
        ))}
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={clearDates}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {t('साफ़', 'Clear')}
          </button>
        )}
      </div>
      
      {/* Date Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">
            {t('से', 'From')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">
            {t('तक', 'To')}
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MINI MULTI-SELECT FOR FILTERS
// ============================================
const MiniMultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  language,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const t = (hi, en) => language === 'hi' ? hi : en;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 text-sm
          border-2 rounded-xl transition-all
          ${selected.length > 0 
            ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
          }
          ${isOpen ? 'ring-2 ring-primary-500/20' : ''}
          text-gray-700 dark:text-gray-200
        `}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <span className="truncate">
            {selected.length === 0 
              ? placeholder 
              : `${selected.length} ${t('चुने', 'selected')}`
            }
          </span>
        </div>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              {selected.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-48 overflow-y-auto p-1.5">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm
                    ${isSelected 
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className={`
                    w-4 h-4 border-2 rounded flex items-center justify-center
                    ${isSelected 
                      ? 'bg-primary-600 border-primary-600' 
                      : 'border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="truncate">{option.label}</span>
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-xs text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5 rounded-lg"
              >
                {t('साफ़ करें', 'Clear All')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// QUESTION PREVIEW MODAL
// ============================================
const QuestionPreviewModal = ({ question, isOpen, onClose, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const [previewLang, setPreviewLang] = useState(language);

  if (!isOpen || !question) return null;

  const getQuestionText = () => {
    if (typeof question.question === 'string') return question.question;
    return question.question?.[previewLang] || question.question?.hi || question.question?.en || '';
  };

  const getOptions = () => {
    if (!question.options) return [];
    if (Array.isArray(question.options)) return question.options;
    return question.options?.[previewLang] || question.options?.hi || question.options?.en || [];
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-850">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  {t('प्रश्न पूर्वावलोकन', 'Question Preview')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Q#{question.questionNumber || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setPreviewLang('hi')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    previewLang === 'hi'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang('en')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    previewLang === 'en'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  English
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-semibold">
              {question.paper === 'paper1' ? 'Paper 1' : 'Paper 2'}
            </span>
            {question.unit && (
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-semibold">
                {question.unit}
              </span>
            )}
            {question.chapter && (
              <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-lg font-semibold">
                {question.chapter}
              </span>
            )}
            <span className={`px-2.5 py-1 text-xs rounded-lg font-semibold ${
              question.difficulty === 'easy' 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : question.difficulty === 'hard'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            }`}>
              {DIFFICULTY_LABELS[question.difficulty]?.[previewLang] || question.difficulty}
            </span>
            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg font-semibold">
              {QUESTION_TYPE_LABELS[question.questionType]?.[previewLang] || question.questionType}
            </span>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <p className="text-gray-900 dark:text-white text-base leading-relaxed font-medium">
              {getQuestionText()}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('विकल्प:', 'Options:')}
            </h4>
            {getOptions().map((option, index) => {
              const isCorrect = index === question.correctAnswer;
              return (
                <div
                  key={index}
                  className={`
                    flex items-start gap-3 p-4 rounded-xl border-2 transition-all
                    ${isCorrect 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                    }
                  `}
                >
                  <span className={`
                    w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${isCorrect 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`text-sm pt-1.5 ${isCorrect ? 'text-green-800 dark:text-green-200 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option}
                    {isCorrect && (
                      <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-600" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question.explanation && (question.explanation.hi || question.explanation.en || typeof question.explanation === 'string') && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('व्याख्या:', 'Explanation:')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {typeof question.explanation === 'string' 
                  ? question.explanation 
                  : question.explanation?.[previewLang] || question.explanation?.hi || question.explanation?.en
                }
              </p>
            </div>
          )}

          {/* Created Date */}
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {t('बनाया गया:', 'Created:')} {new Date(question.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('बंद करें', 'Close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// MAIN QUESTION LIBRARY MODAL
// ============================================
const QuestionLibraryModal = ({
  isOpen,
  onClose,
  questions = [],
  questionsLoading,
  selectedQuestions,
  onToggleQuestion,
  onSelectAll,
  onSelectAllFiltered,
  onClearAll,
  onApplyFilters,
  language = 'hi',
  marksPerQuestion = 2,
  // Syllabus helpers
  getUnitOptions,
  getChapterOptions,
  getTopicOptions,
  getTypeOptions,
  mainFilters
}) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLanguage, setDisplayLanguage] = useState(language);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortBy, setSortBy] = useState('newest');
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'selected'

  // Filter states
  const [filters, setFilters] = useState({
    papers: [...(mainFilters?.papers || [])],
    units: [...(mainFilters?.units || [])],
    chapters: [...(mainFilters?.chapters || [])],
    topics: [...(mainFilters?.topics || [])],
    types: [...(mainFilters?.types || [])],
    difficulties: [],
    startDate: '',
    endDate: '',
    isPYQ: null
  });

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters({
        papers: [...(mainFilters?.papers || [])],
        units: [...(mainFilters?.units || [])],
        chapters: [...(mainFilters?.chapters || [])],
        topics: [...(mainFilters?.topics || [])],
        types: [...(mainFilters?.types || [])],
        difficulties: [],
        startDate: '',
        endDate: '',
        isPYQ: null
      });
      setCurrentPage(1);
      setSearchQuery('');
    }
  }, [isOpen, mainFilters]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    // Apply local filters
    if (filters.difficulties.length > 0) {
      result = result.filter(q => filters.difficulties.includes(q.difficulty));
    }

    if (filters.isPYQ === true) {
      result = result.filter(q => q.isPYQ === true);
    } else if (filters.isPYQ === false) {
      result = result.filter(q => !q.isPYQ);
    }

    if (filters.startDate) {
      result = result.filter(q => new Date(q.createdAt) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(q => new Date(q.createdAt) <= endDate);
    }

    // Local search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q => {
        const questionText = (q.question?.hi || q.question?.en || '').toLowerCase();
        const unit = (q.unit || '').toLowerCase();
        const chapter = (q.chapter || '').toLowerCase();
        const topic = (q.topic || '').toLowerCase();
        return questionText.includes(query) || unit.includes(query) || chapter.includes(query) || topic.includes(query);
      });
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'difficulty_asc':
        const diffOrder = { easy: 1, medium: 2, hard: 3 };
        result.sort((a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2));
        break;
      case 'difficulty_desc':
        const diffOrderDesc = { easy: 1, medium: 2, hard: 3 };
        result.sort((a, b) => (diffOrderDesc[b.difficulty] || 2) - (diffOrderDesc[a.difficulty] || 2));
        break;
      default:
        break;
    }

    return result;
  }, [questions, filters, searchQuery, sortBy]);

  // Display questions based on active tab
  const displayQuestions = useMemo(() => {
    return activeTab === 'selected' ? selectedQuestions : filteredQuestions;
  }, [activeTab, selectedQuestions, filteredQuestions]);

  // Pagination
  const totalPages = Math.ceil(displayQuestions.length / itemsPerPage);
  const paginatedQuestions = displayQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.papers.length) count++;
    if (filters.units.length) count++;
    if (filters.chapters.length) count++;
    if (filters.topics.length) count++;
    if (filters.types.length) count++;
    if (filters.difficulties.length) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.isPYQ !== null) count++;
    return count;
  }, [filters]);

  // Update filter helper
  const updateFilter = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Cascade reset
      if (key === 'papers') {
        newFilters.units = [];
        newFilters.chapters = [];
        newFilters.topics = [];
      } else if (key === 'units') {
        newFilters.chapters = [];
        newFilters.topics = [];
      } else if (key === 'chapters') {
        newFilters.topics = [];
      }
      
      return newFilters;
    });
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      papers: [],
      units: [],
      chapters: [],
      topics: [],
      types: [],
      difficulties: [],
      startDate: '',
      endDate: '',
      isPYQ: null
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Apply filters to parent
  const handleApplyFilters = () => {
    const apiFilters = {
      paper: filters.papers,
      unit: filters.units,
      chapter: filters.chapters,
      topic: filters.topics,
      questionType: filters.types,
      difficulty: filters.difficulties,
      startDate: filters.startDate,
      endDate: filters.endDate,
      isPYQ: filters.isPYQ,
      search: searchQuery
    };
    onApplyFilters(apiFilters);
    setCurrentPage(1);
  };

  // Get question display text
  const getQuestionText = (question) => {
    if (typeof question.question === 'string') return question.question;
    return question.question?.[displayLanguage] || question.question?.hi || question.question?.en || '';
  };

  // Difficulty options
  const difficultyOptions = [
    { value: 'easy', label: t('आसान', 'Easy') },
    { value: 'medium', label: t('मध्यम', 'Medium') },
    { value: 'hard', label: t('कठिन', 'Hard') }
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: t('नवीनतम', 'Newest First') },
    { value: 'oldest', label: t('पुराने', 'Oldest First') },
    { value: 'difficulty_asc', label: t('कठिनाई ↑', 'Difficulty ↑') },
    { value: 'difficulty_desc', label: t('कठिनाई ↓', 'Difficulty ↓') }
  ];

  // Items per page options
  const perPageOptions = [10, 15, 20, 30, 50];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
        
        {/* ========== HEADER ========== */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-white dark:from-gray-800 dark:to-gray-850 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-xl text-gray-900 dark:text-white">
                  {t('प्रश्न लाइब्रेरी', 'Question Library')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {displayQuestions.length} {t('प्रश्न', 'questions')}
                  {selectedQuestions.length > 0 && (
                    <span className="ml-2 text-primary-600 dark:text-primary-400 font-semibold">
                      • {selectedQuestions.length} {t('चुने गए', 'selected')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setDisplayLanguage('hi')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    displayLanguage === 'hi'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayLanguage('en')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    displayLanguage === 'en'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  ENG
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ========== SEARCH BAR ========== */}
        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder={t('प्रश्न, इकाई, अध्याय खोजें...', 'Search questions, units, chapters...')}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleApplyFilters}
              className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              {t('खोजें', 'Search')}
            </button>
          </div>
        </div>

        {/* ========== FILTERS BAR ========== */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-4">
          {/* Quick Filters Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Paper Filter */}
            <MiniMultiSelect
              options={Object.entries(PAPER_LABELS).map(([key, val]) => ({
                value: key,
                label: t(val.hi, val.en)
              }))}
              selected={filters.papers}
              onChange={(val) => updateFilter('papers', val)}
              placeholder={t('पेपर', 'Paper')}
              language={language}
              icon={BookOpen}
            />

            {/* Unit Filter */}
            <MiniMultiSelect
              options={getUnitOptions(filters.papers)}
              selected={filters.units}
              onChange={(val) => updateFilter('units', val)}
              placeholder={t('इकाई', 'Unit')}
              language={language}
              icon={Target}
            />

            {/* Difficulty Filter */}
            <MiniMultiSelect
              options={difficultyOptions}
              selected={filters.difficulties}
              onChange={(val) => updateFilter('difficulties', val)}
              placeholder={t('कठिनाई', 'Difficulty')}
              language={language}
              icon={Gauge}
            />

            {/* Question Type Filter */}
            <MiniMultiSelect
              options={getTypeOptions()}
              selected={filters.types}
              onChange={(val) => updateFilter('types', val)}
              placeholder={t('प्रकार', 'Type')}
              language={language}
              icon={Layers}
            />

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-bold flex items-center gap-2 transition-all ${
                showAdvancedFilters || activeFiltersCount > 4
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Sliders className="w-4 h-4" />
              {t('अधिक फ़िल्टर', 'More Filters')}
              {activeFiltersCount > 0 && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('रीसेट', 'Reset')}
              </button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-primary-600' : 'text-gray-400'}`} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <LayoutGrid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-primary-600' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Chapter Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('अध्याय', 'Chapter')}
                  </label>
                  <MiniMultiSelect
                    options={getChapterOptions(filters.units, filters.papers)}
                    selected={filters.chapters}
                    onChange={(val) => updateFilter('chapters', val)}
                    placeholder={t('अध्याय चुनें', 'Select Chapter')}
                    language={language}
                  />
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('विषय', 'Topic')}
                  </label>
                  <MiniMultiSelect
                    options={getTopicOptions(filters.chapters, filters.units, filters.papers)}
                    selected={filters.topics}
                    onChange={(val) => updateFilter('topics', val)}
                    placeholder={t('विषय चुनें', 'Select Topic')}
                    language={language}
                  />
                </div>

                {/* PYQ Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('PYQ स्थिति', 'PYQ Status')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateFilter('isPYQ', filters.isPYQ === true ? null : true)}
                      className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                        filters.isPYQ === true
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 inline mr-1" />
                      PYQ
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFilter('isPYQ', filters.isPYQ === false ? null : false)}
                      className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                        filters.isPYQ === false
                          ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 text-gray-700 dark:text-gray-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Non-PYQ
                    </button>
                  </div>
                </div>

                {/* Date Range */}
                <div className="md:col-span-3">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('निर्माण तिथि', 'Created Date')}
                  </label>
                  <DateRangePicker
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onStartChange={(val) => updateFilter('startDate', val)}
                    onEndChange={(val) => updateFilter('endDate', val)}
                    language={language}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.papers.map(p => (
                <FilterChip
                  key={`paper-${p}`}
                  label={`${t('पेपर', 'Paper')}: ${p === 'paper1' ? 'P1' : 'P2'}`}
                  onRemove={() => updateFilter('papers', filters.papers.filter(x => x !== p))}
                  color="gray"
                />
              ))}
              {filters.difficulties.map(d => (
                <FilterChip
                  key={`diff-${d}`}
                  label={DIFFICULTY_LABELS[d]?.[language] || d}
                  onRemove={() => updateFilter('difficulties', filters.difficulties.filter(x => x !== d))}
                  color={d === 'easy' ? 'green' : d === 'hard' ? 'red' : 'amber'}
                />
              ))}
              {(filters.startDate || filters.endDate) && (
                <FilterChip
                  label={`${filters.startDate || '...'} → ${filters.endDate || '...'}`}
                  onRemove={() => { updateFilter('startDate', ''); updateFilter('endDate', ''); }}
                  color="blue"
                />
              )}
              {filters.isPYQ === true && (
                <FilterChip
                  label="PYQ Only"
                  onRemove={() => updateFilter('isPYQ', null)}
                  color="orange"
                />
              )}
              {filters.isPYQ === false && (
                <FilterChip
                  label="Non-PYQ"
                  onRemove={() => updateFilter('isPYQ', null)}
                  color="gray"
                />
              )}
            </div>
          )}
        </div>

        {/* ========== TABS ========== */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'all' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            {t('सभी प्रश्न', 'All Questions')}
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
              {filteredQuestions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('selected'); setCurrentPage(1); }}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'selected' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('चुने हुए', 'Selected')}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              selectedQuestions.length > 0 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              {selectedQuestions.length}
            </span>
          </button>
        </div>

        {/* ========== QUESTIONS LIST ========== */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800/30">
          {questionsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
                {t('लोड हो रहा है...', 'Loading...')}
              </p>
            </div>
          ) : paginatedQuestions.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">
                {activeTab === 'selected' 
                  ? t('कोई प्रश्न नहीं चुना', 'No questions selected')
                  : t('कोई प्रश्न नहीं मिला', 'No questions found')
                }
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {activeTab === 'selected'
                  ? t('प्रश्न चुनने के लिए "सभी प्रश्न" टैब पर जाएं', 'Go to "All Questions" tab to select')
                  : t('फ़िल्टर बदलकर देखें', 'Try changing filters')
                }
              </p>
            </div>
          ) : viewMode === 'list' ? (
            // List View
            <div className="space-y-2">
              {paginatedQuestions.map((q, idx) => {
                const isSelected = selectedQuestions.some(sq => sq._id === q._id);
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                
                return (
                  <div
                    key={q._id}
                    className={`
                      p-4 rounded-xl border-2 transition-all cursor-pointer group
                      ${isSelected
                        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                      }
                    `}
                    onClick={() => onToggleQuestion(q)}
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                        ${isSelected 
                          ? 'bg-primary-600 border-primary-600' 
                          : 'border-gray-300 dark:border-gray-600'
                        }
                      `}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-bold">
                            #{globalIndex}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-bold">
                            {q.paper === 'paper1' ? 'P1' : 'P2'}
                          </span>
                          {q.unit && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md font-semibold truncate max-w-[100px]">
                              {q.unit}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : q.difficulty === 'hard'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}>
                            {DIFFICULTY_LABELS[q.difficulty]?.[displayLanguage] || q.difficulty}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md font-semibold">
                            {QUESTION_TYPE_LABELS[q.questionType]?.[displayLanguage] || q.questionType}
                          </span>
                          {q.isPYQ && (
                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3" /> PYQ
                            </span>
                          )}
                        </div>

                        {/* Question Text */}
                        <p className="text-gray-800 dark:text-gray-200 text-sm font-medium line-clamp-2">
                          {getQuestionText(q)}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(q.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: '2-digit'
                            })}
                          </span>
                          
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewQuestion(q); }}
                            className="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {t('देखें', 'Preview')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-2 gap-3">
              {paginatedQuestions.map((q, idx) => {
                const isSelected = selectedQuestions.some(sq => sq._id === q._id);
                
                return (
                  <div
                    key={q._id}
                    className={`
                      p-4 rounded-xl border-2 transition-all cursor-pointer group
                      ${isSelected
                        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                    onClick={() => onToggleQuestion(q)}
                  >
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-bold">
                        {q.paper === 'paper1' ? 'P1' : 'P2'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {q.difficulty?.[0]?.toUpperCase()}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
                      {getQuestionText(q)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400">
                        {new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewQuestion(q); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========== PAGINATION ========== */}
        {displayQuestions.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {t('प्रति पृष्ठ:', 'Per page:')}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
                >
                  {perPageOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Page Info */}
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {t('पृष्ठ', 'Page')} {currentPage} / {totalPages || 1}
                <span className="ml-2 text-gray-400">
                  ({(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayQuestions.length)} {t('of', 'of')} {displayQuestions.length})
                </span>
              </span>

              {/* Page Navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsUpDown className="w-4 h-4 rotate-90 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsUpDown className="w-4 h-4 -rotate-90 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== FOOTER ========== */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Selection Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-lg text-primary-600 dark:text-primary-400">{selectedQuestions.length}</strong>
                  {' '}{t('प्रश्न चुने', 'selected')}
                </span>
              </div>
              {selectedQuestions.length > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('कुल:', 'Total:')} {selectedQuestions.length * marksPerQuestion} {t('अंक', 'marks')}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectAllFiltered ? onSelectAllFiltered(paginatedQuestions) : onSelectAll()}
                className="px-4 py-2.5 text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
              >
                {t('सभी चुनें', 'Select All')}
              </button>
              {selectedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  {t('चयन साफ़', 'Clear')}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('रद्द करें', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-primary-500/30 transition-all flex items-center gap-2"
              >
                <CheckCheck className="w-5 h-5" />
                {t('पूर्ण', 'Done')} ({selectedQuestions.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Preview Modal */}
      <QuestionPreviewModal
        question={previewQuestion}
        isOpen={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        language={language}
      />
    </div>,
    document.body
  );
};

export default QuestionLibraryModal;