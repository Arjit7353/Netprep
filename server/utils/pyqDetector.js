/**
 * ═══════════════════════════════════════════════════════════════
 * PYQ Auto-Detector Utility
 * Intelligently detects and routes PYQ data for automatic import
 * Supports multi-year data, flexible metadata formats
 * ═══════════════════════════════════════════════════════════════
 */

const YEAR_PATTERNS = /(\d{4})/;
const SESSION_PATTERNS = {
  june: /june|jun|जून/i,
  december: /december|dec|दिसंबर/i,
  mixed: /mixed|both|both years|दोनों/i
};

const SHIFT_PATTERNS = {
  shift1: /1st|first|morning|1|shift.1|shift-1|shift 1/i,
  shift2: /2nd|second|evening|afternoon|2|shift.2|shift-2|shift 2/i,
  none: /none|na|n\/a|single|only|no|-/i
};

const PAPER_PATTERNS = {
  paper1: /paper.1|paper1|p1|general|teaching|general awareness/i,
  paper2: /paper.2|paper2|p2|history|research|reasoning/i
};

// ═══════════════════════════════════════════════════════════════
// CORE: Detect if JSON contains PYQ data
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze JSON structure to determine if it's PYQ data
 * @param {Object} data - Import JSON data
 * @returns {Object} Detection result with confidence score and reasons
 */
function detectPYQData(data) {
  if (!data || typeof data !== 'object') {
    return { isPYQ: false, confidence: 0, reasons: ['No data provided'], type: 'unknown' };
  }

  const reasons = [];
  let pyqIndicators = 0;
  let totalChecks = 0;

  // ── Check 1: Has year field (HIGH PRIORITY) ──
  totalChecks++;
  if (data.year !== undefined && data.year !== null) {
    const yearVal = extractYear(data.year);
    if (yearVal && yearVal >= 2000 && yearVal <= new Date().getFullYear() + 5) {
      pyqIndicators++;
      reasons.push(`✓ Valid year detected: ${yearVal}`);
    } else if (data.year) {
      reasons.push(`✗ Invalid or unusual year: ${data.year}`);
    }
  }

  // ── Check 2: Has session field (HIGH PRIORITY) ──
  totalChecks++;
  if (data.session !== undefined && data.session !== null) {
    const normalized = normalizeSession(data.session);
    if (['june', 'december', 'mixed'].includes(normalized)) {
      pyqIndicators++;
      reasons.push(`✓ Valid session detected: ${normalized}`);
    } else {
      reasons.push(`✗ Session field present but unclear: "${data.session}"`);
    }
  }

  // ── Check 3: Has shift field (MEDIUM PRIORITY) ──
  totalChecks++;
  if (data.shift !== undefined && data.shift !== null) {
    const normalized = normalizeShift(data.shift);
    if (['shift1', 'shift2', 'none'].includes(normalized)) {
      pyqIndicators++;
      reasons.push(`✓ Valid shift detected: ${normalized}`);
    }
  }

  // ── Check 4: Has paper field with specific values ──
  totalChecks++;
  if (data.paper !== undefined && data.paper !== null) {
    const v = String(data.paper).toLowerCase();
    if (v.includes('paper') || v === 'p1' || v === 'p2' || v === '1' || v === '2') {
      pyqIndicators++;
      reasons.push(`✓ Paper specification: ${data.paper}`);
    }
  }

  // ── Check 5: Has source/exam field indicating previous year ──
  totalChecks++;
  const sourceStr = (data.source || data.exam || data.examName || '').toLowerCase();
  const sourceKeywords = ['pyq', 'previous', 'year', 'net', 'gate', 'ugc', 'exam', 'question bank'];
  if (sourceKeywords.some(kw => sourceStr.includes(kw))) {
    pyqIndicators++;
    reasons.push(`✓ PYQ source indicator: "${sourceStr}"`);
  }

  // ── Check 6: Question structure contains PYQ metadata ──
  totalChecks++;
  if (Array.isArray(data.questions) && data.questions.length > 0) {
    const firstQ = data.questions[0];
    if (firstQ && (firstQ.year || firstQ.session || firstQ.shift || firstQ.pyqYear)) {
      pyqIndicators++;
      reasons.push(`✓ Questions contain individual year/session/shift metadata`);
    }
  }

  // ── Check 7: Analysis or stats fields (specific to PYQ) ──
  totalChecks++;
  if (
    data.analysis ||
    data.stats ||
    data.topicsMapped ||
    data.unitWeightage ||
    data.questionTypeBreakdown ||
    data.conceptsTracked
  ) {
    pyqIndicators++;
    reasons.push(`✓ PYQ analysis metadata detected`);
  }

  // ── Check 8: Multi-year indicator ──
  totalChecks++;
  if (data.multiYear === true || data.multiYear === 'true') {
    pyqIndicators++;
    reasons.push(`✓ Explicit multi-year flag`);
  }

  // ── Check 9: Array of year/session combinations (batch import) ──
  totalChecks++;
  if (
    Array.isArray(data.yearSessions) ||
    Array.isArray(data.years) ||
    (Array.isArray(data.batches) && data.batches.some(b => b.year && b.session))
  ) {
    pyqIndicators++;
    reasons.push(`✓ Batch/multi-year structure detected`);
  }

  // ── Calculate confidence ──
  const confidence = totalChecks > 0 ? Math.round((pyqIndicators / totalChecks) * 100) : 0;
  const isPYQ = confidence >= 40; // 40% or higher = treat as PYQ

  // ── Determine type of PYQ import ──
  let type = 'single_year';
  if (data.multiYear === true || Array.isArray(data.batches)) {
    type = 'multi_year';
  }

  return {
    isPYQ,
    confidence,
    type,
    reasons,
    indicators: {
      hasYear: !!data.year,
      hasSession: !!data.session,
      hasShift: !!data.shift,
      hasPaper: !!data.paper,
      hasSource: !!sourceStr,
      hasQMetadata: Array.isArray(data.questions) && data.questions.some(q => q.year || q.session),
      hasAnalysis: !!(data.analysis || data.stats),
      hasMultiYear: data.multiYear === true,
      hasBatches: Array.isArray(data.batches)
    },
    extractedMetadata: {
      year: extractYear(data.year),
      session: normalizeSession(data.session),
      shift: normalizeShift(data.shift),
      paper: normalizePaper(data.paper)
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// MULTI-YEAR HANDLING: Split and process batch data
// ═══════════════════════════════════════════════════════════════

/**
 * Split multi-year JSON into individual year/session/shift documents
 * @param {Object} data - Import data (may contain multiple years)
 * @returns {Array} Array of individual PYQ documents to import
 */
function splitMultiYearData(data) {
  const batches = [];

  // ── Case 1: Explicit batches array ──
  if (Array.isArray(data.batches) && data.batches.length > 0) {
    return data.batches.map(batch => ({
      ...data,
      ...batch,
      questions: batch.questions || data.questions || []
    }));
  }

  // ── Case 2: Explicit yearSessions array ──
  if (Array.isArray(data.yearSessions) && data.yearSessions.length > 0) {
    return data.yearSessions.map(ys => ({
      ...data,
      year: ys.year || data.year,
      session: ys.session || data.session,
      shift: ys.shift || data.shift,
      questions: ys.questions || data.questions || []
    }));
  }

  // ── Case 3: Questions have individual year metadata ──
  if (Array.isArray(data.questions)) {
    const grouped = {};

    data.questions.forEach(q => {
      const qYear = extractYear(q.year || data.year);
      const qSession = normalizeSession(q.session || data.session || 'june');
      const qShift = normalizeShift(q.shift || data.shift || 'none');

      const key = `${qYear}|${qSession}|${qShift}`;

      if (!grouped[key]) {
        grouped[key] = {
          ...data,
          year: qYear,
          session: qSession,
          shift: qShift,
          questions: []
        };
      }

      grouped[key].questions.push(q);
    });

    return Object.values(grouped);
  }

  // ── Case 4: Single year/session/shift (already normalized) ──
  return [data];
}

// ═══════════════════════════════════════════════════════════════
// HELPERS: Normalization functions
// ═══════════════════════════════════════════════════════════════

function extractYear(yearValue) {
  if (!yearValue) return null;
  const match = String(yearValue).match(YEAR_PATTERNS);
  if (match) {
    const year = parseInt(match[1], 10);
    if (year >= 2000 && year <= new Date().getFullYear() + 5) {
      return year;
    }
  }
  return null;
}

function normalizeSession(session) {
  if (!session) return 'june';
  const s = String(session).toLowerCase().trim();

  for (const [key, pattern] of Object.entries(SESSION_PATTERNS)) {
    if (pattern.test(s)) return key;
  }

  return 'mixed'; // Default for unclear sessions
}

function normalizeShift(shift) {
  if (!shift) return 'none';
  const s = String(shift).toLowerCase().trim();

  for (const [key, pattern] of Object.entries(SHIFT_PATTERNS)) {
    if (pattern.test(s)) return key;
  }

  return 'none'; // Default for unclear shifts
}

function normalizePaper(paper) {
  if (!paper) return 'paper1';
  const p = String(paper).toLowerCase().trim();

  for (const [key, pattern] of Object.entries(PAPER_PATTERNS)) {
    if (pattern.test(p)) return key;
  }

  return 'paper1'; // Default
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION: Check if detected PYQ is valid for import
// ═══════════════════════════════════════════════════════════════

function validateDetectedPYQ(data, detection) {
  const errors = [];
  const warnings = [];

  if (!detection.isPYQ) {
    errors.push('Data does not appear to be PYQ data (low confidence)');
    if (detection.confidence < 40) {
      warnings.push(
        `Confidence score: ${detection.confidence}%. If you're sure this is PYQ data, set 'year', 'session', or 'shift' field explicitly.`
      );
    }
  }

  // Check required fields for PYQ
  if (!detection.extractedMetadata.year) {
    errors.push('Year is required for PYQ data. Please provide: data.year');
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('Questions array is required and must not be empty');
  }

  if (!detection.extractedMetadata.paper) {
    warnings.push('Paper not specified, defaulting to paper1');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Main detection
  detectPYQData,

  // Multi-year support
  splitMultiYearData,

  // Helpers
  extractYear,
  normalizeSession,
  normalizeShift,
  normalizePaper,

  // Validation
  validateDetectedPYQ
};
