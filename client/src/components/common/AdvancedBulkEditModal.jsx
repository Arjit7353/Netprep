import React, { useState, useMemo } from 'react';
import { X, ChevronRight, Zap, AlertCircle, CheckCircle, Info, Folder, Settings, FileText, Tag, CheckSquare } from 'lucide-react';
import Button from './Button';
import SyllabusDropdown from '../syllabus/SyllabusDropdown';

const AdvancedBulkEditModal = ({
  isOpen,
  onClose,
  selectedCount,
  onSubmit,
  loading,
  syllabus,
  language = 'en'
}) => {
  const tl = (h, e) => language === 'hi' ? h : e;
  
  // ═══ STATE ═══
  const [activeTab, setActiveTab] = useState('classification');
  const [bulkEditData, setBulkEditData] = useState({
    // Classification
    paper: '',
    unit: '',
    chapter: '',
    topic: '',
    subtopic: '',
    // Properties
    difficulty: '',
    type: '',
    importance: '',
    // Content
    tags: '',
    keyTerms: '',
    source: '',
    // Meta
    year: '',
    isPYQ: '',
    pyqSession: '',
    pyqShift: '',
    isMemoryBased: '',
    // Review
    verificationStatus: '',
    correctnessStatus: '',
    isFlagged: '',
    reviewNotes: ''
  });

  const [changedFields, setChangedFields] = useState([]);

  // ═══ COMPUTE ═══
  // Removed static syllabus logic as SyllabusDropdown handles dynamic syllabus internally

  // ═══ HANDLERS ═══
  const handleFieldChange = (field, value) => {
    setBulkEditData(prev => ({ ...prev, [field]: value }));
    if (value && !changedFields.includes(field)) {
      setChangedFields(prev => [...prev, field]);
    } else if (!value && changedFields.includes(field)) {
      setChangedFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleClearField = (field) => {
    handleFieldChange(field, '');
  };

  const handleClearAll = () => {
    setBulkEditData({
      paper: '', unit: '', chapter: '', topic: '', subtopic: '',
      difficulty: '', type: '', importance: '', tags: '', keyTerms: '', source: '',
      year: '', isPYQ: '', pyqSession: '', pyqShift: '', isMemoryBased: '', verificationStatus: '',
      correctnessStatus: '', isFlagged: '', reviewNotes: ''
    });
    setChangedFields([]);
  };

  const handleSubmit = () => {
    const updates = {};
    changedFields.forEach(field => {
      if (bulkEditData[field]) {
        if (field === 'tags') {
          updates[field] = bulkEditData[field].split(',').map(t => t.trim()).filter(Boolean);
        } else if (field === 'keyTerms') {
          updates[field] = bulkEditData[field].split(',').map(t => t.trim()).filter(Boolean);
        } else if (field === 'importance') {
          updates[field] = parseInt(bulkEditData[field]) || 3;
        } else if (field === 'isPYQ' || field === 'isFlagged' || field === 'isMemoryBased') {
          updates[field] = bulkEditData[field] === 'true';
        } else {
          updates[field] = bulkEditData[field];
        }
      }
    });

    onSubmit(updates);
    handleClearAll();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'classification', label: tl('वर्गीकरण', 'Classification'), icon: <Folder className="w-4 h-4" /> },
    { id: 'properties', label: tl('गुण', 'Properties'), icon: <Settings className="w-4 h-4" /> },
    { id: 'content', label: tl('सामग्री', 'Content'), icon: <FileText className="w-4 h-4" /> },
    { id: 'meta', label: tl('मेटा', 'Meta'), icon: <Tag className="w-4 h-4" /> },
    { id: 'review', label: tl('समीक्षा', 'Review'), icon: <CheckSquare className="w-4 h-4" /> }
  ];

  const getFieldLabel = (field) => {
    const labels = {
      paper: tl('पेपर', 'Paper'),
      unit: tl('इकाई', 'Unit'),
      chapter: tl('अध्याय', 'Chapter'),
      topic: tl('विषय', 'Topic'),
      subtopic: tl('उप-विषय', 'Subtopic'),
      difficulty: tl('कठिनाई', 'Difficulty'),
      type: tl('प्रकार', 'Type'),
      importance: tl('महत्व', 'Importance'),
      tags: tl('टैग', 'Tags'),
      keyTerms: tl('मुख्य शर्तें', 'Key Terms'),
      source: tl('स्रोत', 'Source'),
      year: tl('वर्ष', 'Year'),
      isPYQ: tl('PYQ है', 'Is PYQ'),
      pyqSession: tl('PYQ सत्र', 'PYQ Session'),
      pyqShift: tl('PYQ शिफ्ट', 'PYQ Shift'),
      isMemoryBased: tl('मेमोरी आधारित', 'Memory Based'),
      verificationStatus: tl('सत्यापन स्थिति', 'Verification Status'),
      correctnessStatus: tl('सही स्थिति', 'Correctness Status'),
      isFlagged: tl('ध्वज', 'Flagged'),
      reviewNotes: tl('समीक्षा नोट्स', 'Review Notes')
    };
    return labels[field] || field;
  };

  const renderField = (field, type = 'text', options = []) => {
    const isChanged = changedFields.includes(field);
    
    return (
      <div key={field} className={`p-3 rounded-xl border-2 transition-all ${
        isChanged
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
          : 'bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-700'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <label className={`text-xs font-bold uppercase tracking-wide ${
            isChanged ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-secondary-400'
          }`}>
            {getFieldLabel(field)}
          </label>
          {isChanged && (
            <button
              onClick={() => handleClearField(field)}
              className="text-[10px] text-primary-600 hover:text-primary-700 font-bold"
            >
              ✕ Reset
            </button>
          )}
        </div>

        {type === 'select' && (
          <select
            value={bulkEditData[field]}
            onChange={e => handleFieldChange(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg
                       bg-white dark:bg-secondary-900 text-gray-900 dark:text-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
          >
            <option value="">{tl('कोई परिवर्तन नहीं', 'No change')}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {type === 'text' && (
          <input
            type="text"
            value={bulkEditData[field]}
            onChange={e => handleFieldChange(field, e.target.value)}
            placeholder={tl('मान दर्ज करें...', 'Enter value...')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg
                       bg-white dark:bg-secondary-900 text-gray-900 dark:text-white text-sm
                       placeholder-gray-400 dark:placeholder-secondary-500
                       focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
          />
        )}

        {type === 'textarea' && (
          <textarea
            value={bulkEditData[field]}
            onChange={e => handleFieldChange(field, e.target.value)}
            placeholder={tl('मान दर्ज करें...', 'Enter value...')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg
                       bg-white dark:bg-secondary-900 text-gray-900 dark:text-white text-sm
                       placeholder-gray-400 dark:placeholder-secondary-500 resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
          />
        )}

        {type === 'number' && (
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                onClick={() => handleFieldChange(field, String(v))}
                className={`w-10 h-10 rounded-lg border-2 font-bold transition-all ${
                  bulkEditData[field] === String(v)
                    ? 'bg-amber-400 border-amber-400 text-white shadow-md'
                    : 'bg-white dark:bg-secondary-900 border-gray-300 dark:border-secondary-600 text-gray-700 dark:text-secondary-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {type === 'checkbox' && (
          <div className="flex items-center gap-3">
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleFieldChange(field, opt.value)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                  bulkEditData[field] === opt.value
                    ? `bg-${opt.color} border-${opt.color} text-white shadow-md`
                    : 'bg-white dark:bg-secondary-900 border-gray-300 dark:border-secondary-600 text-gray-700 dark:text-secondary-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-200 dark:border-secondary-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-secondary-700 bg-gradient-to-r from-primary-600 to-violet-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">{tl('उन्नत बल्क संपादन', 'Advanced Bulk Edit')}</h2>
              <p className="text-white/80 text-sm font-medium">{selectedCount} {tl('प्रश्न चयनित', 'questions selected')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex gap-1 px-6 py-3 border-b border-gray-200 dark:border-secondary-700 bg-gray-50 dark:bg-secondary-900/30 overflow-x-auto flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-secondary-800 text-gray-700 dark:text-secondary-300 hover:bg-gray-100 dark:hover:bg-secondary-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Classification Tab */}
          {activeTab === 'classification' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">{tl('प्रश्नों को पुनः वर्गीकृत करें। खाली मान मतलब कोई परिवर्तन नहीं।', 'Reclassify questions. Empty values mean no change.')}</p>
              </div>

              <div className="p-4 rounded-xl border-2 bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-700">
                <SyllabusDropdown 
                  multiSelect={true}
                  value={{
                    paper: bulkEditData.paper,
                    units: bulkEditData.unit ? bulkEditData.unit.split(', ').map(s => s.trim()).filter(Boolean) : [],
                    chapters: bulkEditData.chapter ? bulkEditData.chapter.split(', ').map(s => s.trim()).filter(Boolean) : [],
                    topics: bulkEditData.topic ? bulkEditData.topic.split(', ').map(s => s.trim()).filter(Boolean) : [],
                    subtopics: bulkEditData.subtopic ? bulkEditData.subtopic.split(', ').map(s => s.trim()).filter(Boolean) : []
                  }}
                  onChange={(data) => {
                    handleFieldChange('paper', data.paper || '');
                    handleFieldChange('unit', data.units ? data.units.join(', ') : '');
                    handleFieldChange('chapter', data.chapters ? data.chapters.join(', ') : '');
                    handleFieldChange('topic', data.topics ? data.topics.join(', ') : '');
                    handleFieldChange('subtopic', data.subtopics ? data.subtopics.join(', ') : '');
                  }}
                  language={language}
                />
              </div>

            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              {renderField('difficulty', 'checkbox', [
                { value: 'easy', label: tl('आसान', 'Easy'), color: 'emerald-500' },
                { value: 'medium', label: tl('मध्यम', 'Medium'), color: 'amber-500' },
                { value: 'hard', label: tl('कठिन', 'Hard'), color: 'red-500' }
              ])}

              {renderField('type', 'select', [
                { value: 'mcq', label: 'MCQ' },
                { value: 'assertion_reason', label: tl('अभिकथन-कारण', 'Assertion-Reason') },
                { value: 'match_following', label: tl('मिलान', 'Match Following') },
                { value: 'sequence_order', label: tl('क्रम', 'Sequence Order') },
                { value: 'statement_based', label: tl('कथन आधारित', 'Statement Based') }
              ])}

              <div className="p-3 rounded-xl border-2 bg-white dark:bg-secondary-900 border-gray-200 dark:border-secondary-700">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-secondary-400 mb-3 block">
                  {tl('महत्व (1-5)', 'Importance (1-5)')}
                </label>
                {renderField('importance', 'number')}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {renderField('tags', 'text')}
              <p className="text-[10px] text-gray-500 dark:text-secondary-400 italic">{tl('कॉमा से अलग करें', 'Comma separated')}</p>

              {renderField('keyTerms', 'text')}
              <p className="text-[10px] text-gray-500 dark:text-secondary-400 italic">{tl('कॉमा से अलग करें', 'Comma separated')}</p>

              {renderField('source', 'text')}
            </div>
          )}

          {/* Meta Tab */}
          {activeTab === 'meta' && (
            <div className="space-y-4">
              {renderField('isPYQ', 'checkbox', [
                { value: 'false', label: tl('नहीं', 'No'), color: 'gray-400' },
                { value: 'true', label: tl('हाँ', 'Yes'), color: 'orange-500' }
              ])}

              {renderField('year', 'select', Array.from({ length: 13 }, (_, i) => ({
                value: (2024 - i).toString(), label: (2024 - i).toString()
              })))}

              {renderField('pyqSession', 'select', [
                { value: 'june', label: tl('जून', 'June') },
                { value: 'december', label: tl('दिसंबर', 'December') },
                { value: 'november', label: tl('नवंबर', 'November') },
                { value: 'september', label: tl('सितंबर', 'September') }
              ])}

              {renderField('pyqShift', 'select', [
                { value: 'shift1', label: tl('शिफ्ट 1', 'Shift 1') },
                { value: 'shift2', label: tl('शिफ्ट 2', 'Shift 2') },
                { value: 'none', label: tl('कोई नहीं', 'None') }
              ])}

              {renderField('isMemoryBased', 'checkbox', [
                { value: 'false', label: tl('नहीं', 'No'), color: 'gray-400' },
                { value: 'true', label: tl('हाँ', 'Yes'), color: 'orange-500' }
              ])}
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              {renderField('verificationStatus', 'select', [
                { value: 'unchecked', label: tl('अनचेक', 'Unchecked') },
                { value: 'checked', label: tl('जांचा', 'Checked') },
                { value: 'verified', label: tl('सत्यापित', 'Verified') },
                { value: 'approved', label: tl('अनुमोदित', 'Approved') },
                { value: 'rejected', label: tl('अस्वीकृत', 'Rejected') }
              ])}

              {renderField('correctnessStatus', 'select', [
                { value: 'unknown', label: tl('अज्ञात', 'Unknown') },
                { value: 'correct', label: tl('सही', 'Correct') },
                { value: 'incorrect', label: tl('गलत', 'Incorrect') },
                { value: 'partially_correct', label: tl('आंशिक रूप से सही', 'Partially Correct') },
                { value: 'disputed', label: tl('विवादास्पद', 'Disputed') }
              ])}

              {renderField('isFlagged', 'checkbox', [
                { value: 'false', label: tl('नहीं', 'No'), color: 'gray-400' },
                { value: 'true', label: tl('हाँ', 'Yes'), color: 'orange-500' }
              ])}

              {renderField('reviewNotes', 'textarea')}
            </div>
          )}
        </div>

        {/* ═══ PREVIEW ═══ */}
        {changedFields.length > 0 && (
          <div className="px-6 py-3 bg-primary-50 dark:bg-primary-900/20 border-y border-primary-200 dark:border-primary-800 flex-shrink-0">
            <p className="text-xs font-bold text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> {changedFields.length} {tl('फील्ड बदलेंगे', 'fields will change')}
            </p>
            <div className="flex flex-wrap gap-2">
              {changedFields.map(field => (
                <span
                  key={field}
                  className="px-2 py-1 bg-primary-200 dark:bg-primary-700 text-primary-800 dark:text-primary-200 text-[10px] font-bold rounded-lg"
                >
                  {getFieldLabel(field)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-secondary-700 bg-gray-50 dark:bg-secondary-900/30 flex-shrink-0">
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-600 dark:text-secondary-400 hover:text-gray-900 font-bold"
          >
            {tl('सभी रीसेट करें', 'Reset All')}
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {tl('रद्द करें', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={changedFields.length === 0 || loading}
              icon={Zap}
            >
              {tl('अपडेट करें', 'Update')} {selectedCount}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedBulkEditModal;
