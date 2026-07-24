import React, { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileQuestion, Upload, ClipboardList, PlusCircle,
  BarChart3, Settings, ChevronLeft, ChevronRight, X, GraduationCap,
  BookOpen, Database, ScrollText, TrendingUp, Target, Sparkles, CalendarCheck,
  FlaskConical, Library, Search, ChevronDown, Command,
  Keyboard, HelpCircle, ArrowRight, Layers, Hash, Zap, AlertTriangle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CUSTOM CSS — injected once
   ═══════════════════════════════════════════════════════ */
const SIDEBAR_CSS = `
  @keyframes sb-shimmer {
    0%   { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  @keyframes sb-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sb-slide-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes sb-scale-in {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes sb-flyout {
    from { opacity: 0; transform: translateX(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes sb-glow-pulse {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 1; }
  }
  .sb-shimmer-badge {
    background-size: 200% auto;
    animation: sb-shimmer 4s ease-in-out infinite;
  }
  .sb-fade-in   { animation: sb-fade-in 0.25s ease both; }
  .sb-slide-in  { animation: sb-slide-in 0.2s ease both; }
  .sb-scale-in  { animation: sb-scale-in 0.2s cubic-bezier(0.32,0.72,0,1) both; }
  .sb-flyout    { animation: sb-flyout 0.22s cubic-bezier(0.32,0.72,0,1) both; }

  /* smooth scrollbar */
  .sb-scroll::-webkit-scrollbar { width: 4px; }
  .sb-scroll::-webkit-scrollbar-track { background: transparent; }
  .sb-scroll::-webkit-scrollbar-thumb {
    background: transparent; border-radius: 99px;
  }
  .sb-scroll:hover::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.12);
  }
  .dark .sb-scroll:hover::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
  }

  /* nav item hover fill */
  .sb-nav-fill {
    position: relative;
    isolation: isolate;
  }
  .sb-nav-fill::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: -1;
  }
  .sb-nav-fill:hover::before {
    opacity: 0.06;
  }
  .dark .sb-nav-fill:hover::before {
    opacity: 0.08;
  }

  /* glow for active */
  .sb-active-glow {
    box-shadow: 0 0 0 1px rgba(99,102,241,0.08),
                0 1px 3px rgba(99,102,241,0.06);
  }
  .dark .sb-active-glow {
    box-shadow: 0 0 0 1px rgba(129,140,248,0.1),
                0 1px 4px rgba(129,140,248,0.05);
  }

  /* sidebar transition */
  .sb-container {
    transition: width 380ms cubic-bezier(0.32, 0.72, 0, 1),
                transform 380ms cubic-bezier(0.32, 0.72, 0, 1);
    will-change: width, transform;
  }

  /* text collapse */
  .sb-text-collapse {
    transition: max-width 320ms cubic-bezier(0.32,0.72,0,1),
                opacity 200ms ease,
                margin 320ms cubic-bezier(0.32,0.72,0,1);
    will-change: max-width, opacity;
  }

  /* content push */
  .sb-content-push {
    transition: margin-left 380ms cubic-bezier(0.32, 0.72, 0, 1);
    will-change: margin-left;
  }
`;

// Inject CSS once
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'sidebar-pro-css';
  style.textContent = SIDEBAR_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

/* ═══════════════════════════════════════════════════════
   MENU CONFIGURATION
   ═══════════════════════════════════════════════════════ */
const MENU = [
  {
    id: 'main',
    label: { en: 'Overview', hi: 'अवलोकन' },
    items: [
      { id: 'dashboard', label: { en: 'Dashboard', hi: 'डैशबोर्ड' }, icon: LayoutDashboard, path: '/', shortcut: 'D' },
      { id: 'planner', label: { en: 'Mission JRF Planner', hi: 'मिशन JRF टाइमटेबल' }, icon: CalendarCheck, path: '/planner', shortcut: 'P', accent: true },
      { id: 'questions', label: { en: 'Question Bank', hi: 'प्रश्न बैंक' }, icon: FileQuestion, path: '/questions', shortcut: 'Q' },
      { id: 'import', label: { en: 'Import', hi: 'आयात करें' }, icon: Upload, path: '/import', shortcut: 'I' },
    ]
  },
  {
    id: 'tests',
    label: { en: 'Tests', hi: 'परीक्षा' },
    items: [
      { id: 'tests', label: { en: 'All Tests', hi: 'सभी परीक्षाएं' }, icon: ClipboardList, path: '/tests', shortcut: 'T' },
      { id: 'create-test', label: { en: 'Create Test', hi: 'परीक्षा बनाएं' }, icon: PlusCircle, path: '/tests/create', shortcut: 'N', accent: true },
      { id: 'results', label: { en: 'Results', hi: 'परिणाम' }, icon: BarChart3, path: '/results', shortcut: 'R' },
    ]
  },
  {
    id: 'pyq',
    label: { en: 'PYQ Analysis', hi: 'PYQ विश्लेषण' },
    collapsible: true,
    sectionIcon: ScrollText,
    items: [
      { id: 'pyq-dashboard', label: { en: 'PYQ Dashboard', hi: 'PYQ डैशबोर्ड' }, icon: ScrollText, path: '/pyq' },
      { id: 'pyq-bank', label: { en: 'PYQ Questions', hi: 'PYQ प्रश्न' }, icon: Library, path: '/pyq/question-bank' },
      { id: 'pyq-trends', label: { en: 'Multi-Year Trends', hi: 'बहु-वर्ष रुझान' }, icon: TrendingUp, path: '/pyq/trends' },
      { id: 'pyq-heatmap', label: { en: 'Topic Heatmap', hi: 'विषय हीटमैप' }, icon: Target, path: '/pyq/heatmap' },
      { id: 'pyq-gaps', label: { en: 'Prep Gaps', hi: 'तैयारी अंतर' }, icon: FlaskConical, path: '/pyq/gaps' },
      { id: 'pyq-predict', label: { en: 'Predictions', hi: 'भविष्यवाणी' }, icon: Sparkles, path: '/pyq/predictions', tag: 'AI' },
      { id: 'pyq-import', label: { en: 'Import PYQ', hi: 'PYQ आयात' }, icon: Upload, path: '/pyq/import' },
    ]
  },
  {
    id: 'system',
    label: { en: 'System', hi: 'सिस्टम' },
    items: [
      { id: 'syllabus', label: { en: 'Syllabus', hi: 'पाठ्यक्��म' }, icon: Database, path: '/syllabus' },      { id: 'reports', label: { en: 'Question Reports', hi: 'प्रश्न रिपोर्ट' }, icon: AlertTriangle, path: '/reports' },      { id: 'settings', label: { en: 'Settings', hi: 'सेटिंग्स' }, icon: Settings, path: '/settings', shortcut: ',' },
    ]
  }
];

/* ═══════════════════════════════════════════════════════
   ROUTE MATCHER
   ═══════════════════════════════════════════════════════ */
const matchRoute = (path, pathname) => {
  if (path === '/') return pathname === '/';
  if (path === '/tests') return pathname === '/tests';
  if (path === '/tests/create') return pathname === '/tests/create' || pathname.startsWith('/tests/edit');
  if (path === '/results') return pathname === '/results' || pathname.startsWith('/results/');
  if (path === '/pyq') return pathname === '/pyq' && !pathname.includes('/pyq/');
  return pathname.startsWith(path);
};

/* ═══════════════════════════════════════════════════════
   COMMAND PALETTE
   ═══════════════════════════════════════════════════════ */
const CommandPalette = memo(({ open, onClose, lang }) => {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allItems = useMemo(() =>
    MENU.flatMap(s => s.items.map(i => ({ ...i, section: s.label }))),
    []
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return allItems;
    const lower = q.toLowerCase();
    return allItems.filter(i =>
      i.label.en.toLowerCase().includes(lower) ||
      i.label.hi.includes(lower) ||
      i.path.includes(lower) ||
      i.id.includes(lower)
    );
  }, [q, allItems]);

  useEffect(() => {
    if (open) {
      setQ(''); setSel(0);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => setSel(0), [q]);

  const go = useCallback((path) => { navigate(path); onClose(); }, [navigate, onClose]);

  const onKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && filtered[sel]) { go(filtered[sel].path); }
    else if (e.key === 'Escape') { onClose(); }
  }, [filtered, sel, go, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[18vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[6px]" />

      {/* Panel */}
      <div
        className="relative w-full max-w-[520px] mx-4 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-200/60 dark:border-secondary-700/60 overflow-hidden sb-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-gray-100 dark:border-secondary-700/80">
          <Search className="w-[18px] h-[18px] text-gray-300 dark:text-secondary-600 flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder={lang === 'hi' ? 'कहीं भी जाएं...' : 'Go anywhere...'}
            className="flex-1 bg-transparent text-[15px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-secondary-500 outline-none font-medium"
            autoComplete="off"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-secondary-500 bg-gray-100 dark:bg-secondary-700 rounded-md border border-gray-200/80 dark:border-secondary-600/60">
              esc
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto sb-scroll py-2 px-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-secondary-500">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">{lang === 'hi' ? 'कोई परिणाम नहीं' : 'No results'}</p>
            </div>
          )}
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            const active = idx === sel;
            return (
              <button
                key={item.id}
                onClick={() => go(item.path)}
                onMouseEnter={() => setSel(idx)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                  transition-colors duration-100
                  ${active
                    ? 'bg-primary-50 dark:bg-primary-950/50'
                    : 'hover:bg-gray-50 dark:hover:bg-secondary-750'
                  }
                `}
              >
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-100
                  ${active
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400'
                  }
                `}>
                  <Icon className="w-[16px] h-[16px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate ${active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {lang === 'hi' ? item.label.hi : item.label.en}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-secondary-500 truncate font-medium">
                    {lang === 'hi' ? item.section.hi : item.section.en}
                  </p>
                </div>
                {item.shortcut && (
                  <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-gray-400 dark:text-secondary-500 bg-gray-100 dark:bg-secondary-700 rounded-md border border-gray-200/60 dark:border-secondary-600/50">
                    ⌘{item.shortcut}
                  </kbd>
                )}
                <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 ${active ? 'text-primary-400 translate-x-0 opacity-100' : 'text-gray-300 -translate-x-1 opacity-0'}`} />
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-5 px-5 py-2.5 border-t border-gray-100 dark:border-secondary-700/60 bg-gray-50/60 dark:bg-secondary-900/40">
          {[
            { keys: '↑↓', label: 'Navigate' },
            { keys: '↵', label: 'Open' },
            { keys: 'Esc', label: 'Close' }
          ].map(h => (
            <span key={h.label} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-secondary-500">
              <kbd className="px-1 py-0.5 bg-gray-200/80 dark:bg-secondary-600/80 rounded text-[9px] font-mono leading-none">{h.keys}</kbd>
              {h.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════
   COLLAPSIBLE SECTION (for PYQ)
   ═══════════════════════════════════════════════════════ */
const CollapsibleNav = memo(({ section, lang, collapsed, isActive, onNav }) => {
  const [open, setOpen] = useState(true);
  const loc = useLocation();
  const hasActive = section.items.some(i => matchRoute(i.path, loc.pathname));
  const SIcon = section.sectionIcon;

  useEffect(() => { if (hasActive) setOpen(true); }, [loc.pathname]);

  // ── Collapsed: icon with flyout ──
  if (collapsed) {
    return (
      <div className="relative group/fly">
        <div className={`
          flex items-center justify-center py-2.5 mx-auto w-11 rounded-xl cursor-default transition-colors duration-150
          ${hasActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-secondary-500 group-hover/fly:text-gray-600 dark:group-hover/fly:text-secondary-300'}
        `}>
          {SIcon && <SIcon className="w-[18px] h-[18px]" />}
          {hasActive && <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500 dark:bg-primary-400" />}
        </div>

        {/* Flyout */}
        <div className="absolute left-full top-0 ml-2 w-52 py-1.5 bg-white dark:bg-secondary-800 rounded-xl shadow-xl shadow-black/8 dark:shadow-black/20 border border-gray-200/80 dark:border-secondary-700/60 opacity-0 invisible group-hover/fly:opacity-100 group-hover/fly:visible pointer-events-none group-hover/fly:pointer-events-auto z-50 sb-flyout">
          <div className="px-3.5 py-2 border-b border-gray-100 dark:border-secondary-700/60">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-secondary-500">
              {lang === 'hi' ? section.label.hi : section.label.en}
            </p>
          </div>
          <div className="py-1 px-1.5">
            {section.items.map(item => {
              const Icon = item.icon;
              const act = matchRoute(item.path, loc.pathname);
              return (
                <NavLink key={item.id} to={item.path} onClick={onNav}
                  className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12.5px] font-medium transition-colors duration-100
                    ${act ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold' : 'text-gray-600 dark:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700/50'}
                  `}>
                  <Icon className="w-[15px] h-[15px] flex-shrink-0" />
                  <span className="truncate">{lang === 'hi' ? item.label.hi : item.label.en}</span>
                  {item.tag && (
                    <span className="ml-auto px-1.5 py-[1px] text-[8px] font-extrabold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full leading-tight">
                      {item.tag}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Expanded: collapsible tree ──
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors duration-150 group/sec
          ${hasActive ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-secondary-400 hover:text-gray-700 dark:hover:text-secondary-200'}
        `}>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? '' : '-rotate-90'}`} />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] select-none flex-1 text-left truncate">
          {lang === 'hi' ? section.label.hi : section.label.en}
        </span>
        <span className="text-[10px] font-semibold text-gray-400/60 dark:text-secondary-600 tabular-nums">{section.items.length}</span>
      </button>

      <div className={`overflow-hidden transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ transitionProperty: 'max-height, opacity' }}>
        <div className="ml-[11px] pl-3 border-l-[1.5px] border-gray-150 dark:border-secondary-700/70 space-y-[2px] pb-1 pt-0.5">
          {section.items.map((item, i) => {
            const Icon = item.icon;
            const act = matchRoute(item.path, loc.pathname);
            return (
              <NavLink key={item.id} to={item.path} onClick={onNav}
                className={`sb-nav-fill flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl transition-all duration-150 group/item relative
                  ${act ? 'text-primary-700 dark:text-primary-300 sb-active-glow bg-primary-50/80 dark:bg-primary-950/50' : 'text-gray-600 dark:text-secondary-300'}
                `}
                style={{ animationDelay: open ? `${i * 25}ms` : '0ms' }}
              >
                {act && (
                  <div className="absolute -left-[14.5px] top-1/2 -translate-y-1/2">
                    <div className="w-[7px] h-[7px] rounded-full bg-primary-500 dark:bg-primary-400 ring-[2.5px] ring-primary-100 dark:ring-primary-900/60" />
                  </div>
                )}
                <Icon className={`w-[15px] h-[15px] flex-shrink-0 transition-colors duration-150
                  ${act ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-secondary-500 group-hover/item:text-gray-500 dark:group-hover/item:text-secondary-400'}
                `} />
                <span className={`text-[12.5px] truncate ${act ? 'font-semibold' : 'font-medium'}`}>
                  {lang === 'hi' ? item.label.hi : item.label.en}
                </span>
                {item.tag && (
                  <span className="ml-auto px-1.5 py-[1px] text-[8px] font-extrabold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white rounded-full leading-tight sb-shimmer-badge"
                    style={{ backgroundSize: '200% auto' }}>
                    {item.tag}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════
   SINGLE NAV ITEM
   ═══════════════════════════════════════════════════════ */
const NavItem = memo(({ item, active, collapsed, lang, onClick, idx }) => {
  const Icon = item.icon;
  const label = lang === 'hi' ? item.label.hi : item.label.en;

  // ── Collapsed ──
  if (collapsed) {
    return (
      <NavLink to={item.path} onClick={onClick}
        className={`group/nav relative flex items-center justify-center w-11 py-2.5 mx-auto rounded-xl transition-all duration-150
          ${active
            ? 'text-primary-600 dark:text-primary-400 sb-active-glow bg-primary-50/80 dark:bg-primary-950/50'
            : item.accent
              ? 'text-primary-500 dark:text-primary-400 hover:bg-primary-50/60 dark:hover:bg-primary-950/30'
              : 'text-gray-400 dark:text-secondary-500 hover:text-gray-600 dark:hover:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700/40'
          }
        `}
        title={label}
      >
        {active && <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-500 dark:bg-primary-400" />}
        {item.accent && !active && <div className="absolute inset-0 rounded-xl border border-dashed border-primary-300/50 dark:border-primary-700/40" />}
        <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 2} />

        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-3 py-2 min-w-[130px] bg-gray-900 dark:bg-secondary-700 text-white rounded-xl shadow-xl opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-150 pointer-events-none z-50">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-semibold whitespace-nowrap">{label}</span>
            {item.shortcut && <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white/10 rounded">{item.shortcut}</kbd>}
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-secondary-700" />
        </div>
      </NavLink>
    );
  }

  // ── Expanded ──
  return (
    <NavLink to={item.path} onClick={onClick}
      className={`sb-nav-fill group/nav relative flex items-center gap-3 px-3 py-[9px] rounded-xl transition-all duration-150
        ${active
          ? 'text-primary-700 dark:text-primary-300 sb-active-glow bg-primary-50/80 dark:bg-primary-950/50'
          : 'text-gray-600 dark:text-secondary-300'
        }
        ${item.accent && !active ? 'border border-dashed border-primary-200/80 dark:border-primary-800/50 text-primary-600 dark:text-primary-400' : ''}
      `}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary-500 dark:bg-primary-400" />}
      <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
        ${active ? 'text-primary-600 dark:text-primary-400' : item.accent ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-secondary-500 group-hover/nav:text-gray-500 dark:group-hover/nav:text-secondary-400'}
      `} strokeWidth={active ? 2.3 : 2} />
      <span className={`text-[13px] flex-1 truncate ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
      {item.shortcut && (
        <kbd className="hidden xl:inline px-1.5 py-0.5 text-[9px] font-mono text-gray-400/70 dark:text-secondary-600 bg-gray-100/80 dark:bg-secondary-700/60 rounded-md border border-gray-200/60 dark:border-secondary-600/40 transition-opacity duration-150 opacity-0 group-hover/nav:opacity-100">
          ⌘{item.shortcut}
        </kbd>
      )}
      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400 flex-shrink-0" style={{ animation: 'sb-glow-pulse 2s ease-in-out infinite' }} />}
    </NavLink>
  );
});

/* ═══════════════════════════════════════════════════════
   MAIN SIDEBAR
   ═══════════════════════════════════════════════════════ */
const Sidebar = memo(({ isOpen, onToggle, onClose, language = 'en', isMobile = false }) => {
  const loc = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => { injectCSS(); }, []);

  // ⌘K
  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(o => !o); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const onNav = useCallback(() => { if (isMobile && onClose) setTimeout(onClose, 60); }, [isMobile, onClose]);
  const collapsed = !isOpen && !isMobile;

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} lang={language} />

      <aside className={`
        sb-container fixed top-0 left-0 z-40 h-screen flex flex-col
        bg-white/95 dark:bg-secondary-800/95 backdrop-blur-xl
        border-r border-gray-200/70 dark:border-secondary-700/60
        ${isMobile
          ? `w-[280px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : isOpen ? 'w-[264px]' : 'w-[66px]'
        }
      `}>

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between h-[60px] px-3.5 border-b border-gray-100/80 dark:border-secondary-700/50 flex-shrink-0">
          <NavLink to="/" onClick={onNav} className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-[38px] h-[38px] bg-gradient-to-br from-primary-500 to-primary-700 rounded-[12px] flex items-center justify-center shadow-lg shadow-primary-600/20 dark:shadow-primary-400/10">
                <GraduationCap className="w-[20px] h-[20px] text-white" strokeWidth={2.2} />
              </div>
              <div className="absolute -bottom-[2px] -right-[2px] w-[10px] h-[10px] bg-emerald-500 rounded-full border-2 border-white dark:border-secondary-800" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 sb-slide-in">
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    NETprep
                  </span>
                  <span className="px-[5px] py-[2px] text-[7px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white rounded-[5px] leading-none sb-shimmer-badge"
                    style={{ backgroundSize: '200% auto' }}>
                    Pro
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-secondary-500 font-medium -mt-[1px] tracking-wide">
                  UGC NET History
                </span>
              </div>
            )}
          </NavLink>

          {isMobile && isOpen && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors active:scale-90 flex-shrink-0">
              <X className="w-[18px] h-[18px] text-gray-400" />
            </button>
          )}
          {!isMobile && (
            <button onClick={onToggle} className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary-700 transition-all duration-150 flex-shrink-0 active:scale-90">
              <ChevronLeft className={`w-4 h-4 text-gray-400 dark:text-secondary-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* ─── SEARCH TRIGGER ─── */}
        <div className={`flex-shrink-0 ${collapsed ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
          {collapsed ? (
            <button onClick={() => setCmdOpen(true)}
              className="w-full flex items-center justify-center py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-secondary-700/50 transition-colors group" title="⌘K">
              <Search className="w-[17px] h-[17px] text-gray-400 dark:text-secondary-500 group-hover:text-gray-500 dark:group-hover:text-secondary-400 transition-colors" />
            </button>
          ) : (
            <button onClick={() => setCmdOpen(true)}
              className="sb-slide-in w-full flex items-center gap-2.5 px-3 py-[9px] rounded-xl bg-gray-50/80 dark:bg-secondary-700/30 hover:bg-gray-100/80 dark:hover:bg-secondary-700/60 border border-gray-200/60 dark:border-secondary-600/30 transition-all duration-150 group">
              <Search className="w-[15px] h-[15px] text-gray-400 dark:text-secondary-500 flex-shrink-0" />
              <span className="flex-1 text-left text-[12px] text-gray-400 dark:text-secondary-500 font-medium">{language === 'hi' ? 'खोजें...' : 'Search...'}</span>
              <kbd className="hidden sm:flex items-center gap-[2px] px-[6px] py-[3px] text-[9px] font-mono font-semibold text-gray-400 dark:text-secondary-500 bg-white dark:bg-secondary-600/50 rounded-md border border-gray-200/70 dark:border-secondary-500/40 shadow-sm">
                <Command className="w-[10px] h-[10px]" />K
              </kbd>
            </button>
          )}
        </div>

        {/* ─── NAVIGATION ─── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden sb-scroll px-2 pb-3">
          {MENU.map((section, si) => (
            <div key={section.id}>
              {/* Section divider */}
              {si > 0 && (
                <div className={`my-2 ${collapsed ? 'mx-2' : 'mx-1'}`}>
                  <div className="h-[1px] bg-gray-100 dark:bg-secondary-700/50" />
                </div>
              )}

              {/* Collapsible section */}
              {section.collapsible ? (
                <CollapsibleNav section={section} lang={language} collapsed={collapsed} isActive={matchRoute} onNav={onNav} />
              ) : (
                <>
                  {/* Section label */}
                  {!collapsed && (
                    <div className="px-3 pt-3 pb-[6px]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400/70 dark:text-secondary-500/70 select-none">
                        {language === 'hi' ? section.label.hi : section.label.en}
                      </span>
                    </div>
                  )}

                  {/* Items */}
                  <div className={`space-y-[2px] ${collapsed ? '' : ''}`}>
                    {section.items.map((item, ii) => (
                      <NavItem key={item.id} item={item} active={matchRoute(item.path, loc.pathname)} collapsed={collapsed} lang={language} onClick={onNav} idx={ii} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </nav>

        {/* ─── FOOTER ─── */}
        <div className="flex-shrink-0 border-t border-gray-100/80 dark:border-secondary-700/50">
          {/* Quick actions — expanded only */}
          {!collapsed && (
            <div className="px-3 pt-2 pb-1 flex gap-1 sb-fade-in">
              {[
                { icon: HelpCircle, label: language === 'hi' ? 'सहायता' : 'Help' },
                { icon: Keyboard, label: language === 'hi' ? 'शॉर्टकट' : 'Shortcuts', action: () => setCmdOpen(true) },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  className="flex-1 flex items-center justify-center gap-1.5 py-[6px] rounded-lg text-[10px] font-semibold text-gray-400 dark:text-secondary-500 hover:text-gray-600 dark:hover:text-secondary-300 hover:bg-gray-50 dark:hover:bg-secondary-700/40 transition-colors">
                  <btn.icon className="w-3 h-3" />
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom card */}
          <div className={`${collapsed ? 'px-2 py-3' : 'px-3 py-2.5'}`}>
            {collapsed ? (
              <div className="flex items-center justify-center">
                <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/30 flex items-center justify-center ring-1 ring-primary-200/50 dark:ring-primary-700/30"
                  title={language === 'hi' ? 'पेपर 1 और 2' : 'Paper 1 & 2'}>
                  <BookOpen className="w-[15px] h-[15px] text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-br from-gray-50/80 to-gray-100/50 dark:from-secondary-700/30 dark:to-secondary-700/10 border border-gray-100/80 dark:border-secondary-700/40 sb-fade-in">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/40 flex items-center justify-center flex-shrink-0 ring-1 ring-primary-200/50 dark:ring-primary-700/30">
                  <BookOpen className="w-[14px] h-[14px] text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">
                    {language === 'hi' ? 'पेपर 1 और 2' : 'Paper 1 & 2'}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-secondary-500 truncate font-medium">
                    {language === 'hi' ? 'इतिहास (कोड 06)' : 'History · Code 06'}
                  </p>
                </div>
                <span className="px-[5px] py-[2px] text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/25 rounded-md ring-1 ring-emerald-200/50 dark:ring-emerald-700/30 flex-shrink-0">
                  v2.0
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
export default Sidebar;