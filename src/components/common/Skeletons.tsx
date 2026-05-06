import React, { useContext } from "react";
import { ThemeContext } from "../../App";
import { cn } from "../../lib/asr-utils";

export const ViewSkeleton = () => {
  const theme = useContext(ThemeContext) || "dark";
  return (
    <div className="flex-1 flex flex-col pt-8">
      <div className="px-6 mb-8 flex items-center justify-between">
        <div className={cn("h-8 w-48 rounded-[1rem] animate-pulse", theme === "dark" ? "bg-white/10" : "bg-black/5")} />
        <div className={cn("h-8 w-32 rounded-[1rem] animate-pulse", theme === "dark" ? "bg-white/10" : "bg-black/5")} />
      </div>
      <div className="flex flex-col gap-2 sm:gap-3 px-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[72px] sm:h-[80px] w-full rounded-2xl border flex items-center px-4 sm:px-6 gap-4 sm:gap-6 animate-pulse",
              theme === "dark"
                ? "bg-white/[0.02] border-white/[0.05]"
                : "bg-black/[0.02] border-black/[0.05]",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full shrink-0",
                "bg-black/10 dark:bg-white/10",
              )}
            />
            <div className="flex-1 flex flex-col gap-2">
              <div
                className={cn(
                  "h-3 w-32 rounded-full",
                  theme === "dark" ? "bg-white/20" : "bg-black/20",
                )}
              />
              <div
                className={cn(
                  "h-2 w-20 rounded-full",
                  "bg-black/10 dark:bg-white/10",
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DetailsSkeleton = () => {
  const theme = useContext(ThemeContext) || "dark";
  return (
    <div className={cn("flex flex-col w-full min-h-[80vh]", theme === "dark" ? "bg-[#030303]" : "bg-[#FAFAFA]")}>
      <div className="w-full flex justify-between items-start px-6 pt-16 pb-12">
        <div className="flex flex-col gap-4 w-full">
          <div className={cn("w-20 h-20 rounded-full animate-pulse", theme === "dark" ? "bg-white/10" : "bg-black/5")} />
          <div className={cn("w-48 h-6 rounded-full animate-pulse mt-2", theme === "dark" ? "bg-white/10" : "bg-black/5")} />
          <div className={cn("w-32 h-4 rounded-full animate-pulse", theme === "dark" ? "bg-white/5" : "bg-black/[0.03]")} />
        </div>
      </div>
      <div className={cn("w-full h-12 border-b mb-6 animate-pulse", theme === "dark" ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5")} />
      
      <div className="grid grid-cols-2 gap-4 px-6 pb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("p-5 rounded-[1.25rem] border animate-pulse h-24", theme === "dark" ? "border-white/5 bg-white/[0.02]" : "border-black/5 bg-black/[0.02]")} />
        ))}
      </div>
      
      <div className="flex flex-col gap-3 px-6 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[72px] w-full rounded-2xl border animate-pulse flex items-center px-4 gap-4",
              theme === "dark" ? "border-white/5 bg-white/[0.02]" : "border-black/5 bg-black/[0.02]"
            )}
          />
        ))}
      </div>
    </div>
  );
};
