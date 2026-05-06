import React from "react";
import { cn } from "../../lib/asr-utils";
import { THEME } from "../../lib/asr-utils";

interface StatBlockProps {
 label?: string;
 value: string | number;
 highlight?: boolean;
 icon?: React.ReactNode;
 theme?: "light" | "dark";
}

export const StatBlock = React.memo(
 ({ label, value, highlight = false, icon, theme }: StatBlockProps) => (
 <div
 className={cn(
 "flex flex-col items-center justify-center p-3 sm:p-5 rounded-[2rem] transition-all hover:scale-[1.03] group cursor-default h-full",
 THEME.BENTO_CARD(theme),
 )}
 >
 {label && (
 <span
 className={cn(
 "text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] mb-1.5 transition-colors",
 "theme-text-muted",
 highlight ? "text-blue-500/80" : "",
 )}
 >
 {label}
 </span>
 )}
 <div className="flex items-center gap-1.5 min-w-0">
 {icon && (
 <span
 className={cn(
 "text-xs sm:text-sm shrink-0 transition-opacity",
 highlight
 ? "text-blue-500"
 : "opacity-60 group-hover:opacity-100",
 )}
 >
 {icon}
 </span>
 )}
 <span
 className={cn(
 String(value).length > 10
 ? "text-[10px] sm:text-[14px]"
 : String(value).length > 8
 ? "text-[12px] sm:text-[16px]"
 : String(value).length > 6
 ? "text-[14px] sm:text-[20px]"
 : "text-[16px] sm:text-[22px]",
 "font-black tabular-nums tracking-tighter leading-none transition-all group-hover:text-blue-500 whitespace-nowrap px-0.5",
 theme === "dark" ? "text-zinc-100" : "text-zinc-900",
 highlight ? "text-blue-500" : "",
 )}
 >
 {value}
 </span>
 </div>
 </div>
 ),
);
