// client/src/components/result/AIDoubtPanel.jsx
// ═══════════════════════════════════════════════════════════════════
// ONE-CLICK AI DOUBT RESOLVER PANEL
// Expandable panel that appears below each question in Solution View
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Sparkles, CheckCircle, XCircle, BookOpen, Lightbulb,
  AlertTriangle, Link2, ChevronDown, ChevronUp, Zap, Brain
} from 'lucide-react';
import { generateDoubtResolution } from '../../utils/aiDoubtResolver';

const AIDoubtPanel = ({ question, selectedAnswer, correctAnswer, language = 'hi', isOpen, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState({ whyCorrect: true, whyWrong: false, concept: false, tip: false, mistake: false });
  const L = (en, hi) => language === 'hi' ? hi : en;

  const resolution = useMemo(() => {
    if (!isOpen || !question) return null;
    return generateDoubtResolution(question, selectedAnswer, correctAnswer, language);
  }, [isOpen, question, selectedAnswer, correctAnswer, language]);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle Button (shown always)
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all"
      >
        <Brain className="w-4 h-4" />
        {L('🤖 AI Explain This', '🤖 AI से समझें')}
      </button>
    );
  }

  if (!resolution) return null;

  return (
    <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {L('AI Doubt Resolver', 'AI संदेह निवारक')}
            </h4>
            <p className="text-[10px] text-gray-400">
              {L('Instant explanation generated from question data', 'प्रश्न डेटा से तत्काल स्पष्टीकरण')}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 font-bold"
        >
          {L('Close', 'बंद करें')} <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ✅ Why Correct */}
      <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
        <button
          onClick={() => toggleSection('whyCorrect')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle className="w-4 h-4" />
            {L('✅ Why This is Correct', '✅ यह सही क्यों है')}
          </span>
          {expandedSections.whyCorrect ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.whyCorrect && (
          <div className="px-4 py-3 bg-white dark:bg-secondary-800 text-xs text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-line">
            {resolution.whyCorrect}
          </div>
        )}
      </div>

      {/* ❌ Why Others are Wrong */}
      {resolution.whyOthersWrong?.length > 0 && (
        <div className="rounded-xl border-2 border-rose-200 dark:border-rose-800 overflow-hidden">
          <button
            onClick={() => toggleSection('whyWrong')}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300"
          >
            <span className="flex items-center gap-2 text-xs font-bold">
              <XCircle className="w-4 h-4" />
              {L('❌ Why Others are Wrong', '❌ अन्य गलत क्यों हैं')}
            </span>
            {expandedSections.whyWrong ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.whyWrong && (
            <div className="px-4 py-3 bg-white dark:bg-secondary-800 space-y-2">
              {resolution.whyOthersWrong.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-secondary-300">
                  <span className="font-black text-rose-500 shrink-0 w-5">{item.option}.</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-secondary-200 mb-0.5">{item.text}</p>
                    <p className="text-gray-500 dark:text-secondary-400">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 📝 Quick Revision Note */}
      <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
        <button
          onClick={() => toggleSection('concept')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <BookOpen className="w-4 h-4" />
            {L('📝 Quick Revision Note', '📝 त्वरित रिवीज़न नोट')}
          </span>
          {expandedSections.concept ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.concept && (
          <div className="px-4 py-3 bg-white dark:bg-secondary-800 text-xs text-gray-700 dark:text-secondary-300 leading-relaxed">
            {resolution.conceptSummary}
          </div>
        )}
      </div>

      {/* 💡 Exam Strategy Tip */}
      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 overflow-hidden">
        <button
          onClick={() => toggleSection('tip')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300"
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <Lightbulb className="w-4 h-4" />
            {L('💡 Exam Strategy Tip', '💡 परीक्षा रणनीति सुझाव')}
          </span>
          {expandedSections.tip ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.tip && (
          <div className="px-4 py-3 bg-white dark:bg-secondary-800 text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            {resolution.examTip}
          </div>
        )}
      </div>

      {/* ⚠️ Common Mistake */}
      <div className="rounded-xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
        <button
          onClick={() => toggleSection('mistake')}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300"
        >
          <span className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            {L('⚠️ Common Mistake', '⚠️ सामान्य गलती')}
          </span>
          {expandedSections.mistake ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {expandedSections.mistake && (
          <div className="px-4 py-3 bg-white dark:bg-secondary-800 text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
            {resolution.commonMistake}
          </div>
        )}
      </div>

      {/* 🔗 Related Topics */}
      {resolution.relatedTopics?.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link2 className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-500 uppercase">{L('Related:', 'संबंधित:')}</span>
          {resolution.relatedTopics.map((topic, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-secondary-700 text-[10px] font-bold text-gray-600 dark:text-secondary-300">
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIDoubtPanel;
