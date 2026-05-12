const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/import \{ ThemeContext \} from ["']\.\.\/\.\.\/App["']/g, 'import { ThemeContext } from "../../theme-context"');
      content = content.replace(/import \{ ThemeContext \} from ["']\.\.\/App["']/g, 'import { ThemeContext } from "../theme-context"');
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('./src');
