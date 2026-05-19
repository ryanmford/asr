const fs = require('fs');
let content = fs.readFileSync('src/components/common/ASRPremiumButton.tsx', 'utf8');

content = content.replace(
  '      case "red":\n        return "text-red-400";',
  '      case "red":\n        return "text-red-600 dark:text-red-400";'
);
content = content.replace(
  '      case "gold":\n        return "text-amber-400";',
  '      case "gold":\n        return "text-amber-600 dark:text-amber-400";'
);
content = content.replace(
  '      case "blue":\n        return "text-blue-400";',
  '      case "blue":\n        return "text-blue-600 dark:text-blue-400";'
);
content = content.replace(
  '      default:\n        return "text-zinc-700 dark:text-zinc-300";',
  '      default:\n        return "text-zinc-900 dark:text-zinc-300";'
);
content = content.replace(
  '          : "bg-white text-zinc-900 shadow-xl shadow-black/5",',
  '          : `bg-white shadow-xl shadow-black/5 ${getTextColor()}`,'
);
fs.writeFileSync('src/components/common/ASRPremiumButton.tsx', content);
