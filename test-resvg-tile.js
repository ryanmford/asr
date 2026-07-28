import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

async function run() {
  const res = await fetch('https://a.basemaps.cartocdn.com/dark_all/13/2411/3079.png');
  const buffer = await res.arrayBuffer();
  const dataUri = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
  
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="1200" height="630" fill="#09090b" />
    <g opacity="0.7">
      <image x="0" y="0" width="1024" height="1024" href="${dataUri}" preserveAspectRatio="none" />
    </g>
    <text x="100" y="300" fill="white" font-family="sans-serif" font-size="48">Hello</text>
  </svg>`;
  
  const resvg = new Resvg(svg, {
    background: '#09090b',
    fitTo: { mode: 'width', value: 1200 },
  });
  
  const pngBuffer = resvg.render().asPng();
  console.log('PNG size:', pngBuffer.length);
}
run();
