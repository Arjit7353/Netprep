import React from 'react';
import Layout from '../components/layout/Layout';
import TestCreate from '../components/test/TestCreate';

const CreateTestPage = ({ language, setLanguage }) => {
  return (
    <Layout language={language} setLanguage={setLanguage}>
      {({ language: layoutLanguage, setLanguage: layoutSetLanguage }) => (
        <TestCreate language={layoutLanguage} />
      )}
    </Layout>
  );
};

export default CreateTestPage;