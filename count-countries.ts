import { CONFIG } from "./src/lib/asr-utils.js";
import { computeAllState } from "./src/lib/asr-data-compute.js";

async function run() {
  const getProxyUrl = (gid: string) => `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  
  const fetchWithRetry = async (url: string) => {
    for (let i = 0; i < 3; i++) {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) return await res.text();
    }
    return "";
  };

  const [rM, rF, rLive, rSet] = await Promise.all([
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.MENS)),
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.WOMENS)),
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.LIVE)),
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.SETS)),
  ]);
  
  const payload = { rM, rF, rLive, rSet, hasTotalError: false, hasPartialError: false };
  const state = computeAllState(payload);

  const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g;
  
  const playerFlags = new Set<string>();
  [...(state.playerList_M_AT || []), ...(state.playerList_F_AT || [])].forEach(
    (p: any) => {
      [p.gymFlag, p.townFlag, p.region].forEach((f) => {
        if (f) {
          const matches = String(f).match(flagRegex);
          if (matches) matches.forEach((m) => playerFlags.add(m));
        }
      });
      if (p.teams && Array.isArray(p.teams)) {
        p.teams.forEach((t: any) => {
          if (t.flag) {
            const matches = String(t.flag).match(flagRegex);
            if (matches) matches.forEach((m) => playerFlags.add(m));
          }
        });
      }
    },
  );
  
  const courseFlags = new Set<string>();
  state.masterCourseList.forEach((c: any) => {
    if (c.flag) {
      const matches = String(c.flag).match(flagRegex);
      if (matches) matches.forEach((m) => courseFlags.add(m));
    }
  });

  const flagToName = new Intl.DisplayNames(['en'], { type: 'region' });
  const getCountryName = (flag: string) => {
      const code = [...flag].map(c => String.fromCharCode(c.codePointAt(0)! - 127397)).join('');
      try { return flagToName.of(code) || code; } catch { return code; }
  };

  console.log("Flags ONLY in courses:");
  for (const flag of courseFlags) {
      if (!playerFlags.has(flag)) {
          console.log(`${flag} - ${getCountryName(flag)}`);
      }
  }
}

run().catch(console.error);
