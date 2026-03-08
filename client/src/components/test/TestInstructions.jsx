import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Clock, FileText, AlertTriangle, CheckCircle, Target,
  Eye, Lock, Monitor, Keyboard, Info, ChevronLeft, ArrowRight,
  BookOpen, Award, Zap, Flame, Star, Crown, Trophy, Medal,
  Layers, CircleDot, Hash, RotateCcw, Maximize, HelpCircle,
  GraduationCap, Timer, PenTool, Calculator, StickyNote,
  ChevronDown, Sparkles, Play, CircleCheck, Ban, BookMarked,
} from 'lucide-react';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';
import { formatDuration } from '../../utils/helpers';

const TestInstructions = ({ test, onStart, onCancel, language = 'hi', onLanguageChange }) => {
  const [agreed, setAgreed] = useState(false);
  const [currentTab, setCurrentTab] = useState('instructions');
  const [countdown, setCountdown] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  const typeConfig = TEST_TYPE_CONFIG[test.testType] || {};
  const paperLabel = PAPER_LABELS[test.paper] || {};
  const totalMarks = test.totalQuestions * (test.marksPerQuestion || 2);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      onStart();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onStart]);

  const handleStart = useCallback(() => {
    if (!agreed) return;
    setCountdown(3);
  }, [agreed]);

  const t = useCallback((hi, en) => language === 'hi' ? hi : en, [language]);

  const instructions = [
    {
      icon: FileText,
      text: t(
        `इस परीक्षा में कुल <strong>${test.totalQuestions}</strong> प्रश्न हैं।`,
        `This test contains a total of <strong>${test.totalQuestions}</strong> questions.`
      ),
      accent: '#3b82f6'
    },
    {
      icon: Timer,
      text: t(
        `समय सीमा: <strong>${test.duration} मिनट</strong>। शुरू होने के बाद टाइमर रुकेगा नहीं।`,
        `Time limit: <strong>${test.duration} minutes</strong>. Timer cannot be paused once started.`
      ),
      accent: '#f59e0b'
    },
    {
      icon: Award,
      text: t(
        `प्रत्येक सही उत्तर पर <strong>${test.marksPerQuestion || 2} अंक</strong> मिलेंगे। कुल अंक: <strong>${totalMarks}</strong>`,
        `Each correct answer carries <strong>${test.marksPerQuestion || 2} marks</strong>. Total marks: <strong>${totalMarks}</strong>`
      ),
      accent: '#8b5cf6'
    },
    {
      icon: test.negativeMarking ? AlertTriangle : Shield,
      text: test.negativeMarking
        ? t(
            `<strong>नकारात्मक अंकन:</strong> प्रत्येक गलत उत्तर पर <strong>${test.negativeMarks} अंक</strong> काटे जाएंगे।`,
            `<strong>Negative Marking:</strong> <strong>${test.negativeMarks} marks</strong> will be deducted for each wrong answer.`
          )
        : t(
            `<strong>कोई नकारात्मक अंकन नहीं:</strong> गलत उत्तर पर अंक नहीं कटेंगे।`,
            `<strong>No Negative Marking:</strong> No marks will be deducted for wrong answers.`
          ),
      accent: test.negativeMarking ? '#ef4444' : '#10b981'
    },
    {
      icon: Target,
      text: t(
        'सभी प्रश्न <strong>बहुविकल्पीय (MCQ)</strong> हैं। प्रत्येक प्रश्न के <strong>चार विकल्प</strong> हैं।',
        'All questions are <strong>Multiple Choice (MCQ)</strong>. Each question has <strong>four options</strong>.'
      ),
      accent: '#6366f1'
    },
    {
      icon: CheckCircle,
      text: t(
        'उत्तर चुनने के बाद <strong>"Save & Next"</strong> बटन पर क्लिक करें।',
        'After selecting an answer, click <strong>"Save & Next"</strong> button.'
      ),
      accent: '#14b8a6'
    },
    {
      icon: BookMarked,
      text: t(
        '<strong>"Mark for Review"</strong> बटन से किसी भी प्रश्न को बाद में देखने के लिए चिह्नित करें।',
        'Use <strong>"Mark for Review"</strong> button to flag any question for later review.'
      ),
      accent: '#a855f7'
    },
    {
      icon: Lock,
      text: t(
        'परीक्षा समाप्त करने के लिए <strong>"Submit Test"</strong> बटन दबाएं।',
        'Press <strong>"Submit Test"</strong> button to finish the exam.'
      ),
      accent: '#f97316'
    },
    {
      icon: Calculator,
      text: t(
        'ऑन-स्क्रीन <strong>कैलकुलेटर</strong> और <strong>नोटपैड</strong> टूलबार में उपलब्ध हैं।',
        'On-screen <strong>Calculator</strong> and <strong>Notepad</strong> are available in the toolbar.'
      ),
      accent: '#64748b'
    },
  ];

  const paletteItems = [
    {
      num: '1',
      bg: 'bg-slate-300 dark:bg-slate-600',
      ring: '',
      label: t('नहीं देखा', 'Not Visited'),
      desc: t('प्रश्न अभी तक नहीं खोला गया', 'Question has not been opened yet'),
      textColor: 'text-slate-700 dark:text-slate-200'
    },
    {
      num: '2',
      bg: 'bg-red-500',
      ring: '',
      label: t('बिना उत्तर', 'Not Answered'),
      desc: t('खोला गया लेकिन कोई उत्तर नहीं चुना', 'Opened but no answer selected'),
      textColor: 'text-white'
    },
    {
      num: '3',
      bg: 'bg-emerald-500',
      ring: '',
      label: t('उत्तर दिया', 'Answered'),
      desc: t('उत्तर सफलतापूर्वक सेव किया गया', 'Answer has been saved successfully'),
      textColor: 'text-white'
    },
    {
      num: '4',
      bg: 'bg-violet-500',
      ring: '',
      label: t('समीक्षा हेतु', 'Marked for Review'),
      desc: t('बाद में जांचने के लिए चिह्नित', 'Flagged to check again later'),
      textColor: 'text-white'
    },
    {
      num: '5',
      bg: 'bg-violet-500',
      ring: 'ring-[3px] ring-emerald-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800',
      label: t('उत्तर + समीक्षा', 'Answered & Marked'),
      desc: t('उत्तर दिया और समीक्षा के लिए भी चिह्नित', 'Answered and also flagged for review'),
      textColor: 'text-white'
    },
  ];

  const shortcuts = [
    { keys: ['←'], label: t('पिछला प्रश्न', 'Previous Question'), icon: ChevronLeft },
    { keys: ['→'], label: t('अगला प्रश्न', 'Next Question'), icon: ArrowRight },
    { keys: ['1', '2', '3', '4'], label: t('विकल्प चुनें', 'Select Option'), icon: CircleDot },
    { keys: ['S'], label: t('सेव और अगला', 'Save & Next'), icon: CheckCircle },
    { keys: ['M'], label: t('समीक्षा चिह्नित करें', 'Mark for Review'), icon: Eye },
    { keys: ['C'], label: t('उत्तर हटाएं', 'Clear Response'), icon: RotateCcw },
    { keys: ['F'], label: t('फुलस्क्रीन टॉगल', 'Toggle Fullscreen'), icon: Maximize },
    { keys: ['?'], label: t('शॉर्टकट दिखाएं', 'Show Shortcuts'), icon: HelpCircle },
  ];

  const grades = [
    { grade: 'A+', min: 90, bg: 'bg-emerald-500', icon: Crown, label: t('उत्कृष्ट', 'Outstanding'), bar: 'w-full' },
    { grade: 'A', min: 80, bg: 'bg-blue-500', icon: Trophy, label: t('बहुत अच्छा', 'Excellent'), bar: 'w-[88%]' },
    { grade: 'B+', min: 70, bg: 'bg-violet-500', icon: Medal, label: t('अच्छा', 'Good'), bar: 'w-[77%]' },
    { grade: 'B', min: 60, bg: 'bg-indigo-500', icon: Star, label: t('औसत से ऊपर', 'Above Average'), bar: 'w-[66%]' },
    { grade: 'C', min: 50, bg: 'bg-amber-500', icon: Flame, label: t('औसत', 'Average'), bar: 'w-[55%]' },
    { grade: 'D', min: 35, bg: 'bg-orange-500', icon: Zap, label: t('सुधार करें', 'Needs Improvement'), bar: 'w-[38%]' },
    { grade: 'F', min: 0, bg: 'bg-red-500', icon: AlertTriangle, label: t('अभ्यास करें', 'Practice More'), bar: 'w-[15%]' },
  ];

  const faqs = [
    {
      q: t('क्या मैं बीच में परीक्षा छोड़ सकता हूं?', 'Can I leave the exam in between?'),
      a: t('हां, आप कभी भी Submit बटन दबाकर परीक्षा जमा कर सकते हैं। लेकिन टाइमर नहीं रुकेगा।', 'Yes, you can submit the test anytime using the Submit button. However, the timer will not pause.')
    },
    {
      q: t('क्या मैं पिछले प्रश्न पर वापस जा सकता हूं?', 'Can I go back to a previous question?'),
      a: t('हां, आप किसी भी समय किसी भी प्रश्न पर जा सकते हैं। प्रश्न पैलेट से क्लिक करें।', 'Yes, you can navigate to any question at any time using the question palette.')
    },
    {
      q: t('अगर इंटरनेट बंद हो जाए तो?', 'What if the internet disconnects?'),
      a: t('आपके उत्तर ऑटो-सेव होते हैं। इंटरनेट आने पर आप जारी रख सकते हैं।', 'Your answers are auto-saved. You can continue once the internet is restored.')
    },
    {
      q: t('क्या उत्तर बदल सकते हैं?', 'Can I change my answers?'),
      a: t('हां, Submit करने से पहले आप कभी भी अपना उत्तर बदल सकते हैं।', 'Yes, you can change your answer anytime before submitting the test.')
    },
  ];

  const tabConfig = [
    { id: 'instructions', icon: Info, label: t('निर्देश', 'Instructions') },
    { id: 'palette', icon: Layers, label: t('पैलेट', 'Palette') },
    { id: 'shortcuts', icon: Keyboard, label: t('शॉर्टकट', 'Shortcuts') },
    { id: 'grading', icon: Award, label: t('ग्रेडिंग', 'Grading') },
    { id: 'faq', icon: HelpCircle, label: t('FAQ', 'FAQ') },
  ];

  // ── Countdown Overlay ──
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 overflow-hidden">
        {/* Background pulse rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-blue-500/[0.08]"
              style={{
                width: `${(i + 1) * 250}px`,
                height: `${(i + 1) * 250}px`,
                animation: `ping ${3 + i * 0.5}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-violet-600/10 to-transparent rounded-tl-full" />

        <div className="relative text-center">
          {/* Outer glowing ring */}
          <div className="relative inline-flex items-center justify-center mb-10">
            <div className="absolute w-44 h-44 rounded-full bg-blue-500/10 animate-pulse" />
            <div className="absolute w-36 h-36 rounded-full bg-blue-500/5 border-2 border-blue-500/20" />

            {/* SVG progress ring */}
            <svg className="absolute w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="url(#countdownGradient)" strokeWidth="3"
                strokeDasharray={339.292}
                strokeDashoffset={339.292 * (1 - (3 - countdown) / 3)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Number */}
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <span
                key={countdown}
                className="text-6xl font-black text-white tabular-nums"
                style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                {countdown > 0 ? countdown : '✓'}
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            {countdown > 0
              ? t('परीक्षा शुरू हो रही है...', 'Exam Starting...')
              : t('शुभकामनाएं!', 'Good Luck!')}
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">{test.title}</p>

          {/* Bottom loading bar */}
          <div className="mt-10 w-64 mx-auto">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes scaleIn {
            0% { transform: scale(0.3); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-200 dark:selection:bg-blue-800">

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                  NETprep
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight hidden sm:block">
                  {t('UGC NET परीक्षा पोर्टल', 'UGC NET Exam Portal')}
                </p>
              </div>
            </div>

            {/* Center: Test info (desktop) */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/60 dark:border-blue-800/60">
                {typeConfig.shortCode || test.testType}
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {t(paperLabel.hi, paperLabel.en)}
              </span>
            </div>

            {/* Right: Language toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
              {[
                { code: 'hi', label: 'हिंदी' },
                { code: 'en', label: 'ENG' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange?.(lang.code)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all duration-150 ${
                    language === lang.code
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ── Hero Section ── */}
        <section
          className={`text-center mb-10 transition-all duration-700 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold mb-5 border border-blue-200/60 dark:border-blue-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            {t('मॉक टेस्ट', 'Mock Test')}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-6 max-w-3xl mx-auto">
            {test.title}
          </h2>

          {/* Stats pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: FileText, value: test.totalQuestions, unit: t('प्रश्न', 'Qs'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
              { icon: Clock, value: test.duration, unit: t('मिनट', 'min'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
              { icon: Award, value: totalMarks, unit: t('अंक', 'marks'), color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40' },
              {
                icon: test.negativeMarking ? AlertTriangle : Shield,
                value: test.negativeMarking ? `-${test.negativeMarks}` : '0',
                unit: t('नेगेटिव', 'negative'),
                color: test.negativeMarking ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                bg: test.negativeMarking ? 'bg-red-50 dark:bg-red-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'
              },
            ].map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 ${s.bg} rounded-xl px-4 py-2.5 border border-slate-200/60 dark:border-slate-800/60`}
              >
                <s.icon className={`w-4 h-4 ${s.color} flex-shrink-0`} />
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.unit}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Negative Marking Alert ── */}
        {test.negativeMarking && (
          <div
            className={`mb-8 transition-all duration-700 delay-100 ${
              animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="relative overflow-hidden bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 sm:p-6">
              {/* Accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />

              <div className="flex items-start gap-4 pl-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-300 text-sm mb-1">
                    {t('⚠️ नकारात्मक अंकन सक्रिय', '⚠️ Negative Marking Active')}
                  </h3>
                  <p
                    className="text-red-700/80 dark:text-red-400/80 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: t(
                        `प्रत्येक गलत उत्तर पर <strong>${test.negativeMarks} अंक</strong> काटे जाएंगे। अनिश्चित होने पर प्रश्न छोड़ना बेहतर है।`,
                        `<strong>${test.negativeMarks} marks</strong> will be deducted for each wrong answer. Skip if you are unsure.`
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Content Grid ── */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 transition-all duration-700 delay-200 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* ── Left Column: Tabs ── */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

              {/* Tab bar */}
              <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-none">
                {tabConfig.map(tab => {
                  const isActive = currentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentTab(tab.id)}
                      className={`relative flex items-center gap-1.5 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="p-5 sm:p-7 min-h-[450px]">

                {/* ─── Instructions ─── */}
                {currentTab === 'instructions' && (
                  <div key="instructions" className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-6">
                      <Info className="w-5 h-5 text-blue-500" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('महत्वपूर्ण निर्देश', 'Important Instructions')}
                      </h3>
                    </div>

                    <ol className="space-y-2.5">
                      {instructions.map((inst, i) => {
                        const Ic = inst.icon;
                        return (
                          <li key={i} className="flex items-start gap-3 group">
                            {/* Number + icon */}
                            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {i + 1}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: `${inst.accent}12` }}
                              >
                                <Ic className="w-4 h-4" style={{ color: inst.accent }} />
                              </div>
                              <p
                                className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5"
                                dangerouslySetInnerHTML={{ __html: inst.text }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                {/* ─── Palette ─── */}
                {currentTab === 'palette' && (
                  <div key="palette" className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('प्रश्न पैलेट गाइड', 'Question Palette Guide')}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-7 leading-relaxed">
                      {t(
                        'परीक्षा स्क्रीन पर दाईं ओर प्रश्न पैलेट दिखता है। प्रत्येक बटन का रंग उस प्रश्न की स्थिति बताता है।',
                        'The question palette appears on the right side of the exam screen. Each button color indicates the status of that question.'
                      )}
                    </p>

                    <div className="space-y-3">
                      {paletteItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className={`w-11 h-11 rounded-lg ${item.bg} ${item.ring} flex items-center justify-center ${item.textColor} font-bold text-base flex-shrink-0 shadow-sm`}>
                            {item.num}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Visual demo */}
                    <div className="mt-8 p-5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                        {t('पैलेट प्रीव्यू', 'Palette Preview')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 20 }, (_, i) => {
                          const colors = ['bg-slate-300 dark:bg-slate-600', 'bg-red-500', 'bg-emerald-500', 'bg-violet-500', 'bg-emerald-500', 'bg-red-500', 'bg-slate-300 dark:bg-slate-600', 'bg-emerald-500'];
                          const textColors = ['text-slate-700 dark:text-slate-200', 'text-white', 'text-white', 'text-white', 'text-white', 'text-white', 'text-slate-700 dark:text-slate-200', 'text-white'];
                          const ci = i % colors.length;
                          return (
                            <div
                              key={i}
                              className={`w-9 h-9 rounded-lg ${colors[ci]} ${textColors[ci]} flex items-center justify-center text-xs font-bold shadow-sm`}
                            >
                              {i + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Shortcuts ─── */}
                {currentTab === 'shortcuts' && (
                  <div key="shortcuts" className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <Keyboard className="w-5 h-5 text-violet-500" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('कीबोर्ड शॉर्टकट', 'Keyboard Shortcuts')}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      {t(
                        'तेज़ नेविगेशन के लिए इन कीबोर्ड शॉर्टकट का उपयोग करें।',
                        'Use these keyboard shortcuts for faster navigation during the exam.'
                      )}
                    </p>

                    <div className="space-y-2">
                      {shortcuts.map((s, i) => {
                        const Ic = s.icon;
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Ic className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {s.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {s.keys.map((k, j) => (
                                <React.Fragment key={j}>
                                  {j > 0 && <span className="text-slate-300 dark:text-slate-600 text-xs mx-0.5">/</span>}
                                  <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                    {k}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pro tip */}
                    <div className="mt-6 p-4 bg-blue-50/80 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
                      <div className="flex items-start gap-2.5">
                        <Zap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                          <span className="font-bold">{t('प्रो टिप:', 'Pro Tip:')}</span>{' '}
                          {t(
                            'कीबोर्ड शॉर्टकट का उपयोग करके आप 30% तेज़ी से परीक्षा दे सकते हैं।',
                            'Using keyboard shortcuts can make you 30% faster during the exam.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Grading ─── */}
                {currentTab === 'grading' && (
                  <div key="grading" className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('ग्रेड सिस्टम', 'Grading System')}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-7 leading-relaxed">
                      {t(
                        'परीक्षा के बाद आपको नीचे दिए गए ग्रेड सिस्टम के अनुसार ग्रेड मिलेगा।',
                        'After the exam, you will receive a grade based on the grading system below.'
                      )}
                    </p>

                    <div className="space-y-2.5">
                      {grades.map((g, i) => {
                        const Ic = g.icon;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-lg ${g.bg} flex items-center justify-center flex-shrink-0`}>
                              <Ic className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-black text-slate-900 dark:text-white">{g.grade}</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">≥ {g.min}%</span>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{g.label}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${g.bg} rounded-full ${g.bar}`} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── FAQ ─── */}
                {currentTab === 'faq' && (
                  <div key="faq" className="animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {t('अक्सर पूछे जाने वाले प्रश्न', 'Frequently Asked Questions')}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      {t(
                        'परीक्षा से संबंधित सामान्य प्रश्नों के उत्तर यहां पाएं।',
                        'Find answers to commonly asked questions about the exam.'
                      )}
                    </p>

                    <div className="space-y-2">
                      {faqs.map((faq, i) => {
                        const isOpen = expandedFaq === i;
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFaq(isOpen ? null : i)}
                              className="w-full flex items-center justify-between gap-3 p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    Q{i + 1}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {faq.q}
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-4 pb-4 pt-2 bg-white dark:bg-slate-900">
                                <div className="flex items-start gap-3 pl-10">
                                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {faq.a}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Summary ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Test Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden lg:sticky lg:top-[80px]">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  {t('परीक्षा विवरण', 'Exam Details')}
                </h3>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { label: t('परीक्षा प्रकार', 'Exam Type'), value: typeConfig.shortCode || test.testType },
                  { label: t('पेपर', 'Paper'), value: t(paperLabel.hi, paperLabel.en) },
                  { label: t('कुल प्रश्न', 'Total Questions'), value: test.totalQuestions },
                  { label: t('समय सीमा', 'Duration'), value: formatDuration(test.duration) },
                  { label: t('प्रति प्रश्न अंक', 'Marks/Question'), value: test.marksPerQuestion || 2 },
                  { label: t('कुल अंक', 'Total Marks'), value: totalMarks },
                  {
                    label: t('नकारात्मक अंकन', 'Negative Marking'),
                    value: test.negativeMarking ? `-${test.negativeMarks}` : t('नहीं', 'No'),
                    valueColor: test.negativeMarking
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{row.label}</span>
                    <span className={`text-sm font-bold ${row.valueColor || 'text-slate-900 dark:text-white'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick grade preview */}
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-2.5">
                  {t('ग्रेड प्रीव्यू', 'Grade Preview')}
                </p>
                <div className="flex items-center gap-1">
                  {grades.map((g, i) => (
                    <div key={i} className="flex-1 group relative">
                      <div className={`h-2 ${g.bg} rounded-full ${i === 0 ? 'rounded-l-full' : ''} ${i === grades.length - 1 ? 'rounded-r-full' : ''}`} />
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded whitespace-nowrap transition-opacity pointer-events-none z-10">
                        {g.grade} ≥{g.min}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">0%</span>
                  <span className="text-[10px] text-slate-400">100%</span>
                </div>
              </div>
            </div>

            {/* Tools info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                {t('उपलब्ध उपकरण', 'Available Tools')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Calculator, label: t('कैलकुलेटर', 'Calculator'), color: 'text-blue-500' },
                  { icon: StickyNote, label: t('नोटपैड', 'Notepad'), color: 'text-amber-500' },
                  { icon: Maximize, label: t('फुलस्क्रीन', 'Fullscreen'), color: 'text-emerald-500' },
                  { icon: BookMarked, label: t('बुकमार्क', 'Bookmark'), color: 'text-violet-500' },
                ].map((tool, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <tool.icon className={`w-4 h-4 ${tool.color}`} />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{tool.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Agreement Section ── */}
        <div
          className={`max-w-3xl mx-auto mb-8 transition-all duration-700 delay-300 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                {t('घोषणा एवं सहमति', 'Declaration & Agreement')}
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                {[
                  t('मैंने सभी निर्देश ध्यानपूर्वक पढ़ लिए हैं।', 'I have carefully read all instructions.'),
                  t('मैं समझता/समझती हूं कि टाइमर शुरू होने के बाद रुकेगा नहीं।', 'I understand the timer cannot be paused once started.'),
                  t(
                    test.negativeMarking
                      ? 'मैं स्वीकार करता/करती हूं कि गलत उत्तरों पर नकारात्मक अंकन लागू होगा।'
                      : 'मैं स्वीकार करता/करती हूं कि इस परीक्षा में कोई नकारात्मक अंकन नहीं है।',
                    test.negativeMarking
                      ? 'I acknowledge that negative marking will apply for wrong answers.'
                      : 'I acknowledge that there is no negative marking in this test.'
                  ),
                  t('मैं परीक्षा को ईमानदारी और निष्ठा से दूंगा/दूंगी।', 'I will take this exam with honesty and integrity.'),
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* Checkbox */}
              <div
                onClick={() => setAgreed(!agreed)}
                className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  agreed
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      agreed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {agreed && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-semibold transition-colors ${agreed ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {t('मैं सभी शर्तों से सहमत हूं', 'I agree to all terms and conditions')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t(
                      'शुरू करने के बाद वापस नहीं जा सकते। परीक्षा तुरंत प्रारंभ होगी।',
                      'You cannot go back after starting. The exam will begin immediately.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div
          className={`max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-10 transition-all duration-700 delay-[400ms] ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={onCancel}
            className="group flex items-center gap-2 px-6 py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 font-semibold order-2 sm:order-1"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            {t('वापस जाएं', 'Go Back')}
          </button>

          <button
            onClick={handleStart}
            disabled={!agreed}
            className={`group relative flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-base transition-all duration-300 order-1 sm:order-2 w-full sm:w-auto justify-center ${
              agreed
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className={`w-5 h-5 transition-transform duration-200 ${agreed ? 'group-hover:scale-110' : ''}`} />
            {t('परीक्षा शुरू करें', 'Start Exam')}
            {agreed && <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-600">
            © 2024 NETprep • {t('सभी अधिकार सुरक्षित', 'All Rights Reserved')}
          </p>
        </div>
      </main>

      {/* ── Global Styles ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TestInstructions;