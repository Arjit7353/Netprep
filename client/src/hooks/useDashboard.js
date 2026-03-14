// client/src/hooks/useDashboard.js
// ═══════════════════════════════════════════════════════════════
//  NETPREP ULTIMATE DASHBOARD HOOK - V2 (All Features)
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
  { maxScore: 30, interval: 1, label: 'Critical' },
  { maxScore: 50, interval: 3, label: 'Weak' },
  { maxScore: 70, interval: 7, label: 'Learning' },
  { maxScore: 85, interval: 14, label: 'Good' },
  { maxScore: 100, interval: 30, label: 'Mastered' },
];

const getSRSInterval = (score) => {
  for (const s of SRS_INTERVALS) { if (score <= s.maxScore) return s; }
  return SRS_INTERVALS[SRS_INTERVALS.length - 1];
};

// ════════════════════════════════════════════════════════════
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
      const s = localStorage.getItem('netprep_custom_targets');
      return s ? JSON.parse(s) : { dailyTests: 3, dailyAccuracy: 70, weeklyTests: 15, targetScore: 75 };
    } catch { return { dailyTests: 3, dailyAccuracy: 70, weeklyTests: 15, targetScore: 75 }; }
  });

  // ════════════════════════════════════════════
  //  §1 DATA FETCHING
  // ════════════════════════════════════════════
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [qS, tS, aS, rec, allA, tests] = await Promise.allSettled([
        questionService.getStats(), testService.getStats(), attemptService.getStats(),
        attemptService.getRecentAttempts(50),
        attemptService.getAttempts({ status: 'completed', limit: 500 }),
        testService.getTests({ limit: 500 }),
      ]);
      if (qS.status === 'fulfilled') setQuestionStats(qS.value?.data || null);
      if (tS.status === 'fulfilled') setTestStats(tS.value?.data || null);
      if (aS.status === 'fulfilled') setAttemptStats(aS.value?.data || null);
      if (rec.status === 'fulfilled') setRecentAttempts(rec.value?.data || []);
      if (allA.status === 'fulfilled') {
        const d = allA.value?.data;
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
  //  §2 BASIC STATS
  // ════════════════════════════════════════════
  const paper1Units = useMemo(() => questionStats?.byUnit?.filter(u => u._id?.paper === 'paper1') || [], [questionStats]);
  const paper2Units = useMemo(() => questionStats?.byUnit?.filter(u => u._id?.paper === 'paper2') || [], [questionStats]);
  const paper1Count = useMemo(() => paper1Units.reduce((s, u) => s + u.count, 0), [paper1Units]);
  const paper2Count = useMemo(() => paper2Units.reduce((s, u) => s + u.count, 0), [paper2Units]);
  const totalQuestions = questionStats?.total || 0;

  const allCompletedAttempts = useMemo(() => {
    const a = allAttempts.length > 0 ? allAttempts : recentAttempts;
    const testMap = new Map(createdTests.map(t => [t._id?.toString(), t]));
    return a.filter(at => at.status === 'completed' || at.completedAt).map(at => {
      const tid = at.testId;
      const id = (tid && typeof tid === 'object' ? (tid._id?.toString() || '') : (tid || '').toString());
      const fromMap = id ? testMap.get(id) : null;
      const testInfo = fromMap || (tid && typeof tid === 'object' ? tid : null);
      const unitFromTest = testInfo?.unit;
      const unit = at.unit || unitFromTest || (tid && tid.unit) || undefined;
      const mergedTestId = testInfo ? { ...testInfo, _id: id } : { _id: id };
      return { ...at, unit, testId: mergedTestId };
    });
  }, [allAttempts, recentAttempts, createdTests]);

  const paper1Attempts = useMemo(() => allCompletedAttempts.filter(a => a.testId?.paper === 'paper1'), [allCompletedAttempts]);
  const paper2Attempts = useMemo(() => allCompletedAttempts.filter(a => a.testId?.paper === 'paper2'), [allCompletedAttempts]);
  const paper1Tests = useMemo(() => createdTests.filter(t => t.paper === 'paper1'), [createdTests]);
  const paper2Tests = useMemo(() => createdTests.filter(t => t.paper === 'paper2'), [createdTests]);
  const combinedTests = useMemo(() => createdTests.filter(t => t.paper === 'combined' || !t.paper), [createdTests]);

  // ════════════════════════════════════════════
  //  §3 ACCURACY / AVG SCORES
  // ════════════════════════════════════════════
  const calcAcc = (atts) => {
    if (!atts.length) return 0;
    const tc = atts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tq = atts.reduce((s, a) => s + (a.correctCount || 0) + (a.wrongCount || 0), 0);
    return tq > 0 ? Math.round((tc / tq) * 100) : 0;
  };
  const overallAccuracy = useMemo(() => calcAcc(allCompletedAttempts), [allCompletedAttempts]);
  const paper1Accuracy = useMemo(() => calcAcc(paper1Attempts), [paper1Attempts]);
  const paper2Accuracy = useMemo(() => calcAcc(paper2Attempts), [paper2Attempts]);

  const calcAvg = (atts) => {
    if (!atts.length) return 0;
    return Math.round(atts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / atts.length);
  };
  const paper1AvgScore = useMemo(() => calcAvg(paper1Attempts), [paper1Attempts]);
  const paper2AvgScore = useMemo(() => calcAvg(paper2Attempts), [paper2Attempts]);
  const overallAvgScore = useMemo(() => calcAvg(allCompletedAttempts), [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  §4 SCORE TRENDS & PREDICTIONS
  // ════════════════════════════════════════════
  const buildTrend = (attempts) => {
    return [...attempts].filter(a => a.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
      .slice(-20).map((a, i) => ({
        name: `T${i + 1}`,
        score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0,
        accuracy: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.correctCount / t) * 100) : 0; })(),
        date: a.completedAt, title: a.testId?.title || `Test ${i + 1}`,
        timeTaken: a.totalTimeTaken || 0, correct: a.correctCount || 0,
        wrong: a.wrongCount || 0, skipped: a.skippedCount || 0,
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
    return avgNew > avgOld + 3 ? 'up' : avgNew < avgOld - 3 ? 'down' : 'neutral';
  };
  const trendDirection = useMemo(() => calcTrend(scoreTrend), [scoreTrend]);
  const paper1TrendDir = useMemo(() => calcTrend(paper1Trend), [paper1Trend]);
  const paper2TrendDir = useMemo(() => calcTrend(paper2Trend), [paper2Trend]);

  const predictScore = (data) => {
    if (data.length < 3) return null;
    const n = data.length;
    const sX = (n * (n - 1)) / 2, sY = data.reduce((s, d) => s + d.score, 0);
    const sXY = data.reduce((s, d, i) => s + i * d.score, 0);
    const sX2 = data.reduce((s, _, i) => s + i * i, 0);
    const den = n * sX2 - sX * sX;
    if (den === 0) return null;
    const slope = (n * sXY - sX * sY) / den;
    const intercept = (sY - slope * sX) / n;
    return Math.max(0, Math.min(100, Math.round(slope * n + intercept)));
  };
  const predictedScore = useMemo(() => predictScore(scoreTrend), [scoreTrend]);
  const paper1Predicted = useMemo(() => predictScore(paper1Trend), [paper1Trend]);
  const paper2Predicted = useMemo(() => predictScore(paper2Trend), [paper2Trend]);

  // ════════════════════════════════════════════
  //  §5 NOT ATTEMPTED / NEEDS ATTENTION
  // ════════════════════════════════════════════
  const notAttemptedTests = useMemo(() => {
    const ids = new Set(allCompletedAttempts.map(a => (a.testId?._id || a.testId)?.toString()));
    return createdTests.filter(t => !ids.has(t._id?.toString()));
  }, [createdTests, allCompletedAttempts]);
  const paper1NotAttempted = useMemo(() => notAttemptedTests.filter(t => t.paper === 'paper1'), [notAttemptedTests]);
  const paper2NotAttempted = useMemo(() => notAttemptedTests.filter(t => t.paper === 'paper2'), [notAttemptedTests]);

  // Test performance map: testId -> { bestScore, lastDate, attempts, allScores, trend, test }
  const testPerfMap = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      const tid = (a.testId?._id || a.testId)?.toString();
      if (!tid) return;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      const dt = a.completedAt || a.createdAt;
      if (!map[tid]) {
        map[tid] = { testId: tid, test: a.testId, bestScore: pct, worstScore: pct, lastDate: dt,
          attempts: 0, allScores: [], lastAttempt: a, firstDate: dt };
      }
      map[tid].attempts += 1;
      map[tid].allScores.push({ score: pct, date: dt });
      if (pct > map[tid].bestScore) map[tid].bestScore = pct;
      if (pct < map[tid].worstScore) map[tid].worstScore = pct;
      if (new Date(dt) > new Date(map[tid].lastDate)) {
        map[tid].lastDate = dt;
        map[tid].lastAttempt = a;
      }
    });
    // Calculate trend per test
    Object.values(map).forEach(t => {
      const scores = t.allScores.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (scores.length >= 2) {
        const last = scores[scores.length - 1].score;
        const prev = scores[scores.length - 2].score;
        t.trend = last > prev + 3 ? 'up' : last < prev - 3 ? 'down' : 'stable';
        t.improvement = last - scores[0].score;
      } else {
        t.trend = 'neutral';
        t.improvement = 0;
      }
    });
    return map;
  }, [allCompletedAttempts]);

  const needsAttentionTests = useMemo(() => {
    return Object.values(testPerfMap)
      .filter(t => t.bestScore < 50)
      .sort((a, b) => a.bestScore - b.bestScore);
  }, [testPerfMap]);

  // ════════════════════════════════════════════
  //  §6 ACTIVITY MAP / STREAK
  // ════════════════════════════════════════════
  const activityMap = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => {
      const k = new Date(a.completedAt || a.createdAt).toISOString().split('T')[0];
      if (!map[k]) map[k] = { count: 0, totalScore: 0, totalAccuracy: 0, tests: [] };
      map[k].count += 1;
      const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      map[k].totalScore += pct;
      const att = (a.correctCount || 0) + (a.wrongCount || 0);
      map[k].totalAccuracy += att > 0 ? Math.round((a.correctCount / att) * 100) : 0;
      map[k].tests.push(a);
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
      max = Math.max(max, cur); prev = date;
    });
    return max;
  }, [activityMap]);

  // ════════════════════════════════════════════
  //  §7 WEEKLY COMPARISON
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
  //  §8 SYLLABUS COVERAGE & NEW TEST RANKING
  // ════════════════════════════════════════════════════════════
  const toRoman = (num) => {
    if (!num || typeof num !== 'number' || num < 1) return null;
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || null;
  };

  const normalizeUnit = (str) => str ? str.toString().toLowerCase().replace(/[\s\-–_]+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim() : '';
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const extractUnitNumber = (str) => {
    if (!str) return null;
    const norm = normalizeUnit(str);
    const m = norm.match(/unit\s*(\d+|i{1,3}|iv|v|vi{0,3}|ix|x)\b/i);
    if (!m) return null;
    const val = m[1].toLowerCase();
    const romanToNum = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
    if (romanToNum[val]) return romanToNum[val];
    const num = parseInt(val, 10);
    return Number.isNaN(num) ? null : num;
  };

  const normalizeUnitId = (str) => {
    const num = extractUnitNumber(str);
    if (num) {
      const roman = toRoman(num);
      return roman ? `UNIT ${roman}` : `UNIT ${num}`;
    }
    return str ? str.toString().trim().toUpperCase() : '';
  };

  const matchUnit = (testUnit, syllabusUnit) => {
    if (!testUnit || !syllabusUnit) return false;
    const tId = normalizeUnitId(testUnit);
    const sId = normalizeUnitId(syllabusUnit);
    if (tId === sId) return true;

    const tNorm = normalizeUnit(testUnit);
    const sNorm = normalizeUnit(syllabusUnit);
    const wordMatch = (hay, needle) => new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'i').test(hay);
    if (wordMatch(tNorm, sNorm) || wordMatch(sNorm, tNorm)) return true;

    const tNum = extractUnitNumber(testUnit);
    const sNum = extractUnitNumber(syllabusUnit);
    if (tNum && sNum) return tNum === sNum;

    return false;
  };

  const splitUnits = (str) => (typeof str === 'string' ? str.split(',').map(s => s.trim()).filter(Boolean) : []);
  const getTestUnitOptions = (t) => [...splitUnits(t.unit), ...splitUnits(t.chapter), ...splitUnits(t.topic)];
  const getAttemptUnitOptions = (a) => [...splitUnits(a.unit), ...splitUnits(a.testId?.unit), ...splitUnits(a.testId?.chapter), ...splitUnits(a.testId?.topic)];

  const syllabusCoverage = useMemo(() => {
    const TW = { dpp: 10, topic_test: 15, chapter_test: 25, unit_test: 35, practice: 20, pyq_year: 30, full_mock_p1: 20, full_mock_p2: 20, full_mock_combined: 15 };

    const buildCov = (syllabusUnits, unitNames, paperTests, paperAttempts) => {
      const attemptedIds = new Set(paperAttempts.map(a => (a.testId?._id || a.testId)?.toString()));
      return syllabusUnits.map(unit => {
        const unitTests = paperTests.filter(t => getTestUnitOptions(t).some(u => matchUnit(u, unit)));
        const totalTests = unitTests.length;
        const attemptedTests = unitTests.filter(t => attemptedIds.has(t._id?.toString()));
        const attemptedCount = attemptedTests.length;
        const ttBreak = {};
        unitTests.forEach(t => { const ty = t.testType || 'practice'; if (!ttBreak[ty]) ttBreak[ty] = { total: 0, attempted: 0 }; ttBreak[ty].total += 1; if (attemptedIds.has(t._id?.toString())) ttBreak[ty].attempted += 1; });
        const unitAttempts = paperAttempts.filter(a => getAttemptUnitOptions(a).some(u => matchUnit(u, unit)));
        const td = { correct: 0, wrong: 0, skipped: 0, total: 0 };
        paperAttempts.forEach(a => { (a.topicAnalysis || []).forEach(ta => { if (matchUnit(ta.unit, unit)) { td.correct += ta.correct || 0; td.wrong += ta.wrong || 0; td.skipped += ta.skipped || 0; td.total += ta.total || 0; } }); });
        const accuracy = td.total > 0 ? Math.round((td.correct / td.total) * 100) : 0;
        const bestScore = unitAttempts.length > 0 ? Math.max(...unitAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0)) : 0;
        const avgScore = unitAttempts.length > 0 ? Math.round(unitAttempts.reduce((s, a) => s + (a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0), 0) / unitAttempts.length) : 0;
        let cs = 0, ms = 0;
        Object.entries(ttBreak).forEach(([ty, d]) => { const w = TW[ty] || 15; ms += d.total * w; cs += d.attempted * w; });
        const covPct = ms > 0 ? Math.round((cs / ms) * 100) : 0;
        let level = 'not_started';
        if (totalTests === 0) level = 'no_tests';
        else if (attemptedCount === 0) level = 'not_started';
        else if (covPct >= 80 && accuracy >= 70) level = 'mastered';
        else if (covPct >= 50 && accuracy >= 50) level = 'learning';
        else if (covPct >= 25 || attemptedCount >= 1) level = accuracy < 40 ? 'weak' : 'in_progress';
        const colorMap = { mastered: '#22c55e', learning: '#3b82f6', in_progress: '#f59e0b', weak: '#ef4444', not_started: '#d1d5db', no_tests: '#f3f4f6' };
        return { unit, name: unitNames[unit] || unit, totalTests, attemptedCount, pendingCount: totalTests - attemptedCount, testTypeBreakdown: ttBreak, accuracy, bestScore, avgScore, correct: td.correct, wrong: td.wrong, skipped: td.skipped, questionsAttempted: td.total, coveragePct: covPct, level, color: colorMap[level] || '#d1d5db', totalAttempts: unitAttempts.length };
      });
    };
    const p1Cov = buildCov(PAPER1_UNITS, PAPER1_UNIT_NAMES, paper1Tests, paper1Attempts);
    const p2Cov = buildCov(PAPER2_UNITS, PAPER2_UNIT_NAMES, paper2Tests, paper2Attempts);
    const calcSum = (cov) => {
      const t = cov.length, m = cov.filter(c => c.level === 'mastered').length, l = cov.filter(c => c.level === 'learning').length;
      const ip = cov.filter(c => c.level === 'in_progress').length, w = cov.filter(c => c.level === 'weak').length;
      const ns = cov.filter(c => c.level === 'not_started').length, nt = cov.filter(c => c.level === 'no_tests').length;
      const ach = cov.reduce((s, c) => s + (c.level === 'mastered' ? 100 : c.level === 'learning' ? 65 : c.level === 'in_progress' ? 35 : c.level === 'weak' ? 15 : 0), 0);
      return { total: t, mastered: m, learning: l, inProgress: ip, weak: w, notStarted: ns, noTests: nt, overallPct: t > 0 ? Math.round(ach / t) : 0, totalTestsCreated: cov.reduce((s, c) => s + c.totalTests, 0), totalTestsAttempted: cov.reduce((s, c) => s + c.attemptedCount, 0), totalTestsPending: cov.reduce((s, c) => s + c.pendingCount, 0) };
    };
    const p1S = calcSum(p1Cov), p2S = calcSum(p2Cov);
    return { paper1: p1Cov, paper2: p2Cov, paper1Summary: p1S, paper2Summary: p2S, overallPct: Math.round((p1S.overallPct + p2S.overallPct) / 2) };
  }, [paper1Tests, paper2Tests, paper1Attempts, paper2Attempts]);

  const unitScoreRanking = useMemo(() => {
    const units = [...syllabusCoverage.paper1, ...syllabusCoverage.paper2];
    const attemptsByTest = new Map();
    allCompletedAttempts.forEach(a => {
      const tid = (a.testId?._id || a.testId)?.toString();
      if (!tid) return;
      if (!attemptsByTest.has(tid)) attemptsByTest.set(tid, []);
      attemptsByTest.get(tid).push(a);
    });

    return units.map(u => {
      // Try to find tests directly matching the unit
      let tests = createdTests.filter(t => {
        if (t.paper !== u.paper) return false;
        return getTestUnitOptions(t).some(x => matchUnit(x, u.unit));
      });

      // If no direct match, try matching by similar unit/chapter patterns
      if (tests.length === 0 && u.paper === 'paper2') {
        // For Paper 2, be more lenient - match attempts that belong to this unit
        const unitAttempts = allCompletedAttempts.filter(a => a.testId?.paper === u.paper && getAttemptUnitOptions(a).some(x => matchUnit(x, u.unit)));
        if (unitAttempts.length > 0) {
          const testIds = new Set(unitAttempts.map(a => (a.testId?._id || a.testId)?.toString()));
          tests = createdTests.filter(t => testIds.has(t._id?.toString()));
        }
      }

      // Find recommended test: prefer unattempted, else lowest score
      let recommendedTest = null;
      const unattempted = tests.filter(t => { const id = t._id?.toString(); return id && !attemptsByTest.has(id); });
      if (unattempted.length > 0) {
        recommendedTest = unattempted[0];
      } else if (tests.length > 0) {
        let lowestScore = 101;
        tests.forEach(t => {
          const id = t._id?.toString();
          const atts = attemptsByTest.get(id) || [];
          const bestScore = atts.length > 0 ? Math.max(...atts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0)) : 0;
          if (bestScore < lowestScore) { lowestScore = bestScore; recommendedTest = t; }
        });
      }

      // Fallback: If still no test, try to get title from best attempt for this unit
      let displayTitle = recommendedTest?.title || null;
      let allTestTitles = [];
      
      if (tests.length > 0) {
        allTestTitles = tests.map(t => t.title).filter(Boolean);
      }
      
      if (!displayTitle && u.paper) {
        const unitAttempts = allCompletedAttempts.filter(a => a.testId?.paper === u.paper && getAttemptUnitOptions(a).some(x => matchUnit(x, u.unit)));
        if (unitAttempts.length > 0) {
          // Get best scoring attempt for this unit
          const best = unitAttempts.reduce((max, a) => {
            const score = a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0;
            const maxScore = max.totalMarks > 0 ? (max.score / max.totalMarks) * 100 : 0;
            return score < maxScore ? a : max;
          });
          if (best.testId?.title) {
            displayTitle = best.testId.title;
            if (!recommendedTest) recommendedTest = best.testId; // use this for the link
          }
          // Collect all test titles from attempts
          if (allTestTitles.length === 0) {
            const attemptTitles = unitAttempts
              .map(a => a.testId?.title)
              .filter((t, i, arr) => t && arr.indexOf(t) === i);
            allTestTitles = attemptTitles;
          }
        }
      }

      return {
        unit: u.unit,
        name: u.name,
        paper: u.paper,
        avgScore: u.avgScore,
        totalTests: u.totalTests,
        attemptedCount: u.attemptedCount,
        totalAttempts: u.totalAttempts,
        recommendedTestId: recommendedTest?._id || (typeof recommendedTest === 'string' ? recommendedTest : null),
        recommendedTestTitle: displayTitle,
        allTestTitles: allTestTitles,
      };
    }).sort((a, b) => a.avgScore - b.avgScore);
  }, [syllabusCoverage, createdTests, allCompletedAttempts]);

  // NEW: Rank individual tests instead of units based on user feedback
  const testScoreRanking = useMemo(() => {
    return createdTests.map(t => {
      const tid = t._id?.toString();
      const perf = tid ? testPerfMap[tid] : null;
      const avgScore = perf?.allScores?.length > 0
          ? Math.round(perf.allScores.reduce((sum, s) => sum + s.score, 0) / perf.allScores.length)
          : 0;
      const bestScore = perf?.bestScore || 0;

      // Smart features: categorize based on score
      let category = 'Not Attempted';
      if (perf?.attempts > 0) {
          if (bestScore < 40) category = 'Critical';
          else if (bestScore < 60) category = 'Weak';
          else if (bestScore < 80) category = 'Good';
          else category = 'Mastered';
      }

      return {
          testId: tid,
          title: t.title || 'Untitled Test',
          paper: t.paper,
          unit: t.unit || t.chapter || t.topic || '',
          avgScore: avgScore,
          bestScore: bestScore,
          attempts: perf?.attempts || 0,
          totalQuestions: t.totalQuestions || 0,
          category: category,
          trend: perf?.trend || 'neutral'
      };
    }).sort((a, b) => {
        // Push unattempted to bottom
        if (a.attempts === 0 && b.attempts > 0) return 1;
        if (b.attempts === 0 && a.attempts > 0) return -1;
        // Sort lowest average score first
        if (a.bestScore !== b.bestScore) return a.bestScore - b.bestScore;
        // Then sort by attempts
        return a.attempts - b.attempts;
    });
  }, [createdTests, testPerfMap]);

  // ════════════════════════════════════════════════════════════
  //  §9 JRF PROBABILITY METER
  // ════════════════════════════════════════════════════════════
  const jrfProbability = useMemo(() => {
    if (allCompletedAttempts.length < 3) return { netProbability: 0, jrfProbability: 0, predictedP1: 0, predictedP2: 0, predictedTotal: 0, netCutoff: NET_CUTOFF, jrfCutoff: JRF_CUTOFF, confidence: 'low', factors: [], suggestions: [], riskLevel: 'unknown', consistencyScore: 0, dataPoints: allCompletedAttempts.length, p1Trend: 'neutral', p2Trend: 'neutral' };
    const p1S = paper1Attempts.filter(a => a.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(-10).map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);
    const p2S = paper2Attempts.filter(a => a.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(-10).map(a => a.totalMarks > 0 ? (a.score / a.totalMarks) * 100 : 0);
    const wAvg = (scores) => { if (!scores.length) return 0; let tw = 0, ws = 0; scores.forEach((s, i) => { const w = 1 + (i / scores.length) * 2; ws += s * w; tw += w; }); return tw > 0 ? ws / tw : 0; };
    const tAdj = (scores) => { if (scores.length < 3) return 0; const h = Math.floor(scores.length / 2); return (scores.slice(h).reduce((a, b) => a + b, 0) / (scores.length - h) - scores.slice(0, h).reduce((a, b) => a + b, 0) / h) * 0.3; };
    const p1Adj = Math.min(100, Math.max(0, wAvg(p1S) + tAdj(p1S)));
    const p2Adj = Math.min(100, Math.max(0, wAvg(p2S) + tAdj(p2S)));
    const pP1 = Math.round(p1Adj), pP2 = Math.round(p2Adj), pT = Math.round((pP1 + pP2) / 2);
    const stdDev = (scores) => { if (scores.length < 2) return 50; const m = scores.reduce((a, b) => a + b, 0) / scores.length; return Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - m, 2), 0) / scores.length); };
    const all = [...p1S, ...p2S]; const sd = stdDev(all);
    const cs = Math.max(0, Math.min(100, Math.round(100 - sd * 2)));
    const nG = pT - NET_CUTOFF; let nP; if (nG >= 20) nP = 95; else if (nG >= 10) nP = 75 + (nG - 10) * 2; else if (nG >= 5) nP = 55 + (nG - 5) * 4; else if (nG >= 0) nP = 35 + nG * 4; else if (nG >= -10) nP = 10 + (nG + 10) * 2.5; else nP = Math.max(3, 10 + nG);
    const jG = pT - JRF_CUTOFF; let jP; if (jG >= 15) jP = 92; else if (jG >= 8) jP = 68 + (jG - 8) * 3.4; else if (jG >= 3) jP = 42 + (jG - 3) * 5.2; else if (jG >= 0) jP = 25 + jG * 5.7; else if (jG >= -8) jP = 8 + (jG + 8) * 2.1; else jP = Math.max(2, 8 + jG);
    const cM = (cs - 50) / 100; nP = Math.min(99, Math.max(1, Math.round(nP + cM * 10))); jP = Math.min(99, Math.max(1, Math.round(jP + cM * 10)));
    const covP = syllabusCoverage.overallPct || 0;
    if (covP >= 70) { nP = Math.min(99, nP + 3); jP = Math.min(99, jP + 2); } else if (covP < 30) { nP = Math.max(1, nP - 5); jP = Math.max(1, jP - 5); }
    const dp = p1S.length + p2S.length;
    const conf = dp >= 15 ? 'high' : dp >= 8 ? 'medium' : 'low';
    const rl = jP >= 65 ? 'safe' : jP >= 40 ? 'moderate' : jP >= 20 ? 'risky' : 'critical';
    const factors = [];
    if (paper1Accuracy >= 70) factors.push({ type: 'positive', text: `P1 accuracy ${paper1Accuracy}%` }); else factors.push({ type: 'negative', text: `P1 accuracy ${paper1Accuracy}% (need 70%+)` });
    if (paper2Accuracy >= 70) factors.push({ type: 'positive', text: `P2 accuracy ${paper2Accuracy}%` }); else factors.push({ type: 'negative', text: `P2 accuracy ${paper2Accuracy}% (need 70%+)` });
    if (pT >= JRF_CUTOFF) factors.push({ type: 'positive', text: `Predicted ${pT}% ≥ JRF ${JRF_CUTOFF}%` }); else if (pT >= NET_CUTOFF) factors.push({ type: 'positive', text: `Predicted ${pT}% ≥ NET ${NET_CUTOFF}%` }); else factors.push({ type: 'negative', text: `Predicted ${pT}% < NET ${NET_CUTOFF}%` });
    if (streak >= 7) factors.push({ type: 'positive', text: `${streak}d streak` }); else if (streak < 3) factors.push({ type: 'negative', text: 'Low consistency' });
    if (cs >= 60) factors.push({ type: 'positive', text: `Consistency ${cs}%` }); else factors.push({ type: 'negative', text: `Score variance high (${cs}%)` });
    if (covP >= 60) factors.push({ type: 'positive', text: `Coverage ${covP}%` }); else factors.push({ type: 'negative', text: `Coverage ${covP}%` });
    const suggestions = [];
    if (pP1 < NET_CUTOFF) suggestions.push(`Paper 1: ${pP1}% → need ${NET_CUTOFF}%+`);
    if (pP2 < NET_CUTOFF) suggestions.push(`Paper 2: ${pP2}% → need ${NET_CUTOFF}%+`);
    if (pT < JRF_CUTOFF && pT >= NET_CUTOFF) suggestions.push(`JRF gap: ${JRF_CUTOFF - pT}%`);
    if (cs < 50) suggestions.push('Be more consistent');
    if (covP < 50) suggestions.push('Cover more syllabus');
    if (streak < 5) suggestions.push('Daily practice needed');
    if (notAttemptedTests.length > 10) suggestions.push(`${notAttemptedTests.length} tests pending`);
    return { netProbability: nP, jrfProbability: jP, predictedP1: pP1, predictedP2: pP2, predictedTotal: pT, netCutoff: NET_CUTOFF, jrfCutoff: JRF_CUTOFF, confidence: conf, factors, suggestions, riskLevel: rl, consistencyScore: cs, p1Trend: paper1TrendDir, p2Trend: paper2TrendDir, dataPoints: dp };
  }, [allCompletedAttempts, paper1Attempts, paper2Attempts, paper1Accuracy, paper2Accuracy, streak, paper1TrendDir, paper2TrendDir, notAttemptedTests, syllabusCoverage]);

  // ════════════════════════════════════════════════════════════
  //  §10 GOAL TRACKER
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

  const todayKey = new Date().toISOString().split('T')[0];
  const todayDetailed = useMemo(() => {
    const todayStr = todayKey;
    const todayAttempts = allCompletedAttempts.filter(a => new Date(a.completedAt || a.createdAt).toISOString().split('T')[0] === todayStr);
    let pendingCleared = 0, weakRetried = 0;
    todayAttempts.forEach(a => {
      const tid = (a.testId?._id || a.testId)?.toString(); if (!tid) return;
      const prev = allCompletedAttempts.filter(p => (p.testId?._id || p.testId)?.toString() === tid && new Date(p.completedAt || p.createdAt).toISOString().split('T')[0] !== todayStr);
      if (prev.length === 0) pendingCleared++;
      else { const best = Math.max(...prev.map(p => p.totalMarks > 0 ? Math.round((p.score / p.totalMarks) * 100) : 0)); if (best < 50) weakRetried++; }
    });
    const scores = todayAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0);
    const tc = todayAttempts.reduce((s, a) => s + (a.correctCount || 0), 0);
    const tw = todayAttempts.reduce((s, a) => s + (a.wrongCount || 0), 0);
    const ts = todayAttempts.reduce((s, a) => s + (a.skippedCount || 0), 0);
    const acc = (tc + tw) > 0 ? Math.round((tc / (tc + tw)) * 100) : 0;
    const time = todayAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0);
    return {
      count: todayAttempts.length, pendingCleared, weakRetried,
      bestScore: scores.length > 0 ? Math.max(...scores) : 0,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      accuracy: acc, avgAccuracy: acc, timeSpent: time,
      p1Count: todayAttempts.filter(a => a.testId?.paper === 'paper1').length,
      p2Count: todayAttempts.filter(a => a.testId?.paper === 'paper2').length,
      correct: tc, wrong: tw, skipped: ts,
      totalQuestionsSolved: tc + tw + ts,
      scoresAboveTarget: scores.filter(s => s >= (customTargets.targetScore || 75)).length,
      perfectScores: scores.filter(s => s >= 90).length,
      attempts: todayAttempts, scores,
    };
  }, [allCompletedAttempts, todayKey, customTargets]);

  const todayActivity = todayDetailed;
  const yesterdayActivity = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return activityMap[y.toISOString().split('T')[0]] || { count: 0, avgScore: 0, avgAccuracy: 0 };
  }, [activityMap]);

  const [goalHistory, setGoalHistoryState] = useState(() => {
    try { const s = localStorage.getItem('netprep_goal_history'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });
  const goalStreak = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let c = 0;
    for (let i = 1; i < 365; i++) { const d = new Date(today); d.setDate(d.getDate() - i); if (goalHistory[d.toISOString().split('T')[0]] === true) c++; else break; }
    return c;
  }, [goalHistory]);

  const dayProgress = useMemo(() => {
    const now = new Date(); const h = now.getHours(), m = now.getMinutes();
    const tm = h * 60 + m, sStart = 360, sEnd = 1380, sDur = sEnd - sStart;
    const elapsed = Math.max(0, Math.min(tm - sStart, sDur));
    const pct = Math.round((elapsed / sDur) * 100);
    const rem = Math.max(0, sEnd - tm);
    return { pct: Math.min(100, Math.max(0, pct)), remainingHours: Math.floor(rem / 60), remainingMins: rem % 60, totalRemaining: rem, period: h >= 17 ? 'evening' : h >= 12 ? 'afternoon' : h < 6 ? 'night' : 'morning', isLateNight: h >= 23 || h < 6, isPastHalf: pct > 50, isAlmostOver: pct > 80, currentHour: h };
  }, []);

  const todayXP = useMemo(() => {
    let xp = 0; const td = todayDetailed;
    xp += td.count * 10;
    if (td.accuracy >= 80) xp += td.count * 5; else if (td.accuracy >= 70) xp += td.count * 3;
    xp += td.perfectScores * 15 + td.pendingCleared * 8 + td.weakRetried * 12 + Math.min(streak, 7) * 2;
    return xp;
  }, [todayDetailed, streak]);

  const autoGeneratedGoals = useMemo(() => {
    const goals = [];
    const { dailyTests, dailyAccuracy, targetScore } = customTargets;
    const td = todayDetailed, dp = dayProgress;
    goals.push({ id: 'daily_tests', title: `Complete ${dailyTests} tests`, titleHi: `${dailyTests} टेस्ट पूरे करें`, icon: 'ClipboardList', target: dailyTests, current: td.count, type: 'count', color: 'blue', priority: 'critical', xp: 10, description: td.count >= dailyTests ? `Done! ${td.count} tests` : `${dailyTests - td.count} more`, descriptionHi: td.count >= dailyTests ? `पूरा! ${td.count} टेस्ट` : `${dailyTests - td.count} और`, urgency: td.count < dailyTests && dp.isPastHalf ? 'high' : 'normal' });
    goals.push({ id: 'daily_accuracy', title: `${dailyAccuracy}%+ accuracy`, titleHi: `${dailyAccuracy}%+ सटीकता`, icon: 'Target', target: dailyAccuracy, current: td.count > 0 ? td.accuracy : 0, type: 'percentage', color: 'emerald', priority: 'high', xp: 15, description: td.count === 0 ? 'Take a test first' : td.accuracy >= dailyAccuracy ? `${td.accuracy}% ✓` : `Need ${dailyAccuracy - td.accuracy}% more`, descriptionHi: td.count === 0 ? 'पहले टेस्ट दें' : td.accuracy >= dailyAccuracy ? `${td.accuracy}% ✓` : `${dailyAccuracy - td.accuracy}% और`, urgency: td.count > 0 && td.accuracy < dailyAccuracy ? 'medium' : 'normal' });
    const last5 = scoreTrend.slice(-5).reduce((s, d) => s + d.score, 0) / (Math.min(scoreTrend.length, 5) || 1);
    const impTarget = Math.min(100, Math.round(last5 + 5));
    goals.push({ id: 'beat_avg', title: `Score ${impTarget}%+`, titleHi: `${impTarget}%+ स्कोर`, icon: 'TrendingUp', target: impTarget, current: td.bestScore, type: 'percentage', color: 'purple', priority: 'high', xp: 20, description: td.bestScore >= impTarget ? `Best: ${td.bestScore}% ✓` : `Best: ${td.bestScore}%`, descriptionHi: td.bestScore >= impTarget ? `सर्वश्रेष्ठ: ${td.bestScore}% ✓` : `सर्वश्रेष्ठ: ${td.bestScore}%`, urgency: 'normal' });
    if (notAttemptedTests.length > 0) { const pt = Math.min(2, notAttemptedTests.length); goals.push({ id: 'clear_pending', title: `Clear ${pt} pending`, titleHi: `${pt} बाकी पूरे करें`, icon: 'Clock', target: pt, current: td.pendingCleared, type: 'count', color: 'amber', priority: 'medium', xp: 8, description: `${notAttemptedTests.length} total pending`, descriptionHi: `${notAttemptedTests.length} कुल बाकी`, urgency: notAttemptedTests.length > 10 ? 'high' : 'normal' }); }
    if (needsAttentionTests.length > 0) { goals.push({ id: 'retry_weak', title: 'Retry 1 weak test', titleHi: '1 कमजोर दोबारा दें', icon: 'RefreshCw', target: 1, current: td.weakRetried, type: 'count', color: 'red', priority: 'high', xp: 12, description: `${needsAttentionTests.length} tests <50%`, descriptionHi: `${needsAttentionTests.length} टेस्ट <50%`, urgency: needsAttentionTests.length > 3 ? 'high' : 'normal' }); }
    goals.push({ id: 'streak', title: streak > 0 ? `Extend ${streak}d streak` : 'Start streak', titleHi: streak > 0 ? `${streak}d स्ट्रीक बढ़ाएं` : 'स्ट्रीक शुरू', icon: 'Flame', target: 1, current: td.count > 0 ? 1 : 0, type: 'count', color: 'orange', priority: td.count === 0 && dp.isPastHalf ? 'critical' : 'medium', xp: 5 + Math.min(streak, 10), description: td.count > 0 ? `Streak secured!` : `Don't break it!`, descriptionHi: td.count > 0 ? `स्ट्रीक पक्की!` : `मत तोड़ो!`, urgency: td.count === 0 && dp.isAlmostOver ? 'critical' : 'normal' });
    const timeMins = Math.round(td.timeSpent / 60);
    goals.push({ id: 'study_time', title: '30+ min study', titleHi: '30+ मिनट पढ़ाई', icon: 'Timer', target: 30, current: timeMins, type: 'count', color: 'cyan', priority: 'medium', xp: 10, description: `${timeMins}/30 min`, descriptionHi: `${timeMins}/30 मिनट`, urgency: 'normal' });
    if (dailyTests >= 2) { const p1t = Math.max(1, Math.floor(dailyTests / 2)), p2t = Math.max(1, dailyTests - p1t); goals.push({ id: 'paper_balance', title: `P1:${p1t}+ P2:${p2t}+`, titleHi: `P1:${p1t}+ P2:${p2t}+`, icon: 'BarChart2', target: 2, current: (td.p1Count >= p1t ? 1 : 0) + (td.p2Count >= p2t ? 1 : 0), type: 'count', color: 'indigo', priority: 'low', xp: 8, description: `P1:${td.p1Count}/${p1t} | P2:${td.p2Count}/${p2t}`, descriptionHi: `P1:${td.p1Count}/${p1t} | P2:${td.p2Count}/${p2t}`, urgency: 'normal' }); }
    const pO = { critical: 0, high: 1, medium: 2, low: 3 };
    goals.sort((a, b) => { const ad = a.current >= a.target ? 1 : 0, bd = b.current >= b.target ? 1 : 0; if (ad !== bd) return ad - bd; return (pO[a.priority] || 3) - (pO[b.priority] || 3); });
    return goals;
  }, [customTargets, todayDetailed, scoreTrend, notAttemptedTests, needsAttentionTests, streak, dayProgress]);

  const goalCompletionPct = useMemo(() => {
    if (autoGeneratedGoals.length === 0) return 0;
    const done = autoGeneratedGoals.filter(g => g.current >= g.target).length;
    const pct = Math.round((done / autoGeneratedGoals.length) * 100);
    if (pct === 100 && todayDetailed.count > 0) { try { const e = JSON.parse(localStorage.getItem('netprep_goal_history') || '{}'); if (!e[todayKey]) { e[todayKey] = true; localStorage.setItem('netprep_goal_history', JSON.stringify(e)); } } catch {} }
    return pct;
  }, [autoGeneratedGoals, todayDetailed, todayKey]);
  const goalsCompleted = useMemo(() => autoGeneratedGoals.filter(g => g.current >= g.target).length, [autoGeneratedGoals]);
  const totalGoals = autoGeneratedGoals.length;

  const pressureMessage = useMemo(() => {
    const td = todayDetailed, dp = dayProgress, gc = goalsCompleted, tg = totalGoals;
    if (gc === tg && td.count > 0) return { type: 'celebration', en: 'All goals complete! Champion! 🏆', hi: 'सभी लक्ष्य पूरे! चैंपियन! 🏆' };
    if (td.count === 0 && dp.isAlmostOver) return { type: 'critical', en: 'Day almost over! Take 1 test NOW!', hi: 'दिन खत्म! अभी 1 टेस्ट दो!' };
    if (td.count === 0 && dp.isPastHalf) return { type: 'warning', en: 'Half day gone, 0 tests! Start!', hi: 'आधा दिन गया, 0 टेस्ट!' };
    if (td.count === 0) return { type: 'info', en: 'New day! Start your first test.', hi: 'नया दिन! पहला टेस्ट शुरू करो।' };
    if (gc < tg / 2 && dp.isPastHalf) return { type: 'warning', en: `${gc}/${tg} goals. Pick up pace!`, hi: `${gc}/${tg} लक्ष्य। तेज करो!` };
    if (gc >= tg / 2) return { type: 'positive', en: `${gc}/${tg} done! Keep going!`, hi: `${gc}/${tg} पूरे! जारी रखो!` };
    return { type: 'info', en: `${tg - gc} goals left. You can!`, hi: `${tg - gc} बाकी। कर सकते हो!` };
  }, [todayDetailed, dayProgress, goalsCompleted, totalGoals]);

  // ════════════════════════════════════════════
  //  §11 SPEED ANALYTICS
  // ════════════════════════════════════════════
  const speedAnalytics = useMemo(() => {
    if (allCompletedAttempts.length === 0) return { avgTimePerQ: 0, fastestTest: null, slowestTest: null, speedTrend: [], timeDistribution: [] };
    const wt = allCompletedAttempts.filter(a => a.totalTimeTaken > 0 && (a.correctCount + a.wrongCount + a.skippedCount) > 0);
    const avgs = wt.map(a => ({ avgTime: Math.round(a.totalTimeTaken / (a.correctCount + a.wrongCount + a.skippedCount)), score: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0, title: a.testId?.title || 'Test', date: a.completedAt }));
    const sorted = [...avgs].sort((a, b) => a.avgTime - b.avgTime);
    const sT = [...wt].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).slice(-10).map((a, i) => { const tQ = a.correctCount + a.wrongCount + a.skippedCount; return { name: `T${i + 1}`, speed: tQ > 0 ? Math.round(a.totalTimeTaken / tQ) : 0, accuracy: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.correctCount / t) * 100) : 0; })() }; });
    const bk = { '<30s': 0, '30-60s': 0, '60-90s': 0, '90-120s': 0, '>120s': 0 };
    avgs.forEach(a => { if (a.avgTime < 30) bk['<30s']++; else if (a.avgTime < 60) bk['30-60s']++; else if (a.avgTime < 90) bk['60-90s']++; else if (a.avgTime < 120) bk['90-120s']++; else bk['>120s']++; });
    const oa = avgs.length > 0 ? Math.round(avgs.reduce((s, a) => s + a.avgTime, 0) / avgs.length) : 0;
    return { avgTimePerQ: oa, fastestTest: sorted[0] || null, slowestTest: sorted[sorted.length - 1] || null, speedTrend: sT, timeDistribution: Object.entries(bk).map(([n, v]) => ({ name: n, value: v })) };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════
  //  §12 ERROR PATTERNS
  // ════════════════════════════════════════════
  const errorPatterns = useMemo(() => {
    if (allCompletedAttempts.length === 0) return { byType: [], weakUnits: [], strongUnits: [], errorRate: 0, improvementAreas: [], unitPerformance: [] };
    const uM = {};
    allCompletedAttempts.forEach(a => { (a.topicAnalysis || []).forEach(ta => { const k = ta.unit || 'Other'; if (!uM[k]) uM[k] = { correct: 0, wrong: 0, total: 0, skipped: 0 }; uM[k].correct += ta.correct || 0; uM[k].wrong += ta.wrong || 0; uM[k].total += ta.total || 0; uM[k].skipped += ta.skipped || 0; }); });
    const uP = Object.entries(uM).map(([u, s]) => ({ unit: u, ...s, accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0, errorRate: s.total > 0 ? Math.round((s.wrong / s.total) * 100) : 0 })).sort((a, b) => a.accuracy - b.accuracy);
    const wU = uP.filter(u => u.accuracy < 50 && u.total >= 3);
    const sU = uP.filter(u => u.accuracy >= 70 && u.total >= 3).sort((a, b) => b.accuracy - a.accuracy);
    const tC = Object.values(uM).reduce((s, u) => s + u.correct, 0);
    const tW = Object.values(uM).reduce((s, u) => s + u.wrong, 0);
    const eR = (tC + tW) > 0 ? Math.round((tW / (tC + tW)) * 100) : 0;
    const iA = wU.slice(0, 5).map(u => ({ unit: u.unit, accuracy: u.accuracy, errorRate: u.errorRate, questionsAttempted: u.total, suggestion: u.accuracy < 30 ? 'Critical revision needed' : u.accuracy < 50 ? 'Weak - more practice' : 'Review mistakes' }));
    return { byType: Object.entries(questionStats?.byType || {}).map(([t, c]) => ({ type: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), count: c })), weakUnits: wU, strongUnits: sU, errorRate: eR, improvementAreas: iA, unitPerformance: uP };
  }, [allCompletedAttempts, questionStats]);

  // ════════════════════════════════════════════
  //  §13 STUDY RECOMMENDATIONS
  // ════════════════════════════════════════════
  const studyRecommendations = useMemo(() => {
    const recs = [];
    if (errorPatterns.weakUnits.length > 0) { const w = errorPatterns.weakUnits[0]; recs.push({ id: 'weak', priority: 'critical', icon: 'AlertTriangle', title: `Focus: ${w.unit}`, titleHi: `${w.unit} पर ध्यान`, detail: `${w.accuracy}% accuracy`, detailHi: `${w.accuracy}% सटीकता`, color: 'red' }); }
    const p1U = syllabusCoverage.paper1.filter(c => c.level === 'not_started' || c.level === 'no_tests');
    const p2U = syllabusCoverage.paper2.filter(c => c.level === 'not_started' || c.level === 'no_tests');
    if (p1U.length > 0) recs.push({ id: 'p1_start', priority: 'high', icon: 'BookOpen', title: `Start ${p1U[0].name}`, titleHi: `${p1U[0].name} शुरू करें`, detail: `${p1U.length} P1 uncovered`, detailHi: `P1 ${p1U.length} बाकी`, color: 'blue' });
    if (p2U.length > 0) recs.push({ id: 'p2_start', priority: 'high', icon: 'Target', title: `Start ${p2U[0].name}`, titleHi: `${p2U[0].name} शुरू करें`, detail: `${p2U.length} P2 uncovered`, detailHi: `P2 ${p2U.length} बाकी`, color: 'purple' });
    if (trendDirection === 'down') recs.push({ id: 'declining', priority: 'high', icon: 'TrendingDown', title: 'Scores declining', titleHi: 'स्कोर गिर रहे', detail: 'Review mistakes', detailHi: 'गलतियां देखें', color: 'orange' });
    if (notAttemptedTests.length > 5) recs.push({ id: 'pending', priority: 'medium', icon: 'Clock', title: `${notAttemptedTests.length} pending`, titleHi: `${notAttemptedTests.length} बाकी`, detail: 'Complete old tests', detailHi: 'पुराने पूरे करें', color: 'amber' });
    if (streak < 3 && allCompletedAttempts.length > 5) recs.push({ id: 'consistency', priority: 'medium', icon: 'Flame', title: 'Build routine', titleHi: 'आदत बनाएं', detail: `Streak: ${streak}d`, detailHi: `स्ट्रीक: ${streak}d`, color: 'orange' });
    if (speedAnalytics.avgTimePerQ > 90) recs.push({ id: 'speed', priority: 'low', icon: 'Zap', title: 'Improve speed', titleHi: 'गति बढ़ाएं', detail: `${speedAnalytics.avgTimePerQ}s/Q`, detailHi: `${speedAnalytics.avgTimePerQ}s/प्रश्न`, color: 'cyan' });
    const pO = { critical: 0, high: 1, medium: 2, low: 3 };
    return recs.sort((a, b) => (pO[a.priority] || 3) - (pO[b.priority] || 3)).slice(0, 8);
  }, [errorPatterns, syllabusCoverage, trendDirection, notAttemptedTests, streak, allCompletedAttempts, speedAnalytics]);

  // ════════════════════════════════════════════
  //  §14 CHARTS / UI DATA
  // ════════════════════════════════════════════
  const scoreDistribution = useMemo(() => {
    if (allCompletedAttempts.length === 0) return [];
    const bk = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    allCompletedAttempts.forEach(a => { const p = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0; if (p <= 20) bk['0-20']++; else if (p <= 40) bk['21-40']++; else if (p <= 60) bk['41-60']++; else if (p <= 80) bk['61-80']++; else bk['81-100']++; });
    return Object.entries(bk).map(([r, c]) => ({ range: r, count: c, pct: Math.round((c / allCompletedAttempts.length) * 100), color: r === '81-100' ? '#22c55e' : r === '61-80' ? '#3b82f6' : r === '41-60' ? '#f59e0b' : r === '21-40' ? '#f97316' : '#ef4444' }));
  }, [allCompletedAttempts]);

  const personalRecords = useMemo(() => {
    if (allCompletedAttempts.length === 0) return {};
    const scores = allCompletedAttempts.map(a => ({ pct: a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0, title: a.testId?.title || 'Test', date: a.completedAt, accuracy: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.correctCount / t) * 100) : 0; })(), timeTaken: a.totalTimeTaken || 0 }));
    const sortedS = [...scores].sort((a, b) => b.pct - a.pct);
    const sortedA = [...scores].sort((a, b) => b.accuracy - a.accuracy);
    const dayC = {}; allCompletedAttempts.forEach(a => { const k = new Date(a.completedAt).toISOString().split('T')[0]; dayC[k] = (dayC[k] || 0) + 1; });
    const bestDay = Object.entries(dayC).sort((a, b) => b[1] - a[1])[0];
    return { highestScore: sortedS[0], lowestScore: sortedS[sortedS.length - 1], bestAccuracy: sortedA[0], totalTestsTaken: allCompletedAttempts.length, bestDay: bestDay ? { date: bestDay[0], count: bestDay[1] } : null, longestStreak, currentStreak: streak, totalStudyTime: allCompletedAttempts.reduce((s, a) => s + (a.totalTimeTaken || 0), 0) };
  }, [allCompletedAttempts, longestStreak, streak]);

  const timeOfDayAnalysis = useMemo(() => {
    const hM = {}; for (let i = 0; i < 24; i++) hM[i] = { count: 0, totalScore: 0, totalAccuracy: 0 };
    allCompletedAttempts.forEach(a => { if (!a.startedAt && !a.completedAt) return; const h = new Date(a.startedAt || a.completedAt).getHours(); hM[h].count++; hM[h].totalScore += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0; const at = (a.correctCount || 0) + (a.wrongCount || 0); hM[h].totalAccuracy += at > 0 ? Math.round((a.correctCount / at) * 100) : 0; });
    const hD = Object.entries(hM).map(([h, d]) => ({ hour: parseInt(h), label: `${h.toString().padStart(2, '0')}:00`, count: d.count, avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0, avgAccuracy: d.count > 0 ? Math.round(d.totalAccuracy / d.count) : 0 }));
    const wT = hD.filter(h => h.count >= 2);
    const bH = [...wT].sort((a, b) => b.avgScore - a.avgScore)[0] || null;
    const periods = [{ name: 'Morning', nameHi: 'सुबह', range: [6, 12], icon: 'Sun' }, { name: 'Afternoon', nameHi: 'दोपहर', range: [12, 17], icon: 'Coffee' }, { name: 'Evening', nameHi: 'शाम', range: [17, 21], icon: 'Sunset' }, { name: 'Night', nameHi: 'रात', range: [21, 6], icon: 'Moon' }];
    const pD = periods.map(p => { const hrs = hD.filter(h => { if (p.range[0] < p.range[1]) return h.hour >= p.range[0] && h.hour < p.range[1]; return h.hour >= p.range[0] || h.hour < p.range[1]; }); const tc = hrs.reduce((s, h) => s + h.count, 0); return { ...p, count: tc, avgScore: tc > 0 ? Math.round(hrs.reduce((s, h) => s + h.avgScore * h.count, 0) / tc) : 0 }; });
    return { hourData: hD, bestHour: bH, periodData: pD, bestPeriod: [...pD].sort((a, b) => b.avgScore - a.avgScore)[0] };
  }, [allCompletedAttempts]);

  const difficultyData = useMemo(() => {
    const bd = questionStats?.byDifficulty;
    if (!bd) return [];
    return [{ name: 'Easy', value: bd.easy || 0, color: '#22c55e' }, { name: 'Medium', value: bd.medium || 0, color: '#f59e0b' }, { name: 'Hard', value: bd.hard || 0, color: '#ef4444' }].filter(d => d.value > 0);
  }, [questionStats]);

  const questionTypeData = useMemo(() => {
    const bt = questionStats?.byType;
    if (!bt || typeof bt !== 'object') return [];
    return Object.entries(bt).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, c]) => ({ name: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value: c, pct: totalQuestions > 0 ? Math.round((c / totalQuestions) * 100) : 0 }));
  }, [questionStats, totalQuestions]);

  const topicPerformance = useMemo(() => {
    const map = {};
    allCompletedAttempts.forEach(a => { (a.topicAnalysis || []).forEach(t => { const k = t.unit || t.topic || 'Other'; if (!map[k]) map[k] = { unit: k, correct: 0, wrong: 0, skipped: 0, total: 0 }; map[k].correct += t.correct || 0; map[k].wrong += t.wrong || 0; map[k].skipped += t.skipped || 0; map[k].total += t.total || 0; }); });
    return Object.values(map).map(t => ({ ...t, accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0, fullMark: 100 })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [allCompletedAttempts]);

  const achievements = useMemo(() => {
    const list = []; const ta = allCompletedAttempts.length;
    const best = ta > 0 ? Math.max(...allCompletedAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0)) : 0;
    const add = (i, l, d, c, u, p) => list.push({ icon: i, label: l, desc: d, color: c, unlocked: u, progress: p });
    if (totalQuestions >= 100) add('Layers', 'Century', '100+ Qs', 'amber', true); else add('Layers', 'Century', `${totalQuestions}/100`, 'gray', false, totalQuestions / 100);
    if (totalQuestions >= 500) add('Crown', 'Massive', '500+ Qs', 'purple', true); else if (totalQuestions >= 100) add('Crown', 'Massive', `${totalQuestions}/500`, 'gray', false, totalQuestions / 500);
    if (ta >= 1) add('Play', 'Starter', '1st test', 'blue', true); else add('Play', 'Starter', '0/1', 'gray', false, 0);
    if (ta >= 10) add('Flame', 'Dedicated', '10+', 'orange', true); else add('Flame', 'Dedicated', `${ta}/10`, 'gray', false, ta / 10);
    if (ta >= 50) add('Medal', 'Veteran', '50+', 'amber', true); else if (ta >= 10) add('Medal', 'Veteran', `${ta}/50`, 'gray', false, ta / 50);
    if (best >= 90) add('Star', 'Expert', '90%+', 'amber', true); else if (best >= 80) add('Star', 'Brilliant', '80%+', 'emerald', true); else add('Star', 'Brilliant', `${best}%/80%`, 'gray', false, best / 80);
    if (overallAccuracy >= 70) add('Target', 'Sharp', '70%+ acc', 'emerald', true); else add('Target', 'Sharp', `${overallAccuracy}%/70%`, 'gray', false, overallAccuracy / 70);
    if (streak >= 7) add('Flame', 'OnFire', '7d', 'orange', true); else add('Flame', 'OnFire', `${streak}/7d`, 'gray', false, streak / 7);
    return list;
  }, [totalQuestions, allCompletedAttempts, overallAccuracy, streak]);

  // ════════════════════════════════════════════════════════════════════
  //  §15  🆕 SMART REVISION HUB (Spaced Repetition + Priority)
  // ════════════════════════════════════════════════════════════════════
  const smartRevision = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const dUntilExam = daysUntilExam || 365;

    // Build revision items from testPerfMap
    const items = Object.values(testPerfMap).map(t => {
      const lastDate = new Date(t.lastDate);
      lastDate.setHours(0, 0, 0, 0);
      const daysSince = Math.max(0, Math.floor((todayMs - lastDate.getTime()) / 86400000));
      const srs = getSRSInterval(t.bestScore);

      // If test was attempted multiple times and improved, extend interval
      let effectiveInterval = srs.interval;
      if (t.allScores.length > 1 && t.improvement > 10) effectiveInterval = Math.round(effectiveInterval * 1.5);

      const nextRevisionDate = new Date(lastDate);
      nextRevisionDate.setDate(nextRevisionDate.getDate() + effectiveInterval);
      const isOverdue = nextRevisionDate <= today;
      const overdueBy = isOverdue ? Math.floor((todayMs - nextRevisionDate.getTime()) / 86400000) : 0;
      const isDueToday = nextRevisionDate.toISOString().split('T')[0] === todayKey;
      const isDueTomorrow = (() => { const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1); return nextRevisionDate.toISOString().split('T')[0] === tmrw.toISOString().split('T')[0]; })();
      const isDueThisWeek = nextRevisionDate <= new Date(todayMs + 7 * 86400000);

      // Priority score (0-100, higher = more urgent)
      let priority = 0;
      priority += Math.max(0, 100 - t.bestScore); // Lower score = higher priority
      if (isOverdue) priority += overdueBy * 5; // Overdue penalty
      if (t.trend === 'down') priority += 20; // Declining = urgent
      if (dUntilExam < 30) priority += 15; // Exam near = urgent
      if (dUntilExam < 7) priority += 25; // Exam very near
      if (daysSince > 14) priority += 10; // Not practiced in 2 weeks
      priority = Math.min(100, priority);

      // Category
      let category = 'mastered';
      if (t.bestScore < 30) category = 'critical';
      else if (t.bestScore < 50) category = 'weak';
      else if (t.bestScore < 70 || (t.improvement > 15 && t.bestScore < 85)) category = 'improving';
      else if (t.bestScore >= 85) category = 'mastered';
      else category = 'learning';

      return {
        testId: t.testId, test: t.test,
        title: t.test?.title || 'Test',
        paper: t.test?.paper, unit: t.test?.unit,
        bestScore: t.bestScore, worstScore: t.worstScore,
        lastAttemptDate: t.lastDate, daysSinceLastAttempt: daysSince,
        attempts: t.attempts, allScores: t.allScores,
        trend: t.trend, improvement: t.improvement,
        srsInterval: effectiveInterval, srsLabel: srs.label,
        nextRevisionDate: nextRevisionDate.toISOString().split('T')[0],
        isOverdue, overdueBy, isDueToday, isDueTomorrow, isDueThisWeek,
        priorityScore: priority, category,
        lastAttempt: t.lastAttempt,
      };
    });

    // Sort by priority (highest first)
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

    // Marathon queue: critical first, then weak, then overdue rest
    const marathonQueue = [...critical, ...weak.filter(w => !critical.includes(w)), ...overdue.filter(o => !critical.includes(o) && !weak.includes(o))].slice(0, 20);

    // Stats
    const allImproved = items.filter(i => i.improvement > 0);
    const avgImprovement = allImproved.length > 0 ? Math.round(allImproved.reduce((s, i) => s + i.improvement, 0) / allImproved.length) : 0;

    return {
      all: items, critical, weak, improving, learning, mastered,
      overdue, todayDue, tomorrowDue, thisWeekDue,
      marathonQueue,
      stats: {
        totalTests: items.length, critical: critical.length, weak: weak.length,
        improving: improving.length, mastered: mastered.length,
        overdue: overdue.length, dueToday: todayDue.length,
        dueThisWeek: thisWeekDue.length,
        avgImprovement, totalRevisions: items.reduce((s, i) => s + i.attempts, 0),
      },
    };
  }, [testPerfMap, daysUntilExam, todayKey]);

  // ════════════════════════════════════════════════════════════════════
  //  §16  🆕 WEEKLY CHAPTER PERFORMANCE MATRIX
  // ════════════════════════════════════════════════════════════════════
  const weeklyChapterMatrix = useMemo(() => {
    const getWeekStart = (date) => {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff); return d;
    };
    const getWeekKey = (date) => {
      const ws = getWeekStart(date);
      return ws.toISOString().split('T')[0];
    };
    const formatDateRange = (start) => {
      const s = new Date(start);
      const e = new Date(s); e.setDate(e.getDate() + 6);
      return `${s.toLocaleDateString('en', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
    };

    // Group attempts by week
    const weekMap = {};
    allCompletedAttempts.forEach(a => {
      const wk = getWeekKey(a.completedAt || a.createdAt);
      if (!weekMap[wk]) weekMap[wk] = [];
      weekMap[wk].push(a);
    });

    // Get sorted week keys (most recent first)
    const weekKeys = Object.keys(weekMap).sort((a, b) => new Date(b) - new Date(a));

    // Build weekly data
    const buildWeekData = (weekKey, attempts) => {
      const allUnits = [...PAPER1_UNITS.map(u => ({ unit: u, name: PAPER1_UNIT_NAMES[u], paper: 'paper1' })), ...PAPER2_UNITS.map(u => ({ unit: u, name: PAPER2_UNIT_NAMES[u], paper: 'paper2' }))];

      // Per-unit stats for this week
      const unitStats = {};
      attempts.forEach(a => {
        const paper = a.testId?.paper;
        const unitId = normalizeUnitId(a.unit || a.testId?.unit);

        // From topicAnalysis
        (a.topicAnalysis || []).forEach(ta => {
          const taUnitId = normalizeUnitId(ta.unit || unitId);
          const k = `${paper}|${taUnitId || 'Other'}`;
          if (!unitStats[k]) unitStats[k] = { correct: 0, wrong: 0, skipped: 0, total: 0, scores: [], testsCount: 0, paper, unit: taUnitId || unitId };
          unitStats[k].correct += ta.correct || 0;
          unitStats[k].wrong += ta.wrong || 0;
          unitStats[k].skipped += ta.skipped || 0;
          unitStats[k].total += ta.total || 0;
        });

        // Count tests per unit
        if (unitId) {
          const k = `${paper}|${unitId}`;
          if (!unitStats[k]) unitStats[k] = { correct: 0, wrong: 0, skipped: 0, total: 0, scores: [], testsCount: 0, paper, unit: unitId };
          unitStats[k].testsCount += 1;
          const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
          unitStats[k].scores.push(pct);
        }
      });

      // Build chapters array
      const chapters = Object.entries(unitStats).map(([k, s]) => {
        const avgScore = s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0;
        const bestScore = s.scores.length > 0 ? Math.max(...s.scores) : 0;
        const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
        const unitName = (s.paper === 'paper1' ? PAPER1_UNIT_NAMES : PAPER2_UNIT_NAMES)[s.unit] || s.unit;
        return { key: k, unit: s.unit, name: unitName, paper: s.paper, testsCount: s.testsCount, avgScore, bestScore, accuracy, correct: s.correct, wrong: s.wrong, skipped: s.skipped, questionsTotal: s.total, scores: s.scores };
      }).sort((a, b) => b.avgScore - a.avgScore);

      // Find uncovered units
      const coveredUnits = new Set(chapters.map(c => `${c.paper}|${c.unit}`));
      const uncovered = allUnits.filter(u => !coveredUnits.has(`${u.paper}|${u.unit}`)).map(u => {
        // Find last practice date for this unit
        const lastPractice = allCompletedAttempts.filter(a => a.testId?.paper === u.paper && matchUnit(a.unit || a.testId?.unit, u.unit))
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
        const daysSince = lastPractice ? Math.floor((Date.now() - new Date(lastPractice.completedAt).getTime()) / 86400000) : Infinity;
        return { ...u, lastPracticed: lastPractice?.completedAt || null, daysSince: daysSince === Infinity ? null : daysSince };
      });

      // Day-by-day breakdown
      const dayMap = {};
      attempts.forEach(a => {
        const dayKey = new Date(a.completedAt || a.createdAt).getDay();
        const unit = a.unit || a.testId?.unit;
        if (!unit) return;
        const k = `${dayKey}|${a.testId?.paper}|${unit}`;
        const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
        if (!dayMap[k]) dayMap[k] = { scores: [] };
        dayMap[k].scores.push(pct);
      });

      // Best day
      const dayStats = {};
      attempts.forEach(a => {
        const d = new Date(a.completedAt || a.createdAt).getDay();
        if (!dayStats[d]) dayStats[d] = { count: 0, totalScore: 0 };
        dayStats[d].count += 1;
        dayStats[d].totalScore += a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
      });
      const bestDayEntry = Object.entries(dayStats).sort((a, b) => (b[1].totalScore / b[1].count) - (a[1].totalScore / a[1].count))[0];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const totalScore = attempts.reduce((s, a) => s + (a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0), 0);

      return {
        weekKey, dateRange: formatDateRange(weekKey),
        startDate: weekKey,
        endDate: (() => { const e = new Date(weekKey); e.setDate(e.getDate() + 6); return e.toISOString().split('T')[0]; })(),
        chapters, uncovered, dayMap,
        stats: {
          totalTests: attempts.length,
          chaptersCovered: chapters.length,
          totalChapters: allUnits.length,
          avgScore: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
          bestDay: bestDayEntry ? { day: dayNames[bestDayEntry[0]], count: bestDayEntry[1].count, avgScore: Math.round(bestDayEntry[1].totalScore / bestDayEntry[1].count) } : null,
        },
      };
    };

    // Current and previous weeks
    const currentWeekKey = getWeekKey(new Date());
    const weeks = weekKeys.slice(0, 6).map(wk => buildWeekData(wk, weekMap[wk]));
    const currentWeek = weeks.find(w => w.weekKey === currentWeekKey) || (weekMap[currentWeekKey] ? buildWeekData(currentWeekKey, weekMap[currentWeekKey]) : buildWeekData(currentWeekKey, []));
    const previousWeek = weeks.length > 1 ? weeks.find(w => w.weekKey !== currentWeekKey) || weeks[1] : null;

    // Chapter trends across weeks (multi-week)
    const chapterTrends = {};
    weeks.slice(0, 4).reverse().forEach((w, wi) => {
      w.chapters.forEach(c => {
        if (!chapterTrends[c.key]) chapterTrends[c.key] = { unit: c.unit, name: c.name, paper: c.paper, weeks: [] };
        chapterTrends[c.key].weeks.push({ weekKey: w.weekKey, avgScore: c.avgScore, testsCount: c.testsCount });
      });
    });

    // Comparison
    const comparison = previousWeek ? {
      testsChange: currentWeek.stats.totalTests - previousWeek.stats.totalTests,
      chaptersChange: currentWeek.stats.chaptersCovered - previousWeek.stats.chaptersCovered,
      scoreChange: currentWeek.stats.avgScore - previousWeek.stats.avgScore,
    } : null;

    // Per-chapter comparison with last week
    if (previousWeek) {
      const prevMap = {};
      previousWeek.chapters.forEach(c => { prevMap[c.key] = c.avgScore; });
      currentWeek.chapters.forEach(c => {
        c.changeVsLastWeek = prevMap[c.key] !== undefined ? c.avgScore - prevMap[c.key] : null;
      });
    }

    // Insights
    const insights = [];
    if (currentWeek.uncovered.length > 0) {
      const critical = currentWeek.uncovered.filter(u => u.daysSince !== null && u.daysSince > 14);
      if (critical.length > 0) insights.push({ type: 'critical', text: `${critical[0].name} not practiced in ${critical[0].daysSince} days!`, textHi: `${critical[0].name} ${critical[0].daysSince} दिन से नहीं!`, priority: 'critical' });
      insights.push({ type: 'warning', text: `${currentWeek.uncovered.length} chapters uncovered this week`, textHi: `इस हफ्ते ${currentWeek.uncovered.length} अध्याय नहीं`, priority: 'high' });
    }
    const declining = currentWeek.chapters.filter(c => c.changeVsLastWeek !== null && c.changeVsLastWeek < -5);
    declining.forEach(c => { insights.push({ type: 'warning', text: `${c.name} dropped ${Math.abs(c.changeVsLastWeek)}%`, textHi: `${c.name} ${Math.abs(c.changeVsLastWeek)}% गिरा`, priority: 'high' }); });
    const improving = currentWeek.chapters.filter(c => c.changeVsLastWeek !== null && c.changeVsLastWeek > 5);
    improving.forEach(c => { insights.push({ type: 'positive', text: `${c.name} improved +${c.changeVsLastWeek}%`, textHi: `${c.name} +${c.changeVsLastWeek}% बढ़ा`, priority: 'low' }); });
    if (currentWeek.stats.bestDay) insights.push({ type: 'info', text: `Best day: ${currentWeek.stats.bestDay.day} (${currentWeek.stats.bestDay.avgScore}%)`, textHi: `सर्वश्रेष्ठ दिन: ${currentWeek.stats.bestDay.day} (${currentWeek.stats.bestDay.avgScore}%)`, priority: 'low' });

    // Suggested plan for next week
    const suggestedPlan = [];
    const dayFocus = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Prioritize: uncovered critical > declining > weak > uncovered > rest
    const planPriority = [
      ...currentWeek.uncovered.filter(u => u.daysSince !== null && u.daysSince > 14).map(u => ({ ...u, planPriority: 0 })),
      ...declining.map(c => ({ unit: c.unit, name: c.name, paper: c.paper, planPriority: 1 })),
      ...currentWeek.uncovered.filter(u => u.daysSince === null || u.daysSince <= 14).map(u => ({ ...u, planPriority: 2 })),
    ];
    dayFocus.forEach((day, i) => {
      if (i < planPriority.length) {
        suggestedPlan.push({ day, unit: planPriority[i].unit, name: planPriority[i].name, paper: planPriority[i].paper, focus: planPriority[i].planPriority === 0 ? 'critical' : planPriority[i].planPriority === 1 ? 'revision' : 'new', testCount: 2 });
      } else if (i === 5) {
        suggestedPlan.push({ day, unit: null, name: 'Full Mock', paper: 'combined', focus: 'mock', testCount: 1 });
      } else if (i === 6) {
        suggestedPlan.push({ day, unit: null, name: 'Review Mistakes', paper: null, focus: 'review', testCount: 0 });
      } else {
        suggestedPlan.push({ day, unit: null, name: 'Mixed Practice', paper: null, focus: 'practice', testCount: 2 });
      }
    });

    return { currentWeek, previousWeek, weeks, chapterTrends, comparison, insights, suggestedPlan };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════════════
  //  §17  🆕 EXAM COMMAND CENTER
  // ════════════════════════════════════════════════════════════════════
  const examCommandCenter = useMemo(() => {
    const isSet = !!examDate;
    const totalDays = isSet ? Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000)) : null;
    const examDateObj = isSet ? new Date(examDate) : null;

    // Calculate hours/minutes
    const now = new Date();
    const hours = isSet ? Math.max(0, Math.floor(((examDateObj - now) % 86400000) / 3600000)) : 0;
    const minutes = isSet ? Math.max(0, Math.floor(((examDateObj - now) % 3600000) / 60000)) : 0;

    // Total days from start (when first test was taken)
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
      else currentPhaseIdx = 0;
    } else {
      // Use journey progress
      currentPhaseIdx = allPhases.findIndex(p => journeyProgress >= p.pctRange[0] && journeyProgress < p.pctRange[1]);
      if (currentPhaseIdx === -1) currentPhaseIdx = Math.min(4, Math.floor(journeyProgress / 25));
    }

    const phasesWithStatus = allPhases.map((p, i) => ({
      ...p,
      status: i < currentPhaseIdx ? 'completed' : i === currentPhaseIdx ? 'current' : 'upcoming',
      progress: i < currentPhaseIdx ? 100 : i === currentPhaseIdx ? Math.round(((journeyProgress - p.pctRange[0]) / (p.pctRange[1] - p.pctRange[0])) * 100) : 0,
    }));

    // Milestones
    const milestones = [];
    const addMs = (id, title, titleHi, target, current, icon, color) => {
      milestones.push({ id, title, titleHi, target, current, completed: current >= target, progress: Math.min(100, Math.round((current / Math.max(target, 1)) * 100)), icon, color });
    };
    addMs('first_test', 'First test', 'पहला टेस्ट', 1, allCompletedAttempts.length, 'Play', 'blue');
    addMs('ten_tests', '10 tests', '10 टेस्ट', 10, allCompletedAttempts.length, 'ClipboardList', 'blue');
    addMs('fifty_tests', '50 tests', '50 टेस्ट', 50, allCompletedAttempts.length, 'Medal', 'amber');
    addMs('hundred_tests', '100 tests', '100 टेस्ट', 100, allCompletedAttempts.length, 'Crown', 'purple');
    const p1Covered = syllabusCoverage.paper1.filter(c => c.level !== 'not_started' && c.level !== 'no_tests').length;
    const p2Covered = syllabusCoverage.paper2.filter(c => c.level !== 'not_started' && c.level !== 'no_tests').length;
    addMs('p1_covered', 'All P1 units', 'सभी P1 इकाइयां', 10, p1Covered, 'BookOpen', 'blue');
    addMs('p2_covered', 'All P2 units', 'सभी P2 इकाइयां', 10, p2Covered, 'Target', 'purple');
    const best = allCompletedAttempts.length > 0 ? Math.max(...allCompletedAttempts.map(a => a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0)) : 0;
    addMs('score_70', 'Score 70%+', '70%+ स्कोर', 70, best, 'TrendingUp', 'emerald');
    addMs('score_80', 'Score 80%+', '80%+ स्कोर', 80, best, 'Star', 'amber');
    addMs('streak_7', '7-day streak', '7-दिन स्ट्रीक', 7, streak, 'Flame', 'orange');
    addMs('all_attempted', 'All tests done', 'सभी टेस्ट', createdTests.length || 1, allCompletedAttempts.length, 'CheckCircle', 'emerald');

    // Pace calculator
    const recentDays = Math.min(14, elapsedDays || 1);
    const recentStart = new Date(now); recentStart.setDate(recentStart.getDate() - recentDays);
    const recentTests = allCompletedAttempts.filter(a => new Date(a.completedAt) >= recentStart).length;
    const currentPace = recentDays > 0 ? Math.round((recentTests / recentDays) * 10) / 10 : 0;
    const remainingTests = notAttemptedTests.length;
    const requiredPace = totalDays && totalDays > 0 ? Math.round((remainingTests / totalDays) * 10) / 10 : 0;
    const paceStatus = currentPace >= requiredPace ? 'on_track' : currentPace >= requiredPace * 0.7 ? 'slightly_behind' : 'behind';
    const paceMessage = { on_track: { en: 'On track! Keep it up!', hi: 'सही रफ्तार! जारी रखो!' }, slightly_behind: { en: `Need ${requiredPace}/day, doing ${currentPace}`, hi: `${requiredPace}/दिन चाहिए, ${currentPace} कर रहे` }, behind: { en: `Behind! Need ${requiredPace}/day, only ${currentPace}`, hi: `पीछे! ${requiredPace}/दिन चाहिए` } };

    // Readiness score
    const covScore = syllabusCoverage.overallPct || 0;
    const avgScoreScore = overallAvgScore;
    const consistScore = jrfProbability.consistencyScore || 50;
    const speedScore = speedAnalytics.avgTimePerQ > 0 ? Math.min(100, Math.round((60 / speedAnalytics.avgTimePerQ) * 100)) : 50;
    const revScore = smartRevision.stats.totalTests > 0 ? Math.round(((smartRevision.stats.totalTests - smartRevision.stats.critical - smartRevision.stats.weak) / smartRevision.stats.totalTests) * 100) : 0;
    const readinessFactors = [
      { name: 'Syllabus Coverage', nameHi: 'सिलेबस', score: covScore, weight: 0.30 },
      { name: 'Avg Score', nameHi: 'औसत स्कोर', score: avgScoreScore, weight: 0.25 },
      { name: 'Consistency', nameHi: 'स्थिरता', score: consistScore, weight: 0.15 },
      { name: 'Speed', nameHi: 'गति', score: speedScore, weight: 0.10 },
      { name: 'Revision', nameHi: 'पुनरावृत्ति', score: revScore, weight: 0.10 },
      { name: 'Streak', nameHi: 'स्ट्रीक', score: Math.min(100, streak * 14), weight: 0.10 },
    ];
    const readinessOverall = Math.round(readinessFactors.reduce((s, f) => s + f.score * f.weight, 0));

    // Today's mission
    const todayMission = [];
    const { dailyTests } = customTargets;
    const td = todayDetailed;
    if (td.count < dailyTests) todayMission.push({ id: 'tests', task: `Take ${dailyTests - td.count} more tests`, taskHi: `${dailyTests - td.count} और टेस्ट दें`, reason: 'Daily target', priority: 'critical', icon: 'ClipboardList' });
    if (smartRevision.todayDue.length > 0) todayMission.push({ id: 'revision', task: `Revise ${smartRevision.todayDue.length} tests (SRS due)`, taskHi: `${smartRevision.todayDue.length} टेस्ट दोहराएं`, reason: 'Spaced repetition', priority: 'high', icon: 'RefreshCw' });
    const weakUnit = errorPatterns.weakUnits[0];
    if (weakUnit) todayMission.push({ id: 'weak', task: `Practice ${weakUnit.unit} (${weakUnit.accuracy}%)`, taskHi: `${weakUnit.unit} अभ्यास करें`, reason: 'Weakest area', priority: 'high', icon: 'AlertTriangle' });
    if (td.accuracy > 0 && td.accuracy < customTargets.dailyAccuracy) todayMission.push({ id: 'accuracy', task: `Improve accuracy to ${customTargets.dailyAccuracy}%+`, taskHi: `सटीकता ${customTargets.dailyAccuracy}%+ करें`, reason: `Current: ${td.accuracy}%`, priority: 'medium', icon: 'Target' });

    // Risk alerts
    const riskAlerts = [];
    const uncoveredP1 = syllabusCoverage.paper1.filter(c => c.level === 'not_started').length;
    const uncoveredP2 = syllabusCoverage.paper2.filter(c => c.level === 'not_started').length;
    if (uncoveredP1 + uncoveredP2 > 0 && totalDays && totalDays < 30) riskAlerts.push({ level: 'critical', text: `${uncoveredP1 + uncoveredP2} chapters not started!`, textHi: `${uncoveredP1 + uncoveredP2} अध्याय शुरू नहीं!`, icon: 'AlertTriangle' });
    if (speedAnalytics.avgTimePerQ > 90) riskAlerts.push({ level: 'warning', text: `Speed: ${speedAnalytics.avgTimePerQ}s/Q (target: <60s)`, textHi: `गति: ${speedAnalytics.avgTimePerQ}s/प्रश्न`, icon: 'Zap' });
    if (paceStatus === 'behind') riskAlerts.push({ level: 'warning', text: `Behind pace: ${currentPace} vs ${requiredPace}/day`, textHi: `पीछे: ${currentPace} vs ${requiredPace}/दिन`, icon: 'Clock' });
    if (smartRevision.stats.overdue > 5) riskAlerts.push({ level: 'warning', text: `${smartRevision.stats.overdue} revisions overdue`, textHi: `${smartRevision.stats.overdue} पुनरावृत्ति बाकी`, icon: 'RefreshCw' });
    if (streak === 0 && allCompletedAttempts.length > 5) riskAlerts.push({ level: 'info', text: 'No streak! Start daily practice', textHi: 'स्ट्रीक नहीं! रोज अभ्यास करो', icon: 'Flame' });

    return {
      countdown: { days: totalDays, hours, minutes, totalDays: totalJourneyDays, examDate, isSet, startDate: startDate.toISOString().split('T')[0] },
      phase: { current: phasesWithStatus[currentPhaseIdx] || phasesWithStatus[0], all: phasesWithStatus, overallProgress: journeyProgress },
      milestones, todayMission,
      pace: { current: currentPace, required: requiredPace, status: paceStatus, remaining: remainingTests, message: paceMessage[paceStatus] || paceMessage.on_track },
      readiness: { overall: readinessOverall, p1: Math.round(covScore * 0.5 + paper1AvgScore * 0.5), p2: Math.round(covScore * 0.5 + paper2AvgScore * 0.5), factors: readinessFactors },
      riskAlerts,
    };
  }, [examDate, allCompletedAttempts, notAttemptedTests, syllabusCoverage, overallAvgScore, paper1AvgScore, paper2AvgScore, jrfProbability, speedAnalytics, smartRevision, errorPatterns, streak, customTargets, todayDetailed, createdTests, daysUntilExam]);

  // ════════════════════════════════════════════════════════════════════
  //  §18  🆕 DAILY REPORT CARD
  // ════════════════════════════════════════════════════════════════════
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

    const gradeMap = { 5: { g: 'A+', c: 'emerald' }, 4: { g: 'A', c: 'emerald' }, 3: { g: 'B+', c: 'blue' }, 2: { g: 'B', c: 'blue' }, 1: { g: 'C', c: 'amber' }, 0: { g: 'F', c: 'red' } };
    const { g: grade, c: gradeColor } = gradeMap[rating] || gradeMap[0];

    // Comparison with yesterday
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
      ? { unit: revDue.unit || revDue.title, reason: `SRS revision due`, reasonHi: `SRS दोहराना बाकी` }
      : { unit: 'Mixed Practice', reason: 'Keep practicing!', reasonHi: 'अभ्यास जारी रखें!' };

    // Highlights
    const highlights = [];
    if (td.perfectScores > 0) highlights.push({ type: 'achievement', text: `${td.perfectScores} perfect score(s)!`, textHi: `${td.perfectScores} परफेक्ट स्कोर!` });
    if (td.pendingCleared > 0) highlights.push({ type: 'progress', text: `${td.pendingCleared} pending test(s) cleared`, textHi: `${td.pendingCleared} बाकी टेस्ट पूरे` });
    if (td.weakRetried > 0) highlights.push({ type: 'improvement', text: `${td.weakRetried} weak test(s) retried`, textHi: `${td.weakRetried} कमजोर दोबारा दिए` });
    if (td.count > (ya.count || 0) && ya.count > 0) highlights.push({ type: 'progress', text: `${comparison.testsChange} more tests than yesterday!`, textHi: `कल से ${comparison.testsChange} ज्यादा!` });
    if (td.accuracy >= 80 && td.count > 0) highlights.push({ type: 'achievement', text: `${td.accuracy}% accuracy!`, textHi: `${td.accuracy}% सटीकता!` });

    return {
      date: todayKey, grade, gradeColor, rating,
      stats: { tests: td.count, time: td.timeSpent, accuracy: td.accuracy, avgScore: td.avgScore, bestScore: td.bestScore, correct: td.correct, wrong: td.wrong, skipped: td.skipped, questionsTotal: td.totalQuestionsSolved },
      comparison, tomorrowFocus, highlights,
    };
  }, [todayDetailed, yesterdayActivity, customTargets, errorPatterns, smartRevision, todayKey]);

  // ════════════════════════════════════════════════════════════════════
  //  §19  🆕 MISTAKE JOURNAL
  // ════════════════════════════════════════════════════════════════════
  const mistakeJournal = useMemo(() => {
    const unitMistakes = {};
    const weeklyErrors = {};
    let totalCorrect = 0, totalWrong = 0, totalSkipped = 0;

    allCompletedAttempts.forEach(a => {
      const weekKey = (() => { const d = new Date(a.completedAt || a.createdAt); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d.toISOString().split('T')[0]; })();
      if (!weeklyErrors[weekKey]) weeklyErrors[weekKey] = { correct: 0, wrong: 0, total: 0 };

      (a.topicAnalysis || []).forEach(ta => {
        const unit = ta.unit || 'Other';
        if (!unitMistakes[unit]) unitMistakes[unit] = { unit, wrong: 0, correct: 0, total: 0, skipped: 0, dates: [] };
        unitMistakes[unit].wrong += ta.wrong || 0;
        unitMistakes[unit].correct += ta.correct || 0;
        unitMistakes[unit].total += ta.total || 0;
        unitMistakes[unit].skipped += ta.skipped || 0;
        if ((ta.wrong || 0) > 0) unitMistakes[unit].dates.push(a.completedAt || a.createdAt);

        totalCorrect += ta.correct || 0;
        totalWrong += ta.wrong || 0;
        totalSkipped += ta.skipped || 0;

        weeklyErrors[weekKey].correct += ta.correct || 0;
        weeklyErrors[weekKey].wrong += ta.wrong || 0;
        weeklyErrors[weekKey].total += ta.total || 0;
      });
    });

    // Most repeated mistakes (units with most wrongs)
    const byUnit = Object.values(unitMistakes)
      .map(u => ({
        ...u,
        errorRate: u.total > 0 ? Math.round((u.wrong / u.total) * 100) : 0,
        timesWrong: u.dates.length,
        lastWrong: u.dates.length > 0 ? u.dates.sort((a, b) => new Date(b) - new Date(a))[0] : null,
        isRepeated: u.dates.length >= 3 && u.errorRate > 40,
      }))
      .sort((a, b) => b.wrong - a.wrong);

    const mostRepeated = byUnit.filter(u => u.isRepeated || u.timesWrong >= 3).slice(0, 10);

    // Weekly error trend
    const trend = Object.entries(weeklyErrors)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-8)
      .map(([wk, d]) => ({
        week: wk,
        weekLabel: new Date(wk).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        errorRate: d.total > 0 ? Math.round((d.wrong / d.total) * 100) : 0,
        correct: d.correct, wrong: d.wrong, total: d.total,
      }));

    // Recent errors (last 5 attempts with errors)
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
        errorRate: (() => { const t = (a.correctCount || 0) + (a.wrongCount || 0); return t > 0 ? Math.round((a.wrongCount / t) * 100) : 0; })(),
        units: (a.topicAnalysis || []).filter(ta => (ta.wrong || 0) > 0).map(ta => ta.unit).filter(Boolean),
      }));

    const overallErrorRate = (totalCorrect + totalWrong) > 0 ? Math.round((totalWrong / (totalCorrect + totalWrong)) * 100) : 0;

    // Suggestions
    const suggestions = [];
    if (mostRepeated.length > 0) suggestions.push({ text: `Focus on ${mostRepeated[0].unit} - ${mostRepeated[0].wrong} mistakes`, textHi: `${mostRepeated[0].unit} पर ध्यान - ${mostRepeated[0].wrong} गलतियां`, priority: 'critical' });
    if (trend.length >= 2) {
      const last = trend[trend.length - 1].errorRate;
      const prev = trend[trend.length - 2].errorRate;
      if (last > prev + 5) suggestions.push({ text: `Error rate increasing (+${last - prev}%)`, textHi: `गलती दर बढ़ रही (+${last - prev}%)`, priority: 'high' });
      else if (last < prev - 5) suggestions.push({ text: `Error rate improving (-${prev - last}%)`, textHi: `गलती दर सुधर रही (-${prev - last}%)`, priority: 'low' });
    }
    if (totalSkipped > totalWrong * 0.5) suggestions.push({ text: `Too many skips (${totalSkipped}). Attempt more.`, textHi: `बहुत स्किप (${totalSkipped})। ज्यादा attempt करो।`, priority: 'medium' });

    return {
      totalMistakes: totalWrong, totalCorrect, totalSkipped, overallErrorRate,
      byUnit, mostRepeated, recentErrors, trend, suggestions,
    };
  }, [allCompletedAttempts]);

  // ════════════════════════════════════════════════════════════════════
  //  RETURN
  // ════════════════════════════════════════════════════════════════════
  return {
    // Core
    questionStats, testStats, attemptStats, recentAttempts, allAttempts,
    allCompletedAttempts, createdTests, loading, refreshing, lastRefresh, refresh,
    // Basic stats
    paper1Units, paper2Units, paper1Count, paper2Count, totalQuestions,
    overallAccuracy, overallAvgScore,
    paper1Attempts, paper2Attempts, paper1Tests, paper2Tests, combinedTests,
    paper1Accuracy, paper2Accuracy, paper1AvgScore, paper2AvgScore,
    // Trends
    scoreTrend, paper1Trend, paper2Trend, trendDirection, paper1TrendDir, paper2TrendDir,
    predictedScore, paper1Predicted, paper2Predicted,
    // Tests
    notAttemptedTests, paper1NotAttempted, paper2NotAttempted,
    needsAttentionTests, testPerfMap,
    // Charts
    difficultyData, questionTypeData, topicPerformance,
    scoreDistribution, personalRecords, timeOfDayAnalysis,
    // Activity
    activityMap, streak, longestStreak, weeklyComparison, achievements,
    // Analytics (ADDED testScoreRanking HERE)
    jrfProbability, syllabusCoverage, unitScoreRanking, testScoreRanking, speedAnalytics, errorPatterns, studyRecommendations,
    // Goals
    examDate, setExamDate, daysUntilExam,
    customTargets, updateCustomTargets,
    autoGeneratedGoals, goalCompletionPct,
    todayActivity: todayDetailed, todayDetailed, yesterdayActivity,
    dayProgress, goalStreak, goalsCompleted, totalGoals, pressureMessage, todayXP,
    // 🆕 NEW FEATURES
    smartRevision,
    weeklyChapterMatrix,
    examCommandCenter,
    dailyReport,
    mistakeJournal,
  };
};

export default useDashboard;