// client/src/components/test/AdaptiveTestCreator.jsx
// ═══════════════════════════════════════════════════════════════════
// AI ADAPTIVE TEST CREATOR — Premium UI for generating personalized tests
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import {
  Zap, Target, Trophy, Brain, Sparkles, AlertTriangle, CheckCircle,
  ArrowRight, X, BarChart3, TrendingUp, Layers, Clock, Play, Info,
  ChevronDown, ChevronUp
} from 'lucide-react';
import {
  generateAdaptiveTestConfig,
  ADAPTIVE_MODES,
  ADAPTIVE_MODE_CONFIG,
  analyzeTopicWeaknesses,
} from '../../utils/adaptiveTestEngine';

const ICON_MAP = { Zap, Target, Trophy };

const AdaptiveTestCreator = ({
  isOpen,
  onClose,
  allAttempts = [],
  questionStats = null,
  availableQuestions = [],
  language = 'hi',
  onCreateTest,
  loading = false,
}) => {
  const [selectedMode, setSelectedMode] = useState(ADAPTIVE_MODES.BALANCED_ADAPTIVE);
  const [customCount, setCustomCount] = useState(null); // null means default mode count
  const [showReport, setShowReport] = useState(false);
  const L = (en, hi) => language === 'hi' ? hi : en;

  // Analyze weaknesses for display
  const topicAnalysis = useMemo(() => {
    const completed = allAttempts.filter(a => a.status === 'completed');
    return analyzeTopicWeaknesses(completed);
  }, [allAttempts]);

  // Generate adaptive config
  const adaptiveResult = useMemo(() => {
    return generateAdaptiveTestConfig({
      allAttempts,
      questionStats,
      availableQuestions,
      mode: selectedMode,
      customQuestionCount: customCount,
    });
  }, [allAttempts, questionStats, availableQuestions, selectedMode, customCount]);

  const handleCreate = () => {
    if (!adaptiveResult.hasEnoughQuestions) return;
    onCreateTest?.(adaptiveResult);
  };

  if (!isOpen) return null;

  const weakTopics = topicAnalysis.filter(t => t.strength === 'weak');
  const moderateTopics = topicAnalysis.filter(t => t.strength === 'moderate');
  const strongTopics = topicAnalysis.filter(t => t.strength === 'strong');

  const COUNT_PRESETS = [5, 10, 15, 20, 25, 30, 50];
  const activeCount = customCount || ADAPTIVE_MODE_CONFIG[selectedMode]?.questionCount.max || 25;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-t-3xl p-6 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black">{L('AI Adaptive Test Generator', 'AI एडाप्टिव टेस्ट जनरेटर')}</h2>
                <p className="text-xs text-purple-200">{L('Personalized tests based on your weak areas', 'आपके कमजोर क्षेत्रों पर आधारित व्यक्तिगत परीक्षा')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="relative flex gap-3 mt-4">
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black">{weakTopics.length}</p>
              <p className="text-[9px] text-purple-200">{L('Weak', 'कमजोर')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black">{moderateTopics.length}</p>
              <p className="text-[9px] text-purple-200">{L('Moderate', 'मध्यम')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black">{strongTopics.length}</p>
              <p className="text-[9px] text-purple-200">{L('Strong', 'मजबूत')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black">{availableQuestions.length}</p>
              <p className="text-[9px] text-purple-200">{L('Questions', 'प्रश्न')}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Mode Selection Cards */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              {L('Select Adaptive Mode', 'एडाप्टिव मोड चुनें')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(ADAPTIVE_MODE_CONFIG).map(([key, config]) => {
                const Icon = ICON_MAP[config.icon] || Target;
                const isSelected = selectedMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedMode(key); setCustomCount(null); }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                    )}
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mb-3 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{L(config.name, config.nameHi)}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{L(config.desc, config.descHi)}</p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-gray-400">
                      <span>{isSelected ? `${activeCount}Q` : `${config.questionCount.max}Q`}</span>
                      <span>•</span>
                      <span>{Math.round((isSelected ? activeCount : config.questionCount.max) * config.durationPerQ)} min</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Selector (Quick Pills + Dropdown) */}
          <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                {L('Select Number of Questions', 'प्रश्नों की संख्या चुनें')}
              </h3>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-full">
                {activeCount} {L('Questions', 'प्रश्न')} ({Math.round(activeCount * (ADAPTIVE_MODE_CONFIG[selectedMode]?.durationPerQ || 1.2))} {L('min', 'मिनट')})
              </span>
            </div>

            {/* Quick Select Pills + Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              {COUNT_PRESETS.map(count => (
                <button
                  key={count}
                  onClick={() => setCustomCount(count)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    activeCount === count
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/20 scale-105'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-purple-300'
                  }`}
                >
                  {count} Q
                </button>
              ))}

              {/* Custom Count Dropdown */}
              <div className="relative">
                <select
                  value={COUNT_PRESETS.includes(activeCount) ? activeCount : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== 'custom') setCustomCount(Number(val));
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 outline-none cursor-pointer hover:border-purple-300"
                >
                  <option value="" disabled>{L('Select...', 'चुनें...')}</option>
                  {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(n => (
                    <option key={n} value={n}>{n} {L('Questions', 'प्रश्न')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Weak-Spot Heatmap */}
          {topicAnalysis.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-500" />
                {L('Topic Weakness Heatmap', 'टॉपिक कमजोरी हीटमैप')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {topicAnalysis.slice(0, 12).map((topic, i) => {
                  const bgColor = topic.accuracy >= 70
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                    : topic.accuracy >= 45
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
                    : 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700';
                  const textColor = topic.accuracy >= 70
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : topic.accuracy >= 45
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-rose-700 dark:text-rose-400';
                  return (
                    <div key={i} className={`p-2.5 rounded-xl border ${bgColor}`}>
                      <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{topic.unit}</p>
                      <p className={`text-lg font-black ${textColor}`}>{topic.accuracy}%</p>
                      <p className="text-[9px] text-gray-500">{topic.correct}/{topic.total} correct</p>
                      {topic.isDueForReview && (
                        <span className="text-[8px] font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                          {L('Due for Review', 'रिव्यू करें')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adaptive Report Preview */}
          {adaptiveResult && (
            <div>
              <button
                onClick={() => setShowReport(!showReport)}
                className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <Info className="w-3.5 h-3.5" />
                {showReport ? L('Hide Details', 'विवरण छुपाएं') : L('View Test Composition Details', 'परीक्षा संरचना विवरण देखें')}
                {showReport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showReport && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="font-bold text-gray-500 uppercase text-[10px]">{L('Questions', 'प्रश्न')}</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{adaptiveResult.adaptiveReport.selectedCount}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-500 uppercase text-[10px]">{L('Duration', 'समय')}</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{adaptiveResult.adaptiveReport.duration} min</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-500 uppercase text-[10px]">{L('Difficulty', 'कठिनाई')}</p>
                      <p className="text-xl font-black text-purple-600">{adaptiveResult.adaptiveReport.diffRecommendation.label}</p>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="space-y-1.5">
                    {adaptiveResult.adaptiveReport.insights.map((ins, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${
                        ins.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      }`}>
                        {ins.type === 'positive' ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                         ins.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                         <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                        <span>{L(ins.textEn, ins.textHi)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {L('Cancel', 'रद्द करें')}
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !adaptiveResult.hasEnoughQuestions}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {loading ? L('Generating...', 'जनरेट हो रहा है...') : L('Generate & Start Test', 'टेस्ट जनरेट करें और शुरू करें')}
            </button>
          </div>

          {!adaptiveResult.hasEnoughQuestions && (
            <p className="text-center text-xs text-rose-500 font-bold">
              {L('Not enough questions available. Add more questions to the bank.', 'पर्याप्त प्रश्न उपलब्ध नहीं हैं। बैंक में और प्रश्न जोड़ें।')}
            </p>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdaptiveTestCreator;
