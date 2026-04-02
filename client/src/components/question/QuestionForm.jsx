// client/src/components/question/QuestionForm.jsx
// ════════════════════════════════════════════════════════
// ENHANCED v2.0 — WITH AUTO-TRANSLATE
// — Per-field translate buttons, Translate All, Impact Analysis
// — Auto-translate toggle, Bulk batch translation
// ════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  Save, X, Plus, Trash2, AlertCircle,
  Languages, RefreshCw, Zap, Info, Loader2
} from 'lucide-react';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import LanguageToggle from '../common/LanguageToggle';
import SyllabusDropdown from '../syllabus/SyllabusDropdown';
import {
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  AR_OPTIONS_HI,
  AR_OPTIONS_EN
} from '../../utils/constants';
import { validateQuestion } from '../../utils/validators';
import { useToast } from '../common/Toast';
import questionService from '../../services/questionService';

const QuestionForm = ({
  isOpen, onClose, onSubmit, initialData = null,
  syllabus, loading = false, language: defaultLanguage = 'hi'
}) => {
  const { success, error: showError, info: showInfo } = useToast();
  const [language, setLanguage] = useState(defaultLanguage);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('content');

  // ★ Translation states
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [impactData, setImpactData] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);

  const getInitialFormData = () => {
    if (initialData) {
      return {
        questionType: initialData.questionType || 'mcq',
        paper: initialData.paper || '',
        unit: initialData.unit || '',
        chapter: initialData.chapter || '',
        topic: initialData.topic || '',
        subtopic: initialData.subtopic || '',
        difficulty: initialData.difficulty || 'medium',
        source: initialData.source || '',
        year: initialData.year || '',
        question: initialData.question || { hi: '', en: '' },
        options: initialData.options || { hi: ['', '', '', ''], en: ['', '', '', ''] },
        correctAnswer: initialData.correctAnswer ?? 0,
        explanation: initialData.explanation || { hi: '', en: '' },
        assertionReasonData: initialData.assertionReasonData || {
          assertion: { hi: '', en: '' }, reason: { hi: '', en: '' }
        },
        matchData: initialData.matchData || {
          listA: { hi: ['', '', '', ''], en: ['', '', '', ''] },
          listB: { hi: ['', '', '', ''], en: ['', '', '', ''] },
          correctMatch: [0, 1, 2, 3]
        },
        sequenceData: initialData.sequenceData || {
          items: { hi: ['', '', '', ''], en: ['', '', '', ''] },
          correctOrder: [0, 1, 2, 3]
        },
        statementData: initialData.statementData || {
          statements: { hi: ['', '', ''], en: ['', '', ''] },
          correctStatements: []
        },
        tags: initialData.tags || [],
        isPYQ: initialData.isPYQ || false,
        pyqSession: initialData.pyqSession || '',
        pyqShift: initialData.pyqShift || '',
        isMemoryBased: initialData.isMemoryBased || false
      };
    }

    return {
      questionType: 'mcq', paper: '', unit: '', chapter: '', topic: '', subtopic: '',
      difficulty: 'medium', source: '', year: '',
      question: { hi: '', en: '' },
      options: { hi: ['', '', '', ''], en: ['', '', '', ''] },
      correctAnswer: 0,
      explanation: { hi: '', en: '' },
      assertionReasonData: { assertion: { hi: '', en: '' }, reason: { hi: '', en: '' } },
      matchData: {
        listA: { hi: ['', '', '', ''], en: ['', '', '', ''] },
        listB: { hi: ['', '', '', ''], en: ['', '', '', ''] },
        correctMatch: [0, 1, 2, 3]
      },
      sequenceData: {
        items: { hi: ['', '', '', ''], en: ['', '', '', ''] },
        correctOrder: [0, 1, 2, 3]
      },
      statementData: {
        statements: { hi: ['', '', ''], en: ['', '', ''] },
        correctStatements: []
      },
      tags: [], isPYQ: false, pyqSession: '', pyqShift: '', isMemoryBased: false
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
      setActiveTab('content');
      setImpactData(null);
      // ★ Load impact analysis for existing questions
      if (initialData?._id) loadImpact(initialData._id);
    }
  }, [isOpen, initialData]);

  // ★ Load impact analysis
  const loadImpact = async (id) => {
    setImpactLoading(true);
    try {
      const res = await questionService.getImpactAnalysis(id);
      if (res.success) setImpactData(res.data);
    } catch (e) { console.warn('Impact load failed:', e); }
    finally { setImpactLoading(false); }
  };

  // ★ Translate single field
  const translateField = async (field, subfield = null) => {
    setTranslating(true);
    try {
      const srcLang = language;
      const tgtLang = language === 'hi' ? 'en' : 'hi';

      let textToTranslate = '';
      if (subfield) {
        textToTranslate = formData[field]?.[subfield]?.[srcLang] || '';
      } else {
        textToTranslate = formData[field]?.[srcLang] || '';
      }

      if (!textToTranslate.trim()) {
        showError(language === 'hi' ? 'पहले टेक्स्ट लिखें' : 'Enter text first');
        return;
      }

      const res = await questionService.translateText(textToTranslate, srcLang, tgtLang);
      if (res.success && res.data?.translated) {
        if (subfield) {
          setFormData(prev => ({
            ...prev,
            [field]: {
              ...prev[field],
              [subfield]: { ...prev[field][subfield], [tgtLang]: res.data.translated }
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [field]: { ...prev[field], [tgtLang]: res.data.translated }
          }));
        }
        showInfo(`${srcLang === 'hi' ? 'हिंदी→English' : 'English→हिंदी'} ✓`);
      }
    } catch (e) {
      showError('Translation failed: ' + (e.message || ''));
    } finally {
      setTranslating(false);
    }
  };

  // ★ Translate all options
  const translateOptions = async () => {
    setTranslating(true);
    try {
      const srcLang = language;
      const tgtLang = language === 'hi' ? 'en' : 'hi';
      const texts = formData.options[srcLang].filter(o => o?.trim());

      if (texts.length === 0) { showError('No options to translate'); return; }

      const res = await questionService.translateBatch(texts, srcLang, tgtLang);
      if (res.success && res.data?.translated) {
        setFormData(prev => ({
          ...prev,
          options: { ...prev.options, [tgtLang]: res.data.translated }
        }));
        showInfo(`${texts.length} options translated ✓`);
      }
    } catch (e) {
      showError('Options translation failed');
    } finally {
      setTranslating(false);
    }
  };

  // ★ Translate ALL fields at once
  const translateAllFields = async () => {
    setTranslating(true);
    try {
      const srcLang = language;
      const tgtLang = language === 'hi' ? 'en' : 'hi';
      const textsToTranslate = [];
      const fieldMap = [];

      // Collect all texts
      if (formData.question[srcLang]?.trim()) {
        textsToTranslate.push(formData.question[srcLang]);
        fieldMap.push({ field: 'question', type: 'bilingual' });
      }
      if (formData.explanation[srcLang]?.trim()) {
        textsToTranslate.push(formData.explanation[srcLang]);
        fieldMap.push({ field: 'explanation', type: 'bilingual' });
      }
      (formData.options[srcLang] || []).forEach((opt, i) => {
        if (opt?.trim()) {
          textsToTranslate.push(opt);
          fieldMap.push({ field: 'options', type: 'array', index: i });
        }
      });

      // Type-specific fields
      if (formData.questionType === 'assertion_reason') {
        if (formData.assertionReasonData.assertion[srcLang]?.trim()) {
          textsToTranslate.push(formData.assertionReasonData.assertion[srcLang]);
          fieldMap.push({ field: 'assertionReasonData', subfield: 'assertion', type: 'nested' });
        }
        if (formData.assertionReasonData.reason[srcLang]?.trim()) {
          textsToTranslate.push(formData.assertionReasonData.reason[srcLang]);
          fieldMap.push({ field: 'assertionReasonData', subfield: 'reason', type: 'nested' });
        }
      }

      if (formData.questionType === 'match_following') {
        (formData.matchData.listA[srcLang] || []).forEach((item, i) => {
          if (item?.trim()) {
            textsToTranslate.push(item);
            fieldMap.push({ field: 'matchData', subfield: 'listA', type: 'nestedArray', index: i });
          }
        });
        (formData.matchData.listB[srcLang] || []).forEach((item, i) => {
          if (item?.trim()) {
            textsToTranslate.push(item);
            fieldMap.push({ field: 'matchData', subfield: 'listB', type: 'nestedArray', index: i });
          }
        });
      }

      if (formData.questionType === 'sequence_order') {
        (formData.sequenceData.items[srcLang] || []).forEach((item, i) => {
          if (item?.trim()) {
            textsToTranslate.push(item);
            fieldMap.push({ field: 'sequenceData', subfield: 'items', type: 'nestedArray', index: i });
          }
        });
      }

      if (formData.questionType === 'statement_based') {
        (formData.statementData.statements[srcLang] || []).forEach((item, i) => {
          if (item?.trim()) {
            textsToTranslate.push(item);
            fieldMap.push({ field: 'statementData', subfield: 'statements', type: 'nestedArray', index: i });
          }
        });
      }

      if (textsToTranslate.length === 0) {
        showError(language === 'hi' ? 'अनुवाद करने के लिए कोई टेक्स्ट नहीं' : 'No text to translate');
        return;
      }

      const res = await questionService.translateBatch(textsToTranslate, srcLang, tgtLang);
      if (res.success && res.data?.translated) {
        const translations = res.data.translated;
        let ti = 0;
        const newFormData = JSON.parse(JSON.stringify(formData)); // deep clone

        for (const fm of fieldMap) {
          const translated = translations[ti++] || '';

          if (fm.type === 'bilingual') {
            newFormData[fm.field][tgtLang] = translated;
          } else if (fm.type === 'array') {
            if (!newFormData.options[tgtLang]) {
              newFormData.options[tgtLang] = [...(newFormData.options[srcLang] || [])];
            }
            newFormData.options[tgtLang][fm.index] = translated;
          } else if (fm.type === 'nested') {
            newFormData[fm.field][fm.subfield][tgtLang] = translated;
          } else if (fm.type === 'nestedArray') {
            if (!newFormData[fm.field][fm.subfield][tgtLang]) {
              newFormData[fm.field][fm.subfield][tgtLang] = [...(newFormData[fm.field][fm.subfield][srcLang] || [])];
            }
            newFormData[fm.field][fm.subfield][tgtLang][fm.index] = translated;
          }
        }

        setFormData(newFormData);
        success(`${textsToTranslate.length} fields translated (${srcLang}→${tgtLang}) ✓`);
      }
    } catch (e) {
      showError('Bulk translation failed: ' + (e.message || ''));
    } finally {
      setTranslating(false);
    }
  };

  const questionTypeOptions = Object.entries(QUESTION_TYPE_LABELS)
    .filter(([value]) => !value.startsWith('di_') && value !== 'passage_based')
    .map(([value, labels]) => ({ value, label: labels.en, labelHi: labels.hi }));

  const difficultyOptions = Object.entries(DIFFICULTY_LABELS).map(([value, labels]) => ({
    value, label: labels.en, labelHi: labels.hi
  }));

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleBilingualChange = (field, lang, value) => {
    setFormData(prev => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: { ...prev.options, [language]: prev.options[language].map((opt, i) => i === index ? value : opt) }
    }));
  };

  const addOption = () => {
    setFormData(prev => ({ ...prev, options: { hi: [...prev.options.hi, ''], en: [...prev.options.en, ''] } }));
  };

  const removeOption = (index) => {
    if (formData.options[language].length <= 2) return;
    setFormData(prev => ({
      ...prev,
      options: { hi: prev.options.hi.filter((_, i) => i !== index), en: prev.options.en.filter((_, i) => i !== index) },
      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
    }));
  };

  const handleSyllabusChange = (syllabusData) => {
    setFormData(prev => ({
      ...prev,
      paper: syllabusData.paper || prev.paper,
      unit: syllabusData.unit || '',
      chapter: syllabusData.chapter || '',
      topic: syllabusData.topic || ''
    }));
  };

  const handleARChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      assertionReasonData: { ...prev.assertionReasonData, [field]: { ...prev.assertionReasonData[field], [language]: value } }
    }));
  };

  const handleMatchChange = (list, index, value) => {
    setFormData(prev => ({
      ...prev,
      matchData: {
        ...prev.matchData,
        [list]: {
          ...prev.matchData[list],
          [language]: prev.matchData[list][language].map((item, i) => i === index ? value : item)
        }
      }
    }));
  };

  const handleSequenceChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      sequenceData: {
        ...prev.sequenceData,
        items: {
          ...prev.sequenceData.items,
          [language]: prev.sequenceData.items[language].map((item, i) => i === index ? value : item)
        }
      }
    }));
  };

  const handleStatementChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      statementData: {
        ...prev.statementData,
        statements: {
          ...prev.statementData.statements,
          [language]: prev.statementData.statements[language].map((item, i) => i === index ? value : item)
        }
      }
    }));
  };

  const toggleCorrectStatement = (index) => {
    setFormData(prev => {
      const current = prev.statementData.correctStatements;
      const newCorrect = current.includes(index) ? current.filter(i => i !== index) : [...current, index].sort((a, b) => a - b);
      return { ...prev, statementData: { ...prev.statementData, correctStatements: newCorrect } };
    });
  };

  const addStatement = () => {
    setFormData(prev => ({
      ...prev,
      statementData: {
        ...prev.statementData,
        statements: { hi: [...prev.statementData.statements.hi, ''], en: [...prev.statementData.statements.en, ''] }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateQuestion(formData);
    if (!validation.isValid) {
      setErrors({ general: validation.errors[0] });
      showError(validation.errors[0]);
      return;
    }

    try {
      // ★ Add language flag for auto-translate on server
      const submitData = { ...formData, language };
      await onSubmit(submitData);
    } catch (err) {
      showError(err.message || 'Failed to save question');
    }
  };

  // ★ Inline translate button component
  const TranslateFieldBtn = ({ onClick, small = false }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={translating}
      className={`${small ? 'p-1' : 'p-1.5'} rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50`}
      title={language === 'hi' ? 'अनुवाद करें' : 'Translate'}
    >
      {translating
        ? <Loader2 className={`${small ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} />
        : <Languages className={`${small ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      }
    </button>
  );

  // ═══ MCQ Form ═══
  const renderMCQForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'प्रश्न' : 'Question'} *
          </label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <textarea
          value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
          placeholder={language === 'hi' ? 'प्रश्न यहाँ लिखें...' : 'Enter question here...'}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'विकल्प' : 'Options'} *
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={translateOptions} disabled={translating}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors">
              {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
              {language === 'hi' ? 'सभी अनुवाद' : 'Translate All'}
            </button>
            <Button variant="ghost" size="xs" icon={Plus} onClick={addOption}>
              {language === 'hi' ? 'विकल्प जोड़ें' : 'Add Option'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500 dark:text-secondary-400">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                placeholder={`${language === 'hi' ? 'विकल्प' : 'Option'} ${String.fromCharCode(65 + index)}`} />
              {formData.options[language].length > 2 && (
                <button type="button" onClick={() => removeOption(index)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-secondary-500">
          {language === 'hi' ? 'सही उत्तर चुनने के लिए रेडियो बटन पर क्लिक करें' : 'Click radio button to select correct answer'}
        </p>
      </div>
    </div>
  );

  // ═══ Assertion-Reason Form ═══
  const renderAssertionReasonForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'अभिकथन (A)' : 'Assertion (A)'} *
          </label>
          <TranslateFieldBtn onClick={() => translateField('assertionReasonData', 'assertion')} />
        </div>
        <textarea value={formData.assertionReasonData.assertion[language] || ''}
          onChange={(e) => handleARChange('assertion', e.target.value)} rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
          placeholder={language === 'hi' ? 'अभिकथन यहाँ लिखें...' : 'Enter assertion here...'} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'कारण (R)' : 'Reason (R)'} *
          </label>
          <TranslateFieldBtn onClick={() => translateField('assertionReasonData', 'reason')} />
        </div>
        <textarea value={formData.assertionReasonData.reason[language] || ''}
          onChange={(e) => handleARChange('reason', e.target.value)} rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
          placeholder={language === 'hi' ? 'कारण यहाँ लिखें...' : 'Enter reason here...'} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2 block">
          {language === 'hi' ? 'सही उत्तर चुनें' : 'Select Correct Answer'} *
        </label>
        <div className="space-y-2">
          {(language === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN).map((option, index) => (
            <label key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer transition-colors">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)} className="mt-1 w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-secondary-300">({String.fromCharCode(65 + index)}) {option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══ Match Following Form ═══
  const renderMatchFollowingForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'निर्देश' : 'Instruction'}
          </label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <input type="text" value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
          placeholder={language === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:'} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">
            {language === 'hi' ? 'सूची-I' : 'List-I'}
          </label>
          <div className="space-y-2">
            {formData.matchData.listA[language].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-secondary-400 w-6">({String.fromCharCode(65 + index)})</span>
                <input type="text" value={item}
                  onChange={(e) => handleMatchChange('listA', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">
            {language === 'hi' ? 'सूची-II' : 'List-II'}
          </label>
          <div className="space-y-2">
            {formData.matchData.listB[language].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-secondary-400 w-8">({['i', 'ii', 'iii', 'iv', 'v'][index]})</span>
                <input type="text" value={item}
                  onChange={(e) => handleMatchChange('listB', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'विकल्प' : 'Options'}
          </label>
          <button type="button" onClick={translateOptions} disabled={translating}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors">
            {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {language === 'hi' ? 'अनुवाद' : 'Translate'}
          </button>
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500 dark:text-secondary-400">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                placeholder="A-i, B-ii, C-iii, D-iv" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══ Sequence Order Form ═══
  const renderSequenceOrderForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'निर्देश' : 'Instruction'}
          </label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <input type="text" value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
          placeholder={language === 'hi' ? 'निम्नलिखित को कालक्रमानुसार व्यवस्थित कीजिए:' : 'Arrange in chronological order:'} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">
          {language === 'hi' ? 'आइटम' : 'Items'}
        </label>
        <div className="space-y-2">
          {formData.sequenceData.items[language].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-secondary-400 w-6">{['I', 'II', 'III', 'IV', 'V'][index]}</span>
              <input type="text" value={item}
                onChange={(e) => handleSequenceChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'विकल्प' : 'Options'}
          </label>
          <button type="button" onClick={translateOptions} disabled={translating}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors">
            {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {language === 'hi' ? 'अनुवाद' : 'Translate'}
          </button>
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500 dark:text-secondary-400">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══ Statement Based Form ═══
  const renderStatementBasedForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'निर्देश' : 'Instruction'}
          </label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <input type="text" value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
          placeholder={language === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:'} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">
          {language === 'hi' ? 'कथन (सही कथनों पर टिक करें)' : 'Statements (Check correct ones)'}
        </label>
        <div className="space-y-2">
          {formData.statementData.statements[language].map((statement, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="checkbox"
                checked={formData.statementData.correctStatements.includes(index)}
                onChange={() => toggleCorrectStatement(index)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 dark:border-secondary-600" />
              <span className="text-sm font-medium text-gray-500 dark:text-secondary-400 w-4">{index + 1}.</span>
              <input type="text" value={statement}
                onChange={(e) => handleStatementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400" />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="xs" icon={Plus} onClick={addStatement} className="mt-2">
          {language === 'hi' ? 'कथन जोड़ें' : 'Add Statement'}
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
            {language === 'hi' ? 'विकल्प' : 'Options'}
          </label>
          <button type="button" onClick={translateOptions} disabled={translating}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors">
            {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {language === 'hi' ? 'अनुवाद' : 'Translate'}
          </button>
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500 dark:text-secondary-400">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                placeholder={language === 'hi' ? 'केवल 1 और 2' : 'Only 1 and 2'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render content based on question type
  const renderQuestionContent = () => {
    switch (formData.questionType) {
      case 'assertion_reason': return renderAssertionReasonForm();
      case 'match_following': return renderMatchFollowingForm();
      case 'sequence_order': return renderSequenceOrderForm();
      case 'statement_based': return renderStatementBasedForm();
      default: return renderMCQForm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={initialData ? 'Edit Question' : 'Add New Question'}
      titleHi={initialData ? 'प्रश्न संपादित करें' : 'नया प्रश्न जोड़ें'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading || translating}>
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </Button>
          <Button variant="primary" icon={Save} onClick={handleSubmit} loading={loading} disabled={translating}>
            {initialData ? (language === 'hi' ? 'अपडेट करें' : 'Update') : (language === 'hi' ? 'सहेजें' : 'Save')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{errors.general}</span>
          </div>
        )}

        {/* ★ Impact Analysis Banner */}
        {initialData && impactData && impactData.testsAffected > 0 && (
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                {language === 'hi'
                  ? `⚡ यह प्रश्न ${impactData.testsAffected} टेस्ट में उपयोग हो रहा है — बदलाव स्वचालित रूप से सभी टेस्ट में अपडेट होंगे`
                  : `⚡ This question is used in ${impactData.testsAffected} test(s) — changes will auto-sync to all tests`
                }
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {impactData.tests?.slice(0, 3).map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-200 rounded-full font-semibold">
                    {t.title?.substring(0, 25)}
                  </span>
                ))}
                {impactData.testsAffected > 3 && (
                  <span className="text-[10px] px-2 py-0.5 bg-violet-200 dark:bg-violet-700 text-violet-800 dark:text-violet-100 rounded-full font-bold">
                    +{impactData.testsAffected - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Language Toggle + Auto-translate controls */}
        <div className="flex items-center justify-between">
          <LanguageToggle language={language} onChange={setLanguage} size="sm" />
          <div className="flex items-center gap-3">
            {/* ★ Translate All button */}
            <button type="button" onClick={translateAllFields} disabled={translating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {language === 'hi' ? 'सभी अनुवाद करें' : 'Translate All'}
            </button>

            {/* Auto-translate toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 border-gray-300 dark:border-secondary-600 focus:ring-primary-500" />
              <span className="text-xs text-gray-500 dark:text-secondary-400 font-medium">
                {language === 'hi' ? 'ऑटो अनुवाद' : 'Auto Translate'}
              </span>
            </label>
          </div>
        </div>

        {/* Translating indicator */}
        {translating && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              {language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...'}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-secondary-700">
          {[
            { id: 'content', label: language === 'hi' ? 'प्रश्न सामग्री' : 'Question Content' },
            { id: 'metadata', label: language === 'hi' ? 'मेटाडेटा' : 'Metadata' }
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-secondary-400 hover:text-gray-700 dark:hover:text-secondary-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <Dropdown label={language === 'hi' ? 'प्रश्न प्रकार' : 'Question Type'}
              value={formData.questionType} options={questionTypeOptions}
              onChange={(value) => handleChange('questionType', value)} language={language} required />
            {renderQuestionContent()}

            {/* Explanation with translate button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">
                  {language === 'hi' ? 'व्याख्या' : 'Explanation'}
                </label>
                <TranslateFieldBtn onClick={() => translateField('explanation')} />
              </div>
              <textarea value={formData.explanation[language] || ''}
                onChange={(e) => handleBilingualChange('explanation', language, e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                placeholder={language === 'hi' ? 'व्याख्या यहाँ लिखें...' : 'Enter explanation here...'} />
            </div>
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="space-y-6">
            <SyllabusDropdown
              value={{ paper: formData.paper, unit: formData.unit, chapter: formData.chapter, topic: formData.topic }}
              onChange={handleSyllabusChange} language={language} required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Dropdown label={language === 'hi' ? 'कठिनाई स्तर' : 'Difficulty'}
                value={formData.difficulty} options={difficultyOptions}
                onChange={(value) => handleChange('difficulty', value)} language={language} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                  {language === 'hi' ? 'स्रोत' : 'Source'}
                </label>
                <input type="text" value={formData.source || ''}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                  placeholder="PYQ-2023" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                  {language === 'hi' ? 'वर्ष' : 'Year'}
                </label>
                <input type="text" value={formData.year || ''}
                  onChange={(e) => handleChange('year', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                  placeholder="2023" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">
                {language === 'hi' ? 'टैग (कॉमा से अलग करें)' : 'Tags (comma separated)'}
              </label>
              <input type="text" value={(formData.tags || []).join(', ')}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400"
                placeholder={language === 'hi' ? 'टैग1, टैग2, टैग3' : 'tag1, tag2, tag3'} />
            </div>

            {/* PYQ Toggle */}
            <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isPYQ}
                  onChange={(e) => handleChange('isPYQ', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 border-gray-300 dark:border-secondary-600" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {language === 'hi' ? 'PYQ (पिछले वर्ष का प्रश्न)' : 'PYQ (Previous Year Question)'}
                </span>
              </label>
              {formData.isPYQ && (
                <div className="flex items-center gap-2">
                  <input type="text" value={formData.pyqSession || ''}
                    onChange={(e) => handleChange('pyqSession', e.target.value)}
                    className="px-2 py-1 text-xs border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white w-24"
                    placeholder={language === 'hi' ? 'सत्र' : 'Session'} />
                  <input type="text" value={formData.pyqShift || ''}
                    onChange={(e) => handleChange('pyqShift', e.target.value)}
                    className="px-2 py-1 text-xs border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white w-24"
                    placeholder={language === 'hi' ? 'शिफ्ट' : 'Shift'} />
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default QuestionForm;