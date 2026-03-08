import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

const ExamNotepad = ({ onClose, testId, language = 'hi' }) => {
  const storageKey = `netprep-notepad-${testId || 'general'}`;

  const [text, setText] = useState(() => {
    try { return localStorage.getItem(storageKey) || ''; } catch { return ''; }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, text); } catch {}
  }, [text, storageKey]);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[340px] animate-scale-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {language === 'hi' ? 'रफ नोटपैड' : 'Rough Notepad'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setText('')}
              className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600"
              title={language === 'hi' ? 'साफ करें' : 'Clear'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Textarea */}
        <div className="p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={language === 'hi'
              ? 'यहां रफ कार्य करें...\nयह स्वतः सहेजा जाएगा।'
              : 'Do rough work here...\nThis auto-saves locally.'}
            className="w-full h-48 p-3 text-sm font-mono bg-amber-50/50 dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 dark:text-slate-200 placeholder:text-amber-300 dark:placeholder:text-slate-600"
            spellCheck={false}
          />
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            <span>{text.length} {language === 'hi' ? 'अक्षर' : 'chars'}</span>
            <span>{language === 'hi' ? 'स्वतः सहेजा गया' : 'Auto-saved locally'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamNotepad;