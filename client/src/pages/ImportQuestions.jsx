import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload, FileJson, HelpCircle, BookOpen, Plus, X, Edit,
  Database, Calendar, History, Tag, ToggleLeft, ToggleRight,
  BarChart3, Clock, CheckCircle, AlertTriangle, FileText, Zap
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import JSONImport from '../components/question/JSONImport';
import TextToJSON from '../components/question/TextToJSON';
import ImportPreview from '../components/question/ImportPreview';
import QuestionForm from '../components/question/QuestionForm';
import Button from '../components/common/Button';
import SyllabusDropdown from '../components/syllabus/SyllabusDropdown';
import { useQuestions } from '../hooks/useQuestions';
import { useToast } from '../components/common/Toast';
import { detectQuestionType as smartDetect } from '../utils/smartParser';
import syllabusPaper1 from '../data/syllabusPaper1';
import syllabusPaper2History from '../data/syllabusPaper2History';

const PYQ_YEARS = Array.from({ length: 13 }, (_, i) => (2024 - i).toString());
const PYQ_SESSIONS = [
  { value: 'june', label: 'June', labelHi: 'जून' },
  { value: 'december', label: 'December', labelHi: 'दिसंबर' },
  { value: 'november', label: 'November', labelHi: 'नवंबर' },
  { value: 'september', label: 'September', labelHi: 'सितंबर' },
];
const PYQ_SHIFTS = [
  { value: 'shift1', label: 'Shift 1', labelHi: 'शिफ्ट 1' },
  { value: 'shift2', label: 'Shift 2', labelHi: 'शिफ्ट 2' },
];
const IMPORT_MODES = [
  { mode: 'json', icon: FileJson, label: 'JSON Import', labelHi: 'JSON आयात', desc: 'Structured JSON', descHi: 'JSON फ़ाइल से' },
  { mode: 'manual', icon: Edit, label: 'Manual Entry', labelHi: 'मैन्युअल', desc: 'One by one', descHi: 'एक-एक करके' },
  { mode: 'bulk', icon: Database, label: 'Bulk Text', labelHi: 'बल्क टेक्स्ट', desc: 'Plain text', descHi: 'टेक्स्ट से' },
  { mode: 'pyq', icon: History, label: 'PYQ Import', labelHi: 'PYQ आयात', desc: 'Previous Year', descHi: 'पिछले वर्ष' },
  { mode: 'text', icon: Zap, label: 'Smart Text', labelHi: 'स्मार्ट टेक्स्ट', desc: 'Any format', descHi: 'कोई भी फ़ॉर्मेट' },
];

const ImportQuestions = () => {
  const { success, error: showError } = useToast();
  const { importQuestions, validateImport, createQuestion, loading } = useQuestions();

  const [importMode, setImportMode] = useState('json');
  const [importResult, setImportResult] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [useMultiSelect, setUseMultiSelect] = useState(false);
  const [injectedJSON, setInjectedJSON] = useState('');

  // ★ Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [previewShell, setPreviewShell] = useState(null);

  const [syllabusSelection, setSyllabusSelection] = useState({ paper: '', unit: '', chapter: '', topic: '' });
  const [multiSyllabus, setMultiSyllabus] = useState({ paper: '', units: [], chapters: [], topics: [], unit: '', chapter: '', topic: '' });
  const [pyqData, setPyqData] = useState({ year: '', session: '', shift: '', questionNumber: '', isMemoryBased: false });
  const [importHistory, setImportHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('netprep_import_history') || '[]'); } catch { return []; }
  });

  const addToHistory = (result) => {
    const entry = { id: Date.now(), timestamp: new Date().toISOString(), mode: importMode, questions: result.data?.questions || 0, passages: result.data?.passages || 0, diData: result.data?.diData || 0, errors: result.data?.errors || 0, paper: activeSyllabus.paper, source: importMode === 'pyq' ? generatePYQSource() : importMode };
    const updated = [entry, ...importHistory].slice(0, 20);
    setImportHistory(updated);
    try { localStorage.setItem('netprep_import_history', JSON.stringify(updated)); } catch { }
  };

  const activeSyllabus = useMemo(() => {
    if (useMultiSelect) return { paper: multiSyllabus.paper, unit: multiSyllabus.unit || multiSyllabus.units?.[0] || '', chapter: multiSyllabus.chapter || multiSyllabus.chapters?.[0] || '', topic: multiSyllabus.topic || multiSyllabus.topics?.[0] || '' };
    return syllabusSelection;
  }, [useMultiSelect, syllabusSelection, multiSyllabus]);

  const handleSyllabusChange = useCallback((data) => { if (useMultiSelect) setMultiSyllabus(data); else setSyllabusSelection(data); }, [useMultiSelect]);

  const generatePYQSource = () => {
    const p = ['PYQ']; if (pyqData.year) p.push(pyqData.year); if (pyqData.session) p.push(pyqData.session.charAt(0).toUpperCase() + pyqData.session.slice(1)); if (pyqData.shift) p.push(pyqData.shift === 'shift1' ? 'S1' : 'S2'); if (pyqData.isMemoryBased) p.push('(Mem)'); return p.join('-');
  };

  const enrichMeta = (jsonData) => ({
    ...jsonData,
    defaultMeta: { ...jsonData.defaultMeta, paper: activeSyllabus.paper || jsonData.defaultMeta?.paper || jsonData.paper, unit: activeSyllabus.unit || jsonData.defaultMeta?.unit || jsonData.unit, chapter: activeSyllabus.chapter || jsonData.defaultMeta?.chapter || jsonData.chapter, topic: activeSyllabus.topic || jsonData.defaultMeta?.topic || jsonData.topic, ...(importMode === 'pyq' && { source: generatePYQSource(), year: pyqData.year, isPYQ: true, pyqSession: pyqData.session, pyqShift: pyqData.shift, isMemoryBased: pyqData.isMemoryBased }) },
  });

  // ── Direct Import ──
  const handleJSONImport = async (jsonData) => {
    try {
      const result = await importQuestions(enrichMeta(jsonData));
      setImportResult(result); addToHistory(result);
      success(`Imported ${result.data?.questions || 0} questions!`);
      return result;
    } catch (err) { showError(err.message || 'Import failed'); throw err; }
  };

  // ═══════════════════════════════════════════════════════════
  // ★ PREVIEW: Flatten ALL question types for preview display
  // ═══════════════════════════════════════════════════════════
  const handlePreviewReady = useCallback((jsonData) => {
    try {
      const enriched = enrichMeta(jsonData);
      const questions = enriched.questions || [];
      const lang = enriched.language || enriched.defaultMeta?.language || jsonData.language || 'hi';
      const otherLang = lang === 'hi' ? 'en' : 'hi';
      const meta = enriched.defaultMeta || enriched;

      const flat = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q || typeof q !== 'object') continue;
        const type = q.type || q.questionType || smartDetect(q);

        // ★ PASSAGE: flatten sub-questions
        if (type === 'passage_based' || q.passage || q.passageContent) {
          const passageText = q.passage || q.passageContent || '';
          const subQs = q.questions || [];
          if (subQs.length === 0) continue;
          subQs.forEach((sq, si) => {
            flat.push({
              _previewId: `json_${i}_p${si}`, _parentIndex: i, _subIndex: si,
              _isPassageSub: true, _passageTitle: q.title || 'Passage',
              questionType: 'passage_based',
              question: { [lang]: sq.question || '', [otherLang]: '' },
              options: { [lang]: sq.options || [], [otherLang]: [] },
              correctAnswer: sq.correct ?? sq.correctAnswer ?? 0,
              explanation: { [lang]: sq.explanation || '', [otherLang]: '' },
              paper: meta.paper || '', unit: meta.unit || '', chapter: meta.chapter || '',
              topic: meta.topic || '', difficulty: sq.difficulty || meta.difficulty || 'medium',
              source: meta.source || '',
            });
          });
          continue;
        }

        // ★ DI: flatten sub-questions
        if (type.startsWith('di_') && q.diData) {
          const diData = q.diData;
          const subQs = diData.questions || [];
          if (subQs.length === 0) continue;
          const diTitle = typeof diData.title === 'string' ? diData.title : (diData.title?.[lang] || diData.title?.hi || 'DI');
          subQs.forEach((sq, si) => {
            flat.push({
              _previewId: `json_${i}_d${si}`, _parentIndex: i, _subIndex: si,
              _isDISub: true, _diTitle: diTitle, _diType: type,
              questionType: type,
              question: { [lang]: sq.question || '', [otherLang]: '' },
              options: { [lang]: sq.options || [], [otherLang]: [] },
              correctAnswer: sq.correct ?? sq.correctAnswer ?? 0,
              explanation: { [lang]: sq.explanation || '', [otherLang]: '' },
              paper: meta.paper || '', unit: meta.unit || '', chapter: meta.chapter || '',
              topic: meta.topic || '', difficulty: sq.difficulty || meta.difficulty || 'medium',
              source: meta.source || '',
            });
          });
          continue;
        }

        // ★ Regular question types (MCQ, AR, Match, Sequence, Statement)
        const pq = buildPreviewQ(q, type, lang, otherLang, meta, i);
        if (pq) flat.push(pq);
      }

      // Store shell + original questions for reconstruction on save
      setPreviewShell({ ...enriched, _originalQuestions: questions });
      setPreviewQuestions(flat);
      setShowPreview(true);
    } catch (err) {
      showError('Preview failed: ' + err.message);
      console.error(err);
    }
  }, [activeSyllabus, importMode, pyqData]);

  // ═══════════════════════════════════════════════════════════
  // ★ SAVE FROM PREVIEW: Reconstruct groups & import
  // ═══════════════════════════════════════════════════════════
  const handleSaveFromPreview = async (previewData) => {
    try {
      const lang = previewShell?.language || previewShell?.defaultMeta?.language || 'hi';
      const origQs = previewShell?._originalQuestions || [];
      const importQs = [];
      const passageMap = {}; // parentIndex → subQuestions[]
      const diMap = {};      // parentIndex → subQuestions[]

      for (const q of (previewData.questions || [])) {
        if (q._isPassageSub && q._parentIndex !== undefined) {
          if (!passageMap[q._parentIndex]) passageMap[q._parentIndex] = [];
          passageMap[q._parentIndex].push({ question: q.question?.[lang] || '', options: q.options?.[lang] || [], correct: q.correctAnswer ?? 0, explanation: q.explanation?.[lang] || '' });
        } else if (q._isDISub && q._parentIndex !== undefined) {
          if (!diMap[q._parentIndex]) diMap[q._parentIndex] = [];
          diMap[q._parentIndex].push({ question: q.question?.[lang] || '', options: q.options?.[lang] || [], correct: q.correctAnswer ?? 0, explanation: q.explanation?.[lang] || '' });
        } else {
          importQs.push(convertToImport(q, lang));
        }
      }

      // Reconstruct passage groups
      for (const [idx, subs] of Object.entries(passageMap)) {
        const orig = origQs[parseInt(idx)];
        if (!orig || subs.length === 0) continue;
        importQs.push({ ...orig, questions: subs });
      }

      // Reconstruct DI groups
      for (const [idx, subs] of Object.entries(diMap)) {
        const orig = origQs[parseInt(idx)];
        if (!orig || subs.length === 0) continue;
        importQs.push({ ...orig, diData: { ...(orig.diData || {}), questions: subs } });
      }

      const importData = {
        language: previewShell?.language || lang,
        paper: previewShell?.defaultMeta?.paper || previewShell?.paper || '',
        unit: previewShell?.defaultMeta?.unit || '',
        chapter: previewShell?.defaultMeta?.chapter || '',
        topic: previewShell?.defaultMeta?.topic || '',
        difficulty: previewShell?.defaultMeta?.difficulty || 'medium',
        source: previewShell?.defaultMeta?.source || '',
        defaultMeta: previewShell?.defaultMeta,
        questions: importQs,
        _skipDuplicates: true,
      };

      const result = await importQuestions(importData);
      setImportResult(result); addToHistory(result);
      return result;
    } catch (err) { showError(err.message || 'Save failed'); throw err; }
  };

  const handleTextToJSONEditor = (jsonStr) => { setInjectedJSON(jsonStr); setImportMode('json'); };
  const handleTextPreview = useCallback((jsonData) => handlePreviewReady(jsonData), [handlePreviewReady]);

  const handleManualCreate = async (qd) => {
    try {
      await createQuestion({ ...qd, paper: activeSyllabus.paper || qd.paper, unit: activeSyllabus.unit || qd.unit, chapter: activeSyllabus.chapter || qd.chapter, topic: activeSyllabus.topic || qd.topic });
      success('Question created!'); setShowQuestionForm(false);
    } catch (err) { showError(err.message); }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return showError('Enter questions');
    if (!activeSyllabus.paper) return showError('Select paper first');
    try {
      const lines = bulkText.split('\n').filter(l => l.trim());
      const qs = []; let cur = null;
      for (const line of lines) {
        if (line.match(/^Q?\d+[\.:]/i)) {
          if (cur && cur.options.hi.length >= 2) qs.push(cur);
          cur = { question: { hi: line.replace(/^Q?\d+[\.:]\s*/i, ''), en: '' }, options: { hi: [], en: [] }, correctAnswer: 0, questionType: 'mcq', paper: activeSyllabus.paper, unit: activeSyllabus.unit, chapter: activeSyllabus.chapter, topic: activeSyllabus.topic, difficulty: 'medium' };
        } else if (line.match(/^[A-Da-d][\)\.]/)) {
          if (cur) { const t = line.replace(/^[A-Da-d][\)\.]\s*/, ''); const isc = /[\*✓]|\(correct\)/i.test(t); const cl = t.replace(/[\*✓]|\(correct\)/gi, '').trim(); if (isc) cur.correctAnswer = cur.options.hi.length; cur.options.hi.push(cl); }
        } else if (line.match(/^(Ans|Answer|उत्तर)[\.:]/i)) { if (cur) { const m = line.match(/[A-Da-d]/); if (m) cur.correctAnswer = m[0].toUpperCase().charCodeAt(0) - 65; } }
        else if (line.match(/^(Exp|Explanation|व्याख्या)[\.:]/i)) { if (cur) cur.explanation = { hi: line.replace(/^(Exp|Explanation|व्याख्या)[\.:]\s*/i, ''), en: '' }; }
      }
      if (cur && cur.options.hi.length >= 2) qs.push(cur);
      if (qs.length === 0) return showError('No valid questions');
      const result = await importQuestions({ importMode: 'bulk', defaultMeta: { language: 'hi', paper: activeSyllabus.paper, unit: activeSyllabus.unit, chapter: activeSyllabus.chapter, topic: activeSyllabus.topic }, questions: qs });
      setImportResult(result); addToHistory(result); success(`Imported ${qs.length} questions`); setBulkText('');
    } catch (err) { showError('Parse failed: ' + err.message); }
  };

  const detectedBulkCount = useMemo(() => bulkText.split(/Q?\d+[\.:]/i).filter(q => q.trim()).length, [bulkText]);

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <Layout>
      {({ language }) => (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Upload className="w-7 h-7 text-primary-600" />{language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}</h1>
              <p className="text-gray-500 dark:text-secondary-400 mt-1">{language === 'hi' ? 'JSON, मैन्युअल, बल्क, PYQ या स्मार्ट टेक्स्ट से' : 'Via JSON, Manual, Bulk, PYQ or Smart Text'}</p>
            </div>
            {importHistory.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <div><p className="text-sm font-semibold text-primary-700 dark:text-primary-300">{importHistory.reduce((s, h) => s + h.questions, 0)} {language === 'hi' ? 'कुल' : 'Total'}</p><p className="text-xs text-primary-500">{importHistory.length} sessions</p></div>
              </div>
            )}
          </div>

          {/* Mode Selection */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{language === 'hi' ? 'आयात विधि' : 'Import Method'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {IMPORT_MODES.map(({ mode, icon: Icon, label, labelHi, desc, descHi }) => (
                <button key={mode} onClick={() => { setImportMode(mode); setImportResult(null); }}
                  className={`relative p-4 rounded-xl border-2 transition-all group text-left ${importMode === mode ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md' : 'border-gray-200 dark:border-secondary-600 hover:border-gray-300 hover:shadow-sm'}`}>
                  {importMode === mode && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-primary-600" /></div>}
                  <Icon className={`w-7 h-7 mb-2 ${importMode === mode ? 'text-primary-600' : 'text-gray-400'}`} />
                  <h3 className={`font-semibold text-sm ${importMode === mode ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-secondary-300'}`}>{language === 'hi' ? labelHi : label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{language === 'hi' ? descHi : desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* PYQ */}
          {importMode === 'pyq' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5">
              <h2 className="text-base font-semibold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> PYQ Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Year *</label><select value={pyqData.year} onChange={e => setPyqData({ ...pyqData, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200"><option value="">Select</option>{PYQ_YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Session</label><select value={pyqData.session} onChange={e => setPyqData({ ...pyqData, session: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200"><option value="">Select</option>{PYQ_SESSIONS.map(s => <option key={s.value} value={s.value}>{language === 'hi' ? s.labelHi : s.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Shift</label><select value={pyqData.shift} onChange={e => setPyqData({ ...pyqData, shift: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200"><option value="">Select</option>{PYQ_SHIFTS.map(s => <option key={s.value} value={s.value}>{language === 'hi' ? s.labelHi : s.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-secondary-300 mb-1">Q No.</label><input type="text" value={pyqData.questionNumber} onChange={e => setPyqData({ ...pyqData, questionNumber: e.target.value })} placeholder="1-50" className="w-full px-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-800 dark:text-secondary-200" /></div>
              </div>
              <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={pyqData.isMemoryBased} onChange={e => setPyqData({ ...pyqData, isMemoryBased: e.target.checked })} className="w-4 h-4 text-amber-600 rounded" /><span className="text-gray-700 dark:text-secondary-300">Memory Based</span></label>
                {(pyqData.year || pyqData.session) && <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{generatePYQSource()}</span>}
              </div>
            </div>
          )}

          {/* Syllabus */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-600" /> {language === 'hi' ? 'सिलेबस' : 'Syllabus'}</h2>
              <button type="button" onClick={() => setUseMultiSelect(!useMultiSelect)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${useMultiSelect ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                {useMultiSelect ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} {language === 'hi' ? 'बहु-चयन' : 'Multi'}
              </button>
            </div>
            <SyllabusDropdown value={useMultiSelect ? multiSyllabus : syllabusSelection} onChange={handleSyllabusChange} language={language} required multiSelect={useMultiSelect} />
          </div>

          {/* ═════ Content by Mode ═════ */}

          {(importMode === 'json' || importMode === 'pyq') && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-0.5">
                    <li>• {language === 'hi' ? '"Preview" से पहले सभी प्रश्न देखें, एडिट करें' : '"Preview" to see all questions, edit before saving'}</li>
                    <li>• {language === 'hi' ? '"Import" से सीधे सहेजें' : '"Import" saves directly to database'}</li>
                    <li>• {language === 'hi' ? 'Passage, DI सभी प्रकार Preview में दिखते हैं' : 'Passage, DI — all types shown in Preview'}</li>
                  </ul>
                </div>
              </div>
              <JSONImport onImport={handleJSONImport} onValidate={validateImport} onPreviewReady={handlePreviewReady} enablePreview={true} language={language} loading={loading} initialJSON={injectedJSON} />
            </>
          )}

          {importMode === 'manual' && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-8 shadow-sm text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4"><Edit className="w-8 h-8 text-primary-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{language === 'hi' ? 'मैन्युअल' : 'Manual'}</h3>
              <p className="text-gray-500 mb-6">{activeSyllabus.paper ? (language === 'hi' ? 'फॉर्म से जोड़ें' : 'Add via form') : (language === 'hi' ? 'पहले पेपर चुनें' : 'Select paper first')}</p>
              <Button variant="primary" icon={Plus} onClick={() => setShowQuestionForm(true)} disabled={!activeSyllabus.paper} size="lg">{language === 'hi' ? 'नया प्रश्न' : 'New Question'}</Button>
            </div>
          )}

          {importMode === 'bulk' && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-primary-600" /> Bulk Text</h3>
              <div className="mb-4 p-4 bg-gray-50 dark:bg-secondary-900/50 border rounded-lg"><pre className="text-xs text-gray-600 bg-white dark:bg-secondary-800 p-3 rounded border overflow-x-auto font-mono">{`Q1. प्रश्न\nA) विकल्प 1\nB) विकल्प 2\nC) विकल्प 3 *\nD) विकल्प 4\nAns: C\nExp: व्याख्या`}</pre></div>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={12} className="w-full px-4 py-3 border border-gray-300 dark:border-secondary-600 rounded-lg font-mono text-sm bg-white dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder={language === 'hi' ? 'प्रश्न पेस्ट करें...' : 'Paste questions...'} />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500 flex items-center gap-1"><FileText className="w-4 h-4" /> {detectedBulkCount} detected</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setBulkText('')} disabled={!bulkText.trim()}>Clear</Button>
                  <Button variant="primary" icon={Upload} onClick={handleBulkImport} loading={loading} disabled={!bulkText.trim() || !activeSyllabus.paper}>Import</Button>
                </div>
              </div>
            </div>
          )}

          {importMode === 'text' && <TextToJSON language={language} meta={{ paper: activeSyllabus.paper, unit: activeSyllabus.unit, chapter: activeSyllabus.chapter, topic: activeSyllabus.topic }} onGenerateJSON={handleTextToJSONEditor} onParsePreview={handleTextPreview} />}

          {/* Result */}
          {importResult && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {language === 'hi' ? 'सफल!' : 'Success!'}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{ v: importResult.data?.questions || 0, l: 'Questions', c: 'text-green-600' }, { v: importResult.data?.passages || 0, l: 'Passages', c: 'text-blue-600' }, { v: importResult.data?.diData || 0, l: 'DI', c: 'text-purple-600' }, { v: importResult.data?.errors || 0, l: 'Errors', c: 'text-red-600' }].map((it, i) => (
                  <div key={i} className="bg-white dark:bg-secondary-800 rounded-lg p-3 text-center shadow-sm border border-green-100 dark:border-green-900"><p className={`text-2xl font-bold ${it.c}`}>{it.v}</p><p className="text-xs text-gray-500 mt-0.5">{it.l}</p></div>
                ))}
              </div>
              {importResult.data?.skipped > 0 && <p className="mt-3 text-sm text-yellow-700 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> {importResult.data.skipped} skipped</p>}
            </div>
          )}

          {/* History */}
          {importHistory.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-secondary-300 flex items-center gap-2"><Clock className="w-4 h-4" /> Recent</h3>
                <button type="button" onClick={() => { setImportHistory([]); localStorage.removeItem('netprep_import_history'); }} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {importHistory.slice(0, 5).map(h => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-secondary-900/50 rounded-lg text-xs">
                    <div className="flex items-center gap-3"><Zap className="w-3.5 h-3.5 text-primary-500" /><span className="text-gray-600">{new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span><span className="font-medium text-gray-700">{h.questions} Q</span></div>
                    <span className={`px-2 py-0.5 rounded-full ${h.errors > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{h.errors > 0 ? `${h.errors} err` : 'OK'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <QuestionForm isOpen={showQuestionForm} onClose={() => setShowQuestionForm(false)} onSubmit={handleManualCreate} syllabus={{ paper1: syllabusPaper1, paper2: syllabusPaper2History }} initialData={{ paper: activeSyllabus.paper, unit: activeSyllabus.unit, chapter: activeSyllabus.chapter, topic: activeSyllabus.topic }} loading={loading} language={language} />

          {/* ★ Preview Overlay */}
          {showPreview && (
            <ImportPreview isOpen={showPreview} onClose={() => { setShowPreview(false); setPreviewQuestions([]); }} questions={previewQuestions} onSave={handleSaveFromPreview} loading={loading} language={language} />
          )}
        </div>
      )}
    </Layout>
  );
};

// ═══════════════════════════════════════════════════════════
// Build a single preview question from JSON import format
// ═══════════════════════════════════════════════════════════
function buildPreviewQ(q, type, lang, other, meta, idx) {
  const pq = {
    _previewId: `json_${idx}`,
    questionType: type,
    question: typeof q.question === 'string' ? { [lang]: q.question, [other]: '' } : (q.question || { [lang]: '', [other]: '' }),
    options: Array.isArray(q.options) ? { [lang]: q.options, [other]: [] } : (q.options || { [lang]: [], [other]: [] }),
    correctAnswer: q.correct ?? q.correctAnswer ?? 0,
    explanation: typeof q.explanation === 'string' ? { [lang]: q.explanation, [other]: '' } : (q.explanation || { [lang]: '', [other]: '' }),
    paper: q.paper || meta.paper || '', unit: q.unit || meta.unit || '', chapter: q.chapter || meta.chapter || '',
    topic: q.topic || meta.topic || '', difficulty: q.difficulty || meta.difficulty || 'medium', source: q.source || meta.source || '',
  };

  if (type === 'assertion_reason') {
    pq.assertionReasonData = {
      assertion: typeof q.assertion === 'string' ? { [lang]: q.assertion, [other]: '' } : (q.assertionReasonData?.assertion || { [lang]: '', [other]: '' }),
      reason: typeof q.reason === 'string' ? { [lang]: q.reason, [other]: '' } : (q.assertionReasonData?.reason || { [lang]: '', [other]: '' }),
    };
  }
  if (type === 'match_following') {
    pq.matchData = {
      listA: Array.isArray(q.listA) ? { [lang]: q.listA, [other]: [] } : (q.matchData?.listA || { [lang]: [], [other]: [] }),
      listB: Array.isArray(q.listB) ? { [lang]: q.listB, [other]: [] } : (q.matchData?.listB || { [lang]: [], [other]: [] }),
      correctMatch: q.correctMatch || q.matchData?.correctMatch || [],
    };
  }
  if (type === 'statement_based') {
    pq.statementData = {
      statements: Array.isArray(q.statements) ? { [lang]: q.statements, [other]: [] } : (q.statementData?.statements || { [lang]: [], [other]: [] }),
      correctStatements: q.correctStatements || q.statementData?.correctStatements || [],
    };
  }
  if (type === 'sequence_order') {
    pq.sequenceData = {
      items: Array.isArray(q.items) ? { [lang]: q.items, [other]: [] } : (q.sequenceData?.items || { [lang]: [], [other]: [] }),
      correctOrder: q.correctOrder || q.sequenceData?.correctOrder || [],
    };
  }

  return pq;
}

// Convert preview question back to server import format
function convertToImport(q, lang) {
  const base = {
    type: q.questionType, question: q.question?.[lang] || q.question?.hi || q.question?.en || '',
    options: q.options?.[lang] || q.options?.hi || q.options?.en || [], correct: q.correctAnswer ?? 0,
    explanation: q.explanation?.[lang] || q.explanation?.hi || q.explanation?.en || '',
    difficulty: q.difficulty, paper: q.paper, unit: q.unit, chapter: q.chapter, topic: q.topic, source: q.source,
  };
  if (q.questionType === 'assertion_reason' && q.assertionReasonData) {
    base.assertion = q.assertionReasonData.assertion?.[lang] || q.assertionReasonData.assertion?.hi || '';
    base.reason = q.assertionReasonData.reason?.[lang] || q.assertionReasonData.reason?.hi || '';
  }
  if (q.questionType === 'match_following' && q.matchData) {
    base.listA = q.matchData.listA?.[lang] || q.matchData.listA?.hi || [];
    base.listB = q.matchData.listB?.[lang] || q.matchData.listB?.hi || [];
    base.correctMatch = q.matchData.correctMatch || [];
  }
  if (q.questionType === 'statement_based' && q.statementData) {
    base.statements = q.statementData.statements?.[lang] || q.statementData.statements?.hi || [];
    base.correctStatements = q.statementData.correctStatements || [];
  }
  if (q.questionType === 'sequence_order' && q.sequenceData) {
    base.items = q.sequenceData.items?.[lang] || q.sequenceData.items?.hi || [];
    base.correctOrder = q.sequenceData.correctOrder || [];
  }
  return base;
}

export default ImportQuestions;