const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const headerRegex = /        <div className="mb-8">\s*<h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">\s*\{T\.title\[language\]\}\s*<\/h1>\s*<p className="text-gray-500 dark:text-gray-400 mt-1">\s*\{T\.subtitle\[language\]\}\s*<\/p>\s*<\/div>/;

const newHeader = `        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {view !== 'home' && (
                <button 
                  onClick={goBack} 
                  className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all active:scale-95"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <button onClick={goHome} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"><Home className="w-3.5 h-3.5" /> Home</button>
                {view !== 'home' && <ChevronRight className="w-4 h-4" />}
                {view === 'paper' && <span className="text-gray-900 dark:text-gray-100">{PAPER_CONFIGS[filters.paper]?.title[language]}</span>}
                {view === 'unit' && <span className="text-gray-900 dark:text-gray-100">Explorer</span>}
                {view === 'pyq' && <span className="text-gray-900 dark:text-gray-100">{T.pyqTests[language]}</span>}
                {view === 'pyq_unit' && <span className="text-gray-900 dark:text-gray-100">PYQ Explorer</span>}
                {view === 'search' && <span className="text-gray-900 dark:text-gray-100">Search</span>}
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {T.title[language]}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {T.subtitle[language]}
            </p>
          </div>
        </div>`;

if (headerRegex.test(content)) {
  content = content.replace(headerRegex, newHeader);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed header');
} else {
  console.log('Regex did not match header');
}
