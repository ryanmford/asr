import React, { useState, useEffect, useRef } from "react";
import { animate } from "motion/react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { cn, THEME } from "../../lib/asr-utils";
import { ASRDataContext } from "../../types";
import { useDataStore } from "../../store/useDataStore";
import { ASRWhatIfSlider } from "./ASRWhatIfSlider";
import { ASRGoalCalculator } from "./ASRGoalCalculator";

const RollingNumber = React.memo(
  ({ value, decimals = 2 }: { value: number; decimals?: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
      const node = ref.current;
      if (!node) return;
      const currentVal =
        parseFloat((node.textContent || "0").replace(/,/g, "")) || 0;
      const controls = animate(currentVal, value, {
        duration: 0.15,
        ease: "easeOut",
        onUpdate: (v) => {
          if (node) {
            node.textContent = v.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
          }
        },
      });
      return () => controls.stop();
    }, [value, decimals]);

    return (
      <span ref={ref} className="tabular-nums">
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
      </span>
    );
  },
);

interface ASRTimeSimulatorProps {
  theme: "light" | "dark";
  courseRecordM: number;
  courseRecordF: number;
  recordsM: Array<{
    pKey: string;
    time: number;
    pts: number;
    rank: number | string;
  }>;
  recordsF: Array<{
    pKey: string;
    time: number;
    pts: number;
    rank: number | string;
  }>;
  dataContext?: ASRDataContext;
  cName?: string;
}

export const ASRTimeSimulator = ({
  theme,
  courseRecordM,
  courseRecordF,
  recordsM,
  recordsF,
  dataContext,
  cName,
}: ASRTimeSimulatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"slider" | "goal">("slider");
  const [targetPts, setTargetPts] = useState<number>(90);
  const [simGender, setSimGender] = useState<"M" | "F">("M");

  const gender = simGender;
  const courseRecord = gender === "M" ? courseRecordM : courseRecordF;
  const records = gender === "M" ? recordsM : recordsF;

  const playerList_M_AT = useDataStore((s) => s.playerList_M_AT) || [];
  const playerList_F_AT = useDataStore((s) => s.playerList_F_AT) || [];

  const athletePool = React.useMemo(() => {
    return gender === "M"
      ? playerList_M_AT.filter((p) => !p.isDivider)
      : playerList_F_AT.filter((p) => !p.isDivider);
  }, [gender, playerList_M_AT, playerList_F_AT]);

  if ((!courseRecordM && !courseRecordF) || (recordsM.length === 0 && recordsF.length === 0)) return null;

  return (
    <div
      className={cn(
        "w-full transition-all duration-300 rounded-[1.5rem] border overflow-hidden mt-4",
        THEME.BENTO_CARD(theme),
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              theme === "dark"
                ? "bg-white/10 text-white"
                : "bg-black/5 text-black",
            )}
          >
            <Calculator size={18} />
          </div>
          <div className="flex flex-col text-left justify-center">
            <span
              className={cn(
                "font-black tracking-tight text-[15px] leading-[1]",
                "theme-text-base",
              )}
            >
              STAT SIMULATOR
            </span>
            <span
              className={cn(
                "text-[11px] uppercase tracking-wider font-semibold opacity-60 leading-[1] mt-1",
                "theme-text-faint",
              )}
            >
              Predict your stats
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-black/10 dark:bg-white/10 rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
            <div
              onClick={() => setSimGender("M")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer",
                simGender === "M"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white",
              )}
            >
              M
            </div>
            <div
              onClick={() => setSimGender("F")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-black rounded-md transition-all cursor-pointer",
                simGender === "F"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white",
              )}
            >
              W
            </div>
          </div>
          <div className="flex items-center justify-center">
            {isOpen ? (
              <ChevronUp size={20} className="opacity-50" />
            ) : (
              <ChevronDown size={20} className="opacity-50" />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setMode("slider")}
              className={cn(
                "flex-1 py-1.5 text-xs font-black rounded-lg transition-all",
                mode === "slider"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white",
              )}
            >
              WHAT-IF SLIDER
            </button>
            <button
              type="button"
              onClick={() => setMode("goal")}
              className={cn(
                "flex-1 py-1.5 text-xs font-black rounded-lg transition-all",
                mode === "goal"
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white",
              )}
            >
              GOAL CALCULATOR
            </button>
          </div>

          {mode === "slider" && (
            <ASRWhatIfSlider
              theme={theme}
              courseRecord={courseRecord}
              records={records}
              gender={gender}
              dataContext={dataContext}
              cName={cName}
              athletePool={athletePool}
              RollingNumber={RollingNumber}
              isOpen={isOpen}
            />
          )}

          {mode === "goal" && (
            <ASRGoalCalculator
              theme={theme}
              courseRecord={courseRecord}
              records={records}
              targetPts={targetPts}
              setTargetPts={setTargetPts}
            />
          )}
        </div>
      )}
    </div>
  );
};
