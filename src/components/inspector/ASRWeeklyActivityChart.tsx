import React, { useMemo, useContext, useState, useRef } from "react";
import { cn } from "../../lib/utils";
import { ThemeContext } from "../../theme-context";
import { motion, AnimatePresence } from "motion/react";
import { ASREmptyState } from "../common/ASREmptyState";

interface ActivityChartProps {
  runs: { date?: string | null }[];
  type?: "run" | "set" | "course";
  themeColor?: "blue" | "emerald" | "pink";
  isLoading?: boolean;
}

export const ASRWeeklyActivityChart = ({
  runs,
  type = "run",
  themeColor = "blue",
  isLoading = false,
}: ActivityChartProps) => {
  const theme = useContext(ThemeContext);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{
    count: number;
    weekIdx: number;
    dateStr: string;
    x: number;
    y: number;
  } | null>(null);

  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setHoverData(null);
      }
    };
    
    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick, { passive: true });
    
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, []);

  const { weeks, totalRuns, t1, t2, t3 } = useMemo(() => {
    const today = new Date();
    // Reset today to midnight for precise math
    today.setHours(0, 0, 0, 0);

    const finalTotalWeeks = 52;

    const weekCounts = new Array(finalTotalWeeks).fill(0).map((_, i) => {
      const diffWeeks = (finalTotalWeeks - 1) - i;
      const wStart = new Date(today);
      wStart.setDate(today.getDate() - today.getDay() - diffWeeks * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      return {
        count: 0,
        dateStr: `${wStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${wEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      };
    });

    let runCount = 0;

    runs.forEach((r) => {
      if (!r.date) return;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);

      const runStartOfWeek = new Date(d);
      runStartOfWeek.setDate(d.getDate() - d.getDay());

      const todayStartOfWeek = new Date(today);
      todayStartOfWeek.setDate(today.getDate() - today.getDay());

      const diffTime = todayStartOfWeek.getTime() - runStartOfWeek.getTime();
      if (diffTime >= 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.round(diffDays / 7);

        if (diffWeeks >= 0 && diffWeeks < finalTotalWeeks) {
          weekCounts[(finalTotalWeeks - 1) - diffWeeks].count++;
          runCount++;
        }
      }
    });

    const nonZero = weekCounts.map((w) => w.count).filter((c) => c > 0).sort((a, b) => a - b);
    let t1Val = 1, t2Val = 2, t3Val = 3;
    if (nonZero.length > 0) {
      t1Val = nonZero[Math.max(0, Math.ceil(nonZero.length * 0.25) - 1)];
      t2Val = nonZero[Math.max(0, Math.ceil(nonZero.length * 0.5) - 1)];
      t3Val = nonZero[Math.max(0, Math.ceil(nonZero.length * 0.75) - 1)];
      
      if (t2Val <= t1Val) t2Val = t1Val + 1;
      if (t3Val <= t2Val) t3Val = t2Val + 1;
    }

    return { weeks: weekCounts, totalRuns: runCount, t1: t1Val, t2: t2Val, t3: t3Val };
  }, [runs]);

  const unitMap = {
    run: "run",
    set: "set",
    course: "course",
  };

  const pluralMap = {
    run: "runs",
    set: "sets",
    course: "courses",
  };

  const unit = unitMap[type as keyof typeof unitMap] || "run";
  const unitPlural = pluralMap[type as keyof typeof pluralMap] || "runs";

  const cssColors = {
    blue: {
      dark: ["bg-black/5 dark:bg-white/5", "bg-blue-900/60", "bg-blue-700/80", "bg-blue-500"],
      light: ["bg-black/5 dark:bg-white/5", "bg-blue-200", "bg-blue-400", "bg-blue-500"],
      text: "text-blue-500",
      ring: "ring-blue-500",
      hoverRing: "md:hover:ring-blue-500"
    },
    emerald: {
      dark: ["bg-black/5 dark:bg-white/5", "bg-emerald-900/60", "bg-emerald-700/80", "bg-emerald-500"],
      light: ["bg-black/5 dark:bg-white/5", "bg-emerald-200", "bg-emerald-400", "bg-emerald-500"],
      text: "text-emerald-500",
      ring: "ring-emerald-500",
      hoverRing: "md:hover:ring-emerald-500"
    },
    pink: {
      dark: ["bg-black/5 dark:bg-white/5", "bg-pink-900/60", "bg-pink-700/80", "bg-pink-500"],
      light: ["bg-black/5 dark:bg-white/5", "bg-pink-200", "bg-pink-400", "bg-pink-500"],
      text: "text-pink-500",
      ring: "ring-pink-500",
      hoverRing: "md:hover:ring-pink-500"
    }
  };

  const currentColors = cssColors[themeColor] || cssColors.blue;
  const activeColorSet = theme === "dark" ? currentColors.dark : currentColors.light;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 relative mt-4">
        <div className="flex justify-between items-end mb-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
              52-WEEK ACTIVITY
            </span>
          </div>
          <div className="w-16 h-3 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="w-full relative overflow-hidden pb-1">
          <div
            className="grid gap-[2px] sm:gap-1 relative w-full"
            style={{ gridTemplateColumns: `repeat(13, minmax(0, 1fr))` }}
          >
            {Array.from({ length: 52 }).map((_, i) => (
              <div
                key={i}
                className="w-full aspect-square rounded-[2px] bg-black/5 dark:bg-white/5 animate-pulse"
                style={{ animationDelay: `${i * 0.02}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (totalRuns === 0) {
    return (
      <div className="mt-4">
        <ASREmptyState
          theme={theme || "light"}
          title="No Activity"
          message={`No ${unitPlural} recorded in this 52-week period.`}
        />
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-2 relative mt-4">
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
            52-WEEK ACTIVITY
          </span>
          <div className="hidden items-center gap-[2px] opacity-60">
            <div className={cn("w-2 h-2 rounded-[1px]", activeColorSet[0])} title="0" />
            <div className={cn("w-2 h-2 rounded-[1px]", activeColorSet[1])} title={`1 to ${t1}`} />
            <div className={cn("w-2 h-2 rounded-[1px]", activeColorSet[2])} title={`${t1+1} to ${t2}`} />
            <div className={cn("w-2 h-2 rounded-[1px]", activeColorSet[3])} title={`${t3}+`} />
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          {totalRuns} {totalRuns === 1 ? unit : unitPlural}
        </span>
      </div>

      <div 
        ref={scrollContainerRef}
        className="w-full relative overflow-hidden pb-1 no-scrollbar"
      >
        <div
          ref={containerRef}
          className="grid gap-[2px] sm:gap-1 relative w-full"
          style={{
            gridTemplateColumns: `repeat(13, minmax(0, 1fr))`,
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setHoverData(null);
          }}
        >
          {weeks.map((week, i) => {
            let levelIdx = 0;
            if (week.count > 0 && week.count <= t1) levelIdx = 1;
            else if (week.count > t1 && week.count <= t2) levelIdx = 2;
            else if (week.count > t2) levelIdx = 3;

            return (
              <div
                key={i}
                className={cn(
                  "w-full aspect-square rounded-[2px] transition-all duration-200 cursor-crosshair z-10",
                  "md:hover:ring-2 md:hover:ring-opacity-50 md:hover:scale-125 md:hover:z-20",
                  currentColors.hoverRing,
                  hoverData?.weekIdx === i && `ring-2 ring-opacity-50 scale-125 z-20 ${currentColors.ring}`,
                  activeColorSet[levelIdx],
                )}
                onClick={(e) => {
                  if (!wrapperRef.current) return;
                  const outerRect = wrapperRef.current.getBoundingClientRect();
                  const rect = e.currentTarget.getBoundingClientRect();

                  // Keep tooltip safely inside the container bounds horizontally
                  const rawX = rect.left - outerRect.left + rect.width / 2;
                  const clampedX = Math.max(
                    75,
                    Math.min(outerRect.width - 75, rawX),
                  );

                  setHoverData({
                    count: week.count,
                    weekIdx: i,
                    dateStr: week.dateStr,
                    x: clampedX,
                    y: rect.top - outerRect.top - 8,
                  });
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  if (!wrapperRef.current) return;
                  const outerRect = wrapperRef.current.getBoundingClientRect();
                  const rect = e.currentTarget.getBoundingClientRect();

                  // Keep tooltip safely inside the container bounds horizontally
                  const rawX = rect.left - outerRect.left + rect.width / 2;
                  const clampedX = Math.max(
                    75,
                    Math.min(outerRect.width - 75, rawX),
                  );

                  setHoverData({
                    count: week.count,
                    weekIdx: i,
                    dateStr: week.dateStr,
                    x: clampedX,
                    y: rect.top - outerRect.top - 8,
                  });
                }}
              />
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {hoverData && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-md text-xs shadow-xl border",
              theme === "dark"
                ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                : "bg-white border-zinc-200 text-zinc-800",
            )}
            style={{
              left: hoverData.x,
              top: hoverData.y,
              minWidth: "max-content",
            }}
          >
            <div className="font-bold flex items-center gap-1.5 leading-none mb-1">
              <span className={currentColors.text}>
                {hoverData.count} {hoverData.count === 1 ? unit : unitPlural}
              </span>
            </div>
            <div className={cn("text-[10px] leading-none", "theme-text-muted")}>
              {hoverData.dateStr}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

