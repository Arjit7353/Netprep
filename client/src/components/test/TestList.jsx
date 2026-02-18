// client/src/components/test/TestList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  RefreshCw,
  ChevronDown,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TestCard from './TestCard';
import PDFExportButton from '../common/PDFExportButton';
import { useTest } from '../../hooks/useTest';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';
import Loader from '../common/Loader';

const API_URL = import.meta.env.VITE_API_URL || '';

const TestList = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const { tests, loading, error, pagination, fetchTests, deleteTest } = useTest();
  
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    testType: '',
    paper: '',
    status: 'active',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [testQuestions, setTestQuestions] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});

  useEffect(() => {
    loadTests();
  }, [filters]);

  // Fetch questions when tests are loaded
  useEffect(() => {
    if (tests && tests.length > 0) {
      fetchAllQuestions();
    }
  }, [tests]);

  const loadTests = async () => {
    try {
      await fetchTests({
        ...filters,
        page: 1,
        limit: 20
      });
    } catch (err) {
      console.error('Failed to load tests:', err);
    }
  };

  // ✅ FIXED: Properly fetch and store questions
  const fetchAllQuestions = async () => {
    const questionsMap = { ...testQuestions };
    const loadingMap = { ...loadingQuestions };
    
    const testsToFetch = tests.filter(test => !questionsMap[test._id]);
    
    if (testsToFetch.length === 0) return;
    
    // Set loading state for all
    testsToFetch.forEach(test => {
      loadingMap[test._id] = true;
    });
    setLoadingQuestions(loadingMap);
    
    await Promise.all(
      testsToFetch.map(async (test) => {
        try {
          // Try multiple endpoints
          let questions = [];
          
          // Method 1: Try /tests/:id/questions endpoint
          try {
            const response = await fetch(`${API_URL}/api/tests/${test._id}/questions`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              questions = extractQuestions(data);
            }
          } catch (e) {
            console.warn(`Endpoint /questions failed for ${test._id}`);
          }
          
          // Method 2: If questions still empty, try /tests/:id endpoint
          if (questions.length === 0) {
            try {
              const response = await fetch(`${API_URL}/api/tests/${test._id}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                questions = extractQuestions(data);
              }
            } catch (e) {
              console.warn(`Endpoint /tests/:id failed for ${test._id}`);
            }
          }
          
          // Method 3: Use embedded questions from test object
          if (questions.length === 0 && test.questions) {
            questions = extractQuestions(test.questions);
          }
          
          questionsMap[test._id] = questions;
          console.log(`✅ Loaded ${questions.length} questions for test: ${test.title}`);
          
        } catch (err) {
          console.error(`❌ Failed to fetch questions for test ${test._id}:`, err);
          questionsMap[test._id] = [];
        } finally {
          loadingMap[test._id] = false;
        }
      })
    );
    
    setTestQuestions(questionsMap);
    setLoadingQuestions(loadingMap);
  };

  // ✅ Helper to extract questions array from various response formats
  const extractQuestions = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.questions && Array.isArray(data.questions)) return data.questions;
    if (data?.data?.questions && Array.isArray(data.data.questions)) return data.data.questions;
    if (data?.test?.questions && Array.isArray(data.test.questions)) return data.test.questions;
    return [];
  };

  // Fetch questions for a specific test on demand
  const fetchQuestionsForTest = useCallback(async (testId) => {
    if (testQuestions[testId]?.length > 0) return testQuestions[testId];
    
    setLoadingQuestions(prev => ({ ...prev, [testId]: true }));
    
    try {
      const response = await fetch(`${API_URL}/api/tests/${testId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const questions = extractQuestions(data);
        setTestQuestions(prev => ({ ...prev, [testId]: questions }));
        return questions;
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoadingQuestions(prev => ({ ...prev, [testId]: false }));
    }
    
    return [];
  }, [testQuestions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleStartTest = (test) => {
    navigate(`/test/${test._id}`);
  };

  const handleEditTest = (test) => {
    navigate(`/tests/edit/${test._id}`);
  };

  const handleDeleteTest = async (test) => {
    if (window.confirm(language === 'hi' 
      ? 'क्या आप इस परीक्षा को हटाना चाहते हैं?' 
      : 'Are you sure you want to delete this test?'
    )) {
      try {
        await deleteTest(test._id);
      } catch (err) {
        console.error('Failed to delete test:', err);
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      testType: '',
      paper: '',
      status: 'active',
      search: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'hi' ? 'परीक्षाएं' : 'Tests'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'hi' 
              ? 'सभी उपलब्ध परीक्षाएं देखें और अभ्यास करें'
              : 'View and practice all available tests'
            }
          </p>
        </div>

        <button
          onClick={() => navigate('/tests/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          {language === 'hi' ? 'नई परीक्षा बनाएं' : 'Create New Test'}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'hi' ? 'परीक्षा खोजें...' : 'Search tests...'}
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Filter Toggle & View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-primary-50 border-primary-300 text-primary-700' 
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={loadTests}
              disabled={loading}
              className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title={language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            {/* Test Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {language === 'hi' ? 'परीक्षा प्रकार' : 'Test Type'}
              </label>
              <select
                value={filters.testType}
                onChange={(e) => handleFilterChange('testType', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">{language === 'hi' ? 'सभी प्रकार' : 'All Types'}</option>
                {Object.entries(TEST_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {language === 'hi' ? config.nameHi : config.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {language === 'hi' ? 'पेपर' : 'Paper'}
              </label>
              <select
                value={filters.paper}
                onChange={(e) => handleFilterChange('paper', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">{language === 'hi' ? 'सभी पेपर' : 'All Papers'}</option>
                {Object.entries(PAPER_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {language === 'hi' ? label.hi : label.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {language === 'hi' ? 'स्थिति' : 'Status'}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">{language === 'hi' ? 'सभी' : 'All'}</option>
                <option value="active">{language === 'hi' ? 'सक्रिय' : 'Active'}</option>
                <option value="draft">{language === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                <option value="archived">{language === 'hi' ? 'संग्रहीत' : 'Archived'}</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                {language === 'hi' ? '✕ फ़िल्टर साफ़ करें' : '✕ Clear Filters'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader size="lg" />
          <p className="mt-4 text-gray-500">
            {language === 'hi' ? 'परीक्षाएं लोड हो रही हैं...' : 'Loading tests...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadTests}
            className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {language === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}
          </button>
        </div>
      )}

      {/* Tests Grid/List */}
      {!loading && !error && (
        <>
          {tests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'hi' ? 'कोई परीक्षा नहीं मिली' : 'No tests found'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {language === 'hi' 
                  ? 'नई परीक्षा बनाने के लिए ऊपर दिए गए बटन पर क्लिक करें'
                  : 'Click the button above to create a new test'
                }
              </p>
              <button
                onClick={() => navigate('/tests/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {language === 'hi' ? 'नई परीक्षा बनाएं' : 'Create New Test'}
              </button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {tests.map((test) => (
                <div key={test._id} className="relative group">
                  <TestCard
                    test={test}
                    language={language}
                    onStart={handleStartTest}
                    onEdit={handleEditTest}
                    onDelete={handleDeleteTest}
                  />
                  
                  {/* PDF Export Button - Floating */}
                  <div className="absolute top-3 right-12 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PDFExportButton
                      type="test"
                      test={test}
                      questions={testQuestions[test._id] || []}
                      language={language}
                      variant="icon"
                      onExportStart={() => {
                        // Fetch questions if not loaded yet
                        if (!testQuestions[test._id]?.length) {
                          fetchQuestionsForTest(test._id);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Loading indicator for questions */}
                  {loadingQuestions[test._id] && (
                    <div className="absolute top-3 right-12 z-10">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-primary-600 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchTests({ ...filters, page })}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}

          {/* Results summary */}
          {tests.length > 0 && (
            <div className="text-center text-sm text-gray-500 mt-4">
              {language === 'hi' 
                ? `${tests.length} परीक्षाएं मिलीं`
                : `Found ${tests.length} tests`}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestList;