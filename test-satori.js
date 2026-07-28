import satori from 'satori';
import fs from 'fs';
import { Resvg } from '@resvg/resvg-js';

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
  const mapTiles = [
    {
      x: 0, y: 0,
      dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVQI12P8//8/AwMDEwMDAwMDAwMAUAAH/b5xJ9AAAAAASUVORK5CYII=' // 2x2 red pixel
    }
  ];
  
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          color: '#ffffff',
          fontFamily: 'Inter',
          padding: '60px 80px',
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                opacity: 0.7,
              },
              children: mapTiles.map(t => ({
                type: 'img',
                props: {
                  src: t.dataUri,
                  style: {
                    position: 'absolute',
                    left: t.x,
                    top: t.y,
                    width: 1024,
                    height: 1024,
                  }
                }
              }))
            }
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', zIndex: 10 },
              children: 'Hello 🇺🇸 🔥'
            }
          }
        ]
      }
    },
    {
      width: 1200, height: 630,
      fonts: [
        { name: 'Inter', data: fs.readFileSync('./node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'), weight: 700, style: 'normal' }
      ],
      loadAdditionalAsset: async (code, segment) => {
        if (code === 'emoji') {
          const cp = toCodePoint(segment);
          const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${cp}.svg`;
          try {
            const res = await fetch(url);
            if (res.ok) {
              const text = await res.text();
              return `data:image/svg+xml;base64,${Buffer.from(text).toString('base64')}`;
            }
          } catch (e) {
          }
        }
        return '';
      }
    }
  );
  
  const resvg = new Resvg(svg, {
    background: '#09090b',
    fitTo: { mode: 'width', value: 1200 },
  });
  
  const pngBuffer = resvg.render().asPng();
  fs.writeFileSync('test.png', pngBuffer);
  console.log('Done, length:', pngBuffer.length);
}
run();
