import React from 'react';
import { PALETTE_COLORS } from '../../utils/constants';

const TestPalette = ({
  answers = [],
  currentIndex = 0,
  onQuestionClick,
  language = 'hi'
}) => {
  // Get status for each question
  const getQuestionStatus = (answer) => {
    if (!answer.visited) {
      return 'NOT_VISITED';
    }
    if (answer.selectedAnswer !== -1 && answer.markedForReview) {
      return 'ANSWERED_AND_MARKED';
    }
    if (answer.markedForReview) {
      return 'MARKED_FOR_REVIEW';
    }
    if (answer.selectedAnswer !== -1) {
      return 'ANSWERED';
    }
    return 'NOT_ANSWERED';
  };

  // Get style classes for a question button
  const getButtonStyle = (answer, index) => {
    const status = getQuestionStatus(answer);
    const colors = PALETTE_COLORS[status];
    const isActive = index === currentIndex;

    return `
      w-10 h-10 rounded-lg font-medium text-sm
      flex items-center justify-center
      transition-all duration-200
      ${colors.bg} ${colors.text}
      ${isActive ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}
      ${status === 'ANSWERED_AND_MARKED' ? 'ring-2 ring-green-500' : ''}
      hover:opacity-80 cursor-pointer
    `;
  };

  // Calculate summary counts
  const getSummary = () => {
    const summary = {
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      answeredAndMarked: 0,
      notVisited: 0
    };

    answers.forEach(answer => {
      const status = getQuestionStatus(answer);
      switch (status) {
        case 'ANSWERED':
          summary.answered++;
          break;
        case 'NOT_ANSWERED':
          summary.notAnswered++;
          break;
        case 'MARKED_FOR_REVIEW':
          summary.markedForReview++;
          break;
        case 'ANSWERED_AND_MARKED':
          summary.answeredAndMarked++;
          break;
        case 'NOT_VISITED':
          summary.notVisited++;
          break;
      }
    });

    return summary;
  };

  const summary = getSummary();

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      {/* Legend */}
      <div className="mb-4 space-y-2">
        <h3 className="font-medium text-gray-900 mb-3">
          {language === 'hi' ? 'प्रश्न पैलेट' : 'Question Palette'}
        </h3>
        
        <div className="grid grid-cols-1 gap-2 text-xs">
          {/* Not Visited */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${PALETTE_COLORS.NOT_VISITED.bg} ${PALETTE_COLORS.NOT_VISITED.border} border`} />
            <span className="text-gray-600">
              {summary.notVisited} {language === 'hi' 
                ? PALETTE_COLORS.NOT_VISITED.label.hi 
                : PALETTE_COLORS.NOT_VISITED.label.en}
            </span>
          </div>

          {/* Not Answered */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${PALETTE_COLORS.NOT_ANSWERED.bg}`} />
            <span className="text-gray-600">
              {summary.notAnswered} {language === 'hi' 
                ? PALETTE_COLORS.NOT_ANSWERED.label.hi 
                : PALETTE_COLORS.NOT_ANSWERED.label.en}
            </span>
          </div>

          {/* Answered */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${PALETTE_COLORS.ANSWERED.bg}`} />
            <span className="text-gray-600">
              {summary.answered} {language === 'hi' 
                ? PALETTE_COLORS.ANSWERED.label.hi 
                : PALETTE_COLORS.ANSWERED.label.en}
            </span>
          </div>

          {/* Marked for Review */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${PALETTE_COLORS.MARKED_FOR_REVIEW.bg}`} />
            <span className="text-gray-600">
              {summary.markedForReview} {language === 'hi' 
                ? PALETTE_COLORS.MARKED_FOR_REVIEW.label.hi 
                : PALETTE_COLORS.MARKED_FOR_REVIEW.label.en}
            </span>
          </div>

          {/* Answered & Marked */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded ${PALETTE_COLORS.ANSWERED_AND_MARKED.bg} ring-2 ring-green-500`} />
            <span className="text-gray-600">
              {summary.answeredAndMarked} {language === 'hi' 
                ? PALETTE_COLORS.ANSWERED_AND_MARKED.label.hi 
                : PALETTE_COLORS.ANSWERED_AND_MARKED.label.en}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t my-4" />

      {/* Question Grid */}
      <div className="grid grid-cols-5 gap-2">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(index)}
            className={getButtonStyle(answer, index)}
            title={`Question ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">
            {language === 'hi' ? 'कुल प्रश्न:' : 'Total:'} <strong>{answers.length}</strong>
          </div>
          <div className="text-green-600">
            {language === 'hi' ? 'उत्तर दिए:' : 'Answered:'} <strong>{summary.answered + summary.answeredAndMarked}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPalette;