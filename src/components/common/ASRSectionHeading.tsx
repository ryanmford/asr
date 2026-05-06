import React from "react";
import { cn } from "../../lib/asr-utils";

interface ASRSectionHeadingProps {
  title: string;
  count?: number;
  subtitle?: string;
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
              <p
                className={cn(
                  "text-[9px] sm:text-xs font-bold opacity-40 uppercase tracking-tight mt-1",
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600",
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightElement}
      </div>
    );
  },
);
