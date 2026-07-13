#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * Logical Reasoning PYQ Bulk Import Script
 * Auto-translates Hindi to English & saves to database
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const db = require('../config/db');
const PYQAnalysis = require('../models/PYQAnalysis');
const pyqAnalyzer = require('../utils/pyqAnalyzer');
const pyqTranslateHelper = require('../utils/pyqTranslateHelper');

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
const IMPORT_DATA = {
  language: "hi",
  paper: "Paper 1",
  unit: "Logical Reasoning",
  chapter: "Structure of Arguments",
  topic: "Syllogism and Argument Analysis",
  difficulty: "medium",
  source: "UGC NET Previous Year Questions",
  year: 2023,
  session: "mixed",
  shift: "none",
  questions: [] // Will be populated below
};

// Questions data (your provided questions)
const QUESTIONS_DATA = [
  {
    "type": "statement_based",
    "question": "निम्नलिखित तर्क में किया गया/किये गए तर्कदोष बताइये-\n\"सभी रूसी क्रांतिकारी थे।\nसभी अराजकतावादी क्रांतिकारी थे।\nइसलिये सभी अराजकतावादी रूसी थे।\"",
    "statements": [
      "चार पदों का तर्कदोष",
      "अवैध प्रक्रिया का तर्कदोष",
      "अवितरित मध्य का तर्कदोष",
      "व्यावर्तक आधारवाक्यों का तर्कदोष"
    ],
    "correctStatements": [2],
    "options": ["केवल 1 और 2", "केवल 2 और 3", "केवल 3", "केवल 3 और 4"],
    "correct": 2,
    "explanation": "उपर्युक्त तर्क में 'अवितरित मध्य का तर्कदोष' (Fallacy of Undistributed Middle) विद्यमान है।"
  },
  {
    "type": "mcq",
    "question": "निम्नलिखित कथनों में कौन-सा अनाकारिक तर्कदोष है? \"अमेरिकी भारतीय विलुप्त हो रहे हैं। वह व्यक्ति अमेरिकी भारतीय है, इसलिये वह व्यक्ति विलुप्त हो रहा है।\"",
    "options": ["रेड हेरिंग", "अविचारित सामान्यीकरण", "आत्माश्रय दोष", "विग्रह दोष"],
    "correct": 3,
    "explanation": "दिये गए तर्क में यह माना जा रहा है कि जो बात किसी समूह पर लागू होती है।"
  },
  {
    "type": "mcq",
    "question": "निम्नलिखित युक्ति में किये गए आकारिक तर्कदोष की पहचान कीजिये:\n\"कुछ अच्छे अभिनेता शक्तिशाली एथलीट नहीं हैं।\"",
    "options": ["व्यावर्तक आधार वाक्य", "अस्तित्वपरक तर्क दोष", "निषेधात्मक आधार वाक्य से सकारात्मक निष्कर्ष", "फलवाक्य विधान दोष"],
    "correct": 2,
    "explanation": "दी गई युक्ति में 'निषेधात्मक आधार वाक्य से सकारात्मक निष्कर्ष' आकारिक तर्कदोष है।"
  },
  {
    "type": "mcq",
    "question": "निम्नलिखित में से किस युक्ति में व्याघाती माध्य तर्क दोष है?",
    "options": ["सभी वस्तुएँ गैर-शाश्वत हैं क्योंकि वे ज्ञेय हैं।", "ध्वनि एक गुण है क्योंकि यह दृश्य होती है।", "अग्नि शीतल होती है क्योंकि यह द्रव्य पदार्थ है।", "ध्वनि शाश्वत होती है क्योंकि यह उत्पन्न होती है।"],
    "correct": 3,
    "explanation": "ध्वनि शाश्वत होती है क्योंकि यह उत्पन्न होती है में व्याघाती माध्य तर्क दोष है।"
  },
  {
    "type": "statement_based",
    "question": "निरपेक्ष तर्कवाक्यों के निम्नलिखित प्रकारों में से किसमें प्रतिपरिवर्तन वैध है?",
    "statements": ["कुछ S, P हैं", "कुछ S, P नहीं हैं", "कोई भी S, P नहीं है", "सभी S, P हैं"],
    "correctStatements": [1, 2, 3],
    "options": ["केवल 1, 3 और 4", "1, 2, 3 और 4", "केवल 1, 2 और 3", "केवल 2, 3 और 4"],
    "correct": 3,
    "explanation": "इन तर्क वाक्यों का गुण विधेय पद की व्याप्ति का निर्धारण करता है।"
  }
];

// ═══════════════════════════════════════════════════════════════
// HELPER: Format question for PYQ
// ═══════════════════════════════════════════════════════════════
function formatQuestionForPYQ(q, index) {
  const baseQuestion = {
    qNo: index + 1,
    type: q.type,
    hasContent: true,
    difficulty: q.difficulty || "medium"
  };

  // Format based on type
  if (q.type === "mcq") {
    return {
      ...baseQuestion,
      questionText: q.question,
      questionTextHi: q.question,
      questionTextEn: "", // Will be translated
      options: q.options || [],
      optionsHi: q.options || [],
      optionsEn: [],
      correctAnswer: q.correct,
      explanation: q.explanation || "",
      explanationHi: q.explanation || "",
      explanationEn: ""
    };
  } else if (q.type === "statement_based") {
    return {
      ...baseQuestion,
      questionText: q.question,
      questionTextHi: q.question,
      questionTextEn: "",
      statements: q.statements || [],
      statementsHi: q.statements || [],
      statementsEn: [],
      correctStatements: q.correctStatements || [],
      options: q.options || [],
      optionsHi: q.options || [],
      optionsEn: [],
      correctAnswer: q.correct,
      explanation: q.explanation || "",
      explanationHi: q.explanation || "",
      explanationEn: ""
    };
  } else if (q.type === "assertion_reason") {
    return {
      ...baseQuestion,
      assertion: q.assertion || "",
      assertionHi: q.assertion || "",
      assertionEn: "",
      reason: q.reason || "",
      reasonHi: q.reason || "",
      reasonEn: "",
      options: q.options || [],
      optionsHi: q.options || [],
      optionsEn: [],
      correctAnswer: q.correct,
      explanation: q.explanation || "",
      explanationHi: q.explanation || "",
      explanationEn: ""
    };
  }

  return baseQuestion;
}

// ═══════════════════════════════════════════════════════════════
// MAIN IMPORT FUNCTION
// ═══════════════════════════════════════════════════════════════
async function importPYQData() {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║     Logical Reasoning PYQ Import - Auto Translate        ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Step 1: Connect to DB
    console.log("📡 Connecting to MongoDB...");
    if (!mongoose.connection.readyState) {
      await db.connectDB();
    }
    console.log("✅ Connected\n");

    // Step 2: Format questions
    console.log(`📝 Processing ${QUESTIONS_DATA.length} questions...`);
    const formattedQuestions = QUESTIONS_DATA.map((q, idx) => formatQuestionForPYQ(q, idx));
    IMPORT_DATA.questions = formattedQuestions;
    console.log(`✅ Formatted ${formattedQuestions.length} questions\n`);

    // Step 3: Validate
    console.log("🔍 Validating import data...");
    const validation = pyqAnalyzer.validateImportData(IMPORT_DATA);
    if (!validation.isValid) {
      console.error("❌ Validation failed:");
      console.error(validation.errors);
      process.exit(1);
    }
    console.log("✅ Validation passed\n");

    // Step 4: Normalize
    console.log("🔧 Normalizing data...");
    let normalized = pyqAnalyzer.normalizeImportData(IMPORT_DATA);
    console.log(`✅ Normalized: ${normalized.questionTopicMap?.length} questions\n`);

    // Step 5: Auto-translate Hindi to English
    console.log("🌐 Auto-translating Hindi → English...");
    console.log("   (This may take a minute...)");
    
    pyqTranslateHelper.resetStats();
    const translateResult = await pyqTranslateHelper.translatePYQData(normalized);
    normalized = translateResult.data;
    const translationStats = translateResult.stats;
    
    console.log(`✅ Translation complete:`);
    console.log(`   • Fields translated: ${translationStats.translated}`);
    console.log(`   • Direction: ${translationStats.direction}`);
    console.log(`   • Duration: ${translationStats.duration}ms\n`);

    // Step 6: Save to DB
    console.log("💾 Saving to database...");
    
    // Check if already exists
    const filter = {
      year: normalized.year,
      session: normalized.session,
      shift: normalized.shift,
      paper: normalized.paper
    };

    const existing = await PYQAnalysis.findOne(filter);
    let doc;

    if (existing) {
      console.log(`   ⚠️  Found existing record (${existing._id})`);
      console.log("   Replacing with new data...");
      await PYQAnalysis.deleteOne({ _id: existing._id });
      doc = await PYQAnalysis.create(normalized);
      console.log("✅ Updated existing record\n");
    } else {
      doc = await PYQAnalysis.create(normalized);
      console.log("✅ Created new record\n");
    }

    // Step 7: Verify saved data
    console.log("🔎 Verifying saved data...");
    const saved = await PYQAnalysis.findById(doc._id).lean();
    const savedQCount = saved?.questionTopicMap?.length || 0;
    const questionsWithBoth = saved?.questionTopicMap?.filter(
      q => q.questionTextHi && q.questionTextEn
    )?.length || 0;

    console.log(`✅ Saved Successfully:`);
    console.log(`   • Document ID: ${doc._id}`);
    console.log(`   • Label: ${doc.displayLabel}`);
    console.log(`   • Total Questions: ${savedQCount}`);
    console.log(`   • Questions with Hindi & English: ${questionsWithBoth}`);
    console.log(`   • Year: ${saved.year}`);
    console.log(`   • Session: ${saved.session}`);
    console.log(`   • Paper: ${saved.paper}\n`);

    // Step 8: Sample verification
    if (saved?.questionTopicMap?.[0]) {
      const sq = saved.questionTopicMap[0];
      console.log("📌 Sample Question (Q1) Verification:");
      console.log(`   Type: ${sq.type}`);
      console.log(`   Hindi: ${sq.questionTextHi?.substring(0, 60)}...`);
      console.log(`   English: ${sq.questionTextEn?.substring(0, 60)}...`);
      console.log(`   Options (HI): ${sq.optionsHi?.length || 0}`);
      console.log(`   Options (EN): ${sq.optionsEn?.length || 0}\n`);
    }

    // Step 9: Final status
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    ✅ IMPORT SUCCESSFUL                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log("📋 Next Steps:");
    console.log(`   1. Use Document ID: ${doc._id}`);
    console.log(`   2. Create test with question IDs: pyq_${doc._id}_1, pyq_${doc._id}_2, etc.`);
    console.log(`   3. API Endpoint: POST /api/tests`);
    console.log(`   4. Questions are now available for test creation\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\n📋 Stack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════
importPYQData();
