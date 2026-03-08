import React, { useMemo } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, HelpCircle,
  Flag, X, Send, ShieldCheck, ArrowLeft, Loader2
} from 'lucide-react';

const TestSubmitModal = ({
  isOpen, onClose, onSubmit,
  summary = {}, remainingTime = 0,
  isSubmitting = false, language = 'hi', error = null
}) => {
  if (!isOpen) return null;

  const {
    total = 0, answered = 0, notAnswered = 0,
    markedForReview = 0, answeredAndMarked = 0, notVisited = 0
  } = summary;

  const totalAttempted = answered + answeredAndMarked;
  const totalMarked = markedForReview + answeredAndMarked;
  const totalUnanswered = notAnswered + notVisited;
  const progress = total > 0 ? Math.round((totalAttempted / total) * 100) : 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const C = 2 * Math.PI * 38;
  const offset = C * (1 - progress / 100);

  const statItems = useMemo(() => [
    {
      icon: CheckCircle, label: { hi: 'उत्तर दिए', en: 'Answered' },
      value: totalAttempted, color: 'emerald',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconClass: 'bg-emerald-500 text-white',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      numClass: 'text-emerald-800 dark:text-emerald-200'
    },
    {
      icon: XCircle, label: { hi: 'उत्तर नहीं दिए', en: 'Not Answered' },
      value: totalUnanswered, color: 'red',
      bgClass: totalUnanswered > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-800',
      iconClass: totalUnanswered > 0 ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-600',
      textClass: totalUnanswered > 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-600',
      numClass: totalUnanswered > 0 ? 'text-red-800 dark:text-red-200' : 'text-slate-700'
    },
    {
      icon: Flag, label: { hi: 'समीक्षा हेतु', en: 'Marked Review' },
      value: totalMarked, color: 'violet',
      bgClass: totalMarked > 0 ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-slate-50 dark:bg-slate-800',
      iconClass: totalMarked > 0 ? 'bg-violet-500 text-white' : 'bg-slate-300 text-slate-600',
      textClass: totalMarked > 0 ? 'text-violet-700 dark:text-violet-300' : 'text-slate-600',
      numClass: totalMarked > 0 ? 'text-violet-800 dark:text-violet-200' : 'text-slate-700'
    },
  ], [totalAttempted, totalUnanswered, totalMarked]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={!isSubmitting ? onClose : undefined} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-rose-600" />
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '16px 16px'
            }} />
          <div className="relative p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {language === 'hi' ? 'परीक्षा जमा करें?' : 'Submit Test?'}
                </h2>
                <p className="text-white/60 text-xs">
                  {language === 'hi' ? 'कृपया समीक्षा करें और पुष्टि करें' : 'Review and confirm submission'}
                </p>
              </div>
            </div>
            {!isSubmitting && (
              <button onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/15 transition-colors">
                <X className="w-5 h-5 text-white/80" />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-2.5">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Time + Progress Ring */}
        <div className="flex items-center justify-center gap-6 py-6">
          {/* Progress Ring */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="38" fill="none" stroke="currentColor"
                className="text-slate-100 dark:text-slate-700" strokeWidth="5" />
              <circle cx="44" cy="44" r="38" fill="none"
                stroke={progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{progress}%</span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                {language === 'hi' ? 'पूर्ण' : 'done'}
              </span>
            </div>
          </div>

          {/* Time remaining */}
          {remainingTime > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'hi' ? 'शेष समय' : 'Time Left'}
                </span>
              </div>
              <span className="text-2xl font-black font-mono text-slate-800 dark:text-white tabular-nums">
                {formatTime(remainingTime)}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-5 pb-5 space-y-2.5">
          {/* Total */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
              </span>
            </div>
            <span className="text-lg font-black text-slate-800 dark:text-white tabular-nums">{total}</span>
          </div>

          {/* Dynamic Stats */}
          {statItems.map(({ icon: Ic, label, value, bgClass, iconClass, textClass, numClass }, i) => (
            <div key={i} className={`flex items-center justify-between p-3.5 ${bgClass} rounded-2xl transition-colors`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${iconClass} flex items-center justify-center shadow-sm`}>
                  <Ic className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${textClass}`}>
                  {language === 'hi' ? label.hi : label.en}
                </span>
              </div>
              <span className={`text-lg font-black ${numClass} tabular-nums`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {!isSubmitting && (totalUnanswered > 0 || totalMarked > 0) && (
          <div className="px-5 pb-5 space-y-2">
            {totalUnanswered > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {language === 'hi'
                    ? `${totalUnanswered} प्रश्नों के उत्तर नहीं दिए गए हैं। क्या आप फिर भी जमा करना चाहते हैं?`
                    : `${totalUnanswered} questions are unanswered. Do you still want to submit?`}
                </p>
              </div>
            )}
            {totalMarked > 0 && (
              <div className="p-3 bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-800 rounded-2xl flex items-start gap-2.5">
                <Flag className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-violet-800 dark:text-violet-300">
                  {language === 'hi'
                    ? `${totalMarked} प्रश्न समीक्षा के लिए चिह्नित हैं।`
                    : `${totalMarked} questions are marked for review.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowLeft className="w-4 h-4" />
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>
          <button onClick={onSubmit} disabled={isSubmitting}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] min-w-[140px] justify-center">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'hi' ? 'जमा हो रहा...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {language === 'hi' ? 'जमा करें' : 'Submit'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSubmitModal;