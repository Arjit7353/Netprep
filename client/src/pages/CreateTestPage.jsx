import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TestCreate from '../components/test/TestCreate';

const CreateTestPage = ({ language, setLanguage }) => {
  const { id: testId } = useParams();
  
  return (
    <Layout language={language} setLanguage={setLanguage}>
      {({ language: layoutLanguage, setLanguage: layoutSetLanguage }) => (
        <TestCreate language={layoutLanguage} testId={testId} />
      )}
    </Layout>
  );
};

export default CreateTestPage;