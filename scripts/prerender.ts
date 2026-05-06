import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getPageMeta } from '../src/meta-injector.ts';
import { normalizeName, CONFIG } from '../src/lib/asr-utils.ts';
import { computeAllState } from '../src/lib/asr-data-compute.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;
const GIDS = CONFIG.SHEET_GIDS;

async function fetchSheets() {
  const getUrl = (gid: string) => `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  
  console.log('Fetching Google Sheets data...');
  const [mensCsv, womensCsv, liveCsv, setsCsv] = await Promise.all([
    fetch(getUrl(GIDS.MENS)).then(r => r.text()),
    fetch(getUrl(GIDS.WOMENS)).then(r => r.text()),
    fetch(getUrl(GIDS.LIVE)).then(r => r.text()),
    fetch(getUrl(GIDS.SETS)).then(r => r.text()),
  ]);

  return computeAllState({
    rM: mensCsv,
    rF: womensCsv,
    rLive: liveCsv,
    rSet: setsCsv,
    hasTotalError: false,
    hasPartialError: false
  });
}

function getOgImageSvg(title: string, desc: string) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        backgroundColor: '#09090b',
        color: 'white',
        fontFamily: 'Inter',
        padding: '80px',
        backgroundImage: 'linear-gradient(135deg, #09090b 0%, #171720 100%)',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-150px',
              right: '-150px',
              width: '600px',
              height: '600px',
              backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              opacity: 0.15,
              filter: 'blur(80px)',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: '-150px',
              left: '-150px',
              width: '500px',
              height: '500px',
              backgroundImage: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
              borderRadius: '50%',
              opacity: 0.1,
              filter: 'blur(80px)',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              zIndex: 10,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '20px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#2563eb', // Brand color
                          borderRadius: '12px',
                          marginRight: '24px',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                width: '30px',
                                height: '30px',
                                border: '4px solid white',
                                borderRadius: '50%',
                                borderTopColor: 'transparent',
                                transform: 'rotate(45deg)',
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 48,
                          fontWeight: 700,
                          color: '#e4e4e7',
                          letterSpacing: '-0.02em',
                        },
                        children: 'APEX SPEED RUN',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 88,
                          fontWeight: 700,
                          marginBottom: '24px',
                          lineHeight: 1.05,
                          color: '#ffffff',
                          letterSpacing: '-0.03em',
                          maxWidth: '1000px',
                        },
                        children: title,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 42,
                          color: '#a1a1aa',
                          maxWidth: '850px',
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em',
                        },
                        children: desc,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  } as any;
}

async function generateOgImage(title: string, desc: string, outputPath: string, fontData: Buffer) {
  const svg = await satori(getOgImageSvg(title, desc), {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, {
    background: '#09090b',
    fitTo: { mode: 'width', value: 1200 },
  });
  
  const pngBuffer = resvg.render().asPng();
  await fs.writeFile(outputPath, pngBuffer);
}

function injectMeta(html: string, title: string, desc: string, ogImageUrl: string) {
  return html
    .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${desc}">`)
    .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImageUrl}">`)
    .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}">`)
    .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${desc}">`)
    .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImageUrl}">`);
}

async function run() {
  console.log('Starting prerender...');
  
  const fontData = await fs.readFile(
    path.join(ROOT, 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-700-normal.woff')
  );

  const baseHtmlUrl = path.join(ROOT, 'dist', 'index.html');
  const baseHtml = await fs.readFile(baseHtmlUrl, 'utf8');
  
  const data = await fetchSheets();
  
  const ogDir = path.join(ROOT, 'dist', 'og');
  await fs.mkdir(ogDir, { recursive: true });

  const BASE_URL = 'https://apexspeedrun.com';
  
  const players = [...(data.data || []), ...(data.openData || [])];
  const uniquePlayers = new Map();
  players.forEach(p => {
    if (p.name) uniquePlayers.set(normalizeName(p.name), p);
  });
  
  console.log(`Pre-rendering ${uniquePlayers.size} players...`);
  
  for (const [slug, player] of uniquePlayers.entries()) {
    const title = `${player.name.toUpperCase()} | ASR Player Profile`;
    const rating = player.rating ? player.rating.toFixed(2) : '0.00';
    const gym = player.country && player.country !== "UNKNOWN LOCATION" ? player.country : 'Unknown Location';
    const rank = player.openRank || player.allTimeRank || 'UR';
    const desc = `Open Season Stats: ${rating} Rating | Open Rank: ${rank} | Gym: ${gym}`;
    
    // Gen OG Image
    const ogFilename = `player-${slug}.png`;
    await generateOgImage(title, desc, path.join(ogDir, ogFilename), fontData);
    
    // Inj HTML
    const pageHtml = injectMeta(baseHtml, title, desc, `${BASE_URL}/og/${ogFilename}`);
    
    // Write HTML
    const playerDir = path.join(ROOT, 'dist', 'players', slug);
    await fs.mkdir(playerDir, { recursive: true });
    await fs.writeFile(path.join(playerDir, 'index.html'), pageHtml);
  }
  
  console.log(`Pre-rendering ${Object.keys(data.cMet || {}).length} courses...`);
  
  for (const courseStr of Object.keys(data.cMet || {})) {
    const slug = normalizeName(courseStr);
    const courseInfo = data.cMet[courseStr] || {};
    const title = `${courseStr.toUpperCase()} | ASR Map`;
    
    let totalClears = 0;
    let mBest = Infinity;
    let fBest = Infinity;
    
    if (data.lbAT) {
      const mData = data.lbAT.M?.[courseStr] || {};
      const fData = data.lbAT.F?.[courseStr] || {};
      const mTimes = Object.values(mData) as number[];
      const fTimes = Object.values(fData) as number[];
      totalClears = mTimes.length + fTimes.length;
      if (mTimes.length) mBest = Math.min(...mTimes);
      if (fTimes.length) fBest = Math.min(...fTimes);
    }
    
    const best = Math.min(mBest, fBest);
    const wrStr = best !== Infinity ? `${best.toFixed(2)}s` : 'N/A';
    const locStr = courseInfo.city ? `${courseInfo.city.toUpperCase()}` : courseInfo.country ? `${courseInfo.country.toUpperCase()}` : 'UNKNOWN LOCATION';
    
    const desc = `Fastest Time: ${wrStr} | Total Clears: ${totalClears} | Location: ${locStr}`;
    
    // Gen OG Image
    const ogFilename = `map-${slug}.png`;
    await generateOgImage(title, desc, path.join(ogDir, ogFilename), fontData);
    
    // Inj HTML
    const pageHtml = injectMeta(baseHtml, title, desc, `${BASE_URL}/og/${ogFilename}`);
    
    // Write HTML
    const mapDir = path.join(ROOT, 'dist', 'map', slug);
    await fs.mkdir(mapDir, { recursive: true });
    await fs.writeFile(path.join(mapDir, 'index.html'), pageHtml);
  }

  console.log('Prerendering completed!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
