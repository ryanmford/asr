const fs = require('fs');
let code = fs.readFileSync('src/components/views/ASRWallOfFame.tsx', 'utf8');

code = code.replace(
  /formatFlagsWithSpace,/g,
  'formatFlagsWithSpace,\n  getCombinedFlags,'
);

code = code.replace(
  /const flags = formatFlagsWithSpace\([\s\S]*?\);\n/g,
  'const flags = getCombinedFlags(a);\n'
);

fs.writeFileSync('src/components/views/ASRWallOfFame.tsx', code);
