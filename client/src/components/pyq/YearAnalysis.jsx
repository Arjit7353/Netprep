import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, Loader2, Hash, Star, Eye,
  TrendingUp, TrendingDown, Minus, ArrowUpRight, FileText,
  Layers, BookOpen, BarChart3, AlertCircle, Filter, Search, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';
import QuestionViewModal from './QuestionViewModal';

const COLORS = ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

const YearAnalysis = ({ language }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { years, yearData, loading, fetchYears, fetchYearData } = usePYQAnalysis();

  const [selectedId, setSelectedId] = useState(id || null);
  const [expandedUnits, setExpandedUnits] = useState({});
  const [viewQuestion, setViewQuestion] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeSection, setActiveSection] = useState('overview');

  const L = (en, hi) => language === 'hi' ? hi : en;

  useEffect(() => { fetchYears('paper2').catch(() => {}); }, []);

  useEffect(() => {
    if (id) { setSelectedId(id); fetchYearData(id).catch(() => {}); }
    else if (years?.length > 0 && !selectedId) {
      const fId = years[0].id;
      setSelectedId(fId);
      fetchYearData(fId).catch(() => {});
    }
  }, [id, years]);

  const handleYearSelect = (yId) => {
    setSelectedId(yId);
    navigate(`/pyq/year/${yId}`);
    fetchYearData(yId).catch(() => {});
    setExpandedUnits({});
    setSearchQ('');
    setFilterType('all');
  };

  const toggleUnit = (uid) => setExpandedUnits(p => ({ ...p, [uid]: !p[uid] }));

  // Group questions by unit
  const unitGroups = useMemo(() => {
    if (!yearData?.questionTopicMap) return {};
    const g = {};
    yearData.questionTopicMap.forEach(q => {
      const uid = q.unitId || 'unknown';
      if (!g[uid]) g[uid] = { unitId: uid, unitName: q.unitName || uid, items: [] };
      g[uid].items.push(q);
    });
    return g;
  }, [yearData]);

  // Filtered questions for search
  const filteredQuestions = useMemo(() => {
    if (!yearData?.questionTopicMap) return [];
    let list = [...yearData.questionTopicMap];
    if (filterType !== 'all') list = list.filter(q => q.type === filterType);
    if (searchQ.trim()) {
      const s = searchQ.toLowerCase();
      list = list.filter(q =>
        (q.questionText || '').toLowerCase().includes(s) ||
        (q.questionTextHi || '').toLowerCase().includes(s) ||
        (q.chapter || '').toLowerCase().includes(s) ||
        (q.topic || '').toLowerCase().includes(s) ||
        (q.originalQNo || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [yearData, filterType, searchQ]);

  // Unique types
  const questionTypes = useMemo(() => {
    if (!yearData?.questionTopicMap) return [];
    return [...new Set(yearData.questionTopicMap.map(q => q.type).filter(Boolean))];
  }, [yearData]);

  // Charts
  const typeChartData = useMemo(() => {
    if (!yearData?.questionTypeBreakdown) return [];
    return yearData.questionTypeBreakdown.map(t => ({ name: t.label || t.type, count: t.count, pct: t.percentage }));
  }, [yearData]);

  const unitPieData = useMemo(() => {
    if (!yearData?.unitWeightage) return [];
    return yearData.unitWeightage.filter(u => u.questionCount > 0).map((u, i) => ({
      name: u.unitName?.replace(/^UNIT\s+\w+:\s*/i, '').substring(0, 18) || `U${i+1}`,
      value: u.questionCount, pct: u.percentage
    }));
  }, [yearData]);

  const sections = [
    { id: 'overview', label: L('Overview', 'अवलोकन') },
    { id: 'questions', label: L('Questions', 'प्रश्न') },
    { id: 'units', label: L('Unit Details', 'इकाई विवरण') },
    { id: 'topics', label: L('Top Topics', 'शीर्ष विषय') },
    { id: 'extras', label: L('More', 'अधिक') },
  ];

  const contentCount = yearData?.contentStats?.totalWithContent || yearData?.questionTopicMap?.filter(q => q.hasContent)?.length || 0;

  if (loading && !yearData) {
    return (
      <div className="flex justify-center py-24">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-200 dark:border-violet-800" />
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-secondary-400">{L('Loading...', 'लोड हो रहा है...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Year Selector Pills */}
      {years?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.map(y => (
            <button key={y.id} onClick={() => handleYearSelect(y.id)}
              className={`group relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border
                ${selectedId === y.id
                  ? 'text-white border-transparent shadow-lg shadow-violet-500/25'
                  : 'bg-white dark:bg-secondary-800 text-gray-600 dark:text-secondary-400 border-gray-200 dark:border-secondary-700 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md'}`}
            >
              {selectedId === y.id && <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl" />}
              <span className="relative">{y.year} {y.session.charAt(0).toUpperCase() + y.session.slice(1)}
                {y.shift !== 'none' && ` (${y.shift === 'shift1' ? 'S1' : 'S2'})`}
              </span>
            </button>
          ))}
        </div>
      )}

      {!yearData ? (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-200 dark:border-secondary-700 p-14 text-center">
          <Layers className="w-10 h-10 text-gray-300 dark:text-secondary-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-secondary-400">{L('Select a year', 'एक वर्ष चुनें')}</p>
        </div>
      ) : (
        <>
          {/* Header Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-violet-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">{yearData.displayLabel}</h2>
              <p className="text-white/60 text-xs mt-1">{yearData.subject || 'History'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
                {[
                  { label: L('Total Q', 'कुल प्रश्न'), value: yearData.overview?.totalQuestions || 0 },
                  { label: L('Marks', 'अंक'), value: yearData.overview?.totalMarks || 0 },
                  { label: L('Per Q', 'प्रति प्रश्न'), value: yearData.overview?.marksPerQuestion || 2 },
                  { label: L('Neg.', 'नकारात्मक'), value: yearData.overview?.negativeMarking ? L('Yes','हां') : L('No','नहीं') },
                  { label: L('With Text', 'पाठ'), value: contentCount },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-xl sm:text-2xl font-black">{s.value}</p>
                    <p className="text-[10px] text-white/60 mt-0.5 font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-secondary-700/50 rounded-xl p-1 overflow-x-auto scrollbar-none">
            {sections.map(sec => (
              <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  activeSection === sec.id
                    ? 'bg-white dark:bg-secondary-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-gray-500 dark:text-secondary-400 hover:text-gray-700'}`}
              >{sec.label}</button>
            ))}
          </div>

          {/* ── OVERVIEW SECTION ── */}
          {activeSection === 'overview' && (
            <div className="space-y-5">
              {/* Type Breakdown */}
              {typeChartData.length > 0 && (
                <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-violet-500" />{L('Question Type Breakdown', 'प्रश्न प्रकार')}
                  </h3>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,30,0.95)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                          formatter={(v, n, p) => [`${v} Q (${p.payload.pct}%)`, '']} />
                        <Bar dataKey="count" radius={[0,8,8,0]} barSize={22}>
                          {typeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Unit Table + Pie */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-secondary-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-violet-500" />{L('Unit Weightage', 'इकाई भार')}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50/80 dark:bg-secondary-700/40">
                          <th className="text-left px-4 py-2.5 font-bold text-gray-500 dark:text-secondary-400">{L('Unit','इकाई')}</th>
                          <th className="text-center px-2 py-2.5 font-bold text-gray-500 dark:text-secondary-400">Q</th>
                          <th className="text-center px-2 py-2.5 font-bold text-gray-500 dark:text-secondary-400">{L('Marks','अंक')}</th>
                          <th className="text-center px-2 py-2.5 font-bold text-gray-500 dark:text-secondary-400">%</th>
                          <th className="text-center px-2 py-2.5 font-bold text-gray-500 dark:text-secondary-400">ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(yearData.unitWeightage || []).map((u, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-secondary-700/30 hover:bg-violet-50/30 dark:hover:bg-violet-900/5 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-secondary-200">{u.unitName || `Unit ${i+1}`}</td>
                            <td className="text-center px-2 py-2.5 font-black text-gray-900 dark:text-white">{u.questionCount}</td>
                            <td className="text-center px-2 py-2.5 text-gray-600 dark:text-secondary-400">{u.marks}</td>
                            <td className="text-center px-2 py-2.5">
                              <div className="inline-flex items-center">
                                <div className="w-12 h-1.5 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden mr-1.5">
                                  <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, u.percentage * 3)}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 dark:text-secondary-400">{u.percentage}%</span>
                              </div>
                            </td>
                            <td className="text-center px-2 py-2.5">
                              <div className="flex items-center justify-center gap-px">
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <Star key={si} className={`w-2.5 h-2.5 ${si < (u.roiScore || 3) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-secondary-600'}`} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {unitPieData.length > 0 && (
                  <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-4 flex flex-col">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">{L('Distribution', 'वितरण')}</h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={unitPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                            outerRadius="80%" innerRadius="40%" paddingAngle={2}
                            label={({ pct }) => `${pct}%`} labelLine={false} fontSize={9}>
                            {unitPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => [`${v} Q`]} contentStyle={{ borderRadius: '12px', fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Difficulty Matrix */}
              {yearData.difficultyMatrix?.length > 0 && (
                <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">{L('Difficulty Zones', 'कठिनाई क्षेत्र')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {yearData.difficultyMatrix.map((d, i) => {
                      const zs = { GREEN: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-900/10', RED: 'border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-900/10', YELLOW: 'border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10', BLUE: 'border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/10' };
                      const dots = { GREEN: 'bg-emerald-500', RED: 'bg-red-500', YELLOW: 'bg-amber-500', BLUE: 'bg-blue-500' };
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 ${zs[d.zone] || zs.YELLOW}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${dots[d.zone] || dots.YELLOW} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-white">{d.qRange} — {d.type}</p>
                            <p className="text-[10px] text-gray-500 dark:text-secondary-400">{d.difficulty} | {L('Target','लक्ष्य')}: {d.targetScore}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── QUESTIONS SECTION ── */}
          {activeSection === 'questions' && (
            <div className="space-y-4">
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} type="text"
                    placeholder={L('Search questions, topics, chapters...', 'प्रश्न, विषय, अध्याय खोजें...')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all" />
                  {searchQ && (
                    <button onClick={() => setSearchQ('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="text-xs bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-xl px-3 py-2.5 text-gray-700 dark:text-secondary-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                    <option value="all">{L('All Types','सभी प्रकार')}</option>
                    {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Results count */}
              <p className="text-xs text-gray-500 dark:text-secondary-400">
                {filteredQuestions.length} {L('questions found', 'प्रश्न मिले')}
                {contentCount > 0 && ` | ${contentCount} ${L('viewable', 'देखने योग्य')}`}
              </p>

              {/* Questions List */}
              <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
                <div className="divide-y divide-gray-50 dark:divide-secondary-700/40">
                  {filteredQuestions.map((q, qi) => {
                    const hasText = q.hasContent || q.questionText || q.questionTextHi;
                    
                    // ═══ FIX: Build proper preview text based on question type ═══
                    let preview = '';
                    const qType = q.type || '';
                    
                    if (qType === 'assertion_reason' || qType === 'ar') {
                      // For A-R, show assertion text, not topic
                      const aText = q.assertionHi || q.assertion || q.assertionEn || '';
                      if (aText) {
                        preview = (language === 'hi' ? 'अभिकथन: ' : 'A: ') + aText.substring(0, 70) + (aText.length > 70 ? '...' : '');
                      }
                    } else if (qType === 'passage' || qType === 'comprehension' || qType === 'passage_based') {
                      // For passage, show sub-question text or passage title
                      const subQ = q.subQuestions?.[0];
                      const sqText = subQ?.questionTextHi || subQ?.questionText || subQ?.questionTextEn || '';
                      if (sqText) {
                        preview = sqText.substring(0, 80) + (sqText.length > 80 ? '...' : '');
                      } else {
                        const pText = q.passageHi || q.passage || q.passageEn || '';
                        if (pText) {
                          preview = (language === 'hi' ? 'गद्यांश: ' : 'Passage: ') + pText.substring(0, 60) + '...';
                        }
                      }
                    } else if (qType === 'matching' || qType === 'match_following') {
                      // For matching, show instruction or list items
                      const listA = q.listAHi || q.listA || [];
                      if (listA.length > 0) {
                        preview = (language === 'hi' ? 'सुमेलित: ' : 'Match: ') + listA.slice(0, 2).join(', ') + '...';
                      }
                    } else if (qType === 'multi_statement' || qType === 'statement_based') {
                      // For statements, show first statement
                      const stmts = q.statementsHi || q.statements || [];
                      if (stmts.length > 0) {
                        preview = (language === 'hi' ? 'कथन: ' : 'Statement: ') + stmts[0].substring(0, 70) + '...';
                      }
                    } else if (qType === 'chronology' || qType === 'sequence_order') {
                      const items = q.itemsHi || q.items || [];
                      if (items.length > 0) {
                        preview = (language === 'hi' ? 'क्रम: ' : 'Order: ') + items.slice(0, 2).join(', ') + '...';
                      }
                    }
                    
                    // Fallback to questionText fields
                    if (!preview) {
                      const qText = (language === 'hi' ? q.questionTextHi : q.questionTextEn) || q.questionText || q.questionTextHi || q.questionTextEn || '';
                      preview = qText.substring(0, 80) + (qText.length > 80 ? '...' : '');
                    }

                    return (
                      <div key={qi}
                        className={`flex items-center gap-3 px-4 py-3 transition-all ${
                          hasText ? 'hover:bg-violet-50/50 dark:hover:bg-violet-900/10 cursor-pointer' : 'hover:bg-gray-50 dark:hover:bg-secondary-700/20'}`}
                        onClick={() => hasText ? setViewQuestion(q) : null}
                      >
                        {/* Q Number */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-black text-violet-600 dark:text-violet-400">{q.originalQNo || `Q${q.qNo}`}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {preview ? (
                            <p className="text-xs text-gray-800 dark:text-secondary-200 truncate font-medium">{preview}</p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-secondary-400 italic">{L('No question text','प्रश्न पाठ नहीं')}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded font-bold">{q.type}</span>
                            {q.chapter && <span className="text-[9px] text-gray-400 dark:text-secondary-500 truncate max-w-[120px]">{q.chapter}</span>}
                            {q.topic && <span className="text-[9px] text-gray-400 dark:text-secondary-500">• {q.topic}</span>}
                          </div>
                        </div>

                        {/* Importance */}
                        <div className="flex items-center gap-px flex-shrink-0">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} className={`w-2.5 h-2.5 ${si < (q.importance || 3) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-secondary-700'}`} />
                          ))}
                        </div>

                        {/* View button */}
                        {hasText && (
                          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                            <Eye className="w-3.5 h-3.5 text-violet-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {filteredQuestions.length === 0 && (
                  <div className="p-10 text-center text-sm text-gray-400">{L('No questions match','कोई प्रश्न मेल नहीं')}</div>
                )}
              </div>
            </div>
          )}

          {/* ── UNIT DETAILS SECTION ── */}
          {activeSection === 'units' && Object.keys(unitGroups).length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-secondary-700/40">
                {Object.values(unitGroups).sort((a,b) => a.unitId > b.unitId ? 1 : -1).map(group => {
                  const isExp = expandedUnits[group.unitId];
                  const withContent = group.items.filter(q => q.hasContent).length;
                  return (
                    <div key={group.unitId}>
                      <button onClick={() => toggleUnit(group.unitId)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 dark:hover:bg-secondary-700/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExp ? <ChevronDown className="w-4 h-4 text-violet-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{group.unitName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {withContent > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">{withContent} viewable</span>}
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">{group.items.length} Q</span>
                        </div>
                      </button>
                      {isExp && (
                        <div className="px-4 pb-4">
                          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-secondary-700/50">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50/80 dark:bg-secondary-700/30">
                                  <th className="text-left px-3 py-2 font-bold text-gray-500 dark:text-secondary-400">Q.No</th>
                                  <th className="text-left px-3 py-2 font-bold text-gray-500 dark:text-secondary-400">{L('Type','प्रकार')}</th>
                                  <th className="text-left px-3 py-2 font-bold text-gray-500 dark:text-secondary-400">{L('Chapter','अध्याय')}</th>
                                  <th className="text-left px-3 py-2 font-bold text-gray-500 dark:text-secondary-400">{L('Topic','विषय')}</th>
                                  <th className="text-center px-3 py-2 font-bold text-gray-500 dark:text-secondary-400">{L('Imp','महत्व')}</th>
                                  <th className="text-center px-2 py-2 font-bold text-gray-500 dark:text-secondary-400"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.items.map((q, qi) => (
                                  <tr key={qi}
                                    className={`border-b border-gray-50 dark:border-secondary-700/20 ${q.hasContent ? 'hover:bg-violet-50/40 dark:hover:bg-violet-900/5 cursor-pointer' : ''}`}
                                    onClick={() => q.hasContent ? setViewQuestion(q) : null}
                                  >
                                    <td className="px-3 py-2 font-mono font-black text-violet-600 dark:text-violet-400">{q.originalQNo || `Q${q.qNo}`}</td>
                                    <td className="px-3 py-2"><span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">{q.type}</span></td>
                                    <td className="px-3 py-2 text-gray-700 dark:text-secondary-300 max-w-[140px] truncate">{q.chapter}</td>
                                    <td className="px-3 py-2 text-gray-500 dark:text-secondary-400 max-w-[140px] truncate">{q.topic || '-'}</td>
                                    <td className="text-center px-3 py-2">
                                      <div className="flex justify-center gap-px">
                                        {Array.from({ length: 5 }).map((_, si) => (
                                          <Star key={si} className={`w-2 h-2 ${si < (q.importance || 3) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-secondary-600'}`} />
                                        ))}
                                      </div>
                                    </td>
                                    <td className="text-center px-2 py-2">
                                      {q.hasContent && <Eye className="w-3.5 h-3.5 text-violet-400 mx-auto" />}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TOP TOPICS SECTION ── */}
          {activeSection === 'topics' && yearData.topTopics?.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-secondary-700/40">
                {yearData.topTopics.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5 hover:bg-violet-50/30 dark:hover:bg-violet-900/5 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs ${
                      i < 3 ? 'bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20'
                      : i < 7 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                      : 'bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400'
                    }`}>#{t.rank || i+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{language === 'hi' && t.topicHi ? t.topicHi : t.topic}</p>
                      <p className="text-[10px] text-gray-500 dark:text-secondary-400 mt-0.5">{t.unitName} {t.chapter ? `| ${t.chapter}` : ''}</p>
                      {t.questionNumbers?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.questionNumbers.map((qn, qi) => (
                            <span key={qi} className="text-[9px] px-1.5 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-500 dark:text-violet-400 rounded font-mono font-bold">{qn}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black text-violet-600 dark:text-violet-400">{t.questionCount}Q</p>
                      {t.mustScore && <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">{L('MUST','जरूरी')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EXTRAS SECTION ── */}
          {activeSection === 'extras' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Trends */}
              {yearData.trends?.length > 0 && (
                <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-500" />{L('Trends','रुझान')}
                  </h3>
                  <div className="space-y-2.5">
                    {yearData.trends.map((t, i) => {
                      const icons = { new: TrendingUp, increasing: TrendingUp, decreasing: TrendingDown, stable: Minus, emerged: ArrowUpRight };
                      const colors = { new: 'text-blue-500', increasing: 'text-red-500', decreasing: 'text-green-500', stable: 'text-gray-400', emerged: 'text-purple-500' };
                      const Icon = icons[t.direction] || Minus;
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50/80 dark:bg-secondary-700/20 rounded-xl">
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors[t.direction] || 'text-gray-400'}`} />
                          <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-white">{t.trend}</p>
                            {t.evidence && <p className="text-[10px] text-gray-500 dark:text-secondary-400 mt-0.5">{t.evidence}</p>}
                            {t.tip && <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1 font-medium italic">{t.tip}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Concepts */}
              {yearData.conceptsTracked?.length > 0 && (
                <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-secondary-700">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-500" />{L('Concepts','सिद्धांत')}
                    </h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50/90 dark:bg-secondary-700/40 backdrop-blur-sm">
                        <tr>
                          <th className="text-left px-4 py-2 font-bold text-gray-500 dark:text-secondary-400">{L('Concept','सिद्धांत')}</th>
                          <th className="text-center px-2 py-2 font-bold text-gray-500 dark:text-secondary-400">Q</th>
                          <th className="text-center px-2 py-2 font-bold text-gray-500 dark:text-secondary-400">{L('Type','प्रकार')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearData.conceptsTracked.map((c, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-secondary-700/20">
                            <td className="px-4 py-2 text-gray-800 dark:text-secondary-200 font-medium">{language === 'hi' && c.conceptHi ? c.conceptHi : c.concept}</td>
                            <td className="text-center px-2 py-2 font-mono font-bold text-violet-600 dark:text-violet-400">{c.qNo}</td>
                            <td className="text-center px-2 py-2 text-gray-400">{c.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Question View Modal */}
      {viewQuestion && (
        <QuestionViewModal question={viewQuestion} language={language} onClose={() => setViewQuestion(null)} />
      )}
    </div>
  );
};

export default YearAnalysis;