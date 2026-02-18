// client/src/utils/pdfExport.js

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== HELPERS ====================

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.questions)) return data.questions;
    if (Array.isArray(data.data?.questions)) return data.data.questions;
  }
  return [];
};

const getLocalizedText = (textObj, lang = 'en', fallback = '') => {
  if (!textObj) return fallback;
  if (typeof textObj === 'string') return textObj;
  if (lang === 'hi') return textObj.hi || textObj.en || textObj.hindi || textObj.english || fallback;
  return textObj.en || textObj.hi || textObj.english || textObj.hindi || fallback;
};

const formatDuration = (min) => {
  if (!min) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const safeName = (s) => String(s || 'Test').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 50);

const containsHindi = (text) => {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(String(text));
};

// ==================== COLORS ====================

const C = {
  primary: [13, 71, 161],
  primaryLight: [227, 242, 253],
  accent: [255, 152, 0],
  success: [46, 125, 50],
  successLight: [232, 245, 233],
  danger: [198, 40, 40],
  dangerLight: [255, 235, 238],
  dark: [33, 33, 33],
  gray700: [66, 66, 66],
  gray600: [97, 97, 97],
  gray500: [117, 117, 117],
  gray400: [158, 158, 158],
  gray300: [224, 224, 224],
  gray200: [238, 238, 238],
  gray100: [245, 245, 245],
  white: [255, 255, 255],
  black: [0, 0, 0],
  optionA: [21, 101, 192],
  optionB: [0, 121, 107],
  optionC: [123, 31, 162],
  optionD: [230, 81, 0],
};

// ==================== CANVAS TEXT RENDERER ====================

const renderTextToCanvas = (text, options = {}) => {
  const {
    fontSize = 10,
    bold = false,
    color = '#212121',
    maxWidth = 170,
    lineHeight = 1.5
  } = options;

  const safe = String(text || '').replace(/[\r\n]+/g, ' ').trim();
  if (!safe) return { dataUrl: null, width: 0, height: 0, lines: 0 };

  const scale = 4;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const fontStack = '"Noto Sans Devanagari", "Mangal", "Nirmala UI", "Aparajita", "Kokila", "Arial Unicode MS", sans-serif';
  const weight = bold ? 'bold' : 'normal';
  const scaledSize = fontSize * scale;
  ctx.font = `${weight} ${scaledSize}px ${fontStack}`;

  const maxPx = maxWidth * scale;
  const words = safe.split(/\s+/);
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxPx && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  });
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push('');

  const lh = scaledSize * lineHeight;
  const pad = scaledSize * 0.15;

  let maxW = 0;
  lines.forEach(l => {
    const w = ctx.measureText(l).width;
    if (w > maxW) maxW = w;
  });

  canvas.width = Math.ceil(Math.min(maxW + pad * 2, maxPx + pad * 2));
  canvas.height = Math.ceil(lines.length * lh + pad * 2);

  ctx.font = `${weight} ${scaledSize}px ${fontStack}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    ctx.fillText(line, pad, pad + i * lh);
  });

  return {
    dataUrl: canvas.toDataURL('image/png', 1.0),
    width: canvas.width / scale,
    height: canvas.height / scale,
    lines: lines.length
  };
};

// ==================== PDF TEXT HELPER CLASS ====================

class PDFTextHelper {
  constructor(doc, language) {
    this.doc = doc;
    this.language = language;
    this.useCanvas = language === 'hi';
  }

  render(text, x, y, options = {}) {
    const {
      fontSize = 10,
      bold = false,
      color = C.dark,
      maxWidth = 180,
      align = 'left',
      lineHeight = 1.5
    } = options;

    const safe = String(text || '').trim();
    if (!safe) return 0;

    const colorStr = `rgb(${color[0]},${color[1]},${color[2]})`;
    const hasHindi = containsHindi(safe);

    if (hasHindi) {
      const result = renderTextToCanvas(safe, {
        fontSize,
        bold,
        color: colorStr,
        maxWidth,
        lineHeight
      });

      if (result.dataUrl && result.height > 0) {
        let imgX = x;
        if (align === 'center') imgX = x - result.width / 2;
        else if (align === 'right') imgX = x - result.width;
        
        this.doc.addImage(result.dataUrl, 'PNG', imgX, y - fontSize * 0.25, result.width, result.height);
        return result.height;
      }
    }

    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);

    const lines = this.doc.splitTextToSize(safe, maxWidth);
    const lh = fontSize * 0.35 * lineHeight;

    lines.forEach((line, i) => {
      const opts = align !== 'left' ? { align } : undefined;
      this.doc.text(line, x, y + i * lh, opts);
    });

    return lines.length * lh;
  }

  measureHeight(text, fontSize = 10, maxWidth = 180, lineHeight = 1.5) {
    const safe = String(text || '').trim();
    if (!safe) return 0;

    if (containsHindi(safe)) {
      const result = renderTextToCanvas(safe, { fontSize, maxWidth, lineHeight });
      return result.height;
    }

    this.doc.setFontSize(fontSize);
    const lines = this.doc.splitTextToSize(safe, maxWidth);
    return lines.length * fontSize * 0.35 * lineHeight;
  }
}

// ==================== GENERATE TEST PDF ====================

export const generateTestPDF = async (test, questions, language = 'en', includeAnswers = false) => {
  const QS = ensureArray(questions);
  if (QS.length === 0) throw new Error('No questions available');

  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = PW - M * 2;
  let y = M;

  const txt = new PDFTextHelper(doc, language);

  // Page management
  const checkPage = (need = 30) => {
    if (y + need > PH - 18) {
      doc.addPage();
      y = M;
      drawHeader();
      return true;
    }
    return false;
  };

  const drawHeader = () => {
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, PW, 2.5, 'F');
    doc.setFillColor(...C.gray100);
    doc.rect(0, 2.5, PW, 10, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text('NETprep', M, 9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray600);
    doc.text(language === 'hi' ? 'Hindi' : 'English', PW - M, 9, { align: 'right' });
    doc.setDrawColor(...C.gray300);
    doc.line(0, 12.5, PW, 12.5);
    y = 18;
  };

  const addFooters = () => {
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setDrawColor(...C.gray300);
      doc.line(M, PH - 12, PW - M, PH - 12);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.gray500);
      doc.text('NETprep | UGC NET', M, PH - 7);
      doc.text(`Page ${p} / ${total}`, PW / 2, PH - 7, { align: 'center' });
      doc.text(new Date().toLocaleDateString('en-IN'), PW - M, PH - 7, { align: 'right' });
    }
  };

  // ============ COVER PAGE ============
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, PW, 65, 'F');
  doc.setFillColor(...C.accent);
  doc.rect(0, 65, PW, 3, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('NETprep', PW / 2, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('UGC NET / JRF Exam Preparation', PW / 2, 42, { align: 'center' });

  doc.setFillColor(...C.white);
  for (let i = 0; i < 3; i++) {
    doc.circle(PW / 2 - 6 + i * 6, 52, 1, 'F');
  }

  // Title
  y = 85;
  doc.setFillColor(...C.gray100);
  doc.roundedRect(M + 8, y - 10, CW - 16, 24, 3, 3, 'F');

  const titleH = txt.render(test?.title || 'Mock Test', PW / 2, y, {
    fontSize: 15,
    bold: true,
    color: C.dark,
    maxWidth: CW - 30,
    align: 'center'
  });
  y += Math.max(titleH, 12) + 16;

  // Info cards
  const cardW = (CW - 24) / 2;
  const cardH = 26;
  const paperText = test?.paper === 'paper1' ? 'Paper 1' : 'Paper 2';

  const cards = [
    { label: 'Paper', value: paperText, color: C.primary },
    { label: 'Questions', value: String(QS.length), color: C.accent },
    { label: 'Duration', value: formatDuration(test?.duration || 60), color: C.success },
    { label: 'Marks', value: String(QS.length * (test?.marksPerQuestion || 2)), color: C.optionC }
  ];

  cards.forEach((card, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = M + 8 + col * (cardW + 8);
    const cy = y + row * (cardH + 6);

    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.gray300);
    doc.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');

    doc.setFillColor(...card.color);
    doc.roundedRect(cx, cy, 4, cardH, 3, 0, 'F');
    doc.rect(cx + 2, cy, 2, cardH, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray600);
    doc.text(card.label, cx + 10, cy + 9);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.dark);
    doc.text(card.value, cx + 10, cy + 19);
  });

  y += (cardH + 6) * 2 + 10;

  // Metadata
  doc.setFillColor(...C.gray100);
  doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gray600);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, M + 14, y + 6.5);
  doc.text(`Language: ${language === 'hi' ? 'Hindi' : 'English'}`, PW / 2, y + 6.5, { align: 'center' });
  doc.text(`Type: ${(test?.testType || 'practice').toUpperCase()}`, PW - M - 14, y + 6.5, { align: 'right' });
  y += 16;

  // Negative marking
  if (test?.negativeMarking) {
    doc.setFillColor(...C.dangerLight);
    doc.setDrawColor(...C.danger);
    doc.setLineWidth(0.5);
    doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'FD');
    doc.setLineWidth(0.2);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.danger);
    doc.text(`Negative Marking: -${test.negativeMarks || 0.5} per wrong answer`, PW / 2, y + 6.5, { align: 'center' });
    y += 16;
  }

  // Instructions
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.gray300);
  doc.roundedRect(M + 8, y, CW - 16, 50, 3, 3, 'FD');

  doc.setFillColor(...C.primary);
  doc.roundedRect(M + 8, y, CW - 16, 10, 3, 0, 'F');
  doc.rect(M + 8, y + 7, CW - 16, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('INSTRUCTIONS', PW / 2, y + 7, { align: 'center' });
  y += 15;

  const rules = [
    `Total: ${QS.length} Questions | ${QS.length * (test?.marksPerQuestion || 2)} Marks`,
    'All questions are compulsory.',
    test?.negativeMarking ? `Wrong answer: -${test.negativeMarks || 0.5}` : 'No negative marking.',
    'Circle the correct option (A/B/C/D).',
    'Use black or blue pen only.'
  ];

  doc.setFontSize(8);
  doc.setTextColor(...C.gray700);
  rules.forEach((r, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text(`${i + 1}.`, M + 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray700);
    doc.text(r, M + 20, y);
    y += 6;
  });

  // Answer key notice
  if (includeAnswers) {
    y += 8;
    doc.setFillColor(...C.successLight);
    doc.setDrawColor(...C.success);
    doc.setLineWidth(0.5);
    doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'FD');
    doc.setLineWidth(0.2);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.success);
    doc.text('Answer Key & Explanations included at the end', PW / 2, y + 6.5, { align: 'center' });
  }

  // ============ QUESTIONS ============
  doc.addPage();
  drawHeader();

  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('QUESTIONS', PW / 2, y + 7, { align: 'center' });
  y += 16;

  const optLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const optColors = [C.optionA, C.optionB, C.optionC, C.optionD, C.gray600, C.gray600];

  QS.forEach((q, idx) => {
    if (!q) return;

    const qText = getLocalizedText(q.question, language, `Question ${idx + 1}`);
    const estH = txt.measureHeight(qText, 10, CW - 35) + 50;
    checkPage(Math.min(estH, 70));

    const num = idx + 1;

    // Question number badge
    doc.setFillColor(...C.primary);
    doc.roundedRect(M, y - 4, 14, 7, 1.5, 1.5, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Q${num}`, M + 7, y, { align: 'center' });

    // Marks badge
    doc.setFillColor(...C.accent);
    doc.roundedRect(M + 16, y - 4, 12, 7, 1.5, 1.5, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(7);
    doc.text(`${test?.marksPerQuestion || 2}M`, M + 22, y, { align: 'center' });

    // Question text
    const qH = txt.render(qText, M + 32, y, {
      fontSize: 10,
      bold: false,
      color: C.dark,
      maxWidth: CW - 36,
      lineHeight: 1.6
    });
    y += Math.max(qH, 5) + 5;

    // Match Following
    if (q.questionType === 'match_following' && q.matchData) {
      checkPage(60);

      const listA = ensureArray(getLocalizedText(q.matchData?.listA, language, []));
      const listB = ensureArray(getLocalizedText(q.matchData?.listB, language, []));

      if (listA.length > 0 || listB.length > 0) {
        const tblX = M + 10;
        const tblW = CW - 20;
        const colW = tblW / 2;
        const rowH = 10;
        const maxLen = Math.max(listA.length, listB.length);
        const labels = ['(a)', '(b)', '(c)', '(d)', '(e)'];
        const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)'];

        // Header
        doc.setFillColor(...C.primary);
        doc.rect(tblX, y, tblW, 8, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.white);
        doc.text('List - I', tblX + colW / 2, y + 5.5, { align: 'center' });
        doc.text('List - II', tblX + colW + colW / 2, y + 5.5, { align: 'center' });
        y += 8;

        for (let i = 0; i < maxLen; i++) {
          checkPage(rowH + 5);

          const bgColor = i % 2 === 0 ? C.gray100 : C.white;
          doc.setFillColor(...bgColor);
          doc.rect(tblX, y, tblW, rowH, 'F');
          doc.setDrawColor(...C.gray300);
          doc.rect(tblX, y, tblW, rowH, 'S');
          doc.line(tblX + colW, y, tblX + colW, y + rowH);

          const aText = `${labels[i] || ''} ${listA[i] || ''}`;
          txt.render(aText, tblX + 3, y + 3, {
            fontSize: 8,
            color: C.dark,
            maxWidth: colW - 6,
            lineHeight: 1.3
          });

          const bText = `${romans[i] || ''} ${listB[i] || ''}`;
          txt.render(bText, tblX + colW + 3, y + 3, {
            fontSize: 8,
            color: C.dark,
            maxWidth: colW - 6,
            lineHeight: 1.3
          });

          y += rowH;
        }
        y += 5;
      }
    }

    // Assertion-Reason
    if (q.questionType === 'assertion_reason') {
      const assertion = getLocalizedText(q.assertion, language, '');
      const reason = getLocalizedText(q.reason, language, '');

      if (assertion) {
        checkPage(30);
        doc.setFillColor(...C.primaryLight);
        doc.setDrawColor(...C.primary);
        doc.setLineWidth(0.3);
        doc.roundedRect(M + 6, y - 2, CW - 12, 8, 1.5, 1.5, 'FD');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.primary);
        doc.text('Assertion (A):', M + 10, y + 3.5);
        doc.setLineWidth(0.2);
        y += 10;

        const aH = txt.render(assertion, M + 10, y, {
          fontSize: 9,
          color: C.gray700,
          maxWidth: CW - 24,
          lineHeight: 1.5
        });
        y += Math.max(aH, 4) + 5;
      }

      if (reason) {
        checkPage(30);
        doc.setFillColor(255, 248, 225);
        doc.setDrawColor(...C.accent);
        doc.setLineWidth(0.3);
        doc.roundedRect(M + 6, y - 2, CW - 12, 8, 1.5, 1.5, 'FD');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.accent);
        doc.text('Reason (R):', M + 10, y + 3.5);
        doc.setLineWidth(0.2);
        y += 10;

        const rH = txt.render(reason, M + 10, y, {
          fontSize: 9,
          color: C.gray700,
          maxWidth: CW - 24,
          lineHeight: 1.5
        });
        y += Math.max(rH, 4) + 5;
      }
    }

    // Options
    const options = ensureArray(getLocalizedText(q.options, language, []));

    if (options.length > 0) {
      checkPage(25);

      options.forEach((opt, i) => {
        if (i >= optLabels.length) return;
        checkPage(12);

        const isCorrect = includeAnswers && i === q.correctAnswer;
        const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.en || opt?.hi || String(opt));

        if (isCorrect) {
          doc.setFillColor(...C.successLight);
          doc.roundedRect(M + 4, y - 3.5, CW - 8, 10, 1.5, 1.5, 'F');
        }

        if (isCorrect) {
          doc.setFillColor(...C.success);
          doc.circle(M + 12, y, 3.5, 'F');
          doc.setTextColor(...C.white);
        } else {
          doc.setDrawColor(...(optColors[i] || C.gray500));
          doc.setLineWidth(0.5);
          doc.circle(M + 12, y, 3.5, 'S');
          doc.setTextColor(...(optColors[i] || C.gray500));
          doc.setLineWidth(0.2);
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(optLabels[i], M + 12, y + 1, { align: 'center' });

        const oH = txt.render(optText, M + 20, y, {
          fontSize: 9.5,
          bold: isCorrect,
          color: isCorrect ? C.success : C.dark,
          maxWidth: CW - 26,
          lineHeight: 1.5
        });

        y += Math.max(oH, 5) + 3;
      });
    }

    // Explanation
    if (includeAnswers && q.explanation) {
      const expText = getLocalizedText(q.explanation, language, '');
      if (expText) {
        checkPage(25);

        const expH = txt.measureHeight(expText, 8.5, CW - 28, 1.5);
        const boxH = Math.max(18, expH + 14);

        doc.setFillColor(...C.successLight);
        doc.setDrawColor(...C.success);
        doc.setLineWidth(0.4);
        doc.roundedRect(M + 4, y, CW - 8, boxH, 2, 2, 'FD');
        doc.setLineWidth(0.2);

        doc.setFillColor(...C.success);
        doc.roundedRect(M + 4, y, 28, 7, 2, 0, 'F');
        doc.rect(M + 4, y + 4, 28, 3, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.white);
        doc.text('EXPLANATION', M + 8, y + 5);

        const ansLabel = optLabels[q.correctAnswer] || '?';
        doc.setFillColor(...C.success);
        doc.roundedRect(PW - M - 28, y + 1, 22, 5, 1, 1, 'F');
        doc.setFontSize(7);
        doc.text(`Ans: (${ansLabel})`, PW - M - 17, y + 4.5, { align: 'center' });

        txt.render(expText, M + 10, y + 11, {
          fontSize: 8.5,
          color: C.gray700,
          maxWidth: CW - 22,
          lineHeight: 1.5
        });

        y += boxH + 4;
      }
    }

    y += 3;

    if (idx < QS.length - 1) {
      doc.setDrawColor(...C.gray300);
      doc.setLineDashPattern([2, 1.5], 0);
      doc.line(M + 3, y, PW - M - 3, y);
      doc.setLineDashPattern([], 0);
      y += 6;
    }
  });

  // ============ ANSWER KEY ============
  if (includeAnswers) {
    doc.addPage();
    y = M;

    doc.setFillColor(...C.primary);
    doc.rect(0, 0, PW, 26, 'F');
    doc.setFillColor(...C.accent);
    doc.rect(0, 26, PW, 2.5, 'F');

    doc.setTextColor(...C.white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANSWER KEY', PW / 2, 13, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(String(test?.title || '').substring(0, 70), PW / 2, 21, { align: 'center' });

    y = 36;

    const cols = 5;
    const cellW = (CW - 10) / cols;
    const cellH = 10;
    const optL = ['A', 'B', 'C', 'D', 'E'];

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
      const cy = y;

      doc.setFillColor(...(row % 2 === 0 ? C.gray100 : C.white));
      doc.setDrawColor(...C.gray300);
      doc.rect(cx, cy, cellW, cellH, 'FD');

      const q = QS[i];
      const ans = optL[q?.correctAnswer] || '?';
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.dark);
      doc.text(`Q${i + 1}: (${ans})`, cx + cellW / 2, cy + 6.5, { align: 'center' });
    }

    y += cellH + 12;

    doc.setFillColor(...C.primaryLight);
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(M + 15, y, CW - 30, 16, 3, 3, 'FD');
    doc.setLineWidth(0.2);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.primary);
    doc.text('Summary', PW / 2, y + 6, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray700);
    doc.text(
      `Questions: ${QS.length} | Marks: ${QS.length * (test?.marksPerQuestion || 2)} | Duration: ${formatDuration(test?.duration || 60)}`,
      PW / 2, y + 12, { align: 'center' }
    );
  }

  addFooters();
  return doc;
};

// ==================== DOWNLOAD FUNCTIONS ====================

export const downloadTestPDF = async (test, questions, language = 'en', includeAnswers = false) => {
  try {
    if (!test) throw new Error('Test data required');
    const arr = ensureArray(questions);
    if (arr.length === 0) throw new Error('No questions found');

    const doc = await generateTestPDF(test, arr, language, includeAnswers);
    const fn = `${safeName(test.title)}_${language}${includeAnswers ? '_answers' : ''}.pdf`;
    doc.save(fn);
    return { success: true, fileName: fn };
  } catch (err) {
    console.error('PDF error:', err);
    return { success: false, error: err.message };
  }
};

export const generateResultsPDF = async (attempt, test, questions, language = 'en') => {
  const QS = ensureArray(questions);
  if (!attempt) throw new Error('Attempt data required');

  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = PW - M * 2;
  let y = M;

  const txt = new PDFTextHelper(doc, language);

  const totalQ = QS.length || attempt.totalQuestions || 0;
  const correct = attempt.correctCount || 0;
  const wrong = attempt.wrongCount || 0;
  const skipped = attempt.skippedCount || (totalQ - correct - wrong);
  const score = attempt.score || 0;
  const total = attempt.totalMarks || (totalQ * 2);
  const pct = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';
  const acc = (correct + wrong) > 0 ? ((correct / (correct + wrong)) * 100).toFixed(1) : '0.0';
  const pass = parseFloat(pct) >= 50;

  // Header
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, PW, 42, 'F');
  doc.setFillColor(...C.accent);
  doc.rect(0, 42, PW, 2.5, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('NETprep', PW / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Test Results Report', PW / 2, 32, { align: 'center' });

  y = 56;

  const titleH = txt.render(test?.title || 'Test', PW / 2, y, {
    fontSize: 13,
    bold: true,
    color: C.dark,
    maxWidth: CW - 20,
    align: 'center'
  });
  y += Math.max(titleH, 8) + 15;

  // Score circle
  const cx = PW / 2;
  const cy = y + 18;
  const cr = 18;

  doc.setFillColor(...(pass ? C.successLight : C.dangerLight));
  doc.setDrawColor(...(pass ? C.success : C.danger));
  doc.setLineWidth(1.5);
  doc.circle(cx, cy, cr, 'FD');
  doc.setLineWidth(0.2);

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(pass ? C.success : C.danger));
  doc.text(`${pct}%`, cx, cy + 3, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gray500);
  doc.text(`${score} / ${total} marks`, cx, cy + cr + 6, { align: 'center' });

  y = cy + cr + 15;

  // Stats
  const stats = [
    { label: 'Total Questions', value: String(totalQ), color: C.dark },
    { label: 'Correct', value: String(correct), color: C.success },
    { label: 'Wrong', value: String(wrong), color: C.danger },
    { label: 'Skipped', value: String(skipped), color: C.gray600 },
    { label: 'Accuracy', value: `${acc}%`, color: C.primary },
    { label: 'Time Taken', value: formatDuration(attempt.timeTaken || 0), color: C.dark }
  ];

  const tblX = M + 30;
  const tblW = CW - 60;
  const rowH = 9;

  stats.forEach((stat, i) => {
    const ry = y + i * rowH;
    doc.setFillColor(...(i % 2 === 0 ? C.gray100 : C.white));
    doc.rect(tblX, ry, tblW, rowH, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.gray700);
    doc.text(stat.label, tblX + 5, ry + 6);

    doc.setTextColor(...stat.color);
    doc.text(stat.value, tblX + tblW - 5, ry + 6, { align: 'right' });
  });

  y += stats.length * rowH + 12;

  // Analysis
  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('QUESTION-WISE ANALYSIS', PW / 2, y + 7, { align: 'center' });
  y += 14;

  const optL = ['A', 'B', 'C', 'D', 'E'];
  const aCols = 4;
  const aColW = (CW - 10) / aCols;
  const aRowH = 8;

  doc.setFillColor(...C.primary);
  doc.rect(M + 5, y, CW - 10, aRowH, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.white);
  doc.text('Q.No', M + 5 + aColW * 0.5, y + 5.5, { align: 'center' });
  doc.text('Your Ans', M + 5 + aColW * 1.5, y + 5.5, { align: 'center' });
  doc.text('Correct', M + 5 + aColW * 2.5, y + 5.5, { align: 'center' });
  doc.text('Result', M + 5 + aColW * 3.5, y + 5.5, { align: 'center' });
  y += aRowH;

  QS.forEach((q, i) => {
    if (y + aRowH > PH - 20) {
      doc.addPage();
      y = M + 10;
    }

    const ans = attempt.answers?.find(a => String(a.questionId) === String(q._id));
    const yourAns = ans?.selectedAnswer >= 0 ? `(${optL[ans.selectedAnswer]})` : '--';
    const correctAns = `(${optL[q.correctAnswer] || '?'})`;
    let status = '--';
    let statusColor = C.gray500;
    if (ans) {
      if (ans.isCorrect) {
        status = 'CORRECT';
        statusColor = C.success;
      } else if (ans.selectedAnswer >= 0) {
        status = 'WRONG';
        statusColor = C.danger;
      }
    }

    const ry = y;
    doc.setFillColor(...(i % 2 === 0 ? C.gray100 : C.white));
    doc.rect(M + 5, ry, CW - 10, aRowH, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.dark);
    doc.text(String(i + 1), M + 5 + aColW * 0.5, ry + 5.5, { align: 'center' });
    doc.text(yourAns, M + 5 + aColW * 1.5, ry + 5.5, { align: 'center' });
    doc.text(correctAns, M + 5 + aColW * 2.5, ry + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...statusColor);
    doc.text(status, M + 5 + aColW * 3.5, ry + 5.5, { align: 'center' });

    y += aRowH;
  });

  // Footers
  const total2 = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total2; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.gray300);
    doc.line(M, PH - 12, PW - M, PH - 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray400);
    doc.text('NETprep | Result', M, PH - 7);
    doc.text(`Page ${p} / ${total2}`, PW / 2, PH - 7, { align: 'center' });
    doc.text(new Date().toLocaleDateString('en-IN'), PW - M, PH - 7, { align: 'right' });
  }

  return doc;
};

export const downloadResultsPDF = async (attempt, test, questions, language = 'en') => {
  try {
    if (!attempt) throw new Error('Attempt data required');
    const doc = await generateResultsPDF(attempt, test, questions, language);
    const fn = `${safeName(test?.title)}_Result_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fn);
    return { success: true, fileName: fn };
  } catch (err) {
    console.error('PDF error:', err);
    return { success: false, error: err.message };
  }
};

export default {
  generateTestPDF,
  downloadTestPDF,
  generateResultsPDF,
  downloadResultsPDF
};