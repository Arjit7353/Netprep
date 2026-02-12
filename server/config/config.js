require('dotenv').config();

const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // Database
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/netprep',

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Microsoft Azure Translator (optional - will fallback to Google if not configured)
  translator: {
    key: process.env.MICROSOFT_TRANSLATOR_KEY || '',
    region: process.env.MICROSOFT_TRANSLATOR_REGION || 'centralindia',
    endpoint: process.env.MICROSOFT_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com'
  },

  // Cloudinary (optional)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },

  // Question Types
  questionTypes: [
    'mcq',
    'assertion_reason',
    'match_following',
    'sequence_order',
    'statement_based',
    'passage_based',
    'di_table',
    'di_bar_chart',
    'di_pie_chart',
    'di_line_graph',
    'di_mixed',
    'di_caselet'
  ],

  // Papers
  papers: ['paper1', 'paper2'],

  // Difficulty levels
  difficultyLevels: ['easy', 'medium', 'hard'],

  // Test Types with configurations
  testTypes: {
    dpp: {
      name: 'Daily Practice Paper',
      nameHi: 'दैनिक अभ्यास पत्र',
      shortCode: 'DPP',
      defaultQuestions: 10,
      defaultDuration: 15,
      titlePattern: '{topic} - DPP {number}'
    },
    topic_test: {
      name: 'Topic Test',
      nameHi: 'विषय परीक्षण',
      shortCode: 'TT',
      defaultQuestions: 15,
      defaultDuration: 20,
      titlePattern: '{topic} - Topic Test {number}'
    },
    chapter_test: {
      name: 'Chapter Test',
      nameHi: 'अध्याय परीक्षण',
      shortCode: 'CT',
      defaultQuestions: 25,
      defaultDuration: 30,
      titlePattern: '{chapter} - Chapter Test {number}'
    },
    unit_test: {
      name: 'Unit Test',
      nameHi: 'इकाई परीक्षण',
      shortCode: 'UT',
      defaultQuestions: 30,
      defaultDuration: 40,
      titlePattern: '{unit} - Unit Test {number}'
    },
    pyq_year: {
      name: 'Previous Year Questions',
      nameHi: 'पिछले वर्ष के प्रश्न',
      shortCode: 'PYQ',
      defaultQuestions: 50,
      defaultDuration: 60,
      titlePattern: 'PYQ {year} - {session}'
    },
    practice: {
      name: 'Practice Test',
      nameHi: 'अभ्यास परीक्षण',
      shortCode: 'PT',
      defaultQuestions: 20,
      defaultDuration: 25,
      titlePattern: 'Practice Test {number}'
    },
    full_mock_p1: {
      name: 'Full Mock - Paper 1',
      nameHi: 'पूर्ण मॉक - पेपर 1',
      shortCode: 'FM-P1',
      defaultQuestions: 50,
      defaultDuration: 60,
      titlePattern: 'Full Mock Paper 1 - {number}',
      randomGeneration: {
        enabled: true,
        questionsPerUnit: 5
      }
    },
    full_mock_p2: {
      name: 'Full Mock - Paper 2',
      nameHi: 'पूर्ण मॉक - पेपर 2',
      shortCode: 'FM-P2',
      defaultQuestions: 100,
      defaultDuration: 120,
      titlePattern: 'Full Mock Paper 2 - {number}',
      randomGeneration: {
        enabled: true,
        questionsPerUnit: 10
      }
    },
    full_mock_combined: {
      name: 'Full Mock - Combined',
      nameHi: 'पूर्ण मॉक - संयुक्त',
      shortCode: 'FM-C',
      defaultQuestions: 150,
      defaultDuration: 180,
      titlePattern: 'Full Mock Combined - {number}'
    }
  },

  // Default instructions
  defaultInstructions: {
    en: [
      'Read each question carefully before answering.',
      'All questions carry equal marks.',
      'There is no negative marking unless specified.',
      'You can mark questions for review and come back later.',
      'Make sure to save your answer before moving to next question.',
      'The timer will auto-submit the test when time is up.',
      'Do not refresh the page during the test.'
    ],
    hi: [
      'उत्तर देने से पहले प्रत्येक प्रश्न को ध्यान से पढ़ें।',
      'सभी प्रश्नों के समान अंक हैं।',
      'जब तक निर्दिष्ट न हो, कोई नकारात्मक अंकन नहीं है।',
      'आप प्रश्नों को समीक्षा के लिए चिह्नित कर सकते हैं और बाद में वापस आ सकते हैं।',
      'अगले प्रश्न पर जाने से पहले अपना उत्तर सहेजना सुनिश्चित करें।',
      'समय समाप्त होने पर टाइमर स्वचालित रूप से परीक्षा जमा कर देगा।',
      'परीक्षा के दौरान पेज को रिफ्रेश न करें।'
    ]
  },

  // NTA Exam specific settings
  ntaSettings: {
    marksPerQuestion: 2,
    negativeMarks: 0.5,
    paper1Questions: 50,
    paper1Duration: 60,
    paper2Questions: 100,
    paper2Duration: 120
  }
};

module.exports = config;