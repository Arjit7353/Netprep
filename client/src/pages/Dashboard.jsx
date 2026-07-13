import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileQuestion, 
  ClipboardList, 
  Target, 
  BookOpen, 
  Play,
  Upload,
  BarChart3,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import useDashboard from '../hooks/useDashboard';

const StatCard = ({ icon: Icon, label, value, sub, gradient, iconBg, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
  >
    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, title, desc, onClick, gradient }) => (
  <div 
    onClick={onClick}
    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
  </div>
);

const Dashboard = () => {
  const d = useDashboard();
  const navigate = useNavigate();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{getGreeting()}, Student! 👋</h1>
            <p className="text-blue-100 max-w-lg">
              Welcome back to your preparation hub. Let's conquer UGC NET together!
            </p>
          </div>
          <div className="relative z-10 flex gap-3">
            <button 
              onClick={() => navigate('/tests')}
              className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Take Test
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Your Performance Overview
          </h2>
          {d.loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={ClipboardList} 
                label="Tests Completed" 
                value={d.allCompletedAttempts?.length || 0}
                sub="Total tests taken" 
                gradient="from-blue-500 to-indigo-500" 
                iconBg="from-blue-500 to-indigo-600"
                onClick={() => navigate('/tests')} 
              />
              <StatCard 
                icon={Target} 
                label="Overall Accuracy" 
                value={`${d.overallAccuracy || 0}%`}
                sub="Across all questions" 
                gradient="from-emerald-500 to-green-500" 
                iconBg="from-emerald-500 to-green-600"
                onClick={() => navigate('/results')} 
              />
              <StatCard 
                icon={BookOpen} 
                label="Paper 1 Score" 
                value={`${d.paper1AvgScore || 0}%`}
                sub="Average score" 
                gradient="from-amber-500 to-orange-500" 
                iconBg="from-amber-500 to-orange-600"
              />
              <StatCard 
                icon={FileQuestion} 
                label="Questions Bank" 
                value={d.totalQuestions || 0}
                sub="Total questions available" 
                gradient="from-purple-500 to-violet-500" 
                iconBg="from-purple-500 to-violet-600"
                onClick={() => navigate('/questions')} 
              />
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              <QuickAction 
                icon={Play} title="Mock Tests" desc="Take a full length mock test"
                gradient="from-blue-500 to-indigo-500" onClick={() => navigate('/tests')}
              />
              <QuickAction 
                icon={FileQuestion} title="Question Bank" desc="Practice subject-wise questions"
                gradient="from-emerald-500 to-green-500" onClick={() => navigate('/questions')}
              />
              <QuickAction 
                icon={BarChart3} title="My Results" desc="View detailed analytics"
                gradient="from-purple-500 to-violet-500" onClick={() => navigate('/results')}
              />
              <QuickAction 
                icon={Upload} title="Import Questions" desc="Upload new questions via JSON"
                gradient="from-amber-500 to-orange-500" onClick={() => navigate('/import')}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" /> Recent Activity
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
              {d.loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />)}
                </div>
              ) : d.recentAttempts && d.recentAttempts.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {d.recentAttempts.slice(0, 5).map((attempt, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attempt.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {attempt.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {attempt.testId?.title || 'Practice Test'}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(attempt.createdAt).toLocaleDateString()} • {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                          </p>
                        </div>
                      </div>
                      {attempt.status === 'completed' && (
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white text-lg">
                            {Math.round((attempt.score / (attempt.totalMarks || 1)) * 100) || 0}%
                          </p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-semibold">No recent activity</h3>
                  <p className="text-gray-500 text-sm mt-1">Take a mock test to see your progress here.</p>
                  <button 
                    onClick={() => navigate('/tests')}
                    className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Start practicing
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;