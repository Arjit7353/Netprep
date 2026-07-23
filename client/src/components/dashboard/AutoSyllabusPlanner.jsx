import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, CheckCircle, Circle, BookOpen, Layers, Target, ChevronRight,
  CheckSquare, Square, RefreshCw, BarChart3, PieChart, Sparkles, Filter,
  Clock, Award, ArrowUpRight, ChevronDown, ChevronUp, AlertCircle, Zap, Sliders
} from 'lucide-react';
import { useSyllabus } from '../../hooks/useSyllabus';
import syllabusPaper1Static from '../../data/syllabusPaper1';
import syllabusPaper2HistoryStatic from '../../data/syllabusPaper2History';

const AutoSyllabusPlanner = ({ language = 'en' }) => {
  const { syllabus: fetchedSyllabus } = useSyllabus(true);
  const isHi = language === 'hi';

  const syllabusData = useMemo(() => {
    return {
      paper1: fetchedSyllabus?.paper1?.units?.length ? fetchedSyllabus.paper1 : syllabusPaper1Static,
      paper2: fetchedSyllabus?.paper2?.units?.length ? fetchedSyllabus.paper2 : syllabusPaper2HistoryStatic,
    };
  }, [fetchedSyllabus]);

  // Filters & Settings
  const [selectedPaper, setSelectedPaper] = useState('all'); // 'all', 'paper1', 'paper2'
  const [paceMode, setPaceMode] = useState(() => {
    return localStorage.getItem('netprep_target_pace_mode') || 'auto'; // 'auto', 'light', 'moderate', 'intense'
  });

  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // 0 (Mon) to 6 (Sun)
  });

  // Saved completed targets
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      const stored = localStorage.getItem('netprep_completed_targets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handlePaceChange = (mode) => {
    setPaceMode(mode);
    try {
      localStorage.setItem('netprep_target_pace_mode', mode);
    } catch {}
  };

  const toggleItemCompleted = useCallback((key) => {
    setCompletedMap(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('netprep_completed_targets', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to store completed target', e);
      }
      return updated;
    });
  }, []);

  const resetAllTargets = useCallback(() => {
    if (window.confirm(isHi ? 'क्या आप सभी टारगेट प्रोग्रेस रीसेट करना चाहते हैं?' : 'Are you sure you want to reset all target progress?')) {
      setCompletedMap({});
      try {
        localStorage.removeItem('netprep_completed_targets');
      } catch {}
    }
  }, [isHi]);

  // Generate flattened targets from syllabus
  const flattenedTargets = useMemo(() => {
    const list = [];

    const processPaper = (paperData, paperKey) => {
      if (!paperData || !paperData.units) return;
      const paperLabel = paperKey === 'paper1' ? 'Paper 1' : 'Paper 2';

      paperData.units.forEach((unit, unitIdx) => {
        const unitName = isHi && unit.nameHi ? unit.nameHi : unit.name;
        (unit.chapters || []).forEach((ch, chIdx) => {
          const chName = isHi && ch.nameHi ? ch.nameHi : ch.name;
          (ch.topics || []).forEach((topic, tIdx) => {
            const topicName = isHi && topic.nameHi ? topic.nameHi : topic.name;
            const subtopics = Array.isArray(topic.subtopics) ? topic.subtopics : [];

            if (subtopics.length > 0) {
              subtopics.forEach((st, stIdx) => {
                const stName = typeof st === 'string' ? st : (isHi && st.nameHi ? st.nameHi : st.name);
                const key = `${paperKey}_${unit.id || unitIdx}_${ch.id || chIdx}_${topic.id || tIdx}_st${stIdx}`;
                list.push({
                  key,
                  paper: paperKey,
                  paperLabel,
                  unitName,
                  chapterName: chName,
                  topicName,
                  subtopicName: stName,
                  fullPath: `${unitName} > ${chName} > ${topicName} > ${stName}`,
                });
              });
            } else {
              const key = `${paperKey}_${unit.id || unitIdx}_${ch.id || chIdx}_${topic.id || tIdx}`;
              list.push({
                key,
                paper: paperKey,
                paperLabel,
                unitName,
                chapterName: chName,
                topicName,
                subtopicName: null,
                fullPath: `${unitName} > ${chName} > ${topicName}`,
              });
            }
          });
        });
      });
    };

    if (selectedPaper === 'all' || selectedPaper === 'paper1') {
      processPaper(syllabusData.paper1, 'paper1');
    }
    if (selectedPaper === 'all' || selectedPaper === 'paper2') {
      processPaper(syllabusData.paper2, 'paper2');
    }

    return list;
  }, [syllabusData, selectedPaper, isHi]);

  // Calculate Adaptive Daily Limit based on Pace Mode & Exam Date
  const paceDetails = useMemo(() => {
    const totalCount = flattenedTargets.length;
    const pendingCount = flattenedTargets.filter(item => !completedMap[item.key]).length;

    let itemsPerDay = 4; // default moderate
    let examDaysLeft = 60; // fallback default

    try {
      const storedExamDate = localStorage.getItem('netprep_exam_date');
      if (storedExamDate) {
        const diffMs = new Date(storedExamDate).getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0) examDaysLeft = diffDays;
      }
    } catch {}

    if (paceMode === 'auto') {
      // Adaptive: total remaining targets / remaining exam days
      itemsPerDay = Math.max(2, Math.min(10, Math.ceil(pendingCount / Math.max(1, examDaysLeft))));
    } else if (paceMode === 'light') {
      itemsPerDay = 3;
    } else if (paceMode === 'moderate') {
      itemsPerDay = 5;
    } else if (paceMode === 'intense') {
      itemsPerDay = 8;
    }

    const estimatedDaysToFinish = Math.ceil(pendingCount / Math.max(1, itemsPerDay));
    const estCompletionDate = new Date(Date.now() + estimatedDaysToFinish * 86400000);
    const dateFormatted = estCompletionDate.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      itemsPerDay,
      examDaysLeft,
      estimatedDaysToFinish,
      dateFormatted,
      pendingCount
    };
  }, [flattenedTargets, completedMap, paceMode, isHi]);

  // Distribute targets into 7 days with realistic daily limits
  const weeklySchedule = useMemo(() => {
    const days = [
      { dayIndex: 0, nameEn: 'Monday', nameHi: 'सोमवार', shortEn: 'Mon', shortHi: 'सोम' },
      { dayIndex: 1, nameEn: 'Tuesday', nameHi: 'मंगलवार', shortEn: 'Tue', shortHi: 'मंगल' },
      { dayIndex: 2, nameEn: 'Wednesday', nameHi: 'बुधवार', shortEn: 'Wed', shortHi: 'बुध' },
      { dayIndex: 3, nameEn: 'Thursday', nameHi: 'गुरुवार', shortEn: 'Thu', shortHi: 'गुरु' },
      { dayIndex: 4, nameEn: 'Friday', nameHi: 'शुक्रवार', shortEn: 'Fri', shortHi: 'शुक्र' },
      { dayIndex: 5, nameEn: 'Saturday', nameHi: 'शनिवार', shortEn: 'Sat', shortHi: 'शनि' },
      { dayIndex: 6, nameEn: 'Sunday', nameHi: 'रविवार', shortEn: 'Sun', shortHi: 'रवि' },
    ];

    const totalItems = flattenedTargets.length;
    if (totalItems === 0) {
      return days.map(d => ({ ...d, items: [], chaptersGrouped: [] }));
    }

    const limit = paceDetails.itemsPerDay;

    return days.map((day, idx) => {
      const startIdx = idx * limit;
      const dayItems = flattenedTargets.slice(startIdx, startIdx + limit);

      // Group items by Chapter -> Topic
      const groupedMap = new Map();
      dayItems.forEach(item => {
        const groupKey = `${item.paperLabel}_${item.unitName}_${item.chapterName}`;
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            paperLabel: item.paperLabel,
            unitName: item.unitName,
            chapterName: item.chapterName,
            topics: new Map(),
          });
        }
        const chGroup = groupedMap.get(groupKey);
        if (!chGroup.topics.has(item.topicName)) {
          chGroup.topics.set(item.topicName, []);
        }
        chGroup.topics.get(item.topicName).push(item);
      });

      const chaptersGrouped = Array.from(groupedMap.values()).map(ch => ({
        ...ch,
        topics: Array.from(ch.topics.entries()).map(([topicName, items]) => ({
          topicName,
          items,
        })),
      }));

      return {
        ...day,
        items: dayItems,
        chaptersGrouped,
      };
    });
  }, [flattenedTargets, paceDetails.itemsPerDay]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalCount = flattenedTargets.length;
    const completedCount = flattenedTargets.filter(item => completedMap[item.key]).length;
    const pendingCount = totalCount - completedCount;
    const completedPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const remainingPct = 100 - completedPct;

    const currentDaySchedule = weeklySchedule[selectedDay] || { items: [] };
    const dayTotal = currentDaySchedule.items.length;
    const dayCompleted = currentDaySchedule.items.filter(item => completedMap[item.key]).length;
    const dayPending = dayTotal - dayCompleted;
    const dayCompletedPct = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
    const dayRemainingPct = 100 - dayCompletedPct;

    return {
      totalCount,
      completedCount,
      pendingCount,
      completedPct,
      remainingPct,
      dayTotal,
      dayCompleted,
      dayPending,
      dayCompletedPct,
      dayRemainingPct,
    };
  }, [flattenedTargets, completedMap, weeklySchedule, selectedDay]);

  const currentDayData = weeklySchedule[selectedDay] || { items: [], chaptersGrouped: [] };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isHi ? 'स्मार्ट सिलेबस टारगेट प्लानर' : 'Smart Syllabus Target Planner'}
            </h2>
            <p className="text-xs text-gray-500">
              {isHi ? 'परीक्षा तारीख और आपकी गति के अनुसार स्वचालित दैनिक लक्ष्य' : 'Adaptive daily pace auto-calculated for your exam schedule'}
            </p>
          </div>
        </div>

        {/* Paper Filter & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-gray-100 dark:bg-gray-700/60 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'all', labelEn: 'All Papers', labelHi: 'सभी पेपर' },
              { id: 'paper1', labelEn: 'Paper 1', labelHi: 'पेपर 1' },
              { id: 'paper2', labelEn: 'Paper 2', labelHi: 'पेपर 2' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPaper(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedPaper === p.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                {isHi ? p.labelHi : p.labelEn}
              </button>
            ))}
          </div>

          <button
            onClick={resetAllTargets}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title={isHi ? 'रीसेट प्रोग्रेस' : 'Reset Progress'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pace Mode Selector Bar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {isHi ? 'लक्ष्य गति (Study Pace):' : 'Study Pace Mode:'}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 ml-1.5">
              {paceDetails.itemsPerDay} {isHi ? 'लक्ष्य/दिन' : 'items/day'}
            </span>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'auto', labelEn: 'Adaptive (Auto)', labelHi: 'ऑटो (अनुकूली)' },
            { id: 'light', labelEn: 'Light (3/day)', labelHi: 'हल्का (3/दिन)' },
            { id: 'moderate', labelEn: 'Moderate (5/day)', labelHi: 'मध्यम (5/दिन)' },
            { id: 'intense', labelEn: 'Sprint (8/day)', labelHi: 'तेज (8/दिन)' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => handlePaceChange(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                paceMode === m.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white'
              }`}
            >
              {isHi ? m.labelHi : m.labelEn}
            </button>
          ))}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-gray-500 font-medium">
            {isHi ? 'अनुमानित पूर्णता तारीख:' : 'Est. Completion:'}
          </p>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {paceDetails.dateFormatted} ({paceDetails.estimatedDaysToFinish} {isHi ? 'दिन' : 'days'})
          </p>
        </div>
      </div>

      {/* Progress Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Overall Completion */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3.5 border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              {isHi ? 'कुल पूर्ण %' : 'Overall Completed'}
            </span>
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{stats.completedPct}%</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-300 mt-1">
            {stats.completedCount} / {stats.totalCount} {isHi ? 'लक्ष्य पूरे' : 'targets completed'}
          </p>
        </div>

        {/* Overall Remaining */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-3.5 border border-amber-100 dark:border-amber-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {isHi ? 'कुल बाकी %' : 'Overall Remaining'}
            </span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{stats.remainingPct}%</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-1">
            {stats.pendingCount} {isHi ? 'लक्ष्य शेष' : 'targets pending'}
          </p>
        </div>

        {/* Today's Completion */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {isHi ? 'आज पूर्ण %' : 'Today Completed'}
            </span>
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{stats.dayCompletedPct}%</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-1">
            {stats.dayCompleted} / {stats.dayTotal} {isHi ? 'आज का पूरा' : 'items today'}
          </p>
        </div>

        {/* Today's Remaining */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-3.5 border border-purple-100 dark:border-purple-800/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              {isHi ? 'आज बाकी %' : 'Today Remaining'}
            </span>
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-900 dark:text-purple-100">{stats.dayRemainingPct}%</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-300 mt-1">
            {stats.dayPending} {isHi ? 'आज के बाकी' : 'items remaining today'}
          </p>
        </div>
      </div>

      {/* Days Tabs (7-Day Weekly Schedule Bar) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {isHi ? 'साप्ताहिक शेड्यूल (दिन चुनें)' : 'Weekly Schedule (Select Day)'}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
            {isHi ? `दिन ${selectedDay + 1} का लक्ष्य (${currentDayData.items.length} लक्ष्य)` : `Day ${selectedDay + 1} Targets (${currentDayData.items.length} items)`}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {weeklySchedule.map((d, idx) => {
            const isToday = new Date().getDay() === (idx === 6 ? 0 : idx + 1);
            const isSelected = selectedDay === idx;
            const dayDone = d.items.length > 0 && d.items.every(item => completedMap[item.key]);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`p-2 md:p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 font-bold'
                    : isToday
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                }`}
              >
                <p className={`text-[10px] uppercase font-bold opacity-80 ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>{isHi ? d.shortHi : d.shortEn}</p>
                <p className={`text-xs md:text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{idx + 1}</p>
                {dayDone ? (
                  <CheckCircle className="w-3 h-3 mx-auto mt-1 text-emerald-400" />
                ) : (
                  <p className={`text-[9px] font-semibold mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{d.items.length}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Breakdown Section (Hierarchical: Unit > Chapter > Topic > Subtopic) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {isHi ? `दिन ${selectedDay + 1} का सिलेबस ब्रेकडाउन (${currentDayData.nameHi})` : `Day ${selectedDay + 1} Targets Breakdown (${currentDayData.nameEn})`}
          </h3>

          <span className="text-xs text-gray-500">
            {stats.dayCompleted} / {stats.dayTotal} {isHi ? 'पूर्ण' : 'completed'}
          </span>
        </div>

        {currentDayData.chaptersGrouped.length > 0 ? (
          <div className="space-y-3">
            {currentDayData.chaptersGrouped.map((chGroup, chIdx) => (
              <div
                key={chIdx}
                className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600/60 space-y-3"
              >
                {/* Unit & Chapter Header */}
                <div className="flex items-start justify-between gap-2 border-b border-gray-200 dark:border-gray-600 pb-2.5">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mr-2">
                      {chGroup.paperLabel}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {chGroup.unitName}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                      {chGroup.chapterName}
                    </h4>
                  </div>
                </div>

                {/* Topics & Subtopics List */}
                <div className="space-y-3 pl-1 md:pl-2">
                  {chGroup.topics.map((tGroup, tIdx) => (
                    <div key={tIdx} className="space-y-2">
                      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        {tGroup.topicName}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                        {tGroup.items.map(item => {
                          const isDone = !!completedMap[item.key];
                          return (
                            <div
                              key={item.key}
                              onClick={() => toggleItemCompleted(item.key)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                              }`}
                            >
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-semibold leading-snug ${
                                  isDone
                                    ? 'text-emerald-800 dark:text-emerald-300 line-through opacity-75'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {item.subtopicName || item.topicName}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {isHi ? 'इस दिन के लिए कोई लक्ष्य उपलब्ध नहीं है' : 'No targets scheduled for this day'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default AutoSyllabusPlanner;
