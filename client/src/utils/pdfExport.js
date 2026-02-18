// client/src/utils/pdfExport.js
// COMPLETE FILE - Copy paste and replace entirely

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== HELPERS ====================

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.questions)) return data.questions;
    if (Array.isArray(data.data?.questions)) return data.data.questions;
    if (Array.isArray(data.test?.questions)) return data.test.questions;
  }
  return [];
};

const getText = (obj, lang = 'en', fallback = '') => {
  if (!obj) return fallback;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'object') {
    if (lang === 'hi') {
      return obj.hi || obj.hindi || obj.en || obj.english ||
             obj.text || obj.value || obj.content || obj.label || fallback;
    }
    return obj.en || obj.english || obj.hi || obj.hindi ||
           obj.text || obj.value || obj.content || obj.label || fallback;
  }
  return fallback;
};

const getQuestionText = (q, lang) => {
  if (!q) return '';
  // Try all possible field names
  const fields = ['question', 'questionText', 'text', 'title', 'stem', 'prompt', 'body'];
  for (const field of fields) {
    if (q[field]) {
      const val = getText(q[field], lang, '');
      if (val) return val;
    }
  }
  return '';
};

const getOptions = (q, lang) => {
  if (!q) return [];
  const raw = q.options;

  if (Array.isArray(raw)) {
    return raw.map(opt => {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'number') return String(opt);
      if (opt && typeof opt === 'object') {
        return getText(opt, lang, '') || opt.text || opt.value || opt.label || JSON.stringify(opt);
      }
      return String(opt || '');
    });
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const localized = raw[lang] || raw.en || raw.hi;
    if (Array.isArray(localized)) {
      return localized.map(o => typeof o === 'string' ? o : getText(o, lang, ''));
    }
  }

  return [];
};

const getExplanation = (q, lang) => {
  if (!q) return '';
  const fields = ['explanation', 'solution', 'hint', 'rationale', 'answer_explanation'];
  for (const field of fields) {
    if (q[field]) {
      const val = getText(q[field], lang, '');
      if (val) return val;
    }
  }
  return '';
};

const formatDuration = (min) => {
  if (!min) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const safeName = (s) => String(s || 'Test').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 50);

const containsHindi = (text) => /[\u0900-\u097F]/.test(String(text || ''));

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
  optA: [21, 101, 192],
  optB: [0, 121, 107],
  optC: [123, 31, 162],
  optD: [230, 81, 0],
};

// ==================== CANVAS TEXT ====================

const canvasText = (text, opts = {}) => {
  const { fontSize = 10, bold = false, color = '#212121', maxWidth = 170, lineHeight = 1.5 } = opts;
  const safe = String(text || '').replace(/[\r\n]+/g, ' ').trim();
  if (!safe) return { dataUrl: null, width: 0, height: 0, lines: 0 };

  const scale = 4;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fonts = '"Noto Sans Devanagari","Mangal","Nirmala UI","Aparajita","Kokila","Arial Unicode MS",sans-serif';
  const weight = bold ? 'bold' : 'normal';
  const sz = fontSize * scale;
  ctx.font = `${weight} ${sz}px ${fonts}`;

  const maxPx = maxWidth * scale;
  const words = safe.split(/\s+/);
  const lines = [];
  let cur = '';

  words.forEach(w => {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxPx && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  });
  if (cur) lines.push(cur);
  if (!lines.length) lines.push('');

  const lh = sz * lineHeight;
  const pad = sz * 0.15;
  let mw = 0;
  lines.forEach(l => { const w = ctx.measureText(l).width; if (w > mw) mw = w; });

  canvas.width = Math.ceil(Math.min(mw + pad * 2, maxPx + pad * 2));
  canvas.height = Math.ceil(lines.length * lh + pad * 2);

  ctx.font = `${weight} ${sz}px ${fonts}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => ctx.fillText(line, pad, pad + i * lh));

  return {
    dataUrl: canvas.toDataURL('image/png', 1.0),
    width: canvas.width / scale,
    height: canvas.height / scale,
    lines: lines.length
  };
};

// ==================== TEXT HELPER CLASS ====================

class TXT {
  constructor(doc, lang) {
    this.doc = doc;
    this.lang = lang;
  }

  render(text, x, y, opts = {}) {
    const { fontSize = 10, bold = false, color = C.dark, maxWidth = 180, align = 'left', lineHeight = 1.5 } = opts;
    const safe = String(text || '').trim();
    if (!safe) return 0;

    const colorStr = `rgb(${color[0]},${color[1]},${color[2]})`;

    // Hindi → canvas
    if (containsHindi(safe)) {
      const r = canvasText(safe, { fontSize, bold, color: colorStr, maxWidth, lineHeight });
      if (r.dataUrl && r.height > 0) {
        let ix = x;
        if (align === 'center') ix = x - r.width / 2;
        else if (align === 'right') ix = x - r.width;
        this.doc.addImage(r.dataUrl, 'PNG', ix, y - fontSize * 0.25, r.width, r.height);
        return r.height;
      }
    }

    // English → helvetica
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);
    const lines = this.doc.splitTextToSize(safe, maxWidth);
    const lh = fontSize * 0.35 * lineHeight;
    lines.forEach((line, i) => {
      this.doc.text(line, x, y + i * lh, align !== 'left' ? { align } : undefined);
    });
    return lines.length * lh;
  }

  measure(text, fontSize = 10, maxWidth = 180, lineHeight = 1.5) {
    const safe = String(text || '').trim();
    if (!safe) return 0;
    if (containsHindi(safe)) return canvasText(safe, { fontSize, maxWidth, lineHeight }).height;
    this.doc.setFontSize(fontSize);
    return this.doc.splitTextToSize(safe, maxWidth).length * fontSize * 0.35 * lineHeight;
  }
}

// ==================== GENERATE TEST PDF ====================

export const generateTestPDF = async (test, questions, language = 'en', includeAnswers = false) => {
  const QS = ensureArray(questions);
  if (QS.length === 0) throw new Error('No questions available');

  // Debug: log first question structure
  console.log('PDF: First question structure:', JSON.stringify(QS[0], null, 2).substring(0, 500));

  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 14;
  const CW = PW - M * 2;
  let y = M;
  const t = new TXT(doc, language);
  const optLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const optColors = [C.optA, C.optB, C.optC, C.optD, C.gray600, C.gray600];

  // ---- Page helpers ----
  const checkPage = (need = 30) => {
    if (y + need > PH - 18) { doc.addPage(); y = M; drawHdr(); return true; }
    return false;
  };

  const drawHdr = () => {
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
  for (let i = 0; i < 3; i++) doc.circle(PW / 2 - 6 + i * 6, 52, 1, 'F');

  // Title
  y = 85;
  doc.setFillColor(...C.gray100);
  doc.roundedRect(M + 8, y - 10, CW - 16, 24, 3, 3, 'F');
  const titleH = t.render(test?.title || 'Mock Test', PW / 2, y, {
    fontSize: 15, bold: true, color: C.dark, maxWidth: CW - 30, align: 'center'
  });
  y += Math.max(titleH, 12) + 16;

  // Info cards
  const cW = (CW - 24) / 2, cH = 26;
  const paperTxt = test?.paper === 'paper1' ? 'Paper 1' : 'Paper 2';
  [
    { l: 'Paper', v: paperTxt, c: C.primary },
    { l: 'Questions', v: String(QS.length), c: C.accent },
    { l: 'Duration', v: formatDuration(test?.duration || 60), c: C.success },
    { l: 'Marks', v: String(QS.length * (test?.marksPerQuestion || 2)), c: C.optC }
  ].forEach((card, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = M + 8 + col * (cW + 8), cy = y + row * (cH + 6);
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.gray300);
    doc.roundedRect(cx, cy, cW, cH, 3, 3, 'FD');
    doc.setFillColor(...card.c);
    doc.roundedRect(cx, cy, 4, cH, 3, 0, 'F');
    doc.rect(cx + 2, cy, 2, cH, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray600);
    doc.text(card.l, cx + 10, cy + 9);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
    doc.text(card.v, cx + 10, cy + 19);
  });
  y += (cH + 6) * 2 + 10;

  // Meta
  doc.setFillColor(...C.gray100);
  doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray600);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, M + 14, y + 6.5);
  doc.text(`Language: ${language === 'hi' ? 'Hindi' : 'English'}`, PW / 2, y + 6.5, { align: 'center' });
  y += 16;

  if (test?.negativeMarking) {
    doc.setFillColor(...C.dangerLight); doc.setDrawColor(...C.danger); doc.setLineWidth(0.5);
    doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'FD'); doc.setLineWidth(0.2);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.danger);
    doc.text(`Negative Marking: -${test.negativeMarks || 0.5}`, PW / 2, y + 6.5, { align: 'center' });
    y += 16;
  }

  // Instructions box
  doc.setFillColor(...C.white); doc.setDrawColor(...C.gray300);
  doc.roundedRect(M + 8, y, CW - 16, 50, 3, 3, 'FD');
  doc.setFillColor(...C.primary);
  doc.roundedRect(M + 8, y, CW - 16, 10, 3, 0, 'F');
  doc.rect(M + 8, y + 7, CW - 16, 3, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
  doc.text('INSTRUCTIONS', PW / 2, y + 7, { align: 'center' });
  y += 15;

  ['All questions are compulsory.',
   `Each question: ${test?.marksPerQuestion || 2} marks.`,
   test?.negativeMarking ? `Wrong: -${test.negativeMarks || 0.5}` : 'No negative marking.',
   'Circle the correct option (A/B/C/D).',
   'Use black or blue pen.'
  ].forEach((r, i) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
    doc.text(`${i + 1}.`, M + 14, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray700);
    doc.text(r, M + 20, y);
    y += 6;
  });

  if (includeAnswers) {
    y += 8;
    doc.setFillColor(...C.successLight); doc.setDrawColor(...C.success); doc.setLineWidth(0.5);
    doc.roundedRect(M + 8, y, CW - 16, 10, 2, 2, 'FD'); doc.setLineWidth(0.2);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.success);
    doc.text('Answer Key & Explanations included', PW / 2, y + 6.5, { align: 'center' });
  }

  // ============ QUESTIONS ============
  doc.addPage();
  drawHdr();

  doc.setFillColor(...C.primary);
  doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
  doc.text('QUESTIONS', PW / 2, y + 7, { align: 'center' });
  y += 16;

  QS.forEach((q, idx) => {
    if (!q) return;
    const num = idx + 1;

    // ---- GET QUESTION TEXT ----
    const qText = getQuestionText(q, language) || `Question ${num}`;

    // ---- GET OPTIONS ----
    const options = getOptions(q, language);

    console.log(`PDF Q${num}: "${qText.substring(0, 60)}..." | ${options.length} options`);

    const estH = t.measure(qText, 10, CW - 35) + 50;
    checkPage(Math.min(estH, 70));

    // Q badge
    doc.setFillColor(...C.primary);
    doc.roundedRect(M, y - 4, 14, 7, 1.5, 1.5, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(`Q${num}`, M + 7, y, { align: 'center' });

    // Marks badge
    doc.setFillColor(...C.accent);
    doc.roundedRect(M + 16, y - 4, 12, 7, 1.5, 1.5, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(7);
    doc.text(`${test?.marksPerQuestion || 2}M`, M + 22, y, { align: 'center' });

    // Question text
    const qH = t.render(qText, M + 32, y, {
      fontSize: 10, color: C.dark, maxWidth: CW - 36, lineHeight: 1.6
    });
    y += Math.max(qH, 5) + 5;

    // ---- MATCH FOLLOWING ----
    if ((q.questionType === 'match_following' || q.type === 'match') && (q.matchData || q.matchPairs)) {
      checkPage(60);
      const md = q.matchData || {};
      let listA = [], listB = [];

      if (md.listA) {
        listA = Array.isArray(md.listA) ? md.listA.map(x => getText(x, language, ''))
          : ensureArray(md.listA[language] || md.listA.en || md.listA.hi || []);
      }
      if (md.listB) {
        listB = Array.isArray(md.listB) ? md.listB.map(x => getText(x, language, ''))
          : ensureArray(md.listB[language] || md.listB.en || md.listB.hi || []);
      }
      if (!listA.length && q.matchPairs) {
        const pairs = ensureArray(q.matchPairs);
        listA = pairs.map(p => getText(p.left || p.a || p.item, language, ''));
        listB = pairs.map(p => getText(p.right || p.b || p.match, language, ''));
      }

      if (listA.length || listB.length) {
        const tX = M + 10, tW = CW - 20, colW = tW / 2;
        const labels = ['(a)','(b)','(c)','(d)','(e)'];
        const romans = ['(i)','(ii)','(iii)','(iv)','(v)'];
        const maxL = Math.max(listA.length, listB.length);

        doc.setFillColor(...C.primary); doc.rect(tX, y, tW, 8, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
        doc.text('List - I', tX + colW / 2, y + 5.5, { align: 'center' });
        doc.text('List - II', tX + colW + colW / 2, y + 5.5, { align: 'center' });
        y += 8;

        for (let i = 0; i < maxL; i++) {
          const aStr = `${labels[i] || ''} ${listA[i] || ''}`;
          const bStr = `${romans[i] || ''} ${listB[i] || ''}`;
          const aH = t.measure(aStr, 8, colW - 6);
          const bH = t.measure(bStr, 8, colW - 6);
          const rH = Math.max(Math.max(aH, bH) + 4, 10);
          checkPage(rH + 3);

          doc.setFillColor(...(i % 2 === 0 ? C.gray100 : C.white));
          doc.rect(tX, y, tW, rH, 'F');
          doc.setDrawColor(...C.gray300);
          doc.rect(tX, y, tW, rH, 'S');
          doc.line(tX + colW, y, tX + colW, y + rH);

          t.render(aStr, tX + 3, y + 3, { fontSize: 8, color: C.dark, maxWidth: colW - 6, lineHeight: 1.3 });
          t.render(bStr, tX + colW + 3, y + 3, { fontSize: 8, color: C.dark, maxWidth: colW - 6, lineHeight: 1.3 });
          y += rH;
        }
        y += 5;
      }
    }

    // ---- ASSERTION-REASON ----
    if (q.questionType === 'assertion_reason' || q.type === 'assertion') {
      const assertion = getText(q.assertion || q.statementA, language, '');
      const reason = getText(q.reason || q.statementB, language, '');

      if (assertion) {
        checkPage(30);
        doc.setFillColor(...C.primaryLight); doc.setDrawColor(...C.primary); doc.setLineWidth(0.3);
        doc.roundedRect(M + 6, y - 2, CW - 12, 8, 1.5, 1.5, 'FD');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
        doc.text('Assertion (A):', M + 10, y + 3.5); doc.setLineWidth(0.2);
        y += 10;
        y += Math.max(t.render(assertion, M + 10, y, { fontSize: 9, color: C.gray700, maxWidth: CW - 24 }), 4) + 5;
      }
      if (reason) {
        checkPage(30);
        doc.setFillColor(255, 248, 225); doc.setDrawColor(...C.accent); doc.setLineWidth(0.3);
        doc.roundedRect(M + 6, y - 2, CW - 12, 8, 1.5, 1.5, 'FD');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.accent);
        doc.text('Reason (R):', M + 10, y + 3.5); doc.setLineWidth(0.2);
        y += 10;
        y += Math.max(t.render(reason, M + 10, y, { fontSize: 9, color: C.gray700, maxWidth: CW - 24 }), 4) + 5;
      }
    }

    // ---- OPTIONS ----
    if (options.length > 0) {
      checkPage(25);

      options.forEach((optText, i) => {
        if (i >= optLabels.length) return;
        checkPage(12);

        const isCorrect = includeAnswers && i === q.correctAnswer;
        const displayText = String(optText || '').trim() || `Option ${optLabels[i]}`;

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

        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(optLabels[i], M + 12, y + 1, { align: 'center' });

        const oH = t.render(displayText, M + 20, y, {
          fontSize: 9.5, bold: isCorrect,
          color: isCorrect ? C.success : C.dark,
          maxWidth: CW - 26, lineHeight: 1.5
        });
        y += Math.max(oH, 5) + 3;
      });
    }

    // ---- EXPLANATION ----
    if (includeAnswers) {
      const expText = getExplanation(q, language);
      if (expText) {
        checkPage(25);
        const expH = t.measure(expText, 8.5, CW - 28);
        const boxH = Math.max(18, expH + 14);

        doc.setFillColor(...C.successLight); doc.setDrawColor(...C.success); doc.setLineWidth(0.4);
        doc.roundedRect(M + 4, y, CW - 8, boxH, 2, 2, 'FD'); doc.setLineWidth(0.2);

        doc.setFillColor(...C.success);
        doc.roundedRect(M + 4, y, 28, 7, 2, 0, 'F');
        doc.rect(M + 4, y + 4, 28, 3, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
        doc.text('EXPLANATION', M + 8, y + 5);

        const ansL = optLabels[q.correctAnswer] || '?';
        doc.setFillColor(...C.success);
        doc.roundedRect(PW - M - 28, y + 1, 22, 5, 1, 1, 'F');
        doc.setFontSize(7);
        doc.text(`Ans: (${ansL})`, PW - M - 17, y + 4.5, { align: 'center' });

        t.render(expText, M + 10, y + 11, { fontSize: 8.5, color: C.gray700, maxWidth: CW - 22 });
        y += boxH + 4;
      }
    }

    y += 3;

    // Separator
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
    doc.addPage(); y = M;

    doc.setFillColor(...C.primary); doc.rect(0, 0, PW, 26, 'F');
    doc.setFillColor(...C.accent); doc.rect(0, 26, PW, 2.5, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('ANSWER KEY', PW / 2, 13, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(String(test?.title || '').substring(0, 70), PW / 2, 21, { align: 'center' });
    y = 36;

    const cols = 5, cellW = (CW - 10) / cols, cellH = 10;
    const oL = ['A','B','C','D','E'];

    for (let i = 0; i < QS.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      if (col === 0 && row > 0) { y += cellH; if (y + cellH > PH - 25) { doc.addPage(); y = M + 10; } }
      const cx = M + 5 + col * cellW;
      doc.setFillColor(...(row % 2 === 0 ? C.gray100 : C.white));
      doc.setDrawColor(...C.gray300);
      doc.rect(cx, y, cellW, cellH, 'FD');
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      doc.text(`Q${i + 1}: (${oL[QS[i]?.correctAnswer] || '?'})`, cx + cellW / 2, y + 6.5, { align: 'center' });
    }
    y += cellH + 12;

    doc.setFillColor(...C.primaryLight); doc.setDrawColor(...C.primary); doc.setLineWidth(0.5);
    doc.roundedRect(M + 15, y, CW - 30, 16, 3, 3, 'FD'); doc.setLineWidth(0.2);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.primary);
    doc.text('Summary', PW / 2, y + 6, { align: 'center' });
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray700);
    doc.text(`Questions: ${QS.length} | Marks: ${QS.length * (test?.marksPerQuestion || 2)} | Duration: ${formatDuration(test?.duration || 60)}`,
      PW / 2, y + 12, { align: 'center' });
  }

  addFooters();
  return doc;
};

// ==================== DOWNLOAD ====================

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

// ==================== RESULTS PDF ====================

export const generateResultsPDF = async (attempt, test, questions, language = 'en') => {
  const QS = ensureArray(questions);
  if (!attempt) throw new Error('Attempt data required');

  const doc = new jsPDF('p', 'mm', 'a4');
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 14, CW = PW - M * 2;
  let y = M;
  const tx = new TXT(doc, language);

  const totalQ = QS.length || attempt.totalQuestions || 0;
  const correct = attempt.correctCount || 0;
  const wrong = attempt.wrongCount || 0;
  const skipped = totalQ - correct - wrong;
  const score = attempt.score || 0;
  const total = attempt.totalMarks || (totalQ * 2);
  const pct = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';
  const acc = (correct + wrong) > 0 ? ((correct / (correct + wrong)) * 100).toFixed(1) : '0.0';
  const pass = parseFloat(pct) >= 50;

  // Header
  doc.setFillColor(...C.primary); doc.rect(0, 0, PW, 42, 'F');
  doc.setFillColor(...C.accent); doc.rect(0, 42, PW, 2.5, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(26); doc.setFont('helvetica', 'bold');
  doc.text('NETprep', PW / 2, 18, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Test Results', PW / 2, 32, { align: 'center' });

  y = 56;
  tx.render(test?.title || 'Test', PW / 2, y, { fontSize: 13, bold: true, color: C.dark, maxWidth: CW - 20, align: 'center' });
  y += 20;

  // Score circle
  const cx = PW / 2, cy = y + 18, cr = 18;
  doc.setFillColor(...(pass ? C.successLight : C.dangerLight));
  doc.setDrawColor(...(pass ? C.success : C.danger));
  doc.setLineWidth(1.5); doc.circle(cx, cy, cr, 'FD'); doc.setLineWidth(0.2);
  doc.setFontSize(24); doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(pass ? C.success : C.danger));
  doc.text(`${pct}%`, cx, cy + 3, { align: 'center' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray500);
  doc.text(`${score} / ${total}`, cx, cy + cr + 6, { align: 'center' });
  y = cy + cr + 15;

  // Stats
  const stats = [
    { l: 'Total', v: String(totalQ), c: C.dark },
    { l: 'Correct', v: String(correct), c: C.success },
    { l: 'Wrong', v: String(wrong), c: C.danger },
    { l: 'Skipped', v: String(skipped), c: C.gray600 },
    { l: 'Accuracy', v: `${acc}%`, c: C.primary },
  ];
  const sX = M + 30, sW = CW - 60, sH = 9;
  stats.forEach((s, i) => {
    const ry = y + i * sH;
    doc.setFillColor(...(i % 2 === 0 ? C.gray100 : C.white));
    doc.rect(sX, ry, sW, sH, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gray700);
    doc.text(s.l, sX + 5, ry + 6);
    doc.setTextColor(...s.c);
    doc.text(s.v, sX + sW - 5, ry + 6, { align: 'right' });
  });
  y += stats.length * sH + 12;

  // Analysis
  doc.setFillColor(...C.primary); doc.roundedRect(M, y, CW, 10, 2, 2, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
  doc.text('ANALYSIS', PW / 2, y + 7, { align: 'center' });
  y += 14;

  const oL = ['A','B','C','D','E'];
  const aC = 4, aW = (CW - 10) / aC, aH = 8;

  doc.setFillColor(...C.primary); doc.rect(M + 5, y, CW - 10, aH, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white);
  doc.text('Q', M + 5 + aW * 0.5, y + 5.5, { align: 'center' });
  doc.text('Yours', M + 5 + aW * 1.5, y + 5.5, { align: 'center' });
  doc.text('Correct', M + 5 + aW * 2.5, y + 5.5, { align: 'center' });
  doc.text('Result', M + 5 + aW * 3.5, y + 5.5, { align: 'center' });
  y += aH;

  QS.forEach((q, i) => {
    if (y + aH > PH - 20) { doc.addPage(); y = M + 10; }
    const ans = attempt.answers?.find(a => String(a.questionId) === String(q._id));
    const yours = ans?.selectedAnswer >= 0 ? `(${oL[ans.selectedAnswer]})` : '--';
    const correct2 = `(${oL[q.correctAnswer] || '?'})`;
    let status = '--', sColor = C.gray500;
    if (ans) {
      if (ans.isCorrect) { status = 'CORRECT'; sColor = C.success; }
      else if (ans.selectedAnswer >= 0) { status = 'WRONG'; sColor = C.danger; }
    }

    doc.setFillColor(...(i % 2 === 0 ? C.gray100 : C.white));
    doc.rect(M + 5, y, CW - 10, aH, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark);
    doc.text(String(i + 1), M + 5 + aW * 0.5, y + 5.5, { align: 'center' });
    doc.text(yours, M + 5 + aW * 1.5, y + 5.5, { align: 'center' });
    doc.text(correct2, M + 5 + aW * 2.5, y + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...sColor);
    doc.text(status, M + 5 + aW * 3.5, y + 5.5, { align: 'center' });
    y += aH;
  });

  const t2 = doc.internal.getNumberOfPages();
  for (let p = 1; p <= t2; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.gray300); doc.line(M, PH - 12, PW - M, PH - 12);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray400);
    doc.text('NETprep', M, PH - 7);
    doc.text(`Page ${p}/${t2}`, PW / 2, PH - 7, { align: 'center' });
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

export default { generateTestPDF, downloadTestPDF, generateResultsPDF, downloadResultsPDF };