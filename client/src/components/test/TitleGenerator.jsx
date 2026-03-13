// client/src/components/test/TitleGenerator.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Hash,
  Sparkles,
  Wand2,
  Copy,
  Edit3,
  Check,
  RefreshCw,
  Zap,
  Star,
  Clock,
  Calendar,
  Target,
  BookOpen,
  Layers,
  ChevronRight,
  X,
  Lightbulb,
  Shuffle,
  ArrowRight
} from 'lucide-react';
import { TEST_TYPE_CONFIG } from '../../utils/constants';

// ============================================
// TITLE SUGGESTION CHIP
// ============================================
const TitleSuggestionChip = ({ suggestion, onSelect, isSelected, index }) => {
  const colors = [
    'from-blue-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500'
  ];

  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion)}
      className={`
        group relative px-4 py-3 rounded-xl border-2 text-left transition-all duration-300
        ${isSelected
          ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30 shadow-lg shadow-primary-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-md'
        }
      `}
    >
      {/* Index Badge */}
      <div className={`
        absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white
        bg-gradient-to-br ${colors[index % colors.length]} shadow-lg
        group-hover:scale-110 transition-transform
      `}>
        {index + 1}
      </div>

      {/* Suggestion Text */}
      <p className={`text-sm font-medium pr-6 leading-relaxed ${
        isSelected 
          ? 'text-primary-700 dark:text-primary-300' 
          : 'text-gray-700 dark:text-gray-200'
      }`}>
        {suggestion}
      </p>

      {/* Apply Arrow */}
      <div className={`
        absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center
        transition-all duration-300
        ${isSelected 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100'
        }
      `}>
        {isSelected ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </div>
    </button>
  );
};

// ============================================
// MAIN TITLE GENERATOR COMPONENT
// ============================================
const TitleGenerator = ({
  formData,
  mainFilters,
  testNumber,
  language = 'hi',
  onTitleChange,
  getUnitOptions,
  getChapterOptions,
  getTopicOptions
}) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  
  const [isEditing, setIsEditing] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  
  const truncStr = (str, maxLen = 25) => {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
  };

  const getRandomNumber = () => Math.floor(Math.random() * 100) + 1;

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      dayStr: now.toLocaleDateString('en-IN', { day: '2-digit' }),
      month: now.toLocaleDateString('en-IN', { month: 'short' }),
      monthFull: now.toLocaleDateString('en-IN', { month: 'long' }),
      year: now.getFullYear(),
      yearShort: now.toLocaleDateString('en-IN', { year: '2-digit' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      weekday: now.toLocaleDateString('en-IN', { weekday: 'short' }),
      weekdayFull: now.toLocaleDateString('en-IN', { weekday: 'long' })
    };
  };

  // ==========================================
  // GET SELECTED DISPLAY NAMES
  // ==========================================
  
  const getSelectedNames = useCallback(() => {
    const names = {
      paper: '',
      paperShort: '',
      paperFull: '',
      unitNames: [],
      unitShorts: [],
      chapterNames: [],
      chapterShorts: [],
      topicNames: [],
      topicShorts: [],
      unitCount: mainFilters.units.length,
      chapterCount: mainFilters.chapters.length,
      topicCount: mainFilters.topics.length
    };

    // Paper
    if (mainFilters.papers.length === 2) {
      names.paper = t('संयुक्त', 'Combined');
      names.paperShort = 'P1+P2';
      names.paperFull = t('पेपर 1 + पेपर 2', 'Paper 1 + Paper 2');
    } else if (mainFilters.papers.includes('paper1')) {
      names.paper = t('पेपर 1', 'Paper 1');
      names.paperShort = 'P1';
      names.paperFull = t('पेपर 1 - सामान्य', 'Paper 1 - General');
    } else if (mainFilters.papers.includes('paper2')) {
      names.paper = t('पेपर 2', 'Paper 2');
      names.paperShort = 'P2';
      names.paperFull = t('पेपर 2 - इतिहास', 'Paper 2 - History');
    } else {
      names.paperShort = 'P1';
      names.paperFull = t('पेपर 1', 'Paper 1');
    }

    // Units
    if (getUnitOptions) {
      const unitOptions = getUnitOptions(mainFilters.papers);
      mainFilters.units.forEach(unitKey => {
        const opt = unitOptions.find(o => o.value === unitKey);
        if (opt) {
          names.unitNames.push(opt.label);
          // Extract short name (remove UNIT I: prefix)
          const shortName = opt.shortName || opt.label.replace(/^(P1|P2):\s*/i, '').replace(/^(UNIT|इकाई)\s*[IVX\d]+:\s*/i, '').trim();
          names.unitShorts.push(shortName);
        }
      });
    }

    // Chapters
    if (getChapterOptions) {
      const chapterOptions = getChapterOptions(mainFilters.units, mainFilters.papers);
      mainFilters.chapters.forEach(chKey => {
        const opt = chapterOptions.find(o => o.value === chKey);
        if (opt) {
          names.chapterNames.push(opt.label);
          names.chapterShorts.push(opt.shortName || opt.label);
        }
      });
    }

    // Topics
    if (getTopicOptions) {
      const topicOptions = getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers);
      mainFilters.topics.forEach(topicVal => {
        const opt = topicOptions.find(o => o.value === topicVal);
        if (opt) {
          names.topicNames.push(opt.label);
          names.topicShorts.push(opt.shortName || opt.label);
        }
      });
    }

    return names;
  }, [mainFilters, getUnitOptions, getChapterOptions, getTopicOptions, language]);

  // ==========================================
  // GENERATE TITLE SUGGESTIONS
  // ==========================================
  
  const generateTitleSuggestions = useCallback(() => {
    const typeConfig = TEST_TYPE_CONFIG[formData.testType];
    const names = getSelectedNames();
    const date = getCurrentDate();
    const shortCode = typeConfig?.shortCode || 'TEST';
    const num = testNumber || getRandomNumber();
    
    const suggestions = [];

    // Helper to join items with limit
    const joinItems = (items, limit = 2, separator = ', ') => {
      if (items.length === 0) return '';
      if (items.length <= limit) return items.map(i => truncStr(i, 22)).join(separator);
      return `${items.slice(0, limit).map(i => truncStr(i, 18)).join(separator)} +${items.length - limit}`;
    };

    // Most specific content selected
    const getMostSpecificContent = () => {
      if (names.topicCount > 0) {
        return { type: 'topic', items: names.topicShorts, label: t('विषय', 'Topics') };
      }
      if (names.chapterCount > 0) {
        return { type: 'chapter', items: names.chapterShorts, label: t('अध्याय', 'Chapters') };
      }
      if (names.unitCount > 0) {
        return { type: 'unit', items: names.unitShorts, label: t('इकाई', 'Units') };
      }
      return { type: 'paper', items: [names.paperShort], label: t('पेपर', 'Paper') };
    };

    const content = getMostSpecificContent();
    const contentStr = joinItems(content.items, 2);
    const contentStrLong = joinItems(content.items, 3);

    // Generate different title patterns based on test type
    switch (formData.testType) {
      case 'dpp':
        suggestions.push(
          `${names.paperShort} | ${contentStr} - DPP #${num}`,
          `DPP ${date.dayStr} ${date.month} | ${contentStr}`,
          `${contentStrLong} - ${t('दैनिक अभ्यास', 'Daily Practice')} #${num}`,
          `${t('डेली प्रैक्टिस', 'Daily Practice')} | ${names.paperShort} | ${contentStr}`,
          `${date.weekday} DPP - ${contentStr} | ${names.paperShort}`
        );
        break;

      case 'topic_test':
        suggestions.push(
          `${names.paperShort} | ${contentStr} - ${t('विषय परीक्षा', 'Topic Test')} #${num}`,
          `TT: ${contentStrLong} | ${date.month} ${date.yearShort}`,
          `${contentStr} - ${t('विषय टेस्ट', 'Topic Test')} | ${names.paperShort}`,
          `${t('विषय परीक्षण', 'Topic Assessment')} #${num} | ${contentStr}`,
          `${names.paperFull} | ${contentStr} - TT`
        );
        break;

      case 'chapter_test':
        suggestions.push(
          `${names.paperShort} | ${contentStr} - ${t('अध्याय परीक्षा', 'Chapter Test')} #${num}`,
          `CT: ${contentStrLong} | ${names.paperShort}`,
          `${contentStr} - ${t('चैप्टर टेस्ट', 'Chapter Test')} #${num}`,
          `${t('अध्याय परीक्षण', 'Chapter Assessment')} | ${contentStr}`,
          `${date.month} ${date.yearShort} | ${contentStr} - CT`
        );
        break;

      case 'unit_test':
        suggestions.push(
          `${names.paperShort} | ${contentStr} - ${t('इकाई परीक्षा', 'Unit Test')} #${num}`,
          `UT: ${contentStrLong} | ${names.paperShort}`,
          `${contentStr} - ${t('यूनिट टेस्ट', 'Unit Test')} #${num}`,
          `${t('इकाई परीक्षण', 'Unit Assessment')} | ${contentStr}`,
          `${names.paperFull} | ${contentStr} - ${t('संपूर्ण', 'Complete')}`
        );
        break;

      case 'pyq_year':
        const currentYear = date.year;
        const sessions = [
          { en: 'June', hi: 'जून' },
          { en: 'December', hi: 'दिसंबर' }
        ];
        suggestions.push(
          `PYQ ${currentYear} ${sessions[0].en} | ${names.paperShort} #${num}`,
          `${t('पिछले वर्ष के प्रश्न', 'Previous Year Questions')} | ${currentYear}`,
          `${names.paperShort} - PYQ ${currentYear} | ${contentStr}`,
          `PYQ ${currentYear-1}-${currentYear} | ${names.paperFull}`,
          `${currentYear} ${sessions[1][language]} | PYQ - ${names.paperShort}`
        );
        break;

      case 'practice':
        suggestions.push(
          `${names.paperShort} | ${contentStr} - ${t('अभ्यास', 'Practice')} #${num}`,
          `${t('प्रैक्टिस टेस्ट', 'Practice Test')} | ${contentStr}`,
          `${contentStrLong} - ${t('अभ्यास परीक्षा', 'Practice Test')} #${num}`,
          `${date.dayStr} ${date.month} | ${contentStr} - ${t('अभ्यास', 'Practice')}`,
          `Quick Practice | ${names.paperShort} | ${contentStr}`
        );
        break;

      case 'full_mock_p1':
        suggestions.push(
          `${t('फुल मॉक पेपर 1', 'Full Mock Paper 1')} - #${num}`,
          `FM-P1 | ${date.month} ${date.yearShort} | #${num}`,
          `NTA Pattern Mock | Paper 1 - ${num}`,
          `${t('पूर्ण मॉक परीक्षा', 'Complete Mock Test')} | P1 #${num}`,
          `Paper 1 Mock Test | ${date.dayStr} ${date.month} ${date.yearShort}`
        );
        break;

      case 'full_mock_p2':
        suggestions.push(
          `${t('फुल मॉक पेपर 2 (इतिहास)', 'Full Mock Paper 2 (History)')} - #${num}`,
          `FM-P2 | ${date.month} ${date.yearShort} | #${num}`,
          `NTA Pattern Mock | Paper 2 History - ${num}`,
          `${t('पूर्ण मॉक परीक्षा', 'Complete Mock Test')} | P2 #${num}`,
          `Paper 2 (History) Mock | ${date.dayStr} ${date.month}`
        );
        break;

      case 'full_mock_combined':
        suggestions.push(
          `${t('फुल मॉक संयुक्त', 'Full Mock Combined')} (P1 + P2) - #${num}`,
          `FM-Combined | ${date.month} ${date.yearShort} | #${num}`,
          `NTA Pattern Complete Mock | P1 + P2 - ${num}`,
          `${t('संपूर्ण मॉक परीक्षा', 'Complete Mock Test')} | Combined #${num}`,
          `UGC NET Full Mock | ${date.dayStr} ${date.month} ${date.yearShort}`
        );
        break;

      default:
        suggestions.push(
          `${names.paperShort} | ${contentStr} - ${shortCode} #${num}`,
          `${shortCode}: ${contentStrLong} | ${date.month} ${date.yearShort}`,
          `${contentStr} - Test #${num} | ${names.paperShort}`,
          `${names.paperFull} | ${contentStr}`,
          `${date.dayStr} ${date.month} | ${contentStr} - ${shortCode}`
        );
    }

    // Filter out duplicates and empty strings
    const uniqueSuggestions = [...new Set(suggestions)]
      .filter(s => s && s.trim())
      .slice(0, 5);

    return uniqueSuggestions;
  }, [formData.testType, getSelectedNames, testNumber, language, refreshKey]);

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  const suggestions = useMemo(() => generateTitleSuggestions(), [generateTitleSuggestions]);

  const currentTitle = useMemo(() => {
    if (formData.title && formData.title.trim()) {
      return formData.title;
    }
    return suggestions[0] || '';
  }, [formData.title, suggestions]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleSelectSuggestion = (suggestion) => {
    onTitleChange(suggestion);
    setIsEditing(false);
  };

  const handleCopyTitle = async (title, index = -1) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleRefreshSuggestions = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleClearCustomTitle = () => {
    onTitleChange('');
    setCustomTitle('');
    setIsEditing(false);
  };

  const handleSaveCustomTitle = () => {
    if (customTitle.trim()) {
      onTitleChange(customTitle.trim());
    }
    setIsEditing(false);
  };

  // Sync custom title with form
  useEffect(() => {
    if (isEditing) {
      setCustomTitle(formData.title || currentTitle);
    }
  }, [isEditing]);

  // ==========================================
  // GET TYPE CONFIG
  // ==========================================

  const typeConfig = TEST_TYPE_CONFIG[formData.testType];
  const typeGradient = {
    dpp: 'from-blue-500 to-indigo-600',
    topic_test: 'from-emerald-500 to-teal-600',
    chapter_test: 'from-purple-500 to-violet-600',
    unit_test: 'from-orange-500 to-amber-600',
    pyq_year: 'from-red-500 to-rose-600',
    practice: 'from-cyan-500 to-blue-600',
    full_mock_p1: 'from-indigo-500 to-purple-600',
    full_mock_p2: 'from-pink-500 to-rose-600',
    full_mock_combined: 'from-gray-600 to-slate-700'
  }[formData.testType] || 'from-gray-500 to-gray-600';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ========== MAIN TITLE PREVIEW ========== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${typeGradient} flex items-center justify-center shadow-lg`}>
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {t('परीक्षा शीर्षक', 'Test Title')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {formData.title ? t('कस्टम शीर्षक', 'Custom Title') : t('स्वतः उत्पन्न', 'Auto Generated')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshSuggestions}
                className="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-all shadow-sm hover:shadow-md group"
                title={t('नए सुझाव', 'New Suggestions')}
              >
                <RefreshCw className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:rotate-180 transition-all duration-500" />
              </button>
              <button
                type="button"
                onClick={() => handleCopyTitle(currentTitle)}
                className="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-all shadow-sm hover:shadow-md group"
                title={t('कॉपी करें', 'Copy')}
              >
                {copiedIndex === -1 ? (
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-all shadow-sm hover:shadow-md group"
                title={t('संपादित करें', 'Edit')}
              >
                <Edit3 className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </button>
            </div>
          </div>

          {/* Title Display / Edit */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={t('अपना शीर्षक लिखें...', 'Enter your title...')}
                  className="w-full px-4 py-4 pr-24 text-lg font-semibold border-2 border-primary-500 dark:border-primary-400 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/20 dark:focus:ring-primary-400/20"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleClearCustomTitle}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomTitle}
                    className="p-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-white"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {t('खाली छोड़ने पर स्वतः उत्पन्न होगा', 'Leave empty for auto-generated title')}
              </p>
            </div>
          ) : (
            <div className="relative group">
              {/* Type Badge */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r ${typeGradient} shadow-lg flex items-center gap-1.5`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {typeConfig?.shortCode || 'TEST'}
                </span>
                {formData.title && (
                  <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {t('कस्टम', 'Custom')}
                  </span>
                )}
              </div>

              {/* Title Text */}
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight pr-4">
                {currentTitle || t('शीर्षक यहाँ दिखेगा...', 'Title will appear here...')}
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* ========== TITLE SUGGESTIONS ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100">
                {t('शीर्षक सुझाव', 'Title Suggestions')}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('क्लिक करके चुनें', 'Click to apply')}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleRefreshSuggestions}
            className="px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            {t('और सुझाव', 'More')}
          </button>
        </div>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 gap-3">
          {suggestions.map((suggestion, index) => (
            <TitleSuggestionChip
              key={`${suggestion}-${index}`}
              suggestion={suggestion}
              index={index}
              isSelected={currentTitle === suggestion && !formData.title}
              onSelect={handleSelectSuggestion}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Target className="w-3.5 h-3.5" />
            <span>
              {t('फ़िल्टर से बना:', 'Based on:')}
              <span className="ml-1 font-semibold text-gray-700 dark:text-gray-300">
                {mainFilters.papers.map(p => p === 'paper1' ? 'P1' : 'P2').join(', ')}
                {mainFilters.units.length > 0 && ` • ${mainFilters.units.length} ${t('इकाई', 'units')}`}
                {mainFilters.chapters.length > 0 && ` • ${mainFilters.chapters.length} ${t('अध्याय', 'chapters')}`}
                {mainFilters.topics.length > 0 && ` • ${mainFilters.topics.length} ${t('विषय', 'topics')}`}
              </span>
            </span>
          </div>
          
          {formData.title && (
            <button
              type="button"
              onClick={handleClearCustomTitle}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {t('स्वतः उत्पन्न पर वापस', 'Reset to Auto')}
            </button>
          )}
        </div>
      </div>

      {/* ========== SELECTION SUMMARY TAGS ========== */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {t('शीर्षक में शामिल', 'Included in Title')}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Paper */}
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-semibold flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {mainFilters.papers.length === 2 ? 'P1+P2' : mainFilters.papers[0] === 'paper1' ? 'Paper 1' : 'Paper 2'}
          </span>
          
          {/* Test Type */}
          <span className={`px-2.5 py-1 bg-gradient-to-r ${typeGradient} text-white text-xs rounded-lg font-bold`}>
            {typeConfig?.shortCode || 'TEST'}
          </span>
          
          {/* Units */}
          {getSelectedNames().unitShorts.slice(0, 3).map((unit, i) => (
            <span key={`unit-${i}`} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-semibold truncate max-w-[120px]">
              {truncStr(unit, 18)}
            </span>
          ))}
          {getSelectedNames().unitCount > 3 && (
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 text-xs rounded-lg font-semibold">
              +{getSelectedNames().unitCount - 3}
            </span>
          )}
          
          {/* Chapters */}
          {getSelectedNames().chapterShorts.slice(0, 2).map((chapter, i) => (
            <span key={`chapter-${i}`} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg font-semibold truncate max-w-[100px]">
              {truncStr(chapter, 15)}
            </span>
          ))}
          {getSelectedNames().chapterCount > 2 && (
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 text-xs rounded-lg font-semibold">
              +{getSelectedNames().chapterCount - 2}
            </span>
          )}
          
          {/* Topics */}
          {getSelectedNames().topicShorts.slice(0, 2).map((topic, i) => (
            <span key={`topic-${i}`} className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg font-semibold truncate max-w-[100px]">
              {truncStr(topic, 15)}
            </span>
          ))}
          {getSelectedNames().topicCount > 2 && (
            <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400 text-xs rounded-lg font-semibold">
              +{getSelectedNames().topicCount - 2}
            </span>
          )}
          
          {/* Test Number */}
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg font-bold flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {testNumber}
          </span>
          
          {/* No selection hint */}
          {mainFilters.units.length === 0 && mainFilters.chapters.length === 0 && mainFilters.topics.length === 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-1 px-2">
              <Lightbulb className="w-3 h-3" />
              {t('फ़िल्टर चुनें → शीर्षक में दिखेंगे', 'Select filters → they appear in title')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitleGenerator;