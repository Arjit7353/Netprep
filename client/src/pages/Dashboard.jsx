import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Brain, Target, Layers, PlusCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import AdaptiveTestCreator from '../components/test/AdaptiveTestCreator';
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

  return (
    <Layout language={language} setLanguage={handleSetLanguage}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
        
        {/* Simple Header */}
        <div className="text-center md:text-left mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">
            {getGreeting()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {hi ? 'आज आप किस प्रकार का टेस्ट देना चाहेंगे?' : 'What kind of test would you like to take today?'}
          </p>
        </div>

        {/* Test Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. New Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
               onClick={() => navigate('/tests/create')}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
            <div className="relative z-10 flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors mb-2">
                  {hi ? 'नया टेस्ट' : 'New Test'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {hi ? 'एक नया फुल लेंथ या कस्टम मॉक टेस्ट बनाएं।' : 'Create a brand new full-length or custom mock test.'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Weak Topics Test (Adaptive) */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
               onClick={() => setShowAdaptiveModal(true)}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-400 to-orange-500 opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
            <div className="relative z-10 flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-red-500 transition-colors mb-2">
                  {hi ? 'कमजोर विषय टेस्ट' : 'Weak Topics Test'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {hi ? 'AI आपकी कमजोरियों का विश्लेषण करके टेस्ट बनाएगा।' : 'AI generates a test focusing purely on your weak areas.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Revision Test */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
               onClick={() => navigate('/tests')}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
            <div className="relative z-10 flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors mb-2">
                  {hi ? 'रिवीजन टेस्ट' : 'Revision Test'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {hi ? 'पुराने टेस्ट दोबारा दें और गलतियों को सुधारें।' : 'Re-attempt previous tests and fix your mistakes.'}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Topic Wise Test */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
               onClick={() => navigate('/questions')}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-500 opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
            <div className="relative z-10 flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors mb-2">
                  {hi ? 'टॉपिक वाइज टेस्ट' : 'Topic Wise Test'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {hi ? 'विशिष्ट विषयों और टॉपिक के प्रश्नों का अभ्यास करें।' : 'Practice questions from specific subjects and topics.'}
                </p>
              </div>
            </div>
          </div>

        </div>

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
