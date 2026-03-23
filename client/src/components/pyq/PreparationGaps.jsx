import React, { useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, FlaskConical, CheckCircle2, XCircle, MinusCircle, HelpCircle, Shield } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';
import pyqService from '../../services/pyqService';

const PreparationGaps = ({ language }) => {
  const { gaps, loading, error, fetchGaps } = usePYQAnalysis();
  const L = (en, hi) => language === 'hi' ? hi : en;

  useEffect(() => { fetchGaps('paper2').catch(() => {}); }, []);

  const radarData = useMemo(() => {
    if (!gaps?.gaps) return [];
    const unitMap = {};
    gaps.gaps.forEach(g => {
      if (!unitMap[g.unitId]) unitMap[g.unitId] = { unit: g.unitName || g.unitId, pyqSum: 0, accSum: 0, count: 0 };
      unitMap[g.unitId].pyqSum += g.pyqImportance;
      unitMap[g.unitId].accSum += g.yourAccuracy;
      unitMap[g.unitId].count++;
    });
    return Object.values(unitMap).map(u => ({
      unit: u.unit.replace(/^UNIT\s+\w+:\s*/i,'').substring(0,14),
      [L('PYQ Importance','PYQ महत्व')]: Math.round(u.pyqSum / u.count),
      [L('Your Accuracy','आपकी सटीकता')]: Math.round(u.accSum / u.count),
    }));
  }, [gaps, language]);

  const statusIcons = { critical: XCircle, weak: MinusCircle, good: CheckCircle2, mastered: Shield, not_started: HelpCircle };

  if (loading && !gaps) {
    return <div className="flex justify-center py-24"><div className="relative w-14 h-14"><div className="absolute inset-0 rounded-full border-[3px] border-violet-200 dark:border-violet-800" /><div className="absolute inset-0 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" /></div></div>;
  }

  if (!gaps?.gaps?.length) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-secondary-700 p-14 text-center">
        <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-700 dark:text-secondary-300 mb-2">{L('No Gap Data','कोई अंतर डेटा नहीं')}</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">{L('Import PYQ data and attempt tests','PYQ आयात करें और परीक्षाएं दें')}</p>
      </div>
    );
  }

  const { summary, overallReadiness } = gaps;

  return (
    <div className="space-y-5">
      {/* Top Row: Readiness + Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl p-4 text-white shadow-xl shadow-violet-500/20 sm:col-span-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-4xl font-black relative">{overallReadiness}%</p>
          <p className="text-[10px] text-white/60 mt-1 font-medium">{L('Overall Readiness','समग्र तैयारी')}</p>
        </div>
        {[
          { key: 'critical', label: L('Critical','गंभीर'), count: summary.critical, color: 'from-red-500 to-rose-500' },
          { key: 'weak', label: L('Weak','कमज़ोर'), count: summary.weak, color: 'from-amber-500 to-orange-500' },
          { key: 'notStarted', label: L('Not Started','शुरू नहीं'), count: summary.notStarted, color: 'from-gray-400 to-gray-500' },
          { key: 'good', label: L('Good','अच्छा'), count: summary.good, color: 'from-blue-500 to-cyan-500' },
          { key: 'mastered', label: L('Mastered','माहिर'), count: summary.mastered, color: 'from-emerald-500 to-green-500' },
        ].map(s => (
          <div key={s.key} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-3.5 text-center hover:shadow-lg transition-all">
            <div className={`w-9 h-9 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
              <span className="text-white text-sm font-black">{s.count}</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-secondary-400 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Radar */}
      {radarData.length > 0 && (
        <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{L('Performance vs Importance','प्रदर्शन बनाम महत्व')}</h3>
          <p className="text-[10px] text-gray-500 dark:text-secondary-400 mb-3">{L('Gap between lines = areas needing attention','रेखाओं का अंतर = ध्यान की आवश्यकता')}</p>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid strokeOpacity={0.12} />
                <PolarAngleAxis dataKey="unit" tick={{ fontSize: 9, fill: '#888' }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize: 9 }} />
                <Radar name={L('PYQ Importance','PYQ महत्व')} dataKey={L('PYQ Importance','PYQ महत्व')} stroke="#ef4444" fill="#ef4444" fillOpacity={0.12} strokeWidth={2.5} />
                <Radar name={L('Your Accuracy','आपकी सटीकता')} dataKey={L('Your Accuracy','आपकी सटीकता')} stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.18} strokeWidth={2.5} />
                <Tooltip contentStyle={{ borderRadius: '14px', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gap List */}
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-secondary-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{L('Topic-wise Gaps','विषय-वार अंतर')}</h3>
        </div>
        <div className="divide-y divide-gray-50/80 dark:divide-secondary-700/30">
          {gaps.gaps.map((g, i) => {
            const style = pyqService.getStatusStyle(g.status);
            const Icon = statusIcons[g.status] || HelpCircle;
            return (
              <div key={i} className={`flex items-center gap-3 sm:gap-4 px-4 py-3.5 transition-all hover:opacity-90 ${style.bg}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.badge}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{g.chapter}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white ${style.badge}`}>
                      {language === 'hi' ? style.labelHi : style.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-secondary-400 mt-0.5 truncate">{g.unitName} | {g.pyqAppearances}x {L('asked','पूछा')}</p>
                  {g.recommendation && <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1 italic leading-relaxed">{g.recommendation}</p>}
                </div>
                <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-black text-red-500">{g.pyqImportance}</p>
                    <p className="text-[8px] text-gray-400 uppercase tracking-wider">{L('Imp','महत्व')}</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-black ${g.yourAccuracy >= 60 ? 'text-emerald-500' : g.yourAccuracy >= 30 ? 'text-amber-500' : 'text-red-500'}`}>{g.yourAccuracy}%</p>
                    <p className="text-[8px] text-gray-400 uppercase tracking-wider">{L('Acc','सटीकता')}</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-10 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                      g.gapScore >= 50 ? 'bg-red-100 dark:bg-red-900/20 text-red-600'
                      : g.gapScore >= 25 ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                      : 'bg-gray-100 dark:bg-secondary-700 text-gray-500'
                    }`}>{g.gapScore}</div>
                    <p className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5">{L('Gap','अंतर')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-700 dark:text-red-400">{error}</p></div>}
    </div>
  );
};

export default PreparationGaps;