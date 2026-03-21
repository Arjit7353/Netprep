import React, { useMemo } from 'react';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Target, Layers, BarChart3, Sparkles } from 'lucide-react';
import GlassCard from './GlassCard';

const TestQualityIndicator = ({ questions, language, formData }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  const quality = useMemo(() => {
    if (questions.length === 0) return { score: 0, grade: 'N/A', color: 'gray', items: [] };

    const items = [];
    let totalScore = 0;
    const maxItems = 4;

    // 1. Difficulty balance (25 pts)
    const diff = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => { diff[q.difficulty || 'medium']++; });
    const total = questions.length;
    const easyPct = diff.easy / total;
    const medPct = diff.medium / total;
    const hardPct = diff.hard / total;
    // Ideal: ~30% easy, ~50% medium, ~20% hard
    const diffBalance = 25 - (Math.abs(easyPct - 0.3) + Math.abs(medPct - 0.5) + Math.abs(hardPct - 0.2)) * 25;
    const diffScore = Math.max(0, Math.round(diffBalance));
    totalScore += diffScore;
    items.push({
      label: t('कठिनाई संतुलन', 'Difficulty Balance'),
      score: diffScore, max: 25,
      status: diffScore >= 18 ? 'good' : diffScore >= 10 ? 'fair' : 'poor',
      tip: diffScore < 15 ? t('आसान/मध्यम/कठिन का अनुपात ~30/50/20 रखें', 'Keep ratio ~30/50/20 for easy/med/hard') : null
    });

    // 2. Question type variety (25 pts)
    const types = new Set(questions.map(q => q.questionType || 'mcq'));
    const typeScore = Math.min(25, types.size * 5);
    totalScore += typeScore;
    items.push({
      label: t('प्रश्न विविधता', 'Type Variety'),
      score: typeScore, max: 25,
      status: typeScore >= 20 ? 'good' : typeScore >= 10 ? 'fair' : 'poor',
      tip: types.size < 3 ? t('विभिन्न प्रकार के प्रश्न जोड़ें', 'Add different question types') : null
    });

    // 3. Unit/topic coverage (25 pts)
    const units = new Set(questions.map(q => q.unit).filter(Boolean));
    const topics = new Set(questions.map(q => q.topic).filter(Boolean));
    const coverageScore = Math.min(25, (units.size * 3) + (topics.size * 2));
    totalScore += coverageScore;
    items.push({
      label: t('पाठ्यक्रम कवरेज', 'Syllabus Coverage'),
      score: coverageScore, max: 25,
      status: coverageScore >= 18 ? 'good' : coverageScore >= 10 ? 'fair' : 'poor',
      tip: units.size < 3 ? t('अधिक इकाइयों से प्रश्न चुनें', 'Select from more units') : null
    });

    // 4. Question count appropriateness (25 pts)
    const timePerQ = (formData?.duration || 60) * 60 / (questions.length || 1);
    // NTA ideal: ~72 seconds per question
    const timeDeviation = Math.abs(timePerQ - 72) / 72;
    const countScore = Math.round(Math.max(0, 25 * (1 - timeDeviation)));
    totalScore += countScore;
    items.push({
      label: t('समय पर्याप्तता', 'Time Adequacy'),
      score: countScore, max: 25,
      status: countScore >= 18 ? 'good' : countScore >= 10 ? 'fair' : 'poor',
      tip: timePerQ < 40 ? t('कम प्रश्न या अधिक समय दें', 'Reduce questions or increase time') :
           timePerQ > 120 ? t('अधिक प्रश्न जोड़ें या समय कम करें', 'Add more questions or reduce time') : null
    });

    const finalScore = Math.min(100, totalScore);
    const grade = finalScore >= 80 ? 'A' : finalScore >= 60 ? 'B' : finalScore >= 40 ? 'C' : 'D';
    const color = finalScore >= 80 ? 'green' : finalScore >= 60 ? 'blue' : finalScore >= 40 ? 'amber' : 'red';

    return { score: finalScore, grade, color, items };
  }, [questions, formData, language]);

  if (questions.length === 0) return null;

  const statusIcon = {
    good: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    fair: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    poor: <XCircle className="w-4 h-4 text-red-500" />
  };

  const gradeGradients = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-600'
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {t('टेस्ट गुणवत्ता', 'Test Quality')}
        </h4>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradeGradients[quality.color]} flex items-center justify-center shadow-lg text-white font-black text-lg`}>
          {quality.grade}
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">{t('स्कोर', 'Score')}</span>
          <span className="font-bold text-gray-700 dark:text-gray-200">{quality.score}/100</span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradeGradients[quality.color]} transition-all duration-700`}
            style={{ width: `${quality.score}%` }}
          />
        </div>
      </div>

      {/* Quality Items */}
      <div className="space-y-3">
        {quality.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            {statusIcon[item.status]}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.label}</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{item.score}/{item.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.status === 'good' ? 'bg-green-500' : item.status === 'fair' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
              {item.tip && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 flex-shrink-0" /> {item.tip}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default TestQualityIndicator;