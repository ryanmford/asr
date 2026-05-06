import { CONFIG } from "./lib/asr-utils.ts";
import { normalizeName } from "./lib/asr-utils.ts";
import { computeAllState } from "./lib/asr-data-compute.ts";

export interface MetaData {
  title: string;
  description: string;
  initialData?: any;
}

let cachedData: any = null;
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
  const baseDesc = "Global Parkour Leaderboards and Course Directory";

  if (!cachedData) return { title: baseTitle, description: baseDesc };

  let title = baseTitle;
  let description = baseDesc;

  try {
    const parts = urlPath.replace(/^\//, "").split("/");
    const eventType = searchParams.get("eventType") || "open";

    if (parts[0] === "players" && parts[1]) {
      const slug = normalizeName(decodeURIComponent(parts[1]));
      const isAllTime = eventType === "all-time";
      
      const rankData = isAllTime ? (cachedData.data || []) : (cachedData.openData || []);
      const player = rankData.find((p: any) => normalizeName(p.name || "") === slug);
      
      if (player) {
         title = `${player.name.toUpperCase()} | ASR Player Profile`;
         const rank = isAllTime ? player.allTimeRank : player.openRank;
         const rating = player.rating ? player.rating.toFixed(2) : '0.00';
         const gym = player.country && player.country !== CONFIG.FALLBACKS.UNKNOWN_LOCATION ? player.country : 'Unknown Location';
         
         if (isAllTime) {
             description = `All-Time Stats: ${rating} Rating | Overall Rank: ${rank || 'UR'} | Gym: ${gym}`;
         } else {
             description = `Open Season Stats: ${rating} Rating | Open Rank: ${rank || 'UR'} | Gym: ${gym}`;
         }
      }
    } else if (parts[0] === "map" && parts[1]) {
      const slug = normalizeName(decodeURIComponent(parts[1]));
      const courseStr = Object.keys(cachedData.cMet || {}).find(c => normalizeName(c) === slug);
      if (courseStr) {
         const courseInfo = cachedData.cMet[courseStr] || {};
         title = `${courseStr.toUpperCase()} | ASR Map`;
         
         const isAllTime = eventType === "all-time";
         const leaderboards = isAllTime ? cachedData.lbAT : cachedData.lbOpen;
         
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
         const locStr = courseInfo.city ? `${courseInfo.city.toUpperCase()}` : courseInfo.country ? `${courseInfo.country.toUpperCase()}` : 'UNKNOWN LOCATION';
         
         description = `Fastest Time: ${wrStr} | Total Clears: ${totalClears} | Location: ${locStr}`;
      }
    }
  } catch(e) {
    console.error("Meta evaluation error", e);
  }

  return { title, description, initialData: cachedData };
}
