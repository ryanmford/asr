const fs = require('fs');
let code = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

code = code.replace(
  /const pFlag = pObj[\s\S]*?(?=const athleteName)/,
  `const pFlagStr = pObj ? getCombinedFlags(pObj) : "";
       const pFlagFmt = pFlagStr ? \`\${pFlagStr.trim()} \` : "";
       `
);

code = code.replace(
  /const cFlag = targetCourse[\s\S]*?(?=\/\/ Calculate Points)/,
  `const cFlagStr = getCombinedFlags(targetCourse);
       const cFlagFmt = cFlagStr ? \`\${cFlagStr.trim()} \` : "";

       `
);

fs.writeFileSync('src/components/views/HomeView.tsx', code);
