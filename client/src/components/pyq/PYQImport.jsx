import React, { useState, useMemo } from 'react';
import {
  Upload, CheckCircle2, AlertCircle, Loader2, Copy, FileText, Eye,
  ChevronDown, ChevronRight, Info, XCircle, Hash, BookOpen,
  Languages, Sparkles, ArrowRight, ArrowLeft, RotateCcw,
  Globe, Zap, List, BarChart3, Star, Target, Clock
} from 'lucide-react';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';
import { useToast } from '../common/Toast';
import { ALL_TEMPLATES } from '../../utils/jsonTemplates';
import { QUESTION_TYPE_LABELS } from '../../utils/constants';

// ═══════════════════════════════════════════════════
// FULL UNIFIED TEMPLATE — Analysis + ALL Question Types
// ═══════════════════════════════════════════════════
const UNIFIED_TEMPLATE = `{
  "year": "2024",
  "session": "december",
  "shift": "none",
  "paper": "paper2",
  "subject": "History",
  "language": "hi",

  "overview": {
    "totalQuestions": 100,
    "totalMarks": 200,
    "marksPerQuestion": 2,
    "negativeMarking": false,
    "questionRange": { "start": 51, "end": 150 }
  },

  "questionTypeBreakdown": [
    { "type": "mcq", "label": "MCQ", "count": 40, "percentage": 40 },
    { "type": "assertion_reason", "label": "Assertion-Reason", "count": 5, "percentage": 5 },
    { "type": "match_following", "label": "Match Following", "count": 10, "percentage": 10 },
    { "type": "sequence_order", "label": "Chronology", "count": 10, "percentage": 10 },
    { "type": "statement_based", "label": "Statement", "count": 25, "percentage": 25 },
    { "type": "passage", "label": "Passage", "count": 10, "percentage": 10 }
  ],

  "unitWeightage": [
    { "unitId": "unit1", "unitName": "UNIT I: Sources", "questionCount": 10, "marks": 20, "percentage": 10, "difficulty": "Easy", "roiScore": 4 },
    { "unitId": "unit2", "unitName": "UNIT II: Mauryan to Gupta", "questionCount": 12, "marks": 24, "percentage": 12, "difficulty": "Medium", "roiScore": 5 }
  ],

  "questions": [

    {
      "_comment": "═══ TYPE 1: MCQ ═══",
      "qNo": 51,
      "type": "mcq",
      "unitId": "unit1",
      "chapter": "Archaeological Sources",
      "topic": "Epigraphy",
      "difficulty": "easy",
      "importance": 3,
      "question": "भारत की सबसे प्राचीन लिपि कौन सी है?",
      "options": ["ब्राह्मी", "खरोष्ठी", "देवनागरी", "तमिल"],
      "correct": 0,
      "explanation": "ब्राह्मी सबसे प्राचीन ज्ञात लिपि है।",
      "keyTerms": ["brahmi", "script"]
    },

    {
      "_comment": "═══ TYPE 2: ASSERTION-REASON ═══",
      "qNo": 52,
      "type": "assertion_reason",
      "unitId": "unit2",
      "chapter": "Mauryan Empire",
      "topic": "Ashoka",
      "difficulty": "medium",
      "importance": 4,
      "assertion": "अशोक ने धम्म को बढ़ावा दिया",
      "reason": "वह सामाजिक व्यवस्था बनाए रखना चाहता था",
      "options": [
        "दोनों सही, R, A की व्याख्या है",
        "दोनों सही, R, A की व्याख्या नहीं",
        "A सही, R गलत",
        "A गलत, R सही"
      ],
      "correct": 0,
      "explanation": "अशोक का धम्म सामाजिक सद्भाव के लिए था।"
    },

    {
      "_comment": "═══ TYPE 3: MATCH FOLLOWING ═══",
      "qNo": 53,
      "type": "match_following",
      "unitId": "unit4",
      "chapter": "Mughal Empire",
      "topic": "Mughal Rulers",
      "difficulty": "medium",
      "importance": 4,
      "question": "सूची-I को सूची-II से मिलाइए:",
      "listA": ["अकबर", "जहांगीर", "शाहजहां", "औरंगजेब"],
      "listB": ["सुलह-ए-कुल", "नूरजहां", "ताजमहल", "आलमगीर"],
      "correctMatch": [0, 1, 2, 3],
      "options": [
        "A-I, B-II, C-III, D-IV",
        "A-II, B-I, C-IV, D-III",
        "A-III, B-IV, C-I, D-II",
        "A-IV, B-III, C-II, D-I"
      ],
      "correct": 0,
      "explanation": "अकबर=सुलह-ए-कुल, जहांगीर=नूरजहां, शाहजहां=ताजमहल, औरंगजेब=आलमगीर"
    },

    {
      "_comment": "═══ TYPE 4: SEQUENCE ORDER ═══",
      "qNo": 54,
      "type": "sequence_order",
      "unitId": "unit7",
      "chapter": "British Expansion",
      "topic": "Wars",
      "difficulty": "medium",
      "importance": 3,
      "question": "कालक्रमानुसार व्यवस्थित कीजिए:",
      "items": ["प्लासी का युद्ध", "बक्सर का युद्ध", "तीसरा आंग्ल-मैसूर युद्ध", "चौथा आंग्ल-मराठा युद्ध"],
      "correctOrder": [0, 1, 2, 3],
      "options": ["1-2-3-4", "2-1-4-3", "1-3-2-4", "3-1-2-4"],
      "correct": 0,
      "explanation": "प्लासी(1757) → बक्सर(1764) → तीसरा मैसूर(1790) → चौथा मराठा(1818)"
    },

    {
      "_comment": "═══ TYPE 5: STATEMENT BASED ═══",
      "qNo": 55,
      "type": "statement_based",
      "unitId": "unit2",
      "chapter": "Mauryan Empire",
      "topic": "Economy",
      "difficulty": "hard",
      "importance": 4,
      "question": "मौर्य अर्थव्यवस्था के बारे में कौन से कथन सही हैं?",
      "statements": [
        "कृषि प्रमुख थी",
        "राज्य खदानों का मालिक था",
        "वस्त्र उद्योग था",
        "कोई व्यापार श्रेणी नहीं थी",
        "आहत सिक्के प्रयुक्त होते थे"
      ],
      "correctStatements": [0, 1, 2, 4],
      "options": ["1, 2, 3 और 5", "1, 2, 4 और 5", "2, 3, 4 और 5", "1, 3, 4 और 5"],
      "correct": 0,
      "explanation": "कथन 4 गलत — व्यापार श्रेणियां (guilds) मौजूद थीं।"
    },

    {
      "_comment": "═══ TYPE 6: PASSAGE (with sub-questions) ═══",
      "qNo": 56,
      "type": "passage",
      "unitId": "unit7",
      "chapter": "Revolt of 1857",
      "difficulty": "medium",
      "importance": 5,
      "passageTitle": "1857 का महान विद्रोह",
      "passage": "1857 का विद्रोह ब्रिटिश शासन के खिलाफ एक बड़ा विद्रोह था। यह 10 मई 1857 को मेरठ से शुरू हुआ। सैनिकों ने नए कारतूसों का विरोध किया जिनमें गाय और सुअर की चर्बी लगी होने की अफवाह थी। विद्रोह दिल्ली, लखनऊ, कानपुर, झांसी तक फैल गया। बहादुर शाह ज़फर को नेता घोषित किया गया।",
      "questions": [
        {
          "question": "गद्यांश के अनुसार विद्रोह कहाँ से शुरू हुआ?",
          "options": ["दिल्ली", "मेरठ", "लखनऊ", "कानपुर"],
          "correct": 1,
          "explanation": "गद्यांश में स्पष्ट है - मेरठ से 10 मई 1857 को।"
        },
        {
          "question": "विद्रोह का तात्कालिक कारण क्या था?",
          "options": ["भूमि कर", "नए कारतूस", "धार्मिक हस्तक्षेप", "व्यापार प्रतिबंध"],
          "correct": 1,
          "explanation": "नए कारतूसों में चर्बी लगी होने की अफवाह।"
        },
        {
          "question": "किसे नेता घोषित किया गया?",
          "options": ["नाना साहब", "तात्या टोपे", "बहादुर शाह ज़फर", "लक्ष्मीबाई"],
          "correct": 2,
          "explanation": "बहादुर शाह ज़फर को विद्रोह का नेता घोषित किया गया।"
        }
      ]
    },

    {
      "_comment": "═══ TYPE 7: DI TABLE ═══",
      "qNo": 59,
      "type": "di_table",
      "unitId": "unit7",
      "chapter": "Data Interpretation",
      "topic": "Table Chart",
      "difficulty": "medium",
      "importance": 3,
      "diTitle": "पांच कंपनियों का वार्षिक उत्पादन (हजार इकाइयों में)",
      "diInstruction": "निम्नलिखित तालिका का अध्ययन करें और प्रश्नों के उत्तर दें:",
      "tableData": {
        "headers": ["कंपनी", "2019", "2020", "2021", "2022", "2023"],
        "rows": [
          ["A", 120, 135, 145, 160, 175],
          ["B", 95, 110, 125, 140, 155],
          ["C", 80, 85, 95, 105, 120],
          ["D", 110, 125, 135, 150, 165],
          ["E", 100, 115, 130, 145, 160]
        ]
      },
      "questions": [
        {
          "question": "2023 में सभी कंपनियों का कुल उत्पादन कितना था?",
          "options": ["750", "775", "800", "825"],
          "correct": 1,
          "explanation": "175+155+120+165+160 = 775"
        },
        {
          "question": "पांच वर्षों में किस कंपनी का औसत उत्पादन सबसे अधिक है?",
          "options": ["A", "B", "D", "E"],
          "correct": 0,
          "explanation": "A = (120+135+145+160+175)/5 = 147, सबसे अधिक"
        },
        {
          "question": "2020 से 2023 के बीच कंपनी C की वृद्धि प्रतिशत?",
          "options": ["35.2%", "40.1%", "41.2%", "45.5%"],
          "correct": 2,
          "explanation": "(120-85)/85 × 100 = 41.2%"
        }
      ]
    },

    {
      "_comment": "═══ TYPE 8: DI BAR CHART ═══",
      "qNo": 62,
      "type": "di_bar_chart",
      "unitId": "unit7",
      "topic": "Bar Chart",
      "difficulty": "medium",
      "importance": 3,
      "diTitle": "दो उत्पादों की छमाही बिक्री (हजार में)",
      "chartData": {
        "labels": ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून"],
        "datasets": [
          { "label": "उत्पाद A", "data": [45, 52, 48, 60, 55, 70], "color": "#3B82F6" },
          { "label": "उत्पाद B", "data": [38, 42, 50, 48, 52, 58], "color": "#EF4444" }
        ],
        "xAxisLabel": "महीने",
        "yAxisLabel": "बिक्री (हजार)"
      },
      "questions": [
        {
          "question": "Q1 (जन-मार्च) में उत्पाद A की कुल बिक्री?",
          "options": ["135", "140", "145", "150"],
          "correct": 2,
          "explanation": "45+52+48 = 145"
        },
        {
          "question": "किस महीने में A और B के बीच अधिकतम अंतर था?",
          "options": ["जनवरी", "अप्रैल", "मई", "जून"],
          "correct": 3,
          "explanation": "जून: 70-58 = 12, सबसे अधिक अंतर"
        }
      ]
    },

    {
      "_comment": "═══ TYPE 9: DI PIE CHART ═══",
      "qNo": 64,
      "type": "di_pie_chart",
      "unitId": "unit7",
      "topic": "Pie Chart",
      "difficulty": "medium",
      "importance": 3,
      "diTitle": "कुल बजट का विभागवार वितरण (कुल = 5 करोड़ रुपये)",
      "chartData": {
        "labels": ["शिक्षा", "स्वास्थ्य", "रक्षा", "कृषि", "अन्य"],
        "datasets": [
          { "label": "बजट वितरण", "data": [25, 20, 30, 15, 10] }
        ]
      },
      "questions": [
        {
          "question": "शिक्षा विभाग को कितनी राशि आवंटित है?",
          "options": ["1.00 करोड़", "1.25 करोड़", "1.50 करोड़", "1.75 करोड़"],
          "correct": 1,
          "explanation": "25% of 5 करोड़ = 1.25 करोड़"
        },
        {
          "question": "रक्षा + स्वास्थ्य को मिलाकर कुल कितना %?",
          "options": ["45%", "50%", "55%", "60%"],
          "correct": 1,
          "explanation": "30% + 20% = 50%"
        }
      ]
    },

    {
      "_comment": "═══ TYPE 10: DI LINE GRAPH ═══",
      "qNo": 66,
      "type": "di_line_graph",
      "unitId": "unit7",
      "topic": "Line Graph",
      "difficulty": "medium",
      "importance": 3,
      "diTitle": "दो शहरों का साप्ताहिक तापमान (°C)",
      "chartData": {
        "labels": ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"],
        "datasets": [
          { "label": "शहर A (°C)", "data": [28, 30, 32, 31, 29, 27, 28], "color": "#FF6384" },
          { "label": "शहर B (°C)", "data": [25, 26, 28, 30, 29, 28, 26], "color": "#36A2EB" }
        ],
        "xAxisLabel": "सप्ताह के दिन",
        "yAxisLabel": "तापमान (°C)"
      },
      "questions": [
        {
          "question": "किस दिन दोनों शहरों का तापमान अंतर अधिकतम था?",
          "options": ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार"],
          "correct": 2,
          "explanation": "बुधवार: शहर A(32) - शहर B(28) = 4°C, अधिकतम"
        },
        {
          "question": "शहर B का साप्ताहिक औसत तापमान?",
          "options": ["26.5°C", "27°C", "27.4°C", "28°C"],
          "correct": 2,
          "explanation": "(25+26+28+30+29+28+26)/7 = 27.4°C"
        }
      ]
    },

    {
      "_comment": "═══ TYPE 11: DI CASELET ═══",
      "qNo": 68,
      "type": "di_caselet",
      "unitId": "unit7",
      "topic": "Caselet",
      "difficulty": "medium",
      "importance": 3,
      "diTitle": "कंपनी की वित्तीय स्थिति — 2022",
      "caseletText": "एक कंपनी का कुल राजस्व 2022 में 50 करोड़ रुपये था। इसमें से 40% उत्पाद A से, 35% उत्पाद B से और शेष उत्पाद C से आया। कंपनी का कुल व्यय 35 करोड़ रुपये था, जिसमें उत्पादन लागत 60%, विपणन लागत 25% और प्रशासनिक लागत शेष थी। कंपनी ने 2023 में राजस्व में 20% की वृद्धि की उम्मीद की है।",
      "questions": [
        {
          "question": "उत्पाद C से 2022 में कितना राजस्व?",
          "options": ["10 करोड़", "12.5 करोड़", "15 करोड़", "17.5 करोड़"],
          "correct": 1,
          "explanation": "C = 100% - 40% - 35% = 25%। 25% of 50 करोड़ = 12.5 करोड़"
        },
        {
          "question": "2022 में शुद्ध लाभ कितना?",
          "options": ["10 करोड़", "12 करोड़", "15 करोड़", "18 करोड़"],
          "correct": 2,
          "explanation": "शुद्ध लाभ = राजस्व - व्यय = 50 - 35 = 15 करोड़"
        },
        {
          "question": "उत्पादन लागत कितनी थी?",
          "options": ["18 करोड़", "19 करोड़", "21 करोड़", "23 करोड़"],
          "correct": 2,
          "explanation": "उत्पादन लागत = 60% of 35 करोड़ = 21 करोड़"
        },
        {
          "question": "2023 में अपेक्षित राजस्व?",
          "options": ["55 करोड़", "58 करोड़", "60 करोड़", "65 करोड़"],
          "correct": 2,
          "explanation": "50 × 1.20 = 60 करोड़"
        }
      ]
    },

    {
      "_comment": "═══ MINIMAL ENTRY (topic mapping only, no content) ═══",
      "qNo": 72,
      "type": "mcq",
      "unitId": "unit3",
      "chapter": "Regional Kingdoms",
      "topic": "Cholas",
      "difficulty": "easy",
      "importance": 2
    }
  ],

  "topTopics": [
    { "rank": 1, "topic": "1857 का विद्रोह", "unitId": "unit7", "chapter": "Revolt of 1857", "questionCount": 7, "questionNumbers": ["Q56", "Q57", "Q58"], "mustScore": true },
    { "rank": 2, "topic": "मौर्य साम्राज्य", "unitId": "unit2", "chapter": "Mauryan Empire", "questionCount": 6, "mustScore": true }
  ],

  "conceptsTracked": [
    { "concept": "धम्म", "unitId": "unit2", "chapter": "Mauryan Empire", "qNo": "Q52", "type": "assertion_reason" },
    { "concept": "मनसबदारी", "unitId": "unit5", "chapter": "Mughal Administration", "qNo": "Q53", "type": "match_following" }
  ],

  "trends": [
    { "trend": "Statement-based प्रश्न बढ़ रहे हैं", "direction": "increasing", "evidence": "25+ प्रश्न", "tip": "elimination technique practice करें" },
    { "trend": "DI प्रश्नों में वृद्धि", "direction": "increasing", "evidence": "10 प्रश्न DI से", "tip": "Table और Caselet पर ज्यादा ध्यान दें" }
  ],

  "difficultyMatrix": [
    { "zone": "GREEN", "qRange": "Q51-Q65", "type": "MCQ + Match", "difficulty": "Easy-Medium", "targetScore": "70-80%" },
    { "zone": "RED", "qRange": "Q66-Q80", "type": "Statement + A-R", "difficulty": "Hard", "targetScore": "50-60%" },
    { "zone": "YELLOW", "qRange": "Q81-Q100", "type": "Passage + DI", "difficulty": "Medium", "targetScore": "60-70%" }
  ]
}`;

// ═══════════════════════════════════════════════════
// STEPS
// ═══════════════════════════════════════════════════
const STEPS = [
  { id: 'input', label: 'Input', labelHi: 'इनपुट', icon: FileText },
  { id: 'preview', label: 'Preview', labelHi: 'पूर्वावलोकन', icon: Eye },
  { id: 'result', label: 'Result', labelHi: 'परिणाम', icon: CheckCircle2 }
];

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
const PYQImport = ({ language }) => {
  const toast = useToast();
  const { importData, validateImport, loading } = usePYQAnalysis();

  const [currentStep, setCurrentStep] = useState(0);
  const [jsonText, setJsonText] = useState('');
  const [validation, setValidation] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [translateEnabled, setTranslateEnabled] = useState(true);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showQTemplates, setShowQTemplates] = useState(false);
  const [selectedTplKey, setSelectedTplKey] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState({});

  const L = (en, hi) => language === 'hi' ? hi : en;

  // Question templates from jsonTemplates.js
  const qTemplates = useMemo(() => {
    if (!ALL_TEMPLATES) return [];
    return Object.entries(ALL_TEMPLATES)
      .filter(([k]) => k !== 'unified_pyq')
      .map(([key, val]) => ({
        key, name: language === 'hi' ? val.nameHi : val.name,
        description: val.description, category: val.category, template: val.template
      }));
  }, [language]);

  // ═══ VALIDATE ═══
  const handleValidate = async () => {
    setValidation(null); setImportResult(null); setParsedData(null);
    let parsed;
    try { parsed = JSON.parse(jsonText); }
    catch (e) {
      setValidation({ isValid: false, errors: [`Invalid JSON: ${e.message}`], warnings: [] });
      return;
    }
    setParsedData(parsed);
    try {
      const r = await validateImport(parsed);
      setValidation(r.validation);
      if (r.validation?.isValid) {
        setCurrentStep(1);
        toast.success(L('Valid! Preview ready', 'मान्य! पूर्वावलोकन तैयार'));
      }
    } catch (e) {
      setValidation({ isValid: false, errors: [e.message], warnings: [] });
    }
  };

  // ═══ IMPORT ═══
  const handleImport = async () => {
    if (!parsedData) return;
    try {
      const r = await importData(parsedData, translateEnabled);
      setImportResult(r);
      setCurrentStep(2);
      toast.success(r.message || L('Imported!', 'आयात पूर्ण!'));
    } catch (e) {
      toast.error(e.message || L('Import failed', 'आयात विफल'));
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success(L('Copied!', 'कॉपी!'))).catch(() => {});
  };

  const resetWizard = () => {
    setCurrentStep(0); setJsonText(''); setValidation(null);
    setParsedData(null); setImportResult(null);
  };

  // ═══ PREVIEW DATA ═══
  const previewData = useMemo(() => {
    if (!parsedData) return null;
    const qs = parsedData.questions || parsedData.questionTopicMap || [];
    const byUnit = {}, byType = {};
    let withContent = 0;

    qs.forEach(q => {
      const uid = q.unitId || 'unknown';
      if (!byUnit[uid]) byUnit[uid] = { id: uid, name: q.unitName || uid, questions: [] };
      byUnit[uid].questions.push(q);

      const t = q.type || 'mcq';
      byType[t] = (byType[t] || 0) + 1;

      if (q.question || q.questionText || q.assertion || q.passage ||
          q.tableData || q.chartData || q.caseletText || q.options?.length ||
          q.statements?.length || q.listA?.length || q.items?.length ||
          q.questions?.length) {
        withContent++;
      }
    });

    return {
      total: qs.length, withContent, withoutContent: qs.length - withContent,
      byUnit: Object.values(byUnit), byType,
      year: parsedData.year, session: parsedData.session, paper: parsedData.paper,
      langInfo: validation?.summary || {}
    };
  }, [parsedData, validation]);

  // ═══ STEP 1: INPUT ═══
  const renderInputStep = () => (
    <div className="space-y-5">
      {/* Unified Template */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm overflow-hidden">
        <button onClick={() => setShowTemplate(!showTemplate)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-secondary-700/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="text-left">
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {L('Unified Template — Analysis + All 11 Question Types', 'एकीकृत टेम्पलेट — विश्लेषण + सभी 11 प्रश्न प्रकार')}
              </span>
              <p className="text-[10px] text-gray-400">
                {L('MCQ, A-R, Match, Sequence, Statement, Passage, DI Table/Bar/Pie/Line/Caselet', 'MCQ, A-R, मैच, क्रम, कथन, गद्यांश, DI तालिका/बार/पाई/लाइन/केसलेट')}
              </p>
            </div>
          </div>
          {showTemplate ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </button>
        {showTemplate && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-secondary-700 pt-4 space-y-4">
            {/* Language Info */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/40">
              <div className="flex items-start gap-2">
                <Languages className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-blue-700 dark:text-blue-400 space-y-1">
                  <p className="font-bold">{L('Single Language Input', 'एकल भाषा इनपुट')}</p>
                  <p>{L('Enter questions in Hindi OR English. System will auto-translate to other language.', 'प्रश्न हिंदी या अंग्रेजी में लिखें। सिस्टम दूसरी भाषा में स्वतः अनुवाद करेगा।')}</p>
                </div>
              </div>
            </div>

            {/* Supported Types */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-xl p-4 border border-violet-100 dark:border-violet-800/40">
              <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 mb-3 uppercase tracking-wider">
                {L('All Supported Question Types', 'सभी समर्थित प्रश्न प्रकार')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { type: 'mcq', label: 'MCQ' },
                  { type: 'assertion_reason', label: 'Assertion-Reason' },
                  { type: 'match_following', label: 'Match Following' },
                  { type: 'sequence_order', label: 'Sequence/Chronology' },
                  { type: 'statement_based', label: 'Statement Based' },
                  { type: 'passage', label: 'Passage/Comprehension' },
                  { type: 'di_table', label: 'DI - Table' },
                  { type: 'di_bar_chart', label: 'DI - Bar Chart' },
                  { type: 'di_pie_chart', label: 'DI - Pie Chart' },
                  { type: 'di_line_graph', label: 'DI - Line Graph' },
                  { type: 'di_caselet', label: 'DI - Caselet' }
                ].map(t => (
                  <span key={t.type} className="text-[9px] px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full font-bold text-center">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Template JSON */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{L('Complete template with examples', 'उदाहरणों सहित पूर्ण टेम्पलेट')}</p>
              <button onClick={() => copyText(UNIFIED_TEMPLATE)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-bold hover:bg-violet-100 transition-colors">
                <Copy className="w-3.5 h-3.5" /> {L('Copy Template', 'टेम्पलेट कॉपी')}
              </button>
            </div>
            <pre className="bg-gray-950 text-green-400 rounded-2xl p-4 text-[10px] leading-relaxed overflow-x-auto max-h-[500px] font-mono border border-gray-800 scrollbar-thin">
              {UNIFIED_TEMPLATE}
            </pre>

            {/* Structure Info */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/40">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] text-amber-700 dark:text-amber-400 space-y-1">
                  <p className="font-bold">{L('JSON Structure:', 'JSON संरचना:')}</p>
                  <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">questions[]</code> — {L('Array of ALL question types', 'सभी प्रश्न प्रकारों की सूची')}</p>
                  <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">type</code> — {L('mcq, assertion_reason, match_following, sequence_order, statement_based, passage, di_table, di_bar_chart, di_pie_chart, di_line_graph, di_caselet', 'प्रश्न का प्रकार')}</p>
                  <p><code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">correct</code> — {L('0-based index of correct answer', 'सही उत्तर का index (0 से शुरू)')}</p>
                  <p>{L('Passage/DI questions use nested', 'गद्यांश/DI प्रश्न nested')} <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">questions[]</code> {L('array for sub-questions', 'array में उप-प्रश्न')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Question Templates */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm overflow-hidden">
        <button onClick={() => setShowQTemplates(!showQTemplates)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-secondary-700/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl flex items-center justify-center">
              <List className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {L('Individual Question Templates', 'अलग-अलग प्रश्न टेम्पलेट')}
              </span>
              <p className="text-[10px] text-gray-400">
                {L('Copy specific question type format', 'विशिष्ट प्रश्न प्रकार का प्रारूप कॉपी करें')}
              </p>
            </div>
          </div>
          {showQTemplates ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </button>
        {showQTemplates && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-secondary-700 pt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {qTemplates.map(tpl => (
                <button key={tpl.key} onClick={() => setSelectedTplKey(selectedTplKey === tpl.key ? null : tpl.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedTplKey === tpl.key
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                  }`}>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{tpl.name}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{tpl.description}</p>
                  <span className={`mt-1.5 inline-block text-[8px] px-1.5 py-0.5 rounded font-bold ${
                    tpl.category === 'basic' ? 'bg-blue-100 text-blue-600' :
                    tpl.category === 'passage' ? 'bg-purple-100 text-purple-600' :
                    tpl.category === 'di' ? 'bg-amber-100 text-amber-600' :
                    tpl.category === 'featured' ? 'bg-rose-100 text-rose-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>{tpl.category}</span>
                </button>
              ))}
            </div>
            {selectedTplKey && ALL_TEMPLATES[selectedTplKey] && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {language === 'hi' ? ALL_TEMPLATES[selectedTplKey].nameHi : ALL_TEMPLATES[selectedTplKey].name}
                  </p>
                  <button onClick={() => copyText(JSON.stringify(ALL_TEMPLATES[selectedTplKey].template, null, 2))}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                    <Copy className="w-3.5 h-3.5" /> {L('Copy', 'कॉपी')}
                  </button>
                </div>
                <pre className="bg-gray-950 text-emerald-400 rounded-xl p-3 text-[9px] leading-relaxed overflow-x-auto max-h-[300px] font-mono border border-gray-800 scrollbar-thin">
                  {JSON.stringify(ALL_TEMPLATES[selectedTplKey].template, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* JSON Input */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-violet-500" />
          {L('Paste JSON', 'JSON पेस्ट करें')}
        </h3>
        <textarea value={jsonText}
          onChange={e => { setJsonText(e.target.value); setValidation(null); setImportResult(null); }}
          placeholder={L('Paste your unified JSON here... (Hindi OR English — auto-translate enabled)', 'अपना एकीकृत JSON यहाँ पेस्ट करें... (हिंदी या अंग्रेजी — स्वतः अनुवाद सक्रिय)')}
          className="w-full h-64 bg-gray-50 dark:bg-secondary-900 border border-gray-200 dark:border-secondary-700 rounded-2xl p-4 font-mono text-xs text-gray-800 dark:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none transition-all"
          spellCheck={false} />

        {/* Translation Toggle */}
        <div className="flex items-center justify-between mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Languages className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{L('Auto-Translation', 'स्वतः अनुवाद')}</p>
              <p className="text-[10px] text-gray-500">{L('Detect language → translate to other', 'भाषा पहचान → दूसरी में अनुवाद')}</p>
            </div>
          </div>
          <button type="button" onClick={() => setTranslateEnabled(!translateEnabled)}
            className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${translateEnabled ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${translateEnabled ? 'right-1' : 'left-1'}`} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400 tabular-nums">{jsonText.length > 0 ? `${(jsonText.length / 1024).toFixed(1)} KB` : ''}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => { setJsonText(''); setValidation(null); setParsedData(null); }}
              disabled={!jsonText || loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-secondary-400 bg-gray-100 dark:bg-secondary-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40">
              {L('Clear', 'साफ')}
            </button>
            <button onClick={handleValidate} disabled={!jsonText || loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-xl transition-all disabled:opacity-40 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {L('Validate & Preview', 'सत्यापित करें')}
            </button>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validation && !validation.isValid && (
        <div className="bg-red-50/80 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-700 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">{L('Validation Failed', 'सत्यापन विफल')}</h4>
          </div>
          {validation.errors?.map((e, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 mb-1">
              <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{e}
            </p>
          ))}
          {validation.warnings?.map((w, i) => (
            <p key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 mb-1">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{w}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  // ═══ STEP 2: PREVIEW ═══
  const renderPreviewStep = () => {
    if (!previewData) return null;

    return (
      <div className="space-y-5">
        {/* Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Hash, label: L('Year', 'वर्ष'), value: `${previewData.year || '-'} ${previewData.session || ''}`, gradient: 'from-violet-500 to-purple-600' },
            { icon: FileText, label: L('Total Q', 'कुल प्रश्न'), value: previewData.total, gradient: 'from-blue-500 to-cyan-600' },
            { icon: BookOpen, label: L('With Content', 'सामग्री सहित'), value: previewData.withContent, gradient: 'from-emerald-500 to-green-600' },
            { icon: Target, label: L('Units', 'इकाइयां'), value: previewData.byUnit.length, gradient: 'from-amber-500 to-orange-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-full opacity-[0.06] -translate-x-4 -translate-y-4`} />
              <div className={`w-9 h-9 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-2 shadow-lg`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Translation Info */}
        {translateEnabled && previewData.langInfo?.detectedLanguage && (
          <div className={`rounded-2xl p-4 border-2 ${
            previewData.langInfo.detectedLanguage === 'hi'
              ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-700'
              : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{L('Auto-Translation', 'स्वतः अनुवाद')}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {previewData.langInfo.detectedLanguage === 'hi'
                    ? L('Detected Hindi → Will translate to English', 'हिंदी पहचानी → अंग्रेजी में अनुवाद होगा')
                    : L('Detected English → Will translate to Hindi', 'अंग्रेजी पहचानी → हिंदी में अनुवाद होगा')}
                </p>
              </div>
              <span className="px-3 py-1.5 bg-white/50 dark:bg-gray-800/50 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300">
                {previewData.langInfo.detectedLanguage === 'hi' ? 'हिंदी → EN' : 'EN → हिंदी'}
              </span>
            </div>
          </div>
        )}

        {/* Type Breakdown */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" />{L('Question Types', 'प्रश्न प्रकार')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(previewData.byType).map(([type, count]) => (
              <span key={type} className="text-xs px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full font-bold">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>

        {/* Questions by Unit */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 shadow-sm p-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <List className="w-4 h-4 text-violet-500" />{L('Questions by Unit', 'इकाई अनुसार प्रश्न')}
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {previewData.byUnit.map(unit => (
              <div key={unit.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedUnits(p => ({ ...p, [unit.id]: !p[unit.id] }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedUnits[unit.id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{unit.name || unit.id}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-full">{unit.questions.length} Q</span>
                </button>
                {expandedUnits[unit.id] && (
                  <div className="px-4 pb-3 space-y-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                    {unit.questions.slice(0, 25).map((q, qi) => (
                      <div key={qi} className="flex items-start gap-2 text-[10px] p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                        <span className="font-bold text-gray-500 w-8 flex-shrink-0">Q{q.qNo || qi + 1}</span>
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded font-bold flex-shrink-0">{q.type || 'mcq'}</span>
                        <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">
                          {q.question || q.questionText || q.assertion || q.topic || q.chapter || '-'}
                        </span>
                        {(q.question || q.questionText || q.assertion || q.passage || q.tableData || q.chartData || q.caseletText || q.options?.length || q.questions?.length) && (
                          <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                    {unit.questions.length > 25 && <p className="text-[10px] text-gray-400 text-center py-1">+{unit.questions.length - 25} more</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Import Button */}
        <button onClick={handleImport} disabled={loading}
          className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />{translateEnabled ? L('Translating & Importing...', 'अनुवाद और आयात...') : L('Importing...', 'आयात...')}</>
          ) : (
            <><Upload className="w-5 h-5" />{translateEnabled ? L('Translate & Import', 'अनुवाद करें और आयात करें') : L('Import', 'आयात करें')}</>
          )}
        </button>

        {/* Back */}
        <button onClick={() => setCurrentStep(0)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {L('Back to Input', 'इनपुट पर वापस')}
        </button>
      </div>
    );
  };

  // ═══ STEP 3: RESULT ═══
  const renderResultStep = () => {
    if (!importResult) return null;
    const data = importResult.data || {};
    const trans = data.translation || {};

    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/40 animate-pulse">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{importResult.message || L('Import Successful!', 'आयात सफल!')}</h2>
          <p className="text-sm text-gray-500">{data.displayLabel || ''}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: L('Questions', 'प्रश्न'), v: data.topicsMapped || 0 },
            { l: L('Top Topics', 'टॉप विषय'), v: data.topTopics || 0 },
            { l: L('Concepts', 'अवधारणाएं'), v: data.concepts || 0 },
            { l: data.isUpdate ? L('Updated', 'अपडेट') : L('Created', 'बनाया'), v: data.isUpdate ? 'Yes' : 'New' },
          ].map((s, i) => (
            <div key={i} className="bg-white/50 dark:bg-secondary-800/30 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-xl font-black text-gray-900 dark:text-white">{s.v}</p>
              <p className="text-[10px] text-gray-500">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Translation Stats */}
        {trans && trans.direction && trans.direction !== 'none' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{L('Translation Complete', 'अनुवाद पूर्ण')}</p>
                <p className="text-xs text-gray-500">{L(`Direction: ${trans.direction}`, `दिशा: ${trans.direction}`)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-emerald-600">{trans.translated || 0}</p>
                <p className="text-[9px] text-gray-500">{L('Translated', 'अनुवादित')}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-gray-500">{trans.skipped || 0}</p>
                <p className="text-[9px] text-gray-500">{L('Skipped', 'छोड़ा')}</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-red-500">{trans.failed || 0}</p>
                <p className="text-[9px] text-gray-500">{L('Failed', 'विफल')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={resetWizard} className="p-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all">
            <RotateCcw className="w-4 h-4" /> {L('Import Another', 'एक और आयात')}
          </button>
          <button onClick={() => window.location.href = '/pyq'} className="p-3.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all">
            <Eye className="w-4 h-4" /> {L('View Dashboard', 'डैशबोर्ड देखें')}
          </button>
        </div>
      </div>
    );
  };

  // ═══ MAIN ═══
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <React.Fragment key={step.id}>
              {i > 0 && <div className={`w-8 sm:w-16 h-0.5 rounded-full transition-colors ${isDone ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              <button onClick={() => { if (isDone) setCurrentStep(i); }} disabled={!isDone && !isActive}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                  : isDone ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-emerald-200'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{language === 'hi' ? step.labelHi : step.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {currentStep === 0 && renderInputStep()}
      {currentStep === 1 && renderPreviewStep()}
      {currentStep === 2 && renderResultStep()}
    </div>
  );
};

export default PYQImport;