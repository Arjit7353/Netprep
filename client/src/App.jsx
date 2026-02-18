// client/src/App.jsx

import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { ensureServerAwake } from './services/api';

// Pages
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import ImportQuestions from './pages/ImportQuestions';
import Settings from './pages/Settings';

// Test Pages
import TestListPage from './pages/TestListPage';
import CreateTestPage from './pages/CreateTestPage';
import TakeTest from './pages/TakeTest';

// Result Pages
import Results from './pages/Results';
import ResultDetail from './pages/ResultDetail';

// Loading Component
const ServerWakeUp = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        सर्वर शुरू हो रहा है...
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Starting server, please wait (10-30 seconds)
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
        Free tier server sleeps after inactivity
      </p>
    </div>
  </div>
);

// 404
const NotFound = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Page not found</p>
      <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">Go to Dashboard</a>
    </div>
  </div>
);

function App() {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('netprep-language') || 'en';
    } catch {
      return 'en';
    }
  });

  const [serverReady, setServerReady] = useState(false);
  const [serverError, setServerError] = useState(false);

  // Wake up server on app load
  useEffect(() => {
    const wakeUp = async () => {
      try {
        const isAwake = await ensureServerAwake();
        setServerReady(true);
        if (!isAwake) {
          console.warn('Server might be slow');
        }
      } catch (error) {
        console.error('Server wake-up error:', error);
        setServerReady(true); // Allow app to load anyway
        setServerError(true);
      }
    };
    
    wakeUp();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('netprep-language', language);
    } catch (e) {
      console.warn('Could not save language');
    }
  }, [language]);

  // Show loading while server wakes up
  if (!serverReady) {
    return <ServerWakeUp />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="font-sans antialiased">
          {serverError && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-800">
              ⚠️ Server connection slow. Some features may take longer to load.
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard language={language} setLanguage={setLanguage} />} />
            <Route path="/questions" element={<QuestionBank language={language} setLanguage={setLanguage} />} />
            <Route path="/import" element={<ImportQuestions language={language} setLanguage={setLanguage} />} />
            <Route path="/tests" element={<TestListPage language={language} setLanguage={setLanguage} />} />
            <Route path="/tests/create" element={<CreateTestPage language={language} setLanguage={setLanguage} />} />
            <Route path="/tests/edit/:id" element={<CreateTestPage language={language} setLanguage={setLanguage} />} />
            <Route path="/test/:id" element={<TakeTest />} />
            <Route path="/results" element={<Results language={language} setLanguage={setLanguage} />} />
            <Route path="/results/:id" element={<ResultDetail language={language} setLanguage={setLanguage} />} />
            <Route path="/settings" element={<Settings language={language} setLanguage={setLanguage} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;