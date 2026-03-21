import React, { useState } from 'react';
import { Check, Copy, Edit3, Sparkles, Wand2 } from 'lucide-react';
import { TEST_TYPE_CONFIG } from '../../../utils/constants';

const GRADIENT_MAP = {
  dpp: 'from-blue-500 to-blue-600',
  topic_test: 'from-emerald-500 to-emerald-600',
  chapter_test: 'from-purple-500 to-purple-600',
  unit_test: 'from-orange-500 to-orange-600',
  pyq_year: 'from-red-500 to-red-600',
  practice: 'from-teal-500 to-teal-600',
  full_mock_p1: 'from-indigo-500 to-indigo-600',
  full_mock_p2: 'from-pink-500 to-pink-600',
  full_mock_combined: 'from-gray-600 to-gray-700'
};

const EnhancedTitlePreview = ({ title, testType, language, onCopy, onEdit }) => {
  const typeConfig = TEST_TYPE_CONFIG[testType];
  const t = (hi, en) => language === 'hi' ? hi : en;
  const [copied, setCopied] = useState(false);
  const gradient = GRADIENT_MAP[testType] || 'from-gray-500 to-gray-600';

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r ${gradient} shadow-lg flex items-center gap-1.5`}>
              <Sparkles className="w-3.5 h-3.5" />
              {typeConfig?.shortCode || 'TEST'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full font-medium">
              <Wand2 className="w-3.5 h-3.5 text-amber-500" />
              {t('स्वतः उत्पन्न', 'Auto Generated')}
            </span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white break-words leading-tight">
            {title || t('शीर्षक यहाँ दिखेगा...', 'Title will appear here...')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopy}
            className={`p-3 rounded-xl transition-all group border shadow-sm hover:shadow-md ${copied ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600' : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'}`}
            title={t('कॉपी करें', 'Copy')}>
            {copied ? <Check className="w-5 h-5 text-green-600 dark:text-green-400" /> : <Copy className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />}
          </button>
          <button type="button" onClick={onEdit}
            className="p-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all group shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
            title={t('संपादित करें', 'Edit')}>
            <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTitlePreview;