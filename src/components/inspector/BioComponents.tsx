import React from "react";
import { cn, THEME } from "../../lib/asr-utils";

interface BioStatProps {
 label: string;
 value: string | number;
 theme?: "light" | "dark";
}

export const BioStat = React.memo(({ label, value, theme }: BioStatProps) => {
 const valStr = String(value || "");
 const fontSizeCls =
 valStr.length > 15
 ? "text-[8px] "
 : valStr.length > 10
 ? "text-[10px] "
 : "text-xs ";

 return (
 <div
 className={cn(
 "transition-all group justify-center transition-colors shadow-none overflow-hidden rounded-3xl",
 THEME.BENTO_CARD(theme),
 )}
 >
 <div className="flex flex-col p-4 min-h-[70px] justify-center bg-transparent">
 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1.5 group-hover:text-blue-500/60 transition-colors shrink-0">
 {label}
 </span>
 <span
 className={cn(
 fontSizeCls,
 "font-black uppercase tracking-tighter break-words px-0.5 transition-colors tabular-nums",
 "theme-text-base",
 )}
 >
 {value}
 </span>
 </div>
 </div>
 );
});

interface BioRowProps {
 icon: React.ReactNode;
 label: string;
 value: string;
 href?: string;
 onClick?: () => void;
 theme?: "light" | "dark";
}

export const BioRow = React.memo(
 ({ icon, label, value, href, onClick, theme }: BioRowProps) => {
 const valLength = value.length;
 const fontSizeCls =
 valLength > 18
 ? "text-[8px] md:text-[10px]"
 : valLength > 15
 ? "text-[9px] md:text-xs"
 : valLength > 11
 ? "text-[10px] md:text-xs"
 : "text-xs md:text-sm";

 const content = (
 <div
 className={cn(
 "transition-all h-full group transition-colors shadow-none overflow-hidden rounded-3xl",
 THEME.BENTO_CARD(theme),
 )}
 >
 <div className="flex items-center gap-4 p-4 h-full bg-transparent">
 <div
 className={cn(
 "shrink-0 transition-colors group-hover:text-blue-500",
 theme === "dark" ? "text-white" : "text-zinc-900",
 )}
 >
 {icon}
 </div>
 <div className="flex flex-col min-w-0">
 {label && (
 <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-0.5 group-hover:text-blue-500 transition-colors">
 {label}
 </span>
 )}
 <span
 className={cn(
 fontSizeCls,
 "font-black uppercase tracking-tight break-all group-hover:text-blue-500 transition-colors",
 "theme-text-base",
 )}
 >
 {value}
 </span>
 </div>
 </div>
 </div>
 );

 if (href) {
 return (
 <a
 href={href}
 target="_blank"
 rel="noopener noreferrer"
 className="block h-full transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[1.5rem]"
 >
 {content}
 </a>
 );
 }

 if (onClick) {
 return (
 <button
 onClick={onClick}
 className="block w-full text-left h-full transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-[1.5rem]"
 >
 {content}
 </button>
 );
 }

 return content;
 },
);
