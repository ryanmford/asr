/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { cn } from "../../lib/asr-utils";

export const PageHeader = ({ title, theme, children }: any) => {
  return (
    <>
      {title && (
        <div className="px-4 mb-4 flex items-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter italic leading-none whitespace-nowrap text-zinc-900 dark:text-white pr-2">
            {title}
          </h1>
        </div>
      )}
      {children && (
        <div
          className={cn(
            "mb-4 sticky z-[50] transition-all",
            "top-[calc(68px+env(safe-area-inset-top,0px))] sm:top-[calc(76px+env(safe-area-inset-top,0px))]",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-2 w-[100vw] ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] backdrop-blur-xl shadow-sm border-y transition-colors px-4 py-3 sm:px-6 sm:py-3",
              theme === "dark"
                ? "border-white/5 bg-[#030303]/95 supports-[backdrop-filter]:bg-zinc-950/70"
                : "border-black/5 bg-[#FAFAFA]/95 supports-[backdrop-filter]:bg-white/70"
            )}
          >
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-2">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
