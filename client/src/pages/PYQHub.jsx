// client/src/pages/PYQHub.jsx
import React from 'react';
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  ScrollText, TrendingUp, Target, FlaskConical, Sparkles, Upload
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import PYQDashboard from '../components/pyq/PYQDashboard';
import YearAnalysis from '../components/pyq/YearAnalysis';
import MultiYearTrends from '../components/pyq/MultiYearTrends';
import TopicHeatmap from '../components/pyq/TopicHeatmap';
import PreparationGaps from '../components/pyq/PreparationGaps';
import PredictionDashboard from '../components/pyq/PredictionDashboard';
import PYQImport from '../components/pyq/PYQImport';
import PYQQuestionBank from './PYQQuestionBank';

const tabs = [
  { id: 'overview', path: '/pyq', exact: true, icon: ScrollText, label: { en: 'Overview', hi: 'अवलोकन' } },
  { id: 'year', path: '/pyq/year', icon: ScrollText, label: { en: 'Year View', hi: 'वर्ष दृश्य' } },
  { id: 'trends', path: '/pyq/trends', icon: TrendingUp, label: { en: 'Trends', hi: 'रुझान' } },
  { id: 'heatmap', path: '/pyq/heatmap', icon: Target, label: { en: 'Heatmap', hi: 'हीटमैप' } },
  { id: 'gaps', path: '/pyq/gaps', icon: FlaskConical, label: { en: 'Gaps', hi: 'अंतर' } },
  { id: 'predictions', path: '/pyq/predictions', icon: Sparkles, label: { en: 'Predict', hi: 'भविष्यवाणी' } },
  { id: 'import', path: '/pyq/import', icon: Upload, label: { en: 'Import', hi: 'आयात' } },
];

// ─── Inner content (NO Layout wrapper here) ───
const PYQHubContent = ({ language, setLanguage }) => {
  const location = useLocation();

  const isActive = (tab) =>
    tab.exact
      ? location.pathname === tab.path
      : location.pathname.startsWith(tab.path);

  // question-bank tab is in sidebar, not in tab bar
  const isQuestionBank = location.pathname === '/pyq/question-bank';

  return (
    <div className="space-y-0">
      {/* ─── Hub Header — hide on question-bank route ─── */}
      {!isQuestionBank && (
        <>
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl blur-lg opacity-40" />
                <div className="relative p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl">
                  <ScrollText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {language === 'hi' ? 'PYQ विश्लेषण हब' : 'PYQ Analysis Hub'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-secondary-400 mt-0.5">
                  {language === 'hi'
                    ? 'पिछले वर्षों के प्रश्नों का गहन विश्लेषण और तैयारी मार्गदर्शन'
                    : 'Deep PYQ analytics, trends & preparation guidance'}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Tab Bar ─── */}
          <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
            <div className="inline-flex items-center gap-1 min-w-max bg-white/80 dark:bg-secondary-800/80 backdrop-blur-xl border border-gray-200/70 dark:border-secondary-700/70 rounded-2xl p-1.5 shadow-sm">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = isActive(tab);
                return (
                  <NavLink
                    key={tab.id}
                    to={tab.path}
                    end={tab.exact}
                    className={`
                      relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl
                      text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap
                      ${active
                        ? 'text-white shadow-lg'
                        : 'text-gray-500 dark:text-secondary-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-secondary-700/60'
                      }
                    `}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/30" />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{language === 'hi' ? tab.label.hi : tab.label.en}</span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── Sub-Routes ─── */}
      <Routes>
        <Route index element={<PYQDashboard language={language} />} />
        <Route path="year" element={<YearAnalysis language={language} />} />
        <Route path="year/:id" element={<YearAnalysis language={language} />} />
        <Route path="trends" element={<MultiYearTrends language={language} />} />
        <Route path="heatmap" element={<TopicHeatmap language={language} />} />
        <Route path="gaps" element={<PreparationGaps language={language} />} />
        <Route path="predictions" element={<PredictionDashboard language={language} />} />
        <Route path="import" element={<PYQImport language={language} />} />
        {/* 
          ✅ PYQQuestionBank — language prop correctly passed 
          setLanguage bhi pass karo agar andar use ho
        */}
        <Route path="question-bank" element={<PYQQuestionBank language={language} />} />
        <Route path="*" element={<Navigate to="/pyq" replace />} />
      </Routes>
    </div>
  );
};

// ─── Outer wrapper — single Layout ───
const PYQHub = ({ language, setLanguage }) => {
  return (
    <Layout language={language} setLanguage={setLanguage}>
      {/* 
        ✅ KEY FIX: Layout children function se lang/setLang lo
        Yahi actual language state hai jo Header se update hoti hai
      */}
      {({ language: lang, setLanguage: setLang }) => (
        <PYQHubContent language={lang} setLanguage={setLang} />
      )}
    </Layout>
  );
};

export default PYQHub;