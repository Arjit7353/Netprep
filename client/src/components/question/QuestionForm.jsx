// client/src/components/question/QuestionForm.jsx
// ════════════════════════════════════════════════════════
// ENHANCED v3.0 — BULLETPROOF TRANSLATION
// Core fix: Detects ACTUAL language of text content,
// not which field it's stored in
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

const HINDI_RE = /[\u0900-\u097F]/;

const QuestionForm = ({
  isOpen, onClose, onSubmit, initialData = null,
  syllabus, loading = false, language: defaultLanguage = 'hi'
}) => {
  const { success, error: showError, info: showInfo } = useToast();
  const [language, setLanguage] = useState(defaultLanguage);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('content');
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
      correctAnswer: 0, explanation: { hi: '', en: '' },
      assertionReasonData: { assertion: { hi: '', en: '' }, reason: { hi: '', en: '' } },
      matchData: { listA: { hi: ['','','',''], en: ['','','',''] }, listB: { hi: ['','','',''], en: ['','','',''] }, correctMatch: [0,1,2,3] },
      sequenceData: { items: { hi: ['','','',''], en: ['','','',''] }, correctOrder: [0,1,2,3] },
      statementData: { statements: { hi: ['','',''], en: ['','',''] }, correctStatements: [] },
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
      if (initialData?._id) loadImpact(initialData._id);
    }
  }, [isOpen, initialData]);

  const loadImpact = async (id) => {
    setImpactLoading(true);
    try {
      const res = await questionService.getImpactAnalysis(id);
      if (res.success) setImpactData(res.data);
    } catch (e) {}
    finally { setImpactLoading(false); }
  };

  // ═══════════════════════════════════════════════════════════
  // ★★★ BULLETPROOF TRANSLATION ENGINE ★★★
  // These functions detect ACTUAL language of content,
  // regardless of which field (hi/en) it's stored in.
  // After translation, content is placed in the CORRECT field.
  // ═══════════════════════════════════════════════════════════

  /**
   * Smart translate for any bilingual array (options, statements, listA, etc.)
   * Detects actual language → translates → puts in correct fields
   */
  const smartTranslateArray = async (bilingualArr, onResult, label = 'items') => {
    setTranslating(true);
    try {
      const hiArr = bilingualArr?.hi || [];
      const enArr = bilingualArr?.en || [];
      const hiNonEmpty = hiArr.filter(s => s?.trim());
      const enNonEmpty = enArr.filter(s => s?.trim());

      if (hiNonEmpty.length === 0 && enNonEmpty.length === 0) {
        showError(language === 'hi' ? `${label} खाली हैं` : `No ${label} to translate`);
        setTranslating(false);
        return;
      }

      // Pick the field that has MORE content as source
      const useHi = hiNonEmpty.length >= enNonEmpty.length;
      const sourceArr = useHi ? hiArr : enArr;
      const sourceNonEmpty = useHi ? hiNonEmpty : enNonEmpty;

      // ★ KEY: Detect ACTUAL language by checking for Hindi characters
      const actuallyHasHindi = sourceNonEmpty.some(t => HINDI_RE.test(t));
      const fromLang = actuallyHasHindi ? 'hi' : 'en';
      const toLang = actuallyHasHindi ? 'en' : 'hi';

      // Collect non-empty texts with index tracking
      const apiTexts = [];
      const apiIndices = [];
      sourceArr.forEach((t, i) => {
        if (t?.trim()) { apiTexts.push(t); apiIndices.push(i); }
      });

      if (apiTexts.length === 0) {
        showError(language === 'hi' ? 'अनुवाद के लिए कुछ नहीं' : 'Nothing to translate');
        setTranslating(false);
        return;
      }

      console.log(`[SmartTranslate] ${label}: ${apiTexts.length} texts, detected ${fromLang}→${toLang}, source in ${useHi ? 'hi' : 'en'} field`);

      const res = await questionService.translateBatch(apiTexts, fromLang, toLang);
      if (res.success && res.data?.translated) {
        const translations = res.data.translated;
        const maxLen = Math.max(hiArr.length, enArr.length,
          apiIndices.length > 0 ? apiIndices[apiIndices.length - 1] + 1 : 0);

        const newHi = new Array(maxLen).fill('');
        const newEn = new Array(maxLen).fill('');

        // Preserve existing values first
        for (let i = 0; i < maxLen; i++) {
          newHi[i] = hiArr[i] || '';
          newEn[i] = enArr[i] || '';
        }

        // ★ Apply translations — put each text in its CORRECT language field
        for (let j = 0; j < apiIndices.length; j++) {
          const idx = apiIndices[j];
          const srcText = apiTexts[j];
          const tgtText = translations[j] || '';

          // Source text goes to its actual language field
          // Translation goes to the target language field
          newHi[idx] = fromLang === 'hi' ? srcText : tgtText;
          newEn[idx] = fromLang === 'en' ? srcText : tgtText;
        }

        onResult({ hi: newHi, en: newEn });
        showInfo(`${apiTexts.length} ${label}: ${fromLang}→${toLang} ✓`);
      }
    } catch (e) {
      showError(`${label} translation failed: ${e.message || ''}`);
    } finally {
      setTranslating(false);
    }
  };

  /**
   * Smart translate for a single bilingual field (question, explanation, etc.)
   * Detects actual language → translates → puts in correct fields
   */
  const smartTranslateField = async (fieldObj, onResult) => {
    setTranslating(true);
    try {
      const hi = (fieldObj?.hi || '').trim();
      const en = (fieldObj?.en || '').trim();

      if (!hi && !en) {
        showError(language === 'hi' ? 'पहले टेक्स्ट लिखें' : 'Enter text first');
        setTranslating(false);
        return;
      }

      // Get whichever text exists
      const sourceText = hi || en;

      // ★ KEY: Detect ACTUAL language
      const actuallyHasHindi = HINDI_RE.test(sourceText);
      const fromLang = actuallyHasHindi ? 'hi' : 'en';
      const toLang = actuallyHasHindi ? 'en' : 'hi';

      const res = await questionService.translateText(sourceText, fromLang, toLang);
      if (res.success && res.data?.translated) {
        // ★ Put in CORRECT fields based on actual language
        onResult({
          [fromLang]: sourceText,
          [toLang]: res.data.translated
        });
        showInfo(`${fromLang}→${toLang} ✓`);
      }
    } catch (e) {
      showError('Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // Translation action functions (use smart helpers above)
  // ═══════════════════════════════════════════════════

  const translateField = (field, subfield = null) => {
    const fieldObj = subfield ? formData[field]?.[subfield] : formData[field];
    return smartTranslateField(fieldObj, (result) => {
      if (subfield) {
        setFormData(prev => ({
          ...prev, [field]: { ...prev[field], [subfield]: result }
        }));
      } else {
        setFormData(prev => ({ ...prev, [field]: result }));
      }
    });
  };

  const translateOptions = () => smartTranslateArray(
    formData.options,
    (result) => setFormData(prev => ({ ...prev, options: result })),
    language === 'hi' ? 'विकल्प' : 'options'
  );

  const translateStatements = () => smartTranslateArray(
    formData.statementData?.statements,
    (result) => setFormData(prev => ({
      ...prev, statementData: { ...prev.statementData, statements: result }
    })),
    language === 'hi' ? 'कथन' : 'statements'
  );

  const translateMatchList = (listKey) => smartTranslateArray(
    formData.matchData?.[listKey],
    (result) => setFormData(prev => ({
      ...prev, matchData: { ...prev.matchData, [listKey]: result }
    })),
    listKey
  );

  const translateSequenceItems = () => smartTranslateArray(
    formData.sequenceData?.items,
    (result) => setFormData(prev => ({
      ...prev, sequenceData: { ...prev.sequenceData, items: result }
    })),
    language === 'hi' ? 'आइटम' : 'items'
  );

  // ★ Translate ALL fields at once — smart per-field detection
  const translateAllFields = async () => {
    setTranslating(true);
    try {
      // Collect ALL texts from ALL fields, detect actual language per text
      const enToHiBatch = []; const enToHiMap = [];
      const hiToEnBatch = []; const hiToEnMap = [];

      // Helper: check bilingual text field
      const checkField = (obj, path) => {
        if (!obj) return;
        const hi = (obj.hi || '').trim();
        const en = (obj.en || '').trim();
        const text = hi || en;
        if (!text) return;

        const isHindi = HINDI_RE.test(text);
        const otherExists = isHindi ? en : hi;
        if (otherExists) return; // Both languages exist, skip

        if (isHindi) {
          hiToEnBatch.push(text);
          hiToEnMap.push({ path, type: 'field' });
        } else {
          enToHiBatch.push(text);
          enToHiMap.push({ path, type: 'field' });
        }
      };

      // Helper: check bilingual array field
      const checkArray = (obj, path) => {
        if (!obj) return;
        const hiArr = obj.hi || [];
        const enArr = obj.en || [];
        const hiNonEmpty = hiArr.filter(s => s?.trim());
        const enNonEmpty = enArr.filter(s => s?.trim());

        if (hiNonEmpty.length === 0 && enNonEmpty.length === 0) return;
        if (hiNonEmpty.length > 0 && enNonEmpty.length > 0) return; // Both exist

        const sourceArr = hiNonEmpty.length > 0 ? hiArr : enArr;
        const sourceNonEmpty = hiNonEmpty.length > 0 ? hiNonEmpty : enNonEmpty;
        const isHindi = sourceNonEmpty.some(t => HINDI_RE.test(t));

        sourceArr.forEach((t, i) => {
          if (!t?.trim()) return;
          if (isHindi) {
            hiToEnBatch.push(t);
            hiToEnMap.push({ path, type: 'array', index: i });
          } else {
            enToHiBatch.push(t);
            enToHiMap.push({ path, type: 'array', index: i });
          }
        });
      };

      checkField(formData.question, 'question');
      checkField(formData.explanation, 'explanation');
      checkArray(formData.options, 'options');

      if (formData.questionType === 'assertion_reason') {
        checkField(formData.assertionReasonData?.assertion, 'assertionReasonData.assertion');
        checkField(formData.assertionReasonData?.reason, 'assertionReasonData.reason');
      }
      if (formData.questionType === 'match_following') {
        checkArray(formData.matchData?.listA, 'matchData.listA');
        checkArray(formData.matchData?.listB, 'matchData.listB');
      }
      if (formData.questionType === 'sequence_order') {
        checkArray(formData.sequenceData?.items, 'sequenceData.items');
      }
      if (formData.questionType === 'statement_based') {
        checkArray(formData.statementData?.statements, 'statementData.statements');
      }

      const total = enToHiBatch.length + hiToEnBatch.length;
      if (total === 0) {
        showError(language === 'hi' ? 'अनुवाद के लिए कुछ नहीं (सभी भाषाएं मौजूद)' : 'Nothing to translate (both languages exist)');
        setTranslating(false);
        return;
      }

      const newData = JSON.parse(JSON.stringify(formData));

      // Helper to set value at dot-notated path
      const setAtPath = (obj, path, lang, value) => {
        const parts = path.split('.');
        let target = obj;
        for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
        const lastKey = parts[parts.length - 1];
        if (!target[lastKey]) target[lastKey] = { hi: '', en: '' };
        target[lastKey][lang] = value;
      };

      const setArrayAtPath = (obj, path, lang, index, value) => {
        const parts = path.split('.');
        let target = obj;
        for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
        const lastKey = parts[parts.length - 1];
        if (!target[lastKey]) target[lastKey] = { hi: [], en: [] };
        if (!target[lastKey][lang]) target[lastKey][lang] = [];
        while (target[lastKey][lang].length <= index) target[lastKey][lang].push('');
        target[lastKey][lang] = [...target[lastKey][lang]];
        target[lastKey][lang][index] = value;
      };

      // Translate en→hi batch
      if (enToHiBatch.length > 0) {
        const res = await questionService.translateBatch(enToHiBatch, 'en', 'hi');
        if (res.success && res.data?.translated) {
          for (let i = 0; i < enToHiMap.length; i++) {
            const m = enToHiMap[i];
            const src = enToHiBatch[i];
            const tgt = res.data.translated[i] || '';
            if (m.type === 'field') {
              setAtPath(newData, m.path, 'en', src);
              setAtPath(newData, m.path, 'hi', tgt);
            } else {
              setArrayAtPath(newData, m.path, 'en', m.index, src);
              setArrayAtPath(newData, m.path, 'hi', m.index, tgt);
            }
          }
        }
      }

      // Translate hi→en batch
      if (hiToEnBatch.length > 0) {
        const res = await questionService.translateBatch(hiToEnBatch, 'hi', 'en');
        if (res.success && res.data?.translated) {
          for (let i = 0; i < hiToEnMap.length; i++) {
            const m = hiToEnMap[i];
            const src = hiToEnBatch[i];
            const tgt = res.data.translated[i] || '';
            if (m.type === 'field') {
              setAtPath(newData, m.path, 'hi', src);
              setAtPath(newData, m.path, 'en', tgt);
            } else {
              setArrayAtPath(newData, m.path, 'hi', m.index, src);
              setArrayAtPath(newData, m.path, 'en', m.index, tgt);
            }
          }
        }
      }

      setFormData(newData);
      success(`${total} fields translated ✓`);
    } catch (e) {
      showError('Translation failed: ' + (e.message || ''));
    } finally {
      setTranslating(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // Standard form handlers (UNCHANGED)
  // ═══════════════════════════════════════════════════

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
      ...prev, paper: syllabusData.paper || prev.paper,
      unit: syllabusData.unit || '', chapter: syllabusData.chapter || '', topic: syllabusData.topic || '', subtopic: syllabusData.subtopic || ''
    }));
  };

  const handleARChange = (field, value) => {
    setFormData(prev => ({
      ...prev, assertionReasonData: { ...prev.assertionReasonData, [field]: { ...prev.assertionReasonData[field], [language]: value } }
    }));
  };

  const handleMatchChange = (list, index, value) => {
    setFormData(prev => ({
      ...prev, matchData: { ...prev.matchData, [list]: { ...prev.matchData[list], [language]: prev.matchData[list][language].map((item, i) => i === index ? value : item) } }
    }));
  };

  const handleSequenceChange = (index, value) => {
    setFormData(prev => ({
      ...prev, sequenceData: { ...prev.sequenceData, items: { ...prev.sequenceData.items, [language]: prev.sequenceData.items[language].map((item, i) => i === index ? value : item) } }
    }));
  };

  const handleStatementChange = (index, value) => {
    setFormData(prev => ({
      ...prev, statementData: { ...prev.statementData, statements: { ...prev.statementData.statements, [language]: prev.statementData.statements[language].map((item, i) => i === index ? value : item) } }
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
      ...prev, statementData: { ...prev.statementData, statements: { hi: [...prev.statementData.statements.hi, ''], en: [...prev.statementData.statements.en, ''] } }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateQuestion(formData);
    if (!validation.isValid) { setErrors({ general: validation.errors[0] }); showError(validation.errors[0]); return; }
    try { await onSubmit({ ...formData, language }); }
    catch (err) { showError(err.message || 'Failed to save'); }
  };

  // ═══════════════════════════════════════════════════
  // UI Components
  // ═══════════════════════════════════════════════════

  const TranslateFieldBtn = ({ onClick, small = false }) => (
    <button type="button" onClick={onClick} disabled={translating}
      className={`${small ? 'p-1' : 'p-1.5'} rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50`}
      title={language === 'hi' ? 'अनुवाद करें' : 'Translate'}>
      {translating ? <Loader2 className={`${small ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-spin`} /> : <Languages className={`${small ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />}
    </button>
  );

  const TranslateArrayBtn = ({ onClick, label }) => (
    <button type="button" onClick={onClick} disabled={translating}
      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors font-medium">
      {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
      {label || (language === 'hi' ? 'अनुवाद' : 'Translate')}
    </button>
  );

  // ═══════════════════════════════════════════════════
  // Question Type Forms
  // ═══════════════════════════════════════════════════

  const renderMCQForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'प्रश्न' : 'Question'} *</label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <textarea value={formData.question[language] || ''} onChange={(e) => handleBilingualChange('question', language, e.target.value)} rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'प्रश्न यहाँ लिखें...' : 'Enter question here...'} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'विकल्प' : 'Options'} *</label>
          <div className="flex items-center gap-2">
            <TranslateArrayBtn onClick={translateOptions} label={language === 'hi' ? 'विकल्प अनुवाद' : 'Translate Options'} />
            <Button variant="ghost" size="xs" icon={Plus} onClick={addOption}>{language === 'hi' ? 'जोड़ें' : 'Add'}</Button>
          </div>
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index} onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder={`${language === 'hi' ? 'विकल्प' : 'Option'} ${String.fromCharCode(65 + index)}`} />
              {formData.options[language].length > 2 && (
                <button type="button" onClick={() => removeOption(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssertionReasonForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'अभिकथन (A)' : 'Assertion (A)'} *</label>
          <TranslateFieldBtn onClick={() => translateField('assertionReasonData', 'assertion')} />
        </div>
        <textarea value={formData.assertionReasonData.assertion[language] || ''} onChange={(e) => handleARChange('assertion', e.target.value)} rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'कारण (R)' : 'Reason (R)'} *</label>
          <TranslateFieldBtn onClick={() => translateField('assertionReasonData', 'reason')} />
        </div>
        <textarea value={formData.assertionReasonData.reason[language] || ''} onChange={(e) => handleARChange('reason', e.target.value)} rows={2}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'उत्तर' : 'Answer'} *</label>
          <TranslateArrayBtn onClick={translateOptions} label={language === 'hi' ? 'विकल्प अनुवाद' : 'Translate'} />
        </div>
        <div className="space-y-2">
          {(language === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN).map((option, index) => (
            <label key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 cursor-pointer">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index} onChange={() => handleChange('correctAnswer', index)} className="mt-1 w-4 h-4 text-primary-600" />
              <span className="text-sm text-gray-700 dark:text-secondary-300">({String.fromCharCode(65 + index)}) {option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMatchFollowingForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'निर्देश' : 'Instruction'}</label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <input type="text" value={formData.question[language] || ''} onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'सूची-I' : 'List-I'}</label>
            <TranslateArrayBtn onClick={() => translateMatchList('listA')} label={language === 'hi' ? 'अनुवाद' : 'Translate'} />
          </div>
          <div className="space-y-2">
            {formData.matchData.listA[language].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 w-6">({String.fromCharCode(65 + index)})</span>
                <input type="text" value={item} onChange={(e) => handleMatchChange('listA', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'सूची-II' : 'List-II'}</label>
            <TranslateArrayBtn onClick={() => translateMatchList('listB')} label={language === 'hi' ? 'अनुवाद' : 'Translate'} />
          </div>
          <div className="space-y-2">
            {formData.matchData.listB[language].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 w-8">({['i','ii','iii','iv','v'][index]})</span>
                <input type="text" value={item} onChange={(e) => handleMatchChange('listB', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'विकल्प' : 'Options'}</label>
          <TranslateArrayBtn onClick={translateOptions} label={language === 'hi' ? 'विकल्प अनुवाद' : 'Translate'} />
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index} onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder="A-i, B-ii, C-iii, D-iv" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSequenceOrderForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'निर्देश' : 'Instruction'}</label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <input type="text" value={formData.question[language] || ''} onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'आइटम' : 'Items'}</label>
          <TranslateArrayBtn onClick={translateSequenceItems} label={language === 'hi' ? 'अनुवाद' : 'Translate'} />
        </div>
        <div className="space-y-2">
          {formData.sequenceData.items[language].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 w-6">{['I','II','III','IV','V'][index]}</span>
              <input type="text" value={item} onChange={(e) => handleSequenceChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'विकल्प' : 'Options'}</label>
          <TranslateArrayBtn onClick={translateOptions} label={language === 'hi' ? 'विकल्प अनुवाद' : 'Translate'} />
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index} onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStatementBasedForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'निर्देश' : 'Instruction'}</label>
          <TranslateFieldBtn onClick={() => translateField('question')} />
        </div>
        <input type="text" value={formData.question[language] || ''} onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:'} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'कथन (सही कथनों पर टिक करें)' : 'Statements (Check correct ones)'}</label>
          <TranslateArrayBtn onClick={translateStatements} label={language === 'hi' ? 'कथन अनुवाद' : 'Translate Statements'} />
        </div>
        <div className="space-y-2">
          {formData.statementData.statements[language].map((statement, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="checkbox" checked={formData.statementData.correctStatements.includes(index)} onChange={() => toggleCorrectStatement(index)}
                className="w-4 h-4 text-green-600 rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-500 w-4">{index + 1}.</span>
              <input type="text" value={statement} onChange={(e) => handleStatementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
            </div>
          ))}
        </div>
        <Button variant="ghost" size="xs" icon={Plus} onClick={addStatement} className="mt-2">{language === 'hi' ? 'कथन जोड़ें' : 'Add Statement'}</Button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'विकल्प' : 'Options'}</label>
          <TranslateArrayBtn onClick={translateOptions} label={language === 'hi' ? 'विकल्प अनुवाद' : 'Translate Options'} />
        </div>
        <div className="space-y-2">
          {formData.options[language]?.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input type="radio" name="correctAnswer" checked={formData.correctAnswer === index} onChange={() => handleChange('correctAnswer', index)} className="w-4 h-4 text-primary-600" />
              <span className="w-8 text-sm font-medium text-gray-500">({String.fromCharCode(65 + index)})</span>
              <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                placeholder={language === 'hi' ? 'केवल 1 और 2' : 'Only 1 and 2'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderQuestionContent = () => {
    switch (formData.questionType) {
      case 'assertion_reason': return renderAssertionReasonForm();
      case 'match_following': return renderMatchFollowingForm();
      case 'sequence_order': return renderSequenceOrderForm();
      case 'statement_based': return renderStatementBasedForm();
      default: return renderMCQForm();
    }
  };

  // ═══════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={initialData ? 'Edit Question' : 'Add New Question'}
      titleHi={initialData ? 'प्रश्न संपादित करें' : 'नया प्रश्न जोड़ें'}
      size="xl"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={loading || translating}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</Button>
        <Button variant="primary" icon={Save} onClick={handleSubmit} loading={loading} disabled={translating}>
          {initialData ? (language === 'hi' ? 'अपडेट करें' : 'Update') : (language === 'hi' ? 'सहेजें' : 'Save')}
        </Button>
      </>}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" /><span className="text-sm">{errors.general}</span>
          </div>
        )}

        {initialData && impactData && impactData.testsAffected > 0 && (
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">
                {language === 'hi' ? `⚡ ${impactData.testsAffected} टेस्ट में उपयोग — बदलाव ऑटो-सिंक होंगे` : `⚡ Used in ${impactData.testsAffected} test(s) — changes auto-sync`}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <LanguageToggle language={language} onChange={setLanguage} size="sm" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={translateAllFields} disabled={translating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md transition-all disabled:opacity-50">
              {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {language === 'hi' ? 'सभी अनुवाद करें' : 'Translate All'}
            </button>
          </div>
        </div>

        {translating && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-xs text-blue-700 font-medium">{language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...'}</span>
          </div>
        )}

        <div className="flex border-b border-gray-200 dark:border-secondary-700">
          {[
            { id: 'content', label: language === 'hi' ? 'प्रश्न सामग्री' : 'Question Content' },
            { id: 'metadata', label: language === 'hi' ? 'मेटाडेटा' : 'Metadata' }
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'content' && (
          <div className="space-y-6">
            <Dropdown label={language === 'hi' ? 'प्रश्न प्रकार' : 'Question Type'} value={formData.questionType}
              options={questionTypeOptions} onChange={(v) => handleChange('questionType', v)} language={language} required />
            {renderQuestionContent()}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'व्याख्या' : 'Explanation'}</label>
                <TranslateFieldBtn onClick={() => translateField('explanation')} />
              </div>
              <textarea value={formData.explanation[language] || ''} onChange={(e) => handleBilingualChange('explanation', language, e.target.value)} rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-6">
            <SyllabusDropdown value={{ paper: formData.paper, unit: formData.unit, chapter: formData.chapter, topic: formData.topic, subtopic: formData.subtopic }}
              onChange={handleSyllabusChange} language={language} required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Dropdown label={language === 'hi' ? 'कठिनाई' : 'Difficulty'} value={formData.difficulty} options={difficultyOptions}
                onChange={(v) => handleChange('difficulty', v)} language={language} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'स्रोत' : 'Source'}</label>
                <input type="text" value={formData.source || ''} onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'वर्ष' : 'Year'}</label>
                <input type="text" value={formData.year || ''} onChange={(e) => handleChange('year', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'टैग' : 'Tags'}</label>
              <input type="text" value={(formData.tags || []).join(', ')}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500" />
            </div>
            <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isPYQ} onChange={(e) => handleChange('isPYQ', e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600" />
                <span className="text-sm font-bold text-amber-700">{language === 'hi' ? 'PYQ' : 'PYQ'}</span>
              </label>
              {formData.isPYQ && (
                <div className="flex gap-2">
                  <input type="text" value={formData.pyqSession || ''} onChange={(e) => handleChange('pyqSession', e.target.value)}
                    className="px-2 py-1 text-xs border border-amber-300 rounded-lg bg-white dark:bg-secondary-900 w-24" placeholder="Session" />
                  <input type="text" value={formData.pyqShift || ''} onChange={(e) => handleChange('pyqShift', e.target.value)}
                    className="px-2 py-1 text-xs border border-amber-300 rounded-lg bg-white dark:bg-secondary-900 w-24" placeholder="Shift" />
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