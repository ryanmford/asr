import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/asr-utils";

interface ASRNeonToggleProps {
 options: (string | { label: React.ReactNode; value: string })[];
 activeOption: string;
 onChange: (value: string) => void;
 layoutId?: string;
 theme: "light" | "dark";
 className?: string;
}

export const ASRNeonToggle = ({
 options,
 activeOption,
 onChange,
 theme,
 className,
}: ASRNeonToggleProps) => {

 return (
 <div
 className={cn(
 "relative flex backdrop-blur-md rounded-full p-0.5 border transition-all lg:shadow-xl",
 theme === "dark"
 ? "bg-zinc-900 border-zinc-800 shadow-black/40"
 : "bg-slate-100 border-slate-200 shadow-black/5",
 className,
 )}
 >
 {options.map((opt) => {
 const isObject = typeof opt !== "string";
 const label = isObject ? opt.label : opt;
 const value = isObject ? opt.value : opt;
 const isActive = String(activeOption || '').toLowerCase() === String(value || '').toLowerCase();

 return (
 <button
 key={value}
 onClick={() => {
   if (!isActive && navigator.vibrate) navigator.vibrate(50);
   onChange(value);
 }}
 className={cn(
 "relative flex-1 font-black uppercase tracking-[0.1em] transition-colors z-10 flex items-center justify-center basis-0 min-w-0 rounded-full",
 "py-1.5 px-3 text-[9px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
 theme === "dark" ? "focus-visible:ring-offset-zinc-900" : "theme-focus",
 isActive
 ? theme === "dark"
 ? "text-white"
 : "text-zinc-900"
 : theme === "dark"
 ? "text-white/30 hover:text-white"
 : "text-black/40 hover:text-black",
 )}
 >
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "absolute inset-0 z-0 rounded-full overflow-hidden p-[1.5px]",
            theme === "dark" ? "shadow-[0_4px_12px_rgba(0,0,0,0.4)]" : "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          )}
          transition={{ duration: 0.15 }}
        >
          {/* Animated Neon Border */}
          <div className="absolute -inset-[100%] pointer-events-none neon-border-rotate bg-[conic-gradient(from_0deg,#3b82f6,#4f46e5,#9333ea,#4f46e5,#3b82f6)] opacity-90" />
          {/* Inner Surface */}
          <div
            className={cn(
              "relative w-full h-full rounded-full z-10",
              theme === "dark" ? "bg-zinc-900" : "bg-white"
            )}
          />
        </motion.div>
      )}
 <span className={cn(
 "relative z-20 whitespace-nowrap transition-transform duration-300",
 isActive && "scale-105"
 )}>
 {typeof label === "string" ? label.toUpperCase() : label}
 </span>
 </button>
 );
 })}
 </div>
 );
};
