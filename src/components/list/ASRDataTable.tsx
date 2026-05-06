import React, { useContext } from "react";
import { Search, CloudOff } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import { ThemeContext } from "../../App";
import { ASRListItem } from "../ASRListItems";
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from "../../store/useDataStore";

interface ASRDataTableProps {
 data: any[];
 columns: any[];
 viewType?: "table" | "card";
 onItemClick?: (item: any) => void;
 emptyMessage?: string;
 isLoading?: boolean;
 visibleCount?: number;
 observerTarget?: React.RefObject<HTMLDivElement> | null;
 showRankings?: boolean;
 hideSubtitle?: boolean;
 middleLabel?: string;
 showVideoColumn?: boolean;
}

export const ASRDataTable = React.memo(
 ({
 data,
 columns,
 viewType = "table",
 onItemClick,
 isLoading = false,
 showRankings = true,
 middleLabel = "ATHLETE / DATA",
 showVideoColumn = false,
 }: ASRDataTableProps) => {
 const theme = useContext(ThemeContext);
 const hasError = useDataStore(s => s.hasError);
 
 const virtualizer = useWindowVirtualizer({
 count: data?.length || 0,
 estimateSize: () => viewType === "card" ? (window.innerWidth >= 1024 ? 120 : window.innerWidth >= 640 ? 100 : 100) : (window.innerWidth >= 1024 ? 80 : 64),
 overscan: 5,
 });

 const statColumns = React.useMemo(() => columns.filter((c: any) => !c.isRank && c.type !== "profile"), [columns]);

 if (isLoading) {
 // ... same loading stuff
 return (
 <div className="flex flex-col gap-2 p-4">
 {[1, 2, 3, 4, 5, 6].map((i) => (
 <div
 key={i}
 className={cn(
 "h-[72px] w-full rounded-2xl border flex items-center px-4 gap-4 animate-pulse",
 theme === "dark"
 ? "bg-white/[0.02] border-white/[0.05]"
 : "bg-black/[0.02] border-black/[0.05]",
 )}
 >
 <div
 className={cn(
 "w-10 h-10 rounded-full shrink-0",
 "bg-black/10 dark:bg-white/10",
 )}
 />
 <div className="flex-1 flex flex-col gap-2">
 <div
 className={cn(
 "h-3 w-32 rounded-full",
 theme === "dark" ? "bg-white/20" : "bg-black/20",
 )}
 />
 <div
 className={cn(
 "h-2 w-20 rounded-full",
 "bg-black/10 dark:bg-white/10",
 )}
 />
 </div>
 </div>
 ))}
 </div>
 );
 }

 if (!data || data.length === 0) {
 if (hasError) {
 return (
 <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in duration-700 min-h-[50vh]">
 <div
 className={cn(
 "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
 theme === "dark"
 ? "border-red-900/30 bg-red-950/20"
 : "border-red-200 bg-red-50/50",
 )}
 >
 <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", theme === "dark" ? "bg-red-500/10" : "bg-red-500/10")}>
 <CloudOff size={24} className="text-red-500" />
 </div>
 <h3 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", theme === "dark" ? "text-red-400" : "text-red-600")}>
 NETWORK ERROR
 </h3>
 <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 line-clamp-2", theme === "dark" ? "text-red-400" : "text-red-600")}>
 WE COULDN'T CONNECT TO THE ASSETS SERVER.
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in duration-700 min-h-[50vh]">
 <div
 className={cn(
 "p-8 sm:p-12 w-full max-w-sm rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
 "theme-panel",
 )}
 >
 <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", "bg-black/5 dark:bg-white/5")}>
 <Search size={24} className={"theme-text-faint"} />
 </div>
 <h3 className={cn("text-lg sm:text-xl font-black uppercase tracking-widest", "theme-text-base")}>
 NO RECORDS FOUND
 </h3>
 <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-50 px-2 line-clamp-2", "theme-text-muted")}>
 TRY ADJUSTING YOUR FILTERS OR SEARCH TERM.
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="flex flex-col w-full pb-32">
 {showRankings && (
 <div
 className={cn(
 "flex items-center text-[8px] sm:text-[10px] lg:text-[13px] font-black uppercase tracking-widest pt-4 pb-2 select-none border-b border-black/5 mb-2",
 theme === "dark"
 ? "opacity-30 text-white border-white/5"
 : "opacity-50 text-zinc-900 border-black/5",
 viewType === "card" ? "pl-4 sm:pl-5 lg:pl-6 pr-4 sm:pr-5 lg:pr-6 mx-4" : "mx-4",
 )}
 >
 {viewType === "card" ? (
          <div className="flex items-center min-w-0 pr-1 flex-1 gap-2 sm:gap-4 lg:gap-6">
            <div className="w-10 sm:w-16 lg:w-20 shrink-0 flex items-center justify-center text-center">RANK</div>
            <div className="flex flex-col min-w-0 flex-1 text-left">{middleLabel}</div>
          </div>
        ) : (
          <>
            <div className="w-16 sm:w-24 lg:w-32 pl-3 sm:pl-10 lg:pl-12 text-center shrink-0">RANK</div>
            <div className="flex-1 pl-2 sm:pl-8 lg:pl-10 pr-2 text-left">{middleLabel}</div>
          </>
        )}
 <div
 className={cn(
 "flex items-center",
 viewType === "card" ? "gap-2 sm:gap-4" : "gap-0",
 )}
 >
 {statColumns.map((c: any, i: number) => (
 <div
 key={i}
 className={`${c.width || "w-20 sm:w-24 lg:w-32"} px-1 sm:px-4 lg:px-6 text-right shrink-0`}
 >
 {c.label}
 </div>
 ))}
 {showVideoColumn && <div className="w-10 sm:w-16 lg:w-20 pr-4 sm:pr-6 lg:pr-8 ml-2 shrink-0" />}
 </div>
 </div>
 )}

 <div
 style={{ width: "100%", position: "relative", height: virtualizer.getTotalSize() }}
 className="px-4"
 >
 {virtualizer.getVirtualItems().map((virtualRow) => {
 const item = data[virtualRow.index];
 const absoluteTransform = `translateY(${virtualRow.start}px)`;

 if (item.isDivider) {
 return (
 <div
 key={virtualRow.key}
 data-index={virtualRow.index}
 ref={virtualizer.measureElement}
 style={{
 position: "absolute",
 top: 0,
 left: 0,
 width: "100%",
 transform: absoluteTransform,
 }}
 className={cn(
 "flex items-center gap-4 py-8 px-4",
 viewType === "card" ? "col-span-full" : "",
 )}
 >
 <div className="h-[1px] flex-1 bg-zinc-800/20" />
 <span
 className={cn(
 "text-[10px] font-black uppercase tracking-[0.2em]",
 "theme-text-muted",
 )}
 >
 {item.label}
 </span>
 <div className="h-[1px] flex-1 bg-zinc-800/20" />
 </div>
 );
 }

 return (
 <div
 key={virtualRow.key}
 data-index={virtualRow.index}
 ref={virtualizer.measureElement}
 style={{
 position: "absolute",
 top: 0,
 left: 0,
 width: "100%",
 transform: absoluteTransform,
 }}
 className={cn("w-full px-4", viewType === "card" && "pb-3")}
 >
 <ASRListItem
 variant={viewType}
 rank={item.currentRank}
 title={item.name}
 subtitle={null}
 flag={item.region || item.flag || item.country}
 stats={statColumns.map((c: any) => ({
 value:
 typeof c.getValue === "function"
 ? c.getValue(item)
 : item[c.key],
 color: c.color,
 label: c.label,
 }))}
 videoUrl={item.videoUrl || item.demoVideo}
 mapUrl={item.mapUrl}
 columns={columns}
 shouldFade={item.shouldFade}
 badgeContent={item.badgeContent}
 onClick={() => onItemClick && onItemClick(item)}
 showVideoIcon={showVideoColumn}
 />
 </div>
 );
 })}
 </div>
 </div>
 );
 },
);
