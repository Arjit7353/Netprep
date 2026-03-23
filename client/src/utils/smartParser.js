/**
 * Smart Parser - Unified Format Support
 * Detects question types from single unified JSON
 */

export const detectQuestionType = (q) => {
  if (q.type) return normalizeType(q.type);
  if (q.questionType) return normalizeType(q.questionType);
  if (q.assertion || q.assertionHi) return 'assertion_reason';
  if (q.listA?.length > 0 && q.listB?.length > 0) return 'match_following';
  if (q.items?.length > 0 && q.correctOrder) return 'sequence_order';
  if (q.statements?.length > 0 && q.correctStatements) return 'statement_based';
  if (q.passage || q.passageHi) return 'passage';
  if (q.tableData?.headers?.length > 0) return 'di_table';
  
  if (q.chartData?.datasets?.length > 0) {
    const ct = q.chartData?.chartType || q.chartData?.type;
    if (ct === 'pie') return 'di_pie_chart';
    if (ct === 'line') return 'di_line_graph';
    return 'di_bar_chart';
  }
  
  if (q.caseletText || q.caseletTextHi) return 'di_caselet';
  if (q.questions?.length > 0 && (q.passage || q.tableData || q.chartData || q.caseletText)) return 'passage';
  
  return 'mcq';
};

export const normalizeType = (type) => {
  const map = {
    'mcq': 'mcq', 'simple_mcq': 'mcq', 'multiple_choice': 'mcq',
    'assertion_reason': 'assertion_reason', 'assertion': 'assertion_reason', 'ar': 'assertion_reason', 'a-r': 'assertion_reason',
    'match_following': 'match_following', 'matching': 'match_following', 'match': 'match_following',
    'sequence_order': 'sequence_order', 'chronology': 'sequence_order', 'sequence': 'sequence_order', 'order': 'sequence_order',
    'statement_based': 'statement_based', 'multi_statement': 'statement_based', 'statements': 'statement_based', 'statement': 'statement_based',
    'passage': 'passage', 'passage_based': 'passage', 'comprehension': 'passage',
    'di_table': 'di_table', 'table': 'di_table',
    'di_bar_chart': 'di_bar_chart', 'bar_chart': 'di_bar_chart', 'bar': 'di_bar_chart',
    'di_pie_chart': 'di_pie_chart', 'pie_chart': 'di_pie_chart', 'pie': 'di_pie_chart',
    'di_line_graph': 'di_line_graph', 'line_graph': 'di_line_graph', 'line': 'di_line_graph',
    'di_caselet': 'di_caselet', 'caselet': 'di_caselet',
    'di_mixed': 'di_mixed', 'mixed': 'di_mixed'
  };
  return map[type?.toLowerCase()] || 'mcq';
};

export const detectLanguage = (data) => {
  const hindiPattern = /[\u0900-\u097F]/;
  if (data.language === 'hi' || data.language === 'en') return data.language;
  
  const questions = data.questions || data.questionTopicMap || [];
  const samples = [];
  
  for (const q of questions.slice(0, 10)) {
    if (q.question) samples.push(q.question);
    if (q.questionText) samples.push(q.questionText);
    if (q.assertion) samples.push(q.assertion);
    if (q.passage) samples.push(q.passage);
    if (q.caseletText) samples.push(q.caseletText);
    if (q.options?.length) samples.push(q.options[0]);
  }
  
  let hi = 0, en = 0;
  for (const s of samples) {
    if (typeof s !== 'string') continue;
    if (hindiPattern.test(s)) hi++; else en++;
  }
  
  return hi > en ? 'hi' : 'en';
};

export const parseJSONSummary = (jsonData) => {
  const questions = jsonData.questions || jsonData.questionTopicMap || [];
  const summary = {
    totalQuestions: questions.length,
    byType: {},
    withContent: 0,
    withoutContent: 0,
    language: detectLanguage(jsonData),
    paper: jsonData.paper || 'paper1',
    hasAnalysis: !!(jsonData.unitWeightage?.length || jsonData.topTopics?.length || jsonData.trends?.length),
    errors: [],
    warnings: []
  };

  questions.forEach((q, idx) => {
    const type = detectQuestionType(q);
    summary.byType[type] = (summary.byType[type] || 0) + 1;
    
    const hasContent = !!(q.question || q.questionText || q.assertion || q.passage || 
      q.tableData || q.chartData || q.caseletText || q.options?.length ||
      q.statements?.length || q.listA?.length || q.items?.length || q.questions?.length);
      
    if (hasContent) summary.withContent++;
    else summary.withoutContent++;

    // Validate
    if (['mcq', 'assertion_reason', 'match_following', 'sequence_order', 'statement_based'].includes(type)) {
      if (q.correct === undefined && q.correctAnswer === undefined) {
        summary.warnings.push(`Q${q.qNo || idx + 1}: missing correct answer`);
      }
    }
  });

  return summary;
};

export const validateJSON = (jsonInput) => {
  const result = { isValid: true, data: null, errors: [], warnings: [], summary: null };
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
  
  // Must have questions
  const questions = jsonData.questions || jsonData.questionTopicMap;
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    result.isValid = false;
    result.errors.push('Missing "questions" array');
    return result;
  }
  
  // For PYQ format, need year + session + paper
  if (jsonData.year && jsonData.session) {
    if (!/^\d{4}$/.test(String(jsonData.year))) {
      result.errors.push('Invalid year format');
      result.isValid = false;
    }
  }
  
  if (jsonData.paper && !['paper1', 'paper2'].includes(jsonData.paper)) {
    result.errors.push('paper must be "paper1" or "paper2"');
    result.isValid = false;
  }
  
  result.summary = parseJSONSummary(jsonData);
  result.warnings = [...result.warnings, ...result.summary.warnings];
  
  return result;
};

export const formatJSON = (json) => {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return JSON.stringify(data, null, 2);
  } catch {
    return typeof json === 'string' ? json : JSON.stringify(json);
  }
};

export default { 
  detectQuestionType, 
  normalizeType, 
  detectLanguage, 
  parseJSONSummary, 
  validateJSON, 
  formatJSON 
};