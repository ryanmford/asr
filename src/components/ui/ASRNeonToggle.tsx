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
 const instanceId = React.useId();
 const isolatedLayoutId = `${layoutId}-${instanceId.replace(/:/g, "")}`;

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
 layoutId={isolatedLayoutId}
 className="absolute inset-0 z-0 rounded-full"
 style={{ borderRadius: 9999 }}
 transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
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
 
 <div className="absolute inset-0 overflow-hidden rounded-full ios-gpu-fix">
 {/* The Rotating Neon Border - Long Trail */}
 <div className="absolute inset-[-200%] neon-border-rotate z-0">
 <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_15deg,#3b82f6_45deg,#3b82f6_315deg,transparent_345deg,transparent_360deg)]" />
 </div>

 {/* The Inner Surface Fill (with glass effect) */}
 <div
 className={cn(
 "absolute inset-[1.5px] rounded-full z-10 backdrop-blur-md",
 theme === "dark" 
 ? "bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.8)]" 
 : "bg-gradient-to-b from-white to-white shadow-[inset_0_2px_2px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.1)]",
 )}
 />
 </div>
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
