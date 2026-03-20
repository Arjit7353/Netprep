import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';
import {
  Globe, Server, Database, CheckCircle2,
} from 'lucide-react';

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
import ManageSyllabus from './pages/ManageSyllabus';

// ─────────────────────────────────────────────
//  ADVANCED FULL-SCREEN LOADER
// ─────────────────────────────────────────────
const AdvancedLoader = ({ serverReady }) => {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [dots, setDots] = useState('');
  const [visible, setVisible] = useState(true);
  const startRef = useRef(Date.now());

  const steps = [
    { Icon: Globe, label: 'Network' },
    { Icon: Server, label: 'Server' },
    { Icon: Database, label: 'Data' },
    { Icon: CheckCircle2, label: 'Ready' },
  ];

  const messages = [
    'Connecting to network',
    'Starting server',
    'Loading resources',
    'Finalizing',
  ];

  // Animated dots
  useEffect(() => {
    const iv = setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(iv);
  }, []);

  // Simulated progress (smooth logarithmic curve)
  useEffect(() => {
    if (serverReady) return;
    const iv = setInterval(() => {
      const t = (Date.now() - startRef.current) / 1000;
      const p = Math.min(95, Math.round(95 * (1 - Math.exp(-t / 3))));
      let s;
      if (p < 25) s = 0;
      else if (p < 55) s = 1;
      else if (p < 85) s = 2;
      else s = 3;
      setProgress(p);
      setActiveStep(s);
    }, 80);
    return () => clearInterval(iv);
  }, [serverReady]);

  // Server ready -> jump to 100%, fade out
  useEffect(() => {
    if (!serverReady) return;
    setProgress(100);
    setActiveStep(3);
    const timer = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(timer);
  }, [serverReady]);

  if (!visible) return null;

  const C = 2 * Math.PI * 42;
  const offset = C * (1 - progress / 100);

  return (
    <>
      <style>{`
        @keyframes ldr-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes ldr-grid{0%{transform:translate(0,0)}100%{transform:translate(40px,40px)}}
        @keyframes ldr-float{0%,100%{transform:translateY(0);opacity:.15}50%{transform:translateY(-18px);opacity:.4}}
        @keyframes ldr-glow{0%,100%{filter:drop-shadow(0 0 8px rgba(99,102,241,.2))}50%{filter:drop-shadow(0 0 22px rgba(99,102,241,.5))}}
        @keyframes ldr-pop{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
      `}</style>

      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden
          transition-all duration-700 ease-out
          ${serverReady ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'}`}
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e1b4b 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
            animation: 'ldr-grid 25s linear infinite',
          }}
        />

        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-indigo-400"
            style={{
              top: `${12 + i * 18}%`,
              left: `${8 + i * 20}%`,
              animation: `ldr-float ${4 + i * 1.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}

        <div className="relative text-center px-5 max-w-sm w-full">
          <div
            className="relative inline-block mb-7"
            style={{ animation: 'ldr-glow 2.5s ease-in-out infinite' }}
          >
            <svg width="96" height="96" viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx="50" cy="50" r="42"
                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none" stroke="url(#loaderGrad)" strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
              />
              <defs>
                <linearGradient id="loaderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-lg font-bold text-indigo-300"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {progress}%
              </span>
            </div>
          </div>

          <p className="text-slate-300 text-sm font-medium mb-5 h-5">
            {serverReady ? 'Ready!' : `${messages[activeStep]}${dots}`}
          </p>

          <div className="flex items-center gap-3 mb-7">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full relative"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
                  boxShadow: '0 0 12px rgba(99,102,241,0.35)',
                  transition: 'width 0.3s ease-out',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
                    animation: 'ldr-shimmer 1.8s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
            <span
              className="text-xs font-semibold text-indigo-400 min-w-[32px] text-right"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {progress}%
            </span>
          </div>

          <div className="flex justify-center gap-3 mb-7">
            {steps.map(({ Icon, label }, i) => {
              const done = progress >= 100 || i < activeStep;
              const active = !done && i === activeStep;
              const waiting = !done && !active;

              return (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border
                    transition-all duration-300
                    ${done ? 'bg-emerald-500/10 border-emerald-500/25' : ''}
                    ${active ? 'bg-indigo-500/10 border-indigo-500/30' : ''}
                    ${waiting ? 'bg-white/[0.02] border-white/[0.06]' : ''}`}
                  style={active ? { animation: 'ldr-pop 0.5s ease' } : undefined}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors duration-300
                      ${done ? 'text-emerald-400' : ''}
                      ${active ? 'text-indigo-400 animate-pulse' : ''}
                      ${waiting ? 'text-slate-600' : ''}`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors duration-300
                      ${done ? 'text-emerald-400/80' : ''}
                      ${active ? 'text-indigo-300' : ''}
                      ${waiting ? 'text-slate-600' : ''}`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {!serverReady && (
            <p className="text-slate-500 text-[11px] leading-relaxed px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              First visit may take a few seconds while the server starts up
            </p>
          )}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
//  404 PAGE
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  LANGUAGE STORAGE KEY
// ─────────────────────────────────────────────
const LANGUAGE_STORAGE_KEY = 'netprep-language';

// ─────────────────────────────────────────────
//  MAIN APP
// ─────────────────────────────────────────────
function App() {
  // Initialize language from localStorage with proper error handling
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      // Validate stored value
      if (stored === 'hi' || stored === 'en') {
        return stored;
      }
      return 'en'; // Default to English
    } catch {
      return 'en';
    }
  });

  const [serverReady, setServerReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const checkDone = useRef(false);

  // Memoized setLanguage to prevent unnecessary re-renders
  const setLanguage = useCallback((newLang) => {
    // Validate input
    if (newLang !== 'hi' && newLang !== 'en') {
      console.warn('Invalid language:', newLang);
      return;
    }
    
    setLanguageState(newLang);
    
    // Save to localStorage
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language to localStorage:', e);
    }
  }, []);

  // ── Minimum 2 sec loader display ──
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // ── Background server health check ──
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

    const ping = async () => {
      try {
        const r = await fetch(`${apiBase}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(30000),
        });
        if (r.ok) {
          setServerReady(true);
        } else {
          setTimeout(ping, 3000);
        }
      } catch {
        setTimeout(ping, 3000);
      }
    };

    ping();
  }, []);

  // ── Hide loader when server ready + min time passed ──
  useEffect(() => {
    if (serverReady && minTimePassed) {
      const t = setTimeout(() => setShowLoader(false), 1000);
      return () => clearTimeout(t);
    }
  }, [serverReady, minTimePassed]);

  // ── Sync language to localStorage whenever it changes ──
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {
      // Ignore storage errors
    }
  }, [language]);

  // ── Listen for storage changes from other tabs ──
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'hi' || e.newValue === 'en') {
          setLanguageState(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="font-sans antialiased">
          {showLoader && (
            <AdvancedLoader serverReady={serverReady && minTimePassed} />
          )}
          <Routes>
            {/* Dashboard */}
            <Route
              path="/"
              element={
                <Dashboard language={language} setLanguage={setLanguage} />
              }
            />
            
            {/* Question Bank */}
            <Route
              path="/questions"
              element={
                <QuestionBank
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Import Questions */}
            <Route
              path="/import"
              element={
                <ImportQuestions
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Tests */}
            <Route
              path="/tests"
              element={
                <TestListPage
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Create Test */}
            <Route
              path="/tests/create"
              element={
                <CreateTestPage
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Edit Test */}
            <Route
              path="/tests/edit/:id"
              element={
                <CreateTestPage
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Take Test */}
            <Route 
              path="/test/:id" 
              element={<TakeTest language={language} setLanguage={setLanguage} />} 
            />
            
            {/* Results List */}
            <Route
              path="/results"
              element={
                <Results language={language} setLanguage={setLanguage} />
              }
            />
            
            {/* Result Detail */}
            <Route
              path="/results/:id"
              element={
                <ResultDetail
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Solutions */}
            <Route
              path="/results/:id/solutions"
              element={
                <SolutionPage
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Syllabus Management - NEW */}
            <Route
              path="/syllabus"
              element={
                <ManageSyllabus
                  language={language}
                  setLanguage={setLanguage}
                />
              }
            />
            
            {/* Settings */}
            <Route
              path="/settings"
              element={
                <Settings language={language} setLanguage={setLanguage} />
              }
            />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;