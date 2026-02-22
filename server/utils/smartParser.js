// server/utils/smartParser.js
const translateHelper = require('./translateHelper');

class SmartParser {
  constructor() {
    this.typePatterns = {
      assertion_reason: ['assertion', 'reason'],
      match_following: ['listA', 'listB'],
      sequence_order: ['items', 'correctOrder'],
      statement_based: ['statements', 'correctStatements'],
      passage_based: ['passage', 'passageId'],
      di_table: ['tableData'],
      di_bar_chart: ['chartData', 'barChart'],
      di_pie_chart: ['pieChart'],
      di_line_graph: ['lineGraph'],
      di_mixed: ['mixedChart'],
      di_caselet: ['caseletText']
    };
  }

  // ================================================================
  // 🔧 FIX: NORMALIZATION HELPERS
  // ================================================================

  normalizePaper(value) {
    if (!value) return 'paper1';
    const v = String(value).toLowerCase().trim();
    // Direct matches
    if (v === 'paper1' || v === 'p1' || v === '1') return 'paper1';
    if (v === 'paper2' || v === 'p2' || v === '2') return 'paper2';
    // Subject-based detection
    if (v.includes('history') || v.includes('इतिहास') || v.includes('paper 2') || v.includes('paper-2')) return 'paper2';
    if (v.includes('general') || v.includes('teaching') || v.includes('research') || v.includes('सामान्य') || v.includes('paper 1') || v.includes('paper-1')) return 'paper1';
    // Already valid
    if (v === 'paper1' || v === 'paper2') return v;
    return 'paper1';
  }

  normalizeDifficulty(value) {
    if (!value) return 'medium';
    const v = String(value).toLowerCase().trim();
    // Direct matches
    if (v === 'easy' || v === 'सरल' || v === 'simple' || v === 'basic') return 'easy';
    if (v === 'hard' || v === 'कठिन' || v === 'difficult' || v === 'tough' || v === 'advanced') return 'hard';
    if (v === 'medium' || v === 'मध्यम' || v === 'moderate' || v === 'normal' || v === 'average') return 'medium';
    // Compound values like "medium to hard", "easy-medium", etc.
    if (v.includes('hard') && v.includes('easy')) return 'medium';
    if (v.includes('hard')) return 'hard';
    if (v.includes('easy')) return 'easy';
    if (v.includes('medium') || v.includes('moderate')) return 'medium';
    return 'medium';
  }

  safeInt(value, fallback = 0) {
    if (value === null || value === undefined) return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  // ================================================================
  // TYPE DETECTION
  // ================================================================

  detectQuestionType(questionData) {
    if (questionData.type) return this.normalizeType(questionData.type);
    if (questionData.questionType) return this.normalizeType(questionData.questionType);

    const keys = Object.keys(questionData);

    if (keys.includes('assertion') && keys.includes('reason')) return 'assertion_reason';
    if (keys.includes('listA') && keys.includes('listB')) return 'match_following';
    if (keys.includes('items') && keys.includes('correctOrder')) return 'sequence_order';
    if (keys.includes('statements') && keys.includes('correctStatements')) return 'statement_based';
    if (keys.includes('passage') || keys.includes('passageContent')) return 'passage_based';

    if (questionData.diData) {
      const diData = questionData.diData;
      if (diData.tableData) return 'di_table';
      if (diData.caseletText) return 'di_caselet';
      if (diData.chartData) {
        const chartType = diData.chartData.type || diData.diType || '';
        if (chartType === 'pie' || chartType === 'pie_chart') return 'di_pie_chart';
        if (chartType === 'line' || chartType === 'line_graph') return 'di_line_graph';
        if (chartType === 'mixed') return 'di_mixed';
        return 'di_bar_chart';
      }
    }

    if (keys.includes('tableData')) return 'di_table';
    if (keys.includes('caseletText')) return 'di_caselet';
    if (keys.includes('chartData')) {
      const chartType = questionData.chartData?.type || '';
      if (chartType === 'pie') return 'di_pie_chart';
      if (chartType === 'line') return 'di_line_graph';
      return 'di_bar_chart';
    }

    return 'mcq';
  }

  normalizeType(type) {
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
  }

  // ================================================================
  // MAIN PARSE FUNCTION
  // ================================================================

  async parseJSONImport(jsonData) {
    const results = {
      success: [],
      errors: [],
      passages: [],
      diDataItems: [],
      questions: [],
      stats: {
        total: 0,
        successful: 0,
        failed: 0,
        byType: {}
      }
    };

    const sourceLanguage = jsonData.language || jsonData.defaultMeta?.language || 'hi';
    const targetLanguage = sourceLanguage === 'hi' ? 'en' : 'hi';

    // 🔧 FIX: Normalize paper and difficulty at top level
    const defaultMeta = {
      paper: this.normalizePaper(jsonData.paper || jsonData.defaultMeta?.paper),
      unit: jsonData.unit || jsonData.defaultMeta?.unit || '',
      chapter: jsonData.chapter || jsonData.defaultMeta?.chapter || '',
      topic: jsonData.topic || jsonData.defaultMeta?.topic || '',
      difficulty: this.normalizeDifficulty(jsonData.difficulty || jsonData.defaultMeta?.difficulty),
      source: jsonData.source || jsonData.defaultMeta?.source || '',
      year: jsonData.year || jsonData.defaultMeta?.year || ''
    };

    const questions = jsonData.questions || [];
    results.stats.total = questions.length;

    console.log(`[SmartParser] Processing ${questions.length} questions, lang: ${sourceLanguage}, paper: ${defaultMeta.paper}, difficulty: ${defaultMeta.difficulty}`);

    const allTexts = [];
    const textRegistry = [];
    const parsedStructures = [];

    // STEP 1: Collect all texts from all questions
    for (let i = 0; i < questions.length; i++) {
      try {
        const rawQuestion = questions[i];
        const structure = this.collectTexts(
          rawQuestion, defaultMeta, sourceLanguage, i, allTexts, textRegistry
        );
        parsedStructures.push({ index: i, structure, error: null });
      } catch (error) {
        console.error(`[SmartParser] Collect error at index ${i}:`, error.message);
        parsedStructures.push({ index: i, structure: null, error: error.message });
        results.stats.failed++;
      }
    }

    console.log(`[SmartParser] Collected ${allTexts.length} texts for translation`);

    // STEP 2: Batch translate all texts at once
    let translations = [...allTexts];
    if (allTexts.length > 0) {
      try {
        translations = await translateHelper.translateBatch(
          allTexts, sourceLanguage, targetLanguage
        );
        console.log(`[SmartParser] Translation done: ${translations.length} texts`);
      } catch (err) {
        console.error('[SmartParser] Translation batch failed:', err.message);
        translations = [...allTexts];
      }
    }

    // STEP 3: Apply translations and build final objects
    for (const item of parsedStructures) {
      if (item.error) {
        results.errors.push({ index: item.index, error: item.error });
        continue;
      }

      try {
        const { type, data } = item.structure;

        this.applyTranslations(
          data, textRegistry, translations,
          sourceLanguage, targetLanguage, item.index
        );

        if (type === 'single') {
          const q = this.cleanQuestion(data);
          results.questions.push(q);
          results.success.push({ index: item.index, type: q.questionType });
          results.stats.byType[q.questionType] =
            (results.stats.byType[q.questionType] || 0) + 1;

        } else if (type === 'passage') {
          const groupId = `passage_${item.index}_${Date.now()}`;

          const passageObj = this.cleanPassage(data.passage);
          passageObj._groupId = groupId;
          results.passages.push(passageObj);

          for (const q of data.questions) {
            const cleanQ = this.cleanQuestion(q);
            cleanQ._passageGroupId = groupId;
            results.questions.push(cleanQ);
          }

          results.success.push({
            index: item.index,
            type: 'passage_based',
            questionCount: data.questions.length
          });
          results.stats.byType['passage_based'] =
            (results.stats.byType['passage_based'] || 0) + 1;

        } else if (type === 'di') {
          const groupId = `di_${item.index}_${Date.now()}`;

          const diObj = this.cleanDIData(data.diData);
          diObj._groupId = groupId;
          results.diDataItems.push(diObj);

          for (const q of data.questions) {
            const cleanQ = this.cleanQuestion(q);
            cleanQ._diGroupId = groupId;
            results.questions.push(cleanQ);
          }

          results.success.push({
            index: item.index,
            type: data.diData.diType,
            questionCount: data.questions.length
          });
          const diTypeKey = `di_${data.diData.diType}`;
          results.stats.byType[diTypeKey] =
            (results.stats.byType[diTypeKey] || 0) + 1;
        }

        results.stats.successful++;

      } catch (error) {
        console.error(`[SmartParser] Apply error at index ${item.index}:`, error.message);
        results.errors.push({ index: item.index, error: error.message });
        results.stats.failed++;
      }
    }

    console.log(
      `[SmartParser] Done: ${results.questions.length} Q, ` +
      `${results.passages.length} P, ${results.diDataItems.length} DI`
    );

    return results;
  }

  // ================================================================
  // CLEAN HELPERS
  // ================================================================

  cleanQuestion(q) {
    const clean = { ...q };
    delete clean._idx;
    delete clean._src;
    return clean;
  }

  cleanPassage(p) {
    const clean = { ...p };
    delete clean._idx;
    delete clean._src;
    return clean;
  }

  cleanDIData(d) {
    const clean = { ...d };
    delete clean._idx;
    delete clean._src;
    return clean;
  }

  // ================================================================
  // COLLECT TEXTS (Build registry for batch translation)
  // ================================================================

  collectTexts(rawQuestion, defaultMeta, sourceLanguage, questionIndex, allTexts, registry) {
    const questionType = this.detectQuestionType(rawQuestion);

    // 🔧 FIX: Normalize paper and difficulty for each question
    const baseMeta = {
      paper: rawQuestion.paper
        ? this.normalizePaper(rawQuestion.paper)
        : defaultMeta.paper,
      unit: rawQuestion.unit || defaultMeta.unit || '',
      chapter: rawQuestion.chapter || defaultMeta.chapter || '',
      topic: rawQuestion.topic || defaultMeta.topic || '',
      subtopic: rawQuestion.subtopic || defaultMeta.subtopic || '',
      difficulty: rawQuestion.difficulty
        ? this.normalizeDifficulty(rawQuestion.difficulty)
        : defaultMeta.difficulty,
      source: rawQuestion.source || defaultMeta.source || '',
      year: rawQuestion.year || defaultMeta.year || '',
      tags: rawQuestion.tags || defaultMeta.tags || []
    };

    const registerText = (text, path) => {
      if (text && typeof text === 'string' && text.trim()) {
        const idx = allTexts.length;
        allTexts.push(text.trim());
        registry.push({ questionIndex, path, textIndex: idx });
        return idx;
      }
      return -1;
    };

    const registerArray = (arr, pathPrefix) => {
      const indices = [];
      if (arr && Array.isArray(arr)) {
        arr.forEach((item, i) => {
          if (typeof item === 'string' && item.trim()) {
            indices.push(registerText(item.trim(), `${pathPrefix}[${i}]`));
          } else {
            indices.push(-1);
          }
        });
      }
      return indices;
    };

    switch (questionType) {
      case 'mcq':
        return this.collectMCQ(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
      case 'assertion_reason':
        return this.collectAR(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
      case 'match_following':
        return this.collectMatch(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
      case 'sequence_order':
        return this.collectSequence(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
      case 'statement_based':
        return this.collectStatement(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
      case 'passage_based':
        return this.collectPassage(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
      default:
        if (questionType.startsWith('di_')) {
          return this.collectDI(
            rawQuestion, baseMeta, sourceLanguage,
            questionType, registerText, registerArray
          );
        }
        return this.collectMCQ(rawQuestion, baseMeta, sourceLanguage, registerText, registerArray);
    }
  }

  // ----------------------------------------------------------------
  // Individual collectors
  // ----------------------------------------------------------------

  collectMCQ(raw, meta, srcLang, regText, regArray) {
    const question = {
      questionType: 'mcq',
      ...meta,
      correctAnswer: this.safeInt(raw.correct ?? raw.correctAnswer, 0),
      _idx: {},
      _src: {}
    };

    const qText = raw.question || raw.questionText || '';
    const options = raw.options || [];
    const explanation = raw.explanation || '';

    question._idx.question = regText(qText, 'question');
    question._idx.options = regArray(options, 'options');
    question._idx.explanation = regText(explanation, 'explanation');
    question._src = { question: qText, options, explanation };

    return { type: 'single', data: question };
  }

  collectAR(raw, meta, srcLang, regText, regArray) {
    const question = {
      questionType: 'assertion_reason',
      ...meta,
      correctAnswer: this.safeInt(raw.correct ?? raw.correctAnswer, 0),
      _idx: {},
      _src: {}
    };

    const qText = raw.question || raw.instruction || (
      srcLang === 'hi'
        ? 'निम्नलिखित दो कथनों पर विचार कीजिए:'
        : 'Consider the following two statements:'
    );
    const assertion = raw.assertion || '';
    const reason = raw.reason || '';
    const explanation = raw.explanation || '';

    const defaultOpts = srcLang === 'hi' ? [
      'अभिकथन (A) और कारण (R) दोनों सही हैं और (R), (A) की सही व्याख्या है',
      'अभिकथन (A) और कारण (R) दोनों सही हैं, परंतु (R), (A) की सही व्याख्या नहीं है',
      'अभिकथन (A) सही है, परंतु कारण (R) गलत है',
      'अभिकथन (A) गलत है, परंतु कारण (R) सही है'
    ] : [
      'Both Assertion (A) and Reason (R) are true, and (R) is the correct explanation of (A)',
      'Both Assertion (A) and Reason (R) are true, but (R) is NOT the correct explanation of (A)',
      'Assertion (A) is true, but Reason (R) is false',
      'Assertion (A) is false, but Reason (R) is true'
    ];
    const options = raw.options?.length > 0 ? raw.options : defaultOpts;

    question._idx.question = regText(qText, 'question');
    question._idx.assertion = regText(assertion, 'assertion');
    question._idx.reason = regText(reason, 'reason');
    question._idx.options = regArray(options, 'options');
    question._idx.explanation = regText(explanation, 'explanation');
    question._src = { question: qText, assertion, reason, options, explanation };

    return { type: 'single', data: question };
  }

  collectMatch(raw, meta, srcLang, regText, regArray) {
    const question = {
      questionType: 'match_following',
      ...meta,
      correctAnswer: this.safeInt(raw.correct ?? raw.correctAnswer, 0),
      _idx: {},
      _src: {}
    };

    const qText = raw.question || raw.instruction || (
      srcLang === 'hi'
        ? 'सूची-I को सूची-II से सुमेलित कीजिए:'
        : 'Match List-I with List-II:'
    );
    const listA = raw.listA || raw.list1 || [];
    const listB = raw.listB || raw.list2 || [];
    const correctMatch = raw.correctMatch || raw.match || [];
    const options = raw.options || [];
    const explanation = raw.explanation || '';

    question._idx.question = regText(qText, 'question');
    question._idx.listA = regArray(listA, 'listA');
    question._idx.listB = regArray(listB, 'listB');
    question._idx.options = regArray(options, 'options');
    question._idx.explanation = regText(explanation, 'explanation');
    question._src = { question: qText, listA, listB, correctMatch, options, explanation };

    return { type: 'single', data: question };
  }

  collectSequence(raw, meta, srcLang, regText, regArray) {
    const question = {
      questionType: 'sequence_order',
      ...meta,
      correctAnswer: this.safeInt(raw.correct ?? raw.correctAnswer, 0),
      _idx: {},
      _src: {}
    };

    const qText = raw.question || raw.instruction || (
      srcLang === 'hi'
        ? 'निम्नलिखित को कालक्रमानुसार व्यवस्थित कीजिए:'
        : 'Arrange the following in chronological order:'
    );
    const items = raw.items || raw.events || [];
    const correctOrder = raw.correctOrder || raw.order || [];
    const options = raw.options || [];
    const explanation = raw.explanation || '';

    question._idx.question = regText(qText, 'question');
    question._idx.items = regArray(items, 'items');
    question._idx.options = regArray(options, 'options');
    question._idx.explanation = regText(explanation, 'explanation');
    question._src = { question: qText, items, correctOrder, options, explanation };

    return { type: 'single', data: question };
  }

  collectStatement(raw, meta, srcLang, regText, regArray) {
    const question = {
      questionType: 'statement_based',
      ...meta,
      correctAnswer: this.safeInt(raw.correct ?? raw.correctAnswer, 0),
      _idx: {},
      _src: {}
    };

    const qText = raw.question || raw.instruction || (
      srcLang === 'hi'
        ? 'निम्नलिखित कथनों पर विचार कीजिए:'
        : 'Consider the following statements:'
    );
    const statements = raw.statements || [];
    const correctStatements = raw.correctStatements || [];
    const options = raw.options || [];
    const explanation = raw.explanation || '';

    question._idx.question = regText(qText, 'question');
    question._idx.statements = regArray(statements, 'statements');
    question._idx.options = regArray(options, 'options');
    question._idx.explanation = regText(explanation, 'explanation');
    question._src = { question: qText, statements, correctStatements, options, explanation };

    return { type: 'single', data: question };
  }

  collectPassage(raw, meta, srcLang, regText, regArray) {
    let passageContent = '';
    let passageTitle = '';
    let rawQuestions = [];

    if (typeof raw.passage === 'string') {
      passageContent = raw.passage;
      passageTitle = raw.title || '';
      rawQuestions = raw.questions || [];
    } else if (raw.passage && typeof raw.passage === 'object') {
      passageContent = raw.passage.content || raw.passage.text || '';
      passageTitle = raw.passage.title || raw.title || '';
      rawQuestions = raw.questions || raw.passage.questions || [];
    } else if (raw.passageContent) {
      passageContent = raw.passageContent;
      passageTitle = raw.title || '';
      rawQuestions = raw.questions || [];
    }

    const passage = {
      title: passageTitle,
      paper: meta.paper,
      unit: meta.unit,
      chapter: meta.chapter,
      topic: meta.topic,
      source: meta.source,
      content: { hi: '', en: '' },
      _idx: {},
      _src: {}
    };

    passage._idx.content = regText(passageContent, 'passage.content');
    passage._src.content = passageContent;

    const questions = [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const question = {
        questionType: 'passage_based',
        passageOrder: i + 1,
        ...meta,
        correctAnswer: this.safeInt(q.correct ?? q.correctAnswer, 0),
        difficulty: q.difficulty ? this.normalizeDifficulty(q.difficulty) : meta.difficulty,
        _idx: {},
        _src: {}
      };

      const qText = q.question || q.questionText || '';
      const options = q.options || [];
      const explanation = q.explanation || '';

      question._idx.question = regText(qText, `passage.q[${i}].question`);
      question._idx.options = regArray(options, `passage.q[${i}].options`);
      question._idx.explanation = regText(explanation, `passage.q[${i}].explanation`);
      question._src = { question: qText, options, explanation };

      questions.push(question);
    }

    return { type: 'passage', data: { passage, questions } };
  }

  collectDI(raw, meta, srcLang, diQuestionType, regText, regArray) {
    const diRaw = raw.diData || raw;

    let diType = 'table';
    if (diQuestionType === 'di_bar_chart') diType = 'bar_chart';
    else if (diQuestionType === 'di_pie_chart') diType = 'pie_chart';
    else if (diQuestionType === 'di_line_graph') diType = 'line_graph';
    else if (diQuestionType === 'di_mixed') diType = 'mixed';
    else if (diQuestionType === 'di_caselet') diType = 'caselet';

    const diData = {
      diType,
      paper: meta.paper,
      unit: meta.unit,
      chapter: meta.chapter,
      topic: meta.topic,
      source: meta.source,
      title: { hi: '', en: '' },
      instruction: { hi: '', en: '' },
      _idx: {},
      _src: {}
    };

    const titleText = typeof diRaw.title === 'string' ? diRaw.title : '';
    const instrText = typeof diRaw.instruction === 'string' ? diRaw.instruction : '';

    diData._idx.title = regText(titleText, 'di.title');
    diData._idx.instruction = regText(instrText, 'di.instruction');
    diData._src = { title: titleText, instruction: instrText };

    // Table Data
    if (diRaw.tableData) {
      diData.tableData = {
        rows: diRaw.tableData.rows || [],
        headers: { hi: [], en: [] },
        footers: { hi: [], en: [] }
      };
      const headers = diRaw.tableData.headers || [];
      const footers = diRaw.tableData.footers || [];
      diData._idx.tableHeaders = regArray(headers, 'di.tableHeaders');
      diData._idx.tableFooters = regArray(footers, 'di.tableFooters');
      diData._src.tableHeaders = headers;
      diData._src.tableFooters = footers;
    }

    // Chart Data
    if (diRaw.chartData) {
      const datasets = (diRaw.chartData.datasets || []).map(ds => ({
        data: ds.data || [],
        color: ds.color || '#3B82F6',
        backgroundColor: ds.backgroundColor || ds.color || '#3B82F6',
        borderColor: ds.borderColor || ds.color || '#3B82F6',
        type: ds.type || 'bar',
        label: { hi: '', en: '' }
      }));

      diData.chartData = {
        labels: { hi: [], en: [] },
        datasets,
        xAxisLabel: { hi: '', en: '' },
        yAxisLabel: { hi: '', en: '' },
        colors: diRaw.chartData.colors || []
      };

      const labels = diRaw.chartData.labels || [];
      diData._idx.chartLabels = regArray(labels, 'di.chartLabels');
      diData._src.chartLabels = labels;

      diData._idx.datasetLabels = [];
      diData._src.datasetLabels = [];
      (diRaw.chartData.datasets || []).forEach((ds, i) => {
        const lbl = typeof ds.label === 'string' ? ds.label : '';
        diData._idx.datasetLabels.push(regText(lbl, `di.datasetLabel[${i}]`));
        diData._src.datasetLabels.push(lbl);
      });

      const xLabel = typeof diRaw.chartData.xAxisLabel === 'string'
        ? diRaw.chartData.xAxisLabel : '';
      const yLabel = typeof diRaw.chartData.yAxisLabel === 'string'
        ? diRaw.chartData.yAxisLabel : '';
      diData._idx.xAxisLabel = regText(xLabel, 'di.xAxisLabel');
      diData._idx.yAxisLabel = regText(yLabel, 'di.yAxisLabel');
      diData._src.xAxisLabel = xLabel;
      diData._src.yAxisLabel = yLabel;
    }

    // Caselet
    if (diRaw.caseletText) {
      const caseletText = typeof diRaw.caseletText === 'string' ? diRaw.caseletText : '';
      diData.caseletText = { hi: '', en: '' };
      diData._idx.caseletText = regText(caseletText, 'di.caseletText');
      diData._src.caseletText = caseletText;
    }

    if (diRaw.imageUrl) {
      diData.imageUrl = diRaw.imageUrl;
    }

    // Questions for this DI set
    const rawQuestions = diRaw.questions || [];
    const questions = [];

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const question = {
        questionType: diQuestionType,
        diOrder: i + 1,
        ...meta,
        correctAnswer: this.safeInt(q.correct ?? q.correctAnswer, 0),
        difficulty: q.difficulty ? this.normalizeDifficulty(q.difficulty) : meta.difficulty,
        _idx: {},
        _src: {}
      };

      const qText = q.question || q.questionText || '';
      const options = q.options || [];
      const explanation = q.explanation || '';

      question._idx.question = regText(qText, `di.q[${i}].question`);
      question._idx.options = regArray(options, `di.q[${i}].options`);
      question._idx.explanation = regText(explanation, `di.q[${i}].explanation`);
      question._src = { question: qText, options, explanation };

      questions.push(question);
    }

    return { type: 'di', data: { diData, questions } };
  }

  // ================================================================
  // APPLY TRANSLATIONS
  // ================================================================

  applyTranslations(data, registry, translations, srcLang, tgtLang, questionIndex) {
    const getT = (idx) => {
      if (idx >= 0 && idx < translations.length && translations[idx]) {
        return translations[idx];
      }
      return '';
    };

    const bilingual = (src, idx) => ({
      [srcLang]: src || '',
      [tgtLang]: getT(idx) || src || ''
    });

    const bilingualArr = (srcArr, indices) => ({
      [srcLang]: srcArr || [],
      [tgtLang]: (indices || []).map((i, pos) =>
        getT(i) || (srcArr && srcArr[pos]) || ''
      )
    });

    if (data.questionType) {
      this.applyToQuestion(data, bilingual, bilingualArr);
    } else if (data.passage !== undefined) {
      const p = data.passage;
      if (p && p._idx?.content !== undefined) {
        p.content = bilingual(p._src?.content, p._idx.content);
      }
      if (data.questions) {
        for (const q of data.questions) {
          this.applyToQuestion(q, bilingual, bilingualArr);
        }
      }
    } else if (data.diData !== undefined) {
      this.applyToDI(data.diData, bilingual, bilingualArr);
      if (data.questions) {
        for (const q of data.questions) {
          this.applyToQuestion(q, bilingual, bilingualArr);
        }
      }
    }
  }

  applyToQuestion(q, bilingual, bilingualArr) {
    const idx = q._idx || {};
    const src = q._src || {};

    if (idx.question !== undefined && idx.question >= 0) {
      q.question = bilingual(src.question, idx.question);
    } else if (src.question) {
      q.question = { hi: src.question, en: src.question };
    }

    if (idx.options && idx.options.length > 0) {
      q.options = bilingualArr(src.options, idx.options);
    } else if (src.options && src.options.length > 0) {
      q.options = { hi: src.options, en: src.options };
    }

    if (idx.explanation !== undefined && idx.explanation >= 0 && src.explanation) {
      q.explanation = bilingual(src.explanation, idx.explanation);
    }

    if (idx.assertion !== undefined || idx.reason !== undefined) {
      q.assertionReasonData = {
        assertion: bilingual(src.assertion, idx.assertion),
        reason: bilingual(src.reason, idx.reason)
      };
    }

    if (idx.listA && idx.listA.length > 0) {
      q.matchData = {
        listA: bilingualArr(src.listA, idx.listA),
        listB: bilingualArr(src.listB, idx.listB),
        correctMatch: src.correctMatch || []
      };
    }

    if (idx.items && idx.items.length > 0) {
      q.sequenceData = {
        items: bilingualArr(src.items, idx.items),
        correctOrder: src.correctOrder || []
      };
    }

    if (idx.statements && idx.statements.length > 0) {
      q.statementData = {
        statements: bilingualArr(src.statements, idx.statements),
        correctStatements: src.correctStatements || []
      };
    }
  }

  applyToDI(di, bilingual, bilingualArr) {
    const idx = di._idx || {};
    const src = di._src || {};

    if (idx.title !== undefined && idx.title >= 0) {
      di.title = bilingual(src.title, idx.title);
    }
    if (idx.instruction !== undefined && idx.instruction >= 0) {
      di.instruction = bilingual(src.instruction, idx.instruction);
    }
    if (idx.caseletText !== undefined && idx.caseletText >= 0) {
      di.caseletText = bilingual(src.caseletText, idx.caseletText);
    }

    if (idx.tableHeaders && idx.tableHeaders.length > 0 && di.tableData) {
      di.tableData.headers = bilingualArr(src.tableHeaders, idx.tableHeaders);
    }
    if (idx.tableFooters && idx.tableFooters.length > 0 && di.tableData) {
      di.tableData.footers = bilingualArr(src.tableFooters, idx.tableFooters);
    }

    if (idx.chartLabels && idx.chartLabels.length > 0 && di.chartData) {
      di.chartData.labels = bilingualArr(src.chartLabels, idx.chartLabels);
    }

    if (idx.datasetLabels && di.chartData?.datasets) {
      idx.datasetLabels.forEach((textIdx, i) => {
        if (di.chartData.datasets[i]) {
          di.chartData.datasets[i].label = bilingual(
            src.datasetLabels?.[i], textIdx
          );
        }
      });
    }

    if (idx.xAxisLabel !== undefined && idx.xAxisLabel >= 0 && di.chartData) {
      di.chartData.xAxisLabel = bilingual(src.xAxisLabel, idx.xAxisLabel);
    }
    if (idx.yAxisLabel !== undefined && idx.yAxisLabel >= 0 && di.chartData) {
      di.chartData.yAxisLabel = bilingual(src.yAxisLabel, idx.yAxisLabel);
    }
  }

  // ================================================================
  // VALIDATE JSON STRUCTURE
  // ================================================================

  validateJSONStructure(jsonData) {
    const errors = [];
    const warnings = [];

    if (!jsonData || typeof jsonData !== 'object') {
      return { isValid: false, errors: ['Invalid JSON'], warnings: [] };
    }

    if (!jsonData.questions) {
      errors.push('Missing "questions" array');
    } else if (!Array.isArray(jsonData.questions)) {
      errors.push('"questions" must be an array');
    } else if (jsonData.questions.length === 0) {
      errors.push('"questions" array is empty');
    }

    const language = jsonData.language || jsonData.defaultMeta?.language;
    if (!language) {
      warnings.push('No language specified, defaulting to "hi" (Hindi)');
    } else if (!['hi', 'en'].includes(language)) {
      errors.push('Invalid language. Must be "hi" or "en"');
    }

    // 🔧 FIX: Don't reject invalid paper/difficulty — just warn and normalize
    const rawPaper = jsonData.paper || jsonData.defaultMeta?.paper;
    if (rawPaper) {
      const normalized = this.normalizePaper(rawPaper);
      if (rawPaper !== normalized && rawPaper !== 'paper1' && rawPaper !== 'paper2') {
        warnings.push(`Paper "${rawPaper}" will be mapped to "${normalized}"`);
      }
    } else {
      warnings.push('No paper specified, defaulting to "paper1"');
    }

    const rawDiff = jsonData.difficulty || jsonData.defaultMeta?.difficulty;
    if (rawDiff) {
      const normalized = this.normalizeDifficulty(rawDiff);
      if (rawDiff !== normalized && !['easy', 'medium', 'hard'].includes(rawDiff)) {
        warnings.push(`Difficulty "${rawDiff}" will be mapped to "${normalized}"`);
      }
    }

    if (Array.isArray(jsonData.questions)) {
      jsonData.questions.forEach((q, index) => {
        if (!q || typeof q !== 'object') {
          errors.push(`Question ${index + 1}: Invalid question object`);
          return;
        }

        const type = this.detectQuestionType(q);

        if (!type.startsWith('di_') && type !== 'passage_based') {
          if (q.correct === undefined && q.correctAnswer === undefined) {
            warnings.push(`Question ${index + 1}: Missing correct answer, defaulting to 0`);
          }
          if (!q.options && !q.listA && !q.assertion && !q.items && !q.statements) {
            warnings.push(`Question ${index + 1}: Missing options/data`);
          }
        }

        if (type === 'passage_based') {
          let pContent = '';
          let pQuestions = [];

          if (typeof q.passage === 'string') {
            pContent = q.passage;
            pQuestions = q.questions || [];
          } else if (q.passage && typeof q.passage === 'object') {
            pContent = q.passage.content || q.passage.text || '';
            pQuestions = q.questions || q.passage.questions || [];
          } else if (q.passageContent) {
            pContent = q.passageContent;
            pQuestions = q.questions || [];
          }

          if (!pContent) {
            warnings.push(`Question ${index + 1}: Passage content is empty`);
          }
          if (!pQuestions || pQuestions.length === 0) {
            warnings.push(`Question ${index + 1}: No sub-questions in passage set`);
          }
        }

        if (type.startsWith('di_')) {
          const diRaw = q.diData || q;
          if (!diRaw.questions || diRaw.questions.length === 0) {
            warnings.push(`Question ${index + 1}: No sub-questions in DI set`);
          }
        }
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

module.exports = new SmartParser();