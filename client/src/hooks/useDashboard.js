// client/src/hooks/useDashboard.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import questionService from '../services/questionService';
import testService from '../services/testService';
import attemptService from '../services/attemptService';

// ════════════════════════════════════════════════════════════
//  SYLLABUS DATA
// ════════════════════════════════════════════════════════════
const PAPER1_UNITS = [
  'UNIT I', 'UNIT II', 'UNIT III', 'UNIT IV', 'UNIT V',
  'UNIT VI', 'UNIT VII', 'UNIT VIII', 'UNIT IX', 'UNIT X'
];
const PAPER1_UNIT_NAMES = {
  'UNIT I': 'Teaching Aptitude', 'UNIT II': 'Research Aptitude',
  'UNIT III': 'Comprehension', 'UNIT IV': 'Communication',
  'UNIT V': 'Mathematical Reasoning', 'UNIT VI': 'Logical Reasoning',
  'UNIT VII': 'Data Interpretation', 'UNIT VIII': 'ICT',
  'UNIT IX': 'Environment', 'UNIT X': 'Higher Education'
};
const PAPER2_UNITS = [
  'UNIT I', 'UNIT II', 'UNIT III', 'UNIT IV', 'UNIT V',
  'UNIT VI', 'UNIT VII', 'UNIT VIII', 'UNIT IX', 'UNIT X'
];
const PAPER2_UNIT_NAMES = {
  'UNIT I': 'Sources & Pre-History', 'UNIT II': 'Mauryan to Gupta',
  'UNIT III': 'Early Medieval', 'UNIT IV': 'Medieval Political',
  'UNIT V': 'Administration & Economy', 'UNIT VI': 'Society & Culture',
  'UNIT VII': 'British Power', 'UNIT VIII': 'Colonial Economy',
  'UNIT IX': 'National Movement', 'UNIT X': 'Historiography'
};

// JRF/NET Cutoffs (percentage based)
const JRF_CUTOFF = 80;
const NET_CUTOFF = 70;

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

  // Goal state (localStorage persisted)
  const [examDate, setExamDateState] = useState(() => {
    try { return localStorage.getItem('netprep_exam_date') || ''; } catch { return ''; }
  });
  const [customTargets, setCustomTargets] = useState(() => {
    try {
      const saved = localStorage.getItem('netprep_custom_targets');
      return saved ? JSON.parse(saved) : { dailyTests: 3, dailyAccuracy: 70, weeklyTests: 15, targetScore: 75 };
    } catch { return { dailyTests: 3, dailyAccuracy: 70, weeklyTests: 15, targetScore: 75 }; }
  });

  // ════════════════════════════════════════════
  //  DATA FETCHING
  // ════════════════════════════════════════════
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
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
    } catch (e) { console.error('Dashboard fetch error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll(true), [fetchAll]);

  // ════════════════════════════════════════════
  //  BASIC STATS
  // ════════════════════════════════════════════
  const paper1Units = useMemo(() => questionStats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], [questionStats]);
  const paper2Units = useMemo(() => questionStats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], [questionStats]);
  const paper1Count = useMemo(() => paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() => paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);
  const totalQuestions = questionStats?.total || 0;

  const allCompletedAttempts = useMemo(() => {
    const a = allAttempts.length > 0 ? allAttempts : recentAttempts;
    return a.filter(at => at.status === 'completed' || at.completedAt);
  }, [allAttempts, recentAttempts]);

  const paper1Attempts = useMemo(() => allCompletedAttempts.filter(a => a.testId?.paper === 'paper1'), [allCompletedAttempts]);
  const paper2Attempts = useMemo(() => allCompletedAttempts.filter(a => a.testId?.paper === 'paper2'), [allCompletedAttempts]);

  const paper1Tests = useMemo(() => createdTests.filter(t => t.paper === 'paper1'), [createdTests]);
  const paper2Tests = useMemo(() => createdTests.filter(t => t.paper === 'paper2'), [createdTests]);
  const combinedTests = useMemo(() => createdTests.filter(t => t.paper === 'combined' || !t.paper), [createdTests]);

  // ════════════════════════════════════════════
  //  ACCURACY / AVG SCORES
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

  const calcAvgScore = (attempts) => {
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length);
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
        accuracy: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.correctCount / t) * 100) : 0; })(),
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
  //  PREDICTION
  // ════════════════════════════════════════════
  const predictScore = (data) => {
    if (data.length < 3) return null;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2, sumY = data.reduce((s, d) => s + d.score, 0);
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
  //  NOT ATTEMPTED / NEEDS ATTENTION
  // ════════════════════════════════════════════
  const notAttemptedTests = useMemo(() => {
    const attemptedIds = new Set(allCompletedAttempts.map(a => a.testId?._id?.toString() || a.testId?.toString()));
    return createdTests.filter(t => !attemptedIds.has(t._id?.toString()));
  }, [createdTests, allCompletedAttempts]);
  const paper1NotAttempted = useMemo(() => notAttemptedTests.filter(t => t.paper === 'paper1'), [notAttemptedTests]);
  const paper2NotAttempted = useMemo(() => notAttemptedTests.filter(t => t.paper === 'paper2'), [notAttemptedTests]);

  const needsAttentionTests = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      const tid = a.testId?._id?.toString() || a.testId?.toString();
      if (!tid) return;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (!map[tid] || pct > map[tid].bestScore) {
        map[tid] = { testId: tid, test: a.testId, bestScore: pct, attempts: (map[tid]?.attempts || 0) + 1, lastAttempt: a };
      } else { map[tid].attempts += 1; }
    });
    return Object.values(map).filter(t => t.bestScore < 50).sort((a, b) => a.bestScore - b.bestScore);
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  ACTIVITY MAP / STREAK
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
      if (activityMap[d.toISOString().split('T')[0]]?.count > 0) count++;
      else if (i > 0) break;
    }
    return count;
  }, [activityMap]);

  const longestStreak = useMemo(() => {
    const dates = Object.keys(activityMap).sort();
    let max = 0, cur = 0, prev = null;
    dates.forEach(d => {
      const date = new Date(d);
      if (prev && (date - prev) / 86400000 === 1) cur++; else cur = 1;
      max = Math.max(max, cur);
      prev = date;
    });
    return max;
  }, [activityMap]);

  // ════════════════════════════════════════════
  //  WEEKLY COMPARISON
  // ════════════════════════════════════════════
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const twStart = new Date(now); twStart.setDate(now.getDate() - now.getDay()); twStart.setHours(0, 0, 0, 0);
    const lwStart = new Date(twStart); lwStart.setDate(lwStart.getDate() - 7);
    const tw = allCompletedAttempts.filter(a => new Date(a.completedAt) >= twStart);
    const lw = allCompletedAttempts.filter(a => { const d = new Date(a.completedAt); return d >= lwStart && d < twStart; });
    const avg = (arr) => !arr.length ? 0 : Math.round(arr.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / arr.length);
    return { thisWeek: { tests: tw.length, avgScore: avg(tw) }, lastWeek: { tests: lw.length, avgScore: avg(lw) }, change: tw.length - lw.length, scoreChange: avg(tw) - avg(lw) };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════
  //  SYLLABUS COVERAGE
  // ════════════════════════════════════════════════════════════
  const syllabusCoverage = useMemo(() => {
    const normalizeUnit = (str) => {
      if (!str) return '';
      return str.toLowerCase().replace(/\s+/g, ' ').trim();
    };

    const matchUnit = (testUnit, syllabusUnit) => {
      if (!testUnit) return false;
      const t = normalizeUnit(testUnit);
      const s = normalizeUnit(syllabusUnit);
      if (t === s) return true;
      if (t.includes(s) || s.includes(t)) return true;
      const extractNum = (str) => {
        const m = str.match(/unit\s*(i{1,3}|iv|v|vi{0,3}|ix|x)/i);
        return m ? m[1].toLowerCase() : '';
      };
      const tNum = extractNum(t);
      const sNum = extractNum(s);
      return tNum && sNum && tNum === sNum;
    };

    const TEST_TYPE_WEIGHTS = {
      dpp: 10, topic_test: 15, chapter_test: 25, unit_test: 35,
      practice: 20, pyq_year: 30, full_mock_p1: 20, full_mock_p2: 20, full_mock_combined: 15,
    };

    const buildCoverage = (syllabusUnits, unitNames, paper, paperTests, paperAttempts) => {
      const attemptedTestIds = new Set(paperAttempts.map(a => a.testId?._id?.toString() || a.testId?.toString()));

      return syllabusUnits.map(unit => {
        const unitTests = paperTests.filter(t => matchUnit(t.unit, unit));
        const totalTests = unitTests.length;
        const attemptedTests = unitTests.filter(t => attemptedTestIds.has(t._id?.toString()));
        const attemptedCount = attemptedTests.length;
        const pendingCount = totalTests - attemptedCount;

        const testTypeBreakdown = {};
        unitTests.forEach(t => {
          const type = t.testType || 'practice';
          if (!testTypeBreakdown[type]) testTypeBreakdown[type] = { total: 0, attempted: 0 };
          testTypeBreakdown[type].total += 1;
          if (attemptedTestIds.has(t._id?.toString())) testTypeBreakdown[type].attempted += 1;
        });

        const unitAttempts = paperAttempts.filter(a => {
          const testUnit = a.testId?.unit;
          return matchUnit(testUnit, unit);
        });

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

        const accuracy = topicData.total > 0 ? Math.round((topicData.correct / topicData.total) * 100) : 0;
        const bestScore = unitAttempts.length > 0
          ? Math.max(...unitAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0))
          : 0;
        const avgScore = unitAttempts.length > 0
          ? Math.round(unitAttempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / unitAttempts.length)
          : 0;

        let coverageScore = 0, maxPossibleScore = 0;
        Object.entries(testTypeBreakdown).forEach(([type, data]) => {
          const weight = TEST_TYPE_WEIGHTS[type] || 15;
          maxPossibleScore += data.total * weight;
          coverageScore += data.attempted * weight;
        });
        const coveragePct = maxPossibleScore > 0 ? Math.round((coverageScore / maxPossibleScore) * 100) : 0;

        let level = 'not_started';
        if (totalTests === 0) level = 'no_tests';
        else if (attemptedCount === 0) level = 'not_started';
        else if (coveragePct >= 80 && accuracy >= 70) level = 'mastered';
        else if (coveragePct >= 50 && accuracy >= 50) level = 'learning';
        else if (coveragePct >= 25 || attemptedCount >= 1) level = accuracy < 40 ? 'weak' : 'in_progress';
        else level = 'not_started';

        const colorMap = {
          mastered: '#22c55e', learning: '#3b82f6', in_progress: '#f59e0b',
          weak: '#ef4444', not_started: '#d1d5db', no_tests: '#f3f4f6',
        };

        return {
          unit, name: unitNames[unit] || unit,
          totalTests, attemptedCount, pendingCount, testTypeBreakdown,
          accuracy, bestScore, avgScore,
          correct: topicData.correct, wrong: topicData.wrong, skipped: topicData.skipped, questionsAttempted: topicData.total,
          coveragePct, level, color: colorMap[level] || '#d1d5db',
          totalAttempts: unitAttempts.length,
        };
      });
    };

    const p1Coverage = buildCoverage(PAPER1_UNITS, PAPER1_UNIT_NAMES, 'paper1', paper1Tests, paper1Attempts);
    const p2Coverage = buildCoverage(PAPER2_UNITS, PAPER2_UNIT_NAMES, 'paper2', paper2Tests, paper2Attempts);

    const calcSummary = (coverage) => {
      const total = coverage.length;
      const mastered = coverage.filter(c => c.level === 'mastered').length;
      const learning = coverage.filter(c => c.level === 'learning').length;
      const inProgress = coverage.filter(c => c.level === 'in_progress').length;
      const weak = coverage.filter(c => c.level === 'weak').length;
      const notStarted = coverage.filter(c => c.level === 'not_started').length;
      const noTests = coverage.filter(c => c.level === 'no_tests').length;

      const totalPossible = total * 100;
      const achieved = coverage.reduce((s, c) => {
        if (c.level === 'mastered') return s + 100;
        if (c.level === 'learning') return s + 65;
        if (c.level === 'in_progress') return s + 35;
        if (c.level === 'weak') return s + 15;
        return s;
      }, 0);
      const overallPct = totalPossible > 0 ? Math.round((achieved / totalPossible) * 100) : 0;

      const totalTestsCreated = coverage.reduce((s, c) => s + c.totalTests, 0);
      const totalTestsAttempted = coverage.reduce((s, c) => s + c.attemptedCount, 0);
      const totalTestsPending = coverage.reduce((s, c) => s + c.pendingCount, 0);

      return {
        total, mastered, learning, inProgress, weak, notStarted, noTests, overallPct,
        totalTestsCreated, totalTestsAttempted, totalTestsPending,
      };
    };

    const p1Summary = calcSummary(p1Coverage);
    const p2Summary = calcSummary(p2Coverage);

    return {
      paper1: p1Coverage, paper2: p2Coverage,
      paper1Summary: p1Summary, paper2Summary: p2Summary,
      overallPct: Math.round((p1Summary.overallPct + p2Summary.overallPct) / 2),
    };
  }, [paper1Tests, paper2Tests, paper1Attempts, paper2Attempts]);

  // ════════════════════════════════════════════════════════════
  //  JRF PROBABILITY METER
  // ════════════════════════════════════════════════════════════
  const jrfProbability = useMemo(() => {
    if (allCompletedAttempts.length < 3) {
      return {
        netProbability: 0, jrfProbability: 0,
        predictedP1: 0, predictedP2: 0, predictedTotal: 0,
        netCutoff: NET_CUTOFF, jrfCutoff: JRF_CUTOFF,
        confidence: 'low', factors: [], suggestions: [],
        riskLevel: 'unknown', consistencyScore: 0, dataPoints: allCompletedAttempts.length,
        p1Trend: 'neutral', p2Trend: 'neutral',
      };
    }

    const p1Scores = paper1Attempts.filter(a => a.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(-10).map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);
    const p2Scores = paper2Attempts.filter(a => a.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(-10).map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);

    const weightedAvg = (scores) => {
      if (scores.length === 0) return 0;
      let tw = 0, ws = 0;
      scores.forEach((s, i) => { const w = 1 + (i / scores.length) * 2; ws += s * w; tw += w; });
      return tw > 0 ? ws / tw : 0;
    };

    const trendAdj = (scores) => {
      if (scores.length < 3) return 0;
      const half = Math.floor(scores.length / 2);
      const oldAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const newAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
      return (newAvg - oldAvg) * 0.3;
    };

    const p1Adj = Math.min(100, Math.max(0, weightedAvg(p1Scores) + trendAdj(p1Scores)));
    const p2Adj = Math.min(100, Math.max(0, weightedAvg(p2Scores) + trendAdj(p2Scores)));

    const predictedP1 = Math.round(p1Adj);
    const predictedP2 = Math.round(p2Adj);
    const predictedTotal = Math.round((predictedP1 + predictedP2) / 2);

    const stdDev = (scores) => {
      if (scores.length < 2) return 50;
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      return Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);
    };
    const allScores = [...p1Scores, ...p2Scores];
    const sd = stdDev(allScores);
    const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - sd * 2)));

    const netGap = predictedTotal - NET_CUTOFF;
    let netProb;
    if (netGap >= 20) netProb = 95;
    else if (netGap >= 10) netProb = 75 + (netGap - 10) * 2;
    else if (netGap >= 5) netProb = 55 + (netGap - 5) * 4;
    else if (netGap >= 0) netProb = 35 + netGap * 4;
    else if (netGap >= -10) netProb = 10 + (netGap + 10) * 2.5;
    else netProb = Math.max(3, 10 + netGap);

    const jrfGap = predictedTotal - JRF_CUTOFF;
    let jrfProb;
    if (jrfGap >= 15) jrfProb = 92;
    else if (jrfGap >= 8) jrfProb = 68 + (jrfGap - 8) * 3.4;
    else if (jrfGap >= 3) jrfProb = 42 + (jrfGap - 3) * 5.2;
    else if (jrfGap >= 0) jrfProb = 25 + jrfGap * 5.7;
    else if (jrfGap >= -8) jrfProb = 8 + (jrfGap + 8) * 2.1;
    else jrfProb = Math.max(2, 8 + jrfGap);

    const cMod = (consistencyScore - 50) / 100;
    netProb = Math.min(99, Math.max(1, Math.round(netProb + cMod * 10)));
    jrfProb = Math.min(99, Math.max(1, Math.round(jrfProb + cMod * 10)));

    const covPct = syllabusCoverage.overallPct || 0;
    if (covPct >= 70) { netProb = Math.min(99, netProb + 3); jrfProb = Math.min(99, jrfProb + 2); }
    else if (covPct < 30) { netProb = Math.max(1, netProb - 5); jrfProb = Math.max(1, jrfProb - 5); }

    const dataPoints = p1Scores.length + p2Scores.length;
    const confidence = dataPoints >= 15 ? 'high' : dataPoints >= 8 ? 'medium' : 'low';

    let riskLevel;
    if (jrfProb >= 65) riskLevel = 'safe';
    else if (jrfProb >= 40) riskLevel = 'moderate';
    else if (jrfProb >= 20) riskLevel = 'risky';
    else riskLevel = 'critical';

    const factors = [];
    if (paper1Accuracy >= 70) factors.push({ type: 'positive', text: `P1 accuracy ${paper1Accuracy}% (≥70%)` });
    else factors.push({ type: 'negative', text: `P1 accuracy ${paper1Accuracy}% (need 70%+)` });
    if (paper2Accuracy >= 70) factors.push({ type: 'positive', text: `P2 accuracy ${paper2Accuracy}% (≥70%)` });
    else factors.push({ type: 'negative', text: `P2 accuracy ${paper2Accuracy}% (need 70%+)` });
    if (predictedTotal >= JRF_CUTOFF) factors.push({ type: 'positive', text: `Predicted ${predictedTotal}% ≥ JRF cutoff ${JRF_CUTOFF}%` });
    else if (predictedTotal >= NET_CUTOFF) factors.push({ type: 'positive', text: `Predicted ${predictedTotal}% ≥ NET cutoff ${NET_CUTOFF}%` });
    else factors.push({ type: 'negative', text: `Predicted ${predictedTotal}% < NET cutoff ${NET_CUTOFF}%` });
    if (streak >= 7) factors.push({ type: 'positive', text: `${streak}-day study streak` });
    else if (streak < 3) factors.push({ type: 'negative', text: 'Low study consistency' });
    if (consistencyScore >= 60) factors.push({ type: 'positive', text: `High consistency (${consistencyScore}%)` });
    else factors.push({ type: 'negative', text: `Score variance high (${consistencyScore}%)` });
    if (covPct >= 60) factors.push({ type: 'positive', text: `Syllabus coverage ${covPct}%` });
    else factors.push({ type: 'negative', text: `Syllabus coverage only ${covPct}%` });

    const suggestions = [];
    if (predictedP1 < NET_CUTOFF) suggestions.push(`Paper 1 needs ${NET_CUTOFF}%+. Current: ${predictedP1}%`);
    if (predictedP2 < NET_CUTOFF) suggestions.push(`Paper 2 needs ${NET_CUTOFF}%+. Current: ${predictedP2}%`);
    if (predictedTotal < JRF_CUTOFF && predictedTotal >= NET_CUTOFF) suggestions.push(`For JRF, need ${JRF_CUTOFF}%+. Gap: ${JRF_CUTOFF - predictedTotal}%`);
    if (consistencyScore < 50) suggestions.push('Be more consistent - avoid wild score swings');
    if (covPct < 50) suggestions.push('Cover more syllabus units - attempt pending tests');
    if (streak < 5) suggestions.push('Maintain daily practice streak');
    if (notAttemptedTests.length > 10) suggestions.push(`Complete ${notAttemptedTests.length} pending tests`);
    if (p1Scores.length < 5) suggestions.push('Take more Paper 1 tests for better prediction');
    if (p2Scores.length < 5) suggestions.push('Take more Paper 2 tests for better prediction');

    return {
      netProbability: netProb, jrfProbability: jrfProb,
      predictedP1, predictedP2, predictedTotal,
      netCutoff: NET_CUTOFF, jrfCutoff: JRF_CUTOFF,
      confidence, factors, suggestions, riskLevel, consistencyScore,
      p1Trend: paper1TrendDir, p2Trend: paper2TrendDir, dataPoints,
    };
  }, [allCompletedAttempts, paper1Attempts, paper2Attempts, paper1Accuracy, paper2Accuracy,
    streak, paper1TrendDir, paper2TrendDir, notAttemptedTests, syllabusCoverage]);

  // ════════════════════════════════════════════════════════════
  //  🆕 FULLY WORKING GOAL TRACKER (Replaced old section)
  // ════════════════════════════════════════════════════════════
  const setExamDate = useCallback((date) => {
    setExamDateState(date);
    try { localStorage.setItem('netprep_exam_date', date); } catch {}
  }, []);

  const updateCustomTargets = useCallback((targets) => {
    setCustomTargets(targets);
    try { localStorage.setItem('netprep_custom_targets', JSON.stringify(targets)); } catch {}
  }, []);

  const daysUntilExam = useMemo(() => {
    if (!examDate) return null;
    return Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000));
  }, [examDate]);

  // ── TODAY'S DETAILED ACTIVITY (Real data, not dummy) ──
  const todayKey = new Date().toISOString().split('T')[0];

  const todayDetailed = useMemo(() => {
    const todayStr = todayKey;

    const todayAttempts = allCompletedAttempts.filter(a => {
      const d = new Date(a.completedAt || a.createdAt).toISOString().split('T')[0];
      return d === todayStr;
    });

    const todayTestIds = new Set(todayAttempts.map(a =>
      a.testId?._id?.toString() || a.testId?.toString()
    ));

    let pendingCleared = 0;
    let weakRetried = 0;

    todayAttempts.forEach(a => {
      const tid = a.testId?._id?.toString() || a.testId?.toString();
      if (!tid) return;

      const previousAttempts = allCompletedAttempts.filter(prev => {
        const prevTid = prev.testId?._id?.toString() || prev.testId?.toString();
        const prevDate = new Date(prev.completedAt || prev.createdAt).toISOString().split('T')[0];
        return prevTid === tid && prevDate !== todayStr;
      });

      if (previousAttempts.length === 0) {
        pendingCleared++;
      } else {
        const prevBest = Math.max(
          ...previousAttempts.map(p =>
            p.totalMarks > 0 ? Math.round((p.score / p.totalMarks) * 100) : 0
          )
        );
        if (prevBest < 50) weakRetried++;
      }
    });

    const todayScores = todayAttempts.map(a =>
      a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0
    );
    const bestToday = todayScores.length > 0 ? Math.max(...todayScores) : 0;
    const avgToday = todayScores.length > 0
      ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length) : 0;

    const todayCorrect = todayAttempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const todayWrong = todayAttempts.reduce((s, a) => s + (a.wrongCount || 0), 0);
    const todaySkipped = todayAttempts.reduce((s, a) => s + (a.skippedCount || 0), 0);
    const todayAccuracy = (todayCorrect + todayWrong) > 0
      ? Math.round((todayCorrect / (todayCorrect + todayWrong)) * 100) : 0;

    const todayTime = todayAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0);

    const p1Today = todayAttempts.filter(a => a.testId?.paper === 'paper1').length;
    const p2Today = todayAttempts.filter(a => a.testId?.paper === 'paper2').length;

    const totalQuestionsSolved = todayCorrect + todayWrong + todaySkipped;

    const scoresAboveTarget = todayScores.filter(s => s >= (customTargets.targetScore || 75)).length;

    const perfectScores = todayScores.filter(s => s >= 90).length;

    return {
      count: todayAttempts.length,
      pendingCleared,
      weakRetried,
      bestScore: bestToday,
      avgScore: avgToday,
      avgAccuracy: todayAccuracy,
      accuracy: todayAccuracy,
      timeSpent: todayTime,
      p1Count: p1Today,
      p2Count: p2Today,
      correct: todayCorrect,
      wrong: todayWrong,
      skipped: todaySkipped,
      totalQuestionsSolved,
      scoresAboveTarget,
      perfectScores,
      attempts: todayAttempts,
      scores: todayScores,
    };
  }, [allCompletedAttempts, todayKey, customTargets]);

  const todayActivity = todayDetailed;

  // ── YESTERDAY'S ACTIVITY ──
  const yesterdayActivity = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().split('T')[0];
    const data = activityMap[yKey];
    return data || { count: 0, avgScore: 0, avgAccuracy: 0 };
  }, [activityMap]);

  // ── GOAL STREAK ──
  const [goalHistory, setGoalHistoryState] = useState(() => {
    try {
      const saved = localStorage.getItem('netprep_goal_history');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const updateGoalHistory = useCallback((date, completed) => {
    setGoalHistoryState(prev => {
      const next = { ...prev, [date]: completed };
      try { localStorage.setItem('netprep_goal_history', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const goalStreak = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 1; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      if (goalHistory[k] === true) count++;
      else break;
    }
    return count;
  }, [goalHistory]);

  // ── DAY PROGRESS ──
  const dayProgress = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const studyStart = 6 * 60;
    const studyEnd = 23 * 60;
    const studyDuration = studyEnd - studyStart;
    const elapsed = Math.max(0, Math.min(totalMinutes - studyStart, studyDuration));
    const pct = Math.round((elapsed / studyDuration) * 100);
    const remaining = Math.max(0, studyEnd - totalMinutes);
    const remainingHours = Math.floor(remaining / 60);
    const remainingMins = remaining % 60;

    let period = 'morning';
    if (hours >= 17) period = 'evening';
    else if (hours >= 12) period = 'afternoon';
    else if (hours < 6) period = 'night';

    return {
      pct: Math.min(100, Math.max(0, pct)),
      remainingHours,
      remainingMins,
      totalRemaining: remaining,
      period,
      isLateNight: hours >= 23 || hours < 6,
      isPastHalf: pct > 50,
      isAlmostOver: pct > 80,
      currentHour: hours,
    };
  }, []);

  // ── XP SYSTEM ──
  const todayXP = useMemo(() => {
    let xp = 0;
    const td = todayDetailed;
    xp += td.count * 10;
    if (td.accuracy >= 80) xp += td.count * 5;
    else if (td.accuracy >= 70) xp += td.count * 3;
    xp += td.perfectScores * 15;
    xp += td.pendingCleared * 8;
    xp += td.weakRetried * 12;
    xp += Math.min(streak, 7) * 2;
    return xp;
  }, [todayDetailed, streak]);

  // ── AUTO-GENERATED GOALS ──
  const autoGeneratedGoals = useMemo(() => {
    const goals = [];
    const { dailyTests, dailyAccuracy, targetScore } = customTargets;
    const td = todayDetailed;
    const dp = dayProgress;

    goals.push({
      id: 'daily_tests',
      title: `Complete ${dailyTests} tests today`,
      titleHi: `आज ${dailyTests} टेस्ट पूरे करें`,
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
        ? `पूरा! ${td.count} टेस्ट दिए`
        : `${dailyTests - td.count} और बाकी`,
      urgency: td.count < dailyTests && dp.isPastHalf ? 'high' : 'normal',
    });

    goals.push({
      id: 'daily_accuracy',
      title: `Score ${dailyAccuracy}%+ accuracy`,
      titleHi: `${dailyAccuracy}%+ सटीकता हासिल करें`,
      icon: 'Target',
      target: dailyAccuracy,
      current: td.count > 0 ? td.accuracy : 0,
      type: 'percentage',
      color: 'emerald',
      priority: 'high',
      xp: 15,
      description: td.count === 0
        ? 'Take a test to start tracking'
        : td.accuracy >= dailyAccuracy
        ? `Great! ${td.accuracy}% accuracy`
        : `Current: ${td.accuracy}%. Need ${dailyAccuracy - td.accuracy}% more`,
      descriptionHi: td.count === 0
        ? 'ट्रैकिंग शुरू करने के लिए टेस्ट दें'
        : td.accuracy >= dailyAccuracy
        ? `बढ़िया! ${td.accuracy}% सटीकता`
        : `अभी: ${td.accuracy}%। ${dailyAccuracy - td.accuracy}% और चाहिए`,
      urgency: td.count > 0 && td.accuracy < dailyAccuracy ? 'medium' : 'normal',
    });

    const last5Avg = scoreTrend.slice(-5).reduce((s, d) => s + d.score, 0) / (Math.min(scoreTrend.length, 5) || 1);
    const improvTarget = Math.min(100, Math.round(last5Avg + 5));
    const bestTodayScore = td.bestScore;
    goals.push({
      id: 'beat_average',
      title: `Score ${improvTarget}%+ in a test`,
      titleHi: `किसी टेस्ट में ${improvTarget}%+ लाएं`,
      icon: 'TrendingUp',
      target: improvTarget,
      current: bestTodayScore,
      type: 'percentage',
      color: 'purple',
      priority: 'high',
      xp: 20,
      description: bestTodayScore >= improvTarget
        ? `Achieved! Best today: ${bestTodayScore}%`
        : td.count === 0
        ? `Beat your recent average of ${Math.round(last5Avg)}%`
        : `Best today: ${bestTodayScore}%. Target: ${improvTarget}%`,
      descriptionHi: bestTodayScore >= improvTarget
        ? `हासिल! आज का सर्वश्रेष्ठ: ${bestTodayScore}%`
        : td.count === 0
        ? `हाल के औसत ${Math.round(last5Avg)}% को तोड़ें`
        : `आज का सर्वश्रेष्ठ: ${bestTodayScore}%`,
      urgency: td.count > 2 && bestTodayScore < improvTarget ? 'high' : 'normal',
    });

    const pendingTarget = Math.min(2, notAttemptedTests.length);
    if (notAttemptedTests.length > 0) {
      goals.push({
        id: 'clear_pending',
        title: `Clear ${pendingTarget} pending test${pendingTarget > 1 ? 's' : ''}`,
        titleHi: `${pendingTarget} बाकी टेस्ट पूरे करें`,
        icon: 'Clock',
        target: pendingTarget,
        current: td.pendingCleared,
        type: 'count',
        color: 'amber',
        priority: 'medium',
        xp: 8,
        description: td.pendingCleared >= pendingTarget
          ? `Done! ${td.pendingCleared} pending tests cleared`
          : `${notAttemptedTests.length} total pending. Clear ${pendingTarget - td.pendingCleared} more`,
        descriptionHi: td.pendingCleared >= pendingTarget
          ? `पूरा! ${td.pendingCleared} बाकी टेस्ट दिए`
          : `कुल ${notAttemptedTests.length} बाकी। ${pendingTarget - td.pendingCleared} और दें`,
        urgency: notAttemptedTests.length > 10 ? 'high' : 'normal',
      });
    }

    if (needsAttentionTests.length > 0) {
      goals.push({
        id: 'retry_weak',
        title: 'Retry 1 low-score test (<50%)',
        titleHi: '1 कम स्कोर (<50%) वाला दोबारा दें',
        icon: 'RefreshCw',
        target: 1,
        current: td.weakRetried,
        type: 'count',
        color: 'red',
        priority: 'high',
        xp: 12,
        description: td.weakRetried >= 1
          ? `Done! Retried ${td.weakRetried} weak test(s)`
          : `${needsAttentionTests.length} tests below 50%. Retry one!`,
        descriptionHi: td.weakRetried >= 1
          ? `पूरा! ${td.weakRetried} कमजोर टेस्ट दोबारा दिया`
          : `${needsAttentionTests.length} टेस्ट 50% से कम। एक दोबारा दें!`,
        urgency: needsAttentionTests.length > 3 ? 'high' : 'normal',
      });
    }

    goals.push({
      id: 'maintain_streak',
      title: streak > 0 ? `Extend ${streak}-day streak to ${streak + 1}` : 'Start a study streak',
      titleHi: streak > 0 ? `${streak}-दिन स्ट्रीक को ${streak + 1} बनाएं` : 'अध्ययन स्ट्रीक शुरू करें',
      icon: 'Flame',
      target: 1,
      current: td.count > 0 ? 1 : 0,
      type: 'count',
      color: 'orange',
      priority: td.count === 0 && dp.isPastHalf ? 'critical' : 'medium',
      xp: 5 + Math.min(streak, 10),
      description: td.count > 0
        ? `Streak secured! ${streak + 1} days!`
        : streak > 0
        ? `Don't break your ${streak}-day streak!`
        : 'Take 1 test to start your streak',
      descriptionHi: td.count > 0
        ? `स्ट्रीक पक्की! ${streak + 1} दिन!`
        : streak > 0
        ? `अपनी ${streak}-दिन स्ट्रीक मत तोड़ो!`
        : '1 टेस्ट दो स्ट्रीक शुरू करो',
      urgency: td.count === 0 && dp.isAlmostOver ? 'critical' : td.count === 0 && dp.isPastHalf ? 'high' : 'normal',
    });

    const timeTarget = 30;
    const todayMins = Math.round(td.timeSpent / 60);
    goals.push({
      id: 'study_time',
      title: `Study ${timeTarget}+ minutes today`,
      titleHi: `आज ${timeTarget}+ मिनट पढ़ाई करें`,
      icon: 'Timer',
      target: timeTarget,
      current: todayMins,
      type: 'count',
      color: 'cyan',
      priority: 'medium',
      xp: 10,
      description: todayMins >= timeTarget
        ? `Done! ${todayMins} minutes studied`
        : `${todayMins}/${timeTarget} minutes. ${timeTarget - todayMins} more`,
      descriptionHi: todayMins >= timeTarget
        ? `पूरा! ${todayMins} मिनट पढ़ाई की`
        : `${todayMins}/${timeTarget} मिनट। ${timeTarget - todayMins} और`,
      urgency: 'normal',
    });

    const p1Target = Math.max(1, Math.floor(dailyTests / 2));
    const p2Target = Math.max(1, dailyTests - p1Target);
    if (dailyTests >= 2) {
      goals.push({
        id: 'paper_balance',
        title: `P1: ${p1Target}+ & P2: ${p2Target}+ tests`,
        titleHi: `P1: ${p1Target}+ और P2: ${p2Target}+ टेस्ट`,
        icon: 'BarChart2',
        target: 2,
        current: (td.p1Count >= p1Target ? 1 : 0) + (td.p2Count >= p2Target ? 1 : 0),
        type: 'count',
        color: 'indigo',
        priority: 'low',
        xp: 8,
        description: `P1: ${td.p1Count}/${p1Target} | P2: ${td.p2Count}/${p2Target}`,
        descriptionHi: `P1: ${td.p1Count}/${p1Target} | P2: ${td.p2Count}/${p2Target}`,
        urgency: 'normal',
      });
    }

    const qTarget = dailyTests * 15;
    goals.push({
      id: 'questions_solved',
      title: `Solve ${qTarget}+ questions`,
      titleHi: `${qTarget}+ प्रश्न हल करें`,
      icon: 'Hash',
      target: qTarget,
      current: td.totalQuestionsSolved,
      type: 'count',
      color: 'teal',
      priority: 'low',
      xp: 5,
      description: td.totalQuestionsSolved >= qTarget
        ? `Done! ${td.totalQuestionsSolved} questions solved`
        : `${td.totalQuestionsSolved}/${qTarget} solved`,
      descriptionHi: td.totalQuestionsSolved >= qTarget
        ? `पूरा! ${td.totalQuestionsSolved} प्रश्न हल`
        : `${td.totalQuestionsSolved}/${qTarget} हल`,
      urgency: 'normal',
    });

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    goals.sort((a, b) => {
      const aDone = a.current >= a.target ? 1 : 0;
      const bDone = b.current >= b.target ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    return goals;
  }, [customTargets, todayDetailed, scoreTrend, notAttemptedTests, needsAttentionTests,
    streak, dayProgress]);

  // ── GOAL COMPLETION ──
  const goalCompletionPct = useMemo(() => {
    if (autoGeneratedGoals.length === 0) return 0;
    const done = autoGeneratedGoals.filter(g => g.current >= g.target).length;
    const pct = Math.round((done / autoGeneratedGoals.length) * 100);

    if (pct === 100 && todayDetailed.count > 0) {
      try {
        const existing = JSON.parse(localStorage.getItem('netprep_goal_history') || '{}');
        if (!existing[todayKey]) {
          existing[todayKey] = true;
          localStorage.setItem('netprep_goal_history', JSON.stringify(existing));
        }
      } catch {}
    }

    return pct;
  }, [autoGeneratedGoals, todayDetailed, todayKey]);

  const goalsCompleted = useMemo(() =>
    autoGeneratedGoals.filter(g => g.current >= g.target).length,
  [autoGeneratedGoals]);

  const totalGoals = autoGeneratedGoals.length;

  // ── PRESSURE MESSAGE ──
  const pressureMessage = useMemo(() => {
    const td = todayDetailed;
    const dp = dayProgress;
    const gc = goalsCompleted;
    const tg = totalGoals;

    if (gc === tg && td.count > 0) return { type: 'celebration', en: 'All goals complete! You\'re a champion!', hi: 'सभी लक्ष्य पूरे! आप चैंपियन हैं!' };
    if (td.count === 0 && dp.isAlmostOver) return { type: 'critical', en: 'Day almost over! Take at least 1 test NOW!', hi: 'दिन खत्म हो रहा! अभी कम से कम 1 टेस्ट दो!' };
    if (td.count === 0 && dp.isPastHalf) return { type: 'warning', en: 'Half day gone, 0 tests! Start now!', hi: 'आधा दिन गया, 0 टेस्ट! अभी शुरू करो!' };
    if (td.count === 0) return { type: 'info', en: 'New day, new goals! Start your first test.', hi: 'नया दिन, नए लक्ष्य! पहला टेस्ट शुरू करो।' };
    if (gc < tg / 2 && dp.isPastHalf) return { type: 'warning', en: `Only ${gc}/${tg} goals done. Pick up the pace!`, hi: `सिर्फ ${gc}/${tg} लक्ष्य। तेज करो!` };
    if (gc >= tg / 2) return { type: 'positive', en: `${gc}/${tg} goals done! Keep pushing!`, hi: `${gc}/${tg} लक्ष्य पूरे! जारी रखो!` };
    if (td.accuracy < customTargets.dailyAccuracy) return { type: 'warning', en: `Accuracy ${td.accuracy}% < target ${customTargets.dailyAccuracy}%. Focus!`, hi: `सटीकता ${td.accuracy}% < लक्ष्य ${customTargets.dailyAccuracy}%। ध्यान दो!` };
    return { type: 'info', en: `${tg - gc} goals remaining. You can do it!`, hi: `${tg - gc} लक्ष्य बाकी। आप कर सकते हो!` };
  }, [todayDetailed, dayProgress, goalsCompleted, totalGoals, customTargets]);

  // ════════════════════════════════════════════════════════════
  //  🆕 REVISION QUEUE (Lowest % tests for revision)
  // ════════════════════════════════════════════════════════════
  const revisionQueue = useMemo(() => {
    const testBestScores = {};
    allCompletedAttempts.forEach(a => {
      const tid = a.testId?._id?.toString() || a.testId?.toString();
      if (!tid) return;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const lastDate = a.completedAt || a.createdAt;
      if (!testBestScores[tid] || pct > testBestScores[tid].bestScore) {
        testBestScores[tid] = {
          testId: tid, test: a.testId, bestScore: pct,
          lastAttemptDate: lastDate, attempts: (testBestScores[tid]?.attempts || 0) + 1,
          lastAttempt: a,
        };
      } else {
        testBestScores[tid].attempts += 1;
        if (new Date(lastDate) > new Date(testBestScores[tid].lastAttemptDate)) {
          testBestScores[tid].lastAttemptDate = lastDate;
        }
      }
    });

    return Object.values(testBestScores)
      .sort((a, b) => a.bestScore - b.bestScore)
      .map(t => {
        const daysSince = Math.floor((Date.now() - new Date(t.lastAttemptDate).getTime()) / 86400000);
        const needsRevision = t.bestScore < 70 || daysSince > 7;
        const urgency = t.bestScore < 30 ? 'critical' : t.bestScore < 50 ? 'high' : t.bestScore < 70 ? 'medium' : 'low';
        const retention = Math.max(5, Math.round(100 * Math.exp(-0.08 * daysSince)));
        return { ...t, daysSince, needsRevision, urgency, retention };
      });
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════
  //  🆕 WEAK CHAPTERS LIST (Sorted by worst %)
  // ════════════════════════════════════════════════════════════
  const weakChaptersList = useMemo(() => {
    const chapterMap = {};
    allCompletedAttempts.forEach(a => {
      const unit = a.testId?.unit || 'Unknown';
      const paper = a.testId?.paper || 'unknown';
      const key = `${paper}__${unit}`;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;

      if (!chapterMap[key]) {
        chapterMap[key] = {
          unit, paper, scores: [], attempts: 0,
          totalCorrect: 0, totalWrong: 0, totalSkipped: 0, lastAttempted: null,
        };
      }
      chapterMap[key].scores.push(pct);
      chapterMap[key].attempts += 1;
      chapterMap[key].totalCorrect += (a.correctCount || 0);
      chapterMap[key].totalWrong += (a.wrongCount || 0);
      chapterMap[key].totalSkipped += (a.skippedCount || 0);
      const date = a.completedAt || a.createdAt;
      if (!chapterMap[key].lastAttempted || new Date(date) > new Date(chapterMap[key].lastAttempted)) {
        chapterMap[key].lastAttempted = date;
      }
    });

    return Object.values(chapterMap).map(ch => {
      const avgScore = ch.scores.length > 0 ? Math.round(ch.scores.reduce((a, b) => a + b, 0) / ch.scores.length) : 0;
      const bestScore = ch.scores.length > 0 ? Math.max(...ch.scores) : 0;
      const worstScore = ch.scores.length > 0 ? Math.min(...ch.scores) : 0;
      const totalQ = ch.totalCorrect + ch.totalWrong + ch.totalSkipped;
      const accuracy = (ch.totalCorrect + ch.totalWrong) > 0
        ? Math.round((ch.totalCorrect / (ch.totalCorrect + ch.totalWrong)) * 100) : 0;
      const daysSince = ch.lastAttempted
        ? Math.floor((Date.now() - new Date(ch.lastAttempted).getTime()) / 86400000) : 999;
      let status = 'strong';
      if (avgScore < 30) status = 'critical';
      else if (avgScore < 50) status = 'weak';
      else if (avgScore < 70) status = 'average';

      return { ...ch, avgScore, bestScore, worstScore, accuracy, totalQ, daysSince, status };
    }).sort((a, b) => a.avgScore - b.avgScore);
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════
  //  🆕 FORGETTING CURVE DATA (Spaced Repetition)
  // ════════════════════════════════════════════════════════════
  const forgettingCurveData = useMemo(() => {
    const intervals = [1, 3, 7, 14, 30];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const topicLast = {};
    allCompletedAttempts.forEach(a => {
      const unit = a.testId?.unit;
      const paper = a.testId?.paper;
      if (!unit) return;
      const key = `${paper}__${unit}`;
      const date = new Date(a.completedAt || a.createdAt);
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (!topicLast[key] || date > topicLast[key].date) {
        topicLast[key] = { date, unit, paper, lastScore: pct, testTitle: a.testId?.title };
      }
    });

    const dueForRevision = [];
    const upcoming = [];
    const safe = [];

    Object.entries(topicLast).forEach(([key, data]) => {
      const daysSince = Math.floor((today - data.date) / 86400000);
      let nextInterval = intervals[intervals.length - 1];
      for (const iv of intervals) { if (daysSince < iv) { nextInterval = iv; break; } }
      const daysUntilDue = nextInterval - daysSince;
      const isOverdue = daysUntilDue <= 0;
      const retention = Math.max(5, Math.round(100 * Math.exp(-0.08 * daysSince)));
      const urgency = isOverdue ? (daysSince > 14 ? 'critical' : 'high') : (daysUntilDue <= 2 ? 'medium' : 'low');

      const item = { ...data, key, daysSince, daysUntilDue, isOverdue, retention, urgency, nextInterval };

      if (isOverdue) dueForRevision.push(item);
      else if (daysUntilDue <= 3) upcoming.push(item);
      else safe.push(item);
    });

    dueForRevision.sort((a, b) => b.daysSince - a.daysSince);
    upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return {
      dueForRevision, upcoming, safe,
      totalTopics: Object.keys(topicLast).length,
      overdueCount: dueForRevision.length,
      avgRetention: Object.values(topicLast).length > 0
        ? Math.round(Object.values(topicLast).reduce((s, t) => {
            const ds = Math.floor((today - t.date) / 86400000);
            return s + Math.max(5, Math.round(100 * Math.exp(-0.08 * ds)));
          }, 0) / Object.values(topicLast).length)
        : 0,
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════
  //  🆕 FATIGUE ANALYSIS (Session performance drop)
  // ════════════════════════════════════════════════════════════
  const fatigueAnalysis = useMemo(() => {
    const sorted = [...allCompletedAttempts]
      .filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
    const sessions = [];
    let cur = [];

    sorted.forEach((a, i) => {
      if (i === 0) { cur.push(a); return; }
      const gap = (new Date(a.completedAt) - new Date(sorted[i - 1].completedAt)) / 60000;
      if (gap <= 60) cur.push(a);
      else { if (cur.length >= 2) sessions.push([...cur]); cur = [a]; }
    });
    if (cur.length >= 2) sessions.push(cur);

    const posData = {};
    sessions.forEach(sess => {
      sess.forEach((a, pos) => {
        if (!posData[pos]) posData[pos] = { scores: [], accs: [] };
        posData[pos].scores.push(a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0);
        const att = (a.correctCount || 0) + (a.wrongCount || 0);
        posData[pos].accs.push(att > 0 ? Math.round((a.correctCount / att) * 100) : 0);
      });
    });

    const chart = Object.entries(posData).map(([pos, d]) => ({
      position: parseInt(pos) + 1,
      name: `Test ${parseInt(pos) + 1}`,
      avgScore: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
      avgAccuracy: d.accs.length > 0 ? Math.round(d.accs.reduce((a, b) => a + b, 0) / d.accs.length) : 0,
      count: d.scores.length,
    })).sort((a, b) => a.position - b.position).slice(0, 10);

    let optimal = chart.length;
    for (let i = 1; i < chart.length; i++) {
      if (chart[i].avgScore < chart[0].avgScore * 0.8) { optimal = i; break; }
    }

    const first = chart.length > 0 ? chart[0].avgScore : 0;
    const last = chart.length > 1 ? chart[chart.length - 1].avgScore : first;
    const drop = first > 0 ? Math.round(((first - last) / first) * 100) : 0;

    return {
      sessions: sessions.length,
      avgSessionLen: sessions.length > 0 ? Math.round(sessions.reduce((s, ss) => s + ss.length, 0) / sessions.length) : 0,
      chart, optimalTests: optimal, dropPct: drop,
      rec: optimal <= 2 ? 'Take breaks after every 2 tests' : optimal <= 4 ? 'Take a break after 3-4 tests' : 'Good stamina! Keep going',
      recHi: optimal <= 2 ? 'हर 2 टेस्ट बाद ब्रेक लें' : optimal <= 4 ? '3-4 टेस्ट बाद ब्रेक लें' : 'अच्छी स्टैमिना! जारी रखें',
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════
  //  🆕 DAILY CHALLENGE (Changes every day)
  // ════════════════════════════════════════════════════════════
  const dailyChallenge = useMemo(() => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const idx = ((seed * 9301 + 49297) % 233280) % 8;
    const td = todayDetailed;

    const challenges = [
      { id: 'perfect', title: 'Score 90%+ in any test', titleHi: 'किसी टेस्ट में 90%+ लाओ', xp: 50, icon: 'Star', color: 'amber', target: 1, current: td.perfectScores, type: 'count' },
      { id: 'speed', title: 'Avg under 30s per question', titleHi: '30s/प्रश्न से कम में पूरा करो', xp: 40, icon: 'Zap', color: 'cyan', target: 1, current: td.attempts?.filter(a => { const q = (a.correctCount || 0) + (a.wrongCount || 0) + (a.skippedCount || 0); return q > 0 && (a.totalTimeTaken || 0) / q < 30; }).length || 0, type: 'count' },
      { id: 'acc', title: 'Get 85%+ accuracy today', titleHi: 'आज 85%+ सटीकता लाओ', xp: 45, icon: 'Target', color: 'emerald', target: 85, current: td.accuracy, type: 'pct' },
      { id: 'marathon', title: 'Complete 5 tests today', titleHi: 'आज 5 टेस्ट पूरे करो', xp: 35, icon: 'Flame', color: 'orange', target: 5, current: td.count, type: 'count' },
      { id: 'noskip', title: '0 skips in a test', titleHi: 'बिना skip के टेस्ट करो', xp: 30, icon: 'Shield', color: 'blue', target: 1, current: td.attempts?.filter(a => (a.skippedCount || 0) === 0).length || 0, type: 'count' },
      { id: 'weak', title: 'Improve a weak test (<50%)', titleHi: 'कमजोर टेस्ट सुधारो', xp: 55, icon: 'RefreshCw', color: 'red', target: 1, current: td.weakRetried, type: 'count' },
      { id: 'both', title: 'Attempt Paper 1 & Paper 2', titleHi: 'दोनों पेपर से टेस्ट दो', xp: 25, icon: 'BarChart2', color: 'indigo', target: 2, current: (td.p1Count > 0 ? 1 : 0) + (td.p2Count > 0 ? 1 : 0), type: 'count' },
      { id: 'hour', title: 'Study 60+ minutes', titleHi: '60+ मिनट पढ़ाई करो', xp: 40, icon: 'Timer', color: 'purple', target: 60, current: Math.round(td.timeSpent / 60), type: 'count' },
    ];

    const ch = challenges[idx];
    const done = ch.type === 'pct' ? ch.current >= ch.target : ch.current >= ch.target;
    return { ...ch, completed: done, pct: Math.min(100, Math.round((ch.current / Math.max(ch.target, 1)) * 100)) };
  }, [todayDetailed]);

  // ════════════════════════════════════════════════════════════
  //  🆕 PLAYER LEVEL SYSTEM (XP-based)
  // ════════════════════════════════════════════════════════════
  const playerLevel = useMemo(() => {
    let xp = 0;
    xp += allCompletedAttempts.length * 10;
    allCompletedAttempts.forEach(a => {
      const p = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (p >= 90) xp += 20; else if (p >= 80) xp += 15; else if (p >= 70) xp += 10; else if (p >= 60) xp += 5;
    });
    xp += streak * 5;
    xp += longestStreak * 10;
    xp += (syllabusCoverage.overallPct || 0) * 2;
    xp += achievements.filter(a => a.unlocked).length * 25;

    const levels = [
      { level: 1, name: 'Beginner', nameHi: 'शुरुआती', xp: 0, color: 'gray' },
      { level: 2, name: 'Learner', nameHi: 'सीखने वाला', xp: 100, color: 'blue' },
      { level: 3, name: 'Practitioner', nameHi: 'अभ्यासी', xp: 300, color: 'green' },
      { level: 4, name: 'Scholar', nameHi: 'विद्वान', xp: 600, color: 'purple' },
      { level: 5, name: 'Expert', nameHi: 'विशेषज्ञ', xp: 1000, color: 'indigo' },
      { level: 6, name: 'Master', nameHi: 'मास्टर', xp: 1500, color: 'amber' },
      { level: 7, name: 'Grandmaster', nameHi: 'ग्रैंडमास्टर', xp: 2500, color: 'orange' },
      { level: 8, name: 'Legend', nameHi: 'लीजेंड', xp: 4000, color: 'red' },
    ];

    let cur = levels[0], nxt = levels[1];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (xp >= levels[i].xp) { cur = levels[i]; nxt = levels[i + 1] || null; break; }
    }
    const inLevel = xp - cur.xp;
    const forNext = nxt ? nxt.xp - cur.xp : 0;
    const pct = forNext > 0 ? Math.round((inLevel / forNext) * 100) : 100;

    return { totalXP: xp, current: cur, next: nxt, inLevel, forNext, pct };
  }, [allCompletedAttempts, streak, longestStreak, syllabusCoverage, achievements]);

  // ════════════════════════════════════════════════════════════
  //  🆕 NEGATIVE MARKING IMPACT
  // ════════════════════════════════════════════════════════════
  const negativeMarkingImpact = useMemo(() => {
    if (allCompletedAttempts.length === 0) return null;
    let totalNeg = 0, totalWrong = 0, testsWithNeg = 0;

    allCompletedAttempts.forEach(a => {
      const w = a.wrongCount || 0;
      if (w > 0) {
        totalNeg += w * (1 / 3);
        totalWrong += w;
        testsWithNeg++;
      }
    });

    const avgPer = testsWithNeg > 0 ? Math.round((totalNeg / testsWithNeg) * 10) / 10 : 0;
    const potential = Math.round(totalNeg);

    return {
      totalNeg: Math.round(totalNeg * 10) / 10, totalWrong, avgPer, testsWithNeg,
      potential, totalTests: allCompletedAttempts.length,
      rec: avgPer > 3 ? 'Skip uncertain questions' : avgPer > 1 ? 'Guess less, skip more' : 'Good balance!',
      recHi: avgPer > 3 ? 'अनिश्चित प्रश्न छोड़ें' : avgPer > 1 ? 'कम अंदाजे लगाएं' : 'अच्छा संतुलन!',
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════
  //  🆕 WEEKLY REPORT DATA
  // ════════════════════════════════════════════════════════════
  const weeklyReportData = useMemo(() => {
    const now = new Date();
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay()); ws.setHours(0, 0, 0, 0);
    const wa = allCompletedAttempts.filter(a => new Date(a.completedAt) >= ws);

    const daily = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(ws); day.setDate(day.getDate() + i);
      const ds = day.toISOString().split('T')[0];
      const da = wa.filter(a => new Date(a.completedAt).toISOString().split('T')[0] === ds);
      const sc = da.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0);
      daily.push({
        day: day.toLocaleDateString('en', { weekday: 'short' }),
        date: ds, tests: da.length,
        avgScore: sc.length > 0 ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : 0,
        isToday: ds === todayKey,
      });
    }

    const sc = wa.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0);
    const tc = wa.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tw = wa.reduce((s, a) => s + (a.wrongCount || 0), 0);

    return {
      daily, totalTests: wa.length,
      avgScore: sc.length > 0 ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : 0,
      bestScore: sc.length > 0 ? Math.max(...sc) : 0,
      accuracy: (tc + tw) > 0 ? Math.round((tc / (tc + tw)) * 100) : 0,
      totalTime: wa.reduce((s, a) => s + (a.totalTimeTaken || 0), 0),
      activeDays: daily.filter(d => d.tests > 0).length,
      totalCorrect: tc, totalWrong: tw,
    };
  }, [allCompletedAttempts, todayKey]);

  // ════════════════════════════════════════════════════════════
  //  🆕 ADVANCED EXAM COUNTDOWN
  // ════════════════════════════════════════════════════════════
  const advancedCountdown = useMemo(() => {
    if (!examDate) return null;
    const exam = new Date(examDate);
    const now = new Date();
    const totalDays = Math.max(0, Math.ceil((exam - now) / 86400000));
    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;
    const months = Math.floor(totalDays / 30);
    const hours = Math.max(0, Math.ceil((exam - now) / 3600000));

    let phase, phaseHi, phaseColor;
    if (totalDays > 90) { phase = 'Foundation'; phaseHi = 'नींव'; phaseColor = 'emerald'; }
    else if (totalDays > 60) { phase = 'Building'; phaseHi = 'निर्माण'; phaseColor = 'blue'; }
    else if (totalDays > 30) { phase = 'Practice'; phaseHi = 'अभ्यास'; phaseColor = 'amber'; }
    else if (totalDays > 7) { phase = 'Revision'; phaseHi = 'रिवीजन'; phaseColor = 'orange'; }
    else { phase = 'Final Sprint'; phaseHi = 'अंतिम दौड़'; phaseColor = 'red'; }

    const pending = notAttemptedTests.length;
    const testsPerDay = totalDays > 0 ? Math.ceil(pending / totalDays) : pending;
    const testsPerWeek = weeks > 0 ? Math.ceil(pending / weeks) : pending;

    const uncovered = syllabusCoverage.paper1.filter(u => u.level === 'not_started' || u.level === 'no_tests').length +
      syllabusCoverage.paper2.filter(u => u.level === 'not_started' || u.level === 'no_tests').length;

    const milestones = [];
    [90, 60, 30, 14, 7, 3, 1].forEach(d => {
      if (totalDays >= d) milestones.push({ days: d, done: false });
      else milestones.push({ days: d, done: true });
    });

    const readiness = Math.round(
      ((syllabusCoverage.overallPct || 0) * 0.3 + (overallAccuracy || 0) * 0.3 +
       Math.min(100, streak * 10) * 0.2 + Math.max(0, 100 - needsAttentionTests.length * 10) * 0.2)
    );

    const dailyPlan = [];
    if (totalDays <= 7) dailyPlan.push({ en: 'Full mock tests only', hi: 'सिर्फ पूर्ण मॉक टेस्ट' });
    else if (totalDays <= 30) {
      dailyPlan.push({ en: `${testsPerDay} tests/day minimum`, hi: `रोज कम से कम ${testsPerDay} टेस्ट` });
      dailyPlan.push({ en: 'Focus on weak chapters', hi: 'कमजोर अध्याय पर ध्यान दो' });
    } else {
      dailyPlan.push({ en: `Cover ${Math.ceil(uncovered / Math.max(weeks, 1))} new units/week`, hi: `हर हफ्ते ${Math.ceil(uncovered / Math.max(weeks, 1))} नई इकाई` });
      dailyPlan.push({ en: `${testsPerDay} tests daily`, hi: `रोज ${testsPerDay} टेस्ट` });
    }
    if (needsAttentionTests.length > 0) dailyPlan.push({ en: `Fix ${needsAttentionTests.length} weak tests`, hi: `${needsAttentionTests.length} कमजोर टेस्ट सुधारो` });

    return {
      totalDays, weeks, remDays, months, hours,
      phase, phaseHi, phaseColor,
      testsPerDay, testsPerWeek, pending,
      uncovered, milestones, readiness, dailyPlan,
    };
  }, [examDate, notAttemptedTests, syllabusCoverage, overallAccuracy, streak, needsAttentionTests]);

  // ════════════════════════════════════════════
  //  SPEED ANALYTICS
  // ════════════════════════════════════════════
  const speedAnalytics = useMemo(() => {
    if (allCompletedAttempts.length === 0) return { avgTimePerQ: 0, fastestTest: null, slowestTest: null, speedTrend: [], timeDistribution: [] };
    const withTime = allCompletedAttempts.filter(a => a.totalTimeTaken > 0 && (a.correctCount + a.wrongCount + a.skippedCount) > 0);
    const avgTimes = withTime.map(a => ({ avgTime: Math.round(a.totalTimeTaken / (a.correctCount + a.wrongCount + a.skippedCount)), score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0, title: a.testId?.title || 'Test', date: a.completedAt }));
    const sortedBySpeed = [...avgTimes].sort((a, b) => a.avgTime - b.avgTime);

    const speedTrend = [...withTime].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(-10).map((a, i) => {
      const totalQ = a.correctCount + a.wrongCount + a.skippedCount;
      return { name: `T${i + 1}`, speed: totalQ > 0 ? Math.round(a.totalTimeTaken / totalQ) : 0, accuracy: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.correctCount / t) * 100) : 0; })() };
    });

    const buckets = { '<30s': 0, '30-60s': 0, '60-90s': 0, '90-120s': 0, '>120s': 0 };
    avgTimes.forEach(a => { if (a.avgTime < 30) buckets['<30s']++; else if (a.avgTime < 60) buckets['30-60s']++; else if (a.avgTime < 90) buckets['60-90s']++; else if (a.avgTime < 120) buckets['90-120s']++; else buckets['>120s']++; });
    const overallAvg = avgTimes.length > 0 ? Math.round(avgTimes.reduce((s, a) => s + a.avgTime, 0) / avgTimes.length) : 0;

    return { avgTimePerQ: overallAvg, fastestTest: sortedBySpeed[0] || null, slowestTest: sortedBySpeed[sortedBySpeed.length - 1] || null, speedTrend, timeDistribution: Object.entries(buckets).map(([name, value]) => ({ name, value })) };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  ERROR PATTERNS
  // ════════════════════════════════════════════
  const errorPatterns = useMemo(() => {
    if (allCompletedAttempts.length === 0) return { byType: [], weakUnits: [], strongUnits: [], errorRate: 0, improvementAreas: [], unitPerformance: [] };
    const unitMap = {};
    allCompletedAttempts.forEach(a => {
      (a.topicAnalysis || []).forEach(ta => {
        const key = ta.unit || 'Other';
        if (!unitMap[key]) unitMap[key] = { correct: 0, wrong: 0, total: 0, skipped: 0 };
        unitMap[key].correct += ta.correct || 0;
        unitMap[key].wrong += ta.wrong || 0;
        unitMap[key].total += ta.total || 0;
        unitMap[key].skipped += ta.skipped || 0;
      });
    });
    const unitPerf = Object.entries(unitMap).map(([unit, stats]) => ({ unit, ...stats, accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0, errorRate: stats.total > 0 ? Math.round((stats.wrong / stats.total) * 100) : 0 })).sort((a, b) => a.accuracy - b.accuracy);
    const weakUnits = unitPerf.filter(u => u.accuracy < 50 && u.total >= 3);
    const strongUnits = unitPerf.filter(u => u.accuracy >= 70 && u.total >= 3).sort((a, b) => b.accuracy - a.accuracy);
    const totalCorrect = Object.values(unitMap).reduce((s, u) => s + u.correct, 0);
    const totalWrong = Object.values(unitMap).reduce((s, u) => s + u.wrong, 0);
    const errorRate = (totalCorrect + totalWrong) > 0 ? Math.round((totalWrong / (totalCorrect + totalWrong)) * 100) : 0;
    const improvementAreas = weakUnits.slice(0, 5).map(u => ({ unit: u.unit, accuracy: u.accuracy, errorRate: u.errorRate, questionsAttempted: u.total, suggestion: u.accuracy < 30 ? 'Critical - needs thorough revision' : u.accuracy < 50 ? 'Weak - practice more' : 'Average - review mistakes' }));
    const byType = Object.entries(questionStats?.byType || {}).map(([type, count]) => ({ type, label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), count }));

    return { byType, weakUnits, strongUnits, errorRate, improvementAreas, unitPerformance: unitPerf };
  }, [allCompletedAttempts, questionStats]);

  // ════════════════════════════════════════════
  //  STUDY RECOMMENDATIONS
  // ════════════════════════════════════════════
  const studyRecommendations = useMemo(() => {
    const recs = [];

    if (errorPatterns.weakUnits.length > 0) {
      const w = errorPatterns.weakUnits[0];
      recs.push({ id: 'weak_unit', priority: 'critical', icon: 'AlertTriangle', title: `Focus on ${w.unit}`, titleHi: `${w.unit} पर ध्यान दें`, detail: `Only ${w.accuracy}% accuracy`, detailHi: `केवल ${w.accuracy}% सटीकता`, action: 'practice', color: 'red' });
    }

    const p1Untouched = syllabusCoverage.paper1.filter(c => c.level === 'not_started' || c.level === 'no_tests');
    const p2Untouched = syllabusCoverage.paper2.filter(c => c.level === 'not_started' || c.level === 'no_tests');
    if (p1Untouched.length > 0) {
      recs.push({ id: 'p1_untouched', priority: 'high', icon: 'BookOpen', title: `Start ${p1Untouched[0].name} (P1)`, titleHi: `${p1Untouched[0].name} शुरू करें`, detail: `${p1Untouched.length} P1 units uncovered`, detailHi: `P1 में ${p1Untouched.length} इकाइयां बाकी`, action: 'start', color: 'blue' });
    }
    if (p2Untouched.length > 0) {
      recs.push({ id: 'p2_untouched', priority: 'high', icon: 'Target', title: `Start ${p2Untouched[0].name} (P2)`, titleHi: `${p2Untouched[0].name} शुरू करें`, detail: `${p2Untouched.length} P2 units uncovered`, detailHi: `P2 में ${p2Untouched.length} इकाइयां बाकी`, action: 'start', color: 'purple' });
    }

    if (trendDirection === 'down') recs.push({ id: 'declining', priority: 'high', icon: 'TrendingDown', title: 'Scores declining', titleHi: 'स्कोर गिर रहे', detail: 'Review recent mistakes', detailHi: 'गलतियां देखें', action: 'review', color: 'orange' });
    if (notAttemptedTests.length > 5) recs.push({ id: 'pending', priority: 'medium', icon: 'Clock', title: `${notAttemptedTests.length} tests pending`, titleHi: `${notAttemptedTests.length} टेस्ट बाकी`, detail: 'Complete older tests first', detailHi: 'पुराने टेस्ट पहले पूरे करें', action: 'take_test', color: 'amber' });
    if (streak < 3 && allCompletedAttempts.length > 5) recs.push({ id: 'consistency', priority: 'medium', icon: 'Flame', title: 'Build routine', titleHi: 'आदत बनाएं', detail: `Streak: ${streak}d. Aim 7+`, detailHi: `स्ट्रीक: ${streak} दिन`, action: 'streak', color: 'orange' });

    const p1Att = paper1Attempts.length, p2Att = paper2Attempts.length;
    if (p1Att > 0 && p2Att > 0) {
      const ratio = p1Att / (p1Att + p2Att);
      if (ratio > 0.7) recs.push({ id: 'balance_p2', priority: 'medium', icon: 'BarChart2', title: 'Practice more Paper 2', titleHi: 'P2 ज्यादा अभ्यास करें', detail: `P1: ${p1Att} vs P2: ${p2Att}`, detailHi: `P1: ${p1Att} vs P2: ${p2Att}`, action: 'balance', color: 'purple' });
      else if (ratio < 0.3) recs.push({ id: 'balance_p1', priority: 'medium', icon: 'BarChart2', title: 'Practice more Paper 1', titleHi: 'P1 ज्यादा अभ्यास करें', detail: `P1: ${p1Att} vs P2: ${p2Att}`, detailHi: `P1: ${p1Att} vs P2: ${p2Att}`, action: 'balance', color: 'blue' });
    }

    if (speedAnalytics.avgTimePerQ > 90) recs.push({ id: 'speed', priority: 'low', icon: 'Zap', title: 'Improve speed', titleHi: 'गति बढ़ाएं', detail: `Avg ${speedAnalytics.avgTimePerQ}s/Q. Target: <60s`, detailHi: `औसत ${speedAnalytics.avgTimePerQ}s/प्रश्न`, action: 'speed', color: 'cyan' });

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recs.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    return recs.slice(0, 8);
  }, [errorPatterns, syllabusCoverage, trendDirection, notAttemptedTests, streak, allCompletedAttempts, paper1Attempts, paper2Attempts, speedAnalytics]);

  // ════════════════════════════════════════════
  //  SCORE DISTRIBUTION
  // ════════════════════════════════════════════
  const scoreDistribution = useMemo(() => {
    if (allCompletedAttempts.length === 0) return [];
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    allCompletedAttempts.forEach(a => {
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      if (pct <= 20) buckets['0-20']++; else if (pct <= 40) buckets['21-40']++; else if (pct <= 60) buckets['41-60']++; else if (pct <= 80) buckets['61-80']++; else buckets['81-100']++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count, pct: allCompletedAttempts.length > 0 ? Math.round((count / allCompletedAttempts.length) * 100) : 0, color: range === '81-100' ? '#22c55e' : range === '61-80' ? '#3b82f6' : range === '41-60' ? '#f59e0b' : range === '21-40' ? '#f97316' : '#ef4444' }));
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  PERSONAL RECORDS
  // ════════════════════════════════════════════
  const personalRecords = useMemo(() => {
    if (allCompletedAttempts.length === 0) return {};
    const scores = allCompletedAttempts.map(a => ({ pct: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0, title: a.testId?.title || 'Test', date: a.completedAt, accuracy: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.correctCount / t) * 100) : 0; })(), timeTaken: a.totalTimeTaken || 0 }));
    const sortedByScore = [...scores].sort((a, b) => b.pct - a.pct);
    const sortedByAccuracy = [...scores].sort((a, b) => b.accuracy - a.accuracy);
    const dayCount = {};
    allCompletedAttempts.forEach(a => { const k = new Date(a.completedAt).toISOString().split('T')[0]; dayCount[k] = (dayCount[k] || 0) + 1; });
    const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
    return { highestScore: sortedByScore[0] || null, lowestScore: sortedByScore[sortedByScore.length - 1] || null, bestAccuracy: sortedByAccuracy[0] || null, totalTestsTaken: allCompletedAttempts.length, bestDay: bestDay ? { date: bestDay[0], count: bestDay[1] } : null, longestStreak, currentStreak: streak, totalStudyTime: allCompletedAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0) };
  }, [allCompletedAttempts, longestStreak, streak]);

  // ════════════════════════════════════════════
  //  TIME OF DAY ANALYSIS
  // ════════════════════════════════════════════
  const timeOfDayAnalysis = useMemo(() => {
    const hourMap = {};
    for (let i = 0; i < 24; i++) hourMap[i] = { count: 0, totalScore: 0, totalAccuracy: 0 };
    allCompletedAttempts.forEach(a => {
      if (!a.startedAt && !a.completedAt) return;
      const hour = new Date(a.startedAt || a.completedAt).getHours();
      hourMap[hour].count++;
      hourMap[hour].totalScore += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const att = (a.correctCount || 0) + (a.wrongCount || 0);
      hourMap[hour].totalAccuracy += att > 0 ? Math.round((a.correctCount / att) * 100) : 0;
    });
    const hourData = Object.entries(hourMap).map(([hour, data]) => ({ hour: parseInt(hour), label: `${hour.toString().padStart(2, '0')}:00`, count: data.count, avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0, avgAccuracy: data.count > 0 ? Math.round(data.totalAccuracy / data.count) : 0 }));
    const withTests = hourData.filter(h => h.count >= 2);
    const bestHour = [...withTests].sort((a, b) => b.avgScore - a.avgScore)[0] || null;
    const periods = [
      { name: 'Morning', nameHi: 'सुबह', range: [6, 12], icon: 'Sun' },
      { name: 'Afternoon', nameHi: 'दोपहर', range: [12, 17], icon: 'Coffee' },
      { name: 'Evening', nameHi: 'शाम', range: [17, 21], icon: 'Sunset' },
      { name: 'Night', nameHi: 'रात', range: [21, 6], icon: 'Moon' },
    ];
    const periodData = periods.map(p => {
      const hours = hourData.filter(h => { if (p.range[0] < p.range[1]) return h.hour >= p.range[0] && h.hour < p.range[1]; return h.hour >= p.range[0] || h.hour < p.range[1]; });
      const totalCount = hours.reduce((s, h) => s + h.count, 0);
      const avgScore = totalCount > 0 ? Math.round(hours.reduce((s, h) => s + h.avgScore * h.count, 0) / totalCount) : 0;
      return { ...p, count: totalCount, avgScore };
    });
    const bestPeriod = [...periodData].sort((a, b) => b.avgScore - a.avgScore)[0];
    return { hourData, bestHour, periodData, bestPeriod };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  CHARTS DATA
  // ════════════════════════════════════════════
  const difficultyData = useMemo(() => {
    const bd = questionStats?.byDifficulty;
    if (!bd) return [];
    return [{ name: 'Easy', value: bd.easy || 0, color: '#22c55e' }, { name: 'Medium', value: bd.medium || 0, color: '#f59e0b' }, { name: 'Hard', value: bd.hard || 0, color: '#ef4444' }].filter(d => d.value > 0);
  }, [questionStats]);

  const questionTypeData = useMemo(() => {
    const bt = questionStats?.byType;
    if (!bt || typeof bt !== 'object') return [];
    return Object.entries(bt).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count]) => ({ name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: count, pct: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0 }));
  }, [questionStats, totalQuestions]);

  const topicPerformance = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      (a.topicAnalysis || []).forEach(t => {
        const key = t.unit || t.topic || 'Other';
        if (!map[key]) map[key] = { unit: key, correct: 0, wrong: 0, skipped: 0, total: 0 };
        map[key].correct += t.correct || 0; map[key].wrong += t.wrong || 0; map[key].skipped += t.skipped || 0; map[key].total += t.total || 0;
      });
    });
    return Object.values(map).map(t => ({ ...t, accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0, fullMark: 100 })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  ACHIEVEMENTS
  // ════════════════════════════════════════════
  const achievements = useMemo(() => {
    const list = [];
    const ta = allCompletedAttempts.length;
    const best = ta > 0 ? Math.max(...allCompletedAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0)) : 0;
    const add = (icon, label, desc, color, unlocked, progress) => list.push({ icon, label, desc, color, unlocked, progress });

    if (totalQuestions >= 100) add('Layers', 'Century', '100+ Qs', 'amber', true); else add('Layers', 'Century', `${totalQuestions}/100`, 'gray', false, totalQuestions / 100);
    if (totalQuestions >= 500) add('Crown', 'Massive', '500+ Qs', 'purple', true); else if (totalQuestions >= 100) add('Crown', 'Massive', `${totalQuestions}/500`, 'gray', false, totalQuestions / 500);
    if (ta >= 1) add('Play', 'Starter', '1st test', 'blue', true); else add('Play', 'Starter', '0/1', 'gray', false, 0);
    if (ta >= 10) add('Flame', 'Dedicated', '10+ tests', 'orange', true); else add('Flame', 'Dedicated', `${ta}/10`, 'gray', false, ta / 10);
    if (ta >= 50) add('Medal', 'Veteran', '50+ tests', 'amber', true); else if (ta >= 10) add('Medal', 'Veteran', `${ta}/50`, 'gray', false, ta / 50);
    if (best >= 90) add('Star', 'Expert', '90%+', 'amber', true); else if (best >= 80) add('Star', 'Brilliant', '80%+', 'emerald', true); else add('Star', 'Brilliant', `${best}%/80%`, 'gray', false, best / 80);
    if (overallAccuracy >= 70) add('Target', 'Sharp', '70%+ acc', 'emerald', true); else add('Target', 'Sharp', `${overallAccuracy}%/70%`, 'gray', false, overallAccuracy / 70);
    if (streak >= 7) add('Flame', 'On Fire', '7d streak', 'orange', true); else add('Flame', 'On Fire', `${streak}/7d`, 'gray', false, streak / 7);

    return list;
  }, [totalQuestions, allCompletedAttempts, overallAccuracy, streak]);

  // ════════════════════════════════════════════
  //  RETURN
  // ════════════════════════════════════════════
  return {
    // Core data
    questionStats, testStats, attemptStats, recentAttempts, allAttempts, allCompletedAttempts, createdTests,
    loading, refreshing, lastRefresh, refresh,

    // Basic stats
    paper1Units, paper2Units, paper1Count, paper2Count, totalQuestions, overallAccuracy, overallAvgScore,
    paper1Attempts, paper2Attempts, paper1Tests, paper2Tests, combinedTests,
    paper1Accuracy, paper2Accuracy, paper1AvgScore, paper2AvgScore,

    // Trends & predictions
    scoreTrend, paper1Trend, paper2Trend, trendDirection, paper1TrendDir, paper2TrendDir,
    predictedScore, paper1Predicted, paper2Predicted,

    // Tests status
    notAttemptedTests, paper1NotAttempted, paper2NotAttempted, needsAttentionTests,

    // Charts data
    difficultyData, questionTypeData, topicPerformance,

    // Activity & streaks
    activityMap, streak, longestStreak, weeklyComparison, achievements,

    // JRF/NET
    jrfProbability,

    // Syllabus
    syllabusCoverage,

    // Analytics
    speedAnalytics, errorPatterns, studyRecommendations,
    scoreDistribution, personalRecords, timeOfDayAnalysis,

    // Goal tracker
    examDate, setExamDate, daysUntilExam,
    customTargets, updateCustomTargets,
    autoGeneratedGoals, goalCompletionPct,
    todayActivity: todayDetailed,
    todayDetailed,
    yesterdayActivity,
    dayProgress,
    goalStreak,
    goalsCompleted,
    totalGoals,
    pressureMessage,
    todayXP,

    // 🆕 NEW ADVANCED FEATURES
    revisionQueue,
    weakChaptersList,
    forgettingCurveData,
    fatigueAnalysis,
    dailyChallenge,
    playerLevel,
    negativeMarkingImpact,
    weeklyReportData,
    advancedCountdown,
  };
};

export default useDashboard;