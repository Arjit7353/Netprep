// client/src/utils/pdfExport.js
// ⭐ ADVANCED PROFESSIONAL PDF EXPORT SYSTEM
// Supports: Passage Groups, DI Groups, All Question Types, Smart Layout

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSequenceItemLabel } from './helpers';

// ==================== CONFIGURATION ====================

const CONFIG = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 12,
  contentWidth: 186, // pageWidth - 2*margin
  
  fonts: {
    title: 16,
    sectionHeader: 13,
    passageTitle: 11,
    passage: 9.5,
    question: 10.5,
    option: 9.5,
    explanation: 8.5,
    table: 8,
    small: 7
  },
  
  colors: {
    primary: [13, 71, 161],
    primaryLight: [227, 242, 253],
    accent: [255, 152, 0],
    success: [46, 125, 50],
    successLight: [232, 245, 233],
    danger: [198, 40, 40],
    info: [2, 136, 209],
    infoLight: [225, 245, 254],
    purple: [123, 31, 162],
    purpleLight: [243, 229, 245],
    amber: [255, 193, 7],
    amberLight: [255, 248, 225],
    dark: [33, 33, 33],
    gray700: [66, 66, 66],
    gray600: [97, 97, 97],
    gray500: [117, 117, 117],
    gray400: [158, 158, 158],
    gray300: [224, 224, 224],
    gray200: [238, 238, 238],
    gray100: [245, 245, 245],
    white: [255, 255, 255]
  },
  
  spacing: {
    afterTitle: 6,
    afterSection: 8,
    afterPassage: 6,
    afterDI: 6,
    afterQuestion: 10,
    betweenOptions: 2,
    afterExplanation: 4
  }
};

// ==================== HELPER FUNCTIONS ====================

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.data) return ensureArray(data.data);
  if (data?.questions) return ensureArray(data.questions);
  return [];
};

const getText = (obj, lang = 'en', fallback = '') => {
  if (!obj) return fallback;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'object') {
    const text = obj[lang] || obj.en || obj.hi || obj.text || obj.value || obj.content;
    return text || fallback;
  }
  return fallback;
};

const getQuestionText = (q, lang) => {
  if (!q) return '';
  const fields = ['question', 'questionText', 'text', 'stem'];
  for (const field of fields) {
    const val = getText(q[field], lang);
    if (val) return val;
  }
  return '';
};

const getOptions = (q, lang) => {
  if (!q?.options) return [];
  const raw = q.options;
  
  if (Array.isArray(raw)) {
    return raw.map(opt => getText(opt, lang, String(opt || '')));
  }
  
  if (typeof raw === 'object') {
    const localized = raw[lang] || raw.en || raw.hi;
    if (Array.isArray(localized)) {
      return localized.map(o => getText(o, lang, String(o || '')));
    }
  }
  
  return [];
};

const getExplanation = (q, lang) => {
  const fields = ['explanation', 'solution', 'rationale'];
  for (const field of fields) {
    const val = getText(q[field], lang);
    if (val) return val;
  }
  return '';
};

const containsHindi = (text) => /[\u0900-\u097F]/.test(String(text || ''));

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

// ==================== CANVAS TEXT RENDERER ====================

const canvasText = (text, opts = {}) => {
  const { 
    fontSize = 10, 
    bold = false, 
    color = '#212121', 
    maxWidth = 170, 
    lineHeight = 1.5,
    align = 'left'
  } = opts;
  
  const safe = String(text || '').replace(/[\r\n]+/g, ' ').trim();
  if (!safe) return { dataUrl: null, width: 0, height: 0 };

  const scale = 4;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const fonts = '"Noto Sans Devanagari","Mangal","Nirmala UI","Arial Unicode MS",sans-serif';
  const weight = bold ? 'bold' : 'normal';
  const sz = fontSize * scale;
  ctx.font = `${weight} ${sz}px ${fonts}`;

  // Wrap text
  const maxPx = maxWidth * scale;
  const words = safe.split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach(word => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxPx && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  if (!lines.length) lines.push('');

  // Calculate dimensions
  const lh = sz * lineHeight;
  const pad = sz * 0.2;
  let maxLineWidth = 0;
  lines.forEach(line => {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  });

  canvas.width = Math.ceil(Math.min(maxLineWidth + pad * 2, maxPx + pad * 2));
  canvas.height = Math.ceil(lines.length * lh + pad * 2);

  // Render
  ctx.font = `${weight} ${sz}px ${fonts}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  
  lines.forEach((line, i) => {
    let x = pad;
    if (align === 'center') {
      x = (canvas.width - ctx.measureText(line).width) / 2;
    } else if (align === 'right') {
      x = canvas.width - ctx.measureText(line).width - pad;
    }
    ctx.fillText(line, x, pad + i * lh);
  });

  return {
    dataUrl: canvas.toDataURL('image/png', 1.0),
    width: canvas.width / scale,
    height: canvas.height / scale
  };
};

// ==================== TEXT RENDERER CLASS ====================

class TextRenderer {
  constructor(doc, language) {
    this.doc = doc;
    this.lang = language;
  }

  render(text, x, y, opts = {}) {
    const {
      fontSize = 10,
      bold = false,
      color = CONFIG.colors.dark,
      maxWidth = CONFIG.contentWidth - 4,
      align = 'left',
      lineHeight = 1.5
    } = opts;

    const safe = String(text || '').trim();
    if (!safe) return 0;

    const colorStr = `rgb(${color[0]},${color[1]},${color[2]})`;

    // Use canvas for Hindi text
    if (containsHindi(safe)) {
      const result = canvasText(safe, { fontSize, bold, color: colorStr, maxWidth, lineHeight, align });
      if (result.dataUrl && result.height > 0) {
        let xPos = x;
        if (align === 'center') xPos = x - result.width / 2;
        else if (align === 'right') xPos = x - result.width;
        
        this.doc.addImage(result.dataUrl, 'PNG', xPos, y, result.width, result.height);
        return result.height;
      }
    }

    // Use jsPDF text for English
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);
    
    const lines = this.doc.splitTextToSize(safe, maxWidth);
    const lh = fontSize * 0.35 * lineHeight;
    
    lines.forEach((line, i) => {
      const yPos = y + i * lh;
      if (align === 'center') {
        this.doc.text(line, x, yPos, { align: 'center' });
      } else if (align === 'right') {
        this.doc.text(line, x, yPos, { align: 'right' });
      } else {
        this.doc.text(line, x, yPos);
      }
    });
    
    return lines.length * lh;
  }

  measure(text, fontSize = 10, maxWidth = CONFIG.contentWidth - 4, lineHeight = 1.5) {
    const safe = String(text || '').trim();
    if (!safe) return 0;
    
    if (containsHindi(safe)) {
      return canvasText(safe, { fontSize, maxWidth, lineHeight }).height;
    }
    
    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(safe, maxWidth);
    return lines.length * fontSize * 0.35 * lineHeight;
  }
}

// ==================== QUESTION GROUPER ====================

class QuestionGrouper {
  constructor(questions) {
    this.questions = ensureArray(questions);
    this.groups = [];
    this.processedIds = new Set();
  }

  group() {
    const passages = new Map(); // passageId -> questions
    const diSets = new Map();   // diDataId -> questions
    const standalone = [];

    this.questions.forEach(q => {
      // Passage-based questions
      if (q.passageId && q.passageId._id) {
        const passageId = String(q.passageId._id);
        if (!passages.has(passageId)) {
          passages.set(passageId, {
            type: 'passage',
            data: q.passageId,
            questions: []
          });
        }
        passages.get(passageId).questions.push(q);
      }
      // DI-based questions
      else if (q.diDataId && q.diDataId._id) {
        const diId = String(q.diDataId._id);
        if (!diSets.has(diId)) {
          diSets.set(diId, {
            type: 'di',
            data: q.diDataId,
            questions: []
          });
        }
        diSets.get(diId).questions.push(q);
      }
      // Standalone questions
      else {
        standalone.push({
          type: 'standalone',
          question: q
        });
      }
    });

    // Combine all groups
    const allGroups = [
      ...Array.from(passages.values()),
      ...Array.from(diSets.values()),
      ...standalone
    ];

    // Sort by original question order
    const questionIndexMap = new Map();
    this.questions.forEach((q, idx) => {
      questionIndexMap.set(String(q._id), idx);
    });

    allGroups.sort((a, b) => {
      const aIdx = a.questions ? questionIndexMap.get(String(a.questions[0]._id)) : questionIndexMap.get(String(a.question._id));
      const bIdx = b.questions ? questionIndexMap.get(String(b.questions[0]._id)) : questionIndexMap.get(String(b.question._id));
      return (aIdx || 0) - (bIdx || 0);
    });

    return allGroups;
  }
}

// ==================== RENDERERS ====================

class PassageRenderer {
  constructor(doc, textRenderer, checkPage) {
    this.doc = doc;
    this.txt = textRenderer;
    this.checkPage = checkPage;
    this.config = CONFIG;
  }

  render(passageData, yPos) {
    const { colors, fonts, spacing } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const passageContent = getText(passageData.content, this.txt.lang, '');
    const passageTitle = passageData.title || '';

    if (!passageContent) return y;

    // Check space needed
    const estimatedHeight = 60;
    this.checkPage(estimatedHeight);
    y = this.doc.lastY || y;

    // Header box
    this.doc.setFillColor(...colors.amberLight);
    this.doc.setDrawColor(...colors.amber);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(M + 2, y, CW - 4, 10, 2, 2, 'FD');
    this.doc.setLineWidth(0.2);

    this.doc.setFontSize(fonts.passageTitle);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.amber);
    const headerText = this.txt.lang === 'hi' ? '📖 गद्यांश / PASSAGE' : '📖 PASSAGE';
    this.doc.text(headerText, M + 8, y + 6.5);
    
    y += 12;

    // Passage content box
    const contentHeight = this.txt.measure(passageContent, fonts.passage, CW - 16, 1.7);
    const boxHeight = Math.max(contentHeight + 14, 35);
    
    this.checkPage(boxHeight + 10);
    y = this.doc.lastY || y;

    this.doc.setFillColor(...colors.gray100);
    this.doc.setDrawColor(...colors.gray300);
    this.doc.roundedRect(M + 2, y, CW - 4, boxHeight, 2, 2, 'FD');

    // Render passage text
    const textHeight = this.txt.render(passageContent, M + 8, y + 7, {
      fontSize: fonts.passage,
      color: colors.gray700,
      maxWidth: CW - 16,
      lineHeight: 1.7
    });

    y += boxHeight + spacing.afterPassage;

    // "Questions based on passage" label
    this.doc.setFontSize(fonts.small);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...colors.amber);
    const labelText = this.txt.lang === 'hi' 
      ? 'निम्नलिखित प्रश्न उपरोक्त गद्यांश पर आधारित हैं:'
      : 'The following questions are based on the above passage:';
    this.doc.text(labelText, M + 4, y);
    y += 6;

    return y;
  }
}

class DIRenderer {
  constructor(doc, textRenderer, checkPage) {
    this.doc = doc;
    this.txt = textRenderer;
    this.checkPage = checkPage;
    this.config = CONFIG;
  }

  render(diData, yPos) {
    const { colors, fonts, spacing } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    if (!diData) return y;

    this.checkPage(60);
    y = this.doc.lastY || y;

    // DI Header
    this.doc.setFillColor(...colors.purpleLight);
    this.doc.setDrawColor(...colors.purple);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(M + 2, y, CW - 4, 10, 2, 2, 'FD');
    this.doc.setLineWidth(0.2);

    this.doc.setFontSize(fonts.passageTitle);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.purple);
    const headerText = this.txt.lang === 'hi' ? '📊 डेटा इंटरप्रिटेशन / DATA INTERPRETATION' : '📊 DATA INTERPRETATION';
    this.doc.text(headerText, M + 8, y + 6.5);
    
    y += 12;

    // DI Title
    const title = getText(diData.title, this.txt.lang, '');
    if (title) {
      const titleHeight = this.txt.render(title, M + 6, y, {
        fontSize: fonts.passageTitle,
        bold: true,
        color: colors.dark,
        maxWidth: CW - 12
      });
      y += Math.max(titleHeight, 5) + 4;
    }

    // DI Instruction
    const instruction = getText(diData.instruction, this.txt.lang, '');
    if (instruction) {
      this.checkPage(20);
      y = this.doc.lastY || y;
      
      const instHeight = this.txt.measure(instruction, fonts.small, CW - 16);
      this.doc.setFillColor(...colors.gray100);
      this.doc.roundedRect(M + 2, y, CW - 4, instHeight + 8, 2, 2, 'F');
      
      this.txt.render(instruction, M + 8, y + 4, {
        fontSize: fonts.small,
        color: colors.gray600,
        maxWidth: CW - 16
      });
      
      y += instHeight + 12;
    }

    // Render Table if exists
    if (diData.tableData) {
      y = this.renderTable(diData.tableData, y);
    }

    // "Questions based on data" label
    this.doc.setFontSize(fonts.small);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(...colors.purple);
    const labelText = this.txt.lang === 'hi'
      ? 'निम्नलिखित प्रश्न उपरोक्त डेटा पर आधारित हैं:'
      : 'The following questions are based on the above data:';
    this.doc.text(labelText, M + 4, y);
    y += 6;

    return y;
  }

  renderTable(tableData, yPos) {
    const { colors, fonts } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const headers = ensureArray(tableData.headers).map(h => getText(h, this.txt.lang, ''));
    const rows = ensureArray(tableData.rows);

    if (headers.length === 0 && rows.length === 0) return y;

    this.checkPage(40);
    y = this.doc.lastY || y;

    const tableX = M + 4;
    const tableW = CW - 8;
    const colCount = Math.max(headers.length, rows[0]?.length || 1);
    const colWidth = tableW / colCount;

    // Headers
    if (headers.length > 0) {
      this.doc.setFillColor(...colors.purple);
      this.doc.setDrawColor(...colors.purple);
      this.doc.rect(tableX, y, tableW, 9, 'FD');
      
      this.doc.setFontSize(fonts.table);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...colors.white);

      headers.forEach((header, i) => {
        const text = String(header || '').substring(0, 25);
        const xPos = tableX + i * colWidth + colWidth / 2;
        
        if (containsHindi(text)) {
          const result = canvasText(text, {
            fontSize: fonts.table,
            bold: true,
            color: '#FFFFFF',
            maxWidth: colWidth - 4,
            align: 'center'
          });
          if (result.dataUrl) {
            this.doc.addImage(
              result.dataUrl,
              'PNG',
              xPos - result.width / 2,
              y + 2,
              result.width,
              result.height
            );
          }
        } else {
          this.doc.text(text, xPos, y + 6, { align: 'center' });
        }
        
        // Column separators
        if (i < colCount - 1) {
          this.doc.setDrawColor(...colors.white);
          this.doc.setLineWidth(0.3);
          this.doc.line(tableX + (i + 1) * colWidth, y, tableX + (i + 1) * colWidth, y + 9);
          this.doc.setLineWidth(0.2);
        }
      });
      
      y += 9;
    }

    // Rows
    rows.forEach((row, rowIdx) => {
      this.checkPage(10);
      y = this.doc.lastY || y;
      
      const rowHeight = 8;

      this.doc.setFillColor(...(rowIdx % 2 === 0 ? colors.white : colors.gray100));
      this.doc.setDrawColor(...colors.gray400);
      this.doc.rect(tableX, y, tableW, rowHeight, 'FD');

      this.doc.setFontSize(fonts.table);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...colors.dark);

      ensureArray(row).forEach((cell, cellIdx) => {
        if (cellIdx < colCount) {
          const value = cell === null || cell === undefined || cell === '' ? '-' : String(cell);
          const displayText = value.substring(0, 30);
          const xPos = tableX + cellIdx * colWidth + colWidth / 2;
          
          if (containsHindi(displayText)) {
            const result = canvasText(displayText, {
              fontSize: fonts.table,
              color: '#212121',
              maxWidth: colWidth - 4,
              align: 'center'
            });
            if (result.dataUrl) {
              this.doc.addImage(
                result.dataUrl,
                'PNG',
                xPos - result.width / 2,
                y + 2,
                result.width,
                result.height
              );
            }
          } else {
            this.doc.text(displayText, xPos, y + 5.5, { align: 'center' });
          }
          
          // Column separator
          if (cellIdx < colCount - 1) {
            this.doc.setDrawColor(...colors.gray300);
            this.doc.line(
              tableX + (cellIdx + 1) * colWidth,
              y,
              tableX + (cellIdx + 1) * colWidth,
              y + rowHeight
            );
          }
        }
      });
      
      y += rowHeight;
    });

    y += 8;
    return y;
  }
}

class QuestionRenderer {
  constructor(doc, textRenderer, checkPage, test) {
    this.doc = doc;
    this.txt = textRenderer;
    this.checkPage = checkPage;
    this.test = test;
    this.config = CONFIG;
  }

  render(question, questionNumber, showAnswer, yPos) {
    const { colors, fonts, spacing } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const qType = question.questionType || 'mcq';
    const questionText = getQuestionText(question, this.txt.lang);
    const options = getOptions(question, this.txt.lang);
    const explanation = getExplanation(question, this.txt.lang);

    // Estimate height
    const estimatedHeight = 70;
    this.checkPage(estimatedHeight);
    y = this.doc.lastY || y;

    // Question number badge
    this.doc.setFillColor(...colors.primary);
    this.doc.roundedRect(M, y - 3, 14, 8, 1.5, 1.5, 'F');
    this.doc.setTextColor(...colors.white);
    this.doc.setFontSize(fonts.small);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Q${questionNumber}`, M + 7, y + 2, { align: 'center' });

    // Marks badge
    this.doc.setFillColor(...colors.accent);
    this.doc.roundedRect(M + 16, y - 3, 12, 8, 1.5, 1.5, 'F');
    this.doc.setTextColor(...colors.white);
    this.doc.setFontSize(fonts.small - 1);
    this.doc.text(`${this.test?.marksPerQuestion || 2}M`, M + 22, y + 2, { align: 'center' });

    // Question text
    if (questionText) {
      const qHeight = this.txt.render(questionText, M + 32, y, {
        fontSize: fonts.question,
        bold: false,
        color: colors.dark,
        maxWidth: CW - 36,
        lineHeight: 1.6
      });
      y += Math.max(qHeight, 6) + 4;
    } else {
      y += 8;
    }

    // Render by question type
    switch (qType) {
      case 'statement_based':
        y = this.renderStatementBased(question, y);
        break;
      case 'match_following':
        y = this.renderMatchFollowing(question, y);
        break;
      case 'assertion_reason':
        y = this.renderAssertionReason(question, y);
        break;
      case 'sequence_order':
        y = this.renderSequenceOrder(question, y);
        break;
      default:
        // Standard MCQ - options handled below
        break;
    }

    // Options (for MCQ, DI, Passage, Statement-based after statements)
    if (options.length > 0 && !['match_following', 'sequence_order'].includes(qType)) {
      y = this.renderOptions(options, question.correctAnswer, showAnswer, y);
    }

    // Explanation
    if (showAnswer && explanation) {
      y = this.renderExplanation(explanation, question.correctAnswer, y);
    }

    y += spacing.afterQuestion;

    // Separator
    this.doc.setDrawColor(...colors.gray300);
    this.doc.setLineDashPattern([2, 1.5], 0);
    this.doc.line(M + 4, y, CONFIG.pageWidth - M - 4, y);
    this.doc.setLineDashPattern([], 0);
    y += 6;

    return y;
  }

  renderStatementBased(question, yPos) {
    const { colors, fonts } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const statements = ensureArray(question.statementData?.statements).map(s => getText(s, this.txt.lang, ''));
    const correctStatements = question.statementData?.correctStatements || [];

    if (statements.length === 0) return y;

    this.checkPage(statements.length * 15);
    y = this.doc.lastY || y;

    // Instruction
    const instruction = this.txt.lang === 'hi' 
      ? 'निम्नलिखित कथनों पर विचार कीजिए:'
      : 'Consider the following statements:';
    
    this.txt.render(instruction, M + 6, y, {
      fontSize: fonts.small,
      bold: true,
      color: colors.gray600
    });
    y += 8;

    // Statements
    statements.forEach((stmt, idx) => {
      const stmtHeight = this.txt.measure(stmt, fonts.option, CW - 28);
      const boxHeight = Math.max(stmtHeight + 8, 12);
      
      this.checkPage(boxHeight + 2);
      y = this.doc.lastY || y;

      // Statement box
      this.doc.setFillColor(...colors.gray100);
      this.doc.setDrawColor(...colors.gray300);
      this.doc.roundedRect(M + 8, y, CW - 16, boxHeight, 1.5, 1.5, 'FD');

      // Number badge
      this.doc.setFillColor(...colors.primary);
      this.doc.circle(M + 14, y + boxHeight / 2, 3.5, 'F');
      this.doc.setFontSize(fonts.small);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...colors.white);
      this.doc.text(String(idx + 1), M + 14, y + boxHeight / 2 + 1, { align: 'center' });

      // Statement text
      this.txt.render(stmt, M + 22, y + 4, {
        fontSize: fonts.option,
        color: colors.dark,
        maxWidth: CW - 38
      });

      y += boxHeight + 2;
    });

    y += 4;
    return y;
  }

  renderMatchFollowing(question, yPos) {
    const { colors, fonts } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const matchData = question.matchData || {};
    let listA = [], listB = [];

    if (matchData.listA) {
      listA = Array.isArray(matchData.listA) 
        ? matchData.listA.map(x => getText(x, this.txt.lang, ''))
        : ensureArray(matchData.listA[this.txt.lang] || matchData.listA.en || []);
    }

    if (matchData.listB) {
      listB = Array.isArray(matchData.listB)
        ? matchData.listB.map(x => getText(x, this.txt.lang, ''))
        : ensureArray(matchData.listB[this.txt.lang] || matchData.listB.en || []);
    }

    if (listA.length === 0 && listB.length === 0) return y;

    this.checkPage(60);
    y = this.doc.lastY || y;

    // Instruction
    const instruction = this.txt.lang === 'hi'
      ? 'सूची-I को सूची-II से सुमेलित कीजिए:'
      : 'Match List-I with List-II:';
    
    this.txt.render(instruction, M + 6, y, {
      fontSize: fonts.small,
      bold: true,
      color: colors.gray600
    });
    y += 8;

    // Table
    const tableX = M + 10;
    const tableW = CW - 20;
    const colW = tableW / 2;
    const labels = ['(a)', '(b)', '(c)', '(d)', '(e)'];
    const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)'];
    const maxLen = Math.max(listA.length, listB.length);

    // Header
    this.doc.setFillColor(...colors.primary);
    this.doc.setDrawColor(...colors.primary);
    this.doc.rect(tableX, y, tableW, 9, 'FD');
    
    this.doc.setFontSize(fonts.table);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.white);
    this.doc.text(this.txt.lang === 'hi' ? 'सूची - I' : 'List - I', tableX + colW / 2, y + 6, { align: 'center' });
    this.doc.text(this.txt.lang === 'hi' ? 'सूची - II' : 'List - II', tableX + colW + colW / 2, y + 6, { align: 'center' });
    
    this.doc.setDrawColor(...colors.white);
    this.doc.setLineWidth(0.5);
    this.doc.line(tableX + colW, y, tableX + colW, y + 9);
    this.doc.setLineWidth(0.2);
    
    y += 9;

    // Rows
    for (let i = 0; i < maxLen; i++) {
      const aText = `${labels[i] || ''} ${listA[i] || ''}`;
      const bText = `${romans[i] || ''} ${listB[i] || ''}`;
      
      const aH = this.txt.measure(aText, fonts.option - 0.5, colW - 8);
      const bH = this.txt.measure(bText, fonts.option - 0.5, colW - 8);
      const rowH = Math.max(aH, bH, 10) + 4;
      
      this.checkPage(rowH + 2);
      y = this.doc.lastY || y;

      this.doc.setFillColor(...(i % 2 === 0 ? colors.white : colors.gray100));
      this.doc.setDrawColor(...colors.gray400);
      this.doc.rect(tableX, y, tableW, rowH, 'FD');
      this.doc.line(tableX + colW, y, tableX + colW, y + rowH);

      this.txt.render(aText, tableX + 4, y + 2, {
        fontSize: fonts.option - 0.5,
        color: colors.dark,
        maxWidth: colW - 8
      });

      this.txt.render(bText, tableX + colW + 4, y + 2, {
        fontSize: fonts.option - 0.5,
        color: colors.dark,
        maxWidth: colW - 8
      });

      y += rowH;
    }

    y += 6;

    // Options
    const options = getOptions(question, this.txt.lang);
    if (options.length > 0) {
      y = this.renderOptions(options, question.correctAnswer, false, y);
    }

    return y;
  }

  renderAssertionReason(question, yPos) {
    const { colors, fonts } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const assertion = getText(question.assertionReasonData?.assertion, this.txt.lang, '');
    const reason = getText(question.assertionReasonData?.reason, this.txt.lang, '');

    if (assertion) {
      this.checkPage(25);
      y = this.doc.lastY || y;

      const aHeight = this.txt.measure(assertion, fonts.option, CW - 24);
      const boxH = Math.max(aHeight + 12, 16);

      this.doc.setFillColor(...colors.primaryLight);
      this.doc.setDrawColor(...colors.primary);
      this.doc.setLineWidth(0.4);
      this.doc.roundedRect(M + 6, y, CW - 12, boxH, 2, 2, 'FD');
      this.doc.setLineWidth(0.2);

      this.doc.setFontSize(fonts.small);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...colors.primary);
      const aLabel = this.txt.lang === 'hi' ? 'कथन (A):' : 'Assertion (A):';
      this.doc.text(aLabel, M + 10, y + 5);

      this.txt.render(assertion, M + 10, y + 9, {
        fontSize: fonts.option,
        color: colors.gray700,
        maxWidth: CW - 24
      });

      y += boxH + 3;
    }

    if (reason) {
      this.checkPage(25);
      y = this.doc.lastY || y;

      const rHeight = this.txt.measure(reason, fonts.option, CW - 24);
      const boxH = Math.max(rHeight + 12, 16);

      this.doc.setFillColor(255, 248, 225);
      this.doc.setDrawColor(...colors.accent);
      this.doc.setLineWidth(0.4);
      this.doc.roundedRect(M + 6, y, CW - 12, boxH, 2, 2, 'FD');
      this.doc.setLineWidth(0.2);

      this.doc.setFontSize(fonts.small);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...colors.accent);
      const rLabel = this.txt.lang === 'hi' ? 'कारण (R):' : 'Reason (R):';
      this.doc.text(rLabel, M + 10, y + 5);

      this.txt.render(reason, M + 10, y + 9, {
        fontSize: fonts.option,
        color: colors.gray700,
        maxWidth: CW - 24
      });

      y += boxH + 3;
    }

    y += 4;
    return y;
  }

  renderSequenceOrder(question, yPos) {
    const { colors, fonts } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const items = ensureArray(question.sequenceData?.items).map(i => getText(i, this.txt.lang, ''));
    const options = getOptions(question, this.txt.lang);

    if (items.length === 0) return y;

    this.checkPage(items.length * 12);
    y = this.doc.lastY || y;

    // Instruction
    const instruction = this.txt.lang === 'hi'
      ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:'
      : 'Arrange the following in correct order:';
    
    this.txt.render(instruction, M + 6, y, {
      fontSize: fonts.small,
      bold: true,
      color: colors.gray600
    });
    y += 8;

    // Items
    items.forEach((item, idx) => {
      const itemH = this.txt.measure(item, fonts.option, CW - 28);
      const boxH = Math.max(itemH + 8, 11);
      
      this.checkPage(boxH + 2);
      y = this.doc.lastY || y;

      this.doc.setFillColor(...colors.gray100);
      this.doc.setDrawColor(...colors.gray300);
      this.doc.roundedRect(M + 8, y, CW - 16, boxH, 1.5, 1.5, 'FD');

      // Number / Label
      this.doc.setFillColor(...colors.info);
      this.doc.circle(M + 14, y + boxH / 2, 3.5, 'F');
      this.doc.setFontSize(fonts.small);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...colors.white);
      this.doc.text(getSequenceItemLabel(idx, options), M + 14, y + boxH / 2 + 1, { align: 'center' });

      this.txt.render(item, M + 22, y + 4, {
        fontSize: fonts.option,
        color: colors.dark,
        maxWidth: CW - 38
      });

      y += boxH + 2;
    });

    y += 4;

    // Options
    if (options.length > 0) {
      y = this.renderOptions(options, question.correctAnswer, false, y);
    }

    return y;
  }

  renderOptions(options, correctAnswer, showAnswer, yPos) {
    const { colors, fonts } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    this.checkPage(options.length * 10);
    y = this.doc.lastY || y;

    options.forEach((option, idx) => {
      const isCorrect = showAnswer && idx === correctAnswer;
      const optText = String(option || '').trim() || `Option ${optionLabels[idx]}`;
      
      const optH = this.txt.measure(optText, fonts.option, CW - 28);
      const boxH = Math.max(optH + 7, 10);
      
      this.checkPage(boxH + 3);
      y = this.doc.lastY || y;

      // Option box
      if (isCorrect) {
        this.doc.setFillColor(...colors.successLight);
        this.doc.roundedRect(M + 6, y, CW - 12, boxH, 1.5, 1.5, 'F');
      }

      // Option circle
      if (isCorrect) {
        this.doc.setFillColor(...colors.success);
        this.doc.circle(M + 13, y + boxH / 2, 3.5, 'F');
        this.doc.setTextColor(...colors.white);
      } else {
        this.doc.setDrawColor(...colors.gray400);
        this.doc.setLineWidth(0.5);
        this.doc.circle(M + 13, y + boxH / 2, 3.5, 'S');
        this.doc.setTextColor(...colors.gray600);
        this.doc.setLineWidth(0.2);
      }

      this.doc.setFontSize(fonts.small);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(optionLabels[idx], M + 13, y + boxH / 2 + 1, { align: 'center' });

      // Option text
      this.txt.render(optText, M + 20, y + 3, {
        fontSize: fonts.option,
        bold: isCorrect,
        color: isCorrect ? colors.success : colors.dark,
        maxWidth: CW - 28
      });

      y += boxH + 2;
    });

    return y;
  }

  renderExplanation(explanation, correctAnswer, yPos) {
    const { colors, fonts, spacing } = this.config;
    const M = this.config.margin;
    const CW = this.config.contentWidth;
    let y = yPos;

    const expH = this.txt.measure(explanation, fonts.explanation, CW - 26);
    const boxH = Math.max(expH + 16, 20);

    this.checkPage(boxH + 6);
    y = this.doc.lastY || y;

    this.doc.setFillColor(...colors.successLight);
    this.doc.setDrawColor(...colors.success);
    this.doc.setLineWidth(0.4);
    this.doc.roundedRect(M + 4, y, CW - 8, boxH, 2, 2, 'FD');
    this.doc.setLineWidth(0.2);

    // Header
    this.doc.setFillColor(...colors.success);
    this.doc.roundedRect(M + 4, y, 32, 7, 2, 0, 'F');
    this.doc.rect(M + 4, y + 4, 32, 3, 'F');
    
    this.doc.setFontSize(fonts.small);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...colors.white);
    const label = this.txt.lang === 'hi' ? '✓ व्याख्या' : '✓ EXPLANATION';
    this.doc.text(label, M + 8, y + 5);

    // Answer badge
    this.doc.setFillColor(...colors.success);
    this.doc.roundedRect(CONFIG.pageWidth - M - 28, y + 1, 22, 5, 1, 1, 'F');
    this.doc.setTextColor(...colors.white);
    this.doc.setFontSize(fonts.small - 1);
    const ansLabel = `Ans: (${optionLabels[correctAnswer] || '?'})`;
    this.doc.text(ansLabel, CONFIG.pageWidth - M - 17, y + 4.5, { align: 'center' });

    // Explanation text
    this.txt.render(explanation, M + 10, y + 11, {
      fontSize: fonts.explanation,
      color: colors.gray700,
      maxWidth: CW - 22
    });

    y += boxH + spacing.afterExplanation;
    return y;
  }
}

// ==================== MAIN PDF GENERATOR ====================

export const generateTestPDF = async (test, questions, language = 'en', includeAnswers = false) => {
  const QS = ensureArray(questions);
  if (QS.length === 0) throw new Error('No questions available');

  console.log('📄 PDF Generation Started:', {
    questions: QS.length,
    language,
    includeAnswers
  });

  const doc = new jsPDF('p', 'mm', 'a4');
  const { pageWidth: PW, pageHeight: PH, margin: M, contentWidth: CW, colors, fonts } = CONFIG;
  
  let y = M;
  const txt = new TextRenderer(doc, language);

  // Page management
  const checkPage = (needed = 30) => {
    if (y + needed > PH - 18) {
      doc.addPage();
      y = M;
      drawHeader();
      doc.lastY = y;
      return true;
    }
    doc.lastY = y;
    return false;
  };

  const drawHeader = () => {
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, PW, 2.5, 'F');
    doc.setFillColor(...colors.gray100);
    doc.rect(0, 2.5, PW, 10, 'F');
    
    doc.setFontSize(fonts.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('NETprep', M, 9);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray600);
    doc.text(language === 'hi' ? 'हिंदी' : 'English', PW - M, 9, { align: 'right' });
    
    doc.setDrawColor(...colors.gray300);
    doc.line(0, 12.5, PW, 12.5);
    y = 18;
  };

  // ========== COVER PAGE ==========
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, PW, 65, 'F');
  doc.setFillColor(...colors.accent);
  doc.rect(0, 65, PW, 3, 'F');

  doc.setTextColor(...colors.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('NETprep', PW / 2, 28, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('UGC NET / JRF Exam Preparation', PW / 2, 42, { align: 'center' });

  // Title
  y = 85;
  const titleH = txt.render(test?.title || 'Mock Test', PW / 2, y, {
    fontSize: fonts.title,
    bold: true,
    color: colors.dark,
    maxWidth: CW - 20,
    align: 'center'
  });
  y += Math.max(titleH, 12) + 20;

  // Info cards
  const cardData = [
    { label: 'Paper', value: test?.paper === 'paper1' ? 'Paper 1' : 'Paper 2', color: colors.primary },
    { label: 'Questions', value: String(QS.length), color: colors.accent },
    { label: 'Duration', value: `${test?.duration || 60} min`, color: colors.success },
    { label: 'Marks', value: String(QS.length * (test?.marksPerQuestion || 2)), color: colors.purple }
  ];

  const cardW = (CW - 24) / 2;
  const cardH = 26;

  cardData.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = M + 8 + col * (cardW + 8);
    const cy = y + row * (cardH + 6);

    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.gray300);
    doc.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');
    
    doc.setFillColor(...card.color);
    doc.roundedRect(cx, cy, 4, cardH, 3, 0, 'F');
    doc.rect(cx + 2, cy, 2, cardH, 'F');
    
    doc.setFontSize(fonts.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray600);
    doc.text(card.label, cx + 10, cy + 9);
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.dark);
    doc.text(card.value, cx + 10, cy + 19);
  });

  y += (cardH + 6) * 2 + 15;

  // Instructions
  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.gray300);
  doc.roundedRect(M + 8, y, CW - 16, 50, 3, 3, 'FD');
  
  doc.setFillColor(...colors.primary);
  doc.roundedRect(M + 8, y, CW - 16, 10, 3, 0, 'F');
  doc.rect(M + 8, y + 7, CW - 16, 3, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('INSTRUCTIONS', PW / 2, y + 7, { align: 'center' });
  
  y += 15;

  const instructions = [
    'All questions are compulsory.',
    `Each question: ${test?.marksPerQuestion || 2} marks.`,
    test?.negativeMarking ? `Wrong answer: -${test.negativeMarks || 0.5}` : 'No negative marking.',
    'Circle the correct option.',
    'Use black or blue pen.'
  ];

  instructions.forEach((inst, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(`${i + 1}.`, M + 14, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray700);
    doc.text(inst, M + 20, y);
    y += 6;
  });

  if (includeAnswers) {
    y += 8;
    doc.setFillColor(...colors.successLight);
    doc.setDrawColor(...colors.success);
    doc.setLineWidth(0.5);
    doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'FD');
    doc.setLineWidth(0.2);
    
    doc.setFontSize(fonts.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.success);
    doc.text('✓ Answer Key & Explanations Included', PW / 2, y + 6.5, { align: 'center' });
  }

  // ========== QUESTIONS ==========
  doc.addPage();
  drawHeader();

  doc.setFillColor(...colors.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setFontSize(fonts.sectionHeader);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.white);
  doc.text('QUESTIONS', PW / 2, y + 7, { align: 'center' });
  y += 16;

  // Group questions
  const grouper = new QuestionGrouper(QS);
  const groups = grouper.group();

  console.log('📊 Question Groups:', groups.length);

  // Initialize renderers
  const passageRenderer = new PassageRenderer(doc, txt, checkPage);
  const diRenderer = new DIRenderer(doc, txt, checkPage);
  const questionRenderer = new QuestionRenderer(doc, txt, checkPage, test);

  let globalQuestionNumber = 1;

  groups.forEach(group => {
    if (group.type === 'passage') {
      // Render passage once
      y = passageRenderer.render(group.data, y);
      doc.lastY = y;
      
      // Render all questions under this passage
      group.questions.forEach(q => {
        y = questionRenderer.render(q, globalQuestionNumber++, includeAnswers, y);
        doc.lastY = y;
      });
    } 
    else if (group.type === 'di') {
      // Render DI data once
      y = diRenderer.render(group.data, y);
      doc.lastY = y;
      
      // Render all questions under this DI
      group.questions.forEach(q => {
        y = questionRenderer.render(q, globalQuestionNumber++, includeAnswers, y);
        doc.lastY = y;
      });
    } 
    else {
      // Standalone question
      y = questionRenderer.render(group.question, globalQuestionNumber++, includeAnswers, y);
      doc.lastY = y;
    }
  });

  // ========== ANSWER KEY ==========
  if (includeAnswers) {
    doc.addPage();
    y = M;

    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, PW, 26, 'F');
    doc.setFillColor(...colors.accent);
    doc.rect(0, 26, PW, 2.5, 'F');
    
    doc.setTextColor(...colors.white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANSWER KEY', PW / 2, 13, { align: 'center' });
    
    doc.setFontSize(fonts.small);
    doc.setFont('helvetica', 'normal');
    doc.text(String(test?.title || '').substring(0, 70), PW / 2, 21, { align: 'center' });
    
    y = 36;

    // Answer grid
    const cols = 5;
    const cellW = (CW - 10) / cols;
    const cellH = 10;

    for (let i = 0; i < QS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      if (col === 0 && row > 0) {
        y += cellH;
        if (y + cellH > PH - 25) {
          doc.addPage();
          y = M + 10;
        }
      }
      
      const cx = M + 5 + col * cellW;
      
      doc.setFillColor(...(row % 2 === 0 ? colors.gray100 : colors.white));
      doc.setDrawColor(...colors.gray300);
      doc.rect(cx, y, cellW, cellH, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.dark);
      doc.text(
        `Q${i + 1}: (${optionLabels[QS[i]?.correctAnswer] || '?'})`,
        cx + cellW / 2,
        y + 6.5,
        { align: 'center' }
      );
    }
  }

  // ========== FOOTERS ==========
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    
    doc.setDrawColor(...colors.gray300);
    doc.line(M, PH - 12, PW - M, PH - 12);
    
    doc.setFontSize(fonts.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray500);
    doc.text('NETprep | UGC NET', M, PH - 7);
    doc.text(`Page ${p} / ${totalPages}`, PW / 2, PH - 7, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-IN'), PW - M, PH - 7, { align: 'right' });
  }

  console.log('✅ PDF Generated Successfully');
  return doc;
};

// ==================== DOWNLOAD FUNCTIONS ====================

export const downloadTestPDF = async (test, questions, language = 'en', includeAnswers = false) => {
  try {
    if (!test) throw new Error('Test data required');
    
    const arr = ensureArray(questions);
    if (arr.length === 0) throw new Error('No questions found');
    
    const doc = await generateTestPDF(test, arr, language, includeAnswers);
    
    const safeName = (s) => String(s || 'Test')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const fileName = `${safeName(test.title)}_${language}${includeAnswers ? '_answers' : ''}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
  } catch (err) {
    console.error('❌ PDF Error:', err);
    return { success: false, error: err.message };
  }
};

// ==================== RESULTS PDF ====================

export const generateResultsPDF = async (attempt, test, questions, language = 'en') => {
  const QS = ensureArray(questions);
  if (!attempt) throw new Error('Attempt data required');

  const doc = new jsPDF('p', 'mm', 'a4');
  const { pageWidth: PW, pageHeight: PH, margin: M, contentWidth: CW, colors, fonts } = CONFIG;
  let y = M;

  const totalQ = QS.length || attempt.totalQuestions || 0;
  const correct = attempt.correctCount || 0;
  const wrong = attempt.wrongCount || 0;
  const score = attempt.score || 0;
  const total = attempt.totalMarks || (totalQ * 2);
  const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';
  const pass = parseFloat(percentage) >= 50;

  // Header
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, PW, 42, 'F');
  doc.setFillColor(...colors.accent);
  doc.rect(0, 42, PW, 2.5, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('NETprep', PW / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Test Results', PW / 2, 32, { align: 'center' });

  y = 56;

  const txt = new TextRenderer(doc, language);
  txt.render(test?.title || 'Test', PW / 2, y, {
    fontSize: 13,
    bold: true,
    color: colors.dark,
    maxWidth: CW - 20,
    align: 'center'
  });
  
  y += 20;

  // Score circle
  const cx = PW / 2;
  const cy = y + 18;
  const cr = 18;
  
  doc.setFillColor(...(pass ? colors.successLight : [255, 235, 238]));
  doc.setDrawColor(...(pass ? colors.success : colors.danger));
  doc.setLineWidth(1.5);
  doc.circle(cx, cy, cr, 'FD');
  doc.setLineWidth(0.2);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(pass ? colors.success : colors.danger));
  doc.text(`${percentage}%`, cx, cy + 3, { align: 'center' });
  
  doc.setFontSize(fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.gray500);
  doc.text(`${score} / ${total}`, cx, cy + cr + 6, { align: 'center' });
  
  y = cy + cr + 15;

  // Stats
  const stats = [
    { label: 'Total Questions', value: String(totalQ), color: colors.dark },
    { label: 'Correct', value: String(correct), color: colors.success },
    { label: 'Wrong', value: String(wrong), color: colors.danger },
    { label: 'Skipped', value: String(totalQ - correct - wrong), color: colors.gray600 }
  ];

  const statsX = M + 30;
  const statsW = CW - 60;
  const statsH = 9;

  stats.forEach((stat, i) => {
    const ry = y + i * statsH;
    
    doc.setFillColor(...(i % 2 === 0 ? colors.gray100 : colors.white));
    doc.rect(statsX, ry, statsW, statsH, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.gray700);
    doc.text(stat.label, statsX + 5, ry + 6);
    
    doc.setTextColor(...stat.color);
    doc.text(stat.value, statsX + statsW - 5, ry + 6, { align: 'right' });
  });

  // Footers
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    
    doc.setDrawColor(...colors.gray300);
    doc.line(M, PH - 12, PW - M, PH - 12);
    
    doc.setFontSize(fonts.small);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.gray400);
    doc.text('NETprep', M, PH - 7);
    doc.text(`Page ${p}/${totalPages}`, PW / 2, PH - 7, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-IN'), PW - M, PH - 7, { align: 'right' });
  }

  return doc;
};

export const downloadResultsPDF = async (attempt, test, questions, language = 'en') => {
  try {
    if (!attempt) throw new Error('Attempt data required');
    
    const doc = await generateResultsPDF(attempt, test, questions, language);
    
    const safeName = (s) => String(s || 'Test')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const fileName = `${safeName(test?.title)}_Result_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName };
  } catch (err) {
    console.error('❌ PDF Error:', err);
    return { success: false, error: err.message };
  }
};

export default {
  generateTestPDF,
  downloadTestPDF,
  generateResultsPDF,
  downloadResultsPDF
};