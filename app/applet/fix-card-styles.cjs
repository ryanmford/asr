const fs = require('fs');
let content = fs.readFileSync('src/components/ASRListItems.tsx', 'utf8');

content = content.replace('isCompact ? "text-[10px]" : "text-[10px] ",', 'isCompact ? "text-[10px]" : "text-[10px] sm:text-[16px] lg:text-[20px]",');
content = content.replace('isCompact ? "text-[8px]" : "text-[8px] ",', 'isCompact ? "text-[8px]" : "text-[8px] sm:text-[11px] lg:text-[14px]",');
content = content.replace('isCompact\n                    ? "text-[13px]"\n                    : "text-[13px] ",', 'isCompact\n                    ? "text-[13px]"\n                    : "text-[13px] sm:text-[20px] lg:text-[26px] tracking-tight",');
content = content.replace('isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] font-bold",', 'isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] sm:text-[14px] lg:text-[16px] font-bold",');
content = content.replace('isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] font-bold",', 'isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] sm:text-[14px] lg:text-[16px] font-bold",');

fs.writeFileSync('src/components/ASRListItems.tsx', content);
