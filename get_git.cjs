const { execSync } = require('child_process'); console.log(execSync('"C:/Program Files/Git/cmd/git.exe" show --name-only HEAD', { encoding: 'utf8' }));
