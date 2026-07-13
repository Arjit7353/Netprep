const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/components/test/TestCardPro.jsx';
let content = fs.readFileSync(file, 'utf8');

const listVariantIndex = content.indexOf('  // -- LIST VARIANT --');
if (listVariantIndex !== -1) {
  const newContent = content.substring(0, listVariantIndex) + `  // -- LIST VARIANT -- (Advanced Premium UI)
  return (
    <div
      onClick={onCardClick}
      className={\`relative overflow-hidden rounded-2xl border transition-all duration-200 group bg-white dark:bg-gray-800/80 hover:shadow-xl hover:-translate-y-0.5 \${t.border}
        \${selectionMode ? 'cursor-pointer' : ''} \${isSelected ? \`ring-2 \${t.ring} border-primary-500\` : ''}\`}
    >
      <div className={\`absolute left-0 top-0 bottom-0 w-1 \${t.strip}\`} />

      {/* Translation overlay */}
      {translateState === TRANSLATE_STATES.translating && (
        <div className="absolute inset-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {language === 'hi' ? '?????? ?? ??? ??...' : 'Translating...'}
          </span>
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start">
        {/* Left Icon Block */}
        <div className="flex items-center gap-4">
          {selectionMode && (
            <div className={\`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
              \${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}\`}>
              {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
          )}
          
          <div className={\`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden \${t.iconBg}\`}>
            <TypeIcon className="w-8 h-8 text-white/90 drop-shadow-md" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-1.5 right-1.5">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Play className="w-3 h-3 text-red-600 ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span className={\`px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 \${t.badgeLight} bg-transparent border \${t.border}\`}>{cfg.title[language] || cfg.shortCode}</span>
              <span>•</span>
              <span>{formatRelative(test.createdAt)}</span>
            </div>
            
            {/* Status Checkmark */}
            {best !== null && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30" title={\`Best: \${best}%\`}>
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>
          
          <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight mb-2 pr-4 truncate">{test.title}</h4>
          
          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
            <span className="flex items-center gap-1"><FileQuestion className="w-4 h-4 text-gray-400" /> {test.totalQuestions} Questions</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" /> {test.duration} mins</span>
            {translateState === TRANSLATE_STATES.success && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'hi' ? '????????' : 'Translated'}
              </span>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 mt-auto">
            <button onClick={(e) => { e.stopPropagation(); navigate(\`/test/\${test._id}\`); }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
              <Play className="w-4 h-4" /> {language === 'hi' ? '????? ???' : 'Take Test'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate(\`/tests/edit/\${test._id}\`); }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
              <Edit3 className="w-4 h-4" /> {language === 'hi' ? '??????? ????' : 'Edit'}
            </button>
            
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <TranslateButton size="icon" />
              <PDFExportButton type="test" test={test} questions={questions} language={language} variant="minimal" onExportStart={onFetchQuestions} />
              {!selectionMode && (
                <button onClick={(e) => onDelete?.(test._id, e)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 dark:hover:bg-red-900/20 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {best !== null && (
        <div className="h-1 bg-gray-100 dark:bg-gray-800 absolute bottom-0 left-0 right-0">
          <div className={\`h-full \${t.strip} transition-all duration-500\`} style={{ width: \`\${best}%\` }} />
        </div>
      )}
    </div>
  );
};

const MenuBtn = ({ icon: Icon, label, onClick, danger = false, highlight = false }) => (
  <button onClick={onClick}
    className={\`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
      \${danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' :
        highlight ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium' :
        'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}\`}>
    <Icon className="w-3.5 h-3.5" /> {label}
  </button>
);

export default TestCardPro;
`;
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('Fixed file');
} else {
  console.log('Not found');
}
