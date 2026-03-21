import React from 'react';
import { createPortal } from 'react-dom';
import {
  X, BookOpen, Target, Layers, Star, Calendar, Hash,
  CheckCircle2, XCircle, Eye
} from 'lucide-react';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from '../../../utils/constants';

const QuestionPreviewModal = ({ question, isOpen, onClose, language = 'hi' }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  if (!isOpen || !question) return null;

  const q = question;
  const getText = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.hi || field.en || '';
  };

  const questionText = getText(q.question);
  const explanation = getText(q.explanation);
  const isHtml = (str) => str && str.includes('<') && (str.includes('</') || str.includes('/>'));

  const diffColors = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  const getOptions = () => {
    if (!q.options) return [];
    if (Array.isArray(q.options)) return q.options;
    return Object.values(q.options);
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh]
          overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r
          from-primary-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600
              flex items-center justify-center shadow-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t('प्रश्न पूर्वावलोकन', 'Question Preview')}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-bold">
                  #{q.questionNumber || '-'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-bold">
                  {q.paper === 'paper1' ? 'Paper 1' : 'Paper 2'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${diffColors[q.difficulty] || diffColors.medium}`}>
                  {DIFFICULTY_LABELS[q.difficulty]?.[language] || q.difficulty}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 rounded font-bold">
                  {QUESTION_TYPE_LABELS[q.questionType]?.[language] || q.questionType}
                </span>
                {q.isPYQ && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3" />PYQ
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[60vh] p-5 space-y-5">
          {/* Meta Info */}
          <div className="flex flex-wrap gap-2">
            {q.unit && (
              <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg font-medium flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />{q.unit}
              </span>
            )}
            {q.chapter && (
              <span className="text-xs px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />{q.chapter}
              </span>
            )}
            {q.topic && (
              <span className="text-xs px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />{q.topic}
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
              {t('प्रश्न', 'Question')}
            </h4>
            {isHtml(questionText) ? (
              <div
                className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed break-words question-preview-content"
                dangerouslySetInnerHTML={{ __html: questionText }}
              />
            ) : (
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {questionText}
              </p>
            )}
          </div>

          {/* Options */}
          {getOptions().length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                {t('विकल्प', 'Options')}
              </h4>
              <div className="space-y-2">
                {getOptions().map((opt, i) => {
                  const optText = getText(typeof opt === 'object' ? opt : { [language]: opt });
                  const optStr = typeof opt === 'string' ? opt : optText;
                  const isCorrect =
                    q.correctAnswer === i ||
                    q.correctAnswer === String(i) ||
                    q.correctAnswer === String.fromCharCode(65 + i) ||
                    q.correctAnswer === String.fromCharCode(97 + i);
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-colors
                        ${isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                    >
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center
                        text-xs font-black flex-shrink-0
                        ${isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`text-sm flex-1 pt-0.5
                        ${isCorrect ? 'text-green-800 dark:text-green-200 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                        {optStr}
                      </span>
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Explanation */}
          {explanation && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">
                {t('व्याख्या', 'Explanation')}
              </h4>
              {isHtml(explanation) ? (
                <div className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: explanation }} />
              ) : (
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </p>
              )}
            </div>
          )}

          {/* Meta Footer */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            {q.marks && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />{q.marks} {t('अंक', 'marks')}
              </span>
            )}
            {q.createdAt && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(q.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900
              rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            {t('बंद करें', 'Close')}
          </button>
        </div>
      </div>

      <style>{`
        .question-preview-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
        .question-preview-content table { border-collapse: collapse; width: 100%; }
        .question-preview-content td, .question-preview-content th { border: 1px solid #e5e7eb; padding: 6px 10px; }
      `}</style>
    </div>,
    document.body
  );
};

export default QuestionPreviewModal;