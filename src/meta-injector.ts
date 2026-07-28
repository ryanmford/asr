import { normalizeName, CONFIG, getCombinedFlags, toTitleCase } from "./lib/asr-utils.ts";
import { computeAllState } from "./lib/asr-data-compute.ts";
import type { ASRDataContext, PlayerProfile } from "./types.ts";

export interface MetaData {
  title: string;
  description: string;
  initialData?: ASRDataContext;
}

let cachedData: ASRDataContext | null = null;
let lastFetchTime = 0;

async function fetchSheets() {
  const getProxyUrl = (gid: string) => `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  
  const fetchWithRetry = async (url: string) => {
    for (let i = 0; i < 3; i++) {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) return await res.text();
    }
    return "";
  };

  const [mensCsv, womensCsv, liveCsv, setsCsv] = await Promise.all([
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.MENS)),
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.WOMENS)),
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.LIVE)),
    fetchWithRetry(getProxyUrl(CONFIG.SHEET_GIDS.SETS)),
  ]);

  const hasTotalError = !mensCsv && !womensCsv && !liveCsv;
  const hasPartialError = !hasTotalError && (!mensCsv || !womensCsv || !liveCsv || !setsCsv);

  const parsedState = computeAllState({
    rM: mensCsv,
    rF: womensCsv,
    rLive: liveCsv,
    rSet: setsCsv,
    hasTotalError,
    hasPartialError
  });

  cachedData = parsedState;
  lastFetchTime = Date.now();
  return cachedData;
}

export async function getPageMeta(urlPath: string, searchParams: URLSearchParams): Promise<MetaData> {
  const timeSinceLastFetch = Date.now() - lastFetchTime;
  if (!cachedData || timeSinceLastFetch > 5 * 60 * 1000) {
    try {
      await fetchSheets();
    } catch(e) {
      console.error("Meta fetch failed", e);
    }
  }

  const baseTitle = "Apex Speed Run";
  const baseDesc = "Finding the fastest humans IRL 🌎 🌍 🌏";

  if (!cachedData) return { title: baseTitle, description: baseDesc };

  let title = baseTitle;
  let description = baseDesc;

  try {
    const parts = urlPath.replace(/^\//, "").split("/");
    const eventType = searchParams.get("eventType") || "all-time";

    if (parts[0] === "players" && parts[1]) {
      const slug = normalizeName(decodeURIComponent(parts[1]));
      const isAllTime = eventType === "all-time";
      
      const rankData = isAllTime ? (cachedData.data || []) : (eventType === "2026" ? (cachedData.season26Data || []) : (cachedData.openData || []));
      const player = rankData.find((p: PlayerProfile) => normalizeName(p.name || "") === slug);
      
      if (player) {
         const flags = getCombinedFlags(player).trim();
         const titlePrefix = flags ? `${flags} ` : '';
         title = `${titlePrefix}${player.name.toUpperCase()}`;
         const leaderboards = isAllTime ? cachedData.playerLB_AT : (eventType === "2026" ? cachedData.playerLB_2026 : cachedData.playerLB_OP);
         const gender = player.gender || "M";
         const pKey = player.pKey || normalizeName(player.name || "");
         const lbRank = (leaderboards as any)?.[gender]?.[pKey]?.rank;
         const rank = lbRank || 'UR';
         const rating = player.rating ? player.rating.toFixed(2) : '0.00';
         const gym = player.country && player.country !== CONFIG.FALLBACKS.UNKNOWN_LOCATION ? player.country : 'Unknown Location';
         
         if (isAllTime) {
             description = `All-Time Stats: ${rating} Rating | Overall Rank: ${rank || 'UR'} | Gym: ${gym}`;
         } else if (eventType === "2026") {
             description = `2026 Season Stats: ${rating} Rating | 2026 Rank: ${rank || 'UR'} | Gym: ${gym}`;
         } else {
             description = `Open Season Stats: ${rating} Rating | Open Rank: ${rank || 'UR'} | Gym: ${gym}`;
         }
      }
    } else if (parts[0] === "courses" && parts[1]) {
      const slug = normalizeName(decodeURIComponent(parts[1]));
      const courseStr = Object.keys(cachedData.cMet || {}).find(c => normalizeName(c) === slug);
      if (courseStr) {
         const courseInfo = cachedData.cMet[courseStr] || {};
         const flags = getCombinedFlags(courseInfo).trim();
         const titlePrefix = flags ? `${flags} ` : '';
         title = `${titlePrefix}${courseStr.toUpperCase()} SPEED RUN`;
         
         const isAllTime = eventType === "all-time";
         const leaderboards = isAllTime ? cachedData.lbAT : (eventType === "2026" ? cachedData.lbSeason26 : cachedData.lbOpen);
         
         let totalClears = 0;
         let mBest = Infinity;
         let fBest = Infinity;
         
         if (leaderboards) {
            const mData = leaderboards.M?.[courseStr] || {};
            const fData = leaderboards.F?.[courseStr] || {};
            
            const mTimes = Object.values(mData) as number[];
            const fTimes = Object.values(fData) as number[];
            
            totalClears = mTimes.length + fTimes.length;
            if (mTimes.length) mBest = Math.min(...mTimes);
            if (fTimes.length) fBest = Math.min(...fTimes);
         }
         
         const best = Math.min(mBest, fBest);
         const wrStr = best !== Infinity ? `${best.toFixed(2)}s` : 'N/A';
         const locStr = courseInfo.city ? toTitleCase(courseInfo.city) : courseInfo.country ? toTitleCase(courseInfo.country) : 'Secret Location';
         
         const totalRunsCount = courseInfo.totalAllTimeRuns || courseInfo.totalRuns || totalClears;
         description = `World Record: ${wrStr} | Runs: ${totalRunsCount} | Location: ${locStr}`;
      }
    }
  } catch(e) {
    console.error("Meta evaluation error", e);
  }

  return { title, description, initialData: cachedData };
}
