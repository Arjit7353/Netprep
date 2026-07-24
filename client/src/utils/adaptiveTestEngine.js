// client/src/utils/adaptiveTestEngine.js
// ═══════════════════════════════════════════════════════════════════════════════
// AI ADAPTIVE TEST GENERATOR ENGINE v1.0
// Analyzes student's weak topics, question type weaknesses, and accuracy trends
// to generate personalized adaptive tests. 100% DB-driven, zero randomness.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ADAPTIVE MODES
 */
export const ADAPTIVE_MODES = {
  WEAK_SPOT_BLITZ: 'weak_spot_blitz',
  BALANCED_ADAPTIVE: 'balanced_adaptive',
  FULL_ADAPTIVE_MOCK: 'full_adaptive_mock',
};

export const ADAPTIVE_MODE_CONFIG = {
  weak_spot_blitz: {
    name: 'Weak-Spot Blitz',
    nameHi: 'कमजोर-टॉपिक ब्लिट्ज',
    desc: '10-15 questions targeting your weakest areas',
    descHi: 'आपके सबसे कमजोर क्षेत्रों पर 10-15 प्रश्न',
    icon: 'Zap',
    gradient: 'from-rose-500 to-red-600',
    questionCount: { min: 10, max: 15 },
    durationPerQ: 1.5, // minutes
    weakRatio: 0.80,   // 80% weak topics
    moderateRatio: 0.15,
    strongRatio: 0.05,
  },
  balanced_adaptive: {
    name: 'Balanced Adaptive',
    nameHi: 'संतुलित एडाप्टिव',
    desc: '25 questions with smart difficulty scaling',
    descHi: 'स्मार्ट कठिनाई स्केलिंग के साथ 25 प्रश्न',
    icon: 'Target',
    gradient: 'from-violet-500 to-purple-600',
    questionCount: { min: 25, max: 25 },
    durationPerQ: 1.2,
    weakRatio: 0.55,
    moderateRatio: 0.30,
    strongRatio: 0.15,
  },
  full_adaptive_mock: {
    name: 'Full Adaptive Mock',
    nameHi: 'पूर्ण एडाप्टिव मॉक',
    desc: '50 questions simulating full paper with adaptive difficulty',
    descHi: 'एडाप्टिव कठिनाई के साथ पूर्ण पेपर सिमुलेशन',
    icon: 'Trophy',
    gradient: 'from-amber-500 to-orange-600',
    questionCount: { min: 50, max: 50 },
    durationPerQ: 1.2,
    weakRatio: 0.45,
    moderateRatio: 0.35,
    strongRatio: 0.20,
  },
};

// ═══════════════════════════════════════════════════════════════
// SPACED REPETITION INTERVALS
// ═══════════════════════════════════════════════════════════════
const SRS_INTERVALS = [
  { maxScore: 30, interval: 1, label: 'Critical', labelHi: 'गंभीर' },
  { maxScore: 50, interval: 3, label: 'Weak', labelHi: 'कमजोर' },
  { maxScore: 70, interval: 7, label: 'Learning', labelHi: 'सीख रहे हैं' },
  { maxScore: 85, interval: 14, label: 'Good', labelHi: 'अच्छा' },
  { maxScore: 100, interval: 30, label: 'Mastered', labelHi: 'महारत' },
];

const getSRSLevel = (accuracy) => {
  for (const s of SRS_INTERVALS) {
    if (accuracy <= s.maxScore) return s;
  }
  return SRS_INTERVALS[SRS_INTERVALS.length - 1];
};

// ═══════════════════════════════════════════════════════════════
// TOPIC WEAKNESS ANALYZER
// ═══════════════════════════════════════════════════════════════
function analyzeTopicWeaknesses(allAttempts) {
  const topicMap = {};

  allAttempts.forEach(attempt => {
    if (attempt.status !== 'completed') return;
    const analyses = attempt.topicAnalysis || [];
    analyses.forEach(ta => {
      const key = ta.unit || ta.topic || 'Unknown';
      if (!topicMap[key]) {
        topicMap[key] = { unit: ta.unit, topic: ta.topic, total: 0, correct: 0, wrong: 0, skipped: 0, attempts: 0, lastAttemptDate: null };
      }
      topicMap[key].total += (ta.total || 0);
      topicMap[key].correct += (ta.correct || 0);
      topicMap[key].wrong += (ta.wrong || 0);
      topicMap[key].skipped += (ta.skipped || 0);
      topicMap[key].attempts += 1;
      const attemptDate = new Date(attempt.completedAt || attempt.createdAt);
      if (!topicMap[key].lastAttemptDate || attemptDate > topicMap[key].lastAttemptDate) {
        topicMap[key].lastAttemptDate = attemptDate;
      }
    });
  });

  return Object.entries(topicMap).map(([key, data]) => {
    const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const srs = getSRSLevel(accuracy);
    const daysSinceLastAttempt = data.lastAttemptDate
      ? Math.floor((Date.now() - data.lastAttemptDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const isDueForReview = daysSinceLastAttempt >= srs.interval;
    const urgencyScore = (100 - accuracy) + (isDueForReview ? 30 : 0) + (data.total < 5 ? 20 : 0);

    return {
      key,
      unit: data.unit,
      topic: data.topic,
      total: data.total,
      correct: data.correct,
      wrong: data.wrong,
      skipped: data.skipped,
      accuracy,
      attempts: data.attempts,
      srsLevel: srs,
      daysSinceLastAttempt,
      isDueForReview,
      urgencyScore,
      strength: accuracy >= 70 ? 'strong' : accuracy >= 45 ? 'moderate' : 'weak',
    };
  }).sort((a, b) => b.urgencyScore - a.urgencyScore);
}

// ═══════════════════════════════════════════════════════════════
// QUESTION TYPE WEAKNESS ANALYZER
// ═══════════════════════════════════════════════════════════════
function analyzeQuestionTypeWeaknesses(allAttempts) {
  const typeMap = {};
  allAttempts.forEach(attempt => {
    if (attempt.status !== 'completed') return;
    const answers = attempt.answers || [];
    const questions = attempt.testId?.questions || attempt.questions || [];

    answers.forEach((ans, i) => {
      const q = questions[i];
      if (!q) return;
      const qType = q.questionType || q.type || 'mcq';
      if (!typeMap[qType]) {
        typeMap[qType] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      typeMap[qType].total += 1;
      if (ans.selectedAnswer === -1) {
        typeMap[qType].skipped += 1;
      } else if (ans.isCorrect) {
        typeMap[qType].correct += 1;
      } else {
        typeMap[qType].wrong += 1;
      }
    });
  });

  return Object.entries(typeMap).map(([type, data]) => ({
    type,
    total: data.total,
    correct: data.correct,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    strength: (data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0) >= 65 ? 'strong' : 'weak',
  })).sort((a, b) => a.accuracy - b.accuracy);
}

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY ANALYZER
// ═══════════════════════════════════════════════════════════════
function analyzeDifficultyPerformance(allAttempts) {
  const diffMap = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };

  allAttempts.forEach(attempt => {
    if (attempt.status !== 'completed') return;
    const answers = attempt.answers || [];
    const questions = attempt.testId?.questions || attempt.questions || [];

    answers.forEach((ans, i) => {
      const q = questions[i];
      if (!q) return;
      const diff = q.difficulty || 'medium';
      if (diffMap[diff]) {
        diffMap[diff].total += 1;
        if (ans.isCorrect) diffMap[diff].correct += 1;
      }
    });
  });

  return Object.entries(diffMap).map(([diff, data]) => ({
    difficulty: diff,
    total: data.total,
    correct: data.correct,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  }));
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDED DIFFICULTY FOR STUDENT
// ═══════════════════════════════════════════════════════════════
function getRecommendedDifficulty(diffPerf) {
  const easyAcc = diffPerf.find(d => d.difficulty === 'easy')?.accuracy || 0;
  const medAcc = diffPerf.find(d => d.difficulty === 'medium')?.accuracy || 0;
  const hardAcc = diffPerf.find(d => d.difficulty === 'hard')?.accuracy || 0;

  if (medAcc >= 70 && hardAcc >= 50) {
    return { easy: 0.15, medium: 0.40, hard: 0.45, label: 'Advanced', labelHi: 'उन्नत' };
  }
  if (medAcc >= 55) {
    return { easy: 0.20, medium: 0.50, hard: 0.30, label: 'Intermediate', labelHi: 'मध्यवर्ती' };
  }
  return { easy: 0.35, medium: 0.45, hard: 0.20, label: 'Building', labelHi: 'नींव' };
}

// ═══════════════════════════════════════════════════════════════
// QUESTION SELECTOR — picks questions based on adaptive analysis
// ═══════════════════════════════════════════════════════════════
function selectAdaptiveQuestions(availableQuestions, topicAnalysis, typeAnalysis, diffRecommendation, modeConfig, targetCount) {
  const weakTopics = topicAnalysis.filter(t => t.strength === 'weak').map(t => t.unit);
  const moderateTopics = topicAnalysis.filter(t => t.strength === 'moderate').map(t => t.unit);
  const strongTopics = topicAnalysis.filter(t => t.strength === 'strong').map(t => t.unit);
  const weakTypes = typeAnalysis.filter(t => t.strength === 'weak').map(t => t.type);
  const dueForReview = topicAnalysis.filter(t => t.isDueForReview).map(t => t.unit);

  const weakCount = Math.round(targetCount * modeConfig.weakRatio);
  const moderateCount = Math.round(targetCount * modeConfig.moderateRatio);
  const strongCount = targetCount - weakCount - moderateCount;

  const selected = [];
  const usedIds = new Set();

  const pickFromPool = (pool, count) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    let picked = 0;
    for (const q of shuffled) {
      if (picked >= count) break;
      const qId = q._id || q.id;
      if (usedIds.has(qId)) continue;
      usedIds.add(qId);
      selected.push(q);
      picked++;
    }
    return picked;
  };

  // 1. Weak topic questions (prioritize due-for-review & weak question types)
  const weakPool = availableQuestions.filter(q => {
    const unit = q.unit || '';
    return weakTopics.includes(unit) || dueForReview.includes(unit);
  });
  // Prioritize weak question types within weak topics
  const weakPoolPrioritized = [
    ...weakPool.filter(q => weakTypes.includes(q.questionType)),
    ...weakPool.filter(q => !weakTypes.includes(q.questionType)),
  ];
  pickFromPool(weakPoolPrioritized, weakCount);

  // 2. Moderate topic questions
  const moderatePool = availableQuestions.filter(q => {
    const unit = q.unit || '';
    return moderateTopics.includes(unit) && !usedIds.has(q._id || q.id);
  });
  pickFromPool(moderatePool, moderateCount);

  // 3. Strong topic questions (for confidence building)
  const strongPool = availableQuestions.filter(q => {
    const unit = q.unit || '';
    return strongTopics.includes(unit) && !usedIds.has(q._id || q.id);
  });
  pickFromPool(strongPool, strongCount);

  // 4. Fill remaining from any pool if not enough
  if (selected.length < targetCount) {
    const remaining = availableQuestions.filter(q => !usedIds.has(q._id || q.id));
    pickFromPool(remaining, targetCount - selected.length);
  }

  // Apply difficulty distribution
  const applyDifficultySort = (qs) => {
    const easyQ = qs.filter(q => q.difficulty === 'easy');
    const medQ = qs.filter(q => q.difficulty === 'medium');
    const hardQ = qs.filter(q => q.difficulty === 'hard');
    const unknownQ = qs.filter(q => !['easy', 'medium', 'hard'].includes(q.difficulty));

    // Interleave: start easy, ramp to hard, end with medium (exam strategy)
    const result = [];
    const pools = [easyQ, medQ, hardQ, unknownQ];
    let idx = 0;
    while (result.length < qs.length) {
      for (const pool of pools) {
        if (idx < pool.length) result.push(pool[idx]);
        if (result.length >= qs.length) break;
      }
      idx++;
    }
    return result;
  };

  return applyDifficultySort(selected);
}

// ═══════════════════════════════════════════════════════════════
// MAIN: GENERATE ADAPTIVE TEST CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export function generateAdaptiveTestConfig({
  allAttempts = [],
  questionStats = null,
  availableQuestions = [],
  mode = 'balanced_adaptive',
  paper = 'paper2',
  customQuestionCount = null,
}) {
  const modeConfig = ADAPTIVE_MODE_CONFIG[mode] || ADAPTIVE_MODE_CONFIG.balanced_adaptive;
  const completedAttempts = allAttempts.filter(a => a.status === 'completed');

  // Analyze weaknesses
  const topicAnalysis = analyzeTopicWeaknesses(completedAttempts);
  const typeAnalysis = analyzeQuestionTypeWeaknesses(completedAttempts);
  const diffPerformance = analyzeDifficultyPerformance(completedAttempts);
  const diffRecommendation = getRecommendedDifficulty(diffPerformance);

  // Determine question count (custom or mode default)
  const defaultCount = modeConfig.questionCount.max;
  const desiredCount = customQuestionCount && Number(customQuestionCount) > 0
    ? Number(customQuestionCount)
    : defaultCount;

  const targetCount = availableQuestions.length > 0
    ? Math.min(desiredCount, availableQuestions.length)
    : desiredCount;

  const duration = Math.max(5, Math.round(targetCount * modeConfig.durationPerQ));

  // Select questions adaptively
  const selectedQuestions = selectAdaptiveQuestions(
    availableQuestions, topicAnalysis, typeAnalysis, diffRecommendation, modeConfig, targetCount
  );

  // Generate adaptive report
  const weakTopics = topicAnalysis.filter(t => t.strength === 'weak');
  const moderateTopics = topicAnalysis.filter(t => t.strength === 'moderate');
  const strongTopics = topicAnalysis.filter(t => t.strength === 'strong');
  const dueTopics = topicAnalysis.filter(t => t.isDueForReview);

  const topicCoverage = {};
  selectedQuestions.forEach(q => {
    const u = q.unit || 'Other';
    topicCoverage[u] = (topicCoverage[u] || 0) + 1;
  });

  const diffDistribution = { easy: 0, medium: 0, hard: 0 };
  selectedQuestions.forEach(q => {
    const d = q.difficulty || 'medium';
    diffDistribution[d] = (diffDistribution[d] || 0) + 1;
  });

  const typeCoverage = {};
  selectedQuestions.forEach(q => {
    const t = q.questionType || 'mcq';
    typeCoverage[t] = (typeCoverage[t] || 0) + 1;
  });

  const adaptiveReport = {
    mode,
    modeConfig,
    totalAttempts: completedAttempts.length,
    weakTopics: weakTopics.slice(0, 8),
    moderateTopics: moderateTopics.slice(0, 5),
    strongTopics: strongTopics.slice(0, 5),
    dueForReviewTopics: dueTopics.slice(0, 5),
    typeAnalysis,
    diffPerformance,
    diffRecommendation,
    topicCoverage,
    diffDistribution,
    typeCoverage,
    selectedCount: selectedQuestions.length,
    targetCount,
    duration,
    insights: generateAdaptiveInsights(topicAnalysis, typeAnalysis, diffRecommendation, mode),
  };

  const testConfig = {
    title: `AI Adaptive: ${modeConfig.name}`,
    titleHi: `AI एडाप्टिव: ${modeConfig.nameHi}`,
    testType: 'practice',
    paper,
    totalQuestions: selectedQuestions.length,
    duration,
    marksPerQuestion: 2,
    negativeMarking: mode === 'full_adaptive_mock',
    negativeMarks: mode === 'full_adaptive_mock' ? 0.5 : 0,
    isAdaptive: true,
    adaptiveMode: mode,
  };

  return {
    selectedQuestions,
    selectedQuestionIds: selectedQuestions.map(q => q._id || q.id),
    testConfig,
    adaptiveReport,
    hasEnoughData: completedAttempts.length >= 1,
    hasEnoughQuestions: selectedQuestions.length > 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// INSIGHT GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateAdaptiveInsights(topicAnalysis, typeAnalysis, diffRec, mode) {
  const insights = [];
  const weakTopics = topicAnalysis.filter(t => t.strength === 'weak');
  const dueTopics = topicAnalysis.filter(t => t.isDueForReview);
  const weakTypes = typeAnalysis.filter(t => t.strength === 'weak');

  if (weakTopics.length > 0) {
    const topWeak = weakTopics.slice(0, 3).map(t => t.unit).join(', ');
    insights.push({
      type: 'warning',
      textEn: `Targeting ${weakTopics.length} weak topics: ${topWeak}`,
      textHi: `${weakTopics.length} कमजोर टॉपिक्स को लक्षित: ${topWeak}`,
    });
  }

  if (dueTopics.length > 0) {
    insights.push({
      type: 'info',
      textEn: `${dueTopics.length} topics are due for spaced repetition review`,
      textHi: `${dueTopics.length} टॉपिक्स को स्पेस्ड रिपीटिशन रिव्यू की जरूरत है`,
    });
  }

  if (weakTypes.length > 0) {
    const weakTypeNames = weakTypes.slice(0, 2).map(t => t.type.replace(/_/g, ' ')).join(', ');
    insights.push({
      type: 'warning',
      textEn: `Low accuracy in question types: ${weakTypeNames}`,
      textHi: `प्रश्न प्रकारों में कम सटीकता: ${weakTypeNames}`,
    });
  }

  insights.push({
    type: 'positive',
    textEn: `Difficulty level: ${diffRec.label} — test calibrated to your level`,
    textHi: `कठिनाई स्तर: ${diffRec.labelHi} — आपके स्तर के अनुसार परीक्षा`,
  });

  const modeNames = { weak_spot_blitz: 'rapid weak-spot targeting', balanced_adaptive: 'balanced coverage with smart scaling', full_adaptive_mock: 'full simulation with progressive difficulty' };
  insights.push({
    type: 'positive',
    textEn: `Mode: ${modeNames[mode] || mode}`,
    textHi: `मोड: ${ADAPTIVE_MODE_CONFIG[mode]?.nameHi || mode}`,
  });

  return insights;
}

export { analyzeTopicWeaknesses, analyzeQuestionTypeWeaknesses, analyzeDifficultyPerformance };
