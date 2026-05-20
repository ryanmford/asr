const fs = require('fs');

let code = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

code = code.replace(
  /cn, formatFlagsWithSpace, fixCountryEntity /, 
  "cn, formatFlagsWithSpace, fixCountryEntity, getCombinedFlags "
);

code = code.replace(
  /const pFlag = pObj[^`]*?(?=const athleteName)/,
  `const pFlagStr = pObj ? getCombinedFlags(pObj) : "";
       const pFlagFmt = pFlagStr ? \`\${pFlagStr.trim()} \` : "";
       `
);

code = code.replace(
  /const cFlag = targetCourse[^`]*?(?=\/\/ Calculate Points)/,
  `const cFlagStr = getCombinedFlags(targetCourse);
       const cFlagFmt = cFlagStr ? \`\${cFlagStr.trim()} \` : "";

       `
);

code = code.replace(
  /displayName: topPlayer\.townFlag[\s\S]+?\? `\$\{formatFlagsWithSpace[\s\S]+?\} \$\{topPlayer\.name\}` : topPlayer\.name,/,
  'displayName: getCombinedFlags(topPlayer) ? `${getCombinedFlags(topPlayer).trim()} ${topPlayer.name}` : topPlayer.name,'
);

code = code.replace(
  /displayName: topCourse\.flag\s+\?\s+`\$\{formatFlagsWithSpace[\s\S]+?\} \$\{topCourse\.name\}` : topCourse\.name,/,
  'displayName: getCombinedFlags(topCourse) ? `${getCombinedFlags(topCourse).trim()} ${topCourse.name}` : topCourse.name,'
);

fs.writeFileSync('src/components/views/HomeView.tsx', code);
