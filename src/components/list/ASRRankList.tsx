import React, { useContext } from "react";
import { Activity } from "lucide-react";
import { motion } from "motion/react";
import { cn, isPlaceholderPlayer, cleanNumeric, getCombinedFlags } from "../../lib/asr-utils";
import { ThemeContext } from "../../theme-context";
import { ModalScrollContext } from "../common/ASRBaseModal";
import { ASRSectionHeading } from "../common/ASRSectionHeading";
import { ASRListItem } from "../ASRListItems";

import { ASRDataContext } from "../../types";

interface ASRRankListProps {
 title?: string;
 athletes: unknown[];
 valueLabel?: string;
 dataContext?: ASRDataContext;
 onPlayerClick?: (meta: Record<string, unknown>) => void;
 onEntityClick: (type: string, data: Record<string, unknown> | string | { name?: string; pKey?: string }) => void;
 limit?: number | null;
 className?: string;
 hideSubtitle?: boolean;
 entityType?: "player" | "setter" | "course" | "team" | "region";
 padTo?: number;
 isCompact?: boolean;
 scrollElementRef?: React.RefObject<HTMLElement | null>;
}

export const ASRRankList = ({
 title,
 athletes,
 valueLabel = "TIME",
 dataContext = {},
 onPlayerClick,
 onEntityClick,
 limit = 0,
 className,
 hideSubtitle,
 entityType,
 padTo = 0,
 isCompact = true,
 scrollElementRef,
}: ASRRankListProps) => {
 const theme = useContext(ThemeContext);
 const modalScrollRef = useContext(ModalScrollContext);
 const activeScrollRef = scrollElementRef || (modalScrollRef.current ? modalScrollRef : null);
 const { atMet = {}, cMet = {} } = dataContext;

    const { finalAthletes, listRenderKey } = React.useMemo(() => {
    const displayAthletes = [...athletes];
    if (padTo > 0 && displayAthletes.length < padTo) {
      const padCount = padTo - displayAthletes.length;
      for (let i = 0; i < padCount; i++) {
        displayAthletes.push({ pKey: "UNCLAIMED RANK", isUnclaimed: true } as unknown);
      }
    }

    const _finalAthletes = limit ? displayAthletes.slice(0, limit) : displayAthletes;

    let _listRenderKey = "empty";
    if (displayAthletes && displayAthletes.length > 0) {
      const firstItem = displayAthletes[0] as Record<string, unknown> | unknown[];
      const topKey = Array.isArray(firstItem)
        ? firstItem[0]
        : (firstItem as Record<string, unknown>).pKey || (firstItem as Record<string, unknown>).label || "unknown";
      _listRenderKey = `${topKey}`;
    }

    return { finalAthletes: _finalAthletes, listRenderKey: _listRenderKey };
  }, [athletes, limit, padTo]);

  const [visibleCount, setVisibleCount] = React.useState(20);
  const loaderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setVisibleCount(20);
  }, [finalAthletes]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 20, finalAthletes.length));
        }
      },
      { root: activeScrollRef ? activeScrollRef.current : null, rootMargin: "200px" }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [finalAthletes.length, activeScrollRef]);

 return (
 <div className={cn("space-y-6 text-left overflow-visible", className)}>
 {title && (
 <ASRSectionHeading title={title} theme={theme as "dark" | "light"} />
 )}
 <motion.div key={listRenderKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 overflow-visible">
 {finalAthletes && finalAthletes.length > 0 ? (
          <div className="flex flex-col">
            {finalAthletes.slice(0, visibleCount).map((item, i) => {
 const isArray = Array.isArray(item);
 const pKey = isArray
 ? item[0]
 : item.pKey || item.label || item.id || "";
 const points = isArray ? undefined : (item.pts ?? item.points);
 const time = isArray
 ? item[1]
 : (item.time ?? item.value ?? item.num);
 const explicitVideoUrl = isArray ? item[2] : item.videoUrl;

 const meta =
 atMet[pKey] ||
 cMet[String(pKey).toUpperCase()] ||
 (isArray ? { name: pKey } : item);
 if (isPlaceholderPlayer(meta.name) && pKey !== "UNCLAIMED RANK")
 return null;

 const stats = [];
 const isUnclaimedItem = item.isUnclaimed;

 if (isUnclaimedItem) {
 stats.push({ value: "---", label: "PTS" });
 stats.push({ value: "---", label: "TIME" });
 } else if (!isArray && points !== undefined && time !== undefined) {
 stats.push({
 value: (cleanNumeric(points) || 0).toFixed(2),
 label: "PTS",
 });
 stats.push({
 value:
 item.timeDisplay ||
 (typeof time === "number" ? `${time.toFixed(2)}s` : time) ||
 "--:--",
 label: "TIME",
 });
 } else {
 const value = isArray
 ? item[1]
 : (item.pts ??
 item.points ??
 item.value ??
 item.impact ??
 item.runs ??
 item.num);
 const isWholeNumber = [
 "IMPACT",
 "🔥",
 "FIRE",
 "WINS",
 "RECORDS",
 "SETS",
 "RANK",
 "RUNS",
 ].includes(String(valueLabel || "").toUpperCase());
 stats.push({
 value:
 typeof value === "number"
 ? isWholeNumber
 ? Math.round(value).toString()
 : value.toFixed(2)
 : value || "--",
 label: valueLabel,
 });
 }

 const courseMeta =
 cMet[String(pKey).toUpperCase()] || item.rawCourse || {};

 const titleStr = isUnclaimedItem
 ? "--"
 : String(
 isArray
 ? meta.name || pKey
 : item.label || item.name || meta.name || pKey || "UNKNOWN",
 ).toUpperCase();

 return (
            <div key={`${pKey}-${i}`} data-index={i}>
              <div className="pb-3">
                <ASRListItem
 variant="card"
 isCompact={isCompact}
 rank={
 isArray
 ? i + 1
 : item.rank ||
 item.currentRank ||
 (isUnclaimedItem ? i + 1 : "UR")
 }
 title={titleStr}
 isUnclaimed={isUnclaimedItem}
 shouldFade={isUnclaimedItem || item.shouldFade}
 subtitle={
 isUnclaimedItem
 ? "--"
 : hideSubtitle
 ? null
 : (() => {
     const locText = isArray ? meta.location || meta.countryName || null : item.city || item.location || meta.location || meta.city;
     if (!locText || locText === "UNKNOWN") return null;
     return (
       <button
         type="button"
         onClick={(e) => {
           e.stopPropagation();
           onEntityClick("region", { name: String(locText) });
         }}
         className="hover:underline active:opacity-50 transition-all text-left truncate"
       >
         {locText}
       </button>
     );
   })()
 }
 flag={getCombinedFlags(item, meta)}
                stats={stats}
 videoUrl={explicitVideoUrl || item.videoUrl || item.demoVideo}
 mapUrl={
 item.mapUrl ||
 item.coordinates ||
 meta.coordinates ||
 meta.mapUrl ||
 courseMeta.coordinates ||
 courseMeta.mapUrl
 }
 onClick={() => {
 if (entityType) onEntityClick(entityType, meta);
 else if (!isArray && item.label)
 onEntityClick("course", { name: item.label });
 else if (!isArray && item.name && valueLabel === "IMPACT")
 onEntityClick("course", { name: item.name });
 else if (onPlayerClick) onPlayerClick(meta);
 else onEntityClick("player", meta);
 }}
 showVideoIcon={true}
                />
              </div>
            </div>
          );
         })}
         {visibleCount < finalAthletes.length && (
           <div ref={loaderRef} className="h-20 w-full flex items-center justify-center">
             <div className="animate-pulse w-8 h-8 rounded-full border-2 text-zinc-500" />
           </div>
         )}
       </div>
     ) : (
 <div
 className={cn(
 "p-8 sm:p-12 w-full max-w-sm mx-auto mt-4 rounded-[2rem] border border-dashed flex flex-col items-center justify-center text-center gap-4 transition-colors",
 "theme-panel",
 )}
 >
 <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-1", "bg-black/5 dark:bg-white/5")}>
 <Activity size={24} className={"theme-text-faint"} />
 </div>
 <h2 className={cn("text-sm sm:text-base font-black uppercase tracking-widest", "theme-text-base")}>
 NO ENTRIES FOUND
 </h2>
 </div>
 )}
 
 </motion.div>
 </div>
 );
};
