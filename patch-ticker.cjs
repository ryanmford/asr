const fs = require('fs');
let code = fs.readFileSync('src/components/common/ASRLiveTicker.tsx', 'utf8');

code = code.replace(
  /formatFlagsWithSpace }/g,
  'formatFlagsWithSpace, getCombinedFlags }'
);

code = code.replace(
  /const athleteFlag = formatFlagsWithSpace\([\s\S]*?\.trim\(\);/g,
  'const athleteFlag = getCombinedFlags(item.athlete).trim();'
);

fs.writeFileSync('src/components/common/ASRLiveTicker.tsx', code);
