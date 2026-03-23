import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, language: propLanguage, setLanguage: propSetLanguage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [localLanguage, setLocalLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('netprep-language');
      return (stored === 'hi' || stored === 'en') ? stored : 'en';
    } catch { return 'en'; }
  });

  const language = propLanguage ?? localLanguage;

  const setLanguage = useCallback((newLang) => {
    if (propSetLanguage) propSetLanguage(newLang);
    else {
      setLocalLanguage(newLang);
      try { localStorage.setItem('netprep-language', newLang); } catch {}
    }
  }, [propSetLanguage]);

  useEffect(() => {
    if (propLanguage && propLanguage !== localLanguage) setLocalLanguage(propLanguage);
  }, [propLanguage]);

  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 1024;
      setIsMobile(m);
      setSidebarOpen(!m);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ⌘B toggle
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(p => !p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const toggle = useCallback(() => setSidebarOpen(p => !p), []);
  const close = useCallback(() => { if (isMobile) setSidebarOpen(false); }, [isMobile]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900">
      <Sidebar isOpen={sidebarOpen} onToggle={toggle} onClose={close} language={language} isMobile={isMobile} />

      <div className={`min-h-screen sb-content-push ${
        !isMobile && sidebarOpen ? 'lg:ml-[264px]' : ''
      } ${
        !isMobile && !sidebarOpen ? 'lg:ml-[66px]' : ''
      }`}>
        <Header
          onMenuClick={toggle}
          language={language}
          onLanguageChange={setLanguage}
          sidebarOpen={sidebarOpen}
        />

        <main className="p-4 lg:p-6 pt-20 lg:pt-24">
          <div className="max-w-7xl mx-auto">
            {typeof children === 'function'
              ? children({ language, setLanguage })
              : children
            }
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/30 dark:bg-black/50 backdrop-blur-[3px]"
          style={{ animation: 'sb-fade-in 0.2s ease both' }}
          onClick={close}
        />
      )}
    </div>
  );
};

export default Layout;