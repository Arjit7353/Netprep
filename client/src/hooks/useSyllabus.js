import { useState, useEffect, useCallback } from 'react';
import syllabusService from '../services/syllabusService';

// Import local syllabus data as fallback
import syllabusPaper1 from '../data/syllabusPaper1';
import syllabusPaper2History from '../data/syllabusPaper2History';

export const useSyllabus = () => {
  const [syllabus, setSyllabus] = useState({
    paper1: syllabusPaper1,
    paper2: syllabusPaper2History
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch syllabus from API
  const fetchSyllabus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paper1Res, paper2Res] = await Promise.all([
        syllabusService.getPaper1Syllabus(),
        syllabusService.getPaper2Syllabus()
      ]);
      
      setSyllabus({
        paper1: paper1Res.data || syllabusPaper1,
        paper2: paper2Res.data || syllabusPaper2History
      });
    } catch (err) {
      console.warn('Failed to fetch syllabus from API, using local data');
      // Use local fallback
      setSyllabus({
        paper1: syllabusPaper1,
        paper2: syllabusPaper2History
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Get units for a paper
  const getUnits = useCallback((paper) => {
    const paperSyllabus = syllabus[paper];
    return paperSyllabus?.units || [];
  }, [syllabus]);

  // Get chapters for a unit
  const getChapters = useCallback((paper, unitName) => {
    const units = getUnits(paper);
    const unit = units.find(u => u.name === unitName);
    return unit?.chapters || [];
  }, [getUnits]);

  // Get topics for a chapter
  const getTopics = useCallback((paper, unitName, chapterName) => {
    const chapters = getChapters(paper, unitName);
    const chapter = chapters.find(c => c.name === chapterName);
    return chapter?.topics || [];
  }, [getChapters]);

  // Get subtopics for a topic
  const getSubtopics = useCallback((paper, unitName, chapterName, topicName) => {
    const topics = getTopics(paper, unitName, chapterName);
    const topic = topics.find(t => t.name === topicName);
    return topic?.subtopics || [];
  }, [getTopics]);

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
      const unit = units.find(u => u.name === unitName);
      parts.push(language === 'hi' && unit?.nameHi ? unit.nameHi : unitName);
    }
    
    if (chapterName) {
      const chapters = getChapters(paper, unitName);
      const chapter = chapters.find(c => c.name === chapterName);
      parts.push(language === 'hi' && chapter?.nameHi ? chapter.nameHi : chapterName);
    }
    
    if (topicName) {
      const topics = getTopics(paper, unitName, chapterName);
      const topic = topics.find(t => t.name === topicName);
      parts.push(language === 'hi' && topic?.nameHi ? topic.nameHi : topicName);
    }
    
    return parts.join(' > ');
  }, [getUnits, getChapters, getTopics]);

  // Load syllabus on mount
  useEffect(() => {
    fetchSyllabus();
  }, [fetchSyllabus]);

  return {
    syllabus,
    loading,
    error,
    fetchSyllabus,
    getUnits,
    getChapters,
    getTopics,
    getSubtopics,
    getPathLabel
  };
};

export default useSyllabus;