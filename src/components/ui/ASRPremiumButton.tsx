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
 color?: "blue" | "red" | "gold";
 disabled?: boolean;
 radius?: "none" | "2xl" | "3xl" | "full";
 effect?: "neon" | "metallic";
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
 color = "blue",
 disabled = false,
 radius = "2xl",
 effect = "neon",
}: ASRPremiumButtonProps) => {
 const Component = href && !disabled ? "a" : "button";
 const isSolid = variant === "solid";

 const [animDelay, animDuration] = React.useMemo(
 () => [`-${Math.random() * 8}s`, `${3 + Math.random() * 3}s`],
 [],
 );

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
 default:
 return "text-blue-400";
 }
 };

 const getConicGradient = () => {
 if (disabled)
 return "bg-[conic-gradient(from_0deg,#d4d4d8,#a1a1aa,#71717a,#a1a1aa,#d4d4d8)] opacity-90";
 switch (color) {
 case "red":
 return "bg-[conic-gradient(from_0deg,#ef4444,#f87171,#b91c1c,#f87171,#ef4444)] opacity-90";
 case "gold":
 return "bg-[conic-gradient(from_0deg,#f59e0b,#fbbf24,#d97706,#fbbf24,#f59e0b)] opacity-90";
 default:
 return "bg-[conic-gradient(from_0deg,#2563eb,#4f46e5,#9333ea,#4f46e5,#2563eb)] opacity-90";
 }
 };

 const getSolidBorder = () => {
 if (disabled) return "border-zinc-500/20";
 switch (color) {
 case "red":
 return "border-red-500/20";
 case "gold":
 return "border-amber-500/20";
 default:
 return "border-blue-500/20";
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
 return "opacity-20 bg-blue-500/10";
 }
 } else {
 switch (color) {
 case "red":
 return "opacity-0 group-hover:opacity-10 bg-red-500/10 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]";
 case "gold":
 return "opacity-0 group-hover:opacity-10 bg-amber-500/10 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]";
 default:
 return "opacity-0 group-hover:opacity-10 bg-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]";
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
 ? "bg-zinc-900/60 text-white glow-white"
 : `bg-zinc-900/40 ${getTextColor()}`
 : isSolid
 ? "bg-white text-zinc-900"
 : "bg-white text-zinc-900 shadow-xl shadow-black/5",
 className,
 )}
 >
 {/* Moving Border Effect */}
 {effect === "neon" && (
 <div
 className={cn(
 "absolute inset-0 z-0 pointer-events-none overflow-hidden",
 getRadiusClass(),
 )}
 >
 {/* The Shimmering Neon Outline - Long Trail */}
 <div className="absolute top-1/2 left-1/2 w-[400%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
 <div
 className={cn(
 "w-full h-full neon-border-rotate transition-opacity duration-500",
 isSolid ? "opacity-100" : "opacity-0 group-hover:opacity-100",
 )}
 style={{
 animationDelay: animDelay,
 animationDuration: animDuration,
 }}
 >
 <div className={cn("w-full h-full", getConicGradient())} />
 </div>
 </div>
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
 ? "bg-zinc-950/90 group-hover:bg-zinc-900/90"
 : "bg-white group-hover:bg-zinc-50",
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
