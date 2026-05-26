 
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PlayerProfile, CourseData, SetterProfile, TeamProfile, ASRDataContext } from "../types";
import { CONFIG, getContinentData, isPlaceholderPlayer, normalizeName, isQualifiedAthlete } from "./asr-utils.ts";
import {
  processRankingData,
  processLiveFeedData,
  processSetListData,
  processSettersData,
} from "./asr-data.ts";
import { normalizeForSearch } from "./utils";

export function computeAllState(payload: { rM: string; rF: string; rLive: string; rSet: string; hasTotalError: boolean; hasPartialError: boolean }) {
  const { rM, rF, rLive, rSet, hasTotalError, hasPartialError } = payload;

  const pM = processRankingData(rM || "", "M");
  const pF = processRankingData(rF || "", "F");
  const initialMetadata: Record<string, PlayerProfile & { allTimeRank?: number | "UR", openRank?: number | "UR" }> = {};

  pM.forEach(p => initialMetadata[p.pKey] = { ...p, gender: "M" });
  pF.forEach(p => initialMetadata[p.pKey] = { ...p, gender: "F" });

  const processed = processLiveFeedData(
    rLive || "",
    initialMetadata,
    processSetListData(rSet || ""),
  );

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
      if (isAllTime) {
        p.allTimeRank = rankVal;
        initialMetadata[p.pKey].allTimeRank = rankVal;
      } else {
        p.openRank = rankVal;
        initialMetadata[p.pKey].openRank = rankVal;
      }
    });
  };

  // Calculate Open Ranks after processing live feed
  const openM = processed.openRankings.filter(
    (p: PlayerProfile) => p.gender === "M",
  );
  const openF = processed.openRankings.filter(
    (p: PlayerProfile) => p.gender === "F",
  );
  assignRanks(openM, "M", false);
  assignRanks(openF, "F", false);

  // Calculate All Time Ranks dynamically
  const atM = processed.allTimeRankings.filter(
    (p: PlayerProfile) => p.gender === "M",
  );
  const atF = processed.allTimeRankings.filter(
    (p: PlayerProfile) => p.gender === "F",
  );
  assignRanks(atM, "M", true);
  assignRanks(atF, "F", true);

  const allSetters = [
    ...processSettersData(rM || ""),
    ...processSettersData(rF || ""),
  ];

  const nextState = {
    data: processed.allTimeRankings,
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
      cMet, lbAT, lbOpen, atRawBest, opRawBest, dnMap, 
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
      totalAthletes: filteredM.length + filteredF.length,
      totalRuns: (courseRunsHistory?.[normName] || []).length || (filteredM.length + filteredF.length),
      allTimeMRecord: mRecs.length ? Math.min(...mRecs) : null,
      allTimeFRecord: fRecs.length ? Math.min(...fRecs) : null,
      allTimeAthletesM: athletesMAll,
      allTimeAthletesF: athletesFAll,
      athletesMAll,
      athletesFAll,
      totalAllTimeAthletes: filteredM.length + filteredF.length,
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
  let allRuns: Record<string, unknown>[] = [];
  Object.values(courseRunsHistory || {}).forEach((runsArray) => {
    allRuns = allRuns.concat(runsArray as Record<string, unknown>[]);
  });

  const parsedRuns = allRuns.map(r => ({
    ...r,
    timeMs: r.date ? new Date(r.date as string).getTime() : NaN
  }));

  const undatedRuns = parsedRuns.filter(r => isNaN(r.timeMs));
  const datedRuns = parsedRuns.filter(r => !isNaN(r.timeMs)).sort((a,b) => a.timeMs - b.timeMs);

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

  // Sample points to make it ~40 data points
  const numDataPoints = 40;
  
  if (datedRuns.length === 0) {
    for (let i = 0; i < numDataPoints - 1; i++) {
       runsTrend.push({ value: currentRunsCount });
       playersTrend.push({ value: currentUniquePlayers.size });
       coursesTrend.push({ value: currentUniqueCourses.size });
       countriesTrend.push({ value: currentUniqueCountries.size });
    }
  } else {
    const minTime = datedRuns[0].timeMs;
    const maxTime = datedRuns[datedRuns.length - 1].timeMs;
    const timeSpan = Math.max(maxTime - minTime, 1);
    const chunkMs = timeSpan / (numDataPoints - 1);
    
    let runIdx = 0;
    for (let step = 1; step < numDataPoints; step++) {
      const bucketEndTime = minTime + (step * chunkMs);
      
      while (runIdx < datedRuns.length && datedRuns[runIdx].timeMs <= bucketEndTime) {
        const r = datedRuns[runIdx];
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
        runIdx++;
      }
      
      runsTrend.push({ value: currentRunsCount });
      playersTrend.push({ value: currentUniquePlayers.size });
      coursesTrend.push({ value: currentUniqueCourses.size });
      countriesTrend.push({ value: currentUniqueCountries.size });
    }
    
    // Ensure any remaining runs exactly equal to maxTime are accounted for
    while (runIdx < datedRuns.length) {
        const r = datedRuns[runIdx];
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
        runIdx++;
    }
    
    runsTrend[runsTrend.length - 1].value = currentRunsCount;
    playersTrend[playersTrend.length - 1].value = currentUniquePlayers.size;
    coursesTrend[coursesTrend.length - 1].value = currentUniqueCourses.size;
    countriesTrend[countriesTrend.length - 1].value = currentUniqueCountries.size;
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
            searchKey: normalizeForSearch(`${rawName} ${item.flag}`),
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

  const courseRecords_M_AT: Record<string, unknown> = {};
  const courseRecords_F_AT: Record<string, unknown> = {};
  const courseRecords_M_OP: Record<string, unknown> = {};
  const courseRecords_F_OP: Record<string, unknown> = {};

  const computeRecords = (sourceSector: Record<string, unknown> | undefined, rawBestSector: Record<string, unknown> | undefined, cName: string, allTimeSourceSector?: Record<string, unknown>) => {
    const source = (sourceSector?.[cName] || {}) as Record<string, unknown>;
    
    // Find the record using the all-time source if available, otherwise fallback to the current source
    const atSource = (allTimeSourceSector?.[cName] || source) as Record<string, unknown>;
    const atTimes = Object.values(atSource) as number[];
    const record = atTimes.length > 0 ? Math.min(...atTimes) : 0;

    const sorted = Object.entries(source)
      .map(([pKey, time]: [string, unknown]) => {
        const num = typeof time === "number" ? time : parseFloat(time as string) || 0;
        return {
          pKey,
          time: num,
          pts: num > 0 ? (record / num) * 100 : 0,
          videoUrl: (rawBestSector?.[pKey] as Record<string, Record<string, { videoUrl?: string }>>)?.[cName]?.videoUrl,
        };
      })
      .sort((a, b) => b.pts - a.pts);

    let currentRank = 1;
    let prevPts = -1;
    return sorted.map((r, i) => {
      if (r.pts !== prevPts) {
        currentRank = i + 1;
        prevPts = r.pts;
      }
      return { ...r, rank: currentRank };
    });
  };

  masterCourseList.forEach((c) => {
    const name = c.name;
    courseRecords_M_AT[name] = computeRecords(lbAT?.M, atRawBest, name, lbAT?.M);
    courseRecords_F_AT[name] = computeRecords(lbAT?.F, atRawBest, name, lbAT?.F);
    courseRecords_M_OP[name] = computeRecords(lbOpen?.M, opRawBest, name, lbAT?.M);
    courseRecords_F_OP[name] = computeRecords(lbOpen?.F, opRawBest, name, lbAT?.F);
  });

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
    
    courseRecords_M_AT,
    courseRecords_F_AT,
    courseRecords_M_OP,
    courseRecords_F_OP,
  };
}

export function computeSimulatedPlacement(targetTime: number, records: Array<{ time: number, rank: number | string }>) {
  let rank = 1;
  for (let i = 0; i < records.length; i++) {
      if (targetTime < records[i].time) {
          break;
      }
      if (targetTime === records[i].time) {
          rank = Number(records[i].rank);
          break;
      }
      rank++;
  }
  return rank;
}

export function computeOriginalRanks(athletePool: PlayerProfile[]) {
  const ranks: Record<string, number> = {};
  const sorted = [...athletePool]
      .filter(a => a.currentRank !== "UR" && a.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  sorted.forEach((a, idx) => ranks[a.pKey] = idx + 1);
  return ranks;
}

export function computeLiveLadderWindow(
  records: Array<{ pKey: string; time: number; pts: number; rank: number | string }>,
  myKey: string,
  myName: string,
  targetTime: number,
  simulatedPts: number,
  athletePool: PlayerProfile[]
) {
  const recordsWithMe = [...records];
  const myIndex = recordsWithMe.findIndex(r => r.pKey === myKey);
  
  if (myIndex !== -1) {
      recordsWithMe[myIndex] = { ...recordsWithMe[myIndex], time: targetTime, pts: simulatedPts };
  } else {
      recordsWithMe.push({ pKey: myKey, time: targetTime, pts: simulatedPts, rank: 0 });
  }

  const namedRecords = recordsWithMe.map(r => ({
      ...r,
      name: r.pKey === myKey ? myName : (athletePool.find(a => a.pKey === r.pKey)?.name || "Unknown"),
      isMe: r.pKey === myKey
  }));

  namedRecords.sort((a, b) => a.time - b.time);

  let curRank = 1;
  for (let i = 0; i < namedRecords.length; i++) {
      if (i > 0 && namedRecords[i].time > namedRecords[i - 1].time) {
          curRank = i + 1;
      }
      namedRecords[i].rank = curRank;
  }

  const myLiveRankIndex = namedRecords.findIndex(r => r.isMe);
  const startIdx = Math.max(0, myLiveRankIndex - 1);
  const endIdx = Math.min(namedRecords.length, startIdx + 3);
  
  let finalStart = startIdx;
  if (endIdx - startIdx < 3) {
      finalStart = Math.max(0, endIdx - 3);
  }

  return namedRecords.slice(finalStart, endIdx);
}

export function computeSimulatedGlobalImpact(
  selectedAthlete: PlayerProfile,
  targetTime: number,
  existingTimesList: Record<string, number>,
  athletePool: PlayerProfile[],
  courseRecord: number,
  originalRanks: Record<string, number>
) {
  let minOtherTime = Infinity;
  for (const pKey in existingTimesList) {
      const t = existingTimesList[pKey];
      if (pKey !== selectedAthlete.pKey && typeof t === "number" && t > 0 && t < minOtherTime) {
          minOtherTime = t;
      }
  }
  
  const simulatedCR = Math.min(minOtherTime !== Infinity ? minOtherTime : courseRecord, targetTime > 0 ? targetTime : courseRecord);
  const oldCR = courseRecord || 1;

  const simulatedRatings: Record<string, number> = {};
  let totalPointsDestroyed = 0;
  
  for (const pt of athletePool) {
      const baseRating = pt.rating || 0;
      const runs = pt.runs || 1; 
      const ptOriginalTime = existingTimesList[pt.pKey];
      
      let pointsDelta = 0;
      let runDelta = 0;
      
      if (pt.pKey === selectedAthlete.pKey) {
          const oldCoursePts = (typeof ptOriginalTime === "number" && ptOriginalTime > 0) ? Math.min(100, (oldCR / ptOriginalTime) * 100) : 0;
          const newCoursePts = targetTime > 0 ? Math.min(100, (simulatedCR / targetTime) * 100) : 0;
          
          pointsDelta = newCoursePts - oldCoursePts;
          if (typeof ptOriginalTime !== "number" || ptOriginalTime <= 0) {
              runDelta = 1;
          }
      } else {
          if (typeof ptOriginalTime === "number" && ptOriginalTime > 0) {
              const oldCoursePts = Math.min(100, (oldCR / ptOriginalTime) * 100);
              const newCoursePts = Math.min(100, (simulatedCR / ptOriginalTime) * 100);
              pointsDelta = newCoursePts - oldCoursePts;
              if (pointsDelta < 0) {
                  totalPointsDestroyed += Math.abs(pointsDelta);
              }
          }
      }
      
      if (runDelta > 0) {
          simulatedRatings[pt.pKey] = ((baseRating * runs) + pointsDelta) / (runs + runDelta);
      } else {
          simulatedRatings[pt.pKey] = baseRating + (pointsDelta / runs);
      }
  }

  const mySimRating = Math.round(simulatedRatings[selectedAthlete.pKey] * 1000000) / 1000000;
  let simulatedGlobalRank = 1;
  
  for (const pt of athletePool) {
      if (pt.pKey === selectedAthlete.pKey) continue;
      if (!pt.currentRank || pt.currentRank === "UR") continue;

      const theirSimRating = Math.round(simulatedRatings[pt.pKey] * 1000000) / 1000000;
      if (theirSimRating > mySimRating) {
          simulatedGlobalRank++;
      }
  }

  const currentRating = Math.round((selectedAthlete.rating || 0) * 1000000) / 1000000;
  
  const newRanks: Record<string, number> = {};
  const sortedNew = [...athletePool]
      .filter(a => a.currentRank !== "UR" && a.rating !== undefined)
      .sort((a, b) => simulatedRatings[b.pKey] - simulatedRatings[a.pKey]);
  sortedNew.forEach((a, idx) => newRanks[a.pKey] = idx + 1);

  let athletesDemoted = 0;
  for (const pKey of Object.keys(originalRanks)) {
      if (pKey === selectedAthlete.pKey) continue;
      if ((newRanks[pKey] || 0) > (originalRanks[pKey] || 0)) {
          athletesDemoted++;
      }
  }

  return {
      originalRating: selectedAthlete.rating || 0,
      newRating: mySimRating,
      originalRank: selectedAthlete.currentRank || "UR",
      newRank: simulatedGlobalRank,
      isImprovement: mySimRating > currentRating,
      pointsDestroyed: totalPointsDestroyed,
      athletesDemoted,
      beatsCR: targetTime < courseRecord,
      simulatedCR
  };
}
