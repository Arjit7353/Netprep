// JSON Import Templates for different question types

// ============================================================
// MCQ Template
// ============================================================
export const mcqTemplate = {
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

// ============================================================
// Assertion-Reason Template
// ============================================================
export const assertionReasonTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      type: 'assertion_reason',
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

// ============================================================
// Match Following Template
// ============================================================
export const matchFollowingTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      type: 'match_following',
      question: 'सूची-I को सूची-II से सुमेलित कीजिए:',
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

// ============================================================
// Sequence Order Template
// ============================================================
export const sequenceOrderTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      type: 'sequence_order',
      question: 'निम्नलिखित को कालक्रमानुसार व्यवस्थित कीजिए:',
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

// ============================================================
// Statement Based Template
// ============================================================
export const statementBasedTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: '',
  topic: '',
  difficulty: 'medium',
  questions: [
    {
      type: 'statement_based',
      question: 'निम्नलिखित कथनों पर विचार कीजिए:',
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

// ============================================================
// ✅ PASSAGE BASED Template - FIXED FORMAT
// ============================================================
export const passageBasedTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT III',
  chapter: 'Comprehension',
  topic: 'Reading Comprehension',
  difficulty: 'medium',
  questions: [
    {
      passage: 'गद्यांश की सामग्री यहाँ लिखें। यह एक लंबा पैराग्राफ होना चाहिए जिस पर आधारित प्रश्न पूछे जाएंगे। शिक्षा किसी भी समाज की आधारशिला है। यह भावी पीढ़ियों के मस्तिष्क को आकार देती है और राष्ट्रों की दिशा निर्धारित करती है। प्राचीन भारत में गुरुकुल प्रणाली समग्र विकास पर जोर देती थी।',
      title: 'गद्यांश का शीर्षक',
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
          correct: 1,
          explanation: 'व्याख्या'
        },
        {
          question: 'गद्यांश के आधार पर प्रश्न 3?',
          options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
          correct: 2,
          explanation: 'व्याख्या'
        }
      ]
    }
  ]
};

// ============================================================
// ✅ PASSAGE BASED Template - English
// ============================================================
export const passageBasedEnglishTemplate = {
  language: 'en',
  paper: 'paper1',
  unit: 'UNIT III',
  chapter: 'Comprehension',
  topic: 'Reading Comprehension',
  difficulty: 'medium',
  questions: [
    {
      passage: "Digital literacy has been considered a pillar of 'inclusive development' because it enables people from all sections of society to access information, services, and opportunities that were previously limited to a privileged few. In the modern era, digital skills are not just about using computers or smartphones; they encompass the ability to critically evaluate information, protect one's privacy online, and participate meaningfully in the digital economy. Governments worldwide are investing heavily in digital literacy programs, recognizing that empowering citizens with these skills is essential for bridging the digital divide.",
      title: 'Digital Literacy and Inclusive Development',
      questions: [
        {
          question: "Why has digital literacy been considered a pillar of 'inclusive development'?",
          options: [
            'Because it has the ability to empower the last person of the society',
            'Because it is useful only for rich people',
            'Because it increases the means of entertainment',
            'Because it attracts foreign investment'
          ],
          correct: 0,
          explanation: 'Digital literacy empowers everyone including marginalized sections of society.'
        },
        {
          question: 'According to the passage, digital skills include:',
          options: [
            'Only using computers',
            'Only using smartphones',
            'Critically evaluating information and protecting privacy',
            'Playing video games'
          ],
          correct: 2,
          explanation: 'The passage mentions that digital skills encompass critical evaluation of information and privacy protection.'
        },
        {
          question: 'What are governments doing regarding digital literacy?',
          options: [
            'Ignoring it completely',
            'Investing heavily in digital literacy programs',
            'Banning digital devices',
            'Promoting only traditional education'
          ],
          correct: 1,
          explanation: 'The passage states that governments worldwide are investing heavily in digital literacy programs.'
        }
      ]
    }
  ]
};

// ============================================================
// ✅ DI TABLE Template - FIXED FORMAT
// ============================================================
export const diTableTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Table Chart',
  difficulty: 'medium',
  questions: [
    {
      type: 'di_table',
      diData: {
        title: 'पांच कंपनियों का वार्षिक उत्पादन (हजार इकाइयों में)',
        instruction: 'निम्नलिखित तालिका का अध्ययन करें और प्रश्नों के उत्तर दें:',
        tableData: {
          headers: ['कंपनी', '2019', '2020', '2021', '2022', '2023'],
          rows: [
            ['A', 120, 135, 145, 160, 175],
            ['B', 95, 110, 125, 140, 155],
            ['C', 80, 85, 95, 105, 120],
            ['D', 110, 125, 135, 150, 165],
            ['E', 100, 115, 130, 145, 160]
          ]
        },
        questions: [
          {
            question: '2023 में सभी कंपनियों का कुल उत्पादन कितना था?',
            options: ['750', '775', '800', '825'],
            correct: 1,
            explanation: '175 + 155 + 120 + 165 + 160 = 775 हजार इकाइयां'
          },
          {
            question: 'पांच वर्षों में किस कंपनी का औसत उत्पादन सबसे अधिक है?',
            options: ['A', 'B', 'D', 'E'],
            correct: 0,
            explanation: 'कंपनी A का औसत = (120+135+145+160+175)/5 = 147 जो सबसे अधिक है।'
          },
          {
            question: '2020 से 2023 के बीच कंपनी C की उत्पादन वृद्धि का प्रतिशत क्या है?',
            options: ['35.2%', '40.1%', '41.2%', '45.5%'],
            correct: 2,
            explanation: 'वृद्धि = (120-85)/85 × 100 = 41.2%'
          }
        ]
      }
    }
  ]
};

// ============================================================
// ✅ DI BAR CHART Template - FIXED FORMAT
// ============================================================
export const diBarChartTemplate = {
  language: 'en',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Bar Chart',
  difficulty: 'medium',
  questions: [
    {
      type: 'di_bar_chart',
      diData: {
        title: 'Sales of Two Products Over Six Months (in thousands)',
        instruction: 'Study the following bar chart data and answer the questions:',
        chartData: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Product A',
              data: [45, 52, 48, 60, 55, 70],
              color: '#3B82F6'
            },
            {
              label: 'Product B',
              data: [38, 42, 50, 48, 52, 58],
              color: '#EF4444'
            }
          ],
          xAxisLabel: 'Months',
          yAxisLabel: 'Sales (in thousands)'
        },
        questions: [
          {
            question: 'What is the total sales of Product A in the first quarter (Jan-Mar)?',
            options: ['135', '140', '145', '150'],
            correct: 2,
            explanation: 'Jan + Feb + Mar = 45 + 52 + 48 = 145'
          },
          {
            question: 'In which month was the difference between Product A and B maximum?',
            options: ['January', 'April', 'May', 'June'],
            correct: 3,
            explanation: 'June difference = 70 - 58 = 12, which is maximum'
          },
          {
            question: 'What was the average monthly sales of Product B?',
            options: ['46', '48', '50', '52'],
            correct: 1,
            explanation: 'Average = (38+42+50+48+52+58)/6 = 288/6 = 48'
          }
        ]
      }
    }
  ]
};

// ============================================================
// ✅ DI PIE CHART Template - FIXED FORMAT
// ============================================================
export const diPieChartTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Pie Chart',
  difficulty: 'medium',
  questions: [
    {
      type: 'di_pie_chart',
      diData: {
        title: 'कुल बजट का विभागवार वितरण (कुल = 5 करोड़ रुपये)',
        instruction: 'पाई चार्ट डेटा का अध्ययन कर प्रश्नों के उत्तर दें:',
        chartData: {
          labels: ['शिक्षा', 'स्वास्थ्य', 'रक्षा', 'कृषि', 'अन्य'],
          datasets: [
            {
              label: 'बजट वितरण',
              data: [25, 20, 30, 15, 10],
              colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
            }
          ]
        },
        questions: [
          {
            question: 'शिक्षा विभाग को कितनी राशि आवंटित की गई?',
            options: ['1.00 करोड़', '1.25 करोड़', '1.50 करोड़', '1.75 करोड़'],
            correct: 1,
            explanation: 'शिक्षा = 25% of 5 करोड़ = 1.25 करोड़'
          },
          {
            question: 'रक्षा और स्वास्थ्य को मिलाकर कुल कितना प्रतिशत आवंटित है?',
            options: ['45%', '50%', '55%', '60%'],
            correct: 1,
            explanation: 'रक्षा (30%) + स्वास्थ्य (20%) = 50%'
          },
          {
            question: 'कृषि विभाग को रक्षा विभाग से कितने प्रतिशत कम बजट मिला?',
            options: ['10%', '15%', '20%', '25%'],
            correct: 1,
            explanation: 'रक्षा (30%) - कृषि (15%) = 15% कम'
          }
        ]
      }
    }
  ]
};

// ============================================================
// ✅ DI LINE GRAPH Template - FIXED FORMAT
// ============================================================
export const diLineGraphTemplate = {
  language: 'en',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Line Graph',
  difficulty: 'medium',
  questions: [
    {
      type: 'di_line_graph',
      diData: {
        title: 'Temperature Variation in Two Cities Over a Week',
        instruction: 'Study the line graph data and answer the questions:',
        chartData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'City A (°C)',
              data: [28, 30, 32, 31, 29, 27, 28],
              color: '#FF6384'
            },
            {
              label: 'City B (°C)',
              data: [25, 26, 28, 30, 29, 28, 26],
              color: '#36A2EB'
            }
          ],
          xAxisLabel: 'Days of Week',
          yAxisLabel: 'Temperature (°C)'
        },
        questions: [
          {
            question: 'On which day was the temperature difference between the two cities maximum?',
            options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
            correct: 2,
            explanation: 'Wednesday: City A (32°C) - City B (28°C) = 4°C, which is maximum'
          },
          {
            question: 'What was the average temperature of City B during the week?',
            options: ['26.5°C', '27°C', '27.4°C', '28°C'],
            correct: 2,
            explanation: 'Average = (25+26+28+30+29+28+26)/7 = 192/7 = 27.4°C'
          },
          {
            question: 'On how many days was City A temperature above 30°C?',
            options: ['1', '2', '3', '4'],
            correct: 1,
            explanation: 'City A above 30°C: Wednesday (32°C) and Thursday (31°C) = 2 days'
          }
        ]
      }
    }
  ]
};

// ============================================================
// ✅ DI CASELET Template - FIXED FORMAT
// ============================================================
export const diCaseletTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT VII',
  chapter: 'Data Interpretation',
  topic: 'Caselet',
  difficulty: 'medium',
  questions: [
    {
      type: 'di_caselet',
      diData: {
        title: 'कंपनी की वित्तीय स्थिति - 2022',
        instruction: 'निम्नलिखित डेटा का ध्यानपूर्वक अध्ययन करें:',
        caseletText: 'एक कंपनी का कुल राजस्व 2022 में 50 करोड़ रुपये था। इसमें से 40% उत्पाद A से, 35% उत्पाद B से और शेष उत्पाद C से आया। कंपनी का कुल व्यय 35 करोड़ रुपये था, जिसमें उत्पादन लागत 60%, विपणन लागत 25% और प्रशासनिक लागत शेष थी। कंपनी ने 2023 में राजस्व में 20% की वृद्धि की उम्मीद की है।',
        questions: [
          {
            question: 'उत्पाद C से 2022 में कितना राजस्व प्राप्त हुआ?',
            options: ['10 करोड़', '12.5 करोड़', '15 करोड़', '17.5 करोड़'],
            correct: 1,
            explanation: 'उत्पाद C = 100% - 40% - 35% = 25%, 25% of 50 करोड़ = 12.5 करोड़'
          },
          {
            question: '2022 में कंपनी का शुद्ध लाभ कितना था?',
            options: ['10 करोड़', '12 करोड़', '15 करोड़', '18 करोड़'],
            correct: 2,
            explanation: 'शुद्ध लाभ = राजस्व - व्यय = 50 - 35 = 15 करोड़'
          },
          {
            question: 'उत्पादन लागत की राशि क्या थी?',
            options: ['18 करोड़', '19 करोड़', '21 करोड़', '23 करोड़'],
            correct: 2,
            explanation: 'उत्पादन लागत = 60% of 35 करोड़ = 21 करोड़'
          },
          {
            question: '2023 में अपेक्षित राजस्व क्या होगा?',
            options: ['55 करोड़', '58 करोड़', '60 करोड़', '65 करोड़'],
            correct: 2,
            explanation: '2023 राजस्व = 50 करोड़ + 20% = 50 × 1.20 = 60 करोड़'
          }
        ]
      }
    }
  ]
};

// ============================================================
// ✅ SMART MIXED Template - Multiple types in one import
// ============================================================
export const smartMixedTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: 'Teaching Aptitude',
  difficulty: 'medium',
  source: 'Self-Made',
  questions: [
    {
      type: 'mcq',
      question: 'ब्लूम की वर्गिकी में कितने संज्ञानात्मक स्तर हैं?',
      options: ['4', '5', '6', '7'],
      correct: 2,
      explanation: 'ब्लूम की वर्गिकी में 6 संज्ञानात्मक स्तर हैं।'
    },
    {
      type: 'assertion_reason',
      assertion: 'शिक्षण एक कला है।',
      reason: 'शिक्षण में रचनात्मकता की आवश्यकता होती है।',
      correct: 0,
      explanation: 'शिक्षण को कला इसलिए कहा जाता है क्योंकि इसमें रचनात्मकता आवश्यक है।'
    },
    {
      type: 'statement_based',
      question: 'निम्नलिखित कथनों पर विचार कीजिए:',
      statements: [
        'शिक्षण का उद्देश्य ज्ञान का हस्तांतरण है',
        'शिक्षण में व्यवहार परिवर्तन होता है'
      ],
      correctStatements: [0, 1],
      options: ['केवल 1', 'केवल 2', '1 और 2 दोनों', 'न तो 1 न 2'],
      correct: 2,
      explanation: 'दोनों कथन सही हैं।'
    },
    {
      passage: 'शिक्षा का मूल उद्देश्य व्यक्ति का सर्वांगीण विकास करना है। यह न केवल ज्ञान प्रदान करती है बल्कि चरित्र निर्माण में भी सहायक होती है।',
      title: 'शिक्षा का उद्देश्य',
      questions: [
        {
          question: 'गद्यांश के अनुसार शिक्षा का मूल उद्देश्य क्या है?',
          options: ['धन कमाना', 'सर्वांगीण विकास', 'नौकरी पाना', 'परीक्षा पास करना'],
          correct: 1,
          explanation: 'गद्यांश में स्पष्ट है कि शिक्षा का मूल उद्देश्य सर्वांगीण विकास है।'
        }
      ]
    }
  ]
};

// ============================================================
// ✅ BULK MCQ Template - For importing many MCQs
// ============================================================
export const bulkMcqTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: 'Teaching Aptitude',
  topic: 'Levels of Teaching',
  difficulty: 'medium',
  source: 'Self-Made',
  questions: [
    {
      question: 'शिक्षण के स्मृति स्तर का प्रतिपादन किसने किया?',
      options: ['हरबर्ट', 'मॉरिसन', 'हंट', 'ब्लूम'],
      correct: 0,
      explanation: 'हरबर्ट ने शिक्षण के स्मृति स्तर का प्रतिपादन किया।'
    },
    {
      question: 'शिक्षण का बोध स्तर किससे संबंधित है?',
      options: ['याद करना', 'समझना', 'विश्लेषण', 'मूल्यांकन'],
      correct: 1,
      explanation: 'बोध स्तर समझने से संबंधित है।'
    },
    {
      question: 'चिंतन स्तर शिक्षण का प्रतिपादक कौन है?',
      options: ['हरबर्ट', 'मॉरिसन', 'हंट', 'स्किनर'],
      correct: 2,
      explanation: 'हंट ने चिंतन स्तर शिक्षण का प्रतिपादन किया।'
    },
    {
      question: 'प्रश्न 4 यहाँ लिखें?',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correct: 0,
      explanation: 'व्याख्या...'
    },
    {
      question: 'प्रश्न 5 यहाँ लिखें?',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correct: 0,
      explanation: 'व्याख्या...'
    }
  ]
};

// ============================================================
// ✅ PYQ Template - Previous Year Questions
// ============================================================
export const pyqTemplate = {
  language: 'hi',
  paper: 'paper1',
  unit: 'UNIT I',
  chapter: 'Teaching Aptitude',
  year: '2023',
  source: 'UGC NET December 2023',
  questions: [
    {
      question: 'शिक्षण के स्मृति स्तर पर छात्र का कार्य क्या है?',
      options: [
        'तथ्यों को याद करना',
        'समस्या समाधान करना',
        'आलोचनात्मक विश्लेषण',
        'रचनात्मक लेखन'
      ],
      correct: 0,
      explanation: 'स्मृति स्तर पर छात्र का मुख्य कार्य तथ्यों को याद करना होता है।',
      isPYQ: true,
      pyqSession: 'december',
      pyqShift: 'shift1',
      pyqQuestionNumber: 1
    },
    {
      question: 'PYQ प्रश्न 2 यहाँ लिखें?',
      options: ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
      correct: 0,
      explanation: 'व्याख्या...',
      isPYQ: true,
      pyqSession: 'december',
      pyqShift: 'shift1',
      pyqQuestionNumber: 2
    }
  ]
};

// ============================================================
// Export All Templates
// ============================================================
export const ALL_TEMPLATES = {
  mcq: {
    name: 'MCQ',
    nameHi: 'बहुविकल्पीय प्रश्न',
    description: 'Standard multiple choice questions',
    template: mcqTemplate
  },
  bulk_mcq: {
    name: 'Bulk MCQ',
    nameHi: 'बल्क MCQ',
    description: 'Import multiple MCQs at once',
    template: bulkMcqTemplate
  },
  assertion_reason: {
    name: 'Assertion-Reason',
    nameHi: 'अभिकथन-कारण',
    description: 'Assertion and Reason type questions',
    template: assertionReasonTemplate
  },
  match_following: {
    name: 'Match Following',
    nameHi: 'सुमेलित कीजिए',
    description: 'Match List-I with List-II',
    template: matchFollowingTemplate
  },
  sequence_order: {
    name: 'Sequence Order',
    nameHi: 'क्रम व्यवस्था',
    description: 'Chronological order questions',
    template: sequenceOrderTemplate
  },
  statement_based: {
    name: 'Statement Based',
    nameHi: 'कथन आधारित',
    description: 'Which statements are correct type',
    template: statementBasedTemplate
  },
  passage_based: {
    name: 'Passage Based (Hindi)',
    nameHi: 'गद्यांश आधारित (हिंदी)',
    description: 'Hindi reading comprehension with multiple questions',
    template: passageBasedTemplate
  },
  passage_based_english: {
    name: 'Passage Based (English)',
    nameHi: 'गद्यांश आधारित (अंग्रेजी)',
    description: 'English reading comprehension with multiple questions',
    template: passageBasedEnglishTemplate
  },
  di_table: {
    name: 'DI - Table Chart',
    nameHi: 'DI - तालिका',
    description: 'Data Interpretation with table',
    template: diTableTemplate
  },
  di_bar_chart: {
    name: 'DI - Bar Chart',
    nameHi: 'DI - बार चार्ट',
    description: 'Data Interpretation with bar chart',
    template: diBarChartTemplate
  },
  di_pie_chart: {
    name: 'DI - Pie Chart',
    nameHi: 'DI - पाई चार्ट',
    description: 'Data Interpretation with pie chart',
    template: diPieChartTemplate
  },
  di_line_graph: {
    name: 'DI - Line Graph',
    nameHi: 'DI - लाइन ग्राफ',
    description: 'Data Interpretation with line graph',
    template: diLineGraphTemplate
  },
  di_caselet: {
    name: 'DI - Caselet',
    nameHi: 'DI - केसलेट',
    description: 'Text-based Data Interpretation',
    template: diCaseletTemplate
  },
  smart_mixed: {
    name: 'Smart Mixed',
    nameHi: 'स्मार्ट मिश्रित',
    description: 'Multiple question types in one import',
    template: smartMixedTemplate
  },
  pyq: {
    name: 'Previous Year Questions',
    nameHi: 'पिछले वर्ष के प्रश्न',
    description: 'Import PYQ with year and session info',
    template: pyqTemplate
  }
};

export default ALL_TEMPLATES;