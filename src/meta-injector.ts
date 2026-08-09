import { normalizeName, CONFIG, getCombinedFlags, toTitleCase } from "./lib/asr-utils.ts";
import { computeAllState } from "./lib/asr-data-compute.ts";
import type { ASRDataContext, PlayerProfile } from "./types.ts";

export interface MetaData {
  title: string;
  description: string;
  initialData?: ASRDataContext;
  ogType?: 'player' | 'course';
  ogStats?: { value: string; label: string }[];
  ogMapCoords?: [number, number] | null;
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

  const baseTitle = "APEX SPEED RUN";
  const baseDesc = "FINDING THE FASTEST HUMANS IRL 🌎 🌍 🌏";

  if (!cachedData) return { title: baseTitle, description: baseDesc };

  let title = baseTitle;
  let description = baseDesc;
  let ogType: 'player' | 'course' | undefined;
  let ogStats: { value: string; label: string }[] | undefined;
  let ogMapCoords: [number, number] | null = null;

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
         
         const coursesCount = player.courses || 0;
         const runsCount = player.runs || 0;
         const winsCount = player.wins || 0;
         const firesCount = player.allTimeFireCount || 0;
         
         let newDesc = `COURSES: ${coursesCount} | RUNS: ${runsCount}`;
         if (winsCount > 0) newDesc += ` | WINS: ${winsCount}`;
         if (firesCount > 0) newDesc += ` | 🔥 ${firesCount}`;

         if (isAllTime) {
             description = newDesc.toUpperCase();
         } else if (eventType === "2026") {
             description = `2026 SEASON STATS: ${rating} RATING | 2026 RANK: ${rank || 'UR'} | GYM: ${gym}`.toUpperCase();
         } else {
             description = `OPEN SEASON STATS: ${rating} RATING | OPEN RANK: ${rank || 'UR'} | GYM: ${gym}`.toUpperCase();
         }
         
         const setterData = (cachedData.settersWithImpact as any[])?.find(s => normalizeName(s.name) === slug);
         const setsCount = setterData?.sets || 0;
         const impactCount = setterData?.impact || 0;

         ogType = 'player';
         ogStats = [
             { value: rating, label: 'LQ' },
             { value: rank === 'UR' ? 'UR' : `${rank}`, label: 'RANK' }
         ];
         
         if (setsCount > 0) {
             ogStats.push({ value: setsCount.toString(), label: 'SETS' });
         }
         if (impactCount > 0) {
             ogStats.push({ value: impactCount.toString(), label: 'IMPACT' });
         }
         
         const completedCourses = [];
         const allCourses = Object.keys(cachedData.cMet || {});
         for (const c of allCourses) {
           if (cachedData.lbAT?.M?.[c]?.[player.name] || cachedData.lbAT?.F?.[c]?.[player.name] || cachedData.lbSeason26?.M?.[c]?.[player.name] || cachedData.lbSeason26?.F?.[c]?.[player.name]) {
             completedCourses.push(c);
           }
         }
         const randCourse = completedCourses.length > 0 ? completedCourses[Math.floor(Math.random() * completedCourses.length)] : null;
         ogMapCoords = randCourse && cachedData.cMet[randCourse] ? cachedData.cMet[randCourse].parsedCoords || null : null;
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
         
         const locStr = courseInfo.city ? toTitleCase(courseInfo.city) : courseInfo.country ? toTitleCase(courseInfo.country) : 'Secret Location';
         
         const totalRunsCount = courseInfo.totalAllTimeRuns || courseInfo.totalRuns || totalClears;
         description = `RUNS: ${totalRunsCount} | 📍 ${locStr}`.toUpperCase();
         ogType = 'course';
         ogStats = [
             { value: mBest !== Infinity ? mBest.toFixed(2) : '--', label: "WR (M)" },
             { value: fBest !== Infinity ? fBest.toFixed(2) : '--', label: "WR (W)" }
         ];
         ogMapCoords = courseInfo.parsedCoords || null;
      }
    }
  } catch(e) {
    console.error("Meta evaluation error", e);
  }

  return { title, description, initialData: cachedData, ogType, ogStats, ogMapCoords };
}
