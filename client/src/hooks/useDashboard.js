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
        attemptService.getRecentAttempts(10),
        attemptService.getAttempts({ status: 'completed', limit: 50 }),
        testService.getTests({ limit: 50 }),
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

  // ── Derived: Paper stats ──
  const paper1Units = useMemo(() =>
    questionStats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], [questionStats]);
  const paper2Units = useMemo(() =>
    questionStats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], [questionStats]);
  const paper1Count = useMemo(() => paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() => paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);
  const totalQuestions = questionStats?.total || 0;

  // ── Derived: Accuracy ──
  const overallAccuracy = useMemo(() => {
    if (!recentAttempts.length) return 0;
    const tc = recentAttempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tq = recentAttempts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return tq > 0 ? Math.round((tc / tq) * 100) : 0;
  }, [recentAttempts]);

  // ── Derived: Score Trend ──
  const scoreTrend = useMemo(() => {
    const sorted = [...recentAttempts]
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10);
    return sorted.map((a, i) => ({
      name: `T${i + 1}`,
      score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
      accuracy: (() => {
        const t = (a.correctCount || 0) + (a.wrongCount || 0);
        return t > 0 ? Math.round((a.correctCount / t) * 100) : 0;
      })(),
      date: a.completedAt,
      title: a.testId?.title || `Test ${i + 1}`,
    }));
  }, [recentAttempts]);

  // ── Derived: Trend direction ──
  const trendDirection = useMemo(() => {
    if (scoreTrend.length < 2) return 'neutral';
    const half = Math.floor(scoreTrend.length / 2);
    const older = scoreTrend.slice(0, half);
    const newer = scoreTrend.slice(half);
    const avgOld = older.reduce((s, d) => s + d.score, 0) / (older.length || 1);
    const avgNew = newer.reduce((s, d) => s + d.score, 0) / (newer.length || 1);
    if (avgNew > avgOld + 3) return 'up';
    if (avgNew < avgOld - 3) return 'down';
    return 'neutral';
  }, [scoreTrend]);

  // ── Derived: Predicted score ──
  const predictedScore = useMemo(() => {
    if (scoreTrend.length < 3) return null;
    const n = scoreTrend.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = scoreTrend.reduce((s, d) => s + d.score, 0);
    const sumXY = scoreTrend.reduce((s, d, i) => s + i * d.score, 0);
    const sumX2 = scoreTrend.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predicted = Math.round(slope * n + intercept);
    return Math.max(0, Math.min(100, predicted));
  }, [scoreTrend]);

  // ── Derived: Difficulty distribution ──
  const difficultyData = useMemo(() => {
    const bd = questionStats?.byDifficulty;
    if (!bd) return [];
    return [
      { name: 'Easy', value: bd.easy || 0, color: '#22c55e' },
      { name: 'Medium', value: bd.medium || 0, color: '#f59e0b' },
      { name: 'Hard', value: bd.hard || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [questionStats]);

  // ── Derived: Question type data ──
  const questionTypeData = useMemo(() => {
    const bt = questionStats?.byType;
    if (!bt || typeof bt !== 'object') return [];
    return Object.entries(bt)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        pct: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0,
      }));
  }, [questionStats, totalQuestions]);

  // ── Derived: Topic analysis (from attempts) ──
  const topicPerformance = useMemo(() => {
    const map = {};
    const attempts = allAttempts.length > 0 ? allAttempts : recentAttempts;
    attempts.forEach(a => {
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
        fullMark: 100,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [allAttempts, recentAttempts]);

  // ── Derived: Activity heat map data ──
  const activityMap = useMemo(() => {
    const map = {};
    const attempts = allAttempts.length > 0 ? allAttempts : recentAttempts;
    attempts.forEach(a => {
      const d = new Date(a.completedAt || a.createdAt);
      const key = d.toISOString().split('T')[0];
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [allAttempts, recentAttempts]);

  // ── Derived: Streak ──
  const streak = useMemo(() => {
    const dates = Object.keys(activityMap).sort().reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (activityMap[key]) count++;
      else if (i > 0) break;
    }
    return count;
  }, [activityMap]);

  // ── Derived: Weekly comparison ──
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const attempts = allAttempts.length > 0 ? allAttempts : recentAttempts;
    const thisWeek = attempts.filter(a => new Date(a.completedAt) >= thisWeekStart);
    const lastWeek = attempts.filter(a => {
      const d = new Date(a.completedAt);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    const avgScore = (arr) => {
      if (!arr.length) return 0;
      return Math.round(arr.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / arr.length);
    };

    return {
      thisWeek: { tests: thisWeek.length, avgScore: avgScore(thisWeek) },
      lastWeek: { tests: lastWeek.length, avgScore: avgScore(lastWeek) },
      change: thisWeek.length - lastWeek.length,
      scoreChange: avgScore(thisWeek) - avgScore(lastWeek),
    };
  }, [allAttempts, recentAttempts]);

  // ── Derived: Achievements ──
  const achievements = useMemo(() => {
    const list = [];
    const totalAttempts = recentAttempts.length + (allAttempts.length > recentAttempts.length ? allAttempts.length - recentAttempts.length : 0);
    const bestScore = recentAttempts.length > 0
      ? Math.max(...recentAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0))
      : 0;

    const add = (icon, label, desc, color, unlocked, progress) =>
      list.push({ icon, label, desc, color, unlocked, progress });

    // Question milestones
    if (totalQuestions >= 100) add('Layers', 'Century', '100+ Qs', 'amber', true);
    else add('Layers', 'Century', `${totalQuestions}/100`, 'gray', false, totalQuestions / 100);

    if (totalQuestions >= 500) add('Crown', 'Massive', '500+ Qs', 'purple', true);
    else if (totalQuestions >= 100) add('Crown', 'Massive', `${totalQuestions}/500`, 'gray', false, totalQuestions / 500);

    // Test milestones
    if (totalAttempts >= 1) add('Play', 'Starter', '1st test', 'blue', true);
    else add('Play', 'Starter', '0/1 test', 'gray', false, 0);

    if (totalAttempts >= 10) add('Flame', 'Dedicated', '10+ tests', 'orange', true);
    else add('Flame', 'Dedicated', `${totalAttempts}/10`, 'gray', false, totalAttempts / 10);

    // Score milestones
    if (bestScore >= 90) add('Medal', 'Expert', '90%+ score', 'amber', true);
    else if (bestScore >= 80) add('Star', 'Brilliant', '80%+ score', 'emerald', true);
    else add('Star', 'Brilliant', `Best: ${bestScore}%`, 'gray', false, bestScore / 80);

    // Accuracy
    if (overallAccuracy >= 70) add('Target', 'Sharp', '70%+ acc', 'emerald', true);
    else add('Target', 'Sharp', `${overallAccuracy}%/70%`, 'gray', false, overallAccuracy / 70);

    // Streak
    if (streak >= 7) add('Flame', 'On Fire', '7 day streak', 'orange', true);
    else add('Flame', 'On Fire', `${streak}/7 days`, 'gray', false, streak / 7);

    // Creator
    const tc = createdTests.length;
    if (tc >= 5) add('PlusCircle', 'Creator', '5+ tests made', 'indigo', true);
    else add('PlusCircle', 'Creator', `${tc}/5 made`, 'gray', false, tc / 5);

    return list;
  }, [totalQuestions, recentAttempts, allAttempts, overallAccuracy, streak, createdTests]);

  return {
    // Raw data
    questionStats, testStats, attemptStats,
    recentAttempts, allAttempts, createdTests,
    // Loading
    loading, refreshing, lastRefresh, refresh,
    // Paper
    paper1Units, paper2Units, paper1Count, paper2Count, totalQuestions,
    // Metrics
    overallAccuracy, scoreTrend, trendDirection, predictedScore,
    difficultyData, questionTypeData, topicPerformance,
    activityMap, streak, weeklyComparison, achievements,
  };
};

export default useDashboard;