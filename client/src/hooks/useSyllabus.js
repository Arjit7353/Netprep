// client/src/hooks/useSyllabus.js
import { useState, useEffect, useCallback, useRef } from 'react';
import syllabusService from '../services/syllabusService';

// Import local syllabus data as fallback
import syllabusPaper1Static from '../data/syllabusPaper1';
import syllabusPaper2HistoryStatic from '../data/syllabusPaper2History';

export const useSyllabus = (autoFetch = true) => {
  const [syllabus, setSyllabus] = useState({
    paper1: syllabusPaper1Static,
    paper2: syllabusPaper2HistoryStatic
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [dataSource, setDataSource] = useState('static'); // 'api', 'cache', 'static'
  const fetchedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Clear cache function
  const clearCache = useCallback(() => {
    try {
      sessionStorage.removeItem('netprep-syllabus');
      sessionStorage.removeItem('netprep-syllabus-timestamp');
      console.log('[Syllabus] Cache cleared');
    } catch (e) {
      // Ignore
    }
  }, []);

  // Fetch syllabus from API
  const fetchSyllabus = useCallback(async (forceRefresh = false) => {
    // Clear cache if force refresh
    if (forceRefresh) {
      clearCache();
    }

    // Use cache if recently fetched (within 1 minute) and not forcing refresh
    if (!forceRefresh && lastFetched && (Date.now() - lastFetched) < 1 * 60 * 1000) {
      console.log('[Syllabus] Using in-memory cache');
      return syllabus;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[Syllabus] Fetching from API...');
      const [paper1Res, paper2Res] = await Promise.all([
        syllabusService.getPaper1Syllabus(),
        syllabusService.getPaper2Syllabus()
      ]);
      
      // Check if we got valid data from API
      const paper1Data = paper1Res.data;
      const paper2Data = paper2Res.data;
      
      // Validate API response
      const paper1Valid = paper1Data && paper1Data.units && paper1Data.units.length > 0;
      const paper2Valid = paper2Data && paper2Data.units && paper2Data.units.length > 0;
      
      const newSyllabus = {
        paper1: paper1Valid ? paper1Data : syllabusPaper1Static,
        paper2: paper2Valid ? paper2Data : syllabusPaper2HistoryStatic
      };
      
      if (isMountedRef.current) {
        setSyllabus(newSyllabus);
        setLastFetched(Date.now());
        setDataSource(paper1Valid || paper2Valid ? 'api' : 'static');
        
        // Store in sessionStorage for quick access
        try {
          sessionStorage.setItem('netprep-syllabus', JSON.stringify(newSyllabus));
          sessionStorage.setItem('netprep-syllabus-timestamp', Date.now().toString());
        } catch (e) {
          // Ignore storage errors
        }
        
        console.log('[Syllabus] Loaded successfully', {
          paper1Units: newSyllabus.paper1?.units?.length || 0,
          paper2Units: newSyllabus.paper2?.units?.length || 0,
          source: paper1Valid || paper2Valid ? 'api' : 'static'
        });
      }
      
      return newSyllabus;
      
    } catch (err) {
      console.warn('[Syllabus] Failed to fetch from API:', err.message);
      setError(err.message || 'Failed to fetch syllabus');
      
      // Try to get from sessionStorage first
      try {
        const cached = sessionStorage.getItem('netprep-syllabus');
        const timestamp = sessionStorage.getItem('netprep-syllabus-timestamp');
        
        if (cached && timestamp) {
          const parsedCache = JSON.parse(cached);
          const age = Date.now() - parseInt(timestamp);
          
          // Use cache if less than 30 minutes old
          if (age < 30 * 60 * 1000 && parsedCache.paper1 && parsedCache.paper2) {
            if (isMountedRef.current) {
              setSyllabus(parsedCache);
              setDataSource('cache');
              console.log('[Syllabus] Using sessionStorage cache');
            }
            return parsedCache;
          }
        }
      } catch (e) {
        // Ignore
      }
      
      // Final fallback to static data
      const staticFallback = {
        paper1: syllabusPaper1Static,
        paper2: syllabusPaper2HistoryStatic
      };
      
      if (isMountedRef.current) {
        setSyllabus(staticFallback);
        setDataSource('static');
        console.log('[Syllabus] Using static fallback');
      }
      
      return staticFallback;
      
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [lastFetched, clearCache]);

  // Get syllabus for a specific paper
  const getSyllabus = useCallback((paper) => {
    const paperData = syllabus[paper];
    if (paperData && paperData.units && paperData.units.length > 0) {
      return paperData;
    }
    // Fallback to static if no data
    return paper === 'paper1' ? syllabusPaper1Static : syllabusPaper2HistoryStatic;
  }, [syllabus]);

  // Get units for a paper
  const getUnits = useCallback((paper) => {
    const paperSyllabus = getSyllabus(paper);
    if (!paperSyllabus?.units) return [];
    
    return paperSyllabus.units.map((unit, index) => ({
      ...unit,
      order: unit.order ?? index
    })).sort((a, b) => a.order - b.order);
  }, [getSyllabus]);

  // Get chapters for a unit
  const getChapters = useCallback((paper, unitName) => {
    const units = getUnits(paper);
    const unit = units.find(u => u.name === unitName || u.id === unitName);
    if (!unit?.chapters) return [];
    
    return unit.chapters.map((chapter, index) => ({
      ...chapter,
      order: chapter.order ?? index
    })).sort((a, b) => a.order - b.order);
  }, [getUnits]);

  // Get topics for a chapter
  const getTopics = useCallback((paper, unitName, chapterName) => {
    const chapters = getChapters(paper, unitName);
    const chapter = chapters.find(c => c.name === chapterName || c.id === chapterName);
    if (!chapter?.topics) return [];
    
    return chapter.topics.map((topic, index) => ({
      ...topic,
      order: topic.order ?? index
    })).sort((a, b) => a.order - b.order);
  }, [getChapters]);

  // Get subtopics for a topic
  const getSubtopics = useCallback((paper, unitName, chapterName, topicName) => {
    const topics = getTopics(paper, unitName, chapterName);
    const topic = topics.find(t => t.name === topicName || t.id === topicName);
    if (!topic?.subtopics) return [];
    
    return topic.subtopics.map(st => {
      if (typeof st === 'string') {
        return { name: st, nameHi: '' };
      }
      return st;
    });
  }, [getTopics]);

  // Find unit by ID
  const findUnitById = useCallback((paper, unitId) => {
    const units = getUnits(paper);
    return units.find(u => u.id === unitId);
  }, [getUnits]);

  // Find chapter by ID
  const findChapterById = useCallback((paper, unitId, chapterId) => {
    const unit = findUnitById(paper, unitId);
    if (!unit?.chapters) return null;
    return unit.chapters.find(c => c.id === chapterId);
  }, [findUnitById]);

  // Find topic by ID
  const findTopicById = useCallback((paper, unitId, chapterId, topicId) => {
    const chapter = findChapterById(paper, unitId, chapterId);
    if (!chapter?.topics) return null;
    return chapter.topics.find(t => t.id === topicId);
  }, [findChapterById]);

  // Get full path label
  const getPathLabel = useCallback((paper, unitName, chapterName, topicName, language = 'hi') => {
    const parts = [];
    
    if (paper) {
      parts.push(paper === 'paper1' 
        ? (language === 'hi' ? 'पेपर 1' : 'Paper 1')
        : (language === 'hi' ? 'पेपर 2' : 'Paper 2')
      );
    }
    
    if (unitName) {
      const units = getUnits(paper);
      const unit = units.find(u => u.name === unitName || u.id === unitName);
      if (unit) {
        parts.push(language === 'hi' && unit.nameHi ? unit.nameHi : unit.name);
      }
    }
    
    if (chapterName) {
      const chapters = getChapters(paper, unitName);
      const chapter = chapters.find(c => c.name === chapterName || c.id === chapterName);
      if (chapter) {
        parts.push(language === 'hi' && chapter.nameHi ? chapter.nameHi : chapter.name);
      }
    }
    
    if (topicName) {
      const topics = getTopics(paper, unitName, chapterName);
      const topic = topics.find(t => t.name === topicName || t.id === topicName);
      if (topic) {
        parts.push(language === 'hi' && topic.nameHi ? topic.nameHi : topic.name);
      }
    }
    
    return parts.join(' > ');
  }, [getUnits, getChapters, getTopics]);

  // Search in syllabus (local)
  const searchLocal = useCallback((query, paper = null) => {
    if (!query || query.length < 2) return [];
    
    const results = [];
    const searchLower = query.toLowerCase();
    const papersToSearch = paper ? [paper] : ['paper1', 'paper2'];
    
    papersToSearch.forEach(p => {
      const paperSyllabus = getSyllabus(p);
      if (!paperSyllabus?.units) return;
      
      paperSyllabus.units.forEach(unit => {
        // Search in unit
        if (unit.name?.toLowerCase().includes(searchLower) ||
            unit.nameHi?.includes(query)) {
          results.push({
            type: 'unit',
            paper: p,
            id: unit.id,
            name: unit.name,
            nameHi: unit.nameHi
          });
        }
        
        // Search in chapters
        (unit.chapters || []).forEach(chapter => {
          if (chapter.name?.toLowerCase().includes(searchLower) ||
              chapter.nameHi?.includes(query)) {
            results.push({
              type: 'chapter',
              paper: p,
              unitId: unit.id,
              unitName: unit.name,
              id: chapter.id,
              name: chapter.name,
              nameHi: chapter.nameHi
            });
          }
          
          // Search in topics
          (chapter.topics || []).forEach(topic => {
            if (topic.name?.toLowerCase().includes(searchLower) ||
                topic.nameHi?.includes(query)) {
              results.push({
                type: 'topic',
                paper: p,
                unitId: unit.id,
                unitName: unit.name,
                chapterId: chapter.id,
                chapterName: chapter.name,
                id: topic.id,
                name: topic.name,
                nameHi: topic.nameHi
              });
            }
          });
        });
      });
    });
    
    return results;
  }, [getSyllabus]);

  // Get statistics
  const getStats = useCallback((paper) => {
    const paperSyllabus = getSyllabus(paper);
    if (!paperSyllabus?.units) {
      return { units: 0, chapters: 0, topics: 0, subtopics: 0 };
    }
    
    let chapters = 0;
    let topics = 0;
    let subtopics = 0;
    
    paperSyllabus.units.forEach(unit => {
      chapters += unit.chapters?.length || 0;
      (unit.chapters || []).forEach(chapter => {
        topics += chapter.topics?.length || 0;
        (chapter.topics || []).forEach(topic => {
          subtopics += topic.subtopics?.length || 0;
        });
      });
    });
    
    return {
      units: paperSyllabus.units.length,
      chapters,
      topics,
      subtopics
    };
  }, [getSyllabus]);

  // Refresh syllabus (force)
  const refreshSyllabus = useCallback(() => {
    console.log('[Syllabus] Force refreshing...');
    fetchedRef.current = false;
    return fetchSyllabus(true);
  }, [fetchSyllabus]);

  // Load syllabus on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (autoFetch && !fetchedRef.current) {
      fetchedRef.current = true;
      
      // Check sessionStorage first for quick initial load
      try {
        const cached = sessionStorage.getItem('netprep-syllabus');
        const timestamp = sessionStorage.getItem('netprep-syllabus-timestamp');
        
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const parsedCache = JSON.parse(cached);
          
          // Use cache if less than 1 minute old
          if (age < 1 * 60 * 1000 && parsedCache.paper1 && parsedCache.paper2) {
            setSyllabus(parsedCache);
            setLastFetched(parseInt(timestamp));
            setDataSource('cache');
            setLoading(false);
            console.log('[Syllabus] Quick load from sessionStorage cache');
            
            // Still fetch in background to update
            setTimeout(() => fetchSyllabus(false), 500);
            return;
          }
        }
      } catch (e) {
        // Ignore
      }
      
      // Fetch fresh data
      fetchSyllabus(true);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [autoFetch, fetchSyllabus]);

  // Export both paper1 and paper2 directly for convenience
  const syllabusPaper1 = syllabus.paper1;
  const syllabusPaper2History = syllabus.paper2;

  return {
    syllabus,
    syllabusPaper1,
    syllabusPaper2History,
    loading,
    error,
    lastFetched,
    dataSource,
    fetchSyllabus,
    refreshSyllabus,
    clearCache,
    getSyllabus,
    getUnits,
    getChapters,
    getTopics,
    getSubtopics,
    findUnitById,
    findChapterById,
    findTopicById,
    getPathLabel,
    searchLocal,
    getStats
  };
};

export default useSyllabus;