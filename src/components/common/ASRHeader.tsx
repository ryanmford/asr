/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { Moon, Sun, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import { ASRNeonToggle } from "./ASRNeonToggle";
import { ASRGlobalSearch } from "./ASRGlobalSearch";
import { useDataStore } from "../../store/useDataStore";

interface ASRHeaderProps {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  eventType: "open" | "all-time";
  setEventType: (type: "open" | "all-time") => void;
  hideTabs?: boolean;
  centerSlot?: React.ReactNode;
  leftSlot?: React.ReactNode;
  isTransparent?: boolean;
  showSearch?: boolean;
}

export const ASRHeader = React.memo(
  ({
    theme,
    setTheme,
    eventType,
    setEventType,
    hideTabs,
    centerSlot,
    leftSlot,
    isTransparent,
    showSearch,
  }: ASRHeaderProps) => {
    const isSyncing = useDataStore((s) => s.isSyncing);
    const hasError = useDataStore((s) => s.hasError);
    return (
      <header
        className={cn(
          "z-[60] w-full px-4 py-3 sm:py-4 flex items-center border-b backdrop-blur-xl pointer-events-auto transition-all duration-500 gap-2 select-none",
          isTransparent
            ? "bg-transparent border-transparent shadow-none"
            : theme === "dark"
              ? "bg-zinc-950/70 border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
              : "bg-white/70 border-black/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.02)]",
        )}
      >
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex min-w-0 pr-2 sm:pr-8 flex-1">
            {showSearch && (
              <div className="w-full">
                <ASRGlobalSearch theme={theme} />
              </div>
            )}
            {leftSlot && (
              <div className="w-full flex items-center">
                {leftSlot}
              </div>
            )}
          </div>

          {!hideTabs ? (
            <div className="flex w-full min-w-0 justify-center">
              <ASRNeonToggle
                options={[
                  { label: "OPEN", value: "open" },
                  { label: "ALL-TIME", value: "all-time" },
                ]}
                activeOption={eventType}
                onChange={(t) => setEventType(t as any)}
                layoutId="header-pill"
                theme={theme}
                className="w-full max-w-[260px] sm:max-w-[352px] sm:w-[352px]"
              />
            </div>
          ) : centerSlot ? (
            <div className="flex shrink-0 justify-center px-4 max-w-[400px]">
              {centerSlot}
            </div>
          ) : null}

          <div className={cn("flex items-center justify-end gap-2 shrink-0", (!hideTabs || centerSlot) ? "flex-1" : "flex-none")}>
            {hasError ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black tracking-widest uppercase">
                <CloudOff size={10} /> OFFLINE
              </div>
            ) : isSyncing ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-[9px] font-black tracking-widest uppercase opacity-70">
                <RefreshCw size={10} className="animate-spin" /> SYNCING
              </div>
            ) : null}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className={cn(
                "group/theme min-w-12 h-12 flex items-center justify-center rounded-full border transition-all duration-300 active:scale-95 outline-none overflow-hidden backdrop-blur-md relative",
                theme === "dark"
                  ? "bg-zinc-900/80 border-white/10 text-white/70 hover:text-white hover:bg-zinc-800 hover:border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
                  : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm shadow-black/5",
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-white/10 opacity-0 group-hover/theme:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 transition-transform duration-500 group-hover/theme:rotate-12 group-active/theme:-rotate-12">
                {theme === "dark" ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2.5} />}
              </div>
            </button>
          </div>
        </div>
      </header>
    );
  },
);
