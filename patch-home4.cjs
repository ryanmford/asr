const fs = require('fs');
let code = fs.readFileSync('src/components/views/HomeView.tsx', 'utf8');

code = code.replace(
  /const athleteFlag = formatFlagsWithSpace\([\s\S]*?\.trim\(\);/,
  'const athleteFlag = getCombinedFlags(item.athlete).trim();'
);

fs.writeFileSync('src/components/views/HomeView.tsx', code);
