import React, { useCallback, memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FileQuestion, Upload, ClipboardList, PlusCircle,
  BarChart3, Settings, ChevronLeft, ChevronRight, X, GraduationCap,
  BookOpen, Database,
  // ✅ NEW ICONS for PYQ Hub
  ScrollText, TrendingUp, Target, Sparkles, FlaskConical
} from 'lucide-react';

const Sidebar = memo(({ isOpen, onToggle, onClose, language = 'en', isMobile = false }) => {
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: { en: 'Dashboard', hi: 'डैशबोर्ड' }, icon: LayoutDashboard, path: '/' },
    { id: 'questions', label: { en: 'Question Bank', hi: 'प्रश्न बैंक' }, icon: FileQuestion, path: '/questions' },
    { id: 'import', label: { en: 'Import Questions', hi: 'प्रश्न आयात करें' }, icon: Upload, path: '/import' },
    { id: 'divider1', type: 'divider' },
    { id: 'tests', label: { en: 'All Tests', hi: 'सभी परीक्षाएं' }, icon: ClipboardList, path: '/tests' },
    { id: 'create-test', label: { en: 'Create Test', hi: 'परीक्षा बनाएं' }, icon: PlusCircle, path: '/tests/create' },
    { id: 'results', label: { en: 'Results', hi: 'परिणाम' }, icon: BarChart3, path: '/results' },
    { id: 'divider2', type: 'divider' },

    // ✅ NEW: PYQ Analysis Hub Section
    {
      id: 'pyq-section-header',
      type: 'section_header',
      label: { en: 'PYQ Analysis', hi: 'PYQ विश्लेषण' }
    },
    { id: 'pyq-dashboard', label: { en: 'PYQ Dashboard', hi: 'PYQ डैशबोर्ड' }, icon: ScrollText, path: '/pyq' },
    { id: 'pyq-trends', label: { en: 'Multi-Year Trends', hi: 'बहु-वर्ष रुझान' }, icon: TrendingUp, path: '/pyq/trends' },
    { id: 'pyq-heatmap', label: { en: 'Topic Heatmap', hi: 'विषय हीटमैप' }, icon: Target, path: '/pyq/heatmap' },
    { id: 'pyq-gaps', label: { en: 'Preparation Gaps', hi: 'तैयारी अंतर' }, icon: FlaskConical, path: '/pyq/gaps' },
    { id: 'pyq-predictions', label: { en: 'Predictions', hi: 'भविष्यवाणी' }, icon: Sparkles, path: '/pyq/predictions' },
    { id: 'pyq-import', label: { en: 'Import PYQ Data', hi: 'PYQ डेटा आयात' }, icon: Upload, path: '/pyq/import' },

    { id: 'divider3', type: 'divider' },
    { id: 'syllabus', label: { en: 'Manage Syllabus', hi: 'पाठ्यक्रम प्रबंधन' }, icon: Database, path: '/syllabus' },
    { id: 'settings', label: { en: 'Settings', hi: 'सेटिंग्स' }, icon: Settings, path: '/settings' }
  ];

  const isActiveRoute = useCallback((path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/tests') return location.pathname === '/tests';
    if (path === '/tests/create') return location.pathname === '/tests/create' || location.pathname.startsWith('/tests/edit');
    if (path === '/results') return location.pathname === '/results' || location.pathname.startsWith('/results/');
    // ✅ PYQ routes - exact match for sub-routes
    if (path === '/pyq') return location.pathname === '/pyq';
    if (path.startsWith('/pyq/')) return location.pathname === path;
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleNavClick = useCallback(() => {
    if (isMobile && onClose) {
      setTimeout(() => { onClose(); }, 50);
    }
  }, [isMobile, onClose]);

  const getLabel = useCallback((item) => {
    if (!item.label) return '';
    return language === 'hi' ? item.label.hi : item.label.en;
  }, [language]);

  return (
    <aside className={`
      fixed top-0 left-0 z-40 h-screen
      bg-white dark:bg-secondary-800 border-r border-gray-200 dark:border-secondary-700
      transition-all duration-300 ease-in-out
      ${isMobile ? `w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'}` : `${isOpen ? 'w-64' : 'w-20'}`}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-secondary-700">
        <NavLink to="/" className="flex items-center gap-3" onClick={handleNavClick}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {(isOpen || isMobile) && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white">NETprep</span>
              <span className="text-xs text-gray-500 dark:text-secondary-400">UGC NET Mock Test</span>
            </div>
          )}
        </NavLink>
        {isMobile && isOpen && (
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors lg:hidden">
            <X className="w-5 h-5 text-gray-500 dark:text-secondary-400" />
          </button>
        )}
        {!isMobile && (
          <button onClick={onToggle} className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors">
            {isOpen ? <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-secondary-400" /> : <ChevronRight className="w-5 h-5 text-gray-500 dark:text-secondary-400" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)] scrollbar-thin">
        {menuItems.map((item) => {
          // Divider
          if (item.type === 'divider') {
            return <div key={item.id} className="my-3 border-t border-gray-200 dark:border-secondary-700" />;
          }

          // ✅ NEW: Section Header
          if (item.type === 'section_header') {
            if (!isOpen && !isMobile) return null;
            return (
              <div key={item.id} className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-500 dark:text-primary-400">
                  {getLabel(item)}
                </span>
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          const label = getLabel(item);

          return (
            <NavLink key={item.id} to={item.path} onClick={handleNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-secondary-300 hover:bg-gray-100 dark:hover:bg-secondary-700 hover:text-gray-900 dark:hover:text-white'}
              `}
              title={!isOpen && !isMobile ? label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200
                ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-secondary-500 group-hover:text-gray-700 dark:group-hover:text-secondary-200'}`}
              />
              {(isOpen || isMobile) && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
              {isActive && (isOpen || isMobile) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      {(isOpen || isMobile) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-secondary-700 bg-gray-50 dark:bg-secondary-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center flex-shrink-0">
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
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;