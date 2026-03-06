// client/src/components/common/PDFExportButton.jsx
// ⭐ ADVANCED PDF EXPORT BUTTON v4.0
// Features: Smart positioning, Smooth animations, Mobile friendly, Better UX

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FileDown, Loader2, Check, X, AlertCircle,
  FileText, CheckCircle, Globe, ChevronDown, FileCheck,
  Download, Sparkles
} from 'lucide-react';

import { downloadTestPDF, downloadResultsPDF } from '../../utils/pdfExportHTML';

// ═══════════════════════════════════════════════════════
//                    MAIN COMPONENT
// ═══════════════════════════════════════════════════════

const PDFExportButton = ({
  type = 'test',
  test,
  questions,
  attempt = null,
  language = 'en',
  className = '',
  variant = 'default', // 'default' | 'icon' | 'compact' | 'minimal'
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // ─── Close dropdown on outside click ───
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };

    const handleScroll = () => {
      if (showDropdown) updateDropdownPosition();
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showDropdown]);

  // ─── Calculate dropdown position ───
  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 280;
    const dropdownHeight = 320;
    const padding = 8;

    let top = rect.bottom + padding;
    let left = rect.right - dropdownWidth;

    // Adjust if goes off right edge
    if (left < padding) {
      left = rect.left;
    }

    // Adjust if goes off left edge
    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding;
    }

    // Adjust if goes off bottom - show above button
    if (top + dropdownHeight > window.innerHeight - padding) {
      top = rect.top - dropdownHeight - padding;
    }

    // Ensure not off top
    if (top < padding) {
      top = padding;
    }

    setDropdownPosition({ top, left });
  }, []);

  // ─── Toggle dropdown ───
  const toggleDropdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (loading) return;
    
    if (!showDropdown) {
      updateDropdownPosition();
    }
    setShowDropdown(!showDropdown);
  };

  // ─── Ensure questions array ───
  const ensureArr = (d) => {
    if (Array.isArray(d)) return d;
    if (d?.data) return ensureArr(d.data);
    if (d?.questions) return ensureArr(d.questions);
    return [];
  };

  const questionsArray = ensureArr(questions);
  const hasQuestions = questionsArray.length > 0;

  // ─── Handle export ───
  const handleExport = async (lang, includeAnswers = false) => {
    if (!hasQuestions && type === 'test') {
      setError('No questions loaded');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setShowDropdown(false);
    onExportStart?.();

    try {
      let result;

      if (type === 'result') {
        result = await downloadResultsPDF(attempt, test, questionsArray, lang);
      } else {
        result = await downloadTestPDF(test, questionsArray, lang, includeAnswers);
      }

      if (result.success) {
        setSuccess(true);
        onExportComplete?.(result);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('PDF Export error:', err);
      setError(err.message || 'Export failed');
      onExportError?.(err);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  // ─── Get button state styles ───
  const getButtonState = () => {
    if (loading) return 'loading';
    if (success) return 'success';
    if (error) return 'error';
    return 'idle';
  };

  const state = getButtonState();

  // ═══════════════════════════════════════════════════════
  //                    RENDER VARIANTS
  // ═══════════════════════════════════════════════════════

  // ─── MINIMAL VARIANT ───
  if (variant === 'minimal') {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          disabled={loading}
          className={`
            relative p-1.5 rounded-md transition-all duration-200
            ${state === 'success' ? 'text-green-600 bg-green-50' : ''}
            ${state === 'error' ? 'text-red-500 bg-red-50' : ''}
            ${state === 'loading' ? 'text-blue-500' : ''}
            ${state === 'idle' ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : ''}
            disabled:opacity-50 ${className}
          `}
          title="Download PDF"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4" />
          ) : error ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
        </button>
        
        {showDropdown && (
          <DropdownPortal
            ref={dropdownRef}
            position={dropdownPosition}
            onExport={handleExport}
            onClose={() => setShowDropdown(false)}
            hasQuestions={hasQuestions}
            questionsCount={questionsArray.length}
            type={type}
            language={language}
          />
        )}
      </>
    );
  }

  // ─── ICON VARIANT ───
  if (variant === 'icon') {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          disabled={loading}
          className={`
            relative p-2 rounded-xl border-2 transition-all duration-300 
            focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed
            ${state === 'success' 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 text-green-600 shadow-green-100' 
              : state === 'error' 
                ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 text-red-500 shadow-red-100'
                : state === 'loading'
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 text-blue-600'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-sm hover:shadow-md'
            }
            ${className}
          `}
          title="Download PDF"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4 animate-bounce-in" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 animate-shake" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          
          {/* Pulse ring on hover */}
          {state === 'idle' && (
            <span className="absolute inset-0 rounded-xl border-2 border-blue-400 opacity-0 hover:opacity-100 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
          )}
        </button>
        
        {showDropdown && (
          <DropdownPortal
            ref={dropdownRef}
            position={dropdownPosition}
            onExport={handleExport}
            onClose={() => setShowDropdown(false)}
            hasQuestions={hasQuestions}
            questionsCount={questionsArray.length}
            type={type}
            language={language}
          />
        )}
      </>
    );
  }

  // ─── COMPACT VARIANT ───
  if (variant === 'compact') {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          disabled={loading}
          className={`
            relative inline-flex items-center gap-1.5 px-3 py-1.5 
            text-xs font-bold rounded-xl border-2 
            transition-all duration-300 
            focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed
            ${state === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-lg shadow-green-500/30'
              : state === 'error'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                : state === 'loading'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5'
            }
            ${className}
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : success ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Done!</span>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        
        {showDropdown && (
          <DropdownPortal
            ref={dropdownRef}
            position={dropdownPosition}
            onExport={handleExport}
            onClose={() => setShowDropdown(false)}
            hasQuestions={hasQuestions}
            questionsCount={questionsArray.length}
            type={type}
            language={language}
          />
        )}
      </>
    );
  }

  // ─── DEFAULT VARIANT ───
  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={loading}
        className={`
          relative inline-flex items-center gap-2 px-4 py-2.5 
          font-bold rounded-2xl border-2 
          transition-all duration-300 
          focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${state === 'success'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 text-white shadow-xl shadow-green-500/30'
            : state === 'error'
              ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-500 text-white shadow-xl shadow-red-500/30'
              : state === 'loading'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 text-white shadow-xl shadow-blue-500/30'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-xl hover:-translate-y-1'
          }
          ${className}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Generating PDF...</span>
          </>
        ) : success ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm">Downloaded!</span>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm truncate max-w-[120px]">{error}</span>
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            <span className="text-sm">Download PDF</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      
      {showDropdown && (
        <DropdownPortal
          ref={dropdownRef}
          position={dropdownPosition}
          onExport={handleExport}
          onClose={() => setShowDropdown(false)}
          hasQuestions={hasQuestions}
          questionsCount={questionsArray.length}
          type={type}
          language={language}
        />
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════
//          DROPDOWN PORTAL (Renders at body level)
// ═══════════════════════════════════════════════════════

const DropdownPortal = React.forwardRef(({ 
  position, 
  onExport, 
  onClose, 
  hasQuestions, 
  questionsCount, 
  type,
  language 
}, ref) => {
  return createPortal(
    <div
      ref={ref}
      className="fixed z-[99999] animate-dropdown-in"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[280px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Export PDF</h3>
                {hasQuestions && (
                  <p className="text-white/70 text-xs">{questionsCount} questions</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-2">
          {type === 'test' ? (
            <>
              {/* Questions Only Section */}
              <SectionLabel icon={Globe} label="Question Paper" />
              <MenuItem
                icon="🇮🇳"
                label="Hindi"
                sublabel="हिंदी प्रश्न पत्र"
                gradient="from-orange-500 to-amber-500"
                onClick={() => onExport('hi', false)}
                disabled={!hasQuestions}
              />
              <MenuItem
                icon="🇬🇧"
                label="English"
                sublabel="English Question Paper"
                gradient="from-blue-500 to-cyan-500"
                onClick={() => onExport('en', false)}
                disabled={!hasQuestions}
              />

              <Divider />

              {/* With Answers Section */}
              <SectionLabel icon={CheckCircle} label="With Answer Key" />
              <MenuItem
                icon="✓"
                label="Hindi + Answers"
                sublabel="उत्तर कुंजी सहित"
                gradient="from-green-500 to-emerald-500"
                onClick={() => onExport('hi', true)}
                disabled={!hasQuestions}
              />
              <MenuItem
                icon="✓"
                label="English + Answers"
                sublabel="With explanations"
                gradient="from-teal-500 to-green-500"
                onClick={() => onExport('en', true)}
                disabled={!hasQuestions}
              />
            </>
          ) : (
            <>
              <SectionLabel icon={FileCheck} label="Result Report" />
              <MenuItem
                icon="🇮🇳"
                label="Hindi Result"
                sublabel="परिणाम रिपोर्ट"
                gradient="from-orange-500 to-amber-500"
                onClick={() => onExport('hi', false)}
              />
              <MenuItem
                icon="🇬🇧"
                label="English Result"
                sublabel="Result Report"
                gradient="from-blue-500 to-cyan-500"
                onClick={() => onExport('en', false)}
              />
            </>
          )}

          {/* Warning if no questions */}
          {!hasQuestions && type === 'test' && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span>Loading questions... Please wait a moment and try again.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 text-center">
            PDF will download automatically
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
});

DropdownPortal.displayName = 'DropdownPortal';

// ═══════════════════════════════════════════════════════
//                    SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 px-3 py-2 mt-1 first:mt-0">
    <Icon className="w-3.5 h-3.5 text-gray-400" />
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
  </div>
);

const MenuItem = ({ icon, label, sublabel, gradient, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
      transition-all duration-200 group
      ${disabled 
        ? 'opacity-40 cursor-not-allowed' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:scale-[1.02] active:scale-[0.98]'
      }
    `}
  >
    <div className={`
      w-9 h-9 rounded-xl bg-gradient-to-br ${gradient}
      flex items-center justify-center flex-shrink-0
      shadow-lg group-hover:shadow-xl group-hover:scale-110
      transition-all duration-200
    `}>
      <span className="text-sm">{icon}</span>
    </div>
    <div className="flex-1 text-left">
      <span className="block font-semibold text-gray-800 dark:text-white text-sm group-hover:text-gray-900">
        {label}
      </span>
      {sublabel && (
        <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
          {sublabel}
        </span>
      )}
    </div>
    <Download className={`
      w-4 h-4 text-gray-300 dark:text-gray-600
      group-hover:text-gray-500 dark:group-hover:text-gray-400
      transition-colors
      ${disabled ? 'hidden' : ''}
    `} />
  </button>
);

const Divider = () => (
  <div className="my-2 mx-3 border-t border-gray-100 dark:border-gray-700" />
);

// ═══════════════════════════════════════════════════════
//                    CUSTOM STYLES
// ═══════════════════════════════════════════════════════

// Add these styles to your global CSS or tailwind config
const styles = `
  @keyframes dropdown-in {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes bounce-in {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .animate-dropdown-in {
    animation: dropdown-in 0.2s ease-out;
  }

  .animate-bounce-in {
    animation: bounce-in 0.3s ease-out;
  }

  .animate-shake {
    animation: shake 0.3s ease-out;
  }
`;

// Inject styles (do this once, e.g., in a useEffect or in your CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  if (!document.head.querySelector('[data-pdf-button-styles]')) {
    styleSheet.setAttribute('data-pdf-button-styles', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default PDFExportButton;