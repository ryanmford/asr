const fs = require('fs');
let code = fs.readFileSync('src/components/list/ASRRankList.tsx', 'utf8');
code = code.replace(/flag=\{\s+item\.flag \|\|[\s\S]+?\}\s+stats=/g, 'flag={getCombinedFlags(item, meta)}\n                stats=');
fs.writeFileSync('src/components/list/ASRRankList.tsx', code);
