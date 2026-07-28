import fs from 'fs';
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
fetchTile('https://a.basemaps.cartocdn.com/dark_all/13/2411/3079.png').then(u => {
    console.log(u ? "Success, length: " + u.length : "Failed");
});
