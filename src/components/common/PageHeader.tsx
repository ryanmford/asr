/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { cn } from "../../lib/asr-utils";

export const PageHeader = ({ title, theme, children }: any) => {
  return (
    <>
      <div className="px-4 mb-4 flex items-center gap-3">
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter italic leading-none whitespace-nowrap text-zinc-900 dark:text-white pr-2">
          {title}
        </h1>
      </div>
      {children && (
        <div
          className={cn(
            "mb-4 sticky z-[50] transition-all px-4 sm:px-6",
            "top-[calc(68px+env(safe-area-inset-top,0px))] sm:top-[calc(76px+env(safe-area-inset-top,0px))]",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 w-full max-w-7xl mx-auto backdrop-blur-xl shadow-md rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 border transition-colors",
              theme === "dark"
                ? "border-white/5 bg-[#030303]/95 supports-[backdrop-filter]:bg-zinc-950/70"
                : "border-black/5 bg-[#FAFAFA]/95 supports-[backdrop-filter]:bg-white/70"
            )}
          >
            {children}
          </div>
        </div>
      )}
    </>
  );
};
