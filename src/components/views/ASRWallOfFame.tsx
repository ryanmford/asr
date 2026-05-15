/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useDataStore } from "../../store/useDataStore";
import { useSettersDerived } from "../../hooks/useDerivedData";
import { calculateWofStats } from "../../lib/asr-data";
import {
 cn,
 trackEvent,
 formatFlagsWithSpace,
 THEME,
} from "../../lib/asr-utils";
import { ASRSectionHeading } from "../common/ASRSectionHeading";
import { ASRRankBadge } from "../ASRListItems";
import { ASRPromotionBanner } from "../ui/ASRPromotionBanner";

interface ASRWallOfFameProps {
 onEntityClick: (type: string, data: any, options?: any) => void;
 medalSort: { key: string; direction: "ascending" | "descending" };
 onMedalSort: (key: string) => void;
 theme: "light" | "dark";
}

const MedalHeader = React.memo(
 ({
 l,
 k,
 a = "left",
 sortable = true,
 className,
 medalSort,
 onMedalSort,
 theme,
 }: any) => {
 const isActive = medalSort.key === k;
 return (
 <th
 className={cn(
 "py-3 sm:py-5 px-1 sm:px-4 uppercase text-[9px] sm:text-[11px] font-black tracking-widest transition-all select-none group h-full",
 sortable ? "cursor-pointer hover:bg-black/5" : "cursor-default",
 isActive
 ? "text-blue-500 opacity-100"
 : theme === "dark"
 ? "text-white opacity-30"
 : "text-black opacity-40",
 className,
 )}
 onClick={() => sortable && onMedalSort(k)}
 >
 <div
 className={cn(
 "flex items-center gap-2",
 a === "right" ? "justify-end" : "justify-start",
 )}
 >
 <span>{l}</span>
 {sortable && (
 <div
 className={cn(
 "transition-all duration-300 shrink-0",
 isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
 )}
 >
 <ChevronDown
 size={14}
 strokeWidth={3}
 className={cn(
 "transition-transform",
 isActive && medalSort.direction === "ascending"
 ? "rotate-180"
 : "",
 )}
 />
 </div>
 )}
 </div>
 </th>
 );
 },
);

export const ASRWallOfFame = React.memo(
 ({ onEntityClick, medalSort, onMedalSort, theme }: ASRWallOfFameProps) => {
 const data = useDataStore((s) => s.data);
 const atPerfs = useDataStore((s) => s.atPerfs);
 const lbAT = useDataStore((s) => s.lbAT);
 const atMet = useDataStore((s) => s.atMet);
 const { settersWithImpact } = useSettersDerived();

 const stats = useMemo(() => {
 if (!data || data.length === 0) return null;
 return calculateWofStats(
 data,
 atPerfs,
 lbAT,
 atMet,
 medalSort,
 settersWithImpact,
 );
 }, [data, lbAT, atMet, atPerfs, medalSort, settersWithImpact]);

 const hasError = useDataStore((s) => s.hasError);

 if (!stats) {
  if (hasError) {
   return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in duration-700 min-h-[50vh]">
     <div className={cn("p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors", "theme-panel")}>
      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", theme === "dark" ? "bg-red-500/10" : "bg-red-500/10")}>
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m2 2 20 20"/><path d="M17.5 17.5 22 22"/><path d="M22 22 17.5 17.5"/><path d="m2 22 4.5-4.5"/><path d="M6.5 17.5 2 22"/><path d="M10 17h4v4h-4z"/><path d="M12 2v4"/><path d="M12 10v4"/><path d="M2 12h4"/><path d="M10 12h4"/><path d="M18 12h4"/></svg>
      </div>
      <h3 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", theme === "dark" ? "text-red-400" : "text-red-600")}>NETWORK ERROR</h3>
      <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 line-clamp-2", theme === "dark" ? "text-red-400" : "text-red-600")}>WE COULDN'T CONNECT TO THE ASSETS SERVER.</p>
     </div>
    </div>
   );
  }
  return null;
 }

 const sections = [
 { l: "TOP LQ", k: "rating" },
 { l: "MOST RUNS", k: "runs" },
 { l: "HIGHEST WIN %", k: "winPercentage" },
 { l: "MOST RECORDS", k: "wins" },
 { l: "MOST 🪙", k: "contributionScore" },
 { l: "MOST 🔥", k: "totalFireCount" },
 { l: "MOST IMPACT", k: "impact" },
 { l: "MOST SETS", k: "sets" },
 ];

 return (
 <div className="flex flex-col gap-12 pb-32 animate-in fade-in duration-700">
 <div className="px-4 sm:px-6 mt-0 mb-[-1.5rem] w-full max-w-7xl mx-auto">
  <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500/80 dark:text-zinc-500/80 tracking-widest uppercase">
   * RUN 10+ COURSES TO JOIN THE HOF
  </p>
 </div>
 {/* Leaderboard Grids */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6">
 {sections.map((sec) => (
 <div key={sec.k} className="flex flex-col gap-5">
 <ASRSectionHeading title={sec.l} theme={theme} />
 <div
 className={cn(
 "rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-xl",
 THEME.BENTO_CARD(theme),
 )}
 >
 <div className="flex flex-col divide-y divide-zinc-800/10">
 {(stats.topStats[sec.k] || []).map((a: any, i: number) => {
 const isSetterBoard = ["impact", "sets"].includes(sec.k);
 let displayVal: any;
 if (sec.k === "rating")
 displayVal = (a.rating || 0).toFixed(2);
 else if (sec.k === "winPercentage")
 displayVal = `${(a.winPercentage || 0).toFixed(2)}%`;
 else if (sec.k === "contributionScore")
 displayVal = (a.contributionScore || 0).toFixed(2);
 else if (sec.k === "totalFireCount")
 displayVal = a.allTimeFireCount || 0;
 else if (sec.k === "impact") displayVal = a.impact || 0;
 else if (sec.k === "sets") displayVal = a.sets || 0;
 else displayVal = a[sec.k] || 0;

 const isTop3 = i < 3;
 const flags = formatFlagsWithSpace(
 a.region || a.flag || a.country || "🏳️",
 );
 const hoverClass =
 theme === "dark"
 ? "hover:bg-blue-500/10"
 : "hover:bg-blue-500/5";

 return (
 <button
 key={a.id || a.pKey || i}
 onClick={() =>
 onEntityClick(
 isSetterBoard ? "setter" : "player",
 a,
 { initialMode: "all-time" },
 )
 }
 className={cn(
 "flex items-center justify-between py-4 sm:py-5 px-4 sm:px-6 transition-colors duration-150 group relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
 hoverClass,
 i === 0 && (theme === "dark" ? "bg-white/[0.02]" : "bg-black/[0.02]")
 )}
 >
 <div className="flex items-center gap-4 min-w-0 z-10 relative">
 <ASRRankBadge rank={i + 1} />
 <div className="flex flex-col text-left">
 <span
 className={cn(
 "text-[11px] sm:text-[14px] font-black uppercase truncate pr-2 tracking-tight transition-colors",
 theme === "dark"
 ? "text-zinc-100"
 : "text-zinc-900",
 i === 0 ? "text-zinc-900 dark:text-white group-hover:text-blue-500" : "group-hover:text-blue-500"
 )}
 >
 {flags} {a.name}
 </span>
 </div>
 </div>
 <div className="flex items-center justify-end gap-2 shrink-0 text-right z-10 relative">
 <span
 className={cn(
 "text-[14px] sm:text-[18px] font-black tracking-tighter whitespace-nowrap transition-all tabular-nums text-right group-hover:text-blue-500",
 theme === "dark" ? "text-white" : "text-zinc-900",
 isTop3 ? "scale-110" : "opacity-100",
 i === 0 && ""
 )}
 >
 {displayVal}
 </span>
 </div>
 {isTop3 && i === 0 && (
 <>
   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rotate-45 translate-x-16 -translate-y-16 pointer-events-none blur-xl" />
   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
 </>
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Medal Table */}
 <div className="px-4 sm:px-6">
 <ASRSectionHeading title="WORLDWIDE MEDAL COUNT" theme={theme} />
 <div
 className={cn(
 "rounded-[2.8rem] overflow-hidden mt-6 transition-all duration-300 shadow-xl",
 theme === "dark"
 ? "bg-zinc-900/40 border-zinc-800/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)]"
 : "bg-white border-slate-200 shadow-lg shadow-black/5",
 )}
 >
 <div className="overflow-x-auto no-scrollbar">
 <table className="w-full text-left border-collapse min-w-[280px] table-fixed">
 <thead
 className={cn(
 "border-b backdrop-blur-xl",
 theme === "dark"
 ? "bg-black/90 border-zinc-800/50"
 : "bg-white border-zinc-200"
 )}
 >
 <tr>
 <th
 className={cn(
 "py-3 sm:py-6 pl-2 sm:pl-8 w-10 sm:w-20 uppercase text-[9px] sm:text-[11px] font-black tracking-widest",
 theme === "dark"
 ? "text-white opacity-30"
 : "text-black opacity-40",
 )}
 >
 RANK
 </th>
 <MedalHeader
 l="COUNTRY"
 k="name"
 a="left"
 sortable={false}
 className="w-[110px] "
 theme={theme}
 medalSort={medalSort}
 onMedalSort={onMedalSort}
 />
 <MedalHeader
 l="🥇"
 k="gold"
 a="right"
 className="w-9 "
 theme={theme}
 medalSort={medalSort}
 onMedalSort={onMedalSort}
 />
 <MedalHeader
 l="🥈"
 k="silver"
 a="right"
 className="w-9 "
 theme={theme}
 medalSort={medalSort}
 onMedalSort={onMedalSort}
 />
 <MedalHeader
 l="🥉"
 k="bronze"
 a="right"
 className="w-9 "
 theme={theme}
 medalSort={medalSort}
 onMedalSort={onMedalSort}
 />
 <MedalHeader
 l="TOTAL"
 k="total"
 a="right"
 className="w-12 "
 theme={theme}
 medalSort={medalSort}
 onMedalSort={onMedalSort}
 />
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/10">
 {stats.medalCount.map((c: any) => (
 <tr
 key={c.name}
 onClick={() => {
 trackEvent("select_content", {
 content_type: "hof_country",
 item_id: c.name,
 });
 onEntityClick("region", { ...c, type: "country" });
 }}
 className={cn(
 "transition-colors duration-150 group cursor-pointer relative",
 theme === "dark"
 ? "hover:bg-blue-500/10"
 : "hover:bg-blue-500/5",
 )}
 >
 <td className="py-4 sm:py-6 pl-2 sm:pl-8 text-center ">
 <ASRRankBadge rank={c.displayRank} />
 </td>
 <td className="py-4 sm:py-6 px-1 sm:px-4 text-left max-w-[110px] sm:max-w-[200px] ">
 <div className="flex items-center gap-1.5 sm:gap-3 text-left min-w-0 h-full">
 <span className="emoji-slot text-[14px] sm:text-2xl shrink-0">
 {formatFlagsWithSpace(c.flag)}
 </span>
 <span
 className={cn(
 "text-[10px] sm:text-[16px] font-black uppercase truncate leading-tight group-hover:text-blue-500 transition-colors",
 theme === "dark"
 ? "text-zinc-100"
 : "text-zinc-800",
 )}
 >
 {c.name}
 </span>
 </div>
 </td>
 <td className="py-4 sm:py-6 px-1 sm:px-4 text-right">
 <span className="text-[12px] sm:text-[20px] font-black tabular-nums tracking-tighter text-amber-500">
 {String(c.gold)}
 </span>
 </td>
 <td className="py-4 sm:py-6 px-1 sm:px-4 text-right">
 <span className="text-[12px] sm:text-[20px] font-black tabular-nums tracking-tighter text-zinc-400">
 {String(c.silver)}
 </span>
 </td>
 <td className="py-4 sm:py-6 px-1 sm:px-4 text-right">
 <span className="text-[12px] sm:text-[20px] font-black tabular-nums tracking-tighter text-[#CE8946]">
 {String(c.bronze)}
 </span>
 </td>
 <td className="py-4 sm:py-6 pr-2 sm:pr-8 text-right">
 <span
 className={cn(
 "text-[12px] sm:text-[24px] font-black tracking-tighter tabular-nums group-hover:text-blue-500 transition-all",
 theme === "dark" ? "text-white" : "text-zinc-900",
 )}
 >
 {String(c.total)}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 <div className="px-4 sm:px-6 mt-8">
 <ASRPromotionBanner
 type={
 ["coach", "setter"][
 Math.floor(Math.random() * 2)
 ] as any
 }
 theme={theme}
 />
 </div>
 </div>
 );
 },
);
