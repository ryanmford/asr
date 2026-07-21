 
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

const sortAthletesWithTiebreakers = (a: PlayerProfile, b: PlayerProfile) => {
  if (Math.abs((b.rating || 0) - (a.rating || 0)) > 0.000001) {
    return (b.rating || 0) - (a.rating || 0);
  }
  if ((b.runs || 0) !== (a.runs || 0)) {
    return (b.runs || 0) - (a.runs || 0);
  }
  return (a.latestRunDate?.getTime() || Infinity) - (b.latestRunDate?.getTime() || Infinity);
};

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
    isAllTime: boolean | string = true,
  ) => {
    const qualified = arr
      .filter((p) => isQualifiedAthlete(p, isAllTime))
      .sort(sortAthletesWithTiebreakers);
    
    // Build tiebreaker-aware rank mapping
    const buildRankMap = (qualifiedArr: PlayerProfile[]) => {
      const rm = new Map<string, number>();
      let currRank = 1;
      let prevRating = -1;
      let prevRuns = -1;
      let prevDate = -1;
      
      qualifiedArr.forEach((q, i) => {
        const r = q.rating || 0;
        const runs = q.runs || 0;
        const date = q.latestRunDate?.getTime() || Infinity;

        const diffRating = Math.abs(r - prevRating) > 0.000001;
        const diffRuns = runs !== prevRuns;
        const diffDate = date !== prevDate;
        
        if (diffRating || diffRuns || diffDate) {
          currRank = i + 1;
          prevRating = r;
          prevRuns = runs;
          prevDate = date;
        }
        rm.set(q.pKey, currRank);
      });
      return rm;
    };
    
    const rankMap = buildRankMap(qualified);

    arr.forEach((p) => {
      const rankVal = rankMap.has(p.pKey) ? rankMap.get(p.pKey)! : "UR";
      if (isAllTime === true || isAllTime === "all-time") {
        p.allTimeRank = rankVal;
        initialMetadata[p.pKey].allTimeRank = rankVal;
      } else if (isAllTime === "2026") {
        p.season26Rank = rankVal;
        initialMetadata[p.pKey].season26Rank = rankVal;
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
  const s26M = processed.season26Rankings.filter(
    (p: PlayerProfile) => p.gender === "M",
  );
  const s26F = processed.season26Rankings.filter(
    (p: PlayerProfile) => p.gender === "F",
  );
  assignRanks(s26M, "M", "2026");
  assignRanks(s26F, "F", "2026");

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
    season26Data: processed.season26Rankings,
    atPerfs: processed.allTimePerformances,
    opPerfs: processed.openPerformances,
    season26Perfs: processed.season26Performances,
    lbAT: processed.allTimeLeaderboards,
    lbOpen: processed.openLeaderboards,
    lbSeason26: processed.season26Leaderboards,
    atMet: processed.athleteMetadata,
    dnMap: processed.athleteDisplayNameMap,
    cMet: processed.courseMetadata,
    settersData: allSetters,
    atRawBest: processed.atRawBest,
    opRawBest: processed.opRawBest,
    season26RawBest: processed.season26RawBest,
    recentFeed: processed.recentFeed,
    courseRunsHistory: processed.courseRunsHistory,
    hasError: hasTotalError,
    hasPartialError: hasPartialError,
    lastUpdated: Date.now(),
  };

  const { 
      cMet, lbAT, lbOpen, lbSeason26, atRawBest, opRawBest, season26RawBest, dnMap, 
      data, 
      settersData, atMet, 
      openData, season26Data, atPerfs, season26Perfs,
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

  // RECALCULATE COIN STAT IN REAL TIME
  // Formula: (runs * 0.1) + (wins * 0.1) + (leads * 0.2) + (assists * 0.1)
  const atDataMap = new Map<string, any>();
  data.forEach((p: any) => atDataMap.set(p.pKey, p));

  const allKeys = new Set([
    ...Object.keys(atMet || {}),
    ...Object.keys(setterMet || {}),
  ]);

  allKeys.forEach((pKey) => {
    const atPlayer = atDataMap.get(pKey);
    const runs = atPlayer?.runs || atMet[pKey]?.runs || 0;
    const wins = atPlayer?.wins || atMet[pKey]?.wins || 0;
    
    const setter = setterMet[pKey];
    const leads = setter?.leads || 0;
    const assists = setter?.assists || 0;

    const newCoins = (runs * 0.1) + (wins * 0.1) + (leads * 0.2) + (assists * 0.1);

    if (atMet[pKey]) atMet[pKey].contributionScore = newCoins;
    if (setterMet[pKey]) setterMet[pKey].contributionScore = newCoins;

    if (atMet[pKey] && setter) {
      atMet[pKey].sets = setter.sets || 0;
    }
  });

  data.forEach((p: any) => {
    p.contributionScore = atMet[p.pKey]?.contributionScore || 0;
    p.sets = atMet[p.pKey]?.sets || setterMet[p.pKey]?.sets || 0;
  });

  openData.forEach((p: any) => {
    p.contributionScore = atMet[p.pKey]?.contributionScore || 0;
    p.sets = atMet[p.pKey]?.sets || setterMet[p.pKey]?.sets || 0;
  });

  settersWithImpact.forEach((s: any) => {
    const pKey = s.pKey || normalizeName(s.name);
    s.contributionScore = atMet[pKey]?.contributionScore || setterMet[pKey]?.contributionScore || 0;
  });

  // TEAM STATS (Gyms and Countries)
  const computeTeamStats = (teamCategory: string, mode: boolean | string) => {
    const aggregated: Record<string, TeamProfile & { pts: number; players: (PlayerProfile & { contribution: number })[], playersCount: number }> = {};
    const isAllTime = mode === true || mode === "all-time";
    const sourcePlayers = isAllTime
      ? Object.values(atMet || {})
      : (mode === "2026" ? season26Data : openData);

    (sourcePlayers || []).forEach((p: PlayerProfile) => {
      const pKey = p.pKey || normalizeName(p.name);
      if (!pKey) return;

      const playerRuns = Object.keys(p).includes("runs") ? p.runs : ((mode === "2026" ? season26Perfs?.[pKey] : (isAllTime ? atPerfs?.[pKey] : opPerfs?.[pKey]))?.length || 0);
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
        if ((!playerPts || playerPts === 0)) {
          const perfs = mode === "2026" ? season26Perfs?.[pKey] : (isAllTime ? atPerfs?.[pKey] : opPerfs?.[pKey]);
          if (perfs) {
            playerPts = perfs.reduce((sum: number, perf: { points?: number }) => sum + (perf.points || 0), 0);
          }
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
      allTime: computeTeamStats('gyms', true),
      season26: computeTeamStats('gyms', "2026")
    },
    teams: {
      open: computeTeamStats('teams', false),
      allTime: computeTeamStats('teams', true),
      season26: computeTeamStats('teams', "2026")
    }
  };

  // LEADERBOARDS
  const calculateLeaderboard = (sourceData: PlayerProfile[], mode: boolean | string) => {
    const qualifiedM = (sourceData || [])
      .filter((p: PlayerProfile) => p.gender === "M" && isQualifiedAthlete(p, mode))
      .sort(sortAthletesWithTiebreakers);
    const qualifiedF = (sourceData || [])
      .filter((p: PlayerProfile) => p.gender === "F" && isQualifiedAthlete(p, mode))
      .sort(sortAthletesWithTiebreakers);
      
    const buildRankMap = (qualifiedArr: PlayerProfile[]) => {
      const rm = new Map<string, number>();
      let currRank = 1;
      let prevRating = -1;
      let prevRuns = -1;
      let prevDate = -1;
      
      qualifiedArr.forEach((q, i) => {
        const r = q.rating || 0;
        const runs = q.runs || 0;
        const date = q.latestRunDate?.getTime() || Infinity;

        const diffRating = Math.abs(r - prevRating) > 0.000001;
        const diffRuns = runs !== prevRuns;
        const diffDate = date !== prevDate;
        
        if (diffRating || diffRuns || diffDate) {
          currRank = i + 1;
          prevRating = r;
          prevRuns = runs;
          prevDate = date;
        }
        rm.set(q.pKey, currRank);
      });
      return rm;
    }

    const rankMapM = buildRankMap(qualifiedM);
    const rankMapF = buildRankMap(qualifiedF);

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
  const playerLB_2026 = calculateLeaderboard(season26Data, "2026");
  const playerLB_OP = calculateLeaderboard(openData, false);

  const computePlayerList = (mode: boolean | string, gen: string) => {
    const athletePool = mode === true || mode === "all-time" ? data : (mode === "2026" ? season26Data : openData);
    const allTimeRankedKeys = new Set((data || []).map((p: PlayerProfile) => p.pKey));
    const filtered = athletePool.filter((p: PlayerProfile) => p && p.gender === gen && !isPlaceholderPlayer(p.name) && (p.runs || 0) > 0);
    
    filtered.sort(sortAthletesWithTiebreakers);

    const qual: PlayerProfile[] = [];
    const unranked: PlayerProfile[] = [];
    filtered.forEach((p: PlayerProfile) => {
      if (isQualifiedAthlete(p, mode)) {
        qual.push(p);
      } else {
        if (mode === "2026" || mode === true || mode === "all-time" || allTimeRankedKeys.has(p.pKey)) {
          unranked.push(p);
        }
      }
    });

    const fQual = qual.map((p, i) => ({ ...p, currentRank: i + 1, isQualified: true, shouldFade: false }));
    const fUnranked = unranked.map((p, i) => ({ ...p, currentRank: "UR", isQualified: false, shouldFade: true }));
    
    const dividerLabel = "RUN 6+ COURSES TO GET RANKED";
    
    if ((mode === false || mode === "open" || mode === "2026") && fQual.length === 0) return [{ isDivider: true, label: dividerLabel }, ...fUnranked];
    return fQual.length && fUnranked.length ? [...fQual, { isDivider: true, label: dividerLabel }, ...fUnranked] : [...fQual, ...fUnranked];
  };

  const computeTeamList = (cat: string, mode: boolean | string) => {
    const contextStr = mode === "2026" ? "season26" : (mode === true || mode === "all-time" ? "allTime" : "open");
    let arr = ((teamsAggregated as Record<string, Record<string, (TeamProfile & { pts: number })[]>>)?.[cat]?.[contextStr] || []) as (TeamProfile & { pts: number })[];
    arr = [...arr].sort((a: TeamProfile & { pts: number }, b: TeamProfile & { pts: number }) => (b.pts || 0) - (a.pts || 0));
    return arr.map((t: TeamProfile & { pts: number }, i: number) => ({ ...t, currentRank: i + 1, category: cat }));
  };

  const cListAT = [...masterCourseList].sort((a: CourseData, b: CourseData) => (b.totalAllTimeRuns || 0) - (a.totalAllTimeRuns || 0)).map((c, i) => ({ ...c, currentRank: i + 1 }));
  const cListOP = masterCourseList.map((c: CourseData) => {
    const mCount = Object.keys(lbOpen?.M?.[String(c.name).toUpperCase()] || {}).length;
    const fCount = Object.keys(lbOpen?.F?.[String(c.name).toUpperCase()] || {}).length;
    return { ...c, openRuns: mCount + fCount };
  }).filter((c: any) => c.openRuns > 0)
    .sort((a: any, b: any) => b.openRuns - a.openRuns)
    .map((c: any, i: number) => ({ ...c, currentRank: i + 1 }));
  const cList2026 = masterCourseList.map((c: CourseData) => {
    const mCount = Object.keys(lbSeason26?.M?.[String(c.name).toUpperCase()] || {}).length;
    const fCount = Object.keys(lbSeason26?.F?.[String(c.name).toUpperCase()] || {}).length;
    return { ...c, season26Runs: mCount + fCount };
  }).filter((c: any) => c.season26Runs > 0)
    .sort((a: any, b: any) => b.season26Runs - a.season26Runs)
    .map((c: any, i: number) => ({ ...c, currentRank: i + 1 }));
  const sList = [...settersWithImpact].sort((a: SetterProfile, b: SetterProfile) => (b.impact || 0) - (a.impact || 0)).map((s, i) => ({ ...s, currentRank: i + 1 }));

  const courseRecords_M_AT: Record<string, unknown> = {};
  const courseRecords_F_AT: Record<string, unknown> = {};
  const courseRecords_M_OP: Record<string, unknown> = {};
  const courseRecords_F_OP: Record<string, unknown> = {};
  const courseRecords_M_2026: Record<string, unknown> = {};
  const courseRecords_F_2026: Record<string, unknown> = {};

  const computeRecords = (sourceSector: Record<string, unknown> | undefined, rawBestSector: Record<string, unknown> | undefined, cName: string, allTimeSourceSector?: Record<string, unknown>) => {
    const source = (sourceSector?.[cName] || {}) as Record<string, unknown>;
    
    // Find the record using the all-time source if available, otherwise fallback to the current source
    const atSource = (allTimeSourceSector?.[cName] || source) as Record<string, unknown>;
    const atTimes = Object.values(atSource) as number[];
    const record = atTimes.length > 0 ? Math.min(...atTimes) : 0;
    
    const runsForCourse = (courseRunsHistory?.[cName] || []) as Record<string, unknown>[];

    const sorted = Object.entries(source)
      .map(([pKey, time]: [string, unknown]) => {
        const num = typeof time === "number" ? time : parseFloat(time as string) || 0;
        const isInterim = isPlaceholderPlayer(pKey);
        
        const run = runsForCourse.find(r => r.pKey === pKey && Math.abs((r.time as number) - num) < 0.001);
        
        return {
          pKey,
          time: num,
          pts: num > 0 ? (record / num) * 100 : 0,
          videoUrl: (rawBestSector?.[pKey] as Record<string, Record<string, { videoUrl?: string }>>)?.[cName]?.videoUrl,
          date: run?.date,
          isInterim,
          name: isInterim ? "INTERIM TOP TIME" : undefined
        };
      })
      .sort((a, b) => b.pts - a.pts);

    let currentRank = 1;
    let prevTime = -1;
    return sorted.map((r, i) => {
      if (r.time !== prevTime) {
        currentRank = i + 1;
        prevTime = r.time;
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
    courseRecords_M_2026[name] = computeRecords(lbSeason26?.M, season26RawBest, name, lbAT?.M);
    courseRecords_F_2026[name] = computeRecords(lbSeason26?.F, season26RawBest, name, lbAT?.F);
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
    playerLB_2026,
    courseRunsHistory: nextState.courseRunsHistory || {},

    // PRECOMPUTED FLAT UI ARRAYS
    playerList_M_AT: computePlayerList(true, "M"),
    playerList_F_AT: computePlayerList(true, "F"),
    playerList_M_OP: computePlayerList(false, "M"),
    playerList_F_OP: computePlayerList(false, "F"),
    playerList_M_2026: computePlayerList("2026", "M"),
    playerList_F_2026: computePlayerList("2026", "F"),
    courseList_AT: cListAT,
    courseList_OP: cListOP,
    courseList_2026: cList2026,
    settersList: sList,
    teamList_gyms_AT: computeTeamList("gyms", true),
    teamList_teams_AT: computeTeamList("teams", true),
    teamList_gyms_OP: computeTeamList("gyms", false),
    teamList_teams_OP: computeTeamList("teams", false),
    teamList_gyms_2026: computeTeamList("gyms", "2026"),
    teamList_teams_2026: computeTeamList("teams", "2026"),
    
    courseRecords_M_AT,
    courseRecords_F_AT,
    courseRecords_M_OP,
    courseRecords_F_OP,
    courseRecords_M_2026,
    courseRecords_F_2026,
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
      .sort(sortAthletesWithTiebreakers);
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
  courseName: string,
  fullLeaderboards: Record<string, Record<string, number>>,
  athletePool: PlayerProfile[],
  courseRecord: number,
  originalRanks: Record<string, number>
) {
  const existingTimesList = fullLeaderboards[courseName] || {};
  let minOtherTime = Infinity;
  for (const pKey in existingTimesList) {
      const t = existingTimesList[pKey];
      if (pKey !== selectedAthlete.pKey && typeof t === "number" && t > 0 && t < minOtherTime) {
          minOtherTime = t;
      }
  }
  
  const simulatedCR = Math.min(minOtherTime !== Infinity ? minOtherTime : courseRecord, targetTime > 0 ? targetTime : courseRecord);
  const oldCR = courseRecord || 1;

  // Precompute course records for the entire state array
  const courseRecords: Record<string, number> = {};
  for (const cName in fullLeaderboards) {
      if (cName === courseName) {
          courseRecords[cName] = simulatedCR;
      } else {
          const times = Object.values(fullLeaderboards[cName]);
          const validTimes = times.filter(t => typeof t === "number" && t > 0);
          courseRecords[cName] = validTimes.length > 0 ? Math.min(...validTimes) : 0;
      }
  }

  const simulatedRatings: Record<string, number> = {};
  let totalPointsDestroyed = 0;
  
  for (const pt of athletePool) {
      let totalPts = 0;
      let totalRuns = 0;
      
      for (const cName in fullLeaderboards) {
          let time = fullLeaderboards[cName][pt.pKey];
          
          if (cName === courseName) {
              if (pt.pKey === selectedAthlete.pKey) {
                  time = targetTime;
              }
              const cr = courseRecords[cName];
              if (typeof time === "number" && time > 0 && cr > 0) {
                  totalPts += Math.min(100, (cr / time) * 100);
                  totalRuns++;
              }
          } else {
              const cr = courseRecords[cName];
              if (typeof time === "number" && time > 0 && cr > 0) {
                  totalPts += Math.min(100, (cr / time) * 100);
                  totalRuns++;
              }
          }
      }
      
      simulatedRatings[pt.pKey] = totalRuns > 0 ? totalPts / totalRuns : 0;

      // Track points destroyed for others
      if (pt.pKey !== selectedAthlete.pKey) {
          const ptOriginalTime = existingTimesList[pt.pKey];
          if (typeof ptOriginalTime === "number" && ptOriginalTime > 0) {
              const oldCoursePts = Math.min(100, (oldCR / ptOriginalTime) * 100);
              const newCoursePts = Math.min(100, (simulatedCR / ptOriginalTime) * 100);
              const pointsDelta = newCoursePts - oldCoursePts;
              if (pointsDelta < 0) {
                  totalPointsDestroyed += Math.abs(pointsDelta);
              }
          }
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
