import React, { useMemo, useRef, useEffect } from 'react';
import { Flag, CheckCircle, Eye, EyeOff, ArrowUp, Send } from 'lucide-react';
import { QUESTION_TYPE_LABELS } from '../../utils/constants';

const STATUS_CONFIG = {
  NOT_VISITED: {
    bg: 'bg-slate-200 dark:bg-slate-700',
    text: 'text-slate-600 dark:text-slate-300',
    ring: '',
    dot: 'bg-slate-400',
    label: { hi: 'देखा नहीं गया', en: 'Not Visited' },
  },
  NOT_ANSWERED: {
    bg: 'bg-red-500',
    text: 'text-white',
    ring: '',
    dot: 'bg-red-500',
    label: { hi: 'उत्तर नहीं दिया', en: 'Not Answered' },
  },
  ANSWERED: {
    bg: 'bg-emerald-500',
    text: 'text-white',
    ring: '',
    dot: 'bg-emerald-500',
    label: { hi: 'उत्तर दिया गया', en: 'Answered' },
  },
  MARKED_FOR_REVIEW: {
    bg: 'bg-violet-500',
    text: 'text-white',
    ring: '',
    dot: 'bg-violet-500',
    label: { hi: 'समीक्षा हेतु चिह्नित', en: 'Marked for Review' },
  },
  ANSWERED_AND_MARKED: {
    bg: 'bg-violet-500',
    text: 'text-white',
    ring: 'ring-[3px] ring-emerald-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-900',
    dot: 'bg-violet-500',
    label: { hi: 'उत्तर + चिह्नित', en: 'Answered & Marked' },
  },
};

const getStatus = (answer) => {
  if (!answer?.visited) return 'NOT_VISITED';
  if (answer.selectedAnswer !== -1 && answer.markedForReview) return 'ANSWERED_AND_MARKED';
  if (answer.markedForReview) return 'MARKED_FOR_REVIEW';
  if (answer.selectedAnswer !== -1) return 'ANSWERED';
  return 'NOT_ANSWERED';
};

const TestPalette = ({
  answers = [],
  questions = [],
  currentIndex = 0,
  onQuestionClick,
  onSubmit,
  isSubmitting = false,
  language = 'hi',
}) => {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  const summary = useMemo(() => {
    const s = { answered: 0, notAnswered: 0, marked: 0, answeredMarked: 0, notVisited: 0 };
    answers.forEach((a) => {
      const st = getStatus(a);
      if (st === 'ANSWERED') s.answered++;
      else if (st === 'NOT_ANSWERED') s.notAnswered++;
      else if (st === 'MARKED_FOR_REVIEW') s.marked++;
      else if (st === 'ANSWERED_AND_MARKED') s.answeredMarked++;
      else s.notVisited++;
    });
    return s;
  }, [answers]);

  const totalAttempted = summary.answered + summary.answeredMarked;
  const progress = answers.length > 0 ? Math.round((totalAttempted / answers.length) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Progress Ring */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor"
                className="text-slate-100 dark:text-slate-800" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor"
                className="text-emerald-500" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 dark:text-white">
              {totalAttempted}/{answers.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'hi' ? 'प्रश्न हल किए' : 'questions attempted'}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = key === 'ANSWERED' ? summary.answered
              : key === 'NOT_ANSWERED' ? summary.notAnswered
              : key === 'MARKED_FOR_REVIEW' ? summary.marked
              : key === 'ANSWERED_AND_MARKED' ? summary.answeredMarked
              : summary.notVisited;
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${cfg.bg} ${cfg.text} ${cfg.ring}`}>
                  1
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 flex-1 truncate">
                  {language === 'hi' ? cfg.label.hi : cfg.label.en}
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        <div className="grid grid-cols-7 gap-1.5">
          {answers.map((answer, index) => {
            const st = getStatus(answer);
            const cfg = STATUS_CONFIG[st];
            const isCurrent = index === currentIndex;

            return (
              <button
                key={index}
                ref={isCurrent ? activeRef : null}
                onClick={() => onQuestionClick(index)}
                title={`Q${index + 1}`}
                className={`
                  w-full aspect-square rounded-lg text-xs font-bold
                  flex items-center justify-center
                  transition-all duration-150 active:scale-90
                  ${cfg.bg} ${cfg.text} ${cfg.ring}
                  ${isCurrent
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110 shadow-lg z-10'
                    : 'hover:opacity-80 hover:shadow'}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Jump to first unanswered */}
      {summary.notVisited > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              const idx = answers.findIndex(a => !a?.visited);
              if (idx >= 0) onQuestionClick(idx);
            }}
            className="w-full py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1"
          >
            <ArrowUp className="w-3 h-3" />
            {language === 'hi' ? 'पहला अनदेखा प्रश्न' : 'Jump to first unvisited'}
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
        >
          <Send className="w-4 h-4" />
          {language === 'hi' ? 'परीक्षा जमा करें' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
};

export default TestPalette;