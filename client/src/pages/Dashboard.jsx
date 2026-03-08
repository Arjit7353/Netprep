import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  FileQuestion, ClipboardList, BarChart3, TrendingUp, Upload,
  PlusCircle, Clock, Target, BookOpen, Award, ArrowRight,
  Calendar, Zap, Trophy, Flame, Star, ChevronRight, Play,
  Brain, Timer, CheckCircle, XCircle, SkipForward,
  Activity, TrendingDown, RefreshCw, Layers, Eye,
  PieChart as PieChartIcon, History, Sparkles, GraduationCap,
  ChevronUp, ChevronDown, Hash, Crown, BarChart2,
  Sun, Moon, Coffee, Sunset, Gauge, Medal, Lock,
  Lightbulb, AlertTriangle, Info, Rocket, Crosshair,
  Swords, FileText, LayoutGrid, AlertCircle, Shield,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';

// ════════════════════════════════════════════
//              UTILITIES
// ════════════════════════════════════════════
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { I: Moon, en: 'Late Night Study', hi: 'देर रात', g: 'from-indigo-600 to-purple-700' };
  if (h < 12) return { I: Sun, en: 'Good Morning', hi: 'सुप्रभात', g: 'from-amber-500 to-orange-600' };
  if (h < 17) return { I: Coffee, en: 'Good Afternoon', hi: 'नमस्ते', g: 'from-blue-600 to-indigo-600' };
  if (h < 21) return { I: Sunset, en: 'Good Evening', hi: 'शुभ संध्या', g: 'from-orange-600 to-rose-600' };
  return { I: Moon, en: 'Good Night', hi: 'शुभ रात्रि', g: 'from-indigo-600 to-purple-700' };
};
const tAgo = (d, l) => { const m = Math.floor((Date.now() - new Date(d)) / 60000); if (m < 1) return l === 'hi' ? 'अभी' : 'Now'; if (m < 60) return `${m}m`; if (m < 1440) return `${Math.floor(m / 60)}h`; if (m < 10080) return `${Math.floor(m / 1440)}d`; return new Date(d).toLocaleDateString(l === 'hi' ? 'hi-IN' : 'en', { day: 'numeric', month: 'short' }); };
const grd = (p) => { if (p >= 90) return { g: 'A+', c: 'emerald' }; if (p >= 80) return { g: 'A', c: 'emerald' }; if (p >= 70) return { g: 'B+', c: 'blue' }; if (p >= 60) return { g: 'B', c: 'blue' }; if (p >= 50) return { g: 'C', c: 'amber' }; if (p >= 40) return { g: 'D', c: 'orange' }; return { g: 'F', c: 'red' }; };
const GC = { emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };

// ════════════════════════════════════════════
//            MICRO COMPONENTS
// ════════════════════════════════════════════
const Cnt = ({ end, sfx = '' }) => { const [c, setC] = useState(0); useEffect(() => { if (!end) { setC(0); return; } let s, f; const r = t => { if (!s) s = t; const p = Math.min((t - s) / 1200, 1); setC(Math.floor((1 - Math.pow(1 - p, 4)) * end)); if (p < 1) f = requestAnimationFrame(r); }; f = requestAnimationFrame(r); return () => cancelAnimationFrame(f); }, [end]); return <>{c.toLocaleString()}{sfx}</>; };

const Ring = ({ pct, size = 100, sw = 7, color = '#3b82f6', bg, children }) => {
  const [a, setA] = useState(0); const r = (size - sw) / 2, C = 2 * Math.PI * r;
  useEffect(() => { const t = setTimeout(() => setA(Math.min(pct || 0, 100)), 200); return () => clearTimeout(t); }, [pct]);
  return (<div className="relative inline-flex items-center justify-center"><svg width={size} height={size} className="-rotate-90"><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg||'#e5e7eb'} strokeWidth={sw} className="dark:stroke-gray-700"/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-a/100)} className="transition-all duration-[1.5s] ease-out" style={{filter:`drop-shadow(0 0 4px ${color}40)`}}/></svg><div className="absolute inset-0 flex items-center justify-center">{children}</div></div>);
};

const Sk = ({ className = '' }) => <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`} />;

const LiveClock = () => { const [t, setT] = useState(new Date()); useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []); return (<div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10"><Clock className="w-3 h-3 text-indigo-300"/><span className="text-xs font-mono font-bold text-white tabular-nums">{t.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})}</span></div>); };

const SessionTimer = ({ language: l }) => { const [s, setS] = useState(0); useEffect(() => { const i = setInterval(() => setS(p => p + 1), 1000); return () => clearInterval(i); }, []); const p = n => String(n).padStart(2,'0'); return (<div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5 border border-white/10"><Timer className="w-3 h-3 text-emerald-400 animate-pulse"/><span className="text-xs font-mono font-bold text-white tabular-nums">{p(Math.floor(s/3600))}:{p(Math.floor((s%3600)/60))}:{p(s%60)}</span></div>); };

const CTooltip = ({ active, payload }) => { if (!active || !payload?.length) return null; return (<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 text-xs">{payload.map((p,i)=>(<p key={i} style={{color:p.color}} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{background:p.color}}/>{p.dataKey}: <b>{p.value}%</b></p>))}</div>); };

// ════════════════════════════════════════════
//               STAT CARD
// ════════════════════════════════════════════
const StatCard = ({ icon: Icon, label, value, sub, gradient, iconBg, onClick, delay = 0, spark }) => {
  const [v, setV] = useState(false); useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  const mx = spark ? Math.max(...spark, 1) : 1;
  return (<div onClick={onClick} className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${onClick?'cursor-pointer group':''} ${v?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}><div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-2xl`}/><div className="relative"><div className="flex items-start justify-between mb-2"><p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p><div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><Icon className="w-4 h-4 text-white"/></div></div><p className="text-2xl font-black text-gray-900 dark:text-white"><Cnt end={value}/></p>{sub&&<p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}{spark&&spark.length>0&&(<div className="flex items-end gap-px mt-2" style={{height:20}}>{spark.map((sv,i)=>(<div key={i} className="flex-1 rounded-t-sm" style={{height:`${Math.max((sv/mx)*100,8)}%`,background:iconBg.includes('blue')?'#3b82f6':iconBg.includes('emerald')||iconBg.includes('green')?'#22c55e':iconBg.includes('purple')?'#8b5cf6':'#f59e0b',opacity:0.25+(i/spark.length)*0.75,transition:'height 0.7s'}}/>))}</div>)}</div></div>);
};

// ════════════════════════════════════════════
//        PAPER-WISE SCORE TREND (NEW)
// ════════════════════════════════════════════
const PaperTrendCard = ({ title, icon: Icon, color, data, trend, predicted, avgScore, accuracy, language }) => {
  const cMap = {
    blue: { stroke: '#3b82f6', fill: '#3b82f680', grad: 'from-blue-600 to-cyan-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/30', light: 'bg-blue-50 dark:bg-blue-900/10' },
    purple: { stroke: '#8b5cf6', fill: '#8b5cf680', grad: 'from-purple-600 to-violet-600', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-800/30', light: 'bg-purple-50 dark:bg-purple-900/10' },
  };
  const c = cMap[color];
  const avg = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0;
  const best = data.length > 0 ? Math.max(...data.map(d => d.score)) : 0;
  const worst = data.length > 0 ? Math.min(...data.map(d => d.score)) : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.border} overflow-hidden`}>
      {/* Header */}
      <div className={`${c.light} px-4 py-3 border-b ${c.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.grad} flex items-center justify-center shadow`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-[9px] text-gray-500">{data.length} {language === 'hi' ? 'टेस्ट' : 'tests'} {language === 'hi' ? 'दिए' : 'taken'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {predicted !== null && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>
              {language === 'hi' ? 'अनुमानित' : 'Pred'}: {predicted}%
            </span>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : trend === 'down' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : trend === 'down' ? <TrendingDown className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
          </span>
        </div>
      </div>

      <div className="p-4">
        {data.length > 0 ? (
          <>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
                  <defs>
                    <linearGradient id={`grad_${color}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.stroke} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip content={<CTooltip />} />
                  <Area type="monotone" dataKey="score" stroke={c.stroke} strokeWidth={2.5} fill={`url(#grad_${color})`} dot={{ r: 3, fill: c.stroke }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              {[
                { l: language === 'hi' ? 'औसत' : 'Avg', v: `${avg}%`, i: Gauge, cl: 'text-blue-500' },
                { l: language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best', v: `${best}%`, i: TrendingUp, cl: 'text-emerald-500' },
                { l: language === 'hi' ? 'न्यूनतम' : 'Low', v: `${worst}%`, i: TrendingDown, cl: 'text-amber-500' },
                { l: language === 'hi' ? 'सटीकता' : 'Acc', v: `${accuracy}%`, i: Target, cl: 'text-violet-500' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <m.i className={`w-3 h-3 mx-auto mb-0.5 ${m.cl}`} />
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{m.v}</p>
                  <p className="text-[7px] text-gray-400 uppercase">{m.l}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-[10px] text-gray-400">{language === 'hi' ? 'कोई डेटा नहीं' : 'No data yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//     NEEDS ATTENTION SECTION (NEW)
// ════════════════════════════════════════════
const NeedsAttentionCard = ({ tests, language, navigate }) => {
  if (!tests || tests.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-red-200/50 dark:border-red-800/30 overflow-hidden">
      <div className="bg-red-50 dark:bg-red-900/10 px-4 py-3 border-b border-red-200/50 dark:border-red-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
              {language === 'hi' ? 'ध्यान दें - कम स्कोर' : 'Needs Attention - Low Scores'}
            </h3>
            <p className="text-[9px] text-red-600/60 dark:text-red-400/60">
              {language === 'hi' ? 'इन टेस्ट में 50% से कम स्कोर' : 'Tests with score below 50%'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {tests.length} {language === 'hi' ? 'टेस्ट' : 'tests'}
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        {tests.slice(0, 5).map((t, i) => {
          const { g, c } = grd(t.bestScore);
          return (
            <div key={i} onClick={() => navigate(`/results/${t.lastAttempt?._id}`)}
              className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-red-50/50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 hover:bg-white dark:hover:bg-gray-700 hover:border-red-200 dark:hover:border-red-800 hover:shadow-lg cursor-pointer transition-all">
              {/* Pulse indicator */}
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-30" />
              </div>
              {/* Grade */}
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-black text-sm flex-shrink-0 ${GC[c]}`}>{g}</div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-red-600 transition-colors">
                  {t.test?.title || 'Test'}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                    {language === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'}: {t.bestScore}%
                  </span>
                  <span>{t.attempts} {language === 'hi' ? 'प्रयास' : 'attempts'}</span>
                  {t.test?.paper && (
                    <span className={`px-1 py-0 rounded text-[8px] font-bold ${t.test.paper === 'paper1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {t.test.paper === 'paper1' ? 'P1' : 'P2'}
                    </span>
                  )}
                </div>
              </div>
              {/* Score */}
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-black text-red-600 dark:text-red-400">{t.bestScore}%</p>
              </div>
              {/* Retry button */}
              <button onClick={(e) => { e.stopPropagation(); navigate(`/test/${t.testId}`); }}
                className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors flex-shrink-0"
                title={language === 'hi' ? 'दोबारा दें' : 'Retry'}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//     NOT ATTEMPTED TESTS SECTION (NEW)
// ════════════════════════════════════════════
const NotAttemptedCard = ({ tests, language, navigate }) => {
  if (!tests || tests.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
      <div className="bg-amber-50 dark:bg-amber-900/10 px-4 py-3 border-b border-amber-200/50 dark:border-amber-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {language === 'hi' ? 'अभी तक नहीं दिए गए' : 'Not Yet Attempted'}
            </h3>
            <p className="text-[9px] text-amber-600/60 dark:text-amber-400/60">
              {language === 'hi' ? 'ये टेस्ट आपका इंतजार कर रहे हैं' : 'These tests are waiting for you'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {tests.length} {language === 'hi' ? 'बाकी' : 'pending'}
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        {tests.slice(0, 5).map((t, i) => (
          <div key={t._id || i}
            className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/30 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-800">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{t.title || 'Untitled'}</h4>
              <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{t.totalQuestions || 0} Qs</span>
                <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{t.duration || 0}m</span>
                {t.paper && (
                  <span className={`px-1 py-0 rounded text-[8px] font-bold ${t.paper === 'paper1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : t.paper === 'paper2' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {t.paper === 'paper1' ? 'P1' : t.paper === 'paper2' ? 'P2' : 'Mix'}
                  </span>
                )}
                <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{tAgo(t.createdAt, language)}</span>
              </div>
            </div>
            <button onClick={() => navigate(`/test/${t._id}`)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-lg hover:shadow-lg transition-all flex-shrink-0">
              <Play className="w-3 h-3" />
              {language === 'hi' ? 'दें' : 'Take'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//   PAPER-WISE TABBED ACTIVITY (ENHANCED)
// ════════════════════════════════════════════
const PaperTabbedActivity = ({
  allAttempts, paper1Attempts, paper2Attempts,
  allTests, paper1Tests, paper2Tests,
  notAttemptedTests, paper1NotAttempted, paper2NotAttempted,
  language, loading: la
}) => {
  const [mainTab, setMainTab] = useState('attempted');
  const [paperFilter, setPaperFilter] = useState('all');
  const navigate = useNavigate();

  const filteredAttempts = paperFilter === 'paper1' ? paper1Attempts : paperFilter === 'paper2' ? paper2Attempts : allAttempts;
  const filteredTests = paperFilter === 'paper1' ? paper1Tests : paperFilter === 'paper2' ? paper2Tests : allTests;
  const filteredNotAttempted = paperFilter === 'paper1' ? paper1NotAttempted : paperFilter === 'paper2' ? paper2NotAttempted : notAttemptedTests;

  const paperTabs = [
    { id: 'all', label: language === 'hi' ? 'सभी' : 'All' },
    { id: 'paper1', label: 'P1', color: 'blue' },
    { id: 'paper2', label: 'P2', color: 'purple' },
  ];

  const mainTabs = [
    { id: 'attempted', label: language === 'hi' ? 'दिए गए' : 'Attempted', Icon: CheckCircle, count: filteredAttempts.length },
    { id: 'created', label: language === 'hi' ? 'बनाए गए' : 'Created', Icon: PlusCircle, count: filteredTests.length },
    { id: 'pending', label: language === 'hi' ? 'बाकी' : 'Pending', Icon: Clock, count: filteredNotAttempted.length },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Paper filter pills */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" />
          {language === 'hi' ? 'गतिविधि' : 'Activity'}
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {paperTabs.map(pt => (
            <button key={pt.id} onClick={() => setPaperFilter(pt.id)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${paperFilter === pt.id ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700 px-1">
        {mainTabs.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-all ${mainTab === t.id ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
            <t.Icon className="w-3 h-3" />
            {t.label}
            <span className={`text-[8px] font-bold px-1 py-0 rounded-full ${mainTab === t.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'} ${t.id === 'pending' && t.count > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-h-[400px] overflow-y-auto">
        {/* ATTEMPTED */}
        {mainTab === 'attempted' && (
          la ? <div className="space-y-2">{[1,2,3].map(i=><Sk key={i} className="h-14 w-full"/>)}</div>
          : filteredAttempts.length > 0 ? (
            <div className="space-y-1.5">
              {filteredAttempts.slice(0, 10).map((a, i) => {
                const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
                const { g, c } = grd(pct);
                const isLow = pct < 50;
                return (
                  <div key={a._id || i} onClick={() => navigate(`/results/${a._id}`)}
                    className={`group flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${isLow ? 'border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/5 hover:bg-white' : 'border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700'}`}>
                    <span className="text-[8px] font-bold text-gray-400 w-3 text-center">#{i+1}</span>
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center font-black text-sm flex-shrink-0 ${GC[c]}`}>{g}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">{a.testId?.title || 'Test'}</h4>
                        {isLow && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 animate-pulse" />}
                        {a.testId?.paper && (
                          <span className={`px-1 py-0 rounded text-[7px] font-bold flex-shrink-0 ${a.testId.paper === 'paper1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                            {a.testId.paper === 'paper1' ? 'P1' : 'P2'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                        <span className="flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5 text-emerald-500"/>{a.correctCount||0}</span>
                        <span className="flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5 text-red-400"/>{a.wrongCount||0}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5"/>{tAgo(a.completedAt, language)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-black ${isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{pct}<span className="text-[9px] text-gray-400">%</span></p>
                    </div>
                    <Ring pct={pct} size={26} sw={2.5} color={pct>=70?'#22c55e':pct>=50?'#3b82f6':'#ef4444'}>
                      <span className="text-[6px] font-bold text-gray-500">{pct}</span>
                    </Ring>
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0"/>
                  </div>
                );
              })}
              <Link to="/results" className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
                <History className="w-3 h-3"/> {language === 'hi' ? 'सभी देखें' : 'View All'} <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700"/>
              <p className="text-xs text-gray-400 mb-3">{language === 'hi' ? 'कोई टेस्ट नहीं दिया' : `No ${paperFilter !== 'all' ? (paperFilter === 'paper1' ? 'Paper 1 ' : 'Paper 2 ') : ''}tests taken`}</p>
              <button onClick={() => navigate('/tests')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg"><Play className="w-3 h-3"/> Take Test</button>
            </div>
          )
        )}

        {/* CREATED */}
        {mainTab === 'created' && (
          filteredTests.length > 0 ? (
            <div className="space-y-1.5">
              {filteredTests.slice(0, 10).map((t, i) => {
                const hasAttempts = (t.totalAttempts || 0) > 0;
                return (
                  <div key={t._id || i} className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow flex-shrink-0"><FileText className="w-4 h-4 text-white"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{t.title || 'Untitled'}</h4>
                        {!hasAttempts && <span className="text-[7px] font-bold px-1 py-0 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">NEW</span>}
                        {t.paper && (
                          <span className={`px-1 py-0 rounded text-[7px] font-bold ${t.paper === 'paper1' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                            {t.paper === 'paper1' ? 'P1' : 'P2'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                        <span><Hash className="w-2.5 h-2.5 inline"/>{t.totalQuestions||0}</span>
                        <span><Clock className="w-2.5 h-2.5 inline"/>{t.duration||0}m</span>
                        <span>{tAgo(t.createdAt, language)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => navigate(`/test/${t._id}`)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"><Play className="w-3 h-3"/></button>
                      <button onClick={() => navigate(`/tests/edit/${t._id}`)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 transition-colors"><FileText className="w-3 h-3"/></button>
                    </div>
                  </div>
                );
              })}
              <Link to="/tests" className="flex items-center justify-center gap-1 p-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors">
                <LayoutGrid className="w-3 h-3"/> View All <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <PlusCircle className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700"/>
              <p className="text-xs text-gray-400 mb-3">{language === 'hi' ? 'कोई टेस्ट नहीं बनाया' : 'No tests created'}</p>
              <button onClick={() => navigate('/tests/create')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold rounded-lg"><PlusCircle className="w-3 h-3"/> Create</button>
            </div>
          )
        )}

        {/* PENDING */}
        {mainTab === 'pending' && (
          filteredNotAttempted.length > 0 ? (
            <div className="space-y-1.5">
              {filteredNotAttempted.slice(0, 10).map((t, i) => (
                <div key={t._id || i} className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/30 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20 hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg transition-all">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center border border-amber-200 dark:border-amber-800 flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">{t.title}</h4>
                      {t.paper && <span className={`px-1 py-0 rounded text-[7px] font-bold ${t.paper==='paper1'?'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400':'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'}`}>{t.paper==='paper1'?'P1':'P2'}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-500">
                      <span><Hash className="w-2.5 h-2.5 inline"/>{t.totalQuestions||0}</span>
                      <span><Clock className="w-2.5 h-2.5 inline"/>{t.duration||0}m</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/test/${t._id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-lg hover:shadow-lg transition-all flex-shrink-0">
                    <Play className="w-3 h-3"/>
                    {language === 'hi' ? 'दें' : 'Take'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-200 dark:text-emerald-900"/>
              <p className="text-xs text-gray-400">{language === 'hi' ? 'सभी टेस्ट दे चुके हैं' : 'All tests attempted!'}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════
//  REUSED: Paper Section, Achievements, etc
//  (same as before, keeping compact)
// ════════════════════════════════════════════
const PaperSection = ({ paper, title, subtitle, Icon, color, units, total, language, navigate }) => {
  const [open, setOpen] = useState(true);
  const sorted = [...units].sort((a,b)=>b.count-a.count);
  const c = color === 'blue'
    ? { grad:'from-blue-600 to-cyan-600',gradL:'from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10',bdr:'border-blue-200/50 dark:border-blue-800/30',txt:'text-blue-600 dark:text-blue-400',bar:'from-blue-500 to-cyan-400',badge:'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',hover:'hover:bg-blue-50/50 dark:hover:bg-blue-900/10',ring:'#3b82f6',iconBg:'from-blue-500 to-cyan-500' }
    : { grad:'from-purple-600 to-violet-600',gradL:'from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10',bdr:'border-purple-200/50 dark:border-purple-800/30',txt:'text-purple-600 dark:text-purple-400',bar:'from-purple-500 to-violet-400',badge:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',hover:'hover:bg-purple-50/50 dark:hover:bg-purple-900/10',ring:'#8b5cf6',iconBg:'from-purple-500 to-violet-500' };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.bdr} overflow-hidden`}>
      <div className={`bg-gradient-to-r ${c.gradL} p-4 border-b ${c.bdr}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center shadow-lg`}><Icon className="w-5 h-5 text-white"/></div>
            <div><h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">{title}<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>{total} Qs</span></h3><p className="text-[10px] text-gray-500">{subtitle}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Ring pct={Math.min(units.length*10,100)} size={40} sw={3} color={c.ring}><span className="text-[8px] font-bold text-gray-500">{units.length}</span></Ring>
            <button onClick={()=>setOpen(!open)} className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-gray-700">{open?<ChevronUp className="w-4 h-4 text-gray-400"/>:<ChevronDown className="w-4 h-4 text-gray-400"/>}</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[{l:'Total',v:total,i:Hash},{l:'Units',v:units.length,i:Layers},{l:'Top',v:sorted[0]?.count||0,i:Crown},{l:'Avg',v:units.length>0?Math.round(total/units.length):0,i:BarChart2}].map((s,i)=>(<div key={i} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-1.5 text-center backdrop-blur-sm"><s.i className={`w-3 h-3 mx-auto mb-0.5 ${c.txt} opacity-50`}/><p className="text-xs font-bold text-gray-900 dark:text-white"><Cnt end={s.v}/></p><p className="text-[7px] text-gray-500 uppercase">{s.l}</p></div>))}
        </div>
      </div>
      {open&&(<div className="p-3">{sorted.length>0?(<><div className="space-y-1">{sorted.map((u,idx)=>{const pct=total>0?Math.round((u.count/total)*100):0;return(<div key={idx} onClick={()=>navigate(`/questions?paper=${paper}&unit=${encodeURIComponent(u._id?.unit||'')}`)} className={`group flex items-center gap-2 p-2 rounded-lg ${c.hover} border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-all`}><div className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${idx===0?`bg-gradient-to-br ${c.grad} text-white shadow`:'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{idx+1}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-1 mb-0.5"><p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">{u._id?.unit||'Unknown'}</p>{idx===0&&<Crown className={`w-2.5 h-2.5 ${c.txt} flex-shrink-0`}/>}</div><div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-1000`} style={{width:`${pct}%`}}/></div></div><div className="text-right flex-shrink-0"><p className="text-[11px] font-bold text-gray-900 dark:text-white">{u.count}</p><p className="text-[8px] text-gray-400">{pct}%</p></div><ChevronRight className="w-3 h-3 text-gray-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0"/></div>);})}</div><button onClick={()=>navigate(`/questions?paper=${paper}`)} className={`w-full mt-2 p-2 rounded-lg border border-dashed ${c.bdr} ${c.txt} text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700/50`}><Eye className="w-3 h-3"/>View All<ArrowRight className="w-3 h-3"/></button></>):(<div className="text-center py-6"><FileQuestion className="w-8 h-8 mx-auto mb-2 text-gray-200 dark:text-gray-700"/><p className="text-[10px] text-gray-400 mb-2">No questions</p><button onClick={()=>navigate('/import')} className={`inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r ${c.grad} text-white text-[10px] font-semibold rounded-lg`}><Upload className="w-3 h-3"/>Import</button></div>)}</div>)}
    </div>
  );
};

// Compact: Quote, Streak, QAction, Achievements
const quotes=[{t:"Success is not final, failure is not fatal.",a:"Churchill"},{t:"The only way to do great work is to love what you do.",a:"Jobs"},{t:"Education is the most powerful weapon.",a:"Mandela"},{t:"It does not matter how slowly you go.",a:"Confucius"},{t:"Believe you can and you're halfway there.",a:"Roosevelt"}];
const QuoteCard=()=>{const[q]=useState(()=>quotes[Math.floor(Math.random()*quotes.length)]);return(<div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-4 text-white"><div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-3xl"/><Sparkles className="w-4 h-4 mb-2 text-yellow-300"/><p className="text-xs font-medium leading-relaxed mb-2 italic opacity-95">"{q.t}"</p><p className="text-[9px] text-white/50">- {q.a}</p></div>);};
const StreakCard=({streak,language:l})=>{const days=['S','M','T','W','T','F','S'];const today=new Date().getDay();return(<div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-yellow-300"/><span className="font-bold text-xs">{l==='hi'?'स्ट्रीक':'Streak'}</span></div><span className="text-xl font-black">{streak}<span className="text-[9px] font-normal text-white/60 ml-0.5">d</span></span></div><div className="flex justify-between gap-1">{days.map((d,i)=>(<div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${i<=today&&streak>0?'bg-white text-orange-600 shadow-sm':'bg-white/15 text-white/50'}`}>{d}</div>))}</div></div>);};
const QAction=({icon:Icon,title,desc,to,gradient,badge,delay=0})=>{const[v,setV]=useState(false);useEffect(()=>{const t=setTimeout(()=>setV(true),delay);return()=>clearTimeout(t);},[delay]);return(<Link to={to} className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3.5 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:border-transparent ${v?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}><div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/><div className="relative z-10"><div className="flex items-start justify-between mb-1.5"><div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all`}><Icon className="w-4 h-4 text-white"/></div>{badge&&<span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{badge}</span>}</div><h3 className="font-bold text-gray-900 dark:text-white group-hover:text-white text-xs">{title}</h3><p className="text-[9px] text-gray-500 group-hover:text-white/70 mt-0.5">{desc}</p></div></Link>);};

const iconMap={Layers,Crown,Play,Flame,Medal,Star,Target,PlusCircle};
const AchievementCard=({achievements,language:l})=>{const un=achievements.filter(a=>a.unlocked).length;const cM={amber:{bg:'bg-amber-100 dark:bg-amber-900/30',t:'text-amber-600 dark:text-amber-400',b:'border-amber-200 dark:border-amber-800'},purple:{bg:'bg-purple-100 dark:bg-purple-900/30',t:'text-purple-600 dark:text-purple-400',b:'border-purple-200 dark:border-purple-800'},blue:{bg:'bg-blue-100 dark:bg-blue-900/30',t:'text-blue-600 dark:text-blue-400',b:'border-blue-200 dark:border-blue-800'},orange:{bg:'bg-orange-100 dark:bg-orange-900/30',t:'text-orange-600 dark:text-orange-400',b:'border-orange-200 dark:border-orange-800'},emerald:{bg:'bg-emerald-100 dark:bg-emerald-900/30',t:'text-emerald-600 dark:text-emerald-400',b:'border-emerald-200 dark:border-emerald-800'},indigo:{bg:'bg-indigo-100 dark:bg-indigo-900/30',t:'text-indigo-600 dark:text-indigo-400',b:'border-indigo-200 dark:border-indigo-800'},gray:{bg:'bg-gray-100 dark:bg-gray-800',t:'text-gray-400 dark:text-gray-600',b:'border-gray-200 dark:border-gray-700'}};return(<div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-500"/>{l==='hi'?'उपलब्धियाँ':'Achievements'}</h3><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{un}/{achievements.length}</span></div><div className="grid grid-cols-4 gap-2">{achievements.map((a,i)=>{const c=cM[a.color]||cM.gray;const Icon=iconMap[a.icon]||Star;return(<div key={i} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${a.unlocked?`${c.bg} ${c.b}`:'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'}`} title={a.desc}>{a.unlocked?<div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-white"/></div>:<div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center"><Lock className="w-2 h-2 text-white"/></div>}<Icon className={`w-4 h-4 ${a.unlocked?c.t:'text-gray-400'}`}/><span className={`text-[8px] font-bold text-center leading-tight ${a.unlocked?'text-gray-700 dark:text-gray-300':'text-gray-400'}`}>{a.label}</span>{!a.unlocked&&a.progress!==undefined&&<div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 rounded-full transition-all duration-1000" style={{width:`${Math.min(a.progress*100,100)}%`}}/></div>}</div>);})}</div></div>);};

// ════════════════════════════════════════════
//                 MAIN DASHBOARD
// ════════════════════════════════════════════
const Dashboard = ({ language: propLanguage, setLanguage }) => {
  const navigate = useNavigate();
  const d = useDashboard();
  const greeting = getGreeting();
  const GI = greeting.I;

  return (
    <Layout language={propLanguage} setLanguage={setLanguage}>
      {({ language }) => (
        <div className="space-y-5 pb-8">

          {/* HERO */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"/><div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl"/>
            <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'28px 28px'}}/>
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2"><LiveClock/><SessionTimer language={language}/></div>
                <div className="flex items-center gap-2">
                  <button onClick={d.refresh} className={`p-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/20 transition-all ${d.refreshing?'animate-spin':''}`}><RefreshCw className="w-3 h-3"/></button>
                  <span className="text-[8px] text-indigo-300/40">{d.lastRefresh.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${greeting.g} flex items-center justify-center shadow-lg`}><GI className="w-4 h-4 text-white"/></div>
                    <div><h1 className="text-xl md:text-2xl font-black">{language==='hi'?greeting.hi:greeting.en}</h1><p className="text-[9px] text-indigo-300/50">{new Date().toLocaleDateString(language==='hi'?'hi-IN':'en',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p></div>
                  </div>
                  <p className="text-indigo-200/60 text-xs mb-4 max-w-md">{language==='hi'?'नियमित अभ्यास सफलता की कुंजी है।':'Consistent practice is the key to success.'}</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={()=>navigate('/tests/create')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all"><Play className="w-3.5 h-3.5"/>{language==='hi'?'टेस्ट शुरू':'Start Test'}</button>
                    <button onClick={()=>navigate('/import')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all"><Upload className="w-3.5 h-3.5"/>{language==='hi'?'आयात':'Import'}</button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col gap-1.5">
                    {[{l:'P1',v:d.paper1Count,i:BookOpen,c:'from-blue-500 to-cyan-500',acc:d.paper1Accuracy},{l:'P2',v:d.paper2Count,i:Target,c:'from-purple-500 to-violet-500',acc:d.paper2Accuracy},{l:language==='hi'?'टेस्ट':'Tests',v:d.testStats?.totalTests||0,i:ClipboardList,c:'from-amber-500 to-orange-500'}].map((p,i)=>(
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
                        <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${p.c} flex items-center justify-center`}><p.i className="w-3 h-3 text-white"/></div>
                        <div><p className="text-[8px] text-indigo-300/40">{p.l} {p.acc !== undefined ? `(${p.acc}%)` : ''}</p><p className="text-sm font-bold">{p.v}</p></div>
                      </div>
                    ))}
                  </div>
                  <Ring pct={d.overallAccuracy} size={120} sw={8} color="#22c55e" bg="rgba(255,255,255,0.08)">
                    <div className="text-center"><p className="text-2xl font-black">{d.overallAccuracy}%</p><p className="text-[8px] text-indigo-300/50 uppercase">{language==='hi'?'सटीकता':'Accuracy'}</p></div>
                  </Ring>
                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          {d.loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i=><Sk key={i} className="h-24 rounded-2xl"/>)}</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={FileQuestion} label={language==='hi'?'कुल प्रश्न':'Questions'} value={d.totalQuestions} sub={language==='hi'?'बैंक में':'in bank'} gradient="from-blue-500 to-cyan-500" iconBg="from-blue-500 to-cyan-600" onClick={()=>navigate('/questions')} delay={0} spark={[3,7,5,12,8,15,10]}/>
              <StatCard icon={BookOpen} label="Paper 1" value={d.paper1Count} sub={`${d.paper1Accuracy}% acc`} gradient="from-emerald-500 to-green-500" iconBg="from-emerald-500 to-green-600" onClick={()=>navigate('/questions?paper=paper1')} delay={80} spark={[2,5,3,8,6,10,7]}/>
              <StatCard icon={Target} label="Paper 2" value={d.paper2Count} sub={`${d.paper2Accuracy}% acc`} gradient="from-purple-500 to-violet-500" iconBg="from-purple-500 to-violet-600" onClick={()=>navigate('/questions?paper=paper2')} delay={160} spark={[4,6,9,5,11,8,13]}/>
              <StatCard icon={ClipboardList} label={language==='hi'?'टेस्ट':'Tests'} value={d.testStats?.totalTests||0} sub={`${d.testStats?.totalAttempts||0} attempts`} gradient="from-amber-500 to-orange-500" iconBg="from-amber-500 to-orange-600" onClick={()=>navigate('/tests')} delay={240} spark={[1,3,2,5,4,7,6]}/>
            </div>
          )}

          {/* PAPER-WISE SCORE TRENDS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-indigo-500"/>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{language==='hi'?'पेपर-वार स्कोर ट्रेंड':'Paper-wise Score Trends'}</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2"/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PaperTrendCard title={language==='hi'?'पेपर 1 ट्रेंड':'Paper 1 Trend'} icon={BookOpen} color="blue" data={d.paper1Trend} trend={d.paper1TrendDir} predicted={d.paper1Predicted} avgScore={d.paper1AvgScore} accuracy={d.paper1Accuracy} language={language}/>
              <PaperTrendCard title={language==='hi'?'पेपर 2 ट्रेंड':'Paper 2 Trend'} icon={Target} color="purple" data={d.paper2Trend} trend={d.paper2TrendDir} predicted={d.paper2Predicted} avgScore={d.paper2AvgScore} accuracy={d.paper2Accuracy} language={language}/>
            </div>
          </div>

          {/* PAPER ANALYSIS */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-indigo-500"/>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{language==='hi'?'पेपर विश्लेषण':'Paper Analysis'}</h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 ml-2"/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PaperSection paper="paper1" title={language==='hi'?'पेपर 1':'Paper 1'} subtitle={language==='hi'?'शिक्षण अभिवृत्ति':'Teaching Aptitude'} Icon={BookOpen} color="blue" units={d.paper1Units} total={d.paper1Count} language={language} navigate={navigate}/>
              <PaperSection paper="paper2" title={language==='hi'?'पेपर 2':'Paper 2'} subtitle={language==='hi'?'इतिहास':'History'} Icon={Target} color="purple" units={d.paper2Units} total={d.paper2Count} language={language} navigate={navigate}/>
            </div>
          </div>

          {/* NEEDS ATTENTION + NOT ATTEMPTED */}
          {(d.needsAttentionTests.length > 0 || d.notAttemptedTests.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {d.needsAttentionTests.length > 0 && <NeedsAttentionCard tests={d.needsAttentionTests} language={language} navigate={navigate}/>}
              {d.notAttemptedTests.length > 0 && <NotAttemptedCard tests={d.notAttemptedTests} language={language} navigate={navigate}/>}
            </div>
          )}

          {/* TABBED ACTIVITY (Paper filter + Attempted/Created/Pending) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <PaperTabbedActivity
                allAttempts={d.allCompletedAttempts} paper1Attempts={d.paper1Attempts} paper2Attempts={d.paper2Attempts}
                allTests={d.createdTests} paper1Tests={d.paper1Tests} paper2Tests={d.paper2Tests}
                notAttemptedTests={d.notAttemptedTests} paper1NotAttempted={d.paper1NotAttempted} paper2NotAttempted={d.paper2NotAttempted}
                language={language} loading={d.loading}/>
            </div>
            <div className="space-y-4">
              <AchievementCard achievements={d.achievements} language={language}/>
              <StreakCard streak={d.streak} language={language}/>
            </div>
          </div>

          {/* QUICK ACTIONS + QUOTE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-amber-500"/><h2 className="text-sm font-bold text-gray-900 dark:text-white">{language==='hi'?'त्वरित क्रियाएं':'Quick Actions'}</h2></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QAction icon={PlusCircle} title={language==='hi'?'नया टेस्ट':'New Test'} desc={language==='hi'?'मॉक बनाएं':'Create mock'} to="/tests/create" gradient="from-blue-600 to-indigo-600" delay={0}/>
                <QAction icon={Upload} title={language==='hi'?'आयात':'Import'} desc="JSON" to="/import" gradient="from-emerald-600 to-green-600" badge="JSON" delay={80}/>
                <QAction icon={FileQuestion} title={language==='hi'?'प्रश्न':'Questions'} desc={language==='hi'?'बैंक':'Bank'} to="/questions" gradient="from-purple-600 to-violet-600" delay={160}/>
                <QAction icon={BarChart3} title={language==='hi'?'परिणाम':'Results'} desc={language==='hi'?'प्रगति':'Progress'} to="/results" gradient="from-orange-600 to-red-600" delay={240}/>
              </div>
            </div>
            <QuoteCard/>
          </div>

          {/* FOOTER CTA */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5 text-white">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl"/>
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0"><Trophy className="w-5 h-5 text-white"/></div>
                <div><h3 className="text-sm font-bold">{language==='hi'?'UGC NET क्रैक करें':'Crack UGC NET'}</h3><p className="text-[10px] text-gray-400">{language==='hi'?'अभी शुरू करें!':'Start now!'}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>navigate('/tests')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-xs rounded-xl hover:shadow-xl transition-all"><Play className="w-3.5 h-3.5"/>{language==='hi'?'टेस्ट':'Tests'}</button>
                <button onClick={()=>navigate('/results')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 border border-white/20 font-semibold text-xs rounded-xl hover:bg-white/20 transition-all"><BarChart3 className="w-3.5 h-3.5"/>{language==='hi'?'परिणाम':'Results'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;