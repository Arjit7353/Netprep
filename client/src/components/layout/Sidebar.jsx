import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileQuestion, 
  Upload, 
  ClipboardList,
  PlusCircle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ isOpen, onToggle, onClose, language = 'en', isMobile = false }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: { en: 'Dashboard', hi: 'डैशबोर्ड' },
      icon: LayoutDashboard,
      path: '/'
    },
    {
      id: 'questions',
      label: { en: 'Question Bank', hi: 'प्रश्न बैंक' },
      icon: FileQuestion,
      path: '/questions'
    },
    {
      id: 'import',
      label: { en: 'Import Questions', hi: 'प्रश्न आयात करें' },
      icon: Upload,
      path: '/import'
    },
    {
      id: 'divider1',
      type: 'divider'
    },
    {
      id: 'tests',
      label: { en: 'All Tests', hi: 'सभी परीक्षाएं' },
      icon: ClipboardList,
      path: '/tests'
    },
    {
      id: 'create-test',
      label: { en: 'Create Test', hi: 'परीक्षा बनाएं' },
      icon: PlusCircle,
      path: '/tests/create'
    },
    {
      id: 'results',
      label: { en: 'Results', hi: 'परिणाम' },
      icon: BarChart3,
      path: '/results'
    },
    {
      id: 'divider2',
      type: 'divider'
    },
    {
      id: 'settings',
      label: { en: 'Settings', hi: 'सेटिंग्स' },
      icon: Settings,
      path: '/settings'
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Handle nav click on mobile
  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside 
      className={`
        fixed top-0 left-0 z-40 h-screen
        bg-white dark:bg-secondary-800 border-r border-gray-200 dark:border-secondary-700
        transition-all duration-300 ease-in-out
        ${isMobile 
          ? `w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `${isOpen ? 'w-64' : 'w-20'}`
        }
      `}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-secondary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {(isOpen || isMobile) && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white">NETprep</span>
              <span className="text-xs text-gray-500 dark:text-secondary-400">UGC NET Mock Test</span>
            </div>
          )}
        </div>
        
        {/* Close Button for Mobile */}
        {isMobile && isOpen && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
          </button>
        )}
        
        {/* Toggle Button - Desktop Only */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
        {menuItems.map((item) => {
          if (item.type === 'divider') {
            return (
              <div 
                key={item.id} 
                className="my-3 border-t border-gray-200 dark:border-secondary-700" 
              />
            );
          }

          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          const label = language === 'hi' ? item.label.hi : item.label.en;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                group
                ${isActive 
                  ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300' 
                  : 'text-gray-600 dark:text-secondary-300 hover:bg-gray-100 dark:hover:bg-secondary-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
              title={!isOpen && !isMobile ? label : undefined}
            >
              <Icon 
                className={`
                  w-5 h-5 flex-shrink-0
                  ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-secondary-500 group-hover:text-gray-700 dark:group-hover:text-secondary-200'}
                `} 
              />
              {(isOpen || isMobile) && (
                <span className="text-sm font-medium truncate">
                  {label}
                </span>
              )}
              
              {/* Active Indicator */}
              {isActive && (isOpen || isMobile) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      {(isOpen || isMobile) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-secondary-700 bg-gray-50 dark:bg-secondary-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 dark:text-primary-300 font-bold text-sm">NP</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {language === 'hi' ? 'पेपर 1 और 2' : 'Paper 1 & 2'}
              </p>
              <p className="text-xs text-gray-500 dark:text-secondary-400">
                {language === 'hi' ? 'इतिहास' : 'History'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;