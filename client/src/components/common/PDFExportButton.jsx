// client/src/components/common/PDFExportButton.jsx
// ONLY CHANGE: Line 10 - import path

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileDown, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  CheckCircle,
  Globe
} from 'lucide-react';

// ⭐ CHANGED: Import from new HTML-to-PDF file
import { downloadTestPDF, downloadResultsPDF } from '../../utils/pdfExportHTML';

const PDFExportButton = ({ 
  type = 'test',
  test, 
  questions, 
  attempt = null,
  language = 'en',
  className = '',
  variant = 'default',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (data.data) return ensureArray(data.data);
      if (data.questions) return ensureArray(data.questions);
    }
    return [];
  };

  const questionsArray = ensureArray(questions);
  const hasQuestions = questionsArray.length > 0;

  const handleExport = async (lang, includeAnswers = false) => {
    if (!hasQuestions && type === 'test') {
      setError('No questions available');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setShowOptions(false);
    onExportStart?.();
    
    try {
      let result;
      
      if (type === 'test') {
        console.log('📄 Exporting Test PDF (HTML method):', {
          title: test?.title,
          questions: questionsArray.length,
          language: lang,
          includeAnswers
        });
        result = await downloadTestPDF(test, questionsArray, lang, includeAnswers);
      } else {
        console.log('📄 Exporting Result PDF (HTML method)');
        result = await downloadResultsPDF(attempt, test, questionsArray, lang);
      }
      
      if (result.success) {
        setSuccess(true);
        onExportComplete?.(result);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message);
      onExportError?.(err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {variant !== 'icon' && <span>Generating PDF...</span>}
        </>
      );
    }
    if (success) {
      return (
        <>
          <Check className="w-4 h-4 text-green-500" />
          {variant !== 'icon' && <span className="text-green-600">Downloaded!</span>}
        </>
      );
    }
    if (error) {
      return (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          {variant !== 'icon' && <span className="text-red-600 text-xs truncate max-w-[150px]">{error}</span>}
        </>
      );
    }
    return (
      <>
        <FileDown className="w-4 h-4" />
        {variant !== 'icon' && <span>PDF</span>}
      </>
    );
  };

  const getButtonStyles = () => {
    const base = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
    switch (variant) {
      case 'icon':
        return `${base} p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm`;
      case 'compact':
        return `${base} px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm`;
      default:
        return `${base} px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm`;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !loading && setShowOptions(!showOptions)}
        disabled={loading}
        className={getButtonStyles()}
        title="Download PDF"
      >
        {getButtonContent()}
      </button>

      {showOptions && !loading && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-50 min-w-[220px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">PDF Options</span>
            </div>
            <button onClick={() => setShowOptions(false)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {type === 'test' && (
            <div className="px-3 py-1.5 mb-2">
              <span className="text-xs text-gray-500">{questionsArray.length} questions</span>
            </div>
          )}

          <p className="text-xs text-gray-500 px-3 py-1 font-medium flex items-center gap-1">
            <Globe className="w-3 h-3" /> Select Language
          </p>
          
          <div className="space-y-1 mb-2">
            <button onClick={() => handleExport('hi', false)} disabled={!hasQuestions && type === 'test'}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-medium text-xs">HI</span>
              </div>
              <span className="font-medium text-gray-700">Hindi</span>
            </button>
            <button onClick={() => handleExport('en', false)} disabled={!hasQuestions && type === 'test'}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-xs">EN</span>
              </div>
              <span className="font-medium text-gray-700">English</span>
            </button>
          </div>
          
          {type === 'test' && hasQuestions && (
            <>
              <hr className="border-gray-100 my-2" />
              <p className="text-xs text-gray-500 px-3 py-1 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> With Answers
              </p>
              <div className="space-y-1">
                <button onClick={() => handleExport('hi', true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-green-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-700">Hindi + Answers</span>
                </button>
                <button onClick={() => handleExport('en', true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-green-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-700">English + Answers</span>
                </button>
              </div>
            </>
          )}

          {!hasQuestions && type === 'test' && (
            <div className="px-3 py-2 mt-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Questions not loaded
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;