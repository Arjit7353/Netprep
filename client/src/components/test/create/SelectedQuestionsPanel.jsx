import React, { useState, useMemo } from 'react';
import {
  GripVertical, X, FileText, Trash2, Undo2, Redo2,
  MousePointerClick, Filter, SortAsc, SortDesc
} from 'lucide-react';
import { DIFFICULTY_LABELS } from '../../../utils/constants';

const SelectedQuestionsPanel = ({
  questions,
  onRemove,
  onClear,
  onReorder,
  language,
  marksPerQuestion,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const t = (hi, en) => language === 'hi' ? hi : en;
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortMode, setSortMode] = useState('manual'); // manual | difficulty | type

  const displayQuestions = useMemo(() => {
    let list = [...questions];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(item => {
        const text = (item.question?.[language] || item.question?.hi || '').toLowerCase();
        return text.includes(q) || (item.unit || '').toLowerCase().includes(q);
      });
    }
    if (sortMode === 'difficulty') {
      const order = { easy: 0, medium: 1, hard: 2 };
      list.sort((a, b) => (order[a.difficulty] || 1) - (order[b.difficulty] || 1));
    } else if (sortMode === 'type') {
      list.sort((a, b) => (a.questionType || '').localeCompare(b.questionType || ''));
    }
    return list;
  }, [questions, searchFilter, sortMode, language]);

  const handleDragStart = (e, index) => {
    if (sortMode !== 'manual') return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || sortMode !== 'manual') return;
    const newQuestions = [...questions];
    const [draggedItem] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    onReorder(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-lg">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg">
          {t('कोई प्रश्न नहीं चुना', 'No Questions Selected')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          {t('"प्रश्न जोड़ें" बटन पर क्लिक करके प्रश्न चुनें', 'Click "Add Questions" to select')}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm">
          <MousePointerClick className="w-4 h-4" />
          {t('या नीचे "प्रश्न जोड़ें" पर क्लिक करें', 'or click "Add Questions" below')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {questions.length} {t('प्रश्न', 'Questions')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            {questions.length * marksPerQuestion} {t('अंक', 'Marks')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onUndo} disabled={!canUndo}
            className={`p-2 rounded-lg transition-colors ${canUndo ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
            title={t('पूर्ववत (Ctrl+Z)', 'Undo (Ctrl+Z)')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo}
            className={`p-2 rounded-lg transition-colors ${canRedo ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}
            title={t('फिर से (Ctrl+Y)', 'Redo (Ctrl+Y)')}
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Sort controls */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {[
              { key: 'manual', icon: GripVertical, tip: t('मैन्युअल', 'Manual') },
              { key: 'difficulty', icon: SortAsc, tip: t('कठिनाई', 'Difficulty') },
              { key: 'type', icon: Filter, tip: t('प्रकार', 'Type') }
            ].map(s => (
              <button key={s.key} type="button" title={s.tip} onClick={() => setSortMode(s.key)}
                className={`p-1.5 rounded-md transition-all ${sortMode === s.key ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              >
                <s.icon className={`w-3.5 h-3.5 ${sortMode === s.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button type="button" onClick={onClear}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('सभी हटाएं', 'Clear All')}
          </button>
        </div>
      </div>

      {/* Inline search */}
      {questions.length > 5 && (
        <input
          type="text"
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          placeholder={t('चुने हुए में खोजें...', 'Search selected...')}
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      )}

      {/* Questions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {displayQuestions.map((q, index) => {
          const originalIndex = questions.findIndex(oq => oq._id === q._id);
          return (
            <div
              key={q._id}
              draggable={sortMode === 'manual'}
              onDragStart={e => handleDragStart(e, originalIndex)}
              onDragOver={e => handleDragOver(e, originalIndex)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all group
                ${sortMode === 'manual' ? 'cursor-move' : 'cursor-default'}
                ${draggedIndex === originalIndex ? 'opacity-50 scale-95 shadow-lg' : ''}
              `}
            >
              {sortMode === 'manual' && (
                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-gray-400" />
              )}
              <span className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl text-xs font-bold flex-shrink-0 shadow-sm">
                {originalIndex + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 dark:text-gray-200 truncate font-medium">
                  {q.question?.[language] || q.question?.hi || '...'}
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-medium">
                    {q.paper === 'paper1' ? 'P1' : 'P2'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                    q.difficulty === 'easy'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : q.difficulty === 'hard'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  }`}>
                    {DIFFICULTY_LABELS[q.difficulty]?.[language] || q.difficulty}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => onRemove(q)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedQuestionsPanel;