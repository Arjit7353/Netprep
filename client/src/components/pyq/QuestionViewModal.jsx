import React from 'react';
import { X, Hash, BookOpen, Star, CheckCircle2, Tag, Lightbulb, FileText, Layers, Table, BarChart3, PieChart as PieIcon, TrendingUp, List, MessageSquare, ArrowDownUp, GitCompare, Image } from 'lucide-react';

const OPT = ['A','B','C','D','E','F','G','H'];
const ROM = ['i','ii','iii','iv','v','vi','vii','viii'];

const QuestionViewModal = ({ question: q, language, onClose }) => {
  if (!q) return null;
  const L = (en, hi) => language === 'hi' ? hi : en;
  const txt = (f, fHi, fEn) => {
    if (language === 'hi') return q[fHi] || q[f] || q[fEn] || '';
    return q[fEn] || q[f] || q[fHi] || '';
  };
  const arr = (f, fHi, fEn) => {
    if (language === 'hi' && q[fHi]?.length) return q[fHi];
    if (language === 'en' && q[fEn]?.length) return q[fEn];
    return q[f] || [];
  };

  const qText = txt('questionText','questionTextHi','questionTextEn');
  const instr = txt('instruction','instructionHi','instruction');
  const expl = txt('explanation','explanationHi','explanationEn');
  const opts = arr('options','optionsHi','optionsEn');
  const ci = typeof q.correctAnswer === 'number' ? q.correctAnswer : null;
  const t = q.type || 'simple_mcq';

  const typeLabels = {
    simple_mcq:'MCQ', mcq:'MCQ', bulk_mcq:'Bulk MCQ', multi_statement:'Multi-Statement',
    statement_based:'Statement Based', matching:'Match Following', match_following:'Match Following',
    chronology:'Chronology', sequence_order:'Sequence Order', assertion_reason:'Assertion-Reason',
    comprehension:'Comprehension', passage_based:'Passage Based',
    di_table:'DI - Table', di_bar_chart:'DI - Bar Chart', di_pie_chart:'DI - Pie Chart',
    di_line_graph:'DI - Line Graph', di_caselet:'DI - Caselet', di_mixed:'DI - Mixed', pyq:'PYQ'
  };

  const typeIcons = {
    simple_mcq: FileText, mcq: FileText, multi_statement: List, statement_based: List,
    matching: GitCompare, match_following: GitCompare, chronology: ArrowDownUp, sequence_order: ArrowDownUp,
    assertion_reason: MessageSquare, comprehension: BookOpen, passage_based: BookOpen,
    di_table: Table, di_bar_chart: BarChart3, di_pie_chart: PieIcon,
    di_line_graph: TrendingUp, di_caselet: FileText, di_mixed: BarChart3
  };
  const TypeIcon = typeIcons[t] || FileText;

  // ── Renderers ──

  const renderPassage = () => {
    const p = txt('passage','passageHi','passageEn');
    if (!p) return null;
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-800/40">
        {q.passageTitle && <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">{q.passageTitle}</p>}
        <p className="text-xs font-bold text-amber-600/70 dark:text-amber-400/70 mb-2 uppercase tracking-wider">{L('Passage','गद्यांश')}</p>
        <p className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-wrap">{p}</p>
      </div>
    );
  };

  const renderAssertionReason = () => {
    const a = txt('assertion','assertionHi','assertionEn');
    const r = txt('reason','reasonHi','reasonEn');
    if (!a && !r) return null;
    return (
      <div className="space-y-3">
        {a && (
          <div className="bg-blue-50 dark:bg-blue-900/12 rounded-2xl p-4 border border-blue-200/60 dark:border-blue-800/40">
            <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-1.5 uppercase tracking-wider">{L('Assertion (A)','अभिकथन (A)')}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{a}</p>
          </div>
        )}
        {r && (
          <div className="bg-purple-50 dark:bg-purple-900/12 rounded-2xl p-4 border border-purple-200/60 dark:border-purple-800/40">
            <p className="text-[10px] font-bold text-purple-500 dark:text-purple-400 mb-1.5 uppercase tracking-wider">{L('Reason (R)','कारण (R)')}</p>
            <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{r}</p>
          </div>
        )}
      </div>
    );
  };

  const renderStatements = () => {
    const st = arr('statements','statementsHi','statementsEn');
    if (!st.length) return null;
    return (
      <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-4 border border-amber-200/60 dark:border-amber-800/40">
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wider">{L('Statements:','कथन:')}</p>
        <div className="space-y-2">
          {st.map((s, i) => {
            const isCorrect = q.correctStatements?.includes(i);
            return (
              <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${isCorrect ? 'bg-emerald-100/60 dark:bg-emerald-900/15 border border-emerald-200/50 dark:border-emerald-800/30' : ''}`}>
                <span className="w-6 h-6 rounded-lg bg-amber-200/70 dark:bg-amber-800/40 flex items-center justify-center text-[10px] font-black text-amber-700 dark:text-amber-400 flex-shrink-0">{i+1}</span>
                <p className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed">{s}</p>
                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMatchTable = () => {
    const la = arr('listA','listAHi','listAEn');
    const lb = arr('listB','listBHi','listBEn');
    if (!la.length && !lb.length) return null;
    const maxLen = Math.max(la.length, lb.length);
    return (
      <div className="rounded-2xl border-2 border-gray-200 dark:border-secondary-600 overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="bg-blue-50 dark:bg-blue-900/15 p-3 border-b-2 border-r-2 border-gray-200 dark:border-secondary-600">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{L('List-I','सूची-I')}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/15 p-3 border-b-2 border-gray-200 dark:border-secondary-600">
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400">{L('List-II','सूची-II')}</p>
          </div>
        </div>
        {Array.from({ length: maxLen }).map((_, i) => (
          <div key={i} className={`grid grid-cols-2 ${i % 2 ? 'bg-gray-50/50 dark:bg-secondary-700/10' : ''}`}>
            <div className="p-3 border-r-2 border-b border-gray-100 dark:border-secondary-700/40 text-sm text-gray-700 dark:text-secondary-300">
              <span className="text-blue-500 font-black mr-2">({String.fromCharCode(65+i)})</span>{la[i] || ''}
            </div>
            <div className="p-3 border-b border-gray-100 dark:border-secondary-700/40 text-sm text-gray-700 dark:text-secondary-300">
              <span className="text-purple-500 font-black mr-2">({ROM[i] || i+1})</span>{lb[i] || ''}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSequence = () => {
    const it = arr('items','itemsHi','itemsEn');
    if (!it.length) return null;
    return (
      <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-4 border border-orange-200/60 dark:border-orange-800/40">
        <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wider">{L('Arrange in order:','क्रम में लगाइए:')}</p>
        <div className="space-y-2">
          {it.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-orange-200/70 dark:bg-orange-800/40 flex items-center justify-center text-[10px] font-black text-orange-700 dark:text-orange-400 flex-shrink-0">{i+1}</span>
              <p className="text-sm text-gray-700 dark:text-secondary-300">{item}</p>
            </div>
          ))}
        </div>
        {q.correctOrder?.length > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-bold">
            {L('Correct Order:','सही क्रम:')} {q.correctOrder.map(i => i+1).join(' → ')}
          </p>
        )}
      </div>
    );
  };

  const renderDITable = () => {
    if (!q.tableData?.headers?.length) return null;
    const h = (language === 'hi' && q.tableData.headersHi?.length) ? q.tableData.headersHi : q.tableData.headers;
    return (
      <div className="rounded-2xl border-2 border-cyan-200 dark:border-cyan-800/50 overflow-hidden">
        <div className="bg-cyan-50 dark:bg-cyan-900/15 px-4 py-2 border-b-2 border-cyan-200 dark:border-cyan-800/50">
          <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">{L('Data Table','डेटा तालिका')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-cyan-50/50 dark:bg-cyan-900/10">
                {h.map((hd, i) => <th key={i} className="px-3 py-2 text-left font-bold text-cyan-700 dark:text-cyan-400 border-b border-cyan-100 dark:border-cyan-800/30">{hd}</th>)}
              </tr>
            </thead>
            <tbody>
              {(q.tableData.rows || []).map((row, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-gray-50/50 dark:bg-secondary-700/10' : ''}>
                  {(Array.isArray(row) ? row : []).map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-gray-700 dark:text-secondary-300 border-b border-gray-50 dark:border-secondary-700/20">
                      {cell === null ? <span className="text-gray-300 italic">—</span> : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderChartData = () => {
    if (!q.chartData?.datasets?.length) return null;
    const labels = (language === 'hi' && q.chartData.labelsHi?.length) ? q.chartData.labelsHi : (q.chartData.labels || []);
    return (
      <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-200/60 dark:border-indigo-800/40">
        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">
          {L('Chart Data','चार्ट डेटा')} {q.chartData.chartType ? `(${q.chartData.chartType})` : ''}
        </p>
        {q.chartData.xAxisLabel && <p className="text-[10px] text-gray-500 mb-1">X: {q.chartData.xAxisLabel} | Y: {q.chartData.yAxisLabel}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-indigo-200/50 dark:border-indigo-800/30">
                <th className="text-left px-2 py-1.5 font-bold text-indigo-600 dark:text-indigo-400">{L('Label','लेबल')}</th>
                {q.chartData.datasets.map((ds, i) => (
                  <th key={i} className="text-center px-2 py-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-1" style={{ backgroundColor: ds.color || '#6366f1' }} />
                    {(language === 'hi' && ds.labelHi) ? ds.labelHi : (ds.label || `Series ${i+1}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, li) => (
                <tr key={li} className={li % 2 ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}>
                  <td className="px-2 py-1.5 font-medium text-gray-700 dark:text-secondary-300">{label}</td>
                  {q.chartData.datasets.map((ds, di) => (
                    <td key={di} className="text-center px-2 py-1.5 text-gray-600 dark:text-secondary-400 tabular-nums font-bold">{ds.data?.[li] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCaselet = () => {
    const ct = txt('caseletText','caseletTextHi','caseletTextEn');
    if (!ct) return null;
    return (
      <div className="bg-teal-50 dark:bg-teal-900/10 rounded-2xl p-5 border border-teal-200/60 dark:border-teal-800/40">
        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-wider">{L('Caselet Data','केसलेट डेटा')}</p>
        <p className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-wrap">{ct}</p>
      </div>
    );
  };

  const renderImage = () => {
    if (!q.imageUrl) return null;
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-secondary-700">
        <div className="bg-gray-50 dark:bg-secondary-700/30 px-4 py-2 border-b border-gray-200 dark:border-secondary-700 flex items-center gap-2">
          <Image className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] font-bold text-gray-500 uppercase">{L('Image','छवि')}</span>
        </div>
        <img src={q.imageUrl} alt="Question" className="w-full max-h-80 object-contain bg-white dark:bg-secondary-800 p-2" />
      </div>
    );
  };

  const renderSubQuestions = () => {
    if (!q.subQuestions?.length) return null;
    return (
      <div className="space-y-4">
        <p className="text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider">{L('Sub-Questions','उप-प्रश्न')} ({q.subQuestions.length})</p>
        {q.subQuestions.map((sq, si) => {
          const sqText = (language === 'hi' && sq.questionTextHi) ? sq.questionTextHi : (sq.questionText || '');
          const sqOpts = (language === 'hi' && sq.optionsHi?.length) ? sq.optionsHi : (sq.options || []);
          const sqExpl = (language === 'hi' && sq.explanationHi) ? sq.explanationHi : (sq.explanation || '');
          const sqCi = typeof sq.correctAnswer === 'number' ? sq.correctAnswer : null;
          return (
            <div key={si} className="bg-gray-50 dark:bg-secondary-700/20 rounded-xl p-4 border border-gray-100 dark:border-secondary-700/40">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-2">Q{sq.qNo || si+1}.</p>
              {sqText && <p className="text-sm text-gray-800 dark:text-secondary-200 mb-3 whitespace-pre-wrap">{sqText}</p>}
              {sqOpts.length > 0 && (
                <div className="space-y-1.5">
                  {sqOpts.map((o, oi) => (
                    <div key={oi} className={`flex items-start gap-2 p-2 rounded-lg ${sqCi === oi ? 'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/40' : ''}`}>
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black flex-shrink-0 ${sqCi === oi ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-secondary-600 text-gray-500'}`}>{OPT[oi]}</span>
                      <p className={`text-xs ${sqCi === oi ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-600 dark:text-secondary-400'}`}>{o}</p>
                    </div>
                  ))}
                </div>
              )}
              {sqExpl && <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-2 italic">{sqExpl}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderOptions = () => {
    if (!opts.length) return null;
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 dark:text-secondary-400 uppercase tracking-wider">{L('Options','विकल्प')}</p>
        {opts.map((opt, i) => {
          const isC = ci === i;
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${isC ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-secondary-700/20 border-gray-100 dark:border-secondary-700/50'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${isC ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-secondary-600 text-gray-500 dark:text-secondary-300'}`}>{OPT[i]}</div>
              <p className={`text-sm leading-relaxed flex-1 ${isC ? 'text-emerald-800 dark:text-emerald-300 font-medium' : 'text-gray-700 dark:text-secondary-300'}`}>{opt}</p>
              {isC && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Determine what to render based on type ──
  const isAR = ['assertion_reason'].includes(t);
  const isStmt = ['multi_statement','statement_based'].includes(t);
  const isMatch = ['matching','match_following'].includes(t);
  const isSeq = ['chronology','sequence_order'].includes(t);
  const isPassage = ['comprehension','passage_based'].includes(t);
  const isDITable = t === 'di_table';
  const isDIChart = ['di_bar_chart','di_pie_chart','di_line_graph','di_mixed'].includes(t);
  const isDICaselet = t === 'di_caselet';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-secondary-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-extrabold text-lg tracking-tight">{q.originalQNo || `Q${q.qNo}`}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[9px] px-2 py-0.5 bg-white/15 rounded-full text-white/90 font-bold">{typeLabels[t] || t}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${q.difficulty === 'easy' ? 'bg-emerald-400/25 text-emerald-100' : q.difficulty === 'hard' ? 'bg-red-400/25 text-red-100' : 'bg-amber-400/25 text-amber-100'}`}>{q.difficulty || 'medium'}</span>
                  {q.importance && (
                    <span className="flex items-center gap-px">
                      {Array.from({ length: q.importance }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Metadata */}
          <div className="flex flex-wrap gap-1.5">
            {q.unitName && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-violet-50 dark:bg-violet-900/15 text-violet-600 dark:text-violet-400 rounded-lg font-bold"><Layers className="w-2.5 h-2.5" />{q.unitName}</span>}
            {q.chapter && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 rounded-lg font-bold"><BookOpen className="w-2.5 h-2.5" />{q.chapter}</span>}
            {q.topic && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold"><Tag className="w-2.5 h-2.5" />{q.topic}</span>}
          </div>

          {/* Type-specific content */}
          {isPassage && renderPassage()}
          {isAR && renderAssertionReason()}
          {isStmt && renderStatements()}
          {isMatch && renderMatchTable()}
          {isSeq && renderSequence()}
          {isDITable && renderDITable()}
          {isDIChart && renderChartData()}
          {isDICaselet && renderCaselet()}
          {renderImage()}

          {/* Instruction */}
          {instr && (
            <div className="bg-gray-50 dark:bg-secondary-700/20 rounded-xl px-4 py-3 border border-gray-100 dark:border-secondary-700/40">
              <p className="text-xs text-gray-600 dark:text-secondary-400 italic">{instr}</p>
            </div>
          )}

          {/* Question Text */}
          {qText && (
            <div className="bg-gray-50 dark:bg-secondary-700/20 rounded-2xl p-4 border border-gray-100 dark:border-secondary-700/40">
              <p className="text-[10px] font-bold text-gray-400 dark:text-secondary-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3 h-3" />{L('Question','प्रश्न')}</p>
              <p className="text-sm text-gray-800 dark:text-secondary-200 leading-relaxed whitespace-pre-wrap">{qText}</p>
            </div>
          )}

          {/* Options */}
          {renderOptions()}

          {/* Correct answer text fallback */}
          {opts.length === 0 && q.correctAnswerText && (
            <div className="bg-emerald-50 dark:bg-emerald-900/15 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/40">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">{L('Answer','उत्तर')}</p>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">{q.correctAnswerText}</p>
            </div>
          )}

          {/* Sub-Questions */}
          {renderSubQuestions()}

          {/* Explanation */}
          {expl && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 rounded-2xl p-5 border border-violet-100 dark:border-violet-800/40">
              <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 mb-2 uppercase tracking-wider flex items-center gap-1.5"><Lightbulb className="w-3 h-3" />{L('Explanation','व्याख्या')}</p>
              <p className="text-sm text-gray-700 dark:text-secondary-300 leading-relaxed whitespace-pre-wrap">{expl}</p>
            </div>
          )}

          {/* Key Terms */}
          {q.keyTerms?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {q.keyTerms.map((kt, i) => <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-secondary-700 text-gray-500 dark:text-secondary-400 rounded-md text-[10px] font-medium">{kt}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionViewModal;