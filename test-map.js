import fs from 'fs';

function getMapBackground(lat, lon, zoom) {
  const Z = zoom;
  const centerTx = (lon + 180) / 360 * Math.pow(2, Z);
  const centerTy = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, Z);
  
  const TILE_SIZE = 1024; // stretch 256 to 1024, effectively 4x zoom
  
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
        url: `https://a.basemaps.cartocdn.com/dark_all/${Z}/${tx}/${ty}.png`,
        x: tx * TILE_SIZE - svgX,
        y: ty * TILE_SIZE - svgY
      });
    }
  }
  return tiles;
}

const tileCache = new Map();

async function fetchTile(url) {
  if (tileCache.has(url)) return tileCache.get(url);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
    tileCache.set(url, dataUri);
    return dataUri;
  } catch (e) {
    console.warn(`Failed to fetch tile ${url}`, e);
    return null;
  }
}

async function run() {
    const tiles = getMapBackground(40.7128, -74.0060, 13);
    for (const t of tiles) {
        t.dataUri = await fetchTile(t.url);
    }
    console.log(tiles.length, "tiles fetched. First URI len:", tiles[0].dataUri.length);
}

run();
