import React from 'react';
import { BookOpen, CheckCircle, SkipForward, ArrowRight } from 'lucide-react';

const PracticeInstructions = ({ test, onStart, onCancel, language = 'hi' }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {test?.title || t('प्रैक्टिस टेस्ट', 'Practice Test')}
              </h1>
              <p className="text-blue-100 text-sm font-medium">
                {t('सुपर फास्ट प्रैक्टिस मोड', 'Super Fast Practice Mode')}
              </p>
            </div>
          </div>

          {/* Instructions Body */}
          <div className="p-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-sm font-bold">i</span>
              {t('महत्वपूर्ण निर्देश', 'Important Instructions')}
            </h2>

            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('रीयल-टाइम चेकिंग', 'Real-time Checking')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('अपना उत्तर चुनने के बाद "चेक करें" बटन दबाएं। सही उत्तर तुरंत हरा हो जाएगा और गलत उत्तर लाल।', 'After selecting your answer, press the "Check" button. Correct answers will instantly turn green, and incorrect ones red.')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                  <SkipForward className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('स्किप करने की सुविधा', 'Skip Feature')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('यदि आपको कोई प्रश्न नहीं आता है, तो आप "छोड़ें" (Skip) बटन पर क्लिक करके सीधे अगले प्रश्न पर जा सकते हैं।', 'If you don\'t know a question, you can click "Skip" to jump straight to the next question.')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {t('बिना डिस्ट्रैक्शन के पढ़ें', 'Distraction-free Study')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('यह मोड केवल आपकी प्रैक्टिस के लिए बनाया गया है। आपको केवल प्रश्न और विकल्प दिखेंगे ताकि आपका ध्यान न भटके।', 'This mode is designed purely for practice. You will only see questions and options so you stay focused.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t('वापस जाएं', 'Go Back')}
              </button>
              <button
                onClick={onStart}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                {t('प्रैक्टिस शुरू करें', 'Start Practice')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeInstructions;
