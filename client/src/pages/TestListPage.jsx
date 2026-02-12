import React from 'react';
import Layout from '../components/layout/Layout';
import TestList from '../components/test/TestList';

const TestListPage = ({ language: globalLanguage, setLanguage: setGlobalLanguage }) => {
  return (
    <Layout>
      {({ language, setLanguage }) => (
        <TestList language={globalLanguage || language} />
      )}
    </Layout>
  );
};

export default TestListPage;