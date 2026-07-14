import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ResultPage from '../components/result/ResultPage';
import Button from '../components/common/Button';
import { Trophy, BarChart3, ArrowLeft, AlertCircle } from 'lucide-react';
import attemptService from '../services/attemptService';

const getStoredLang = () => { try { return localStorage.getItem('netprep_lang') || 'en'; } catch { return 'en'; } };

const ResultDetail = ({ language: propLanguage = 'en', setLanguage: propSetLanguage }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousAttempts, setPreviousAttempts] = useState([]);

  const [language, setLanguageState] = useState(() => propLanguage || getStoredLang());

  useEffect(() => {
    if (propLanguage && propLanguage !== language) setLanguageState(propLanguage);
  }, [propLanguage]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && (e.detail === 'hi' || e.detail === 'en') && e.detail !== language) {
        setLanguageState(e.detail);
      }
    };
    window.addEventListener('netprep-lang-change', handler);
    return () => window.removeEventListener('netprep-lang-change', handler);
  }, [language]);

  const handleLanguageChange = useCallback((newLang) => {
    if (newLang !== 'hi' && newLang !== 'en') return;
    setLanguageState(newLang);
    if (propSetLanguage) propSetLanguage(newLang);
    try { localStorage.setItem('netprep_lang', newLang); } catch {}
    window.dispatchEvent(new CustomEvent('netprep-lang-change', { detail: newLang }));
  }, [propSetLanguage]);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aData, review] = await Promise.all([
        attemptService.getAttemptById(id),
        attemptService.getAttemptReview(id),
      ]);

      const attemptObj = aData.data;
      const reviewObj = review.data;

      setAttempt(attemptObj);
      setReviewData(reviewObj);

      // Get previous attempts if test exists
      const tid = reviewObj?.test?._id;
      const isDeleted = reviewObj?.testDeleted || reviewObj?.test?._isDeleted;
      if (tid && !isDeleted) {
        try {
          const p = await attemptService.getAttempts({ testId: tid, limit: 20 });
          setPreviousAttempts(p.data || []);
        } catch {
          setPreviousAttempts([]);
        }
      } else {
        setPreviousAttempts([]);
      }
    } catch (e) {
      console.error('Load failed:', e);
      setError(e.message || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  };

  const t = (en, hi) => language === 'hi' ? hi : en;

  if (loading) return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100 dark:border-primary-900 animate-ping opacity-20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-800" />
          <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          <BarChart3 className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
        </div>
        <p className="text-gray-500 font-semibold animate-pulse">{t('Loading analysis...', 'विश्लेषण लोड हो रहा है...')}</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-gray-600 dark:text-secondary-400 text-lg font-bold mb-2">{t('Error loading result', 'परिणाम लोड करने में त्रुटि')}</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/results')}>{t('Back', 'वापस')}</Button>
          <Button variant="outline" onClick={loadData}>{t('Retry', 'पुनः प्रयास')}</Button>
        </div>
      </div>
    </Layout>
  );

  if (!attempt || !reviewData) return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-secondary-700 dark:to-secondary-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Trophy className="w-12 h-12 text-gray-300 dark:text-secondary-500" />
        </div>
        <p className="text-gray-600 dark:text-secondary-400 text-lg font-bold mb-1">{t('Result not found', 'परिणाम नहीं मिला')}</p>
        <p className="text-gray-400 text-sm mb-6">{t('This result is no longer available', 'यह परिणाम उपलब्ध नहीं है')}</p>
        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/results')}>{t('Back', 'वापस')}</Button>
      </div>
    </Layout>
  );

  const isDeletedTest = reviewData.testDeleted || reviewData.test?._isDeleted;
  const testObj = reviewData.test || {};
  const questionsArr = (reviewData.questions || []).map(q => q.question || q);

  // Build attempt-like object for ResultPage
  const attemptForPage = {
    ...attempt,
    answers: reviewData.questions?.length > 0
      ? reviewData.questions.map(q => ({
          questionId: q.question?._id || q.questionId,
          selectedAnswer: q.selectedAnswer ?? -1,
          correctAnswer: q.correctAnswer ?? q.question?.correctAnswer,
          isCorrect: q.isCorrect ?? false,
          timeTaken: q.timeTaken ?? 0,
          markedForReview: q.markedForReview ?? false,
        }))
      : attempt.answers || [],
  };

  return (
    <Layout language={language} setLanguage={handleLanguageChange}>
      <ResultPage
        attempt={attemptForPage}
        test={testObj}
        questions={questionsArr}
        language={language}
        onLanguageChange={handleLanguageChange}
        previousAttempts={previousAttempts}
        testDeleted={isDeletedTest}
        onGoBack={() => navigate('/results')}
        onReattempt={isDeletedTest ? null : () => {
          const tid = testObj._id;
          if (tid) navigate(`/test/${tid}`);
        }}
      />
    </Layout>
  );
};

export default ResultDetail;