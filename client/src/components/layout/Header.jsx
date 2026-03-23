// client/src/components/layout/Header.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Globe } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

const Header = ({ onMenuClick, language, onLanguageChange, sidebarOpen }) => {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);

  const getPageTitle = () => {
    const routes = {
      '/': { en: 'Dashboard', hi: 'डैशबोर्ड' },
      '/questions': { en: 'Question Bank', hi: 'प्रश्न बैंक' },
      '/import': { en: 'Import Questions', hi: 'प्रश्न आयात करें' },
      '/tests': { en: 'All Tests', hi: 'सभी परीक्षाएं' },
      '/tests/create': { en: 'Create Test', hi: 'परीक्षा बनाएं' },
      '/results': { en: 'Results', hi: 'परिणाम' },
      '/settings': { en: 'Settings', hi: 'सेटिंग्स' },
      '/pyq': { en: 'PYQ Analysis Hub', hi: 'PYQ विश्लेषण हब' },
      '/pyq/question-bank': { en: 'PYQ Question Bank', hi: 'PYQ प्रश्न बैंक' },
      '/pyq/trends': { en: 'Multi-Year Trends', hi: 'बहु-वर्ष रुझान' },
      '/pyq/heatmap': { en: 'Topic Heatmap', hi: 'विषय हीटमैप' },
      '/pyq/gaps': { en: 'Preparation Gaps', hi: 'तैयारी अंतर' },
      '/pyq/predictions': { en: 'Predictions', hi: 'भविष्यवाणी' },
      '/pyq/import': { en: 'Import PYQ Data', hi: 'PYQ डेटा आयात' },
    };

    if (location.pathname.startsWith('/test/')) return { en: 'Take Test', hi: 'परीक्षा दें' };
    if (location.pathname.startsWith('/results/')) return { en: 'Test Result', hi: 'परीक्षा परिणाम' };

    // Exact match first, then prefix
    if (routes[location.pathname]) return routes[location.pathname];
    if (location.pathname.startsWith('/pyq')) return { en: 'PYQ Analysis Hub', hi: 'PYQ विश्लेषण हब' };

    return { en: 'NETprep', hi: 'NETprep' };
  };

  const pageTitle = getPageTitle();
  const toggleLanguage = () => onLanguageChange(language === 'hi' ? 'en' : 'hi');

  // ── Sidebar widths: open = w-72 = 288px, collapsed = w-[4.5rem] = 72px ──
  const sidebarWidth = sidebarOpen ? '288px' : '72px';

  return (
    <header
      className="fixed top-0 right-0 z-20 bg-white/95 dark:bg-secondary-800/95 backdrop-blur-md border-b border-gray-200 dark:border-secondary-700 transition-all duration-300 ease-in-out"
      style={{
        left: typeof window !== 'undefined' && window.innerWidth >= 1024
          ? sidebarWidth
          : '0',
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'hi' ? pageTitle.hi : pageTitle.en}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors lg:hidden"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-secondary-300" />
          </button>

          <div className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-secondary-500" />
              <input
                type="text"
                placeholder={language === 'hi' ? 'खोजें...' : 'Search...'}
                className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-secondary-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:focus:border-primary-400 transition-colors"
              />
            </div>
          </div>

          <ThemeToggle size="md" showLabel={false} />

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-secondary-600 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors bg-white dark:bg-secondary-800"
          >
            <Globe className="w-4 h-4 text-gray-600 dark:text-secondary-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-secondary-200">
              {language === 'hi' ? 'हिंदी' : 'EN'}
            </span>
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="lg:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-secondary-500" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'खोजें...' : 'Search...'}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;