const fs = require('fs');
let content = fs.readFileSync('src/components/ASRListItems.tsx', 'utf8');

content = content.replace('isCompact ? "text-[10px]" : "text-[10px] ",', 'isCompact ? "text-[10px]" : "text-[10px] sm:text-[18px] lg:text-[22px]",');
content = content.replace('isCompact ? "text-[8px]" : "text-[8px] ",', 'isCompact ? "text-[8px]" : "text-[8px] sm:text-[12px] lg:text-[16px]",');
content = content.replace('isCompact\n                    ? "text-[13px]"\n                    : "text-[13px] ",', 'isCompact\n                    ? "text-[13px]"\n                    : "text-[13px] sm:text-[24px] lg:text-[32px] tracking-tight",');
content = content.replace('isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] font-bold",', 'isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] sm:text-[14px] lg:text-[18px] font-bold",');
content = content.replace('isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] font-bold",', 'isCompact\n                        ? "text-[11px] font-bold"\n                        : "text-[11px] sm:text-[14px] lg:text-[18px] font-bold",');
content = content.replace('isCompact ? "py-3 pl-3 pr-1.5 rounded-[1.25rem] border h-auto min-h-[64px]"', 'isCompact ? "py-3 pl-3 pr-1.5 rounded-[1.25rem] border h-auto min-h-[64px]"');
content = content.replace(': "py-3 pl-3 pr-1.5 rounded-[1.25rem] border h-auto min-h-[64px] sm:min-h-[80px] ",', ': "py-3 sm:py-5 lg:py-6 pl-3 sm:pl-6 lg:pl-8 pr-1.5 sm:pr-4 rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border h-auto min-h-[64px] sm:min-h-[80px] lg:min-h-[100px] ",');

// make the rank icons a bit bigger too
content = content.replace('isCompact ? "gap-2" : "gap-2 ",', 'isCompact ? "gap-2" : "gap-2 sm:gap-4 lg:gap-6",');
content = content.replace('isCompact ? "gap-1" : "gap-1 ",', 'isCompact ? "gap-1" : "gap-1 sm:gap-2",');

fs.writeFileSync('src/components/ASRListItems.tsx', content);
