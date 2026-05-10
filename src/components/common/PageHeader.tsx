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
      <div
        className={cn(
          "px-4 py-3 sm:py-4 mb-2 sticky z-[50] backdrop-blur-3xl border-b -mx-4 left-0 right-0 transition-all shadow-sm",
          theme === "dark"
            ? "border-white/5 bg-zinc-950/80"
            : "border-black/5 bg-white/80",
          "top-[55px] sm:top-[66px]",
        )}
      >
        <div className="flex items-center gap-2 w-full max-w-7xl mx-auto px-4">
          {children}
        </div>
      </div>
    </>
  );
};
