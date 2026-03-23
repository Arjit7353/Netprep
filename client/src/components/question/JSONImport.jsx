import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, FileJson, AlertCircle, CheckCircle, Copy, Download, Eye, Play,
  X, ChevronDown, ChevronUp, AlertTriangle, Sparkles, FolderOpen,
  Loader2, RotateCcw, Layers, Clock, ListChecks, FileText
} from 'lucide-react';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import { ALL_TEMPLATES } from '../../utils/jsonTemplates';
import { validateJSONImport } from '../../utils/validators';
import { downloadJSON, copyToClipboard } from '../../utils/helpers';

// ── Chunk size for large imports ──
const CHUNK_SIZE = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Template category grouping ──
const TEMPLATE_CATEGORIES = [
  { key: 'basic', label: 'Basic Types', labelHi: 'मूल प्रकार' },
  { key: 'passage', label: 'Passage', labelHi: 'गद्यांश' },
  { key: 'di', label: 'Data Interpretation', labelHi: 'डेटा व्याख्या' },
  { key: 'advanced', label: 'Advanced / Mixed', labelHi: 'एडवांस / मिश्रित' },
];

const JSONImport = ({
  onImport,
  onValidate,
  language = 'hi',
  loading = false,
  // ★ NEW: Preview mode props
  onPreviewReady,
  enablePreview = true
}) => {
  const { success, error: showError, warning } = useToast();
  const fileInputRef = useRef(null);

  // ── State ──
  const [jsonText, setJsonText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ── Chunked import progress ──
  const [importProgress, setImportProgress] = useState(null);

  // ── Template options ──
  const templateOptions = Object.entries(ALL_TEMPLATES).map(([key, val]) => ({
    value: key, label: val.name, labelHi: val.nameHi, category: val.category || 'basic'
  }));

  const groupedTemplates = TEMPLATE_CATEGORIES.map((cat) => ({
    ...cat,
    items: templateOptions.filter((t) => t.category === cat.key),
  })).filter((g) => g.items.length > 0);

  const featuredTemplate = templateOptions.find((t) => t.value === 'all_in_one');

  // ── Drag & Drop ──
  const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const processFile = (file) => {
    if (!file.name.endsWith('.json')) { showError('Only .json files allowed'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { JSON.parse(ev.target.result); setJsonText(ev.target.result); resetState(); success('File loaded'); }
      catch { showError('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const resetState = () => { setValidation(null); setPreview(null); setImportProgress(null); };

  // ── Template ──
  const handleTemplateSelect = (key) => {
    const tpl = ALL_TEMPLATES[key];
    if (tpl) { setJsonText(JSON.stringify(tpl.template, null, 2)); setSelectedTemplate(key); resetState(); }
  };

  // ── Validate ──
  const handleValidate = async () => {
    if (!jsonText.trim()) { showError(language === 'hi' ? 'JSON डेटा डालें' : 'Enter JSON data'); return; }
    let jsonData;
    try { jsonData = JSON.parse(jsonText); }
    catch (err) {
      showError('Invalid JSON: ' + err.message);
      setValidation({ isValid: false, errors: ['Invalid JSON: ' + err.message], warnings: [] });
      return;
    }
    const cv = validateJSONImport(jsonData);
    if (!cv.isValid) { setValidation(cv); showError(cv.errors[0]); return; }

    setIsValidating(true);
    try {
      const res = await onValidate(jsonData);
      setValidation(res.validation);
      setPreview(res.preview);
      if (res.validation.isValid) success(language === 'hi' ? 'JSON मान्य है' : 'JSON is valid');
      else showError(res.validation.errors?.[0] || 'Validation failed');
      res.validation.warnings?.slice(0, 3).forEach((w) => warning(w));
    } catch (err) {
      showError(err.message || 'Validation failed');
      setValidation({ isValid: false, errors: [err.message], warnings: [] });
    } finally { setIsValidating(false); }
  };

  // ★ NEW: Open Preview Panel (sends parsed data to parent)
  const handleOpenPreview = () => {
    if (!jsonText.trim()) { showError(language === 'hi' ? 'JSON डेटा डालें' : 'Enter JSON data'); return; }
    let jsonData;
    try { jsonData = JSON.parse(jsonText); }
    catch (err) { showError('Invalid JSON: ' + err.message); return; }

    const cv = validateJSONImport(jsonData);
    if (!cv.isValid) { showError(cv.errors[0]); return; }

    if (onPreviewReady) {
      onPreviewReady(jsonData, jsonText);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ★ SMART IMPORT — auto-chunks if > CHUNK_SIZE for reliability
  // ═══════════════════════════════════════════════════════════
  const handleImport = async () => {
    if (!validation?.isValid) { showError(language === 'hi' ? 'पहले JSON मान्य करें' : 'Validate JSON first'); return; }

    let jsonData;
    try { jsonData = JSON.parse(jsonText); } catch { showError('Invalid JSON'); return; }
    jsonData._skipDuplicates = skipDuplicates;

    const items = jsonData.questions || [];

    // ── Single shot if small enough ──
    if (items.length <= CHUNK_SIZE) {
      try {
        await onImport(jsonData);
        setJsonText(''); resetState(); setSelectedTemplate('');
      } catch (err) { showError(err.message || 'Import failed'); }
      return;
    }

    // ── Chunked import for large batches ──
    const chunks = createSmartChunks(items);
    const agg = { questions: 0, passages: 0, diData: 0, errors: 0, skipped: 0 };
    const startTime = Date.now();

    setImportProgress({ current: 0, total: chunks.length, status: 'importing', aggregated: agg, startTime });

    for (let i = 0; i < chunks.length; i++) {
      setImportProgress((p) => ({ ...p, current: i + 1, status: 'importing' }));

      const chunkData = { ...jsonData, questions: chunks[i], _skipDuplicates: skipDuplicates };
      let retries = 0;
      let chunkDone = false;

      while (!chunkDone && retries < 2) {
        try {
          const result = await onImport(chunkData);
          agg.questions += result?.data?.questions || 0;
          agg.passages += result?.data?.passages || 0;
          agg.diData += result?.data?.diData || 0;
          agg.errors += result?.data?.errors || 0;
          agg.skipped += result?.data?.skipped || 0;
          chunkDone = true;
        } catch (err) {
          retries++;
          if (retries >= 2) {
            agg.errors += chunks[i].length;
            console.error(`[Import] Chunk ${i + 1} failed after retries:`, err.message);
          } else {
            await sleep(2000);
          }
        }
      }

      setImportProgress((p) => ({ ...p, aggregated: { ...agg } }));
      if (i < chunks.length - 1) await sleep(800);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setImportProgress((p) => ({ ...p, status: 'done', elapsed }));

    success(
      language === 'hi'
        ? `${agg.questions} प्रश्न आयातित (${elapsed}s)`
        : `${agg.questions} questions imported (${elapsed}s)`
    );

    setTimeout(() => { setJsonText(''); setValidation(null); setPreview(null); setSelectedTemplate(''); }, 1500);
  };

  // ── Smart chunking: keeps passage/DI groups together ──
  function createSmartChunks(items) {
    const chunks = [];
    let current = [];
    for (const item of items) {
      current.push(item);
      const isGroup = item.passage || item.passageContent || item.diData ||
        (item.type && item.type.startsWith('di_') && item.diData);
      if (current.length >= CHUNK_SIZE && !isGroup) {
        chunks.push([...current]);
        current = [];
      }
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
  }

  // ── Toolbar actions ──
  const handleFormat = () => {
    try { setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2)); success('Formatted'); }
    catch { showError('Invalid JSON'); }
  };
  const handleCopy = async () => {
    if (await copyToClipboard(jsonText)) success('Copied');
    else showError('Copy failed');
  };
  const handleDownload = () => {
    try { downloadJSON(JSON.parse(jsonText), `netprep-${selectedTemplate || 'custom'}.json`); success('Downloaded'); }
    catch { showError('Invalid JSON'); }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* ── Templates ── */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 overflow-hidden shadow-sm">
        <button
          type="button" onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-secondary-700/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {language === 'hi' ? 'JSON टेम्पलेट चुनें' : 'Choose a JSON Template'}
            </span>
            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs rounded-full font-medium">
              {Object.keys(ALL_TEMPLATES).length}
            </span>
          </div>
          {showTemplates ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {showTemplates && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-secondary-700 pt-4 animate-fade-in">
            {/* Featured: All-in-One */}
            {featuredTemplate && (
              <button
                type="button" onClick={() => handleTemplateSelect('all_in_one')}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  selectedTemplate === 'all_in_one'
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/30 dark:to-violet-900/20 shadow-md'
                    : 'border-dashed border-primary-300 dark:border-primary-700 hover:border-primary-400 bg-gradient-to-r from-primary-50/40 to-violet-50/40 dark:from-primary-900/10 dark:to-violet-900/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <span className="font-bold text-primary-700 dark:text-primary-300">
                      {language === 'hi' ? featuredTemplate.labelHi : featuredTemplate.label}
                    </span>
                    <p className="text-xs text-primary-500 dark:text-primary-400 mt-0.5">
                      {language === 'hi'
                        ? 'MCQ, अभिकथन-कारण, सुमेलन, क्रम, कथन, गद्यांश, DI — सभी एक फ़ाइल में'
                        : 'MCQ, A-R, Match, Sequence, Statement, Passage, DI — all in one'}
                    </p>
                  </div>
                  {selectedTemplate === 'all_in_one' && <CheckCircle className="w-5 h-5 text-primary-600 ml-auto flex-shrink-0" />}
                </div>
              </button>
            )}

            {/* Grouped templates */}
            {groupedTemplates.map((group) => (
              <div key={group.key}>
                <p className="text-xs font-semibold text-gray-500 dark:text-secondary-500 uppercase tracking-wider mb-2">
                  {language === 'hi' ? group.labelHi : group.label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {group.items.map((t) => (
                    <button
                      key={t.value} type="button"
                      onClick={() => handleTemplateSelect(t.value)}
                      className={`px-3 py-2.5 text-xs rounded-lg border transition-all text-left font-medium ${
                        selectedTemplate === t.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-secondary-600 hover:border-gray-300 dark:hover:border-secondary-500 text-gray-600 dark:text-secondary-400'
                      }`}
                    >
                      {language === 'hi' ? t.labelHi : t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload + Editor ── */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-secondary-700">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {language === 'hi' ? 'JSON डेटा' : 'JSON Data'}
          </h3>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="xs" icon={FolderOpen} onClick={() => fileInputRef.current?.click()}>
              {language === 'hi' ? 'फ़ाइल' : 'File'}
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            {jsonText && (
              <>
                <button type="button" onClick={handleFormat} className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-md transition-colors" title="Format"><FileJson className="w-4 h-4 text-gray-500" /></button>
                <button type="button" onClick={handleCopy} className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-md transition-colors" title="Copy"><Copy className="w-4 h-4 text-gray-500" /></button>
                <button type="button" onClick={handleDownload} className="p-1.5 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-md transition-colors" title="Download"><Download className="w-4 h-4 text-gray-500" /></button>
                <button type="button" onClick={() => { setJsonText(''); resetState(); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Clear"><X className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
              </>
            )}
          </div>
        </div>

        {/* Editor with drag-drop */}
        <div
          className={`relative ${isDragging ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 bg-primary-50/90 dark:bg-primary-900/80 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-primary-500 animate-bounce" />
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {language === 'hi' ? 'JSON फ़ाइल यहाँ छोड़ें' : 'Drop JSON file here'}
                </p>
              </div>
            </div>
          )}
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); resetState(); }}
            rows={14}
            className="w-full px-5 py-4 font-mono text-sm border-0 bg-transparent dark:text-secondary-100 focus:outline-none resize-none"
            placeholder={language === 'hi'
              ? '{\n  "language": "hi",\n  "paper": "paper1",\n  "questions": [\n    {\n      "question": "...",\n      "options": ["A","B","C","D"],\n      "correct": 0\n    }\n  ]\n}\n\n↑ JSON पेस्ट करें, फ़ाइल अपलोड करें, या ऊपर टेम्पलेट चुनें'
              : '{\n  "language": "hi",\n  "paper": "paper1",\n  "questions": [\n    {\n      "question": "...",\n      "options": ["A","B","C","D"],\n      "correct": 0\n    }\n  ]\n}\n\n↑ Paste JSON, upload a file, or select a template above'}
          />
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-900/30">
          {/* Skip duplicates */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className="relative" onClick={() => setSkipDuplicates(!skipDuplicates)}>
              <div className={`w-9 h-5 rounded-full transition-colors ${skipDuplicates ? 'bg-primary-600' : 'bg-gray-300 dark:bg-secondary-600'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${skipDuplicates ? 'translate-x-4' : ''}`} />
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-700 dark:text-secondary-300">
                {language === 'hi' ? 'डुप्लिकेट छोड़ें' : 'Skip Duplicates'}
              </span>
            </div>
          </label>

          <div className="flex items-center gap-2">
            {jsonText && (
              <span className="text-xs text-gray-400 dark:text-secondary-500 tabular-nums">
                {jsonText.length.toLocaleString()} chars
              </span>
            )}
            <Button variant="outline" size="sm" icon={Eye} onClick={handleValidate} loading={isValidating} disabled={!jsonText.trim()}>
              {language === 'hi' ? 'मान्य करें' : 'Validate'}
            </Button>

            {/* ★ NEW: Preview Button */}
            {enablePreview && (
              <Button
                variant="outlinePrimary"
                size="sm"
                icon={ListChecks}
                onClick={handleOpenPreview}
                disabled={!jsonText.trim()}
              >
                {language === 'hi' ? 'प्रीव्यू' : 'Preview'}
              </Button>
            )}

            <Button
              variant="primary" size="sm" icon={Play}
              onClick={handleImport}
              loading={loading && !importProgress}
              disabled={!validation?.isValid || !!importProgress}
            >
              {language === 'hi' ? 'आयात करें' : 'Import'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Chunked Import Progress ── */}
      {importProgress && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              {importProgress.status === 'done' ? (
                <><CheckCircle className="w-5 h-5 text-green-600" />{language === 'hi' ? 'आयात पूर्ण!' : 'Import Complete!'}</>
              ) : (
                <><Loader2 className="w-5 h-5 animate-spin" />{language === 'hi' ? 'आयात जारी...' : 'Importing...'}</>
              )}
            </h4>
            {importProgress.status !== 'done' && (
              <span className="text-sm text-blue-600 dark:text-blue-400 tabular-nums">
                {language === 'hi' ? 'भाग' : 'Chunk'} {importProgress.current}/{importProgress.total}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-full h-2.5 mb-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${importProgress.status === 'done' ? 'bg-green-500' : 'bg-blue-600'}`}
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>

          {/* Aggregated results */}
          {importProgress.aggregated && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { v: importProgress.aggregated.questions, l: language === 'hi' ? 'प्रश्न' : 'Questions', c: 'text-green-600' },
                { v: importProgress.aggregated.passages, l: language === 'hi' ? 'गद्यांश' : 'Passages', c: 'text-blue-600' },
                { v: importProgress.aggregated.diData, l: 'DI', c: 'text-purple-600' },
                { v: importProgress.aggregated.skipped, l: language === 'hi' ? 'छोड़े' : 'Skipped', c: 'text-yellow-600' },
                { v: importProgress.aggregated.errors, l: language === 'hi' ? 'त्रुटि' : 'Errors', c: 'text-red-600' },
              ].map((item, i) => (
                <div key={i} className="bg-white/80 dark:bg-secondary-800/80 rounded-lg px-3 py-2 text-center">
                  <p className={`text-lg font-bold tabular-nums ${item.c}`}>{item.v}</p>
                  <p className="text-2xs text-gray-500">{item.l}</p>
                </div>
              ))}
            </div>
          )}

          {importProgress.status === 'done' && importProgress.elapsed && (
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {language === 'hi' ? `${importProgress.elapsed} सेकंड में पूर्ण` : `Completed in ${importProgress.elapsed}s`}
            </p>
          )}

          {importProgress.status === 'done' && (
            <button
              type="button"
              onClick={() => setImportProgress(null)}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
            >
              {language === 'hi' ? 'बंद करें' : 'Dismiss'}
            </button>
          )}
        </div>
      )}

      {/* ── Validation Results ── */}
      {validation && !importProgress && (
        <div className={`rounded-xl border p-5 animate-fade-in ${
          validation.isValid
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {validation.isValid
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <AlertCircle className="w-5 h-5 text-red-600" />}
            <h4 className={`font-semibold text-sm ${validation.isValid ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              {validation.isValid
                ? (language === 'hi' ? 'मान्यता सफल — आयात के लिए तैयार' : 'Validation Passed — Ready to Import')
                : (language === 'hi' ? 'मान्यता विफल' : 'Validation Failed')}
            </h4>
          </div>

          {validation.errors?.length > 0 && (
            <div className="space-y-1 mb-3">
              {validation.errors.map((e, i) => (
                <p key={i} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{e}
                </p>
              ))}
            </div>
          )}

          {validation.warnings?.length > 0 && (
            <div className="space-y-1 mb-3">
              {validation.warnings.map((w, i) => (
                <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />{w}
                </p>
              ))}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wider">
                {language === 'hi' ? 'पूर्वावलोकन' : 'Preview'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                <StatBox value={preview.totalQuestions || 0} label={language === 'hi' ? 'कुल प्रश्न' : 'Questions'} color="green" />
                <StatBox value={preview.passages || 0} label={language === 'hi' ? 'गद्यांश' : 'Passages'} color="blue" />
                <StatBox value={preview.diData || 0} label="DI Sets" color="purple" />
                <StatBox value={Object.keys(preview.byType || {}).length} label={language === 'hi' ? 'प्रकार' : 'Types'} color="orange" />
              </div>

              {/* By type */}
              {preview.byType && Object.keys(preview.byType).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(preview.byType).map(([type, count]) => (
                    <span key={type} className="px-2 py-1 bg-white dark:bg-secondary-700 text-xs rounded-md text-gray-700 dark:text-secondary-300 border border-gray-200 dark:border-secondary-600">
                      <span className="font-semibold">{type}:</span> {count}
                    </span>
                  ))}
                </div>
              )}

              {/* Large batch info */}
              {(preview.totalQuestions || 0) > CHUNK_SIZE && (
                <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 flex-shrink-0" />
                    {language === 'hi'
                      ? `${preview.totalQuestions} प्रश्न — स्वचालित रूप से ${Math.ceil((preview.totalQuestions) / CHUNK_SIZE)} भागों में आयात होगा`
                      : `${preview.totalQuestions} questions — will auto-split into ${Math.ceil((preview.totalQuestions) / CHUNK_SIZE)} chunks`
                    }
                  </p>
                </div>
              )}

              {/* ★ NEW: Preview button in validation results */}
              {enablePreview && validation.isValid && (
                <div className="mt-4 pt-3 border-t border-green-100 dark:border-green-900">
                  <Button
                    variant="outlinePrimary"
                    size="sm"
                    icon={ListChecks}
                    onClick={handleOpenPreview}
                    fullWidth
                  >
                    {language === 'hi'
                      ? `${preview.totalQuestions || 0} प्रश्न प्रीव्यू और एडिट करें`
                      : `Preview & Edit ${preview.totalQuestions || 0} Questions`}
                  </Button>
                </div>
              )}

              {/* Duplicates */}
              {preview.duplicates?.found > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      {preview.duplicates.found} {language === 'hi' ? 'डुप्लिकेट' : 'Duplicates'}
                      {skipDuplicates && <span className="text-xs font-normal text-yellow-600">({language === 'hi' ? 'छोड़ दिए जाएंगे' : 'will skip'})</span>}
                    </span>
                    {preview.duplicates.list?.length > 0 && (
                      <button type="button" onClick={() => setShowDuplicates(!showDuplicates)} className="text-xs text-yellow-700 dark:text-yellow-400 underline">
                        {showDuplicates ? (language === 'hi' ? 'छुपाएं' : 'Hide') : (language === 'hi' ? 'देखें' : 'Show')}
                      </button>
                    )}
                  </div>
                  {showDuplicates && preview.duplicates.list?.map((d, i) => (
                    <div key={i} className="text-xs bg-white dark:bg-secondary-700 rounded p-2 mt-1.5 border border-yellow-100 dark:border-yellow-900">
                      <p className="text-gray-600 dark:text-secondary-400">
                        <span className="font-medium text-yellow-700">Q.{d.existingNumber}:</span> {d.existingText}
                      </p>
                      <p className="text-gray-400 mt-0.5"><span className="font-medium">Input:</span> {d.inputQuestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Small stat box ──
const StatBox = ({ value, label, color }) => {
  const colors = {
    green: 'border-green-100 dark:border-green-900 text-green-600',
    blue: 'border-blue-100 dark:border-blue-900 text-blue-600',
    purple: 'border-purple-100 dark:border-purple-900 text-purple-600',
    orange: 'border-orange-100 dark:border-orange-900 text-orange-600',
  };
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-lg p-2.5 text-center border ${colors[color]}`}>
      <p className={`text-xl font-bold tabular-nums ${colors[color]?.split(' ').pop()}`}>{value}</p>
      <p className="text-2xs text-gray-500 dark:text-secondary-400 mt-0.5">{label}</p>
    </div>
  );
};
// ============================================================
// ★ UNIFIED PYQ+QUESTIONS TEMPLATE — Analysis + All Q Types
// ============================================================
export const unifiedPYQTemplate = {
  year: "2024",
  session: "december",
  shift: "none",
  paper: "paper2",
  subject: "History",
  language: "hi",

  overview: {
    totalQuestions: 100,
    totalMarks: 200,
    marksPerQuestion: 2,
    negativeMarking: false,
    questionRange: { start: 51, end: 150 }
  },

  questionTypeBreakdown: [
    { type: "mcq", label: "MCQ", count: 40, percentage: 40 },
    { type: "assertion_reason", label: "Assertion-Reason", count: 5, percentage: 5 },
    { type: "match_following", label: "Match Following", count: 10, percentage: 10 },
    { type: "sequence_order", label: "Chronology", count: 10, percentage: 10 },
    { type: "statement_based", label: "Multi-Statement", count: 25, percentage: 25 },
    { type: "passage", label: "Comprehension", count: 10, percentage: 10 }
  ],

  unitWeightage: [
    { unitId: "unit1", unitName: "UNIT I: Sources", questionCount: 10, marks: 20, percentage: 10, difficulty: "Easy", roiScore: 4 }
  ],

  questions: [
    // ── MCQ ──
    {
      qNo: 51,
      type: "mcq",
      unitId: "unit1",
      chapter: "Archaeological Sources",
      topic: "Epigraphy",
      difficulty: "easy",
      importance: 3,
      question: "भारत की सबसे प्राचीन लिपि कौन सी है?",
      options: ["ब्राह्मी", "खरोष्ठी", "देवनागरी", "तमिल"],
      correct: 0,
      explanation: "ब्राह्मी सबसे प्राचीन ज्ञात लिपि है।",
      keyTerms: ["brahmi", "script"]
    },

    // ── ASSERTION-REASON ──
    {
      qNo: 52,
      type: "assertion_reason",
      unitId: "unit2",
      chapter: "Mauryan Empire",
      topic: "Ashoka",
      difficulty: "medium",
      assertion: "अशोक ने धम्म को बढ़ावा दिया",
      reason: "वह सामाजिक व्यवस्था बनाए रखना चाहता था",
      options: ["दोनों सही, R A की व्याख्या है", "दोनों सही, R A की व्याख्या नहीं", "A सही, R गलत", "A गलत, R सही"],
      correct: 0,
      explanation: "अशोक का धम्म सामाजिक सद्भाव के लिए था।"
    },

    // ── MATCH FOLLOWING ──
    {
      qNo: 53,
      type: "match_following",
      unitId: "unit4",
      chapter: "Mughal Empire",
      question: "सूची-I को सूची-II से मिलाइए:",
      listA: ["अकबर", "जहांगीर", "शाहजहां", "औरंगजेब"],
      listB: ["सुलह-ए-कुल", "नूरजहां", "ताजमहल", "आलमगीर"],
      correctMatch: [0, 1, 2, 3],
      options: ["A-I, B-II, C-III, D-IV", "A-II, B-I, C-IV, D-III", "A-III, B-IV, C-I, D-II", "A-IV, B-III, C-II, D-I"],
      correct: 0,
      explanation: "सही मिलान।"
    },

    // ── SEQUENCE ORDER ──
    {
      qNo: 54,
      type: "sequence_order",
      unitId: "unit7",
      chapter: "British Expansion",
      question: "कालक्रमानुसार लगाइए:",
      items: ["प्लासी का युद्ध", "बक्सर का युद्ध", "तीसरा आंग्ल-मैसूर युद्ध"],
      correctOrder: [0, 1, 2],
      options: ["1-2-3", "2-1-3", "3-1-2", "1-3-2"],
      correct: 0,
      explanation: "प्लासी(1757)→बक्सर(1764)→तीसरा मैसूर(1790)"
    },

    // ── STATEMENT BASED ──
    {
      qNo: 55,
      type: "statement_based",
      unitId: "unit2",
      chapter: "Mauryan Empire",
      question: "कौन से कथन सही हैं?",
      statements: ["कृषि प्रमुख थी", "राज्य खदानों का मालिक था", "कोई व्यापार श्रेणी नहीं"],
      correctStatements: [0, 1],
      options: ["केवल 1 और 2", "केवल 2 और 3", "केवल 1 और 3", "1, 2 और 3"],
      correct: 0,
      explanation: "कथन 3 गलत।"
    },

    // ── PASSAGE ──
    {
      qNo: 56,
      type: "passage",
      unitId: "unit7",
      chapter: "Revolt of 1857",
      passage: "1857 का विद्रोह ब्रिटिश शासन के खिलाफ एक बड़ा विद्रोह था। यह मेरठ से शुरू हुआ।",
      passageTitle: "1857 का विद्रोह",
      questions: [
        { question: "विद्रोह कहाँ से शुरू हुआ?", options: ["दिल्ली", "मेरठ", "लखनऊ", "कानपुर"], correct: 1, explanation: "मेरठ से।" },
        { question: "किसे नेता बनाया?", options: ["नाना साहब", "बहादुर शाह", "लक्ष्मीबाई", "तात्या टोपे"], correct: 1, explanation: "बहादुर शाह ज़फर।" }
      ]
    },

    // ── DI TABLE ──
    {
      qNo: 58,
      type: "di_table",
      unitId: "unit7",
      diTitle: "कंपनियों का उत्पादन (हजार में)",
      tableData: {
        headers: ["कंपनी", "2021", "2022", "2023"],
        rows: [["A", 100, 120, 140], ["B", 80, 90, 110]]
      },
      questions: [
        { question: "A का कुल उत्पादन?", options: ["360", "280", "340", "300"], correct: 0, explanation: "100+120+140=360" }
      ]
    },

    // ── DI BAR CHART ──
    {
      qNo: 59,
      type: "di_bar_chart",
      unitId: "unit7",
      diTitle: "बिक्री डेटा",
      chartData: {
        labels: ["Q1", "Q2", "Q3", "Q4"],
        datasets: [{ label: "Sales", data: [40, 55, 45, 70], color: "#3B82F6" }],
        xAxisLabel: "तिमाही",
        yAxisLabel: "बिक्री"
      },
      questions: [
        { question: "कुल बिक्री?", options: ["200", "210", "220", "230"], correct: 1, explanation: "40+55+45+70=210" }
      ]
    },

    // ── DI PIE CHART ──
    {
      qNo: 60,
      type: "di_pie_chart",
      unitId: "unit7",
      diTitle: "बजट वितरण (कुल 5 करोड़)",
      chartData: {
        labels: ["शिक्षा", "स्वास्थ्य", "रक्षा"],
        datasets: [{ label: "बजट %", data: [30, 25, 45] }]
      },
      questions: [
        { question: "शिक्षा को कितना?", options: ["1.25 करोड़", "1.50 करोड़", "2.00 करोड़", "2.25 करोड़"], correct: 1, explanation: "30% of 5=1.50" }
      ]
    },

    // ── DI LINE GRAPH ──
    {
      qNo: 61,
      type: "di_line_graph",
      unitId: "unit7",
      diTitle: "तापमान",
      chartData: {
        labels: ["सोम", "मंगल", "बुध", "गुरु"],
        datasets: [
          { label: "शहर A", data: [28, 30, 32, 31], color: "#FF6384" },
          { label: "शहर B", data: [25, 26, 28, 30], color: "#36A2EB" }
        ]
      },
      questions: [
        { question: "अधिकतम अंतर किस दिन?", options: ["सोम", "मंगल", "बुध", "गुरु"], correct: 2, explanation: "बुध: 32-28=4" }
      ]
    },

    // ── DI CASELET ──
    {
      qNo: 62,
      type: "di_caselet",
      unitId: "unit7",
      diTitle: "कंपनी वित्त",
      caseletText: "राजस्व 50 करोड़। 40% A, 35% B, शेष C से। व्यय 35 करोड़।",
      questions: [
        { question: "C से राजस्व?", options: ["10 करोड़", "12.5 करोड़", "15 करोड़", "17.5 करोड़"], correct: 1, explanation: "25% of 50=12.5" }
      ]
    }
  ],

  topTopics: [
    { rank: 1, topic: "1857 का विद्रोह", unitId: "unit7", questionCount: 7, mustScore: true }
  ],

  conceptsTracked: [
    { concept: "धम्म", unitId: "unit2", qNo: "Q52", type: "assertion_reason" }
  ],

  trends: [
    { trend: "Statement-based बढ़ रहे हैं", direction: "increasing", tip: "elimination practice" }
  ],

  difficultyMatrix: [
    { zone: "GREEN", qRange: "Q51-Q65", type: "MCQ", difficulty: "Easy", targetScore: "80%" }
  ]
};

// Add to ALL_TEMPLATES
ALL_TEMPLATES.unified_pyq = {
  name: 'Unified PYQ + Questions',
  nameHi: 'एकीकृत PYQ + प्रश्न',
  description: 'Analysis + All 11 question types in ONE file',
  category: 'featured',
  template: unifiedPYQTemplate
};
export default JSONImport;