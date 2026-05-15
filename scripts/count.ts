import { CONFIG } from '../src/lib/asr-utils.js';
import { computeAllState } from '../src/lib/asr-data-compute.js';

const SPREADSHEET_ID = CONFIG.SPREADSHEET_ID;
const GIDS = CONFIG.SHEET_GIDS;

async function run() {
  const getUrl = (gid: string) => `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  
  console.log('Fetching Google Sheets data...');
  const [mensCsv, womensCsv, liveCsv, setsCsv] = await Promise.all([
    fetch(getUrl(GIDS.MENS)).then(r => r.text()),
    fetch(getUrl(GIDS.WOMENS)).then(r => r.text()),
    fetch(getUrl(GIDS.LIVE)).then(r => r.text()),
    fetch(getUrl(GIDS.SETS)).then(r => r.text()),
  ]);

  console.log('Mens:', mensCsv.length);
  console.log('Womens:', womensCsv.length);
  console.log('Live:', liveCsv.length);
  console.log('Sets:', setsCsv.length);

  const state = computeAllState({
    rM: mensCsv,
    rF: womensCsv,
    rLive: liveCsv,
    rSet: setsCsv,
    hasTotalError: false,
    hasPartialError: false
  });

  const players = [...(state.data || []), ...(state.openData || [])];
  console.log('Sample player:', players[0]);
  const uniquePlayers = new Map();
  players.forEach(p => {
    if (p.name) uniquePlayers.set(p.name.toLowerCase().trim(), p);
  });

  const normalizeCountry = (c: string) => {
    let cleaned = c.trim().toUpperCase();
    if (cleaned === 'MÉXICO') cleaned = 'MEXICO';
    if (cleaned === 'UNITED KINGDOM') cleaned = 'UK';
    return cleaned;
  };

  const playerCountries = new Set();
  uniquePlayers.forEach(p => {
    const rawCountry = p.countryName || p.country;
    if (rawCountry && rawCountry.trim() !== "UNKNOWN" && rawCountry.trim() !== "") {
      rawCountry.split(',').forEach((c: string) => {
        const cleaned = normalizeCountry(c);
        if (cleaned && cleaned !== "UNKNOWN") {
          playerCountries.add(cleaned);
        }
      });
    }
  });

  const courseCountries = new Set();
  for (const courseStr of Object.keys(state.cMet || {})) {
    const courseInfo = state.cMet[courseStr] || {};
    const rawCountry = courseInfo.country;
    if (rawCountry && rawCountry.trim() !== "UNKNOWN" && rawCountry.trim() !== "") {
      rawCountry.split(',').forEach((c: string) => {
        const cleaned = normalizeCountry(c);
        if (cleaned && cleaned !== "UNKNOWN") {
          courseCountries.add(cleaned);
        }
      });
    }
  }

  console.log(`Total unique players: ${uniquePlayers.size}`);
  console.log(`Total unique courses: ${Object.keys(state.cMet || {}).length}`);
  console.log(`Unique player countries: ${playerCountries.size}`);
  console.log('Player countries:', Array.from(playerCountries));
  console.log(`Unique course countries: ${courseCountries.size}`);
  console.log('Course countries:', Array.from(courseCountries));
}

run();
