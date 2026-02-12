// Question Types
export const QUESTION_TYPES = {
  MCQ: 'mcq',
  ASSERTION_REASON: 'assertion_reason',
  MATCH_FOLLOWING: 'match_following',
  SEQUENCE_ORDER: 'sequence_order',
  STATEMENT_BASED: 'statement_based',
  PASSAGE_BASED: 'passage_based',
  DI_TABLE: 'di_table',
  DI_BAR_CHART: 'di_bar_chart',
  DI_PIE_CHART: 'di_pie_chart',
  DI_LINE_GRAPH: 'di_line_graph',
  DI_MIXED: 'di_mixed',
  DI_CASELET: 'di_caselet'
};

// Question Type Labels
export const QUESTION_TYPE_LABELS = {
  mcq: { en: 'Multiple Choice', hi: 'बहुविकल्पीय' },
  assertion_reason: { en: 'Assertion-Reason', hi: 'अभिकथन-कारण' },
  match_following: { en: 'Match Following', hi: 'सुमेलित कीजिए' },
  sequence_order: { en: 'Sequence/Order', hi: 'क्रम/अनुक्रम' },
  statement_based: { en: 'Statement Based', hi: 'कथन आधारित' },
  passage_based: { en: 'Passage Based', hi: 'गद्यांश आधारित' },
  di_table: { en: 'DI - Table', hi: 'DI - तालिका' },
  di_bar_chart: { en: 'DI - Bar Chart', hi: 'DI - बार चार्ट' },
  di_pie_chart: { en: 'DI - Pie Chart', hi: 'DI - पाई चार्ट' },
  di_line_graph: { en: 'DI - Line Graph', hi: 'DI - लाइन ग्राफ' },
  di_mixed: { en: 'DI - Mixed', hi: 'DI - मिश्रित' },
  di_caselet: { en: 'DI - Caselet', hi: 'DI - केसलेट' }
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const DIFFICULTY_LABELS = {
  easy: { en: 'Easy', hi: 'आसान', color: 'green' },
  medium: { en: 'Medium', hi: 'मध्यम', color: 'yellow' },
  hard: { en: 'Hard', hi: 'कठिन', color: 'red' }
};

// Papers
export const PAPERS = {
  PAPER1: 'paper1',
  PAPER2: 'paper2'
};

export const PAPER_LABELS = {
  paper1: { en: 'Paper 1 - General', hi: 'पेपर 1 - सामान्य' },
  paper2: { en: 'Paper 2 - History', hi: 'पेपर 2 - इतिहास' }
};

// Paper Short Codes for Title Generation
export const PAPER_SHORT_CODES = {
  paper1: 'P1',
  paper2: 'P2',
  combined: 'P1+P2'
};

// Test Types
export const TEST_TYPES = {
  DPP: 'dpp',
  TOPIC_TEST: 'topic_test',
  CHAPTER_TEST: 'chapter_test',
  UNIT_TEST: 'unit_test',
  PYQ_YEAR: 'pyq_year',
  PRACTICE: 'practice',
  FULL_MOCK_P1: 'full_mock_p1',
  FULL_MOCK_P2: 'full_mock_p2',
  FULL_MOCK_COMBINED: 'full_mock_combined'
};

export const TEST_TYPE_CONFIG = {
  dpp: {
    name: 'Daily Practice Paper',
    nameHi: 'दैनिक अभ्यास',
    shortCode: 'DPP',
    defaultQuestions: 10,
    defaultDuration: 15,
    color: 'blue',
    // Title Pattern: {paper} | {mostSpecific} - DPP #{number}
    titlePattern: '{paper} | {content} - DPP #{number}',
    priority: ['topic', 'chapter', 'unit', 'paper'] // Order of content selection
  },
  topic_test: {
    name: 'Topic Test',
    nameHi: 'विषय परीक्षण',
    shortCode: 'TT',
    defaultQuestions: 15,
    defaultDuration: 20,
    color: 'green',
    titlePattern: '{paper} | {unit} | {topic} - TT #{number}',
    priority: ['topic', 'chapter']
  },
  chapter_test: {
    name: 'Chapter Test',
    nameHi: 'अध्याय परीक्षण',
    shortCode: 'CT',
    defaultQuestions: 25,
    defaultDuration: 30,
    color: 'purple',
    titlePattern: '{paper} | {chapter} - CT #{number}',
    priority: ['chapter', 'unit']
  },
  unit_test: {
    name: 'Unit Test',
    nameHi: 'इकाई परीक्षण',
    shortCode: 'UT',
    defaultQuestions: 30,
    defaultDuration: 40,
    color: 'orange',
    titlePattern: '{paper} | {unit} - UT #{number}',
    priority: ['unit']
  },
  pyq_year: {
    name: 'Previous Year Questions',
    nameHi: 'पिछले वर्ष के प्रश्न',
    shortCode: 'PYQ',
    defaultQuestions: 50,
    defaultDuration: 60,
    color: 'red',
    titlePattern: 'PYQ {year} - {paper} #{number}'
  },
  practice: {
    name: 'Practice Test',
    nameHi: 'अभ्यास परीक्षण',
    shortCode: 'PT',
    defaultQuestions: 20,
    defaultDuration: 25,
    color: 'teal',
    titlePattern: '{paper} | {content} - Practice #{number}',
    priority: ['topic', 'chapter', 'unit', 'paper']
  },
  full_mock_p1: {
    name: 'Full Mock - Paper 1',
    nameHi: 'फुल मॉक - पेपर 1',
    shortCode: 'FM-P1',
    defaultQuestions: 50,
    defaultDuration: 60,
    color: 'indigo',
    titlePattern: 'Full Mock Paper 1 - #{number}'
  },
  full_mock_p2: {
    name: 'Full Mock - Paper 2',
    nameHi: 'फुल मॉक - पेपर 2',
    shortCode: 'FM-P2',
    defaultQuestions: 100,
    defaultDuration: 120,
    color: 'pink',
    titlePattern: 'Full Mock Paper 2 - #{number}'
  },
  full_mock_combined: {
    name: 'Full Mock - Combined',
    nameHi: 'फुल मॉक - संयुक्त',
    shortCode: 'FM-C',
    defaultQuestions: 150,
    defaultDuration: 180,
    color: 'gray',
    titlePattern: 'Full Mock Combined (P1 + P2) - #{number}'
  }
};

// Languages
export const LANGUAGES = {
  HINDI: 'hi',
  ENGLISH: 'en'
};

export const LANGUAGE_LABELS = {
  hi: 'हिंदी',
  en: 'English'
};

// Question Palette Colors (NTA Pattern)
export const PALETTE_COLORS = {
  NOT_VISITED: {
    bg: 'bg-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-600',
    label: { en: 'Not Visited', hi: 'देखा नहीं गया' }
  },
  NOT_ANSWERED: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-white',
    label: { en: 'Not Answered', hi: 'उत्तर नहीं दिया' }
  },
  ANSWERED: {
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-white',
    label: { en: 'Answered', hi: 'उत्तर दिया गया' }
  },
  MARKED_FOR_REVIEW: {
    bg: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-white',
    label: { en: 'Marked for Review', hi: 'समीक्षा के लिए चिह्नित' }
  },
  ANSWERED_AND_MARKED: {
    bg: 'bg-purple-500',
    border: 'border-green-500 border-4',
    text: 'text-white',
    label: { en: 'Answered & Marked', hi: 'उत्तर और चिह्नित' }
  }
};

// Chart Colors for DI
export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6'  // Teal
];

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  LIMITS: [10, 20, 50, 100]
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  DISPLAY_WITH_TIME: 'DD MMM YYYY, hh:mm A',
  INPUT: 'YYYY-MM-DD',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// Option Labels
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const ROMAN_NUMERALS = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)'];

// Assertion-Reason Default Options
export const AR_OPTIONS_HI = [
  'अभिकथन (A) और कारण (R) दोनों सही हैं और (R), (A) की सही व्याख्या है',
  'अभिकथन (A) और कारण (R) दोनों सही हैं, परंतु (R), (A) की सही व्याख्या नहीं है',
  'अभिकथन (A) सही है, परंतु कारण (R) गलत है',
  'अभिकथन (A) गलत है, परंतु कारण (R) सही है'
];

export const AR_OPTIONS_EN = [
  'Both Assertion (A) and Reason (R) are true, and (R) is the correct explanation of (A)',
  'Both Assertion (A) and Reason (R) are true, but (R) is NOT the correct explanation of (A)',
  'Assertion (A) is true, but Reason (R) is false',
  'Assertion (A) is false, but Reason (R) is true'
];

// Sidebar Menu Items
export const SIDEBAR_MENU = [
  {
    id: 'dashboard',
    label: { en: 'Dashboard', hi: 'डैशबोर्ड' },
    icon: 'LayoutDashboard',
    path: '/'
  },
  {
    id: 'questions',
    label: { en: 'Question Bank', hi: 'प्रश्न बैंक' },
    icon: 'FileQuestion',
    path: '/questions'
  },
  {
    id: 'import',
    label: { en: 'Import Questions', hi: 'प्रश्न आयात' },
    icon: 'Upload',
    path: '/import'
  },
  {
    id: 'tests',
    label: { en: 'Tests', hi: 'परीक्षाएं' },
    icon: 'ClipboardList',
    path: '/tests'
  },
  {
    id: 'create-test',
    label: { en: 'Create Test', hi: 'परीक्षा बनाएं' },
    icon: 'PlusCircle',
    path: '/tests/create'
  },
  {
    id: 'results',
    label: { en: 'Results', hi: 'परिणाम' },
    icon: 'BarChart3',
    path: '/results'
  },
  {
    id: 'settings',
    label: { en: 'Settings', hi: 'सेटिंग्स' },
    icon: 'Settings',
    path: '/settings'
  }
];