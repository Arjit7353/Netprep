// client/src/components/test/BatchExportModal.jsx
// ⭐ BATCH PDF EXPORT WITH PROGRESS

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Download, FileText, CheckCircle, AlertCircle,
  Loader2, Play, Pause, Square, Globe, ChevronDown,
  FileCheck, Clock, Zap, Package
} from 'lucide-react';
import { downloadTestPDF } from '../../utils/pdfExportHTML';
import { TEST_TYPE_CONFIG } from '../../utils/constants';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '';
  return url.replace(/\/api\/?$/, '');
};

// Fetch questions for a single test
const fetchTestQuestions = async (testId, cache) => {
  if (cache[testId]?.length > 0) return cache[testId];

  const BASE = getBaseUrl();
  try {
    const res = await fetch(`${BASE}/api/tests/${testId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const td = data.data || data;

    if (td.questions?.length > 0) {
      const first = td.questions[0];
      if (typeof first === 'object' && first !== null && (first.question || first.options)) {
        return td.questions;
      }

      const ids = td.questions.map((q) =>
        typeof q === 'string' ? q : q._id || String(q)
      );
      if (ids.length > 0) {
        const bulkRes = await fetch(`${BASE}/api/questions/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (bulkRes.ok) {
          const bd = await bulkRes.json();
          return bd.data || bd.questions || [];
        }
      }
    }
    return [];
  } catch {
    return [];
  }
};

const BatchExportModal = ({
  isOpen,
  onClose,
  tests = [],
  questionsCache = {},
  language = 'en',
}) => {
  // ─── STATE ───
  const [exportLang, setExportLang] = useState(language === 'hi' ? 'hi' : 'en');
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const [delayBetween, setDelayBetween] = useState(1500);

  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);
  const cacheRef = useRef({ ...questionsCache });

  // Update cache ref when prop changes
  useEffect(() => {
    cacheRef.current = { ...cacheRef.current, ...questionsCache };
  }, [questionsCache]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setExporting(false);
      setPaused(false);
      setProgress([]);
      setCurrentIndex(-1);
      setCompleted(false);
      pausedRef.current = false;
      cancelledRef.current = false;
    }
  }, [isOpen]);

  // ─── EXPORT LOGIC ───
  const startExport = useCallback(async () => {
    if (tests.length === 0) return;

    setExporting(true);
    setPaused(false);
    setCompleted(false);
    pausedRef.current = false;
    cancelledRef.current = false;

    // Initialize progress
    const initialProgress = tests.map((t) => ({
      testId: t._id,
      title: t.title,
      testType: t.testType,
      status: 'pending', // pending | fetching | generating | done | error | skipped
      error: null,
      questionsCount: 0,
    }));
    setProgress(initialProgress);

    for (let i = 0; i < tests.length; i++) {
      // Check if cancelled
      if (cancelledRef.current) {
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx >= i ? { ...p, status: 'skipped' } : p
          )
        );
        break;
      }

      // Wait while paused
      while (pausedRef.current && !cancelledRef.current) {
        await new Promise((r) => setTimeout(r, 200));
      }
      if (cancelledRef.current) break;

      setCurrentIndex(i);
      const test = tests[i];

      try {
        // Step 1: Fetch questions
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: 'fetching' } : p
          )
        );

        const questions = await fetchTestQuestions(test._id, cacheRef.current);

        // Cache for future use
        if (questions.length > 0) {
          cacheRef.current[test._id] = questions;
        }

        if (questions.length === 0) {
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'error', error: 'No questions found', questionsCount: 0 }
                : p
            )
          );
          continue;
        }

        // Step 2: Generate PDF
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: 'generating', questionsCount: questions.length }
              : p
          )
        );

        const result = await downloadTestPDF(test, questions, exportLang, includeAnswers);

        if (result.success) {
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'done', questionsCount: questions.length }
                : p
            )
          );
        } else {
          setProgress((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: 'error', error: result.error || 'Export failed' }
                : p
            )
          );
        }

        // Delay between downloads to avoid browser blocking
        if (i < tests.length - 1) {
          await new Promise((r) => setTimeout(r, delayBetween));
        }
      } catch (err) {
        setProgress((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: 'error', error: err.message || 'Unknown error' }
              : p
          )
        );
      }
    }

    setExporting(false);
    setCompleted(true);
    setCurrentIndex(-1);
  }, [tests, exportLang, includeAnswers, delayBetween]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  const cancelExport = () => {
    cancelledRef.current = true;
    pausedRef.current = false;
    setPaused(false);
  };

  const handleClose = () => {
    if (exporting) {
      cancelledRef.current = true;
      pausedRef.current = false;
    }
    onClose();
  };

  // ─── COMPUTED ───
  const doneCount = progress.filter((p) => p.status === 'done').length;
  const errorCount = progress.filter((p) => p.status === 'error').length;
  const skippedCount = progress.filter((p) => p.status === 'skipped').length;
  const pendingCount = progress.filter((p) => p.status === 'pending').length;
  const progressPercent = tests.length > 0
    ? Math.round(((doneCount + errorCount + skippedCount) / tests.length) * 100)
    : 0;

  // ─── TRANSLATIONS ───
  const TT = {
    title: { en: 'Batch PDF Export', hi: 'बैच PDF निर्यात' },
    subtitle: { en: 'Export multiple test papers as PDF', hi: 'एकाधिक प्रश्न पत्र PDF में निर्यात करें' },
    language: { en: 'PDF Language', hi: 'PDF भाषा' },
    hindi: { en: 'Hindi', hi: 'हिंदी' },
    english: { en: 'English', hi: 'English' },
    withAnswers: { en: 'Include Answer Key', hi: 'उत्तर कुंजी शामिल करें' },
    delay: { en: 'Delay between downloads', hi: 'डाउनलोड के बीच विलंब' },
    start: { en: 'Start Export', hi: 'निर्यात शुरू करें' },
    pause: { en: 'Pause', hi: 'रोकें' },
    resume: { en: 'Resume', hi: 'जारी रखें' },
    cancel: { en: 'Cancel', hi: 'रद्द करें' },
    close: { en: 'Close', hi: 'बंद करें' },
    done: { en: 'Export Complete', hi: 'निर्यात पूर्ण' },
    exporting: { en: 'Exporting...', hi: 'निर्यात हो रहा है...' },
    success: { en: 'Success', hi: 'सफल' },
    failed: { en: 'Failed', hi: 'विफल' },
    skipped: { en: 'Skipped', hi: 'छोड़ दिया' },
    pending: { en: 'Pending', hi: 'लंबित' },
    fetching: { en: 'Fetching questions...', hi: 'प्रश्न लोड हो रहे हैं...' },
    generating: { en: 'Generating PDF...', hi: 'PDF बन रहा है...' },
    testsSelected: { en: 'tests selected', hi: 'परीक्षाएं चयनित' },
    seconds: { en: 'seconds', hi: 'सेकंड' },
    retryFailed: { en: 'Retry Failed', hi: 'विफल पुनः प्रयास' },
  };

  const L = (key) => TT[key]?.[language] || TT[key]?.en || key;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-600 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{L('title')}</h2>
                <p className="text-white/70 text-xs">{L('subtitle')}</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Progress bar */}
          {(exporting || completed) && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
                <span>
                  {completed ? L('done') : L('exporting')}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completed
                      ? errorCount > 0
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                        : 'bg-gradient-to-r from-green-400 to-emerald-400'
                      : 'bg-gradient-to-r from-white to-blue-200'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">

          {/* Settings (before export starts) */}
          {!exporting && !completed && (
            <div className="space-y-4">
              {/* Test count info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-blue-700 dark:text-blue-300">{tests.length}</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm ml-1.5">{L('testsSelected')}</span>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {L('language')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportLang('hi')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      exportLang === 'hi'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Globe className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-bold">{L('hindi')}</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">हिंदी प्रश्न पत्र</span>
                  </button>
                  <button
                    onClick={() => setExportLang('en')}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      exportLang === 'en'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Globe className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-bold">{L('english')}</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">English Paper</span>
                  </button>
                </div>
              </div>

              {/* Include Answers Toggle */}
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{L('withAnswers')}</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={includeAnswers}
                    onChange={(e) => setIncludeAnswers(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${includeAnswers ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${includeAnswers ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              </label>

              {/* Delay Setting */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1.5" />
                  {L('delay')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="500"
                    value={delayBetween}
                    onChange={(e) => setDelayBetween(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-400 w-16 text-right">
                    {(delayBetween / 1000).toFixed(1)}s
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {language === 'hi' ? 'ब्राउज़र ब्लॉक से बचने के लिए विलंब बढ़ाएं' : 'Increase delay if browser blocks downloads'}
                </p>
              </div>

              {/* Test list preview */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  {language === 'hi' ? 'निर्यात होंगे' : 'Will export'}
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
                  {tests.map((test, idx) => {
                    const cfg = TEST_TYPE_CONFIG[test.testType] || {};
                    return (
                      <div key={test._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          {cfg.shortCode}
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{test.title}</span>
                        <span className="text-[10px] text-gray-400">{test.totalQuestions}Q</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Progress List (during/after export) */}
          {(exporting || completed) && (
            <div className="space-y-1.5">
              {progress.map((item, idx) => (
                <ProgressItem key={item.testId} item={item} index={idx} isCurrent={idx === currentIndex} language={language} />
              ))}
            </div>
          )}

          {/* Summary (after complete) */}
          {completed && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-black text-green-600">{doneCount}</div>
                  <div className="text-xs text-gray-500">{L('success')}</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-red-500">{errorCount}</div>
                  <div className="text-xs text-gray-500">{L('failed')}</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-400">{skippedCount}</div>
                  <div className="text-xs text-gray-500">{L('skipped')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between gap-3">
          {!exporting && !completed && (
            <>
              <button onClick={handleClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors">
                {L('cancel')}
              </button>
              <button onClick={startExport} disabled={tests.length === 0}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 rounded-xl shadow-lg shadow-primary-500/25 transition-all flex items-center gap-2 disabled:opacity-50">
                <Download className="w-4 h-4" />
                {L('start')} ({tests.length})
              </button>
            </>
          )}

          {exporting && (
            <>
              <button onClick={cancelExport}
                className="px-5 py-2.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-xl transition-colors flex items-center gap-2">
                <Square className="w-4 h-4" />
                {L('cancel')}
              </button>
              <button onClick={togglePause}
                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-xl shadow-lg transition-all flex items-center gap-2">
                {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {paused ? L('resume') : L('pause')}
              </button>
            </>
          )}

          {completed && (
            <>
              {errorCount > 0 && (
                <button onClick={() => {
                  // Reset failed items to pending and re-export only those
                  const failedTests = tests.filter((t) =>
                    progress.find((p) => p.testId === t._id && p.status === 'error')
                  );
                  if (failedTests.length > 0) {
                    setCompleted(false);
                    // Will need to filter tests - for now just close and retry
                  }
                }}
                  className="px-5 py-2.5 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl transition-colors flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {L('retryFailed')}
                </button>
              )}
              <button onClick={handleClose}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl shadow-lg transition-all flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {L('close')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── PROGRESS ITEM ───
const ProgressItem = ({ item, index, isCurrent, language }) => {
  const cfg = TEST_TYPE_CONFIG[item.testType] || {};

  const statusConfig = {
    pending: {
      icon: Clock,
      text: language === 'hi' ? 'लंबित' : 'Pending',
      bg: 'bg-gray-100 dark:bg-gray-700',
      textColor: 'text-gray-500 dark:text-gray-400',
      iconColor: 'text-gray-400',
    },
    fetching: {
      icon: Loader2,
      text: language === 'hi' ? 'प्रश्न लोड...' : 'Fetching...',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-600 animate-spin',
    },
    generating: {
      icon: Loader2,
      text: language === 'hi' ? 'PDF बना रहा...' : 'Generating...',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      iconColor: 'text-indigo-600 animate-spin',
    },
    done: {
      icon: CheckCircle,
      text: language === 'hi' ? 'सफल' : 'Done',
      bg: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-600',
    },
    error: {
      icon: AlertCircle,
      text: item.error || (language === 'hi' ? 'विफल' : 'Failed'),
      bg: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-500',
    },
    skipped: {
      icon: Square,
      text: language === 'hi' ? 'छोड़ दिया' : 'Skipped',
      bg: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-500 dark:text-gray-400',
      iconColor: 'text-gray-400',
    },
  };

  const sc = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = sc.icon;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${sc.bg} ${isCurrent ? 'ring-2 ring-primary-500/30' : ''}`}>
      <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>

      <span className="px-1.5 py-0.5 text-[10px] font-black bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded flex-shrink-0">
        {cfg.shortCode || '??'}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
        {item.questionsCount > 0 && item.status === 'done' && (
          <p className="text-[10px] text-gray-400">{item.questionsCount} questions</p>
        )}
      </div>

      <div className={`flex items-center gap-1.5 flex-shrink-0 ${sc.textColor}`}>
        <StatusIcon className={`w-4 h-4 ${sc.iconColor}`} />
        <span className="text-xs font-semibold max-w-[100px] truncate">{sc.text}</span>
      </div>
    </div>
  );
};

export default BatchExportModal;