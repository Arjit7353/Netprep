// client/src/components/test/AdaptiveTestCreator.jsx
// ═══════════════════════════════════════════════════════════════════
// AI ADAPTIVE TEST CREATOR — Integrated with Existing Test System
// Generates & Launches Adaptive Tests Directly into NTA Interface
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Target, Trophy, Brain, Sparkles, AlertTriangle, CheckCircle,
  ArrowRight, X, BarChart3, TrendingUp, Layers, Clock, Play, Info,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import {
  generateAdaptiveTestConfig,
  ADAPTIVE_MODES,
  ADAPTIVE_MODE_CONFIG,
  analyzeTopicWeaknesses,
} from '../../utils/adaptiveTestEngine';
import questionService from '../../services/questionService';
import testService from '../../services/testService';

const ICON_MAP = { Zap, Target, Trophy };

const AdaptiveTestCreator = ({
  isOpen,
  onClose,
  allAttempts = [],
  questionStats = null,
  availableQuestions = [],
  language = 'hi',
  onCreateTest,
}) => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(ADAPTIVE_MODES.BALANCED_ADAPTIVE);
  const [customCount, setCustomCount] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [fetchedQuestions, setFetchedQuestions] = useState([]);
  const [fetchingQ, setFetchingQ] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const L = (en, hi) => language === 'hi' ? hi : en;

  // Auto-fetch questions from DB if prop is empty
  useEffect(() => {
    if (!isOpen) return;
    if (availableQuestions.length === 0 && fetchedQuestions.length === 0) {
      setFetchingQ(true);
      questionService.getQuestions({ limit: 500 })
        .then(res => {
          const list = res.data?.questions || res.data || res.questions || [];
          if (Array.isArray(list)) setFetchedQuestions(list);
        })
        .catch(err => console.warn('[AdaptiveTestCreator] Auto-fetch questions error:', err))
        .finally(() => setFetchingQ(false));
    }
  }, [isOpen, availableQuestions.length, fetchedQuestions.length]);

  const poolQuestions = useMemo(() => {
    return availableQuestions.length > 0 ? availableQuestions : fetchedQuestions;
  }, [availableQuestions, fetchedQuestions]);

  // Analyze weaknesses
  const topicAnalysis = useMemo(() => {
    const completed = allAttempts.filter(a => a.status === 'completed');
    return analyzeTopicWeaknesses(completed);
  }, [allAttempts]);

  // Generate adaptive config
  const adaptiveResult = useMemo(() => {
    return generateAdaptiveTestConfig({
      allAttempts,
      questionStats,
      availableQuestions: poolQuestions,
      mode: selectedMode,
      customQuestionCount: customCount,
    });
  }, [allAttempts, questionStats, poolQuestions, selectedMode, customCount]);

  const handleCreate = async () => {
    if (creatingTest) return;

    setCreatingTest(true);
    try {
      const qIds = adaptiveResult.selectedQuestionIds;
      if (!qIds || qIds.length === 0) {
        // Fallback: select top N from pool
        const count = customCount || ADAPTIVE_MODE_CONFIG[selectedMode]?.questionCount.max || 25;
        const fallbackIds = poolQuestions.slice(0, count).map(q => q._id || q.id).filter(Boolean);
        qIds.push(...fallbackIds);
      }

      const modeCfg = ADAPTIVE_MODE_CONFIG[selectedMode] || ADAPTIVE_MODE_CONFIG.balanced_adaptive;
      const testPayload = {
        title: language === 'hi' ? `AI एडाप्टिव: ${modeCfg.nameHi}` : `AI Adaptive: ${modeCfg.name}`,
        description: language === 'hi'
          ? `आपकी कमजोरी और स्पेस्ड रिपीटिशन पर आधारित अनुकूलित परीक्षा (${qIds.length} प्रश्न)`
          : `Personalized adaptive test based on weak topics (${qIds.length} Qs)`,
        testType: 'practice',
        paper: 'paper2',
        totalQuestions: qIds.length,
        questions: qIds,
        duration: Math.max(5, Math.round(qIds.length * (modeCfg.durationPerQ || 1.2))),
        marksPerQuestion: 2,
        negativeMarking: selectedMode === ADAPTIVE_MODES.FULL_ADAPTIVE_MOCK,
        negativeMarks: selectedMode === ADAPTIVE_MODES.FULL_ADAPTIVE_MOCK ? 0.5 : 0,
        status: 'active',
        tags: ['adaptive', selectedMode]
      };

      const res = await testService.createTest(testPayload);
      const createdTest = res.data || res;

      onClose?.();

      if (createdTest?._id) {
        // Redirect directly to NTA Exam Interface for immediate test execution
        navigate(`/tests/nta/${createdTest._id}`);
      } else {
        navigate('/tests');
      }
    } catch (err) {
      console.error('[AdaptiveTestCreator] Create test error:', err);
      // If error, fallback to custom create route
      onCreateTest?.(adaptiveResult);
    } finally {
      setCreatingTest(false);
    }
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
                <Brain className="w-6 h-6 text-white" />
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
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center flex-1">
              <p className="text-lg font-black">{weakTopics.length}</p>
              <p className="text-[9px] text-purple-200">{L('Weak', 'कमजोर')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center flex-1">
              <p className="text-lg font-black">{moderateTopics.length}</p>
              <p className="text-[9px] text-purple-200">{L('Moderate', 'मध्यम')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center flex-1">
              <p className="text-lg font-black">{strongTopics.length}</p>
              <p className="text-[9px] text-purple-200">{L('Strong', 'मजबूत')}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2 text-center flex-1">
              <p className="text-lg font-black">{poolQuestions.length}</p>
              <p className="text-[9px] text-purple-200">{L('Questions Pool', 'प्रश्न पूल')}</p>
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
                    onClick={() => {
                      setSelectedMode(key);
                      setCustomCount(null);
                    }}
                    className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20 shadow-md scale-[1.02]'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-800'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white mb-3`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                      {L(config.name, config.nameHi)}
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mb-2">
                      {L(config.desc, config.descHi)}
                    </p>
                    <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400">
                      {config.questionCount.min}Q • {Math.round(config.questionCount.min * config.durationPerQ)} min
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Count Selection */}
          <div className="p-4 bg-purple-50/40 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                {L('Select Number of Questions', 'प्रश्नों की संख्या चुनें')}
              </span>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-1 rounded-lg">
                {activeCount} {L('Questions', 'प्रश्न')} ({Math.round(activeCount * (ADAPTIVE_MODE_CONFIG[selectedMode]?.durationPerQ || 1.2))} {L('min', 'मिनट')})
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {COUNT_PRESETS.map((preset) => {
                const isActive = activeCount === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => setCustomCount(preset)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {preset} Q
                  </button>
                );
              })}

              <select
                value={COUNT_PRESETS.includes(activeCount) ? '' : activeCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > 0) setCustomCount(val);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-500"
              >
                <option value="">{L('More...', 'अधिक...')}</option>
                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 100].map(n => (
                  <option key={n} value={n}>{n} {L('Questions', 'प्रश्न')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Weakness Heatmap */}
          {topicAnalysis.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-500" />
                {L('Topic Weakness Heatmap', 'टॉपिक कमजोरी हीटमैप')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {topicAnalysis.slice(0, 4).map((ta, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-xs ${
                      ta.strength === 'weak'
                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                        : ta.strength === 'moderate'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <p className="font-bold truncate text-[10px]">{ta.key}</p>
                    <p className="text-base font-black mt-1">{ta.accuracy}%</p>
                    <p className="text-[9px] opacity-70">{ta.correct}/{ta.total} {L('correct', 'सही')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {L('Cancel', 'रद्द करें')}
            </button>
            <button
              onClick={handleCreate}
              disabled={creatingTest || fetchingQ}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creatingTest || fetchingQ ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {L('Generating Test...', 'टेस्ट जनरेट हो रहा है...')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {L('Generate & Start Test', 'टेस्ट जनरेट करें और शुरू करें')}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdaptiveTestCreator;
