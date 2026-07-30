import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Brain, Target, Layers, PlusCircle, ArrowRight, RefreshCw, BookOpen, Clock, Zap } from 'lucide-react';
import Layout from '../components/layout/Layout';
import AdaptiveTestCreator from '../components/test/AdaptiveTestCreator';
import TestCardPro from '../components/test/TestCardPro';
import useDashboard from '../hooks/useDashboard';

const Dashboard = ({ language: propLanguage, setLanguage: propSetLanguage }) => {
  const [language, setLanguageState] = useState(() => {
    return propLanguage || localStorage.getItem('netprep-language') || 'en';
  });

  useEffect(() => {
    if (propLanguage) setLanguageState(propLanguage);
  }, [propLanguage]);

  const handleSetLanguage = useCallback((newLang) => {
    setLanguageState(newLang);
    try { localStorage.setItem('netprep-language', newLang); } catch {}
    if (propSetLanguage) propSetLanguage(newLang);
    window.dispatchEvent(new Event('netprep-language-changed'));
  }, [propSetLanguage]);

  const navigate = useNavigate();
  const d = useDashboard();
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);

  const hi = language === 'hi';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 6) return hi ? 'शुभ रात्रि' : 'Good Night';
    if (h < 12) return hi ? 'सुप्रभात' : 'Good Morning';
    if (h < 17) return hi ? 'शुभ दोपहर' : 'Good Afternoon';
    return hi ? 'शुभ संध्या' : 'Good Evening';
  };

  if (d.loading) {
    return (
      <Layout language={language} setLanguage={handleSetLanguage}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
        </div>
      </Layout>
    );
  }

  // Extract necessary data
  const newTests = (d.createdTests || []).slice(0, 4);
  const criticalAreas = (d.smartRevision?.criticalAreas || []).slice(0, 3);
  const revisionDue = d.smartRevision?.dueToday || 0;

  return (
    <Layout language={language} setLanguage={handleSetLanguage}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
        
        {/* Simple Minimal Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
              {getGreeting()}, <span className="text-blue-600 dark:text-blue-500">{hi ? 'तैयार हैं?' : 'Ready to practice?'}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
              {hi ? 'अपने लक्ष्य की ओर एक और कदम बढ़ाएं।' : 'Take another step towards your goal today.'}
            </p>
          </div>
          <div className="flex gap-3">
             <button onClick={() => d.refresh()}
               className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
               <RefreshCw className={`w-5 h-5 ${d.refreshing ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={() => navigate('/tests/create')}
               className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
               <PlusCircle className="w-5 h-5" /> {hi ? 'कस्टम टेस्ट बनाएं' : 'Create Custom Test'}
             </button>
          </div>
        </div>

        {/* 1. Quick Launch Actions */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> {hi ? 'क्विक लॉन्च' : 'Quick Launch'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* AI Weakness Test */}
            <div onClick={() => setShowAdaptiveModal(true)}
                 className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
              <Brain className="w-8 h-8 mb-3 opacity-90" />
              <h3 className="text-lg font-bold mb-1">{hi ? 'कमजोरियों पर वार' : 'Target Weaknesses'}</h3>
              <p className="text-sm text-amber-100 mb-3">{hi ? 'AI आधारित एडाप्टिव टेस्ट' : 'AI adaptive test on weak spots'}</p>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-amber-50 gap-1 group-hover:gap-2 transition-all">
                {hi ? 'शुरू करें' : 'Start Now'} <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Spaced Repetition / Revision */}
            <div onClick={() => navigate('/tests')}
                 className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
              <Clock className="w-8 h-8 mb-3 opacity-90" />
              <h3 className="text-lg font-bold mb-1">{hi ? 'रिवीजन टेस्ट' : 'Revision Time'}</h3>
              <p className="text-sm text-emerald-100 mb-3">
                {revisionDue > 0 
                  ? (hi ? `आज ${revisionDue} टॉपिक पेंडिंग` : `${revisionDue} topics pending today`) 
                  : (hi ? 'स्पेस रिपीटिशन टेस्ट' : 'Spaced repetition tests')}
              </p>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-emerald-50 gap-1 group-hover:gap-2 transition-all">
                {hi ? 'रिवाइज करें' : 'Revise Now'} <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* PYQ Practice */}
            <div onClick={() => navigate('/pyq/question-bank')}
                 className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
              <BookOpen className="w-8 h-8 mb-3 opacity-90" />
              <h3 className="text-lg font-bold mb-1">{hi ? 'PYQ अभ्यास' : 'PYQ Practice'}</h3>
              <p className="text-sm text-red-100 mb-3">{hi ? 'पिछले वर्ष के प्रश्न पत्र' : 'Previous year question papers'}</p>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-red-50 gap-1 group-hover:gap-2 transition-all">
                {hi ? 'अभ्यास करें' : 'Practice'} <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Topic Wise */}
            <div onClick={() => navigate('/questions')}
                 className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
              <Layers className="w-8 h-8 mb-3 opacity-90" />
              <h3 className="text-lg font-bold mb-1">{hi ? 'टॉपिक अनुसार' : 'Topic Wise'}</h3>
              <p className="text-sm text-purple-100 mb-3">{hi ? 'चैप्टर वाइज प्रश्नों का बैंक' : 'Chapter-wise question bank'}</p>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-purple-50 gap-1 group-hover:gap-2 transition-all">
                {hi ? 'प्रश्न खोजें' : 'Browse'} <ArrowRight className="w-3 h-3" />
              </div>
            </div>

          </div>
        </section>

        {/* 2. Critical Weak Areas (if any) */}
        {criticalAreas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-red-500" /> {hi ? 'आपके कमजोर विषय' : 'Your Weak Areas'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {criticalAreas.map((area, i) => (
                <div key={i} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-xl p-4 flex flex-col">
                  <h4 className="font-bold text-red-900 dark:text-red-300 text-sm mb-1">{area.name}</h4>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-4">{hi ? 'सटीकता:' : 'Accuracy:'} {area.accuracy}%</p>
                  <button onClick={() => setShowAdaptiveModal(true)}
                    className="mt-auto w-full py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-colors">
                    {hi ? 'इसे सुधारें' : 'Improve This'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. New & Recent Tests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-500" /> {hi ? 'नए टेस्ट' : 'New Tests'}
            </h2>
            <button onClick={() => navigate('/tests')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
              {hi ? 'सभी देखें' : 'View All'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {newTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newTests.map(test => (
                <TestCardPro
                  key={test._id}
                  test={test}
                  language={language}
                  onDelete={() => {}} // Disabled on dashboard
                  onDuplicate={() => {}} // Disabled on dashboard
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {hi ? 'अभी तक कोई टेस्ट नहीं बनाया गया है।' : 'No tests created yet.'}
              </p>
              <button onClick={() => navigate('/tests/create')}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-2 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:shadow-md transition-all">
                {hi ? 'पहला टेस्ट बनाएं' : 'Create First Test'}
              </button>
            </div>
          )}
        </section>

        {/* Adaptive Test Creator Modal */}
        {showAdaptiveModal && (
          <AdaptiveTestCreator
            isOpen={showAdaptiveModal}
            onClose={() => setShowAdaptiveModal(false)}
            allAttempts={d.allAttempts || []}
            availableQuestions={d.questionStats?.allQuestions || []}
            language={language}
            onCreateTest={(config) => {
              setShowAdaptiveModal(false);
              navigate('/tests/create', { state: { adaptiveConfig: config } });
            }}
          />
        )}

      </div>
    </Layout>
  );
};

export default Dashboard;
