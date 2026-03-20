import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, Plus, Edit, Trash2, Save, X, ChevronRight, ChevronDown,
  Layers, FileText, Tag, AlertCircle, CheckCircle, RefreshCw,
  GripVertical, Settings, Database, Upload, Download, Search, Filter
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import syllabusService from '../services/syllabusService';

// ═══════════════════════════════════════════════════════════════
// MODAL COMPONENTS
// ═══════════════════════════════════════════════════════════════

const UnitModal = ({ paper, editingItem, language, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: editingItem?.id || '',
    name: editingItem?.name || '',
    nameHi: editingItem?.nameHi || '',
    part: editingItem?.part || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateId = () => {
    const timestamp = Date.now().toString(36);
    return `unit${timestamp}`;
  };

  useEffect(() => {
    if (!editingItem && !formData.id) {
      setFormData(prev => ({ ...prev, id: generateId() }));
    }
  }, [editingItem, formData.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        await syllabusService.updateUnit(editingItem.id, { ...formData, paper });
      } else {
        await syllabusService.addUnit({ ...formData, paper });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem
                  ? (language === 'hi' ? 'यूनिट संपादित करें' : 'Edit Unit')
                  : (language === 'hi' ? 'नई यूनिट जोड़ें' : 'Add New Unit')
                }
              </h2>
              <p className="text-sm text-gray-500 dark:text-secondary-400">
                {paper === 'paper1' ? 'Paper 1 - General' : 'Paper 2 - History'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'यूनिट ID' : 'Unit ID'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm"
                required
                disabled={!!editingItem}
                placeholder="e.g., unit1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'भाग (वैकल्पिक)' : 'Part (Optional)'}
              </label>
              <input
                type="text"
                value={formData.part}
                onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm"
                placeholder="e.g., Part A: Ancient India"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'नाम (English)' : 'Name (English)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              required
              placeholder="e.g., UNIT I: Teaching Aptitude"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'नाम (हिंदी)' : 'Name (Hindi)'}
            </label>
            <input
              type="text"
              value={formData.nameHi}
              onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              placeholder="e.g., इकाई I: शिक्षण अभिवृत्ति"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 font-medium transition-colors text-gray-700 dark:text-secondary-300"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {language === 'hi' ? 'सहेजें' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChapterModal = ({ paper, unit, editingItem, language, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: editingItem?.id || '',
    name: editingItem?.name || '',
    nameHi: editingItem?.nameHi || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateId = () => {
    const timestamp = Date.now().toString(36);
    return `ch${timestamp}`;
  };

  useEffect(() => {
    if (!editingItem && !formData.id) {
      setFormData(prev => ({ ...prev, id: generateId() }));
    }
  }, [editingItem, formData.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        await syllabusService.updateChapter(editingItem.id, { ...formData, paper, unitId: unit.id });
      } else {
        await syllabusService.addChapter({ ...formData, paper, unitId: unit.id });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem
                  ? (language === 'hi' ? 'अध्याय संपादित करें' : 'Edit Chapter')
                  : (language === 'hi' ? 'नया अध्याय जोड़ें' : 'Add New Chapter')
                }
              </h2>
              <p className="text-sm text-gray-500 dark:text-secondary-400 truncate max-w-xs">
                {language === 'hi' && unit.nameHi ? unit.nameHi : unit.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'अध्याय ID' : 'Chapter ID'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm"
              required
              disabled={!!editingItem}
              placeholder="e.g., ch1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'नाम (English)' : 'Name (English)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              required
              placeholder="e.g., Concept & Nature of Teaching"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'नाम (हिंदी)' : 'Name (Hindi)'}
            </label>
            <input
              type="text"
              value={formData.nameHi}
              onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              placeholder="e.g., शिक्षण की अवधारणा और प्रकृति"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 font-medium transition-colors text-gray-700 dark:text-secondary-300"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {language === 'hi' ? 'सहेजें' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TopicModal = ({ paper, unit, chapter, editingItem, language, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id: editingItem?.id || '',
    name: editingItem?.name || '',
    nameHi: editingItem?.nameHi || '',
    subtopics: editingItem?.subtopics || []
  });
  const [newSubtopic, setNewSubtopic] = useState('');
  const [newSubtopicHi, setNewSubtopicHi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateId = () => {
    const timestamp = Date.now().toString(36);
    return `t${timestamp}`;
  };

  useEffect(() => {
    if (!editingItem && !formData.id) {
      setFormData(prev => ({ ...prev, id: generateId() }));
    }
  }, [editingItem, formData.id]);

  const handleAddSubtopic = () => {
    if (newSubtopic.trim()) {
      setFormData({
        ...formData,
        subtopics: [...formData.subtopics, { name: newSubtopic.trim(), nameHi: newSubtopicHi.trim() }]
      });
      setNewSubtopic('');
      setNewSubtopicHi('');
    }
  };

  const handleRemoveSubtopic = (index) => {
    setFormData({
      ...formData,
      subtopics: formData.subtopics.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const subtopicsArray = formData.subtopics.map(st => {
        if (typeof st === 'string') return { name: st, nameHi: '' };
        return st;
      });
      
      if (editingItem) {
        await syllabusService.updateTopic(editingItem.id, {
          ...formData,
          subtopics: subtopicsArray,
          paper,
          unitId: unit.id,
          chapterId: chapter.id
        });
      } else {
        await syllabusService.addTopic({
          ...formData,
          subtopics: subtopicsArray,
          paper,
          unitId: unit.id,
          chapterId: chapter.id
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem
                  ? (language === 'hi' ? 'विषय संपादित करें' : 'Edit Topic')
                  : (language === 'hi' ? 'नया विषय जोड़ें' : 'Add New Topic')
                }
              </h2>
              <p className="text-sm text-gray-500 dark:text-secondary-400 truncate max-w-xs">
                {language === 'hi' && chapter.nameHi ? chapter.nameHi : chapter.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'विषय ID' : 'Topic ID'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm"
              required
              disabled={!!editingItem}
              placeholder="e.g., t1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'नाम (English)' : 'Name (English)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              required
              placeholder="e.g., Concept of Teaching"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
              {language === 'hi' ? 'नाम (हिंदी)' : 'Name (Hindi)'}
            </label>
            <input
              type="text"
              value={formData.nameHi}
              onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white"
              placeholder="e.g., शिक्षण की अवधारणा"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">
              {language === 'hi' ? 'उप-विषय (वैकल्पिक)' : 'Subtopics (Optional)'}
            </label>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                value={newSubtopic}
                onChange={(e) => setNewSubtopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm"
                placeholder={language === 'hi' ? 'उप-विषय (English)...' : 'Subtopic (English)...'}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtopicHi}
                  onChange={(e) => setNewSubtopicHi(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtopic())}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white text-sm"
                  placeholder={language === 'hi' ? 'उप-विषय (हिंदी)...' : 'Subtopic (Hindi)...'}
                />
                <button
                  type="button"
                  onClick={handleAddSubtopic}
                  disabled={!newSubtopic.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {formData.subtopics.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {formData.subtopics.map((subtopic, index) => (
                  <div key={index} className="flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 px-3 py-2 rounded-lg group">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-700 dark:text-secondary-300 block truncate">
                        {typeof subtopic === 'string' ? subtopic : subtopic.name}
                      </span>
                      {typeof subtopic === 'object' && subtopic.nameHi && (
                        <span className="text-xs text-gray-500 dark:text-secondary-400 block truncate">
                          {subtopic.nameHi}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtopic(index)}
                      className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 font-medium transition-colors text-gray-700 dark:text-secondary-300"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {language === 'hi' ? 'सहेजें' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const ManageSyllabus = ({ language: propLanguage = 'en', setLanguage: propSetLanguage }) => {
  const [language, setLanguageLocal] = useState(propLanguage);
  const [selectedPaper, setSelectedPaper] = useState('paper1');
  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded state for tree
  const [expandedUnits, setExpandedUnits] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  // Modal states
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);

  // Form states
  const [editingItem, setEditingItem] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Stats
  const [stats, setStats] = useState({ units: 0, chapters: 0, topics: 0, subtopics: 0 });

  // Sync language from prop
  useEffect(() => {
    setLanguageLocal(propLanguage);
  }, [propLanguage]);

  // Load syllabus
  const loadSyllabus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await syllabusService.getSyllabus(selectedPaper);
      setSyllabus(response.data);
      
      // Calculate stats
      let chapters = 0, topics = 0, subtopics = 0;
      (response.data?.units || []).forEach(unit => {
        chapters += unit.chapters?.length || 0;
        (unit.chapters || []).forEach(chapter => {
          topics += chapter.topics?.length || 0;
          (chapter.topics || []).forEach(topic => {
            subtopics += topic.subtopics?.length || 0;
          });
        });
      });
      setStats({
        units: response.data?.units?.length || 0,
        chapters,
        topics,
        subtopics
      });
    } catch (err) {
      setError(err.message || 'Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  }, [selectedPaper]);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);

  // Initialize syllabus from static data
  const handleInitialize = async () => {
    if (!window.confirm(language === 'hi' 
      ? 'क्या आप स्टैटिक डेटा से पाठ्यक्रम इनिशियलाइज़ करना चाहते हैं?' 
      : 'Do you want to initialize syllabus from static data?'
    )) return;

    setLoading(true);
    try {
      await syllabusService.initializeSyllabus(selectedPaper);
      setSuccess(language === 'hi' ? 'पाठ्यक्रम इनिशियलाइज़ हो गया' : 'Syllabus initialized successfully');
      loadSyllabus();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Initialization failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded state
  const toggleUnit = useCallback((unitId) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  }, []);

  const toggleChapter = useCallback((chapterId) => {
    setExpandedChapters(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
  }, []);

  // Expand/Collapse all
  const expandAll = useCallback(() => {
    const units = {};
    const chapters = {};
    (syllabus?.units || []).forEach(unit => {
      units[unit.id] = true;
      (unit.chapters || []).forEach(chapter => {
        chapters[chapter.id] = true;
      });
    });
    setExpandedUnits(units);
    setExpandedChapters(chapters);
  }, [syllabus]);

  const collapseAll = useCallback(() => {
    setExpandedUnits({});
    setExpandedChapters({});
  }, []);

  // CRUD handlers
  const handleAddUnit = useCallback(() => {
    setEditingItem(null);
    setShowUnitModal(true);
  }, []);

  const handleEditUnit = useCallback((unit) => {
    setEditingItem(unit);
    setShowUnitModal(true);
  }, []);

  const handleDeleteUnit = useCallback(async (unitId) => {
    if (!window.confirm(language === 'hi' 
      ? 'क्या आप इस यूनिट और इसके सभी अध्यायों/विषयों को हटाना चाहते हैं?' 
      : 'Are you sure you want to delete this unit and all its chapters/topics?'
    )) return;
    
    try {
      await syllabusService.deleteUnit(unitId, selectedPaper);
      setSuccess(language === 'hi' ? 'यूनिट हटाई गई' : 'Unit deleted');
      loadSyllabus();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Delete failed');
      setTimeout(() => setError(null), 3000);
    }
  }, [language, selectedPaper, loadSyllabus]);

  const handleAddChapter = useCallback((unit) => {
    setSelectedUnit(unit);
    setEditingItem(null);
    setShowChapterModal(true);
  }, []);

  const handleEditChapter = useCallback((unit, chapter) => {
    setSelectedUnit(unit);
    setEditingItem(chapter);
    setShowChapterModal(true);
  }, []);

  const handleDeleteChapter = useCallback(async (unitId, chapterId) => {
    if (!window.confirm(language === 'hi' 
      ? 'क्या आप इस अध्याय और इसके सभी विषयों को हटाना चाहते हैं?' 
      : 'Are you sure you want to delete this chapter and all its topics?'
    )) return;
    
    try {
      await syllabusService.deleteChapter(chapterId, selectedPaper, unitId);
      setSuccess(language === 'hi' ? 'अध्याय हटाया गया' : 'Chapter deleted');
      loadSyllabus();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Delete failed');
      setTimeout(() => setError(null), 3000);
    }
  }, [language, selectedPaper, loadSyllabus]);

  const handleAddTopic = useCallback((unit, chapter) => {
    setSelectedUnit(unit);
    setSelectedChapter(chapter);
    setEditingItem(null);
    setShowTopicModal(true);
  }, []);

  const handleEditTopic = useCallback((unit, chapter, topic) => {
    setSelectedUnit(unit);
    setSelectedChapter(chapter);
    setEditingItem(topic);
    setShowTopicModal(true);
  }, []);

  const handleDeleteTopic = useCallback(async (unitId, chapterId, topicId) => {
    if (!window.confirm(language === 'hi' 
      ? 'क्या आप इस विषय को हटाना चाहते हैं?' 
      : 'Are you sure you want to delete this topic?'
    )) return;
    
    try {
      await syllabusService.deleteTopic(topicId, selectedPaper, unitId, chapterId);
      setSuccess(language === 'hi' ? 'विषय हटाया गया' : 'Topic deleted');
      loadSyllabus();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Delete failed');
      setTimeout(() => setError(null), 3000);
    }
  }, [language, selectedPaper, loadSyllabus]);

  // Filter syllabus based on search
  const filteredUnits = useMemo(() => {
    if (!syllabus?.units || !searchQuery.trim()) return syllabus?.units || [];
    
    const query = searchQuery.toLowerCase();
    return syllabus.units.filter(unit => {
      if (unit.name?.toLowerCase().includes(query) || unit.nameHi?.includes(searchQuery)) return true;
      return unit.chapters?.some(chapter => {
        if (chapter.name?.toLowerCase().includes(query) || chapter.nameHi?.includes(searchQuery)) return true;
        return chapter.topics?.some(topic => 
          topic.name?.toLowerCase().includes(query) || topic.nameHi?.includes(searchQuery)
        );
      });
    });
  }, [syllabus, searchQuery]);

  // Handle language toggle
  const handleLanguageToggle = useCallback(() => {
    const newLang = language === 'hi' ? 'en' : 'hi';
    setLanguageLocal(newLang);
    if (propSetLanguage) {
      propSetLanguage(newLang);
    }
  }, [language, propSetLanguage]);

  return (
    <Layout language={language} setLanguage={propSetLanguage}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Database className="w-8 h-8 text-primary-600" />
                {language === 'hi' ? 'पाठ्यक्रम प्रबंधन' : 'Syllabus Management'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-secondary-400 mt-1">
                {language === 'hi' ? 'यूनिट, अध्याय और विषय जोड़ें या संपादित करें' : 'Add or edit units, chapters, and topics'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleLanguageToggle}
                className="px-3 py-2 text-sm font-medium border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors text-gray-700 dark:text-secondary-300"
              >
                {language === 'hi' ? 'English' : 'हिंदी'}
              </button>
              <button
                onClick={() => loadSyllabus()}
                disabled={loading}
                className="p-2 text-gray-600 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                title={language === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Paper Selection & Stats */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-200 dark:border-secondary-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Paper Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPaper('paper1')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  selectedPaper === 'paper1'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
                }`}
              >
                {language === 'hi' ? 'पेपर 1 - सामान्य' : 'Paper 1 - General'}
              </button>
              <button
                onClick={() => setSelectedPaper('paper2')}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  selectedPaper === 'paper2'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-secondary-700 text-gray-700 dark:text-secondary-300 hover:bg-gray-200 dark:hover:bg-secondary-600'
                }`}
              >
                {language === 'hi' ? 'पेपर 2 - इतिहास' : 'Paper 2 - History'}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                <Layers className="w-4 h-4" />
                <span className="font-medium">{stats.units}</span>
                <span className="text-gray-500 dark:text-secondary-400">{language === 'hi' ? 'यूनिट' : 'Units'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{stats.chapters}</span>
                <span className="text-gray-500 dark:text-secondary-400">{language === 'hi' ? 'अध्याय' : 'Chapters'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                <Tag className="w-4 h-4" />
                <span className="font-medium">{stats.topics}</span>
                <span className="text-gray-500 dark:text-secondary-400">{language === 'hi' ? 'विषय' : 'Topics'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddUnit}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              {language === 'hi' ? 'नई यूनिट' : 'Add Unit'}
            </button>
            
            {(!syllabus?.units || syllabus.units.length === 0) && (
              <button
                onClick={handleInitialize}
                disabled={loading}
                className="px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-2 font-medium"
              >
                <Upload className="w-4 h-4" />
                {language === 'hi' ? 'स्टैटिक से लोड करें' : 'Load from Static'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-secondary-800 dark:text-white text-sm w-48"
              />
            </div>

            {/* Expand/Collapse */}
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-gray-600 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            >
              {language === 'hi' ? 'सभी खोलें' : 'Expand All'}
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm text-gray-600 dark:text-secondary-400 hover:bg-gray-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            >
              {language === 'hi' ? 'सभी बंद करें' : 'Collapse All'}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="font-medium">{language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</span>
            </div>
          </div>
        )}

        {/* Syllabus Tree */}
        {!loading && filteredUnits && filteredUnits.length > 0 ? (
          <div className="space-y-3">
            {filteredUnits.map((unit) => (
              <div key={unit.id} className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl overflow-hidden shadow-sm">
                {/* Unit Header */}
                <div 
                  className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-4 cursor-pointer"
                  onClick={() => toggleUnit(unit.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button className="p-1 hover:bg-primary-100 dark:hover:bg-primary-800/30 rounded transition-colors">
                        {expandedUnits[unit.id] ? (
                          <ChevronDown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {language === 'hi' && unit.nameHi ? unit.nameHi : unit.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-secondary-400">{unit.id}</span>
                          {unit.part && (
                            <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                              {unit.part}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-secondary-400">
                            {unit.chapters?.length || 0} {language === 'hi' ? 'अध्याय' : 'chapters'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleAddChapter(unit)}
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                        title={language === 'hi' ? 'अध्याय जोड़ें' : 'Add Chapter'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditUnit(unit)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={language === 'hi' ? 'संपादित करें' : 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title={language === 'hi' ? 'हटाएं' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chapters */}
                {expandedUnits[unit.id] && unit.chapters && unit.chapters.length > 0 && (
                  <div className="p-4 space-y-2 bg-gray-50/50 dark:bg-secondary-900/30">
                    {unit.chapters.map((chapter) => (
                      <div key={chapter.id} className="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg overflow-hidden">
                        {/* Chapter Header */}
                        <div 
                          className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-3 cursor-pointer"
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button className="p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded transition-colors">
                                {expandedChapters[chapter.id] ? (
                                  <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                )}
                              </button>
                              <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 dark:text-secondary-200 truncate text-sm">
                                  {language === 'hi' && chapter.nameHi ? chapter.nameHi : chapter.name}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-secondary-400">
                                  {chapter.id} • {chapter.topics?.length || 0} {language === 'hi' ? 'विषय' : 'topics'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleAddTopic(unit, chapter)}
                                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                                title={language === 'hi' ? 'विषय जोड़ें' : 'Add Topic'}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditChapter(unit, chapter)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title={language === 'hi' ? 'संपादित करें' : 'Edit'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(unit.id, chapter.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title={language === 'hi' ? 'हटाएं' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Topics */}
                        {expandedChapters[chapter.id] && chapter.topics && chapter.topics.length > 0 && (
                          <div className="p-3 space-y-1.5 bg-gray-50/50 dark:bg-secondary-900/20">
                            {chapter.topics.map((topic) => (
                              <div 
                                key={topic.id} 
                                className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-2.5 rounded-lg group hover:shadow-sm transition-all"
                              >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                  <div className="w-6 h-6 bg-violet-100 dark:bg-violet-900/40 rounded-md flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm text-gray-700 dark:text-secondary-300 block truncate">
                                      {language === 'hi' && topic.nameHi ? topic.nameHi : topic.name}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-500 dark:text-secondary-400">{topic.id}</span>
                                      {topic.subtopics && topic.subtopics.length > 0 && (
                                        <span className="text-xs px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
                                          {topic.subtopics.length} {language === 'hi' ? 'उप-विषय' : 'subtopics'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditTopic(unit, chapter, topic)}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title={language === 'hi' ? 'संपादित करें' : 'Edit'}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTopic(unit.id, chapter.id, topic.id)}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title={language === 'hi' ? 'हटाएं' : 'Delete'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-20 bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700">
            <Database className="w-16 h-16 text-gray-300 dark:text-secondary-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery 
                ? (language === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No results found')
                : (language === 'hi' ? 'कोई यूनिट नहीं मिली' : 'No units found')
              }
            </h3>
            <p className="text-gray-500 dark:text-secondary-400 mb-6">
              {searchQuery 
                ? (language === 'hi' ? 'कृपया अलग शब्दों से खोजें' : 'Try searching with different terms')
                : (language === 'hi' ? 'नई यूनिट जोड़कर शुरू करें या स्टैटिक डेटा लोड करें' : 'Start by adding a new unit or load from static data')
              }
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleAddUnit}
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  {language === 'hi' ? 'नई यूनिट जोड़ें' : 'Add New Unit'}
                </button>
                <button
                  onClick={handleInitialize}
                  className="px-5 py-2.5 border border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center gap-2 font-medium"
                >
                  <Upload className="w-4 h-4" />
                  {language === 'hi' ? 'स्टैटिक से लोड करें' : 'Load from Static'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showUnitModal && (
          <UnitModal
            paper={selectedPaper}
            editingItem={editingItem}
            language={language}
            onClose={() => setShowUnitModal(false)}
            onSuccess={() => {
              loadSyllabus();
              setShowUnitModal(false);
              setSuccess(editingItem 
                ? (language === 'hi' ? 'यूनिट अपडेट हो गई' : 'Unit updated') 
                : (language === 'hi' ? 'यूनिट जोड़ी गई' : 'Unit added')
              );
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        )}

        {showChapterModal && selectedUnit && (
          <ChapterModal
            paper={selectedPaper}
            unit={selectedUnit}
            editingItem={editingItem}
            language={language}
            onClose={() => setShowChapterModal(false)}
            onSuccess={() => {
              loadSyllabus();
              setShowChapterModal(false);
              setSuccess(editingItem 
                ? (language === 'hi' ? 'अध्याय अपडेट हो गया' : 'Chapter updated') 
                : (language === 'hi' ? 'अध्याय जोड़ा गया' : 'Chapter added')
              );
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        )}

        {showTopicModal && selectedUnit && selectedChapter && (
          <TopicModal
            paper={selectedPaper}
            unit={selectedUnit}
            chapter={selectedChapter}
            editingItem={editingItem}
            language={language}
            onClose={() => setShowTopicModal(false)}
            onSuccess={() => {
              loadSyllabus();
              setShowTopicModal(false);
              setSuccess(editingItem 
                ? (language === 'hi' ? 'विषय अपडेट हो गया' : 'Topic updated') 
                : (language === 'hi' ? 'विषय जोड़ा गया' : 'Topic added')
              );
              setTimeout(() => setSuccess(null), 3000);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default ManageSyllabus;