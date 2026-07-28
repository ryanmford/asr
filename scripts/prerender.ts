import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getPageMeta } from '../src/meta-injector.ts';
import { normalizeName, createSlug, CONFIG, getCombinedFlags, toTitleCase } from '../src/lib/asr-utils.ts';
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

function getOgImageSvg(title: string, desc: string, type?: 'player' | 'course', stats?: {value: string, label: string}[], mapTiles?: any[]) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        backgroundColor: '#09090b',
        color: '#ffffff',
        fontFamily: 'Inter',
        padding: '60px 80px',
        border: '12px solid #27272a',
        position: 'relative',
        overflow: 'hidden',
      },
      children: [
        ...(mapTiles && mapTiles.length > 0 ? [
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
                opacity: 0.9, // Increased opacity to make map more visible
              },
              children: mapTiles.map(t => ({
                type: 'img',
                props: {
                  src: t.dataUri,
                  width: 256,
                  height: 256,
                  style: {
                    position: 'absolute',
                    left: t.x,
                    top: t.y,
                    width: 256,
                    height: 256,
                  }
                }
              }))
            }
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: 'linear-gradient(to right, rgba(9, 9, 11, 0.95) 0%, rgba(9, 9, 11, 0.7) 40%, rgba(9, 9, 11, 0.1) 100%)',
              }
            }
          }
        ] : []),
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
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 36,
                          fontWeight: 700,
                          color: '#ffffff',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
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
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    width: '100%',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          maxWidth: (stats && stats.length > 0) ? '650px' : '1050px',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: (stats && stats.length > 0) ? 72 : 96,
                                fontWeight: 700,
                                marginBottom: '32px',
                                lineHeight: 1.1,
                                color: '#ffffff',
                                letterSpacing: '-0.04em',
                                textTransform: 'uppercase',
                              },
                              children: title,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                display: 'flex',
                                alignItems: 'center',
                              },
                              children: [
                                {
                                  type: 'div',
                                  props: {
                                    style: {
                                      fontSize: (stats && stats.length > 0) ? 32 : 40,
                                      color: '#a1a1aa',
                                      lineHeight: 1.2,
                                      letterSpacing: '-0.02em',
                                      fontWeight: 700,
                                    },
                                    children: desc,
                                  },
                                }
                              ]
                            }
                          },
                        ],
                      },
                    },
                    (stats && stats.length > 0) ? {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: (stats.length > 2) ? 'row' : 'column',
                          flexWrap: (stats.length > 2) ? 'wrap' : 'nowrap',
                          alignItems: 'flex-end',
                          justifyContent: 'flex-end',
                          gap: (stats.length > 2) ? '0px' : '40px',
                          width: (stats.length > 2) ? '400px' : 'auto',
                        },
                        children: stats.map((stat, i) => ({
                           type: 'div',
                           props: {
                             style: {
                               display: 'flex',
                               flexDirection: 'column',
                               alignItems: (stats.length > 2) ? 'flex-start' : 'flex-end',
                               textAlign: (stats.length > 2) ? 'left' : 'right',
                               width: (stats.length > 2) ? '50%' : 'auto',
                               marginBottom: (stats.length > 2 && i < 2) ? '32px' : '0px',
                             },
                             children: [
                               {
                                 type: 'div',
                                 props: {
                                   style: {
                                     fontSize: (stats.length > 2) ? 64 : 100,
                                     fontWeight: 700,
                                     color: '#ffffff',
                                     lineHeight: 1,
                                     letterSpacing: '-0.05em',
                                   },
                                   children: stat.value,
                                 }
                               },
                               {
                                 type: 'div',
                                 props: {
                                   style: {
                                     fontSize: (stats.length > 2) ? 20 : 24,
                                     fontWeight: 700,
                                     color: '#a1a1aa',
                                     textTransform: 'uppercase',
                                     letterSpacing: '0.05em',
                                     marginTop: (stats.length > 2) ? '8px' : '16px',
                                   },
                                   children: stat.label,
                                 }
                               }
                             ]
                           }
                        }))
                      }
                    } : null
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
      ],
    },
  } as any;
}

function toCodePoint(unicodeSurrogates: string) {
  const r = [];
  let c = 0, p = 0, i = 0;
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

async function generateOgImage(title: string, desc: string, outputPath: string, fontData: Buffer, type?: 'player' | 'course', stats?: {value: string, label: string}[], mapTiles?: any[]) {
  const svg = await satori(getOgImageSvg(title, desc, type, stats, mapTiles), {
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
          // ignore
        }
      }
      return '';
    }
  });

  const resvg = new Resvg(svg, {
    background: '#09090b',
    fitTo: { mode: 'width', value: 1200 },
  });
  
  const pngBuffer = resvg.render().asPng();
  await fs.mkdir(path.dirname(outputPath), { recursive: true }); await fs.writeFile(outputPath, pngBuffer);
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

const tileCache = new Map<string, string>();

async function fetchTile(url: string) {
  if (tileCache.has(url)) return tileCache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
    tileCache.set(url, dataUri);
    return dataUri;
  } catch (e) {
    return null;
  }
}

async function getMapTiles(coords: [number, number] | null) {
  if (!coords) return [];
  const [lat, lon] = coords;
  const Z = 13;
  const centerTx = (lon + 180) / 360 * Math.pow(2, Z);
  const centerTy = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, Z);
  
  const TILE_SIZE = 256;
  const svgX = centerTx * TILE_SIZE - 600;
  const svgY = centerTy * TILE_SIZE - 315;
  
  const startTx = Math.floor(svgX / TILE_SIZE);
  const endTx = Math.floor((svgX + 1200) / TILE_SIZE);
  
  const startTy = Math.floor(svgY / TILE_SIZE);
  const endTy = Math.floor((svgY + 630) / TILE_SIZE);
  
  const tiles = [];
  for (let tx = startTx; tx <= endTx; tx++) {
    for (let ty = startTy; ty <= endTy; ty++) {
      tiles.push({
        url: `https://a.basemaps.cartocdn.com/dark_nolabels/${Z}/${tx}/${ty}.png`,
        x: tx * TILE_SIZE - svgX,
        y: ty * TILE_SIZE - svgY
      });
    }
  }
  
  for (const t of tiles) {
    (t as any).dataUri = await fetchTile(t.url);
  }
  
  return tiles.filter((t: any) => !!t.dataUri);
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
  
  const players = [...(data.openData || []), ...(data.data || [])];
  const uniquePlayers = new Map();
  players.forEach(p => {
    if (p.name) uniquePlayers.set(createSlug(p.name), p);
  });
  
  console.log(`Pre-rendering ${uniquePlayers.size} players...`);
  
  for (const [slug, player] of uniquePlayers.entries()) {
    const flags = getCombinedFlags(player).trim();
    const titlePrefix = flags ? `${flags} ` : '';
    const title = `${titlePrefix}${player.name.toUpperCase()}`;
    const rating = player.rating ? player.rating.toFixed(2) : '0.00';
    const rank = player.allTimeRank || player.openRank || 'UR';
    
    const coursesCount = player.courses || 0;
    const runsCount = player.runs || 0;
    const winsCount = player.wins || 0;
    const firesCount = player.allTimeFireCount || 0;
    
    let desc = `Courses: ${coursesCount} | Runs: ${runsCount}`;
    if (winsCount > 0) desc += ` | Wins: ${winsCount}`;
    if (firesCount > 0) desc += ` | 🔥 ${firesCount}`;
    
    const ogTitle = `${titlePrefix}${player.name.toUpperCase()}`;
    const ogFileName = `player-${slug}.png`;
    const ogFilePath = path.join(ogDir, ogFileName);
    
    const stats = [];
    stats.push({ value: rating, label: 'LQ' });
    stats.push({ value: rank === 'UR' ? 'UR' : `#${rank}`, label: 'RANK' });
    
    const completedCourses = [];
    const allCourses = Object.keys(data.cMet || {});
    for (const c of allCourses) {
      if (data.lbAT?.M?.[c]?.[player.name] || data.lbAT?.F?.[c]?.[player.name] || data.lbSeason26?.M?.[c]?.[player.name] || data.lbSeason26?.F?.[c]?.[player.name]) {
        completedCourses.push(c);
      }
    }
    const randCourse = completedCourses.length > 0 ? completedCourses[Math.floor(Math.random() * completedCourses.length)] : null;
    const mapTiles = await getMapTiles(randCourse && data.cMet[randCourse] ? data.cMet[randCourse].parsedCoords : null);
    
    await generateOgImage(ogTitle, desc, ogFilePath, fontData, 'player', stats, mapTiles);
    
    const ogImageUrl = `${BASE_URL}/og/${ogFileName}`;
    
    const pageHtml = injectMeta(baseHtml, title, desc, ogImageUrl);
    
    const playerDir = path.join(ROOT, 'dist', 'players', slug);
    await fs.mkdir(playerDir, { recursive: true });
    await fs.writeFile(path.join(playerDir, 'index.html'), pageHtml);
  }
  
  console.log(`Pre-rendering ${Object.keys(data.cMet || {}).length} courses...`);
  
  for (const courseStr of Object.keys(data.cMet || {})) {
    const slug = createSlug(courseStr);
    const courseInfo = data.cMet[courseStr] || {};
    const flags = getCombinedFlags(courseInfo).trim();
    const titlePrefix = flags ? `${flags} ` : '';
    const title = `${titlePrefix}${courseStr.toUpperCase()} SPEED RUN`;
    
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
    
    const locStr = courseInfo.city ? toTitleCase(courseInfo.city) : courseInfo.country ? toTitleCase(courseInfo.country) : 'Secret Location';
    const totalRunsCount = courseInfo.totalAllTimeRuns || courseInfo.totalRuns || totalClears;
    const desc = `Runs: ${totalRunsCount} | 📍 ${locStr}`;
    
    const ogTitle = `${titlePrefix}${courseStr.toUpperCase()} SPEED RUN`;
    const ogFileName = `course-${slug}.png`;
    const ogFilePath = path.join(ogDir, ogFileName);
    
    const stats = [];
    stats.push({ value: mBest !== Infinity ? mBest.toFixed(2) : '--', label: "MEN'S WR" });
    stats.push({ value: fBest !== Infinity ? fBest.toFixed(2) : '--', label: "WOMEN'S WR" });
    
    const mapTiles = await getMapTiles(courseInfo.parsedCoords || null);
    
    await generateOgImage(ogTitle, desc, ogFilePath, fontData, 'course', stats, mapTiles);
    
    const ogImageUrl = `${BASE_URL}/og/${ogFileName}`;
    
    const pageHtml = injectMeta(baseHtml, title, desc, ogImageUrl);
    
    const courseDir = path.join(ROOT, 'dist', 'courses', slug);
    await fs.mkdir(courseDir, { recursive: true });
    await fs.writeFile(path.join(courseDir, 'index.html'), pageHtml);
  }

  console.log('Prerendering completed!');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
