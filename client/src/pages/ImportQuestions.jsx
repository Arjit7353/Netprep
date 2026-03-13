import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload, FileJson, HelpCircle, BookOpen, Plus, X, Check, Edit,
  Database, Calendar, History, Tag, Layers, ToggleLeft, ToggleRight,
  Sparkles, BarChart3, Clock, CheckCircle, AlertTriangle, FileText, Zap
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

// ── Constants ──
const PYQ_YEARS = Array.from({ length: 13 }, (_, i) => (2024 - i).toString());
const PYQ_SESSIONS = [
  { value: 'june', label: 'June', labelHi: 'जून' },
  { value: 'december', label: 'December', labelHi: 'दिसंबर' },
  { value: 'november', label: 'November', labelHi: 'नवंबर' },
  { value: 'september', label: 'September', labelHi: 'सितंबर' },
];
const PYQ_SHIFTS = [
  { value: 'shift1', label: 'Shift 1 (Morning)', labelHi: 'शिफ्ट 1 (सुबह)' },
  { value: 'shift2', label: 'Shift 2 (Evening)', labelHi: 'शिफ्ट 2 (शाम)' },
];

const IMPORT_MODES = [
  { mode: 'json',   icon: FileJson, label: 'JSON Import',   labelHi: 'JSON आयात',    desc: 'Structured JSON',  descHi: 'JSON फ़ाइल से' },
  { mode: 'manual', icon: Edit,     label: 'Manual Entry',  labelHi: 'मैन्युअल',     desc: 'One by one',       descHi: 'एक-एक करके' },
  { mode: 'bulk',   icon: Database, label: 'Bulk Text',     labelHi: 'बल्क टेक्स्ट', desc: 'Plain text paste', descHi: 'टेक्स्ट से' },
  { mode: 'pyq',    icon: History,  label: 'PYQ Import',    labelHi: 'PYQ आयात',     desc: 'Previous Year',    descHi: 'पिछले वर्ष' },
];

const ImportQuestions = () => {
  const { success, error: showError } = useToast();
  const { importQuestions, validateImport, createQuestion, loading } = useQuestions();

  const [importMode, setImportMode] = useState('json');
  const [importResult, setImportResult] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [useMultiSelect, setUseMultiSelect] = useState(false);

  // Single-select syllabus
  const [syllabusSelection, setSyllabusSelection] = useState({ paper: '', unit: '', chapter: '', topic: '' });

  // Multi-select syllabus
  const [multiSyllabus, setMultiSyllabus] = useState({ paper: '', units: [], chapters: [], topics: [], unit: '', chapter: '', topic: '' });

  // PYQ state
  const [pyqData, setPyqData] = useState({ year: '', session: '', shift: '', questionNumber: '', isMemoryBased: false });

  // Import history (persisted)
  const [importHistory, setImportHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('netprep_import_history') || '[]'); }
    catch { return []; }
  });

  const addToHistory = (result) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      mode: importMode,
      questions: result.data?.questions || 0,
      passages: result.data?.passages || 0,
      diData: result.data?.diData || 0,
      errors: result.data?.errors || 0,
      paper: activeSyllabus.paper,
      source: importMode === 'pyq' ? generatePYQSource() : 'JSON Import',
    };
    const updated = [entry, ...importHistory].slice(0, 20);
    setImportHistory(updated);
    try { localStorage.setItem('netprep_import_history', JSON.stringify(updated)); } catch {}
  };

  // Active syllabus (resolves single vs multi)
  const activeSyllabus = useMemo(() => {
    if (useMultiSelect) {
      return {
        paper: multiSyllabus.paper,
        unit: multiSyllabus.unit || multiSyllabus.units?.[0] || '',
        chapter: multiSyllabus.chapter || multiSyllabus.chapters?.[0] || '',
        topic: multiSyllabus.topic || multiSyllabus.topics?.[0] || '',
        units: multiSyllabus.units || [],
        chapters: multiSyllabus.chapters || [],
        topics: multiSyllabus.topics || [],
      };
    }
    return { ...syllabusSelection, units: [], chapters: [], topics: [] };
  }, [useMultiSelect, syllabusSelection, multiSyllabus]);

  const handleSyllabusChange = useCallback((data) => {
    if (useMultiSelect) setMultiSyllabus(data);
    else setSyllabusSelection(data);
  }, [useMultiSelect]);

  const generatePYQSource = () => {
    const parts = ['PYQ'];
    if (pyqData.year) parts.push(pyqData.year);
    if (pyqData.session) parts.push(pyqData.session.charAt(0).toUpperCase() + pyqData.session.slice(1));
    if (pyqData.shift) parts.push(pyqData.shift === 'shift1' ? 'S1' : 'S2');
    if (pyqData.isMemoryBased) parts.push('(Memory)');
    return parts.join('-');
  };

  const handleJSONImport = async (jsonData) => {
    try {
      const enrichedData = {
        ...jsonData,
        defaultMeta: {
          ...jsonData.defaultMeta,
          paper: activeSyllabus.paper || jsonData.defaultMeta?.paper,
          unit: activeSyllabus.unit || jsonData.defaultMeta?.unit,
          chapter: activeSyllabus.chapter || jsonData.defaultMeta?.chapter,
          topic: activeSyllabus.topic || jsonData.defaultMeta?.topic,
          ...(importMode === 'pyq' && {
            source: generatePYQSource(), year: pyqData.year,
            isPYQ: true, pyqSession: pyqData.session,
            pyqShift: pyqData.shift, isMemoryBased: pyqData.isMemoryBased,
          }),
        },
      };
      const result = await importQuestions(enrichedData);
      setImportResult(result);
      addToHistory(result);
      success(`Successfully imported ${result.data?.questions || 0} questions!`);
      return result;
    } catch (err) {
      showError(err.message || 'Import failed');
      throw err;
    }
  };

  const handleManualCreate = async (questionData) => {
    try {
      const enriched = {
        ...questionData,
        paper: activeSyllabus.paper || questionData.paper,
        unit: activeSyllabus.unit || questionData.unit,
        chapter: activeSyllabus.chapter || questionData.chapter,
        topic: activeSyllabus.topic || questionData.topic,
        ...(importMode === 'pyq' && {
          source: generatePYQSource(), year: pyqData.year,
          isPYQ: true, pyqSession: pyqData.session,
          pyqShift: pyqData.shift, isMemoryBased: pyqData.isMemoryBased,
        }),
      };
      await createQuestion(enriched);
      success('Question created successfully!');
      setShowQuestionForm(false);
    } catch (err) {
      showError(err.message || 'Failed to create question');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return showError('Please enter questions');
    if (!activeSyllabus.paper) return showError('Please select a paper first');
    try {
      const lines = bulkText.split('\n').filter((l) => l.trim());
      const questions = [];
      let cur = null;
      for (const line of lines) {
        if (line.match(/^Q?\d+[\.:]/i)) {
          if (cur && cur.options.hi.length >= 2) questions.push(cur);
          cur = {
            question: { hi: line.replace(/^Q?\d+[\.:]\s*/i, ''), en: '' },
            options: { hi: [], en: [] }, correctAnswer: 0, questionType: 'mcq',
            paper: activeSyllabus.paper, unit: activeSyllabus.unit,
            chapter: activeSyllabus.chapter, topic: activeSyllabus.topic, difficulty: 'medium',
            ...(importMode === 'pyq' && { source: generatePYQSource(), year: pyqData.year, isPYQ: true }),
          };
        } else if (line.match(/^[A-Da-d][\)\.]/)) {
          if (cur) {
            const optText = line.replace(/^[A-Da-d][\)\.]\s*/, '');
            const isCorrect = /[\*✓]|\(correct\)/i.test(optText);
            const clean = optText.replace(/[\*✓]|\(correct\)/gi, '').trim();
            if (isCorrect) cur.correctAnswer = cur.options.hi.length;
            cur.options.hi.push(clean);
          }
        } else if (line.match(/^(Ans|Answer|उत्तर)[\.:]/i)) {
          if (cur) { const m = line.match(/[A-Da-d]/); if (m) cur.correctAnswer = m[0].toUpperCase().charCodeAt(0) - 65; }
        } else if (line.match(/^(Exp|Explanation|व्याख्या)[\.:]/i)) {
          if (cur) cur.explanation = { hi: line.replace(/^(Exp|Explanation|व्याख्या)[\.:]\s*/i, ''), en: '' };
        }
      }
      if (cur && cur.options.hi.length >= 2) questions.push(cur);
      if (questions.length === 0) return showError('No valid questions found');
      const result = await importQuestions({
        importMode: 'bulk',
        defaultMeta: { language: 'hi', paper: activeSyllabus.paper, unit: activeSyllabus.unit, chapter: activeSyllabus.chapter, topic: activeSyllabus.topic },
        questions,
      });
      setImportResult(result);
      addToHistory(result);
      success(`Imported ${questions.length} questions from bulk text`);
      setBulkText('');
    } catch (err) {
      showError('Parse failed: ' + err.message);
    }
  };

  const detectedBulkCount = useMemo(() => {
    return bulkText.split(/Q?\d+[\.:]/i).filter((q) => q.trim()).length;
  }, [bulkText]);

  // ────────────────────────────────────────────────────────────
  return (
    <Layout>
      {({ language }) => (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Upload className="w-7 h-7 text-primary-600" />
                {language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}
              </h1>
              <p className="text-gray-500 dark:text-secondary-400 mt-1">
                {language === 'hi'
                  ? 'JSON, मैन्युअल, बल्क या PYQ मोड से प्रश्न जोड़ें'
                  : 'Add questions via JSON, Manual, Bulk or PYQ mode'}
              </p>
            </div>
            {/* Import stats summary */}
            {importHistory.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {importHistory.reduce((s, h) => s + h.questions, 0)} {language === 'hi' ? 'कुल आयातित' : 'Total Imported'}
                  </p>
                  <p className="text-xs text-primary-500 dark:text-primary-400">
                    {importHistory.length} {language === 'hi' ? 'सत्र' : 'sessions'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Import Mode Selection ── */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'hi' ? 'आयात विधि चुनें' : 'Select Import Method'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {IMPORT_MODES.map(({ mode, icon: Icon, label, labelHi, desc, descHi }) => (
                <button
                  key={mode}
                  onClick={() => { setImportMode(mode); setImportResult(null); }}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all group text-left
                    ${importMode === mode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md shadow-primary-100 dark:shadow-primary-900/20'
                      : 'border-gray-200 dark:border-secondary-600 hover:border-gray-300 dark:hover:border-secondary-500 hover:shadow-sm'}
                  `}
                >
                  {importMode === mode && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <Icon className={`w-7 h-7 mb-2 transition-colors ${importMode === mode ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                  <h3 className={`font-semibold text-sm ${importMode === mode ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-secondary-300'}`}>
                    {language === 'hi' ? labelHi : label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-secondary-500 mt-0.5">
                    {language === 'hi' ? descHi : desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── PYQ Details ── */}
          {importMode === 'pyq' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
              <h2 className="text-base font-semibold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {language === 'hi' ? 'PYQ विवरण' : 'PYQ Details'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'वर्ष' : 'Year'} *</label>
                  <select value={pyqData.year} onChange={(e) => setPyqData({ ...pyqData, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">{language === 'hi' ? 'चुनें' : 'Select'}</option>
                    {PYQ_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'सत्र' : 'Session'} *</label>
                  <select value={pyqData.session} onChange={(e) => setPyqData({ ...pyqData, session: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">{language === 'hi' ? 'चुनें' : 'Select'}</option>
                    {PYQ_SESSIONS.map((s) => <option key={s.value} value={s.value}>{language === 'hi' ? s.labelHi : s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'शिफ्ट' : 'Shift'}</label>
                  <select value={pyqData.shift} onChange={(e) => setPyqData({ ...pyqData, shift: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">{language === 'hi' ? 'चुनें' : 'Select'}</option>
                    {PYQ_SHIFTS.map((s) => <option key={s.value} value={s.value}>{language === 'hi' ? s.labelHi : s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">{language === 'hi' ? 'प्रश्न सं.' : 'Q. No.'}</label>
                  <input type="text" value={pyqData.questionNumber} onChange={(e) => setPyqData({ ...pyqData, questionNumber: e.target.value })} placeholder="1-50" className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={pyqData.isMemoryBased} onChange={(e) => setPyqData({ ...pyqData, isMemoryBased: e.target.checked })} className="w-4 h-4 text-amber-600 rounded" />
                  <span className="text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'मेमोरी बेस्ड (अनौपचारिक)' : 'Memory Based (Unofficial)'}</span>
                </label>
                {(pyqData.year || pyqData.session) && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-600" />
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium">{generatePYQSource()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Syllabus Selection ── */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                {language === 'hi' ? 'सिलेबस चुनें' : 'Select Syllabus'}
              </h2>
              {/* Multi-select toggle */}
              <button
                type="button"
                onClick={() => setUseMultiSelect(!useMultiSelect)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${useMultiSelect
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-secondary-700 dark:text-secondary-400 hover:bg-gray-200 dark:hover:bg-secondary-600'}
                `}
              >
                {useMultiSelect ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {language === 'hi' ? 'बहु-चयन' : 'Multi-Select'}
              </button>
            </div>

            <SyllabusDropdown
              value={useMultiSelect ? multiSyllabus : syllabusSelection}
              onChange={handleSyllabusChange}
              language={language}
              required
              multiSelect={useMultiSelect}
            />

            {/* Multi-select info */}
            {useMultiSelect && (
              <p className="mt-3 text-xs text-gray-500 dark:text-secondary-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'hi'
                  ? 'बहु-चयन मोड: एक से अधिक इकाई, अध्याय और विषय चुन सकते हैं। आयात में पहला चयनित आइटम डिफ़ॉल्ट मेटा के रूप में उपयोग होगा।'
                  : 'Multi-select mode: Select multiple units, chapters & topics. The first selected item will be used as default meta for import.'}
              </p>
            )}
          </div>

          {/* ── Import Content ── */}
          {(importMode === 'json' || importMode === 'pyq') && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                      {importMode === 'pyq'
                        ? (language === 'hi' ? 'PYQ आयात निर्देश' : 'PYQ Import Instructions')
                        : (language === 'hi' ? 'JSON आयात निर्देश' : 'JSON Import Instructions')}
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-0.5">
                      <li>• {language === 'hi' ? 'टेम्पलेट चुनें या अपना JSON पेस्ट करें' : 'Select a template or paste your JSON'}</li>
                      <li>• {language === 'hi' ? '"All-in-One" टेम्पलेट में सभी प्रश्न प्रकार का उदाहरण है' : '"All-in-One" template has examples of every question type'}</li>
                      <li>• {language === 'hi' ? 'अनुवाद स्वचालित होगा' : 'Translation will be automatic'}</li>
                    </ul>
                  </div>
                </div>
              </div>
              <JSONImport onImport={handleJSONImport} onValidate={validateImport} language={language} loading={loading} />
            </>
          )}

          {importMode === 'manual' && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-8 shadow-sm">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Edit className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {language === 'hi' ? 'मैन्युअल प्रश्न जोड़ें' : 'Add Question Manually'}
                </h3>
                <p className="text-gray-500 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                  {activeSyllabus.paper
                    ? (language === 'hi' ? 'फॉर्म के माध्यम से एक-एक प्रश्न जोड़ें' : 'Add questions one by one through the form')
                    : (language === 'hi' ? 'कृपया पहले पेपर और सिलेबस चुनें' : 'Please select paper and syllabus first')}
                </p>
                <Button variant="primary" icon={Plus} onClick={() => setShowQuestionForm(true)} disabled={!activeSyllabus.paper} size="lg">
                  {language === 'hi' ? 'नया प्रश्न जोड़ें' : 'Add New Question'}
                </Button>
              </div>
            </div>
          )}

          {importMode === 'bulk' && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                {language === 'hi' ? 'बल्क टेक्स्ट आयात' : 'Bulk Text Import'}
              </h3>
              <div className="mb-4 p-4 bg-gray-50 dark:bg-secondary-900/50 border border-gray-200 dark:border-secondary-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-secondary-300 mb-2">
                  {language === 'hi' ? 'समर्थित प्रारूप:' : 'Supported Format:'}
                </p>
                <pre className="text-xs text-gray-600 dark:text-secondary-400 bg-white dark:bg-secondary-800 p-3 rounded border dark:border-secondary-700 overflow-x-auto font-mono">
{`Q1. प्रश्न यहाँ लिखें
A) विकल्प 1
B) विकल्प 2
C) विकल्प 3 *
D) विकल्प 4
Ans: C
Exp: व्याख्या`}
                </pre>
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm bg-white dark:bg-secondary-700 dark:text-secondary-100"
                placeholder={language === 'hi' ? 'अपने प्रश्न यहाँ पेस्ट करें...' : 'Paste your questions here...'}
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500 dark:text-secondary-400 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {detectedBulkCount} {language === 'hi' ? 'प्रश्न पहचाने गए' : 'questions detected'}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setBulkText('')} disabled={!bulkText.trim()}>
                    {language === 'hi' ? 'साफ़ करें' : 'Clear'}
                  </Button>
                  <Button variant="primary" icon={Upload} onClick={handleBulkImport} loading={loading} disabled={!bulkText.trim() || !activeSyllabus.paper}>
                    {language === 'hi' ? 'आयात करें' : 'Import'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Import Result ── */}
          {importResult && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 animate-scale-in">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {language === 'hi' ? 'आयात सफल!' : 'Import Successful!'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: importResult.data?.questions || 0, label: language === 'hi' ? 'प्रश्न' : 'Questions', color: 'text-green-600' },
                  { value: importResult.data?.passages || 0, label: language === 'hi' ? 'गद्यांश' : 'Passages', color: 'text-blue-600' },
                  { value: importResult.data?.diData || 0, label: 'DI Sets', color: 'text-purple-600' },
                  { value: importResult.data?.errors || 0, label: language === 'hi' ? 'त्रुटियां' : 'Errors', color: 'text-red-600' },
                ].map((item, i) => (
                  <div key={i} className="bg-white dark:bg-secondary-800 rounded-lg p-3 text-center shadow-sm border border-green-100 dark:border-green-900">
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-600 dark:text-secondary-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              {importResult.data?.skipped > 0 && (
                <p className="mt-3 text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {importResult.data.skipped} {language === 'hi' ? 'डुप्लिकेट छोड़े गए' : 'duplicates skipped'}
                </p>
              )}
            </div>
          )}

          {/* ── Recent Import History ── */}
          {importHistory.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-secondary-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {language === 'hi' ? 'हाल ही के आयात' : 'Recent Imports'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setImportHistory([]); localStorage.removeItem('netprep_import_history'); }}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  {language === 'hi' ? 'हटाएं' : 'Clear'}
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {importHistory.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-secondary-900/50 rounded-lg text-xs">
                    <div className="flex items-center gap-3">
                      <Zap className="w-3.5 h-3.5 text-primary-500" />
                      <span className="text-gray-600 dark:text-secondary-400">{new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-medium text-gray-700 dark:text-secondary-300">{h.questions} Q</span>
                      {h.source && <span className="text-gray-400">{h.source}</span>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${h.errors > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {h.errors > 0 ? `${h.errors} err` : 'OK'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QuestionForm Modal ── */}
          <QuestionForm
            isOpen={showQuestionForm}
            onClose={() => setShowQuestionForm(false)}
            onSubmit={handleManualCreate}
            syllabus={{ paper1: syllabusPaper1, paper2: syllabusPaper2History }}
            initialData={{
              paper: activeSyllabus.paper, unit: activeSyllabus.unit,
              chapter: activeSyllabus.chapter, topic: activeSyllabus.topic,
              ...(importMode === 'pyq' && { source: generatePYQSource(), year: pyqData.year }),
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