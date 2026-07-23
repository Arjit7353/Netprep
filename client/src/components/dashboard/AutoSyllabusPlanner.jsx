import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, CheckCircle, Circle, BookOpen, Layers, Target, ChevronRight,
  CheckSquare, Square, RefreshCw, BarChart3, PieChart, Sparkles, Filter,
  Clock, Award, ArrowUpRight, ChevronDown, ChevronUp, AlertCircle, Zap, Sliders,
  Plus, Trash2, Check, ChevronLeft, Sun, Coffee, Moon, Sunset, ListTodo,
  Video, Play, FileText, RotateCcw, Crosshair, Award as Trophy, Brain, X, Move, ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useSyllabus } from '../../hooks/useSyllabus';
import syllabusPaper1Static from '../../data/syllabusPaper1';
import syllabusPaper2HistoryStatic from '../../data/syllabusPaper2History';

const SmartAIStudyPlanner = ({ language = 'en' }) => {
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

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next, -1 = prev

  // Live Exam Date Sync State
  const [examDateSync, setExamDateSync] = useState(() => localStorage.getItem('netprep_exam_date') || '');

  useEffect(() => {
    const handleExamDateChange = () => {
      setExamDateSync(localStorage.getItem('netprep_exam_date') || '');
    };
    window.addEventListener('storage', handleExamDateChange);
    window.addEventListener('netprep-exam-date-changed', handleExamDateChange);
    return () => {
      window.removeEventListener('storage', handleExamDateChange);
      window.removeEventListener('netprep-exam-date-changed', handleExamDateChange);
    };
  }, []);

  // Saved completed targets
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      const stored = localStorage.getItem('netprep_completed_targets');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Timetable Tasks State
  const [timetableTasks, setTimetableTasks] = useState(() => {
    try {
      const stored = localStorage.getItem('netprep_smart_timetable_tasks');
      return stored ? JSON.parse(stored) : [
        {
          id: '1',
          topic: 'Teaching Aptitude: Concepts & Objectives',
          videoLecture: 'Lecture 1: Teaching Fundamentals (45m)',
          studyType: 'Lecture',
          priority: 'high',
          estMinutes: 75,
          slot: 'morning',
          done: true
        },
        {
          id: '2',
          topic: 'Research Methodology & Types',
          videoLecture: 'Lecture 2: Quantitative vs Qualitative (60m)',
          studyType: 'Practice',
          priority: 'medium',
          estMinutes: 60,
          slot: 'afternoon',
          done: false
        },
        {
          id: '3',
          topic: 'Paper 1 Previous Year Questions Drill',
          videoLecture: '',
          studyType: 'PYQ',
          priority: 'high',
          estMinutes: 45,
          slot: 'evening',
          done: false
        }
      ];
    } catch {
      return [];
    }
  });

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [modalSelectedTargetKeys, setModalSelectedTargetKeys] = useState([]);
  const [modalStudyType, setModalStudyType] = useState('Lecture');
  const [modalVideoLecture, setModalVideoLecture] = useState('');
  const [modalCustomVideoTitle, setModalCustomVideoTitle] = useState('');
  const [modalSlot, setModalSlot] = useState('morning');
  const [modalPriority, setModalPriority] = useState('medium');
  const [modalEstMinutes, setModalEstMinutes] = useState(60);

  const saveTimetableTasks = useCallback((newList) => {
    setTimetableTasks(newList);
    try {
      localStorage.setItem('netprep_smart_timetable_tasks', JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to store timetable tasks', e);
    }
  }, []);

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

  // Calculate Adaptive Daily Limit based on Pace Mode & Live Exam Date
  const paceDetails = useMemo(() => {
    const totalCount = flattenedTargets.length;
    const pendingCount = flattenedTargets.filter(item => !completedMap[item.key]).length;

    let itemsPerDay = 4; // default moderate
    let examDaysLeft = 60; // fallback default

    try {
      const storedExamDate = examDateSync || localStorage.getItem('netprep_exam_date');
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

    // 10. Exam Days Phase Strategy (Focus Recommendation)
    let defaultFocusType = 'Lecture';
    let phaseTitleEn = 'Foundation Phase (>120 days)';
    let phaseTitleHi = 'बुनियादी चरण (>120 दिन)';
    let focusStrategyEn = 'Learning + Lectures';
    let focusStrategyHi = 'अध्ययन और वीडियो लेक्चर';

    if (examDaysLeft <= 30) {
      defaultFocusType = 'Mock Test';
      phaseTitleEn = 'Final Countdown Phase (<30 days)';
      phaseTitleHi = 'अंतिम चरण (<30 दिन)';
      focusStrategyEn = 'Revision + PYQs + Mock Tests';
      focusStrategyHi = 'रिवीजन + PYQ + फुल मॉक टेस्ट';
    } else if (examDaysLeft <= 60) {
      defaultFocusType = 'Revision';
      phaseTitleEn = 'Sprint & Revision Phase (30-60 days)';
      phaseTitleHi = 'रिवीजन एवं गति चरण (30-60 दिन)';
      focusStrategyEn = 'Practice + Revision';
      focusStrategyHi = 'प्रैक्टिस एवं स्मार्ट रिवीजन';
    } else if (examDaysLeft <= 120) {
      defaultFocusType = 'Practice';
      phaseTitleEn = 'Core Practice Phase (60-120 days)';
      phaseTitleHi = 'अभ्यास चरण (60-120 दिन)';
      focusStrategyEn = 'Learning + Practice';
      focusStrategyHi = 'अध्ययन एवं प्रश्न अभ्यास';
    }

    return {
      itemsPerDay,
      examDaysLeft,
      estimatedDaysToFinish,
      dateFormatted,
      pendingCount,
      defaultFocusType,
      phaseTitleEn,
      phaseTitleHi,
      focusStrategyEn,
      focusStrategyHi
    };
  }, [flattenedTargets, completedMap, paceMode, examDateSync, isHi]);

  // Distribute targets into 7 Real Calendar Days
  const weeklySchedule = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    const distanceToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMon + (weekOffset * 7));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dayIndex = i;
      const dateNum = d.getDate();
      const monthStr = d.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { month: 'short' });
      const dayShort = d.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { weekday: 'short' });
      const dayFull = d.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { weekday: 'long' });
      const isToday = d.toDateString() === new Date().toDateString();
      const dateFormatted = `${dateNum} ${monthStr}`;

      days.push({
        dayIndex,
        dateObj: d,
        dateNum,
        monthStr,
        dayShort,
        dayFull,
        dateFormatted,
        isToday,
      });
    }

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
  }, [flattenedTargets, paceDetails.itemsPerDay, weekOffset, isHi]);

  const currentDayData = weeklySchedule[selectedDay] || { items: [], chaptersGrouped: [] };

  // Set default modal parameters based on current Day & Exam Phase
  const handleOpenImportModal = () => {
    const todayItems = currentDayData.items || [];
    if (todayItems.length > 0) {
      setModalSelectedTargetKeys([todayItems[0].key]);
    } else {
      setModalSelectedTargetKeys([]);
    }
    setModalStudyType(paceDetails.defaultFocusType);
    setModalVideoLecture('auto_lec1');
    setModalCustomVideoTitle('');
    setModalSlot('morning');
    setModalPriority('medium');
    setModalEstMinutes(60);
    setShowImportModal(true);
  };

  // Video Lecture Options generated dynamically linked to selected syllabus topic
  const currentSelectedTopicName = useMemo(() => {
    if (!modalSelectedTargetKeys.length) return 'Selected Topic';
    const found = flattenedTargets.find(t => t.key === modalSelectedTargetKeys[0]);
    return found ? (found.subtopicName || found.topicName) : 'Selected Topic';
  }, [modalSelectedTargetKeys, flattenedTargets]);

  const videoLectureOptions = useMemo(() => {
    return [
      { id: 'auto_lec1', label: `Lecture 1: ${currentSelectedTopicName} - Theory & Concepts (45m)`, minutes: 45 },
      { id: 'auto_lec2', label: `Lecture 2: ${currentSelectedTopicName} - Solved Examples & Tricks (60m)`, minutes: 60 },
      { id: 'auto_lec3', label: `Lecture 3: ${currentSelectedTopicName} - PYQ Discussion & Drill (30m)`, minutes: 30 },
      { id: 'custom', label: isHi ? '+ कस्टम वीडियो/लेक्चर लिंक...' : '+ Add Custom Video Lecture Title...', minutes: 45 },
    ];
  }, [currentSelectedTopicName, isHi]);

  // Update estimated minutes when video lecture or study type changes
  const handleVideoSelectChange = (lecId) => {
    setModalVideoLecture(lecId);
    const opt = videoLectureOptions.find(o => o.id === lecId);
    if (opt && opt.minutes) {
      const extraPractice = modalStudyType === 'Practice' || modalStudyType === 'PYQ' ? 30 : 15;
      setModalEstMinutes(opt.minutes + extraPractice);
    }
  };

  // 4. Confirm Import Targets to Timetable
  const handleConfirmImport = (e) => {
    e.preventDefault();
    if (!modalSelectedTargetKeys.length) {
      alert(isHi ? 'कृपया कम से कम एक सिलेबस लक्ष्य चुनें!' : 'Please select at least one syllabus target!');
      return;
    }

    const selectedTargets = flattenedTargets.filter(t => modalSelectedTargetKeys.includes(t.key));

    const newTasks = selectedTargets.map((item, idx) => {
      let lectureText = '';
      if (modalVideoLecture === 'custom') {
        lectureText = modalCustomVideoTitle || 'Custom Video Lecture';
      } else {
        const opt = videoLectureOptions.find(o => o.id === modalVideoLecture);
        lectureText = opt ? opt.label : '';
      }

      return {
        id: `ai_task_${Date.now()}_${idx}`,
        topic: item.fullPath,
        targetKey: item.key,
        videoLecture: lectureText,
        studyType: modalStudyType,
        priority: modalPriority,
        estMinutes: modalEstMinutes,
        slot: modalSlot,
        done: !!completedMap[item.key],
      };
    });

    const updatedList = [...timetableTasks, ...newTasks];
    saveTimetableTasks(updatedList);
    setShowImportModal(false);
  };

  // Toggle Timetable Item Done
  const toggleTaskDone = (id) => {
    const updated = timetableTasks.map(t => {
      if (t.id === id) {
        const nextDone = !t.done;
        // If task is linked to syllabus target key, sync completed map too
        if (t.targetKey) {
          toggleItemCompleted(t.targetKey);
        }
        return { ...t, done: nextDone };
      }
      return t;
    });
    saveTimetableTasks(updated);
  };

  // Delete Timetable Item
  const deleteTask = (id) => {
    const updated = timetableTasks.filter(t => t.id !== id);
    saveTimetableTasks(updated);
  };

  // 11. Rollover Unfinished Tasks to Tomorrow with lower priority
  const handleRolloverUnfinished = () => {
    const pendingTasks = timetableTasks.filter(t => !t.done);
    if (!pendingTasks.length) {
      alert(isHi ? 'आज कोई भी लंबित कार्य नहीं है!' : 'No pending tasks to rollover today!');
      return;
    }

    const updatedTasks = timetableTasks.map(t => {
      if (!t.done) {
        // lower priority: high -> medium, medium -> normal
        const newPriority = t.priority === 'high' ? 'medium' : 'normal';
        return {
          ...t,
          priority: newPriority,
          rolledOver: true,
        };
      }
      return t;
    });

    saveTimetableTasks(updatedTasks);
    alert(
      isHi 
        ? `${pendingTasks.length} अधूरे कार्यों को कम प्राथमिकता के साथ अगले दिन में रोलओवर कर दिया गया है!` 
        : `Rolled over ${pendingTasks.length} pending tasks to next day with lower priority!`
    );
  };

  // 8. HTML5 Drag & Drop between Slots
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSlotDrop = (e, targetSlotId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const updated = timetableTasks.map(t => t.id === taskId ? { ...t, slot: targetSlotId } : t);
    saveTimetableTasks(updated);
  };

  // Stats calculation
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

    // Timetable stats
    const totalTasks = timetableTasks.length;
    const doneTasks = timetableTasks.filter(t => t.done).length;
    const totalEstMinutes = timetableTasks.reduce((acc, t) => acc + (t.estMinutes || 45), 0);
    const doneEstMinutes = timetableTasks.filter(t => t.done).reduce((acc, t) => acc + (t.estMinutes || 45), 0);
    const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

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
      totalTasks,
      doneTasks,
      totalEstMinutes,
      doneEstMinutes,
      overallPct,
    };
  }, [flattenedTargets, completedMap, weeklySchedule, selectedDay, timetableTasks]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isHi ? 'स्मार्ट AI स्टडी प्लानर एवं कैलेंडर' : 'Smart AI Study Planner & Calendar'}
            </h2>
            <p className="text-xs text-gray-500">
              {isHi ? 'परीक्षा की निकटता के अनुसार ऑटो-अनुकूली टाइमटेबल और वीडियो लेक्चर लिंकर' : 'Adaptive study focus, linked video lectures, and drag & drop slot scheduling'}
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

      {/* 10. Adaptive Exam Focus Phase Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-4 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                {isHi ? paceDetails.phaseTitleHi : paceDetails.phaseTitleEn}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white">
                {paceDetails.examDaysLeft} {isHi ? 'दिन बाकी' : 'days left'}
              </span>
            </div>
            <h3 className="text-sm font-black text-white mt-0.5">
              {isHi ? `अनुशंसित फोकस: ${paceDetails.focusStrategyHi}` : `Recommended Focus: ${paceDetails.focusStrategyEn}`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenImportModal}
            className="px-3.5 py-2 bg-white text-indigo-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            {isHi ? 'दैनिक लक्ष्य इंपोर्ट करें' : 'Import Daily Targets'}
          </button>
        </div>
      </div>

      {/* Real Calendar Week Navigation & Schedule Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isHi ? 'वास्तविक कैलेंडर सप्ताह शेड्यूल' : 'Real Calendar Weekly Schedule'}
            </span>
            {weekOffset === 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {isHi ? 'इस सप्ताह' : 'Current Week'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title={isHi ? 'पिछला सप्ताह' : 'Previous Week'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg"
              >
                {isHi ? 'आज' : 'Today'}
              </button>
            )}
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title={isHi ? 'अगला सप्ताह' : 'Next Week'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7 Real Calendar Days Bar */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {weeklySchedule.map((d, idx) => {
            const isSelected = selectedDay === idx;
            const dayDone = d.items.length > 0 && d.items.every(item => completedMap[item.key]);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`p-2 md:p-3 rounded-xl border text-center transition-all relative ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 font-bold'
                    : d.isToday
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 font-bold'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                }`}
              >
                {d.isToday && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-black bg-emerald-500 text-white shadow-xs">
                    TODAY
                  </span>
                )}
                <p className={`text-[10px] uppercase font-bold opacity-80 ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {d.dayShort}
                </p>
                <p className={`text-xs md:text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                  {d.dateFormatted}
                </p>
                {dayDone ? (
                  <CheckCircle className="w-3 h-3 mx-auto mt-1 text-emerald-400" />
                ) : (
                  <p className={`text-[9px] font-semibold mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {d.items.length} {isHi ? 'लक्ष्य' : 'items'}
                  </p>
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
            {isHi 
              ? `${currentDayData.dayFull} (${currentDayData.dateFormatted}) का सिलेबस ब्रेकडाउन` 
              : `${currentDayData.dayFull} (${currentDayData.dateFormatted}) Syllabus Targets`}
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenImportModal}
              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isHi ? 'लक्ष्य टाइमटेबल में जोड़ें' : 'Import to AI Planner'}
            </button>
            <span className="text-xs text-gray-500 font-semibold">
              {stats.dayCompleted} / {stats.dayTotal} {isHi ? 'पूर्ण' : 'completed'}
            </span>
          </div>
        </div>

        {currentDayData.chaptersGrouped.length > 0 ? (
          <div className="space-y-3">
            {currentDayData.chaptersGrouped.map((chGroup, chIdx) => (
              <div
                key={chIdx}
                className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-200 dark:border-gray-600/60 space-y-3"
              >
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
              {isHi ? 'इस तारीख के लिए कोई टारगेट निर्धारित नहीं है' : 'No targets scheduled for this date'}
            </p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════
          8 & 9. SMART AI TIMETABLE SLOTS & DRAG AND DROP
      ════════════════════════════════════════════ */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {isHi ? 'स्मार्ट AI स्टडी टाइमटेबल (Drag & Drop)' : 'Smart AI Study Timetable'}
              </h3>
              <p className="text-xs text-gray-500">
                {isHi ? 'स्लॉट्स के बीच टास्क ड्रैग करें, लिंक्ड वीडियो लेक्चर्स देखें एवं समय ट्रैक करें' : 'Drag tasks between time slots, view linked video lectures, and track estimated time'}
              </p>
            </div>
          </div>

          {/* Action Buttons & Progress Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRolloverUnfinished}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5"
              title={isHi ? 'अधूरे टास्क कम प्राथमिकता के साथ रोलओवर करें' : 'Rollover unfinished tasks with lower priority'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isHi ? 'अधूरे टास्क रोलओवर करें' : 'Rollover Unfinished'}
            </button>

            <button
              onClick={handleOpenImportModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {isHi ? 'टारगेट इंपोर्ट करें' : 'Import Daily Targets'}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.overallPct}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {stats.doneTasks}/{stats.totalTasks} ({stats.overallPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* 4 Drag & Drop Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'morning', labelEn: 'Morning (06:00 - 10:00 AM)', labelHi: 'सुबह (06:00 - 10:00 AM)', icon: Sun, color: 'amber' },
            { id: 'afternoon', labelEn: 'Afternoon (02:00 - 05:00 PM)', labelHi: 'दोपहर (02:00 - 05:00 PM)', icon: Coffee, color: 'blue' },
            { id: 'evening', labelEn: 'Evening (06:00 - 09:00 PM)', labelHi: 'शाम (06:00 - 09:00 PM)', icon: Sunset, color: 'purple' },
            { id: 'night', labelEn: 'Night (09:30 - 11:30 PM)', labelHi: 'रात (09:30 - 11:30 PM)', icon: Moon, color: 'indigo' },
          ].map(slot => {
            const slotTasks = timetableTasks.filter(t => t.slot === slot.id);
            const slotDoneCount = slotTasks.filter(t => t.done).length;
            const slotTotalEst = slotTasks.reduce((acc, t) => acc + (t.estMinutes || 45), 0);
            const slotPct = slotTasks.length > 0 ? Math.round((slotDoneCount / slotTasks.length) * 100) : 0;
            const SlotIcon = slot.icon;

            return (
              <div
                key={slot.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleSlotDrop(e, slot.id)}
                className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600/50 space-y-2 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  {/* Slot Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-2 mb-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <SlotIcon className={`w-3.5 h-3.5 text-${slot.color}-500`} />
                      {isHi ? slot.labelHi : slot.labelEn}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      {Math.round(slotTotalEst / 60 * 10) / 10}h
                    </span>
                  </div>

                  {/* Slot Progress Bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${slotPct}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500">{slotDoneCount}/{slotTasks.length}</span>
                  </div>

                  {/* Tasks List */}
                  {slotTasks.length > 0 ? (
                    <div className="space-y-2">
                      {slotTasks.map(t => (
                        <div
                          key={t.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-xs ${
                            t.done
                              ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              onClick={() => toggleTaskDone(t.id)}
                              className="mt-0.5 cursor-pointer flex-shrink-0"
                            >
                              {t.done ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold leading-tight ${
                                t.done ? 'line-through text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {t.topic}
                              </p>

                              {/* Linked Video Lecture Badge */}
                              {t.videoLecture && (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                  <Play className="w-2.5 h-2.5 flex-shrink-0 fill-current" />
                                  <span className="truncate">{t.videoLecture}</span>
                                </div>
                              )}

                              {/* Badges: Study Type, Priority, Est Time */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                  t.studyType === 'Lecture' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                  t.studyType === 'Notes' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                                  t.studyType === 'Revision' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                  t.studyType === 'Practice' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                                  t.studyType === 'PYQ' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                                  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                }`}>
                                  {t.studyType}
                                </span>

                                <span className={`px-1 py-0.2 rounded text-[8px] font-bold uppercase ${
                                  t.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  t.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {t.priority}
                                </span>

                                <span className="text-[9px] font-semibold text-gray-500 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-gray-400" />
                                  {t.estMinutes || 45}m
                                </span>

                                {t.rolledOver && (
                                  <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 rounded">
                                    Rolled Over
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteTask(t.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <Move className="w-4 h-4 text-gray-400 mx-auto mb-1 opacity-50" />
                      <p className="text-[10px] text-gray-400 font-medium">
                        {isHi ? 'यहाँ कार्य ड्रैग करें' : 'Drag tasks here'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-center border-t border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-[9px] font-semibold text-gray-400">
                    {slotTasks.length} {isHi ? 'कार्य शेड्यूल' : 'tasks scheduled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          2, 3, 4 & 5. IMPORT DAILY TARGETS MODAL
      ════════════════════════════════════════════ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isHi ? 'सिलेबस लक्ष्य इंपोर्ट करें' : 'Import Daily Syllabus Targets'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isHi ? 'लक्ष्य चुनें एवं टाइमटेबल के लिए वीडियो लेक्चर लिंक करें' : 'Select targets and link video lectures to timetable'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmImport} className="space-y-4">
              {/* 3 & 4. Select Targets List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {isHi ? '1. आज का सिलेबस लक्ष्य चुनें (एक या अधिक):' : '1. Select Today Syllabus Targets (Single or Multiple):'}
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600">
                  {currentDayData.items && currentDayData.items.length > 0 ? (
                    currentDayData.items.map(item => {
                      const isChecked = modalSelectedTargetKeys.includes(item.key);
                      return (
                        <div
                          key={item.key}
                          onClick={() => {
                            setModalSelectedTargetKeys(prev =>
                              isChecked ? prev.filter(k => k !== item.key) : [...prev, item.key]
                            );
                          }}
                          className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {isChecked ? <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                          <span className="text-xs font-semibold">{item.fullPath}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 italic p-2">{isHi ? 'कोई लक्ष्य उपलब्ध नहीं' : 'No targets available'}</p>
                  )}
                </div>
              </div>

              {/* 5. Video Lecture Linker Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-blue-500" />
                  {isHi ? '2. लिंक किया गया वीडियो लेक्चर (ऐच्छिक):' : '2. Linked Video Lecture (Optional):'}
                </label>
                <select
                  value={modalVideoLecture}
                  onChange={e => handleVideoSelectChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value="">{isHi ? '-- कोई वीडियो नहीं (केवल सेल्फ स्टडी) --' : '-- No Video (Self Study) --'}</option>
                  {videoLectureOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>

                {modalVideoLecture === 'custom' && (
                  <input
                    type="text"
                    value={modalCustomVideoTitle}
                    onChange={e => setModalCustomVideoTitle(e.target.value)}
                    placeholder={isHi ? 'कस्टम वीडियो का नाम/शीर्षक दर्ज करें...' : 'Enter custom video lecture title...'}
                    className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                  />
                )}
              </div>

              {/* 7. Study Type & Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isHi ? 'अध्ययन का प्रकार:' : 'Study Type:'}
                  </label>
                  <select
                    value={modalStudyType}
                    onChange={e => setModalStudyType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value="Lecture">🎓 {isHi ? 'लेक्चर (Lecture)' : 'Lecture'}</option>
                    <option value="Notes">📝 {isHi ? 'नोट्स (Notes)' : 'Notes'}</option>
                    <option value="Revision">🔄 {isHi ? 'रिवीजन (Revision)' : 'Revision'}</option>
                    <option value="Practice">🎯 {isHi ? 'अभ्यास (Practice)' : 'Practice'}</option>
                    <option value="PYQ">⚡ {isHi ? 'PYQ (विगत प्रश्न)' : 'PYQ'}</option>
                    <option value="Mock Test">🏆 {isHi ? 'मॉक टेस्ट (Mock Test)' : 'Mock Test'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isHi ? 'समय स्लॉट:' : 'Time Slot:'}
                  </label>
                  <select
                    value={modalSlot}
                    onChange={e => setModalSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value="morning">🌅 {isHi ? 'सुबह (Morning)' : 'Morning'}</option>
                    <option value="afternoon">☀️ {isHi ? 'दोपहर (Afternoon)' : 'Afternoon'}</option>
                    <option value="evening">🌆 {isHi ? 'शाम (Evening)' : 'Evening'}</option>
                    <option value="night">🌙 {isHi ? 'रात (Night)' : 'Night'}</option>
                  </select>
                </div>
              </div>

              {/* 6 & 7. Priority & Auto-Estimated Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isHi ? 'प्राथमिकता (Priority):' : 'Priority:'}
                  </label>
                  <select
                    value={modalPriority}
                    onChange={e => setModalPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value="high">{isHi ? 'उच्च (High)' : 'High'}</option>
                    <option value="medium">{isHi ? 'मध्यम (Medium)' : 'Medium'}</option>
                    <option value="normal">{isHi ? 'सामान्य (Normal)' : 'Normal'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {isHi ? 'अनुमानित समय (Minutes):' : 'Est. Duration:'}
                  </label>
                  <select
                    value={modalEstMinutes}
                    onChange={e => setModalEstMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min (1 hr)</option>
                    <option value={75}>75 min</option>
                    <option value={90}>90 min (1.5 hrs)</option>
                    <option value={120}>120 min (2 hrs)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isHi ? 'स्मार्ट टाइमटेबल में जोड़ें' : 'Add to AI Planner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SmartAIStudyPlanner;
