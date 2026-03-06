// client/src/utils/pdfExportHTML.js
// ⭐ ADVANCED PROFESSIONAL PDF EXPORT v3.0
// Features: All Q-types, Passage/DI groups, OMR Sheet, Progress, Hindi support

import questionService from '../services/questionService';

// ==================== HELPERS ====================

const getText = (obj, lang, fb = '') => {
  if (!obj) return fb;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  return obj[lang] || obj.en || obj.hi || obj.text || obj.value || fb;
};

const getArray = (obj, lang) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj.map(i => typeof i === 'string' || typeof i === 'number' ? String(i) : getText(i, lang, String(i || '')));
  const loc = obj[lang] || obj.en || obj.hi;
  return Array.isArray(loc) ? loc : [];
};

const ensureArray = (d) => {
  if (Array.isArray(d)) return d;
  if (d?.data) return ensureArray(d.data);
  if (d?.questions) return ensureArray(d.questions);
  return [];
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const OPT = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROMAN = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)'];
const LABELS = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)'];

const safeName = (s) => String(s || 'Test').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_').substring(0, 50);

const TYPE_LABELS = {
  mcq: { hi: 'बहुविकल्पीय', en: 'MCQ' },
  assertion_reason: { hi: 'अभिकथन-कारण', en: 'Assertion-Reason' },
  match_following: { hi: 'सुमेलन', en: 'Match Following' },
  sequence_order: { hi: 'क्रम व्यवस्था', en: 'Sequence Order' },
  statement_based: { hi: 'कथन आधारित', en: 'Statement Based' },
  passage_based: { hi: 'गद्यांश आधारित', en: 'Passage Based' },
  di_table: { hi: 'तालिका DI', en: 'Table DI' },
  di_bar_chart: { hi: 'बार चार्ट', en: 'Bar Chart DI' },
  di_pie_chart: { hi: 'पाई चार्ट', en: 'Pie Chart DI' },
  di_line_graph: { hi: 'लाइन ग्राफ', en: 'Line Graph DI' },
  di_mixed: { hi: 'मिश्रित DI', en: 'Mixed DI' },
  di_caselet: { hi: 'केसलेट', en: 'Caselet DI' }
};

const DIFF_COLORS = {
  easy: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32', label: { hi: 'सरल', en: 'Easy' } },
  medium: { bg: '#fff8e1', border: '#ff9800', text: '#e65100', label: { hi: 'मध्यम', en: 'Medium' } },
  hard: { bg: '#ffebee', border: '#f44336', text: '#c62828', label: { hi: 'कठिन', en: 'Hard' } }
};

// ==================== PROGRESS TRACKER ====================

class ProgressTracker {
  constructor(onProgress) {
    this.onProgress = onProgress;
    this.total = 100;
    this.current = 0;
  }
  set(pct, msg = '') {
    this.current = Math.min(pct, 100);
    this.onProgress?.({ percent: this.current, message: msg });
  }
}

// ==================== DATA PRE-FETCHER ====================

async function prepareQuestions(questions, progress) {
  const QS = ensureArray(questions).map(q => ({ ...q }));
  progress?.set(5, 'Analyzing questions...');

  const passageIds = new Map();
  const diIds = new Map();

  QS.forEach((q) => {
    if (q.questionType === 'passage_based' && q.passageId) {
      const pid = typeof q.passageId === 'string' ? q.passageId
        : (typeof q.passageId === 'object' && q.passageId._id && !q.passageId.content) ? String(q.passageId._id)
        : null;
      if (pid) passageIds.set(pid, true);
    }
    if (q.questionType?.startsWith('di_') && q.diDataId) {
      const did = typeof q.diDataId === 'string' ? q.diDataId
        : (typeof q.diDataId === 'object' && q.diDataId._id && !q.diDataId.tableData && !q.diDataId.caseletText && !q.diDataId.chartData?.datasets?.length) ? String(q.diDataId._id)
        : null;
      if (did) diIds.set(did, true);
    }
  });

  progress?.set(10, `Fetching ${passageIds.size} passages, ${diIds.size} DI sets...`);

  // Fetch passages
  const passageCache = new Map();
  for (const [pid] of passageIds) {
    try {
      const res = await questionService.getPassageById(pid);
      const data = res?.data || res;
      if (data?.content) passageCache.set(pid, data);
    } catch { /* skip */ }
  }

  // Fetch DI data
  const diCache = new Map();
  for (const [did] of diIds) {
    try {
      const res = await questionService.getDIDataById(did);
      const data = res?.data || res;
      if (data) diCache.set(did, data);
    } catch { /* skip */ }
  }

  progress?.set(20, 'Enriching questions...');

  // Enrich
  QS.forEach(q => {
    if (q.questionType === 'passage_based' && q.passageId) {
      const pid = typeof q.passageId === 'string' ? q.passageId : String(q.passageId?._id || '');
      if (passageCache.has(pid)) q.passageId = passageCache.get(pid);
    }
    if (q.questionType?.startsWith('di_') && q.diDataId) {
      const did = typeof q.diDataId === 'string' ? q.diDataId : String(q.diDataId?._id || '');
      if (diCache.has(did)) q.diDataId = diCache.get(did);
    }
  });

  return QS;
}

// ==================== QUESTION GROUPER ====================

function groupQuestions(questions) {
  const groups = [];
  const processed = new Set();

  questions.forEach((q, idx) => {
    if (processed.has(idx)) return;

    const isPassage = q.questionType === 'passage_based' && q.passageId && typeof q.passageId === 'object' && q.passageId.content;
    const isDI = q.questionType?.startsWith('di_') && q.diDataId && typeof q.diDataId === 'object' && (q.diDataId.tableData || q.diDataId.caseletText || q.diDataId.chartData || q.diDataId.title);

    if (isPassage) {
      const pid = String(q.passageId._id || q.passageId.passageNumber || idx);
      const related = [];
      questions.forEach((q2, i2) => {
        if (processed.has(i2)) return;
        if (q2.questionType === 'passage_based' && q2.passageId && typeof q2.passageId === 'object') {
          const pid2 = String(q2.passageId._id || q2.passageId.passageNumber || i2);
          if (pid2 === pid) { related.push({ ...q2, _gi: i2 }); processed.add(i2); }
        }
      });
      related.sort((a, b) => (a.passageOrder || 0) - (b.passageOrder || 0));
      groups.push({ type: 'passage', data: q.passageId, questions: related });
    } else if (isDI) {
      const did = String(q.diDataId._id || q.diDataId.diNumber || idx);
      const related = [];
      questions.forEach((q2, i2) => {
        if (processed.has(i2)) return;
        if (q2.questionType?.startsWith('di_') && q2.diDataId && typeof q2.diDataId === 'object') {
          const did2 = String(q2.diDataId._id || q2.diDataId.diNumber || i2);
          if (did2 === did) { related.push({ ...q2, _gi: i2 }); processed.add(i2); }
        }
      });
      related.sort((a, b) => (a.diOrder || 0) - (b.diOrder || 0));
      groups.push({ type: 'di', data: q.diDataId, questions: related });
    } else {
      processed.add(idx);
      groups.push({ type: 'standalone', question: q });
    }
  });

  return groups;
}

// ==================== CSS ====================

const getCSS = () => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');

  * { margin:0; padding:0; box-sizing:border-box; }

  .pdf-root {
    font-family: 'Noto Sans Devanagari','Mangal','Nirmala UI','Arial Unicode MS',system-ui,sans-serif;
    color: #1a1a2e; line-height:1.65; font-size:11px;
    width:794px; background:#fff;
    word-break:break-word; overflow-wrap:break-word;
  }

  p,span,div,td,th,li { word-break:break-word; overflow-wrap:break-word; max-width:100%; }

  /* ===== PAGE BREAKS ===== */
  .page-break { page-break-before:always; break-before:page; }
  .no-break { page-break-inside:avoid; break-inside:avoid; }

  /* ===== COVER ===== */
  .cover { min-height:1100px; display:flex; flex-direction:column; }
  .cover-header {
    background: linear-gradient(135deg, #0a1628 0%, #0d47a1 40%, #1565c0 70%, #1976d2 100%);
    padding:52px 44px 40px; text-align:center; color:#fff; position:relative; overflow:hidden;
  }
  .cover-header::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:80px;
    background:linear-gradient(transparent,rgba(0,0,0,0.15));
  }
  .cover-brand { font-size:48px; font-weight:800; letter-spacing:5px; position:relative; z-index:1; }
  .cover-tagline { font-size:13px; opacity:.8; margin-top:8px; letter-spacing:2px; font-weight:400; position:relative; z-index:1; }
  .cover-accent { height:5px; background:linear-gradient(90deg,#ff6f00,#ffc107,#ff9800,#ff6f00); }
  .cover-body { flex:1; padding:36px 44px; display:flex; flex-direction:column; gap:22px; }

  .title-box {
    text-align:center; padding:26px 24px; background:linear-gradient(135deg,#f8f9fa,#e8eaf6);
    border-radius:14px; border:1.5px solid #c5cae9;
  }
  .title-text { font-size:21px; font-weight:700; color:#1a237e; line-height:1.45; }

  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .info-card {
    border:1.5px solid #e0e0e0; border-radius:12px; padding:18px 20px;
    background:#fff; position:relative; overflow:hidden; transition:box-shadow .2s;
  }
  .info-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:5px; border-radius:12px 0 0 12px; }
  .info-card.c1::before { background:linear-gradient(180deg,#0d47a1,#1976d2); }
  .info-card.c2::before { background:linear-gradient(180deg,#e65100,#ff9800); }
  .info-card.c3::before { background:linear-gradient(180deg,#1b5e20,#4caf50); }
  .info-card.c4::before { background:linear-gradient(180deg,#4a148c,#9c27b0); }
  .info-label { font-size:9px; color:#78909c; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; font-weight:600; }
  .info-value { font-size:22px; font-weight:800; color:#212529; }

  .meta-bar { display:flex; justify-content:center; gap:20px; font-size:10px; color:#78909c; flex-wrap:wrap; }
  .meta-item { display:flex; align-items:center; gap:5px; }
  .meta-dot { width:6px; height:6px; border-radius:50%; }

  .inst-box { border:1.5px solid #e0e0e0; border-radius:12px; overflow:hidden; }
  .inst-head {
    background:linear-gradient(135deg,#0d47a1,#1565c0); color:#fff;
    padding:11px 20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px;
  }
  .inst-body { padding:16px 20px; }
  .inst-item { display:flex; gap:10px; margin-bottom:6px; font-size:10px; color:#455a64; line-height:1.75; }
  .inst-num { color:#0d47a1; font-weight:800; min-width:16px; flex-shrink:0; }

  .badge-row { display:flex; gap:10px; flex-wrap:wrap; }
  .ans-badge {
    flex:1; text-align:center; padding:11px; background:linear-gradient(135deg,#e8f5e9,#c8e6c9);
    border:1.5px solid #43a047; border-radius:10px; color:#1b5e20; font-weight:700; font-size:11px;
  }
  .neg-badge {
    flex:1; text-align:center; padding:11px; background:linear-gradient(135deg,#ffebee,#ffcdd2);
    border:1.5px solid #e53935; border-radius:10px; color:#b71c1c; font-weight:700; font-size:11px;
  }

  /* ===== SECTION HEADER ===== */
  .sec-head {
    background:linear-gradient(135deg,#0d47a1,#1565c0); color:#fff;
    text-align:center; padding:12px; border-radius:10px;
    font-size:15px; font-weight:800; letter-spacing:2px;
    margin:8px 24px 20px; box-shadow:0 3px 12px rgba(13,71,161,0.2);
  }

  /* ===== PASSAGE ===== */
  .passage-wrap { margin:0 24px 8px; }
  .p-head {
    background:linear-gradient(135deg,#fff3e0,#ffe0b2); border:1.5px solid #ffb74d;
    border-bottom:none; border-radius:12px 12px 0 0; padding:10px 18px;
    display:flex; align-items:center; gap:12px;
  }
  .p-icon {
    width:30px; height:30px; background:linear-gradient(135deg,#e65100,#ff6d00);
    border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center;
    font-size:13px; font-weight:900; flex-shrink:0; box-shadow:0 2px 6px rgba(230,81,0,0.3);
  }
  .p-label { font-weight:700; color:#e65100; font-size:12px; text-transform:uppercase; letter-spacing:.8px; }
  .p-title { font-size:10px; color:#bf360c; margin-left:auto; font-style:italic; }
  .p-body {
    background:#fafbfc; border:1.5px solid #e0e0e0; border-top:none;
    border-radius:0 0 12px 12px; padding:20px 22px;
    font-size:11px; color:#37474f; line-height:2; text-align:justify;
  }
  .p-body p { margin-bottom:10px; }
  .p-body p:last-child { margin-bottom:0; }
  .group-label { font-size:9px; font-style:italic; margin:10px 24px 14px; padding-left:6px; letter-spacing:.3px; }
  .group-label.passage-l { color:#e65100; border-left:3px solid #ff9800; padding-left:10px; }
  .group-label.di-l { color:#7b1fa2; border-left:3px solid #9c27b0; padding-left:10px; }

  /* ===== DI ===== */
  .di-wrap { margin:0 24px 8px; }
  .d-head {
    background:linear-gradient(135deg,#f3e5f5,#e1bee7); border:1.5px solid #ba68c8;
    border-bottom:none; border-radius:12px 12px 0 0; padding:10px 18px;
    display:flex; align-items:center; gap:12px;
  }
  .d-icon {
    width:30px; height:30px; background:linear-gradient(135deg,#6a1b9a,#8e24aa);
    border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:900; flex-shrink:0; box-shadow:0 2px 6px rgba(106,27,154,0.3);
  }
  .d-label { font-weight:700; color:#6a1b9a; font-size:12px; text-transform:uppercase; letter-spacing:.8px; }
  .d-body {
    background:#fafbfc; border:1.5px solid #e0e0e0; border-top:none;
    border-radius:0 0 12px 12px; padding:18px 20px;
  }
  .d-title { font-size:12.5px; font-weight:700; color:#212529; margin-bottom:8px; }
  .d-inst { font-size:10px; color:#616161; font-style:italic; margin-bottom:12px; }

  /* DI TABLE */
  .di-tbl { width:100%; border-collapse:collapse; margin:10px 0; table-layout:fixed; border-radius:8px; overflow:hidden; }
  .di-tbl th {
    background:linear-gradient(135deg,#6a1b9a,#8e24aa); color:#fff;
    padding:9px 8px; text-align:center; font-weight:700; font-size:10px; border:1px solid #4a148c;
  }
  .di-tbl td { padding:8px 8px; text-align:center; border:1px solid #d1c4e9; font-size:10.5px; }
  .di-tbl tr:nth-child(even) td { background:#f5f0fa; }
  .di-tbl tr:nth-child(odd) td { background:#fff; }
  .di-tbl td:first-child { text-align:left; font-weight:600; background:#f3e5f5 !important; }
  .di-tbl .null-val { color:#bdbdbd; font-style:italic; }

  .caselet-text {
    font-size:11px; color:#37474f; line-height:1.9; text-align:justify;
    padding:14px 18px; background:#fafafa; border:1.5px solid #e0e0e0; border-radius:8px;
  }
  .chart-note {
    font-size:8px; color:#7b1fa2; font-style:italic; margin-top:6px;
    padding:4px 8px; background:#f3e5f5; border-radius:4px; display:inline-block;
  }

  /* ===== QUESTION BLOCK ===== */
  .q-block { margin:0 24px 16px; padding-bottom:16px; border-bottom:1.5px dashed #e0e0e0; page-break-inside:avoid; }
  .q-block:last-child { border-bottom:none; }

  .q-head { display:flex; align-items:center; gap:7px; margin-bottom:10px; flex-wrap:wrap; }
  .q-num {
    background:linear-gradient(135deg,#0d47a1,#1565c0); color:#fff;
    padding:4px 12px; border-radius:16px; font-size:10.5px; font-weight:800;
    white-space:nowrap; flex-shrink:0; box-shadow:0 2px 6px rgba(13,71,161,0.2);
  }
  .q-marks {
    background:linear-gradient(135deg,#e65100,#ff9800); color:#fff;
    padding:3px 9px; border-radius:14px; font-size:9px; font-weight:700; flex-shrink:0;
  }
  .q-type {
    background:#e3f2fd; color:#0d47a1; padding:3px 10px; border-radius:14px;
    font-size:8.5px; font-weight:600; flex-shrink:0; border:1px solid #bbdefb;
  }
  .q-diff {
    padding:3px 8px; border-radius:14px; font-size:8px; font-weight:700; flex-shrink:0; border:1px solid;
  }
  .q-topic {
    margin-left:auto; font-size:8px; color:#90a4ae; font-style:italic; max-width:200px;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }

  .q-text { font-size:11.5px; color:#1a1a2e; line-height:1.8; margin-bottom:10px; font-weight:500; }

  /* ===== ASSERTION-REASON ===== */
  .ar-box { margin:8px 0; border-radius:10px; padding:12px 16px; border-left:5px solid; }
  .ar-a { background:linear-gradient(135deg,#e3f2fd,#bbdefb); border-color:#1565c0; }
  .ar-r { background:linear-gradient(135deg,#fff8e1,#ffecb3); border-color:#ff9800; }
  .ar-lbl { font-size:9px; font-weight:800; text-transform:uppercase; margin-bottom:5px; letter-spacing:.5px; }
  .ar-a .ar-lbl { color:#0d47a1; }
  .ar-r .ar-lbl { color:#e65100; }
  .ar-txt { font-size:10.5px; color:#37474f; line-height:1.7; }

  /* ===== STATEMENT BASED ===== */
  .stmt-box { background:#f8f9fa; border:1.5px solid #e0e0e0; border-radius:10px; padding:14px 16px; margin:8px 0; }
  .stmt-inst { font-size:10px; font-weight:700; color:#455a64; margin-bottom:10px; }
  .stmt-item {
    display:flex; align-items:flex-start; gap:12px; padding:9px 14px; margin-bottom:5px;
    background:#fff; border:1.5px solid #e0e0e0; border-radius:8px;
  }
  .stmt-n {
    width:24px; height:24px; min-width:24px; background:linear-gradient(135deg,#0d47a1,#1976d2);
    color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:800; flex-shrink:0; margin-top:1px;
    box-shadow:0 2px 4px rgba(13,71,161,0.2);
  }
  .stmt-t { font-size:10.5px; color:#37474f; line-height:1.65; flex:1; min-width:0; }
  .stmt-ok { background:#e8f5e9; border-color:#4caf50; }
  .stmt-no { background:#ffebee; border-color:#ef5350; }
  .stmt-ok .stmt-n { background:linear-gradient(135deg,#2e7d32,#43a047); }
  .stmt-no .stmt-n { background:linear-gradient(135deg,#c62828,#e53935); }
  .stmt-info {
    margin-top:8px; padding:8px 14px; background:#e8f5e9; border:1.5px solid #43a047;
    border-radius:8px; font-size:9.5px; font-weight:700; color:#1b5e20;
  }

  /* ===== MATCH TABLE ===== */
  .match-wrap { margin:10px 0; }
  .match-inst { font-size:10px; font-weight:700; color:#455a64; margin-bottom:10px; }
  .match-tbl { width:100%; border-collapse:collapse; table-layout:fixed; border-radius:10px; overflow:hidden; }
  .match-tbl th {
    background:linear-gradient(135deg,#0d47a1,#1565c0); color:#fff;
    padding:10px 16px; text-align:center; font-weight:700; font-size:11.5px;
    border:1px solid #0d47a1; width:50%;
  }
  .match-tbl td {
    padding:10px 16px; border:1px solid #c5cae9; font-size:10.5px;
    line-height:1.55; vertical-align:top; width:50%;
  }
  .match-tbl tr:nth-child(even) td { background:#e8eaf6; }
  .match-tbl tr:nth-child(odd) td { background:#fff; }

  /* ===== SEQUENCE ===== */
  .seq-wrap { margin:10px 0; }
  .seq-inst { font-size:10px; font-weight:700; color:#455a64; margin-bottom:10px; }
  .seq-item {
    display:flex; align-items:flex-start; gap:12px; padding:9px 14px; margin-bottom:5px;
    background:#f8f9fa; border:1.5px solid #e0e0e0; border-radius:8px;
  }
  .seq-n {
    width:24px; height:24px; min-width:24px; background:linear-gradient(135deg,#0277bd,#0288d1);
    color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:800; flex-shrink:0;
  }
  .seq-t { font-size:10.5px; color:#37474f; line-height:1.55; flex:1; min-width:0; }

  /* ===== OPTIONS ===== */
  .opts { margin:10px 0; display:flex; flex-direction:column; gap:6px; }
  .opt {
    display:flex; align-items:flex-start; gap:12px; padding:10px 16px;
    border:1.5px solid #e0e0e0; border-radius:10px; background:#fff;
    transition:background .15s;
  }
  .opt-c {
    width:26px; height:26px; min-width:26px; border:2.5px solid #bdbdbd;
    border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:11.5px; font-weight:800; color:#757575; flex-shrink:0; margin-top:0px;
  }
  .opt-t { font-size:11px; color:#212529; line-height:1.6; flex:1; padding-top:3px; min-width:0; }
  .opt.correct {
    background:linear-gradient(135deg,#e8f5e9,#c8e6c9); border-color:#43a047;
    box-shadow:0 2px 8px rgba(67,160,71,0.15);
  }
  .opt.correct .opt-c {
    background:linear-gradient(135deg,#2e7d32,#43a047); border-color:#2e7d32; color:#fff;
  }
  .opt.correct .opt-t { color:#1b5e20; font-weight:600; }

  /* ===== EXPLANATION ===== */
  .exp-box {
    margin:12px 0 4px; background:linear-gradient(135deg,#e8f5e9,#c8e6c9);
    border:1.5px solid #43a047; border-radius:10px; padding:13px 18px;
    page-break-inside:avoid; box-shadow:0 2px 8px rgba(67,160,71,0.1);
  }
  .exp-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
  .exp-lbl { font-size:9.5px; font-weight:800; color:#1b5e20; text-transform:uppercase; letter-spacing:.5px; }
  .exp-ans {
    background:linear-gradient(135deg,#2e7d32,#43a047); color:#fff;
    padding:3px 12px; border-radius:14px; font-size:9.5px; font-weight:800;
    box-shadow:0 2px 4px rgba(46,125,50,0.3);
  }
  .exp-txt { font-size:10.5px; color:#37474f; line-height:1.7; }

  /* ===== ANSWER KEY ===== */
  .ak-section { padding:0 24px; }
  .ak-head {
    background:linear-gradient(135deg,#0a1628,#0d47a1,#1565c0); color:#fff;
    padding:24px; text-align:center; border-radius:12px; margin-bottom:22px;
    box-shadow:0 4px 16px rgba(13,71,161,0.3);
  }
  .ak-t1 { font-size:24px; font-weight:900; letter-spacing:2px; }
  .ak-t2 { font-size:10px; opacity:.75; margin-top:6px; }
  .ak-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:7px; margin-bottom:22px; }
  .ak-cell {
    text-align:center; padding:10px 4px; border:1.5px solid #e0e0e0; border-radius:8px;
    font-size:11px; font-weight:700; transition:background .15s;
  }
  .ak-cell:nth-child(odd) { background:#f8f9fa; }
  .ak-cell:nth-child(even) { background:#fff; }
  .ak-sum {
    text-align:center; padding:16px;
    background:linear-gradient(135deg,#e3f2fd,#bbdefb); border:1.5px solid #1976d2;
    border-radius:12px; font-size:11px; color:#0d47a1; font-weight:700;
  }

  /* ===== OMR SHEET ===== */
  .omr-section { padding:0 24px; }
  .omr-head {
    background:linear-gradient(135deg,#1b5e20,#2e7d32,#43a047); color:#fff;
    padding:18px; text-align:center; border-radius:12px; margin-bottom:18px;
  }
  .omr-t1 { font-size:20px; font-weight:900; letter-spacing:2px; }
  .omr-t2 { font-size:9px; opacity:.8; margin-top:5px; }
  .omr-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:20px; }
  .omr-item { border:1.5px solid #e0e0e0; border-radius:10px; padding:8px; text-align:center; background:#fff; }
  .omr-qn { font-size:10px; font-weight:800; color:#0d47a1; margin-bottom:6px; }
  .omr-opts { display:flex; justify-content:center; gap:6px; }
  .omr-bubble {
    width:20px; height:20px; border:2px solid #bdbdbd; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:8px; font-weight:700; color:#9e9e9e;
  }
  .omr-bubble.filled { background:#0d47a1; border-color:#0d47a1; color:#fff; }
  .omr-inst { font-size:9px; color:#616161; text-align:center; padding:10px; background:#f5f5f5; border-radius:8px; margin-bottom:16px; }
  .omr-name-box {
    border:1.5px solid #e0e0e0; border-radius:10px; padding:14px 18px; margin-bottom:16px;
    display:grid; grid-template-columns:1fr 1fr; gap:12px;
  }
  .omr-field { border-bottom:1.5px dotted #bdbdbd; padding-bottom:6px; font-size:10px; color:#757575; }

  /* ===== RESULTS ===== */
  .res-head {
    background:linear-gradient(135deg,#0a1628,#0d47a1,#1565c0); color:#fff;
    padding:40px 30px; text-align:center;
  }
  .res-brand { font-size:34px; font-weight:900; letter-spacing:3px; }
  .res-sub { font-size:12px; opacity:.8; margin-top:8px; }
  .res-body { padding:32px 44px; }
  .res-title { text-align:center; font-size:17px; font-weight:700; margin-bottom:28px; color:#1a237e; }
  .score-ring {
    width:140px; height:140px; border-radius:50%; border:8px solid;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    margin:0 auto 22px; box-shadow:0 4px 20px rgba(0,0,0,0.1);
  }
  .score-ring.pass { border-color:#43a047; background:linear-gradient(135deg,#e8f5e9,#c8e6c9); }
  .score-ring.fail { border-color:#e53935; background:linear-gradient(135deg,#ffebee,#ffcdd2); }
  .score-pct { font-size:38px; font-weight:900; }
  .score-ring.pass .score-pct { color:#1b5e20; }
  .score-ring.fail .score-pct { color:#b71c1c; }
  .score-raw { font-size:11px; color:#78909c; text-align:center; margin-bottom:24px; }

  .stat-tbl { width:65%; margin:0 auto 28px; border-collapse:collapse; border-radius:10px; overflow:hidden; border:1.5px solid #e0e0e0; }
  .stat-tbl td { padding:10px 20px; font-size:11.5px; border-bottom:1px solid #eeeeee; }
  .stat-tbl tr:nth-child(even) { background:#f8f9fa; }
  .stat-l { color:#455a64; font-weight:600; }
  .stat-v { text-align:right; font-weight:800; }
  .s-ok { color:#2e7d32; }
  .s-no { color:#c62828; }
  .s-skip { color:#78909c; }

  .ana-head {
    background:linear-gradient(135deg,#0d47a1,#1565c0); color:#fff;
    text-align:center; padding:11px; border-radius:10px; font-size:13px; font-weight:800;
    margin-bottom:14px; letter-spacing:1px;
  }
  .ana-tbl { width:100%; border-collapse:collapse; font-size:10.5px; table-layout:fixed; border:1.5px solid #e0e0e0; border-radius:10px; overflow:hidden; }
  .ana-tbl th { background:linear-gradient(135deg,#0d47a1,#1565c0); color:#fff; padding:8px 10px; font-weight:700; border:1px solid #0d47a1; }
  .ana-tbl td { padding:7px 10px; border:1px solid #e0e0e0; text-align:center; }
  .ana-tbl tr:nth-child(even) td { background:#f8f9fa; }

  /* ===== FOOTER ===== */
  .pdf-footer {
    margin:32px 24px 12px; padding-top:12px; border-top:1.5px solid #e0e0e0;
    display:flex; justify-content:space-between; font-size:8px; color:#b0bec5;
  }
</style>`;

// ==================== HTML RENDERERS ====================

function renderCoverPage(test, totalQ, lang, includeAnswers) {
  const title = test?.title || 'Mock Test';
  const paper = test?.paper === 'paper1' ? (lang === 'hi' ? 'पेपर 1 - सामान्य' : 'Paper 1 - General') : (lang === 'hi' ? 'पेपर 2 - इतिहास' : 'Paper 2 - History');
  const duration = test?.duration || 60;
  const marks = totalQ * (test?.marksPerQuestion || 2);
  const langLabel = lang === 'hi' ? 'हिंदी माध्यम' : 'English Medium';
  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const testTypeLabel = test?.testType ? (TYPE_LABELS[test.testType]?.[lang] || test.testType.replace(/_/g, ' ').toUpperCase()) : '';

  const instructions = [
    lang === 'hi' ? 'सभी प्रश्न अनिवार्य हैं।' : 'All questions are compulsory.',
    lang === 'hi' ? `प्रत्येक प्रश्न ${test?.marksPerQuestion || 2} अंक का है।` : `Each question carries ${test?.marksPerQuestion || 2} marks.`,
    test?.negativeMarking
      ? (lang === 'hi' ? `प्रत्येक गलत उत्तर के लिए ${test.negativeMarks || 0.5} अंक काटे जाएंगे।` : `${test.negativeMarks || 0.5} marks will be deducted for each wrong answer.`)
      : (lang === 'hi' ? 'इस परीक्षा में कोई नकारात्मक अंकन नहीं है।' : 'There is no negative marking in this test.'),
    lang === 'hi' ? 'प्रत्येक प्रश्न के लिए चार विकल्प दिए गए हैं। सही विकल्प चुनें।' : 'Four options are given for each question. Choose the correct one.',
    lang === 'hi' ? 'काले या नीले बॉल पेन का ही उपयोग करें।' : 'Use only black or blue ball pen.',
    lang === 'hi' ? `कुल समय: ${duration} मिनट। समय समाप्त होने पर उत्तर पत्रक जमा करें।` : `Total time: ${duration} minutes. Submit answer sheet when time is up.`,
    lang === 'hi' ? 'रफ कार्य के लिए अलग शीट का उपयोग करें।' : 'Use separate sheets for rough work.',
  ];

  return `
    <div class="cover">
      <div class="cover-header">
        <div class="cover-brand">NETprep</div>
        <div class="cover-tagline">UGC NET / JRF ${lang === 'hi' ? 'परीक्षा अभ्यास' : 'Exam Preparation'}</div>
      </div>
      <div class="cover-accent"></div>
      <div class="cover-body">
        <div class="title-box"><div class="title-text">${esc(title)}</div></div>
        <div class="info-grid">
          <div class="info-card c1"><div class="info-label">${lang === 'hi' ? 'पेपर' : 'Paper'}</div><div class="info-value">${esc(paper)}</div></div>
          <div class="info-card c2"><div class="info-label">${lang === 'hi' ? 'कुल प्रश्न' : 'Questions'}</div><div class="info-value">${totalQ}</div></div>
          <div class="info-card c3"><div class="info-label">${lang === 'hi' ? 'अवधि' : 'Duration'}</div><div class="info-value">${duration} ${lang === 'hi' ? 'मिनट' : 'min'}</div></div>
          <div class="info-card c4"><div class="info-label">${lang === 'hi' ? 'पूर्णांक' : 'Total Marks'}</div><div class="info-value">${marks}</div></div>
        </div>
        <div class="meta-bar">
          <div class="meta-item"><div class="meta-dot" style="background:#0d47a1"></div>${esc(langLabel)}</div>
          <div class="meta-item"><div class="meta-dot" style="background:#ff9800"></div>${esc(date)}</div>
          ${testTypeLabel ? `<div class="meta-item"><div class="meta-dot" style="background:#4caf50"></div>${esc(testTypeLabel)}</div>` : ''}
          ${test?.unit ? `<div class="meta-item"><div class="meta-dot" style="background:#9c27b0"></div>${esc(test.unit)}</div>` : ''}
        </div>
        <div class="inst-box">
          <div class="inst-head">${lang === 'hi' ? 'महत्वपूर्ण निर्देश' : 'IMPORTANT INSTRUCTIONS'}</div>
          <div class="inst-body">${instructions.map((inst, i) => `<div class="inst-item"><span class="inst-num">${i + 1}.</span><span>${esc(inst)}</span></div>`).join('')}</div>
        </div>
        <div class="badge-row">
          ${includeAnswers ? `<div class="ans-badge">${lang === 'hi' ? '✓ उत्तर कुंजी एवं व्याख्या संलग्न' : '✓ Answer Key & Explanations Included'}</div>` : ''}
          ${test?.negativeMarking ? `<div class="neg-badge">${lang === 'hi' ? '⚠ नकारात्मक अंकन' : '⚠ Negative Marking'}: -${test.negativeMarks || 0.5}</div>` : ''}
        </div>
      </div>
    </div>`;
}

function renderPassageBox(data, lang) {
  if (!data) return '';
  const content = getText(data.content, lang, '');
  if (!content) return '';
  const paragraphs = content.split('\n').filter(p => p.trim());
  return `
    <div class="passage-wrap no-break">
      <div class="p-head">
        <div class="p-icon">P</div>
        <div class="p-label">${lang === 'hi' ? 'गद्यांश' : 'PASSAGE'}</div>
        ${data.title ? `<div class="p-title">${esc(data.title)}</div>` : ''}
      </div>
      <div class="p-body">${paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    </div>
    <div class="group-label passage-l">${lang === 'hi' ? 'निम्नलिखित प्रश्न उपरोक्त गद्यांश पर आधारित हैं:' : 'The following questions are based on the above passage:'}</div>`;
}

function renderDIBox(data, lang) {
  if (!data) return '';
  const title = getText(data.title, lang, '');
  const instruction = getText(data.instruction, lang, '');
  let contentHTML = '';

  // Table
  if (data.tableData) {
    const headers = getArray(data.tableData.headers, lang);
    const rows = data.tableData.rows || [];
    if (headers.length > 0 || rows.length > 0) {
      const colCount = Math.max(headers.length, rows[0]?.length || 0);
      contentHTML += '<table class="di-tbl">';
      if (headers.length) {
        contentHTML += '<thead><tr>' + headers.map(h => `<th>${esc(String(h))}</th>`).join('') + '</tr></thead>';
      }
      contentHTML += '<tbody>';
      rows.forEach(row => {
        contentHTML += '<tr>';
        const cells = Array.isArray(row) ? row : [];
        for (let i = 0; i < colCount; i++) {
          const c = cells[i];
          if (c === null || c === undefined || c === '') {
            contentHTML += '<td class="null-val">—</td>';
          } else {
            contentHTML += `<td>${esc(typeof c === 'number' ? c.toLocaleString() : String(c))}</td>`;
          }
        }
        contentHTML += '</tr>';
      });
      contentHTML += '</tbody></table>';
    }
  }

  // Caselet
  if (data.caseletText) {
    const text = getText(data.caseletText, lang, '');
    if (text) contentHTML += `<div class="caselet-text">${esc(text)}</div>`;
  }

  // Chart → Table fallback
  if (data.chartData?.datasets?.length && !data.tableData) {
    const labels = getArray(data.chartData.labels, lang);
    const ds = data.chartData.datasets;
    if (labels.length) {
      contentHTML += '<table class="di-tbl"><thead><tr>';
      contentHTML += `<th>${lang === 'hi' ? 'श्रेणी' : 'Category'}</th>`;
      ds.forEach(d => { contentHTML += `<th>${esc(getText(d.label, lang, 'Data'))}</th>`; });
      contentHTML += '</tr></thead><tbody>';
      labels.forEach((l, i) => {
        contentHTML += `<tr><td>${esc(l)}</td>`;
        ds.forEach(d => { contentHTML += `<td>${d.data?.[i] ?? '—'}</td>`; });
        contentHTML += '</tr>';
      });
      contentHTML += '</tbody></table>';
      contentHTML += `<div class="chart-note">${lang === 'hi' ? 'चार्ट डेटा तालिका रूप में प्रदर्शित' : 'Chart data shown in table format'}</div>`;
    }
  }

  if (!contentHTML && !title && !instruction) return '';

  return `
    <div class="di-wrap no-break">
      <div class="d-head">
        <div class="d-icon">DI</div>
        <div class="d-label">${lang === 'hi' ? 'डेटा इंटरप्रिटेशन' : 'DATA INTERPRETATION'}</div>
      </div>
      <div class="d-body">
        ${title ? `<div class="d-title">${esc(title)}</div>` : ''}
        ${instruction ? `<div class="d-inst">${esc(instruction)}</div>` : ''}
        ${contentHTML}
      </div>
    </div>
    <div class="group-label di-l">${lang === 'hi' ? 'निम्नलिखित प्रश्न उपरोक्त डेटा पर आधारित हैं:' : 'The following questions are based on the above data:'}</div>`;
}

function renderOptions(options, correct, showAns) {
  if (!options?.length) return '';
  return `<div class="opts">${options.map((o, i) =>
    `<div class="opt ${showAns && i === correct ? 'correct' : ''}">
      <div class="opt-c">${OPT[i] || i + 1}</div>
      <div class="opt-t">${esc(String(o))}</div>
    </div>`).join('')}</div>`;
}

function renderExplanation(exp, correct, lang) {
  if (!exp) return '';
  return `
    <div class="exp-box no-break">
      <div class="exp-top">
        <div class="exp-lbl">${lang === 'hi' ? '✓ व्याख्या' : '✓ EXPLANATION'}</div>
        <div class="exp-ans">${lang === 'hi' ? 'उत्तर' : 'Ans'}: (${OPT[correct] || '?'})</div>
      </div>
      <div class="exp-txt">${esc(exp)}</div>
    </div>`;
}

function renderQuestion(q, num, lang, showAns, test) {
  const qType = q.questionType || 'mcq';
  const qText = getText(q.question, lang, '');
  const options = getArray(q.options, lang);
  const explanation = getText(q.explanation, lang, '');
  const typeLabel = TYPE_LABELS[qType]?.[lang] || qType;
  const marksPerQ = test?.marksPerQuestion || 2;
  const diff = q.difficulty || 'medium';
  const diffConf = DIFF_COLORS[diff] || DIFF_COLORS.medium;
  const topic = q.topic || q.chapter || '';

  let typeHTML = '';

  // Assertion-Reason
  if (qType === 'assertion_reason' && q.assertionReasonData) {
    const a = getText(q.assertionReasonData.assertion, lang, '');
    const r = getText(q.assertionReasonData.reason, lang, '');
    if (a) typeHTML += `<div class="ar-box ar-a"><div class="ar-lbl">${lang === 'hi' ? 'अभिकथन (A):' : 'Assertion (A):'}</div><div class="ar-txt">${esc(a)}</div></div>`;
    if (r) typeHTML += `<div class="ar-box ar-r"><div class="ar-lbl">${lang === 'hi' ? 'कारण (R):' : 'Reason (R):'}</div><div class="ar-txt">${esc(r)}</div></div>`;
  }

  // Statement Based
  if (qType === 'statement_based' && q.statementData) {
    const stmts = getArray(q.statementData.statements, lang);
    const correct = q.statementData.correctStatements || [];
    if (stmts.length) {
      typeHTML += `<div class="stmt-box">
        <div class="stmt-inst">${lang === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:'}</div>
        ${stmts.map((s, i) => {
          let cls = 'stmt-item';
          if (showAns) cls += correct.includes(i) ? ' stmt-ok' : ' stmt-no';
          return `<div class="${cls}"><div class="stmt-n">${i + 1}</div><div class="stmt-t">${esc(s)}</div></div>`;
        }).join('')}
        ${showAns ? `<div class="stmt-info">${lang === 'hi' ? 'सही कथन:' : 'Correct:'} ${correct.length ? correct.map(i => i + 1).join(', ') : (lang === 'hi' ? 'कोई नहीं' : 'None')}</div>` : ''}
      </div>`;
    }
  }

  // Match Following
  if (qType === 'match_following' && q.matchData) {
    const listA = getArray(q.matchData.listA, lang);
    const listB = getArray(q.matchData.listB, lang);
    const maxLen = Math.max(listA.length, listB.length);
    if (maxLen > 0) {
      typeHTML += `<div class="match-wrap">
        <div class="match-inst">${lang === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:'}</div>
        <table class="match-tbl"><thead><tr>
          <th>${lang === 'hi' ? 'सूची - I' : 'List - I'}</th>
          <th>${lang === 'hi' ? 'सूची - II' : 'List - II'}</th>
        </tr></thead><tbody>
        ${Array.from({ length: maxLen }, (_, i) =>
          `<tr><td>${LABELS[i] || ''} ${esc(listA[i] || '')}</td><td>${ROMAN[i] || ''} ${esc(listB[i] || '')}</td></tr>`
        ).join('')}
        </tbody></table></div>`;
    }
  }

  // Sequence Order
  if (qType === 'sequence_order' && q.sequenceData) {
    const items = getArray(q.sequenceData.items, lang);
    if (items.length) {
      typeHTML += `<div class="seq-wrap">
        <div class="seq-inst">${lang === 'hi' ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:' : 'Arrange in correct order:'}</div>
        ${items.map((item, i) => `<div class="seq-item"><div class="seq-n">${i + 1}</div><div class="seq-t">${esc(item)}</div></div>`).join('')}
      </div>`;
    }
  }

  return `
    <div class="q-block no-break">
      <div class="q-head">
        <span class="q-num">Q.${num}</span>
        <span class="q-marks">${marksPerQ}M</span>
        ${qType !== 'mcq' ? `<span class="q-type">${esc(typeLabel)}</span>` : ''}
        <span class="q-diff" style="background:${diffConf.bg};border-color:${diffConf.border};color:${diffConf.text}">${diffConf.label[lang]}</span>
        ${topic ? `<span class="q-topic">${esc(topic)}</span>` : ''}
      </div>
      ${qText ? `<div class="q-text">${esc(qText)}</div>` : ''}
      ${typeHTML}
      ${renderOptions(options, q.correctAnswer, showAns)}
      ${showAns ? renderExplanation(explanation, q.correctAnswer, lang) : ''}
    </div>`;
}

function renderAnswerKey(questions, test, lang) {
  return `
    <div class="page-break"></div>
    <div class="ak-section">
      <div class="ak-head">
        <div class="ak-t1">${lang === 'hi' ? 'उत्तर कुंजी' : 'ANSWER KEY'}</div>
        <div class="ak-t2">${esc(test?.title || '')}</div>
      </div>
      <div class="ak-grid">${questions.map((q, i) =>
        `<div class="ak-cell">Q.${i + 1}: <strong>(${OPT[q.correctAnswer] || '?'})</strong></div>`
      ).join('')}</div>
      <div class="ak-sum">${lang === 'hi' ? 'कुल प्रश्न' : 'Total'}: ${questions.length} | ${lang === 'hi' ? 'पूर्णांक' : 'Marks'}: ${questions.length * (test?.marksPerQuestion || 2)} | ${lang === 'hi' ? 'अवधि' : 'Duration'}: ${test?.duration || 60} min</div>
    </div>`;
}

function renderOMRSheet(questions, test, lang, filled = false) {
  return `
    <div class="page-break"></div>
    <div class="omr-section">
      <div class="omr-head">
        <div class="omr-t1">${lang === 'hi' ? 'उत्तर पत्रक' : 'OMR ANSWER SHEET'}</div>
        <div class="omr-t2">${esc(test?.title || '')}</div>
      </div>
      <div class="omr-name-box">
        <div class="omr-field">${lang === 'hi' ? 'नाम / Name' : 'Name'}: ___________________________</div>
        <div class="omr-field">${lang === 'hi' ? 'दिनांक / Date' : 'Date'}: ___________________________</div>
        <div class="omr-field">${lang === 'hi' ? 'रोल नं. / Roll No' : 'Roll No'}: ________________________</div>
        <div class="omr-field">${lang === 'hi' ? 'अंक / Score' : 'Score'}: _____/${questions.length * (test?.marksPerQuestion || 2)}</div>
      </div>
      <div class="omr-inst">${lang === 'hi' ? 'सही उत्तर के गोले को पूरी तरह भरें। एक प्रश्न में केवल एक विकल्प चुनें।' : 'Fill the circle completely for the correct answer. Select only one option per question.'}</div>
      <div class="omr-grid">${questions.map((q, i) => {
        const opts = getArray(q.options, lang);
        const optCount = Math.min(opts.length || 4, 4);
        return `<div class="omr-item">
          <div class="omr-qn">Q.${i + 1}</div>
          <div class="omr-opts">${Array.from({ length: optCount }, (_, j) =>
            `<div class="omr-bubble ${filled && j === q.correctAnswer ? 'filled' : ''}">${OPT[j]}</div>`
          ).join('')}</div>
        </div>`;
      }).join('')}</div>
    </div>`;
}

// ==================== MAIN HTML GENERATORS ====================

function generateTestHTML(test, questions, lang, includeAnswers, includeOMR = false) {
  const groups = groupQuestions(questions);
  let qNumber = 1;
  let questionsHTML = '';

  groups.forEach(group => {
    if (group.type === 'passage') {
      questionsHTML += renderPassageBox(group.data, lang);
      group.questions.forEach(q => { questionsHTML += renderQuestion(q, qNumber++, lang, includeAnswers, test); });
    } else if (group.type === 'di') {
      questionsHTML += renderDIBox(group.data, lang);
      group.questions.forEach(q => { questionsHTML += renderQuestion(q, qNumber++, lang, includeAnswers, test); });
    } else {
      questionsHTML += renderQuestion(group.question, qNumber++, lang, includeAnswers, test);
    }
  });

  return `<div class="pdf-root">
    ${getCSS()}
    ${renderCoverPage(test, questions.length, lang, includeAnswers)}
    <div class="page-break"></div>
    <div class="sec-head">${lang === 'hi' ? 'प्रश्न पत्र' : 'QUESTION PAPER'}</div>
    ${questionsHTML}
    ${includeAnswers ? renderAnswerKey(questions, test, lang) : ''}
    ${includeOMR ? renderOMRSheet(questions, test, lang, includeAnswers) : ''}
    <div class="pdf-footer">
      <span>NETprep | UGC NET / JRF</span>
      <span>${new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
      <span>${lang === 'hi' ? 'हिंदी' : 'English'}</span>
    </div>
  </div>`;
}

function generateResultsHTML(attempt, test, questions, lang) {
  const QS = ensureArray(questions);
  const totalQ = QS.length || attempt?.totalQuestions || 0;
  const correct = attempt?.correctCount || 0;
  const wrong = attempt?.wrongCount || 0;
  const skipped = totalQ - correct - wrong;
  const score = attempt?.score || 0;
  const total = attempt?.totalMarks || totalQ * 2;
  const pct = total > 0 ? ((score / total) * 100).toFixed(1) : '0.0';
  const acc = correct + wrong > 0 ? ((correct / (correct + wrong)) * 100).toFixed(1) : '0.0';
  const pass = parseFloat(pct) >= 50;
  const timeTaken = attempt?.totalTimeTaken || 0;
  const timeStr = timeTaken > 0 ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s` : '--';

  const stats = [
    { l: lang === 'hi' ? 'कुल प्रश्न' : 'Total Questions', v: totalQ, c: '' },
    { l: lang === 'hi' ? 'सही उत्तर' : 'Correct', v: correct, c: 's-ok' },
    { l: lang === 'hi' ? 'गलत उत्तर' : 'Wrong', v: wrong, c: 's-no' },
    { l: lang === 'hi' ? 'छोड़े गए' : 'Skipped', v: skipped, c: 's-skip' },
    { l: lang === 'hi' ? 'सटीकता' : 'Accuracy', v: acc + '%', c: '' },
    { l: lang === 'hi' ? 'समय' : 'Time Taken', v: timeStr, c: '' },
  ];

  let analysisRows = '';
  QS.forEach((q, i) => {
    const ans = attempt?.answers?.find(a => String(a.questionId) === String(q._id));
    const yours = ans?.selectedAnswer >= 0 ? `(${OPT[ans.selectedAnswer]})` : '--';
    const correctA = `(${OPT[q.correctAnswer] || '?'})`;
    let status, cls;
    if (!ans || ans.selectedAnswer < 0 || ans.selectedAnswer === undefined) {
      status = lang === 'hi' ? 'छोड़ा' : 'SKIP'; cls = 's-skip';
    } else if (ans.isCorrect) {
      status = lang === 'hi' ? '✓ सही' : '✓ CORRECT'; cls = 's-ok';
    } else {
      status = lang === 'hi' ? '✗ गलत' : '✗ WRONG'; cls = 's-no';
    }
    analysisRows += `<tr><td><strong>${i + 1}</strong></td><td>${yours}</td><td><strong>${correctA}</strong></td><td class="${cls}"><strong>${status}</strong></td></tr>`;
  });

  return `<div class="pdf-root">
    ${getCSS()}
    <div class="res-head">
      <div class="res-brand">NETprep</div>
      <div class="res-sub">${lang === 'hi' ? 'परीक्षा परिणाम रिपोर्ट' : 'Test Result Report'}</div>
    </div>
    <div style="height:5px;background:linear-gradient(90deg,#ff6f00,#ffc107,#ff9800,#ff6f00);"></div>
    <div class="res-body">
      <div class="res-title">${esc(test?.title || 'Test')}</div>
      <div class="score-ring ${pass ? 'pass' : 'fail'}"><div class="score-pct">${pct}%</div></div>
      <div class="score-raw">${score} / ${total} ${lang === 'hi' ? 'अंक' : 'marks'}</div>
      <table class="stat-tbl">${stats.map(s => `<tr><td class="stat-l">${s.l}</td><td class="stat-v ${s.c}">${s.v}</td></tr>`).join('')}</table>
      ${QS.length > 0 ? `
        <div class="ana-head">${lang === 'hi' ? 'प्रश्नवार विश्लेषण' : 'QUESTION-WISE ANALYSIS'}</div>
        <table class="ana-tbl">
          <thead><tr><th>Q#</th><th>${lang === 'hi' ? 'आपका उत्तर' : 'Your Ans'}</th><th>${lang === 'hi' ? 'सही उत्तर' : 'Correct'}</th><th>${lang === 'hi' ? 'परिणाम' : 'Result'}</th></tr></thead>
          <tbody>${analysisRows}</tbody>
        </table>` : ''}
    </div>
    <div class="pdf-footer"><span>NETprep | UGC NET</span><span>${new Date().toLocaleDateString('en-IN')}</span></div>
  </div>`;
}

// ==================== PDF CONVERTER ====================

async function htmlToPDF(htmlContent, filename, progress) {
  progress?.set(70, 'Loading PDF engine...');
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.id = 'pdf-render-' + Date.now();
  container.style.cssText = 'position:fixed;top:0;left:0;width:794px;z-index:-9999;opacity:0.01;pointer-events:none;overflow:visible;background:#fff;';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  progress?.set(75, 'Rendering fonts...');
  await new Promise(r => setTimeout(r, 600));
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise(r => setTimeout(r, 400));

  const element = container.querySelector('.pdf-root');
  if (!element) {
    document.body.removeChild(container);
    throw new Error('PDF root element not found');
  }

  progress?.set(85, 'Generating PDF pages...');

  const opt = {
    margin: [6, 6, 10, 6],
    filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2, useCORS: true, letterRendering: true, logging: false,
      windowWidth: 794, scrollX: 0, scrollY: 0, backgroundColor: '#ffffff'
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], before: '.page-break', avoid: '.no-break' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
    progress?.set(100, 'Done!');
    return { success: true, fileName: filename };
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
}

// ==================== EXPORT FUNCTIONS ====================

export const downloadTestPDF = async (test, questions, language = 'en', includeAnswers = false, options = {}) => {
  const { onProgress, includeOMR = false } = options;
  const progress = new ProgressTracker(onProgress);

  try {
    if (!test) throw new Error('Test data required');
    const raw = ensureArray(questions);
    if (raw.length === 0) throw new Error('No questions found');

    progress.set(2, 'Starting...');
    const QS = await prepareQuestions(raw, progress);

    progress.set(30, 'Building document...');
    const html = generateTestHTML(test, QS, language, includeAnswers, includeOMR);

    progress.set(60, 'Converting to PDF...');
    const filename = `${safeName(test.title)}_${language}${includeAnswers ? '_answers' : ''}${includeOMR ? '_omr' : ''}.pdf`;

    return await htmlToPDF(html, filename, progress);
  } catch (err) {
    console.error('PDF Error:', err);
    progress.set(0, err.message);
    return { success: false, error: err.message };
  }
};

export const downloadResultsPDF = async (attempt, test, questions, language = 'en', options = {}) => {
  const { onProgress } = options;
  const progress = new ProgressTracker(onProgress);

  try {
    if (!attempt) throw new Error('Attempt data required');
    progress.set(10, 'Preparing data...');

    const QS = ensureArray(questions);
    const html = generateResultsHTML(attempt, test, QS, language);

    progress.set(50, 'Converting to PDF...');
    const filename = `${safeName(test?.title)}_Result_${new Date().toISOString().split('T')[0]}.pdf`;

    return await htmlToPDF(html, filename, progress);
  } catch (err) {
    console.error('PDF Error:', err);
    return { success: false, error: err.message };
  }
};

export const downloadOMRSheet = async (test, questions, language = 'en', filled = false, options = {}) => {
  const { onProgress } = options;
  const progress = new ProgressTracker(onProgress);

  try {
    const QS = ensureArray(questions);
    if (QS.length === 0) throw new Error('No questions');
    progress.set(10, 'Building OMR sheet...');

    const html = `<div class="pdf-root">${getCSS()}${renderOMRSheet(QS, test, language, filled)}
      <div class="pdf-footer"><span>NETprep</span><span>${new Date().toLocaleDateString('en-IN')}</span></div></div>`;

    progress.set(50, 'Converting...');
    const filename = `${safeName(test?.title)}_OMR${filled ? '_filled' : ''}.pdf`;
    return await htmlToPDF(html, filename, progress);
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const generateTestPDF = downloadTestPDF;
export const generateResultsPDF = downloadResultsPDF;

export default { downloadTestPDF, downloadResultsPDF, downloadOMRSheet, generateTestPDF, generateResultsPDF };