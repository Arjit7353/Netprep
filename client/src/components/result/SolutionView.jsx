import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, CheckCircle, XCircle, Circle } from 'lucide-react';

const SolutionView = ({ questions = [], language = 'en' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const counts = {
    correct: questions.filter((q) => q.isCorrect).length,
    wrong: questions.filter((q) => !q.isCorrect && q.selectedAnswer !== -1).length,
    skipped: questions.filter((q) => q.selectedAnswer === -1).length,
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-600">{counts.correct}</div>
          <div className="text-xs text-green-700">{language === 'hi' ? 'सही' : 'Correct'}</div>
        </div>
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-red-600">{counts.wrong}</div>
          <div className="text-xs text-red-700">{language === 'hi' ? 'गलत' : 'Wrong'}</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
          <Circle className="w-6 h-6 text-gray-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-gray-600">{counts.skipped}</div>
          <div className="text-xs text-gray-500">{language === 'hi' ? 'छोड़ा' : 'Skipped'}</div>
        </div>
      </div>

      {/* CTA to full-page solutions */}
      <button
        onClick={() => navigate(`/results/${id}/solutions`)}
        className="w-full flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all"
      >
        <BookOpen className="w-5 h-5" />
        {language === 'hi' ? 'पूर्ण समाधान देखें (Full Page)' : 'View Full Solutions (Full Page)'}
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Quick list preview */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-secondary-300">
          {language === 'hi' ? 'त्वरित पूर्वावलोकन' : 'Quick Preview'}
        </h4>
        <div className="grid grid-cols-10 gap-1.5">
          {questions.slice(0, 50).map((q, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-bold text-white ${
                q.isCorrect ? 'bg-green-500' : q.selectedAnswer !== -1 ? 'bg-red-500' : 'bg-gray-400'
              }`}
            >
              {q.questionNumber}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SolutionView;