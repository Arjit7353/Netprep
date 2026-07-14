import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTestContext, TestProvider } from '../context/TestContext';
import NTAInstructions from '../components/test/NTAInstructions';
import NTAExamInterface from '../components/test/NTAExamInterface';
import Loader from '../components/common/Loader';
import attemptService from '../services/attemptService';
import testService from '../services/testService';

const NTATakeTestContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { initializeTest, status, resetTest } = useTestContext();

  const [phase, setPhase] = useState('loading'); // loading | instructions | test | error
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState(null);
  
  // Get language from localStorage or default to 'hi'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('netprep-language') || 'hi';
  });

  // Save language preference
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('netprep-language', lang);
  };

  useEffect(() => {
    loadTest();
    
    // Cleanup on unmount
    return () => {
      resetTest();
    };
  }, [id]);

  const loadTest = async () => {
    try {
      setPhase('loading');
      setError(null);

      // Get test with questions
      const testResponse = await testService.getTestWithQuestions(id);
      const testData = testResponse.data;

      if (!testData) {
        throw new Error(language === 'hi' ? 'परीक्षा नहीं मिली' : 'Test not found');
      }

      if (testData.status !== 'active') {
        throw new Error(language === 'hi' ? 'परीक्षा सक्रिय नहीं है' : 'Test is not active');
      }

      setTest(testData);
      setPhase('instructions');
    } catch (err) {
      console.error('Failed to load test:', err);
      setError(err.message || (language === 'hi' ? 'परीक्षा लोड करने में विफल' : 'Failed to load test'));
      setPhase('error');
    }
  };

  const handleStartTest = async () => {
    try {
      setPhase('loading');

      // Start attempt
      const attemptResponse = await attemptService.startAttempt(id);
      const { attempt: attemptData, test: testData } = attemptResponse.data;

      setAttempt(attemptData);
      
      // Initialize test context
      initializeTest(testData || test, attemptData);
      
      setPhase('test');
    } catch (err) {
      console.error('Failed to start test:', err);
      setError(err.message || (language === 'hi' ? 'परीक्षा शुरू करने में विफल' : 'Failed to start test'));
      setPhase('error');
    }
  };

  const handleCancel = () => {
    navigate('/tests');
  };

  // Render based on phase
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader 
          size="lg" 
          text={language === 'hi' ? 'परीक्षा लोड हो रही है...' : 'Loading test...'} 
        />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'hi' ? 'त्रुटि' : 'Error'}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => loadTest()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
            >
              {language === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'}
            </button>
            <button
              onClick={() => navigate('/tests')}
              className="px-6 py-2 bg-[#254F96] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'instructions' && test) {
    return (
      <NTAInstructions
        test={test}
        onStart={handleStartTest}
        onCancel={handleCancel}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  if (phase === 'test') {
    return <NTAExamInterface />;
  }

  return null;
};

// Wrapper with Provider
const NTATakeTest = () => {
  return (
    <TestProvider>
      <NTATakeTestContent />
    </TestProvider>
  );
};

export default NTATakeTest;
