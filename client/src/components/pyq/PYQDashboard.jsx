import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText, TrendingUp, Target, FlaskConical, Sparkles, Upload,
  ArrowRight, Loader2, FileText, Hash, BookOpen, Calendar,
  Eye, Trash2, ChevronRight, AlertCircle
} from 'lucide-react';
import usePYQAnalysis from '../../hooks/usePYQAnalysis';
import { useToast } from '../common/Toast';

const PYQDashboard = ({ language }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { stats, years, loading, error, fetchStats, fetchYears, deleteData } = usePYQAnalysis();
  const [deleting, setDeleting] = useState(null);

  const L = (en, hi) => language === 'hi' ? hi : en;

  useEffect(() => {
    fetchStats('paper2').catch(() => {});
    fetchYears('paper2').catch(() => {});
  }, []);

  const handleDelete = async (id, label) => {
    if (!window.confirm(L(`Delete "${label}"?`, `"${label}" हटाएं?`))) return;
    setDeleting(id);
    try { await deleteData(id); toast.success(L('Deleted', 'हटाया')); fetchStats('paper2'); fetchYears('paper2'); }
    catch { toast.error(L('Failed', 'विफल')); }
    setDeleting(null);
  };

  const tools = [
    { icon: ScrollText, label: L('Year Analysis', 'वर्ष विश्लेषण'), desc: L('Deep dive into each year paper', 'प्रत्येक वर्ष के पेप�� का गहन अध्ययन'), path: '/pyq/year', gradient: 'from-blue-500 to-cyan-500' },
    { icon: TrendingUp, label: L('Multi-Year Trends', 'बहु-वर्ष रुझान'), desc: L('Cross-year comparisons & charts', 'वर्षों में तुलना और चार्ट'), path: '/pyq/trends', gradient: 'from-emerald-500 to-teal-500' },
    { icon: Target, label: L('Topic Heatmap', 'विषय हीटमैप'), desc: L('Visual importance matrix', 'दृश्य महत्व मैट्रिक्स'), path: '/pyq/heatmap', gradient: 'from-amber-500 to-orange-500' },
    { icon: FlaskConical, label: L('Preparation Gaps', 'तैयारी अंतर'), desc: L('Your weakness vs PYQ importance', 'आपकी कमजोरी बनाम PYQ महत्व'), path: '/pyq/gaps', gradient: 'from-red-500 to-rose-500' },
    { icon: Sparkles, label: L('Predictions', 'भविष्यवाणी'), desc: L('AI-driven topic prediction', 'AI-आधारित विषय भविष्यवाणी'), path: '/pyq/predictions', gradient: 'from-violet-500 to-purple-500' },
    { icon: Upload, label: L('Import Data', 'डेटा आयात'), desc: L('Add new PYQ analysis JSON', 'नया PYQ JSON जोड़ें'), path: '/pyq/import', gradient: 'from-pink-500 to-fuchsia-500' },
  ];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-200 dark:border-violet-800" />
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-secondary-400 font-medium">{L('Loading analytics...', 'विश्लेषण लोड हो रहा है...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: FileText, val: stats.totalPapers || 0, label: L('Papers', 'पेपर'), suffix: L('imported', 'आयातित'), gradient: 'from-violet-500 to-purple-600' },
            { icon: Hash, val: stats.totalQuestionsMapped || 0, label: L('Questions', 'प्रश्न'), suffix: L('mapped', 'मैप'), gradient: 'from-blue-500 to-cyan-600' },
            { icon: Calendar, val: stats.yearsCovered?.length || 0, label: L('Years', 'वर्ष'), suffix: L('covered', 'कवर'), gradient: 'from-emerald-500 to-green-600' },
            { icon: BookOpen, val: stats.uniqueTopics || 0, label: L('Topics', 'विषय'), suffix: L('unique', 'अद्वितीय'), gradient: 'from-amber-500 to-orange-600' },
          ].map((s, i) => (
            <div key={i} className="group relative bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700/80 p-4 sm:p-5 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-secondary-900/50 hover:-translate-y-0.5 transition-all duration-300">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.gradient} rounded-full opacity-[0.06] -translate-x-4 -translate-y-4 group-hover:opacity-[0.12] group-hover:scale-110 transition-all`} />
              <div className={`w-10 h-10 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{s.val}</p>
              <p className="text-[11px] text-gray-500 dark:text-secondary-400 mt-0.5 font-medium">{s.label} {s.suffix}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tools Grid */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">{L('Analysis Tools', 'विश्लेषण उपकरण')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((t, i) => (
            <button key={i} onClick={() => navigate(t.path)}
              className="group flex items-start gap-4 p-4 bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700/80 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-700/50 hover:-translate-y-0.5 transition-all duration-300 text-left"
            >
              <div className={`w-11 h-11 bg-gradient-to-br ${t.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                <t.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{t.label}</h3>
                <p className="text-[11px] text-gray-500 dark:text-secondary-400 mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-secondary-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Papers List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{L('Imported Papers', 'आयातित पेपर')}</h2>
          {years?.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">{years.length}</span>
          )}
        </div>

        {(!years || years.length === 0) ? (
          <div className="bg-white dark:bg-secondary-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-secondary-700 p-10 sm:p-14 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-violet-100 dark:bg-violet-900/30 rounded-2xl" />
              <ScrollText className="w-7 h-7 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-base font-bold text-gray-700 dark:text-secondary-300 mb-2">{L('No PYQ Data Yet', 'अभी कोई PYQ डेटा नहीं')}</h3>
            <p className="text-xs text-gray-500 dark:text-secondary-400 mb-5 max-w-sm mx-auto leading-relaxed">
              {L('Import your analysis JSON to unlock trends, predictions, and gap analysis', 'रुझान, भविष्यवाणी और अंतर विश्लेषण खोलने के लिए अपना JSON आयात करें')}
            </p>
            <button onClick={() => navigate('/pyq/import')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Upload className="w-4 h-4" /> {L('Import PYQ Data', 'PYQ डेटा आयात करें')}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {years.map(y => (
              <div key={y.id}
                className="group bg-white dark:bg-secondary-800 rounded-2xl border border-gray-100 dark:border-secondary-700/80 p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-700/50 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/pyq/year/${y.id}`)}
              >
                {/* Year Badge */}
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-violet-200/50 dark:border-violet-700/50">
                  <span className="text-base font-black text-violet-600 dark:text-violet-400 leading-none">{y.year}</span>
                  <span className="text-[8px] uppercase font-bold text-violet-400 dark:text-violet-500 tracking-wide mt-0.5">{y.session}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">{y.displayLabel}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 dark:bg-secondary-700 text-gray-600 dark:text-secondary-400 rounded-full">{y.totalQuestions} Q</span>
                    {y.shift !== 'none' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">{y.shift === 'shift1' ? 'Shift 1' : 'Shift 2'}</span>
                    )}
                    {y.hasContent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                        {y.contentCount} {L('with text', 'पाठ सहित')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/pyq/year/${y.id}`)}
                    className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 flex items-center justify-center transition-colors"
                    title={L('View', 'देखें')}>
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(y.id, y.displayLabel)} disabled={deleting === y.id}
                    className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/15 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors disabled:opacity-40"
                    title={L('Delete', 'हटाएं')}>
                    {deleting === y.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PYQDashboard;