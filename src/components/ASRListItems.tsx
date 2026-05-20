import React, { useContext } from "react";
import { Play, MapPin } from "lucide-react";
import { THEME, cn, trackEvent, formatFlagsWithSpace } from "../lib/asr-utils";
import { ThemeContext } from "../theme-context";
import { useAppStore } from "../store/useAppStore";

export const ASRRankBadge = React.memo(
 ({ rank, size = "md", scale = 1 }: { rank?: string | number | null; size?: "sm" | "md" | "lg"; scale?: number }) => {
 const theme = useContext(ThemeContext);
 const isUnranked = String(rank || "").trim() === "UR";
 const rankNum = isUnranked ? "UR" : rank === "-" ? "?" : rank;
 const dim =
 size === "lg"
 ? "w-10 h-10 sm:w-11 sm:h-11 "
      : size === "sm"
      ? "w-5 h-5 sm:w-6 sm:h-6"
      : "w-7 h-7 sm:w-8 sm:h-8 ";
 const textClass =
 size === "lg"
 ? "text-sm sm:text-base "
      : size === "sm"
      ? "text-[8px] sm:text-[9px]"
      : "text-[10px] sm:text-xs ";
 const isPodium = rank === 1 || rank === 2 || rank === 3;
 const styles: Record<string, { border: string; text: string; glow: string }> = {
 1: {
 border: "border-amber-500",
 text: "text-amber-500",
 glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
 },
 2: {
 border: "border-zinc-400",
 text: theme === "dark" ? "text-zinc-300" : "text-zinc-500",
 glow: "shadow-[0_0_15px_rgba(161,161,170,0.3)]",
 },
 3: {
 border: "border-[#CE8946]",
 text: "text-[#CE8946]",
 glow: "shadow-[0_0_15px_rgba(206,137,70,0.4)]",
 },
 unranked: {
 border: theme === "dark" ? "border-zinc-700" : "border-zinc-200",
 text: "text-zinc-500",
 glow: "shadow-none",
 },
 default: {
 border: "border-none",
 text: theme === "dark" ? "text-white" : "text-zinc-500",
 glow: "shadow-none",
 },
 };
 const current = isUnranked
 ? styles.unranked
 : styles[rank] || styles.default;
 return (
 <span
 style={{ transform: `scale(${scale})` }}
 className={`inline-flex items-center justify-center rounded-full font-black tabular-nums tracking-tighter transition-all duration-300 shrink-0 ${dim} ${textClass} ${current.border} ${current.text} ${current.glow} ${isPodium ? "border-[3px] animate-subtle-pulse" : isUnranked ? "border-2" : "border-0"} ios-clip-fix`}
 >
 {rankNum}
 </span>
 );
 },
);



export const ASRListItem = React.memo(
 ({
 rank,
 title,
 subtitle,
 variant = "table",
 stats = [],
 columns = [],
 videoUrl,
 icon,
 onClick,
 badgeContent,
 shouldFade = false,
 flag,
 mapUrl,
 showVideoIcon = false,
 isUnclaimed = false,
 isCompact = false, onHover, isHighlighted,
 }: {
   rank?: string | number | null;
   title?: React.ReactNode;
   subtitle?: React.ReactNode;
   variant?: "table" | "card" | "hero";
   stats?: { value?: React.ReactNode }[];
   columns?: { isRank?: boolean; type?: string }[];
   videoUrl?: string | null;
   icon?: React.ReactNode;
   onClick?: (e?: React.MouseEvent | React.KeyboardEvent) => void;
   badgeContent?: React.ReactNode;
   shouldFade?: boolean;
   flag?: string | null;
   mapUrl?: string | null;
   showVideoIcon?: boolean;
   isUnclaimed?: boolean;
   isCompact?: boolean;
   onHover?: (isHovering: boolean) => void;
   isHighlighted?: boolean;
 }) => {
 const setPlayingVideoUrl = useAppStore((s) => s.setPlayingVideoUrl);
 const theme = useContext(ThemeContext);
 const accentColor = theme === "dark" ? "text-white" : "text-zinc-900";
 const tableHover =
 theme === "dark" 
 ? "hover:bg-white/[0.08]" 
 : "hover:bg-black/[0.05]";
 const cardHover =
 theme === "dark" 
 ? "hover:bg-white/5 hover:border-zinc-500/30 transition-colors duration-150" 
 : "hover:bg-black/5 hover:border-zinc-500/30 transition-colors duration-150";

 const getHighlightClass = () => {
   if (!isHighlighted) return "";
   return theme === "dark" ? "!bg-white/10 !ring-2 !ring-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.2)] !scale-[1.02] z-10 relative" : "!bg-black/5 !ring-2 !ring-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.2)] !scale-[1.02] z-10 relative";
 };
 const getTableHighlightClass = () => {
   if (!isHighlighted) return "";
   return theme === "dark" ? "!bg-white/[0.12] scale-[1.01] z-10 relative" : "!bg-zinc-900/5 scale-[1.01] z-10 relative";
 };

 const ItemWrapper: React.ElementType = 'div';

 if (variant === "table") {
 return (
 <ItemWrapper
 onClick={onClick}
 role={onClick ? "button" : undefined} 
 onMouseEnter={() => onHover && onHover(true)} 
 onMouseLeave={() => onHover && onHover(false)}
 onTouchStart={() => onHover && onHover(true)}
 onTouchEnd={() => onHover && onHover(false)}
 tabIndex={onClick ? 0 : undefined}
 onKeyDown={(e) => {
 if (onClick && (e.key === "Enter" || e.key === " ")) {
 e.preventDefault();
 onClick(e);
 }
 }}
 className={cn(
 "group flex items-center transition-all duration-300 ios-clip-fix py-5 sm:py-6 lg:py-8 px-0 outline-none w-full text-left",
 onClick
 ? `cursor-pointer active:scale-95 active:bg-zinc-500/10 hover:scale-[1.01] focus-visible:outline-none focus-visible:bg-zinc-500/5 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-zinc-500 rounded-xl ${tableHover}`
 : "cursor-default",
 getTableHighlightClass(),
 shouldFade ? "opacity-40 grayscale" : "opacity-100",
 )}
 >
 <div className="w-16 sm:w-24 lg:w-32 pl-3 sm:pl-10 lg:pl-12 shrink-0 flex items-center justify-center">
 {mapUrl ? (
 <a
 href={mapUrl}
 target="_blank"
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className={THEME.ICON_BUTTON(theme)}
 >
 <MapPin
 className="w-5 h-5 "
 strokeWidth={2.5}
 />
 </a>
 ) : (
 <div className="scale-100 sm:scale-125 lg:scale-150 origin-center">
 <ASRRankBadge rank={rank} />
 </div>
 )}
 </div>
 <div className="flex-1 flex min-w-0 h-full items-center">
 <div className="flex-1 flex flex-col min-w-0 pr-2 pl-2 sm:pl-8 lg:pl-10 text-left">
 <div
 className={cn(
 "flex items-center text-[11px] sm:text-[18px] lg:text-[24px] font-black uppercase leading-tight transition-colors max-w-full",
 onClick && !isUnclaimed ? "" : "",
 isUnclaimed
 ? theme === "dark"
 ? "text-zinc-300"
 : "text-zinc-600"
 : theme === "dark"
 ? "text-zinc-100"
 : "text-zinc-900",
 )}
 >
 <div className="truncate shrink">
 {flag && (
 <span className="mr-2 shrink-0">
 {formatFlagsWithSpace(flag)}
 </span>
 )}
 {title}
 </div>
 {badgeContent && (
 <div className="flex items-center gap-1.5 ml-2 shrink-0 scale-75 sm:scale-100 origin-left">
 {badgeContent}
 </div>
 )}
 </div>
 <div
 className={cn(
 "text-[9px] sm:text-[13px] lg:text-[16px] font-black uppercase block truncate mt-0.5 sm:mt-1 lg:mt-1 max-w-full",
 isUnclaimed
 ? theme === "dark"
 ? "text-zinc-600"
 : "text-zinc-400"
 : theme === "dark"
 ? "opacity-60 text-white"
 : "opacity-80 text-zinc-600",
 )}
 >
 {subtitle}
 </div>
 </div>
 {(stats || []).map((s: { value?: React.ReactNode }, idx: number) => {
 const colDef = columns?.filter(
 (c: { isRank?: boolean; type?: string }) => !c.isRank && c.type !== "profile",
 )[idx];
 return (
 <div
 key={idx}
 className={`${colDef?.width || "w-20 sm:w-24 lg:w-32"} px-1 sm:px-4 lg:px-6 flex items-center justify-end text-right shrink-0 h-full`}
 >
 <span
 className={cn(
 THEME.VALUE,
 "text-right transition-colors",
 idx === 0
 ? cn(
 "text-sm sm:text-[24px] lg:text-[32px] tracking-tight",
 s.value
 ? cn(accentColor, "")
 : "opacity-20",
 )
 : cn(
 "text-[10px] sm:text-[15px] lg:text-[19px] font-bold transition-colors",
 theme === "dark"
 ? "text-white/60"
 : "text-zinc-500",
 ),
 )}
 >
 {s.value || "--"}
 </span>
 </div>
 );
 })}
 </div>
 {showVideoIcon && (
 <div
 className={cn(
 "flex items-center justify-center shrink-0 w-10 pr-4 ml-2",
 )}
 >
 {videoUrl ? (
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 trackEvent("outbound_click", {
 link_url: videoUrl,
 link_type: "video",
 });
 setPlayingVideoUrl(videoUrl);
 }}
 className={THEME.ICON_BUTTON(theme)}
 >
 <Play
 className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] lg:w-[24px] lg:h-[24px]"
 strokeWidth={3}
 />
 </button>
 ) : (
 <div className="w-[16px] h-[16px] sm:w-[20px] sm:h-[20px] lg:w-[24px] lg:h-[24px]" />
 )}
 </div>
 )}
 </ItemWrapper>
 );
 }

 // Use the prop passed from ASRRankList

 return (
 <ItemWrapper
 onClick={isUnclaimed ? undefined : onClick}
 role={onClick && !isUnclaimed ? "button" : undefined} 
 onMouseEnter={() => onHover && onHover(true)} 
 onMouseLeave={() => onHover && onHover(false)}
 onTouchStart={() => onHover && onHover(true)}
 onTouchEnd={() => onHover && onHover(false)}
 tabIndex={onClick && !isUnclaimed ? 0 : undefined}
 onKeyDown={(e) => {
 if (onClick && !isUnclaimed && (e.key === "Enter" || e.key === " ")) {
 e.preventDefault();
 onClick(e);
 }
 }}
 className={cn(
 "group flex items-center justify-between transition-all duration-300 ios-clip-fix outline-none text-left w-full",
 isCompact
 ? "py-3 pl-3 pr-1.5 rounded-[1.25rem] border h-auto min-h-[64px]"
 : "py-3 sm:py-5 lg:py-6 pl-3 sm:pl-6 lg:pl-8 pr-1.5 sm:pr-4 rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] border h-auto min-h-[64px] sm:min-h-[80px] lg:min-h-[100px] ",
 onClick && !isUnclaimed
 ? `cursor-pointer active:scale-95 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 ${"theme-focus"} ${cardHover}`
 : "cursor-default",
 isUnclaimed
 ? cn(
 "border-dashed bg-transparent",
 theme === "dark" ? "border-white/10" : "border-black/10",
 )
 : THEME.CARD(theme),
 getHighlightClass(),
 shouldFade ? "opacity-40 grayscale" : "opacity-100",
 )}
 >
 <div
 className={cn(
 "flex items-center min-w-0 pr-1 flex-1",
 isCompact ? "gap-2" : "gap-2 sm:gap-4 lg:gap-6",
 )}
 >
 {icon ? (
 <div className={`p-0 rounded-xl transition-colors shrink-0`}>
 {icon}
 </div>
 ) : (
 <div className="w-10 sm:w-16 lg:w-20 shrink-0 flex items-center justify-center">
                  {mapUrl ? (
 <a
 href={mapUrl}
 target="_blank"
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className={THEME.ICON_BUTTON(theme)}
 >
 <MapPin
 className={cn("w-5 h-5", !isCompact && " sm:w-6 sm:h-6 lg:w-8 lg:h-8")}
 strokeWidth={2.5}
 />
 </a>
 ) : (
 <div className="scale-100 sm:scale-125 lg:scale-150 origin-center"><ASRRankBadge rank={rank} isUnclaimed={isUnclaimed} /></div>
 )}
 </div>
 )}
 <div className="flex flex-col min-w-0 text-left">
 <div
 className={cn(
 "flex items-center",
 isCompact ? "gap-1" : "gap-1 sm:gap-2",
 )}
 >
 <div
 className={cn(
 "flex items-center font-black uppercase whitespace-normal leading-tight transition-colors line-clamp-2",
 isCompact ? "text-[10px]" : "text-[10px] sm:text-[18px] lg:text-[22px]",
 onClick && !isUnclaimed ? "" : "",
 isUnclaimed
 ? theme === "dark"
 ? "text-zinc-300"
 : "text-zinc-600"
 : theme === "dark"
 ? "text-zinc-100"
 : "text-zinc-900",
 )}
 >
 <div className="line-clamp-2">
 {flag && (
 <span
 className={cn(
 "shrink-0",
 isCompact ? "mr-1" : "mr-1 ",
 )}
 >
 {formatFlagsWithSpace(flag)}
 </span>
 )}
 {title}
 </div>
 {badgeContent && (
 <div className="flex items-center gap-1 shrink-0 ml-1.5 scale-[0.65] origin-left">
 {badgeContent}
 </div>
 )}
 </div>
 </div>
 <div className="flex flex-col mt-0.5">
 <div
 className={cn(
 "font-black uppercase whitespace-normal break-words line-clamp-2",
 isCompact ? "text-[8px]" : "text-[8px] sm:text-[12px] lg:text-[16px]",
 isUnclaimed
 ? theme === "dark"
 ? "text-zinc-600"
 : "text-zinc-400"
 : theme === "dark"
 ? "opacity-60 text-white"
 : "opacity-80 text-zinc-600",
 )}
 >
 {subtitle}
 </div>
 </div>
 </div>
 </div>
 <div className="flex items-center pr-0 shrink-0 h-full">
 <div
 className={cn(
 "flex flex-col items-end justify-center text-right",
 isCompact ? "min-w-[50px]" : "min-w-[50px] sm:min-w-[80px] lg:min-w-[120px]",
 )}
 >
 {(stats || []).map((s: { value?: React.ReactNode }, idx: number) => (
 <span
 key={idx}
 className={cn(
 THEME.VALUE,
 "text-right transition-colors",
 idx === 0
 ? cn(
 isCompact ? "text-[13px]" : "text-[13px] sm:text-[24px] lg:text-[28px] tracking-tight",
 s.value
 ? cn(accentColor, "")
 : "opacity-20",
 )
 : theme === "dark"
 ? cn(
 "text-white/50",
 isCompact ? "text-[11px] font-bold" : "text-[11px] sm:text-[14px] lg:text-[18px] font-bold",
 )
 : cn(
 "text-zinc-500",
 isCompact ? "text-[11px] font-bold" : "text-[11px] sm:text-[14px] lg:text-[18px] font-bold",
 ),
 )}
 >
 {s.value || "--"}
 </span>
 ))}
 </div>
 {showVideoIcon && (
 <div
 className={cn(
 "flex items-center justify-center shrink-0 ml-2 sm:ml-3",
 isCompact ? "w-10" : "w-12",
 )}
 >
 {videoUrl ? (
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 trackEvent("outbound_click", {
 link_url: videoUrl,
 link_type: "video",
 });
 setPlayingVideoUrl(videoUrl);
 }}
 className={THEME.ICON_BUTTON(theme)}
 >
 <Play
 className={cn(
 "w-[20px] h-[20px]",
 !isCompact && " ",
 )}
 strokeWidth={3}
 />
 </button>
 ) : (
 <div
 className={cn(
 "w-[20px] h-[20px]",
 !isCompact && " ",
 )}
 />
 )}
 </div>
 )}
 </div>
 </ItemWrapper>
 );
 },
 (prev: Record<string, unknown>, next: Record<string, unknown>) => {
 if (prev.rank !== next.rank) return false;
 if (prev.title !== next.title) return false;
 if (prev.subtitle !== next.subtitle) return false;
 if (prev.variant !== next.variant) return false;
 if (prev.videoUrl !== next.videoUrl) return false;
 if (prev.flag !== next.flag) return false;
 if (prev.shouldFade !== next.shouldFade) return false;
 if (prev.isUnclaimed !== next.isUnclaimed) return false;
 if (prev.showVideoIcon !== next.showVideoIcon) return false;
 if (prev.mapUrl !== next.mapUrl) return false;
 if (prev.icon !== next.icon) return false;

 // Check array lengths
 if (prev.stats?.length !== next.stats?.length) return false;

 // Check specific stats recursively rather than shallow checking the new stats array
 for (let i = 0; i < (prev.stats?.length || 0); i++) {
 if (prev.stats[i]?.value !== next.stats[i]?.value) return false;
 if (prev.stats[i]?.label !== next.stats[i]?.label) return false;
 }

 return true;
 },
);
