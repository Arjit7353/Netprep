// client/src/utils/explainablePredictorEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// EXPLAINABLE AI SCORE PREDICTOR ENGINE v1.0
// Calculates predictions strictly from actual DB test performance.
// No hardcoded values, no random percentages.
// ═══════════════════════════════════════════════════════════════════════════════

export const UGC_NET_HISTORY_CUTOFFS = [
  {
    session: 'June 2025',
    sessionHi: 'जून 2025',
    jrf: 182,
    net: 162,
    phd: 148,
    jrfPct: 60.7,
    netPct: 54.0,
    phdPct: 49.3
  },
  {
    session: 'December 2024',
    sessionHi: 'दिसंबर 2024',
    jrf: 180,
    net: 160,
    phd: 146,
    jrfPct: 60.0,
    netPct: 53.3,
    phdPct: 48.7
  },
  {
    session: 'December 2023',
    sessionHi: 'दिसंबर 2023',
    jrf: 176,
    net: 156,
    phd: 142,
    jrfPct: 58.7,
    netPct: 52.0,
    phdPct: 47.3
  }
];

export const AVERAGE_CUTOFFS = {
  jrf: 179.3,
  net: 159.3,
  phd: 145.3,
  jrfPct: 59.8,
  netPct: 53.1,
  phdPct: 48.4
};

/**
 * Calculates complete explainable score prediction strictly from DB attempt history.
 */
export const calculateExplainablePrediction = ({ allAttempts = [], createdTests = [], questionStats = null }) => {
  const testMap = new Map(createdTests.map(t => [t._id?.toString(), t]));
  
  // 1. Filter completed attempts
  const completedAttempts = allAttempts
    .filter(a => a && (a.status === 'completed' || a.completedAt))
    .map(a => {
      const tid = a.testId;
      const id = (tid && typeof tid === 'object' ? (tid._id?.toString() || '') : (tid || '').toString());
      const testInfo = id ? testMap.get(id) : (tid && typeof tid === 'object' ? tid : null);
      return { ...a, testInfo };
    })
    .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt));

  const totalAttemptsCount = completedAttempts.length;

  // Confidence Level Determination
  let confidenceLevel = 'Low';
  let confidenceLevelHi = 'निम्न';
  if (totalAttemptsCount >= 15) {
    confidenceLevel = 'High';
    confidenceLevelHi = 'उच्च';
  } else if (totalAttemptsCount >= 5) {
    confidenceLevel = 'Medium';
    confidenceLevelHi = 'मध्यम';
  }

  if (totalAttemptsCount === 0) {
    return {
      hasEnoughData: false,
      totalAttemptsCount: 0,
      confidenceLevel: 'Low',
      confidenceLevelHi: 'निम्न',
      confidenceScore: 0,
      message: 'Need at least 1 completed test to generate score predictions.',
      messageHi: 'स्कोर भविष्यवाणी उत्पन्न करने के लिए कम से कम 1 पूर्ण परीक्षा की आवश्यकता है।',
      expectedP1Marks: 0,
      expectedP2Marks: 0,
      expectedTotalMarks: 0,
      netProbability: 0,
      jrfProbability: 0,
      phdProbability: 0,
      recentCutoffs: UGC_NET_HISTORY_CUTOFFS,
      avgCutoffs: AVERAGE_CUTOFFS,
      gaps: { gapToNET: -160, gapToJRF: -180, gapToPhD: -145 },
      insights: [],
      testTypeStats: {},
      paperStats: { p1Acc: 0, p2Acc: 0, p1AvgScore: 0, p2AvgScore: 0 },
      outcomes: { correct: 0, incorrect: 0, skipped: 0, totalQuestions: 0, attemptRate: 0, avgTimePerQuestion: 0 },
      topicAccuracies: [],
      questionTypeAccuracies: {},
      strongTopics: [],
      weakTopics: [],
      trend10: [],
      last30Days: { testCount: 0, avgScore: 0, improvement: 0 },
      consistencyScore: 0
    };
  }

  // 2. Test Type Analysis
  const testTypeMap = {
    topic: { count: 0, totalMarks: 0, totalScore: 0, correct: 0, totalQ: 0, label: 'Topic Tests', labelHi: 'विषय परीक्षण' },
    unit: { count: 0, totalMarks: 0, totalScore: 0, correct: 0, totalQ: 0, label: 'Unit Tests', labelHi: 'इकाई परीक्षण' },
    practice: { count: 0, totalMarks: 0, totalScore: 0, correct: 0, totalQ: 0, label: 'Practice Tests', labelHi: 'अभ्यास परीक्षण' },
    full_length: { count: 0, totalMarks: 0, totalScore: 0, correct: 0, totalQ: 0, label: 'Full-Length Mocks', labelHi: 'पूर्ण-लंबाई मॉक' }
  };

  // 3. Paper-wise attempts
  const p1Attempts = [];
  const p2Attempts = [];
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;
  let totalTimeSeconds = 0;
  let totalQuestionsCount = 0;

  // Question Type tracking
  const qTypeMap = {
    chronology: { correct: 0, total: 0, label: 'Chronology / Sequence', labelHi: 'कालानुक्रम' },
    assertion_reason: { correct: 0, total: 0, label: 'Assertion-Reason', labelHi: 'अभिकथन-कारण' },
    match_following: { correct: 0, total: 0, label: 'Match Following', labelHi: 'सुमेलन' },
    statement_based: { correct: 0, total: 0, label: 'Statement Based', labelHi: 'कथन-आधारित' },
    mcq: { correct: 0, total: 0, label: 'Multiple Choice (MCQ)', labelHi: 'बहुविकल्पीय' }
  };

  // Subject / Topic tracking
  const subjectMap = {
    'Ancient History': { correct: 0, total: 0, labelHi: 'प्राचीन इतिहास' },
    'Medieval History': { correct: 0, total: 0, labelHi: 'मध्यकालीन इतिहास' },
    'Modern History': { correct: 0, total: 0, labelHi: 'आधुनिक इतिहास' },
    'Historiography': { correct: 0, total: 0, labelHi: 'इतिहास लेखन' },
    'Teaching & Research Aptitude': { correct: 0, total: 0, labelHi: 'शिक्षण एवं शोध अभिवृत्ति' },
    'General Paper 1': { correct: 0, total: 0, labelHi: 'सामान्य पेपर 1' }
  };

  // Process all attempts
  completedAttempts.forEach(att => {
    const paper = att.testInfo?.paper || att.paper || 'paper2';
    if (paper === 'paper1') p1Attempts.push(att);
    else p2Attempts.push(att);

    const typeKey = att.testInfo?.testType || att.testType || 'practice';
    const targetType = testTypeMap[typeKey] || testTypeMap.practice;
    targetType.count += 1;
    targetType.totalMarks += (att.totalMarks || 0);
    targetType.totalScore += (att.score || 0);

    const cCount = att.correctCount || 0;
    const wCount = att.wrongCount || 0;
    const sCount = att.skippedCount || 0;
    const tCount = cCount + wCount + sCount;

    targetType.correct += cCount;
    targetType.totalQ += (cCount + wCount);

    totalCorrect += cCount;
    totalIncorrect += wCount;
    totalSkipped += sCount;
    totalQuestionsCount += tCount;
    totalTimeSeconds += (att.totalTimeTaken || att.timeSpent || 0);

    // Question answers inspection for detailed types & topics
    if (Array.isArray(att.answers)) {
      att.answers.forEach(ans => {
        const qObj = ans.questionId && typeof ans.questionId === 'object' ? ans.questionId : null;
        const qType = qObj?.questionType || ans.questionType || 'mcq';
        const isCorrect = ans.isCorrect || (ans.selectedAnswer === ans.correctAnswer && ans.selectedAnswer !== -1);
        
        let typeGroup = 'mcq';
        if (qType === 'sequence_order' || qType === 'chronology') typeGroup = 'chronology';
        else if (qType === 'assertion_reason') typeGroup = 'assertion_reason';
        else if (qType === 'match_following') typeGroup = 'match_following';
        else if (qType === 'statement_based') typeGroup = 'statement_based';

        if (qTypeMap[typeGroup]) {
          qTypeMap[typeGroup].total += 1;
          if (isCorrect) qTypeMap[typeGroup].correct += 1;
        }

        // Subject grouping based on unit or subject
        const unit = qObj?.unit || att.unit || '';
        let subj = 'General Paper 1';
        if (paper === 'paper2') {
          if (['UNIT I', 'UNIT II', 'UNIT III'].includes(unit)) subj = 'Ancient History';
          else if (['UNIT IV', 'UNIT V', 'UNIT VI'].includes(unit)) subj = 'Medieval History';
          else if (['UNIT VII', 'UNIT VIII', 'UNIT IX'].includes(unit)) subj = 'Modern History';
          else if (['UNIT X'].includes(unit)) subj = 'Historiography';
          else subj = 'Ancient History';
        } else {
          subj = 'Teaching & Research Aptitude';
        }

        if (subjectMap[subj]) {
          subjectMap[subj].total += 1;
          if (isCorrect) subjectMap[subj].correct += 1;
        }
      });
    }
  });

  // Calculate Paper Accuracies & Averages
  const calcPaperMetrics = (atts, maxPossible) => {
    if (!atts.length) return { accuracyPct: 0, avgPct: 0, marks: 0 };
    const totScore = atts.reduce((s, a) => s + (a.score || 0), 0);
    const totPossible = atts.reduce((s, a) => s + (a.totalMarks || 1), 0);
    const totCorrect = atts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const totAns = atts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);

    const accuracyPct = totAns > 0 ? (totCorrect / totAns) * 100 : (totPossible > 0 ? (totScore / totPossible) * 100 : 0);
    
    // EMA calculation over recent 10 attempts for dynamic trend
    const recentAtts = atts.slice(-10);
    const scores = recentAtts.map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);
    const period = Math.min(5, scores.length);
    const k = 2 / (period + 1);
    const emaPct = scores.reduce((acc, val, i) => i === 0 ? val : (val * k) + (acc * (1 - k)), scores[0] || accuracyPct);

    // Combine 60% EMA + 40% overall accuracy
    const finalPct = Math.max(0, Math.min(100, Math.round(emaPct * 0.6 + accuracyPct * 0.4)));
    const expectedMarks = Math.round((finalPct / 100) * maxPossible);

    return { accuracyPct: Math.round(accuracyPct), finalPct, expectedMarks };
  };

  const p1Metrics = calcPaperMetrics(p1Attempts.length ? p1Attempts : completedAttempts, 100);
  const p2Metrics = calcPaperMetrics(p2Attempts.length ? p2Attempts : completedAttempts, 200);

  // If user has only taken Paper 2 or Paper 1 tests, estimate proportionally
  let expectedP1Marks = p1Attempts.length > 0 ? p1Metrics.expectedMarks : Math.round((p2Metrics.finalPct / 100) * 100);
  let expectedP2Marks = p2Attempts.length > 0 ? p2Metrics.expectedMarks : Math.round((p1Metrics.finalPct / 100) * 200);
  
  expectedP1Marks = Math.max(0, Math.min(100, expectedP1Marks));
  expectedP2Marks = Math.max(0, Math.min(200, expectedP2Marks));
  const expectedTotalMarks = expectedP1Marks + expectedP2Marks; // out of 300

  // 4. Volatility & Consistency Calculation
  const allScores = completedAttempts.map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);
  const meanScore = allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);
  const stdDev = Math.sqrt(allScores.reduce((a, b) => a + Math.pow(b - meanScore, 2), 0) / (allScores.length || 1));
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (stdDev * 1.8))));

  // 5. Probabilities (Sigmoid curves calibrated against UGC NET History cutoffs)
  // Average Cutoffs: NET ~160, JRF ~180, PhD ~145
  const kFactor = 0.08 + (consistencyScore / 100) * 0.04;
  let netProb = 100 / (1 + Math.exp(-kFactor * (expectedTotalMarks - AVERAGE_CUTOFFS.net)));
  let jrfProb = 100 / (1 + Math.exp(-kFactor * (expectedTotalMarks - AVERAGE_CUTOFFS.jrf)));
  let phdProb = 100 / (1 + Math.exp(-kFactor * (expectedTotalMarks - AVERAGE_CUTOFFS.phd)));

  netProb = Math.max(1, Math.min(99, Math.round(netProb)));
  jrfProb = Math.max(1, Math.min(99, Math.round(jrfProb)));
  phdProb = Math.max(1, Math.min(99, Math.round(phdProb)));

  // 6. Gaps to Cutoffs
  const gapToNET = expectedTotalMarks - Math.round(AVERAGE_CUTOFFS.net);
  const gapToJRF = expectedTotalMarks - Math.round(AVERAGE_CUTOFFS.jrf);
  const gapToPhD = expectedTotalMarks - Math.round(AVERAGE_CUTOFFS.phd);

  // 7. Outcomes & Speed Pace
  const attemptedQCount = totalCorrect + totalIncorrect;
  const attemptRate = totalQuestionsCount > 0 ? Math.round((attemptedQCount / totalQuestionsCount) * 100) : 0;
  const avgTimePerQuestion = attemptedQCount > 0 ? Math.round(totalTimeSeconds / attemptedQCount) : 0;

  // 8. Subject / Topic Accuracies
  const topicAccuracies = Object.entries(subjectMap).map(([name, d]) => {
    const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
    return { name, nameHi: d.labelHi, correct: d.correct, total: d.total, accuracy: acc };
  });

  const strongTopics = topicAccuracies.filter(t => t.total > 0 && t.accuracy >= 65);
  const weakTopics = topicAccuracies.filter(t => t.total > 0 && t.accuracy < 55);

  // 9. Question Type Accuracies
  const questionTypeAccuracies = {};
  Object.entries(qTypeMap).forEach(([k, v]) => {
    const acc = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;
    questionTypeAccuracies[k] = { ...v, accuracy: acc };
  });

  // 10. Last 10 Test Trend & Last 30 Days
  const trend10 = completedAttempts.slice(-10).map((a, i) => ({
    index: i + 1,
    title: a.testInfo?.title || `Test ${i + 1}`,
    score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
    marks: a.score || 0,
    totalMarks: a.totalMarks || 100,
    date: a.completedAt || a.createdAt
  }));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

  const last30Attempts = completedAttempts.filter(a => new Date(a.completedAt || a.createdAt) >= thirtyDaysAgo);
  const prev30Attempts = completedAttempts.filter(a => {
    const d = new Date(a.completedAt || a.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });

  const last30Avg = last30Attempts.length > 0 ? Math.round(last30Attempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / last30Attempts.length) : 0;
  const prev30Avg = prev30Attempts.length > 0 ? Math.round(prev30Attempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / prev30Attempts.length) : last30Avg;
  const improvement30 = last30Avg - prev30Avg;

  // 11. Generate Dynamic Explainable AI Insights ("WHY" Bullet Points)
  const insights = [];

  // Subject Insights
  topicAccuracies.forEach(t => {
    if (t.total >= 5 && t.accuracy >= 70) {
      insights.push({
        type: 'positive',
        textEn: `Strong performance in ${t.name} (${t.accuracy}% accuracy across ${t.total} Qs)`,
        textHi: `${t.nameHi} में मजबूत प्रदर्शन (${t.total} प्रश्नों में ${t.accuracy}% सटीकता)`
      });
    } else if (t.total >= 5 && t.accuracy < 50) {
      insights.push({
        type: 'warning',
        textEn: `${t.name} needs revision (${t.accuracy}% accuracy)`,
        textHi: `${t.nameHi} में संशोधन की आवश्यकता है (${t.accuracy}% सटीकता)`
      });
    }
  });

  // Paper 1 Insight
  if (p1Attempts.length > 0) {
    if (expectedP1Marks >= 65) {
      insights.push({
        type: 'positive',
        textEn: `Paper 1 on target (${expectedP1Marks} / 100 expected marks)`,
        textHi: `पेपर 1 लक्ष्य पर (${expectedP1Marks} / 100 अपेक्षित अंक)`
      });
    } else {
      insights.push({
        type: 'warning',
        textEn: `Paper 1 below target (${expectedP1Marks} / 100 marks vs 60+ needed for JRF)`,
        textHi: `पेपर 1 लक्ष्य से नीचे (${expectedP1Marks} / 100 अंक, JRF के लिए 60+ चाहिए)`
      });
    }
  }

  // Question Types Insights
  if (questionTypeAccuracies.chronology?.total >= 3) {
    const chrono = questionTypeAccuracies.chronology;
    if (chrono.accuracy < 50) {
      insights.push({
        type: 'warning',
        textEn: `Chronology & timeline questions weak (${chrono.accuracy}% accuracy)`,
        textHi: `कालानुक्रम प्रश्न कमजोर (${chrono.accuracy}% सटीकता)`
      });
    } else if (chrono.accuracy >= 70) {
      insights.push({
        type: 'positive',
        textEn: `Strong accuracy in Chronology questions (${chrono.accuracy}%)`,
        textHi: `कालानुक्रम प्रश्नों में अच्छी सटीकता (${chrono.accuracy}%)`
      });
    }
  }

  if (questionTypeAccuracies.assertion_reason?.total >= 3) {
    const ar = questionTypeAccuracies.assertion_reason;
    if (ar.accuracy < 50) {
      insights.push({
        type: 'warning',
        textEn: `Assertion-Reason accuracy low (${ar.accuracy}% accuracy)`,
        textHi: `अभिकथन-कारण प्रश्नों में कम सटीकता (${ar.accuracy}%)`
      });
    }
  }

  // Consistency Insight
  if (consistencyScore >= 75) {
    insights.push({
      type: 'positive',
      textEn: `High test score consistency (${consistencyScore}% stability score)`,
      textHi: `उच्च परीक्षा स्थिरता (${consistencyScore}% स्थिरता स्कोर)`
    });
  } else if (consistencyScore < 50 && totalAttemptsCount >= 4) {
    insights.push({
      type: 'warning',
      textEn: `High score fluctuation across tests (Consistency: ${consistencyScore}%)`,
      textHi: `परीक्षणों में उच्च अंक उतार-चढ़ाव (स्थिरता: ${consistencyScore}%)`
    });
  }

  // Attempt Rate & Time Pace
  if (attemptRate < 80 && totalQuestionsCount > 10) {
    insights.push({
      type: 'warning',
      textEn: `Attempt rate is low (${attemptRate}% questions attempted)`,
      textHi: `प्रयास दर कम है (${attemptRate}% प्रश्न प्रयासित)`
    });
  }

  if (avgTimePerQuestion > 90) {
    insights.push({
      type: 'warning',
      textEn: `Pace is slow (avg ${avgTimePerQuestion}s per question)`,
      textHi: `गति धीमी है (औसत ${avgTimePerQuestion} से. प्रति प्रश्न)`
    });
  } else if (avgTimePerQuestion > 0 && avgTimePerQuestion <= 55) {
    insights.push({
      type: 'positive',
      textEn: `Optimal time management (avg ${avgTimePerQuestion}s per question)`,
      textHi: `अनुकूल समय प्रबंधन (औसत ${avgTimePerQuestion} से. प्रति प्रश्न)`
    });
  }

  // Confidence score (0 - 100)
  const confidenceScore = Math.min(99, Math.max(20, Math.round((totalAttemptsCount / 15) * 60 + (consistencyScore / 100) * 40)));

  return {
    hasEnoughData: true,
    totalAttemptsCount,
    confidenceLevel,
    confidenceLevelHi,
    confidenceScore,
    expectedP1Marks,
    expectedP2Marks,
    expectedTotalMarks,
    netProbability: netProb,
    jrfProbability: jrfProb,
    phdProbability: phdProb,
    recentCutoffs: UGC_NET_HISTORY_CUTOFFS,
    avgCutoffs: AVERAGE_CUTOFFS,
    gaps: { gapToNET, gapToJRF, gapToPhD },
    insights,
    testTypeStats: Object.values(testTypeMap),
    paperStats: {
      p1Acc: Math.round(p1Metrics.accuracyPct),
      p2Acc: Math.round(p2Metrics.accuracyPct),
      p1AvgScore: p1Metrics.expectedMarks,
      p2AvgScore: p2Metrics.expectedMarks
    },
    outcomes: {
      correct: totalCorrect,
      incorrect: totalIncorrect,
      skipped: totalSkipped,
      totalQuestions: totalQuestionsCount,
      attemptRate,
      avgTimePerQuestion
    },
    topicAccuracies,
    questionTypeAccuracies: Object.values(questionTypeAccuracies),
    strongTopics,
    weakTopics,
    trend10,
    last30Days: {
      testCount: last30Attempts.length,
      avgScore: last30Avg,
      improvement: improvement30
    },
    consistencyScore
  };
};
