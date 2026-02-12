const { AppError } = require('./errorHandler');

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  return objectIdRegex.test(id);
};

// Validate ObjectId middleware
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !isValidObjectId(id)) {
      return next(new AppError(`Invalid ${paramName}: ${id}`, 400));
    }
    
    next();
  };
};

// Validate required fields middleware
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of fields) {
      if (field.includes('.')) {
        // Handle nested fields
        const parts = field.split('.');
        let value = req.body;
        for (const part of parts) {
          value = value?.[part];
        }
        if (value === undefined || value === null || value === '') {
          missingFields.push(field);
        }
      } else {
        if (
          req.body[field] === undefined ||
          req.body[field] === null ||
          req.body[field] === ''
        ) {
          missingFields.push(field);
        }
      }
    }
    
    if (missingFields.length > 0) {
      return next(
        new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400)
      );
    }
    
    next();
  };
};

// Validate enum values middleware
const validateEnum = (field, allowedValues) => {
  return (req, res, next) => {
    const value = req.body[field];
    
    if (value && !allowedValues.includes(value)) {
      return next(
        new AppError(
          `Invalid value for ${field}. Allowed values: ${allowedValues.join(', ')}`,
          400
        )
      );
    }
    
    next();
  };
};

// Validate array field middleware
const validateArray = (field, options = {}) => {
  const { minLength = 0, maxLength = Infinity, required = false } = options;
  
  return (req, res, next) => {
    const value = req.body[field];
    
    if (required && (!value || !Array.isArray(value))) {
      return next(new AppError(`${field} must be an array`, 400));
    }
    
    if (value && Array.isArray(value)) {
      if (value.length < minLength) {
        return next(
          new AppError(`${field} must have at least ${minLength} items`, 400)
        );
      }
      if (value.length > maxLength) {
        return next(
          new AppError(`${field} can have at most ${maxLength} items`, 400)
        );
      }
    }
    
    next();
  };
};

// Validate number range middleware
const validateNumberRange = (field, options = {}) => {
  const { min = -Infinity, max = Infinity, required = false } = options;
  
  return (req, res, next) => {
    const value = req.body[field];
    
    if (required && (value === undefined || value === null)) {
      return next(new AppError(`${field} is required`, 400));
    }
    
    if (value !== undefined && value !== null) {
      const num = Number(value);
      
      if (isNaN(num)) {
        return next(new AppError(`${field} must be a number`, 400));
      }
      
      if (num < min || num > max) {
        return next(
          new AppError(`${field} must be between ${min} and ${max}`, 400)
        );
      }
    }
    
    next();
  };
};

// Validate question type middleware
const validateQuestionType = (req, res, next) => {
  const { questionType } = req.body;
  
  const validTypes = [
    'mcq',
    'assertion_reason',
    'match_following',
    'sequence_order',
    'statement_based',
    'passage_based',
    'di_table',
    'di_bar_chart',
    'di_pie_chart',
    'di_line_graph',
    'di_mixed',
    'di_caselet'
  ];
  
  if (questionType && !validTypes.includes(questionType)) {
    return next(
      new AppError(
        `Invalid question type: ${questionType}. Valid types: ${validTypes.join(', ')}`,
        400
      )
    );
  }
  
  next();
};

// Validate test type middleware
const validateTestType = (req, res, next) => {
  const { testType } = req.body;
  
  const validTypes = [
    'dpp',
    'topic_test',
    'chapter_test',
    'unit_test',
    'pyq_year',
    'practice',
    'full_mock_p1',
    'full_mock_p2',
    'full_mock_combined'
  ];
  
  if (testType && !validTypes.includes(testType)) {
    return next(
      new AppError(
        `Invalid test type: ${testType}. Valid types: ${validTypes.join(', ')}`,
        400
      )
    );
  }
  
  next();
};

// Validate paper middleware
const validatePaper = (req, res, next) => {
  const { paper } = req.body;
  
  const validPapers = ['paper1', 'paper2', 'combined'];
  
  if (paper && !validPapers.includes(paper)) {
    return next(
      new AppError(
        `Invalid paper: ${paper}. Valid papers: ${validPapers.join(', ')}`,
        400
      )
    );
  }
  
  next();
};

// Validate difficulty middleware
const validateDifficulty = (req, res, next) => {
  const { difficulty } = req.body;
  
  const validDifficulties = ['easy', 'medium', 'hard'];
  
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return next(
      new AppError(
        `Invalid difficulty: ${difficulty}. Valid difficulties: ${validDifficulties.join(', ')}`,
        400
      )
    );
  }
  
  next();
};

// Sanitize request body (remove undefined and null values)
const sanitizeBody = (req, res, next) => {
  const sanitize = (obj) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          sanitized[key] = sanitize(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  };
  
  req.body = sanitize(req.body);
  next();
};

// Validate JSON import structure
const validateJSONImport = (req, res, next) => {
  const { questions, importType, language } = req.body;
  
  if (!questions || !Array.isArray(questions)) {
    return next(new AppError('questions must be an array', 400));
  }
  
  if (questions.length === 0) {
    return next(new AppError('questions array cannot be empty', 400));
  }
  
  if (language && !['hi', 'en'].includes(language)) {
    return next(new AppError('language must be either "hi" or "en"', 400));
  }
  
  next();
};

module.exports = {
  isValidObjectId,
  validateObjectId,
  validateRequiredFields,
  validateEnum,
  validateArray,
  validateNumberRange,
  validateQuestionType,
  validateTestType,
  validatePaper,
  validateDifficulty,
  sanitizeBody,
  validateJSONImport
};