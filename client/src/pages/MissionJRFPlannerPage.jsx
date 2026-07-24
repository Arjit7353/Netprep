import React from 'react';
import Layout from '../components/layout/Layout';
import AutoSyllabusPlanner from '../components/dashboard/AutoSyllabusPlanner';

const MissionJRFPlannerPage = ({ language, setLanguage }) => {
  return (
    <Layout language={language} setLanguage={setLanguage}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
        <AutoSyllabusPlanner language={language} />
      </div>
    </Layout>
  );
};

export default MissionJRFPlannerPage;
