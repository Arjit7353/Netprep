import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import questionService from '../services/questionService';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

const useDashboard = () => {
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

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [qStats, tStats, aStats, recent, allAtt, tests] = await Promise.allSettled([
        questionService.getStats(),
        testService.getStats(),
        attemptService.getStats(),
        attemptService.getRecentAttempts(20),
        attemptService.getAttempts({ status: 'completed', limit: 100 }),
        testService.getTests({ limit: 100 }),
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

  // Paper units
  const paper1Units = useMemo(() => questionStats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], [questionStats]);
  const paper2Units = useMemo(() => questionStats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], [questionStats]);
  const paper1Count = useMemo(() => paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() => paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);
  const totalQuestions = questionStats?.total || 0;

  // Overall accuracy
  const overallAccuracy = useMemo(() => {
    if (!recentAttempts.length) return 0;
    const tc = recentAttempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tq = recentAttempts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return tq > 0 ? Math.round((tc / tq) * 100) : 0;
  }, [recentAttempts]);

  // ── PAPER-WISE ATTEMPTS ──
  const allCompletedAttempts = useMemo(() => {
    const a = allAttempts.length > 0 ? allAttempts : recentAttempts;
    return a.filter(at => at.status === 'completed' || at.completedAt);
  }, [allAttempts, recentAttempts]);

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

  // ── PAPER-WISE SCORE TREND ──
  const buildTrend = (attempts) => {
    return [...attempts]
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10)
      .map((a, i) => ({
        name: `T${i + 1}`,
        score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
        accuracy: (() => {
          const t = (a.correctCount || 0) + (a.wrongCount || 0);
          return t > 0 ? Math.round((a.correctCount / t) * 100) : 0;
        })(),
        date: a.completedAt,
        title: a.testId?.title || `Test ${i + 1}`,
      }));
  };

  const scoreTrend = useMemo(() => buildTrend(allCompletedAttempts), [allCompletedAttempts]);
  const paper1Trend = useMemo(() => buildTrend(paper1Attempts), [paper1Attempts]);
  const paper2Trend = useMemo(() => buildTrend(paper2Attempts), [paper2Attempts]);

  // Trend direction calculator
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

  // ── PAPER-WISE ACCURACY ──
  const calcAccuracy = (attempts) => {
    if (!attempts.length) return 0;
    const tc = attempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tq = attempts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return tq > 0 ? Math.round((tc / tq) * 100) : 0;
  };
  const paper1Accuracy = useMemo(() => calcAccuracy(paper1Attempts), [paper1Attempts]);
  const paper2Accuracy = useMemo(() => calcAccuracy(paper2Attempts), [paper2Attempts]);

  // ── PAPER-WISE AVG SCORE ──
  const calcAvgScore = (attempts) => {
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((s, a) =>
      s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length);
  };
  const paper1AvgScore = useMemo(() => calcAvgScore(paper1Attempts), [paper1Attempts]);
  const paper2AvgScore = useMemo(() => calcAvgScore(paper2Attempts), [paper2Attempts]);

  // ── NOT ATTEMPTED TESTS ──
  const notAttemptedTests = useMemo(() => {
    const attemptedTestIds = new Set(allCompletedAttempts.map(a => a.testId?._id?.toString() || a.testId?.toString()));
    return createdTests.filter(t => !attemptedTestIds.has(t._id?.toString()));
  }, [createdTests, allCompletedAttempts]);

  const paper1NotAttempted = useMemo(() => notAttemptedTests.filter(t => t.paper === 'paper1'), [notAttemptedTests]);
  const paper2NotAttempted = useMemo(() => notAttemptedTests.filter(t => t.paper === 'paper2'), [notAttemptedTests]);

  // ── NEEDS ATTENTION TESTS (low score < 50%) ──
  const needsAttentionTests = useMemo(() => {
    const testScoreMap = {};
    allCompletedAttempts.forEach(a => {
      const tid = a.testId?._id?.toString() || a.testId?.toString();
      if (!tid) return;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (!testScoreMap[tid] || pct > testScoreMap[tid].bestScore) {
        testScoreMap[tid] = {
          testId: tid,
          test: a.testId,
          bestScore: pct,
          attempts: (testScoreMap[tid]?.attempts || 0) + 1,
          lastAttempt: a,
          grade: pct,
        };
      } else {
        testScoreMap[tid].attempts += 1;
      }
    });
    return Object.values(testScoreMap)
      .filter(t => t.bestScore < 50)
      .sort((a, b) => a.bestScore - b.bestScore);
  }, [allCompletedAttempts]);

  // ── PREDICTION ──
  const predictScore = (data) => {
    if (data.length < 3) return null;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((s, d) => s + d.score, 0);
    const sumXY = data.reduce((s, d, i) => s + i * d.score, 0);
    const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return Math.max(0, Math.min(100, Math.round(slope * n + intercept)));
  };
  const predictedScore = useMemo(() => predictScore(scoreTrend), [scoreTrend]);
  const paper1Predicted = useMemo(() => predictScore(paper1Trend), [paper1Trend]);
  const paper2Predicted = useMemo(() => predictScore(paper2Trend), [paper2Trend]);

  // ── DIFFICULTY DATA ──
  const difficultyData = useMemo(() => {
    const bd = questionStats?.byDifficulty;
    if (!bd) return [];
    return [
      { name: 'Easy', value: bd.easy || 0, color: '#22c55e' },
      { name: 'Medium', value: bd.medium || 0, color: '#f59e0b' },
      { name: 'Hard', value: bd.hard || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [questionStats]);

  // ── QUESTION TYPE DATA ──
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

  // ── TOPIC PERFORMANCE ──
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
      .map(t => ({ ...t, accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0, fullMark: 100 }))
      .sort((a, b) => b.total - a.total).slice(0, 8);
  }, [allCompletedAttempts]);

  // ── ACTIVITY MAP ──
  const activityMap = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      const k = new Date(a.completedAt || a.createdAt).toISOString().split('T')[0];
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [allCompletedAttempts]);

  // ── STREAK ──
  const streak = useMemo(() => {
    const dates = Object.keys(activityMap).sort().reverse();
    if (!dates.length) return 0;
    let count = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (activityMap[d.toISOString().split('T')[0]]) count++;
      else if (i > 0) break;
    }
    return count;
  }, [activityMap]);

  // ── WEEKLY COMPARISON ──
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const twStart = new Date(now); twStart.setDate(now.getDate() - now.getDay()); twStart.setHours(0, 0, 0, 0);
    const lwStart = new Date(twStart); lwStart.setDate(lwStart.getDate() - 7);
    const tw = allCompletedAttempts.filter(a => new Date(a.completedAt) >= twStart);
    const lw = allCompletedAttempts.filter(a => { const d = new Date(a.completedAt); return d >= lwStart && d < twStart; });
    const avg = (arr) => !arr.length ? 0 : Math.round(arr.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / arr.length);
    return { thisWeek: { tests: tw.length, avgScore: avg(tw) }, lastWeek: { tests: lw.length, avgScore: avg(lw) }, change: tw.length - lw.length, scoreChange: avg(tw) - avg(lw) };
  }, [allCompletedAttempts]);

  // ── ACHIEVEMENTS ──
  const achievements = useMemo(() => {
    const list = [];
    const ta = allCompletedAttempts.length;
    const best = ta > 0 ? Math.max(...allCompletedAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0)) : 0;
    const add = (icon, label, desc, color, unlocked, progress) => list.push({ icon, label, desc, color, unlocked, progress });

    if (totalQuestions >= 100) add('Layers', 'Century', '100+ Qs', 'amber', true);
    else add('Layers', 'Century', `${totalQuestions}/100`, 'gray', false, totalQuestions / 100);
    if (totalQuestions >= 500) add('Crown', 'Massive', '500+ Qs', 'purple', true);
    else if (totalQuestions >= 100) add('Crown', 'Massive', `${totalQuestions}/500`, 'gray', false, totalQuestions / 500);
    if (ta >= 1) add('Play', 'Starter', '1st test', 'blue', true);
    else add('Play', 'Starter', '0/1', 'gray', false, 0);
    if (ta >= 10) add('Flame', 'Dedicated', '10+ tests', 'orange', true);
    else add('Flame', 'Dedicated', `${ta}/10`, 'gray', false, ta / 10);
    if (best >= 90) add('Medal', 'Expert', '90%+', 'amber', true);
    else if (best >= 80) add('Star', 'Brilliant', '80%+', 'emerald', true);
    else add('Star', 'Brilliant', `${best}%/80%`, 'gray', false, best / 80);
    if (overallAccuracy >= 70) add('Target', 'Sharp', '70%+ acc', 'emerald', true);
    else add('Target', 'Sharp', `${overallAccuracy}%/70%`, 'gray', false, overallAccuracy / 70);
    if (streak >= 7) add('Flame', 'On Fire', '7d streak', 'orange', true);
    else add('Flame', 'On Fire', `${streak}/7d`, 'gray', false, streak / 7);
    if (createdTests.length >= 5) add('PlusCircle', 'Creator', '5+ made', 'indigo', true);
    else add('PlusCircle', 'Creator', `${createdTests.length}/5`, 'gray', false, createdTests.length / 5);

    return list;
  }, [totalQuestions, allCompletedAttempts, overallAccuracy, streak, createdTests]);

  return {
    questionStats, testStats, attemptStats,
    recentAttempts, allAttempts, allCompletedAttempts, createdTests,
    loading, refreshing, lastRefresh, refresh,
    paper1Units, paper2Units, paper1Count, paper2Count, totalQuestions,
    overallAccuracy,
    // Paper-wise attempts
    paper1Attempts, paper2Attempts,
    paper1Tests, paper2Tests, combinedTests,
    paper1Accuracy, paper2Accuracy,
    paper1AvgScore, paper2AvgScore,
    // Paper-wise trends
    scoreTrend, paper1Trend, paper2Trend,
    trendDirection, paper1TrendDir, paper2TrendDir,
    predictedScore, paper1Predicted, paper2Predicted,
    // Not attempted & needs attention
    notAttemptedTests, paper1NotAttempted, paper2NotAttempted,
    needsAttentionTests,
    // Charts
    difficultyData, questionTypeData, topicPerformance,
    activityMap, streak, weeklyComparison, achievements,
  };
};

export default useDashboard;