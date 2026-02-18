// client/src/components/common/PDFExportButton.jsx

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
import { downloadTestPDF, downloadResultsPDF } from '../../utils/pdfExport';

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

  // Close dropdown on outside click
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

  // Ensure questions is array
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
      setError(lang === 'hi' ? 'No questions available' : 'No questions available');
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
        console.log('Exporting Test PDF:', {
          testId: test?._id,
          title: test?.title,
          questionsCount: questionsArray.length,
          language: lang,
          includeAnswers
        });
        result = await downloadTestPDF(test, questionsArray, lang, includeAnswers);
      } else {
        console.log('Exporting Result PDF:', {
          attemptId: attempt?._id,
          testTitle: test?.title
        });
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

  // Get button content based on state
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {variant !== 'icon' && (
            <span>{language === 'hi' ? 'Generating...' : 'Generating...'}</span>
          )}
        </>
      );
    }
    
    if (success) {
      return (
        <>
          <Check className="w-4 h-4 text-green-500" />
          {variant !== 'icon' && (
            <span className="text-green-600">
              {language === 'hi' ? 'Downloaded!' : 'Downloaded!'}
            </span>
          )}
        </>
      );
    }
    
    if (error) {
      return (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          {variant !== 'icon' && (
            <span className="text-red-600 text-xs truncate max-w-[150px]">{error}</span>
          )}
        </>
      );
    }
    
    return (
      <>
        <FileDown className="w-4 h-4" />
        {variant !== 'icon' && (
          <span>{language === 'hi' ? 'PDF' : 'PDF'}</span>
        )}
      </>
    );
  };

  // Button styles based on variant
  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (variant) {
      case 'icon':
        return `${baseStyles} p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm`;
      case 'compact':
        return `${baseStyles} px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm`;
      default:
        return `${baseStyles} px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm`;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !loading && setShowOptions(!showOptions)}
        disabled={loading}
        className={getButtonStyles()}
        title={language === 'hi' ? 'Download PDF' : 'Download PDF'}
      >
        {getButtonContent()}
      </button>

      {/* Dropdown Options */}
      {showOptions && !loading && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-50 min-w-[220px]">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {language === 'hi' ? 'PDF Options' : 'PDF Options'}
              </span>
            </div>
            <button
              onClick={() => setShowOptions(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Questions count info */}
          {type === 'test' && (
            <div className="px-3 py-1.5 mb-2">
              <span className="text-xs text-gray-500">
                {language === 'hi' 
                  ? `${questionsArray.length} questions available` 
                  : `${questionsArray.length} questions available`}
              </span>
            </div>
          )}

          {/* Language Selection */}
          <p className="text-xs text-gray-500 px-3 py-1 font-medium flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {language === 'hi' ? 'Select Language' : 'Select Language'}
          </p>
          
          <div className="space-y-1 mb-2">
            {/* Hindi */}
            <button
              onClick={() => handleExport('hi', false)}
              disabled={!hasQuestions && type === 'test'}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-orange-50 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <span className="text-orange-600 font-medium text-xs">HI</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Hindi</span>
              </div>
            </button>
            
            {/* English */}
            <button
              onClick={() => handleExport('en', false)}
              disabled={!hasQuestions && type === 'test'}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-blue-50 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-600 font-medium text-xs">EN</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">English</span>
              </div>
            </button>
          </div>
          
          {type === 'test' && hasQuestions && (
            <>
              <hr className="border-gray-100 my-2" />
              <p className="text-xs text-gray-500 px-3 py-1 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {language === 'hi' ? 'With Answers' : 'With Answers'}
              </p>
              
              <div className="space-y-1">
                {/* Hindi with Answers */}
                <button
                  onClick={() => handleExport('hi', true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-green-50 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Hindi + Answers</span>
                  </div>
                </button>
                
                {/* English with Answers */}
                <button
                  onClick={() => handleExport('en', true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-green-50 rounded-lg transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-green-700">English + Answers</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* No questions warning */}
          {!hasQuestions && type === 'test' && (
            <div className="px-3 py-2 mt-2 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {language === 'hi' 
                  ? 'Questions not loaded yet' 
                  : 'Questions not loaded yet'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFExportButton;