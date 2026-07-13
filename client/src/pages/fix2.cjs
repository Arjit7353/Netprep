const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /  const renderPyqTests = \(testList\) => \{[\s\S]*?(?=          \{\/\* [^\w]*?SEARCH VIEW [^\w]*?\*\/\})/;

const newBlock = `  const renderPyqTests = (testList) => {
    if (pyqTestsLoading) return <TestListSkeleton count={4} viewMode="grid" />;
    if (testList.length === 0) return (
      <EmptyBox text={T.noPyqTests[language]} action={
        <button onClick={() => navigate('/tests/create')} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> {T.createPyqTest[language]}
        </button>} />
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {testList.map(test => (
          <div key={test._id} className="relative">
            <TestCardPro test={test} language={language} variant="grid"
              selectionMode={false} isSelected={false}
              onSelect={() => { }} onDelete={handleDelete}
              questions={questionsCache[test._id] || []} onFetchQuestions={() => fetchQuestionsForTest(test._id)} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout view={view} setView={setView}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Header title={T.testSeries[language]} subtitle={T.manageYourTests[language]} />
        <div className="mt-8">
          {/* ----------- HOME VIEW ----------- */}
          {view === 'home' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(PAPER_CONFIGS).map(([key, cfg]) => {
                  const count = countsByPaper[key] || 0;
                  const colorMap = {
                    paper1: 'blue',
                    paper2: 'amber',
                    combined: 'purple'
                  };
                  return (
                    <FolderCard 
                      key={key}
                      title={cfg.title[language]}
                      subtitle={cfg.subtitle[language]}
                      count={count}
                      icon={cfg.icon}
                      color={colorMap[key] || 'gray'}
                      onClick={() => selectPaper(key)}
                    />
                  );
                })}

                {/* PYQ Folder */}
                <FolderCard 
                  title={T.pyqTests[language]}
                  subtitle={T.pyqDesc[language]}
                  count={totalPyqTests}
                  icon={Star}
                  color="rose"
                  onClick={goToPYQ}
                />
              </div>
            </div>
          )}

          {/* ----------- PYQ MAIN VIEW ----------- */}
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
                  const unitNum = unit.id?.match(/\d+/)?.[0] || idx + 1;
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

          {/* ----------- PYQ UNIT VIEW ----------- */}
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

          {/* ----------- PYQ CHAPTER VIEW ----------- */}
          {view === 'pyq_chapter' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle="Chapter Tests"
                  count={filteredPyqTests.length}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Topics */}
                {pyqTopicsForChapter.map((tp, idx) => {
                  const tpTests = filteredPyqTests.filter(t => t.topic === tp.topic);
                  return (
                    <FolderCard 
                      key={tp.topic}
                      title={\`Topic \${idx + 1}\`}
                      subtitle={tp.topic}
                      count={tpTests.length}
                      icon={Tag}
                      color="purple"
                      onClick={() => {}}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------- PAPER VIEW ----------- */}
          {view === 'paper' && filters.paper && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={T.viewAll[language]}
                  subtitle={\`\${PAPER_CONFIGS[filters.paper]?.title[language]} Tests\`}
                  count={countsByPaper[filters.paper] || 0}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Units */}
                {unitsForPaper.map((item, idx) => {
                  const unitNum = item.unit?.match(/\d+/)?.[0] || idx + 1;
                  return (
                    <FolderCard 
                      key={item.unit}
                      title={\`Unit \${unitNum}\`}
                      subtitle={item.unit}
                      count={item.count}
                      icon={Layers}
                      color="blue"
                      onClick={() => selectUnit(item.unit)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ----------- UNIT VIEW ----------- */}
          {view === 'unit' && (
            <div className="space-y-6 animate-fade-in mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* View All Tests Folder */}
                <FolderCard 
                  title={\`\${T.allTests[language]} (\${pagination.total})\`}
                  subtitle={filters.unit || 'Unit Tests'}
                  count={pagination.total}
                  icon={List}
                  color="gray"
                  onClick={() => goToSearch()}
                />

                {/* Chapters */}
                {chaptersForUnit.map((ch, idx) => {
                  const chTests = tests.filter(t => t.chapter === ch);
                  return (
                    <FolderCard 
                      key={ch}
                      title={\`Chapter \${idx + 1}\`}
                      subtitle={ch}
                      count={chTests.length}
                      icon={BookCopy}
                      color="purple"
                      onClick={() => selectChapter(ch)}
                    />
                  );
                })}
              </div>
            </div>
          )}
`

if (regex.test(content)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced correctly');
} else {
  console.log('Regex did not match');
}
