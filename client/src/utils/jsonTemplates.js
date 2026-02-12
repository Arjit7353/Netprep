// JSON Import Templates for different question types

export const mcqTemplate = {
  importType: 'mcq',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  source: '',
  questions: [
    {
      question: 'प्रश्न यहाँ लिखें',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correct: 0,
      explanation: 'व्याख्या यहाँ लिखें'
    }
  ]
};

export const assertionReasonTemplate = {
  importType: 'assertion_reason',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      assertion: 'अभिकथन यहाँ लिखें',
      reason: 'कारण यहाँ लिखें',
      options: [
        'अभिकथन (A) और कारण (R) दोनों सही हैं और (R), (A) की सही व्याख्या है',
        'अभिकथन (A) और कारण (R) दोनों सही हैं, परंतु (R), (A) की सही व्याख्या नहीं है',
        'अभिकथन (A) सही है, परंतु कारण (R) गलत है',
        'अभिकथन (A) गलत है, परंतु कारण (R) सही है'
      ],
      correct: 0,
      explanation: 'व्याख्या यहाँ लिखें'
    }
  ]
};

export const matchFollowingTemplate = {
  importType: 'match_following',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      instruction: 'सूची-I को सूची-II से सुमेलित कीजिए:',
      listA: ['आइटम A', 'आइटम B', 'आइटम C', 'आइटम D'],
      listB: ['मैच 1', 'मैच 2', 'मैच 3', 'मैच 4'],
      correctMatch: [0, 1, 2, 3],
      options: [
        'A-I, B-II, C-III, D-IV',
        'A-II, B-I, C-IV, D-III',
        'A-III, B-IV, C-I, D-II',
        'A-IV, B-III, C-II, D-I'
      ],
      correct: 0,
      explanation: 'व्याख्या यहाँ लिखें'
    }
  ]
};

export const sequenceOrderTemplate = {
  importType: 'sequence_order',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      instruction: 'निम्नलिखित को कालक्रमानुसार व्यवस्थित कीजिए:',
      items: ['घटना 1', 'घटना 2', 'घटना 3', 'घटना 4'],
      correctOrder: [0, 1, 2, 3],
      options: [
        'I, II, III, IV',
        'II, I, IV, III',
        'III, IV, I, II',
        'IV, III, II, I'
      ],
      correct: 0,
      explanation: 'व्याख्या यहाँ लिखें'
    }
  ]
};

export const statementBasedTemplate = {
  importType: 'statement_based',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      instruction: 'निम्नलिखित कथनों पर विचार कीजिए:',
      statements: [
        'कथन 1',
        'कथन 2',
        'कथन 3'
      ],
      correctStatements: [0, 1],
      options: [
        'केवल 1 और 2',
        'केवल 2 और 3',
        'केवल 1 और 3',
        '1, 2 और 3'
      ],
      correct: 0,
      explanation: 'व्याख्या यहाँ लिखें'
    }
  ]
};

export const passageBasedTemplate = {
  importType: 'passage_based',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT III',
  chapter: 'Comprehension',
  topic: '',
  passage: {
    title: 'गद्यांश का शीर्षक',
    content: 'गद्यांश की सामग्री यहाँ लिखें। यह एक लंबा पैराग्राफ होना चाहिए जिस पर आधारित प्रश्न पूछे जाएंगे।'
  },
  questions: [
    {
      question: 'गद्यांश के आधार पर प्रश्न 1?',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correct: 0,
      explanation: 'व्याख्या'
    },
    {
      question: 'गद्यांश के आधार पर प्रश्न 2?',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correct: 0,
      explanation: 'व्याख्या'
    }
  ]
};

export const diTableTemplate = {
  importType: 'di_table',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Table Chart',
  diData: {
    title: 'तालिका का शीर्षक',
    instruction: 'निम्नलिखित तालिका का अध्ययन करें और प्रश्नों के उत्तर दें:',
    tableData: {
      headers: ['कॉलम 1', 'कॉलम 2', 'कॉलम 3', 'कॉलम 4'],
      rows: [
        ['Row 1', 100, 200, 300],
        ['Row 2', 150, 250, 350],
        ['Row 3', 200, 300, 400]
      ]
    },
    questions: [
      {
        question: 'तालिका के आधार पर प्रश्न 1?',
        options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
        correct: 0,
        explanation: 'व्याख्या'
      }
    ]
  }
};

export const diBarChartTemplate = {
  importType: 'di_bar_chart',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Bar Chart',
  diData: {
    title: 'बार चार्ट का शीर्षक',
    instruction: 'निम्नलिखित बार चार्ट का अध्ययन करें और प्रश्नों के उत्तर दें:',
    chartData: {
      labels: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून'],
      datasets: [
        {
          label: 'सीरीज 1',
          data: [65, 59, 80, 81, 56, 55],
          color: '#3B82F6'
        },
        {
          label: 'सीरीज 2',
          data: [28, 48, 40, 19, 86, 27],
          color: '#EF4444'
        }
      ],
      xAxisLabel: 'महीने',
      yAxisLabel: 'मान'
    },
    questions: [
      {
        question: 'चार्ट के आधार पर प्रश्न 1?',
        options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
        correct: 0,
        explanation: 'व्याख्या'
      }
    ]
  }
};

export const diPieChartTemplate = {
  importType: 'di_pie_chart',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Pie Chart',
  diData: {
    title: 'पाई चार्ट का शीर्षक (कुल = 100%)',
    instruction: 'पाई चार्ट का अध्ययन कर प्रश्नों के उत्तर दें:',
    chartData: {
      labels: ['श्रेणी A', 'श्रेणी B', 'श्रेणी C', 'श्रेणी D', 'अन्य'],
      datasets: [
        {
          label: 'वितरण',
          data: [30, 25, 20, 15, 10],
          colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
        }
      ]
    },
    questions: [
      {
        question: 'चार्ट के आधार पर प्रश्न 1?',
        options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
        correct: 0,
        explanation: 'व्याख्या'
      }
    ]
  }
};

export const diCaseletTemplate = {
  importType: 'di_caselet',
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Caselet',
  diData: {
    title: 'केसलेट का शीर्षक',
    caseletText: 'यहाँ डेटा का विवरण लिखें। उदाहरण: एक कंपनी का कुल राजस्व 50 करोड़ रुपये था। इसमें से 40% उत्पाद A से, 35% उत्पाद B से और शेष उत्पाद C से आया। कंपनी का कुल व्यय 35 करोड़ रुपये था।',
    questions: [
      {
        question: 'केसलेट के आधार पर प्रश्न 1?',
        options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
        correct: 0,
        explanation: 'व्याख्या'
      }
    ]
  }
};

export const smartMixedTemplate = {
  importMode: 'smart',
  defaultMeta: {
    language: 'hi',
    paper: 'paper1',
    unit: 'UNIT I',
    chapter: '',
    topic: '',
    difficulty: 'medium',
    source: ''
  },
  questions: [
    {
      type: 'mcq',
      question: 'MCQ प्रश्न',
      options: ['A', 'B', 'C', 'D'],
      correct: 0,
      explanation: 'व्याख्या'
    },
    {
      type: 'assertion_reason',
      assertion: 'अभिकथन',
      reason: 'कारण',
      correct: 0,
      explanation: 'व्याख्या'
    }
  ]
};

// Export all templates
export const ALL_TEMPLATES = {
  mcq: { name: 'MCQ', nameHi: 'बहुविकल्पीय', template: mcqTemplate },
  assertion_reason: { name: 'Assertion-Reason', nameHi: 'अभिकथन-कारण', template: assertionReasonTemplate },
  match_following: { name: 'Match Following', nameHi: 'सुमेलित कीजिए', template: matchFollowingTemplate },
  sequence_order: { name: 'Sequence Order', nameHi: 'क्रम/अनुक्रम', template: sequenceOrderTemplate },
  statement_based: { name: 'Statement Based', nameHi: 'कथन आधारित', template: statementBasedTemplate },
  passage_based: { name: 'Passage Based', nameHi: 'गद्यांश आधारित', template: passageBasedTemplate },
  di_table: { name: 'DI - Table', nameHi: 'DI - तालिका', template: diTableTemplate },
  di_bar_chart: { name: 'DI - Bar Chart', nameHi: 'DI - बार चार्ट', template: diBarChartTemplate },
  di_pie_chart: { name: 'DI - Pie Chart', nameHi: 'DI - पाई चार्ट', template: diPieChartTemplate },
  di_caselet: { name: 'DI - Caselet', nameHi: 'DI - केसलेट', template: diCaseletTemplate },
  smart_mixed: { name: 'Smart Mixed', nameHi: 'स्मार्ट मिश्रित', template: smartMixedTemplate }
};

export default ALL_TEMPLATES;