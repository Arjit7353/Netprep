import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  FileJson, 
  HelpCircle, 
  BookOpen, 
  Plus, 
  X,
  Check,
  Edit,
  Database,
  Calendar,
  Clock,
  History,
  Tag,
  Layers
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import JSONImport from '../components/question/JSONImport';
import QuestionForm from '../components/question/QuestionForm';
import Button from '../components/common/Button';
import SyllabusDropdown from '../components/syllabus/SyllabusDropdown';
import { useQuestions } from '../hooks/useQuestions';
import { useToast } from '../components/common/Toast';
import syllabusPaper1 from '../data/syllabusPaper1';
import syllabusPaper2History from '../data/syllabusPaper2History';

// PYQ Years data
const PYQ_YEARS = [];
for (let year = 2024; year >= 2012; year--) {
  PYQ_YEARS.push(year.toString());
}

// PYQ Sessions
const PYQ_SESSIONS = [
  { value: 'june', label: 'June', labelHi: 'जून' },
  { value: 'december', label: 'December', labelHi: 'दिसंबर' },
  { value: 'november', label: 'November', labelHi: 'नवंबर' },
  { value: 'september', label: 'September', labelHi: 'सितंबर' }
];

// Shifts
const PYQ_SHIFTS = [
  { value: 'shift1', label: 'Shift 1 (Morning)', labelHi: 'शिफ्ट 1 (सुबह)' },
  { value: 'shift2', label: 'Shift 2 (Evening)', labelHi: 'शिफ्ट 2 (शाम)' }
];

const ImportQuestions = () => {
  const { success, error: showError } = useToast();
  const { importQuestions, validateImport, createQuestion, loading } = useQuestions();
  
  // Main State
  const [importMode, setImportMode] = useState('json'); // json, manual, bulk, pyq
  const [importResult, setImportResult] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Syllabus State
  const [syllabusSelection, setSyllabusSelection] = useState({
    paper: '',
    unit: '',
    chapter: '',
    topic: ''
  });

  // PYQ State
  const [pyqData, setPyqData] = useState({
    year: '',
    session: '',
    shift: '',
    questionNumber: '',
    isMemoryBased: false
  });

  // Multi-select State for topics
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Get combined syllabus
  const getSyllabus = () => ({
    paper1: syllabusPaper1,
    paper2: syllabusPaper2History
  });

  // Handle syllabus change
  const handleSyllabusChange = useCallback((data) => {
    setSyllabusSelection(data);
  }, []);

  // Add topic to multi-select
  const addSelectedTopic = () => {
    if (syllabusSelection.topic && !selectedTopics.find(t => t.topic === syllabusSelection.topic)) {
      setSelectedTopics([
        ...selectedTopics,
        { ...syllabusSelection }
      ]);
    }
  };

  // Remove topic from multi-select
  const removeSelectedTopic = (index) => {
    setSelectedTopics(selectedTopics.filter((_, i) => i !== index));
  };

  // Generate PYQ source string
  const generatePYQSource = () => {
    const parts = ['PYQ'];
    if (pyqData.year) parts.push(pyqData.year);
    if (pyqData.session) parts.push(pyqData.session.charAt(0).toUpperCase() + pyqData.session.slice(1));
    if (pyqData.shift) parts.push(pyqData.shift === 'shift1' ? 'S1' : 'S2');
    if (pyqData.isMemoryBased) parts.push('(Memory)');
    return parts.join('-');
  };

  // Handle JSON import
  const handleJSONImport = async (jsonData) => {
    try {
      const enrichedData = {
        ...jsonData,
        defaultMeta: {
          ...jsonData.defaultMeta,
          paper: syllabusSelection.paper || jsonData.defaultMeta?.paper,
          unit: syllabusSelection.unit || jsonData.defaultMeta?.unit,
          chapter: syllabusSelection.chapter || jsonData.defaultMeta?.chapter,
          topic: syllabusSelection.topic || jsonData.defaultMeta?.topic,
          // PYQ data
          ...(importMode === 'pyq' && {
            source: generatePYQSource(),
            year: pyqData.year,
            isPYQ: true,
            pyqSession: pyqData.session,
            pyqShift: pyqData.shift,
            isMemoryBased: pyqData.isMemoryBased
          })
        }
      };

      const result = await importQuestions(enrichedData);
      setImportResult(result);
      success(`Successfully imported ${result.data?.questions || 0} questions!`);
      return result;
    } catch (err) {
      showError(err.message || 'Import failed');
      throw err;
    }
  };

  // Handle manual question creation
  const handleManualCreate = async (questionData) => {
    try {
      const enrichedQuestion = {
        ...questionData,
        paper: syllabusSelection.paper || questionData.paper,
        unit: syllabusSelection.unit || questionData.unit,
        chapter: syllabusSelection.chapter || questionData.chapter,
        topic: syllabusSelection.topic || questionData.topic,
        // PYQ data
        ...(importMode === 'pyq' && {
          source: generatePYQSource(),
          year: pyqData.year,
          isPYQ: true,
          pyqSession: pyqData.session,
          pyqShift: pyqData.shift,
          isMemoryBased: pyqData.isMemoryBased
        })
      };

      await createQuestion(enrichedQuestion);
      success('Question created successfully!');
      setShowQuestionForm(false);
    } catch (err) {
      showError(err.message || 'Failed to create question');
      throw err;
    }
  };

  // Handle bulk text import
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      showError('Please enter questions in bulk format');
      return;
    }

    if (!syllabusSelection.paper) {
      showError('Please select a paper first');
      return;
    }

    try {
      const lines = bulkText.split('\n').filter(line => line.trim());
      const questions = [];
      let currentQuestion = null;

      for (const line of lines) {
        if (line.match(/^Q\d+[\.:]/i) || line.match(/^\d+[\.:]/)) {
          if (currentQuestion && currentQuestion.options.hi.length >= 2) {
            questions.push(currentQuestion);
          }
          currentQuestion = {
            question: { hi: line.replace(/^Q?\d+[\.:]\s*/i, ''), en: '' },
            options: { hi: [], en: [] },
            correctAnswer: 0,
            questionType: 'mcq',
            paper: syllabusSelection.paper,
            unit: syllabusSelection.unit,
            chapter: syllabusSelection.chapter,
            topic: syllabusSelection.topic,
            difficulty: 'medium',
            ...(importMode === 'pyq' && {
              source: generatePYQSource(),
              year: pyqData.year,
              isPYQ: true,
              pyqSession: pyqData.session,
              pyqShift: pyqData.shift,
              isMemoryBased: pyqData.isMemoryBased
            })
          };
        } else if (line.match(/^[A-Da-d][\)\.]/)) {
          if (currentQuestion) {
            const optionText = line.replace(/^[A-Da-d][\)\.]\s*/, '');
            const isCorrect = optionText.includes('*') || optionText.includes('✓') || optionText.includes('(correct)');
            const cleanOption = optionText.replace(/[\*✓]|\(correct\)/gi, '').trim();
            
            if (isCorrect) {
              currentQuestion.correctAnswer = currentQuestion.options.hi.length;
            }
            currentQuestion.options.hi.push(cleanOption);
          }
        } else if (line.match(/^(Ans|Answer|उत्तर)[\.:]/i)) {
          if (currentQuestion) {
            const ansMatch = line.match(/[A-Da-d]/);
            if (ansMatch) {
              const ansIndex = ansMatch[0].toUpperCase().charCodeAt(0) - 65;
              currentQuestion.correctAnswer = ansIndex;
            }
          }
        } else if (line.match(/^(Exp|Explanation|व्याख्या)[\.:]/i)) {
          if (currentQuestion) {
            currentQuestion.explanation = {
              hi: line.replace(/^(Exp|Explanation|व्याख्या)[\.:]\s*/i, ''),
              en: ''
            };
          }
        }
      }
      
      if (currentQuestion && currentQuestion.options.hi.length >= 2) {
        questions.push(currentQuestion);
      }

      if (questions.length === 0) {
        showError('No valid questions found in the text');
        return;
      }

      const result = await importQuestions({
        importMode: 'bulk',
        defaultMeta: {
          language: 'hi',
          paper: syllabusSelection.paper,
          unit: syllabusSelection.unit,
          chapter: syllabusSelection.chapter,
          topic: syllabusSelection.topic
        },
        questions
      });

      setImportResult(result);
      success(`Imported ${questions.length} questions from bulk text`);
      setBulkText('');
    } catch (err) {
      showError('Failed to parse bulk text: ' + err.message);
    }
  };

  return (
    <Layout>
      {({ language }) => (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}
              </h1>
              <p className="text-gray-500 mt-1">
                {language === 'hi' 
                  ? 'JSON, मैन्युअल, बल्क या PYQ मोड से प्रश्न जोड़ें'
                  : 'Add questions via JSON, Manual, Bulk or PYQ mode'
                }
              </p>
            </div>
          </div>

          {/* Import Mode Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'hi' ? 'आयात विधि चुनें' : 'Select Import Method'}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { mode: 'json', icon: FileJson, label: 'JSON Import', labelHi: 'JSON आयात', desc: 'From JSON file', descHi: 'JSON फ़ाइल से' },
                { mode: 'manual', icon: Edit, label: 'Manual Entry', labelHi: 'मैन्युअल', desc: 'Add one by one', descHi: 'एक-एक करके जोड़ें' },
                { mode: 'bulk', icon: Database, label: 'Bulk Upload', labelHi: 'बल्क अपलोड', desc: 'From plain text', descHi: 'टेक्स्ट से' },
                { mode: 'pyq', icon: History, label: 'PYQ Import', labelHi: 'PYQ आयात', desc: 'Previous Year Qs', descHi: 'पिछले वर्ष के प्रश्न' }
              ].map(({ mode, icon: Icon, label, labelHi, desc, descHi }) => (
                <button
                  key={mode}
                  onClick={() => setImportMode(mode)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    importMode === mode
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${importMode === mode ? 'text-primary-600' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-sm">{language === 'hi' ? labelHi : label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{language === 'hi' ? descHi : desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* PYQ Section - Only shown when PYQ mode is selected */}
          {importMode === 'pyq' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {language === 'hi' ? 'PYQ विवरण' : 'PYQ Details'}
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'वर्ष' : 'Year'} *
                  </label>
                  <select
                    value={pyqData.year}
                    onChange={(e) => setPyqData({ ...pyqData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{language === 'hi' ? 'वर्ष चुनें' : 'Select Year'}</option>
                    {PYQ_YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Session */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'सत्र' : 'Session'} *
                  </label>
                  <select
                    value={pyqData.session}
                    onChange={(e) => setPyqData({ ...pyqData, session: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{language === 'hi' ? 'सत्र चुनें' : 'Select Session'}</option>
                    {PYQ_SESSIONS.map(session => (
                      <option key={session.value} value={session.value}>
                        {language === 'hi' ? session.labelHi : session.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shift */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'शिफ्ट' : 'Shift'}
                  </label>
                  <select
                    value={pyqData.shift}
                    onChange={(e) => setPyqData({ ...pyqData, shift: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{language === 'hi' ? 'शिफ्ट चुनें' : 'Select Shift'}</option>
                    {PYQ_SHIFTS.map(shift => (
                      <option key={shift.value} value={shift.value}>
                        {language === 'hi' ? shift.labelHi : shift.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'hi' ? 'प्रश्न संख्या' : 'Question No.'}
                  </label>
                  <input
                    type="text"
                    value={pyqData.questionNumber}
                    onChange={(e) => setPyqData({ ...pyqData, questionNumber: e.target.value })}
                    placeholder="e.g., 1-50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Memory Based Toggle */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="memoryBased"
                  checked={pyqData.isMemoryBased}
                  onChange={(e) => setPyqData({ ...pyqData, isMemoryBased: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="memoryBased" className="text-sm text-gray-700">
                  {language === 'hi' ? 'मेमोरी बेस्ड प्रश्न (अनौपचारिक)' : 'Memory Based Questions (Unofficial)'}
                </label>
              </div>

              {/* Generated Source Tag */}
              {(pyqData.year || pyqData.session) && (
                <div className="mt-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-gray-600">
                    {language === 'hi' ? 'स्रोत टैग:' : 'Source Tag:'}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    {generatePYQSource()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Syllabus Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {language === 'hi' ? 'सिलेबस चुनें' : 'Select Syllabus'}
            </h2>
            
            <SyllabusDropdown
              value={syllabusSelection}
              onChange={handleSyllabusChange}
              language={language}
              required
            />

            {/* Multi-select Topics */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={addSelectedTopic}
                  disabled={!syllabusSelection.topic}
                >
                  {language === 'hi' ? 'विषय जोड़ें' : 'Add Topic'}
                </Button>
                <span className="text-xs text-gray-500">
                  {language === 'hi' 
                    ? '(एक से अधिक विषय चुनने के लिए)'
                    : '(to select multiple topics)'
                  }
                </span>
              </div>
              
              {selectedTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTopics.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      <Layers className="w-3 h-3" />
                      {item.topic}
                      <button
                        onClick={() => removeSelectedTopic(index)}
                        className="hover:bg-primary-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Import Content Based on Mode */}
          {(importMode === 'json' || importMode === 'pyq') && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">
                      {importMode === 'pyq' 
                        ? (language === 'hi' ? 'PYQ आयात निर्देश' : 'PYQ Import Instructions')
                        : (language === 'hi' ? 'JSON आयात निर्देश' : 'JSON Import Instructions')
                      }
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {importMode === 'pyq' ? (
                        <>
                          <li>• {language === 'hi' ? 'ऊपर PYQ विवरण भरें (वर्ष, सत्र)' : 'Fill PYQ details above (Year, Session)'}</li>
                          <li>• {language === 'hi' ? 'सिलेबस से विषय चुनें' : 'Select topic from syllabus'}</li>
                          <li>• {language === 'hi' ? 'JSON में प्रश्न पेस्ट करें' : 'Paste questions in JSON'}</li>
                          <li>• {language === 'hi' ? 'PYQ टैग स्वतः जुड़ जाएगा' : 'PYQ tag will be auto-added'}</li>
                        </>
                      ) : (
                        <>
                          <li>• {language === 'hi' ? 'पहले पेपर और सिलेबस चुनें' : 'First select Paper and Syllabus'}</li>
                          <li>• {language === 'hi' ? 'JSON टेम्पलेट चुनें या अपना पेस्ट करें' : 'Select JSON template or paste your own'}</li>
                          <li>• {language === 'hi' ? 'अनुवाद स्वतः होगा' : 'Translation will be automatic'}</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <JSONImport
                onImport={handleJSONImport}
                onValidate={validateImport}
                language={language}
                loading={loading}
              />
            </>
          )}

          {importMode === 'manual' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center py-8">
                <Edit className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {language === 'hi' ? 'मैन्युअल प्रश्न जोड़ें' : 'Add Question Manually'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {syllabusSelection.paper 
                    ? (language === 'hi' 
                      ? 'फॉर्म के माध्यम से एक प्रश्न जोड़ें'
                      : 'Add a question through the form')
                    : (language === 'hi'
                      ? 'कृपया पहले पेपर और सिलेबस चुनें'
                      : 'Please select paper and syllabus first')
                  }
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => setShowQuestionForm(true)}
                  disabled={!syllabusSelection.paper}
                >
                  {language === 'hi' ? 'नया प्रश्न जोड़ें' : 'Add New Question'}
                </Button>
              </div>
            </div>
          )}

          {importMode === 'bulk' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {language === 'hi' ? 'बल्क टेक्स्ट आयात' : 'Bulk Text Import'}
              </h3>
              
              <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {language === 'hi' ? 'समर्थित प्रारूप:' : 'Supported Format:'}
                </p>
                <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
{`Q1. प्रश्न का टेक्स्ट यहाँ लिखें
A) विकल्प 1
B) विकल्प 2
C) विकल्प 3 *
D) विकल्प 4
Ans: C
Exp: व्याख्या यहाँ लिखें

Q2. दूसरा प्रश्न
A) Option A
B) Option B (correct)
C) Option C
D) Option D`}
                </pre>
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'hi' 
                    ? '* या (correct) से सही उत्तर चिह्नित करें। Ans: X या Exp: से उत्तर और व्याख्या जोड़ें।'
                    : 'Mark correct answer with * or (correct). Add answer with Ans: X and explanation with Exp:'
                  }
                </p>
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder={language === 'hi' 
                  ? 'अपने प्रश्न यहाँ पेस्ट करें...'
                  : 'Paste your questions here...'
                }
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  {bulkText.split(/Q\d+[\.:]/i).filter(q => q.trim()).length} {language === 'hi' ? 'प्रश्न पाए गए' : 'questions detected'}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setBulkText('')}
                    disabled={!bulkText.trim()}
                  >
                    {language === 'hi' ? 'साफ़ करें' : 'Clear'}
                  </Button>
                  <Button
                    variant="primary"
                    icon={Upload}
                    onClick={handleBulkImport}
                    loading={loading}
                    disabled={!bulkText.trim() || !syllabusSelection.paper}
                  >
                    {language === 'hi' ? 'आयात करें' : 'Import'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                <Check className="w-5 h-5" />
                {language === 'hi' ? 'आयात सफल!' : 'Import Successful!'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                    {importResult.data?.questions || 0}
                  </p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'प्रश्न' : 'Questions'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-600">
                    {importResult.data?.passages || 0}
                  </p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'गद्यांश' : 'Passages'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-purple-600">
                    {importResult.data?.diData || 0}
                  </p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'DI सेट' : 'DI Sets'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold text-red-600">
                    {importResult.data?.errors || 0}
                  </p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'त्रुटियां' : 'Errors'}
                  </p>
                </div>
              </div>
              
              {importMode === 'pyq' && pyqData.year && (
                <div className="mt-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {language === 'hi' ? 'PYQ टैग:' : 'PYQ Tag:'} 
                    <span className="font-medium ml-1">{generatePYQSource()}</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Question Form Modal */}
          <QuestionForm
            isOpen={showQuestionForm}
            onClose={() => setShowQuestionForm(false)}
            onSubmit={handleManualCreate}
            syllabus={getSyllabus()}
            initialData={{
              paper: syllabusSelection.paper,
              unit: syllabusSelection.unit,
              chapter: syllabusSelection.chapter,
              topic: syllabusSelection.topic,
              ...(importMode === 'pyq' && {
                source: generatePYQSource(),
                year: pyqData.year
              })
            }}
            loading={loading}
            language={language}
          />
        </div>
      )}
    </Layout>
  );
};

export default ImportQuestions;