const fs = require('fs');
const path = require('path');

const dir = 'src/components';

function walk(directory) {
  fs.readdirSync(directory).forEach(f => {
    const fullPath = path.join(directory, f);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Most common replacements:

  // Text
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']text-white\/40["']\s*:\s*["']text-black\/40["']/g, '"theme-text-faint"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']text-white\/60["']\s*:\s*["']text-black\/60["']/g, '"theme-text-muted"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']text-white\/80["']\s*:\s*["']text-black\/80["']/g, '"theme-text-base"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']text-white["']\s*:\s*["']text-black["']/g, '"theme-text-base"');
  
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']text-zinc-500["']\s*:\s*["']text-zinc-400["']/g, '"theme-text-muted"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']text-zinc-400["']\s*:\s*["']text-zinc-500["']/g, '"theme-text-muted"');

  // Borders
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']border-white\/5["']\s*:\s*["']border-black\/5["']/g, '"theme-border"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']border-zinc-800["']\s*:\s*["']border-slate-300["']/g, '"theme-border-dashed"');
  
  // Backgrounds Subtle
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']bg-white\/5["']\s*:\s*["']bg-black\/5["']/g, '"bg-black/5 dark:bg-white/5"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']bg-white\/10["']\s*:\s*["']bg-black\/10["']/g, '"bg-black/10 dark:bg-white/10"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']bg-white\/\\[0\.02\\]["']\s*:\s*["']bg-black\/\\[0\.02\\]["']/g, '"bg-black/[0.02] dark:bg-white/[0.02]"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']bg-white\/\[0\.02\]["']\s*:\s*["']bg-black\/\[0\.02\]["']/g, '"bg-black/[0.02] dark:bg-white/[0.02]"');

  // Focus
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']focus-visible:ring-offset-\[#030303\]["']\s*:\s*["']focus-visible:ring-offset-white["']/g, '"theme-focus"');
  content = content.replace(/focus-visible:ring-offset-white/g, 'theme-focus'); // A bit unsafe but let's try

  // Panels
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']border-zinc-800 bg-zinc-900\/20["']\s*:\s*["']border-slate-300 bg-slate-50["']/g, '"theme-panel"');
  content = content.replace(/theme === ["']dark["']\s*\?\s*["']bg-zinc-900\/20 border-white\/5["']\s*:\s*["']bg-white border-black\/10["']/g, '"theme-card"');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Refactored', filePath);
  }
}

walk(dir);
