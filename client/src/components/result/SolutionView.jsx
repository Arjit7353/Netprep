import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Circle,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';
import MCQQuestion from '../question/QuestionTypes/MCQQuestion';
import AssertionReason from '../question/QuestionTypes/AssertionReason';
import MatchFollowing from '../question/QuestionTypes/MatchFollowing';
import SequenceOrder from '../question/QuestionTypes/SequenceOrder';
import StatementBased from '../question/QuestionTypes/StatementBased';
import PassageQuestion from '../question/QuestionTypes/PassageQuestion';
import DITableChart from '../question/QuestionTypes/DITableChart';
import DIBarChart from '../question/QuestionTypes/DIBarChart';
import DIPieChart from '../question/QuestionTypes/DIPieChart';
import DILineGraph from '../question/QuestionTypes/DILineGraph';
import DIMixedChart from '../question/QuestionTypes/DIMixedChart';
import DICaselet from '../question/QuestionTypes/DICaselet';

const SolutionView = ({ questions, language = 'en' }) => {
  const [expandedQuestions, setExpandedQuestions] = useState([]);
  const [filter, setFilter] = useState('all'); // all | correct | wrong | skipped

  const toggleQuestion = (index) => {
    setExpandedQuestions(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getQuestionComponent = (question) => {
    const components = {
      mcq: MCQQuestion,
      assertion_reason: AssertionReason,
      match_following: MatchFollowing,
      sequence_order: SequenceOrder,
      statement_based: StatementBased,
      passage_based: PassageQuestion,
      di_table: DITableChart,
      di_bar_chart: DIBarChart,
      di_pie_chart: DIPieChart,
      di_line_graph: DILineGraph,
      di_mixed: DIMixedChart,
      di_caselet: DICaselet
    };

    return components[question.questionType] || MCQQuestion;
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'correct') return q.isCorrect;
    if (filter === 'wrong') return !q.isCorrect && q.selectedAnswer !== -1;
    if (filter === 'skipped') return q.selectedAnswer === -1;
    return true;
  });

  const text = {
    allQuestions: { en: 'All Questions', hi: 'सभी प्रश्न' },
    correctOnly: { en: 'Correct Only', hi: 'केवल सही' },
    wrongOnly: { en: 'Wrong Only', hi: 'केवल गलत' },
    skippedOnly: { en: 'Skipped Only', hi: 'केवल छोड़े गए' },
    yourAnswer: { en: 'Your Answer', hi: 'आपका उत्तर' },
    correctAnswer: { en: 'Correct Answer', hi: 'सही उत्तर' },
    notAnswered: { en: 'Not Answered', hi: 'उत्तर नहीं दिया' },
    explanation: { en: 'Explanation', hi: 'व्याख्या' },
    showSolution: { en: 'Show Solution', hi: 'समाधान दिखाएं' },
    hideSolution: { en: 'Hide Solution', hi: 'समाधान छुपाएं' }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: text.allQuestions[language] },
          { id: 'correct', label: text.correctOnly[language] },
          { id: 'wrong', label: text.wrongOnly[language] },
          { id: 'skipped', label: text.skippedOnly[language] }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors
              ${filter === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No questions to display
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const QuestionComponent = getQuestionComponent(q.question);
            const isExpanded = expandedQuestions.includes(index);

            return (
              <div
                key={index}
                className={`
                  border-2 rounded-lg overflow-hidden
                  ${q.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : q.selectedAnswer === -1
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-red-200 bg-red-50'
                  }
                `}
              >
                {/* Question Header */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleQuestion(index)}
                >
                  <div className="flex items-center gap-3">
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : q.selectedAnswer === -1 ? (
                      <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900">
                      Question {q.questionNumber}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>

                {/* Question Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-white space-y-4">
                    {/* Question Display */}
                    <QuestionComponent
                      question={q.question}
                      language={language}
                      selectedAnswer={q.selectedAnswer}
                      correctAnswer={q.correctAnswer}
                      isReview={true}
                      showCorrectAnswer={true}
                    />

                    {/* Answer Status */}
                    <div className="flex items-start gap-4 text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 mb-1">
                          {text.yourAnswer[language]}:
                        </div>
                        <div className={`
                          font-bold
                          ${q.selectedAnswer === -1 
                            ? 'text-gray-500' 
                            : q.isCorrect 
                            ? 'text-green-600' 
                            : 'text-red-600'
                          }
                        `}>
                          {q.selectedAnswer === -1 
                            ? text.notAnswered[language]
                            : `Option ${String.fromCharCode(65 + q.selectedAnswer)}`
                          }
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 mb-1">
                          {text.correctAnswer[language]}:
                        </div>
                        <div className="font-bold text-green-600">
                          Option {String.fromCharCode(65 + q.correctAnswer)}
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {q.question.explanation && q.question.explanation[language] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            {text.explanation[language]}
                          </span>
                        </div>
                        <div className="text-sm text-blue-900 leading-relaxed">
                          {q.question.explanation[language]}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SolutionView;