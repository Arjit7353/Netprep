const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /          \{\/\* [^\w]*?SEARCH VIEW [^\w]*?\*\/\}[\s\S]*$/;

const newBlock = `          {/* ----------- SEARCH VIEW ----------- */}
          {view === 'search' && (
            <div className="space-y-4 animate-fade-in mt-2">
              <FilterPanel filters={filters} updateFilter={updateFilter} clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters} filterOptions={filterOptions}
                language={language} viewMode={viewMode} setViewMode={setViewMode} />
              {renderTests()}
              <PaginationBar />
              {tests.length > 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 pb-4">
                  {T.showing[language]} {tests.length} {T.of[language]} {pagination.total} {T.tests[language]}
                </div>
              )}
            </div>
          )}

          {/* Batch Export Modal */}
          <BatchExportModal isOpen={showBatchExport} onClose={() => setShowBatchExport(false)}
            tests={selectedTestObjects} questionsCache={questionsCache} language={language} />
        </div>
      </div>
    </Layout>
  );
};

export default TestListPage;
`;

if (regex.test(content)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced correctly');
} else {
  console.log('Regex did not match');
}
