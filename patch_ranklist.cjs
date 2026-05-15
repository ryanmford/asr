const fs = require('fs');
let code = fs.readFileSync('src/components/list/ASRRankList.tsx', 'utf8');
code = code.replace(/<div\s+key={virtualRow\.key}\s+data-[^>]+>/, '<div key={`${pKey}-${i}`} data-index={i}>');
fs.writeFileSync('src/components/list/ASRRankList.tsx', code);
