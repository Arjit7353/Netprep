// client/src/components/timeline/ChronologyPractice.jsx
// ═══════════════════════════════════════════════════════════════════
// CHRONOLOGY PRACTICE — Drag-and-Drop + Flashcard + Speed Quiz modes
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ArrowLeft, GripVertical, Check, X, Star, Clock, Zap, Layers,
  ChevronRight, ChevronLeft, RotateCcw, Trophy, Target, Shuffle, Eye
} from 'lucide-react';
import Layout from '../layout/Layout';
import { ERAS, TIMELINE_EVENTS, generateChronologyQuestions, generateFlashcards } from '../../utils/timelineData';
import { useNavigate } from 'react-router-dom';

const ChronologyPractice = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('select'); // 'select' | 'drag' | 'flashcard' | 'speed' | 'result'
  const [selectedEra, setSelectedEra] = useState('all');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [dragOrder, setDragOrder] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [results, setResults] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedPair, setSpeedPair] = useState(null);
  const [speedTotal, setSpeedTotal] = useState(0);
  const [speedStreak, setSpeedStreak] = useState(0);

  const L = (en, hi) => language === 'hi' ? hi : en;

  const formatYear = (year) => year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;

  // ═══ Start a practice session ═══
  const startDragPractice = () => {
    const qs = generateChronologyQuestions(selectedEra, difficulty, 5);
    setQuestions(qs);
    setCurrentQIdx(0);
    setResults([]);
    if (qs.length > 0) {
      setDragOrder(qs[0].items.map((_, i) => i));
    }
    setShowAnswer(false);
    setMode('drag');
  };

  const startFlashcards = () => {
    const cards = generateFlashcards(selectedEra, 15);
    setFlashcards(cards);
    setFlashcardIdx(0);
    setIsFlipped(false);
    setMode('flashcard');
  };

  const startSpeedQuiz = () => {
    setSpeedScore(0);
    setSpeedTotal(0);
    setSpeedStreak(0);
    generateSpeedPair();
    setMode('speed');
  };

  const generateSpeedPair = () => {
    let pool = [...TIMELINE_EVENTS].filter(e => e.importance >= 3);
    if (selectedEra !== 'all') pool = pool.filter(e => e.era === selectedEra);
    if (pool.length < 2) pool = [...TIMELINE_EVENTS].filter(e => e.importance >= 3);
    pool.sort(() => Math.random() - 0.5);
    const a = pool[0];
    const b = pool[1];
    if (a && b && a.year !== b.year) {
      setSpeedPair({ a, b, correct: a.year < b.year ? 'a' : 'b' });
    }
  };

  // ═══ Drag handlers ═══
  const onDragStart = (idx) => setDraggedIdx(idx);

  const onDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setDragOrder(prev => {
      const newOrder = [...prev];
      const draggedVal = newOrder[draggedIdx];
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(idx, 0, draggedVal);
      return newOrder;
    });
    setDraggedIdx(idx);
  };

  const onDragEnd = () => setDraggedIdx(null);

  const checkAnswer = () => {
    const q = questions[currentQIdx];
    if (!q) return;
    const userOrder = dragOrder.map(i => q.items[i].id);
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(q.correctOrder);
    setResults(prev => [...prev, { questionIdx: currentQIdx, isCorrect, userOrder, correctOrder: q.correctOrder }]);
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    const nextIdx = currentQIdx + 1;
    if (nextIdx >= questions.length) {
      setMode('result');
      return;
    }
    setCurrentQIdx(nextIdx);
    setDragOrder(questions[nextIdx].items.map((_, i) => i));
    setShowAnswer(false);
  };

  const handleSpeedAnswer = (choice) => {
    if (!speedPair) return;
    const isCorrect = choice === speedPair.correct;
    setSpeedTotal(prev => prev + 1);
    if (isCorrect) {
      setSpeedScore(prev => prev + 1);
      setSpeedStreak(prev => prev + 1);
    } else {
      setSpeedStreak(0);
    }
    if (speedTotal + 1 >= 15) {
      setMode('result');
    } else {
      generateSpeedPair();
    }
  };

  const currentQ = questions[currentQIdx];
  const correctCount = results.filter(r => r.isCorrect).length;

  return (
    <Layout language={language}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Back Button */}
        <button
          onClick={() => mode === 'select' ? navigate('/timeline') : setMode('select')}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {L('Back to Timeline', 'टाइमलाइन पर वापस')}
        </button>

        {/* ═══ MODE: SELECT ═══ */}
        {mode === 'select' && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
              <h1 className="text-xl sm:text-2xl font-black mb-2">
                {L('Chronology Practice', 'कालानुक्रम अभ्यास')}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200">
                {L('Master historical sequences with interactive exercises', 'इंटरैक्टिव अभ्यास से ऐतिहासिक अनुक्रम में महारत हासिल करें')}
              </p>
            </div>

            {/* Era & Difficulty Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{L('Select Era', 'युग चुनें')}</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedEra('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedEra === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    {L('All Eras', 'सभी युग')}
                  </button>
                  {ERAS.filter(e => e.id !== 'historiography').map(era => (
                    <button
                      key={era.id}
                      onClick={() => setSelectedEra(era.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedEra === era.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                      style={selectedEra === era.id ? { backgroundColor: era.color } : {}}
                    >
                      {L(era.name, era.nameHi)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{L('Difficulty', 'कठिनाई')}</h3>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        difficulty === d
                          ? d === 'easy' ? 'bg-emerald-600 text-white' : d === 'medium' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {d === 'easy' ? L('Easy (3 items)', 'आसान (3 आइटम)') : d === 'medium' ? L('Medium (5 items)', 'मध्यम (5 आइटम)') : L('Hard (7 items)', 'कठिन (7 आइटम)')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Practice Mode Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={startDragPractice}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <GripVertical className="w-7 h-7 mb-3 opacity-80" />
                <h3 className="text-sm font-black">{L('Drag & Drop', 'ड्रैग एंड ड्रॉप')}</h3>
                <p className="text-xs text-blue-200 mt-1">{L('Arrange events in chronological order', 'घटनाओं को कालानुक्रम में व्यवस्थित करें')}</p>
              </button>

              <button
                onClick={startFlashcards}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <Layers className="w-7 h-7 mb-3 opacity-80" />
                <h3 className="text-sm font-black">{L('Flashcards', 'फ्लैशकार्ड')}</h3>
                <p className="text-xs text-emerald-200 mt-1">{L('Event name on front, year on back', 'सामने घटना, पीछे वर्ष')}</p>
              </button>

              <button
                onClick={startSpeedQuiz}
                className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-left shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <Zap className="w-7 h-7 mb-3 opacity-80" />
                <h3 className="text-sm font-black">{L('Speed Quiz', 'स्पीड क्विज')}</h3>
                <p className="text-xs text-rose-200 mt-1">{L('"Which came first?" — 15 rapid questions', '"पहले कौन?" — 15 तेज़ प्रश्न')}</p>
              </button>
            </div>
          </div>
        )}

        {/* ═══ MODE: DRAG AND DROP ═══ */}
        {mode === 'drag' && currentQ && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {L(`Question ${currentQIdx + 1} of ${questions.length}`, `प्रश्न ${currentQIdx + 1} / ${questions.length}`)}
              </h2>
              <p className="text-xs text-gray-500 font-bold">{L('Arrange in chronological order', 'कालानुक्रम में व्यवस्थित करें')}</p>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }} />
            </div>

            {/* Drag Items */}
            <div className="space-y-2">
              {dragOrder.map((itemIdx, pos) => {
                const item = currentQ.items[itemIdx];
                const isCorrectPos = showAnswer && currentQ.correctOrder[pos] === item.id;
                const isWrongPos = showAnswer && currentQ.correctOrder[pos] !== item.id;

                return (
                  <div
                    key={itemIdx}
                    draggable={!showAnswer}
                    onDragStart={() => onDragStart(pos)}
                    onDragOver={(e) => onDragOver(e, pos)}
                    onDragEnd={onDragEnd}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      showAnswer
                        ? isCorrectPos
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                        : draggedIdx === pos
                          ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-[1.02]'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {!showAnswer && <GripVertical className="w-5 h-5 text-gray-400 shrink-0" />}
                    {showAnswer && (
                      isCorrectPos
                        ? <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                        : <X className="w-5 h-5 text-rose-600 shrink-0" />
                    )}

                    <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-black text-gray-600 dark:text-gray-300 shrink-0">
                      {pos + 1}
                    </span>

                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{L(item.title, item.titleHi)}</p>
                    </div>

                    {showAnswer && (
                      <span className="text-xs font-bold text-amber-600 shrink-0">{formatYear(item.year)}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show Correct Order */}
            {showAnswer && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">{L('Correct Order:', 'सही क्रम:')}</p>
                {currentQ.correctOrderFull.map((ev, i) => (
                  <p key={ev.id} className="text-xs text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-amber-600">{i + 1}.</span> {formatYear(ev.year)} — {L(ev.title, ev.titleHi)}
                  </p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-2">
              <button onClick={() => setMode('select')} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                {L('Quit', 'बाहर निकलें')}
              </button>
              {!showAnswer ? (
                <button onClick={checkAnswer} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                  <Check className="w-4 h-4 inline mr-1" /> {L('Check Answer', 'उत्तर जांचें')}
                </button>
              ) : (
                <button onClick={nextQuestion} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2">
                  {currentQIdx + 1 >= questions.length ? L('See Results', 'परिणाम देखें') : L('Next', 'अगला')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══ MODE: FLASHCARD ═══ */}
        {mode === 'flashcard' && flashcards.length > 0 && (
          <div className="space-y-4 flex flex-col items-center">
            <p className="text-xs font-bold text-gray-500">{flashcardIdx + 1} / {flashcards.length}</p>

            {/* Card */}
            <div
              className="w-full max-w-md h-56 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: '1000px' }}
            >
              <div className={`relative w-full h-full transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
                {/* Front */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center text-center text-white backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-lg font-black">{L(flashcards[flashcardIdx].front.title, flashcards[flashcardIdx].front.titleHi)}</p>
                  <p className="text-xs text-indigo-200 mt-3">{L('Tap to reveal year', 'वर्ष देखने के लिए टैप करें')}</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center text-center text-white [transform:rotateY(180deg)]" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-3xl font-black">{formatYear(flashcards[flashcardIdx].back.year)}</p>
                  <p className="text-xs text-amber-200 mt-2">{'⭐'.repeat(flashcards[flashcardIdx].back.importance)}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 mt-4">
              <button
                disabled={flashcardIdx === 0}
                onClick={() => { setFlashcardIdx(prev => prev - 1); setIsFlipped(false); }}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setFlashcardIdx(prev => Math.min(prev + 1, flashcards.length - 1)); setIsFlipped(false); }}
                disabled={flashcardIdx >= flashcards.length - 1}
                className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button onClick={() => setMode('select')} className="text-xs font-bold text-gray-400 hover:text-gray-600 mt-4">
              {L('Back to Menu', 'मेनू पर वापस')}
            </button>
          </div>
        )}

        {/* ═══ MODE: SPEED QUIZ ═══ */}
        {mode === 'speed' && speedPair && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">{L('Which came first?', 'पहले कौन आया?')}</h2>
              <p className="text-xs text-gray-500 mt-1">{speedTotal + 1} / 15 • {L('Streak', 'लगातार')}: {speedStreak}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleSpeedAnswer('a')}
                className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <p className="text-sm font-black">{L(speedPair.a.title, speedPair.a.titleHi)}</p>
              </button>
              <button
                onClick={() => handleSpeedAnswer('b')}
                className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <p className="text-sm font-black">{L(speedPair.b.title, speedPair.b.titleHi)}</p>
              </button>
            </div>

            <div className="flex justify-center gap-3 text-sm font-bold">
              <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{L('Correct', 'सही')}: {speedScore}</span>
              <span className="px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">{L('Wrong', 'गलत')}: {speedTotal - speedScore}</span>
            </div>
          </div>
        )}

        {/* ═══ MODE: RESULT ═══ */}
        {mode === 'result' && (
          <div className="text-center space-y-6 py-10">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{L('Practice Complete!', 'अभ्यास पूर्ण!')}</h2>

            <div className="flex justify-center gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5">
                <p className="text-3xl font-black text-emerald-600">{results.length > 0 ? correctCount : speedScore}</p>
                <p className="text-xs text-emerald-600 font-bold mt-1">{L('Correct', 'सही')}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-5">
                <p className="text-3xl font-black text-rose-600">{results.length > 0 ? results.length - correctCount : speedTotal - speedScore}</p>
                <p className="text-xs text-rose-600 font-bold mt-1">{L('Incorrect', 'गलत')}</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setMode('select')}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-200"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" /> {L('Try Again', 'फिर से')}
              </button>
              <button
                onClick={() => navigate('/timeline')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg"
              >
                {L('Back to Timeline', 'टाइमलाइन पर वापस')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChronologyPractice;
