import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, language: propLanguage, setLanguage: propSetLanguage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  // Use prop language or fallback to local state
  const [localLanguage, setLocalLanguage] = useState(propLanguage || 'en');
  const language = propLanguage || localLanguage;
  const setLanguage = propSetLanguage || setLocalLanguage;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto open sidebar on desktop, close on mobile
      setSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        onClose={closeSidebar}
        language={language}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <div 
        className={`
          min-h-screen transition-all duration-300 ease-in-out
          ${!isMobile && sidebarOpen ? 'lg:ml-64' : ''}
          ${!isMobile && !sidebarOpen ? 'lg:ml-20' : ''}
        `}
      >
        {/* Header */}
        <Header 
          onMenuClick={toggleSidebar}
          language={language}
          onLanguageChange={setLanguage}
          sidebarOpen={sidebarOpen}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6 pt-20 lg:pt-24">
          <div className="max-w-7xl mx-auto">
            {typeof children === 'function' 
              ? children({ language, setLanguage })
              : children
            }
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/75 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default Layout;