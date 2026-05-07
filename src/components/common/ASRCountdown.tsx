import React, { useState, useEffect } from "react";
import { CountUp } from "./CountUp";
import { cn } from "../../lib/asr-utils";
import { X } from "lucide-react";

interface ASRCountdownProps {
  targetDate: string;
  eventType: "open" | "all-time";
  onHelp: () => void;
  theme: "light" | "dark";
}

import { useKpiStats } from "../../hooks/useAppCalculations";

export const ASRCountdown = React.memo(
  ({ targetDate, eventType, onHelp, theme }: ASRCountdownProps) => {
    const [currentTime, setCurrentTime] = useState<any>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    const handleDismiss = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDismissed(true);
    }, []);

    const isAllTime = eventType === "all-time";
    const stats = useKpiStats();

    const CloseButton = () => (
      <div 
        className={cn(
          "absolute right-0 top-[1.2px] bottom-[1.2px] z-30 flex items-center justify-end pl-8 pr-2 pointer-events-none sm:!bg-none sm:!bg-transparent sm:pl-0 sm:pr-0 sm:right-2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto",
          theme === "dark" 
            ? "bg-gradient-to-l from-zinc-950 via-zinc-950/90 to-transparent" 
            : "bg-gradient-to-l from-white via-white/90 to-transparent"
        )}
      >
        <div 
          role="button"
          tabIndex={0}
          onClick={handleDismiss}
          className="p-2 opacity-60 sm:opacity-30 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 pointer-events-auto"
        >
          <X size={14} className="text-current" />
        </div>
      </div>
    );

    useEffect(() => {
      const updateTime = () => {
        const now = +new Date();
        const target = +new Date(targetDate);

        if (isNaN(target)) {
          setCurrentTime(null);
          return;
        }

        const difference = isAllTime ? now - target : target - now;

        if (difference > 0 || isAllTime) {
          const d = Math.abs(difference);
          setCurrentTime({
            total: d,
            days: Math.floor(d / (1000 * 60 * 60 * 24)),
            hours: Math.floor((d / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((d / 1000 / 60) % 60),
            seconds: Math.floor((d / 1000) % 60),
          });
        } else {
          setCurrentTime(null);
        }
      };

      const timer = setInterval(updateTime, 1000);
      updateTime();
      return () => clearInterval(timer);
    }, [targetDate, isAllTime]);

    if (isDismissed) return null;

    if (isAllTime && stats) {
      return (
        <button
          onClick={onHelp}
          className={cn(
            "w-full h-10 sm:h-12 flex items-center justify-center relative overflow-hidden outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer transition-all active:scale-95 group border-b",
            theme === "dark"
              ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40"
              : "bg-white/40 border-black/5 shadow-xl shadow-black/5",
          )}
        >
          {/* The Rotating Neon Border - Full Wrap */}
          <div className="absolute inset-[-250%] neon-border-rotate-x-slow z-0 pointer-events-none transition-opacity duration-500">
            <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* The Inner Surface Fill (with glass effect) */}
          <div
            className={cn(
              "absolute inset-[1.2px] z-10 backdrop-blur-md transition-colors",
              theme === "dark"
                ? "bg-zinc-950/90 group-hover:bg-zinc-900/90"
                : "bg-white/95 group-hover:bg-white",
            )}
          />

          <div
            className={cn(
              "grid grid-cols-5 sm:flex items-center justify-center gap-x-2 sm:gap-x-10 z-20 font-black tracking-tight w-full max-w-2xl mx-auto transition-colors pr-8 pl-2 sm:px-0",
              "theme-text-base",
            )}
          >
            <div className="flex flex-col items-center whitespace-nowrap group">
              <span className="text-[12px] sm:text-[16px] font-black group-hover:text-blue-500 transition-colors leading-none">
                <CountUp end={stats.players} />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black opacity-60 uppercase group-hover:opacity-100 transition-opacity mt-1">
                PLAYERS
              </span>
            </div>
            <div className="flex flex-col items-center whitespace-nowrap group">
              <span className="text-[12px] sm:text-[16px] font-black group-hover:text-blue-500 transition-colors leading-none">
                <CountUp end={stats.courses} />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black opacity-60 uppercase group-hover:opacity-100 transition-opacity mt-1">
                COURSES
              </span>
            </div>
            <div className="flex flex-col items-center whitespace-nowrap group">
              <span className="text-[12px] sm:text-[16px] font-black group-hover:text-blue-500 transition-colors leading-none">
                <CountUp end={stats.cities} />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black opacity-60 uppercase group-hover:opacity-100 transition-opacity mt-1">
                CITIES
              </span>
            </div>
            <div className="flex flex-col items-center whitespace-nowrap group">
              <span className="text-[12px] sm:text-[16px] font-black group-hover:text-blue-500 transition-colors leading-none">
                <CountUp end={stats.countries} />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black opacity-60 uppercase group-hover:opacity-100 transition-opacity mt-1">
                COUNTRIES
              </span>
            </div>
            <div className="flex flex-col items-center whitespace-nowrap group">
              <span className="text-[12px] sm:text-[16px] font-black group-hover:text-blue-500 transition-colors leading-none">
                <CountUp end={stats.runs} />
              </span>
              <span className="text-[9px] sm:text-[10px] font-black opacity-60 uppercase group-hover:opacity-100 transition-opacity mt-1">
                RUNS
              </span>
            </div>
          </div>
          <CloseButton />
        </button>
      );
    }

    if (!currentTime)
      return (
        <button
          onClick={onHelp}
          className={cn(
            "w-full h-10 sm:h-12 flex items-center justify-center cursor-pointer transition-all active:scale-95 border-b relative overflow-hidden outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500",
            theme === "dark"
              ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40 text-white"
              : "bg-white/40 border-black/5 shadow-xl shadow-black/5 text-black",
          )}
        >
          {/* The Rotating Neon Border - Full Wrap */}
          <div className="absolute inset-[-250%] neon-border-rotate-x-slow z-0 pointer-events-none transition-opacity duration-500">
            <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)] opacity-40" />
          </div>

          <div
            className={cn(
              "absolute inset-[1.2px] z-10 backdrop-blur-md",
              theme === "dark" ? "bg-zinc-950/90" : "bg-white/95",
            )}
          />

          <span
            className={cn(
              "text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] relative z-20 pr-6 pl-2 sm:px-0",
              "theme-text-base",
            )}
          >
            SEASON ENDED
          </span>
          <CloseButton />
        </button>
      );

    return (
      <button
        onClick={onHelp}
        className={cn(
          "w-full h-10 sm:h-12 flex items-center justify-center relative overflow-hidden cursor-pointer transition-all active:scale-95 outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500 group border-b",
          theme === "dark"
            ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40"
            : "bg-white/40 border-black/5 shadow-xl shadow-black/5",
        )}
      >
        <div className="absolute inset-[-250%] neon-border-rotate-x-slow z-0 pointer-events-none transition-opacity duration-500">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity" />
        </div>

        <div
          className={cn(
            "absolute inset-[1.2px] z-10 backdrop-blur-md transition-colors",
            theme === "dark"
              ? "bg-zinc-950/90 group-hover:bg-zinc-900/90"
              : "bg-white/95 group-hover:bg-white",
          )}
        />

        <div
          className={cn(
            "flex items-center gap-4 sm:gap-10 z-20 font-black tracking-tight transition-colors pr-8 pl-2 sm:px-0",
            "theme-text-base",
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-60">
              OPEN CLIPS DUE IN:
            </span>
          </div>
          <div className="flex items-center font-black tabular-nums tracking-tighter">
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.days).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[11px] ml-1 opacity-50">
                D
              </span>
            </div>
            <span className="opacity-30 mx-2 sm:mx-4">:</span>
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[11px] ml-1 opacity-50">
                H
              </span>
            </div>
            <span className="opacity-30 mx-2 sm:mx-4">:</span>
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[11px] ml-1 opacity-50">
                M
              </span>
            </div>
            <span className="opacity-30 mx-2 sm:mx-4">:</span>
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[11px] ml-1 opacity-50">
                S
              </span>
            </div>
          </div>
        </div>
        <CloseButton />
      </button>
    );
  },
);
