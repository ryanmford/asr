import express from "express";
import { createServer as createViteServer } from "vite";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { getPageMeta } from './src/meta-injector.ts';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import crypto from 'crypto';

class OgImageCache {
  private cache = new Map<string, Buffer>();
  private readonly maxKeys = 500;

  get(title: string, desc: string): Buffer | null {
    const key = this.hash(title, desc);
    if (this.cache.has(key)) {
      const buffer = this.cache.get(key)!;
      // Refresh key order (LRU behavior)
      this.cache.delete(key);
      this.cache.set(key, buffer);
      return buffer;
    }
    return null;
  }

  set(title: string, desc: string, buffer: Buffer): void {
    const key = this.hash(title, desc);
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxKeys) {
      // LRU eviction: the Map.keys().next().value returns the oldest inserted element
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, buffer);
  }

  private hash(title: string, desc: string): string {
    return crypto
      .createHash('sha256')
      .update(`${title}||${desc}`)
      .digest('hex');
  }
}

const ogCache = new OgImageCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1DcLZyAO2QZij_176vsC7_rWWTVbxwt8X9Jw7YWM_7j4';


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
  
  const TILE_SIZE = 1024;
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
                opacity: 0.9,
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

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  const PORT = 3000;

  // Set Service-Worker-Allowed header for service workers
  app.use((req, res, next) => {
    if (req.path.endsWith('service-worker.js') || req.path.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
    }
    next();
  });

  // Proxy route for Google Sheets to avoid CORS
  app.get('/api/proxy-sheet', async (req, res) => {
    const { gid, cb } = req.query;
    if (!gid) return res.status(400).send('Missing gid');
    
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}&cb=${cb || Date.now()}`;
      
      let response;
      let retries = 3;
      while (retries > 0) {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          }
        });
        if (response.ok) break;
        retries--;
        if (retries > 0) await new Promise(r => setTimeout(r, 1000));
      }
      
      if (!response || !response.ok) {
        const status = response ? response.status : 'Unknown';
        console.error(`Google Sheets final response: ${status}`);
        throw new Error(`Google Sheets responded with ${status}`);
      }
      
      const data = await response.text();
      res.header('Content-Type', 'text/csv');
      res.send(data);
    } catch (error) {
      console.error('Proxy Fetch Error:', error);
      res.status(500).send('Failed to fetch sheet data');
    }
  });

  // Generate Dynamic OG Images
  app.get('/api/og.png', async (req, res) => {
    try {
      let title = (req.query.title as string) || 'Apex Speed Run';
      let desc = (req.query.desc as string) || 'Global Parkour Leaderboards and Course Directory';
      
      const reqPath = req.query.path as string;
      const reqQuery = req.query.query as string;
      
      let type: 'player' | 'course' | undefined;
      let stats: {value: string, label: string}[] | undefined;
      let mapTiles: any[] = [];
      
      if (reqPath) {
        const searchParams = new URLSearchParams(reqQuery || "");
        const meta = await getPageMeta(reqPath, searchParams);
        title = meta.title;
        desc = meta.description;
        type = meta.ogType;
        stats = meta.ogStats;
        if (meta.ogMapCoords) {
           mapTiles = await getMapTiles(meta.ogMapCoords);
        }
      }

      const cachedBuffer = ogCache.get(title, desc + JSON.stringify(stats));
      if (cachedBuffer) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(cachedBuffer);
      }

      const fontData = await fs.readFile(
        path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-700-normal.woff')
      );

      const svg = await satori(
        getOgImageSvg(title, desc, type, stats, mapTiles),
        {
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
        }
      );

      const resvg = new Resvg(svg, {
        background: '#09090b',
        fitTo: { mode: 'width', value: 1200 },
      });

      const pngBuffer = resvg.render().asPng();
      ogCache.set(title, desc + JSON.stringify(stats), pngBuffer);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(pngBuffer);
    } catch (error) {
      console.error('OG Image Error:', error);
      res.status(500).send(error.stack || error.toString());
    }
  });


  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      // Prevent returning HTML for missing static files (images, css, js)
      if (req.path.match(/\.(png|jpe?g|gif|svg|ico|css|js|map|woff2?|ttf|eot)$/i)) {
        return res.status(404).end();
      }
      try {
        const url = req.originalUrl;
        let template = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const searchParams = new URLSearchParams(req.query as any);
        const meta = await getPageMeta(req.path, searchParams);
        
        const baseUrl = req.headers.host && req.headers.host.includes('localhost') ? 'http://localhost:3000' : 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'apexspeedrun.com');
        const currentUrl = `${baseUrl}${req.originalUrl}`;
        const ogImageUrl = `${baseUrl}/api/og.png?path=${encodeURIComponent(req.path)}&query=${encodeURIComponent(searchParams.toString())}`;
        const escapedOgImageUrl = ogImageUrl.replace(/&/g, '&amp;');
        template = template
          .replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
          .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${meta.description}">`)
          .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${meta.title}">`)
          .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${meta.description}">`)
          .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${currentUrl}">`)
          .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapedOgImageUrl}">`)
          .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${meta.title}">`)
          .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${meta.description}">`)
          .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapedOgImageUrl}">`);
          
        if (meta.initialData) {
          template = template.replace('</head>', `
            <script>
              window.__INITIAL_DATA__ = ${JSON.stringify(meta.initialData).replace(/</g, '\\u003c')};
            </script>
          </head>
          `);
        }
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false })); // Disable index fallback from static
    
    app.get('*', async (req, res, next) => {
      // Prevent returning HTML for missing static files (images, css, js)
      if (req.path.match(/\.(png|jpe?g|gif|svg|ico|css|js|map|woff2?|ttf|eot)$/i)) {
        return res.status(404).end();
      }
      try {
        let template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const searchParams = new URLSearchParams(req.query as any);
        const meta = await getPageMeta(req.path, searchParams);
        
        const baseUrl = req.headers.host && req.headers.host.includes('localhost') ? 'http://localhost:3000' : 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'apexspeedrun.com');
        const currentUrl = `${baseUrl}${req.originalUrl}`;
        const ogImageUrl = `${baseUrl}/api/og.png?path=${encodeURIComponent(req.path)}&query=${encodeURIComponent(searchParams.toString())}`;
        const escapedOgImageUrl = ogImageUrl.replace(/&/g, '&amp;');
        template = template
          .replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
          .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${meta.description}">`)
          .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${meta.title}">`)
          .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${meta.description}">`)
          .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${currentUrl}">`)
          .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapedOgImageUrl}">`)
          .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${meta.title}">`)
          .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${meta.description}">`)
          .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapedOgImageUrl}">`);
          
        if (meta.initialData) {
          template = template.replace('</head>', `
            <script>
              window.__INITIAL_DATA__ = ${JSON.stringify(meta.initialData).replace(/</g, '\\u003c')};
            </script>
          </head>
          `);
        }
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
