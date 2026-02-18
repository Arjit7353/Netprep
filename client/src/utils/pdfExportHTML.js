// client/src/utils/pdfExportHTML.js
// ⭐ FIXED: Passage/DI fetch + Word overlap fix
// NO static import of html2pdf (dynamic import used)

import questionService from '../services/questionService';

// ==================== HELPERS ====================

const getText = (obj, lang, fallback = '') => {
  if (!obj) return fallback;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  return obj[lang] || obj.en || obj.hi || obj.text || obj.value || fallback;
};

const getArray = (obj, lang) => {
  if (!obj) return [];
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string' || typeof item === 'number') return String(item);
      return getText(item, lang, String(item || ''));
    });
  }
  const localized = obj[lang] || obj.en || obj.hi;
  if (Array.isArray(localized)) return localized;
  return [];
};

const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.data) return ensureArray(data.data);
  if (data?.questions) return ensureArray(data.questions);
  return [];
};

const esc = (str) => {
  const s = String(str ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const OPT = ['A', 'B', 'C', 'D', 'E', 'F'];
const safeName = (s) =>
  String(s || 'Test')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

const TYPE_LABELS = {
  mcq: { hi: 'बहुविकल्पीय', en: 'MCQ' },
  assertion_reason: { hi: 'अभिकथन-कारण', en: 'Assertion-Reason' },
  match_following: { hi: 'सुमेलन', en: 'Match Following' },
  sequence_order: { hi: 'क्रम', en: 'Sequence' },
  statement_based: { hi: 'कथन आधारित', en: 'Statement' },
  passage_based: { hi: 'गद्यांश', en: 'Passage' },
  di_table: { hi: 'तालिका', en: 'Table DI' },
  di_bar_chart: { hi: 'बार चार्ट', en: 'Bar Chart' },
  di_pie_chart: { hi: 'पाई चार्ट', en: 'Pie Chart' },
  di_line_graph: { hi: 'लाइन ग्राफ', en: 'Line Graph' },
  di_mixed: { hi: 'मिश्रित', en: 'Mixed DI' },
  di_caselet: { hi: 'केसलेट', en: 'Caselet' }
};

// ==================== DATA PRE-FETCHER ====================

async function prepareQuestions(questions) {
  const QS = ensureArray(questions).map((q) => ({ ...q }));

  // Collect IDs that need fetching
  const passageIdsToFetch = new Map();
  const diIdsToFetch = new Map();

  QS.forEach((q, idx) => {
    // --- PASSAGE ---
    if (q.questionType === 'passage_based' && q.passageId) {
      if (typeof q.passageId === 'string') {
        // Not populated - need to fetch
        passageIdsToFetch.set(q.passageId, true);
        console.log(`Q${idx}: passageId is string, will fetch:`, q.passageId);
      } else if (
        typeof q.passageId === 'object' &&
        q.passageId._id &&
        !q.passageId.content
      ) {
        // Populated but without content (partial populate)
        const pid = String(q.passageId._id);
        passageIdsToFetch.set(pid, true);
        console.log(`Q${idx}: passageId partial, will fetch:`, pid);
      } else if (
        typeof q.passageId === 'object' &&
        q.passageId.content
      ) {
        console.log(`Q${idx}: passageId fully populated ✓`);
      }
    }

    // --- DI ---
    const isDI = q.questionType?.startsWith('di_');
    if (isDI && q.diDataId) {
      if (typeof q.diDataId === 'string') {
        diIdsToFetch.set(q.diDataId, true);
        console.log(`Q${idx}: diDataId is string, will fetch:`, q.diDataId);
      } else if (
        typeof q.diDataId === 'object' &&
        q.diDataId._id &&
        !q.diDataId.tableData &&
        !q.diDataId.caseletText &&
        !q.diDataId.chartData?.datasets?.length
      ) {
        const did = String(q.diDataId._id);
        diIdsToFetch.set(did, true);
        console.log(`Q${idx}: diDataId partial, will fetch:`, did);
      } else if (typeof q.diDataId === 'object') {
        console.log(`Q${idx}: diDataId fully populated ✓`);
      }
    }
  });

  // Fetch missing passage data
  const passageCache = new Map();
  for (const [pid] of passageIdsToFetch) {
    try {
      console.log('Fetching passage:', pid);
      const res = await questionService.getPassageById(pid);
      const data = res?.data || res;
      if (data && (data.content || data.title)) {
        passageCache.set(pid, data);
        console.log('Passage fetched ✓:', data.title || pid);
      }
    } catch (e) {
      console.warn('Failed to fetch passage:', pid, e.message);
    }
  }

  // Fetch missing DI data
  const diCache = new Map();
  for (const [did] of diIdsToFetch) {
    try {
      console.log('Fetching DI data:', did);
      const res = await questionService.getDIDataById(did);
      const data = res?.data || res;
      if (data && (data.tableData || data.title || data.caseletText || data.chartData)) {
        diCache.set(did, data);
        console.log('DI data fetched ✓:', getText(data.title, 'en') || did);
      }
    } catch (e) {
      console.warn('Failed to fetch DI data:', did, e.message);
    }
  }

  // Enrich questions
  QS.forEach((q) => {
    if (q.questionType === 'passage_based' && q.passageId) {
      if (typeof q.passageId === 'string' && passageCache.has(q.passageId)) {
        q.passageId = passageCache.get(q.passageId);
      } else if (
        typeof q.passageId === 'object' &&
        !q.passageId.content &&
        q.passageId._id
      ) {
        const pid = String(q.passageId._id);
        if (passageCache.has(pid)) {
          q.passageId = passageCache.get(pid);
        }
      }
    }

    const isDI = q.questionType?.startsWith('di_');
    if (isDI && q.diDataId) {
      if (typeof q.diDataId === 'string' && diCache.has(q.diDataId)) {
        q.diDataId = diCache.get(q.diDataId);
      } else if (
        typeof q.diDataId === 'object' &&
        !q.diDataId.tableData &&
        q.diDataId._id
      ) {
        const did = String(q.diDataId._id);
        if (diCache.has(did)) {
          q.diDataId = diCache.get(did);
        }
      }
    }
  });

  console.log('Questions enriched. Passages:', passageCache.size, 'DI:', diCache.size);
  return QS;
}

// ==================== QUESTION GROUPER ====================

function groupQuestions(questions) {
  const groups = [];
  const processed = new Set();

  questions.forEach((q, idx) => {
    if (processed.has(idx)) return;

    const isPassage =
      q.questionType === 'passage_based' &&
      q.passageId &&
      typeof q.passageId === 'object' &&
      q.passageId.content;

    const isDI =
      q.questionType?.startsWith('di_') &&
      q.diDataId &&
      typeof q.diDataId === 'object' &&
      (q.diDataId.tableData || q.diDataId.caseletText || q.diDataId.chartData || q.diDataId.title);

    if (isPassage) {
      const pid = String(q.passageId._id || q.passageId.passageNumber || idx);
      const related = [];

      questions.forEach((q2, i2) => {
        if (processed.has(i2)) return;
        if (
          q2.questionType === 'passage_based' &&
          q2.passageId &&
          typeof q2.passageId === 'object'
        ) {
          const pid2 = String(q2.passageId._id || q2.passageId.passageNumber || i2);
          if (pid2 === pid) {
            related.push({ ...q2, _globalIndex: i2 });
            processed.add(i2);
          }
        }
      });

      related.sort((a, b) => (a.passageOrder || 0) - (b.passageOrder || 0));
      groups.push({ type: 'passage', data: q.passageId, questions: related });
    } else if (isDI) {
      const did = String(q.diDataId._id || q.diDataId.diNumber || idx);
      const related = [];

      questions.forEach((q2, i2) => {
        if (processed.has(i2)) return;
        if (
          q2.questionType?.startsWith('di_') &&
          q2.diDataId &&
          typeof q2.diDataId === 'object'
        ) {
          const did2 = String(q2.diDataId._id || q2.diDataId.diNumber || i2);
          if (did2 === did) {
            related.push({ ...q2, _globalIndex: i2 });
            processed.add(i2);
          }
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
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  .pdf-root {
    font-family: 'Noto Sans Devanagari', 'Mangal', 'Nirmala UI', 'Arial Unicode MS', system-ui, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
    font-size: 11px;
    width: 794px;
    background: #fff;
    word-break: break-word;
    overflow-wrap: break-word;
    -webkit-hyphens: auto;
    hyphens: auto;
  }

  /* ===== GLOBAL TEXT FIX ===== */
  p, span, div, td, th, li {
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  /* ===== COVER ===== */
  .cover { min-height: 1080px; display: flex; flex-direction: column; }
  .cover-top {
    background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
    padding: 48px 40px 36px; text-align: center; color: #fff;
  }
  .cover-brand { font-size: 40px; font-weight: 800; letter-spacing: 3px; }
  .cover-sub { font-size: 14px; opacity: .85; margin-top: 6px; letter-spacing: 1px; }
  .cover-bar { height: 5px; background: linear-gradient(90deg, #ff9800, #ffc107, #ff9800); }
  .cover-body { flex: 1; padding: 32px 40px; display: flex; flex-direction: column; gap: 22px; }
  .title-box { text-align: center; padding: 22px 20px; background: #f8f9fa; border-radius: 12px; border: 1px solid #dee2e6; }
  .title-text { font-size: 20px; font-weight: 700; color: #212529; line-height: 1.4; word-break: break-word; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .info-card { border: 1px solid #dee2e6; border-radius: 10px; padding: 16px 18px; background: #fff; position: relative; overflow: hidden; }
  .info-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; }
  .info-card.c1::before { background: #0d47a1; }
  .info-card.c2::before { background: #ff9800; }
  .info-card.c3::before { background: #2e7d32; }
  .info-card.c4::before { background: #7b1fa2; }
  .info-label { font-size: 10px; color: #6c757d; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
  .info-value { font-size: 20px; font-weight: 700; color: #212529; }
  .inst-box { border: 1px solid #dee2e6; border-radius: 10px; overflow: hidden; }
  .inst-head { background: #0d47a1; color: #fff; padding: 10px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
  .inst-body { padding: 14px 18px; }
  .inst-item { display: flex; gap: 8px; margin-bottom: 5px; font-size: 10px; color: #495057; line-height: 1.7; }
  .inst-num { color: #0d47a1; font-weight: 700; min-width: 14px; flex-shrink: 0; }
  .ans-badge { text-align: center; padding: 10px; background: #d4edda; border: 1.5px solid #28a745; border-radius: 8px; color: #155724; font-weight: 700; font-size: 11px; }
  .neg-badge { text-align: center; padding: 8px; background: #f8d7da; border: 1.5px solid #dc3545; border-radius: 8px; color: #721c24; font-weight: 600; font-size: 10px; }

  /* ===== SECTION HEADER ===== */
  .sec-head { background: #0d47a1; color: #fff; text-align: center; padding: 11px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 1.5px; margin: 10px 24px 20px; }

  /* ===== PASSAGE ===== */
  .passage-wrap { margin: 0 24px 6px; page-break-inside: avoid; }
  .p-head { background: #fff3e0; border: 1.5px solid #ffb74d; border-bottom: none; border-radius: 10px 10px 0 0; padding: 9px 16px; display: flex; align-items: center; gap: 10px; }
  .p-icon { width: 26px; height: 26px; background: #e65100; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
  .p-label { font-weight: 700; color: #e65100; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
  .p-title { font-size: 10px; color: #bf360c; margin-left: auto; font-style: italic; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .p-body { background: #fafafa; border: 1.5px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; padding: 18px 20px; font-size: 11px; color: #37474f; line-height: 1.9; text-align: justify; word-break: break-word; overflow-wrap: break-word; }
  .p-body p { margin-bottom: 8px; }
  .p-body p:last-child { margin-bottom: 0; }
  .group-label { font-size: 9px; font-style: italic; margin: 8px 24px 12px; padding-left: 4px; }
  .group-label.passage-l { color: #e65100; }
  .group-label.di-l { color: #7b1fa2; }

  /* ===== DI ===== */
  .di-wrap { margin: 0 24px 6px; page-break-inside: avoid; }
  .d-head { background: #f3e5f5; border: 1.5px solid #ba68c8; border-bottom: none; border-radius: 10px 10px 0 0; padding: 9px 16px; display: flex; align-items: center; gap: 10px; }
  .d-icon { width: 26px; height: 26px; background: #6a1b9a; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
  .d-label { font-weight: 700; color: #6a1b9a; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
  .d-body { background: #fafafa; border: 1.5px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; padding: 16px 18px; }
  .d-title { font-size: 12px; font-weight: 700; color: #212529; margin-bottom: 6px; word-break: break-word; }
  .d-inst { font-size: 10px; color: #616161; font-style: italic; margin-bottom: 10px; word-break: break-word; }

  /* DI TABLE */
  .di-tbl { width: 100%; border-collapse: collapse; margin: 8px 0; table-layout: fixed; }
  .di-tbl th { background: #6a1b9a; color: #fff; padding: 8px 6px; text-align: center; font-weight: 700; font-size: 10px; border: 1px solid #4a148c; word-break: break-word; overflow: hidden; }
  .di-tbl td { padding: 7px 6px; text-align: center; border: 1px solid #bdbdbd; font-size: 10px; word-break: break-word; overflow: hidden; }
  .di-tbl tr:nth-child(even) td { background: #f5f5f5; }
  .di-tbl tr:nth-child(odd) td { background: #fff; }
  .di-tbl td:first-child { text-align: left; font-weight: 600; background: #f3e5f5 !important; }

  /* CASELET */
  .caselet-text { font-size: 11px; color: #37474f; line-height: 1.8; text-align: justify; padding: 10px 14px; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; word-break: break-word; }

  /* ===== QUESTION BLOCK ===== */
  .q-block { margin: 0 24px 14px; padding-bottom: 14px; border-bottom: 1.5px dashed #dee2e6; page-break-inside: avoid; }
  .q-block:last-child { border-bottom: none; }
  .q-head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
  .q-num { background: #0d47a1; color: #fff; padding: 3px 10px; border-radius: 14px; font-size: 10px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .q-marks { background: #ff9800; color: #fff; padding: 3px 7px; border-radius: 14px; font-size: 9px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .q-type { background: #e3f2fd; color: #0d47a1; padding: 2px 9px; border-radius: 12px; font-size: 8px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
  .q-text { font-size: 11.5px; color: #212529; line-height: 1.75; margin-bottom: 10px; font-weight: 500; word-break: break-word; overflow-wrap: break-word; }

  /* ===== ASSERTION-REASON ===== */
  .ar-box { margin: 8px 0; border-radius: 8px; padding: 11px 15px; border-left: 4px solid; word-break: break-word; }
  .ar-a { background: #e3f2fd; border-color: #1565c0; }
  .ar-r { background: #fff8e1; border-color: #ff9800; }
  .ar-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; letter-spacing: .3px; }
  .ar-a .ar-lbl { color: #0d47a1; }
  .ar-r .ar-lbl { color: #e65100; }
  .ar-txt { font-size: 10.5px; color: #37474f; line-height: 1.65; word-break: break-word; }

  /* ===== STATEMENT BASED ===== */
  .stmt-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 12px 14px; margin: 8px 0; }
  .stmt-inst { font-size: 10px; font-weight: 600; color: #495057; margin-bottom: 8px; }
  .stmt-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; margin-bottom: 5px; background: #fff; border: 1px solid #dee2e6; border-radius: 7px; }
  .stmt-n { width: 22px; height: 22px; min-width: 22px; background: #0d47a1; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .stmt-t { font-size: 10.5px; color: #37474f; line-height: 1.6; flex: 1; word-break: break-word; overflow-wrap: break-word; min-width: 0; }
  .stmt-ok { background: #d4edda; border-color: #28a745; }
  .stmt-no { background: #f8d7da; border-color: #dc3545; }
  .stmt-ok .stmt-n { background: #28a745; }
  .stmt-no .stmt-n { background: #dc3545; }
  .stmt-info { margin-top: 6px; padding: 7px 12px; background: #d4edda; border: 1px solid #28a745; border-radius: 6px; font-size: 9px; font-weight: 600; color: #155724; }

  /* ===== MATCH TABLE ===== */
  .match-wrap { margin: 8px 0; }
  .match-inst { font-size: 10px; font-weight: 600; color: #495057; margin-bottom: 8px; }
  .match-tbl { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .match-tbl th { background: #0d47a1; color: #fff; padding: 9px 14px; text-align: center; font-weight: 700; font-size: 11px; border: 1px solid #0d47a1; width: 50%; }
  .match-tbl td { padding: 9px 14px; border: 1px solid #bdbdbd; font-size: 10.5px; line-height: 1.5; vertical-align: top; word-break: break-word; overflow-wrap: break-word; width: 50%; }
  .match-tbl tr:nth-child(even) td { background: #f8f9fa; }
  .match-tbl tr:nth-child(odd) td { background: #fff; }

  /* ===== SEQUENCE ===== */
  .seq-wrap { margin: 8px 0; }
  .seq-inst { font-size: 10px; font-weight: 600; color: #495057; margin-bottom: 8px; }
  .seq-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; margin-bottom: 4px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 7px; }
  .seq-n { width: 22px; height: 22px; min-width: 22px; background: #0288d1; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .seq-t { font-size: 10.5px; color: #37474f; line-height: 1.5; flex: 1; word-break: break-word; min-width: 0; }

  /* ===== OPTIONS ===== */
  .opts { margin: 8px 0; display: flex; flex-direction: column; gap: 5px; }
  .opt { display: flex; align-items: flex-start; gap: 10px; padding: 9px 14px; border: 1.5px solid #dee2e6; border-radius: 8px; background: #fff; }
  .opt-c { width: 24px; height: 24px; min-width: 24px; border: 2px solid #adb5bd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #6c757d; flex-shrink: 0; margin-top: 1px; }
  .opt-t { font-size: 11px; color: #212529; line-height: 1.55; flex: 1; padding-top: 2px; word-break: break-word; overflow-wrap: break-word; min-width: 0; }
  .opt.correct { background: #d4edda; border-color: #28a745; }
  .opt.correct .opt-c { background: #28a745; border-color: #28a745; color: #fff; }
  .opt.correct .opt-t { color: #155724; font-weight: 600; }

  /* ===== EXPLANATION ===== */
  .exp-box { margin: 10px 0 4px; background: #d4edda; border: 1.5px solid #28a745; border-radius: 8px; padding: 11px 15px; page-break-inside: avoid; }
  .exp-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .exp-lbl { font-size: 9px; font-weight: 700; color: #155724; text-transform: uppercase; letter-spacing: .3px; }
  .exp-ans { background: #28a745; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 9px; font-weight: 700; flex-shrink: 0; }
  .exp-txt { font-size: 10px; color: #37474f; line-height: 1.65; word-break: break-word; }

  /* ===== ANSWER KEY ===== */
  .ak-section { padding: 0 24px; }
  .ak-head { background: linear-gradient(135deg, #0d47a1, #1565c0); color: #fff; padding: 22px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
  .ak-t1 { font-size: 22px; font-weight: 800; letter-spacing: 1.5px; }
  .ak-t2 { font-size: 10px; opacity: .8; margin-top: 4px; }
  .ak-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 20px; }
  .ak-cell { text-align: center; padding: 9px 4px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 11px; font-weight: 700; }
  .ak-cell:nth-child(odd) { background: #f8f9fa; }
  .ak-cell:nth-child(even) { background: #fff; }
  .ak-sum { text-align: center; padding: 14px; background: #e3f2fd; border: 1.5px solid #1565c0; border-radius: 10px; font-size: 11px; color: #0d47a1; font-weight: 600; }

  /* ===== RESULTS ===== */
  .res-head { background: linear-gradient(135deg, #0d47a1, #1565c0); color: #fff; padding: 36px 30px; text-align: center; }
  .res-brand { font-size: 30px; font-weight: 800; letter-spacing: 2px; }
  .res-sub { font-size: 12px; opacity: .85; margin-top: 6px; }
  .res-body { padding: 30px 40px; }
  .res-title { text-align: center; font-size: 16px; font-weight: 700; margin-bottom: 24px; color: #212529; word-break: break-word; }
  .score-ring { width: 130px; height: 130px; border-radius: 50%; border: 7px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px; }
  .score-ring.pass { border-color: #28a745; background: #d4edda; }
  .score-ring.fail { border-color: #dc3545; background: #f8d7da; }
  .score-pct { font-size: 36px; font-weight: 800; }
  .score-ring.pass .score-pct { color: #155724; }
  .score-ring.fail .score-pct { color: #721c24; }
  .score-raw { font-size: 11px; color: #6c757d; text-align: center; margin-bottom: 20px; }
  .stat-tbl { width: 60%; margin: 0 auto 24px; border-collapse: collapse; }
  .stat-tbl td { padding: 9px 18px; font-size: 11px; border-bottom: 1px solid #dee2e6; }
  .stat-tbl tr:nth-child(even) { background: #f8f9fa; }
  .stat-l { color: #495057; font-weight: 600; }
  .stat-v { text-align: right; font-weight: 700; }
  .ana-head { background: #0d47a1; color: #fff; text-align: center; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
  .ana-tbl { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
  .ana-tbl th { background: #0d47a1; color: #fff; padding: 7px 8px; font-weight: 700; border: 1px solid #0d47a1; }
  .ana-tbl td { padding: 6px 8px; border: 1px solid #dee2e6; text-align: center; word-break: break-word; }
  .ana-tbl tr:nth-child(even) td { background: #f8f9fa; }
  .s-ok { color: #28a745; font-weight: 700; }
  .s-no { color: #dc3545; font-weight: 700; }
  .s-skip { color: #6c757d; }

  /* ===== PAGE BREAKS ===== */
  .page-break { page-break-before: always; }

  /* ===== FOOTER ===== */
  .pdf-footer { margin: 30px 24px 10px; padding-top: 10px; border-top: 1px solid #dee2e6; display: flex; justify-content: space-between; font-size: 8px; color: #adb5bd; }
</style>`;

// ==================== HTML RENDERERS ====================

function renderCoverPage(test, totalQ, lang, includeAnswers) {
  const title = test?.title || 'Mock Test';
  const paper = test?.paper === 'paper1' ? 'Paper 1 - General' : 'Paper 2 - History';
  const duration = test?.duration || 60;
  const marks = totalQ * (test?.marksPerQuestion || 2);
  const langLabel = lang === 'hi' ? 'Hindi' : 'English';

  const instructions = [
    lang === 'hi' ? 'सभी प्रश्न अनिवार्य हैं।' : 'All questions are compulsory.',
    lang === 'hi' ? `प्रत्येक प्रश्न ${test?.marksPerQuestion || 2} अंक का है।` : `Each question carries ${test?.marksPerQuestion || 2} marks.`,
    test?.negativeMarking
      ? (lang === 'hi' ? `गलत उत्तर पर -${test.negativeMarks || 0.5} अंक काटे जाएंगे।` : `Wrong answer: -${test.negativeMarks || 0.5} marks.`)
      : (lang === 'hi' ? 'कोई नकारात्मक अंकन नहीं है।' : 'No negative marking.'),
    lang === 'hi' ? 'सही विकल्प पर गोला लगाएं।' : 'Circle the correct option.',
    lang === 'hi' ? 'काले या नीले पेन का उपयोग करें।' : 'Use black or blue pen.',
    lang === 'hi' ? 'समय समाप्त होने पर परीक्षा समाप्त हो जाएगी।' : 'Test ends when time is up.'
  ];

  return `
    <div class="cover">
      <div class="cover-top">
        <div class="cover-brand">NETprep</div>
        <div class="cover-sub">UGC NET / JRF Exam Preparation</div>
      </div>
      <div class="cover-bar"></div>
      <div class="cover-body">
        <div class="title-box"><div class="title-text">${esc(title)}</div></div>
        <div class="info-grid">
          <div class="info-card c1"><div class="info-label">${lang === 'hi' ? 'पेपर' : 'Paper'}</div><div class="info-value">${esc(paper)}</div></div>
          <div class="info-card c2"><div class="info-label">${lang === 'hi' ? 'प्रश्न' : 'Questions'}</div><div class="info-value">${totalQ}</div></div>
          <div class="info-card c3"><div class="info-label">${lang === 'hi' ? 'समय' : 'Duration'}</div><div class="info-value">${duration} ${lang === 'hi' ? 'मिनट' : 'min'}</div></div>
          <div class="info-card c4"><div class="info-label">${lang === 'hi' ? 'कुल अंक' : 'Marks'}</div><div class="info-value">${marks}</div></div>
        </div>
        <div style="text-align:center;font-size:10px;color:#6c757d;">${lang === 'hi' ? 'भाषा' : 'Language'}: <strong>${langLabel}</strong> &nbsp;|&nbsp; ${lang === 'hi' ? 'दिनांक' : 'Date'}: <strong>${new Date().toLocaleDateString('en-IN')}</strong></div>
        ${test?.negativeMarking ? `<div class="neg-badge">${lang === 'hi' ? 'नकारात्मक अंकन' : 'Negative Marking'}: -${test.negativeMarks || 0.5}</div>` : ''}
        <div class="inst-box">
          <div class="inst-head">${lang === 'hi' ? 'निर्देश' : 'INSTRUCTIONS'}</div>
          <div class="inst-body">${instructions.map((inst, i) => `<div class="inst-item"><span class="inst-num">${i + 1}.</span><span>${esc(inst)}</span></div>`).join('')}</div>
        </div>
        ${includeAnswers ? `<div class="ans-badge">${lang === 'hi' ? '✓ उत्तर कुंजी और व्याख्या शामिल' : '✓ Answer Key & Explanations Included'}</div>` : ''}
      </div>
    </div>`;
}

function renderPassageBox(passageData, lang) {
  if (!passageData) return '';
  const content = getText(passageData.content, lang, '');
  const title = passageData.title || '';
  if (!content) {
    console.warn('Passage has no content for language:', lang, passageData);
    return '';
  }

  const paragraphs = content.split('\n').filter((p) => p.trim());
  console.log('Rendering passage:', title, '| Content length:', content.length);

  return `
    <div class="passage-wrap">
      <div class="p-head">
        <div class="p-icon">P</div>
        <div class="p-label">${lang === 'hi' ? 'गद्यांश / Passage' : 'PASSAGE'}</div>
        ${title ? `<div class="p-title">${esc(title)}</div>` : ''}
      </div>
      <div class="p-body">
        ${paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
    </div>
    <div class="group-label passage-l">${lang === 'hi' ? '▼ निम्नलिखित प्रश्न उपरोक्त गद्यांश पर आधारित हैं:' : '▼ The following questions are based on the above passage:'}</div>`;
}

function renderDIBox(diData, lang) {
  if (!diData) return '';
  console.log('Rendering DI box:', getText(diData.title, lang), '| Type:', diData.diType);

  const title = getText(diData.title, lang, '');
  const instruction = getText(diData.instruction, lang, '');

  let contentHTML = '';

  // Table rendering
  if (diData.tableData) {
    const headers = getArray(diData.tableData.headers, lang);
    const rows = diData.tableData.rows || [];

    console.log('DI Table - Headers:', headers.length, '| Rows:', rows.length);

    if (headers.length > 0 || rows.length > 0) {
      const colCount = Math.max(headers.length, rows[0]?.length || 0);

      contentHTML += '<table class="di-tbl">';

      if (headers.length > 0) {
        contentHTML += '<thead><tr>';
        headers.forEach((h) => {
          contentHTML += `<th>${esc(String(h))}</th>`;
        });
        contentHTML += '</tr></thead>';
      }

      contentHTML += '<tbody>';
      rows.forEach((row) => {
        contentHTML += '<tr>';
        const cells = Array.isArray(row) ? row : [];
        for (let i = 0; i < colCount; i++) {
          const cell = cells[i];
          const val = cell === null || cell === undefined || cell === '' ? '-' : cell;
          const display = typeof val === 'number' ? val.toLocaleString() : String(val);
          contentHTML += `<td>${esc(display)}</td>`;
        }
        contentHTML += '</tr>';
      });
      contentHTML += '</tbody></table>';
    }
  }

  // Caselet text
  if (diData.caseletText) {
    const caselet = getText(diData.caseletText, lang, '');
    if (caselet) {
      contentHTML += `<div class="caselet-text">${esc(caselet)}</div>`;
    }
  }

  // Chart data → convert to table for PDF
  if (
    diData.chartData &&
    diData.chartData.datasets &&
    diData.chartData.datasets.length > 0 &&
    !contentHTML
  ) {
    const labels = getArray(diData.chartData.labels, lang);
    const datasets = diData.chartData.datasets;

    if (labels.length > 0) {
      contentHTML += '<table class="di-tbl"><thead><tr>';
      contentHTML += `<th>${lang === 'hi' ? 'श्रेणी' : 'Category'}</th>`;
      datasets.forEach((ds) => {
        contentHTML += `<th>${esc(getText(ds.label, lang, 'Data'))}</th>`;
      });
      contentHTML += '</tr></thead><tbody>';
      labels.forEach((label, i) => {
        contentHTML += `<tr><td>${esc(label)}</td>`;
        datasets.forEach((ds) => {
          const val = ds.data?.[i] !== undefined ? ds.data[i] : '-';
          contentHTML += `<td>${esc(String(val))}</td>`;
        });
        contentHTML += '</tr>';
      });
      contentHTML += '</tbody></table>';
      contentHTML += `<div style="font-size:8px;color:#7b1fa2;font-style:italic;margin-top:4px;">${lang === 'hi' ? '(चार्ट डेटा तालिका रूप में)' : '(Chart data in table format)'}</div>`;
    }
  }

  if (!contentHTML && !title && !instruction) {
    console.warn('DI has no renderable content');
    return '';
  }

  return `
    <div class="di-wrap">
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
    <div class="group-label di-l">${lang === 'hi' ? '▼ निम्नलिखित प्रश्न उपरोक्त डेटा पर आधारित हैं:' : '▼ The following questions are based on the above data:'}</div>`;
}

function renderOptions(options, correctAnswer, includeAnswers) {
  if (!options || options.length === 0) return '';
  return `<div class="opts">${options
    .map((opt, i) => {
      const isCorrect = includeAnswers && i === correctAnswer;
      return `<div class="opt ${isCorrect ? 'correct' : ''}">
        <div class="opt-c">${OPT[i] || i + 1}</div>
        <div class="opt-t">${esc(String(opt))}</div>
      </div>`;
    })
    .join('')}</div>`;
}

function renderExplanation(explanation, correctAnswer, lang) {
  if (!explanation) return '';
  return `
    <div class="exp-box">
      <div class="exp-top">
        <div class="exp-lbl">${lang === 'hi' ? '✓ व्याख्या' : '✓ EXPLANATION'}</div>
        <div class="exp-ans">Ans: (${OPT[correctAnswer] || '?'})</div>
      </div>
      <div class="exp-txt">${esc(explanation)}</div>
    </div>`;
}

function renderQuestion(q, num, lang, includeAnswers, test) {
  const qType = q.questionType || 'mcq';
  const qText = getText(q.question, lang, '');
  const options = getArray(q.options, lang);
  const explanation = getText(q.explanation, lang, '');
  const typeLabel = TYPE_LABELS[qType]?.[lang] || qType;
  const marksPerQ = test?.marksPerQuestion || 2;

  let typeSpecificHTML = '';

  // Assertion-Reason
  if (qType === 'assertion_reason' && q.assertionReasonData) {
    const assertion = getText(q.assertionReasonData.assertion, lang, '');
    const reason = getText(q.assertionReasonData.reason, lang, '');
    if (assertion)
      typeSpecificHTML += `<div class="ar-box ar-a"><div class="ar-lbl">${lang === 'hi' ? 'कथन (A):' : 'Assertion (A):'}</div><div class="ar-txt">${esc(assertion)}</div></div>`;
    if (reason)
      typeSpecificHTML += `<div class="ar-box ar-r"><div class="ar-lbl">${lang === 'hi' ? 'कारण (R):' : 'Reason (R):'}</div><div class="ar-txt">${esc(reason)}</div></div>`;
  }

  // Statement Based
  if (qType === 'statement_based' && q.statementData) {
    const stmts = getArray(q.statementData.statements, lang);
    const correctStmts = q.statementData.correctStatements || [];
    if (stmts.length > 0) {
      typeSpecificHTML += `<div class="stmt-box">
        <div class="stmt-inst">${lang === 'hi' ? 'निम्नलिखित कथनों पर विचार कीजिए:' : 'Consider the following statements:'}</div>
        ${stmts
          .map((s, i) => {
            let cls = 'stmt-item';
            if (includeAnswers) cls += correctStmts.includes(i) ? ' stmt-ok' : ' stmt-no';
            return `<div class="${cls}"><div class="stmt-n">${i + 1}</div><div class="stmt-t">${esc(s)}</div></div>`;
          })
          .join('')}
        ${includeAnswers ? `<div class="stmt-info">${lang === 'hi' ? 'सही कथन:' : 'Correct:'} ${correctStmts.length > 0 ? correctStmts.map((i) => i + 1).join(', ') : lang === 'hi' ? 'कोई नहीं' : 'None'}</div>` : ''}
      </div>`;
    }
  }

  // Match Following
  if (qType === 'match_following' && q.matchData) {
    const listA = getArray(q.matchData.listA, lang);
    const listB = getArray(q.matchData.listB, lang);
    const labels = ['(a)', '(b)', '(c)', '(d)', '(e)'];
    const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)'];
    const maxLen = Math.max(listA.length, listB.length);
    if (maxLen > 0) {
      typeSpecificHTML += `<div class="match-wrap">
        <div class="match-inst">${lang === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:'}</div>
        <table class="match-tbl"><thead><tr><th>${lang === 'hi' ? 'सूची - I' : 'List - I'}</th><th>${lang === 'hi' ? 'सूची - II' : 'List - II'}</th></tr></thead><tbody>
        ${Array.from({ length: maxLen }, (_, i) => `<tr><td>${labels[i] || ''} ${esc(listA[i] || '')}</td><td>${romans[i] || ''} ${esc(listB[i] || '')}</td></tr>`).join('')}
        </tbody></table></div>`;
    }
  }

  // Sequence Order
  if (qType === 'sequence_order' && q.sequenceData) {
    const items = getArray(q.sequenceData.items, lang);
    if (items.length > 0) {
      typeSpecificHTML += `<div class="seq-wrap">
        <div class="seq-inst">${lang === 'hi' ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:' : 'Arrange in correct order:'}</div>
        ${items.map((item, i) => `<div class="seq-item"><div class="seq-n">${i + 1}</div><div class="seq-t">${esc(item)}</div></div>`).join('')}
      </div>`;
    }
  }

  return `
    <div class="q-block">
      <div class="q-head">
        <span class="q-num">Q${num}</span>
        <span class="q-marks">${marksPerQ}M</span>
        ${qType !== 'mcq' ? `<span class="q-type">${esc(typeLabel)}</span>` : ''}
      </div>
      ${qText ? `<div class="q-text">${esc(qText)}</div>` : ''}
      ${typeSpecificHTML}
      ${renderOptions(options, q.correctAnswer, includeAnswers)}
      ${includeAnswers ? renderExplanation(explanation, q.correctAnswer, lang) : ''}
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
      <div class="ak-grid">${questions.map((q, i) => `<div class="ak-cell">Q${i + 1}: (${OPT[q.correctAnswer] || '?'})</div>`).join('')}</div>
      <div class="ak-sum">${lang === 'hi' ? 'प्रश्न' : 'Questions'}: ${questions.length} | ${lang === 'hi' ? 'अंक' : 'Marks'}: ${questions.length * (test?.marksPerQuestion || 2)} | ${lang === 'hi' ? 'समय' : 'Time'}: ${test?.duration || 60} min</div>
    </div>`;
}

// ==================== HTML GENERATOR ====================

function generateTestHTML(test, questions, lang, includeAnswers) {
  const groups = groupQuestions(questions);
  let qNumber = 1;
  let questionsHTML = '';

  console.log('Groups created:', groups.length);
  groups.forEach((g, i) => {
    console.log(`Group ${i}: type=${g.type}, questions=${g.questions?.length || 1}`);
  });

  groups.forEach((group) => {
    if (group.type === 'passage') {
      questionsHTML += renderPassageBox(group.data, lang);
      group.questions.forEach((q) => {
        questionsHTML += renderQuestion(q, qNumber++, lang, includeAnswers, test);
      });
    } else if (group.type === 'di') {
      questionsHTML += renderDIBox(group.data, lang);
      group.questions.forEach((q) => {
        questionsHTML += renderQuestion(q, qNumber++, lang, includeAnswers, test);
      });
    } else {
      questionsHTML += renderQuestion(group.question, qNumber++, lang, includeAnswers, test);
    }
  });

  return `<div class="pdf-root">
    ${getCSS()}
    ${renderCoverPage(test, questions.length, lang, includeAnswers)}
    <div class="page-break"></div>
    <div class="sec-head">${lang === 'hi' ? 'प्रश्न पत्र' : 'QUESTIONS'}</div>
    ${questionsHTML}
    ${includeAnswers ? renderAnswerKey(questions, test, lang) : ''}
    <div class="pdf-footer">
      <span>NETprep | UGC NET</span>
      <span>${new Date().toLocaleDateString('en-IN')}</span>
      <span>${lang === 'hi' ? 'हिंदी' : 'English'}</span>
    </div>
  </div>`;
}

// ==================== RESULTS HTML ====================

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

  const stats = [
    { l: lang === 'hi' ? 'कुल प्रश्न' : 'Total', v: totalQ, c: '' },
    { l: lang === 'hi' ? 'सही' : 'Correct', v: correct, c: 's-ok' },
    { l: lang === 'hi' ? 'गलत' : 'Wrong', v: wrong, c: 's-no' },
    { l: lang === 'hi' ? 'छोड़े' : 'Skipped', v: skipped, c: 's-skip' },
    { l: lang === 'hi' ? 'सटीकता' : 'Accuracy', v: acc + '%', c: '' }
  ];

  let analysisRows = '';
  QS.forEach((q, i) => {
    const ans = attempt?.answers?.find((a) => String(a.questionId) === String(q._id));
    const yours = ans?.selectedAnswer >= 0 ? `(${OPT[ans.selectedAnswer]})` : '--';
    const correctAns = `(${OPT[q.correctAnswer] || '?'})`;
    let status = '--', cls = 's-skip';
    if (ans) {
      if (ans.isCorrect) { status = lang === 'hi' ? 'सही' : 'CORRECT'; cls = 's-ok'; }
      else if (ans.selectedAnswer >= 0) { status = lang === 'hi' ? 'गलत' : 'WRONG'; cls = 's-no'; }
    }
    analysisRows += `<tr><td>${i + 1}</td><td>${yours}</td><td>${correctAns}</td><td class="${cls}">${status}</td></tr>`;
  });

  return `<div class="pdf-root">
    ${getCSS()}
    <div class="res-head">
      <div class="res-brand">NETprep</div>
      <div class="res-sub">${lang === 'hi' ? 'परीक्षा परिणाम' : 'Test Results'}</div>
    </div>
    <div style="height:4px;background:linear-gradient(90deg,#ff9800,#ffc107,#ff9800);"></div>
    <div class="res-body">
      <div class="res-title">${esc(test?.title || 'Test')}</div>
      <div class="score-ring ${pass ? 'pass' : 'fail'}"><div class="score-pct">${pct}%</div></div>
      <div class="score-raw">${score} / ${total}</div>
      <table class="stat-tbl">${stats.map((s) => `<tr><td class="stat-l">${s.l}</td><td class="stat-v ${s.c}">${s.v}</td></tr>`).join('')}</table>
      ${QS.length > 0 ? `<div class="ana-head">${lang === 'hi' ? 'विस्तृत विश्लेषण' : 'ANALYSIS'}</div>
        <table class="ana-tbl"><thead><tr><th>Q#</th><th>${lang === 'hi' ? 'आपका' : 'Yours'}</th><th>${lang === 'hi' ? 'सही' : 'Correct'}</th><th>${lang === 'hi' ? 'परिणाम' : 'Result'}</th></tr></thead><tbody>${analysisRows}</tbody></table>` : ''}
    </div>
    <div class="pdf-footer"><span>NETprep</span><span>${new Date().toLocaleDateString('en-IN')}</span></div>
  </div>`;
}

// ==================== PDF CONVERTER ====================

async function htmlToPDF(htmlContent, filename) {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.id = 'pdf-render-container';
  container.style.cssText =
    'position:fixed;top:0;left:0;width:794px;z-index:-9999;opacity:0.01;pointer-events:none;overflow:visible;background:#fff;';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Wait for fonts
  await new Promise((r) => setTimeout(r, 800));
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 400));

  const element = container.querySelector('.pdf-root');
  if (!element) {
    document.body.removeChild(container);
    throw new Error('PDF root element not found');
  }

  const opt = {
    margin: [6, 6, 10, 6],
    filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: '#ffffff'
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], before: '.page-break' }
  };

  try {
    await html2pdf().set(opt).from(element).save();
    return { success: true, fileName: filename };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

// ==================== EXPORTS ====================

export const downloadTestPDF = async (test, questions, language = 'en', includeAnswers = false) => {
  try {
    if (!test) throw new Error('Test data required');
    const raw = ensureArray(questions);
    if (raw.length === 0) throw new Error('No questions found');

    console.log('=== PDF EXPORT START ===');
    console.log('Questions:', raw.length, '| Language:', language, '| Answers:', includeAnswers);

    // ⭐ PRE-FETCH missing passage/DI data
    const QS = await prepareQuestions(raw);

    console.log('Questions prepared. Generating HTML...');
    const html = generateTestHTML(test, QS, language, includeAnswers);

    const filename = `${safeName(test.title)}_${language}${includeAnswers ? '_answers' : ''}.pdf`;
    console.log('Converting to PDF:', filename);

    const result = await htmlToPDF(html, filename);
    console.log('=== PDF EXPORT DONE ===');
    return result;
  } catch (err) {
    console.error('PDF Error:', err);
    return { success: false, error: err.message };
  }
};

export const downloadResultsPDF = async (attempt, test, questions, language = 'en') => {
  try {
    if (!attempt) throw new Error('Attempt data required');
    const QS = ensureArray(questions);

    const html = generateResultsHTML(attempt, test, QS, language);
    const filename = `${safeName(test?.title)}_Result_${new Date().toISOString().split('T')[0]}.pdf`;

    return await htmlToPDF(html, filename);
  } catch (err) {
    console.error('PDF Error:', err);
    return { success: false, error: err.message };
  }
};

export const generateTestPDF = downloadTestPDF;
export const generateResultsPDF = downloadResultsPDF;

export default { downloadTestPDF, downloadResultsPDF, generateTestPDF, generateResultsPDF };