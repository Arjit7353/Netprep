import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';

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

  useEffect(() => {
    try {
      localStorage.setItem('netprep-language', language);
    } catch (e) {
      console.warn('Could not save language');
    }
  }, [language]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="font-sans antialiased">
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