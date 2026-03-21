// client/src/components/test/TitleGenerator.jsx
// ADVANCED VERSION — Full names for units/chapters/topics

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Hash, Sparkles, Wand2, Copy, Edit3, Check, RefreshCw, Zap, Star,
  Clock, Calendar, Target, BookOpen, Layers, X, Lightbulb,
  Shuffle, ArrowRight, Shield, Award, ChevronDown, ChevronUp,
  Type, AlignLeft, Code, Crown,
  Bookmark, BookmarkCheck, History, Undo2, Info, Globe,
  Palette, Sliders, ArrowUpDown, Eye, EyeOff,
  ChevronRight as ChevronRightIcon, Feather, Flame,
  ListChecks, FileText, Percent, Timer
} from 'lucide-react';
import { TEST_TYPE_CONFIG } from '../../utils/constants';
import { TitleSuggestionChip } from './title';

// ============================================
// TITLE QUALITY INDICATOR
// ============================================
const TitleQualityBadge = ({ title, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  const quality = useMemo(() => {
    if (!title) return { score: 0, label: 'N/A', color: 'gray', tips: [] };

    let score = 0;
    const tips = [];
    const len = title.length;

    // Length (0-25)
    if (len >= 20 && len <= 70) score += 25;
    else if (len >= 10 && len <= 90) { score += 15; tips.push(t('शीर्षक 20-70 अक्षर का रखें', 'Keep title 20-70 chars')); }
    else if (len > 0) { score += 5; tips.push(t('शीर्षक बहुत छोटा/बड़ा है', 'Title too short/long')); }

    // Has test type identifier (0-25)
    const typeKeywords = ['DPP', 'Mock', 'PYQ', 'Test', 'Practice', 'CT', 'UT', 'TT', 'FM', 'परीक्षा', 'मॉक', 'अभ्यास', 'Full Mock', 'Topic Test', 'Chapter Test', 'Unit Test'];
    if (typeKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) score += 25;
    else tips.push(t('परीक्षा प्रकार जोड़ें (DPP, Mock, etc)', 'Add test type (DPP, Mock, etc)'));

    // Has paper identifier (0-20)
    if (/P[12]|Paper\s*[12]|पेपर|Combined|संयुक्त/i.test(title)) score += 20;
    else tips.push(t('पेपर नंबर जोड़ें (P1, P2)', 'Add paper number (P1, P2)'));

    // Has number/date (0-15)
    if (/\d/.test(title)) score += 15;
    else tips.push(t('क्रम संख्या जोड़ें (#1, #2)', 'Add sequence number'));

    // Has separator (0-15)
    if (/[|:\-–—•]/.test(title)) score += 15;
    else tips.push(t('विभाजक जोड़ें (|, -, :)', 'Add separator (|, -, :)'));

    const label = score >= 80 ? t('उत्कृष्ट', 'Excellent') : score >= 60 ? t('अच्छा', 'Good') : score >= 40 ? t('ठीक', 'Fair') : t('सुधारें', 'Improve');
    const color = score >= 80 ? 'green' : score >= 60 ? 'blue' : score >= 40 ? 'amber' : 'red';

    return { score, label, color, tips };
  }, [title, language]);

  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    gray: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
  };

  const barColors = { green: 'bg-green-500', blue: 'bg-blue-500', amber: 'bg-amber-500', red: 'bg-red-500', gray: 'bg-gray-400' };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold ${colorClasses[quality.color]}`}>
        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{quality.label}</span>
        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden min-w-[40px]">
          <div className={`h-full rounded-full ${barColors[quality.color]} transition-all duration-700`} style={{ width: `${quality.score}%` }} />
        </div>
        <span className="tabular-nums">{quality.score}%</span>
      </div>
      {quality.tips.length > 0 && (
        <div className="space-y-1">
          {quality.tips.slice(0, 2).map((tip, i) => (
            <p key={i} className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 pl-1">
              <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" /> {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// FORMAT PRESET BUTTON
// ============================================
const FormatPreset = ({ preset, isActive, onClick, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-start gap-0.5 min-w-[100px]
      ${isActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-md shadow-primary-500/20'
          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-gray-800 hover:shadow-sm'
        }`}
    >
      <div className="flex items-center gap-1.5">
        <preset.icon className="w-3.5 h-3.5" />
        <span>{t(preset.nameHi, preset.name)}</span>
      </div>
      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{preset.desc}</span>
    </button>
  );
};

// ============================================
// TITLE HISTORY
// ============================================
const TitleHistoryItem = ({ title, timestamp, onSelect, onRemove }) => (
  <div className="flex items-center gap-2 group">
    <button type="button" onClick={() => onSelect(title)}
      className="flex-1 text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 truncate transition-colors font-medium border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
      {title}
    </button>
    <span className="text-[9px] text-gray-400 flex-shrink-0 tabular-nums">
      {new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
    </span>
    <button type="button" onClick={() => onRemove(timestamp)}
      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
      <X className="w-3 h-3" />
    </button>
  </div>
);

// ============================================
// LIVE PREVIEW with character highlights
// ============================================
const TitleLivePreview = ({ title, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  if (!title) return null;

  // Highlight different parts
  const parts = title.split(/([|:\-–—•#])/g);

  return (
    <div className="mt-3 p-3 bg-gray-900 dark:bg-black rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
          <Eye className="w-3 h-3" /> {t('लाइव पूर्वावलोकन', 'Live Preview')}
        </span>
        <span className="text-[10px] text-gray-500 tabular-nums">{title.length} {t('अक्षर', 'chars')}</span>
      </div>
      <p className="text-sm font-medium text-white leading-relaxed">
        {parts.map((part, i) => (
          <span key={i} className={/[|:\-–—•#]/.test(part) ? 'text-primary-400 font-bold mx-0.5' : ''}>
            {part}
          </span>
        ))}
      </p>
    </div>
  );
};

// ============================================
// CONTENT SELECTOR — Show full names
// ============================================
const ContentTagDisplay = ({ names, language, type, color, icon: Icon }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  };

  if (!names || names.length === 0) return null;

  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
        <Icon className="w-3 h-3" /> {type}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name, i) => (
          <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorMap[color]} flex items-center gap-1`} title={name}>
            <span className="truncate max-w-[200px]">{name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================
// MAIN TITLE GENERATOR
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
  const [activeFormat, setActiveFormat] = useState('standard');
  const [showHistory, setShowHistory] = useState(false);
  const [titleHistory, setTitleHistory] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrefix, setCustomPrefix] = useState('');
  const [customSuffix, setCustomSuffix] = useState('');
  const [includeDate, setIncludeDate] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [showContentDetails, setShowContentDetails] = useState(true);

  // ==========================================
  // FORMAT PRESETS
  // ==========================================
  const formatPresets = [
    { key: 'standard', name: 'Standard', nameHi: 'मानक', icon: Type, desc: 'Paper | Content - Type #N' },
    { key: 'detailed', name: 'Detailed', nameHi: 'विस्तृत', icon: AlignLeft, desc: 'Full names included' },
    { key: 'compact', name: 'Compact', nameHi: 'संक्षिप्त', icon: Code, desc: 'Short code format' },
    { key: 'academic', name: 'Academic', nameHi: 'शैक्षिक', icon: Crown, desc: 'Formal UGC NET style' },
    { key: 'dated', name: 'Dated', nameHi: 'दिनांकित', icon: Calendar, desc: 'With date & session' },
  ];

  // ==========================================
  // HELPERS
  // ==========================================
  const truncStr = (str, maxLen = 30) => !str ? '' : str.length > maxLen ? str.substring(0, maxLen) + '…' : str;

  const getCurrentDate = () => {
    const now = new Date();
    return {
      day: now.getDate(),
      dayStr: now.toLocaleDateString('en-IN', { day: '2-digit' }),
      month: now.toLocaleDateString('en-IN', { month: 'short' }),
      monthFull: now.toLocaleDateString('en-IN', { month: 'long' }),
      year: now.getFullYear(),
      yearShort: now.toLocaleDateString('en-IN', { year: '2-digit' }),
      weekday: now.toLocaleDateString('en-IN', { weekday: 'short' }),
      weekdayFull: now.toLocaleDateString('en-IN', { weekday: 'long' }),
    };
  };

  // ==========================================
  // GET FULL NAMES — MOST IMPORTANT FUNCTION
  // ==========================================
  const getSelectedNames = useCallback(() => {
    const result = {
      paperShort: '', paperFull: '', paperFullHi: '',
      unitFullNames: [], unitShortNames: [],
      chapterFullNames: [], chapterShortNames: [],
      topicFullNames: [], topicShortNames: [],
      unitCount: mainFilters.units.length,
      chapterCount: mainFilters.chapters.length,
      topicCount: mainFilters.topics.length
    };

    // Paper
    if (mainFilters.papers.length === 2) {
      result.paperShort = 'P1+P2';
      result.paperFull = 'Paper 1 + Paper 2';
      result.paperFullHi = 'पेपर 1 + पेपर 2';
    } else if (mainFilters.papers.includes('paper1')) {
      result.paperShort = 'P1';
      result.paperFull = 'Paper 1 (Teaching & Research Aptitude)';
      result.paperFullHi = 'पेपर 1 (शिक्षण और शोध अभिवृत्ति)';
    } else if (mainFilters.papers.includes('paper2')) {
      result.paperShort = 'P2';
      result.paperFull = 'Paper 2 (History)';
      result.paperFullHi = 'पेपर 2 (इतिहास)';
    } else {
      result.paperShort = 'P1';
      result.paperFull = 'Paper 1';
      result.paperFullHi = 'पेपर 1';
    }

    // Units — Get FULL names
    if (getUnitOptions) {
      const unitOpts = getUnitOptions(mainFilters.papers);
      mainFilters.units.forEach(unitKey => {
        const opt = unitOpts.find(o => o.value === unitKey);
        if (opt) {
          // Full label includes "P1: UNIT I: Teaching Aptitude"
          const fullLabel = opt.label || '';
          // Remove "P1: " or "P2: " prefix
          const withoutPaper = fullLabel.replace(/^P[12]:\s*/i, '').trim();
          result.unitFullNames.push(withoutPaper);

          // Short = just the name part after "UNIT X: "
          const shortName = opt.shortName || withoutPaper.replace(/^(UNIT|इकाई)\s*[IVX\d]+:\s*/i, '').trim();
          result.unitShortNames.push(shortName);
        }
      });
    }

    // Chapters — Get FULL names
    if (getChapterOptions) {
      const chOpts = getChapterOptions(mainFilters.units, mainFilters.papers);
      mainFilters.chapters.forEach(chKey => {
        const opt = chOpts.find(o => o.value === chKey);
        if (opt) {
          result.chapterFullNames.push(opt.label || opt.shortName || chKey);
          result.chapterShortNames.push(opt.shortName || opt.label || chKey);
        }
      });
    }

    // Topics — Get FULL names
    if (getTopicOptions) {
      const topicOpts = getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers);
      mainFilters.topics.forEach(topicVal => {
        const opt = topicOpts.find(o => o.value === topicVal);
        if (opt) {
          result.topicFullNames.push(opt.label || topicVal);
          result.topicShortNames.push(opt.shortName || opt.label || topicVal);
        }
      });
    }

    return result;
  }, [mainFilters, getUnitOptions, getChapterOptions, getTopicOptions, language]);

  // ==========================================
  // GET MOST SPECIFIC CONTENT
  // ==========================================
  const getMostSpecific = useCallback((names) => {
    if (names.topicFullNames.length > 0) {
      return { type: 'topic', full: names.topicFullNames, short: names.topicShortNames, label: t('विषय', 'Topics') };
    }
    if (names.chapterFullNames.length > 0) {
      return { type: 'chapter', full: names.chapterFullNames, short: names.chapterShortNames, label: t('अध्याय', 'Chapters') };
    }
    if (names.unitFullNames.length > 0) {
      return { type: 'unit', full: names.unitFullNames, short: names.unitShortNames, label: t('इकाई', 'Units') };
    }
    return { type: 'paper', full: [], short: [], label: t('पेपर', 'Paper') };
  }, [language]);

  // ==========================================
  // GENERATE SUGGESTIONS
  // ==========================================
  const generateSuggestions = useCallback(() => {
    const cfg = TEST_TYPE_CONFIG[formData.testType];
    const names = getSelectedNames();
    const date = getCurrentDate();
    const sc = cfg?.shortCode || 'TEST';
    const num = testNumber || Math.floor(Math.random() * 100) + 1;
    const prefix = customPrefix ? `${customPrefix} ` : '';
    const suffix = customSuffix ? ` ${customSuffix}` : '';
    const dateStr = includeDate ? ` | ${date.dayStr} ${date.month} ${date.yearShort}` : '';

    const content = getMostSpecific(names);

    // Join helpers with full names
    const joinFull = (items, limit = 2) => {
      if (!items.length) return '';
      if (items.length <= limit) return items.join(', ');
      return `${items.slice(0, limit).join(', ')} (+${items.length - limit})`;
    };

    const joinShort = (items, limit = 2) => {
      if (!items.length) return '';
      if (items.length <= limit) return items.map(i => truncStr(i, 25)).join(', ');
      return `${items.slice(0, limit).map(i => truncStr(i, 20)).join(', ')} +${items.length - limit}`;
    };

    const contentFull = joinFull(content.full, 3);
    const contentShort = joinShort(content.short, 2);
    const contentFirst = content.full[0] || '';
    const contentFirstShort = content.short[0] || '';

    const typeName = t(cfg?.nameHi, cfg?.name) || sc;
    const typeNameShort = sc;

    const suggestions = [];

    const add = (title) => {
      const final = `${prefix}${title}${suffix}${dateStr}`.replace(/\s+/g, ' ').trim();
      if (final && !suggestions.includes(final)) suggestions.push(final);
    };

    // === STANDARD FORMAT ===
    if (activeFormat === 'standard') {
      // With content
      if (contentFirst) {
        add(`${names.paperShort} | ${contentShort} - ${typeNameShort} #${num}`);
        add(`${typeNameShort}: ${contentShort} | ${names.paperShort} #${num}`);
        add(`${names.paperShort} - ${contentFirstShort} - ${typeName} #${num}`);
      }
      // Without content - use type defaults
      switch (formData.testType) {
        case 'dpp':
          add(`${names.paperShort} | ${contentShort || t('सामान्य अभ्यास', 'General Practice')} - DPP #${num}`);
          add(`DPP #${num} | ${contentShort || names.paperShort}`);
          break;
        case 'topic_test':
          add(`${names.paperShort} | ${contentShort || t('विषय', 'Topic')} - ${t('विषय परीक्षा', 'Topic Test')} #${num}`);
          break;
        case 'chapter_test':
          add(`${names.paperShort} | ${contentShort || t('अध्याय', 'Chapter')} - ${t('अध्याय परीक्षा', 'Chapter Test')} #${num}`);
          break;
        case 'unit_test':
          add(`${names.paperShort} | ${contentShort || t('इकाई', 'Unit')} - ${t('इकाई परीक्षा', 'Unit Test')} #${num}`);
          break;
        case 'full_mock_p1':
          add(`${t('फुल मॉक पेपर 1', 'Full Mock Paper 1')} - #${num}`);
          add(`FM-P1 | NTA Pattern Mock #${num}`);
          break;
        case 'full_mock_p2':
          add(`${t('फुल मॉक पेपर 2 (इतिहास)', 'Full Mock Paper 2 (History)')} - #${num}`);
          add(`FM-P2 | History Mock #${num}`);
          break;
        case 'full_mock_combined':
          add(`${t('फुल मॉक संयुक्त', 'Full Mock Combined')} (P1+P2) #${num}`);
          break;
        case 'pyq_year':
          add(`PYQ ${date.year} | ${names.paperShort} #${num}`);
          add(`${t('पिछले वर्ष', 'Previous Year')} ${date.year} | ${names.paperShort}`);
          break;
        case 'practice':
          add(`${names.paperShort} | ${contentShort || t('अभ्यास', 'Practice')} - ${t('प्रैक्टिस', 'Practice')} #${num}`);
          break;
        default:
          add(`${names.paperShort} - ${typeNameShort} #${num}`);
      }
      // Extra generic
      add(`${names.paperShort} | ${typeName} #${num}`);
    }

    // === DETAILED FORMAT — Uses FULL names ===
    if (activeFormat === 'detailed') {
      if (content.full.length > 0) {
        // Show full content names
        add(`${typeName} | ${contentFull} | ${t(names.paperFullHi, names.paperFull)}`);
        add(`${t(names.paperFullHi, names.paperFull)} - ${contentFull} [${typeNameShort} #${num}]`);
        add(`${contentFull} - ${typeName} #${num} | ${names.paperShort}`);

        // If we have hierarchy, show it
        if (names.unitFullNames.length > 0 && names.chapterFullNames.length > 0) {
          add(`${names.paperShort} | ${names.unitShortNames[0]} > ${names.chapterShortNames[0]} - ${typeNameShort} #${num}`);
        }
        if (names.topicFullNames.length > 0 && names.chapterFullNames.length > 0) {
          add(`${names.chapterShortNames[0]} > ${names.topicShortNames[0]} | ${names.paperShort} - ${typeNameShort} #${num}`);
        }
      } else {
        add(`${t(names.paperFullHi, names.paperFull)} | ${typeName} #${num}`);
        add(`UGC NET ${t(names.paperFullHi, names.paperFull)} - ${typeName} ${num}`);
      }
      // Always add a verbose one
      add(`UGC NET ${date.year} | ${t(names.paperFullHi, names.paperFull)} | ${typeName} #${num}`);
    }

    // === COMPACT FORMAT ===
    if (activeFormat === 'compact') {
      add(`${typeNameShort}-${names.paperShort}-${String(num).padStart(3, '0')}`);
      if (contentFirstShort) add(`${typeNameShort}#${num} ${truncStr(contentFirstShort, 15)}`);
      add(`${names.paperShort}_${typeNameShort}_${date.dayStr}${date.month}${date.yearShort}`);
      add(`${typeNameShort}/${names.paperShort}/${num}`);
      add(`#${num} ${names.paperShort} ${typeNameShort}`);
    }

    // === ACADEMIC FORMAT ===
    if (activeFormat === 'academic') {
      add(`UGC NET ${t(names.paperFullHi, names.paperFull)} | ${typeName} #${num}`);
      if (contentFull) {
        add(`${t(names.paperFullHi, names.paperFull)}: ${contentFull} [${typeNameShort}-${num}]`);
      }
      add(`NET ${date.year} | ${names.paperShort} | ${typeName} Series ${num}`);
      add(`${t(names.paperFullHi, names.paperFull)} | ${typeName} | Session ${date.monthFull} ${date.year}`);
      add(`National Eligibility Test | ${names.paperFull} | ${typeName} #${num}`);
    }

    // === DATED FORMAT ===
    if (activeFormat === 'dated') {
      add(`${date.dayStr} ${date.month} ${date.year} | ${names.paperShort} | ${typeNameShort} #${num}`);
      add(`${date.weekday} ${date.dayStr} ${date.month} | ${contentShort || names.paperShort} - ${typeNameShort}`);
      add(`${date.monthFull} ${date.year} | ${names.paperShort} ${typeName} #${num}`);
      if (contentFirst) {
        add(`${date.dayStr}/${date.month}/${date.yearShort} | ${contentFirstShort} | ${typeNameShort} #${num}`);
      }
      add(`${names.paperShort} | ${typeNameShort} | ${date.weekdayFull} ${date.dayStr} ${date.monthFull} ${date.year}`);
    }

    return [...new Set(suggestions)].filter(s => s.trim()).slice(0, 7);
  }, [formData.testType, getSelectedNames, getMostSpecific, testNumber, language, refreshKey, activeFormat, customPrefix, customSuffix, includeDate]);

  const suggestions = useMemo(() => generateSuggestions(), [generateSuggestions]);

  const currentTitle = useMemo(() => {
    if (formData.title?.trim()) return formData.title;
    return suggestions[0] || '';
  }, [formData.title, suggestions]);

  const selectedNames = useMemo(() => getSelectedNames(), [getSelectedNames]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleSelectSuggestion = (suggestion) => {
    onTitleChange(suggestion);
    setIsEditing(false);
    addToHistory(suggestion);
  };

  const handleCopyTitle = async (title, index = -1) => {
    try { await navigator.clipboard.writeText(title); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); } catch { }
  };

  const handleRefresh = () => setRefreshKey(p => p + 1);

  const handleClearTitle = () => { onTitleChange(''); setCustomTitle(''); setIsEditing(false); };

  const handleSaveTitle = () => {
    if (customTitle.trim()) { onTitleChange(customTitle.trim()); addToHistory(customTitle.trim()); }
    setIsEditing(false);
  };

  const addToHistory = (title) => {
    setTitleHistory(prev => [{ title, timestamp: Date.now() }, ...prev.filter(h => h.title !== title)].slice(0, 15));
  };

  const removeFromHistory = (ts) => setTitleHistory(prev => prev.filter(h => h.timestamp !== ts));

  useEffect(() => { if (isEditing) setCustomTitle(formData.title || currentTitle); }, [isEditing]);

  // Quick insert helpers
  const insertAtCursor = (text) => {
    setCustomTitle(prev => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${text}`);
  };

  const typeConfig = TEST_TYPE_CONFIG[formData.testType];
  const typeGradient = {
    dpp: 'from-blue-500 to-indigo-600', topic_test: 'from-emerald-500 to-teal-600',
    chapter_test: 'from-purple-500 to-violet-600', unit_test: 'from-orange-500 to-amber-600',
    pyq_year: 'from-red-500 to-rose-600', practice: 'from-cyan-500 to-blue-600',
    full_mock_p1: 'from-indigo-500 to-purple-600', full_mock_p2: 'from-pink-500 to-rose-600',
    full_mock_combined: 'from-gray-600 to-slate-700'
  }[formData.testType] || 'from-gray-500 to-gray-600';

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-4">
      {/* ========== MAIN TITLE PREVIEW ========== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${typeGradient} flex items-center justify-center shadow-lg`}>
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{t('परीक्षा शीर्षक', 'Test Title')}</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {formData.title ? t('कस्टम', 'Custom') : t('स्वतः', 'Auto')}
                  <span className="mx-1">•</span>
                  <span className="tabular-nums">{currentTitle.length} {t('अक्षर', 'chars')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handleRefresh} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group" title={t('नए सुझाव', 'Refresh')}>
                <RefreshCw className="w-4 h-4 text-gray-500 group-hover:text-primary-600 group-hover:rotate-180 transition-all duration-500" />
              </button>
              <button type="button" onClick={() => handleCopyTitle(currentTitle, -1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group" title={t('कॉपी', 'Copy')}>
                {copiedIndex === -1 ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-primary-600" />}
              </button>
              <button type="button" onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all group" title={t('संपादन', 'Edit')}>
                <Edit3 className="w-4 h-4 text-gray-500 group-hover:text-primary-600" />
              </button>
              <button type="button" onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`} title={t('इतिहास', 'History')}>
                <History className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setShowLivePreview(!showLivePreview)} className={`p-2 rounded-xl transition-all ${showLivePreview ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'}`} title={t('पूर्वावलोकन', 'Preview')}>
                {showLivePreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="relative">
                <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                  placeholder={t('शीर्षक लिखें...', 'Type title...')}
                  className="w-full px-4 py-3.5 pr-24 text-base font-semibold border-2 border-primary-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/20"
                  autoFocus maxLength={120} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 tabular-nums mr-1">{customTitle.length}/120</span>
                  <button type="button" onClick={handleClearTitle} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  <button type="button" onClick={handleSaveTitle} className="p-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Quick Insert Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{t('तुरंत जोड़ें:', 'Quick Insert:')}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => insertAtCursor(selectedNames.paperShort)} className="px-2 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 transition-colors">{selectedNames.paperShort}</button>
                  <button type="button" onClick={() => insertAtCursor(typeConfig?.shortCode || 'TEST')} className="px-2 py-1 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 transition-colors">{typeConfig?.shortCode}</button>
                  <button type="button" onClick={() => insertAtCursor(`#${testNumber}`)} className="px-2 py-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md hover:bg-amber-200 transition-colors">#{testNumber}</button>
                  <button type="button" onClick={() => insertAtCursor('|')} className="px-2 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 transition-colors">|</button>
                  <button type="button" onClick={() => insertAtCursor('-')} className="px-2 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 transition-colors">-</button>
                  {selectedNames.unitShortNames.slice(0, 2).map((name, i) => (
                    <button key={i} type="button" onClick={() => insertAtCursor(name)} className="px-2 py-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 transition-colors truncate max-w-[100px]">{truncStr(name, 12)}</button>
                  ))}
                  {selectedNames.chapterShortNames.slice(0, 2).map((name, i) => (
                    <button key={i} type="button" onClick={() => insertAtCursor(name)} className="px-2 py-1 text-[10px] font-bold bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 transition-colors truncate max-w-[100px]">{truncStr(name, 12)}</button>
                  ))}
                  {selectedNames.topicShortNames.slice(0, 2).map((name, i) => (
                    <button key={i} type="button" onClick={() => insertAtCursor(name)} className="px-2 py-1 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 transition-colors truncate max-w-[100px]">{truncStr(name, 12)}</button>
                  ))}
                  {includeDate && (
                    <button type="button" onClick={() => { const d = getCurrentDate(); insertAtCursor(`${d.dayStr} ${d.month} ${d.yearShort}`); }} className="px-2 py-1 text-[10px] font-bold bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-md hover:bg-teal-200 transition-colors">
                      <Calendar className="w-3 h-3 inline mr-0.5" />{t('तिथि', 'Date')}
                    </button>
                  )}
                </div>
              </div>

              {/* Live preview in edit mode */}
              {customTitle && <TitleLivePreview title={customTitle} language={language} />}
            </div>
          ) : (
            <div className="relative group">
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r ${typeGradient} shadow-lg flex items-center gap-1.5`}>
                  <Sparkles className="w-3.5 h-3.5" />{typeConfig?.shortCode || 'TEST'}
                </span>
                {formData.title && (
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />{t('कस्टम', 'Custom')}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] rounded-lg font-semibold">
                  {formatPresets.find(f => f.key === activeFormat)?.name || 'Standard'}
                </span>
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight pr-4 break-words">
                {currentTitle || t('शीर्षक यहाँ दिखेगा...', 'Title will appear here...')}
              </h2>

              {/* Live Preview */}
              {showLivePreview && currentTitle && <TitleLivePreview title={currentTitle} language={language} />}
            </div>
          )}

          {/* Quality */}
          {currentTitle && !isEditing && (
            <div className="mt-4">
              <TitleQualityBadge title={currentTitle} language={language} />
            </div>
          )}
        </div>
      </div>

      {/* ========== HISTORY ========== */}
      {showHistory && titleHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-gray-400" />{t('हाल के शीर्षक', 'Recent Titles')} ({titleHistory.length})
            </h4>
            <button type="button" onClick={() => setTitleHistory([])} className="text-[10px] text-red-600 hover:underline font-bold">{t('साफ़', 'Clear')}</button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {titleHistory.map(h => (
              <TitleHistoryItem key={h.timestamp} title={h.title} timestamp={h.timestamp} onSelect={handleSelectSuggestion} onRemove={removeFromHistory} />
            ))}
          </div>
        </div>
      )}

      {/* ========== CONTENT DETAILS — Show what's selected ========== */}
      {showContentDetails && (selectedNames.unitFullNames.length > 0 || selectedNames.chapterFullNames.length > 0 || selectedNames.topicFullNames.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-blue-500" />{t('चयनित सामग्री (पूर्ण नाम)', 'Selected Content (Full Names)')}
            </h4>
            <button type="button" onClick={() => setShowContentDetails(!showContentDetails)} className="text-[10px] text-gray-400 hover:text-gray-600 font-bold">
              {showContentDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="space-y-3">
            <ContentTagDisplay names={selectedNames.unitFullNames} language={language} type={t('इकाइयां', 'Units')} color="blue" icon={Target} />
            <ContentTagDisplay names={selectedNames.chapterFullNames} language={language} type={t('अध्याय', 'Chapters')} color="green" icon={BookOpen} />
            <ContentTagDisplay names={selectedNames.topicFullNames} language={language} type={t('विषय', 'Topics')} color="purple" icon={Layers} />
          </div>
        </div>
      )}

      {/* ========== FORMAT PRESETS ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-500" />{t('शीर्षक शैली', 'Title Style')}
          </h4>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            <Sliders className="w-3 h-3" />
            {showAdvanced ? t('छुपाएं', 'Hide') : t('विकल्प', 'Options')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formatPresets.map(preset => (
            <FormatPreset key={preset.key} preset={preset} isActive={activeFormat === preset.key} language={language}
              onClick={() => { setActiveFormat(preset.key); setRefreshKey(p => p + 1); }} />
          ))}
        </div>

        {showAdvanced && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">{t('उपसर्ग', 'Prefix')}</label>
                <input type="text" value={customPrefix} onChange={e => { setCustomPrefix(e.target.value); setRefreshKey(p => p + 1); }}
                  placeholder="e.g. NET 2024" maxLength={20}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block">{t('प्रत्यय', 'Suffix')}</label>
                <input type="text" value={customSuffix} onChange={e => { setCustomSuffix(e.target.value); setRefreshKey(p => p + 1); }}
                  placeholder="e.g. v2, Final" maxLength={20}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button type="button" onClick={() => { setIncludeDate(!includeDate); setRefreshKey(p => p + 1); }}
                className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${includeDate ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 bg-white dark:bg-gray-700'}`}>
                <Calendar className="w-3 h-3" />{t('तिथि जोड़ें', 'Add Date')}
              </button>
              <button type="button" onClick={() => setShowContentDetails(!showContentDetails)}
                className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${showContentDetails ? 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 bg-white dark:bg-gray-700'}`}>
                <ListChecks className="w-3 h-3" />{t('सामग्री दिखाएं', 'Show Content')}
              </button>
              {(customPrefix || customSuffix || includeDate) && (
                <button type="button" onClick={() => { setCustomPrefix(''); setCustomSuffix(''); setIncludeDate(false); setRefreshKey(p => p + 1); }}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 border border-red-200 dark:border-red-800">
                  <Undo2 className="w-3 h-3" />{t('रीसेट', 'Reset')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== SUGGESTIONS ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t('सुझाव', 'Suggestions')}</h4>
              <p className="text-[10px] text-gray-500">{suggestions.length} {t('विकल्प', 'options')} • {t('क्लिक से चुनें', 'click to apply')}</p>
            </div>
          </div>
          <button type="button" onClick={handleRefresh}
            className="px-3 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg flex items-center gap-1.5 transition-colors">
            <Shuffle className="w-3.5 h-3.5" />{t('और', 'More')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {suggestions.map((suggestion, index) => (
            <TitleSuggestionChip key={`${suggestion}-${index}-${refreshKey}`} suggestion={suggestion} index={index}
              isSelected={currentTitle === suggestion && !formData.title} onSelect={handleSelectSuggestion} />
          ))}
        </div>

        {suggestions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('सुझाव उत्पन्न नहीं हुए', 'No suggestions generated')}</p>
            <button type="button" onClick={handleRefresh} className="mt-2 text-sm text-primary-600 font-bold hover:underline">{t('पुनः प्रयास', 'Try Again')}</button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
            <Target className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">
              {selectedNames.paperShort}
              {selectedNames.unitCount > 0 && ` • ${selectedNames.unitCount} ${t('इकाई', 'units')}`}
              {selectedNames.chapterCount > 0 && ` • ${selectedNames.chapterCount} ${t('अध्याय', 'ch')}`}
              {selectedNames.topicCount > 0 && ` • ${selectedNames.topicCount} ${t('विषय', 'topics')}`}
            </span>
          </div>
          {formData.title && (
            <button type="button" onClick={handleClearTitle}
              className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" />{t('स्वतः पर वापस', 'Reset to Auto')}
            </button>
          )}
        </div>
      </div>

      {/* ========== SELECTION TAGS SUMMARY ========== */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">{t('शीर्षक स्रोत सामग्री', 'Title Source Material')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Paper */}
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-semibold flex items-center gap-1">
            <BookOpen className="w-3 h-3" />{selectedNames.paperShort}
          </span>

          {/* Type */}
          <span className={`px-2.5 py-1 bg-gradient-to-r ${typeGradient} text-white text-xs rounded-lg font-bold`}>
            {typeConfig?.shortCode || 'TEST'}
          </span>

          {/* Full unit names */}
          {selectedNames.unitFullNames.map((name, i) => (
            <span key={`u-${i}`} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}>
              <Target className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[150px]">{name}</span>
            </span>
          ))}

          {/* Full chapter names */}
          {selectedNames.chapterFullNames.map((name, i) => (
            <span key={`c-${i}`} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}>
              <BookOpen className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[150px]">{name}</span>
            </span>
          ))}

          {/* Full topic names */}
          {selectedNames.topicFullNames.map((name, i) => (
            <span key={`t-${i}`} className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}>
              <Layers className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[150px]">{name}</span>
            </span>
          ))}

          {/* Number */}
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-lg font-bold flex items-center gap-1">
            <Hash className="w-3 h-3" />{testNumber}
          </span>

          {/* Empty hint */}
          {selectedNames.unitCount === 0 && selectedNames.chapterCount === 0 && selectedNames.topicCount === 0 && (
            <span className="text-[10px] text-gray-400 italic flex items-center gap-1 px-2">
              <Info className="w-3 h-3" />
              {t('फ़िल्टर चुनें → पूर्ण नाम शीर्षक में दिखेंगे', 'Select filters for full names in title')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitleGenerator;