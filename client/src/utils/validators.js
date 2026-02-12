/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate question data
 * @param {Object} question - Question object
 * @returns {Object} Validation result
 */
export const validateQuestion = (question) => {
  const errors = [];
  
  // Required fields
  if (!question.questionType) {
    errors.push('Question type is required');
  }
  
  if (!question.paper) {
    errors.push('Paper selection is required');
  }
  
  if (!question.unit) {
    errors.push('Unit is required');
  }
  
  if (question.correctAnswer === undefined || question.correctAnswer === null) {
    errors.push('Correct answer is required');
  }
  
  // Type-specific validation
  const type = question.questionType;
  
  if (type === 'mcq') {
    if (!question.question?.hi && !question.question?.en) {
      errors.push('Question text is required');
    }
    if (!question.options?.hi?.length && !question.options?.en?.length) {
      errors.push('Options are required');
    }
  }
  
  if (type === 'assertion_reason') {
    if (!question.assertionReasonData?.assertion?.hi && !question.assertionReasonData?.assertion?.en) {
      errors.push('Assertion is required');
    }
    if (!question.assertionReasonData?.reason?.hi && !question.assertionReasonData?.reason?.en) {
      errors.push('Reason is required');
    }
  }
  
  if (type === 'match_following') {
    if (!question.matchData?.listA?.hi?.length && !question.matchData?.listA?.en?.length) {
      errors.push('List A items are required');
    }
    if (!question.matchData?.listB?.hi?.length && !question.matchData?.listB?.en?.length) {
      errors.push('List B items are required');
    }
  }
  
  if (type === 'sequence_order') {
    if (!question.sequenceData?.items?.hi?.length && !question.sequenceData?.items?.en?.length) {
      errors.push('Sequence items are required');
    }
    if (!question.sequenceData?.correctOrder?.length) {
      errors.push('Correct order is required');
    }
  }
  
  if (type === 'statement_based') {
    if (!question.statementData?.statements?.hi?.length && !question.statementData?.statements?.en?.length) {
      errors.push('Statements are required');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate test data
 * @param {Object} test - Test object
 * @returns {Object} Validation result
 */
export const validateTest = (test) => {
  const errors = [];
  
  if (!test.title?.trim()) {
    errors.push('Test title is required');
  }
  
  if (!test.testType) {
    errors.push('Test type is required');
  }
  
  if (!test.totalQuestions || test.totalQuestions < 1) {
    errors.push('Number of questions must be at least 1');
  }
  
  if (!test.duration || test.duration < 1) {
    errors.push('Duration must be at least 1 minute');
  }
  
  if (!test.questions?.length && !test.randomConfig?.enabled) {
    errors.push('Questions are required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate JSON import data
 * @param {Object} jsonData - JSON data to validate
 * @returns {Object} Validation result
 */
export const validateJSONImport = (jsonData) => {
  const errors = [];
  const warnings = [];
  
  // Check if questions array exists
  if (!jsonData.questions) {
    errors.push('Missing "questions" array');
  } else if (!Array.isArray(jsonData.questions)) {
    errors.push('"questions" must be an array');
  } else if (jsonData.questions.length === 0) {
    errors.push('"questions" array is empty');
  }
  
  // Check language
  const language = jsonData.language || jsonData.defaultMeta?.language;
  if (!language) {
    warnings.push('No language specified, defaulting to "hi" (Hindi)');
  } else if (!['hi', 'en'].includes(language)) {
    errors.push('Invalid language. Must be "hi" or "en"');
  }
  
  // Check paper
  const paper = jsonData.paper || jsonData.defaultMeta?.paper;
  if (!paper) {
    warnings.push('No paper specified, defaulting to "paper1"');
  } else if (!['paper1', 'paper2'].includes(paper)) {
    errors.push('Invalid paper. Must be "paper1" or "paper2"');
  }
  
  // Validate each question
  if (jsonData.questions && Array.isArray(jsonData.questions)) {
    jsonData.questions.forEach((q, index) => {
      // Check for correct answer
      if (q.correct === undefined && q.correctAnswer === undefined) {
        if (!q.diData && !q.passage) {
          warnings.push(`Question ${index + 1}: Missing correct answer`);
        }
      }
      
      // Check for options
      if (!q.diData && !q.passage && !q.options) {
        if (!q.assertion && !q.listA && !q.items && !q.statements) {
          warnings.push(`Question ${index + 1}: Missing options`);
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength level
 */
export const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength = 'weak';
  if (passedChecks >= 4) strength = 'strong';
  else if (passedChecks >= 3) strength = 'medium';
  
  return {
    isValid: passedChecks >= 3,
    strength,
    checks
  };
};

/**
 * Sanitize HTML string
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+on\w+="[^"]*"/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .trim();
};

/**
 * Check if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};