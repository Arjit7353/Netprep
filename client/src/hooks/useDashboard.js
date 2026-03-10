// client/src/hooks/useDashboard.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import questionService from '../services/questionService';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

// ════════════════════════════════════════════════════════════
//  SYLLABUS DATA FOR COVERAGE TRACKING
// ════════════════════════════════════════════════════════════
const PAPER1_UNITS = [
  'UNIT I', 'UNIT II', 'UNIT III', 'UNIT IV', 'UNIT V',
  'UNIT VI', 'UNIT VII', 'UNIT VIII', 'UNIT IX', 'UNIT X'
];
const PAPER1_UNIT_NAMES = {
  'UNIT I': 'Teaching Aptitude',
  'UNIT II': 'Research Aptitude',
  'UNIT III': 'Comprehension',
  'UNIT IV': 'Communication',
  'UNIT V': 'Mathematical Reasoning',
  'UNIT VI': 'Logical Reasoning',
  'UNIT VII': 'Data Interpretation',
  'UNIT VIII': 'ICT',
  'UNIT IX': 'Environment',
  'UNIT X': 'Higher Education'
};
const PAPER2_UNITS = [
  'UNIT I', 'UNIT II', 'UNIT III', 'UNIT IV', 'UNIT V',
  'UNIT VI', 'UNIT VII', 'UNIT VIII', 'UNIT IX', 'UNIT X'
];
const PAPER2_UNIT_NAMES = {
  'UNIT I': 'Sources & Pre-History',
  'UNIT II': 'Mauryan to Gupta',
  'UNIT III': 'Early Medieval',
  'UNIT IV': 'Medieval Political',
  'UNIT V': 'Administration & Economy',
  'UNIT VI': 'Society & Culture',
  'UNIT VII': 'British Power',
  'UNIT VIII': 'Colonial Economy',
  'UNIT IX': 'National Movement',
  'UNIT X': 'Historiography'
};

// ════════════════════════════════════════════════════════════
//  JRF SCORING CONSTANTS
// ════════════════════════════════════════════════════════════
const JRF_CUTOFF_GENERAL = 60; // approximate
const NET_CUTOFF_GENERAL = 40;
const PAPER1_MAX = 100;
const PAPER2_MAX = 200;
const TOTAL_MAX = 300;

const useDashboard = () => {
  // ── CORE STATE ──
  const [questionStats, setQuestionStats] = useState(null);
  const [testStats, setTestStats] = useState(null);
  const [attemptStats, setAttemptStats] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [createdTests, setCreatedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const fetchedRef = useRef(false);

  // ── GOAL STATE (persisted in localStorage) ──
  const [examDate, setExamDateState] = useState(() => {
    try { return localStorage.getItem('netprep_exam_date') || ''; }
    catch { return ''; }
  });
  const [dailyGoals, setDailyGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('netprep_daily_goals');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [goalHistory, setGoalHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('netprep_goal_history');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [customTargets, setCustomTargets] = useState(() => {
    try {
      const saved = localStorage.getItem('netprep_custom_targets');
      return saved ? JSON.parse(saved) : {
        dailyTests: 3,
        dailyAccuracy: 70,
        weeklyTests: 15,
        targetScore: 75
      };
    } catch {
      return { dailyTests: 3, dailyAccuracy: 70, weeklyTests: 15, targetScore: 75 };
    }
  });

  // ════════════════════════════════════════════
  //  DATA FETCHING
  // ════════════════════════════════════════════
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [qStats, tStats, aStats, recent, allAtt, tests] = await Promise.allSettled([
        questionService.getStats(),
        testService.getStats(),
        attemptService.getStats(),
        attemptService.getRecentAttempts(50),
        attemptService.getAttempts({ status: 'completed', limit: 200 }),
        testService.getTests({ limit: 200 }),
      ]);
      if (qStats.status === 'fulfilled') setQuestionStats(qStats.value?.data || null);
      if (tStats.status === 'fulfilled') setTestStats(tStats.value?.data || null);
      if (aStats.status === 'fulfilled') setAttemptStats(aStats.value?.data || null);
      if (recent.status === 'fulfilled') setRecentAttempts(recent.value?.data || []);
      if (allAtt.status === 'fulfilled') {
        const d = allAtt.value?.data;
        setAllAttempts(Array.isArray(d) ? d : d?.attempts || []);
      }
      if (tests.status === 'fulfilled') {
        const d = tests.value?.data;
        setCreatedTests(Array.isArray(d) ? d : d?.tests || []);
      }
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll(true), [fetchAll]);

  // ════════════════════════════════════════════
  //  BASIC STATS (enhanced)
  // ════════════════════════════════════════════
  const paper1Units = useMemo(() =>
    questionStats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], [questionStats]);
  const paper2Units = useMemo(() =>
    questionStats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], [questionStats]);
  const paper1Count = useMemo(() =>
    paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() =>
    paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);
  const totalQuestions = questionStats?.total || 0;

  // ── COMPLETED ATTEMPTS ──
  const allCompletedAttempts = useMemo(() => {
    const a = allAttempts.length > 0 ? allAttempts : recentAttempts;
    return a.filter(at => at.status === 'completed' || at.completedAt);
  }, [allAttempts, recentAttempts]);

  // ── PAPER-WISE ATTEMPTS ──
  const paper1Attempts = useMemo(() =>
    allCompletedAttempts.filter(a => a.testId?.paper === 'paper1'), [allCompletedAttempts]);
  const paper2Attempts = useMemo(() =>
    allCompletedAttempts.filter(a => a.testId?.paper === 'paper2'), [allCompletedAttempts]);

  // ── PAPER-WISE CREATED TESTS ──
  const paper1Tests = useMemo(() =>
    createdTests.filter(t => t.paper === 'paper1'), [createdTests]);
  const paper2Tests = useMemo(() =>
    createdTests.filter(t => t.paper === 'paper2'), [createdTests]);
  const combinedTests = useMemo(() =>
    createdTests.filter(t => t.paper === 'combined' || (!t.paper)), [createdTests]);

  // ════════════════════════════════════════════
  //  ACCURACY CALCULATIONS
  // ════════════════════════════════════════════
  const calcAccuracy = (attempts) => {
    if (!attempts.length) return 0;
    const tc = attempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tq = attempts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return tq > 0 ? Math.round((tc / tq) * 100) : 0;
  };

  const overallAccuracy = useMemo(() => calcAccuracy(allCompletedAttempts), [allCompletedAttempts]);
  const paper1Accuracy = useMemo(() => calcAccuracy(paper1Attempts), [paper1Attempts]);
  const paper2Accuracy = useMemo(() => calcAccuracy(paper2Attempts), [paper2Attempts]);

  // ── AVG SCORES ──
  const calcAvgScore = (attempts) => {
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((s, a) =>
      s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length);
  };
  const paper1AvgScore = useMemo(() => calcAvgScore(paper1Attempts), [paper1Attempts]);
  const paper2AvgScore = useMemo(() => calcAvgScore(paper2Attempts), [paper2Attempts]);
  const overallAvgScore = useMemo(() => calcAvgScore(allCompletedAttempts), [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  SCORE TRENDS
  // ════════════════════════════════════════════
  const buildTrend = (attempts) => {
    return [...attempts]
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-15)
      .map((a, i) => ({
        name: `T${i + 1}`,
        score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
        accuracy: (() => {
          const t = (a.correctCount || 0) + (a.wrongCount || 0);
          return t > 0 ? Math.round((a.correctCount / t) * 100) : 0;
        })(),
        date: a.completedAt,
        title: a.testId?.title || `Test ${i + 1}`,
        timeTaken: a.totalTimeTaken || 0,
        correct: a.correctCount || 0,
        wrong: a.wrongCount || 0,
        skipped: a.skippedCount || 0,
      }));
  };

  const scoreTrend = useMemo(() => buildTrend(allCompletedAttempts), [allCompletedAttempts]);
  const paper1Trend = useMemo(() => buildTrend(paper1Attempts), [paper1Attempts]);
  const paper2Trend = useMemo(() => buildTrend(paper2Attempts), [paper2Attempts]);

  const calcTrend = (data) => {
    if (data.length < 2) return 'neutral';
    const half = Math.floor(data.length / 2);
    const avgOld = data.slice(0, half).reduce((s, d) => s + d.score, 0) / (half || 1);
    const avgNew = data.slice(half).reduce((s, d) => s + d.score, 0) / ((data.length - half) || 1);
    if (avgNew > avgOld + 3) return 'up';
    if (avgNew < avgOld - 3) return 'down';
    return 'neutral';
  };

  const trendDirection = useMemo(() => calcTrend(scoreTrend), [scoreTrend]);
  const paper1TrendDir = useMemo(() => calcTrend(paper1Trend), [paper1Trend]);
  const paper2TrendDir = useMemo(() => calcTrend(paper2Trend), [paper2Trend]);

  // ════════════════════════════════════════════
  //  PREDICTION (Linear Regression)
  // ════════════════════════════════════════════
  const predictScore = (data) => {
    if (data.length < 3) return null;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((s, d) => s + d.score, 0);
    const sumXY = data.reduce((s, d, i) => s + i * d.score, 0);
    const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    return Math.max(0, Math.min(100, Math.round(slope * n + intercept)));
  };
  const predictedScore = useMemo(() => predictScore(scoreTrend), [scoreTrend]);
  const paper1Predicted = useMemo(() => predictScore(paper1Trend), [paper1Trend]);
  const paper2Predicted = useMemo(() => predictScore(paper2Trend), [paper2Trend]);

  // ════════════════════════════════════════════
  //  NOT ATTEMPTED TESTS
  // ════════════════════════════════════════════
  const notAttemptedTests = useMemo(() => {
    const attemptedTestIds = new Set(
      allCompletedAttempts.map(a => a.testId?._id?.toString() || a.testId?.toString())
    );
    return createdTests.filter(t => !attemptedTestIds.has(t._id?.toString()));
  }, [createdTests, allCompletedAttempts]);

  const paper1NotAttempted = useMemo(() =>
    notAttemptedTests.filter(t => t.paper === 'paper1'), [notAttemptedTests]);
  const paper2NotAttempted = useMemo(() =>
    notAttemptedTests.filter(t => t.paper === 'paper2'), [notAttemptedTests]);

  // ── NEEDS ATTENTION (< 50%) ──
  const needsAttentionTests = useMemo(() => {
    const testScoreMap = {};
    allCompletedAttempts.forEach(a => {
      const tid = a.testId?._id?.toString() || a.testId?.toString();
      if (!tid) return;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (!testScoreMap[tid] || pct > testScoreMap[tid].bestScore) {
        testScoreMap[tid] = {
          testId: tid, test: a.testId, bestScore: pct,
          attempts: (testScoreMap[tid]?.attempts || 0) + 1,
          lastAttempt: a, grade: pct,
        };
      } else {
        testScoreMap[tid].attempts += 1;
      }
    });
    return Object.values(testScoreMap)
      .filter(t => t.bestScore < 50)
      .sort((a, b) => a.bestScore - b.bestScore);
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  ACTIVITY MAP & STREAK
  // ════════════════════════════════════════════
  const activityMap = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      const k = new Date(a.completedAt || a.createdAt).toISOString().split('T')[0];
      if (!map[k]) map[k] = { count: 0, totalScore: 0, totalAccuracy: 0 };
      map[k].count += 1;
      map[k].totalScore += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const att = (a.correctCount || 0) + (a.wrongCount || 0);
      map[k].totalAccuracy += att > 0 ? Math.round((a.correctCount / att) * 100) : 0;
    });
    // Calculate averages
    Object.keys(map).forEach(k => {
      map[k].avgScore = map[k].count > 0 ? Math.round(map[k].totalScore / map[k].count) : 0;
      map[k].avgAccuracy = map[k].count > 0 ? Math.round(map[k].totalAccuracy / map[k].count) : 0;
    });
    return map;
  }, [allCompletedAttempts]);

  const streak = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      if (activityMap[k]?.count > 0) count++;
      else if (i > 0) break;
    }
    return count;
  }, [activityMap]);

  const longestStreak = useMemo(() => {
    const dates = Object.keys(activityMap).sort();
    let max = 0, cur = 0, prevDate = null;
    dates.forEach(d => {
      const date = new Date(d);
      if (prevDate) {
        const diff = (date - prevDate) / 86400000;
        if (diff === 1) cur++;
        else cur = 1;
      } else {
        cur = 1;
      }
      max = Math.max(max, cur);
      prevDate = date;
    });
    return max;
  }, [activityMap]);

  // ════════════════════════════════════════════
  //  WEEKLY COMPARISON
  // ════════════════════════════════════════════
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const twStart = new Date(now);
    twStart.setDate(now.getDate() - now.getDay());
    twStart.setHours(0, 0, 0, 0);
    const lwStart = new Date(twStart);
    lwStart.setDate(lwStart.getDate() - 7);
    const tw = allCompletedAttempts.filter(a => new Date(a.completedAt) >= twStart);
    const lw = allCompletedAttempts.filter(a => {
      const d = new Date(a.completedAt);
      return d >= lwStart && d < twStart;
    });
    const avg = (arr) => !arr.length ? 0 : Math.round(
      arr.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / arr.length
    );
    return {
      thisWeek: { tests: tw.length, avgScore: avg(tw) },
      lastWeek: { tests: lw.length, avgScore: avg(lw) },
      change: tw.length - lw.length,
      scoreChange: avg(tw) - avg(lw)
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  🆕 JRF PROBABILITY METER (Predictive AI)
  // ════════════════════════════════════════════════════════
  const jrfProbability = useMemo(() => {
    if (allCompletedAttempts.length < 3) {
      return {
        netProbability: 0, jrfProbability: 0,
        predictedP1: 0, predictedP2: 0, predictedTotal: 0,
        netCutoff: NET_CUTOFF_GENERAL, jrfCutoff: JRF_CUTOFF_GENERAL,
        confidence: 'low', factors: [], suggestions: [],
        riskLevel: 'unknown', consistencyScore: 0
      };
    }

    // Calculate predicted scores for P1 and P2
    const p1Scores = paper1Attempts
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10)
      .map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);

    const p2Scores = paper2Attempts
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10)
      .map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);

    // Weighted average (recent scores have more weight)
    const weightedAvg = (scores) => {
      if (scores.length === 0) return 0;
      let totalWeight = 0, weightedSum = 0;
      scores.forEach((s, i) => {
        const w = 1 + (i / scores.length) * 2; // newer = higher weight
        weightedSum += s * w;
        totalWeight += w;
      });
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };

    const p1Weighted = weightedAvg(p1Scores);
    const p2Weighted = weightedAvg(p2Scores);

    // Apply trend adjustment
    const trendAdj = (scores) => {
      if (scores.length < 3) return 0;
      const half = Math.floor(scores.length / 2);
      const oldAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const newAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
      return (newAvg - oldAvg) * 0.3; // 30% of trend
    };

    const p1Adj = p1Weighted + trendAdj(p1Scores);
    const p2Adj = p2Weighted + trendAdj(p2Scores);

    // Predicted marks
    const predictedP1Pct = Math.min(100, Math.max(0, p1Adj));
    const predictedP2Pct = Math.min(100, Math.max(0, p2Adj));
    const predictedP1 = Math.round(predictedP1Pct);
    const predictedP2 = Math.round(predictedP2Pct);

    // Combined predicted percentage
    const predictedTotal = Math.round((predictedP1 + predictedP2) / 2);

    // Consistency score (lower std dev = more consistent)
    const stdDev = (scores) => {
      if (scores.length < 2) return 50;
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
      return Math.sqrt(variance);
    };

    const allScores = [...p1Scores, ...p2Scores];
    const sd = stdDev(allScores);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - sd * 2)));

    // Calculate probability
    // NET probability
    const netGap = predictedTotal - NET_CUTOFF_GENERAL;
    let netProb;
    if (netGap >= 20) netProb = 95;
    else if (netGap >= 10) netProb = 80 + (netGap - 10);
    else if (netGap >= 0) netProb = 50 + netGap * 3;
    else if (netGap >= -10) netProb = 20 + (netGap + 10) * 3;
    else netProb = Math.max(5, 20 + netGap * 1.5);

    // JRF probability
    const jrfGap = predictedTotal - JRF_CUTOFF_GENERAL;
    let jrfProb;
    if (jrfGap >= 15) jrfProb = 90;
    else if (jrfGap >= 5) jrfProb = 65 + (jrfGap - 5) * 2.5;
    else if (jrfGap >= 0) jrfProb = 40 + jrfGap * 5;
    else if (jrfGap >= -10) jrfProb = 15 + (jrfGap + 10) * 2.5;
    else jrfProb = Math.max(3, 15 + jrfGap);

    // Apply consistency bonus/penalty
    const consistencyMod = (consistencyScore - 50) / 100;
    netProb = Math.min(99, Math.max(1, Math.round(netProb + consistencyMod * 10)));
    jrfProb = Math.min(99, Math.max(1, Math.round(jrfProb + consistencyMod * 10)));

    // Confidence level
    const dataPoints = p1Scores.length + p2Scores.length;
    const confidence = dataPoints >= 15 ? 'high' : dataPoints >= 8 ? 'medium' : 'low';

    // Risk assessment
    let riskLevel;
    if (jrfProb >= 70) riskLevel = 'safe';
    else if (jrfProb >= 45) riskLevel = 'moderate';
    else if (jrfProb >= 25) riskLevel = 'risky';
    else riskLevel = 'critical';

    // Factors affecting probability
    const factors = [];
    if (paper1Accuracy >= 70) factors.push({ type: 'positive', text: `Paper 1 accuracy ${paper1Accuracy}%` });
    else factors.push({ type: 'negative', text: `Paper 1 accuracy only ${paper1Accuracy}%` });

    if (paper2Accuracy >= 70) factors.push({ type: 'positive', text: `Paper 2 accuracy ${paper2Accuracy}%` });
    else factors.push({ type: 'negative', text: `Paper 2 accuracy only ${paper2Accuracy}%` });

    if (streak >= 7) factors.push({ type: 'positive', text: `${streak}-day study streak` });
    else if (streak < 3) factors.push({ type: 'negative', text: 'Low study consistency' });

    if (consistencyScore >= 60) factors.push({ type: 'positive', text: `High consistency (${consistencyScore}%)` });
    else factors.push({ type: 'negative', text: `Score variance high (${consistencyScore}%)` });

    if (trendDirection === 'up') factors.push({ type: 'positive', text: 'Scores trending upward' });
    else if (trendDirection === 'down') factors.push({ type: 'negative', text: 'Scores declining' });

    // Suggestions
    const suggestions = [];
    if (predictedP1 < 60) suggestions.push('Focus more on Paper 1 - target 60%+');
    if (predictedP2 < 55) suggestions.push('Paper 2 needs improvement - practice more History');
    if (consistencyScore < 50) suggestions.push('Be more consistent - avoid wild score swings');
    if (streak < 5) suggestions.push('Maintain daily practice streak for better preparation');
    if (notAttemptedTests.length > 10) suggestions.push(`Complete ${notAttemptedTests.length} pending tests`);
    if (needsAttentionTests.length > 3) suggestions.push('Retry low-score tests to improve weak areas');
    if (p1Scores.length < 5) suggestions.push('Take more Paper 1 tests for better prediction');
    if (p2Scores.length < 5) suggestions.push('Take more Paper 2 tests for better prediction');

    return {
      netProbability: netProb,
      jrfProbability: jrfProb,
      predictedP1, predictedP2, predictedTotal,
      netCutoff: NET_CUTOFF_GENERAL,
      jrfCutoff: JRF_CUTOFF_GENERAL,
      confidence,
      factors,
      suggestions,
      riskLevel,
      consistencyScore,
      p1Trend: paper1TrendDir,
      p2Trend: paper2TrendDir,
      dataPoints,
    };
  }, [allCompletedAttempts, paper1Attempts, paper2Attempts, paper1Accuracy,
    paper2Accuracy, streak, trendDirection, paper1TrendDir, paper2TrendDir,
    notAttemptedTests, needsAttentionTests]);

  // ════════════════════════════════════════════════════════
  //  🆕 DYNAMIC GOAL TRACKER + AUTO DAILY GOALS
  // ════════════════════════════════════════════════════════
  const setExamDate = useCallback((date) => {
    setExamDateState(date);
    try { localStorage.setItem('netprep_exam_date', date); } catch {}
  }, []);

  const updateCustomTargets = useCallback((targets) => {
    setCustomTargets(targets);
    try { localStorage.setItem('netprep_custom_targets', JSON.stringify(targets)); } catch {}
  }, []);

  // Days until exam
  const daysUntilExam = useMemo(() => {
    if (!examDate) return null;
    const diff = new Date(examDate) - new Date();
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [examDate]);

  // Today's progress
  const todayKey = new Date().toISOString().split('T')[0];
  const todayActivity = useMemo(() => activityMap[todayKey] || { count: 0, avgScore: 0, avgAccuracy: 0 }, [activityMap, todayKey]);

  // Auto-generate daily goals
  const autoGeneratedGoals = useMemo(() => {
    const goals = [];
    const { dailyTests, dailyAccuracy, targetScore } = customTargets;

    // Goal 1: Daily test count
    goals.push({
      id: 'daily_tests',
      title: `Complete ${dailyTests} tests today`,
      titleHi: `आज ${dailyTests} टेस्ट पूरे करें`,
      icon: 'ClipboardList',
      target: dailyTests,
      current: todayActivity.count,
      type: 'count',
      color: 'blue',
      priority: 'high',
    });

    // Goal 2: Accuracy target
    goals.push({
      id: 'daily_accuracy',
      title: `Maintain ${dailyAccuracy}%+ accuracy`,
      titleHi: `${dailyAccuracy}%+ सटीकता बनाए रखें`,
      icon: 'Target',
      target: dailyAccuracy,
      current: todayActivity.count > 0 ? todayActivity.avgAccuracy : 0,
      type: 'percentage',
      color: 'emerald',
      priority: 'high',
    });

    // Goal 3: Score improvement
    const recentAvg = scoreTrend.slice(-5).reduce((s, d) => s + d.score, 0) / (Math.min(scoreTrend.length, 5) || 1);
    const improvTarget = Math.min(100, Math.round(recentAvg + 5));
    goals.push({
      id: 'score_improve',
      title: `Score ${improvTarget}%+ in next test`,
      titleHi: `अगले टेस्ट में ${improvTarget}%+ स्कोर`,
      icon: 'TrendingUp',
      target: improvTarget,
      current: todayActivity.count > 0 ? todayActivity.avgScore : 0,
      type: 'percentage',
      color: 'purple',
      priority: 'medium',
    });

    // Goal 4: Pending tests reduction
    if (notAttemptedTests.length > 0) {
      goals.push({
        id: 'clear_pending',
        title: `Clear ${Math.min(2, notAttemptedTests.length)} pending tests`,
        titleHi: `${Math.min(2, notAttemptedTests.length)} बाकी टेस्ट पूरे करें`,
        icon: 'Clock',
        target: Math.min(2, notAttemptedTests.length),
        current: 0, // Hard to track dynamically
        type: 'count',
        color: 'amber',
        priority: 'medium',
      });
    }

    // Goal 5: Weak area practice (dynamic)
    if (needsAttentionTests.length > 0) {
      goals.push({
        id: 'retry_weak',
        title: 'Retry 1 low-score test',
        titleHi: '1 कम स्कोर वाला टेस्ट दोबारा दें',
        icon: 'RefreshCw',
        target: 1,
        current: 0,
        type: 'count',
        color: 'red',
        priority: 'high',
      });
    }

    // Goal 6: Study streak
    goals.push({
      id: 'maintain_streak',
      title: `Maintain ${streak + 1}-day streak`,
      titleHi: `${streak + 1}-दिन की स्ट्रीक बनाएं`,
      icon: 'Flame',
      target: 1, // Just need 1 test today
      current: todayActivity.count > 0 ? 1 : 0,
      type: 'count',
      color: 'orange',
      priority: 'low',
    });

    return goals;
  }, [customTargets, todayActivity, scoreTrend, notAttemptedTests,
    needsAttentionTests, streak]);

  // Goal completion percentage
  const goalCompletionPct = useMemo(() => {
    if (autoGeneratedGoals.length === 0) return 0;
    const completed = autoGeneratedGoals.filter(g => {
      if (g.type === 'count') return g.current >= g.target;
      if (g.type === 'percentage') return g.current >= g.target;
      return false;
    }).length;
    return Math.round((completed / autoGeneratedGoals.length) * 100);
  }, [autoGeneratedGoals]);

  // ════════════════════════════════════════════════════════
  //  🆕 SYLLABUS COVERAGE TREEMAP/HEATMAP
  // ════════════════════════════════════════════════════════
  const syllabusCoverage = useMemo(() => {
    // Build coverage from question stats + attempt performance
    const buildCoverage = (units, unitNames, paper, paperAttempts) => {
      const unitQuestionMap = {};
      const relevantUnits = (questionStats?.byUnit || []).filter(u => u._id?.paper === paper);

      relevantUnits.forEach(u => {
        const unitKey = u._id?.unit || '';
        unitQuestionMap[unitKey] = u.count;
      });

      // Get performance per unit from attempts
      const unitPerfMap = {};
      paperAttempts.forEach(a => {
        (a.topicAnalysis || []).forEach(ta => {
          const key = ta.unit || 'Other';
          if (!unitPerfMap[key]) unitPerfMap[key] = { correct: 0, wrong: 0, total: 0, skipped: 0 };
          unitPerfMap[key].correct += ta.correct || 0;
          unitPerfMap[key].wrong += ta.wrong || 0;
          unitPerfMap[key].total += ta.total || 0;
          unitPerfMap[key].skipped += ta.skipped || 0;
        });
      });

      return units.map(unit => {
        // Try to match unit from question bank
        const matchedKey = Object.keys(unitQuestionMap).find(k =>
          k.toLowerCase().includes(unit.toLowerCase()) ||
          unit.toLowerCase().includes(k.toLowerCase().replace(/unit\s*/i, '').trim())
        );

        const qCount = matchedKey ? unitQuestionMap[matchedKey] : 0;

        // Match performance
        const perfKey = Object.keys(unitPerfMap).find(k =>
          k.toLowerCase().includes(unit.toLowerCase()) ||
          unit.toLowerCase().includes(k.toLowerCase().replace(/unit\s*/i, '').trim())
        );
        const perf = perfKey ? unitPerfMap[perfKey] : null;

        const accuracy = perf && perf.total > 0
          ? Math.round((perf.correct / perf.total) * 100) : 0;
        const attempted = perf ? perf.total : 0;

        // Coverage level
        let level = 'not_started';
        if (qCount > 0 && attempted > 0 && accuracy >= 70) level = 'mastered';
        else if (qCount > 0 && attempted > 0 && accuracy >= 40) level = 'learning';
        else if (qCount > 0 && attempted > 0) level = 'weak';
        else if (qCount > 0) level = 'has_questions';

        return {
          unit,
          name: unitNames[unit] || unit,
          questions: qCount,
          attempted,
          accuracy,
          correct: perf?.correct || 0,
          wrong: perf?.wrong || 0,
          skipped: perf?.skipped || 0,
          level,
          color: level === 'mastered' ? '#22c55e'
            : level === 'learning' ? '#3b82f6'
            : level === 'weak' ? '#ef4444'
            : level === 'has_questions' ? '#f59e0b'
            : '#e5e7eb'
        };
      });
    };

    const p1Coverage = buildCoverage(PAPER1_UNITS, PAPER1_UNIT_NAMES, 'paper1', paper1Attempts);
    const p2Coverage = buildCoverage(PAPER2_UNITS, PAPER2_UNIT_NAMES, 'paper2', paper2Attempts);

    // Summary stats
    const calcSummary = (coverage) => {
      const total = coverage.length;
      const mastered = coverage.filter(c => c.level === 'mastered').length;
      const learning = coverage.filter(c => c.level === 'learning').length;
      const weak = coverage.filter(c => c.level === 'weak').length;
      const hasQ = coverage.filter(c => c.level === 'has_questions').length;
      const notStarted = coverage.filter(c => c.level === 'not_started').length;
      const overallPct = total > 0 ? Math.round(((mastered * 100 + learning * 60 + weak * 25 + hasQ * 10) / (total * 100)) * 100) : 0;
      return { total, mastered, learning, weak, hasQ, notStarted, overallPct };
    };

    return {
      paper1: p1Coverage,
      paper2: p2Coverage,
      paper1Summary: calcSummary(p1Coverage),
      paper2Summary: calcSummary(p2Coverage),
      overallPct: Math.round(
        (calcSummary(p1Coverage).overallPct + calcSummary(p2Coverage).overallPct) / 2
      ),
    };
  }, [questionStats, paper1Attempts, paper2Attempts]);

  // ════════════════════════════════════════════════════════
  //  🆕 SPEED ANALYTICS
  // ════════════════════════════════════════════════════════
  const speedAnalytics = useMemo(() => {
    if (allCompletedAttempts.length === 0) {
      return { avgTimePerQ: 0, fastestTest: null, slowestTest: null, speedTrend: [], timeDistribution: [] };
    }

    const withTime = allCompletedAttempts.filter(a => a.totalTimeTaken > 0 && a.correctCount + a.wrongCount + a.skippedCount > 0);

    const avgTimes = withTime.map(a => ({
      avgTime: Math.round(a.totalTimeTaken / (a.correctCount + a.wrongCount + a.skippedCount)),
      score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
      title: a.testId?.title || 'Test',
      date: a.completedAt
    }));

    const sortedBySpeed = [...avgTimes].sort((a, b) => a.avgTime - b.avgTime);

    // Speed trend over last 10 tests
    const speedTrend = [...withTime]
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10)
      .map((a, i) => {
        const totalQ = a.correctCount + a.wrongCount + a.skippedCount;
        return {
          name: `T${i + 1}`,
          speed: totalQ > 0 ? Math.round(a.totalTimeTaken / totalQ) : 0,
          accuracy: (() => {
            const t = (a.correctCount || 0) + (a.wrongCount || 0);
            return t > 0 ? Math.round((a.correctCount / t) * 100) : 0;
          })(),
        };
      });

    // Time distribution buckets
    const buckets = { '<30s': 0, '30-60s': 0, '60-90s': 0, '90-120s': 0, '>120s': 0 };
    avgTimes.forEach(a => {
      if (a.avgTime < 30) buckets['<30s']++;
      else if (a.avgTime < 60) buckets['30-60s']++;
      else if (a.avgTime < 90) buckets['60-90s']++;
      else if (a.avgTime < 120) buckets['90-120s']++;
      else buckets['>120s']++;
    });

    const overallAvg = avgTimes.length > 0
      ? Math.round(avgTimes.reduce((s, a) => s + a.avgTime, 0) / avgTimes.length) : 0;

    return {
      avgTimePerQ: overallAvg,
      fastestTest: sortedBySpeed[0] || null,
      slowestTest: sortedBySpeed[sortedBySpeed.length - 1] || null,
      speedTrend,
      timeDistribution: Object.entries(buckets).map(([name, value]) => ({ name, value })),
      speedVsAccuracy: avgTimes.slice(-20),
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  🆕 ERROR PATTERN ANALYSIS
  // ════════════════════════════════════════════════════════
  const errorPatterns = useMemo(() => {
    if (allCompletedAttempts.length === 0) {
      return { byType: [], weakUnits: [], strongUnits: [], errorRate: 0, improvementAreas: [] };
    }

    // Aggregate by question type from attempts
    const typeMap = {};
    const unitMap = {};

    allCompletedAttempts.forEach(a => {
      // We don't have question-level type data in attempts directly
      // But we have topicAnalysis
      (a.topicAnalysis || []).forEach(ta => {
        const key = ta.unit || 'Other';
        if (!unitMap[key]) unitMap[key] = { correct: 0, wrong: 0, total: 0, skipped: 0 };
        unitMap[key].correct += ta.correct || 0;
        unitMap[key].wrong += ta.wrong || 0;
        unitMap[key].total += ta.total || 0;
        unitMap[key].skipped += ta.skipped || 0;
      });
    });

    // Sort units by accuracy (ascending = weakest first)
    const unitPerf = Object.entries(unitMap).map(([unit, stats]) => ({
      unit,
      ...stats,
      accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      errorRate: stats.total > 0 ? Math.round((stats.wrong / stats.total) * 100) : 0,
    })).sort((a, b) => a.accuracy - b.accuracy);

    const weakUnits = unitPerf.filter(u => u.accuracy < 50 && u.total >= 3);
    const strongUnits = unitPerf.filter(u => u.accuracy >= 70 && u.total >= 3).sort((a, b) => b.accuracy - a.accuracy);

    // Overall error rate
    const totalCorrect = Object.values(unitMap).reduce((s, u) => s + u.correct, 0);
    const totalWrong = Object.values(unitMap).reduce((s, u) => s + u.wrong, 0);
    const totalAll = totalCorrect + totalWrong;
    const errorRate = totalAll > 0 ? Math.round((totalWrong / totalAll) * 100) : 0;

    // Improvement areas with suggestions
    const improvementAreas = weakUnits.slice(0, 5).map(u => ({
      unit: u.unit,
      accuracy: u.accuracy,
      errorRate: u.errorRate,
      questionsAttempted: u.total,
      suggestion: u.accuracy < 30
        ? 'Critical - needs thorough revision'
        : u.accuracy < 50
        ? 'Weak - practice more questions'
        : 'Average - review mistakes',
    }));

    // Question type performance from questionStats
    const byType = Object.entries(questionStats?.byType || {}).map(([type, count]) => ({
      type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }));

    return { byType, weakUnits, strongUnits, errorRate, improvementAreas, unitPerformance: unitPerf };
  }, [allCompletedAttempts, questionStats]);

  // ════════════════════════════════════════════════════════
  //  🆕 SMART STUDY RECOMMENDATIONS
  // ════════════════════════════════════════════════════════
  const studyRecommendations = useMemo(() => {
    const recs = [];

    // 1. Weakest unit recommendation
    if (errorPatterns.weakUnits.length > 0) {
      const weakest = errorPatterns.weakUnits[0];
      recs.push({
        id: 'weak_unit',
        priority: 'critical',
        icon: 'AlertTriangle',
        title: `Focus on ${weakest.unit}`,
        titleHi: `${weakest.unit} पर ध्यान दें`,
        detail: `Only ${weakest.accuracy}% accuracy with ${weakest.total} questions attempted`,
        detailHi: `केवल ${weakest.accuracy}% सटीकता, ${weakest.total} प्रश्न`,
        action: 'practice',
        color: 'red',
        unit: weakest.unit,
      });
    }

    // 2. Untouched topics
    const p1Untouched = syllabusCoverage.paper1.filter(c => c.level === 'not_started');
    const p2Untouched = syllabusCoverage.paper2.filter(c => c.level === 'not_started');
    if (p1Untouched.length > 0) {
      recs.push({
        id: 'p1_untouched',
        priority: 'high',
        icon: 'BookOpen',
        title: `Start ${p1Untouched[0].name} (Paper 1)`,
        titleHi: `${p1Untouched[0].name} शुरू करें (पेपर 1)`,
        detail: `${p1Untouched.length} Paper 1 units not yet covered`,
        detailHi: `पेपर 1 में ${p1Untouched.length} इकाइयां बाकी`,
        action: 'start',
        color: 'blue',
      });
    }
    if (p2Untouched.length > 0) {
      recs.push({
        id: 'p2_untouched',
        priority: 'high',
        icon: 'Target',
        title: `Start ${p2Untouched[0].name} (Paper 2)`,
        titleHi: `${p2Untouched[0].name} शुरू करें (पेपर 2)`,
        detail: `${p2Untouched.length} Paper 2 units not yet covered`,
        detailHi: `पेपर 2 में ${p2Untouched.length} इकाइयां बाकी`,
        action: 'start',
        color: 'purple',
      });
    }

    // 3. Declining score alert
    if (trendDirection === 'down') {
      recs.push({
        id: 'declining',
        priority: 'high',
        icon: 'TrendingDown',
        title: 'Scores are declining',
        titleHi: 'स्कोर गिर रहे हैं',
        detail: 'Review your recent mistakes and revise fundamentals',
        detailHi: 'हाल की गलतियों की समीक्षा करें',
        action: 'review',
        color: 'orange',
      });
    }

    // 4. Pending tests reminder
    if (notAttemptedTests.length > 5) {
      recs.push({
        id: 'pending',
        priority: 'medium',
        icon: 'Clock',
        title: `${notAttemptedTests.length} tests pending`,
        titleHi: `${notAttemptedTests.length} टेस्ट बाकी`,
        detail: 'Complete older tests first for comprehensive coverage',
        detailHi: 'पुराने टेस्ट पहले पूरे करें',
        action: 'take_test',
        color: 'amber',
      });
    }

    // 5. Consistency recommendation
    if (streak < 3 && allCompletedAttempts.length > 5) {
      recs.push({
        id: 'consistency',
        priority: 'medium',
        icon: 'Flame',
        title: 'Build study routine',
        titleHi: 'अध्ययन की आदत बनाएं',
        detail: `Current streak: ${streak} days. Aim for 7+ days`,
        detailHi: `वर्तमान स्ट्रीक: ${streak} दिन`,
        action: 'streak',
        color: 'orange',
      });
    }

    // 6. Paper balance
    const p1Att = paper1Attempts.length;
    const p2Att = paper2Attempts.length;
    if (p1Att > 0 && p2Att > 0) {
      const ratio = p1Att / (p1Att + p2Att);
      if (ratio > 0.7) {
        recs.push({
          id: 'balance_p2',
          priority: 'medium',
          icon: 'BarChart2',
          title: 'Practice more Paper 2',
          titleHi: 'पेपर 2 ज्यादा अभ्यास करें',
          detail: `Paper 1: ${p1Att} tests vs Paper 2: ${p2Att} tests`,
          detailHi: `पेपर 1: ${p1Att} vs पेपर 2: ${p2Att}`,
          action: 'balance',
          color: 'purple',
        });
      } else if (ratio < 0.3) {
        recs.push({
          id: 'balance_p1',
          priority: 'medium',
          icon: 'BarChart2',
          title: 'Practice more Paper 1',
          titleHi: 'पेपर 1 ज्यादा अभ्यास करें',
          detail: `Paper 1: ${p1Att} tests vs Paper 2: ${p2Att} tests`,
          detailHi: `पेपर 1: ${p1Att} vs पेपर 2: ${p2Att}`,
          action: 'balance',
          color: 'blue',
        });
      }
    }

    // 7. Speed optimization
    if (speedAnalytics.avgTimePerQ > 90) {
      recs.push({
        id: 'speed',
        priority: 'low',
        icon: 'Zap',
        title: 'Improve answer speed',
        titleHi: 'उत्तर देने की गति बढ़ाएं',
        detail: `Avg ${speedAnalytics.avgTimePerQ}s/question. Target: <60s`,
        detailHi: `औसत ${speedAnalytics.avgTimePerQ}s/प्रश्न`,
        action: 'speed',
        color: 'cyan',
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recs.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

    return recs.slice(0, 8);
  }, [errorPatterns, syllabusCoverage, trendDirection, notAttemptedTests,
    streak, allCompletedAttempts, paper1Attempts, paper2Attempts, speedAnalytics]);

  // ════════════════════════════════════════════════════════
  //  🆕 SCORE DISTRIBUTION
  // ════════════════════════════════════════════════════════
  const scoreDistribution = useMemo(() => {
    if (allCompletedAttempts.length === 0) return [];
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    allCompletedAttempts.forEach(a => {
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (pct <= 20) buckets['0-20']++;
      else if (pct <= 40) buckets['21-40']++;
      else if (pct <= 60) buckets['41-60']++;
      else if (pct <= 80) buckets['61-80']++;
      else buckets['81-100']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({
      range, count,
      pct: allCompletedAttempts.length > 0 ? Math.round((count / allCompletedAttempts.length) * 100) : 0,
      color: range === '81-100' ? '#22c55e' : range === '61-80' ? '#3b82f6'
        : range === '41-60' ? '#f59e0b' : range === '21-40' ? '#f97316' : '#ef4444'
    }));
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  🆕 PERSONAL RECORDS
  // ════════════════════════════════════════════════════════
  const personalRecords = useMemo(() => {
    if (allCompletedAttempts.length === 0) return {};

    const scores = allCompletedAttempts.map(a => ({
      pct: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
      title: a.testId?.title || 'Test',
      date: a.completedAt,
      accuracy: (() => {
        const t = (a.correctCount || 0) + (a.wrongCount || 0);
        return t > 0 ? Math.round((a.correctCount / t) * 100) : 0;
      })(),
      timeTaken: a.totalTimeTaken || 0,
    }));

    const sortedByScore = [...scores].sort((a, b) => b.pct - a.pct);
    const sortedByAccuracy = [...scores].sort((a, b) => b.accuracy - a.accuracy);

    // Tests per day
    const dayCount = {};
    allCompletedAttempts.forEach(a => {
      const k = new Date(a.completedAt).toISOString().split('T')[0];
      dayCount[k] = (dayCount[k] || 0) + 1;
    });
    const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

    return {
      highestScore: sortedByScore[0] || null,
      lowestScore: sortedByScore[sortedByScore.length - 1] || null,
      bestAccuracy: sortedByAccuracy[0] || null,
      totalTestsTaken: allCompletedAttempts.length,
      bestDay: bestDay ? { date: bestDay[0], count: bestDay[1] } : null,
      longestStreak,
      currentStreak: streak,
      totalStudyTime: allCompletedAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0),
    };
  }, [allCompletedAttempts, longestStreak, streak]);

  // ════════════════════════════════════════════════════════
  //  🆕 TIME-OF-DAY ANALYSIS
  // ════════════════════════════════════════════════════════
  const timeOfDayAnalysis = useMemo(() => {
    const hourMap = {};
    for (let i = 0; i < 24; i++) hourMap[i] = { count: 0, totalScore: 0, totalAccuracy: 0 };

    allCompletedAttempts.forEach(a => {
      if (!a.startedAt && !a.completedAt) return;
      const hour = new Date(a.startedAt || a.completedAt).getHours();
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const acc = (() => {
        const t = (a.correctCount || 0) + (a.wrongCount || 0);
        return t > 0 ? Math.round((a.correctCount / t) * 100) : 0;
      })();
      hourMap[hour].count++;
      hourMap[hour].totalScore += pct;
      hourMap[hour].totalAccuracy += acc;
    });

    const hourData = Object.entries(hourMap).map(([hour, data]) => ({
      hour: parseInt(hour),
      label: `${hour.toString().padStart(2, '0')}:00`,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      avgAccuracy: data.count > 0 ? Math.round(data.totalAccuracy / data.count) : 0,
    }));

    // Best time
    const withTests = hourData.filter(h => h.count >= 2);
    const bestHour = withTests.sort((a, b) => b.avgScore - a.avgScore)[0] || null;

    // Best period
    const periods = [
      { name: 'Morning', nameHi: 'सुबह', range: [6, 12], icon: 'Sun' },
      { name: 'Afternoon', nameHi: 'दोपहर', range: [12, 17], icon: 'Coffee' },
      { name: 'Evening', nameHi: 'शाम', range: [17, 21], icon: 'Sunset' },
      { name: 'Night', nameHi: 'रात', range: [21, 6], icon: 'Moon' },
    ];

    const periodData = periods.map(p => {
      const hours = hourData.filter(h => {
        if (p.range[0] < p.range[1]) return h.hour >= p.range[0] && h.hour < p.range[1];
        return h.hour >= p.range[0] || h.hour < p.range[1];
      });
      const totalCount = hours.reduce((s, h) => s + h.count, 0);
      const avgScore = totalCount > 0
        ? Math.round(hours.reduce((s, h) => s + h.avgScore * h.count, 0) / totalCount) : 0;
      return { ...p, count: totalCount, avgScore };
    });

    const bestPeriod = [...periodData].sort((a, b) => b.avgScore - a.avgScore)[0];

    return { hourData, bestHour, periodData, bestPeriod };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  DIFFICULTY DATA & QUESTION TYPE DATA
  // ════════════════════════════════════════════════════════
  const difficultyData = useMemo(() => {
    const bd = questionStats?.byDifficulty;
    if (!bd) return [];
    return [
      { name: 'Easy', value: bd.easy || 0, color: '#22c55e' },
      { name: 'Medium', value: bd.medium || 0, color: '#f59e0b' },
      { name: 'Hard', value: bd.hard || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [questionStats]);

  const questionTypeData = useMemo(() => {
    const bt = questionStats?.byType;
    if (!bt || typeof bt !== 'object') return [];
    return Object.entries(bt).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        pct: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0,
      }));
  }, [questionStats, totalQuestions]);

  // ── TOPIC PERFORMANCE (for Radar) ──
  const topicPerformance = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      (a.topicAnalysis || []).forEach(t => {
        const key = t.unit || t.topic || 'Other';
        if (!map[key]) map[key] = { unit: key, correct: 0, wrong: 0, skipped: 0, total: 0 };
        map[key].correct += t.correct || 0;
        map[key].wrong += t.wrong || 0;
        map[key].skipped += t.skipped || 0;
        map[key].total += t.total || 0;
      });
    });
    return Object.values(map)
      .map(t => ({
        ...t,
        accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
        fullMark: 100
      }))
      .sort((a, b) => b.total - a.total).slice(0, 10);
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  ACHIEVEMENTS (Enhanced)
  // ════════════════════════════════════════════════════════
  const achievements = useMemo(() => {
    const list = [];
    const ta = allCompletedAttempts.length;
    const best = ta > 0
      ? Math.max(...allCompletedAttempts.map(a =>
        a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0))
      : 0;

    const add = (icon, label, desc, color, unlocked, progress) =>
      list.push({ icon, label, desc, color, unlocked, progress });

    // Question milestones
    if (totalQuestions >= 100) add('Layers', 'Century', '100+ Qs', 'amber', true);
    else add('Layers', 'Century', `${totalQuestions}/100`, 'gray', false, totalQuestions / 100);

    if (totalQuestions >= 500) add('Crown', 'Massive', '500+ Qs', 'purple', true);
    else if (totalQuestions >= 100) add('Crown', 'Massive', `${totalQuestions}/500`, 'gray', false, totalQuestions / 500);

    // Test milestones
    if (ta >= 1) add('Play', 'Starter', '1st test', 'blue', true);
    else add('Play', 'Starter', '0/1', 'gray', false, 0);

    if (ta >= 10) add('Flame', 'Dedicated', '10+ tests', 'orange', true);
    else add('Flame', 'Dedicated', `${ta}/10`, 'gray', false, ta / 10);

    if (ta >= 50) add('Medal', 'Veteran', '50+ tests', 'amber', true);
    else if (ta >= 10) add('Medal', 'Veteran', `${ta}/50`, 'gray', false, ta / 50);

    // Score milestones
    if (best >= 90) add('Star', 'Expert', '90%+', 'amber', true);
    else if (best >= 80) add('Star', 'Brilliant', '80%+', 'emerald', true);
    else add('Star', 'Brilliant', `${best}%/80%`, 'gray', false, best / 80);

    // Accuracy
    if (overallAccuracy >= 70) add('Target', 'Sharp', '70%+ acc', 'emerald', true);
    else add('Target', 'Sharp', `${overallAccuracy}%/70%`, 'gray', false, overallAccuracy / 70);

    // Streak
    if (streak >= 7) add('Flame', 'On Fire', '7d streak', 'orange', true);
    else add('Flame', 'On Fire', `${streak}/7d`, 'gray', false, streak / 7);

    // Creator
    if (createdTests.length >= 5) add('PlusCircle', 'Creator', '5+ made', 'indigo', true);
    else add('PlusCircle', 'Creator', `${createdTests.length}/5`, 'gray', false, createdTests.length / 5);

    return list;
  }, [totalQuestions, allCompletedAttempts, overallAccuracy, streak, createdTests]);

  // ════════════════════════════════════════════
  //  RETURN EVERYTHING
  // ════════════════════════════════════════════
  return {
    // Core state
    questionStats, testStats, attemptStats,
    recentAttempts, allAttempts, allCompletedAttempts, createdTests,
    loading, refreshing, lastRefresh, refresh,

    // Basic stats
    paper1Units, paper2Units, paper1Count, paper2Count, totalQuestions,
    overallAccuracy, overallAvgScore,

    // Paper-wise
    paper1Attempts, paper2Attempts,
    paper1Tests, paper2Tests, combinedTests,
    paper1Accuracy, paper2Accuracy,
    paper1AvgScore, paper2AvgScore,

    // Trends
    scoreTrend, paper1Trend, paper2Trend,
    trendDirection, paper1TrendDir, paper2TrendDir,
    predictedScore, paper1Predicted, paper2Predicted,

    // Tests
    notAttemptedTests, paper1NotAttempted, paper2NotAttempted,
    needsAttentionTests,

    // Charts
    difficultyData, questionTypeData, topicPerformance,
    activityMap, streak, longestStreak, weeklyComparison, achievements,

    // 🆕 JRF Probability
    jrfProbability,

    // 🆕 Dynamic Goals
    examDate, setExamDate, daysUntilExam,
    customTargets, updateCustomTargets,
    autoGeneratedGoals, goalCompletionPct,
    todayActivity,

    // 🆕 Syllabus Coverage
    syllabusCoverage,

    // 🆕 Speed Analytics
    speedAnalytics,

    // 🆕 Error Patterns
    errorPatterns,

    // 🆕 Study Recommendations
    studyRecommendations,

    // 🆕 Score Distribution
    scoreDistribution,

    // 🆕 Personal Records
    personalRecords,

    // 🆕 Time of Day
    timeOfDayAnalysis,

    // 🆕 Exam countdown
    daysUntilExam,
  };
};

export default useDashboard;