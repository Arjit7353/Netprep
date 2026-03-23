import React, { useEffect } from 'react';
import { Loader2, Sparkles, TrendingUp, TrendingDown, Minus, AlertCircle, Flame, Zap, CircleDot } from 'lucide-react';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';
import pyqService from '../../services/pyqService';

const PredictionDashboard = ({ language }) => {
  const { predictions, loading, error, fetchPredictions } = usePYQAnalysis();
  const L = (en, hi) => language === 'hi' ? hi : en;

  useEffect(() => { fetchPredictions('paper2').catch(() => {}); }, []);

  const trendIcons = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus, emerged: Sparkles };
  const trendColors = { increasing: 'text-red-500', decreasing: 'text-green-500', stable: 'text-gray-400', emerged: 'text-purple-500' };
  const likelihoodIcons = { very_likely: Flame, likely: Zap, possible: CircleDot, unlikely: Minus };

  if (loading && !predictions) {
    return <div className="flex justify-center py-24"><div className="relative w-14 h-14"><div className="absolute inset-0 rounded-full border-[3px] border-violet-200 dark:border-violet-800" /><div className="absolute inset-0 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" /></div></div>;
  }

  if (!predictions?.predictions?.length) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-secondary-700 p-14 text-center">
        <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-700 dark:text-secondary-300 mb-2">{L('Need More Data','अधिक डेटा चाहिए')}</h3>
        <p className="text-xs text-gray-500">{predictions?.message || L('Import at least 2 years','कम से कम 2 वर्ष आयात करें')}</p>
      </div>
    );
  }

  const categories = { very_likely: [], likely: [], possible: [], unlikely: [] };
  predictions.predictions.forEach(p => { if (categories[p.likelihood]) categories[p.likelihood].push(p); });

  const categoryMeta = {
    very_likely: { title: L('Very Likely','बहुत संभावित'), subtitle: L('Almost certain to appear','लगभग निश्चित'), gradient: 'from-red-500 to-rose-500', ring: 'ring-red-500/20', bgLight: 'bg-red-50/80 dark:bg-red-900/10' },
    likely: { title: L('Likely','संभावित'), subtitle: L('Strong chance','अच्छी संभावना'), gradient: 'from-amber-500 to-orange-500', ring: 'ring-amber-500/20', bgLight: 'bg-amber-50/80 dark:bg-amber-900/10' },
    possible: { title: L('Possible','संभव'), subtitle: L('May appear','आ सकता है'), gradient: 'from-blue-500 to-cyan-500', ring: 'ring-blue-500/20', bgLight: 'bg-blue-50/80 dark:bg-blue-900/10' },
    unlikely: { title: L('Unlikely','कम संभावना'), subtitle: L('Lower priority','कम प्राथमिकता'), gradient: 'from-gray-400 to-gray-500', ring: 'ring-gray-400/20', bgLight: 'bg-gray-50/80 dark:bg-secondary-700/10' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-3xl p-5 sm:p-7 text-white shadow-2xl shadow-violet-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">{L('Prediction Dashboard','भविष्यवाणी डैशबोर्ड')}</h2>
        </div>
        <p className="text-xs text-white/60 relative">
          {L(`Based on ${predictions.totalYears} papers: `, `${predictions.totalYears} पेपर पर आधारित: `)}
          {predictions.basedOnYears?.join(', ')}
        </p>
        <div className="flex items-center gap-4 mt-4 relative">
          {Object.entries(categories).map(([k, items]) => (
            <div key={k} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-black">{items.length}</p>
              <p className="text-[9px] text-white/60">{categoryMeta[k]?.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Sections */}
      {Object.entries(categories).map(([key, items]) => {
        if (items.length === 0) return null;
        const meta = categoryMeta[key];
        const LikelihoodIcon = likelihoodIcons[key] || CircleDot;

        return (
          <div key={key} className="bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700 overflow-hidden shadow-sm">
            <div className={`px-5 py-3 border-b border-gray-100 dark:border-secondary-700 ${meta.bgLight}`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 bg-gradient-to-br ${meta.gradient} rounded-lg flex items-center justify-center shadow`}>
                  <LikelihoodIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">{meta.title}</h3>
                  <p className="text-[9px] text-gray-500 dark:text-secondary-400">{meta.subtitle} — {items.length} {L('topics','विषय')}</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-50/80 dark:divide-secondary-700/30">
              {items.map((p, i) => {
                const TrendIcon = trendIcons[p.trend] || Minus;
                return (
                  <div key={i} className="flex items-center gap-3 sm:gap-4 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-secondary-700/20 transition-colors">
                    <TrendIcon className={`w-4 h-4 flex-shrink-0 ${trendColors[p.trend] || 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.chapter}</p>
                      <p className="text-[10px] text-gray-500 dark:text-secondary-400 truncate">{p.unitName} {p.topics?.length > 0 ? `| ${p.topics.slice(0,2).join(', ')}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xs font-black text-violet-600 dark:text-violet-400 tabular-nums">{p.importanceScore}</p>
                        <p className="text-[8px] text-gray-400">{L('Score','स्कोर')}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-xs font-bold text-gray-600 dark:text-secondary-300 tabular-nums">{p.avgQPerYear}</p>
                        <p className="text-[8px] text-gray-400">Q/{L('yr','वर्ष')}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {p.yearCounts?.map((c, ci) => (
                          <div key={ci} className={`w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center transition-all ${
                            c === 0 ? 'bg-gray-100 dark:bg-secondary-700/50 text-gray-400 dark:text-secondary-600'
                            : c >= 4 ? 'bg-violet-600 text-white shadow-sm'
                            : c >= 2 ? 'bg-violet-400 dark:bg-violet-700 text-white'
                            : 'bg-violet-200 dark:bg-violet-800/60 text-violet-700 dark:text-violet-300'
                          }`}>{c}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-sm text-red-700 dark:text-red-400">{error}</p></div>}
    </div>
  );
};

export default PredictionDashboard;