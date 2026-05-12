/* eslint-disable @typescript-eslint/no-explicit-any */
 
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
    const [isVisible, setIsVisible] = useState(true);

    const isAllTime = eventType === "all-time";
    const stats = useKpiStats();

    const CloseButton = () => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
        }}
        className={cn(
          "absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full transition-colors z-50",
          theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5"
        )}
      >
        <X className="w-4 h-4 sm:w-5 sm:h-5 opacity-40 hover:opacity-100 transition-opacity" />
      </button>
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

    if (!isVisible) return null;

    if (isAllTime && stats) {
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={onHelp}
          className={cn(
            "w-full h-10 sm:h-12 flex items-center justify-center relative overflow-hidden outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer transition-all active:scale-95 group border-b",
            theme === "dark"
              ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40"
              : "bg-white/40 border-black/5 shadow-xl shadow-black/5",
          )}
        >
          {/* The Rotating Neon Border - Full Wrap */}
          <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 transition-opacity duration-500">
            <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity neon-border-rotate-x-slow" />
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
        </div>
      );
    }

    if (!currentTime)
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={onHelp}
          className={cn(
            "w-full h-10 sm:h-12 flex items-center justify-center cursor-pointer transition-all active:scale-95 border-b relative overflow-hidden outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500",
            theme === "dark"
              ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40 text-white"
              : "bg-white/40 border-black/5 shadow-xl shadow-black/5 text-black",
          )}
        >
          {/* The Rotating Neon Border - Full Wrap */}
          <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 transition-opacity duration-500">
            <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)] opacity-40 neon-border-rotate-x-slow" />
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
        </div>
      );

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onHelp}
        className={cn(
          "w-full h-10 sm:h-12 flex items-center justify-center relative overflow-hidden cursor-pointer transition-all active:scale-95 outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500 group border-b",
          theme === "dark"
            ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40"
            : "bg-white/40 border-black/5 shadow-xl shadow-black/5",
        )}
      >
        <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 transition-opacity duration-500">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)] opacity-40 group-hover:opacity-100 transition-opacity neon-border-rotate-x-slow" />
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
            "flex items-center gap-3 sm:gap-8 z-20 font-black tracking-tight transition-colors pr-10 pl-2 sm:px-0",
            "theme-text-base",
          )}
        >
          <div className="flex items-center gap-2 hidden min-[360px]:flex">
            <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest opacity-60">
              OPEN CLIPS DUE IN:
            </span>
          </div>
          <div className="flex items-center font-black tabular-nums tracking-tighter">
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.days).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[12px] ml-1 opacity-50">
                D
              </span>
            </div>
            <span className="opacity-30 mx-1.5 sm:mx-3">:</span>
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[12px] ml-1 opacity-50">
                H
              </span>
            </div>
            <span className="opacity-30 mx-1.5 sm:mx-3">:</span>
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[12px] ml-1 opacity-50">
                M
              </span>
            </div>
            <span className="opacity-30 mx-1.5 sm:mx-3">:</span>
            <div className="flex items-center">
              <span className="text-[16px] sm:text-[20px]">
                {String(currentTime.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-[12px] ml-1 opacity-50">
                S
              </span>
            </div>
          </div>
        </div>
        <CloseButton />
      </div>
    );
  },
);
