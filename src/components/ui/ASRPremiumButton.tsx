/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React from "react";
import { cn } from "../../lib/asr-utils";

export interface ASRPremiumButtonProps {
 children: React.ReactNode;
 onClick?: (e?: any) => void;
 className?: string;
 theme?: "light" | "dark";
 href?: string;
 target?: string;
 rel?: string;
 variant?: "premium" | "solid";
 color?: "blue" | "red" | "gold" | "purple-blue" | "emerald" | "pink";
 disabled?: boolean;
 radius?: "none" | "2xl" | "3xl" | "full";
 effect?: "neon" | "metallic" | "none";
}

export const ASRPremiumButton = ({
 children,
 onClick,
 className,
 theme = "dark",
 href,
 target,
 rel,
 variant = "premium",
 color = "purple-blue",
 disabled = false,
 radius = "2xl",
 effect = "neon",
}: ASRPremiumButtonProps) => {
 const Component = href && !disabled ? "a" : "button";
 const isSolid = variant === "solid";

 const getRadiusClass = () => {
 switch (radius) {
 case "none":
 return "rounded-none";
 case "3xl":
 return "rounded-3xl";
 case "full":
 return "rounded-full";
 case "2xl":
 default:
 return "rounded-2xl";
 }
 };

 const getTextColor = () => {
 if (disabled) return "text-zinc-500 dark:text-zinc-400";
 switch (color) {
 case "red":
 return "text-red-400";
 case "gold":
 return "text-amber-400";
 case "blue":
 return "text-zinc-700 dark:text-zinc-300";
 default:
 return "text-zinc-700 dark:text-zinc-300";
 }
 };

 const getLinearGradient = () => {
 if (disabled)
 return "linear-gradient(90deg, #d4d4d8, #a1a1aa, #71717a, #a1a1aa, #d4d4d8)";
 return "linear-gradient(90deg, #52525b, #a1a1aa, #f4f4f5, #a1a1aa, #52525b)";
 };

 const getSolidBorder = () => {
 if (disabled) return "border-zinc-500/20";
 switch (color) {
 case "red":
 return "border-red-500/20";
 case "gold":
 return "border-amber-500/20";
 default:
 return "border-zinc-500/20";
 }
 };

 const getActionGlow = () => {
 if (disabled) return "opacity-0";
 if (isSolid) {
 switch (color) {
 case "red":
 return "opacity-20 bg-red-500/10";
 case "gold":
 return "opacity-20 bg-amber-500/10";
 default:
 return "opacity-20 bg-zinc-500/10";
 }
 } else {
 switch (color) {
 case "red":
 return "opacity-0 group-hover:opacity-10 bg-red-500/10 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]";
 case "gold":
 return "opacity-0 group-hover:opacity-10 bg-amber-500/10 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]";
 default:
 return "opacity-0 group-hover:opacity-10 bg-zinc-500/10 shadow-[inset_0_0_10px_rgba(113,113,122,0.2)]";
 }
 }
 };

 return (
 <Component
 href={!disabled ? href : undefined}
 target={!disabled ? target : undefined}
 rel={!disabled ? rel : undefined}
 onClick={!disabled ? onClick : undefined}
 {...(Component === "button" && disabled ? { disabled: true } : {})}
 className={cn(
 "relative group py-4 px-8 font-black uppercase tracking-[0.2em] transition-all overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "theme-focus",
 getRadiusClass(),
 !disabled && "active:scale-95",
 disabled && "opacity-50 cursor-not-allowed",
 theme === "dark"
 ? isSolid
 ? color === "gold" ? "bg-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]" : "bg-zinc-900/60 text-white glow-white"
 : `bg-zinc-900/40 ${getTextColor()}`
 : isSolid
 ? color === "gold" ? "bg-amber-500 text-white" : "bg-white text-zinc-900"
 : "bg-white text-zinc-900 shadow-xl shadow-black/5",
 className,
 )}
 >
 {/* Moving Border Effect */}
 {effect === "neon" && (
 <div
 className={cn(
 "absolute inset-0 z-0 pointer-events-none",
 getRadiusClass(),
 )}
 >
 {/* Ambient Glow */}
 <div 
   className={cn(
     "absolute inset-0 animate-border-shift blur-[6px] transition-opacity duration-500 z-0",
     getRadiusClass(),
     isSolid ? "opacity-30" : "opacity-0 group-hover:opacity-30"
   )}
   style={{ background: getLinearGradient(), backgroundSize: "200% 100%" }}
 />
 {/* Sharp Edge Border */}
 <div 
   className={cn(
     "absolute inset-0 animate-border-shift transition-opacity duration-500 z-0",
     getRadiusClass(),
     isSolid ? "opacity-60" : "opacity-0 group-hover:opacity-60"
   )}
   style={{ background: getLinearGradient(), backgroundSize: "200% 100%" }}
 />
 </div>
 )}

 {/* Default border state */}
 <div
 className={cn(
 "absolute inset-0 border transition-colors z-10",
 getRadiusClass(),
 isSolid
 ? getSolidBorder()
 : theme === "dark"
 ? "border-white/10 group-hover:border-transparent"
 : "border-black/5 group-hover:border-transparent",
 )}
 />

 {/* The Inner Surface Fill (with glass effect) */}
 <div
 className={cn(
 "absolute inset-[1.5px] z-20 backdrop-blur-md transition-colors",
 getRadiusClass(),
 theme === "dark"
 ? (color === "gold" ? "bg-[#332005]/90 group-hover:bg-[#402808]/90" : "bg-zinc-950/90 group-hover:bg-zinc-900/90")
 : (color === "gold" ? "bg-amber-50 group-hover:bg-amber-100" : "bg-white group-hover:bg-zinc-50"),
 )}
 />

 {effect === "metallic" && (
 <div
 className={cn(
 "absolute inset-0 z-[20] pointer-events-none overflow-hidden rounded-inherit",
 getRadiusClass(),
 )}
 >
 {/* Subtle Glow base */}
 <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-300/20 to-amber-500/10 opacity-50" />
 {/* Metallic Sweep */}
 <div className="absolute inset-0 pointer-events-none mix-blend-overlay">
 <div className="absolute top-0 left-[0%] w-full h-[200%] bg-gradient-to-r from-transparent via-white to-transparent skew-x-[-30deg] opacity-70 metallic-sweep" />
 </div>
 {/* Sharp Edge highlights */}
 <div
 className={cn(
 "absolute inset-0 border-[1.5px] transition-colors opacity-100 z-10",
 getRadiusClass(),
 color === "gold"
 ? "border-amber-400/60 group-hover:border-amber-300 shadow-[inset_0_0_12px_rgba(251,191,36,0.3)]"
 : "border-white/40",
 )}
 />
 </div>
 )}

 {/* Action Glow (Simplified) */}
 <div
 className={cn(
 "absolute inset-0 z-25 transition-opacity duration-500",
 getRadiusClass(),
 getActionGlow(),
 )}
 />

 {/* Button Content */}
 <div className="relative z-30 flex items-center justify-center gap-2 sm:gap-3 w-full min-w-0">
 {children}
 </div>
 </Component>
 );
};
