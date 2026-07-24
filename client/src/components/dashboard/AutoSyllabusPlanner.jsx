import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, CheckCircle, Circle, BookOpen, Layers, Target, ChevronRight,
  CheckSquare, Square, RefreshCw, Sparkles, Clock, ChevronLeft, Sun, Coffee,
  Moon, Sunset, ListTodo, Plus, Trash2, RotateCcw, AlertCircle, Sliders, Check,
  Video, Play, FileText, Zap, Award, UserCheck, Flame, ShieldAlert, Search,
  X, ExternalLink, Activity, TrendingUp, Star, Filter, Share2
} from 'lucide-react';
import { useSyllabus } from '../../hooks/useSyllabus';
import syllabusPaper1Static from '../../data/syllabusPaper1';
import syllabusPaper2HistoryStatic from '../../data/syllabusPaper2History';
import MISSION_JRF_SCHEDULE, { MISSION_JRF_TESTS } from '../../data/missionJrfSchedule';

const AutoSyllabusPlanner = ({ language = 'en' }) => {
  const { syllabus: fetchedSyllabus } = useSyllabus(true);
  const isHi = language === 'hi';

  const syllabusData = useMemo(() => {
    return {
      paper1: fetchedSyllabus?.paper1?.units?.length ? fetchedSyllabus.paper1 : syllabusPaper1Static,
      paper2: fetchedSyllabus?.paper2?.units?.length ? fetchedSyllabus.paper2 : syllabusPaper2HistoryStatic,
    };
  }, [fetchedSyllabus]);

  // Filters & State
  const [selectedPaper, setSelectedPaper] = useState('all'); // 'all', 'paper1', 'paper2'
  const [selectedFaculty, setSelectedFaculty] = useState('all'); // 'all', 'Nishant Kapoor', 'Gulshan Akhtar', 'Subhangini Priya'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalClass, setActiveModalClass] = useState(null); // Selected class for detail modal

  const [paceMode, setPaceMode] = useState(() => {
    return localStorage.getItem('netprep_target_pace_mode') || 'auto';
  });

  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // 0 (Mon) to 6 (Sun)
  });

  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  // Live Exam Date Sync
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

  // Custom Tasks & Overrides State
  const [customTasks, setCustomTasks] = useState(() => {
    try {
      const stored = localStorage.getItem('netprep_auto_todo_tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [quickInputText, setQuickInputText] = useState('');
  const [quickInputSlot, setQuickInputSlot] = useState('morning');
  const [quickInputType, setQuickInputType] = useState('video');

  const saveCustomTasks = useCallback((newList) => {
    setCustomTasks(newList);
    try {
      localStorage.setItem('netprep_auto_todo_tasks', JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to store auto todo tasks', e);
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
        localStorage.removeItem('netprep_auto_todo_tasks');
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

  // Search Results across Mission JRF Master Schedule
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const results = [];

    MISSION_JRF_SCHEDULE.forEach(item => {
      const matchP1 = item.paper1?.filter(c => 
        c.topic.toLowerCase().includes(q) || c.unit.toLowerCase().includes(q) || c.faculty.toLowerCase().includes(q)
      );
      const matchP2 = item.paper2?.filter(c => 
        c.topic.toLowerCase().includes(q) || c.unit.toLowerCase().includes(q) || c.faculty.toLowerCase().includes(q)
      );

      if (matchP1?.length || matchP2?.length || item.testTitle?.toLowerCase().includes(q)) {
        results.push({
          date: item.date,
          day: item.day,
          paper1: matchP1 || [],
          paper2: matchP2 || [],
          hasTest: item.hasTest,
          testTitle: item.testTitle
        });
      }
    });

    return results.slice(0, 8); // Max 8 search results
  }, [searchQuery]);

  // Calculate Adaptive Daily Limit based on Pace Mode & Exam Date
  const paceDetails = useMemo(() => {
    const totalCount = flattenedTargets.length;
    const pendingCount = flattenedTargets.filter(item => !completedMap[item.key]).length;

    let itemsPerDay = 4;
    let examDaysLeft = 60;

    try {
      const storedExamDate = examDateSync || localStorage.getItem('netprep_exam_date');
      if (storedExamDate) {
        const diffMs = new Date(storedExamDate).getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0) examDaysLeft = diffDays;
      }
    } catch {}

    if (paceMode === 'auto') {
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
  }, [flattenedTargets, completedMap, paceMode, examDateSync, isHi]);

  // Distribute targets into 7 Real Calendar Days & Match Mission JRF Master Schedule
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

      const yearStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      const dateIsoStr = `${yearStr}-${mStr}-${dStr}`;

      const officialScheduleMatch = MISSION_JRF_SCHEDULE.find(s => s.date === dateIsoStr);

      days.push({
        dayIndex,
        dateObj: d,
        dateNum,
        monthStr,
        dayShort,
        dayFull,
        dateFormatted,
        dateIsoStr,
        isToday,
        officialScheduleMatch,
      });
    }

    const limit = paceDetails.itemsPerDay;

    return days.map((day, idx) => {
      const startIdx = idx * limit;
      const dayItems = flattenedTargets.slice(startIdx, startIdx + limit);

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

  const getSlotFromTiming = (timingStr) => {
    if (!timingStr) return 'afternoon';
    const lower = timingStr.toLowerCase();
    if (lower.includes('10:00 am') || lower.includes('8:00 am')) return 'morning';
    if (lower.includes('12:00 pm') || lower.includes('1:00 pm')) return 'afternoon';
    if (lower.includes('3:00 pm') || lower.includes('4:30 pm') || lower.includes('5:30 pm')) return 'evening';
    return 'night';
  };

  // Filter Schedule Items by Faculty
  const filterByFaculty = (classList) => {
    if (selectedFaculty === 'all') return classList;
    return (classList || []).filter(c => c.faculty?.toLowerCase().includes(selectedFaculty.toLowerCase()));
  };

  // AUTOMATIC TO-DO LIST GENERATION WITH FACULTY FILTER
  const autoGeneratedTodoList = useMemo(() => {
    const list = [];
    const match = currentDayData.officialScheduleMatch;

    if (match) {
      // 1. Paper 1
      if (selectedPaper === 'all' || selectedPaper === 'paper1') {
        const filteredP1 = filterByFaculty(match.paper1);
        filteredP1.forEach((c, idx) => {
          const slot = getSlotFromTiming(c.timing);
          const key = `off_p1_${match.date}_${idx}`;
          list.push({
            id: `auto_${key}`,
            key,
            text: `▶ Live Class: [Paper 1] ${c.unit} - ${c.topic}`,
            type: 'video',
            faculty: c.faculty,
            timing: c.timing,
            slotClass: c.slotClass,
            slot: slot,
            estMinutes: 60,
            done: !!completedMap[key],
            isAuto: true,
            isOfficial: true,
            classObj: c,
          });

          const companionKey = `off_p1_pyq_${match.date}_${idx}`;
          list.push({
            id: `auto_${companionKey}`,
            key: companionKey,
            text: `⚡ Practice PYQs & Revision: ${c.topic}`,
            type: 'pyq',
            faculty: c.faculty,
            slot: slot === 'morning' ? 'afternoon' : slot === 'afternoon' ? 'evening' : 'night',
            estMinutes: 45,
            done: !!completedMap[companionKey],
            isAuto: true,
            isOfficial: true,
            classObj: c,
          });
        });
      }

      // 2. Paper 2 History
      if (selectedPaper === 'all' || selectedPaper === 'paper2') {
        const filteredP2 = filterByFaculty(match.paper2);
        filteredP2.forEach((c, idx) => {
          const slot = getSlotFromTiming(c.timing);
          const key = `off_p2_${match.date}_${idx}`;
          list.push({
            id: `auto_${key}`,
            key,
            text: `▶ Live Class: [History] ${c.unit} - ${c.topic}`,
            type: 'video',
            faculty: c.faculty,
            timing: c.timing,
            slotClass: c.slotClass,
            slot: slot,
            estMinutes: 60,
            done: !!completedMap[key],
            isAuto: true,
            isOfficial: true,
            classObj: c,
          });

          const companionKey = `off_p2_pyq_${match.date}_${idx}`;
          list.push({
            id: `auto_${companionKey}`,
            key: companionKey,
            text: `📝 Notes & Self Study: ${c.topic}`,
            type: 'notes',
            faculty: c.faculty,
            slot: slot === 'morning' ? 'evening' : slot === 'afternoon' ? 'night' : 'night',
            estMinutes: 45,
            done: !!completedMap[companionKey],
            isAuto: true,
            isOfficial: true,
            classObj: c,
          });
        });
      }

      if (match.hasTest) {
        const testKey = `off_test_${match.date}`;
        list.push({
          id: `auto_${testKey}`,
          key: testKey,
          text: `🏆 ${match.testTitle}`,
          type: 'test',
          slot: 'night',
          estMinutes: 180,
          done: !!completedMap[testKey],
          isAuto: true,
          isOfficial: true,
        });
      }
    }

    if (list.length === 0) {
      const dayItems = currentDayData.items || [];
      const slots = ['morning', 'afternoon', 'evening', 'night'];

      dayItems.forEach((item, idx) => {
        const topicTitle = item.subtopicName || item.topicName;
        const isDone = !!completedMap[item.key];
        const slot = slots[idx % 4];

        list.push({
          id: `auto_vid_${item.key}`,
          key: item.key,
          text: `▶ Video Lecture: ${topicTitle}`,
          type: 'video',
          slot: slot,
          estMinutes: idx === 3 ? 30 : 60,
          done: isDone,
          isAuto: true,
        });

        list.push({
          id: `auto_pyq_${item.key}`,
          key: item.key,
          text: `⚡ PYQ & Notes: ${topicTitle}`,
          type: idx % 2 === 0 ? 'pyq' : 'notes',
          slot: slots[(idx + 2) % 4],
          estMinutes: 45,
          done: isDone,
          isAuto: true,
        });
      });
    }

    return [...list, ...customTasks];
  }, [currentDayData, completedMap, customTasks, selectedPaper, selectedFaculty]);

  const handleAddQuickTask = (e) => {
    e.preventDefault();
    if (!quickInputText.trim()) return;
    const newTask = {
      id: `custom_${Date.now()}`,
      text: quickInputText.trim(),
      slot: quickInputSlot,
      type: quickInputType,
      estMinutes: quickInputType === 'video' ? 60 : 45,
      done: false,
      isAuto: false,
    };
    saveCustomTasks([...customTasks, newTask]);
    setQuickInputText('');
  };

  const toggleTaskDone = (task) => {
    if (task.key) {
      toggleItemCompleted(task.key);
    } else {
      const updated = customTasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t);
      saveCustomTasks(updated);
    }
  };

  const deleteCustomTask = (id) => {
    const updated = customTasks.filter(t => t.id !== id);
    saveCustomTasks(updated);
  };

  // Overall Statistics & Batch Progress
  const stats = useMemo(() => {
    const totalCount = flattenedTargets.length;
    const completedCount = flattenedTargets.filter(item => completedMap[item.key]).length;

    // Total Official Classes Count across batch (Paper 1 + Paper 2)
    let totalBatchClasses = 0;
    let completedBatchClasses = 0;
    MISSION_JRF_SCHEDULE.forEach(item => {
      const p1Count = item.paper1?.length || 0;
      const p2Count = item.paper2?.length || 0;
      totalBatchClasses += (p1Count + p2Count);

      (item.paper1 || []).forEach((_, idx) => {
        if (completedMap[`off_p1_${item.date}_${idx}`]) completedBatchClasses++;
      });
      (item.paper2 || []).forEach((_, idx) => {
        if (completedMap[`off_p2_${item.date}_${idx}`]) completedBatchClasses++;
      });
    });

    const batchProgressPct = totalBatchClasses > 0 ? Math.round((completedBatchClasses / totalBatchClasses) * 100) : 0;

    const videoMins = autoGeneratedTodoList.filter(t => t.type === 'video').reduce((acc, t) => acc + (t.estMinutes || 60), 0);
    const videoHours = Math.round(videoMins / 60 * 10) / 10;

    const totalMins = autoGeneratedTodoList.reduce((acc, t) => acc + (t.estMinutes || 45), 0);
    const totalHours = Math.round(totalMins / 60 * 10) / 10;

    return {
      totalCount,
      completedCount,
      totalBatchClasses,
      completedBatchClasses,
      batchProgressPct,
      videoHours,
      totalHours
    };
  }, [flattenedTargets, completedMap, autoGeneratedTodoList]);

  const currentMatch = currentDayData.officialScheduleMatch;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 md:p-6 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {isHi ? 'Mission JRF Dec 2026: ऑफिशियल बैच डैशबोर्ड' : 'Mission JRF Dec 2026: Official Executive Planner'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-xs">
                LIVE BATCH SYNCED
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              {isHi ? 'प्रो. निशांत कपूर, गुलशन अख्तर व शुभांगिनी प्रिया के मास्टर टाइमटेबल से सिंक' : 'Synced with Official Master Timetable (Nishant Kapoor, Gulshan Akhtar & Subhangini Priya)'}
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isHi ? 'टॉपिक या फैकल्टी खोजें (उदा. DI, Gupta)...' : 'Search topic or faculty (e.g. Research, DI)...'}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto p-2 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Found {searchResults.length} Scheduled Classes
              </p>
              {searchResults.map((res, idx) => (
                <div key={idx} className="p-2 hover:bg-blue-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors cursor-pointer text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-blue-600 dark:text-blue-400">
                    <span>{res.date} ({res.day})</span>
                    {res.hasTest && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 rounded">TEST</span>}
                  </div>
                  {res.paper1.map((c, cIdx) => (
                    <p key={cIdx} className="text-gray-800 dark:text-gray-200 font-semibold truncate">
                      [P1] {c.topic} ({c.faculty})
                    </p>
                  ))}
                  {res.paper2.map((c, cIdx) => (
                    <p key={cIdx} className="text-gray-800 dark:text-gray-200 font-semibold truncate">
                      [P2 History] {c.topic} ({c.faculty})
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Faculty & Paper Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Paper Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-500 mr-1">{isHi ? 'पेपर:' : 'Paper:'}</span>
          {[
            { id: 'all', label: 'All Papers' },
            { id: 'paper1', label: 'Paper 1' },
            { id: 'paper2', label: 'Paper 2 (History)' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPaper(p.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedPaper === p.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Faculty Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-500 mr-1">{isHi ? 'फैकल्टी:' : 'Faculty:'}</span>
          {[
            { id: 'all', label: 'All Faculty' },
            { id: 'Nishant', label: '👨‍🏫 Nishant Sir' },
            { id: 'Gulshan', label: '👩‍🏫 Gulshan Ma\'am' },
            { id: 'Subhangini', label: '👩‍🏫 Subhangini Ma\'am' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFaculty(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedFaculty === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={resetAllTargets}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
            title={isHi ? 'रीसेट प्रोग्रेस' : 'Reset Progress'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Progress & Batch Completion Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Batch Completion Gauge */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              {isHi ? 'बैच पूर्णता दर' : 'Batch Completion'}
            </span>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {stats.completedBatchClasses} / {stats.totalBatchClasses} Classes
            </span>
          </div>
          <div className="w-full h-2.5 bg-blue-200 dark:bg-blue-900/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, stats.batchProgressPct)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 font-semibold text-right">
            {stats.batchProgressPct}% {isHi ? 'मास्टर बैच पूरा' : 'Master Batch Completed'}
          </p>
        </div>

        {/* Card 2: Daily Video Allocation Banner */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-amber-600" />
              {isHi ? 'दैनिक वीडियो आवंटन' : 'Daily Video Allocation'}
            </span>
            <span className="text-xs font-black text-amber-700 dark:text-amber-400">
              {stats.videoHours} Hours/Day
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">
            <span>Total Study: {stats.totalHours} hrs</span>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-black">
              AUTO-STRUCTURED
            </span>
          </div>
        </div>

        {/* Card 3: Adaptive Pace Indicator */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              {isHi ? 'परीक्षा उलटी गिनती' : 'Exam Countdown Pace'}
            </span>
            <span className="text-xs font-black text-purple-700 dark:text-purple-400">
              {paceDetails.examDaysLeft} Days Left
            </span>
          </div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">
            Est. Finish: <span className="text-indigo-600 dark:text-indigo-400 font-black">{paceDetails.dateFormatted}</span>
          </p>
        </div>
      </div>

      {/* Real Calendar Week Navigation & Schedule Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isHi ? 'साप्ताहिक कैलेंडर शेड्यूल' : 'Real Calendar Weekly Schedule'}
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
            const hasOfficialClass = !!d.officialScheduleMatch;

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
                {hasOfficialClass ? (
                  <span className={`inline-block w-2 h-2 rounded-full mt-1 ${isSelected ? 'bg-amber-300' : 'bg-blue-500'}`} title="Official Live Class" />
                ) : (
                  <p className={`text-[9px] font-semibold mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {d.items.length} {isHi ? 'लक्ष्य' : 'targets'}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Breakdown Section (Mission JRF Official Classes & Syllabus Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            {isHi 
              ? `${currentDayData.dayFull} (${currentDayData.dateFormatted}) के ऑफिशियल लाइव क्लास व सिलेबस लक्ष्य` 
              : `${currentDayData.dayFull} (${currentDayData.dateFormatted}) Mission JRF Live Classes & Syllabus`}
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCarryoverPending}
              className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isHi ? 'बचे हुए कल में भेजें' : 'Carryover Pending'}
            </button>
          </div>
        </div>

        {/* Display Official Mission JRF Live Classes if match exists */}
        {currentMatch ? (
          <div className="space-y-3">
            {/* Paper 1 Classes */}
            {(selectedPaper === 'all' || selectedPaper === 'paper1') && filterByFaculty(currentMatch.paper1)?.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 space-y-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                  PAPER 1 LIVE CLASSES
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {filterByFaculty(currentMatch.paper1).map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveModalClass(c)}
                      className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-blue-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-1.5 border-l-4 border-l-blue-600"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                        <span>{c.unit}</span>
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px]">
                          ⏱ {c.timing}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{c.topic}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-indigo-500" />
                          Faculty: {c.faculty}
                        </span>
                        <span className="text-blue-500 flex items-center gap-0.5 font-bold">
                          View Details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paper 2 (History) Classes */}
            {(selectedPaper === 'all' || selectedPaper === 'paper2') && filterByFaculty(currentMatch.paper2)?.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/20 dark:to-purple-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 space-y-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white uppercase tracking-wider">
                  PAPER 2 (HISTORY) LIVE CLASSES
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {filterByFaculty(currentMatch.paper2).map((c, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveModalClass(c)}
                      className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-amber-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-1.5 border-l-4 border-l-amber-600"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                        <span>{c.unit}</span>
                        <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded text-[10px]">
                          ⏱ {c.timing}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{c.topic}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-amber-500" />
                          Faculty: {c.faculty}
                        </span>
                        <span className="text-amber-600 flex items-center gap-0.5 font-bold">
                          View Details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* General Syllabus Target Breakdown */
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
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
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
        )}
      </div>

      {/* ════════════════════════════════════════════
          AUTOMATICALLY GENERATED DAILY TO-DO LIST
      ════════════════════════════════════════════ */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {isHi ? 'स्वचालित दैनिक टू-डू सूची (Auto Generated To-Do)' : 'Auto-Generated Daily To-Do List'}
              </h3>
              <p className="text-xs text-gray-500">
                {isHi ? 'ऑफिशियल लाइव क्लासेस, वीडियो लेक्चर आवंटन व अभ्यास कार्यों से स्वचालित सिंक' : 'Auto-synced with Mission JRF Live Classes, video lectures, and practice tasks'}
              </p>
            </div>
          </div>
        </div>

        {/* Fast 1-Line Quick Task Add Input */}
        <form onSubmit={handleAddQuickTask} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/40 p-2 rounded-xl border border-gray-200 dark:border-gray-600">
          <select
            value={quickInputSlot}
            onChange={e => setQuickInputSlot(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200"
          >
            <option value="morning">🌅 Morning</option>
            <option value="afternoon">☀️ Afternoon</option>
            <option value="evening">🌆 Evening</option>
            <option value="night">🌙 Night</option>
          </select>

          <select
            value={quickInputType}
            onChange={e => setQuickInputType(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200"
          >
            <option value="video">▶ Live Class / Video (1h)</option>
            <option value="pyq">⚡ PYQ Practice</option>
            <option value="notes">📝 Notes Revision</option>
            <option value="revision">🔄 Self Revision</option>
            <option value="test">🏆 Test / Quiz</option>
          </select>

          <input
            type="text"
            value={quickInputText}
            onChange={e => setQuickInputText(e.target.value)}
            placeholder={isHi ? 'त्वरित अतिरिक्त कार्य जोड़ें...' : 'Type quick custom task and press Enter...'}
            className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            {isHi ? 'जोड़ें' : '+ Add'}
          </button>
        </form>

        {/* 4 Time Slots List with Auto Generated Tasks & Tag Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'morning', labelEn: 'Morning (06:00 - 10:00 AM)', labelHi: 'सुबह (06:00 - 10:00 AM)', icon: Sun, color: 'amber' },
            { id: 'afternoon', labelEn: 'Afternoon (12:00 - 03:00 PM)', labelHi: 'दोपहर (12:00 - 03:00 PM)', icon: Coffee, color: 'blue' },
            { id: 'evening', labelEn: 'Evening (04:00 - 08:00 PM)', labelHi: 'शाम (04:00 - 08:00 PM)', icon: Sunset, color: 'purple' },
            { id: 'night', labelEn: 'Night (09:00 - 11:30 PM)', labelHi: 'रात (09:00 - 11:30 PM)', icon: Moon, color: 'indigo' },
          ].map(slot => {
            const slotTasks = autoGeneratedTodoList.filter(t => t.slot === slot.id);
            const SlotIcon = slot.icon;

            return (
              <div key={slot.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 border border-gray-200 dark:border-gray-600/50 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <SlotIcon className={`w-3.5 h-3.5 text-${slot.color}-500`} />
                    {isHi ? slot.labelHi : slot.labelEn}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">
                    {slotTasks.filter(t => t.done).length}/{slotTasks.length}
                  </span>
                </div>

                {slotTasks.length > 0 ? (
                  <div className="space-y-1.5">
                    {slotTasks.map(t => (
                      <div
                        key={t.id}
                        className={`flex flex-col p-2.5 rounded-lg border transition-all space-y-1.5 ${
                          t.done
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                            : t.isOfficial
                            ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:bg-gray-800 border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => toggleTaskDone(t)}
                            className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer"
                          >
                            {t.done ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <span className={`text-xs font-semibold leading-snug block ${
                                t.done ? 'line-through text-emerald-800 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {t.text}
                              </span>
                              {t.faculty && (
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5">
                                  👨‍🏫 Faculty: {t.faculty} {t.timing ? `(${t.timing})` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {!t.isAuto && (
                            <button
                              onClick={() => deleteCustomTask(t.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Action Tag Pill (Video / PYQ / Notes / Revision / Test) */}
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-md uppercase flex items-center gap-1 ${
                              t.type === 'video' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                              t.type === 'pyq' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
                              t.type === 'notes' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                              t.type === 'revision' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}>
                              {t.type === 'video' && <Video className="w-2.5 h-2.5" />}
                              {t.type === 'pyq' && <Zap className="w-2.5 h-2.5" />}
                              {t.type === 'notes' && <FileText className="w-2.5 h-2.5" />}
                              {t.type === 'revision' && <RefreshCw className="w-2.5 h-2.5" />}
                              {t.type === 'test' && <Award className="w-2.5 h-2.5" />}
                              {t.type}
                            </span>

                            <span className="text-gray-400">⏱ {t.estMinutes || 45}m</span>
                          </div>

                          {t.isOfficial ? (
                            <span className="text-[8px] font-black text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.2 rounded uppercase">
                              MISSION JRF 2026
                            </span>
                          ) : t.isAuto && (
                            <span className="text-[8px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.2 rounded">
                              AUTO SYNCED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 italic text-center py-2">
                    {isHi ? 'कोई अतिरिक्त कार्य नहीं' : 'No tasks scheduled'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Detail Modal / Slide-over */}
      {activeModalClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {activeModalClass.unit}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                  {activeModalClass.topic}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalClass(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl">
                <div>
                  <span className="text-gray-400 block font-medium">Faculty Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{activeModalClass.faculty}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Class Timing</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">⏱ {activeModalClass.timing}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-gray-900 dark:text-white">Recommended Class Workflow:</p>
                <ul className="space-y-1.5 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Watch live lecture or recording (60 mins)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-500" />
                    <span>Download PDF Notes & revise key formulas/facts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    <span>Attempt 15 PYQs related to {activeModalClass.unit}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModalClass(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AutoSyllabusPlanner;
