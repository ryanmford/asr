/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { useDataStore } from "../../store/useDataStore";
import { useAppNavigation } from "../../hooks/useDerivedData";
import { ASRSearchInput } from "./ASRSearchInput";
import { MapPin, User, Users, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/asr-utils";
import { normalizeForSearch } from "../../lib/utils";
import { ASREmptyState } from "./ASREmptyState";

import { useDebounce } from "../../hooks/useDataHooks";

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
interface SearchResultLocation {
  name: string;
  city: string;
  stateProv: string;
  country: string;
  flag: string;
}

export const ASRGlobalSearch = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const [search, setSearch] = useState("");
  const { navigateToEntity } = useAppNavigation();

  const masterCourseList = useDataStore((s) => s.masterCourseList);
  const playerList_M_AT = useDataStore((s) => s.playerList_M_AT);
  const playerList_F_AT = useDataStore((s) => s.playerList_F_AT);
  const teamsAggregated = useDataStore((s) => s.teamsAggregated);

  const debouncedSearch = useDebounce(search, 200);

  const searchResults = useMemo(() => {
    if (debouncedSearch.length < 2) return null;
    const q = normalizeForSearch(debouncedSearch);
    const searchTerms = q.split(/[\s,]+/).filter(Boolean);
    
    const players = [...playerList_M_AT, ...playerList_F_AT].filter(p => {
      const key = normalizeForSearch(`${p.name} ${p.igHandle} ${p.teams?.map(t => t.name).join(" ")} ${p.location} ${p.homeGym}`);
      return searchTerms.every(term => key.includes(term));
    }).sort((a, b) => (b.runs || 0) - (a.runs || 0));
    const courses = masterCourseList.filter(c => {
      const key = normalizeForSearch(`${c.name} ${c.city} ${c.stateProv} ${c.country}`);
      return searchTerms.every(term => key.includes(term));
    }).sort((a, b) => (b.totalAllTimeRuns || 0) - (a.totalAllTimeRuns || 0));
    const gymsArr = ((teamsAggregated as Record<string, Record<string, SearchResultTeam[]>>)?.gyms?.allTime || []);
    const teamsArr = ((teamsAggregated as Record<string, Record<string, SearchResultTeam[]>>)?.teams?.allTime || []);

    const matchedGyms = gymsArr.filter((t: SearchResultTeam) => {
      const name = normalizeForSearch(t.name);
      return searchTerms.every(term => name.includes(term));
    }).sort((a, b) => (b.pts || 0) - (a.pts || 0));
    
    const matchedTeams = teamsArr.filter((t: SearchResultTeam) => {
      const name = normalizeForSearch(t.name);
      return searchTerms.every(term => name.includes(term));
    }).sort((a, b) => (b.pts || 0) - (a.pts || 0));

    const locationMap = new Map<string, SearchResultLocation>();
    masterCourseList.forEach(c => {
      if (!c.isDivider && (c.city || c.stateProv || c.country)) {
        const city = c.city || "";
        const stateProv = c.stateProv || "";
        const country = c.country || "";
        const locKey = normalizeForSearch(`${city}, ${stateProv}, ${country}`);
        if (!locationMap.has(locKey)) {
          const locName = [city, stateProv, country].filter(Boolean).join(", ");
          locationMap.set(locKey, { 
            name: locName, 
            city, 
            stateProv, 
            country, 
            flag: c.flag || "📍",
            courseCount: 1
          });
        } else {
          locationMap.get(locKey)!.courseCount!++;
        }
      }
    });

    const locations = Array.from(locationMap.values()).filter(l => {
      const name = normalizeForSearch(l.name);
      return searchTerms.every(term => name.includes(term));
    }).sort((a, b) => (b.courseCount || 0) - (a.courseCount || 0));

    const isGeoSearch = locations.length > 0 && locations.some(l => {
      const nCity = normalizeForSearch(l.city);
      const nState = normalizeForSearch(l.stateProv);
      const nCountry = normalizeForSearch(l.country);
      return nCity === q || nState === q || nCountry === q || normalizeForSearch(l.name) === q;
    });

    return { 
      players: isGeoSearch ? [] : players, 
      courses, 
      gyms: matchedGyms, 
      teams: isGeoSearch ? [] : matchedTeams, 
      locations 
    };
  }, [debouncedSearch, playerList_M_AT, playerList_F_AT, masterCourseList, teamsAggregated]);

  const allSearchResults = useMemo(() => {
    if (!searchResults) return [];
    return [
      ...searchResults.locations.slice(0, 50).map(l => ({ type: "location", data: l })),
      ...searchResults.courses.slice(0, 50).map(c => ({ type: "course", data: c })),
      ...searchResults.gyms.slice(0, 50).map(g => ({ type: "team", data: g })),
      ...searchResults.players.slice(0, 50).map(p => ({ type: "player", data: p })),
      ...searchResults.teams.slice(0, 50).map(t => ({ type: "team", data: t }))
    ] as { type: "player" | "course" | "team" | "location", data: SearchResultPlayer | SearchResultCourse | SearchResultTeam | SearchResultLocation }[];
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
          onChange={(e: any) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="search Apex Speed Run..."
          theme={theme}
          className="w-full"
      />
      <AnimatePresence>
        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[250px] sm:max-w-2xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] lg:max-h-[70vh] overflow-y-auto overscroll-none"
          >
             {/* Locations */}
             {searchResults.locations && searchResults.locations.length > 0 && (
               <div className="p-2 border-b border-black/10 dark:border-white/10">
                 <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Locations</div>
                 {searchResults.locations.slice(0, 50).map((l, i) => {
                   const isFocused = searchFocusedIndex === i;
                   return (
                     <button key={l.name || i} onClick={() => { navigateToEntity("location", l); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-zinc-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <span className="text-base">{l.flag}</span>
                        <div className="flex flex-1 items-center gap-2 overflow-hidden">
                          <span className="font-bold text-sm truncate">{l.name}</span>
                          {l.courseCount && l.courseCount > 0 && (
                            <span className="text-xs font-medium text-zinc-500 flex-shrink-0">
                              ({l.courseCount})
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-30 ml-auto flex-shrink-0" />
                     </button>
                   );
                 })}
               </div>
             )}
             {/* Courses */}
             {searchResults.courses.length > 0 && (
               <div className="p-2 border-b border-black/10 dark:border-white/10">
                 <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Courses</div>
                 {searchResults.courses.slice(0, 50).map((c, i) => {
                   const isFocused = searchFocusedIndex === i + searchResults.locations.slice(0, 50).length;
                   return (
                     <button key={c.name} onClick={() => { navigateToEntity("course", c); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-zinc-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <MapPin className="w-4 h-4 opacity-50 flex-shrink-0" />
                        <span className="font-bold flex-1 text-sm truncate">{c.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-30 ml-auto flex-shrink-0" />
                     </button>
                   );
                 })}
               </div>
             )}
             {/* Gyms */}
             {searchResults.gyms.length > 0 && (
               <div className="p-2 border-b border-black/10 dark:border-white/10">
                 <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gyms</div>
                 {searchResults.gyms.slice(0, 50).map((g: SearchResultTeam, i) => {
                   const isFocused = searchFocusedIndex === i + searchResults.locations.slice(0, 50).length + searchResults.courses.slice(0, 50).length;
                   return (
                     <button key={g.name || i} onClick={() => { navigateToEntity("team", g); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-zinc-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <Users className="w-4 h-4 opacity-50 flex-shrink-0" />
                        <span className="font-bold flex-1 text-sm truncate">{g.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-30 ml-auto flex-shrink-0" />
                     </button>
                   );
                 })}
               </div>
             )}
             {/* Players */}
             {searchResults.players.length > 0 && (
               <div className="p-2 border-b border-black/10 dark:border-white/10">
                 <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Players</div>
                 {searchResults.players.slice(0, 50).map((p, i) => {
                   const isFocused = searchFocusedIndex === i + searchResults.locations.slice(0, 50).length + searchResults.courses.slice(0, 50).length + searchResults.gyms.slice(0, 50).length;
                   return (
                     <button key={(p as SearchResultPlayer).pKey || p.name || i} onClick={() => { navigateToEntity("player", p); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-zinc-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <User className="w-4 h-4 opacity-50 flex-shrink-0" />
                        <span className="font-bold flex-1 text-sm truncate">{p.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-30 ml-auto flex-shrink-0" />
                     </button>
                   );
                 })}
               </div>
             )}
             {/* Teams */}
             {searchResults.teams.length > 0 && (
               <div className="p-2 border-b border-black/10 dark:border-white/10">
                 <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Teams</div>
                 {searchResults.teams.slice(0, 50).map((t: SearchResultTeam, i) => {
                   const isFocused = searchFocusedIndex === i + searchResults.locations.slice(0, 50).length + searchResults.courses.slice(0, 50).length + searchResults.gyms.slice(0, 50).length + searchResults.players.slice(0, 50).length;
                   return (
                     <button key={t.name || i} onClick={() => { navigateToEntity("team", t); clearSearch(); }} onTouchStart={() => {}} className={cn("w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all active:scale-[0.98]", isFocused ? "bg-black/10 dark:bg-white/10 ring-1 ring-zinc-500" : "hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10")}>
                        <Users className="w-4 h-4 opacity-50 flex-shrink-0" />
                        <span className="font-bold flex-1 text-sm truncate">{t.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-30 ml-auto flex-shrink-0" />
                     </button>
                   );
                 })}
               </div>
             )}
             {searchResults.players.length === 0 && searchResults.courses.length === 0 && searchResults.teams.length === 0 && searchResults.gyms.length === 0 && (!searchResults.locations || searchResults.locations.length === 0) && (
               <div className="p-4">
                 <ASREmptyState
                   theme={theme}
                   title="NO RESULTS FOUND"
                   message="TRY ANOTHER SEARCH TERM."
                 />
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
