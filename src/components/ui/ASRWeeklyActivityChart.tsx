import React, { useMemo, useContext, useState, useRef } from "react";
import { cn } from "../../lib/utils";
import { ThemeContext } from "../../theme-context";
import { motion, AnimatePresence } from "motion/react";

interface ActivityChartProps {
  runs: { date?: string | null }[];
  type?: "run" | "set" | "course";
}

export const ASRWeeklyActivityChart = ({
  runs,
  type = "run",
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

  const { weeks, totalRuns } = useMemo(() => {
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

    return { weeks: weekCounts, totalRuns: runCount };
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

  return (
    <div ref={wrapperRef} className="flex flex-col gap-2 relative mt-4">
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
            52-WEEK ACTIVITY
          </span>
          <div className="hidden items-center gap-[2px] opacity-60">
            <div
              className={cn(
                "w-2 h-2 rounded-[1px]",
                "bg-black/5 dark:bg-white/5",
              )}
              title="0"
            />
            <div
              className={cn(
                "w-2 h-2 rounded-[1px]",
                theme === "dark" ? "bg-blue-900/60" : "bg-blue-200",
              )}
              title="1"
            />
            <div
              className={cn(
                "w-2 h-2 rounded-[1px]",
                theme === "dark" ? "bg-blue-700/80" : "bg-blue-500",
              )}
              title="2"
            />
            <div
              className={cn(
                "w-2 h-2 rounded-[1px]",
                theme === "dark" ? "bg-blue-500" : "bg-blue-500",
              )}
              title="3+"
            />
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
          onMouseLeave={() => setHoverData(null)}
        >
          {weeks.map((week, i) => {
          let levelClass = "bg-black/5 dark:bg-white/5";

          if (week.count === 1) {
            levelClass = theme === "dark" ? "bg-blue-900/60" : "bg-blue-200";
          } else if (week.count === 2) {
            levelClass = theme === "dark" ? "bg-blue-700/80" : "bg-blue-500";
          } else if (week.count >= 3) {
            levelClass = theme === "dark" ? "bg-blue-500" : "bg-blue-500";
          }

          return (
            <div
              key={i}
              className={cn(
                "w-full aspect-square rounded-[2px] transition-all duration-200 cursor-crosshair z-10",
                "hover:ring-2 hover:ring-opacity-50 hover:scale-125 hover:z-20",
                theme === "dark"
                  ? "hover:ring-blue-500"
                  : "hover:ring-blue-500",
                levelClass,
              )}
              onMouseEnter={(e) => {
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
              <span
                className={theme === "dark" ? "text-blue-500" : "text-blue-500"}
              >
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
