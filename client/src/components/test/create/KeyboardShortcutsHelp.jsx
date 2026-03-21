import React from 'react';
import { Keyboard, X } from 'lucide-react';

const KeyboardShortcutsHelp = ({ isOpen, onClose, language }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  const shortcuts = [
    { keys: ['←'], action: t('पिछला स्टेप', 'Previous Step'), category: t('नेविगेशन', 'Navigation') },
    { keys: ['→'], action: t('अगला स्टेप', 'Next Step'), category: t('नेविगेशन', 'Navigation') },
    { keys: ['Enter'], action: t('सलेक्ट / अगला', 'Select / Next'), category: t('नेविगेशन', 'Navigation') },
    { keys: ['Ctrl', 'Z'], action: t('पूर्ववत करें', 'Undo'), category: t('संपादन', 'Editing') },
    { keys: ['Ctrl', 'Y'], action: t('फिर से करें', 'Redo'), category: t('संपादन', 'Editing') },
    { keys: ['Ctrl', 'S'], action: t('परीक्षा सेव करें', 'Save Test'), category: t('संपादन', 'Editing') },
    { keys: ['A'], action: t('प्रश्न जोड़ें', 'Add Questions'), category: t('त्वरित', 'Quick') },
    { keys: ['/'], action: t('खोज', 'Search'), category: t('त्वरित', 'Quick') },
    { keys: ['?'], action: t('सहायता', 'Help'), category: t('त्वरित', 'Quick') },
    { keys: ['Esc'], action: t('मोडल बंद करें', 'Close Modal'), category: t('मोडल', 'Modal') }
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t('कीबोर्ड शॉर्टकट', 'Keyboard Shortcuts')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('तेज़ नेविगेशन के लिए', 'For faster navigation')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category}>
              <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">{category}</h4>
              <div className="space-y-2">
                {shortcuts.filter(s => s.category === category).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{shortcut.action}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {shortcut.keys.map((key, ki) => (
                        <React.Fragment key={ki}>
                          <kbd className="px-2.5 py-1 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm">{key}</kbd>
                          {ki < shortcut.keys.length - 1 && <span className="text-gray-400 text-xs">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;