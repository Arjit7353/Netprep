import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  RefreshCw,
  ChevronDown,
  FileText  // ✅ ADDED THIS IMPORT
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TestCard from './TestCard';
import { useTest } from '../../hooks/useTest';
import { TEST_TYPE_CONFIG, PAPER_LABELS } from '../../utils/constants';
import Loader from '../common/Loader';

const TestList = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const { tests, loading, error, pagination, fetchTests, deleteTest } = useTest();
  
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [filters, setFilters] = useState({
    testType: '',
    paper: '',
    status: 'active',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTests();
  }, [filters]);

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
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filter Toggle & View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-50'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-50'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={loadTests}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title={language === 'hi' ? 'रीफ्रेश' : 'Refresh'}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Test Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'परीक्षा प्रकार' : 'Test Type'}
              </label>
              <select
                value={filters.testType}
                onChange={(e) => handleFilterChange('testType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'पेपर' : 'Paper'}
              </label>
              <select
                value={filters.paper}
                onChange={(e) => handleFilterChange('paper', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'स्थिति' : 'Status'}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{language === 'hi' ? 'सभी' : 'All'}</option>
                <option value="active">{language === 'hi' ? 'सक्रिय' : 'Active'}</option>
                <option value="draft">{language === 'hi' ? 'ड्राफ्ट' : 'Draft'}</option>
                <option value="archived">{language === 'hi' ? 'संग्रहीत' : 'Archived'}</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="sm:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {language === 'hi' ? 'फ़िल्टर साफ़ करें' : 'Clear Filters'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Tests Grid/List */}
      {!loading && !error && (
        <>
          {tests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'hi' ? 'कोई परीक्षा नहीं मिली' : 'No tests found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {language === 'hi' 
                  ? 'नई परीक्षा बनाने के लिए ऊपर दिए गए बटन पर क्लिक करें'
                  : 'Click the button above to create a new test'
                }
              </p>
              <button
                onClick={() => navigate('/tests/create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5" />
                {language === 'hi' ? 'नई परीक्षा बनाएं' : 'Create New Test'}
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {tests.map((test) => (
                <TestCard
                  key={test._id}
                  test={test}
                  language={language}
                  onStart={handleStartTest}
                  onEdit={handleEditTest}
                  onDelete={handleDeleteTest}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchTests({ ...filters, page })}
                  className={`px-3 py-1 rounded ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestList;