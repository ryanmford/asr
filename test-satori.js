import satori from 'satori';
import fs from 'fs';

function toCodePoint(unicodeSurrogates) {
  var r = [], c = 0, p = 0, i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((65536 + ((p - 55296) << 10) + (c - 56320)).toString(16));
      p = 0;
    } else if (55296 <= c && c <= 56319) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.filter(cp => cp !== 'fe0f').join('-');
}

async function run() {
  const svg = await satori(
    { type: 'div', props: { children: 'Hello 🇺🇸 🔥', style: { display: 'flex', fontFamily: 'Inter' } } },
    {
      width: 200, height: 100,
      fonts: [
        { name: 'Inter', data: fs.readFileSync('./node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'), weight: 700, style: 'normal' }
      ],
      loadAdditionalAsset: async (code, segment) => {
        if (code === 'emoji') {
          const cp = toCodePoint(segment);
          const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${cp}.svg`;
          console.log('Fetching', url);
          const res = await fetch(url);
          if (res.ok) {
            const text = await res.text();
            // encode to base64
            return `data:image/svg+xml;base64,${Buffer.from(text).toString('base64')}`;
          }
        }
        return '';
      }
    }
  );
  console.log(svg.includes('image href="data:image/svg+xml;base64,') ? 'SUCCESS' : 'FAILED');
}
run();
