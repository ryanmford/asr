import React, { useState } from "react";
import { cn } from "../../lib/asr-utils";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ASRSectionHeadingProps {
  title: string;
  count?: number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  theme?: "light" | "dark";
}

export const ASRSectionHeading = React.memo(
  ({
    title,
    count,
    subtitle,
    icon,
    rightElement,
    theme,
  }: ASRSectionHeadingProps) => {
    const [showInfo, setShowInfo] = useState(false);

    return (
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-0 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                "transition-colors",
                theme === "dark" ? "text-white" : "text-zinc-900",
              )}
            >
              {icon}
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-2">
                <h2
                  className={cn(
                    "text-[14px] sm:text-[22px] font-black uppercase tracking-tight leading-none",
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900",
                  )}
                >
                  {title}
                </h2>
                {count !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] sm:text-[14px] opacity-20 font-black tabular-nums tracking-tighter",
                      "theme-text-base",
                    )}
                  >
                    ({count})
                  </span>
                )}
              </div>
              {subtitle && (
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    showInfo
                      ? (theme === "dark" ? "bg-white/10 text-white" : "bg-black/10 text-black")
                      : (theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-700")
                  )}
                  title="More Info"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {subtitle && showInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <p
                      className={cn(
                        "text-[9px] sm:text-xs font-bold opacity-70 uppercase tracking-tight leading-relaxed",
                        theme === "dark" ? "text-zinc-400" : "text-zinc-600",
                      )}
                    >
                      {subtitle}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {rightElement}
      </div>
    );
  },
);
