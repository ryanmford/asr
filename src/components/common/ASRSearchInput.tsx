import React from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/asr-utils";

interface ASRSearchInputProps {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } },
  ) => void;
  theme: "light" | "dark";
  placeholder?: string;
  className?: string;
}

export const ASRSearchInput = React.memo(
  ({
    value,
    onChange,
    theme,
    placeholder = "",
    className,
  }: ASRSearchInputProps) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (
      <div className={cn("relative group", className)}>
        <div
          className={cn(
            "relative flex items-center h-12 rounded-2xl border transition-all duration-300 overflow-hidden",
            theme === "dark"
              ? "bg-zinc-900/40 border-white/[0.05] focus-within:border-transparent focus-within:bg-zinc-900/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
              : "bg-white border-slate-200 focus-within:border-transparent focus-within:bg-white shadow-xl shadow-black/5",
          )}
        >
          {/* Moving Neon Border Effect when focused */}
          <div className="absolute inset-0 rounded-2xl z-0 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-[-200%] neon-border-rotate">
              <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)]" />
            </div>
            {/* Inner Surface Fill */}
            <div
              className={cn(
                "absolute inset-[1.5px] rounded-2xl backdrop-blur-xl z-20",
                theme === "dark" ? "bg-zinc-950/90" : "bg-white",
              )}
            />
          </div>

          <div className="absolute left-5 opacity-30 group-focus-within:opacity-100 group-focus-within:text-blue-500 transition-all z-30">
            <Search size={16} strokeWidth={3} />
          </div>
          <input
            type="text"
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? "" : placeholder}
            className={cn(
              "w-full h-full pl-12 pr-12 bg-transparent outline-none text-[12px] font-black uppercase tracking-widest placeholder:opacity-20 placeholder:lowercase placeholder:font-normal placeholder:tracking-normal z-30 relative",
              theme === "dark"
                ? "text-white placeholder:text-white"
                : "text-zinc-900 placeholder:text-zinc-900",
            )}
          />
          <AnimatePresence>
            {value && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onChange({ target: { value: "" } } as any)}
                className={cn(
                  "absolute right-3 p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-all z-30 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]",
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/5",
                )}
              >
                <X size={14} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  },
);
