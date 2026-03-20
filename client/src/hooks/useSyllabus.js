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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const fetchedRef = useRef(false);

  // Fetch syllabus from API
  const fetchSyllabus = useCallback(async (forceRefresh = false) => {
    // Avoid duplicate fetches
    if (loading) return;
    
    // Use cache if recently fetched (within 5 minutes) and not forcing refresh
    if (!forceRefresh && lastFetched && (Date.now() - lastFetched) < 5 * 60 * 1000) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [paper1Res, paper2Res] = await Promise.all([
        syllabusService.getPaper1Syllabus(),
        syllabusService.getPaper2Syllabus()
      ]);
      
      const newSyllabus = {
        paper1: paper1Res.data || syllabusPaper1Static,
        paper2: paper2Res.data || syllabusPaper2HistoryStatic
      };
      
      setSyllabus(newSyllabus);
      setLastFetched(Date.now());
      
      // Store in sessionStorage for quick access
      try {
        sessionStorage.setItem('netprep-syllabus', JSON.stringify(newSyllabus));
        sessionStorage.setItem('netprep-syllabus-timestamp', Date.now().toString());
      } catch (e) {
        // Ignore storage errors
      }
      
    } catch (err) {
      console.warn('Failed to fetch syllabus from API, using local/cached data');
      setError(err.message || 'Failed to fetch syllabus');
      
      // Try to get from sessionStorage
      try {
        const cached = sessionStorage.getItem('netprep-syllabus');
        if (cached) {
          setSyllabus(JSON.parse(cached));
        }
      } catch (e) {
        // Use static fallback
        setSyllabus({
          paper1: syllabusPaper1Static,
          paper2: syllabusPaper2HistoryStatic
        });
      }
    } finally {
      setLoading(false);
    }
  }, [loading, lastFetched]);

  // Get syllabus for a specific paper
  const getSyllabus = useCallback((paper) => {
    return syllabus[paper] || null;
  }, [syllabus]);

  // Get units for a paper
  const getUnits = useCallback((paper) => {
    const paperSyllabus = syllabus[paper];
    if (!paperSyllabus?.units) return [];
    
    return paperSyllabus.units.map((unit, index) => ({
      ...unit,
      order: unit.order ?? index
    })).sort((a, b) => a.order - b.order);
  }, [syllabus]);

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
      const paperSyllabus = syllabus[p];
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
  }, [syllabus]);

  // Get statistics
  const getStats = useCallback((paper) => {
    const paperSyllabus = syllabus[paper];
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
  }, [syllabus]);

  // Load syllabus on mount
  useEffect(() => {
    if (autoFetch && !fetchedRef.current) {
      fetchedRef.current = true;
      
      // Check sessionStorage first
      try {
        const cached = sessionStorage.getItem('netprep-syllabus');
        const timestamp = sessionStorage.getItem('netprep-syllabus-timestamp');
        
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          // Use cache if less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            setSyllabus(JSON.parse(cached));
            setLastFetched(parseInt(timestamp));
            return;
          }
        }
      } catch (e) {
        // Ignore
      }
      
      fetchSyllabus();
    }
  }, [autoFetch, fetchSyllabus]);

  return {
    syllabus,
    loading,
    error,
    lastFetched,
    fetchSyllabus,
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