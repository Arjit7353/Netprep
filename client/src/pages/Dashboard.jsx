import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Brain, Target, Layers, PlusCircle, ArrowRight, 
  RefreshCw, BookOpen, Clock, Zap, Sparkles, TrendingUp, FileQuestion
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import AdaptiveTestCreator from '../components/test/AdaptiveTestCreator';
import TestCardPro from '../components/test/TestCardPro';
import useDashboard from '../hooks/useDashboard';

// Premium Circular Progress Gauge
const CircularGauge = ({ accuracy, label, hi }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((accuracy || 0) / 100) * circumference;
  // Determine color: Red for very low, Orange for medium, Green for high
  const color = accuracy < 40 ? '#ef4444' : accuracy < 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
          <circle cx="32" cy="32" r={radius} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="6" fill="none" />
          <circle cx="32" cy="32" r={radius} stroke={color} strokeWidth="6" fill="none" 
                  strokeDasharray={circumference} strokeDashoffset={offset} 
                  className="transition-all duration-1500 ease-out" strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{Math.round(accuracy || 0)}%</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate" title={label}>{label}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hi ? 'सटीकता' : 'Accuracy'}</p>
      </div>
    </div>
  );
};

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
          <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  // Extract necessary data
  const newTests = (d.createdTests || []).slice(0, 4);
  const criticalAreas = (d.smartRevision?.criticalAreas || []).slice(0, 3);
  const revisionDue = d.smartRevision?.dueToday || 0;
  const overallAccuracy = d.questionStats?.overall?.accuracy || 0;
  const totalQuestionsAttempted = d.questionStats?.overall?.totalAttempted || 0;

  return (
    <Layout language={language} setLanguage={handleSetLanguage}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
        
        {/* PREMIUM HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 shadow-2xl border border-indigo-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> 
                {hi ? 'मिशन JRF कमांड सेंटर' : 'Mission JRF Command Center'}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Aspirant!</span>
              </h1>
              <p className="text-indigo-200 text-lg md:text-xl font-medium max-w-xl">
                {hi ? 'अपने लक्ष्य की ओर तेजी से बढ़ें। यहाँ से सीधे अपने अगले टेस्ट में प्रवेश करें।' : 'Accelerate your progress. Jump straight into your next practice session from here.'}
              </p>
              
              <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                <button onClick={() => navigate('/tests/create')}
                  className="bg-white hover:bg-gray-50 text-indigo-900 px-6 py-3 rounded-xl font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:-translate-y-1 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" /> {hi ? 'कस्टम मॉक टेस्ट बनाएं' : 'Create Custom Mock'}
                </button>
                <button onClick={() => d.refresh()}
                  className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                  <RefreshCw className={`w-5 h-5 ${d.refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Overall Stats Visual */}
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-6 shadow-inner w-full md:w-auto justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-xl">
                  <circle cx="48" cy="48" r="42" className="stroke-white/10" strokeWidth="8" fill="none" />
                  <circle cx="48" cy="48" r="42" className="stroke-blue-400 transition-all duration-1500 ease-out" 
                          strokeWidth="8" fill="none" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 42} 
                          strokeDashoffset={(2 * Math.PI * 42) * (1 - overallAccuracy / 100)} />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white">{Math.round(overallAccuracy)}%</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">
                  {hi ? 'कुल सटीकता' : 'Overall Accuracy'}
                </div>
                <div className="text-white text-2xl font-black flex items-center gap-2">
                  {totalQuestionsAttempted} <span className="text-indigo-300 text-sm font-medium">{hi ? 'प्रश्न हल किए' : 'Q. Attempted'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREMIUM QUICK LAUNCH GRID */}
        <section>
          <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-500" /> 
              {hi ? 'त्वरित अभ्यास प्रारंभ करें' : 'Launch Quick Practice'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* AI Weakness Test */}
            <div onClick={() => setShowAdaptiveModal(true)}
                 className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 relative z-10">{hi ? 'कमजोरियों पर वार' : 'Target Weaknesses'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10 leading-relaxed">
                {hi ? 'AI स्वचालित रूप से आपकी कमजोरियों का विश्लेषण कर टेस्ट बनाएगा।' : 'AI automatically analyzes and generates a test for your weak spots.'}
              </p>
              
              <div className="flex items-center justify-between mt-auto relative z-10">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-500">{hi ? 'शुरू करें' : 'Start Adaptive'}</span>
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white text-amber-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Spaced Repetition / Revision */}
            <div onClick={() => navigate('/tests')}
                 className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30 mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 relative z-10">{hi ? 'रिवीजन पेंडिंग' : 'Revision Pending'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10 leading-relaxed">
                {revisionDue > 0 
                  ? (hi ? `आज ${revisionDue} टॉपिक्स का रिवीजन करना है।` : `You have ${revisionDue} topics due for spaced repetition today.`) 
                  : (hi ? 'अपने स्पेस रिपीटिशन शेड्यूल का पालन करें।' : 'Follow your spaced repetition schedule.')}
              </p>
              
              <div className="flex items-center justify-between mt-auto relative z-10">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">{hi ? 'रिवाइज करें' : 'Revise Now'}</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white text-emerald-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* PYQ Practice */}
            <div onClick={() => navigate('/pyq/question-bank')}
                 className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-rose-400 to-red-500 opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 relative z-10">{hi ? 'PYQ अभ्यास' : 'PYQ Practice'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10 leading-relaxed">
                {hi ? 'पिछले वर्षों के प्रश्न पत्रों का प्रामाणिक अभ्यास करें।' : 'Practice authentic previous year question papers.'}
              </p>
              
              <div className="flex items-center justify-between mt-auto relative z-10">
                <span className="text-sm font-bold text-rose-600 dark:text-rose-500">{hi ? 'अभ्यास करें' : 'Start PYQ'}</span>
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white text-rose-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Topic Wise */}
            <div onClick={() => navigate('/questions')}
                 className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-purple-400 to-indigo-500 opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5 relative z-10 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 relative z-10">{hi ? 'टॉपिक अनुसार' : 'Topic Wise'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10 leading-relaxed">
                {hi ? 'किसी विशिष्ट विषय या चैप्टर का गहराई से अभ्यास करें।' : 'Deep dive into specific chapters and units.'}
              </p>
              
              <div className="flex items-center justify-between mt-auto relative z-10">
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-500">{hi ? 'प्रश्न खोजें' : 'Browse Topics'}</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white text-indigo-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* PREMIUM VISUAL WEAKNESS INDICATORS */}
        {criticalAreas.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-red-500" /> {hi ? 'आपके महत्वपूर्ण कमजोर विषय' : 'Critical Weak Areas'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {hi ? 'सटीकता में सुधार के लिए इन विषयों पर ध्यान दें।' : 'Focus on these topics to instantly boost your score.'}
                </p>
              </div>
              <button onClick={() => setShowAdaptiveModal(true)}
                className="hidden md:flex bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 px-5 py-2.5 rounded-xl font-bold transition-colors items-center gap-2">
                <TrendingUp className="w-4 h-4" /> {hi ? 'सभी को सुधारें' : 'Fix All Weaknesses'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {criticalAreas.map((area, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col justify-between hover:border-red-300 dark:hover:border-red-500/50 transition-colors group">
                  <CircularGauge accuracy={area.accuracy} label={area.name} hi={hi} />
                  
                  <button onClick={() => setShowAdaptiveModal(true)}
                    className="mt-6 w-full py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                    {hi ? 'इस टॉपिक का टेस्ट लें' : 'Practice this topic'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* NEW & RECENT TESTS GRID */}
        <section>
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Play className="w-6 h-6 text-indigo-500" /> {hi ? 'हाल ही के टेस्ट' : 'Recent Tests'}
            </h2>
            <button onClick={() => navigate('/tests')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-xl">
              {hi ? 'सभी देखें' : 'View Library'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {newTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
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
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <FileQuestion className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
                {hi ? 'अभी तक कोई टेस्ट नहीं बनाया गया है।' : 'Your test library is currently empty.'}
              </p>
              <button onClick={() => navigate('/tests/create')}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 text-white px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-1">
                {hi ? 'पहला टेस्ट बनाएं' : 'Create Your First Test'}
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
