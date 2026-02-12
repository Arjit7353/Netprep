import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  HelpCircle,
  Flag,
  X,
  Send
} from 'lucide-react';
import Loader from '../common/Loader';

const TestSubmitModal = ({
  isOpen,
  onClose,
  onSubmit,
  summary = {},
  remainingTime = 0,
  isSubmitting = false,
  language = 'hi',
  error = null
}) => {
  if (!isOpen) return null;

  const {
    total = 0,
    answered = 0,
    notAnswered = 0,
    markedForReview = 0,
    answeredAndMarked = 0,
    notVisited = 0
  } = summary;

  const totalAttempted = answered + answeredAndMarked;
  const totalMarked = markedForReview + answeredAndMarked;
  const totalUnanswered = notAnswered + notVisited;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const hasUnanswered = totalUnanswered > 0;
  const hasMarkedQuestions = totalMarked > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">
                  {language === 'hi' ? 'परीक्षा जमा करें?' : 'Submit Test?'}
                </h2>
                <p className="text-white/80 text-sm">
                  {language === 'hi' ? 'कृपया पुष्टि करें' : 'Please confirm'}
                </p>
              </div>
            </div>
            {!isSubmitting && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Remaining Time */}
        {remainingTime > 0 && (
          <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">
              {language === 'hi' ? 'शेष समय: ' : 'Time Remaining: '}
              <strong className="font-mono">{formatTime(remainingTime)}</strong>
            </span>
          </div>
        )}

        {/* Summary Stats */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            {language === 'hi' ? 'सारांश' : 'Summary'}
          </h3>

          <div className="space-y-3">
            {/* Total Questions */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-gray-700">
                  {language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
                </span>
              </div>
              <span className="font-bold text-gray-900">{total}</span>
            </div>

            {/* Answered */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-green-800">
                  {language === 'hi' ? 'उत्तर दिए गए' : 'Answered'}
                </span>
              </div>
              <span className="font-bold text-green-700">{totalAttempted}</span>
            </div>

            {/* Not Answered */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              hasUnanswered ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasUnanswered ? 'bg-red-500' : 'bg-gray-300'
                }`}>
                  <XCircle className={`w-4 h-4 ${hasUnanswered ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={hasUnanswered ? 'text-red-800' : 'text-gray-700'}>
                  {language === 'hi' ? 'उत्तर नहीं दिए' : 'Not Answered'}
                </span>
              </div>
              <span className={`font-bold ${hasUnanswered ? 'text-red-700' : 'text-gray-700'}`}>
                {totalUnanswered}
              </span>
            </div>

            {/* Marked for Review */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              hasMarkedQuestions ? 'bg-purple-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasMarkedQuestions ? 'bg-purple-500' : 'bg-gray-300'
                }`}>
                  <Flag className={`w-4 h-4 ${hasMarkedQuestions ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={hasMarkedQuestions ? 'text-purple-800' : 'text-gray-700'}>
                  {language === 'hi' ? 'समीक्षा के लिए' : 'Marked for Review'}
                </span>
              </div>
              <span className={`font-bold ${hasMarkedQuestions ? 'text-purple-700' : 'text-gray-700'}`}>
                {totalMarked}
              </span>
            </div>
          </div>

          {/* Warning Messages */}
          {(hasUnanswered || hasMarkedQuestions) && !isSubmitting && (
            <div className="mt-4 space-y-2">
              {hasUnanswered && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    {language === 'hi' 
                      ? `आपने ${totalUnanswered} प्रश्नों का उत्तर नहीं दिया है।`
                      : `You have ${totalUnanswered} unanswered questions.`
                    }
                  </p>
                </div>
              )}

              {hasMarkedQuestions && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2">
                  <Flag className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-800">
                    {language === 'hi' 
                      ? `${totalMarked} प्रश्न समीक्षा के लिए चिह्नित हैं।`
                      : `${totalMarked} questions are marked for review.`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg min-w-[140px] justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader size="sm" color="white" />
                <span>{language === 'hi' ? 'जमा हो रहा है...' : 'Submitting...'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{language === 'hi' ? 'जमा करें' : 'Submit'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSubmitModal;