import React, { useState } from 'react';
import { 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  Globe,
  Award,
  MinusCircle
} from 'lucide-react';
import { TEST_TYPE_CONFIG, PAPER_LABELS, PALETTE_COLORS } from '../../utils/constants';
import { formatDuration, getBilingualArray } from '../../utils/helpers';

const TestInstructions = ({
  test,
  onStart,
  onCancel,
  language = 'hi',
  onLanguageChange
}) => {
  const [agreed, setAgreed] = useState(false);

  const typeConfig = TEST_TYPE_CONFIG[test.testType] || {};
  const paperLabel = PAPER_LABELS[test.paper] || {};

  // Get instructions in current language
  const instructions = getBilingualArray(test.instructions, language);

  // Default instructions if none provided
  const defaultInstructions = language === 'hi' ? [
    `इस परीक्षा में कुल ${test.totalQuestions} प्रश्न हैं।`,
    `समय सीमा: ${test.duration} मिनट`,
    `प्रत्येक प्रश्न के लिए ${test.marksPerQuestion || 2} अंक निर्धारित हैं।`,
    test.negativeMarking 
      ? `गलत उत्तर के लिए ${test.negativeMarks} अंक काटे जाएंगे।` 
      : 'इस परीक्षा में कोई नकारात्मक अंकन नहीं है।',
    'सभी प्रश्न अनिवार्य हैं।',
    'प्रत्येक प्रश्न के चार विकल्प हैं।',
    'उत्तर देने के बाद "Save & Next" पर क्लिक करें।',
    'किसी प्रश्न को बाद में देखने के लिए "Mark for Review" का उपयोग करें।',
    'परीक्षा समाप्त करने के लिए "Submit Test" पर क्लिक करें।'
  ] : [
    `This test contains ${test.totalQuestions} questions.`,
    `Time Limit: ${test.duration} minutes`,
    `Each question carries ${test.marksPerQuestion || 2} marks.`,
    test.negativeMarking 
      ? `${test.negativeMarks} marks will be deducted for each wrong answer.` 
      : 'There is no negative marking in this test.',
    'All questions are compulsory.',
    'Each question has four options.',
    'Click "Save & Next" after answering.',
    'Use "Mark for Review" to revisit a question later.',
    'Click "Submit Test" to finish the exam.'
  ];

  const displayInstructions = instructions.length > 0 ? instructions : defaultInstructions;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20">
              {typeConfig.shortCode || test.testType}
            </span>
            
            {/* Language Toggle */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => onLanguageChange?.('hi')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === 'hi' ? 'bg-white text-primary-700' : 'text-white/80 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => onLanguageChange?.('en')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  language === 'en' ? 'bg-white text-primary-700' : 'text-white/80 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
          <p className="text-white/80">
            {language === 'hi' ? paperLabel.hi : paperLabel.en}
          </p>
        </div>

        {/* Test Info Cards */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{test.totalQuestions}</div>
            <div className="text-sm text-gray-500">
              {language === 'hi' ? 'प्रश्न' : 'Questions'}
            </div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatDuration(test.duration)}</div>
            <div className="text-sm text-gray-500">
              {language === 'hi' ? 'समय' : 'Duration'}
            </div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{test.totalMarks}</div>
            <div className="text-sm text-gray-500">
              {language === 'hi' ? 'कुल अंक' : 'Total Marks'}
            </div>
          </div>
        </div>

        {/* Negative Marking Warning */}
        {test.negativeMarking && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <MinusCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">
                {language === 'hi' ? 'नकारात्मक अंकन' : 'Negative Marking'}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {language === 'hi' 
                  ? `प्रत्येक गलत उत्तर के लिए ${test.negativeMarks} अंक काटे जाएंगे।`
                  : `${test.negativeMarks} marks will be deducted for each wrong answer.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            {language === 'hi' ? 'महत्वपूर्ण निर्देश' : 'Important Instructions'}
          </h2>

          <ul className="space-y-3">
            {displayInstructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Question Palette Legend */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            {language === 'hi' ? 'प्रश्न पैलेट संकेत:' : 'Question Palette Legend:'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(PALETTE_COLORS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded ${value.bg} ${value.text} flex items-center justify-center text-xs font-medium ${
                  key === 'ANSWERED_AND_MARKED' ? 'ring-2 ring-green-500' : ''
                }`}>
                  1
                </div>
                <span className="text-xs text-gray-600">
                  {language === 'hi' ? value.label.hi : value.label.en}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="px-6 pb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              {language === 'hi' 
                ? 'मैंने सभी निर्देश पढ़ लिए हैं और परीक्षा शुरू करने के लिए तैयार हूं। मैं समझता/समझती हूं कि एक बार परीक्षा शुरू होने के बाद टाइमर बंद नहीं होगा।'
                : 'I have read all instructions and am ready to start the test. I understand that once the test starts, the timer cannot be stopped.'
              }
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
          </button>

          <button
            onClick={onStart}
            disabled={!agreed}
            className={`
              inline-flex items-center gap-2 px-8 py-2.5 rounded-lg font-medium transition-all
              ${agreed 
                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {language === 'hi' ? 'परीक्षा शुरू करें' : 'Start Test'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestInstructions;