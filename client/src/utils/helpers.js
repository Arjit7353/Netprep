import { OPTION_LABELS, ROMAN_NUMERALS } from './constants';

// ★ Language detection regex — used by smart bilingual functions
const HINDI_CHAR_RE = /[\u0900-\u097F]/;

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

/**
 * Smart sequence/statement item label detector
 * Analyzes options array (e.g. ['II, IV, I, III', ...]) to determine whether
 * items should be labeled with Roman numerals (I, II, III, IV) or Alphabets (A, B, C, D).
 */
export const getSequenceItemLabel = (index, options = []) => {
  const upperRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const lowerRoman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

  if (!options || !Array.isArray(options) || options.length === 0) {
    return upperRoman[index] || `(${index + 1})`;
  }

  const optString = options
    .map(o => (typeof o === 'string' ? o : JSON.stringify(o || '')))
    .join(' ');

  // Check for Uppercase Roman Numerals (I, II, III, IV, etc.)
  const upperRomanMatches = optString.match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/g);
  if (upperRomanMatches && upperRomanMatches.length >= 2) {
    return upperRoman[index] || `(${index + 1})`;
  }

  // Check for Lowercase Roman Numerals (i, ii, iii, iv, etc.)
  const lowerRomanMatches = optString.match(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/g);
  if (lowerRomanMatches && lowerRomanMatches.length >= 2) {
    return lowerRoman[index] || `(${index + 1})`;
  }

  // Check for Lowercase Alphabets (a, b, c, d, etc.)
  const lowerAlphaMatches = optString.match(/\b(a|b|c|d|e|f)\b/g);
  const upperAlphaMatches = optString.match(/\b(A|B|C|D|E|F)\b/g);

  if (lowerAlphaMatches && lowerAlphaMatches.length >= 2 && (!upperAlphaMatches || lowerAlphaMatches.length > upperAlphaMatches.length)) {
    return String.fromCharCode(97 + index); // 'a', 'b', 'c'...
  }

  if (upperAlphaMatches && upperAlphaMatches.length >= 2) {
    return String.fromCharCode(65 + index); // 'A', 'B', 'C'...
  }

  // Default to Uppercase Roman
  return upperRoman[index] || `(${index + 1})`;
};


export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * ★★★ SMART getBilingualText v2.0
 * Detects if text is stored in WRONG language field and auto-swaps
 * Handles: string, {hi, en}, null/undefined
 */
export const getBilingualText = (textObj, lang = 'hi') => {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;

  if (typeof textObj === 'object') {
    const otherLang = lang === 'hi' ? 'en' : 'hi';
    const primary = (textObj[lang] || '');
    const fallback = (textObj[otherLang] || '');

    // If primary is empty, use fallback
    if (!primary.trim()) return fallback || '';
    // If fallback is empty, use primary
    if (!fallback.trim()) return primary;

    // ★ Smart language detection — only for substantial text
    if (primary.trim().length > 10) {
      const pHasHindi = HINDI_CHAR_RE.test(primary);
      const fHasHindi = HINDI_CHAR_RE.test(fallback);

      if (lang === 'hi' && !pHasHindi && fHasHindi) {
        // Requesting Hindi: primary has NO Hindi but fallback DOES → data swapped
        return fallback;
      }
      if (lang === 'en' && !fHasHindi && pHasHindi) {
        // Requesting English: primary has Hindi, fallback doesn't → data swapped
        const hindiChars = (primary.match(/[\u0900-\u097F]/g) || []).length;
        const englishChars = (primary.match(/[A-Za-z]/g) || []).length;
        if (hindiChars > englishChars) {
          return fallback;
        }
      }
    }

    return primary;
  }
  return '';
};

/**
 * ★★★ SMART getBilingualArray v2.0
 * Per-item language detection — picks correct language text for each item
 * Handles:
 *   - Plain array: ['a','b','c']
 *   - Bilingual object: {hi: [...], en: [...]}
 *   - WRONG LANGUAGE in wrong field (English in hi, Hindi in en)
 *   - Empty strings with fallback
 *   - Null/undefined
 */
export const getBilingualArray = (arrObj, lang = 'hi') => {
  if (!arrObj) return [];

  // Already a plain array
  if (Array.isArray(arrObj)) return arrObj;

  // Bilingual object {hi: [...], en: [...]}
  if (typeof arrObj === 'object') {
    const otherLang = lang === 'hi' ? 'en' : 'hi';
    const primaryArr = Array.isArray(arrObj[lang]) ? arrObj[lang] : [];
    const fallbackArr = Array.isArray(arrObj[otherLang]) ? arrObj[otherLang] : [];

    const maxLen = Math.max(primaryArr.length, fallbackArr.length);
    if (maxLen === 0) return [];

    // ★ Quick scan: does ANY item have wrong language?
    let hasWrongLangItem = false;
    for (let i = 0; i < primaryArr.length; i++) {
      const p = (primaryArr[i] || '').trim();
      if (!p || p.length <= 5) continue; // Skip empty/very short items

      const pHasHindi = HINDI_CHAR_RE.test(p);

      if (lang === 'hi' && !pHasHindi) {
        // Want Hindi but item has no Hindi chars — check if it's truly English
        const englishChars = (p.match(/[A-Za-z]/g) || []).length;
        if (englishChars > 5) { hasWrongLangItem = true; break; }
      }
      if (lang === 'en' && pHasHindi) {
        // Want English but item has Hindi chars
        const hindiChars = (p.match(/[\u0900-\u097F]/g) || []).length;
        const englishChars = (p.match(/[A-Za-z]/g) || []).length;
        if (hindiChars > englishChars) { hasWrongLangItem = true; break; }
      }
    }

    // ★ If no wrong-language items found, simple path (with empty-item fallback)
    if (!hasWrongLangItem) {
      if (fallbackArr.length > 0) {
        const result = [];
        for (let i = 0; i < maxLen; i++) {
          const p = primaryArr[i] || '';
          const f = fallbackArr[i] || '';
          result.push((p && p.trim()) ? p : (f || p || ''));
        }
        return result;
      }
      return primaryArr.length > 0 ? primaryArr : fallbackArr;
    }

    // ★★★ SMART RESOLVE: per-item language detection
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      const p = (primaryArr[i] || '').trim();
      const f = (fallbackArr[i] || '').trim();

      // Both empty
      if (!p && !f) { result.push(''); continue; }
      // Only one exists
      if (!p) { result.push(f); continue; }
      if (!f) { result.push(p); continue; }

      // ★ Both exist — pick the one matching requested language
      const pHasHindi = HINDI_CHAR_RE.test(p);
      const fHasHindi = HINDI_CHAR_RE.test(f);

      if (lang === 'hi') {
        // We want Hindi text
        if (pHasHindi) {
          result.push(p);       // Primary IS Hindi ✓
        } else if (fHasHindi) {
          result.push(f);       // Fallback has Hindi (data was swapped) → use it
        } else {
          result.push(p);       // Neither has Hindi (code text like "A-i, B-ii") → keep as-is
        }
      } else {
        // We want English text
        if (!pHasHindi) {
          result.push(p);       // Primary IS English (no Hindi chars) ✓
        } else if (!fHasHindi) {
          result.push(f);       // Fallback is English → use it
        } else {
          // Both have Hindi — pick the one with MORE English
          const pEn = (p.match(/[A-Za-z]/g) || []).length;
          const fEn = (f.match(/[A-Za-z]/g) || []).length;
          result.push(fEn > pEn ? f : p);
        }
      }
    }

    return result;
  }

  return [];
};

/**
 * ★ SMART getChartLabels — with language awareness
 */
export const getChartLabels = (labelsData, lang = 'hi') => {
  if (!labelsData) return [];
  if (Array.isArray(labelsData)) return labelsData;
  if (typeof labelsData === 'object') {
    // Use getBilingualArray for language-aware resolution
    return getBilingualArray(labelsData, lang);
  }
  return [];
};

/**
 * getDatasetLabel — Safely extracts dataset label
 */
export const getDatasetLabel = (labelData, lang = 'hi', fallback = 'Series') => {
  if (!labelData) return fallback;
  if (typeof labelData === 'string') return labelData;
  if (typeof labelData === 'object') {
    return getBilingualText(labelData, lang) || fallback;
  }
  return fallback;
};

/**
 * getPieColors — Extracts colors from pie chart dataset
 */
export const getPieColors = (dataset, fallbackColors) => {
  if (!dataset) return fallbackColors;
  if (Array.isArray(dataset.colors) && dataset.colors.length > 0) {
    return dataset.colors;
  }
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