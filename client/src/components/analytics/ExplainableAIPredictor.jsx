// client/src/components/analytics/ExplainableAIPredictor.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// EXPLAINABLE AI SCORE PREDICTOR MODULE v1.0
// Fully DB-driven, zero random values, complete explainability & cutoff gaps
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Sparkles, Trophy, Target, Award, CheckCircle, AlertTriangle,
  HelpCircle, RefreshCw, BarChart3, TrendingUp, Clock, BookOpen,
  ArrowUpRight, ArrowDownRight, Layers, CheckSquare, XCircle, SkipForward,
  Info, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert
} from 'lucide-react';
import {
  calculateExplainablePrediction,
  UGC_NET_HISTORY_CUTOFFS,
  AVERAGE_CUTOFFS
} from '../../utils/explainablePredictorEngine';
import Button from '../common/Button';

const ExplainableAIPredictor = ({
  allAttempts = [],
  createdTests = [],
  questionStats = null,
  language = 'hi',
  onRefresh = null,
  refreshing = false
}) => {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'test_types' | 'subjects' | 'question_types' | 'trends'
  const [showMathDrawer, setShowMathDrawer] = useState(false);

  const L = (en, hi) => (language === 'hi' ? hi : en);

  // Compute prediction strictly from DB data
  const prediction = useMemo(() => {
    return calculateExplainablePrediction({ allAttempts, createdTests, questionStats });
  }, [allAttempts, createdTests, questionStats]);

  const {
    hasEnoughData,
    totalAttemptsCount,
    confidenceLevel,
    confidenceLevelHi,
    confidenceScore,
    expectedP1Marks,
    expectedP2Marks,
    expectedTotalMarks,
    netProbability,
    jrfProbability,
    phdProbability,
    gaps,
    insights,
    testTypeStats,
    paperStats,
    outcomes,
    topicAccuracies,
    questionTypeAccuracies,
    strongTopics,
    weakTopics,
    trend10,
    last30Days,
    consistencyScore
  } = prediction;

  const confColor =
    confidenceLevel === 'High'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400'
      : confidenceLevel === 'Medium'
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400'
      : 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400';

  if (!hasEnoughData) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-3xl border border-gray-100 dark:border-secondary-700 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          {L('Explainable AI Score Predictor', 'व्याख्यात्मक AI स्कोर प्रेडिक्टर')}
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
          {L(
            'Complete at least 1 test to generate an Explainable Score Prediction based strictly on your database performance.',
            'अपनी डेटाबेस परफॉरमेंस के आधार पर व्याख्यात्मक स्कोर भविष्यवाणी उत्पन्न करने के लिए कम से कम 1 परीक्षा पूरी करें।'
          )}
        </p>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-300">
          <Info className="w-4 h-4" />
          {L('0 Tests Found in Database', 'डेटाबेस में 0 टेस्ट मिले')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════
          HERO BANNER & CONFIDENCE
      ════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {L('Explainable AI Score Predictor', 'व्याख्यात्मक AI स्कोर प्रेडिक्टर')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              {L(
                'Calculated strictly from database performance logs • Updates automatically after every test',
                'डेटाबेस परफॉरमेंस से सटीक रूप से गणना की गई • प्रत्येक परीक्षा के बाद स्वचालित रूप से अपडेट'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Confidence Badge */}
            <div className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 ${confColor}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>
                {L('Confidence:', 'आत्मविश्वास:')} {L(confidenceLevel, confidenceLevelHi)} ({confidenceScore}%)
              </span>
            </div>

            {/* Test Count */}
            <div className="px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span>{totalAttemptsCount} {L('Tests Analyzed', 'परीक्षणों का विश्लेषण')}</span>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white disabled:opacity-50"
                title={L('Refresh data', 'डेटा रिफ्रेश करें')}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            SCORE PREDICTION CARDS GRID
        ════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* 1. Expected Total Marks */}
          <div className="md:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                {L('Expected Score', 'अपेक्षित स्कोर')}
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-black text-white tabular-nums tracking-tight">
                  {expectedTotalMarks}
                </span>
                <span className="text-lg font-bold text-slate-300">/ 300</span>
              </div>
              <p className="text-[11px] text-indigo-200 mt-1 font-semibold">
                {Math.round((expectedTotalMarks / 300) * 100)}% {L('Overall Accuracy Rate', 'कुल सटीकता दर')}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[10px] text-slate-300">Paper 1</p>
                <p className="text-sm font-black text-sky-300">{expectedP1Marks} / 100</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2">
                <p className="text-[10px] text-slate-300">Paper 2</p>
                <p className="text-sm font-black text-purple-300">{expectedP2Marks} / 200</p>
              </div>
            </div>
          </div>

          {/* 2. NET Qualification Prob */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                {L('NET Probability', 'NET संभावना')}
              </span>
              <div className="relative inline-flex items-center justify-center my-3">
                <svg width={84} height={84} className="-rotate-90">
                  <circle cx={42} cy={42} r={34} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
                  <circle
                    cx={42} cy={42} r={34} fill="none"
                    stroke={netProbability >= 60 ? '#10b981' : netProbability >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth={7} strokeDasharray={213} strokeDashoffset={213 * (1 - netProbability / 100)}
                    strokeLinecap="round" className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xl font-black text-white">{netProbability}%</span>
              </div>
            </div>
            <div className="text-[11px] font-bold text-slate-200">
              {L('Recent NET Cutoff:', 'हाल का NET कटऑफ:')} 162
            </div>
          </div>

          {/* 3. JRF Qualification Prob */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                {L('JRF Probability', 'JRF संभावना')}
              </span>
              <div className="relative inline-flex items-center justify-center my-3">
                <svg width={84} height={84} className="-rotate-90">
                  <circle cx={42} cy={42} r={34} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
                  <circle
                    cx={42} cy={42} r={34} fill="none"
                    stroke={jrfProbability >= 60 ? '#10b981' : jrfProbability >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth={7} strokeDasharray={213} strokeDashoffset={213 * (1 - jrfProbability / 100)}
                    strokeLinecap="round" className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xl font-black text-white">{jrfProbability}%</span>
              </div>
            </div>
            <div className="text-[11px] font-bold text-slate-200">
              {L('Recent JRF Cutoff:', 'हाल का JRF कटऑफ:')} 180
            </div>
          </div>

          {/* 4. PhD Eligibility Prob */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                {L('PhD Eligibility', 'PhD पात्रता')}
              </span>
              <div className="relative inline-flex items-center justify-center my-3">
                <svg width={84} height={84} className="-rotate-90">
                  <circle cx={42} cy={42} r={34} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
                  <circle
                    cx={42} cy={42} r={34} fill="none"
                    stroke={phdProbability >= 60 ? '#a855f7' : phdProbability >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth={7} strokeDasharray={213} strokeDashoffset={213 * (1 - phdProbability / 100)}
                    strokeLinecap="round" className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xl font-black text-white">{phdProbability}%</span>
              </div>
            </div>
            <div className="text-[11px] font-bold text-slate-200">
              {L('Recent PhD Cutoff:', 'हाल का PhD कटऑफ:')} 146
            </div>
          </div>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          GAP ANALYSIS & CUTOFF COMPARISON BADGES
      ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Gap to NET */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
              {L('Gap to NET Cutoff', 'NET कटऑफ से अंतर')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {L('Average Cutoff: ', 'औसत कटऑफ: ')} <b>160 Marks</b>
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1 ${
            gaps.gapToNET >= 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
          }`}>
            {gaps.gapToNET >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {gaps.gapToNET >= 0 ? `+${gaps.gapToNET}` : gaps.gapToNET}
          </div>
        </div>

        {/* Gap to JRF */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
              {L('Gap to JRF Cutoff', 'JRF कटऑफ से अंतर')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {L('Average Cutoff: ', 'औसत कटऑफ: ')} <b>180 Marks</b>
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1 ${
            gaps.gapToJRF >= 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
          }`}>
            {gaps.gapToJRF >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {gaps.gapToJRF >= 0 ? `+${gaps.gapToJRF}` : gaps.gapToJRF}
          </div>
        </div>

        {/* Gap to PhD */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase tracking-wider">
              {L('Gap to PhD Cutoff', 'PhD कटऑफ से अंतर')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {L('Average Cutoff: ', 'औसत कटऑफ: ')} <b>145 Marks</b>
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1 ${
            gaps.gapToPhD >= 0
              ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
          }`}>
            {gaps.gapToPhD >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {gaps.gapToPhD >= 0 ? `+${gaps.gapToPhD}` : gaps.gapToPhD}
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════
          OFFICIAL CUTOFF COMPARISON TABLE
      ════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {L('UGC NET History Official Cutoff Comparison (Last 3 Years)', 'UGC NET इतिहास आधिकारिक कटऑफ तुलना (अंतिम 3 वर्ष)')}
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-semibold">Max 300 Marks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-secondary-700/50 text-gray-600 dark:text-secondary-300 font-extrabold uppercase border-b border-gray-200 dark:border-secondary-700">
                <th className="py-3 px-4">{L('Exam Session', 'परीक्षा सत्र')}</th>
                <th className="py-3 px-4">{L('JRF Cutoff', 'JRF कटऑफ')}</th>
                <th className="py-3 px-4">{L('NET Cutoff', 'NET कटऑफ')}</th>
                <th className="py-3 px-4">{L('PhD Cutoff', 'PhD कटऑफ')}</th>
                <th className="py-3 px-4 text-center">{L('Your Status vs Cutoff', 'कटऑफ के मुकाबले स्थिति')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-secondary-700/50 font-medium">

              {/* Current Predicted */}
              <tr className="bg-purple-50/70 dark:bg-purple-900/20 font-black text-purple-900 dark:text-purple-200">
                <td className="py-3 px-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  {L('Current Predicted Marks', 'वर्तमान अनुमानित अंक')}
                </td>
                <td className="py-3 px-4 text-amber-700 dark:text-amber-400 font-bold">{expectedTotalMarks} / 300</td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">{expectedTotalMarks} / 300</td>
                <td className="py-3 px-4 text-purple-700 dark:text-purple-400 font-bold">{expectedTotalMarks} / 300</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[11px] font-black">
                    {expectedTotalMarks >= 180 ? 'JRF Range' : expectedTotalMarks >= 160 ? 'NET Qualified Range' : 'Needs Practice'}
                  </span>
                </td>
              </tr>

              {/* Past Cutoffs */}
              {UGC_NET_HISTORY_CUTOFFS.map((c, i) => {
                const jrfGap = expectedTotalMarks - c.jrf;
                const netGap = expectedTotalMarks - c.net;
                return (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-secondary-700/30 text-gray-700 dark:text-secondary-200">
                    <td className="py-3 px-4 font-bold">{L(c.session, c.sessionHi)}</td>
                    <td className="py-3 px-4">{c.jrf} ({c.jrfPct}%)</td>
                    <td className="py-3 px-4">{c.net} ({c.netPct}%)</td>
                    <td className="py-3 px-4">{c.phd} ({c.phdPct}%)</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        jrfGap >= 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : netGap >= 0
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}>
                        {jrfGap >= 0 ? `Cleared JRF (+${jrfGap})` : netGap >= 0 ? `Cleared NET (+${netGap})` : `Below NET (${netGap})`}
                      </span>
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          AI EXPLAINABILITY INSIGHTS ("WHY THIS SCORE?")
      ════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              ?
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {L('AI Insights & Explainability', 'AI अंतर्दृष्टि और स्पष्टीकरण')}
              </h3>
              <p className="text-[10px] text-gray-400">
                {L('Why did the AI predict this score?', 'AI ने यह स्कोर क्यों प्रेडिक्ट किया?')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMathDrawer(!showMathDrawer)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            {showMathDrawer ? L('Hide Math Model', 'गणितीय मॉडल छिपाएं') : L('View Math Model', 'गणितीय मॉडल देखें')}
          </button>
        </div>

        {/* Explainable Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                ins.type === 'positive'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800/60 dark:text-emerald-200'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800/60 dark:text-amber-200'
              }`}
            >
              {ins.type === 'positive' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{L(ins.textEn, ins.textHi)}</span>
            </div>
          ))}
        </div>

        {/* Mathematical Model Drawer (Accordion) */}
        {showMathDrawer && (
          <div className="p-4 bg-slate-50 dark:bg-secondary-900/50 rounded-xl border border-slate-200 dark:border-secondary-700 text-xs text-gray-700 dark:text-secondary-300 space-y-2.5">
            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              {L('How the Explainable AI Calculation Engine Works:', 'व्याख्यात्मक AI गणना इंजन कैसे काम करता है:')}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-gray-600 dark:text-secondary-300">
              <li>
                <b>Paper 1 Marks ({expectedP1Marks}/100):</b> {paperStats.p1Acc}% accuracy across Paper 1 attempts, weighted via 5-period Exponential Moving Average (EMA).
              </li>
              <li>
                <b>Paper 2 Marks ({expectedP2Marks}/200):</b> {paperStats.p2Acc}% accuracy across Paper 2 attempts, weighted via EMA.
              </li>
              <li>
                <b>Sigmoid Probability Engine:</b> Probabilities use logistic curve P = 100 / (1 + exp(-k * (Marks - Cutoff))), calibrated with consistency factor (k = 0.08 - 0.12).
              </li>
              <li>
                <b>Model Confidence Level ({confidenceLevel}):</b> Derived from {totalAttemptsCount} DB attempts and {consistencyScore}% score variance stability.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          DATA SOURCES BREAKDOWN TABS
      ════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5 shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-secondary-700 pb-3 mb-5 overflow-x-auto">
          {[
            { id: 'insights', label: L('Data Sources & Outcomes', 'डेटा स्रोत और परिणाम') },
            { id: 'test_types', label: L('Test Type Breakdown', 'परीक्षण प्रकार विश्लेषण') },
            { id: 'subjects', label: L('Subject & Topic Accuracy', 'विषय और टॉपिक सटीकता') },
            { id: 'question_types', label: L('Question Types Mastery', 'प्रश्न प्रकारों में निपुणता') },
            { id: 'trends', label: L('10-Test Trend', '10-परीक्षा रुझान') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-gray-50 dark:bg-secondary-700/50 text-gray-600 dark:text-secondary-300 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Data Sources & Outcomes */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Outcomes Card */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-secondary-700/40 border border-gray-200 dark:border-secondary-600">
              <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase mb-3">
                {L('Question Outcomes', 'प्रश्न परिणाम')}
              </p>
              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Correct:</span>
                  <span>{outcomes.correct}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Incorrect:</span>
                  <span>{outcomes.incorrect}</span>
                </div>
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1.5"><SkipForward className="w-3.5 h-3.5" /> Skipped:</span>
                  <span>{outcomes.skipped}</span>
                </div>
              </div>
            </div>

            {/* Attempt Rate */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-secondary-700/40 border border-gray-200 dark:border-secondary-600">
              <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase mb-2">
                {L('Attempt Rate', 'प्रयास दर')}
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                {outcomes.attemptRate}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-secondary-600 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${outcomes.attemptRate}%` }} />
              </div>
            </div>

            {/* Speed Pace */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-secondary-700/40 border border-gray-200 dark:border-secondary-600">
              <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase mb-2">
                {L('Avg Speed / Question', 'औसत गति / प्रश्न')}
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums flex items-baseline gap-1">
                {outcomes.avgTimePerQuestion} <span className="text-xs font-normal text-gray-400">sec</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                Target: &le; 60s per question
              </p>
            </div>

            {/* Consistency */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-secondary-700/40 border border-gray-200 dark:border-secondary-600">
              <p className="text-[11px] font-extrabold text-gray-500 dark:text-secondary-400 uppercase mb-2">
                {L('Consistency Score', 'स्थिरता स्कोर')}
              </p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
                {consistencyScore}%
              </p>
              <p className="text-[10px] text-gray-400 mt-2">
                {L('Score variance stability across tests', 'परीक्षणों में स्कोर परिवर्तनशीलता')}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Test Type Breakdown */}
        {activeTab === 'test_types' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {testTypeStats.map((tt, i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-secondary-700/30 border border-gray-200 dark:border-secondary-600">
                <p className="text-xs font-black text-gray-900 dark:text-white mb-1">
                  {L(tt.label, tt.labelHi)}
                </p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{tt.count}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  {L('Attempted Tests', 'प्रयास किए गए टेस्ट')}
                </p>
                {tt.totalQ > 0 && (
                  <p className="text-xs font-bold text-emerald-600 mt-2">
                    {Math.round((tt.correct / tt.totalQ) * 100)}% {L('Accuracy', 'सटीकता')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Subject & Topic Accuracy */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topicAccuracies.map((t, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-gray-100 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-700/20">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {L(t.name, t.nameHi)}
                    </span>
                    <span className={`text-xs font-black ${
                      t.accuracy >= 65 ? 'text-emerald-600' : t.accuracy >= 50 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {t.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-secondary-600 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        t.accuracy >= 65 ? 'bg-emerald-500' : t.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t.correct} / {t.total} {L('Questions Correct', 'सही प्रश्न')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Question Types Mastery */}
        {activeTab === 'question_types' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {questionTypeAccuracies.map((qt, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-700/20">
                <p className="text-xs font-bold text-gray-800 dark:text-secondary-200">{L(qt.label, qt.labelHi)}</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{qt.accuracy}%</p>
                <p className="text-[10px] text-gray-400 mt-1">{qt.correct} / {qt.total} Qs</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: 10-Test Trend */}
        {activeTab === 'trends' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 dark:text-secondary-300">
                {L('Recent 10 Test Scores', 'हाल की 10 परीक्षाओं के अंक')}
              </span>
              <span className="text-xs font-bold text-purple-600">
                30-Day Avg: {last30Days.avgScore}% ({last30Days.improvement >= 0 ? `+${last30Days.improvement}%` : `${last30Days.improvement}%`})
              </span>
            </div>
            <div className="flex items-end gap-2 h-36 pt-6 px-2 border-b border-gray-200 dark:border-secondary-700">
              {trend10.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all"
                    style={{ height: `${Math.max(10, t.score)}%` }}
                  />
                  <span className="text-[9px] font-bold text-gray-500">T{t.index}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap z-10">
                    <p className="font-bold">{t.title}</p>
                    <p>{t.score}% ({t.marks}/{t.totalMarks})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExplainableAIPredictor;
