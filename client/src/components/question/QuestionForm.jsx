import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle
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

const QuestionForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  syllabus,
  loading = false,
  language: defaultLanguage = 'hi'
}) => {
  const { success, error: showError } = useToast();
  const [language, setLanguage] = useState(defaultLanguage);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('content');

  // Initialize form data with proper defaults
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
          assertion: { hi: '', en: '' },
          reason: { hi: '', en: '' }
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
        // PYQ fields
        isPYQ: initialData.isPYQ || false,
        pyqSession: initialData.pyqSession || '',
        pyqShift: initialData.pyqShift || '',
        isMemoryBased: initialData.isMemoryBased || false
      };
    }
    
    return {
      questionType: 'mcq',
      paper: '',
      unit: '',
      chapter: '',
      topic: '',
      subtopic: '',
      difficulty: 'medium',
      source: '',
      year: '',
      question: { hi: '', en: '' },
      options: { hi: ['', '', '', ''], en: ['', '', '', ''] },
      correctAnswer: 0,
      explanation: { hi: '', en: '' },
      assertionReasonData: {
        assertion: { hi: '', en: '' },
        reason: { hi: '', en: '' }
      },
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
      tags: [],
      isPYQ: false,
      pyqSession: '',
      pyqShift: '',
      isMemoryBased: false
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      setErrors({});
      setActiveTab('content');
    }
  }, [isOpen, initialData]);

  // Question type options
  const questionTypeOptions = Object.entries(QUESTION_TYPE_LABELS)
    .filter(([value]) => !value.startsWith('di_') && value !== 'passage_based')
    .map(([value, labels]) => ({
      value,
      label: labels.en,
      labelHi: labels.hi
    }));

  // Difficulty options
  const difficultyOptions = Object.entries(DIFFICULTY_LABELS).map(([value, labels]) => ({
    value,
    label: labels.en,
    labelHi: labels.hi
  }));

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle bilingual input
  const handleBilingualChange = (field, lang, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: { 
        ...prev[field], 
        [lang]: value 
      }
    }));
  };

  // Handle options change
  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [language]: prev.options[language].map((opt, i) => i === index ? value : opt)
      }
    }));
  };

  // Add option
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: {
        hi: [...prev.options.hi, ''],
        en: [...prev.options.en, '']
      }
    }));
  };

  // Remove option
  const removeOption = (index) => {
    if (formData.options[language].length <= 2) return;
    setFormData(prev => ({
      ...prev,
      options: {
        hi: prev.options.hi.filter((_, i) => i !== index),
        en: prev.options.en.filter((_, i) => i !== index)
      },
      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
    }));
  };

  // Handle syllabus change
  const handleSyllabusChange = (syllabusData) => {
    setFormData(prev => ({
      ...prev,
      paper: syllabusData.paper || prev.paper,
      unit: syllabusData.unit || '',
      chapter: syllabusData.chapter || '',
      topic: syllabusData.topic || ''
    }));
  };

  // Handle assertion-reason data change
  const handleARChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      assertionReasonData: {
        ...prev.assertionReasonData,
        [field]: { ...prev.assertionReasonData[field], [language]: value }
      }
    }));
  };

  // Handle match data change
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

  // Handle sequence data change
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

  // Handle statement data change
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

  // Toggle correct statement
  const toggleCorrectStatement = (index) => {
    setFormData(prev => {
      const current = prev.statementData.correctStatements;
      const newCorrect = current.includes(index)
        ? current.filter(i => i !== index)
        : [...current, index].sort((a, b) => a - b);
      return {
        ...prev,
        statementData: {
          ...prev.statementData,
          correctStatements: newCorrect
        }
      };
    });
  };

  // Add statement
  const addStatement = () => {
    setFormData(prev => ({
      ...prev,
      statementData: {
        ...prev.statementData,
        statements: {
          hi: [...prev.statementData.statements.hi, ''],
          en: [...prev.statementData.statements.en, '']
        }
      }
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const validation = validateQuestion(formData);
    if (!validation.isValid) {
      const errorObj = { general: validation.errors[0] };
      setErrors(errorObj);
      showError(validation.errors[0]);
      return;
    }

    try {
      await onSubmit(formData);
      success(initialData ? 'Question updated successfully!' : 'Question created successfully!');
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save question');
    }
  };

  // MCQ Form
  const renderMCQForm = () => (
    <div className="space-y-4">
      {/* Question Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'प्रश्न' : 'Question'} *
        </label>
        <textarea
          value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder={language === 'hi' ? 'प्रश्न यहाँ लिखें...' : 'Enter question here...'}
        />
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            {language === 'hi' ? 'विकल्प' : 'Options'} *
          </label>
          <Button
            variant="ghost"
            size="xs"
            icon={Plus}
            onClick={addOption}
          >
            {language === 'hi' ? 'विकल्प जोड़ें' : 'Add Option'}
          </Button>
        </div>
        <div className="space-y-2">
          {formData.options[language] && formData.options[language].map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="w-8 text-sm font-medium text-gray-500">
                ({String.fromCharCode(65 + index)})
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder={`${language === 'hi' ? 'विकल्प' : 'Option'} ${String.fromCharCode(65 + index)}`}
              />
              {formData.options[language].length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {language === 'hi' ? 'सही उत्तर चुनने के लिए रेडियो बटन पर क्लिक करें' : 'Click radio button to select correct answer'}
        </p>
      </div>
    </div>
  );

  // Assertion-Reason Form
  const renderAssertionReasonForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'अभिकथन (A)' : 'Assertion (A)'} *
        </label>
        <textarea
          value={formData.assertionReasonData.assertion[language] || ''}
          onChange={(e) => handleARChange('assertion', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'अभिकथन यहाँ लिखें...' : 'Enter assertion here...'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'कारण (R)' : 'Reason (R)'} *
        </label>
        <textarea
          value={formData.assertionReasonData.reason[language] || ''}
          onChange={(e) => handleARChange('reason', e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'कारण यहाँ लिखें...' : 'Enter reason here...'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'hi' ? 'सही उत्तर चुनें' : 'Select Correct Answer'} *
        </label>
        <div className="space-y-2">
          {(language === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN).map((option, index) => (
            <label key={index} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)}
                className="mt-1 w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700">
                ({String.fromCharCode(65 + index)}) {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Match Following Form
  const renderMatchFollowingForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'निर्देश' : 'Instruction'}
        </label>
        <input
          type="text"
          value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'hi' ? 'सूची-I' : 'List-I'}
          </label>
          <div className="space-y-2">
            {formData.matchData.listA[language].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 w-6">
                  ({String.fromCharCode(65 + index)})
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleMatchChange('listA', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'hi' ? 'सूची-II' : 'List-II'}
          </label>
          <div className="space-y-2">
            {formData.matchData.listB[language].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 w-8">
                  ({['i', 'ii', 'iii', 'iv', 'v'][index]})
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleMatchChange('listB', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'hi' ? 'विकल्प' : 'Options'}
        </label>
        <div className="space-y-2">
          {formData.options[language] && formData.options[language].map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="w-8 text-sm font-medium text-gray-500">
                ({String.fromCharCode(65 + index)})
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder="A-i, B-ii, C-iii, D-iv"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Sequence Order Form
  const renderSequenceOrderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'निर्देश' : 'Instruction'}
        </label>
        <input
          type="text"
          value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'निम्नलिखित को कालक्रमानुसार व्यवस्थित कीजिए:' : 'Arrange in chronological order:'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'hi' ? 'आइटम' : 'Items'}
        </label>
        <div className="space-y-2">
          {formData.sequenceData.items[language].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 w-6">
                {['I', 'II', 'III', 'IV', 'V'][index]}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => handleSequenceChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'hi' ? 'विकल्प' : 'Options'}
        </label>
        <div className="space-y-2">
          {formData.options[language] && formData.options[language].map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="w-8 text-sm font-medium text-gray-500">
                ({String.fromCharCode(65 + index)})
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Statement Based Form
  const renderStatementBasedForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'hi' ? 'निर्देश' : 'Instruction'}
        </label>
        <input
          type="text"
          value={formData.question[language] || ''}
          onChange={(e) => handleBilingualChange('question', language, e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
          placeholder={language === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'hi' ? 'कथन (सही कथनों पर टिक करें)' : 'Statements (Check correct ones)'}
        </label>
        <div className="space-y-2">
          {formData.statementData.statements[language].map((statement, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.statementData.correctStatements.includes(index)}
                onChange={() => toggleCorrectStatement(index)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm font-medium text-gray-500 w-4">
                {index + 1}.
              </span>
              <input
                type="text"
                value={statement}
                onChange={(e) => handleStatementChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="xs"
          icon={Plus}
          onClick={addStatement}
          className="mt-2"
        >
          {language === 'hi' ? 'कथन जोड़ें' : 'Add Statement'}
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'hi' ? 'विकल्प' : 'Options'}
        </label>
        <div className="space-y-2">
          {formData.options[language] && formData.options[language].map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={formData.correctAnswer === index}
                onChange={() => handleChange('correctAnswer', index)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="w-8 text-sm font-medium text-gray-500">
                ({String.fromCharCode(65 + index)})
              </span>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder={language === 'hi' ? 'केवल 1 और 2' : 'Only 1 and 2'}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render content based on question type
  const renderQuestionContent = () => {
    switch (formData.questionType) {
      case 'assertion_reason':
        return renderAssertionReasonForm();
      case 'match_following':
        return renderMatchFollowingForm();
      case 'sequence_order':
        return renderSequenceOrderForm();
      case 'statement_based':
        return renderStatementBasedForm();
      default:
        return renderMCQForm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Question' : 'Add New Question'}
      titleHi={initialData ? 'प्रश्न संपादित करें' : 'नया प्रश्न जोड़ें'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </Button>
          <Button 
            variant="primary" 
            icon={Save}
            onClick={handleSubmit}
            loading={loading}
          >
            {initialData 
              ? (language === 'hi' ? 'अपडेट करें' : 'Update')
              : (language === 'hi' ? 'सहेजें' : 'Save')
            }
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{errors.general}</span>
          </div>
        )}

        {/* Language Toggle */}
        <div className="flex items-center justify-between">
          <LanguageToggle
            language={language}
            onChange={setLanguage}
            size="sm"
          />
          <p className="text-xs text-gray-500">
            {language === 'hi' 
              ? 'दूसरी भाषा में अनुवाद स्वचालित होगा'
              : 'Translation to other language will be automatic'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {language === 'hi' ? 'प्रश्न सामग्री' : 'Question Content'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'metadata'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {language === 'hi' ? 'मेटाडेटा' : 'Metadata'}
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Question Type */}
            <Dropdown
              label={language === 'hi' ? 'प्रश्न प्रकार' : 'Question Type'}
              value={formData.questionType}
              options={questionTypeOptions}
              onChange={(value) => handleChange('questionType', value)}
              language={language}
              required
            />

            {/* Question Content */}
            {renderQuestionContent()}

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'व्याख्या' : 'Explanation'}
              </label>
              <textarea
                value={formData.explanation[language] || ''}
                onChange={(e) => handleBilingualChange('explanation', language, e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder={language === 'hi' ? 'व्याख्या यहाँ लिखें...' : 'Enter explanation here...'}
              />
            </div>
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="space-y-6">
            {/* Syllabus Selection */}
            <SyllabusDropdown
              value={{
                paper: formData.paper,
                unit: formData.unit,
                chapter: formData.chapter,
                topic: formData.topic
              }}
              onChange={handleSyllabusChange}
              language={language}
              required
            />

            {/* Difficulty & Source */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Dropdown
                label={language === 'hi' ? 'कठिनाई स्तर' : 'Difficulty'}
                value={formData.difficulty}
                options={difficultyOptions}
                onChange={(value) => handleChange('difficulty', value)}
                language={language}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'hi' ? 'स्रोत' : 'Source'}
                </label>
                <input
                  type="text"
                  value={formData.source || ''}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="PYQ-2023"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'hi' ? 'वर्ष' : 'Year'}
                </label>
                <input
                  type="text"
                  value={formData.year || ''}
                  onChange={(e) => handleChange('year', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="2023"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'टैग (कॉमा से अलग करें)' : 'Tags (comma separated)'}
              </label>
              <input
                type="text"
                value={(formData.tags || []).join(', ')}
                onChange={(e) => handleChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                placeholder={language === 'hi' ? 'टैग1, टैग2, टैग3' : 'tag1, tag2, tag3'}
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default QuestionForm;