import React, { useState } from 'react';
import {
  Clock, FileText, AlertTriangle, CheckCircle, ChevronRight,
  Globe, Award, MinusCircle, Shield, Monitor, Keyboard,
  BookOpen, Target, Zap, Info, ArrowRight
} from 'lucide-react';
import { TEST_TYPE_CONFIG, PAPER_LABELS, PALETTE_COLORS } from '../../utils/constants';
import { formatDuration } from '../../utils/helpers';

const STATUS_LEGEND = [
  { key: 'NOT_VISITED', bg: 'bg-slate-200', ring: '', label: { hi: 'देखा नहीं गया', en: 'Not Visited' } },
  { key: 'NOT_ANSWERED', bg: 'bg-red-500', ring: '', label: { hi: 'उत्तर नहीं दिया', en: 'Not Answered' } },
  { key: 'ANSWERED', bg: 'bg-emerald-500', ring: '', label: { hi: 'उत्तर दिया गया', en: 'Answered' } },
  { key: 'MARKED', bg: 'bg-violet-500', ring: '', label: { hi: 'समीक्षा हेतु', en: 'Marked for Review' } },
  { key: 'ANS_MARKED', bg: 'bg-violet-500', ring: 'ring-[3px] ring-emerald-400 ring-offset-1', label: { hi: 'उत्तर + चिह्नित', en: 'Answered & Marked' } },
];

const TestInstructions = ({ test, onStart, onCancel, language = 'hi', onLanguageChange }) => {
  const [agreed, setAgreed] = useState(false);
  const [currentTab, setCurrentTab] = useState('instructions');

  const typeConfig = TEST_TYPE_CONFIG[test.testType] || {};
  const paperLabel = PAPER_LABELS[test.paper] || {};

  const instructions = language === 'hi' ? [
    `इस परीक्षा में कुल ${test.totalQuestions} प्रश्न हैं।`,
    `समय सीमा: ${test.duration} मिनट। एक बार शुरू होने पर टाइमर रुकेगा नहीं।`,
    `प्रत्येक प्रश्न ${test.marksPerQuestion || 2} अंक का है।`,
    test.negativeMarking
      ? `गलत उत्तर पर ${test.negativeMarks} अंक कटेंगे। सोच-समझकर उत्तर दें।`
      : 'इस परीक्षा में कोई नकारात्मक अंकन नहीं है।',
    'सभी प्रश्न अनिवार्य हैं। प्रत्येक के चार विकल्प हैं।',
    'उत्तर देने के बाद "Save & Next" पर क्लिक करें।',
    '"Mark for Review" से प्रश्न को बाद में देखने के लिए चिह्नित करें।',
    'अंतिम प्रश्न पर "Submit" बटन से परीक्षा जमा करें।',
    'कैलकुलेटर और नोटपैड टूलबार में उपलब्ध हैं।',
  ] : [
    `This test contains ${test.totalQuestions} questions.`,
    `Time Limit: ${test.duration} minutes. Timer cannot be paused once started.`,
    `Each question carries ${test.marksPerQuestion || 2} marks.`,
    test.negativeMarking
      ? `${test.negativeMarks} marks deducted for each wrong answer. Answer carefully.`
      : 'No negative marking in this test.',
    'All questions are compulsory with four options each.',
    'Click "Save & Next" after selecting your answer.',
    'Use "Mark for Review" to revisit a question later.',
    'Click "Submit" on the last question to finish.',
    'Calculator and Notepad are available in the toolbar.',
  ];

  const shortcuts = [
    { keys: '← →', label: { hi: 'पिछला / अगला', en: 'Previous / Next' } },
    { keys: '1-4', label: { hi: 'विकल्प चुनें', en: 'Select Option' } },
    { keys: 'M', label: { hi: 'समीक्षा चिह्नित', en: 'Mark Review' } },
    { keys: 'C', label: { hi: 'उत्तर हटाएं', en: 'Clear Response' } },
    { keys: 'F', label: { hi: 'फुलस्क्रीन', en: 'Fullscreen' } },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">

        {/* ── Header ── */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700" />
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }} />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 text-white/90 backdrop-blur-sm border border-white/10">
                {typeConfig.shortCode || test.testType}
              </span>
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 backdrop-blur-sm border border-white/10">
                <button onClick={() => onLanguageChange?.('hi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    language === 'hi' ? 'bg-white text-indigo-700 shadow' : 'text-white/70 hover:text-white'}`}>
                  हिंदी
                </button>
                <button onClick={() => onLanguageChange?.('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    language === 'en' ? 'bg-white text-indigo-700 shadow' : 'text-white/70 hover:text-white'}`}>
                  English
                </button>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
              {test.title}
            </h1>
            <p className="text-white/60 text-sm">
              {language === 'hi' ? paperLabel.hi : paperLabel.en}
            </p>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-3 gap-3 p-6 -mt-6">
          {[
            { icon: FileText, value: test.totalQuestions, label: { hi: 'प्रश्न', en: 'Questions' }, color: 'blue' },
            { icon: Clock, value: formatDuration(test.duration), label: { hi: 'समय', en: 'Duration' }, color: 'emerald' },
            { icon: Award, value: (test.totalQuestions * (test.marksPerQuestion || 2)), label: { hi: 'कुल अंक', en: 'Total Marks' }, color: 'violet' },
          ].map(({ icon: Ic, value, label, color }, i) => (
            <div key={i} className={`bg-white dark:bg-slate-700/50 rounded-2xl p-4 text-center border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-11 h-11 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mx-auto mb-2`}>
                <Ic className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{value}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === 'hi' ? label.hi : label.en}
              </div>
            </div>
          ))}
        </div>

        {/* ── Negative Marking Alert ── */}
        {test.negativeMarking && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
              <MinusCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800 dark:text-red-300 text-sm">
                {language === 'hi' ? 'नकारात्मक अंकन' : 'Negative Marking'}
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                {language === 'hi'
                  ? `प्रत्येक गलत उत्तर पर ${test.negativeMarks} अंक कटेंगे`
                  : `${test.negativeMarks} marks deducted per wrong answer`}
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="px-6">
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
            {[
              { id: 'instructions', icon: Info, label: { hi: 'निर्देश', en: 'Instructions' } },
              { id: 'palette', icon: Target, label: { hi: 'पैलेट गाइड', en: 'Palette Guide' } },
              { id: 'shortcuts', icon: Keyboard, label: { hi: 'शॉर्टकट', en: 'Shortcuts' } },
            ].map(({ id, icon: Ic, label }) => (
              <button key={id} onClick={() => setCurrentTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === id
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}>
                <Ic className="w-3.5 h-3.5" />
                {language === 'hi' ? label.hi : label.en}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="p-6 min-h-[260px]">
          {/* Instructions Tab */}
          {currentTab === 'instructions' && (
            <div className="space-y-2.5 animate-fadeIn">
              {instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-300">{i + 1}</span>
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{inst}</span>
                </div>
              ))}
            </div>
          )}

          {/* Palette Guide Tab */}
          {currentTab === 'palette' && (
            <div className="space-y-3 animate-fadeIn">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {language === 'hi'
                  ? 'परीक्षा के दौरान प्रश्न पैलेट में निम्न रंग कोड दिखेंगे:'
                  : 'During the test, the question palette will show these color codes:'}
              </p>
              {STATUS_LEGEND.map(({ key, bg, ring, label }) => (
                <div key={key} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${bg} ${ring} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                    1
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {language === 'hi' ? label.hi : label.en}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Shortcuts Tab */}
          {currentTab === 'shortcuts' && (
            <div className="space-y-2 animate-fadeIn">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {language === 'hi'
                  ? 'परीक्षा में तेजी से काम करने के लिए कीबोर्ड शॉर्टकट:'
                  : 'Use keyboard shortcuts during the exam for faster navigation:'}
              </p>
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {language === 'hi' ? s.label.hi : s.label.en}
                  </span>
                  <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-sm">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Agreement ── */}
        <div className="px-6 pb-4">
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border-2 border-dashed transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30
            ${agreed ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-300 dark:border-slate-600'}">
            <div className="relative flex-shrink-0 mt-0.5">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="sr-only" />
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                agreed
                  ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
              }`}>
                {agreed && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'मैंने सभी निर्देश पढ़ लिए हैं और परीक्षा शुरू करने के लिए तैयार हूं। मैं समझता/समझती हूं कि टाइमर शुरू होने के बाद रुकेगा नहीं।'
                : 'I have read all instructions and am ready to start. I understand the timer cannot be paused once started.'}
            </span>
          </label>
        </div>

        {/* ── Action Buttons ── */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button onClick={onCancel}
            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all text-sm font-medium">
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>
          <button onClick={onStart} disabled={!agreed}
            className={`
              inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl font-bold text-sm transition-all
              ${agreed
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}
            `}>
            {language === 'hi' ? 'परीक्षा शुरू करें' : 'Start Test'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;