import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, X } from 'lucide-react';
import syllabusPaper1 from '../../data/syllabusPaper1';
import syllabusPaper2History from '../../data/syllabusPaper2History';

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
  multiSelect = false // New prop for multi-select
}) => {
  const [selectedPaper, setSelectedPaper] = useState(value.paper || '');
  const [selectedUnit, setSelectedUnit] = useState(value.unit || '');
  const [selectedChapter, setSelectedChapter] = useState(value.chapter || '');
  const [selectedTopic, setSelectedTopic] = useState(value.topic || '');

  // Update state when value prop changes
  useEffect(() => {
    if (value.paper !== undefined) setSelectedPaper(value.paper || '');
    if (value.unit !== undefined) setSelectedUnit(value.unit || '');
    if (value.chapter !== undefined) setSelectedChapter(value.chapter || '');
    if (value.topic !== undefined) setSelectedTopic(value.topic || '');
  }, [value.paper, value.unit, value.chapter, value.topic]);

  // Get syllabus based on selected paper
  const currentSyllabus = useMemo(() => {
    if (selectedPaper === 'paper1') return syllabusPaper1;
    if (selectedPaper === 'paper2') return syllabusPaper2History;
    return null;
  }, [selectedPaper]);

  // Paper options
  const paperOptions = [
    { value: 'paper1', label: 'Paper 1 - General', labelHi: 'पेपर 1 - सामान्य' },
    { value: 'paper2', label: 'Paper 2 - History', labelHi: 'पेपर 2 - इतिहास' }
  ];

  // Get unit options
  const unitOptions = useMemo(() => {
    if (!currentSyllabus?.units) return [];
    return currentSyllabus.units.map(unit => ({
      value: unit.name,
      label: unit.name,
      labelHi: unit.nameHi
    }));
  }, [currentSyllabus]);

  // Get chapter options based on selected unit
  const chapterOptions = useMemo(() => {
    if (!currentSyllabus?.units || !selectedUnit) return [];
    const unit = currentSyllabus.units.find(u => u.name === selectedUnit);
    if (!unit?.chapters) return [];
    return unit.chapters.map(ch => ({
      value: ch.name,
      label: ch.name,
      labelHi: ch.nameHi
    }));
  }, [currentSyllabus, selectedUnit]);

  // Get topic options based on selected chapter
  const topicOptions = useMemo(() => {
    if (!currentSyllabus?.units || !selectedUnit || !selectedChapter) return [];
    const unit = currentSyllabus.units.find(u => u.name === selectedUnit);
    if (!unit?.chapters) return [];
    const chapter = unit.chapters.find(c => c.name === selectedChapter);
    if (!chapter?.topics) return [];
    return chapter.topics.map(t => ({
      value: t.name,
      label: t.name,
      labelHi: t.nameHi
    }));
  }, [currentSyllabus, selectedUnit, selectedChapter]);

  // Handle paper change
  const handlePaperChange = (paper) => {
    setSelectedPaper(paper);
    setSelectedUnit('');
    setSelectedChapter('');
    setSelectedTopic('');
    onChange({ paper, unit: '', chapter: '', topic: '' });
  };

  // Handle unit change
  const handleUnitChange = (unit) => {
    setSelectedUnit(unit);
    setSelectedChapter('');
    setSelectedTopic('');
    onChange({ paper: selectedPaper, unit, chapter: '', topic: '' });
  };

  // Handle chapter change
  const handleChapterChange = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedTopic('');
    onChange({ paper: selectedPaper, unit: selectedUnit, chapter, topic: '' });
  };

  // Handle topic change
  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
    onChange({ paper: selectedPaper, unit: selectedUnit, chapter: selectedChapter, topic });
  };

  // Render select component
  const renderSelect = ({ label, labelHi, value, options, onChange, disabled: selectDisabled, placeholder, placeholderHi }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {language === 'hi' ? labelHi : label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || selectDisabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          text-sm
        `}
      >
        <option value="">
          {language === 'hi' ? placeholderHi : placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {language === 'hi' ? opt.labelHi : opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Breadcrumb Display */}
      {(selectedPaper || selectedUnit || selectedChapter || selectedTopic) && (
        <div className="flex items-center flex-wrap gap-1 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
          {selectedPaper && (
            <span className="px-2 py-0.5 bg-white rounded border border-gray-200 flex items-center gap-1">
              {selectedPaper === 'paper1' 
                ? (language === 'hi' ? 'पेपर 1' : 'Paper 1') 
                : (language === 'hi' ? 'पेपर 2' : 'Paper 2')
              }
              <button 
                onClick={() => handlePaperChange('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedUnit && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="px-2 py-0.5 bg-white rounded border border-gray-200 truncate max-w-[200px] flex items-center gap-1">
                {selectedUnit.replace('UNIT ', '').substring(0, 30)}...
                <button 
                  onClick={() => handleUnitChange('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </>
          )}
          {selectedChapter && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="px-2 py-0.5 bg-white rounded border border-gray-200 truncate max-w-[150px] flex items-center gap-1">
                {selectedChapter.substring(0, 20)}...
                <button 
                  onClick={() => handleChapterChange('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </>
          )}
          {selectedTopic && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="px-2 py-0.5 bg-white rounded border border-gray-200 truncate max-w-[150px] flex items-center gap-1">
                {selectedTopic.substring(0, 20)}...
                <button 
                  onClick={() => handleTopicChange('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </>
          )}
        </div>
      )}

      {/* Dropdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paper Dropdown */}
        {showPaper && renderSelect({
          label: 'Paper',
          labelHi: 'पेपर',
          value: selectedPaper,
          options: paperOptions,
          onChange: handlePaperChange,
          disabled: false,
          placeholder: 'Select Paper',
          placeholderHi: 'पेपर चुनें'
        })}

        {/* Unit Dropdown */}
        {showUnit && renderSelect({
          label: 'Unit',
          labelHi: 'इकाई',
          value: selectedUnit,
          options: unitOptions,
          onChange: handleUnitChange,
          disabled: !selectedPaper,
          placeholder: 'Select Unit',
          placeholderHi: 'इकाई चुनें'
        })}

        {/* Chapter Dropdown */}
        {showChapter && renderSelect({
          label: 'Chapter',
          labelHi: 'अध्याय',
          value: selectedChapter,
          options: chapterOptions,
          onChange: handleChapterChange,
          disabled: !selectedUnit,
          placeholder: 'Select Chapter',
          placeholderHi: 'अध्याय चुनें'
        })}

        {/* Topic Dropdown */}
        {showTopic && renderSelect({
          label: 'Topic',
          labelHi: 'विषय',
          value: selectedTopic,
          options: topicOptions,
          onChange: handleTopicChange,
          disabled: !selectedChapter,
          placeholder: 'Select Topic',
          placeholderHi: 'विषय चुनें'
        })}
      </div>
    </div>
  );
};

export default SyllabusDropdown;