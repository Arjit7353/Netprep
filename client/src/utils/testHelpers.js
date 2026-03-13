// client/src/utils/testHelpers.js
// Utility functions for test creation and display

import syllabusPaper1 from '../data/syllabusPaper1';
import syllabusPaper2History from '../data/syllabusPaper2History';

const getSyllabus = (paper) => {
  return paper === 'paper1' ? syllabusPaper1 : syllabusPaper2History;
};

/**
 * Parse unit string to array
 */
export const parseUnitString = (unitStr) => {
  if (!unitStr || typeof unitStr !== 'string') return [];
  return unitStr.split(',').map(u => u.trim()).filter(u => u.length > 0);
};

/**
 * Parse chapter string to array
 */
export const parseChapterString = (chapterStr) => {
  if (!chapterStr || typeof chapterStr !== 'string') return [];
  return chapterStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
};

/**
 * Parse topic string to array
 */
export const parseTopicString = (topicStr) => {
  if (!topicStr || typeof topicStr !== 'string') return [];
  return topicStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
};

/**
 * Get short name from unit (remove "UNIT X:" prefix)
 */
export const getUnitShortName = (unitName) => {
  if (!unitName) return '';
  return unitName.replace(/^(UNIT|इकाई)\s*[IVXLCDM\d]+:\s*/i, '').trim();
};

/**
 * Extract info from title as fallback
 */
export const extractFromTitle = (title) => {
  if (!title) return { units: [], chapters: [], topics: [] };
  
  const result = { units: [], chapters: [], topics: [] };
  const parts = title.split('|').map(p => p.trim()).filter(p => p.length > 0);
  
  parts.forEach(part => {
    if (/^P[12]$|^Paper/i.test(part)) return;
    
    if (/^U[IVX]+:|^UNIT/i.test(part)) {
      result.units.push(part);
    } else if (part.includes('>')) {
      const [chapter, topic] = part.split('>').map(s => s.trim());
      if (chapter) result.chapters.push(chapter);
      if (topic) result.topics.push(topic);
    } else if (!part.includes('-') && !part.includes('#')) {
      result.chapters.push(part);
    }
  });
  
  return result;
};

/**
 * Convert selected unit keys to comma-separated unit names (for saving to DB)
 * Input: ['paper1_unit1', 'paper2_unit5']
 * Output: "UNIT I: Teaching Aptitude, UNIT V: Administration & Economy"
 */
export const getUnitNamesFromKeys = (unitKeys, language = 'en') => {
  if (!unitKeys || unitKeys.length === 0) return '';
  
  const names = [];
  
  unitKeys.forEach(key => {
    const parts = key.split('_');
    if (parts.length < 2) return;
    
    const [paper, unitId] = parts;
    const syllabus = getSyllabus(paper);
    const unit = syllabus.units?.find(u => u.id === unitId);
    
    if (unit) {
      const name = language === 'hi' ? unit.nameHi : unit.name;
      if (name && !names.includes(name)) {
        names.push(name);
      }
    }
  });
  
  return names.join(', ');
};

/**
 * Convert selected chapter keys to comma-separated chapter names
 * Input: ['paper1_unit1_ch1', 'paper1_unit2_ch3']
 * Output: "Concept & Nature of Teaching, Thesis Writing & Ethics"
 */
export const getChapterNamesFromKeys = (chapterKeys, language = 'en') => {
  if (!chapterKeys || chapterKeys.length === 0) return '';
  
  const names = [];
  
  chapterKeys.forEach(key => {
    const parts = key.split('_');
    if (parts.length < 3) return;
    
    const [paper, unitId, chapterId] = parts;
    const syllabus = getSyllabus(paper);
    const unit = syllabus.units?.find(u => u.id === unitId);
    const chapter = unit?.chapters?.find(c => c.id === chapterId);
    
    if (chapter) {
      const name = language === 'hi' ? chapter.nameHi : chapter.name;
      if (name && !names.includes(name)) {
        names.push(name);
      }
    }
  });
  
  return names.join(', ');
};

/**
 * Convert selected topic keys to comma-separated topic names
 */
export const getTopicNamesFromKeys = (topicKeys) => {
  if (!topicKeys || topicKeys.length === 0) return '';
  return topicKeys.filter(t => t && t.trim()).join(', ');
};

/**
 * Build complete test metadata from filters
 */
export const buildTestMetadata = (mainFilters, language = 'en') => {
  return {
    unit: getUnitNamesFromKeys(mainFilters.units || [], language),
    chapter: getChapterNamesFromKeys(mainFilters.chapters || [], language),
    topic: getTopicNamesFromKeys(mainFilters.topics || [])
  };
};

/**
 * Extract unit ID from full name
 */
export const extractUnitId = (unitStr) => {
  if (!unitStr) return null;
  const match = unitStr.trim().match(/(?:UNIT|इकाई)\s*([IVXLCDM]+|\d+)/i);
  if (match) return 'UNIT ' + match[1].toUpperCase();
  return unitStr.trim();
};

/**
 * Check if test matches unit filter
 */
export const testMatchesUnit = (test, filterUnit) => {
  if (!test.unit || !filterUnit) return false;
  const testUnits = parseUnitString(test.unit);
  const filterUnitId = extractUnitId(filterUnit);
  
  return testUnits.some(u => extractUnitId(u) === filterUnitId);
};

export default {
  parseUnitString,
  parseChapterString,
  parseTopicString,
  getUnitShortName,
  extractFromTitle,
  getUnitNamesFromKeys,
  getChapterNamesFromKeys,
  getTopicNamesFromKeys,
  buildTestMetadata,
  extractUnitId,
  testMatchesUnit
};