const fs = require('fs');
let content = fs.readFileSync('src/components/common/ASRIntroOverlay.tsx', 'utf8');

content = content.replace(/import \{ ASRPremiumButton \} from "\.\/ASRPremiumButton";/g, 'import { ASRStandardButton } from "./ASRStandardButton";');
content = content.replace(/<ASRPremiumButton/g, '<ASRStandardButton');
content = content.replace(/<\/ASRPremiumButton>/g, '</ASRStandardButton>');

fs.writeFileSync('src/components/common/ASRIntroOverlay.tsx', content);
