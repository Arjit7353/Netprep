// client/src/components/test/TestCreate.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Wand2,
  Plus,
  Search,
  Check,
  X,
  AlertCircle,
  Shuffle,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  SortDesc,
  Clock,
  Award,
  MinusCircle,
  RotateCcw,
  GripVertical,
  RefreshCw,
  Eye,
  Trash2,
  Sparkles,
  Copy,
  Edit3,
  Zap,
  BookOpen,
  Layers,
  Target,
  Hash,
  CheckCircle2,
  Circle,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Info,
  Star,
  Rocket,
  Timer,
  Users,
  Calendar,
  Lightbulb,
  Layout,
  Grid3X3,
  List,
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Heart,
  Bookmark,
  MoreHorizontal,
  HelpCircle,
  Shield,
  Lock,
  Unlock,
  Activity,
  Undo2,
  Redo2,
  Command,
  Keyboard,
  Moon,
  Sun,
  Gauge,
  CircleDot,
  LayoutGrid,
  ListChecks,
  ArrowUpRight,
  Flame,
  Trophy,
  Percent,
  AlertTriangle,
  CheckCheck,
  XCircle,
  CircleSlash,
  MousePointerClick
} from 'lucide-react';
import { useTest } from '../../hooks/useTest';
import { useQuestions } from '../../hooks/useQuestions';
import { TEST_TYPE_CONFIG, PAPER_LABELS, QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../utils/constants';
import { useSyllabus } from '../../hooks/useSyllabus'; // NEW: Import Syllabus Hook
import Loader from '../common/Loader';
import { useToast } from '../common/Toast';
import QuestionLibraryModal from './QuestionLibraryModal';
import TitleGenerator from './TitleGenerator';
import { 
  getUnitNamesFromKeys, 
  getChapterNamesFromKeys, 
  getTopicNamesFromKeys 
} from '../../utils/testHelpers';

// ============================================
// THEME-AWARE GLASS CARD COMPONENT
// ============================================
const GlassCard = ({ 
  children, 
  className = '', 
  gradient = false, 
  hover = true, 
  onClick,
  glow = false,
  border = true,
  padding = 'p-6'
}) => {
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl
        ${border ? 'border border-gray-200/50 dark:border-gray-700/50' : ''}
        shadow-xl shadow-gray-200/30 dark:shadow-black/30
        ${hover ? 'hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 hover:-translate-y-0.5 transition-all duration-300' : ''}
        ${glow ? 'ring-2 ring-primary-500/20 dark:ring-primary-400/30' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${padding}
        ${className}
      `}
    >
      {/* Gradient Overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 dark:from-primary-500/10 dark:to-purple-500/10 pointer-events-none" />
      )}
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative">{children}</div>
    </div>
  );
};

// ============================================
// ANIMATED STEP INDICATOR (ENHANCED)
// ============================================
const StepIndicator = ({ steps, currentStep, onStepClick, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  return (
    <div className="relative px-4">
      {/* Progress Bar Background */}
      <div className="absolute top-6 left-16 right-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
      
      {/* Active Progress Bar */}
      <div 
        className="absolute top-6 left-16 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary-500/30"
        style={{ width: `calc(${(currentStep / (steps.length - 1)) * 100}% - 4rem)`, maxWidth: 'calc(100% - 8rem)' }}
      />
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = index <= currentStep;
          
          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`flex flex-col items-center group transition-all duration-300 ${
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              {/* Step Circle */}
              <div className={`
                relative w-12 h-12 rounded-2xl flex items-center justify-center
                transition-all duration-500 transform
                ${isActive 
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110 shadow-xl shadow-primary-500/40 dark:shadow-primary-500/50' 
                  : isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }
                ${isClickable && !isActive ? 'group-hover:scale-105 group-hover:shadow-lg' : ''}
              `}>
                {/* Pulse Animation for Active */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-primary-500 animate-ping opacity-20" />
                )}
                
                {isCompleted ? (
                  <CheckCheck className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-3 text-center">
                <p className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : isCompleted 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {t(step.labelHi, step.label)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {t('चरण', 'Step')} {index + 1}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// FLOATING ACTION BUTTON
// ============================================
const FloatingActionButton = ({ onClick, icon: Icon, label, variant = 'primary', position = 'bottom-right' }) => {
  const positionClasses = {
    'bottom-right': 'bottom-24 right-6',
    'bottom-left': 'bottom-24 left-6',
    'top-right': 'top-24 right-6'
  };
  
  const variantClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-primary-500/40',
    success: 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/40',
    danger: 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/40'
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-40
        p-4 rounded-2xl text-white
        ${variantClasses[variant]}
        shadow-xl hover:shadow-2xl
        transform hover:scale-105 active:scale-95
        transition-all duration-300
        group
      `}
      title={label}
    >
      <Icon className="w-6 h-6" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};

// ============================================
// ANIMATED COUNTER WITH GLOW
// ============================================
const AnimatedCounter = ({ value, suffix = '', prefix = '', className = '', color = 'primary' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400'
  };
  
  useEffect(() => {
    const duration = 600;
    const steps = 30;
    const stepDuration = duration / steps;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className={`${colorClasses[color]} ${className} tabular-nums font-bold`}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

// ============================================
// TEST TYPE CARD (ENHANCED)
// ============================================
const TestTypeCard = ({ config, typeKey, isSelected, onClick, language, questionCount = 0 }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  const gradientMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
    gray: 'from-gray-600 to-gray-700'
  };
  
  const gradient = gradientMap[config.color] || gradientMap.blue;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group
        ${isSelected 
          ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-xl shadow-primary-500/20 scale-[1.02]' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg bg-white dark:bg-gray-800'
        }
      `}
    >
      {/* Glow Effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20" />
      )}
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Badge */}
      <div className={`
        relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-white
        bg-gradient-to-r ${gradient} shadow-lg mb-3
        group-hover:scale-105 transition-transform
      `}>
        <Sparkles className="w-3 h-3" />
        {config.shortCode}
      </div>
      
      {/* Name */}
      <h4 className={`text-sm font-bold leading-tight mb-2 ${
        isSelected 
          ? 'text-primary-700 dark:text-primary-300' 
          : 'text-gray-800 dark:text-gray-200'
      }`}>
        {t(config.nameHi, config.name)}
      </h4>
      
      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {config.defaultQuestions}Q
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {config.defaultDuration}m
        </span>
      </div>
      
      {/* Hover Arrow */}
      <div className={`
        absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center
        bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500
        opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0
        ${isSelected ? 'opacity-100 translate-x-0 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400' : ''}
      `}>
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </button>
  );
};

// ============================================
// ENHANCED MULTI-SELECT DROPDOWN
// ============================================
const EnhancedMultiSelect = ({
  label,
  labelHi,
  options,
  selected,
  onChange,
  disabled = false,
  placeholder,
  placeholderHi,
  showSearch = false,
  maxDisplay = 2,
  icon: Icon,
  language = 'hi',
  colorScheme = 'primary'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  const colorSchemes = {
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
  
  const colors = colorSchemes[colorScheme] || colorSchemes.primary;

  // Calculate dropdown position when opened
  const updateDropdownPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 350; // Approximate max height
      
      // Decide whether to open above or below
      const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      setDropdownPosition({
        top: openAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 320),
        openAbove
      });
    }
  }, []);

  // Handle open/close
  const handleToggle = () => {
    if (disabled) return;
    
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const selectAll = (e) => {
    e.stopPropagation();
    onChange(options.map(o => o.value));
  };
  
  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Dropdown Portal Content
  const dropdownContent = isOpen && createPortal(
    <div
      ref={dropdownRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999,
        maxHeight: '340px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search & Actions Header */}
      <div className="sticky top-0 p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 z-10">
        {showSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('खोजें...', 'Search...')}
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        )}
        
        {/* Actions Row */}
        <div className="flex justify-between items-center">
          <button 
            type="button" 
            onClick={selectAll}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('सभी चुनें', 'Select All')} ({options.length})
          </button>
          <button 
            type="button" 
            onClick={clearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            {t('साफ़ करें', 'Clear')}
          </button>
        </div>
      </div>

      {/* Options List */}
      <div 
        className="overflow-y-auto overscroll-contain"
        style={{ maxHeight: '240px' }}
      >
        <div className="p-2 space-y-1">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? t('कोई परिणाम नहीं', 'No results found')
                  : t('कोई विकल्प नहीं', 'No options available')
                }
              </p>
              {searchTerm && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  "{searchTerm}" {t('के लिए', 'for')}
                </p>
              )}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={(e) => toggleOption(option.value, e)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-150
                    ${isSelected
                      ? `${colors.hover} text-gray-900 dark:text-gray-100 bg-opacity-50`
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                    }
                  `}
                >
                  {/* Checkbox */}
                  <div className={`
                    w-5 h-5 border-2 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                    ${isSelected
                      ? colors.checkbox
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  
                  {/* Option Text */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate" title={option.label}>
                      {option.label}
                    </span>
                    {option.shortName && option.shortName !== option.label && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                        {option.shortName}
                      </span>
                    )}
                  </div>
                  
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {selected.length > 0 && (
        <div className="sticky bottom-0 p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{selected.length}</span>
              {' '}/{' '}{options.length} {t('चुने गए', 'selected')}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              {t('पूर्ण', 'Done')}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3
          border-2 rounded-xl text-sm transition-all duration-200
          ${disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-700'
            : 'hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 hover:shadow-md bg-white dark:bg-gray-800'
          }
          ${selected.length > 0 ? colors.selected : 'border-gray-200 dark:border-gray-700'}
          ${isOpen ? `ring-4 ${colors.ring} border-primary-500 dark:border-primary-400` : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
          <span className="truncate text-left font-medium">
            {getDisplayText()}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {selected.length > 0 && (
            <span className={`${colors.badge} text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm`}>
              {selected.length}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown rendered via Portal */}
      {dropdownContent}
    </div>
  );
};
// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ icon: Icon, label, value, color, gradient, suffix = '', trend }) => {
  const gradientMap = {
    primary: 'from-primary-500 to-primary-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-amber-600',
    red: 'from-red-500 to-rose-600',
    teal: 'from-teal-500 to-cyan-600'
  };

  return (
    <GlassCard className="!p-0 overflow-hidden" hover={false}>
      <div className="p-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientMap[gradient] || gradientMap.primary} flex items-center justify-center mb-3 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              <AnimatedCounter value={typeof value === 'number' ? value : 0} color={color} />
              {typeof value === 'string' && value}
              {suffix}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wide">{label}</p>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Gradient Bar */}
      <div className={`h-1 bg-gradient-to-r ${gradientMap[gradient] || gradientMap.primary}`} />
    </GlassCard>
  );
};

// ============================================
// DIFFICULTY DISTRIBUTION CHART (ENHANCED)
// ============================================
const DifficultyChart = ({ questions, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  const distribution = useMemo(() => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      if (counts.hasOwnProperty(q.difficulty)) {
        counts[q.difficulty]++;
      } else {
        counts.medium++;
      }
    });
    return counts;
  }, [questions]);
  
  const total = questions.length || 1;
  
  const bars = [
    { key: 'easy', label: t('आसान', 'Easy'), color: 'from-green-400 to-emerald-500', bg: 'bg-green-500', count: distribution.easy, icon: Sparkles },
    { key: 'medium', label: t('मध्यम', 'Medium'), color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500', count: distribution.medium, icon: Gauge },
    { key: 'hard', label: t('कठिन', 'Hard'), color: 'from-red-400 to-rose-500', bg: 'bg-red-500', count: distribution.hard, icon: Flame }
  ];
  
  return (
    <GlassCard gradient>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          {t('कठिनाई वितरण', 'Difficulty Distribution')}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {total} {t('प्रश्न', 'Q')}
        </span>
      </div>
      
      {/* Stacked Bar */}
      <div className="h-5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex shadow-inner">
        {bars.map(bar => (
          <div
            key={bar.key}
            className={`bg-gradient-to-r ${bar.color} transition-all duration-700 ease-out relative group`}
            style={{ width: `${(bar.count / total) * 100}%` }}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {bar.label}: {bar.count}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-between mt-4">
        {bars.map(bar => (
          <div key={bar.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${bar.bg}`} />
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">{bar.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                ({Math.round((bar.count / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ============================================
// QUICK TEMPLATE CARD (ENHANCED)
// ============================================
const QuickTemplateCard = ({ template, onClick, language, isActive }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-5 rounded-2xl border-2 border-dashed 
        ${isActive 
          ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30' 
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
        }
        transition-all duration-300 text-left group
        hover:shadow-lg hover:-translate-y-0.5
      `}
    >
      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-2xl bg-gradient-to-br ${template.gradient} 
        flex items-center justify-center mb-4
        shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
      `}>
        <template.icon className="w-7 h-7 text-white" />
      </div>
      
      {/* Content */}
      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">
        {t(template.nameHi, template.name)}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t(template.descHi, template.desc)}</p>
      
      {/* Arrow */}
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
    </button>
  );
};

// ============================================
// SELECTED QUESTIONS PANEL (ENHANCED)
// ============================================
const SelectedQuestionsPanel = ({ 
  questions, 
  onRemove, 
  onClear, 
  onReorder,
  language,
  marksPerQuestion,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newQuestions = [...questions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    onReorder(newQuestions);
    setDraggedIndex(index);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  if (questions.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-lg">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t('कोई प्रश्न नहीं चुना', 'No Questions Selected')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          {t('"प्रश्न जोड़ें" बटन पर क्लिक करके प्रश्न चुनें', 'Click "Add Questions" button to select questions')}
        </p>
        
        {/* Hint */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm">
          <MousePointerClick className="w-4 h-4" />
          {t('या नीचे "प्रश्न जोड़ें" पर क्लिक करें', 'or click "Add Questions" below')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {questions.length} {t('प्रश्न', 'Questions')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            {questions.length * marksPerQuestion} {t('अंक', 'Marks')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Undo/Redo Buttons */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${
              canUndo 
                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' 
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={t('पूर्ववत करें (Ctrl+Z)', 'Undo (Ctrl+Z)')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${
              canRedo 
                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' 
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            title={t('फिर से करें (Ctrl+Y)', 'Redo (Ctrl+Y)')}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
          
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('सभी हटाएं', 'Clear All')}
          </button>
        </div>
      </div>
      
      {/* Questions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {questions.map((q, index) => (
          <div
            key={q._id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all group cursor-move
              ${draggedIndex === index ? 'opacity-50 scale-95 shadow-lg' : ''}
            `}
          >
            <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-gray-400 dark:group-hover:text-gray-500" />
            
            <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl text-xs font-bold flex-shrink-0 shadow-sm">
              {index + 1}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 dark:text-gray-200 truncate font-medium">
                {q.question?.[language] || q.question?.hi || '...'}
              </p>
              <div className="flex gap-1.5 mt-1.5">
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-medium">
                  {q.paper === 'paper1' ? 'P1' : 'P2'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                  q.difficulty === 'easy' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : q.difficulty === 'hard' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  {DIFFICULTY_LABELS[q.difficulty]?.[language] || q.difficulty}
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => onRemove(q)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// ENHANCED TITLE PREVIEW
// ============================================
const EnhancedTitlePreview = ({ title, testType, language, onCopy, onEdit }) => {
  const typeConfig = TEST_TYPE_CONFIG[testType];
  const t = (hi, en) => language === 'hi' ? hi : en;
  const [copied, setCopied] = useState(false);

  const gradientMap = {
    dpp: 'from-blue-500 to-blue-600',
    topic_test: 'from-emerald-500 to-emerald-600',
    chapter_test: 'from-purple-500 to-purple-600',
    unit_test: 'from-orange-500 to-orange-600',
    pyq_year: 'from-red-500 to-red-600',
    practice: 'from-teal-500 to-teal-600',
    full_mock_p1: 'from-indigo-500 to-indigo-600',
    full_mock_p2: 'from-pink-500 to-pink-600',
    full_mock_combined: 'from-gray-600 to-gray-700'
  };

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Badge Row */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`
              px-4 py-2 rounded-xl text-xs font-black text-white
              bg-gradient-to-r ${gradientMap[testType]} shadow-lg
              flex items-center gap-1.5
            `}>
              <Sparkles className="w-3.5 h-3.5" />
              {typeConfig?.shortCode || 'TEST'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full font-medium">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              {t('स्वतः उत्पन्न', 'Auto Generated')}
            </span>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-black text-gray-900 dark:text-white break-words leading-tight">
            {title || t('शीर्षक यहाँ दिखेगा...', 'Title will appear here...')}
          </h3>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`
              p-3 rounded-xl transition-all group border
              ${copied 
                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600' 
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'
              }
              shadow-sm hover:shadow-md
            `}
            title={t('कॉपी करें', 'Copy')}
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
            )}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all group shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
            title={t('संपादित करें', 'Edit')}
          >
            <Edit3 className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// KEYBOARD SHORTCUTS HELP
// ============================================
const KeyboardShortcutsHelp = ({ isOpen, onClose, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  const shortcuts = [
    // Navigation
    { keys: ['←'], action: t('पिछला स्टेप', 'Previous Step'), category: t('नेविगेशन', 'Navigation') },
    { keys: ['→'], action: t('अगला स्टेप', 'Next Step'), category: t('नेविगेशन', 'Navigation') },
    { keys: ['↑', '↓'], action: t('विकल्पों में जाएं', 'Navigate Options'), category: t('नेविगेशन', 'Navigation') },
    { keys: ['Enter'], action: t('सलेक्ट करें / अगला स्टेप', 'Select / Next'), category: t('नेविगेशन', 'Navigation') },
    
    // Editing
    { keys: ['Ctrl', 'Z'], action: t('पूर्ववत करें', 'Undo'), category: t('संपादन', 'Editing') },
    { keys: ['Ctrl', 'Y'], action: t('फिर से करें', 'Redo'), category: t('संपादन', 'Editing') },
    { keys: ['Ctrl', 'S'], action: t('परीक्षा सेव करें', 'Save Test'), category: t('संपादन', 'Editing') },
    
    // Quick Actions
    { keys: ['A'], action: t('प्रश्न जोड़ें', 'Add Questions'), category: t('त्वरित क्रियाएं', 'Quick Actions') },
    { keys: ['/'], action: t('खोज', 'Search'), category: t('त्वरित क्रियाएं', 'Quick Actions') },
    { keys: ['?'], action: t('सहायता', 'Help'), category: t('त्वरित क्रियाएं', 'Quick Actions') },
    
    // Modal Control
    { keys: ['Esc'], action: t('मोडल बंद करें', 'Close Modal'), category: t('मोडल', 'Modal') },
  ];
  
  const categories = [...new Set(shortcuts.map(s => s.category))];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('कीबोर्ड शॉर्टकट', 'Keyboard Shortcuts')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('तेज़ नेविगेशन के लिए', 'For faster navigation')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">{category}</h4>
              <div className="space-y-2">
                {shortcuts.filter(s => s.category === category).map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{shortcut.action}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd className="px-2.5 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && <span className="text-gray-400 text-xs">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 {t('टिप: किसी भी समय सहायता के लिए', 'Tip: Press')} <kbd className="px-1.5 py-0.5 bg-white dark:bg-blue-800 border border-blue-300 dark:border-blue-600 rounded text-xs font-bold">?</kbd> {t('दबाएं', 'for help')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN TESTCREATE COMPONENT
// ============================================
const TestCreate = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const { createTest, generateRandomTest, loading } = useTest();
  const { questions, fetchQuestions, loading: questionsLoading } = useQuestions();
  const toast = useToast();

  // ✅ Syllabus hook - Get all needed functions
  const { 
    syllabus: syllabusData, 
    loading: syllabusLoading,
    refreshSyllabus,
    dataSource
  } = useSyllabus();

  // ==========================================
  // WIZARD STEPS CONFIGURATION
  // ==========================================
  const STEPS = [
    { id: 'type', label: 'Test Type', labelHi: 'परीक्षा प्रकार', icon: Layers },
    { id: 'filters', label: 'Filters', labelHi: 'फ़िल्टर', icon: Filter },
    { id: 'questions', label: 'Questions', labelHi: 'प्रश्न', icon: FileText },
    { id: 'settings', label: 'Settings', labelHi: 'सेटिंग्स', icon: Settings },
    { id: 'review', label: 'Review', labelHi: 'समीक्षा', icon: Eye },
    { id: 'complete', label: 'Complete', labelHi: 'पूर्ण', icon: CheckCircle2 }
  ];

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [currentStep, setCurrentStep] = useState(0);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [createdTest, setCreatedTest] = useState(null);
  
  const [formData, setFormData] = useState({
    testType: 'practice',
    title: '',
    description: '',
    duration: 60,
    totalQuestions: 50,
    marksPerQuestion: 2,
    negativeMarking: false,
    negativeMarks: 0.5,
    shuffleQuestions: true,
    status: 'active'
  });

  const [mainFilters, setMainFilters] = useState({
    papers: ['paper1'],
    units: [],
    chapters: [],
    topics: [],
    types: []
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectionHistory, setSelectionHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalFilters, setModalFilters] = useState({
    papers: [],
    units: [],
    chapters: [],
    topics: [],
    types: []
  });

  const [isRandomMode, setIsRandomMode] = useState(false);
  const [questionsPerUnit, setQuestionsPerUnit] = useState({});
  const [errors, setErrors] = useState({});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [testNumber, setTestNumber] = useState(1);

  // ==========================================
  // UNDO/REDO LOGIC
  // ==========================================
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < selectionHistory.length - 1;

  const pushToHistory = (newSelection) => {
    const newHistory = selectionHistory.slice(0, historyIndex + 1);
    newHistory.push(newSelection);
    setSelectionHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSelectedQuestions(selectionHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSelectedQuestions(selectionHistory[newIndex]);
    }
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const t = (hi, en) => language === 'hi' ? hi : en;

  // ✅ getSyllabus - Using hook data
  const getSyllabus = useCallback((paper) => {
    if (!syllabusData) return { units: [] };
    const paperData = syllabusData[paper];
    if (paperData && paperData.units && paperData.units.length > 0) {
      return paperData;
    }
    return { units: [] };
  }, [syllabusData]);

  // ✅ getPaperOptions
  const getPaperOptions = useCallback(() => {
    return Object.entries(PAPER_LABELS).map(([key, label]) => ({
      value: key,
      label: t(label.hi, label.en)
    }));
  }, [language]);

  // ✅ getUnitOptions - With proper dependencies
  const getUnitOptions = useCallback((selectedPapersList) => {
    const options = [];
    const papers = selectedPapersList && selectedPapersList.length > 0 
      ? selectedPapersList 
      : ['paper1', 'paper2'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      if (!syllabus?.units) return;
      
      syllabus.units.forEach(unit => {
        options.push({
          value: `${paper}_${unit.id}`,
          label: `${paper === 'paper1' ? 'P1' : 'P2'}: ${t(unit.nameHi, unit.name)}`,
          shortName: (t(unit.nameHi, unit.name) || '').replace(/^(UNIT|इकाई)\s*[IVX\d]+:\s*/i, '').trim(),
          unitId: unit.id,
          paper
        });
      });
    });
    return options;
  }, [language, getSyllabus]);

  // ✅ getChapterOptions
  const getChapterOptions = useCallback((selectedUnitsList, selectedPapersList) => {
    const options = [];
    const papers = selectedPapersList && selectedPapersList.length > 0 
      ? selectedPapersList 
      : ['paper1', 'paper2'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      if (!syllabus?.units) return;
      
      syllabus.units.forEach(unit => {
        const unitKey = `${paper}_${unit.id}`;
        if (!selectedUnitsList || selectedUnitsList.length === 0 || selectedUnitsList.includes(unitKey)) {
          (unit.chapters || []).forEach(chapter => {
            options.push({
              value: `${paper}_${unit.id}_${chapter.id}`,
              label: t(chapter.nameHi, chapter.name),
              shortName: t(chapter.nameHi, chapter.name),
              unitId: unit.id,
              chapterId: chapter.id,
              paper
            });
          });
        }
      });
    });
    return options;
  }, [language, getSyllabus]);

  // ✅ getTopicOptions
  const getTopicOptions = useCallback((selectedChaptersList, selectedUnitsList, selectedPapersList) => {
    const options = [];
    const papers = selectedPapersList && selectedPapersList.length > 0 
      ? selectedPapersList 
      : ['paper1', 'paper2'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      if (!syllabus?.units) return;
      
      syllabus.units.forEach(unit => {
        const unitKey = `${paper}_${unit.id}`;
        if (!selectedUnitsList || selectedUnitsList.length === 0 || selectedUnitsList.includes(unitKey)) {
          (unit.chapters || []).forEach(chapter => {
            const chapterKey = `${paper}_${unit.id}_${chapter.id}`;
            if (!selectedChaptersList || selectedChaptersList.length === 0 || selectedChaptersList.includes(chapterKey)) {
              (chapter.topics || []).forEach(topic => {
                // Avoid duplicates
                if (!options.find(o => o.value === topic.name)) {
                  options.push({
                    value: topic.name,
                    label: t(topic.nameHi, topic.name),
                    shortName: t(topic.nameHi, topic.name)
                  });
                }
              });
            }
          });
        }
      });
    });
    return options;
  }, [language, getSyllabus]);

  // ✅ getTypeOptions - THIS WAS MISSING!
  const getTypeOptions = useCallback(() => {
    return Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => ({
      value: key,
      label: t(label.hi, label.en)
    }));
  }, [language]);

  // ✅ getAllUnits
  const getAllUnits = useCallback(() => {
    const allUnits = [];
    const papers = mainFilters.papers.length > 0 ? mainFilters.papers : ['paper1'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      if (!syllabus?.units) return;
      
      syllabus.units.forEach(unit => {
        allUnits.push({
          ...unit,
          paper,
          key: `${paper}_${unit.id}`,
          paperName: paper === 'paper1' ? 'Paper 1' : 'Paper 2',
          paperNameHi: paper === 'paper1' ? 'पेपर 1' : 'पेपर 2'
        });
      });
    });
    return allUnits;
  }, [mainFilters.papers, getSyllabus]);

  // ==========================================
  // TITLE GENERATION
  // ==========================================
  const truncStr = (str, maxLen = 25) => str && str.length > maxLen ? str.substring(0, maxLen) + '…' : str || '';

  const generateAutoTitle = useCallback(() => {
    const typeConfig = TEST_TYPE_CONFIG[formData.testType];
    const shortCode = typeConfig?.shortCode || 'TEST';
    const paperStr = mainFilters.papers.length === 2 ? 'P1+P2' : mainFilters.papers[0] === 'paper1' ? 'P1' : 'P2';

    switch (formData.testType) {
      case 'dpp': return `${paperStr} - DPP #${testNumber}`;
      case 'topic_test': return `${paperStr} - Topic Test #${testNumber}`;
      case 'chapter_test': return `${paperStr} - Chapter Test #${testNumber}`;
      case 'unit_test': return `${paperStr} - Unit Test #${testNumber}`;
      case 'pyq_year': return `PYQ ${new Date().getFullYear()} - ${paperStr} #${testNumber}`;
      case 'practice': return `${paperStr} - Practice #${testNumber}`;
      case 'full_mock_p1': return `Full Mock Paper 1 - #${testNumber}`;
      case 'full_mock_p2': return `Full Mock Paper 2 - #${testNumber}`;
      case 'full_mock_combined': return `Full Mock Combined - #${testNumber}`;
      default: return `${paperStr} - ${shortCode} #${testNumber}`;
    }
  }, [formData.testType, mainFilters.papers, testNumber]);

  const generatedTitle = useMemo(() => {
    return formData.title.trim() || generateAutoTitle();
  }, [formData.title, generateAutoTitle]);

  const copyTitle = async () => {
    try {
      await navigator.clipboard.writeText(generatedTitle);
      toast.success(t('शीर्षक कॉपी किया गया!', 'Title copied!'));
    } catch (err) {
      toast.error(t('कॉपी करने में विफल', 'Failed to copy'));
    }
  };

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputElement = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (currentStep === STEPS.length - 2) {
          document.querySelector('form')?.requestSubmit();
        }
      }
      if (e.key === 'Escape') {
        if (showQuestionModal) setShowQuestionModal(false);
        if (showKeyboardHelp) setShowKeyboardHelp(false);
      }
      if (e.key === 'ArrowRight' && !showQuestionModal && !isInputElement) {
        e.preventDefault();
        nextStep();
      }
      if (e.key === 'ArrowLeft' && !showQuestionModal && !isInputElement) {
        e.preventDefault();
        prevStep();
      }
      if ((e.key === 'a' || e.key === 'A') && !isInputElement && currentStep === 2) {
        e.preventDefault();
        setShowQuestionModal(true);
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, showQuestionModal, showKeyboardHelp, canUndo, canRedo]);

  // ==========================================
  // EFFECTS
  // ==========================================
  
  // Refresh syllabus on mount
  useEffect(() => {
    console.log('[TestCreate] Refreshing syllabus on mount...');
    refreshSyllabus();
  }, []);

  // Log syllabus source for debugging
  useEffect(() => {
    console.log('[TestCreate] Syllabus data source:', dataSource);
    console.log('[TestCreate] Paper1 units:', syllabusData?.paper1?.units?.length || 0);
    console.log('[TestCreate] Paper2 units:', syllabusData?.paper2?.units?.length || 0);
  }, [syllabusData, dataSource]);

  // Update form when test type changes
  useEffect(() => {
    const config = TEST_TYPE_CONFIG[formData.testType];
    if (config) {
      setFormData(prev => ({
        ...prev,
        duration: config.defaultDuration,
        totalQuestions: config.defaultQuestions,
        marksPerQuestion: config.marksPerQuestion || 2,
        negativeMarking: config.negativeMarking || false,
        negativeMarks: config.negativeMarks || 0.5
      }));

      if (['full_mock_p1', 'full_mock_p2', 'full_mock_combined'].includes(formData.testType)) {
        setIsRandomMode(true);
        if (formData.testType === 'full_mock_p1') {
          setMainFilters(prev => ({ ...prev, papers: ['paper1'] }));
        } else if (formData.testType === 'full_mock_p2') {
          setMainFilters(prev => ({ ...prev, papers: ['paper2'] }));
        } else {
          setMainFilters(prev => ({ ...prev, papers: ['paper1', 'paper2'] }));
        }
      } else {
        setIsRandomMode(false);
      }
    }
  }, [formData.testType]);

  // Generate random test number
  useEffect(() => {
    setTestNumber(Math.floor(Math.random() * 100) + 1);
  }, [formData.testType, mainFilters]);

  // Update questions per unit for random mode
  useEffect(() => {
    if (isRandomMode) {
      const distribution = {};
      const allUnits = getAllUnits();
      const perUnit = Math.floor(formData.totalQuestions / (allUnits.length || 1));
      const remainder = formData.totalQuestions % (allUnits.length || 1);

      allUnits.forEach((unit, index) => {
        distribution[unit.key] = perUnit + (index < remainder ? 1 : 0);
      });
      setQuestionsPerUnit(distribution);
    }
  }, [isRandomMode, mainFilters.papers, formData.totalQuestions, getAllUnits]);

  // Sync modal filters when opening
  useEffect(() => {
    if (showQuestionModal) {
      setModalFilters({
        papers: [...mainFilters.papers],
        units: [...mainFilters.units],
        chapters: [...mainFilters.chapters],
        topics: [...mainFilters.topics],
        types: [...mainFilters.types]
      });
      loadQuestions(mainFilters);
    }
  }, [showQuestionModal]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateMainFilter = (field, value) => {
    setMainFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      if (field === 'papers') {
        newFilters.units = [];
        newFilters.chapters = [];
        newFilters.topics = [];
      } else if (field === 'units') {
        newFilters.chapters = [];
        newFilters.topics = [];
      } else if (field === 'chapters') {
        newFilters.topics = [];
      }
      return newFilters;
    });
  };

  const updateModalFilter = (field, value) => {
    setModalFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      if (field === 'papers') {
        newFilters.units = [];
        newFilters.chapters = [];
        newFilters.topics = [];
      } else if (field === 'units') {
        newFilters.chapters = [];
        newFilters.topics = [];
      } else if (field === 'chapters') {
        newFilters.topics = [];
      }
      return newFilters;
    });
  };

  const loadQuestions = async (filters = modalFilters) => {
    try {
      const apiFilters = { limit: 200, sort: '-createdAt' };
      if (filters.papers && filters.papers.length > 0) apiFilters.paper = filters.papers;
      if (filters.types && filters.types.length > 0) apiFilters.questionType = filters.types;
      if (searchQuery.trim()) apiFilters.search = searchQuery.trim();
      await fetchQuestions(apiFilters);
    } catch (err) {
      toast.error(t('प्रश्न लोड करने में विफल', 'Failed to load questions'));
    }
  };

  const toggleQuestion = (question) => {
    const isSelected = selectedQuestions.some(q => q._id === question._id);
    const newSelection = isSelected
      ? selectedQuestions.filter(q => q._id !== question._id)
      : [...selectedQuestions, question];
    
    setSelectedQuestions(newSelection);
    pushToHistory(newSelection);
  };

  const selectAllQuestions = () => {
    const newQuestions = questions.filter(q => !selectedQuestions.some(sq => sq._id === q._id));
    const newSelection = [...selectedQuestions, ...newQuestions];
    setSelectedQuestions(newSelection);
    pushToHistory(newSelection);
  };

  const selectAllFilteredQuestions = (filteredQuestionsFromModal = []) => {
    const newQuestions = filteredQuestionsFromModal.filter(q => !selectedQuestions.some(sq => sq._id === q._id));
    const newSelection = [...selectedQuestions, ...newQuestions];
    setSelectedQuestions(newSelection);
    pushToHistory(newSelection);
  };

  const clearAllQuestions = () => {
    setSelectedQuestions([]);
    pushToHistory([]);
  };

  const handleQuestionsPerUnitChange = (unitKey, value) => {
    const numValue = parseInt(value) || 0;
    setQuestionsPerUnit(prev => ({ ...prev, [unitKey]: Math.max(0, numValue) }));
  };

  const distributeEqually = () => {
    const allUnits = getAllUnits();
    const perUnit = Math.floor(formData.totalQuestions / (allUnits.length || 1));
    const remainder = formData.totalQuestions % (allUnits.length || 1);

    const distribution = {};
    allUnits.forEach((unit, index) => {
      distribution[unit.key] = perUnit + (index < remainder ? 1 : 0);
    });
    setQuestionsPerUnit(distribution);
  };

  const getTotalDistributed = () => Object.values(questionsPerUnit).reduce((sum, val) => sum + (val || 0), 0);

  // ==========================================
  // STEP NAVIGATION
  // ==========================================
  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return mainFilters.papers.length > 0;
      case 2: return isRandomMode || selectedQuestions.length > 0;
      case 3: return formData.duration > 0;
      case 4: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceedToNext() && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================
  const validateForm = () => {
    const newErrors = {};
    
    if (!isRandomMode && selectedQuestions.length === 0) {
      newErrors.questions = t('कम से कम एक प्रश्न चुनें', 'Select at least one question');
    }
    
    if (formData.duration < 1) {
      newErrors.duration = t('अवधि 1 से अधिक होनी चाहिए', 'Duration must be greater than 0');
    }
    
    if (isRandomMode && getTotalDistributed() === 0) {
      newErrors.distribution = t('कुल प्रश्न 0 नहीं हो सकते', 'Total questions cannot be 0');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ==========================================
  // FORM SUBMISSION
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t('कृपया सभी त्रुटियां ठीक करें', 'Please fix all errors'));
      return;
    }

    try {
      const paperValue = mainFilters.papers.length === 2 
        ? 'combined' 
        : mainFilters.papers[0] || 'paper1';
      
      const finalTitle = formData.title.trim() || generateAutoTitle();

      // Convert filter keys to actual names
      const unitNames = getUnitNamesFromKeys(mainFilters.units, language);
      const chapterNames = getChapterNamesFromKeys(mainFilters.chapters, language);
      const topicNames = getTopicNamesFromKeys(mainFilters.topics);

      let response;
      
      if (isRandomMode) {
        response = await generateRandomTest({
          ...formData,
          paper: paperValue,
          title: finalTitle,
          unit: unitNames,
          chapter: chapterNames,
          topic: topicNames,
          questionsPerUnit,
          totalQuestions: getTotalDistributed()
        });
      } else {
        response = await createTest({
          ...formData,
          paper: paperValue,
          title: finalTitle,
          unit: unitNames,
          chapter: chapterNames,
          topic: topicNames,
          questions: selectedQuestions.map(q => q._id),
          totalQuestions: selectedQuestions.length
        });
      }

      toast.success(t('परीक्षा सफलतापूर्वक बनाई गई!', 'Test created successfully!'));
      setCreatedTest(response.data || response);
      setCurrentStep(STEPS.length - 1);
      
    } catch (err) {
      console.error('Test creation error:', err);
      toast.error(err.message || t('परीक्षा बनाने में त्रुटि', 'Error creating test'));
    }
  };

  // ==========================================
  // QUICK TEMPLATES
  // ==========================================
  const quickTemplates = [
    { id: 'quick_10', name: 'Quick 10', nameHi: 'त्वरित 10', desc: '10 Q, 15 min', descHi: '10 प्रश्न, 15 मिनट', icon: Zap, gradient: 'from-amber-500 to-orange-500', config: { testType: 'dpp', totalQuestions: 10, duration: 15 } },
    { id: 'chapter_25', name: 'Chapter Test', nameHi: 'अध्याय परीक्षा', desc: '25 Q, 30 min', descHi: '25 प्रश्न, 30 मिनट', icon: BookOpen, gradient: 'from-purple-500 to-indigo-500', config: { testType: 'chapter_test', totalQuestions: 25, duration: 30 } },
    { id: 'full_mock', name: 'Full Mock', nameHi: 'फुल मॉक', desc: '50 Q, 60 min', descHi: '50 प्रश्न, 60 मिनट', icon: Target, gradient: 'from-rose-500 to-pink-500', config: { testType: 'full_mock_p1', totalQuestions: 50, duration: 60 } },
    { id: 'pyq_practice', name: 'PYQ Set', nameHi: 'PYQ सेट', desc: 'Previous Year', descHi: 'पिछले वर्ष', icon: Trophy, gradient: 'from-emerald-500 to-teal-500', config: { testType: 'pyq_year', totalQuestions: 30, duration: 40 } }
  ];

  const applyTemplate = (template) => {
    setFormData(prev => ({ ...prev, ...template.config }));
    toast.success(t(`${template.nameHi} लागू`, `${template.name} applied`));
  };

  // ==========================================
  // Continue with renderStepContent()...
  // (The rest of your existing code)
  // ==========================================

  // ==========================================
  // RENDER STEP CONTENT
  // ==========================================
  const renderStepContent = () => {
    switch (currentStep) {
      // STEP 1: TEST TYPE
      case 0:
        return (
          <div className="space-y-8">
            {/* Quick Templates */}
            <GlassCard gradient glow>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                  <Rocket className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900 dark:text-white">{t('त्वरित टेम्पलेट', 'Quick Templates')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('एक क्लिक में शुरू करें', 'Start with one click')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickTemplates.map(template => (
                  <QuickTemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => applyTemplate(template)}
                    language={language}
                    isActive={formData.testType === template.config.testType}
                  />
                ))}
              </div>
            </GlassCard>

            {/* Test Types Grid */}
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30">
                    <Layers className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 dark:text-white">{t('परीक्षा प्रकार', 'Test Type')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('अपनी ज़रूरत के अनुसार चुनें', 'Choose according to your need')}</p>
                  </div>
                </div>
                
                {/* Random Mode Toggle */}
                <div className="flex items-center gap-4 px-5 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <Shuffle className={`w-5 h-5 ${isRandomMode ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('रैंडम मोड', 'Random')}</span>
                  <button
                    type="button"
                    onClick={() => setIsRandomMode(!isRandomMode)}
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${
                      isRandomMode 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${
                      isRandomMode ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(TEST_TYPE_CONFIG).map(([key, config]) => (
                  <TestTypeCard
                    key={key}
                    typeKey={key}
                    config={config}
                    isSelected={formData.testType === key}
                    onClick={() => handleChange('testType', key)}
                    language={language}
                  />
                ))}
              </div>
            </GlassCard>
          </div>
        );

      // STEP 2: FILTERS
      case 1:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters */}
            <div className="lg:col-span-2">
              <GlassCard>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <Filter className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-gray-900 dark:text-white">{t('फ़िल्टर सेट करें', 'Set Filters')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('प्रश्न छानने के लिए', 'To filter questions')}</p>
                  </div>
                </div>

                {/* Paper Selection */}
                <div className="mb-6">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {t('पेपर चुनें', 'Select Paper')} *
                  </label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {Object.entries(PAPER_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const papers = mainFilters.papers.includes(key)
                            ? mainFilters.papers.filter(p => p !== key)
                            : [...mainFilters.papers, key];
                          if (papers.length > 0) updateMainFilter('papers', papers);
                        }}
                        className={`
                          p-5 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-3
                          ${mainFilters.papers.includes(key)
                            ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 dark:border-primary-400 text-primary-700 dark:text-primary-300 shadow-lg shadow-primary-500/20'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                          }
                        `}
                      >
                        {mainFilters.papers.includes(key) && <CheckCircle2 className="w-5 h-5" />}
                        {t(label.hi, label.en)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cascading Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <EnhancedMultiSelect
                    label="Unit"
                    labelHi="इकाई"
                    options={getUnitOptions(mainFilters.papers)}
                    selected={mainFilters.units}
                    onChange={(val) => updateMainFilter('units', val)}
                    showSearch
                    icon={Target}
                    language={language}
                    colorScheme="blue"
                  />
                  <EnhancedMultiSelect
                    label="Chapter"
                    labelHi="अध्याय"
                    options={getChapterOptions(mainFilters.units, mainFilters.papers)}
                    selected={mainFilters.chapters}
                    onChange={(val) => updateMainFilter('chapters', val)}
                    disabled={mainFilters.units.length === 0}
                    showSearch
                    language={language}
                    colorScheme="green"
                  />
                  <EnhancedMultiSelect
                    label="Topic"
                    labelHi="विषय"
                    options={getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers)}
                    selected={mainFilters.topics}
                    onChange={(val) => updateMainFilter('topics', val)}
                    disabled={mainFilters.chapters.length === 0}
                    showSearch
                    language={language}
                    colorScheme="purple"
                  />
                  <EnhancedMultiSelect
                    label="Question Type"
                    labelHi="प्रश्न प्रकार"
                    options={getTypeOptions()}
                    selected={mainFilters.types}
                    onChange={(val) => updateMainFilter('types', val)}
                    language={language}
                    colorScheme="orange"
                  />
                </div>
              </GlassCard>
            </div>

            {/* Title Preview */}
            <div className="space-y-6">
              <TitleGenerator
                formData={formData}
                mainFilters={mainFilters}
                testNumber={testNumber}
                language={language}
                onTitleChange={(title) => handleChange('title', title)}
                getUnitOptions={getUnitOptions}
                getChapterOptions={getChapterOptions}
                getTopicOptions={getTopicOptions}
              />
            </div>
          </div>
        );

      // STEP 3: QUESTIONS
      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-gray-900 dark:text-white">
                        {isRandomMode ? t('रैंडम वितरण', 'Random Distribution') : t('प्रश्न चुनें', 'Select Questions')}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRandomMode ? t('प्रति इकाई प्रश्न सेट करें', 'Set questions per unit') : t('मैन्युअली प्रश्न जोड़ें', 'Add questions manually')}
                      </p>
                    </div>
                  </div>
                  
                  {!isRandomMode && (
                    <button
                      type="button"
                      onClick={() => setShowQuestionModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/30 transition-all font-bold"
                    >
                      <Plus className="w-5 h-5" />
                      {t('प्रश्न जोड़ें', 'Add Questions')}
                    </button>
                  )}
                </div>

                {isRandomMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        {t('कुल प्रश्न:', 'Total:')} {getTotalDistributed()} / {formData.totalQuestions}
                      </span>
                      <button
                        type="button"
                        onClick={distributeEqually}
                        className="text-sm text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5 hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t('समान वितरण', 'Equal')}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                      {getAllUnits().map((unit) => (
                        <div key={unit.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-bold">
                              {t(unit.paperNameHi, unit.paperName)}
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t(unit.nameHi, unit.name)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQuestionsPerUnitChange(unit.key, (questionsPerUnit[unit.key] || 0) - 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold"
                            >-</button>
                            <input
                              type="number"
                              value={questionsPerUnit[unit.key] || 0}
                              onChange={(e) => handleQuestionsPerUnitChange(unit.key, e.target.value)}
                              className="w-16 text-center px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuestionsPerUnitChange(unit.key, (questionsPerUnit[unit.key] || 0) + 1)}
                              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <SelectedQuestionsPanel
                    questions={selectedQuestions}
                    onRemove={toggleQuestion}
                    onClear={clearAllQuestions}
                    onReorder={(newOrder) => { setSelectedQuestions(newOrder); pushToHistory(newOrder); }}
                    language={language}
                    marksPerQuestion={formData.marksPerQuestion}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                  />
                )}
              </GlassCard>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              {selectedQuestions.length > 0 && !isRandomMode && (
                <DifficultyChart questions={selectedQuestions} language={language} />
              )}

              <GlassCard>
                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  {t('सारांश', 'Summary')}
                </h5>
                <div className="space-y-4">
                  {[
                    { label: t('प्रश्न', 'Questions'), value: isRandomMode ? getTotalDistributed() : selectedQuestions.length, color: 'primary' },
                    { label: t('कुल अंक', 'Total Marks'), value: (isRandomMode ? getTotalDistributed() : selectedQuestions.length) * formData.marksPerQuestion, color: 'green' },
                    { label: t('अवधि', 'Duration'), value: formData.duration, suffix: 'm', color: 'blue' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-xl font-black">
                        <AnimatedCounter value={item.value} suffix={item.suffix} color={item.color} />
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        );

      // STEP 4: SETTINGS
      case 3:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900 dark:text-white">{t('परीक्षा सेटिंग्स', 'Test Settings')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('समय और अंकन नियम', 'Time and marking rules')}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Duration */}
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {t('अवधि (मिनट)', 'Duration (minutes)')} *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-bold mt-2"
                  />
                  <div className="flex gap-2 mt-3">
                    {[15, 30, 45, 60, 90, 120].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleChange('duration', mins)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          formData.duration === mins
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marks */}
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {t('प्रति प्रश्न अंक', 'Marks per Question')}
                  </label>
                  <input
                    type="number"
                    value={formData.marksPerQuestion}
                    onChange={(e) => handleChange('marksPerQuestion', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20 focus:border-primary-500 dark:focus:border-primary-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mt-2"
                  />
                </div>

                {/* Negative Marking */}
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <MinusCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {t('नकारात्मक अंकन', 'Negative Marking')}
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => handleChange('negativeMarking', false)}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                        !formData.negativeMarking
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400 text-green-700 dark:text-green-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {t('नहीं', 'No')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('negativeMarking', true)}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                        formData.negativeMarking
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400 text-red-700 dark:text-red-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {t('हां', 'Yes')}
                    </button>
                  </div>
                  
                  {formData.negativeMarking && (
                    <input
                      type="number"
                      value={formData.negativeMarks}
                      onChange={(e) => handleChange('negativeMarks', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.25"
                      className="w-full px-4 py-3 border-2 border-red-200 dark:border-red-800 rounded-xl focus:ring-4 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mt-3"
                      placeholder={t('नकारात्मक अंक', 'Negative marks')}
                    />
                  )}
                </div>

                {/* Shuffle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shuffle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="font-bold text-gray-700 dark:text-gray-200">{t('प्रश्न शफल', 'Shuffle')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('प्रश्नों का क्रम बदलें', 'Randomize order')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('shuffleQuestions', !formData.shuffleQuestions)}
                    className={`w-14 h-7 rounded-full transition-all duration-300 relative ${
                      formData.shuffleQuestions 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${
                      formData.shuffleQuestions ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Preview */}
            <GlassCard gradient>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-900 dark:text-white">{t('गणना पूर्वावलोकन', 'Preview')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('अंकों का वितरण', 'Marks distribution')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard icon={FileText} label={t('प्रश्न', 'Questions')} value={isRandomMode ? getTotalDistributed() : selectedQuestions.length} color="primary" gradient="primary" />
                <StatCard icon={Award} label={t('कुल अंक', 'Total Marks')} value={(isRandomMode ? getTotalDistributed() : selectedQuestions.length) * formData.marksPerQuestion} color="green" gradient="green" />
              </div>

              <div className="space-y-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('प्रति प्रश्न अंक', 'Marks/Q')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">+{formData.marksPerQuestion}</span>
                </div>
                {formData.negativeMarking && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{t('गलत उत्तर पर', 'Wrong Ans')}</span>
                    <span className="font-bold text-red-600 dark:text-red-400">-{formData.negativeMarks}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('अवधि', 'Duration')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formData.duration} {t('मिनट', 'min')}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('प्रति प्रश्न समय', 'Time/Q')}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {((formData.duration * 60) / (isRandomMode ? getTotalDistributed() : selectedQuestions.length) || 0).toFixed(1)}s
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 border border-blue-200 dark:border-blue-800">
                <Lightbulb className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{t('सुझाव', 'Tip')}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {t('NTA पैटर्न में प्रति प्रश्न ~72 सेकंड का समय होता है', 'NTA pattern allows ~72 seconds per question')}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      // STEP 5: REVIEW
      case 4:
        return (
          <div className="space-y-6">
            {/* Title */}
            <GlassCard gradient glow>
              <EnhancedTitlePreview
                title={generatedTitle}
                testType={formData.testType}
                language={language}
                onCopy={copyTitle}
                onEdit={() => { setIsEditingTitle(true); setCurrentStep(1); }}
              />
            </GlassCard>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={FileText} label={t('प्रश्न', 'Questions')} value={isRandomMode ? getTotalDistributed() : selectedQuestions.length} gradient="primary" color="primary" />
              <StatCard icon={Clock} label={t('अवधि', 'Duration')} value={formData.duration} suffix="m" gradient="green" color="green" />
              <StatCard icon={Award} label={t('कुल अंक', 'Total Marks')} value={(isRandomMode ? getTotalDistributed() : selectedQuestions.length) * formData.marksPerQuestion} gradient="blue" color="blue" />
              <StatCard icon={BookOpen} label={t('पेपर', 'Paper')} value={mainFilters.papers.length === 2 ? 'P1+P2' : mainFilters.papers[0] === 'paper1' ? 'P1' : 'P2'} gradient="purple" color="purple" />
              <StatCard icon={MinusCircle} label={t('नेगेटिव', 'Negative')} value={formData.negativeMarking ? `-${formData.negativeMarks}` : '0'} gradient="red" color="red" />
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('परीक्षा कॉन्फ़िगरेशन', 'Test Configuration')}
                </h4>
                <div className="space-y-3">
                  {[
                    { label: t('परीक्षा प्रकार', 'Test Type'), value: TEST_TYPE_CONFIG[formData.testType]?.shortCode },
                    { label: t('मोड', 'Mode'), value: isRandomMode ? t('रैंडम', 'Random') : t('मैन्युअल', 'Manual') },
                    { label: t('शफल', 'Shuffle'), value: formData.shuffleQuestions ? t('हां', 'Yes') : t('नहीं', 'No') }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2.5">
                    <span className="text-gray-500 dark:text-gray-400">{t('स्थिति', 'Status')}</span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">{t('सक्रिय', 'Active')}</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  {t('लागू फ़िल्टर', 'Applied Filters')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mainFilters.papers.map(p => (
                    <span key={p} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold">
                      {p === 'paper1' ? 'Paper 1' : 'Paper 2'}
                    </span>
                  ))}
                  {mainFilters.units.slice(0, 3).map(u => (
                    <span key={u} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                      {getUnitOptions(mainFilters.papers).find(o => o.value === u)?.shortName || u}
                    </span>
                  ))}
                  {mainFilters.units.length > 3 && (
                    <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full text-xs font-bold">
                      +{mainFilters.units.length - 3}
                    </span>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Success Animation */}
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-8 relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/40 animate-pulse">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 text-center">
                {t('बधाई हो!', 'Congratulations!')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-2">
                {t('आपकी परीक्षा सफलतापूर्वक बनाई गई है', 'Your test has been created successfully!')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {t('अब आप इसे लेना शुरू कर सकते हैं या अन्य विकल्प देख सकते हैं', 'Now you can start taking it or explore other options')}
              </p>
            </div>

            {/* Test Details Card - Enhanced */}
            {createdTest && (
              <GlassCard>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{createdTest.title}</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                        {t(TEST_TYPE_CONFIG[formData.testType]?.nameHi || formData.testType, TEST_TYPE_CONFIG[formData.testType]?.name || formData.testType)}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">
                        {mainFilters.papers.includes('paper1') && mainFilters.papers.includes('paper2') ? 'Combined' : mainFilters.papers[0] === 'paper1' ? 'Paper 1' : 'Paper 2'}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                    {t('सक्रिय', 'Active')}
                  </div>
                </div>

                {createdTest.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">{createdTest.description}</p>
                )}

                {/* Main Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/10 rounded-xl border border-primary-200/30 dark:border-primary-800/30">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('प्रश्न', 'Questions')}</p>
                    <p className="text-3xl font-black text-primary-600 dark:text-primary-400">{createdTest.totalQuestions || selectedQuestions.length || 0}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200/30 dark:border-blue-800/30">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('कुल अंक', 'Total Marks')}</p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{(createdTest.totalQuestions || selectedQuestions.length || 0) * (formData.marksPerQuestion || 2)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200/30 dark:border-purple-800/30">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('अवधि', 'Duration')}</p>
                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{formData.duration || 60}<span className="text-sm ml-1">m</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl border border-amber-200/30 dark:border-amber-800/30">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('प्रति Q अंक', 'Marks/Q')}</p>
                    <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{formData.marksPerQuestion || 2}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200/30 dark:border-green-800/30">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('परीक्षा ID', 'Test ID')}</p>
                    <p className="text-sm font-black text-green-600 dark:text-green-400 truncate">{createdTest._id?.slice(-8)}</p>
                  </div>
                </div>

                {/* Additional Info */}
                {formData.negativeMarking && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200/30 dark:border-red-800/30">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t('नकारात्मक अंकन', 'Negative Marking')} • {formData.negativeMarks || 0.5} {t('अंक प्रति गलत उत्तर', 'per wrong answer')}</p>
                  </div>
                )}

                <hr className="border-gray-200 dark:border-gray-700 my-6" />

                {/* Action Buttons - Advanced */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/take-test/${createdTest._id}`)}
                    className="p-4 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{t('परीक्षा लें', 'Take Test')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/tests/${createdTest._id}`)}
                    className="p-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{t('विवरण', 'Details')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdTest._id);
                      toast.success(t('परीक्षा ID कॉपी की गई', 'Test ID copied'));
                    }}
                    className="p-4 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1 font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{t('ID कॉपी', 'Copy ID')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedTest(null);
                      setCurrentStep(0);
                      setFormData({
                        testType: 'practice',
                        title: '',
                        description: '',
                        duration: 60,
                        totalQuestions: 50,
                        marksPerQuestion: 2,
                        negativeMarking: false,
                        negativeMarks: 0.5,
                        shuffleQuestions: true,
                        status: 'active'
                      });
                      setSelectedQuestions([]);
                    }}
                    className="p-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white rounded-xl hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1 font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{t('नई परीक्षा', 'New Test')}</span>
                  </button>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('आप अपने परीक्षा पृष्ठ से किसी समय इन सेटिंग्स को संपादित कर सकते हैं', 'You can edit these settings anytime from your test page')}
                  </p>
                </div>
              </GlassCard>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tests')}
              className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                {t('नई परीक्षा बनाएं', 'Create New Test')}
                <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-xs rounded-full font-bold shadow-lg shadow-primary-500/30">
                  PRO
                </span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('स्टेप बाय स्टेप परीक्षा बनाएं', 'Create test step by step')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Keyboard Shortcuts */}
            <button
              onClick={() => setShowKeyboardHelp(true)}
              className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              title={t('कीबोर्ड शॉर्टकट', 'Keyboard Shortcuts')}
            >
              <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Step Progress */}
            <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-black shadow-lg">
                {currentStep + 1}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('चरण', 'Step')} {currentStep + 1}/{STEPS.length}</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{t(STEPS[currentStep].labelHi, STEPS[currentStep].label)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={goToStep}
            language={language}
          />
        </div>

        {/* Step Content */}
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation Footer - Hidden on completion step */}
          {currentStep !== STEPS.length - 1 && (
            <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 py-4 px-6 -mx-4 rounded-t-2xl shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  currentStep === 0
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                {t('पिछला', 'Previous')}
              </button>

              <div className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <strong className="text-gray-700 dark:text-gray-200">{isRandomMode ? getTotalDistributed() : selectedQuestions.length}</strong> {t('प्रश्न', 'Q')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <strong className="text-gray-700 dark:text-gray-200">{formData.duration}</strong>m
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <strong className="text-gray-700 dark:text-gray-200">{(isRandomMode ? getTotalDistributed() : selectedQuestions.length) * formData.marksPerQuestion}</strong> {t('अंक', 'marks')}
                </span>
              </div>

              {currentStep < STEPS.length - 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                    canProceedToNext()
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-xl hover:shadow-primary-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {t('अगला', 'Next')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : currentStep === STEPS.length - 2 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-black hover:shadow-2xl hover:shadow-green-500/30 transition-all disabled:opacity-50 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      {t('बना रहा है...', 'Creating...')}
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      {t('परीक्षा बनाएं', 'Create Test')}
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
          )}
        </form>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        language={language}
      />

      <QuestionLibraryModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        questions={questions}
        questionsLoading={questionsLoading}
        selectedQuestions={selectedQuestions}
        onToggleQuestion={toggleQuestion}
        onSelectAll={selectAllQuestions}
        onSelectAllFiltered={selectAllFilteredQuestions}
        onClearAll={clearAllQuestions}
        onApplyFilters={async (filters) => {
          const apiFilters = { limit: 200, sort: '-createdAt', ...filters };
          await fetchQuestions(apiFilters);
        }}
        language={language}
        marksPerQuestion={formData.marksPerQuestion}
        getUnitOptions={getUnitOptions}
        getChapterOptions={getChapterOptions}
        getTopicOptions={getTopicOptions}
        getTypeOptions={getTypeOptions}
        mainFilters={mainFilters}
      />

      {/* Floating Help Button */}
      <FloatingActionButton
        onClick={() => setShowKeyboardHelp(true)}
        icon={HelpCircle}
        label={t('सहायता', 'Help')}
        variant="primary"
        position="bottom-right"
      />
    </div>
  );
};

export default TestCreate;