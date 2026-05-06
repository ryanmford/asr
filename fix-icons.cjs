const fs = require('fs');
let content = fs.readFileSync('src/components/ASRListItems.tsx', 'utf8');

content = content.replace('className={cn("w-5 h-5", !isCompact && " ")}', 'className={cn("w-5 h-5", !isCompact && " sm:w-6 sm:h-6 lg:w-8 lg:h-8")}');

fs.writeFileSync('src/components/ASRListItems.tsx', content);
