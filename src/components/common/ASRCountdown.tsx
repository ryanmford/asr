/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState, useEffect } from "react";
import { cn } from "../../lib/asr-utils";
import { X } from "lucide-react";

interface ASRCountdownProps {
  targetDate: string;
  eventType: "open" | "all-time";
  onHelp: () => void;
  theme: "light" | "dark";
}

export const ASRCountdown = React.memo(
  ({ targetDate, eventType, onHelp, theme }: ASRCountdownProps) => {
    const [currentTime, setCurrentTime] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(() => {
      try {
        return sessionStorage.getItem("asr_hide_countdown_v3") !== "true";
      } catch {
        return true;
      }
    });

    const isAllTime = eventType === "all-time";

    const renderCloseButton = () => (
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
          try {
            sessionStorage.setItem("asr_hide_countdown_v3", "true");
          } catch (err) {
            console.warn("Could not save to sessionStorage", err);
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(false);
          try {
            sessionStorage.setItem("asr_hide_countdown_v3", "true");
          } catch (err) {
            console.warn("Could not save to sessionStorage", err);
          }
        }}
        className={cn(
          "absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors z-[100] cursor-pointer pointer-events-auto focus:outline-none flex items-center justify-center",
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

    if (!isVisible || isAllTime) return null;

    if (!currentTime)
      return (
        <div
          className={cn(
            "w-full h-10 sm:h-12 relative overflow-hidden border-b",
            theme === "dark"
              ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40 text-white"
              : "bg-white/40 border-black/5 shadow-xl shadow-black/5 text-black",
          )}
        >
          <div className="w-full max-w-5xl mx-auto px-4 h-full relative flex items-center justify-center">
            <div
              role="button"
              tabIndex={0}
              onClick={onHelp}
              className="absolute inset-x-4 inset-y-0 flex items-center justify-center cursor-pointer transition-all active:scale-95 outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500 z-20"
            >
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] relative pr-6 pl-2 sm:px-0",
                  "theme-text-base",
                )}
              >
                SEASON ENDED
              </span>
            </div>
            {renderCloseButton()}
          </div>

          {/* The Shimmering Neon Outline - Long Trail */}
          <div className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500">
            {/* Ambient Glow */}
            <div className="absolute inset-0 animate-border-shift neon-gradient-base blur-[6px] opacity-30 transition-opacity duration-500" />
            {/* Sharp Edge Border */}
            <div className="absolute inset-0 animate-border-shift neon-gradient-base opacity-40 transition-opacity duration-500" />
          </div>

          <div
            className={cn(
              "absolute inset-[1.2px] z-10 backdrop-blur-md pointer-events-none",
              theme === "dark" ? "bg-zinc-950/90" : "bg-white/95",
            )}
          />
        </div>
      );

    return (
      <div
        className={cn(
          "w-full h-10 sm:h-12 relative overflow-hidden group border-b",
          theme === "dark"
            ? "bg-zinc-950/40 border-white/5 shadow-xl shadow-black/40"
            : "bg-white/40 border-black/5 shadow-xl shadow-black/5",
        )}
      >
        <div className="w-full max-w-5xl mx-auto px-4 h-full relative flex items-center justify-center z-20">
          <div
            role="button"
            tabIndex={0}
            onClick={onHelp}
            className="absolute inset-x-4 inset-y-0 flex items-center justify-center cursor-pointer transition-all active:scale-95 outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div
              className={cn(
                "flex items-center gap-3 sm:gap-8 font-black tracking-tight transition-colors pr-10 pl-2 sm:px-0",
                "theme-text-base",
              )}
            >
              <div className="flex items-center gap-2 hidden min-[360px]:flex shrink-0">
                <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest opacity-60 whitespace-nowrap">
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
          </div>
          {renderCloseButton()}
        </div>

        <div className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500">
          {/* Ambient Glow */}
          <div className="absolute inset-0 animate-border-shift neon-gradient-base blur-[6px] opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
          {/* Sharp Edge Border */}
          <div className="absolute inset-0 animate-border-shift neon-gradient-base opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
        </div>

        <div
          className={cn(
            "absolute inset-[1.2px] z-10 backdrop-blur-md transition-colors pointer-events-none",
            theme === "dark"
              ? "bg-zinc-950/90 group-hover:bg-zinc-900/90"
              : "bg-white/95 group-hover:bg-white",
          )}
        />
      </div>
    );
  },
);
