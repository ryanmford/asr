import React, { useMemo, useState, useContext } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import {
  MapPin,
  User,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Activity,
  Trophy,
  Users,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppNavigation } from "../../hooks/useDerivedData";
import { ASRGlobalSearch } from "../common/ASRGlobalSearch";
import { CountUp } from "../common/CountUp";
import { ThemeContext } from "../../theme-context";
import { useNavigate } from "react-router-dom";
import { cn, formatFlagsWithSpace, fixCountryEntity } from "../../lib/asr-utils";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export const HomeView = React.memo(() => {
  const navigate = useNavigate();
  const theme = useContext(ThemeContext) as "light" | "dark";
  const masterCourseList = useDataStore((s) => s.masterCourseList);
  const playerList_M_AT = useDataStore((s) => s.playerList_M_AT);
  const playerList_F_AT = useDataStore((s) => s.playerList_F_AT);
  const kpiStats = useDataStore((s) => s.kpiStats);
  const kpiTrends = useDataStore((s) => s.kpiTrends);
  const recentFeed = useDataStore((s) => s.recentFeed);
  const isLoading = useDataStore((s) => s.isLoading);
  const setShowOnboarding = useAppStore((s) => s.setShowOnboarding);
  const setPlayingVideoUrl = useAppStore((s) => s.setPlayingVideoUrl);
  const { navigateToEntity } = useAppNavigation();
  const [visibleRuns, setVisibleRuns] = useState(20);

  const courseList_AT = useDataStore((s) => s.courseList_AT);
  const teamList_gyms_AT = useDataStore((s) => s.teamList_gyms_AT);
  const teamList_teams_AT = useDataStore((s) => s.teamList_teams_AT);

  const { topPlayer, topCourse, dailyRecord } = useMemo(() => {
    // Generate deterministic index based on today's UTC Date.
    const today = new Date();
    const seedStr = `${today.getUTCFullYear()}-${today.getUTCMonth()}-${today.getUTCDate()}`;

    const sRandom = (str: string, max: number) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
      }
      const x = Math.sin(hash) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };

    let pOfDay: Record<string, unknown> | null = null;
    const topM = playerList_M_AT.slice(0, 30);
    const topF = playerList_F_AT.slice(0, 20);
    const combinedP = [...topM, ...topF].filter(Boolean);
    if (combinedP.length > 0) {
      const idx = sRandom(seedStr + "player", combinedP.length);
      pOfDay = combinedP[idx];
      pOfDay._gRank = pOfDay.gender === "F" 
          ? playerList_F_AT.indexOf(pOfDay) + 1 
          : playerList_M_AT.indexOf(pOfDay) + 1;
    }

    let cOfDay: Record<string, unknown> | null = null;
    const sortedCourses = [...courseList_AT].sort((a: any, b: any) => 
       (b.totalAllTimeRuns || b.totalRuns || 0) - (a.totalAllTimeRuns || a.totalRuns || 0)
    ).slice(0, 50);
    if (sortedCourses.length > 0) {
      const idx = sRandom(seedStr + "course", sortedCourses.length);
      cOfDay = sortedCourses[idx];
    }

    let rOfDay: Record<string, unknown> | null = null;
    const coursesWithRecords = sortedCourses.filter((c: any) => {
        const atM = c.allTimeAthletesM || [];
        const atF = c.allTimeAthletesF || [];
        const mHasVideo = atM.length > 1 && !!atM[0]?.[2];
        const fHasVideo = atF.length > 1 && !!atF[0]?.[2];
        return mHasVideo || fHasVideo;
    });

    if (coursesWithRecords.length > 0) {
       const idx = sRandom(seedStr + "record", coursesWithRecords.length);
       const targetCourse = coursesWithRecords[idx] as any;
       const atM = targetCourse.allTimeAthletesM || [];
       const atF = targetCourse.allTimeAthletesF || [];
       const mHasVideo = atM.length > 1 && !!atM[0]?.[2];
       const fHasVideo = atF.length > 1 && !!atF[0]?.[2];
       let pickM = mHasVideo;
       if (mHasVideo && fHasVideo) {
         pickM = sRandom(seedStr + "record_gender", 2) === 0;
       }
       const bestRun = pickM ? atM[0] : atF[0];

       const pObj = [...playerList_M_AT, ...playerList_F_AT].find((p: any) => p.name === bestRun[0]);
       const pFlag = pObj ? (pObj.townFlag || pObj.gymFlag || pObj.country || pObj.region || "") : "";
       const pFlagFmt = pFlag ? `${formatFlagsWithSpace(pFlag).trim()} ` : "";

       const cFlag = targetCourse.flag || targetCourse.region || targetCourse.country || "";
       const cFlagFmt = cFlag ? `${formatFlagsWithSpace(cFlag).trim()} ` : "";

       rOfDay = {
         athleteName: `${pFlagFmt}${bestRun[0]}`,
         time: bestRun[1].toFixed(2),
         videoUrl: bestRun[2],
         courseName: `${cFlagFmt}${targetCourse.name}`,
         course: targetCourse,
       };
    }

    return { topPlayer: pOfDay, topCourse: cOfDay, dailyRecord: rOfDay };
  }, [playerList_M_AT, playerList_F_AT, courseList_AT]);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [autoPlayTimer, setAutoPlayTimer] = useState(0);

  const featureList = useMemo(() => {
    const list = [];
    
    // 1. Run of the Day
    if (dailyRecord) {
      list.push({
        type: "video",
        data: { name: dailyRecord.courseName, videoUrl: dailyRecord.videoUrl }, 
        displayName: dailyRecord.athleteName,
        label: "Run of the Day",
        icon: <Timer className="w-4 h-4" />,
        color: "text-purple-500",
        shadowColor: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
        borderHover: "hover:shadow-purple-500/40 ring-1 ring-purple-500/20",
        bg: "bg-purple-500/10",
        hoverBg: "group-hover:bg-purple-500",
        hoverText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
        metrics: [
          { label: "Course", value: dailyRecord.courseName },
          { label: "Time", value: <>{dailyRecord.time} <span className="inline-block animate-bounce ml-0.5">🥇</span></> },
        ],
      });
    }

    // 2. Player of the Day
    if (topPlayer) {
      const playerFlag = topPlayer.townFlag || topPlayer.gymFlag;
      list.push({
        type: "player",
        data: topPlayer,
        displayName: playerFlag
          ? `${formatFlagsWithSpace(playerFlag).trim()} ${topPlayer.name}`
          : topPlayer.name,
        label: "Player of the Day",
        icon: <User className="w-4 h-4" />,
        color: "text-blue-500",
        shadowColor: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        borderHover: "hover:shadow-blue-500/40 ring-1 ring-blue-500/20",
        bg: "bg-blue-500/10",
        hoverBg: "group-hover:bg-blue-500",
        hoverText: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
        metrics: [
          { label: "Rank", value: topPlayer._gRank },
          { label: "LQ", value: topPlayer.rating?.toFixed(2) || "0.00" },
          { label: "Wins", value: topPlayer.wins || 0 },
        ],
      });
    }

    // 3. Course of the Day
    if (topCourse) {
      const courseFlag = topCourse.flag;
      list.push({
        type: "course",
        data: topCourse,
        displayName: courseFlag
          ? `${formatFlagsWithSpace(courseFlag).trim()} ${topCourse.name}`
          : topCourse.name,
        label: "Course of the Day",
        icon: <MapPin className="w-4 h-4" />,
        color: "text-emerald-500",
        shadowColor: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
        borderHover: "hover:shadow-emerald-500/40 ring-1 ring-emerald-500/20",
        bg: "bg-emerald-500/10",
        hoverBg: "group-hover:bg-emerald-500",
        hoverText:
          "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
        metrics: [
          {
            label: "Runs",
            value: topCourse.totalAllTimeRuns || topCourse.totalRuns || 0,
          },
          {
            label: "CR (M)",
            value: topCourse.mRecord ? topCourse.mRecord.toFixed(2) : "--",
          },
          {
            label: "CR (W)",
            value: topCourse.fRecord ? topCourse.fRecord.toFixed(2) : "--",
          },
        ],
      });
    }

    return list;
  }, [topPlayer, topCourse, dailyRecord]);

  React.useEffect(() => {
    if (featureList.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlayTimer, featureList.length]);

  const currentFeature =
    featureList.length > 0
      ? featureList[
          ((carouselIndex % featureList.length) + featureList.length) %
            featureList.length
        ]
      : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const {
    kpi,
    totalGyms,
    totalTeams,
    totalMedals,
    medalsTrendData,
    playersTrendData,
    coursesTrendData,
  } = useMemo(() => {
    const kpiData = (kpiStats as Record<string, unknown>) || {};

    const tGyms = Math.max(
      teamList_gyms_AT?.length || 0,
      1,
    );
    const tTeams = Math.max(
      teamList_teams_AT?.length || 0,
      1,
    );
    const tMedals = masterCourseList.reduce((acc, c: Record<string, unknown>) => {
      const mCount = Math.min(3, (c.allTimeAthletesM as unknown[])?.length || 0);
      const fCount = Math.min(3, (c.allTimeAthletesF as unknown[])?.length || 0);
      return acc + mCount + fCount;
    }, 0);

    const pTrendData = kpiTrends?.players || [];
    const cTrendData = kpiTrends?.courses || [];

    const medalsMultiplier = kpiData.courses ? tMedals / (kpiData.courses as number) : 6;
    const mTrendData = cTrendData.map((d: Record<string, unknown>) => ({
      value: Math.round((d.value as number) * medalsMultiplier),
    }));

    return {
      kpi: kpiData,
      totalGyms: tGyms,
      totalTeams: tTeams,
      totalMedals: tMedals,
      medalsTrendData: mTrendData,
      playersTrendData: pTrendData,
      coursesTrendData: cTrendData,
    };
  }, [kpiStats, teamList_gyms_AT, teamList_teams_AT, masterCourseList, kpiTrends]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 pt-0 sm:pt-1 pb-24 gap-2 sm:gap-4"
    >
      {/* Global Search */}
      <motion.div
        variants={itemVariants}
        className={cn(
          "py-2 sm:py-3 -mx-4 sticky z-[50] backdrop-blur-3xl border-b transition-all shadow-sm mb-1",
          theme === "dark"
            ? "border-white/5 bg-zinc-950/80"
            : "border-black/5 bg-white/80",
          "top-[calc(68px+env(safe-area-inset-top,0px))] sm:top-[calc(76px+env(safe-area-inset-top,0px))]",
        )}
      >
        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto px-4">
          <ASRGlobalSearch theme={theme} />
        </div>
      </motion.div>

      {/* Hero Header CTA */}
      <motion.div
        variants={itemVariants}
        className={cn(
          "relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden px-4 py-6 sm:py-8 lg:py-12 flex flex-col items-center justify-center gap-2 sm:gap-4 w-full text-center shrink-0 border transition-all duration-500",
          theme === "dark" ? "bg-[#0A0A0A] border-white/5 shadow-2xl" : "bg-white border-black/5 shadow-xl",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            theme === "dark"
              ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950"
              : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white",
          )}
        ></div>

        {/* Animated Mesh / Orbs */}
        <div
          className={cn(
            "absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 blur-[100px] rounded-full animate-[pulse_8s_ease-in-out_infinite] pointer-events-none",
            theme === "dark"
              ? "bg-blue-600/30 mix-blend-screen"
              : "bg-blue-500/20 mix-blend-multiply",
          )}
        ></div>
        <div
          className={cn(
            "absolute bottom-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 blur-[100px] rounded-full animate-[pulse_12s_ease-in-out_infinite] pointer-events-none",
            theme === "dark"
              ? "bg-indigo-600/30 mix-blend-screen"
              : "bg-indigo-400/20 mix-blend-multiply",
          )}
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none animate-[spin_120s_linear_infinite]",
            theme === "dark"
              ? "mix-blend-overlay"
              : "opacity-[0.03] mix-blend-darken",
          )}
        ></div>

        <div className="relative z-10 flex flex-col items-center max-w-5xl space-y-4 sm:space-y-6 w-full mx-auto pb-4">
          <div className="w-full flex flex-col items-center justify-center">
            <h1 className={cn(
              "font-black tracking-tighter leading-[1] uppercase flex flex-col items-center justify-center text-center w-full max-w-full overflow-visible",
              "italic transform -skew-x-6",
              theme === "dark" ? "text-white" : "text-zinc-900"
            )}>
              <span className="block whitespace-nowrap text-[6vw] min-[400px]:text-[6.5vw] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                FINDING THE FASTEST
              </span>
              <span className="block whitespace-nowrap text-[6vw] min-[400px]:text-[6.5vw] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mt-1 md:mt-3">
                IN THE REAL WORLD <span className="inline-block transform skew-x-6 ml-1 md:ml-3 animate-pulse">🔥</span>
              </span>
            </h1>
          </div>
          <div className="flex w-full sm:max-w-xs mt-4 sm:mt-8 mx-auto">
            <button
              className="group relative px-6 py-3 sm:py-4 w-full overflow-hidden rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg tracking-wide text-white transition-all duration-150 active:scale-[0.98]"
              onClick={() => setShowOnboarding(true)}
              onTouchStart={() => {}}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase drop-shadow-sm">
                Get Started
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Featured Section */}
      {isLoading ? (
        <motion.div
          variants={itemVariants}
          className="relative w-full min-h-[120px] bg-black/5 dark:bg-white/5 rounded-3xl p-6 flex flex-row items-center justify-between animate-pulse"
        >
          <div className="flex flex-col gap-3">
            <div className="w-24 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
            <div className="w-48 h-6 bg-black/10 dark:bg-white/10 rounded-lg mb-2" />
            <div className="flex gap-4">
              <div className="w-12 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-12 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-12 h-6 bg-black/10 dark:bg-white/10 rounded-lg" />
            </div>
          </div>
          <div className="w-12 h-12 bg-black/10 dark:bg-white/10 rounded-full flex-shrink-0 ml-4" />
        </motion.div>
      ) : (
        currentFeature && (
          <motion.div variants={itemVariants} className="w-full">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (currentFeature.type === "video") {
                  setPlayingVideoUrl((currentFeature.data as { videoUrl: string }).videoUrl);
                } else {
                  navigateToEntity(currentFeature.type, currentFeature.data);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (currentFeature.type === "video") {
                    setPlayingVideoUrl((currentFeature.data as { videoUrl: string }).videoUrl);
                  } else {
                    navigateToEntity(currentFeature.type, currentFeature.data);
                  }
                }
              }}
              className={cn(
                "relative text-left w-full min-h-[160px] flex flex-row items-center justify-between rounded-[2rem] p-5 pb-10 sm:p-8 sm:pb-14 cursor-pointer group overflow-hidden bg-black/5 dark:bg-white/5 transition-all hover:-translate-y-1 active:-translate-y-1 active:scale-[0.98] focus:outline-none appearance-none",
              )}
            >
              <div className="flex-1 flex min-w-0 pr-4 md:pr-6 relative z-30 self-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeature.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col md:flex-row md:items-center relative w-full min-w-0 gap-3 md:gap-4 md:justify-between"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-[10px] sm:text-xs md:text-[11px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5",
                          currentFeature.color,
                        )}
                      >
                        {currentFeature.icon} {currentFeature.label}
                      </div>
                      <div
                        className={cn(
                          "font-black text-zinc-900 dark:text-white transition-colors uppercase leading-none md:leading-none break-words whitespace-normal max-h-[4rem] overflow-hidden line-clamp-2 w-full",
                          (
                            currentFeature.displayName ||
                            currentFeature.data.name
                          ).length > 22
                            ? "text-base sm:text-lg md:text-xl"
                            : (
                                  currentFeature.displayName ||
                                  currentFeature.data.name
                                ).length > 15
                              ? "text-lg sm:text-xl md:text-2xl"
                              : "text-xl sm:text-2xl md:text-3xl",
                          currentFeature.hoverText,
                        )}
                      >
                        {currentFeature.displayName || currentFeature.data.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 md:pl-4">
                      {currentFeature.metrics.map(
                        (
                          m: { label: string; value: React.ReactNode },
                          i: number,
                        ) => {
                          const valStr = typeof m.value === 'string' || typeof m.value === 'number' ? String(m.value) : "";
                          const len = valStr.length || 5; // default to 5 for ReactNode (like time + emoji)
                          return (
                          <div key={i} className="flex flex-col min-w-0 flex-shrink">
                            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest break-words w-full">
                              {m.label}
                            </span>
                            <span className={cn(
                              "font-black text-zinc-900 dark:text-white flex flex-wrap items-center mt-0.5 leading-none break-words w-full max-w-[120px] sm:max-w-[180px]",
                              len > 15 ? "text-xs sm:text-sm md:text-base leading-tight"
                              : len > 10 ? "text-sm sm:text-base md:text-lg leading-tight"
                              : "text-base sm:text-lg md:text-xl"
                            )}>
                              {m.value}
                            </span>
                          </div>
                        )}
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex flex-shrink-0 items-center justify-center relative z-30 transition-all transform group-hover:scale-110 shadow-lg shadow-black/5 group-hover:text-white shrink-0 self-center",
                  currentFeature.bg,
                  currentFeature.color,
                  currentFeature.hoverBg,
                )}
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              {/* Pagination Dots */}
              {featureList.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-3 left-0 right-0 flex justify-center gap-1.5 z-40">
                  {featureList.map((_, idx) => {
                    const isActive =
                      idx ===
                      ((carouselIndex % featureList.length) +
                        featureList.length) %
                        featureList.length;
                    return (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(idx);
                          setAutoPlayTimer(t => t + 1);
                        }}
                        className="w-10 h-10 flex items-center justify-center group/dot focus:outline-none"
                        aria-label={`Go to slide ${idx + 1}`}
                      >
                        <div
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            isActive
                              ? cn("w-4", currentFeature.color) // Match dot color to feature text color
                              : "w-1.5 bg-black/20 dark:bg-white/20 group-hover/dot:bg-black/40 dark:group-hover/dot:bg-white/40",
                          )}
                          style={
                            isActive ? { backgroundColor: "currentColor" } : {}
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )
      )}

      {/* Unified Stats & Navigation Cards */}
      {isLoading ? (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-black/5 dark:bg-white/5 rounded-3xl p-6 h-[260px] flex flex-col items-center justify-center gap-4 animate-pulse"
            >
              <div className="w-8 h-8 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-20 h-10 bg-black/10 dark:bg-white/10 rounded-lg" />
              <div className="w-16 h-4 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-full h-12 bg-black/10 dark:bg-white/10 rounded-xl mt-4" />
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: PLAYERS & RUNS */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/players")}
          >
            {/* Sparkline bg */}
            <div className="absolute inset-x-0 bottom-0 top-1/4 opacity-20 pointer-events-none transition-opacity flex items-end mask-image-bottom">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={playersTrendData}>
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-top-right">
              <User className="w-12 h-12 text-blue-500/20 dark:text-blue-500/30 group-hover:text-blue-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
                Players
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                View leaderboards & runs
              </p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={kpi.players || 0} />
                  </strong>{" "}
                  PLAYERS
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={kpi.runs || 0} />
                  </strong>{" "}
                  RUNS
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>

          {/* Card 2: COURSES */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/courses")}
          >
            {/* Sparkline bg */}
            <div className="absolute inset-x-0 bottom-0 top-1/4 opacity-20 pointer-events-none transition-opacity flex items-end mask-image-bottom">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coursesTrendData}>
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-top-right">
              <MapPin className="w-12 h-12 text-emerald-500/20 dark:text-emerald-500/30 group-hover:text-emerald-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
                Courses
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Explore locations globally
              </p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={kpi.courses || 0} />
                  </strong>{" "}
                  COURSES
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 hidden lg:inline">
                  •
                </span>
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={kpi.cities || 0} />
                  </strong>{" "}
                  CITIES
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 hidden lg:inline">
                  •
                </span>
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={kpi.countries || 0} />
                  </strong>{" "}
                  COUNTRIES
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>

          {/* Card 3: GYMS & TEAMS */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/teams")}
          >
            {/* Sparkline bg */}
            <div className="absolute inset-x-0 bottom-0 top-1/4 opacity-20 pointer-events-none transition-opacity flex items-end mask-image-bottom">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={playersTrendData}>
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 origin-top-right">
              <Users className="w-12 h-12 text-indigo-500/20 dark:text-indigo-500/30 group-hover:text-indigo-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
                Gyms & Teams
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                Join squads and local gyms
              </p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={totalTeams || 0} />
                  </strong>{" "}
                  TEAMS
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={totalGyms || 0} />
                  </strong>{" "}
                  GYMS
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>

          {/* Card 4: HALL OF FAME */}
          <div
            className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start text-left cursor-pointer transition-all duration-300 group hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-1 active:scale-[0.98] active:bg-black/10 dark:active:bg-white/10 min-h-[220px]"
            onClick={() => navigate("/hof")}
          >
            {/* Sparkline bg */}
            <div className="absolute inset-x-0 bottom-0 top-1/4 opacity-20 pointer-events-none transition-opacity flex items-end mask-image-bottom">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={medalsTrendData}>
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="absolute top-0 right-0 p-6 pointer-events-none z-30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12 origin-top-right">
              <Trophy className="w-12 h-12 text-amber-500/20 dark:text-amber-500/30 group-hover:text-amber-500/40 transition-colors" />
            </div>

            <div className="flex flex-col items-start gap-1 z-10 w-full relative pt-2">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
                Hall of Fame
              </h2>
              <p className="text-sm font-medium text-zinc-500">
                All-time legends & medals
              </p>
            </div>

            <div className="mt-auto pt-8 w-full flex items-center justify-between z-10 text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono font-medium">
                <span className="flex items-baseline gap-1">
                  <strong className="text-zinc-900 dark:text-white tabular-nums text-sm sm:text-base">
                    <CountUp end={totalMedals || 0} />
                  </strong>{" "}
                  MEDALS
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      {(isLoading || (recentFeed && recentFeed.length > 0)) && (
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 mt-2 sm:mt-4"
        >
          <div className="flex items-center gap-2 px-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Recent Runs
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-black/5 to-transparent dark:from-white/5 ml-2" />
          </div>

          <div className="relative pl-4 sm:pl-6 sm:pr-2">
            {/* Timeline Axis */}
            <div className="absolute top-4 bottom-4 left-[27.5px] sm:left-[39.5px] w-px bg-gradient-to-b from-zinc-500/50 via-zinc-500/20 to-transparent" />

            <div className="flex flex-col gap-4 relative z-10">
              {isLoading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-start gap-4 sm:gap-6 mt-2"
                    >
                      <div className="relative mt-1.5 flex-shrink-0 z-20">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 animate-pulse" />
                      </div>
                      <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-2xl p-4 sm:p-5 h-[100px] animate-pulse" />
                    </div>
                  ))
                : (() => {
                    let currentMonth = "";
                    return recentFeed
                      .slice(0, visibleRuns)
                      .map(
                        (
                          item: { label: string; value: string | number },
                          idx: number,
                        ) => {
                          const fires = item.fireCount || 0;
                          const rank = item.rank || 0;
                          const playerName = String(item.name || "").trim();
                          const courseName = String(
                            item.courseName ||
                              item.course?.name ||
                              "UNKNOWN COURSE",
                          ).trim();
                          const resultVal =
                            item.result ||
                            (typeof item.time === "number"
                              ? item.time.toFixed(2)
                              : "--");

                          const athleteFlag = formatFlagsWithSpace(
                            item.athlete?.region ||
                              item.athlete?.flag ||
                              item.athlete?.country ||
                              "",
                          ).trim();

                          const courseFlag = fixCountryEntity(
                            item.course?.country || "",
                            item.course?.flag || item.course?.region || ""
                          ).flag;

                          let rankBadge = null;
                          if (rank === 1)
                            rankBadge = {
                              color: "text-amber-500 bg-amber-500/10",
                              icon: "🥇",
                            };
                          else if (rank === 2)
                            rankBadge = {
                              color: "text-slate-400 bg-slate-400/10",
                              icon: "🥈",
                            };
                          else if (rank === 3)
                            rankBadge = {
                              color:
                                "text-amber-700 bg-amber-700/10 dark:text-amber-600 dark:bg-amber-600/10",
                              icon: "🥉",
                            };

                          const dateObj =
                            item.timeString && item.timeString !== "LATEST"
                              ? new Date(item.timeString)
                              : null;
                          const dayStr =
                            dateObj && !isNaN(dateObj.getTime())
                              ? dateObj.getDate().toString()
                              : "";
                          const monthStr =
                            dateObj && !isNaN(dateObj.getTime())
                              ? dateObj.toLocaleString("default", {
                                  month: "short",
                                })
                              : "";

                          const isNewMonth =
                            monthStr && monthStr !== currentMonth;
                          if (isNewMonth) {
                            currentMonth = monthStr;
                          }

                          return (
                            <React.Fragment key={`${item.id}-${idx}`}>
                              {isNewMonth && (
                                <div className="relative flex items-center justify-start gap-4 sm:gap-6 mt-1 mb-1">
                                  <div className="relative z-20 flex-shrink-0 flex justify-center w-6 sm:w-8">
                                    <div className="bg-white text-zinc-900 border-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-sm border z-30">
                                      {monthStr}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="relative flex items-start gap-4 sm:gap-6 group">
                                {/* Timeline Node */}
                                <div className="relative mt-1.5 flex-shrink-0 z-20">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.05)] dark:shadow-[0_0_10px_rgba(255,255,255,0.05)] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300">
                                    {dayStr ? (
                                      <span className="text-[10px] sm:text-xs font-black text-zinc-500 dark:text-zinc-400">
                                        {dayStr}
                                      </span>
                                    ) : (
                                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Content Card */}
                                <div
                                  className="group/card flex-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 sm:p-5 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5 transition-all duration-300 cursor-pointer flex flex-row items-center justify-between min-w-0"
                                  onClick={() =>
                                    navigateToEntity(
                                      "player",
                                      item.athlete || { name: item.name },
                                    )
                                  }
                                  onTouchStart={() => {}}
                                >
                                  <div className="flex flex-col items-start text-left gap-1 sm:gap-1.5 flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 max-w-full w-full">
                                      <span
                                        className="text-sm sm:text-base font-black text-zinc-900 dark:text-white uppercase transition-colors flex items-center gap-1.5 min-w-0 max-w-full shrink group-hover/card:text-blue-500 group-has-[.course-target:hover]/card:!text-zinc-900 dark:group-has-[.course-target:hover]/card:!text-white"
                                      >
                                        {athleteFlag && (
                                          <span className="text-[12px] opacity-90 shrink-0">
                                            {athleteFlag}
                                          </span>
                                        )}
                                        <span className="truncate">
                                          {playerName}
                                        </span>
                                        {rankBadge && (
                                          <span className="animate-bounce inline-block text-[14px] shrink-0">
                                            {rankBadge.icon}
                                          </span>
                                        )}
                                      </span>
                                      {fires > 0 && (
                                        <span className="flex items-center text-xs bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full shrink-0">
                                          {Array.from({
                                            length: Math.min(3, fires),
                                          }).map((_, i) => (
                                            <span
                                              key={i}
                                              className="animate-pulse"
                                            >
                                              🔥
                                            </span>
                                          ))}
                                        </span>
                                      )}
                                    </div>

                                    <div 
                                      className="course-target flex items-center text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:!text-blue-500 transition-colors cursor-pointer max-w-full min-w-0 w-max -ml-3 -mt-2 -mb-2 px-3 py-2 rounded-md"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigateToEntity("course", item.course || { name: item.courseName });
                                      }}
                                    >
                                      <span className="truncate max-w-full">
                                        {courseFlag && (
                                          <span className="opacity-80 mr-1">
                                            {courseFlag}
                                          </span>
                                        )}
                                        {courseName}
                                        {item.course?.city
                                          ? `, ${item.course.city}`
                                          : ""}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col justify-center items-end shrink-0">
                                    <div className="text-lg sm:text-2xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white transition-colors group-hover/card:text-blue-500 group-has-[.course-target:hover]/card:!text-zinc-900 dark:group-has-[.course-target:hover]/card:!text-white">
                                      {resultVal}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        },
                      );
                  })()}
            </div>

            {!isLoading && recentFeed && recentFeed.length > visibleRuns && (
              <div className="flex justify-center mt-8">
                <button
                  className="group flex flex-col items-center gap-1 px-8 py-3 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 active:scale-[0.98] text-[10px] font-black tracking-widest uppercase text-zinc-400 hover:text-blue-500 active:text-blue-500 transition-all duration-300 rounded-2xl"
                  onClick={() =>
                    setVisibleRuns((prev) =>
                      Math.min(prev + 20, 100, recentFeed.length),
                    )
                  }
                  onTouchStart={() => {}}
                >
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  Load More
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
