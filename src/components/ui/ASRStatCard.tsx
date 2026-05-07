/* eslint-disable @typescript-eslint/no-explicit-any */
 
import React, { useState, useEffect, useContext } from "react";
import { cn, THEME, trackEvent } from "../../lib/asr-utils";
import { ThemeContext } from "../../App";

interface ASRStatCardProps {
 label: string;
 value: string | number | React.ReactNode;
 colorClass?: string;
 glowClass?: string;
 tooltip?: string;
 icon?: React.ReactNode;
 isHeader?: boolean;
}

export const ASRStatCard = React.memo(
 ({
 label,
 value,
 colorClass,
 glowClass,
 tooltip,
 icon,
 isHeader = false,
 }: ASRStatCardProps) => {
 const theme = useContext(ThemeContext);
 const [isFlipped, setIsFlipped] = useState(false);

 useEffect(() => {
 if (isFlipped) {
 const timer = setTimeout(() => setIsFlipped(false), 5000);
 return () => clearTimeout(timer);
 }
 }, [isFlipped]);

 const statInfoMap: any = {
 LQ: "LOCOMOTIVE QUOTIENT = POINTS / RUNS",
 "AVG POINTS": "AVERAGE POINTS PER RUN",
 "🔥": "FIRE BONUS 🔥 🔥 🔥",
 "🪙": "COINS EARNED FROM RUNS, WINS, & SETS",
 RANK: "CURRENT WORLD RANK",
 POINTS: "TOTAL POINTS",
 PLAYERS: "TOTAL PLAYERS",
 SETTERS: "TOTAL SETTERS",
 WINS: "TOTAL WINS",
 "TOTAL SETS": "TOTAL NUMBER OF SETS CREATED",
 "AVG SET RATING": "AVERAGE RATING FOR CREATED SETS",
 RATING: "CURRENT ATHLETE RATING",
 RUNS: "TOTAL RUNS COMPLETED",
 "WIN %": "PERCENTAGE OF RUNS WON",
 "AVG TIME": "AVERAGE RUN TIME",
 COURSES: "TOTAL COURSES CONQUERED",
 "CR (M)": "MEN'S COURSE RECORD",
 "CR (W)": "WOMEN'S COURSE RECORD",
 "TOTAL RUNS": "TOTAL NUMBER OF RUNS",
 COMPLETIONS: "TOTAL NUMBER OF COURSE COMPLETIONS",
 "WORLD RECORD": "FASTEST OVERALL TIME",
 };

 const labelStr = String(label || "")
 .trim()
 .toUpperCase();
 const description = tooltip || statInfoMap[labelStr] || labelStr;

 const fontSizeClass = React.useMemo(() => {
 if (React.isValidElement(value)) return "text-[14px]";
 const s = String(value || "");
 const len = s.length;
 if (len > 12) return "text-[9px]";
 if (len > 10) return "text-[10px]";
 if (len > 8) return "text-[11px]";
 if (len > 6) return "text-[12px]";
 return "text-[14px]";
 }, [value]);

 return (
 <div
 role={description ? "button" : undefined}
 tabIndex={description ? 0 : undefined}
 onKeyDown={(e) => {
   if (description && (e.key === "Enter" || e.key === " ")) {
     e.preventDefault();
     setIsFlipped(!isFlipped);
   }
 }}
 onClick={(e: any) => {
 if (description) {
 e.stopPropagation();
 trackEvent("flip_stat_card", { stat_label: labelStr });
 setIsFlipped(!isFlipped);
 }
 }}
 className={cn(
 "stat-card-container min-h-[4.5rem] relative group flex flex-col transition-all duration-300 w-full overflow-hidden rounded-[1.25rem] outline-none",
 description ? "cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" : "cursor-default",
        "theme-focus",
          isHeader
            ? "bg-transparent"
            : cn(
                THEME.BENTO_CARD(theme),
                theme === "dark"
                  ? "hover:bg-zinc-900/30"
                  : "hover:bg-white/60",
              ),
 )}
 >
 <div className={cn("flex flex-col flex-1 p-2 h-full", isHeader && "p-0")}>

 <div
 className={cn(
 "relative z-10 flex flex-col h-full w-full transition-all duration-300 justify-center items-center text-center",
 isFlipped ? "opacity-0 scale-95 pointer-events-none absolute" : "opacity-100 scale-100"
 )}
 >
 <div
 className={cn(
 isHeader ? THEME.HEADING_HOF : THEME.LABEL,
 "mb-1 flex items-center justify-center w-full",
 isHeader ? "opacity-100" : ""
 )}
 >
 <div 
 className={cn(
 "uppercase whitespace-nowrap px-1 origin-center",
 labelStr.length > 12 ? "scale-[0.80]" : labelStr.length > 8 ? "scale-90" : "scale-100"
 )}
 >
 {label}
 </div>
 </div>
 {!isHeader && (
 <div className="flex items-baseline justify-center gap-1 w-full flex-wrap">
 {icon && (
 <span className="text-xs shrink-0 mb-0.5">
 {icon}
 </span>
 )}
 <span
 className={cn(
 fontSizeClass,
 "leading-none whitespace-nowrap tracking-tight text-center",
 THEME.VALUE,
 colorClass ||
 (theme === "dark"
 ? "text-white font-black"
 : "text-zinc-900 font-black"),
 glowClass || "",
 )}
 >
 {value}
 </span>
 </div>
 )}
 </div>

 {description && (
 <div
 className={cn(
 "absolute inset-0 z-20 flex flex-col items-center justify-center p-2 text-center transition-all duration-300 transform",
 isFlipped ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none hidden",
 theme === "dark" ? "text-zinc-300" : "text-zinc-700"
 )}
 >
 <p className="text-[9px] font-black uppercase leading-[1.2] text-inherit tracking-tight overflow-y-auto [&::-webkit-scrollbar]:hidden w-full max-h-full">
 {description}
 </p>
 </div>
 )}
 </div>
 </div>
 );
 },
);
