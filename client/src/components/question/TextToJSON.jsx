import React, { useState, useMemo, useCallback } from 'react';
import {
  FileText, ArrowRight, Copy, Download, AlertTriangle,
  Trash2, BarChart3, Zap, Eye, ChevronDown, ChevronUp,
  Check, BookOpen, Table2
} from 'lucide-react';
import Button from '../common/Button';
import { useToast } from '../common/Toast';
import { parseText, toImportJSON } from '../../utils/textParser';
import { QUESTION_TYPE_LABELS, OPTION_LABELS, ROMAN_NUMERALS } from '../../utils/constants';
import { copyToClipboard, downloadJSON, getBilingualText, getBilingualArray, getQuestionTypeColor } from '../../utils/helpers';

// ── Sample texts ──
const SAMPLES = {
  hi: `Q1. शिक्षण का कौन सा स्तर समस्या समाधान से संबंधित है?
A) स्मृति स्तर
B) बोध स्तर
C) चिंतन स्तर *
D) इनमें से कोई नहीं
Exp: चिंतन स्तर (Hunt) समस्या समाधान से संबंधित है।

Q2. ब्लूम की वर्गिकी में कितने संज्ञानात्मक स्तर हैं?
A) 4
B) 5
C) 6 ✓
D) 7
Exp: ब्लूम ने 6 संज्ञानात्मक स्तर दिए।

Q3. अभिकथन (A): शिक्षण एक कला है।
कारण (R): शिक्षण में रचनात्मकता आवश्यक है।
A) (A) और (R) दोनों सही, (R) सही व्याख्या
B) (A) और (R) दोनों सही, (R) सही व्याख्या नहीं
C) (A) सही, (R) गलत
D) (A) गलत, (R) सही
Ans: A

Q4. निम्नलिखित कथनों पर विचार कीजिए:
1. प्रत्यक्ष प्रमाण में इंद्रियों का प्रयोग होता है
2. अनुमान प्रमाण में व्याप्ति आवश्यक है
3. शब्द प्रमाण में केवल वेद ही प्रमाण हैं
सही कथन चुनिए:
A) केवल 1 और 2 *
B) केवल 2 और 3
C) केवल 1 और 3
D) 1, 2 और 3
Exp: कथन 3 गलत है।

Q5. सूची-I को सूची-II से सुमेलित कीजिए:
(A) चंद्रगुप्त  (i) कलिंग विजय
(B) अशोक      (ii) सेल्यूकस पर विजय
(C) बिंदुसार    (iii) अमित्रघात
(D) बृहद्रथ     (iv) पुष्यमित्र द्वारा हत्या
A) A-ii, B-i, C-iii, D-iv *
B) A-i, B-ii, C-iv, D-iii
C) A-ii, B-i, C-iv, D-iii
D) A-i, B-iii, C-ii, D-iv`,

  en: `Q1. Which level of teaching is related to problem solving?
A) Memory Level
B) Understanding Level
C) Reflective Level *
D) None of the above
Exp: Reflective level (Hunt) is related to problem solving.

Q2. Assertion (A): Teaching is an art.
Reason (R): Creativity is essential in teaching.
A) Both A and R true, R correct explanation
B) Both A and R true, R not correct explanation
C) A true, R false
D) A false, R true
Ans: A

Q3. Consider the following statements:
1. Pratyaksha uses senses
2. Anumana requires Vyapti
3. Shabda means only Vedas
Which are correct?
A) 1 and 2 only *
B) 2 and 3 only
C) 1 and 3 only
D) All three`,
};

const TextToJSON = ({ language = 'hi', meta = {}, onGenerateJSON, onParsePreview }) => {
  const { success, error: showError } = useToast();
  const [text, setText] = useState('');
  const [showFormats, setShowFormats] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  const parseResult = useMemo(() => {
    if (!text.trim()) return null;
    return parseText(text, { language: 'auto', ...meta });
  }, [text, meta]);

  const jsonOutput = useMemo(() => {
    if (!parseResult?.questions?.length) return null;
    return toImportJSON(parseResult.questions, { language: parseResult.language || language, ...meta });
  }, [parseResult, language, meta]);

  const handleCopy = async () => {
    if (!jsonOutput) return;
    if (await copyToClipboard(JSON.stringify(jsonOutput, null, 2))) success(language === 'hi' ? 'JSON कॉपी हुआ' : 'JSON copied');
  };

  const handleDownload = () => {
    if (!jsonOutput) return;
    downloadJSON(jsonOutput, 'text-to-json.json');
    success('Downloaded');
  };

  const handlePreview = useCallback(() => {
    if (jsonOutput && onParsePreview) onParsePreview(jsonOutput);
  }, [jsonOutput, onParsePreview]);

  const handleToJSON = useCallback(() => {
    if (jsonOutput && onGenerateJSON) onGenerateJSON(JSON.stringify(jsonOutput, null, 2));
  }, [jsonOutput, onGenerateJSON]);

  const conf = parseResult?.stats?.avgConfidence || 0;
  const confColor = conf >= 80 ? 'text-green-600' : conf >= 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-secondary-700">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {language === 'hi' ? 'स्मार्ट टेक्स्ट → JSON' : 'Smart Text → JSON'}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => { setText(SAMPLES[language] || SAMPLES.hi); }} className="text-xs text-primary-600 hover:underline">
              {language === 'hi' ? 'नमूना (सभी प्रकार)' : 'Sample (all types)'}
            </button>
            {text && <button onClick={() => setText('')} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" /> {language === 'hi' ? 'साफ़' : 'Clear'}</button>}
          </div>
        </div>

        {/* Format guide */}
        <button onClick={() => setShowFormats(!showFormats)} className="w-full px-5 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-secondary-700/50 flex items-center justify-between border-b border-gray-100 dark:border-secondary-700">
          <span>{language === 'hi' ? 'समर्थित प्रारूप (MCQ, A-R, Match, Statement, Sequence)' : 'Supported formats (MCQ, A-R, Match, Statement, Sequence)'}</span>
          {showFormats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showFormats && (
          <div className="px-5 py-3 text-xs space-y-3 bg-gray-50 dark:bg-secondary-900/50 border-b border-gray-100 dark:border-secondary-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormatBox title="MCQ" code={`Q1. प्रश्न?\nA) विकल्प 1\nB) विकल्प 2 *\nC) विकल्प 3\nD) विकल्प 4\nAns: B\nExp: व्याख्या`} />
              <FormatBox title="Assertion-Reason" code={`Q2. अभिकथन (A): ...\nकारण (R): ...\nA) दोनों सही, R सही व्याख्या\nB) दोनों सही, R गलत व्याख्या\nC) A सही, R गलत\nD) A गलत, R सही\nAns: A`} />
              <FormatBox title="Statement Based" code={`Q3. कथनों पर विचार कीजिए:\n1. कथन एक\n2. कथन दो\n3. कथन तीन\nA) केवल 1 और 2 *\nB) केवल 2 और 3\nC) 1, 2, 3 सभी\nD) कोई नहीं`} />
              <FormatBox title="Match Following" code={`Q4. सुमेलित कीजिए:\n(A) आइटम 1  (i) मैच 1\n(B) आइटम 2  (ii) मैच 2\n(C) आइटम 3  (iii) मैच 3\nA) A-i, B-ii, C-iii *\nB) A-ii, B-iii, C-i\nC) A-iii, B-i, C-ii\nD) A-i, B-iii, C-ii`} />
            </div>
            <p className="text-gray-400">{language === 'hi' ? 'सही उत्तर चिह्न: * ✓ ✅ √ | उत्तर: Ans: B / उत्तर: C | व्याख्या: Exp: / व्याख्या:' : 'Correct markers: * ✓ ✅ √ | Answer: Ans: B | Explanation: Exp: / व्याख्या:'}</p>
          </div>
        )}

        {/* Text Input */}
        <textarea value={text} onChange={e => setText(e.target.value)} rows={14}
          className="w-full px-5 py-4 font-mono text-sm border-0 bg-transparent dark:text-secondary-100 focus:outline-none resize-none"
          placeholder={language === 'hi'
            ? 'कोई भी प्रारूप में प्रश्न पेस्ट करें...\n\nQ1. प्रश्न?\nA) ...\nB) ... *\nC) ...\nD) ...\nExp: व्याख्या\n\nQ2. अभिकथन (A): ...\nकारण (R): ...\n...\n\nQ3. कथनों पर विचार कीजिए:\n1. कथन 1\n2. कथन 2\nA) केवल 1 *\n...'
            : 'Paste questions in any format...\n\nSupported: MCQ, Assertion-Reason, Match Following, Statement Based, Sequence Order\n\nHindi + English auto-detected'} />

        {/* Stats bar */}
        {parseResult && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-secondary-700 bg-gray-50/50 dark:bg-secondary-900/30 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-secondary-300">
                <BarChart3 className="w-3.5 h-3.5" /> {parseResult.stats.total} {language === 'hi' ? 'प्रश्न' : 'Q'}
              </span>
              {Object.entries(parseResult.stats.byType || {}).map(([t, c]) => (
                <span key={t} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getQuestionTypeColor(t).bg} ${getQuestionTypeColor(t).text}`}>
                  {QUESTION_TYPE_LABELS[t]?.[language] || t}: {c}
                </span>
              ))}
              <span className={`font-medium ${confColor}`}>{conf}%</span>
              <span className="text-gray-400">Lang: {parseResult.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="xs" icon={Copy} onClick={handleCopy} disabled={!jsonOutput}>JSON</Button>
              <Button variant="outline" size="xs" icon={Download} onClick={handleDownload} disabled={!jsonOutput}>{language === 'hi' ? 'डाउनलोड' : 'DL'}</Button>
              <Button variant="outline" size="xs" icon={ArrowRight} onClick={handleToJSON} disabled={!jsonOutput}>{language === 'hi' ? 'JSON →' : 'JSON →'}</Button>
              <Button variant="primary" size="xs" icon={Eye} onClick={handlePreview} disabled={!jsonOutput}>{language === 'hi' ? 'प्रीव्यू' : 'Preview'}</Button>
            </div>
          </div>
        )}
      </div>

      {/* Issues */}
      {parseResult?.issues?.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {parseResult.issues.length} {language === 'hi' ? 'समस्याएं' : 'Issues'}
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {parseResult.issues.map((iss, i) => (
              <p key={i} className={`text-xs ${iss.type === 'error' ? 'text-red-600' : iss.type === 'warning' ? 'text-yellow-700' : 'text-gray-500'}`}>
                {iss.type === 'error' ? '●' : iss.type === 'warning' ? '▲' : 'ℹ'} {iss.msg}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Parsed Cards */}
      {parseResult?.questions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-secondary-300">{language === 'hi' ? 'पार्स किए गए प्रश्न' : 'Parsed Questions'}</h4>
            <button onClick={() => setShowJSON(!showJSON)} className="text-xs text-primary-600 hover:underline">{showJSON ? 'Cards' : 'JSON'}</button>
          </div>
          {showJSON ? (
            <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto max-h-96 font-mono">{JSON.stringify(jsonOutput, null, 2)}</pre>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {parseResult.questions.map((q, i) => <SmartCard key={i} q={q} index={i} lang={parseResult.language || language} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Format example box ──
const FormatBox = ({ title, code }) => (
  <div>
    <p className="font-semibold text-gray-600 dark:text-secondary-400 mb-1">{title}:</p>
    <pre className="bg-white dark:bg-secondary-800 p-2 rounded border border-gray-200 dark:border-secondary-700 font-mono text-[10px] whitespace-pre-wrap text-gray-600 dark:text-secondary-400">{code}</pre>
  </div>
);

// ═══════════════════════════════════════════════════════════
// SMART CARD — renders each question type properly in preview
// ═══════════════════════════════════════════════════════════
const SmartCard = ({ q, index, lang }) => {
  const type = q.questionType;
  const qText = q.question?.[lang] || q.question?.hi || q.question?.en || '';
  const opts = q.options?.[lang] || q.options?.hi || q.options?.en || [];
  const typeLabel = QUESTION_TYPE_LABELS[type]?.[lang] || type;
  const tc = getQuestionTypeColor(type);
  const confCol = (q._confidence || 0) >= 80 ? 'bg-green-100 text-green-700' : (q._confidence || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-3 space-y-2">
      {/* Header badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-gray-400">Q{index + 1}</span>
        <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${tc.bg} ${tc.text}`}>{typeLabel}</span>
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${confCol}`}>{q._confidence || 0}%</span>
        {!q._correctDetected && <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-600 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> No ans</span>}
      </div>

      {/* Type-specific content */}
      {type === 'assertion_reason' && q.assertionReasonData ? (
        <div className="space-y-1.5">
          <div className="rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800">
            <div className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold">A: {lang === 'hi' ? 'अभिकथन' : 'Assertion'}</div>
            <div className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-xs text-gray-800 dark:text-gray-200">{getBilingualText(q.assertionReasonData.assertion, lang) || '—'}</div>
          </div>
          <div className="rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-800">
            <div className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold">R: {lang === 'hi' ? 'कारण' : 'Reason'}</div>
            <div className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-xs text-gray-800 dark:text-gray-200">{getBilingualText(q.assertionReasonData.reason, lang) || '—'}</div>
          </div>
        </div>
      ) : type === 'match_following' && q.matchData ? (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{qText}</p>
          {(() => {
            const la = getBilingualArray(q.matchData?.listA, lang);
            const lb = getBilingualArray(q.matchData?.listB, lang);
            if (la.length === 0) return <p className="text-xs text-gray-400 italic">{lang === 'hi' ? 'मैच डेटा उपलब्ध नहीं — एडिट में जोड़ें' : 'Match data not extracted — add in edit'}</p>;
            return (
              <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-700"><th className="px-2 py-1.5 text-left text-white font-bold border-r border-gray-600">{lang === 'hi' ? 'सूची-I' : 'List-I'}</th><th className="px-2 py-1.5 text-left text-white font-bold">{lang === 'hi' ? 'सूची-II' : 'List-II'}</th></tr></thead>
                  <tbody>
                    {la.map((a, idx) => (
                      <tr key={idx} className={idx % 2 ? 'bg-gray-50 dark:bg-secondary-800/50' : 'bg-white dark:bg-secondary-800'}>
                        <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700"><span className="font-bold text-blue-600 mr-1">{OPTION_LABELS[idx] || idx})</span>{a}</td>
                        <td className="px-2 py-1.5"><span className="font-bold text-emerald-600 mr-1">{ROMAN_NUMERALS[idx] || `(${idx+1})`}</span>{lb[idx] || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      ) : type === 'statement_based' && q.statementData ? (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{qText}</p>
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800 p-2 space-y-1">
            {getBilingualArray(q.statementData?.statements, lang).map((st, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs">
                <span className="w-4 h-4 rounded bg-amber-500 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5">{idx + 1}</span>
                <span className="text-gray-800 dark:text-gray-200">{st}</span>
              </div>
            ))}
          </div>
        </div>
      ) : type === 'sequence_order' && q.sequenceData ? (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{qText}</p>
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800 p-2 space-y-1">
            {getBilingualArray(q.sequenceData?.items, lang).map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs">
                <span className="w-4 h-4 rounded bg-orange-500 text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0 mt-0.5">{['I','II','III','IV','V','VI'][idx] || idx+1}</span>
                <span className="text-gray-800 dark:text-gray-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-800 dark:text-gray-200">{qText}</p>
      )}

      {/* Options */}
      {opts.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {opts.map((opt, oi) => (
            <div key={oi} className={`text-xs px-2 py-1 rounded flex items-start gap-1 ${oi === q.correctAnswer ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium' : 'bg-gray-50 text-gray-600 dark:bg-secondary-700 dark:text-secondary-400'}`}>
              <span className="font-bold flex-shrink-0">{OPTION_LABELS[oi] || oi})</span>
              <span className="flex-1">{opt.length > 50 ? opt.substring(0, 50) + '...' : opt}</span>
              {oi === q.correctAnswer && <Check className="w-3 h-3 flex-shrink-0 text-green-600" />}
            </div>
          ))}
        </div>
      )}

      {/* Explanation */}
      {(q.explanation?.[lang] || q.explanation?.hi) && (
        <div className="px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-[10px] text-blue-700 dark:text-blue-400 line-clamp-2">
          <span className="font-semibold">Exp:</span> {q.explanation?.[lang] || q.explanation?.hi}
        </div>
      )}
    </div>
  );
};

export default TextToJSON;