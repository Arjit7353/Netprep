import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
  Hash
} from 'lucide-react';
import { useTest } from '../../hooks/useTest';
import { useQuestions } from '../../hooks/useQuestions';
import { TEST_TYPE_CONFIG, PAPER_LABELS, QUESTION_TYPE_LABELS } from '../../utils/constants';
import syllabusPaper1 from '../../data/syllabusPaper1';
import syllabusPaper2History from '../../data/syllabusPaper2History';
import Loader from '../common/Loader';
import { useToast } from '../common/Toast';

// ============================================
// MULTI-SELECT DROPDOWN COMPONENT
// ============================================
const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
  disabled = false,
  placeholder = null,
  showSearch = false,
  maxDisplay = 2
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

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

  const toggleOption = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const selectAll = () => onChange(options.map(o => o.value));
  const clearAll = () => onChange([]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder || label;
    if (selected.length <= maxDisplay) {
      return selected.map(val => {
        const opt = options.find(o => o.value === val);
        return opt?.label?.split(':').pop()?.trim() || val;
      }).join(', ');
    }
    return `${selected.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm bg-white transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'hover:border-primary-400 text-gray-700 hover:shadow-sm'
        } ${selected.length > 0 ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}
      >
        <span className="truncate text-left flex-1">
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {selected.length > 0 && (
            <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search & Actions */}
          <div className="p-2 border-b bg-gray-50">
            {showSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="flex justify-between">
              <button type="button" onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                Select All
              </button>
              <button type="button" onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                Clear
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto p-2 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No options available</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    selected.includes(option.value)
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected.includes(option.value)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {selected.includes(option.value) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm truncate" title={option.label}>
                    {option.label}
                  </span>
                </div>
              ))
            )}
          </div>

          {selected.length > 0 && (
            <div className="p-2 border-t bg-gray-50 text-xs text-gray-600 text-center">
              {selected.length} of {options.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// TITLE PREVIEW COMPONENT
// ============================================
const TitlePreview = ({ title, testType, language, onCopy, onEdit }) => {
  const typeConfig = TEST_TYPE_CONFIG[testType];
  const t = (hi, en) => language === 'hi' ? hi : en;

  const getTypeColor = () => {
    const colors = {
      dpp: 'from-blue-500 to-blue-600',
      topic_test: 'from-green-500 to-green-600',
      chapter_test: 'from-purple-500 to-purple-600',
      unit_test: 'from-orange-500 to-orange-600',
      pyq_year: 'from-red-500 to-red-600',
      practice: 'from-teal-500 to-teal-600',
      full_mock_p1: 'from-indigo-500 to-indigo-600',
      full_mock_p2: 'from-pink-500 to-pink-600',
      full_mock_combined: 'from-gray-600 to-gray-700'
    };
    return colors[testType] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTypeColor()}`}>
              {typeConfig?.shortCode || 'TEST'}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t('स्वतः उत्पन्न', 'Auto Generated')}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 break-words leading-tight">
            {title || t('शीर्षक यहाँ दिखेगा...', 'Title will appear here...')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCopy}
            className="p-2 hover:bg-white rounded-lg transition-colors group"
            title={t('कॉपी करें', 'Copy')}
          >
            <Copy className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 hover:bg-white rounded-lg transition-colors group"
            title={t('संपादित करें', 'Edit')}
          >
            <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// TITLE SUGGESTIONS COMPONENT
// ============================================
const TitleSuggestions = ({ suggestions, onSelect, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <Zap className="w-3 h-3" />
        {t('अन्य सुझाव:', 'Other suggestions:')}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all text-gray-700 hover:text-primary-700"
          >
            {suggestion}
          </button>
        ))}
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

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // Form State
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

  // MAIN PAGE FILTERS
  const [mainFilters, setMainFilters] = useState({
    papers: ['paper1'],
    units: [],
    chapters: [],
    topics: [],
    types: []
  });

  // Question Selection States
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Filters
  const [modalFilters, setModalFilters] = useState({
    papers: [],
    units: [],
    chapters: [],
    topics: [],
    types: []
  });

  // Random Mode States
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [questionsPerUnit, setQuestionsPerUnit] = useState({});
  const [showUnitDistribution, setShowUnitDistribution] = useState(true);

  // UI States
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [testNumber, setTestNumber] = useState(1);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  const getSyllabus = (paper) => {
    return paper === 'paper1' ? syllabusPaper1 : syllabusPaper2History;
  };

  const t = (hi, en) => language === 'hi' ? hi : en;

  // Get Paper Options
  const getPaperOptions = () => Object.entries(PAPER_LABELS).map(([key, label]) => ({
    value: key,
    label: t(label.hi, label.en)
  }));

  // Get Unit Options
  const getUnitOptions = useCallback((selectedPapersList) => {
    const options = [];
    const papers = selectedPapersList.length > 0 ? selectedPapersList : ['paper1', 'paper2'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      syllabus.units?.forEach(unit => {
        options.push({
          value: `${paper}_${unit.id}`,
          label: `${paper === 'paper1' ? 'P1' : 'P2'}: ${t(unit.nameHi, unit.name)}`,
          shortName: t(unit.nameHi, unit.name).replace(/^(UNIT|इकाई)\s*[IVX\d]+:\s*/i, '').trim(),
          unitId: unit.id,
          paper
        });
      });
    });
    return options;
  }, [language]);

  // Get Chapter Options
  const getChapterOptions = useCallback((selectedUnitsList, selectedPapersList) => {
    const options = [];
    const papers = selectedPapersList.length > 0 ? selectedPapersList : ['paper1', 'paper2'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      syllabus.units?.forEach(unit => {
        const unitKey = `${paper}_${unit.id}`;
        if (selectedUnitsList.length === 0 || selectedUnitsList.includes(unitKey)) {
          unit.chapters?.forEach(chapter => {
            options.push({
              value: `${paper}_${unit.id}_${chapter.id}`,
              label: t(chapter.nameHi, chapter.name),
              shortName: t(chapter.nameHi, chapter.name),
              unitId: unit.id,
              paper
            });
          });
        }
      });
    });
    return options;
  }, [language]);

  // Get Topic Options
  const getTopicOptions = useCallback((selectedChaptersList, selectedUnitsList, selectedPapersList) => {
    const options = [];
    const papers = selectedPapersList.length > 0 ? selectedPapersList : ['paper1', 'paper2'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      syllabus.units?.forEach(unit => {
        const unitKey = `${paper}_${unit.id}`;
        if (selectedUnitsList.length === 0 || selectedUnitsList.includes(unitKey)) {
          unit.chapters?.forEach(chapter => {
            const chapterKey = `${paper}_${unit.id}_${chapter.id}`;
            if (selectedChaptersList.length === 0 || selectedChaptersList.includes(chapterKey)) {
              chapter.topics?.forEach(topic => {
                options.push({
                  value: topic.name,
                  label: t(topic.nameHi, topic.name),
                  shortName: t(topic.nameHi, topic.name)
                });
              });
            }
          });
        }
      });
    });
    return options;
  }, [language]);

  // Get Type Options
  const getTypeOptions = () => Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => ({
    value: key,
    label: t(label.hi, label.en)
  }));

  // Get all units from selected papers
  const getAllUnits = useCallback(() => {
    const allUnits = [];
    const papers = mainFilters.papers.length > 0 ? mainFilters.papers : ['paper1'];

    papers.forEach(paper => {
      const syllabus = getSyllabus(paper);
      syllabus.units?.forEach(unit => {
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
  }, [mainFilters.papers]);

  // ==========================================
  // ENHANCED AUTO TITLE GENERATION - FIXED
  // Shows ALL selected items, not just one
  // ==========================================

  // Helper: truncate string
  const truncStr = (str, maxLen = 25) => {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
  };

  // Get ALL selected display names (multiple items joined)
  const getSelectedDisplayNames = useCallback(() => {
    const names = {
      // Single display (for compact)
      paper: '',
      paperShort: '',
      // Arrays of ALL selected items
      unitNames: [],
      unitShorts: [],
      chapterNames: [],
      chapterShorts: [],
      topicNames: [],
      topicShorts: [],
      typeNames: [],
      // Counts
      unitCount: mainFilters.units.length,
      chapterCount: mainFilters.chapters.length,
      topicCount: mainFilters.topics.length,
      typeCount: mainFilters.types.length
    };

    // Paper
    if (mainFilters.papers.length === 2) {
      names.paper = t('संयुक्त', 'Combined');
      names.paperShort = 'P1+P2';
    } else if (mainFilters.papers.includes('paper1')) {
      names.paper = t('पेपर 1', 'Paper 1');
      names.paperShort = 'P1';
    } else if (mainFilters.papers.includes('paper2')) {
      names.paper = t('पेपर 2 (इतिहास)', 'Paper 2 (History)');
      names.paperShort = 'P2';
    }

    // Units - get ALL selected unit names
    const unitOptions = getUnitOptions(mainFilters.papers);
    mainFilters.units.forEach(unitKey => {
      const opt = unitOptions.find(o => o.value === unitKey);
      if (opt) {
        names.unitNames.push(opt.label);
        names.unitShorts.push(opt.shortName);
      }
    });

    // Chapters - get ALL selected chapter names
    const chapterOptions = getChapterOptions(mainFilters.units, mainFilters.papers);
    mainFilters.chapters.forEach(chKey => {
      const opt = chapterOptions.find(o => o.value === chKey);
      if (opt) {
        names.chapterNames.push(opt.label);
        names.chapterShorts.push(opt.shortName);
      }
    });

    // Topics - get ALL selected topic names
    const topicOptions = getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers);
    mainFilters.topics.forEach(topicVal => {
      const opt = topicOptions.find(o => o.value === topicVal);
      if (opt) {
        names.topicNames.push(opt.label);
        names.topicShorts.push(opt.shortName);
      }
    });

    // Types - get ALL selected type names
    mainFilters.types.forEach(typeVal => {
      const opt = getTypeOptions().find(o => o.value === typeVal);
      if (opt) {
        names.typeNames.push(opt.label);
      }
    });

    return names;
  }, [mainFilters, getUnitOptions, getChapterOptions, getTopicOptions, language]);

  // Build title parts array - ALL selections included
  const buildTitleParts = useCallback((names, maxItemsPerLevel = 3, maxPartLen = 30) => {
    const parts = [];

    // Paper always first
    if (names.paperShort) {
      parts.push(names.paperShort);
    }

    // Units
    if (names.unitCount > 0) {
      if (names.unitCount <= maxItemsPerLevel) {
        const unitStr = names.unitShorts.map(u => truncStr(u, maxPartLen)).join(', ');
        parts.push(unitStr);
      } else {
        parts.push(`${names.unitCount} ${t('इकाइयाँ', 'Units')}`);
      }
    }

    // Chapters
    if (names.chapterCount > 0) {
      if (names.chapterCount <= maxItemsPerLevel) {
        const chStr = names.chapterShorts.map(c => truncStr(c, maxPartLen)).join(', ');
        parts.push(chStr);
      } else {
        parts.push(`${names.chapterCount} ${t('अध्याय', 'Chapters')}`);
      }
    }

    // Topics
    if (names.topicCount > 0) {
      if (names.topicCount <= maxItemsPerLevel) {
        const topicStr = names.topicShorts.map(tp => truncStr(tp, maxPartLen)).join(', ');
        parts.push(topicStr);
      } else {
        parts.push(`${names.topicCount} ${t('विषय', 'Topics')}`);
      }
    }

    return parts;
  }, [language]);

  // Generate smart auto title with ALL selections
  const generateAutoTitle = useCallback(() => {
    const typeConfig = TEST_TYPE_CONFIG[formData.testType];
    const names = getSelectedDisplayNames();
    const shortCode = typeConfig?.shortCode || 'TEST';

    // Build all parts
    const titleParts = buildTitleParts(names, 2, 28);

    // Join with " | " separator
    const selectionStr = titleParts.length > 0 ? titleParts.join(' | ') : names.paperShort || 'P1';

    switch (formData.testType) {
      case 'dpp':
        return `${selectionStr} - DPP #${testNumber}`;

      case 'topic_test':
        return `${selectionStr} - TT #${testNumber}`;

      case 'chapter_test':
        return `${selectionStr} - CT #${testNumber}`;

      case 'unit_test':
        return `${selectionStr} - UT #${testNumber}`;

      case 'pyq_year': {
        const currentYear = new Date().getFullYear();
        return `PYQ ${currentYear} | ${selectionStr} #${testNumber}`;
      }

      case 'practice':
        return `${selectionStr} - Practice #${testNumber}`;

      case 'full_mock_p1':
        return `Full Mock Paper 1 - #${testNumber}`;

      case 'full_mock_p2':
        return `Full Mock Paper 2 (History) - #${testNumber}`;

      case 'full_mock_combined':
        return `Full Mock Combined (P1 + P2) - #${testNumber}`;

      default:
        return `${selectionStr} - ${shortCode} #${testNumber}`;
    }
  }, [formData.testType, getSelectedDisplayNames, buildTitleParts, testNumber]);

  // Generate alternative title suggestions with ALL selections
  const generateTitleSuggestions = useCallback(() => {
    const typeConfig = TEST_TYPE_CONFIG[formData.testType];
    const names = getSelectedDisplayNames();
    const shortCode = typeConfig?.shortCode || 'TEST';
    const suggestions = [];

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const monthYear = now.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    // Build detailed part (show more items)
    const detailedParts = buildTitleParts(names, 3, 35);
    const detailedStr = detailedParts.join(' | ');

    // Build compact part (fewer items)
    const compactParts = buildTitleParts(names, 1, 20);
    const compactStr = compactParts.join(' | ');

    switch (formData.testType) {
      case 'dpp':
        suggestions.push(`${detailedStr} - DPP (${dateStr})`);
        suggestions.push(`DPP #${testNumber} | ${compactStr}`);
        if (names.topicCount > 0) {
          suggestions.push(`${names.topicShorts.slice(0, 2).join(', ')} - Daily Practice`);
        }
        suggestions.push(`${names.paperShort} DPP - ${dateStr}`);
        break;

      case 'topic_test':
        suggestions.push(`${detailedStr} - ${t('विषय परीक्षा', 'Topic Test')}`);
        suggestions.push(`TT: ${compactStr} #${testNumber}`);
        suggestions.push(`${names.paperShort} Topic Test - ${monthYear}`);
        break;

      case 'chapter_test':
        suggestions.push(`${detailedStr} - ${t('अध्याय परीक्षा', 'Chapter Test')}`);
        suggestions.push(`CT: ${compactStr} #${testNumber}`);
        suggestions.push(`${names.paperShort} Chapter Test #${testNumber}`);
        break;

      case 'unit_test':
        suggestions.push(`${detailedStr} - Complete Test`);
        suggestions.push(`UT: ${compactStr} #${testNumber}`);
        suggestions.push(`${names.paper} Unit Test - ${monthYear}`);
        break;

      case 'practice':
        suggestions.push(`Practice | ${detailedStr} - ${dateStr}`);
        suggestions.push(`${names.paperShort} Quick Practice #${testNumber}`);
        if (names.topicCount > 0) {
          suggestions.push(`${names.topicShorts.slice(0, 2).join(', ')} - Practice`);
        }
        break;

      case 'pyq_year': {
        const yr = new Date().getFullYear();
        suggestions.push(`PYQ ${yr} Dec | ${compactStr}`);
        suggestions.push(`PYQ ${yr} Jun | ${compactStr}`);
        suggestions.push(`${names.paper} - PYQ ${yr}`);
        break;
      }

      case 'full_mock_p1':
      case 'full_mock_p2':
      case 'full_mock_combined':
        suggestions.push(`Mock Test - ${monthYear}`);
        suggestions.push(`${shortCode} - ${dateStr}`);
        suggestions.push(`NTA Pattern Mock #${testNumber}`);
        break;

      default:
        suggestions.push(`${detailedStr} - ${shortCode}`);
        suggestions.push(`${compactStr} - Test #${testNumber}`);
        break;
    }

    return [...new Set(suggestions)].filter(s => s && s.trim()).slice(0, 4);
  }, [formData.testType, getSelectedDisplayNames, buildTitleParts, testNumber, language]);

  // Memoized generated title
  const generatedTitle = useMemo(() => {
    if (formData.title.trim()) return formData.title;
    return generateAutoTitle();
  }, [formData.title, generateAutoTitle]);

  // Memoized suggestions
  const titleSuggestions = useMemo(() => {
    return generateTitleSuggestions();
  }, [generateTitleSuggestions]);

  // Copy title to clipboard
  const copyTitle = async () => {
    try {
      await navigator.clipboard.writeText(generatedTitle);
      toast.success(t('शीर्षक कॉपी किया गया!', 'Title copied!'));
    } catch (err) {
      toast.error(t('कॉपी करने में विफल', 'Failed to copy'));
    }
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  // Update defaults based on test type
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

  // Auto increment test number
  useEffect(() => {
    setTestNumber(Math.floor(Math.random() * 10) + 1);
  }, [formData.testType, mainFilters]);

  // Initialize questions per unit for random mode
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

  // Sync modal filters with main filters when modal opens
  useEffect(() => {
    if (showQuestionSelector) {
      setModalFilters({
        papers: [...mainFilters.papers],
        units: [...mainFilters.units],
        chapters: [...mainFilters.chapters],
        topics: [...mainFilters.topics],
        types: [...mainFilters.types]
      });
      loadQuestions(mainFilters);
    }
  }, [showQuestionSelector]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Update main filters
  const updateMainFilter = (field, value) => {
    setMainFilters(prev => {
      const newFilters = { ...prev, [field]: value };

      // Cascade reset child filters
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

  // Update modal filters
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

  // Load questions with filters
  const loadQuestions = async (filters = modalFilters) => {
    try {
      const apiFilters = {
        limit: 200,
        sort: '-createdAt',
      };

      if (filters.papers.length > 0) {
        apiFilters.paper = filters.papers;
      }

      if (filters.units.length > 0) {
        const unitNames = filters.units.map(key => {
          const [paper, unitId] = key.split('_');
          const syllabus = getSyllabus(paper);
          const unit = syllabus.units?.find(u => u.id.toString() === unitId);
          return unit?.name;
        }).filter(Boolean);
        if (unitNames.length > 0) apiFilters.unit = unitNames;
      }

      if (filters.chapters.length > 0) {
        const chapterNames = filters.chapters.map(key => {
          const parts = key.split('_');
          const paper = parts[0];
          const unitId = parts[1];
          const chapterId = parts[2];
          const syllabus = getSyllabus(paper);
          const unit = syllabus.units?.find(u => u.id.toString() === unitId);
          const chapter = unit?.chapters?.find(c => c.id.toString() === chapterId);
          return chapter?.name;
        }).filter(Boolean);
        if (chapterNames.length > 0) apiFilters.chapter = chapterNames;
      }

      if (filters.topics.length > 0) apiFilters.topic = filters.topics;
      if (filters.types.length > 0) apiFilters.questionType = filters.types;
      if (searchQuery.trim()) apiFilters.search = searchQuery.trim();

      await fetchQuestions(apiFilters);
    } catch (err) {
      console.error('Failed to load questions:', err);
      toast.error(t('प्रश्न लोड करने में विफल', 'Failed to load questions'));
    }
  };

  // Apply modal filters
  const applyModalFilters = () => {
    loadQuestions(modalFilters);
  };

  // Toggle question selection
  const toggleQuestion = (question) => {
    setSelectedQuestions(prev => {
      const isSelected = prev.some(q => q._id === question._id);
      if (isSelected) return prev.filter(q => q._id !== question._id);
      return [...prev, question];
    });
  };

  const selectAllQuestions = () => {
    const newQuestions = questions.filter(q => !selectedQuestions.some(sq => sq._id === q._id));
    setSelectedQuestions(prev => [...prev, ...newQuestions]);
  };

  const clearAllQuestions = () => setSelectedQuestions([]);

  const clearAllFilters = (target = 'modal') => {
    const emptyFilters = { papers: ['paper1'], units: [], chapters: [], topics: [], types: [] };
    if (target === 'modal') {
      setModalFilters(emptyFilters);
    } else {
      setMainFilters(emptyFilters);
    }
    setSearchQuery('');
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

  const getTotalDistributed = () => {
    return Object.values(questionsPerUnit).reduce((sum, val) => sum + (val || 0), 0);
  };

  // Get active filters count
  const getActiveFiltersCount = (filters) => {
    return filters.units.length + filters.chapters.length + filters.topics.length + filters.types.length;
  };

  // Validate form
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('कृपया सभी त्रुटियां ठीक करें', 'Please fix all errors'));
      return;
    }

    try {
      const paperValue = mainFilters.papers.length === 2 ? 'combined' : mainFilters.papers[0] || 'paper1';
      const finalTitle = formData.title.trim() || generateAutoTitle();

      // Build unit/chapter/topic from mainFilters for DB
      const unitNames = mainFilters.units.map(key => {
        const [paper, unitId] = key.split('_');
        const syllabus = getSyllabus(paper);
        return syllabus.units?.find(u => u.id.toString() === unitId)?.name;
      }).filter(Boolean).join(', ');

      const chapterNames = mainFilters.chapters.map(key => {
        const parts = key.split('_');
        const syllabus = getSyllabus(parts[0]);
        const unit = syllabus.units?.find(u => u.id.toString() === parts[1]);
        return unit?.chapters?.find(c => c.id.toString() === parts[2])?.name;
      }).filter(Boolean).join(', ');

      const topicNames = mainFilters.topics.join(', ');

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
      navigate('/tests');
    } catch (err) {
      toast.error(err.message || t('परीक्षा बनाने में त्रुटि', 'Error creating test'));
    }
  };

  // ==========================================
  // HELPER: Build selection summary tags
  // ==========================================
  const getSelectionSummaryTags = () => {
    const tags = [];
    const names = getSelectedDisplayNames();

    // Paper
    tags.push({
      label: names.paperShort || 'P1',
      color: 'bg-gray-100 text-gray-700',
      type: 'paper'
    });

    // Test Type
    tags.push({
      label: TEST_TYPE_CONFIG[formData.testType]?.shortCode || 'TEST',
      color: 'bg-primary-100 text-primary-700',
      type: 'type'
    });

    // Units
    names.unitShorts.forEach((name, i) => {
      tags.push({
        label: truncStr(name, 18),
        fullLabel: names.unitNames[i],
        color: 'bg-blue-50 text-blue-700',
        type: 'unit'
      });
    });
    if (names.unitCount > 3) {
      tags.splice(tags.length - names.unitCount + 3, names.unitCount - 3, {
        label: `+${names.unitCount - 3} ${t('और', 'more')}`,
        color: 'bg-blue-50 text-blue-500',
        type: 'unit'
      });
    }

    // Chapters
    names.chapterShorts.forEach((name, i) => {
      tags.push({
        label: truncStr(name, 18),
        fullLabel: names.chapterNames[i],
        color: 'bg-green-50 text-green-700',
        type: 'chapter'
      });
    });
    if (names.chapterCount > 3) {
      tags.splice(tags.length - names.chapterCount + 3, names.chapterCount - 3, {
        label: `+${names.chapterCount - 3} ${t('और', 'more')}`,
        color: 'bg-green-50 text-green-500',
        type: 'chapter'
      });
    }

    // Topics
    names.topicShorts.forEach((name, i) => {
      tags.push({
        label: truncStr(name, 18),
        fullLabel: names.topicNames[i],
        color: 'bg-orange-50 text-orange-700',
        type: 'topic'
      });
    });
    if (names.topicCount > 3) {
      tags.splice(tags.length - names.topicCount + 3, names.topicCount - 3, {
        label: `+${names.topicCount - 3} ${t('और', 'more')}`,
        color: 'bg-orange-50 text-orange-500',
        type: 'topic'
      });
    }

    return tags;
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6 pb-8">
      {/* ====== HEADER ====== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/tests')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('नई परीक्षा बनाएं', 'Create New Test')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('परीक्षा विवरण भरें और प्रश्न चुनें', 'Fill test details and select questions')}
            </p>
          </div>
        </div>

        {/* Random Mode Toggle */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-xl">
          <Shuffle className={`w-4 h-4 ${isRandomMode ? 'text-primary-600' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">{t('रैंडम मोड', 'Random Mode')}</span>
          <button
            type="button"
            onClick={() => setIsRandomMode(!isRandomMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isRandomMode ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRandomMode ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====== TEST TYPE SELECTION ====== */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            {t('परीक्षा प्रकार', 'Test Type')}
          </h2>

          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {Object.entries(TEST_TYPE_CONFIG).map(([key, config]) => {
              const isSelected = formData.testType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleChange('testType', key)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`text-xs font-bold mb-1 ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                    {config.shortCode}
                  </div>
                  <div className={`text-[10px] leading-tight ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                    {t(config.nameHi.split(' ').slice(0, 2).join(' '), config.name.split(' ').slice(0, 2).join(' '))}
                  </div>
                  {isSelected && (
                    <Check className="w-3 h-3 text-primary-600 mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ====== PAPER & FILTERS ====== */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary-600" />
              {t('पेपर और फ़िल्टर', 'Paper & Filters')}
              {getActiveFiltersCount(mainFilters) > 0 && (
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {getActiveFiltersCount(mainFilters)} {t('सक्रिय', 'active')}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => clearAllFilters('main')}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                {t('रीसेट', 'Reset')}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Paper Selection - Toggle Buttons */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  {t('पेपर चुनें', 'Select Paper')} *
                </label>
                <div className="flex gap-3 mt-2">
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
                      className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        mainFilters.papers.includes(key)
                          ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {mainFilters.papers.includes(key) && <Check className="w-4 h-4" />}
                        {t(label.hi, label.en)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit, Chapter, Topic, Type Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Unit */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-gray-400" />
                    {t('इकाई', 'Unit')}
                  </label>
                  <div className="mt-1">
                    <MultiSelectDropdown
                      label={t('इकाई चुनें', 'Select Unit')}
                      options={getUnitOptions(mainFilters.papers)}
                      selected={mainFilters.units}
                      onChange={(val) => updateMainFilter('units', val)}
                      showSearch
                    />
                  </div>
                </div>

                {/* Chapter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    {t('अध्याय', 'Chapter')}
                  </label>
                  <div className="mt-1">
                    <MultiSelectDropdown
                      label={t('अध्याय चुनें', 'Select Chapter')}
                      options={getChapterOptions(mainFilters.units, mainFilters.papers)}
                      selected={mainFilters.chapters}
                      onChange={(val) => updateMainFilter('chapters', val)}
                      disabled={mainFilters.units.length === 0}
                      showSearch
                    />
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    {t('विषय', 'Topic')}
                  </label>
                  <div className="mt-1">
                    <MultiSelectDropdown
                      label={t('विषय चुनें', 'Select Topic')}
                      options={getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers)}
                      selected={mainFilters.topics}
                      onChange={(val) => updateMainFilter('topics', val)}
                      disabled={mainFilters.chapters.length === 0}
                      showSearch
                    />
                  </div>
                </div>

                {/* Question Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">
                    {t('प्रश्न प्रकार', 'Question Type')}
                  </label>
                  <div className="mt-1">
                    <MultiSelectDropdown
                      label={t('प्रकार चुनें', 'Select Type')}
                      options={getTypeOptions()}
                      selected={mainFilters.types}
                      onChange={(val) => updateMainFilter('types', val)}
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {getActiveFiltersCount(mainFilters) > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {mainFilters.units.map(unit => {
                    const opt = getUnitOptions(mainFilters.papers).find(o => o.value === unit);
                    return (
                      <span key={unit} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {opt?.shortName || opt?.label?.split(':').pop()?.trim()}
                        <X className="w-3 h-3 cursor-pointer hover:text-blue-900" onClick={() => updateMainFilter('units', mainFilters.units.filter(u => u !== unit))} />
                      </span>
                    );
                  })}
                  {mainFilters.chapters.map(chapter => {
                    const opt = getChapterOptions(mainFilters.units, mainFilters.papers).find(o => o.value === chapter);
                    return (
                      <span key={chapter} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {opt?.shortName?.substring(0, 20) || 'Ch'}
                        <X className="w-3 h-3 cursor-pointer hover:text-green-900" onClick={() => updateMainFilter('chapters', mainFilters.chapters.filter(c => c !== chapter))} />
                      </span>
                    );
                  })}
                  {mainFilters.topics.map(topic => (
                    <span key={topic} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      {topic.substring(0, 20)}
                      <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={() => updateMainFilter('topics', mainFilters.topics.filter(tp => tp !== topic))} />
                    </span>
                  ))}
                  {mainFilters.types.map(type => {
                    const opt = getTypeOptions().find(o => o.value === type);
                    return (
                      <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                        {opt?.label}
                        <X className="w-3 h-3 cursor-pointer hover:text-orange-900" onClick={() => updateMainFilter('types', mainFilters.types.filter(tp => tp !== type))} />
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ====== AUTO TITLE SECTION (ENHANCED - ALL SELECTIONS) ====== */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary-600" />
              {t('परीक्षा शीर्षक', 'Test Title')}
            </h2>
            <button
              type="button"
              onClick={() => {
                handleChange('title', '');
                setIsEditingTitle(false);
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Wand2 className="w-4 h-4" />
              {t('स्वतः उत्पन्न', 'Auto Generate')}
            </button>
          </div>

          {/* Title Preview */}
          <TitlePreview
            title={generatedTitle}
            testType={formData.testType}
            language={language}
            onCopy={copyTitle}
            onEdit={() => setIsEditingTitle(true)}
          />

          {/* Manual Title Input */}
          {isEditingTitle && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2">
                {t('कस्टम शीर्षक', 'Custom Title')}
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder={t('अपना शीर्षक लिखें...', 'Enter your title...')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    handleChange('title', '');
                    setIsEditingTitle(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          )}

          {/* Title Suggestions */}
          {!isEditingTitle && (
            <TitleSuggestions
              suggestions={titleSuggestions}
              onSelect={(suggestion) => handleChange('title', suggestion)}
              language={language}
            />
          )}

          {/* Selection Summary for Title - Shows ALL selections */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" />
              {t('शीर्षक इन चयनों पर आधारित है:', 'Title based on these selections:')}
            </p>
            <div className="flex flex-wrap gap-2">
              {getSelectionSummaryTags().map((tag, idx) => (
                <span
                  key={`${tag.type}-${idx}`}
                  className={`px-2 py-1 rounded text-xs font-medium ${tag.color}`}
                  title={tag.fullLabel || tag.label}
                >
                  {tag.label}
                </span>
              ))}

              {/* Show "nothing selected" hint if no filters */}
              {mainFilters.units.length === 0 &&
               mainFilters.chapters.length === 0 &&
               mainFilters.topics.length === 0 && (
                <span className="text-xs text-gray-400 italic flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t('फ़िल्टर चुनें → शीर्षक में दिखेंगे', 'Select filters → they appear in title')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ====== TEST SETTINGS ====== */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            {t('परीक्षा सेटिंग्स', 'Test Settings')}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                {t('अवधि (मिनट)', 'Duration (min)')} *
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                min="1"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 mt-1 ${errors.duration ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>

            {/* Total Questions (Random Mode) */}
            {isRandomMode && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">
                  {t('कुल प्रश्न', 'Total Questions')} *
                </label>
                <input
                  type="number"
                  value={formData.totalQuestions}
                  onChange={(e) => handleChange('totalQuestions', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mt-1"
                />
              </div>
            )}

            {/* Marks Per Question */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">
                {t('प्रति प्रश्न अंक', 'Marks/Question')}
              </label>
              <input
                type="number"
                value={formData.marksPerQuestion}
                onChange={(e) => handleChange('marksPerQuestion', parseFloat(e.target.value) || 0)}
                min="0" step="0.5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mt-1"
              />
            </div>

            {/* Negative Marking */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2">
                {t('नकारात्मक अंकन', 'Negative Marking')}
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleChange('negativeMarking', !formData.negativeMarking)}
                  className={`px-3 py-2 rounded-lg border font-medium transition-all flex items-center gap-1 ${
                    formData.negativeMarking ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  {formData.negativeMarking ? t('हां', 'Yes') : t('नहीं', 'No')}
                </button>
                {formData.negativeMarking && (
                  <input
                    type="number"
                    value={formData.negativeMarks}
                    onChange={(e) => handleChange('negativeMarks', parseFloat(e.target.value) || 0)}
                    min="0" step="0.25"
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====== RANDOM MODE: UNIT DISTRIBUTION ====== */}
        {isRandomMode && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-primary-600" />
                {t('यूनिट वितरण', 'Unit Distribution')}
                <span className={`ml-2 text-sm font-medium px-3 py-1 rounded-full ${
                  getTotalDistributed() === formData.totalQuestions
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {getTotalDistributed()} / {formData.totalQuestions}
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <button type="button" onClick={distributeEqually} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <RotateCcw className="w-4 h-4" />
                  {t('समान वितरण', 'Equal')}
                </button>
                <button type="button" onClick={() => setShowUnitDistribution(!showUnitDistribution)} className="p-2 hover:bg-gray-100 rounded-lg">
                  {showUnitDistribution ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {errors.distribution && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.distribution}</span>
              </div>
            )}

            {showUnitDistribution && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {getAllUnits().map((unit) => (
                  <div key={unit.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                        {t(unit.paperNameHi, unit.paperName)}
                      </span>
                      <span className="font-medium text-gray-800 text-sm">{t(unit.nameHi, unit.name)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleQuestionsPerUnitChange(unit.key, (questionsPerUnit[unit.key] || 0) - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-white text-gray-600 font-bold">-</button>
                      <input type="number" value={questionsPerUnit[unit.key] || 0} onChange={(e) => handleQuestionsPerUnitChange(unit.key, e.target.value)} className="w-14 text-center px-2 py-1.5 border rounded-lg" min="0" />
                      <button type="button" onClick={() => handleQuestionsPerUnitChange(unit.key, (questionsPerUnit[unit.key] || 0) + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-white text-gray-600 font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== MANUAL MODE: QUESTION SELECTOR ====== */}
        {!isRandomMode && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                {t('प्रश्न चुनें', 'Select Questions')}
                <span className="ml-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
                  {selectedQuestions.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setShowQuestionSelector(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                {t('प्रश्न जोड़ें', 'Add Questions')}
              </button>
            </div>

            {errors.questions && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.questions}</span>
              </div>
            )}

            {selectedQuestions.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedQuestions.map((q, i) => (
                  <div key={q._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-lg text-sm font-bold flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{q.question?.[language] || q.question?.hi || '...'}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">{q.paper === 'paper1' ? 'P1' : 'P2'}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded truncate max-w-[100px]">{q.unit}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">{QUESTION_TYPE_LABELS[q.questionType]?.[language] || q.questionType}</span>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => toggleQuestion(q)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{t('कोई प्रश्न नहीं चुना गया', 'No questions selected')}</p>
                <p className="text-sm mt-1">{t('"प्रश्न जोड़ें" बटन पर क्लिक करें', 'Click "Add Questions" button')}</p>
              </div>
            )}
          </div>
        )}

        {/* ====== QUESTION SELECTOR MODAL ====== */}
        {showQuestionSelector && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[92vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-primary-50 to-white flex-shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{t('प्रश्न लाइब्रेरी', 'Question Library')}</h3>
                  <p className="text-sm text-gray-500">{t('प्रश्न खोजें और चुनें', 'Search and select questions')}</p>
                </div>
                <button onClick={() => setShowQuestionSelector(false)} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 bg-white border-b flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyModalFilters()}
                    placeholder={t('प्रश्न खोजें...', 'Search questions...')}
                    className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={applyModalFilters}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                  >
                    {t('खोजें', 'Search')}
                  </button>
                </div>
              </div>

              {/* MODAL FILTERS */}
              <div className="p-4 bg-gray-50 border-b space-y-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">{t('फ़िल्टर', 'Filters')}</span>
                    {getActiveFiltersCount(modalFilters) > 0 && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">{getActiveFiltersCount(modalFilters)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <SortDesc className="w-3 h-3" /> {t('नवीनतम', 'Newest')}
                    </span>
                    <button type="button" onClick={() => clearAllFilters('modal')} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                      {t('फ़िल्टर साफ़', 'Clear')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {/* Paper */}
                  <MultiSelectDropdown
                    label={t('पेपर', 'Paper')}
                    options={getPaperOptions()}
                    selected={modalFilters.papers}
                    onChange={(val) => updateModalFilter('papers', val)}
                  />

                  {/* Unit */}
                  <MultiSelectDropdown
                    label={t('इकाई', 'Unit')}
                    options={getUnitOptions(modalFilters.papers)}
                    selected={modalFilters.units}
                    onChange={(val) => updateModalFilter('units', val)}
                    showSearch
                  />

                  {/* Chapter */}
                  <MultiSelectDropdown
                    label={t('अध्याय', 'Chapter')}
                    options={getChapterOptions(modalFilters.units, modalFilters.papers)}
                    selected={modalFilters.chapters}
                    onChange={(val) => updateModalFilter('chapters', val)}
                    disabled={modalFilters.units.length === 0}
                    showSearch
                  />

                  {/* Topic */}
                  <MultiSelectDropdown
                    label={t('विषय', 'Topic')}
                    options={getTopicOptions(modalFilters.chapters, modalFilters.units, modalFilters.papers)}
                    selected={modalFilters.topics}
                    onChange={(val) => updateModalFilter('topics', val)}
                    disabled={modalFilters.chapters.length === 0}
                    showSearch
                  />

                  {/* Type */}
                  <MultiSelectDropdown
                    label={t('प्रश्न प्रकार', 'Type')}
                    options={getTypeOptions()}
                    selected={modalFilters.types}
                    onChange={(val) => updateModalFilter('types', val)}
                  />
                </div>

                {/* Apply & Quick Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={applyModalFilters} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                    <RefreshCw className="w-4 h-4" />
                    {t('फ़िल्टर लागू करें', 'Apply Filters')}
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={selectAllQuestions} className="text-sm text-primary-600 font-medium hover:underline">{t('सभी चुनें', 'Select All')}</button>
                    <button type="button" onClick={clearAllQuestions} className="text-sm text-red-600 font-medium hover:underline">{t('चयन साफ़', 'Clear')}</button>
                  </div>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex border-b bg-white flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'all' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('सभी प्रश्न', 'All Questions')} ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('selected')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'selected' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('चुने हुए', 'Selected')} ({selectedQuestions.length})
                </button>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {questionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader size="lg" />
                    <p className="mt-4 text-gray-500">{t('लोड हो रहा है...', 'Loading...')}</p>
                  </div>
                ) : (activeTab === 'all' ? questions : selectedQuestions).length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium text-lg">
                      {activeTab === 'all' ? t('कोई प्रश्न नहीं मिला', 'No questions found') : t('कोई प्रश्न नहीं चुना', 'No questions selected')}
                    </p>
                    <p className="text-sm mt-2">{activeTab === 'all' ? t('फ़िल्टर बदलकर देखें', 'Try different filters') : t('प्रश्न चुनने के लिए क्लिक करें', 'Click to select')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(activeTab === 'all' ? questions : selectedQuestions).map((q) => {
                      const isSelected = selectedQuestions.some(sq => sq._id === q._id);
                      return (
                        <div
                          key={q._id}
                          onClick={() => toggleQuestion(q)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-transparent bg-white hover:border-gray-300 hover:shadow-sm'}`}
                        >
                          <div className="flex gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{q.paper === 'paper1' ? 'P1' : 'P2'}</span>
                                {q.unit && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium truncate max-w-[120px]">{q.unit}</span>}
                                {q.chapter && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium truncate max-w-[120px]">{q.chapter}</span>}
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">{QUESTION_TYPE_LABELS[q.questionType]?.[language] || q.questionType}</span>
                              </div>
                              <p className="text-gray-800 font-medium line-clamp-2">{q.question?.[language] || q.question?.hi || q.question?.en}</p>
                              {(q.topic || q.chapter) && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {q.chapter && <span>{q.chapter}</span>}
                                  {q.chapter && q.topic && <span> • </span>}
                                  {q.topic && <span>{q.topic}</span>}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-sm"><strong className="text-primary-600">{selectedQuestions.length}</strong> {t('प्रश्न चुने', 'selected')}</span>
                  {selectedQuestions.length > 0 && (
                    <span className="text-sm text-gray-500">{t('कुल अंक:', 'Total:')} {selectedQuestions.length * formData.marksPerQuestion}</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowQuestionSelector(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                    {t('रद्द करें', 'Cancel')}
                  </button>
                  <button type="button" onClick={() => setShowQuestionSelector(false)} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t('पूर्ण', 'Done')} ({selectedQuestions.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== SUMMARY CARD ====== */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-600" />
            {t('परीक्षा सारांश', 'Test Summary')}
          </h3>

          {/* Title in summary */}
          <div className="mb-4 p-3 bg-white rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">{t('शीर्षक', 'Title')}</p>
            <p className="font-semibold text-gray-900">{generatedTitle}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary-600">{isRandomMode ? getTotalDistributed() : selectedQuestions.length}</p>
              <p className="text-xs text-gray-500 mt-1">{t('प्रश्न', 'Questions')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-600">{formData.duration}</p>
              <p className="text-xs text-gray-500 mt-1">{t('मिनट', 'Minutes')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-blue-600">{(isRandomMode ? getTotalDistributed() : selectedQuestions.length) * formData.marksPerQuestion}</p>
              <p className="text-xs text-gray-500 mt-1">{t('कुल अंक', 'Total Marks')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{mainFilters.papers.length === 2 ? t('दोनों', 'Both') : mainFilters.papers.includes('paper1') ? 'P1' : 'P2'}</p>
              <p className="text-xs text-gray-500 mt-1">{t('पेपर', 'Paper')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{formData.negativeMarking ? `-${formData.negativeMarks}` : '0'}</p>
              <p className="text-xs text-gray-500 mt-1">{t('नेगेटिव', 'Negative')}</p>
            </div>
          </div>

          {/* Filters selected summary in card */}
          {(mainFilters.units.length > 0 || mainFilters.chapters.length > 0 || mainFilters.topics.length > 0) && (
            <div className="mt-4 pt-4 border-t border-primary-200">
              <p className="text-xs text-gray-600 mb-2">{t('चयनित फ़िल्टर:', 'Selected Filters:')}</p>
              <div className="flex flex-wrap gap-1.5">
                {getSelectionSummaryTags().map((tag, idx) => (
                  <span
                    key={`summary-${tag.type}-${idx}`}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${tag.color}`}
                    title={tag.fullLabel || tag.label}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ====== SUBMIT BUTTONS ====== */}
        <div className="flex justify-end gap-4 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 -mx-4 rounded-xl shadow-lg border">
          <button type="button" onClick={() => navigate('/tests')} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium shadow-sm">
            {t('रद्द करें', 'Cancel')}
          </button>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium shadow-lg flex items-center gap-2">
            {loading ? <><Loader size="sm" color="white" /> {t('बना रहा है...', 'Creating...')}</> : <><Save className="w-5 h-5" /> {t('परीक्षा बनाएं', 'Create Test')}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestCreate;