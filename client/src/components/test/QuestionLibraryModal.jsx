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
  ChevronsUpDown,
  CircleDot,
  Package,
  Grid3x3
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses[color]} animate-in fade-in zoom-in-95 duration-150`}>
      <span className="truncate max-w-[150px]">{label}</span>
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
// MINI MULTI-SELECT FOR FILTERS (ENHANCED)
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
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef(null);
  const t = (hi, en) => language === 'hi' ? hi : en;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
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

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const search = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label?.toLowerCase().includes(search) || 
      opt.value?.toLowerCase().includes(search)
    );
  }, [options, searchTerm]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 text-sm
          border-2 rounded-xl transition-all
          ${selected.length > 0 
            ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/10' 
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
          }
          ${isOpen ? 'ring-4 ring-primary-500/20' : ''}
          text-gray-700 dark:text-gray-200
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          <span className="truncate">
            {selected.length === 0 
              ? placeholder 
              : selected.length === 1
                ? (options.find(o => o.value === selected[0])?.shortName || options.find(o => o.value === selected[0])?.label || selected[0])
                : `${selected.length} ${t('चुने', 'selected')}`
            }
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {selected.length > 0 && (
            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {selected.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl dark:shadow-black/50 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
          {/* Search */}
          {options.length > 5 && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('खोजें...', 'Search...')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto overscroll-contain p-1.5">
            {filteredOptions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('कोई परिणाम नहीं', 'No results found')}
                </p>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all
                      ${isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <div className={`
                      w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0
                      ${isSelected 
                        ? 'bg-primary-600 border-primary-600' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }
                    `}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="flex-1 truncate" title={option.label}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {filteredOptions.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-750">
              <button
                type="button"
                onClick={() => onChange(filteredOptions.map(o => o.value))}
                className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:underline"
              >
                {t('सभी चुनें', 'Select All')}
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline"
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
      className="fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">
                  {t('प्रश्न पूर्वावलोकन', 'Question Preview')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Q#{question.questionNumber || 'N/A'} • {question.paper === 'paper1' ? 'Paper 1' : 'Paper 2'}
                </p>
              </div>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setPreviewLang('hi')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
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
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] overscroll-contain">
          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {question.unit && (
              <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-bold flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {question.unit}
              </span>
            )}
            {question.chapter && (
              <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-lg font-bold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {question.chapter}
              </span>
            )}
            {question.topic && (
              <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg font-bold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {question.topic}
              </span>
            )}
            <span className={`px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1 ${
              question.difficulty === 'easy' 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : question.difficulty === 'hard'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            }`}>
              {question.difficulty === 'easy' && <Sparkles className="w-3.5 h-3.5" />}
              {question.difficulty === 'hard' && <Flame className="w-3.5 h-3.5" />}
              {question.difficulty === 'medium' && <Gauge className="w-3.5 h-3.5" />}
              {DIFFICULTY_LABELS[question.difficulty]?.[previewLang] || question.difficulty}
            </span>
            <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-lg font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {QUESTION_TYPE_LABELS[question.questionType]?.[previewLang] || question.questionType}
            </span>
            {question.isPYQ && (
              <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                PYQ
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white text-base leading-relaxed font-medium">
              {getQuestionText()}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <CircleDot className="w-4 h-4 text-primary-600" />
              {t('विकल्प:', 'Options:')}
            </h4>
            {getOptions().map((option, index) => {
              const isCorrect = index === question.correctAnswer;
              return (
                <div
                  key={index}
                  className={`
                    relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all
                    ${isCorrect 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md shadow-green-500/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <span className={`
                    w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0
                    ${isCorrect 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`text-sm pt-1.5 flex-1 ${isCorrect ? 'text-green-900 dark:text-green-100 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option}
                  </span>
                  {isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          {question.explanation && (question.explanation.hi || question.explanation.en || typeof question.explanation === 'string') && (
            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-black text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('व्याख्या:', 'Explanation:')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                {typeof question.explanation === 'string' 
                  ? question.explanation 
                  : question.explanation?.[previewLang] || question.explanation?.hi || question.explanation?.en
                }
              </p>
            </div>
          )}

          {/* Created Date */}
          <div className="mt-6 flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {t('बनाया गया:', 'Created:')} <strong>{new Date(question.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}</strong>
            </span>
            {question.updatedAt && question.updatedAt !== question.createdAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {t('अपडेट:', 'Updated:')} <strong>{new Date(question.updatedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <X className="w-4 h-4" />
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
    { value: 'newest', label: t('नवीनतम', 'Newest First'), icon: TrendingUp },
    { value: 'oldest', label: t('पुराने', 'Oldest First'), icon: Clock },
    { value: 'difficulty_asc', label: t('कठिनाई ↑', 'Difficulty ↑'), icon: SortAsc },
    { value: 'difficulty_desc', label: t('कठिनाई ↓', 'Difficulty ↓'), icon: SortDesc }
  ];

  // Items per page options
  const perPageOptions = [10, 15, 20, 30, 50, 100];

  if (!isOpen) return null;

    // ... continuing from Part 1

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
        
        {/* ========== HEADER ========== */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-base sm:text-xl text-gray-900 dark:text-white truncate">
                  {t('प्रश्न लाइब्रेरी', 'Question Library')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {displayQuestions.length} {t('प्रश्न', 'questions')}
                  {selectedQuestions.length > 0 && (
                    <span className="ml-2 text-primary-600 dark:text-primary-400 font-bold">
                      • {selectedQuestions.length} {t('चुने', 'selected')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language Toggle - Hidden on mobile */}
              <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setDisplayLanguage('hi')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    displayLanguage === 'hi'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  हि
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayLanguage('en')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    displayLanguage === 'en'
                      ? 'bg-white dark:bg-gray-600 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Languages className="w-3 h-3" />
                  En
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

        {/* ========== SEARCH BAR ========== */}
        <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder={t('प्रश्न, इकाई, अध्याय खोजें...', 'Search questions, units, chapters...')}
                className="w-full pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
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
              disabled={questionsLoading}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/30 flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${questionsLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('खोजें', 'Search')}</span>
            </button>
          </div>
        </div>

        {/* ========== FILTERS BAR ========== */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-3">
          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Paper Filter */}
            <div className="w-full sm:w-auto sm:min-w-[140px]">
              <MiniMultiSelect
                options={Object.entries(PAPER_LABELS).map(([key, val]) => ({
                  value: key,
                  label: t(val.hi, val.en),
                  shortName: key === 'paper1' ? 'P1' : 'P2'
                }))}
                selected={filters.papers}
                onChange={(val) => updateFilter('papers', val)}
                placeholder={t('पेपर', 'Paper')}
                language={language}
                icon={BookOpen}
              />
            </div>

            {/* Unit Filter */}
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <MiniMultiSelect
                options={getUnitOptions ? getUnitOptions(filters.papers).map(u => ({
                  ...u,
                  shortName: (u.shortName || u.label || '').substring(0, 20)
                })) : []}
                selected={filters.units}
                onChange={(val) => updateFilter('units', val)}
                placeholder={t('इकाई', 'Unit')}
                language={language}
                icon={Target}
              />
            </div>

            {/* Difficulty Filter */}
            <div className="w-[calc(50%-4px)] sm:w-auto sm:min-w-[130px]">
              <MiniMultiSelect
                options={difficultyOptions}
                selected={filters.difficulties}
                onChange={(val) => updateFilter('difficulties', val)}
                placeholder={t('कठिनाई', 'Difficulty')}
                language={language}
                icon={Gauge}
              />
            </div>

            {/* Question Type Filter */}
            <div className="w-[calc(50%-4px)] sm:w-auto sm:min-w-[130px]">
              <MiniMultiSelect
                options={getTypeOptions ? getTypeOptions() : []}
                selected={filters.types}
                onChange={(val) => updateFilter('types', val)}
                placeholder={t('प्रकार', 'Type')}
                language={language}
                icon={Layers}
              />
            </div>

            {/* Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 sm:px-4 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                showAdvancedFilters || activeFiltersCount > 4
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 bg-white dark:bg-gray-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">{t('अधिक', 'More')}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
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

            {/* Spacer - Hidden on mobile */}
            <div className="hidden sm:block flex-1" />

            {/* Sort Dropdown */}
            <div className="hidden sm:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                title={t('सूची दृश्य', 'List View')}
              >
                <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-primary-600' : 'text-gray-400'}`} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                title={t('ग्रिड दृश्य', 'Grid View')}
              >
                <LayoutGrid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-primary-600' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Chapter Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    {t('अध्याय', 'Chapter')}
                  </label>
                  <MiniMultiSelect
                    options={getChapterOptions ? getChapterOptions(filters.units, filters.papers).map(c => ({
                      ...c,
                      shortName: (c.shortName || c.label || '').substring(0, 25)
                    })) : []}
                    selected={filters.chapters}
                    onChange={(val) => updateFilter('chapters', val)}
                    placeholder={t('अध्याय चुनें', 'Select Chapter')}
                    language={language}
                  />
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    {t('विषय', 'Topic')}
                  </label>
                  <MiniMultiSelect
                    options={getTopicOptions ? getTopicOptions(filters.chapters, filters.units, filters.papers).map(to => ({
                      ...to,
                      shortName: (to.shortName || to.label || '').substring(0, 25)
                    })) : []}
                    selected={filters.topics}
                    onChange={(val) => updateFilter('topics', val)}
                    placeholder={t('विषय चुनें', 'Select Topic')}
                    language={language}
                  />
                </div>

                {/* PYQ Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                    {t('PYQ स्थिति', 'PYQ Status')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateFilter('isPYQ', filters.isPYQ === true ? null : true)}
                      className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 ${
                        filters.isPYQ === true
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      PYQ
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFilter('isPYQ', filters.isPYQ === false ? null : false)}
                      className={`flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                        filters.isPYQ === false
                          ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 text-gray-700 dark:text-gray-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-gray-700'
                      }`}
                    >
                      Non-PYQ
                    </button>
                  </div>
                </div>

                {/* Mobile Sort */}
                <div className="sm:hidden">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                    {t('क्रम', 'Sort')}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range - Full width */}
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
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
            <div className="flex flex-wrap gap-2 pt-2">
              {filters.papers.map(p => (
                <FilterChip
                  key={`paper-${p}`}
                  label={`${t('पेपर', 'Paper')}: ${p === 'paper1' ? 'P1' : 'P2'}`}
                  onRemove={() => updateFilter('papers', filters.papers.filter(x => x !== p))}
                  color="gray"
                />
              ))}
              {filters.units.slice(0, 2).map(u => {
                const unitLabel = getUnitOptions?.(filters.papers)?.find(o => o.value === u)?.shortName || u;
                return (
                  <FilterChip
                    key={`unit-${u}`}
                    label={unitLabel}
                    onRemove={() => updateFilter('units', filters.units.filter(x => x !== u))}
                    color="blue"
                  />
                );
              })}
              {filters.units.length > 2 && (
                <span className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
                  +{filters.units.length - 2} {t('और', 'more')}
                </span>
              )}
              {filters.difficulties.map(d => (
                <FilterChip
                  key={`diff-${d}`}
                  label={DIFFICULTY_LABELS[d]?.[language] || d}
                  onRemove={() => updateFilter('difficulties', filters.difficulties.filter(x => x !== d))}
                  color={d === 'easy' ? 'green' : d === 'hard' ? 'red' : 'amber'}
                />
              ))}
              {filters.types.slice(0, 2).map(ty => (
                <FilterChip
                  key={`type-${ty}`}
                  label={QUESTION_TYPE_LABELS[ty]?.[language] || ty}
                  onRemove={() => updateFilter('types', filters.types.filter(x => x !== ty))}
                  color="purple"
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
            className={`flex-1 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'all' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{t('सभी प्रश्न', 'All Questions')}</span>
            <span className="sm:hidden">{t('सभी', 'All')}</span>
            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-bold">
              {filteredQuestions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('selected'); setCurrentPage(1); }}
            className={`flex-1 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'selected' 
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('चुने हुए', 'Selected')}</span>
            <span className="sm:hidden">{t('चुने', 'Sel')}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              selectedQuestions.length > 0 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {selectedQuestions.length}
            </span>
          </button>
        </div>

        {/* ========== QUESTIONS LIST ========== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/30 overscroll-contain">
          {questionsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin" />
              <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
                {t('लोड हो रहा है...', 'Loading questions...')}
              </p>
            </div>
          ) : paginatedQuestions.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
                {activeTab === 'selected' ? (
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
                ) : (
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">
                {activeTab === 'selected' 
                  ? t('कोई प्रश्न नहीं चुना', 'No questions selected')
                  : t('कोई प्रश्न नहीं मिला', 'No questions found')
                }
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                {activeTab === 'selected'
                  ? t('"सभी प्रश्न" टैब से प्रश्न चुनें', 'Select questions from "All Questions" tab')
                  : t('फ़िल्टर बदलकर या खोज करके देखें', 'Try changing filters or search query')
                }
              </p>
              {activeTab === 'all' && activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  {t('फ़िल्टर साफ़ करें', 'Clear All Filters')}
                </button>
              )}
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
                      p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer group relative
                      ${isSelected
                        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                      }
                    `}
                    onClick={() => onToggleQuestion(q)}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Checkbox */}
                      <div className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${isSelected 
                          ? 'bg-primary-600 border-primary-600 shadow-lg shadow-primary-500/30' 
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-primary-400'
                        }
                      `}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
                          <span className="text-[10px] px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded font-bold">
                            #{globalIndex}
                          </span>
                          <span className="text-[10px] px-1.5 sm:px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded font-bold">
                            {q.paper === 'paper1' ? 'P1' : 'P2'}
                          </span>
                          {q.unit && (
                            <span className="text-[10px] px-1.5 sm:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-semibold truncate max-w-[80px] sm:max-w-[120px]" title={q.unit}>
                              {q.unit}
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-bold ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : q.difficulty === 'hard'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          }`}>
                            {DIFFICULTY_LABELS[q.difficulty]?.[displayLanguage] || q.difficulty}
                          </span>
                          <span className="text-[10px] px-1.5 sm:px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-semibold">
                            {QUESTION_TYPE_LABELS[q.questionType]?.[displayLanguage] || q.questionType}
                          </span>
                          {q.isPYQ && (
                            <span className="text-[10px] px-1.5 sm:px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-bold flex items-center gap-0.5">
                              <Star className="w-3 h-3" /> PYQ
                            </span>
                          )}
                        </div>

                        {/* Question Text */}
                        <p className="text-gray-800 dark:text-gray-200 text-sm font-medium line-clamp-2 leading-relaxed">
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
                            className="opacity-0 group-hover:opacity-100 px-2 sm:px-3 py-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('देखें', 'Preview')}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                        <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/40">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedQuestions.map((q, idx) => {
                const isSelected = selectedQuestions.some(sq => sq._id === q._id);
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                
                return (
                  <div
                    key={q._id}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all cursor-pointer group
                      ${isSelected
                        ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                      }
                    `}
                    onClick={() => onToggleQuestion(q)}
                  >
                    {/* Selection Indicator */}
                    <div className={`
                      absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'bg-primary-600 shadow-lg shadow-primary-500/30' 
                        : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
                      }
                    `}>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{globalIndex}</span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-2 pr-8">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-bold">
                        {q.paper === 'paper1' ? 'P1' : 'P2'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        q.difficulty === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        q.difficulty === 'hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {(q.difficulty || 'medium')[0].toUpperCase()}
                      </span>
                      {q.isPYQ && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded font-bold">
                          <Star className="w-2.5 h-2.5 inline" />
                        </span>
                      )}
                    </div>

                    {/* Question */}
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3 leading-relaxed">
                      {getQuestionText(q)}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPreviewQuestion(q); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={t('देखें', 'Preview')}
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========== PAGINATION ========== */}
        {displayQuestions.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Items per page - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {t('प्रति पृष्ठ:', 'Per page:')}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
                >
                  {perPageOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Page Info */}
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                {t('पृष्ठ', 'Page')} <strong>{currentPage}</strong> / {totalPages || 1}
                <span className="hidden sm:inline ml-2 text-gray-400">
                  ({(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, displayQuestions.length)} of {displayQuestions.length})
                </span>
              </span>

              {/* Page Navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('पहला', 'First')}
                >
                  <ChevronsUpDown className="w-4 h-4 rotate-90 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('पिछला', 'Previous')}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-1 sm:mx-2">
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
                        className={`w-8 h-8 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
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
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('अगला', 'Next')}
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={t('अंतिम', 'Last')}
                >
                  <ChevronsUpDown className="w-4 h-4 -rotate-90 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== FOOTER ========== */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Selection Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">
                    {t('चुने गए', 'Selected')}
                  </span>
                  <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                    {selectedQuestions.length}
                  </span>
                </div>
              </div>
              {selectedQuestions.length > 0 && (
                <>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
                  <div className="hidden sm:block">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      {t('कुल अंक', 'Total Marks')}
                    </span>
                    <span className="text-lg font-black text-green-600 dark:text-green-400">
                      {selectedQuestions.length * marksPerQuestion}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onSelectAllFiltered ? onSelectAllFiltered(filteredQuestions) : onSelectAll()}
                className="hidden sm:flex px-3 py-2 text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                {t('सभी चुनें', 'Select All')}
              </button>
              {selectedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 py-2 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('चयन साफ़', 'Clear Selection')}</span>
                  <span className="sm:hidden">{t('साफ़', 'Clear')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t('रद्द', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCheck className="w-5 h-5" />
                {t('पूर्ण', 'Done')}
                {selectedQuestions.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                    {selectedQuestions.length}
                  </span>
                )}
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