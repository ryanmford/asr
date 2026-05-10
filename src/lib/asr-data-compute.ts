 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PlayerProfile, CourseData, SetterProfile, TeamProfile, ASRDataContext } from "../types";
import { CONFIG, getContinentData, isPlaceholderPlayer, normalizeName, isQualifiedAthlete } from "./asr-utils.ts";
import {
  processRankingData,
  processLiveFeedData,
  processSetListData,
  processSettersData,
} from "./asr-data.ts";

export function computeAllState(payload: { rM: string; rF: string; rLive: string; rSet: string; hasTotalError: boolean; hasPartialError: boolean }) {
  const { rM, rF, rLive, rSet, hasTotalError, hasPartialError } = payload;

  const pM = processRankingData(rM || "", "M");
  const pF = processRankingData(rF || "", "F");
  const initialMetadata: Record<string, PlayerProfile & { allTimeRank?: number | "UR", openRank?: number | "UR" }> = {};

  const assignRanks = (
    arr: PlayerProfile[],
    gender: string,
    isAllTime: boolean = true,
  ) => {
    const qualified = arr
      .filter((p) => isQualifiedAthlete(p, isAllTime))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    arr.forEach((p) => {
      const rankIdx = qualified.findIndex((q) => q.pKey === p.pKey);
      const rankVal = rankIdx !== -1 ? rankIdx + 1 : "UR";
      if (!initialMetadata[p.pKey])
        initialMetadata[p.pKey] = { ...p, gender };
      if (isAllTime) {
        initialMetadata[p.pKey].allTimeRank = rankVal;
      } else {
        initialMetadata[p.pKey].openRank = rankVal;
      }
    });
  };

  assignRanks(pM, "M", true);
  assignRanks(pF, "F", true);

  const processed = processLiveFeedData(
    rLive || "",
    initialMetadata,
    processSetListData(rSet || ""),
  );

  // Calculate Open Ranks after processing live feed
  const openM = processed.openRankings.filter(
    (p: PlayerProfile) => p.gender === "M",
  );
  const openF = processed.openRankings.filter(
    (p: PlayerProfile) => p.gender === "F",
  );
  assignRanks(openM, "M", false);
  assignRanks(openF, "F", false);
  const allSetters = [
    ...processSettersData(rM || ""),
    ...processSettersData(rF || ""),
  ];

  const nextState = {
    data: [...pM, ...pF],
    openData: processed.openRankings,
    atPerfs: processed.allTimePerformances,
    opPerfs: processed.openPerformances,
    lbAT: processed.allTimeLeaderboards,
    lbOpen: processed.openLeaderboards,
    atMet: processed.athleteMetadata,
    dnMap: processed.athleteDisplayNameMap,
    cMet: processed.courseMetadata,
    settersData: allSetters,
    atRawBest: processed.atRawBest,
    opRawBest: processed.opRawBest,
    recentFeed: processed.recentFeed,
    courseRunsHistory: processed.courseRunsHistory,
    hasError: hasTotalError,
    hasPartialError: hasPartialError,
    lastUpdated: Date.now(),
  };

  const { 
      cMet, lbAT, atRawBest, dnMap, 
      data, 
      settersData, atMet, 
      openData, atPerfs,
      courseRunsHistory
  } = nextState;
  
  // COURSE STATS
  const courseNames = Array.from(
    new Set([
      ...Object.keys(cMet || {}),
      ...Object.keys(lbAT?.M || {}),
      ...Object.keys(lbAT?.F || {}),
    ]),
  ).filter(Boolean);
  
  const masterCourseList = courseNames.map((name) => {
    const athletesMAll = Object.entries((lbAT?.M || {})[name as string] || {})
      .map(([pKey, time]: [string, unknown]) => [
        pKey,
        time,
        (atRawBest || {})[pKey]?.[name as string]?.videoUrl,
      ] as [string, number, string?])
      .sort((a, b) => a[1] - b[1]);
    const athletesFAll = Object.entries((lbAT?.F || {})[name as string] || {})
      .map(([pKey, time]: [string, unknown]) => [
        pKey,
        time,
        (atRawBest || {})[pKey]?.[name as string]?.videoUrl,
      ] as [string, number, string?])
      .sort((a, b) => a[1] - b[1]);
    const meta = (cMet || {})[name as string] || {};
    const contData = getContinentData(meta.country || "UNKNOWN");
    const mRecs = athletesMAll.map((a) => a[1] as number);
    const fRecs = athletesFAll.map((a) => a[1] as number);
    const coordsMatch = String(meta.coordinates || "").match(
      /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
    );
    const filteredM = athletesMAll.filter(
      (a) => !isPlaceholderPlayer(dnMap[a[0] as string] || a[0]),
    );
    const filteredF = athletesFAll.filter(
      (a) => !isPlaceholderPlayer(dnMap[a[0] as string] || a[0]),
    );
    const normName = String(name).toUpperCase();
    return {
      name,
      videoUrl: meta.demoVideo || meta.videoUrl,
      city: meta.city || "UNKNOWN",
      country: meta.country || "UNKNOWN",
      flag: meta.flag || "🏳️",
      continent: contData.name,
      continentFlag: contData.flag,
      mRecord: mRecs.length ? Math.min(...mRecs) : null,
      fRecord: fRecs.length ? Math.min(...fRecs) : null,
      totalAthletes: new Set([
        ...filteredM.map((a) => a[0]),
        ...filteredF.map((a) => a[0]),
      ]).size,
      totalRuns: (courseRunsHistory?.[normName] || []).length || (filteredM.length + filteredF.length),
      allTimeMRecord: mRecs.length ? Math.min(...mRecs) : null,
      allTimeFRecord: fRecs.length ? Math.min(...fRecs) : null,
      allTimeAthletesM: athletesMAll,
      allTimeAthletesF: athletesFAll,
      athletesMAll,
      athletesFAll,
      totalAllTimeAthletes: new Set([
        ...filteredM.map((a) => a[0]),
        ...filteredF.map((a) => a[0]),
      ]).size,
      totalAllTimeRuns: (courseRunsHistory?.[normName] || []).length || (filteredM.length + filteredF.length),
      parsedCoords: coordsMatch
        ? [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])]
        : null,
      ...meta,
    };
  });

  // KPI STATS
  const kpiStats = {
      players: (data || []).filter((p: PlayerProfile) => !isPlaceholderPlayer(p.name)).length,
      courses: masterCourseList.length,
      cities: new Set(
        masterCourseList.map((c: CourseData) => c.city).filter((v: string | undefined) => v && v !== "UNKNOWN"),
      ).size,
      countries: new Set(
        masterCourseList
          .map((c: CourseData) => c.country)
          .filter((v: string | undefined) => v && v !== "UNKNOWN"),
      ).size,
      runs: masterCourseList.reduce(
        (acc: number, c: CourseData) => acc + (c.totalAllTimeRuns || 0),
        0,
      ),
  };

  // KPI TRENDS (Sparklines)
  const allRuns: any[] = [];
  Object.values(courseRunsHistory || {}).forEach((runsArray) => {
    allRuns.push(...(runsArray as any[]));
  });

  const undatedRuns = allRuns.filter(r => !r.date || isNaN(new Date(r.date).getTime()));
  const datedRuns = allRuns.filter(r => r.date && !isNaN(new Date(r.date).getTime())).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const uniquePlayersAtStart = new Set(undatedRuns.map(r => r.pKey).filter(Boolean));
  const uniqueCoursesAtStart = new Set(undatedRuns.map(r => String(r.course).toUpperCase()).filter(Boolean));
  const uniqueCountriesAtStart = new Set(
    undatedRuns.map(r => {
      const c = cMet?.[String(r.course).toUpperCase()];
      return c?.country;
    }).filter(v => v && v !== "UNKNOWN")
  );

  let currentRunsCount = undatedRuns.length;
  const currentUniquePlayers = new Set(uniquePlayersAtStart);
  const currentUniqueCourses = new Set(uniqueCoursesAtStart);
  const currentUniqueCountries = new Set(uniqueCountriesAtStart);

  const runsTrend = [{ value: currentRunsCount }];
  const playersTrend = [{ value: currentUniquePlayers.size }];
  const coursesTrend = [{ value: currentUniqueCourses.size }];
  const countriesTrend = [{ value: currentUniqueCountries.size }];

  // Sample points to make it ~15 data points
  const numDataPoints = 15;
  const chunkSize = Math.max(1, Math.floor(datedRuns.length / (numDataPoints - 1)));

  for (let i = 0; i < datedRuns.length; i++) {
    const r = datedRuns[i];
    currentRunsCount++;
    if (r.pKey) currentUniquePlayers.add(r.pKey);
    const courseKey = String(r.course).toUpperCase();
    if (courseKey) {
      currentUniqueCourses.add(courseKey);
      const countryStr = cMet?.[courseKey]?.country;
      if (countryStr && countryStr !== "UNKNOWN") {
         currentUniqueCountries.add(countryStr);
      }
    }

    // Capture point at chunk intervals, or at the very end
    if ((i + 1) % chunkSize === 0 || i === datedRuns.length - 1) {
       runsTrend.push({ value: currentRunsCount });
       playersTrend.push({ value: currentUniquePlayers.size });
       coursesTrend.push({ value: currentUniqueCourses.size });
       countriesTrend.push({ value: currentUniqueCountries.size });
    }
  }

  const kpiTrends = {
    runs: runsTrend,
    players: playersTrend,
    courses: coursesTrend,
    countries: countriesTrend,
  };

  // SETTER STATS
  const leadMap: Record<string, string[]> = {};
  const assistMap: Record<string, string[]> = {};

  masterCourseList.forEach((c: CourseData) => {
    const leads = c.leadSettersNormalized || (Array.isArray(c.leadSetters) ? c.leadSetters : [c.leadSetters]);
    leads?.forEach((name: string) => {
      if (!name) return;
      const norm = normalizeName(name);
      if (!leadMap[norm]) leadMap[norm] = [];
      leadMap[norm].push(c);
    });

    const assists = c.assistantSettersNormalized || (Array.isArray(c.assistantsetters) ? c.assistantsetters : [c.assistantsetters]);
    assists?.forEach((name: string) => {
      if (!name) return;
      const norm = normalizeName(name);
      if (!assistMap[norm]) assistMap[norm] = [];
      assistMap[norm].push(c);
    });
  });

  const settersWithImpact = (settersData || [])
    .map((s: string) => {
      const sName = s.name ? String(s.name).trim() : "";
      if (!sName) return null;

      const sNameNorm = normalizeName(sName);
      const leadCourses = leadMap[sNameNorm] || [];
      const assistCourses = assistMap[sNameNorm] || [];
      
      const allSetCourses = Array.from(
        new Set([...leadCourses, ...assistCourses]),
      );
      const athleteMeta = atMet?.[sNameNorm];
      const totalCourses = allSetCourses.length;
      if (totalCourses === 0) return null;

      const totalRuns = allSetCourses.reduce(
        (sum, c) => sum + (c.totalAllTimeRuns || 0),
        0,
      );

      return {
        ...s,
        leads: leadCourses.length,
        assists: assistCourses.length,
        sets: totalCourses,
        impact: totalRuns,
        films: athleteMeta?.films || 0,
        isAthlete: !!athleteMeta,
      };
    })
    .filter(Boolean);

  const setterMet: Record<string, SetterProfile> = {};
  settersWithImpact.forEach((s: SetterProfile) => {
    setterMet[normalizeName(s.name)] = s;
  });

  // TEAM STATS (Gyms and Countries)
  const computeTeamStats = (teamCategory: string, isAllTime: boolean) => {
    const aggregated: Record<string, TeamProfile & { pts: number; players: (PlayerProfile & { contribution: number })[], playersCount: number }> = {};
    const sourcePlayers = isAllTime
      ? Object.values(atMet || {})
      : openData;

    (sourcePlayers || []).forEach((p: PlayerProfile) => {
      const pKey = p.pKey || normalizeName(p.name);
      if (!pKey) return;

      const playerRuns = Object.keys(p).includes("runs") ? p.runs : atPerfs?.[pKey]?.length || 0;
      if (playerRuns === 0) return;

      const itemsToProcess: {
        name: string;
        flag: string;
        location?: string;
      }[] = [];
      
      if (teamCategory === "gyms") {
        if (p.homeGym && p.homeGym !== CONFIG.FALLBACKS.UNAFFILIATED) {
          itemsToProcess.push({
            name: p.homeGym,
            flag: p.gymFlag || p.townFlag || "🏳️",
            location: p.teamLocation || "UNKNOWN"
          });
        }
      } else {
        if (p.teams && p.teams.length > 0) {
          p.teams.forEach((t: { name: string, location?: string, flag?: string }) => {
            if (t && t.name) {
              itemsToProcess.push({
                name: t.name,
                flag:
                  t.flag ||
                  (String(t.name).toUpperCase().includes("BLACK TEAM")
                    ? "🇲🇽"
                    : "🏳️"),
                location: t.location || "UNKNOWN"
              });
            }
          });
        }
      }

      itemsToProcess.forEach((item) => {
        const rawName = String(item.name || "").trim();
        const normName = normalizeName(rawName);
        if (!aggregated[normName]) {
          aggregated[normName] = {
            name: rawName,
            flag: item.flag,
            location: item.location || "UNKNOWN",
            pts: 0,
            players: [],
            playersCount: 0,
            bestPlayers: [],
            runsCount: 0,
            searchKey: `${rawName.toLowerCase()} ${item.flag}`,
          };
        }
        if (
          (aggregated[normName].location === "UNKNOWN" ||
            !aggregated[normName].location) &&
          item.location &&
          item.location !== "UNKNOWN"
        ) {
          aggregated[normName].location = item.location;
        }
        let playerPts = p.pts || p.contributionScore || 0;
        if ((!playerPts || playerPts === 0) && isAllTime && atPerfs?.[pKey]) {
           playerPts = atPerfs[pKey].reduce((sum: number, perf: { points?: number }) => sum + (perf.points || 0), 0);
        }
        
        aggregated[normName].pts += playerPts;
        aggregated[normName].players.push({
          ...p,
          contribution: playerPts,
        });
        aggregated[normName].runsCount += playerRuns;
      });
    });

    Object.values(aggregated).forEach((t: TeamProfile & { players: (PlayerProfile & { contribution: number })[], playersCount: number, bestPlayers: PlayerProfile[] }) => {
      t.playersCount = t.players.length;
      t.players.sort((a, b) => b.contribution - a.contribution);
      t.bestPlayers = t.players.slice(0, 5);
      if (t.playersCount > 0) {
        let majorityFlag = t.players[0].gymFlag || t.players[0].townFlag;
        for (const p of t.players) {
          if (p.gymFlag && p.gymFlag !== "🏳️") {
            majorityFlag = p.gymFlag;
            break;
          }
        }
        if (!t.flag || t.flag === "🏳️") {
          t.flag = majorityFlag || "🏳️";
        }
      }
    });

    return Object.values(aggregated).sort((a: TeamProfile & { pts: number }, b: TeamProfile & { pts: number }) => b.pts - a.pts);
  };

  const teamsAggregated = {
    gyms: {
      open: computeTeamStats('gyms', false),
      allTime: computeTeamStats('gyms', true)
    },
    teams: {
      open: computeTeamStats('teams', false),
      allTime: computeTeamStats('teams', true)
    }
  };

  // LEADERBOARDS
  const calculateLeaderboard = (sourceData: PlayerProfile[], isAllTime: boolean) => {
    const qualifiedM = (sourceData || [])
      .filter((p: PlayerProfile) => p.gender === "M" && isQualifiedAthlete(p, isAllTime))
      .sort((a: PlayerProfile, b: PlayerProfile) => (b.rating || 0) - (a.rating || 0));
    const qualifiedF = (sourceData || [])
      .filter((p: PlayerProfile) => p.gender === "F" && isQualifiedAthlete(p, isAllTime))
      .sort((a: PlayerProfile, b: PlayerProfile) => (b.rating || 0) - (a.rating || 0));
      
    const rankMapM = new Map<string, number>(qualifiedM.map((q: PlayerProfile, i: number) => [q.pKey, i + 1]));
    const rankMapF = new Map<string, number>(qualifiedF.map((q: PlayerProfile, i: number) => [q.pKey, i + 1]));

    const mapM: Record<string, PlayerProfile> = {};
    const mapF: Record<string, PlayerProfile> = {};
    (sourceData || []).forEach((p: PlayerProfile) => {
      const rank = p.gender === "M" 
        ? rankMapM.get(p.pKey) || "UR" 
        : rankMapF.get(p.pKey) || "UR";
        
      const metadata = atMet?.[p.pKey] || {};
        
      const stats = { 
        ...p, 
        rank,
        allTimeFireCount: metadata.allTimeFireCount ?? p.allTimeFireCount,
        openFireCount: metadata.openFireCount ?? p.openFireCount 
      };
      if (p.gender === "M") mapM[p.pKey] = stats;
      else mapF[p.pKey] = stats;
    });
    return { M: mapM, F: mapF };
  };

  const playerLB_AT = calculateLeaderboard(data, true);
  const playerLB_OP = calculateLeaderboard(openData, false);

  const computePlayerList = (isAllTime: boolean, gen: string) => {
    const athletePool = isAllTime ? data : openData;
    const allTimeRankedKeys = new Set((data || []).map((p: PlayerProfile) => p.pKey));
    const filtered = athletePool.filter((p: PlayerProfile) => p && p.gender === gen && !isPlaceholderPlayer(p.name) && (p.runs || 0) > 0);
    
    filtered.sort((a: PlayerProfile, b: PlayerProfile) => (b.rating || 0) - (a.rating || 0));

    const qual: PlayerProfile[] = [];
    const unranked: PlayerProfile[] = [];
    filtered.forEach((p: PlayerProfile) => {
      if (isQualifiedAthlete(p, isAllTime)) {
        qual.push(p);
      } else {
        if (isAllTime || allTimeRankedKeys.has(p.pKey)) {
          unranked.push(p);
        }
      }
    });

    const fQual = qual.map((p, i) => ({ ...p, currentRank: i + 1, isQualified: true, shouldFade: false }));
    const fUnranked = unranked.map((p, i) => ({ ...p, currentRank: "UR", isQualified: false, shouldFade: isAllTime ? true : (p.runs || 0) === 0 }));
    
    const dividerLabel = isAllTime ? (gen === "M" ? "RUN 4+ COURSES TO GET RANKED" : "RUN 3+ COURSES TO GET RANKED") : "RUN 3+ COURSES TO GET RANKED";
    
    if (!isAllTime && fQual.length === 0) return [{ isDivider: true, label: dividerLabel }, ...fUnranked];
    return fQual.length && fUnranked.length ? [...fQual, { isDivider: true, label: dividerLabel }, ...fUnranked] : [...fQual, ...fUnranked];
  };

  const computeTeamList = (cat: string, isAllTime: boolean) => {
    const contextStr = isAllTime ? "allTime" : "open";
    let arr = ((teamsAggregated as Record<string, Record<string, (TeamProfile & { pts: number })[]>>)?.[cat]?.[contextStr] || []) as (TeamProfile & { pts: number })[];
    arr = [...arr].sort((a: TeamProfile & { pts: number }, b: TeamProfile & { pts: number }) => (b.pts || 0) - (a.pts || 0));
    return arr.map((t: TeamProfile & { pts: number }, i: number) => ({ ...t, currentRank: i + 1, category: cat }));
  };

  const cListAT = [...masterCourseList].sort((a: CourseData, b: CourseData) => (b.totalAllTimeRuns || 0) - (a.totalAllTimeRuns || 0)).map((c, i) => ({ ...c, currentRank: i + 1 }));
  const cListOP = masterCourseList.filter((c: CourseData) => c.is2026).sort((a: CourseData, b: CourseData) => (b.totalAllTimeRuns || 0) - (a.totalAllTimeRuns || 0)).map((c, i) => ({ ...c, currentRank: i + 1 }));
  const sList = [...settersWithImpact].sort((a: SetterProfile, b: SetterProfile) => (b.impact || 0) - (a.impact || 0)).map((s, i) => ({ ...s, currentRank: i + 1 }));

  return {
    ...nextState,
    masterCourseList, 
    kpiStats, 
    kpiTrends,
    settersWithImpact, 
    setterMet,
    teamsAggregated,
    playerLB_AT, 
    playerLB_OP,
    courseRunsHistory: nextState.courseRunsHistory || {},

    // PRECOMPUTED FLAT UI ARRAYS
    playerList_M_AT: computePlayerList(true, "M"),
    playerList_F_AT: computePlayerList(true, "F"),
    playerList_M_OP: computePlayerList(false, "M"),
    playerList_F_OP: computePlayerList(false, "F"),
    courseList_AT: cListAT,
    courseList_OP: cListOP,
    settersList: sList,
    teamList_gyms_AT: computeTeamList("gyms", true),
    teamList_teams_AT: computeTeamList("teams", true),
    teamList_gyms_OP: computeTeamList("gyms", false),
    teamList_teams_OP: computeTeamList("teams", false),
  };
}
