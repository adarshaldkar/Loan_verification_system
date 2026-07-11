const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const filesToProcess = getAllFiles(path.join(__dirname, '../app/agent'));

const replacements = [
  { regex: /bg-white/g, replacement: 'bg-white dark:bg-slate-950' },
  { regex: /text-gray-900/g, replacement: 'text-gray-900 dark:text-slate-100' },
  { regex: /text-gray-800/g, replacement: 'text-gray-800 dark:text-slate-200' },
  { regex: /text-gray-700/g, replacement: 'text-gray-700 dark:text-slate-300' },
  { regex: /text-gray-600/g, replacement: 'text-gray-600 dark:text-slate-400' },
  { regex: /text-gray-500/g, replacement: 'text-gray-500 dark:text-slate-400' },
  { regex: /text-gray-400/g, replacement: 'text-gray-400 dark:text-slate-500' },
  { regex: /border-gray-100/g, replacement: 'border-gray-100 dark:border-slate-800' },
  { regex: /border-gray-200/g, replacement: 'border-gray-200 dark:border-slate-800' },
  { regex: /border-gray-300/g, replacement: 'border-gray-300 dark:border-slate-700' },
  { regex: /bg-gray-50/g, replacement: 'bg-gray-50 dark:bg-slate-900' },
  { regex: /bg-gray-100/g, replacement: 'bg-gray-100 dark:bg-slate-800' },
  { regex: /bg-gray-200/g, replacement: 'bg-gray-200 dark:bg-slate-700' },
  { regex: /bg-\[\#F4F6FB\]/g, replacement: 'bg-[#F4F6FB] dark:bg-slate-900' }
];

filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    replacements.forEach(({ regex, replacement }) => {
      // Very basic check to prevent double injection
      const targetStr = replacement;
      if (!content.includes(targetStr)) {
        // We only replace if we haven't already replaced it in this file
        // To be safe against partial re-runs, we can use a more robust regex that ignores already replaced strings
        // But since this is a quick script, let's just do it simple:
      }
    });

    // Actually, a safer regex replacement to prevent double replacing:
    // e.g. replacing 'bg-white' but NOT 'bg-white dark:bg-slate-950'
    // Let's reset the logic:
    let newContent = content;
    replacements.forEach(({ regex, replacement }) => {
       // split by the replacement string first. If it's there, we might double replace.
       // Easiest is to replace all back to original, then apply.
       const original = replacement.split(' ')[0];
       newContent = newContent.replaceAll(replacement, original);
    });
    
    // Now apply all
    replacements.forEach(({ regex, replacement }) => {
       newContent = newContent.replace(regex, replacement);
    });

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes for ${filePath}`);
    }
  }
});
