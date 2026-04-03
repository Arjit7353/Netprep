import React, { useState, useRef, useCallback } from 'react';
import {
  X, AlertTriangle, Trash2, Send, CheckCircle, Loader2,
  ImagePlus, Flag, XCircle, Type, ListChecks, Globe,
  BookOpen, Pencil, Palette, Image, Copy, HelpCircle
} from 'lucide-react';
import reportService from '../../services/reportService';

const REPORT_TYPES = [
  { value: 'wrong_answer', hi: 'गलत उत्तर', en: 'Wrong Answer', icon: XCircle, color: 'text-red-500' },
  { value: 'wrong_question', hi: 'गलत प्रश्न पाठ', en: 'Wrong Question Text', icon: Type, color: 'text-orange-500' },
  { value: 'wrong_options', hi: 'गलत विकल्प', en: 'Wrong Options', icon: ListChecks, color: 'text-amber-500' },
  { value: 'explanation_error', hi: 'व्याख्या में त्रुटि', en: 'Explanation Error', icon: BookOpen, color: 'text-purple-500' },
  { value: 'missing_translation', hi: 'अनुवाद गायब है', en: 'Missing Translation', icon: Globe, color: 'text-blue-500' },
  { value: 'typo', hi: 'टाइपो / वर्तनी गलती', en: 'Typo / Spelling Error', icon: Pencil, color: 'text-teal-500' },
  { value: 'formatting', hi: 'फॉर्मेटिंग समस्या', en: 'Formatting Issue', icon: Palette, color: 'text-indigo-500' },
  { value: 'image_issue', hi: 'चित्र/ग्राफ़ समस्या', en: 'Image/Graph Issue', icon: Image, color: 'text-cyan-500' },
  { value: 'duplicate_question', hi: 'डुप्लीकेट प्रश्न', en: 'Duplicate Question', icon: Copy, color: 'text-slate-500' },
  { value: 'other', hi: 'अन्य समस्या', en: 'Other Issue', icon: HelpCircle, color: 'text-gray-500' },
];

const ReportIssueModal = ({
  isOpen, onClose, questionId, questionSource = 'bank',
  testId, attemptId, questionIndex, language = 'hi'
}) => {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedCorrection, setSuggestedCorrection] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);
  const t = (hi, en) => language === 'hi' ? hi : en;

  const handleFiles = useCallback(async (files) => {
    if (screenshots.length >= 3) { setError(t('अधिकतम 3 स्क्रीनशॉट', 'Max 3 screenshots')); return; }
    setError('');
    const remaining = 3 - screenshots.length;
    const filesToProcess = Array.from(files).slice(0, remaining);
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) { setError(t('केवल इमेज फ़ाइल', 'Only image files')); continue; }
      try { const c = await reportService.compressImage(file); setScreenshots(prev => [...prev, c]); }
      catch (e) { setError(e.message); }
    }
  }, [screenshots.length, language]);

  const removeScreenshot = (idx) => setScreenshots(prev => prev.filter((_, i) => i !== idx));

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!reportType) { setError(t('समस्या का प्रकार चुनें', 'Select issue type')); return; }
    if (!description.trim()) { setError(t('विवरण लिखें', 'Write description')); return; }
    setSubmitting(true); setError('');
    try {
      await reportService.createReport({
        questionId, questionSource, testId, attemptId, questionIndex,
        reportType, description: description.trim(), screenshots,
        suggestedCorrection: suggestedCorrection.trim(),
        reporterName: reporterName.trim() || 'Anonymous'
      });
      setSubmitted(true);
      setTimeout(() => { onClose(); setReportType(''); setDescription(''); setSuggestedCorrection(''); setScreenshots([]);  setSubmitted(false); }, 2000);
    } catch (e) {
      setError(e.message || t('रिपोर्ट भेजने में त्रुटि', 'Failed to submit'));
    } finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" style={{ animation: 'rptIn 0.25s ease-out' }}>
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('रिपोर्ट भेज दी गई!', 'Report Submitted!')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('हम इसकी समीक्षा करेंगे।', 'We will review it soon.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800" style={{ animation: 'rptIn 0.25s ease-out' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Flag className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('समस्या रिपोर्ट करें', 'Report an Issue')}</h3>
              <p className="text-[11px] text-slate-400">{t('प्रश्न', 'Question')} #{(questionIndex || 0) + 1}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('समस्या का प्रकार *', 'Issue Type *')}</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_TYPES.map(rt => {
                const IC = rt.icon;
                return (
                  <button key={rt.value} onClick={() => setReportType(rt.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left text-sm transition-all ${reportType === rt.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                    <IC className={`w-4 h-4 flex-shrink-0 ${reportType === rt.value ? 'text-blue-600' : rt.color}`} />
                    <span className="truncate">{t(rt.hi, rt.en)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('विवरण *', 'Description *')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder={t('क्या गलत है? विस्तार से बताएं...', 'What is wrong? Describe in detail...')}
              rows={3} maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400" />
            <p className="text-right text-[11px] text-slate-400 mt-1">{description.length}/2000</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('सुझाव (वैकल्पिक)', 'Suggested Correction (optional)')}</label>
            <textarea value={suggestedCorrection} onChange={e => setSuggestedCorrection(e.target.value)}
              placeholder={t('सही उत्तर या सुधार...', 'Suggest the correct answer...')}
              rows={2} maxLength={2000}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t(`स्क्रीनशॉट (${screenshots.length}/3)`, `Screenshots (${screenshots.length}/3)`)}</label>
            {screenshots.length < 3 && (
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <ImagePlus className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('इमेज ड्रॉप/क्लिक करें', 'Drop or click to browse')}</p>
                <p className="text-[11px] text-slate-400 mt-1">JPEG, PNG — Max 10MB — Full Quality</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
              </div>
            )}
            {screenshots.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {screenshots.map((ss, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                    <img src={ss.data} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[9px] text-white text-center py-0.5">{ss.width}×{ss.height}</div>
                    <button onClick={e => { e.stopPropagation(); removeScreenshot(idx); }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 className="w-4 h-4 text-white" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('आपका नाम (वैकल्पिक)', 'Your Name (optional)')}</label>
            <input type="text" value={reporterName} onChange={e => setReporterName(e.target.value)} placeholder={t('नाम...', 'Name...')} maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-400" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{t('रद्द करें', 'Cancel')}</button>
          <button onClick={handleSubmit} disabled={submitting || !reportType || !description.trim()}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-bold transition-all disabled:cursor-not-allowed flex items-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t('भेज रहे...', 'Submitting...')}</> : <><Send className="w-4 h-4" />{t('रिपोर्ट भेजें', 'Submit Report')}</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes rptIn{from{opacity:0;transform:translateY(20px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
};

export default ReportIssueModal;