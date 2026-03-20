import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, X, Search,
  CheckSquare, Square, Layers, BookOpen, FileText, Tag,
  RefreshCw
} from 'lucide-react';
import { useSyllabus } from '../../hooks/useSyllabus';

// ── Searchable Multi-Checkbox Dropdown ──────────────────────────
const MultiSelectDropdown = ({
  label, labelHi, language, options, selected, onChange,
  disabled, placeholder, placeholderHi, icon: Icon,
  color = 'primary', loading = false
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label?.toLowerCase().includes(s) ||
        o.labelHi?.toLowerCase().includes(s)
    );
  }, [options, search]);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  const selectAll = () => onChange(filtered.map((o) => o.value));
  const clearAll = () => onChange([]);

  const colorMap = {
    primary: {
      badge: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
      border: 'border-primary-500',
      ring: 'ring-primary-500',
      check: 'text-primary-600',
      hover: 'hover:bg-primary-50 dark:hover:bg-primary-900/20',
    },
    emerald: {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      border: 'border-emerald-500',
      ring: 'ring-emerald-500',
      check: 'text-emerald-600',
      hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    },
    violet: {
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      border: 'border-violet-500',
      ring: 'ring-violet-500',
      check: 'text-violet-600',
      hover: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
    },
    amber: {
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      border: 'border-amber-500',
      ring: 'ring-amber-500',
      check: 'text-amber-600',
      hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
        {language === 'hi' ? labelHi : label}
        {selected.length > 0 && (
          <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${c.badge}`}>
            {selected.length}
          </span>
        )}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setOpen(!open)}
        className={`
          w-full px-3 py-2 text-left text-sm border rounded-lg transition-all
          flex items-center justify-between gap-2
          ${disabled || loading
            ? 'bg-gray-100 dark:bg-secondary-800 cursor-not-allowed border-gray-200 dark:border-secondary-700'
            : open
              ? `border-2 ${c.border} ring-1 ${c.ring} bg-white dark:bg-secondary-800`
              : 'border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 hover:border-gray-400'
          }
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className={`w-4 h-4 text-gray-400 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />}
          {selected.length === 0 ? (
            <span className="text-gray-400 dark:text-secondary-500 truncate">
              {loading ? (language === 'hi' ? 'लोड हो रहा है...' : 'Loading...') : (language === 'hi' ? placeholderHi : placeholder)}
            </span>
          ) : (
            <span className="text-gray-700 dark:text-secondary-200 truncate">
              {selected.length === 1
                ? options.find((o) => o.value === selected[0])?.[language === 'hi' ? 'labelHi' : 'label'] || selected[0]
                : `${selected.length} ${language === 'hi' ? 'चयनित' : 'selected'}`
              }
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg shadow-dropdown overflow-hidden animate-scale-in">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-secondary-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 rounded-md focus:outline-none focus:border-primary-400"
                placeholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                autoFocus
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-secondary-900/50 border-b border-gray-100 dark:border-secondary-700">
            <button type="button" onClick={selectAll} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              {language === 'hi' ? 'सभी चुनें' : 'Select All'}
            </button>
            <button type="button" onClick={clearAll} className="text-xs text-red-500 dark:text-red-400 hover:underline">
              {language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
            </button>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">
                {language === 'hi' ? 'कोई परिणाम नहीं' : 'No results'}
              </p>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`
                      w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors
                      ${isSelected ? c.hover + ' font-medium' : 'hover:bg-gray-50 dark:hover:bg-secondary-700'}
                    `}
                  >
                    {isSelected ? (
                      <CheckSquare className={`w-4 h-4 ${c.check} flex-shrink-0`} />
                    ) : (
                      <Square className="w-4 h-4 text-gray-300 dark:text-secondary-600 flex-shrink-0" />
                    )}
                    <span className={`truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-secondary-300'}`}>
                      {language === 'hi' ? opt.labelHi : opt.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Chips Display ───────────────────────────────────────────────
const SelectionChips = ({ items, onRemove, color = 'primary', icon: Icon, maxShow = 6 }) => {
  const [showAll, setShowAll] = useState(false);
  const colorMap = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
  const bg = colorMap[color] || colorMap.primary;
  const display = showAll ? items : items.slice(0, maxShow);
  const remaining = items.length - maxShow;

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {display.map((item, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg}`}>
          {Icon && <Icon className="w-3 h-3" />}
          <span className="max-w-[180px] truncate">{item.label}</span>
          <button
            type="button"
            onClick={() => onRemove(item.value)}
            className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 -mr-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {!showAll && remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} hover:opacity-80`}
        >
          +{remaining} more
        </button>
      )}
      {showAll && remaining > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="px-2 py-0.5 rounded-full text-xs text-gray-500 hover:text-gray-700 dark:text-secondary-400"
        >
          show less
        </button>
      )}
    </div>
  );
};

// ── Main SyllabusDropdown ───────────────────────────────────────
const SyllabusDropdown = ({
  value = {},
  onChange,
  language = 'hi',
  showPaper = true,
  showUnit = true,
  showChapter = true,
  showTopic = true,
  required = false,
  disabled = false,
  multiSelect = false,
}) => {
  // Use the syllabus hook to get dynamic data
  const { 
    syllabus, 
    loading: syllabusLoading, 
    getUnits, 
    getChapters, 
    getTopics,
    fetchSyllabus 
  } = useSyllabus();

  // ── Single-select state ──
  const [selectedPaper, setSelectedPaper] = useState(value.paper || '');
  const [selectedUnit, setSelectedUnit] = useState(value.unit || '');
  const [selectedChapter, setSelectedChapter] = useState(value.chapter || '');
  const [selectedTopic, setSelectedTopic] = useState(value.topic || '');

  // ── Multi-select state ──
  const [selectedUnits, setSelectedUnits] = useState(value.units || []);
  const [selectedChapters, setSelectedChapters] = useState(value.chapters || []);
  const [selectedTopics, setSelectedTopics] = useState(value.topics || []);

  // Sync from parent
  useEffect(() => {
    if (value.paper !== undefined) setSelectedPaper(value.paper || '');
    if (!multiSelect) {
      if (value.unit !== undefined) setSelectedUnit(value.unit || '');
      if (value.chapter !== undefined) setSelectedChapter(value.chapter || '');
      if (value.topic !== undefined) setSelectedTopic(value.topic || '');
    } else {
      if (value.units) setSelectedUnits(value.units);
      if (value.chapters) setSelectedChapters(value.chapters);
      if (value.topics) setSelectedTopics(value.topics);
    }
  }, [value.paper, value.unit, value.chapter, value.topic, value.units, value.chapters, value.topics, multiSelect]);

  // Get current syllabus based on selected paper
  const currentSyllabus = useMemo(() => {
    if (selectedPaper === 'paper1') return syllabus.paper1;
    if (selectedPaper === 'paper2') return syllabus.paper2;
    return null;
  }, [selectedPaper, syllabus]);

  const paperOptions = [
    { value: 'paper1', label: 'Paper 1 - General', labelHi: 'पेपर 1 - सामान्य' },
    { value: 'paper2', label: 'Paper 2 - History', labelHi: 'पेपर 2 - इतिहास' },
  ];

  // Generate unit options from dynamic syllabus data
  const unitOptions = useMemo(() => {
    if (!selectedPaper) return [];
    const units = getUnits(selectedPaper);
    return units.map((u) => ({
      value: u.name,
      label: u.name,
      labelHi: u.nameHi || u.name,
      id: u.id
    }));
  }, [selectedPaper, getUnits]);

  // Generate chapter options
  const chapterOptions = useMemo(() => {
    if (!selectedPaper) return [];
    const activeUnits = multiSelect ? selectedUnits : (selectedUnit ? [selectedUnit] : []);
    if (activeUnits.length === 0) return [];
    
    const chapters = [];
    activeUnits.forEach((uName) => {
      const unitChapters = getChapters(selectedPaper, uName);
      unitChapters.forEach((ch) => {
        if (!chapters.find((c) => c.value === ch.name)) {
          chapters.push({ 
            value: ch.name, 
            label: ch.name, 
            labelHi: ch.nameHi || ch.name,
            id: ch.id
          });
        }
      });
    });
    return chapters;
  }, [selectedPaper, multiSelect, selectedUnit, selectedUnits, getChapters]);

  // Generate topic options
  const topicOptions = useMemo(() => {
    if (!selectedPaper) return [];
    const activeUnits = multiSelect ? selectedUnits : (selectedUnit ? [selectedUnit] : []);
    const activeChapters = multiSelect ? selectedChapters : (selectedChapter ? [selectedChapter] : []);
    if (activeUnits.length === 0 || activeChapters.length === 0) return [];
    
    const topics = [];
    activeUnits.forEach((uName) => {
      activeChapters.forEach((cName) => {
        const chapterTopics = getTopics(selectedPaper, uName, cName);
        chapterTopics.forEach((t) => {
          if (!topics.find((x) => x.value === t.name)) {
            topics.push({ 
              value: t.name, 
              label: t.name, 
              labelHi: t.nameHi || t.name,
              id: t.id
            });
          }
        });
      });
    });
    return topics;
  }, [selectedPaper, multiSelect, selectedUnit, selectedUnits, selectedChapter, selectedChapters, getTopics]);

  // ── EMIT helpers ──
  const emitSingle = useCallback((paper, unit, chapter, topic) => {
    onChange({ paper, unit, chapter, topic });
  }, [onChange]);

  const emitMulti = useCallback((paper, units, chapters, topics) => {
    onChange({
      paper,
      units, chapters, topics,
      unit: units[0] || '',
      chapter: chapters[0] || '',
      topic: topics[0] || '',
    });
  }, [onChange]);

  // ── Handlers: single ──
  const handlePaperChange = (paper) => {
    setSelectedPaper(paper);
    if (multiSelect) {
      setSelectedUnits([]); setSelectedChapters([]); setSelectedTopics([]);
      emitMulti(paper, [], [], []);
    } else {
      setSelectedUnit(''); setSelectedChapter(''); setSelectedTopic('');
      emitSingle(paper, '', '', '');
    }
  };

  // ── Handlers: single select ──
  const handleUnitChange = (unit) => { 
    setSelectedUnit(unit); 
    setSelectedChapter(''); 
    setSelectedTopic(''); 
    emitSingle(selectedPaper, unit, '', ''); 
  };
  
  const handleChapterChange = (ch) => { 
    setSelectedChapter(ch); 
    setSelectedTopic(''); 
    emitSingle(selectedPaper, selectedUnit, ch, ''); 
  };
  
  const handleTopicChange = (t) => { 
    setSelectedTopic(t); 
    emitSingle(selectedPaper, selectedUnit, selectedChapter, t); 
  };

  // ── Handlers: multi select ──
  const handleUnitsChange = (units) => {
    setSelectedUnits(units);
    const validChapterNames = [];
    units.forEach((uName) => {
      const unitChapters = getChapters(selectedPaper, uName);
      unitChapters.forEach((ch) => validChapterNames.push(ch.name));
    });
    const newChapters = selectedChapters.filter((c) => validChapterNames.includes(c));
    setSelectedChapters(newChapters);
    
    const validTopicNames = [];
    units.forEach((uName) => {
      newChapters.forEach((cName) => {
        const chapterTopics = getTopics(selectedPaper, uName, cName);
        chapterTopics.forEach((t) => validTopicNames.push(t.name));
      });
    });
    const newTopics = selectedTopics.filter((t) => validTopicNames.includes(t));
    setSelectedTopics(newTopics);
    emitMulti(selectedPaper, units, newChapters, newTopics);
  };

  const handleChaptersChange = (chapters) => {
    setSelectedChapters(chapters);
    const validTopicNames = [];
    selectedUnits.forEach((uName) => {
      chapters.forEach((cName) => {
        const chapterTopics = getTopics(selectedPaper, uName, cName);
        chapterTopics.forEach((t) => validTopicNames.push(t.name));
      });
    });
    const newTopics = selectedTopics.filter((t) => validTopicNames.includes(t));
    setSelectedTopics(newTopics);
    emitMulti(selectedPaper, selectedUnits, chapters, newTopics);
  };

  const handleTopicsChange = (topics) => {
    setSelectedTopics(topics);
    emitMulti(selectedPaper, selectedUnits, selectedChapters, topics);
  };

  // ── Chip remove helpers ──
  const removeUnit = (val) => handleUnitsChange(selectedUnits.filter((v) => v !== val));
  const removeChapter = (val) => handleChaptersChange(selectedChapters.filter((v) => v !== val));
  const removeTopic = (val) => handleTopicsChange(selectedTopics.filter((v) => v !== val));

  // ── Render: SINGLE select (legacy) ──
  const renderSingleSelect = ({ label: lbl, labelHi: lHi, value: val, options: opts, onChange: oc, disabled: sd, placeholder: ph, placeholderHi: phHi }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
        {language === 'hi' ? lHi : lbl}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={val}
        onChange={(e) => oc(e.target.value)}
        disabled={disabled || sd || syllabusLoading}
        className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 dark:disabled:bg-secondary-800 disabled:cursor-not-allowed
          text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200"
      >
        <option value="">{syllabusLoading ? (language === 'hi' ? 'लोड हो रहा है...' : 'Loading...') : (language === 'hi' ? phHi : ph)}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {language === 'hi' ? (o.labelHi || o.label) : o.label}
          </option>
        ))}
      </select>
    </div>
  );

  // ── Total selection count (multi) ──
  const totalSelected = selectedUnits.length + selectedChapters.length + selectedTopics.length;

  // ── Breadcrumb (single mode) ──
  const renderBreadcrumb = () => {
    if (multiSelect) return null;
    if (!selectedPaper && !selectedUnit && !selectedChapter && !selectedTopic) return null;
    return (
      <div className="flex items-center flex-wrap gap-1 text-sm text-gray-600 dark:text-secondary-400 bg-gray-50 dark:bg-secondary-900/50 rounded-lg p-2">
        {selectedPaper && (
          <span className="px-2 py-0.5 bg-white dark:bg-secondary-800 rounded border border-gray-200 dark:border-secondary-700 flex items-center gap-1 text-xs">
            {selectedPaper === 'paper1' ? (language === 'hi' ? 'पेपर 1' : 'Paper 1') : (language === 'hi' ? 'पेपर 2' : 'Paper 2')}
            <button onClick={() => handlePaperChange('')} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
          </span>
        )}
        {selectedUnit && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="px-2 py-0.5 bg-white dark:bg-secondary-800 rounded border border-gray-200 dark:border-secondary-700 truncate max-w-[180px] flex items-center gap-1 text-xs">
              {selectedUnit.replace(/UNIT\s*/i, 'U').substring(0, 30)}
              <button onClick={() => handleUnitChange('')} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
            </span>
          </>
        )}
        {selectedChapter && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="px-2 py-0.5 bg-white dark:bg-secondary-800 rounded border border-gray-200 dark:border-secondary-700 truncate max-w-[140px] flex items-center gap-1 text-xs">
              {selectedChapter.substring(0, 25)}
              <button onClick={() => handleChapterChange('')} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
            </span>
          </>
        )}
        {selectedTopic && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="px-2 py-0.5 bg-white dark:bg-secondary-800 rounded border border-gray-200 dark:border-secondary-700 truncate max-w-[140px] flex items-center gap-1 text-xs">
              {selectedTopic.substring(0, 25)}
              <button onClick={() => handleTopicChange('')} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
            </span>
          </>
        )}
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Refresh Button */}
      {syllabusLoading && (
        <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{language === 'hi' ? 'पाठ्यक्रम लोड हो रहा है...' : 'Loading syllabus...'}</span>
        </div>
      )}

      {/* Breadcrumb (single mode only) */}
      {renderBreadcrumb()}

      {/* Multi-select summary bar */}
      {multiSelect && totalSelected > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {language === 'hi'
              ? `${totalSelected} आइटम चयनित`
              : `${totalSelected} items selected`
            }
          </span>
          <button
            type="button"
            onClick={() => { handleUnitsChange([]); }}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400"
          >
            {language === 'hi' ? 'सभी हटाएं' : 'Clear All'}
          </button>
        </div>
      )}

      {/* Dropdowns Grid */}
      <div className={`grid gap-4 ${
        multiSelect
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {/* Paper (always single-select) */}
        {showPaper && renderSingleSelect({
          label: 'Paper', labelHi: 'पेपर',
          value: selectedPaper, options: paperOptions,
          onChange: handlePaperChange, disabled: false,
          placeholder: 'Select Paper', placeholderHi: 'पेपर चुनें',
        })}

        {/* Unit */}
        {showUnit && (
          multiSelect ? (
            <MultiSelectDropdown
              label="Units" labelHi="इकाइयां" language={language}
              options={unitOptions} selected={selectedUnits}
              onChange={handleUnitsChange} disabled={!selectedPaper}
              placeholder="Select Units" placeholderHi="इकाइयां चुनें"
              icon={Layers} color="primary" loading={syllabusLoading}
            />
          ) : renderSingleSelect({
            label: 'Unit', labelHi: 'इकाई',
            value: selectedUnit, options: unitOptions,
            onChange: handleUnitChange, disabled: !selectedPaper,
            placeholder: 'Select Unit', placeholderHi: 'इकाई चुनें',
          })
        )}

        {/* Chapter */}
        {showChapter && (
          multiSelect ? (
            <MultiSelectDropdown
              label="Chapters" labelHi="अध्याय" language={language}
              options={chapterOptions} selected={selectedChapters}
              onChange={handleChaptersChange}
              disabled={multiSelect ? selectedUnits.length === 0 : !selectedUnit}
              placeholder="Select Chapters" placeholderHi="अध्याय चुनें"
              icon={BookOpen} color="emerald" loading={syllabusLoading}
            />
          ) : renderSingleSelect({
            label: 'Chapter', labelHi: 'अध्याय',
            value: selectedChapter, options: chapterOptions,
            onChange: handleChapterChange, disabled: !selectedUnit,
            placeholder: 'Select Chapter', placeholderHi: 'अध्याय चुनें',
          })
        )}

        {/* Topic */}
        {showTopic && (
          multiSelect ? (
            <MultiSelectDropdown
              label="Topics" labelHi="विषय" language={language}
              options={topicOptions} selected={selectedTopics}
              onChange={handleTopicsChange}
              disabled={multiSelect ? selectedChapters.length === 0 : !selectedChapter}
              placeholder="Select Topics" placeholderHi="विषय चुनें"
              icon={Tag} color="violet" loading={syllabusLoading}
            />
          ) : renderSingleSelect({
            label: 'Topic', labelHi: 'विषय',
            value: selectedTopic, options: topicOptions,
            onChange: handleTopicChange, disabled: !selectedChapter,
            placeholder: 'Select Topic', placeholderHi: 'विषय चुनें',
          })
        )}
      </div>

      {/* Chips (multi mode) */}
      {multiSelect && (
        <div className="space-y-1">
          <SelectionChips
            items={selectedUnits.map((v) => ({ value: v, label: unitOptions.find((o) => o.value === v)?.[language === 'hi' ? 'labelHi' : 'label'] || v }))}
            onRemove={removeUnit} color="primary" icon={Layers}
          />
          <SelectionChips
            items={selectedChapters.map((v) => ({ value: v, label: chapterOptions.find((o) => o.value === v)?.[language === 'hi' ? 'labelHi' : 'label'] || v }))}
            onRemove={removeChapter} color="emerald" icon={BookOpen}
          />
          <SelectionChips
            items={selectedTopics.map((v) => ({ value: v, label: topicOptions.find((o) => o.value === v)?.[language === 'hi' ? 'labelHi' : 'label'] || v }))}
            onRemove={removeTopic} color="violet" icon={Tag}
          />
        </div>
      )}
    </div>
  );
};

export default SyllabusDropdown;