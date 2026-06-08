import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface ASRCountdownProps {
  targetDate: string;
  eventType: string;
  onHelp: () => void;
  theme: "light" | "dark";
}

export const ASRCountdown = React.memo(({ theme }: ASRCountdownProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(() => {
    return sessionStorage.getItem("asr_banner_dismissed") !== "true";
  });

  if (!isVisible) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem("asr_banner_dismissed", "true");
    setIsVisible(false);
  };

  return (
    <div
      onClick={() => navigate("/rankings?eventType=open")}
      className={cn(
        "relative z-[40] w-full border-b flex items-center justify-center select-none overflow-hidden transition-colors duration-500 cursor-pointer hover:opacity-90 py-1.5 sm:py-2",
        theme === "dark"
          ? "border-transparent text-zinc-100 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          : "border-transparent text-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.03)]"
      )}
    >
      <div className="absolute inset-0 z-0">
        {/* Ambient Glow */}
        <div className="absolute inset-0 neon-gradient-base animate-border-shift blur-[6px] opacity-40" />
        {/* Sharp Edge Border */}
        <div className="absolute inset-0 neon-gradient-base animate-border-shift opacity-80" />
        {/* Inner Surface */}
        <div
          className={cn(
            "absolute inset-[1px] z-10 backdrop-blur-md",
            theme === "dark" ? "bg-zinc-950/90" : "bg-white/95"
          )}
        />
      </div>

      <div className="relative z-20 flex items-center justify-center w-full px-12 sm:px-16 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] leading-tight gap-3 sm:gap-4">
        <div className="flex flex-col items-center">
            <span>2026 ASR OPEN</span>
            <span>FINAL RESULTS</span>
        </div>
        <div className={cn("w-[1px] h-6 sm:h-8 opacity-30", theme === "dark" ? "bg-white" : "bg-black")} />
        <div className="flex flex-col items-center">
            <span>PRESENTED BY</span>
            <span>STR/KE MVMNT</span>
        </div>
      </div>

      <button
        onClick={handleClose}
        className={cn(
          "absolute right-2 sm:right-4 z-30 p-1 sm:p-2 rounded-full transition-colors",
          theme === "dark" ? "hover:bg-white/10 text-white/70 hover:text-white" : "hover:bg-black/5 text-black/50 hover:text-black"
        )}
      >
        <X className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
});
