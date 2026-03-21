import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Layers, Filter, FileText, Settings, Eye, CheckCircle2,
  Keyboard, HelpCircle, Shuffle, Rocket, Plus, RotateCcw,
  BookOpen, Target, Clock, Award, MinusCircle, Sparkles,
  Zap, Trophy, Lightbulb, Activity, Play, Copy, X
} from 'lucide-react';
import { useTest } from '../../hooks/useTest';
import { useQuestions } from '../../hooks/useQuestions';
import { TEST_TYPE_CONFIG, PAPER_LABELS, QUESTION_TYPE_LABELS } from '../../utils/constants';
import { useSyllabus } from '../../hooks/useSyllabus';
import { useToast } from '../common/Toast';
import useUndoRedo from './hooks/useUndoRedo';
import QuestionLibraryModal from './QuestionLibraryModal';
import TitleGenerator from './TitleGenerator';
import { getUnitNamesFromKeys, getChapterNamesFromKeys, getTopicNamesFromKeys } from '../../utils/testHelpers';

import {
  GlassCard, StepIndicator, FloatingActionButton,
  StatCard, TestTypeCard, QuickTemplateCard, DifficultyChart,
  SelectedQuestionsPanel, EnhancedMultiSelect, NavigationFooter,
  KeyboardShortcutsHelp, TestQualityIndicator, EnhancedTitlePreview,
  AnimatedCounter
} from './create';

// ==========================================
// STEPS CONFIG
// ==========================================
const STEPS = [
  { id: 'type', label: 'Test Type', labelHi: 'परीक्षा प्रकार', icon: Layers },
  { id: 'filters', label: 'Filters', labelHi: 'फ़िल्टर', icon: Filter },
  { id: 'questions', label: 'Questions', labelHi: 'प्रश्न', icon: FileText },
  { id: 'settings', label: 'Settings', labelHi: 'सेटिंग्स', icon: Settings },
  { id: 'review', label: 'Review', labelHi: 'समीक्षा', icon: Eye },
  { id: 'complete', label: 'Complete', labelHi: 'पूर्ण', icon: CheckCircle2 }
];

const QUICK_TEMPLATES = [
  { id: 'quick_10', name: 'Quick 10', nameHi: 'त्वरित 10', desc: '10 Q, 15 min', descHi: '10 प्रश्न, 15 मिनट', icon: Zap, gradient: 'from-amber-500 to-orange-500', config: { testType: 'dpp', totalQuestions: 10, duration: 15 } },
  { id: 'chapter_25', name: 'Chapter Test', nameHi: 'अध्याय परीक्षा', desc: '25 Q, 30 min', descHi: '25 प्रश्न, 30 मिनट', icon: BookOpen, gradient: 'from-purple-500 to-indigo-500', config: { testType: 'chapter_test', totalQuestions: 25, duration: 30 } },
  { id: 'full_mock', name: 'Full Mock', nameHi: 'फुल मॉक', desc: '50 Q, 60 min', descHi: '50 प्रश्न, 60 मिनट', icon: Target, gradient: 'from-rose-500 to-pink-500', config: { testType: 'full_mock_p1', totalQuestions: 50, duration: 60 } },
  { id: 'pyq_practice', name: 'PYQ Set', nameHi: 'PYQ सेट', desc: 'Previous Year', descHi: 'पिछले वर्ष', icon: Trophy, gradient: 'from-emerald-500 to-teal-500', config: { testType: 'pyq_year', totalQuestions: 30, duration: 40 } }
];

// ==========================================
// MAIN COMPONENT
// ==========================================
const TestCreate = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const { createTest, generateRandomTest, loading } = useTest();
  const { questions: rawQuestions, fetchQuestions, loading: questionsLoading } = useQuestions();
  const toast = useToast();
  const { syllabus: syllabusData, refreshSyllabus, dataSource } = useSyllabus();

  const t = (hi, en) => language === 'hi' ? hi : en;

  // SAFE: ensure questions is always array
  const questions = Array.isArray(rawQuestions) ? rawQuestions : [];

  // --- State ---
  const [currentStep, setCurrentStep] = useState(0);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [createdTest, setCreatedTest] = useState(null);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [questionsPerUnit, setQuestionsPerUnit] = useState({});
  const [errors, setErrors] = useState({});
  const [testNumber, setTestNumber] = useState(1);

  const [formData, setFormData] = useState({
    testType: 'practice', title: '', description: '', duration: 60,
    totalQuestions: 50, marksPerQuestion: 2, negativeMarking: false,
    negativeMarks: 0.5, shuffleQuestions: true, status: 'active'
  });

  const [mainFilters, setMainFilters] = useState({
    papers: ['paper1'], units: [], chapters: [], topics: [], types: []
  });

  // Undo/Redo — with SAFETY wrapper
  const {
    current: rawSelectedQuestions,
    push: pushSelection,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
    reset: resetSelection
  } = useUndoRedo([]);

  // ALWAYS guarantee array
  const selectedQuestions = useMemo(() => {
    return Array.isArray(rawSelectedQuestions) ? rawSelectedQuestions : [];
  }, [rawSelectedQuestions]);

  // --- Syllabus ---
  useEffect(() => { refreshSyllabus(); }, []);

  const getSyllabus = useCallback((paper) => {
    if (!syllabusData) return { units: [] };
    return syllabusData[paper] || { units: [] };
  }, [syllabusData]);

  const getUnitOptions = useCallback((papers) => {
    const opts = [];
    const paperList = Array.isArray(papers) && papers.length > 0 ? papers : ['paper1', 'paper2'];
    paperList.forEach(paper => {
      const s = getSyllabus(paper);
      if (!s || !Array.isArray(s.units)) return;
      s.units.forEach(unit => {
        opts.push({
          value: `${paper}_${unit.id}`,
          label: `${paper === 'paper1' ? 'P1' : 'P2'}: ${t(unit.nameHi, unit.name)}`,
          shortName: (t(unit.nameHi, unit.name) || '').replace(/^(UNIT|इकाई)\s*[IVX\d]+:\s*/i, '').trim(),
          unitId: unit.id, paper
        });
      });
    });
    return opts;
  }, [language, getSyllabus]);

  const getChapterOptions = useCallback((units, papers) => {
    const opts = [];
    const paperList = Array.isArray(papers) && papers.length > 0 ? papers : ['paper1', 'paper2'];
    const unitList = Array.isArray(units) ? units : [];
    paperList.forEach(paper => {
      const s = getSyllabus(paper);
      if (!s || !Array.isArray(s.units)) return;
      s.units.forEach(unit => {
        const uk = `${paper}_${unit.id}`;
        if (unitList.length === 0 || unitList.includes(uk)) {
          (unit.chapters || []).forEach(ch => {
            opts.push({
              value: `${paper}_${unit.id}_${ch.id}`,
              label: t(ch.nameHi, ch.name),
              shortName: t(ch.nameHi, ch.name),
              unitId: unit.id, chapterId: ch.id, paper
            });
          });
        }
      });
    });
    return opts;
  }, [language, getSyllabus]);

  const getTopicOptions = useCallback((chapters, units, papers) => {
    const opts = [];
    const paperList = Array.isArray(papers) && papers.length > 0 ? papers : ['paper1', 'paper2'];
    const unitList = Array.isArray(units) ? units : [];
    const chapterList = Array.isArray(chapters) ? chapters : [];
    paperList.forEach(paper => {
      const s = getSyllabus(paper);
      if (!s || !Array.isArray(s.units)) return;
      s.units.forEach(unit => {
        const uk = `${paper}_${unit.id}`;
        if (unitList.length === 0 || unitList.includes(uk)) {
          (unit.chapters || []).forEach(ch => {
            const ck = `${paper}_${unit.id}_${ch.id}`;
            if (chapterList.length === 0 || chapterList.includes(ck)) {
              (ch.topics || []).forEach(topic => {
                if (!opts.find(o => o.value === topic.name)) {
                  opts.push({
                    value: topic.name,
                    label: t(topic.nameHi, topic.name),
                    shortName: t(topic.nameHi, topic.name)
                  });
                }
              });
            }
          });
        }
      });
    });
    return opts;
  }, [language, getSyllabus]);

  const getTypeOptions = useCallback(() =>
    Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => ({ value: k, label: t(v.hi, v.en) })),
    [language]
  );

  const getAllUnits = useCallback(() => {
    const all = [];
    const paperList = Array.isArray(mainFilters.papers) && mainFilters.papers.length > 0 ? mainFilters.papers : ['paper1'];
    paperList.forEach(paper => {
      const s = getSyllabus(paper);
      if (!s || !Array.isArray(s.units)) return;
      s.units.forEach(unit => {
        all.push({
          ...unit, paper,
          key: `${paper}_${unit.id}`,
          paperName: paper === 'paper1' ? 'Paper 1' : 'Paper 2',
          paperNameHi: paper === 'paper1' ? 'पेपर 1' : 'पेपर 2'
        });
      });
    });
    return all;
  }, [mainFilters.papers, getSyllabus]);

  // --- Effects ---
  useEffect(() => {
    const cfg = TEST_TYPE_CONFIG[formData.testType];
    if (cfg) {
      setFormData(p => ({
        ...p,
        duration: cfg.defaultDuration,
        totalQuestions: cfg.defaultQuestions,
        marksPerQuestion: cfg.marksPerQuestion || 2,
        negativeMarking: cfg.negativeMarking || false,
        negativeMarks: cfg.negativeMarks || 0.5
      }));
      const isFull = ['full_mock_p1', 'full_mock_p2', 'full_mock_combined'].includes(formData.testType);
      setIsRandomMode(isFull);
      if (isFull) {
        if (formData.testType === 'full_mock_p1') setMainFilters(p => ({ ...p, papers: ['paper1'] }));
        else if (formData.testType === 'full_mock_p2') setMainFilters(p => ({ ...p, papers: ['paper2'] }));
        else setMainFilters(p => ({ ...p, papers: ['paper1', 'paper2'] }));
      }
    }
  }, [formData.testType]);

  useEffect(() => { setTestNumber(Math.floor(Math.random() * 100) + 1); }, [formData.testType, mainFilters]);

  useEffect(() => {
    if (!isRandomMode) return;
    const dist = {};
    const units = getAllUnits();
    const total = formData.totalQuestions || 50;
    const per = Math.floor(total / (units.length || 1));
    const rem = total % (units.length || 1);
    units.forEach((u, i) => { dist[u.key] = per + (i < rem ? 1 : 0); });
    setQuestionsPerUnit(dist);
  }, [isRandomMode, mainFilters.papers, formData.totalQuestions, getAllUnits]);

  useEffect(() => {
    if (showQuestionModal) {
      const apiFilters = { limit: 200, sort: '-createdAt' };
      if (mainFilters.papers && mainFilters.papers.length > 0) apiFilters.paper = mainFilters.papers;
      if (mainFilters.types && mainFilters.types.length > 0) apiFilters.questionType = mainFilters.types;
      fetchQuestions(apiFilters);
    }
  }, [showQuestionModal]);

  // --- Handlers ---
  const handleChange = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  };

  const updateMainFilter = (field, value) => {
    setMainFilters(p => {
      const n = { ...p, [field]: value };
      if (field === 'papers') { n.units = []; n.chapters = []; n.topics = []; }
      else if (field === 'units') { n.chapters = []; n.topics = []; }
      else if (field === 'chapters') { n.topics = []; }
      return n;
    });
  };

  const toggleQuestion = (q) => {
    if (!q || !q._id) return;
    const exists = selectedQuestions.some(s => s._id === q._id);
    const next = exists ? selectedQuestions.filter(s => s._id !== q._id) : [...selectedQuestions, q];
    pushSelection(next);
  };

  const clearAllQuestions = () => pushSelection([]);

  const selectAllFilteredQuestions = (filtered) => {
    const safeFiltered = Array.isArray(filtered) ? filtered : [];
    const newQ = safeFiltered.filter(q => q && q._id && !selectedQuestions.some(s => s._id === q._id));
    pushSelection([...selectedQuestions, ...newQ]);
  };

  const getTotalDistributed = () => {
    if (!questionsPerUnit || typeof questionsPerUnit !== 'object') return 0;
    return Object.values(questionsPerUnit).reduce((s, v) => s + (parseInt(v) || 0), 0);
  };

  const handleQuestionsPerUnitChange = (key, val) => {
    setQuestionsPerUnit(p => ({ ...p, [key]: Math.max(0, parseInt(val) || 0) }));
  };

  const distributeEqually = () => {
    const units = getAllUnits();
    if (units.length === 0) return;
    const total = formData.totalQuestions || 50;
    const per = Math.floor(total / units.length);
    const rem = total % units.length;
    const d = {};
    units.forEach((u, i) => { d[u.key] = per + (i < rem ? 1 : 0); });
    setQuestionsPerUnit(d);
  };

  // --- Title ---
  const generateAutoTitle = useCallback(() => {
    const sc = TEST_TYPE_CONFIG[formData.testType]?.shortCode || 'TEST';
    const papers = Array.isArray(mainFilters.papers) ? mainFilters.papers : ['paper1'];
    const ps = papers.length === 2 ? 'P1+P2' : papers[0] === 'paper1' ? 'P1' : 'P2';
    return `${ps} - ${sc} #${testNumber}`;
  }, [formData.testType, mainFilters.papers, testNumber]);

  const generatedTitle = useMemo(() => {
    return (formData.title && formData.title.trim()) ? formData.title : generateAutoTitle();
  }, [formData.title, generateAutoTitle]);

  const copyTitle = async () => {
    try {
      await navigator.clipboard.writeText(generatedTitle);
      toast.success(t('कॉपी हुआ!', 'Copied!'));
    } catch {
      toast.error(t('कॉपी विफल', 'Copy failed'));
    }
  };

  // --- Navigation ---
  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return Array.isArray(mainFilters.papers) && mainFilters.papers.length > 0;
      case 2: return isRandomMode || selectedQuestions.length > 0;
      case 3: return formData.duration > 0;
      default: return true;
    }
  };

  const nextStep = () => { if (canProceed() && currentStep < STEPS.length - 1) setCurrentStep(p => p + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); };
  const goToStep = (i) => { if (i <= currentStep) setCurrentStep(i); };

  // --- Keyboard ---
  useEffect(() => {
    const handle = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); }
      if (e.key === 'Escape') {
        if (showQuestionModal) setShowQuestionModal(false);
        if (showKeyboardHelp) setShowKeyboardHelp(false);
      }
      if (e.key === 'ArrowRight' && !showQuestionModal && !isInput) { e.preventDefault(); nextStep(); }
      if (e.key === 'ArrowLeft' && !showQuestionModal && !isInput) { e.preventDefault(); prevStep(); }
      if ((e.key === 'a' || e.key === 'A') && !isInput && currentStep === 2) { e.preventDefault(); setShowQuestionModal(true); }
      if (e.key === '?') { e.preventDefault(); setShowKeyboardHelp(true); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [currentStep, showQuestionModal, showKeyboardHelp]);

  // --- Submit ---
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isRandomMode && selectedQuestions.length === 0) {
      toast.error(t('प्रश्न चुनें', 'Select questions'));
      return;
    }
    if (formData.duration < 1) {
      toast.error(t('अवधि डालें', 'Enter duration'));
      return;
    }

    try {
      const papers = Array.isArray(mainFilters.papers) ? mainFilters.papers : ['paper1'];
      const paper = papers.length === 2 ? 'combined' : papers[0] || 'paper1';
      const title = (formData.title && formData.title.trim()) ? formData.title.trim() : generateAutoTitle();
      const unitNames = getUnitNamesFromKeys(mainFilters.units || [], language);
      const chapterNames = getChapterNamesFromKeys(mainFilters.chapters || [], language);
      const topicNames = getTopicNamesFromKeys(mainFilters.topics || []);

      let response;
      if (isRandomMode) {
        response = await generateRandomTest({
          ...formData, paper, title,
          unit: unitNames, chapter: chapterNames, topic: topicNames,
          questionsPerUnit, totalQuestions: getTotalDistributed()
        });
      } else {
        response = await createTest({
          ...formData, paper, title,
          unit: unitNames, chapter: chapterNames, topic: topicNames,
          questions: selectedQuestions.map(q => q._id),
          totalQuestions: selectedQuestions.length
        });
      }
      toast.success(t('परीक्षा बनाई गई!', 'Test created!'));
      setCreatedTest(response.data || response);
      setCurrentStep(STEPS.length - 1);
    } catch (err) {
      toast.error(err?.message || t('त्रुटि', 'Error'));
    }
  };

  const applyTemplate = (tpl) => {
    if (!tpl || !tpl.config) return;
    setFormData(p => ({ ...p, ...tpl.config }));
    toast.success(t(`${tpl.nameHi} लागू`, `${tpl.name} applied`));
  };

  // --- Computed values (SAFE) ---
  const qCount = isRandomMode ? getTotalDistributed() : selectedQuestions.length;
  const totalMarks = qCount * (formData.marksPerQuestion || 2);

  // ==========================================
  // RENDER STEPS
  // ==========================================
  const renderStep = () => {
    switch (currentStep) {
      case 0: // TEST TYPE
        return (
          <div className="space-y-8">
            <GlassCard gradient glow animate>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30"><Rocket className="w-7 h-7 text-white" /></div>
                <div><h3 className="font-black text-xl text-gray-900 dark:text-white">{t('त्वरित टेम्पलेट', 'Quick Templates')}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{t('एक क्लिक में शुरू', 'Start with one click')}</p></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {QUICK_TEMPLATES.map(tpl => <QuickTemplateCard key={tpl.id} template={tpl} onClick={() => applyTemplate(tpl)} language={language} isActive={formData.testType === tpl.config.testType} />)}
              </div>
            </GlassCard>
            <GlassCard animate>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/30"><Layers className="w-7 h-7 text-white" /></div>
                  <div><h3 className="font-black text-xl text-gray-900 dark:text-white">{t('परीक्षा प्रकार', 'Test Type')}</h3></div>
                </div>
                <div className="flex items-center gap-4 px-5 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <Shuffle className={`w-5 h-5 ${isRandomMode ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('रैंडम', 'Random')}</span>
                  <button type="button" onClick={() => setIsRandomMode(!isRandomMode)} className={`w-14 h-7 rounded-full transition-all duration-300 relative shadow-inner ${isRandomMode ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${isRandomMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(TEST_TYPE_CONFIG).map(([k, c]) => <TestTypeCard key={k} typeKey={k} config={c} isSelected={formData.testType === k} onClick={() => handleChange('testType', k)} language={language} />)}
              </div>
            </GlassCard>
          </div>
        );

      case 1: // FILTERS
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GlassCard animate>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl"><Filter className="w-7 h-7 text-white" /></div>
                  <div><h3 className="font-black text-xl text-gray-900 dark:text-white">{t('फ़िल्टर', 'Filters')}</h3></div>
                </div>
                <div className="mb-6">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" />{t('पेपर', 'Paper')} *</label>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {Object.entries(PAPER_LABELS).map(([k, l]) => (
                      <button key={k} type="button" onClick={() => {
                        const papers = Array.isArray(mainFilters.papers) ? mainFilters.papers : [];
                        const ps = papers.includes(k) ? papers.filter(p => p !== k) : [...papers, k];
                        if (ps.length > 0) updateMainFilter('papers', ps);
                      }}
                        className={`p-5 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-3 ${(mainFilters.papers || []).includes(k) ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 shadow-lg' : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300 bg-white dark:bg-gray-800'}`}>
                        {(mainFilters.papers || []).includes(k) && <CheckCircle2 className="w-5 h-5" />}{t(l.hi, l.en)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <EnhancedMultiSelect label="Unit" labelHi="इकाई" options={getUnitOptions(mainFilters.papers)} selected={mainFilters.units || []} onChange={v => updateMainFilter('units', v)} showSearch icon={Target} language={language} colorScheme="blue" />
                  <EnhancedMultiSelect label="Chapter" labelHi="अध्याय" options={getChapterOptions(mainFilters.units, mainFilters.papers)} selected={mainFilters.chapters || []} onChange={v => updateMainFilter('chapters', v)} disabled={!(mainFilters.units || []).length} showSearch language={language} colorScheme="green" />
                  <EnhancedMultiSelect label="Topic" labelHi="विषय" options={getTopicOptions(mainFilters.chapters, mainFilters.units, mainFilters.papers)} selected={mainFilters.topics || []} onChange={v => updateMainFilter('topics', v)} disabled={!(mainFilters.chapters || []).length} showSearch language={language} colorScheme="purple" />
                  <EnhancedMultiSelect label="Question Type" labelHi="प्रश्न प्रकार" options={getTypeOptions()} selected={mainFilters.types || []} onChange={v => updateMainFilter('types', v)} language={language} colorScheme="orange" />
                </div>
              </GlassCard>
            </div>
            <TitleGenerator formData={formData} mainFilters={mainFilters} testNumber={testNumber} language={language} onTitleChange={v => handleChange('title', v)} getUnitOptions={getUnitOptions} getChapterOptions={getChapterOptions} getTopicOptions={getTopicOptions} />
          </div>
        );

      case 2: // QUESTIONS
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GlassCard animate>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl"><FileText className="w-7 h-7 text-white" /></div>
                    <div><h3 className="font-black text-xl text-gray-900 dark:text-white">{isRandomMode ? t('रैंडम वितरण', 'Random Distribution') : t('प्रश्न चुनें', 'Select Questions')}</h3></div>
                  </div>
                  {!isRandomMode && (
                    <button type="button" onClick={() => setShowQuestionModal(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-xl font-bold">
                      <Plus className="w-5 h-5" />{t('प्रश्न जोड़ें', 'Add Questions')}
                    </button>
                  )}
                </div>
                {isRandomMode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">{t('कुल:', 'Total:')} {getTotalDistributed()} / {formData.totalQuestions}</span>
                      <button type="button" onClick={distributeEqually} className="text-sm text-amber-700 font-bold flex items-center gap-1.5"><RotateCcw className="w-4 h-4" />{t('समान', 'Equal')}</button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                      {getAllUnits().map(unit => (
                        <div key={unit.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 rounded-lg font-bold">{t(unit.paperNameHi, unit.paperName)}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{t(unit.nameHi, unit.name)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => handleQuestionsPerUnitChange(unit.key, (questionsPerUnit[unit.key] || 0) - 1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 font-bold">-</button>
                            <input type="number" value={questionsPerUnit[unit.key] || 0} onChange={e => handleQuestionsPerUnitChange(unit.key, e.target.value)} className="w-16 text-center px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-xl font-bold bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" />
                            <button type="button" onClick={() => handleQuestionsPerUnitChange(unit.key, (questionsPerUnit[unit.key] || 0) + 1)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 font-bold">+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <SelectedQuestionsPanel questions={selectedQuestions} onRemove={toggleQuestion} onClear={clearAllQuestions}
                    onReorder={newOrder => pushSelection(Array.isArray(newOrder) ? newOrder : [])} language={language} marksPerQuestion={formData.marksPerQuestion || 2}
                    onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} />
                )}
              </GlassCard>
            </div>
            <div className="space-y-4">
              {selectedQuestions.length > 0 && !isRandomMode && <DifficultyChart questions={selectedQuestions} language={language} />}
              {selectedQuestions.length > 0 && !isRandomMode && <TestQualityIndicator questions={selectedQuestions} language={language} formData={formData} />}
              <GlassCard>
                <h5 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary-600" />{t('सारांश', 'Summary')}</h5>
                <div className="space-y-4">
                  {[
                    { label: t('प्रश्न', 'Questions'), value: qCount, color: 'primary' },
                    { label: t('कुल अंक', 'Total Marks'), value: totalMarks, color: 'green' },
                    { label: t('अवधि', 'Duration'), value: formData.duration || 0, suffix: 'm', color: 'blue' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                      <span className="text-xl font-black"><AnimatedCounter value={item.value} suffix={item.suffix} color={item.color} /></span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        );

      case 3: // SETTINGS
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard animate>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-xl"><Settings className="w-7 h-7 text-white" /></div>
                <div><h3 className="font-black text-xl text-gray-900 dark:text-white">{t('सेटिंग्स', 'Settings')}</h3></div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{t('अवधि (मिनट)', 'Duration (min)')} *</label>
                  <input type="number" value={formData.duration} onChange={e => handleChange('duration', parseInt(e.target.value) || 0)} min="1" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-bold mt-2" />
                  <div className="flex gap-2 mt-3">
                    {[15, 30, 45, 60, 90, 120].map(m => (
                      <button key={m} type="button" onClick={() => handleChange('duration', m)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${formData.duration === m ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200'}`}>{m}m</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-gray-400" />{t('प्रति प्रश्न अंक', 'Marks/Q')}</label>
                  <input type="number" value={formData.marksPerQuestion} onChange={e => handleChange('marksPerQuestion', parseFloat(e.target.value) || 0)} min="0" step="0.5" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mt-2" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2"><MinusCircle className="w-4 h-4 text-gray-400" />{t('नकारात्मक अंकन', 'Negative Marking')}</label>
                  <div className="flex items-center gap-4 mt-2">
                    {[false, true].map(val => (
                      <button key={String(val)} type="button" onClick={() => handleChange('negativeMarking', val)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold transition-all ${formData.negativeMarking === val ? (val ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700' : 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700') : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300'}`}>
                        {val ? t('हां', 'Yes') : t('नहीं', 'No')}
                      </button>
                    ))}
                  </div>
                  {formData.negativeMarking && <input type="number" value={formData.negativeMarks} onChange={e => handleChange('negativeMarks', parseFloat(e.target.value) || 0)} min="0" step="0.25" className="w-full px-4 py-3 border-2 border-red-200 dark:border-red-800 rounded-xl focus:ring-4 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mt-3" />}
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3"><Shuffle className="w-5 h-5 text-gray-400" /><p className="font-bold text-gray-700 dark:text-gray-200">{t('शफल', 'Shuffle')}</p></div>
                  <button type="button" onClick={() => handleChange('shuffleQuestions', !formData.shuffleQuestions)} className={`w-14 h-7 rounded-full transition-all relative ${formData.shuffleQuestions ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${formData.shuffleQuestions ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </GlassCard>
            <GlassCard gradient animate>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl"><Lightbulb className="w-7 h-7 text-white" /></div>
                <div><h3 className="font-black text-xl text-gray-900 dark:text-white">{t('पूर्वावलोकन', 'Preview')}</h3></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard icon={FileText} label={t('प्रश्न', 'Questions')} value={qCount} gradient="primary" compact />
                <StatCard icon={Award} label={t('कुल अंक', 'Total Marks')} value={totalMarks} gradient="green" compact />
              </div>
              <div className="space-y-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                {[
                  { l: t('प्रति Q अंक', 'Marks/Q'), v: `+${formData.marksPerQuestion || 2}` },
                  ...(formData.negativeMarking ? [{ l: t('गलत उत्तर', 'Wrong'), v: `-${formData.negativeMarks || 0.5}`, red: true }] : []),
                  { l: t('अवधि', 'Duration'), v: `${formData.duration || 60} ${t('मिनट', 'min')}` },
                  { l: t('प्रति Q समय', 'Time/Q'), v: `${((((formData.duration || 60) * 60) / (qCount || 1))).toFixed(1)}s`, blue: true }
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{r.l}</span>
                    <span className={`font-bold ${r.red ? 'text-red-600' : r.blue ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        );

      case 4: // REVIEW
        return (
          <div className="space-y-6">
            <GlassCard gradient glow animate>
              <EnhancedTitlePreview title={generatedTitle} testType={formData.testType} language={language} onCopy={copyTitle} onEdit={() => setCurrentStep(1)} />
            </GlassCard>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard icon={FileText} label={t('प्रश्न', 'Questions')} value={qCount} gradient="primary" />
              <StatCard icon={Clock} label={t('अवधि', 'Duration')} value={formData.duration || 60} suffix="m" gradient="green" />
              <StatCard icon={Award} label={t('कुल अंक', 'Marks')} value={totalMarks} gradient="blue" />
              <StatCard icon={BookOpen} label={t('पेपर', 'Paper')} value={(mainFilters.papers || []).length === 2 ? 'P1+P2' : (mainFilters.papers || ['paper1'])[0] === 'paper1' ? 'P1' : 'P2'} gradient="purple" />
              <StatCard icon={MinusCircle} label={t('नेगेटिव', 'Negative')} value={formData.negativeMarking ? `-${formData.negativeMarks || 0.5}` : '0'} gradient="red" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary-600" />{t('कॉन्फ़िग', 'Config')}</h4>
                <div className="space-y-3">
                  {[
                    { l: t('प्रकार', 'Type'), v: TEST_TYPE_CONFIG[formData.testType]?.shortCode || 'TEST' },
                    { l: t('मोड', 'Mode'), v: isRandomMode ? t('रैंडम', 'Random') : t('मैन्युअल', 'Manual') },
                    { l: t('शफल', 'Shuffle'), v: formData.shuffleQuestions ? t('हां', 'Yes') : t('नहीं', 'No') }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-gray-500">{item.l}</span><span className="font-bold text-gray-900 dark:text-white">{item.v}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard>
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-primary-600" />{t('फ़िल्टर', 'Filters')}</h4>
                <div className="flex flex-wrap gap-2">
                  {(mainFilters.papers || []).map(p => <span key={p} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold">{p === 'paper1' ? 'Paper 1' : 'Paper 2'}</span>)}
                  {(mainFilters.units || []).slice(0, 3).map(u => <span key={u} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">{getUnitOptions(mainFilters.papers).find(o => o.value === u)?.shortName || u}</span>)}
                  {(mainFilters.units || []).length > 3 && <span className="px-3 py-1.5 bg-blue-50 text-blue-500 rounded-full text-xs font-bold">+{(mainFilters.units || []).length - 3}</span>}
                </div>
              </GlassCard>
            </div>
          </div>
        );

      case 5: // COMPLETE
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-8 relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/40 animate-pulse"><CheckCircle2 className="w-12 h-12 text-white" /></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce"><Sparkles className="w-4 h-4 text-white" /></div>
              </div>
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 text-center">{t('बधाई हो!', 'Congratulations!')}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 text-center">{t('परीक्षा सफलतापूर्वक बनाई गई', 'Test created successfully!')}</p>
            </div>
            {createdTest && (
              <GlassCard>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">{createdTest.title || generatedTitle}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard icon={FileText} label={t('प्रश्न', 'Q')} value={createdTest.totalQuestions || qCount} gradient="primary" compact />
                  <StatCard icon={Clock} label={t('अवधि', 'Time')} value={formData.duration || 60} suffix="m" gradient="blue" compact />
                  <StatCard icon={Award} label={t('अंक', 'Marks')} value={(createdTest.totalQuestions || qCount) * (formData.marksPerQuestion || 2)} gradient="green" compact />
                  <StatCard icon={Target} label="ID" value={createdTest._id ? createdTest._id.slice(-8) : '---'} gradient="purple" compact />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button type="button" onClick={() => createdTest._id && navigate(`/take-test/${createdTest._id}`)} className="p-4 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-xl hover:shadow-xl font-bold flex items-center justify-center gap-2"><Play className="w-5 h-5" />{t('परीक्षा लें', 'Take Test')}</button>
                  <button type="button" onClick={() => createdTest._id && navigate(`/tests/${createdTest._id}`)} className="p-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl hover:shadow-xl font-bold flex items-center justify-center gap-2"><Eye className="w-5 h-5" />{t('विवरण', 'Details')}</button>
                  <button type="button" onClick={() => { if (createdTest._id) { navigator.clipboard.writeText(createdTest._id); toast.success(t('ID कॉपी', 'ID copied')); } }} className="p-4 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl hover:shadow-xl font-bold flex items-center justify-center gap-2"><Copy className="w-5 h-5" />{t('ID कॉपी', 'Copy ID')}</button>
                  <button type="button" onClick={() => { setCreatedTest(null); setCurrentStep(0); setFormData({ testType: 'practice', title: '', description: '', duration: 60, totalQuestions: 50, marksPerQuestion: 2, negativeMarking: false, negativeMarks: 0.5, shuffleQuestions: true, status: 'active' }); resetSelection([]); }}
                    className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-xl font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" />{t('नई परीक्षा', 'New Test')}</button>
                </div>
              </GlassCard>
            )}
          </div>
        );

      default: return null;
    }
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/tests')} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                {t('नई परीक्षा बनाएं', 'Create New Test')}
                <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-xs rounded-full font-bold shadow-lg">PRO</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('स्टेप बाय स्टेप', 'Step by step')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowKeyboardHelp(true)} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all" title="Shortcuts">
              <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-black shadow-lg">{currentStep + 1}</div>
              <div>
                <p className="text-xs text-gray-500">{t('चरण', 'Step')} {currentStep + 1}/{STEPS.length}</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{t(STEPS[currentStep].labelHi, STEPS[currentStep].label)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-10">
          <StepIndicator steps={STEPS} currentStep={currentStep} onStepClick={goToStep} language={language} />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="mb-8">{renderStep()}</div>
          <NavigationFooter
            currentStep={currentStep} totalSteps={STEPS.length}
            onPrev={prevStep} onNext={nextStep} onSubmit={handleSubmit}
            canProceed={canProceed()} language={language} loading={loading}
            questionCount={qCount} duration={formData.duration || 60} totalMarks={totalMarks}
          />
        </form>
      </div>

      {/* Modals */}
      <KeyboardShortcutsHelp isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} language={language} />
      <QuestionLibraryModal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)}
        questions={questions} questionsLoading={questionsLoading}
        selectedQuestions={selectedQuestions} onToggleQuestion={toggleQuestion}
        onSelectAll={() => selectAllFilteredQuestions(questions)}
        onSelectAllFiltered={selectAllFilteredQuestions}
        onClearAll={clearAllQuestions}
        onApplyFilters={async f => { await fetchQuestions({ limit: 200, sort: '-createdAt', ...f }); }}
        language={language} marksPerQuestion={formData.marksPerQuestion || 2}
        getUnitOptions={getUnitOptions} getChapterOptions={getChapterOptions}
        getTopicOptions={getTopicOptions} getTypeOptions={getTypeOptions}
        mainFilters={mainFilters}
      />
      <FloatingActionButton onClick={() => setShowKeyboardHelp(true)} icon={HelpCircle} label={t('सहायता', 'Help')} />
    </div>
  );
};

export default TestCreate;