const fs = require('fs');
let code = fs.readFileSync('src/components/ASRListItems.tsx', 'utf8');
code = code.replace(/isCompact = false, onHover,/, 'isCompact = false, onHover, isHighlighted,');
fs.writeFileSync('src/components/ASRListItems.tsx', code);
console.log('Fixed file');
