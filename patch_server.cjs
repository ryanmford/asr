const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');

// Remove red line
serverTs = serverTs.replace(/\{\s*type:\s*'div',\s*props:\s*\{\s*style:\s*\{\s*width:\s*'6px',\s*height:\s*'48px',\s*backgroundColor:\s*'#dc2626',\s*marginRight:\s*'24px',?\s*\},\s*\},\s*\},\s*/g, '');

// Remove logo box
serverTs = serverTs.replace(/\{\s*type:\s*'div',\s*props:\s*\{\s*style:\s*\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*justifyContent:\s*'center',\s*width:\s*'60px',\s*height:\s*'60px',\s*backgroundColor:\s*'#2563eb',\s*borderRadius:\s*'12px',\s*marginRight:\s*'24px',?\s*\},\s*children:\s*\[\s*\{\s*type:\s*'div',\s*props:\s*\{\s*style:\s*\{\s*width:\s*'30px',\s*height:\s*'30px',\s*border:\s*'4px solid white',\s*borderRadius:\s*'50%',\s*borderTopColor:\s*'transparent',\s*transform:\s*'rotate\(45deg\)',?\s*\},\s*\},\s*\}\s*,\s*\],\s*\},\s*\},\s*/g, '');

fs.writeFileSync('server.ts', serverTs);
