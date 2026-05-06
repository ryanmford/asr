import React, { useState, useEffect, useRef } from "react";
import { cn, formatFlagsWithSpace } from "../../lib/asr-utils";
import { useDataStore } from "../../store/useDataStore";

interface ASRLiveTickerProps {
  onEntityClick: (type: string, data: any) => void;
  theme: "light" | "dark";
}

export const ASRLiveTicker = React.memo(
  ({ onEntityClick, theme }: ASRLiveTickerProps) => {
    const feed = useDataStore((s) => s.recentFeed);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      if (!scrollContainerRef.current || isHovered) return;
      const container = scrollContainerRef.current;
      let animationFrameId: number;
      let lastTime = 0;
      const speed = 1.0;

      const animate = (time: number) => {
        if (lastTime === 0) lastTime = time;
        let delta = time - lastTime;
        if (delta > 50) delta = 16.6; // Cap delta to prevent jumps when tab active
        lastTime = time;

        container.scrollLeft += (speed * delta) / 16.6;
        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth && halfWidth > 0) {
          container.scrollLeft -= halfWidth;
        }
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);
      return () => window.cancelAnimationFrame(animationFrameId);
    }, [isHovered, feed]);

    if (!feed || feed.length === 0) {
      return (
        <div
          className={cn(
            "relative z-[40] w-full h-8 sm:h-10 border-b flex items-center justify-center select-none overflow-hidden backdrop-blur-md transition-colors duration-500",
            theme === "dark"
              ? "bg-zinc-950/80 border-white/5 text-zinc-100 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "bg-white/80 border-zinc-200/50 text-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
          )}
        >
          <div className="opacity-30 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            SCANNING LIVE STATS...
          </div>
        </div>
      );
    }

    // Extend feed to ensure it's wider than any screen, solving the scroll max-out freeze issue
    let extendedFeed = [...feed];
    while (extendedFeed.length > 0 && extendedFeed.length < 20) {
      extendedFeed = [...extendedFeed, ...feed];
    }
    const duplicatedFeed = [...extendedFeed, ...extendedFeed];

    return (
      <div
        className={cn(
          "relative z-[40] w-full overflow-hidden border-b h-10 sm:h-12 flex items-center select-none ios-gpu-fix transition-colors duration-500 backdrop-blur-md",
          theme === "dark"
            ? "bg-zinc-950/80 border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            : "bg-white/80 border-zinc-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
        )}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setIsHovered(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setIsHovered(false);
        }}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        onTouchCancel={() => setIsHovered(false)}
      >
        <div
          ref={scrollContainerRef}
          className="flex items-center whitespace-nowrap overflow-x-hidden no-scrollbar gap-12 sm:gap-20 px-8"
        >
          {duplicatedFeed.map((item: any, idx: number) => {
            const fires = item.fireCount || 0;
            const rank = item.rank || 0;
            const athleteFlag = formatFlagsWithSpace(
              item.athlete?.region ||
                item.athlete?.flag ||
                item.athlete?.country ||
                "",
            ).trim();
            const courseFlag = formatFlagsWithSpace(
              item.course?.flag || "",
            ).trim();
            const playerName = String(item.name || "")
              .trim()
              .toUpperCase();
            const courseNameRaw = String(
              item.courseName || item.course?.name || "UNKNOWN COURSE",
            )
              .trim()
              .toUpperCase();
            const rawCity = String(
              item.course?.city || item.course?.location || "",
            )
              .trim()
              .toUpperCase();
            const cityName =
              rawCity === "UNKNOWN" || rawCity === "UNDEFINED" ? "" : rawCity;
            const courseName = cityName
              ? `${courseNameRaw}, ${cityName}`
              : courseNameRaw;
            const resultVal =
              item.result ||
              (typeof item.time === "number" ? item.time.toFixed(2) : "--");

            return (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center font-black tracking-[0.02em] text-[11px] sm:text-[12px] group transition-colors select-none italic"
              >
                <span
                  className={cn(
                    "shrink-0 tabular-nums transition-colors",
                    theme === "dark" ? "text-white/40" : "text-zinc-400",
                  )}
                >
                  {item.timeString || "00:00"}
                </span>
                <span className="whitespace-pre"> </span>

                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEntityClick(
                        "course",
                        item.course || { name: item.courseName },
                      );
                    }}
                    className={cn(
                      "transition-all cursor-pointer flex items-center outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-[2px] active:scale-95",
                      theme === "dark"
                        ? "text-white hover:text-blue-500"
                        : "text-zinc-900 hover:text-blue-500",
                    )}
                  >
                    {courseFlag && (
                      <span className="shrink-0 whitespace-pre">
                        {courseFlag}{" "}
                      </span>
                    )}
                    <span className="shrink-0 font-bold">{courseName}</span>
                  </button>
                  <span className="whitespace-pre"> </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEntityClick(
                        "player",
                        item.athlete || { name: item.name },
                      );
                    }}
                    className={cn(
                      "transition-all cursor-pointer flex items-center outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded-[2px] active:scale-95",
                      theme === "dark"
                        ? "text-white hover:text-blue-500"
                        : "text-zinc-900 hover:text-blue-500",
                    )}
                  >
                    {athleteFlag && (
                      <span className="shrink-0 whitespace-pre">
                        {athleteFlag}{" "}
                      </span>
                    )}
                    <span className="shrink-0 font-bold">{playerName}</span>
                    {rank > 0 && rank <= 3 && (
                      <span className="shrink-0 animate-bounce whitespace-pre">
                        {" "}{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                      </span>
                    )}
                    <span className="whitespace-pre"> </span>
                    <span className="shrink-0 tabular-nums tracking-[0.02em] font-bold">
                      ({resultVal})
                    </span>
                  </button>
                  {fires > 0 && (
                    <div className="flex items-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity h-4">
                      {Array.from({
                        length: Math.max(0, Math.min(3, fires)),
                      }).map((_, i) => (
                        <span
                          key={i}
                          className="animate-pulse whitespace-pre"
                        >
                          {" "}🔥
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l pointer-events-none z-10",
            theme === "dark" ? "from-black" : "from-white",
          )}
        />
        <div
          className={cn(
            "absolute top-0 left-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r pointer-events-none z-10",
            theme === "dark" ? "from-black" : "from-white",
          )}
        />
      </div>
    );
  },
);
