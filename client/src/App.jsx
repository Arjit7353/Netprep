import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import ImportQuestions from './pages/ImportQuestions';
import Settings from './pages/Settings';

// Test Pages (Phase 4)
import TestListPage from './pages/TestListPage';
import CreateTestPage from './pages/CreateTestPage';
import TakeTest from './pages/TakeTest';

// Result Pages (Phase 5)
import Results from './pages/Results';
import ResultDetail from './pages/ResultDetail';

// 404 Component
const NotFound = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center transition-colors duration-300">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-secondary-700 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-secondary-400 mb-4">Page not found</p>
      <a href="/" className="text-primary-600 dark:text-primary-400 hover:underline">Go to Dashboard</a>
    </div>
  </div>
);

function App() {
  // Global language state with localStorage persistence
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('netprep-language') || 'en';
  });

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('netprep-language', language);
  }, [language]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available, show notification
                    console.log('New content available, please refresh.');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      document.body.classList.remove('offline');
    };

    const handleOffline = () => {
      document.body.classList.add('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    if (!navigator.onLine) {
      document.body.classList.add('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="font-sans antialiased">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard language={language} setLanguage={setLanguage} />} />
            
            {/* Questions */}
            <Route path="/questions" element={<QuestionBank language={language} setLanguage={setLanguage} />} />
            <Route path="/import" element={<ImportQuestions language={language} setLanguage={setLanguage} />} />
            
            {/* Tests - Phase 4 */}
            <Route path="/tests" element={<TestListPage language={language} setLanguage={setLanguage} />} />
            <Route path="/tests/create" element={<CreateTestPage language={language} setLanguage={setLanguage} />} />
            <Route path="/tests/edit/:id" element={<CreateTestPage language={language} setLanguage={setLanguage} />} />
            <Route path="/test/:id" element={<TakeTest />} />
            
            {/* Results - Phase 5 */}
            <Route path="/results" element={<Results language={language} setLanguage={setLanguage} />} />
            <Route path="/results/:id" element={<ResultDetail language={language} setLanguage={setLanguage} />} />
            
            {/* Settings */}
            <Route path="/settings" element={<Settings language={language} setLanguage={setLanguage} />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;