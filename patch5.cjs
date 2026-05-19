const fs = require('fs');
let content = fs.readFileSync('src/components/common/ASRPremiumButton.tsx', 'utf8');

const regex = /  theme === "dark"\s*\n\s*\? \(color === "gold" \? "bg-\[\#332005\]\/90 group-hover:bg-\[\#402808\]\/90" : "bg-zinc-950\/90 group-hover:bg-zinc-900\/90"\)\s*\n\s*: \(color === "gold" \? "bg-amber-50 group-hover:bg-amber-100" : "bg-white group-hover:bg-zinc-50"\),/m;

const newStr = '  theme === "dark"\n  ? (color === "gold" ? "bg-[#332005]/90 group-hover:bg-[#402808]/90" : color === "red" ? "bg-red-950/40 group-hover:bg-red-900/40" : color === "blue" ? "bg-blue-950/40 group-hover:bg-blue-900/40" : "bg-zinc-950/90 group-hover:bg-zinc-900/90")\n  : (color === "gold" ? "bg-amber-50 group-hover:bg-amber-100" : color === "red" ? "bg-red-50 group-hover:bg-red-100" : color === "blue" ? "bg-blue-50 group-hover:bg-blue-100" : "bg-white group-hover:bg-zinc-50"),';

content = content.replace(regex, newStr);
fs.writeFileSync('src/components/common/ASRPremiumButton.tsx', content);
