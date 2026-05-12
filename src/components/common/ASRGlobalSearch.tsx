import React, { useState, useMemo } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useAppNavigation } from "../../hooks/useDerivedData";
import { ASRSearchInput } from "./ASRSearchInput";
import { MapPin, User, Users, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/asr-utils";

interface SearchResultPlayer {
  pKey?: string;
  name?: string;
  _gRank?: number;
  _g?: string;
  wins?: number;
  totalFireCount?: number;
}
interface SearchResultCourse {
  name?: string;
  totalAllTimeRuns?: number;
  totalRuns?: number;
}
interface SearchResultTeam {
  name?: string;
  pts?: number;
  _isGym?: boolean;
}

export const ASRGlobalSearch = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const [search, setSearch] = useState("");
  const { navigateToEntity } = useAppNavigation();

  const masterCourseList = useDataStore((s) => s.masterCourseList);
  const playerList_M_AT = useDataStore((s) => s.playerList_M_AT);
  const playerList_F_AT = useDataStore((s) => s.playerList_F_AT);
  const teamsAggregated = useDataStore((s) => s.teamsAggregated);

  const searchResults = useMemo(() => {
    if (search.length < 2) return null;
    const q = search.toLowerCase();
    
    const players = [...playerList_M_AT, ...playerList_F_AT].filter(p => (p.name || "").toLowerCase().includes(q));
    const courses = masterCourseList.filter(c => (c.name || "").toLowerCase().includes(q));
    const teamsArr = [
      ...((teamsAggregated as { gyms?: { allTime?: SearchResultTeam[] }, teams?: { allTime?: SearchResultTeam[] } })?.gyms?.allTime || []),
      ...((teamsAggregated as { gyms?: { allTime?: SearchResultTeam[] }, teams?: { allTime?: SearchResultTeam[] } })?.teams?.allTime || [])
    ];
    const teams = teamsArr.filter((t: SearchResultTeam) => (t.name || "").toLowerCase().includes(q));
    
    return { players, courses, teams };
  }, [search, playerList_M_AT, playerList_F_AT, masterCourseList, teamsAggregated]);

  const allSearchResults = useMemo(() => {
    if (!searchResults) return [];
    return [
      ...searchResults.players.slice(0, 5).map(p => ({ type: "player", data: p })),
      ...searchResults.courses.slice(0, 5).map(c => ({ type: "course", data: c })),
      ...searchResults.teams.slice(0, 5).map(t => ({ type: "team", data: t }))
    ] as { type: "player" | "course" | "team", data: SearchResultPlayer | SearchResultCourse | SearchResultTeam }[];
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
        setSearch("");
      }
    }
  };

  const clearSearch = () => setSearch("");

  return (
    <div className="relative w-full z-[100] group">
      <ASRSearchInput
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search players, courses, gyms..."
          theme={theme}
          className="w-full text-xs sm:text-sm"
      />
      <AnimatePresence>
        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[calc(100%+8px)] right-0 w-[calc(100vw-32px)] max-w-2xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] lg:max-h-[70vh] overflow-y-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2"
          >
             {/* Players */}
             {searchResults.players.length > 0 && (
               <div className="p-2 border-b border-black/10 dark:border-white/10">
                 <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Players</div>
                 {searchResults.players.slice(0, 5).map((p, i) => {
                   const isFocused = searchFocusedIndex === i;
                   return (
                     <button key={(p as SearchResultPlayer).pKey || p.name || i} onClick={() => { navigateToEntity("player", p); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-blue-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <User className="w-4 h-4 opacity-50" />
                        <span className="font-bold flex-1 text-sm">{p.name}</span>
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
                     <button key={c.name} onClick={() => { navigateToEntity("course", c); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-blue-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <MapPin className="w-4 h-4 opacity-50" />
                        <span className="font-bold flex-1 text-sm">{c.name}</span>
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
                 {searchResults.teams.slice(0, 5).map((t: SearchResultTeam, i) => {
                   const isFocused = searchFocusedIndex === i + searchResults.players.slice(0, 5).length + searchResults.courses.slice(0, 5).length;
                   return (
                     <button key={t.name || i} onClick={() => { navigateToEntity("team", t); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-blue-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <Users className="w-4 h-4 opacity-50" />
                        <span className="font-bold flex-1 text-sm">{t.name}</span>
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
    </div>
  );
});
