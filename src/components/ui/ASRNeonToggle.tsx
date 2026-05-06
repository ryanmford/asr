import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/asr-utils";

interface ASRNeonToggleProps {
 options: (string | { label: React.ReactNode; value: string })[];
 activeOption: string;
 onChange: (value: string) => void;
 layoutId: string;
 theme: "light" | "dark";
 className?: string;
}

export const ASRNeonToggle = ({
 options,
 activeOption,
 onChange,
 layoutId,
 theme,
 className,
}: ASRNeonToggleProps) => {
 return (
 <div
 className={cn(
 "relative flex backdrop-blur-md rounded-full p-0.5 border transition-all shadow-xl",
 theme === "dark"
 ? "bg-zinc-900 border-zinc-800 shadow-black/40"
 : "bg-white border-zinc-200 shadow-black/5",
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
 onClick={() => onChange(value)}
 className={cn(
 "relative flex-1 font-black uppercase tracking-[0.1em] transition-all z-10 flex items-center justify-center basis-0 min-w-0 rounded-full active:scale-[0.98]",
 "py-1.5 px-3 text-[9px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
 theme === "dark" ? "focus-visible:ring-offset-zinc-900" : "theme-focus",
 isActive
 ? theme === "dark"
 ? "text-white scale-105"
 : "text-zinc-900 scale-105"
 : theme === "dark"
 ? "text-white/30 hover:text-white"
 : "text-black/40 hover:text-black",
 )}
 >
 {isActive && (
 <motion.div
 layoutId={layoutId}
 className="absolute inset-0 z-0 rounded-full"
 transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
 >
 {/* Outer Drop Shadow */}
 <div 
 className={cn(
 "absolute inset-0 rounded-full",
 theme === "dark" 
 ? "shadow-[0_4px_12px_rgba(0,0,0,0.4)]" 
 : "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
 )} 
 />
 
 <div className="absolute inset-0 overflow-hidden rounded-full">
 {/* The Rotating Neon Border - Long Trail */}
 <div className="absolute inset-[-200%] neon-border-rotate z-0">
 <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_45deg,#3b82f6_180deg,transparent_315deg,transparent_360deg)]" />
 </div>

 {/* The Inner Surface Fill (with glass effect) */}
 <div
 className={cn(
 "absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md",
 theme === "dark" 
 ? "bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_1px_rgba(0,0,0,0.5)]" 
 : "bg-gradient-to-b from-white to-zinc-50 shadow-[inset_0_2px_2px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.05)]",
 )}
 />
 </div>
 </motion.div>
 )}
 <span className="relative z-20 whitespace-nowrap">
 {typeof label === "string" ? label.toUpperCase() : label}
 </span>
 </button>
 );
 })}
 </div>
 );
};
