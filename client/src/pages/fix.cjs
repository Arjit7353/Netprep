const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const regexPyqMain = /          \{\/\* [^\w]*?PYQ MAIN VIEW [^\w]*?\*\/\}[\s\S]*?(?=          \{\/\* [^\w]*?PYQ UNIT VIEW [^\w]*?\*\/\})/;
const regexPyqUnit = /          \{\/\* [^\w]*?PYQ UNIT VIEW [^\w]*?\*\/\}[\s\S]*?(?=          \{\/\* [^\w]*?PYQ CHAPTER VIEW [^\w]*?\*\/\})/;

const newPyqMainView = `          {/* ----------- PYQ MAIN VIEW ----------- */}
          {view === 'pyq' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle="All PYQ Tests"
                  count={allPyqTests.length}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Units */}
                {pyqUnits.map((unit, idx) => {
                  const unitNum = unit.id?.match(/\\d+/)?.[0] || idx + 1;
                  return (
                    <FolderCard 
                      key={unit.id}
                      title={\`Unit \${unitNum}\`}
                      subtitle={unit.name}
                      count={pyqTestCountByUnit[unit.id] || 0}
                      icon={Layers}
                      color="rose"
                      onClick={() => selectPYQUnit(unit.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

`;

const newPyqUnitView = `          {/* ----------- PYQ UNIT VIEW ----------- */}
          {view === 'pyq_unit' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle="Unit Tests"
                  count={filteredPyqTests.length}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Chapters */}
                {pyqChaptersForUnit.map((ch, idx) => {
                  const testCount = pyqTestCountByChapter[ch.chapter] || 0;
                  return (
                    <FolderCard 
                      key={ch.chapter}
                      title={\`Chapter \${idx + 1}\`}
                      subtitle={ch.chapter}
                      count={testCount}
                      icon={BookCopy}
                      color="orange"
                      onClick={() => selectPYQChapter(ch.chapter)}
                    />
                  );
                })}
              </div>
            </div>
          )}

`;

if (regexPyqMain.test(content)) {
  content = content.replace(regexPyqMain, newPyqMainView);
  console.log('Replaced PYQ MAIN VIEW');
} else { console.log('PYQ MAIN Not found'); }

if (regexPyqUnit.test(content)) {
  content = content.replace(regexPyqUnit, newPyqUnitView);
  console.log('Replaced PYQ UNIT VIEW');
} else { console.log('PYQ UNIT Not found'); }

fs.writeFileSync(file, content, 'utf8');
