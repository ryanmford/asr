import React, { useMemo, useState, useContext } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useAppStore } from "../../store/useAppStore";
import { MapPin, User, ChevronRight, ChevronDown, ArrowRight, Activity, Trophy, Users, Globe, Zap, Watch } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppNavigation } from "../../hooks/useDerivedData";
import { ASRSearchInput } from "../common/ASRSearchInput";
import { CountUp } from "../common/CountUp";
import { ThemeContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { cn, formatFlagsWithSpace } from "../../lib/asr-utils";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export const HomeView = React.memo(() => {
  const navigate = useNavigate();
  const theme = useContext(ThemeContext) as "light" | "dark";
  const masterCourseList = useDataStore((s) => s.masterCourseList);
  const playerList_M_AT = useDataStore((s) => s.playerList_M_AT);
  const playerList_F_AT = useDataStore((s) => s.playerList_F_AT);
  const teamsAggregated = useDataStore((s) => s.teamsAggregated);
  const kpiStats = useDataStore((s) => s.kpiStats);
  const kpiTrends = useDataStore((s) => s.kpiTrends);
  const recentFeed = useDataStore((s) => s.recentFeed);
  const isLoading = useDataStore((s) => s.isLoading);
  const setShowOnboarding = useAppStore((s) => s.setShowOnboarding);
  const { navigateToEntity } = useAppNavigation();
  const [search, setSearch] = useState("");
  const [visibleRuns, setVisibleRuns] = useState(20);

  const playersTrend = kpiTrends?.players || [];
  const runsTrend = kpiTrends?.runs || [];
  const coursesTrend = kpiTrends?.courses || [];
  const countriesTrend = kpiTrends?.countries || [];

  const searchResults = useMemo(() => {
    if (search.length < 2) return null;
    const q = search.toLowerCase();
    
    const players = [...playerList_M_AT, ...playerList_F_AT].filter(p => (p.name || "").toLowerCase().includes(q));
    const courses = masterCourseList.filter(c => (c.name || "").toLowerCase().includes(q));
    const teamsArr = [
      ...((teamsAggregated as any)?.gyms?.allTime || []),
      ...((teamsAggregated as any)?.teams?.allTime || [])
    ];
    const teams = teamsArr.filter((t: any) => (t.name || "").toLowerCase().includes(q));
    
    return { players, courses, teams };
  }, [search, playerList_M_AT, playerList_F_AT, masterCourseList, teamsAggregated]);

  const allSearchResults = useMemo(() => {
    if (!searchResults) return [];
    return [
      ...searchResults.players.slice(0, 5).map(p => ({ type: "player", data: p })),
      ...searchResults.courses.slice(0, 5).map(c => ({ type: "course", data: c })),
      ...searchResults.teams.slice(0, 5).map(t => ({ type: "team", data: t }))
    ] as { type: "player" | "course" | "team", data: any }[];
  }, [searchResults]);

  const [searchFocusedIndex, setSearchFocusedIndex] = useState(-1);

  React.useEffect(() => {
    setSearchFocusedIndex(-1);
  }, [search]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!allSearchResults.length) return;
    if (e.key === "ArrowDown") {
      setSearchFocusedIndex(prev => (prev + 1) % allSearchResults.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setSearchFocusedIndex(prev => (prev === -1 ? allSearchResults.length - 1 : prev - 1 + allSearchResults.length) % allSearchResults.length);
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (searchFocusedIndex >= 0 && searchFocusedIndex < allSearchResults.length) {
        const item = allSearchResults[searchFocusedIndex];
        navigateToEntity(item.type, item.data);
      }
    }
  };

  const { topPlayer, topCourse, topTeam } = useMemo(() => {
    const combinedPlayers = [
      ...playerList_M_AT.map((p, i) => ({ ...p, _gRank: i + 1, _g: "M" })),
      ...playerList_F_AT.map((p, i) => ({ ...p, _gRank: i + 1, _g: "F" }))
    ].sort((a,b) => (b.wins || 0) + (b.totalFireCount || 0) - ((a.wins || 0) + (a.totalFireCount || 0)));
    
    const sortedCourses = [...masterCourseList].sort((a,b) => ((b.totalAllTimeRuns || b.totalRuns || 0) - (a.totalAllTimeRuns || a.totalRuns || 0)));

    const teamsArr = [
      ...((teamsAggregated as any)?.gyms?.allTime || []).map((t: any) => ({ ...t, _isGym: true })),
      ...((teamsAggregated as any)?.teams?.allTime || []).map((t: any) => ({ ...t, _isGym: false }))
    ].sort((a,b) => ((b as any).pts || 0) - ((a as any).pts || 0));
    
    return {
      topPlayer: combinedPlayers.length > 0 ? combinedPlayers[0] : null,
      topCourse: sortedCourses.length > 0 ? sortedCourses[0] : null,
      topTeam: teamsArr.length > 0 ? teamsArr[0] : null
    };
  }, [playerList_M_AT, playerList_F_AT, masterCourseList, teamsAggregated]);

  const [carouselIndex, setCarouselIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const featureList = useMemo(() => {
    const list = [];
    if (topCourse) {
      const courseFlag = topCourse.flag;

      list.push({ 
        type: "course", 
        data: topCourse, 
        displayName: courseFlag ? `${formatFlagsWithSpace(courseFlag).trim()} ${topCourse.name}` : topCourse.name,
        label: "Course of the Month", 
        icon: <MapPin className="w-4 h-4" />, 
        color: "text-emerald-500", 
        shadowColor: "shadow-[0_0_15px_rgba(16,185,129,0.2)]",
        borderHover: "hover:shadow-emerald-500/20",
        bg: "bg-emerald-500/10",
        hoverBg: "group-hover:bg-emerald-500",
        hoverText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
        gradientUrl: "conic-gradient(from 0deg, #10b981, #34d399, #059669, #34d399, #10b981)",
        metrics: [
          { label: "CR (M)", value: topCourse.mRecord ? topCourse.mRecord.toFixed(2) : "--" },
          { label: "CR (W)", value: topCourse.fRecord ? topCourse.fRecord.toFixed(2) : "--" },
          { label: "Runs", value: topCourse.totalAllTimeRuns || topCourse.totalRuns || 0 }
        ]
      });
    }
    if (topPlayer) {
      const playerFlag = topPlayer.townFlag || topPlayer.gymFlag;
      list.push({ 
        type: "player", 
        data: topPlayer, 
        displayName: playerFlag ? `${formatFlagsWithSpace(playerFlag).trim()} ${topPlayer.name}` : topPlayer.name,
        label: "Player of the Month", 
        icon: <User className="w-4 h-4" />, 
        color: "text-blue-500", 
        shadowColor: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
        borderHover: "hover:shadow-blue-500/20",
        bg: "bg-blue-500/10",
        hoverBg: "group-hover:bg-blue-500",
        hoverText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        gradientUrl: "conic-gradient(from 0deg, #3b82f6, #60a5fa, #2563eb, #60a5fa, #3b82f6)",
        metrics: [
          { label: "Rank", value: topPlayer._gRank },
          { label: "LQ", value: topPlayer.rating?.toFixed(2) || "0.00" },
          { label: "Wins", value: topPlayer.wins || 0 }
        ]
      });
    }
    if (topTeam) {
      const teamFlag = topTeam.flag;
      list.push({ 
        type: "team", 
        data: topTeam, 
        displayName: teamFlag ? `${formatFlagsWithSpace(teamFlag).trim()} ${topTeam.name}` : topTeam.name,
        label: topTeam._isGym ? "Gym of the Month" : "Team of the Month", 
        icon: <Users className="w-4 h-4" />, 
        color: "text-amber-500", 
        shadowColor: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        borderHover: "hover:shadow-amber-500/20",
        bg: "bg-amber-500/10",
        hoverBg: "group-hover:bg-amber-500",
        hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
        gradientUrl: "conic-gradient(from 0deg, #f59e0b, #fbbf24, #d97706, #fbbf24, #f59e0b)",
        metrics: [
          { label: "Points", value: Math.floor(topTeam.pts || 0) },
          { label: "Members", value: topTeam.playersCount || 0 },
          { label: "Runs", value: topTeam.runsCount || 0 }
        ]
      });
    }
    return list;
  }, [topPlayer, topTeam, topCourse]);

  const currentFeature = featureList.length > 0 ? featureList[(((carouselIndex % featureList.length) + featureList.length) % featureList.length)] : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-4 pt-4 sm:pt-8 pb-32 gap-6 sm:gap-16"
    >
      {/* Global Search */}
      <motion.div variants={itemVariants}
        className={cn(
          "px-4 py-3 sm:py-4 sticky z-[50] backdrop-blur-3xl -mx-4 left-0 right-0 transition-all",
          theme === "dark"
            ? "bg-zinc-950/90"
            : "bg-white/95",
          "top-[55px] sm:top-[66px]",
        )}
      >
        <div className="w-full max-w-7xl mx-auto">
          <ASRSearchInput
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search players, courses, gyms..."
              theme={theme}
              className="w-full"
          />
        </div>
        
        <AnimatePresence>
          {searchResults && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[calc(100%-8px)] left-4 right-4 mt-2 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto z-50 max-w-7xl mx-auto"
            >
               {/* Players */}
               {searchResults.players.length > 0 && (
                 <div className="p-2 border-b border-black/10 dark:border-white/10">
                   <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Players</div>
                   {searchResults.players.slice(0, 5).map((p, i) => {
                     const isFocused = searchFocusedIndex === i;
                     return (
                       <button key={(p as any).pKey || p.name || i} onClick={() => navigateToEntity("player", p)} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-colors", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-blue-500" : "hover:bg-black/5 dark:hover:bg-white/5")}>
                          <User className="w-4 h-4 opacity-50" />
                          <span className="font-bold flex-1">{p.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-30 ml-auto" />
                       </button>
                     );
                   })}
                 </div>
               )}
               {/* Courses */}
               {searchResults.courses.length > 0 && (
                 <div className="p-2 border-b border-black/10 dark:border-white/10">
                   <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Courses</div>
                   {searchResults.courses.slice(0, 5).map((c, i) => {
                     const isFocused = searchFocusedIndex === i + searchResults.players.slice(0, 5).length;
                     return (
                       <button key={c.name} onClick={() => navigateToEntity("course", c)} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-colors", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-blue-500" : "hover:bg-black/5 dark:hover:bg-white/5")}>
                          <MapPin className="w-4 h-4 opacity-50" />
                          <span className="font-bold flex-1">{c.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-30 ml-auto" />
                       </button>
                     );
                   })}
                 </div>
               )}
               {/* Gyms / Teams */}
               {searchResults.teams.length > 0 && (
                 <div className="p-2">
                   <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Teams/Gyms</div>
                   {searchResults.teams.slice(0, 5).map((t: any, i) => {
                     const isFocused = searchFocusedIndex === i + searchResults.players.slice(0, 5).length + searchResults.courses.slice(0, 5).length;
                     return (
                       <button key={t.name || i} onClick={() => navigateToEntity("team", t)} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-colors", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-blue-500" : "hover:bg-black/5 dark:hover:bg-white/5")}>
                          <Users className="w-4 h-4 opacity-50" />
                          <span className="font-bold flex-1">{t.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-30 ml-auto" />
                       </button>
                     );
                   })}
                 </div>
               )}
               {searchResults.players.length === 0 && searchResults.courses.length === 0 && searchResults.teams.length === 0 && (
                 <div className="p-8 text-center text-zinc-500 text-sm font-medium">No results found</div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hero Header CTA */}
      <motion.div variants={itemVariants} className={cn(
        "relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden px-4 py-8 sm:p-16 lg:p-24 flex flex-col items-center justify-center gap-4 sm:gap-12 w-full text-center shrink-0",
        theme === "dark" 
          ? "bg-zinc-950" 
          : "bg-white"
      )}>
        <div className={cn(
          "absolute inset-0 pointer-events-none",
          theme === "dark" ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950 to-zinc-950" : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white"
        )}></div>
        
        {/* Animated Mesh / Orbs */}
        <div className={cn("absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 blur-[100px] rounded-full animate-[pulse_8s_ease-in-out_infinite] pointer-events-none", theme === "dark" ? "bg-blue-600/30 mix-blend-screen" : "bg-blue-400/20 mix-blend-multiply")}></div>
        <div className={cn("absolute bottom-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 blur-[100px] rounded-full animate-[pulse_12s_ease-in-out_infinite] pointer-events-none", theme === "dark" ? "bg-purple-600/30 mix-blend-screen" : "bg-purple-400/20 mix-blend-multiply")} style={{ animationDelay: '2s' }}></div>
        <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none animate-[spin_120s_linear_infinite]", theme === "dark" ? "mix-blend-overlay" : "opacity-[0.03] mix-blend-darken")}></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-3xl space-y-4 sm:space-y-8 w-full mx-auto">
          <h1 className="text-[clamp(1.5rem,7.5vw,4rem)] sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[1.1] sm:leading-none uppercase flex flex-row items-center justify-center gap-2 sm:gap-4 text-center whitespace-nowrap">
            <span className="italic transform -skew-x-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 pb-1 sm:pb-2 pr-2 sm:pr-8">Apex Speed Run</span>
          </h1>
          <p className={cn(
             "font-medium text-sm sm:text-xl lg:text-2xl max-w-2xl leading-relaxed mx-auto px-2",
             theme === "dark" ? "text-zinc-400" : "text-zinc-500"
          )}>
            Track your speed runs, compete worldwide, climb the leaderboards, and become unstoppable.
          </p>
          <div className="flex w-full sm:max-w-xs mt-1 sm:mt-6 mx-auto">
            <button 
              className="group relative px-6 py-4 sm:py-5 w-full bg-blue-600 overflow-hidden rounded-2xl font-bold text-lg sm:text-xl tracking-wide text-white transition-colors duration-150 hover:bg-blue-500 active:bg-blue-700" 
              onClick={() => setShowOnboarding(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center justify-center gap-2 uppercase drop-shadow-sm">
                 Get Started
                 <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Global Stats Grid */}
      {isLoading ? (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[...Array(4)].map((_, i) => (
             <div key={i} className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 h-[140px] flex flex-col items-center justify-center gap-3 animate-pulse">
               <div className="w-6 h-6 bg-black/10 dark:bg-white/10 rounded-full" />
               <div className="w-16 h-8 bg-black/10 dark:bg-white/10 rounded-lg" />
               <div className="w-12 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
             </div>
           ))}
        </motion.div>
      ) : kpiStats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-5 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 h-[140px]">
            {/* Sparkline */}
            <div className="absolute inset-0 bottom-0 top-auto h-2/3 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity flex items-end">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={playersTrend}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <User className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform relative z-10" />
            <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter relative z-10">
              <CountUp end={(kpiStats as any).players || 0} />
            </div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 relative z-10">Players</div>
            {/* Subtle Sparkline Marks */}
            <div className="absolute left-2.5 bottom-8 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">#</div>
            <div className="absolute right-4 bottom-2 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">T</div>
          </div>
          <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-5 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 h-[140px]">
            {/* Sparkline */}
            <div className="absolute inset-0 bottom-0 top-auto h-2/3 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity flex items-end">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={runsTrend}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Watch className="w-6 h-6 text-purple-500 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform relative z-10" />
            <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter relative z-10">
              <CountUp end={(kpiStats as any).runs || 0} />
            </div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 relative z-10">Runs</div>
            {/* Subtle Sparkline Marks */}
            <div className="absolute left-2.5 bottom-8 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">#</div>
            <div className="absolute right-4 bottom-2 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">T</div>
          </div>
          <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-5 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 h-[140px]">
            {/* Sparkline */}
            <div className="absolute inset-0 bottom-0 top-auto h-2/3 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity flex items-end">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coursesTrend}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <MapPin className="w-6 h-6 text-emerald-500 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform relative z-10" />
            <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter relative z-10">
              <CountUp end={(kpiStats as any).courses || 0} />
            </div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 relative z-10">Courses</div>
            {/* Subtle Sparkline Marks */}
            <div className="absolute left-2.5 bottom-8 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">#</div>
            <div className="absolute right-4 bottom-2 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">T</div>
          </div>
          <div className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-5 flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1 h-[140px]">
            {/* Sparkline */}
            <div className="absolute inset-0 bottom-0 top-auto h-2/3 opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity flex items-end">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={countriesTrend}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={true} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Globe className="w-6 h-6 text-amber-500 mb-3 group-hover:scale-110 group-hover:-translate-y-1 transition-transform relative z-10" />
            <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums tracking-tighter relative z-10">
              <CountUp end={(kpiStats as any).countries || 0} />
            </div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 relative z-10">Countries</div>
            {/* Subtle Sparkline Marks */}
            <div className="absolute left-2.5 bottom-8 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">#</div>
            <div className="absolute right-4 bottom-2 text-[9px] font-mono font-bold text-black/[0.04] dark:text-white/[0.04] pointer-events-none select-none mix-blend-overlay">T</div>
          </div>
        </motion.div>
      )}

      {/* Featured Section */}
      {isLoading ? (
        <motion.div variants={itemVariants} className="relative w-full min-h-[140px] bg-black/5 dark:bg-white/5 rounded-3xl p-6 flex flex-row items-center justify-between animate-pulse">
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
      ) : currentFeature && (
        <motion.div variants={itemVariants} className="w-full">
          <div onClick={() => navigateToEntity(currentFeature.type, currentFeature.data)} className={cn("relative w-full min-h-[140px] flex flex-row items-center justify-between rounded-[2rem] p-5 sm:p-6 pb-12 sm:pb-12 cursor-pointer group overflow-hidden bg-black/5 dark:bg-white/5 transition-all hover:-translate-y-1")}>
            {/* Neon Border Setup */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                <div className="w-full h-full neon-border-rotate" style={{ backgroundImage: currentFeature.gradientUrl }} />
              </div>
              <div className="absolute inset-[1px] rounded-[2rem] backdrop-blur-xl z-20 bg-white/95 dark:bg-zinc-950/95" />
            </div>

            <div className="flex-1 flex min-w-0 pr-4 md:pr-6 relative z-30">
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
                    <div className={cn("text-[10px] sm:text-xs md:text-[11px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5", currentFeature.color)}>
                      {currentFeature.icon} {currentFeature.label}
                    </div>
                    <div className={cn(
                      "font-black tracking-tight text-zinc-900 dark:text-white transition-colors uppercase leading-none md:leading-none truncate w-full", 
                      (currentFeature.displayName || currentFeature.data.name).length > 22 ? "text-lg sm:text-xl md:text-2xl" :
                      (currentFeature.displayName || currentFeature.data.name).length > 15 ? "text-xl sm:text-2xl md:text-3xl" :
                      "text-2xl sm:text-3xl md:text-4xl",
                      currentFeature.hoverText
                    )}>
                      {currentFeature.displayName || currentFeature.data.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 md:pl-4">
                    {currentFeature.metrics.map((m: any, i: number) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{m.label}</span>
                        <span className="text-base sm:text-lg md:text-xl font-black text-zinc-900 dark:text-white tabular-nums flex items-center mt-0.5 leading-none">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-full flex flex-shrink-0 items-center justify-center relative z-30 transition-all transform group-hover:scale-110 shadow-lg shadow-black/5 group-hover:text-white shrink-0", currentFeature.bg, currentFeature.color, currentFeature.hoverBg)}>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-1 sm:bottom-2 left-0 right-0 flex justify-center gap-0.5 z-40">
              {featureList.map((_, idx) => {
                const isActive = idx === (((carouselIndex % featureList.length) + featureList.length) % featureList.length);
                return (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCarouselIndex(idx); }}
                    className="w-10 h-10 flex items-center justify-center group/dot focus:outline-none"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        isActive 
                          ? cn("w-4", currentFeature.color) // Match dot color to feature text color
                          : "w-1.5 bg-black/20 dark:bg-white/20 group-hover/dot:bg-black/40 dark:group-hover/dot:bg-white/40"
                      )}
                      style={isActive ? { backgroundColor: 'currentColor' } : {}}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start cursor-pointer transition-colors duration-150 group hover:bg-black/10 dark:hover:bg-white/10 min-h-[220px]"
             onClick={() => navigate("/hof")}
          >


             <div className="absolute top-0 right-0 p-6 pointer-events-none z-30">
                <Trophy className="w-8 h-8 opacity-20 text-amber-500 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:rotate-12 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
             </div>

             <div className="mt-auto relative z-30 w-full flex flex-col">
               <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 tracking-widest uppercase mb-2">Global HOF</h3>
               <p className="text-2xl sm:text-3xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-white uppercase leading-none group-hover:text-amber-500 transition-colors duration-300">Medal<br/>Counts</p>
               <div className="flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                 <span>View HOF</span>
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
               </div>
             </div>
          </div>
          
          <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start cursor-pointer transition-colors duration-150 group hover:bg-black/10 dark:hover:bg-white/10 min-h-[220px]"
             onClick={() => navigate("/courses")}
          >


             <div className="absolute top-0 right-0 p-6 pointer-events-none z-30">
                <Globe className="w-8 h-8 opacity-20 text-emerald-500 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:-rotate-12 group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
             </div>

             <div className="mt-auto relative z-30 w-full flex flex-col">
               <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 tracking-widest uppercase mb-2">World Map</h3>
               <p className="text-2xl sm:text-3xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-white uppercase leading-none group-hover:text-emerald-500 transition-colors duration-300">Explore<br/>Courses</p>
               <div className="flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                 <span>Open Map</span>
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
               </div>
             </div>
          </div>
          
          <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start cursor-pointer transition-colors duration-150 group hover:bg-black/10 dark:hover:bg-white/10 min-h-[220px]"
             onClick={() => navigate("/players")}
          >


             <div className="absolute top-0 right-0 p-6 pointer-events-none z-30">
                <User className="w-8 h-8 opacity-20 text-blue-500 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:-translate-y-2 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
             </div>

             <div className="mt-auto relative z-30 w-full flex flex-col">
               <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-500 tracking-widest uppercase mb-2">Players</h3>
               <p className="text-2xl sm:text-3xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-white uppercase leading-none group-hover:text-blue-500 transition-colors duration-300">Top<br/>Players</p>
               <div className="flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                 <span>View Leaderboards</span>
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
               </div>
             </div>
          </div>
          
          <div 
             className="relative overflow-hidden bg-black/5 dark:bg-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-md flex flex-col items-start cursor-pointer transition-colors duration-150 group hover:bg-black/10 dark:hover:bg-white/10 min-h-[220px]"
             onClick={() => navigate("/teams")}
          >


             <div className="absolute top-0 right-0 p-6 pointer-events-none z-30">
                <Users className="w-8 h-8 opacity-20 text-amber-500 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 group-hover:rotate-6 group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
             </div>

             <div className="mt-auto relative z-30 w-full flex flex-col">
               <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 tracking-widest uppercase mb-2">Gyms & Teams</h3>
               <p className="text-2xl sm:text-3xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-white uppercase leading-none group-hover:text-amber-500 transition-colors duration-300">Find<br/>Teams</p>
               <div className="flex items-center text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                 <span>View Teams</span>
                 <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
               </div>
             </div>
          </div>
      </motion.div>

      {/* Recent Activity */}
      {(isLoading || (recentFeed && recentFeed.length > 0)) && (
        <motion.div variants={itemVariants} className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2 px-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Runs</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-black/5 to-transparent dark:from-white/5 ml-2" />
          </div>
          
          <div className="relative pl-4 sm:pl-6 sm:pr-2">
            {/* Timeline Axis */}
            <div className="absolute top-4 bottom-4 left-[27.5px] sm:left-[39.5px] w-px bg-gradient-to-b from-zinc-500/50 via-zinc-500/20 to-transparent" />
            
            <div className="flex flex-col gap-4 relative z-10">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 sm:gap-6 mt-2">
                    <div className="relative mt-1.5 flex-shrink-0 z-20">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 animate-pulse" />
                    </div>
                    <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-2xl p-4 sm:p-5 h-[100px] animate-pulse" />
                  </div>
                ))
              ) : (() => {
                let currentMonth = "";
                return recentFeed.slice(0, visibleRuns).map((item: any, idx: number) => {
                  const fires = item.fireCount || 0;
                  const rank = item.rank || 0;
                  const playerName = String(item.name || "").trim();
                  const courseName = String(item.courseName || item.course?.name || "UNKNOWN COURSE").trim();
                  const resultVal = item.result || (typeof item.time === "number" ? item.time.toFixed(2) : "--");
                  
                  const athleteFlag = formatFlagsWithSpace(
                    item.athlete?.region ||
                      item.athlete?.flag ||
                      item.athlete?.country ||
                      "",
                  ).trim();

                  let rankBadge = null;
                  if (rank === 1) rankBadge = { color: "text-amber-500 bg-amber-500/10", icon: "🥇" };
                  else if (rank === 2) rankBadge = { color: "text-slate-400 bg-slate-400/10", icon: "🥈" };
                  else if (rank === 3) rankBadge = { color: "text-amber-700 bg-amber-700/10 dark:text-amber-600 dark:bg-amber-600/10", icon: "🥉" };
                  
                  const dateObj = item.timeString && item.timeString !== "LATEST" ? new Date(item.timeString) : null;
                  const dayStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.getDate().toString() : "";
                  const monthStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('default', { month: 'short' }) : "";
                  
                  const isNewMonth = monthStr && monthStr !== currentMonth;
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
                               <span className="text-[10px] sm:text-xs font-black text-zinc-500 dark:text-zinc-400">{dayStr}</span>
                             ) : (
                               <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
                             )}
                           </div>
                        </div>
                        
                        {/* Content Card */}
                        <div className="group/card flex-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 sm:p-5 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer flex flex-row items-center justify-between" onClick={() => navigateToEntity("course", item.course || { name: item.courseName })}>
                          <div className="flex flex-col items-start text-left gap-1.5 sm:gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span 
                                className="text-sm sm:text-base font-black text-zinc-900 dark:text-white uppercase hover:text-blue-500 transition-colors cursor-pointer flex items-center gap-1.5" 
                                onClick={(e) => { e.stopPropagation(); navigateToEntity("player", item.athlete || { name: item.name }); }}
                              >
                                {athleteFlag && <span className="text-[12px] opacity-90">{athleteFlag}</span>}
                                {playerName}
                                {rankBadge && (
                                   <span className="animate-bounce inline-block text-[14px]">
                                     {rankBadge.icon}
                                   </span>
                                )}
                              </span>
                              {fires > 0 && (
                                <span className="flex items-center text-xs bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full">
                                  {Array.from({ length: Math.min(3, fires) }).map((_, i) => <span key={i} className="animate-pulse">🔥</span>)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 gap-1.5 hover:text-blue-500 transition-colors group/course">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400 group-hover/course:text-blue-500 transition-colors" />
                              <span className="truncate max-w-[150px] sm:max-w-[250px]">{courseName}{item.course?.city ? `, ${item.course.city}` : ""}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center items-end ml-4">
                            <div className="text-lg sm:text-2xl font-black tabular-nums tracking-tighter text-zinc-900 dark:text-white">
                              {resultVal}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            </div>
            
            {!isLoading && recentFeed && recentFeed.length > visibleRuns && (
              <div className="flex justify-center mt-8">
                <button
                  className="group flex flex-col items-center gap-1 px-8 py-3 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-black tracking-widest uppercase text-zinc-400 hover:text-blue-500 transition-all duration-300 rounded-2xl"
                  onClick={() => setVisibleRuns(prev => Math.min(prev + 20, 100, recentFeed.length))}
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

