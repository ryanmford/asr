/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/asr-utils";

interface ASRSearchInputProps {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } },
  ) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  theme: "light" | "dark";
  placeholder?: string;
  className?: string;
  variant?: "default" | "pill" | "docked";
  rightElement?: React.ReactNode;
}

export const ASRSearchInput = React.memo(
  ({
    value,
    onChange,
    onKeyDown,
    theme,
    placeholder = "",
    className,
    variant = "default",
    rightElement,
  }: ASRSearchInputProps) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const radiusClass = variant === "docked" ? "rounded-none" : variant === "pill" ? "rounded-full" : "rounded-2xl";

    return (
      <div className={cn("relative group", className)}>
        <div
          className={cn(
            `relative flex items-center h-12 ${radiusClass} border transition-all duration-300 overflow-hidden`,
            theme === "dark"
              ? "bg-zinc-900/40 border-white/[0.05] focus-within:border-transparent focus-within:bg-zinc-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
              : "bg-white border-slate-200 focus-within:border-transparent focus-within:bg-white shadow-xl shadow-black/5",
            (variant === "pill" || variant === "docked") && (theme === "dark" ? "backdrop-blur-md bg-zinc-900/70 border border-white/10" : "backdrop-blur-md bg-white/70 border border-black/5"),
            (variant === "pill" || variant === "docked") && "shadow-none",
            variant === "docked" && "border-x-0 border-t-0 bg-transparent dark:bg-transparent backdrop-blur-none"
          )}
        >
          {/* Moving Neon Border Effect when focused */}
          <div className={`absolute inset-0 overflow-hidden ${radiusClass} z-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300`}>
            <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
               <div className="w-full h-full neon-border-rotate bg-[conic-gradient(from_0deg,#3b82f6,#4f46e5,#9333ea,#4f46e5,#3b82f6)] opacity-90" />
            </div>
            {/* Inner Surface Fill */}
            <div
              className={cn(
                `absolute inset-[1.5px] ${radiusClass} backdrop-blur-xl z-20`,
                theme === "dark" ? "bg-zinc-950/90" : "bg-white",
              )}
            />
          </div>

          <div className="absolute left-5 opacity-30 group-focus-within:opacity-100 group-focus-within:text-blue-500 transition-all z-30 pointer-events-none">
            <Search size={16} strokeWidth={3} />
          </div>
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "" : placeholder}
            className={cn(
              "w-full h-full pl-12 bg-transparent outline-none text-[12px] font-black uppercase tracking-widest placeholder:opacity-20 placeholder:lowercase placeholder:font-normal placeholder:tracking-normal z-30 relative",
              theme === "dark"
                ? "text-white placeholder:text-white"
                : "text-zinc-900 placeholder:text-zinc-900",
              rightElement ? "pr-24" : "pr-12"
            )}
          />
          <div className="absolute right-1 flex items-center gap-1 z-30">
            <AnimatePresence>
              {value && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onChange({ target: { value: "" } } as any)}
                  className={cn(
                    "w-8 h-8 mr-1 flex flex-shrink-0 items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95",
                    theme === "dark" ? "text-white hover:bg-white/10" : "text-zinc-900 hover:bg-black/5",
                  )}
                >
                  <X size={14} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
            {rightElement}
          </div>
        </div>
      </div>
    );
  },
);
