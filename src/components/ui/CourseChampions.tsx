import React, { useMemo } from "react";
import { cn, fixCountryEntity, formatFlagsWithSpace } from "../../lib/asr-utils";
import { Trophy, Clock } from "lucide-react";
import { useAppNavigation } from "../../hooks/useDerivedData";

interface ChampionsProps {
 runs: any[];
 theme: "light" | "dark";
}

export const CourseChampions = ({ runs, theme }: ChampionsProps) => {
 const { navigateToEntity } = useAppNavigation();

 const getChampions = (genderFilter: string) => {
 const valid = runs
 .filter((r) => {
 const timeVal = typeof r.num === "number" ? r.num : r.time;
 // Accept only runs strictly under this gender
 return timeVal && timeVal > 0 && r.gender === genderFilter;
 })
 .map((r) => {
 const timeVal = typeof r.num === "number" ? r.num : r.time;
 const validDate = r.date ? new Date(r.date) : null;
 const isDateValid = validDate && !isNaN(validDate.getTime());
 return {
 ...r,
 timeVal,
 dateMs: isDateValid ? validDate.getTime() : 0,
 dateStr: isDateValid ? validDate.toLocaleDateString() : "Unknown Date"
 };
 })
 .sort((a, b) => a.dateMs - b.dateMs);

 if (valid.length === 0) return [];

 let currentWR = Infinity;
 const wrs = [];

 for (const run of valid) {
 if (run.timeVal < currentWR) {
 currentWR = run.timeVal;
 const dateStr = run.dateStr;
 // If there's already a WR from the exact same date, replace it with this faster one
 if (wrs.length > 0 && wrs[wrs.length - 1].date === dateStr) {
 wrs[wrs.length - 1] = {
 time: run.timeVal,
 date: dateStr,
 dateMs: run.dateMs,
 pKey: run.pKey,
 athlete: run.athlete || run.pKey || "Unknown",
 country: run.country,
 flag: run.flag,
 };
 } else {
 wrs.push({
 time: run.timeVal,
 date: dateStr,
 dateMs: run.dateMs,
 pKey: run.pKey,
 athlete: run.athlete || run.pKey || "Unknown",
 country: run.country,
 flag: run.flag,
 });
 }
 }
 }

 for (let i = 0; i < wrs.length; i++) {
 const currentDataMs = wrs[i].dateMs;
 let nextDateMs = Date.now();
 if (i < wrs.length - 1) {
 nextDateMs = wrs[i + 1].dateMs;
 }
 
 if (currentDataMs === 0 || nextDateMs === 0) {
 wrs[i].daysHeld = 0;
 } else {
 const diffMs = nextDateMs - currentDataMs;
 wrs[i].daysHeld = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
 }
 }

 // Return reverse chronological: newest WR first
 return wrs.reverse();
 };

 const mensChamps = useMemo(() => getChampions("M"), [runs]);
 const womensChamps = useMemo(() => getChampions("F"), [runs]);

 if (mensChamps.length === 0 && womensChamps.length === 0) {
 return (
 <div
 className={cn(
 "text-center py-6 text-xs font-bold tracking-widest uppercase",
 theme === "dark" ? "text-zinc-600" : "text-zinc-400",
 )}
 >
 No Course Records Yet
 </div>
 );
 }

 const renderChampsList = (champs: any[], label: string) => {
 if (champs.length === 0) return null;
 return (
 <div className="flex flex-col gap-3">
 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1">
 {label}
 </span>
 <div className="flex flex-col gap-2 relative">
 {/* timeline line */}
 <div
 className={cn(
 "absolute left-[29px] top-4 bottom-4 w-[2px]",
 "bg-black/10 dark:bg-white/10",
 )}
 />
 {champs.map((champ, i) => (
 <button
 key={i}
 onClick={() => navigateToEntity("player", { pKey: champ.pKey || champ.athlete, name: champ.athlete })}
 className={cn(
 "group flex flex-col relative pl-[58px] pr-5 py-3.5 rounded-[1.25rem] border transition-all text-left w-full outline-none hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
 "theme-focus",
 theme === "dark"
 ? i === 0
 ? "bg-zinc-900 border-amber-500/30 hover:bg-zinc-800 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
 : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800"
 : i === 0
 ? "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10 shadow-sm"
 : "bg-white border-zinc-200 hover:bg-zinc-50",
 )}
 >
 <div
 className={cn(
 "absolute left-[12px] top-1/2 -translate-y-1/2 w-[34px] h-[34px] rounded-full border-4 flex items-center justify-center transition-colors",
 theme === "dark" ? "bg-[#050505] border-[#050505] group-hover:bg-zinc-800 group-hover:border-zinc-800" : "bg-white border-white group-hover:bg-zinc-50 group-hover:border-zinc-50",
 i === 0
 ? "text-amber-500"
 : theme === "dark"
 ? "text-zinc-600"
 : "text-zinc-400",
 )}
 >
 {i === 0 ? (
 <Trophy size={14} className="fill-amber-500/20" />
 ) : (
 <Trophy size={14} className="fill-current opacity-30" />
 )}
 </div>
 <div className="flex justify-between items-center w-full min-w-0 gap-3">
 <div className="flex flex-col flex-1 min-w-0">
 <span
 className={cn(
 "font-black text-sm uppercase tracking-tight truncate",
 i === 0
 ? "theme-text-base"
 : "theme-text-muted",
 )}
 >
 {(champ.flag || champ.country) && (
 <span className="mr-1 inline-block drop-shadow-sm whitespace-nowrap">
 {formatFlagsWithSpace(champ.flag || fixCountryEntity(champ.country, "").flag)}
 </span>
 )}
 {champ.athlete}
 </span>
 <span
 className={cn(
 "text-[10px] font-bold flex items-center flex-wrap gap-1 mt-0.5",
 "theme-text-muted",
 )}
 >
 <Clock size={10} /> {champ.date}
 {champ.daysHeld > 0 ? (
 <span className="opacity-60 font-medium ml-1">
 • {i === 0 ? "Active for" : "Held for"} {champ.daysHeld} {champ.daysHeld === 1 ? 'day' : 'days'}
 </span>
 ) : i > 0 ? (
 <span className="opacity-60 font-medium ml-1">
 • Held for {"< 1"} day
 </span>
 ) : null}
 </span>
 </div>
 <div
 className={cn(
 "font-black text-lg tabular-nums tracking-tighter shrink-0",
 i === 0
 ? "text-amber-500"
 : theme === "dark"
 ? "text-zinc-400"
 : "text-zinc-600",
 )}
 >
 {champ.time.toFixed(2)}
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>
 );
 };

 return (
 <div className="flex flex-col gap-6 w-full mt-2">
 {renderChampsList(mensChamps, "MEN")}
 {renderChampsList(womensChamps, "WOMEN")}
 </div>
 );
};
