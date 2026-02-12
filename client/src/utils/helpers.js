import { OPTION_LABELS, ROMAN_NUMERALS, DATE_FORMATS } from './constants';

/**
 * Format date to display string
 * @param {Date|string} date - Date to format
 * @param {boolean} withTime - Include time
 * @returns {string} Formatted date string
 */
export const formatDate = (date, withTime = false) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  };
  
  return d.toLocaleDateString('en-IN', options);
};

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

/**
 * Format seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  if (seconds < 0) seconds = 0;
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
};

/**
 * Get option label (A, B, C, D...)
 * @param {number} index - Option index
 * @returns {string} Option label
 */
export const getOptionLabel = (index) => {
  return OPTION_LABELS[index] || `(${index + 1})`;
};

/**
 * Get roman numeral (i, ii, iii, iv...)
 * @param {number} index - Index
 * @returns {string} Roman numeral
 */
export const getRomanNumeral = (index) => {
  return ROMAN_NUMERALS[index] || `(${index + 1})`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Get bilingual text based on language preference
 * @param {Object} textObj - Object with hi and en keys
 * @param {string} lang - Language preference (hi/en)
 * @returns {string} Text in preferred language
 */
export const getBilingualText = (textObj, lang = 'hi') => {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;
  return textObj[lang] || textObj.hi || textObj.en || '';
};

/**
 * Get bilingual array based on language preference
 * @param {Object} arrObj - Object with hi and en arrays
 * @param {string} lang - Language preference
 * @returns {Array} Array in preferred language
 */
export const getBilingualArray = (arrObj, lang = 'hi') => {
  if (!arrObj) return [];
  if (Array.isArray(arrObj)) return arrObj;
  return arrObj[lang] || arrObj.hi || arrObj.en || [];
};

/**
 * Calculate accuracy percentage
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total attempts
 * @returns {number} Accuracy percentage
 */
export const calculateAccuracy = (correct, total) => {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
};

/**
 * Calculate test score
 * @param {number} correct - Correct answers
 * @param {number} wrong - Wrong answers
 * @param {number} marksPerQuestion - Marks per question
 * @param {boolean} hasNegative - Has negative marking
 * @param {number} negativeMarks - Negative marks per wrong answer
 * @returns {number} Total score
 */
export const calculateScore = (correct, wrong, marksPerQuestion = 2, hasNegative = false, negativeMarks = 0) => {
  let score = correct * marksPerQuestion;
  if (hasNegative && negativeMarks > 0) {
    score -= wrong * negativeMarks;
  }
  return Math.max(0, score);
};

/**
 * Shuffle array randomly
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Is empty
 */
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Get color class by difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Object} Color classes
 */
export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    hard: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
  };
  return colors[difficulty] || colors.medium;
};

/**
 * Get question type color
 * @param {string} type - Question type
 * @returns {Object} Color classes
 */
export const getQuestionTypeColor = (type) => {
  const colors = {
    mcq: { bg: 'bg-blue-100', text: 'text-blue-700' },
    assertion_reason: { bg: 'bg-purple-100', text: 'text-purple-700' },
    match_following: { bg: 'bg-green-100', text: 'text-green-700' },
    sequence_order: { bg: 'bg-orange-100', text: 'text-orange-700' },
    statement_based: { bg: 'bg-pink-100', text: 'text-pink-700' },
    passage_based: { bg: 'bg-teal-100', text: 'text-teal-700' },
    di_table: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    di_bar_chart: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    di_pie_chart: { bg: 'bg-amber-100', text: 'text-amber-700' },
    di_line_graph: { bg: 'bg-lime-100', text: 'text-lime-700' },
    di_mixed: { bg: 'bg-rose-100', text: 'text-rose-700' },
    di_caselet: { bg: 'bg-violet-100', text: 'text-violet-700' }
  };
  return colors[type] || colors.mcq;
};

/**
 * Parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed JSON or fallback
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('JSON Parse Error:', e);
    return fallback;
  }
};

/**
 * Download data as JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - File name
 */
export const downloadJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};

/**
 * Get relative time string
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};