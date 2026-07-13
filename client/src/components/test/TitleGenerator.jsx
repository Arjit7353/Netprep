import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Hash, Sparkles, Wand2, Copy, Edit3, Check, RefreshCw, Zap, Star,
  Clock, Calendar, Target, BookOpen, Layers, X, Lightbulb,
  Shuffle, ArrowRight, Shield, Award, ChevronDown, ChevronUp,
  Type, AlignLeft, Code, Crown,
  Bookmark, BookmarkCheck, History, Undo2, Info, Globe,
  Palette, Sliders, ArrowUpDown, Eye, EyeOff,
  ChevronRight as ChevronRightIcon, Feather, Flame,
  ListChecks, FileText, Percent, Timer, Tag
} from 'lucide-react';

const TEST_TYPE_CONFIG = {
  practice: { shortCode: 'PRAC', name: 'Practice', nameHi: 'अभ्यास' },
  dpp: { shortCode: 'DPP', name: 'DPP', nameHi: 'डीपीपी' },
  topic_test: { shortCode: 'TT', name: 'Topic Test', nameHi: 'विषय परीक्षा' },
  chapter_test: { shortCode: 'CT', name: 'Chapter Test', nameHi: 'अध्याय परीक्षा' },
  unit_test: { shortCode: 'UT', name: 'Unit Test', nameHi: 'इकाई परीक्षा' },
  full_mock_p1: { shortCode: 'FMP1', name: 'Full Mock P1', nameHi: 'फुल मॉक P1' },
  full_mock_p2: { shortCode: 'FMP2', name: 'Full Mock P2', nameHi: 'फुल मॉक P2' },
  full_mock_combined: { shortCode: 'FMC', name: 'Full Mock Combined', nameHi: 'फुल मॉक संयुक्त' },
  pyq_year: { shortCode: 'PYQ', name: 'PYQ', nameHi: 'पिछले वर्ष' },
};

const QUESTION_TYPE_LABELS = {
  mcq: { en: 'MCQ', hi: 'बहुविकल्पीय' },
  msq: { en: 'MSQ', hi: 'बहु-चयन' },
  assertion_reason: { en: 'A&R', hi: 'अभिकथन-कारण' },
  statement_based: { en: 'Statement', hi: 'कथन आधारित' },
  match_following: { en: 'Match', hi: 'सुमेलित' },
  sequence_order: { en: 'Sequence', hi: 'क्रम' },
};

const TitleSuggestionChip = ({ suggestion, isSelected, onSelect }) => (
  <button type="button" onClick={() => onSelect(suggestion)}
    className={`text-left px-3 py-2.5 text-sm rounded-xl transition-all border w-full ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-md' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 hover:border-gray-300'}`}>
    {suggestion}
  </button>
);

const TitleQualityBadge = ({ title, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const quality = useMemo(() => {
    if (!title) return { score: 0, label: 'N/A', color: 'gray', tips: [] };
    let score = 0; const tips = []; const len = title.length;
    if (len >= 20 && len <= 70) score += 25;
    else if (len >= 10 && len <= 90) { score += 15; tips.push(t('शीर्षक 20-70 अक्षर', 'Keep 20-70 chars')); }
    else if (len > 0) { score += 5; }
    const typeKw = ['DPP','Mock','PYQ','Test','Practice','CT','UT','TT','FM','परीक्षा','मॉक','अभ्यास','PRAC'];
    if (typeKw.some(k => title.toLowerCase().includes(k.toLowerCase()))) score += 25;
    else tips.push(t('प्रकार जोड़ें', 'Add type'));
    if (/P[12]|Paper\s*[12]|पेपर|Combined/i.test(title)) score += 20;
    else tips.push(t('पेपर जोड़ें', 'Add paper'));
    if (/\d/.test(title)) score += 15;
    if (/[|:\-–—•]/.test(title)) score += 15;
    const label = score >= 80 ? t('उत्कृष्ट','Excellent') : score >= 60 ? t('अच्छा','Good') : score >= 40 ? t('ठीक','Fair') : t('सुधारें','Improve');
    const color = score >= 80 ? 'green' : score >= 60 ? 'blue' : score >= 40 ? 'amber' : 'red';
    return { score, label, color, tips };
  }, [title, language]);

  const colorClasses = { green:'bg-green-50 dark:bg-green-900/20 text-green-700 border-green-200', blue:'bg-blue-50 dark:bg-blue-900/20 text-blue-700 border-blue-200', amber:'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200', red:'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200', gray:'bg-gray-50 text-gray-600 border-gray-200' };
  const barColors = { green:'bg-green-500', blue:'bg-blue-500', amber:'bg-amber-500', red:'bg-red-500', gray:'bg-gray-400' };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold ${colorClasses[quality.color]}`}>
        <Shield className="w-3.5 h-3.5 flex-shrink-0" /><span>{quality.label}</span>
        <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden min-w-[40px]">
          <div className={`h-full rounded-full ${barColors[quality.color]} transition-all duration-700`} style={{ width: `${quality.score}%` }} />
        </div>
        <span className="tabular-nums">{quality.score}%</span>
      </div>
      {quality.tips.length > 0 && quality.tips.slice(0,2).map((tip,i) => (
        <p key={i} className="text-[10px] text-gray-500 flex items-center gap-1 pl-1"><Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" /> {tip}</p>
      ))}
    </div>
  );
};

const FormatPreset = ({ preset, isActive, onClick, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-start gap-0.5 min-w-[100px] ${isActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 shadow-md' : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300 bg-white dark:bg-gray-800'}`}>
      <div className="flex items-center gap-1.5"><preset.icon className="w-3.5 h-3.5" /><span>{t(preset.nameHi, preset.name)}</span></div>
      <span className="text-[9px] text-gray-400 font-medium">{preset.desc}</span>
    </button>
  );
};

const TitleLivePreview = ({ title, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  if (!title) return null;
  const parts = title.split(/([|:\-–—•#])/g);
  return (
    <div className="mt-3 p-3 bg-gray-900 dark:bg-black rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1"><Eye className="w-3 h-3" /> {t('लाइव पूर्वावलोकन','Live Preview')}</span>
        <span className="text-[10px] text-gray-500 tabular-nums">{title.length} {t('अक्षर','chars')}</span>
      </div>
      <p className="text-sm font-medium text-white leading-relaxed">
        {parts.map((part,i) => <span key={i} className={/[|:\-–—•#]/.test(part) ? 'text-primary-400 font-bold mx-0.5' : ''}>{part}</span>)}
      </p>
    </div>
  );
};

const ContentTagDisplay = ({ names, language, type, color, icon: Icon }) => {
  const colorMap = { blue:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200', green:'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200', purple:'bg-purple-100 dark:bg-purple-900/30 text-purple-700 border-purple-200', amber:'bg-amber-100 dark:bg-amber-900/30 text-amber-700 border-amber-200' };
  if (!names || names.length === 0) return null;
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Icon className="w-3 h-3" /> {type}</span>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name,i) => <span key={i} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colorMap[color]} flex items-center gap-1`} title={name}><span className="truncate max-w-[200px]">{name}</span></span>)}
      </div>
    </div>
  );
};

const TitleGenerator = ({ formData, mainFilters, testNumber, language = 'hi', onTitleChange, getUnitOptions, getChapterOptions, getTopicOptions, getSubtopicOptions, pyqInfo = null }) => {
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

  const formatPresets = [
    { key: 'standard', name: 'Standard', nameHi: 'मानक', icon: Type, desc: 'Paper | Content - Type #N' },
    { key: 'detailed', name: 'Detailed', nameHi: 'विस्तृत', icon: AlignLeft, desc: 'Full names included' },
    { key: 'compact', name: 'Compact', nameHi: 'संक्षिप्त', icon: Code, desc: 'Short code format' },
    { key: 'academic', name: 'Academic', nameHi: 'शैक्षिक', icon: Crown, desc: 'Formal UGC NET style' },
    { key: 'dated', name: 'Dated', nameHi: 'दिनांकित', icon: Calendar, desc: 'With date & session' },
  ];

  const truncStr = (str, maxLen = 30) => !str ? '' : str.length > maxLen ? str.substring(0, maxLen) + '…' : str;

  const getCurrentDate = () => {
    const now = new Date();
    return { day: now.getDate(), dayStr: now.toLocaleDateString('en-IN',{day:'2-digit'}), month: now.toLocaleDateString('en-IN',{month:'short'}), monthFull: now.toLocaleDateString('en-IN',{month:'long'}), year: now.getFullYear(), yearShort: now.toLocaleDateString('en-IN',{year:'2-digit'}), weekday: now.toLocaleDateString('en-IN',{weekday:'short'}), weekdayFull: now.toLocaleDateString('en-IN',{weekday:'long'}) };
  };

  const getSelectedNames = useCallback(() => {
    const result = { paperShort:'', paperFull:'', paperFullHi:'', unitFullNames:[], unitShortNames:[], chapterFullNames:[], chapterShortNames:[], topicFullNames:[], topicShortNames:[], subtopicFullNames:[], subtopicShortNames:[], unitCount: mainFilters.units.length, chapterCount: mainFilters.chapters.length, topicCount: mainFilters.topics.length, subtopicCount: (mainFilters.subtopics || []).length };
    if (mainFilters.papers.length === 2) { result.paperShort = 'P1+P2'; result.paperFull = 'Paper 1 + Paper 2'; result.paperFullHi = 'पेपर 1 + पेपर 2'; }
    else if (mainFilters.papers.includes('paper1')) { result.paperShort = 'P1'; result.paperFull = 'Paper 1'; result.paperFullHi = 'पेपर 1'; }
    else if (mainFilters.papers.includes('paper2')) { result.paperShort = 'P2'; result.paperFull = 'Paper 2 (History)'; result.paperFullHi = 'पेपर 2 (इतिहास)'; }
    else { result.paperShort = 'P1'; result.paperFull = 'Paper 1'; result.paperFullHi = 'पेपर 1'; }

    if (getUnitOptions) {
      const unitOpts = getUnitOptions(mainFilters.papers);
      mainFilters.units.forEach(unitKey => {
        const opt = unitOpts.find(o => o.value === unitKey);
        if (opt) { const wP = (opt.label||'').replace(/^P[12]:\s*/i,'').trim(); result.unitFullNames.push(wP); result.unitShortNames.push(opt.shortName || wP.replace(/^(UNIT|इकाई)\s*[IVX\d]+:\s*/i,'').trim()); }
      });
    }
    if (getChapterOptions) {
      const chOpts = getChapterOptions(mainFilters.units, mainFilters.papers);
      mainFilters.chapters.forEach(chKey => { const opt = chOpts.find(o => o.value === chKey); if (opt) { result.chapterFullNames.push(opt.label||chKey); result.chapterShortNames.push(opt.shortName||opt.label||chKey); } });
    }
    if (getTopicOptions) {
      const topicOpts = getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers);
      mainFilters.topics.forEach(topicVal => { const opt = topicOpts.find(o => o.value === topicVal); if (opt) { result.topicFullNames.push(opt.label||topicVal); result.topicShortNames.push(opt.shortName||opt.label||topicVal); } });
    }
    if (getSubtopicOptions) {
      const subtopicOpts = getSubtopicOptions(mainFilters.topics, mainFilters.chapters, mainFilters.units, mainFilters.papers);
      (mainFilters.subtopics || []).forEach(val => { const opt = subtopicOpts.find(o => o.value === val); if (opt) { result.subtopicFullNames.push(opt.label||val); result.subtopicShortNames.push(opt.shortName||opt.label||val); } });
    }
    return result;
  }, [mainFilters, getUnitOptions, getChapterOptions, getTopicOptions, getSubtopicOptions, language]);

  const getMostSpecific = useCallback((names) => {
    if (names.subtopicFullNames.length > 0) return { type:'subtopic', full:names.subtopicFullNames, short:names.subtopicShortNames };
    if (names.topicFullNames.length > 0) return { type:'topic', full:names.topicFullNames, short:names.topicShortNames };
    if (names.chapterFullNames.length > 0) return { type:'chapter', full:names.chapterFullNames, short:names.chapterShortNames };
    if (names.unitFullNames.length > 0) return { type:'unit', full:names.unitFullNames, short:names.unitShortNames };
    return { type:'paper', full:[], short:[] };
  }, []);

  // ═══════════════════════════════════════════
  // CHECK IF PYQ DATA EXISTS
  // ═══════════════════════════════════════════
  const hasPYQ = useMemo(() => {
    if (!pyqInfo) return false;
    return pyqInfo.count > 0 || pyqInfo.years.length > 0 || pyqInfo.chapters.length > 0 || pyqInfo.topics.length > 0 || pyqInfo.units.length > 0;
  }, [pyqInfo]);

  // ═══════════════════════════════════════════
  // GENERATE SUGGESTIONS — PYQ FIRST when available
  // ═══════════════════════════════════════════
  const generateSuggestions = useCallback(() => {
    const cfg = TEST_TYPE_CONFIG[formData.testType];
    const names = getSelectedNames();
    const date = getCurrentDate();
    const sc = cfg?.shortCode || 'TEST';
    const num = testNumber || Math.floor(Math.random() * 100) + 1;
    const prefix = customPrefix ? `${customPrefix} ` : '';
    const suffix = customSuffix ? ` ${customSuffix}` : '';
    const dateStr = includeDate ? ` | ${date.dayStr} ${date.month} ${date.yearShort}` : '';
    const typeName = t(cfg?.nameHi, cfg?.name) || sc;
    const pShort = names.paperShort;
    const pFull = t(names.paperFullHi, names.paperFull);
    const suggestions = [];

    const add = (title) => {
      const final = `${prefix}${title}${suffix}${dateStr}`.replace(/\s+/g, ' ').trim();
      if (final && final.length > 3 && !suggestions.includes(final)) suggestions.push(final);
    };

    // ═══════════════════════════════════════════════════════════
    // HELPER: Build content strings at each level with FULL names
    // ═══════════════════════════════════════════════════════════
    const buildContent = (items, maxItems = 3, maxLen = 60) => {
      if (!items || items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length <= maxItems) return items.join(', ');
      return `${items.slice(0, maxItems - 1).join(', ')} +${items.length - maxItems + 1} ${t('और', 'more')}`;
    };

    const buildShort = (items, maxItems = 2, charLimit = 40) => {
      if (!items || items.length === 0) return '';
      const truncated = items.map(i => truncStr(i, charLimit));
      if (truncated.length === 1) return truncated[0];
      if (truncated.length <= maxItems) return truncated.join(', ');
      return `${truncated.slice(0, maxItems).join(', ')} +${items.length - maxItems}`;
    };

    // ── Syllabus content ──
    const unitsFull = buildContent(names.unitFullNames, 2);
    const unitsShort = buildShort(names.unitShortNames, 2, 30);
    const chaptersFull = buildContent(names.chapterFullNames, 3);
    const chaptersShort = buildShort(names.chapterShortNames, 2, 30);
    const topicsFull = buildContent(names.topicFullNames, 3);
    const topicsShort = buildShort(names.topicShortNames, 2, 25);
    const subtopicsFull = buildContent(names.subtopicFullNames, 3);
    const subtopicsShort = buildShort(names.subtopicShortNames, 2, 25);

    // ── PYQ content (FULL names, not truncated) ──
    let pyqYears = '', pyqSession = '', pyqUnits = '', pyqChapters = '', pyqTopics = '';
    let pyqChaptersFull = '', pyqTopicsFull = '', pyqUnitsFull = '';

    if (hasPYQ && pyqInfo) {
      pyqYears = pyqInfo.years.length === 1 ? pyqInfo.years[0]
        : pyqInfo.years.length === 2 ? pyqInfo.years.join(' & ')
        : pyqInfo.years.length > 2 ? `${pyqInfo.years[0]}-${pyqInfo.years[pyqInfo.years.length - 1]}`
        : '';
      pyqSession = pyqInfo.sessions.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');

      // FULL names for PYQ content
      pyqUnitsFull = buildContent(pyqInfo.units, 2);
      pyqUnits = buildShort(pyqInfo.units, 2, 35);
      pyqChaptersFull = buildContent(pyqInfo.chapters, 3);
      pyqChapters = buildShort(pyqInfo.chapters, 2, 30);
      pyqTopicsFull = buildContent(pyqInfo.topics, 3);
      pyqTopics = buildShort(pyqInfo.topics, 2, 25);
    }

    // Most specific PYQ content for short titles
    const pyqBestContent = pyqTopics || pyqChapters || pyqUnits;
    const pyqBestContentFull = pyqTopicsFull || pyqChaptersFull || pyqUnitsFull;

    // ═══════════════════════════════════════════════════════════
    // GENERATE BY FORMAT
    // ═══════════════════════════════════════════════════════════
    if (activeFormat === 'standard') {
      if (hasPYQ) {
        // ── 1. FULL Unit name + Year (always first) ──
        if (pyqUnitsFull && pyqYears) {
          add(`PYQ ${pyqYears} | ${pyqUnitsFull} | ${pShort} - ${sc} #${num}`);
        }
        // ── 2. FULL Chapter names + Year ──
        if (pyqChaptersFull && pyqYears) {
          add(`PYQ ${pyqYears} | ${pyqChaptersFull} | ${pShort} #${num}`);
        }
        // ── 3. FULL Topic names + Year ──
        if (pyqTopicsFull && pyqYears) {
          add(`PYQ ${pyqYears} | ${pyqTopicsFull} | ${pShort} #${num}`);
        }
        // ── 4. Hierarchy: Unit > Chapter ──
        if (pyqUnits && pyqChapters) {
          add(`PYQ ${pyqYears} | ${pyqUnits} > ${pyqChapters} | ${pShort} #${num}`);
        }
        // ── 5. Hierarchy: Chapter > Topic ──
        if (pyqChapters && pyqTopics) {
          add(`PYQ ${pyqYears} | ${pyqChapters} > ${pyqTopics} | ${pShort}`);
        }
        // ── 6. Year + Session + Content ──
        if (pyqSession && pyqBestContent) {
          add(`PYQ ${pyqYears} ${pyqSession} | ${pyqBestContent} | ${pShort} - ${sc} #${num}`);
        }
        // ── 7. Year + Session simple ──
        if (pyqYears && pyqSession) {
          add(`PYQ ${pyqYears} ${pyqSession} | ${pShort} - ${sc} #${num}`);
        }
        // ── 8. Count-based ──
        if (pyqInfo.count > 0) {
          add(`${pShort} | PYQ ${pyqYears} - ${pyqInfo.count}Q | ${pyqBestContent || typeName} #${num}`);
        }
        // ── 9. Simple PYQ ──
        add(`PYQ ${pyqYears || date.year} | ${pShort} - ${sc} #${num}`);
      } else {
        // Non-PYQ standard titles
        // ── 0. Subtopic-focused ──
        if (subtopicsFull) {
          add(`${pShort} | ${subtopicsFull} - ${sc} #${num}`);
        }
        // ── 1. Topic-focused (most specific) ──
        if (topicsFull) {
          add(`${pShort} | ${topicsFull} - ${sc} #${num}`);
        }
        // ── 2. Chapter-focused ──
        if (chaptersFull) {
          add(`${pShort} | ${chaptersFull} - ${sc} #${num}`);
        }
        // ── 3. Unit-focused ──
        if (unitsFull) {
          add(`${pShort} | ${unitsFull} - ${sc} #${num}`);
        }
        // ── 4. Hierarchy ──
        if (unitsShort && chaptersShort) {
          add(`${pShort} | ${unitsShort} > ${chaptersShort} - ${sc} #${num}`);
        }
        if (chaptersShort && topicsShort) {
          add(`${pShort} | ${chaptersShort} > ${topicsShort} - ${sc} #${num}`);
        }
        if (topicsShort && subtopicsShort) {
          add(`${pShort} | ${topicsShort} > ${subtopicsShort} - ${sc} #${num}`);
        }
        // ── 5. Type-specific ──
        switch (formData.testType) {
          case 'dpp': add(`DPP #${num} | ${subtopicsShort || topicsShort || chaptersShort || unitsShort || pShort}`); break;
          case 'chapter_test': add(`${t('अध्याय परीक्षा', 'Chapter Test')} | ${chaptersFull || unitsShort || pShort} #${num}`); break;
          case 'unit_test': add(`${t('इकाई परीक्षा', 'Unit Test')} | ${unitsFull || pShort} #${num}`); break;
          case 'topic_test': add(`${t('विषय परीक्षा', 'Topic Test')} | ${topicsFull || chaptersShort || pShort} #${num}`); break;
          case 'full_mock_p1': add(`${t('फुल मॉक पेपर 1', 'Full Mock Paper 1')} #${num}`); break;
          case 'full_mock_p2': add(`${t('फुल मॉक पेपर 2 (इतिहास)', 'Full Mock Paper 2 (History)')} #${num}`); break;
          case 'full_mock_combined': add(`${t('फुल मॉक संयुक्त', 'Full Mock Combined')} (P1+P2) #${num}`); break;
          default: break;
        }
        // ── 6. Generic fallback ──
        add(`${pShort} | ${typeName} #${num}`);
      }
    }
    if (activeFormat === 'detailed') {
      if (hasPYQ) {
        // ── FULL descriptive PYQ titles ──
        if (pyqUnitsFull) {
          add(`${t('पिछले वर्ष', 'Previous Year')} ${pyqYears} | ${pyqUnitsFull} | ${pFull}`);
        }
        if (pyqChaptersFull) {
          add(`PYQ ${pyqYears} | ${pyqChaptersFull} | ${pFull} [${sc}-${num}]`);
        }
        if (pyqTopicsFull) {
          add(`PYQ ${pyqYears} | ${pyqTopicsFull} | ${pFull} #${num}`);
        }
        // Full hierarchy
        if (pyqUnitsFull && pyqChaptersFull) {
          add(`PYQ ${pyqYears} | ${pyqUnitsFull} — ${pyqChaptersFull} | ${pFull}`);
        }
        if (pyqChaptersFull && pyqTopicsFull) {
          add(`PYQ ${pyqYears} | ${pyqChaptersFull} — ${pyqTopicsFull} | ${pFull}`);
        }
        // Session-based
        if (pyqSession) {
          add(`UGC NET PYQ ${pyqYears} ${pyqSession} | ${pFull} | ${pyqBestContentFull || typeName}`);
        }
        add(`UGC NET PYQ ${pyqYears} | ${pFull} | ${pyqInfo.count || ''} ${t('प्रश्न', 'Questions')} #${num}`);
        // Type focus
        const typeEntries = Object.entries(pyqInfo.types || {});
        if (typeEntries.length > 0) {
          const top = typeEntries.sort((a, b) => b[1] - a[1])[0];
          const topLabel = QUESTION_TYPE_LABELS[top[0]]?.[language] || top[0];
          add(`PYQ ${pyqYears} | ${topLabel} (${top[1]}Q) | ${pyqBestContent || pShort} #${num}`);
        }
      } else {
        // Non-PYQ detailed
        if (subtopicsFull) add(`${typeName} | ${subtopicsFull} | ${pFull}`);
        if (topicsFull) add(`${typeName} | ${topicsFull} | ${pFull}`);
        if (chaptersFull) add(`${pFull} — ${chaptersFull} [${sc} #${num}]`);
        if (unitsFull) add(`${pFull} | ${unitsFull} | ${typeName} #${num}`);
        if (unitsFull && chaptersFull) add(`${unitsFull} — ${chaptersFull} | ${pFull} [${sc}-${num}]`);
        if (chaptersFull && topicsFull) add(`${chaptersFull} — ${topicsFull} | ${pFull} #${num}`);
        if (topicsFull && subtopicsFull) add(`${topicsFull} — ${subtopicsFull} | ${pFull} #${num}`);
        add(`UGC NET ${date.year} | ${pFull} | ${typeName} #${num}`);
        add(`${pFull} | ${typeName} #${num}`);
      }
    }
    if (activeFormat === 'compact') {
      if (hasPYQ) {
        add(`PYQ-${pyqYears}-${pShort}-${String(num).padStart(3, '0')}`);
        if (pyqSession) add(`PYQ${pyqYears}${pyqSession.substring(0, 3).toUpperCase()}/${pShort}/${num}`);
        add(`PYQ#${num} ${pyqYears} ${pShort}`);
        if (pyqBestContent) add(`PYQ-${pyqYears} ${truncStr(pyqBestContent, 20)}`);
      }
      add(`${sc}-${pShort}-${String(num).padStart(3, '0')}`);
      if (names.unitShortNames[0]) add(`${sc}#${num} ${truncStr(names.unitShortNames[0], 15)}`);
      add(`${pShort}_${sc}_${date.dayStr}${date.month}${date.yearShort}`);
    }
    if (activeFormat === 'academic') {
      if (hasPYQ) {
        add(`UGC NET PYQ ${pyqYears} | ${pFull} | ${typeName} #${num}`);
        if (pyqSession) add(`UGC NET ${pyqYears} ${pyqSession} | ${pFull} | PYQ Set ${num}`);
        if (pyqBestContentFull) add(`${pFull}: PYQ ${pyqYears} | ${pyqBestContentFull} [${sc}-${num}]`);
        add(`National Eligibility Test | PYQ ${pyqYears} | ${names.paperFull} #${num}`);
      }
      add(`UGC NET ${pFull} | ${typeName} #${num}`);
      if (chaptersFull || unitsFull) add(`${pFull}: ${chaptersFull || unitsFull} [${sc}-${num}]`);
      add(`NET ${date.year} | ${pShort} | ${typeName} Series ${num}`);
    }
    if (activeFormat === 'dated') {
      if (hasPYQ) {
        add(`${date.dayStr} ${date.month} ${date.year} | PYQ ${pyqYears} | ${pShort} #${num}`);
        if (pyqBestContent) add(`${date.dayStr}/${date.month}/${date.yearShort} | PYQ ${pyqYears} | ${pyqBestContent}`);
        add(`${date.weekday} | PYQ ${pyqYears} ${pyqSession || ''} | ${pShort}`);
      }
      add(`${date.dayStr} ${date.month} ${date.year} | ${pShort} | ${sc} #${num}`);
      add(`${date.weekday} ${date.dayStr} ${date.month} | ${subtopicsShort || topicsShort || chaptersShort || unitsShort || pShort} - ${sc}`);
      add(`${date.monthFull} ${date.year} | ${pShort} ${typeName} #${num}`);
    }
    return [...new Set(suggestions)].filter(s => s.trim()).slice(0, 10);
  }, [formData.testType, getSelectedNames, getMostSpecific, testNumber, language, refreshKey, activeFormat, customPrefix, customSuffix, includeDate, pyqInfo, hasPYQ]);

  const suggestions = useMemo(() => generateSuggestions(), [generateSuggestions]);

  const currentTitle = useMemo(() => {
    if (formData.title?.trim()) return formData.title;
    return suggestions[0] || '';
  }, [formData.title, suggestions]);

  const selectedNames = useMemo(() => getSelectedNames(), [getSelectedNames]);

  const handleSelectSuggestion = (suggestion) => { onTitleChange(suggestion); setIsEditing(false); addToHistory(suggestion); };
  const handleCopyTitle = async (title, index = -1) => { try { await navigator.clipboard.writeText(title); setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); } catch {} };
  const handleRefresh = () => setRefreshKey(p => p + 1);
  const handleClearTitle = () => { onTitleChange(''); setCustomTitle(''); setIsEditing(false); };
  const handleSaveTitle = () => { if (customTitle.trim()) { onTitleChange(customTitle.trim()); addToHistory(customTitle.trim()); } setIsEditing(false); };
  const addToHistory = (title) => { setTitleHistory(prev => [{ title, timestamp: Date.now() }, ...prev.filter(h => h.title !== title)].slice(0, 15)); };
  const removeFromHistory = (ts) => setTitleHistory(prev => prev.filter(h => h.timestamp !== ts));
  useEffect(() => { if (isEditing) setCustomTitle(formData.title || currentTitle); }, [isEditing]);
  const insertAtCursor = (text) => { setCustomTitle(prev => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${text}`); };

  const typeConfig = TEST_TYPE_CONFIG[formData.testType];
  const typeGradient = { dpp:'from-blue-500 to-indigo-600', topic_test:'from-emerald-500 to-teal-600', chapter_test:'from-purple-500 to-violet-600', unit_test:'from-orange-500 to-amber-600', pyq_year:'from-red-500 to-rose-600', practice:'from-cyan-500 to-blue-600', full_mock_p1:'from-indigo-500 to-purple-600', full_mock_p2:'from-pink-500 to-rose-600', full_mock_combined:'from-gray-600 to-slate-700' }[formData.testType] || 'from-gray-500 to-gray-600';

  return (
    <div className="space-y-4">
      {/* ═══ MAIN TITLE PREVIEW ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${typeGradient} flex items-center justify-center shadow-lg`}><Hash className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">{t('परीक्षा शीर्षक','Test Title')}</h3>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {formData.title ? t('कस्टम','Custom') : t('स्वतः','Auto')}
                  <span className="mx-1">•</span>
                  <span className="tabular-nums">{currentTitle.length} {t('अक्षर','chars')}</span>
                  {hasPYQ && <><span className="mx-1">•</span><Star className="w-3 h-3 text-amber-500" /><span className="text-amber-600 font-bold">PYQ</span></>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handleRefresh} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl group"><RefreshCw className="w-4 h-4 text-gray-500 group-hover:text-primary-600 group-hover:rotate-180 transition-all duration-500" /></button>
              <button type="button" onClick={() => handleCopyTitle(currentTitle,-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl group">{copiedIndex === -1 ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500 group-hover:text-primary-600" />}</button>
              <button type="button" onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl group"><Edit3 className="w-4 h-4 text-gray-500 group-hover:text-primary-600" /></button>
              <button type="button" onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-xl ${showHistory ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-500'}`}><History className="w-4 h-4" /></button>
              <button type="button" onClick={() => setShowLivePreview(!showLivePreview)} className={`p-2 rounded-xl ${showLivePreview ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}>{showLivePreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="relative">
                <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder={t('शीर्षक लिखें...','Type title...')}
                  className="w-full px-4 py-3.5 pr-24 text-base font-semibold border-2 border-primary-500 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/20" autoFocus maxLength={120} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 tabular-nums mr-1">{customTitle.length}/120</span>
                  <button type="button" onClick={handleClearTitle} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  <button type="button" onClick={handleSaveTitle} className="p-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">{t('तुरंत जोड़ें:','Quick Insert:')}</span>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => insertAtCursor(selectedNames.paperShort)} className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">{selectedNames.paperShort}</button>
                  <button type="button" onClick={() => insertAtCursor(typeConfig?.shortCode||'TEST')} className="px-2 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200">{typeConfig?.shortCode}</button>
                  <button type="button" onClick={() => insertAtCursor(`#${testNumber}`)} className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200">#{testNumber}</button>
                  <button type="button" onClick={() => insertAtCursor('|')} className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-700 rounded-md">|</button>
                  <button type="button" onClick={() => insertAtCursor('-')} className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-700 rounded-md">-</button>
                  {hasPYQ && pyqInfo.years.map(yr => <button key={yr} type="button" onClick={() => insertAtCursor(`PYQ ${yr}`)} className="px-2 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200">PYQ {yr}</button>)}
                  {hasPYQ && pyqInfo.chapters.slice(0,2).map((ch,i) => <button key={i} type="button" onClick={() => insertAtCursor(ch)} className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-md hover:bg-green-200 truncate max-w-[100px]">{truncStr(ch,12)}</button>)}
                  {selectedNames.unitShortNames.slice(0,2).map((name,i) => <button key={`u${i}`} type="button" onClick={() => insertAtCursor(name)} className="px-2 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 truncate max-w-[100px]">{truncStr(name,12)}</button>)}
                </div>
              </div>
              {customTitle && <TitleLivePreview title={customTitle} language={language} />}
            </div>
          ) : (
            <div className="relative group">
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r ${typeGradient} shadow-lg flex items-center gap-1.5`}><Sparkles className="w-3.5 h-3.5" />{typeConfig?.shortCode||'TEST'}</span>
                {formData.title && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-semibold flex items-center gap-1"><Star className="w-3 h-3" />{t('कस्टम','Custom')}</span>}
                {hasPYQ && <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" />PYQ</span>}
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded-lg font-semibold">{formatPresets.find(f => f.key === activeFormat)?.name}</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight pr-4 break-words">
                {currentTitle || t('शीर्षक यहाँ दिखेगा...','Title will appear here...')}
              </h2>
              {showLivePreview && currentTitle && <TitleLivePreview title={currentTitle} language={language} />}
            </div>
          )}

          {currentTitle && !isEditing && <div className="mt-4"><TitleQualityBadge title={currentTitle} language={language} /></div>}
        </div>
      </div>

      {/* ═══ HISTORY ═══ */}
      {showHistory && titleHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><History className="w-3.5 h-3.5 text-gray-400" />{t('हाल के','Recent')} ({titleHistory.length})</h4>
            <button type="button" onClick={() => setTitleHistory([])} className="text-[10px] text-red-600 hover:underline font-bold">{t('साफ़','Clear')}</button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {titleHistory.map(h => (
              <div key={h.timestamp} className="flex items-center gap-2 group">
                <button type="button" onClick={() => handleSelectSuggestion(h.title)} className="flex-1 text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-700 hover:bg-gray-100 truncate font-medium border border-transparent hover:border-gray-200">{h.title}</button>
                <span className="text-[9px] text-gray-400 tabular-nums">{new Date(h.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                <button type="button" onClick={() => removeFromHistory(h.timestamp)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 rounded-md"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ CONTENT DETAILS ═══ */}
      {showContentDetails && (selectedNames.unitFullNames.length > 0 || selectedNames.chapterFullNames.length > 0 || selectedNames.topicFullNames.length > 0 || selectedNames.subtopicFullNames.length > 0 || hasPYQ) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-blue-500" />{t('चयनित सामग्री (पूर्ण नाम)','Selected Content (Full Names)')}</h4>
            <button type="button" onClick={() => setShowContentDetails(!showContentDetails)} className="text-[10px] text-gray-400 hover:text-gray-600 font-bold">{showContentDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
          </div>
          <div className="space-y-3">
            <ContentTagDisplay names={selectedNames.unitFullNames} language={language} type={t('इकाइयां','Units')} color="blue" icon={Target} />
            <ContentTagDisplay names={selectedNames.chapterFullNames} language={language} type={t('अध्याय','Chapters')} color="green" icon={BookOpen} />
            <ContentTagDisplay names={selectedNames.topicFullNames} language={language} type={t('विषय','Topics')} color="purple" icon={Layers} />
            <ContentTagDisplay names={selectedNames.subtopicFullNames} language={language} type={t('उपविषय','Subtopics')} color="amber" icon={FileText} />
            {hasPYQ && <>
              <ContentTagDisplay names={pyqInfo.years.map(y => `PYQ ${y}`)} language={language} type={t('PYQ वर्ष','PYQ Years')} color="amber" icon={Star} />
              {pyqInfo.chapters.length > 0 && <ContentTagDisplay names={pyqInfo.chapters} language={language} type={t('PYQ अध्याय','PYQ Chapters')} color="green" icon={BookOpen} />}
              {pyqInfo.topics.length > 0 && <ContentTagDisplay names={pyqInfo.topics} language={language} type={t('PYQ विषय','PYQ Topics')} color="purple" icon={Tag} />}
            </>}
          </div>
        </div>
      )}

      {/* ═══ FORMAT PRESETS ═══ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-purple-500" />{t('शीर्षक शैली','Title Style')}</h4>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-[10px] font-bold text-primary-600 hover:underline flex items-center gap-1"><Sliders className="w-3 h-3" />{showAdvanced ? t('छुपाएं','Hide') : t('विकल्प','Options')}</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formatPresets.map(preset => <FormatPreset key={preset.key} preset={preset} isActive={activeFormat === preset.key} language={language} onClick={() => { setActiveFormat(preset.key); setRefreshKey(p => p + 1); }} />)}
        </div>
        {showAdvanced && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">{t('उपसर्ग','Prefix')}</label><input type="text" value={customPrefix} onChange={e => { setCustomPrefix(e.target.value); setRefreshKey(p => p+1); }} placeholder="e.g. NET 2024" maxLength={20} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 mb-1 block">{t('प्रत्यय','Suffix')}</label><input type="text" value={customSuffix} onChange={e => { setCustomSuffix(e.target.value); setRefreshKey(p => p+1); }} placeholder="e.g. v2, Final" maxLength={20} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" /></div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button type="button" onClick={() => { setIncludeDate(!includeDate); setRefreshKey(p => p+1); }} className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${includeDate ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 text-gray-600 bg-white'}`}><Calendar className="w-3 h-3" />{t('तिथि','Date')}</button>
              {(customPrefix||customSuffix||includeDate) && <button type="button" onClick={() => { setCustomPrefix(''); setCustomSuffix(''); setIncludeDate(false); setRefreshKey(p => p+1); }} className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 border border-red-200"><Undo2 className="w-3 h-3" />{t('रीसेट','Reset')}</button>}
            </div>
          </div>
        )}
      </div>

      {/* ═══ SUGGESTIONS ═══ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md"><Zap className="w-4 h-4 text-white" /></div>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t('सुझाव','Suggestions')}</h4>
              <p className="text-[10px] text-gray-500">{suggestions.length} {t('विकल्प','options')} • {t('क्लिक से चुनें','click to apply')}</p>
            </div>
          </div>
          <button type="button" onClick={handleRefresh} className="px-3 py-1.5 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-lg flex items-center gap-1.5"><Shuffle className="w-3.5 h-3.5" />{t('और','More')}</button>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {suggestions.map((suggestion, index) => (
            <TitleSuggestionChip key={`${suggestion}-${index}-${refreshKey}`} suggestion={suggestion} isSelected={currentTitle === suggestion && !formData.title} onSelect={handleSelectSuggestion} />
          ))}
        </div>
        {suggestions.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t('सुझाव नहीं','No suggestions')}</p>
            <button type="button" onClick={handleRefresh} className="mt-2 text-sm text-primary-600 font-bold hover:underline">{t('पुनः प्रयास','Try Again')}</button>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
            <Target className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">
              {selectedNames.paperShort}
              {selectedNames.unitCount > 0 && ` • ${selectedNames.unitCount} ${t('इकाई','units')}`}
              {selectedNames.chapterCount > 0 && ` • ${selectedNames.chapterCount} ${t('अध्याय','ch')}`}
              {hasPYQ && ` • PYQ: ${pyqInfo.count||0}Q`}
              {hasPYQ && pyqInfo.years.length > 0 && ` (${pyqInfo.years.join(',')})`}
            </span>
          </div>
          {formData.title && <button type="button" onClick={handleClearTitle} className="px-3 py-1.5 text-[10px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />{t('स्वतः पर वापस','Reset to Auto')}</button>}
        </div>
      </div>

      {/* ═══ TAGS SUMMARY ═══ */}
      <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-850 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-gray-400" /><span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{t('शीर्षक स्रोत सामग्री','Title Source Material')}</span></div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-semibold flex items-center gap-1"><BookOpen className="w-3 h-3" />{selectedNames.paperShort}</span>
          <span className={`px-2.5 py-1 bg-gradient-to-r ${typeGradient} text-white text-xs rounded-lg font-bold`}>{typeConfig?.shortCode||'TEST'}</span>
          {selectedNames.unitFullNames.map((name,i) => <span key={`u-${i}`} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}><Target className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[150px]">{name}</span></span>)}
          {selectedNames.chapterFullNames.map((name,i) => <span key={`c-${i}`} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}><BookOpen className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[150px]">{name}</span></span>)}
          {selectedNames.topicFullNames.map((name,i) => <span key={`t-${i}`} className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}><Layers className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[150px]">{name}</span></span>)}
          {selectedNames.subtopicFullNames.map((name,i) => <span key={`st-${i}`} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-semibold flex items-center gap-1" title={name}><FileText className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[150px]">{name}</span></span>)}
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-bold flex items-center gap-1"><Hash className="w-3 h-3" />{testNumber}</span>
          {hasPYQ && <>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" />PYQ{pyqInfo.count > 0 ? `: ${pyqInfo.count}Q` : ''}</span>
            {pyqInfo.years.map((yr,i) => <span key={`pyr-${i}`} className="px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-lg font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" />{yr}</span>)}
            {pyqInfo.sessions.map((s,i) => <span key={`pys-${i}`} className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg font-semibold capitalize">{s}</span>)}
            {pyqInfo.chapters.slice(0,3).map((ch,i) => <span key={`pyc-${i}`} className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-lg font-semibold flex items-center gap-1" title={ch}><BookOpen className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[120px]">{ch}</span></span>)}
            {pyqInfo.topics.slice(0,3).map((tp,i) => <span key={`pyt-${i}`} className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg font-semibold flex items-center gap-1" title={tp}><Tag className="w-3 h-3 flex-shrink-0" /><span className="truncate max-w-[120px]">{tp}</span></span>)}
          </>}
          {selectedNames.unitCount === 0 && selectedNames.chapterCount === 0 && !hasPYQ && (
            <span className="text-[10px] text-gray-400 italic flex items-center gap-1 px-2"><Info className="w-3 h-3" />{t('फ़िल्टर चुनें','Select filters for names in title')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitleGenerator;