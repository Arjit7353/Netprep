/**
 * Smart Parser Utility for Frontend
 * Detects question types and validates JSON structure
 */

// Question type detection patterns
const TYPE_PATTERNS = {
  assertion_reason: ['assertion', 'reason'],
  match_following: ['listA', 'listB'],
  sequence_order: ['items', 'correctOrder'],
  statement_based: ['statements', 'correctStatements'],
  passage_based: ['passage', 'passageContent'],
  di_table: ['tableData'],
  di_bar_chart: ['chartData', 'barChart'],
  di_pie_chart: ['pieChart'],
  di_line_graph: ['lineGraph'],
  di_mixed: ['mixedChart'],
  di_caselet: ['caseletText']
};

/**
 * Detect question type from question data
 * @param {Object} questionData - Raw question data
 * @returns {string} Detected question type
 */
export const detectQuestionType = (questionData) => {
  // If type is explicitly provided
  if (questionData.type) {
    return normalizeType(questionData.type);
  }

  if (questionData.questionType) {
    return normalizeType(questionData.questionType);
  }

  const keys = Object.keys(questionData);

  // Check for assertion-reason
  if (keys.includes('assertion') && keys.includes('reason')) {
    return 'assertion_reason';
  }

  // Check for match following
  if (keys.includes('listA') && keys.includes('listB')) {
    return 'match_following';
  }

  // Check for sequence order
  if (keys.includes('items') && keys.includes('correctOrder')) {
    return 'sequence_order';
  }

  // Check for statement based
  if (keys.includes('statements') && keys.includes('correctStatements')) {
    return 'statement_based';
  }

  // Check for passage based
  if (keys.includes('passage') || keys.includes('passageContent')) {
    return 'passage_based';
  }

  // Check for DI types
  if (questionData.diData) {
    const diData = questionData.diData;
    if (diData.tableData) return 'di_table';
    if (diData.chartData) {
      const chartType = diData.chartData.type || diData.diType;
      if (chartType === 'bar' || chartType === 'bar_chart') return 'di_bar_chart';
      if (chartType === 'pie' || chartType === 'pie_chart') return 'di_pie_chart';
      if (chartType === 'line' || chartType === 'line_graph') return 'di_line_graph';
      if (chartType === 'mixed') return 'di_mixed';
      return 'di_bar_chart';
    }
    if (diData.caseletText) return 'di_caselet';
  }

  // Check for standalone DI data
  if (keys.includes('tableData')) return 'di_table';
  if (keys.includes('caseletText')) return 'di_caselet';
  if (keys.includes('chartData')) {
    const chartType = questionData.chartData?.type;
    if (chartType === 'pie') return 'di_pie_chart';
    if (chartType === 'line') return 'di_line_graph';
    return 'di_bar_chart';
  }

  // Default to MCQ
  return 'mcq';
};

/**
 * Normalize question type string
 * @param {string} type - Raw type string
 * @returns {string} Normalized type
 */
export const normalizeType = (type) => {
  const typeMap = {
    'mcq': 'mcq',
    'multiple_choice': 'mcq',
    'multiplechoice': 'mcq',
    'assertion': 'assertion_reason',
    'assertion_reason': 'assertion_reason',
    'assertionreason': 'assertion_reason',
    'a-r': 'assertion_reason',
    'ar': 'assertion_reason',
    'match': 'match_following',
    'match_following': 'match_following',
    'matchfollowing': 'match_following',
    'matching': 'match_following',
    'sequence': 'sequence_order',
    'sequence_order': 'sequence_order',
    'sequenceorder': 'sequence_order',
    'chronological': 'sequence_order',
    'order': 'sequence_order',
    'statement': 'statement_based',
    'statement_based': 'statement_based',
    'statementbased': 'statement_based',
    'statements': 'statement_based',
    'passage': 'passage_based',
    'passage_based': 'passage_based',
    'passagebased': 'passage_based',
    'comprehension': 'passage_based',
    'di_table': 'di_table',
    'table': 'di_table',
    'ditable': 'di_table',
    'di_bar': 'di_bar_chart',
    'di_bar_chart': 'di_bar_chart',
    'bar': 'di_bar_chart',
    'barchart': 'di_bar_chart',
    'di_pie': 'di_pie_chart',
    'di_pie_chart': 'di_pie_chart',
    'pie': 'di_pie_chart',
    'piechart': 'di_pie_chart',
    'di_line': 'di_line_graph',
    'di_line_graph': 'di_line_graph',
    'line': 'di_line_graph',
    'linegraph': 'di_line_graph',
    'di_mixed': 'di_mixed',
    'mixed': 'di_mixed',
    'di_caselet': 'di_caselet',
    'caselet': 'di_caselet'
  };

  return typeMap[type?.toLowerCase()] || 'mcq';
};

/**
 * Parse JSON and extract question summary
 * @param {Object} jsonData - JSON data to parse
 * @returns {Object} Parsed summary
 */
export const parseJSONSummary = (jsonData) => {
  const summary = {
    totalQuestions: 0,
    byType: {},
    passages: 0,
    diSets: 0,
    language: jsonData.language || jsonData.defaultMeta?.language || 'hi',
    paper: jsonData.paper || jsonData.defaultMeta?.paper || 'paper1',
    errors: [],
    warnings: []
  };

  if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
    summary.errors.push('No questions array found');
    return summary;
  }

  summary.totalQuestions = jsonData.questions.length;

  jsonData.questions.forEach((q, index) => {
    const type = detectQuestionType(q);
    summary.byType[type] = (summary.byType[type] || 0) + 1;

    // Count passages and DI sets
    if (type === 'passage_based' && q.passage) {
      summary.passages++;
    }
    if (type.startsWith('di_') && q.diData) {
      summary.diSets++;
    }

    // Check for potential issues
    if (q.correct === undefined && q.correctAnswer === undefined) {
      if (!q.diData?.questions && !q.passage?.questions) {
        summary.warnings.push(`Question ${index + 1}: Missing correct answer`);
      }
    }
  });

  return summary;
};

/**
 * Validate JSON structure
 * @param {string|Object} jsonInput - JSON string or object
 * @returns {Object} Validation result
 */
export const validateJSON = (jsonInput) => {
  const result = {
    isValid: true,
    data: null,
    errors: [],
    warnings: [],
    summary: null
  };

  // Parse if string
  let jsonData;
  if (typeof jsonInput === 'string') {
    try {
      jsonData = JSON.parse(jsonInput);
    } catch (err) {
      result.isValid = false;
      result.errors.push(`Invalid JSON: ${err.message}`);
      return result;
    }
  } else {
    jsonData = jsonInput;
  }

  result.data = jsonData;

  // Check for questions array
  if (!jsonData.questions) {
    result.isValid = false;
    result.errors.push('Missing "questions" array');
    return result;
  }

  if (!Array.isArray(jsonData.questions)) {
    result.isValid = false;
    result.errors.push('"questions" must be an array');
    return result;
  }

  if (jsonData.questions.length === 0) {
    result.isValid = false;
    result.errors.push('"questions" array is empty');
    return result;
  }

  // Check language
  const language = jsonData.language || jsonData.defaultMeta?.language;
  if (!language) {
    result.warnings.push('No language specified, defaulting to "hi" (Hindi)');
  } else if (!['hi', 'en'].includes(language)) {
    result.errors.push('Invalid language. Must be "hi" or "en"');
    result.isValid = false;
  }

  // Check paper
  const paper = jsonData.paper || jsonData.defaultMeta?.paper;
  if (!paper) {
    result.warnings.push('No paper specified, defaulting to "paper1"');
  } else if (!['paper1', 'paper2'].includes(paper)) {
    result.errors.push('Invalid paper. Must be "paper1" or "paper2"');
    result.isValid = false;
  }

  // Get summary
  result.summary = parseJSONSummary(jsonData);
  result.warnings = [...result.warnings, ...result.summary.warnings];

  return result;
};

/**
 * Format JSON string with proper indentation
 * @param {string|Object} json - JSON to format
 * @returns {string} Formatted JSON string
 */
export const formatJSON = (json) => {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(data, null, 2);
  } catch (err) {
    return typeof json === 'string' ? json : JSON.stringify(json);
  }
};

export default {
  detectQuestionType,
  normalizeType,
  parseJSONSummary,
  validateJSON,
  formatJSON
};