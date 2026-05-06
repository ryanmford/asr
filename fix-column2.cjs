const fs = require('fs');
let content = fs.readFileSync('src/components/ASRListItems.tsx', 'utf8');

content = content.replace('isCompact ? "min-w-[50px]" : "min-w-[50px] ",', 'isCompact ? "min-w-[50px]" : "min-w-[50px] sm:min-w-[80px] lg:min-w-[120px]",');

fs.writeFileSync('src/components/ASRListItems.tsx', content);
