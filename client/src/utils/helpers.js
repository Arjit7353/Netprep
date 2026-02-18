import { OPTION_LABELS, ROMAN_NUMERALS } from './constants';

export const formatDate = (date, withTime = false) => {
  if (!date) return '';
  const d = new Date(date);
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit', hour12: true })
  };
  return d.toLocaleDateString('en-IN', options);
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

export const formatTime = (seconds) => {
  if (seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
};

export const getOptionLabel = (index) => {
  return OPTION_LABELS[index] || `(${index + 1})`;
};

export const getRomanNumeral = (index) => {
  return ROMAN_NUMERALS[index] || `(${index + 1})`;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * FIXED: getBilingualText
 * Handles: string, {hi, en}, null/undefined
 */
export const getBilingualText = (textObj, lang = 'hi') => {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object') {
    return textObj[lang] || textObj.hi || textObj.en || '';
  }
  return '';
};

/**
 * FIXED: getBilingualArray
 * Handles:
 *   - Plain array: ['a','b','c']
 *   - Bilingual object: {hi: ['a'], en: ['b']}
 *   - Null/undefined
 */
export const getBilingualArray = (arrObj, lang = 'hi') => {
  if (!arrObj) return [];
  // Already a plain array
  if (Array.isArray(arrObj)) return arrObj;
  // Bilingual object {hi: [...], en: [...]}
  if (typeof arrObj === 'object') {
    const arr = arrObj[lang] || arrObj.hi || arrObj.en;
    if (Array.isArray(arr)) return arr;
  }
  return [];
};

/**
 * NEW: getChartLabels
 * Safely extracts chart labels from any format
 */
export const getChartLabels = (labelsData, lang = 'hi') => {
  if (!labelsData) return [];
  if (Array.isArray(labelsData)) return labelsData;
  if (typeof labelsData === 'object') {
    const arr = labelsData[lang] || labelsData.hi || labelsData.en;
    if (Array.isArray(arr)) return arr;
  }
  return [];
};

/**
 * NEW: getDatasetLabel
 * Safely extracts dataset label (string or bilingual object)
 */
export const getDatasetLabel = (labelData, lang = 'hi', fallback = 'Series') => {
  if (!labelData) return fallback;
  if (typeof labelData === 'string') return labelData;
  if (typeof labelData === 'object') {
    return labelData[lang] || labelData.hi || labelData.en || fallback;
  }
  return fallback;
};

/**
 * NEW: getPieColors
 * Extracts colors from pie chart dataset (handles both 'color' and 'colors')
 */
export const getPieColors = (dataset, fallbackColors) => {
  if (!dataset) return fallbackColors;
  // dataset.colors array (pie chart specific)
  if (Array.isArray(dataset.colors) && dataset.colors.length > 0) {
    return dataset.colors;
  }
  // dataset.color (single color - not for pie)
  if (dataset.color) return [dataset.color];
  return fallbackColors;
};

export const calculateAccuracy = (correct, total) => {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
};

export const calculateScore = (
  correct, wrong, marksPerQuestion = 2,
  hasNegative = false, negativeMarks = 0
) => {
  let score = correct * marksPerQuestion;
  if (hasNegative && negativeMarks > 0) score -= wrong * negativeMarks;
  return Math.max(0, score);
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

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

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

export const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    hard: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
  };
  return colors[difficulty] || colors.medium;
};

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

export const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};

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

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

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