/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { cn, formatFlagsWithSpace, getCombinedFlags } from "../../lib/asr-utils";
import { useDataStore } from "../../store/useDataStore";

interface ASRLiveTickerProps {
  onEntityClick: (type: string, data: any) => void;
  theme: "light" | "dark";
}

export const ASRLiveTicker = React.memo(
  ({ onEntityClick, theme }: ASRLiveTickerProps) => {
    const rawFeed = useDataStore((s) => s.recentFeed);
    const [feed, setFeed] = React.useState(rawFeed);

    React.useEffect(() => {
      setFeed((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(rawFeed)) {
          return rawFeed;
        }
        return prev;
      });
    }, [rawFeed]);

    if (!feed || feed.length === 0) {
      return (
        <div
          className={cn(
            "relative z-[40] w-full h-8 sm:h-10 border-b flex items-center justify-center select-none overflow-hidden backdrop-blur-md transition-colors duration-500",
            theme === "dark"
              ? "bg-zinc-950/80 border-white/5 text-zinc-100 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "bg-white/90 border-zinc-200/50 text-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
          )}
        >
          <div 
            className="opacity-30 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)"
            }}
          >
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
    
    // Calculate a consistent scroll speed (~60 pixels per second)
    const estimatedWidthPerItem = 300;
    const scrollDistance = extendedFeed.length * estimatedWidthPerItem;
    const animationDurationSeconds = Math.max(20, scrollDistance / 60);

    return (
      <div
        className={cn(
          "relative z-[40] w-full overflow-hidden border-b h-10 sm:h-12 flex items-center select-none transition-colors duration-500 backdrop-blur-md",
          theme === "dark"
            ? "bg-zinc-950/80 border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            : "bg-white/90 border-zinc-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]",
        )}
      >
        <div
          className="flex items-center shrink-0 whitespace-nowrap gap-12 sm:gap-20 animate-marquee"
          style={{ 
            animationDuration: `${animationDurationSeconds}s`,
            maskImage: "linear-gradient(to right, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)"
          }}
        >
          {duplicatedFeed.map((item: any, idx: number) => {
            const fires = item.fireCount || 0;
            const rank = item.rank || 0;
            const athleteFlag = getCombinedFlags(item.athlete).trim();
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
      </div>
    );
  },
);
