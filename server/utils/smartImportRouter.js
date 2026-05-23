/**
 * ═══════════════════════════════════════════════════════════════
 * Smart Import Helper
 * Unified entry point for intelligent question/PYQ import routing
 * Handles auto-detection, multi-year, and fallback strategies
 * ═══════════════════════════════════════════════════════════════
 */

const pyqDetector = require('./pyqDetector');

/**
 * Main smart import router
 * Determines if data is PYQ or regular questions and routes accordingly
 * @param {Object} data - Import JSON data
 * @param {Object} options - Import options (skipDuplicates, translateEnabled, etc.)
 * @returns {Promise<Object>} Result with routing decision and processed data
 */
async function smartImportRoute(data, options = {}) {
  try {
    // Step 1: Detect if this is PYQ data
    const detection = pyqDetector.detectPYQData(data);

    console.log('[Smart Import] Detection result:', {
      isPYQ: detection.isPYQ,
      confidence: detection.confidence,
      type: detection.type,
      reasons: detection.reasons.slice(0, 3) // First 3 reasons
    });

    // Step 2: If detected as PYQ, validate and prepare for PYQ import
    if (detection.isPYQ && detection.confidence >= 40) {
      console.log('[Smart Import] → Routing to PYQ import (confidence: ' + detection.confidence + '%)');

      // Validate PYQ data
      const validation = pyqDetector.validateDetectedPYQ(data, detection);
      if (!validation.isValid) {
        console.error('[Smart Import] PYQ validation failed:', validation.errors);
        return {
          success: false,
          route: 'pyq',
          reason: 'PYQ validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
          detection
        };
      }

      // Handle multi-year data
      if (detection.type === 'multi_year') {
        console.log('[Smart Import] Multi-year PYQ data detected, preparing batch import');
        const batches = pyqDetector.splitMultiYearData(data);
        console.log(`[Smart Import] Split into ${batches.length} batch(es)`);

        return {
          success: true,
          route: 'pyq',
          isBatch: true,
          batches,
          detection,
          options: { ...options, translateEnabled: options.translateEnabled !== false }
        };
      }

      // Single-year PYQ import
      return {
        success: true,
        route: 'pyq',
        isBatch: false,
        data: normalizePYQData(data, detection),
        detection,
        options: { ...options, translateEnabled: options.translateEnabled !== false }
      };
    }

    // Step 3: Route to regular question import (confidence < 40 or not PYQ)
    console.log('[Smart Import] → Routing to regular question import');

    // Apply question-specific normalizations
    const normalizedQuestions = normalizeQuestionData(data);

    return {
      success: true,
      route: 'questions',
      data: normalizedQuestions,
      detection,
      options: { ...options, skipDuplicates: options.skipDuplicates !== false }
    };
  } catch (error) {
    console.error('[Smart Import] Error:', error.message);
    return {
      success: false,
      error: error.message,
      detection: null
    };
  }
}

/**
 * Normalize detected PYQ data for import
 * @param {Object} data - Raw import data
 * @param {Object} detection - Detection result from pyqDetector
 * @returns {Object} Normalized PYQ data ready for PYQ controller
 */
function normalizePYQData(data, detection) {
  const normalized = {
    ...data,
    year: detection.extractedMetadata.year,
    session: detection.extractedMetadata.session,
    shift: detection.extractedMetadata.shift,
    paper: detection.extractedMetadata.paper,

    // Ensure questions array exists
    questions: Array.isArray(data.questions)
      ? data.questions
      : Array.isArray(data.questionTopicMap)
        ? data.questionTopicMap
        : []
  };

  // Remove duplicate metadata fields
  delete normalized._skipDuplicates;

  return normalized;
}

/**
 * Normalize regular question data
 * @param {Object} data - Raw import data
 * @returns {Object} Normalized question data
 */
function normalizeQuestionData(data) {
  return {
    ...data,
    _skipDuplicates: data._skipDuplicates === true || data.skipDuplicates === true
  };
}

/**
 * Batch import handler for multi-year PYQ data
 * @param {Array} batches - Array of individual year/session/shift documents
 * @param {Function} importPYQFunction - Function to import single PYQ (from controller)
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Batch import result with all outcomes
 */
async function batchImportPYQ(batches, importPYQFunction, options = {}) {
  const results = {
    success: true,
    total: batches.length,
    successful: 0,
    failed: 0,
    outcomes: []
  };

  for (const [index, batch] of batches.entries()) {
    try {
      console.log(`[Batch Import] Processing batch ${index + 1}/${batches.length}: ${batch.year} ${batch.session}`);

      const result = await importPYQFunction(batch, options);

      if (result.success) {
        results.successful++;
        results.outcomes.push({
          batch: index + 1,
          year: batch.year,
          session: batch.session,
          shift: batch.shift,
          status: 'success',
          data: result.data
        });
        console.log(`[Batch Import] ✓ Batch ${index + 1} succeeded`);
      } else {
        results.failed++;
        results.outcomes.push({
          batch: index + 1,
          year: batch.year,
          session: batch.session,
          shift: batch.shift,
          status: 'failed',
          error: result.error || result.message
        });
        console.log(`[Batch Import] ✗ Batch ${index + 1} failed:`, result.error || result.message);
      }
    } catch (error) {
      results.failed++;
      results.outcomes.push({
        batch: index + 1,
        year: batch.year,
        session: batch.session,
        shift: batch.shift,
        status: 'failed',
        error: error.message
      });
      console.error(`[Batch Import] ✗ Batch ${index + 1} error:`, error.message);
    }
  }

  results.success = results.failed === 0;

  return results;
}

/**
 * Generate human-readable import summary
 * @param {Object} routeResult - Result from smartImportRoute
 * @returns {String} Summary text
 */
function generateImportSummary(routeResult) {
  if (!routeResult.success) {
    return `Import routing failed: ${routeResult.reason || routeResult.error}`;
  }

  const route = routeResult.route;
  const confidence =
    routeResult.detection && routeResult.detection.confidence
      ? `(${routeResult.detection.confidence}% confidence)`
      : '';

  if (routeResult.isBatch) {
    return `Detected multi-year PYQ data ${confidence}. Preparing to import ${routeResult.batches.length} year/session combinations.`;
  }

  if (route === 'pyq') {
    return `Detected PYQ data ${confidence}. Year: ${routeResult.data.year}, Session: ${routeResult.data.session}, Shift: ${routeResult.data.shift}`;
  }

  return `Routing to regular question import. Questions: ${routeResult.data.questions?.length || 0}`;
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = {
  smartImportRoute,
  batchImportPYQ,
  normalizePYQData,
  normalizeQuestionData,
  generateImportSummary
};
