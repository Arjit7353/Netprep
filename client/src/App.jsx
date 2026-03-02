import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import ImportQuestions from './pages/ImportQuestions';
import Settings from './pages/Settings';
import TestListPage from './pages/TestListPage';
import CreateTestPage from './pages/CreateTestPage';
import TakeTest from './pages/TakeTest';
import Results from './pages/Results';
import ResultDetail from './pages/ResultDetail';
import SolutionPage from './pages/SolutionPage';

// ─── Non-blocking server status bar ───
const ServerStatusBar = ({ status, onDismiss }) => {
  if (status === 'ready') return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 text-sm py-2 px-4 transition-all duration-500 animate-slide-down ${
        status === 'connecting'
          ? 'bg-amber-50 border-b border-amber-200 text-amber-800'
          : status === 'slow'
          ? 'bg-orange-50 border-b border-orange-200 text-orange-800'
          : 'bg-red-50 border-b border-red-200 text-red-800'
      }`}
    >
      {status === 'connecting' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Server start ho raha hai... / Connecting to server...</span>
        </>
      )}
      {status === 'slow' && (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Server slow hai, data load hone mein time lag sakta hai</span>
        </>
      )}
      {status === 'error' && (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Server se connect nahi ho pa raha. Refresh karein.</span>
        </>
      )}
      <button
        onClick={onDismiss}
        className="ml-3 text-xs underline opacity-70 hover:opacity-100"
      >
        Dismiss
      </button>
    </div>
  );
};

// ─── 404 Page ───
const NotFound = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Page not found</p>
      <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
        Go to Dashboard
      </a>
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

  const [serverStatus, setServerStatus] = useState('ready'); // ready by default — no blocking
  const checkDone = useRef(false);

  // ─── Background non-blocking server health check ───
  useEffect(() => {
    if (checkDone.current) return;
    checkDone.current = true;

    const getApiBase = () => {
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
      if (typeof window !== 'undefined') {
        const h = window.location.hostname;
        if (h === 'apmock.icu' || h === 'www.apmock.icu')
          return 'https://netprep-api.onrender.com/api';
      }
      return '/api';
    };

    const apiBase = getApiBase();
    let showTimer;

    // Only show "connecting" if the check takes more than 1.5 seconds
    showTimer = setTimeout(() => setServerStatus('connecting'), 1500);

    const ping = async () => {
      try {
        const r = await fetch(`${apiBase}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(25000),
        });
        clearTimeout(showTimer);
        setServerStatus(r.ok ? 'ready' : 'slow');
        if (!r.ok) setTimeout(() => setServerStatus('ready'), 8000);
      } catch {
        clearTimeout(showTimer);
        setServerStatus('slow');
        // Auto-hide after 12s
        setTimeout(() => setServerStatus('ready'), 12000);
      }
    };

    ping();

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('netprep-language', language);
    } catch {}
  }, [language]);

  const dismissBar = () => setServerStatus('ready');

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="font-sans antialiased">
          <ServerStatusBar status={serverStatus} onDismiss={dismissBar} />
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
            <Route path="/results/:id/solutions" element={<SolutionPage language={language} setLanguage={setLanguage} />} />
            <Route path="/settings" element={<Settings language={language} setLanguage={setLanguage} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;