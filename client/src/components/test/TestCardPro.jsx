// client/src/components/test/TestCardPro.jsx
// ⭐ ADDED: Re-translate button with progress indicator

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Clock, FileQuestion, CheckCircle, Trophy, Activity,
  MoreHorizontal, Edit3, Copy, Share2, Archive, BookOpen,
  Trash2, Zap, Target, BookMarked, Layers, FileText,
  PenTool, GraduationCap, Award, Languages, RefreshCw,
  CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import PDFExportButton from '../common/PDFExportButton';
import { TEST_TYPE_CONFIG } from '../../utils/constants';
import testService from '../../services/testService';

const TYPE_THEMES = {
  dpp: {
    gradient: 'from-blue-500 to-cyan-500', lightBg: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30',
    border: 'border-blue-200/60 dark:border-blue-800/60', badge: 'bg-blue-600 text-white',
    badgeLight: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', strip: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    glowHover: 'hover:shadow-blue-500/20', ring: 'ring-blue-500/30', icon: Zap,
  },
  topic_test: {
    gradient: 'from-emerald-500 to-green-500', lightBg: 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30',
    border: 'border-emerald-200/60 dark:border-emerald-800/60', badge: 'bg-emerald-600 text-white',
    badgeLight: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', strip: 'bg-gradient-to-r from-emerald-500 to-green-500',
    glowHover: 'hover:shadow-emerald-500/20', ring: 'ring-emerald-500/30', icon: Target,
  },
  chapter_test: {
    gradient: 'from-purple-500 to-violet-500', lightBg: 'bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/30',
    border: 'border-purple-200/60 dark:border-purple-800/60', badge: 'bg-purple-600 text-white',
    badgeLight: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600', strip: 'bg-gradient-to-r from-purple-500 to-violet-500',
    glowHover: 'hover:shadow-purple-500/20', ring: 'ring-purple-500/30', icon: BookMarked,
  },
  unit_test: {
    gradient: 'from-orange-500 to-amber-500', lightBg: 'bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30',
    border: 'border-orange-200/60 dark:border-orange-800/60', badge: 'bg-orange-600 text-white',
    badgeLight: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600', strip: 'bg-gradient-to-r from-orange-500 to-amber-500',
    glowHover: 'hover:shadow-orange-500/20', ring: 'ring-orange-500/30', icon: Layers,
  },
  pyq_year: {
    gradient: 'from-red-500 to-rose-500', lightBg: 'bg-gradient-to-br from-red-50/80 to-rose-50/80 dark:from-red-950/30 dark:to-rose-950/30',
    border: 'border-red-200/60 dark:border-red-800/60', badge: 'bg-red-600 text-white',
    badgeLight: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600', strip: 'bg-gradient-to-r from-red-500 to-rose-500',
    glowHover: 'hover:shadow-red-500/20', ring: 'ring-red-500/30', icon: FileText,
  },
  practice: {
    gradient: 'from-teal-500 to-cyan-500', lightBg: 'bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-950/30 dark:to-cyan-950/30',
    border: 'border-teal-200/60 dark:border-teal-800/60', badge: 'bg-teal-600 text-white',
    badgeLight: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600', strip: 'bg-gradient-to-r from-teal-500 to-cyan-500',
    glowHover: 'hover:shadow-teal-500/20', ring: 'ring-teal-500/30', icon: PenTool,
  },
  full_mock_p1: {
    gradient: 'from-indigo-500 to-blue-600', lightBg: 'bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-indigo-950/30 dark:to-blue-950/30',
    border: 'border-indigo-200/60 dark:border-indigo-800/60', badge: 'bg-indigo-600 text-white',
    badgeLight: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-700', strip: 'bg-gradient-to-r from-indigo-500 to-blue-600',
    glowHover: 'hover:shadow-indigo-500/20', ring: 'ring-indigo-500/30', icon: GraduationCap,
  },
  full_mock_p2: {
    gradient: 'from-pink-500 to-rose-500', lightBg: 'bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-950/30 dark:to-rose-950/30',
    border: 'border-pink-200/60 dark:border-pink-800/60', badge: 'bg-pink-600 text-white',
    badgeLight: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600', strip: 'bg-gradient-to-r from-pink-500 to-rose-500',
    glowHover: 'hover:shadow-pink-500/20', ring: 'ring-pink-500/30', icon: Award,
  },
  full_mock_combined: {
    gradient: 'from-slate-600 to-gray-700', lightBg: 'bg-gradient-to-br from-gray-50/80 to-slate-100/80 dark:from-gray-950/30 dark:to-slate-950/30',
    border: 'border-gray-300/60 dark:border-gray-700/60', badge: 'bg-gray-700 text-white',
    badgeLight: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    iconBg: 'bg-gradient-to-br from-slate-600 to-gray-700', strip: 'bg-gradient-to-r from-slate-600 to-gray-700',
    glowHover: 'hover:shadow-gray-500/20', ring: 'ring-gray-500/30', icon: Trophy,
  },
};

const DEFAULT_THEME = TYPE_THEMES.dpp;

const formatRelative = (d) => {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  const h = Math.floor(ms / 3600000);
  const dy = Math.floor(ms / 86400000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (dy < 7) return `${dy}d`;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const parseUnits = (unitStr) => {
  if (!unitStr) return [];
  return unitStr.split(',').map(u => u.trim()).filter(u => u.length > 0);
};

const shortUnit = (unit) => {
  if (!unit) return '';
  return unit.replace(/^UNIT\s*/i, 'U-').replace(/^इकाई\s*/i, 'U-').trim();
};

// ═══════════════════════════════════════════════════════
//  ★ TRANSLATE STATUS STATES
// ═══════════════════════════════════════════════════════
const TRANSLATE_STATES = {
  idle: 'idle',
  translating: 'translating',
  success: 'success',
  error: 'error',
};

const TestCardPro = ({
  test, language = 'en', variant = 'grid',
  selectionMode = false, isSelected = false, onSelect,
  onDelete, questions = [], onFetchQuestions,
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  // ★ Translation state
  const [translateState, setTranslateState] = useState(TRANSLATE_STATES.idle);
  const [translateResult, setTranslateResult] = useState(null);

  const t = TYPE_THEMES[test.testType] || DEFAULT_THEME;
  const cfg = TEST_TYPE_CONFIG[test.testType] || {};
  const TypeIcon = t.icon;
  const best = test.totalMarks > 0 && test.highestScore > 0 ? Math.round((test.highestScore / test.totalMarks) * 100) : null;

  const unitList = parseUnits(test.unit);
  const hasMultipleUnits = unitList.length > 1;

  const onCardClick = (e) => {
    if (selectionMode && onSelect) { e.preventDefault(); e.stopPropagation(); onSelect(test._id); }
  };
  const closeMenu = () => setShowMenu(false);

  // ═══════════════════════════════════════════════════════
  //  ★ RE-TRANSLATE HANDLER
  // ═══════════════════════════════════════════════════════
  const handleReTranslate = async (e) => {
    e?.stopPropagation();
    closeMenu();

    if (translateState === TRANSLATE_STATES.translating) return;

    const confirmMsg = language === 'hi'
      ? `"${test.title}" की सभी ${test.totalQuestions} प्रश्नों का अनुवाद करें?`
      : `Re-translate all ${test.totalQuestions} questions in "${test.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    setTranslateState(TRANSLATE_STATES.translating);
    setTranslateResult(null);

    try {
      const result = await testService.reTranslateTest(test._id, { force: true });

      setTranslateResult(result.data || result);
      setTranslateState(TRANSLATE_STATES.success);

      // Auto-reset after 8 seconds
      setTimeout(() => {
        setTranslateState(TRANSLATE_STATES.idle);
        setTranslateResult(null);
      }, 8000);

    } catch (err) {
      console.error('[ReTranslate] Error:', err);
      setTranslateResult({ error: err.message || 'Translation failed' });
      setTranslateState(TRANSLATE_STATES.error);

      setTimeout(() => {
        setTranslateState(TRANSLATE_STATES.idle);
        setTranslateResult(null);
      }, 5000);
    }
  };

  // ★ Translate button component
  const TranslateButton = ({ size = 'normal' }) => {
    if (translateState === TRANSLATE_STATES.translating) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg animate-pulse">
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
            {language === 'hi' ? 'अनुवाद...' : 'Translating...'}
          </span>
        </div>
      );
    }

    if (translateState === TRANSLATE_STATES.success) {
      const r = translateResult;
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
            {r?.totalFields || 0} {language === 'hi' ? 'फ़ील्ड' : 'fields'} ✓
          </span>
        </div>
      );
    }

    if (translateState === TRANSLATE_STATES.error) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
            {language === 'hi' ? 'विफल' : 'Failed'}
          </span>
        </div>
      );
    }

    if (size === 'icon') {
      return (
        <button
          onClick={handleReTranslate}
          title={language === 'hi' ? 'पुनः अनुवाद करें' : 'Re-translate'}
          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <Languages className="w-4 h-4 text-blue-500 hover:text-blue-600" />
        </button>
      );
    }

    return null;
  };

  // ── GRID VARIANT ──
  if (variant === 'grid') {
    return (
      <div
        onClick={onCardClick}
        className={`relative overflow-visible rounded-2xl border-2 transition-all duration-300 group
          ${t.lightBg} ${t.border} hover:shadow-2xl ${t.glowHover} hover:-translate-y-1
          ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? `ring-4 ${t.ring} border-primary-500 dark:border-primary-400` : ''}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 ${t.strip} rounded-t-2xl`} />
        <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${t.gradient} opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500`} />

        {selectionMode && (
          <div className="absolute top-3 left-3 z-20">
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
              ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 group-hover:border-primary-400'}`}>
              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
            </div>
          </div>
        )}

        {/* ★ Translation status overlay */}
        {translateState === TRANSLATE_STATES.translating && (
          <div className="absolute inset-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl mb-3 animate-pulse">
              <Languages className="w-6 h-6 text-white animate-bounce" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {test.totalQuestions} {language === 'hi' ? 'प्रश्न' : 'questions'}
            </p>
            <div className="mt-3 w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-[progress_2s_ease-in-out_infinite]"
                style={{ width: '60%', animation: 'progress 2s ease-in-out infinite' }} />
            </div>
          </div>
        )}

        <div className="p-4 relative">
          <div className="flex gap-3">
            <div className={`w-11 h-11 ${t.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all`}>
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1 mb-1.5">
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md ${t.badge} shadow-sm`}>{cfg.shortCode}</span>
                {test.paper && <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${t.badgeLight}`}>{test.paper === 'paper1' ? 'P1' : 'P2'}</span>}

                {unitList.length === 1 && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${t.badgeLight} truncate max-w-[80px]`}>
                    {shortUnit(unitList[0])}
                  </span>
                )}
                {unitList.length > 1 && unitList.length <= 3 && (
                  unitList.map((u, i) => (
                    <span key={i} className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${t.badgeLight}`}>
                      {shortUnit(u)}
                    </span>
                  ))
                )}
                {unitList.length > 3 && (
                  <>
                    {unitList.slice(0, 2).map((u, i) => (
                      <span key={i} className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${t.badgeLight}`}>
                        {shortUnit(u)}
                      </span>
                    ))}
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${t.badgeLight}`}>
                      +{unitList.length - 2}
                    </span>
                  </>
                )}

                {best !== null && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-0.5
                    ${best >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : best >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : best >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                    <Trophy className="w-2.5 h-2.5" /> {best}%
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2">{test.title}</h4>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> {test.totalQuestions}Q</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration}m</span>
                {test.totalAttempts > 0 && <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {test.totalAttempts}x</span>}
                {hasMultipleUnits && (
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {unitList.length} units</span>
                )}
              </div>

              {(test.chapter || test.topic) && (
                <div className="mt-1.5 text-[10px] text-gray-400 truncate flex items-center gap-1">
                  <BookOpen className="w-3 h-3 flex-shrink-0" />{[test.chapter, test.topic].filter(Boolean).join(' > ')}
                </div>
              )}
            </div>
          </div>

          {/* ★ Translation result toast */}
          {translateState === TRANSLATE_STATES.success && translateResult && (
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="text-[10px]">
                  <span className="font-bold text-green-700 dark:text-green-400">
                    {language === 'hi' ? 'अनुवाद पूर्ण!' : 'Translation Complete!'}
                  </span>
                  <span className="text-green-600 dark:text-green-500 ml-1">
                    {translateResult.totalFields} {language === 'hi' ? 'फ़ील्ड' : 'fields'} |
                    {' '}{translateResult.regularTranslated + translateResult.pyqTranslated} Q |
                    {' '}{translateResult.translationEngine}
                  </span>
                </div>
              </div>
            </div>
          )}

          {translateState === TRANSLATE_STATES.error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                  {translateResult?.error || (language === 'hi' ? 'अनुवाद विफल' : 'Translation failed')}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/40 dark:border-gray-700/40">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelative(test.createdAt)}</span>
            <div className="flex items-center gap-1.5">
              {/* ★ Re-translate button */}
              <TranslateButton size="icon" />

              <PDFExportButton type="test" test={test} questions={questions} language={language} variant="icon" onExportStart={onFetchQuestions} />
              {!selectionMode && (
                <>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); closeMenu(); }} />
                        <div className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 py-1.5 z-50 animate-scale-in">
                          {/* ★ Re-translate menu item */}
                          <MenuBtn
                            icon={Languages}
                            label={language === 'hi' ? 'पुनः अनुवाद' : 'Re-translate'}
                            onClick={handleReTranslate}
                            highlight
                          />
                          <hr className="my-1 border-gray-100 dark:border-gray-700" />
                          <MenuBtn icon={Edit3} label={language === 'hi' ? 'संपादित करें' : 'Edit'} onClick={(e) => { e.stopPropagation(); navigate(`/tests/edit/${test._id}`); closeMenu(); }} />
                          <MenuBtn icon={Copy} label={language === 'hi' ? 'ID कॉपी' : 'Copy ID'} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(test._id); closeMenu(); }} />
                          <MenuBtn icon={Share2} label={language === 'hi' ? 'शेयर' : 'Share'} onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(`${window.location.origin}/test/${test._id}`); closeMenu(); }} />
                          <hr className="my-1 border-gray-100 dark:border-gray-700" />
                          <MenuBtn icon={Archive} label={language === 'hi' ? 'संग्रहीत करें' : 'Archive'} danger onClick={(e) => { onDelete?.(test._id, e); closeMenu(); }} />
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/test/${test._id}`); }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-xl transition-all hover:scale-105 active:scale-95 bg-gradient-to-r ${t.gradient}`}>
                    <Play className="w-3.5 h-3.5" /> {language === 'hi' ? 'शुरू' : 'Start'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {best !== null && (
          <div className="h-1 bg-gray-200/30 dark:bg-gray-700/30">
            <div className={`h-full ${t.strip} transition-all duration-500`} style={{ width: `${best}%` }} />
          </div>
        )}
      </div>
    );
  }

  // ── LIST VARIANT ──
  return (
    <div
      onClick={onCardClick}
      className={`relative overflow-visible rounded-xl border-2 transition-all duration-200 group bg-white dark:bg-gray-800 ${t.border} hover:shadow-lg
        ${selectionMode ? 'cursor-pointer' : ''} ${isSelected ? `ring-2 ${t.ring} border-primary-500` : ''}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.strip} rounded-l-xl`} />

      {/* ★ Translation overlay for list */}
      {translateState === TRANSLATE_STATES.translating && (
        <div className="absolute inset-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {language === 'hi' ? 'अनुवाद हो रहा है...' : 'Translating...'}
          </span>
        </div>
      )}

      <div className="p-3.5 pl-5 flex items-center gap-3">
        {selectionMode && (
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
            ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
            {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
          </div>
        )}
        <div className={`hidden sm:flex w-10 h-10 ${t.iconBg} rounded-xl items-center justify-center flex-shrink-0 shadow-md`}>
          <TypeIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded ${t.badge}`}>{cfg.shortCode}</span>
            {test.paper && <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${t.badgeLight}`}>{test.paper === 'paper1' ? 'P1' : 'P2'}</span>}
            {unitList.slice(0, 3).map((u, i) => (
              <span key={i} className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${t.badgeLight} hidden sm:inline`}>
                {shortUnit(u)}
              </span>
            ))}
            {unitList.length > 3 && (
              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${t.badgeLight} hidden sm:inline`}>+{unitList.length - 3}</span>
            )}

            {/* ★ Translation status in list view */}
            {translateState === TRANSLATE_STATES.success && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-700 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> {language === 'hi' ? 'अनुवादित' : 'Translated'}
              </span>
            )}
          </div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug truncate">{test.title}</h4>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
            {test.totalQuestions}Q - {test.duration}m - {formatRelative(test.createdAt)}
            {hasMultipleUnits && <span className="hidden sm:inline">- {unitList.length} units</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {best !== null && <span className={`text-sm font-black hidden sm:block ${best >= 60 ? 'text-green-600' : best >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>{best}%</span>}

          {/* ★ Re-translate button */}
          <TranslateButton size="icon" />

          <PDFExportButton type="test" test={test} questions={questions} language={language} variant="minimal" onExportStart={onFetchQuestions} />
          {!selectionMode && (
            <>
              <button onClick={(e) => onDelete?.(test._id, e)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
              </button>
              <button onClick={() => navigate(`/test/${test._id}`)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md bg-gradient-to-r ${t.gradient}`}>
                <Play className="w-3.5 h-3.5" /> {language === 'hi' ? 'शुरू' : 'Start'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, onClick, danger = false, highlight = false }) => (
  <button onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
      ${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' :
        highlight ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium' :
        'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

export default TestCardPro;