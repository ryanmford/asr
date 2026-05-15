import {
  normalizeName,
  fixCountryEntity,
  cleanNumeric,
  getFireCountForRun,
  isPlaceholderPlayer,
  csvToObjects,
  CONFIG,
  robustSort,
  isQualifiedAthlete,
  getNormalizedNameList,
} from "./asr-utils";
import { normalizeForSearch } from "./utils";

export const RANKING_MAPPING = {
  name: ["athlete", "name", "player"],
  country: ["country"],
  flag: ["flag"],
  rating: ["ovr", "overall", "rating"],
  pts: ["pts", "points", "asr"],
  runs: ["runs", "totalruns", "total", "#"],
  wins: ["wins", "victories"],
  sets: ["sets", "total sets"],
  contribution: ["🪙", "contribution"],
  fire: ["🔥", "fire"],
  ig: ["ig", "instagram", "social"],
  avg: ["avg time", "average", "avg"],
  cert: ["cert", "level", "certification"],
  location: ["location", "city", "region", "hometown"],
  homeGym: ["gym", "home gym"],
};

export const SET_LIST_MAPPING = {
  course: ["course", "track", "level"],
  length: ["length", "dist"],
  elev: ["elev", "gain"],
  rating: ["rating", "diff", "difficulty"],
  type: ["type", "style"],
  city: ["city", "location"],
  country: ["country", "nation"],
  flag: ["flag", "emoji"],
  dateSet: ["set on", "updated", "date set"],
  demo: ["demo", "rules", "video", "url"],
  coverImage: ["img", "pic", "photo", "cover", "image", "coverimage"],
  coords: ["coord", "gps", "location", "pin"],
  state: ["state", "prov", "region"],
  leads: ["lead", "lead setter", "leads", "leadsetters"],
  assists: ["assistant", "assistants", "assistant setter", "assistantsetters"],
};

export const SETTER_MAPPING = {
  name: ["setter", "name"],
  leads: ["leads"],
  assists: ["assist", "assists", "assistant"],
  sets: ["sets", "total sets"],
  country: ["country", "nation"],
  flag: ["flag", "emoji", "region"],
  ig: ["ig", "instagram"],
  contribution: ["🪙", "contribution"],
  cert: ["cert", "level", "certification"],
  location: ["location", "city"],
  homeGym: ["gym", "home gym"],
};

export const LIVE_FEED_MAPPING = {
  athlete: ["athlete", "name", "player"],
  course: ["course", "track", "level"],
  result: ["result", "time", "pb"],
  gender: ["div", "gender", "sex"],
  date: ["date", "day", "timestamp"],
  tag: ["tag", "event", "category", "season"],
  proof: ["proof", "link", "video", "url"],
  fire: ["🔥"],
  filmer: ["filmer", "videographer", "filmed by"],
};

export const processRankingData = (csv: string, gender: string) => {
  const dataRows = csvToObjects(csv, RANKING_MAPPING);
  return dataRows
    .map((vals, i) => {
      const pName = (vals.name || "").trim() || "UNKNOWN";
      if (pName.length < 2 || isPlaceholderPlayer(pName)) return null;

      const fixed = fixCountryEntity(vals.country, vals.flag);
      const rawIg = (vals.ig || "")
        .replace(/(https?:\/\/)?(www\.)?instagram\.com\//i, "")
        .replace(/\?.*/, "")
        .replace(/@/g, "")
        .replace(/\/$/, "")
        .trim();

      const pLocation =
        (vals.__raw ? vals.__raw[18] || "" : vals.location || "").trim() ||
        CONFIG.FALLBACKS.UNKNOWN_LOCATION;
      const pHomeGym =
        (vals.__raw ? vals.__raw[20] || "" : vals.homeGym || "").trim() ||
        CONFIG.FALLBACKS.UNAFFILIATED;
      const pTeamLocation = (vals.__raw ? vals.__raw[21] || "" : "").trim();

      const pTeams: TeamProfile[] = [];
      if (vals.__raw) {
        // Check for team slots: (X,Y,Z), (AA,AB,AC), (AD,AE,AF)
        for (let j = 23; j <= 31; j += 3) {
          const tName = (vals.__raw[j] || "").trim();
          if (tName && tName.toUpperCase() !== "UNAFFILIATED") {
            pTeams.push({
              name: tName,
              location: (vals.__raw[j + 1] || "").trim(),
              flag: (vals.__raw[j + 2] || "").trim(),
            });
          }
        }
      }

      const townFlagRaw = (vals.__raw ? vals.__raw[19] || "" : "").trim();
      const gymFlagRaw = (vals.__raw ? vals.__raw[22] || "" : "").trim();
      const townEntity = fixCountryEntity("", townFlagRaw);
      const gymEntity = fixCountryEntity("", gymFlagRaw);

      const teamNamesStr = pTeams.map((t) => t.name).join(" ");
      const searchKey = normalizeForSearch(
        `${pName} ${fixed.name} ${rawIg} ${pLocation} ${pHomeGym} ${teamNamesStr}`
      );
      return {
        id: `${gender}-${normalizeName(pName)}-${i}`,
        name: pName,
        pKey: normalizeName(pName),
        gender,
        countryName: fixed.name,
        region: fixed.flag,
        location: pLocation,
        homeGym: pHomeGym,
        teams: pTeams,
        teamLocation: pTeamLocation,
        townFlag: townEntity.flag,
        gymFlag: gymEntity.flag,
        igHandle: rawIg,
        rating: cleanNumeric(vals.rating) || 0,
        runs: Math.floor(cleanNumeric(vals.runs) || 0),
        wins: Math.floor(cleanNumeric(vals.wins) || 0),
        pts: cleanNumeric(vals.pts) || 0,
        sets: Math.floor(cleanNumeric(vals.sets) || 0),
        contributionScore: cleanNumeric(vals.contribution) || 0,
        allTimeFireCount: Math.floor(cleanNumeric(vals.fire) || 0),
        avgTime: cleanNumeric(vals.avg) || 0,
        certLevel: (vals.cert || "").trim().toUpperCase() || "NONE",
        searchKey,
      };
    })
    .filter(Boolean);
};

export const processSetListData = (csv: string) => {
  const dataRows = csvToObjects(csv, SET_LIST_MAPPING);
  const map: Record<string, CourseData> = {};
  dataRows.forEach((vals) => {
    const course = (vals.course || "").trim().toUpperCase();
    if (course) {
      const fixed = fixCountryEntity(vals.country, vals.flag);
      const valAG = vals.__raw
        ? String(vals.__raw[32] || "")
            .toUpperCase()
            .trim()
        : "";
      const rulesVideoFromCol = vals.__raw
        ? String(vals.__raw[31] || "").trim()
        : "";
      const sponsorName = vals.__raw ? (vals.__raw[34] || "").trim() : "";
      const sponsorLink = vals.__raw ? (vals.__raw[35] || "").trim() : "";

      const is2026 =
        valAG === "YES" || valAG === "TRUE" || valAG.includes("OPEN");
      const leadsRaw = (vals.leads || "").trim();
      const assistsRaw = (vals.assists || "").trim();

      map[course] = {
        name: course,
        is2026,
        flag: fixed.flag || "🏳️",
        city: (vals.city || "").trim().toUpperCase() || "UNKNOWN",
        stateProv: (vals.state || "").trim().toUpperCase(),
        country: fixed.name.toUpperCase() || "UNKNOWN",
        difficulty: (vals.rating || "").trim(),
        length: (vals.length || "").trim(),
        elevation: (vals.elevation || "").trim(),
        type: (vals.type || "").trim(),
        dateSet: (vals.dateSet || "").trim(),
        setter: leadsRaw + (assistsRaw ? `, ${assistsRaw}` : ""),
        leadSetters: leadsRaw,
        leadSettersNormalized: getNormalizedNameList(leadsRaw),
        assistantsetters: assistsRaw,
        assistantSettersNormalized: getNormalizedNameList(assistsRaw),
        demoVideo: rulesVideoFromCol || (vals.demo || "").trim(),
        coverImage: (vals.coverImage || "").trim(),
        coordinates: (vals.coords || "").trim(),
        sponsorName,
        sponsorLink,
        searchKey: normalizeForSearch(
          `${course} ${vals.city} ${vals.state || ""} ${fixed.name} ${(vals.city || "").replace(/ /g, "")}`
        ),
      };
    }
  });
  return map;
};

export const processSettersData = (csv: string) => {
  const dataRows = csvToObjects(csv, SETTER_MAPPING);
  return dataRows
    .map((vals, i) => {
      const name = (vals.name || "").trim();
      if (!name || isPlaceholderPlayer(name)) return null;
      const fixed = fixCountryEntity(vals.country, vals.flag);

      const pLocation =
        (vals.__raw ? vals.__raw[18] || "" : vals.location || "").trim() ||
        CONFIG.FALLBACKS.UNKNOWN_LOCATION;
      const pHomeGym =
        (vals.__raw ? vals.__raw[20] || "" : vals.homeGym || "").trim() ||
        CONFIG.FALLBACKS.UNAFFILIATED;

      const townFlagRaw = (vals.__raw ? vals.__raw[19] || "" : "").trim();
      const gymFlagRaw = (vals.__raw ? vals.__raw[22] || "" : "").trim();
      const townEntity = fixCountryEntity("", townFlagRaw);
      const gymEntity = fixCountryEntity("", gymFlagRaw);

      const pTeams: TeamProfile[] = [];
      if (vals.__raw) {
        for (let j = 23; j <= 31; j += 3) {
          const tName = (vals.__raw[j] || "").trim();
          if (tName && tName.toUpperCase() !== "UNAFFILIATED") {
            pTeams.push({
              name: tName,
              location: (vals.__raw[j + 1] || "").trim(),
              flag: (vals.__raw[j + 2] || "").trim(),
            });
          }
        }
      }

      const teamNamesStr = pTeams.map((t) => t.name).join(" ");
      return {
        id: `setter-${normalizeName(name)}-${i}`,
        name,
        pKey: normalizeName(name),
        region: fixed.flag || "🏳️",
        location: pLocation,
        homeGym: pHomeGym,
        teams: pTeams,
        townFlag: townEntity.flag,
        gymFlag: gymEntity.flag,
        countryName: fixed.name,
        igHandle: (vals.ig || "").replace(/@/g, "").trim(),
        sets: cleanNumeric(vals.sets) || 0,
        leads: cleanNumeric(vals.leads) || 0,
        assists: cleanNumeric(vals.assists) || 0,
        contributionScore: cleanNumeric(vals.contribution) || 0,
        certLevel: (vals.cert || "").trim().toUpperCase() || "NONE",
        searchKey: normalizeForSearch(
          `${name} ${fixed.name} ${pLocation} ${pHomeGym} ${teamNamesStr}`
        ),
      };
    })
    .filter(Boolean);
};

export const processLiveFeedData = (
  csv: string,
  athleteMetadata: Record<string, PlayerProfile> = {},
  courseSetMap: Record<string, string[]> = {},
) => {
  const result: Record<string, unknown> = {
    allTimePerformances: {},
    openPerformances: {},
    openRankings: [],
    allTimeLeaderboards: { M: {}, F: {} },
    openLeaderboards: { M: {}, F: {} },
    athleteMetadata,
    athleteDisplayNameMap: {},
    courseMetadata: courseSetMap,
    atRawBest: {},
    opRawBest: {},
    filmerCredits: {},
    recentFeed: [],
  };
  if (!csv) return result;
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  let hIdx = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (/athlete|name|course|track|pb|result/i.test(lines[i])) {
      hIdx = i;
      break;
    }
  }
  if (hIdx === -1) return result;

  const dataRows = csvToObjects(csv, LIVE_FEED_MAPPING, hIdx);
  const OPEN_START = new Date(CONFIG.DATES.OPEN_START);
  const OPEN_END = new Date(CONFIG.DATES.OPEN_END);
  const allTimeAthleteBestTimes: Record<string, { [loc: string]: number }> = {};
  const allTimeCourseLeaderboards: { M: Record<string, unknown>; F: Record<string, unknown> } = { M: {}, F: {} };
  const openAthleteBestTimes: Record<string, { [loc: string]: number }> = {};
  const openCourseLeaderboards: { M: Record<string, unknown>; F: Record<string, unknown> } = { M: {}, F: {} };
  const openAthleteTotalSubmissions: Record<string, number> = {};
  const athleteDisplayNameMap: Record<string, string> = {};
  const filmerCreditsCount: Record<string, number> = {};
  const courseRunsHistory: Record<string, unknown[]> = {};

  dataRows.forEach((vals) => {
    const pName = (vals.athlete || "").trim();
    const rawCourse = (vals.course || "").trim();
    const numericValue = cleanNumeric(vals.result);
    if (!pName || !rawCourse || numericValue === null) return;

    const rawGenderValue = (vals.gender || "").toUpperCase().trim();
    const baseKey = normalizeName(pName);
    const pGender =
      athleteMetadata[baseKey]?.gender ||
      (rawGenderValue.startsWith("W") || rawGenderValue.startsWith("F")
        ? "F"
        : "M");

    let pKey = baseKey;
    if (isPlaceholderPlayer(pName))
      pKey = `${baseKey}-${pGender.toLowerCase()}`;

    const normC = rawCourse.toUpperCase();
    const isCourseOpen = courseSetMap[normC]?.is2026;

    if (!isPlaceholderPlayer(pName)) {
      if (!courseRunsHistory[normC]) courseRunsHistory[normC] = [];
      courseRunsHistory[normC].push({
        pKey,
        athlete: pName,
        gender: pGender,
        course: rawCourse,
        num: numericValue,
        time: numericValue,
        videoUrl: vals.proof || (vals.__raw && vals.__raw[7]) || "",
        date: vals.date ? new Date(vals.date).toISOString() : null,
      });
    }

    if (!athleteDisplayNameMap[pKey]) athleteDisplayNameMap[pKey] = pName;

    const rawFilmer = (
      vals.filmer ||
      (vals.__raw && vals.__raw[8]) ||
      ""
    ).trim();
    if (rawFilmer) {
      const filmerKey = normalizeName(rawFilmer);
      filmerCreditsCount[filmerKey] = (filmerCreditsCount[filmerKey] || 0) + 1;
    }

    if (!athleteMetadata[pKey]) {
      athleteMetadata[pKey] = {
        pKey,
        name: pName,
        gender: pGender,
        region: "🏳️",
        location: "",
        homeGym: "",
        teamLocation: "",
        countryName: "",
        searchKey: normalizeForSearch(pName),
      };
    } else if (pName.length > (athleteMetadata[pKey].name || "").length) {
      athleteMetadata[pKey].name = pName;
      athleteDisplayNameMap[pKey] = pName;
    }

    if (!allTimeAthleteBestTimes[pKey]) allTimeAthleteBestTimes[pKey] = {};
    if (
      !allTimeAthleteBestTimes[pKey][normC] ||
      numericValue < allTimeAthleteBestTimes[pKey][normC].num
    ) {
      allTimeAthleteBestTimes[pKey][normC] = {
        label: rawCourse,
        value: vals.result,
        num: numericValue,
        videoUrl: vals.proof || (vals.__raw && vals.__raw[7]) || "",
        date: vals.date ? new Date(vals.date).toISOString() : null,
      };
    }
    if (!allTimeCourseLeaderboards[pGender][normC])
      allTimeCourseLeaderboards[pGender][normC] = {};
    if (
      !allTimeCourseLeaderboards[pGender][normC][pKey] ||
      numericValue < allTimeCourseLeaderboards[pGender][normC][pKey]
    ) {
      allTimeCourseLeaderboards[pGender][normC][pKey] = numericValue;
    }
    const runDate = vals.date ? new Date(vals.date) : null;
    const isASROpenTag = (vals.tag || "").toUpperCase().includes("OPEN");
    const isInOpenWindow =
      runDate &&
      !isNaN(runDate.getTime()) &&
      runDate >= OPEN_START &&
      runDate <= OPEN_END;

    if ((isASROpenTag || isInOpenWindow) && isCourseOpen) {
      if (!openAthleteBestTimes[pKey]) openAthleteBestTimes[pKey] = {};
      if (
        !openAthleteBestTimes[pKey][normC] ||
        numericValue < openAthleteBestTimes[pKey][normC].num
      ) {
        openAthleteBestTimes[pKey][normC] = {
          label: rawCourse,
          value: vals.result,
          num: numericValue,
          videoUrl: vals.proof || (vals.__raw && vals.__raw[7]) || "",
          date: vals.date ? new Date(vals.date).toISOString() : null,
        };
      }
      if (!openCourseLeaderboards[pGender][normC])
        openCourseLeaderboards[pGender][normC] = {};
      if (
        !openCourseLeaderboards[pGender][normC][pKey] ||
        numericValue < openCourseLeaderboards[pGender][normC][pKey]
      ) {
        openCourseLeaderboards[pGender][normC][pKey] = numericValue;
      }
      openAthleteTotalSubmissions[pKey] =
        (openAthleteTotalSubmissions[pKey] || 0) + 1;
    }
  });

  const buildPerfs = (source: Record<string, { [loc: string]: { label: string, value: string, num: number, videoUrl: string, date: string | null } }>, isAllTimeBuild = false) => {
    const res: Record<string, unknown[]> = {};
    const memoizedBoards: Record<
      string,
      { record: number; rankMap: Map<string, number> }
    > = {};

    Object.keys(source).forEach((pKey) => {
      const pGender = athleteMetadata[pKey]?.gender || "M";
      let fireTotal = 0;
      res[pKey] = Object.entries(source[pKey]).map(
        ([normL, data]: [string, { label: string, value: string, num: number, videoUrl: string, date: string | null }]) => {
          const boardKey = `${pGender}-${normL}`;
          if (!memoizedBoards[boardKey]) {
            const board =
              (allTimeCourseLeaderboards[pGender] || {})[normL] || {};
            const vals = Object.values(board) as number[];
            const record = vals.length ? Math.min(...vals) : 0;
            const sorted = Object.entries(board).sort(
              (a: [string, unknown], b: [string, unknown]) => (a[1] as number) - (b[1] as number),
            );
            const rankMap = new Map<string, number>();
            sorted.forEach((e, idx) => rankMap.set(e[0], idx + 1));
            memoizedBoards[boardKey] = { record, rankMap };
          }

          const { record, rankMap } = memoizedBoards[boardKey];
          const rank = rankMap.get(pKey) || 0;
          const fires = getFireCountForRun(data.num, pGender);
          const courseMeta = courseSetMap[normL] || {};
          fireTotal += fires;
          return {
            label: data.label,
            value: data.value,
            num: data.num,
            rank,
            points: record && data.num ? (record / data.num) * 100 : 0,
            videoUrl: data.videoUrl,
            date: data.date,
            fireCount: fires,
            city: courseMeta.city,
            country: courseMeta.country,
            location: courseMeta.city || courseMeta.country,
          };
        },
      );

      if (athleteMetadata[pKey]) {
        if (isAllTimeBuild) {
          if (
            !athleteMetadata[pKey].allTimeFireCount ||
            fireTotal > athleteMetadata[pKey].allTimeFireCount
          ) {
            athleteMetadata[pKey].allTimeFireCount = fireTotal;
          }
        } else {
          athleteMetadata[pKey].openFireCount = fireTotal;
        }
        athleteMetadata[pKey].films = filmerCreditsCount[pKey] || 0;
      }
    });
    return res;
  };

  result.allTimePerformances = buildPerfs(allTimeAthleteBestTimes, true);
  result.openPerformances = buildPerfs(openAthleteBestTimes, false);
  result.allTimeLeaderboards = allTimeCourseLeaderboards;
  result.openLeaderboards = openCourseLeaderboards;
  result.athleteDisplayNameMap = athleteDisplayNameMap;
  result.courseRunsHistory = courseRunsHistory;
  result.atRawBest = allTimeAthleteBestTimes;
  result.opRawBest = openAthleteBestTimes;
  result.filmerCredits = filmerCreditsCount;

  const chronologicalRuns = [...dataRows]
    .filter((run: Record<string, unknown>) => !isPlaceholderPlayer((String(run.athlete) || "").trim()))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 100);

  const recentFeedMemoBoards: Record<string, [string, unknown][]> = {};
  result.recentFeed = chronologicalRuns.map((run, i) => {
    const pName = (run.athlete || "").trim();
    const normC = (run.course || "").trim().toUpperCase();
    const numericValue = cleanNumeric(run.result);
    const pKey = normalizeName(pName);
    const athleteMeta = athleteMetadata[pKey];
    const pGender = athleteMeta?.gender || "M";

    const boardKey = `${pGender}-${normC}`;
    let sortedResults = recentFeedMemoBoards[boardKey];
    if (!sortedResults) {
      const courseRecords =
        (allTimeCourseLeaderboards[pGender] || {})[normC] || {};
      sortedResults = Object.entries(courseRecords).sort(
        (a: [string, unknown], b: [string, unknown]) => (a[1] as number) - (b[1] as number),
      );
      recentFeedMemoBoards[boardKey] = sortedResults;
    }

    const runRank =
      sortedResults.findIndex((entry) => entry[1] === numericValue) + 1;
    const fireCount = getFireCountForRun(numericValue as number, pGender);

    return {
      id: `feed-${i}`,
      name: pName,
      athlete: athleteMeta,
      courseName: run.course,
      course: { name: run.course, ...(courseSetMap[normC] || {}) },
      result: run.result,
      isCR: runRank === 1 && !isPlaceholderPlayer(pName),
      rank: runRank,
      fireCount: fireCount,
      timeString: run.date || "LATEST",
    };
  });

  result.openRankings = Object.keys(athleteMetadata)
    .filter((k) => {
      const meta = athleteMetadata[k];
      const perfs = result.openPerformances[k] || [];
      return !isPlaceholderPlayer(meta.name) && perfs.length > 0;
    })
    .map((pKey) => {
      const meta = athleteMetadata[pKey];
      const perfs = result.openPerformances[pKey] || [];
      const totalPts = perfs.reduce((sum: number, p: { points?: number }) => sum + (p.points || 0), 0);
      return {
        ...meta,
        id: `open-${pKey}`,
        rating: perfs.length > 0 ? totalPts / perfs.length : 0,
        runs: perfs.length,
        wins: perfs.filter((p: { rank?: number }) => p.rank === 1).length,
        pts: totalPts,
        sets: openAthleteTotalSubmissions[pKey] || 0,
        openFireCount: perfs.reduce(
          (sum: number, p: { fireCount?: number }) => sum + (p.fireCount || 0),
          0,
        ),
      };
    })
    .sort((a: PlayerProfile & { rating?: number }, b: PlayerProfile & { rating?: number }) => (b.rating || 0) - (a.rating || 0));
  return result;
};

export const getAggregatedStats = (
  rawCourseList: CourseData[],
  groupBy: string,
  dnMap: Record<string, string> = {},
) => {
  const map: Record<string, { key: string; name: string; flag: string; courses: number; runs: number; playersSet: Set<string>; players?: number }> = {};
  (rawCourseList || []).forEach((c) => {
    let name = c[groupBy];
    let flag = c.flag;
    let key = name;
    if (groupBy === "country") {
      const fixed = fixCountryEntity(c.country, c.flag);
      name = fixed.name;
      flag = fixed.flag;
      key = name;
    } else if (groupBy === "continent") {
      if (c.continent === "GLOBAL") return;
      name = c.continent || "OTHER";
      flag = c.continentFlag || "🌐";
      key = name;
    }
    if (!name) return;
    if (!map[key]) {
      map[key] = {
        name,
        flag,
        courses: 0,
        runs: 0,
        playersSet: new Set(),
        coords: c.coords || c.parsedCoords,
        ...(groupBy === "city"
          ? { countryName: c.country, continent: c.continent }
          : {}),
        ...(groupBy === "country" ? { continent: c.continent } : {}),
      };
    }
    const entry = map[key];
    entry.courses++;
    entry.runs += c.totalRuns || 0;
    (c.athletesMAll || []).forEach((a: string | [string, number]) => {
      const pId = Array.isArray(a) ? a[0] : a;
      if (!isPlaceholderPlayer(dnMap[pId] || pId)) entry.playersSet.add(pId);
    });
    (c.athletesFAll || []).forEach((a: string | [string, number]) => {
      const pId = Array.isArray(a) ? a[0] : a;
      if (!isPlaceholderPlayer(dnMap[pId] || pId)) entry.playersSet.add(pId);
    });
  });
  return Object.values(map)
    .map((item) => ({ ...item, players: item.playersSet.size }))
    .sort((a, b) => b.courses - a.courses);
};

export const calculateWofStats = (
  data: PlayerProfile[],
  atPerfs: Record<string, { fireCount?: number }[]>,
  lbAT: { M: Record<string, unknown>; F: Record<string, unknown> },
  atMet: Record<string, PlayerProfile>,
  medalSort: string,
  settersWithImpact: SetterProfile[],
) => {
  try {
    if (!data || !data.length) return null;
    const qualifiedAthletes = data
      .filter((p) => !isPlaceholderPlayer(p.name) && (p.runs || 0) >= 10)
      .map((p) => {
        const performances = atPerfs?.[p.pKey] || [];
        const calculatedFires = performances.reduce(
          (sum: number, run: { fireCount?: number }) => sum + (run.fireCount || 0),
          0,
        );
        return {
          ...p,
          allTimeFireCount: calculatedFires,
          winPercentage: p.runs > 0 ? (p.wins / p.runs) * 100 : 0,
        };
      });
    const medalsBase: Record<string, { gold: number; silver: number; bronze: number; points: number }> = {};
    const processMedals = (lb: Record<string, unknown>) => {
      if (!lb) return;
      Object.entries(lb).forEach(([_courseName, athletes]: [string, unknown]) => {
        if (!athletes) return;
        const athletesRec = athletes as Record<string, number>;
        const filteredEntries = Object.entries(athletesRec).filter(([pKey]) => {
          const name = atMet[pKey]?.name || pKey;
          return !isPlaceholderPlayer(name);
        });
        const sorted = filteredEntries.sort((a, b) => a[1] - b[1]);
        sorted.slice(0, 3).forEach(([pKey, _time], rankIdx) => {
          const athlete = atMet[pKey] || {};
          const names = String(athlete.countryName || "")
            .split(new RegExp("[,/]"))
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
          if (names.length === 0) names.push("UNKNOWN");
          const flags = String(athlete.region || "").match(
            /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g,
          ) || [athlete.region || "🏳️"];
          names.forEach((name, i) => {
            const fixed = fixCountryEntity(name, flags[i] || flags[0]);
            if (!medalsBase[fixed.name])
              medalsBase[fixed.name] = {
                name: fixed.name,
                flag: fixed.flag,
                gold: 0,
                silver: 0,
                bronze: 0,
                total: 0,
              };
            if (rankIdx === 0) medalsBase[fixed.name].gold++;
            else if (rankIdx === 1) medalsBase[fixed.name].silver++;
            else medalsBase[fixed.name].bronze++;
            medalsBase[fixed.name].total++;
          });
        });
      });
    };
    processMedals(lbAT?.M);
    processMedals(lbAT?.F);
    const sortedMedalCount = Object.values(medalsBase)
      .sort(
        (a: { gold: number, silver: number, bronze: number }, b: { gold: number, silver: number, bronze: number }) =>
          b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze,
      )
      .map((c, i) => ({ ...c, displayRank: i + 1 }));
    if (medalSort && medalSort.key) {
      const dir = medalSort.direction === "ascending" ? 1 : -1;
      sortedMedalCount.sort((a, b) => robustSort(a, b, medalSort.key, dir));
    }
    return {
      medalCount: sortedMedalCount,
      topStats: {
        rating: [...qualifiedAthletes]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10),
        runs: [...qualifiedAthletes]
          .sort((a, b) => b.runs - a.runs)
          .slice(0, 10),
        winPercentage: [...qualifiedAthletes]
          .sort((a, b) => b.winPercentage - a.winPercentage || b.runs - a.runs)
          .slice(0, 10),
        wins: [...qualifiedAthletes]
          .sort((a, b) => b.wins - a.wins)
          .slice(0, 10),
        impact: [...(settersWithImpact || [])]
          .sort((a, b) => b.impact - a.impact)
          .slice(0, 10),
        sets: [...(settersWithImpact || [])]
          .sort((a, b) => b.sets - a.sets)
          .slice(0, 10),
        contributionScore: [...qualifiedAthletes]
          .sort((a, b) => b.contributionScore - a.contributionScore)
          .slice(0, 10),
        totalFireCount: [...qualifiedAthletes]
          .sort((a, b) => (b.allTimeFireCount || 0) - (a.allTimeFireCount || 0))
          .slice(0, 10),
      },
    };
  } catch (e) {
    console.error("HOF stats calculation failed", e);
    return null;
  }
};

export const fetchGoogleSheetCSV = async (sheetId: string, gid: string): Promise<string> => {
  const cacheBucket = Math.floor(Date.now() / 300000); // 5 mins cache bucket for gviz
  const directUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&cb=${cacheBucket}`;
  const proxyUrl = `/api/proxy-sheet?gid=${gid}&cb=${cacheBucket}`;

  let response = await fetch(directUrl).catch(() => null);

  if (!response || !response.ok) {
    response = await fetch(proxyUrl);
  }

  if (!response || !response.ok) {
    throw new Error(`Failed to fetch spreadsheet: ${response?.statusText || 'Unknown Network Error'}`);
  }

  return response.text();
};
