import express from "express";
import { createServer as createViteServer } from "vite";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { getPageMeta } from './src/meta-injector.ts';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1DcLZyAO2QZij_176vsC7_rWWTVbxwt8X9Jw7YWM_7j4';

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
  app.get('/api/og', async (req, res) => {
    try {
      const title = (req.query.title as string) || 'Apex Speed Run';
      const desc = (req.query.desc as string) || 'Global Parkour Leaderboards and Course Directory';

      const fontData = await fs.readFile(
        path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-700-normal.woff')
      );

      const svg = await satori(
        {
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
                                color: '#a1a1aa', // Zinc-400
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
        } as any,
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
        }
      );

      const resvg = new Resvg(svg, {
        background: '#09090b',
        fitTo: { mode: 'width', value: 1200 },
      });
      const pngBuffer = resvg.render().asPng();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      res.send(pngBuffer);
    } catch (error) {
      console.error('OG Image Error:', error);
      res.status(500).send('Failed to generate image');
    }
  });


  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const searchParams = new URLSearchParams(req.query as any);
        const meta = await getPageMeta(req.path, searchParams);
        
        const baseUrl = req.headers.host && req.headers.host.includes('localhost') ? 'http://localhost:3000' : 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'apexspeedrun.com');
        const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(meta.title)}&desc=${encodeURIComponent(meta.description)}`;
        template = template
          .replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
          .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${meta.description}">`)
          .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${meta.title}">`)
          .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${meta.description}">`)
          .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImageUrl}">`)
          .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${meta.title}">`)
          .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${meta.description}">`)
          .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImageUrl}">`);
          
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
      try {
        let template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const searchParams = new URLSearchParams(req.query as any);
        const meta = await getPageMeta(req.path, searchParams);
        
        const baseUrl = req.headers.host && req.headers.host.includes('localhost') ? 'http://localhost:3000' : 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'apexspeedrun.com');
        const ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(meta.title)}&desc=${encodeURIComponent(meta.description)}`;
        template = template
          .replace(/<title>.*?<\/title>/s, `<title>${meta.title}</title>`)
          .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${meta.description}">`)
          .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${meta.title}">`)
          .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${meta.description}">`)
          .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImageUrl}">`)
          .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${meta.title}">`)
          .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${meta.description}">`)
          .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImageUrl}">`);
          
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
