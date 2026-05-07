import React, { useContext } from "react";
import { ThemeContext } from "../../App";
import { cn } from "../../lib/asr-utils";

export const ViewSkeleton = () => {
  const theme = useContext(ThemeContext) || "dark";
  const bgClass = theme === "dark" ? "bg-white/[0.03]" : "bg-black/[0.03]";
  const borderClass = theme === "dark" ? "border-white/[0.05]" : "border-black/[0.05]";

  return (
    <div className="flex-1 flex flex-col pt-8 animate-in fade-in duration-500">
      <div className="px-6 mb-8 flex items-center justify-between relative overflow-hidden">
        <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
        <div className={cn("h-8 w-48 rounded-[1rem]", bgClass)} />
        <div className={cn("h-8 w-32 rounded-[1rem]", bgClass)} />
      </div>
      <div className="flex flex-col gap-3 px-4 relative overflow-hidden max-w-7xl mx-auto w-full">
        <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] z-10", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "h-[76px] w-full rounded-[1.5rem] border flex items-center px-5 gap-5",
              bgClass, borderClass
            )}
          >
            <div className="flex items-center gap-4 w-[200px] shrink-0 opacity-80">
              <div className={cn("w-10 h-10 rounded-full shrink-0", theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]")} />
              <div className="flex flex-col gap-2 flex-1">
                <div className={cn("h-3 w-28 rounded-full", theme === "dark" ? "bg-white/[0.08]" : "bg-black/[0.08]")} />
                <div className={cn("h-2 w-16 rounded-full", theme === "dark" ? "bg-white/[0.04]" : "bg-black/[0.04]")} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DetailsSkeleton = () => {
  const theme = useContext(ThemeContext) || "dark";
  
  const bgClass = theme === "dark" ? "bg-white/[0.03]" : "bg-black/[0.03]";
  const borderClass = theme === "dark" ? "border-white/[0.05]" : "border-black/[0.05]";
  
  return (
    <div className={cn("flex flex-col w-full min-h-[80vh] animate-in fade-in duration-500", theme === "dark" ? "bg-[#030303]" : "bg-white")}>
      
      {/* Profile Header Skeleton */}
      <div className={cn("px-4 py-8 flex flex-col gap-4 relative overflow-hidden border-b", borderClass)}>
        <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
        
        <div className="flex items-center gap-5 relative z-10 w-full pl-1">
          <div className={cn("w-[76px] h-[76px] rounded-full", bgClass)} />
          <div className="flex flex-col gap-3 flex-1 min-w-0 pr-2">
            <div className={cn("h-6 w-48 rounded-full", bgClass)} />
            <div className={cn("h-3 w-32 rounded-full", theme === "dark" ? "bg-white/[0.02]" : "bg-black/[0.02]")} />
          </div>
        </div>
      </div>
      
      {/* Tabs Skeleton */}
      <div className="flex px-4 py-2 opacity-50 relative overflow-hidden">
        <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
        <div className={cn("flex-1 h-10 rounded-xl", bgClass)} />
        <div className={cn("flex-1 h-10 rounded-xl", bgClass)} />
      </div>

      <div className="p-4 sm:p-6 flex flex-col gap-10">
        {/* Vault Cards (TokenChips + FlatCards) Skeleton */}
        <div className="flex flex-col gap-5">
          <div className={cn("h-3 w-16 rounded-full mb-2", bgClass)} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative overflow-hidden">
             <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] z-10", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
             {[1, 2, 3, 4].map(i => (
                <div key={i} className={cn("h-[72px] rounded-3xl border flex items-center p-4 gap-4", bgClass, borderClass)}>
                  <div className="flex flex-col gap-2 flex-1">
                     <div className={cn("h-4 w-8 rounded-full", theme === "dark" ? "bg-white/[0.1]" : "bg-black/[0.1]")} />
                     <div className={cn("h-2 w-12 rounded-full", theme === "dark" ? "bg-white/[0.04]" : "bg-black/[0.04]")} />
                  </div>
                  <div className={cn("w-8 h-8 rounded-full opacity-50", theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]")} />
                </div>
             ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 relative overflow-hidden">
            <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] z-10", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
             {[1, 2].map(i => (
                <div key={i} className={cn("h-[88px] rounded-[2rem] border flex items-center p-5 gap-4", bgClass, borderClass)}>
                  <div className={cn("w-12 h-12 rounded-2xl shrink-0", theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]")} />
                  <div className="flex flex-col gap-2 flex-1 w-full">
                     <div className={cn("h-3 w-24 rounded-full", theme === "dark" ? "bg-white/[0.1]" : "bg-black/[0.1]")} />
                     <div className="flex items-center justify-between mt-1">
                       <div className={cn("h-2 w-10 rounded-full", theme === "dark" ? "bg-white/[0.04]" : "bg-black/[0.04]")} />
                       <div className={cn("h-2 w-10 rounded-full", theme === "dark" ? "bg-white/[0.04]" : "bg-black/[0.04]")} />
                     </div>
                     <div className={cn("h-1 w-full rounded-full mt-1 overflow-hidden", theme === "dark" ? "bg-white/[0.02]" : "bg-black/[0.02]")}>
                       <div className={cn("h-full w-1/3", theme === "dark" ? "bg-white/[0.1]" : "bg-black/[0.1]")} />
                     </div>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* List Skeleton inside the Inspector */}
        <div className="flex flex-col gap-3 relative overflow-hidden">
          <div className={cn("h-3 w-20 rounded-full mb-2", bgClass)} />
          <div className={cn("absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] z-10", theme === "dark" ? "bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" : "bg-gradient-to-r from-transparent via-black/[0.02] to-transparent")} />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "h-[76px] w-full rounded-[1.5rem] border flex items-center px-4 gap-4",
                bgClass, borderClass
              )}
            >
               <div className={cn("w-10 h-10 rounded-full shrink-0", theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]")} />
               <div className="flex flex-col gap-2 flex-1">
                  <div className={cn("h-3 w-32 rounded-full", theme === "dark" ? "bg-white/[0.08]" : "bg-black/[0.08]")} />
                  <div className={cn("h-2 w-20 rounded-full", theme === "dark" ? "bg-white/[0.04]" : "bg-black/[0.04]")} />
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
