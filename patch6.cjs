const fs = require('fs');
let content = fs.readFileSync('src/components/common/ASRPremiumButton.tsx', 'utf8');

content = content.replace(
  /"bg-zinc-950\/90 group-hover:bg-zinc-900\/90"\)/g,
  'color === "red" ? "bg-red-950/40 group-hover:bg-red-900/40" : color === "blue" ? "bg-blue-950/40 group-hover:bg-blue-900/40" : "bg-zinc-950/90 group-hover:bg-zinc-900/90")'
);

content = content.replace(
  /"bg-white group-hover:bg-zinc-50"\)/g,
  'color === "red" ? "bg-red-50 group-hover:bg-red-100" : color === "blue" ? "bg-blue-50 group-hover:bg-blue-100" : "bg-white group-hover:bg-zinc-50")'
);

fs.writeFileSync('src/components/common/ASRPremiumButton.tsx', content);
