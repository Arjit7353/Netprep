import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Upload,
  PlusCircle,
  Clock,
  Target,
  BookOpen,
  Award,
  ArrowRight,
  Calendar
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import { CardSkeleton } from '../components/common/Loader';
import { useQuestions } from '../hooks/useQuestions';
import { formatDate, getRelativeTime } from '../utils/helpers';

const Dashboard = () => {
  const { stats, fetchStats, loading } = useQuestions();
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Layout>
      {({ language }) => (
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {language === 'hi' ? 'नमस्ते!' : 'Welcome!'}
                </h1>
                <p className="text-primary-100">
                  {language === 'hi' 
                    ? 'UGC NET की तैयारी के लिए तैयार हैं?'
                    : 'Ready to prepare for UGC NET?'
                  }
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  icon={PlusCircle}
                  as={Link}
                  to="/tests/create"
                  className="bg-white text-primary-700 hover:bg-primary-50"
                >
                  {language === 'hi' ? 'टेस्ट बनाएं' : 'Create Test'}
                </Button>
                <Button
                  variant="outline"
                  icon={Upload}
                  as={Link}
                  to="/import"
                  className="border-white text-white hover:bg-white/10"
                >
                  {language === 'hi' ? 'प्रश्न आयात' : 'Import Questions'}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                {/* Total Questions */}
                <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-secondary-400 mb-1">
                        {language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats?.total || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileQuestion className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +{stats?.recentAdditions || 0}
                    </span>
                    <span className="text-gray-500 dark:text-secondary-400 ml-2">
                      {language === 'hi' ? 'इस सप्ताह' : 'this week'}
                    </span>
                  </div>
                </div>

                {/* Paper 1 Questions */}
                <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-secondary-400 mb-1">
                        {language === 'hi' ? 'पेपर 1' : 'Paper 1'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats?.byUnit?.filter(u => u._id.paper === 'paper1')
                          .reduce((sum, u) => sum + u.count, 0) || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-secondary-400">
                    {language === 'hi' ? 'सामान्य पेपर' : 'General Paper'}
                  </p>
                </div>

                {/* Paper 2 Questions */}
                <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-secondary-400 mb-1">
                        {language === 'hi' ? 'पेपर 2' : 'Paper 2'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats?.byUnit?.filter(u => u._id.paper === 'paper2')
                          .reduce((sum, u) => sum + u.count, 0) || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-secondary-400">
                    {language === 'hi' ? 'इतिहास' : 'History'}
                  </p>
                </div>

                {/* Tests Attempted */}
                <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-secondary-400 mb-1">
                        {language === 'hi' ? 'परीक्षाएं' : 'Tests'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stats?.attempts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 dark:text-secondary-400">
                    {language === 'hi' ? 'टेस्ट शुरू करें' : 'Start testing'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions & Question Types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}
              </h3>
              <div className="space-y-3">
                <Link
                  to="/questions"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'hi' ? 'प्रश्न बैंक देखें' : 'View Question Bank'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-secondary-400">
                        {language === 'hi' ? 'सभी प्रश्न ब्राउज़ करें' : 'Browse all questions'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-secondary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                </Link>

                <Link
                  to="/import"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'hi' ? 'प्रश्न आयात करें' : 'Import Questions'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-secondary-400">
                        {language === 'hi' ? 'JSON से प्रश्न जोड़ें' : 'Add questions from JSON'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-secondary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                </Link>

                <Link
                  to="/tests/create"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <PlusCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'hi' ? 'नया टेस्ट बनाएं' : 'Create New Test'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-secondary-400">
                        {language === 'hi' ? 'मॉक टेस्ट बनाएं' : 'Build a mock test'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-secondary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                </Link>

                <Link
                  to="/results"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'hi' ? 'परिणाम देखें' : 'View Results'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-secondary-400">
                        {language === 'hi' ? 'अपनी प्रगति ट्रैक करें' : 'Track your progress'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-secondary-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Question Types Distribution */}
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'hi' ? 'प्रश्न प्रकार वितरण' : 'Question Types Distribution'}
              </h3>
              {stats?.byType && Object.keys(stats.byType).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => {
                    const percentage = stats.total > 0 
                      ? Math.round((count / stats.total) * 100) 
                      : 0;
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-secondary-400 capitalize">
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-secondary-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 dark:bg-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-secondary-400">
                  <FileQuestion className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-secondary-600" />
                  <p>{language === 'hi' ? 'कोई प्रश्न नहीं' : 'No questions yet'}</p>
                  <Link 
                    to="/import" 
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2 inline-block"
                  >
                    {language === 'hi' ? 'प्रश्न आयात करें' : 'Import questions'}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Unit-wise Distribution */}
          {stats?.byUnit && stats.byUnit.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'hi' ? 'इकाई-वार प्रश्न' : 'Unit-wise Questions'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paper 1 Units */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-secondary-400 mb-3">
                    {language === 'hi' ? 'पेपर 1' : 'Paper 1'}
                  </h4>
                  <div className="space-y-2">
                    {stats.byUnit
                      .filter(u => u._id.paper === 'paper1')
                      .map((unit, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-secondary-700 rounded-lg"
                        >
                          <span className="text-sm text-gray-700 dark:text-secondary-300 truncate max-w-[200px]\">
                            {unit._id.unit}
                          </span>
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 ml-2">
                            {unit.count}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Paper 2 Units */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-secondary-400 mb-3">
                    {language === 'hi' ? 'पेपर 2 (इतिहास)' : 'Paper 2 (History)'}
                  </h4>
                  <div className="space-y-2">
                    {stats.byUnit
                      .filter(u => u._id.paper === 'paper2')
                      .map((unit, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-secondary-700 rounded-lg"
                        >
                          <span className="text-sm text-gray-700 dark:text-secondary-300 truncate max-w-[200px]">
                            {unit._id.unit}
                          </span>
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 ml-2">
                            {unit.count}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;