// client/src/hooks/useDashboard.js
// ═══════════════════════════════════════════════════════════════
//  NETPREP ULTIMATE DASHBOARD HOOK - V3 (Enhanced + All Features)
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import questionService from '../services/questionService';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

// ════════════════════════════════════════════════════════════
//  CONSTANTS
// ════════════════════════════════════════════════════════════
const PAPER1_UNITS = ['UNIT I','UNIT II','UNIT III','UNIT IV','UNIT V','UNIT VI','UNIT VII','UNIT VIII','UNIT IX','UNIT X'];
const PAPER1_UNIT_NAMES = {
  'UNIT I':'Teaching Aptitude','UNIT II':'Research Aptitude','UNIT III':'Comprehension',
  'UNIT IV':'Communication','UNIT V':'Mathematical Reasoning','UNIT VI':'Logical Reasoning',
  'UNIT VII':'Data Interpretation','UNIT VIII':'ICT','UNIT IX':'Environment','UNIT X':'Higher Education'
};
const PAPER2_UNITS = ['UNIT I','UNIT II','UNIT III','UNIT IV','UNIT V','UNIT VI','UNIT VII','UNIT VIII','UNIT IX','UNIT X'];
const PAPER2_UNIT_NAMES = {
  'UNIT I':'Sources & Pre-History','UNIT II':'Mauryan to Gupta','UNIT III':'Early Medieval',
  'UNIT IV':'Medieval Political','UNIT V':'Administration & Economy','UNIT VI':'Society & Culture',
  'UNIT VII':'British Power','UNIT VIII':'Colonial Economy','UNIT IX':'National Movement','UNIT X':'Historiography'
};
const JRF_CUTOFF = 80, NET_CUTOFF = 70;

// SRS intervals in days based on score percentage
const SRS_INTERVALS = [
  { maxScore: 30, interval: 1, label: 'Critical', color: '#ef4444' },
  { maxScore: 50, interval: 3, label: 'Weak', color: '#f97316' },
  { maxScore: 70, interval: 7, label: 'Learning', color: '#eab308' },
  { maxScore: 85, interval: 14, label: 'Good', color: '#3b82f6' },
  { maxScore: 100, interval: 30, label: 'Mastered', color: '#22c55e' },
];

const getSRSInterval = (score) => {
  for (const s of SRS_INTERVALS) { if (score <= s.maxScore) return s; }
  return SRS_INTERVALS[SRS_INTERVALS.length - 1];
};

// ════════════════════════════════════════════════════════════
//  STORAGE UTILITIES (Enhanced with validation)
// ════════════════════════════════════════════════════════════
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      const parsed = JSON.parse(item);
      // Validate expiry if exists
      if (parsed._expiry && Date.now() > parsed._expiry) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      return parsed._value !== undefined ? parsed._value : parsed;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value, expiryDays = null) => {
    try {
      const item = expiryDays 
        ? { _value: value, _expiry: Date.now() + (expiryDays * 86400000) }
        : value;
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    try { localStorage.removeItem(key); return true; } catch { return false; }
  }
};

// ════════════════════════════════════════════════════════════
//  MAIN HOOK
// ════════════════════════════════════════════════════════════
const useDashboard = () => {
  // Core state
  const [questionStats, setQuestionStats] = useState(null);
  const [testStats, setTestStats] = useState(null);
  const [attemptStats, setAttemptStats] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [createdTests, setCreatedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  // ════════════════════════════════════════════════════════
  //  PERSISTENT STATE (Fixed exam date persistence)
  // ════════════════════════════════════════════════════════
  const [examDate, setExamDateState] = useState(() => {
    const saved = storage.get('netprep_exam_date', '');
    // Validate date
    if (saved && !isNaN(new Date(saved).getTime())) {
      return saved;
    }
    return '';
  });

  const [customTargets, setCustomTargets] = useState(() => {
    return storage.get('netprep_custom_targets', {
      dailyTests: 3,
      dailyAccuracy: 70,
      weeklyTests: 15,
      targetScore: 75,
      dailyStudyHours: 4,
      weakTopicRetries: 2
    });
  });

  const [studyPreferences, setStudyPreferences] = useState(() => {
    return storage.get('netprep_study_prefs', {
      preferredTime: 'morning',
      focusUnits: [],
      notifications: true,
      showHindi: false
    });
  });

  const [goalHistory, setGoalHistoryState] = useState(() => {
    return storage.get('netprep_goal_history', {});
  });

  const [sessionData, setSessionData] = useState(() => {
    return storage.get('netprep_session', {
      startTime: Date.now(),
      testsInSession: 0,
      correctInSession: 0,
      wrongInSession: 0
    });
  });

  // ════════════════════════════════════════════════════════
  //  SETTERS WITH PERSISTENCE
  // ════════════════════════════════════════════════════════
  const setExamDate = useCallback((date) => {
    if (date && !isNaN(new Date(date).getTime())) {
      setExamDateState(date);
      storage.set('netprep_exam_date', date, 365); // Save for 1 year
    } else if (!date) {
      setExamDateState('');
      storage.remove('netprep_exam_date');
    }
  }, []);

  const updateCustomTargets = useCallback((targets) => {
    const newTargets = { ...customTargets, ...targets };
    setCustomTargets(newTargets);
    storage.set('netprep_custom_targets', newTargets, 365);
  }, [customTargets]);

  const updateStudyPreferences = useCallback((prefs) => {
    const newPrefs = { ...studyPreferences, ...prefs };
    setStudyPreferences(newPrefs);
    storage.set('netprep_study_prefs', newPrefs, 365);
  }, [studyPreferences]);

  const updateGoalHistory = useCallback((history) => {
    setGoalHistoryState(history);
    storage.set('netprep_goal_history', history, 365);
  }, []);

  const updateSessionData = useCallback((data) => {
    const newData = { ...sessionData, ...data };
    setSessionData(newData);
    storage.set('netprep_session', newData);
  }, [sessionData]);

  // ════════════════════════════════════════════════════════
  //  §1 DATA FETCHING (Enhanced with error handling)
  // ════════════════════════════════════════════════════════
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    
    try {
      const [qS, tS, aS, rec, allA, tests] = await Promise.allSettled([
        questionService.getStats(),
        testService.getStats(),
        attemptService.getStats(),
        attemptService.getRecentAttempts(100),
        attemptService.getAttempts({ status: 'completed', limit: 1000 }),
        testService.getTests({ limit: 1000 }),
      ]);

      const errors = [];
      
      if (qS.status === 'fulfilled') setQuestionStats(qS.value?.data || null);
      else errors.push('questions');
      
      if (tS.status === 'fulfilled') setTestStats(tS.value?.data || null);
      else errors.push('tests');
      
      if (aS.status === 'fulfilled') setAttemptStats(aS.value?.data || null);
      else errors.push('attempts');
      
      if (rec.status === 'fulfilled') setRecentAttempts(rec.value?.data || []);
      
      if (allA.status === 'fulfilled') {
        const d = allA.value?.data;
        setAllAttempts(Array.isArray(d) ? d : d?.attempts || []);
      }
      
      if (tests.status === 'fulfilled') {
        const d = tests.value?.data;
        setCreatedTests(Array.isArray(d) ? d : d?.tests || []);
      }
      
      if (errors.length > 0) {
        setError(`Failed to load: ${errors.join(', ')}`);
      }
      
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
      setError('Failed to load dashboard data');
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

  // ════════════════════════════════════════════════════════
  //  §2 BASIC COMPUTED VALUES
  // ════════════════════════════════════════════════════════
  const paper1Units = useMemo(() => 
    questionStats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], 
    [questionStats]
  );
  const paper2Units = useMemo(() => 
    questionStats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], 
    [questionStats]
  );
  const paper1Count = useMemo(() => paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() => paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);
  const totalQuestions = questionStats?.total || 0;

  const allCompletedAttempts = useMemo(() => {
    const a = allAttempts.length > 0 ? allAttempts : recentAttempts;
    return a.filter(at => at.status === 'completed' || at.completedAt)
      .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
  }, [allAttempts, recentAttempts]);

  const paper1Attempts = useMemo(() => 
    allCompletedAttempts.filter(a => a.testId?.paper === 'paper1'), 
    [allCompletedAttempts]
  );
  const paper2Attempts = useMemo(() => 
    allCompletedAttempts.filter(a => a.testId?.paper === 'paper2'), 
    [allCompletedAttempts]
  );
  const paper1Tests = useMemo(() => createdTests.filter(t => t.paper === 'paper1'), [createdTests]);
  const paper2Tests = useMemo(() => createdTests.filter(t => t.paper === 'paper2'), [createdTests]);
  const combinedTests = useMemo(() => createdTests.filter(t => t.paper === 'combined' || !t.paper), [createdTests]);

  // ════════════════════════════════════════════════════════
  //  §3 ACCURACY & SCORE CALCULATIONS
  // ════════════════════════════════════════════════════════
  const calcStats = useCallback((attempts) => {
    if (!attempts.length) return { accuracy: 0, avgScore: 0, totalCorrect: 0, totalWrong: 0, totalSkipped: 0 };
    
    let totalCorrect = 0, totalWrong = 0, totalSkipped = 0, totalScore = 0, totalMarks = 0;
    
    attempts.forEach(a => {
      totalCorrect += a.correctCount || 0;
      totalWrong += a.wrongCount || 0;
      totalSkipped += a.skippedCount || 0;
      totalScore += a.score || 0;
      totalMarks += a.totalMarks || 0;
    });
    
    const attempted = totalCorrect + totalWrong;
    const accuracy = attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;
    const avgScore = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    
    return { accuracy, avgScore, totalCorrect, totalWrong, totalSkipped };
  }, []);

  const overallStats = useMemo(() => calcStats(allCompletedAttempts), [allCompletedAttempts, calcStats]);
  const paper1Stats = useMemo(() => calcStats(paper1Attempts), [paper1Attempts, calcStats]);
  const paper2Stats = useMemo(() => calcStats(paper2Attempts), [paper2Attempts, calcStats]);

  const overallAccuracy = overallStats.accuracy;
  const overallAvgScore = overallStats.avgScore;
  const paper1Accuracy = paper1Stats.accuracy;
  const paper2Accuracy = paper2Stats.accuracy;
  const paper1AvgScore = paper1Stats.avgScore;
  const paper2AvgScore = paper2Stats.avgScore;

  // ════════════════════════════════════════════════════════
  //  §4 🆕 PROGRESS TRACKER (Low to High Score Sorted)
  // ════════════════════════════════════════════════════════
  const progressTracker = useMemo(() => {
    const testMap = new Map();
    
    // Group attempts by test
    allCompletedAttempts.forEach(a => {
      const tid = (a.testId?._id || a.testId)?.toString();
      if (!tid) return;
      
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const accuracy = (() => {
        const total = (a.correctCount || 0) + (a.wrongCount || 0);
        return total > 0 ? Math.round((a.correctCount / total) * 100) : 0;
      })();
      
      if (!testMap.has(tid)) {
        testMap.set(tid, {
          testId: tid,
          test: a.testId,
          title: a.testId?.title || 'Unknown Test',
          paper: a.testId?.paper,
          unit: a.testId?.unit,
          testType: a.testId?.testType,
          attempts: [],
          bestScore: pct,
          worstScore: pct,
          lastScore: pct,
          firstScore: pct,
          totalAttempts: 0,
          lastAttempt: a,
          firstAttempt: a,
          lastDate: a.completedAt,
          improvement: 0,
          trend: 'stable',
          avgAccuracy: accuracy,
        });
      }
      
      const entry = testMap.get(tid);
      entry.attempts.push({ score: pct, accuracy, date: a.completedAt, attemptId: a._id });
      entry.totalAttempts += 1;
      entry.bestScore = Math.max(entry.bestScore, pct);
      entry.worstScore = Math.min(entry.worstScore, pct);
      
      if (new Date(a.completedAt) > new Date(entry.lastDate)) {
        entry.lastDate = a.completedAt;
        entry.lastScore = pct;
        entry.lastAttempt = a;
      }
      if (new Date(a.completedAt) < new Date(entry.firstAttempt.completedAt)) {
        entry.firstScore = pct;
        entry.firstAttempt = a;
      }
    });
    
    // Calculate trends and improvements
    testMap.forEach(entry => {
      entry.attempts.sort((a, b) => new Date(a.date) - new Date(b.date));
      entry.improvement = entry.lastScore - entry.firstScore;
      entry.avgAccuracy = entry.attempts.length > 0 
        ? Math.round(entry.attempts.reduce((s, a) => s + a.accuracy, 0) / entry.attempts.length)
        : 0;
      
      if (entry.attempts.length >= 2) {
        const recent = entry.attempts.slice(-3);
        const older = entry.attempts.slice(0, Math.max(1, entry.attempts.length - 3));
        const recentAvg = recent.reduce((s, a) => s + a.score, 0) / recent.length;
        const olderAvg = older.reduce((s, a) => s + a.score, 0) / older.length;
        
        entry.trend = recentAvg > olderAvg + 5 ? 'improving' 
          : recentAvg < olderAvg - 5 ? 'declining' 
          : 'stable';
      }
      
      // SRS data
      const srs = getSRSInterval(entry.bestScore);
      entry.srsInterval = srs.interval;
      entry.srsLabel = srs.label;
      entry.srsColor = srs.color;
      
      // Days since last attempt
      entry.daysSinceLastAttempt = Math.floor(
        (Date.now() - new Date(entry.lastDate).getTime()) / 86400000
      );
      
      // Next revision date
      const nextRevision = new Date(entry.lastDate);
      nextRevision.setDate(nextRevision.getDate() + srs.interval);
      entry.nextRevisionDate = nextRevision.toISOString().split('T')[0];
      entry.isOverdue = nextRevision < new Date();
      
      // Priority score for sorting
      let priority = 0;
      priority += Math.max(0, 100 - entry.bestScore); // Lower score = higher priority
      if (entry.isOverdue) priority += entry.daysSinceLastAttempt * 2;
      if (entry.trend === 'declining') priority += 25;
      entry.priorityScore = Math.min(100, priority);
    });
    
    const allTests = Array.from(testMap.values());
    
    // Sort from lowest to highest score
    const sortedByScore = [...allTests].sort((a, b) => a.bestScore - b.bestScore);
    
    // Categories
    const critical = sortedByScore.filter(t => t.bestScore < 40);
    const weak = sortedByScore.filter(t => t.bestScore >= 40 && t.bestScore < 60);
    const average = sortedByScore.filter(t => t.bestScore >= 60 && t.bestScore < 75);
    const good = sortedByScore.filter(t => t.bestScore >= 75 && t.bestScore < 90);
    const excellent = sortedByScore.filter(t => t.bestScore >= 90);
    
    // Tests needing immediate attention (sorted by priority)
    const needsAttention = [...allTests]
      .filter(t => t.bestScore < 60 || t.isOverdue || t.trend === 'declining')
      .sort((a, b) => b.priorityScore - a.priorityScore);
    
    // Improving tests
    const improving = allTests.filter(t => t.improvement > 10 && t.totalAttempts >= 2);
    
    // Declining tests
    const declining = allTests.filter(t => t.trend === 'declining');
    
    // Overdue revisions
    const overdue = allTests.filter(t => t.isOverdue).sort((a, b) => 
      b.daysSinceLastAttempt - a.daysSinceLastAttempt
    );
    
    // Stats
    const stats = {
      totalTracked: allTests.length,
      critical: critical.length,
      weak: weak.length,
      average: average.length,
      good: good.length,
      excellent: excellent.length,
      improving: improving.length,
      declining: declining.length,
      overdue: overdue.length,
      avgScore: allTests.length > 0 
        ? Math.round(allTests.reduce((s, t) => s + t.bestScore, 0) / allTests.length) 
        : 0,
      avgImprovement: improving.length > 0
        ? Math.round(improving.reduce((s, t) => s + t.improvement, 0) / improving.length)
        : 0,
    };
    
    return {
      all: allTests,
      sortedByScore,
      critical,
      weak,
      average,
      good,
      excellent,
      needsAttention,
      improving,
      declining,
      overdue,
      stats,
      
      // Helper to get next test to retry
      getNextToRetry: () => needsAttention[0] || critical[0] || weak[0] || null,
      
      // Get tests by score range
      getByScoreRange: (min, max) => sortedByScore.filter(t => t.bestScore >= min && t.bestScore < max),
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  §5 SCORE TRENDS & PREDICTIONS (Enhanced)
  // ════════════════════════════════════════════════════════
  const buildTrend = useCallback((attempts, limit = 20) => {
    return [...attempts]
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-limit)
      .map((a, i) => {
        const total = (a.correctCount || 0) + (a.wrongCount || 0);
        return {
          name: `T${i + 1}`,
          index: i,
          score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
          accuracy: total > 0 ? Math.round((a.correctCount / total) * 100) : 0,
          date: a.completedAt,
          dateFormatted: new Date(a.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          title: a.testId?.title || `Test ${i + 1}`,
          paper: a.testId?.paper,
          unit: a.testId?.unit,
          timeTaken: a.totalTimeTaken || 0,
          correct: a.correctCount || 0,
          wrong: a.wrongCount || 0,
          skipped: a.skippedCount || 0,
          attemptId: a._id,
        };
      });
  }, []);

  const scoreTrend = useMemo(() => buildTrend(allCompletedAttempts), [allCompletedAttempts, buildTrend]);
  const paper1Trend = useMemo(() => buildTrend(paper1Attempts), [paper1Attempts, buildTrend]);
  const paper2Trend = useMemo(() => buildTrend(paper2Attempts), [paper2Attempts, buildTrend]);

  const calcTrendDirection = useCallback((data) => {
    if (data.length < 2) return 'neutral';
    const half = Math.floor(data.length / 2);
    const avgOld = data.slice(0, half).reduce((s, d) => s + d.score, 0) / (half || 1);
    const avgNew = data.slice(half).reduce((s, d) => s + d.score, 0) / ((data.length - half) || 1);
    const diff = avgNew - avgOld;
    return diff > 5 ? 'up' : diff < -5 ? 'down' : 'neutral';
  }, []);

  const trendDirection = useMemo(() => calcTrendDirection(scoreTrend), [scoreTrend, calcTrendDirection]);
  const paper1TrendDir = useMemo(() => calcTrendDirection(paper1Trend), [paper1Trend, calcTrendDirection]);
  const paper2TrendDir = useMemo(() => calcTrendDirection(paper2Trend), [paper2Trend, calcTrendDirection]);

  // Linear regression for prediction
  const predictScore = useCallback((data) => {
    if (data.length < 3) return null;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    data.forEach((d, i) => {
      sumX += i;
      sumY += d.score;
      sumXY += i * d.score;
      sumX2 += i * i;
    });
    
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return null;
    
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next 3 tests
    const predictions = [1, 2, 3].map(offset => 
      Math.max(0, Math.min(100, Math.round(slope * (n + offset - 1) + intercept)))
    );
    
    return {
      next: predictions[0],
      trend: slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable',
      slope: Math.round(slope * 100) / 100,
      confidence: Math.min(100, Math.round(n * 10)), // More data = more confidence
      predictions,
    };
  }, []);

  const predictedScore = useMemo(() => predictScore(scoreTrend), [scoreTrend, predictScore]);
  const paper1Predicted = useMemo(() => predictScore(paper1Trend), [paper1Trend, predictScore]);
  const paper2Predicted = useMemo(() => predictScore(paper2Trend), [paper2Trend, predictScore]);

  // ════════════════════════════════════════════════════════
  //  §6 NOT ATTEMPTED TESTS
  // ════════════════════════════════════════════════════════
  const notAttemptedTests = useMemo(() => {
    const attemptedIds = new Set(
      allCompletedAttempts.map(a => (a.testId?._id || a.testId)?.toString())
    );
    return createdTests
      .filter(t => !attemptedIds.has(t._id?.toString()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [createdTests, allCompletedAttempts]);

  const paper1NotAttempted = useMemo(() => 
    notAttemptedTests.filter(t => t.paper === 'paper1'), 
    [notAttemptedTests]
  );
  const paper2NotAttempted = useMemo(() => 
    notAttemptedTests.filter(t => t.paper === 'paper2'), 
    [notAttemptedTests]
  );

  // Legacy compatibility
  const needsAttentionTests = useMemo(() => progressTracker.needsAttention, [progressTracker]);
  const testPerfMap = useMemo(() => {
    const map = {};
    progressTracker.all.forEach(t => { map[t.testId] = t; });
    return map;
  }, [progressTracker]);

  // ════════════════════════════════════════════════════════
  //  §7 ACTIVITY & STREAK
  // ════════════════════════════════════════════════════════
  const activityMap = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      const key = new Date(a.completedAt || a.createdAt).toISOString().split('T')[0];
      if (!map[key]) {
        map[key] = { 
          count: 0, 
          totalScore: 0, 
          totalAccuracy: 0, 
          tests: [],
          correct: 0,
          wrong: 0,
          skipped: 0,
          timeSpent: 0,
        };
      }
      map[key].count += 1;
      map[key].totalScore += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const att = (a.correctCount || 0) + (a.wrongCount || 0);
      map[key].totalAccuracy += att > 0 ? Math.round((a.correctCount / att) * 100) : 0;
      map[key].correct += a.correctCount || 0;
      map[key].wrong += a.wrongCount || 0;
      map[key].skipped += a.skippedCount || 0;
      map[key].timeSpent += a.totalTimeTaken || 0;
      map[key].tests.push(a);
    });
    
    Object.keys(map).forEach(k => {
      map[k].avgScore = map[k].count > 0 ? Math.round(map[k].totalScore / map[k].count) : 0;
      map[k].avgAccuracy = map[k].count > 0 ? Math.round(map[k].totalAccuracy / map[k].count) : 0;
    });
    
    return map;
  }, [allCompletedAttempts]);

  const streak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      
      if (activityMap[key]?.count > 0) {
        count++;
      } else if (i > 0) {
        // Allow 1 day grace period
        break;
      }
    }
    return count;
  }, [activityMap]);

  const longestStreak = useMemo(() => {
    const dates = Object.keys(activityMap).sort();
    let max = 0, current = 0, prev = null;
    
    dates.forEach(d => {
      const date = new Date(d);
      if (prev && (date - prev) / 86400000 === 1) {
        current++;
      } else {
        current = 1;
      }
      max = Math.max(max, current);
      prev = date;
    });
    
    return max;
  }, [activityMap]);

  // ════════════════════════════════════════════════════════
  //  §8 WEEKLY COMPARISON
  // ════════════════════════════════════════════════════════
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisWeek = allCompletedAttempts.filter(a => new Date(a.completedAt) >= thisWeekStart);
    const lastWeek = allCompletedAttempts.filter(a => {
      const d = new Date(a.completedAt);
      return d >= lastWeekStart && d < thisWeekStart;
    });
    
    const calcWeekStats = (attempts) => {
      if (!attempts.length) return { tests: 0, avgScore: 0, avgAccuracy: 0, totalTime: 0 };
      const stats = calcStats(attempts);
      return {
        tests: attempts.length,
        avgScore: stats.avgScore,
        avgAccuracy: stats.accuracy,
        totalTime: attempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0),
      };
    };
    
    const tw = calcWeekStats(thisWeek);
    const lw = calcWeekStats(lastWeek);
    
    return {
      thisWeek: tw,
      lastWeek: lw,
      change: tw.tests - lw.tests,
      scoreChange: tw.avgScore - lw.avgScore,
      accuracyChange: tw.avgAccuracy - lw.avgAccuracy,
      timeChange: tw.totalTime - lw.totalTime,
      improvement: tw.avgScore > lw.avgScore,
    };
  }, [allCompletedAttempts, calcStats]);

  // ════════════════════════════════════════════════════════
  //  §9 SYLLABUS COVERAGE (Enhanced)
  // ════════════════════════════════════════════════════════
  const normalizeUnit = useCallback((str) => 
    str ? str.toLowerCase().replace(/\s+/g, ' ').trim() : '', 
    []
  );

  const matchUnit = useCallback((testUnit, syllabusUnit) => {
    if (!testUnit) return false;
    const t = normalizeUnit(testUnit);
    const s = normalizeUnit(syllabusUnit);
    
    if (t === s || t.includes(s) || s.includes(t)) return true;
    
    const extractRoman = (str) => {
      const match = str.match(/unit\s*(i{1,3}|iv|v|vi{0,3}|ix|x|\d+)/i);
      return match ? match[1].toLowerCase() : '';
    };
    
    const t_roman = extractRoman(t);
    const s_roman = extractRoman(s);
    return t_roman && t_roman === s_roman;
  }, [normalizeUnit]);

  const syllabusCoverage = useMemo(() => {
    const TYPE_WEIGHTS = {
      dpp: 10, topic_test: 15, chapter_test: 25, unit_test: 35,
      practice: 20, pyq_year: 30, full_mock_p1: 20, full_mock_p2: 20,
      full_mock_combined: 15
    };

    const buildCoverage = (syllabusUnits, unitNames, paperTests, paperAttempts) => {
      const attemptedIds = new Set(
        paperAttempts.map(a => (a.testId?._id || a.testId)?.toString())
      );

      return syllabusUnits.map(unit => {
        const unitTests = paperTests.filter(t => matchUnit(t.unit, unit));
        const totalTests = unitTests.length;
        const attemptedTests = unitTests.filter(t => attemptedIds.has(t._id?.toString()));
        const attemptedCount = attemptedTests.length;
        
        // Test type breakdown
        const testTypeBreakdown = {};
        unitTests.forEach(t => {
          const type = t.testType || 'practice';
          if (!testTypeBreakdown[type]) {
            testTypeBreakdown[type] = { total: 0, attempted: 0 };
          }
          testTypeBreakdown[type].total += 1;
          if (attemptedIds.has(t._id?.toString())) {
            testTypeBreakdown[type].attempted += 1;
          }
        });
        
        // Unit attempts and performance
        const unitAttempts = paperAttempts.filter(a => matchUnit(a.testId?.unit, unit));
        const topicData = { correct: 0, wrong: 0, skipped: 0, total: 0 };
        
        paperAttempts.forEach(a => {
          (a.topicAnalysis || []).forEach(ta => {
            if (matchUnit(ta.unit, unit)) {
              topicData.correct += ta.correct || 0;
              topicData.wrong += ta.wrong || 0;
              topicData.skipped += ta.skipped || 0;
              topicData.total += ta.total || 0;
            }
          });
        });
        
        const accuracy = topicData.total > 0 
          ? Math.round((topicData.correct / topicData.total) * 100) 
          : 0;
        
        const scores = unitAttempts.map(a => 
          a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0
        );
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const avgScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
          : 0;
        
        // Coverage percentage
        let currentScore = 0, maxScore = 0;
        Object.entries(testTypeBreakdown).forEach(([type, data]) => {
          const weight = TYPE_WEIGHTS[type] || 15;
          maxScore += data.total * weight;
          currentScore += data.attempted * weight;
        });
        const coveragePct = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
        
        // Level determination
        let level = 'not_started';
        if (totalTests === 0) level = 'no_tests';
        else if (attemptedCount === 0) level = 'not_started';
        else if (coveragePct >= 80 && accuracy >= 70) level = 'mastered';
        else if (coveragePct >= 50 && accuracy >= 50) level = 'learning';
        else if (coveragePct >= 25 || attemptedCount >= 1) {
          level = accuracy < 40 ? 'weak' : 'in_progress';
        }
        
        const colorMap = {
          mastered: '#22c55e',
          learning: '#3b82f6',
          in_progress: '#f59e0b',
          weak: '#ef4444',
          not_started: '#d1d5db',
          no_tests: '#f3f4f6'
        };
        
        return {
          unit,
          name: unitNames[unit] || unit,
          totalTests,
          attemptedCount,
          pendingCount: totalTests - attemptedCount,
          testTypeBreakdown,
          accuracy,
          bestScore,
          avgScore,
          correct: topicData.correct,
          wrong: topicData.wrong,
          skipped: topicData.skipped,
          questionsAttempted: topicData.total,
          coveragePct,
          level,
          color: colorMap[level] || '#d1d5db',
          totalAttempts: unitAttempts.length,
          recentScore: scores[scores.length - 1] || 0,
        };
      });
    };

    const paper1Coverage = buildCoverage(PAPER1_UNITS, PAPER1_UNIT_NAMES, paper1Tests, paper1Attempts);
    const paper2Coverage = buildCoverage(PAPER2_UNITS, PAPER2_UNIT_NAMES, paper2Tests, paper2Attempts);

    const calcSummary = (coverage) => {
      const total = coverage.length;
      const counts = {
        mastered: 0, learning: 0, inProgress: 0, weak: 0, notStarted: 0, noTests: 0
      };
      
      coverage.forEach(c => {
        if (c.level === 'mastered') counts.mastered++;
        else if (c.level === 'learning') counts.learning++;
        else if (c.level === 'in_progress') counts.inProgress++;
        else if (c.level === 'weak') counts.weak++;
        else if (c.level === 'not_started') counts.notStarted++;
        else if (c.level === 'no_tests') counts.noTests++;
      });
      
      const achievement = coverage.reduce((sum, c) => {
        if (c.level === 'mastered') return sum + 100;
        if (c.level === 'learning') return sum + 65;
        if (c.level === 'in_progress') return sum + 35;
        if (c.level === 'weak') return sum + 15;
        return sum;
      }, 0);
      
      return {
        total,
        ...counts,
        overallPct: total > 0 ? Math.round(achievement / total) : 0,
        totalTestsCreated: coverage.reduce((s, c) => s + c.totalTests, 0),
        totalTestsAttempted: coverage.reduce((s, c) => s + c.attemptedCount, 0),
        totalTestsPending: coverage.reduce((s, c) => s + c.pendingCount, 0),
        avgAccuracy: coverage.length > 0 
          ? Math.round(coverage.reduce((s, c) => s + c.accuracy, 0) / coverage.length)
          : 0,
      };
    };

    const paper1Summary = calcSummary(paper1Coverage);
    const paper2Summary = calcSummary(paper2Coverage);

    return {
      paper1: paper1Coverage,
      paper2: paper2Coverage,
      paper1Summary,
      paper2Summary,
      overallPct: Math.round((paper1Summary.overallPct + paper2Summary.overallPct) / 2),
    };
  }, [paper1Tests, paper2Tests, paper1Attempts, paper2Attempts, matchUnit]);

  // ════════════════════════════════════════════════════════
  //  §10 JRF PROBABILITY METER (Enhanced)
  // ════════════════════════════════════════════════════════
  const jrfProbability = useMemo(() => {
    if (allCompletedAttempts.length < 3) {
      return {
        netProbability: 0,
        jrfProbability: 0,
        predictedP1: 0,
        predictedP2: 0,
        predictedTotal: 0,
        netCutoff: NET_CUTOFF,
        jrfCutoff: JRF_CUTOFF,
        confidence: 'low',
        factors: [],
        suggestions: [],
        riskLevel: 'unknown',
        consistencyScore: 0,
        dataPoints: allCompletedAttempts.length,
        p1Trend: 'neutral',
        p2Trend: 'neutral',
        readinessScore: 0,
      };
    }

    // Get recent scores
    const getRecentScores = (attempts, limit = 10) => 
      attempts
        .filter(a => a.completedAt)
        .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
        .slice(-limit)
        .map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);

    const p1Scores = getRecentScores(paper1Attempts);
    const p2Scores = getRecentScores(paper2Attempts);
    const allScores = [...p1Scores, ...p2Scores];

    // Weighted average (recent scores weighted more)
    const weightedAvg = (scores) => {
      if (!scores.length) return 0;
      let totalWeight = 0, weightedSum = 0;
      scores.forEach((score, i) => {
        const weight = 1 + (i / scores.length) * 2;
        weightedSum += score * weight;
        totalWeight += weight;
      });
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    };

    // Trend adjustment
    const trendAdjustment = (scores) => {
      if (scores.length < 3) return 0;
      const half = Math.floor(scores.length / 2);
      const recentAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
      const olderAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
      return (recentAvg - olderAvg) * 0.3;
    };

    const p1Adjusted = Math.min(100, Math.max(0, weightedAvg(p1Scores) + trendAdjustment(p1Scores)));
    const p2Adjusted = Math.min(100, Math.max(0, weightedAvg(p2Scores) + trendAdjustment(p2Scores)));
    
    const predictedP1 = Math.round(p1Adjusted);
    const predictedP2 = Math.round(p2Adjusted);
    const predictedTotal = Math.round((predictedP1 + predictedP2) / 2);

    // Standard deviation for consistency
    const stdDev = (scores) => {
      if (scores.length < 2) return 50;
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
      return Math.sqrt(variance);
    };

    const sd = stdDev(allScores);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - sd * 2)));

    // NET probability calculation
    const netGap = predictedTotal - NET_CUTOFF;
    let netProb;
    if (netGap >= 20) netProb = 95;
    else if (netGap >= 10) netProb = 75 + (netGap - 10) * 2;
    else if (netGap >= 5) netProb = 55 + (netGap - 5) * 4;
    else if (netGap >= 0) netProb = 35 + netGap * 4;
    else if (netGap >= -10) netProb = 10 + (netGap + 10) * 2.5;
    else netProb = Math.max(3, 10 + netGap);

    // JRF probability calculation
    const jrfGap = predictedTotal - JRF_CUTOFF;
    let jrfProb;
    if (jrfGap >= 15) jrfProb = 92;
    else if (jrfGap >= 8) jrfProb = 68 + (jrfGap - 8) * 3.4;
    else if (jrfGap >= 3) jrfProb = 42 + (jrfGap - 3) * 5.2;
    else if (jrfGap >= 0) jrfProb = 25 + jrfGap * 5.7;
    else if (jrfGap >= -8) jrfProb = 8 + (jrfGap + 8) * 2.1;
    else jrfProb = Math.max(2, 8 + jrfGap);

    // Consistency adjustment
    const consistencyMod = (consistencyScore - 50) / 100;
    netProb = Math.min(99, Math.max(1, Math.round(netProb + consistencyMod * 10)));
    jrfProb = Math.min(99, Math.max(1, Math.round(jrfProb + consistencyMod * 10)));

    // Coverage adjustment
    const coveragePct = syllabusCoverage.overallPct || 0;
    if (coveragePct >= 70) {
      netProb = Math.min(99, netProb + 3);
      jrfProb = Math.min(99, jrfProb + 2);
    } else if (coveragePct < 30) {
      netProb = Math.max(1, netProb - 5);
      jrfProb = Math.max(1, jrfProb - 5);
    }

    const dataPoints = p1Scores.length + p2Scores.length;
    const confidence = dataPoints >= 15 ? 'high' : dataPoints >= 8 ? 'medium' : 'low';
    const riskLevel = jrfProb >= 65 ? 'safe' : jrfProb >= 40 ? 'moderate' : jrfProb >= 20 ? 'risky' : 'critical';

    // Factors analysis
    const factors = [];
    if (paper1Accuracy >= 70) 
      factors.push({ type: 'positive', text: `Paper 1 accuracy: ${paper1Accuracy}%` });
    else 
      factors.push({ type: 'negative', text: `Paper 1 accuracy: ${paper1Accuracy}% (need 70%+)` });
    
    if (paper2Accuracy >= 70) 
      factors.push({ type: 'positive', text: `Paper 2 accuracy: ${paper2Accuracy}%` });
    else 
      factors.push({ type: 'negative', text: `Paper 2 accuracy: ${paper2Accuracy}% (need 70%+)` });
    
    if (predictedTotal >= JRF_CUTOFF) 
      factors.push({ type: 'positive', text: `Predicted ${predictedTotal}% ≥ JRF cutoff ${JRF_CUTOFF}%` });
    else if (predictedTotal >= NET_CUTOFF) 
      factors.push({ type: 'positive', text: `Predicted ${predictedTotal}% ≥ NET cutoff ${NET_CUTOFF}%` });
    else 
      factors.push({ type: 'negative', text: `Predicted ${predictedTotal}% < NET cutoff ${NET_CUTOFF}%` });
    
    if (streak >= 7) 
      factors.push({ type: 'positive', text: `${streak} day streak` });
    else if (streak < 3) 
      factors.push({ type: 'negative', text: 'Low consistency - build a streak' });
    
    if (consistencyScore >= 60) 
      factors.push({ type: 'positive', text: `Score consistency: ${consistencyScore}%` });
    else 
      factors.push({ type: 'negative', text: `High score variance (${consistencyScore}%)` });
    
    if (coveragePct >= 60) 
      factors.push({ type: 'positive', text: `Syllabus coverage: ${coveragePct}%` });
    else 
      factors.push({ type: 'negative', text: `Low coverage: ${coveragePct}%` });

    // Suggestions
    const suggestions = [];
    if (predictedP1 < NET_CUTOFF) 
      suggestions.push(`Paper 1: Currently ${predictedP1}% → Need ${NET_CUTOFF}%+`);
    if (predictedP2 < NET_CUTOFF) 
      suggestions.push(`Paper 2: Currently ${predictedP2}% → Need ${NET_CUTOFF}%+`);
    if (predictedTotal < JRF_CUTOFF && predictedTotal >= NET_CUTOFF) 
      suggestions.push(`JRF gap: Need ${JRF_CUTOFF - predictedTotal}% more`);
    if (consistencyScore < 50) 
      suggestions.push('Improve consistency - practice regularly');
    if (coveragePct < 50) 
      suggestions.push('Cover more syllabus topics');
    if (streak < 5) 
      suggestions.push('Build daily practice habit');
    if (progressTracker.stats.critical > 0) 
      suggestions.push(`${progressTracker.stats.critical} critical tests need retry`);

    // Readiness score
    const readinessScore = Math.round(
      (consistencyScore * 0.2) +
      (coveragePct * 0.3) +
      (predictedTotal * 0.3) +
      (Math.min(streak, 14) / 14 * 100 * 0.1) +
      ((progressTracker.stats.excellent + progressTracker.stats.good) / Math.max(1, progressTracker.stats.totalTracked) * 100 * 0.1)
    );

    return {
      netProbability: netProb,
      jrfProbability: jrfProb,
      predictedP1,
      predictedP2,
      predictedTotal,
      netCutoff: NET_CUTOFF,
      jrfCutoff: JRF_CUTOFF,
      confidence,
      factors,
      suggestions,
      riskLevel,
      consistencyScore,
      dataPoints,
      p1Trend: paper1TrendDir,
      p2Trend: paper2TrendDir,
      readinessScore,
      stdDev: Math.round(sd),
    };
  }, [allCompletedAttempts, paper1Attempts, paper2Attempts, paper1Accuracy, paper2Accuracy, 
      streak, paper1TrendDir, paper2TrendDir, syllabusCoverage, progressTracker]);

  // ════════════════════════════════════════════════════════
  //  §11 GOAL TRACKER (Enhanced)
  // ════════════════════════════════════════════════════════
  const daysUntilExam = useMemo(() => {
    if (!examDate) return null;
    const exam = new Date(examDate);
    const now = new Date();
    const diff = exam - now;
    return Math.max(0, Math.ceil(diff / 86400000));
  }, [examDate]);

  const todayKey = new Date().toISOString().split('T')[0];

  const todayDetailed = useMemo(() => {
    const todayAttempts = allCompletedAttempts.filter(a => 
      new Date(a.completedAt || a.createdAt).toISOString().split('T')[0] === todayKey
    );

    let pendingCleared = 0, weakRetried = 0;
    todayAttempts.forEach(a => {
      const tid = (a.testId?._id || a.testId)?.toString();
      if (!tid) return;
      
      const previousAttempts = allCompletedAttempts.filter(p => 
        (p.testId?._id || p.testId)?.toString() === tid && 
        new Date(p.completedAt || p.createdAt).toISOString().split('T')[0] !== todayKey
      );
      
      if (previousAttempts.length === 0) {
        pendingCleared++;
      } else {
        const bestPrevious = Math.max(...previousAttempts.map(p => 
          p.totalMarks > 0 ? Math.round((p.score / p.totalMarks) * 100) : 0
        ));
        if (bestPrevious < 50) weakRetried++;
      }
    });

    const scores = todayAttempts.map(a => 
      a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0
    );
    const stats = calcStats(todayAttempts);
    const time = todayAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0);

    return {
      count: todayAttempts.length,
      pendingCleared,
      weakRetried,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      accuracy: stats.accuracy,
      avgAccuracy: stats.accuracy,
      timeSpent: time,
      p1Count: todayAttempts.filter(a => a.testId?.paper === 'paper1').length,
      p2Count: todayAttempts.filter(a => a.testId?.paper === 'paper2').length,
      correct: stats.totalCorrect,
      wrong: stats.totalWrong,
      skipped: stats.totalSkipped,
      totalQuestionsSolved: stats.totalCorrect + stats.totalWrong + stats.totalSkipped,
      scoresAboveTarget: scores.filter(s => s >= (customTargets.targetScore || 75)).length,
      perfectScores: scores.filter(s => s >= 90).length,
      attempts: todayAttempts,
      scores,
    };
  }, [allCompletedAttempts, todayKey, customTargets, calcStats]);

  const todayActivity = todayDetailed;

  const yesterdayActivity = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = yesterday.toISOString().split('T')[0];
    return activityMap[key] || { count: 0, avgScore: 0, avgAccuracy: 0 };
  }, [activityMap]);

  const goalStreak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    
    for (let i = 1; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (goalHistory[key] === true) count++;
      else break;
    }
    return count;
  }, [goalHistory]);

  const dayProgress = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    const studyStart = 6 * 60; // 6 AM
    const studyEnd = 23 * 60; // 11 PM
    const studyDuration = studyEnd - studyStart;
    
    const elapsed = Math.max(0, Math.min(totalMinutes - studyStart, studyDuration));
    const pct = Math.round((elapsed / studyDuration) * 100);
    const remaining = Math.max(0, studyEnd - totalMinutes);
    
    return {
      pct: Math.min(100, Math.max(0, pct)),
      remainingHours: Math.floor(remaining / 60),
      remainingMins: remaining % 60,
      totalRemaining: remaining,
      period: hours >= 17 ? 'evening' : hours >= 12 ? 'afternoon' : hours < 6 ? 'night' : 'morning',
      isLateNight: hours >= 23 || hours < 6,
      isPastHalf: pct > 50,
      isAlmostOver: pct > 80,
      currentHour: hours,
    };
  }, []);

  const todayXP = useMemo(() => {
    let xp = 0;
    const td = todayDetailed;
    
    // Base XP for tests
    xp += td.count * 10;
    
    // Accuracy bonus
    if (td.accuracy >= 80) xp += td.count * 5;
    else if (td.accuracy >= 70) xp += td.count * 3;
    
    // Perfect scores
    xp += td.perfectScores * 15;
    
    // Clearing pending
    xp += td.pendingCleared * 8;
    
    // Retrying weak
    xp += td.weakRetried * 12;
    
    // Streak bonus
    xp += Math.min(streak, 7) * 2;
    
    return xp;
  }, [todayDetailed, streak]);

  const autoGeneratedGoals = useMemo(() => {
    const goals = [];
    const { dailyTests, dailyAccuracy, targetScore } = customTargets;
    const td = todayDetailed;
    const dp = dayProgress;

    // Daily tests goal
    goals.push({
      id: 'daily_tests',
      title: `Complete ${dailyTests} tests`,
      titleHi: `${dailyTests} टेस्ट पूरे करें`,
      icon: 'ClipboardList',
      target: dailyTests,
      current: td.count,
      type: 'count',
      color: 'blue',
      priority: 'critical',
      xp: 10,
      description: td.count >= dailyTests 
        ? `Done! ${td.count} tests completed` 
        : `${dailyTests - td.count} more to go`,
      descriptionHi: td.count >= dailyTests 
        ? `पूरा! ${td.count} टेस्ट` 
        : `${dailyTests - td.count} और`,
      urgency: td.count < dailyTests && dp.isPastHalf ? 'high' : 'normal',
    });

    // Accuracy goal
    goals.push({
      id: 'daily_accuracy',
      title: `${dailyAccuracy}%+ accuracy`,
      titleHi: `${dailyAccuracy}%+ सटीकता`,
      icon: 'Target',
      target: dailyAccuracy,
      current: td.count > 0 ? td.accuracy : 0,
      type: 'percentage',
      color: 'emerald',
      priority: 'high',
      xp: 15,
      description: td.count === 0 
        ? 'Take a test first' 
        : td.accuracy >= dailyAccuracy 
          ? `${td.accuracy}% ✓` 
          : `Need ${dailyAccuracy - td.accuracy}% more`,
      descriptionHi: td.count === 0 
        ? 'पहले टेस्ट दें' 
        : td.accuracy >= dailyAccuracy 
          ? `${td.accuracy}% ✓` 
          : `${dailyAccuracy - td.accuracy}% और`,
      urgency: td.count > 0 && td.accuracy < dailyAccuracy ? 'medium' : 'normal',
    });

    // Beat average goal
    const last5Avg = scoreTrend.slice(-5).reduce((s, d) => s + d.score, 0) / 
      (Math.min(scoreTrend.length, 5) || 1);
    const improvementTarget = Math.min(100, Math.round(last5Avg + 5));
    
    goals.push({
      id: 'beat_avg',
      title: `Score ${improvementTarget}%+`,
      titleHi: `${improvementTarget}%+ स्कोर`,
      icon: 'TrendingUp',
      target: improvementTarget,
      current: td.bestScore,
      type: 'percentage',
      color: 'purple',
      priority: 'high',
      xp: 20,
      description: td.bestScore >= improvementTarget 
        ? `Best: ${td.bestScore}% ✓` 
        : `Best: ${td.bestScore}%`,
      descriptionHi: td.bestScore >= improvementTarget 
        ? `सर्वश्रेष्ठ: ${td.bestScore}% ✓` 
        : `सर्वश्रेष्ठ: ${td.bestScore}%`,
      urgency: 'normal',
    });

    // Pending tests goal
    if (notAttemptedTests.length > 0) {
      const pendingTarget = Math.min(2, notAttemptedTests.length);
      goals.push({
        id: 'clear_pending',
        title: `Clear ${pendingTarget} pending tests`,
        titleHi: `${pendingTarget} बाकी टेस्ट पूरे करें`,
        icon: 'Clock',
        target: pendingTarget,
        current: td.pendingCleared,
        type: 'count',
        color: 'amber',
        priority: 'medium',
        xp: 8,
        description: `${notAttemptedTests.length} total pending`,
        descriptionHi: `${notAttemptedTests.length} कुल बाकी`,
        urgency: notAttemptedTests.length > 10 ? 'high' : 'normal',
      });
    }

    // Retry weak tests goal
    if (progressTracker.needsAttention.length > 0) {
      goals.push({
        id: 'retry_weak',
        title: 'Retry 1 weak test',
        titleHi: '1 कमजोर टेस्ट दोबारा दें',
        icon: 'RefreshCw',
        target: 1,
        current: td.weakRetried,
        type: 'count',
        color: 'red',
        priority: 'high',
        xp: 12,
        description: `${progressTracker.needsAttention.length} tests need attention`,
        descriptionHi: `${progressTracker.needsAttention.length} टेस्ट पर ध्यान दें`,
        urgency: progressTracker.needsAttention.length > 3 ? 'high' : 'normal',
      });
    }

    // Streak goal
    goals.push({
      id: 'streak',
      title: streak > 0 ? `Extend ${streak}d streak` : 'Start a streak',
      titleHi: streak > 0 ? `${streak}d स्ट्रीक बढ़ाएं` : 'स्ट्रीक शुरू करें',
      icon: 'Flame',
      target: 1,
      current: td.count > 0 ? 1 : 0,
      type: 'count',
      color: 'orange',
      priority: td.count === 0 && dp.isPastHalf ? 'critical' : 'medium',
      xp: 5 + Math.min(streak, 10),
      description: td.count > 0 ? 'Streak secured!' : "Don't break it!",
      descriptionHi: td.count > 0 ? 'स्ट्रीक पक्की!' : 'मत तोड़ो!',
      urgency: td.count === 0 && dp.isAlmostOver ? 'critical' : 'normal',
    });

    // Study time goal
    const studyTimeMins = Math.round(td.timeSpent / 60);
    goals.push({
      id: 'study_time',
      title: '30+ min study',
      titleHi: '30+ मिनट पढ़ाई',
      icon: 'Timer',
      target: 30,
      current: studyTimeMins,
      type: 'count',
      color: 'cyan',
      priority: 'medium',
      xp: 10,
      description: `${studyTimeMins}/30 min`,
      descriptionHi: `${studyTimeMins}/30 मिनट`,
      urgency: 'normal',
    });

    // Paper balance goal (if dailyTests >= 2)
    if (dailyTests >= 2) {
      const p1Target = Math.max(1, Math.floor(dailyTests / 2));
      const p2Target = Math.max(1, dailyTests - p1Target);
      const p1Done = td.p1Count >= p1Target ? 1 : 0;
      const p2Done = td.p2Count >= p2Target ? 1 : 0;
      
      goals.push({
        id: 'paper_balance',
        title: `P1:${p1Target}+ P2:${p2Target}+`,
        titleHi: `P1:${p1Target}+ P2:${p2Target}+`,
        icon: 'BarChart2',
        target: 2,
        current: p1Done + p2Done,
        type: 'count',
        color: 'indigo',
        priority: 'low',
        xp: 8,
        description: `P1:${td.p1Count}/${p1Target} | P2:${td.p2Count}/${p2Target}`,
        descriptionHi: `P1:${td.p1Count}/${p1Target} | P2:${td.p2Count}/${p2Target}`,
        urgency: 'normal',
      });
    }

    // Sort by: incomplete first, then by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    goals.sort((a, b) => {
      const aDone = a.current >= a.target ? 1 : 0;
      const bDone = b.current >= b.target ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    return goals;
  }, [customTargets, todayDetailed, scoreTrend, notAttemptedTests, progressTracker, streak, dayProgress]);

  const goalCompletionPct = useMemo(() => {
    if (autoGeneratedGoals.length === 0) return 0;
    const completed = autoGeneratedGoals.filter(g => g.current >= g.target).length;
    const pct = Math.round((completed / autoGeneratedGoals.length) * 100);
    
    // Auto-save goal completion to history
    if (pct === 100 && todayDetailed.count > 0) {
      const newHistory = { ...goalHistory, [todayKey]: true };
      if (!goalHistory[todayKey]) {
        updateGoalHistory(newHistory);
      }
    }
    
    return pct;
  }, [autoGeneratedGoals, todayDetailed, todayKey, goalHistory, updateGoalHistory]);

  const goalsCompleted = useMemo(() => 
    autoGeneratedGoals.filter(g => g.current >= g.target).length, 
    [autoGeneratedGoals]
  );
  const totalGoals = autoGeneratedGoals.length;

  const pressureMessage = useMemo(() => {
    const td = todayDetailed;
    const dp = dayProgress;
    const gc = goalsCompleted;
    const tg = totalGoals;

    if (gc === tg && td.count > 0) {
      return { type: 'celebration', en: 'All goals complete! Champion! 🏆', hi: 'सभी लक्ष्य पूरे! चैंपियन! 🏆' };
    }
    if (td.count === 0 && dp.isAlmostOver) {
      return { type: 'critical', en: 'Day almost over! Take 1 test NOW!', hi: 'दिन खत्म! अभी 1 टेस्ट दो!' };
    }
    if (td.count === 0 && dp.isPastHalf) {
      return { type: 'warning', en: 'Half day gone, 0 tests! Start now!', hi: 'आधा दिन गया, 0 टेस्ट! शुरू करो!' };
    }
    if (td.count === 0) {
      return { type: 'info', en: 'New day! Start with your first test.', hi: 'नया दिन! पहला टेस्ट शुरू करो।' };
    }
    if (gc < tg / 2 && dp.isPastHalf) {
      return { type: 'warning', en: `${gc}/${tg} goals done. Pick up the pace!`, hi: `${gc}/${tg} लक्ष्य। तेज करो!` };
    }
    if (gc >= tg / 2) {
      return { type: 'positive', en: `${gc}/${tg} done! Keep it up!`, hi: `${gc}/${tg} पूरे! जारी रखो!` };
    }
    return { type: 'info', en: `${tg - gc} goals remaining. You got this!`, hi: `${tg - gc} बाकी। कर सकते हो!` };
  }, [todayDetailed, dayProgress, goalsCompleted, totalGoals]);

  // ════════════════════════════════════════════════════════
  //  §12 SMART REVISION HUB
  // ════════════════════════════════════════════════════════
  const smartRevision = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const dUntilExam = daysUntilExam || 365;

    // Use progressTracker data
    const items = progressTracker.all.map(t => {
      const lastDate = new Date(t.lastDate);
      lastDate.setHours(0, 0, 0, 0);
      const daysSince = Math.max(0, Math.floor((todayMs - lastDate.getTime()) / 86400000));
      
      let effectiveInterval = t.srsInterval;
      if (t.totalAttempts > 1 && t.improvement > 10) {
        effectiveInterval = Math.round(effectiveInterval * 1.5);
      }

      const nextRevisionDate = new Date(lastDate);
      nextRevisionDate.setDate(nextRevisionDate.getDate() + effectiveInterval);
      const isOverdue = nextRevisionDate <= today;
      const overdueBy = isOverdue ? Math.floor((todayMs - nextRevisionDate.getTime()) / 86400000) : 0;
      const isDueToday = nextRevisionDate.toISOString().split('T')[0] === todayKey;
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isDueTomorrow = nextRevisionDate.toISOString().split('T')[0] === tomorrow.toISOString().split('T')[0];
      const isDueThisWeek = nextRevisionDate <= new Date(todayMs + 7 * 86400000);

      // Priority score
      let priority = 0;
      priority += Math.max(0, 100 - t.bestScore);
      if (isOverdue) priority += overdueBy * 5;
      if (t.trend === 'declining') priority += 20;
      if (dUntilExam < 30) priority += 15;
      if (dUntilExam < 7) priority += 25;
      if (daysSince > 14) priority += 10;
      priority = Math.min(100, priority);

      // Category
      let category = 'mastered';
      if (t.bestScore < 30) category = 'critical';
      else if (t.bestScore < 50) category = 'weak';
      else if (t.bestScore < 70 || (t.improvement > 15 && t.bestScore < 85)) category = 'improving';
      else if (t.bestScore >= 85) category = 'mastered';
      else category = 'learning';

      return {
        ...t,
        daysSinceLastAttempt: daysSince,
        effectiveInterval,
        nextRevisionDate: nextRevisionDate.toISOString().split('T')[0],
        isOverdue,
        overdueBy,
        isDueToday,
        isDueTomorrow,
        isDueThisWeek,
        priorityScore: priority,
        category,
      };
    });

    // Sort by priority
    items.sort((a, b) => b.priorityScore - a.priorityScore);

    const critical = items.filter(i => i.category === 'critical');
    const weak = items.filter(i => i.category === 'weak');
    const improving = items.filter(i => i.category === 'improving');
    const learning = items.filter(i => i.category === 'learning');
    const mastered = items.filter(i => i.category === 'mastered');
    const overdue = items.filter(i => i.isOverdue);
    const todayDue = items.filter(i => i.isDueToday || i.isOverdue);
    const tomorrowDue = items.filter(i => i.isDueTomorrow);
    const thisWeekDue = items.filter(i => i.isDueThisWeek);

    // Marathon queue
    const marathonQueue = [
      ...critical,
      ...weak.filter(w => !critical.includes(w)),
      ...overdue.filter(o => !critical.includes(o) && !weak.includes(o))
    ].slice(0, 20);

    // Stats
    const allImproved = items.filter(i => i.improvement > 0);
    const avgImprovement = allImproved.length > 0 
      ? Math.round(allImproved.reduce((s, i) => s + i.improvement, 0) / allImproved.length) 
      : 0;

    return {
      all: items,
      critical,
      weak,
      improving,
      learning,
      mastered,
      overdue,
      todayDue,
      tomorrowDue,
      thisWeekDue,
      marathonQueue,
      stats: {
        totalTests: items.length,
        critical: critical.length,
        weak: weak.length,
        improving: improving.length,
        mastered: mastered.length,
        overdue: overdue.length,
        dueToday: todayDue.length,
        dueThisWeek: thisWeekDue.length,
        avgImprovement,
        totalRevisions: items.reduce((s, i) => s + i.totalAttempts, 0),
      },
    };
  }, [progressTracker, daysUntilExam, todayKey]);

  // ════════════════════════════════════════════════════════
  //  §13 SPEED ANALYTICS
  // ════════════════════════════════════════════════════════
  const speedAnalytics = useMemo(() => {
    if (allCompletedAttempts.length === 0) {
      return { 
        avgTimePerQ: 0, 
        fastestTest: null, 
        slowestTest: null, 
        speedTrend: [], 
        timeDistribution: [],
        totalStudyTime: 0,
        avgTestDuration: 0,
      };
    }

    const withTime = allCompletedAttempts.filter(a => 
      a.totalTimeTaken > 0 && 
      (a.correctCount + a.wrongCount + a.skippedCount) > 0
    );

    const testTimes = withTime.map(a => {
      const totalQ = a.correctCount + a.wrongCount + a.skippedCount;
      return {
        avgTime: Math.round(a.totalTimeTaken / totalQ),
        score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
        title: a.testId?.title || 'Test',
        date: a.completedAt,
        totalTime: a.totalTimeTaken,
        totalQuestions: totalQ,
      };
    });

    const sorted = [...testTimes].sort((a, b) => a.avgTime - b.avgTime);

    // Speed trend
    const speedTrend = [...withTime]
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-10)
      .map((a, i) => {
        const totalQ = a.correctCount + a.wrongCount + a.skippedCount;
        const att = (a.correctCount || 0) + (a.wrongCount || 0);
        return {
          name: `T${i + 1}`,
          speed: totalQ > 0 ? Math.round(a.totalTimeTaken / totalQ) : 0,
          accuracy: att > 0 ? Math.round((a.correctCount / att) * 100) : 0,
        };
      });

    // Time distribution buckets
    const buckets = { '<30s': 0, '30-60s': 0, '60-90s': 0, '90-120s': 0, '>120s': 0 };
    testTimes.forEach(t => {
      if (t.avgTime < 30) buckets['<30s']++;
      else if (t.avgTime < 60) buckets['30-60s']++;
      else if (t.avgTime < 90) buckets['60-90s']++;
      else if (t.avgTime < 120) buckets['90-120s']++;
      else buckets['>120s']++;
    });

    const overallAvg = testTimes.length > 0 
      ? Math.round(testTimes.reduce((s, t) => s + t.avgTime, 0) / testTimes.length) 
      : 0;

    const totalStudyTime = allCompletedAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0);
    const avgTestDuration = allCompletedAttempts.length > 0 
      ? Math.round(totalStudyTime / allCompletedAttempts.length) 
      : 0;

    return {
      avgTimePerQ: overallAvg,
      fastestTest: sorted[0] || null,
      slowestTest: sorted[sorted.length - 1] || null,
      speedTrend,
      timeDistribution: Object.entries(buckets).map(([name, value]) => ({ name, value })),
      totalStudyTime,
      avgTestDuration,
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  §14 ERROR PATTERNS
  // ════════════════════════════════════════════════════════
  const errorPatterns = useMemo(() => {
    if (allCompletedAttempts.length === 0) {
      return { 
        byType: [], 
        weakUnits: [], 
        strongUnits: [], 
        errorRate: 0, 
        improvementAreas: [], 
        unitPerformance: [] 
      };
    }

    const unitMap = {};
    allCompletedAttempts.forEach(a => {
      (a.topicAnalysis || []).forEach(ta => {
        const key = ta.unit || 'Other';
        if (!unitMap[key]) {
          unitMap[key] = { correct: 0, wrong: 0, total: 0, skipped: 0 };
        }
        unitMap[key].correct += ta.correct || 0;
        unitMap[key].wrong += ta.wrong || 0;
        unitMap[key].total += ta.total || 0;
        unitMap[key].skipped += ta.skipped || 0;
      });
    });

    const unitPerformance = Object.entries(unitMap)
      .map(([unit, stats]) => ({
        unit,
        ...stats,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        errorRate: stats.total > 0 ? Math.round((stats.wrong / stats.total) * 100) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    const weakUnits = unitPerformance.filter(u => u.accuracy < 50 && u.total >= 3);
    const strongUnits = unitPerformance
      .filter(u => u.accuracy >= 70 && u.total >= 3)
      .sort((a, b) => b.accuracy - a.accuracy);

    const totalCorrect = Object.values(unitMap).reduce((s, u) => s + u.correct, 0);
    const totalWrong = Object.values(unitMap).reduce((s, u) => s + u.wrong, 0);
    const errorRate = (totalCorrect + totalWrong) > 0 
      ? Math.round((totalWrong / (totalCorrect + totalWrong)) * 100) 
      : 0;

    const improvementAreas = weakUnits.slice(0, 5).map(u => ({
      unit: u.unit,
      accuracy: u.accuracy,
      errorRate: u.errorRate,
      questionsAttempted: u.total,
      suggestion: u.accuracy < 30 
        ? 'Critical - intensive revision needed' 
        : u.accuracy < 50 
          ? 'Weak - more practice required' 
          : 'Review mistakes',
    }));

    const byType = Object.entries(questionStats?.byType || {})
      .map(([type, count]) => ({
        type,
        label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
      }));

    return {
      byType,
      weakUnits,
      strongUnits,
      errorRate,
      improvementAreas,
      unitPerformance,
    };
  }, [allCompletedAttempts, questionStats]);

  // ════════════════════════════════════════════════════════
  //  §15 STUDY RECOMMENDATIONS
  // ════════════════════════════════════════════════════════
  const studyRecommendations = useMemo(() => {
    const recs = [];

    // Weak units
    if (errorPatterns.weakUnits.length > 0) {
      const weakest = errorPatterns.weakUnits[0];
      recs.push({
        id: 'weak',
        priority: 'critical',
        icon: 'AlertTriangle',
        title: `Focus on ${weakest.unit}`,
        titleHi: `${weakest.unit} पर ध्यान दें`,
        detail: `Only ${weakest.accuracy}% accuracy`,
        detailHi: `केवल ${weakest.accuracy}% सटीकता`,
        color: 'red',
      });
    }

    // Uncovered units
    const p1Uncovered = syllabusCoverage.paper1.filter(c => 
      c.level === 'not_started' || c.level === 'no_tests'
    );
    const p2Uncovered = syllabusCoverage.paper2.filter(c => 
      c.level === 'not_started' || c.level === 'no_tests'
    );

    if (p1Uncovered.length > 0) {
      recs.push({
        id: 'p1_start',
        priority: 'high',
        icon: 'BookOpen',
        title: `Start ${p1Uncovered[0].name}`,
        titleHi: `${p1Uncovered[0].name} शुरू करें`,
        detail: `${p1Uncovered.length} P1 units uncovered`,
        detailHi: `P1 के ${p1Uncovered.length} अध्याय बाकी`,
        color: 'blue',
      });
    }

    if (p2Uncovered.length > 0) {
      recs.push({
        id: 'p2_start',
        priority: 'high',
        icon: 'Target',
        title: `Start ${p2Uncovered[0].name}`,
        titleHi: `${p2Uncovered[0].name} शुरू करें`,
        detail: `${p2Uncovered.length} P2 units uncovered`,
        detailHi: `P2 के ${p2Uncovered.length} अध्याय बाकी`,
        color: 'purple',
      });
    }

    // Declining trend
    if (trendDirection === 'down') {
      recs.push({
        id: 'declining',
        priority: 'high',
        icon: 'TrendingDown',
        title: 'Scores are declining',
        titleHi: 'स्कोर गिर रहे हैं',
        detail: 'Review recent mistakes',
        detailHi: 'हाल की गलतियां देखें',
        color: 'orange',
      });
    }

    // Pending tests
    if (notAttemptedTests.length > 5) {
      recs.push({
        id: 'pending',
        priority: 'medium',
        icon: 'Clock',
        title: `${notAttemptedTests.length} tests pending`,
        titleHi: `${notAttemptedTests.length} टेस्ट बाकी`,
        detail: 'Complete your created tests',
        detailHi: 'बनाए गए टेस्ट पूरे करें',
        color: 'amber',
      });
    }

    // Streak
    if (streak < 3 && allCompletedAttempts.length > 5) {
      recs.push({
        id: 'consistency',
        priority: 'medium',
        icon: 'Flame',
        title: 'Build a routine',
        titleHi: 'आदत बनाएं',
        detail: `Current streak: ${streak} days`,
        detailHi: `वर्तमान स्ट्रीक: ${streak} दिन`,
        color: 'orange',
      });
    }

    // Speed
    if (speedAnalytics.avgTimePerQ > 90) {
      recs.push({
        id: 'speed',
        priority: 'low',
        icon: 'Zap',
        title: 'Improve speed',
        titleHi: 'गति बढ़ाएं',
        detail: `${speedAnalytics.avgTimePerQ}s per question`,
        detailHi: `${speedAnalytics.avgTimePerQ}s प्रति प्रश्न`,
        color: 'cyan',
      });
    }

    // Overdue revisions
    if (smartRevision.stats.overdue > 3) {
      recs.push({
        id: 'revision',
        priority: 'high',
        icon: 'RefreshCw',
        title: `${smartRevision.stats.overdue} revisions overdue`,
        titleHi: `${smartRevision.stats.overdue} रिवीज़न बाकी`,
        detail: 'Complete SRS revisions',
        detailHi: 'SRS रिवीज़न पूरे करें',
        color: 'rose',
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recs
      .sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3))
      .slice(0, 8);
  }, [errorPatterns, syllabusCoverage, trendDirection, notAttemptedTests, streak, 
      allCompletedAttempts, speedAnalytics, smartRevision]);

  // ════════════════════════════════════════════════════════
  //  §16 CHARTS DATA
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
      range,
      count,
      pct: Math.round((count / allCompletedAttempts.length) * 100),
      color: range === '81-100' ? '#22c55e' 
        : range === '61-80' ? '#3b82f6' 
        : range === '41-60' ? '#f59e0b' 
        : range === '21-40' ? '#f97316' 
        : '#ef4444',
    }));
  }, [allCompletedAttempts]);

  const personalRecords = useMemo(() => {
    if (allCompletedAttempts.length === 0) return {};

    const scores = allCompletedAttempts.map(a => ({
      pct: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
      title: a.testId?.title || 'Test',
      date: a.completedAt,
      accuracy: (() => {
        const total = (a.correctCount || 0) + (a.wrongCount || 0);
        return total > 0 ? Math.round((a.correctCount / total) * 100) : 0;
      })(),
      timeTaken: a.totalTimeTaken || 0,
    }));

    const sortedByScore = [...scores].sort((a, b) => b.pct - a.pct);
    const sortedByAccuracy = [...scores].sort((a, b) => b.accuracy - a.accuracy);

    // Best day calculation
    const dayCount = {};
    allCompletedAttempts.forEach(a => {
      const key = new Date(a.completedAt).toISOString().split('T')[0];
      dayCount[key] = (dayCount[key] || 0) + 1;
    });
    const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

    return {
      highestScore: sortedByScore[0],
      lowestScore: sortedByScore[sortedByScore.length - 1],
      bestAccuracy: sortedByAccuracy[0],
      totalTestsTaken: allCompletedAttempts.length,
      bestDay: bestDay ? { date: bestDay[0], count: bestDay[1] } : null,
      longestStreak,
      currentStreak: streak,
      totalStudyTime: speedAnalytics.totalStudyTime,
    };
  }, [allCompletedAttempts, longestStreak, streak, speedAnalytics]);

  const timeOfDayAnalysis = useMemo(() => {
    const hourMap = {};
    for (let i = 0; i < 24; i++) {
      hourMap[i] = { count: 0, totalScore: 0, totalAccuracy: 0 };
    }

    allCompletedAttempts.forEach(a => {
      if (!a.startedAt && !a.completedAt) return;
      const hour = new Date(a.startedAt || a.completedAt).getHours();
      hourMap[hour].count++;
      hourMap[hour].totalScore += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const att = (a.correctCount || 0) + (a.wrongCount || 0);
      hourMap[hour].totalAccuracy += att > 0 ? Math.round((a.correctCount / att) * 100) : 0;
    });

    const hourData = Object.entries(hourMap).map(([hour, data]) => ({
      hour: parseInt(hour),
      label: `${hour.toString().padStart(2, '0')}:00`,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      avgAccuracy: data.count > 0 ? Math.round(data.totalAccuracy / data.count) : 0,
    }));

    const withTests = hourData.filter(h => h.count >= 2);
    const bestHour = [...withTests].sort((a, b) => b.avgScore - a.avgScore)[0] || null;

    const periods = [
      { name: 'Morning', nameHi: 'सुबह', range: [6, 12], icon: 'Sun' },
      { name: 'Afternoon', nameHi: 'दोपहर', range: [12, 17], icon: 'Coffee' },
      { name: 'Evening', nameHi: 'शाम', range: [17, 21], icon: 'Sunset' },
      { name: 'Night', nameHi: 'रात', range: [21, 6], icon: 'Moon' },
    ];

    const periodData = periods.map(p => {
      const hours = hourData.filter(h => {
        if (p.range[0] < p.range[1]) {
          return h.hour >= p.range[0] && h.hour < p.range[1];
        }
        return h.hour >= p.range[0] || h.hour < p.range[1];
      });
      const totalCount = hours.reduce((s, h) => s + h.count, 0);
      return {
        ...p,
        count: totalCount,
        avgScore: totalCount > 0 
          ? Math.round(hours.reduce((s, h) => s + h.avgScore * h.count, 0) / totalCount) 
          : 0,
      };
    });

    return {
      hourData,
      bestHour,
      periodData,
      bestPeriod: [...periodData].sort((a, b) => b.avgScore - a.avgScore)[0],
    };
  }, [allCompletedAttempts]);

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
    return Object.entries(bt)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        pct: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0,
      }));
  }, [questionStats, totalQuestions]);

  const topicPerformance = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      (a.topicAnalysis || []).forEach(t => {
        const key = t.unit || t.topic || 'Other';
        if (!map[key]) {
          map[key] = { unit: key, correct: 0, wrong: 0, skipped: 0, total: 0 };
        }
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
      .slice(0, 10);
  }, [allCompletedAttempts]);

  const achievements = useMemo(() => {
    const list = [];
    const totalAttempts = allCompletedAttempts.length;
    const best = totalAttempts > 0 
      ? Math.max(...allCompletedAttempts.map(a => 
          a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0
        ))
      : 0;

    const add = (icon, label, desc, color, unlocked, progress) => {
      list.push({ icon, label, desc, color, unlocked, progress });
    };

    // Question achievements
    if (totalQuestions >= 100) add('Layers', 'Century', '100+ Questions', 'amber', true);
    else add('Layers', 'Century', `${totalQuestions}/100`, 'gray', false, totalQuestions / 100);

    if (totalQuestions >= 500) add('Crown', 'Massive', '500+ Questions', 'purple', true);
    else if (totalQuestions >= 100) add('Crown', 'Massive', `${totalQuestions}/500`, 'gray', false, totalQuestions / 500);

    // Test achievements
    if (totalAttempts >= 1) add('Play', 'Starter', 'First Test', 'blue', true);
    else add('Play', 'Starter', '0/1', 'gray', false, 0);

    if (totalAttempts >= 10) add('Flame', 'Dedicated', '10+ Tests', 'orange', true);
    else add('Flame', 'Dedicated', `${totalAttempts}/10`, 'gray', false, totalAttempts / 10);

    if (totalAttempts >= 50) add('Medal', 'Veteran', '50+ Tests', 'amber', true);
    else if (totalAttempts >= 10) add('Medal', 'Veteran', `${totalAttempts}/50`, 'gray', false, totalAttempts / 50);

    // Score achievements
    if (best >= 90) add('Star', 'Expert', '90%+ Score', 'amber', true);
    else if (best >= 80) add('Star', 'Brilliant', '80%+ Score', 'emerald', true);
    else add('Star', 'Brilliant', `${best}%/80%`, 'gray', false, best / 80);

    // Accuracy achievements
    if (overallAccuracy >= 70) add('Target', 'Sharpshooter', '70%+ Accuracy', 'emerald', true);
    else add('Target', 'Sharpshooter', `${overallAccuracy}%/70%`, 'gray', false, overallAccuracy / 70);

    // Streak achievements
    if (streak >= 7) add('Flame', 'On Fire', '7-Day Streak', 'orange', true);
    else add('Flame', 'On Fire', `${streak}/7 days`, 'gray', false, streak / 7);

    return list;
  }, [totalQuestions, allCompletedAttempts, overallAccuracy, streak]);

  // ════════════════════════════════════════════════════════
  //  §17 WEEKLY CHAPTER MATRIX
  // ════════════════════════════════════════════════════════
  const weeklyChapterMatrix = useMemo(() => {
    const getWeekStart = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d;
    };

    const getWeekKey = (date) => getWeekStart(date).toISOString().split('T')[0];

    const formatDateRange = (start) => {
      const s = new Date(start);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return `${s.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
    };

    // Group attempts by week
    const weekMap = {};
    allCompletedAttempts.forEach(a => {
      const wk = getWeekKey(a.completedAt || a.createdAt);
      if (!weekMap[wk]) weekMap[wk] = [];
      weekMap[wk].push(a);
    });

    const weekKeys = Object.keys(weekMap).sort((a, b) => new Date(b) - new Date(a));

    // Build week data
    const buildWeekData = (weekKey, attempts) => {
      const allUnits = [
        ...PAPER1_UNITS.map(u => ({ unit: u, name: PAPER1_UNIT_NAMES[u], paper: 'paper1' })),
        ...PAPER2_UNITS.map(u => ({ unit: u, name: PAPER2_UNIT_NAMES[u], paper: 'paper2' })),
      ];

      const unitStats = {};
      attempts.forEach(a => {
        const paper = a.testId?.paper;
        const unit = a.testId?.unit;

        (a.topicAnalysis || []).forEach(ta => {
          const k = `${paper}|${ta.unit || unit || 'Other'}`;
          if (!unitStats[k]) {
            unitStats[k] = { 
              correct: 0, wrong: 0, skipped: 0, total: 0, 
              scores: [], testsCount: 0, paper, unit: ta.unit || unit 
            };
          }
          unitStats[k].correct += ta.correct || 0;
          unitStats[k].wrong += ta.wrong || 0;
          unitStats[k].skipped += ta.skipped || 0;
          unitStats[k].total += ta.total || 0;
        });

        if (unit) {
          const k = `${paper}|${unit}`;
          if (!unitStats[k]) {
            unitStats[k] = { 
              correct: 0, wrong: 0, skipped: 0, total: 0, 
              scores: [], testsCount: 0, paper, unit 
            };
          }
          unitStats[k].testsCount += 1;
          const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
          unitStats[k].scores.push(pct);
        }
      });

      const chapters = Object.entries(unitStats).map(([k, s]) => {
        const avgScore = s.scores.length > 0 
          ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) 
          : 0;
        const bestScore = s.scores.length > 0 ? Math.max(...s.scores) : 0;
        const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
        const unitName = (s.paper === 'paper1' ? PAPER1_UNIT_NAMES : PAPER2_UNIT_NAMES)[s.unit] || s.unit;
        
        return {
          key: k,
          unit: s.unit,
          name: unitName,
          paper: s.paper,
          testsCount: s.testsCount,
          avgScore,
          bestScore,
          accuracy,
          correct: s.correct,
          wrong: s.wrong,
          skipped: s.skipped,
          questionsTotal: s.total,
          scores: s.scores,
        };
      }).sort((a, b) => b.avgScore - a.avgScore);

      const coveredUnits = new Set(chapters.map(c => `${c.paper}|${c.unit}`));
      const uncovered = allUnits
        .filter(u => !coveredUnits.has(`${u.paper}|${u.unit}`))
        .map(u => {
          const lastPractice = allCompletedAttempts
            .filter(a => a.testId?.paper === u.paper && matchUnit(a.testId?.unit, u.unit))
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
          const daysSince = lastPractice 
            ? Math.floor((Date.now() - new Date(lastPractice.completedAt).getTime()) / 86400000) 
            : null;
          return { ...u, lastPracticed: lastPractice?.completedAt || null, daysSince };
        });

      const totalScore = attempts.reduce((s, a) => 
        s + (a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0), 0
      );

      return {
        weekKey,
        dateRange: formatDateRange(weekKey),
        startDate: weekKey,
        chapters,
        uncovered,
        stats: {
          totalTests: attempts.length,
          chaptersCovered: chapters.length,
          totalChapters: allUnits.length,
          avgScore: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
        },
      };
    };

    const currentWeekKey = getWeekKey(new Date());
    const weeks = weekKeys.slice(0, 6).map(wk => buildWeekData(wk, weekMap[wk]));
    
    const currentWeek = weeks.find(w => w.weekKey === currentWeekKey) 
      || buildWeekData(currentWeekKey, weekMap[currentWeekKey] || []);
    const previousWeek = weeks.find(w => w.weekKey !== currentWeekKey) || null;

    const comparison = previousWeek ? {
      testsChange: currentWeek.stats.totalTests - previousWeek.stats.totalTests,
      chaptersChange: currentWeek.stats.chaptersCovered - previousWeek.stats.chaptersCovered,
      scoreChange: currentWeek.stats.avgScore - previousWeek.stats.avgScore,
    } : null;

    // Insights
    const insights = [];
    if (currentWeek.uncovered.length > 0) {
      const critical = currentWeek.uncovered.filter(u => u.daysSince !== null && u.daysSince > 14);
      if (critical.length > 0) {
        insights.push({
          type: 'critical',
          text: `${critical[0].name} not practiced in ${critical[0].daysSince} days!`,
          textHi: `${critical[0].name} ${critical[0].daysSince} दिन से नहीं!`,
          priority: 'critical',
        });
      }
      insights.push({
        type: 'warning',
        text: `${currentWeek.uncovered.length} chapters uncovered this week`,
        textHi: `इस हफ्ते ${currentWeek.uncovered.length} अध्याय नहीं`,
        priority: 'high',
      });
    }

    return {
      currentWeek,
      previousWeek,
      weeks,
      comparison,
      insights,
    };
  }, [allCompletedAttempts, matchUnit]);

  // ════════════════════════════════════════════════════════
  //  §18 EXAM COMMAND CENTER
  // ════════════════════════════════════════════════════════
  const examCommandCenter = useMemo(() => {
    const isSet = !!examDate && !isNaN(new Date(examDate).getTime());
    const totalDays = isSet ? Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000)) : null;
    const examDateObj = isSet ? new Date(examDate) : null;

    const now = new Date();
    const hours = isSet ? Math.max(0, Math.floor(((examDateObj - now) % 86400000) / 3600000)) : 0;
    const minutes = isSet ? Math.max(0, Math.floor(((examDateObj - now) % 3600000) / 60000)) : 0;

    // Journey progress
    const firstTest = allCompletedAttempts.length > 0
      ? [...allCompletedAttempts].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))[0]
      : null;
    const startDate = firstTest ? new Date(firstTest.completedAt) : new Date();
    const totalJourneyDays = isSet ? Math.max(1, Math.ceil((examDateObj - startDate) / 86400000)) : 100;
    const elapsedDays = Math.max(0, Math.ceil((now - startDate) / 86400000));
    const journeyProgress = Math.min(100, Math.round((elapsedDays / totalJourneyDays) * 100));

    // Phases
    const allPhases = [
      { name: 'Foundation', nameHi: 'नींव', description: 'Cover all units, build basics', descHi: 'सभी इकाइयां, बुनियाद', pctRange: [0, 25] },
      { name: 'Practice', nameHi: 'अभ्यास', description: 'Intensive practice & DPPs', descHi: 'गहन अभ्यास', pctRange: [25, 50] },
      { name: 'Revision', nameHi: 'पुनरावृत्ति', description: 'Revise weak areas', descHi: 'कमजोर क्षेत्र दोहराएं', pctRange: [50, 75] },
      { name: 'Mock Tests', nameHi: 'मॉक टेस्ट', description: 'Full mocks & analysis', descHi: 'पूर्ण मॉक और विश्लेषण', pctRange: [75, 90] },
      { name: 'Final Review', nameHi: 'अंतिम समीक्षा', description: 'Last touch, confidence build', descHi: 'अंतिम तैयारी', pctRange: [90, 100] },
    ];

    let currentPhaseIdx = 0;
    if (totalDays !== null) {
      if (totalDays <= 7) currentPhaseIdx = 4;
      else if (totalDays <= 15) currentPhaseIdx = 3;
      else if (totalDays <= 30) currentPhaseIdx = 2;
      else if (totalDays <= 60) currentPhaseIdx = 1;
    } else {
      currentPhaseIdx = Math.min(4, Math.floor(journeyProgress / 25));
    }

    const phasesWithStatus = allPhases.map((p, i) => ({
      ...p,
      status: i < currentPhaseIdx ? 'completed' : i === currentPhaseIdx ? 'current' : 'upcoming',
      progress: i < currentPhaseIdx ? 100 
        : i === currentPhaseIdx 
          ? Math.round(((journeyProgress - p.pctRange[0]) / (p.pctRange[1] - p.pctRange[0])) * 100) 
          : 0,
    }));

    // Milestones
    const milestones = [];
    const addMs = (id, title, titleHi, target, current, icon, color) => {
      milestones.push({
        id, title, titleHi, target, current,
        completed: current >= target,
        progress: Math.min(100, Math.round((current / Math.max(target, 1)) * 100)),
        icon, color,
      });
    };

    addMs('first_test', 'First test', 'पहला टेस्ट', 1, allCompletedAttempts.length, 'Play', 'blue');
    addMs('ten_tests', '10 tests', '10 टेस्ट', 10, allCompletedAttempts.length, 'ClipboardList', 'blue');
    addMs('fifty_tests', '50 tests', '50 टेस्ट', 50, allCompletedAttempts.length, 'Medal', 'amber');
    addMs('hundred_tests', '100 tests', '100 टेस्ट', 100, allCompletedAttempts.length, 'Crown', 'purple');

    const p1Covered = syllabusCoverage.paper1.filter(c => 
      c.level !== 'not_started' && c.level !== 'no_tests'
    ).length;
    const p2Covered = syllabusCoverage.paper2.filter(c => 
      c.level !== 'not_started' && c.level !== 'no_tests'
    ).length;
    
    addMs('p1_covered', 'All P1 units', 'सभी P1 इकाइयां', 10, p1Covered, 'BookOpen', 'blue');
    addMs('p2_covered', 'All P2 units', 'सभी P2 इकाइयां', 10, p2Covered, 'Target', 'purple');

    const best = allCompletedAttempts.length > 0 
      ? Math.max(...allCompletedAttempts.map(a => 
          a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0
        )) 
      : 0;
    
    addMs('score_70', 'Score 70%+', '70%+ स्कोर', 70, best, 'TrendingUp', 'emerald');
    addMs('score_80', 'Score 80%+', '80%+ स्कोर', 80, best, 'Star', 'amber');
    addMs('streak_7', '7-day streak', '7-दिन स्ट्रीक', 7, streak, 'Flame', 'orange');

    // Pace calculator
    const recentDays = Math.min(14, elapsedDays || 1);
    const recentStart = new Date(now);
    recentStart.setDate(recentStart.getDate() - recentDays);
    const recentTests = allCompletedAttempts.filter(a => new Date(a.completedAt) >= recentStart).length;
    const currentPace = recentDays > 0 ? Math.round((recentTests / recentDays) * 10) / 10 : 0;
    const remainingTests = notAttemptedTests.length;
    const requiredPace = totalDays && totalDays > 0 ? Math.round((remainingTests / totalDays) * 10) / 10 : 0;
    const paceStatus = currentPace >= requiredPace 
      ? 'on_track' 
      : currentPace >= requiredPace * 0.7 
        ? 'slightly_behind' 
        : 'behind';

    // Readiness score
    const covScore = syllabusCoverage.overallPct || 0;
    const avgScoreScore = overallAvgScore;
    const consistScore = jrfProbability.consistencyScore || 50;
    const speedScore = speedAnalytics.avgTimePerQ > 0 
      ? Math.min(100, Math.round((60 / speedAnalytics.avgTimePerQ) * 100)) 
      : 50;
    const revScore = smartRevision.stats.totalTests > 0 
      ? Math.round(
          ((smartRevision.stats.totalTests - smartRevision.stats.critical - smartRevision.stats.weak) 
            / smartRevision.stats.totalTests) * 100
        ) 
      : 0;

    const readinessFactors = [
      { name: 'Syllabus Coverage', nameHi: 'सिलेबस', score: covScore, weight: 0.30 },
      { name: 'Avg Score', nameHi: 'औसत स्कोर', score: avgScoreScore, weight: 0.25 },
      { name: 'Consistency', nameHi: 'स्थिरता', score: consistScore, weight: 0.15 },
      { name: 'Speed', nameHi: 'गति', score: speedScore, weight: 0.10 },
      { name: 'Revision', nameHi: 'पुनरावृत्ति', score: revScore, weight: 0.10 },
      { name: 'Streak', nameHi: 'स्ट्रीक', score: Math.min(100, streak * 14), weight: 0.10 },
    ];
    
    const readinessOverall = Math.round(
      readinessFactors.reduce((s, f) => s + f.score * f.weight, 0)
    );

    // Today's mission
    const todayMission = [];
    const { dailyTests } = customTargets;
    const td = todayDetailed;

    if (td.count < dailyTests) {
      todayMission.push({
        id: 'tests',
        task: `Take ${dailyTests - td.count} more tests`,
        taskHi: `${dailyTests - td.count} और टेस्ट दें`,
        reason: 'Daily target',
        priority: 'critical',
        icon: 'ClipboardList',
      });
    }

    if (smartRevision.todayDue.length > 0) {
      todayMission.push({
        id: 'revision',
        task: `Revise ${smartRevision.todayDue.length} tests (SRS due)`,
        taskHi: `${smartRevision.todayDue.length} टेस्ट दोहराएं`,
        reason: 'Spaced repetition',
        priority: 'high',
        icon: 'RefreshCw',
      });
    }

    if (errorPatterns.weakUnits[0]) {
      todayMission.push({
        id: 'weak',
        task: `Practice ${errorPatterns.weakUnits[0].unit} (${errorPatterns.weakUnits[0].accuracy}%)`,
        taskHi: `${errorPatterns.weakUnits[0].unit} अभ्यास करें`,
        reason: 'Weakest area',
        priority: 'high',
        icon: 'AlertTriangle',
      });
    }

    // Risk alerts
    const riskAlerts = [];
    const uncoveredP1 = syllabusCoverage.paper1.filter(c => c.level === 'not_started').length;
    const uncoveredP2 = syllabusCoverage.paper2.filter(c => c.level === 'not_started').length;

    if ((uncoveredP1 + uncoveredP2) > 0 && totalDays && totalDays < 30) {
      riskAlerts.push({
        level: 'critical',
        text: `${uncoveredP1 + uncoveredP2} chapters not started!`,
        textHi: `${uncoveredP1 + uncoveredP2} अध्याय शुरू नहीं!`,
        icon: 'AlertTriangle',
      });
    }

    if (speedAnalytics.avgTimePerQ > 90) {
      riskAlerts.push({
        level: 'warning',
        text: `Speed: ${speedAnalytics.avgTimePerQ}s/Q (target: <60s)`,
        textHi: `गति: ${speedAnalytics.avgTimePerQ}s/प्रश्न`,
        icon: 'Zap',
      });
    }

    if (paceStatus === 'behind') {
      riskAlerts.push({
        level: 'warning',
        text: `Behind pace: ${currentPace} vs ${requiredPace}/day`,
        textHi: `पीछे: ${currentPace} vs ${requiredPace}/दिन`,
        icon: 'Clock',
      });
    }

    if (smartRevision.stats.overdue > 5) {
      riskAlerts.push({
        level: 'warning',
        text: `${smartRevision.stats.overdue} revisions overdue`,
        textHi: `${smartRevision.stats.overdue} पुनरावृत्ति बाकी`,
        icon: 'RefreshCw',
      });
    }

    return {
      countdown: {
        days: totalDays,
        hours,
        minutes,
        totalDays: totalJourneyDays,
        examDate,
        isSet,
        startDate: startDate.toISOString().split('T')[0],
      },
      phase: {
        current: phasesWithStatus[currentPhaseIdx] || phasesWithStatus[0],
        all: phasesWithStatus,
        overallProgress: journeyProgress,
      },
      milestones,
      todayMission,
      pace: {
        current: currentPace,
        required: requiredPace,
        status: paceStatus,
        remaining: remainingTests,
      },
      readiness: {
        overall: readinessOverall,
        p1: Math.round(covScore * 0.5 + paper1AvgScore * 0.5),
        p2: Math.round(covScore * 0.5 + paper2AvgScore * 0.5),
        factors: readinessFactors,
      },
      riskAlerts,
    };
  }, [examDate, allCompletedAttempts, notAttemptedTests, syllabusCoverage, 
      overallAvgScore, paper1AvgScore, paper2AvgScore, jrfProbability, 
      speedAnalytics, smartRevision, errorPatterns, streak, customTargets, todayDetailed]);

  // ════════════════════════════════════════════════════════
  //  §19 DAILY REPORT
  // ════════════════════════════════════════════════════════
  const dailyReport = useMemo(() => {
    const td = todayDetailed;
    const ya = yesterdayActivity;

    // Grade calculation
    let rating = 0;
    if (td.count >= customTargets.dailyTests) rating += 2;
    else if (td.count > 0) rating += 1;
    if (td.accuracy >= customTargets.dailyAccuracy) rating += 1;
    if (td.bestScore >= customTargets.targetScore) rating += 1;
    if (td.count > 0 && streak > 0) rating += 1;
    rating = Math.min(5, rating);

    const gradeMap = {
      5: { g: 'A+', c: 'emerald' },
      4: { g: 'A', c: 'emerald' },
      3: { g: 'B+', c: 'blue' },
      2: { g: 'B', c: 'blue' },
      1: { g: 'C', c: 'amber' },
      0: { g: 'F', c: 'red' },
    };
    const { g: grade, c: gradeColor } = gradeMap[rating] || gradeMap[0];

    const comparison = {
      testsChange: td.count - (ya.count || 0),
      scoreChange: td.avgScore - (ya.avgScore || 0),
      accuracyChange: td.accuracy - (ya.avgAccuracy || 0),
      direction: td.count > (ya.count || 0) ? 'up' : td.count < (ya.count || 0) ? 'down' : 'stable',
    };

    // Tomorrow focus
    const weakest = errorPatterns.weakUnits[0];
    const revDue = smartRevision.tomorrowDue[0];
    const tomorrowFocus = weakest
      ? { unit: weakest.unit, reason: `Weakest: ${weakest.accuracy}%`, reasonHi: `सबसे कमजोर: ${weakest.accuracy}%` }
      : revDue
        ? { unit: revDue.unit || revDue.title, reason: 'SRS revision due', reasonHi: 'SRS दोहराना बाकी' }
        : { unit: 'Mixed Practice', reason: 'Keep practicing!', reasonHi: 'अभ्यास जारी रखें!' };

    // Highlights
    const highlights = [];
    if (td.perfectScores > 0) {
      highlights.push({ type: 'achievement', text: `${td.perfectScores} perfect score(s)!`, textHi: `${td.perfectScores} परफेक्ट स्कोर!` });
    }
    if (td.pendingCleared > 0) {
      highlights.push({ type: 'progress', text: `${td.pendingCleared} pending test(s) cleared`, textHi: `${td.pendingCleared} बाकी टेस्ट पूरे` });
    }
    if (td.weakRetried > 0) {
      highlights.push({ type: 'improvement', text: `${td.weakRetried} weak test(s) retried`, textHi: `${td.weakRetried} कमजोर दोबारा दिए` });
    }
    if (td.count > (ya.count || 0) && ya.count > 0) {
      highlights.push({ type: 'progress', text: `${comparison.testsChange} more tests than yesterday!`, textHi: `कल से ${comparison.testsChange} ज्यादा!` });
    }
    if (td.accuracy >= 80 && td.count > 0) {
      highlights.push({ type: 'achievement', text: `${td.accuracy}% accuracy!`, textHi: `${td.accuracy}% सटीकता!` });
    }

    return {
      date: todayKey,
      grade,
      gradeColor,
      rating,
      stats: {
        tests: td.count,
        time: td.timeSpent,
        accuracy: td.accuracy,
        avgScore: td.avgScore,
        bestScore: td.bestScore,
        correct: td.correct,
        wrong: td.wrong,
        skipped: td.skipped,
        questionsTotal: td.totalQuestionsSolved,
      },
      comparison,
      tomorrowFocus,
      highlights,
    };
  }, [todayDetailed, yesterdayActivity, customTargets, errorPatterns, smartRevision, todayKey, streak]);

  // ════════════════════════════════════════════════════════
  //  §20 MISTAKE JOURNAL
  // ════════════════════════════════════════════════════════
  const mistakeJournal = useMemo(() => {
    const unitMistakes = {};
    const weeklyErrors = {};
    let totalCorrect = 0, totalWrong = 0, totalSkipped = 0;

    allCompletedAttempts.forEach(a => {
      const weekKey = (() => {
        const d = new Date(a.completedAt || a.createdAt);
        const day = d.getDay();
        d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
        return d.toISOString().split('T')[0];
      })();
      
      if (!weeklyErrors[weekKey]) {
        weeklyErrors[weekKey] = { correct: 0, wrong: 0, total: 0 };
      }

      (a.topicAnalysis || []).forEach(ta => {
        const unit = ta.unit || 'Other';
        if (!unitMistakes[unit]) {
          unitMistakes[unit] = { unit, wrong: 0, correct: 0, total: 0, skipped: 0, dates: [] };
        }
        unitMistakes[unit].wrong += ta.wrong || 0;
        unitMistakes[unit].correct += ta.correct || 0;
        unitMistakes[unit].total += ta.total || 0;
        unitMistakes[unit].skipped += ta.skipped || 0;
        if ((ta.wrong || 0) > 0) {
          unitMistakes[unit].dates.push(a.completedAt || a.createdAt);
        }

        totalCorrect += ta.correct || 0;
        totalWrong += ta.wrong || 0;
        totalSkipped += ta.skipped || 0;

        weeklyErrors[weekKey].correct += ta.correct || 0;
        weeklyErrors[weekKey].wrong += ta.wrong || 0;
        weeklyErrors[weekKey].total += ta.total || 0;
      });
    });

    const byUnit = Object.values(unitMistakes)
      .map(u => ({
        ...u,
        errorRate: u.total > 0 ? Math.round((u.wrong / u.total) * 100) : 0,
        timesWrong: u.dates.length,
        lastWrong: u.dates.length > 0 
          ? u.dates.sort((a, b) => new Date(b) - new Date(a))[0] 
          : null,
        isRepeated: u.dates.length >= 3 && (u.total > 0 ? Math.round((u.wrong / u.total) * 100) : 0) > 40,
      }))
      .sort((a, b) => b.wrong - a.wrong);

    const mostRepeated = byUnit.filter(u => u.isRepeated || u.timesWrong >= 3).slice(0, 10);

    const trend = Object.entries(weeklyErrors)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-8)
      .map(([wk, d]) => ({
        week: wk,
        weekLabel: new Date(wk).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        errorRate: d.total > 0 ? Math.round((d.wrong / d.total) * 100) : 0,
        correct: d.correct,
        wrong: d.wrong,
        total: d.total,
      }));

    const recentErrors = [...allCompletedAttempts]
      .filter(a => (a.wrongCount || 0) > 0)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10)
      .map(a => ({
        date: a.completedAt,
        title: a.testId?.title || 'Test',
        paper: a.testId?.paper,
        wrong: a.wrongCount || 0,
        total: (a.correctCount || 0) + (a.wrongCount || 0) + (a.skippedCount || 0),
        errorRate: (() => {
          const t = (a.correctCount || 0) + (a.wrongCount || 0);
          return t > 0 ? Math.round((a.wrongCount / t) * 100) : 0;
        })(),
        units: (a.topicAnalysis || [])
          .filter(ta => (ta.wrong || 0) > 0)
          .map(ta => ta.unit)
          .filter(Boolean),
      }));

    const overallErrorRate = (totalCorrect + totalWrong) > 0 
      ? Math.round((totalWrong / (totalCorrect + totalWrong)) * 100) 
      : 0;

        const suggestions = [];
    if (mostRepeated.length > 0) {
      suggestions.push({
        text: `Focus on ${mostRepeated[0].unit} - ${mostRepeated[0].wrong} mistakes`,
        textHi: `${mostRepeated[0].unit} पर ध्यान दें - ${mostRepeated[0].wrong} गलतियां`,
        priority: 'critical',
      });
    }
    
    if (trend.length >= 2) {
      const last = trend[trend.length - 1].errorRate;
      const prev = trend[trend.length - 2].errorRate;
      if (last > prev + 5) {
        suggestions.push({
          text: `Error rate increasing (+${last - prev}%)`,
          textHi: `गलती दर बढ़ रही (+${last - prev}%)`,
          priority: 'high',
        });
      } else if (last < prev - 5) {
        suggestions.push({
          text: `Error rate improving (-${prev - last}%)`,
          textHi: `गलती दर सुधर रही (-${prev - last}%)`,
          priority: 'low',
        });
      }
    }
    
    if (totalSkipped > totalWrong * 0.5) {
      suggestions.push({
        text: `Too many skips (${totalSkipped}). Attempt more questions.`,
        textHi: `बहुत स्किप (${totalSkipped})। ज्यादा attempt करो।`,
        priority: 'medium',
      });
    }

    return {
      totalMistakes: totalWrong,
      totalCorrect,
      totalSkipped,
      overallErrorRate,
      byUnit,
      mostRepeated,
      recentErrors,
      trend,
      suggestions,
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════
  //  §21 🆕 IMPROVEMENT JOURNEY (Low to High Progress)
  // ════════════════════════════════════════════════════════
  const improvementJourney = useMemo(() => {
    // Get all tests that have been attempted at least once
    const testsWithScores = progressTracker.sortedByScore;
    
    // Group by score ranges for better visualization
    const scoreRanges = [
      { label: 'Critical', labelHi: 'गंभीर', range: [0, 30], color: '#ef4444', bgColor: 'bg-red-500', tests: [] },
      { label: 'Weak', labelHi: 'कमजोर', range: [30, 50], color: '#f97316', bgColor: 'bg-orange-500', tests: [] },
      { label: 'Average', labelHi: 'औसत', range: [50, 65], color: '#eab308', bgColor: 'bg-yellow-500', tests: [] },
      { label: 'Good', labelHi: 'अच्छा', range: [65, 80], color: '#22c55e', bgColor: 'bg-green-500', tests: [] },
      { label: 'Excellent', labelHi: 'उत्कृष्ट', range: [80, 90], color: '#3b82f6', bgColor: 'bg-blue-500', tests: [] },
      { label: 'Master', labelHi: 'माहिर', range: [90, 101], color: '#8b5cf6', bgColor: 'bg-purple-500', tests: [] },
    ];

    testsWithScores.forEach(test => {
      for (const range of scoreRanges) {
        if (test.bestScore >= range.range[0] && test.bestScore < range.range[1]) {
          range.tests.push(test);
          break;
        }
      }
    });

    // Calculate improvement metrics
    const improvingTests = testsWithScores.filter(t => t.improvement > 0);
    const decliningTests = testsWithScores.filter(t => t.improvement < 0);
    const stableTests = testsWithScores.filter(t => t.improvement === 0 && t.totalAttempts > 1);

    // Get tests that improved the most
    const topImprovers = [...testsWithScores]
      .filter(t => t.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5);

    // Get tests that need most work (low score + multiple attempts = stuck)
    const stuckTests = testsWithScores
      .filter(t => t.bestScore < 50 && t.totalAttempts >= 2 && t.improvement <= 5)
      .slice(0, 5);

    // Next recommended tests to retry (smart queue)
    const retryQueue = testsWithScores
      .filter(t => t.bestScore < 70)
      .sort((a, b) => {
        // Priority: lowest score first, then by days since last attempt
        const scoreDiff = a.bestScore - b.bestScore;
        if (Math.abs(scoreDiff) > 10) return scoreDiff;
        return b.daysSinceLastAttempt - a.daysSinceLastAttempt;
      })
      .slice(0, 10);

    // Calculate overall journey stats
    const totalTests = testsWithScores.length;
    const avgScore = totalTests > 0 
      ? Math.round(testsWithScores.reduce((s, t) => s + t.bestScore, 0) / totalTests) 
      : 0;
    const totalImprovement = improvingTests.reduce((s, t) => s + t.improvement, 0);
    const avgImprovement = improvingTests.length > 0 
      ? Math.round(totalImprovement / improvingTests.length) 
      : 0;

    // Journey milestones
    const milestones = [];
    const above50 = testsWithScores.filter(t => t.bestScore >= 50).length;
    const above70 = testsWithScores.filter(t => t.bestScore >= 70).length;
    const above90 = testsWithScores.filter(t => t.bestScore >= 90).length;

    milestones.push({
      id: 'half_passing',
      title: '50% of tests above 50%',
      titleHi: '50% टेस्ट 50% से ऊपर',
      target: Math.ceil(totalTests / 2),
      current: above50,
      completed: above50 >= Math.ceil(totalTests / 2),
    });
    milestones.push({
      id: 'most_good',
      title: '70% of tests above 70%',
      titleHi: '70% टेस्ट 70% से ऊपर',
      target: Math.ceil(totalTests * 0.7),
      current: above70,
      completed: above70 >= Math.ceil(totalTests * 0.7),
    });
    milestones.push({
      id: 'excellence',
      title: '10 tests above 90%',
      titleHi: '10 टेस्ट 90% से ऊपर',
      target: 10,
      current: above90,
      completed: above90 >= 10,
    });

    return {
      scoreRanges,
      testsWithScores,
      improvingTests,
      decliningTests,
      stableTests,
      topImprovers,
      stuckTests,
      retryQueue,
      milestones,
      stats: {
        totalTests,
        avgScore,
        avgImprovement,
        improving: improvingTests.length,
        declining: decliningTests.length,
        stable: stableTests.length,
        above50,
        above70,
        above90,
        criticalCount: scoreRanges[0].tests.length,
        weakCount: scoreRanges[1].tests.length,
        goodCount: scoreRanges[3].tests.length + scoreRanges[4].tests.length + scoreRanges[5].tests.length,
      },
    };
  }, [progressTracker]);

  // ════════════════════════════════════════════════════════
  //  §22 🆕 STUDY SESSION TRACKER
  // ════════════════════════════════════════════════════════
  const studySession = useMemo(() => {
    const now = Date.now();
    const sessionStart = sessionData.startTime || now;
    const sessionDuration = Math.floor((now - sessionStart) / 1000); // in seconds

    // Today's session data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAttempts = allCompletedAttempts.filter(a => 
      new Date(a.completedAt) >= todayStart
    );

    const todayStats = {
      tests: todayAttempts.length,
      questions: todayAttempts.reduce((s, a) => 
        s + (a.correctCount || 0) + (a.wrongCount || 0) + (a.skippedCount || 0), 0
      ),
      correct: todayAttempts.reduce((s, a) => s + (a.correctCount || 0), 0),
      wrong: todayAttempts.reduce((s, a) => s + (a.wrongCount || 0), 0),
      timeSpent: todayAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0),
    };

    // Productivity score (0-100)
    const targetTests = customTargets.dailyTests || 3;
    const targetTime = (customTargets.dailyStudyHours || 4) * 3600; // in seconds
    const testProgress = Math.min(100, (todayStats.tests / targetTests) * 100);
    const timeProgress = Math.min(100, (todayStats.timeSpent / targetTime) * 100);
    const accuracyScore = todayStats.questions > 0 
      ? (todayStats.correct / todayStats.questions) * 100 
      : 0;
    const productivityScore = Math.round((testProgress * 0.4) + (timeProgress * 0.3) + (accuracyScore * 0.3));

    // Session insights
    const insights = [];
    if (sessionDuration > 3600 && todayStats.tests === 0) {
      insights.push({
        type: 'warning',
        text: "You've been here for an hour but haven't taken a test!",
        textHi: 'एक घंटा हो गया पर कोई टेस्ट नहीं दिया!',
      });
    }
    if (todayStats.tests >= targetTests) {
      insights.push({
        type: 'success',
        text: 'Daily test goal achieved! 🎉',
        textHi: 'दैनिक टेस्ट लक्ष्य पूरा! 🎉',
      });
    }
    if (accuracyScore >= 80 && todayStats.tests > 0) {
      insights.push({
        type: 'success',
        text: `Excellent accuracy today: ${Math.round(accuracyScore)}%`,
        textHi: `आज शानदार सटीकता: ${Math.round(accuracyScore)}%`,
      });
    }
    if (todayStats.timeSpent >= targetTime) {
      insights.push({
        type: 'success',
        text: 'Study time goal achieved!',
        textHi: 'अध्ययन समय लक्ष्य पूरा!',
      });
    }

    return {
      sessionDuration,
      sessionStart,
      todayStats,
      productivityScore,
      insights,
      targets: {
        tests: targetTests,
        time: targetTime,
      },
    };
  }, [sessionData, allCompletedAttempts, customTargets]);

  // ════════════════════════════════════════════════════════
  //  §23 🆕 FOCUS MODE SUGGESTIONS
  // ════════════════════════════════════════════════════════
  const focusModeSuggestions = useMemo(() => {
    const suggestions = [];
    const dUntilExam = daysUntilExam || 365;

    // Critical weak areas
    if (progressTracker.critical.length > 0) {
      suggestions.push({
        id: 'critical_focus',
        type: 'critical',
        title: 'Critical Area Focus',
        titleHi: 'गंभीर क्षेत्र पर ध्यान',
        description: `${progressTracker.critical.length} tests below 40%`,
        descriptionHi: `${progressTracker.critical.length} टेस्ट 40% से नीचे`,
        action: 'Start with lowest score test',
        actionHi: 'सबसे कम स्कोर वाले से शुरू करें',
        tests: progressTracker.critical.slice(0, 5),
        estimatedTime: progressTracker.critical.length * 15, // 15 mins per test
        priority: 1,
      });
    }

    // Overdue revisions
    if (smartRevision.overdue.length > 0) {
      suggestions.push({
        id: 'revision_focus',
        type: 'revision',
        title: 'SRS Revision Sprint',
        titleHi: 'SRS रिवीज़न स्प्रिंट',
        description: `${smartRevision.overdue.length} revisions overdue`,
        descriptionHi: `${smartRevision.overdue.length} रिवीज़न बाकी`,
        action: 'Complete overdue revisions',
        actionHi: 'बाकी रिवीज़न पूरे करें',
        tests: smartRevision.overdue.slice(0, 5),
        estimatedTime: smartRevision.overdue.length * 10,
        priority: 2,
      });
    }

    // Weak units practice
    if (errorPatterns.weakUnits.length > 0) {
      suggestions.push({
        id: 'weak_unit_focus',
        type: 'practice',
        title: 'Weak Unit Practice',
        titleHi: 'कमजोर इकाई अभ्यास',
        description: `${errorPatterns.weakUnits[0].unit}: ${errorPatterns.weakUnits[0].accuracy}%`,
        descriptionHi: `${errorPatterns.weakUnits[0].unit}: ${errorPatterns.weakUnits[0].accuracy}%`,
        action: 'Intensive practice on weak unit',
        actionHi: 'कमजोर इकाई पर गहन अभ्यास',
        unit: errorPatterns.weakUnits[0].unit,
        estimatedTime: 30,
        priority: 3,
      });
    }

    // Speed improvement
    if (speedAnalytics.avgTimePerQ > 75) {
      suggestions.push({
        id: 'speed_focus',
        type: 'speed',
        title: 'Speed Training',
        titleHi: 'गति प्रशिक्षण',
        description: `Current: ${speedAnalytics.avgTimePerQ}s/Q, Target: <60s`,
        descriptionHi: `वर्तमान: ${speedAnalytics.avgTimePerQ}s/प्र, लक्ष्य: <60s`,
        action: 'Practice with timer pressure',
        actionHi: 'टाइमर के साथ अभ्यास करें',
        estimatedTime: 20,
        priority: 4,
      });
    }

    // Exam countdown specific
    if (dUntilExam <= 30) {
      suggestions.push({
        id: 'exam_prep',
        type: 'exam',
        title: 'Final Exam Preparation',
        titleHi: 'अंतिम परीक्षा तैयारी',
        description: `${dUntilExam} days left!`,
        descriptionHi: `${dUntilExam} दिन बाकी!`,
        action: 'Full mock tests daily',
        actionHi: 'रोज पूर्ण मॉक टेस्ट दें',
        estimatedTime: 120,
        priority: 0, // Highest priority when exam is near
      });
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    return suggestions;
  }, [progressTracker, smartRevision, errorPatterns, speedAnalytics, daysUntilExam]);

  // ════════════════════════════════════════════════════════
  //  RETURN ALL DATA
  // ════════════════════════════════════════════════════════
  return {
    // Core data
    questionStats,
    testStats,
    attemptStats,
    recentAttempts,
    allAttempts,
    allCompletedAttempts,
    createdTests,
    loading,
    refreshing,
    error,
    lastRefresh,
    refresh,

    // Basic stats
    paper1Units,
    paper2Units,
    paper1Count,
    paper2Count,
    totalQuestions,
    overallAccuracy,
    overallAvgScore,
    paper1Attempts,
    paper2Attempts,
    paper1Tests,
    paper2Tests,
    combinedTests,
    paper1Accuracy,
    paper2Accuracy,
    paper1AvgScore,
    paper2AvgScore,

    // Trends & predictions
    scoreTrend,
    paper1Trend,
    paper2Trend,
    trendDirection,
    paper1TrendDir,
    paper2TrendDir,
    predictedScore,
    paper1Predicted,
    paper2Predicted,

    // Tests management
    notAttemptedTests,
    paper1NotAttempted,
    paper2NotAttempted,
    needsAttentionTests,
    testPerfMap,

    // Charts data
    difficultyData,
    questionTypeData,
    topicPerformance,
    scoreDistribution,
    personalRecords,
    timeOfDayAnalysis,

    // Activity & streaks
    activityMap,
    streak,
    longestStreak,
    weeklyComparison,
    achievements,

    // Analytics
    jrfProbability,
    syllabusCoverage,
    speedAnalytics,
    errorPatterns,
    studyRecommendations,

    // Goals system
    examDate,
    setExamDate,
    daysUntilExam,
    customTargets,
    updateCustomTargets,
    studyPreferences,
    updateStudyPreferences,
    autoGeneratedGoals,
    goalCompletionPct,
    todayActivity,
    todayDetailed,
    yesterdayActivity,
    dayProgress,
    goalStreak,
    goalsCompleted,
    totalGoals,
    pressureMessage,
    todayXP,

    // 🆕 NEW ENHANCED FEATURES
    progressTracker,        // Low to high score tracking
    smartRevision,          // SRS system
    weeklyChapterMatrix,    // Weekly performance matrix
    examCommandCenter,      // Exam countdown & phases
    dailyReport,            // Daily report card
    mistakeJournal,         // Error analysis
    improvementJourney,     // Progress visualization
    studySession,           // Session tracking
    focusModeSuggestions,   // Smart suggestions

    // Session management
    sessionData,
    updateSessionData,
    goalHistory,
    updateGoalHistory,
  };
};

export default useDashboard;