const fs = require('fs');
let code = fs.readFileSync('src/components/inspector/PlayerDetails.tsx', 'utf8');

code = code.replace(
  /formatFlagsWithSpace,/g,
  'formatFlagsWithSpace,\n  getCombinedFlags,'
);

code = code.replace(
  /formatFlagsWithSpace\(meta\.flag \|\| meta\.region\)/g,
  'getCombinedFlags(meta)'
);

fs.writeFileSync('src/components/inspector/PlayerDetails.tsx', code);
