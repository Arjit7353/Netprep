const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const pyqUnitRegex = /          \{\/\* ----------- PYQ UNIT VIEW ----------- \*\/\}[\s\S]*?(?=          \{\/\* ----------- PYQ CHAPTER VIEW ----------- \*\/\}|          \{\/\* ----------- PAPER VIEW ----------- \*\/\})/;

const newPyqUnitBlock = `          {/* ----------- EXPLORER VIEW (PYQ UNIT/CHAPTER) ----------- */}
          {view === 'pyq_unit' && (
            <div className="flex flex-col lg:flex-row gap-6 mt-2 animate-fade-in">
              {/* Left Pane: Sidebar */}
              <div className="w-full lg:w-[320px] flex-shrink-0">
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">ALL CHAPTERS (PYQ)</h3>
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400 text-xs font-bold px-2 py-0.5 rounded-full">{pyqChaptersForUnit.length}</span>
                  </div>
                  <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {/* All Chapters Option */}
                    <button 
                      onClick={() => { updateFilter('chapter', ''); }}
                      className={\`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 \${!filters.chapter ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'}\`}
                    >
                      <span className="truncate pr-4">All Chapters</span>
                      {!filters.chapter && <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></div>}
                    </button>
                    
                    {pyqChaptersForUnit.map((ch, idx) => {
                      const isActive = filters.chapter === ch.chapter;
                      const numStr = String(idx + 1).padStart(2, '0');
                      return (
                        <button
                          key={ch.chapter}
                          onClick={() => { updateFilter('chapter', ch.chapter); }} 
                          className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 \${isActive ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent group'}\`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={\`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg \${isActive ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700'}\`}>
                              <span className="text-xs font-bold">CH {numStr}</span>
                            </div>
                            <span className={\`truncate \${isActive ? 'text-rose-700 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}\`}>{ch.chapter}</span>
                          </div>
                          {isActive && <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400"></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Pane: Tests List */}
              <div className="w-full lg:flex-1 bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl">
                {/* Header / Tabs */}
                <div className="px-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                    <button className="whitespace-nowrap py-4 text-sm font-medium border-b-2 border-rose-600 text-rose-600 dark:text-rose-400">All PYQ Tests</button>
                    <button className="whitespace-nowrap py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Shift 1</button>
                    <button className="whitespace-nowrap py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Shift 2</button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 bg-gray-50/30 dark:bg-gray-900/20 min-h-[500px]">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {filters.chapter ? filters.chapter : (filters.unit || 'All PYQs')}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{filteredPyqTests.length} PYQs found</span>
                  </div>
                  
                  {/* Reuse renderTests but force list mode for premium look */}
                  <div className="space-y-4">
                    {(() => {
                       if (filteredPyqTests.length === 0) {
                         return <EmptyBox text={T.noTests[language]} action={<button onClick={() => navigate('/tests/create')} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"><PlusCircle className="w-4 h-4" /> {T.create[language]}</button>} />;
                       }
                       return (
                         <div className="flex flex-col gap-4">
                           {filteredPyqTests.map(test => (
                             <TestCardPro key={test._id} test={test} language={language} variant="list" 
                               onEdit={() => navigate('/tests/edit/' + test._id)}
                               onView={() => navigate('/tests/' + test._id)}
                               onDelete={() => {}}
                               selectionMode={selectionMode}
                               isSelected={selectedTests.has(test._id)}
                               onToggleSelection={(id) => {}}
                             />
                           ))}
                         </div>
                       );
                    })()}
                    <PaginationBar />
                  </div>
                </div>
              </div>
            </div>
          )}
`;

if (pyqUnitRegex.test(content)) {
  content = content.replace(pyqUnitRegex, newPyqUnitBlock + '\n');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced PYQ UNIT VIEW correctly');
} else {
  console.log('Regex did not match PYQ UNIT VIEW');
}
