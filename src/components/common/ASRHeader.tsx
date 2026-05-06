import React from "react";
import { Moon, Sun, CloudOff, RefreshCw } from "lucide-react";
import { cn } from "../../lib/asr-utils";
import { ASRNeonToggle } from "../ui/ASRNeonToggle";
import { useDataStore } from "../../store/useDataStore";

interface ASRHeaderProps {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  eventType: "open" | "all-time";
  setEventType: (type: "open" | "all-time") => void;
  onHome: () => void;
  hideTabs?: boolean;
}

export const ASRHeader = React.memo(
  ({
    theme,
    setTheme,
    eventType,
    setEventType,
    onHome,
    hideTabs,
  }: ASRHeaderProps) => {
    const isSyncing = useDataStore((s) => s.isSyncing);
    const hasError = useDataStore((s) => s.hasError);
    return (
      <header
        className={cn(
          "z-[60] w-full px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between border-b backdrop-blur-xl pointer-events-auto transition-all gap-2",
          theme === "dark"
            ? "bg-zinc-950/70 border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            : "bg-white/70 border-black/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.02)]",
        )}
      >
        <div className="flex flex-col shrink-0">
          <button
            onClick={onHome}
            className={cn(
              "flex items-center gap-2 group active:scale-[0.98] transition-transform text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl",
              "theme-focus"
            )}
          >
            <span
              className={cn(
                "text-[16px] sm:text-[22px] font-sans font-black italic uppercase tracking-tighter leading-none whitespace-nowrap transition-colors flex items-center gap-2",
                "theme-text-base",
              )}
            >
              APEX SPEED RUN
            </span>
          </button>
        </div>

        {!hideTabs && (
          <div className="flex-1 flex justify-center max-w-[200px] sm:max-w-none">
            <ASRNeonToggle
              options={[
                { label: "OPEN", value: "open" },
                { label: "ALL-TIME", value: "all-time" },
              ]}
              activeOption={eventType}
              onChange={(t) => setEventType(t as any)}
              layoutId="header-pill"
              theme={theme}
              className="w-full sm:w-44"
            />
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {hasError ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black tracking-widest uppercase">
              <CloudOff size={10} /> OFFLINE
            </div>
          ) : isSyncing ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black tracking-widest uppercase">
              <RefreshCw size={10} className="animate-spin" /> SYNCING
            </div>
          ) : null}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className={cn(
              "p-2 sm:p-2 rounded-full border transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
              theme === "dark"
                ? "bg-black border-zinc-800 text-white hover:bg-zinc-900 focus-visible:ring-offset-[#030303]"
                : "bg-white border-slate-200 text-black shadow-sm hover:bg-slate-50 theme-focus",
            )}
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>
    );
  },
);
