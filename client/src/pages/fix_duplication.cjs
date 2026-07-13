const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// The duplicate section starts exactly at line 86.
// Let's split by lines and remove the first 85 lines.
let lines = content.split('\n');
if (lines[85].includes('client/src/pages/TestListPage.jsx')) {
  lines.splice(0, 85);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Fixed duplication by removing first 85 lines');
} else {
  console.log('Line 86 was not the start of duplication');
}
