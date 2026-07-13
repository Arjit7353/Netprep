const fs = require('fs');
const file = 'c:/Users/arjit/OneDrive/Desktop/NETprep/client/src/pages/TestListPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const FolderCard = \(\{.*?};/s;
const newComponent = `const FolderCard = ({ title, subtitle, count, icon: Icon, color = 'blue', onClick }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/30',
    gray: 'from-gray-600 to-gray-700 shadow-gray-500/30'
  };
  
  const bg = colorMap[color] || colorMap.gray;
  
  return (
    <button 
      onClick={onClick} 
      className="group relative w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-transparent dark:hover:border-transparent overflow-hidden text-left backdrop-blur-sm"
    >
      {/* Subtle hover gradient overlay */}
      <div className={\`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-r \${bg}\`} />
      
      {/* Glowing Left Icon */}
      <div className={\`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br \${bg} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3\`}>
        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        {Icon ? <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm relative z-10" /> : <FolderOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm relative z-10" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Count Badge */}
      {count !== undefined && (
        <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[2.5rem] px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 transition-all group-hover:bg-white dark:group-hover:bg-gray-600 shadow-sm group-hover:shadow group-hover:scale-110">
          <span className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 leading-none">{count}</span>
        </div>
      )}
    </button>
  );
};`;

if (regex.test(content)) {
  content = content.replace(regex, newComponent);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed folder card');
} else {
  console.log('Regex did not match FolderCard');
}
